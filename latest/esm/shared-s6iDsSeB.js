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
function injectSearchStyles(selectors, rootId) {
  if (document.getElementById(TRIGGER_STYLE_ID)) return;
  const quickSearchResults = (selectors == null ? void 0 : selectors.quickSearchResults) ?? '.quickSearchResults, [data-search="quickResults"]';
  const quickSearchSelectors = quickSearchResults.split(",").map((s) => `body.ai-search-active ${s.trim()}`).join(",\n    ");
  const style = document.createElement("style");
  style.id = TRIGGER_STYLE_ID;
  style.textContent = `
    ${quickSearchSelectors} {
      display: none !important;
    }
    body.ai-search-active {
      overflow: hidden;
    }
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
  injectSearchStyles(config.selectors, rootId);
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
    triggerElement = swapSearchIcon(config.selectors, config.icon);
    const isDesktop = window.innerWidth > 767;
    if (isDesktop) {
      if (isWordPressEnvironment(config.selectors)) {
        overrideWordPressSearch(config.selectors, openSearch, listeners);
      } else {
        overrideDesktopSearch(config.selectors, openSearch, listeners);
      }
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
  const base = new URL("data:video/mp2t;base64,LyoqCiAqIEBzd2lmdG90dGVyL29tbmlndWlkZS1idW5kbGUKICoKICogUHJlLWJ1aWx0IFVNRCBidW5kbGUgZm9yIE9tbmlndWlkZSBBSSBTREsuCiAqIFdvcmtzIHZpYSA8c2NyaXB0PiB0YWcg4oCUIG5vIGJ1aWxkIHRvb2xpbmcgcmVxdWlyZWQuCiAqCiAqIFVzYWdlOgogKiAgIDxsaW5rIHJlbD0ic3R5bGVzaGVldCIgaHJlZj0ib21uaWd1aWRlLXNkay5jc3MiPgogKiAgIDxzY3JpcHQgc3JjPSJvbW5pZ3VpZGUtc2RrLnN0YW5kYWxvbmUuanMiPjwvc2NyaXB0PgogKiAgIDxzY3JpcHQ+CiAqICAgICBPbW5pZ3VpZGUuaW5pdCh7IHdlYnNpdGVJZDogJ2h0dHBzOi8vbXlzdG9yZS5jb20vJyB9KTsKICogICA8L3NjcmlwdD4KICoKICogT3IgZGVjbGFyYXRpdmVseToKICogICA8c2NyaXB0IHNyYz0ib21uaWd1aWRlLXNkay5zdGFuZGFsb25lLmpzIiBkYXRhLW9tbmlndWlkZS1jb25maWc9J3sid2Vic2l0ZUlkIjoiaHR0cHM6Ly9teXN0b3JlLmNvbS8ifSc+PC9zY3JpcHQ+CiAqLwoKLy8gU2lkZS1lZmZlY3QgaW1wb3J0OiBleHRyYWN0cyBDU1MgaW50byBvbW5pZ3VpZGUtc2RrLmNzcwppbXBvcnQgJ0Bzd2lmdG90dGVyL29tbmlndWlkZS1zdHlsZXMnOwoKaW1wb3J0IHsKICBsb2dnZXIsCiAgaW5pdFByZXZpZXdGcm9tUXVlcnlQYXJhbSwKICBzZXRQcmV2aWV3QXBpVXJsLAogIGNsZWFyUHJldmlld0FwaVVybCwKICBpc1ByZXZpZXdNb2RlLAogIHNldEN1cnJlbnRQYWdlT3ZlcnJpZGUsCn0gZnJvbSAnQHN3aWZ0b3R0ZXIvb21uaWd1aWRlLWNvcmUnOwppbXBvcnQgdHlwZSB7IEJ1bmRsZUluaXRDb25maWcsIE9tbmlndWlkZUluc3RhbmNlIH0gZnJvbSAnLi90eXBlcy5qcyc7CmltcG9ydCB7IGJ1aWxkQ29uZmlnLCBidWlsZFBsYXRmb3JtQWRhcHRlciB9IGZyb20gJy4vZGVmYXVsdHMuanMnOwppbXBvcnQgeyBhdXRvSW5pdCB9IGZyb20gJy4vYXV0by1pbml0LmpzJzsKCi8vIENoZWNrIHF1ZXJ5IHBhcmFtIG92ZXJyaWRlIGJlZm9yZSBhbnkgaW5pdCgpIGNhbGwKaW5pdFByZXZpZXdGcm9tUXVlcnlQYXJhbSgpOwoKLy8gUmUtZXhwb3J0IHR5cGVzIGZvciBhZHZhbmNlZCBjb25zdW1lcnMKZXhwb3J0IHR5cGUgeyBCdW5kbGVJbml0Q29uZmlnLCBPbW5pZ3VpZGVJbnN0YW5jZSB9IGZyb20gJy4vdHlwZXMuanMnOwoKLy8gUmUtZXhwb3J0IGludGVncmF0aW9uIGNsYXNzZXMgYW5kIHV0aWxpdGllcyBmb3IgYWR2YW5jZWQgdXNhZ2UKZXhwb3J0IHsKICBCQ1NlYXJjaEludGVncmF0aW9uLAogIEJDUHJvZHVjdEZpdEludGVncmF0aW9uLAogIEJDQ2F0ZWdvcnlHdWlkZUludGVncmF0aW9uLAogIGNyZWF0ZUJpZ0NvbW1lcmNlQWRhcHRlciwKICBpbml0QmlnQ29tbWVyY2VBZGFwdGVyLAogIGNyZWF0ZUJpZ0NvbW1lcmNlQ29tcGF0LAogIExBVEVOQ1ksCiAgUmVzcG9uc2VUaW1lciwKICBjcmVhdGVSZXNwb25zZVRpbWVyLAp9IGZyb20gJ0Bzd2lmdG90dGVyL29tbmlndWlkZS1iaWdjb21tZXJjZSc7CgovLyBSZS1leHBvcnQgY29yZSB1dGlsaXRpZXMgZm9yIHRoZW1lIHdyYXBwZXIgZmlsZXMgYW5kIGN1c3RvbSBzZXR1cHMKZXhwb3J0IHsKICBjcmVhdGVTZXNzaW9uU2VydmljZSwKICBjcmVhdGVDb25zZW50U2VydmljZSwKICBOdWxsUGxhdGZvcm1BZGFwdGVyLAogIGNyZWF0ZVBsYXRmb3JtQWRhcHRlciwKICBnZXRQYWdlQ29udGV4dCwKICBjYXB0dXJlUGFnZUNvbnRleHQsCn0gZnJvbSAnQHN3aWZ0b3R0ZXIvb21uaWd1aWRlLWNvcmUnOwoKZXhwb3J0IHsgT21uaWd1aWRlUHJvdmlkZXIgfSBmcm9tICdAc3dpZnRvdHRlci9vbW5pZ3VpZGUtcmVhY3QnOwoKZGVjbGFyZSBjb25zdCBfX09NTklHVUlERV9WRVJTSU9OX186IHN0cmluZzsKCi8qKgogKiBHZXQgdGhlIGJ1bmRsZSB2ZXJzaW9uLgogKi8KZXhwb3J0IGZ1bmN0aW9uIGdldFZlcnNpb24oKTogc3RyaW5nIHsKICByZXR1cm4gX19PTU5JR1VJREVfVkVSU0lPTl9fOwp9CgovKioKICogSW5pdGlhbGl6ZSB0aGUgT21uaWd1aWRlIFNESyB3aXRoIGEgc2ltcGxpZmllZCBjb25maWcuCiAqCiAqIFRoaXMgaXMgdGhlIHByaW1hcnkgQVBJIGZvciBzY3JpcHQtdGFnIGNvbnN1bWVycy4KICogSXQgYnVpbGRzIHRoZSBmdWxsIGNvbmZpZywgY3JlYXRlcyBhIHBsYXRmb3JtIGFkYXB0ZXIsCiAqIGFuZCBpbml0aWFsaXplcyBhbGwgZW5hYmxlZCBmZWF0dXJlIGludGVncmF0aW9ucy4KICovCmV4cG9ydCBmdW5jdGlvbiBpbml0KGNvbmZpZzogQnVuZGxlSW5pdENvbmZpZyk6IE9tbmlndWlkZUluc3RhbmNlIHsKICBpZiAoIWNvbmZpZy53ZWJzaXRlSWQpIHsKICAgIHRocm93IG5ldyBFcnJvcignW09tbmlndWlkZV0gd2Vic2l0ZUlkIGlzIHJlcXVpcmVkIGluIGNvbmZpZycpOwogIH0KCiAgLy8gU2V0IGN1cnJlbnQtcGFnZSBvdmVycmlkZSBmb3IgbW9jay9kZXYgc3RvcmVzCiAgaWYgKGNvbmZpZy5jdXJyZW50UGFnZSkgewogICAgc2V0Q3VycmVudFBhZ2VPdmVycmlkZShjb25maWcuY3VycmVudFBhZ2UpOwogIH0KCiAgY29uc3Qgb21uaWd1aWRlQ29uZmlnID0gYnVpbGRDb25maWcoY29uZmlnKTsKICBjb25zdCBwbGF0Zm9ybUFkYXB0ZXIgPSBidWlsZFBsYXRmb3JtQWRhcHRlcihjb25maWcpOwoKICByZXR1cm4gYXV0b0luaXQob21uaWd1aWRlQ29uZmlnLCBwbGF0Zm9ybUFkYXB0ZXIsIG9tbmlndWlkZUNvbmZpZy5mZWF0dXJlcywgY29uZmlnLnNlYXJjaCwgY29uZmlnLnBkcFdpZGdldCwgY29uZmlnLnBscFdpZGdldCk7Cn0KCi8vIOKUgOKUgCBQcmV2aWV3IG1vZGUgY29uc29sZSBBUEkg4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSACi8vIFVzYWdlOiBPbW5pZ3VpZGUuc2V0UHJldmlld0FwaSgnaHR0cHM6Ly9zdGFnaW5nLnN3aWZ0b3R0ZXIuY29tJykKLy8gICAgICAgIE9tbmlndWlkZS5jbGVhclByZXZpZXdBcGkoKQovLyAgICAgICAgT21uaWd1aWRlLmlzUHJldmlld01vZGUoKQoKZXhwb3J0IGZ1bmN0aW9uIHNldFByZXZpZXdBcGkodXJsOiBzdHJpbmcpOiB2b2lkIHsKICBzZXRQcmV2aWV3QXBpVXJsKHVybCk7CiAgY29uc29sZS53YXJuKCdbT21uaWd1aWRlXSBQcmV2aWV3IEFQSSBzZXQgdG8gJXMuIFJlbG9hZCB0aGUgcGFnZSBmb3IgY2hhbmdlcyB0byB0YWtlIGVmZmVjdC4nLCB1cmwpOwp9CgpleHBvcnQgZnVuY3Rpb24gY2xlYXJQcmV2aWV3QXBpKCk6IHZvaWQgewogIGNsZWFyUHJldmlld0FwaVVybCgpOwogIGNvbnNvbGUud2FybignW09tbmlndWlkZV0gUHJldmlldyBBUEkgY2xlYXJlZC4gUmVsb2FkIHRoZSBwYWdlIHRvIHVzZSB0aGUgZGVmYXVsdCBBUEkuJyk7Cn0KCmV4cG9ydCB7IGlzUHJldmlld01vZGUgfTsKCi8vIOKUgOKUgCBEZWNsYXJhdGl2ZSBhdXRvLWluaXQg4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSACi8vIFNjYW4gZm9yIDxzY3JpcHQgZGF0YS1vbW5pZ3VpZGUtY29uZmlnPScuLi4nPiBhbmQgY2FsbCBpbml0KCkgYXV0b21hdGljYWxseS4KCmZ1bmN0aW9uIGRlY2xhcmF0aXZlSW5pdCgpOiB2b2lkIHsKICBjb25zdCBzY3JpcHRzID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvckFsbCgnc2NyaXB0W2RhdGEtb21uaWd1aWRlLWNvbmZpZ10nKTsKCiAgc2NyaXB0cy5mb3JFYWNoKChzY3JpcHQpID0+IHsKICAgIGNvbnN0IHJhdyA9IHNjcmlwdC5nZXRBdHRyaWJ1dGUoJ2RhdGEtb21uaWd1aWRlLWNvbmZpZycpOwogICAgaWYgKCFyYXcpIHJldHVybjsKCiAgICB0cnkgewogICAgICBjb25zdCBjb25maWcgPSBKU09OLnBhcnNlKHJhdykgYXMgQnVuZGxlSW5pdENvbmZpZzsKICAgICAgaW5pdChjb25maWcpOwogICAgfSBjYXRjaCAoZSkgewogICAgICBsb2dnZXIuZXJyb3IoJ0ZhaWxlZCB0byBwYXJzZSBkYXRhLW9tbmlndWlkZS1jb25maWc6JywgZSk7CiAgICB9CiAgfSk7Cn0KCmlmICh0eXBlb2YgZG9jdW1lbnQgIT09ICd1bmRlZmluZWQnKSB7CiAgaWYgKGRvY3VtZW50LnJlYWR5U3RhdGUgPT09ICdsb2FkaW5nJykgewogICAgZG9jdW1lbnQuYWRkRXZlbnRMaXN0ZW5lcignRE9NQ29udGVudExvYWRlZCcsIGRlY2xhcmF0aXZlSW5pdCk7CiAgfSBlbHNlIHsKICAgIC8vIERPTSBhbHJlYWR5IGxvYWRlZCAoc2NyaXB0IGxvYWRlZCBhc3luYy9kZWZlciBvciBhdCBib3R0b20pCiAgICBkZWNsYXJhdGl2ZUluaXQoKTsKICB9Cn0KCi8vIOKUgOKUgCBHbG9iYWwgZXhwb3N1cmUg4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSACi8vIFRoZSBVTUQgYnVpbGQgc2V0cyB3aW5kb3cuT21uaWd1aWRlIHZpYSBWaXRlJ3MgbGliIHdyYXBwZXIsIGJ1dCB3aGVuCi8vIGltcG9ydGVkIGFzIEVTTSAoZS5nLiBtb2NrLXN0b3JlIGRldiBzZXJ2ZXIpIHdlIG5lZWQgYW4gZXhwbGljaXQgYXNzaWdubWVudC4KLy8gSU1QT1JUQU5UOiBPbmx5IGFzc2lnbiBpZiBPbW5pZ3VpZGUgZG9lc24ndCBhbHJlYWR5IGV4aXN0IChpLmUuIEVTTSBtb2RlKS4KLy8gSW4gVU1EIG1vZGUgdGhlIHdyYXBwZXIgYWxyZWFkeSBwb3B1bGF0ZWQgd2luZG93Lk9tbmlndWlkZSB3aXRoIGFsbCBleHBvcnRzOwovLyBvdmVyd3JpdGluZyBpdCBoZXJlIHdvdWxkIGxvc2UgdGhlIHJlLWV4cG9ydGVkIGludGVncmF0aW9uIGNsYXNzZXMvdXRpbGl0aWVzLgppZiAodHlwZW9mIHdpbmRvdyAhPT0gJ3VuZGVmaW5lZCcgJiYgISh3aW5kb3cgYXMgUmVjb3JkPHN0cmluZywgdW5rbm93bj4pWydPbW5pZ3VpZGUnXSkgewogICh3aW5kb3cgYXMgUmVjb3JkPHN0cmluZywgdW5rbm93bj4pWydPbW5pZ3VpZGUnXSA9IHsKICAgIGluaXQsCiAgICBnZXRWZXJzaW9uLAogICAgc2V0UHJldmlld0FwaSwKICAgIGNsZWFyUHJldmlld0FwaSwKICAgIGlzUHJldmlld01vZGUsCiAgfTsKfQo=", import.meta.url).href;
  reactPromise = import(
    /* @vite-ignore */
    base + "vendor-react.js"
  ).then(() => {
  });
  return reactPromise;
}
const PREVIEW_KEY = "omniguide_preview_api";
const PREVIEW_PARAM = "omniguide_preview";
const ALLOWED_PREVIEW_HOSTS = [
  "staging.swiftotter.com",
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
initPreviewFromQueryParam();
function resolveBase() {
  try {
    const url = new URL(import.meta.url);
    return url.href.substring(0, url.href.lastIndexOf("/") + 1);
  } catch {
    return "./";
  }
}
const loadSearchModule = () => import("./omniguide-search-DvB6GyDc.js");
const loadProductFitModule = () => import("./omniguide-product-fit-FT08qaPW.js");
const loadCategoryGuideModule = () => import("./omniguide-category-guide-6qnfGDL_.js");
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
    searchIntegration = new mod.BCSearchIntegration({
      config: omniguideConfig,
      platformAdapter,
      skipDomSetup: true
    });
    searchIntegration.init();
    searchIntegration.openSearch(query, source);
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
function init(config) {
  var _a, _b, _c, _d, _e, _f, _g, _h, _i, _j, _k, _l, _m;
  if (!config.websiteId) {
    throw new Error("[Omniguide] websiteId is required in config");
  }
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
  return "0.6.0";
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
    isPreviewMode
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
  getVersion as a,
  init as b,
  clearPreviewApiUrl as c,
  getPreviewApiUrl as g,
  isPreviewMode as i
};
//# sourceMappingURL=shared-s6iDsSeB.js.map
