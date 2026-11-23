import { n as nativeFetch } from "./shared-CcHKcuJS.js";
const SEND_BEACON_BODY_LIMIT_BYTES = 64 * 1024;
const DEFAULT_DEBOUNCE_MS = 250;
function createEventQueue(options) {
  const {
    endpoint,
    serialize,
    isConsentGranted,
    debounceMs = DEFAULT_DEBOUNCE_MS,
    maxQueueSize,
    flushOnPageHide = false,
    getNavigator = () => typeof navigator === "undefined" ? null : navigator,
    getFetch = () => nativeFetch,
    onFlush
  } = options;
  let pending = [];
  let timerId = null;
  let destroyed = false;
  function clearTimer() {
    if (timerId !== null) {
      clearTimeout(timerId);
      timerId = null;
    }
  }
  function scheduleFlush() {
    clearTimer();
    timerId = setTimeout(() => {
      timerId = null;
      flush();
    }, debounceMs);
  }
  function tryBeacon(body) {
    const nav = getNavigator();
    if (!nav || typeof nav.sendBeacon !== "function") return false;
    if (typeof Blob === "undefined") return false;
    const blob = new Blob([body], { type: "application/json" });
    if (blob.size > SEND_BEACON_BODY_LIMIT_BYTES) return false;
    try {
      return nav.sendBeacon(endpoint, blob);
    } catch {
      return false;
    }
  }
  function tryFetchKeepalive(body) {
    const f = getFetch();
    if (typeof f !== "function") return false;
    try {
      void f(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body,
        keepalive: true
      }).catch(() => void 0);
      return true;
    } catch {
      return false;
    }
  }
  function flush() {
    clearTimer();
    if (pending.length === 0) return "noop";
    const events = pending;
    pending = [];
    const body = serialize(events);
    let transport;
    if (tryBeacon(body)) {
      transport = "beacon";
    } else if (tryFetchKeepalive(body)) {
      transport = "fetch";
    } else {
      transport = "dropped";
    }
    onFlush == null ? void 0 : onFlush({ count: events.length, transport });
    return transport;
  }
  function enqueue(event) {
    if (destroyed) return;
    if (!isConsentGranted()) return;
    pending.push(event);
    if (typeof maxQueueSize === "number" && pending.length > maxQueueSize) {
      pending.splice(0, pending.length - maxQueueSize);
    }
    scheduleFlush();
  }
  function size() {
    return pending.length;
  }
  const pageHideHandler = flushOnPageHide && typeof window !== "undefined" && typeof window.addEventListener === "function" ? () => {
    flush();
  } : null;
  if (pageHideHandler) {
    window.addEventListener("pagehide", pageHideHandler);
  }
  function destroy() {
    flush();
    destroyed = true;
    clearTimer();
    pending = [];
    if (pageHideHandler && typeof window !== "undefined") {
      window.removeEventListener("pagehide", pageHideHandler);
    }
  }
  return { enqueue, flush, size, destroy };
}
export {
  createEventQueue as c
};
