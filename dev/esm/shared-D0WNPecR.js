const DEFAULT_SEARCH_ICON = `<svg width="21" height="21" viewBox="0 0 20.5627 20.5674" fill="none" xmlns="http://www.w3.org/2000/svg">
  <path d="M9.4953 2C8.01204 2 6.56162 2.43967 5.32831 3.26367C2.83318 4.93087 1.55452 8.01993 2.13983 10.9629C2.42923 12.4177 3.14271 13.7548 4.19159 14.8037C6.31348 16.9255 9.59339 17.5769 12.3654 16.4287C15.1387 15.2798 16.9953 12.5021 16.9953 9.5H18.9953C18.9953 10.8103 18.7176 12.1086 18.197 13.3018C17.5727 14.7328 17.593 16.4891 18.6971 17.5929L20.5627 19.458L19.4533 20.5674L17.5853 18.6994C16.4819 17.5959 14.7266 17.5782 13.292 18.1923C9.7981 19.6879 5.55216 18.9923 2.77753 16.2178C1.44898 14.8892 0.544506 13.1962 0.177917 11.3535C-0.563569 7.62581 1.05663 3.71231 4.21698 1.60059C5.77919 0.55682 7.61648 0 9.4953 0V2Z" fill="currentColor"/>
  <path d="M13.7531 0.0488281C13.8338 4.32301 14.6717 5.16046 18.9455 5.24121C19.0082 5.73809 19.0081 6.26091 18.9455 6.75781C14.6719 6.83856 13.8339 7.67665 13.7531 11.9502C13.2563 12.0129 12.7333 12.0129 12.2365 11.9502C12.1558 7.67642 11.3183 6.83848 7.04413 6.75781C6.98149 6.26096 6.98141 5.73804 7.04413 5.24121C11.3185 5.16054 12.1558 4.32324 12.2365 0.0488281C12.7333 -0.0138614 13.2563 -0.0138114 13.7531 0.0488281Z" fill="currentColor"/>
</svg>`;
const TRIGGER_STYLE_ID = "omniguide-search-trigger-styles";
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
function injectSearchStyles(selectors, rootId, anchored = false) {
  if (document.getElementById(TRIGGER_STYLE_ID)) return;
  const quickSearchResults = (selectors == null ? void 0 : selectors.quickSearchResults) ?? '.quickSearchResults, [data-search="quickResults"]';
  const searchForms = (selectors == null ? void 0 : selectors.searchForms) ?? 'form[action="/search.php"], form[data-search="quickSearch"]';
  const searchInputs = (selectors == null ? void 0 : selectors.searchInputs) ?? 'input[name="search_query"]';
  const hideOnActive = [quickSearchResults, searchForms, searchInputs].flatMap((group) => group.split(",")).map((s) => s.trim()).filter(Boolean).map((s) => `body.ai-search-active ${s}`).join(",\n    ");
  const style = document.createElement("style");
  style.id = TRIGGER_STYLE_ID;
  style.textContent = `
    ${hideOnActive} {
      display: none !important;
    }
    ${anchored ? "" : `body.ai-search-active {
      overflow: hidden;
    }`}
    #${rootId} {
      z-index: 10000;
    }
  `;
  document.head.appendChild(style);
}
function swapSearchIcon(selectors, iconSvg) {
  const expandSelector = (selectors == null ? void 0 : selectors.searchExpandButton) ?? "#quick-search-expand";
  const expandId = expandSelector.replace(/^#/, "");
  const searchExpand = document.getElementById(expandId);
  if (!searchExpand) return null;
  const existingSvg = searchExpand.querySelector("svg");
  if (!existingSvg) return null;
  if (iconSvg) {
    const temp = document.createElement("div");
    temp.innerHTML = iconSvg;
    const newSvg = temp.querySelector("svg");
    if (newSvg) {
      existingSvg.replaceWith(newSvg);
      return searchExpand;
    }
  }
  const aiSearchIcon = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  aiSearchIcon.setAttribute("width", "21");
  aiSearchIcon.setAttribute("height", "21");
  aiSearchIcon.setAttribute("viewBox", "0 0 20.5627 20.5674");
  aiSearchIcon.setAttribute("fill", "none");
  aiSearchIcon.style.maxWidth = "20px";
  aiSearchIcon.innerHTML = `
    <path d="M9.4953 2C8.01204 2 6.56162 2.43967 5.32831 3.26367C2.83318 4.93087 1.55452 8.01993 2.13983 10.9629C2.42923 12.4177 3.14271 13.7548 4.19159 14.8037C6.31348 16.9255 9.59339 17.5769 12.3654 16.4287C15.1387 15.2798 16.9953 12.5021 16.9953 9.5H18.9953C18.9953 10.8103 18.7176 12.1086 18.197 13.3018C17.5727 14.7328 17.593 16.4891 18.6971 17.5929L20.5627 19.458L19.4533 20.5674L17.5853 18.6994C16.4819 17.5959 14.7266 17.5782 13.292 18.1923C9.7981 19.6879 5.55216 18.9923 2.77753 16.2178C1.44898 14.8892 0.544506 13.1962 0.177917 11.3535C-0.563569 7.62581 1.05663 3.71231 4.21698 1.60059C5.77919 0.55682 7.61648 0 9.4953 0V2Z" fill="currentColor"/>
    <path d="M13.7531 0.0488281C13.8338 4.32301 14.6717 5.16046 18.9455 5.24121C19.0082 5.73809 19.0081 6.26091 18.9455 6.75781C14.6719 6.83856 13.8339 7.67665 13.7531 11.9502C13.2563 12.0129 12.7333 12.0129 12.2365 11.9502C12.1558 7.67642 11.3183 6.83848 7.04413 6.75781C6.98149 6.26096 6.98141 5.73804 7.04413 5.24121C11.3185 5.16054 12.1558 4.32324 12.2365 0.0488281C12.7333 -0.0138614 13.2563 -0.0138114 13.7531 0.0488281Z" fill="currentColor"/>
  `;
  existingSvg.replaceWith(aiSearchIcon);
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
    addTrackedListener(listeners, input, "focus", ((e) => {
      var _a;
      e.preventDefault();
      e.stopImmediatePropagation();
      (_a = e.target) == null ? void 0 : _a.blur();
      openSearch("", "search_input_focus");
    }), true);
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
  if (!replaceSearchBar()) {
    setTimeout(replaceSearchBar, 100);
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
      (_a2 = document.getElementById(replacementId)) == null ? void 0 : _a2.remove();
      (_b2 = document.getElementById(styleId)) == null ? void 0 : _b2.remove();
      observer.disconnect();
    }
  };
}
function setupSearchTrigger(config, onOpenSearch) {
  var _a, _b, _c, _d, _e;
  const listeners = [];
  const rootId = ((_a = config.selectors) == null ? void 0 : _a.rootContainer) ?? "ai-search-root";
  let triggerElement = null;
  let customCleanup = null;
  let mobileCleanup = null;
  let triggerObserver = null;
  let retryTimeout = null;
  const closeSearch = () => {
    if (document.body.getAttribute("data-omniguide-search") === config.websiteId) {
      document.body.classList.remove("ai-search-active");
      document.body.removeAttribute("data-omniguide-search");
    }
    window.dispatchEvent(new CustomEvent("closeAISearch", {
      detail: { websiteId: config.websiteId }
    }));
  };
  const openSearch = (query = "", source = "unknown") => {
    document.body.classList.add("ai-search-active");
    document.body.setAttribute("data-omniguide-search", config.websiteId);
    onOpenSearch(query, source);
  };
  injectSearchStyles(config.selectors, rootId, !!config.anchoredSearch);
  if (config.renderTrigger && ((_b = config.replace) == null ? void 0 : _b.selector)) {
    const mount = document.querySelector(config.replace.selector);
    if (mount) {
      triggerElement = mount;
      customCleanup = config.renderTrigger({
        mount,
        open: (query) => openSearch(query ?? "", "custom_trigger"),
        close: closeSearch
      });
    }
  } else if ((_c = config.replace) == null ? void 0 : _c.selector) {
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
        (_d = mount.parentNode) == null ? void 0 : _d.insertBefore(btn, mount);
        triggerElement = btn;
      } else if (strategy === "after") {
        (_e = mount.parentNode) == null ? void 0 : _e.insertBefore(btn, mount.nextSibling);
        triggerElement = btn;
      }
    }
  } else {
    let hooked = false;
    const isDesktop = window.innerWidth > 767;
    const applyDesktopTrigger = () => {
      const el = swapSearchIcon(config.selectors, config.icon);
      if (!el) return false;
      triggerElement = el;
      if (isDesktop) {
        if (isWordPressEnvironment(config.selectors)) {
          overrideWordPressSearch(config.selectors, openSearch, listeners);
        } else {
          overrideDesktopSearch(config.selectors, openSearch, listeners);
        }
      }
      return true;
    };
    hooked = applyDesktopTrigger();
    if (!hooked) {
      retryTimeout = window.setTimeout(() => {
        if (!hooked) hooked = applyDesktopTrigger();
      }, 100);
      triggerObserver = new MutationObserver(() => {
        if (hooked || applyDesktopTrigger()) {
          hooked = true;
          triggerObserver == null ? void 0 : triggerObserver.disconnect();
        }
      });
      triggerObserver.observe(document.body, { childList: true, subtree: true });
    }
    mobileCleanup = setupMobileSearch(config, openSearch);
  }
  const handleClose = ((e) => {
    var _a2;
    if (((_a2 = e.detail) == null ? void 0 : _a2.websiteId) && e.detail.websiteId !== config.websiteId) return;
    closeSearch();
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
      triggerObserver == null ? void 0 : triggerObserver.disconnect();
      if (retryTimeout != null) clearTimeout(retryTimeout);
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
  const base = new URL("data:video/mp2t;base64,LyoqCiAqIEBzd2lmdG90dGVyL29tbmlndWlkZS1idW5kbGUKICoKICogUHJlLWJ1aWx0IFVNRCBidW5kbGUgZm9yIE9tbmlndWlkZSBBSSBTREsuCiAqIFdvcmtzIHZpYSA8c2NyaXB0PiB0YWcg4oCUIG5vIGJ1aWxkIHRvb2xpbmcgcmVxdWlyZWQuCiAqCiAqIFVzYWdlOgogKiAgIDxsaW5rIHJlbD0ic3R5bGVzaGVldCIgaHJlZj0ib21uaWd1aWRlLXNkay5jc3MiPgogKiAgIDxzY3JpcHQgc3JjPSJvbW5pZ3VpZGUtc2RrLnN0YW5kYWxvbmUuanMiPjwvc2NyaXB0PgogKiAgIDxzY3JpcHQ+CiAqICAgICBPbW5pZ3VpZGUuaW5pdCh7IHdlYnNpdGVJZDogJ2h0dHBzOi8vbXlzdG9yZS5jb20vJyB9KTsKICogICA8L3NjcmlwdD4KICoKICogT3IgZGVjbGFyYXRpdmVseToKICogICA8c2NyaXB0IHNyYz0ib21uaWd1aWRlLXNkay5zdGFuZGFsb25lLmpzIiBkYXRhLW9tbmlndWlkZS1jb25maWc9J3sid2Vic2l0ZUlkIjoiaHR0cHM6Ly9teXN0b3JlLmNvbS8ifSc+PC9zY3JpcHQ+CiAqLwoKLy8gU2lkZS1lZmZlY3QgaW1wb3J0OiBleHRyYWN0cyBDU1MgaW50byBvbW5pZ3VpZGUtc2RrLmNzcwppbXBvcnQgJ0Bzd2lmdG90dGVyL29tbmlndWlkZS1zdHlsZXMnOwoKaW1wb3J0IHsKICBsb2dnZXIsCiAgaW5pdFByZXZpZXdGcm9tUXVlcnlQYXJhbSwKICBzZXRQcmV2aWV3QXBpVXJsLAogIGNsZWFyUHJldmlld0FwaVVybCwKICBpc1ByZXZpZXdNb2RlLAogIHNldEN1cnJlbnRQYWdlT3ZlcnJpZGUsCiAgc3RhcnREYXRhTGF5ZXJCcmlkZ2UsCiAgLy8gSW1wb3J0ZWQsIG5vdCBqdXN0IHJlLWV4cG9ydGVkOiBgZXhwb3J0IHsgeCB9IGZyb20gJ+KApidgIGNyZWF0ZXMgbm8gbG9jYWwKICAvLyBiaW5kaW5nLCBhbmQgdGhlIHdpbmRvdy5PbW5pZ3VpZGUgbGl0ZXJhbCBiZWxvdyBuZWVkcyB0aGUgdmFsdWUgaXRzZWxmLgogIGdldEFuYWx5dGljc0FkYXB0ZXJIZWFsdGgsCiAgaXNEYXRhTGF5ZXJCcmlkZ2VFbmFibGVkLAogIGVuc3VyZVBhZ2VFdmVudFNlcnZpY2UsCiAgZ2V0QXBpQmFzZVVybCwKfSBmcm9tICdAc3dpZnRvdHRlci9vbW5pZ3VpZGUtY29yZSc7CmltcG9ydCB0eXBlIHsgQnVuZGxlSW5pdENvbmZpZywgT21uaWd1aWRlSW5zdGFuY2UgfSBmcm9tICcuL3R5cGVzLmpzJzsKaW1wb3J0IHsgYnVpbGRDb25maWcsIGJ1aWxkUGxhdGZvcm1BZGFwdGVyIH0gZnJvbSAnLi9kZWZhdWx0cy5qcyc7CmltcG9ydCB7IHN0YXJ0RWNvbW1lcmNlQW5hbHl0aWNzSWZDb25maWd1cmVkIH0gZnJvbSAnLi9lY29tbWVyY2UtYW5hbHl0aWNzLmpzJzsKaW1wb3J0IHsgY3JlYXRlU3RhcnQgfSBmcm9tICcuL3N0YXJ0LmpzJzsKCmltcG9ydCB7IGF1dG9Jbml0IH0gZnJvbSAnLi9hdXRvLWluaXQuanMnOwoKLy8gQ2hlY2sgcXVlcnkgcGFyYW0gb3ZlcnJpZGUgYmVmb3JlIGFueSBpbml0KCkgY2FsbAppbml0UHJldmlld0Zyb21RdWVyeVBhcmFtKCk7CgovLyBSZS1leHBvcnQgdHlwZXMgZm9yIGFkdmFuY2VkIGNvbnN1bWVycwpleHBvcnQgdHlwZSB7IEJ1bmRsZUluaXRDb25maWcsIE9tbmlndWlkZUluc3RhbmNlIH0gZnJvbSAnLi90eXBlcy5qcyc7CgovLyBSZS1leHBvcnQgaW50ZWdyYXRpb24gY2xhc3NlcyBhbmQgdXRpbGl0aWVzIGZvciBhZHZhbmNlZCB1c2FnZQpleHBvcnQgewogIEJDU2VhcmNoSW50ZWdyYXRpb24sCiAgQkNQcm9kdWN0Rml0SW50ZWdyYXRpb24sCiAgQkNDYXRlZ29yeUd1aWRlSW50ZWdyYXRpb24sCiAgY3JlYXRlQmlnQ29tbWVyY2VBZGFwdGVyLAogIGluaXRCaWdDb21tZXJjZUFkYXB0ZXIsCiAgY3JlYXRlQmlnQ29tbWVyY2VDb21wYXQsCiAgTEFURU5DWSwKICBSZXNwb25zZVRpbWVyLAogIGNyZWF0ZVJlc3BvbnNlVGltZXIsCn0gZnJvbSAnQHN3aWZ0b3R0ZXIvb21uaWd1aWRlLWJpZ2NvbW1lcmNlJzsKCi8vIFJlLWV4cG9ydCBjb3JlIHV0aWxpdGllcyBmb3IgdGhlbWUgd3JhcHBlciBmaWxlcyBhbmQgY3VzdG9tIHNldHVwcwpleHBvcnQgewogIGNyZWF0ZVNlc3Npb25TZXJ2aWNlLAogIGNyZWF0ZUNvbnNlbnRTZXJ2aWNlLAogIE51bGxQbGF0Zm9ybUFkYXB0ZXIsCiAgY3JlYXRlUGxhdGZvcm1BZGFwdGVyLAogIGdldFBhZ2VDb250ZXh0LAogIGNhcHR1cmVQYWdlQ29udGV4dCwKICB0cmFja0V2ZW50LAogIHVwZGF0ZUV2ZW50Q29udGV4dCwKICBnZXRDb25zZW50U3RhdGUsCn0gZnJvbSAnQHN3aWZ0b3R0ZXIvb21uaWd1aWRlLWNvcmUnOwoKZXhwb3J0IHsgT21uaWd1aWRlUHJvdmlkZXIgfSBmcm9tICdAc3dpZnRvdHRlci9vbW5pZ3VpZGUtcmVhY3QnOwoKLy8gUExQIHN1cmZhY2UgKFNPSS02MzkpIOKAlCBjaHJvbWUgZXh0ICsgVHJhY3Qtc3R5bGUgZGlyZWN0LWluc3RhbGwgY29uc3VtZXJzCi8vIHBpY2sgdXAgdGhlIGNvbnRhaW5lciwgaG9va3MsIGFuZCBoZWxwZXJzIHZpYSB3aW5kb3cuT21uaWd1aWRlIGluIHRoZQovLyBzdGFuZGFsb25lL2V4dGVybmFsIGJ1aWxkcy4gVGhlIG5wbS1wYWNrYWdlIGNvbnN1bXB0aW9uIHBhdGggKG1vY2stc3RvcmUKLy8gKyBmdXR1cmUgU0RLIGNvbnN1bWVycykgaW1wb3J0cyBmcm9tIGBAc3dpZnRvdHRlci9vbW5pZ3VpZGUtcHJvZHVjdC1saXN0YAovLyBkaXJlY3RseTsgYm90aCByZWFjaCB0aGUgc2FtZSBleHBvcnRzLgpleHBvcnQgewogIFByb2R1Y3RMaXN0Q29udGFpbmVyLAogIENhdGVnb3J5SGVhZGVyLAogIFByb2R1Y3RHcmlkLAogIFRvb2xiYXIsCiAgU29ydFNlbGVjdCwKICBGYWNldFNpZGViYXIsCiAgTXVsdGlTZWxlY3RGYWNldCwKICBQcmljZVJhbmdlRmFjZXQsCiAgQWN0aXZlRmlsdGVycywKICBMb2FkTW9yZSwKICBSZWRpcmVjdERyaWxsZG93biwKICBTT1JUX1ZBTFVFUywKICBwYXJzZUZpbHRlcnMsCiAgYnVpbGRVcmwsCiAgcHVzaEZpbHRlcnMsCiAgZmV0Y2hQTFAsCiAgU0VTU0lPTl9JRF9IRUFERVIsCiAgdXNlUHJvZHVjdExpc3QsCiAgdXNlV2ViVml0YWxzQmVhY29uLAogIHJlbmRlclByb2R1Y3RMaXN0LAogIHR5cGUgUmVuZGVyUHJvZHVjdExpc3RDb25maWcsCiAgdHlwZSBSZW5kZXJQcm9kdWN0TGlzdEhhbmRsZSwKfSBmcm9tICdAc3dpZnRvdHRlci9vbW5pZ3VpZGUtcHJvZHVjdC1saXN0JzsKCi8vIFNoYXJlZCBwcm9kdWN0LWRpc3BsYXkgcHJpbWl0aXZlcyB1c2VkIGJ5IFBMUCArIGZ1dHVyZSBjYXJvdXNlbCBVSS4KZXhwb3J0IHsKICBQcm9kdWN0VGlsZSwKICBQcm9kdWN0SW1hZ2UsCiAgUHJpY2VCbG9jaywKICBGbGFnQmFkZ2VzLAogIFZhcmlhbnRTd2F0Y2hlcywKICBQcm9kdWN0VGlsZVNrZWxldG9uLAp9IGZyb20gJ0Bzd2lmdG90dGVyL29tbmlndWlkZS1jYXRhbG9nJzsKCi8vIENhcm91c2VsIHN1cmZhY2UgKFNPSS02NDApIOKAlCBuYXJyYXRpdmUtbGVkIHJlY29tbWVuZGF0aW9uIHJvd3MgZm9yIFBEUCArCi8vIGhvbWUvQ01TIHBhZ2VzLiBDaHJvbWUgZXh0ZW5zaW9uIGNvbnN1bWVzIHZpYSB3aW5kb3cuT21uaWd1aWRlLnJlbmRlckNhcm91c2VsLgpleHBvcnQgewogIENhcm91c2VsQ29udGFpbmVyLAogIENhcm91c2VsUm93LAogIENhcm91c2VsQ2FyZCwKICBDYXJvdXNlbFJvd1NrZWxldG9uLAogIE5hcnJhdGl2ZUJsb2NrLAogIENhcm91c2VsU291cmNlQmFkZ2UsCiAgZmV0Y2hDYXJvdXNlbCwKICBDQVJPVVNFTF9FTVBUWSwKICBDYXJvdXNlbFNsb3ROb3RGb3VuZEVycm9yLAogIHVzZUNhcm91c2VsLAogIHVzZUNhcm91c2VsRXZlbnRzLAogIHVzZUNhcm91c2VsVmlzaWJpbGl0eSwKICBjcmVhdGVWaXNpYmlsaXR5VHJhY2tlciwKICBidWlsZENhcm91c2VsRXZlbnRFbmRwb2ludCwKICBtYWtlQ2Fyb3VzZWxFdmVudFNlcmlhbGl6ZXIsCiAgcmVuZGVyQ2Fyb3VzZWwsCiAgdHlwZSBSZW5kZXJDYXJvdXNlbEhhbmRsZSwKICB0eXBlIENhcm91c2VsQ29udGFpbmVyUHJvcHMsCiAgdHlwZSBGZXRjaENhcm91c2VsQ29uZmlnLAp9IGZyb20gJ0Bzd2lmdG90dGVyL29tbmlndWlkZS1jYXJvdXNlbCc7CgpkZWNsYXJlIGNvbnN0IF9fT01OSUdVSURFX1ZFUlNJT05fXzogc3RyaW5nOwoKLyoqCiAqIEdldCB0aGUgYnVuZGxlIHZlcnNpb24uCiAqLwpleHBvcnQgZnVuY3Rpb24gZ2V0VmVyc2lvbigpOiBzdHJpbmcgewogIHJldHVybiBfX09NTklHVUlERV9WRVJTSU9OX187Cn0KCi8qKgogKiBJbml0aWFsaXplIHRoZSBPbW5pZ3VpZGUgU0RLIHdpdGggYSBzaW1wbGlmaWVkIGNvbmZpZy4KICoKICogVGhpcyBpcyB0aGUgcHJpbWFyeSBBUEkgZm9yIHNjcmlwdC10YWcgY29uc3VtZXJzLgogKiBJdCBidWlsZHMgdGhlIGZ1bGwgY29uZmlnLCBjcmVhdGVzIGEgcGxhdGZvcm0gYWRhcHRlciwKICogYW5kIGluaXRpYWxpemVzIGFsbCBlbmFibGVkIGZlYXR1cmUgaW50ZWdyYXRpb25zLgogKi8KLyoqCiAqIFN0YXJ0IHRoZSBkYXRhTGF5ZXIgYnJpZGdlIG9uY2UgcGVyIGluaXQsIGlmIHRoZSBzdG9yZWZyb250IGFza2VkIGZvciBpdC4KICoKICogVGhlIHJldHVybmVkIGRldGFjaCBpcyBkcm9wcGVkIG9uIHB1cnBvc2U6IHRoZSBicmlkZ2UgbGl2ZXMgYXMgbG9uZyBhcyB0aGUKICogZG9jdW1lbnQgZG9lcy4gVGhlcmUgaXMgbm8gcGFnZS1sZXZlbCB0ZWFyZG93biB0byBoYW5nIGl0IG9uLCBhbmQgdGhlIHBvbGxlcgogKiBpcyByZWZjb3VudGVkLCBzbyBhIHNlY29uZCBpbml0KCkgaXMgc2FmZS4KICoKICogVGhlIFNJTksgaXMgY3JlYXRlZCBoZXJlIHRvbywgYXQgdGhlIHNhbWUgcGFnZSBsZXZlbCBhcyB0aGUgYnJpZGdlLiBTdGFydGluZwogKiB0aGUgYnJpZGdlIHBhZ2UtbGV2ZWwgd2hpbGUgdGhlIG9ubHkgRXZlbnRTZXJ2aWNlIHdhcyBidWlsdCBieSBhIFJlYWN0CiAqIHByb3ZpZGVyIG1lYW50IGEgY2FydCwgY2hlY2tvdXQgb3Igb3JkZXItY29uZmlybWF0aW9uIHBhZ2UgZm9yd2FyZGVkIGludG8KICogbm90aGluZzogdGhlIGJyaWRnZSBwb2xsZWQsIGZvdW5kIG5vIHNlcnZpY2UgYW5kIGRyb3BwZWQgaXRzIGJhY2tsb2cgYXQKICogdW5sb2FkLiBgZW5zdXJlUGFnZUV2ZW50U2VydmljZWAgaXMgaWRlbXBvdGVudCwgc28gYSBwcm92aWRlciB0aGF0IGRvZXMKICogbW91bnQgbGF0ZXIgc2hhcmVzIHRoaXMgb25lIGluc3RhbmNlIHJhdGhlciB0aGFuIG9wZW5pbmcgYSByaXZhbCBxdWV1ZS4KICovCmZ1bmN0aW9uIHN0YXJ0QnJpZGdlSWZDb25maWd1cmVkKGNvbmZpZzogQnVuZGxlSW5pdENvbmZpZyk6IHZvaWQgewogIC8vIFRoZSBicmlkZ2UncyBvd24gdmVyZGljdCwgbm90IGEgc2Vjb25kIGNvcHkgb2YgaXQuIGB7fWAgYW5kCiAgLy8gYHtndG06IGZhbHNlfWAgYXJlIGJvdGggIm9mZiIsIGFuZCBidWlsZGluZyBhIHNpbmsgZm9yIHRoZW0gd291bGQgbGVhdmUgYQogIC8vIGZsdXNoIGludGVydmFsIGFuZCB1bmxvYWQgbGlzdGVuZXJzIG9uIGEgc3RvcmVmcm9udCB0aGF0IHNhaWQgbm8uCiAgaWYgKCFpc0RhdGFMYXllckJyaWRnZUVuYWJsZWQoY29uZmlnLmRhdGFMYXllckJyaWRnZSkpIHJldHVybjsKICAvLyBDb250YWluZWQsIGFuZCB0aGUgYnJpZGdlIHN0aWxsIHN0YXJ0cy4gQnVpbGRpbmcgdGhlIHNpbmsgcmVhZHMgdGhlCiAgLy8gc3RvcmVmcm9udCdzIGNvbnNlbnQgY29uZmlnLCB3aGljaCBpbml0KCkgdGFrZXMgb24gdHJ1c3QgZnJvbSBhIEpTT04KICAvLyBhdHRyaWJ1dGUg4oCUIGFuIHVua25vd24gcmVhZGVyIG5hbWUgdGhyb3dzLiBCZWZvcmUgdGhpcyByYW4gYXQgcGFnZSBsZXZlbAogIC8vIHRoYXQgdGhyZXcgaW5zaWRlIG9uZSB3aWRnZXQncyByZW5kZXIsIHdoZXJlIGF1dG8taW5pdCBjYXVnaHQgaXQ7IGhlcmUgaXQKICAvLyB3b3VsZCBlc2NhcGUgaW5pdCgpIGFuZCB0YWtlIHNlYXJjaCwgUERQIGFuZCBQTFAgZG93biB3aXRoIGl0LgogIHRyeSB7CiAgICBlbnN1cmVQYWdlRXZlbnRTZXJ2aWNlKHsKICAgICAgYXBpQmFzZVVybDogZ2V0QXBpQmFzZVVybChjb25maWcuYXBpQmFzZVVybCksCiAgICAgIHdlYnNpdGVJZDogY29uZmlnLndlYnNpdGVJZCwKICAgICAgY29uc2VudDogY29uZmlnLmNvbnNlbnQsCiAgICAgIHNlc3Npb25TdG9yYWdlS2V5OiBjb25maWcuc3RvcmFnZUtleXM/LnNlc3Npb25JZCwKICAgIH0pOwogIH0gY2F0Y2ggKGVycm9yKSB7CiAgICBsb2dnZXIuZXJyb3IoJ0NvdWxkIG5vdCBjcmVhdGUgdGhlIHBhZ2UgRXZlbnRTZXJ2aWNlOicsIGVycm9yKTsKICB9CiAgc3RhcnREYXRhTGF5ZXJCcmlkZ2UoY29uZmlnLmRhdGFMYXllckJyaWRnZSk7Cn0KCmV4cG9ydCBmdW5jdGlvbiBpbml0KGNvbmZpZzogQnVuZGxlSW5pdENvbmZpZyk6IE9tbmlndWlkZUluc3RhbmNlIHsKICBpZiAoIWNvbmZpZy53ZWJzaXRlSWQpIHsKICAgIHRocm93IG5ldyBFcnJvcignW09tbmlndWlkZV0gd2Vic2l0ZUlkIGlzIHJlcXVpcmVkIGluIGNvbmZpZycpOwogIH0KCiAgLy8gU2V0IGN1cnJlbnQtcGFnZSBvdmVycmlkZSBmb3IgbW9jay9kZXYgc3RvcmVzCiAgaWYgKGNvbmZpZy5jdXJyZW50UGFnZSkgewogICAgc2V0Q3VycmVudFBhZ2VPdmVycmlkZShjb25maWcuY3VycmVudFBhZ2UpOwogIH0KCiAgLy8gUGFnZSBsZXZlbCwgbm90IHdpZGdldCBsZXZlbC4gVGhlIGJyaWRnZSBmb3J3YXJkcyB0aGUgc3RvcmVmcm9udCdzIG93bgogIC8vIGFuYWx5dGljcyBhcnJheXMsIHdoaWNoIGZpcmUgb24gZXZlcnkgcGFnZSDigJQgaW5jbHVkaW5nIGNhcnQgYW5kIGNoZWNrb3V0LAogIC8vIHdoZXJlIGBkbF9iZWdpbl9jaGVja291dGAgYW5kIGBkbF9wdXJjaGFzZWAgbGl2ZSBhbmQgd2hlcmUgTk8gT21uaWd1aWRlCiAgLy8gd2lkZ2V0IG1vdW50cy4gU3RhcnRpbmcgaXQgZnJvbSBhIG1vdW50ZWQgcHJvdmlkZXIgdGllZCB0aGUgc3RvcmVmcm9udCdzCiAgLy8gbW9zdCB2YWx1YWJsZSBldmVudHMgdG8gd2hldGhlciBhIFBEUC9QTFAgY29udGFpbmVyIGhhcHBlbmVkIHRvIGV4aXN0LgogIHN0YXJ0QnJpZGdlSWZDb25maWd1cmVkKGNvbmZpZyk7CgogIGNvbnN0IG9tbmlndWlkZUNvbmZpZyA9IGJ1aWxkQ29uZmlnKGNvbmZpZyk7CiAgY29uc3QgcGxhdGZvcm1BZGFwdGVyID0gYnVpbGRQbGF0Zm9ybUFkYXB0ZXIoY29uZmlnKTsKCiAgLy8gUGFnZSBsZXZlbCwgZm9yIHRoZSBzYW1lIHJlYXNvbiBhcyB0aGUgYnJpZGdlIGFib3ZlOiBgcHVyY2hhc2VgIGFuZAogIC8vIGBiZWdpbl9jaGVja291dGAgZmlyZSBvbiBwYWdlcyB3aGVyZSBubyB3aWRnZXQgbW91bnRzLiBUaGUgaGVscGVyIHNoYXJlZAogIC8vIHdpdGggYHN0YXJ0KClgIGFuZCB0aGUgRVNNIGxvYWRlciwgc28gdGhlIGVudHJpZXMgY2Fubm90IGRyaWZ0IGFwYXJ0LgogIHN0YXJ0RWNvbW1lcmNlQW5hbHl0aWNzSWZDb25maWd1cmVkKGNvbmZpZyk7CgogIHJldHVybiBhdXRvSW5pdChvbW5pZ3VpZGVDb25maWcsIHBsYXRmb3JtQWRhcHRlciwgb21uaWd1aWRlQ29uZmlnLmZlYXR1cmVzLCBjb25maWcuc2VhcmNoLCBjb25maWcucGRwV2lkZ2V0LCBjb25maWcucGxwV2lkZ2V0LCBjb25maWcucGxwTWF0Y2hSaWJib25zLCBjb25maWcucGRwTWF0Y2hCYWRnZSwgY29uZmlnLnBsYXRmb3JtKTsKfQoKLyoqCiAqIEluaXRpYWxpc2UgdGhlIFNESyB0aGUgd2F5IGEgc3RvcmVmcm9udCBzaG91bGQ6IGFmdGVyIHRoZSBET00gaXMgcmVhZHksIGFuZAogKiBvbmx5IGZvciB0aGUgYXJtIG9mIHRoZSBBL0IgZXhwZXJpbWVudCB0aGF0IHNob3VsZCBzZWUgaXQuCiAqCiAqIFJlc29sdmVzIHRvIGBudWxsYCDigJQgaGF2aW5nIGluaXRpYWxpc2VkIG5vdGhpbmcg4oCUIHdoZW4gdGhlIHZpc2l0b3IgaXMgaW4gYQogKiBjb250cm9sIGFybS4gU2VlIGBzdGFydC50c2AgYW5kIGBleHBlcmltZW50LnRzYC4KICovCmV4cG9ydCBjb25zdCBzdGFydDogKGNvbmZpZzogQnVuZGxlSW5pdENvbmZpZykgPT4gUHJvbWlzZTxPbW5pZ3VpZGVJbnN0YW5jZSB8IG51bGw+ID0gY3JlYXRlU3RhcnQoaW5pdCk7CgovLyDilIDilIAgUHJldmlldyBtb2RlIGNvbnNvbGUgQVBJIOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgAovLyBVc2FnZTogT21uaWd1aWRlLnNldFByZXZpZXdBcGkoJ2h0dHBzOi8vc2VydmljZS1zdGFnaW5nLm9tbmlndWlkZS5haScpCi8vICAgICAgICBPbW5pZ3VpZGUuY2xlYXJQcmV2aWV3QXBpKCkKLy8gICAgICAgIE9tbmlndWlkZS5pc1ByZXZpZXdNb2RlKCkKCmV4cG9ydCBmdW5jdGlvbiBzZXRQcmV2aWV3QXBpKHVybDogc3RyaW5nKTogdm9pZCB7CiAgc2V0UHJldmlld0FwaVVybCh1cmwpOwogIC8vIGVzbGludC1kaXNhYmxlLW5leHQtbGluZSBuby1jb25zb2xlIC0tIGludGVudGlvbmFsIHVzZXItdmlzaWJsZSBmZWVkYmFjayBmcm9tIE9tbmlndWlkZS5zZXRQcmV2aWV3QXBpKCkgY2FsbAogIGNvbnNvbGUud2FybignW09tbmlndWlkZV0gUHJldmlldyBBUEkgc2V0IHRvICVzLiBSZWxvYWQgdGhlIHBhZ2UgZm9yIGNoYW5nZXMgdG8gdGFrZSBlZmZlY3QuJywgdXJsKTsKfQoKZXhwb3J0IGZ1bmN0aW9uIGNsZWFyUHJldmlld0FwaSgpOiB2b2lkIHsKICBjbGVhclByZXZpZXdBcGlVcmwoKTsKICAvLyBlc2xpbnQtZGlzYWJsZS1uZXh0LWxpbmUgbm8tY29uc29sZSAtLSBpbnRlbnRpb25hbCB1c2VyLXZpc2libGUgZmVlZGJhY2sgZnJvbSBPbW5pZ3VpZGUuY2xlYXJQcmV2aWV3QXBpKCkgY2FsbAogIGNvbnNvbGUud2FybignW09tbmlndWlkZV0gUHJldmlldyBBUEkgY2xlYXJlZC4gUmVsb2FkIHRoZSBwYWdlIHRvIHVzZSB0aGUgZGVmYXVsdCBBUEkuJyk7Cn0KCmV4cG9ydCB7IGlzUHJldmlld01vZGUgfTsKZXhwb3J0IHsgZ2V0QW5hbHl0aWNzQWRhcHRlckhlYWx0aCB9OwoKLy8g4pSA4pSAIERlY2xhcmF0aXZlIGF1dG8taW5pdCDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIAKLy8gU2NhbiBmb3IgPHNjcmlwdCBkYXRhLW9tbmlndWlkZS1jb25maWc9Jy4uLic+IGFuZCBjYWxsIGluaXQoKSBhdXRvbWF0aWNhbGx5LgoKZnVuY3Rpb24gZGVjbGFyYXRpdmVJbml0KCk6IHZvaWQgewogIGNvbnN0IHNjcmlwdHMgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yQWxsKCdzY3JpcHRbZGF0YS1vbW5pZ3VpZGUtY29uZmlnXScpOwoKICBzY3JpcHRzLmZvckVhY2goKHNjcmlwdCkgPT4gewogICAgY29uc3QgcmF3ID0gc2NyaXB0LmdldEF0dHJpYnV0ZSgnZGF0YS1vbW5pZ3VpZGUtY29uZmlnJyk7CiAgICBpZiAoIXJhdykgcmV0dXJuOwoKICAgIHRyeSB7CiAgICAgIGNvbnN0IGNvbmZpZyA9IEpTT04ucGFyc2UocmF3KSBhcyBCdW5kbGVJbml0Q29uZmlnOwogICAgICBpbml0KGNvbmZpZyk7CiAgICB9IGNhdGNoIChlKSB7CiAgICAgIGxvZ2dlci5lcnJvcignRmFpbGVkIHRvIHBhcnNlIGRhdGEtb21uaWd1aWRlLWNvbmZpZzonLCBlKTsKICAgIH0KICB9KTsKfQoKaWYgKHR5cGVvZiBkb2N1bWVudCAhPT0gJ3VuZGVmaW5lZCcpIHsKICBpZiAoZG9jdW1lbnQucmVhZHlTdGF0ZSA9PT0gJ2xvYWRpbmcnKSB7CiAgICBkb2N1bWVudC5hZGRFdmVudExpc3RlbmVyKCdET01Db250ZW50TG9hZGVkJywgZGVjbGFyYXRpdmVJbml0KTsKICB9IGVsc2UgewogICAgLy8gRE9NIGFscmVhZHkgbG9hZGVkIChzY3JpcHQgbG9hZGVkIGFzeW5jL2RlZmVyIG9yIGF0IGJvdHRvbSkKICAgIGRlY2xhcmF0aXZlSW5pdCgpOwogIH0KfQoKLy8g4pSA4pSAIEdsb2JhbCBleHBvc3VyZSDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIAKLy8gVGhlIFVNRCBidWlsZCBzZXRzIHdpbmRvdy5PbW5pZ3VpZGUgdmlhIFZpdGUncyBsaWIgd3JhcHBlciwgYnV0IHdoZW4KLy8gaW1wb3J0ZWQgYXMgRVNNIChlLmcuIG1vY2stc3RvcmUgZGV2IHNlcnZlcikgd2UgbmVlZCBhbiBleHBsaWNpdCBhc3NpZ25tZW50LgovLyBJTVBPUlRBTlQ6IE9ubHkgYXNzaWduIGlmIE9tbmlndWlkZSBkb2Vzbid0IGFscmVhZHkgZXhpc3QgKGkuZS4gRVNNIG1vZGUpLgovLyBJbiBVTUQgbW9kZSB0aGUgd3JhcHBlciBhbHJlYWR5IHBvcHVsYXRlZCB3aW5kb3cuT21uaWd1aWRlIHdpdGggYWxsIGV4cG9ydHM7Ci8vIG92ZXJ3cml0aW5nIGl0IGhlcmUgd291bGQgbG9zZSB0aGUgcmUtZXhwb3J0ZWQgaW50ZWdyYXRpb24gY2xhc3Nlcy91dGlsaXRpZXMuCmlmICh0eXBlb2Ygd2luZG93ICE9PSAndW5kZWZpbmVkJyAmJiAhKHdpbmRvdyBhcyB1bmtub3duIGFzIFJlY29yZDxzdHJpbmcsIHVua25vd24+KVsnT21uaWd1aWRlJ10pIHsKICAod2luZG93IGFzIHVua25vd24gYXMgUmVjb3JkPHN0cmluZywgdW5rbm93bj4pWydPbW5pZ3VpZGUnXSA9IHsKICAgIGluaXQsCiAgICBzdGFydCwKICAgIGdldFZlcnNpb24sCiAgICBzZXRQcmV2aWV3QXBpLAogICAgY2xlYXJQcmV2aWV3QXBpLAogICAgaXNQcmV2aWV3TW9kZSwKICAgIC8vIFJlYWNoYWJsZSBmcm9tIGEgc3RvcmVmcm9udCBjb25zb2xlIHNvIGEgd2lyaW5nIGF1ZGl0IGRvZXMgbm90IGhhdmUgdG8KICAgIC8vIGNsaWNrIGEgcHJvZHVjdCBhbmQgd2F0Y2ggZm9yIHRoZSB3YXJuaW5nLgogICAgZ2V0QW5hbHl0aWNzQWRhcHRlckhlYWx0aCwKICB9Owp9Cg==", import.meta.url).href;
  reactPromise = import(
    /* @vite-ignore */
    base + "vendor-react.js"
  ).then(() => {
  });
  return reactPromise;
}
function resolveProductSku(userConfig) {
  var _a;
  if (userConfig.productSku) return userConfig.productSku;
  const selector = userConfig.productSkuSelector;
  if (!selector || typeof document === "undefined") return void 0;
  let text;
  try {
    text = (_a = document.querySelector(selector)) == null ? void 0 : _a.textContent;
  } catch {
    return void 0;
  }
  const trimmed = text == null ? void 0 : text.trim();
  return trimmed ? trimmed : void 0;
}
function productFitApplies(userConfig) {
  return productFitSuppressionReason(userConfig) === null;
}
function productFitSuppressionReason(userConfig) {
  const selector = userConfig.productSkuSelector;
  if (!selector) return null;
  if (resolveProductSku(userConfig) !== void 0) return null;
  return `product fit is OFF for this page: productSkuSelector "${selector}" matched no SKU. If this is a product page, the SKU element is probably rendered after init() runs — use Omniguide.start(), which waits for DOMContentLoaded, or pass productSku directly.`;
}
function resolveCategoryUrl(userConfig) {
  var _a, _b;
  if (userConfig.categoryUrl !== void 0) return userConfig.categoryUrl;
  const suffix = (_a = userConfig.ui) == null ? void 0 : _a.urlSuffix;
  if (!suffix) return void 0;
  if (typeof window === "undefined") return void 0;
  const pathname = (_b = window.location) == null ? void 0 : _b.pathname;
  if (typeof pathname !== "string") return void 0;
  if (pathname !== suffix && pathname.endsWith(suffix)) {
    return pathname.slice(0, -suffix.length);
  }
  return void 0;
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
const log$3 = createScopedLogger("resolveContainer");
const CONTAINER_ATTR = "data-omniguide-container";
function resolveOne(mount) {
  if (!(mount == null ? void 0 : mount.target)) {
    return null;
  }
  let target;
  if (mount.target instanceof HTMLElement) {
    target = mount.target;
  } else {
    try {
      target = document.querySelector(mount.target);
    } catch {
      log$3.warn(`Ignoring malformed mount selector: ${String(mount.target)}`);
      return null;
    }
  }
  if (!target) {
    return null;
  }
  const position = mount.position ?? "inside";
  if (position === "inside") {
    return target;
  }
  if (!target.parentNode) {
    log$3.warn(
      `Mount target is detached from the document (position: ${position}). Skipping it.`
    );
    return null;
  }
  if (position === "replace") {
    const container2 = document.createElement("div");
    target.replaceWith(container2);
    return container2;
  }
  const sibling = position === "before" ? target.previousElementSibling : target.nextElementSibling;
  if (sibling instanceof HTMLElement && sibling.hasAttribute(CONTAINER_ATTR)) {
    return sibling;
  }
  const container = document.createElement("div");
  container.setAttribute(CONTAINER_ATTR, "");
  if (position === "before") {
    target.parentNode.insertBefore(container, target);
  } else {
    target.parentNode.insertBefore(container, target.nextSibling);
  }
  return container;
}
function resolveContainer(mount, defaultId) {
  const entries = mount ? Array.isArray(mount) ? mount : [mount] : [];
  if (entries.length === 0) {
    return document.getElementById(defaultId);
  }
  for (const candidate of entries) {
    const container = resolveOne(candidate);
    if (container) {
      return container;
    }
  }
  return null;
}
function describeMountTargets(mount, defaultId) {
  const entries = mount ? Array.isArray(mount) ? mount : [mount] : [];
  if (entries.length === 0) return `#${defaultId} (default)`;
  return entries.map((m) => {
    if (!(m == null ? void 0 : m.target)) return "(invalid entry)";
    const target = m.target instanceof HTMLElement ? "<HTMLElement>" : m.target;
    return `${target} (${m.position ?? "inside"})`;
  }).join(", ");
}
const SAFE_PROTOCOLS = ["http:", "https:"];
function defaultBase() {
  return typeof window !== "undefined" && window.location ? window.location.origin : void 0;
}
function sanitizeUrl(raw) {
  if (!raw) return "";
  try {
    const url = new URL(raw);
    return url.origin + url.pathname;
  } catch {
    return raw;
  }
}
function isSafeNavigationUrl(url, base = defaultBase()) {
  if (!url || typeof url !== "string") return false;
  try {
    const resolved = url.startsWith("http://") || url.startsWith("https://") ? new URL(url) : new URL(url, base);
    return SAFE_PROTOCOLS.includes(resolved.protocol);
  } catch {
    return false;
  }
}
function safeHref(url, base = defaultBase()) {
  if (!url) return void 0;
  return isSafeNavigationUrl(url, base) ? url : void 0;
}
const log$2 = createScopedLogger("EventRegistry");
let instance = null;
let consentInstance = null;
const registrationListeners = /* @__PURE__ */ new Set();
function registerEventService(service) {
  instance = service;
  if (!service) return;
  for (const listener of [...registrationListeners]) {
    try {
      listener(service);
    } catch (error) {
      log$2.error("An EventService registration listener threw:", error);
    }
  }
}
function onEventServiceRegistered(listener) {
  registrationListeners.add(listener);
  return () => {
    registrationListeners.delete(listener);
  };
}
function getEventService() {
  return instance;
}
function trackEvent(eventName, data = {}) {
  if (!instance) return;
  instance.track(eventName, data);
}
function updateEventContext(updates) {
  if (!instance) return;
  instance.updateContext(updates);
}
function registerConsentService(service) {
  consentInstance = service;
}
function getConsentService() {
  return consentInstance;
}
function getConsentState() {
  if (!consentInstance) return null;
  return consentInstance.getState();
}
const log$1 = createScopedLogger("DataLayerBridge");
const POLL_INTERVAL_MS = 1e3;
const SOURCES = {
  elevar: { key: "ElevarDataLayer" },
  // The filter is the GTM source's, not the bridge's: an Elevar store that
  // ever names an event `gtm.something` must still be forwarded.
  gtm: { key: "dataLayer", skip: (name) => name.startsWith("gtm.") }
};
let forwarded$1 = /* @__PURE__ */ new WeakSet();
const MAX_FORWARDS_PER_TICK$1 = 50;
const MAX_ARRAY_ITEMS$1 = 1e3;
let pageViewSent = false;
let refCount = 0;
let intervalId = null;
let stopLifecycleListeners = null;
let activeConfig = null;
const MAX_IDLE_TICKS = 60;
let idleTicks = 0;
let awaitingRegistration = null;
const ENVELOPE_KEYS = ["event", "timestamp", "message_id", "conversation_id"];
const SDK_ORIGIN_MARKER = "omniguide_sdk";
const BLOCKED_EVENTS = /* @__PURE__ */ new Set(["dl_user_data"]);
const BLOCKED_KEYS = ["user_properties", "customer", "user_data"];
const DROPPED_KEYS$1 = [...ENVELOPE_KEYS, ...BLOCKED_KEYS, SDK_ORIGIN_MARKER];
function stripDroppedKeys(payload, report, ancestors = /* @__PURE__ */ new Set(), keys = DROPPED_KEYS$1) {
  return stripValue(payload, ancestors, report, {
    left: MAX_WALK_NODES,
    depth: 0,
    warned: false,
    keys
  });
}
function stripKeysDeep(payload, droppedKeys) {
  return safeStrip(payload, { lossy: false }, droppedKeys);
}
const OPAQUE = [Date, RegExp, Map, Set, WeakMap, WeakSet];
const MAX_WALK_NODES = 5e3;
const MAX_WALK_DEPTH = 12;
function isHostObject(value) {
  try {
    const node = value;
    if (typeof node.nodeType === "number" && typeof node.nodeName === "string") return true;
  } catch {
  }
  try {
    if (typeof Node !== "undefined" && value instanceof Node) return true;
  } catch {
  }
  try {
    if (typeof Window !== "undefined" && value instanceof Window) return true;
  } catch {
  }
  return false;
}
function stripValue(value, ancestors, report, walk) {
  if (!value || typeof value !== "object") return value;
  if (OPAQUE.some((ctor) => value instanceof ctor)) return value;
  if (isHostObject(value)) return void 0;
  if (ancestors.has(value)) return void 0;
  if (walk.depth >= MAX_WALK_DEPTH || walk.left <= 0) {
    report.lossy = true;
    if (!walk.warned) {
      walk.warned = true;
      const bound = walk.depth >= MAX_WALK_DEPTH ? `nesting deeper than ${MAX_WALK_DEPTH}` : `more than ${MAX_WALK_NODES} objects and arrays`;
      log$1.warn(`dataLayer entry: payload has ${bound}; forwarding it truncated.`);
    }
    return void 0;
  }
  walk.left--;
  ancestors.add(value);
  walk.depth++;
  try {
    if (Array.isArray(value)) {
      const items = [];
      let length = 0;
      try {
        const raw = Number(value.length);
        if (!Number.isFinite(raw) || raw < 0) {
          throw new RangeError(`unusable array length: ${String(value.length)}`);
        }
        const wanted = Math.floor(raw);
        length = Math.min(wanted, MAX_ARRAY_ITEMS$1);
        if (length < wanted) {
          report.lossy = true;
          log$1.warn(`dataLayer entry: array reports ${wanted} items; walking the first ${MAX_ARRAY_ITEMS$1}.`);
        }
      } catch (error) {
        report.lossy = true;
        log$1.warn("dataLayer entry: array length could not be read; forwarding without it:", error);
        return items;
      }
      for (let i = 0; i < length; i++) {
        if (walk.left <= 0) {
          report.lossy = true;
          break;
        }
        try {
          items.push(stripValue(value[i], ancestors, report, walk));
        } catch (error) {
          report.lossy = true;
          log$1.warn(`dataLayer entry: index ${i} could not be read; forwarding without it:`, error);
          items.push(void 0);
        }
      }
      return items;
    }
    const out = {};
    let keys;
    try {
      keys = Object.keys(value);
    } catch (error) {
      report.lossy = true;
      log$1.warn("dataLayer entry: its keys could not be listed; forwarding with an empty payload:", error);
      return out;
    }
    for (const key of keys) {
      if (walk.keys.includes(key)) continue;
      try {
        out[key] = stripValue(value[key], ancestors, report, walk);
      } catch (error) {
        report.lossy = true;
        log$1.warn(`dataLayer entry: key "${key}" could not be read; forwarding without it:`, error);
      }
    }
    return out;
  } finally {
    ancestors.delete(value);
    walk.depth--;
  }
}
function safeRead$1(source, key, report) {
  try {
    return source[key];
  } catch (error) {
    report.lossy = true;
    log$1.warn(`dataLayer entry: key "${key}" could not be read:`, error);
    return void 0;
  }
}
function safeStrip(source, report, keys = DROPPED_KEYS$1) {
  try {
    return stripDroppedKeys(source, report, /* @__PURE__ */ new Set(), keys);
  } catch (error) {
    report.lossy = true;
    log$1.warn("dataLayer entry: its payload could not be walked; forwarding with an empty payload:", error);
    return {};
  }
}
function parseEntry(entry) {
  if (!entry || typeof entry !== "object") return null;
  const e = entry;
  const report = { lossy: false };
  if (safeRead$1(e, SDK_ORIGIN_MARKER, report)) return null;
  const named = safeRead$1(e, "event", report);
  if (typeof named === "string" && named) {
    if (BLOCKED_EVENTS.has(named)) return null;
    return { name: named, payload: safeStrip(e, report), lossy: report.lossy };
  }
  const gtagVerb = safeRead$1(e, "0", report);
  const gtagName = safeRead$1(e, "1", report);
  if (gtagVerb === "event" && typeof gtagName === "string" && gtagName) {
    if (BLOCKED_EVENTS.has(gtagName)) return null;
    const params = safeRead$1(e, "2", report);
    if (params && typeof params === "object" && safeRead$1(params, SDK_ORIGIN_MARKER, report)) return null;
    const payload = params && typeof params === "object" ? safeStrip(params, report) : {};
    return { name: gtagName, payload, lossy: report.lossy };
  }
  return null;
}
function detachPayload(payload) {
  try {
    return structuredClone(payload);
  } catch (error) {
    log$1.warn("structuredClone failed; forwarding the vendor object by reference:", error);
    return payload;
  }
}
function readArray(key) {
  const value = window[key];
  return Array.isArray(value) ? value : [];
}
function activeSources() {
  const specs = [];
  if (activeConfig == null ? void 0 : activeConfig.elevar) specs.push(SOURCES.elevar);
  if (activeConfig == null ? void 0 : activeConfig.gtm) specs.push(SOURCES.gtm);
  return specs;
}
function emitPageViewOnce(service) {
  if (!(activeConfig == null ? void 0 : activeConfig.pageView) || pageViewSent) return;
  try {
    service.track("page_view", {
      // Sanitised like every other analytics URL in the SDK: a shopper can
      // land on a path carrying a reset token or a session id in the query,
      // and page_location would otherwise ship it verbatim.
      page_location: sanitizeUrl(window.location.href),
      page_path: window.location.pathname,
      page_title: document.title
    });
    pageViewSent = true;
  } catch (error) {
    log$1.error("page_view could not be forwarded; continuing with sources:", error);
  }
}
const PURCHASE_EVENTS = /* @__PURE__ */ new Set(["purchase", "dl_purchase"]);
const TRANSACTION_ID_PATHS = [
  ["ecommerce", "transaction_id"],
  ["ecommerce", "purchase", "actionField", "id"],
  ["ecommerce", "purchase", "actionField", "transaction_id"],
  ["ecommerce", "actionField", "id"],
  ["ecommerce", "order_id"],
  ["transaction_id"],
  ["transactionId"],
  ["order_id"],
  ["orderId"]
];
const PURCHASE_CONTENT_PATHS = [
  ["value"],
  ["ecommerce", "value"],
  ["ecommerce", "purchase", "actionField", "revenue"],
  ["items"],
  ["ecommerce", "items"],
  ["ecommerce", "purchase", "products"]
];
const PURCHASE_STORAGE_KEY = "omniguide_purchases_seen";
const PURCHASE_MAX_AGE_MS = 24 * 60 * 60 * 1e3;
const PURCHASE_MAX_TRACKED = 50;
let countedPurchases = /* @__PURE__ */ new Map();
function readPath$1(payload, path) {
  let cursor = payload;
  for (const key of path) {
    if (!cursor || typeof cursor !== "object") return void 0;
    cursor = cursor[key];
  }
  return cursor;
}
function transactionIdOf(payload) {
  for (const path of TRANSACTION_ID_PATHS) {
    const value = readPath$1(payload, path);
    if (typeof value === "string" && value.trim()) return value.trim();
    if (typeof value === "number" && Number.isFinite(value)) return String(value);
  }
  return null;
}
function purchaseHasContent(payload) {
  return PURCHASE_CONTENT_PATHS.some((path) => {
    const value = readPath$1(payload, path);
    if (Array.isArray(value)) return value.length > 0;
    if (typeof value === "number") return Number.isFinite(value);
    if (typeof value === "string") return value.trim().length > 0;
    return false;
  });
}
function purchaseStore() {
  try {
    return typeof localStorage === "undefined" ? null : localStorage;
  } catch {
    return null;
  }
}
function loadPurchaseRecord() {
  const store = purchaseStore();
  if (!store) return null;
  try {
    const stored = store.getItem(PURCHASE_STORAGE_KEY);
    if (!stored) return /* @__PURE__ */ Object.create(null);
    const parsed = JSON.parse(stored);
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return null;
    const cutoff = Date.now() - PURCHASE_MAX_AGE_MS;
    const fresh = /* @__PURE__ */ Object.create(null);
    for (const [id, at] of Object.entries(parsed)) {
      if (typeof at === "number" && at > cutoff) fresh[id] = at;
    }
    return fresh;
  } catch (error) {
    log$1.warn("Could not read the forwarded-purchase record:", error);
    return null;
  }
}
function purchaseAlreadyCounted(txId) {
  const cutoff = Date.now() - PURCHASE_MAX_AGE_MS;
  const countedAt = countedPurchases.get(txId);
  if (countedAt !== void 0 && countedAt > cutoff) return true;
  const record = loadPurchaseRecord();
  return record !== null && Object.prototype.hasOwnProperty.call(record, txId);
}
function markPurchaseCounted(txId) {
  const cutoff = Date.now() - PURCHASE_MAX_AGE_MS;
  for (const [id, at] of countedPurchases) {
    if (at <= cutoff) countedPurchases.delete(id);
  }
  countedPurchases.set(txId, Date.now());
  const store = purchaseStore();
  const record = loadPurchaseRecord();
  if (!store || record === null) return;
  record[txId] = Date.now();
  const newestFirst = Object.entries(record).sort(([, a], [, b]) => b - a).slice(0, PURCHASE_MAX_TRACKED);
  try {
    store.setItem(PURCHASE_STORAGE_KEY, JSON.stringify(Object.fromEntries(newestFirst)));
  } catch (error) {
    log$1.warn("Could not persist the forwarded-purchase record:", error);
  }
}
function screenPurchase(parsed) {
  if (!PURCHASE_EVENTS.has(parsed.name.toLowerCase())) return { forward: true, txId: null };
  const txId = transactionIdOf(parsed.payload);
  if (!txId) {
    if (!parsed.lossy && !purchaseHasContent(parsed.payload)) {
      log$1.warn(`Refusing an empty ${parsed.name} entry: no transaction id, value or items`);
      return { forward: false, txId: null };
    }
    if (parsed.lossy) {
      log$1.warn(
        `Forwarding a ${parsed.name} whose payload could not be fully read; it looks empty but may not be. Never refuse a sale on an unread payload.`
      );
    }
    log$1.warn(
      `Forwarding a ${parsed.name} with no recognised transaction id; it cannot be de-duplicated. Add its id path to TRANSACTION_ID_PATHS.`
    );
    return { forward: true, txId: null };
  }
  if (purchaseAlreadyCounted(txId)) {
    log$1.debug(`Order ${txId} was already forwarded; skipping this ${parsed.name}`);
    return { forward: false, txId: null };
  }
  return { forward: true, txId };
}
const DEDUPE_WINDOW_MS = POLL_INTERVAL_MS;
const DEDUPE_MAX_TRACKED = 50;
let recentEvents = /* @__PURE__ */ new Map();
function foldEventName(name) {
  const lower = name.toLowerCase();
  return lower.replace(/[^\p{L}\p{N}]+/gu, "") || lower;
}
const PER_PUSH_KEYS = /* @__PURE__ */ new Set(["event_id", "eventId", "eventCallback", "eventTimeout"]);
function isPerPushNoise(key) {
  return key.startsWith("gtm.") || PER_PUSH_KEYS.has(key);
}
function stableStringify(value) {
  if (typeof value === "function" || typeof value === "symbol") {
    throw new TypeError("a function or symbol value is not keyable");
  }
  if (!value || typeof value !== "object") return JSON.stringify(value) ?? "null";
  if (value instanceof Date) return JSON.stringify(value.toISOString());
  if (OPAQUE.some((ctor) => value instanceof ctor)) throw new TypeError("opaque value is not keyable");
  if (Array.isArray(value)) return `[${Array.from(value, stableStringify).join(",")}]`;
  const entries = Object.entries(value).filter(([key, child]) => child !== void 0 && !isPerPushNoise(key)).sort(([a], [b]) => a < b ? -1 : a > b ? 1 : 0);
  return `{${entries.map(([k, v]) => `${JSON.stringify(k)}:${stableStringify(v)}`).join(",")}}`;
}
function dedupeKeyOf(parsed) {
  try {
    return `${foldEventName(parsed.name)}\0${stableStringify(parsed.payload)}`;
  } catch (error) {
    log$1.warn(`Forwarding ${parsed.name} unguarded; its payload could not be keyed:`, error);
    return null;
  }
}
function isOpen(occurrence, now) {
  return occurrence.at <= now && now - occurrence.at <= DEDUPE_WINDOW_MS;
}
function openOccurrences(key) {
  const held = recentEvents.get(key);
  if (!held) return [];
  const now = Date.now();
  const open = held.filter((occurrence) => isOpen(occurrence, now));
  if (open.length) recentEvents.set(key, open);
  else recentEvents.delete(key);
  return open;
}
function isAliasOfForwarded(key, name) {
  const waiting = openOccurrences(key).find((occurrence) => !occurrence.names.has(name));
  if (!waiting) return false;
  waiting.names.add(name);
  return true;
}
function markRecentlyForwarded(key, name) {
  const now = Date.now();
  for (const [seen, held] of recentEvents) {
    if (!held.some((occurrence) => isOpen(occurrence, now))) recentEvents.delete(seen);
  }
  const open = openOccurrences(key);
  open.push({ at: now, names: /* @__PURE__ */ new Set([name]) });
  recentEvents.delete(key);
  while (recentEvents.size >= DEDUPE_MAX_TRACKED) {
    const oldest = recentEvents.keys().next().value;
    if (oldest === void 0) break;
    recentEvents.delete(oldest);
  }
  recentEvents.set(key, open.slice(-10));
}
function screenEntry(parsed) {
  const order = screenPurchase(parsed);
  if (!order.forward) return { ...order, dedupeKey: null };
  if (parsed.lossy) {
    log$1.warn(
      `Forwarding ${parsed.name} without de-duplication: part of the entry could not be read, so it cannot be compared to another.`
    );
    return { ...order, dedupeKey: null };
  }
  const dedupeKey = dedupeKeyOf(parsed);
  if (dedupeKey !== null && isAliasOfForwarded(dedupeKey, parsed.name)) {
    log$1.debug(`Skipping ${parsed.name}: another spelling of it was just forwarded`);
    return { forward: false, txId: null, dedupeKey: null };
  }
  return { ...order, dedupeKey };
}
function drainSource(spec, service, budget) {
  var _a;
  let left = budget;
  for (const entry of readArray(spec.key)) {
    if (left <= 0) return 0;
    if (!entry || typeof entry !== "object") continue;
    if (forwarded$1.has(entry)) continue;
    forwarded$1.add(entry);
    try {
      const parsed = parseEntry(entry);
      if (!parsed) continue;
      if ((_a = spec.skip) == null ? void 0 : _a.call(spec, parsed.name)) continue;
      const claim = screenEntry(parsed);
      if (!claim.forward) continue;
      left--;
      service.track(parsed.name, detachPayload(parsed.payload));
      if (claim.txId) markPurchaseCounted(claim.txId);
      if (claim.dedupeKey) markRecentlyForwarded(claim.dedupeKey, parsed.name);
    } catch (error) {
      log$1.error(`Skipping unforwardable entry on ${spec.key}:`, error);
    }
  }
  return left;
}
function drain$1(unbounded = false) {
  const service = getEventService();
  if (!service) return;
  emitPageViewOnce(service);
  let budget = unbounded ? Number.POSITIVE_INFINITY : MAX_FORWARDS_PER_TICK$1;
  for (const spec of activeSources()) {
    budget = drainSource(spec, service, budget);
    if (budget <= 0) return;
  }
}
function tick(unbounded = false) {
  try {
    drain$1(unbounded);
  } catch (error) {
    log$1.error("Drain failed:", error);
  }
  if (getEventService()) {
    idleTicks = 0;
    return;
  }
  if (++idleTicks >= MAX_IDLE_TICKS) standDown();
}
function standDown() {
  clearPolling();
  log$1.debug(`No EventService after ${MAX_IDLE_TICKS} ticks; polling paused until one registers.`);
  awaitingRegistration ?? (awaitingRegistration = onEventServiceRegistered(() => {
    startPolling();
  }));
}
function startPolling() {
  idleTicks = 0;
  if (intervalId !== null || refCount <= 0) return;
  stopLifecycleListeners = listenForPageEnd();
  intervalId = window.setInterval(tick, POLL_INTERVAL_MS);
  tick();
}
function finalDrain() {
  tick(true);
  beaconFinalDrain();
}
function listenForPageEnd() {
  const onVisibilityChange = () => {
    if (document.visibilityState === "hidden") finalDrain();
  };
  document.addEventListener("visibilitychange", onVisibilityChange);
  window.addEventListener("pagehide", finalDrain);
  return () => {
    document.removeEventListener("visibilitychange", onVisibilityChange);
    window.removeEventListener("pagehide", finalDrain);
  };
}
function beaconFinalDrain() {
  const service = getEventService();
  if (!service) return;
  try {
    service.sendBeacon();
  } catch (error) {
    log$1.error("Could not beacon the final drain:", error);
  }
}
function clearPolling() {
  if (intervalId !== null) window.clearInterval(intervalId);
  if (stopLifecycleListeners) stopLifecycleListeners();
  intervalId = null;
  stopLifecycleListeners = null;
}
function stopPolling() {
  clearPolling();
  if (awaitingRegistration) awaitingRegistration();
  awaitingRegistration = null;
  idleTicks = 0;
  activeConfig = null;
}
function isDataLayerBridgeEnabled(config) {
  return Boolean(config && (config.elevar || config.gtm || config.pageView));
}
function startDataLayerBridge(config) {
  if (typeof window === "undefined") return () => {
  };
  if (!isDataLayerBridgeEnabled(config)) return () => {
  };
  activeConfig ?? (activeConfig = config);
  refCount++;
  startPolling();
  let detached = false;
  return () => {
    if (detached) return;
    detached = true;
    refCount--;
    if (refCount <= 0) {
      refCount = 0;
      stopPolling();
    }
  };
}
function _resetDataLayerBridge() {
  stopPolling();
  refCount = 0;
  forwarded$1 = /* @__PURE__ */ new WeakSet();
  countedPurchases = /* @__PURE__ */ new Map();
  recentEvents = /* @__PURE__ */ new Map();
  try {
    if (typeof localStorage !== "undefined") localStorage.removeItem(PURCHASE_STORAGE_KEY);
  } catch {
  }
  pageViewSent = false;
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
function getPostHog() {
  if (typeof window === "undefined") return null;
  try {
    const candidate = window["posthog"];
    if (!candidate || typeof candidate !== "object") return null;
    return candidate;
  } catch {
    return null;
  }
}
function createPostHogAnalyticsAdapter() {
  return {
    track(eventName, properties) {
      try {
        const posthog = getPostHog();
        if (posthog && typeof posthog.capture === "function") {
          posthog.capture(eventName, properties ?? {});
        }
      } catch {
      }
    }
  };
}
function resolveAnalyticsAdapter(userConfig) {
  var _a;
  if (userConfig.analyticsAdapter) return userConfig.analyticsAdapter;
  if ((_a = userConfig.analytics) == null ? void 0 : _a.posthog) return createPostHogAnalyticsAdapter();
  return void 0;
}
const DEFAULT_ECOMMERCE_EVENT_MAP = Object.freeze({
  purchase: "eCommerce Purchase",
  add_to_cart: "eCommerce Add To Cart",
  remove_from_cart: "eCommerce Remove From Cart",
  begin_checkout: "eCommerce Begin Checkout",
  view_item: "eCommerce View Item",
  view_item_list: "eCommerce View Item List",
  view_cart: "eCommerce View Cart",
  search: "eCommerce Search",
  add_to_wishlist: "eCommerce Add To Wishlist"
});
const DEFAULT_POLL_INTERVAL_MS = 1e3;
const DEFAULT_DEDUPE_TTL_MS = 30 * 24 * 60 * 60 * 1e3;
const PURCHASE_DEDUPE_STORAGE_KEY = "omniguide_ecom_purchases";
function purchaseStorageKey(websiteId) {
  return websiteId ? `${PURCHASE_DEDUPE_STORAGE_KEY}:${websiteId}` : PURCHASE_DEDUPE_STORAGE_KEY;
}
const IDENTITY_KEYS = ["user_data", "user_properties", "customer"];
const DROPPED_KEYS = [...IDENTITY_KEYS, SDK_ORIGIN_MARKER];
const MAX_FORWARDS_PER_TICK = 50;
const MAX_ARRAY_ITEMS = 1e3;
function safeRead(source, key) {
  try {
    return source[key];
  } catch {
    return void 0;
  }
}
let forwarded = /* @__PURE__ */ new WeakSet();
let pollTimer = null;
let runningWebsiteId = "";
function readSeenPurchases(storageKey) {
  try {
    const raw = window.localStorage.getItem(storageKey);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return {};
    return parsed;
  } catch {
    return {};
  }
}
function writeSeenPurchases(storageKey, seen) {
  try {
    window.localStorage.setItem(storageKey, JSON.stringify(seen));
  } catch {
  }
}
function prune(seen, now, ttlMs) {
  const kept = {};
  for (const [id, at] of Object.entries(seen)) {
    if (typeof at === "number" && now - at < ttlMs) kept[id] = at;
  }
  return kept;
}
function readPath(source, ...keys) {
  let value = source;
  for (const key of keys) {
    if (!value || typeof value !== "object") return void 0;
    value = safeRead(value, key);
  }
  return value;
}
function readTransactionId(entry) {
  const candidates = [
    readPath(entry, "transaction_id"),
    readPath(entry, "ecommerce", "transaction_id"),
    readPath(entry, "ecommerce", "purchase", "actionField", "id")
  ];
  for (const candidate of candidates) {
    if (typeof candidate === "string" && candidate) return candidate;
    if (typeof candidate === "number" && Number.isFinite(candidate)) return String(candidate);
  }
  return null;
}
function claimPurchase(entry, ttlMs, storageKey) {
  const transactionId = readTransactionId(entry);
  if (!transactionId) return true;
  const now = Date.now();
  const seen = readSeenPurchases(storageKey);
  const firstSeen = seen[transactionId];
  if (typeof firstSeen === "number" && now - firstSeen < ttlMs) return false;
  const next = prune(seen, now, ttlMs);
  next[transactionId] = now;
  writeSeenPurchases(storageKey, next);
  return true;
}
function toProperties(entry) {
  const properties = stripKeysDeep(entry, DROPPED_KEYS);
  delete properties["event"];
  return properties;
}
function snapshot(dataLayer) {
  let length = 0;
  try {
    const raw = Number(dataLayer.length);
    if (!Number.isFinite(raw) || raw < 0) return [];
    length = Math.min(Math.floor(raw), MAX_ARRAY_ITEMS);
  } catch {
    return [];
  }
  const items = [];
  for (let i = 0; i < length; i++) {
    try {
      items.push(dataLayer[i]);
    } catch {
      items.push(void 0);
    }
  }
  return items;
}
function drain(adapter, eventMap, ttlMs, storageKey) {
  let dataLayer;
  try {
    dataLayer = window["dataLayer"];
  } catch {
    return;
  }
  if (!Array.isArray(dataLayer)) return;
  let budget = MAX_FORWARDS_PER_TICK;
  for (const entry of snapshot(dataLayer)) {
    if (budget <= 0) return;
    if (!entry || typeof entry !== "object") continue;
    if (forwarded.has(entry)) continue;
    forwarded.add(entry);
    const record = entry;
    if (safeRead(record, SDK_ORIGIN_MARKER)) continue;
    const name = safeRead(record, "event");
    if (typeof name !== "string" || !name) continue;
    const mapped = eventMap[name];
    if (!mapped) continue;
    if (name === "purchase" && !claimPurchase(record, ttlMs, storageKey)) continue;
    budget--;
    try {
      adapter.track(mapped, { ...toProperties(record), [SDK_ORIGIN_MARKER]: true });
    } catch (error) {
      logger.warn("analytics adapter threw while forwarding an eCommerce event:", error);
    }
  }
}
function startEcommerceAnalytics(adapter, config = {}, websiteId = "") {
  if (config.enabled === false) return () => {
  };
  if (typeof window === "undefined") return () => {
  };
  if (pollTimer !== null) {
    if (websiteId !== runningWebsiteId) {
      logger.warn(
        `eCommerce analytics is already running for "${runningWebsiteId}"; events for "${websiteId}" will NOT be forwarded. One page can forward for one website.`
      );
    } else {
      logger.debug("eCommerce analytics forwarder is already running; keeping the existing poller.");
    }
    return () => {
    };
  }
  const eventMap = config.eventMap ?? DEFAULT_ECOMMERCE_EVENT_MAP;
  const ttlMs = config.dedupeTtlMs ?? DEFAULT_DEDUPE_TTL_MS;
  const pollIntervalMs = config.pollIntervalMs ?? DEFAULT_POLL_INTERVAL_MS;
  const storageKey = purchaseStorageKey(websiteId);
  runningWebsiteId = websiteId;
  const tick2 = () => {
    drain(adapter, eventMap, ttlMs, storageKey);
  };
  tick2();
  pollTimer = setInterval(tick2, pollIntervalMs);
  return () => {
    if (pollTimer !== null) {
      clearInterval(pollTimer);
      pollTimer = null;
      runningWebsiteId = "";
    }
  };
}
function startEcommerceAnalyticsIfConfigured(config) {
  if (!config.ecommerceAnalytics || !config.websiteId) return;
  try {
    const adapter = resolveAnalyticsAdapter(config);
    if (!adapter) {
      logger.warn(
        "ecommerceAnalytics is configured but no analytics adapter is. Set `analytics: { posthog: true }` or pass `analyticsAdapter`."
      );
      return;
    }
    startEcommerceAnalytics(adapter, config.ecommerceAnalytics, config.websiteId);
  } catch (error) {
    logger.error("Could not start the eCommerce analytics forwarder:", error);
  }
}
const EXPERIMENT_DEFAULTS = {
  provider: "posthog",
  enabledWhen: "test",
  timeoutMs: 2500,
  lateTimeoutMs: 1e4,
  overrideKey: "og_ab_force",
  registerProperty: "omniguide_ai_arm"
};
let unsupportedProviderWarned = false;
function readForcedArm(overrideKey = EXPERIMENT_DEFAULTS.overrideKey) {
  if (typeof window === "undefined") return null;
  try {
    const value = window.localStorage.getItem(overrideKey);
    return value === "on" || value === "off" ? value : null;
  } catch {
    return null;
  }
}
function readOnFeatureFlags() {
  try {
    const posthog = getPostHog();
    if (posthog && typeof posthog.onFeatureFlags === "function") {
      return posthog.onFeatureFlags.bind(posthog);
    }
  } catch {
  }
  return null;
}
function whenFlagsReady(callback, timeoutMs = EXPERIMENT_DEFAULTS.timeoutMs) {
  const subscribe = readOnFeatureFlags();
  if (!subscribe) {
    callback(false);
    return;
  }
  let done = false;
  let timer = null;
  const fire = (timedOut) => {
    if (done) return;
    done = true;
    if (timer !== null) {
      clearTimeout(timer);
      timer = null;
    }
    callback(timedOut);
  };
  try {
    subscribe(() => {
      fire(false);
    });
  } catch {
    fire(false);
    return;
  }
  timer = setTimeout(() => {
    fire(true);
  }, timeoutMs);
}
function resolveExperimentArm(config = {}) {
  const forced = readForcedArm(config.overrideKey ?? EXPERIMENT_DEFAULTS.overrideKey);
  if (forced) return { enabled: forced === "on", arm: `forced_${forced}` };
  const provider = config.provider ?? EXPERIMENT_DEFAULTS.provider;
  if (provider !== EXPERIMENT_DEFAULTS.provider) {
    if (!unsupportedProviderWarned) {
      unsupportedProviderWarned = true;
      logger.warn(
        `experiment.provider "${String(provider)}" is not supported; failing open and running the SDK for everyone.`
      );
    }
    return { enabled: true, arm: "provider_unsupported" };
  }
  if (!config.flagKey) return { enabled: true, arm: "no_experiment" };
  try {
    const posthog = getPostHog();
    if (!posthog || typeof posthog.getFeatureFlag !== "function") {
      return { enabled: true, arm: "posthog_absent" };
    }
    const variant = posthog.getFeatureFlag(config.flagKey);
    if (variant === void 0 || variant === null) {
      return { enabled: true, arm: "flag_unresolved" };
    }
    if (variant === true) return { enabled: true, arm: "true" };
    if (variant === false) return { enabled: false, arm: "false" };
    if (typeof variant !== "string") {
      logger.warn(
        `feature flag "${config.flagKey}" resolved to a ${typeof variant}, not a string or boolean; failing open and running the SDK.`
      );
      return { enabled: true, arm: "flag_shape_unexpected" };
    }
    return {
      enabled: variant === (config.enabledWhen ?? EXPERIMENT_DEFAULTS.enabledWhen),
      arm: variant
    };
  } catch (error) {
    logger.warn("feature-flag lookup failed; failing open:", error);
    return { enabled: true, arm: "flag_error" };
  }
}
function registerExperimentArm(arm, registerProperty = EXPERIMENT_DEFAULTS.registerProperty) {
  try {
    const posthog = getPostHog();
    if (posthog && typeof posthog.register === "function") {
      posthog.register({ [registerProperty]: arm });
    }
  } catch {
  }
}
function resolveExperiment(config) {
  if (!(config == null ? void 0 : config.flagKey)) return Promise.resolve(resolveExperimentArm(config));
  return new Promise((resolve) => {
    whenFlagsReady(
      (timedOut) => {
        const decision = resolveExperimentArm(config);
        if (timedOut && decision.arm === "flag_unresolved" && decideOnNextFlags(config, resolve)) return;
        resolve(decision);
      },
      config.timeoutMs ?? EXPERIMENT_DEFAULTS.timeoutMs
    );
  });
}
function decideOnNextFlags(config, resolve) {
  const subscribe = readOnFeatureFlags();
  if (!subscribe) return false;
  registerExperimentArm("flag_unresolved", config.registerProperty);
  let done = false;
  const decide = () => {
    if (done) return;
    done = true;
    clearTimeout(deadline);
    resolve(resolveExperimentArm(config));
  };
  const deadline = setTimeout(decide, config.lateTimeoutMs ?? EXPERIMENT_DEFAULTS.lateTimeoutMs);
  try {
    subscribe(decide);
  } catch {
    clearTimeout(deadline);
    return false;
  }
  return true;
}
function domReady() {
  if (typeof document === "undefined") return Promise.resolve();
  if (document.readyState !== "loading") return Promise.resolve();
  return new Promise((resolve) => {
    document.addEventListener("DOMContentLoaded", () => {
      resolve();
    }, { once: true });
  });
}
function warnIfGlobalMissing() {
  if (typeof window === "undefined") return;
  const global = window["Omniguide"];
  if (!global || typeof global["init"] !== "function") {
    logger.warn(
      "window.Omniguide.init is not present. The SDK is starting from a direct module reference; check the CDN script tag if you expected the global."
    );
  }
}
function createStart(init2) {
  return async function start2(config) {
    var _a, _b;
    startEcommerceAnalyticsIfConfigured(config);
    try {
      await domReady();
      warnIfGlobalMissing();
      const decision = await resolveExperiment(config.experiment);
      registerExperimentArm(decision.arm, (_a = config.experiment) == null ? void 0 : _a.registerProperty);
      if (!decision.enabled) {
        logger.warn(
          `Omniguide is not initialising: experiment arm "${decision.arm}" is not the enabled arm. Set localStorage["${((_b = config.experiment) == null ? void 0 : _b.overrideKey) ?? "og_ab_force"}"] = "on" to override.`
        );
        return null;
      }
    } catch (error) {
      logger.warn("the experiment gate failed; initialising anyway (fail open):", error);
    }
    return init2(config);
  };
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
const loadSearchModule = () => import("./omniguide-search-D8vCU74A.js");
const loadProductFitModule = () => import("./omniguide-product-fit-C6mHelfC.js");
const loadCategoryGuideModule = () => import("./omniguide-category-guide-CdPOjY6F.js");
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
async function handleOpenSearch(query, source, base) {
  var _a, _b;
  if (searchIntegration) {
    searchIntegration.openSearch(query, source);
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
    integration.openSearch(query, source);
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
  const entries = mountEntries(mount);
  for (const entry of entries) {
    if (!(entry == null ? void 0 : entry.target)) continue;
    if (entry.target instanceof HTMLElement) return entry.target;
    try {
      const found = document.querySelector(entry.target);
      if (found) return found;
    } catch {
      continue;
    }
  }
  if (entries.length > 0) return null;
  return document.querySelector(selector ?? defaultSelector);
}
function mountEntries(mount) {
  if (!mount) return [];
  return Array.isArray(mount) ? mount : [mount];
}
function describeObserveTarget(mount, selector, defaultSelector) {
  if (mountEntries(mount).length > 0) return describeMountTargets(mount, "");
  return selector ?? defaultSelector;
}
function startBridgeIfConfigured(config) {
  const bridge = config.dataLayerBridge;
  if (!bridge) return;
  void import("./shared-BxCSkQxe.js").then((mod) => {
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
  var _a, _b, _c, _d, _e, _f, _g, _h, _i, _j, _k, _l, _m, _n, _o, _p, _q;
  if (!config.websiteId) {
    throw new Error("[Omniguide] websiteId is required in config");
  }
  startBridgeIfConfigured(config);
  startEcommerceAnalyticsIfConfigured(config);
  const productFitOff = productFitSuppressionReason(config);
  if (productFitOff) {
    console.warn("[Omniguide]", productFitOff);
  }
  currentConfig = config;
  const base = resolveBase();
  const features = {
    search: true,
    productFit: true,
    categoryGuide: true,
    ...config.features,
    // Mirrors buildConfig: a configured `productSkuSelector` that matches
    // nothing means this page has no product to fit. Kept in step with the
    // UMD entry so an integration does not behave differently per build.
    ...productFitApplies(config) ? {} : { productFit: false }
  };
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
    if (!pdpObserveEl) {
      console.warn(`[Omniguide] Product fit: nothing to observe. Tried: ${describeObserveTarget((_h = config.pdpWidget) == null ? void 0 : _h.mount, (_i = config.pdpWidget) == null ? void 0 : _i.selector, "[data-omniguide-pdp], #product-recommendations-root")}. Not loading.`);
    }
    if (pdpObserveEl) {
      const loadMode = ((_j = config.pdpWidget) == null ? void 0 : _j.loadMode) ?? "visible";
      if (loadMode === "immediate") {
        mountProductFit(config, base);
      } else {
        const io = observeVisibility(pdpObserveEl, ((_k = config.pdpWidget) == null ? void 0 : _k.rootMargin) ?? "600px", () => {
          mountProductFit(config, base);
        });
        observers.push(io);
      }
    }
  }
  if (features.categoryGuide) {
    const plpObserveEl = resolveObserveTarget((_l = config.plpWidget) == null ? void 0 : _l.mount, (_m = config.plpWidget) == null ? void 0 : _m.selector, "[data-omniguide-plp], #category-recommendations-root");
    if (!plpObserveEl) {
      console.warn(`[Omniguide] Category guide: nothing to observe. Tried: ${describeObserveTarget((_n = config.plpWidget) == null ? void 0 : _n.mount, (_o = config.plpWidget) == null ? void 0 : _o.selector, "[data-omniguide-plp], #category-recommendations-root")}. Not loading.`);
    }
    if (plpObserveEl) {
      const loadMode = ((_p = config.plpWidget) == null ? void 0 : _p.loadMode) ?? "visible";
      if (loadMode === "immediate") {
        mountCategoryGuide(config, base);
      } else {
        const io = observeVisibility(plpObserveEl, ((_q = config.plpWidget) == null ? void 0 : _q.rootMargin) ?? "600px", () => {
          mountCategoryGuide(config, base);
        });
        observers.push(io);
      }
    }
  }
  const instance2 = {
    search: null,
    // Set lazily when search chunk loads
    productFit: null,
    categoryGuide: null,
    openSearch: (query) => handleOpenSearch(query ?? "", "api", base),
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
  return instance2;
}
const start = createStart(init);
function getVersion() {
  return "0.9.0";
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
    start,
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
  setPreviewApiUrl as A,
  startDataLayerBridge as B,
  stripKeysDeep as C,
  trackEvent as D,
  updateEventContext as E,
  getVersion as F,
  init as G,
  resolveObserveTarget as H,
  start as I,
  SDK_ORIGIN_MARKER as S,
  _resetAnalyticsAdapterHealth as _,
  checkAnalyticsAdapter as a,
  reportAnalyticsAdapterThrew as b,
  createScopedLogger as c,
  describeMountTargets as d,
  clearPreviewApiUrl as e,
  getConsentService as f,
  getPreviewApiUrl as g,
  sanitizeUrl as h,
  isPreviewMode as i,
  resolveCategoryUrl as j,
  resolveAnalyticsAdapter as k,
  logger as l,
  productFitApplies as m,
  resolveProductSku as n,
  _resetDataLayerBridge as o,
  productFitSuppressionReason as p,
  getAnalyticsAdapterHealth as q,
  resolveContainer as r,
  safeHref as s,
  getConsentState as t,
  getEventService as u,
  initPreviewFromQueryParam as v,
  isDataLayerBridgeEnabled as w,
  isSafeNavigationUrl as x,
  registerConsentService as y,
  registerEventService as z
};
//# sourceMappingURL=shared-D0WNPecR.js.map
