import { a4 as BaseWebSocket, aN as getWebSocketBaseUrl } from "./shared-ChDzhkiY.js";
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
  sendStartMessage(categoryUrl, firstAnswer) {
    const message = {
      type: "start",
      category_url: categoryUrl
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
  sendResumeMessage(categoryUrl, answeredIntents = {}) {
    this.send({
      type: "resume",
      category_url: categoryUrl,
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
  sendRecommendationRequest(categoryUrl, answeredIntents, options = {}) {
    this.send({
      type: "get_recommendations",
      category_url: categoryUrl,
      answered_intents: answeredIntents,
      max_results: options.maxResults ?? 3,
      generate_cards: options.generateCards ?? false
    });
  }
}
export {
  CategoryWebSocket as C
};
//# sourceMappingURL=shared-k6TaZsTH.js.map
