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
  const searchForms = (selectors == null ? void 0 : selectors.searchForms) ?? 'form[action="/search.php"], form[data-search="quickSearch"]';
  const searchInputs = (selectors == null ? void 0 : selectors.searchInputs) ?? 'input[name="search_query"]';
  const hideOnActive = [quickSearchResults, searchForms, searchInputs].flatMap((group) => group.split(",")).map((s) => s.trim()).filter(Boolean).map((s) => `body.ai-search-active ${s}`).join(",\n    ");
  const style = document.createElement("style");
  style.id = TRIGGER_STYLE_ID;
  style.textContent = `
    ${hideOnActive} {
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
  const base = new URL("data:video/mp2t;base64,LyoqCiAqIEBzd2lmdG90dGVyL29tbmlndWlkZS1idW5kbGUKICoKICogUHJlLWJ1aWx0IFVNRCBidW5kbGUgZm9yIE9tbmlndWlkZSBBSSBTREsuCiAqIFdvcmtzIHZpYSA8c2NyaXB0PiB0YWcg4oCUIG5vIGJ1aWxkIHRvb2xpbmcgcmVxdWlyZWQuCiAqCiAqIFVzYWdlOgogKiAgIDxsaW5rIHJlbD0ic3R5bGVzaGVldCIgaHJlZj0ib21uaWd1aWRlLXNkay5jc3MiPgogKiAgIDxzY3JpcHQgc3JjPSJvbW5pZ3VpZGUtc2RrLnN0YW5kYWxvbmUuanMiPjwvc2NyaXB0PgogKiAgIDxzY3JpcHQ+CiAqICAgICBPbW5pZ3VpZGUuaW5pdCh7IHdlYnNpdGVJZDogJ2h0dHBzOi8vbXlzdG9yZS5jb20vJyB9KTsKICogICA8L3NjcmlwdD4KICoKICogT3IgZGVjbGFyYXRpdmVseToKICogICA8c2NyaXB0IHNyYz0ib21uaWd1aWRlLXNkay5zdGFuZGFsb25lLmpzIiBkYXRhLW9tbmlndWlkZS1jb25maWc9J3sid2Vic2l0ZUlkIjoiaHR0cHM6Ly9teXN0b3JlLmNvbS8ifSc+PC9zY3JpcHQ+CiAqLwoKLy8gU2lkZS1lZmZlY3QgaW1wb3J0OiBleHRyYWN0cyBDU1MgaW50byBvbW5pZ3VpZGUtc2RrLmNzcwppbXBvcnQgJ0Bzd2lmdG90dGVyL29tbmlndWlkZS1zdHlsZXMnOwoKaW1wb3J0IHsKICBsb2dnZXIsCiAgaW5pdFByZXZpZXdGcm9tUXVlcnlQYXJhbSwKICBzZXRQcmV2aWV3QXBpVXJsLAogIGNsZWFyUHJldmlld0FwaVVybCwKICBpc1ByZXZpZXdNb2RlLAogIHNldEN1cnJlbnRQYWdlT3ZlcnJpZGUsCiAgc3RhcnREYXRhTGF5ZXJCcmlkZ2UsCiAgLy8gSW1wb3J0ZWQsIG5vdCBqdXN0IHJlLWV4cG9ydGVkOiBgZXhwb3J0IHsgeCB9IGZyb20gJ+KApidgIGNyZWF0ZXMgbm8gbG9jYWwKICAvLyBiaW5kaW5nLCBhbmQgdGhlIHdpbmRvdy5PbW5pZ3VpZGUgbGl0ZXJhbCBiZWxvdyBuZWVkcyB0aGUgdmFsdWUgaXRzZWxmLgogIGdldEFuYWx5dGljc0FkYXB0ZXJIZWFsdGgsCiAgaXNEYXRhTGF5ZXJCcmlkZ2VFbmFibGVkLAogIGVuc3VyZVBhZ2VFdmVudFNlcnZpY2UsCiAgZ2V0QXBpQmFzZVVybCwKfSBmcm9tICdAc3dpZnRvdHRlci9vbW5pZ3VpZGUtY29yZSc7CmltcG9ydCB0eXBlIHsgQnVuZGxlSW5pdENvbmZpZywgT21uaWd1aWRlSW5zdGFuY2UgfSBmcm9tICcuL3R5cGVzLmpzJzsKaW1wb3J0IHsgYnVpbGRDb25maWcsIGJ1aWxkUGxhdGZvcm1BZGFwdGVyIH0gZnJvbSAnLi9kZWZhdWx0cy5qcyc7CgppbXBvcnQgeyBhdXRvSW5pdCB9IGZyb20gJy4vYXV0by1pbml0LmpzJzsKCi8vIENoZWNrIHF1ZXJ5IHBhcmFtIG92ZXJyaWRlIGJlZm9yZSBhbnkgaW5pdCgpIGNhbGwKaW5pdFByZXZpZXdGcm9tUXVlcnlQYXJhbSgpOwoKLy8gUmUtZXhwb3J0IHR5cGVzIGZvciBhZHZhbmNlZCBjb25zdW1lcnMKZXhwb3J0IHR5cGUgeyBCdW5kbGVJbml0Q29uZmlnLCBPbW5pZ3VpZGVJbnN0YW5jZSB9IGZyb20gJy4vdHlwZXMuanMnOwoKLy8gUmUtZXhwb3J0IGludGVncmF0aW9uIGNsYXNzZXMgYW5kIHV0aWxpdGllcyBmb3IgYWR2YW5jZWQgdXNhZ2UKZXhwb3J0IHsKICBCQ1NlYXJjaEludGVncmF0aW9uLAogIEJDUHJvZHVjdEZpdEludGVncmF0aW9uLAogIEJDQ2F0ZWdvcnlHdWlkZUludGVncmF0aW9uLAogIGNyZWF0ZUJpZ0NvbW1lcmNlQWRhcHRlciwKICBpbml0QmlnQ29tbWVyY2VBZGFwdGVyLAogIGNyZWF0ZUJpZ0NvbW1lcmNlQ29tcGF0LAogIExBVEVOQ1ksCiAgUmVzcG9uc2VUaW1lciwKICBjcmVhdGVSZXNwb25zZVRpbWVyLAp9IGZyb20gJ0Bzd2lmdG90dGVyL29tbmlndWlkZS1iaWdjb21tZXJjZSc7CgovLyBSZS1leHBvcnQgY29yZSB1dGlsaXRpZXMgZm9yIHRoZW1lIHdyYXBwZXIgZmlsZXMgYW5kIGN1c3RvbSBzZXR1cHMKZXhwb3J0IHsKICBjcmVhdGVTZXNzaW9uU2VydmljZSwKICBjcmVhdGVDb25zZW50U2VydmljZSwKICBOdWxsUGxhdGZvcm1BZGFwdGVyLAogIGNyZWF0ZVBsYXRmb3JtQWRhcHRlciwKICBnZXRQYWdlQ29udGV4dCwKICBjYXB0dXJlUGFnZUNvbnRleHQsCiAgdHJhY2tFdmVudCwKICB1cGRhdGVFdmVudENvbnRleHQsCiAgZ2V0Q29uc2VudFN0YXRlLAp9IGZyb20gJ0Bzd2lmdG90dGVyL29tbmlndWlkZS1jb3JlJzsKCmV4cG9ydCB7IE9tbmlndWlkZVByb3ZpZGVyIH0gZnJvbSAnQHN3aWZ0b3R0ZXIvb21uaWd1aWRlLXJlYWN0JzsKCi8vIFBMUCBzdXJmYWNlIChTT0ktNjM5KSDigJQgY2hyb21lIGV4dCArIFRyYWN0LXN0eWxlIGRpcmVjdC1pbnN0YWxsIGNvbnN1bWVycwovLyBwaWNrIHVwIHRoZSBjb250YWluZXIsIGhvb2tzLCBhbmQgaGVscGVycyB2aWEgd2luZG93Lk9tbmlndWlkZSBpbiB0aGUKLy8gc3RhbmRhbG9uZS9leHRlcm5hbCBidWlsZHMuIFRoZSBucG0tcGFja2FnZSBjb25zdW1wdGlvbiBwYXRoIChtb2NrLXN0b3JlCi8vICsgZnV0dXJlIFNESyBjb25zdW1lcnMpIGltcG9ydHMgZnJvbSBgQHN3aWZ0b3R0ZXIvb21uaWd1aWRlLXByb2R1Y3QtbGlzdGAKLy8gZGlyZWN0bHk7IGJvdGggcmVhY2ggdGhlIHNhbWUgZXhwb3J0cy4KZXhwb3J0IHsKICBQcm9kdWN0TGlzdENvbnRhaW5lciwKICBDYXRlZ29yeUhlYWRlciwKICBQcm9kdWN0R3JpZCwKICBUb29sYmFyLAogIFNvcnRTZWxlY3QsCiAgRmFjZXRTaWRlYmFyLAogIE11bHRpU2VsZWN0RmFjZXQsCiAgUHJpY2VSYW5nZUZhY2V0LAogIEFjdGl2ZUZpbHRlcnMsCiAgTG9hZE1vcmUsCiAgUmVkaXJlY3REcmlsbGRvd24sCiAgU09SVF9WQUxVRVMsCiAgcGFyc2VGaWx0ZXJzLAogIGJ1aWxkVXJsLAogIHB1c2hGaWx0ZXJzLAogIGZldGNoUExQLAogIFNFU1NJT05fSURfSEVBREVSLAogIHVzZVByb2R1Y3RMaXN0LAogIHVzZVdlYlZpdGFsc0JlYWNvbiwKICByZW5kZXJQcm9kdWN0TGlzdCwKICB0eXBlIFJlbmRlclByb2R1Y3RMaXN0Q29uZmlnLAogIHR5cGUgUmVuZGVyUHJvZHVjdExpc3RIYW5kbGUsCn0gZnJvbSAnQHN3aWZ0b3R0ZXIvb21uaWd1aWRlLXByb2R1Y3QtbGlzdCc7CgovLyBTaGFyZWQgcHJvZHVjdC1kaXNwbGF5IHByaW1pdGl2ZXMgdXNlZCBieSBQTFAgKyBmdXR1cmUgY2Fyb3VzZWwgVUkuCmV4cG9ydCB7CiAgUHJvZHVjdFRpbGUsCiAgUHJvZHVjdEltYWdlLAogIFByaWNlQmxvY2ssCiAgRmxhZ0JhZGdlcywKICBWYXJpYW50U3dhdGNoZXMsCiAgUHJvZHVjdFRpbGVTa2VsZXRvbiwKfSBmcm9tICdAc3dpZnRvdHRlci9vbW5pZ3VpZGUtY2F0YWxvZyc7CgovLyBDYXJvdXNlbCBzdXJmYWNlIChTT0ktNjQwKSDigJQgbmFycmF0aXZlLWxlZCByZWNvbW1lbmRhdGlvbiByb3dzIGZvciBQRFAgKwovLyBob21lL0NNUyBwYWdlcy4gQ2hyb21lIGV4dGVuc2lvbiBjb25zdW1lcyB2aWEgd2luZG93Lk9tbmlndWlkZS5yZW5kZXJDYXJvdXNlbC4KZXhwb3J0IHsKICBDYXJvdXNlbENvbnRhaW5lciwKICBDYXJvdXNlbFJvdywKICBDYXJvdXNlbENhcmQsCiAgQ2Fyb3VzZWxSb3dTa2VsZXRvbiwKICBOYXJyYXRpdmVCbG9jaywKICBDYXJvdXNlbFNvdXJjZUJhZGdlLAogIGZldGNoQ2Fyb3VzZWwsCiAgQ0FST1VTRUxfRU1QVFksCiAgQ2Fyb3VzZWxTbG90Tm90Rm91bmRFcnJvciwKICB1c2VDYXJvdXNlbCwKICB1c2VDYXJvdXNlbEV2ZW50cywKICB1c2VDYXJvdXNlbFZpc2liaWxpdHksCiAgY3JlYXRlVmlzaWJpbGl0eVRyYWNrZXIsCiAgYnVpbGRDYXJvdXNlbEV2ZW50RW5kcG9pbnQsCiAgbWFrZUNhcm91c2VsRXZlbnRTZXJpYWxpemVyLAogIHJlbmRlckNhcm91c2VsLAogIHR5cGUgUmVuZGVyQ2Fyb3VzZWxIYW5kbGUsCiAgdHlwZSBDYXJvdXNlbENvbnRhaW5lclByb3BzLAogIHR5cGUgRmV0Y2hDYXJvdXNlbENvbmZpZywKfSBmcm9tICdAc3dpZnRvdHRlci9vbW5pZ3VpZGUtY2Fyb3VzZWwnOwoKZGVjbGFyZSBjb25zdCBfX09NTklHVUlERV9WRVJTSU9OX186IHN0cmluZzsKCi8qKgogKiBHZXQgdGhlIGJ1bmRsZSB2ZXJzaW9uLgogKi8KZXhwb3J0IGZ1bmN0aW9uIGdldFZlcnNpb24oKTogc3RyaW5nIHsKICByZXR1cm4gX19PTU5JR1VJREVfVkVSU0lPTl9fOwp9CgovKioKICogSW5pdGlhbGl6ZSB0aGUgT21uaWd1aWRlIFNESyB3aXRoIGEgc2ltcGxpZmllZCBjb25maWcuCiAqCiAqIFRoaXMgaXMgdGhlIHByaW1hcnkgQVBJIGZvciBzY3JpcHQtdGFnIGNvbnN1bWVycy4KICogSXQgYnVpbGRzIHRoZSBmdWxsIGNvbmZpZywgY3JlYXRlcyBhIHBsYXRmb3JtIGFkYXB0ZXIsCiAqIGFuZCBpbml0aWFsaXplcyBhbGwgZW5hYmxlZCBmZWF0dXJlIGludGVncmF0aW9ucy4KICovCi8qKgogKiBTdGFydCB0aGUgZGF0YUxheWVyIGJyaWRnZSBvbmNlIHBlciBpbml0LCBpZiB0aGUgc3RvcmVmcm9udCBhc2tlZCBmb3IgaXQuCiAqCiAqIFRoZSByZXR1cm5lZCBkZXRhY2ggaXMgZHJvcHBlZCBvbiBwdXJwb3NlOiB0aGUgYnJpZGdlIGxpdmVzIGFzIGxvbmcgYXMgdGhlCiAqIGRvY3VtZW50IGRvZXMuIFRoZXJlIGlzIG5vIHBhZ2UtbGV2ZWwgdGVhcmRvd24gdG8gaGFuZyBpdCBvbiwgYW5kIHRoZSBwb2xsZXIKICogaXMgcmVmY291bnRlZCwgc28gYSBzZWNvbmQgaW5pdCgpIGlzIHNhZmUuCiAqCiAqIFRoZSBTSU5LIGlzIGNyZWF0ZWQgaGVyZSB0b28sIGF0IHRoZSBzYW1lIHBhZ2UgbGV2ZWwgYXMgdGhlIGJyaWRnZS4gU3RhcnRpbmcKICogdGhlIGJyaWRnZSBwYWdlLWxldmVsIHdoaWxlIHRoZSBvbmx5IEV2ZW50U2VydmljZSB3YXMgYnVpbHQgYnkgYSBSZWFjdAogKiBwcm92aWRlciBtZWFudCBhIGNhcnQsIGNoZWNrb3V0IG9yIG9yZGVyLWNvbmZpcm1hdGlvbiBwYWdlIGZvcndhcmRlZCBpbnRvCiAqIG5vdGhpbmc6IHRoZSBicmlkZ2UgcG9sbGVkLCBmb3VuZCBubyBzZXJ2aWNlIGFuZCBkcm9wcGVkIGl0cyBiYWNrbG9nIGF0CiAqIHVubG9hZC4gYGVuc3VyZVBhZ2VFdmVudFNlcnZpY2VgIGlzIGlkZW1wb3RlbnQsIHNvIGEgcHJvdmlkZXIgdGhhdCBkb2VzCiAqIG1vdW50IGxhdGVyIHNoYXJlcyB0aGlzIG9uZSBpbnN0YW5jZSByYXRoZXIgdGhhbiBvcGVuaW5nIGEgcml2YWwgcXVldWUuCiAqLwpmdW5jdGlvbiBzdGFydEJyaWRnZUlmQ29uZmlndXJlZChjb25maWc6IEJ1bmRsZUluaXRDb25maWcpOiB2b2lkIHsKICAvLyBUaGUgYnJpZGdlJ3Mgb3duIHZlcmRpY3QsIG5vdCBhIHNlY29uZCBjb3B5IG9mIGl0LiBge31gIGFuZAogIC8vIGB7Z3RtOiBmYWxzZX1gIGFyZSBib3RoICJvZmYiLCBhbmQgYnVpbGRpbmcgYSBzaW5rIGZvciB0aGVtIHdvdWxkIGxlYXZlIGEKICAvLyBmbHVzaCBpbnRlcnZhbCBhbmQgdW5sb2FkIGxpc3RlbmVycyBvbiBhIHN0b3JlZnJvbnQgdGhhdCBzYWlkIG5vLgogIGlmICghaXNEYXRhTGF5ZXJCcmlkZ2VFbmFibGVkKGNvbmZpZy5kYXRhTGF5ZXJCcmlkZ2UpKSByZXR1cm47CiAgLy8gQ29udGFpbmVkLCBhbmQgdGhlIGJyaWRnZSBzdGlsbCBzdGFydHMuIEJ1aWxkaW5nIHRoZSBzaW5rIHJlYWRzIHRoZQogIC8vIHN0b3JlZnJvbnQncyBjb25zZW50IGNvbmZpZywgd2hpY2ggaW5pdCgpIHRha2VzIG9uIHRydXN0IGZyb20gYSBKU09OCiAgLy8gYXR0cmlidXRlIOKAlCBhbiB1bmtub3duIHJlYWRlciBuYW1lIHRocm93cy4gQmVmb3JlIHRoaXMgcmFuIGF0IHBhZ2UgbGV2ZWwKICAvLyB0aGF0IHRocmV3IGluc2lkZSBvbmUgd2lkZ2V0J3MgcmVuZGVyLCB3aGVyZSBhdXRvLWluaXQgY2F1Z2h0IGl0OyBoZXJlIGl0CiAgLy8gd291bGQgZXNjYXBlIGluaXQoKSBhbmQgdGFrZSBzZWFyY2gsIFBEUCBhbmQgUExQIGRvd24gd2l0aCBpdC4KICB0cnkgewogICAgZW5zdXJlUGFnZUV2ZW50U2VydmljZSh7CiAgICAgIGFwaUJhc2VVcmw6IGdldEFwaUJhc2VVcmwoY29uZmlnLmFwaUJhc2VVcmwpLAogICAgICB3ZWJzaXRlSWQ6IGNvbmZpZy53ZWJzaXRlSWQsCiAgICAgIGNvbnNlbnQ6IGNvbmZpZy5jb25zZW50LAogICAgICBzZXNzaW9uU3RvcmFnZUtleTogY29uZmlnLnN0b3JhZ2VLZXlzPy5zZXNzaW9uSWQsCiAgICB9KTsKICB9IGNhdGNoIChlcnJvcikgewogICAgbG9nZ2VyLmVycm9yKCdDb3VsZCBub3QgY3JlYXRlIHRoZSBwYWdlIEV2ZW50U2VydmljZTonLCBlcnJvcik7CiAgfQogIHN0YXJ0RGF0YUxheWVyQnJpZGdlKGNvbmZpZy5kYXRhTGF5ZXJCcmlkZ2UpOwp9CgpleHBvcnQgZnVuY3Rpb24gaW5pdChjb25maWc6IEJ1bmRsZUluaXRDb25maWcpOiBPbW5pZ3VpZGVJbnN0YW5jZSB7CiAgaWYgKCFjb25maWcud2Vic2l0ZUlkKSB7CiAgICB0aHJvdyBuZXcgRXJyb3IoJ1tPbW5pZ3VpZGVdIHdlYnNpdGVJZCBpcyByZXF1aXJlZCBpbiBjb25maWcnKTsKICB9CgogIC8vIFNldCBjdXJyZW50LXBhZ2Ugb3ZlcnJpZGUgZm9yIG1vY2svZGV2IHN0b3JlcwogIGlmIChjb25maWcuY3VycmVudFBhZ2UpIHsKICAgIHNldEN1cnJlbnRQYWdlT3ZlcnJpZGUoY29uZmlnLmN1cnJlbnRQYWdlKTsKICB9CgogIC8vIFBhZ2UgbGV2ZWwsIG5vdCB3aWRnZXQgbGV2ZWwuIFRoZSBicmlkZ2UgZm9yd2FyZHMgdGhlIHN0b3JlZnJvbnQncyBvd24KICAvLyBhbmFseXRpY3MgYXJyYXlzLCB3aGljaCBmaXJlIG9uIGV2ZXJ5IHBhZ2Ug4oCUIGluY2x1ZGluZyBjYXJ0IGFuZCBjaGVja291dCwKICAvLyB3aGVyZSBgZGxfYmVnaW5fY2hlY2tvdXRgIGFuZCBgZGxfcHVyY2hhc2VgIGxpdmUgYW5kIHdoZXJlIE5PIE9tbmlndWlkZQogIC8vIHdpZGdldCBtb3VudHMuIFN0YXJ0aW5nIGl0IGZyb20gYSBtb3VudGVkIHByb3ZpZGVyIHRpZWQgdGhlIHN0b3JlZnJvbnQncwogIC8vIG1vc3QgdmFsdWFibGUgZXZlbnRzIHRvIHdoZXRoZXIgYSBQRFAvUExQIGNvbnRhaW5lciBoYXBwZW5lZCB0byBleGlzdC4KICBzdGFydEJyaWRnZUlmQ29uZmlndXJlZChjb25maWcpOwoKICBjb25zdCBvbW5pZ3VpZGVDb25maWcgPSBidWlsZENvbmZpZyhjb25maWcpOwogIGNvbnN0IHBsYXRmb3JtQWRhcHRlciA9IGJ1aWxkUGxhdGZvcm1BZGFwdGVyKGNvbmZpZyk7CgogIHJldHVybiBhdXRvSW5pdChvbW5pZ3VpZGVDb25maWcsIHBsYXRmb3JtQWRhcHRlciwgb21uaWd1aWRlQ29uZmlnLmZlYXR1cmVzLCBjb25maWcuc2VhcmNoLCBjb25maWcucGRwV2lkZ2V0LCBjb25maWcucGxwV2lkZ2V0LCBjb25maWcucGxwTWF0Y2hSaWJib25zLCBjb25maWcucGRwTWF0Y2hCYWRnZSwgY29uZmlnLnBsYXRmb3JtKTsKfQoKLy8g4pSA4pSAIFByZXZpZXcgbW9kZSBjb25zb2xlIEFQSSDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIAKLy8gVXNhZ2U6IE9tbmlndWlkZS5zZXRQcmV2aWV3QXBpKCdodHRwczovL3NlcnZpY2Utc3RhZ2luZy5vbW5pZ3VpZGUuYWknKQovLyAgICAgICAgT21uaWd1aWRlLmNsZWFyUHJldmlld0FwaSgpCi8vICAgICAgICBPbW5pZ3VpZGUuaXNQcmV2aWV3TW9kZSgpCgpleHBvcnQgZnVuY3Rpb24gc2V0UHJldmlld0FwaSh1cmw6IHN0cmluZyk6IHZvaWQgewogIHNldFByZXZpZXdBcGlVcmwodXJsKTsKICAvLyBlc2xpbnQtZGlzYWJsZS1uZXh0LWxpbmUgbm8tY29uc29sZSAtLSBpbnRlbnRpb25hbCB1c2VyLXZpc2libGUgZmVlZGJhY2sgZnJvbSBPbW5pZ3VpZGUuc2V0UHJldmlld0FwaSgpIGNhbGwKICBjb25zb2xlLndhcm4oJ1tPbW5pZ3VpZGVdIFByZXZpZXcgQVBJIHNldCB0byAlcy4gUmVsb2FkIHRoZSBwYWdlIGZvciBjaGFuZ2VzIHRvIHRha2UgZWZmZWN0LicsIHVybCk7Cn0KCmV4cG9ydCBmdW5jdGlvbiBjbGVhclByZXZpZXdBcGkoKTogdm9pZCB7CiAgY2xlYXJQcmV2aWV3QXBpVXJsKCk7CiAgLy8gZXNsaW50LWRpc2FibGUtbmV4dC1saW5lIG5vLWNvbnNvbGUgLS0gaW50ZW50aW9uYWwgdXNlci12aXNpYmxlIGZlZWRiYWNrIGZyb20gT21uaWd1aWRlLmNsZWFyUHJldmlld0FwaSgpIGNhbGwKICBjb25zb2xlLndhcm4oJ1tPbW5pZ3VpZGVdIFByZXZpZXcgQVBJIGNsZWFyZWQuIFJlbG9hZCB0aGUgcGFnZSB0byB1c2UgdGhlIGRlZmF1bHQgQVBJLicpOwp9CgpleHBvcnQgeyBpc1ByZXZpZXdNb2RlIH07CmV4cG9ydCB7IGdldEFuYWx5dGljc0FkYXB0ZXJIZWFsdGggfTsKCi8vIOKUgOKUgCBEZWNsYXJhdGl2ZSBhdXRvLWluaXQg4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSACi8vIFNjYW4gZm9yIDxzY3JpcHQgZGF0YS1vbW5pZ3VpZGUtY29uZmlnPScuLi4nPiBhbmQgY2FsbCBpbml0KCkgYXV0b21hdGljYWxseS4KCmZ1bmN0aW9uIGRlY2xhcmF0aXZlSW5pdCgpOiB2b2lkIHsKICBjb25zdCBzY3JpcHRzID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvckFsbCgnc2NyaXB0W2RhdGEtb21uaWd1aWRlLWNvbmZpZ10nKTsKCiAgc2NyaXB0cy5mb3JFYWNoKChzY3JpcHQpID0+IHsKICAgIGNvbnN0IHJhdyA9IHNjcmlwdC5nZXRBdHRyaWJ1dGUoJ2RhdGEtb21uaWd1aWRlLWNvbmZpZycpOwogICAgaWYgKCFyYXcpIHJldHVybjsKCiAgICB0cnkgewogICAgICBjb25zdCBjb25maWcgPSBKU09OLnBhcnNlKHJhdykgYXMgQnVuZGxlSW5pdENvbmZpZzsKICAgICAgaW5pdChjb25maWcpOwogICAgfSBjYXRjaCAoZSkgewogICAgICBsb2dnZXIuZXJyb3IoJ0ZhaWxlZCB0byBwYXJzZSBkYXRhLW9tbmlndWlkZS1jb25maWc6JywgZSk7CiAgICB9CiAgfSk7Cn0KCmlmICh0eXBlb2YgZG9jdW1lbnQgIT09ICd1bmRlZmluZWQnKSB7CiAgaWYgKGRvY3VtZW50LnJlYWR5U3RhdGUgPT09ICdsb2FkaW5nJykgewogICAgZG9jdW1lbnQuYWRkRXZlbnRMaXN0ZW5lcignRE9NQ29udGVudExvYWRlZCcsIGRlY2xhcmF0aXZlSW5pdCk7CiAgfSBlbHNlIHsKICAgIC8vIERPTSBhbHJlYWR5IGxvYWRlZCAoc2NyaXB0IGxvYWRlZCBhc3luYy9kZWZlciBvciBhdCBib3R0b20pCiAgICBkZWNsYXJhdGl2ZUluaXQoKTsKICB9Cn0KCi8vIOKUgOKUgCBHbG9iYWwgZXhwb3N1cmUg4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSACi8vIFRoZSBVTUQgYnVpbGQgc2V0cyB3aW5kb3cuT21uaWd1aWRlIHZpYSBWaXRlJ3MgbGliIHdyYXBwZXIsIGJ1dCB3aGVuCi8vIGltcG9ydGVkIGFzIEVTTSAoZS5nLiBtb2NrLXN0b3JlIGRldiBzZXJ2ZXIpIHdlIG5lZWQgYW4gZXhwbGljaXQgYXNzaWdubWVudC4KLy8gSU1QT1JUQU5UOiBPbmx5IGFzc2lnbiBpZiBPbW5pZ3VpZGUgZG9lc24ndCBhbHJlYWR5IGV4aXN0IChpLmUuIEVTTSBtb2RlKS4KLy8gSW4gVU1EIG1vZGUgdGhlIHdyYXBwZXIgYWxyZWFkeSBwb3B1bGF0ZWQgd2luZG93Lk9tbmlndWlkZSB3aXRoIGFsbCBleHBvcnRzOwovLyBvdmVyd3JpdGluZyBpdCBoZXJlIHdvdWxkIGxvc2UgdGhlIHJlLWV4cG9ydGVkIGludGVncmF0aW9uIGNsYXNzZXMvdXRpbGl0aWVzLgppZiAodHlwZW9mIHdpbmRvdyAhPT0gJ3VuZGVmaW5lZCcgJiYgISh3aW5kb3cgYXMgdW5rbm93biBhcyBSZWNvcmQ8c3RyaW5nLCB1bmtub3duPilbJ09tbmlndWlkZSddKSB7CiAgKHdpbmRvdyBhcyB1bmtub3duIGFzIFJlY29yZDxzdHJpbmcsIHVua25vd24+KVsnT21uaWd1aWRlJ10gPSB7CiAgICBpbml0LAogICAgZ2V0VmVyc2lvbiwKICAgIHNldFByZXZpZXdBcGksCiAgICBjbGVhclByZXZpZXdBcGksCiAgICBpc1ByZXZpZXdNb2RlLAogICAgLy8gUmVhY2hhYmxlIGZyb20gYSBzdG9yZWZyb250IGNvbnNvbGUgc28gYSB3aXJpbmcgYXVkaXQgZG9lcyBub3QgaGF2ZSB0bwogICAgLy8gY2xpY2sgYSBwcm9kdWN0IGFuZCB3YXRjaCBmb3IgdGhlIHdhcm5pbmcuCiAgICBnZXRBbmFseXRpY3NBZGFwdGVySGVhbHRoLAogIH07Cn0K", import.meta.url).href;
  reactPromise = import(
    /* @vite-ignore */
    base + "vendor-react.js"
  ).then(() => {
  });
  return reactPromise;
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
const log$1 = createScopedLogger("resolveContainer");
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
      log$1.warn(`Ignoring malformed mount selector: ${String(mount.target)}`);
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
    log$1.warn(
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
const loadSearchModule = () => import("./omniguide-search-BD_EKtVf.js");
const loadProductFitModule = () => import("./omniguide-product-fit-DwPhiJYs.js");
const loadCategoryGuideModule = () => import("./omniguide-category-guide-Bwgg8cRF.js");
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
  void import("./shared-CTl1oP6w.js").then((mod) => {
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
  describeMountTargets as d,
  reportAnalyticsAdapterThrew as e,
  getAnalyticsAdapterHealth as f,
  getPreviewApiUrl as g,
  initPreviewFromQueryParam as h,
  isPreviewMode as i,
  getVersion as j,
  init as k,
  logger as l,
  resolveObserveTarget as m,
  resolveContainer as r,
  setPreviewApiUrl as s
};
//# sourceMappingURL=shared-DcjQmxsX.js.map
