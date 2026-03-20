# Omniguide SDK Builds

Pre-built distribution files for the Omniguide SDK. No source code or source maps.

## Distribution Channels

| Channel | Folder | Purpose | Stability |
|---------|--------|---------|-----------|
| **dev** | `dev/` | Active development builds | Unstable — may contain debug logging, WIP features |
| **latest** | `latest/` | Latest stable release | Stable — updated only on new releases |
| **versioned** | `v{version}/` | Pinned release (immutable) | Stable — never overwritten |

## Current Version

0.6.0

## Quick Start (Stable — recommended)

```html
<link rel="stylesheet" href="https://cdn.jsdelivr.net/gh/swiftotter/omniguide-sdk-builds@main/latest/css/omniguide.min.css">
<script src="https://cdn.jsdelivr.net/gh/swiftotter/omniguide-sdk-builds@main/latest/umd/omniguide-sdk.standalone.js"></script>
```

## Quick Start (Dev — active development)

```html
<link rel="stylesheet" href="https://cdn.jsdelivr.net/gh/swiftotter/omniguide-sdk-builds@main/dev/css/omniguide.min.css">
<script src="https://cdn.jsdelivr.net/gh/swiftotter/omniguide-sdk-builds@main/dev/umd/omniguide-sdk.standalone.js"></script>
```

## Quick Start (Pinned version)

```html
<link rel="stylesheet" href="https://cdn.jsdelivr.net/gh/swiftotter/omniguide-sdk-builds@main/v0.6.0/css/omniguide.min.css">
<script src="https://cdn.jsdelivr.net/gh/swiftotter/omniguide-sdk-builds@main/v0.6.0/umd/omniguide-sdk.standalone.js"></script>
```

## IIFE Bundles

Standalone (React bundled):
```
https://cdn.jsdelivr.net/gh/swiftotter/omniguide-sdk-builds@main/latest/umd/omniguide-sdk.standalone.js
```

External React (expects `window.React`):
```
https://cdn.jsdelivr.net/gh/swiftotter/omniguide-sdk-builds@main/latest/umd/omniguide-sdk.js
```

## UMD Bundles

Standalone (React bundled):
```
https://cdn.jsdelivr.net/gh/swiftotter/omniguide-sdk-builds@main/latest/umd/omniguide-sdk.standalone.umd.js
```

External React (expects `window.React`):
```
https://cdn.jsdelivr.net/gh/swiftotter/omniguide-sdk-builds@main/latest/umd/omniguide-sdk.umd.js
```

## CSS — Full

All components (minified):
```
https://cdn.jsdelivr.net/gh/swiftotter/omniguide-sdk-builds@main/latest/css/omniguide.min.css
```

All components (unminified):
```
https://cdn.jsdelivr.net/gh/swiftotter/omniguide-sdk-builds@main/latest/css/omniguide.css
```

## CSS — Per Feature

Tokens only:
```
https://cdn.jsdelivr.net/gh/swiftotter/omniguide-sdk-builds@main/latest/css/omniguide-tokens.css
```

Search (minified):
```
https://cdn.jsdelivr.net/gh/swiftotter/omniguide-sdk-builds@main/latest/css/omniguide-search.min.css
```

Search (unminified):
```
https://cdn.jsdelivr.net/gh/swiftotter/omniguide-sdk-builds@main/latest/css/omniguide-search.css
```

Product Fit (minified):
```
https://cdn.jsdelivr.net/gh/swiftotter/omniguide-sdk-builds@main/latest/css/omniguide-product-fit.min.css
```

Product Fit (unminified):
```
https://cdn.jsdelivr.net/gh/swiftotter/omniguide-sdk-builds@main/latest/css/omniguide-product-fit.css
```

Category Guide (minified):
```
https://cdn.jsdelivr.net/gh/swiftotter/omniguide-sdk-builds@main/latest/css/omniguide-category-guide.min.css
```

Category Guide (unminified):
```
https://cdn.jsdelivr.net/gh/swiftotter/omniguide-sdk-builds@main/latest/css/omniguide-category-guide.css
```

## ESM (Lazy-loaded)

Entry point:
```
https://cdn.jsdelivr.net/gh/swiftotter/omniguide-sdk-builds@main/latest/esm/omniguide-sdk.esm.js
```

Vendor React:
```
https://cdn.jsdelivr.net/gh/swiftotter/omniguide-sdk-builds@main/latest/esm/vendor-react.js
```
