// Community (the feed, Groves, swaps and saved cuttings) is held back from v1: it only works once enough
// people are using the app to fill it. Turn it on with REACT_APP_COMMUNITY=on once the trigger in
// docs/product/scope-v1.md is met. The pages and API stay in the codebase.
export const COMMUNITY_ENABLED = process.env.REACT_APP_COMMUNITY === 'on';

// Themed guilds (the curated plant groups on the Greenhouse page) are held back from v1: they add a second
// way to browse before a new owner has used the first. Turn on with REACT_APP_GUILDS=on.
export const GUILDS_ENABLED = process.env.REACT_APP_GUILDS === 'on';

// The zip code and hardiness zone step of first run is held back from v1. Hardiness zone describes outdoor
// winter lows and changes nothing about indoor care. Hemisphere, which sets the season, is still asked.
// Turn on with REACT_APP_ZIP_ZONE=on, for example once outdoor plants are supported.
export const ZIP_ZONE_ENABLED = process.env.REACT_APP_ZIP_ZONE === 'on';
