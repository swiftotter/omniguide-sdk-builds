import { c, b, a, f, d, e, n, t } from "./shared-B4-9e8Qj.js";
import { b as setSessionId, I as clearSessionId, d as API_ENDPOINTS, f as normalizeSessionResponse, R as RestSessionResponseSchema, J as SdkParseError, c as getCurrentPage, K as objectType, M as booleanType, O as numberType, P as arrayType, Q as stringType, U as unionType, V as unknownType, W as enumType, X as literalType } from "./shared-C7u2tJMb.js";
import { Y, Z, _, $, A, a0, a1, a2, C, a3, a4, a5, a6, H, a7, E, a8, a9, F, aa, ab, ac, L, ad, ae, N, af, ag, ah, ai, aj, ak, al, am, an, ao, ap, aq, S, ar, as, at, au, av, aw, ax, T, ay, az, aA, aB, k, aC, aD, aE, aF, aG, m, j, w, aH, e as e2, l, v, r, x, y, G, q, aI, aJ, i, aK, aL, aM, z, g, D, aN, aO, aP, aQ, aR, aS, aT, aU, aV, aW, aX, aY, aZ, n as n2, o, a_, a$, p, b0, b1, b2, a as a10, b3, u, b4, h, B, s, b5, b6, b7, b8, t as t2, b9, ba, bb, bc } from "./shared-C7u2tJMb.js";
import { _ as _2, b as b10, a as a11, c as c2, d as d2, f as f2, g as g2, h as h2, i as i2, l as l2, e as e3, r as r2, s as s2 } from "./shared-3RjZl2bW.js";
import { C as C2 } from "./shared-WlHFWiVm.js";
import { P } from "./shared-rAq5dS4d.js";
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
const DEFAULT_STORAGE_KEY = "omniguideSessionId";
class SessionService {
  constructor(config) {
    this.initializationPromise = null;
    this.apiBaseUrl = config.apiBaseUrl.replace(/\/$/, "");
    this.websiteId = config.websiteId;
    this.storageKey = config.storageKey ?? DEFAULT_STORAGE_KEY;
    if (config.storage) {
      this.storage = config.storage;
    } else if (typeof localStorage !== "undefined") {
      this.storage = localStorage;
    } else {
      const store = /* @__PURE__ */ new Map();
      this.storage = {
        getItem: (key) => store.get(key) ?? null,
        setItem: (key, value) => {
          store.set(key, value);
        },
        removeItem: (key) => {
          store.delete(key);
        }
      };
    }
  }
  /**
   * Get session ID from storage.
   */
  getSessionId() {
    return this.storage.getItem(this.storageKey) || "";
  }
  /**
   * Store session ID.
   */
  storeSessionId(sessionId) {
    this.storage.setItem(this.storageKey, sessionId);
    setSessionId(this.websiteId, sessionId);
  }
  /**
   * Clear the session ID.
   */
  clearSessionId() {
    this.storage.removeItem(this.storageKey);
    clearSessionId(this.websiteId);
  }
  /**
   * Update the session ID with a canonical ID from the server.
   */
  updateSessionId(newSessionId) {
    if (!newSessionId || typeof newSessionId !== "string") {
      return;
    }
    const currentSessionId = this.storage.getItem(this.storageKey);
    if (currentSessionId !== newSessionId) {
      this.storeSessionId(newSessionId);
    }
  }
  /**
   * Create a new session via the Omniguide API.
   * Uses normalize → validate → return pattern.
   */
  async createSession() {
    const url = `${this.apiBaseUrl}${API_ENDPOINTS.CONVERSATIONAL_SEARCH_INIT}`;
    const currentPage = getCurrentPage();
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        website_code: this.websiteId,
        session_id: null,
        current_page: currentPage
      })
    });
    if (!response.ok) {
      throw new Error(`Failed to create session: ${response.status}`);
    }
    const raw = await response.json();
    const normalized = normalizeSessionResponse(raw);
    const validated = RestSessionResponseSchema.safeParse(normalized);
    if (!validated.success) {
      throw new SdkParseError("conversational-search/initialize", validated.error);
    }
    if (!validated.data.sessionId) {
      throw new SdkParseError("conversational-search/initialize", "No sessionId in response");
    }
    this.storeSessionId(validated.data.sessionId);
    return validated.data.sessionId;
  }
  /**
   * Ensure a session ID is available — get existing or create new.
   * Multiple callers share the same initialization promise (deduplication).
   */
  async ensureSession() {
    const existingSession = this.getSessionId();
    if (existingSession) {
      return existingSession;
    }
    if (this.initializationPromise) {
      return this.initializationPromise;
    }
    this.initializationPromise = this.createSession().finally(() => {
      this.initializationPromise = null;
    });
    return this.initializationPromise;
  }
}
function createSessionService(config) {
  return new SessionService(config);
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
    const f3 = getFetch();
    if (typeof f3 !== "function") return false;
    try {
      void f3(endpoint, {
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
  rating: PLPRatingSchema.nullable().optional()
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
const NumOrString = unionType([numberType(), stringType()]);
const CarouselPriceObjectSchema = objectType({
  amount: unionType([stringType(), numberType()]),
  currency: stringType().optional(),
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
  key: stringType().optional(),
  ttl_seconds: numberType().optional(),
  expires_at: stringType().optional()
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
  reason: stringType().optional()
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
  Y as APIError,
  Z as APITimeoutError,
  API_ENDPOINTS,
  _ as API_URLS,
  $ as AnswerOptionSchema,
  A as AnsweredIntentsStorage,
  a0 as ApiClient,
  a1 as BaseWebSocket,
  CarouselAnchorSchema,
  CarouselEventBatchSchema,
  CarouselEventItemSchema,
  CarouselEventSchema,
  CarouselNarrativeSchema,
  CarouselNotAvailableSchema,
  CarouselPriceSchema,
  CarouselResponseSchema,
  CarouselSlotPinSchema,
  CarouselSlotProductSchema,
  CarouselSlotSchema,
  CarouselSlotScoringSchema,
  a2 as CategorySchema,
  C2 as CategoryWebSocket,
  C as ChatWebSocket,
  a3 as ConfigurationError,
  a4 as ConnectionTimeoutError,
  a5 as ConsentService,
  a6 as ConversationIdMessageSchema,
  H as DEFAULT_STORAGE_KEYS,
  a7 as DiscoveryQuestionMessageSchema,
  E as ERROR_MESSAGES,
  a8 as ErrorMessageSchema,
  a9 as EventService,
  F as FLOW_STATES,
  FacetsValuesResponseSchema,
  aa as FeedbackAPI,
  ab as FitEvaluationMessageSchema,
  ac as LATENCY,
  L as LocalStorageAdapter,
  ad as MaxReconnectsError,
  ae as MemoryStorageAdapter,
  N as NullPlatformAdapter,
  af as OmniguideError,
  PLPBulkPricingTierSchema,
  PLPCategorySchema,
  PLPFacetSchema,
  PLPFacetValueSchema,
  PLPFlagSchema,
  PLPPaginationSchema,
  PLPProductSchema,
  PLPRatingSchema,
  PLPResponseSchema,
  PLPVariantImageSchema,
  ag as PingMessageSchema,
  ah as PlatformNotInitializedError,
  ai as ProductSchema,
  P as ProductWebSocket,
  aj as QuestionMessageSchema,
  ak as RECOMMENDATIONS_EVENT,
  al as RECONNECTION,
  am as ResponseTimer,
  an as RestDiscoveryAnswerSchema,
  ao as RestDiscoveryQuestionSchema,
  ap as RestFeedbackResponseSchema,
  aq as RestQuestionsResponseSchema,
  RestSessionResponseSchema,
  S as SDK_ORIGIN_MARKER,
  SdkParseError,
  ar as SessionIdMessageSchema,
  SessionService,
  as as SessionStorage,
  at as SourcesMessageSchema,
  au as StorageError,
  av as StreamChunkSchema,
  aw as TIMEOUTS,
  ax as TYPEAHEAD_ENDPOINT,
  T as TYPEAHEAD_SECTION_ORDER,
  ay as WS_ENDPOINTS,
  az as WebSocketError,
  aA as WebSocketMessageSchema,
  _2 as _resetAnalyticsAdapterHealth,
  aB as _resetDataLayerBridge,
  k as capturePageContext,
  b10 as checkAnalyticsAdapter,
  c as clampPct,
  aC as cleanText,
  a11 as clearPreviewApiUrl,
  aD as clearRegistrySession,
  clearSessionId as clearRegistrySessionId,
  aE as createAPIWithRetry,
  aF as createConsentService,
  createEventQueue,
  aG as createEventService,
  m as createFeedbackAPI,
  j as createPlatformAdapter,
  w as createResponseTimer,
  c2 as createScopedLogger,
  createSessionService,
  aH as dedupeByUrl,
  d2 as describeMountTargets,
  e2 as emitRecommendations,
  l as ensurePageEventService,
  v as extractSkusFromMarkdown,
  b as fetchCategoryQuestions,
  a as fetchProductQuestions,
  r as fetchTypeaheadSearch,
  x as filterEmptyContent,
  y as filterRedundantContent,
  f as formatPrice,
  formatPriceParts,
  f2 as getAnalyticsAdapterHealth,
  G as getApiBaseUrl,
  q as getConsentService,
  aI as getConsentState,
  getCurrentPage,
  aJ as getEventService,
  i as getFeatureStatus,
  aK as getLastRecommendations,
  aL as getPageContext,
  aM as getPlatformAdapter,
  g2 as getPreviewApiUrl,
  z as getRegistryConversationId,
  g as getRegistrySessionId,
  D as getRegistrySessionStart,
  aN as getWebSocketBaseUrl,
  h2 as initPreviewFromQueryParam,
  aO as isDataLayerBridgeEnabled,
  aP as isDiscoveryQuestion,
  aQ as isDiscoveryQuestionId,
  aR as isErrorMessage,
  aS as isLocalhost,
  aT as isOmniguideError,
  aU as isPingMessage,
  i2 as isPreviewMode,
  aV as isSafeNavigationUrl,
  aW as isSessionIdMessage,
  aX as isSourcesMessage,
  aY as isStreamChunk,
  l2 as logger,
  narrowFacetValue,
  aZ as normalizeFeedbackResponse,
  d as normalizeMatchPct,
  n2 as normalizeQuestions,
  e as normalizeRecommendedProduct,
  n as normalizeRecommendedProducts,
  normalizeSessionResponse,
  o as onFeatureStatusChange,
  a_ as onRecommendations,
  a$ as parseAndValidateMessage,
  p as platformRegistry,
  b0 as registerConsentService,
  b1 as registerEventService,
  e3 as reportAnalyticsAdapterThrew,
  b2 as requirePlatformAdapter,
  r2 as resolveContainer,
  resolvePriceFormat,
  a10 as safeHref,
  b3 as safeJsonParse,
  u as sanitizeUrl,
  b4 as setCurrentPageOverride,
  h as setFeatureStatus,
  s2 as setPreviewApiUrl,
  B as setRegistryConversationId,
  setSessionId as setRegistrySessionId,
  s as setRegistrySessionStart,
  b5 as shortenText,
  b6 as startDataLayerBridge,
  b7 as toDiscoveryId,
  t as toMatchPct,
  b8 as trackEvent,
  t2 as transformSummary,
  b9 as updateEventContext,
  ba as validateMessage,
  bb as validateWebSocketMessage,
  bc as wrapError
};
//# sourceMappingURL=shared-47rI5hQi.js.map
