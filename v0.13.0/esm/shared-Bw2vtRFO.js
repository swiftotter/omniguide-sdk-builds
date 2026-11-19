import { ab as BaseWebSocket, a$ as getWebSocketBaseUrl } from "./shared-B8dgHFMk.js";
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
  CategoryWebSocket as C
};
