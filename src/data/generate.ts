/**
 * The infinite dial — procedural channel generation.
 *
 * The 12 curated channels in channels.ts are hand-written. Every OTHER
 * positive integer on the dial is a real channel too: `generateChannel(n)`
 * deterministically conjures a full station (name, hosts, tagline, program
 * loop with timed captions, accents, category, music) from the number alone.
 *
 * Determinism matters: the same number always produces the exact same
 * station on every device, so generated channels can be shared via their
 * `inf-<n>` slugs just like curated ones. Generated channels borrow the
 * visual renderer + music bed of the curated channel in the same category
 * (`derivedFrom`) — they are "network family" affiliates — while all on-screen
 * text (segment titles, captions, speakers) comes from the generated data,
 * so every station still feels authored.
 *
 * This file is pure data + pure functions: no UI, no canvas, no React.
 */

import type { Beat, CategoryId, ChannelMeta, Segment, SfxName } from '../types'
import { hashString, mulberry32 } from '../lib/rng'
import { CHANNELS } from './channels'

/** Slug/id prefix for generated channels. Curated ids/slugs never match it. */
export const GEN_PREFIX = 'inf-'

export function generatedSlug(n: number): string {
  return `${GEN_PREFIX}${n}`
}

/** Parse an `inf-<n>` slug/id. Returns null for anything else (incl. n < 1). */
export function parseGeneratedSlug(slug: string): number | null {
  if (!slug.startsWith(GEN_PREFIX)) return null
  const rest = slug.slice(GEN_PREFIX.length)
  if (!/^\d+$/.test(rest)) return null
  const n = parseInt(rest, 10)
  return Number.isInteger(n) && n >= 1 ? n : null
}

// ───────────────────────────── shared banks ─────────────────────────────

const HOSTS = [
  'Zorpina Vex', 'Glarb McBlip', 'Chip Zeta', 'Dorpa', 'Blib Trundle', 'Vug-9',
  'Trug Molasses', 'Moxxi Fern', 'Plimp', 'Quib Dandelion', 'Fento Bubbles',
  'Yolanda-7', 'Grandpa Nebula', 'Skrunk', 'Pib & Pob', 'Wobbles',
]

const ADJS = [
  'mildly radioactive', 'aggressively beige', 'legally distinct', 'slightly damp',
  'suspiciously cheerful', 'deeply governmental', 'ceremonially dusty',
  'gently screaming', 'budget-approved', 'chronically triangular',
  'artisanally vacuum-sealed', 'quantum-adjacent',
]

const PREFIXES = [
  'Nebula', 'Quasar', 'Pulsar', 'Meteor', 'Aurora', 'Cosmic', 'Lunar', 'Solar',
  'Void', 'Comet', 'Kuiper', 'Andromeda', 'Supernova', 'Redshift', 'Parallax',
  'Zenith', 'Umbra', 'Halcyon', 'Meridian', 'Stardust',
]

const TIMES = ['morning', 'afternoon', 'evening', '3 a.m.']

const PALETTE = [
  '#22d3ee', '#f472b6', '#f59e0b', '#84cc16', '#a78bfa', '#38bdf8', '#fb7185',
  '#4ade80', '#e879f9', '#facc15', '#2dd4bf', '#c084fc', '#fca5a5', '#a3e635',
  '#60a5fa', '#f0abfc',
]

/** Valid sound-effect names, grouped by the vibe of each category. */
const SFX_BY_CATEGORY: Record<CategoryId, readonly SfxName[]> = {
  news: ['blip', 'beep', 'chime'],
  shopping: ['cash', 'sparkle', 'chime', 'beep'],
  weather: ['whoosh', 'warble', 'beep'],
  nature: ['sparkle', 'bubble'],
  court: ['gavel', 'thud', 'blip'],
  cooking: ['bubble', 'sparkle', 'chime'],
  sports: ['crowd', 'thud', 'zap'],
  ads: ['cash', 'zap', 'sparkle'],
  music: ['warble', 'sparkle'],
  documentary: ['beep', 'blip'],
  mystery: ['staticBurst', 'warble', 'beep'],
  community: ['crowd', 'chime', 'blip'],
}

// ─────────────────────────── per-category banks ───────────────────────────

interface CategoryBanks {
  suffixes: readonly string[]
  taglines: readonly string[]
  titleA: readonly string[]
  titleB: readonly string[]
  things: readonly string[]
  places: readonly string[]
  intro: readonly string[]
  mid: readonly string[]
  outro: readonly string[]
}

