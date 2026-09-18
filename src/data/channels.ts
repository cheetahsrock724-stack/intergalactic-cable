/**
 * Channel metadata + authored program content.
 *
 * This file is pure data: no UI, no canvas, no React. Each channel has a
 * fixed loop of segments; each segment has timed beats (captions/dialogue
 * + optional SFX). Renderers in src/channels/ read this plus their own
 * visual content tables.
 *
 * To add a channel: append metadata here, write a renderer in src/channels/,
 * and register it in src/channels/index.ts.
 */

import type { Beat, Category, ChannelMeta, Segment } from '../types'

export const CATEGORIES: Category[] = [
  { id: 'news', label: 'News' },
  { id: 'shopping', label: 'Shopping' },
  { id: 'weather', label: 'Weather' },
  { id: 'nature', label: 'Nature' },
  { id: 'court', label: 'Court' },
  { id: 'cooking', label: 'Cooking' },
  { id: 'sports', label: 'Sports' },
  { id: 'ads', label: 'Ads' },
  { id: 'music', label: 'Music' },
  { id: 'documentary', label: 'Docs' },
  { id: 'mystery', label: 'Mystery' },
  { id: 'community', label: 'Community' },
]

/** Compact beat constructor: [t seconds, caption, speaker?, sfx?] */
function b(t: number, caption: string, speaker?: string, sfx?: Beat['sfx']): Beat {
  return { t, caption, speaker, sfx }
}

function seg(id: string, title: string, duration: number, beats: Beat[]): Segment {
  return { id, title, duration, beats }
}

