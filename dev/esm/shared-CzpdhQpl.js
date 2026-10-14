import { b9 as objectType, ba as booleanType, bb as numberType, bc as arrayType, bd as stringType, be as unionType, bf as unknownType, bg as enumType, bh as literalType } from "./shared-Ca1kMayo.js";
const SEND_BEACON_BODY_LIMIT_BYTES = 64 * 1024;
const DEFAULT_DEBOUNCE_MS = 250;
function createEventQueue(options) {
  const {
    endpoint,
    serialize,
    isConsentGranted,
    debounceMs = DEFAULT_DEBOUNCE_MS,
    maxQueueSize,
    flushOnPageHide = false,
    getNavigator = () => typeof navigator === "undefined" ? null : navigator,
    getFetch = () => globalThis.fetch,
    onFlush
  } = options;
  let pending = [];
  let timerId = null;
  let destroyed = false;
  function clearTimer() {
    if (timerId !== null) {
      clearTimeout(timerId);
      timerId = null;
    }
  }
  function scheduleFlush() {
    clearTimer();
    timerId = setTimeout(() => {
      timerId = null;
      flush();
    }, debounceMs);
  }
  function tryBeacon(body) {
    const nav = getNavigator();
    if (!nav || typeof nav.sendBeacon !== "function") return false;
    if (typeof Blob === "undefined") return false;
    const blob = new Blob([body], { type: "application/json" });
    if (blob.size > SEND_BEACON_BODY_LIMIT_BYTES) return false;
    try {
      return nav.sendBeacon(endpoint, blob);
    } catch {
      return false;
    }
  }
  function tryFetchKeepalive(body) {
    const f = getFetch();
    if (typeof f !== "function") return false;
    try {
      void f(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body,
        keepalive: true
      }).catch(() => void 0);
      return true;
    } catch {
      return false;
    }
  }
  function flush() {
    clearTimer();
    if (pending.length === 0) return "noop";
    const events = pending;
    pending = [];
    const body = serialize(events);
    let transport;
    if (tryBeacon(body)) {
      transport = "beacon";
    } else if (tryFetchKeepalive(body)) {
      transport = "fetch";
    } else {
      transport = "dropped";
    }
    onFlush == null ? void 0 : onFlush({ count: events.length, transport });
    return transport;
  }
  function enqueue(event) {
    if (destroyed) return;
    if (!isConsentGranted()) return;
    pending.push(event);
    if (typeof maxQueueSize === "number" && pending.length > maxQueueSize) {
      pending.splice(0, pending.length - maxQueueSize);
    }
    scheduleFlush();
  }
  function size() {
    return pending.length;
  }
  const pageHideHandler = flushOnPageHide && typeof window !== "undefined" && typeof window.addEventListener === "function" ? () => {
    flush();
  } : null;
  if (pageHideHandler) {
    window.addEventListener("pagehide", pageHideHandler);
  }
  function destroy() {
    flush();
    destroyed = true;
    clearTimer();
    pending = [];
    if (pageHideHandler && typeof window !== "undefined") {
      window.removeEventListener("pagehide", pageHideHandler);
    }
  }
  return { enqueue, flush, size, destroy };
}
const NumOrString$1 = unionType([numberType(), stringType()]);
const PriceLike = NumOrString$1.nullable().optional();
const PLPVariantImageSchema = objectType({
  variant_id: NumOrString$1.nullish(),
  sku: stringType().nullish(),
  url: stringType().nullish(),
  alt_text: stringType().nullish(),
  variant_display_name: stringType().nullish()
}).passthrough();
const PLPFlagSchema = objectType({
  key: stringType().optional(),
  label: stringType().optional(),
  icon_url: stringType().nullable().optional(),
  color: stringType().nullable().optional()
}).passthrough();
const PLPRatingSchema = objectType({
  value: numberType().min(0).max(5),
  count: numberType().int().nonnegative().optional()
}).passthrough();
const PLPReviewsSchema = objectType({
  average_rating: NumOrString$1.nullable().optional().catch(null),
  review_count: NumOrString$1.nullable().optional().catch(null),
  summary: stringType().nullable().optional().catch(null)
}).passthrough();
const PLPBulkPricingTierSchema = objectType({
  min_qty: numberType().optional(),
  max_qty: numberType().nullable().optional(),
  price: PriceLike,
  type: stringType().optional()
}).passthrough();
const PLPProductSchema = objectType({
  id: NumOrString$1,
  sku: stringType().nullable().optional(),
  name: stringType().nullable().optional(),
  // Display-only brand / product-line label (e.g. "TRACT OPTICS"). Optional —
  // mirrors the carousel product schema; rendered above the name when present.
  brand: stringType().nullable().optional(),
  url: stringType().nullable().optional(),
  price: PriceLike,
  retail_price: PriceLike,
  sale_price: PriceLike,
  image_url: stringType().nullable().optional(),
  alternate_image_url: stringType().nullable().optional(),
  variant_images: arrayType(PLPVariantImageSchema).default([]),
  flags: arrayType(PLPFlagSchema).default([]),
  bulk_pricing: arrayType(PLPBulkPricingTierSchema).default([]),
  pinned_position: numberType().nullable().optional(),
  use_case_ids: arrayType(numberType()).default([]),
  rating: PLPRatingSchema.nullable().optional(),
  reviews: PLPReviewsSchema.nullable().optional()
}).passthrough();
const PLPCategoryChildSchema = objectType({
  id: NumOrString$1,
  name: stringType().optional(),
  url: stringType().optional(),
  product_count: numberType().optional()
}).passthrough();
const PLPCategoryRedirectSchema = objectType({
  id: NumOrString$1,
  name: stringType().optional(),
  url: stringType().optional()
}).passthrough();
const PLPCategorySchema = objectType({
  id: NumOrString$1,
  name: stringType().optional(),
  description: stringType().nullable().optional(),
  children: arrayType(PLPCategoryChildSchema).default([]),
  redirect_to: PLPCategoryRedirectSchema.nullable().optional()
}).passthrough();
const PLPFacetValueSchema = objectType({
  value: unknownType().optional(),
  label: stringType().nullable().optional(),
  count: numberType().optional(),
  value_id: unionType([stringType(), numberType()]).nullable().optional(),
  selected: booleanType().optional(),
  // price-range buckets
  min: numberType().nullable().optional(),
  max: numberType().nullable().optional(),
  currency_code: stringType().nullable().optional()
}).passthrough();
const PLPFacetSchema = objectType({
  key: stringType(),
  label: stringType().nullable().optional(),
  // type ∈ attribute | use_case | flag | price_range | rating | in_stock — kept loose
  type: stringType(),
  values: arrayType(PLPFacetValueSchema).default([])
}).passthrough();
const PLPPaginationSchema = objectType({
  next_cursor: stringType().nullable().optional(),
  prev_cursor: stringType().nullable().optional(),
  total_estimate: numberType().optional(),
  page_size: numberType().optional()
}).passthrough();
const PLPResponseSchema = objectType({
  category: PLPCategorySchema,
  products: arrayType(PLPProductSchema).default([]),
  facets: arrayType(PLPFacetSchema).default([]),
  pagination: PLPPaginationSchema.optional(),
  sort: stringType().nullable().optional(),
  applied_rule_ids: arrayType(numberType()).default([])
}).passthrough();
const FacetsValuesResponseSchema = objectType({
  facet_key: stringType().optional(),
  values: arrayType(PLPFacetValueSchema).default([]),
  total_estimate: numberType().optional(),
  has_more: booleanType().optional()
}).passthrough();
function narrowFacetValue(raw) {
  if (raw === null || raw === void 0) return null;
  if (typeof raw === "string" || typeof raw === "number" || typeof raw === "boolean") {
    return raw;
  }
  return null;
}
function resolveProductRating(product) {
  var _a, _b;
  const explicit = product == null ? void 0 : product.rating;
  if (explicit) return explicit.value > 0 ? explicit : null;
  const average = toFiniteNumber((_a = product == null ? void 0 : product.reviews) == null ? void 0 : _a.average_rating);
  if (average === null || average <= 0) return null;
  const value = Math.min(average, 5);
  const count = toFiniteNumber((_b = product == null ? void 0 : product.reviews) == null ? void 0 : _b.review_count);
  const whole = count === null ? 0 : Math.floor(count);
  return whole > 0 ? { value, count: whole } : { value };
}
function toFiniteNumber(value) {
  if (typeof value === "number") return Number.isFinite(value) ? value : null;
  if (typeof value === "string" && value.trim()) {
    const parsed = Number.parseFloat(value);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
}
const NumOrString = unionType([numberType(), stringType()]);
const CarouselPriceObjectSchema = objectType({
  amount: unionType([stringType(), numberType()]),
  // Nullable, not just optional: the backend hard-codes "USD" today, but
  // `_price_payload` is commented to swap in `website_currency()`, which
  // returns None for a tenant with no currency configured — that would
  // serialize as `"currency": null` and, under a bare `.optional()`, reject
  // the whole carousel. `CarouselCardProps.defaultCurrency` exists precisely
  // to cover a missing currency, so the schema must let null reach it.
  currency: stringType().nullable().optional(),
  // When true, the amount is the min over variants (different sizes /
  // colors / configurations) rather than a single fixed price — UI
  // renders a "Starting at" prefix. Backend doesn't emit this for any
  // tenant yet; SDK accepts it so the contract is forward-compatible.
  from: booleanType().optional()
}).passthrough();
const CarouselPriceSchema = unionType([
  stringType(),
  numberType(),
  CarouselPriceObjectSchema
]);
const CarouselSlotProductSchema = objectType({
  sku: stringType(),
  title: stringType().nullable().optional(),
  image_url: stringType().nullable().optional(),
  url: stringType().nullable().optional(),
  price: CarouselPriceSchema.nullable().optional(),
  // Display-only brand label (e.g., "TRACT OPTICS"). Optional — backend
  // populates when product feed carries it; tile gracefully omits otherwise.
  brand: stringType().nullable().optional(),
  // Compare-at / strike-through price for sale items. Same shape as `price`.
  compare_at_price: CarouselPriceSchema.nullable().optional()
}).passthrough();
const CarouselNarrativeSchema = objectType({
  variant_id: stringType().default("default"),
  headline: stringType().nullable().optional(),
  body: stringType().nullable().optional(),
  hash: stringType().nullable().optional()
}).passthrough();
const CarouselSlotScoringSchema = objectType({
  served_propensity: numberType().optional(),
  exploration: booleanType().optional(),
  raw_score: numberType().nullable().optional()
}).passthrough();
const CarouselSlotPinSchema = objectType({
  rule_id: numberType().nullable().optional(),
  reason: stringType().nullable().optional()
}).passthrough();
const CarouselSlotSchema = objectType({
  position: numberType(),
  product: CarouselSlotProductSchema,
  narrative: CarouselNarrativeSchema.nullable(),
  scoring: CarouselSlotScoringSchema.optional(),
  // source ∈ fbt | ymal | trending | pinned_rule | pinned_forced — kept loose
  source: stringType().optional(),
  pin: CarouselSlotPinSchema.nullable().optional()
}).passthrough();
const CarouselAnchorSchema = objectType({
  type: stringType(),
  // 'sku' | 'tenant' | 'category' | 'page_type'
  value: stringType().nullable().optional()
}).passthrough();
const CarouselCacheSchema = objectType({
  key: stringType().nullable().optional(),
  ttl_seconds: numberType().optional(),
  expires_at: stringType().nullable().optional()
}).passthrough();
const CarouselResponseSchema = objectType({
  carousel_id: stringType(),
  website_code: stringType(),
  slot_code: stringType(),
  strategy: stringType(),
  anchor: CarouselAnchorSchema,
  policy_snapshot_id: stringType().optional(),
  model_version: stringType().optional(),
  slots: arrayType(CarouselSlotSchema).default([]),
  cache: CarouselCacheSchema.optional()
}).passthrough();
const CarouselNotAvailableSchema = objectType({
  status: literalType("not_available"),
  // Backend model is `reason: Optional[str] = None` (CarouselResponsePayload),
  // and it does not serialize with `exclude_none` — a not-available body with
  // no machine reason ships `"reason": null`, which a bare `.optional()`
  // rejects. Observed as an explicit null on real 200 bodies.
  reason: stringType().nullable().optional()
}).passthrough();
const CarouselEventItemSchema = objectType({
  item_id: stringType(),
  index: numberType().optional(),
  quantity: numberType().optional(),
  price: NumOrString.optional()
}).passthrough();
const CarouselEventSchema = objectType({
  event_name: enumType(["view_item_list", "select_item", "select_promotion", "add_to_cart", "purchase"]),
  carousel_id: stringType(),
  item_list_id: stringType().optional(),
  items: arrayType(CarouselEventItemSchema).default([]),
  timestamp: stringType(),
  session_id: stringType(),
  page_url: stringType()
}).passthrough();
const CarouselEventBatchSchema = objectType({
  website_code: stringType(),
  events: arrayType(CarouselEventSchema).default([])
}).passthrough();
export {
  CarouselResponseSchema as C,
  FacetsValuesResponseSchema as F,
  PLPResponseSchema as P,
  CarouselEventBatchSchema as a,
  CarouselAnchorSchema as b,
  createEventQueue as c,
  CarouselEventItemSchema as d,
  CarouselEventSchema as e,
  CarouselNarrativeSchema as f,
  CarouselNotAvailableSchema as g,
  CarouselPriceSchema as h,
  CarouselSlotPinSchema as i,
  CarouselSlotProductSchema as j,
  CarouselSlotSchema as k,
  CarouselSlotScoringSchema as l,
  PLPBulkPricingTierSchema as m,
  PLPCategorySchema as n,
  PLPFacetSchema as o,
  PLPFacetValueSchema as p,
  PLPFlagSchema as q,
  resolveProductRating as r,
  PLPPaginationSchema as s,
  PLPProductSchema as t,
  PLPRatingSchema as u,
  PLPReviewsSchema as v,
  PLPVariantImageSchema as w,
  narrowFacetValue as x
};
//# sourceMappingURL=shared-CzpdhQpl.js.map
