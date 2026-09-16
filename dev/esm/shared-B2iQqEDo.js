import { U as objectType, Y as stringType, X as arrayType, W as numberType, ba as enumType, bb as literalType, Z as unionType, V as booleanType } from "./shared-ChDzhkiY.js";
function resolvePriceFormat(currency, config) {
  if (!config) return "symbol";
  if (typeof config === "string") return config;
  if (config.byCurrency) {
    const override = config.byCurrency[currency.toUpperCase()];
    if (override) return override;
  }
  return config.default ?? "symbol";
}
const FALLBACK_FRACTION_DIGITS = 2;
function formatPriceParts(value, currency, locale = "en-US", style = "symbol") {
  if (!Number.isFinite(value)) return null;
  const intlDisplay = style === "code" ? "code" : style === "narrow" ? "narrowSymbol" : "symbol";
  let parts;
  try {
    parts = new Intl.NumberFormat(locale, {
      style: "currency",
      currency,
      currencyDisplay: intlDisplay
    }).formatToParts(value);
  } catch {
    return {
      leadingCurrency: currency + " ",
      amount: value.toFixed(FALLBACK_FRACTION_DIGITS),
      trailingCurrency: null
    };
  }
  let leading = "";
  let amount = "";
  let trailingBuffer = "";
  let trailing = "";
  let sawAmount = false;
  for (const part of parts) {
    if (part.type === "currency") {
      if (sawAmount) {
        trailing += trailingBuffer + part.value;
        trailingBuffer = "";
      } else {
        leading += part.value;
      }
    } else if (part.type === "literal") {
      if (!sawAmount) {
        leading += part.value;
      } else {
        trailingBuffer += part.value;
      }
    } else {
      amount += part.value;
      sawAmount = true;
    }
  }
  if (style === "symbol-code") {
    trailing = " " + currency;
  }
  return {
    leadingCurrency: leading.length > 0 ? leading : null,
    amount,
    trailingCurrency: trailing.length > 0 ? trailing : null
  };
}
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
  CarouselEventBatchSchema as a,
  CarouselAnchorSchema as b,
  createEventQueue as c,
  CarouselEventItemSchema as d,
  CarouselEventSchema as e,
  formatPriceParts as f,
  CarouselNarrativeSchema as g,
  CarouselNotAvailableSchema as h,
  CarouselPriceSchema as i,
  CarouselSlotPinSchema as j,
  CarouselSlotProductSchema as k,
  CarouselSlotSchema as l,
  CarouselSlotScoringSchema as m,
  resolvePriceFormat as r
};
//# sourceMappingURL=shared-B2iQqEDo.js.map
