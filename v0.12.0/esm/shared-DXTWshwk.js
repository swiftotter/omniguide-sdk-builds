import { h as setSessionId, a7 as clearSessionId, A as API_ENDPOINTS, n as nativeFetch, l as normalizeSessionResponse, R as RestSessionResponseSchema, a8 as SdkParseError, k as getCurrentPage } from "./shared-jysnbphs.js";
import { a9, aa, ab, ac, x, ad, G, ae, af, _, ag, ah, ai, aj, ak, a6, al, Y, am, an, F, ao, ap, aq, L, ar, as, N, at, au, av, aw, ax, ay, az, aA, aB, aC, aD, aE, aF, a1, aG, aH, aI, aJ, aK, aL, aM, T, aN, O, aO, aP, aQ, aR, H, aS, aT, aU, aV, aW, aX, K, E, X, aY, aZ, d, q, J, W, B, v, V, S, a2, a3, a, Q, f, a5, M, a_, a$, C, b0, b1, b2, j, w, a0, b3, y, i, b4, b5, b6, b7, b8, b9, ba, U, bb, bc, bd, be, bf, bg, bh, u, bi, z, Z, D, bj, bk, I, bl, bm, bn, $, P, s, bo, b, bp, m, a4, p, bq, br, bs, r, bt, t, bu, bv, bw, bx } from "./shared-jysnbphs.js";
import { _ as _2, b as b10, a as a7, c, d as d2, g, e, i as i2, l, r as r2, s as s2 } from "./shared-BNYgySGb.js";
import { r as r3 } from "./shared-2BGWnT-d.js";
import { d as d3, a as a8, e as e2, f as f2, g as g2, h, i as i3, C as C2, j as j2, k, l as l2, m as m2, F as F2, n, o, p as p2, b as b11, q as q2, s as s3, t as t2, u as u2, v as v2, P as P2, w as w2, x as x2, c as c2, y as y2, r as r4 } from "./shared-CZBbSUDF.js";
import { C as C3 } from "./shared-DY4Dz0SM.js";
import { P as P3 } from "./shared-BjwZJ1-h.js";
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
  a9 as APIError,
  aa as APITimeoutError,
  API_ENDPOINTS,
  ab as API_URLS,
  ac as AnswerOptionSchema,
  x as AnsweredIntentsStorage,
  ad as ApiClient,
  G as BIGCOMMERCE_HYDRATION_SOURCE,
  ae as BaseWebSocket,
  d3 as CarouselAnchorSchema,
  a8 as CarouselEventBatchSchema,
  e2 as CarouselEventItemSchema,
  f2 as CarouselEventSchema,
  g2 as CarouselNarrativeSchema,
  h as CarouselNotAvailableSchema,
  i3 as CarouselPriceSchema,
  C2 as CarouselResponseSchema,
  j2 as CarouselSlotPinSchema,
  k as CarouselSlotProductSchema,
  l2 as CarouselSlotSchema,
  m2 as CarouselSlotScoringSchema,
  af as CategorySchema,
  C3 as CategoryWebSocket,
  _ as ChatStream,
  ag as ChatWebSocket,
  ah as ConfigurationError,
  ai as ConnectionTimeoutError,
  aj as ConsentService,
  ak as ConversationIdMessageSchema,
  a6 as DEFAULT_STORAGE_KEYS,
  al as DiscoveryQuestionMessageSchema,
  Y as ERROR_MESSAGES,
  am as ErrorMessageSchema,
  an as EventService,
  F as FLOW_STATES,
  F2 as FacetsValuesResponseSchema,
  ao as FeedbackAPI,
  ap as FitEvaluationMessageSchema,
  aq as LATENCY,
  L as LocalStorageAdapter,
  ar as MaxReconnectsError,
  as as MemoryStorageAdapter,
  N as NullPlatformAdapter,
  at as OmniguideError,
  n as PLPBrandSchema,
  o as PLPBulkPricingTierSchema,
  p2 as PLPCategorySchema,
  b11 as PLPFacetSchema,
  q2 as PLPFacetValueSchema,
  s3 as PLPFlagSchema,
  t2 as PLPPaginationSchema,
  u2 as PLPProductSchema,
  v2 as PLPRatingSchema,
  P2 as PLPResponseSchema,
  w2 as PLPReviewsSchema,
  x2 as PLPVariantImageSchema,
  au as PingMessageSchema,
  av as PlatformNotInitializedError,
  aw as ProductSchema,
  P3 as ProductWebSocket,
  ax as QuestionMessageSchema,
  ay as RANKING_DEBUG_PARAM,
  az as RECOMMENDATIONS_EVENT,
  aA as RECONNECTION,
  aB as ResponseTimer,
  aC as RestDiscoveryAnswerSchema,
  aD as RestDiscoveryQuestionSchema,
  aE as RestFeedbackResponseSchema,
  aF as RestQuestionsResponseSchema,
  RestSessionResponseSchema,
  a1 as SDK_ORIGIN_MARKER,
  SdkParseError,
  aG as SessionIdMessageSchema,
  SessionService,
  aH as SessionStorage,
  aI as SourcesMessageSchema,
  aJ as StorageError,
  aK as StreamChunkSchema,
  aL as TIMEOUTS,
  aM as TYPEAHEAD_ENDPOINT,
  T as TYPEAHEAD_MIN_QUERY_LENGTH,
  aN as TYPEAHEAD_NEW_ARRIVALS_ENDPOINT,
  O as TYPEAHEAD_SECTION_ORDER,
  aO as WS_ENDPOINTS,
  aP as WebSocketError,
  aQ as WebSocketMessageSchema,
  _2 as _resetAnalyticsAdapterHealth,
  aR as asErrorLike,
  H as capturePageContext,
  b10 as checkAnalyticsAdapter,
  aS as clampPct,
  aT as cleanText,
  a7 as clearPreviewApiUrl,
  aU as clearRegistrySession,
  clearSessionId as clearRegistrySessionId,
  aV as createAPIWithRetry,
  aW as createConsentService,
  c2 as createEventQueue,
  aX as createEventService,
  K as createFeedbackAPI,
  E as createPlatformAdapter,
  X as createResponseTimer,
  c as createScopedLogger,
  createSessionService,
  aY as currencyMinorUnits,
  aZ as dedupeByUrl,
  d as displayPriceRange,
  q as emitRecommendations,
  J as ensurePageEventService,
  W as extractSkusFromMarkdown,
  B as fetchCategoryQuestions,
  v as fetchProductQuestions,
  V as fetchTypeaheadNewArrivals,
  S as fetchTypeaheadSearch,
  a2 as filterEmptyContent,
  a3 as filterRedundantContent,
  a as formatPrice,
  Q as formatPriceParts,
  f as formatPriceRange,
  d2 as getAnalyticsAdapterHealth,
  a5 as getApiBaseUrl,
  M as getConsentService,
  a_ as getConsentState,
  getCurrentPage,
  a$ as getEventService,
  C as getFeatureStatus,
  b0 as getLastRecommendations,
  b1 as getPageContext,
  b2 as getPlatformAdapter,
  g as getPreviewApiUrl,
  j as getRegistryConversationId,
  w as getRegistrySessionId,
  a0 as getRegistrySessionStart,
  b3 as getWebSocketBaseUrl,
  e as initPreviewFromQueryParam,
  y as inlineTypeName,
  i as isAbortError,
  b4 as isDataLayerBridgeEnabled,
  b5 as isDiscoveryQuestion,
  b6 as isDiscoveryQuestionId,
  b7 as isErrorMessage,
  b8 as isLocalhost,
  b9 as isOmniguideError,
  ba as isPingMessage,
  i2 as isPreviewMode,
  U as isRankingDebug,
  bb as isSafeNavigationUrl,
  bc as isSessionIdMessage,
  bd as isSourcesMessage,
  be as isStreamChunk,
  bf as isWholeAmount,
  l as logger,
  y2 as narrowFacetValue,
  nativeFetch,
  bg as normalizeFeedbackResponse,
  bh as normalizeMatchPct,
  u as normalizeQuestions,
  bi as normalizeRecommendedProduct,
  z as normalizeRecommendedProducts,
  normalizeSessionResponse,
  Z as numericCount,
  D as onFeatureStatusChange,
  bj as onRecommendations,
  bk as parseAndValidateMessage,
  I as platformRegistry,
  bl as registerConsentService,
  bm as registerEventService,
  r2 as reportAnalyticsAdapterThrew,
  bn as requirePlatformAdapter,
  r3 as resolveContainer,
  $ as resolveHydrationSource,
  P as resolvePriceFormat,
  r4 as resolveProductRating,
  s as safeHref,
  bo as safeJsonParse,
  b as sanitizeUrl,
  bp as setCurrentPageOverride,
  m as setFeatureStatus,
  s2 as setPreviewApiUrl,
  a4 as setRegistryConversationId,
  setSessionId as setRegistrySessionId,
  p as setRegistrySessionStart,
  bq as shortenText,
  br as startDataLayerBridge,
  bs as toDiscoveryId,
  r as toMatchPct,
  bt as trackEvent,
  t as transformSummary,
  bu as updateEventContext,
  bv as validateMessage,
  bw as validateWebSocketMessage,
  bx as wrapError
};
