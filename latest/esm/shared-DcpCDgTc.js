import { A as API_ENDPOINTS, v as normalizeQuestions, H as RestQuestionsResponseSchema, g as getCurrentPage, I as getFeatureStatus, J as onFeatureStatusChange } from "./shared-D3DY8J9a.js";
import React, { memo, useState, useRef, useEffect, useCallback } from "react";
function formatPrice(value) {
  if (value === null || value === void 0 || value === "") return null;
  let numericPrice;
  if (typeof value === "number") {
    numericPrice = value;
  } else if (typeof value === "string") {
    numericPrice = parseFloat(value.replace("$", ""));
  } else {
    return null;
  }
  if (Number.isNaN(numericPrice)) return null;
  if (Number.isInteger(numericPrice)) {
    return `$${numericPrice}`;
  }
  return `$${numericPrice.toFixed(2)}`;
}
function resolveContainer(mount, defaultId) {
  var _a, _b;
  if (!mount) {
    return document.getElementById(defaultId);
  }
  const target = mount.target instanceof HTMLElement ? mount.target : document.querySelector(mount.target);
  if (!target) {
    return null;
  }
  const position = mount.position ?? "inside";
  if (position === "inside") {
    return target;
  }
  if (position === "replace") {
    const container2 = document.createElement("div");
    target.replaceWith(container2);
    return container2;
  }
  const container = document.createElement("div");
  if (position === "before") {
    (_a = target.parentNode) == null ? void 0 : _a.insertBefore(container, target);
  } else {
    (_b = target.parentNode) == null ? void 0 : _b.insertBefore(container, target.nextSibling);
  }
  return container;
}
async function fetchProductQuestions(config, sku) {
  if (!sku) {
    return { questions: [] };
  }
  const currentPage = getCurrentPage();
  const params = new URLSearchParams({
    website_code: config.websiteId,
    sku,
    current_page: currentPage
  });
  const url = `${config.apiBaseUrl}${API_ENDPOINTS.PRODUCT_QUESTIONS}?${params}`;
  const response = await fetch(url, {
    method: "GET",
    headers: { "Content-Type": "application/json" }
  });
  if (!response.ok) {
    if (response.status === 404) {
      return { questions: [] };
    }
    throw new Error(`Failed to fetch product questions: ${response.statusText}`);
  }
  const raw = await response.json();
  const normalized = normalizeQuestions(raw);
  const validated = RestQuestionsResponseSchema.safeParse(normalized);
  return {
    ...raw,
    questions: validated.success ? validated.data : []
  };
}
async function fetchCategoryQuestions(config, categoryUrl) {
  const resolvedUrl = categoryUrl ?? (typeof window !== "undefined" ? window.location.pathname : "");
  const currentPage = getCurrentPage();
  const params = new URLSearchParams({
    website_code: config.websiteId,
    category_url: resolvedUrl,
    current_page: currentPage
  });
  const url = `${config.apiBaseUrl}${API_ENDPOINTS.CATEGORY_QUESTIONS}?${params}`;
  const response = await fetch(url, {
    method: "GET",
    headers: { "Content-Type": "application/json" }
  });
  if (!response.ok) {
    if (response.status === 404) {
      return { questions: [] };
    }
    throw new Error(`Failed to fetch category questions: ${response.statusText}`);
  }
  const raw = await response.json();
  const normalized = normalizeQuestions(raw);
  const validated = RestQuestionsResponseSchema.safeParse(normalized);
  return {
    ...raw,
    questions: validated.success ? validated.data : []
  };
}
const CheckIcon = () => /* @__PURE__ */ React.createElement("svg", { width: "14", height: "14", viewBox: "0 0 24 24", fill: "none", stroke: "white", strokeWidth: "3", strokeLinecap: "round", strokeLinejoin: "round" }, /* @__PURE__ */ React.createElement("polyline", { points: "20 6 9 17 4 12" }));
const DiscoveryOptionButton = memo(function DiscoveryOptionButton2({ answer, isSelected, onSelect }) {
  return /* @__PURE__ */ React.createElement(
    "button",
    {
      type: "button",
      className: `omniguide-pr-option-pill ${isSelected ? "omniguide-pr-option-pill--selected" : ""}`,
      onClick: () => onSelect(answer),
      "aria-pressed": isSelected
    },
    /* @__PURE__ */ React.createElement("div", { className: "omniguide-pr-option-pill__checkbox" }, /* @__PURE__ */ React.createElement("div", { className: `omniguide-pr-option-pill__checkbox-inner ${isSelected ? "omniguide-pr-option-pill__checkbox-inner--selected" : ""}` }, isSelected && /* @__PURE__ */ React.createElement(CheckIcon, null))),
    /* @__PURE__ */ React.createElement("span", { className: "omniguide-pr-option-pill__text" }, answer.text)
  );
});
function DiscoveryStepIndicator({
  currentStep,
  totalSteps,
  answeredIntents,
  questions,
  onStepClick,
  classPrefix = "omniguide-cr",
  showAnswerPills = true,
  dynamicMode = false,
  answeredQuestions = [],
  questionNumber = 0
}) {
  if (dynamicMode) {
    return /* @__PURE__ */ React.createElement("div", { className: `${classPrefix}-steps ${classPrefix}-steps--dynamic` }, answeredQuestions.map((aq, index) => {
      const question = aq.question;
      const answer = aq.answer;
      const hasSummary = !!(question == null ? void 0 : question.summary);
      const pillText = hasSummary ? `${question.summary}: ${answer.answer}` : answer.answer;
      return /* @__PURE__ */ React.createElement(
        "button",
        {
          key: (question == null ? void 0 : question.id) || index,
          type: "button",
          className: `${classPrefix}-step ${classPrefix}-step--pill`,
          onClick: () => onStepClick == null ? void 0 : onStepClick(index),
          title: question == null ? void 0 : question.question
        },
        pillText
      );
    }), questionNumber > 0 && /* @__PURE__ */ React.createElement(
      "div",
      {
        className: `${classPrefix}-step ${classPrefix}-step--circle ${classPrefix}-step--current`
      },
      questionNumber
    ));
  }
  return /* @__PURE__ */ React.createElement("div", { className: `${classPrefix}-steps` }, Array.from({ length: totalSteps }).map((_, index) => {
    const question = questions[index];
    const answer = (question == null ? void 0 : question.id) ? answeredIntents[question.id] : void 0;
    const isCompleted = !!answer;
    const isCurrent = index === currentStep;
    const hasSummary = !!(question == null ? void 0 : question.summary);
    const stepNumber = index + 1;
    if (!showAnswerPills) {
      let circleClass = `${classPrefix}-step ${classPrefix}-step--circle`;
      if (isCurrent) {
        circleClass += ` ${classPrefix}-step--current`;
      } else if (isCompleted) {
        circleClass += ` ${classPrefix}-step--answered`;
      } else {
        circleClass += ` ${classPrefix}-step--unvisited`;
      }
      return /* @__PURE__ */ React.createElement(
        "div",
        {
          key: (question == null ? void 0 : question.id) || index,
          className: circleClass
        },
        stepNumber
      );
    }
    if (isCompleted && !isCurrent) {
      const pillText = hasSummary ? `${question.summary}: ${answer.answer}` : answer.answer;
      return /* @__PURE__ */ React.createElement(
        "button",
        {
          key: (question == null ? void 0 : question.id) || index,
          type: "button",
          className: `${classPrefix}-step ${classPrefix}-step--pill`,
          onClick: () => onStepClick == null ? void 0 : onStepClick(index),
          title: question == null ? void 0 : question.question
        },
        pillText
      );
    }
    if (isCurrent) {
      return /* @__PURE__ */ React.createElement(
        "div",
        {
          key: (question == null ? void 0 : question.id) || index,
          className: `${classPrefix}-step ${classPrefix}-step--circle ${classPrefix}-step--current`
        },
        stepNumber
      );
    }
    return /* @__PURE__ */ React.createElement(
      "div",
      {
        key: (question == null ? void 0 : question.id) || index,
        className: `${classPrefix}-step ${classPrefix}-step--circle ${classPrefix}-step--unvisited`
      },
      stepNumber
    );
  }));
}
const LoadingSpinner = () => /* @__PURE__ */ React.createElement("svg", { width: "16", height: "16", viewBox: "0 0 24 24", fill: "none", xmlns: "http://www.w3.org/2000/svg", className: "omniguide-other-input__spinner" }, /* @__PURE__ */ React.createElement("circle", { cx: "12", cy: "12", r: "10", stroke: "currentColor", strokeWidth: "3", strokeLinecap: "round", strokeDasharray: "31.4 31.4" }));
function DiscoveryQuestionStep({
  question,
  selectedAnswer,
  onSelectAnswer,
  onOtherSubmit,
  isOtherProcessing = false,
  otherError = null,
  clarificationPrompt = null,
  onClearOtherError,
  maxOtherLength = 50
}) {
  const [isOtherMode, setIsOtherMode] = useState(false);
  const [otherText, setOtherText] = useState("");
  const inputRef = useRef(null);
  useEffect(() => {
    setIsOtherMode(false);
    setOtherText("");
  }, [question == null ? void 0 : question.id]);
  useEffect(() => {
    if (isOtherMode && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOtherMode]);
  const handleOtherClick = () => {
    setIsOtherMode(true);
  };
  const handleCancelOther = () => {
    setIsOtherMode(false);
    setOtherText("");
    onClearOtherError == null ? void 0 : onClearOtherError();
  };
  const handleOtherTextChange = (e) => {
    const value = e.target.value;
    if (value.length <= maxOtherLength) {
      setOtherText(value);
      if (onClearOtherError && otherError) {
        onClearOtherError();
      }
    }
  };
  const handleOtherSubmit = () => {
    if (!otherText.trim() || isOtherProcessing) return;
    onOtherSubmit == null ? void 0 : onOtherSubmit(question.id, otherText.trim());
  };
  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleOtherSubmit();
    } else if (e.key === "Escape") {
      handleCancelOther();
    }
  };
  return /* @__PURE__ */ React.createElement("div", { className: "omniguide-pr-questionnaire__choices", role: "radiogroup", "aria-label": question.question }, question.answers.map((answer) => /* @__PURE__ */ React.createElement(
    DiscoveryOptionButton,
    {
      key: answer.id,
      answer,
      isSelected: (selectedAnswer == null ? void 0 : selectedAnswer.answer_id) === answer.id,
      onSelect: onSelectAnswer
    }
  )), onOtherSubmit && !isOtherMode && /* @__PURE__ */ React.createElement(
    "button",
    {
      type: "button",
      className: "omniguide-pr-option-pill omniguide-pr-option-pill--other",
      onClick: handleOtherClick,
      "aria-pressed": false
    },
    /* @__PURE__ */ React.createElement("span", { className: "omniguide-pr-option-pill__text" }, "Other...")
  ), isOtherMode && /* @__PURE__ */ React.createElement("div", { className: "omniguide-other-input" }, clarificationPrompt && /* @__PURE__ */ React.createElement("div", { className: "omniguide-other-input__clarification" }, clarificationPrompt), /* @__PURE__ */ React.createElement("div", { className: "omniguide-other-input__field-wrapper" }, /* @__PURE__ */ React.createElement(
    "input",
    {
      ref: inputRef,
      type: "text",
      className: `omniguide-other-input__field ${otherError ? "omniguide-other-input__field--error" : ""}`,
      value: otherText,
      onChange: handleOtherTextChange,
      onKeyDown: handleKeyDown,
      placeholder: "Enter your answer...",
      maxLength: maxOtherLength,
      disabled: isOtherProcessing,
      "aria-label": "Custom answer",
      "aria-invalid": !!otherError,
      "aria-describedby": otherError ? "other-error" : void 0
    }
  ), /* @__PURE__ */ React.createElement("span", { className: "omniguide-other-input__counter" }, otherText.length, "/", maxOtherLength)), otherError && /* @__PURE__ */ React.createElement("div", { id: "other-error", className: "omniguide-other-input__error", role: "alert" }, otherError.message), /* @__PURE__ */ React.createElement("div", { className: "omniguide-other-input__actions" }, /* @__PURE__ */ React.createElement(
    "button",
    {
      type: "button",
      className: "omniguide-other-input__cancel",
      onClick: handleCancelOther,
      disabled: isOtherProcessing
    },
    "Cancel"
  ), /* @__PURE__ */ React.createElement(
    "button",
    {
      type: "button",
      className: "omniguide-other-input__submit",
      onClick: handleOtherSubmit,
      disabled: !otherText.trim() || isOtherProcessing
    },
    isOtherProcessing ? /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement(LoadingSpinner, null), /* @__PURE__ */ React.createElement("span", null, "Submitting...")) : "Submit"
  ))));
}
const AIIcon = () => /* @__PURE__ */ React.createElement("svg", { width: "20", height: "24", viewBox: "0 0 20 24", fill: "none", xmlns: "http://www.w3.org/2000/svg" }, /* @__PURE__ */ React.createElement(
  "path",
  {
    d: "M9.9053 2.33347C6.87579 2.33351 4.0579 4.2161 2.89846 7.01495C1.73921 9.81387 2.40038 13.1374 4.54251 15.2796C6.68479 17.4215 10.0084 18.0818 12.8072 16.9225C15.6057 15.7629 17.4886 12.9461 17.4886 9.9168H19.822C19.822 13.0057 18.3397 15.9094 15.9551 17.7633C15.4571 18.1505 15.4825 18.9831 16.0087 19.331C17.5342 20.3398 18.7955 21.7162 19.667 23.3335H16.9042C15.3078 21.2085 12.7666 19.8335 9.90416 19.8335C7.0417 19.8335 4.50051 21.2084 2.90416 23.3335H0.141301C1.01161 21.7185 2.2713 20.3442 3.79397 19.3356C4.32198 18.9857 4.34423 18.1467 3.84182 17.761C3.51005 17.5065 3.19253 17.2291 2.89277 16.9293C0.083256 14.1197 -0.777662 9.79259 0.742864 6.12172C2.26348 2.45101 5.93208 0.000177863 9.9053 0.000137573V2.33347Z",
    fill: "currentColor"
  }
), /* @__PURE__ */ React.createElement(
  "path",
  {
    d: "M12.593 0.0502678C13.1243 -0.0167857 13.6839 -0.0167262 14.2154 0.0502678C14.3017 4.62302 15.1984 5.51921 19.7707 5.60561C19.8378 6.13712 19.8377 6.69646 19.7707 7.228C15.1986 7.31439 14.3017 8.21126 14.2154 12.7833C13.6838 12.8504 13.1245 12.8504 12.593 12.7833C12.5066 8.21101 11.6104 7.3143 7.03762 7.228C6.97064 6.69651 6.97054 6.13706 7.03762 5.60561C11.6106 5.5193 12.5067 4.62327 12.593 0.0502678Z",
    fill: "currentColor"
  }
));
const ArrowRightIcon = () => /* @__PURE__ */ React.createElement("svg", { width: "20", height: "20", viewBox: "0 0 24 24", fill: "none", xmlns: "http://www.w3.org/2000/svg" }, /* @__PURE__ */ React.createElement(
  "path",
  {
    d: "M5 12H19M19 12L12 5M19 12L12 19",
    stroke: "currentColor",
    strokeWidth: "2",
    strokeLinecap: "round",
    strokeLinejoin: "round"
  }
));
const ArrowLeftIcon = () => /* @__PURE__ */ React.createElement("svg", { width: "20", height: "20", viewBox: "0 0 24 24", fill: "none", xmlns: "http://www.w3.org/2000/svg" }, /* @__PURE__ */ React.createElement(
  "path",
  {
    d: "M19 12H5M5 12L12 5M5 12L12 19",
    stroke: "currentColor",
    strokeWidth: "2",
    strokeLinecap: "round",
    strokeLinejoin: "round"
  }
));
function DiscoveryQuestionnaire({
  questions,
  currentStep,
  answeredIntents,
  onSelectAnswer,
  onNext,
  onPrevious,
  onSubmit,
  onStepClick,
  submitButtonText = "See Recommendations",
  subtitle,
  classPrefix = "omniguide-cr",
  dynamicMode = false,
  answeredQuestions = [],
  questionNumber = 0,
  onOtherSubmit,
  isOtherProcessing = false,
  otherError = null,
  clarificationPrompt = null,
  onClearOtherError
}) {
  const currentQuestion = questions[currentStep];
  const currentAnswer = (currentQuestion == null ? void 0 : currentQuestion.id) ? answeredIntents[currentQuestion.id] : void 0;
  const isLastStep = currentStep === questions.length - 1;
  const isFirstStep = currentStep === 0;
  const hasSelection = !!currentAnswer;
  const wasPreAnsweredRef = useRef({});
  const questionId = currentQuestion == null ? void 0 : currentQuestion.id;
  useEffect(() => {
    if (questionId && wasPreAnsweredRef.current[questionId] === void 0) {
      wasPreAnsweredRef.current[questionId] = hasSelection;
    }
  }, [questionId, hasSelection]);
  const wasPreAnswered = questionId ? wasPreAnsweredRef.current[questionId] : false;
  const handleNextClick = () => {
    if (isLastStep) {
      onSubmit();
    } else {
      onNext();
    }
  };
  const handleAnswerSelect = (qId, answer) => {
    onSelectAnswer(qId, answer);
    if (!wasPreAnswered) {
      setTimeout(() => {
        handleNextClick();
      }, 300);
    }
  };
  return /* @__PURE__ */ React.createElement("div", { className: `${classPrefix}-questionnaire` }, /* @__PURE__ */ React.createElement("div", { className: `${classPrefix}-questionnaire__header` }, /* @__PURE__ */ React.createElement("div", { className: `${classPrefix}-questionnaire__header-row` }, /* @__PURE__ */ React.createElement("div", { className: `${classPrefix}-questionnaire__title-row` }, /* @__PURE__ */ React.createElement("div", { className: `${classPrefix}-questionnaire__icon` }, /* @__PURE__ */ React.createElement(AIIcon, null)), /* @__PURE__ */ React.createElement("h2", { className: `${classPrefix}-questionnaire__title` }, (currentQuestion == null ? void 0 : currentQuestion.question) || "Loading...")), /* @__PURE__ */ React.createElement(
    DiscoveryStepIndicator,
    {
      currentStep,
      totalSteps: questions.length,
      answeredIntents,
      questions,
      onStepClick,
      classPrefix,
      showAnswerPills: false,
      dynamicMode,
      answeredQuestions,
      questionNumber
    }
  )), subtitle && /* @__PURE__ */ React.createElement("p", { className: `${classPrefix}-questionnaire__subtitle` }, subtitle)), currentQuestion && /* @__PURE__ */ React.createElement(
    DiscoveryQuestionStep,
    {
      question: currentQuestion,
      selectedAnswer: currentAnswer,
      onSelectAnswer: (answer) => handleAnswerSelect(currentQuestion.id, answer),
      onOtherSubmit: onOtherSubmit ? (_questionId, text) => onOtherSubmit(text) : void 0,
      isOtherProcessing,
      otherError,
      clarificationPrompt,
      onClearOtherError
    }
  ), !dynamicMode && /* @__PURE__ */ React.createElement("div", { className: `${classPrefix}-nav` }, !isFirstStep ? /* @__PURE__ */ React.createElement(
    "button",
    {
      type: "button",
      className: `${classPrefix}-nav__prev`,
      onClick: onPrevious
    },
    /* @__PURE__ */ React.createElement("div", { className: `${classPrefix}-nav__prev-icon` }, /* @__PURE__ */ React.createElement(ArrowLeftIcon, null)),
    /* @__PURE__ */ React.createElement("span", { className: `${classPrefix}-nav__prev-text` }, "Previous")
  ) : /* @__PURE__ */ React.createElement("div", null), wasPreAnswered ? /* @__PURE__ */ React.createElement(
    "button",
    {
      type: "button",
      className: `${classPrefix}-nav__next`,
      "data-disabled": !hasSelection,
      onClick: handleNextClick,
      disabled: !hasSelection
    },
    /* @__PURE__ */ React.createElement("span", { className: `${classPrefix}-nav__next-text` }, isLastStep ? submitButtonText : "Next"),
    /* @__PURE__ */ React.createElement("div", { className: `${classPrefix}-nav__next-icon` }, /* @__PURE__ */ React.createElement(ArrowRightIcon, null))
  ) : /* @__PURE__ */ React.createElement("div", null)));
}
function ArrowIcon() {
  return /* @__PURE__ */ React.createElement("svg", { width: "20", height: "20", viewBox: "0 0 24 24", fill: "none", xmlns: "http://www.w3.org/2000/svg" }, /* @__PURE__ */ React.createElement(
    "path",
    {
      d: "M5 12H19M19 12L12 5M19 12L12 19",
      stroke: "currentColor",
      strokeWidth: "2.5",
      strokeLinecap: "round",
      strokeLinejoin: "round"
    }
  ));
}
function QuestionnaireTeaser({
  children,
  headline = "Answer a couple of brief questions, and we’ll build you a tailored buying guide.",
  ctaLabel = "Start",
  classPrefix = "omniguide-cr",
  onExpand
}) {
  const base = `${classPrefix}-questionnaire-teaser`;
  const [expanded, setExpanded] = useState(false);
  const headerRef = useRef(null);
  const [headerHeight, setHeaderHeight] = useState(void 0);
  useEffect(() => {
    if (expanded) return;
    const el = headerRef.current;
    if (!el) return;
    const measure = () => {
      const height = el.scrollHeight;
      if (height > 0) {
        setHeaderHeight(height);
      }
    };
    measure();
    if (typeof ResizeObserver !== "undefined") {
      const observer = new ResizeObserver(measure);
      observer.observe(el);
      return () => observer.disconnect();
    }
    let timer;
    const onResize = () => {
      clearTimeout(timer);
      timer = setTimeout(measure, 150);
    };
    window.addEventListener("resize", onResize);
    return () => {
      clearTimeout(timer);
      window.removeEventListener("resize", onResize);
    };
  }, [expanded]);
  const handleExpand = useCallback(() => {
    setExpanded(true);
    onExpand == null ? void 0 : onExpand();
  }, [onExpand]);
  const handleKeyDown = useCallback(
    (e) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        handleExpand();
      }
    },
    [handleExpand]
  );
  return /* @__PURE__ */ React.createElement(
    "div",
    {
      className: `${base}${expanded ? ` ${base}--expanded` : ""}`,
      onClick: !expanded ? handleExpand : void 0,
      role: !expanded ? "button" : void 0,
      tabIndex: !expanded ? 0 : void 0,
      onKeyDown: !expanded ? handleKeyDown : void 0
    },
    /* @__PURE__ */ React.createElement(
      "div",
      {
        ref: headerRef,
        className: `${base}__header`,
        style: headerHeight ? { maxHeight: expanded ? 0 : headerHeight } : void 0
      },
      /* @__PURE__ */ React.createElement("h2", { className: `${base}__headline` }, headline),
      /* @__PURE__ */ React.createElement("span", { className: `${base}__cta` }, ctaLabel, /* @__PURE__ */ React.createElement(ArrowIcon, null))
    ),
    /* @__PURE__ */ React.createElement("div", { className: `${base}__body` }, children),
    /* @__PURE__ */ React.createElement("div", { className: `${base}__fade` })
  );
}
const DEFAULT_ROTATION_INTERVAL = 2500;
function useStatusMessage(processingStatus, statusMessages, rotationInterval = DEFAULT_ROTATION_INTERVAL) {
  const [messageIndex, setMessageIndex] = useState(0);
  useEffect(() => {
    if (!processingStatus) {
      setMessageIndex(0);
      return;
    }
    const messages = statusMessages[processingStatus];
    if (!messages || !Array.isArray(messages) || messages.length <= 1) {
      return;
    }
    const interval = setInterval(() => {
      setMessageIndex((prevIndex) => (prevIndex + 1) % messages.length);
    }, rotationInterval);
    return () => clearInterval(interval);
  }, [processingStatus, statusMessages, rotationInterval]);
  const getStatusMessage = useCallback(() => {
    if (!processingStatus) return null;
    const messages = statusMessages[processingStatus] ?? statusMessages["processing"];
    if (!messages) return null;
    if (Array.isArray(messages)) {
      return messages[messageIndex % messages.length] ?? null;
    }
    return messages;
  }, [processingStatus, statusMessages, messageIndex]);
  return { statusMessage: getStatusMessage(), getStatusMessage };
}
function useDiscoveryAnswerStorage(storageAdapter, productTypeId = null) {
  const saveAnswer = useCallback(
    (questionId, answerId, answerText, isOther = false, question = null) => {
      const currentIntents = storageAdapter.load();
      const storageKey = storageAdapter.toDiscoveryId(questionId);
      currentIntents[storageKey] = {
        question_id: storageKey,
        answer_id: answerId ? storageAdapter.toDiscoveryId(answerId) : null,
        answer_text: answerText,
        is_other: isOther,
        question,
        product_type_id: productTypeId ? Number(productTypeId) : void 0
      };
      storageAdapter.save(currentIntents);
    },
    [storageAdapter, productTypeId]
  );
  const restoreFromStorage = useCallback(() => {
    const storedIntents = storageAdapter.load(productTypeId);
    const restored = [];
    for (const intent of Object.values(storedIntents)) {
      if (intent.question) {
        restored.push({
          question: intent.question,
          answer: {
            answer_id: intent.answer_id,
            answer: intent.answer_text
          }
        });
      }
    }
    return restored;
  }, [storageAdapter, productTypeId]);
  const hasStoredSession = useCallback(() => {
    const storedIntents = storageAdapter.load(productTypeId);
    return Object.keys(storedIntents).length > 0;
  }, [storageAdapter, productTypeId]);
  const getStoredAnswerCount = useCallback(() => {
    const storedIntents = storageAdapter.load(productTypeId);
    return Object.keys(storedIntents).length;
  }, [storageAdapter, productTypeId]);
  const clearStorage = useCallback(() => {
    storageAdapter.save({});
  }, [storageAdapter]);
  return {
    saveAnswer,
    restoreFromStorage,
    hasStoredSession,
    getStoredAnswerCount,
    clearStorage
  };
}
function useFeatureStatus(websiteId) {
  const [status, setStatus] = useState(
    () => getFeatureStatus(websiteId)
  );
  useEffect(() => {
    const current = getFeatureStatus(websiteId);
    if (current !== null) {
      setStatus(current);
    }
    return onFeatureStatusChange(websiteId, (next) => {
      setStatus((prev) => (prev == null ? void 0 : prev.aiDisabled) === next.aiDisabled ? prev : next);
    });
  }, [websiteId]);
  return status;
}
function watchFeatureStatus(websiteId, container) {
  const applyVisibility = (aiDisabled) => {
    container.style.display = aiDisabled ? "none" : "";
  };
  const current = getFeatureStatus(websiteId);
  if (current) {
    applyVisibility(current.aiDisabled);
  }
  const unsubscribe = onFeatureStatusChange(websiteId, (status) => {
    applyVisibility(status.aiDisabled);
  });
  return { unsubscribe };
}
export {
  DiscoveryStepIndicator as D,
  QuestionnaireTeaser as Q,
  useStatusMessage as a,
  fetchProductQuestions as b,
  DiscoveryQuestionnaire as c,
  useFeatureStatus as d,
  fetchCategoryQuestions as e,
  formatPrice as f,
  resolveContainer as r,
  useDiscoveryAnswerStorage as u,
  watchFeatureStatus as w
};
//# sourceMappingURL=shared-DcpCDgTc.js.map