const BANKS: Record<CategoryId, CategoryBanks> = {
  news: {
    suffixes: ['News', 'Report', 'Network', 'Dispatch', 'Bulletin', 'Wire', 'Nightly', 'Desk'],
    taglines: [
      'All the {adj} news that fits through the wormhole.',
      'Breaking {thing} coverage, {num} hours a day, whether or not anything breaks.',
      'Independent journalism from a desk that is legally a spaceship.',
      'If it happened near {place}, we are already apologizing for missing it.',
    ],
    titleA: ['Morning', 'Midnight', 'Emergency', 'Lunchtime', 'Wormhole', 'Election', 'Comet', 'Weekend'],
    titleB: ['Meteor Roundup', 'Desk Meltdown', 'Traffic Fury', 'Probe Update', 'Polling Nebula', 'Gravity Report', 'Special Bulletin', 'Roundtable Shouting'],
    things: ['a rogue moon', 'the comet union', 'a sentient gas cloud', 'an unauthorized eclipse', 'the gravity inspector', 'a polite black hole', 'the moon census', 'Tuesday'],
    places: ['the Orion Bypass', 'Sector 7', 'downtown Europa', 'the Kuiper Belt', 'Crater City', 'the food court nebula'],
    intro: [
      'Good {time}, universe! You are watching {station}. I am {host}, and everything is fine, probably.',
      'This is {station}. I am {host}. Our top story tonight: {thing}. Our second story: also {thing}.',
      'Breaking news on {station} — {thing} has done it again, and legally we can say no more.',
      'You are watching {station} with {host}. Warning: today\'s broadcast is {adj}.',
      'Live from {place}, this is {station}. The lights flickered twice during sign-on, which is tradition.',
    ],
    mid: [
      'Our correspondent near {place} reports the situation is, quote, "shaped like a situation."',
      'Experts confirm {thing} is {adj}, which explains so much.',
      '{co} joins us now with a chart. The chart is on fire. The chart says this is fine.',
      'In local news: {place} has voted to remain {adj}. Turnout was {num} percent of a guess.',
      'We asked {num} citizens about {thing}. All {num} of them left the room.',
      '{co}: "I have seen {thing} before, and I will not sleep until it is someone else\'s problem."',
      'Analysts say {thing} could affect the price of oxygen for weeks.',
      'This just in: nothing new has happened, but it happened {num} percent faster.',
    ],
    outro: [
      'That is the broadcast. From all of us at {station}: stay curious, stay {adj}, goodnight.',
      'We now return you to regularly scheduled static. Goodnight, {place}.',
      'I am {host}. Thank you for watching {station}. Please do not adjust your moon.',
    ],
  },
  shopping: {
    suffixes: ['Shopping', 'Deals', 'Bazaar', 'Marketplace', 'Clearance', 'Emporium', 'Outlet', 'Boutique'],
    taglines: [
      'Impossible products. Fictional prices. {num} percent off nothing, forever.',
      'Everything must go, including our {adj} sense of shame.',
      'Serving the galaxy since roughly {num} minutes ago.',
      'If you can dream it, we cannot sell it, but we will describe it loudly.',
    ],
    titleA: ['Insta', 'Mega', 'Turbo', 'Deluxe', 'Gently Used', 'Quantum', 'Family Size', 'Ultimate'],
    titleB: ['Black Hole Kit', 'Gravity Blanket', 'Star Jar', 'Comet Polisher', 'Moon Lamp', 'Nebula Diffuser', 'Void Slippers', 'Meteor Wok'],
    things: ['the Insta–Black Hole Kit', 'a jar of spare stars', 'self-folding pajamas', 'a comet with a warranty', 'the Moonvac Pro', 'an elevator to the basement of space', 'disappointment, scented'],
    places: ['the warehouse at the edge of time', 'Aisle Infinity', 'the returns desk', 'the parking nebula', 'Checkout 7'],
    intro: [
      'WELCOME BACK to {station}! I am {host}, and the deals today are {adj}!',
      'Do not touch that dial — touch your wallet, which is safe, because nothing here is real. {station}!',
      'Friends, the galaxy has never seen deals like this, mainly because we invent them hourly. {station}!',
      'It is {time} somewhere, which means it is SHOPPING {time}. Welcome to {station}!',
      'I am {host}, live from {place}, standing on — and I cannot stress this enough — merchandise.',
    ],
    mid: [
      'Look at this: {thing}! It slices, it dices, it is {adj} — do NOT ask how.',
      'Today only: {thing}, for {num} easy payments of "you have got to be kidding."',
      'This {thing} once belonged to a star. The star is fine. The star is doing great.',
      'Call in the next {num} minutes and we throw in a SECOND {thing}. It is the same one. Do not tell anyone.',
      'WARNING: {thing} may cause confidence, swagger, and mild orbit disruption.',
      'Our operator {co} has been standing by so long they evolved a second coffee cup.',
      'I am not saying {thing} will change your life. I am saying it changed MY week, financially, badly.',
      'The {adj} version is only {num} Zorbucks more, and it screams less.',
    ],
    outro: [
      'Operators are standing by in all {num} dimensions. This is {station} — buy nothing, dream big!',
      'Remember: every product on {station} is imaginary, which is the only honest kind of free shipping.',
      'I am {host}. Stay solvent out there!',
    ],
  },
  weather: {
    suffixes: ['Weather', 'Forecast', 'Skies', 'Stormwatch', 'Atmosphere', 'Climate Desk', 'Barometer', 'Weatherline'],
    taglines: [
      'Weather so local, it is mostly about {place}.',
      'The forecast is {adj}, with a {num} percent chance of more weather.',
      'We predict everything, eventually, retroactively.',
      'Rain, shine, or {thing} — we will describe it with confidence.',
    ],
    titleA: ['Today\'s', 'Tonight\'s', 'Weekend', 'Hourly', 'Five-Day', 'Emergency', 'Morning', 'Evening'],
    titleB: ['Sky Report', 'Storm Warning', 'Gravity Outlook', 'Cloud Census', 'Moisture Update', 'Void Front', 'Sunspot Summary', 'Wind Situation'],
    things: ['a cloud with opinions', 'sideways rain', 'hail the size of accountability', 'a polite tornado', 'fog with subtext', 'inverse sunshine'],
    places: ['the temperate zone', 'the moist hemisphere', 'Low Pressure Valley', 'the Cloud District', 'the Ionosphere', 'the sidewalk'],
    intro: [
      'Good {time} and welcome to {station}! I am {host}, and yes, the sky is doing it again.',
      'I am {host} with {station}. Today\'s weather brought to you by {thing}.',
      'This is {station}, coming to you from {place}, where the air is {adj} but holding it together.',
      'Welcome back to {station}. Quick heads-up: the sky over {place} is now considered "load-bearing."',
      '{time} forecast from {station}: expect weather.',
    ],
    mid: [
      'Over {place} we are tracking {thing}, moving at a casual {num} knots of pure mood.',
      'Skies remain {adj} until roughly the moment you make plans.',
      'There is a {num} percent chance of {thing}. I have seen the models. The models have seen things.',
      '{co} is live in {place}, where it is, quote, "wet in a new way."',
      'Tonight: clear skies, followed by sky, followed by {thing} after midnight.',
      'Pressure is falling, rising, and somewhere over {place}, doing both out of spite.',
      'If you look up right now you will see {thing}. Do not look directly at it for legal reasons.',
      'The five-day forecast is: weather, weather, {thing}, weather, and a personal day.',
    ],
    outro: [
      'That is your forecast. From all of us at {station}: dress in layers, emotionally.',
      'I am {host}. Stay dry out there — or at least stay interesting.',
      'Next on {station}: the long-term outlook for {thing}, which is honestly none of our business.',
    ],
  },
  nature: {
    suffixes: ['Nature', 'Wildlife', 'Wilderness', 'Habitat', 'Biosphere', 'Expedition', 'Fauna', 'Outdoors'],
    taglines: [
      'The universe, unfiltered and {adj}.',
      'Documenting {thing} in its natural habitat: on television.',
      'No animals were harmed. Several were mildly inconvenienced.',
      'Filmed entirely on location, near {place}.',
    ],
    titleA: ['Silent', 'Hidden', 'Frozen', 'Endless', 'Secret', 'Great', 'Lost', 'Wandering'],
    titleB: ['World of Vapors', 'Migration of the Moons', 'Cycle of the Swarm', 'Canyons of Ice', 'Gardens of Gas', 'Reef of Stars', 'Plains of Dust', 'Roots of the Void'],
    things: ['the greater speckled vaporworm', 'a moon jelly migration', 'the ice badger', 'glacier plankton', 'the whispering kelp', 'a nebula coral reef'],
    places: ['the Vapor Sea', 'the Ice Shelves of Sector 9', 'the Dust Plains', 'the Kelp Nebula', 'the Whispering Caves', 'the Shallow Sky'],
    intro: [
      'Here, at the edge of {place}, life finds a way — then loses it, then finds it again. {station}.',
      'Welcome to {station}. Tonight: {thing}, in stunning proximity.',
      'In the {adj} wilds of {place}, everything is either hunting or apologizing.',
      '{station}. Filmed over {num} years, edited over one very long weekend.',
      'Dawn over {place}. Somewhere below, {thing} is already awake and being dramatic.',
    ],
    mid: [
      '{thing} emerges only at dusk, wearing the night like a {adj} coat.',
      'The swarm moves as one — {num} thousand minds, zero meetings.',
      'Life here survives on almost nothing: thin light, thinner soil, and pure spite.',
      'A rare moment: {thing}, completely still, thinking about lunch.',
      'In this ecosystem, {thing} is both the predator and, regrettably, the dessert.',
      'Seasons here last {num} years, so autumn is mostly a rumor.',
      'The camera captured {thing} at {place} — behavior never filmed, mostly because it is rude.',
      'Nature does not hurry, and yet everything at {place} is somehow already finished.',
    ],
    outro: [
      'The cycle continues at {place}, with or without our narration. Goodnight from {station}.',
      'Next week on {station}: {thing}, up close, possibly too close.',
      'We leave the wild as we found it: {adj} and unbothered.',
    ],
  },
  court: {
    suffixes: ['Court', 'Justice', 'Tribunal', 'Verdict', 'Docket', 'Arbitration', 'Hearings', 'Chambers'],
    taglines: [
      'Justice, but make it space. Order in the {adj} court!',
      'One judge. Two lawyers. {num} counts of nonsense.',
      'The only court where the jury is literally out — near {place}.',
      'All rise: the honorable proceedings of {station}.',
    ],
    titleA: ['The People vs.', 'In Re:', 'The Case of', 'State vs.', 'Class Action:', 'The Matter of', 'Appeal of', 'Estate of'],
    titleB: ['a Stolen Moon', 'Gravity Fraud', 'the Haunted Deposition', 'Space Parking', 'Custody of a Comet', 'Illegal Eclipse', 'the Yelling Clause', 'Moon Rights'],
    things: ['a stolen moon', 'the yelling clause', 'an illegal eclipse', 'gravity fraud', 'a very sworn affidavit', 'the gavel (sentient)'],
    places: ['Courtroom 7', 'the Hall of Justice-Adjacent Outcomes', 'the orbital courthouse', 'the judge\'s chambers', 'the appeals annex'],
    intro: [
      'All rise! The Honorable {host} presiding. This is {station}, live from {place}.',
      'Court is now in session. {station}: where {thing} finally answers for itself.',
      'Direct from {place}, this is {station}. Today\'s docket: {thing}, and boy, is it docketed.',
      'You are watching {station}. The charges are read, the jury is fed, the gavel is {adj}.',
      '{station}, live from {place}: constitutional law, but the constitution is a rumor.',
    ],
    mid: [
      'Objection! Sustained! Overruled! Everyone sits down confused — order restored.',
      'The witness, {thing}, has been sworn in and immediately started perjuring itself.',
      'Defense argues the alleged {thing} was, quote, "basically fine if you think about it."',
      'The jury, sequestered near {place}, has developed a {adj} group accent.',
      'Exhibit {num}: {thing}. The prosecution rests, theatrically.',
      'Counsel approaches the bench. The bench, sensibly, backs away.',
      'We now enter closing arguments, which are just the opening arguments, louder.',
      'A hush falls over {place} as the verdict arrives: {num} counts of "sure, why not."',
    ],
    outro: [
      'Court is adjourned. Justice was served, or at least catered. This is {station}.',
      'The gavel falls. {station} returns after these messages, legally speaking.',
      'From {place}, goodnight. Sleep well — {thing} is in custody, allegedly.',
    ],
  },
  cooking: {
    suffixes: ['Kitchen', 'Cooking', 'Cuisine', 'Recipes', 'Banquet', 'Pantry', 'Table', 'Eats'],
    taglines: [
      'Cooking across the cosmos, one {adj} ingredient at a time.',
      'If you can eat it, we can overthink it.',
      'Recipes with {num} steps and zero regrets (regrets sold separately).',
      'Today\'s special: {thing}, flambéed by accident.',
    ],
    titleA: ['One-Pan', 'Zero-Gravity', 'Midnight', 'Grandma\'s', 'Fusion', 'Meal-Prep', 'Slow-Cooked', 'Street-Food'],
    titleB: ['Nebula Noodles', 'Comet Casserole', 'Void Dumplings', 'Star Soup', 'Meteor Meatloaf', 'Gravity Galette', 'Moon Macarons', 'Plasma Paella'],
    things: ['star anise (an actual star)', 'moon flour', 'comet pepper', 'the last egg in the galaxy', 'a sentient sourdough starter', 'butter, imported from physics'],
    places: ['the galley', 'the zero-G kitchen', 'Grandpa Nebula\'s kitchen', 'the food court nebula', 'the tasting nook'],
    intro: [
      'Welcome to {station}, live from {place}! I am {host}, and today we cook {adj} things with confidence.',
      'I am {host}, and on today\'s {station}: {thing} — the dish that made my editor cry (happy, probably).',
      'Hello and welcome back to {station}, filmed in one take because {place} only lets us in once.',
      '{time} on {station} means one thing: {thing}, but with butter. Everything is better with butter.',
      'Today on {station}, we attempt {thing}. The fire extinguisher is my sous-chef.',
    ],
    mid: [
      'First, prepare your {thing}. Whisper to it. It helps. Science is looking away.',
      'Fold gently — {num} times, or until the batter files a complaint.',
      'In {place}, we say: if it sizzles, it is legal.',
      'A pinch of comet pepper. Not a fistful. We have discussed this.',
      'The sauce should coat the spoon, or at least apologize to it.',
      'While that reduces, let me tell you about my mentor, a {adj} wok.',
      'Taste test! ... It needs salt, courage, and possibly a lawyer.',
      'Presentation matters: plate it like {thing} is the only guest at the party.',
    ],
    outro: [
      'Plate, garnish, serve. From {place}, bon appétit — this has been {station}.',
      'That is all the time we have. The oven and I thank you. Goodnight from {station}!',
      'The recipe is on our website, which is also just static. Happy cooking from {station}!',
    ],
  },
  sports: {
    suffixes: ['Sports', 'Athletics', 'Games', 'League', 'Matches', 'Court-side', 'Tournament', 'Playbook'],
    taglines: [
      'All {thing}, all the time, at {num} frames per emotion.',
      'Two teams enter. One scoreboard leaves. Both are confused.',
      'Broadcasting from the cheap seats at {place}.',
      'Coverage so complete, even the benches get tired.',
    ],
    titleA: ['Regionals:', 'Playoffs:', 'Exhibition:', 'Finals:', 'Rivalry Night:', 'Overtime:', 'Draft Night:', 'Away Game:'],
    titleB: ['Meteor Ball', 'Zero-G Hockey', 'Comet Racing', 'Asteroid Curling', 'Gravity League', 'Moon Wrestling', 'Nebula Polo', 'Void Volleyball'],
    things: ['the gravity league', 'the meteor ball final', 'a rookie comet', 'the league\'s only referee', 'the mascot (a moon)', 'overtime, again'],
    places: ['Crater Stadium', 'the Orbital Arena', 'the Dust Bowl', 'Nebula Field', 'the low-grav gym', 'the parking-lot courts'],
    intro: [
      'LIVE from {place}, this is {station}! I am {host}, joined by {co}, and we are ready for {thing}.',
      'Welcome to {station}, where the score is made up and the points DO matter, legally.',
      '{time} showdown on {station}: {thing}. The crowd at {place} is {adj} and fully hydrated.',
      'You are watching {station}. Both teams have warmed up; the crowd has over-warmed.',
      'From {place}, it is game day. I have not been this excited since {num} seconds ago.',
    ],
    mid: [
      'And {thing} takes the lead with a move physicists are calling "rude."',
      'The replay shows it clearly: {num} steps, no fouls, one small crime.',
      '{co}: "You hate to see it. You love to see it. You are allowed both."',
      'Injury timeout: a player at {place} has twisted an orbit. He walks it off, sideways.',
      'The crowd is on their feet — mainly because the seats at {place} walked away.',
      'A strategic swap: {thing} comes in fresh, and immediately {adj}.',
      'Down to the wire! The score: {num} to {num}, plus one shoe.',
      'Overtime rules here are simple: whoever explains them loses.',
    ],
    outro: [
      'FINAL: a scoreboard. A triumph for {place} and a lesson for everyone. Goodnight from {station}.',
      'That is the game. {station} will be back after everyone calms down.',
      'From all of us at {station}: stay hydrated, stay {adj}, and blame the referee.',
    ],
  },
  ads: {
    suffixes: ['Commercials', 'Ad Break', 'Sponsorships', 'Infomercials', 'Promotions', 'Interstitial', 'Bumper', 'Advert'],
    taglines: [
      'The ads are the show. The show is also ads. It is ads all the way down.',
      'Sponsored by nothing, for everybody, since {num} minutes ago.',
      'A {adj} parade of products that do not exist.',
      'Please enjoy these messages from the sponsors in our hearts.',
    ],
    titleA: ['Ad:', 'Now Available:', 'New From:', 'Ask Your Doctor About:', 'For a Limited Time:', 'Act Now:', 'Coming Soon:', 'Do Not Miss:'],
    titleB: ['Moon Insurance', 'Rocket Fuel Chews', 'Nebula Cologne', 'Levitation Slippers', 'Comet Coverage', 'Astro Yogurt', 'Gravity Warranties', 'Star Polish'],
    things: ['Moon Insurance (we cover craters)', 'Astro Yogurt (now with less space)', 'Levitation Slippers (result: floating)', 'Nebula Cologne (attract a nebula)', 'a gravity warranty', 'the Value Comet'],
    places: ['your kitchen', 'the marketplace of ideas', 'a dimly lit showroom', 'the sponsor dimension', 'an airport in space'],
    intro: [
      'Hi, {host} here. Do YOU suffer from not owning {thing}? {station} can help.',
      'We interrupt this broadcast for {station}: {num} seconds of pure product energy.',
      'Hi there. I was YOU once — before {thing}. Watch this. Please. Watch this.',
      'From the sponsor dimension, it is {station}, with an offer so {adj} it should be illegal.',
      'Are you tired? Of anything? Then you need {thing}. More on that after these words I am saying.',
    ],
    mid: [
      '{thing} fits in your home, your hovercar, and most legally defined purses.',
      'Nine out of {num} doctors agree: this ad is {adj}.',
      'But wait — there is more. There is ALWAYS more. That is the deal with more.',
      'Testimonial: "I tried {thing} and my landlord finally respects me." — {co}, {place}',
      'Available in Midnight, Midnighter, and "Oops, All Void."',
      'Side effects may include: confidence, levitation, and {adj} dreams.',
      'Order in the next {num} minutes and we include a second, worse one, free.',
      '{thing}: because the galaxy is cold and shipping is technically free.',
    ],
    outro: [
      '{station}: paid for by nobody, believed by everyone.',
      'We now return you to your program, which was also kind of an ad.',
      '{thing} — ask for it by name, while supplies (do not) last.',
    ],
  },
  music: {
    suffixes: ['Radio', 'FM', 'Frequencies', 'Broadcast', 'Static', 'Waves', 'Airwaves', 'Hi-Fi'],
    taglines: [
      'All {adj} sounds, all night, from the far end of the dial.',
      'Now broadcasting {num} percent fewer commercials than anyone, ever.',
      'Your captain of the airwaves, live from {place}.',
      'If it hums, orbits, or vibrates, it is on {station}.',
    ],
    titleA: ['Late Night', 'Drive Time', 'After Hours', 'Request Line', 'Deep Cuts', 'Static Hour', 'Sunrise', 'Overnight'],
    titleB: ['Nebula Sessions', 'Comet Classics', 'Void Jazz', 'Gravity Grooves', 'Cosmic Lullabies', 'Pulsar Pulse', 'Moonlit Frequencies', 'Space Diner Jukebox'],
    things: ['void jazz', 'the hum of a passing satellite', 'gravity grooves', 'a song about {place}', 'cosmic lullabies', 'the request line'],
    places: ['the ionosphere', 'the long midnight', 'a diner at the end of the dial', 'the slow orbit', 'the deep frequencies'],
    intro: [
      'You are tuned to {station}, riding the {adj} end of the dial. I am {host}. Stay a while.',
      'Good {time}, deep space. This is {station}, broadcasting from {place} to whoever is out there.',
      'This is {host} on {station}. The signal is weak, the vibes are {adj}, and the night is long.',
      'From {place}, {station} fades in with {thing} and no particular plan.',
      'Static, then music, then me: {host}, your captain on {station}, frequency {num}.{num}.',
    ],
    mid: [
      'That was {thing}, dedicated to {place}, from a listener who declined to be named.',
      'Up next: {thing}. Turn it up. The neighbors are planets; they are far.',
      'The request line is open. It has been open since {num}. Nobody has called. I am fine.',
      'This next one goes out to everyone orbiting something tonight. So: everyone.',
      'A listener writes: "your station saved my life." Legally, we cannot confirm that. Here is {thing}.',
      'Chart update: {thing} is number {num}, up from number {num}, which is also its position.',
      'The night shift at {place} keeps this frequency on. Hello, night shift.',
      'Somewhere out there, {thing} is playing in a ship with the lights off. This one is for them.',
    ],
    outro: [
      'The frequency fades, but never fully. This is {host} on {station}, signing off.',
      'Stay tuned, stay tuned IN. {station} will be right back after some hum.',
      'Goodnight, deep space. Keep your dial {adj} and your antenna kinder. — {station}',
    ],
  },
  documentary: {
    suffixes: ['Explains', 'Documentaries', 'Archive', 'Institute', 'Discovery', 'Explorations', 'Files', 'Society'],
    taglines: [
      'Earth, explained patiently, incorrectly, and with slides.',
      'Our researchers have never been to Earth. This has not slowed us down.',
      '{num} years of scholarship, none of it near Earth.',
      'Everything you know about Earth is wrong, and we have a {adj} chart.',
    ],
    titleA: ['Understanding', 'The Secret Life of', 'Field Notes on', 'Decoding', 'The Truth About', 'Reconsidering', 'A Brief History of', 'Further Studies on'],
    titleB: ['Earth Moisture', 'Earth Sandwiches', 'Human Commuting', 'the Human Skeleton', 'Earth Weather', 'Earth Currency (Paper?)', 'Human Sleep', 'Earth Birds'],
    things: ['the human skeleton', 'earth weather', 'human commuting', 'earth sandwiches', 'the moon (probably)', 'human sleep'],
    places: ['the Institute', 'the archives', 'the observation deck', 'the lecture hall', 'the galley chalkboard'],
    intro: [
      'Greetings, scholars. This is {station}, where tonight we examine {thing} — with rigor, and without visas.',
      'From {place}, {station} presents: {thing}, the final lecture in a series of incorrect ones.',
      'I am {host}, Dean of Earth Studies at {station}. Tonight: {thing}. The chalk is ready. The facts are not.',
      '{station} continues its Earth series. Previously: "Earth: Wet?" Tonight: {thing}.',
      'Welcome to {place}. Do not touch the exhibits. This is {station}.',
    ],
    mid: [
      'Earth humans "commute" — a ritual migration, twice daily, {adj} and full of sighing.',
      'Note the diagram: {thing}, as described by a trader who saw Earth once, from far away.',
      'Earth\'s "sandwich" is a food, a weapon, and a unit of measurement. Sometimes all at once.',
      'Our lead researcher believes {thing} is seasonal. She has believed this for {num} years.',
      'The Earth "moon" is widely regarded by Earth scholars as "up there." Compelling.',
      'Humans sleep {num} hours a night, which explains their poetry and nothing else.',
      'Cross-reference confirms: {thing} appears in the archives {num} times, always in pencil.',
      'In conclusion, Earth remains {adj}, and we remain committed, and these are different things.',
    ],
    outro: [
      'Until next lecture, scholars: stay curious, stay funded, stay away from Earth. — {station}',
      'The archives close. {station} thanks you for your attention and your patience, in that order.',
      'Next time on {station}: {thing} — revisited, re-litigated, and re-chalked.',
    ],
  },
  mystery: {
    suffixes: ['Mysteries', 'Anomalies', 'Investigations', 'Phenomena', 'Unknown', 'Signals', 'Watchers', 'Static'],
    taglines: [
      'Something is broadcasting. We are not sure what. We are sure it is {adj}.',
      'The signals started {num} years ago. They have not stopped. Neither have we.',
      'Between the channels, there is a channel. This is it.',
      'Do not adjust your set. It is adjusting you.',
    ],
    titleA: ['Signal', 'Transmission', 'Tape', 'Playback', 'Frequency', 'Static', 'Recovery', 'Case File'],
    titleB: [' from the Void', ' from Deck 9', ' Nobody Sent', ' at the Edge', ' from Yesterday', ' from Room 12', ' from the Deep', ' that Returned'],
    things: ['a signal nobody sent', 'a door on Deck 9', 'the transmission from yesterday', 'a knock from inside the TV', 'a light in the dust', 'a voice counting down'],
    places: ['Deck 9', 'the long dark', 'the old relay station', 'the edge of the map', 'Room 12', 'the unlit corridor'],
    intro: [
      'This is {station}. What you are about to see was recovered from {place}. We are still not okay.',
      'The following signal reached us {num} hours ago, from {place}, where nothing is.',
      'Do not adjust your set. The set is fine. It is everything else that is {adj}.',
      'Case file open. Location: {place}. Contents: {thing}. Status: unresolved.',
      'If you are hearing this, the broadcast found you. It does that. This is {station}.',
    ],
    mid: [
      'Playback, enhanced: {thing}, clearer now. We did not want clearer.',
      'The timestamp on {thing} is from next week. We are choosing not to discuss that.',
      '{co} reviewed the tape and returned it with a note: "no."',
      'There are {num} seconds of silence on the recording. Nothing is in them. Nothing is IN them.',
      'The signal repeats every {num} minutes. It is not impatient. It is patient. That is worse.',
      'We traced {thing} to {place}. {place} was not there.',
      'Listen closely: beneath the static, {thing}. Beneath that — breathing. This station has no crew.',
      'We asked the archive about {place}. The archive asked us to leave.',
    ],
    outro: [
      'Signal lost. Or set down gently. This is {station}. Leave the light on.',
      'The file remains open, as does {place}. Goodnight, if it is still night. — {station}',
      'We will keep listening. That is the whole job now. {station}, out.',
    ],
  },
  community: {
    suffixes: ['Access', 'Community', 'Bulletin', 'Local', 'Neighborhood', 'Public', 'Civic', 'Town Square'],
    taglines: [
      'By the crater, for the crater, since roughly {num} eruptions ago.',
      'Local programming with {num} percent more potluck coverage.',
      'Your town, your station, our cassette deck.',
      'Funded entirely by bake sales and one extremely committed viewer.',
    ],
    titleA: ['Community', 'Neighborhood', 'Crater', 'Town', 'Public', 'Volunteer', 'Annual', 'Local'],
    titleB: ['Bulletin Board', 'Potluck Coverage', 'Streetlight Report', 'Talent Night', 'Recycling Update', 'Heritage Festival', 'Lost & Found', 'Debate Night'],
    things: ['the streetlight that points at the sky', 'Kevin', 'the annual potluck', 'one (1) small moon', 'the crater bake sale', 'the community garden (aggressive)'],
    places: ['the crater', 'the community hall', 'the swap meet', 'the co-op', 'the bandstand', 'the gazebo'],
    intro: [
      'Good evening, neighbors! This is {station}, live from {place}, where the chairs fold and so do we.',
      'Hi, I am {host}, and this is {station}. Tonight: everything the gazette could not print, because it is a rock.',
      'Welcome to {station}, recorded before a live studio audience of {num} people and one emotional support moon.',
      'From {place}, it is your community update. The punch will be served after the budget report.',
      'Hello, crater! {station} here. The numbers are in, the casserole is out, and the streetlight is up to something.',
    ],
    mid: [
      'REMINDER: the potluck is Thursday. Label your dishes. LABEL. YOUR. DISHES.',
      'SHOUT-OUT to {co} for fixing the streetlight. It only points at the sky now, but that is progress!',
      'LOST: {thing}. Last seen near {place}. Reward: a casserole, emotionally.',
      'The recycling committee reports the cans are, quote, "organized, but angry."',
      'Public works confirmed the pothole on Main is now a civic landmark. There will be a plaque.',
      'The talent night sign-up sheet is full. The talent is {adj}. The night will be long.',
      'In memoriam: the town gazebo, which is fine, but we are practicing just in case.',
      'And finally: {thing} has been returned to {place}. Nobody is pressing charges. Everybody is telling stories.',
    ],
    outro: [
      'That is the bulletin, neighbors. See you at the potluck. This has been {station}.',
      'From all of us at {place}: goodnight, and label your dishes. — {station}',
      'Next week: the festival! This week: recovery. {station}, signing off.',
    ],
  },
}

