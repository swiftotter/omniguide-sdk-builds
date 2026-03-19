import { B as BaseWebSocket, p as getWebSocketBaseUrl, q as parseMarkdownToHtml, R as ReviewInsightsToggle, u as useComponent, D as DiscoveryFeedbackWidget, F as FLOW_STATES, r as logger, v as normalizeQuestions, d as useOmniguideContext, c as createScopedLogger, w as hydrateAlternativeProduct, x as hydrateCurrentProduct, y as getSessionId, z as AnsweredIntentsStorage, L as LocalStorageAdapter, h as useFeedbackWidget, i as useAnalyticsTracking, j as useBCSearchChat, k as useUserConsent, b as SearchChatPanel, O as OmniguideProvider } from "./shared-DdabyC0H.js";
import { m, o } from "./shared-DdabyC0H.js";
import React, { memo, useState, useRef, useEffect, useCallback, useMemo } from "react";
import { createRoot } from "react-dom/client";
import { f as formatPrice, D as DiscoveryStepIndicator, u as useDiscoveryAnswerStorage, a as useStatusMessage, b as fetchProductQuestions, Q as QuestionnaireTeaser, c as DiscoveryQuestionnaire, d as useFeatureStatus, r as resolveContainer, w as watchFeatureStatus } from "./shared-DngPGqhV.js";
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
const AIIcon = () => /* @__PURE__ */ React.createElement("svg", { viewBox: "0 0 24 24", fill: "none", xmlns: "http://www.w3.org/2000/svg" }, /* @__PURE__ */ React.createElement(
  "path",
  {
    d: "M11.0953 3.5C9.36204 3.5 7.66162 3.99367 6.17831 4.95467C3.28318 6.89787 1.79452 10.5019 2.47783 13.9329C2.81523 15.6277 3.64871 17.1848 4.87159 18.4077C7.33348 20.8695 11.1634 21.6297 14.3954 20.2887C17.6287 18.9468 19.7953 15.7061 19.7953 12.2H22.1253C22.1253 13.7283 21.8016 15.2426 21.194 16.6358C20.4647 18.3048 20.4882 20.3511 21.7771 21.6397L23.9527 23.8144L22.6593 25.1074L20.4893 22.9374C19.1759 21.6239 17.1266 21.6032 15.452 22.3193C11.3761 24.0625 6.41216 23.2517 3.17753 20.0178C1.62698 18.4672 0.571106 16.4922 0.143517 14.3415C-0.714169 10.0018 1.17663 5.43631 4.86298 2.97559C6.68619 1.74882 8.83048 1.1 11.0253 1.1V3.5Z",
    fill: "currentColor"
  }
), /* @__PURE__ */ React.createElement(
  "path",
  {
    d: "M15.9981 1.0488C16.0938 6.0328 17.0717 7.01046 22.0555 7.10521C22.1286 7.68409 22.1285 8.29291 22.0555 8.87181C17.0719 8.96656 17.0939 9.94465 15.9981 14.2282C15.4163 14.3013 14.8033 14.3013 14.2215 14.2282C14.1258 9.94442 13.1483 8.96648 8.16413 8.87181C8.09049 8.29296 8.09041 7.68404 8.16413 7.10521C13.1485 7.01454 14.1258 6.03124 14.2215 1.0488C14.8033 0.961139 15.4163 0.961189 15.9981 1.0488Z",
    fill: "currentColor"
  }
));
const ThumbsUpIcon = () => /* @__PURE__ */ React.createElement("svg", { viewBox: "0 0 28 28", fill: "none", xmlns: "http://www.w3.org/2000/svg" }, /* @__PURE__ */ React.createElement(
  "path",
  {
    d: "M8.16667 12.8333V22.1667M4.66667 14.5V20.5C4.66667 21.4205 5.41286 22.1667 6.33333 22.1667H19.8074C20.9986 22.1667 22.0086 21.2936 22.1796 20.1142L23.1796 13.4475C23.3891 12.0046 22.2627 10.7083 20.8074 10.7083H16.3333C15.8731 10.7083 15.5 10.3352 15.5 9.875V6.54167C15.5 5.16096 14.3807 4.04167 13 4.04167C12.6464 4.04167 12.3231 4.24424 12.1679 4.5619L8.63615 11.7854C8.44887 12.1696 8.05853 12.4167 7.62975 12.4167H6.33333C5.41286 12.4167 4.66667 13.1629 4.66667 14.0833",
    stroke: "currentColor",
    strokeWidth: "2",
    strokeLinecap: "round",
    strokeLinejoin: "round"
  }
));
const CheckIcon = () => /* @__PURE__ */ React.createElement("svg", { viewBox: "0 0 20 20", fill: "currentColor" }, /* @__PURE__ */ React.createElement(
  "path",
  {
    fillRule: "evenodd",
    d: "M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z",
    clipRule: "evenodd"
  }
));
const XIcon = () => /* @__PURE__ */ React.createElement("svg", { viewBox: "0 0 16 16", fill: "none", xmlns: "http://www.w3.org/2000/svg" }, /* @__PURE__ */ React.createElement(
  "path",
  {
    d: "M12 4L4 12M4 4L12 12",
    stroke: "currentColor",
    strokeWidth: "2",
    strokeLinecap: "round",
    strokeLinejoin: "round"
  }
));
const RefreshIcon = () => /* @__PURE__ */ React.createElement("svg", { viewBox: "0 0 24 24", fill: "none", xmlns: "http://www.w3.org/2000/svg" }, /* @__PURE__ */ React.createElement(
  "path",
  {
    d: "M4 4V9H4.582M4.582 9C5.24585 7.35812 6.43568 5.9829 7.96503 5.08985C9.49438 4.1968 11.2768 3.8364 13.033 4.06513C14.7891 4.29386 16.4198 5.09878 17.6694 6.35377C18.919 7.60875 19.7168 9.24285 19.938 11M4.582 9H9M20 20V15H19.418M19.418 15C18.7542 16.6419 17.5643 18.0171 16.035 18.9101C14.5056 19.8032 12.7232 20.1636 10.967 19.9349C9.21089 19.7061 7.58016 18.9012 6.33058 17.6462C5.081 16.3912 4.28325 14.7571 4.062 13M19.418 15H15",
    stroke: "currentColor",
    strokeWidth: "2",
    strokeLinecap: "round",
    strokeLinejoin: "round"
  }
));
const StartOverIcon = () => /* @__PURE__ */ React.createElement("svg", { xmlns: "http://www.w3.org/2000/svg", width: "16", height: "17", viewBox: "0 0 16 17", fill: "none" }, /* @__PURE__ */ React.createElement("path", { d: "M3.19036 4.95812L5.3033 7.07108L4.12479 8.24958L0 4.12479L4.12479 0L5.3033 1.17852L3.19036 3.29146H9.16667C12.8486 3.29146 15.8333 6.27623 15.8333 9.95817C15.8333 13.64 12.8486 16.6248 9.16667 16.6248H1.66667V14.9582H9.16667C11.9281 14.9582 14.1667 12.7196 14.1667 9.95817C14.1667 7.1967 11.9281 4.95812 9.16667 4.95812H3.19036Z", fill: "#F15E22" }));
const CollapseIcon = () => /* @__PURE__ */ React.createElement(
  "svg",
  {
    width: "20",
    height: "20",
    viewBox: "0 0 20 20",
    fill: "currentColor"
  },
  /* @__PURE__ */ React.createElement("path", { fillRule: "evenodd", d: "M14.707 12.707a1 1 0 01-1.414 0L10 9.414l-3.293 3.293a1 1 0 01-1.414-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 010 1.414z", clipRule: "evenodd" })
);
const ExpandIcon = () => /* @__PURE__ */ React.createElement(
  "svg",
  {
    width: "20",
    height: "20",
    viewBox: "0 0 20 20",
    fill: "currentColor"
  },
  /* @__PURE__ */ React.createElement("path", { fillRule: "evenodd", d: "M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z", clipRule: "evenodd" })
);
const ErrorIcon = () => /* @__PURE__ */ React.createElement("svg", { width: "24", height: "24", viewBox: "0 0 20 20", fill: "currentColor" }, /* @__PURE__ */ React.createElement("path", { fillRule: "evenodd", d: "M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z", clipRule: "evenodd" }));
const LoadingState = ({ statusMessage }) => /* @__PURE__ */ React.createElement("div", { className: "omniguide-pr-loading" }, /* @__PURE__ */ React.createElement("div", { className: "omniguide-pr-loading__spinner" }), /* @__PURE__ */ React.createElement("p", { className: "omniguide-pr-loading__text" }, statusMessage || "Evaluating product fit..."));
function isConnectionError(error) {
  return (error == null ? void 0 : error.code) === "WEBSOCKET_ERROR";
}
const ErrorState = ({ error, onRetry }) => {
  const connectionIssue = isConnectionError(error);
  const title = connectionIssue ? "Unable to connect" : "Something went wrong";
  const text = connectionIssue ? "The service is currently unavailable. Please try again in a moment." : "We encountered an error while processing your request. Please try again.";
  return /* @__PURE__ */ React.createElement("div", { className: "omniguide-pr-error" }, /* @__PURE__ */ React.createElement("div", { className: "omniguide-pr-error__icon-wrapper" }, /* @__PURE__ */ React.createElement(ErrorIcon, null)), /* @__PURE__ */ React.createElement("h3", { className: "omniguide-pr-error__title" }, title), /* @__PURE__ */ React.createElement("p", { className: "omniguide-pr-error__text" }, text), /* @__PURE__ */ React.createElement(
    "button",
    {
      type: "button",
      className: "omniguide-pr-error__retry-btn",
      onClick: onRetry
    },
    /* @__PURE__ */ React.createElement(RefreshIcon, null),
    /* @__PURE__ */ React.createElement("span", null, "Try Again")
  ));
};
function GoodFitResult({ fitExplanation }) {
  const reasons = (fitExplanation == null ? void 0 : fitExplanation.why_good_fit) ?? [];
  return /* @__PURE__ */ React.createElement("div", { className: "omniguide-pr-fit omniguide-pr-fit--good" }, /* @__PURE__ */ React.createElement("div", { className: "omniguide-pr-fit__content" }, /* @__PURE__ */ React.createElement("div", { className: "omniguide-pr-fit__heading-container" }, /* @__PURE__ */ React.createElement("div", { className: "omniguide-pr-fit__icon--good" }, /* @__PURE__ */ React.createElement(ThumbsUpIcon, null)), /* @__PURE__ */ React.createElement("h3", { className: "omniguide-pr-fit__title omniguide-pr-fit__title--good" }, "Great Match!")), reasons.length > 0 && /* @__PURE__ */ React.createElement("ul", { className: "omniguide-pr-fit__reasons-list" }, reasons.map((reason, index) => /* @__PURE__ */ React.createElement("li", { key: index, className: "omniguide-pr-fit__reason-item" }, /* @__PURE__ */ React.createElement("div", { className: "omniguide-pr-fit__check-icon" }, /* @__PURE__ */ React.createElement(CheckIcon, null)), /* @__PURE__ */ React.createElement("span", { dangerouslySetInnerHTML: parseMarkdownToHtml(reason) }))))));
}
const ProductComparisonCard = memo(function ProductComparisonCard2({
  product,
  variant,
  reasons = [],
  reasonsTitle,
  showCta = false,
  onProductClick
}) {
  if (!product) return null;
  const {
    name,
    display_name: displayName,
    product_line: productLine,
    price,
    retail_price: retailPrice,
    url,
    image_url: imageUrl,
    review_insights: reviewInsights
  } = product;
  const productName = name ?? displayName ?? "Product";
  const rawBrand = productLine ?? "";
  const brand = rawBrand;
  const cleanProductName = rawBrand && productName.toLowerCase().startsWith(rawBrand.toLowerCase() + " ") ? productName.slice(rawBrand.length).trimStart() || productName : productName;
  const productUrl = url ?? "#";
  const productImage = imageUrl ?? "";
  const rating = (reviewInsights == null ? void 0 : reviewInsights.average_rating) ?? 0;
  const reviewCount = (reviewInsights == null ? void 0 : reviewInsights.review_count) ?? 0;
  const isAlternative = variant === "alternative";
  const badgeClassName = isAlternative ? "omniguide-pr-comparison__badge omniguide-pr-comparison__badge--alternative" : "omniguide-pr-comparison__badge omniguide-pr-comparison__badge--current";
  const badgeText = isAlternative ? "Recommended" : "Current Product";
  const titleClassName = isAlternative ? "omniguide-pr-comparison__reasons-title omniguide-pr-comparison__reasons-title--better" : "omniguide-pr-comparison__reasons-title omniguide-pr-comparison__reasons-title--not-fit";
  const iconClassName = isAlternative ? "omniguide-pr-comparison__reason-icon omniguide-pr-comparison__reason-icon--better" : "omniguide-pr-comparison__reason-icon omniguide-pr-comparison__reason-icon--not-fit";
  const ReasonIcon = isAlternative ? CheckIcon : XIcon;
  return /* @__PURE__ */ React.createElement("div", { className: "omniguide-pr-comparison__card" }, /* @__PURE__ */ React.createElement("div", { className: "omniguide-pr-comparison__image-section" }, productImage && /* @__PURE__ */ React.createElement(
    "img",
    {
      src: productImage,
      alt: cleanProductName,
      className: "omniguide-pr-comparison__image"
    }
  ), /* @__PURE__ */ React.createElement("span", { className: badgeClassName }, badgeText)), /* @__PURE__ */ React.createElement("div", { className: "omniguide-pr-comparison__content" }, /* @__PURE__ */ React.createElement("div", { className: "omniguide-pr-comparison__brand-row" }, brand && /* @__PURE__ */ React.createElement("p", { className: "omniguide-pr-comparison__brand" }, brand), rating > 0 && /* @__PURE__ */ React.createElement(
    ReviewInsightsToggle,
    {
      rating,
      reviewCount,
      summary: reviewInsights == null ? void 0 : reviewInsights.summary,
      likes: reviewInsights == null ? void 0 : reviewInsights.likes,
      productName: cleanProductName,
      productSku: product.sku
    }
  )), /* @__PURE__ */ React.createElement("h4", { className: "omniguide-pr-comparison__name" }, cleanProductName), /* @__PURE__ */ React.createElement("div", { className: "omniguide-pr-comparison__price-row" }, /* @__PURE__ */ React.createElement("div", { className: "omniguide-pr-comparison__price-group" }, price && /* @__PURE__ */ React.createElement("span", { className: "omniguide-pr-comparison__price" }, formatPrice(price)), retailPrice && Number(retailPrice) > Number(price) && /* @__PURE__ */ React.createElement("span", { className: "omniguide-pr-comparison__price omniguide-pr-comparison__price--original" }, formatPrice(retailPrice)))), /* @__PURE__ */ React.createElement("div", { className: "omniguide-pr-comparison__divider" }), reasons.length > 0 && /* @__PURE__ */ React.createElement("div", { className: "omniguide-pr-comparison__reasons-section" }, /* @__PURE__ */ React.createElement("h5", { className: titleClassName }, reasonsTitle), /* @__PURE__ */ React.createElement("ul", { className: "omniguide-pr-comparison__reasons-list" }, reasons.map((reason, index) => /* @__PURE__ */ React.createElement("li", { key: index, className: "omniguide-pr-comparison__reason-item" }, /* @__PURE__ */ React.createElement("div", { className: iconClassName }, /* @__PURE__ */ React.createElement(ReasonIcon, null)), /* @__PURE__ */ React.createElement("span", { dangerouslySetInnerHTML: parseMarkdownToHtml(reason) }))))), showCta && productUrl && /* @__PURE__ */ React.createElement("div", { className: "omniguide-pr-comparison__cta-section" }, /* @__PURE__ */ React.createElement(
    "a",
    {
      href: productUrl,
      className: "omniguide-pr-comparison__view-btn",
      onClick: (e) => {
        e.stopPropagation();
        onProductClick == null ? void 0 : onProductClick(cleanProductName, product.sku, productUrl);
      }
    },
    "View This Product"
  ))));
});
function NotFitResult({ currentProduct, fitExplanation, alternative, onProductClick }) {
  const ProductComparisonCard$1 = useComponent("ProductComparisonCard", ProductComparisonCard);
  const whyNotGoodFit = (fitExplanation == null ? void 0 : fitExplanation.why_not_good_fit) ?? [];
  const whyBetterForYou = (alternative == null ? void 0 : alternative.why_better_for_you) ?? [];
  return /* @__PURE__ */ React.createElement("div", { className: "omniguide-pr-comparison" }, /* @__PURE__ */ React.createElement(
    ProductComparisonCard$1,
    {
      product: currentProduct,
      variant: "current",
      reasons: whyNotGoodFit,
      reasonsTitle: "Why this isn't the best fit:",
      showCta: false
    }
  ), alternative && /* @__PURE__ */ React.createElement(
    ProductComparisonCard$1,
    {
      product: alternative,
      variant: "alternative",
      reasons: whyBetterForYou,
      reasonsTitle: "Why this would work better for you:",
      showCta: true,
      onProductClick
    }
  ));
}
function FitResultsHeader({
  questions = [],
  answeredIntents = {},
  onStepClick,
  showCollapseBtn = false,
  isCollapsed = false,
  onCollapseToggle,
  showSubtitle = false,
  titleExtra = null
}) {
  const handleKeyDown = (e) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      onCollapseToggle == null ? void 0 : onCollapseToggle();
    }
  };
  return /* @__PURE__ */ React.createElement("div", { className: "omniguide-pr-results__header" }, /* @__PURE__ */ React.createElement("div", { className: "omniguide-pr-results__header-row" }, /* @__PURE__ */ React.createElement("div", { className: "omniguide-pr-results__header-content" }, /* @__PURE__ */ React.createElement("div", { className: "omniguide-pr-results__title-row" }, /* @__PURE__ */ React.createElement("div", { className: "omniguide-pr-results__icon" }, /* @__PURE__ */ React.createElement(AIIcon, null)), titleExtra ? /* @__PURE__ */ React.createElement("div", { className: "omniguide-pr-results__title-content" }, /* @__PURE__ */ React.createElement("h2", { className: "omniguide-pr-results__title" }, "Is this the right product for me?"), titleExtra) : /* @__PURE__ */ React.createElement("h2", { className: "omniguide-pr-results__title" }, "Is this the right product for me?")), questions.length > 0 && /* @__PURE__ */ React.createElement("div", { className: "omniguide-pr-results__header-pills" }, /* @__PURE__ */ React.createElement(
    DiscoveryStepIndicator,
    {
      currentStep: -1,
      totalSteps: questions.length,
      answeredIntents,
      questions,
      onStepClick
    }
  ))), showCollapseBtn && onCollapseToggle && /* @__PURE__ */ React.createElement(
    "button",
    {
      type: "button",
      className: "omniguide-pr-results__collapse-btn",
      "data-collapsed": isCollapsed,
      onClick: onCollapseToggle,
      onKeyDown: handleKeyDown,
      "aria-expanded": !isCollapsed,
      "aria-label": isCollapsed ? "Expand recommendations" : "Collapse recommendations"
    },
    /* @__PURE__ */ React.createElement(CollapseIcon, null)
  )), showSubtitle && /* @__PURE__ */ React.createElement("p", { className: "omniguide-pr-results__subtitle" }, "Based on your answers, here's our assessment of this product for your needs."));
}
function FitResultsFooter({ fitResult, alternative, onBack, onStartOver, onFeedbackSubmit }) {
  var _a, _b, _c;
  return /* @__PURE__ */ React.createElement("div", { className: "omniguide-pr-results__footer" }, /* @__PURE__ */ React.createElement(
    DiscoveryFeedbackWidget,
    {
      entityId: (alternative == null ? void 0 : alternative.sku) ?? ((_a = fitResult.currentProduct) == null ? void 0 : _a.sku) ?? "",
      entityType: "product_recommendation",
      context: {
        product_name: alternative ? alternative.name ?? alternative.display_name : ((_b = fitResult.currentProduct) == null ? void 0 : _b.name) ?? ((_c = fitResult.currentProduct) == null ? void 0 : _c.display_name),
        fit_status: alternative ? "poor_fit_alternative" : "good_fit"
      },
      onSubmit: onFeedbackSubmit
    }
  ), /* @__PURE__ */ React.createElement("div", { className: "omniguide-pr-results__footer-text" }, "Powered by AI"), /* @__PURE__ */ React.createElement(
    "button",
    {
      type: "button",
      onClick: () => {
        onStartOver == null ? void 0 : onStartOver();
        onBack();
      },
      className: "omniguide-pr-results__start-over"
    },
    /* @__PURE__ */ React.createElement("div", { className: "omniguide-pr-results__start-over-icon" }, /* @__PURE__ */ React.createElement(StartOverIcon, null)),
    "Start Over"
  ));
}
function FitResultsPanel({
  fitResult,
  isLoading,
  error,
  statusMessage,
  onBack,
  questions = [],
  answeredIntents = {},
  onStepClick,
  isCollapsed = false,
  onCollapseToggle,
  isTruncated = false,
  onTruncatedToggle,
  onProductClick,
  onStartOver,
  onFeedbackSubmit
}) {
  const GoodFitResult$1 = useComponent("GoodFitResult", GoodFitResult);
  const NotFitResult$1 = useComponent("NotFitResult", NotFitResult);
  const headerProps = { questions, answeredIntents, onStepClick };
  if (isLoading) {
    return /* @__PURE__ */ React.createElement("div", { className: "omniguide-pr-results" }, /* @__PURE__ */ React.createElement(FitResultsHeader, { ...headerProps }), /* @__PURE__ */ React.createElement(LoadingState, { statusMessage }));
  }
  if (error) {
    return /* @__PURE__ */ React.createElement("div", { className: "omniguide-pr-results" }, /* @__PURE__ */ React.createElement(ErrorState, { error, onRetry: onBack }));
  }
  if (!fitResult) return null;
  const { fitEvaluation, fitExplanation, alternative } = fitResult;
  const isGoodFit = (fitEvaluation == null ? void 0 : fitEvaluation.is_good_fit) ?? true;
  const fitContent = isGoodFit ? /* @__PURE__ */ React.createElement(GoodFitResult$1, { fitExplanation }) : /* @__PURE__ */ React.createElement(
    NotFitResult$1,
    {
      currentProduct: fitResult.currentProduct,
      fitExplanation,
      alternative,
      onProductClick
    }
  );
  if (isCollapsed) {
    const expandLink = /* @__PURE__ */ React.createElement(
      "button",
      {
        type: "button",
        onClick: onCollapseToggle,
        className: "omniguide-pr-results__expand-link",
        "aria-expanded": "false",
        "aria-label": "See our recommendation"
      },
      "See our recommendation"
    );
    return /* @__PURE__ */ React.createElement("div", { className: "omniguide-pr-results omniguide-pr-results--collapsed" }, /* @__PURE__ */ React.createElement(
      FitResultsHeader,
      {
        ...headerProps,
        showCollapseBtn: true,
        isCollapsed: true,
        onCollapseToggle,
        titleExtra: expandLink
      }
    ));
  }
  if (isTruncated) {
    return /* @__PURE__ */ React.createElement("div", { className: "omniguide-pr-results omniguide-pr-results--truncated" }, /* @__PURE__ */ React.createElement(FitResultsHeader, { ...headerProps, showSubtitle: true }), /* @__PURE__ */ React.createElement("div", { className: "omniguide-pr-results__truncated-content" }, /* @__PURE__ */ React.createElement("div", { className: "omniguide-pr-results__truncated-preview" }, fitContent), /* @__PURE__ */ React.createElement("div", { className: "omniguide-pr-results__truncated-fade" })), /* @__PURE__ */ React.createElement("div", { className: "omniguide-pr-results__show-more-container" }, /* @__PURE__ */ React.createElement(
      "button",
      {
        type: "button",
        className: "omniguide-pr-results__show-more-btn",
        onClick: onTruncatedToggle
      },
      /* @__PURE__ */ React.createElement("span", null, "Show More"),
      /* @__PURE__ */ React.createElement(ExpandIcon, null)
    )));
  }
  return /* @__PURE__ */ React.createElement("div", { className: "omniguide-pr-results" }, /* @__PURE__ */ React.createElement(
    FitResultsHeader,
    {
      ...headerProps,
      showCollapseBtn: true,
      isCollapsed: false,
      onCollapseToggle,
      showSubtitle: true
    }
  ), fitContent, onBack && /* @__PURE__ */ React.createElement(
    FitResultsFooter,
    {
      fitResult,
      alternative,
      onBack,
      onStartOver,
      onFeedbackSubmit
    }
  ));
}
function ProductQuestionSkeleton() {
  return /* @__PURE__ */ React.createElement("div", { className: "omniguide-pr-skeleton" }, /* @__PURE__ */ React.createElement("div", { className: "omniguide-pr-skeleton__header-row" }, /* @__PURE__ */ React.createElement("div", { className: "omniguide-pr-skeleton__icon" }), /* @__PURE__ */ React.createElement("div", { className: "omniguide-pr-skeleton__title" })), /* @__PURE__ */ React.createElement("div", { className: "omniguide-pr-skeleton__question" }), /* @__PURE__ */ React.createElement("div", { className: "omniguide-pr-skeleton__choices" }, [1, 2, 3, 4].map((i) => /* @__PURE__ */ React.createElement(
    "div",
    {
      key: i,
      className: "omniguide-pr-skeleton__pill"
    }
  ))));
}
const PRODUCT_STATUS_MESSAGES = {
  analyzing_preferences: "Analyzing your preferences...",
  evaluating_fit: "Evaluating product fit...",
  finding_alternatives: "Finding alternatives...",
  generating_insights: "Generating insights...",
  finalizing: "Finalizing evaluation...",
  processing: "Processing..."
};
function withTimeout(promise, timeoutMs, fallbackValue) {
  return Promise.race([
    promise,
    new Promise((resolve) => {
      setTimeout(() => resolve(fallbackValue), timeoutMs);
    })
  ]);
}
function useProductWebSocket({
  hydration,
  wsFactory,
  storageAdapter,
  productTypeId = null
}) {
  const [connectionStatus, setConnectionStatus] = useState("disconnected");
  const [flowState, setFlowState] = useState(FLOW_STATES.IDLE);
  const [currentQuestion, setCurrentQuestion] = useState(null);
  const [questionNumber, setQuestionNumber] = useState(0);
  const [answeredQuestions, setAnsweredQuestions] = useState([]);
  const [fitResult, setFitResult] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [processingStatus, setProcessingStatus] = useState(null);
  const [otherValidationError, setOtherValidationError] = useState(null);
  const [clarificationPrompt, setClarificationPrompt] = useState(null);
  const [isOtherProcessing, setIsOtherProcessing] = useState(false);
  const wsRef = useRef(null);
  const requestInProgressRef = useRef(false);
  const skuRef = useRef(null);
  const questionNumberRef = useRef(questionNumber);
  const { saveAnswer, restoreFromStorage, hasStoredSession, clearStorage } = useDiscoveryAnswerStorage(storageAdapter, productTypeId);
  const { getStatusMessage } = useStatusMessage(processingStatus, PRODUCT_STATUS_MESSAGES);
  useEffect(() => {
    questionNumberRef.current = questionNumber;
  }, [questionNumber]);
  useEffect(() => {
    return () => {
      if (wsRef.current) {
        wsRef.current.disconnect();
        wsRef.current = null;
      }
    };
  }, []);
  const disconnectWebSocket = useCallback(() => {
    if (wsRef.current) {
      wsRef.current.disconnect();
      wsRef.current = null;
      setConnectionStatus("disconnected");
    }
  }, []);
  const hydrateProducts = useCallback(async (result) => {
    const HYDRATION_TIMEOUT_MS = 5e3;
    const hydrationPromises = [];
    if (result["currentProduct"]) {
      const product = result["currentProduct"];
      const hydrationPromise = hydration.hydrateCurrentProduct(product).then((hydrated) => ({ type: "currentProduct", data: hydrated })).catch(() => ({ type: "currentProduct", data: product }));
      const fallback = { type: "currentProduct", data: product };
      hydrationPromises.push(withTimeout(hydrationPromise, HYDRATION_TIMEOUT_MS, fallback));
    }
    if (result["alternative"]) {
      const alternative = result["alternative"];
      const hydrationPromise = hydration.hydrateAlternativeProduct(alternative).then((hydrated) => ({ type: "alternative", data: hydrated })).catch(() => ({ type: "alternative", data: alternative }));
      const fallback = { type: "alternative", data: alternative };
      hydrationPromises.push(withTimeout(hydrationPromise, HYDRATION_TIMEOUT_MS, fallback));
    }
    if (hydrationPromises.length > 0) {
      setProcessingStatus("finalizing");
      try {
        const results = await Promise.all(hydrationPromises);
        const updates = {};
        results.forEach(({ type, data }) => {
          updates[type] = data;
        });
        return updates;
      } catch {
        return {};
      }
    }
    return {};
  }, [hydration]);
  const createMessageHandler = useCallback((msg) => {
    switch (msg["type"]) {
      case "question": {
        const rawQuestion = msg["question"];
        const normalized = normalizeQuestions({ questions: [rawQuestion] });
        setCurrentQuestion(normalized[0] ?? rawQuestion);
        setQuestionNumber(msg["question_number"] || questionNumberRef.current + 1);
        setFlowState(FLOW_STATES.QUESTIONING);
        setIsLoading(false);
        break;
      }
      case "resumed": {
        const answeredCount = msg["answered_count"] || 0;
        setQuestionNumber(answeredCount);
        break;
      }
      case "status": {
        const status = msg["status"];
        setProcessingStatus(status);
        if (status === "questions_complete") {
          setFlowState(FLOW_STATES.LOADING_RESULTS);
          setIsLoading(true);
          setCurrentQuestion(null);
        } else if (status === "processing" || status === "evaluating_fit") {
          setIsLoading(true);
        }
        break;
      }
      case "fit_evaluation": {
        const result = {
          currentProduct: msg["current_product"],
          fitEvaluation: msg["fit_evaluation"],
          fitExplanation: msg["fit_explanation"],
          alternative: msg["alternative"]
        };
        setFitResult(result);
        disconnectWebSocket();
        hydrateProducts(result).then((updates) => {
          if (Object.keys(updates).length > 0) {
            setFitResult((prev) => prev ? { ...prev, ...updates } : updates);
          }
          setIsLoading(false);
          setProcessingStatus(null);
          setError(null);
          setFlowState(FLOW_STATES.COMPLETE);
          requestInProgressRef.current = false;
        }).catch(() => {
          setIsLoading(false);
          setProcessingStatus(null);
          setError(null);
          setFlowState(FLOW_STATES.COMPLETE);
          requestInProgressRef.current = false;
        });
        break;
      }
      case "answer_response": {
        setIsOtherProcessing(false);
        if (msg["validation_failed"]) {
          setOtherValidationError({ message: msg["error_message"] || "Invalid answer. Please try again." });
          setIsLoading(false);
        } else if (msg["needs_clarification"]) {
          setClarificationPrompt(msg["clarification_prompt"] || "Please provide more details.");
          setIsLoading(false);
        } else if (msg["has_next_question"]) {
          setOtherValidationError(null);
          setClarificationPrompt(null);
        } else if (msg["is_terminal"]) {
          setOtherValidationError(null);
          setClarificationPrompt(null);
          setFlowState(FLOW_STATES.LOADING_RESULTS);
          setIsLoading(true);
          setCurrentQuestion(null);
        }
        break;
      }
      case "done":
        setIsLoading(false);
        setProcessingStatus(null);
        requestInProgressRef.current = false;
        disconnectWebSocket();
        break;
      case "error": {
        const rawError = msg["content"] || "Unknown error";
        logger.error("Product WebSocket error:", rawError);
        setError(new Error("We encountered an error while processing your request. Please try again."));
        setIsLoading(false);
        setProcessingStatus(null);
        setFlowState(FLOW_STATES.ERROR);
        requestInProgressRef.current = false;
        disconnectWebSocket();
        break;
      }
    }
  }, [disconnectWebSocket, hydrateProducts]);
  const connectWebSocket = useCallback(async () => {
    disconnectWebSocket();
    const ws = wsFactory.create({
      onMessage: createMessageHandler,
      onStatusChange: setConnectionStatus,
      onError: (err) => {
        logger.error("Product WebSocket connection error:", err.message);
        setError(err);
        setIsLoading(false);
        setProcessingStatus(null);
        setFlowState(FLOW_STATES.ERROR);
        requestInProgressRef.current = false;
        disconnectWebSocket();
      }
    });
    wsRef.current = ws;
    await ws.connect();
    return ws;
  }, [wsFactory, createMessageHandler, disconnectWebSocket]);
  const resetForNewRequest = useCallback(() => {
    setIsLoading(true);
    setError(null);
    setFitResult(null);
    setProcessingStatus("analyzing_preferences");
    setFlowState(FLOW_STATES.CONNECTING);
  }, []);
  const startConversation = useCallback(async (sku, firstAnswer = null, firstQuestion = null) => {
    if (requestInProgressRef.current) return;
    requestInProgressRef.current = true;
    skuRef.current = sku;
    resetForNewRequest();
    if (firstAnswer && firstQuestion) {
      setAnsweredQuestions([{
        question: firstQuestion,
        answer: { answer_id: firstAnswer.answerId, answer: firstAnswer.answerText }
      }]);
      setQuestionNumber(1);
      saveAnswer(firstAnswer.questionId, firstAnswer.answerId, firstAnswer.answerText, firstAnswer.answerId === null, firstQuestion);
    } else {
      setAnsweredQuestions([]);
      setQuestionNumber(0);
    }
    try {
      const ws = await connectWebSocket();
      ws.sendStartMessage(sku, firstAnswer);
    } catch (err) {
      logger.error("Product WebSocket startConversation failed:", err instanceof Error ? err.message : String(err));
      setError(err instanceof Error ? err : new Error(String(err)));
      setIsLoading(false);
      setProcessingStatus(null);
      setFlowState(FLOW_STATES.ERROR);
      requestInProgressRef.current = false;
      disconnectWebSocket();
    }
  }, [connectWebSocket, disconnectWebSocket, resetForNewRequest, saveAnswer]);
  const resumeSession = useCallback(async (sku) => {
    const answeredIntents = storageAdapter.getForApi(productTypeId);
    if (Object.keys(answeredIntents).length === 0) return false;
    if (requestInProgressRef.current) return false;
    requestInProgressRef.current = true;
    skuRef.current = sku;
    const restoredAnswers = restoreFromStorage();
    setAnsweredQuestions(restoredAnswers);
    setQuestionNumber(Object.keys(answeredIntents).length);
    resetForNewRequest();
    try {
      const ws = await connectWebSocket();
      ws.sendResumeMessage(sku, answeredIntents);
      return true;
    } catch (err) {
      logger.error("Product WebSocket resumeSession failed:", err instanceof Error ? err.message : String(err));
      setError(err instanceof Error ? err : new Error(String(err)));
      setIsLoading(false);
      setProcessingStatus(null);
      setFlowState(FLOW_STATES.ERROR);
      requestInProgressRef.current = false;
      disconnectWebSocket();
      return false;
    }
  }, [connectWebSocket, disconnectWebSocket, resetForNewRequest, restoreFromStorage, storageAdapter, productTypeId]);
  const submitAnswer = useCallback((questionId, answerId, answerText, question) => {
    if (!wsRef.current || !wsRef.current.isConnected()) return;
    setAnsweredQuestions((prev) => [...prev, {
      question,
      answer: { answer_id: answerId, answer: answerText }
    }]);
    saveAnswer(questionId, answerId, answerText, false, question);
    setIsLoading(true);
    setCurrentQuestion(null);
    wsRef.current.sendAnswerMessage(questionId, answerId, answerText);
  }, [saveAnswer]);
  const submitOtherAnswer = useCallback((questionId, answerText, question) => {
    if (!wsRef.current || !wsRef.current.isConnected()) return;
    setOtherValidationError(null);
    setIsOtherProcessing(true);
    setIsLoading(true);
    setAnsweredQuestions((prev) => [...prev, {
      question,
      answer: { answer_id: null, answer: answerText }
    }]);
    saveAnswer(questionId, null, answerText, true, question);
    wsRef.current.sendAnswerMessage(questionId, null, answerText);
  }, [saveAnswer]);
  const clearOtherError = useCallback(() => {
    setOtherValidationError(null);
  }, []);
  const resetConversation = useCallback(() => {
    disconnectWebSocket();
    clearStorage();
    setFlowState(FLOW_STATES.IDLE);
    setCurrentQuestion(null);
    setQuestionNumber(0);
    setAnsweredQuestions([]);
    setFitResult(null);
    setIsLoading(false);
    setError(null);
    setProcessingStatus(null);
    setOtherValidationError(null);
    setClarificationPrompt(null);
    setIsOtherProcessing(false);
    requestInProgressRef.current = false;
  }, [disconnectWebSocket, clearStorage]);
  const disconnect = useCallback(() => {
    disconnectWebSocket();
  }, [disconnectWebSocket]);
  return {
    connectionStatus,
    flowState,
    currentQuestion,
    questionNumber,
    answeredQuestions,
    fitResult,
    isLoading,
    error,
    processingStatus,
    otherValidationError,
    clarificationPrompt,
    isOtherProcessing,
    getStatusMessage,
    startConversation,
    resumeSession,
    submitAnswer,
    submitOtherAnswer,
    clearOtherError,
    resetConversation,
    disconnect,
    hasStoredSession
  };
}
const log$2 = createScopedLogger("useBCProductQuestions");
function useBCProductQuestions(productSku) {
  const { config } = useOmniguideContext();
  const [questions, setQuestions] = useState([]);
  const [productData, setProductData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [retryCount, setRetryCount] = useState(0);
  const retry = useCallback(() => setRetryCount((c) => c + 1), []);
  useEffect(() => {
    const loadQuestions = async () => {
      setLoading(true);
      setError(null);
      try {
        if (!productSku) {
          log$2.warn("No product SKU provided");
          setQuestions([]);
          setLoading(false);
          return;
        }
        const questionConfig = {
          apiBaseUrl: config.apiBaseUrl,
          websiteId: config.websiteId
        };
        const data = await fetchProductQuestions(questionConfig, productSku);
        setProductData({
          productId: data["product_id"],
          productSku: data["product_sku"],
          productName: data["product_name"],
          productTypeId: data["product_type_id"],
          productTypeName: data["product_type_name"],
          suggestedQuestions: data["suggested_questions"] || []
        });
        setQuestions(data.questions);
      } catch (err) {
        log$2.error("Error loading product questions:", err);
        setError(err instanceof Error ? err : new Error(String(err)));
        setQuestions([]);
      } finally {
        setLoading(false);
      }
    };
    loadQuestions();
  }, [productSku, config.apiBaseUrl, config.websiteId, retryCount]);
  return {
    questions,
    productData,
    loading,
    error,
    hasQuestions: questions.length > 0,
    retry
  };
}
function useBCProductWebSocket({
  productTypeId = null
} = {}) {
  var _a;
  const { config, platformAdapter } = useOmniguideContext();
  const hydrationConfig = useMemo(() => ({
    apiBaseUrl: config.apiBaseUrl,
    websiteId: config.websiteId,
    getGraphQLToken: () => platformAdapter.getCredentials()["graphQLToken"] ?? null
  }), [config.apiBaseUrl, config.websiteId, platformAdapter]);
  const hydration = useMemo(() => ({
    hydrateCurrentProduct: (product) => hydrateCurrentProduct(hydrationConfig, product),
    hydrateAlternativeProduct: (product) => hydrateAlternativeProduct(hydrationConfig, product)
  }), [hydrationConfig]);
  const wsFactory = useMemo(() => ({
    create: (wsConfig) => {
      const ws = new ProductWebSocket({
        apiBaseUrl: config.apiBaseUrl,
        websiteCode: config.websiteId,
        sessionId: getSessionId(config.websiteId) ?? void 0,
        ...wsConfig
      });
      return ws;
    }
  }), [config.apiBaseUrl, config.websiteId]);
  const storageKey = ((_a = config.storageKeys) == null ? void 0 : _a.productAnsweredIntents) ?? "omniguideAnsweredIntents";
  const storageAdapter = useMemo(() => {
    const storage = new AnsweredIntentsStorage(
      new LocalStorageAdapter(),
      storageKey
    );
    return {
      load: (ptId) => {
        const raw = storage.load(ptId != null ? Number(ptId) : void 0);
        const result = {};
        for (const [key, value] of Object.entries(raw)) {
          result[key] = {
            question_id: value.questionId,
            answer_id: String(value.answerId),
            answer_text: value.answerText ?? "",
            is_other: value.isOther ?? false,
            question: null
          };
        }
        return result;
      },
      save: (intents) => {
        const sdkIntents = {};
        for (const [key, entry] of Object.entries(intents)) {
          sdkIntents[key] = {
            questionId: entry.question_id,
            answerId: entry.answer_id ?? "",
            answerText: entry.answer_text,
            isOther: entry.is_other,
            productTypeId: productTypeId != null ? Number(productTypeId) : void 0
          };
        }
        storage.save(sdkIntents);
      },
      toDiscoveryId: (id) => id.startsWith("discovery_") ? id : `discovery_${id}`,
      getForApi: (ptId) => {
        const raw = storage.toApiFormat(ptId != null ? Number(ptId) : void 0);
        const result = {};
        for (const [key, value] of Object.entries(raw)) {
          result[key] = value;
        }
        return result;
      }
    };
  }, [storageKey, productTypeId]);
  return useProductWebSocket({
    hydration,
    wsFactory,
    storageAdapter,
    productTypeId
  });
}
function scrollToElement(element) {
  if (!element) return;
  setTimeout(() => {
    if (!element) return;
    const header = document.querySelector("header");
    const headerHeight = header ? header.offsetHeight : 0;
    const rect = element.getBoundingClientRect();
    const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
    const elementTop = rect.top + scrollTop;
    const targetScroll = elementTop - headerHeight;
    if (rect.top < headerHeight) {
      window.scrollTo({ top: Math.max(0, targetScroll), behavior: "smooth" });
    }
  }, 100);
}
function BCProductQuestionnaire({
  productSku,
  onSuggestedQuestionsLoad,
  onNotFitResult,
  isCollapsed: propIsCollapsed = false,
  onCollapseToggle: propOnCollapseToggle
}) {
  var _a, _b;
  const DiscoveryQuestionnaire$1 = useComponent("DiscoveryQuestionnaire", DiscoveryQuestionnaire);
  const FitResultsPanel$1 = useComponent("FitResultsPanel", FitResultsPanel);
  const { config, feedbackApi } = useOmniguideContext();
  const teaserEnabled = ((_b = (_a = config.features) == null ? void 0 : _a.questionnaireTeaser) == null ? void 0 : _b.productFit) ?? false;
  const containerRef = useRef(null);
  const shouldScrollToTopRef = useRef(false);
  const { questions: initialQuestions, productData, loading: questionsLoading, hasQuestions, error: questionsError, retry: retryQuestions } = useBCProductQuestions(productSku);
  const {
    flowState,
    currentQuestion: wsQuestion,
    questionNumber,
    answeredQuestions,
    fitResult,
    isLoading: evaluationLoading,
    error: evaluationError,
    getStatusMessage,
    startConversation,
    resumeSession,
    submitAnswer,
    submitOtherAnswer,
    clearOtherError,
    resetConversation,
    disconnect,
    otherValidationError,
    clarificationPrompt,
    isOtherProcessing,
    hasStoredSession
  } = useBCProductWebSocket({ productTypeId: productData == null ? void 0 : productData.productTypeId });
  const [noQuestions, setNoQuestions] = useState(false);
  const [resultsCollapsed, setResultsCollapsed] = useState(false);
  const [resultsTruncated, setResultsTruncated] = useState(false);
  const [teaserExpanded, setTeaserExpanded] = useState(false);
  const firstQuestion = initialQuestions.length > 0 ? initialQuestions[0] : null;
  const currentQuestion = useMemo(() => {
    if (flowState === FLOW_STATES.IDLE || flowState === FLOW_STATES.LOADING_FIRST || flowState === FLOW_STATES.SHOWING_FIRST) {
      return firstQuestion;
    }
    return wsQuestion;
  }, [flowState, firstQuestion, wsQuestion]);
  const showQuestionnaire = useMemo(() => {
    if (!hasQuestions) return false;
    const idleOrFirst = flowState === FLOW_STATES.IDLE || flowState === FLOW_STATES.SHOWING_FIRST;
    const questioning = flowState === FLOW_STATES.QUESTIONING && wsQuestion;
    return idleOrFirst && firstQuestion || questioning;
  }, [hasQuestions, flowState, firstQuestion, wsQuestion]);
  const showResults = useMemo(() => {
    return flowState === FLOW_STATES.LOADING_RESULTS || flowState === FLOW_STATES.COMPLETE || flowState === FLOW_STATES.ERROR;
  }, [flowState]);
  const questionsForIndicator = useMemo(
    () => answeredQuestions.map((aq) => aq.question),
    [answeredQuestions]
  );
  const answeredIntentsForIndicator = useMemo(() => {
    const intents = {};
    answeredQuestions.forEach((aq) => {
      var _a2;
      const qId = (_a2 = aq.question) == null ? void 0 : _a2["id"];
      if (qId) {
        intents[String(qId)] = aq.answer;
      }
    });
    return intents;
  }, [answeredQuestions]);
  const effectiveCollapsed = propIsCollapsed || resultsCollapsed;
  useEffect(() => {
    if (!questionsLoading && !hasQuestions) {
      setNoQuestions(true);
    }
  }, [questionsLoading, hasQuestions]);
  useEffect(() => {
    if (!questionsLoading && flowState === FLOW_STATES.IDLE && hasStoredSession() && productSku) {
      if (teaserEnabled && !teaserExpanded) setTeaserExpanded(true);
      resumeSession(productSku);
    }
  }, [questionsLoading, flowState, hasStoredSession, resumeSession, productSku]);
  useEffect(() => {
    var _a2;
    if (((_a2 = productData == null ? void 0 : productData.suggestedQuestions) == null ? void 0 : _a2.length) && onSuggestedQuestionsLoad) {
      onSuggestedQuestionsLoad(productData.suggestedQuestions);
    }
  }, [productData, onSuggestedQuestionsLoad]);
  useEffect(() => {
    if (fitResult && flowState === FLOW_STATES.COMPLETE) {
      const result = fitResult;
      const fitEval = result["fitEvaluation"];
      const isNotFit = (fitEval == null ? void 0 : fitEval["is_good_fit"]) === false;
      onNotFitResult == null ? void 0 : onNotFitResult(isNotFit);
    } else if (!fitResult) {
      onNotFitResult == null ? void 0 : onNotFitResult(false);
    }
  }, [fitResult, flowState, onNotFitResult]);
  const handleSelectAnswer = useCallback(
    (questionId, answer) => {
      if (!currentQuestion) return;
      const answerData = {
        questionId: String(questionId),
        answerId: answer.id != null ? String(answer.id) : null,
        answerText: answer.text
      };
      const q = currentQuestion;
      if (flowState === FLOW_STATES.IDLE || flowState === FLOW_STATES.SHOWING_FIRST) {
        startConversation(productSku, answerData, q);
      } else if (flowState === FLOW_STATES.QUESTIONING) {
        submitAnswer(answerData.questionId, answerData.answerId, answerData.answerText, q);
      }
    },
    [flowState, currentQuestion, productSku, startConversation, submitAnswer]
  );
  const handleOtherSubmit = useCallback(
    (otherText) => {
      if (!currentQuestion) return;
      const q = currentQuestion;
      const qId = String(q["id"]);
      if (flowState === FLOW_STATES.IDLE || flowState === FLOW_STATES.SHOWING_FIRST) {
        const answerData = { questionId: qId, answerId: null, answerText: otherText };
        startConversation(productSku, answerData, q);
      } else if (flowState === FLOW_STATES.QUESTIONING) {
        submitOtherAnswer(qId, otherText, q);
      }
    },
    [currentQuestion, flowState, productSku, startConversation, submitOtherAnswer]
  );
  const handleBack = useCallback(() => {
    shouldScrollToTopRef.current = true;
    resetConversation();
    setResultsCollapsed(false);
    setResultsTruncated(false);
  }, [resetConversation]);
  const handleResultsStepClick = useCallback(() => {
    handleBack();
  }, [handleBack]);
  useEffect(() => {
    if (showQuestionnaire) {
      scrollToElement(containerRef.current);
    }
  }, [showQuestionnaire, questionNumber]);
  useEffect(() => {
    if (shouldScrollToTopRef.current && !showResults) {
      shouldScrollToTopRef.current = false;
      scrollToElement(containerRef.current);
    }
  }, [showResults]);
  const handleCollapseToggle = useCallback(() => {
    if (propOnCollapseToggle) {
      propOnCollapseToggle();
    } else {
      setResultsCollapsed((prev) => !prev);
    }
  }, [propOnCollapseToggle]);
  const handleTruncatedToggle = useCallback(() => {
    setResultsTruncated((prev) => !prev);
  }, []);
  useEffect(() => {
    return () => {
      disconnect();
    };
  }, [disconnect]);
  const handleFeedbackSubmit = useCallback(
    async (data) => {
      if (!feedbackApi) throw new Error("Feedback API not available");
      return feedbackApi.submitFeedback({
        entityId: data.entity_id,
        entityType: data.entity_type,
        vote: data.vote,
        comment: data.comment ?? "",
        context: data.context ?? {}
      });
    },
    [feedbackApi]
  );
  const containerClassName = noQuestions && !questionsError ? "omniguide-pr-container omniguide-pr-container--collapsed" : "omniguide-pr-container";
  const questionsForQuestionnaire = currentQuestion ? [currentQuestion] : [];
  const currentAnsweredIntents = {};
  const questionnaireContent = /* @__PURE__ */ React.createElement(React.Fragment, null, questionsLoading && /* @__PURE__ */ React.createElement(ProductQuestionSkeleton, null), !questionsLoading && questionsError && !hasQuestions && /* @__PURE__ */ React.createElement("div", { className: "omniguide-pr-error" }, /* @__PURE__ */ React.createElement("h3", { className: "omniguide-pr-error__title" }, "Unable to connect"), /* @__PURE__ */ React.createElement("p", { className: "omniguide-pr-error__text" }, "The service is currently unavailable. Please try again in a moment."), /* @__PURE__ */ React.createElement(
    "button",
    {
      type: "button",
      className: "omniguide-pr-error__retry-btn",
      onClick: retryQuestions
    },
    /* @__PURE__ */ React.createElement("span", null, "Try Again")
  )), !questionsLoading && showQuestionnaire && currentQuestion && /* @__PURE__ */ React.createElement(
    DiscoveryQuestionnaire$1,
    {
      questions: questionsForQuestionnaire,
      currentStep: 0,
      answeredIntents: currentAnsweredIntents,
      onSelectAnswer: handleSelectAnswer,
      onNext: () => {
      },
      onPrevious: () => {
      },
      onSubmit: () => {
      },
      onStepClick: () => {
      },
      dynamicMode: true,
      answeredQuestions,
      questionNumber: answeredQuestions.length + 1,
      onOtherSubmit: handleOtherSubmit,
      isOtherProcessing,
      otherError: otherValidationError,
      clarificationPrompt,
      onClearOtherError: clearOtherError,
      classPrefix: "omniguide-pr"
    }
  ), !questionsLoading && !showQuestionnaire && !showResults && (flowState === FLOW_STATES.CONNECTING || flowState === FLOW_STATES.QUESTIONING && !wsQuestion) && /* @__PURE__ */ React.createElement("div", { className: "omniguide-pr-questionnaire" }, /* @__PURE__ */ React.createElement(ProductQuestionSkeleton, null)));
  const showTeaser = teaserEnabled && !teaserExpanded && flowState === FLOW_STATES.IDLE && !showResults;
  return /* @__PURE__ */ React.createElement("div", { ref: containerRef, className: containerClassName }, showTeaser ? /* @__PURE__ */ React.createElement(
    QuestionnaireTeaser,
    {
      classPrefix: "omniguide-pr",
      onExpand: () => setTeaserExpanded(true)
    },
    questionnaireContent
  ) : questionnaireContent, showResults && /* @__PURE__ */ React.createElement(
    FitResultsPanel$1,
    {
      fitResult,
      isLoading: evaluationLoading || flowState === FLOW_STATES.LOADING_RESULTS,
      error: evaluationError,
      statusMessage: getStatusMessage() ?? void 0,
      onBack: handleBack,
      questions: questionsForIndicator,
      answeredIntents: answeredIntentsForIndicator,
      onStepClick: handleResultsStepClick,
      isCollapsed: effectiveCollapsed,
      onCollapseToggle: handleCollapseToggle,
      isTruncated: resultsTruncated,
      onTruncatedToggle: handleTruncatedToggle,
      onProductClick: (name, sku, url) => {
        var _a2;
        (_a2 = config.analyticsAdapter) == null ? void 0 : _a2.track("product_rec_product_click", {
          product_name: name,
          product_sku: sku,
          product_url: url,
          timestamp: (/* @__PURE__ */ new Date()).toISOString()
        });
      },
      onStartOver: () => {
        var _a2;
        (_a2 = config.analyticsAdapter) == null ? void 0 : _a2.track("product_rec_start_over", {
          timestamp: (/* @__PURE__ */ new Date()).toISOString()
        });
      },
      onFeedbackSubmit: handleFeedbackSubmit
    }
  ));
}
const log$1 = createScopedLogger("BCProductFitContainer");
function BCProductFitContainer({
  productSku
}) {
  const { config, consentService } = useOmniguideContext();
  const featureStatus = useFeatureStatus(config.websiteId);
  const { callbacks, consent } = config;
  const FeedbackWidgetComponent = useFeedbackWidget();
  const { trackScrollForMore, trackScrollStarted } = useAnalyticsTracking({ websiteId: config.websiteId });
  const [suggestedQuestions, setSuggestedQuestions] = useState([]);
  const [notFitMode, setNotFitMode] = useState(false);
  const [questionnaireCollapsed, setQuestionnaireCollapsed] = useState(false);
  const [chatCollapsed, setChatCollapsed] = useState(true);
  const {
    messages,
    sendMessage,
    isLoading,
    pipelineStatus,
    connectionStatus,
    hasAttemptedConnection,
    reconnectInfo,
    connect,
    sendIntentAnswer,
    sendClarificationAnswer,
    sessionId,
    handleResetChat
  } = useBCSearchChat({ autoConnect: false });
  const connectCalledRef = useRef(false);
  useEffect(() => {
    if (!connectCalledRef.current) {
      connectCalledRef.current = true;
      connect().catch((err) => {
        log$1.error("WebSocket connect failed:", err);
      });
    }
  }, [connect]);
  const { analytics, advertising, websiteConsent, omniguideConsent } = useUserConsent();
  const consentEnabled = analytics && advertising;
  const handleToggleConsent = useCallback(async () => {
    try {
      if (consentService && sessionId && websiteConsent) {
        await consentService.updatePreferences(sessionId, !omniguideConsent);
      }
    } catch (error) {
      log$1.error("Failed to update consent preferences:", error);
    }
  }, [consentService, sessionId, websiteConsent, omniguideConsent]);
  const handleOpenSupport = useCallback(() => {
    var _a;
    (_a = callbacks == null ? void 0 : callbacks.onOpenSupport) == null ? void 0 : _a.call(callbacks);
  }, [callbacks]);
  const privacySettingsProps = sessionId ? {
    sessionId,
    privacyPolicyUrl: (consent == null ? void 0 : consent.privacyPolicyUrl) ?? "/privacy-policy",
    onOpenSupport: handleOpenSupport,
    consentEnabled: (consent == null ? void 0 : consent.enabled) ? consentEnabled : void 0,
    onToggleConsent: (consent == null ? void 0 : consent.enabled) ? handleToggleConsent : void 0,
    consentDisabled: (consent == null ? void 0 : consent.enabled) ? !websiteConsent : void 0
  } : void 0;
  const handleSendMessage = useCallback(
    (content) => {
      const productUrl = window.location.pathname;
      sendMessage(content, { product_url: productUrl, limit_to_entity: 1 });
    },
    [sendMessage]
  );
  const handleIntentAnswer = useCallback(
    (answerText, answerId) => {
      sendIntentAnswer(answerText, String(answerId));
    },
    [sendIntentAnswer]
  );
  const handleCustomIntentAnswer = useCallback(
    (customText) => handleSendMessage(customText),
    [handleSendMessage]
  );
  const handleClarificationAnswer = useCallback(
    (answerText, optionId, paramName) => {
      sendClarificationAnswer(answerText, String(optionId), paramName);
    },
    [sendClarificationAnswer]
  );
  const handleCustomClarificationAnswer = useCallback(
    (customText) => handleSendMessage(customText),
    [handleSendMessage]
  );
  const handleSuggestedQuestionsLoad = useCallback((questions) => {
    setSuggestedQuestions(questions);
  }, []);
  const handleNotFitResult = useCallback((isNotFit) => {
    setNotFitMode(isNotFit);
  }, []);
  const handleQuestionnaireCollapseToggle = useCallback(() => {
    setQuestionnaireCollapsed((prev) => !prev);
  }, []);
  const handleChatCollapseToggle = useCallback(() => {
    setChatCollapsed((prev) => !prev);
  }, []);
  const handleScrollForMoreTapped = useCallback(
    (messageId) => trackScrollForMore({ messageId }),
    [trackScrollForMore]
  );
  const handleScrollStarted = useCallback(
    (messageId) => trackScrollStarted({ messageId }),
    [trackScrollStarted]
  );
  if (!featureStatus || featureStatus.aiDisabled) {
    return null;
  }
  const containerClassName = notFitMode ? "omniguide-pr-assistant omniguide-pr-assistant--stacked" : "omniguide-pr-assistant";
  const questionnairePanelClassName = notFitMode ? "omniguide-pr-assistant__questionnaire omniguide-pr-assistant__questionnaire--full" : "omniguide-pr-assistant__questionnaire";
  const getChatPanelClassName = () => {
    const baseClass = "omniguide-pr-assistant__chat";
    if (notFitMode) {
      return chatCollapsed ? `${baseClass} ${baseClass}--below-collapsed` : `${baseClass} ${baseClass}--below`;
    }
    return baseClass;
  };
  return /* @__PURE__ */ React.createElement("div", { className: containerClassName }, /* @__PURE__ */ React.createElement("div", { className: questionnairePanelClassName }, /* @__PURE__ */ React.createElement(
    BCProductQuestionnaire,
    {
      productSku,
      onSuggestedQuestionsLoad: handleSuggestedQuestionsLoad,
      onNotFitResult: handleNotFitResult,
      isCollapsed: questionnaireCollapsed,
      onCollapseToggle: handleQuestionnaireCollapseToggle
    }
  )), /* @__PURE__ */ React.createElement("div", { className: getChatPanelClassName() }, /* @__PURE__ */ React.createElement(
    SearchChatPanel,
    {
      messages,
      onSendMessage: handleSendMessage,
      isLoading,
      pipelineStatus,
      connectionStatus: hasAttemptedConnection ? connectionStatus : void 0,
      onRetryConnection: connect,
      reconnectInfo,
      onIntentAnswer: handleIntentAnswer,
      onCustomIntentAnswer: handleCustomIntentAnswer,
      onClarificationAnswer: handleClarificationAnswer,
      onCustomClarificationAnswer: handleCustomClarificationAnswer,
      isCollapsed: chatCollapsed,
      onCollapseToggle: handleChatCollapseToggle,
      variant: "category",
      suggestedQuestions,
      onResetChat: handleResetChat,
      FeedbackWidgetComponent,
      privacySettingsProps,
      onScrollForMoreTapped: handleScrollForMoreTapped,
      onScrollStarted: handleScrollStarted
    }
  )));
}
const log = createScopedLogger("BCProductFitIntegration");
const MOUNTED_ATTR = "data-omniguide-mounted";
function adjustContainerHeight(container) {
  requestAnimationFrame(() => {
    const content = container.firstElementChild;
    if (content) {
      const contentHeight = content.offsetHeight;
      container.style.minHeight = `${contentHeight}px`;
      setTimeout(() => {
        container.style.minHeight = "auto";
      }, 300);
    }
  });
}
class BCProductFitIntegration {
  constructor({ config, platformAdapter, storageAdapter, ContainerComponent, components, mount }) {
    this.root = null;
    this.mountedContainer = null;
    this.initialized = false;
    this.omniguideConfig = config;
    this.platformAdapter = platformAdapter;
    this.storageAdapter = storageAdapter;
    this.containerComponent = ContainerComponent;
    this.components = components;
    this.mount = mount;
  }
  init() {
    var _a, _b, _c, _d;
    const container = resolveContainer(this.mount, "product-recommendations-root");
    if (!container) return false;
    (_a = this.unsubscribeFeatureStatus) == null ? void 0 : _a.call(this);
    const watcher = watchFeatureStatus(this.omniguideConfig.websiteId, container);
    this.unsubscribeFeatureStatus = watcher.unsubscribe;
    if (this.root && this.mountedContainer && this.mountedContainer === container && document.body.contains(this.mountedContainer)) {
      this.initialized = true;
      return true;
    }
    if (this.root && this.mountedContainer !== container) {
      try {
        this.root.unmount();
      } catch {
      }
      (_b = this.mountedContainer) == null ? void 0 : _b.removeAttribute(MOUNTED_ATTR);
      this.root = null;
      this.mountedContainer = null;
    }
    const productSku = ((_d = (_c = this.platformAdapter).getProductSku) == null ? void 0 : _d.call(_c)) ?? null;
    if (!productSku) {
      log.warn("ProductFit: No product SKU found");
      return false;
    }
    this.mountComponent(container, productSku);
    this.initialized = true;
    return true;
  }
  mountComponent(container, productSku) {
    if (container.hasAttribute(MOUNTED_ATTR)) return;
    container.setAttribute(MOUNTED_ATTR, "true");
    this.root = createRoot(container);
    this.mountedContainer = container;
    const Container = this.containerComponent ?? BCProductFitContainer;
    const providerProps = {
      config: this.omniguideConfig,
      platformAdapter: this.platformAdapter,
      storageAdapter: this.storageAdapter,
      components: this.components,
      children: /* @__PURE__ */ React.createElement(Container, { productSku })
    };
    this.root.render(/* @__PURE__ */ React.createElement(OmniguideProvider, { ...providerProps }));
    setTimeout(() => adjustContainerHeight(container), 100);
  }
  destroy() {
    var _a, _b;
    (_a = this.unsubscribeFeatureStatus) == null ? void 0 : _a.call(this);
    this.unsubscribeFeatureStatus = void 0;
    if (this.root) {
      this.root.unmount();
      (_b = this.mountedContainer) == null ? void 0 : _b.removeAttribute(MOUNTED_ATTR);
      this.mountedContainer = null;
      this.root = null;
    }
  }
}
export {
  BCProductFitIntegration,
  m as buildConfig,
  o as buildPlatformAdapter
};
//# sourceMappingURL=omniguide-product-fit-DCKAv7__.js.map
