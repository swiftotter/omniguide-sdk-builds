import { useState, useEffect } from "react";
import { C as getFeatureStatus, D as onFeatureStatusChange } from "./shared-jysnbphs.js";
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
const SETTLE_MS = 200;
const SAFETY_MS = 4e3;
function adjustContainerHeight(container, delayMs = 100) {
  let released = false;
  let startTimer = null;
  let settleTimer = null;
  let safetyTimer = null;
  let observer = null;
  let resizeObserver = null;
  const disconnectObservers = () => {
    observer == null ? void 0 : observer.disconnect();
    observer = null;
    resizeObserver == null ? void 0 : resizeObserver.disconnect();
    resizeObserver = null;
  };
  const release = () => {
    if (released) return;
    released = true;
    disconnectObservers();
    if (settleTimer !== null) {
      clearTimeout(settleTimer);
      settleTimer = null;
    }
    if (safetyTimer !== null) {
      clearTimeout(safetyTimer);
      safetyTimer = null;
    }
    container.style.minHeight = "auto";
  };
  const scheduleSettle = () => {
    if (settleTimer !== null) clearTimeout(settleTimer);
    settleTimer = setTimeout(() => {
      settleTimer = null;
      release();
    }, SETTLE_MS);
  };
  const watch = (content) => {
    if (typeof ResizeObserver !== "undefined") {
      resizeObserver = new ResizeObserver(scheduleSettle);
      resizeObserver.observe(content);
    }
    scheduleSettle();
  };
  const start = () => {
    const existing = container.firstElementChild;
    if (existing) {
      watch(existing);
      return;
    }
    observer = new MutationObserver(() => {
      const content = container.firstElementChild;
      if (!content) return;
      observer == null ? void 0 : observer.disconnect();
      observer = null;
      watch(content);
    });
    observer.observe(container, { childList: true });
  };
  startTimer = setTimeout(() => {
    startTimer = null;
    start();
  }, delayMs);
  safetyTimer = setTimeout(() => {
    safetyTimer = null;
    release();
  }, SAFETY_MS);
  return function cancel() {
    if (startTimer !== null) {
      clearTimeout(startTimer);
      startTimer = null;
    }
    if (settleTimer !== null) {
      clearTimeout(settleTimer);
      settleTimer = null;
    }
    if (safetyTimer !== null) {
      clearTimeout(safetyTimer);
      safetyTimer = null;
    }
    disconnectObservers();
  };
}
export {
  adjustContainerHeight as a,
  useFeatureStatus as u,
  watchFeatureStatus as w
};
//# sourceMappingURL=shared-CqVk8viX.js.map
