import { C, R, e, g, a, n, o } from "./shared-BVEY4TgW.js";
import { a as setSessionId, X as clearSessionId, n as normalizeSessionResponse, R as RestSessionResponseSchema, Y as SdkParseError, b as getCurrentPage } from "./shared-iBjwBYJu.js";
import { Z, _, $, a0, B, a1, a2, O, a3, a4, a5, a6, a7, a8, a9, aa, ab, ac, ad, N, ae, af, ag, ah, ai, aj, ak, al, am, an, ao, S, ap, aq, ar, as, at, J, au, T, av, aw, ax, u, w, ay, az, aA, aB, aC, z, q, L, aD, C as C2, y, aE, K, k, h, I, G, U, V, aF, F, D, A, aG, aH, o as o2, aI, aJ, g as g2, j, Q, aK, i, aL, aM, aN, aO, aP, aQ, H, aR, aS, aT, aU, m, aV, f, M, p, aW, x, aX, aY, aZ, P, E, r, s, a_, e as e2, a$, c, W, d, b0, b1, b2, t, l, v, b3, b4, b5, b6 } from "./shared-iBjwBYJu.js";
import { A as API_ENDPOINTS, n as nativeFetch, a as setRecognizedLocale, v as recognizedLocaleKey } from "./shared-dt7kNtBU.js";
import { w as w2, d as d2, C as C3, D as D2, E as E2, F as F2, x as x2, L as L2, M as M2, R as R2, y as y2, S as S2, z as z2, T as T2, W as W2, _ as _2, B as B2, p as p2, G as G2, r as r2, j as j2, c as c2, H as H2, q as q2, f as f2, I as I2, u as u2, J as J2, h as h2, K as K2, g as g3, N as N2, O as O2, P as P2, Q as Q2, U as U2, m as m2, V as V2, X, b, i as i2, l as l2, Y, Z as Z2, $ as $2, a0 as a02, t as t2, a1 as a12, a2 as a22, s as s2, a3 as a32, a4 as a42, k as k2, o as o3, a5 as a52, e as e3, a6 as a62, a7 as a72 } from "./shared-dt7kNtBU.js";
import { r as r3 } from "./shared-2BGWnT-d.js";
import { c as c3 } from "./shared-UhyoVnbB.js";
import { C as C4, a as a10, b as b7, c as c4, d as d3, e as e4, f as f3, g as g4, h as h3, i as i3, j as j3, k as k3 } from "./shared-cE3bj5CH.js";
import { F as F3, P as P3, a as a11, b as b8, c as c5, d as d4, e as e5, f as f4, g as g5, h as h4, i as i4, j as j4, k as k4, n as n2, r as r4 } from "./shared-pA1HoieW.js";
import { P as P4 } from "./shared-BmWB3IKt.js";
import { e as e6 } from "./shared-Dg6Ibedc.js";
const DEFAULT_STORAGE_KEY = "omniguideSessionId";
function localeMemoryFor(config, storage) {
  const storageKeys = { recognizedLocale: config.recognizedLocaleKey };
  return { storage, key: recognizedLocaleKey({ websiteId: config.websiteId, storageKeys }) };
}
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
    this.localeMemory = localeMemoryFor(config, this.storage);
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
    var _a;
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
    setRecognizedLocale(((_a = validated.data.language) == null ? void 0 : _a.recognized) ?? null, this.localeMemory);
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
  w2 as API_URLS,
  $ as AnswerOptionSchema,
  d2 as AnsweredIntentsStorage,
  a0 as ApiClient,
  B as BIGCOMMERCE_HYDRATION_SOURCE,
  a1 as BaseWebSocket,
  C3 as CONTEXT_TOKEN_HEADER,
  C4 as CarouselAnchorSchema,
  a10 as CarouselEventBatchSchema,
  b7 as CarouselEventItemSchema,
  c4 as CarouselEventSchema,
  d3 as CarouselNarrativeSchema,
  e4 as CarouselNotAvailableSchema,
  f3 as CarouselPriceSchema,
  g4 as CarouselResponseSchema,
  h3 as CarouselSlotPinSchema,
  i3 as CarouselSlotProductSchema,
  j3 as CarouselSlotSchema,
  k3 as CarouselSlotScoringSchema,
  a2 as CategorySchema,
  C as CategoryWebSocket,
  O as ChatStream,
  a3 as ChatWebSocket,
  a4 as ConfigurationError,
  a5 as ConnectionTimeoutError,
  a6 as ConsentService,
  a7 as ConversationIdMessageSchema,
  D2 as DEFAULT_STORAGE_KEYS,
  a8 as DiscoveryQuestionMessageSchema,
  E2 as ERROR_MESSAGES,
  a9 as ErrorMessageSchema,
  aa as EventService,
  F2 as FLOW_STATES,
  F3 as FacetsValuesResponseSchema,
  ab as FeedbackAPI,
  ac as FitEvaluationMessageSchema,
  x2 as LATENCY,
  L2 as LocalStorageAdapter,
  ad as MaxReconnectsError,
  M2 as MemoryStorageAdapter,
  N as NullPlatformAdapter,
  ae as OmniguideError,
  P3 as PLPBrandSchema,
  a11 as PLPBulkPricingTierSchema,
  b8 as PLPCategorySchema,
  c5 as PLPFacetSchema,
  d4 as PLPFacetValueSchema,
  e5 as PLPFlagSchema,
  f4 as PLPPaginationSchema,
  g5 as PLPProductSchema,
  h4 as PLPRatingSchema,
  i4 as PLPResponseSchema,
  j4 as PLPReviewsSchema,
  k4 as PLPVariantImageSchema,
  af as PingMessageSchema,
  ag as PlatformNotInitializedError,
  ah as ProductSchema,
  P4 as ProductWebSocket,
  ai as QuestionMessageSchema,
  aj as RANKING_DEBUG_PARAM,
  R2 as RECOGNIZED_LOCALE_STORAGE_KEY,
  R as RECOMMENDATIONS_EVENT,
  y2 as RECONNECTION,
  ak as ResponseTimer,
  al as RestDiscoveryAnswerSchema,
  am as RestDiscoveryQuestionSchema,
  an as RestFeedbackResponseSchema,
  ao as RestQuestionsResponseSchema,
  RestSessionResponseSchema,
  S as SDK_ORIGIN_MARKER,
  S2 as SHIPPED_LOCALES,
  SdkParseError,
  ap as SessionIdMessageSchema,
  SessionService,
  z2 as SessionStorage,
  aq as SourcesMessageSchema,
  ar as StorageError,
  as as StreamChunkSchema,
  T2 as TIMEOUTS,
  at as TYPEAHEAD_ENDPOINT,
  J as TYPEAHEAD_MIN_QUERY_LENGTH,
  au as TYPEAHEAD_NEW_ARRIVALS_ENDPOINT,
  T as TYPEAHEAD_SECTION_ORDER,
  W2 as WS_ENDPOINTS,
  av as WebSocketError,
  aw as WebSocketMessageSchema,
  _2 as __resetContextTokenForTests,
  B2 as _resetAnalyticsAdapterHealth,
  p2 as applyUiI18n,
  ax as asErrorLike,
  G2 as availableLocales,
  u as bigCommerceSearchPage,
  w as capturePageContext,
  r2 as checkAnalyticsAdapter,
  ay as cleanText,
  j2 as clearPreviewApiUrl,
  az as clearRegistrySession,
  clearSessionId as clearRegistrySessionId,
  aA as createAPIWithRetry,
  aB as createConsentService,
  c3 as createEventQueue,
  aC as createEventService,
  z as createFeedbackAPI,
  q as createPlatformAdapter,
  L as createResponseTimer,
  c2 as createScopedLogger,
  createSessionService,
  H2 as currencyMinorUnits,
  aD as dedupeByUrl,
  C2 as displayPriceRange,
  q2 as dropsCents,
  e as emitRecommendations,
  e6 as enMessages,
  y as ensurePageEventService,
  aE as esMessages,
  K as extractSkusFromMarkdown,
  k as fetchCategoryQuestions,
  h as fetchProductQuestions,
  I as fetchTypeaheadNewArrivals,
  G as fetchTypeaheadSearch,
  U as filterEmptyContent,
  V as filterRedundantContent,
  aF as formatMessage,
  f2 as formatPrice,
  F as formatPriceParts,
  D as formatPriceRange,
  I2 as getAnalyticsAdapterHealth,
  u2 as getApiBaseUrl,
  A as getConsentService,
  aG as getConsentState,
  J2 as getContextToken,
  getCurrentPage,
  aH as getEventService,
  o2 as getFeatureStatus,
  h2 as getI18nSnapshot,
  g as getLastRecommendations,
  K2 as getLocale,
  aI as getPageContext,
  aJ as getPlatformAdapter,
  g3 as getPreviewApiUrl,
  g2 as getRegistryConversationId,
  j as getRegistrySessionId,
  Q as getRegistrySessionStart,
  aK as getWebSocketBaseUrl,
  N2 as initPreviewFromQueryParam,
  i as inlineTypeName,
  aL as isAbortError,
  O2 as isContextTokenEnabled,
  aM as isDataLayerBridgeEnabled,
  aN as isDiscoveryQuestion,
  P2 as isDiscoveryQuestionId,
  aO as isErrorMessage,
  Q2 as isLanguageTag,
  U2 as isLocalhost,
  aP as isOmniguideError,
  aQ as isPingMessage,
  m2 as isPreviewMode,
  H as isRankingDebug,
  aR as isSafeNavigationUrl,
  aS as isSessionIdMessage,
  aT as isSourcesMessage,
  aU as isStreamChunk,
  V2 as isWholeAmount,
  X as legacyOverrides,
  b as localeMemory,
  i2 as localizedList,
  l2 as logger,
  m as markdownOf,
  Y as matchLocale,
  n2 as narrowFacetValue,
  nativeFetch,
  aV as normalizeFeedbackResponse,
  f as normalizeQuestions,
  a as normalizeRecommendedProduct,
  n as normalizeRecommendedProducts,
  normalizeSessionResponse,
  Z2 as normalizeTag,
  M as numericCount,
  p as onFeatureStatusChange,
  o as onRecommendations,
  aW as parseAndValidateMessage,
  x as platformRegistry,
  $2 as primarySubtag,
  a02 as publishI18n,
  recognizedLocaleKey,
  aX as registerConsentService,
  aY as registerEventService,
  t2 as reportAnalyticsAdapterThrew,
  aZ as requirePlatformAdapter,
  a12 as resetI18n,
  r3 as resolveContainer,
  P as resolveHydrationSource,
  a22 as resolveLocale,
  E as resolvePriceFormat,
  r4 as resolveProductRating,
  r as resolveSearchPage,
  s as safeHref,
  a_ as safeJsonParse,
  e2 as sanitizeUrl,
  s2 as savePercent,
  a$ as setCurrentPageOverride,
  c as setFeatureStatus,
  a32 as setI18n,
  a42 as setPreviewApiUrl,
  setRecognizedLocale,
  W as setRegistryConversationId,
  setSessionId as setRegistrySessionId,
  d as setRegistrySessionStart,
  k2 as setWholePrices,
  b0 as shortenText,
  o3 as stageUiI18n,
  a52 as startContextToken,
  b1 as startDataLayerBridge,
  e3 as subscribeI18n,
  a62 as toDiscoveryId,
  b2 as trackEvent,
  t as transformSummary,
  l as translate,
  v as translateWithProp,
  b3 as updateEventContext,
  b4 as validateMessage,
  b5 as validateWebSocketMessage,
  a72 as withContextToken,
  b6 as wrapError
};
