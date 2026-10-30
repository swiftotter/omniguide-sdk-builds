const SEARCH_ICON_VIEWBOX = "0 0 20.5627 20.5674";
const SEARCH_ICON_BOX = "21";
const SEARCH_ICON_PATHS = `<path d="M9.4953 2C8.01204 2 6.56162 2.43967 5.32831 3.26367C2.83318 4.93087 1.55452 8.01993 2.13983 10.9629C2.42923 12.4177 3.14271 13.7548 4.19159 14.8037C6.31348 16.9255 9.59339 17.5769 12.3654 16.4287C15.1387 15.2798 16.9953 12.5021 16.9953 9.5H18.9953C18.9953 10.8103 18.7176 12.1086 18.197 13.3018C17.5727 14.7328 17.593 16.4891 18.6971 17.5929L20.5627 19.458L19.4533 20.5674L17.5853 18.6994C16.4819 17.5959 14.7266 17.5782 13.292 18.1923C9.7981 19.6879 5.55216 18.9923 2.77753 16.2178C1.44898 14.8892 0.544506 13.1962 0.177917 11.3535C-0.563569 7.62581 1.05663 3.71231 4.21698 1.60059C5.77919 0.55682 7.61648 0 9.4953 0V2Z" fill="currentColor"/>
  <path d="M13.7531 0.0488281C13.8338 4.32301 14.6717 5.16046 18.9455 5.24121C19.0082 5.73809 19.0081 6.26091 18.9455 6.75781C14.6719 6.83856 13.8339 7.67665 13.7531 11.9502C13.2563 12.0129 12.7333 12.0129 12.2365 11.9502C12.1558 7.67642 11.3183 6.83848 7.04413 6.75781C6.98149 6.26096 6.98141 5.73804 7.04413 5.24121C11.3185 5.16054 12.1558 4.32324 12.2365 0.0488281C12.7333 -0.0138614 13.2563 -0.0138114 13.7531 0.0488281Z" fill="currentColor"/>`;
