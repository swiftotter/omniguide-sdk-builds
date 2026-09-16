import { a4 as BaseWebSocket, aN as getWebSocketBaseUrl } from "./shared-ChDzhkiY.js";
class ProductWebSocket extends BaseWebSocket {
  constructor(config) {
    super({
      ...config,
      // Product-specific settings
      enableHeartbeat: true,
      heartbeatIntervalMs: 5e3,
      maxReconnectAttempts: 3,
      maxBackoffDelay: 1e4,
      logPrefix: "[ProductWebSocket]"
    });
    this.apiBaseUrl = config.apiBaseUrl;
  }
  /**
   * Get WebSocket URL for product recommendations
   */
  getWebSocketUrl() {
    const baseUrl = getWebSocketBaseUrl(this.apiBaseUrl);
    return `${baseUrl}/ws/product-recommendations/${this.sessionId}`;
  }
  /**
   * Handle product-specific messages
   */
  handleMessage(msg) {
    this.onMessage(msg);
  }
  /**
   * Send start message to begin conversational flow
   * Note: start only accepts first_answer, not discovery_answers.
   * Use resume for multiple pre-answered questions.
   */
  sendStartMessage(sku, firstAnswer) {
    const message = {
      type: "start",
      sku
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
  sendResumeMessage(sku, discoveryAnswers = {}) {
    this.send({
      type: "resume",
      sku,
      discovery_answers: discoveryAnswers
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
   * Send fit evaluation request (legacy - for batch submission)
   */
  sendFitEvaluationRequest(sku, discoveryAnswers, options = {}) {
    this.send({
      type: "evaluate_fit",
      sku,
      discovery_answers: discoveryAnswers,
      metadata_filters: options.metadataFilters ?? {}
    });
  }
}
export {
  ProductWebSocket as P
};
//# sourceMappingURL=shared-Cnqm-sSd.js.map