// ───────────────────────────── generation ─────────────────────────────

const CATEGORY_IDS = Object.keys(BANKS) as CategoryId[]

/** The curated channel for each category — generated channels borrow its
 *  renderer (via derivedFrom) and music bed. */
const TEMPLATE_BY_CATEGORY = new Map<CategoryId, ChannelMeta>(
  CHANNELS.map((c) => [c.category, c] as const),
)

/** Pick from an array using a mulberry32 stream (stable within one channel). */
function pickFrom<T>(rng: () => number, arr: readonly T[]): T {
  return arr[Math.floor(rng() * arr.length) % arr.length]
}

/** Take `count` distinct items from an array (or fewer if it is too small),
 *  order stable-ish but seeded. */
function sampleDistinct<T>(rng: () => number, arr: readonly T[], count: number): T[] {
  const pool = [...arr]
  const out: T[] = []
  while (out.length < count && pool.length > 0) {
    out.push(pool.splice(Math.floor(rng() * pool.length), 1)[0])
  }
  return out
}

function randomNumber(rng: () => number): number {
  return 2 + Math.floor(rng() * 997)
}

/** Fill `{slot}` tokens in a template. Unknown slots are left alone. */
function fill(
  template: string,
  vars: Record<string, string | (() => string)>,
): string {
  return template.replace(/\{(\w+)\}/g, (whole, key: string) => {
    const v = vars[key]
    if (v === undefined) return whole
    return typeof v === 'function' ? v() : v
  })
}

