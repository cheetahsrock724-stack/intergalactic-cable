/**
 * Channel renderer registry. Maps channel ids to their visual modules.
 * Add new channels here after creating metadata in src/data/channels.ts
 * and a renderer module in this folder.
 */

import type { ChannelVisual } from '../types'
import * as news from './news'
import * as shopping from './shopping'
import * as weather from './weather'
import * as nature from './nature'
import * as court from './court'
import * as kitchen from './kitchen'
import * as sports from './sports'
import * as ads from './ads'
import * as radio from './radio'
import * as earthwrong from './earthwrong'
import * as signals from './signals'
import * as publicAccess from './public'

export const CHANNEL_VISUALS: Record<string, ChannelVisual> = {
  gnews: { render: news.render, logo: news.logo },
  shopping: { render: shopping.render, logo: shopping.logo },
  weather: { render: weather.render, logo: weather.logo },
  nature: { render: nature.render, logo: nature.logo },
  court: { render: court.render, logo: court.logo },
  kitchen: { render: kitchen.render, logo: kitchen.logo },
  sports: { render: sports.render, logo: sports.logo },
  ads: { render: ads.render, logo: ads.logo },
  radio: { render: radio.render, logo: radio.logo },
  earthwrong: { render: earthwrong.render, logo: earthwrong.logo },
  signals: { render: signals.render, logo: signals.logo },
  public: { render: publicAccess.render, logo: publicAccess.logo },
}
