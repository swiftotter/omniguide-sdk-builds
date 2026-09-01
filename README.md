# Omniguide SDK Builds

Pre-built distribution files for the Omniguide SDK. No source code or source maps.

## Distribution Channels

Two independent axes. The **folder** picks the stability tier; the **branch**
picks whose build it is. A tenant pod pins both, as `@<sha>/<folder>/...`.

### Folder — stability tier

| Channel | Folder | Purpose | Stability |
|---------|--------|---------|-----------|
| **dev** | `dev/` | Active development builds | Unstable — may contain debug logging, WIP features |
| **latest** | `latest/` | Latest stable release | Stable — updated only on new releases |
| **versioned** | `v{version}/` | Pinned release (immutable) | Stable — never overwritten |

### Branch — tenant channel

Tenant builds do **not** live on `main`. Each tenant has its own long-lived
branch here, built from the matching branch in `swiftotter/omniguide-sdk`:

| Tenant | Branch here | Built from `omniguide-sdk` | Folder used |
|--------|-------------|----------------------------|-------------|
| Nosler (NSL) | `nosler` | `nosler` | `dev/` |
| Rogers | `rogers` | `rogers` | `dev/` |
| — | `main` | `develop` | `latest/`, `v{version}/` |

`SOI-*-deploy-*` and `SOI-*-preview-*` branches are per-ticket staging for a
tenant channel and are merged into it; they are not pinned directly.

> **Nosler is `nosler`.** An older branch, `nsl-category-guide-session-fix`,
> is stale (last built July 2026) and is **not** the NSL channel. Some tooling
> and docs still name it — they are wrong. Confirm what a page actually loads
> before deploying: read the `builds@<sha>` in its script tag and
> `git branch -r --contains <sha>`.

### Deploying a tenant channel

Both JS **and** CSS ship, and jsDelivr caches per-file — update and purge both:

```bash
# build from the tenant's branch in omniguide-sdk, then, in this repo:
git checkout <tenant> && git pull --ff-only
rm -rf dev/umd dev/css dev/esm && mkdir -p dev/umd dev/css dev/esm
cp <sdk>/packages/bundle/dist/omniguide-sdk{,.standalone,.standalone.umd,.umd}.js dev/umd/
cp <sdk>/packages/bundle/dist/omniguide-sdk.css <sdk>/packages/styles/dist/*.css dev/css/
cp <sdk>/packages/bundle/dist/esm/* dev/esm/
git commit -am "deploy(<tenant>): <what> (off omniguide-sdk@<sha>)" && git push

curl -s "https://purge.jsdelivr.net/gh/swiftotter/omniguide-sdk-builds@<new-sha>/dev/umd/omniguide-sdk.standalone.js"
curl -s "https://purge.jsdelivr.net/gh/swiftotter/omniguide-sdk-builds@<new-sha>/dev/css/omniguide.min.css"
```

The `dev/esm/` chunk filenames carry content hashes, so they rotate on every
build — clearing the directory first is deliberate. Keep `dev/umd/omniguide-sdk.umd.js`
and `dev/css/omniguide-sdk.css` present even if a build step stops emitting them
to the same path: pods pin exact URLs, and removing one is a 404 for whoever
still points at it.

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
