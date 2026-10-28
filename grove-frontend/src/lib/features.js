// Community (the feed, Groves, swaps and saved cuttings) is held back from v1: it only works once enough
// people are using the app to fill it. Turn it on with REACT_APP_COMMUNITY=on once the trigger in
// docs/product/scope-v1.md is met. The pages and API stay in the codebase.
export const COMMUNITY_ENABLED = process.env.REACT_APP_COMMUNITY === 'on';
