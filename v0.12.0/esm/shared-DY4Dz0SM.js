import { ae as BaseWebSocket, b3 as getWebSocketBaseUrl } from "./shared-jysnbphs.js";
function targetFields(target) {
  if (typeof target === "string") return { category_url: target };
  return { product_type_id: target.productTypeId, stated: target.stated ?? [] };
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
    if (!this.isConnected() || !this.ws) {
      throw new Error("WebSocket not connected");
    }
    this.ws.send(
      JSON.stringify({
        type: "answer",
        question_id: questionId,
        answer_id: answerId,
        answer_text: answerText
      })
    );
  }
  /**
   * Send recommendation request (legacy - for batch submission)
   */
  sendRecommendationRequest(target, answeredIntents, options = {}) {
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
