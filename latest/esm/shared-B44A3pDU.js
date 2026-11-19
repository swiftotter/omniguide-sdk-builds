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
  const base = new URL("data:video/mp2t;base64,LyoqCiAqIEBzd2lmdG90dGVyL29tbmlndWlkZS1idW5kbGUKICoKICogUHJlLWJ1aWx0IFVNRCBidW5kbGUgZm9yIE9tbmlndWlkZSBBSSBTREsuCiAqIFdvcmtzIHZpYSA8c2NyaXB0PiB0YWcg4oCUIG5vIGJ1aWxkIHRvb2xpbmcgcmVxdWlyZWQuCiAqCiAqIFVzYWdlOgogKiAgIDxsaW5rIHJlbD0ic3R5bGVzaGVldCIgaHJlZj0ib21uaWd1aWRlLXNkay5jc3MiPgogKiAgIDxzY3JpcHQgc3JjPSJvbW5pZ3VpZGUtc2RrLnN0YW5kYWxvbmUuanMiPjwvc2NyaXB0PgogKiAgIDxzY3JpcHQ+CiAqICAgICBPbW5pZ3VpZGUuaW5pdCh7IHdlYnNpdGVJZDogJ2h0dHBzOi8vbXlzdG9yZS5jb20vJyB9KTsKICogICA8L3NjcmlwdD4KICoKICogT3IgZGVjbGFyYXRpdmVseToKICogICA8c2NyaXB0IHNyYz0ib21uaWd1aWRlLXNkay5zdGFuZGFsb25lLmpzIiBkYXRhLW9tbmlndWlkZS1jb25maWc9J3sid2Vic2l0ZUlkIjoiaHR0cHM6Ly9teXN0b3JlLmNvbS8ifSc+PC9zY3JpcHQ+CiAqLwoKLy8gU2lkZS1lZmZlY3QgaW1wb3J0OiBleHRyYWN0cyBDU1MgaW50byBvbW5pZ3VpZGUtc2RrLmNzcwppbXBvcnQgJ0Bzd2lmdG90dGVyL29tbmlndWlkZS1zdHlsZXMnOwoKaW1wb3J0IHsKICBsb2dnZXIsCiAgaW5pdFByZXZpZXdGcm9tUXVlcnlQYXJhbSwKICBzZXRQcmV2aWV3QXBpVXJsLAogIGNsZWFyUHJldmlld0FwaVVybCwKICBpc1ByZXZpZXdNb2RlLAogIHNldEN1cnJlbnRQYWdlT3ZlcnJpZGUsCiAgc2V0V2hvbGVQcmljZXMsCiAgc3RhcnREYXRhTGF5ZXJCcmlkZ2UsCiAgLy8gSW1wb3J0ZWQsIG5vdCBqdXN0IHJlLWV4cG9ydGVkOiBgZXhwb3J0IHsgeCB9IGZyb20gJ+KApidgIGNyZWF0ZXMgbm8gbG9jYWwKICAvLyBiaW5kaW5nLCBhbmQgdGhlIHdpbmRvdy5PbW5pZ3VpZGUgbGl0ZXJhbCBiZWxvdyBuZWVkcyB0aGUgdmFsdWUgaXRzZWxmLgogIGdldEFuYWx5dGljc0FkYXB0ZXJIZWFsdGgsCiAgaXNEYXRhTGF5ZXJCcmlkZ2VFbmFibGVkLAogIGVuc3VyZVBhZ2VFdmVudFNlcnZpY2UsCiAgZ2V0QXBpQmFzZVVybCwKfSBmcm9tICdAc3dpZnRvdHRlci9vbW5pZ3VpZGUtY29yZSc7CmltcG9ydCB0eXBlIHsgQnVuZGxlSW5pdENvbmZpZywgT21uaWd1aWRlSW5zdGFuY2UgfSBmcm9tICcuL3R5cGVzLmpzJzsKaW1wb3J0IHsgYnVpbGRDb25maWcsIGJ1aWxkUGxhdGZvcm1BZGFwdGVyIH0gZnJvbSAnLi9kZWZhdWx0cy5qcyc7CmltcG9ydCB7IHJlYWRQbGF0Zm9ybSB9IGZyb20gJy4vcGxhdGZvcm0uanMnOwppbXBvcnQgeyB2YWxpZGF0ZUluaXRDb25maWcgfSBmcm9tICcuL3ZhbGlkYXRlLWNvbmZpZy5qcyc7CgppbXBvcnQgeyBhdXRvSW5pdCB9IGZyb20gJy4vYXV0by1pbml0LmpzJzsKaW1wb3J0IHsgc2V0dXBWYXJpYW50UHJlc2VsZWN0IH0gZnJvbSAnLi92YXJpYW50LXByZXNlbGVjdC5qcyc7CgovLyBDaGVjayBxdWVyeSBwYXJhbSBvdmVycmlkZSBiZWZvcmUgYW55IGluaXQoKSBjYWxsCmluaXRQcmV2aWV3RnJvbVF1ZXJ5UGFyYW0oKTsKCi8vIFJlLWV4cG9ydCB0eXBlcyBmb3IgYWR2YW5jZWQgY29uc3VtZXJzCmV4cG9ydCB0eXBlIHsgQnVuZGxlSW5pdENvbmZpZywgT21uaWd1aWRlSW5zdGFuY2UgfSBmcm9tICcuL3R5cGVzLmpzJzsKCi8vIFJlLWV4cG9ydCBpbnRlZ3JhdGlvbiBjbGFzc2VzIGFuZCB1dGlsaXRpZXMgZm9yIGFkdmFuY2VkIHVzYWdlCmV4cG9ydCB7CiAgQkNTZWFyY2hJbnRlZ3JhdGlvbiwKICBCQ1Byb2R1Y3RGaXRJbnRlZ3JhdGlvbiwKICBCQ0NhdGVnb3J5R3VpZGVJbnRlZ3JhdGlvbiwKICBjcmVhdGVCaWdDb21tZXJjZUFkYXB0ZXIsCiAgaW5pdEJpZ0NvbW1lcmNlQWRhcHRlciwKICBjcmVhdGVCaWdDb21tZXJjZUNvbXBhdCwKICBMQVRFTkNZLAogIFJlc3BvbnNlVGltZXIsCiAgY3JlYXRlUmVzcG9uc2VUaW1lciwKfSBmcm9tICdAc3dpZnRvdHRlci9vbW5pZ3VpZGUtYmlnY29tbWVyY2UnOwoKLy8gUmUtZXhwb3J0IGNvcmUgdXRpbGl0aWVzIGZvciB0aGVtZSB3cmFwcGVyIGZpbGVzIGFuZCBjdXN0b20gc2V0dXBzCmV4cG9ydCB7CiAgY3JlYXRlU2Vzc2lvblNlcnZpY2UsCiAgY3JlYXRlQ29uc2VudFNlcnZpY2UsCiAgTnVsbFBsYXRmb3JtQWRhcHRlciwKICBjcmVhdGVQbGF0Zm9ybUFkYXB0ZXIsCiAgZ2V0UGFnZUNvbnRleHQsCiAgY2FwdHVyZVBhZ2VDb250ZXh0LAogIHRyYWNrRXZlbnQsCiAgdXBkYXRlRXZlbnRDb250ZXh0LAogIGdldENvbnNlbnRTdGF0ZSwKfSBmcm9tICdAc3dpZnRvdHRlci9vbW5pZ3VpZGUtY29yZSc7CgpleHBvcnQgeyBPbW5pZ3VpZGVQcm92aWRlciB9IGZyb20gJ0Bzd2lmdG90dGVyL29tbmlndWlkZS1yZWFjdCc7CgovLyBQTFAgc3VyZmFjZSAoU09JLTYzOSkg4oCUIGNocm9tZSBleHQgKyBUcmFjdC1zdHlsZSBkaXJlY3QtaW5zdGFsbCBjb25zdW1lcnMKLy8gcGljayB1cCB0aGUgY29udGFpbmVyLCBob29rcywgYW5kIGhlbHBlcnMgdmlhIHdpbmRvdy5PbW5pZ3VpZGUgaW4gdGhlCi8vIHN0YW5kYWxvbmUvZXh0ZXJuYWwgYnVpbGRzLiBUaGUgbnBtLXBhY2thZ2UgY29uc3VtcHRpb24gcGF0aCAobW9jay1zdG9yZQovLyArIGZ1dHVyZSBTREsgY29uc3VtZXJzKSBpbXBvcnRzIGZyb20gYEBzd2lmdG90dGVyL29tbmlndWlkZS1wcm9kdWN0LWxpc3RgCi8vIGRpcmVjdGx5OyBib3RoIHJlYWNoIHRoZSBzYW1lIGV4cG9ydHMuCmV4cG9ydCB7CiAgUHJvZHVjdExpc3RDb250YWluZXIsCiAgQ2F0ZWdvcnlIZWFkZXIsCiAgUHJvZHVjdEdyaWQsCiAgLy8gSG9zdHMgdGhhdCBwYWludCB0aGUgc2tlbGV0b24gYmVmb3JlIHRoaXMgYnVuZGxlIHBhcnNlcyB1c2UgdGhlIHN0YXRpYwogIC8vIG1hcmt1cCBjb250cmFjdCBpbnN0ZWFkIChzZWUgUHJvZHVjdExpc3RTa2VsZXRvbidzIGRvY2Jsb2NrKTsgdGhpcyBpcyBmb3IKICAvLyBob3N0cyBkcml2aW5nIHRoZWlyIG93biBSZWFjdCB0cmVlLgogIFByb2R1Y3RMaXN0U2tlbGV0b24sCiAgVG9vbGJhciwKICBTb3J0U2VsZWN0LAogIEZhY2V0U2lkZWJhciwKICBNdWx0aVNlbGVjdEZhY2V0LAogIFByaWNlUmFuZ2VGYWNldCwKICBBY3RpdmVGaWx0ZXJzLAogIExvYWRNb3JlLAogIFJlZGlyZWN0RHJpbGxkb3duLAogIFNPUlRfVkFMVUVTLAogIHBhcnNlRmlsdGVycywKICBidWlsZFVybCwKICBwdXNoRmlsdGVycywKICBmZXRjaFBMUCwKICBTRVNTSU9OX0lEX0hFQURFUiwKICB1c2VQcm9kdWN0TGlzdCwKICB1c2VXZWJWaXRhbHNCZWFjb24sCiAgcmVuZGVyUHJvZHVjdExpc3QsCiAgdHlwZSBSZW5kZXJQcm9kdWN0TGlzdENvbmZpZywKICB0eXBlIFJlbmRlclByb2R1Y3RMaXN0SGFuZGxlLAp9IGZyb20gJ0Bzd2lmdG90dGVyL29tbmlndWlkZS1wcm9kdWN0LWxpc3QnOwoKLy8gU2hhcmVkIHByb2R1Y3QtZGlzcGxheSBwcmltaXRpdmVzIHVzZWQgYnkgUExQICsgZnV0dXJlIGNhcm91c2VsIFVJLgpleHBvcnQgewogIFByb2R1Y3RUaWxlLAogIFByb2R1Y3RJbWFnZSwKICBQcmljZUJsb2NrLAogIEZsYWdCYWRnZXMsCiAgVmFyaWFudFN3YXRjaGVzLAogIFByb2R1Y3RUaWxlU2tlbGV0b24sCn0gZnJvbSAnQHN3aWZ0b3R0ZXIvb21uaWd1aWRlLWNhdGFsb2cnOwoKLy8gQ2Fyb3VzZWwgc3VyZmFjZSAoU09JLTY0MCkg4oCUIG5hcnJhdGl2ZS1sZWQgcmVjb21tZW5kYXRpb24gcm93cyBmb3IgUERQICsKLy8gaG9tZS9DTVMgcGFnZXMuIENocm9tZSBleHRlbnNpb24gY29uc3VtZXMgdmlhIHdpbmRvdy5PbW5pZ3VpZGUucmVuZGVyQ2Fyb3VzZWwuCmV4cG9ydCB7CiAgQ2Fyb3VzZWxDb250YWluZXIsCiAgQ2Fyb3VzZWxSb3csCiAgQ2Fyb3VzZWxDYXJkLAogIENhcm91c2VsUm93U2tlbGV0b24sCiAgZmV0Y2hDYXJvdXNlbCwKICBDQVJPVVNFTF9FTVBUWSwKICBDYXJvdXNlbFNsb3ROb3RGb3VuZEVycm9yLAogIHVzZUNhcm91c2VsLAogIHVzZUNhcm91c2VsRXZlbnRzLAogIHVzZUNhcm91c2VsVmlzaWJpbGl0eSwKICBjcmVhdGVWaXNpYmlsaXR5VHJhY2tlciwKICBidWlsZENhcm91c2VsRXZlbnRFbmRwb2ludCwKICBtYWtlQ2Fyb3VzZWxFdmVudFNlcmlhbGl6ZXIsCiAgcmVuZGVyQ2Fyb3VzZWwsCiAgdHlwZSBSZW5kZXJDYXJvdXNlbEhhbmRsZSwKICB0eXBlIENhcm91c2VsQ29udGFpbmVyUHJvcHMsCiAgdHlwZSBGZXRjaENhcm91c2VsQ29uZmlnLAp9IGZyb20gJ0Bzd2lmdG90dGVyL29tbmlndWlkZS1jYXJvdXNlbCc7CgpkZWNsYXJlIGNvbnN0IF9fT01OSUdVSURFX1ZFUlNJT05fXzogc3RyaW5nOwoKLyoqCiAqIEdldCB0aGUgYnVuZGxlIHZlcnNpb24uCiAqLwpleHBvcnQgZnVuY3Rpb24gZ2V0VmVyc2lvbigpOiBzdHJpbmcgewogIHJldHVybiBfX09NTklHVUlERV9WRVJTSU9OX187Cn0KCi8qKgogKiBJbml0aWFsaXplIHRoZSBPbW5pZ3VpZGUgU0RLIHdpdGggYSBzaW1wbGlmaWVkIGNvbmZpZy4KICoKICogVGhpcyBpcyB0aGUgcHJpbWFyeSBBUEkgZm9yIHNjcmlwdC10YWcgY29uc3VtZXJzLgogKiBJdCBidWlsZHMgdGhlIGZ1bGwgY29uZmlnLCBjcmVhdGVzIGEgcGxhdGZvcm0gYWRhcHRlciwKICogYW5kIGluaXRpYWxpemVzIGFsbCBlbmFibGVkIGZlYXR1cmUgaW50ZWdyYXRpb25zLgogKi8KLyoqCiAqIFN0YXJ0IHRoZSBkYXRhTGF5ZXIgYnJpZGdlIG9uY2UgcGVyIGluaXQsIGlmIHRoZSBzdG9yZWZyb250IGFza2VkIGZvciBpdC4KICoKICogVGhlIHJldHVybmVkIGRldGFjaCBpcyBkcm9wcGVkIG9uIHB1cnBvc2U6IHRoZSBicmlkZ2UgbGl2ZXMgYXMgbG9uZyBhcyB0aGUKICogZG9jdW1lbnQgZG9lcy4gVGhlcmUgaXMgbm8gcGFnZS1sZXZlbCB0ZWFyZG93biB0byBoYW5nIGl0IG9uLCBhbmQgdGhlIHBvbGxlcgogKiBpcyByZWZjb3VudGVkLCBzbyBhIHNlY29uZCBpbml0KCkgaXMgc2FmZS4KICoKICogVGhlIFNJTksgaXMgY3JlYXRlZCBoZXJlIHRvbywgYXQgdGhlIHNhbWUgcGFnZSBsZXZlbCBhcyB0aGUgYnJpZGdlLiBTdGFydGluZwogKiB0aGUgYnJpZGdlIHBhZ2UtbGV2ZWwgd2hpbGUgdGhlIG9ubHkgRXZlbnRTZXJ2aWNlIHdhcyBidWlsdCBieSBhIFJlYWN0CiAqIHByb3ZpZGVyIG1lYW50IGEgY2FydCwgY2hlY2tvdXQgb3Igb3JkZXItY29uZmlybWF0aW9uIHBhZ2UgZm9yd2FyZGVkIGludG8KICogbm90aGluZzogdGhlIGJyaWRnZSBwb2xsZWQsIGZvdW5kIG5vIHNlcnZpY2UgYW5kIGRyb3BwZWQgaXRzIGJhY2tsb2cgYXQKICogdW5sb2FkLiBgZW5zdXJlUGFnZUV2ZW50U2VydmljZWAgaXMgaWRlbXBvdGVudCwgc28gYSBwcm92aWRlciB0aGF0IGRvZXMKICogbW91bnQgbGF0ZXIgc2hhcmVzIHRoaXMgb25lIGluc3RhbmNlIHJhdGhlciB0aGFuIG9wZW5pbmcgYSByaXZhbCBxdWV1ZS4KICovCmZ1bmN0aW9uIHN0YXJ0QnJpZGdlSWZDb25maWd1cmVkKGNvbmZpZzogQnVuZGxlSW5pdENvbmZpZyk6IHZvaWQgewogIC8vIFRoZSBicmlkZ2UncyBvd24gdmVyZGljdCwgbm90IGEgc2Vjb25kIGNvcHkgb2YgaXQuIGB7fWAgYW5kCiAgLy8gYHtndG06IGZhbHNlfWAgYXJlIGJvdGggIm9mZiIsIGFuZCBidWlsZGluZyBhIHNpbmsgZm9yIHRoZW0gd291bGQgbGVhdmUgYQogIC8vIGZsdXNoIGludGVydmFsIGFuZCB1bmxvYWQgbGlzdGVuZXJzIG9uIGEgc3RvcmVmcm9udCB0aGF0IHNhaWQgbm8uCiAgaWYgKCFpc0RhdGFMYXllckJyaWRnZUVuYWJsZWQoY29uZmlnLmRhdGFMYXllckJyaWRnZSkpIHJldHVybjsKICAvLyBDb250YWluZWQsIGFuZCB0aGUgYnJpZGdlIHN0aWxsIHN0YXJ0cy4gQnVpbGRpbmcgdGhlIHNpbmsgcmVhZHMgdGhlCiAgLy8gc3RvcmVmcm9udCdzIGNvbnNlbnQgY29uZmlnLCB3aGljaCBpbml0KCkgdGFrZXMgb24gdHJ1c3QgZnJvbSBhIEpTT04KICAvLyBhdHRyaWJ1dGUg4oCUIGFuIHVua25vd24gcmVhZGVyIG5hbWUgdGhyb3dzLiBCZWZvcmUgdGhpcyByYW4gYXQgcGFnZSBsZXZlbAogIC8vIHRoYXQgdGhyZXcgaW5zaWRlIG9uZSB3aWRnZXQncyByZW5kZXIsIHdoZXJlIGF1dG8taW5pdCBjYXVnaHQgaXQ7IGhlcmUgaXQKICAvLyB3b3VsZCBlc2NhcGUgaW5pdCgpIGFuZCB0YWtlIHNlYXJjaCwgUERQIGFuZCBQTFAgZG93biB3aXRoIGl0LgogIHRyeSB7CiAgICBlbnN1cmVQYWdlRXZlbnRTZXJ2aWNlKHsKICAgICAgYXBpQmFzZVVybDogZ2V0QXBpQmFzZVVybChjb25maWcuYXBpQmFzZVVybCksCiAgICAgIHdlYnNpdGVJZDogY29uZmlnLndlYnNpdGVJZCwKICAgICAgY29uc2VudDogY29uZmlnLmNvbnNlbnQsCiAgICAgIHNlc3Npb25TdG9yYWdlS2V5OiBjb25maWcuc3RvcmFnZUtleXM/LnNlc3Npb25JZCwKICAgIH0pOwogIH0gY2F0Y2ggKGVycm9yKSB7CiAgICBsb2dnZXIuZXJyb3IoJ0NvdWxkIG5vdCBjcmVhdGUgdGhlIHBhZ2UgRXZlbnRTZXJ2aWNlOicsIGVycm9yKTsKICB9CiAgc3RhcnREYXRhTGF5ZXJCcmlkZ2UoY29uZmlnLmRhdGFMYXllckJyaWRnZSk7Cn0KCmV4cG9ydCBmdW5jdGlvbiBpbml0KGNvbmZpZzogQnVuZGxlSW5pdENvbmZpZyk6IE9tbmlndWlkZUluc3RhbmNlIHsKICB2YWxpZGF0ZUluaXRDb25maWcoY29uZmlnKTsKICBpZiAoIWNvbmZpZy53ZWJzaXRlSWQpIHsKICAgIHRocm93IG5ldyBFcnJvcignW09tbmlndWlkZV0gd2Vic2l0ZUlkIGlzIHJlcXVpcmVkIGluIGNvbmZpZycpOwogIH0KCiAgLy8gU2V0IGN1cnJlbnQtcGFnZSBvdmVycmlkZSBmb3IgbW9jay9kZXYgc3RvcmVzCiAgaWYgKGNvbmZpZy5jdXJyZW50UGFnZSkgewogICAgc2V0Q3VycmVudFBhZ2VPdmVycmlkZShjb25maWcuY3VycmVudFBhZ2UpOwogIH0KCiAgLy8gUGFnZSBsZXZlbCwgbm90IHdpZGdldCBsZXZlbC4gVGhlIGJyaWRnZSBmb3J3YXJkcyB0aGUgc3RvcmVmcm9udCdzIG93bgogIC8vIGFuYWx5dGljcyBhcnJheXMsIHdoaWNoIGZpcmUgb24gZXZlcnkgcGFnZSDigJQgaW5jbHVkaW5nIGNhcnQgYW5kIGNoZWNrb3V0LAogIC8vIHdoZXJlIGBkbF9iZWdpbl9jaGVja291dGAgYW5kIGBkbF9wdXJjaGFzZWAgbGl2ZSBhbmQgd2hlcmUgTk8gT21uaWd1aWRlCiAgLy8gd2lkZ2V0IG1vdW50cy4gU3RhcnRpbmcgaXQgZnJvbSBhIG1vdW50ZWQgcHJvdmlkZXIgdGllZCB0aGUgc3RvcmVmcm9udCdzCiAgLy8gbW9zdCB2YWx1YWJsZSBldmVudHMgdG8gd2hldGhlciBhIFBEUC9QTFAgY29udGFpbmVyIGhhcHBlbmVkIHRvIGV4aXN0LgogIHN0YXJ0QnJpZGdlSWZDb25maWd1cmVkKGNvbmZpZyk7CiAgLy8gUGFnZSBsZXZlbCB0b286IGEgdmFyaWFudCBkZWVwIGxpbmsgY2FuIGFycml2ZSBmcm9tIGFueSBvZiBvdXIgc3VyZmFjZXMuCiAgc2V0dXBWYXJpYW50UHJlc2VsZWN0KCk7CiAgc2V0V2hvbGVQcmljZXMoY29uZmlnLnVpPy53aG9sZVByaWNlcyA9PT0gdHJ1ZSk7CgogIGNvbnN0IG9tbmlndWlkZUNvbmZpZyA9IGJ1aWxkQ29uZmlnKGNvbmZpZyk7CiAgY29uc3QgcGxhdGZvcm1BZGFwdGVyID0gYnVpbGRQbGF0Zm9ybUFkYXB0ZXIoY29uZmlnKTsKICAvLyBUaGUgc2FtZSBub3JtYWxpc2VkIHBsYXRmb3JtIHRoZSBhZGFwdGVyIHdhcyBidWlsdCBmcm9tLCBzbyBkZWNvcmF0aW9uIHNlbGVjdG9ycyBhZ3JlZSB3aXRoIGl0LgogIGNvbnN0IHsgcGxhdGZvcm0gfSA9IHJlYWRQbGF0Zm9ybShjb25maWcucGxhdGZvcm0pOwoKICByZXR1cm4gYXV0b0luaXQob21uaWd1aWRlQ29uZmlnLCBwbGF0Zm9ybUFkYXB0ZXIsIG9tbmlndWlkZUNvbmZpZy5mZWF0dXJlcywgY29uZmlnLnNlYXJjaCwgY29uZmlnLnBkcFdpZGdldCwgY29uZmlnLnBscFdpZGdldCwgY29uZmlnLnBscE1hdGNoUmliYm9ucywgY29uZmlnLnBkcE1hdGNoQmFkZ2UsIHBsYXRmb3JtKTsKfQoKLy8g4pSA4pSAIFByZXZpZXcgbW9kZSBjb25zb2xlIEFQSSDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIAKLy8gVXNhZ2U6IE9tbmlndWlkZS5zZXRQcmV2aWV3QXBpKCdodHRwczovL3NlcnZpY2Utc3RhZ2luZy5vbW5pZ3VpZGUuYWknKQovLyAgICAgICAgT21uaWd1aWRlLmNsZWFyUHJldmlld0FwaSgpCi8vICAgICAgICBPbW5pZ3VpZGUuaXNQcmV2aWV3TW9kZSgpCgpleHBvcnQgZnVuY3Rpb24gc2V0UHJldmlld0FwaSh1cmw6IHN0cmluZyk6IHZvaWQgewogIHNldFByZXZpZXdBcGlVcmwodXJsKTsKICAvLyBlc2xpbnQtZGlzYWJsZS1uZXh0LWxpbmUgbm8tY29uc29sZSAtLSBpbnRlbnRpb25hbCB1c2VyLXZpc2libGUgZmVlZGJhY2sgZnJvbSBPbW5pZ3VpZGUuc2V0UHJldmlld0FwaSgpIGNhbGwKICBjb25zb2xlLndhcm4oJ1tPbW5pZ3VpZGVdIFByZXZpZXcgQVBJIHNldCB0byAlcy4gUmVsb2FkIHRoZSBwYWdlIGZvciBjaGFuZ2VzIHRvIHRha2UgZWZmZWN0LicsIHVybCk7Cn0KCmV4cG9ydCBmdW5jdGlvbiBjbGVhclByZXZpZXdBcGkoKTogdm9pZCB7CiAgY2xlYXJQcmV2aWV3QXBpVXJsKCk7CiAgLy8gZXNsaW50LWRpc2FibGUtbmV4dC1saW5lIG5vLWNvbnNvbGUgLS0gaW50ZW50aW9uYWwgdXNlci12aXNpYmxlIGZlZWRiYWNrIGZyb20gT21uaWd1aWRlLmNsZWFyUHJldmlld0FwaSgpIGNhbGwKICBjb25zb2xlLndhcm4oJ1tPbW5pZ3VpZGVdIFByZXZpZXcgQVBJIGNsZWFyZWQuIFJlbG9hZCB0aGUgcGFnZSB0byB1c2UgdGhlIGRlZmF1bHQgQVBJLicpOwp9CgpleHBvcnQgeyBpc1ByZXZpZXdNb2RlIH07CmV4cG9ydCB7IGdldEFuYWx5dGljc0FkYXB0ZXJIZWFsdGggfTsKCi8vIOKUgOKUgCBEZWNsYXJhdGl2ZSBhdXRvLWluaXQg4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSACi8vIFNjYW4gZm9yIDxzY3JpcHQgZGF0YS1vbW5pZ3VpZGUtY29uZmlnPScuLi4nPiBhbmQgY2FsbCBpbml0KCkgYXV0b21hdGljYWxseS4KCmZ1bmN0aW9uIGRlY2xhcmF0aXZlSW5pdCgpOiB2b2lkIHsKICBjb25zdCBzY3JpcHRzID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvckFsbCgnc2NyaXB0W2RhdGEtb21uaWd1aWRlLWNvbmZpZ10nKTsKCiAgc2NyaXB0cy5mb3JFYWNoKChzY3JpcHQpID0+IHsKICAgIGNvbnN0IHJhdyA9IHNjcmlwdC5nZXRBdHRyaWJ1dGUoJ2RhdGEtb21uaWd1aWRlLWNvbmZpZycpOwogICAgaWYgKCFyYXcpIHJldHVybjsKCiAgICB0cnkgewogICAgICBjb25zdCBjb25maWcgPSBKU09OLnBhcnNlKHJhdykgYXMgQnVuZGxlSW5pdENvbmZpZzsKICAgICAgaW5pdChjb25maWcpOwogICAgfSBjYXRjaCAoZSkgewogICAgICBsb2dnZXIuZXJyb3IoJ0ZhaWxlZCB0byBwYXJzZSBkYXRhLW9tbmlndWlkZS1jb25maWc6JywgZSk7CiAgICB9CiAgfSk7Cn0KCmlmICh0eXBlb2YgZG9jdW1lbnQgIT09ICd1bmRlZmluZWQnKSB7CiAgaWYgKGRvY3VtZW50LnJlYWR5U3RhdGUgPT09ICdsb2FkaW5nJykgewogICAgZG9jdW1lbnQuYWRkRXZlbnRMaXN0ZW5lcignRE9NQ29udGVudExvYWRlZCcsIGRlY2xhcmF0aXZlSW5pdCk7CiAgfSBlbHNlIHsKICAgIC8vIERPTSBhbHJlYWR5IGxvYWRlZCAoc2NyaXB0IGxvYWRlZCBhc3luYy9kZWZlciBvciBhdCBib3R0b20pCiAgICBkZWNsYXJhdGl2ZUluaXQoKTsKICB9Cn0KCi8vIOKUgOKUgCBHbG9iYWwgZXhwb3N1cmUg4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSACi8vIFRoZSBVTUQgYnVpbGQgc2V0cyB3aW5kb3cuT21uaWd1aWRlIHZpYSBWaXRlJ3MgbGliIHdyYXBwZXIsIGJ1dCB3aGVuCi8vIGltcG9ydGVkIGFzIEVTTSAoZS5nLiBtb2NrLXN0b3JlIGRldiBzZXJ2ZXIpIHdlIG5lZWQgYW4gZXhwbGljaXQgYXNzaWdubWVudC4KLy8gSU1QT1JUQU5UOiBPbmx5IGFzc2lnbiBpZiBPbW5pZ3VpZGUgZG9lc24ndCBhbHJlYWR5IGV4aXN0IChpLmUuIEVTTSBtb2RlKS4KLy8gSW4gVU1EIG1vZGUgdGhlIHdyYXBwZXIgYWxyZWFkeSBwb3B1bGF0ZWQgd2luZG93Lk9tbmlndWlkZSB3aXRoIGFsbCBleHBvcnRzOwovLyBvdmVyd3JpdGluZyBpdCBoZXJlIHdvdWxkIGxvc2UgdGhlIHJlLWV4cG9ydGVkIGludGVncmF0aW9uIGNsYXNzZXMvdXRpbGl0aWVzLgppZiAodHlwZW9mIHdpbmRvdyAhPT0gJ3VuZGVmaW5lZCcgJiYgISh3aW5kb3cgYXMgdW5rbm93biBhcyBSZWNvcmQ8c3RyaW5nLCB1bmtub3duPilbJ09tbmlndWlkZSddKSB7CiAgKHdpbmRvdyBhcyB1bmtub3duIGFzIFJlY29yZDxzdHJpbmcsIHVua25vd24+KVsnT21uaWd1aWRlJ10gPSB7CiAgICBpbml0LAogICAgZ2V0VmVyc2lvbiwKICAgIHNldFByZXZpZXdBcGksCiAgICBjbGVhclByZXZpZXdBcGksCiAgICBpc1ByZXZpZXdNb2RlLAogICAgLy8gUmVhY2hhYmxlIGZyb20gYSBzdG9yZWZyb250IGNvbnNvbGUgc28gYSB3aXJpbmcgYXVkaXQgZG9lcyBub3QgaGF2ZSB0bwogICAgLy8gY2xpY2sgYSBwcm9kdWN0IGFuZCB3YXRjaCBmb3IgdGhlIHdhcm5pbmcuCiAgICBnZXRBbmFseXRpY3NBZGFwdGVySGVhbHRoLAogIH07Cn0K", import.meta.url).href;
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
function formatPrice(value) {
  if (value === null || value === void 0 || value === "") return null;
  let numericPrice;
  if (typeof value === "number") {
    numericPrice = value;
  } else if (typeof value === "string") {
    numericPrice = parseFloat(value.replace(/\$|\s|,(?=\d{3}(?!\d))/g, ""));
  } else {
    return null;
  }
  if (!Number.isFinite(numericPrice)) return null;
  const digits = dropsCents(numericPrice) ? 0 : 2;
  return `$${numericPrice.toLocaleString("en-US", { minimumFractionDigits: digits, maximumFractionDigits: digits })}`;
}
function currencyMinorUnits(currency) {
  if (!currency) return 2;
  try {
    return new Intl.NumberFormat("en-US", { style: "currency", currency }).resolvedOptions().maximumFractionDigits ?? 2;
  } catch {
    return 2;
  }
}
function isWholeAmount(value, currency) {
  const units = currencyMinorUnits(currency);
  if (units === 0) return true;
  const fixed = new Intl.NumberFormat("en-US", {
    minimumFractionDigits: units,
    maximumFractionDigits: units,
    useGrouping: false
  }).format(value);
  return /\.0+$/.test(fixed);
}
let wholePrices = false;
function setWholePrices(on) {
  wholePrices = on;
}
function dropsCents(value, currency) {
  return wholePrices && isWholeAmount(value, currency);
}
function savePercent(was, now) {
  if (!(was > 0) || !(now < was)) return null;
  const pct = Math.round((was - now) / was * 100);
  return pct > 0 ? pct : null;
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
const MOUNT = { target: ["string", "object"], position: "string" };
const WIDGET = {
  selector: "string",
  mount: MOUNT,
  rootMargin: "string",
  loadMode: "string"
};
const INIT_CONFIG_SPEC = {
  websiteId: "string",
  websiteCode: "string",
  dataLayerBridge: { elevar: "boolean", gtm: "boolean", pageView: "boolean" },
  apiBaseUrl: "string",
  aiSearchStoreUrl: "string",
  platform: "string",
  productSku: "string",
  categoryUrl: "string",
  features: {
    search: "boolean",
    productFit: "boolean",
    categoryGuide: "boolean",
    discoveryQuestions: "boolean",
    conversationalCategoryGuide: "boolean",
    productTags: "boolean",
    plpMatchRibbons: "boolean",
    pdpMatchBadge: "boolean",
    questionnaireTeaser: { categoryGuide: "boolean", productFit: "boolean", resetOnCollapse: "boolean" },
    hideMobileAskBox: "boolean"
  },
  selectors: {
    rootContainer: "string",
    searchExpandButton: "string",
    searchToggles: "string",
    searchInputs: "string",
    searchForms: "string",
    quickSearchResults: "string",
    mobileMenu: "string",
    mobileNav: "string",
    wordpress: { searchButton: "string", searchForms: "string", searchInputs: "string" }
  },
  fallbackImages: { product: "string", category: "string", blog: "string" },
  ui: {
    searchTitle: "string",
    searchSubtitle: "string",
    assistantLabel: "string",
    searchIconUrl: "string",
    supportLabel: "string",
    supportHref: "string",
    searchExampleQuestions: "array",
    linkColor: "string",
    merchantLogoUrl: "string",
    labels: {
      youSaid: "string",
      basedOn: "string",
      startGuide: "string",
      askQuestion: "string",
      startGuideShort: "string",
      guideHeadline: "string",
      guideHeadlineShort: "string",
      guideSubtitle: "string"
    },
    zeroPriceDisplay: "string",
    mobile: { breakpoint: "number", fullScreen: "boolean", searchWidth: "string" },
    redundantContentUrls: "array",
    search: { relatedContentFirstForQuestions: "boolean" },
    anchoredSearch: "boolean",
    searchAnchorSelector: "string",
    anchorMatchWidth: "boolean",
    inlineSearchTarget: "string",
    typeahead: "boolean",
    wholePrices: "boolean",
    searchTrending: "boolean",
    searchTrendingLabel: "string",
    searchResultsModal: "boolean",
    currency: "string",
    searchSheet: "boolean",
    searchPopularTerms: "array",
    searchSheetLogo: { selector: "string", src: "string", alt: "string", href: "string" }
  },
  callbacks: {
    isFeatureEnabled: "function",
    waitForFeatureFlags: "function",
    onOpenSupport: "function",
    onModalOpen: "function",
    onModalClose: "function"
  },
  analyticsAdapter: { track: "function" },
  consent: {
    enabled: "boolean",
    reader: "string",
    getConsentScopes: "function",
    cookieName: "string",
    magentoCookieName: "string",
    magentoWebsiteId: ["string", "number"],
    privacyPolicyUrl: "string"
  },
  storageKeys: {
    sessionId: "string",
    answeredIntents: "string",
    conversationId: "string",
    productAnsweredIntents: "string",
    resultsCollapsed: "string",
    productResultsCollapsed: "string"
  },
  connectionTimeout: "number",
  currentPage: "string",
  productHydrationEndpoint: "string",
  categoryHydrationEndpoint: "string",
  search: {
    trigger: "string",
    replace: { selector: "string", strategy: "string" },
    renderTrigger: "function",
    icon: "string",
    loadMode: "string",
    onOpen: "function",
    onClose: "function"
  },
  pdpWidget: WIDGET,
  plpWidget: WIDGET,
  plpMatchRibbons: {
    gridSelector: "string",
    cardSelector: "string",
    skuSelector: "string",
    skuPrefix: "string",
    skuAttr: "string",
    topPickThreshold: "number",
    products: "array",
    reorder: "boolean"
  },
  pdpMatchBadge: { imageSelector: "string", platform: "string", products: "array" },
  tokens: "object"
};
const NULLABLE = /* @__PURE__ */ new Set(["search.replace"]);
const OPEN = /* @__PURE__ */ new Set(["analyticsAdapter"]);
function kindOf(value) {
  if (value === null) return "null";
  if (Array.isArray(value)) return "array";
  const type = typeof value;
  return type === "string" || type === "number" || type === "boolean" || type === "function" ? type : "object";
}
function isLeaf(node) {
  return typeof node === "string" || Array.isArray(node);
}
function acceptedKinds(node) {
  if (!isLeaf(node)) return ["object"];
  return typeof node === "string" ? [node] : node;
}
function checkValue(value, node, path) {
  if (value === void 0 || value === null && NULLABLE.has(path)) return;
  const kind = kindOf(value);
  const kinds = acceptedKinds(node);
  if (!kinds.includes(kind)) {
    logger.warn(`Config "${path}" should be ${kinds.join(" or ")}, got ${kind}.`);
    return;
  }
  if (!isLeaf(node)) checkSection(value, node, path);
}
function checkSection(value, spec, path) {
  for (const [key, node] of Object.entries(spec)) checkValue(value[key], node, join(path, key));
  if (OPEN.has(path)) return;
  for (const key of Object.keys(value)) {
    if (!Object.prototype.hasOwnProperty.call(spec, key)) {
      logger.warn(`Unknown config key "${join(path, key)}": it has no effect. Check the spelling.`);
    }
  }
}
function join(path, key) {
  return path ? `${path}.${key}` : key;
}
function validateInitConfig(config) {
  try {
    checkValue(config, INIT_CONFIG_SPEC, "");
  } catch (error) {
    logger.error("Could not validate the init config:", error);
  }
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
const loadSearchModule = () => import("./omniguide-search-BZePm-K2.js");
const loadProductFitModule = () => import("./omniguide-product-fit-CQPOoODE.js");
const loadCategoryGuideModule = () => import("./omniguide-category-guide-BeSps5Ph.js");
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
  void import("./shared-CdWzopp1.js").then((mod) => {
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
  var _a, _b, _c, _d, _e, _f, _g, _h, _i, _j, _k, _l, _m, _n;
  validateInitConfig(config);
  if (!config.websiteId) {
    throw new Error("[Omniguide] websiteId is required in config");
  }
  startBridgeIfConfigured(config);
  setupVariantPreselect();
  setWholePrices(((_a = config.ui) == null ? void 0 : _a.wholePrices) === true);
  currentConfig = config;
  const base = resolveBase();
  const features = { search: true, productFit: true, categoryGuide: true, ...config.features };
  if (config.tokens) {
    injectTokenOverrides(config.tokens);
  }
  loadCss(base + CSS_ASSETS.tokens);
  if (features.search && ((_b = config.search) == null ? void 0 : _b.replace) !== null) {
    triggerResult = setupSearchTrigger(
      {
        replace: (_c = config.search) == null ? void 0 : _c.replace,
        renderTrigger: (_d = config.search) == null ? void 0 : _d.renderTrigger,
        icon: (_e = config.search) == null ? void 0 : _e.icon,
        selectors: config.selectors,
        websiteId: config.websiteId,
        ui: config.ui
      },
      (query, source) => handleOpenSearch(query, source, base)
    );
    const loadMode = ((_f = config.search) == null ? void 0 : _f.loadMode) ?? "intent";
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
    const pdpObserveEl = resolveObserveTarget((_g = config.pdpWidget) == null ? void 0 : _g.mount, (_h = config.pdpWidget) == null ? void 0 : _h.selector, "[data-omniguide-pdp], #product-recommendations-root");
    if (pdpObserveEl) {
      const loadMode = ((_i = config.pdpWidget) == null ? void 0 : _i.loadMode) ?? "visible";
      if (loadMode === "immediate") {
        mountProductFit(config, base);
      } else {
        const io = observeVisibility(pdpObserveEl, ((_j = config.pdpWidget) == null ? void 0 : _j.rootMargin) ?? "600px", () => {
          mountProductFit(config, base);
        });
        observers.push(io);
      }
    }
  }
  if (features.categoryGuide) {
    const plpObserveEl = resolveObserveTarget((_k = config.plpWidget) == null ? void 0 : _k.mount, (_l = config.plpWidget) == null ? void 0 : _l.selector, "[data-omniguide-plp], #category-recommendations-root");
    if (plpObserveEl) {
      const loadMode = ((_m = config.plpWidget) == null ? void 0 : _m.loadMode) ?? "visible";
      if (loadMode === "immediate") {
        mountCategoryGuide(config, base);
      } else {
        const io = observeVisibility(plpObserveEl, ((_n = config.plpWidget) == null ? void 0 : _n.rootMargin) ?? "600px", () => {
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
  return "0.13.0";
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
  savePercent as b,
  createScopedLogger as c,
  dropsCents as d,
  checkAnalyticsAdapter as e,
  formatPrice as f,
  getPreviewApiUrl as g,
  currencyMinorUnits as h,
  isPreviewMode as i,
  getAnalyticsAdapterHealth as j,
  initPreviewFromQueryParam as k,
  logger as l,
  isWholeAmount as m,
  setPreviewApiUrl as n,
  getVersion as o,
  init as p,
  reportAnalyticsAdapterThrew as r,
  setWholePrices as s
};
