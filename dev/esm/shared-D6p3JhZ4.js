import { c, a, f, b, d, n, r, t } from "./shared-BOdq4Pmz.js";
import { b as setSessionId, K as clearSessionId, A as API_ENDPOINTS, n as normalizeSessionResponse, R as RestSessionResponseSchema, M as SdkParseError, g as getCurrentPage, O as objectType, P as booleanType, Q as numberType, U as arrayType, V as stringType, W as unionType, X as unknownType } from "./shared-D-rUcHCG.js";
import { Y, Z, _, $, j, a0, a1, a2, C, a3, a4, a5, a6, J, a7, E, a8, a9, F, aa, ab, ac, L, ad, ae, N, af, ag, ah, ai, aj, ak, al, am, an, ao, ap, aq, S, ar, as, at, au, av, aw, ax, T, ay, az, aA, m, aB, aC, aD, aE, aF, r as r2, l, x, aG, e, q, w, v, z, B, f as f2, I, u, aH, aI, k, aJ, aK, aL, D, i, H, aM, aN, aO, aP, aQ, aR, aS, aT, aU, aV, aW, aX, aY, h, y, o, aZ, a_, p, a$, b0, b1, a as a10, b2, s, b3, c as c2, G, d as d2, b4, b5, b6, b7, t as t2, b8, b9, ba, bb } from "./shared-D-rUcHCG.js";
import { _ as _2, b as b10, a as a11, c as c3, d as d3, g, e as e2, i as i2, l as l2, r as r3, s as s2 } from "./shared-BWLi5bpq.js";
import { b as b11, a as a12, d as d4, e as e3, g as g2, h as h2, i as i3, C as C2, j as j2, k as k2, l as l3, m as m2, c as c4, f as f3, r as r4 } from "./shared-DT4m2sP-.js";
import { C as C3 } from "./shared-Bok18awv.js";
import { P } from "./shared-CkBOgQRS.js";
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
const NumOrString = unionType([numberType(), stringType()]);
const PriceLike = NumOrString.nullable().optional();
const PLPVariantImageSchema = objectType({
  variant_id: NumOrString.nullish(),
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
  average_rating: NumOrString.nullable().optional().catch(null),
  review_count: NumOrString.nullable().optional().catch(null),
  summary: stringType().nullable().optional().catch(null)
}).passthrough();
const PLPBulkPricingTierSchema = objectType({
  min_qty: numberType().optional(),
  max_qty: numberType().nullable().optional(),
  price: PriceLike,
  type: stringType().optional()
}).passthrough();
const PLPProductSchema = objectType({
  id: NumOrString,
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
  id: NumOrString,
  name: stringType().optional(),
  url: stringType().optional(),
  product_count: numberType().optional()
}).passthrough();
const PLPCategoryRedirectSchema = objectType({
  id: NumOrString,
  name: stringType().optional(),
  url: stringType().optional()
}).passthrough();
const PLPCategorySchema = objectType({
  id: NumOrString,
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
export {
  Y as APIError,
  Z as APITimeoutError,
  API_ENDPOINTS,
  _ as API_URLS,
  $ as AnswerOptionSchema,
  j as AnsweredIntentsStorage,
  a0 as ApiClient,
  a1 as BaseWebSocket,
  b11 as CarouselAnchorSchema,
  a12 as CarouselEventBatchSchema,
  d4 as CarouselEventItemSchema,
  e3 as CarouselEventSchema,
  g2 as CarouselNarrativeSchema,
  h2 as CarouselNotAvailableSchema,
  i3 as CarouselPriceSchema,
  C2 as CarouselResponseSchema,
  j2 as CarouselSlotPinSchema,
  k2 as CarouselSlotProductSchema,
  l3 as CarouselSlotSchema,
  m2 as CarouselSlotScoringSchema,
  a2 as CategorySchema,
  C3 as CategoryWebSocket,
  C as ChatWebSocket,
  a3 as ConfigurationError,
  a4 as ConnectionTimeoutError,
  a5 as ConsentService,
  a6 as ConversationIdMessageSchema,
  J as DEFAULT_STORAGE_KEYS,
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
  PLPReviewsSchema,
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
  m as capturePageContext,
  b10 as checkAnalyticsAdapter,
  c as clampPct,
  aB as cleanText,
  a11 as clearPreviewApiUrl,
  aC as clearRegistrySession,
  clearSessionId as clearRegistrySessionId,
  aD as createAPIWithRetry,
  aE as createConsentService,
  c4 as createEventQueue,
  aF as createEventService,
  r2 as createFeedbackAPI,
  l as createPlatformAdapter,
  x as createResponseTimer,
  c3 as createScopedLogger,
  createSessionService,
  aG as dedupeByUrl,
  e as emitRecommendations,
  q as ensurePageEventService,
  w as extractSkusFromMarkdown,
  a as fetchCategoryQuestions,
  f as fetchProductQuestions,
  v as fetchTypeaheadSearch,
  z as filterEmptyContent,
  B as filterRedundantContent,
  f2 as formatPrice,
  f3 as formatPriceParts,
  d3 as getAnalyticsAdapterHealth,
  I as getApiBaseUrl,
  u as getConsentService,
  aH as getConsentState,
  getCurrentPage,
  aI as getEventService,
  k as getFeatureStatus,
  aJ as getLastRecommendations,
  aK as getPageContext,
  aL as getPlatformAdapter,
  g as getPreviewApiUrl,
  D as getRegistryConversationId,
  i as getRegistrySessionId,
  H as getRegistrySessionStart,
  aM as getWebSocketBaseUrl,
  e2 as initPreviewFromQueryParam,
  aN as isDataLayerBridgeEnabled,
  aO as isDiscoveryQuestion,
  aP as isDiscoveryQuestionId,
  aQ as isErrorMessage,
  aR as isLocalhost,
  aS as isOmniguideError,
  aT as isPingMessage,
  i2 as isPreviewMode,
  aU as isSafeNavigationUrl,
  aV as isSessionIdMessage,
  aW as isSourcesMessage,
  aX as isStreamChunk,
  l2 as logger,
  narrowFacetValue,
  aY as normalizeFeedbackResponse,
  b as normalizeMatchPct,
  h as normalizeQuestions,
  d as normalizeRecommendedProduct,
  n as normalizeRecommendedProducts,
  normalizeSessionResponse,
  y as numericCount,
  o as onFeatureStatusChange,
  aZ as onRecommendations,
  a_ as parseAndValidateMessage,
  p as platformRegistry,
  a$ as registerConsentService,
  b0 as registerEventService,
  r3 as reportAnalyticsAdapterThrew,
  b1 as requirePlatformAdapter,
  r as resolveContainer,
  r4 as resolvePriceFormat,
  resolveProductRating,
  a10 as safeHref,
  b2 as safeJsonParse,
  s as sanitizeUrl,
  b3 as setCurrentPageOverride,
  c2 as setFeatureStatus,
  s2 as setPreviewApiUrl,
  G as setRegistryConversationId,
  setSessionId as setRegistrySessionId,
  d2 as setRegistrySessionStart,
  b4 as shortenText,
  b5 as startDataLayerBridge,
  b6 as toDiscoveryId,
  t as toMatchPct,
  b7 as trackEvent,
  t2 as transformSummary,
  b8 as updateEventContext,
  b9 as validateMessage,
  ba as validateWebSocketMessage,
  bb as wrapError
};
//# sourceMappingURL=shared-D6p3JhZ4.js.map