/**
 * Purely generate the channel for a dial number that no curated channel
 * uses. Same number in, same station out — always, everywhere.
 */
export function generateChannel(n: number): ChannelMeta {
  if (!Number.isInteger(n) || n < 1) {
    throw new Error(`generateChannel: invalid dial number ${n}`)
  }
  const rng = mulberry32(hashString(`${GEN_PREFIX}${n}`))
  const category = pickFrom(rng, CATEGORY_IDS)
  const bank = BANKS[category]
  const template = TEMPLATE_BY_CATEGORY.get(category) ?? CHANNELS[0]

  const host = pickFrom(rng, HOSTS)
  let co = pickFrom(rng, HOSTS)
  if (co === host) co = HOSTS[(HOSTS.indexOf(co) + 7) % HOSTS.length]

  const prefix = pickFrom(rng, PREFIXES)
  const suffix = pickFrom(rng, bank.suffixes)
  const station = `${prefix} ${suffix}${rng() < 0.45 ? ` ${n}` : ''}`
  const logoText = `${prefix[0]}${suffix[0]}${n}`.slice(0, 6).toUpperCase()

  const tagline = fill(pickFrom(rng, bank.taglines), {
    thing: () => pickFrom(rng, bank.things),
    place: () => pickFrom(rng, bank.places),
    adj: () => pickFrom(rng, ADJS),
    num: () => String(randomNumber(rng)),
  })

  const segCount = 3 + (rng() < 0.45 ? 1 : 0)
  const titles = new Set<string>()
  const intros = sampleDistinct(rng, bank.intro, segCount)
  const segments: Segment[] = []

  for (let i = 0; i < segCount; i++) {
    // distinct segment title per channel (63+ combos available, ≤ 4 needed)
    let title = `${pickFrom(rng, bank.titleA)} ${pickFrom(rng, bank.titleB)}`
    for (let tries = 0; titles.has(title) && tries < 8; tries++) {
      title = `${pickFrom(rng, bank.titleA)} ${pickFrom(rng, bank.titleB)}`
    }
    if (titles.has(title)) title = `${title} ${i + 1}`
    titles.add(title)

    const duration = 40 + Math.floor(rng() * 9) // 40..48s
    const mids = sampleDistinct(rng, bank.mid, 3)
    const templates = [intros[i], mids[0], mids[1], mids[2], pickFrom(rng, bank.outro)]
    const beatTimes = [0, 8, 16, 24, 32]
    const beats: Beat[] = templates.map((tpl, bi) => ({
      t: beatTimes[bi],
      caption: fill(tpl, {
        station,
        host,
        co,
        thing: () => pickFrom(rng, bank.things),
        place: () => pickFrom(rng, bank.places),
        adj: () => pickFrom(rng, ADJS),
        time: () => pickFrom(rng, TIMES),
        num: () => String(randomNumber(rng)),
      }),
      speaker: rng() < 0.82 ? (bi % 3 === 2 && rng() < 0.4 ? co : host) : undefined,
      sfx: rng() < 0.62 ? pickFrom(rng, SFX_BY_CATEGORY[category]) : undefined,
    }))

    segments.push({ id: `inf-${n}-seg-${i + 1}`, title, duration, beats })
  }

  let accent = pickFrom(rng, PALETTE)
  let accent2 = pickFrom(rng, PALETTE)
  if (accent2 === accent) accent2 = PALETTE[(PALETTE.indexOf(accent) + 5) % PALETTE.length]

  return {
    id: generatedSlug(n),
    slug: generatedSlug(n),
    number: n,
    name: station,
    logoText,
    tagline,
    category,
    accent,
    accent2,
    segments,
    music: template.music,
    derivedFrom: template.id,
  }
}

// ────────────────────────── resolve + cache ──────────────────────────

const CACHE_LIMIT = 512
const cache = new Map<number, ChannelMeta>()

/** Cached variant of generateChannel — generated channels are tiny, but the
 *  dial may hop quickly, and identity stability keeps React re-renders cheap. */
export function getGeneratedChannel(n: number): ChannelMeta {
  const hit = cache.get(n)
  if (hit) return hit
  const ch = generateChannel(n)
  cache.set(n, ch)
  if (cache.size > CACHE_LIMIT) {
    // evict the oldest entry (Map preserves insertion order)
    const oldest = cache.keys().next().value
    if (oldest !== undefined) cache.delete(oldest)
  }
  return ch
}
