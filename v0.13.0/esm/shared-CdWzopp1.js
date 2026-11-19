import { a as setSessionId, a4 as clearSessionId, A as API_ENDPOINTS, n as nativeFetch, c as normalizeSessionResponse, R as RestSessionResponseSchema, a5 as SdkParseError, b as getCurrentPage } from "./shared-B8dgHFMk.js";
import { a6, a7, a8, a9, m, aa, B, ab, ac, X, ad, ae, af, ag, ah, a3, ai, V, aj, ak, F, al, am, an, L, ao, ap, N, aq, ar, as, at, au, av, aw, ax, ay, az, aA, aB, aC, _, aD, aE, aF, aG, aH, aI, aJ, Q, aK, T, aL, aM, aN, aO, x, y, aP, aQ, aR, aS, aT, aU, D, w, U, aV, G, f, C, S, q, k, P, M, $, a0, J, H, a2, E, aW, aX, u, aY, aZ, a_, g, l, Z, a$, o, b0, b1, b2, b3, b4, b5, b6, b7, O, b8, b9, ba, bb, K, bc, bd, j, be, p, W, v, bf, bg, z, bh, bi, bj, Y, I, r, s, bk, h, bl, d, a1, e, bm, bn, bo, i, bp, t, bq, br, bs, bt } from "./shared-B8dgHFMk.js";
import { _ as _2, e as e2, a, c, h as h2, d as d2, f as f2, j as j2, g as g2, k as k2, i as i2, m as m2, l as l2, r as r2, b, n, s as s2 } from "./shared-B44A3pDU.js";
import { r as r3 } from "./shared-2BGWnT-d.js";
import { c as c2 } from "./shared-7GSPZGwY.js";
import { C as C2, a as a4, b as b10, c as c3, d as d3, e as e3, f as f3, g as g3, h as h3, i as i3, j as j3, k as k3 } from "./shared-Cbzgap18.js";
import { C as C3 } from "./shared-Bw2vtRFO.js";
import { F as F2, P as P2, a as a5, b as b11, c as c4, d as d4, e as e4, f as f4, g as g4, h as h4, i as i4, j as j4, k as k4, n as n2, r as r4 } from "./shared-DTFf0PIp.js";
import { P as P3 } from "./shared-BkU5qOBi.js";
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
    const response = await nativeFetch(url, {
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
export {
  a6 as APIError,
  a7 as APITimeoutError,
  API_ENDPOINTS,
  a8 as API_URLS,
  a9 as AnswerOptionSchema,
  m as AnsweredIntentsStorage,
  aa as ApiClient,
  B as BIGCOMMERCE_HYDRATION_SOURCE,
  ab as BaseWebSocket,
  C2 as CarouselAnchorSchema,
  a4 as CarouselEventBatchSchema,
  b10 as CarouselEventItemSchema,
  c3 as CarouselEventSchema,
  d3 as CarouselNarrativeSchema,
  e3 as CarouselNotAvailableSchema,
  f3 as CarouselPriceSchema,
  g3 as CarouselResponseSchema,
  h3 as CarouselSlotPinSchema,
  i3 as CarouselSlotProductSchema,
  j3 as CarouselSlotSchema,
  k3 as CarouselSlotScoringSchema,
  ac as CategorySchema,
  C3 as CategoryWebSocket,
  X as ChatStream,
  ad as ChatWebSocket,
  ae as ConfigurationError,
  af as ConnectionTimeoutError,
  ag as ConsentService,
  ah as ConversationIdMessageSchema,
  a3 as DEFAULT_STORAGE_KEYS,
  ai as DiscoveryQuestionMessageSchema,
  V as ERROR_MESSAGES,
  aj as ErrorMessageSchema,
  ak as EventService,
  F as FLOW_STATES,
  F2 as FacetsValuesResponseSchema,
  al as FeedbackAPI,
  am as FitEvaluationMessageSchema,
  an as LATENCY,
  L as LocalStorageAdapter,
  ao as MaxReconnectsError,
  ap as MemoryStorageAdapter,
  N as NullPlatformAdapter,
  aq as OmniguideError,
  P2 as PLPBrandSchema,
  a5 as PLPBulkPricingTierSchema,
  b11 as PLPCategorySchema,
  c4 as PLPFacetSchema,
  d4 as PLPFacetValueSchema,
  e4 as PLPFlagSchema,
  f4 as PLPPaginationSchema,
  g4 as PLPProductSchema,
  h4 as PLPRatingSchema,
  i4 as PLPResponseSchema,
  j4 as PLPReviewsSchema,
  k4 as PLPVariantImageSchema,
  ar as PingMessageSchema,
  as as PlatformNotInitializedError,
  at as ProductSchema,
  P3 as ProductWebSocket,
  au as QuestionMessageSchema,
  av as RANKING_DEBUG_PARAM,
  aw as RECOMMENDATIONS_EVENT,
  ax as RECONNECTION,
  ay as ResponseTimer,
  az as RestDiscoveryAnswerSchema,
  aA as RestDiscoveryQuestionSchema,
  aB as RestFeedbackResponseSchema,
  aC as RestQuestionsResponseSchema,
  RestSessionResponseSchema,
  _ as SDK_ORIGIN_MARKER,
  SdkParseError,
  aD as SessionIdMessageSchema,
  SessionService,
  aE as SessionStorage,
  aF as SourcesMessageSchema,
  aG as StorageError,
  aH as StreamChunkSchema,
  aI as TIMEOUTS,
  aJ as TYPEAHEAD_ENDPOINT,
  Q as TYPEAHEAD_MIN_QUERY_LENGTH,
  aK as TYPEAHEAD_NEW_ARRIVALS_ENDPOINT,
  T as TYPEAHEAD_SECTION_ORDER,
  aL as WS_ENDPOINTS,
  aM as WebSocketError,
  aN as WebSocketMessageSchema,
  _2 as _resetAnalyticsAdapterHealth,
  aO as asErrorLike,
  x as bigCommerceSearchPage,
  y as capturePageContext,
  e2 as checkAnalyticsAdapter,
  aP as clampPct,
  aQ as cleanText,
  a as clearPreviewApiUrl,
  aR as clearRegistrySession,
  clearSessionId as clearRegistrySessionId,
  aS as createAPIWithRetry,
  aT as createConsentService,
  c2 as createEventQueue,
  aU as createEventService,
  D as createFeedbackAPI,
  w as createPlatformAdapter,
  U as createResponseTimer,
  c as createScopedLogger,
  createSessionService,
  h2 as currencyMinorUnits,
  aV as dedupeByUrl,
  G as displayPriceRange,
  d2 as dropsCents,
  f as emitRecommendations,
  C as ensurePageEventService,
  S as extractSkusFromMarkdown,
  q as fetchCategoryQuestions,
  k as fetchProductQuestions,
  P as fetchTypeaheadNewArrivals,
  M as fetchTypeaheadSearch,
  $ as filterEmptyContent,
  a0 as filterRedundantContent,
  f2 as formatPrice,
  J as formatPriceParts,
  H as formatPriceRange,
  j2 as getAnalyticsAdapterHealth,
  a2 as getApiBaseUrl,
  E as getConsentService,
  aW as getConsentState,
  getCurrentPage,
  aX as getEventService,
  u as getFeatureStatus,
  aY as getLastRecommendations,
  aZ as getPageContext,
  a_ as getPlatformAdapter,
  g2 as getPreviewApiUrl,
  g as getRegistryConversationId,
  l as getRegistrySessionId,
  Z as getRegistrySessionStart,
  a$ as getWebSocketBaseUrl,
  k2 as initPreviewFromQueryParam,
  o as inlineTypeName,
  b0 as isAbortError,
  b1 as isDataLayerBridgeEnabled,
  b2 as isDiscoveryQuestion,
  b3 as isDiscoveryQuestionId,
  b4 as isErrorMessage,
  b5 as isLocalhost,
  b6 as isOmniguideError,
  b7 as isPingMessage,
  i2 as isPreviewMode,
  O as isRankingDebug,
  b8 as isSafeNavigationUrl,
  b9 as isSessionIdMessage,
  ba as isSourcesMessage,
  bb as isStreamChunk,
  m2 as isWholeAmount,
  l2 as logger,
  K as markdownOf,
  n2 as narrowFacetValue,
  nativeFetch,
  bc as normalizeFeedbackResponse,
  bd as normalizeMatchPct,
  j as normalizeQuestions,
  be as normalizeRecommendedProduct,
  p as normalizeRecommendedProducts,
  normalizeSessionResponse,
  W as numericCount,
  v as onFeatureStatusChange,
  bf as onRecommendations,
  bg as parseAndValidateMessage,
  z as platformRegistry,
  bh as registerConsentService,
  bi as registerEventService,
  r2 as reportAnalyticsAdapterThrew,
  bj as requirePlatformAdapter,
  r3 as resolveContainer,
  Y as resolveHydrationSource,
  I as resolvePriceFormat,
  r4 as resolveProductRating,
  r as resolveSearchPage,
  s as safeHref,
  bk as safeJsonParse,
  h as sanitizeUrl,
  b as savePercent,
  bl as setCurrentPageOverride,
  d as setFeatureStatus,
  n as setPreviewApiUrl,
  a1 as setRegistryConversationId,
  setSessionId as setRegistrySessionId,
  e as setRegistrySessionStart,
  s2 as setWholePrices,
  bm as shortenText,
  bn as startDataLayerBridge,
  bo as toDiscoveryId,
  i as toMatchPct,
  bp as trackEvent,
  t as transformSummary,
  bq as updateEventContext,
  br as validateMessage,
  bs as validateWebSocketMessage,
  bt as wrapError
};
