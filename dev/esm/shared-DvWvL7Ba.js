import { c, a, f, b, d, n, r, t } from "./shared-bBiN2loQ.js";
import { e as setSessionId, Z as clearSessionId, A as API_ENDPOINTS, n as nativeFetch, h as normalizeSessionResponse, R as RestSessionResponseSchema, _ as SdkParseError, g as getCurrentPage } from "./shared-BtIsRUFu.js";
import { $, a0, a1, a2, p, a3, a4, a5, O, a6, a7, a8, a9, aa, Y, ab, K, ac, ad, F, ae, af, ag, L, ah, ai, N, aj, ak, al, am, an, ao, ap, aq, ar, as, at, au, av, W, aw, ax, ay, az, aA, aB, aC, T, C, aD, aE, aF, w, aG, aH, aI, aJ, aK, z, v, J, aL, aM, k, y, I, G, P, Q, f as f2, E, X, B, aN, aO, r as r2, aP, aQ, aR, S, m, V, aS, q, aT, aU, aV, aW, aX, aY, aZ, H, a_, a$, b0, b1, b2, b3, l, M, u, b4, b5, x, b6, b7, b8, D, s, b9, a as a10, ba, i, U, j, bb, bc, bd, be, t as t2, bf, bg, bh, bi } from "./shared-BtIsRUFu.js";
import { _, b as b10, a as a11, c as c2, d as d2, g, e, i as i2, l as l2, r as r3, s as s2 } from "./shared-BeMGgPch.js";
import { d as d3, a as a12, e as e2, f as f3, g as g2, h, i as i3, C as C2, j as j2, k as k2, l as l3, m as m2, F as F2, n as n2, o, b as b11, p as p2, q as q2, s as s3, t as t3, u as u2, P as P2, v as v2, w as w2, c as c3, x as x2, r as r4 } from "./shared-U7Wo2dwK.js";
import { C as C3 } from "./shared-BCSi7i6n.js";
import { P as P3 } from "./shared-CKPri1mx.js";
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
  $ as APIError,
  a0 as APITimeoutError,
  API_ENDPOINTS,
  a1 as API_URLS,
  a2 as AnswerOptionSchema,
  p as AnsweredIntentsStorage,
  a3 as ApiClient,
  a4 as BaseWebSocket,
  d3 as CarouselAnchorSchema,
  a12 as CarouselEventBatchSchema,
  e2 as CarouselEventItemSchema,
  f3 as CarouselEventSchema,
  g2 as CarouselNarrativeSchema,
  h as CarouselNotAvailableSchema,
  i3 as CarouselPriceSchema,
  C2 as CarouselResponseSchema,
  j2 as CarouselSlotPinSchema,
  k2 as CarouselSlotProductSchema,
  l3 as CarouselSlotSchema,
  m2 as CarouselSlotScoringSchema,
  a5 as CategorySchema,
  C3 as CategoryWebSocket,
  O as ChatStream,
  a6 as ChatWebSocket,
  a7 as ConfigurationError,
  a8 as ConnectionTimeoutError,
  a9 as ConsentService,
  aa as ConversationIdMessageSchema,
  Y as DEFAULT_STORAGE_KEYS,
  ab as DiscoveryQuestionMessageSchema,
  K as ERROR_MESSAGES,
  ac as ErrorMessageSchema,
  ad as EventService,
  F as FLOW_STATES,
  F2 as FacetsValuesResponseSchema,
  ae as FeedbackAPI,
  af as FitEvaluationMessageSchema,
  ag as LATENCY,
  L as LocalStorageAdapter,
  ah as MaxReconnectsError,
  ai as MemoryStorageAdapter,
  N as NullPlatformAdapter,
  aj as OmniguideError,
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
  ak as PingMessageSchema,
  al as PlatformNotInitializedError,
  am as ProductSchema,
  P3 as ProductWebSocket,
  an as QuestionMessageSchema,
  ao as RANKING_DEBUG_PARAM,
  ap as RECOMMENDATIONS_EVENT,
  aq as RECONNECTION,
  ar as ResponseTimer,
  as as RestDiscoveryAnswerSchema,
  at as RestDiscoveryQuestionSchema,
  au as RestFeedbackResponseSchema,
  av as RestQuestionsResponseSchema,
  RestSessionResponseSchema,
  W as SDK_ORIGIN_MARKER,
  SdkParseError,
  aw as SessionIdMessageSchema,
  SessionService,
  ax as SessionStorage,
  ay as SourcesMessageSchema,
  az as StorageError,
  aA as StreamChunkSchema,
  aB as TIMEOUTS,
  aC as TYPEAHEAD_ENDPOINT,
  T as TYPEAHEAD_MIN_QUERY_LENGTH,
  C as TYPEAHEAD_SECTION_ORDER,
  aD as WS_ENDPOINTS,
  aE as WebSocketError,
  aF as WebSocketMessageSchema,
  _ as _resetAnalyticsAdapterHealth,
  w as capturePageContext,
  b10 as checkAnalyticsAdapter,
  c as clampPct,
  aG as cleanText,
  a11 as clearPreviewApiUrl,
  aH as clearRegistrySession,
  clearSessionId as clearRegistrySessionId,
  aI as createAPIWithRetry,
  aJ as createConsentService,
  c3 as createEventQueue,
  aK as createEventService,
  z as createFeedbackAPI,
  v as createPlatformAdapter,
  J as createResponseTimer,
  c2 as createScopedLogger,
  createSessionService,
  aL as currencyMinorUnits,
  aM as dedupeByUrl,
  k as emitRecommendations,
  y as ensurePageEventService,
  I as extractSkusFromMarkdown,
  a as fetchCategoryQuestions,
  f as fetchProductQuestions,
  G as fetchTypeaheadSearch,
  P as filterEmptyContent,
  Q as filterRedundantContent,
  f2 as formatPrice,
  E as formatPriceParts,
  d2 as getAnalyticsAdapterHealth,
  X as getApiBaseUrl,
  B as getConsentService,
  aN as getConsentState,
  getCurrentPage,
  aO as getEventService,
  r2 as getFeatureStatus,
  aP as getLastRecommendations,
  aQ as getPageContext,
  aR as getPlatformAdapter,
  g as getPreviewApiUrl,
  S as getRegistryConversationId,
  m as getRegistrySessionId,
  V as getRegistrySessionStart,
  aS as getWebSocketBaseUrl,
  e as initPreviewFromQueryParam,
  q as inlineTypeName,
  aT as isDataLayerBridgeEnabled,
  aU as isDiscoveryQuestion,
  aV as isDiscoveryQuestionId,
  aW as isErrorMessage,
  aX as isLocalhost,
  aY as isOmniguideError,
  aZ as isPingMessage,
  i2 as isPreviewMode,
  H as isRankingDebug,
  a_ as isSafeNavigationUrl,
  a$ as isSessionIdMessage,
  b0 as isSourcesMessage,
  b1 as isStreamChunk,
  b2 as isWholeAmount,
  l2 as logger,
  x2 as narrowFacetValue,
  nativeFetch,
  b3 as normalizeFeedbackResponse,
  b as normalizeMatchPct,
  l as normalizeQuestions,
  d as normalizeRecommendedProduct,
  n as normalizeRecommendedProducts,
  normalizeSessionResponse,
  M as numericCount,
  u as onFeatureStatusChange,
  b4 as onRecommendations,
  b5 as parseAndValidateMessage,
  x as platformRegistry,
  b6 as registerConsentService,
  b7 as registerEventService,
  r3 as reportAnalyticsAdapterThrew,
  b8 as requirePlatformAdapter,
  r as resolveContainer,
  D as resolvePriceFormat,
  r4 as resolveProductRating,
  s as safeHref,
  b9 as safeJsonParse,
  a10 as sanitizeUrl,
  ba as setCurrentPageOverride,
  i as setFeatureStatus,
  s2 as setPreviewApiUrl,
  U as setRegistryConversationId,
  setSessionId as setRegistrySessionId,
  j as setRegistrySessionStart,
  bb as shortenText,
  bc as startDataLayerBridge,
  bd as toDiscoveryId,
  t as toMatchPct,
  be as trackEvent,
  t2 as transformSummary,
  bf as updateEventContext,
  bg as validateMessage,
  bh as validateWebSocketMessage,
  bi as wrapError
};
