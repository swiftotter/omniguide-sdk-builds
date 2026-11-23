import { a1 as BaseWebSocket, aK as getWebSocketBaseUrl } from "./shared-B1REdlek.js";
function pick(raw, keys) {
  for (const k of keys) {
    if (raw[k] !== void 0 && raw[k] !== null) return raw[k];
  }
  return void 0;
}
function pickString(raw, keys) {
  const v = pick(raw, keys);
  return typeof v === "string" && v.trim() ? v : void 0;
}
function pickNumber(raw, keys) {
  const v = pick(raw, keys);
  if (typeof v === "number" && Number.isFinite(v)) return v;
  if (typeof v === "string" && v.trim() && Number.isFinite(Number(v))) return Number(v);
  return void 0;
}
function pickBullets(raw, keys) {
  const v = pick(raw, keys);
  if (!Array.isArray(v)) return void 0;
  const out = v.map((item) => {
    if (typeof item === "string") return item.trim();
    if (item && typeof item === "object") {
      const o = item;
      const s = o["text"] ?? o["label"] ?? o["value"];
      return typeof s === "string" ? s.trim() : "";
    }
    return "";
  }).filter((s) => !!s);
  return out.length ? out : void 0;
}
function pickReasons(raw, keys) {
  const v = pick(raw, keys);
  if (!Array.isArray(v)) return void 0;
  const out = [];
  for (const item of v) {
    if (!item || typeof item !== "object") continue;
    const o = item;
    const label = o["label"] ?? o["k"] ?? o["key"] ?? o["name"];
    const value = o["value"] ?? o["v"] ?? o["text"];
    if (typeof label === "string" && typeof value === "string" && label.trim() && value.trim()) {
      out.push({ label: label.trim(), value: value.trim() });
    }
  }
  return out.length ? out : void 0;
}
function normalizeRecommendedProduct(raw) {
  const sku = pickString(raw, ["sku", "SKU"]) ?? "";
  const rank = pickNumber(raw, ["rank"]);
  const summary = pickString(raw, ["summary", "why", "one_liner", "oneLiner", "headline", "statement"]);
  const bullets = pickBullets(raw, ["bullets", "why_bullets", "whyBullets", "highlights", "callouts"]);
  const detail = pickString(raw, ["detail", "why_more", "whyMore", "explanation", "details", "long_explanation"]);
  const reasons = pickReasons(raw, ["reasons", "tags", "attributes", "reason_tags", "reasonTags", "spec_highlights"]);
  return {
    ...raw,
    sku,
    ...rank !== void 0 ? { rank } : {},
    ...summary !== void 0 ? { summary } : {},
    ...bullets !== void 0 ? { bullets } : {},
    ...detail !== void 0 ? { detail } : {},
    ...reasons !== void 0 ? { reasons } : {}
  };
}
function normalizeRecommendedProducts(raw) {
  if (!Array.isArray(raw)) return [];
  return raw.map((p) => normalizeRecommendedProduct(p ?? {}));
}
const RECOMMENDATIONS_EVENT = "omniguide:recommendations";
function emitRecommendations(payload) {
  if (typeof window === "undefined") return;
  window[LAST_KEY] = payload;
  window.dispatchEvent(new CustomEvent(RECOMMENDATIONS_EVENT, { detail: payload }));
}
const LAST_KEY = "__omniguideLastRecommendations";
function getLastRecommendations() {
  if (typeof window === "undefined") return null;
  return window[LAST_KEY] ?? null;
}
function onRecommendations(handler) {
  if (typeof window === "undefined") return () => {
  };
  const listener = (e) => {
    const detail = e.detail;
    if (detail) handler(detail);
  };
  window.addEventListener(RECOMMENDATIONS_EVENT, listener);
  return () => window.removeEventListener(RECOMMENDATIONS_EVENT, listener);
}
function guideFields(target) {
  return typeof target === "string" ? { category_url: target } : { product_type_id: target.productTypeId };
}
function targetFields(target) {
  if (typeof target === "string") return guideFields(target);
  return { ...guideFields(target), stated: target.stated ?? [] };
}
class CategoryWebSocket extends BaseWebSocket {
  constructor(config) {
    super({
      ...config,
      // Category-specific settings
      enableHeartbeat: true,
      heartbeatIntervalMs: 5e3,
      maxReconnectAttempts: 3,
      maxBackoffDelay: 1e4,
      logPrefix: "[CategoryWebSocket]"
    });
    this.guide = null;
    this.apiBaseUrl = config.apiBaseUrl;
  }
  /**
   * Get WebSocket URL for category recommendations
   */
  getWebSocketUrl() {
    const baseUrl = getWebSocketBaseUrl(this.apiBaseUrl);
    return `${baseUrl}/ws/category-recommendations/${this.sessionId}`;
  }
  /**
   * Handle category-specific messages
   */
  handleMessage(msg) {
    this.onMessage(msg);
  }
  /**
   * Send start message to begin conversational flow
   */
  sendStartMessage(target, firstAnswer) {
    this.guide = target;
    const message = {
      type: "start",
      ...targetFields(target)
    };
    if (firstAnswer) {
      message["first_answer"] = {
        question_id: firstAnswer.questionId,
        answer_id: firstAnswer.answerId,
        answer_text: firstAnswer.answerText
      };
    }
    this.send(message);
  }
  /**
   * Send resume message to continue from a stored session
   */
  sendResumeMessage(target, answeredIntents = {}) {
    this.guide = target;
    this.send({
      type: "resume",
      ...targetFields(target),
      answered_intents: answeredIntents
    });
  }
  /**
   * Send answer for subsequent questions
   */
  sendAnswerMessage(questionId, answerId, answerText) {
    this.send({
      type: "answer",
      ...this.guide === null ? {} : guideFields(this.guide),
      question_id: questionId,
      answer_id: answerId,
      answer_text: answerText
    });
  }
  /**
   * Send recommendation request (legacy - for batch submission)
   */
  sendRecommendationRequest(target, answeredIntents, options = {}) {
    this.guide = target;
    this.send({
      type: "get_recommendations",
      ...targetFields(target),
      answered_intents: answeredIntents,
      max_results: options.maxResults ?? 3,
      generate_cards: options.generateCards ?? false
    });
  }
}
export {
  CategoryWebSocket as C,
  RECOMMENDATIONS_EVENT as R,
  normalizeRecommendedProduct as a,
  emitRecommendations as e,
  getLastRecommendations as g,
  normalizeRecommendedProducts as n,
  onRecommendations as o
};
