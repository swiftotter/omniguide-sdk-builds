import React, { memo, useState, useEffect } from "react";
import { e as useOmniguideContext, J as setSessionId, K as getCurrentPage, M as API_ENDPOINTS, N as normalizeSessionResponse, P as RestSessionResponseSchema, Q as setFeatureStatus, o as createScopedLogger } from "./shared-Di6j07Wm.js";
const TAG_TYPES = {
  TOP_PICK: "top-pick",
  RUNNER_UP: "runner-up",
  BAD_FIT: "bad-fit"
};
const TopPickIcon = () => /* @__PURE__ */ React.createElement("svg", { width: "14", height: "14", viewBox: "0 0 20 20", fill: "currentColor" }, /* @__PURE__ */ React.createElement("path", { d: "M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" }));
const RunnerUpIcon = () => /* @__PURE__ */ React.createElement("svg", { width: "14", height: "14", viewBox: "0 0 20 20", fill: "currentColor" }, /* @__PURE__ */ React.createElement("path", { fillRule: "evenodd", d: "M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z", clipRule: "evenodd" }));
const BadFitIcon = () => /* @__PURE__ */ React.createElement("svg", { width: "14", height: "14", viewBox: "0 0 20 20", fill: "currentColor" }, /* @__PURE__ */ React.createElement("path", { fillRule: "evenodd", d: "M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z", clipRule: "evenodd" }));
const TAG_CONFIG = {
  [TAG_TYPES.TOP_PICK]: { label: "Top Pick", icon: TopPickIcon },
  [TAG_TYPES.RUNNER_UP]: { label: "Runner-Up", icon: RunnerUpIcon },
  [TAG_TYPES.BAD_FIT]: { label: "Bad Fit", icon: BadFitIcon }
};
function normalizeTagType(tag) {
  if (!tag) return null;
  if (typeof tag === "object") {
    if (tag.type) {
      const typeNormalized = tag.type.toLowerCase().replace(/[_\s]/g, "-");
      if (typeNormalized === "recommended") return TAG_TYPES.TOP_PICK;
      if (typeNormalized === "runner-up" || typeNormalized === "runnerup") return TAG_TYPES.RUNNER_UP;
      if (typeNormalized === "bad-fit" || typeNormalized === "badfit") return TAG_TYPES.BAD_FIT;
    }
    if (tag.value) {
      return normalizeTagType(tag.value);
    }
    return null;
  }
  if (typeof tag === "string") {
    const normalized = tag.toLowerCase().replace(/[_\s]/g, "-");
    if (normalized === "recommended") return TAG_TYPES.TOP_PICK;
    if (normalized === "runner-up" || normalized === "runnerup") return TAG_TYPES.RUNNER_UP;
    if (normalized === "bad-fit" || normalized === "badfit") return TAG_TYPES.BAD_FIT;
    if (normalized.includes("top-pick") || normalized.includes("toppick")) return TAG_TYPES.TOP_PICK;
    if (normalized.includes("runner-up") || normalized.includes("runnerup")) return TAG_TYPES.RUNNER_UP;
    if (normalized.includes("bad-fit") || normalized.includes("badfit")) return TAG_TYPES.BAD_FIT;
    return null;
  }
  return null;
}
const ProductTag = memo(function ProductTag2({
  tag,
  classPrefix = "omniguide-product-tag",
  className = ""
}) {
  const tagType = normalizeTagType(tag);
  if (!tagType || !TAG_CONFIG[tagType]) {
    return null;
  }
  const config = TAG_CONFIG[tagType];
  const IconComponent = config.icon;
  const tagClassName = [
    classPrefix,
    `${classPrefix}--${tagType}`,
    className
  ].filter(Boolean).join(" ");
  return /* @__PURE__ */ React.createElement("span", { className: tagClassName }, IconComponent && /* @__PURE__ */ React.createElement(IconComponent, null), /* @__PURE__ */ React.createElement("span", null, config.label));
});
const log = createScopedLogger("useSessionInit");
function useSessionInit() {
  const { config, consentService } = useOmniguideContext();
  const { apiBaseUrl, websiteId, callbacks, storageKeys } = config;
  const sessionStorageKey = (storageKeys == null ? void 0 : storageKeys.sessionId) ?? "aiSearchSessionId";
  const [sessionId, setSessionId$1] = useState(() => {
    try {
      return localStorage.getItem(sessionStorageKey) ?? null;
    } catch {
      return null;
    }
  });
  const [welcomeText, setWelcomeText] = useState("");
  const [seedQuestions, setSeedQuestions] = useState([]);
  const [aiDisabled, setAiDisabled] = useState(false);
  const [disabledReason, setDisabledReason] = useState(null);
  const [isInitialized, setIsInitialized] = useState(false);
  useEffect(() => {
    const initializeSession = async () => {
      if (callbacks == null ? void 0 : callbacks.waitForFeatureFlags) {
        await callbacks.waitForFeatureFlags();
      }
      if ((callbacks == null ? void 0 : callbacks.isFeatureEnabled) && !callbacks.isFeatureEnabled()) {
        setIsInitialized(true);
        return;
      }
      try {
        const currentSessionId = localStorage.getItem(sessionStorageKey) ?? void 0;
        let normalizedCurrentPage = getCurrentPage();
        try {
          const parsed = new URL(normalizedCurrentPage, window.location.href);
          normalizedCurrentPage = parsed.pathname.replace(/\.html$/, "");
        } catch {
          normalizedCurrentPage = normalizedCurrentPage.replace(/\.html$/, "");
        }
        const url = `${apiBaseUrl}${API_ENDPOINTS.CONVERSATIONAL_SEARCH_INIT}`;
        const response = await fetch(url, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            website_code: websiteId,
            session_id: currentSessionId,
            current_page: normalizedCurrentPage
          })
        });
        if (response.ok) {
          const raw = await response.json();
          const normalized = normalizeSessionResponse(raw);
          const validated = RestSessionResponseSchema.safeParse(normalized);
          if (validated.success) {
            const data = validated.data;
            if (data.sessionId) {
              localStorage.setItem(sessionStorageKey, data.sessionId);
              setSessionId(websiteId, data.sessionId);
              setSessionId$1(data.sessionId);
            }
            if (data.welcomeText) {
              setWelcomeText(data.welcomeText);
            }
            if (data.seedQuestions && Array.isArray(data.seedQuestions)) {
              setSeedQuestions(data.seedQuestions);
            }
            if (typeof data.aiDisabled === "boolean") {
              setAiDisabled(data.aiDisabled);
            }
            if (data.disabledReason) {
              setDisabledReason(data.disabledReason);
            }
            setFeatureStatus(websiteId, {
              aiDisabled: data.aiDisabled ?? false
            });
          }
        }
      } catch (error) {
        log.error("Failed to initialize session:", error);
        setFeatureStatus(websiteId, { aiDisabled: false });
      } finally {
        setIsInitialized(true);
      }
    };
    initializeSession();
  }, []);
  useEffect(() => {
    if (sessionId) {
      setSessionId(websiteId, sessionId);
    }
  }, [sessionId, websiteId]);
  useEffect(() => {
    if (!sessionId || !consentService) return;
    (async () => {
      await consentService.ensureInitialized(sessionId);
      consentService.startWatcher(sessionId);
    })();
    return () => {
      consentService.stopWatcher();
    };
  }, [sessionId, consentService]);
  return {
    sessionId,
    setSessionId: setSessionId$1,
    welcomeText,
    seedQuestions,
    aiDisabled,
    disabledReason,
    isInitialized
  };
}
export {
  ProductTag as P,
  useSessionInit as u
};
//# sourceMappingURL=shared-S_KeA6th.js.map
