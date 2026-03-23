import { B as BaseWebSocket, p as getWebSocketBaseUrl, C as DiscoveryStarRating, R as ReviewInsightsToggle, q as parseMarkdownToHtml, u as useComponent, D as DiscoveryFeedbackWidget, F as FLOW_STATES, r as logger, v as normalizeQuestions, d as useOmniguideContext, c as createScopedLogger, E as hydrateProducts, y as getSessionId, z as AnsweredIntentsStorage, L as LocalStorageAdapter, G as purify, h as useFeedbackWidget, i as useAnalyticsTracking, j as useBCSearchChat, k as useUserConsent, b as SearchChatPanel, O as OmniguideProvider } from "./shared-CSOgbbou.js";
import { m, o } from "./shared-CSOgbbou.js";
import React, { memo, useState, useRef, useEffect, useCallback, useMemo } from "react";
import { createRoot } from "react-dom/client";
import { f as formatPrice, D as DiscoveryStepIndicator, u as useDiscoveryAnswerStorage, a as useStatusMessage, e as fetchCategoryQuestions, Q as QuestionnaireTeaser, c as DiscoveryQuestionnaire, d as useFeatureStatus, r as resolveContainer, w as watchFeatureStatus } from "./shared-a4wrOq16.js";
import { P as ProductTag } from "./shared-0Qq0f3Qf.js";
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
const CheckIcon = () => /* @__PURE__ */ React.createElement(
  "svg",
  {
    className: "omniguide-cr-benefits__icon",
    viewBox: "0 0 20 20",
    fill: "currentColor"
  },
  /* @__PURE__ */ React.createElement(
    "path",
    {
      fillRule: "evenodd",
      d: "M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z",
      clipRule: "evenodd"
    }
  )
);
const BenefitsList = memo(function BenefitsList2({
  benefits = [],
  maxItems = 4,
  showTitle = true,
  classPrefix = "omniguide-cr"
}) {
  if (!benefits || benefits.length === 0) {
    return null;
  }
  const displayedBenefits = benefits.slice(0, maxItems);
  return /* @__PURE__ */ React.createElement("div", null, showTitle && /* @__PURE__ */ React.createElement("h4", { className: `${classPrefix}-benefits__title` }, "BENEFITS"), /* @__PURE__ */ React.createElement("ul", { className: `${classPrefix}-benefits__list` }, displayedBenefits.map((benefit, index) => /* @__PURE__ */ React.createElement("li", { key: index, className: `${classPrefix}-benefits__item` }, /* @__PURE__ */ React.createElement(CheckIcon, null), /* @__PURE__ */ React.createElement("span", null, benefit)))));
});
function UseCaseRatings({ useCases = [], maxItems = 4 }) {
  if (!useCases || useCases.length === 0) {
    return null;
  }
  const sortedUseCases = [...useCases].sort((a, b) => a.name.localeCompare(b.name));
  const displayedUseCases = sortedUseCases.slice(0, maxItems);
  const scoreToStars = (score) => score / 10 * 5;
  return /* @__PURE__ */ React.createElement("div", { className: "omniguide-cr-use-cases__container" }, displayedUseCases.map((useCase, index) => /* @__PURE__ */ React.createElement("div", { key: index, className: "omniguide-cr-use-cases__row" }, /* @__PURE__ */ React.createElement("span", { className: "omniguide-cr-use-cases__label" }, useCase.name), /* @__PURE__ */ React.createElement(DiscoveryStarRating, { rating: scoreToStars(useCase.score) }))));
}
const CategoryProductCard = memo(function CategoryProductCard2({ product, index, fallbackImage = "", showProductTags = true }) {
  if (!product) return null;
  const {
    name,
    display_name,
    product_line,
    price,
    retail_price,
    url,
    path,
    image_url,
    imageUrl,
    defaultImage,
    tag,
    review_insights,
    brand,
    benefits = [],
    use_cases = [],
    why
  } = product;
  const displayName = name ?? display_name;
  const rawBrand = product_line ?? (brand == null ? void 0 : brand.name) ?? "";
  const brandName = rawBrand;
  const cleanDisplayName = rawBrand && displayName && displayName.toLowerCase().startsWith(rawBrand.toLowerCase() + " ") ? displayName.slice(rawBrand.length).trimStart() || displayName : displayName;
  const resolvedImageUrl = image_url ?? imageUrl ?? (defaultImage == null ? void 0 : defaultImage.url) ?? fallbackImage;
  const productUrl = url ?? path;
  const resolvedPrice = typeof price === "object" ? price == null ? void 0 : price.value : price;
  const resolvedRetailPrice = typeof retail_price === "object" ? retail_price == null ? void 0 : retail_price.value : retail_price;
  const averageRating = (review_insights == null ? void 0 : review_insights.average_rating) ?? 0;
  const reviewCount = (review_insights == null ? void 0 : review_insights.review_count) ?? 0;
  const displayTag = showProductTags ? tag ?? { type: index === 0 ? "recommended" : "runner_up" } : null;
  return /* @__PURE__ */ React.createElement("div", { className: "omniguide-cr-card" }, /* @__PURE__ */ React.createElement("div", { className: "omniguide-cr-card__image-section" }, /* @__PURE__ */ React.createElement(
    "img",
    {
      src: resolvedImageUrl,
      alt: cleanDisplayName,
      className: "omniguide-cr-card__image",
      onError: (e) => {
        if (fallbackImage) {
          e.target.src = fallbackImage;
        }
      }
    }
  ), displayTag && /* @__PURE__ */ React.createElement(ProductTag, { tag: displayTag, classPrefix: "omniguide-cr-card__badge" })), /* @__PURE__ */ React.createElement("div", { className: "omniguide-cr-card__content" }, /* @__PURE__ */ React.createElement("div", { className: "omniguide-cr-card__columns-container" }, /* @__PURE__ */ React.createElement("div", { className: "omniguide-cr-card__columns-text" }, /* @__PURE__ */ React.createElement("div", { className: "omniguide-cr-card__brand-row" }, /* @__PURE__ */ React.createElement("p", { className: "omniguide-cr-card__brand" }, brandName), /* @__PURE__ */ React.createElement("h3", { className: "omniguide-cr-card__name" }, cleanDisplayName)), /* @__PURE__ */ React.createElement("div", { className: "omniguide-cr-card__price-group" }, /* @__PURE__ */ React.createElement("span", { className: "omniguide-cr-card__price" }, formatPrice(resolvedPrice)), resolvedRetailPrice && Number(resolvedRetailPrice) > Number(resolvedPrice) && /* @__PURE__ */ React.createElement("span", { className: "omniguide-cr-card__price omniguide-cr-card__price--original" }, formatPrice(resolvedRetailPrice)))), /* @__PURE__ */ React.createElement("div", { className: "omniguide-cr-card__actions" }, /* @__PURE__ */ React.createElement("a", { href: productUrl, className: "omniguide-cr-card__view-btn" }, "View Now", /* @__PURE__ */ React.createElement("svg", { width: "16", height: "16", viewBox: "0 0 16 16", fill: "none" }, /* @__PURE__ */ React.createElement("path", { d: "M6 12L10 8L6 4", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round" }))), averageRating > 0 && /* @__PURE__ */ React.createElement(
    ReviewInsightsToggle,
    {
      rating: averageRating,
      reviewCount,
      summary: review_insights == null ? void 0 : review_insights.summary,
      likes: review_insights == null ? void 0 : review_insights.likes
    }
  )))), /* @__PURE__ */ React.createElement("div", { className: "omniguide-cr-card__divider" }), (benefits.length > 0 || use_cases.length > 0) && /* @__PURE__ */ React.createElement("div", { className: "omniguide-cr-card__benefits-row" }, /* @__PURE__ */ React.createElement("div", { className: "omniguide-cr-card__benefits" }, /* @__PURE__ */ React.createElement(BenefitsList, { benefits, maxItems: 4, showTitle: true })), use_cases.length > 0 && /* @__PURE__ */ React.createElement("div", { className: "omniguide-cr-card__use-cases" }, /* @__PURE__ */ React.createElement(UseCaseRatings, { useCases: use_cases, maxItems: 4 }))), why && /* @__PURE__ */ React.createElement("div", { className: "omniguide-cr-card__why-section" }, /* @__PURE__ */ React.createElement("div", { className: "omniguide-cr-card__why-box" }, /* @__PURE__ */ React.createElement("h4", { className: "omniguide-cr-card__why-title" }, "Why this product would work better for you:"), /* @__PURE__ */ React.createElement(
    "p",
    {
      className: "omniguide-cr-card__why-text",
      dangerouslySetInnerHTML: parseMarkdownToHtml(why)
    }
  ))));
});
const AIIcon = () => /* @__PURE__ */ React.createElement("svg", { viewBox: "0 0 28 28", fill: "none", xmlns: "http://www.w3.org/2000/svg" }, /* @__PURE__ */ React.createElement(
  "path",
  {
    d: "M13.9943 4.66672C10.9648 4.66676 8.14689 6.54935 6.98745 9.3482C5.8282 12.1471 6.48937 15.4706 8.63149 17.6128C10.7738 19.7547 14.0974 20.415 16.8961 19.2558C19.6947 18.0961 21.5776 15.2794 21.5776 12.2501H23.911C23.911 15.339 22.4287 18.2426 20.0441 20.0966C19.5461 20.4838 19.5715 21.3164 20.0976 21.6643C21.6232 22.6731 22.8845 24.0495 23.756 25.6667H20.9931C19.3968 23.5417 16.8556 22.1667 13.9931 22.1667C11.1307 22.1668 8.5895 23.5417 6.99315 25.6667H4.23029C5.1006 24.0517 6.36029 22.6774 7.88296 21.6688C8.41097 21.319 8.43322 20.48 7.93081 20.0943C7.59904 19.8397 7.28152 19.5623 6.98176 19.2626C4.17225 16.453 3.31133 12.1258 4.83185 8.45497C6.35247 4.78426 10.0211 2.33343 13.9943 2.33339V4.66672Z",
    fill: "currentColor"
  }
), /* @__PURE__ */ React.createElement(
  "path",
  {
    d: "M16.682 2.38352C17.2133 2.31647 17.7729 2.31653 18.3043 2.38352C18.3906 6.95628 19.2874 7.85246 23.8597 7.93886C23.9268 8.47037 23.9267 9.02971 23.8597 9.56125C19.2876 9.64764 18.3907 10.5445 18.3043 15.1166C17.7728 15.1836 17.2134 15.1837 16.682 15.1166C16.5956 10.5443 15.6994 9.64755 11.1266 9.56125C11.0596 9.02976 11.0595 8.47031 11.1266 7.93886C15.6996 7.85255 16.5956 6.95652 16.682 2.38352Z",
    fill: "currentColor"
  }
));
const RefreshIcon = () => /* @__PURE__ */ React.createElement("svg", { width: "16", height: "17", viewBox: "0 0 16 17", fill: "none" }, /* @__PURE__ */ React.createElement(
  "path",
  {
    d: "M3.19036 4.95812L5.3033 7.07108L4.12479 8.24958L0 4.12479L4.12479 0L5.3033 1.17852L3.19036 3.29146H9.16667C12.8486 3.29146 15.8333 6.27623 15.8333 9.95817C15.8333 13.64 12.8486 16.6248 9.16667 16.6248H1.66667V14.9582H9.16667C11.9281 14.9582 14.1667 12.7196 14.1667 9.95817C14.1667 7.1967 11.9281 4.95812 9.16667 4.95812H3.19036Z",
    fill: "currentColor"
  }
));
const SparkleIcon = () => /* @__PURE__ */ React.createElement("svg", { width: "12", height: "12", viewBox: "0 0 16 16", fill: "currentColor" }, /* @__PURE__ */ React.createElement("path", { d: "M8 0L9.09 5.455L14 6.545L9.09 7.636L8 13.091L6.91 7.636L2 6.545L6.91 5.455L8 0Z" }));
const InfoIcon = () => /* @__PURE__ */ React.createElement("svg", { width: "18", height: "18", viewBox: "0 0 20 20", fill: "currentColor" }, /* @__PURE__ */ React.createElement("path", { fillRule: "evenodd", d: "M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z", clipRule: "evenodd" }));
const WarningIcon = () => /* @__PURE__ */ React.createElement("svg", { width: "18", height: "18", viewBox: "0 0 20 20", fill: "currentColor" }, /* @__PURE__ */ React.createElement("path", { fillRule: "evenodd", d: "M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z", clipRule: "evenodd" }));
const CollapseIcon = () => /* @__PURE__ */ React.createElement("svg", { width: "20", height: "20", viewBox: "0 0 20 20", fill: "currentColor" }, /* @__PURE__ */ React.createElement("path", { fillRule: "evenodd", d: "M14.707 12.707a1 1 0 01-1.414 0L10 9.414l-3.293 3.293a1 1 0 01-1.414-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 010 1.414z", clipRule: "evenodd" }));
const ExpandIcon = () => /* @__PURE__ */ React.createElement("svg", { width: "20", height: "20", viewBox: "0 0 20 20", fill: "currentColor" }, /* @__PURE__ */ React.createElement("path", { fillRule: "evenodd", d: "M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z", clipRule: "evenodd" }));
const Spinner = () => /* @__PURE__ */ React.createElement("svg", { className: "omniguide-cr-spinner", viewBox: "0 0 50 50" }, /* @__PURE__ */ React.createElement(
  "circle",
  {
    className: "omniguide-cr-spinner__path",
    cx: "25",
    cy: "25",
    r: "20",
    fill: "none",
    strokeWidth: "4"
  }
));
const LoadingState = ({ statusMessage }) => /* @__PURE__ */ React.createElement("div", { className: "omniguide-cr-state omniguide-cr-state--loading" }, /* @__PURE__ */ React.createElement("div", { className: "omniguide-cr-state__spinner" }, /* @__PURE__ */ React.createElement(Spinner, null)), /* @__PURE__ */ React.createElement("p", { className: "omniguide-cr-state__text" }, statusMessage || "Finding your perfect products..."));
const ErrorState = ({ error, onRetry }) => {
  const connectionIssue = (error == null ? void 0 : error.code) === "WEBSOCKET_ERROR";
  const title = connectionIssue ? "Unable to connect" : "Something went wrong";
  const text = connectionIssue ? "The service is currently unavailable. Please try again in a moment." : "We encountered an error while processing your request. Please try again.";
  return /* @__PURE__ */ React.createElement("div", { className: "omniguide-cr-state omniguide-cr-state--error" }, /* @__PURE__ */ React.createElement("div", { className: "omniguide-cr-state__icon-wrapper omniguide-cr-state__icon-wrapper--error" }, /* @__PURE__ */ React.createElement(WarningIcon, null)), /* @__PURE__ */ React.createElement("h3", { className: "omniguide-cr-state__title" }, title), /* @__PURE__ */ React.createElement("p", { className: "omniguide-cr-state__text" }, text), /* @__PURE__ */ React.createElement(
    "button",
    {
      type: "button",
      className: "omniguide-cr-state__retry-btn",
      onClick: onRetry
    },
    /* @__PURE__ */ React.createElement(RefreshIcon, null),
    /* @__PURE__ */ React.createElement("span", null, "Try Again")
  ));
};
const FallbackNotice = ({ fallbackInfo }) => {
  if (!(fallbackInfo == null ? void 0 : fallbackInfo.used) || !(fallbackInfo == null ? void 0 : fallbackInfo.explanation)) {
    return null;
  }
  return /* @__PURE__ */ React.createElement("div", { className: "omniguide-cr-results__fallback-notice" }, /* @__PURE__ */ React.createElement("div", { className: "omniguide-cr-results__fallback-icon" }, /* @__PURE__ */ React.createElement(InfoIcon, null), /* @__PURE__ */ React.createElement("div", null, "I need your attention...")), /* @__PURE__ */ React.createElement("p", { className: "omniguide-cr-results__fallback-text" }, fallbackInfo.explanation));
};
const NoResultsState = ({ onBack }) => /* @__PURE__ */ React.createElement("div", { className: "omniguide-cr-state omniguide-cr-state--no-results" }, /* @__PURE__ */ React.createElement("div", { className: "omniguide-cr-state__icon-wrapper omniguide-cr-state__icon-wrapper--info" }, /* @__PURE__ */ React.createElement(InfoIcon, null)), /* @__PURE__ */ React.createElement("h3", { className: "omniguide-cr-state__title" }, "No matching products found"), /* @__PURE__ */ React.createElement("p", { className: "omniguide-cr-state__text" }, "We couldn't find products that match your specific requirements. Try adjusting your selections to broaden the search."), /* @__PURE__ */ React.createElement(
  "button",
  {
    type: "button",
    className: "omniguide-cr-state__retry-btn",
    onClick: onBack
  },
  /* @__PURE__ */ React.createElement(RefreshIcon, null),
  /* @__PURE__ */ React.createElement("span", null, "Try Different Answers")
));
function CategoryResultsPanel({
  recommendations = [],
  isLoading,
  error,
  statusMessage,
  fallbackInfo,
  onBack,
  questions = [],
  answeredIntents = {},
  onStepClick,
  onCollapse,
  isCollapsed = false,
  isTruncated = false,
  onTruncatedToggle,
  fallbackImage,
  onStartOver,
  onFeedbackSubmit,
  showProductTags
}) {
  const CategoryProductCard$1 = useComponent("CategoryProductCard", CategoryProductCard);
  if (isLoading) {
    return /* @__PURE__ */ React.createElement("div", { className: "omniguide-cr-results" }, /* @__PURE__ */ React.createElement(LoadingState, { statusMessage }));
  }
  if (error) {
    return /* @__PURE__ */ React.createElement("div", { className: "omniguide-cr-results" }, /* @__PURE__ */ React.createElement(ErrorState, { error, onRetry: onBack }));
  }
  if (recommendations.length === 0) {
    return /* @__PURE__ */ React.createElement("div", { className: "omniguide-cr-results" }, /* @__PURE__ */ React.createElement(NoResultsState, { onBack }));
  }
  if (isCollapsed) {
    const handleKeyDown = (e) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        onCollapse == null ? void 0 : onCollapse();
      }
    };
    return /* @__PURE__ */ React.createElement("div", { className: "omniguide-cr-results omniguide-cr-results--collapsed" }, /* @__PURE__ */ React.createElement("div", { className: "omniguide-cr-results__header-row" }, /* @__PURE__ */ React.createElement("div", { className: "omniguide-cr-results__header-content" }, /* @__PURE__ */ React.createElement("div", { className: "omniguide-cr-results__title-row" }, /* @__PURE__ */ React.createElement("div", { className: "omniguide-cr-results__icon" }, /* @__PURE__ */ React.createElement(AIIcon, null)), /* @__PURE__ */ React.createElement("div", { className: "omniguide-cr-results__title-content" }, /* @__PURE__ */ React.createElement("h2", { className: "omniguide-cr-results__title" }, "We have some advice."), /* @__PURE__ */ React.createElement(
      "button",
      {
        type: "button",
        onClick: onCollapse,
        onKeyDown: handleKeyDown,
        className: "omniguide-cr-results__expand-link",
        "aria-expanded": "false",
        "aria-label": "See our recommendations"
      },
      "See our recommendations"
    ))), questions.length > 0 && /* @__PURE__ */ React.createElement("div", { className: "omniguide-cr-results__header-pills" }, /* @__PURE__ */ React.createElement(
      DiscoveryStepIndicator,
      {
        currentStep: -1,
        totalSteps: questions.length,
        answeredIntents,
        questions,
        onStepClick
      }
    ))), onCollapse && /* @__PURE__ */ React.createElement(
      "button",
      {
        type: "button",
        className: "omniguide-cr-results__collapse-btn",
        "data-collapsed": true,
        onClick: onCollapse,
        onKeyDown: handleKeyDown,
        "aria-expanded": "false",
        "aria-label": "Expand recommendations"
      },
      /* @__PURE__ */ React.createElement(CollapseIcon, null)
    )));
  }
  if (isTruncated) {
    const firstProduct = recommendations[0];
    return /* @__PURE__ */ React.createElement("div", { className: "omniguide-cr-results omniguide-cr-results--truncated" }, /* @__PURE__ */ React.createElement("div", { className: "omniguide-cr-results__header" }, /* @__PURE__ */ React.createElement("div", { className: "omniguide-cr-results__header-row" }, /* @__PURE__ */ React.createElement("div", { className: "omniguide-cr-results__header-content" }, /* @__PURE__ */ React.createElement("div", { className: "omniguide-cr-results__title-row" }, /* @__PURE__ */ React.createElement("div", { className: "omniguide-cr-results__icon" }, /* @__PURE__ */ React.createElement(AIIcon, null)), /* @__PURE__ */ React.createElement("h2", { className: "omniguide-cr-results__title" }, "We have some advice.")), questions.length > 0 && /* @__PURE__ */ React.createElement("div", { className: "omniguide-cr-results__header-pills" }, /* @__PURE__ */ React.createElement(
      DiscoveryStepIndicator,
      {
        currentStep: -1,
        totalSteps: questions.length,
        answeredIntents,
        questions,
        onStepClick
      }
    )))), /* @__PURE__ */ React.createElement("p", { className: "omniguide-cr-results__subtitle" }, "We've distilled our years of customer advice into giving you spot-on advice.")), /* @__PURE__ */ React.createElement("div", { className: "omniguide-cr-results__truncated-content" }, /* @__PURE__ */ React.createElement("div", { className: "omniguide-cr-results__truncated-preview" }, /* @__PURE__ */ React.createElement("div", { className: "omniguide-cr-card-wrapper" }, /* @__PURE__ */ React.createElement(
      CategoryProductCard$1,
      {
        product: firstProduct,
        index: 0,
        fallbackImage,
        showProductTags
      }
    ))), /* @__PURE__ */ React.createElement("div", { className: "omniguide-cr-results__truncated-fade" })), /* @__PURE__ */ React.createElement("div", { className: "omniguide-cr-results__show-more-container" }, /* @__PURE__ */ React.createElement(
      "button",
      {
        type: "button",
        className: "omniguide-cr-results__show-more-btn",
        onClick: onTruncatedToggle
      },
      /* @__PURE__ */ React.createElement("span", null, "Show More"),
      /* @__PURE__ */ React.createElement(ExpandIcon, null)
    )));
  }
  const gridClassName = recommendations.length === 1 ? "omniguide-cr-results__grid omniguide-cr-results__grid--single" : "omniguide-cr-results__grid";
  return /* @__PURE__ */ React.createElement("div", { className: "omniguide-cr-results" }, /* @__PURE__ */ React.createElement("div", { className: "omniguide-cr-results__header" }, /* @__PURE__ */ React.createElement("div", { className: "omniguide-cr-results__header-row" }, /* @__PURE__ */ React.createElement("div", { className: "omniguide-cr-results__header-content" }, /* @__PURE__ */ React.createElement("div", { className: "omniguide-cr-results__title-row" }, /* @__PURE__ */ React.createElement("div", { className: "omniguide-cr-results__icon" }, /* @__PURE__ */ React.createElement(AIIcon, null)), /* @__PURE__ */ React.createElement("h2", { className: "omniguide-cr-results__title" }, "We have some advice.")), questions.length > 0 && /* @__PURE__ */ React.createElement("div", { className: "omniguide-cr-results__header-pills" }, /* @__PURE__ */ React.createElement(
    DiscoveryStepIndicator,
    {
      currentStep: -1,
      totalSteps: questions.length,
      answeredIntents,
      questions,
      onStepClick
    }
  ))), onCollapse && /* @__PURE__ */ React.createElement(
    "button",
    {
      type: "button",
      className: "omniguide-cr-results__collapse-btn",
      "data-collapsed": false,
      onClick: onCollapse,
      "aria-label": "Collapse recommendations"
    },
    /* @__PURE__ */ React.createElement(CollapseIcon, null)
  )), /* @__PURE__ */ React.createElement("p", { className: "omniguide-cr-results__subtitle" }, "We've distilled our years of customer advice into giving you spot-on advice. Based on your hunting preferences and interests, we've selected these products that perfectly match your needs.")), /* @__PURE__ */ React.createElement(FallbackNotice, { fallbackInfo }), /* @__PURE__ */ React.createElement("div", { className: gridClassName }, recommendations.map((product, index) => /* @__PURE__ */ React.createElement("div", { key: product.id ?? index, className: "omniguide-cr-card-wrapper" }, /* @__PURE__ */ React.createElement(
    CategoryProductCard$1,
    {
      product,
      index,
      fallbackImage,
      showProductTags
    }
  ), /* @__PURE__ */ React.createElement("div", { className: "omniguide-cr-card__feedback" }, /* @__PURE__ */ React.createElement(
    DiscoveryFeedbackWidget,
    {
      entityId: product.sku ?? "",
      entityType: "category_recommendation",
      context: {
        product_name: product.name ?? product.display_name,
        recommendation_position: index === 0 ? "top_pick" : "runner_up"
      },
      onSubmit: onFeedbackSubmit
    }
  ))))), /* @__PURE__ */ React.createElement("div", { className: "omniguide-cr-results__footer" }, /* @__PURE__ */ React.createElement("span", { className: "omniguide-cr-results__powered-by" }, /* @__PURE__ */ React.createElement(SparkleIcon, null), "Powered by AI"), /* @__PURE__ */ React.createElement(
    "button",
    {
      type: "button",
      className: "omniguide-cr-results__start-over",
      onClick: () => {
        onStartOver == null ? void 0 : onStartOver();
        onBack == null ? void 0 : onBack();
      }
    },
    /* @__PURE__ */ React.createElement(RefreshIcon, null),
    /* @__PURE__ */ React.createElement("span", null, "Start Over")
  )));
}
function CategoryQuestionSkeleton() {
  return /* @__PURE__ */ React.createElement("div", { className: "omniguide-cr-skeleton" }, /* @__PURE__ */ React.createElement("div", { className: "omniguide-cr-skeleton__header-row" }, /* @__PURE__ */ React.createElement("div", { className: "omniguide-cr-skeleton__icon" }), /* @__PURE__ */ React.createElement("div", { className: "omniguide-cr-skeleton__title" })), /* @__PURE__ */ React.createElement("div", { className: "omniguide-cr-skeleton__subtitle" }), /* @__PURE__ */ React.createElement("div", { className: "omniguide-cr-skeleton__question" }), /* @__PURE__ */ React.createElement("div", { className: "omniguide-cr-skeleton__choices" }, [1, 2, 3, 4].map((i) => /* @__PURE__ */ React.createElement(
    "div",
    {
      key: i,
      className: "omniguide-cr-skeleton__pill"
    }
  ))));
}
const CATEGORY_STATUS_MESSAGES = {
  analyzing_preferences: [
    "Analyzing your preferences...",
    "Understanding what you're looking for...",
    "Reviewing your selections...",
    "Almost there, processing your choices..."
  ],
  finding_products: [
    "Finding matching products...",
    "Searching for the perfect match...",
    "Discovering great options for you...",
    "This is taking shape, hang tight..."
  ],
  expanding_search: [
    "Expanding search for better matches...",
    "Looking for even more options...",
    "Widening the search to find the best fit...",
    "Just a moment, we're being thorough..."
  ],
  generating_insights: [
    "Generating product insights...",
    "Analyzing product details...",
    "Building your personalized results...",
    "Almost ready, finalizing details..."
  ],
  finalizing: [
    "Finalizing recommendations...",
    "Putting the finishing touches...",
    "Getting everything ready for you...",
    "Just a few more seconds..."
  ],
  processing: [
    "Processing...",
    "Working on it...",
    "Almost there...",
    "Just a moment..."
  ]
};
function useCategoryWebSocket({
  hydration,
  wsFactory,
  storageAdapter,
  productTypeId = null
}) {
  const [connectionStatus, setConnectionStatus] = useState("disconnected");
  const [flowState, setFlowState] = useState(FLOW_STATES.IDLE);
  const [currentQuestion, setCurrentQuestion] = useState(null);
  const [questionNumber, setQuestionNumber] = useState(0);
  const [isLastQuestion, setIsLastQuestion] = useState(false);
  const [answeredQuestions, setAnsweredQuestions] = useState([]);
  const [recommendations, setRecommendations] = useState([]);
  const [productCards, setProductCards] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [processingStatus, setProcessingStatus] = useState(null);
  const [fallbackInfo, setFallbackInfo] = useState({
    used: false,
    reason: null,
    scope: null,
    explanation: null
  });
  const [otherValidationError, setOtherValidationError] = useState(null);
  const [clarificationPrompt, setClarificationPrompt] = useState(null);
  const [isOtherProcessing, setIsOtherProcessing] = useState(false);
  const wsRef = useRef(null);
  const requestInProgressRef = useRef(false);
  const categoryUrlRef = useRef(null);
  const questionNumberRef = useRef(questionNumber);
  const { saveAnswer, restoreFromStorage, hasStoredSession, getStoredAnswerCount, clearStorage } = useDiscoveryAnswerStorage(storageAdapter, productTypeId);
  const { getStatusMessage } = useStatusMessage(processingStatus, CATEGORY_STATUS_MESSAGES);
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
  const createMessageHandler = useCallback((msg) => {
    switch (msg["type"]) {
      case "question": {
        const rawQuestion = msg["question"];
        const normalized = normalizeQuestions({ questions: [rawQuestion] });
        setCurrentQuestion(normalized[0] ?? rawQuestion);
        setQuestionNumber(msg["question_number"] || questionNumberRef.current + 1);
        setIsLastQuestion(!!msg["is_last"]);
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
        } else if (status === "processing" || status === "analyzing_preferences") {
          setIsLoading(true);
        }
        break;
      }
      case "recommendations": {
        setFallbackInfo({
          used: !!msg["fallback_used"],
          reason: msg["fallback_reason"] || null,
          scope: msg["fallback_scope"] || null,
          explanation: msg["fallback_explanation"] || null
        });
        const rawProducts = msg["products"] || [];
        setRecommendations(rawProducts);
        setProductCards([]);
        disconnectWebSocket();
        if (rawProducts.length > 0) {
          setProcessingStatus("finalizing");
          hydration.hydrateProducts(rawProducts).then((hydratedProducts) => {
            setRecommendations(hydratedProducts);
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
        } else {
          setIsLoading(false);
          setProcessingStatus(null);
          setError(null);
          setFlowState(FLOW_STATES.COMPLETE);
          requestInProgressRef.current = false;
        }
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
        logger.error("Category WebSocket error:", rawError);
        setError(new Error("We encountered an error while processing your request. Please try again."));
        setIsLoading(false);
        setProcessingStatus(null);
        setFlowState(FLOW_STATES.ERROR);
        requestInProgressRef.current = false;
        disconnectWebSocket();
        break;
      }
    }
  }, [disconnectWebSocket, hydration]);
  const connectWebSocket = useCallback(async () => {
    disconnectWebSocket();
    const ws = wsFactory.create({
      onMessage: createMessageHandler,
      onStatusChange: setConnectionStatus,
      onError: (err) => {
        logger.error("Category WebSocket connection error:", err.message);
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
    setRecommendations([]);
    setProductCards([]);
    setProcessingStatus("analyzing_preferences");
    setFallbackInfo({ used: false, reason: null, scope: null, explanation: null });
    setFlowState(FLOW_STATES.CONNECTING);
  }, []);
  const startConversation = useCallback(async (categoryUrl, firstAnswer = null, firstQuestion = null) => {
    if (requestInProgressRef.current) return;
    requestInProgressRef.current = true;
    categoryUrlRef.current = categoryUrl;
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
      ws.sendStartMessage(categoryUrl, firstAnswer);
    } catch (err) {
      logger.error("Category WebSocket startConversation failed:", err instanceof Error ? err.message : String(err));
      setError(err instanceof Error ? err : new Error(String(err)));
      setIsLoading(false);
      setProcessingStatus(null);
      setFlowState(FLOW_STATES.ERROR);
      requestInProgressRef.current = false;
      disconnectWebSocket();
    }
  }, [connectWebSocket, disconnectWebSocket, resetForNewRequest, saveAnswer]);
  const resumeSession = useCallback(async (categoryUrl) => {
    const restoredAnswers = restoreFromStorage();
    if (restoredAnswers.length === 0) return false;
    if (requestInProgressRef.current) return false;
    requestInProgressRef.current = true;
    categoryUrlRef.current = categoryUrl;
    setAnsweredQuestions(restoredAnswers);
    setQuestionNumber(restoredAnswers.length);
    resetForNewRequest();
    try {
      const ws = await connectWebSocket();
      const answeredIntents = storageAdapter.getForApi(productTypeId);
      ws.sendResumeMessage(categoryUrl, answeredIntents);
      return true;
    } catch (err) {
      logger.error("Category WebSocket resumeSession failed:", err instanceof Error ? err.message : String(err));
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
    setIsLastQuestion(false);
    setAnsweredQuestions([]);
    setRecommendations([]);
    setProductCards([]);
    setIsLoading(false);
    setError(null);
    setProcessingStatus(null);
    setFallbackInfo({ used: false, reason: null, scope: null, explanation: null });
    setOtherValidationError(null);
    setClarificationPrompt(null);
    setIsOtherProcessing(false);
    requestInProgressRef.current = false;
  }, [disconnectWebSocket, clearStorage]);
  const getRecommendations = useCallback(async (categoryUrl, answeredIntents, options = {}) => {
    if (requestInProgressRef.current) return;
    requestInProgressRef.current = true;
    categoryUrlRef.current = categoryUrl;
    setIsLoading(true);
    setError(null);
    setRecommendations([]);
    setProductCards([]);
    setProcessingStatus("analyzing_preferences");
    setFallbackInfo({ used: false, reason: null, scope: null, explanation: null });
    disconnectWebSocket();
    try {
      const ws = wsFactory.create({
        onMessage: createMessageHandler,
        onStatusChange: setConnectionStatus,
        onError: (err) => {
          logger.error("Category WebSocket connection error (getRecommendations):", err.message);
          setError(err);
          setIsLoading(false);
          setProcessingStatus(null);
          requestInProgressRef.current = false;
          disconnectWebSocket();
        }
      });
      wsRef.current = ws;
      await ws.connect();
      if (ws.sendRecommendationRequest) {
        ws.sendRecommendationRequest(categoryUrl, answeredIntents, options);
      }
    } catch (err) {
      logger.error("Category WebSocket getRecommendations failed:", err instanceof Error ? err.message : String(err));
      setError(err instanceof Error ? err : new Error(String(err)));
      setIsLoading(false);
      setProcessingStatus(null);
      requestInProgressRef.current = false;
      disconnectWebSocket();
    }
  }, [wsFactory, createMessageHandler, disconnectWebSocket]);
  const disconnect = useCallback(() => {
    disconnectWebSocket();
  }, [disconnectWebSocket]);
  return {
    connectionStatus,
    flowState,
    currentQuestion,
    questionNumber,
    isLastQuestion,
    answeredQuestions,
    recommendations,
    productCards,
    isLoading,
    error,
    processingStatus,
    fallbackInfo,
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
    getRecommendations,
    disconnect,
    hasStoredSession,
    getStoredAnswerCount
  };
}
const log$2 = createScopedLogger("useBCCategoryQuestions");
function useBCCategoryQuestions(categoryUrl) {
  const { config } = useOmniguideContext();
  const [questions, setQuestions] = useState([]);
  const [categoryData, setCategoryData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [retryCount, setRetryCount] = useState(0);
  const retry = useCallback(() => setRetryCount((c) => c + 1), []);
  useEffect(() => {
    const loadQuestions = async () => {
      setLoading(true);
      setError(null);
      try {
        const questionConfig = {
          apiBaseUrl: config.apiBaseUrl,
          websiteId: config.websiteId
        };
        const url = categoryUrl ?? window.location.pathname;
        const data = await fetchCategoryQuestions(questionConfig, url);
        setCategoryData({
          categoryId: data["category_id"],
          categoryUrl: data["category_url"] || url,
          categoryName: data["category_name"],
          productTypeId: data["product_type_id"],
          productTypeName: data["product_type_name"],
          productCount: data["product_count"],
          suggestedQuestions: data["suggested_questions"] || [],
          shortSeoSummary: data["short_seo_summary"] || ""
        });
        setQuestions(data.questions);
      } catch (err) {
        log$2.error("Error loading category questions:", err);
        setError(err instanceof Error ? err : new Error(String(err)));
        setQuestions([]);
      } finally {
        setLoading(false);
      }
    };
    loadQuestions();
  }, [categoryUrl, config.apiBaseUrl, config.websiteId, retryCount]);
  return {
    questions,
    categoryData,
    loading,
    error,
    hasQuestions: questions.length > 0,
    retry
  };
}
const log$1 = createScopedLogger("useBCCategoryWebSocket");
function useBCCategoryWebSocket({
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
    hydrateProducts: async (products) => {
      if (!products || products.length === 0) return [];
      try {
        return await hydrateProducts(hydrationConfig, products);
      } catch (error) {
        log$1.warn("Failed to hydrate products, using original data:", error);
        return products;
      }
    }
  }), [hydrationConfig]);
  const wsFactory = useMemo(() => ({
    create: (wsConfig) => {
      const ws = new CategoryWebSocket({
        apiBaseUrl: config.apiBaseUrl,
        websiteCode: config.websiteId,
        sessionId: getSessionId(config.websiteId) ?? void 0,
        ...wsConfig
      });
      return ws;
    }
  }), [config.apiBaseUrl, config.websiteId]);
  const storageKey = ((_a = config.storageKeys) == null ? void 0 : _a.answeredIntents) ?? "omniguideAnsweredIntents";
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
  return useCategoryWebSocket({
    hydration,
    wsFactory,
    storageAdapter,
    productTypeId
  });
}
function formatSeoSummary(html) {
  if (!html) return "";
  if (/<[uo]l[\s>]/i.test(html)) return html;
  const lines = html.split(/\n/).map((l) => l.trim()).filter(Boolean);
  const parts = [];
  let bulletBuffer = [];
  const flushBullets = () => {
    if (bulletBuffer.length === 0) return;
    parts.push("<ul>" + bulletBuffer.map((b) => `<li>${b}</li>`).join("") + "</ul>");
    bulletBuffer = [];
  };
  for (const line of lines) {
    const bulletMatch = line.match(/^(?:[•·–—]|-(?=\s))\s+(.*)/);
    if (bulletMatch) {
      bulletBuffer.push(bulletMatch[1] ?? "");
    } else {
      flushBullets();
      const inner = line.replace(/^<p>([\s\S]*?)<\/p>$/i, "$1");
      parts.push(`<p>${inner}</p>`);
    }
  }
  flushBullets();
  return parts.join("");
}
const MOBILE_BREAKPOINT = 768;
const isMobileViewport = () => typeof window !== "undefined" && window.innerWidth <= MOBILE_BREAKPOINT;
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
function loadResultsCollapsed(storageKey) {
  try {
    return sessionStorage.getItem(storageKey) === "true";
  } catch {
    return false;
  }
}
function saveResultsCollapsed(storageKey, collapsed) {
  try {
    sessionStorage.setItem(storageKey, collapsed ? "true" : "false");
  } catch {
  }
}
const QuestionsErrorState = ({ onRetry }) => /* @__PURE__ */ React.createElement("div", { className: "omniguide-cr-state omniguide-cr-state--error" }, /* @__PURE__ */ React.createElement("h3", { className: "omniguide-cr-state__title" }, "Unable to connect"), /* @__PURE__ */ React.createElement("p", { className: "omniguide-cr-state__text" }, "The service is currently unavailable. Please try again in a moment."), /* @__PURE__ */ React.createElement(
  "button",
  {
    type: "button",
    className: "omniguide-cr-state__retry-btn",
    onClick: onRetry
  },
  /* @__PURE__ */ React.createElement("span", null, "Try Again")
));
function BCCategoryRecommendations({
  onShowResults,
  onSuggestedQuestionsLoad
}) {
  var _a, _b, _c, _d, _e, _f;
  const DiscoveryQuestionnaire$1 = useComponent("DiscoveryQuestionnaire", DiscoveryQuestionnaire);
  const CategoryResultsPanel$1 = useComponent("CategoryResultsPanel", CategoryResultsPanel);
  const { config, feedbackApi } = useOmniguideContext();
  const isConversational = ((_a = config.features) == null ? void 0 : _a.conversationalCategoryGuide) ?? false;
  const teaserEnabled = ((_c = (_b = config.features) == null ? void 0 : _b.questionnaireTeaser) == null ? void 0 : _c.categoryGuide) ?? false;
  const resultsCollapsedKey = ((_d = config.storageKeys) == null ? void 0 : _d.resultsCollapsed) ?? "omniguideResultsCollapsed";
  const fallbackImage = ((_e = config.fallbackImages) == null ? void 0 : _e.product) ?? "";
  const showProductTags = ((_f = config.features) == null ? void 0 : _f.productTags) !== false;
  const containerRef = useRef(null);
  const shouldScrollToTopRef = useRef(false);
  const configCategoryUrl = config.categoryUrl;
  const { questions: initialQuestions, categoryData, loading: questionsLoading, hasQuestions, error: questionsError, retry: retryQuestions } = useBCCategoryQuestions(configCategoryUrl);
  const {
    flowState,
    currentQuestion: wsQuestion,
    questionNumber,
    answeredQuestions,
    recommendations,
    isLoading: recommendationsLoading,
    error: recommendationsError,
    processingStatus,
    fallbackInfo,
    getStatusMessage,
    startConversation,
    resumeSession,
    submitAnswer,
    submitOtherAnswer,
    clearOtherError,
    resetConversation,
    getRecommendations,
    disconnect,
    otherValidationError,
    clarificationPrompt,
    isOtherProcessing,
    hasStoredSession
  } = useBCCategoryWebSocket({ productTypeId: categoryData == null ? void 0 : categoryData.productTypeId });
  const [noQuestions, setNoQuestions] = useState(false);
  const [resultsCollapsed, setResultsCollapsed] = useState(() => loadResultsCollapsed(resultsCollapsedKey));
  const [resultsTruncated, setResultsTruncated] = useState(false);
  const [teaserExpanded, setTeaserExpanded] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [allAnsweredIntents, setAllAnsweredIntents] = useState({});
  const [showResultsTrad, setShowResultsTrad] = useState(false);
  const skipAutoSubmitRef = useRef(false);
  const isAutoSubmitRef = useRef(false);
  const firstQuestion = initialQuestions.length > 0 ? initialQuestions[0] : null;
  const currentQuestionConv = useMemo(() => {
    if (flowState === FLOW_STATES.IDLE || flowState === FLOW_STATES.LOADING_FIRST || flowState === FLOW_STATES.SHOWING_FIRST) {
      return firstQuestion;
    }
    return wsQuestion;
  }, [flowState, firstQuestion, wsQuestion]);
  const showQuestionnaireConv = useMemo(() => {
    if (!hasQuestions) return false;
    const idleOrFirst = flowState === FLOW_STATES.IDLE || flowState === FLOW_STATES.SHOWING_FIRST;
    const questioning = flowState === FLOW_STATES.QUESTIONING && wsQuestion;
    return idleOrFirst && firstQuestion || questioning;
  }, [hasQuestions, flowState, firstQuestion, wsQuestion]);
  const showResultsConv = useMemo(() => {
    return flowState === FLOW_STATES.LOADING_RESULTS || flowState === FLOW_STATES.COMPLETE || flowState === FLOW_STATES.ERROR;
  }, [flowState]);
  const questionsForIndicatorConv = useMemo(
    () => answeredQuestions.map((aq) => aq.question),
    [answeredQuestions]
  );
  const answeredIntentsForIndicatorConv = useMemo(() => {
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
  const answeredIntentsTrad = useMemo(() => {
    if (initialQuestions.length === 0) return allAnsweredIntents;
    const questionIds = initialQuestions.map((q) => String(q["id"]));
    return Object.fromEntries(
      Object.entries(allAnsweredIntents).filter(([id]) => questionIds.includes(id))
    );
  }, [allAnsweredIntents, initialQuestions]);
  const effectiveShowResults = isConversational ? showResultsConv : showResultsTrad;
  const effectiveShowQuestionnaire = isConversational ? showQuestionnaireConv : !questionsLoading && hasQuestions && !showResultsTrad;
  useEffect(() => {
    if (!questionsLoading && !hasQuestions) {
      setNoQuestions(true);
    }
  }, [questionsLoading, hasQuestions]);
  useEffect(() => {
    if (!isConversational) return;
    if (!questionsLoading && flowState === FLOW_STATES.IDLE && hasStoredSession()) {
      if (teaserEnabled && !teaserExpanded) setTeaserExpanded(true);
      const catUrl = (categoryData == null ? void 0 : categoryData.categoryUrl) || configCategoryUrl || window.location.pathname;
      resumeSession(catUrl);
    }
  }, [isConversational, questionsLoading, flowState, hasStoredSession, resumeSession, categoryData]);
  useEffect(() => {
    var _a2;
    if (((_a2 = categoryData == null ? void 0 : categoryData.suggestedQuestions) == null ? void 0 : _a2.length) && onSuggestedQuestionsLoad) {
      onSuggestedQuestionsLoad(categoryData.suggestedQuestions);
    }
  }, [categoryData, onSuggestedQuestionsLoad]);
  useEffect(() => {
    if (!isConversational) return;
    if (showResultsConv && !recommendationsLoading && flowState === FLOW_STATES.COMPLETE) {
      onShowResults == null ? void 0 : onShowResults(true);
    } else if (!showResultsConv) {
      onShowResults == null ? void 0 : onShowResults(false);
    }
  }, [isConversational, showResultsConv, recommendationsLoading, flowState, onShowResults]);
  useEffect(() => {
    if (isConversational) return;
    if (showResultsTrad && !recommendationsLoading) {
      onShowResults == null ? void 0 : onShowResults(true);
    } else if (!showResultsTrad) {
      onShowResults == null ? void 0 : onShowResults(false);
    }
  }, [isConversational, showResultsTrad, recommendationsLoading, onShowResults]);
  useEffect(() => {
    if (isConversational) return;
    if (skipAutoSubmitRef.current) return;
    if (!questionsLoading && hasQuestions && !showResultsTrad && initialQuestions.length > 0 && currentStep === 0) {
      const allAnswered = initialQuestions.every((q) => answeredIntentsTrad[String(q["id"])]);
      if (allAnswered) {
        isAutoSubmitRef.current = true;
        const catUrl = (categoryData == null ? void 0 : categoryData.categoryUrl) || configCategoryUrl || window.location.pathname;
        getRecommendations(catUrl, answeredIntentsTrad, { maxResults: 2, generateCards: true });
        setShowResultsTrad(true);
        setResultsCollapsed(true);
        saveResultsCollapsed(resultsCollapsedKey, true);
      }
    }
  }, [isConversational, questionsLoading, hasQuestions, initialQuestions.length, showResultsTrad, categoryData, getRecommendations, currentStep]);
  useEffect(() => {
    if (effectiveShowQuestionnaire) {
      scrollToElement(containerRef.current);
    }
  }, [effectiveShowQuestionnaire, isConversational ? questionNumber : currentStep]);
  useEffect(() => {
    if (shouldScrollToTopRef.current && !effectiveShowResults) {
      shouldScrollToTopRef.current = false;
      scrollToElement(containerRef.current);
    }
  }, [effectiveShowResults]);
  useEffect(() => {
    return () => {
      disconnect();
    };
  }, [disconnect]);
  const handleSelectAnswerConv = useCallback(
    (questionId, answer) => {
      if (!currentQuestionConv) return;
      const answerData = {
        questionId: String(questionId),
        answerId: answer.id != null ? String(answer.id) : null,
        answerText: answer.text
      };
      const q = currentQuestionConv;
      if (flowState === FLOW_STATES.IDLE || flowState === FLOW_STATES.SHOWING_FIRST) {
        const catUrl = (categoryData == null ? void 0 : categoryData.categoryUrl) || configCategoryUrl || window.location.pathname;
        startConversation(catUrl, answerData, q);
      } else if (flowState === FLOW_STATES.QUESTIONING) {
        submitAnswer(answerData.questionId, answerData.answerId, answerData.answerText, q);
      }
    },
    [flowState, currentQuestionConv, categoryData, startConversation, submitAnswer]
  );
  const handleOtherSubmitConv = useCallback(
    (otherText) => {
      if (!currentQuestionConv) return;
      const q = currentQuestionConv;
      const qId = String(q["id"]);
      if (flowState === FLOW_STATES.IDLE || flowState === FLOW_STATES.SHOWING_FIRST) {
        const catUrl = (categoryData == null ? void 0 : categoryData.categoryUrl) || configCategoryUrl || window.location.pathname;
        const answerData = { questionId: qId, answerId: null, answerText: otherText };
        startConversation(catUrl, answerData, q);
      } else if (flowState === FLOW_STATES.QUESTIONING) {
        submitOtherAnswer(qId, otherText, q);
      }
    },
    [currentQuestionConv, flowState, categoryData, startConversation, submitOtherAnswer]
  );
  const handleSelectAnswerTrad = useCallback(
    (questionId, answer) => {
      setAllAnsweredIntents((prev) => ({
        ...prev,
        [questionId]: { answer_id: answer.id ?? "", answer: answer.text }
      }));
    },
    []
  );
  const handleNext = useCallback(() => {
    if (currentStep < initialQuestions.length - 1) {
      setCurrentStep((prev) => prev + 1);
    }
  }, [currentStep, initialQuestions.length]);
  const handlePrevious = useCallback(() => {
    if (currentStep > 0) {
      setCurrentStep((prev) => prev - 1);
    }
  }, [currentStep]);
  const handleStepClick = useCallback(
    (stepIndex) => {
      if (stepIndex >= 0 && stepIndex < initialQuestions.length) {
        setCurrentStep(stepIndex);
      }
    },
    [initialQuestions.length]
  );
  const handleSubmitTrad = useCallback(() => {
    if (showResultsTrad || recommendationsLoading) return;
    skipAutoSubmitRef.current = false;
    isAutoSubmitRef.current = false;
    const catUrl = (categoryData == null ? void 0 : categoryData.categoryUrl) || configCategoryUrl || window.location.pathname;
    getRecommendations(catUrl, answeredIntentsTrad, { maxResults: 2, generateCards: true });
    setShowResultsTrad(true);
    if (isMobileViewport()) {
      setResultsTruncated(true);
      setResultsCollapsed(false);
      saveResultsCollapsed(resultsCollapsedKey, false);
    } else {
      setResultsCollapsed(false);
      saveResultsCollapsed(resultsCollapsedKey, false);
    }
  }, [categoryData, answeredIntentsTrad, getRecommendations, showResultsTrad, recommendationsLoading, resultsCollapsedKey]);
  const handleBack = useCallback(() => {
    shouldScrollToTopRef.current = true;
    if (isConversational) {
      resetConversation();
    } else {
      setShowResultsTrad(false);
      setCurrentStep(0);
      const questionIds = initialQuestions.map((q) => String(q["id"]));
      setAllAnsweredIntents((prev) => {
        const updated = { ...prev };
        questionIds.forEach((id) => delete updated[id]);
        return updated;
      });
    }
    setResultsCollapsed(false);
    saveResultsCollapsed(resultsCollapsedKey, false);
    setResultsTruncated(false);
  }, [isConversational, resetConversation, initialQuestions, resultsCollapsedKey]);
  const handleResultsStepClick = useCallback(
    (stepIndex) => {
      if (isConversational) {
        handleBack();
      } else {
        if (stepIndex >= 0 && stepIndex < initialQuestions.length) {
          skipAutoSubmitRef.current = true;
          setShowResultsTrad(false);
          setCurrentStep(stepIndex);
        }
      }
    },
    [isConversational, handleBack, initialQuestions.length]
  );
  const handleCollapseToggle = useCallback(() => {
    setResultsCollapsed((prev) => {
      const newValue = !prev;
      saveResultsCollapsed(resultsCollapsedKey, newValue);
      return newValue;
    });
  }, [resultsCollapsedKey]);
  const handleTruncatedToggle = useCallback(() => {
    setResultsTruncated((prev) => !prev);
  }, []);
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
  const getContainerClassName = () => {
    if (questionsLoading) {
      return "omniguide-cr-container omniguide-cr-container--loading";
    }
    if (noQuestions && !(categoryData == null ? void 0 : categoryData.shortSeoSummary) && !questionsError) {
      return "omniguide-cr-container omniguide-cr-container--collapsed";
    }
    return "omniguide-cr-container";
  };
  if (isConversational) {
    const questionsForQuestionnaire = currentQuestionConv ? [currentQuestionConv] : [];
    const questionnaireContent = /* @__PURE__ */ React.createElement(React.Fragment, null, questionsLoading && /* @__PURE__ */ React.createElement(CategoryQuestionSkeleton, null), !questionsLoading && questionsError && !hasQuestions && /* @__PURE__ */ React.createElement(QuestionsErrorState, { onRetry: retryQuestions }), !questionsLoading && noQuestions && !questionsError && (categoryData == null ? void 0 : categoryData.shortSeoSummary) && /* @__PURE__ */ React.createElement(
      "div",
      {
        className: "omniguide-cr-seo-summary",
        dangerouslySetInnerHTML: { __html: purify.sanitize(formatSeoSummary(categoryData.shortSeoSummary)) }
      }
    ), !questionsLoading && showQuestionnaireConv && currentQuestionConv && /* @__PURE__ */ React.createElement(
      DiscoveryQuestionnaire$1,
      {
        questions: questionsForQuestionnaire,
        currentStep: 0,
        answeredIntents: {},
        onSelectAnswer: handleSelectAnswerConv,
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
        onOtherSubmit: handleOtherSubmitConv,
        isOtherProcessing,
        otherError: otherValidationError,
        clarificationPrompt,
        onClearOtherError: clearOtherError
      }
    ), !questionsLoading && !showQuestionnaireConv && !showResultsConv && (flowState === FLOW_STATES.CONNECTING || flowState === FLOW_STATES.QUESTIONING && !wsQuestion) && /* @__PURE__ */ React.createElement("div", { className: "omniguide-cr-questionnaire" }, /* @__PURE__ */ React.createElement(CategoryQuestionSkeleton, null)));
    const showTeaser = teaserEnabled && !teaserExpanded && flowState === FLOW_STATES.IDLE && !showResultsConv;
    return /* @__PURE__ */ React.createElement("div", { ref: containerRef, className: getContainerClassName() }, showTeaser ? /* @__PURE__ */ React.createElement(
      QuestionnaireTeaser,
      {
        classPrefix: "omniguide-cr",
        onExpand: () => setTeaserExpanded(true)
      },
      questionnaireContent
    ) : questionnaireContent, showResultsConv && /* @__PURE__ */ React.createElement(
      CategoryResultsPanel$1,
      {
        recommendations,
        isLoading: recommendationsLoading || flowState === FLOW_STATES.LOADING_RESULTS,
        error: recommendationsError,
        processingStatus: processingStatus ?? void 0,
        statusMessage: getStatusMessage() ?? void 0,
        fallbackInfo: fallbackInfo ? {
          used: fallbackInfo.used,
          reason: fallbackInfo.reason ?? void 0,
          scope: fallbackInfo.scope ?? void 0,
          explanation: fallbackInfo.explanation ?? void 0
        } : void 0,
        onBack: handleBack,
        questions: questionsForIndicatorConv,
        answeredIntents: answeredIntentsForIndicatorConv,
        onStepClick: handleResultsStepClick,
        onCollapse: handleCollapseToggle,
        isCollapsed: resultsCollapsed,
        isTruncated: resultsTruncated,
        onTruncatedToggle: handleTruncatedToggle,
        fallbackImage,
        onFeedbackSubmit: handleFeedbackSubmit,
        showProductTags
      }
    ));
  }
  const tradQuestionnaireContent = /* @__PURE__ */ React.createElement(React.Fragment, null, questionsLoading && /* @__PURE__ */ React.createElement(CategoryQuestionSkeleton, null), !questionsLoading && questionsError && !hasQuestions && /* @__PURE__ */ React.createElement("div", { className: "omniguide-cr-state omniguide-cr-state--error" }, /* @__PURE__ */ React.createElement("h3", { className: "omniguide-cr-state__title" }, "Unable to connect"), /* @__PURE__ */ React.createElement("p", { className: "omniguide-cr-state__text" }, "The service is currently unavailable. Please try again in a moment."), /* @__PURE__ */ React.createElement(
    "button",
    {
      type: "button",
      className: "omniguide-cr-state__retry-btn",
      onClick: retryQuestions
    },
    /* @__PURE__ */ React.createElement("span", null, "Try Again")
  )), !questionsLoading && noQuestions && !questionsError && (categoryData == null ? void 0 : categoryData.shortSeoSummary) && /* @__PURE__ */ React.createElement(
    "div",
    {
      className: "omniguide-cr-seo-summary",
      dangerouslySetInnerHTML: { __html: purify.sanitize(formatSeoSummary(categoryData.shortSeoSummary)) }
    }
  ), effectiveShowQuestionnaire && /* @__PURE__ */ React.createElement(
    DiscoveryQuestionnaire$1,
    {
      questions: initialQuestions,
      currentStep,
      answeredIntents: answeredIntentsTrad,
      onSelectAnswer: handleSelectAnswerTrad,
      onNext: handleNext,
      onPrevious: handlePrevious,
      onSubmit: handleSubmitTrad,
      onStepClick: handleStepClick
    }
  ));
  const showTeaserTrad = teaserEnabled && !teaserExpanded && !showResultsTrad;
  return /* @__PURE__ */ React.createElement("div", { ref: containerRef, className: getContainerClassName() }, showTeaserTrad ? /* @__PURE__ */ React.createElement(
    QuestionnaireTeaser,
    {
      classPrefix: "omniguide-cr",
      onExpand: () => setTeaserExpanded(true)
    },
    tradQuestionnaireContent
  ) : tradQuestionnaireContent, showResultsTrad && /* @__PURE__ */ React.createElement(
    CategoryResultsPanel$1,
    {
      recommendations,
      isLoading: recommendationsLoading,
      error: recommendationsError,
      processingStatus: processingStatus ?? void 0,
      statusMessage: getStatusMessage() ?? void 0,
      fallbackInfo: fallbackInfo ? {
        used: fallbackInfo.used,
        reason: fallbackInfo.reason ?? void 0,
        scope: fallbackInfo.scope ?? void 0,
        explanation: fallbackInfo.explanation ?? void 0
      } : void 0,
      onBack: handleBack,
      questions: initialQuestions,
      answeredIntents: answeredIntentsTrad,
      onStepClick: handleResultsStepClick,
      onCollapse: handleCollapseToggle,
      isCollapsed: resultsCollapsed,
      isTruncated: resultsTruncated,
      onTruncatedToggle: handleTruncatedToggle,
      fallbackImage,
      onFeedbackSubmit: handleFeedbackSubmit,
      showProductTags
    }
  ));
}
const log = createScopedLogger("BCCategoryGuideContainer");
function BCCategoryGuideContainer(_props) {
  const { config, consentService } = useOmniguideContext();
  const featureStatus = useFeatureStatus(config.websiteId);
  const { callbacks, consent } = config;
  const FeedbackWidgetComponent = useFeedbackWidget();
  const [showResults, setShowResults] = useState(false);
  const [resultsLoading, setResultsLoading] = useState(false);
  const [chatCollapsed, setChatCollapsed] = useState(true);
  const { trackScrollForMore, trackScrollStarted } = useAnalyticsTracking({ websiteId: config.websiteId });
  const [suggestedQuestions, setSuggestedQuestions] = useState([]);
  useEffect(() => {
    if (showResults && !resultsLoading) {
      setChatCollapsed(true);
    }
  }, [showResults, resultsLoading]);
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
        log.error("WebSocket connect failed:", err);
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
      log.error("Failed to update consent preferences:", error);
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
      const categoryUrl = config.categoryUrl ?? window.location.pathname;
      sendMessage(content, { category_url: categoryUrl, limit_to_entity: 1 });
    },
    [sendMessage, config.categoryUrl]
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
  const handleShowResults = useCallback((showing, loading = false) => {
    setShowResults(showing);
    setResultsLoading(loading);
  }, []);
  const handleSuggestedQuestionsLoad = useCallback((questions) => {
    setSuggestedQuestions(questions.slice(0, 2));
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
  const containerClassName = showResults && !resultsLoading ? "omniguide-cr-assistant omniguide-cr-assistant--stacked" : "omniguide-cr-assistant";
  const getChatPanelClassName = () => {
    const baseClass = "omniguide-cr-assistant__chat";
    if (showResults && !resultsLoading) {
      return chatCollapsed ? `${baseClass} ${baseClass}--below-collapsed` : `${baseClass} ${baseClass}--below`;
    }
    return baseClass;
  };
  const questionnaireClassName = showResults && !resultsLoading ? "omniguide-cr-assistant__questionnaire omniguide-cr-assistant__questionnaire--full" : "omniguide-cr-assistant__questionnaire";
  return /* @__PURE__ */ React.createElement("div", { className: containerClassName }, /* @__PURE__ */ React.createElement("div", { className: questionnaireClassName }, /* @__PURE__ */ React.createElement(
    BCCategoryRecommendations,
    {
      onShowResults: handleShowResults,
      onSuggestedQuestionsLoad: handleSuggestedQuestionsLoad
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
class BCCategoryGuideIntegration {
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
    var _a, _b;
    const container = resolveContainer(this.mount, "category-recommendations-root");
    if (!container) {
      console.warn("[Omniguide] CategoryGuide: resolveContainer returned null. mount =", this.mount, "defaultId = category-recommendations-root");
      return false;
    }
    console.log("[Omniguide] CategoryGuide: container found =", container.tagName, container.id || container.className);
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
    this.mountComponent(container);
    this.initialized = true;
    return true;
  }
  mountComponent(container) {
    if (container.hasAttribute(MOUNTED_ATTR)) return;
    container.setAttribute(MOUNTED_ATTR, "true");
    this.root = createRoot(container);
    this.mountedContainer = container;
    const Container = this.containerComponent ?? BCCategoryGuideContainer;
    const providerProps = {
      config: this.omniguideConfig,
      platformAdapter: this.platformAdapter,
      storageAdapter: this.storageAdapter,
      components: this.components,
      children: /* @__PURE__ */ React.createElement(Container, null)
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
  BCCategoryGuideIntegration,
  m as buildConfig,
  o as buildPlatformAdapter
};
//# sourceMappingURL=omniguide-category-guide-DegfHr03.js.map
