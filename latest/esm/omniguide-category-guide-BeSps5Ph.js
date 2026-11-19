import { e as useOmniguideContext, k as buildBCHydrationConfig, l as fetchProductUrlsBySkus, f as useAnalyticsTracking, g as useFeedbackWidget, h as useBCSearchChat, j as useUserConsent, S as SearchChatPanel, O as OmniguideProvider } from "./shared-nkH5ybN7.js";
import { m, n } from "./shared-nkH5ybN7.js";
import React, { useMemo, useCallback, useState, useEffect, useRef } from "react";
import { createRoot } from "react-dom/client";
import { r as resolveContainer } from "./shared-2BGWnT-d.js";
import { u as useFeatureStatus, w as watchFeatureStatus, a as adjustContainerHeight } from "./shared-sqwSCH9v.js";
import { c as createScopedLogger } from "./shared-B44A3pDU.js";
import { C as CategoryQuestionSkeleton, B as BCCategoryRecommendations } from "./shared-xqIJ2knr.js";
const log = createScopedLogger("BCCategoryGuideContainer");
function BCCategoryGuideContainer(_props) {
  var _a, _b, _c;
  const { config, platformAdapter, consentService } = useOmniguideContext();
  const hydrationConfig = useMemo(
    () => buildBCHydrationConfig(config, platformAdapter),
    [config, platformAdapter]
  );
  const fetchProductUrls = useCallback(
    (skus) => fetchProductUrlsBySkus(skus, hydrationConfig),
    [hydrationConfig]
  );
  const featureStatus = useFeatureStatus(config.websiteId);
  const [initGraceExpired, setInitGraceExpired] = useState(false);
  useEffect(() => {
    if (featureStatus) return void 0;
    const timer = setTimeout(() => setInitGraceExpired(true), 8e3);
    return () => clearTimeout(timer);
  }, [featureStatus]);
  const { callbacks, consent } = config;
  const { trackFeedback, trackScrollForMore, trackScrollStarted, trackInlineProductLink } = useAnalyticsTracking({ websiteId: config.websiteId });
  const handleInlineProductLinkClick = useCallback(
    (data) => {
      trackInlineProductLink({
        sku: data.sku,
        productUrl: data.href,
        messageId: data.messageId,
        recPageArea: "category-page-content",
        queryContext: data.queryContext
      });
    },
    [trackInlineProductLink]
  );
  const handleFeedbackSubmitted = useCallback(({ entityId, vote }) => {
    trackFeedback({
      messageId: entityId,
      feedbackType: vote > 0 ? "thumbs_up" : "thumbs_down",
      turnNumber: 0
    });
  }, [trackFeedback]);
  const FeedbackWidgetComponent = useFeedbackWidget({
    onFeedbackSubmitted: handleFeedbackSubmitted
  });
  const [showResults, setShowResults] = useState(false);
  const [resultsLoading, setResultsLoading] = useState(false);
  const [askActive, setAskActive] = useState(false);
  const [suggestedQuestions, setSuggestedQuestions] = useState([]);
  const [productTypeName, setProductTypeName] = useState("");
  useEffect(() => {
    if (showResults && !resultsLoading) {
      setAskActive(false);
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
    var _a2;
    (_a2 = callbacks == null ? void 0 : callbacks.onOpenSupport) == null ? void 0 : _a2.call(callbacks);
  }, [callbacks]);
  const privacySettingsProps = sessionId ? {
    sessionId,
    privacyPolicyUrl: (consent == null ? void 0 : consent.privacyPolicyUrl) ?? "/privacy-policy",
    onOpenSupport: (callbacks == null ? void 0 : callbacks.onOpenSupport) ? handleOpenSupport : void 0,
    supportHref: (_a = config.ui) == null ? void 0 : _a.supportHref,
    supportLabel: (_b = config.ui) == null ? void 0 : _b.supportLabel,
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
    (answerText, answerId, options) => {
      sendIntentAnswer(
        answerText,
        answerId == null ? null : String(answerId),
        options
      );
    },
    [sendIntentAnswer]
  );
  const handleCustomIntentAnswer = useCallback(
    (customText) => handleSendMessage(customText),
    [handleSendMessage]
  );
  const handleClarificationAnswer = useCallback(
    (answerText, optionId, paramName, params) => {
      sendClarificationAnswer(answerText, String(optionId), paramName, params);
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
  const handleProductTypeResolved = useCallback((productType) => {
    setProductTypeName(productType);
  }, []);
  const handleScrollForMoreTapped = useCallback(
    (messageId) => trackScrollForMore({ messageId }),
    [trackScrollForMore]
  );
  const handleScrollStarted = useCallback(
    (messageId) => trackScrollStarted({ messageId }),
    [trackScrollStarted]
  );
  const containerClassName = "omniguide-cr-assistant";
  const questionnaireClassName = "omniguide-cr-assistant__questionnaire omniguide-cr-assistant__questionnaire--full";
  if (featureStatus == null ? void 0 : featureStatus.aiDisabled) {
    return null;
  }
  if (!featureStatus) {
    if (initGraceExpired) return null;
    return /* @__PURE__ */ React.createElement("div", { className: containerClassName }, /* @__PURE__ */ React.createElement("div", { className: questionnaireClassName }, /* @__PURE__ */ React.createElement("div", { className: "omniguide omniguide-cr-container omniguide-cr-container--loading" }, /* @__PURE__ */ React.createElement(CategoryQuestionSkeleton, null))));
  }
  const chatNode = /* @__PURE__ */ React.createElement(
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
      isCollapsed: false,
      askInitiallyExpanded: true,
      submitLabel: "Go",
      variant: "category",
      suggestedQuestions,
      onResetChat: handleResetChat,
      FeedbackWidgetComponent,
      onScrollForMoreTapped: handleScrollForMoreTapped,
      onScrollStarted: handleScrollStarted,
      onInlineProductLinkClick: handleInlineProductLinkClick,
      fetchProductUrls,
      hideMobileAskBox: ((_c = config.features) == null ? void 0 : _c.hideMobileAskBox) === true,
      mobileAskPlaceholder: productTypeName ? `Ask a question about ${productTypeName}…` : void 0,
      privacySettingsProps
    }
  );
  return /* @__PURE__ */ React.createElement("div", { className: containerClassName }, /* @__PURE__ */ React.createElement("div", { className: questionnaireClassName }, /* @__PURE__ */ React.createElement(
    BCCategoryRecommendations,
    {
      onShowResults: handleShowResults,
      onSuggestedQuestionsLoad: handleSuggestedQuestionsLoad,
      onProductTypeResolved: handleProductTypeResolved,
      askActive,
      onAskOpen: () => setAskActive(true),
      onAskClose: () => setAskActive(false),
      askPanel: chatNode
    }
  )));
}
const MOUNTED_ATTR = "data-omniguide-mounted";
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
    var _a, _b, _c;
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
      (_b = this.cancelHeightAdjust) == null ? void 0 : _b.call(this);
      this.cancelHeightAdjust = void 0;
      try {
        this.root.unmount();
      } catch {
      }
      (_c = this.mountedContainer) == null ? void 0 : _c.removeAttribute(MOUNTED_ATTR);
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
    this.cancelHeightAdjust = adjustContainerHeight(container);
  }
  destroy() {
    var _a, _b, _c;
    (_a = this.cancelHeightAdjust) == null ? void 0 : _a.call(this);
    this.cancelHeightAdjust = void 0;
    (_b = this.unsubscribeFeatureStatus) == null ? void 0 : _b.call(this);
    this.unsubscribeFeatureStatus = void 0;
    if (this.root) {
      this.root.unmount();
      (_c = this.mountedContainer) == null ? void 0 : _c.removeAttribute(MOUNTED_ATTR);
      this.mountedContainer = null;
      this.root = null;
    }
  }
}
export {
  BCCategoryGuideIntegration,
  m as buildConfig,
  n as buildPlatformAdapter
};
