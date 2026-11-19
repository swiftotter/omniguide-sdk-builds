import { n as nativeFetch, h as sanitizeUrl, b0 as isAbortError, s as safeHref, K as markdownOf } from "./shared-B8dgHFMk.js";
import { c as createScopedLogger, b as savePercent } from "./shared-B44A3pDU.js";
import { g as CarouselResponseSchema, a as CarouselEventBatchSchema } from "./shared-Cbzgap18.js";
import { b, c } from "./shared-Cbzgap18.js";
import { useState, useRef, useEffect, useMemo, memo, useId, useCallback } from "react";
import { c as createEventQueue } from "./shared-7GSPZGwY.js";
import { jsx, jsxs } from "react/jsx-runtime";
import { P as ProductTileRating } from "./shared-D4h5fdiN.js";
import { P as PriceDisplay, u as useComponent } from "./shared-nkH5ybN7.js";
const log$5 = createScopedLogger("Carousel:fetch");
const SESSION_ID_HEADER = "X-Session-Id";
const CAROUSEL_EMPTY = Symbol.for("omniguide.carousel.empty");
class CarouselSlotNotFoundError extends Error {
  constructor(slot, websiteCode) {
    super(`Carousel slot not found: slot=${slot} website_code=${websiteCode}`);
    this.slot = slot;
    this.websiteCode = websiteCode;
    this.name = "CarouselSlotNotFoundError";
  }
}
function buildEndpoint(config, params) {
  const base = config.apiBaseUrl.replace(/\/+$/, "");
  const qs = new URLSearchParams({
    url: params.url,
    slot: params.slot,
    website_code: config.websiteCode
  });
  if (params.forcedSkus && params.forcedSkus.length > 0) {
    qs.set("forced_skus", params.forcedSkus.join(","));
  }
  return `${base}/api/v1/carousels?${qs.toString()}`;
}
async function resolveHeaders(config) {
  if (!config.getHeaders)
    return {};
  const raw = await config.getHeaders();
  if (raw instanceof Headers) {
    const out = {};
    raw.forEach((value, key) => {
      out[key] = value;
    });
    return out;
  }
  return { ...raw };
}
async function fetchCarousel(config, params, init = {}) {
  var _a;
  const url = buildEndpoint(config, params);
  const headers = {
    ...init.headers,
    Accept: "application/json",
    ...await resolveHeaders(config)
  };
  const sessionId = (_a = config.getSessionId) == null ? void 0 : _a.call(config);
  if (typeof sessionId === "string" && sessionId.length > 0) {
    headers[SESSION_ID_HEADER] = sessionId;
  }
  const fetcher = config.fetchImpl ?? nativeFetch;
  log$5.debug("GET", { slot: params.slot, websiteCode: config.websiteCode, url, hasSessionId: !!sessionId, headerKeys: Object.keys(headers) });
  const t0 = typeof performance !== "undefined" ? performance.now() : Date.now();
  const response = await fetcher(url, {
    ...init,
    method: "GET",
    headers
  });
  const elapsedMs = Math.round((typeof performance !== "undefined" ? performance.now() : Date.now()) - t0);
  log$5.debug("response", { slot: params.slot, status: response.status, elapsedMs });
  if (response.status === 204) {
    log$5.debug("204 — slot configured but empty", { slot: params.slot });
    return CAROUSEL_EMPTY;
  }
  if (response.status === 404) {
    log$5.warn("404 — slot not registered", { slot: params.slot, websiteCode: config.websiteCode });
    throw new CarouselSlotNotFoundError(params.slot, config.websiteCode);
  }
  if (!response.ok) {
    log$5.error("non-2xx", { slot: params.slot, status: response.status, statusText: response.statusText });
    throw new Error(`Carousel request failed: ${response.status} ${response.statusText}`);
  }
  let json;
  try {
    json = await response.json();
  } catch (err) {
    const detail = err instanceof Error ? err.message : String(err);
    log$5.error("JSON parse failed", { slot: params.slot, detail });
    throw new Error(`Carousel response was not valid JSON: ${detail}`);
  }
  const parsed = CarouselResponseSchema.safeParse(json);
  if (!parsed.success) {
    log$5.error("schema validation failed", { slot: params.slot, zodError: parsed.error.message, body: json });
    throw new Error("Carousel response failed schema validation");
  }
  log$5.debug("parsed", {
    slot: params.slot,
    carousel_id: parsed.data.carousel_id,
    slotsCount: parsed.data.slots.length,
    anchor: parsed.data.anchor,
    status: parsed.data.status,
    reason: parsed.data.reason
  });
  return parsed.data;
}
const log$4 = createScopedLogger("Carousel:events:transport");
function buildCarouselEventEndpoint(apiBaseUrl) {
  const endpoint = `${apiBaseUrl.replace(/\/+$/, "")}/api/v1/carousels/events`;
  log$4.debug("endpoint resolved →", endpoint);
  return endpoint;
}
function makeCarouselEventSerializer(websiteCode) {
  return (events) => {
    const batch = {
      website_code: websiteCode,
      events: [...events]
    };
    const parsed = CarouselEventBatchSchema.safeParse(batch);
    if (!parsed.success) {
      log$4.error("batch failed schema validation — sending anyway", { zodError: parsed.error.message, batch });
    }
    const body = JSON.stringify(batch);
    log$4.debug("serialize → POST batch", {
      websiteCode,
      eventCount: batch.events.length,
      eventNames: batch.events.map((e) => e.event_name),
      bytes: body.length,
      bodyPreview: body.slice(0, 600) + (body.length > 600 ? "…[truncated]" : "")
    });
    return body;
  };
}
const log$3 = createScopedLogger("Carousel:useCarousel");
function useCarousel(options) {
  const { slot, url, forcedSkus, enabled = true, ...config } = options;
  const [data, setData] = useState(null);
  const [status, setStatus] = useState("idle");
  const [error, setError] = useState(null);
  const configRef = useRef(config);
  configRef.current = config;
  useEffect(() => {
    if (!enabled) {
      log$3.debug("disabled — skipping fetch", { slot });
      setStatus("idle");
      return void 0;
    }
    const resolvedUrl = url ?? (typeof window !== "undefined" ? sanitizeUrl(window.location.href) : "");
    if (!resolvedUrl) {
      log$3.error("missing url and no window.location available", { slot });
      setStatus("error");
      setError(new Error("useCarousel: missing url and no window.location available"));
      return void 0;
    }
    const controller = new AbortController();
    let cancelled = false;
    log$3.debug("fetch start", { slot, url: resolvedUrl, forcedSkus });
    setStatus("loading");
    setError(null);
    fetchCarousel(configRef.current, { slot, url: resolvedUrl, forcedSkus }, { signal: controller.signal }).then((result) => {
      if (cancelled) {
        log$3.debug("result discarded — effect cancelled", { slot });
        return;
      }
      if (result === CAROUSEL_EMPTY) {
        log$3.debug("→ empty (204)", { slot });
        setData(null);
        setStatus("empty");
        return;
      }
      if (result.slots.length === 0) {
        log$3.debug("→ empty (zero slots)", { slot, status: result.status, reason: result.reason });
        setData(result);
        setStatus("empty");
        return;
      }
      log$3.debug("→ success", { slot, slotsCount: result.slots.length, carousel_id: result.carousel_id });
      setData(result);
      setStatus("success");
    }).catch((err) => {
      if (cancelled)
        return;
      if (isAbortError(err)) {
        log$3.debug("aborted", { slot });
        return;
      }
      if (err instanceof CarouselSlotNotFoundError) {
        log$3.warn("→ empty (404 slot not registered)", { slot });
        setData(null);
        setStatus("empty");
        setError(err);
        return;
      }
      log$3.error("→ error", { slot, err: err instanceof Error ? err.message : String(err) });
      setStatus("error");
      setError(err instanceof Error ? err : new Error(String(err)));
    });
    return () => {
      cancelled = true;
      controller.abort();
    };
  }, [enabled, slot, url, forcedSkus, config.apiBaseUrl, config.websiteCode]);
  return { data, status, error };
}
const log$2 = createScopedLogger("Carousel:events");
const ALWAYS_TRUE = () => true;
function useCarouselEvents(options) {
  const { apiBaseUrl, websiteCode, carouselId, slotCode, getSessionId, isConsentGranted = ALWAYS_TRUE, getPageUrl, createQueue = createEventQueue } = options;
  const sessionRef = useRef(getSessionId);
  sessionRef.current = getSessionId;
  const consentRef = useRef(isConsentGranted);
  consentRef.current = isConsentGranted;
  const pageUrlRef = useRef(getPageUrl);
  pageUrlRef.current = getPageUrl;
  const warnedNoSessionRef = useRef(false);
  const queue = useMemo(() => {
    const endpoint = buildCarouselEventEndpoint(apiBaseUrl);
    log$2.debug("queue created", { carouselId, slotCode, endpoint, websiteCode });
    return createQueue({
      endpoint,
      serialize: makeCarouselEventSerializer(websiteCode),
      isConsentGranted: () => consentRef.current(),
      flushOnPageHide: true,
      onFlush: ({ count, transport }) => {
        log$2.debug("FLUSH ▶ " + transport.toUpperCase() + " → " + endpoint, {
          carouselId,
          slotCode,
          eventCount: count,
          transport,
          endpoint
        });
      }
    });
  }, [apiBaseUrl, websiteCode, carouselId]);
  useEffect(() => () => queue.destroy(), [queue]);
  return useMemo(() => {
    function resolveSession() {
      const id = sessionRef.current();
      return typeof id === "string" && id.length > 0 ? id : null;
    }
    function resolvePage() {
      if (pageUrlRef.current)
        return pageUrlRef.current();
      return typeof window !== "undefined" ? sanitizeUrl(window.location.href) : "";
    }
    function makeEvent(eventName, items) {
      const sessionId = resolveSession();
      if (!sessionId) {
        if (!warnedNoSessionRef.current) {
          warnedNoSessionRef.current = true;
          log$2.warn("emit skipped — no session id (further occurrences suppressed)", {
            eventName,
            slotCode,
            carouselId
          });
        }
        return null;
      }
      return {
        event_name: eventName,
        carousel_id: carouselId,
        item_list_id: slotCode,
        items: [...items],
        timestamp: (/* @__PURE__ */ new Date()).toISOString(),
        session_id: sessionId,
        page_url: resolvePage()
      };
    }
    function emit(eventName, items) {
      const event = makeEvent(eventName, items);
      if (!event) {
        return;
      }
      log$2.debug("ENQUEUE " + eventName + " (queue size after =" + (queue.size() + 1) + ")", {
        eventName,
        slotCode,
        carouselId,
        items: event.items,
        session_id: event.session_id,
        page_url: event.page_url,
        timestamp: event.timestamp
      });
      queue.enqueue(event);
    }
    return {
      emitView: (items) => emit("view_item_list", items),
      emitSelect: (item) => emit("select_item", [item]),
      emitAddToCart: (item) => emit("add_to_cart", [item]),
      emitPurchase: (items) => emit("purchase", items),
      flush: () => {
        queue.flush();
      }
    };
  }, [queue, carouselId, slotCode]);
}
function createVisibilityTracker(options) {
  const threshold = options.threshold ?? 0.5;
  const onVisible = options.onVisible;
  let state = "IDLE";
  let observer = null;
  function fire() {
    if (state === "LOGGED")
      return;
    state = "VISIBLE";
    try {
      onVisible();
    } finally {
      state = "LOGGED";
      detach();
    }
  }
  function attach(element) {
    if (state === "LOGGED")
      return;
    if (observer)
      return;
    if (typeof IntersectionObserver === "undefined") {
      fire();
      return;
    }
    observer = new IntersectionObserver((entries) => {
      for (const entry of entries) {
        if (entry.isIntersecting && entry.intersectionRatio >= threshold) {
          fire();
          return;
        }
      }
    }, { threshold });
    observer.observe(element);
  }
  function detach() {
    if (observer) {
      observer.disconnect();
      observer = null;
    }
  }
  return {
    attach,
    detach,
    getState: () => state
  };
}
const log$1 = createScopedLogger("Carousel:visibility");
function useCarouselVisibility(ref, options) {
  const callbackRef = useRef(options.onFirstVisible);
  callbackRef.current = options.onFirstVisible;
  const threshold = options.threshold ?? 0.5;
  const enabled = options.enabled ?? true;
  const trackerRef = useRef(null);
  useEffect(() => {
    if (!enabled) {
      log$1.debug("not enabled yet — IO attach deferred");
      return void 0;
    }
    const element = ref.current;
    if (!element) {
      log$1.debug("no element on ref — IO not attached");
      return void 0;
    }
    log$1.debug("attach IntersectionObserver", { threshold, target: element.tagName });
    const tracker = createVisibilityTracker({
      threshold,
      onVisible: () => {
        log$1.debug("first visible — firing onFirstVisible callback");
        callbackRef.current();
      }
    });
    trackerRef.current = tracker;
    tracker.attach(element);
    return () => {
      log$1.debug("detach (unmount or threshold change)");
      tracker.detach();
      trackerRef.current = null;
    };
  }, [ref, threshold, enabled]);
}
function parsePrice(price, fallbackCurrency) {
  if (price == null)
    return null;
  let amount;
  let currency;
  if (typeof price === "string" || typeof price === "number") {
    amount = price;
  } else if (typeof price === "object") {
    const p = price;
    amount = p.amount;
    currency = p.currency;
  }
  if (amount == null)
    return null;
  const value = typeof amount === "number" ? amount : Number(amount);
  if (!Number.isFinite(value) || value <= 0)
    return null;
  const resolved = currency ?? fallbackCurrency ?? null;
  return { value, currency: resolved && resolved.length > 0 ? resolved : null };
}
function resolveCardPrices(product, fallbackCurrency) {
  var _a;
  const price = parsePrice(product.price, fallbackCurrency);
  const min = parsePrice(product.min_price, fallbackCurrency);
  const max = parsePrice(product.max_price, fallbackCurrency);
  const legacyFrom = ((_a = product.price) == null ? void 0 : _a.from) === true;
  const ranged = min !== null && max !== null && min.currency === max.currency && min.value < max.value;
  if (ranged)
    return { current: min, compareAt: null, isFrom: true };
  const reference = product.retail_price != null ? product.retail_price : product.compare_at_price;
  const compareAt = parsePrice(reference, fallbackCurrency);
  const discounted = !legacyFrom && price !== null && compareAt !== null && compareAt.currency === price.currency && markdownOf({ price: price.value, retail_price: compareAt.value }) !== null;
  return { current: price, compareAt: discounted ? compareAt : null, isFrom: legacyFrom };
}
function saleBadgeText(current, compareAt, onSale) {
  const pct = current && compareAt ? savePercent(compareAt.value, current.value) : null;
  if (pct !== null)
    return `Save ${pct}%`;
  return onSale === true ? "Sale" : null;
}
function cardRating(reviews) {
  const value = Number(reviews == null ? void 0 : reviews.average_rating);
  if (!(value > 0))
    return null;
  const count = Number(reviews == null ? void 0 : reviews.review_count);
  return { value: Math.min(value, 5), count: count > 0 ? count : void 0 };
}
function cardReason(slot) {
  var _a, _b, _c, _d, _e;
  const headline = ((_b = (_a = slot.narrative) == null ? void 0 : _a.headline) == null ? void 0 : _b.trim()) ?? "";
  const body = ((_d = (_c = slot.narrative) == null ? void 0 : _c.body) == null ? void 0 : _d.trim()) ?? "";
  const matchReason = ((_e = slot.match_reason) == null ? void 0 : _e.trim()) ?? "";
  if (headline)
    return { headline, body: body || matchReason };
  if (body)
    return { headline: body, body };
  return matchReason ? { headline: matchReason, body: matchReason } : null;
}
function PlusIcon({ minus = false }) {
  return jsx("svg", { width: "14", height: "14", viewBox: "0 0 14 14", fill: "none", stroke: "currentColor", strokeWidth: "1.6", strokeLinecap: "round", "aria-hidden": "true", focusable: "false", children: jsx("path", { d: minus ? "M2.5 7h9" : "M7 2.5v9M2.5 7h9" }) });
}
function ReasonPill({ reason }) {
  const [open, setOpen] = useState(false);
  const panelId = useId();
  const toggled = useRef(false);
  const focusRef = useRef(null);
  useEffect(() => {
    var _a;
    if (toggled.current)
      (_a = focusRef.current) == null ? void 0 : _a.focus();
  }, [open]);
  const toggle = (next) => {
    toggled.current = true;
    setOpen(next);
  };
  if (!open) {
    return jsxs("button", { ref: focusRef, type: "button", className: "omniguide-carousel-card__pill", "aria-expanded": false, "aria-label": `Why we picked this: ${reason.headline}`, onClick: () => toggle(true), children: [jsx("span", { className: "omniguide-carousel-card__pill-text", children: reason.headline }), jsx(PlusIcon, {})] });
  }
  return jsxs("div", { id: panelId, className: "omniguide-carousel-card__why", role: "group", "aria-label": "Why we picked this", children: [jsx("p", { className: "omniguide-carousel-card__why-headline", children: reason.headline }), reason.body && reason.body !== reason.headline ? jsx("p", { className: "omniguide-carousel-card__why-body", children: reason.body }) : null, jsx("button", { ref: focusRef, type: "button", className: "omniguide-carousel-card__why-close", "aria-expanded": true, "aria-label": "Close", onClick: () => toggle(false), children: jsx(PlusIcon, { minus: true }) })] });
}
function CarouselCardImpl({ slot, fallbackImage, onSelect, onAddToCart, position, locale = "en-US", priceFormat, defaultCurrency }) {
  var _a;
  const product = slot.product;
  const title = ((_a = product.title) == null ? void 0 : _a.trim()) || "Product";
  const url = safeHref(product.url);
  const image = product.image_url ?? fallbackImage ?? "";
  const { current: priceParsed, compareAt: compareAtParsed, isFrom: isFromPrice } = resolveCardPrices(product, defaultCurrency);
  const saleBadge = isFromPrice ? product.on_sale === true ? "Sale" : null : saleBadgeText(priceParsed, compareAtParsed, product.on_sale);
  const rating = cardRating(product.reviews);
  const reason = cardReason(slot);
  const handleLinkClick = (event) => {
    onSelect(slot);
    if (!url)
      event.preventDefault();
  };
  const imageEl = image ? jsx("img", { className: "omniguide-carousel-card__image", src: image, alt: "", loading: "lazy", decoding: "async" }) : jsx("div", { className: "omniguide-carousel-card__image-placeholder", "aria-hidden": "true" });
  return jsxs("li", { className: "omniguide-carousel-card", "data-position": position, "data-source": slot.source ?? "unknown", children: [jsxs("div", { className: "omniguide-carousel-card__media", children: [url ? jsx("a", { className: "omniguide-carousel-card__image-link", href: url, onClick: handleLinkClick, tabIndex: -1, "aria-hidden": "true", children: imageEl }) : imageEl, saleBadge ? jsx("span", { className: "omniguide-carousel-card__save-badge", children: saleBadge }) : null, reason ? jsx(ReasonPill, { reason }) : null] }), url ? jsx("a", { className: "omniguide-carousel-card__title", href: url, onClick: handleLinkClick, children: title }) : jsx("button", { type: "button", className: "omniguide-carousel-card__title", onClick: () => onSelect(slot), children: title }), jsx("div", { className: "omniguide-carousel-card__rating", children: rating ? jsx(ProductTileRating, { rating }) : null }), priceParsed ? jsxs("p", { className: "omniguide-carousel-card__price", children: [isFromPrice ? jsx("span", { className: "omniguide-carousel-card__price-prefix", children: "Starting at" }) : null, jsx(PriceDisplay, { value: priceParsed.value, currency: priceParsed.currency, locale, priceFormat, className: "omniguide-carousel-card__price-current" }), compareAtParsed ? jsxs("s", { className: "omniguide-carousel-card__price-compare", children: [jsx("span", { className: "omniguide-carousel-card__was", children: "Was " }), jsx(PriceDisplay, { value: compareAtParsed.value, currency: compareAtParsed.currency, locale, priceFormat })] }) : null] }) : null, onAddToCart ? jsx("button", { type: "button", className: "omniguide-carousel-card__cta", onClick: () => onAddToCart(slot), "aria-label": `Add ${title} to cart`, children: "Add" }) : null] });
}
const CarouselCard = memo(CarouselCardImpl);
const INITIAL_SCROLL_STATE = {
  hasOverflow: false,
  atStart: true,
  atEnd: false
};
function CarouselRow({ label, labelId, eyebrow, subheading, slots, fallbackImage, locale, onSelect, onAddToCart, priceFormat, defaultCurrency, rootRef, reserveSpace = true, headingLevel = 2 }) {
  const CarouselCard$1 = useComponent("CarouselCard", CarouselCard);
  const listRef = useRef(null);
  const [scrollState, setScrollState] = useState(INITIAL_SCROLL_STATE);
  const [reservingSpace, setReservingSpace] = useState(reserveSpace);
  useEffect(() => {
    setReservingSpace(false);
  }, []);
  const Heading = `h${headingLevel}`;
  useEffect(() => {
    const list = listRef.current;
    if (!list)
      return void 0;
    const recompute = () => {
      const overflow = list.scrollWidth - list.clientWidth > 1;
      const atStart = list.scrollLeft <= 1;
      const atEnd = list.scrollLeft + list.clientWidth >= list.scrollWidth - 2;
      setScrollState({ hasOverflow: overflow, atStart, atEnd });
    };
    recompute();
    list.addEventListener("scroll", recompute, { passive: true });
    let resizeObs = null;
    if (typeof ResizeObserver !== "undefined") {
      resizeObs = new ResizeObserver(recompute);
      resizeObs.observe(list);
    } else if (typeof window !== "undefined") {
      window.addEventListener("resize", recompute);
    }
    return () => {
      list.removeEventListener("scroll", recompute);
      if (resizeObs)
        resizeObs.disconnect();
      else if (typeof window !== "undefined")
        window.removeEventListener("resize", recompute);
    };
  }, [slots.length]);
  const scrollBy = useCallback((direction) => {
    const list = listRef.current;
    if (!list)
      return;
    const card = list.querySelector(".omniguide-carousel-card");
    const step = card ? card.getBoundingClientRect().width + 24 : list.clientWidth * 0.8;
    const reduceMotion = typeof window !== "undefined" && typeof window.matchMedia === "function" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    list.scrollBy({ left: direction === "next" ? step : -step, behavior: reduceMotion ? "auto" : "smooth" });
  }, []);
  useEffect(() => {
    const list = listRef.current;
    if (!list)
      return void 0;
    const viewport = list.parentElement;
    if (!viewport)
      return void 0;
    let armed = false;
    let dragging = false;
    let suppressClick = false;
    let startX = 0;
    let startScroll = 0;
    let pointerId = null;
    const DRAG_THRESHOLD_PX = 5;
    const onPointerDown = (e) => {
      if (e.button !== 0 || e.pointerType === "touch")
        return;
      const target = e.target;
      if (target) {
        const interactive = target.closest('button, a, input, select, textarea, [role="button"]');
        const cardLink = target.closest(".omniguide-carousel-card__image-link, a.omniguide-carousel-card__title");
        if (interactive && interactive !== cardLink)
          return;
      }
      armed = true;
      dragging = false;
      suppressClick = false;
      startX = e.clientX;
      startScroll = list.scrollLeft;
      pointerId = e.pointerId;
    };
    const onPointerMove = (e) => {
      if (!armed)
        return;
      const dx = e.clientX - startX;
      if (!dragging) {
        if (Math.abs(dx) <= DRAG_THRESHOLD_PX)
          return;
        dragging = true;
        suppressClick = true;
        try {
          list.setPointerCapture(e.pointerId);
        } catch {
        }
        viewport.classList.add("is-dragging");
      }
      list.scrollLeft = startScroll - dx;
    };
    const endDrag = (e) => {
      if (!armed)
        return;
      const wasDragging = dragging;
      armed = false;
      dragging = false;
      if (wasDragging) {
        try {
          if (pointerId !== null)
            list.releasePointerCapture(pointerId);
        } catch {
        }
        viewport.classList.remove("is-dragging");
      }
      pointerId = null;
      if (suppressClick) {
        const onClickCapture = (ev) => {
          ev.stopPropagation();
          ev.preventDefault();
          list.removeEventListener("click", onClickCapture, true);
        };
        list.addEventListener("click", onClickCapture, true);
        setTimeout(() => list.removeEventListener("click", onClickCapture, true), 0);
      }
    };
    list.addEventListener("pointerdown", onPointerDown);
    list.addEventListener("pointermove", onPointerMove);
    list.addEventListener("pointerup", endDrag);
    list.addEventListener("pointercancel", endDrag);
    return () => {
      list.removeEventListener("pointerdown", onPointerDown);
      list.removeEventListener("pointermove", onPointerMove);
      list.removeEventListener("pointerup", endDrag);
      list.removeEventListener("pointercancel", endDrag);
      viewport.classList.remove("is-dragging");
    };
  }, [slots.length]);
  return jsxs("section", { ref: rootRef, className: "omniguide-carousel" + (reservingSpace ? " omniguide-carousel--reserving-space" : ""), "aria-labelledby": labelId, "data-overflow": scrollState.hasOverflow ? "true" : "false", "data-at-start": scrollState.atStart ? "true" : "false", "data-at-end": scrollState.atEnd ? "true" : "false", children: [jsxs("header", { className: "omniguide-carousel__header", children: [jsxs("div", { className: "omniguide-carousel__heading", children: [eyebrow ? jsx("p", { className: "omniguide-carousel__eyebrow", children: eyebrow }) : null, jsx(Heading, { id: labelId, className: "omniguide-carousel__label", children: label }), subheading ? jsx("p", { className: "omniguide-carousel__subheading", children: subheading }) : null] }), scrollState.hasOverflow ? jsxs("div", { className: "omniguide-carousel__controls", children: [jsx("button", { type: "button", className: "omniguide-carousel__chevron omniguide-carousel__chevron--prev", "aria-label": "Previous products", onClick: () => scrollBy("prev"), disabled: scrollState.atStart, children: jsx("svg", { viewBox: "0 0 16 16", width: "16", height: "16", focusable: "false", children: jsx("path", { d: "M10 13L5 8l5-5", stroke: "currentColor", strokeWidth: "1.5", fill: "none", strokeLinecap: "round", strokeLinejoin: "round" }) }) }), jsx("button", { type: "button", className: "omniguide-carousel__chevron omniguide-carousel__chevron--next", "aria-label": "Next products", onClick: () => scrollBy("next"), disabled: scrollState.atEnd, children: jsx("svg", { viewBox: "0 0 16 16", width: "16", height: "16", focusable: "false", children: jsx("path", { d: "M6 3l5 5-5 5", stroke: "currentColor", strokeWidth: "1.5", fill: "none", strokeLinecap: "round", strokeLinejoin: "round" }) }) })] }) : null] }), jsxs("div", { className: "omniguide-carousel__viewport", "aria-hidden": "false", children: [jsx("ul", { ref: listRef, className: "omniguide-carousel__list", children: slots.map((slot, idx) => jsx(CarouselCard$1, { slot, position: slot.position ?? idx + 1, fallbackImage, locale, onSelect, onAddToCart, priceFormat, defaultCurrency }, `${slot.product.sku}-${slot.position ?? idx}`)) }), jsx("span", { className: "omniguide-carousel__fade omniguide-carousel__fade--left", "aria-hidden": "true" }), jsx("span", { className: "omniguide-carousel__fade omniguide-carousel__fade--right", "aria-hidden": "true" })] })] });
}
function CarouselRowSkeletonImpl({ label, count = 5 }) {
  const cards = Array.from({ length: count }, (_, idx) => idx);
  return jsxs("section", { className: "omniguide-carousel omniguide-carousel--loading omniguide-carousel--reserving-space", "aria-busy": "true", "aria-label": label ?? "Loading recommendations", children: [label ? jsx("header", { className: "omniguide-carousel__header", children: jsx("h2", { className: "omniguide-carousel__label", children: label }) }) : null, jsx("ul", { className: "omniguide-carousel__list", children: cards.map((idx) => jsxs("li", { className: "omniguide-carousel-card omniguide-carousel-card--skeleton", children: [jsx("div", { className: "omniguide-carousel-card__skeleton-narrative" }), jsx("div", { className: "omniguide-carousel-card__skeleton-image" }), jsx("div", { className: "omniguide-carousel-card__skeleton-title" }), jsx("div", { className: "omniguide-carousel-card__skeleton-price" })] }, idx)) })] });
}
const CarouselRowSkeleton = memo(CarouselRowSkeletonImpl);
const log = createScopedLogger("Carousel:container");
function anchorSubheading(template) {
  var _a, _b;
  if (!template || !template.includes("{product}"))
    return template || void 0;
  if (typeof document === "undefined")
    return void 0;
  const name = (_b = (_a = document.querySelector('meta[property="og:title"]')) == null ? void 0 : _a.getAttribute("content")) == null ? void 0 : _b.trim();
  return name ? template.split("{product}").join(name) : void 0;
}
function CarouselContainer(props) {
  const {
    slot,
    label,
    eyebrow,
    subheading: subheadingTemplate,
    onAddToCart,
    url,
    forcedSkus,
    fallbackImage,
    locale,
    visibilityThreshold,
    skipVisibilityGate = false,
    isConsentGranted,
    enabled = true,
    priceFormat,
    defaultCurrency,
    // Destructured, not left in the rest: `fetchConfig` is spread straight into
    // useCarousel, and a stray UI flag has no business reaching the fetch.
    showLoadingSkeleton = true,
    headingLevel,
    ...fetchConfig
  } = props;
  const CarouselRow$1 = useComponent("CarouselRow", CarouselRow);
  const CarouselRowSkeleton$1 = useComponent("CarouselRowSkeleton", CarouselRowSkeleton);
  const labelId = useId();
  const rootRef = useRef(null);
  const { data, status } = useCarousel({
    ...fetchConfig,
    slot,
    url,
    forcedSkus,
    enabled
  });
  const carouselId = (data == null ? void 0 : data.carousel_id) ?? "";
  const subheading = anchorSubheading(subheadingTemplate);
  const events = useCarouselEvents({
    apiBaseUrl: fetchConfig.apiBaseUrl,
    websiteCode: fetchConfig.websiteCode,
    carouselId,
    slotCode: slot,
    getSessionId: fetchConfig.getSessionId ?? (() => null),
    isConsentGranted
  });
  const fireView = useCallback(() => {
    if (!data || data.slots.length === 0)
      return;
    events.emitView(data.slots.map((s) => ({
      item_id: s.product.sku,
      index: s.position
    })));
  }, [data, events]);
  const firedImmediateRef = useRef(false);
  useCarouselVisibility(skipVisibilityGate ? { current: null } : rootRef, {
    threshold: visibilityThreshold,
    onFirstVisible: fireView,
    enabled: status === "success"
  });
  useEffect(() => {
    if (!skipVisibilityGate)
      return;
    if (firedImmediateRef.current)
      return;
    if (status !== "success")
      return;
    if (!data || data.slots.length === 0)
      return;
    log.debug("skipVisibilityGate=true — firing view immediately on data load", { slot });
    firedImmediateRef.current = true;
    fireView();
  }, [skipVisibilityGate, status, data, fireView, slot]);
  const handleSelect = useCallback((chosenSlot) => {
    events.emitSelect({
      item_id: chosenSlot.product.sku,
      index: chosenSlot.position
    });
  }, [events]);
  const slots = useMemo(() => (data == null ? void 0 : data.slots) ?? [], [data]);
  useEffect(() => () => events.flush(), [events]);
  useEffect(() => {
    log.debug("render decision", {
      slot,
      status,
      enabled,
      slotsCount: slots.length,
      carousel_id: (data == null ? void 0 : data.carousel_id) ?? null
    });
  }, [slot, status, enabled, slots.length, data == null ? void 0 : data.carousel_id]);
  if (!enabled)
    return null;
  if (status === "loading" || status === "idle") {
    return showLoadingSkeleton ? jsx(CarouselRowSkeleton$1, { label }) : null;
  }
  if (status === "empty" || status === "error" || slots.length === 0) {
    return null;
  }
  return jsx(CarouselRow$1, {
    label,
    labelId,
    eyebrow,
    subheading,
    slots,
    fallbackImage,
    locale,
    onSelect: handleSelect,
    onAddToCart,
    priceFormat,
    defaultCurrency,
    rootRef,
    // A caller that turned off the skeleton did so because this row is a
    // guest somewhere that must not jump. The 460px first-paint floor is the
    // same jump by another route, so it goes with it.
    reserveSpace: showLoadingSkeleton,
    headingLevel
  });
}
export {
  CAROUSEL_EMPTY,
  CarouselCard,
  CarouselContainer,
  CarouselEventBatchSchema,
  b as CarouselEventItemSchema,
  c as CarouselEventSchema,
  CarouselResponseSchema,
  CarouselRow,
  CarouselRowSkeleton,
  CarouselSlotNotFoundError,
  SESSION_ID_HEADER,
  buildCarouselEventEndpoint,
  createVisibilityTracker,
  fetchCarousel,
  makeCarouselEventSerializer,
  useCarousel,
  useCarouselEvents,
  useCarouselVisibility
};
