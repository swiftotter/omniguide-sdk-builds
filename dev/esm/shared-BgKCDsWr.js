import { c, a, f, b, d, n, r, t } from "./shared-BX8EZMxK.js";
import { b as setSessionId, X as clearSessionId, A as API_ENDPOINTS, n as normalizeSessionResponse, R as RestSessionResponseSchema, Y as SdkParseError, g as getCurrentPage } from "./shared-Ca1kMayo.js";
import { Z, _, $, a0, m, a1, a2, a3, K, a4, a5, a6, a7, W, a8, J, a9, aa, F, ab, ac, ad, L, ae, af, N, ag, ah, ai, aj, ak, al, am, an, ao, ap, aq, ar, U, as, at, au, av, aw, ax, ay, T, C, az, aA, aB, u, aC, aD, aE, w, x, z, r as r2, I, c as c2, aF, aG, h, H, G, M, O, f as f2, E, V, aH, aI, p, aJ, aK, aL, P, k, S, aM, o, aN, aO, aP, aQ, aR, aS, aT, aU, aV, aW, i, l, aX, j, q, aY, aZ, v, B, y, a_, D, s, a$, a as a10, b0, d as d2, Q, e, b1, b2, b3, b4, t as t2, b5, b6, b7, b8 } from "./shared-Ca1kMayo.js";
import { c as c3, g, a as a11, i as i2, s as s2 } from "./shared-BCV1C98-.js";
import { b as b9, a as a12, d as d3, e as e2, f as f3, g as g2, h as h2, C as C2, i as i3, j as j2, k as k2, l as l2, F as F2, m as m2, n as n2, o as o2, p as p2, q as q2, s as s3, t as t3, u as u2, P as P2, v as v2, w as w2, c as c4, x as x2, r as r3 } from "./shared-CzpdhQpl.js";
import { C as C3 } from "./shared-CvGjrpPD.js";
import { P as P3 } from "./shared-DOp_BG_u.js";
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
  Z as APIError,
  _ as APITimeoutError,
  API_ENDPOINTS,
  $ as API_URLS,
  a0 as AnswerOptionSchema,
  m as AnsweredIntentsStorage,
  a1 as ApiClient,
  a2 as BaseWebSocket,
  b9 as CarouselAnchorSchema,
  a12 as CarouselEventBatchSchema,
  d3 as CarouselEventItemSchema,
  e2 as CarouselEventSchema,
  f3 as CarouselNarrativeSchema,
  g2 as CarouselNotAvailableSchema,
  h2 as CarouselPriceSchema,
  C2 as CarouselResponseSchema,
  i3 as CarouselSlotPinSchema,
  j2 as CarouselSlotProductSchema,
  k2 as CarouselSlotSchema,
  l2 as CarouselSlotScoringSchema,
  a3 as CategorySchema,
  C3 as CategoryWebSocket,
  K as ChatWebSocket,
  a4 as ConfigurationError,
  a5 as ConnectionTimeoutError,
  a6 as ConsentService,
  a7 as ConversationIdMessageSchema,
  W as DEFAULT_STORAGE_KEYS,
  a8 as DiscoveryQuestionMessageSchema,
  J as ERROR_MESSAGES,
  a9 as ErrorMessageSchema,
  aa as EventService,
  F as FLOW_STATES,
  F2 as FacetsValuesResponseSchema,
  ab as FeedbackAPI,
  ac as FitEvaluationMessageSchema,
  ad as LATENCY,
  L as LocalStorageAdapter,
  ae as MaxReconnectsError,
  af as MemoryStorageAdapter,
  N as NullPlatformAdapter,
  ag as OmniguideError,
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
  ah as PingMessageSchema,
  ai as PlatformNotInitializedError,
  aj as ProductSchema,
  P3 as ProductWebSocket,
  ak as QuestionMessageSchema,
  al as RECOMMENDATIONS_EVENT,
  am as RECONNECTION,
  an as ResponseTimer,
  ao as RestDiscoveryAnswerSchema,
  ap as RestDiscoveryQuestionSchema,
  aq as RestFeedbackResponseSchema,
  ar as RestQuestionsResponseSchema,
  RestSessionResponseSchema,
  U as SDK_ORIGIN_MARKER,
  SdkParseError,
  as as SessionIdMessageSchema,
  SessionService,
  at as SessionStorage,
  au as SourcesMessageSchema,
  av as StorageError,
  aw as StreamChunkSchema,
  ax as TIMEOUTS,
  ay as TYPEAHEAD_ENDPOINT,
  T as TYPEAHEAD_MIN_QUERY_LENGTH,
  C as TYPEAHEAD_SECTION_ORDER,
  az as WS_ENDPOINTS,
  aA as WebSocketError,
  aB as WebSocketMessageSchema,
  u as capturePageContext,
  c as clampPct,
  aC as cleanText,
  c3 as clearPreviewApiUrl,
  aD as clearRegistrySession,
  clearSessionId as clearRegistrySessionId,
  aE as createAPIWithRetry,
  w as createConsentService,
  c4 as createEventQueue,
  x as createEventService,
  z as createFeedbackAPI,
  r2 as createPlatformAdapter,
  I as createResponseTimer,
  c2 as createScopedLogger,
  createSessionService,
  aF as currencyMinorUnits,
  aG as dedupeByUrl,
  h as emitRecommendations,
  H as extractSkusFromMarkdown,
  a as fetchCategoryQuestions,
  f as fetchProductQuestions,
  G as fetchTypeaheadSearch,
  M as filterEmptyContent,
  O as filterRedundantContent,
  f2 as formatPrice,
  E as formatPriceParts,
  V as getApiBaseUrl,
  aH as getConsentState,
  getCurrentPage,
  aI as getEventService,
  p as getFeatureStatus,
  aJ as getLastRecommendations,
  aK as getPageContext,
  aL as getPlatformAdapter,
  g as getPreviewApiUrl,
  P as getRegistryConversationId,
  k as getRegistrySessionId,
  S as getRegistrySessionStart,
  aM as getWebSocketBaseUrl,
  a11 as initPreviewFromQueryParam,
  o as inlineTypeName,
  aN as isDiscoveryQuestion,
  aO as isDiscoveryQuestionId,
  aP as isErrorMessage,
  aQ as isLocalhost,
  aR as isOmniguideError,
  aS as isPingMessage,
  i2 as isPreviewMode,
  aT as isSafeNavigationUrl,
  aU as isSessionIdMessage,
  aV as isSourcesMessage,
  aW as isStreamChunk,
  i as isWholeAmount,
  l as logger,
  x2 as narrowFacetValue,
  aX as normalizeFeedbackResponse,
  b as normalizeMatchPct,
  j as normalizeQuestions,
  d as normalizeRecommendedProduct,
  n as normalizeRecommendedProducts,
  normalizeSessionResponse,
  q as onFeatureStatusChange,
  aY as onRecommendations,
  aZ as parseAndValidateMessage,
  v as platformRegistry,
  B as registerConsentService,
  y as registerEventService,
  a_ as requirePlatformAdapter,
  r as resolveContainer,
  D as resolvePriceFormat,
  r3 as resolveProductRating,
  s as safeHref,
  a$ as safeJsonParse,
  a10 as sanitizeUrl,
  b0 as setCurrentPageOverride,
  d2 as setFeatureStatus,
  s2 as setPreviewApiUrl,
  Q as setRegistryConversationId,
  setSessionId as setRegistrySessionId,
  e as setRegistrySessionStart,
  b1 as shortenText,
  b2 as startDataLayerBridge,
  b3 as toDiscoveryId,
  t as toMatchPct,
  b4 as trackEvent,
  t2 as transformSummary,
  b5 as updateEventContext,
  b6 as validateMessage,
  b7 as validateWebSocketMessage,
  b8 as wrapError
};
//# sourceMappingURL=shared-BgKCDsWr.js.map
