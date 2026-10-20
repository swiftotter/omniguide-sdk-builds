import { c, a, f, b, d, n, r, t } from "./shared-cZRHBVrS.js";
import { b as setSessionId, Q as clearSessionId, A as API_ENDPOINTS, n as normalizeSessionResponse, R as RestSessionResponseSchema, U as SdkParseError, g as getCurrentPage } from "./shared-C3FRfYO7.js";
import { V, W, X, Y, j, Z, _, $, G, a0, a1, a2, a3, P, a4, E, a5, a6, F, a7, a8, a9, L, aa, ab, N, ac, ad, ae, af, ag, ah, ai, aj, ak, al, am, an, S, ao, ap, aq, ar, as, at, au, T, w, av, aw, ax, p, ay, az, aA, aB, aC, u, m, C, aD, aE, e, r as r2, B, z, H, I, f as f2, y, O, v, aF, aG, l, aH, aI, aJ, J, i, M, aK, k, aL, aM, aN, aO, aP, aQ, aR, aS, aT, aU, aV, aW, aX, h, D, o, aY, aZ, q, a_, a$, b0, x, s, b1, a as a10, b2, c as c2, K, d as d2, b3, b4, b5, b6, t as t2, b7, b8, b9, ba } from "./shared-C3FRfYO7.js";
import { _ as _2, b as b10, a as a11, c as c3, d as d3, g, e as e2, i as i2, l as l2, r as r3, s as s2 } from "./shared-hPZZXuBd.js";
import { b as b11, a as a12, d as d4, e as e3, f as f3, g as g2, h as h2, C as C2, i as i3, j as j2, k as k2, l as l3, F as F2, m as m2, n as n2, o as o2, p as p2, q as q2, s as s3, t as t3, u as u2, P as P2, v as v2, w as w2, c as c4, x as x2, r as r4 } from "./shared-DsCASdF5.js";
import { C as C3 } from "./shared-lFMccHal.js";
import { P as P3 } from "./shared-CIGWA0kS.js";
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
  V as APIError,
  W as APITimeoutError,
  API_ENDPOINTS,
  X as API_URLS,
  Y as AnswerOptionSchema,
  j as AnsweredIntentsStorage,
  Z as ApiClient,
  _ as BaseWebSocket,
  b11 as CarouselAnchorSchema,
  a12 as CarouselEventBatchSchema,
  d4 as CarouselEventItemSchema,
  e3 as CarouselEventSchema,
  f3 as CarouselNarrativeSchema,
  g2 as CarouselNotAvailableSchema,
  h2 as CarouselPriceSchema,
  C2 as CarouselResponseSchema,
  i3 as CarouselSlotPinSchema,
  j2 as CarouselSlotProductSchema,
  k2 as CarouselSlotSchema,
  l3 as CarouselSlotScoringSchema,
  $ as CategorySchema,
  C3 as CategoryWebSocket,
  G as ChatWebSocket,
  a0 as ConfigurationError,
  a1 as ConnectionTimeoutError,
  a2 as ConsentService,
  a3 as ConversationIdMessageSchema,
  P as DEFAULT_STORAGE_KEYS,
  a4 as DiscoveryQuestionMessageSchema,
  E as ERROR_MESSAGES,
  a5 as ErrorMessageSchema,
  a6 as EventService,
  F as FLOW_STATES,
  F2 as FacetsValuesResponseSchema,
  a7 as FeedbackAPI,
  a8 as FitEvaluationMessageSchema,
  a9 as LATENCY,
  L as LocalStorageAdapter,
  aa as MaxReconnectsError,
  ab as MemoryStorageAdapter,
  N as NullPlatformAdapter,
  ac as OmniguideError,
  m2 as PLPBulkPricingTierSchema,
  n2 as PLPCategorySchema,
  o2 as PLPFacetSchema,
  p2 as PLPFacetValueSchema,
  q2 as PLPFlagSchema,
  s3 as PLPPaginationSchema,
  t3 as PLPProductSchema,
  u2 as PLPRatingSchema,
  P2 as PLPResponseSchema,
  v2 as PLPReviewsSchema,
  w2 as PLPVariantImageSchema,
  ad as PingMessageSchema,
  ae as PlatformNotInitializedError,
  af as ProductSchema,
  P3 as ProductWebSocket,
  ag as QuestionMessageSchema,
  ah as RECOMMENDATIONS_EVENT,
  ai as RECONNECTION,
  aj as ResponseTimer,
  ak as RestDiscoveryAnswerSchema,
  al as RestDiscoveryQuestionSchema,
  am as RestFeedbackResponseSchema,
  an as RestQuestionsResponseSchema,
  RestSessionResponseSchema,
  S as SDK_ORIGIN_MARKER,
  SdkParseError,
  ao as SessionIdMessageSchema,
  SessionService,
  ap as SessionStorage,
  aq as SourcesMessageSchema,
  ar as StorageError,
  as as StreamChunkSchema,
  at as TIMEOUTS,
  au as TYPEAHEAD_ENDPOINT,
  T as TYPEAHEAD_MIN_QUERY_LENGTH,
  w as TYPEAHEAD_SECTION_ORDER,
  av as WS_ENDPOINTS,
  aw as WebSocketError,
  ax as WebSocketMessageSchema,
  _2 as _resetAnalyticsAdapterHealth,
  p as capturePageContext,
  b10 as checkAnalyticsAdapter,
  c as clampPct,
  ay as cleanText,
  a11 as clearPreviewApiUrl,
  az as clearRegistrySession,
  clearSessionId as clearRegistrySessionId,
  aA as createAPIWithRetry,
  aB as createConsentService,
  c4 as createEventQueue,
  aC as createEventService,
  u as createFeedbackAPI,
  m as createPlatformAdapter,
  C as createResponseTimer,
  c3 as createScopedLogger,
  createSessionService,
  aD as currencyMinorUnits,
  aE as dedupeByUrl,
  e as emitRecommendations,
  r2 as ensurePageEventService,
  B as extractSkusFromMarkdown,
  a as fetchCategoryQuestions,
  f as fetchProductQuestions,
  z as fetchTypeaheadSearch,
  H as filterEmptyContent,
  I as filterRedundantContent,
  f2 as formatPrice,
  y as formatPriceParts,
  d3 as getAnalyticsAdapterHealth,
  O as getApiBaseUrl,
  v as getConsentService,
  aF as getConsentState,
  getCurrentPage,
  aG as getEventService,
  l as getFeatureStatus,
  aH as getLastRecommendations,
  aI as getPageContext,
  aJ as getPlatformAdapter,
  g as getPreviewApiUrl,
  J as getRegistryConversationId,
  i as getRegistrySessionId,
  M as getRegistrySessionStart,
  aK as getWebSocketBaseUrl,
  e2 as initPreviewFromQueryParam,
  k as inlineTypeName,
  aL as isDataLayerBridgeEnabled,
  aM as isDiscoveryQuestion,
  aN as isDiscoveryQuestionId,
  aO as isErrorMessage,
  aP as isLocalhost,
  aQ as isOmniguideError,
  aR as isPingMessage,
  i2 as isPreviewMode,
  aS as isSafeNavigationUrl,
  aT as isSessionIdMessage,
  aU as isSourcesMessage,
  aV as isStreamChunk,
  aW as isWholeAmount,
  l2 as logger,
  x2 as narrowFacetValue,
  aX as normalizeFeedbackResponse,
  b as normalizeMatchPct,
  h as normalizeQuestions,
  d as normalizeRecommendedProduct,
  n as normalizeRecommendedProducts,
  normalizeSessionResponse,
  D as numericCount,
  o as onFeatureStatusChange,
  aY as onRecommendations,
  aZ as parseAndValidateMessage,
  q as platformRegistry,
  a_ as registerConsentService,
  a$ as registerEventService,
  r3 as reportAnalyticsAdapterThrew,
  b0 as requirePlatformAdapter,
  r as resolveContainer,
  x as resolvePriceFormat,
  r4 as resolveProductRating,
  s as safeHref,
  b1 as safeJsonParse,
  a10 as sanitizeUrl,
  b2 as setCurrentPageOverride,
  c2 as setFeatureStatus,
  s2 as setPreviewApiUrl,
  K as setRegistryConversationId,
  setSessionId as setRegistrySessionId,
  d2 as setRegistrySessionStart,
  b3 as shortenText,
  b4 as startDataLayerBridge,
  b5 as toDiscoveryId,
  t as toMatchPct,
  b6 as trackEvent,
  t2 as transformSummary,
  b7 as updateEventContext,
  b8 as validateMessage,
  b9 as validateWebSocketMessage,
  ba as wrapError
};
//# sourceMappingURL=shared-BwDRgZPg.js.map
