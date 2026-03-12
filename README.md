# Omniguide SDK Builds

Pre-built distribution files for the Omniguide SDK. No source code or source maps.

## Structure

- `latest/umd/` — UMD bundles (script tag usage, exposes `window.Omniguide`)
  - `omniguide-sdk.js` — External React (expects `window.React`)
  - `omniguide-sdk.standalone.js` — Standalone (React bundled)
- `latest/esm/` — ESM modules (lazy-loaded features)
- `latest/css/` — Stylesheets (full, minified, per-feature)

## Current Version

0.4.0
