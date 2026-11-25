import { jsxs, jsx, Fragment } from "react/jsx-runtime";
import { memo, useState, useSyncExternalStore, useId, useRef, useCallback, useMemo, useEffect } from "react";
import { createRoot } from "react-dom/client";
import { o as onRecommendations, g as getLastRecommendations } from "./shared-BVEY4TgW.js";
import { F as FlagBadges, G as purify } from "./shared-ciXz81MU.js";
import { e as subscribeI18n, h as getI18nSnapshot, q as dropsCents, c as createScopedLogger, s as savePercent, l as logger, n as nativeFetch } from "./shared-dt7kNtBU.js";
import { m as markdownOf, C as displayPriceRange, D as formatPriceRange, s as safeHref, b7 as objectType, b8 as booleanType, b9 as numberType, ba as arrayType, v as translateWithProp, J as TYPEAHEAD_MIN_QUERY_LENGTH, e as sanitizeUrl } from "./shared-iBjwBYJu.js";
import { P as ProductTileRating } from "./shared-D4h5fdiN.js";
import { r as resolveProductRating, i as PLPResponseSchema, c as PLPFacetSchema } from "./shared-pA1HoieW.js";
import { c as createEventQueue } from "./shared-UhyoVnbB.js";
function ProductImageImpl(props) {
  const { product, fallbackImage, isPriority, alt, overrideImageUrl } = props;
  const primary = overrideImageUrl ?? (product == null ? void 0 : product.image_url) ?? fallbackImage ?? "";
  const declaredAlternate = overrideImageUrl ? null : (product == null ? void 0 : product.alternate_image_url) ?? null;
  const altText = alt ?? (product == null ? void 0 : product.name) ?? "Product";
  const [failedAlternate, setFailedAlternate] = useState(null);
  const alternate = declaredAlternate !== null && declaredAlternate !== failedAlternate ? declaredAlternate : null;
  const loading = isPriority ? "eager" : "lazy";
  const fetchPriority = isPriority ? "high" : "auto";
  const decoding = "async";
  return jsxs("span", { className: "omniguide-product-tile__image-wrap", children: [jsx("img", { className: "omniguide-product-tile__image omniguide-product-tile__image--primary", src: primary, alt: altText, loading, decoding, ...{ fetchpriority: fetchPriority } }), alternate ? jsx("img", { className: "omniguide-product-tile__image omniguide-product-tile__image--alt", src: alternate, alt: "", "aria-hidden": "true", loading: "lazy", decoding, onError: () => {
    setFailedAlternate(alternate);
  } }) : null] });
}
const ProductImage = memo(ProductImageImpl);
ProductImage.displayName = "ProductImage";
const log = createScopedLogger("PriceBlock");
let __omniguidePlpCurrencyFallbackWarned = false;
function warnPlpCurrencyFallbackOnce() {
  if (__omniguidePlpCurrencyFallbackWarned)
    return;
  __omniguidePlpCurrencyFallbackWarned = true;
  log.warn("PLP rendering prices without a currency token — no `currency` configured at the integration boundary. Fix preferred: backend team adds `currency` to PLP product schema. Stopgap for single-currency stores: pass `currency` to renderProductList / ProductListContainer.");
}
function formatMoney(amount, currency, locale) {
  const whole = dropsCents(amount, currency);
  if (!currency) {
    warnPlpCurrencyFallbackOnce();
    try {
      return new Intl.NumberFormat(locale, {
        minimumFractionDigits: whole ? 0 : 2,
        maximumFractionDigits: whole ? 0 : 2
      }).format(amount);
    } catch {
      return amount.toFixed(whole ? 0 : 2);
    }
  }
  try {
    return new Intl.NumberFormat(locale, {
      style: "currency",
      currency,
      ...whole ? { minimumFractionDigits: 0, maximumFractionDigits: 0 } : {}
    }).format(amount);
  } catch {
    return amount.toFixed(whole ? 0 : 2);
  }
}
function PriceBlockImpl(props) {
  const { product, currency, locale = "en-US" } = props;
  const { locale: uiLocale } = useSyncExternalStore(subscribeI18n, getI18nSnapshot, getI18nSnapshot);
  const markdown = markdownOf(product);
  if (markdown) {
    const sale = markdown.kind === "sale";
    return jsxs("span", { className: `omniguide-product-tile__price${sale ? " omniguide-product-tile__price--sale" : ""}`, children: [jsx("span", { className: "omniguide-product-tile__price-current", children: formatMoney(markdown.now, currency, locale) }), jsx("span", { className: sale ? "omniguide-product-tile__price-was" : "omniguide-product-tile__price-msrp", "aria-label": sale ? "Was" : "MSRP", children: formatMoney(markdown.was, currency, locale) })] });
  }
  const range = displayPriceRange(product);
  if (range === null)
    return null;
  return jsx("span", { className: "omniguide-product-tile__price", children: jsx("span", { className: "omniguide-product-tile__price-current", children: formatPriceRange(range, (amount) => formatMoney(amount, currency, locale), uiLocale) }) });
}
const PriceBlock = memo(PriceBlockImpl);
PriceBlock.displayName = "PriceBlock";
function VariantSwatchesImpl(props) {
  const { variants, selectedVariantId, onSelect, max = 6 } = props;
  const groupId = useId();
  const btnRefs = useRef([]);
  const [failedUrls, setFailedUrls] = useState(() => /* @__PURE__ */ new Set());
  const markFailed = useCallback((url) => {
    setFailedUrls((prev) => prev.has(url) ? prev : new Set(prev).add(url));
  }, []);
  const seen = /* @__PURE__ */ new Set();
  const usable = [];
  for (const v of variants ?? []) {
    if (typeof (v == null ? void 0 : v.url) !== "string" || v.url.length === 0)
      continue;
    if (failedUrls.has(v.url))
      continue;
    const dedupeKey = String((v == null ? void 0 : v.variant_id) ?? (v == null ? void 0 : v.sku) ?? v.url);
    if (seen.has(dedupeKey))
      continue;
    seen.add(dedupeKey);
    usable.push(v);
  }
  const pickedIdx = usable.findIndex((v) => selectedVariantId != null && (v == null ? void 0 : v.variant_id) === selectedVariantId);
  const renderable = pickedIdx >= max ? [...usable.slice(0, max - 1), usable[pickedIdx]] : usable.slice(0, max);
  const handleClick = useCallback((variant) => (event) => {
    event.preventDefault();
    onSelect == null ? void 0 : onSelect(variant);
  }, [onSelect]);
  if (renderable.length === 0)
    return null;
  const selectedIdx = renderable.findIndex((v) => selectedVariantId != null && (v == null ? void 0 : v.variant_id) === selectedVariantId);
  const tabbableIdx = selectedIdx >= 0 ? selectedIdx : 0;
  const focusAndSelect = (i) => {
    var _a;
    const n = renderable.length;
    const next = (i % n + n) % n;
    (_a = btnRefs.current[next]) == null ? void 0 : _a.focus();
    onSelect == null ? void 0 : onSelect(renderable[next]);
  };
  const handleKeyDown = (event, idx) => {
    switch (event.key) {
      case "ArrowRight":
      case "ArrowDown":
        event.preventDefault();
        focusAndSelect(idx + 1);
        break;
      case "ArrowLeft":
      case "ArrowUp":
        event.preventDefault();
        focusAndSelect(idx - 1);
        break;
      case "Home":
        event.preventDefault();
        focusAndSelect(0);
        break;
      case "End":
        event.preventDefault();
        focusAndSelect(renderable.length - 1);
        break;
    }
  };
  return jsx("ul", { className: "omniguide-product-tile__swatches", role: "radiogroup", "aria-label": "Available variants", children: renderable.map((variant, idx) => {
    const id = (variant == null ? void 0 : variant.variant_id) ?? (variant == null ? void 0 : variant.sku) ?? `swatch-${String(idx)}`;
    const isSelected2 = selectedVariantId != null && (variant == null ? void 0 : variant.variant_id) === selectedVariantId;
    const altText = (variant == null ? void 0 : variant.alt_text) ?? (variant == null ? void 0 : variant.variant_display_name) ?? (variant == null ? void 0 : variant.sku) ?? "Variant";
    return jsx("li", { className: "omniguide-product-tile__swatch-item", children: jsxs("button", { type: "button", ref: (el) => {
      btnRefs.current[idx] = el;
    }, className: isSelected2 ? "omniguide-product-tile__swatch omniguide-product-tile__swatch--selected" : "omniguide-product-tile__swatch", role: "radio", "aria-checked": isSelected2, tabIndex: idx === tabbableIdx ? 0 : -1, "aria-labelledby": `${groupId}-${String(id)}-label`, onClick: handleClick(variant), onKeyDown: (e) => handleKeyDown(e, idx), children: [jsx("img", { className: "omniguide-product-tile__swatch-image", src: variant.url ?? "", alt: "", "aria-hidden": "true", loading: "lazy", decoding: "async", onError: () => {
      markFailed(variant.url ?? "");
    } }), jsx("span", { id: `${groupId}-${String(id)}-label`, className: "omniguide-product-tile__swatch-label", children: altText })] }) }, String(id));
  }) });
}
const VariantSwatches = memo(VariantSwatchesImpl);
VariantSwatches.displayName = "VariantSwatches";
function ProductTileImpl(props) {
  var _a, _b, _c, _d;
  const { product, fallbackImage, isPriority, currency, locale, showVariants = true, onVariantClick } = props;
  const [selectedVariant, setSelectedVariant] = useState(null);
  const handleVariantSelect = useCallback((variant) => {
    setSelectedVariant(variant);
    onVariantClick == null ? void 0 : onVariantClick(variant);
  }, [onVariantClick]);
  const name = (product == null ? void 0 : product.name) ?? "Unnamed product";
  const picked = selectedVariant ? ((_a = product == null ? void 0 : product.variant_images) == null ? void 0 : _a.find((v) => v.url === selectedVariant.url)) ?? ((_b = product == null ? void 0 : product.variant_images) == null ? void 0 : _b.find((v) => v.variant_id != null && v.variant_id === selectedVariant.variant_id)) ?? null : null;
  const url = safeHref(picked == null ? void 0 : picked.link_url) ?? safeHref(product == null ? void 0 : product.url);
  const shown = picked ?? ((_c = product == null ? void 0 : product.variant_images) == null ? void 0 : _c.find((v) => v.url === (product == null ? void 0 : product.image_url))) ?? null;
  const brand = (product == null ? void 0 : product.brand) ?? null;
  const rating = resolveProductRating(product);
  const savePct = computeSavePercent(product);
  const inner = jsxs(Fragment, { children: [savePct !== null ? jsxs("span", { className: "omniguide-product-tile__save-badge", children: ["Save ", savePct, "%"] }) : null, jsx(ProductImage, { product, fallbackImage, isPriority, overrideImageUrl: (picked == null ? void 0 : picked.url) ?? null }), jsx(FlagBadges, { flags: product == null ? void 0 : product.flags }), brand ? jsx("p", { className: "omniguide-product-tile__brand", children: brand }) : null, jsx("h3", { className: "omniguide-product-tile__name", children: name }), jsx(PriceBlock, { product, currency, locale }), rating ? jsx(ProductTileRating, { rating }) : null, showVariants && ((_d = product == null ? void 0 : product.variant_images) == null ? void 0 : _d.length) ? jsx(VariantSwatches, { variants: product.variant_images, selectedVariantId: (shown == null ? void 0 : shown.variant_id) ?? null, onSelect: handleVariantSelect }) : null] });
  if (url) {
    return jsx("article", { className: "omniguide-product-tile", children: jsx("a", { className: "omniguide-product-tile__link", href: url, children: inner }) });
  }
  return jsx("article", { className: "omniguide-product-tile", children: inner });
}
const ProductTile = memo(ProductTileImpl);
ProductTile.displayName = "ProductTile";
function computeSavePercent(product) {
  const markdown = markdownOf(product);
  return markdown ? savePercent(markdown.was, markdown.now) : null;
}
const F_PARAM_PATTERN = /^f\[([^\]]+)\]$/;
const SLUG_PREFIX = "f.";
function parseIntList(raw) {
  if (!raw)
    return [];
  return raw.split(",").map((s) => s.trim()).filter((s) => s.length > 0).map((s) => Number.parseInt(s, 10)).filter((n) => Number.isFinite(n));
}
function parseStringList(raw) {
  if (!raw)
    return [];
  return raw.split(",").map((s) => s.trim()).filter((s) => s.length > 0);
}
function parseNumber(raw) {
  if (raw == null || raw === "")
    return void 0;
  const n = Number.parseFloat(raw);
  return Number.isFinite(n) ? n : void 0;
}
function parseFilters(input) {
  let params;
  if (input instanceof URLSearchParams) {
    params = input;
  } else if (input instanceof URL) {
    params = input.searchParams;
  } else {
    try {
      params = new URL(input, "http://_local").searchParams;
    } catch {
      params = new URLSearchParams(input.startsWith("?") ? input.slice(1) : input);
    }
  }
  const filters = { f: /* @__PURE__ */ Object.create(null), uc: [], flag: [] };
  for (const [key, value] of params.entries()) {
    const fMatch = key.match(F_PARAM_PATTERN);
    if (fMatch) {
      const attrKey = fMatch[1];
      if (!attrKey)
        continue;
      filters.f[attrKey] = [.../* @__PURE__ */ new Set([...filters.f[attrKey] ?? [], ...parseIntList(value)])];
      continue;
    }
    const slugKey = key.startsWith(SLUG_PREFIX) ? key.slice(SLUG_PREFIX.length) : "";
    if (slugKey) {
      filters.f[slugKey] = [.../* @__PURE__ */ new Set([...filters.f[slugKey] ?? [], ...parseStringList(value)])];
      continue;
    }
    switch (key) {
      case "uc":
        filters.uc = parseIntList(value);
        break;
      case "flag":
        filters.flag = parseStringList(value);
        break;
      case "price_min": {
        const n = parseNumber(value);
        if (n !== void 0)
          filters.priceMin = n;
        break;
      }
      case "price_max": {
        const n = parseNumber(value);
        if (n !== void 0)
          filters.priceMax = n;
        break;
      }
      case "sort":
        if (value)
          filters.sort = value;
        break;
      case "cursor":
        if (value)
          filters.cursor = value;
        break;
    }
  }
  return filters;
}
function buildCanonicalQuery(filters) {
  const entries = [];
  if (filters.cursor)
    entries.push(["cursor", filters.cursor]);
  for (const attr of Object.keys(filters.f).sort()) {
    const tokens = filters.f[attr] ?? [];
    const ids = tokens.filter((t) => typeof t === "number").sort((a, b) => a - b);
    const slugs = tokens.filter((t) => typeof t === "string").sort();
    if (ids.length > 0)
      entries.push([`f[${attr}]`, ids.join(",")]);
    if (slugs.length > 0)
      entries.push([`s[${attr}]`, slugs.join(",")]);
  }
  if (filters.flag.length > 0) {
    const sorted = [...filters.flag].sort();
    entries.push(["flag", sorted.join(",")]);
  }
  if (filters.priceMax !== void 0)
    entries.push(["price_max", String(filters.priceMax)]);
  if (filters.priceMin !== void 0)
    entries.push(["price_min", String(filters.priceMin)]);
  if (filters.sort)
    entries.push(["sort", filters.sort]);
  if (filters.uc.length > 0) {
    const sorted = [...filters.uc].sort((a, b) => a - b);
    entries.push(["uc", sorted.join(",")]);
  }
  entries.sort(([a], [b]) => a < b ? -1 : a > b ? 1 : 0);
  if (entries.length === 0)
    return "";
  const params = new URLSearchParams();
  for (const [key, value] of entries) {
    params.append(key, value);
  }
  return `?${params.toString()}`;
}
function buildUrl(base, filters) {
  const url = new URL(base, "http://_local");
  url.search = buildCanonicalQuery(filters);
  return url;
}
function pushFilters(filters) {
  if (typeof window === "undefined" || typeof window.history === "undefined")
    return;
  window.history.pushState(null, "", mergeFilterQuery(window.location.href, filters));
}
const PLP_KEYS = /* @__PURE__ */ new Set(["uc", "flag", "price_min", "price_max", "sort", "cursor"]);
function mergeFilterQuery(href, filters) {
  const url = new URL(href, "http://_local");
  for (const key of [...url.searchParams.keys()]) {
    if (PLP_KEYS.has(key) || key.startsWith(SLUG_PREFIX) || F_PARAM_PATTERN.test(key)) {
      url.searchParams.delete(key);
    }
  }
  const set = (key, value) => {
    if (value !== void 0 && value !== "")
      url.searchParams.append(key, String(value));
  };
  for (const [attr, tokens] of Object.entries(filters.f)) {
    set(`f[${attr}]`, tokens.filter((t) => typeof t === "number").join(","));
    set(`${SLUG_PREFIX}${attr}`, tokens.filter((t) => typeof t === "string").join(","));
  }
  set("uc", filters.uc.join(","));
  set("flag", filters.flag.join(","));
  set("price_min", filters.priceMin);
  set("price_max", filters.priceMax);
  set("sort", filters.sort);
  return `${url.pathname}${url.search}${url.hash}`;
}
function scrollListToTop(list, { onlyIfPast = false, instant = false } = {}) {
  if (!list || typeof list.scrollIntoView !== "function")
    return;
  if (onlyIfPast && list.getBoundingClientRect().top >= scrollMargin(list))
    return;
  list.scrollIntoView({ behavior: instant || prefersReducedMotion() ? "auto" : "smooth", block: "start" });
}
function scrollMargin(list) {
  return parseFloat(getComputedStyle(list).scrollMarginTop) || 0;
}
function prefersReducedMotion() {
  return typeof window !== "undefined" && typeof window.matchMedia === "function" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}
