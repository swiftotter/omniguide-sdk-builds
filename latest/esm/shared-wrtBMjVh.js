import { c, a, f, b, d, n, r, t } from "./shared-GgmXxYL9.js";
import { d as setSessionId, Y as clearSessionId, A as API_ENDPOINTS, e as normalizeSessionResponse, R as RestSessionResponseSchema, Z as SdkParseError, g as getCurrentPage } from "./shared-Cq77Hn6i.js";
import { _, $, a0, a1, m, a2, a3, a4, M, a5, a6, a7, a8, X, a9, J, aa, ab, F, ac, ad, ae, L, af, ag, N, ah, ai, aj, ak, al, am, an, ao, ap, aq, ar, as, at, V, au, av, aw, ax, ay, az, aA, T, B, aB, aC, aD, v, aE, aF, aG, aH, aI, y, u, I, aJ, aK, j, x, H, E, O, P, f as f2, D, W, z, aL, aM, q, aN, aO, aP, Q, l, U, aQ, p, aR, aS, aT, aU, aV, aW, aX, G, aY, aZ, a_, a$, b0, b1, k, K, r as r2, b2, b3, w, b4, b5, b6, C, s, b7, a as a10, b8, h, S, i, b9, ba, bb, bc, t as t2, bd, be, bf, bg } from "./shared-Cq77Hn6i.js";
import { _ as _2, b as b10, a as a11, c as c2, d as d2, g, e, i as i2, l as l2, r as r3, s as s2 } from "./shared-Dqr-hZQQ.js";
import { d as d3, a as a12, e as e2, f as f3, g as g2, h as h2, i as i3, C as C2, j as j2, k as k2, l as l3, m as m2, F as F2, n as n2, o, b as b11, p as p2, q as q2, s as s3, t as t3, u as u2, P as P2, v as v2, w as w2, c as c3, x as x2, r as r4 } from "./shared-BYH8AE8E.js";
import { C as C3 } from "./shared-K0v8S9ay.js";
import { P as P3 } from "./shared-BYqd7Ne9.js";
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
export {
  _ as APIError,
  $ as APITimeoutError,
  API_ENDPOINTS,
  a0 as API_URLS,
  a1 as AnswerOptionSchema,
  m as AnsweredIntentsStorage,
  a2 as ApiClient,
  a3 as BaseWebSocket,
  d3 as CarouselAnchorSchema,
  a12 as CarouselEventBatchSchema,
  e2 as CarouselEventItemSchema,
  f3 as CarouselEventSchema,
  g2 as CarouselNarrativeSchema,
  h2 as CarouselNotAvailableSchema,
  i3 as CarouselPriceSchema,
  C2 as CarouselResponseSchema,
  j2 as CarouselSlotPinSchema,
  k2 as CarouselSlotProductSchema,
  l3 as CarouselSlotSchema,
  m2 as CarouselSlotScoringSchema,
  a4 as CategorySchema,
  C3 as CategoryWebSocket,
  M as ChatWebSocket,
  a5 as ConfigurationError,
  a6 as ConnectionTimeoutError,
  a7 as ConsentService,
  a8 as ConversationIdMessageSchema,
  X as DEFAULT_STORAGE_KEYS,
  a9 as DiscoveryQuestionMessageSchema,
  J as ERROR_MESSAGES,
  aa as ErrorMessageSchema,
  ab as EventService,
  F as FLOW_STATES,
  F2 as FacetsValuesResponseSchema,
  ac as FeedbackAPI,
  ad as FitEvaluationMessageSchema,
  ae as LATENCY,
  L as LocalStorageAdapter,
  af as MaxReconnectsError,
  ag as MemoryStorageAdapter,
  N as NullPlatformAdapter,
  ah as OmniguideError,
  n2 as PLPBulkPricingTierSchema,
  o as PLPCategorySchema,
  b11 as PLPFacetSchema,
  p2 as PLPFacetValueSchema,
  q2 as PLPFlagSchema,
  s3 as PLPPaginationSchema,
  t3 as PLPProductSchema,
  u2 as PLPRatingSchema,
  P2 as PLPResponseSchema,
  v2 as PLPReviewsSchema,
  w2 as PLPVariantImageSchema,
  ai as PingMessageSchema,
  aj as PlatformNotInitializedError,
  ak as ProductSchema,
  P3 as ProductWebSocket,
  al as QuestionMessageSchema,
  am as RANKING_DEBUG_PARAM,
  an as RECOMMENDATIONS_EVENT,
  ao as RECONNECTION,
  ap as ResponseTimer,
  aq as RestDiscoveryAnswerSchema,
  ar as RestDiscoveryQuestionSchema,
  as as RestFeedbackResponseSchema,
  at as RestQuestionsResponseSchema,
  RestSessionResponseSchema,
  V as SDK_ORIGIN_MARKER,
  SdkParseError,
  au as SessionIdMessageSchema,
  SessionService,
  av as SessionStorage,
  aw as SourcesMessageSchema,
  ax as StorageError,
  ay as StreamChunkSchema,
  az as TIMEOUTS,
  aA as TYPEAHEAD_ENDPOINT,
  T as TYPEAHEAD_MIN_QUERY_LENGTH,
  B as TYPEAHEAD_SECTION_ORDER,
  aB as WS_ENDPOINTS,
  aC as WebSocketError,
  aD as WebSocketMessageSchema,
  _2 as _resetAnalyticsAdapterHealth,
  v as capturePageContext,
  b10 as checkAnalyticsAdapter,
  c as clampPct,
  aE as cleanText,
  a11 as clearPreviewApiUrl,
  aF as clearRegistrySession,
  clearSessionId as clearRegistrySessionId,
  aG as createAPIWithRetry,
  aH as createConsentService,
  c3 as createEventQueue,
  aI as createEventService,
  y as createFeedbackAPI,
  u as createPlatformAdapter,
  I as createResponseTimer,
  c2 as createScopedLogger,
  createSessionService,
  aJ as currencyMinorUnits,
  aK as dedupeByUrl,
  j as emitRecommendations,
  x as ensurePageEventService,
  H as extractSkusFromMarkdown,
  a as fetchCategoryQuestions,
  f as fetchProductQuestions,
  E as fetchTypeaheadSearch,
  O as filterEmptyContent,
  P as filterRedundantContent,
  f2 as formatPrice,
  D as formatPriceParts,
  d2 as getAnalyticsAdapterHealth,
  W as getApiBaseUrl,
  z as getConsentService,
  aL as getConsentState,
  getCurrentPage,
  aM as getEventService,
  q as getFeatureStatus,
  aN as getLastRecommendations,
  aO as getPageContext,
  aP as getPlatformAdapter,
  g as getPreviewApiUrl,
  Q as getRegistryConversationId,
  l as getRegistrySessionId,
  U as getRegistrySessionStart,
  aQ as getWebSocketBaseUrl,
  e as initPreviewFromQueryParam,
  p as inlineTypeName,
  aR as isDataLayerBridgeEnabled,
  aS as isDiscoveryQuestion,
  aT as isDiscoveryQuestionId,
  aU as isErrorMessage,
  aV as isLocalhost,
  aW as isOmniguideError,
  aX as isPingMessage,
  i2 as isPreviewMode,
  G as isRankingDebug,
  aY as isSafeNavigationUrl,
  aZ as isSessionIdMessage,
  a_ as isSourcesMessage,
  a$ as isStreamChunk,
  b0 as isWholeAmount,
  l2 as logger,
  x2 as narrowFacetValue,
  b1 as normalizeFeedbackResponse,
  b as normalizeMatchPct,
  k as normalizeQuestions,
  d as normalizeRecommendedProduct,
  n as normalizeRecommendedProducts,
  normalizeSessionResponse,
  K as numericCount,
  r2 as onFeatureStatusChange,
  b2 as onRecommendations,
  b3 as parseAndValidateMessage,
  w as platformRegistry,
  b4 as registerConsentService,
  b5 as registerEventService,
  r3 as reportAnalyticsAdapterThrew,
  b6 as requirePlatformAdapter,
  r as resolveContainer,
  C as resolvePriceFormat,
  r4 as resolveProductRating,
  s as safeHref,
  b7 as safeJsonParse,
  a10 as sanitizeUrl,
  b8 as setCurrentPageOverride,
  h as setFeatureStatus,
  s2 as setPreviewApiUrl,
  S as setRegistryConversationId,
  setSessionId as setRegistrySessionId,
  i as setRegistrySessionStart,
  b9 as shortenText,
  ba as startDataLayerBridge,
  bb as toDiscoveryId,
  t as toMatchPct,
  bc as trackEvent,
  t2 as transformSummary,
  bd as updateEventContext,
  be as validateMessage,
  bf as validateWebSocketMessage,
  bg as wrapError
};