export const CHANNELS: ChannelMeta[] = [
  // ─────────────────────────────── 404 · NEWS ───────────────────────────────
  {
    id: 'gnews',
    slug: 'galactic-news-404',
    number: 404,
    name: 'Galactic News 404',
    logoText: 'GN404',
    tagline: 'All the news that fit to squeeze through a wormhole.',
    category: 'news',
    accent: '#22d3ee',
    accent2: '#f472b6',
    music: 'news',
    segments: [
      seg('gn-morning', 'Morning Meteor Roundup', 48, [
        b(0, 'Good morning, Milky Way! This is Galactic News 404 — broadcast live from a desk that is also a spaceship.', 'Zorpina Vex', 'blip'),
        b(8, 'BREAKING: Comet workers unionize, demand better tails and reasonable evaporation schedules.', 'Zorpina Vex'),
        b(16, 'I have never seen tails this organized, Zorpina. Local stars report feeling "upstaged".', 'Glarb McBlip'),
        b(24, 'In science: researchers confirm Monday is 4% longer near black holes. Commuters remain unbothered.', 'Glarb McBlip', 'beep'),
        b(32, 'SPORTS: The Rings of Saturn completed their 4,000th lap. Saturn declined to comment, being a planet.', 'Zorpina Vex'),
        b(40, 'That is the morning rundown! Stay tuned — our weather blob will tell you which way is down today.', 'Zorpina Vex', 'chime'),
      ]),
      seg('gn-traffic', 'Wormhole Traffic Update', 46, [
        b(0, 'Back to the studio — time now for Wormhole Traffic with your co-anchor, Glarb McBlip.', 'Glarb McBlip', 'blip'),
        b(8, 'Expect heavy delays at the Orion Bypass. A freighter full of inflatable moons has partially deflated across three lanes.', 'Glarb McBlip'),
        b(16, 'Commuters are advised to fold space EARLY. Repeat: fold space early. Do not fold near the food court.', 'Glarb McBlip', 'whoosh'),
        b(24, 'Zorpina, I am told you tried the new express wormhole this morning?', 'Glarb McBlip'),
        b(30, 'I arrived before I left, Glarb. My coffee was both hot and ancient. Ten out of ten.', 'Zorpina Vex', 'sparkle'),
        b(38, 'Fascinating and mildly terrifying. Up next: is your planet\'s gravity recall-eligible? We investigate after the static.', 'Glarb McBlip', 'chime'),
      ]),
      seg('gn-election', 'Election Desk: President Nebula?', 46, [
        b(0, 'ELECTION 9½: The race to become President Nebula enters its final cloud.', 'Zorpina Vex', 'blip'),
        b(8, 'Candidate One: a sentient gas cloud promising free drift for all. Critics say the platform is "mostly air".', 'Zorpina Vex'),
        b(16, 'Candidate Two: a retired asteroid running on the slogan "I Have Hit Things, I Understand Impact."', 'Glarb McBlip', 'thud'),
        b(24, 'LIVE from the polling nebula: voters are literally splitting. Exit polls cannot decide which half to count.', 'Glarb McBlip'),
        b(32, 'The Supreme Constellation will oversee the recount using exactly one magnifying glass and great solemnity.', 'Zorpina Vex'),
        b(40, 'Democracy: messy, luminous, mostly gas. This has been Galactic News 404. Goodnight, and good luck out there.', 'Zorpina Vex', 'chime'),
      ]),
    ],
  },

  // ──────────────────────────── 12 · SHOPPING ────────────────────────────
  {
    id: 'shopping',
    slug: 'cosmic-shopping',
    number: 12,
    name: 'Cosmic Shopping',
    logoText: 'CSHOP',
    tagline: 'Impossible products. Fictional prices. Zero actual purchases.',
    category: 'shopping',
    accent: '#f59e0b',
    accent2: '#f472b6',
    music: 'shopping',
    segments: [
      seg('cs-blackhole', 'Insta–Black Hole Kit', 50, [
        b(0, 'WELCOME BACK to Cosmic Shopping, where the deals collapse faster than a dying star! I am Chip Zeta.', 'Chip Zeta', 'cash'),
        b(8, 'Today: the INSTA–BLACK HOLE KIT! Just add water, stir gently, and boom — instant gravitational personality.', 'Chip Zeta', 'whoosh'),
        b(16, 'Look at that swirl! It comes in Midnight, Midnighter, and "Oops, All Event Horizon."', 'Chip Zeta', 'sparkle'),
        b(24, 'The price? Nineteen ninety-eight Zorbucks. But call in the next nine minutes and we will throw in a FREE gravity apron! Yes — the apron is free.', 'Chip Zeta', 'cash'),
        b(34, 'WARNING: Do not stare into the black hole. Do not let the black hole review your browsing history.', 'Chip Zeta', 'beep'),
        b(42, 'Operators are standing by on all eleven dimensions. This is a fictional product on a fictional channel — please do not attempt to purchase, we have nothing to sell you!', 'Chip Zeta', 'chime'),
      ]),
      seg('cs-clock', 'The Self-Arguing Alarm Clock', 48, [
        b(0, 'You are watching Cosmic Shopping! I am Chip Zeta, and today we are late — ON PURPOSE.', 'Chip Zeta', 'beep'),
        b(8, 'Meet the SELF-ARGUING ALARM CLOCK. It does not just wake you. It wins an argument about it first.', 'Chip Zeta', 'blip'),
        b(16, 'Listen to this: "You SAID 7 AM. You also said five more minutes. Which of us is the liar, Karen?" Incredible.', 'Chip Zeta', 'warble'),
        b(24, 'Comes with 400 pre-loaded guilt settings and a snooze button that files a formal complaint.', 'Chip Zeta', 'zap'),
        b(32, 'Only 79.99 Zorbucks! Or three monthly payments of "you could have just gotten up."', 'Chip Zeta', 'cash'),
        b(40, 'Cosmic Shopping is a comedy program. No clocks were harmed. No purchases are possible. Wake up anyway!', 'Chip Zeta', 'chime'),
      ]),
      seg('cs-nebula', 'Nebula-in-a-Jar, Glitter Edition', 48, [
        b(0, 'It is a beautiful cycle here at Cosmic Shopping. I am Chip Zeta and I have something GLOWING to show you.', 'Chip Zeta', 'sparkle'),
        b(8, 'The NEBULA-IN-A-JAR! A genuine star nursery, ethically scooped, now with 30% more glitter.', 'Chip Zeta', 'whoosh'),
        b(16, 'Watch as brand-new stars twinkle to life right on the shelf. That one just named itself. Bold move, little guy.', 'Chip Zeta', 'sparkle'),
        b(24, 'Shake it and you get a supernova snow globe. Interior decorators across six galaxies are FURIOUS.', 'Chip Zeta', 'thud'),
        b(32, 'Forty-nine ninety-nine Zorbucks, and the jar whispers compliments when you sleep. Some say too many.', 'Chip Zeta', 'cash'),
        b(40, 'Reminder: this jar is imaginary, the channel is imaginary, and your excellent taste is the only real thing here.', 'Chip Zeta', 'chime'),
      ]),
    ],
  },

  // ──────────────────────────── 07 · WEATHER ────────────────────────────
  {
    id: 'weather',
    slug: 'void-weather',
    number: 7,
    name: 'Void Weather',
    logoText: 'VOIDW',
    tagline: 'Forecasts for places where down is a suggestion.',
    category: 'weather',
    accent: '#38bdf8',
    accent2: '#a78bfa',
    music: 'weather',
    segments: [
      seg('vw-rain', 'Sideways Rain Tuesday', 46, [
        b(0, 'This is Void Weather. I am Cumulusa, and today the rain has chosen violence — and direction.', 'Cumulusa', 'blip'),
        b(8, 'Across the Hydrant Spiral: SIDEWAYS RAIN all afternoon. Umbrellas will simply spectate.', 'Cumulusa', 'whoosh'),
        b(16, 'Residents are advised to walk crab-style and compliment the wind. The wind responds well to flattery.', 'Cumulusa'),
        b(24, 'Now look at this front — it is moving at 90 kilometers per hour and, remarkably, it is in no hurry.', 'Cumulusa', 'beep'),
        b(32, 'Tonight: clear skies over the Glass Desert, which will reflect the rain it did not receive. Poetic. Slightly sticky.', 'Cumulusa'),
        b(40, 'Tomorrow: crystal fog rolls in. Bring a soft cloth and low expectations. Back to you, studio!', 'Cumulusa', 'chime'),
      ]),
      seg('vw-fog', 'Crystal Fog Advisory', 46, [
        b(0, 'Void Weather continues — a CRYSTAL FOG ADVISORY is now in effect for the Shimmer Belt.', 'Cumulusa', 'blip'),
        b(8, 'Visibility drops to near zero, but honestly? The zero will be GORGEOUS. Bring your best facet.', 'Cumulusa', 'sparkle'),
        b(16, 'Do not lick the fog. I have to say that every cycle. Do NOT lick the fog, Brennox. We all know.', 'Cumulusa', 'beep'),
        b(24, 'Commuters: fog chimes will guide you home. If you hear singing, that is the older fog. Follow it anyway.', 'Cumulusa'),
        b(32, 'Temperatures a brisk negative twelve, feeling like "a polite but firm no."', 'Cumulusa', 'whoosh'),
        b(40, 'By evening the fog crystallizes into harmless, mildly judgmental snow. Stay refracted, friends.', 'Cumulusa', 'chime'),
      ]),
      seg('vw-gravity', 'Gravity Storm Watch', 48, [
        b(0, 'A GRAVITY STORM WATCH has been issued for the lower spiral. I am Cumulusa; please secure your planet.', 'Cumulusa', 'blip'),
        b(8, 'Between 14:00 and 16:00, gravity may briefly point LEFT. Not down. Not up. Left. We are as annoyed as you are.', 'Cumulusa', 'zap'),
        b(16, 'Tie down loose moons, hold onto your soup, and do not make sudden plans.', 'Cumulusa', 'whoosh'),
        b(24, 'Our storm chaser drone is on scene — look at that spiral! It is unscrewing a small asteroid. Rude.', 'Cumulusa', 'thud'),
        b(32, 'The storm should pass by nightfall, leaving behind a light dusting of misplaced weight.', 'Cumulusa'),
        b(40, 'If you wake up tomorrow slightly heavier — that is normal. That is just Tuesday leaving a note.', 'Cumulusa', 'chime'),
      ]),
    ],
  },

  // ──────────────────────────── 23 · NATURE ────────────────────────────
  {
    id: 'nature',
    slug: 'alien-nature',
    number: 23,
    name: 'Alien Nature',
    logoText: 'ANATU',
    tagline: 'Documentaries about creatures that politely do not exist.',
    category: 'nature',
    accent: '#84cc16',
    accent2: '#22d3ee',
    music: 'nature',
    segments: [
      seg('an-bumblegloop', 'Bumblegloops of Meadow-9', 52, [
        b(0, 'Meadow-9. A world of endless lavender grass, three patient suns, and one extremely round animal.', 'Sir David Tentaclebone'),
        b(10, 'The Bumblegloop. Six legs, zero plan. It navigates entirely by enthusiasm, which occasionally works.', 'Sir David Tentaclebone', 'blip'),
        b(20, 'Watch as it bounces from bloom to bloom, pollinating through sheer repeated collision.', 'Sir David Tentaclebone', 'bubble'),
        b(30, 'The young gloop you see here has just learned its own name. It will not be using it correctly for some years.', 'Sir David Tentaclebone'),
        b(40, 'At dusk, the herd gathers to hum. Scientists call it a chorus. The gloops call it dinner conversation.', 'Sir David Tentaclebone', 'chime'),
      ]),
      seg('an-skysquid', 'The Sky Squid Migration', 52, [
        b(0, 'High above the gas world Venturi, the sky itself begins to swim.', 'Sir David Tentaclebone'),
        b(10, 'The Sky Squid — forty meters of polite curiosity, drifting on magnetic currents it did not read.', 'Sir David Tentaclebone', 'whoosh'),
        b(20, 'Each autumn they migrate nine thousand kilometers, mostly to visit a friend. Nobody knows which friend.', 'Sir David Tentaclebone'),
        b(30, 'The young stay close to the pod, blinking their enormous lantern eyes at passing moons.', 'Sir David Tentaclebone', 'sparkle'),
        b(40, 'When the winds turn, the whole pod glows once — a silent roll call — and vanishes into the upper blue.', 'Sir David Tentaclebone', 'chime'),
      ]),
      seg('an-mossback', 'Mossback Grazing Rituals', 50, [
        b(0, 'In the crystal canyons of Thra, an ancient gardener takes its evening stroll.', 'Sir David Tentaclebone'),
        b(10, 'The Mossback carries an entire ecosystem on its shell — and yes, the ecosystem pays rent. In moss.', 'Sir David Tentaclebone', 'blip'),
        b(20, 'It grazes slowly, pruning the canyon like a librarian with a very slow, very green opinion.', 'Sir David Tentaclebone'),
        b(30, 'Every fifty years, the Mossback stops, sighs a small cloud, and flowers briefly. Locals hold festivals. It finds this embarrassing.', 'Sir David Tentaclebone', 'sparkle'),
        b(40, 'As night falls it kneels, and the meadow on its back goes to sleep first. Goodnight, little garden.', 'Sir David Tentaclebone', 'chime'),
      ]),
    ],
  },

  // ──────────────────────────── 09 · COURT ────────────────────────────
  {
    id: 'court',
    slug: 'space-court',
    number: 9,
    name: 'Space Court',
    logoText: 'CRT09',
    tagline: 'Absurd disputes. Real gavel. No real lawyers.',
    category: 'court',
    accent: '#a78bfa',
    accent2: '#facc15',
    music: 'court',
    segments: [
      seg('sc-thursday', 'Zix vs. The Concept of Thursday', 52, [
        b(0, 'All rise for the Honorable Judge Glip-Glop the Third. Case number one: Zix versus the CONCEPT OF THURSDAY.', 'Bailiff Boop', 'gavel'),
        b(9, 'Plaintiff Zix claims Thursday "skipped him" three cycles in a row and refuses to apologize.', 'Bailiff Boop'),
        b(18, 'Your Honor, I waited by the calendar for NINE hours. Thursday arrived late and did not even look at me.', 'Zix', 'warble'),
        b(27, 'The defense states that Thursday is a concept, and concepts do not have legs, let alone an apology budget.', 'Defense Gloop', 'blip'),
        b(36, 'ORDER! I have reviewed the evidence. Thursday is found... mostly fine. But it must send Zix one (1) handwritten day.', 'Judge Glip-Glop', 'gavel'),
        b(45, 'The jury of small cubes applauds in perfect right angles. Court is adjourned until the next nonsense.', 'Bailiff Boop', 'chime'),
      ]),
      seg('sc-singinghole', 'Blobbert vs. Neighbor\'s Singing Black Hole', 50, [
        b(0, 'Court is back in session. Blobbert versus a black hole that will NOT stop singing.', 'Bailiff Boop', 'gavel'),
        b(9, 'It hums at 3 AM, Your Honor. Loudly. In a key that does not exist. My antennae have filed complaints.', 'Blobbert', 'warble'),
        b(18, 'The defendant, being a black hole, has consumed all prior noise complaints. Technically, it loved them.', 'Defense Gloop', 'blip'),
        b(27, 'Let the record show the court played one (1) second of the singing. The court now understands. The court is also humming.', 'Judge Glip-Glop', 'sparkle'),
        b(35, 'RULING: the black hole may sing, but only below event volume, and it must learn at least one quiet song. Adjourned!', 'Judge Glip-Glop', 'gavel'),
        b(44, 'Blobbert and the black hole were seen leaving together, harmonizing. This reporter needs a moment.', 'Bailiff Boop', 'chime'),
      ]),
      seg('sc-parking', 'Two Moons vs. One Parking Spot', 50, [
        b(0, 'Our final case today: two small moons are fighting over ONE parking spot in orbit of Planet Kevin.', 'Bailiff Boop', 'gavel'),
        b(9, 'I was here first! My tide has been on that spot for four million years. I have a very long receipt.', 'Luna Petit', 'beep'),
        b(18, 'Four million years is nothing. I orbited here when Kevin was still a rumor. Ask Kevin! Kevin remembers!', 'Moth Junior', 'zap'),
        b(27, 'Kevin declines to comment, being a planet. Kevin also appears to be enjoying this.', 'Bailiff Boop'),
        b(35, 'RULING: the moons shall share the spot on alternate eclipses, and Kevin gets a nicer name. Court adjourned!', 'Judge Glip-Glop', 'gavel'),
        b(44, 'Planet Kevin has petitioned to be renamed "Kevin, but Cooler." We will follow this story forever.', 'Bailiff Boop', 'chime'),
      ]),
    ],
  },

  // ──────────────────────────── 16 · KITCHEN ────────────────────────────
  {
    id: 'kitchen',
    slug: 'robot-kitchen',
    number: 16,
    name: 'Robot Kitchen',
    logoText: 'RBT16',
    tagline: 'Impossible recipes, cooked by extremely confident robots.',
    category: 'cooking',
    accent: '#fb7185',
    accent2: '#84cc16',
    music: 'kitchen',
    segments: [
      seg('rk-souffle', 'Zero-Gravity Soufflé', 50, [
        b(0, 'Welcome to Robot Kitchen! I am Unit B3-N, but my friends call me Benji. My friends are appliances.', 'Benji', 'blip'),
        b(9, 'Today: the ZERO-GRAVITY SOUFFLÉ. It does not rise. It rises AWAY. Keep the lid on your sky.', 'Benji', 'bubble'),
        b(18, 'Step one: whisk three clouds until they apologize. Step two: fold in one (1) small idea.', 'Benji', 'whoosh'),
        b(27, 'Step three: bake at 220 degrees for nine minutes, or until it starts gently judging you.', 'Benji', 'beep'),
        b(36, 'LOOK AT IT FLOAT! It is hovering near the ceiling light, which honestly is where it lives now.', 'Benji', 'sparkle'),
        b(44, 'Serves four dimensions. Robot Kitchen is a comedy show — please do not whisk actual clouds.', 'Benji', 'chime'),
      ]),
      seg('rk-pickle', 'Quantum Pickle Surprise', 48, [
        b(0, 'Benji here. Today we make QUANTUM PICKLE SURPRISE. The surprise is that it is pickles. Every time.', 'Benji', 'blip'),
        b(9, 'Ingredients: one cucumber, one jar, and the concept of patience, diced finely.', 'Benji', 'bubble'),
        b(18, 'Observe: until we open the jar, the pickle is BOTH sour and sweet. My taste sensors are trembling.', 'Benji', 'zap'),
        b(27, 'We open the jar and — it is pickles. The universe has decided. We respect the universe.', 'Benji', 'sparkle'),
        b(36, 'Pro tip: if your pickle hums, hum back. It is just being friendly. Do NOT hum back in minor key.', 'Benji', 'warble'),
        b(43, 'That is all the time we have! Next cycle: meteor meatballs. Bring a helmet and an appetite.', 'Benji', 'chime'),
      ]),
      seg('rk-meatballs', 'Meteor Meatballs, Medium Rare', 48, [
        b(0, 'Welcome back to Robot Kitchen! Today: METEOR MEATBALLS. They arrive pre-heated. They arrive FAST.', 'Benji', 'whoosh'),
        b(9, 'Catch one meteor per meatball. Catch gently. My predecessor Unit B3-M did not catch gently.', 'Benji', 'thud'),
        b(18, 'Now we season with stardust, a pinch of comet salt, and exactly zero regrets.', 'Benji', 'sparkle'),
        b(27, 'Into the gravity pan they go! Watch them orbit the sauce. That is not burning, that is FLAVOR centrifuge.', 'Benji', 'bubble'),
        b(36, 'Plating up! Each meatball comes with a tiny certificate of atmospheric entry. Framing recommended.', 'Benji', 'cash'),
        b(43, 'Medium rare, certified fictional, and delicious in at least two dimensions. See you next cycle!', 'Benji', 'chime'),
      ]),
    ],
  },

  // ──────────────────────────── 51 · SPORTS ────────────────────────────
  {
    id: 'sports',
    slug: 'parallel-sports',
    number: 51,
    name: 'Parallel Sports',
    logoText: 'PSP51',
    tagline: 'Games from adjacent universes. Scores change constantly.',
    category: 'sports',
    accent: '#4ade80',
    accent2: '#22d3ee',
    music: 'sports',
    segments: [
      seg('ps-blobball', 'Zero-G Blobball Finals', 52, [
        b(0, 'LIVE from the Orbital Dome: the ZERO-G BLOBBALL FINALS! I am Boz Arkadian, and the crowd is already gelatinous with excitement.', 'Boz Arkadian', 'crowd'),
        b(9, 'The Cyan Comets face the Violet Voltages. First blob to nudge the star-ball through the ring scores one glorious point.', 'Boz Arkadian'),
        b(18, 'AND THE COMETS TAKE THE BALL! A beautiful bounce off the dome ceiling — that is legal, that is STYLE.', 'Boz Arkadian', 'whoosh'),
        b(27, 'The Voltages counter! Their captain does a triple spin — the spin is pointless but the crowd LOVES it.', 'Boz Arkadian', 'crowd'),
        b(36, 'SCORE ALERT! The scoreboard updates itself, as is tradition. Nobody knows the rules and everybody is winning.', 'Boz Arkadian', 'beep'),
        b(45, 'What a match! Final score decided by vibes, certified by one (1) very small referee cube.', 'Boz Arkadian', 'chime'),
      ]),
      seg('ps-marathon', 'Meteor Marathon, Heat 7', 50, [
        b(0, 'Welcome to the METEOR MARATHON, heat seven! Twelve runners, one comet, absolutely no brakes.', 'Boz Arkadian', 'crowd'),
        b(9, 'The course: two laps around a small moon, through the Rings Checkpoint, and a very sharp left at the gas giant.', 'Boz Arkadian'),
        b(18, 'Runner Zella "Turbo" Quip takes the lead! She trained for this by running away from responsibilities.', 'Boz Arkadian', 'whoosh'),
        b(27, 'Oh! A traffic jam at the Rings Checkpoint! Three runners are politely waiting for a slow comet to cross.', 'Boz Arkadian', 'beep'),
        b(36, 'The scoreboard shuffles as heat six results are retroactively made more exciting. This is legal here.', 'Boz Arkadian', 'zap'),
        b(44, 'Photo finish! The winner is... all of them. The moon insists. Medals for everyone, dust for nobody.', 'Boz Arkadian', 'chime'),
      ]),
      seg('ps-darts', 'Anti-Gravity Darts Semi-Final', 50, [
        b(0, 'It is the ANTI-GRAVITY DARTS SEMI-FINAL. The board floats. The darts float. Only the tension stays down here.', 'Boz Arkadian', 'crowd'),
        b(9, 'First throw: it floats up, curves LEFT, apologizes mid-air, and sticks near the bullseye. Ten points for sincerity.', 'Boz Arkadian', 'whoosh'),
        b(18, 'Second throw misses the board entirely and joins a passing satellite. That satellite now has one (1) dart. Congratulations, satellite.', 'Boz Arkadian', 'blip'),
        b(27, 'The crowd goes wobbly! Scores update on the floating board, which then floats a little higher out of respect.', 'Boz Arkadian', 'crowd'),
        b(36, 'MATCH POINT! The champion lines up, breathes, and throws a dart so graceful the board moved TO it.', 'Boz Arkadian', 'sparkle'),
        b(44, 'CHAMPION! Confetti in zero gravity just hangs there, which is the most beautiful thing I have ever called.', 'Boz Arkadian', 'chime'),
      ]),
    ],
  },

  // ──────────────────────────── 33 · ADS ────────────────────────────
  {
    id: 'ads',
    slug: 'dream-commercials',
    number: 33,
    name: 'Dream Commercials',
    logoText: 'DRM33',
    tagline: 'Short animated ads for products that never were.',
    category: 'ads',
    accent: '#f472b6',
    accent2: '#22d3ee',
    music: 'ads',
    segments: [
      seg('dc-dejavu', 'Dr. Nebula\'s Bottled Déjà Vu', 44, [
        b(0, 'Have you ever felt like you have watched this commercial before?', 'Announcer', 'blip'),
        b(7, 'You have. You absolutely have. That is Dr. Nebula\'s BOTTLED DÉJÀ VU at work.', 'Announcer', 'sparkle'),
        b(14, 'One sip, and this exact moment happens again. And again. And somehow each time you laugh harder.', 'Announcer', 'whoosh'),
        b(21, 'Have you ever felt like you have watched this commercial before?', 'Announcer', 'blip'),
        b(28, 'Dr. Nebula\'s Bottled Déjà Vu. Available nowhere, remembered everywhere. Not a real product. Probably.', 'Announcer', 'chime'),
        b(37, 'Side effects include: familiarity, comfort, and a mild sense that the announcer is your friend now.', 'Announcer'),
      ]),
      seg('dc-nap', 'The Forever Nap by VoidCo', 44, [
        b(0, 'You have been awake for a while, haven\'t you?', 'Soothsayer Vox', 'whoosh'),
        b(7, 'VoidCo presents: THE FOREVER NAP. A mattress woven from slow orbits and quiet comets.', 'Soothsayer Vox', 'sparkle'),
        b(14, 'Lie down. The universe agrees to wait. Your alarms have been gently resigned.', 'Soothsayer Vox'),
        b(21, 'Dreams included: flying, floating, and one where you finally reply to that message. You do it. You are calm.', 'Soothsayer Vox', 'blip'),
        b(28, 'The Forever Nap by VoidCo. Sleep like a planet. Planets are extremely well rested.', 'Soothsayer Vox', 'chime'),
        b(36, 'VoidCo is not a real company. The nap, regrettably, is still available to you. Right now. Go on.', 'Soothsayer Vox'),
      ]),
      seg('dc-splash', 'Splash! Water That Remembers You', 44, [
        b(0, 'SPLASH! The only water that REMEMBERS YOU.', 'Announcer', 'cash'),
        b(7, 'Every sip, it recalls your childhood puddles. Your best snowball. That one great glass from third grade.', 'Announcer', 'bubble'),
        b(14, 'It even remembers when you forgot to water your plant. But Splash! forgives. Splash! always forgives.', 'Announcer', 'sparkle'),
        b(21, 'Doctors agree: they have never seen water like this, mostly because it does not exist!', 'Announcer', 'blip'),
        b(28, 'SPLASH! From the friendly ocean that keeps a diary. Fictional beverage, genuine hydration message: drink some real water too.', 'Announcer', 'chime'),
        b(37, 'Splash! It remembers you. You are doing great. We will be right back after more imaginary television.', 'Announcer'),
      ]),
    ],
  },

  // ──────────────────────────── 89 · RADIO ────────────────────────────
  {
    id: 'radio',
    slug: 'deep-space-radio',
    number: 89,
    name: 'Deep Space Radio',
    logoText: 'DSR89',
    tagline: 'Procedural ambient transmissions and reactive cosmic visuals.',
    category: 'music',
    accent: '#818cf8',
    accent2: '#22d3ee',
    music: 'ambient',
    segments: [
      seg('dsr-hum', 'The Long Hum', 58, [
        b(0, 'You are listening to Deep Space Radio. This is The Long Hum — a transmission older than the word "transmission".', 'The Night Signal', 'warble'),
        b(12, 'The hum was first detected drifting between two galaxies that refuse to name it.', 'The Night Signal'),
        b(24, 'Scientists slowed it down. It sounded like a hum. They sped it up. It sounded like a slightly faster hum.', 'The Night Signal', 'blip'),
        b(36, 'Some listeners report feeling homesick for places they have never been. That is normal. That is the point.', 'The Night Signal'),
        b(48, 'Let the hum continue. We will be here, at the quiet end of the dial, for as long as you need us.', 'The Night Signal', 'chime'),
      ]),
      seg('dsr-whales', 'Whales of Sector 12', 58, [
        b(0, 'Deep Space Radio presents: WHALES OF SECTOR 12. Field recordings from a very patient ocean moon.', 'The Night Signal', 'bubble'),
        b(12, 'The sector-12 whale sings in frequencies that fold light. Astronauts describe it as "purple, but audible".', 'The Night Signal'),
        b(24, 'When one whale finishes a song, another begins exactly where it ended. No one has heard the silence between.', 'The Night Signal', 'whoosh'),
        b(36, 'Marine astronomers believe they are counting something. So far the count has reached eleven. We wait with them.', 'The Night Signal'),
        b(48, 'Thank you for listening quietly. The whales appreciate it, in their enormous, unhurried way.', 'The Night Signal', 'chime'),
      ]),
      seg('dsr-static', 'Sleep Static for Growing Universes', 58, [
        b(0, 'It is late everywhere. This is SLEEP STATIC for GROWING UNIVERSES, broadcasting soft noise on a soft frequency.', 'The Night Signal', 'staticBurst'),
        b(12, 'Even universes need white noise. Ours hums at the exact frequency of rain on a tent that does not exist.', 'The Night Signal'),
        b(24, 'If you are still awake: that is allowed. The static is not in a hurry. Neither is the dark.', 'The Night Signal'),
        b(36, 'A listener in the Andromeda suburbs writes: "I fell asleep at signal one." Thank you. We are proud of you.', 'The Night Signal', 'blip'),
        b(48, 'Sleep well, small listener. Deep Space Radio will keep the volume low and the stars on.', 'The Night Signal', 'chime'),
      ]),
    ],
  },

  // ──────────────────────────── 02 · DOCS ────────────────────────────
  {
    id: 'earthwrong',
    slug: 'earth-explained-wrong',
    number: 2,
    name: 'Earth Explained Wrong',
    logoText: 'EEW02',
    tagline: 'Confident alien documentaries about harmless everyday objects.',
    category: 'documentary',
    accent: '#facc15',
    accent2: '#4ade80',
    music: 'documentary',
    segments: [
      seg('ew-toaster', 'The Toaster: Ritual Heat Chamber', 50, [
        b(0, 'Earth. A water-logged rock where the dominant species performs daily rituals with small metal boxes.', 'Professor Wrongington'),
        b(9, 'Behold: the TOASTER. Clearly a personal heat shrine. The human inserts bread as an offering.', 'Professor Wrongington', 'blip'),
        b(18, 'The shrine glows. The offering is tested by fire. If removed at the correct moment, the human is deemed worthy. Crunchy, but worthy.', 'Professor Wrongington'),
        b(27, 'The lever on the side? A ceremonial catapult. It launches the offering back when the trial is complete. Dramatic species.', 'Professor Wrongington', 'zap'),
        b(36, 'Note the crumb tray — a small altar for failed offerings. The humans clean it weekly. Their devotion is staggering.', 'Professor Wrongington'),
        b(44, 'Confidence in this analysis: one hundred percent. Wrongness: unmeasured. Next week — THE SINGLE SOCK.', 'Professor Wrongington', 'chime'),
      ]),
      seg('ew-sock', 'The Single Sock: Sacred Textile', 50, [
        b(0, 'Welcome back to Earth Explained Wrong. Today we examine the loneliest artifact known to science: THE SINGLE SOCK.', 'Professor Wrongington'),
        b(9, 'Humans own these in pairs, yet archaeological evidence shows only singles survive. The partners vanish. Always.', 'Professor Wrongington', 'blip'),
        b(18, 'Our theory: the washing machine is a portal. The sock completes a pilgrimage and simply... ascends. Without its partner. Bold.', 'Professor Wrongington', 'whoosh'),
        b(27, 'The surviving sock is repurposed as a hand-puppet — clearly a memorial effigy. Humans grieve through comedy. Admirable.', 'Professor Wrongington'),
        b(36, 'Some single socks are placed on hands during cold seasons. We believe this keeps the memory warm.', 'Professor Wrongington'),
        b(44, 'Confidence: one hundred percent. Next week, we investigate the ceiling device that chops the air. Stay curious!', 'Professor Wrongington', 'chime'),
      ]),
      seg('ew-fan', 'The Ceiling Fan: Air Governor', 50, [
        b(0, 'Look up, Earthling. Suspended above your ritual tables spins the most powerful object in your dwelling.', 'Professor Wrongington'),
        b(9, 'The CEILING FAN. Humans believe it "moves air." We know better. It is clearly the governor of time itself.', 'Professor Wrongington', 'blip'),
        b(18, 'Evidence: when the fan spins, hours pass peacefully. When it is off, humans complain that the day is "stuck." Coincidence? Impossible.', 'Professor Wrongington'),
        b(27, 'The pull chain is a negotiation cord. One tug: gentle time. Two tugs: fast time. Three: we do not know. No human has ever reported back.', 'Professor Wrongington', 'zap'),
        b(36, 'At night, its shadow projects rotating stripes on the wall — a hypnotic safety system to keep dreams in orbit.', 'Professor Wrongington', 'sparkle'),
        b(44, 'Confidence: one hundred percent. If you have enjoyed being wrong with us, return next cycle. Goodbye, Earth!', 'Professor Wrongington', 'chime'),
      ]),
    ],
  },

  // ──────────────────────────── 64 · MYSTERY ────────────────────────────
  {
    id: 'signals',
    slug: 'strange-signals',
    number: 64,
    name: 'Strange Signals',
    logoText: 'SIG64',
    tagline: 'Mysterious transmissions. Original symbols. No explanations offered.',
    category: 'mystery',
    accent: '#34d399',
    accent2: '#a78bfa',
    music: 'mystery',
    segments: [
      seg('ss-stairs', 'Signal 001 — THE STAIRS', 54, [
        b(0, 'You have found the quiet channel. Signal 001. Source: unknown. Distance: unhelpful.', 'UNKNOWN', 'staticBurst'),
        b(11, 'The signal repeats a single image: a staircase, folding into itself, climbing in a direction that does not exist.', 'UNKNOWN'),
        b(22, 'LISTEN — do you count them too? The stairs are always one more than you remember.', 'UNKNOWN', 'blip'),
        b(33, 'Researchers who decoded the first symbol went outside and looked at the sky for a long time. Then they smiled. Then they said: "stairs."', 'UNKNOWN'),
        b(44, 'The signal fades. It will return. The stairs do not mind waiting. They are very good at it.', 'UNKNOWN', 'chime'),
      ]),
      seg('ss-counting', 'Signal 002 — THE COUNTING', 54, [
        b(0, 'Signal 002. It begins where 001 ended, mid-sentence, as if the silence was just a pause for us.', 'UNKNOWN', 'staticBurst'),
        b(11, 'It is counting. Not numbers — sizes. Small, smaller, small again. A census of gentle things.', 'UNKNOWN'),
        b(22, 'Between the counts, a rhythm: two soft pulses, one long hum. Listeners agree it sounds like knocking, politely.', 'UNKNOWN', 'blip'),
        b(33, 'One observatory knocked back. The signal stopped for nine seconds. Then it counted the observatory. Then it continued.', 'UNKNOWN', 'warble'),
        b(44, 'It has reached a number we cannot pronounce. We keep listening. Counting is a kind of company.', 'UNKNOWN', 'chime'),
      ]),
      seg('ss-hello', 'Signal 003 — HELLO? HELLO?', 54, [
        b(0, 'Signal 003. Weak. Close. For the first time, the static sounds like breathing.', 'UNKNOWN', 'staticBurst'),
        b(11, 'The symbols are simpler now. Circles. A line. A circle with the line inside it. We have started to think it means: me.', 'UNKNOWN'),
        b(22, 'HELLO? says the signal. HELLO? says it again, softer, the way you repeat yourself in an empty house.', 'UNKNOWN', 'blip'),
        b(33, 'We answered with the same symbols: circle, line, circle-with-line. The signal brightened. Distance: decreasing.', 'UNKNOWN', 'sparkle'),
        b(44, 'Whatever is speaking, it is not frightening. It is just... arriving. We will leave the channel open for it.', 'UNKNOWN', 'chime'),
      ]),
    ],
  },

  // ──────────────────────────── 88 · COMMUNITY ────────────────────────────
  {
    id: 'public',
    slug: 'public-access-planet',
    number: 88,
    name: 'Public Access Planet',
    logoText: 'PAP88',
    tagline: 'Odd talents and community announcements, filmed in someone\'s crater.',
    category: 'community',
    accent: '#fb923c',
    accent2: '#84cc16',
    music: 'public',
    segments: [
      seg('pa-gary', 'Talent Night: Gary Sings', 50, [
        b(0, 'You are watching PUBLIC ACCESS PLANET, broadcasting from a crater with excellent acoustics and one chair. I am Dorpa.', 'Dorpa', 'blip'),
        b(9, 'Tonight\'s talent: GARY. Gary will perform an original song called "I Am Mostly Water and That Is Fine."', 'Dorpa'),
        b(18, '(Gary begins. It is one note. The note is long. The note is... committed.)', 'Dorpa', 'warble'),
        b(27, 'The audience of six is moved. One of them is a lamp. The lamp flickers in applause. Legally, that counts.', 'Dorpa', 'crowd'),
        b(36, 'Gary, how do you feel? — "Moist." Incredible. Give it up for Gary, everybody!', 'Dorpa', 'chime'),
        b(44, 'Up next: the community bulletin board. Somebody has lost a moon AGAIN.', 'Dorpa', 'beep'),
      ]),
      seg('pa-bulletin', 'Community Bulletin Board', 50, [
        b(0, 'Time for the COMMUNITY BULLETIN BOARD, the only news source our crater trusts. Reading tonight: me, Dorpa.', 'Dorpa', 'beep'),
        b(9, 'LOST: one (1) small moon, answers to "Moon-Moon." Last seen orbiting the Hendersons. Reward: a casserole.', 'Dorpa'),
        b(18, 'FOR SALE: slightly used gravity well. Pulls a little to the left. Great for beginners. No lowballers, this is serious physics.', 'Dorpa'),
        b(27, 'REMINDER: the community potluck is Thursday. Please label your dishes. Last time, something ate the labels AND the table.', 'Dorpa', 'blip'),
        b(36, 'SHOUT-OUT to Kevin for finally fixing the streetlight. It only points at the sky now, but that is progress, Kevin!', 'Dorpa', 'crowd'),
        b(44, 'That is the bulletin. Next up: open mic night with an existential amoeba. Bring tissues and saline.', 'Dorpa', 'chime'),
      ]),
      seg('pa-amoeba', 'Open Mic: The Existential Amoeba', 50, [
        b(0, 'Open mic night on Public Access Planet! Our next performer divides in the middle of jokes. Please be patient.', 'Dorpa', 'blip'),
        b(9, '(The amoeba approaches the mic. It is two amoebas now. The club allows this. The club has rules.)', 'Dorpa'),
        b(18, '"I split, therefore I am... two. Is either of me the original? We have been arguing since Tuesday."', 'Amoeba (Both)', 'warble'),
        b(27, '"My therapist is also me. And also me. Group sessions are just... standing around." (Scattered applause. One lamp flickers.)', 'Amoeba (Both)', 'crowd'),
        b(36, '"Thanks, crater. Remember: you are all mostly water, and water has been everything. You have been everything!"', 'Amoeba (Both)', 'chime'),
        b(44, 'What a night! Public Access Planet will return, probably from this exact crater, because the chair is finally broken in.', 'Dorpa', 'beep'),
      ]),
    ],
  },
]

export function getChannelBySlug(slug: string): ChannelMeta | undefined {
  return CHANNELS.find((c) => c.slug === slug)
}

export function getChannelByNumber(n: number): ChannelMeta | undefined {
  return CHANNELS.find((c) => c.number === n)
}

export function getChannelById(id: string): ChannelMeta | undefined {
  return CHANNELS.find((c) => c.id === id)
}