const ALLOWED_TAGS = ["p", "br", "b", "strong", "i", "em", "u", "ul", "ol", "li", "a", "span", "small", "sub", "sup", "h2", "h3", "h4"];
const ALLOWED_ATTR = ["href", "target", "rel"];
const ENVELOPE_PREFIX = /^\s*Name:[^\n]*\n\s*Description:\s*/;
const CHILD_PRODUCTS_MARKER = /\n?\s*Child Products:/;
function extractDescriptionBody(raw) {
  const startMatch = raw.match(ENVELOPE_PREFIX);
  if (!startMatch || startMatch.index === void 0)
    return raw;
  const afterStart = raw.slice(startMatch.index + startMatch[0].length);
  const endMatch = afterStart.match(CHILD_PRODUCTS_MARKER);
  const body = endMatch && endMatch.index !== void 0 ? afterStart.slice(0, endMatch.index) : afterStart;
  return body.trim();
}
function sanitize(html) {
  if (typeof window === "undefined" || typeof purify.sanitize !== "function") {
    return html.replace(/<[^>]*>/g, "");
  }
  return purify.sanitize(html, { ALLOWED_TAGS, ALLOWED_ATTR });
}
function CategoryHeaderImpl({ category, wizardSlot }) {
  const name = category == null ? void 0 : category.name;
  const description = category == null ? void 0 : category.description;
  const sanitized = useMemo(() => description ? sanitize(extractDescriptionBody(description)) : "", [description]);
  const contentRef = useRef(null);
  const [overflowing, setOverflowing] = useState(null);
  const [expanded, setExpanded] = useState(false);
  useEffect(() => {
    const el = contentRef.current;
    if (!el)
      return;
    const measure = () => {
      const s = el.style;
      const prev = {
        display: s.display,
        webkitBoxOrient: s.getPropertyValue("-webkit-box-orient"),
        webkitLineClamp: s.getPropertyValue("-webkit-line-clamp"),
        overflow: s.overflow
      };
      s.display = "-webkit-box";
      s.setProperty("-webkit-box-orient", "vertical");
      s.setProperty("-webkit-line-clamp", "3");
      s.overflow = "hidden";
      const overflows = el.scrollHeight - el.clientHeight > 1;
      s.display = prev.display;
      s.setProperty("-webkit-box-orient", prev.webkitBoxOrient);
      s.setProperty("-webkit-line-clamp", prev.webkitLineClamp);
      s.overflow = prev.overflow;
      setOverflowing(overflows);
    };
    measure();
    if (typeof ResizeObserver === "undefined")
      return;
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, [sanitized]);
  if (!name && !sanitized && !wizardSlot)
    return null;
  const clamped = overflowing === true && !expanded;
  return jsxs("header", { className: "omniguide-product-list__header", children: [wizardSlot, name ? jsx("h1", { className: "omniguide-product-list__title", children: name }) : null, sanitized ? jsxs("div", { className: "omniguide-product-list__description", "data-expanded": clamped ? "false" : "true", children: [jsx("div", { ref: contentRef, className: "omniguide-product-list__description-content", dangerouslySetInnerHTML: { __html: sanitized } }), overflowing === true ? jsx("button", { type: "button", className: "omniguide-product-list__description-toggle", "aria-expanded": expanded, onClick: () => setExpanded((v) => !v), children: expanded ? "Read less" : "Read more" }) : null] }) : null] });
}
const CategoryHeader = memo(CategoryHeaderImpl);
function ProductGridImpl({ products, fallbackImage, currency, locale, priorityCount = 6, showVariants = true }) {
  return jsx("ul", { className: "omniguide-product-list__grid", children: products.map((product, index) => {
    const id = (product == null ? void 0 : product.id) ?? index;
    return jsx("li", { className: "omniguide-product-list__grid-item", children: jsx(ProductTile, { product, fallbackImage, isPriority: index < priorityCount, currency, locale, showVariants }) }, String(id));
  }) });
}
const ProductGrid = memo(ProductGridImpl);
const SORT_VALUES = [
  "relevance",
  "price_asc",
  "price_desc",
  "newest",
  "rating"
];
const DEFAULT_LABELS = {
  relevance: "Relevance",
  price_asc: "Price: Low to High",
  price_desc: "Price: High to Low",
  newest: "Newest",
  rating: "Top Rated"
};
function SortSelectImpl({ value, onChange, labels, legend = "Sort by", disabled }) {
  const selectId = useId();
  const handleChange = useCallback((event) => {
    onChange(event.target.value);
  }, [onChange]);
  return jsxs("div", { className: "omniguide-product-list__sort", children: [jsx("label", { className: "omniguide-product-list__sort-label", htmlFor: selectId, children: legend }), jsx("select", { id: selectId, className: "omniguide-product-list__sort-select", value, onChange: handleChange, disabled, children: SORT_VALUES.map((sort) => jsx("option", { value: sort, children: (labels == null ? void 0 : labels[sort]) ?? DEFAULT_LABELS[sort] }, sort)) })] });
}
const SortSelect = memo(SortSelectImpl);
function defaultFormatResultCount(count) {
  if (count === 1)
    return "1 result";
  return `${count.toLocaleString()} results`;
}
function ToolbarImpl({ resultCount, sort, formatResultCount = defaultFormatResultCount }) {
  const filterToggleId = useId();
  return jsxs("div", { className: "omniguide-product-list__toolbar", children: [jsx("input", { type: "checkbox", id: filterToggleId, className: "omniguide-product-list__filter-toggle" }), jsxs("label", { htmlFor: filterToggleId, className: "omniguide-product-list__filter-toggle-label", children: [jsx("span", { children: "Filter Products" }), jsx("svg", { className: "omniguide-product-list__filter-toggle-chevron", width: "14", height: "14", viewBox: "0 0 12 12", fill: "none", stroke: "currentColor", strokeWidth: "1.5", "aria-hidden": "true", children: jsx("path", { d: "M3 4.5L6 7.5L9 4.5" }) })] }), jsx("div", { className: "omniguide-product-list__result-count", children: typeof resultCount === "number" ? formatResultCount(resultCount) : null }), jsx(SortSelect, { ...sort })] });
}
const Toolbar = memo(ToolbarImpl);
function valueKey(value, fallback) {
  const id = value == null ? void 0 : value.value_id;
  if (typeof id === "string" || typeof id === "number")
    return String(id);
  if (typeof (value == null ? void 0 : value.value) === "string" || typeof (value == null ? void 0 : value.value) === "number") {
    return String(value.value);
  }
  return String(fallback);
}
function isSelected(value, selection) {
  if ((value == null ? void 0 : value.selected) === true)
    return true;
  if (selection.kind === "flag") {
    const v = value == null ? void 0 : value.value;
    return typeof v === "string" && selection.values.includes(v);
  }
  const id = value == null ? void 0 : value.value_id;
  const ids = selection.valueIds;
  return typeof id === "number" && ids.includes(id) || selection.kind === "attribute" && !!(value == null ? void 0 : value.slug) && ids.includes(value.slug);
}
function groupFacetValues(values, selection) {
  const groups = {
    selected: [],
    available: [],
    unavailable: []
  };
  for (const value of values) {
    if (isSelected(value, selection)) {
      groups.selected.push(value);
      continue;
    }
    if ((value == null ? void 0 : value.count) === 0) {
      groups.unavailable.push(value);
      continue;
    }
    groups.available.push(value);
  }
  return groups;
}
function toggleSelection(value, selection) {
  if (selection.kind === "flag") {
    const v = value == null ? void 0 : value.value;
    if (typeof v !== "string")
      return selection;
    const exists2 = selection.values.includes(v);
    return {
      kind: "flag",
      values: exists2 ? selection.values.filter((entry) => entry !== v) : [...selection.values, v]
    };
  }
  const id = value == null ? void 0 : value.value_id;
  if (typeof id !== "number")
    return selection;
  if (selection.kind === "attribute") {
    const forms = [id, value.slug].filter((t) => t != null);
    const kept = selection.valueIds.filter((entry) => !forms.includes(entry));
    const valueIds = kept.length < selection.valueIds.length ? kept : [...kept, value.slug ?? id];
    return { kind: "attribute", key: selection.key, valueIds };
  }
  const exists = selection.valueIds.includes(id);
  const nextIds = exists ? selection.valueIds.filter((entry) => entry !== id) : [...selection.valueIds, id];
  return { kind: "use_case", valueIds: nextIds };
}
function MultiSelectFacetImpl({ facet, selected, onChange, inlineLimit = 10, disabled }) {
  const values = (facet == null ? void 0 : facet.values) ?? [];
  const grouped = useMemo(() => groupFacetValues(values, selected), [values, selected]);
  const inlineRows = useMemo(() => [...grouped.selected, ...grouped.available].slice(0, Math.max(inlineLimit, grouped.selected.length)), [grouped, inlineLimit]);
  const inlineAvailableShown = Math.max(0, inlineRows.length - grouped.selected.length);
  const overflowCount = grouped.available.length - inlineAvailableShown;
  const [unavailableOpen, setUnavailableOpen] = useState(false);
  const unavailableId = useId();
  const bodyId = useId();
  const userToggledRef = useRef(false);
  const [facetOpen, setFacetOpen] = useState(false);
  useEffect(() => {
    if (typeof window === "undefined" || typeof window.matchMedia !== "function") {
      return;
    }
    const mql = window.matchMedia("(max-width: 720px)");
    const apply = (matches) => {
      if (userToggledRef.current)
        return;
      if (matches)
        setFacetOpen(false);
    };
    apply(mql.matches);
    const handler = (e) => apply(e.matches);
    mql.addEventListener("change", handler);
    return () => mql.removeEventListener("change", handler);
  }, []);
  const handleToggleFacet = () => {
    userToggledRef.current = true;
    setFacetOpen((prev) => !prev);
  };
  const selectedCount = grouped.selected.length;
  if (grouped.selected.length === 0 && grouped.available.length === 0 && grouped.unavailable.length === 0) {
    return null;
  }
  const renderRow = (value, index) => {
    const id = valueKey(value, index);
    const checked = isSelected(value, selected);
    const rawValue = value == null ? void 0 : value.value;
    const fallbackLabel = typeof rawValue === "string" || typeof rawValue === "number" ? String(rawValue) : "";
    const label = (value == null ? void 0 : value.label) ?? fallbackLabel;
    const count = typeof (value == null ? void 0 : value.count) === "number" ? value.count : null;
    const rowZeroDisabled = count === 0 && !checked;
    const inputDisabled = rowZeroDisabled || disabled === true;
    const rowClassName = rowZeroDisabled ? "omniguide-product-list__facet-row omniguide-product-list__facet-row--disabled" : "omniguide-product-list__facet-row";
    return jsx("li", { className: "omniguide-product-list__facet-item", children: jsxs("label", { className: rowClassName, "aria-disabled": rowZeroDisabled || void 0, children: [jsx("input", { type: "checkbox", className: "omniguide-product-list__facet-checkbox", checked, disabled: inputDisabled, onChange: () => onChange(toggleSelection(value, selected)) }), jsx("span", { className: "omniguide-product-list__facet-label-text", children: label }), count !== null ? jsx("span", { className: "omniguide-product-list__facet-count", children: count }) : null] }) }, id);
  };
  const rawTitle = facet.label ?? facet.key;
  const title = rawTitle.charAt(0).toUpperCase() + rawTitle.slice(1);
  const fieldsetClassName = facetOpen ? "omniguide-product-list__facet omniguide-product-list__facet--multiselect" : "omniguide-product-list__facet omniguide-product-list__facet--multiselect omniguide-product-list__facet--collapsed";
  return (
    // We intentionally do NOT pass `disabled` to the <fieldset> — per spec
    // a disabled fieldset disables ALL descendant form controls, including
    // our title disclosure button, and there is no per-button override.
    // That would lock the user out of expanding a collapsed-by-default
    // mobile facet during a refetch. Instead we forward `disabled` only
    // to the row inputs and the unavailable-disclosure button, which is
    // the actual interaction we want to freeze.
    jsxs("fieldset", { className: fieldsetClassName, "aria-busy": disabled || void 0, children: [jsx("legend", { className: "omniguide-product-list__facet-legend omniguide-product-list__facet-legend--sr-only", children: title }), jsxs("button", { type: "button", className: "omniguide-product-list__facet-title", "aria-expanded": facetOpen, "aria-controls": bodyId, onClick: handleToggleFacet, children: [jsx("span", { className: "omniguide-product-list__facet-title-text", children: title }), selectedCount > 0 ? jsx("span", { className: "omniguide-product-list__facet-active-count", "aria-label": `${selectedCount} selected`, children: selectedCount }) : null, jsx("span", { className: "omniguide-product-list__facet-chevron", "aria-hidden": "true" })] }), jsx("div", { id: bodyId, className: "omniguide-product-list__facet-body", "aria-hidden": !facetOpen, children: jsxs("div", { className: "omniguide-product-list__facet-body-inner", children: [grouped.selected.length > 0 ? jsx("div", { className: "omniguide-product-list__facet-section-label", "aria-hidden": "true", children: "Selected" }) : null, jsx("ul", { className: "omniguide-product-list__facet-list", children: inlineRows.map((value, index) => renderRow(value, index)) }), overflowCount > 0 ? jsxs("p", { className: "omniguide-product-list__facet-more", children: ["+ ", overflowCount, " more"] }) : null, grouped.unavailable.length > 0 ? jsxs(Fragment, { children: [jsx("div", { role: "separator", className: "omniguide-product-list__facet-divider", "aria-hidden": "true" }), jsxs("button", { type: "button", className: "omniguide-product-list__facet-unavailable-toggle", "aria-expanded": unavailableOpen, "aria-controls": unavailableId, disabled, onClick: () => setUnavailableOpen((prev) => !prev), children: [unavailableOpen ? "Hide" : "Show", " unavailable options (", grouped.unavailable.length, ")"] }), unavailableOpen ? jsxs(Fragment, { children: [jsx("div", { className: "omniguide-product-list__facet-section-label", "aria-hidden": "true", children: "Unavailable with current filters" }), jsx("ul", { id: unavailableId, className: "omniguide-product-list__facet-list omniguide-product-list__facet-unavailable-list", children: grouped.unavailable.map((value, index) => renderRow(value, index)) })] }) : null] }) : null] }) })] })
  );
}
const MultiSelectFacet = memo(MultiSelectFacetImpl);
function toInput(value) {
  return typeof value === "number" && Number.isFinite(value) ? String(value) : "";
}
function parseInput(raw) {
  const trimmed = raw.trim();
  if (trimmed === "")
    return void 0;
  const parsed = Number(trimmed);
  return Number.isFinite(parsed) ? parsed : void 0;
}
function PriceRangeFacetImpl({ facet, value, onChange, currencySymbol = "$", disabled, invertedMessage = "Min must be less than or equal to Max." }) {
  const [minDraft, setMinDraft] = useState(() => toInput(value == null ? void 0 : value.min));
  const [maxDraft, setMaxDraft] = useState(() => toInput(value == null ? void 0 : value.max));
  const [invalid, setInvalid] = useState(false);
  useEffect(() => {
    setMinDraft(toInput(value == null ? void 0 : value.min));
  }, [value == null ? void 0 : value.min]);
  useEffect(() => {
    setMaxDraft(toInput(value == null ? void 0 : value.max));
  }, [value == null ? void 0 : value.max]);
  const apply = useCallback(() => {
    const next = {
      min: parseInput(minDraft),
      max: parseInput(maxDraft)
    };
    if (typeof next.min === "number" && typeof next.max === "number" && next.min > next.max) {
      setInvalid(true);
      return;
    }
    setInvalid(false);
    if (next.min !== (value == null ? void 0 : value.min) || next.max !== (value == null ? void 0 : value.max)) {
      onChange(next);
    }
  }, [minDraft, maxDraft, onChange, value == null ? void 0 : value.min, value == null ? void 0 : value.max]);
  const onMinChange = useCallback((next) => {
    setMinDraft(next);
    if (invalid)
      setInvalid(false);
  }, [invalid]);
  const onMaxChange = useCallback((next) => {
    setMaxDraft(next);
    if (invalid)
      setInvalid(false);
  }, [invalid]);
  const errorId = invalid ? "omniguide-price-range-error" : void 0;
  return jsxs("fieldset", { className: "omniguide-product-list__facet omniguide-product-list__facet--price", disabled, children: [jsx("legend", { className: "omniguide-product-list__facet-legend omniguide-product-list__facet-legend--sr-only", children: facet.label ?? "Price" }), jsx("div", { className: "omniguide-product-list__facet-title", "aria-hidden": "true", children: facet.label ?? "Price" }), jsxs("div", { className: "omniguide-product-list__price-inputs", children: [jsxs("label", { className: "omniguide-product-list__price-field", children: [jsxs("span", { className: "omniguide-product-list__price-label", children: ["Min (", currencySymbol, ")"] }), jsx("input", { type: "number", inputMode: "decimal", min: 0, value: minDraft, onChange: (event) => onMinChange(event.target.value), onBlur: apply, "aria-invalid": invalid || void 0, "aria-describedby": errorId, className: "omniguide-product-list__price-input" })] }), jsxs("label", { className: "omniguide-product-list__price-field", children: [jsxs("span", { className: "omniguide-product-list__price-label", children: ["Max (", currencySymbol, ")"] }), jsx("input", { type: "number", inputMode: "decimal", min: 0, value: maxDraft, onChange: (event) => onMaxChange(event.target.value), onBlur: apply, "aria-invalid": invalid || void 0, "aria-describedby": errorId, className: "omniguide-product-list__price-input" })] })] }), invalid ? jsx("p", { id: errorId, className: "omniguide-product-list__price-error", role: "alert", children: invertedMessage }) : null, jsx("button", { type: "button", className: "omniguide-product-list__price-apply", onClick: apply, disabled, "aria-label": "Apply price filter", children: "Apply" })] });
}
const PriceRangeFacet = memo(PriceRangeFacetImpl);
function applyMultiSelect(filters, next) {
  if (next.kind === "attribute") {
    const f = { ...filters.f };
    if (next.valueIds.length === 0) {
      delete f[next.key];
    } else {
      f[next.key] = next.valueIds;
    }
    return { ...filters, f };
  }
  if (next.kind === "use_case") {
    return { ...filters, uc: next.valueIds };
  }
  return { ...filters, flag: next.values };
}
function selectionFor(facet, filters) {
  var _a;
  if (facet.type === "use_case") {
    return { kind: "use_case", valueIds: filters.uc ?? [] };
  }
  if (facet.type === "flag") {
    return { kind: "flag", values: filters.flag ?? [] };
  }
  return {
    kind: "attribute",
    key: facet.key,
    valueIds: ((_a = filters.f) == null ? void 0 : _a[facet.key]) ?? []
  };
}
function FacetSidebarImpl({ facets, filters, onChange, disabled, inlineLimit }) {
  if (!facets || facets.length === 0)
    return null;
  return jsx("div", { className: "omniguide-product-list__facets", "aria-label": "Filters", children: facets.map((facet) => {
    const key = `${facet.type}:${facet.key}`;
    switch (facet.type) {
      case "price":
      case "price_range":
        return jsx(PriceRangeFacet, { facet, value: { min: filters.priceMin, max: filters.priceMax }, onChange: (next) => onChange({
          ...filters,
          priceMin: next.min,
          priceMax: next.max
        }), disabled }, key);
      case "attribute":
      case "use_case":
      case "flag":
        return jsx(MultiSelectFacet, { facet, selected: selectionFor(facet, filters), onChange: (next) => onChange(applyMultiSelect(filters, next)), inlineLimit, disabled }, key);
      default:
        return null;
    }
  }) });
}
const FacetSidebar = memo(FacetSidebarImpl);
function LoadMoreImpl({ cursor, onLoadMore, loading, label = "Load more", loadingLabel = "Loading…" }) {
  const handleClick = useCallback(() => {
    if (cursor)
      onLoadMore(cursor);
  }, [cursor, onLoadMore]);
  if (!cursor)
    return null;
  return jsx("div", { className: "omniguide-product-list__load-more", children: jsx("button", { type: "button", className: "omniguide-product-list__load-more-button", onClick: handleClick, disabled: loading, "aria-busy": loading || void 0, children: loading ? loadingLabel : label }) });
}
const LoadMore = memo(LoadMoreImpl);
function PaginationImpl({ page, totalPages, hasPrev, hasNext, onPrev, onNext, loading }) {
  const handlePrev = useCallback((e) => {
    scrollListToTop(e.currentTarget.closest(".omniguide-product-list"));
    onPrev();
  }, [onPrev]);
  const handleNext = useCallback((e) => {
    scrollListToTop(e.currentTarget.closest(".omniguide-product-list"));
    onNext();
  }, [onNext]);
  if (!hasPrev && !hasNext)
    return null;
  const label = totalPages && totalPages > 0 ? `Page ${String(page)} of ${String(totalPages)}` : `Page ${String(page)}`;
  return jsxs("nav", { className: "omniguide-product-list__pagination", "aria-label": "Pagination", children: [hasPrev ? jsxs("button", { type: "button", className: "omniguide-product-list__pagination-button omniguide-product-list__pagination-button--prev", onClick: handlePrev, disabled: loading, "aria-busy": loading || void 0, children: [jsx("span", { "aria-hidden": "true", children: "‹" }), " Previous"] }) : null, jsx("span", { className: "omniguide-product-list__pagination-status", "aria-live": "polite", children: label }), jsxs("button", { type: "button", className: "omniguide-product-list__pagination-button omniguide-product-list__pagination-button--next", onClick: handleNext, disabled: !hasNext || loading, "aria-busy": loading || void 0, children: ["Next ", jsx("span", { "aria-hidden": "true", children: "›" })] })] });
}
const Pagination = memo(PaginationImpl);
Pagination.displayName = "Pagination";
function RedirectDrilldownImpl({ items, onChildClick, facetTitle }) {
  if (!items || items.length === 0)
    return null;
  if (facetTitle) {
    return jsx(DrilldownFacet, { items, onChildClick, title: facetTitle });
  }
  return jsx("nav", { className: "omniguide-product-list__drilldown", "aria-label": "Subcategories", children: jsx("ul", { className: "omniguide-product-list__drilldown-list", children: items.map((child, index) => {
    const id = (child == null ? void 0 : child.id) ?? index;
    const url = safeHref(typeof (child == null ? void 0 : child.url) === "string" ? child.url : void 0);
    const name = (child == null ? void 0 : child.name) ?? `Category ${String(id)}`;
    const productCount = typeof (child == null ? void 0 : child.product_count) === "number" ? child.product_count : null;
    const handleClick = onChildClick ? (event) => {
      event.preventDefault();
      onChildClick(child);
    } : void 0;
    return jsx("li", { className: "omniguide-product-list__drilldown-item", children: url ? jsxs("a", { className: "omniguide-product-list__drilldown-link", href: url, onClick: handleClick, children: [jsx("span", { className: "omniguide-product-list__drilldown-name", children: name }), productCount !== null ? jsxs("span", { className: "omniguide-product-list__drilldown-count", children: ["(", productCount, ")"] }) : null] }) : jsx("span", { className: "omniguide-product-list__drilldown-name", children: name }) }, String(id));
  }) }) });
}
function DrilldownFacet({ items, onChildClick, title }) {
  const [open, setOpen] = useState(true);
  const bodyId = useId();
  const className = open ? "omniguide-product-list__facet omniguide-product-list__facet--drilldown" : "omniguide-product-list__facet omniguide-product-list__facet--drilldown omniguide-product-list__facet--collapsed";
  return jsxs("nav", { className, "aria-label": title, children: [jsxs("button", { type: "button", className: "omniguide-product-list__facet-title", "aria-expanded": open, "aria-controls": bodyId, onClick: () => setOpen((prev) => !prev), children: [jsx("span", { className: "omniguide-product-list__facet-title-text", children: title }), jsx("span", { className: "omniguide-product-list__facet-chevron", "aria-hidden": "true" })] }), jsx("div", { id: bodyId, className: "omniguide-product-list__facet-body", "aria-hidden": !open, children: jsx("div", { className: "omniguide-product-list__facet-body-inner", children: jsx("ul", { className: "omniguide-product-list__facet-list", children: items.map((child, index) => jsx(DrilldownFacetRow, { child, onChildClick }, String((child == null ? void 0 : child.id) ?? index))) }) }) })] });
}
function DrilldownFacetRow({ child, onChildClick }) {
  const url = safeHref(typeof (child == null ? void 0 : child.url) === "string" ? child.url : void 0);
  const content = jsxs(Fragment, { children: [jsx("span", { className: "omniguide-product-list__facet-label-text", children: (child == null ? void 0 : child.name) ?? "" }), typeof (child == null ? void 0 : child.product_count) === "number" ? jsx("span", { className: "omniguide-product-list__facet-count", children: child.product_count }) : null] });
  const handleClick = onChildClick ? (event) => {
    event.preventDefault();
    onChildClick(child);
  } : void 0;
  return jsx("li", { className: "omniguide-product-list__facet-item", children: url ? jsx("a", { className: "omniguide-product-list__facet-row omniguide-product-list__facet-row--link", href: url, onClick: handleClick, children: content }) : jsx("span", { className: "omniguide-product-list__facet-row", children: content }) });
}
const RedirectDrilldown = memo(RedirectDrilldownImpl);
function ProductListError(props) {
  const { onRetry, retryDisabled } = props;
  return jsxs("div", { className: "omniguide-product-list__error", role: "alert", children: [jsx("p", { className: "omniguide-product-list__error-text", children: "An error occurred while trying to perform this action." }), onRetry ? jsx("button", { type: "button", className: "omniguide-product-list__error-action", onClick: onRetry, disabled: retryDisabled, children: "Try again" }) : null] });
}
const EMPTY_CLEARED = { f: {}, uc: [], flag: [] };
function rememberLabels(seen, facets) {
  for (const facet of facets) {
    seen.set(`type:${facet.type}`, facet.key);
    if (facet.label)
      seen.set(facet.key, facet.label);
    for (const v of facet.values) {
      if (!v.label)
        continue;
      if (v.value_id != null)
        seen.set(`${facet.key}:${v.value_id}`, v.label);
      if (v.slug)
        seen.set(`${facet.key}\0${v.slug}`, v.label);
      if (typeof v.value === "string")
        seen.set(`${facet.key}:${v.value}`, v.label);
    }
  }
}
function seenLabel(seen, type, id) {
  return seen.get(`${seen.get(`type:${type}`)}:${id}`) ?? String(id);
}
function buildChips(filters, seen, onChange) {
  const chips = [];
  for (const [attrKey, valueIds] of Object.entries(filters.f ?? {})) {
    const facetLabel = seen.get(attrKey) ?? attrKey;
    for (const valueId of valueIds) {
      const sep = typeof valueId === "string" ? "\0" : ":";
      const valueLabel = seen.get(`${attrKey}${sep}${valueId}`) ?? String(valueId);
      chips.push({
        id: `f:${attrKey}${sep}${valueId}`,
        label: `${facetLabel}: ${valueLabel}`,
        onRemove: () => {
          const nextValues = (filters.f[attrKey] ?? []).filter((v) => v !== valueId);
          const nextF = { ...filters.f };
          if (nextValues.length === 0)
            delete nextF[attrKey];
          else
            nextF[attrKey] = nextValues;
          onChange({ ...filters, f: nextF, cursor: void 0 });
        }
      });
    }
  }
  for (const ucId of filters.uc ?? []) {
    const label = seenLabel(seen, "use_case", ucId);
    chips.push({
      id: `uc:${ucId}`,
      label,
      onRemove: () => onChange({
        ...filters,
        uc: (filters.uc ?? []).filter((u) => u !== ucId),
        cursor: void 0
      })
    });
  }
  for (const flagKey of filters.flag ?? []) {
    const label = seenLabel(seen, "flag", flagKey);
    chips.push({
      id: `flag:${flagKey}`,
      label,
      onRemove: () => onChange({
        ...filters,
        flag: (filters.flag ?? []).filter((f) => f !== flagKey),
        cursor: void 0
      })
    });
  }
  if (filters.priceMin !== void 0 || filters.priceMax !== void 0) {
    const min = filters.priceMin !== void 0 ? `$${filters.priceMin}` : "";
    const max = filters.priceMax !== void 0 ? `$${filters.priceMax}` : "";
    const label = min && max ? `${min} – ${max}` : min ? `${min}+` : `up to ${max}`;
    chips.push({
      id: "price",
      label: `Price: ${label}`,
      onRemove: () => onChange({
        ...filters,
        priceMin: void 0,
        priceMax: void 0,
        cursor: void 0
      })
    });
  }
  return chips;
}
function ActiveFiltersImpl({ filters, facets, onChange, disabled }) {
  const seen = useRef(/* @__PURE__ */ new Map()).current;
  rememberLabels(seen, facets);
  const listRef = useRef(null);
  const rootRef = useRef(null);
  const refocusAt = useRef(null);
  const sawBusy = useRef(false);
  useEffect(() => {
    var _a, _b;
    const at = refocusAt.current;
    if (at === null)
      return;
    if (disabled)
      sawBusy.current = true;
    if (disabled || !sawBusy.current)
      return;
    refocusAt.current = null;
    sawBusy.current = false;
    const buttons = (_a = listRef.current) == null ? void 0 : _a.querySelectorAll("button");
    const target = (buttons == null ? void 0 : buttons.length) ? buttons[Math.min(at, buttons.length - 1)] : (_b = rootRef.current) == null ? void 0 : _b.querySelector(".omniguide-product-list__sort-select");
    target == null ? void 0 : target.focus();
  });
  const chips = buildChips(filters, seen, onChange);
  if (chips.length === 0)
    return null;
  const handleClearAll = () => {
    onChange({ ...EMPTY_CLEARED, sort: filters.sort });
  };
  return jsxs("div", { className: "omniguide-product-list__active-filters", role: "region", "aria-label": "Active filters", children: [jsx("ul", { className: "omniguide-product-list__chips", ref: listRef, children: chips.map((chip, i) => jsxs("li", { className: "omniguide-product-list__chip", children: [jsx("span", { className: "omniguide-product-list__chip-label", children: chip.label }), jsx("button", { type: "button", className: "omniguide-product-list__chip-remove", "aria-label": `Remove filter: ${chip.label}`, disabled, onClick: (e) => {
    rootRef.current = e.currentTarget.closest(".omniguide-product-list");
    refocusAt.current = i;
    chip.onRemove();
  }, children: "×" })] }, chip.id)) }), jsx("button", { type: "button", className: "omniguide-product-list__clear-all", disabled, onClick: handleClearAll, children: "Clear all" })] });
}
const ActiveFilters = memo(ActiveFiltersImpl);
ActiveFilters.displayName = "ActiveFilters";
const KNOWN_SORTS = new Set(SORT_VALUES);
const EMPTY_FILTERS$3 = { f: {}, uc: [], flag: [] };
function hasActiveFilters(filters) {
  if (Object.keys(filters.f ?? {}).length > 0)
    return true;
  if ((filters.uc ?? []).length > 0)
    return true;
  if ((filters.flag ?? []).length > 0)
    return true;
  if (filters.priceMin !== void 0 || filters.priceMax !== void 0)
    return true;
  return false;
}
function resolveSort(data, override) {
  if ((override == null ? void 0 : override.sort) && KNOWN_SORTS.has(override.sort)) {
    return override.sort;
  }
  const fromData = data == null ? void 0 : data.sort;
  if (typeof fromData === "string" && KNOWN_SORTS.has(fromData)) {
    return fromData;
  }
  return "relevance";
}
function ProductListContainer(props) {
  var _a, _b, _c, _d;
  const { data, fallbackImage, currency, locale, priorityCount, filters, onFiltersChange, filtersDisabled, onLoadMore, loadMoreLoading, pageInfo, onRedirect, onChildCategoryClick, error, onRetry, showCategoryHeader = true, drilldownPlacement = "top", recommendationFilter, formatResultCount } = props;
  const products = (data == null ? void 0 : data.products) ?? [];
  const totalEstimate = (_a = data == null ? void 0 : data.pagination) == null ? void 0 : _a.total_estimate;
  const recActive = !!(recommendationFilter == null ? void 0 : recommendationFilter.active);
  const interactive = typeof onFiltersChange === "function" && !recActive;
  const currentFilters = filters ?? EMPTY_FILTERS$3;
  const redirectTo = ((_b = data == null ? void 0 : data.category) == null ? void 0 : _b.redirect_to) ?? null;
  const childCategories = ((_c = data == null ? void 0 : data.category) == null ? void 0 : _c.children) ?? [];
  const drilldownInSidebar = drilldownPlacement === "sidebar" && interactive;
  useEffect(() => {
    if (redirectTo && onRedirect)
      onRedirect(redirectTo);
  }, [redirectTo, onRedirect]);
  const listRef = useRef(null);
  const applyFilters = useCallback((next) => {
    if (!onFiltersChange)
      return;
    scrollListToTop(listRef.current, { onlyIfPast: true, instant: true });
    onFiltersChange(next);
  }, [onFiltersChange]);
  const handleSortChange = useCallback((next) => {
    applyFilters({ ...currentFilters, sort: next, cursor: void 0 });
  }, [applyFilters, currentFilters]);
  const handleFacetChange = useCallback((next) => {
    applyFilters({ ...next, cursor: void 0 });
  }, [applyFilters]);
  const handleClearAll = useCallback(() => {
    applyFilters({ ...EMPTY_FILTERS$3, sort: currentFilters.sort });
  }, [applyFilters, currentFilters.sort]);
  const filtersActive = hasActiveFilters(currentFilters);
  if (redirectTo) {
    return jsx("section", { className: "omniguide-product-list omniguide-product-list--redirecting", "aria-busy": "true" });
  }
  return jsx("div", { className: "omniguide", children: jsxs("section", { className: "omniguide-product-list", ref: listRef, children: [showCategoryHeader ? jsx(CategoryHeader, { category: (data == null ? void 0 : data.category) ?? {}, wizardSlot: jsx("div", { className: "omniguide-product-list__wizard" }) }) : null, childCategories.length > 0 && !drilldownInSidebar ? jsx(RedirectDrilldown, { items: childCategories, onChildClick: onChildCategoryClick }) : null, interactive ? jsx(Toolbar, { resultCount: typeof totalEstimate === "number" ? totalEstimate : products.length, formatResultCount, sort: {
    value: resolveSort(data, filters),
    onChange: handleSortChange,
    disabled: filtersDisabled
  } }) : null, interactive ? jsx(ActiveFilters, { filters: currentFilters, facets: (data == null ? void 0 : data.facets) ?? [], onChange: handleFacetChange, disabled: filtersDisabled }) : null, jsxs("div", { className: `omniguide-product-list__layout${interactive ? "" : " omniguide-product-list__layout--full"}`, children: [interactive ? jsxs("aside", { className: "omniguide-product-list__sidebar", children: [drilldownInSidebar ? jsx(RedirectDrilldown, { items: childCategories, onChildClick: onChildCategoryClick, facetTitle: "Categories" }) : null, jsx(FacetSidebar, { facets: (data == null ? void 0 : data.facets) ?? [], filters: currentFilters, onChange: handleFacetChange, disabled: filtersDisabled })] }) : null, jsxs("div", { className: "omniguide-product-list__results", "aria-busy": filtersDisabled || void 0, "aria-live": "polite", children: [jsx("div", { className: "omniguide-product-list__results-wizard" }), recActive ? jsxs("div", { className: "omniguide-product-list__rec-banner", role: "status", children: [jsxs("span", { className: "omniguide-product-list__rec-banner-text", children: ["Showing a filtered subset of products based on your question", recommendationFilter ? ` — ${recommendationFilter.count} ${recommendationFilter.count === 1 ? "pick" : "picks"}` : "", "."] }), jsx("button", { type: "button", className: "omniguide-product-list__rec-banner-clear", onClick: recommendationFilter == null ? void 0 : recommendationFilter.onClear, children: "Show all products" })] }) : null, error ? jsx(ProductListError, { onRetry, retryDisabled: filtersDisabled }) : products.length === 0 ? jsxs("div", { className: "omniguide-product-list__empty", role: "status", children: [jsx("p", { className: "omniguide-product-list__empty-text", children: filtersActive ? "No products match these filters." : "No products available." }), filtersActive && interactive ? jsx("button", { type: "button", className: "omniguide-product-list__empty-action", onClick: handleClearAll, disabled: filtersDisabled, children: "Clear filters" }) : null] }) : jsxs(Fragment, { children: [jsx(ProductGrid, { products, fallbackImage, currency, locale, priorityCount }), recActive ? null : pageInfo ? jsx(Pagination, { page: pageInfo.page, totalPages: pageInfo.totalPages, hasPrev: pageInfo.hasPrev, hasNext: pageInfo.hasNext, onPrev: pageInfo.onPrev, onNext: pageInfo.onNext, loading: pageInfo.loading }) : onLoadMore ? jsx(LoadMore, { cursor: ((_d = data == null ? void 0 : data.pagination) == null ? void 0 : _d.next_cursor) ?? null, onLoadMore, loading: loadMoreLoading }) : null] })] })] })] }) });
}
const MAX_TILES = 200;
function tileCount(tiles) {
  if (!Number.isFinite(tiles))
    return 0;
  return Math.min(MAX_TILES, Math.max(0, Math.floor(tiles)));
}
function ProductListSkeleton({ tiles = 24, showCategoryHeader = true, showPagination = false }) {
  return jsxs("div", { className: "omniguide-product-list omniguide-product-list--loading omniguide-product-list-skeleton", "aria-busy": "true", children: [showCategoryHeader ? jsx("div", { className: "omniguide-product-list__header omniguide-product-list-skeleton__header" }) : null, jsx("div", { className: "omniguide-product-list__toolbar omniguide-product-list-skeleton__toolbar" }), jsxs("div", { className: "omniguide-product-list__layout", children: [jsx("div", { className: "omniguide-product-list__sidebar omniguide-product-list-skeleton__sidebar" }), jsxs("div", { className: "omniguide-product-list__results", children: [jsx("div", { className: "omniguide-product-list__grid", children: Array.from({ length: tileCount(tiles) }, (_, i) => jsx("div", { className: "omniguide-product-tile omniguide-product-list-skeleton__tile" }, i)) }), showPagination ? jsx("div", { className: "omniguide-product-list__pagination omniguide-product-list-skeleton__pagination" }) : null] })] })] });
}
const SearchFacetsSchema = objectType({
  facets: arrayType(PLPFacetSchema).default([]),
  total: numberType().default(0),
  found: numberType().optional(),
  found_capped: booleanType().optional(),
  // Missing means unknown, and unknown is not exact.
  counts_exact: booleanType().default(false)
}).passthrough();
function buildSearchUrl(config, query, filters) {
  const base = config.apiBaseUrl.replace(/\/+$/, "");
  const filterQs = buildCanonicalQuery(filters).replace(/^\?/, "");
  const pageSize = `page_size=${config.pageSize ?? 24}`;
  return `${base}/api/v1/search?query=${encodeURIComponent(query)}&${pageSize}${filterQs ? `&${filterQs}` : ""}`;
}
function buildSearchFacetsUrl(config, query, filters) {
  const base = config.apiBaseUrl.replace(/\/+$/, "");
  const filterQs = buildCanonicalQuery({ ...filters, cursor: void 0, sort: void 0 }).replace(/^\?/, "");
  return `${base}/api/v1/search/facets?query=${encodeURIComponent(query)}${filterQs ? `&${filterQs}` : ""}`;
}
async function getJson(config, url, signal) {
  const headers = { Accept: "application/json" };
  if (config.origin)
    headers["X-Omniguide-Origin"] = config.origin;
  const response = await (config.fetchImpl ?? nativeFetch)(url, { method: "GET", headers, signal });
  if (!response.ok) {
    throw new Error(`Search request failed: ${response.status} ${response.statusText}`);
  }
  return response.json();
}
async function fetchSearchFacets(config, query, filters, signal) {
  const parsed = SearchFacetsSchema.safeParse(await getJson(config, buildSearchFacetsUrl(config, query, filters), signal));
  if (!parsed.success) {
    logger.error("Search facets response failed schema validation", { zodError: parsed.error.message });
    throw new Error("Search facets response failed schema validation");
  }
  return parsed.data;
}
async function fetchSearchResults(config, query, filters, signal) {
  const body = await getJson(config, buildSearchUrl(config, query, filters), signal);
  const parsed = PLPResponseSchema.safeParse({ category: { id: "" }, ...body });
  if (!parsed.success) {
    logger.error("Search response failed schema validation", { zodError: parsed.error.message });
    throw new Error("Search response failed schema validation");
  }
  return parsed.data;
}
function useT() {
  const snapshot = useSyncExternalStore(subscribeI18n, getI18nSnapshot, getI18nSnapshot);
  return useMemo(() => {
    const withProp = (id, prop, vars) => translateWithProp(id, prop, vars, snapshot.locale);
    return Object.assign((id, vars) => withProp(id, void 0, vars), { withProp });
  }, [snapshot]);
}
function expandStyle(from) {
  if (!from || typeof window === "undefined")
    return void 0;
  const inset = `inset(${from.top}px ${window.innerWidth - from.right}px ${window.innerHeight - from.bottom}px ${from.left}px round 24px)`;
  return { "--omniguide-srp-from": inset };
}
const EMPTY_FILTERS$2 = { f: {}, uc: [], flag: [] };
const LIVE_MIN_LENGTH = TYPEAHEAD_MIN_QUERY_LENGTH;
const LIVE_DEBOUNCE_MS = 250;
function SearchResultsModal(props) {
  var _a, _b, _c;
  const { initialQuery, onClose } = props;
  const t = useT();
  const askLabel = t.withProp("search.askAssistant", props.assistantLabel);
  const [input, setInput] = useState(initialQuery);
  const [query, setQuery] = useState(initialQuery.trim());
  const [filters, setFiltersState] = useState(EMPTY_FILTERS$2);
  const [pageStack, setPageStack] = useState([null]);
  const [pageIndex, setPageIndex] = useState(0);
  const page = useSearchResults(props, query, filters, pageStack[pageIndex] ?? null, pageIndex);
  const exact = useExactCounts(props, query, filters, page);
  const { loading, error, retry } = page;
  const { data, rejected } = withExactCounts(page, exact);
  useEffect(() => {
    if (rejected)
      logger.warn("Search facets total is below the products already listed; keeping the page counts", { query });
  }, [rejected, query]);
  const bodyRef = useRef(null);
  const inputRef = useRef(null);
  const dialogRef = useRef(null);
  const [openStyle] = useState(() => expandStyle(props.expandFrom));
  useModalChrome(onClose, dialogRef, inputRef);
  const resetPaging = useCallback(() => {
    setPageStack([null]);
    setPageIndex(0);
  }, []);
  const commit = useCallback((next) => {
    const trimmed = next.trim();
    if (!trimmed || trimmed === query)
      return;
    setQuery(trimmed);
    setFiltersState(EMPTY_FILTERS$2);
    resetPaging();
  }, [query, resetPaging]);
  useEffect(() => {
    if (input.trim().length < LIVE_MIN_LENGTH)
      return;
    const timer = setTimeout(() => commit(input), LIVE_DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [input, commit]);
  const setFilters = useCallback((next) => {
    setFiltersState(next);
    resetPaging();
  }, [resetPaging]);
  const turnPage = useCallback((index, cursor) => {
    var _a2;
    if (cursor !== void 0) {
      setPageStack((prev) => [...prev.slice(0, index), cursor]);
    }
    setPageIndex(index);
    (_a2 = bodyRef.current) == null ? void 0 : _a2.scrollTo({ top: 0 });
  }, []);
  const nextCursor = ((_a = data == null ? void 0 : data.pagination) == null ? void 0 : _a.next_cursor) ?? null;
  const pageSize = (_b = data == null ? void 0 : data.pagination) == null ? void 0 : _b.page_size;
  const total = (_c = data == null ? void 0 : data.pagination) == null ? void 0 : _c.total_estimate;
  return jsx("div", { className: "omniguide", children: jsxs("div", { className: props.sheet ? "omniguide-srp omniguide-srp--sheet" : "omniguide-srp", role: "dialog", "aria-modal": "true", "aria-label": t("srp.dialogLabel"), style: openStyle, ref: dialogRef, children: [jsxs("div", { className: "omniguide-srp__header", children: [jsx("div", { className: "omniguide-sheet__brand", children: props.logo }), jsxs("div", { className: "omniguide-srp__bar", children: [jsxs("form", { className: "omniguide-srp__form", role: "search", onSubmit: (e) => {
    e.preventDefault();
    commit(input);
  }, children: [jsx(SearchGlyph, {}), jsx("input", { ref: inputRef, className: "omniguide-srp__input", type: "search", value: input, onChange: (e) => setInput(e.target.value), placeholder: t("srp.searchProducts"), "aria-label": t("srp.searchProducts"), autoFocus: true }), input && jsx("button", { type: "button", className: "omniguide-srp__clear", onClick: () => {
    var _a2;
    setInput("");
    (_a2 = inputRef.current) == null ? void 0 : _a2.focus();
  }, "aria-label": t("common.clear"), children: jsx(CrossGlyph, { size: 18 }) })] }), props.onAskAssistant && data && !data.is_question && jsxs(Fragment, { children: [jsx("span", { className: "omniguide-sheet__or", "aria-hidden": "true", children: t("common.or") }), jsxs("button", { type: "button", className: "omniguide-sheet__ask-open", onClick: () => {
    var _a2;
    return (_a2 = props.onAskAssistant) == null ? void 0 : _a2.call(props, input.trim() || query);
  }, children: [jsx("span", { className: "omniguide-sheet__spark", children: jsx(SparkGlyph, {}) }), jsx("span", { className: "omniguide-srp__ask-label", children: askLabel })] })] })] }), jsx("div", { className: "omniguide-sheet__corner", children: jsx("button", { type: "button", className: "omniguide-sheet__close", onClick: onClose, "aria-label": t("srp.close"), children: jsx(CrossGlyph, { size: 20 }) }) })] }), jsx("div", { className: "omniguide-srp__body", ref: bodyRef, children: (data == null ? void 0 : data.is_question) && props.onAskAssistant ? jsxs("div", { className: "omniguide-srp__question", role: "status", children: [jsx("p", { children: t("srp.soundsLikeQuestion") }), jsx("button", { type: "button", onClick: () => {
    var _a2;
    return (_a2 = props.onAskAssistant) == null ? void 0 : _a2.call(props, query);
  }, children: askLabel })] }) : data ? jsx(ProductListContainer, { data, filters, onFiltersChange: setFilters, filtersDisabled: loading, showCategoryHeader: false, formatResultCount: resultCountLabel(data, narrows(filters), t), pageInfo: {
    page: pageIndex + 1,
    // The header names every catalog match when the window is capped, and
    // the pager can only walk that window: "654 results, Page 1 of 4" read
    // as a bug. No page total then; Next still follows the cursor.
    totalPages: data.found_capped && !narrows(filters) || !total || !pageSize ? null : Math.max(1, Math.ceil(total / pageSize)),
    hasPrev: pageIndex > 0,
    hasNext: Boolean(nextCursor),
    onPrev: () => turnPage(pageIndex - 1),
    onNext: () => turnPage(pageIndex + 1, nextCursor),
    loading
  }, error, onRetry: retry, fallbackImage: props.fallbackImage, currency: props.currency, locale: props.locale }) : error ? jsx(ProductListError, { onRetry: retry, retryDisabled: loading }) : jsx(ProductListSkeleton, { showCategoryHeader: false }) })] }) });
}
function resultCountLabel(data, filtered, t) {
  return (windowCount) => {
    const found = data.found_capped && !filtered ? data.found ?? windowCount : windowCount;
    return t("search.resultCount", { count: found });
  };
}
function narrows(filters) {
  return Object.keys(filters.f ?? {}).length > 0 || (filters.uc ?? []).length > 0 || (filters.flag ?? []).length > 0 || filters.priceMin !== void 0 || filters.priceMax !== void 0;
}
function countsKey(query, filters) {
  return `${query}
${buildCanonicalQuery({ ...filters, cursor: void 0, sort: void 0 })}`;
}
function useSearchResults(config, query, filters, cursor, pageIndex) {
  const [page, setPage] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [attempt, setAttempt] = useState(0);
  const { apiBaseUrl, origin, pageSize, fetchImpl } = config;
  useEffect(() => {
    if (!query)
      return;
    const controller = new AbortController();
    setLoading(true);
    fetchSearchResults({ apiBaseUrl, origin, pageSize, fetchImpl }, query, { ...filters, cursor: cursor ?? void 0 }, controller.signal).then((next) => {
      if (controller.signal.aborted)
        return;
      setPage({ key: countsKey(query, filters), index: pageIndex, data: next });
      setError(null);
    }).catch((err) => {
      if (controller.signal.aborted)
        return;
      const failure = err instanceof Error ? err : new Error(String(err));
      logger.error("Search results request failed", { query, message: failure.message });
      setError(failure);
    }).finally(() => {
      if (!controller.signal.aborted)
        setLoading(false);
    });
    return () => controller.abort();
  }, [apiBaseUrl, origin, pageSize, fetchImpl, query, filters, cursor, pageIndex, attempt]);
  return {
    data: (page == null ? void 0 : page.data) ?? null,
    dataKey: (page == null ? void 0 : page.key) ?? null,
    dataIndex: (page == null ? void 0 : page.index) ?? 0,
    loading,
    error,
    retry: () => setAttempt((n) => n + 1)
  };
}
const EXACT_COUNTS_KEPT = 8;
function useExactCounts(config, query, filters, page) {
  var _a;
  const [kept, setKept] = useState(() => /* @__PURE__ */ new Map());
  const inFlight = useRef(null);
  const { apiBaseUrl, origin, fetchImpl } = config;
  const key = countsKey(query, filters);
  const needed = !page.loading && page.dataKey === key && ((_a = page.data) == null ? void 0 : _a.counts_exact) === false && !kept.has(key);
  useEffect(() => {
    if (inFlight.current && inFlight.current.key !== key) {
      inFlight.current.controller.abort();
      inFlight.current = null;
    }
    if (!needed || inFlight.current)
      return;
    const request = { key, controller: new AbortController() };
    inFlight.current = request;
    fetchSearchFacets({ apiBaseUrl, origin, fetchImpl }, query, filters, request.controller.signal).then((value) => {
      if (request.controller.signal.aborted)
        return;
      if (value.counts_exact)
        setKept((prev) => keep(prev, key, value));
      else
        logger.warn("Search facets fell back to the window; keeping the page counts", { query });
    }).catch((err) => {
      if (!request.controller.signal.aborted) {
        logger.warn("Search facets request failed; keeping the page counts", { query, message: String(err) });
      }
    }).finally(() => {
      if (inFlight.current === request)
        inFlight.current = null;
    });
  }, [apiBaseUrl, origin, fetchImpl, query, filters, key, needed]);
  useEffect(() => () => {
    var _a2;
    return (_a2 = inFlight.current) == null ? void 0 : _a2.controller.abort();
  }, []);
  return page.dataKey && kept.get(page.dataKey) || null;
}
function keep(prev, key, value) {
  const next = new Map(prev);
  next.delete(key);
  next.set(key, value);
  while (next.size > EXACT_COUNTS_KEPT)
    next.delete(next.keys().next().value);
  return next;
}
function withExactCounts(page, exact) {
  var _a;
  const { data } = page;
  if (!data || data.counts_exact !== false || !exact)
    return { data, rejected: false };
  const listed = page.dataIndex * (((_a = data.pagination) == null ? void 0 : _a.page_size) ?? data.products.length) + data.products.length;
  if (exact.total < listed)
    return { data, rejected: true };
  return {
    rejected: false,
    data: {
      ...data,
      facets: exact.facets,
      found: exact.found ?? data.found,
      found_capped: exact.found_capped ?? data.found_capped,
      pagination: data.pagination && { ...data.pagination, total_estimate: exact.total }
    }
  };
}
function useModalChrome(onClose, dialogRef, initialFocusRef) {
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;
  useEffect(() => {
    var _a;
    const returnFocus = document.activeElement;
    const unlockScroll = lockPageScroll();
    (_a = initialFocusRef.current) == null ? void 0 : _a.focus();
    const onKey = (e) => {
      if (e.key === "Escape")
        onCloseRef.current();
      if (e.key === "Tab" && dialogRef.current)
        trapTab(e, dialogRef.current);
    };
    document.addEventListener("keydown", onKey);
    return () => {
      var _a2;
      document.removeEventListener("keydown", onKey);
      unlockScroll();
      (_a2 = returnFocus == null ? void 0 : returnFocus.focus) == null ? void 0 : _a2.call(returnFocus);
    };
  }, [dialogRef, initialFocusRef]);
}
function lockPageScroll() {
  const root = document.documentElement;
  const { body } = document;
  const previous = [root.style.overflow, body.style.overflow];
  const reserve = !root.style.scrollbarGutter && window.innerWidth > root.clientWidth;
  if (reserve)
    root.style.scrollbarGutter = "stable";
  root.style.overflow = "hidden";
  body.style.overflow = "hidden";
  return () => {
    [root.style.overflow, body.style.overflow] = previous;
    if (reserve)
      root.style.scrollbarGutter = "";
  };
}
const FOCUSABLE = 'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';
function trapTab(e, dialog) {
  const focusable = Array.from(dialog.querySelectorAll(FOCUSABLE)).filter((el) => el.getClientRects().length > 0 && !el.closest("[inert]"));
  const first = focusable[0];
  const last = focusable[focusable.length - 1];
  if (!first || !last)
    return;
  const active = document.activeElement;
  const wrapTo = !dialog.contains(active) ? first : e.shiftKey && active === first ? last : !e.shiftKey && active === last ? first : null;
  if (!wrapTo)
    return;
  e.preventDefault();
  wrapTo.focus();
}
const GLYPH = { fill: "none", stroke: "currentColor", strokeWidth: 2, strokeLinecap: "round", strokeLinejoin: "round", "aria-hidden": true };
function SearchGlyph() {
  return jsxs("svg", { width: "20", height: "20", viewBox: "0 0 24 24", ...GLYPH, children: [jsx("circle", { cx: "11", cy: "11", r: "8" }), jsx("path", { d: "m21 21-4.3-4.3" })] });
}
function CrossGlyph({ size }) {
  return jsxs("svg", { width: size, height: size, viewBox: "0 0 24 24", ...GLYPH, children: [jsx("path", { d: "M18 6 6 18" }), jsx("path", { d: "m6 6 12 12" })] });
}
function SparkGlyph() {
  return jsxs("svg", { width: "16", height: "16", viewBox: "0 0 24 24", ...GLYPH, strokeWidth: 1.75, children: [jsx("path", { d: "M9.937 15.5A2 2 0 0 0 8.5 14.063l-6.135-1.582a.5.5 0 0 1 0-.962L8.5 9.936A2 2 0 0 0 9.937 8.5l1.582-6.135a.5.5 0 0 1 .963 0L14.063 8.5A2 2 0 0 0 15.5 9.937l6.135 1.581a.5.5 0 0 1 0 .964L15.5 14.063a2 2 0 0 0-1.437 1.437l-1.582 6.135a.5.5 0 0 1-.963 0z" }), jsx("path", { d: "M20 3v4" }), jsx("path", { d: "M22 5h-4" })] });
}
const SESSION_ID_HEADER = "X-Session-Id";
const EMPTY_FILTERS$1 = { f: {}, uc: [], flag: [] };
function emptyResponse(categoryId) {
  return PLPResponseSchema.parse({
    category: { id: String(categoryId ?? ""), children: [] },
    products: [],
    facets: [],
    applied_rule_ids: []
  });
}
const UNRESOLVED_TEMPLATE_TEXT = /* @__PURE__ */ new Set(["undefined", "null"]);
function isBlank(value) {
  if (value == null)
    return true;
  if (typeof value !== "string")
    return false;
  const trimmed = value.trim();
  return trimmed === "" || UNRESOLVED_TEMPLATE_TEXT.has(trimmed.toLowerCase());
}
function buildEndpoint(config, filters) {
  const base = config.apiBaseUrl.replace(/\/+$/, "");
  const filterQs = buildCanonicalQuery(filters);
  if (isBlank(config.categoryUrl) && isBlank(config.categoryId)) {
    logger.error("fetchPLP: neither `categoryUrl` nor `categoryId` was supplied", {
      apiBaseUrl: config.apiBaseUrl
    });
    throw new Error("fetchPLP: one of `categoryUrl` or `categoryId` is required");
  }
  const useUrl = !isBlank(config.categoryUrl);
  const path = config.categoryUrl ?? "";
  if (useUrl && (!path.startsWith("/") || path.startsWith("//"))) {
    logger.warn("fetchPLP: `categoryUrl` is not a root-relative path", {
      categoryUrl: config.categoryUrl
    });
  }
  const categoryQs = useUrl ? `category_url=${encodeURIComponent(config.categoryUrl)}` : `category_id=${encodeURIComponent(String(config.categoryId))}`;
  const search = filterQs ? `?${categoryQs}&${filterQs.slice(1)}` : `?${categoryQs}`;
  return `${base}/api/v1/plp${search}`;
}
const CHANNEL_HEADER = "x-channel-id";
function stripChannelHeader(headers, config) {
  const present = Object.keys(headers).filter((k) => k.toLowerCase() === CHANNEL_HEADER);
  if (present.length === 0)
    return headers;
  logger.warn("fetchPLP: dropping `X-Channel-Id` because this request resolves by `categoryUrl`. The backend resolves the path without a channel and 404s when the header is present, which would render as an empty category. Stop returning it from `getHeaders` when `categoryUrl` is set.", { categoryUrl: config.categoryUrl });
  const out = { ...headers };
  for (const key of present)
    delete out[key];
  return out;
}
async function resolveHeaders(config) {
  if (!config.getHeaders)
    return {};
  const raw = await config.getHeaders();
  if (raw instanceof Headers) {
    const out = {};
    raw.forEach((value, key) => {
      out[key] = value;
    });
    return out;
  }
  return { ...raw };
}
async function fetchPLP(config, filters = EMPTY_FILTERS$1, init = {}) {
  var _a;
  const url = buildEndpoint(config, filters);
  let headers = {
    ...init.headers,
    Accept: "application/json",
    ...await resolveHeaders(config)
  };
  if (!isBlank(config.categoryUrl)) {
    headers = stripChannelHeader(headers, config);
  }
  const sessionId = (_a = config.getSessionId) == null ? void 0 : _a.call(config);
  if (typeof sessionId === "string" && sessionId.length > 0) {
    headers[SESSION_ID_HEADER] = sessionId;
  }
  const fetcher = config.fetchImpl ?? nativeFetch;
  const response = await fetcher(url, {
    ...init,
    method: "GET",
    headers
  });
  if (response.status === 404) {
    logger.warn("PLP category not available; rendering an empty grid", {
      url,
      categoryId: config.categoryId,
      categoryUrl: config.categoryUrl
    });
    return emptyResponse(isBlank(config.categoryUrl) ? config.categoryId : void 0);
  }
  if (!response.ok) {
    throw new Error(`PLP request failed: ${response.status} ${response.statusText}`);
  }
  let json;
  try {
    json = await response.json();
  } catch (err) {
    const detail = err instanceof Error ? err.message : String(err);
    logger.error("PLP response was not valid JSON", { detail });
    throw new Error("PLP response was not valid JSON");
  }
  const parsed = PLPResponseSchema.safeParse(json);
  if (!parsed.success) {
    logger.error("PLP response failed schema validation", {
      zodError: parsed.error.message,
      body: json
    });
    throw new Error("PLP response failed schema validation");
  }
  return parsed.data;
}
const hasFilters = (f) => Object.keys(f.f ?? {}).length > 0 || (f.uc ?? []).length > 0 || (f.flag ?? []).length > 0 || Object.entries(f).some(([k, v]) => !["f", "uc", "flag"].includes(k) && v != null && v !== "");
const TIMED_OUT = Symbol("prefetch-timeout");
const PREFETCH_TIMEOUT_MS = 15e3;
function mergePage(prev, next) {
  var _a;
  const exhausted = (((_a = next.products) == null ? void 0 : _a.length) ?? 0) === 0;
  return {
    ...prev,
    products: [...prev.products, ...next.products],
    pagination: exhausted ? { ...next.pagination, next_cursor: null } : next.pagination,
    sort: next.sort ?? prev.sort,
    applied_rule_ids: next.applied_rule_ids ?? prev.applied_rule_ids
  };
}
function useProductList(options) {
  const { config, filters, skipInitial, initialData } = options;
  const initialDataPromise = initialData ? null : options.initialDataPromise ?? null;
  const [data, setData] = useState(initialData ?? null);
  const [loading, setLoading] = useState(!skipInitial && (Boolean(initialDataPromise) || !initialData));
  const [error, setError] = useState(null);
  const [loadMoreLoading, setLoadMoreLoading] = useState(false);
  const generationRef = useRef(0);
  const configRef = useRef(config);
  configRef.current = config;
  const filtersRef = useRef(filters);
  filtersRef.current = filters;
  const hydratedRef = useRef(Boolean(initialData) || Boolean(initialDataPromise));
  const prefetchRef = useRef(initialDataPromise);
  const runFetch = useCallback(
    async (target, mode, cursorForAppend) => {
      const generation = ++generationRef.current;
      if (mode === "replace") {
        setLoading(true);
        setError(null);
        setLoadMoreLoading(false);
      } else {
        setLoadMoreLoading(true);
      }
      const filtersForCall = cursorForAppend ? { ...target, cursor: cursorForAppend } : target;
      try {
        const next = await fetchPLP(configRef.current, filtersForCall);
        if (generation === generationRef.current) {
          if (mode === "replace") {
            setData(next);
          } else {
            setData((prev) => prev ? mergePage(prev, next) : next);
          }
        }
      } catch (err) {
        if (generation === generationRef.current) {
          setError(err instanceof Error ? err : new Error(String(err)));
        }
      }
      if (generation === generationRef.current) {
        if (mode === "replace")
          setLoading(false);
        else
          setLoadMoreLoading(false);
      }
    },
    // Empty deps intentional: the body reads `configRef.current` and
    // `filtersRef.current` (assigned every render below), and `setX` setters
    // from useState are stable. Stabilizing `runFetch`'s identity is what
    // keeps the refetch effect (which depends on `runFetch`) from refiring on
    // every render — the refs are stable, so the suggested deps would be a
    // no-op rule satisfaction, not a real fix. (The hooks plugin is now enabled
    // for this package and does NOT flag this — the body has no reactive deps.)
    []
  );
  useEffect(() => {
    const prefetch = prefetchRef.current;
    if (!prefetch || skipInitial)
      return;
    if (hasFilters(filtersRef.current)) {
      void runFetch(filtersRef.current, "replace");
      return;
    }
    const generation = generationRef.current;
    let cancelled = false;
    const fallBack = (reason, detail) => {
      if (cancelled || generation !== generationRef.current)
        return;
      logger.warn(`PLP prefetch unusable (${reason}); fetching normally`, {
        detail
      });
      void runFetch(filtersRef.current, "replace");
    };
    let timer;
    const deadline = new Promise((resolve) => {
      timer = setTimeout(() => resolve(TIMED_OUT), PREFETCH_TIMEOUT_MS);
    });
    void Promise.race([prefetch, deadline]).then((raw) => {
      var _a, _b, _c;
      if (cancelled || generation !== generationRef.current)
        return;
      if (raw === TIMED_OUT)
        return fallBack("timed out");
      if (raw == null)
        return fallBack("no payload");
      const parsed = PLPResponseSchema.safeParse(raw);
      if (!parsed.success)
        return fallBack("schema mismatch", parsed.error.message);
      if (isBlank(configRef.current.categoryUrl) && isBlank(configRef.current.categoryId)) {
        return fallBack("no category selector");
      }
      const resolvingByPath = !isBlank(configRef.current.categoryUrl);
      const want = resolvingByPath ? null : configRef.current.categoryId;
      if (resolvingByPath && !isBlank(configRef.current.categoryId) && String((_a = parsed.data.category) == null ? void 0 : _a.id) !== String(configRef.current.categoryId)) {
        logger.debug("PLP prefetch adopted on the path; its category id differs from the configured id (expected while migrating)", {
          categoryUrl: configRef.current.categoryUrl,
          configuredCategoryId: configRef.current.categoryId,
          responseCategoryId: (_b = parsed.data.category) == null ? void 0 : _b.id
        });
      }
      if (want != null && String((_c = parsed.data.category) == null ? void 0 : _c.id) !== String(want)) {
        return fallBack("category mismatch");
      }
      setData(parsed.data);
      setError(null);
      setLoading(false);
    }, (err) => fallBack("request failed", err));
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [skipInitial, runFetch]);
  const filterKey = JSON.stringify(filters);
  const categoryKey = `${config.categoryUrl ?? ""}|${config.categoryId ?? ""}`;
  useEffect(() => {
    if (skipInitial)
      return;
    if (hydratedRef.current) {
      hydratedRef.current = false;
      return;
    }
    void runFetch(filtersRef.current, "replace");
  }, [filterKey, categoryKey, skipInitial, runFetch]);
  const refetch = useCallback(() => {
    void runFetch(filtersRef.current, "replace");
  }, [runFetch]);
  const loadMore = useCallback((cursor) => {
    void runFetch(filtersRef.current, "append", cursor);
  }, [runFetch]);
  const goToPage = useCallback((cursor) => {
    void runFetch(filtersRef.current, "replace", cursor ?? void 0);
  }, [runFetch]);
  return { data, loading, error, loadMoreLoading, refetch, loadMore, goToPage };
}
const DEFAULT_METRICS = [
  "LCP",
  "INP",
  "CLS"
];
function endpointFor(apiBaseUrl, path) {
  return apiBaseUrl.replace(/\/+$/, "") + path;
}
function bind(module, name, cb) {
  const fnName = `on${name}`;
  const fn = module[fnName];
  if (typeof fn === "function")
    fn(cb);
}
function useWebVitalsBeacon(options) {
  const { apiBaseUrl, isConsentGranted, metrics = DEFAULT_METRICS, endpointPath = "/internal/metrics/web-vitals", webVitals, debounceMs, getSessionId, onFlush } = options;
  const consentRef = useRef(isConsentGranted);
  consentRef.current = isConsentGranted;
  const sessionIdRef = useRef(getSessionId);
  sessionIdRef.current = getSessionId;
  const onFlushRef = useRef(onFlush);
  onFlushRef.current = onFlush;
  useEffect(() => {
    let cancelled = false;
    let queue = null;
    const queueOptions = {
      endpoint: endpointFor(apiBaseUrl, endpointPath),
      isConsentGranted: () => consentRef.current(),
      flushOnPageHide: true,
      debounceMs,
      onFlush: onFlushRef.current ? (info) => {
        var _a;
        return (_a = onFlushRef.current) == null ? void 0 : _a.call(onFlushRef, info);
      } : void 0,
      serialize: (events) => JSON.stringify({ events })
    };
    queue = createEventQueue(queueOptions);
    const wire = (mod) => {
      if (cancelled || !queue)
        return;
      const handler = (metric) => {
        var _a;
        const url = typeof window !== "undefined" && window.location ? sanitizeUrl(window.location.href) : "";
        const resolvedSession = (_a = sessionIdRef.current) == null ? void 0 : _a.call(sessionIdRef);
        const event = {
          event: "web-vital",
          url,
          ts: Date.now(),
          metric
        };
        if (typeof resolvedSession === "string" && resolvedSession.length > 0) {
          event.session_id = resolvedSession;
        }
        queue == null ? void 0 : queue.enqueue(event);
      };
      for (const name of metrics)
        bind(mod, name, handler);
    };
    if (webVitals) {
      wire(webVitals);
    } else {
      import("./shared-Cn_Wle43.js").then((mod) => wire(mod)).catch(() => {
      });
    }
    return () => {
      cancelled = true;
      queue == null ? void 0 : queue.destroy();
      queue = null;
    };
  }, [apiBaseUrl, endpointPath, JSON.stringify(metrics), debounceMs, webVitals]);
}
const EMPTY_FILTERS = { f: {}, uc: [], flag: [] };
const URL_SORTS = new Set(SORT_VALUES.filter((s) => s !== "relevance"));
function urlFilters(filters) {
  const sort = filters.sort && URL_SORTS.has(filters.sort) ? filters.sort : void 0;
  return { ...filters, sort, cursor: void 0 };
}
function filterUrl(filters) {
  return mergeFilterQuery(window.location.href, urlFilters(filters));
}
function firstFilters(config) {
  if (config.initialFilters)
    return config.initialFilters;
  if (!config.syncUrl || typeof window === "undefined")
    return EMPTY_FILTERS;
  return urlFilters(parseFilters(window.location.href));
}
function ProductListMount({ config }) {
  var _a, _b, _c;
  const [filters, setFiltersState] = useState(() => firstFilters(config));
  const [initialData] = useState(() => config.syncUrl && !config.initialFilters && buildCanonicalQuery(filters) !== "" ? null : config.initialData);
  const [pageStack, setPageStack] = useState([null]);
  const [pageIndex, setPageIndex] = useState(0);
  const [recProducts, setRecProducts] = useState(null);
  useEffect(() => {
    const apply = (payload) => {
      if (!payload || payload.page !== "plp")
        return;
      const items = payload.products.filter((p) => p.name);
      if (items.length === 0)
        return;
      setRecProducts(items.map((m) => {
        const rank = typeof m.rank === "number" ? m.rank : void 0;
        const flags = rank === 1 ? [{ key: "top-pick", label: "Top Pick" }] : rank === 2 ? [{ key: "runner-up", label: "Runner-Up" }] : [];
        return {
          id: m.id ?? m.sku,
          sku: m.sku,
          name: m.name,
          brand: m.brand,
          url: m.url,
          image_url: m.image_url,
          price: m.price,
          retail_price: m.retail_price,
          rank,
          variant_images: [],
          flags,
          bulk_pricing: [],
          use_case_ids: []
        };
      }));
    };
    apply(getLastRecommendations());
    return onRecommendations(apply);
  }, []);
  const clearRecFilter = useCallback(() => setRecProducts(null), []);
  const showFilters = useCallback((next) => {
    setFiltersState(next);
    setPageStack([null]);
    setPageIndex(0);
  }, []);
  const setFilters = useCallback((next) => {
    showFilters(next);
    if (!config.syncUrl)
      return;
    const url = filterUrl(next);
    if (url !== filterUrl(parseFilters(window.location.href)))
      window.history.pushState(null, "", url);
  }, [config.syncUrl, showFilters]);
  const filtersRef = useRef(filters);
  filtersRef.current = filters;
  useEffect(() => {
    if (!config.syncUrl)
      return void 0;
    const onPop = () => {
      const next = parseFilters(window.location.href);
      if (filterUrl(next) !== filterUrl(filtersRef.current))
        showFilters(urlFilters(next));
    };
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, [config.syncUrl, showFilters]);
  const fetchConfig = {
    apiBaseUrl: config.apiBaseUrl,
    categoryId: config.categoryId,
    categoryUrl: config.categoryUrl,
    getHeaders: config.getHeaders,
    getSessionId: config.getSessionId,
    fetchImpl: config.fetchImpl
  };
  const { data, loading, error, refetch, goToPage } = useProductList({
    config: fetchConfig,
    filters,
    initialData,
    initialDataPromise: config.initialDataPromise
  });
  const nextCursor = ((_a = data == null ? void 0 : data.pagination) == null ? void 0 : _a.next_cursor) ?? null;
  const handleNext = useCallback(() => {
    if (!nextCursor)
      return;
    setPageStack((prev) => {
      const trimmed = prev.slice(0, pageIndex + 1);
      trimmed[pageIndex + 1] = nextCursor;
      return trimmed;
    });
    setPageIndex((i) => i + 1);
    goToPage(nextCursor);
  }, [nextCursor, pageIndex, goToPage]);
  const handlePrev = useCallback(() => {
    if (pageIndex === 0)
      return;
    const targetCursor = pageStack[pageIndex - 1] ?? null;
    setPageIndex((i) => i - 1);
    goToPage(targetCursor);
  }, [pageIndex, pageStack, goToPage]);
  const pageSize = (_b = data == null ? void 0 : data.pagination) == null ? void 0 : _b.page_size;
  const totalEstimate = (_c = data == null ? void 0 : data.pagination) == null ? void 0 : _c.total_estimate;
  const totalPages = totalEstimate && pageSize ? Math.max(1, Math.ceil(totalEstimate / pageSize)) : null;
  if (loading && !data && !recProducts) {
    return jsx("div", { className: "omniguide", children: jsx(ProductListSkeleton, { tiles: config.skeletonTiles, showCategoryHeader: config.showCategoryHeader, showPagination: config.showSkeletonPagination }) });
  }
  if (!data && !recProducts) {
    return jsx("div", { className: "omniguide", children: jsx("section", { className: "omniguide-product-list", children: jsx(ProductListError, { onRetry: refetch }) }) });
  }
  const effectiveData = recProducts ? {
    ...data ?? {},
    // `children` is non-optional on the parsed type (schema `.default([])`),
    // so the cast below would hand a future consumer `undefined.map`.
    category: (data == null ? void 0 : data.category) ?? { id: String(config.categoryId ?? ""), children: [] },
    products: recProducts,
    facets: [],
    applied_rule_ids: []
  } : data;
  return jsx(ProductListContainer, { data: effectiveData, filters, onFiltersChange: setFilters, filtersDisabled: loading, pageInfo: {
    page: pageIndex + 1,
    totalPages,
    hasPrev: pageIndex > 0,
    hasNext: Boolean(nextCursor),
    onPrev: handlePrev,
    onNext: handleNext,
    loading
  }, recommendationFilter: recProducts ? { active: true, count: recProducts.length, onClear: clearRecFilter } : void 0, error, onRetry: refetch, fallbackImage: config.fallbackImage, currency: config.currency, locale: config.locale, showCategoryHeader: config.showCategoryHeader, drilldownPlacement: config.drilldownPlacement, priorityCount: config.priorityCount, onRedirect: config.onRedirect, onChildCategoryClick: config.onChildCategoryClick });
}
function renderProductList(target, config) {
  const root = createRoot(target);
  root.render(jsx(ProductListMount, { config }));
  return {
    unmount: () => root.unmount()
  };
}
export {
  ActiveFilters,
  CategoryHeader,
  FacetSidebar,
  LoadMore,
  MultiSelectFacet,
  Pagination,
  PriceRangeFacet,
  ProductGrid,
  ProductListContainer,
  ProductListMount,
  ProductListSkeleton,
  RedirectDrilldown,
  SESSION_ID_HEADER,
  SORT_VALUES,
  SearchResultsModal,
  SortSelect,
  Toolbar,
  buildCanonicalQuery,
  buildSearchFacetsUrl,
  buildSearchUrl,
  buildUrl,
  fetchPLP,
  fetchSearchFacets,
  fetchSearchResults,
  mergeFilterQuery,
  parseFilters,
  pushFilters,
  renderProductList,
  useProductList,
  useWebVitalsBeacon
};