const DEFAULT_SEARCH_ICON = `<svg width="${SEARCH_ICON_BOX}" height="${SEARCH_ICON_BOX}" viewBox="${SEARCH_ICON_VIEWBOX}" fill="none" xmlns="http://www.w3.org/2000/svg">
  ${SEARCH_ICON_PATHS}
</svg>`;
const TRIGGER_STYLE_ID = "omniguide-search-trigger-styles";
const RETURN_FOCUS = "data-omniguide-return-focus";
function rememberOpener(input) {
  forgetOpener();
  input.setAttribute(RETURN_FOCUS, "");
}
function forgetOpener() {
  document.querySelectorAll(`[${RETURN_FOCUS}]`).forEach((el) => el.removeAttribute(RETURN_FOCUS));
}
function addTrackedListener(listeners, element, event, handler, options) {
  element.addEventListener(event, handler, options);
  listeners.push({ element, event, handler, options });
}
function removeTrackedListeners(listeners) {
  for (const { element, event, handler, options } of listeners) {
    element.removeEventListener(event, handler, options);
  }
  listeners.length = 0;
}
function injectSearchStyles(selectors, rootId, noScrollLock = false) {
  if (document.getElementById(TRIGGER_STYLE_ID)) return;
  const quickSearchResults = (selectors == null ? void 0 : selectors.quickSearchResults) ?? '.quickSearchResults, [data-search="quickResults"]';
  const quickSearchSelectors = quickSearchResults.split(",").map((s) => `body.ai-search-active ${s.trim()}`).join(",\n    ");
  const style = document.createElement("style");
  style.id = TRIGGER_STYLE_ID;
  style.textContent = `
    ${quickSearchSelectors} {
      display: none !important;
    }
    ${noScrollLock ? "" : `body.ai-search-active {
      overflow: hidden;
    }`}
    #${rootId} {
      z-index: 10000;
    }
  `;
  document.head.appendChild(style);
}
const DEFAULT_ICON_MAX_SIZE = "20px";
function readHostIconStyle(svg) {
  const cs = getComputedStyle(svg);
  return { fill: cs.fill, verticalAlign: cs.verticalAlign };
}
function buildDefaultIcon() {
  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  svg.setAttribute("width", SEARCH_ICON_BOX);
  svg.setAttribute("height", SEARCH_ICON_BOX);
  svg.setAttribute("viewBox", SEARCH_ICON_VIEWBOX);
  svg.setAttribute("fill", "none");
  svg.setAttribute("aria-hidden", "true");
  svg.innerHTML = SEARCH_ICON_PATHS;
  return svg;
}
function sizeDefaultIcon(svg) {
  svg.style.maxWidth = DEFAULT_ICON_MAX_SIZE;
  svg.style.height = "auto";
  svg.style.alignSelf = "center";
}
const UNUSABLE_HOST_FILL = /^(none|transparent|rgb\(0,\s*0,\s*0\)|rgba\([^)]*,\s*0(\.0+)?\s*\))$/i;
function applyHostFill(svg, hostFill) {
  if (hostFill && !UNUSABLE_HOST_FILL.test(hostFill)) {
    svg.style.color = hostFill;
  }
}
function alignIconToHost(svg, hostVerticalAlign) {
  const stated = hostVerticalAlign && hostVerticalAlign !== "baseline";
  svg.style.verticalAlign = stated ? hostVerticalAlign : "middle";
}
function parseSvg(markup) {
  const temp = document.createElement("div");
  temp.innerHTML = markup;
  const svg = temp.querySelector("svg");
  if (svg && (temp.children.length !== 1 || temp.firstElementChild !== svg)) {
    console.warn("[Omniguide] search.icon contained markup outside the <svg>; only the <svg> is used.");
  }
  return svg;
}
function resolveReplacementIcon(iconSvg, host) {
  const customIcon = iconSvg ? parseSvg(iconSvg) : null;
  if (iconSvg && !customIcon) {
    console.warn("[Omniguide] search.icon is not parseable SVG markup — falling back to the built-in icon.");
  }
  if (customIcon) return customIcon;
  const icon = buildDefaultIcon();
  sizeDefaultIcon(icon);
  applyHostFill(icon, host.fill);
  alignIconToHost(icon, host.verticalAlign);
  return icon;
}
function displacedIconName(svg) {
  var _a, _b, _c;
  const title = (_b = (_a = svg.querySelector("title")) == null ? void 0 : _a.textContent) == null ? void 0 : _b.trim();
  if (title) return title;
  return ((_c = svg.getAttribute("aria-label")) == null ? void 0 : _c.trim()) ?? "";
}
function hasOwnAccessibleName(control) {
  var _a, _b, _c, _d;
  if ((_a = control.getAttribute("aria-label")) == null ? void 0 : _a.trim()) return true;
  if ((_b = control.getAttribute("aria-labelledby")) == null ? void 0 : _b.trim()) return true;
  if ((_c = control.getAttribute("title")) == null ? void 0 : _c.trim()) return true;
  const clone = control.cloneNode(true);
  clone.querySelectorAll("svg").forEach((el) => el.remove());
  return !!((_d = clone.textContent) == null ? void 0 : _d.trim());
}
function preserveAccessibleName(control, displaced) {
  if (hasOwnAccessibleName(control)) return;
  const name = displacedIconName(displaced);
  if (name) control.setAttribute("aria-label", name);
}
function swapSearchIcon(selectors, iconSvg) {
  const expandSelector = (selectors == null ? void 0 : selectors.searchExpandButton) ?? "#quick-search-expand";
  const searchExpand = document.querySelector(expandSelector);
  if (!searchExpand) return null;
  const existingSvg = searchExpand.querySelector("svg");
  if (!existingSvg) return null;
  const host = readHostIconStyle(existingSvg);
  preserveAccessibleName(searchExpand, existingSvg);
  existingSvg.replaceWith(resolveReplacementIcon(iconSvg, host));
  return searchExpand;
}
function isWordPressEnvironment(selectors) {
  var _a;
  const wpSearchButton = ((_a = selectors == null ? void 0 : selectors.wordpress) == null ? void 0 : _a.searchButton) ?? ".header-search-btn";
  return window.location.pathname.includes("/blog") || document.querySelector(wpSearchButton) !== null || document.body.classList.contains("blog");
}
function overrideWordPressSearch(selectors, openSearch, listeners) {
  const wp = (selectors == null ? void 0 : selectors.wordpress) ?? {};
  const wpSearchButton = wp.searchButton ?? ".header-search-btn";
  const wpSearchForms = wp.searchForms ?? ".header-search form, form.search-form";
  const wpSearchInputs = wp.searchInputs ?? '.header-search input[type="search"], .search-field';
  document.querySelectorAll(wpSearchButton).forEach((button) => {
    addTrackedListener(listeners, button, "click", ((e) => {
      e.preventDefault();
      e.stopImmediatePropagation();
      openSearch("", "wordpress_search_button");
    }), true);
  });
  document.querySelectorAll(wpSearchForms).forEach((form) => {
    addTrackedListener(listeners, form, "submit", ((e) => {
      e.preventDefault();
      e.stopImmediatePropagation();
      const input = form.querySelector('input[type="search"], .search-field');
      const query = (input == null ? void 0 : input.value) ?? "";
      openSearch(query, "wordpress_search_form_submit");
      if (input) input.value = "";
    }), true);
  });
  document.querySelectorAll(wpSearchInputs).forEach((input) => {
    addTrackedListener(listeners, input, "focus", ((e) => {
      var _a;
      rememberOpener(e.target);
      e.preventDefault();
      e.stopImmediatePropagation();
      (_a = e.target) == null ? void 0 : _a.blur();
      openSearch("", "wordpress_search_input_focus");
    }), true);
  });
}
function overrideDesktopSearch(selectors, openSearch, listeners) {
  const searchToggles = (selectors == null ? void 0 : selectors.searchToggles) ?? '.navUser-action--quickSearch, [aria-label="Search toggle"]';
  const searchInputs = (selectors == null ? void 0 : selectors.searchInputs) ?? 'input[name="search_query"]';
  const searchForms = (selectors == null ? void 0 : selectors.searchForms) ?? 'form[action="/search.php"], form[data-search="quickSearch"]';
  const mobileMenu = (selectors == null ? void 0 : selectors.mobileMenu) ?? "#mobileMenu, .mobileMenu-search";
  document.querySelectorAll(searchToggles).forEach((toggle) => {
    addTrackedListener(listeners, toggle, "click", ((e) => {
      e.preventDefault();
      e.stopImmediatePropagation();
      openSearch("", "nav_search_button");
    }), true);
  });
  const isInMobileMenu = (el) => {
    const menuSelectors = mobileMenu.split(",").map((s) => s.trim());
    return menuSelectors.some((selector) => el.closest(selector));
  };
  document.querySelectorAll(searchInputs).forEach((input) => {
    if (isInMobileMenu(input)) return;
    const open = (el) => {
      rememberOpener(el);
      el.blur();
      const query = el.value;
      el.value = "";
      openSearch(query, "search_input_focus");
    };
    addTrackedListener(listeners, input, "focus", ((e) => {
      e.preventDefault();
      e.stopImmediatePropagation();
      open(e.target);
    }), true);
    if (document.activeElement === input) open(input);
  });
  document.querySelectorAll(searchForms).forEach((form) => {
    if (isInMobileMenu(form)) return;
    addTrackedListener(listeners, form, "submit", ((e) => {
      e.preventDefault();
      e.stopImmediatePropagation();
      const firstInputSelector = (searchInputs.split(",")[0] ?? searchInputs).trim();
      const input = form.querySelector(firstInputSelector);
      const query = (input == null ? void 0 : input.value) ?? "";
      openSearch(query, "search_form_submit");
      if (input) input.value = "";
    }), true);
  });
}
function setupMobileSearch(config, openSearch) {
  var _a, _b, _c, _d;
  const replacementId = "ai-mobile-search-replacement";
  const styleId = "ai-mobile-search-styles";
  const breakpoint = ((_b = (_a = config.ui) == null ? void 0 : _a.mobile) == null ? void 0 : _b.breakpoint) ?? 767;
  const searchWidth = ((_d = (_c = config.ui) == null ? void 0 : _c.mobile) == null ? void 0 : _d.searchWidth) ?? "80%";
  if (!document.getElementById(styleId)) {
    const style = document.createElement("style");
    style.id = styleId;
    style.textContent = `
      @media (max-width: ${breakpoint}px) {
        .navPages-quickSearch form,
        .navPages-quickSearch input,
        .navPages-quickSearch button[type="submit"] {
          display: none !important;
        }
        #${replacementId} {
          display: flex !important;
        }
        body.ai-search-active {
          position: fixed;
          width: 100%;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          overflow: hidden;
        }
      }
      @media (min-width: ${breakpoint + 1}px) {
        #${replacementId} {
          display: none !important;
        }
      }
    `;
    document.head.appendChild(style);
  }
  function createSearchReplacement() {
    const container = document.createElement("div");
    container.id = replacementId;
    container.setAttribute("role", "button");
    container.setAttribute("aria-label", "Open conversational search");
    container.setAttribute("tabindex", "0");
    Object.assign(container.style, {
      display: "flex",
      alignItems: "center",
      gap: "8px",
      padding: "8px 16px",
      backgroundColor: "#f5f5f5",
      border: "1px solid #ddd",
      borderRadius: "8px",
      cursor: "pointer",
      width: searchWidth,
      transition: "all 0.2s ease"
    });
    const iconSvg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    iconSvg.setAttribute("viewBox", "0 0 24 24");
    iconSvg.setAttribute("fill", "none");
    iconSvg.setAttribute("stroke", "currentColor");
    iconSvg.setAttribute("stroke-width", "2");
    iconSvg.setAttribute("stroke-linecap", "round");
    iconSvg.setAttribute("stroke-linejoin", "round");
    Object.assign(iconSvg.style, { width: "20px", height: "20px", flexShrink: "0", color: "#666" });
    const circle = document.createElementNS("http://www.w3.org/2000/svg", "circle");
    circle.setAttribute("cx", "11");
    circle.setAttribute("cy", "11");
    circle.setAttribute("r", "8");
    const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
    path.setAttribute("d", "m21 21-4.35-4.35");
    iconSvg.appendChild(circle);
    iconSvg.appendChild(path);
    const text = document.createElement("span");
    Object.assign(text.style, {
      fontSize: "14px",
      color: "#333",
      whiteSpace: "nowrap",
      overflow: "hidden",
      textOverflow: "ellipsis"
    });
    text.textContent = "Conversational Search";
    container.appendChild(iconSvg);
    container.appendChild(text);
    container.addEventListener("mouseenter", () => {
      container.style.backgroundColor = "#e8e8e8";
      container.style.borderColor = "#ccc";
    });
    container.addEventListener("mouseleave", () => {
      container.style.backgroundColor = "#f5f5f5";
      container.style.borderColor = "#ddd";
    });
    container.addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();
      openSearch("", "mobile_menu_search");
    });
    container.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        openSearch("", "mobile_menu_search_keyboard");
      }
    });
    return container;
  }
  function replaceSearchBar() {
    if (document.getElementById(replacementId)) return true;
    const searchContainer = document.querySelector(".navPages-quickSearch");
    if (!searchContainer) return false;
    const replacement = createSearchReplacement();
    searchContainer.innerHTML = "";
    searchContainer.appendChild(replacement);
    requestAnimationFrame(() => {
      replacement.style.width = "auto";
      requestAnimationFrame(() => {
        replacement.style.width = searchWidth;
      });
    });
    return true;
  }
  let retryTimer;
  if (!replaceSearchBar()) {
    retryTimer = setTimeout(replaceSearchBar, 100);
  }
  const observer = new MutationObserver(() => {
    const searchContainer = document.querySelector(".navPages-quickSearch");
    if (searchContainer && !document.getElementById(replacementId)) {
      replaceSearchBar();
    }
  });
  observer.observe(document.body, { childList: true, subtree: true });
  return {
    destroy() {
      var _a2, _b2;
      clearTimeout(retryTimer);
      (_a2 = document.getElementById(replacementId)) == null ? void 0 : _a2.remove();
      (_b2 = document.getElementById(styleId)) == null ? void 0 : _b2.remove();
      observer.disconnect();
    }
  };
}
function setupSearchTrigger(config, onOpenSearch) {
  var _a, _b, _c, _d, _e, _f, _g;
  const listeners = [];
  const rootId = ((_a = config.selectors) == null ? void 0 : _a.rootContainer) ?? "ai-search-root";
  let triggerElement = null;
  let customCleanup = null;
  let mobileCleanup = null;
  let reservedGutter = false;
  const releaseBody = () => {
    if (document.body.getAttribute("data-omniguide-search") !== config.websiteId) return;
    document.body.classList.remove("ai-search-active");
    document.body.removeAttribute("data-omniguide-search");
    if (reservedGutter) document.documentElement.style.scrollbarGutter = "";
    reservedGutter = false;
  };
  const closeSearch = () => {
    releaseBody();
    window.dispatchEvent(new CustomEvent("closeAISearch", {
      detail: { websiteId: config.websiteId }
    }));
  };
  const openSearch = (query = "", source = "unknown") => {
    const root = document.documentElement;
    if (!root.style.scrollbarGutter && window.innerWidth > root.clientWidth) {
      root.style.scrollbarGutter = "stable";
      reservedGutter = true;
    }
    if (!source.endsWith("_input_focus")) forgetOpener();
    document.body.classList.add("ai-search-active");
    document.body.setAttribute("data-omniguide-search", config.websiteId);
    onOpenSearch(query, source);
  };
  injectSearchStyles(config.selectors, rootId, !!config.anchoredSearch || !!((_b = config.ui) == null ? void 0 : _b.searchSheet));
  if (config.renderTrigger && ((_c = config.replace) == null ? void 0 : _c.selector)) {
    const mount = document.querySelector(config.replace.selector);
    if (mount) {
      triggerElement = mount;
      customCleanup = config.renderTrigger({
        mount,
        open: (query) => openSearch(query ?? "", "custom_trigger"),
        close: closeSearch
      });
    }
  } else if ((_d = config.replace) == null ? void 0 : _d.selector) {
    const mount = document.querySelector(config.replace.selector);
    if (mount) {
      triggerElement = mount;
      const strategy = config.replace.strategy ?? "replace";
      const btn = document.createElement("button");
      btn.type = "button";
      btn.setAttribute("aria-label", "AI Search");
      btn.innerHTML = config.icon ?? DEFAULT_SEARCH_ICON;
      btn.style.cssText = "cursor:pointer;background:none;border:none;padding:0;display:inline-flex;align-items:center;";
      addTrackedListener(listeners, btn, "click", () => openSearch("", "custom_selector_trigger"));
      if (strategy === "replace") {
        mount.replaceWith(btn);
        triggerElement = btn;
      } else if (strategy === "append") {
        mount.appendChild(btn);
        triggerElement = btn;
      } else if (strategy === "before") {
        (_e = mount.parentNode) == null ? void 0 : _e.insertBefore(btn, mount);
        triggerElement = btn;
      } else if (strategy === "after") {
        (_f = mount.parentNode) == null ? void 0 : _f.insertBefore(btn, mount.nextSibling);
        triggerElement = btn;
      }
    }
  } else {
    triggerElement = swapSearchIcon(config.selectors, config.icon);
    const takeHeaderBox = ((_g = config.ui) == null ? void 0 : _g.typeahead) || window.innerWidth > 767;
    if (takeHeaderBox && isWordPressEnvironment(config.selectors)) {
      overrideWordPressSearch(config.selectors, openSearch, listeners);
    } else if (takeHeaderBox) {
      overrideDesktopSearch(config.selectors, openSearch, listeners);
    }
    mobileCleanup = setupMobileSearch(config, openSearch);
  }
  const handleClose = ((e) => {
    var _a2;
    if (((_a2 = e.detail) == null ? void 0 : _a2.websiteId) && e.detail.websiteId !== config.websiteId) return;
    releaseBody();
  });
  window.addEventListener("closeAISearch", handleClose);
  return {
    openSearch,
    addIntentListeners(onIntent) {
      var _a2;
      let fired = false;
      const intentHandler = () => {
        if (fired) return;
        fired = true;
        onIntent();
      };
      const intentListeners = [];
      if (triggerElement) {
        addTrackedListener(intentListeners, triggerElement, "mouseenter", intentHandler);
        addTrackedListener(intentListeners, triggerElement, "focusin", intentHandler);
      }
      const searchToggles = ((_a2 = config.selectors) == null ? void 0 : _a2.searchToggles) ?? '.navUser-action--quickSearch, [aria-label="Search toggle"]';
      document.querySelectorAll(searchToggles).forEach((toggle) => {
        addTrackedListener(intentListeners, toggle, "mouseenter", intentHandler);
        addTrackedListener(intentListeners, toggle, "focusin", intentHandler);
      });
      const keyHandler = ((e) => {
        if ((e.metaKey || e.ctrlKey) && e.key === "k") {
          intentHandler();
        }
      });
      addTrackedListener(intentListeners, document, "keydown", keyHandler);
      return () => removeTrackedListeners(intentListeners);
    },
    destroy() {
      var _a2;
      removeTrackedListeners(listeners);
      window.removeEventListener("closeAISearch", handleClose);
      if (typeof customCleanup === "function") customCleanup();
      mobileCleanup == null ? void 0 : mobileCleanup.destroy();
      (_a2 = document.getElementById(TRIGGER_STYLE_ID)) == null ? void 0 : _a2.remove();
    }
  };
}
const loadedCss = /* @__PURE__ */ new Set();
function loadCss(url) {
  if (loadedCss.has(url)) return Promise.resolve();
  loadedCss.add(url);
  return new Promise((resolve, reject) => {
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = url;
    link.onload = () => resolve();
    link.onerror = () => reject(new Error(`[Omniguide] Failed to load CSS: ${url}`));
    document.head.appendChild(link);
  });
}
function prefetchCss(url) {
  if (loadedCss.has(url)) return;
  if (document.querySelector(`link[rel="preload"][href="${url}"]`)) return;
  const link = document.createElement("link");
  link.rel = "preload";
  link.as = "style";
  link.href = url;
  document.head.appendChild(link);
}
let reactPromise = null;
async function ensureReact() {
  if (window.React && window.ReactDOM) return;
  if (reactPromise) return reactPromise;
  const base = new URL("data:video/mp2t;base64,LyoqCiAqIEBzd2lmdG90dGVyL29tbmlndWlkZS1idW5kbGUKICoKICogUHJlLWJ1aWx0IFVNRCBidW5kbGUgZm9yIE9tbmlndWlkZSBBSSBTREsuCiAqIFdvcmtzIHZpYSA8c2NyaXB0PiB0YWcg4oCUIG5vIGJ1aWxkIHRvb2xpbmcgcmVxdWlyZWQuCiAqCiAqIFVzYWdlOgogKiAgIDxsaW5rIHJlbD0ic3R5bGVzaGVldCIgaHJlZj0ib21uaWd1aWRlLXNkay5jc3MiPgogKiAgIDxzY3JpcHQgc3JjPSJvbW5pZ3VpZGUtc2RrLnN0YW5kYWxvbmUuanMiPjwvc2NyaXB0PgogKiAgIDxzY3JpcHQ+CiAqICAgICBPbW5pZ3VpZGUuaW5pdCh7IHdlYnNpdGVJZDogJ2h0dHBzOi8vbXlzdG9yZS5jb20vJyB9KTsKICogICA8L3NjcmlwdD4KICoKICogT3IgZGVjbGFyYXRpdmVseToKICogICA8c2NyaXB0IHNyYz0ib21uaWd1aWRlLXNkay5zdGFuZGFsb25lLmpzIiBkYXRhLW9tbmlndWlkZS1jb25maWc9J3sid2Vic2l0ZUlkIjoiaHR0cHM6Ly9teXN0b3JlLmNvbS8ifSc+PC9zY3JpcHQ+CiAqLwoKLy8gU2lkZS1lZmZlY3QgaW1wb3J0OiBleHRyYWN0cyBDU1MgaW50byBvbW5pZ3VpZGUtc2RrLmNzcwppbXBvcnQgJ0Bzd2lmdG90dGVyL29tbmlndWlkZS1zdHlsZXMnOwoKaW1wb3J0IHsKICBsb2dnZXIsCiAgaW5pdFByZXZpZXdGcm9tUXVlcnlQYXJhbSwKICBzZXRQcmV2aWV3QXBpVXJsLAogIGNsZWFyUHJldmlld0FwaVVybCwKICBpc1ByZXZpZXdNb2RlLAogIHNldEN1cnJlbnRQYWdlT3ZlcnJpZGUsCiAgc3RhcnREYXRhTGF5ZXJCcmlkZ2UsCiAgLy8gSW1wb3J0ZWQsIG5vdCBqdXN0IHJlLWV4cG9ydGVkOiBgZXhwb3J0IHsgeCB9IGZyb20gJ+KApidgIGNyZWF0ZXMgbm8gbG9jYWwKICAvLyBiaW5kaW5nLCBhbmQgdGhlIHdpbmRvdy5PbW5pZ3VpZGUgbGl0ZXJhbCBiZWxvdyBuZWVkcyB0aGUgdmFsdWUgaXRzZWxmLgogIGdldEFuYWx5dGljc0FkYXB0ZXJIZWFsdGgsCiAgaXNEYXRhTGF5ZXJCcmlkZ2VFbmFibGVkLAogIGVuc3VyZVBhZ2VFdmVudFNlcnZpY2UsCiAgZ2V0QXBpQmFzZVVybCwKfSBmcm9tICdAc3dpZnRvdHRlci9vbW5pZ3VpZGUtY29yZSc7CmltcG9ydCB0eXBlIHsgQnVuZGxlSW5pdENvbmZpZywgT21uaWd1aWRlSW5zdGFuY2UgfSBmcm9tICcuL3R5cGVzLmpzJzsKaW1wb3J0IHsgYnVpbGRDb25maWcsIGJ1aWxkUGxhdGZvcm1BZGFwdGVyIH0gZnJvbSAnLi9kZWZhdWx0cy5qcyc7CgppbXBvcnQgeyBhdXRvSW5pdCB9IGZyb20gJy4vYXV0by1pbml0LmpzJzsKaW1wb3J0IHsgc2V0dXBWYXJpYW50UHJlc2VsZWN0IH0gZnJvbSAnLi92YXJpYW50LXByZXNlbGVjdC5qcyc7CgovLyBDaGVjayBxdWVyeSBwYXJhbSBvdmVycmlkZSBiZWZvcmUgYW55IGluaXQoKSBjYWxsCmluaXRQcmV2aWV3RnJvbVF1ZXJ5UGFyYW0oKTsKCi8vIFJlLWV4cG9ydCB0eXBlcyBmb3IgYWR2YW5jZWQgY29uc3VtZXJzCmV4cG9ydCB0eXBlIHsgQnVuZGxlSW5pdENvbmZpZywgT21uaWd1aWRlSW5zdGFuY2UgfSBmcm9tICcuL3R5cGVzLmpzJzsKCi8vIFJlLWV4cG9ydCBpbnRlZ3JhdGlvbiBjbGFzc2VzIGFuZCB1dGlsaXRpZXMgZm9yIGFkdmFuY2VkIHVzYWdlCmV4cG9ydCB7CiAgQkNTZWFyY2hJbnRlZ3JhdGlvbiwKICBCQ1Byb2R1Y3RGaXRJbnRlZ3JhdGlvbiwKICBCQ0NhdGVnb3J5R3VpZGVJbnRlZ3JhdGlvbiwKICBjcmVhdGVCaWdDb21tZXJjZUFkYXB0ZXIsCiAgaW5pdEJpZ0NvbW1lcmNlQWRhcHRlciwKICBjcmVhdGVCaWdDb21tZXJjZUNvbXBhdCwKICBMQVRFTkNZLAogIFJlc3BvbnNlVGltZXIsCiAgY3JlYXRlUmVzcG9uc2VUaW1lciwKfSBmcm9tICdAc3dpZnRvdHRlci9vbW5pZ3VpZGUtYmlnY29tbWVyY2UnOwoKLy8gUmUtZXhwb3J0IGNvcmUgdXRpbGl0aWVzIGZvciB0aGVtZSB3cmFwcGVyIGZpbGVzIGFuZCBjdXN0b20gc2V0dXBzCmV4cG9ydCB7CiAgY3JlYXRlU2Vzc2lvblNlcnZpY2UsCiAgY3JlYXRlQ29uc2VudFNlcnZpY2UsCiAgTnVsbFBsYXRmb3JtQWRhcHRlciwKICBjcmVhdGVQbGF0Zm9ybUFkYXB0ZXIsCiAgZ2V0UGFnZUNvbnRleHQsCiAgY2FwdHVyZVBhZ2VDb250ZXh0LAogIHRyYWNrRXZlbnQsCiAgdXBkYXRlRXZlbnRDb250ZXh0LAogIGdldENvbnNlbnRTdGF0ZSwKfSBmcm9tICdAc3dpZnRvdHRlci9vbW5pZ3VpZGUtY29yZSc7CgpleHBvcnQgeyBPbW5pZ3VpZGVQcm92aWRlciB9IGZyb20gJ0Bzd2lmdG90dGVyL29tbmlndWlkZS1yZWFjdCc7CgovLyBQTFAgc3VyZmFjZSAoU09JLTYzOSkg4oCUIGNocm9tZSBleHQgKyBUcmFjdC1zdHlsZSBkaXJlY3QtaW5zdGFsbCBjb25zdW1lcnMKLy8gcGljayB1cCB0aGUgY29udGFpbmVyLCBob29rcywgYW5kIGhlbHBlcnMgdmlhIHdpbmRvdy5PbW5pZ3VpZGUgaW4gdGhlCi8vIHN0YW5kYWxvbmUvZXh0ZXJuYWwgYnVpbGRzLiBUaGUgbnBtLXBhY2thZ2UgY29uc3VtcHRpb24gcGF0aCAobW9jay1zdG9yZQovLyArIGZ1dHVyZSBTREsgY29uc3VtZXJzKSBpbXBvcnRzIGZyb20gYEBzd2lmdG90dGVyL29tbmlndWlkZS1wcm9kdWN0LWxpc3RgCi8vIGRpcmVjdGx5OyBib3RoIHJlYWNoIHRoZSBzYW1lIGV4cG9ydHMuCmV4cG9ydCB7CiAgUHJvZHVjdExpc3RDb250YWluZXIsCiAgQ2F0ZWdvcnlIZWFkZXIsCiAgUHJvZHVjdEdyaWQsCiAgLy8gSG9zdHMgdGhhdCBwYWludCB0aGUgc2tlbGV0b24gYmVmb3JlIHRoaXMgYnVuZGxlIHBhcnNlcyB1c2UgdGhlIHN0YXRpYwogIC8vIG1hcmt1cCBjb250cmFjdCBpbnN0ZWFkIChzZWUgUHJvZHVjdExpc3RTa2VsZXRvbidzIGRvY2Jsb2NrKTsgdGhpcyBpcyBmb3IKICAvLyBob3N0cyBkcml2aW5nIHRoZWlyIG93biBSZWFjdCB0cmVlLgogIFByb2R1Y3RMaXN0U2tlbGV0b24sCiAgVG9vbGJhciwKICBTb3J0U2VsZWN0LAogIEZhY2V0U2lkZWJhciwKICBNdWx0aVNlbGVjdEZhY2V0LAogIFByaWNlUmFuZ2VGYWNldCwKICBBY3RpdmVGaWx0ZXJzLAogIExvYWRNb3JlLAogIFJlZGlyZWN0RHJpbGxkb3duLAogIFNPUlRfVkFMVUVTLAogIHBhcnNlRmlsdGVycywKICBidWlsZFVybCwKICBwdXNoRmlsdGVycywKICBmZXRjaFBMUCwKICBTRVNTSU9OX0lEX0hFQURFUiwKICB1c2VQcm9kdWN0TGlzdCwKICB1c2VXZWJWaXRhbHNCZWFjb24sCiAgcmVuZGVyUHJvZHVjdExpc3QsCiAgdHlwZSBSZW5kZXJQcm9kdWN0TGlzdENvbmZpZywKICB0eXBlIFJlbmRlclByb2R1Y3RMaXN0SGFuZGxlLAp9IGZyb20gJ0Bzd2lmdG90dGVyL29tbmlndWlkZS1wcm9kdWN0LWxpc3QnOwoKLy8gU2hhcmVkIHByb2R1Y3QtZGlzcGxheSBwcmltaXRpdmVzIHVzZWQgYnkgUExQICsgZnV0dXJlIGNhcm91c2VsIFVJLgpleHBvcnQgewogIFByb2R1Y3RUaWxlLAogIFByb2R1Y3RJbWFnZSwKICBQcmljZUJsb2NrLAogIEZsYWdCYWRnZXMsCiAgVmFyaWFudFN3YXRjaGVzLAogIFByb2R1Y3RUaWxlU2tlbGV0b24sCn0gZnJvbSAnQHN3aWZ0b3R0ZXIvb21uaWd1aWRlLWNhdGFsb2cnOwoKLy8gQ2Fyb3VzZWwgc3VyZmFjZSAoU09JLTY0MCkg4oCUIG5hcnJhdGl2ZS1sZWQgcmVjb21tZW5kYXRpb24gcm93cyBmb3IgUERQICsKLy8gaG9tZS9DTVMgcGFnZXMuIENocm9tZSBleHRlbnNpb24gY29uc3VtZXMgdmlhIHdpbmRvdy5PbW5pZ3VpZGUucmVuZGVyQ2Fyb3VzZWwuCmV4cG9ydCB7CiAgQ2Fyb3VzZWxDb250YWluZXIsCiAgQ2Fyb3VzZWxSb3csCiAgQ2Fyb3VzZWxDYXJkLAogIENhcm91c2VsUm93U2tlbGV0b24sCiAgTmFycmF0aXZlQmxvY2ssCiAgQ2Fyb3VzZWxTb3VyY2VCYWRnZSwKICBmZXRjaENhcm91c2VsLAogIENBUk9VU0VMX0VNUFRZLAogIENhcm91c2VsU2xvdE5vdEZvdW5kRXJyb3IsCiAgdXNlQ2Fyb3VzZWwsCiAgdXNlQ2Fyb3VzZWxFdmVudHMsCiAgdXNlQ2Fyb3VzZWxWaXNpYmlsaXR5LAogIGNyZWF0ZVZpc2liaWxpdHlUcmFja2VyLAogIGJ1aWxkQ2Fyb3VzZWxFdmVudEVuZHBvaW50LAogIG1ha2VDYXJvdXNlbEV2ZW50U2VyaWFsaXplciwKICByZW5kZXJDYXJvdXNlbCwKICB0eXBlIFJlbmRlckNhcm91c2VsSGFuZGxlLAogIHR5cGUgQ2Fyb3VzZWxDb250YWluZXJQcm9wcywKICB0eXBlIEZldGNoQ2Fyb3VzZWxDb25maWcsCn0gZnJvbSAnQHN3aWZ0b3R0ZXIvb21uaWd1aWRlLWNhcm91c2VsJzsKCmRlY2xhcmUgY29uc3QgX19PTU5JR1VJREVfVkVSU0lPTl9fOiBzdHJpbmc7CgovKioKICogR2V0IHRoZSBidW5kbGUgdmVyc2lvbi4KICovCmV4cG9ydCBmdW5jdGlvbiBnZXRWZXJzaW9uKCk6IHN0cmluZyB7CiAgcmV0dXJuIF9fT01OSUdVSURFX1ZFUlNJT05fXzsKfQoKLyoqCiAqIEluaXRpYWxpemUgdGhlIE9tbmlndWlkZSBTREsgd2l0aCBhIHNpbXBsaWZpZWQgY29uZmlnLgogKgogKiBUaGlzIGlzIHRoZSBwcmltYXJ5IEFQSSBmb3Igc2NyaXB0LXRhZyBjb25zdW1lcnMuCiAqIEl0IGJ1aWxkcyB0aGUgZnVsbCBjb25maWcsIGNyZWF0ZXMgYSBwbGF0Zm9ybSBhZGFwdGVyLAogKiBhbmQgaW5pdGlhbGl6ZXMgYWxsIGVuYWJsZWQgZmVhdHVyZSBpbnRlZ3JhdGlvbnMuCiAqLwovKioKICogU3RhcnQgdGhlIGRhdGFMYXllciBicmlkZ2Ugb25jZSBwZXIgaW5pdCwgaWYgdGhlIHN0b3JlZnJvbnQgYXNrZWQgZm9yIGl0LgogKgogKiBUaGUgcmV0dXJuZWQgZGV0YWNoIGlzIGRyb3BwZWQgb24gcHVycG9zZTogdGhlIGJyaWRnZSBsaXZlcyBhcyBsb25nIGFzIHRoZQogKiBkb2N1bWVudCBkb2VzLiBUaGVyZSBpcyBubyBwYWdlLWxldmVsIHRlYXJkb3duIHRvIGhhbmcgaXQgb24sIGFuZCB0aGUgcG9sbGVyCiAqIGlzIHJlZmNvdW50ZWQsIHNvIGEgc2Vjb25kIGluaXQoKSBpcyBzYWZlLgogKgogKiBUaGUgU0lOSyBpcyBjcmVhdGVkIGhlcmUgdG9vLCBhdCB0aGUgc2FtZSBwYWdlIGxldmVsIGFzIHRoZSBicmlkZ2UuIFN0YXJ0aW5nCiAqIHRoZSBicmlkZ2UgcGFnZS1sZXZlbCB3aGlsZSB0aGUgb25seSBFdmVudFNlcnZpY2Ugd2FzIGJ1aWx0IGJ5IGEgUmVhY3QKICogcHJvdmlkZXIgbWVhbnQgYSBjYXJ0LCBjaGVja291dCBvciBvcmRlci1jb25maXJtYXRpb24gcGFnZSBmb3J3YXJkZWQgaW50bwogKiBub3RoaW5nOiB0aGUgYnJpZGdlIHBvbGxlZCwgZm91bmQgbm8gc2VydmljZSBhbmQgZHJvcHBlZCBpdHMgYmFja2xvZyBhdAogKiB1bmxvYWQuIGBlbnN1cmVQYWdlRXZlbnRTZXJ2aWNlYCBpcyBpZGVtcG90ZW50LCBzbyBhIHByb3ZpZGVyIHRoYXQgZG9lcwogKiBtb3VudCBsYXRlciBzaGFyZXMgdGhpcyBvbmUgaW5zdGFuY2UgcmF0aGVyIHRoYW4gb3BlbmluZyBhIHJpdmFsIHF1ZXVlLgogKi8KZnVuY3Rpb24gc3RhcnRCcmlkZ2VJZkNvbmZpZ3VyZWQoY29uZmlnOiBCdW5kbGVJbml0Q29uZmlnKTogdm9pZCB7CiAgLy8gVGhlIGJyaWRnZSdzIG93biB2ZXJkaWN0LCBub3QgYSBzZWNvbmQgY29weSBvZiBpdC4gYHt9YCBhbmQKICAvLyBge2d0bTogZmFsc2V9YCBhcmUgYm90aCAib2ZmIiwgYW5kIGJ1aWxkaW5nIGEgc2luayBmb3IgdGhlbSB3b3VsZCBsZWF2ZSBhCiAgLy8gZmx1c2ggaW50ZXJ2YWwgYW5kIHVubG9hZCBsaXN0ZW5lcnMgb24gYSBzdG9yZWZyb250IHRoYXQgc2FpZCBuby4KICBpZiAoIWlzRGF0YUxheWVyQnJpZGdlRW5hYmxlZChjb25maWcuZGF0YUxheWVyQnJpZGdlKSkgcmV0dXJuOwogIC8vIENvbnRhaW5lZCwgYW5kIHRoZSBicmlkZ2Ugc3RpbGwgc3RhcnRzLiBCdWlsZGluZyB0aGUgc2luayByZWFkcyB0aGUKICAvLyBzdG9yZWZyb250J3MgY29uc2VudCBjb25maWcsIHdoaWNoIGluaXQoKSB0YWtlcyBvbiB0cnVzdCBmcm9tIGEgSlNPTgogIC8vIGF0dHJpYnV0ZSDigJQgYW4gdW5rbm93biByZWFkZXIgbmFtZSB0aHJvd3MuIEJlZm9yZSB0aGlzIHJhbiBhdCBwYWdlIGxldmVsCiAgLy8gdGhhdCB0aHJldyBpbnNpZGUgb25lIHdpZGdldCdzIHJlbmRlciwgd2hlcmUgYXV0by1pbml0IGNhdWdodCBpdDsgaGVyZSBpdAogIC8vIHdvdWxkIGVzY2FwZSBpbml0KCkgYW5kIHRha2Ugc2VhcmNoLCBQRFAgYW5kIFBMUCBkb3duIHdpdGggaXQuCiAgdHJ5IHsKICAgIGVuc3VyZVBhZ2VFdmVudFNlcnZpY2UoewogICAgICBhcGlCYXNlVXJsOiBnZXRBcGlCYXNlVXJsKGNvbmZpZy5hcGlCYXNlVXJsKSwKICAgICAgd2Vic2l0ZUlkOiBjb25maWcud2Vic2l0ZUlkLAogICAgICBjb25zZW50OiBjb25maWcuY29uc2VudCwKICAgICAgc2Vzc2lvblN0b3JhZ2VLZXk6IGNvbmZpZy5zdG9yYWdlS2V5cz8uc2Vzc2lvbklkLAogICAgfSk7CiAgfSBjYXRjaCAoZXJyb3IpIHsKICAgIGxvZ2dlci5lcnJvcignQ291bGQgbm90IGNyZWF0ZSB0aGUgcGFnZSBFdmVudFNlcnZpY2U6JywgZXJyb3IpOwogIH0KICBzdGFydERhdGFMYXllckJyaWRnZShjb25maWcuZGF0YUxheWVyQnJpZGdlKTsKfQoKZXhwb3J0IGZ1bmN0aW9uIGluaXQoY29uZmlnOiBCdW5kbGVJbml0Q29uZmlnKTogT21uaWd1aWRlSW5zdGFuY2UgewogIGlmICghY29uZmlnLndlYnNpdGVJZCkgewogICAgdGhyb3cgbmV3IEVycm9yKCdbT21uaWd1aWRlXSB3ZWJzaXRlSWQgaXMgcmVxdWlyZWQgaW4gY29uZmlnJyk7CiAgfQoKICAvLyBTZXQgY3VycmVudC1wYWdlIG92ZXJyaWRlIGZvciBtb2NrL2RldiBzdG9yZXMKICBpZiAoY29uZmlnLmN1cnJlbnRQYWdlKSB7CiAgICBzZXRDdXJyZW50UGFnZU92ZXJyaWRlKGNvbmZpZy5jdXJyZW50UGFnZSk7CiAgfQoKICAvLyBQYWdlIGxldmVsLCBub3Qgd2lkZ2V0IGxldmVsLiBUaGUgYnJpZGdlIGZvcndhcmRzIHRoZSBzdG9yZWZyb250J3Mgb3duCiAgLy8gYW5hbHl0aWNzIGFycmF5cywgd2hpY2ggZmlyZSBvbiBldmVyeSBwYWdlIOKAlCBpbmNsdWRpbmcgY2FydCBhbmQgY2hlY2tvdXQsCiAgLy8gd2hlcmUgYGRsX2JlZ2luX2NoZWNrb3V0YCBhbmQgYGRsX3B1cmNoYXNlYCBsaXZlIGFuZCB3aGVyZSBOTyBPbW5pZ3VpZGUKICAvLyB3aWRnZXQgbW91bnRzLiBTdGFydGluZyBpdCBmcm9tIGEgbW91bnRlZCBwcm92aWRlciB0aWVkIHRoZSBzdG9yZWZyb250J3MKICAvLyBtb3N0IHZhbHVhYmxlIGV2ZW50cyB0byB3aGV0aGVyIGEgUERQL1BMUCBjb250YWluZXIgaGFwcGVuZWQgdG8gZXhpc3QuCiAgc3RhcnRCcmlkZ2VJZkNvbmZpZ3VyZWQoY29uZmlnKTsKICAvLyBQYWdlIGxldmVsIHRvbzogYSB2YXJpYW50IGRlZXAgbGluayBjYW4gYXJyaXZlIGZyb20gYW55IG9mIG91ciBzdXJmYWNlcy4KICBzZXR1cFZhcmlhbnRQcmVzZWxlY3QoKTsKCiAgY29uc3Qgb21uaWd1aWRlQ29uZmlnID0gYnVpbGRDb25maWcoY29uZmlnKTsKICBjb25zdCBwbGF0Zm9ybUFkYXB0ZXIgPSBidWlsZFBsYXRmb3JtQWRhcHRlcihjb25maWcpOwoKICByZXR1cm4gYXV0b0luaXQob21uaWd1aWRlQ29uZmlnLCBwbGF0Zm9ybUFkYXB0ZXIsIG9tbmlndWlkZUNvbmZpZy5mZWF0dXJlcywgY29uZmlnLnNlYXJjaCwgY29uZmlnLnBkcFdpZGdldCwgY29uZmlnLnBscFdpZGdldCwgY29uZmlnLnBscE1hdGNoUmliYm9ucywgY29uZmlnLnBkcE1hdGNoQmFkZ2UsIGNvbmZpZy5wbGF0Zm9ybSk7Cn0KCi8vIOKUgOKUgCBQcmV2aWV3IG1vZGUgY29uc29sZSBBUEkg4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSACi8vIFVzYWdlOiBPbW5pZ3VpZGUuc2V0UHJldmlld0FwaSgnaHR0cHM6Ly9zZXJ2aWNlLXN0YWdpbmcub21uaWd1aWRlLmFpJykKLy8gICAgICAgIE9tbmlndWlkZS5jbGVhclByZXZpZXdBcGkoKQovLyAgICAgICAgT21uaWd1aWRlLmlzUHJldmlld01vZGUoKQoKZXhwb3J0IGZ1bmN0aW9uIHNldFByZXZpZXdBcGkodXJsOiBzdHJpbmcpOiB2b2lkIHsKICBzZXRQcmV2aWV3QXBpVXJsKHVybCk7CiAgLy8gZXNsaW50LWRpc2FibGUtbmV4dC1saW5lIG5vLWNvbnNvbGUgLS0gaW50ZW50aW9uYWwgdXNlci12aXNpYmxlIGZlZWRiYWNrIGZyb20gT21uaWd1aWRlLnNldFByZXZpZXdBcGkoKSBjYWxsCiAgY29uc29sZS53YXJuKCdbT21uaWd1aWRlXSBQcmV2aWV3IEFQSSBzZXQgdG8gJXMuIFJlbG9hZCB0aGUgcGFnZSBmb3IgY2hhbmdlcyB0byB0YWtlIGVmZmVjdC4nLCB1cmwpOwp9CgpleHBvcnQgZnVuY3Rpb24gY2xlYXJQcmV2aWV3QXBpKCk6IHZvaWQgewogIGNsZWFyUHJldmlld0FwaVVybCgpOwogIC8vIGVzbGludC1kaXNhYmxlLW5leHQtbGluZSBuby1jb25zb2xlIC0tIGludGVudGlvbmFsIHVzZXItdmlzaWJsZSBmZWVkYmFjayBmcm9tIE9tbmlndWlkZS5jbGVhclByZXZpZXdBcGkoKSBjYWxsCiAgY29uc29sZS53YXJuKCdbT21uaWd1aWRlXSBQcmV2aWV3IEFQSSBjbGVhcmVkLiBSZWxvYWQgdGhlIHBhZ2UgdG8gdXNlIHRoZSBkZWZhdWx0IEFQSS4nKTsKfQoKZXhwb3J0IHsgaXNQcmV2aWV3TW9kZSB9OwpleHBvcnQgeyBnZXRBbmFseXRpY3NBZGFwdGVySGVhbHRoIH07CgovLyDilIDilIAgRGVjbGFyYXRpdmUgYXV0by1pbml0IOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgAovLyBTY2FuIGZvciA8c2NyaXB0IGRhdGEtb21uaWd1aWRlLWNvbmZpZz0nLi4uJz4gYW5kIGNhbGwgaW5pdCgpIGF1dG9tYXRpY2FsbHkuCgpmdW5jdGlvbiBkZWNsYXJhdGl2ZUluaXQoKTogdm9pZCB7CiAgY29uc3Qgc2NyaXB0cyA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3JBbGwoJ3NjcmlwdFtkYXRhLW9tbmlndWlkZS1jb25maWddJyk7CgogIHNjcmlwdHMuZm9yRWFjaCgoc2NyaXB0KSA9PiB7CiAgICBjb25zdCByYXcgPSBzY3JpcHQuZ2V0QXR0cmlidXRlKCdkYXRhLW9tbmlndWlkZS1jb25maWcnKTsKICAgIGlmICghcmF3KSByZXR1cm47CgogICAgdHJ5IHsKICAgICAgY29uc3QgY29uZmlnID0gSlNPTi5wYXJzZShyYXcpIGFzIEJ1bmRsZUluaXRDb25maWc7CiAgICAgIGluaXQoY29uZmlnKTsKICAgIH0gY2F0Y2ggKGUpIHsKICAgICAgbG9nZ2VyLmVycm9yKCdGYWlsZWQgdG8gcGFyc2UgZGF0YS1vbW5pZ3VpZGUtY29uZmlnOicsIGUpOwogICAgfQogIH0pOwp9CgppZiAodHlwZW9mIGRvY3VtZW50ICE9PSAndW5kZWZpbmVkJykgewogIGlmIChkb2N1bWVudC5yZWFkeVN0YXRlID09PSAnbG9hZGluZycpIHsKICAgIGRvY3VtZW50LmFkZEV2ZW50TGlzdGVuZXIoJ0RPTUNvbnRlbnRMb2FkZWQnLCBkZWNsYXJhdGl2ZUluaXQpOwogIH0gZWxzZSB7CiAgICAvLyBET00gYWxyZWFkeSBsb2FkZWQgKHNjcmlwdCBsb2FkZWQgYXN5bmMvZGVmZXIgb3IgYXQgYm90dG9tKQogICAgZGVjbGFyYXRpdmVJbml0KCk7CiAgfQp9CgovLyDilIDilIAgR2xvYmFsIGV4cG9zdXJlIOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgAovLyBUaGUgVU1EIGJ1aWxkIHNldHMgd2luZG93Lk9tbmlndWlkZSB2aWEgVml0ZSdzIGxpYiB3cmFwcGVyLCBidXQgd2hlbgovLyBpbXBvcnRlZCBhcyBFU00gKGUuZy4gbW9jay1zdG9yZSBkZXYgc2VydmVyKSB3ZSBuZWVkIGFuIGV4cGxpY2l0IGFzc2lnbm1lbnQuCi8vIElNUE9SVEFOVDogT25seSBhc3NpZ24gaWYgT21uaWd1aWRlIGRvZXNuJ3QgYWxyZWFkeSBleGlzdCAoaS5lLiBFU00gbW9kZSkuCi8vIEluIFVNRCBtb2RlIHRoZSB3cmFwcGVyIGFscmVhZHkgcG9wdWxhdGVkIHdpbmRvdy5PbW5pZ3VpZGUgd2l0aCBhbGwgZXhwb3J0czsKLy8gb3ZlcndyaXRpbmcgaXQgaGVyZSB3b3VsZCBsb3NlIHRoZSByZS1leHBvcnRlZCBpbnRlZ3JhdGlvbiBjbGFzc2VzL3V0aWxpdGllcy4KaWYgKHR5cGVvZiB3aW5kb3cgIT09ICd1bmRlZmluZWQnICYmICEod2luZG93IGFzIHVua25vd24gYXMgUmVjb3JkPHN0cmluZywgdW5rbm93bj4pWydPbW5pZ3VpZGUnXSkgewogICh3aW5kb3cgYXMgdW5rbm93biBhcyBSZWNvcmQ8c3RyaW5nLCB1bmtub3duPilbJ09tbmlndWlkZSddID0gewogICAgaW5pdCwKICAgIGdldFZlcnNpb24sCiAgICBzZXRQcmV2aWV3QXBpLAogICAgY2xlYXJQcmV2aWV3QXBpLAogICAgaXNQcmV2aWV3TW9kZSwKICAgIC8vIFJlYWNoYWJsZSBmcm9tIGEgc3RvcmVmcm9udCBjb25zb2xlIHNvIGEgd2lyaW5nIGF1ZGl0IGRvZXMgbm90IGhhdmUgdG8KICAgIC8vIGNsaWNrIGEgcHJvZHVjdCBhbmQgd2F0Y2ggZm9yIHRoZSB3YXJuaW5nLgogICAgZ2V0QW5hbHl0aWNzQWRhcHRlckhlYWx0aCwKICB9Owp9Cg==", import.meta.url).href;
  reactPromise = import(
    /* @vite-ignore */
    base + "vendor-react.js"
  ).then(() => {
  });
  return reactPromise;
}
const FORM = "form[data-cart-item-add]";
let applied = false;
function norm(text) {
  return (text ?? "").toLowerCase().replace(/[^\p{L}\p{N}]+/gu, "-").replace(/^-+|-+$/g, "");
}
function exact(text) {
  return (text ?? "").normalize("NFC").trim().toLowerCase();
}
function pick(items, texts, want) {
  if (!want.trim()) return void 0;
  const hit = items.find((i) => texts(i).some((t) => exact(t) === exact(want)));
  if (hit) return hit;
  const loose = items.filter((i) => texts(i).some((t) => t && norm(t) === norm(want)));
  return loose.length === 1 ? loose[0] : void 0;
}
function fieldNames(field) {
  var _a;
  const label = field.querySelector(".form-label");
  if (!label) return [];
  const first = ((_a = [...label.childNodes].find((n) => {
    var _a2;
    return (_a2 = n.textContent) == null ? void 0 : _a2.trim();
  })) == null ? void 0 : _a.textContent) ?? "";
  const whole = label.cloneNode(true);
  whole.querySelectorAll("[data-option-value]").forEach((n) => {
    n.remove();
  });
  return [first, whole.textContent ?? ""].map((t) => t.replace(/[:*\s]+$/, "").trim());
}
function radioTexts(field, input) {
  var _a;
  const label = field.querySelector(`label[for="${input.id}"]`);
  return [
    input.dataset["title"],
    (_a = label == null ? void 0 : label.querySelector("[title]")) == null ? void 0 : _a.getAttribute("title"),
    label == null ? void 0 : label.getAttribute("aria-label"),
    label == null ? void 0 : label.textContent
  ].filter((t) => Boolean(t == null ? void 0 : t.trim()));
}
function choose(field, value) {
  const select = field.querySelector("select");
  if (select) {
    const option = pick([...select.options].filter((o) => !o.disabled), (o) => [o.text], value);
    if (!option) return false;
    option.setAttribute("data-default", "");
    select.value = option.value;
    select.dispatchEvent(new Event("change", { bubbles: true }));
    return true;
  }
  const radios = [...field.querySelectorAll("input[type=radio]")].filter((i) => !i.disabled);
  const radio = pick(radios, (i) => radioTexts(field, i), value);
  if (!radio) return false;
  radio.setAttribute("data-default", "");
  if (!radio.checked) radio.click();
  return true;
}
function applyVariantParams(search = window.location.search, root = document) {
  const form = root.querySelector(FORM);
  if (!form) return [];
  const params = [...new URLSearchParams(search)];
  const keyOf = ([key]) => [key];
  const set = [];
  for (const field of form.querySelectorAll("[data-product-attribute]")) {
    const [first = "", whole = ""] = fieldNames(field);
    const param = pick(params, keyOf, first) ?? pick(params, keyOf, whole);
    if (param && choose(field, param[1])) set.push(param[0]);
  }
  return set;
}
function setupVariantPreselect() {
  if (typeof window === "undefined" || applied) return;
  applied = true;
  const run = () => {
    applyVariantParams();
  };
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", run, { once: true });
  else run();
}
const STORAGE_KEY = "ai-debug";
const PREFIX = "[Omniguide]";
let forceEnabled = false;
function isDebugEnabled() {
  var _a;
  if (forceEnabled) return true;
  try {
    if (typeof localStorage !== "undefined" && localStorage.getItem(STORAGE_KEY) === "true") {
      return true;
    }
  } catch {
  }
  try {
    if (typeof window !== "undefined") {
      const hostname = (_a = window.location) == null ? void 0 : _a.hostname;
      if (hostname === "localhost" || hostname === "127.0.0.1") {
        return true;
      }
    }
  } catch {
  }
  return false;
}
const logger = {
  debug(...args) {
    if (isDebugEnabled()) {
      console.log(PREFIX, ...args);
    }
  },
  warn(...args) {
    console.warn(PREFIX, ...args);
  },
  error(...args) {
    console.error(PREFIX, ...args);
  },
  enable() {
    forceEnabled = true;
    try {
      localStorage.setItem(STORAGE_KEY, "true");
    } catch {
    }
  },
  disable() {
    forceEnabled = false;
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
    }
  },
  get enabled() {
    return isDebugEnabled();
  }
};
function createScopedLogger(scope) {
  const scopedPrefix = `${PREFIX}:${scope}`;
  return {
    debug(...args) {
      if (isDebugEnabled()) {
        console.log(scopedPrefix, ...args);
      }
    },
    warn(...args) {
      console.warn(scopedPrefix, ...args);
    },
    error(...args) {
      console.error(scopedPrefix, ...args);
    },
    enable: logger.enable,
    disable: logger.disable,
    get enabled() {
      return isDebugEnabled();
    }
  };
}
const PREVIEW_KEY = "omniguide_preview_api";
const PREVIEW_PARAM = "omniguide_preview";
const ALLOWED_PREVIEW_HOSTS = [
  "service-staging.omniguide.ai",
  "service-demo.omniguide.ai",
  "verdict.swiftotter.com",
  "localhost"
];
function isAllowedHost(hostname) {
  return ALLOWED_PREVIEW_HOSTS.some(
    (h) => hostname === h || hostname.endsWith("." + h)
  );
}
function getPreviewApiUrl() {
  try {
    return localStorage.getItem(PREVIEW_KEY);
  } catch {
    return null;
  }
}
function isPreviewMode() {
  return getPreviewApiUrl() !== null;
}
function setPreviewApiUrl(url) {
  const parsed = new URL(url);
  if (!isAllowedHost(parsed.hostname)) {
    throw new Error(
      `[Omniguide] Preview API host "${parsed.hostname}" not in allowlist. Allowed: ${ALLOWED_PREVIEW_HOSTS.join(", ")}`
    );
  }
  try {
    localStorage.setItem(PREVIEW_KEY, parsed.origin);
  } catch {
  }
}
function clearPreviewApiUrl() {
  try {
    localStorage.removeItem(PREVIEW_KEY);
  } catch {
  }
}
function initPreviewFromQueryParam() {
  if (typeof window === "undefined") return;
  const params = new URLSearchParams(window.location.search);
  const val = params.get(PREVIEW_PARAM);
  if (!val) return;
  if (val === "off" || val === "clear") {
    clearPreviewApiUrl();
  } else {
    try {
      setPreviewApiUrl(val);
    } catch {
    }
  }
}
const log = createScopedLogger("analyticsAdapter");
const FAULT_REASON = {
  missing: "no analyticsAdapter is configured",
  invalid: "config.analyticsAdapter has no track() function",
  threw: "config.analyticsAdapter.track() threw"
};
const FAULT_HEADLINE = {
  missing: "Click analytics are not reaching 3rd-party analytics",
  invalid: "Click analytics are not reaching 3rd-party analytics",
  threw: "Click analytics may be reaching 3rd-party analytics only in part"
};
const FAULT_EVENT_LABEL = {
  missing: "First dropped event",
  invalid: "First dropped event",
  threw: "First affected event"
};
const FAULT_GUIDANCE = {
  // Declarative init is a JSON attribute, so it cannot carry a function at all:
  // a storefront set up that way always lands here, and the only way to deliver
  // click analytics is to initialise with a config object instead.
  missing: "Pass config.analyticsAdapter to Omniguide.init() — a declarative data-omniguide-config is JSON and cannot carry a function.",
  invalid: "config.analyticsAdapter must be an object with a track(name, props) function.",
  threw: "Whatever the callback sent before raising did arrive; anything after it did not. Delivery stays partial until the host callback is fixed."
};
const SHARED_STATE_KEY = "__omniguideAnalyticsAdapterHealth__";
function state() {
  const container = globalThis;
  let shared = container[SHARED_STATE_KEY];
  if (!shared) {
    shared = { health: { status: "unknown" }, reportedFaults: /* @__PURE__ */ new Set() };
    container[SHARED_STATE_KEY] = shared;
  }
  return shared;
}
function recordFault(fault, eventName) {
  const s = state();
  if (s.health.status === "unknown" || s.health.status === "ok") {
    s.health = eventName ? { status: fault, eventName } : { status: fault };
    return;
  }
  if (eventName && !s.health.eventName) s.health = { ...s.health, eventName };
}
function reportFault(fault, eventName, error) {
  recordFault(fault, eventName);
  if (state().reportedFaults.has(fault)) return;
  state().reportedFaults.add(fault);
  const first = eventName ? ` ${FAULT_EVENT_LABEL[fault]}: "${eventName}".` : "";
  const message = `${FAULT_HEADLINE[fault]} — ${FAULT_REASON[fault]}. ${FAULT_GUIDANCE[fault]}${first}`;
  if (fault === "threw") log.error(message, error);
  else log.warn(message);
}
function checkAnalyticsAdapter(adapter, eventName) {
  if (!adapter) {
    reportFault("missing", eventName);
    return false;
  }
  if (typeof adapter.track !== "function") {
    reportFault("invalid", eventName);
    return false;
  }
  if (state().health.status === "unknown") state().health = { status: "ok" };
  return true;
}
function reportAnalyticsAdapterThrew(eventName, error) {
  reportFault("threw", eventName, error);
}
function getAnalyticsAdapterHealth() {
  return { ...state().health };
}
function _resetAnalyticsAdapterHealth() {
  state().health = { status: "unknown" };
  state().reportedFaults.clear();
}
initPreviewFromQueryParam();
function resolveBase() {
  try {
    const url = new URL(import.meta.url);
    return url.href.substring(0, url.href.lastIndexOf("/") + 1);
  } catch {
    return "./";
  }
}
const loadSearchModule = () => import("./omniguide-search-DCsbDSMo.js");
const loadProductFitModule = () => import("./omniguide-product-fit-DlApHYhr.js");
const loadCategoryGuideModule = () => import("./omniguide-category-guide-C1OcUkLL.js");
const CSS_ASSETS = {
  tokens: "omniguide-tokens.css",
  search: "omniguide-search.css",
  productFit: "omniguide-product-fit.css",
  categoryGuide: "omniguide-category-guide.css"
};
let currentConfig = null;
let searchIntegration = null;
let searchChunkPromise = null;
let triggerResult = null;
let productFitIntegration = null;
let categoryGuideIntegration = null;
const SPINNER_ID = "omniguide-loading-spinner";
function showSearchSpinner() {
  if (document.getElementById(SPINNER_ID)) return;
  const overlay = document.createElement("div");
  overlay.id = SPINNER_ID;
  overlay.style.cssText = `
    position:fixed;top:0;left:0;right:0;bottom:0;
    z-index:10001;
    display:flex;align-items:center;justify-content:center;
    background:rgba(0,0,0,0.3);
  `;
  overlay.innerHTML = `
    <div style="
      width:40px;height:40px;
      border:3px solid rgba(255,255,255,0.3);
      border-top-color:#fff;
      border-radius:50%;
      animation:omniguide-spin 0.8s linear infinite;
    "></div>
    <style>@keyframes omniguide-spin{to{transform:rotate(360deg)}}</style>
  `;
  document.body.appendChild(overlay);
}
function hideSearchSpinner() {
  var _a;
  (_a = document.getElementById(SPINNER_ID)) == null ? void 0 : _a.remove();
}
function observeVisibility(el, rootMargin, onVisible) {
  const io = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (entry.isIntersecting) {
          io.disconnect();
          onVisible();
          return;
        }
      }
    },
    { rootMargin }
  );
  io.observe(el);
  return io;
}
function getSearchChunk() {
  if (!searchChunkPromise) {
    searchChunkPromise = loadSearchModule();
  }
  return searchChunkPromise;
}
async function handleOpenSearch(query, source, base, ask = false) {
  var _a, _b;
  const open = (integration) => ask && integration.askAssistant ? integration.askAssistant(query, source) : integration.openSearch(query, source);
  if (searchIntegration) {
    open(searchIntegration);
    return;
  }
  const spinnerTimeout = window.setTimeout(() => showSearchSpinner(), 150);
  try {
    const [mod] = await Promise.all([
      getSearchChunk(),
      loadCss(base + CSS_ASSETS.search),
      ensureReact()
    ]);
    clearTimeout(spinnerTimeout);
    hideSearchSpinner();
    const omniguideConfig = mod.buildConfig(currentConfig);
    const platformAdapter = mod.buildPlatformAdapter(currentConfig);
    const integration = new mod.BCSearchIntegration({
      config: omniguideConfig,
      platformAdapter,
      skipDomSetup: true
    });
    searchIntegration = integration;
    integration.init();
    open(integration);
    (_b = (_a = currentConfig == null ? void 0 : currentConfig.search) == null ? void 0 : _a.onOpen) == null ? void 0 : _b.call(_a, source);
  } catch (e) {
    clearTimeout(spinnerTimeout);
    hideSearchSpinner();
    console.error("[Omniguide] Failed to load search:", e);
  }
}
async function mountProductFit(config, base) {
  var _a;
  try {
    const [mod] = await Promise.all([
      loadProductFitModule(),
      loadCss(base + CSS_ASSETS.productFit),
      ensureReact()
    ]);
    const omniguideConfig = mod.buildConfig(config);
    const platformAdapter = mod.buildPlatformAdapter(config);
    productFitIntegration = new mod.BCProductFitIntegration({
      config: omniguideConfig,
      platformAdapter,
      mount: (_a = config.pdpWidget) == null ? void 0 : _a.mount
    });
    productFitIntegration.init();
  } catch (e) {
    console.error("[Omniguide] Failed to load product fit:", e);
  }
}
async function mountCategoryGuide(config, base) {
  var _a;
  try {
    const [mod] = await Promise.all([
      loadCategoryGuideModule(),
      loadCss(base + CSS_ASSETS.categoryGuide),
      ensureReact()
    ]);
    const omniguideConfig = mod.buildConfig(config);
    const platformAdapter = mod.buildPlatformAdapter(config);
    categoryGuideIntegration = new mod.BCCategoryGuideIntegration({
      config: omniguideConfig,
      platformAdapter,
      mount: (_a = config.plpWidget) == null ? void 0 : _a.mount
    });
    categoryGuideIntegration.init();
  } catch (e) {
    console.error("[Omniguide] Failed to load category guide:", e);
  }
}
function injectTokenOverrides(tokens) {
  const style = document.createElement("style");
  style.id = "omniguide-token-overrides";
  const props = Object.entries(tokens).map(([key, value]) => {
    const prop = key.startsWith("--") ? key : `--${key}`;
    return `  ${prop}: ${value};`;
  }).join("\n");
  style.textContent = `:root {
${props}
}`;
  document.head.appendChild(style);
}
function resolveObserveTarget(mount, selector, defaultSelector) {
  if (mount) {
    return mount.target instanceof HTMLElement ? mount.target : document.querySelector(mount.target);
  }
  return document.querySelector(selector ?? defaultSelector);
}
function startBridgeIfConfigured(config) {
  const bridge = config.dataLayerBridge;
  if (!bridge) return;
  void import("./shared-wrtBMjVh.js").then((mod) => {
    var _a;
    if (!mod.isDataLayerBridgeEnabled(bridge)) return;
    try {
      mod.ensurePageEventService({
        apiBaseUrl: mod.getApiBaseUrl(config.apiBaseUrl),
        websiteId: config.websiteId,
        consent: config.consent,
        sessionStorageKey: (_a = config.storageKeys) == null ? void 0 : _a.sessionId
      });
    } catch (error) {
      console.error("[Omniguide] Could not create the page EventService:", error);
    }
    mod.startDataLayerBridge(bridge);
  }).catch(() => {
  });
}
function init(config) {
  var _a, _b, _c, _d, _e, _f, _g, _h, _i, _j, _k, _l, _m;
  if (!config.websiteId) {
    throw new Error("[Omniguide] websiteId is required in config");
  }
  startBridgeIfConfigured(config);
  setupVariantPreselect();
  currentConfig = config;
  const base = resolveBase();
  const features = { search: true, productFit: true, categoryGuide: true, ...config.features };
  if (config.tokens) {
    injectTokenOverrides(config.tokens);
  }
  loadCss(base + CSS_ASSETS.tokens);
  if (features.search && ((_a = config.search) == null ? void 0 : _a.replace) !== null) {
    triggerResult = setupSearchTrigger(
      {
        replace: (_b = config.search) == null ? void 0 : _b.replace,
        renderTrigger: (_c = config.search) == null ? void 0 : _c.renderTrigger,
        icon: (_d = config.search) == null ? void 0 : _d.icon,
        selectors: config.selectors,
        websiteId: config.websiteId,
        ui: config.ui
      },
      (query, source) => handleOpenSearch(query, source, base)
    );
    const loadMode = ((_e = config.search) == null ? void 0 : _e.loadMode) ?? "intent";
    if (loadMode === "intent" && triggerResult) {
      triggerResult.addIntentListeners(() => {
        getSearchChunk();
        prefetchCss(base + CSS_ASSETS.search);
      });
    } else if (loadMode === "idle") {
      const schedule = window.requestIdleCallback ?? ((cb) => window.setTimeout(cb, 2e3));
      schedule(() => {
        getSearchChunk();
        prefetchCss(base + CSS_ASSETS.search);
      });
    }
  }
  const observers = [];
  if (features.productFit) {
    const pdpObserveEl = resolveObserveTarget((_f = config.pdpWidget) == null ? void 0 : _f.mount, (_g = config.pdpWidget) == null ? void 0 : _g.selector, "[data-omniguide-pdp], #product-recommendations-root");
    if (pdpObserveEl) {
      const loadMode = ((_h = config.pdpWidget) == null ? void 0 : _h.loadMode) ?? "visible";
      if (loadMode === "immediate") {
        mountProductFit(config, base);
      } else {
        const io = observeVisibility(pdpObserveEl, ((_i = config.pdpWidget) == null ? void 0 : _i.rootMargin) ?? "600px", () => {
          mountProductFit(config, base);
        });
        observers.push(io);
      }
    }
  }
  if (features.categoryGuide) {
    const plpObserveEl = resolveObserveTarget((_j = config.plpWidget) == null ? void 0 : _j.mount, (_k = config.plpWidget) == null ? void 0 : _k.selector, "[data-omniguide-plp], #category-recommendations-root");
    if (plpObserveEl) {
      const loadMode = ((_l = config.plpWidget) == null ? void 0 : _l.loadMode) ?? "visible";
      if (loadMode === "immediate") {
        mountCategoryGuide(config, base);
      } else {
        const io = observeVisibility(plpObserveEl, ((_m = config.plpWidget) == null ? void 0 : _m.rootMargin) ?? "600px", () => {
          mountCategoryGuide(config, base);
        });
        observers.push(io);
      }
    }
  }
  const instance = {
    search: null,
    // Set lazily when search chunk loads
    productFit: null,
    categoryGuide: null,
    openSearch: (query) => handleOpenSearch(query ?? "", "api", base),
    askAssistant: (query, source) => handleOpenSearch(query ?? "", source ?? "api", base, true),
    destroy() {
      var _a2;
      triggerResult == null ? void 0 : triggerResult.destroy();
      searchIntegration == null ? void 0 : searchIntegration.destroy();
      productFitIntegration == null ? void 0 : productFitIntegration.destroy();
      categoryGuideIntegration == null ? void 0 : categoryGuideIntegration.destroy();
      for (const io of observers) io.disconnect();
      (_a2 = document.getElementById("omniguide-token-overrides")) == null ? void 0 : _a2.remove();
      searchIntegration = null;
      searchChunkPromise = null;
      productFitIntegration = null;
      categoryGuideIntegration = null;
      triggerResult = null;
      currentConfig = null;
    }
  };
  return instance;
}
function getVersion() {
  return "0.11.0";
}
function setPreviewApi(url) {
  setPreviewApiUrl(url);
  console.info(`[Omniguide] Preview API set to ${url}. Reload the page for changes to take effect.`);
}
function clearPreviewApi() {
  clearPreviewApiUrl();
  console.info("[Omniguide] Preview API cleared. Reload the page to use the default API.");
}
if (typeof window !== "undefined") {
  window["Omniguide"] = {
    init,
    getVersion,
    setPreviewApi,
    clearPreviewApi,
    isPreviewMode,
    // Reachable from a storefront console so a wiring audit does not have to
    // click a product and watch for the warning. Reports 'unknown' until a
    // feature actually mounts — on this entry they mount lazily.
    getAnalyticsAdapterHealth
  };
}
function declarativeInit() {
  const scripts = document.querySelectorAll("script[data-omniguide-config]");
  scripts.forEach((script) => {
    const raw = script.getAttribute("data-omniguide-config");
    if (!raw) return;
    try {
      const config = JSON.parse(raw);
      init(config);
    } catch (e) {
      console.error("[Omniguide] Failed to parse data-omniguide-config:", e);
    }
  });
}
if (typeof document !== "undefined") {
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", declarativeInit);
  } else {
    declarativeInit();
  }
}
export {
  _resetAnalyticsAdapterHealth as _,
  clearPreviewApiUrl as a,
  checkAnalyticsAdapter as b,
  createScopedLogger as c,
  getAnalyticsAdapterHealth as d,
  initPreviewFromQueryParam as e,
  getVersion as f,
  getPreviewApiUrl as g,
  init as h,
  isPreviewMode as i,
  logger as l,
  reportAnalyticsAdapterThrew as r,
  setPreviewApiUrl as s
};
