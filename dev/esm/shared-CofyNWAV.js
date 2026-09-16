import { c, a, f, b, d, n, r, t } from "./shared-DzIJFy9k.js";
import { b as setSessionId, P as clearSessionId, A as API_ENDPOINTS, n as normalizeSessionResponse, R as RestSessionResponseSchema, Q as SdkParseError, g as getCurrentPage, U as objectType, V as booleanType, W as numberType, X as arrayType, Y as stringType, Z as unionType, _ as unknownType } from "./shared-ChDzhkiY.js";
import { $, a0, a1, a2, k, a3, a4, a5, D, a6, a7, a8, a9, O, aa, E, ab, ac, F, ad, ae, af, L, ag, ah, N, ai, aj, ak, al, am, an, ao, ap, aq, ar, as, at, S, au, av, aw, ax, ay, az, aA, T, aB, aC, aD, q, aE, aF, aG, u, v, x, p, C, c as c2, aH, h, B, z, G, H, f as f2, M, aI, aJ, m, aK, aL, aM, I, j, K, aN, aO, aP, aQ, aR, aS, aT, aU, aV, aW, aX, l, aY, i, o, aZ, a_, r as r2, y, w, a$, a as a10, b0, s, b1, d as d2, J, e, b2, b3, b4, b5, t as t2, b6, b7, b8, b9 } from "./shared-ChDzhkiY.js";
import { b as b10, a as a11, d as d3, e as e2, g, h as h2, i as i2, C as C2, j as j2, k as k2, l as l2, m as m2, c as c3, f as f3, r as r3 } from "./shared-B2iQqEDo.js";
import { c as c4, g as g2, a as a12, i as i3, s as s2 } from "./shared-mg2rmv2z.js";
import { C as C3 } from "./shared-k6TaZsTH.js";
import { P } from "./shared-Cnqm-sSd.js";
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
  $ as APIError,
  a0 as APITimeoutError,
  API_ENDPOINTS,
  a1 as API_URLS,
  a2 as AnswerOptionSchema,
  k as AnsweredIntentsStorage,
  a3 as ApiClient,
  a4 as BaseWebSocket,
  b10 as CarouselAnchorSchema,
  a11 as CarouselEventBatchSchema,
  d3 as CarouselEventItemSchema,
  e2 as CarouselEventSchema,
  g as CarouselNarrativeSchema,
  h2 as CarouselNotAvailableSchema,
  i2 as CarouselPriceSchema,
  C2 as CarouselResponseSchema,
  j2 as CarouselSlotPinSchema,
  k2 as CarouselSlotProductSchema,
  l2 as CarouselSlotSchema,
  m2 as CarouselSlotScoringSchema,
  a5 as CategorySchema,
  C3 as CategoryWebSocket,
  D as ChatWebSocket,
  a6 as ConfigurationError,
  a7 as ConnectionTimeoutError,
  a8 as ConsentService,
  a9 as ConversationIdMessageSchema,
  O as DEFAULT_STORAGE_KEYS,
  aa as DiscoveryQuestionMessageSchema,
  E as ERROR_MESSAGES,
  ab as ErrorMessageSchema,
  ac as EventService,
  F as FLOW_STATES,
  FacetsValuesResponseSchema,
  ad as FeedbackAPI,
  ae as FitEvaluationMessageSchema,
  af as LATENCY,
  L as LocalStorageAdapter,
  ag as MaxReconnectsError,
  ah as MemoryStorageAdapter,
  N as NullPlatformAdapter,
  ai as OmniguideError,
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
  aj as PingMessageSchema,
  ak as PlatformNotInitializedError,
  al as ProductSchema,
  P as ProductWebSocket,
  am as QuestionMessageSchema,
  an as RECOMMENDATIONS_EVENT,
  ao as RECONNECTION,
  ap as ResponseTimer,
  aq as RestDiscoveryAnswerSchema,
  ar as RestDiscoveryQuestionSchema,
  as as RestFeedbackResponseSchema,
  at as RestQuestionsResponseSchema,
  RestSessionResponseSchema,
  S as SDK_ORIGIN_MARKER,
  SdkParseError,
  au as SessionIdMessageSchema,
  SessionService,
  av as SessionStorage,
  aw as SourcesMessageSchema,
  ax as StorageError,
  ay as StreamChunkSchema,
  az as TIMEOUTS,
  aA as TYPEAHEAD_ENDPOINT,
  T as TYPEAHEAD_SECTION_ORDER,
  aB as WS_ENDPOINTS,
  aC as WebSocketError,
  aD as WebSocketMessageSchema,
  q as capturePageContext,
  c as clampPct,
  aE as cleanText,
  c4 as clearPreviewApiUrl,
  aF as clearRegistrySession,
  clearSessionId as clearRegistrySessionId,
  aG as createAPIWithRetry,
  u as createConsentService,
  c3 as createEventQueue,
  v as createEventService,
  x as createFeedbackAPI,
  p as createPlatformAdapter,
  C as createResponseTimer,
  c2 as createScopedLogger,
  createSessionService,
  aH as dedupeByUrl,
  h as emitRecommendations,
  B as extractSkusFromMarkdown,
  a as fetchCategoryQuestions,
  f as fetchProductQuestions,
  z as fetchTypeaheadSearch,
  G as filterEmptyContent,
  H as filterRedundantContent,
  f2 as formatPrice,
  f3 as formatPriceParts,
  M as getApiBaseUrl,
  aI as getConsentState,
  getCurrentPage,
  aJ as getEventService,
  m as getFeatureStatus,
  aK as getLastRecommendations,
  aL as getPageContext,
  aM as getPlatformAdapter,
  g2 as getPreviewApiUrl,
  I as getRegistryConversationId,
  j as getRegistrySessionId,
  K as getRegistrySessionStart,
  aN as getWebSocketBaseUrl,
  a12 as initPreviewFromQueryParam,
  aO as isDiscoveryQuestion,
  aP as isDiscoveryQuestionId,
  aQ as isErrorMessage,
  aR as isLocalhost,
  aS as isOmniguideError,
  aT as isPingMessage,
  i3 as isPreviewMode,
  aU as isSafeNavigationUrl,
  aV as isSessionIdMessage,
  aW as isSourcesMessage,
  aX as isStreamChunk,
  l as logger,
  narrowFacetValue,
  aY as normalizeFeedbackResponse,
  b as normalizeMatchPct,
  i as normalizeQuestions,
  d as normalizeRecommendedProduct,
  n as normalizeRecommendedProducts,
  normalizeSessionResponse,
  o as onFeatureStatusChange,
  aZ as onRecommendations,
  a_ as parseAndValidateMessage,
  r2 as platformRegistry,
  y as registerConsentService,
  w as registerEventService,
  a$ as requirePlatformAdapter,
  r as resolveContainer,
  r3 as resolvePriceFormat,
  resolveProductRating,
  a10 as safeHref,
  b0 as safeJsonParse,
  s as sanitizeUrl,
  b1 as setCurrentPageOverride,
  d2 as setFeatureStatus,
  s2 as setPreviewApiUrl,
  J as setRegistryConversationId,
  setSessionId as setRegistrySessionId,
  e as setRegistrySessionStart,
  b2 as shortenText,
  b3 as startDataLayerBridge,
  b4 as toDiscoveryId,
  t as toMatchPct,
  b5 as trackEvent,
  t2 as transformSummary,
  b6 as updateEventContext,
  b7 as validateMessage,
  b8 as validateWebSocketMessage,
  b9 as wrapError
};
//# sourceMappingURL=shared-CofyNWAV.js.map
