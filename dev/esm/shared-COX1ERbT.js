import React, { memo, useState, useMemo, useEffect, useRef, useLayoutEffect, useContext, createContext, useCallback } from "react";
import { c as createScopedLogger, p as createPlatformAdapter, q as capturePageContext, L as LocalStorageAdapter, r as platformRegistry, u as createConsentService, v as createEventService, w as registerEventService, x as createFeedbackAPI, j as getSessionId, N as NullPlatformAdapter, l as logger, y as registerConsentService, T as TYPEAHEAD_SECTION_ORDER, z as fetchTypeaheadSearch, s as sanitizeUrl, g as getCurrentPage, B as extractSkusFromMarkdown, C as createResponseTimer, E as ERROR_MESSAGES, b as setSessionId, D as ChatWebSocket, A as API_ENDPOINTS, G as filterEmptyContent, H as filterRedundantContent, I as getConversationId, J as setConversationId, t as transformSummary, K as getSessionStart, S as SDK_ORIGIN_MARKER, M as getApiBaseUrl, O as DEFAULT_STORAGE_KEYS } from "./shared-ChDzhkiY.js";
import { g as getPreviewApiUrl, c as clearPreviewApiUrl, i as isPreviewMode } from "./shared-mg2rmv2z.js";
const log$a = createScopedLogger("directGraphQL");
const PRODUCT_BATCH_SIZE = 20;
const CATEGORY_BATCH_SIZE = 8;
const PRODUCT_FRAGMENT = `
  fragment ProductFields on Product {
    entityId
    sku
    name
    path
    defaultImage {
      url640wide: url(width: 640)
      altText
    }
    prices {
      price { value }
      retailPrice { value }
    }
    brand {
      name
    }
  }
`;
const CATEGORY_FRAGMENT = `
  fragment CategoryFields on Category {
    entityId
    name
    path
    description
    defaultImage {
      url640wide: url(width: 640)
    }
  }
`;
async function postGraphQL(query, options) {
  var _a;
  const endpoint = options.endpoint ?? "/graphql";
  const token = options.getToken();
  if (!token) {
    log$a.warn("no storefront token; direct GraphQL request skipped");
    return null;
  }
  try {
    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({ query })
    });
    if (!response.ok) {
      log$a.warn("direct GraphQL HTTP", response.status, endpoint);
      return null;
    }
    const json = await response.json();
    if ((_a = json.errors) == null ? void 0 : _a.length) {
      log$a.warn("direct GraphQL errors", json.errors.map((e) => e.message));
    }
    return json;
  } catch (error) {
    log$a.warn("direct GraphQL request failed", endpoint, error);
    return null;
  }
}
function escapeGraphQLString(value) {
  return value.replace(/\\/g, "\\\\").replace(/"/g, '\\"');
}
function buildProductsQuery(skus) {
  const aliases = skus.map((sku, i) => `sku_${i}: product(sku: "${escapeGraphQLString(sku)}") { ...ProductFields }`).join("\n");
  return `query ProductsBySkus { site { ${aliases} } } ${PRODUCT_FRAGMENT}`;
}
function buildCategoriesQuery(ids) {
  const aliases = ids.map((id, i) => `cat_${i}: category(entityId: ${id}) { ...CategoryFields }`).join("\n");
  return `query CategoriesByIds { site { ${aliases} } } ${CATEGORY_FRAGMENT}`;
}
function transformProductNode(node) {
  var _a, _b, _c, _d, _e, _f, _g;
  const path = node.path;
  const priceValue = (_b = (_a = node.prices) == null ? void 0 : _a.price) == null ? void 0 : _b.value;
  const retailValue = (_d = (_c = node.prices) == null ? void 0 : _c.retailPrice) == null ? void 0 : _d.value;
  const price = priceValue !== void 0 || retailValue !== void 0 ? {
    ...priceValue !== void 0 ? { value: priceValue } : {},
    ...retailValue !== void 0 ? { retailPrice: { value: retailValue } } : {}
  } : void 0;
  return {
    entityId: node.entityId,
    sku: node.sku,
    name: node.name,
    path,
    url: path,
    price,
    imageUrl: (_e = node.defaultImage) == null ? void 0 : _e.url640wide,
    imageAlt: (_f = node.defaultImage) == null ? void 0 : _f.altText,
    brand: (_g = node.brand) == null ? void 0 : _g.name
  };
}
function transformCategoryNode(node) {
  var _a;
  return {
    entityId: node.entityId,
    name: node.name,
    path: node.path,
    description: node.description,
    defaultImage: ((_a = node.defaultImage) == null ? void 0 : _a.url640wide) || ""
  };
}
async function fetchProductsDirectGraphQL(skus, options) {
  var _a;
  if (!skus || skus.length === 0) return [];
  const unique = Array.from(new Set(skus));
  const out = [];
  for (let start = 0; start < unique.length; start += PRODUCT_BATCH_SIZE) {
    const batch = unique.slice(start, start + PRODUCT_BATCH_SIZE);
    const query = buildProductsQuery(batch);
    const result = await postGraphQL(query, options);
    const site = ((_a = result == null ? void 0 : result.data) == null ? void 0 : _a.site) ?? {};
    for (let i = 0; i < batch.length; i++) {
      const node = site[`sku_${i}`];
      if (node) out.push(transformProductNode(node));
    }
  }
  return out;
}
async function fetchCategoriesDirectGraphQL(ids, options) {
  var _a;
  if (!ids || ids.length === 0) return [];
  const unique = Array.from(new Set(ids));
  const out = [];
  for (let start = 0; start < unique.length; start += CATEGORY_BATCH_SIZE) {
    const batch = unique.slice(start, start + CATEGORY_BATCH_SIZE);
    const query = buildCategoriesQuery(batch);
    const result = await postGraphQL(query, options);
    const site = ((_a = result == null ? void 0 : result.data) == null ? void 0 : _a.site) ?? {};
    for (let i = 0; i < batch.length; i++) {
      const node = site[`cat_${i}`];
      if (node) out.push(transformCategoryNode(node));
    }
  }
  return out;
}
const BOOTSTRAP_MARKER = "stencilBootstrap";
const TOKEN_PATTERNS = [
  /\\"token\\":\\"([\w.-]+)\\"/,
  /"token":"([\w.-]+)"/
];
const JWT_SHAPE = /^[\w-]+\.[\w-]+\.[\w-]+$/;
let cachedToken = null;
function readStencilContextToken(doc) {
  var _a;
  if (cachedToken) return cachedToken;
  const target = typeof document !== "undefined" ? document : null;
  if (!target) return null;
  for (const script of Array.from(target.querySelectorAll("script:not([src])"))) {
    const text2 = script.textContent;
    if (!text2 || !text2.includes(BOOTSTRAP_MARKER)) continue;
    for (const pattern of TOKEN_PATTERNS) {
      const token = (_a = text2.match(pattern)) == null ? void 0 : _a[1];
      if (token && JWT_SHAPE.test(token)) {
        cachedToken = token;
        return token;
      }
    }
  }
  return null;
}
const log$9 = createScopedLogger("BigCommerceAdapter");
const PRODUCT_HYDRATE_KEYS$1 = [
  "entityId",
  "name",
  "display_name",
  "product_line",
  "sku",
  "path",
  "url",
  "price",
  "imageUrl",
  "brandId",
  "brand"
];
const CATEGORY_HYDRATE_KEYS$1 = [
  "entityId",
  "name",
  "path",
  "url",
  "imageUrl",
  "description"
];
function mergeEntityData$1(original, fetched, hydrateKeys) {
  if (!fetched) return original;
  const merged = { ...original };
  for (const key of hydrateKeys) {
    const originalValue = merged[key];
    const fetchedValue = fetched[key];
    const isOriginalEmpty = originalValue === null || originalValue === void 0 || typeof originalValue === "string" && originalValue.trim() === "" || typeof originalValue === "object" && Object.keys(originalValue).length === 0;
    if (isOriginalEmpty && fetchedValue !== void 0 && fetchedValue !== null) {
      merged[key] = fetchedValue;
    }
  }
  return merged;
}
function createBigCommerceAdapter(config) {
  var _a;
  const productEndpoint = config.productHydrationEndpoint ?? "/bc-search-products";
  const categoryEndpoint = config.categoryHydrationEndpoint ?? "/bc-search-categories";
  const getEffectiveApiBaseUrl = () => getPreviewApiUrl() ?? config.apiBaseUrl;
  const getGraphQLToken = () => {
    var _a2;
    if (typeof window === "undefined") return null;
    return window.graphQLToken ?? ((_a2 = window.storeConfig) == null ? void 0 : _a2.storefrontToken) ?? readStencilContextToken();
  };
  const directGraphQLOptions = ((_a = config.directGraphQL) == null ? void 0 : _a.enabled) ? {
    endpoint: config.directGraphQL.endpoint,
    getToken: config.directGraphQL.getToken ?? getGraphQLToken
  } : null;
  const adapter = createPlatformAdapter({
    getPlatformName: () => "bigcommerce",
    isInitialized: () => {
      var _a2;
      if (typeof window === "undefined") return false;
      return !!((_a2 = window.storeConfig) == null ? void 0 : _a2.storefrontToken);
    },
    getCredentials: () => {
      var _a2, _b;
      return {
        storefrontToken: typeof window !== "undefined" ? ((_a2 = window.storeConfig) == null ? void 0 : _a2.storefrontToken) ?? null : null,
        storeHash: typeof window !== "undefined" ? ((_b = window.storeConfig) == null ? void 0 : _b.storeHash) ?? null : null,
        graphQLToken: getGraphQLToken()
      };
    },
    getProductSku: () => {
      var _a2, _b;
      if (typeof window === "undefined") return null;
      try {
        return ((_b = (_a2 = window.BCData) == null ? void 0 : _a2.product_attributes) == null ? void 0 : _b.sku) ?? null;
      } catch (e) {
        log$9.warn("Failed to get product SKU from BCData:", e);
        return null;
      }
    },
    hydrateProducts: async (products) => {
      if (!products || products.length === 0) {
        return [];
      }
      const skusToFetch = products.map((p) => p.sku).filter((sku) => !!sku);
      if (skusToFetch.length === 0) {
        return products;
      }
      let fetchedProducts = [];
      if (directGraphQLOptions) {
        try {
          fetchedProducts = await fetchProductsDirectGraphQL(skusToFetch, directGraphQLOptions);
        } catch (error) {
          log$9.error("Direct GraphQL product hydration failed:", error);
          return products;
        }
      } else {
        const graphqlToken = getGraphQLToken();
        try {
          const headers = {
            "Content-Type": "application/json"
          };
          if (graphqlToken) {
            headers["X-Storefront-Token"] = graphqlToken;
          }
          const response = await fetch(`${getEffectiveApiBaseUrl()}${productEndpoint}`, {
            method: "POST",
            headers,
            body: JSON.stringify({
              skus: skusToFetch,
              website_code: config.websiteId,
              graphql_token: graphqlToken
            })
          });
          if (!response.ok) {
            log$9.error("Product hydration failed:", response.status);
            return products;
          }
          const data = await response.json();
          fetchedProducts = (data == null ? void 0 : data.products) ?? [];
        } catch (error) {
          log$9.error("Failed to hydrate products:", error);
          return products;
        }
      }
      const fetchedMap = /* @__PURE__ */ new Map();
      for (const product of fetchedProducts) {
        if (product.sku) {
          fetchedMap.set(product.sku, product);
        }
      }
      return products.map((original) => {
        const fetched = original.sku ? fetchedMap.get(original.sku) : void 0;
        return mergeEntityData$1(original, fetched, PRODUCT_HYDRATE_KEYS$1);
      });
    },
    hydrateCategories: async (categories) => {
      if (!categories || categories.length === 0) {
        return [];
      }
      const categoryIds = categories.map((c) => {
        const id = c.entityId ?? c.id;
        return typeof id === "string" ? parseInt(id, 10) : id;
      }).filter((id) => !!id && !isNaN(id));
      if (categoryIds.length === 0) {
        return categories;
      }
      let fetchedCategories = [];
      if (directGraphQLOptions) {
        try {
          fetchedCategories = await fetchCategoriesDirectGraphQL(categoryIds, directGraphQLOptions);
        } catch (error) {
          log$9.error("Direct GraphQL category hydration failed:", error);
          return categories;
        }
      } else {
        const graphqlToken = getGraphQLToken();
        try {
          const headers = {
            "Content-Type": "application/json"
          };
          if (graphqlToken) {
            headers["X-Storefront-Token"] = graphqlToken;
          }
          const response = await fetch(`${getEffectiveApiBaseUrl()}${categoryEndpoint}`, {
            method: "POST",
            headers,
            body: JSON.stringify({
              category_ids: categoryIds,
              website_code: config.websiteId,
              graphql_token: graphqlToken
            })
          });
          if (!response.ok) {
            log$9.error("Category hydration failed:", response.status);
            return categories;
          }
          const data = await response.json();
          fetchedCategories = (data == null ? void 0 : data.categories) ?? [];
        } catch (error) {
          log$9.error("Failed to hydrate categories:", error);
          return categories;
        }
      }
      const fetchedMap = /* @__PURE__ */ new Map();
      for (const category of fetchedCategories) {
        if (category.entityId) {
          fetchedMap.set(category.entityId, category);
        }
      }
      return categories.map((original) => {
        const id = original.entityId ?? original.id;
        const numericId = typeof id === "string" ? parseInt(id, 10) : id;
        const fetched = numericId ? fetchedMap.get(numericId) : void 0;
        return mergeEntityData$1(original, fetched, CATEGORY_HYDRATE_KEYS$1);
      });
    }
  });
  return adapter;
}
const CheckIcon$1 = () => /* @__PURE__ */ React.createElement("svg", { width: "14", height: "14", viewBox: "0 0 24 24", fill: "none", stroke: "white", strokeWidth: "3", strokeLinecap: "round", strokeLinejoin: "round" }, /* @__PURE__ */ React.createElement("polyline", { points: "20 6 9 17 4 12" }));
const DiscoveryOptionButton = memo(function DiscoveryOptionButton2({ answer, isSelected, onSelect }) {
  return /* @__PURE__ */ React.createElement(
    "button",
    {
      type: "button",
      className: `omniguide-pr-option-pill ${isSelected ? "omniguide-pr-option-pill--selected" : ""}`,
      onClick: () => onSelect(answer),
      "aria-pressed": isSelected
    },
    /* @__PURE__ */ React.createElement("div", { className: "omniguide-pr-option-pill__checkbox" }, /* @__PURE__ */ React.createElement("div", { className: `omniguide-pr-option-pill__checkbox-inner ${isSelected ? "omniguide-pr-option-pill__checkbox-inner--selected" : ""}` }, isSelected && /* @__PURE__ */ React.createElement(CheckIcon$1, null))),
    /* @__PURE__ */ React.createElement("span", { className: "omniguide-pr-option-pill__text" }, answer.text)
  );
});
const STAR_PATH_D = "M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z";
const StarIcon = ({ filled, half }) => {
  if (half) {
    return /* @__PURE__ */ React.createElement(
      "svg",
      {
        className: "omniguide-pr-star-rating__icon omniguide-pr-star-rating__icon--half",
        viewBox: "0 0 20 20",
        "aria-hidden": "true"
      },
      /* @__PURE__ */ React.createElement("path", { className: "omniguide-pr-star-rating__icon-bg", d: STAR_PATH_D }),
      /* @__PURE__ */ React.createElement("path", { className: "omniguide-pr-star-rating__icon-fill-half", d: STAR_PATH_D })
    );
  }
  const className = `omniguide-pr-star-rating__icon ${filled ? "omniguide-pr-star-rating__icon--filled" : "omniguide-pr-star-rating__icon--empty"}`;
  return /* @__PURE__ */ React.createElement(
    "svg",
    {
      className,
      viewBox: "0 0 20 20",
      fill: "currentColor",
      "aria-hidden": "true"
    },
    /* @__PURE__ */ React.createElement("path", { d: STAR_PATH_D })
  );
};
const DiscoveryStarRating = memo(function DiscoveryStarRating2({
  rating = 0,
  maxStars = 5,
  reviewCount = 0
}) {
  const stars = [];
  const normalizedRating = Math.min(Math.max(rating, 0), maxStars);
  for (let i = 1; i <= maxStars; i++) {
    if (i <= Math.floor(normalizedRating)) {
      stars.push(/* @__PURE__ */ React.createElement(StarIcon, { key: i, filled: true }));
    } else if (i === Math.ceil(normalizedRating) && normalizedRating % 1 >= 0.25) {
      stars.push(/* @__PURE__ */ React.createElement(StarIcon, { key: i, half: true }));
    } else {
      stars.push(/* @__PURE__ */ React.createElement(StarIcon, { key: i, filled: false }));
    }
  }
  const ariaLabel = `${Number(normalizedRating.toFixed(1))} out of ${maxStars} stars` + (reviewCount > 0 ? `, ${reviewCount} reviews` : "");
  return /* @__PURE__ */ React.createElement("div", { className: "omniguide-pr-star-rating", role: "img", "aria-label": ariaLabel }, stars, reviewCount > 0 && ` (${reviewCount})`);
});
const ChevronIcon = ({ isExpanded }) => /* @__PURE__ */ React.createElement(
  "svg",
  {
    width: "16",
    height: "16",
    viewBox: "0 0 20 20",
    fill: "currentColor",
    style: {
      transform: isExpanded ? "rotate(180deg)" : "rotate(0deg)",
      transition: "transform 0.2s ease"
    }
  },
  /* @__PURE__ */ React.createElement(
    "path",
    {
      fillRule: "evenodd",
      d: "M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z",
      clipRule: "evenodd"
    }
  )
);
const ReviewInsightsToggle = memo(function ReviewInsightsToggle2({
  rating = 0,
  reviewCount = 0,
  summary,
  likes,
  className,
  productName,
  productSku,
  onToggle
}) {
  const [isExpanded, setIsExpanded] = useState(false);
  const hasInsights = summary || likes && likes.length > 0;
  const handleToggle = (e) => {
    e.stopPropagation();
    const action = isExpanded ? "collapse" : "expand";
    onToggle == null ? void 0 : onToggle({ productName, productSku, action });
    setIsExpanded(!isExpanded);
  };
  return /* @__PURE__ */ React.createElement("div", { className: `omniguide-pr-review-insights ${className || ""}` }, /* @__PURE__ */ React.createElement("div", { className: "omniguide-pr-review-insights__rating-row" }, /* @__PURE__ */ React.createElement(DiscoveryStarRating, { rating, reviewCount }), hasInsights && /* @__PURE__ */ React.createElement(
    "button",
    {
      type: "button",
      onClick: handleToggle,
      className: "omniguide-pr-review-insights__chevron-btn",
      "aria-label": isExpanded ? "Hide review insights" : "Show review insights",
      "aria-expanded": isExpanded
    },
    /* @__PURE__ */ React.createElement(ChevronIcon, { isExpanded })
  )), isExpanded && hasInsights && /* @__PURE__ */ React.createElement("div", { className: "omniguide-pr-review-insights__panel" }, summary && /* @__PURE__ */ React.createElement("div", { className: "omniguide-pr-review-insights__section" }, /* @__PURE__ */ React.createElement("h5", { className: "omniguide-pr-review-insights__title" }, "Customers Say"), /* @__PURE__ */ React.createElement("p", { className: "omniguide-pr-review-insights__summary" }, summary)), likes && likes.length > 0 && /* @__PURE__ */ React.createElement("div", { className: "omniguide-pr-review-insights__section" }, /* @__PURE__ */ React.createElement("h5", { className: "omniguide-pr-review-insights__title" }, "Customers Like"), /* @__PURE__ */ React.createElement("ul", { className: "omniguide-pr-review-insights__likes-list" }, likes.map((like) => /* @__PURE__ */ React.createElement("li", { key: like, className: "omniguide-pr-review-insights__like-item" }, /* @__PURE__ */ React.createElement("span", { className: "omniguide-pr-review-insights__like-bullet" }, "•"), /* @__PURE__ */ React.createElement("span", null, like)))))));
});
function filterChoices(choices, query) {
  const trimmed = query.trim().toLowerCase();
  if (!trimmed) return choices;
  return choices.filter((choice) => choice.value.toLowerCase().includes(trimmed));
}
function choicePopularity(choice) {
  const count = choice.productCount;
  return typeof count === "number" && Number.isFinite(count) ? count : null;
}
function hasRankingSignal(choices) {
  const seen = /* @__PURE__ */ new Set();
  for (const choice of choices) {
    const count = choicePopularity(choice);
    if (count !== null) seen.add(count);
    if (seen.size > 1) return true;
  }
  return false;
}
function rankByPopularity(choices) {
  const counted = choices.filter((choice) => choicePopularity(choice) !== null);
  const uncounted = choices.filter((choice) => choicePopularity(choice) === null);
  counted.sort((a, b) => choicePopularity(b) - choicePopularity(a));
  return [...counted, ...uncounted];
}
function windowWithSelected(matches, max, selectedValue) {
  const head = matches.slice(0, max);
  if (!selectedValue || head.some((choice) => choice.value === selectedValue)) return head;
  const chosen = matches.find((choice) => choice.value === selectedValue);
  if (!chosen) return head;
  return [...head.slice(0, Math.max(0, max - 1)), chosen];
}
function SearchIcon() {
  return /* @__PURE__ */ React.createElement("svg", { viewBox: "0 0 16 16", fill: "none", stroke: "currentColor", strokeWidth: 1.6, "aria-hidden": "true" }, /* @__PURE__ */ React.createElement("circle", { cx: "7", cy: "7", r: "4.6" }), /* @__PURE__ */ React.createElement("path", { d: "M11 11l3.6 3.6", strokeLinecap: "round" }));
}
function ClearIcon() {
  return /* @__PURE__ */ React.createElement("svg", { viewBox: "0 0 14 14", fill: "none", stroke: "currentColor", strokeWidth: 1.8, strokeLinecap: "round", "aria-hidden": "true" }, /* @__PURE__ */ React.createElement("path", { d: "M3 3l8 8M11 3l-8 8" }));
}
function CheckIcon() {
  return /* @__PURE__ */ React.createElement("svg", { viewBox: "0 0 16 16", fill: "none", stroke: "currentColor", strokeWidth: 2, strokeLinecap: "round", strokeLinejoin: "round", "aria-hidden": "true" }, /* @__PURE__ */ React.createElement("path", { d: "M3.5 8.5l3 3 6-7" }));
}
function useChoiceFilter(questionId, choices, quickPicks, maxResults, selectedValue) {
  const [query, setQuery] = useState("");
  const [expanded, setExpanded] = useState(false);
  useEffect(() => {
    setQuery("");
    setExpanded(false);
  }, [questionId, choices]);
  const isFiltering = query.trim().length > 0;
  const pool = useMemo(() => {
    if (isFiltering || quickPicks.length === 0) return choices;
    const picked = new Set(quickPicks.map((choice) => choice.id));
    return choices.filter((choice) => !picked.has(choice.id));
  }, [choices, quickPicks, isFiltering]);
  const matches = useMemo(() => filterChoices(pool, query), [pool, query]);
  const shown = useMemo(
    () => expanded ? matches : windowWithSelected(matches, maxResults, selectedValue),
    [matches, expanded, maxResults, selectedValue]
  );
  return {
    query,
    onQueryChange: (next) => {
      setQuery(next);
      setExpanded(false);
    },
    isFiltering,
    matchCount: matches.length,
    shown,
    canExpand: matches.length > shown.length || expanded,
    expanded,
    onToggleExpanded: () => setExpanded((value) => !value)
  };
}
function QuickPickRow({
  picks,
  labelled,
  selectedValue,
  ariaLabel,
  onSelectChoice
}) {
  return /* @__PURE__ */ React.createElement("div", { className: "omniguide-pr-cfq__popular" }, labelled && /* @__PURE__ */ React.createElement("span", { className: "omniguide-pr-cfq__popular-label" }, "Popular"), /* @__PURE__ */ React.createElement(
    "div",
    {
      className: "omniguide-pr-questionnaire__choices omniguide-pr-cfq__choices",
      role: "group",
      "aria-label": ariaLabel
    },
    picks.map((choice) => /* @__PURE__ */ React.createElement(
      DiscoveryOptionButton,
      {
        key: choice.id,
        answer: { id: choice.id, text: choice.value },
        isSelected: selectedValue === choice.value,
        onSelect: () => onSelectChoice(choice)
      }
    ))
  ));
}
function OptionGrid({
  id,
  options,
  selectedValue,
  ariaLabel,
  onSelectChoice
}) {
  return /* @__PURE__ */ React.createElement("div", { id, className: "omniguide-pr-cfq__grid", role: "group", "aria-label": ariaLabel }, options.map((choice) => {
    const current = selectedValue === choice.value;
    return /* @__PURE__ */ React.createElement(
      "button",
      {
        key: choice.id,
        type: "button",
        className: current ? "omniguide-pr-cfq__opt omniguide-pr-cfq__opt--current" : "omniguide-pr-cfq__opt",
        "aria-pressed": current,
        onClick: () => onSelectChoice(choice)
      },
      /* @__PURE__ */ React.createElement("span", { className: "omniguide-pr-cfq__opt-name" }, choice.value),
      current && /* @__PURE__ */ React.createElement("span", { className: "omniguide-pr-cfq__opt-check", "aria-hidden": "true" }, /* @__PURE__ */ React.createElement(CheckIcon, null))
    );
  }));
}
function FilterField({
  inputId,
  resultsId,
  query,
  placeholder,
  label,
  status,
  onQueryChange
}) {
  return /* @__PURE__ */ React.createElement("div", { className: "omniguide-pr-cfq__bar" }, /* @__PURE__ */ React.createElement("div", { className: "omniguide-pr-cfq__field" }, /* @__PURE__ */ React.createElement("span", { className: "omniguide-pr-cfq__field-icon", "aria-hidden": "true" }, /* @__PURE__ */ React.createElement(SearchIcon, null)), /* @__PURE__ */ React.createElement(
    "input",
    {
      id: inputId,
      type: "text",
      className: "omniguide-pr-cfq__filter-input",
      value: query,
      onChange: (e) => onQueryChange(e.target.value),
      placeholder,
      autoComplete: "off",
      "aria-controls": resultsId,
      "aria-label": label
    }
  ), query.length > 0 && /* @__PURE__ */ React.createElement(
    "button",
    {
      type: "button",
      className: "omniguide-pr-cfq__clear",
      "aria-label": "Clear search",
      onClick: () => onQueryChange("")
    },
    /* @__PURE__ */ React.createElement(ClearIcon, null)
  )), /* @__PURE__ */ React.createElement("span", { className: "omniguide-pr-cfq__meta", "aria-live": "polite" }, status && /* @__PURE__ */ React.createElement("span", { className: "omniguide-pr-cfq__count" }, status)));
}
function InlineFilterPills({
  questionId,
  choices,
  onSelectChoice,
  selectedValue,
  topCount,
  maxResults,
  placeholder,
  filterLabel,
  ariaLabel
}) {
  const inputId = `omniguide-cfq-filter-${questionId}`;
  const resultsId = `${inputId}-results`;
  const hasHiddenChoices = choices.length > topCount;
  const ranked = useMemo(() => hasRankingSignal(choices), [choices]);
  const quickPicks = useMemo(
    () => (ranked && hasHiddenChoices ? rankByPopularity(choices) : choices).slice(0, topCount),
    [choices, ranked, hasHiddenChoices, topCount]
  );
  const filter = useChoiceFilter(questionId, choices, quickPicks, maxResults, selectedValue);
  return /* @__PURE__ */ React.createElement("div", { className: "omniguide-pr-cfq" }, /* @__PURE__ */ React.createElement(
    QuickPickRow,
    {
      picks: quickPicks,
      labelled: hasHiddenChoices && ranked,
      selectedValue,
      ariaLabel: ariaLabel ? `${ariaLabel} — quick picks` : "Quick picks",
      onSelectChoice
    }
  ), hasHiddenChoices && /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement(
    FilterField,
    {
      inputId,
      resultsId,
      query: filter.query,
      placeholder: placeholder ?? `Search ${choices.length} options…`,
      label: filterLabel,
      status: filterStatus(filter, choices.length),
      onQueryChange: filter.onQueryChange
    }
  ), filter.matchCount > 0 ? /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement(
    OptionGrid,
    {
      id: resultsId,
      options: filter.shown,
      selectedValue,
      ariaLabel: gridLabel(ariaLabel, filter.isFiltering),
      onSelectChoice
    }
  ), filter.canExpand && /* @__PURE__ */ React.createElement(
    "button",
    {
      type: "button",
      className: "omniguide-pr-cfq__more",
      onClick: filter.onToggleExpanded
    },
    filter.expanded ? "Show fewer options" : `Show all ${filter.matchCount} options`
  )) : (
    // Carries the id the filter input points at, so
    // `aria-controls` resolves in the empty state too.
    /* @__PURE__ */ React.createElement("div", { id: resultsId, className: "omniguide-pr-cfq__empty", role: "status" }, "No options match “", filter.query.trim(), "”")
  )));
}
function filterStatus(filter, total) {
  if (filter.isFiltering) return `${filter.matchCount} of ${total}`;
  return filter.expanded ? `Showing all ${filter.matchCount} options` : "";
}
function gridLabel(ariaLabel, isFiltering) {
  if (isFiltering) return ariaLabel ? `${ariaLabel} — filtered options` : "Filtered options";
  return ariaLabel ? `${ariaLabel} — more options` : "More options";
}
function SearchableDropdown({
  questionId,
  choices,
  onSelectChoice,
  selectedValue,
  placeholder,
  ariaLabel
}) {
  const restored = useMemo(
    () => selectedValue && choices.some((choice) => choice.value === selectedValue) ? selectedValue : "",
    [choices, selectedValue]
  );
  const [query, setQuery] = useState(restored);
  const [isOpen, setIsOpen] = useState(!restored);
  const [highlightedIndex, setHighlightedIndex] = useState(0);
  const listboxId = `omniguide-autocomplete-listbox-${questionId}`;
  useEffect(() => {
    setQuery(restored);
    setIsOpen(!restored);
    setHighlightedIndex(0);
  }, [questionId, restored, choices]);
  const results = useMemo(() => filterChoices(choices, query), [choices, query]);
  useEffect(() => {
    setHighlightedIndex((i) => i >= results.length ? 0 : i);
  }, [results.length]);
  const showList = isOpen && results.length > 0;
  const handleSelect = (choice) => {
    setQuery(choice.value);
    setIsOpen(false);
    onSelectChoice(choice);
  };
  const handleKeyDown = (e) => {
    if (e.key === "ArrowDown" || e.key === "ArrowUp") {
      e.preventDefault();
      if (!isOpen) {
        setIsOpen(true);
        return;
      }
      const step = e.key === "ArrowDown" ? 1 : -1;
      setHighlightedIndex((i) => Math.min(Math.max(i + step, 0), results.length - 1));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (!showList) return;
      const choice = results[highlightedIndex];
      if (choice) handleSelect(choice);
    } else if (e.key === "Escape") {
      setIsOpen(false);
    }
  };
  return /* @__PURE__ */ React.createElement("div", { className: "omniguide-pr-autocomplete omniguide-pr-autocomplete--searchable-dropdown" }, /* @__PURE__ */ React.createElement(
    "input",
    {
      type: "text",
      className: "omniguide-pr-autocomplete__input",
      value: query,
      onChange: (e) => {
        setQuery(e.target.value);
        setIsOpen(true);
        setHighlightedIndex(0);
      },
      onFocus: () => setIsOpen(true),
      onKeyDown: handleKeyDown,
      placeholder,
      role: "combobox",
      "aria-label": ariaLabel,
      "aria-expanded": showList,
      "aria-controls": listboxId,
      "aria-autocomplete": "list",
      "aria-activedescendant": showList && results[highlightedIndex] ? `${listboxId}-option-${results[highlightedIndex].id}` : void 0
    }
  ), showList && /* @__PURE__ */ React.createElement("ul", { id: listboxId, role: "listbox", className: "omniguide-pr-autocomplete__list" }, results.map((choice, index) => /* @__PURE__ */ React.createElement(
    "li",
    {
      key: choice.id,
      id: `${listboxId}-option-${choice.id}`,
      role: "option",
      "aria-selected": index === highlightedIndex,
      className: index === highlightedIndex ? "omniguide-pr-autocomplete__option omniguide-pr-autocomplete__option--highlighted" : "omniguide-pr-autocomplete__option",
      onMouseDown: (e) => e.preventDefault(),
      onClick: () => handleSelect(choice),
      onMouseEnter: () => setHighlightedIndex(index)
    },
    choice.value
  ))), isOpen && query.trim() && results.length === 0 && /* @__PURE__ */ React.createElement("div", { id: listboxId, className: "omniguide-pr-autocomplete__no-results", role: "status" }, "No matches"));
}
function DiscoveryAutocomplete({
  questionId,
  choices,
  onSelectChoice,
  selectedValue = null,
  topCount = 5,
  maxResults = 12,
  placeholder,
  filterLabel = "Or filter it down here",
  ariaLabel,
  renderHint = "autocomplete"
}) {
  if (renderHint === "searchable_dropdown") {
    return /* @__PURE__ */ React.createElement(
      SearchableDropdown,
      {
        questionId,
        choices,
        onSelectChoice,
        selectedValue,
        placeholder: placeholder ?? "Filter options…",
        ariaLabel
      }
    );
  }
  return /* @__PURE__ */ React.createElement(
    InlineFilterPills,
    {
      questionId,
      choices,
      onSelectChoice,
      selectedValue,
      topCount,
      maxResults,
      placeholder,
      filterLabel,
      ariaLabel
    }
  );
}
const ThumbsUpIcon = () => /* @__PURE__ */ React.createElement("svg", { width: "20", height: "20", viewBox: "0 0 28 28", fill: "none", xmlns: "http://www.w3.org/2000/svg", "aria-hidden": "true", focusable: "false" }, /* @__PURE__ */ React.createElement(
  "path",
  {
    d: "M8 26H5C3.89543 26 3 25.1046 3 24V15C3 13.8954 3.89543 13 5 13H8M17 11V6C17 3.79086 15.2091 2 13 2L8 13V26H21.3933C22.8612 26 24.1395 25.0042 24.499 23.5794L25.9557 17.5794C26.4454 15.6269 25.0293 13.6884 23.0267 13.5114L17 11Z",
    stroke: "currentColor",
    strokeWidth: "2",
    strokeLinecap: "round",
    strokeLinejoin: "round"
  }
));
const ThumbsDownIcon = () => /* @__PURE__ */ React.createElement("svg", { width: "20", height: "20", viewBox: "0 0 28 28", fill: "none", xmlns: "http://www.w3.org/2000/svg", "aria-hidden": "true", focusable: "false" }, /* @__PURE__ */ React.createElement(
  "path",
  {
    d: "M8 2H5C3.89543 2 3 2.89543 3 4V13C3 14.1046 3.89543 15 5 15H8M17 17V22C17 24.2091 15.2091 26 13 26L8 15V2H21.3933C22.8612 2 24.1395 2.99584 24.499 4.42059L25.9557 10.4206C26.4454 12.3731 25.0293 14.3116 23.0267 14.4886L17 17Z",
    stroke: "currentColor",
    strokeWidth: "2",
    strokeLinecap: "round",
    strokeLinejoin: "round"
  }
));
const CheckmarkIcon = () => /* @__PURE__ */ React.createElement("svg", { width: "20", height: "20", viewBox: "0 0 20 20", fill: "none", xmlns: "http://www.w3.org/2000/svg", "aria-hidden": "true", focusable: "false" }, /* @__PURE__ */ React.createElement(
  "path",
  {
    d: "M16.6667 5L7.50004 14.1667L3.33337 10",
    stroke: "currentColor",
    strokeWidth: "2",
    strokeLinecap: "round",
    strokeLinejoin: "round"
  }
));
const ErrorIcon = () => /* @__PURE__ */ React.createElement("svg", { width: "20", height: "20", viewBox: "0 0 20 20", fill: "none", xmlns: "http://www.w3.org/2000/svg", "aria-hidden": "true", focusable: "false" }, /* @__PURE__ */ React.createElement(
  "path",
  {
    d: "M10 18C14.4183 18 18 14.4183 18 10C18 5.58172 14.4183 2 10 2C5.58172 2 2 5.58172 2 10C2 14.4183 5.58172 18 10 18Z",
    stroke: "currentColor",
    strokeWidth: "2",
    strokeLinecap: "round",
    strokeLinejoin: "round"
  }
), /* @__PURE__ */ React.createElement(
  "path",
  {
    d: "M10 6V10",
    stroke: "currentColor",
    strokeWidth: "2",
    strokeLinecap: "round",
    strokeLinejoin: "round"
  }
), /* @__PURE__ */ React.createElement(
  "path",
  {
    d: "M10 14H10.01",
    stroke: "currentColor",
    strokeWidth: "2",
    strokeLinecap: "round",
    strokeLinejoin: "round"
  }
));
function DiscoveryFeedbackWidget({
  entityId,
  entityType,
  context = {},
  className = "",
  onSubmit,
  onSuccess,
  onError,
  disabled = false
}) {
  const [phase, setPhase] = useState("initial");
  const [voteDirection, setVoteDirection] = useState(null);
  const [comment, setComment] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const handleVote = (vote) => {
    if (disabled || isSubmitting) return;
    setVoteDirection(vote);
    setPhase("expanded");
    setErrorMessage("");
  };
  const handleSubmit = async () => {
    if (disabled || isSubmitting || !voteDirection) return;
    setIsSubmitting(true);
    setErrorMessage("");
    try {
      await onSubmit({
        entity_id: entityId,
        entity_type: entityType,
        vote: voteDirection,
        comment: comment.trim(),
        context
      });
      setPhase("success");
      setIsSubmitting(false);
      onSuccess == null ? void 0 : onSuccess();
      setTimeout(() => {
        setPhase("initial");
        setVoteDirection(null);
        setComment("");
      }, 3e3);
    } catch (error) {
      const err = error instanceof Error ? error : new Error("Failed to submit feedback");
      setErrorMessage(err.message || "Failed to submit feedback");
      setPhase("error");
      setIsSubmitting(false);
      onError == null ? void 0 : onError(err);
    }
  };
  const handleRetry = () => {
    setPhase("expanded");
    setErrorMessage("");
  };
  const handleCommentChange = (e) => {
    setComment(e.target.value);
  };
  if (phase === "initial") {
    return /* @__PURE__ */ React.createElement("div", { className: `omniguide-feedback ${className}`, role: "group", "aria-label": "Feedback options" }, /* @__PURE__ */ React.createElement("div", { className: "omniguide-feedback__question", id: "feedback-question" }, "Was this helpful?"), /* @__PURE__ */ React.createElement("div", { className: "omniguide-feedback__buttons", role: "group", "aria-labelledby": "feedback-question" }, /* @__PURE__ */ React.createElement(
      "button",
      {
        type: "button",
        className: "omniguide-feedback__button omniguide-feedback__button--up",
        onClick: () => handleVote(1),
        disabled,
        "aria-label": "Yes, this was helpful"
      },
      /* @__PURE__ */ React.createElement(ThumbsUpIcon, null)
    ), /* @__PURE__ */ React.createElement(
      "button",
      {
        type: "button",
        className: "omniguide-feedback__button omniguide-feedback__button--down",
        onClick: () => handleVote(-1),
        disabled,
        "aria-label": "No, this was not helpful"
      },
      /* @__PURE__ */ React.createElement(ThumbsDownIcon, null)
    )));
  }
  if (phase === "expanded") {
    return /* @__PURE__ */ React.createElement("div", { className: `omniguide-feedback omniguide-feedback--expanded ${className}` }, /* @__PURE__ */ React.createElement("div", { className: "omniguide-feedback__form" }, /* @__PURE__ */ React.createElement(
      "textarea",
      {
        className: "omniguide-feedback__textarea",
        placeholder: "Tell us why (optional)",
        value: comment,
        onChange: handleCommentChange,
        maxLength: 500,
        rows: 4,
        disabled: isSubmitting,
        "aria-label": "Feedback text input (optional)"
      }
    ), /* @__PURE__ */ React.createElement(
      "button",
      {
        type: "button",
        className: "omniguide-feedback__submit",
        onClick: handleSubmit,
        disabled: isSubmitting,
        "aria-busy": isSubmitting
      },
      isSubmitting ? "Submitting..." : "Submit Feedback"
    )));
  }
  if (phase === "success") {
    return /* @__PURE__ */ React.createElement("div", { className: `omniguide-feedback omniguide-feedback--success ${className}`, role: "alert" }, /* @__PURE__ */ React.createElement("div", { className: "omniguide-feedback__success" }, /* @__PURE__ */ React.createElement("span", { className: "omniguide-feedback__success-icon" }, /* @__PURE__ */ React.createElement(CheckmarkIcon, null)), /* @__PURE__ */ React.createElement("span", { className: "omniguide-feedback__success-text" }, "Thank you for your feedback!")));
  }
  if (phase === "error") {
    return /* @__PURE__ */ React.createElement("div", { className: `omniguide-feedback omniguide-feedback--error ${className}`, role: "alert" }, /* @__PURE__ */ React.createElement("div", { className: "omniguide-feedback__error" }, /* @__PURE__ */ React.createElement("span", { className: "omniguide-feedback__error-icon" }, /* @__PURE__ */ React.createElement(ErrorIcon, null)), /* @__PURE__ */ React.createElement("span", { className: "omniguide-feedback__error-text" }, errorMessage)), /* @__PURE__ */ React.createElement(
      "button",
      {
        type: "button",
        className: "omniguide-feedback__retry",
        onClick: handleRetry
      },
      "Try Again"
    ));
  }
  return null;
}
/*! @license DOMPurify 3.4.11 | (c) Cure53 and other contributors | Released under the Apache license 2.0 and Mozilla Public License 2.0 | github.com/cure53/DOMPurify/blob/3.4.11/LICENSE */
function _arrayLikeToArray(r, a) {
  (null == a || a > r.length) && (a = r.length);
  for (var e = 0, n = Array(a); e < a; e++) n[e] = r[e];
  return n;
}
function _arrayWithHoles(r) {
  if (Array.isArray(r)) return r;
}
function _iterableToArrayLimit(r, l) {
  var t = null == r ? null : "undefined" != typeof Symbol && r[Symbol.iterator] || r["@@iterator"];
  if (null != t) {
    var e, n, i, u, a = [], f = true, o = false;
    try {
      if (i = (t = t.call(r)).next, 0 === l) ;
      else for (; !(f = (e = i.call(t)).done) && (a.push(e.value), a.length !== l); f = true) ;
    } catch (r2) {
      o = true, n = r2;
    } finally {
      try {
        if (!f && null != t.return && (u = t.return(), Object(u) !== u)) return;
      } finally {
        if (o) throw n;
      }
    }
    return a;
  }
}
function _nonIterableRest() {
  throw new TypeError("Invalid attempt to destructure non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method.");
}
function _slicedToArray(r, e) {
  return _arrayWithHoles(r) || _iterableToArrayLimit(r, e) || _unsupportedIterableToArray(r, e) || _nonIterableRest();
}
function _unsupportedIterableToArray(r, a) {
  if (r) {
    if ("string" == typeof r) return _arrayLikeToArray(r, a);
    var t = {}.toString.call(r).slice(8, -1);
    return "Object" === t && r.constructor && (t = r.constructor.name), "Map" === t || "Set" === t ? Array.from(r) : "Arguments" === t || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(t) ? _arrayLikeToArray(r, a) : void 0;
  }
}
const entries = Object.entries, setPrototypeOf = Object.setPrototypeOf, isFrozen = Object.isFrozen, getPrototypeOf = Object.getPrototypeOf, getOwnPropertyDescriptor = Object.getOwnPropertyDescriptor;
let freeze = Object.freeze, seal = Object.seal, create = Object.create;
let _ref = typeof Reflect !== "undefined" && Reflect, apply = _ref.apply, construct = _ref.construct;
if (!freeze) {
  freeze = function freeze2(x) {
    return x;
  };
}
if (!seal) {
  seal = function seal2(x) {
    return x;
  };
}
if (!apply) {
  apply = function apply2(func, thisArg) {
    for (var _len = arguments.length, args = new Array(_len > 2 ? _len - 2 : 0), _key = 2; _key < _len; _key++) {
      args[_key - 2] = arguments[_key];
    }
    return func.apply(thisArg, args);
  };
}
if (!construct) {
  construct = function construct2(Func) {
    for (var _len2 = arguments.length, args = new Array(_len2 > 1 ? _len2 - 1 : 0), _key2 = 1; _key2 < _len2; _key2++) {
      args[_key2 - 1] = arguments[_key2];
    }
    return new Func(...args);
  };
}
const arrayForEach = unapply(Array.prototype.forEach);
const arrayLastIndexOf = unapply(Array.prototype.lastIndexOf);
const arrayPop = unapply(Array.prototype.pop);
const arrayPush = unapply(Array.prototype.push);
const arraySplice = unapply(Array.prototype.splice);
const arrayIsArray = Array.isArray;
const stringToLowerCase = unapply(String.prototype.toLowerCase);
const stringToString = unapply(String.prototype.toString);
const stringMatch = unapply(String.prototype.match);
const stringReplace = unapply(String.prototype.replace);
const stringIndexOf = unapply(String.prototype.indexOf);
const stringTrim = unapply(String.prototype.trim);
const numberToString = unapply(Number.prototype.toString);
const booleanToString = unapply(Boolean.prototype.toString);
const bigintToString = typeof BigInt === "undefined" ? null : unapply(BigInt.prototype.toString);
const symbolToString = typeof Symbol === "undefined" ? null : unapply(Symbol.prototype.toString);
const objectHasOwnProperty = unapply(Object.prototype.hasOwnProperty);
const objectToString = unapply(Object.prototype.toString);
const regExpTest = unapply(RegExp.prototype.test);
const typeErrorCreate = unconstruct(TypeError);
function unapply(func) {
  return function(thisArg) {
    if (thisArg instanceof RegExp) {
      thisArg.lastIndex = 0;
    }
    for (var _len3 = arguments.length, args = new Array(_len3 > 1 ? _len3 - 1 : 0), _key3 = 1; _key3 < _len3; _key3++) {
      args[_key3 - 1] = arguments[_key3];
    }
    return apply(func, thisArg, args);
  };
}
function unconstruct(Func) {
  return function() {
    for (var _len4 = arguments.length, args = new Array(_len4), _key4 = 0; _key4 < _len4; _key4++) {
      args[_key4] = arguments[_key4];
    }
    return construct(Func, args);
  };
}
function addToSet(set, array) {
  let transformCaseFunc = arguments.length > 2 && arguments[2] !== void 0 ? arguments[2] : stringToLowerCase;
  if (setPrototypeOf) {
    setPrototypeOf(set, null);
  }
  if (!arrayIsArray(array)) {
    return set;
  }
  let l = array.length;
  while (l--) {
    let element = array[l];
    if (typeof element === "string") {
      const lcElement = transformCaseFunc(element);
      if (lcElement !== element) {
        if (!isFrozen(array)) {
          array[l] = lcElement;
        }
        element = lcElement;
      }
    }
    set[element] = true;
  }
  return set;
}
function cleanArray(array) {
  for (let index = 0; index < array.length; index++) {
    const isPropertyExist = objectHasOwnProperty(array, index);
    if (!isPropertyExist) {
      array[index] = null;
    }
  }
  return array;
}
function clone(object) {
  const newObject = create(null);
  for (const _ref2 of entries(object)) {
    var _ref3 = _slicedToArray(_ref2, 2);
    const property = _ref3[0];
    const value = _ref3[1];
    const isPropertyExist = objectHasOwnProperty(object, property);
    if (isPropertyExist) {
      if (arrayIsArray(value)) {
        newObject[property] = cleanArray(value);
      } else if (value && typeof value === "object" && value.constructor === Object) {
        newObject[property] = clone(value);
      } else {
        newObject[property] = value;
      }
    }
  }
  return newObject;
}
function stringifyValue(value) {
  switch (typeof value) {
    case "string": {
      return value;
    }
    case "number": {
      return numberToString(value);
    }
    case "boolean": {
      return booleanToString(value);
    }
    case "bigint": {
      return bigintToString ? bigintToString(value) : "0";
    }
    case "symbol": {
      return symbolToString ? symbolToString(value) : "Symbol()";
    }
    case "undefined": {
      return objectToString(value);
    }
    case "function":
    case "object": {
      if (value === null) {
        return objectToString(value);
      }
      const valueAsRecord = value;
      const valueToString = lookupGetter(valueAsRecord, "toString");
      if (typeof valueToString === "function") {
        const stringified = valueToString(valueAsRecord);
        return typeof stringified === "string" ? stringified : objectToString(stringified);
      }
      return objectToString(value);
    }
    default: {
      return objectToString(value);
    }
  }
}
function lookupGetter(object, prop) {
  while (object !== null) {
    const desc = getOwnPropertyDescriptor(object, prop);
    if (desc) {
      if (desc.get) {
        return unapply(desc.get);
      }
      if (typeof desc.value === "function") {
        return unapply(desc.value);
      }
    }
    object = getPrototypeOf(object);
  }
  function fallbackValue() {
    return null;
  }
  return fallbackValue;
}
function isRegex(value) {
  try {
    regExpTest(value, "");
    return true;
  } catch (_unused) {
    return false;
  }
}
const html$1 = freeze(["a", "abbr", "acronym", "address", "area", "article", "aside", "audio", "b", "bdi", "bdo", "big", "blink", "blockquote", "body", "br", "button", "canvas", "caption", "center", "cite", "code", "col", "colgroup", "content", "data", "datalist", "dd", "decorator", "del", "details", "dfn", "dialog", "dir", "div", "dl", "dt", "element", "em", "fieldset", "figcaption", "figure", "font", "footer", "form", "h1", "h2", "h3", "h4", "h5", "h6", "head", "header", "hgroup", "hr", "html", "i", "img", "input", "ins", "kbd", "label", "legend", "li", "main", "map", "mark", "marquee", "menu", "menuitem", "meter", "nav", "nobr", "ol", "optgroup", "option", "output", "p", "picture", "pre", "progress", "q", "rp", "rt", "ruby", "s", "samp", "search", "section", "select", "shadow", "slot", "small", "source", "spacer", "span", "strike", "strong", "style", "sub", "summary", "sup", "table", "tbody", "td", "template", "textarea", "tfoot", "th", "thead", "time", "tr", "track", "tt", "u", "ul", "var", "video", "wbr"]);
const svg$1 = freeze(["svg", "a", "altglyph", "altglyphdef", "altglyphitem", "animatecolor", "animatemotion", "animatetransform", "circle", "clippath", "defs", "desc", "ellipse", "enterkeyhint", "exportparts", "filter", "font", "g", "glyph", "glyphref", "hkern", "image", "inputmode", "line", "lineargradient", "marker", "mask", "metadata", "mpath", "part", "path", "pattern", "polygon", "polyline", "radialgradient", "rect", "stop", "style", "switch", "symbol", "text", "textpath", "title", "tref", "tspan", "view", "vkern"]);
const svgFilters = freeze(["feBlend", "feColorMatrix", "feComponentTransfer", "feComposite", "feConvolveMatrix", "feDiffuseLighting", "feDisplacementMap", "feDistantLight", "feDropShadow", "feFlood", "feFuncA", "feFuncB", "feFuncG", "feFuncR", "feGaussianBlur", "feImage", "feMerge", "feMergeNode", "feMorphology", "feOffset", "fePointLight", "feSpecularLighting", "feSpotLight", "feTile", "feTurbulence"]);
const svgDisallowed = freeze(["animate", "color-profile", "cursor", "discard", "font-face", "font-face-format", "font-face-name", "font-face-src", "font-face-uri", "foreignobject", "hatch", "hatchpath", "mesh", "meshgradient", "meshpatch", "meshrow", "missing-glyph", "script", "set", "solidcolor", "unknown", "use"]);
const mathMl$1 = freeze(["math", "menclose", "merror", "mfenced", "mfrac", "mglyph", "mi", "mlabeledtr", "mmultiscripts", "mn", "mo", "mover", "mpadded", "mphantom", "mroot", "mrow", "ms", "mspace", "msqrt", "mstyle", "msub", "msup", "msubsup", "mtable", "mtd", "mtext", "mtr", "munder", "munderover", "mprescripts"]);
const mathMlDisallowed = freeze(["maction", "maligngroup", "malignmark", "mlongdiv", "mscarries", "mscarry", "msgroup", "mstack", "msline", "msrow", "semantics", "annotation", "annotation-xml", "mprescripts", "none"]);
const text = freeze(["#text"]);
const html = freeze(["accept", "action", "align", "alt", "autocapitalize", "autocomplete", "autopictureinpicture", "autoplay", "background", "bgcolor", "border", "capture", "cellpadding", "cellspacing", "checked", "cite", "class", "clear", "color", "cols", "colspan", "command", "commandfor", "controls", "controlslist", "coords", "crossorigin", "datetime", "decoding", "default", "dir", "disabled", "disablepictureinpicture", "disableremoteplayback", "download", "draggable", "enctype", "enterkeyhint", "exportparts", "face", "for", "headers", "height", "hidden", "high", "href", "hreflang", "id", "inert", "inputmode", "integrity", "ismap", "kind", "label", "lang", "list", "loading", "loop", "low", "max", "maxlength", "media", "method", "min", "minlength", "multiple", "muted", "name", "nonce", "noshade", "novalidate", "nowrap", "open", "optimum", "part", "pattern", "placeholder", "playsinline", "popover", "popovertarget", "popovertargetaction", "poster", "preload", "pubdate", "radiogroup", "readonly", "rel", "required", "rev", "reversed", "role", "rows", "rowspan", "spellcheck", "scope", "selected", "shape", "size", "sizes", "slot", "span", "srclang", "start", "src", "srcset", "step", "style", "summary", "tabindex", "title", "translate", "type", "usemap", "valign", "value", "width", "wrap", "xmlns"]);
const svg = freeze(["accent-height", "accumulate", "additive", "alignment-baseline", "amplitude", "ascent", "attributename", "attributetype", "azimuth", "basefrequency", "baseline-shift", "begin", "bias", "by", "class", "clip", "clippathunits", "clip-path", "clip-rule", "color", "color-interpolation", "color-interpolation-filters", "color-profile", "color-rendering", "cx", "cy", "d", "dx", "dy", "diffuseconstant", "direction", "display", "divisor", "dur", "edgemode", "elevation", "end", "exponent", "fill", "fill-opacity", "fill-rule", "filter", "filterunits", "flood-color", "flood-opacity", "font-family", "font-size", "font-size-adjust", "font-stretch", "font-style", "font-variant", "font-weight", "fx", "fy", "g1", "g2", "glyph-name", "glyphref", "gradientunits", "gradienttransform", "height", "href", "id", "image-rendering", "in", "in2", "intercept", "k", "k1", "k2", "k3", "k4", "kerning", "keypoints", "keysplines", "keytimes", "lang", "lengthadjust", "letter-spacing", "kernelmatrix", "kernelunitlength", "lighting-color", "local", "marker-end", "marker-mid", "marker-start", "markerheight", "markerunits", "markerwidth", "maskcontentunits", "maskunits", "max", "mask", "mask-type", "media", "method", "mode", "min", "name", "numoctaves", "offset", "operator", "opacity", "order", "orient", "orientation", "origin", "overflow", "paint-order", "path", "pathlength", "patterncontentunits", "patterntransform", "patternunits", "points", "preservealpha", "preserveaspectratio", "primitiveunits", "r", "rx", "ry", "radius", "refx", "refy", "repeatcount", "repeatdur", "restart", "result", "rotate", "scale", "seed", "shape-rendering", "slope", "specularconstant", "specularexponent", "spreadmethod", "startoffset", "stddeviation", "stitchtiles", "stop-color", "stop-opacity", "stroke-dasharray", "stroke-dashoffset", "stroke-linecap", "stroke-linejoin", "stroke-miterlimit", "stroke-opacity", "stroke", "stroke-width", "style", "surfacescale", "systemlanguage", "tabindex", "tablevalues", "targetx", "targety", "transform", "transform-origin", "text-anchor", "text-decoration", "text-rendering", "textlength", "type", "u1", "u2", "unicode", "values", "viewbox", "visibility", "version", "vert-adv-y", "vert-origin-x", "vert-origin-y", "width", "word-spacing", "wrap", "writing-mode", "xchannelselector", "ychannelselector", "x", "x1", "x2", "xmlns", "y", "y1", "y2", "z", "zoomandpan"]);
const mathMl = freeze(["accent", "accentunder", "align", "bevelled", "close", "columnalign", "columnlines", "columnspacing", "columnspan", "denomalign", "depth", "dir", "display", "displaystyle", "encoding", "fence", "frame", "height", "href", "id", "largeop", "length", "linethickness", "lquote", "lspace", "mathbackground", "mathcolor", "mathsize", "mathvariant", "maxsize", "minsize", "movablelimits", "notation", "numalign", "open", "rowalign", "rowlines", "rowspacing", "rowspan", "rspace", "rquote", "scriptlevel", "scriptminsize", "scriptsizemultiplier", "selection", "separator", "separators", "stretchy", "subscriptshift", "supscriptshift", "symmetric", "voffset", "width", "xmlns"]);
const xml = freeze(["xlink:href", "xml:id", "xlink:title", "xml:space", "xmlns:xlink"]);
const MUSTACHE_EXPR = seal(/{{[\w\W]*|^[\w\W]*}}/g);
const ERB_EXPR = seal(/<%[\w\W]*|^[\w\W]*%>/g);
const TMPLIT_EXPR = seal(/\${[\w\W]*/g);
const DATA_ATTR = seal(/^data-[\-\w.\u00B7-\uFFFF]+$/);
const ARIA_ATTR = seal(/^aria-[\-\w]+$/);
const IS_ALLOWED_URI = seal(
  /^(?:(?:(?:f|ht)tps?|mailto|tel|callto|sms|cid|xmpp|matrix):|[^a-z]|[a-z+.\-]+(?:[^a-z+.\-:]|$))/i
  // eslint-disable-line no-useless-escape
);
const IS_SCRIPT_OR_DATA = seal(/^(?:\w+script|data):/i);
const ATTR_WHITESPACE = seal(
  /[\u0000-\u0020\u00A0\u1680\u180E\u2000-\u2029\u205F\u3000]/g
  // eslint-disable-line no-control-regex
);
const DOCTYPE_NAME = seal(/^html$/i);
const CUSTOM_ELEMENT = seal(/^[a-z][.\w]*(-[.\w]+)+$/i);
const ELEMENT_MARKUP_PROBE = seal(/<[/\w!]/g);
const COMMENT_MARKUP_PROBE = seal(/<[/\w]/g);
const FALLBACK_TAG_CLOSE = seal(/<\/no(script|embed|frames)/i);
const SELF_CLOSING_TAG = seal(/\/>/i);
const NODE_TYPE = {
  element: 1,
  attribute: 2,
  text: 3,
  cdataSection: 4,
  entityReference: 5,
  // Deprecated
  entityNode: 6,
  // Deprecated
  processingInstruction: 7,
  comment: 8,
  document: 9,
  documentType: 10,
  documentFragment: 11,
  notation: 12
  // Deprecated
};
const getGlobal = function getGlobal2() {
  return typeof window === "undefined" ? null : window;
};
const _createTrustedTypesPolicy = function _createTrustedTypesPolicy2(trustedTypes, purifyHostElement) {
  if (typeof trustedTypes !== "object" || typeof trustedTypes.createPolicy !== "function") {
    return null;
  }
  let suffix = null;
  const ATTR_NAME = "data-tt-policy-suffix";
  if (purifyHostElement && purifyHostElement.hasAttribute(ATTR_NAME)) {
    suffix = purifyHostElement.getAttribute(ATTR_NAME);
  }
  const policyName = "dompurify" + (suffix ? "#" + suffix : "");
  try {
    return trustedTypes.createPolicy(policyName, {
      createHTML(html2) {
        return html2;
      },
      createScriptURL(scriptUrl) {
        return scriptUrl;
      }
    });
  } catch (_) {
    console.warn("TrustedTypes policy " + policyName + " could not be created.");
    return null;
  }
};
const _createHooksMap = function _createHooksMap2() {
  return {
    afterSanitizeAttributes: [],
    afterSanitizeElements: [],
    afterSanitizeShadowDOM: [],
    beforeSanitizeAttributes: [],
    beforeSanitizeElements: [],
    beforeSanitizeShadowDOM: [],
    uponSanitizeAttribute: [],
    uponSanitizeElement: [],
    uponSanitizeShadowNode: []
  };
};
const _resolveSetOption = function _resolveSetOption2(cfg, key, fallback, options) {
  return objectHasOwnProperty(cfg, key) && arrayIsArray(cfg[key]) ? addToSet(options.base ? clone(options.base) : {}, cfg[key], options.transform) : fallback;
};
function createDOMPurify() {
  let window2 = arguments.length > 0 && arguments[0] !== void 0 ? arguments[0] : getGlobal();
  const DOMPurify = (root) => createDOMPurify(root);
  DOMPurify.version = "3.4.11";
  DOMPurify.removed = [];
  if (!window2 || !window2.document || window2.document.nodeType !== NODE_TYPE.document || !window2.Element) {
    DOMPurify.isSupported = false;
    return DOMPurify;
  }
  let document2 = window2.document;
  const originalDocument = document2;
  const currentScript = originalDocument.currentScript;
  window2.DocumentFragment;
  const HTMLTemplateElement = window2.HTMLTemplateElement, Node = window2.Node, Element = window2.Element, NodeFilter = window2.NodeFilter, _window$NamedNodeMap = window2.NamedNodeMap;
  _window$NamedNodeMap === void 0 ? window2.NamedNodeMap || window2.MozNamedAttrMap : _window$NamedNodeMap;
  window2.HTMLFormElement;
  const DOMParser = window2.DOMParser, trustedTypes = window2.trustedTypes;
  const ElementPrototype = Element.prototype;
  const cloneNode = lookupGetter(ElementPrototype, "cloneNode");
  const remove = lookupGetter(ElementPrototype, "remove");
  const getNextSibling = lookupGetter(ElementPrototype, "nextSibling");
  const getChildNodes = lookupGetter(ElementPrototype, "childNodes");
  const getParentNode = lookupGetter(ElementPrototype, "parentNode");
  const getShadowRoot = lookupGetter(ElementPrototype, "shadowRoot");
  const getAttributes = lookupGetter(ElementPrototype, "attributes");
  const getNodeType = Node && Node.prototype ? lookupGetter(Node.prototype, "nodeType") : null;
  const getNodeName = Node && Node.prototype ? lookupGetter(Node.prototype, "nodeName") : null;
  if (typeof HTMLTemplateElement === "function") {
    const template = document2.createElement("template");
    if (template.content && template.content.ownerDocument) {
      document2 = template.content.ownerDocument;
    }
  }
  let trustedTypesPolicy;
  let emptyHTML = "";
  let defaultTrustedTypesPolicy;
  let defaultTrustedTypesPolicyResolved = false;
  let IN_TRUSTED_TYPES_POLICY = 0;
  const _assertNotInTrustedTypesPolicy = function _assertNotInTrustedTypesPolicy2() {
    if (IN_TRUSTED_TYPES_POLICY > 0) {
      throw typeErrorCreate('A configured TRUSTED_TYPES_POLICY callback (createHTML or createScriptURL) must not call DOMPurify.sanitize, as that causes infinite recursion. Do not pass a policy whose callbacks wrap DOMPurify as TRUSTED_TYPES_POLICY; see the "DOMPurify and Trusted Types" section of the README.');
    }
  };
  const _createTrustedHTML = function _createTrustedHTML2(html2) {
    _assertNotInTrustedTypesPolicy();
    IN_TRUSTED_TYPES_POLICY++;
    try {
      return trustedTypesPolicy.createHTML(html2);
    } finally {
      IN_TRUSTED_TYPES_POLICY--;
    }
  };
  const _createTrustedScriptURL = function _createTrustedScriptURL2(scriptUrl) {
    _assertNotInTrustedTypesPolicy();
    IN_TRUSTED_TYPES_POLICY++;
    try {
      return trustedTypesPolicy.createScriptURL(scriptUrl);
    } finally {
      IN_TRUSTED_TYPES_POLICY--;
    }
  };
  const _getDefaultTrustedTypesPolicy = function _getDefaultTrustedTypesPolicy2() {
    if (!defaultTrustedTypesPolicyResolved) {
      defaultTrustedTypesPolicy = _createTrustedTypesPolicy(trustedTypes, currentScript);
      defaultTrustedTypesPolicyResolved = true;
    }
    return defaultTrustedTypesPolicy;
  };
  const _document = document2, implementation = _document.implementation, createNodeIterator = _document.createNodeIterator, createDocumentFragment = _document.createDocumentFragment, getElementsByTagName = _document.getElementsByTagName;
  const importNode = originalDocument.importNode;
  let hooks = _createHooksMap();
  DOMPurify.isSupported = typeof entries === "function" && typeof getParentNode === "function" && implementation && implementation.createHTMLDocument !== void 0;
  const MUSTACHE_EXPR$1 = MUSTACHE_EXPR, ERB_EXPR$1 = ERB_EXPR, TMPLIT_EXPR$1 = TMPLIT_EXPR, DATA_ATTR$1 = DATA_ATTR, ARIA_ATTR$1 = ARIA_ATTR, IS_SCRIPT_OR_DATA$1 = IS_SCRIPT_OR_DATA, ATTR_WHITESPACE$1 = ATTR_WHITESPACE, CUSTOM_ELEMENT$1 = CUSTOM_ELEMENT;
  let IS_ALLOWED_URI$1 = IS_ALLOWED_URI;
  let ALLOWED_TAGS = null;
  const DEFAULT_ALLOWED_TAGS = addToSet({}, [...html$1, ...svg$1, ...svgFilters, ...mathMl$1, ...text]);
  let ALLOWED_ATTR = null;
  const DEFAULT_ALLOWED_ATTR = addToSet({}, [...html, ...svg, ...mathMl, ...xml]);
  let CUSTOM_ELEMENT_HANDLING = Object.seal(create(null, {
    tagNameCheck: {
      writable: true,
      configurable: false,
      enumerable: true,
      value: null
    },
    attributeNameCheck: {
      writable: true,
      configurable: false,
      enumerable: true,
      value: null
    },
    allowCustomizedBuiltInElements: {
      writable: true,
      configurable: false,
      enumerable: true,
      value: false
    }
  }));
  let FORBID_TAGS = null;
  let FORBID_ATTR = null;
  const EXTRA_ELEMENT_HANDLING = Object.seal(create(null, {
    tagCheck: {
      writable: true,
      configurable: false,
      enumerable: true,
      value: null
    },
    attributeCheck: {
      writable: true,
      configurable: false,
      enumerable: true,
      value: null
    }
  }));
  let ALLOW_ARIA_ATTR = true;
  let ALLOW_DATA_ATTR = true;
  let ALLOW_UNKNOWN_PROTOCOLS = false;
  let ALLOW_SELF_CLOSE_IN_ATTR = true;
  let SAFE_FOR_TEMPLATES = false;
  let SAFE_FOR_XML = true;
  let WHOLE_DOCUMENT = false;
  let SET_CONFIG = false;
  let SET_CONFIG_ALLOWED_TAGS = null;
  let SET_CONFIG_ALLOWED_ATTR = null;
  let FORCE_BODY = false;
  let RETURN_DOM = false;
  let RETURN_DOM_FRAGMENT = false;
  let RETURN_TRUSTED_TYPE = false;
  let SANITIZE_DOM = true;
  let SANITIZE_NAMED_PROPS = false;
  const SANITIZE_NAMED_PROPS_PREFIX = "user-content-";
  let KEEP_CONTENT = true;
  let IN_PLACE = false;
  let USE_PROFILES = {};
  let FORBID_CONTENTS = null;
  const DEFAULT_FORBID_CONTENTS = addToSet({}, [
    "annotation-xml",
    "audio",
    "colgroup",
    "desc",
    "foreignobject",
    "head",
    "iframe",
    "math",
    "mi",
    "mn",
    "mo",
    "ms",
    "mtext",
    "noembed",
    "noframes",
    "noscript",
    "plaintext",
    "script",
    // <selectedcontent> mirrors the selected <option>'s subtree, cloned by
    // the UA (customizable <select>) — including any on* handlers — and the
    // engine re-mirrors synchronously whenever a removal changes which
    // option/selectedcontent is current, even inside DOMPurify's inert
    // DOMParser document. Hoisting its children on removal re-inserts a fresh
    // mirror target ahead of the walk, which the engine refills, looping
    // forever (DoS) and amplifying output. Dropping its content on removal
    // (rather than hoisting) breaks that cascade; the content is a duplicate
    // of the option, which is sanitized on its own. See campaign-3 F1/F6.
    "selectedcontent",
    "style",
    "svg",
    "template",
    "thead",
    "title",
    "video",
    "xmp"
  ]);
  let DATA_URI_TAGS = null;
  const DEFAULT_DATA_URI_TAGS = addToSet({}, ["audio", "video", "img", "source", "image", "track"]);
  let URI_SAFE_ATTRIBUTES = null;
  const DEFAULT_URI_SAFE_ATTRIBUTES = addToSet({}, ["alt", "class", "for", "id", "label", "name", "pattern", "placeholder", "role", "summary", "title", "value", "style", "xmlns"]);
  const MATHML_NAMESPACE = "http://www.w3.org/1998/Math/MathML";
  const SVG_NAMESPACE = "http://www.w3.org/2000/svg";
  const HTML_NAMESPACE = "http://www.w3.org/1999/xhtml";
  let NAMESPACE = HTML_NAMESPACE;
  let IS_EMPTY_INPUT = false;
  let ALLOWED_NAMESPACES = null;
  const DEFAULT_ALLOWED_NAMESPACES = addToSet({}, [MATHML_NAMESPACE, SVG_NAMESPACE, HTML_NAMESPACE], stringToString);
  const DEFAULT_MATHML_TEXT_INTEGRATION_POINTS = freeze(["mi", "mo", "mn", "ms", "mtext"]);
  let MATHML_TEXT_INTEGRATION_POINTS = addToSet({}, DEFAULT_MATHML_TEXT_INTEGRATION_POINTS);
  const DEFAULT_HTML_INTEGRATION_POINTS = freeze(["annotation-xml"]);
  let HTML_INTEGRATION_POINTS = addToSet({}, DEFAULT_HTML_INTEGRATION_POINTS);
  const COMMON_SVG_AND_HTML_ELEMENTS = addToSet({}, ["title", "style", "font", "a", "script"]);
  let PARSER_MEDIA_TYPE = null;
  const SUPPORTED_PARSER_MEDIA_TYPES = ["application/xhtml+xml", "text/html"];
  const DEFAULT_PARSER_MEDIA_TYPE = "text/html";
  let transformCaseFunc = null;
  let CONFIG = null;
  const formElement = document2.createElement("form");
  const isRegexOrFunction = function isRegexOrFunction2(testValue) {
    return testValue instanceof RegExp || testValue instanceof Function;
  };
  const _parseConfig = function _parseConfig2() {
    let cfg = arguments.length > 0 && arguments[0] !== void 0 ? arguments[0] : {};
    if (CONFIG && CONFIG === cfg) {
      return;
    }
    if (!cfg || typeof cfg !== "object") {
      cfg = {};
    }
    cfg = clone(cfg);
    PARSER_MEDIA_TYPE = // eslint-disable-next-line unicorn/prefer-includes
    SUPPORTED_PARSER_MEDIA_TYPES.indexOf(cfg.PARSER_MEDIA_TYPE) === -1 ? DEFAULT_PARSER_MEDIA_TYPE : cfg.PARSER_MEDIA_TYPE;
    transformCaseFunc = PARSER_MEDIA_TYPE === "application/xhtml+xml" ? stringToString : stringToLowerCase;
    ALLOWED_TAGS = _resolveSetOption(cfg, "ALLOWED_TAGS", DEFAULT_ALLOWED_TAGS, {
      transform: transformCaseFunc
    });
    ALLOWED_ATTR = _resolveSetOption(cfg, "ALLOWED_ATTR", DEFAULT_ALLOWED_ATTR, {
      transform: transformCaseFunc
    });
    ALLOWED_NAMESPACES = _resolveSetOption(cfg, "ALLOWED_NAMESPACES", DEFAULT_ALLOWED_NAMESPACES, {
      transform: stringToString
    });
    URI_SAFE_ATTRIBUTES = _resolveSetOption(cfg, "ADD_URI_SAFE_ATTR", DEFAULT_URI_SAFE_ATTRIBUTES, {
      transform: transformCaseFunc,
      base: DEFAULT_URI_SAFE_ATTRIBUTES
    });
    DATA_URI_TAGS = _resolveSetOption(cfg, "ADD_DATA_URI_TAGS", DEFAULT_DATA_URI_TAGS, {
      transform: transformCaseFunc,
      base: DEFAULT_DATA_URI_TAGS
    });
    FORBID_CONTENTS = _resolveSetOption(cfg, "FORBID_CONTENTS", DEFAULT_FORBID_CONTENTS, {
      transform: transformCaseFunc
    });
    FORBID_TAGS = _resolveSetOption(cfg, "FORBID_TAGS", clone({}), {
      transform: transformCaseFunc
    });
    FORBID_ATTR = _resolveSetOption(cfg, "FORBID_ATTR", clone({}), {
      transform: transformCaseFunc
    });
    USE_PROFILES = objectHasOwnProperty(cfg, "USE_PROFILES") ? cfg.USE_PROFILES && typeof cfg.USE_PROFILES === "object" ? clone(cfg.USE_PROFILES) : cfg.USE_PROFILES : false;
    ALLOW_ARIA_ATTR = cfg.ALLOW_ARIA_ATTR !== false;
    ALLOW_DATA_ATTR = cfg.ALLOW_DATA_ATTR !== false;
    ALLOW_UNKNOWN_PROTOCOLS = cfg.ALLOW_UNKNOWN_PROTOCOLS || false;
    ALLOW_SELF_CLOSE_IN_ATTR = cfg.ALLOW_SELF_CLOSE_IN_ATTR !== false;
    SAFE_FOR_TEMPLATES = cfg.SAFE_FOR_TEMPLATES || false;
    SAFE_FOR_XML = cfg.SAFE_FOR_XML !== false;
    WHOLE_DOCUMENT = cfg.WHOLE_DOCUMENT || false;
    RETURN_DOM = cfg.RETURN_DOM || false;
    RETURN_DOM_FRAGMENT = cfg.RETURN_DOM_FRAGMENT || false;
    RETURN_TRUSTED_TYPE = cfg.RETURN_TRUSTED_TYPE || false;
    FORCE_BODY = cfg.FORCE_BODY || false;
    SANITIZE_DOM = cfg.SANITIZE_DOM !== false;
    SANITIZE_NAMED_PROPS = cfg.SANITIZE_NAMED_PROPS || false;
    KEEP_CONTENT = cfg.KEEP_CONTENT !== false;
    IN_PLACE = cfg.IN_PLACE || false;
    IS_ALLOWED_URI$1 = isRegex(cfg.ALLOWED_URI_REGEXP) ? cfg.ALLOWED_URI_REGEXP : IS_ALLOWED_URI;
    NAMESPACE = typeof cfg.NAMESPACE === "string" ? cfg.NAMESPACE : HTML_NAMESPACE;
    MATHML_TEXT_INTEGRATION_POINTS = objectHasOwnProperty(cfg, "MATHML_TEXT_INTEGRATION_POINTS") && cfg.MATHML_TEXT_INTEGRATION_POINTS && typeof cfg.MATHML_TEXT_INTEGRATION_POINTS === "object" ? clone(cfg.MATHML_TEXT_INTEGRATION_POINTS) : addToSet({}, DEFAULT_MATHML_TEXT_INTEGRATION_POINTS);
    HTML_INTEGRATION_POINTS = objectHasOwnProperty(cfg, "HTML_INTEGRATION_POINTS") && cfg.HTML_INTEGRATION_POINTS && typeof cfg.HTML_INTEGRATION_POINTS === "object" ? clone(cfg.HTML_INTEGRATION_POINTS) : addToSet({}, DEFAULT_HTML_INTEGRATION_POINTS);
    const customElementHandling = objectHasOwnProperty(cfg, "CUSTOM_ELEMENT_HANDLING") && cfg.CUSTOM_ELEMENT_HANDLING && typeof cfg.CUSTOM_ELEMENT_HANDLING === "object" ? clone(cfg.CUSTOM_ELEMENT_HANDLING) : create(null);
    CUSTOM_ELEMENT_HANDLING = create(null);
    if (objectHasOwnProperty(customElementHandling, "tagNameCheck") && isRegexOrFunction(customElementHandling.tagNameCheck)) {
      CUSTOM_ELEMENT_HANDLING.tagNameCheck = customElementHandling.tagNameCheck;
    }
    if (objectHasOwnProperty(customElementHandling, "attributeNameCheck") && isRegexOrFunction(customElementHandling.attributeNameCheck)) {
      CUSTOM_ELEMENT_HANDLING.attributeNameCheck = customElementHandling.attributeNameCheck;
    }
    if (objectHasOwnProperty(customElementHandling, "allowCustomizedBuiltInElements") && typeof customElementHandling.allowCustomizedBuiltInElements === "boolean") {
      CUSTOM_ELEMENT_HANDLING.allowCustomizedBuiltInElements = customElementHandling.allowCustomizedBuiltInElements;
    }
    seal(CUSTOM_ELEMENT_HANDLING);
    if (SAFE_FOR_TEMPLATES) {
      ALLOW_DATA_ATTR = false;
    }
    if (RETURN_DOM_FRAGMENT) {
      RETURN_DOM = true;
    }
    if (USE_PROFILES) {
      ALLOWED_TAGS = addToSet({}, text);
      ALLOWED_ATTR = create(null);
      if (USE_PROFILES.html === true) {
        addToSet(ALLOWED_TAGS, html$1);
        addToSet(ALLOWED_ATTR, html);
      }
      if (USE_PROFILES.svg === true) {
        addToSet(ALLOWED_TAGS, svg$1);
        addToSet(ALLOWED_ATTR, svg);
        addToSet(ALLOWED_ATTR, xml);
      }
      if (USE_PROFILES.svgFilters === true) {
        addToSet(ALLOWED_TAGS, svgFilters);
        addToSet(ALLOWED_ATTR, svg);
        addToSet(ALLOWED_ATTR, xml);
      }
      if (USE_PROFILES.mathMl === true) {
        addToSet(ALLOWED_TAGS, mathMl$1);
        addToSet(ALLOWED_ATTR, mathMl);
        addToSet(ALLOWED_ATTR, xml);
      }
    }
    EXTRA_ELEMENT_HANDLING.tagCheck = null;
    EXTRA_ELEMENT_HANDLING.attributeCheck = null;
    if (objectHasOwnProperty(cfg, "ADD_TAGS")) {
      if (typeof cfg.ADD_TAGS === "function") {
        EXTRA_ELEMENT_HANDLING.tagCheck = cfg.ADD_TAGS;
      } else if (arrayIsArray(cfg.ADD_TAGS)) {
        if (ALLOWED_TAGS === DEFAULT_ALLOWED_TAGS) {
          ALLOWED_TAGS = clone(ALLOWED_TAGS);
        }
        addToSet(ALLOWED_TAGS, cfg.ADD_TAGS, transformCaseFunc);
      }
    }
    if (objectHasOwnProperty(cfg, "ADD_ATTR")) {
      if (typeof cfg.ADD_ATTR === "function") {
        EXTRA_ELEMENT_HANDLING.attributeCheck = cfg.ADD_ATTR;
      } else if (arrayIsArray(cfg.ADD_ATTR)) {
        if (ALLOWED_ATTR === DEFAULT_ALLOWED_ATTR) {
          ALLOWED_ATTR = clone(ALLOWED_ATTR);
        }
        addToSet(ALLOWED_ATTR, cfg.ADD_ATTR, transformCaseFunc);
      }
    }
    if (objectHasOwnProperty(cfg, "ADD_URI_SAFE_ATTR") && arrayIsArray(cfg.ADD_URI_SAFE_ATTR)) {
      addToSet(URI_SAFE_ATTRIBUTES, cfg.ADD_URI_SAFE_ATTR, transformCaseFunc);
    }
    if (objectHasOwnProperty(cfg, "FORBID_CONTENTS") && arrayIsArray(cfg.FORBID_CONTENTS)) {
      if (FORBID_CONTENTS === DEFAULT_FORBID_CONTENTS) {
        FORBID_CONTENTS = clone(FORBID_CONTENTS);
      }
      addToSet(FORBID_CONTENTS, cfg.FORBID_CONTENTS, transformCaseFunc);
    }
    if (objectHasOwnProperty(cfg, "ADD_FORBID_CONTENTS") && arrayIsArray(cfg.ADD_FORBID_CONTENTS)) {
      if (FORBID_CONTENTS === DEFAULT_FORBID_CONTENTS) {
        FORBID_CONTENTS = clone(FORBID_CONTENTS);
      }
      addToSet(FORBID_CONTENTS, cfg.ADD_FORBID_CONTENTS, transformCaseFunc);
    }
    if (KEEP_CONTENT) {
      ALLOWED_TAGS["#text"] = true;
    }
    if (WHOLE_DOCUMENT) {
      addToSet(ALLOWED_TAGS, ["html", "head", "body"]);
    }
    if (ALLOWED_TAGS.table) {
      addToSet(ALLOWED_TAGS, ["tbody"]);
      delete FORBID_TAGS.tbody;
    }
    if (cfg.TRUSTED_TYPES_POLICY) {
      if (typeof cfg.TRUSTED_TYPES_POLICY.createHTML !== "function") {
        throw typeErrorCreate('TRUSTED_TYPES_POLICY configuration option must provide a "createHTML" hook.');
      }
      if (typeof cfg.TRUSTED_TYPES_POLICY.createScriptURL !== "function") {
        throw typeErrorCreate('TRUSTED_TYPES_POLICY configuration option must provide a "createScriptURL" hook.');
      }
      const previousTrustedTypesPolicy = trustedTypesPolicy;
      trustedTypesPolicy = cfg.TRUSTED_TYPES_POLICY;
      try {
        emptyHTML = _createTrustedHTML("");
      } catch (error) {
        trustedTypesPolicy = previousTrustedTypesPolicy;
        throw error;
      }
    } else if (cfg.TRUSTED_TYPES_POLICY === null) {
      trustedTypesPolicy = void 0;
      emptyHTML = "";
    } else {
      if (trustedTypesPolicy === void 0) {
        trustedTypesPolicy = _getDefaultTrustedTypesPolicy();
      }
      if (trustedTypesPolicy && typeof emptyHTML === "string") {
        emptyHTML = _createTrustedHTML("");
      }
    }
    if (freeze) {
      freeze(cfg);
    }
    CONFIG = cfg;
  };
  const ALL_SVG_TAGS = addToSet({}, [...svg$1, ...svgFilters, ...svgDisallowed]);
  const ALL_MATHML_TAGS = addToSet({}, [...mathMl$1, ...mathMlDisallowed]);
  const _checkSvgNamespace = function _checkSvgNamespace2(tagName, parent, parentTagName) {
    if (parent.namespaceURI === HTML_NAMESPACE) {
      return tagName === "svg";
    }
    if (parent.namespaceURI === MATHML_NAMESPACE) {
      return tagName === "svg" && (parentTagName === "annotation-xml" || MATHML_TEXT_INTEGRATION_POINTS[parentTagName]);
    }
    return Boolean(ALL_SVG_TAGS[tagName]);
  };
  const _checkMathMlNamespace = function _checkMathMlNamespace2(tagName, parent, parentTagName) {
    if (parent.namespaceURI === HTML_NAMESPACE) {
      return tagName === "math";
    }
    if (parent.namespaceURI === SVG_NAMESPACE) {
      return tagName === "math" && HTML_INTEGRATION_POINTS[parentTagName];
    }
    return Boolean(ALL_MATHML_TAGS[tagName]);
  };
  const _checkHtmlNamespace = function _checkHtmlNamespace2(tagName, parent, parentTagName) {
    if (parent.namespaceURI === SVG_NAMESPACE && !HTML_INTEGRATION_POINTS[parentTagName]) {
      return false;
    }
    if (parent.namespaceURI === MATHML_NAMESPACE && !MATHML_TEXT_INTEGRATION_POINTS[parentTagName]) {
      return false;
    }
    return !ALL_MATHML_TAGS[tagName] && (COMMON_SVG_AND_HTML_ELEMENTS[tagName] || !ALL_SVG_TAGS[tagName]);
  };
  const _checkValidNamespace = function _checkValidNamespace2(element) {
    let parent = getParentNode(element);
    if (!parent || !parent.tagName) {
      parent = {
        namespaceURI: NAMESPACE,
        tagName: "template"
      };
    }
    const tagName = stringToLowerCase(element.tagName);
    const parentTagName = stringToLowerCase(parent.tagName);
    if (!ALLOWED_NAMESPACES[element.namespaceURI]) {
      return false;
    }
    if (element.namespaceURI === SVG_NAMESPACE) {
      return _checkSvgNamespace(tagName, parent, parentTagName);
    }
    if (element.namespaceURI === MATHML_NAMESPACE) {
      return _checkMathMlNamespace(tagName, parent, parentTagName);
    }
    if (element.namespaceURI === HTML_NAMESPACE) {
      return _checkHtmlNamespace(tagName, parent, parentTagName);
    }
    if (PARSER_MEDIA_TYPE === "application/xhtml+xml" && ALLOWED_NAMESPACES[element.namespaceURI]) {
      return true;
    }
    return false;
  };
  const _forceRemove = function _forceRemove2(node) {
    arrayPush(DOMPurify.removed, {
      element: node
    });
    try {
      getParentNode(node).removeChild(node);
    } catch (_) {
      remove(node);
      if (!getParentNode(node)) {
        throw typeErrorCreate("a node selected for removal could not be detached from its tree and cannot be safely returned; refusing to sanitize in place");
      }
    }
  };
  const _neutralizeRoot = function _neutralizeRoot2(root) {
    const childNodes = getChildNodes(root);
    if (childNodes) {
      const snapshot = [];
      arrayForEach(childNodes, (child) => {
        arrayPush(snapshot, child);
      });
      arrayForEach(snapshot, (child) => {
        try {
          remove(child);
        } catch (_) {
        }
      });
    }
    const attributes = getAttributes(root);
    if (attributes) {
      for (let i = attributes.length - 1; i >= 0; --i) {
        const attribute = attributes[i];
        const name = attribute && attribute.name;
        if (typeof name === "string") {
          try {
            root.removeAttribute(name);
          } catch (_) {
          }
        }
      }
    }
  };
  const _removeAttribute = function _removeAttribute2(name, element) {
    try {
      arrayPush(DOMPurify.removed, {
        attribute: element.getAttributeNode(name),
        from: element
      });
    } catch (_) {
      arrayPush(DOMPurify.removed, {
        attribute: null,
        from: element
      });
    }
    element.removeAttribute(name);
    if (name === "is") {
      if (RETURN_DOM || RETURN_DOM_FRAGMENT) {
        try {
          _forceRemove(element);
        } catch (_) {
        }
      } else {
        try {
          element.setAttribute(name, "");
        } catch (_) {
        }
      }
    }
  };
  const _stripDisallowedAttributes = function _stripDisallowedAttributes2(element) {
    const attributes = getAttributes(element);
    if (!attributes) {
      return;
    }
    for (let i = attributes.length - 1; i >= 0; --i) {
      const attribute = attributes[i];
      const name = attribute && attribute.name;
      if (typeof name !== "string" || ALLOWED_ATTR[transformCaseFunc(name)]) {
        continue;
      }
      try {
        element.removeAttribute(name);
      } catch (_) {
      }
    }
  };
  const _neutralizeSubtree = function _neutralizeSubtree2(root) {
    const stack = [root];
    while (stack.length > 0) {
      const node = stack.pop();
      const nodeType = getNodeType ? getNodeType(node) : node.nodeType;
      if (nodeType === NODE_TYPE.element) {
        _stripDisallowedAttributes(node);
      }
      const childNodes = getChildNodes(node);
      if (childNodes) {
        for (let i = childNodes.length - 1; i >= 0; --i) {
          stack.push(childNodes[i]);
        }
      }
    }
  };
  const _initDocument = function _initDocument2(dirty) {
    let doc = null;
    let leadingWhitespace = null;
    if (FORCE_BODY) {
      dirty = "<remove></remove>" + dirty;
    } else {
      const matches = stringMatch(dirty, /^[\r\n\t ]+/);
      leadingWhitespace = matches && matches[0];
    }
    if (PARSER_MEDIA_TYPE === "application/xhtml+xml" && NAMESPACE === HTML_NAMESPACE) {
      dirty = '<html xmlns="http://www.w3.org/1999/xhtml"><head></head><body>' + dirty + "</body></html>";
    }
    const dirtyPayload = trustedTypesPolicy ? _createTrustedHTML(dirty) : dirty;
    if (NAMESPACE === HTML_NAMESPACE) {
      try {
        doc = new DOMParser().parseFromString(dirtyPayload, PARSER_MEDIA_TYPE);
      } catch (_) {
      }
    }
    if (!doc || !doc.documentElement) {
      doc = implementation.createDocument(NAMESPACE, "template", null);
      try {
        doc.documentElement.innerHTML = IS_EMPTY_INPUT ? emptyHTML : dirtyPayload;
      } catch (_) {
      }
    }
    const body = doc.body || doc.documentElement;
    if (dirty && leadingWhitespace) {
      body.insertBefore(document2.createTextNode(leadingWhitespace), body.childNodes[0] || null);
    }
    if (NAMESPACE === HTML_NAMESPACE) {
      return getElementsByTagName.call(doc, WHOLE_DOCUMENT ? "html" : "body")[0];
    }
    return WHOLE_DOCUMENT ? doc.documentElement : body;
  };
  const _createNodeIterator = function _createNodeIterator2(root) {
    return createNodeIterator.call(
      root.ownerDocument || root,
      root,
      // eslint-disable-next-line no-bitwise
      NodeFilter.SHOW_ELEMENT | NodeFilter.SHOW_COMMENT | NodeFilter.SHOW_TEXT | NodeFilter.SHOW_PROCESSING_INSTRUCTION | NodeFilter.SHOW_CDATA_SECTION,
      null
    );
  };
  const _stripTemplateExpressions = function _stripTemplateExpressions2(value) {
    value = stringReplace(value, MUSTACHE_EXPR$1, " ");
    value = stringReplace(value, ERB_EXPR$1, " ");
    value = stringReplace(value, TMPLIT_EXPR$1, " ");
    return value;
  };
  const _scrubTemplateExpressions2 = function _scrubTemplateExpressions(node) {
    var _node$querySelectorAl;
    node.normalize();
    const walker = createNodeIterator.call(
      node.ownerDocument || node,
      node,
      // eslint-disable-next-line no-bitwise
      NodeFilter.SHOW_TEXT | NodeFilter.SHOW_COMMENT | NodeFilter.SHOW_CDATA_SECTION | NodeFilter.SHOW_PROCESSING_INSTRUCTION,
      null
    );
    let currentNode = walker.nextNode();
    while (currentNode) {
      currentNode.data = _stripTemplateExpressions(currentNode.data);
      currentNode = walker.nextNode();
    }
    const templates = (_node$querySelectorAl = node.querySelectorAll) === null || _node$querySelectorAl === void 0 ? void 0 : _node$querySelectorAl.call(node, "template");
    if (templates) {
      arrayForEach(templates, (tmpl) => {
        if (_isDocumentFragment(tmpl.content)) {
          _scrubTemplateExpressions2(tmpl.content);
        }
      });
    }
  };
  const _isClobbered = function _isClobbered2(element) {
    const realTagName = getNodeName ? getNodeName(element) : null;
    if (typeof realTagName !== "string") {
      return false;
    }
    if (transformCaseFunc(realTagName) !== "form") {
      return false;
    }
    return typeof element.nodeName !== "string" || typeof element.textContent !== "string" || typeof element.removeChild !== "function" || // Realm-safe NamedNodeMap detection: equality against the cached
    // prototype getter. Clobbered .attributes (e.g. <input name="attributes">)
    // makes the direct read diverge from the cached read; a clean form
    // (same-realm OR foreign-realm) has both reads pointing at the same
    // canonical NamedNodeMap.
    element.attributes !== getAttributes(element) || typeof element.removeAttribute !== "function" || typeof element.setAttribute !== "function" || typeof element.namespaceURI !== "string" || typeof element.insertBefore !== "function" || typeof element.hasChildNodes !== "function" || // NodeType clobbering probe. Cached Node.prototype.nodeType getter
    // returns the integer 1 for any Element regardless of realm; direct
    // read on a clobbered form (e.g. <input name="nodeType">) returns
    // the named child element. Cheap addition — nodeType is read from
    // an internal slot, no serialization cost — and removes a residual
    // clobbering surface used by several mXSS / PI / comment branches
    // in _sanitizeElements that compare currentNode.nodeType directly.
    element.nodeType !== getNodeType(element) || // HTMLFormElement has [LegacyOverrideBuiltIns]: a descendant named
    // "childNodes" shadows the prototype getter. Direct reads of
    // form.childNodes from a clobbered form return the named child
    // instead of the real NodeList, so any walk that reads it directly
    // skips the form's real children. Compare the direct read to the
    // cached Node.prototype getter — when the form's named-property
    // getter intercepts the read, the two values differ and we flag
    // the form. This catches every clobbering child type (input,
    // select, etc.) regardless of whether the named child happens to
    // carry a numeric .length, which a typeof-based probe would miss
    // (e.g. HTMLSelectElement.length is a defined unsigned-long).
    element.childNodes !== getChildNodes(element);
  };
  const _isDocumentFragment = function _isDocumentFragment2(value) {
    if (!getNodeType || typeof value !== "object" || value === null) {
      return false;
    }
    try {
      return getNodeType(value) === NODE_TYPE.documentFragment;
    } catch (_) {
      return false;
    }
  };
  const _isNode = function _isNode2(value) {
    if (!getNodeType || typeof value !== "object" || value === null) {
      return false;
    }
    try {
      return typeof getNodeType(value) === "number";
    } catch (_) {
      return false;
    }
  };
  function _executeHooks(hooks2, currentNode, data) {
    if (hooks2.length === 0) {
      return;
    }
    arrayForEach(hooks2, (hook) => {
      hook.call(DOMPurify, currentNode, data, CONFIG);
    });
  }
  const _isUnsafeNode = function _isUnsafeNode2(currentNode, tagName) {
    if (SAFE_FOR_XML && currentNode.hasChildNodes() && !_isNode(currentNode.firstElementChild) && regExpTest(ELEMENT_MARKUP_PROBE, currentNode.textContent) && regExpTest(ELEMENT_MARKUP_PROBE, currentNode.innerHTML)) {
      return true;
    }
    if (SAFE_FOR_XML && currentNode.namespaceURI === HTML_NAMESPACE && tagName === "style" && _isNode(currentNode.firstElementChild)) {
      return true;
    }
    if (currentNode.nodeType === NODE_TYPE.processingInstruction) {
      return true;
    }
    if (SAFE_FOR_XML && currentNode.nodeType === NODE_TYPE.comment && regExpTest(COMMENT_MARKUP_PROBE, currentNode.data)) {
      return true;
    }
    return false;
  };
  const _sanitizeDisallowedNode = function _sanitizeDisallowedNode2(currentNode, tagName) {
    if (!FORBID_TAGS[tagName] && _isBasicCustomElement(tagName)) {
      if (CUSTOM_ELEMENT_HANDLING.tagNameCheck instanceof RegExp && regExpTest(CUSTOM_ELEMENT_HANDLING.tagNameCheck, tagName)) {
        return false;
      }
      if (CUSTOM_ELEMENT_HANDLING.tagNameCheck instanceof Function && CUSTOM_ELEMENT_HANDLING.tagNameCheck(tagName)) {
        return false;
      }
    }
    if (KEEP_CONTENT && !FORBID_CONTENTS[tagName]) {
      const parentNode = getParentNode(currentNode);
      const childNodes = getChildNodes(currentNode);
      if (childNodes && parentNode) {
        const childCount = childNodes.length;
        for (let i = childCount - 1; i >= 0; --i) {
          const hoisted = IN_PLACE ? childNodes[i] : cloneNode(childNodes[i], true);
          parentNode.insertBefore(hoisted, getNextSibling(currentNode));
        }
      }
    }
    _forceRemove(currentNode);
    return true;
  };
  const _sanitizeElements = function _sanitizeElements2(currentNode) {
    _executeHooks(hooks.beforeSanitizeElements, currentNode, null);
    if (_isClobbered(currentNode)) {
      _forceRemove(currentNode);
      return true;
    }
    const tagName = transformCaseFunc(getNodeName ? getNodeName(currentNode) : currentNode.nodeName);
    _executeHooks(hooks.uponSanitizeElement, currentNode, {
      tagName,
      allowedTags: ALLOWED_TAGS
    });
    if (_isUnsafeNode(currentNode, tagName)) {
      _forceRemove(currentNode);
      return true;
    }
    if (FORBID_TAGS[tagName] || !(EXTRA_ELEMENT_HANDLING.tagCheck instanceof Function && EXTRA_ELEMENT_HANDLING.tagCheck(tagName)) && !ALLOWED_TAGS[tagName]) {
      return _sanitizeDisallowedNode(currentNode, tagName);
    }
    const nt = getNodeType ? getNodeType(currentNode) : currentNode.nodeType;
    if (nt === NODE_TYPE.element && !_checkValidNamespace(currentNode)) {
      _forceRemove(currentNode);
      return true;
    }
    if ((tagName === "noscript" || tagName === "noembed" || tagName === "noframes") && regExpTest(FALLBACK_TAG_CLOSE, currentNode.innerHTML)) {
      _forceRemove(currentNode);
      return true;
    }
    if (SAFE_FOR_TEMPLATES && currentNode.nodeType === NODE_TYPE.text) {
      const content = _stripTemplateExpressions(currentNode.textContent);
      if (currentNode.textContent !== content) {
        arrayPush(DOMPurify.removed, {
          element: currentNode.cloneNode()
        });
        currentNode.textContent = content;
      }
    }
    _executeHooks(hooks.afterSanitizeElements, currentNode, null);
    return false;
  };
  const _isValidAttribute = function _isValidAttribute2(lcTag, lcName, value) {
    if (FORBID_ATTR[lcName]) {
      return false;
    }
    if (SANITIZE_DOM && (lcName === "id" || lcName === "name") && (value in document2 || value in formElement)) {
      return false;
    }
    const nameIsPermitted = ALLOWED_ATTR[lcName] || EXTRA_ELEMENT_HANDLING.attributeCheck instanceof Function && EXTRA_ELEMENT_HANDLING.attributeCheck(lcName, lcTag);
    if (ALLOW_DATA_ATTR && regExpTest(DATA_ATTR$1, lcName)) ;
    else if (ALLOW_ARIA_ATTR && regExpTest(ARIA_ATTR$1, lcName)) ;
    else if (!nameIsPermitted) {
      if (
        // First condition does a very basic check if a) it's basically a valid custom element tagname AND
        // b) if the tagName passes whatever the user has configured for CUSTOM_ELEMENT_HANDLING.tagNameCheck
        // and c) if the attribute name passes whatever the user has configured for CUSTOM_ELEMENT_HANDLING.attributeNameCheck
        _isBasicCustomElement(lcTag) && (CUSTOM_ELEMENT_HANDLING.tagNameCheck instanceof RegExp && regExpTest(CUSTOM_ELEMENT_HANDLING.tagNameCheck, lcTag) || CUSTOM_ELEMENT_HANDLING.tagNameCheck instanceof Function && CUSTOM_ELEMENT_HANDLING.tagNameCheck(lcTag)) && (CUSTOM_ELEMENT_HANDLING.attributeNameCheck instanceof RegExp && regExpTest(CUSTOM_ELEMENT_HANDLING.attributeNameCheck, lcName) || CUSTOM_ELEMENT_HANDLING.attributeNameCheck instanceof Function && CUSTOM_ELEMENT_HANDLING.attributeNameCheck(lcName, lcTag)) || // Alternative, second condition checks if it's an `is`-attribute, AND
        // the value passes whatever the user has configured for CUSTOM_ELEMENT_HANDLING.tagNameCheck
        lcName === "is" && CUSTOM_ELEMENT_HANDLING.allowCustomizedBuiltInElements && (CUSTOM_ELEMENT_HANDLING.tagNameCheck instanceof RegExp && regExpTest(CUSTOM_ELEMENT_HANDLING.tagNameCheck, value) || CUSTOM_ELEMENT_HANDLING.tagNameCheck instanceof Function && CUSTOM_ELEMENT_HANDLING.tagNameCheck(value))
      ) ;
      else {
        return false;
      }
    } else if (URI_SAFE_ATTRIBUTES[lcName]) ;
    else if (regExpTest(IS_ALLOWED_URI$1, stringReplace(value, ATTR_WHITESPACE$1, ""))) ;
    else if ((lcName === "src" || lcName === "xlink:href" || lcName === "href") && lcTag !== "script" && stringIndexOf(value, "data:") === 0 && DATA_URI_TAGS[lcTag]) ;
    else if (ALLOW_UNKNOWN_PROTOCOLS && !regExpTest(IS_SCRIPT_OR_DATA$1, stringReplace(value, ATTR_WHITESPACE$1, ""))) ;
    else if (value) {
      return false;
    } else ;
    return true;
  };
  const RESERVED_CUSTOM_ELEMENT_NAMES = addToSet({}, ["annotation-xml", "color-profile", "font-face", "font-face-format", "font-face-name", "font-face-src", "font-face-uri", "missing-glyph"]);
  const _isBasicCustomElement = function _isBasicCustomElement2(tagName) {
    return !RESERVED_CUSTOM_ELEMENT_NAMES[stringToLowerCase(tagName)] && regExpTest(CUSTOM_ELEMENT$1, tagName);
  };
  const _applyTrustedTypesToAttribute = function _applyTrustedTypesToAttribute2(lcTag, lcName, namespaceURI, value) {
    if (trustedTypesPolicy && typeof trustedTypes === "object" && typeof trustedTypes.getAttributeType === "function" && !namespaceURI) {
      switch (trustedTypes.getAttributeType(lcTag, lcName)) {
        case "TrustedHTML": {
          return _createTrustedHTML(value);
        }
        case "TrustedScriptURL": {
          return _createTrustedScriptURL(value);
        }
      }
    }
    return value;
  };
  const _setAttributeValue = function _setAttributeValue2(currentNode, name, namespaceURI, value) {
    try {
      if (namespaceURI) {
        currentNode.setAttributeNS(namespaceURI, name, value);
      } else {
        currentNode.setAttribute(name, value);
      }
      if (_isClobbered(currentNode)) {
        _forceRemove(currentNode);
      } else {
        arrayPop(DOMPurify.removed);
      }
    } catch (_) {
      _removeAttribute(name, currentNode);
    }
  };
  const _sanitizeAttributes = function _sanitizeAttributes2(currentNode) {
    _executeHooks(hooks.beforeSanitizeAttributes, currentNode, null);
    const attributes = currentNode.attributes;
    if (!attributes || _isClobbered(currentNode)) {
      return;
    }
    const hookEvent = {
      attrName: "",
      attrValue: "",
      keepAttr: true,
      allowedAttributes: ALLOWED_ATTR,
      forceKeepAttr: void 0
    };
    let l = attributes.length;
    const lcTag = transformCaseFunc(currentNode.nodeName);
    while (l--) {
      const attr = attributes[l];
      const name = attr.name, namespaceURI = attr.namespaceURI, attrValue = attr.value;
      const lcName = transformCaseFunc(name);
      const initValue = attrValue;
      let value = name === "value" ? initValue : stringTrim(initValue);
      hookEvent.attrName = lcName;
      hookEvent.attrValue = value;
      hookEvent.keepAttr = true;
      hookEvent.forceKeepAttr = void 0;
      _executeHooks(hooks.uponSanitizeAttribute, currentNode, hookEvent);
      value = hookEvent.attrValue;
      if (SANITIZE_NAMED_PROPS && (lcName === "id" || lcName === "name") && stringIndexOf(value, SANITIZE_NAMED_PROPS_PREFIX) !== 0) {
        _removeAttribute(name, currentNode);
        value = SANITIZE_NAMED_PROPS_PREFIX + value;
      }
      if (SAFE_FOR_XML && regExpTest(/((--!?|])>)|<\/(style|script|title|xmp|textarea|noscript|iframe|noembed|noframes)/i, value)) {
        _removeAttribute(name, currentNode);
        continue;
      }
      if (lcName === "attributename" && stringMatch(value, "href")) {
        _removeAttribute(name, currentNode);
        continue;
      }
      if (hookEvent.forceKeepAttr) {
        continue;
      }
      if (!hookEvent.keepAttr) {
        _removeAttribute(name, currentNode);
        continue;
      }
      if (!ALLOW_SELF_CLOSE_IN_ATTR && regExpTest(SELF_CLOSING_TAG, value)) {
        _removeAttribute(name, currentNode);
        continue;
      }
      if (SAFE_FOR_TEMPLATES) {
        value = _stripTemplateExpressions(value);
      }
      if (!_isValidAttribute(lcTag, lcName, value)) {
        _removeAttribute(name, currentNode);
        continue;
      }
      value = _applyTrustedTypesToAttribute(lcTag, lcName, namespaceURI, value);
      if (value !== initValue) {
        _setAttributeValue(currentNode, name, namespaceURI, value);
      }
    }
    _executeHooks(hooks.afterSanitizeAttributes, currentNode, null);
  };
  const _sanitizeShadowDOM2 = function _sanitizeShadowDOM(fragment) {
    let shadowNode = null;
    const shadowIterator = _createNodeIterator(fragment);
    _executeHooks(hooks.beforeSanitizeShadowDOM, fragment, null);
    while (shadowNode = shadowIterator.nextNode()) {
      _executeHooks(hooks.uponSanitizeShadowNode, shadowNode, null);
      _sanitizeElements(shadowNode);
      _sanitizeAttributes(shadowNode);
      if (_isDocumentFragment(shadowNode.content)) {
        _sanitizeShadowDOM2(shadowNode.content);
      }
      const shadowNodeType = getNodeType ? getNodeType(shadowNode) : shadowNode.nodeType;
      if (shadowNodeType === NODE_TYPE.element) {
        const innerSr = getShadowRoot(shadowNode);
        if (_isDocumentFragment(innerSr)) {
          _sanitizeAttachedShadowRoots(innerSr);
          _sanitizeShadowDOM2(innerSr);
        }
      }
    }
    _executeHooks(hooks.afterSanitizeShadowDOM, fragment, null);
  };
  const _sanitizeAttachedShadowRoots = function _sanitizeAttachedShadowRoots2(root) {
    const stack = [{
      node: root,
      shadow: null
    }];
    while (stack.length > 0) {
      const item = stack.pop();
      if (item.shadow) {
        _sanitizeShadowDOM2(item.shadow);
        continue;
      }
      const node = item.node;
      const nodeType = getNodeType ? getNodeType(node) : node.nodeType;
      const isElement = nodeType === NODE_TYPE.element;
      const childNodes = getChildNodes(node);
      if (childNodes) {
        for (let i = childNodes.length - 1; i >= 0; --i) {
          stack.push({
            node: childNodes[i],
            shadow: null
          });
        }
      }
      if (isElement) {
        const rootName = getNodeName ? getNodeName(node) : null;
        if (typeof rootName === "string" && transformCaseFunc(rootName) === "template") {
          const content = node.content;
          if (_isDocumentFragment(content)) {
            stack.push({
              node: content,
              shadow: null
            });
          }
        }
      }
      if (isElement) {
        const sr = getShadowRoot(node);
        if (_isDocumentFragment(sr)) {
          stack.push({
            node: null,
            shadow: sr
          }, {
            node: sr,
            shadow: null
          });
        }
      }
    }
  };
  DOMPurify.sanitize = function(dirty) {
    let cfg = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : {};
    let body = null;
    let importedNode = null;
    let currentNode = null;
    let returnNode = null;
    IS_EMPTY_INPUT = !dirty;
    if (IS_EMPTY_INPUT) {
      dirty = "<!-->";
    }
    if (typeof dirty !== "string" && !_isNode(dirty)) {
      dirty = stringifyValue(dirty);
      if (typeof dirty !== "string") {
        throw typeErrorCreate("dirty is not a string, aborting");
      }
    }
    if (!DOMPurify.isSupported) {
      return dirty;
    }
    if (SET_CONFIG) {
      ALLOWED_TAGS = SET_CONFIG_ALLOWED_TAGS;
      ALLOWED_ATTR = SET_CONFIG_ALLOWED_ATTR;
    } else {
      _parseConfig(cfg);
    }
    if (hooks.uponSanitizeElement.length > 0 || hooks.uponSanitizeAttribute.length > 0) {
      ALLOWED_TAGS = clone(ALLOWED_TAGS);
    }
    if (hooks.uponSanitizeAttribute.length > 0) {
      ALLOWED_ATTR = clone(ALLOWED_ATTR);
    }
    DOMPurify.removed = [];
    const inPlace = IN_PLACE && typeof dirty !== "string" && _isNode(dirty);
    if (inPlace) {
      const nn = getNodeName ? getNodeName(dirty) : dirty.nodeName;
      if (typeof nn === "string") {
        const tagName = transformCaseFunc(nn);
        if (!ALLOWED_TAGS[tagName] || FORBID_TAGS[tagName]) {
          throw typeErrorCreate("root node is forbidden and cannot be sanitized in-place");
        }
      }
      if (_isClobbered(dirty)) {
        throw typeErrorCreate("root node is clobbered and cannot be sanitized in-place");
      }
      try {
        _sanitizeAttachedShadowRoots(dirty);
      } catch (error) {
        _neutralizeRoot(dirty);
        throw error;
      }
    } else if (_isNode(dirty)) {
      body = _initDocument("<!---->");
      importedNode = body.ownerDocument.importNode(dirty, true);
      if (importedNode.nodeType === NODE_TYPE.element && importedNode.nodeName === "BODY") {
        body = importedNode;
      } else if (importedNode.nodeName === "HTML") {
        body = importedNode;
      } else {
        body.appendChild(importedNode);
      }
      _sanitizeAttachedShadowRoots(importedNode);
    } else {
      if (!RETURN_DOM && !SAFE_FOR_TEMPLATES && !WHOLE_DOCUMENT && // eslint-disable-next-line unicorn/prefer-includes
      dirty.indexOf("<") === -1) {
        return trustedTypesPolicy && RETURN_TRUSTED_TYPE ? _createTrustedHTML(dirty) : dirty;
      }
      body = _initDocument(dirty);
      if (!body) {
        return RETURN_DOM ? null : RETURN_TRUSTED_TYPE ? emptyHTML : "";
      }
    }
    if (body && FORCE_BODY) {
      _forceRemove(body.firstChild);
    }
    const nodeIterator = _createNodeIterator(inPlace ? dirty : body);
    try {
      while (currentNode = nodeIterator.nextNode()) {
        _sanitizeElements(currentNode);
        _sanitizeAttributes(currentNode);
        if (_isDocumentFragment(currentNode.content)) {
          _sanitizeShadowDOM2(currentNode.content);
        }
      }
    } catch (error) {
      if (inPlace) {
        _neutralizeRoot(dirty);
      }
      throw error;
    }
    if (inPlace) {
      arrayForEach(DOMPurify.removed, (entry) => {
        if (entry.element) {
          _neutralizeSubtree(entry.element);
        }
      });
      if (SAFE_FOR_TEMPLATES) {
        _scrubTemplateExpressions2(dirty);
      }
      return dirty;
    }
    if (RETURN_DOM) {
      if (SAFE_FOR_TEMPLATES) {
        _scrubTemplateExpressions2(body);
      }
      if (RETURN_DOM_FRAGMENT) {
        returnNode = createDocumentFragment.call(body.ownerDocument);
        while (body.firstChild) {
          returnNode.appendChild(body.firstChild);
        }
      } else {
        returnNode = body;
      }
      if (ALLOWED_ATTR.shadowroot || ALLOWED_ATTR.shadowrootmode) {
        returnNode = importNode.call(originalDocument, returnNode, true);
      }
      return returnNode;
    }
    let serializedHTML = WHOLE_DOCUMENT ? body.outerHTML : body.innerHTML;
    if (WHOLE_DOCUMENT && ALLOWED_TAGS["!doctype"] && body.ownerDocument && body.ownerDocument.doctype && body.ownerDocument.doctype.name && regExpTest(DOCTYPE_NAME, body.ownerDocument.doctype.name)) {
      serializedHTML = "<!DOCTYPE " + body.ownerDocument.doctype.name + ">\n" + serializedHTML;
    }
    if (SAFE_FOR_TEMPLATES) {
      serializedHTML = _stripTemplateExpressions(serializedHTML);
    }
    return trustedTypesPolicy && RETURN_TRUSTED_TYPE ? _createTrustedHTML(serializedHTML) : serializedHTML;
  };
  DOMPurify.setConfig = function() {
    let cfg = arguments.length > 0 && arguments[0] !== void 0 ? arguments[0] : {};
    _parseConfig(cfg);
    SET_CONFIG = true;
    SET_CONFIG_ALLOWED_TAGS = ALLOWED_TAGS;
    SET_CONFIG_ALLOWED_ATTR = ALLOWED_ATTR;
  };
  DOMPurify.clearConfig = function() {
    CONFIG = null;
    SET_CONFIG = false;
    SET_CONFIG_ALLOWED_TAGS = null;
    SET_CONFIG_ALLOWED_ATTR = null;
    trustedTypesPolicy = defaultTrustedTypesPolicy;
    emptyHTML = "";
  };
  DOMPurify.isValidAttribute = function(tag, attr, value) {
    if (!CONFIG) {
      _parseConfig({});
    }
    const lcTag = transformCaseFunc(tag);
    const lcName = transformCaseFunc(attr);
    return _isValidAttribute(lcTag, lcName, value);
  };
  DOMPurify.addHook = function(entryPoint, hookFunction) {
    if (typeof hookFunction !== "function") {
      return;
    }
    if (!objectHasOwnProperty(hooks, entryPoint)) {
      return;
    }
    arrayPush(hooks[entryPoint], hookFunction);
  };
  DOMPurify.removeHook = function(entryPoint, hookFunction) {
    if (!objectHasOwnProperty(hooks, entryPoint)) {
      return void 0;
    }
    if (hookFunction !== void 0) {
      const index = arrayLastIndexOf(hooks[entryPoint], hookFunction);
      return index === -1 ? void 0 : arraySplice(hooks[entryPoint], index, 1)[0];
    }
    return arrayPop(hooks[entryPoint]);
  };
  DOMPurify.removeHooks = function(entryPoint) {
    if (!objectHasOwnProperty(hooks, entryPoint)) {
      return;
    }
    hooks[entryPoint] = [];
  };
  DOMPurify.removeAllHooks = function() {
    hooks = _createHooksMap();
  };
  return DOMPurify;
}
var purify = createDOMPurify();
const DEFAULT_LINK_COLOR = "#FF4C00";
const SAFE_SKU_PATTERN = /^[\w.-]+$/;
function skuAttr(sku) {
  return sku && SAFE_SKU_PATTERN.test(sku) ? ` data-omniguide-sku="${sku}"` : "";
}
function parseMarkdown(content, options = {}) {
  if (!content) return content;
  const linkColor = options.linkColor ?? DEFAULT_LINK_COLOR;
  const shouldSanitize = options.sanitize !== false;
  const productUrls = options.productUrls ?? {};
  const productNames = options.productNames ?? {};
  const requireCorrectUrls = options.requireCorrectUrls ?? false;
  const skuByUrl = {};
  const ambiguousUrls = /* @__PURE__ */ new Set();
  for (const [sku, url] of Object.entries(productUrls)) {
    if (!url) continue;
    if (ambiguousUrls.has(url)) continue;
    if (url in skuByUrl) {
      delete skuByUrl[url];
      ambiguousUrls.add(url);
      continue;
    }
    skuByUrl[url] = String(sku);
  }
  let result = content;
  result = result.replace(/\[([^\]]+)\]\(([^)]+)\)/g, (match, linkText, originalUrl) => {
    if (originalUrl.startsWith("sku=")) {
      return match;
    }
    const skuMatch = linkText.match(/\(SKU:\s*(\d+)\)|SKU:\s*(\d+)/i);
    if (skuMatch) {
      const sku = skuMatch[1] ?? skuMatch[2] ?? "";
      const correctUrl = productUrls[String(sku)] ?? productUrls[sku];
      const cleanName = linkText.replace(/\s*\(SKU:\s*\d+\)/i, "").replace(/\s*SKU:\s*\d+/i, "").trim();
      const displayName = productNames[String(sku)] ?? productNames[sku] ?? cleanName;
      const linkStyle = `color: ${linkColor}; text-decoration: underline; font-weight: 500; cursor: pointer;`;
      const finalUrl = correctUrl ?? originalUrl;
      if (requireCorrectUrls && !correctUrl) {
        const pendingStyle = `color: ${linkColor}; font-weight: 500; opacity: 0.7;`;
        return `<span style="${pendingStyle}">${displayName}</span>`;
      }
      return `<a href="${finalUrl}"${skuAttr(sku)} style="${linkStyle}">${displayName}</a>`;
    }
    return match;
  });
  result = result.replace(/\[product\s+sku=['"]([^'"]+)['"]\]([^[]+)\[\/product\]/g, (_match, sku, productName) => {
    const productUrl = productUrls[String(sku)] ?? productUrls[sku];
    const displayName = productNames[String(sku)] ?? productNames[sku] ?? productName.trim();
    const linkStyle = `color: ${linkColor}; text-decoration: underline; font-weight: 500; cursor: pointer;`;
    if (!productUrl) {
      return displayName;
    }
    return `<a href="${productUrl}"${skuAttr(sku)} style="${linkStyle}">${displayName}</a>`;
  });
  result = result.replace(/\[([^\]]+)\]\(sku=['"]([^'"]+)['"]\)/g, (_match, productName, sku) => {
    const productUrl = productUrls[String(sku)] ?? productUrls[sku];
    const displayName = productNames[String(sku)] ?? productNames[sku] ?? productName.trim();
    const linkStyle = `color: ${linkColor}; text-decoration: underline; font-weight: 500; cursor: pointer;`;
    if (!productUrl) {
      return displayName;
    }
    return `<a href="${productUrl}"${skuAttr(sku)} style="${linkStyle}">${displayName}</a>`;
  });
  result = result.replace(/\[(.+?)\s+SKU:\s*(\d+)\]/g, (_match, productName, sku) => {
    const productUrl = productUrls[String(sku)] ?? productUrls[sku];
    const displayName = productNames[String(sku)] ?? productNames[sku] ?? productName.trim();
    const linkStyle = `color: ${linkColor}; text-decoration: underline; font-weight: 500; cursor: pointer;`;
    if (!productUrl) {
      return displayName;
    }
    return `<a href="${productUrl}"${skuAttr(sku)} style="${linkStyle}">${displayName}</a>`;
  });
  result = result.replace(/\[product[^\]]*\]([^[]*)\[\/product\]/gi, "$1");
  result = result.replace(/\[([^\]]+)\]\((?!sku=)([^)]+)\)/g, (_match, text2, url) => {
    const invalidPathPattern = /^\/(URL|url|undefined|null|#|about:)/i;
    if (invalidPathPattern.test(url)) {
      return `<strong>${text2}</strong>`;
    }
    const linkStyle = `color: ${linkColor}; text-decoration: underline;`;
    return `<a href="${url}"${skuAttr(skuByUrl[url])} style="${linkStyle}">${text2}</a>`;
  });
  result = result.replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");
  result = result.replace(/__([^_]+)__/g, "<strong>$1</strong>");
  result = result.replace(/`([^`]+)`/g, '<code style="background: #f0f0f0; padding: 2px 6px; border-radius: 4px; font-family: monospace;">$1</code>');
  const UL_STYLE = "margin: 8px 0; padding-left: 20px;";
  const OL_STYLE = "margin: 8px 0; padding-left: 24px;";
  const lines = result.split("\n");
  const blocks = [];
  let root = null;
  let sub = null;
  let paraBuf = [];
  const renderList = (list) => {
    const style = list.tag === "ul" ? UL_STYLE : OL_STYLE;
    const items = list.items.map((it) => `<li>${it}</li>`).join("");
    return `<${list.tag} style="${style}">${items}</${list.tag}>`;
  };
  const flushSub = () => {
    if (!sub || !root || root.items.length === 0) {
      sub = null;
      return;
    }
    const lastIdx = root.items.length - 1;
    root.items[lastIdx] = root.items[lastIdx] + renderList(sub);
    sub = null;
  };
  const flushRoot = () => {
    flushSub();
    if (!root) return;
    blocks.push(renderList(root));
    root = null;
  };
  const flushPara = () => {
    if (paraBuf.length === 0) return;
    blocks.push(`<p>${paraBuf.join("<br>")}</p>`);
    paraBuf = [];
  };
  const appendItem = (tag, content2) => {
    if (!root) {
      root = { tag, items: [content2] };
      return;
    }
    if (sub) {
      if (sub.tag === tag) {
        sub.items.push(content2);
      } else {
        flushSub();
        root.items.push(content2);
      }
      return;
    }
    if (root.tag === tag) {
      root.items.push(content2);
    } else {
      sub = { tag, items: [content2] };
    }
  };
  for (const rawLine of lines) {
    const ulMatch = rawLine.match(/^\s*[-*]\s+(.+)$/);
    const olMatch = rawLine.match(/^\s*\d+\.\s+(.+)$/);
    const isBlank = rawLine.trim() === "";
    if (ulMatch) {
      flushPara();
      appendItem("ul", ulMatch[1]);
    } else if (olMatch) {
      flushPara();
      appendItem("ol", olMatch[1]);
    } else if (isBlank) {
      flushPara();
    } else {
      flushRoot();
      paraBuf.push(rawLine);
    }
  }
  flushPara();
  flushRoot();
  result = blocks.join("");
  result = result.replace(new RegExp("(?<!\\w)\\*([^*]+)\\*(?!\\w)", "g"), "<em>$1</em>");
  result = result.replace(new RegExp("(?<!\\w)_([^_]+)_(?!\\w)", "g"), "<em>$1</em>");
  if (shouldSanitize) {
    result = purify.sanitize(result, {
      ALLOWED_TAGS: ["p", "br", "strong", "em", "u", "a", "ul", "ol", "li", "code"],
      ALLOWED_ATTR: ["href", "target", "rel", "style", "data-omniguide-sku"]
    });
  }
  return result;
}
function parseMarkdownToHtml(content, options = {}) {
  const html2 = parseMarkdown(content, options);
  return { __html: html2 || "" };
}
const BANNER_ID = "omniguide-preview-banner";
function PreviewBanner() {
  const [dismissed, setDismissed] = useState(false);
  const bannerRef = useRef(null);
  const previewUrl = getPreviewApiUrl();
  let displayHost = previewUrl ?? "";
  try {
    displayHost = new URL(previewUrl).hostname;
  } catch {
  }
  const isDuplicate = typeof document !== "undefined" && document.getElementById(BANNER_ID) !== null && document.getElementById(BANNER_ID) !== bannerRef.current;
  useLayoutEffect(() => {
    if (dismissed || isDuplicate || !bannerRef.current) {
      document.body.style.paddingTop = "";
      return;
    }
    const height = bannerRef.current.getBoundingClientRect().height;
    document.body.style.paddingTop = `${height}px`;
    return () => {
      document.body.style.paddingTop = "";
    };
  }, [dismissed, isDuplicate]);
  if (dismissed || isDuplicate) return null;
  const handleDeactivate = () => {
    clearPreviewApiUrl();
    window.location.reload();
  };
  const handleDismiss = () => {
    setDismissed(true);
  };
  return /* @__PURE__ */ React.createElement(
    "div",
    {
      id: BANNER_ID,
      ref: bannerRef,
      style: {
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        zIndex: 99999,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: "10px",
        padding: "8px 40px 8px 16px",
        backgroundColor: "#f59e0b",
        color: "#000",
        fontSize: "13px",
        fontFamily: "system-ui, -apple-system, sans-serif",
        fontWeight: 600,
        boxShadow: "0 2px 8px rgba(0,0,0,0.15)"
      }
    },
    /* @__PURE__ */ React.createElement("span", null, "PREVIEW MODE: ", displayHost),
    /* @__PURE__ */ React.createElement(
      "button",
      {
        onClick: handleDeactivate,
        style: {
          padding: "3px 10px",
          fontSize: "12px",
          fontWeight: 600,
          backgroundColor: "#000",
          color: "#f59e0b",
          border: "none",
          borderRadius: "4px",
          cursor: "pointer"
        }
      },
      "Deactivate"
    ),
    /* @__PURE__ */ React.createElement(
      "button",
      {
        onClick: handleDismiss,
        "aria-label": "Dismiss preview banner",
        style: {
          position: "absolute",
          right: "10px",
          top: "50%",
          transform: "translateY(-50%)",
          padding: "0",
          width: "20px",
          height: "20px",
          lineHeight: "20px",
          fontSize: "16px",
          fontWeight: 700,
          backgroundColor: "transparent",
          color: "#000",
          border: "none",
          cursor: "pointer",
          opacity: 0.6
        }
      },
      "✕"
    )
  );
}
const defaultContextValue = {
  config: {
    websiteId: "",
    apiBaseUrl: "",
    aiSearchStoreUrl: "",
    features: {
      search: false,
      productFit: false,
      categoryGuide: false,
      discoveryQuestions: false
    }
  },
  platformAdapter: NullPlatformAdapter,
  storageAdapter: new LocalStorageAdapter(),
  isInitialized: false,
  components: {}
};
const OmniguideContext = createContext(defaultContextValue);
function useOmniguideContext() {
  const context = useContext(OmniguideContext);
  if (!context.isInitialized) {
    logger.warn("useOmniguideContext called outside of OmniguideProvider or provider not initialized");
  }
  return context;
}
function OmniguideProvider({
  config,
  platformAdapter,
  storageAdapter,
  components,
  children
}) {
  const contextValue = useMemo(() => {
    var _a, _b, _c, _d;
    capturePageContext();
    const previewUrl = getPreviewApiUrl();
    const effectiveConfig = previewUrl ? { ...config, apiBaseUrl: previewUrl } : config;
    const adapter = platformAdapter ?? NullPlatformAdapter;
    const storage = storageAdapter ?? new LocalStorageAdapter();
    if (platformAdapter) {
      platformRegistry.register(platformAdapter);
    }
    const consentService = effectiveConfig.apiBaseUrl ? createConsentService({
      apiBaseUrl: effectiveConfig.apiBaseUrl,
      reader: (_a = effectiveConfig.consent) == null ? void 0 : _a.reader,
      cookieName: (_b = effectiveConfig.consent) == null ? void 0 : _b.cookieName,
      magentoCookieName: (_c = effectiveConfig.consent) == null ? void 0 : _c.magentoCookieName,
      magentoWebsiteId: (_d = effectiveConfig.consent) == null ? void 0 : _d.magentoWebsiteId
    }) : void 0;
    const eventService = consentService && effectiveConfig.apiBaseUrl ? createEventService({
      apiBaseUrl: effectiveConfig.apiBaseUrl,
      consentService,
      websiteId: effectiveConfig.websiteId
    }) : void 0;
    if (eventService) {
      registerEventService(eventService);
    }
    if (consentService) {
      registerConsentService(consentService);
    }
    const feedbackApi = effectiveConfig.apiBaseUrl ? createFeedbackAPI({
      apiBaseUrl: effectiveConfig.apiBaseUrl,
      websiteCode: effectiveConfig.websiteId,
      getSessionId: () => {
        var _a2;
        return getSessionId(effectiveConfig.websiteId) ?? storage.getItem(((_a2 = effectiveConfig.storageKeys) == null ? void 0 : _a2.sessionId) ?? "aiSearchSessionId");
      }
    }) : void 0;
    return {
      config: effectiveConfig,
      platformAdapter: adapter,
      storageAdapter: storage,
      isInitialized: true,
      feedbackApi,
      consentService,
      eventService,
      components: components ?? {}
    };
  }, [config, platformAdapter, storageAdapter, components]);
  const showPreviewBanner = isPreviewMode();
  return /* @__PURE__ */ React.createElement(OmniguideContext.Provider, { value: contextValue }, showPreviewBanner && /* @__PURE__ */ React.createElement(PreviewBanner, null), children);
}
function useComponent(key, DefaultComponent) {
  const { components } = useOmniguideContext();
  return components[key] ?? DefaultComponent;
}
const SearchCheckIcon = () => /* @__PURE__ */ React.createElement("svg", { width: "14", height: "14", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "3", strokeLinecap: "round", strokeLinejoin: "round" }, /* @__PURE__ */ React.createElement("polyline", { points: "20 6 9 17 4 12" }));
const SearchChevronDownIcon = ({ expanded }) => /* @__PURE__ */ React.createElement(
  "svg",
  {
    width: "14",
    height: "14",
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: "2",
    strokeLinecap: "round",
    strokeLinejoin: "round",
    className: `omniguide-privacy__caret ${expanded ? "omniguide-privacy__caret--expanded" : ""}`,
    "aria-hidden": "true",
    focusable: "false"
  },
  /* @__PURE__ */ React.createElement("polyline", { points: "6 9 12 15 18 9" })
);
const SearchMagnifierIcon = () => /* @__PURE__ */ React.createElement("svg", { viewBox: "0 0 20 20", width: "18", height: "18", fill: "none", stroke: "currentColor", strokeWidth: "1.8", strokeLinecap: "round", "aria-hidden": "true", focusable: "false" }, /* @__PURE__ */ React.createElement("circle", { cx: "9", cy: "9", r: "6.4" }), /* @__PURE__ */ React.createElement("path", { d: "M14 14l4 4" }));
const SearchSparkIcon = () => /* @__PURE__ */ React.createElement("svg", { viewBox: "0 0 16 16", width: "14", height: "14", fill: "currentColor", "aria-hidden": "true", focusable: "false" }, /* @__PURE__ */ React.createElement("path", { d: "M8 0l1.6 5.4L15 7l-5.4 1.6L8 14l-1.6-5.4L1 7l5.4-1.6z" }));
const SearchArrowIcon = () => /* @__PURE__ */ React.createElement("svg", { viewBox: "0 0 14 14", width: "13", height: "13", fill: "none", stroke: "currentColor", strokeWidth: "1.9", strokeLinecap: "round", strokeLinejoin: "round", "aria-hidden": "true", focusable: "false" }, /* @__PURE__ */ React.createElement("path", { d: "M3 7h8M7.5 3.5L11 7l-3.5 3.5" }));
const SearchCollapseToggleIcon = ({ isCollapsed }) => /* @__PURE__ */ React.createElement(
  "svg",
  {
    width: "20",
    height: "20",
    viewBox: "0 0 20 20",
    fill: "currentColor",
    style: { transform: isCollapsed ? "rotate(180deg)" : "rotate(0deg)", transition: "transform 0.2s ease" },
    "aria-hidden": "true",
    focusable: "false"
  },
  /* @__PURE__ */ React.createElement("path", { fillRule: "evenodd", d: "M14.707 12.707a1 1 0 01-1.414 0L10 9.414l-3.293 3.293a1 1 0 01-1.414-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 010 1.414z", clipRule: "evenodd" })
);
const SearchThinkingIndicator = () => /* @__PURE__ */ React.createElement(
  "div",
  {
    className: "omniguide-qa",
    role: "status",
    "aria-live": "polite",
    "aria-label": "Loading response, please wait"
  },
  /* @__PURE__ */ React.createElement("div", { className: "omniguide-thinking-dots", "aria-hidden": "true" }, /* @__PURE__ */ React.createElement("span", { className: "omniguide-thinking-dots__dot" }), /* @__PURE__ */ React.createElement("span", { className: "omniguide-thinking-dots__dot" }), /* @__PURE__ */ React.createElement("span", { className: "omniguide-thinking-dots__dot" })),
  /* @__PURE__ */ React.createElement("span", { className: "sr-only" }, "Loading response...")
);
const statusConfig = {
  thinking: {
    texts: [
      "Analyzing your question...",
      "Understanding your needs...",
      "Processing your request..."
    ]
  },
  searching: {
    texts: [
      "Searching products...",
      "Exploring our catalog...",
      "Finding relevant options..."
    ]
  },
  generating: {
    texts: [
      "Writing response...",
      "Crafting your answer...",
      "Preparing recommendations..."
    ]
  },
  product_recommendation: {
    texts: [
      "And now, describing that perfect product...",
      "Highlighting key features...",
      "Explaining why this fits..."
    ]
  },
  selecting_products: {
    texts: [
      "Finding the right product...",
      "Evaluating options...",
      "Comparing features..."
    ]
  },
  finalizing: {
    texts: [
      "Finalizing...",
      "Wrapping up...",
      "Almost done..."
    ]
  },
  awaiting_clarification: {
    texts: [
      "Waiting for your response...",
      "Ready for your input...",
      "Standing by..."
    ]
  },
  error: {
    texts: [
      "An error occurred",
      "Something went wrong",
      "Unable to complete"
    ]
  }
};
const SearchPipelineStatusIndicator = ({ status }) => {
  const [variationIndex, setVariationIndex] = useState(0);
  const statusStartTimeRef = useRef(null);
  const currentStatusRef = useRef(null);
  useEffect(() => {
    if (currentStatusRef.current !== status) {
      currentStatusRef.current = status;
      statusStartTimeRef.current = Date.now();
      setVariationIndex(0);
    }
  }, [status]);
  useEffect(() => {
    if (!status) return;
    const config2 = statusConfig[status];
    if (!config2 || config2.texts.length <= 1) return;
    const interval = setInterval(() => {
      setVariationIndex((prev) => (prev + 1) % config2.texts.length);
    }, 2e3);
    return () => clearInterval(interval);
  }, [status]);
  if (!status || status === "idle" || status === "done") return null;
  const config = statusConfig[status] || { texts: ["Processing..."] };
  const currentText = config.texts[variationIndex] || config.texts[0];
  return /* @__PURE__ */ React.createElement(
    "div",
    {
      className: "omniguide-pipeline-status",
      role: "status",
      "aria-live": "polite",
      "aria-atomic": "true",
      "aria-label": currentText
    },
    /* @__PURE__ */ React.createElement("span", { className: "omniguide-pipeline-status__text" }, currentText)
  );
};
const QUESTION_WORDS = ["what", "which", "how", "why", "can", "does", "do", "is", "are", "should", "when", "where", "who", "will", "whats", "what's"];
const ADVISORY_RE = /\b(best|vs|versus|difference|compare|recommend|help me|better|ideal|suitable|which|good for)\b/;
function detectQuestion(raw) {
  const s = (raw || "").trim().toLowerCase();
  if (!s) return false;
  if (s.endsWith("?")) return true;
  const words = s.split(/\s+/);
  if (QUESTION_WORDS.includes(words[0] ?? "")) return true;
  if (ADVISORY_RE.test(s)) return true;
  return words.length >= 6;
}
const SearchQueryRow = ({ text: text2, onClick }) => {
  const isQuestion = detectQuestion(text2);
  const handleKeyDown = (e) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      onClick();
    }
  };
  return /* @__PURE__ */ React.createElement(
    "button",
    {
      type: "button",
      onClick,
      onKeyDown: handleKeyDown,
      className: `omniguide-query-row ${isQuestion ? "omniguide-query-row--question" : ""}`,
      "aria-label": isQuestion ? `Ask: ${text2}` : `Search: ${text2}`
    },
    /* @__PURE__ */ React.createElement("span", { className: "omniguide-query-row__icon", "aria-hidden": "true" }, isQuestion ? /* @__PURE__ */ React.createElement(SearchSparkIcon, null) : /* @__PURE__ */ React.createElement(SearchMagnifierIcon, null)),
    /* @__PURE__ */ React.createElement("span", { className: "omniguide-query-row__text" }, text2),
    isQuestion && /* @__PURE__ */ React.createElement("span", { className: "omniguide-query-row__tag" }, "Ask"),
    /* @__PURE__ */ React.createElement("span", { className: "omniguide-query-row__arrow", "aria-hidden": "true" }, /* @__PURE__ */ React.createElement(SearchArrowIcon, null))
  );
};
const SearchGradientChip = ({ text: text2, onClick, isSelected = false }) => {
  const [isHovered, setIsHovered] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const handleKeyDown = (e) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      onClick();
    }
  };
  return /* @__PURE__ */ React.createElement(
    "button",
    {
      onClick,
      onKeyDown: handleKeyDown,
      onMouseEnter: () => setIsHovered(true),
      onMouseLeave: () => setIsHovered(false),
      onFocus: () => setIsFocused(true),
      onBlur: () => setIsFocused(false),
      className: "omniguide-chip--gradient",
      "data-hovered": isHovered,
      "data-selected": isSelected,
      "data-focused": isFocused,
      "aria-label": `Ask: ${text2}`,
      "aria-pressed": isSelected
    },
    /* @__PURE__ */ React.createElement("span", { className: `omniguide-chip__inner ${isSelected ? "omniguide-chip__inner--selected" : ""}` }, isSelected && /* @__PURE__ */ React.createElement(SearchCheckIcon, null), text2)
  );
};
const SearchCategoryChip = ({ text: text2, onClick, isSelected = false }) => {
  const [isHovered, setIsHovered] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const handleKeyDown = (e) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      onClick();
    }
  };
  return /* @__PURE__ */ React.createElement(
    "button",
    {
      onClick,
      onKeyDown: handleKeyDown,
      onMouseEnter: () => setIsHovered(true),
      onMouseLeave: () => setIsHovered(false),
      onFocus: () => setIsFocused(true),
      onBlur: () => setIsFocused(false),
      className: "omniguide-chip--category",
      "data-hovered": isHovered,
      "data-selected": isSelected,
      "data-focused": isFocused,
      "aria-label": `Ask: ${text2}`,
      "aria-pressed": isSelected
    },
    isSelected && /* @__PURE__ */ React.createElement(SearchCheckIcon, null),
    text2
  );
};
const SearchSuggestionChips = ({
  suggestions,
  onSuggestionClick,
  selectedSuggestions = [],
  variant = "search"
}) => {
  if (!suggestions || suggestions.length === 0) return null;
  const ChipComponent = variant === "category" ? SearchCategoryChip : SearchGradientChip;
  return /* @__PURE__ */ React.createElement(
    "div",
    {
      className: "omniguide-chips",
      role: "group",
      "aria-label": "Suggested questions"
    },
    suggestions.map((suggestion) => /* @__PURE__ */ React.createElement(
      ChipComponent,
      {
        key: suggestion,
        text: suggestion,
        onClick: () => onSuggestionClick(suggestion),
        isSelected: selectedSuggestions.includes(suggestion)
      }
    ))
  );
};
const SearchNavigationButtons = memo(({
  canGoUp,
  canGoDown,
  onNavigateUp,
  onNavigateDown,
  currentIndex,
  totalCount,
  timestamp,
  isMobile = false
}) => {
  if (totalCount <= 1) return null;
  const formattedTime = timestamp ? new Date(timestamp).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit"
  }) : "";
  const handleNavKeyDown = (e, direction) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      e.stopPropagation();
      if (direction === "up") {
        onNavigateUp(e);
      } else if (direction === "down") {
        onNavigateDown(e);
      }
    }
  };
  const handleUpClick = (e) => {
    e.stopPropagation();
    e.preventDefault();
    onNavigateUp(e);
  };
  const handleDownClick = (e) => {
    e.stopPropagation();
    e.preventDefault();
    onNavigateDown(e);
  };
  if (isMobile) {
    return /* @__PURE__ */ React.createElement(
      "nav",
      {
        className: "omniguide-chat__navigation omniguide-chat__navigation--mobile",
        role: "navigation",
        "aria-label": "Message navigation"
      },
      /* @__PURE__ */ React.createElement("div", { className: "omniguide-chat__nav-buttons", role: "group", "aria-label": "Navigate between messages" }, /* @__PURE__ */ React.createElement(
        "button",
        {
          type: "button",
          onClick: handleUpClick,
          className: "omniguide-chat__nav-btn",
          "data-disabled": !canGoUp,
          "aria-disabled": !canGoUp,
          "aria-label": `Previous message (${currentIndex} of ${totalCount})`
        },
        /* @__PURE__ */ React.createElement("svg", { width: "20", height: "20", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", "aria-hidden": "true", focusable: "false" }, /* @__PURE__ */ React.createElement("polyline", { points: "18 15 12 9 6 15" }))
      ), /* @__PURE__ */ React.createElement("span", { className: "omniguide-chat__nav-indicator", "aria-live": "polite" }, currentIndex + 1, " / ", totalCount), /* @__PURE__ */ React.createElement(
        "button",
        {
          type: "button",
          onClick: handleDownClick,
          className: "omniguide-chat__nav-btn",
          "data-disabled": !canGoDown,
          "aria-disabled": !canGoDown,
          "aria-label": `Next message (${currentIndex + 2} of ${totalCount})`
        },
        /* @__PURE__ */ React.createElement("svg", { width: "20", height: "20", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", "aria-hidden": "true", focusable: "false" }, /* @__PURE__ */ React.createElement("polyline", { points: "6 9 12 15 18 9" }))
      ))
    );
  }
  return /* @__PURE__ */ React.createElement(
    "nav",
    {
      className: "omniguide-chat__navigation",
      role: "navigation",
      "aria-label": "Message navigation"
    },
    /* @__PURE__ */ React.createElement("div", { className: "omniguide-chat__nav-buttons", role: "group", "aria-label": "Navigate between messages" }, /* @__PURE__ */ React.createElement(
      "button",
      {
        type: "button",
        onClick: handleUpClick,
        onKeyDown: (e) => handleNavKeyDown(e, "up"),
        className: "omniguide-chat__nav-btn",
        "data-disabled": !canGoUp,
        "aria-disabled": !canGoUp,
        "aria-label": `Previous message (${currentIndex} of ${totalCount})`
      },
      /* @__PURE__ */ React.createElement("svg", { width: "20", height: "20", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", "aria-hidden": "true", focusable: "false" }, /* @__PURE__ */ React.createElement("polyline", { points: "18 15 12 9 6 15" }))
    ), /* @__PURE__ */ React.createElement(
      "button",
      {
        type: "button",
        onClick: handleDownClick,
        onKeyDown: (e) => handleNavKeyDown(e, "down"),
        className: "omniguide-chat__nav-btn",
        "data-disabled": !canGoDown,
        "aria-disabled": !canGoDown,
        "aria-label": `Next message (${currentIndex + 2} of ${totalCount})`
      },
      /* @__PURE__ */ React.createElement("svg", { width: "20", height: "20", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", "aria-hidden": "true", focusable: "false" }, /* @__PURE__ */ React.createElement("polyline", { points: "6 9 12 15 18 9" }))
    )),
    formattedTime && /* @__PURE__ */ React.createElement("div", { className: "omniguide-chat__nav-timestamp", "aria-live": "polite" }, formattedTime)
  );
});
const UNSELECTED$1 = Symbol("unselected");
const SearchIntentQuestionUI = ({
  intentQuestion,
  onAnswerClick,
  onCustomAnswer,
  variant = "search"
}) => {
  var _a, _b;
  const [customInput, setCustomInput] = useState("");
  const [selectedAnswerId, setSelectedAnswerId] = useState(UNSELECTED$1);
  const [showOtherInput, setShowOtherInput] = useState(false);
  const [hoveredId, setHoveredId] = useState(UNSELECTED$1);
  if (!intentQuestion) return null;
  const isDiscoveryQuestion = intentQuestion._isDiscoveryQuestion;
  const hasOtherOption = (_a = intentQuestion.answers) == null ? void 0 : _a.some((a) => a.is_other_option);
  const isGuide = variant === "search";
  const questionText = intentQuestion.question_text || intentQuestion.question;
  const renderHint = intentQuestion.answer_render_hint ?? "choice";
  const choices = intentQuestion.answer_choices ?? [];
  const useChoiceRenderer = renderHint !== "choice" && choices.length > 0;
  const handleSelectChoice = (choice) => {
    setSelectedAnswerId(choice.id);
    onAnswerClick(choice.value, choice.id, { isOtherAnswer: false });
  };
  const handleAnswerClick = (answer) => {
    const answerText = answer.answer_text || answer.answer || "";
    if (answer.is_other_option) {
      setSelectedAnswerId(answer.id);
      setShowOtherInput(true);
      return;
    }
    setSelectedAnswerId(answer.id);
    setShowOtherInput(false);
    if (isDiscoveryQuestion) {
      onAnswerClick(answerText, answer.id, {
        isOtherAnswer: false
      });
    } else {
      onAnswerClick(answerText, answer.id);
    }
  };
  const handleOtherClick = () => {
    setSelectedAnswerId("other");
    setShowOtherInput(true);
  };
  const handleCustomSubmit = (e) => {
    var _a2;
    e.preventDefault();
    if (customInput.trim()) {
      if (isDiscoveryQuestion) {
        const otherAnswer = (_a2 = intentQuestion.answers) == null ? void 0 : _a2.find((a) => a.is_other_option);
        if (otherAnswer) {
          onAnswerClick(customInput.trim(), otherAnswer.id, {
            isOtherAnswer: true,
            otherAnswerText: customInput.trim()
          });
        } else {
          onCustomAnswer(customInput.trim());
        }
      } else {
        onCustomAnswer(customInput.trim());
      }
      setCustomInput("");
    }
  };
  return /* @__PURE__ */ React.createElement("div", { className: `omniguide-intent-question ${isGuide ? "omniguide-intent-question--guide" : ""}` }, isGuide && /* @__PURE__ */ React.createElement("div", { className: "omniguide-intent-question__eyebrow" }, /* @__PURE__ */ React.createElement("span", { className: "omniguide-intent-question__mark", "aria-hidden": "true" }), "To narrow this down"), isGuide && questionText && /* @__PURE__ */ React.createElement("p", { className: "omniguide-intent-question__text" }, questionText), useChoiceRenderer ? /* @__PURE__ */ React.createElement(
    DiscoveryAutocomplete,
    {
      questionId: String(intentQuestion.question_id ?? intentQuestion.id ?? ""),
      choices,
      onSelectChoice: handleSelectChoice,
      selectedValue: ((_b = choices.find((c) => c.id === selectedAnswerId)) == null ? void 0 : _b.value) ?? null,
      ariaLabel: questionText,
      renderHint: renderHint === "searchable_dropdown" ? "searchable_dropdown" : "autocomplete"
    }
  ) : /* @__PURE__ */ React.createElement("div", { className: "omniguide-intent-answers" }, intentQuestion.answers.map((answer, index) => {
    const isSelected = selectedAnswerId === answer.id;
    const displayText = answer.is_other_option ? "Other" : answer.answer_text || answer.answer;
    return /* @__PURE__ */ React.createElement(
      "button",
      {
        key: answer.id ?? `answer-${index}`,
        onClick: () => handleAnswerClick(answer),
        className: "omniguide-intent-answer-btn",
        "data-selected": isSelected,
        "data-hovered": hoveredId === answer.id,
        onMouseEnter: () => setHoveredId(answer.id),
        onMouseLeave: () => setHoveredId(UNSELECTED$1),
        title: answer.explanation || ""
      },
      displayText
    );
  }), !hasOtherOption && /* @__PURE__ */ React.createElement(
    "button",
    {
      onClick: handleOtherClick,
      className: "omniguide-intent-answer-btn",
      "data-selected": selectedAnswerId === "other",
      "data-hovered": hoveredId === "other",
      onMouseEnter: () => setHoveredId("other"),
      onMouseLeave: () => setHoveredId(UNSELECTED$1)
    },
    "Other"
  )), !useChoiceRenderer && showOtherInput && /* @__PURE__ */ React.createElement("form", { onSubmit: handleCustomSubmit, className: "omniguide-intent-custom-form" }, /* @__PURE__ */ React.createElement(
    "input",
    {
      type: "text",
      value: customInput,
      onChange: (e) => setCustomInput(e.target.value),
      placeholder: "Type your answer...",
      className: "omniguide-intent-custom-input",
      autoFocus: true
    }
  ), /* @__PURE__ */ React.createElement(
    "button",
    {
      type: "submit",
      disabled: !customInput.trim(),
      className: "omniguide-intent-custom-submit",
      "data-disabled": !customInput.trim()
    },
    "Send"
  )));
};
const UNSELECTED = Symbol("unselected");
const SearchClarificationQuestionUI = ({
  clarificationQuestion,
  onAnswerClick,
  onCustomAnswer,
  variant = "search"
}) => {
  const [customInput, setCustomInput] = useState("");
  const [selectedOptionId, setSelectedOptionId] = useState(UNSELECTED);
  const [showOtherInput, setShowOtherInput] = useState(false);
  const [hoveredId, setHoveredId] = useState(UNSELECTED);
  if (!clarificationQuestion) return null;
  const { message, param_name, options } = clarificationQuestion;
  const isGuide = variant === "search";
  const handleOptionClick = (optionLabel, optionId) => {
    setSelectedOptionId(optionId);
    setShowOtherInput(false);
    onAnswerClick(optionLabel, optionId, param_name);
  };
  const handleOtherClick = () => {
    setSelectedOptionId("other");
    setShowOtherInput(true);
  };
  const handleCustomSubmit = (e) => {
    e.preventDefault();
    if (customInput.trim()) {
      onCustomAnswer(customInput.trim());
      setCustomInput("");
    }
  };
  return /* @__PURE__ */ React.createElement("div", { className: `omniguide-intent-question ${isGuide ? "omniguide-intent-question--guide" : ""}` }, isGuide && /* @__PURE__ */ React.createElement("div", { className: "omniguide-intent-question__eyebrow" }, /* @__PURE__ */ React.createElement("span", { className: "omniguide-intent-question__mark", "aria-hidden": "true" }), "To narrow this down"), /* @__PURE__ */ React.createElement("p", { className: "omniguide-intent-question__text" }, message), /* @__PURE__ */ React.createElement("div", { className: "omniguide-intent-answers" }, options.map((option) => {
    const isSelected = selectedOptionId === option.id;
    return /* @__PURE__ */ React.createElement(
      "button",
      {
        key: option.id,
        onClick: () => handleOptionClick(option.label, option.id),
        className: "omniguide-intent-answer-btn",
        "data-selected": isSelected,
        "data-hovered": hoveredId === option.id,
        onMouseEnter: () => setHoveredId(option.id),
        onMouseLeave: () => setHoveredId(UNSELECTED),
        title: option.description || ""
      },
      option.label
    );
  }), /* @__PURE__ */ React.createElement(
    "button",
    {
      onClick: handleOtherClick,
      className: "omniguide-intent-answer-btn",
      "data-selected": selectedOptionId === "other",
      "data-hovered": hoveredId === "other",
      onMouseEnter: () => setHoveredId("other"),
      onMouseLeave: () => setHoveredId(UNSELECTED)
    },
    "Other"
  )), showOtherInput && /* @__PURE__ */ React.createElement("form", { onSubmit: handleCustomSubmit, className: "omniguide-intent-custom-form" }, /* @__PURE__ */ React.createElement(
    "input",
    {
      type: "text",
      value: customInput,
      onChange: (e) => setCustomInput(e.target.value),
      placeholder: "Type your answer...",
      className: "omniguide-intent-custom-input",
      autoFocus: true
    }
  ), /* @__PURE__ */ React.createElement(
    "button",
    {
      type: "submit",
      disabled: !customInput.trim(),
      className: "omniguide-intent-custom-submit",
      "data-disabled": !customInput.trim()
    },
    "Send"
  )));
};
function useCountdown(reconnectInfo, active) {
  const [countdown, setCountdown] = useState(null);
  const intervalRef = useRef(null);
  useEffect(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    if (!reconnectInfo || !active) {
      setCountdown(null);
      return;
    }
    let remaining = Math.ceil(reconnectInfo.delayMs / 1e3);
    setCountdown(remaining);
    intervalRef.current = setInterval(() => {
      remaining -= 1;
      if (remaining <= 0) {
        setCountdown(null);
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
          intervalRef.current = null;
        }
      } else {
        setCountdown(remaining);
      }
    }, 1e3);
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [reconnectInfo, active]);
  return countdown;
}
const SearchAnswerSkeleton = ({
  connectionLost = false,
  connectionStatus,
  reconnectInfo
}) => {
  const countdown = useCountdown(reconnectInfo, connectionStatus === "reconnecting");
  if (connectionLost && connectionStatus === "reconnecting" && reconnectInfo && reconnectInfo.attempt >= 2) {
    return /* @__PURE__ */ React.createElement("div", { className: "omniguide-answer-skeleton omniguide-answer-skeleton--lost" }, /* @__PURE__ */ React.createElement("p", { className: "omniguide-answer-skeleton__lost-text" }, countdown !== null && countdown > 0 ? `Next try in ${countdown}s (${reconnectInfo.attempt}/${reconnectInfo.maxAttempts})` : /* @__PURE__ */ React.createElement(React.Fragment, null, "Reconnecting", /* @__PURE__ */ React.createElement("span", { className: "omniguide-chat__connecting-dots" }, /* @__PURE__ */ React.createElement("span", null, "."), /* @__PURE__ */ React.createElement("span", null, "."), /* @__PURE__ */ React.createElement("span", null, ".")), " (", reconnectInfo.attempt, "/", reconnectInfo.maxAttempts, ")")));
  }
  if (connectionLost) {
    return /* @__PURE__ */ React.createElement("div", { className: "omniguide-answer-skeleton omniguide-answer-skeleton--lost" }, /* @__PURE__ */ React.createElement("p", { className: "omniguide-answer-skeleton__lost-text" }, "Connection lost while waiting for a response."));
  }
  return /* @__PURE__ */ React.createElement("div", { className: "omniguide-answer-skeleton" }, /* @__PURE__ */ React.createElement("div", { className: "omniguide-answer-skeleton__line", style: { width: "100%" } }), /* @__PURE__ */ React.createElement("div", { className: "omniguide-answer-skeleton__line", style: { width: "85%" } }), /* @__PURE__ */ React.createElement("div", { className: "omniguide-answer-skeleton__line", style: { width: "65%" } }), /* @__PURE__ */ React.createElement("div", { className: "omniguide-answer-skeleton__line", style: { width: "40%" } }));
};
function isValidNavigationUrl(url, baseUrl = window.location.origin) {
  if (!url || typeof url !== "string") {
    return false;
  }
  try {
    const fullUrl = url.startsWith("http://") || url.startsWith("https://") ? url : new URL(url, baseUrl).href;
    const parsed = new URL(fullUrl);
    const allowedProtocols = ["http:", "https:"];
    if (!allowedProtocols.includes(parsed.protocol)) {
      return false;
    }
    return true;
  } catch {
    return false;
  }
}
function safeNavigate(url, baseUrl = window.location.origin, options = {}) {
  if (!isValidNavigationUrl(url, baseUrl)) {
    return false;
  }
  const { newTab = false, event } = options;
  const openInNewTab = newTab || (event == null ? void 0 : event.ctrlKey) || (event == null ? void 0 : event.metaKey);
  if (openInNewTab) {
    window.open(url, "_blank", "noopener,noreferrer");
  } else {
    window.location.href = url;
  }
  return true;
}
function buildSafeUrl(baseUrl, path, params = {}) {
  try {
    if (path && (path.startsWith("javascript:") || path.startsWith("data:") || path.startsWith("vbscript:"))) {
      return null;
    }
    const resolvedBase = (baseUrl || window.location.origin).replace(/\/+$/, "");
    const url = path && (path.startsWith("http://") || path.startsWith("https://")) ? new URL(path) : new URL(path || "", resolvedBase);
    Object.entries(params).forEach(([key, value]) => {
      if (value !== void 0 && value !== null) {
        url.searchParams.set(key, String(value));
      }
    });
    if (!isValidNavigationUrl(url.href)) {
      return null;
    }
    return url.href;
  } catch {
    return null;
  }
}
const SECTION_LABELS = {
  products: "Products",
  categories: "Categories",
  content: "Guides & Help",
  brands: "Brands"
};
const CONTENT_SNIPPET_MAX = 140;
function matchedTokensFor(highlights, field) {
  var _a;
  return ((_a = highlights == null ? void 0 : highlights.find((h) => h.field === field)) == null ? void 0 : _a.matched_tokens) ?? [];
}
function escapeRegExp(s) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
const HighlightedText = ({ highlights, field, value, className }) => {
  const tokens = matchedTokensFor(highlights, field).filter(
    (t) => typeof t === "string" && t.trim().length > 0
  );
  if (tokens.length === 0) {
    return /* @__PURE__ */ React.createElement("span", { className }, value);
  }
  const pattern = new RegExp(`(${tokens.map(escapeRegExp).join("|")})`, "ig");
  const parts = value.split(pattern);
  return /* @__PURE__ */ React.createElement("span", { className }, parts.map(
    (part, i) => i % 2 === 1 ? (
      // eslint-disable-next-line react/no-array-index-key -- positional split of one string; no stable id and order is fixed
      /* @__PURE__ */ React.createElement("mark", { key: i }, part)
    ) : (
      // eslint-disable-next-line react/no-array-index-key -- positional split of one string; no stable id and order is fixed
      /* @__PURE__ */ React.createElement(React.Fragment, { key: i }, part)
    )
  ));
};
function truncate(text2, max) {
  if (text2.length <= max) return text2;
  return `${text2.slice(0, max).trimEnd()}…`;
}
const SearchTypeaheadSections = ({
  sections,
  idPrefix,
  activeId,
  onSelect,
  onHover,
  hrefFor
}) => {
  return /* @__PURE__ */ React.createElement("div", { className: "omniguide-ta", role: "listbox", id: `${idPrefix}-listbox` }, TYPEAHEAD_SECTION_ORDER.map((sectionKey) => {
    const hits = sections[sectionKey].hits;
    if (hits.length === 0) return null;
    return /* @__PURE__ */ React.createElement(
      "div",
      {
        key: sectionKey,
        className: "omniguide-ta__section",
        role: "group",
        "aria-label": SECTION_LABELS[sectionKey]
      },
      /* @__PURE__ */ React.createElement("div", { className: "omniguide-ta__section-head", "aria-hidden": "true" }, SECTION_LABELS[sectionKey]),
      /* @__PURE__ */ React.createElement("ul", { className: "omniguide-ta__list" }, hits.map((hit, i) => {
        const optionId = `${idPrefix}-${sectionKey}-${i}`;
        const active = optionId === activeId;
        return /* @__PURE__ */ React.createElement(
          "li",
          {
            key: hit.id || optionId,
            id: optionId,
            role: "option",
            "aria-selected": active,
            className: `omniguide-ta__row omniguide-ta__row--${sectionKey}${active ? " omniguide-ta__row--active" : ""}`,
            onMouseEnter: () => onHover == null ? void 0 : onHover(optionId)
          },
          /* @__PURE__ */ React.createElement(
            "a",
            {
              className: "omniguide-ta__row-link",
              href: hrefFor == null ? void 0 : hrefFor(hit),
              tabIndex: -1,
              draggable: false,
              onMouseDown: (e) => {
                if (e.button === 0) e.preventDefault();
              },
              onClick: (e) => {
                if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
                e.preventDefault();
                onSelect(hit, sectionKey);
              }
            },
            renderRow(sectionKey, hit)
          )
        );
      }))
    );
  }));
};
function renderRow(sectionKey, hit) {
  switch (sectionKey) {
    case "products":
      return /* @__PURE__ */ React.createElement(ProductRow, { hit });
    case "categories":
      return /* @__PURE__ */ React.createElement(CategoryRow, { hit });
    case "content":
      return /* @__PURE__ */ React.createElement(ContentRow, { hit });
    case "brands":
      return /* @__PURE__ */ React.createElement(BrandRow, { hit });
    default:
      return null;
  }
}
const ProductRow = ({ hit }) => /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement("span", { className: "omniguide-ta__thumb", "aria-hidden": "true" }, hit.image_url && isValidNavigationUrl(hit.image_url) ? /* @__PURE__ */ React.createElement("img", { src: hit.image_url, alt: "", loading: "lazy" }) : /* @__PURE__ */ React.createElement("span", { className: "omniguide-ta__thumb-fallback" })), /* @__PURE__ */ React.createElement("span", { className: "omniguide-ta__body" }, /* @__PURE__ */ React.createElement(
  HighlightedText,
  {
    className: "omniguide-ta__title",
    highlights: hit.highlights,
    field: "title",
    value: hit.title
  }
), /* @__PURE__ */ React.createElement("span", { className: "omniguide-ta__meta" }, hit.brand && /* @__PURE__ */ React.createElement("span", { className: "omniguide-ta__brand" }, hit.brand), hit.brand && hit.sku && /* @__PURE__ */ React.createElement("span", { "aria-hidden": "true" }, " · "), hit.sku && /* @__PURE__ */ React.createElement("span", { className: "omniguide-ta__sku" }, "SKU: ", hit.sku))), typeof hit.price === "number" && /* @__PURE__ */ React.createElement("span", { className: "omniguide-ta__price" }, "$", hit.price.toFixed(2)));
const CategoryRow = ({ hit }) => /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement("span", { className: "omniguide-ta__icon", "aria-hidden": "true" }, /* @__PURE__ */ React.createElement(FolderGlyph, null)), /* @__PURE__ */ React.createElement("span", { className: "omniguide-ta__body" }, /* @__PURE__ */ React.createElement(
  HighlightedText,
  {
    className: "omniguide-ta__title",
    highlights: hit.highlights,
    field: "name",
    value: hit.name
  }
)), /* @__PURE__ */ React.createElement("span", { className: "omniguide-ta__count" }, hit.product_count ?? "", hit.product_count != null && /* @__PURE__ */ React.createElement("span", { className: "sr-only" }, " products")));
const ContentRow = ({ hit }) => /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement("span", { className: "omniguide-ta__icon", "aria-hidden": "true" }, /* @__PURE__ */ React.createElement(DocGlyph, null)), /* @__PURE__ */ React.createElement("span", { className: "omniguide-ta__body" }, /* @__PURE__ */ React.createElement(
  HighlightedText,
  {
    className: "omniguide-ta__title",
    highlights: hit.highlights,
    field: "title",
    value: hit.title
  }
), hit.snippet && /* @__PURE__ */ React.createElement("span", { className: "omniguide-ta__snippet" }, truncate(hit.snippet, CONTENT_SNIPPET_MAX))));
const BrandRow = ({ hit }) => /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement("span", { className: "omniguide-ta__icon", "aria-hidden": "true" }, /* @__PURE__ */ React.createElement(TagGlyph, null)), /* @__PURE__ */ React.createElement("span", { className: "omniguide-ta__body" }, /* @__PURE__ */ React.createElement(
  HighlightedText,
  {
    className: "omniguide-ta__title",
    highlights: hit.highlights,
    field: "name",
    value: hit.name
  }
)), /* @__PURE__ */ React.createElement("span", { className: "omniguide-ta__count" }, hit.product_count ?? "", hit.product_count != null && /* @__PURE__ */ React.createElement("span", { className: "sr-only" }, " products")));
const FolderGlyph = () => /* @__PURE__ */ React.createElement("svg", { width: "16", height: "16", viewBox: "0 0 16 16", fill: "none", "aria-hidden": "true" }, /* @__PURE__ */ React.createElement(
  "path",
  {
    d: "M1.5 4a1 1 0 0 1 1-1h3.2l1.2 1.4H13a1 1 0 0 1 1 1V12a1 1 0 0 1-1 1H2.5a1 1 0 0 1-1-1V4Z",
    stroke: "currentColor",
    strokeWidth: "1.2"
  }
));
const DocGlyph = () => /* @__PURE__ */ React.createElement("svg", { width: "16", height: "16", viewBox: "0 0 16 16", fill: "none", "aria-hidden": "true" }, /* @__PURE__ */ React.createElement("path", { d: "M4 2h5l3 3v9H4V2Z", stroke: "currentColor", strokeWidth: "1.2" }), /* @__PURE__ */ React.createElement("path", { d: "M9 2v3h3M6 8h4M6 10.5h4", stroke: "currentColor", strokeWidth: "1.2" }));
const TagGlyph = () => /* @__PURE__ */ React.createElement("svg", { width: "16", height: "16", viewBox: "0 0 16 16", fill: "none", "aria-hidden": "true" }, /* @__PURE__ */ React.createElement(
  "path",
  {
    d: "M2.5 2.5h5l6 6-5 5-6-6v-5Z",
    stroke: "currentColor",
    strokeWidth: "1.2"
  }
), /* @__PURE__ */ React.createElement("circle", { cx: "5", cy: "5", r: "1", fill: "currentColor" }));
const TYPEAHEAD_DEBOUNCE_MS = 120;
const TYPEAHEAD_MIN_QUERY_LENGTH = 2;
const TYPEAHEAD_DEFAULT_PER_PAGE = 8;
const EMPTY_SECTIONS = {
  products: { found: 0, hits: [] },
  categories: { found: 0, hits: [] },
  content: { found: 0, hits: [] },
  brands: { found: 0, hits: [] }
};
function normalizeSections(data) {
  if (!data || typeof data !== "object") return EMPTY_SECTIONS;
  const sections = data.sections;
  if (!sections || typeof sections !== "object") return EMPTY_SECTIONS;
  const obj = sections;
  const coerce = (v) => {
    if (!v || typeof v !== "object") return { found: 0, hits: [] };
    const sect = v;
    const hits = Array.isArray(sect.hits) ? sect.hits : [];
    const found = typeof sect.found === "number" ? sect.found : hits.length;
    return { found, hits };
  };
  return {
    products: coerce(obj["products"]),
    categories: coerce(obj["categories"]),
    content: coerce(obj["content"]),
    brands: coerce(obj["brands"])
  };
}
function isAllEmpty(s) {
  return s.products.hits.length === 0 && s.categories.hits.length === 0 && s.content.hits.length === 0 && s.brands.hits.length === 0;
}
function useTypeaheadSearch(options = {}) {
  const { config } = useOmniguideContext();
  const apiBaseUrl = config.apiBaseUrl;
  const websiteCode = config.websiteId;
  const [sections, setSections] = useState(EMPTY_SECTIONS);
  const [resolvedQuery, setResolvedQuery] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isDisabled, setIsDisabled] = useState(false);
  const [isQuestion, setIsQuestion] = useState(false);
  const [hasResolvedEmpty, setHasResolvedEmpty] = useState(false);
  const nextIdRef = useRef(0);
  const lastRenderedIdRef = useRef(-1);
  const debounceTimerRef = useRef(null);
  const abortRef = useRef(null);
  const optionsRef = useRef(options);
  optionsRef.current = options;
  const clearTimer = () => {
    if (debounceTimerRef.current !== null) {
      clearTimeout(debounceTimerRef.current);
      debounceTimerRef.current = null;
    }
  };
  const clearResults = () => {
    setSections(EMPTY_SECTIONS);
    setIsQuestion(false);
    setHasResolvedEmpty(false);
  };
  const reset = useCallback(() => {
    var _a;
    clearTimer();
    (_a = abortRef.current) == null ? void 0 : _a.abort();
    abortRef.current = null;
    clearResults();
    setResolvedQuery("");
    setIsLoading(false);
  }, []);
  const fire = useCallback(
    async (query) => {
      var _a;
      if (!apiBaseUrl || !websiteCode) return;
      const myId = ++nextIdRef.current;
      (_a = abortRef.current) == null ? void 0 : _a.abort();
      const controller = new AbortController();
      abortRef.current = controller;
      setIsLoading(true);
      const result = await fetchTypeaheadSearch({
        apiBaseUrl,
        request: {
          website_code: websiteCode,
          query,
          per_page: optionsRef.current.perPage ?? TYPEAHEAD_DEFAULT_PER_PAGE,
          allow_oos: optionsRef.current.allowOos ?? false
        },
        // getCurrentPage(), not window.location.href: the backend resolves the
        // tenant from this header (X-Omniguide-Origin), so on localhost the raw
        // location names no storefront and every keystroke 403s. Every other
        // caller already reads the override the host sets via init({currentPage}).
        origin: sanitizeUrl(getCurrentPage()) || void 0,
        signal: controller.signal
      });
      if (myId <= lastRenderedIdRef.current) return;
      if (result.kind === "aborted") {
        return;
      }
      lastRenderedIdRef.current = myId;
      setIsLoading(false);
      if (result.kind === "disabled") {
        setIsDisabled(true);
        clearResults();
        return;
      }
      if (result.kind === "error") {
        clearResults();
        return;
      }
      const data = result.data;
      setResolvedQuery(typeof (data == null ? void 0 : data.query) === "string" ? data.query : query);
      if (data == null ? void 0 : data.is_question) {
        setIsQuestion(true);
        setSections(EMPTY_SECTIONS);
        setHasResolvedEmpty(false);
        return;
      }
      const normalized = normalizeSections(data);
      setIsQuestion(false);
      setSections(normalized);
      setHasResolvedEmpty(isAllEmpty(normalized));
    },
    [apiBaseUrl, websiteCode]
  );
  const setQuery = useCallback(
    (rawQuery) => {
      var _a;
      if (isDisabled) return;
      clearTimer();
      const trimmed = rawQuery.trim();
      if (trimmed.length < TYPEAHEAD_MIN_QUERY_LENGTH) {
        (_a = abortRef.current) == null ? void 0 : _a.abort();
        abortRef.current = null;
        clearResults();
        setIsLoading(false);
        return;
      }
      debounceTimerRef.current = setTimeout(() => {
        debounceTimerRef.current = null;
        void fire(trimmed);
      }, TYPEAHEAD_DEBOUNCE_MS);
    },
    [fire, isDisabled]
  );
  useEffect(() => {
    return () => {
      var _a;
      clearTimer();
      (_a = abortRef.current) == null ? void 0 : _a.abort();
    };
  }, []);
  return {
    sections,
    resolvedQuery,
    isLoading,
    isDisabled,
    isQuestion,
    hasResolvedEmpty,
    setQuery,
    reset
  };
}
const CHAT_PROMPT_TEXT$1 = "Ask a question.";
const TYPEAHEAD_ID_PREFIX = "omniguide-ta";
const DEFAULT_CATEGORY_EXAMPLES = ["What are the best options?", "Compare products", "Help me choose"];
const SearchEmptyState = ({
  onExampleClick,
  isMobile,
  variant = "search",
  suggestedQuestions = [],
  seedQuestions = [],
  welcomeText = "",
  hideTitle = false,
  defaultSearchExamples,
  disabled = false,
  connectionStatus,
  reconnectInfo,
  liveQuery = "",
  typeahead = false,
  aiSearchStoreUrl,
  onSelectHit,
  onSeeAllResults,
  assistantLabel,
  emptyStateFooter
}) => {
  const isConnectionDisabled = connectionStatus === "connecting" || connectionStatus === "reconnecting" || connectionStatus === "disconnected";
  const countdown = useCountdown(reconnectInfo, connectionStatus === "reconnecting");
  const isCategory = variant === "category";
  const ta = useTypeaheadSearch();
  const taSetQuery = ta.setQuery;
  const typeaheadActive = typeahead && !isCategory && !ta.isDisabled;
  const [activeHitId, setActiveHitId] = useState(null);
  useEffect(() => {
    if (!typeaheadActive) return;
    taSetQuery(liveQuery);
    setActiveHitId(null);
  }, [typeaheadActive, liveQuery, taSetQuery]);
  const resolveHitHref = (hit) => {
    if (!("url" in hit) || !hit.url) return void 0;
    const base = aiSearchStoreUrl || (typeof document !== "undefined" ? document.baseURI : void 0);
    return buildSafeUrl(base, hit.url) ?? void 0;
  };
  const linkableSections = useMemo(() => {
    const keep = (section) => ({
      found: section.found,
      hits: section.hits.filter(
        (hit) => resolveHitHref(hit) !== void 0
      )
    });
    return {
      products: keep(ta.sections.products),
      categories: keep(ta.sections.categories),
      content: keep(ta.sections.content),
      brands: keep(ta.sections.brands)
    };
  }, [ta.sections, aiSearchStoreUrl]);
  const handleSelectHit = (hit, sectionKey) => {
    if (onSelectHit) {
      onSelectHit(hit, sectionKey);
      return;
    }
    if ("url" in hit && hit.url) {
      const base = aiSearchStoreUrl || (typeof document !== "undefined" ? document.baseURI : void 0);
      const target = buildSafeUrl(base, hit.url) ?? hit.url;
      safeNavigate(target);
    }
  };
  const examples = isCategory ? suggestedQuestions.length > 0 ? suggestedQuestions.slice(0, 3) : DEFAULT_CATEGORY_EXAMPLES : seedQuestions.length > 0 ? seedQuestions.slice(0, 6) : defaultSearchExamples || DEFAULT_CATEGORY_EXAMPLES;
  const connectionNotice = isConnectionDisabled && /* @__PURE__ */ React.createElement("p", { className: "omniguide-chat__connection-notice" }, connectionStatus === "disconnected" ? "Unable to connect to the assistant." : connectionStatus === "reconnecting" && reconnectInfo && reconnectInfo.attempt >= 2 ? countdown !== null && countdown > 0 ? `Next try in ${countdown}s (${reconnectInfo.attempt}/${reconnectInfo.maxAttempts})` : `Reconnecting... (${reconnectInfo.attempt}/${reconnectInfo.maxAttempts})` : /* @__PURE__ */ React.createElement(React.Fragment, null, "Connecting", /* @__PURE__ */ React.createElement("span", { className: "omniguide-chat__connecting-dots" }, /* @__PURE__ */ React.createElement("span", null, "."), /* @__PURE__ */ React.createElement("span", null, "."), /* @__PURE__ */ React.createElement("span", null, "."))));
  if (!isCategory) {
    const trimmedQuery = liveQuery.trim();
    const countedQuery = ta.resolvedQuery.trim() || trimmedQuery;
    const typed = trimmedQuery.length > 0;
    const isQuestion = typeaheadActive ? ta.isQuestion : detectQuestion(liveQuery);
    const taHasHits = typeaheadActive && (linkableSections.products.hits.length > 0 || linkableSections.categories.hits.length > 0 || linkableSections.content.hits.length > 0 || linkableSections.brands.hits.length > 0);
    const taResolved = typeaheadActive && ta.resolvedQuery.trim().length > 0;
    const taNoMatches = taResolved && typed && !isQuestion && !taHasHits;
    const showCommonSearches = !typed;
    const totalFound = taHasHits ? ta.sections.products.found : 0;
    const askLabel = (assistantLabel == null ? void 0 : assistantLabel.trim()) || "Ask the assistant";
    const canAsk = typed && !disabled;
    return /* @__PURE__ */ React.createElement("div", { className: `omniguide-chat__empty-state omniguide-instant ${isMobile ? "omniguide-chat__empty-state--mobile" : ""}` }, connectionNotice, taHasHits && /* @__PURE__ */ React.createElement(
      SearchTypeaheadSections,
      {
        sections: linkableSections,
        idPrefix: TYPEAHEAD_ID_PREFIX,
        activeId: activeHitId,
        onSelect: handleSelectHit,
        onHover: setActiveHitId,
        hrefFor: resolveHitHref
      }
    ), taNoMatches && /* @__PURE__ */ React.createElement("p", { className: "omniguide-instant__typed-hint" }, "No matches for “", trimmedQuery, "”."), showCommonSearches && /* @__PURE__ */ React.createElement("div", { className: "omniguide-instant__section" }, /* @__PURE__ */ React.createElement("h4", { className: "omniguide-instant__heading" }, "Common searches"), /* @__PURE__ */ React.createElement(
      "div",
      {
        className: `omniguide-instant__rows ${disabled ? "omniguide-chips--disabled" : ""}`,
        role: "group",
        "aria-label": "Example questions to get started",
        "aria-disabled": disabled || void 0
      },
      examples.map((example) => /* @__PURE__ */ React.createElement(
        SearchQueryRow,
        {
          key: example,
          text: example,
          onClick: disabled ? () => {
          } : () => onExampleClick(example)
        }
      ))
    )), showCommonSearches && emptyStateFooter, (totalFound > 0 || canAsk) && /* @__PURE__ */ React.createElement("div", { className: "omniguide-ta-bar" }, /* @__PURE__ */ React.createElement("span", { className: "omniguide-ta-bar__slot" }, totalFound > 0 && (onSeeAllResults ? /* @__PURE__ */ React.createElement(
      "button",
      {
        type: "button",
        className: "omniguide-ta-bar__all",
        onMouseDown: (e) => e.preventDefault(),
        onClick: () => onSeeAllResults(countedQuery)
      },
      "See all ",
      totalFound,
      " result",
      totalFound === 1 ? "" : "s",
      /* @__PURE__ */ React.createElement("svg", { viewBox: "0 0 16 16", width: "13", height: "13", fill: "none", stroke: "currentColor", strokeWidth: "1.8", strokeLinecap: "round", strokeLinejoin: "round", "aria-hidden": "true" }, /* @__PURE__ */ React.createElement("path", { d: "M3 8h9M8.5 4l4 4-4 4" }))
    ) : /* @__PURE__ */ React.createElement("span", { className: "omniguide-ta-bar__all-static" }, totalFound, " result", totalFound === 1 ? "" : "s"))), canAsk && /* @__PURE__ */ React.createElement(
      "button",
      {
        type: "button",
        className: "omniguide-ta-bar__ask",
        "aria-label": `${askLabel} about ${trimmedQuery}`,
        onMouseDown: (e) => e.preventDefault(),
        onClick: () => onExampleClick(trimmedQuery)
      },
      /* @__PURE__ */ React.createElement("span", { className: "omniguide-ta-bar__ask-lead" }, "Not sure which one?"),
      /* @__PURE__ */ React.createElement("span", { className: "omniguide-ta-bar__ask-cta" }, askLabel, /* @__PURE__ */ React.createElement("svg", { width: "11", height: "11", viewBox: "0 0 12 12", "aria-hidden": "true" }, /* @__PURE__ */ React.createElement("path", { d: "M2.5 1.2 10 6l-7.5 4.8Z", fill: "currentColor" })))
    )));
  }
  return /* @__PURE__ */ React.createElement("div", { className: `omniguide-chat__empty-state ${isMobile ? "omniguide-chat__empty-state--mobile" : ""}` }, !hideTitle && /* @__PURE__ */ React.createElement("h3", { className: "omniguide-chat__empty-state-title" }, CHAT_PROMPT_TEXT$1), /* @__PURE__ */ React.createElement(React.Fragment, null, welcomeText && /* @__PURE__ */ React.createElement("div", { className: "omniguide-qa__answer", style: { marginBottom: "16px" } }, welcomeText), connectionNotice, /* @__PURE__ */ React.createElement(
    "div",
    {
      className: `omniguide-chips ${disabled ? "omniguide-chips--disabled" : ""}`,
      role: "group",
      "aria-label": "Example questions to get started",
      "aria-disabled": disabled || void 0
    },
    examples.map((example) => /* @__PURE__ */ React.createElement(
      SearchCategoryChip,
      {
        key: example,
        text: example,
        onClick: disabled ? () => {
        } : () => onExampleClick(example),
        isSelected: false
      }
    ))
  )));
};
const SearchConnectionError = ({
  onRetry,
  isMobile = false
}) => {
  return /* @__PURE__ */ React.createElement(
    "div",
    {
      className: `omniguide-connection-error ${isMobile ? "omniguide-connection-error--mobile" : ""}`,
      role: "alert"
    },
    /* @__PURE__ */ React.createElement("div", { className: "omniguide-connection-error__icon" }, /* @__PURE__ */ React.createElement("svg", { width: "24", height: "24", viewBox: "0 0 20 20", fill: "currentColor", "aria-hidden": "true" }, /* @__PURE__ */ React.createElement(
      "path",
      {
        fillRule: "evenodd",
        d: "M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z",
        clipRule: "evenodd"
      }
    ))),
    /* @__PURE__ */ React.createElement("h3", { className: "omniguide-connection-error__title" }, "Unable to connect"),
    /* @__PURE__ */ React.createElement("p", { className: "omniguide-connection-error__text" }, "We couldn't reach the assistant. Please check your connection and try again."),
    onRetry && /* @__PURE__ */ React.createElement(
      "button",
      {
        type: "button",
        className: "omniguide-connection-error__retry-btn",
        onClick: onRetry
      },
      /* @__PURE__ */ React.createElement("svg", { width: "14", height: "14", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", "aria-hidden": "true" }, /* @__PURE__ */ React.createElement("polyline", { points: "23 4 23 10 17 10" }), /* @__PURE__ */ React.createElement("path", { d: "M20.49 15a9 9 0 1 1-2.12-9.36L23 10" })),
      /* @__PURE__ */ React.createElement("span", null, "Try Again")
    )
  );
};
const SearchConnectionBanner = ({
  status,
  onRetry,
  reconnectInfo
}) => {
  const countdown = useCountdown(reconnectInfo, status === "reconnecting");
  if (status === "reconnecting") {
    const attemptText = reconnectInfo ? ` (${reconnectInfo.attempt}/${reconnectInfo.maxAttempts})` : "";
    const mainText = countdown !== null && countdown > 0 ? `Trying to reconnect in ${countdown}s${attemptText}` : `Reconnecting...${attemptText}`;
    return /* @__PURE__ */ React.createElement(
      "div",
      {
        className: "omniguide-connection-banner omniguide-connection-banner--reconnecting",
        role: "status",
        "aria-live": "polite"
      },
      /* @__PURE__ */ React.createElement("span", { className: "omniguide-connection-banner__dot", "aria-hidden": "true" }),
      /* @__PURE__ */ React.createElement("span", { className: "omniguide-connection-banner__text" }, mainText)
    );
  }
  return /* @__PURE__ */ React.createElement(
    "div",
    {
      className: "omniguide-connection-banner omniguide-connection-banner--disconnected",
      role: "status",
      "aria-live": "polite"
    },
    /* @__PURE__ */ React.createElement("svg", { className: "omniguide-connection-banner__icon", width: "14", height: "14", viewBox: "0 0 20 20", fill: "currentColor", "aria-hidden": "true" }, /* @__PURE__ */ React.createElement(
      "path",
      {
        fillRule: "evenodd",
        d: "M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z",
        clipRule: "evenodd"
      }
    )),
    /* @__PURE__ */ React.createElement("span", { className: "omniguide-connection-banner__text" }, "Unable to connect"),
    onRetry && /* @__PURE__ */ React.createElement(
      "button",
      {
        type: "button",
        className: "omniguide-connection-banner__retry-btn",
        onClick: onRetry
      },
      "Try Again"
    )
  );
};
const SearchQAMessage = ({
  userMessage,
  assistantMessage,
  onSuggestionClick,
  onIntentAnswer,
  onCustomIntentAnswer,
  onClarificationAnswer,
  onCustomClarificationAnswer,
  selectedSuggestions = [],
  pipelineStatus,
  isLoading,
  variant = "search",
  productUrls = {},
  connectionStatus,
  reconnectInfo,
  conversationId,
  FeedbackWidgetComponent,
  onInlineProductLinkClick
}) => {
  var _a, _b;
  const [isQuestionExpanded, setIsQuestionExpanded] = useState(false);
  const questionRef = useRef(null);
  const [isTruncated, setIsTruncated] = useState(false);
  useEffect(() => {
    if (questionRef.current) {
      const element = questionRef.current;
      setIsTruncated(element.scrollHeight > element.clientHeight);
    }
  }, [userMessage.content]);
  const { sourceProductUrls, sourceProductNames } = useMemo(() => {
    const urlMap = { ...productUrls };
    const nameMap = {};
    const sources = (assistantMessage == null ? void 0 : assistantMessage.sources) || [];
    sources.forEach((source) => {
      if (source.type === "product" && source.data) {
        const { sku, url, path, display_name, name, product_line, brand } = source.data;
        if (sku) {
          if (url || path) {
            urlMap[String(sku)] = url || path;
          }
          const shortName = name || display_name;
          if (shortName) {
            if (!name && display_name) {
              const brandName = product_line || (typeof brand === "object" ? brand == null ? void 0 : brand.name : typeof brand === "string" ? brand : null);
              nameMap[String(sku)] = brandName ? `${brandName} ${shortName}` : shortName;
            } else {
              nameMap[String(sku)] = shortName;
            }
          }
        }
      }
    });
    return { sourceProductUrls: urlMap, sourceProductNames: nameMap };
  }, [assistantMessage == null ? void 0 : assistantMessage.sources, productUrls]);
  const isStreaming = assistantMessage == null ? void 0 : assistantMessage.isStreaming;
  const hasProductUrls = Object.keys(sourceProductUrls).length > 0;
  const sanitizedContent = parseMarkdown((assistantMessage == null ? void 0 : assistantMessage.content) || "", {
    linkColor: "var(--omniguide-color-primary)",
    productUrls: sourceProductUrls,
    productNames: sourceProductNames,
    requireCorrectUrls: !hasProductUrls
  }) || "";
  const hasContent = (((_a = assistantMessage == null ? void 0 : assistantMessage.content) == null ? void 0 : _a.length) ?? 0) > 0;
  const hasSubstantialContent = (((_b = assistantMessage == null ? void 0 : assistantMessage.content) == null ? void 0 : _b.length) ?? 0) > 100;
  const isConnectionDisabled = connectionStatus === "connecting" || connectionStatus === "reconnecting" || connectionStatus === "disconnected";
  const showInlineStatus = isLoading && pipelineStatus && pipelineStatus !== "idle" && pipelineStatus !== "generating" && !(hasSubstantialContent && pipelineStatus === "finalizing" && !isStreaming);
  const questionClassName = `omniguide-qa__question ${variant === "category" ? "omniguide-qa__question--category" : ""} ${isTruncated ? "omniguide-qa__question--truncated" : ""}`.trim();
  const handleQuestionClick = () => {
    if (isTruncated) {
      setIsQuestionExpanded(!isQuestionExpanded);
    }
  };
  const handleAnswerClick = useCallback((event) => {
    var _a2;
    if (!onInlineProductLinkClick) return;
    const anchor = (_a2 = event.target) == null ? void 0 : _a2.closest("a[data-omniguide-sku]");
    if (!anchor) return;
    const sku = anchor.getAttribute("data-omniguide-sku") || "";
    if (!sku) return;
    onInlineProductLinkClick({
      sku,
      href: anchor.getAttribute("href") || "",
      messageId: assistantMessage == null ? void 0 : assistantMessage.id,
      queryContext: userMessage.content
    });
  }, [onInlineProductLinkClick, assistantMessage == null ? void 0 : assistantMessage.id, userMessage.content]);
  return /* @__PURE__ */ React.createElement("div", { className: "omniguide-qa" }, /* @__PURE__ */ React.createElement(
    "h3",
    {
      ref: questionRef,
      className: questionClassName,
      onClick: handleQuestionClick
    },
    userMessage.content
  ), assistantMessage && /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement("div", { className: "omniguide-qa__answer", onClick: handleAnswerClick }, hasContent ? /* @__PURE__ */ React.createElement("span", { dangerouslySetInnerHTML: { __html: sanitizedContent } }) : !hasContent && isConnectionDisabled ? /* @__PURE__ */ React.createElement(SearchAnswerSkeleton, { connectionLost: true, connectionStatus, reconnectInfo }) : isStreaming || isLoading ? /* @__PURE__ */ React.createElement(SearchAnswerSkeleton, null) : null, isStreaming && hasContent && /* @__PURE__ */ React.createElement("span", { className: "omniguide-streaming-cursor" }), showInlineStatus && /* @__PURE__ */ React.createElement(SearchPipelineStatusIndicator, { status: pipelineStatus })), !isStreaming && assistantMessage.intentQuestion && /* @__PURE__ */ React.createElement(
    SearchIntentQuestionUI,
    {
      intentQuestion: assistantMessage.intentQuestion,
      onAnswerClick: onIntentAnswer,
      onCustomAnswer: onCustomIntentAnswer,
      variant
    }
  ), !isStreaming && assistantMessage.clarificationQuestion && /* @__PURE__ */ React.createElement(
    SearchClarificationQuestionUI,
    {
      clarificationQuestion: assistantMessage.clarificationQuestion,
      onAnswerClick: onClarificationAnswer,
      onCustomAnswer: onCustomClarificationAnswer,
      variant
    }
  ), !isStreaming && !assistantMessage.intentQuestion && !assistantMessage.clarificationQuestion && /* @__PURE__ */ React.createElement(
    SearchSuggestionChips,
    {
      suggestions: assistantMessage.suggestions,
      onSuggestionClick,
      selectedSuggestions,
      variant
    }
  ), !isStreaming && assistantMessage.id && FeedbackWidgetComponent && /* @__PURE__ */ React.createElement("div", { className: "omniguide-message__feedback" }, /* @__PURE__ */ React.createElement(
    FeedbackWidgetComponent,
    {
      entityId: assistantMessage.id,
      entityType: "message",
      context: {
        query: userMessage.content,
        conversation_id: conversationId,
        message_role: "assistant",
        has_sources: assistantMessage.sources && assistantMessage.sources.length > 0
      }
    }
  ))));
};
const SearchPrivacySettings = ({
  isMobile,
  onResetChat,
  sessionId: _sessionId,
  privacyPolicyUrl = "/privacy-policy",
  onOpenSupport,
  supportHref,
  supportLabel = "Talk to a specialist",
  consentEnabled = false,
  onToggleConsent,
  consentDisabled = false
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const containerRef = useRef(null);
  const contentId = "privacy-settings-content";
  const closeWithAnimation = useCallback(() => {
    if (!isExpanded || isClosing) return;
    setIsClosing(true);
    setTimeout(() => {
      setIsExpanded(false);
      setIsClosing(false);
    }, 250);
  }, [isExpanded, isClosing]);
  useEffect(() => {
    if (!isExpanded || !isMobile || isClosing) return;
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        closeWithAnimation();
      }
    };
    const timeoutId = setTimeout(() => {
      document.addEventListener("click", handleClickOutside);
    }, 10);
    return () => {
      clearTimeout(timeoutId);
      document.removeEventListener("click", handleClickOutside);
    };
  }, [isExpanded, isMobile, isClosing, closeWithAnimation]);
  useEffect(() => {
    if (!isExpanded || !isMobile || isClosing) return;
    const handleScroll = () => {
      closeWithAnimation();
    };
    const resultsEl = document.querySelector(".omniguide-mobile-results-bg");
    if (resultsEl) {
      resultsEl.addEventListener("scroll", handleScroll);
    }
    return () => {
      if (resultsEl) {
        resultsEl.removeEventListener("scroll", handleScroll);
      }
    };
  }, [isExpanded, isMobile, isClosing, closeWithAnimation]);
  const handleToggleExpand = () => {
    if (isExpanded) {
      closeWithAnimation();
    } else {
      setIsExpanded(true);
    }
  };
  const handleToggleKeyDown = (e) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      handleToggleExpand();
    }
  };
  const handleConsentKeyDown = (e) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      if (!consentDisabled) {
        onToggleConsent == null ? void 0 : onToggleConsent();
      }
    }
  };
  return /* @__PURE__ */ React.createElement(
    "div",
    {
      ref: containerRef,
      className: `omniguide-privacy ${isMobile ? "omniguide-privacy--mobile" : ""} ${isExpanded ? "omniguide-privacy--expanded" : ""}`
    },
    /* @__PURE__ */ React.createElement(
      "button",
      {
        onClick: handleToggleExpand,
        onKeyDown: handleToggleKeyDown,
        className: "omniguide-privacy__toggle",
        "data-hovered": isHovered,
        onMouseEnter: () => setIsHovered(true),
        onMouseLeave: () => setIsHovered(false),
        "aria-expanded": isExpanded,
        "aria-controls": contentId,
        "aria-label": `Privacy & Settings, ${isExpanded ? "expanded" : "collapsed"}`
      },
      /* @__PURE__ */ React.createElement("span", null, "Privacy & Settings"),
      /* @__PURE__ */ React.createElement(SearchChevronDownIcon, { expanded: isExpanded })
    ),
    (isExpanded || isClosing) && /* @__PURE__ */ React.createElement(
      "div",
      {
        id: contentId,
        className: `omniguide-privacy__content ${isClosing ? "omniguide-privacy__content--closing" : ""}`,
        role: "region",
        "aria-label": "Privacy settings options"
      },
      onToggleConsent && /* @__PURE__ */ React.createElement("div", { className: "omniguide-privacy__row" }, /* @__PURE__ */ React.createElement(
        "button",
        {
          onClick: consentDisabled ? void 0 : onToggleConsent,
          onKeyDown: handleConsentKeyDown,
          className: `omniguide-privacy__switch ${consentDisabled ? "omniguide-privacy__switch--disabled" : ""}`,
          "data-enabled": consentDisabled ? false : consentEnabled,
          role: "switch",
          "aria-checked": consentDisabled ? false : consentEnabled,
          "aria-disabled": consentDisabled || void 0,
          "aria-label": consentDisabled ? "Consent for tracking, disabled because website tracking is off" : `Consent for tracking, currently ${consentEnabled ? "enabled" : "disabled"}`,
          style: consentDisabled ? { cursor: "not-allowed", opacity: 0.5 } : void 0
        },
        /* @__PURE__ */ React.createElement("span", { className: `omniguide-privacy__knob ${!consentDisabled && consentEnabled ? "omniguide-privacy__knob--enabled" : ""}` })
      ), /* @__PURE__ */ React.createElement("span", { className: "omniguide-privacy__label", id: "consent-label" }, consentDisabled ? "Enable tracking via website cookie preferences" : /* @__PURE__ */ React.createElement(React.Fragment, null, "Consent for tracking (", /* @__PURE__ */ React.createElement("a", { className: "omniguide-privacy__oneline", href: privacyPolicyUrl }, "read more"), ")"))),
      /* @__PURE__ */ React.createElement("div", { className: "omniguide-privacy__row" }, /* @__PURE__ */ React.createElement(
        "button",
        {
          className: "omniguide-privacy__link",
          onClick: () => {
            if (onResetChat) {
              onResetChat();
            }
          },
          "aria-label": "Clear chat session"
        },
        "Clear Session"
      )),
      (supportHref || onOpenSupport) && /* @__PURE__ */ React.createElement("div", { className: "omniguide-privacy__row" }, supportHref ? /* @__PURE__ */ React.createElement(
        "a",
        {
          className: "omniguide-privacy__link",
          href: supportHref,
          target: "_blank",
          rel: "noopener noreferrer",
          onClick: onOpenSupport,
          "aria-label": supportLabel
        },
        supportLabel
      ) : /* @__PURE__ */ React.createElement(
        "button",
        {
          className: "omniguide-privacy__link",
          onClick: onOpenSupport,
          "aria-label": supportLabel
        },
        supportLabel
      )),
      /* @__PURE__ */ React.createElement("div", { style: { height: "16px" }, "aria-hidden": "true" }),
      /* @__PURE__ */ React.createElement("p", { className: "omniguide-privacy__disclaimer" }, "This conversation leverages AI. We continuously monitor to ensure quality results."),
      /* @__PURE__ */ React.createElement("p", { className: "omniguide-privacy__disclaimer" }, "Read our ", /* @__PURE__ */ React.createElement("a", { href: `${privacyPolicyUrl}/` }, "Privacy Policy"), ".")
    )
  );
};
const MAX_INPUT_LENGTH = 200;
const MAX_INPUT_ERROR_MSG = `Maximum ${MAX_INPUT_LENGTH} characters allowed`;
const SearchChatInput = ({
  onSendMessage,
  isLoading = false,
  isMobile = false,
  isCategory = false,
  isCollapsed = false,
  onCollapseToggle,
  onResetChat,
  autoFocusAfterSend = false,
  privacySettingsProps,
  connectionStatus,
  reconnectInfo,
  topSearch = false,
  onAskAssistant,
  assistantLabel,
  onValueChange,
  placeholder,
  askInitiallyExpanded = false,
  submitLabel = "Send"
}) => {
  const [input, setInput] = useState("");
  const [isInputFocused, setIsInputFocused] = useState(false);
  const [showInputLimitError, setShowInputLimitError] = useState(false);
  const [askExpanded, setAskExpanded] = useState(askInitiallyExpanded);
  const inputRef = useRef(null);
  const prevIsLoadingRef = useRef(isLoading);
  const isConnectionDisabled = connectionStatus === "connecting" || connectionStatus === "reconnecting" || connectionStatus === "disconnected";
  const isDisabled = isLoading || isConnectionDisabled;
  const countdown = useCountdown(reconnectInfo, connectionStatus === "reconnecting");
  const getPlaceholder = () => {
    if (topSearch) return "Search or ask anything…";
    if (isMobile) return placeholder ?? "Ask a question";
    if (isCategory) return placeholder ?? "Ask anything…";
    return "Ask Anything";
  };
  useEffect(() => {
    if (prevIsLoadingRef.current && !isLoading && inputRef.current && autoFocusAfterSend) {
      inputRef.current.focus({ preventScroll: true });
    }
    prevIsLoadingRef.current = isLoading;
  }, [isLoading, autoFocusAfterSend]);
  useEffect(() => {
    if (isCategory) return;
    const id = window.setTimeout(() => {
      var _a;
      return (_a = inputRef.current) == null ? void 0 : _a.focus({ preventScroll: true });
    }, 30);
    return () => window.clearTimeout(id);
  }, [isCategory]);
  useEffect(() => {
    var _a;
    if (askExpanded) {
      (_a = inputRef.current) == null ? void 0 : _a.focus({ preventScroll: true });
    }
  }, [askExpanded]);
  const handleSubmit = (e) => {
    e.preventDefault();
    if (topSearch) return;
    const trimmedInput = input.trim();
    if (trimmedInput && !isDisabled) {
      const messageToSend = trimmedInput;
      setInput("");
      onValueChange == null ? void 0 : onValueChange("");
      setShowInputLimitError(false);
      if (inputRef.current) {
        inputRef.current.value = "";
      }
      onSendMessage(messageToSend);
    }
  };
  const handleInputChange = (e) => {
    const value = e.target.value;
    setInput(value);
    onValueChange == null ? void 0 : onValueChange(value);
    setShowInputLimitError(value.length >= MAX_INPUT_LENGTH);
  };
  const handleInputPaste = (e) => {
    var _a;
    const pastedText = ((_a = e.clipboardData) == null ? void 0 : _a.getData("text")) || "";
    const currentValue = input;
    const target = e.target;
    const selectionStart = target.selectionStart || 0;
    const selectionEnd = target.selectionEnd || 0;
    const resultingLength = currentValue.length - (selectionEnd - selectionStart) + pastedText.length;
    if (resultingLength > MAX_INPUT_LENGTH) {
      setShowInputLimitError(true);
    }
  };
  const handleFocus = () => {
    setIsInputFocused(true);
    if (isCollapsed && onCollapseToggle) {
      onCollapseToggle();
    }
  };
  const inputId = isMobile ? "chat-input-mobile" : "chat-input";
  const errorId = isMobile ? "chat-input-error-mobile" : "chat-input-error";
  if (isMobile) {
    return /* @__PURE__ */ React.createElement("div", { className: "omniguide-chat__mobile-input" }, /* @__PURE__ */ React.createElement(
      "form",
      {
        onSubmit: handleSubmit,
        className: "omniguide-chat__mobile-input-form",
        role: "search",
        "aria-label": "Ask a question"
      },
      /* @__PURE__ */ React.createElement("label", { htmlFor: inputId, className: "sr-only" }, "Type your question"),
      /* @__PURE__ */ React.createElement(
        "input",
        {
          id: inputId,
          ref: inputRef,
          type: "text",
          value: input,
          onChange: handleInputChange,
          onPaste: handleInputPaste,
          placeholder: getPlaceholder(),
          disabled: isDisabled,
          maxLength: MAX_INPUT_LENGTH,
          className: "omniguide-chat__mobile-input-field",
          "aria-describedby": showInputLimitError ? errorId : void 0,
          "aria-invalid": showInputLimitError
        }
      ),
      /* @__PURE__ */ React.createElement(
        "button",
        {
          type: "submit",
          disabled: !input.trim() || isDisabled,
          className: "omniguide-chat__mobile-submit-btn",
          "data-disabled": !input.trim() || isDisabled,
          "aria-label": isLoading ? "Sending message..." : "Send message"
        },
        /* @__PURE__ */ React.createElement("svg", { width: "18", height: "18", viewBox: "0 0 24 24", fill: "none", xmlns: "http://www.w3.org/2000/svg", "aria-hidden": "true" }, /* @__PURE__ */ React.createElement("path", { d: "M5 12H19M19 12L12 5M19 12L12 19", stroke: "currentColor", strokeWidth: "2.5", strokeLinecap: "round", strokeLinejoin: "round" }))
      )
    ), showInputLimitError && /* @__PURE__ */ React.createElement("p", { id: errorId, className: "omniguide-chat__input-error", role: "alert", "aria-live": "assertive" }, MAX_INPUT_ERROR_MSG));
  }
  return /* @__PURE__ */ React.createElement("div", { className: `omniguide-chat__input-container ${topSearch ? "omniguide-chat__input-container--top" : ""} ${isCategory ? "omniguide-chat__input-container--category" : ""} ${isCollapsed ? "omniguide-chat__input-container--collapsed" : ""}` }, isCategory && !askExpanded ? /* @__PURE__ */ React.createElement(
    "button",
    {
      type: "button",
      className: "omniguide-chat__ask-toggle",
      onClick: () => setAskExpanded(true)
    },
    "or, ask a question"
  ) : /* @__PURE__ */ React.createElement(
    "form",
    {
      onSubmit: handleSubmit,
      className: `omniguide-chat__input-form ${topSearch ? "omniguide-chat__input-form--top" : ""} ${isCategory ? "omniguide-chat__input-form--category" : ""}`,
      "data-focused": isInputFocused,
      role: "search",
      "aria-label": "Ask a question"
    },
    topSearch && /* @__PURE__ */ React.createElement("span", { className: "omniguide-chat__input-leading-icon", "aria-hidden": "true" }, /* @__PURE__ */ React.createElement(SearchMagnifierIcon, null)),
    isCategory && /* @__PURE__ */ React.createElement("span", { className: "omniguide-chat__input-search-icon", "aria-hidden": "true" }, /* @__PURE__ */ React.createElement("svg", { width: "20", height: "20", viewBox: "0 0 24 24", fill: "none", xmlns: "http://www.w3.org/2000/svg" }, /* @__PURE__ */ React.createElement("circle", { cx: "11", cy: "11", r: "7", stroke: "currentColor", strokeWidth: "2" }), /* @__PURE__ */ React.createElement("path", { d: "m20 20-3.5-3.5", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round" }))),
    /* @__PURE__ */ React.createElement("label", { htmlFor: inputId, className: "sr-only" }, "Type your question"),
    /* @__PURE__ */ React.createElement(
      "input",
      {
        id: inputId,
        ref: inputRef,
        type: "text",
        value: input,
        onChange: handleInputChange,
        onPaste: handleInputPaste,
        placeholder: getPlaceholder(),
        disabled: isDisabled,
        maxLength: MAX_INPUT_LENGTH,
        autoFocus: topSearch,
        className: `omniguide-chat__input ${isCategory ? "omniguide-chat__input--category" : ""}`,
        "aria-describedby": showInputLimitError ? errorId : void 0,
        "aria-invalid": showInputLimitError,
        onFocus: handleFocus,
        onBlur: (e) => {
          var _a, _b;
          if ((_b = (_a = e.relatedTarget) == null ? void 0 : _a.matches) == null ? void 0 : _b.call(_a, "a, button, input, select, textarea")) {
            return;
          }
          setIsInputFocused(false);
        }
      }
    ),
    topSearch && // Decorative, and marked as such (SOI-2263). The design puts an
    // arrow here, but keyword search is a separate ticket, so this
    // control does nothing. A focusable button announced "Search"
    // that then does nothing is worse than no control at all — the
    // shopper cannot tell it from a broken one, and a screen-reader
    // user is told an action exists that does not. So it leaves the
    // a11y tree and the tab order entirely, and the CSS drops its
    // pointer affordances. Give it behaviour in the follow-up ticket
    // and this reverts to a real button.
    /* @__PURE__ */ React.createElement("span", { className: "omniguide-chat__go-btn", "aria-hidden": "true" }, /* @__PURE__ */ React.createElement("svg", { width: "18", height: "18", viewBox: "0 0 24 24", fill: "none", "aria-hidden": "true" }, /* @__PURE__ */ React.createElement("path", { d: "M5 12H19M19 12L12 5M19 12L12 19", stroke: "currentColor", strokeWidth: "2.5", strokeLinecap: "round", strokeLinejoin: "round" }))),
    topSearch && onAskAssistant && /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement("span", { className: "omniguide-chat__or", "aria-hidden": "true" }, "or"), /* @__PURE__ */ React.createElement(
      "button",
      {
        type: "button",
        className: "omniguide-chat__ask-btn",
        disabled: isDisabled,
        onClick: () => onAskAssistant(input.trim())
      },
      /* @__PURE__ */ React.createElement("svg", { width: "13", height: "13", viewBox: "0 0 12 12", "aria-hidden": "true" }, /* @__PURE__ */ React.createElement("path", { d: "M2.5 1.2 10 6l-7.5 4.8Z", fill: "currentColor" })),
      /* @__PURE__ */ React.createElement("span", { className: "omniguide-chat__ask-btn-label" }, (assistantLabel == null ? void 0 : assistantLabel.trim()) || "Ask the assistant")
    )),
    !topSearch && /* @__PURE__ */ React.createElement(
      "button",
      {
        type: "submit",
        disabled: !input.trim() || isDisabled,
        className: `omniguide-chat__submit-btn ${isCategory ? "omniguide-chat__submit-btn--category" : ""}`,
        "data-disabled": !input.trim() || isDisabled,
        "data-focused": isInputFocused,
        "aria-label": isLoading ? "Sending message..." : "Send message"
      },
      /* @__PURE__ */ React.createElement("span", { className: "omniguide-chat__submit-label" }, submitLabel),
      /* @__PURE__ */ React.createElement("svg", { xmlns: "http://www.w3.org/2000/svg", width: "19", height: "19", viewBox: "0 0 19 19", fill: "none", "aria-hidden": "true", focusable: "false" }, /* @__PURE__ */ React.createElement("path", { d: "M14.2002 7.90792L7.9422 1.64991L9.5921 0L18.6667 9.07459L9.5921 18.149L7.9422 16.4991L14.2002 10.2413H0V7.90792H14.2002Z", fill: "currentColor" }))
    )
  ), showInputLimitError && /* @__PURE__ */ React.createElement("p", { id: errorId, className: "omniguide-chat__input-error", role: "alert", "aria-live": "assertive" }, MAX_INPUT_ERROR_MSG), !topSearch && (privacySettingsProps || isCategory && isConnectionDisabled) && /* @__PURE__ */ React.createElement("div", { className: "omniguide-chat__input-footer" }, privacySettingsProps ? /* @__PURE__ */ React.createElement(
    SearchPrivacySettings,
    {
      ...privacySettingsProps,
      isMobile: false,
      onResetChat
    }
  ) : /* @__PURE__ */ React.createElement("div", null), isCategory && isConnectionDisabled && /* @__PURE__ */ React.createElement("span", { className: "omniguide-chat__input-status" }, connectionStatus === "disconnected" ? "Unable to connect" : connectionStatus === "reconnecting" && reconnectInfo && reconnectInfo.attempt >= 2 ? countdown !== null && countdown > 0 ? `Next try in ${countdown}s (${reconnectInfo.attempt}/${reconnectInfo.maxAttempts})` : /* @__PURE__ */ React.createElement(React.Fragment, null, "Reconnecting", /* @__PURE__ */ React.createElement("span", { className: "omniguide-chat__connecting-dots" }, /* @__PURE__ */ React.createElement("span", null, "."), /* @__PURE__ */ React.createElement("span", null, "."), /* @__PURE__ */ React.createElement("span", null, ".")), " (", reconnectInfo.attempt, "/", reconnectInfo.maxAttempts, ")") : /* @__PURE__ */ React.createElement(React.Fragment, null, "Connecting", /* @__PURE__ */ React.createElement("span", { className: "omniguide-chat__connecting-dots" }, /* @__PURE__ */ React.createElement("span", null, "."), /* @__PURE__ */ React.createElement("span", null, "."), /* @__PURE__ */ React.createElement("span", null, "."))))));
};
function useProductUrlFetching({
  messages,
  fetchProductUrls
}) {
  const [productUrls, setProductUrls] = useState({});
  const fetchedSkusRef = useRef(/* @__PURE__ */ new Set());
  const pendingFetchRef = useRef(null);
  const allSkus = useMemo(() => {
    const skus = /* @__PURE__ */ new Set();
    messages.forEach((msg) => {
      if (msg.role === "assistant" && msg.content) {
        const extractedSkus = extractSkusFromMarkdown(msg.content);
        extractedSkus.forEach((sku) => skus.add(sku));
      }
    });
    return Array.from(skus);
  }, [messages]);
  useEffect(() => {
    const fetchedSkus = fetchedSkusRef.current;
    const pendingFetch = pendingFetchRef;
    return () => {
      fetchedSkus.clear();
      if (pendingFetch.current) {
        clearTimeout(pendingFetch.current);
      }
    };
  }, []);
  useEffect(() => {
    if (!fetchProductUrls) return;
    const newSkus = allSkus.filter((sku) => !fetchedSkusRef.current.has(sku));
    if (newSkus.length === 0) return;
    if (pendingFetchRef.current) {
      clearTimeout(pendingFetchRef.current);
    }
    pendingFetchRef.current = setTimeout(() => {
      const skusToFetch = allSkus.filter((sku) => !fetchedSkusRef.current.has(sku));
      if (skusToFetch.length > 0) {
        skusToFetch.forEach((sku) => fetchedSkusRef.current.add(sku));
        fetchProductUrls(skusToFetch).then((urls) => {
          setProductUrls((prev) => ({ ...prev, ...urls }));
        });
      }
    }, 150);
    return () => {
      if (pendingFetchRef.current) {
        clearTimeout(pendingFetchRef.current);
      }
    };
  }, [allSkus, fetchProductUrls]);
  return { productUrls };
}
function useChatNavigation({
  messages,
  variant,
  controlledIndex,
  onMessageIndexChange,
  chatPanelRef,
  isMobile = false
}) {
  const [internalMessageIndex, setInternalMessageIndex] = useState(0);
  const prevQaPairsLengthRef = useRef(0);
  const userNavigatedRef = useRef(false);
  const currentMessageIndex = controlledIndex !== void 0 ? controlledIndex : internalMessageIndex;
  const qaPairs = useMemo(() => {
    const pairs = [];
    let currentPair = null;
    const chronologicalMessages = [...messages].reverse();
    for (const message of chronologicalMessages) {
      const msgType = message["type"];
      if (msgType === "thinking") {
        pairs.push({ type: "thinking", id: message.id });
      } else if (message.role === "user") {
        currentPair = { userMessage: message, assistantMessage: null };
        pairs.push(currentPair);
      } else if (message.role === "assistant" && currentPair && !currentPair.assistantMessage) {
        currentPair.assistantMessage = message;
      }
    }
    return pairs;
  }, [messages]);
  useEffect(() => {
    const prevLength = prevQaPairsLengthRef.current;
    if (!onMessageIndexChange && qaPairs.length > 0) {
      if (qaPairs.length > prevLength) {
        setInternalMessageIndex(qaPairs.length - 1);
        userNavigatedRef.current = false;
      } else if (qaPairs.length < prevLength) {
        setInternalMessageIndex(qaPairs.length - 1);
      }
    }
    if (qaPairs.length > prevLength && variant === "category" && isMobile && (chatPanelRef == null ? void 0 : chatPanelRef.current)) {
      setTimeout(() => {
        const fixedHeader = document.querySelector("header");
        const headerHeight = fixedHeader ? fixedHeader.offsetHeight : 120;
        const padding = 20;
        const elementTop = chatPanelRef.current.getBoundingClientRect().top;
        const scrollTop = window.pageYOffset + elementTop - headerHeight - padding;
        window.scrollTo({
          top: Math.max(0, scrollTop),
          behavior: "smooth"
        });
      }, 100);
    }
    prevQaPairsLengthRef.current = qaPairs.length;
  }, [qaPairs.length, variant, onMessageIndexChange, chatPanelRef, isMobile]);
  const canGoUp = currentMessageIndex > 0;
  const canGoDown = currentMessageIndex < qaPairs.length - 1;
  const currentIndexRef = useRef(currentMessageIndex);
  const qaPairsLengthRef = useRef(qaPairs.length);
  currentIndexRef.current = currentMessageIndex;
  qaPairsLengthRef.current = qaPairs.length;
  const handleNavigateUp = useCallback(() => {
    const idx = currentIndexRef.current;
    if (idx <= 0) return;
    const newIndex = idx - 1;
    if (onMessageIndexChange) {
      onMessageIndexChange(newIndex);
    } else {
      setInternalMessageIndex(newIndex);
      userNavigatedRef.current = true;
    }
  }, [onMessageIndexChange]);
  const handleNavigateDown = useCallback(() => {
    const idx = currentIndexRef.current;
    const maxIdx = qaPairsLengthRef.current - 1;
    if (idx >= maxIdx) return;
    const newIndex = idx + 1;
    if (onMessageIndexChange) {
      onMessageIndexChange(newIndex);
    } else {
      setInternalMessageIndex(newIndex);
      userNavigatedRef.current = true;
    }
  }, [onMessageIndexChange]);
  const setMessageIndex = useCallback((index) => {
    if (onMessageIndexChange) {
      onMessageIndexChange(index);
    } else {
      setInternalMessageIndex(index);
      userNavigatedRef.current = true;
    }
  }, [onMessageIndexChange]);
  return {
    qaPairs,
    currentMessageIndex,
    canGoUp,
    canGoDown,
    handleNavigateUp,
    handleNavigateDown,
    setMessageIndex
  };
}
const log$8 = createScopedLogger("ScrollTracking");
const CHAT_PROMPT_TEXT = "Ask a question.";
const SearchChatPanel = ({
  messages,
  onSendMessage,
  isMobile = false,
  isCollapsed = false,
  isLoading = false,
  pipelineStatus = "idle",
  onIntentAnswer,
  onCustomIntentAnswer,
  onClarificationAnswer,
  onCustomClarificationAnswer,
  onCollapseToggle,
  onResetChat,
  variant = "search",
  suggestedQuestions = [],
  seedQuestions = [],
  welcomeText = "",
  currentMessageIndex: controlledIndex,
  onMessageIndexChange,
  isCompactMode = false,
  fetchProductUrls,
  conversationId,
  FeedbackWidgetComponent,
  privacySettingsProps,
  defaultSearchExamples,
  connectionStatus,
  onRetryConnection,
  reconnectInfo,
  onScrollForMoreTapped,
  onScrollStarted,
  onInlineProductLinkClick,
  hideInput = false,
  liveQuery = "",
  typeahead = false,
  aiSearchStoreUrl,
  emptyStateFooter,
  hideMobileAskBox = false,
  mobileAskPlaceholder,
  askInitiallyExpanded = false,
  submitLabel,
  onSeeAllResults,
  assistantLabel
}) => {
  var _a, _b, _c, _d, _e, _f;
  const SearchEmptyState$1 = useComponent("SearchEmptyState", SearchEmptyState);
  const SearchQAMessage$1 = useComponent("SearchQAMessage", SearchQAMessage);
  const SearchConnectionError$1 = useComponent("SearchConnectionError", SearchConnectionError);
  const SearchConnectionBanner$1 = useComponent("SearchConnectionBanner", SearchConnectionBanner);
  const isConnectionDisabled = connectionStatus === "connecting" || connectionStatus === "reconnecting" || connectionStatus === "disconnected";
  const [selectedSuggestions, setSelectedSuggestions] = useState([]);
  const [hasMoreToScroll, setHasMoreToScroll] = useState(false);
  const [hasUserScrolled, setHasUserScrolled] = useState(false);
  const chatPanelRef = useRef(null);
  const messagesContainerRef = useRef(null);
  const scrollTrackedRef = useRef(/* @__PURE__ */ new Set());
  const { productUrls } = useProductUrlFetching({ messages, fetchProductUrls });
  const {
    qaPairs,
    currentMessageIndex,
    canGoUp,
    canGoDown,
    handleNavigateUp,
    handleNavigateDown
  } = useChatNavigation({
    messages,
    variant,
    controlledIndex,
    onMessageIndexChange,
    chatPanelRef,
    isMobile
  });
  const currentPair = qaPairs[currentMessageIndex];
  const currentMessageId = ((_a = currentPair == null ? void 0 : currentPair.assistantMessage) == null ? void 0 : _a.id) ?? ((_b = currentPair == null ? void 0 : currentPair.userMessage) == null ? void 0 : _b.id) ?? "";
  const onScrollStartedRef = useRef(onScrollStarted);
  onScrollStartedRef.current = onScrollStarted;
  useEffect(() => {
    if (!isMobile || !messagesContainerRef.current) return;
    const container = messagesContainerRef.current;
    const msgId = currentMessageId;
    const checkScrollable = () => {
      const isScrollable = container.scrollHeight > container.clientHeight;
      const isAtBottom = container.scrollHeight - container.scrollTop - container.clientHeight < 20;
      setHasMoreToScroll(isScrollable && !isAtBottom);
    };
    const handleScroll = () => {
      var _a2;
      checkScrollable();
      if (container.scrollTop > 0) {
        setHasUserScrolled(true);
        if (msgId && !scrollTrackedRef.current.has(msgId)) {
          const minScroll = Math.max(30, container.scrollHeight * 0.05);
          log$8.debug("Scroll detected:", { msgId, scrollTop: container.scrollTop, minScroll, scrollHeight: container.scrollHeight });
          if (container.scrollTop >= minScroll) {
            scrollTrackedRef.current.add(msgId);
            log$8.debug("Firing onScrollStarted for message:", msgId);
            (_a2 = onScrollStartedRef.current) == null ? void 0 : _a2.call(onScrollStartedRef, msgId);
          }
        }
      }
    };
    checkScrollable();
    setHasUserScrolled(false);
    container.addEventListener("scroll", handleScroll, { passive: true });
    const observer = new ResizeObserver(checkScrollable);
    observer.observe(container);
    return () => {
      container.removeEventListener("scroll", handleScroll);
      observer.disconnect();
    };
  }, [isMobile, messages, currentMessageIndex, isCollapsed, currentMessageId]);
  const handleScrollIndicatorClick = useCallback(() => {
    if (currentMessageId && onScrollForMoreTapped) {
      log$8.debug("Scroll indicator tapped for message:", currentMessageId);
      onScrollForMoreTapped(currentMessageId);
    }
  }, [currentMessageId, onScrollForMoreTapped]);
  const handleExampleClick = (example) => {
    onSendMessage(example);
  };
  const handleSuggestionClick = (suggestion) => {
    setSelectedSuggestions((prev) => [...prev, suggestion]);
    onSendMessage(suggestion);
  };
  const handleIntentAnswer = (answerText, answerId, options = {}) => {
    if (onIntentAnswer) onIntentAnswer(answerText, answerId, options);
  };
  const handleCustomIntentAnswer = (customText) => {
    if (onCustomIntentAnswer) {
      onCustomIntentAnswer(customText);
    } else {
      onSendMessage(customText);
    }
  };
  const handleClarificationAnswer = (answerText, optionId, paramName) => {
    if (onClarificationAnswer) onClarificationAnswer(answerText, optionId, paramName);
  };
  const handleCustomClarificationAnswer = (customText) => {
    if (onCustomClarificationAnswer) {
      onCustomClarificationAnswer(customText);
    } else {
      onSendMessage(customText);
    }
  };
  const renderMessages = () => {
    var _a2;
    if (qaPairs.length === 0) return null;
    const pair = qaPairs[currentMessageIndex];
    if (!pair) return null;
    const key = pair.type === "thinking" ? pair.id : (_a2 = pair.userMessage) == null ? void 0 : _a2.id;
    const isLatest = currentMessageIndex === qaPairs.length - 1;
    return /* @__PURE__ */ React.createElement("div", { key }, pair.type === "thinking" ? /* @__PURE__ */ React.createElement(SearchThinkingIndicator, null) : pair.userMessage ? /* @__PURE__ */ React.createElement(
      SearchQAMessage$1,
      {
        userMessage: pair.userMessage,
        assistantMessage: pair.assistantMessage,
        onSuggestionClick: handleSuggestionClick,
        onIntentAnswer: handleIntentAnswer,
        onCustomIntentAnswer: handleCustomIntentAnswer,
        onClarificationAnswer: handleClarificationAnswer,
        onCustomClarificationAnswer: handleCustomClarificationAnswer,
        selectedSuggestions,
        pipelineStatus: isLatest ? pipelineStatus : void 0,
        isLoading: isLatest ? isLoading : false,
        variant,
        productUrls,
        connectionStatus: isLatest ? connectionStatus : void 0,
        reconnectInfo: isLatest ? reconnectInfo : void 0,
        isMobile,
        conversationId,
        FeedbackWidgetComponent,
        onInlineProductLinkClick
      }
    ) : null);
  };
  const isCategory = variant === "category";
  const autoFocusAfterSend = !isMobile && variant === "search";
  if (isMobile) {
    return /* @__PURE__ */ React.createElement(
      "div",
      {
        className: `omniguide-chat omniguide-chat--mobile ${isCollapsed ? "omniguide-chat--mobile-collapsed" : ""}`,
        style: { display: "flex", flexDirection: "column", flex: 1, minHeight: 0 },
        role: "region",
        "aria-label": "Product assistant chat",
        "aria-busy": isLoading
      },
      isCollapsed && messages.length > 0 && /* @__PURE__ */ React.createElement("div", { className: "omniguide-chat__mobile-nav-row" }, /* @__PURE__ */ React.createElement(
        "button",
        {
          type: "button",
          className: "omniguide-chat__expand-btn",
          onClick: onCollapseToggle,
          "aria-label": "Expand to see answer"
        },
        /* @__PURE__ */ React.createElement("span", null, "See answer"),
        /* @__PURE__ */ React.createElement("svg", { viewBox: "0 0 24 24", width: "16", height: "16", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round" }, /* @__PURE__ */ React.createElement("polyline", { points: "6 9 12 15 18 9" }))
      )),
      !isCollapsed && messages.length > 0 && /* @__PURE__ */ React.createElement(
        SearchNavigationButtons,
        {
          canGoUp,
          canGoDown,
          onNavigateUp: handleNavigateUp,
          onNavigateDown: handleNavigateDown,
          currentIndex: currentMessageIndex,
          totalCount: qaPairs.length,
          timestamp: (_d = (_c = qaPairs[currentMessageIndex]) == null ? void 0 : _c.userMessage) == null ? void 0 : _d.timestamp,
          isMobile: true
        }
      ),
      /* @__PURE__ */ React.createElement(
        "div",
        {
          className: `omniguide-chat__mobile-content ${isCollapsed ? "omniguide-chat__mobile-content--collapsed" : ""}`,
          ref: messagesContainerRef,
          role: "log",
          "aria-live": "polite",
          "aria-label": "Conversation messages",
          "aria-relevant": "additions",
          "aria-hidden": isCollapsed
        },
        messages.length === 0 ? connectionStatus === "disconnected" ? /* @__PURE__ */ React.createElement(SearchConnectionError$1, { onRetry: onRetryConnection, isMobile: true }) : /* @__PURE__ */ React.createElement(SearchEmptyState$1, { onExampleClick: handleExampleClick, isMobile: true, variant, suggestedQuestions, seedQuestions, welcomeText, defaultSearchExamples, disabled: isConnectionDisabled, connectionStatus, reconnectInfo }) : /* @__PURE__ */ React.createElement("div", { className: "omniguide-chat__mobile-full-content omniguide-chat__message-content", style: { paddingTop: "8px", paddingBottom: "8px" } }, renderMessages(), isConnectionDisabled && /* @__PURE__ */ React.createElement(
          SearchConnectionBanner$1,
          {
            status: connectionStatus === "disconnected" ? "disconnected" : "reconnecting",
            onRetry: onRetryConnection,
            reconnectInfo
          }
        )),
        hasMoreToScroll && !isCollapsed && /* @__PURE__ */ React.createElement("div", { className: "omniguide-chat__scroll-fade" }, /* @__PURE__ */ React.createElement("div", { className: `omniguide-chat__scroll-indicator ${hasUserScrolled ? "omniguide-chat__scroll-indicator--no-animate" : ""}`, onClick: handleScrollIndicatorClick, role: "button", tabIndex: 0, "aria-label": "Scroll for more content", style: { pointerEvents: "auto", cursor: "pointer" } }, /* @__PURE__ */ React.createElement("span", null, "Scroll for more"), /* @__PURE__ */ React.createElement("svg", { viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round" }, /* @__PURE__ */ React.createElement("polyline", { points: "6 9 12 15 18 9" }))))
      ),
      !hideMobileAskBox && /* @__PURE__ */ React.createElement(
        SearchChatInput,
        {
          onSendMessage,
          isLoading,
          isMobile: true,
          isCategory,
          autoFocusAfterSend: false,
          connectionStatus,
          placeholder: mobileAskPlaceholder
        }
      )
    );
  }
  const chatClassName = isCategory ? `omniguide-chat omniguide-chat--category ${isCollapsed ? "omniguide-chat--collapsed" : ""}` : `omniguide-chat ${isCompactMode ? "omniguide-chat--compact" : ""} ${isCollapsed ? "omniguide-chat--collapsed" : ""}`;
  const handleChatAreaClick = (e) => {
    var _a2;
    const target = e.target;
    if (target === chatPanelRef.current || target.classList.contains("omniguide-chat__messages")) {
      const inputEl = (_a2 = chatPanelRef.current) == null ? void 0 : _a2.querySelector("#chat-input");
      inputEl == null ? void 0 : inputEl.focus({ preventScroll: true });
    }
  };
  return /* @__PURE__ */ React.createElement(
    "div",
    {
      ref: chatPanelRef,
      className: chatClassName,
      onClick: handleChatAreaClick,
      role: "region",
      "aria-label": "Product assistant chat",
      "aria-busy": isLoading
    },
    !isCollapsed && onCollapseToggle && isCategory && /* @__PURE__ */ React.createElement(
      "div",
      {
        className: "omniguide-chat__header omniguide-chat__header--collapsed",
        style: { borderBottom: "1px solid var(--omniguide-border-lighter)" },
        role: "region",
        "aria-label": "Ask a question section"
      },
      /* @__PURE__ */ React.createElement("h3", { className: "omniguide-chat__header-title omniguide-chat__header-title--category" }, CHAT_PROMPT_TEXT),
      /* @__PURE__ */ React.createElement(
        "button",
        {
          type: "button",
          className: "omniguide-chat__collapse-btn",
          onClick: onCollapseToggle,
          "aria-label": "Collapse question suggestions",
          "aria-expanded": "true"
        },
        /* @__PURE__ */ React.createElement(SearchCollapseToggleIcon, { isCollapsed: false })
      )
    ),
    !isCollapsed && messages.length > 0 && /* @__PURE__ */ React.createElement(
      SearchNavigationButtons,
      {
        canGoUp,
        canGoDown,
        onNavigateUp: handleNavigateUp,
        onNavigateDown: handleNavigateDown,
        currentIndex: currentMessageIndex,
        totalCount: qaPairs.length,
        timestamp: (_f = (_e = qaPairs[currentMessageIndex]) == null ? void 0 : _e.userMessage) == null ? void 0 : _f.timestamp,
        isMobile: false
      }
    ),
    !isCollapsed && /* @__PURE__ */ React.createElement(
      "div",
      {
        className: `omniguide-chat__messages ${isCategory ? "omniguide-chat__messages--category" : ""}`,
        style: onCollapseToggle && isCategory ? { paddingTop: "1rem" } : {},
        ref: messagesContainerRef,
        role: "log",
        "aria-live": "polite",
        "aria-label": "Conversation messages",
        "aria-relevant": "additions"
      },
      messages.length === 0 ? connectionStatus === "disconnected" ? /* @__PURE__ */ React.createElement(SearchConnectionError$1, { onRetry: onRetryConnection, isMobile: false }) : /* @__PURE__ */ React.createElement(SearchEmptyState$1, { onExampleClick: handleExampleClick, isMobile: false, variant, suggestedQuestions, seedQuestions, welcomeText, hideTitle: !!onCollapseToggle, defaultSearchExamples, disabled: isConnectionDisabled, connectionStatus, reconnectInfo, liveQuery, typeahead, aiSearchStoreUrl, onSeeAllResults, assistantLabel, emptyStateFooter }) : /* @__PURE__ */ React.createElement("div", { className: `omniguide-chat__message-content${isCategory ? " omniguide-chat__message-content--category" : ""}` }, renderMessages(), isConnectionDisabled && /* @__PURE__ */ React.createElement(
        SearchConnectionBanner$1,
        {
          status: connectionStatus === "disconnected" ? "disconnected" : "reconnecting",
          onRetry: onRetryConnection,
          reconnectInfo
        }
      ))
    ),
    !hideInput && /* @__PURE__ */ React.createElement(
      SearchChatInput,
      {
        onSendMessage,
        isLoading,
        isMobile: false,
        isCategory,
        isCollapsed,
        onCollapseToggle,
        onResetChat,
        autoFocusAfterSend,
        privacySettingsProps,
        connectionStatus,
        reconnectInfo,
        askInitiallyExpanded,
        submitLabel
      }
    )
  );
};
const log$7 = createScopedLogger("useChatMessageHandler");
const generateId$1 = () => `msg_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
const useChatMessageHandler = ({
  websiteId,
  setMessages,
  setIsLoading,
  setPipelineStatus,
  setIsThinking,
  setIsTimedOut,
  setError,
  setConversationId: setConversationId2,
  setSessionId: setSessionId$1,
  setPendingIntentQuestion,
  setPendingClarificationQuestion,
  currentMessageIdRef,
  hydration,
  query,
  messages,
  buildFallbackSearchUrl
}) => {
  const tokenBufferRef = useRef("");
  const tokenFlushTimeoutRef = useRef(null);
  const streamingResponseRef = useRef("");
  const hydrationRef = useRef(hydration);
  const queryRef = useRef(query);
  const messagesRef = useRef(messages);
  hydrationRef.current = hydration;
  queryRef.current = query;
  messagesRef.current = messages;
  const buildFallbackSearchUrlRef = useRef(buildFallbackSearchUrl);
  buildFallbackSearchUrlRef.current = buildFallbackSearchUrl;
  const responseTimerRef = useRef(null);
  useEffect(() => {
    responseTimerRef.current = createResponseTimer({
      onThinking: () => {
        log$7.debug('Entering "thinking" state after 3s');
        setIsThinking(true);
      },
      onTimeout: () => {
        log$7.debug("Response timed out after 10s");
        setIsTimedOut(true);
        setIsLoading(false);
        setError(ERROR_MESSAGES.TIMEOUT);
      },
      onCancel: () => {
        setIsThinking(false);
        setIsTimedOut(false);
      }
    });
    return () => {
      if (responseTimerRef.current) {
        responseTimerRef.current.destroy();
      }
    };
  }, [setIsThinking, setIsTimedOut, setIsLoading, setError]);
  useEffect(() => {
    return () => {
      if (tokenFlushTimeoutRef.current) {
        clearTimeout(tokenFlushTimeoutRef.current);
        tokenFlushTimeoutRef.current = null;
      }
    };
  }, []);
  const flushTokenBuffer = useCallback(() => {
    if (tokenBufferRef.current && currentMessageIdRef.current) {
      const bufferedContent = tokenBufferRef.current;
      tokenBufferRef.current = "";
      setMessages((prev) => prev.map(
        (m) => m.id === currentMessageIdRef.current ? { ...m, content: m.content + bufferedContent, isStreaming: true } : m
      ));
    }
  }, [setMessages, currentMessageIdRef]);
  const bufferToken = useCallback((token) => {
    tokenBufferRef.current += token;
    streamingResponseRef.current += token;
    if (tokenFlushTimeoutRef.current) {
      clearTimeout(tokenFlushTimeoutRef.current);
    }
    tokenFlushTimeoutRef.current = setTimeout(flushTokenBuffer, 50);
  }, [flushTokenBuffer]);
  const startResponseTimer = useCallback(() => {
    if (responseTimerRef.current) {
      responseTimerRef.current.start();
    }
  }, []);
  const resetStreamingState = useCallback(() => {
    streamingResponseRef.current = "";
    tokenBufferRef.current = "";
  }, []);
  const handleMessage = useCallback((msg) => {
    if (responseTimerRef.current) {
      responseTimerRef.current.cancel();
    }
    switch (msg.type) {
      case "status": {
        const status = msg.status || msg.content;
        setPipelineStatus(status === "done" ? "idle" : status);
        if (status === "done") {
          flushTokenBuffer();
          setIsLoading(false);
          if (currentMessageIdRef.current) {
            setMessages((prev) => prev.map(
              (m) => m.id === currentMessageIdRef.current ? { ...m, isStreaming: false } : m
            ));
          }
        }
        break;
      }
      case "token":
        if (msg.content) {
          bufferToken(msg.content);
        }
        break;
      case "answer":
        flushTokenBuffer();
        if (currentMessageIdRef.current && msg.content) {
          setMessages((prev) => prev.map(
            (m) => m.id === currentMessageIdRef.current ? { ...m, content: msg.content, isStreaming: false } : m
          ));
          streamingResponseRef.current = msg.content;
        }
        break;
      case "sources":
        if (msg.content && Array.isArray(msg.content)) {
          hydrationRef.current.hydrateSources(msg.content);
        }
        break;
      case "suggestions":
        if (currentMessageIdRef.current && msg.content) {
          setMessages((prev) => prev.map(
            (m) => m.id === currentMessageIdRef.current ? { ...m, suggestions: msg.content } : m
          ));
        }
        break;
      case "metadata":
        if (currentMessageIdRef.current && msg.content) {
          setMessages((prev) => prev.map(
            (m) => m.id === currentMessageIdRef.current ? { ...m, metadata: msg.content } : m
          ));
        }
        break;
      case "intent_question":
        if (msg.content) {
          setPendingIntentQuestion(msg.content);
          setIsLoading(false);
          setPipelineStatus("idle");
          setMessages((prev) => prev.map(
            (m) => m.id === currentMessageIdRef.current ? { ...m, intentQuestion: msg.content, isStreaming: false } : m
          ));
        }
        break;
      case "discovery_question": {
        if (msg.content) {
          const raw = msg.content;
          const answers = raw["answers"] || [];
          const rawChoices = raw["answer_choices"] || [];
          const discoveryQuestion = {
            question_id: raw["question_id"],
            question_text: raw["question_text"],
            question_summary: raw["question_summary"],
            sort_order: raw["sort_order"],
            is_root: raw["is_root"],
            parent_answer_id: raw["parent_answer_id"],
            answer_render_hint: raw["answer_render_hint"],
            answer_choices: rawChoices.map((choice) => {
              const count = choice["product_count"];
              const base = { id: String(choice["id"]), value: choice["value"] };
              return typeof count === "number" && Number.isFinite(count) ? { ...base, productCount: count } : base;
            }),
            // Legacy field mappings
            id: raw["question_id"],
            question: raw["question_text"],
            summary: raw["question_summary"],
            answers: answers.map((answer) => ({
              id: answer["id"],
              answer_text: answer["answer_text"],
              explanation: answer["explanation"],
              examples: answer["examples"],
              is_other_option: answer["is_other_option"],
              has_child_question: answer["has_child_question"],
              answer: answer["answer_text"]
            })),
            _isDiscoveryQuestion: true
          };
          setPendingIntentQuestion(discoveryQuestion);
          setIsLoading(false);
          setPipelineStatus("idle");
          setMessages((prev) => prev.map(
            (m) => m.id === currentMessageIdRef.current ? { ...m, intentQuestion: discoveryQuestion, isStreaming: false } : m
          ));
        }
        break;
      }
      case "clarification_question":
        if (msg.content) {
          setPendingClarificationQuestion(msg.content);
          setIsLoading(false);
          setPipelineStatus("idle");
          setMessages((prev) => prev.map(
            (m) => m.id === currentMessageIdRef.current ? { ...m, clarificationQuestion: msg.content, isStreaming: false } : m
          ));
        }
        break;
      case "session_id": {
        if (msg.content || msg.session_id) {
          const contentObj = msg.content;
          const serverSessionId = (typeof contentObj === "object" && contentObj !== null ? contentObj["session_id"] : void 0) || msg.session_id || contentObj;
          log$7.debug("Syncing session ID from server:", serverSessionId);
          setSessionId$1(serverSessionId);
          setSessionId(websiteId, serverSessionId);
        }
        break;
      }
      case "user": {
        if (msg.content) {
          const content = msg.content;
          if (content["conversation_id"]) {
            setConversationId2(content["conversation_id"]);
          }
          if (content["session_id"]) {
            const serverSessionId = content["session_id"];
            log$7.debug("Syncing session ID from user message:", serverSessionId);
            setSessionId$1(serverSessionId);
            setSessionId(websiteId, serverSessionId);
          }
          if (content["message_id"] && currentMessageIdRef.current) {
            setMessages((prev) => prev.map(
              (m) => m.id === currentMessageIdRef.current ? { ...m, serverMessageId: content["message_id"] } : m
            ));
          }
        }
        break;
      }
      case "error": {
        const rawError = msg.content || "An error occurred";
        log$7.error("Search WebSocket error:", rawError);
        setError("We encountered an error while processing your request. Please try again.");
        setIsLoading(false);
        setPipelineStatus("idle");
        const lastUserMessage = messagesRef.current.filter((m) => m.role === "user").pop();
        const userQuery = (lastUserMessage == null ? void 0 : lastUserMessage.content) || queryRef.current || "";
        setMessages((prev) => {
          const filtered = prev.filter((m) => m.type !== "thinking");
          const errorMessage = {
            id: generateId$1(),
            role: "assistant",
            content: ERROR_MESSAGES.GENERIC,
            isError: true,
            timestamp: /* @__PURE__ */ new Date(),
            fallbackSearch: userQuery ? {
              query: userQuery,
              url: buildFallbackSearchUrlRef.current ? buildFallbackSearchUrlRef.current(userQuery) : `?q=${encodeURIComponent(userQuery)}`
            } : void 0
          };
          return [errorMessage, ...filtered];
        });
        break;
      }
      case "products":
        if (currentMessageIdRef.current && msg.content && Array.isArray(msg.content)) {
          log$7.debug("Hydrating products:", msg.content.length);
          hydrationRef.current.hydrateProducts(msg.content);
        } else {
          log$7.debug("Products received but skipped:", {
            hasMessageId: !!currentMessageIdRef.current,
            hasContent: !!msg.content,
            isArray: Array.isArray(msg.content)
          });
        }
        break;
      case "categories":
        if (currentMessageIdRef.current && msg.content && Array.isArray(msg.content)) {
          log$7.debug("Categories received:", msg.content.length);
          hydrationRef.current.hydrateCategories(msg.content);
        }
        break;
      case "documentation":
        if (currentMessageIdRef.current && msg.content && Array.isArray(msg.content)) {
          hydrationRef.current.hydrateDocumentation(msg.content);
        }
        break;
      case "recommendations":
        if (currentMessageIdRef.current && msg.content) {
          const recContent = msg.content;
          const keyFilterQuestions = recContent["key_filter_questions"];
          setMessages((prev) => prev.map(
            (m) => m.id === currentMessageIdRef.current ? {
              ...m,
              recommendations: recContent,
              ...keyFilterQuestions ? { keyFilterQuestions } : {}
            } : m
          ));
        }
        break;
      default:
        log$7.debug("Unhandled WebSocket message type:", msg.type);
    }
  }, [
    setMessages,
    setIsLoading,
    setPipelineStatus,
    setPendingIntentQuestion,
    setPendingClarificationQuestion,
    setConversationId2,
    setSessionId$1,
    setError,
    currentMessageIdRef,
    flushTokenBuffer,
    bufferToken,
    // websiteId is a config-level identifier that doesn't change at
    // runtime in practice — including it keeps the lint rule happy
    // without destabilizing handleMessage.
    websiteId
    // hydration, query, messages, buildFallbackSearchUrl accessed via refs to keep handleMessage stable.
    // This prevents infinite reconnection loops in useChatConnection.
  ]);
  return {
    handleMessage,
    startResponseTimer,
    resetStreamingState,
    flushTokenBuffer,
    streamingResponseRef
  };
};
const log$6 = createScopedLogger("useChatConnection");
const useChatConnection = ({
  websiteId,
  apiBaseUrl,
  sessionId,
  onMessage,
  conversationIdRef,
  autoConnect = true,
  connectionTimeout
}) => {
  const [connectionStatus, setConnectionStatus] = useState("disconnected");
  const [reconnectInfo, setReconnectInfo] = useState(null);
  const [hasAttemptedConnection, setHasAttemptedConnection] = useState(false);
  const isConnectingRef = useRef(false);
  const wsRef = useRef(null);
  const connect = useCallback(async () => {
    var _a;
    if (!sessionId) {
      log$6.debug("Skipping connect: session id not ready");
      return;
    }
    setHasAttemptedConnection(true);
    if ((_a = wsRef.current) == null ? void 0 : _a.isConnected()) {
      return;
    }
    if (isConnectingRef.current) {
      return;
    }
    isConnectingRef.current = true;
    if (wsRef.current) {
      wsRef.current.disconnect();
      wsRef.current = null;
    }
    try {
      wsRef.current = new ChatWebSocket({
        websiteCode: websiteId,
        apiBaseUrl,
        sessionId: sessionId || "",
        connectionTimeout,
        onMessage,
        onStatusChange: (status) => {
          setConnectionStatus(status);
          if (status === "connected" || status === "disconnected") {
            setReconnectInfo(null);
          }
        },
        onError: (err) => {
          log$6.debug("WebSocket error:", err.message);
        },
        onReconnectAttempt: setReconnectInfo
      });
      wsRef.current.setConversationId(conversationIdRef.current || "");
      log$6.debug("Connecting to WebSocket:", { websiteId, apiBaseUrl });
      await wsRef.current.connect();
    } finally {
      isConnectingRef.current = false;
    }
  }, [websiteId, apiBaseUrl, sessionId, onMessage, conversationIdRef, connectionTimeout]);
  const disconnect = useCallback(() => {
    if (wsRef.current) {
      wsRef.current.disconnect();
      wsRef.current = null;
    }
  }, []);
  const sendQuery = useCallback((content, metadata = {}) => {
    if (wsRef.current) {
      wsRef.current.sendQuery(content, metadata);
    }
  }, []);
  const resetConnection = useCallback(() => {
    if (wsRef.current) {
      wsRef.current.reset();
    }
    setHasAttemptedConnection(false);
  }, []);
  const isConnected = useCallback(() => {
    var _a;
    return ((_a = wsRef.current) == null ? void 0 : _a.isConnected()) || false;
  }, []);
  const setWebSocketConversationId = useCallback((conversationId) => {
    if (wsRef.current) {
      wsRef.current.setConversationId(conversationId || "");
    }
  }, []);
  useEffect(() => {
    if (autoConnect) {
      connect().catch((err) => {
        log$6.debug("Auto-connect failed:", err.message);
      });
    }
    return () => {
      disconnect();
    };
  }, [autoConnect, connect, disconnect]);
  return {
    connectionStatus,
    hasAttemptedConnection,
    reconnectInfo,
    connect,
    disconnect,
    sendQuery,
    resetConnection,
    isConnected,
    setWebSocketConversationId
  };
};
const log$5 = createScopedLogger("bcHydration");
const PRODUCT_HYDRATE_KEYS = [
  "entityId",
  "name",
  "display_name",
  "product_line",
  "sku",
  "path",
  "url",
  "price",
  "imageUrl",
  "brandId",
  "brand",
  "defaultImage",
  "images"
];
const CATEGORY_HYDRATE_KEYS = [
  "entityId",
  "name",
  "path",
  "url",
  "imageUrl",
  "description"
];
function mergeEntityData(original, fetched, hydrateKeys) {
  if (!fetched) return original;
  if (!original) return fetched;
  const merged = { ...original };
  for (const key of hydrateKeys) {
    const originalValue = merged[key];
    const fetchedValue = fetched[key];
    const isOriginalEmpty = originalValue === null || originalValue === void 0 || typeof originalValue === "string" && originalValue.trim() === "" || typeof originalValue === "object" && originalValue !== null && Object.keys(originalValue).length === 0;
    if (isOriginalEmpty && fetchedValue !== void 0 && fetchedValue !== null) {
      merged[key] = fetchedValue;
    }
  }
  return merged;
}
const inFlightRequests = /* @__PURE__ */ new Map();
function buildRequestKey(url, websiteId, idKey, entityIds, hasToken, mode) {
  const sortedIds = [...entityIds].map(String).sort().join(",");
  return `${mode}|${url}|${websiteId}|${idKey}|${sortedIds}|${hasToken ? "tok" : "notok"}`;
}
async function fetchDataByIds(config, entityIds, endpoint, idKey, entityKey, directFetcher) {
  var _a;
  if (!entityIds || entityIds.length === 0) return [];
  const direct = config.directGraphQL;
  const useDirect = !!((direct == null ? void 0 : direct.enabled) && directFetcher);
  const proxyUrl = `${config.apiBaseUrl}${endpoint}`;
  const directToken = useDirect ? direct.getToken() ?? null : null;
  const graphqlToken = useDirect ? directToken : ((_a = config.getGraphQLToken) == null ? void 0 : _a.call(config)) ?? null;
  const url = useDirect ? direct.endpoint ?? "/graphql" : proxyUrl;
  const key = buildRequestKey(
    url,
    config.websiteId,
    idKey,
    entityIds,
    !!graphqlToken,
    useDirect ? "direct" : "proxy"
  );
  const existing = inFlightRequests.get(key);
  if (existing) return existing;
  const promise = (async () => {
    if (useDirect) {
      try {
        return await directFetcher(entityIds, {
          endpoint: direct.endpoint,
          getToken: direct.getToken
        });
      } catch (error) {
        log$5.warn("fetchDataByIds: direct request failed", endpoint, error);
        return [];
      }
    }
    try {
      const headers = {
        "Content-Type": "application/json"
      };
      if (graphqlToken) {
        headers["X-Storefront-Token"] = graphqlToken;
      }
      const response = await fetch(url, {
        method: "POST",
        headers,
        body: JSON.stringify({
          [idKey]: entityIds,
          website_code: config.websiteId,
          graphql_token: graphqlToken
        })
      });
      if (!response.ok) {
        log$5.warn("fetchDataByIds: HTTP", response.status, endpoint);
        return [];
      }
      const data = await response.json();
      return (data == null ? void 0 : data[entityKey]) || [];
    } catch (error) {
      log$5.warn("fetchDataByIds: request failed", endpoint, error);
      return [];
    }
  })();
  const tracked = promise.finally(() => {
    if (inFlightRequests.get(key) === tracked) {
      inFlightRequests.delete(key);
    }
  });
  inFlightRequests.set(key, tracked);
  return tracked;
}
async function hydrateProducts(config, products) {
  if (!products || products.length === 0) return [];
  const skusToFetch = products.map((p) => p["sku"]).filter(Boolean);
  if (skusToFetch.length === 0) return products;
  const fetchedProducts = await fetchDataByIds(
    config,
    skusToFetch,
    API_ENDPOINTS.BC_SEARCH_PRODUCTS,
    "skus",
    "products",
    (ids, options) => fetchProductsDirectGraphQL(ids.map(String), options)
  );
  const fetchedMap = /* @__PURE__ */ new Map();
  for (const product of fetchedProducts) {
    if (product.sku) {
      fetchedMap.set(product.sku, product);
    }
  }
  return products.map((original) => {
    const sku = original["sku"];
    const fetched = sku ? fetchedMap.get(sku) : void 0;
    const merged = mergeEntityData(original, fetched ?? null, PRODUCT_HYDRATE_KEYS);
    if (fetched) {
      if (!merged["image_url"] && fetched.imageUrl) {
        merged["image_url"] = fetched.imageUrl;
      }
      if (!merged["image_url"] && fetched["defaultImage"]) {
        const defaultImage = fetched["defaultImage"];
        if (defaultImage == null ? void 0 : defaultImage["url"]) {
          merged["image_url"] = defaultImage["url"];
        }
      }
      if (!merged["url"] && fetched.path) {
        merged["url"] = fetched.path;
      }
      if (!merged["product_line"] && fetched["brand"]) {
        const brand = fetched["brand"];
        if (typeof brand === "object" && brand !== null && "name" in brand) {
          merged["product_line"] = brand["name"];
        } else if (typeof brand === "string") {
          merged["product_line"] = brand;
        }
      }
      if (!merged["price"] && fetched["price"]) {
        const price = fetched["price"];
        if (typeof price === "object" && price !== null && "value" in price) {
          merged["price"] = price["value"];
        }
      }
      if (!merged["retail_price"] && fetched["price"]) {
        const price = fetched["price"];
        const retailPrice = price == null ? void 0 : price["retailPrice"];
        if (retailPrice == null ? void 0 : retailPrice["value"]) {
          merged["retail_price"] = retailPrice["value"];
        }
      }
    }
    return merged;
  });
}
async function hydrateCategories(config, categories) {
  if (!categories || categories.length === 0) return [];
  const categoryIds = categories.map((c) => parseInt(String(c["id"] || c["entityId"]), 10)).filter(Boolean);
  if (categoryIds.length === 0) return [];
  const fetchedCategories = await fetchDataByIds(
    config,
    categoryIds,
    API_ENDPOINTS.BC_SEARCH_CATEGORIES,
    "category_ids",
    "categories",
    (ids, options) => fetchCategoriesDirectGraphQL(
      ids.map((id) => typeof id === "number" ? id : parseInt(String(id), 10)),
      options
    )
  );
  const fetchedMap = /* @__PURE__ */ new Map();
  for (const category of fetchedCategories) {
    if (category.entityId) {
      fetchedMap.set(category.entityId, category);
    }
  }
  return categories.map((original) => {
    const id = parseInt(String(original["id"] || original["entityId"]), 10);
    const fetched = id ? fetchedMap.get(id) : void 0;
    return mergeEntityData(original, fetched ?? null, CATEGORY_HYDRATE_KEYS);
  });
}
async function hydrateAlternativeProduct(config, alternative) {
  if (!alternative) return null;
  try {
    const hydrated = await hydrateProducts(config, [alternative]);
    return hydrated[0] || alternative;
  } catch {
    return alternative;
  }
}
async function hydrateCurrentProduct(config, currentProduct) {
  if (!currentProduct) return null;
  try {
    const hydrated = await hydrateProducts(config, [currentProduct]);
    return hydrated[0] || currentProduct;
  } catch {
    return currentProduct;
  }
}
const log$4 = createScopedLogger("productUrls");
async function fetchProductUrlsBySkus(skus, config) {
  if (!skus || skus.length === 0) return {};
  const endpoint = config.productHydrationEndpoint ? `/api/v1${config.productHydrationEndpoint}` : API_ENDPOINTS.BC_SEARCH_PRODUCTS;
  const products = await fetchDataByIds(
    config,
    skus,
    endpoint,
    "skus",
    "products",
    (ids, options) => fetchProductsDirectGraphQL(ids.map(String), options)
  );
  const urlMap = {};
  products.forEach((product) => {
    var _a;
    const productUrl = product["url"] ?? product["path"] ?? ((_a = product["custom_url"]) == null ? void 0 : _a["url"]);
    if (product["sku"] && productUrl) {
      urlMap[String(product["sku"])] = productUrl;
    }
  });
  const missingSkus = skus.filter((sku) => !urlMap[String(sku)]);
  if (missingSkus.length > 0) {
    log$4.warn("Product URLs not found for SKUs:", missingSkus);
  }
  return urlMap;
}
const log$3 = createScopedLogger("useBCChatHydration");
function getPageContext() {
  if (typeof window === "undefined") return "search";
  if (window.location.pathname.includes("/products/")) return "product";
  if (window.location.pathname.includes("/category/")) return "category";
  return "search";
}
function parseEntityId(source) {
  return parseInt(
    String(source["id"] ?? source["product_id"] ?? source["entityId"] ?? ""),
    10
  );
}
function matchById(source, candidates) {
  const id = parseEntityId(source);
  if (isNaN(id)) return void 0;
  return candidates.find(
    (c) => c["entityId"] === id || c["id"] === id || parseInt(String(c["id"]), 10) === id
  );
}
function mergeProduct(omniguideProduct, bcProduct) {
  const merged = {
    ...omniguideProduct,
    ...bcProduct,
    // Preserve Omniguide-specific fields
    score: omniguideProduct["score"],
    is_recommended: omniguideProduct["is_recommended"],
    llm_relevance: omniguideProduct["llm_relevance"],
    tag: omniguideProduct["tag"],
    url: (bcProduct == null ? void 0 : bcProduct["path"]) ?? (bcProduct == null ? void 0 : bcProduct["url"]) ?? omniguideProduct["url"] ?? omniguideProduct["path"],
    path: (bcProduct == null ? void 0 : bcProduct["path"]) ?? omniguideProduct["path"] ?? omniguideProduct["url"]
  };
  if (!merged["url"] && !merged["path"]) {
    const searchQuery = encodeURIComponent(String(merged["sku"] ?? merged["name"] ?? ""));
    merged["url"] = `/search.php?search_query=${searchQuery}`;
    merged["path"] = `/search.php?search_query=${searchQuery}`;
  }
  return merged;
}
function mergeCategory(omniguideCategory, bcCategory) {
  return {
    ...omniguideCategory,
    ...bcCategory,
    tag: omniguideCategory["tag"],
    url: (bcCategory == null ? void 0 : bcCategory["path"]) ?? (bcCategory == null ? void 0 : bcCategory["url"]) ?? omniguideCategory["url"] ?? omniguideCategory["path"],
    path: (bcCategory == null ? void 0 : bcCategory["path"]) ?? omniguideCategory["path"] ?? omniguideCategory["url"]
  };
}
function buildFallbackProductSource(product) {
  const data = { ...product };
  if (!data["url"] && !data["path"]) {
    const searchQuery = encodeURIComponent(String(data["sku"] ?? data["name"] ?? ""));
    data["url"] = `/search.php?search_query=${searchQuery}`;
    data["path"] = `/search.php?search_query=${searchQuery}`;
  }
  return { type: "product", data };
}
function useBCChatHydration({
  storefrontToken,
  setMessages,
  currentMessageIdRef,
  trackRecommendationProvided,
  api,
  redundantContentUrls
}) {
  const hydrateProducts2 = useCallback(async (products) => {
    const items = products;
    if (!items || items.length === 0) return;
    const messageId = currentMessageIdRef.current;
    if (!messageId) return;
    setMessages((prev) => prev.map(
      (m) => m.id === messageId ? { ...m, isLoadingSources: true } : m
    ));
    try {
      const hydratedProducts = await api.fetchProductData(items, storefrontToken);
      const productSources = items.map((omniguideProduct) => ({
        type: "product",
        data: mergeProduct(omniguideProduct, matchById(omniguideProduct, hydratedProducts))
      }));
      setMessages((prev) => prev.map(
        (m) => m.id === messageId ? { ...m, sources: [...m.sources ?? [], ...productSources], isLoadingSources: false } : m
      ));
      if (trackRecommendationProvided) {
        trackRecommendationProvided({
          messageId,
          recommendationType: "products",
          itemCount: items.length,
          context: getPageContext()
        });
      }
    } catch (err) {
      log$3.error("Failed to hydrate products:", err);
      const productSources = items.map(buildFallbackProductSource);
      setMessages((prev) => prev.map(
        (m) => m.id === messageId ? { ...m, sources: [...m.sources ?? [], ...productSources], isLoadingSources: false } : m
      ));
    }
  }, [storefrontToken, setMessages, currentMessageIdRef, trackRecommendationProvided, api]);
  const hydrateCategories2 = useCallback(async (categories) => {
    const items = categories;
    if (!items || items.length === 0) return;
    const messageId = currentMessageIdRef.current;
    if (!messageId) return;
    setMessages((prev) => prev.map(
      (m) => m.id === messageId ? { ...m, isLoadingSources: true } : m
    ));
    try {
      const hydratedCategories = await api.fetchCategoryData(items, storefrontToken);
      const categorySources = items.map((omniguideCategory) => ({
        type: "category",
        data: mergeCategory(omniguideCategory, matchById(omniguideCategory, hydratedCategories))
      }));
      setMessages((prev) => prev.map(
        (m) => m.id === messageId ? { ...m, sources: [...m.sources ?? [], ...categorySources], isLoadingSources: false } : m
      ));
      if (trackRecommendationProvided) {
        trackRecommendationProvided({
          messageId,
          recommendationType: "categories",
          itemCount: items.length,
          context: getPageContext()
        });
      }
    } catch (err) {
      log$3.error("Failed to hydrate categories:", err);
      const categorySources = items.map((category) => ({ type: "category", data: category }));
      setMessages((prev) => prev.map(
        (m) => m.id === messageId ? { ...m, sources: [...m.sources ?? [], ...categorySources], isLoadingSources: false } : m
      ));
    }
  }, [storefrontToken, setMessages, currentMessageIdRef, trackRecommendationProvided, api]);
  const hydrateSources = useCallback(async (apiSources) => {
    const items = apiSources;
    if (!items || items.length === 0) return;
    const messageId = currentMessageIdRef.current;
    if (!messageId) return;
    setMessages((prev) => prev.map(
      (m) => m.id === messageId ? { ...m, isLoadingSources: true, pendingSources: items } : m
    ));
    try {
      const productData = items.filter((s) => s["type"] === "product");
      const categoryData = items.filter((s) => s["type"] === "category");
      const contentDocuments = items.filter((s) => s["type"] === "content");
      const [products, categories, content] = await Promise.all([
        productData.length > 0 ? api.fetchProductData(productData, storefrontToken) : [],
        categoryData.length > 0 ? api.fetchCategoryData(categoryData, storefrontToken) : [],
        contentDocuments.length > 0 ? api.fetchContentData(contentDocuments) : []
      ]);
      const finalSources = items.map((source) => {
        const id = parseEntityId(source);
        switch (source["type"]) {
          case "product": {
            const product = products.find(
              (p) => p["entityId"] === id || p["id"] === id || parseInt(String(p["id"]), 10) === id
            );
            return product ? { type: "product", data: product } : null;
          }
          case "category": {
            const category = categories.find(
              (c) => c["entityId"] === id || c["id"] === id || parseInt(String(c["id"]), 10) === id
            );
            return category ? { type: "category", data: category } : null;
          }
          case "content": {
            const wpcontent = content.find((c) => c["id"] === id);
            return wpcontent ? { type: "content", data: wpcontent } : null;
          }
          default:
            return null;
        }
      }).filter(Boolean);
      setMessages((prev) => prev.map(
        (m) => m.id === messageId ? { ...m, sources: [...m.sources ?? [], ...finalSources], isLoadingSources: false } : m
      ));
    } catch (err) {
      log$3.error("Failed to hydrate sources:", err);
      setMessages((prev) => prev.map(
        (m) => m.id === messageId ? { ...m, isLoadingSources: false } : m
      ));
    }
  }, [storefrontToken, setMessages, currentMessageIdRef, api]);
  const hydrateDocumentation = useCallback((content) => {
    const messageId = currentMessageIdRef.current;
    const docs = content;
    if (!messageId || !docs || !Array.isArray(docs)) return;
    let contentSources = filterEmptyContent(docs.map((doc) => ({
      type: "content",
      data: {
        id: doc["id"],
        name: doc["title"] ?? doc["name"] ?? "",
        url: doc["url"],
        summary: doc["summary"] ?? "",
        image: doc["image"] ? { url: doc["image"], altText: doc["title"] ?? doc["name"] ?? "" } : null
      }
    })));
    if (redundantContentUrls == null ? void 0 : redundantContentUrls.length) {
      contentSources = filterRedundantContent(contentSources, redundantContentUrls);
    }
    setMessages((prev) => prev.map(
      (m) => m.id === messageId ? { ...m, sources: [...m.sources ?? [], ...contentSources], isLoadingSources: false } : m
    ));
    if (trackRecommendationProvided) {
      trackRecommendationProvided({
        messageId,
        recommendationType: "content",
        itemCount: docs.length,
        context: "search"
      });
    }
  }, [setMessages, currentMessageIdRef, trackRecommendationProvided, redundantContentUrls]);
  return {
    hydrateProducts: hydrateProducts2,
    hydrateCategories: hydrateCategories2,
    hydrateSources,
    hydrateDocumentation
  };
}
function buildBCHydrationConfig(config, platformAdapter) {
  const readToken = () => platformAdapter.getCredentials()["graphQLToken"] ?? null;
  const direct = config.directGraphQL;
  return {
    apiBaseUrl: config.apiBaseUrl,
    websiteId: config.websiteId,
    getGraphQLToken: readToken,
    ...config.productHydrationEndpoint ? { productHydrationEndpoint: config.productHydrationEndpoint } : {},
    ...(direct == null ? void 0 : direct.enabled) ? {
      directGraphQL: {
        enabled: true,
        endpoint: direct.endpoint,
        getToken: direct.getToken ?? readToken
      }
    } : {}
  };
}
const log$2 = createScopedLogger("useBCSearchChat");
const generateId = () => `msg_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
function useBCSearchChat({
  trackMessageSent,
  trackQuestionAnswered,
  trackRecommendationProvided,
  trackStartOver,
  autoConnect = true,
  sessionId: externalSessionId
} = {}) {
  var _a;
  const { config, platformAdapter } = useOmniguideContext();
  const { websiteId, apiBaseUrl, storageKeys, connectionTimeout } = config;
  const conversationStorageKey = (storageKeys == null ? void 0 : storageKeys.conversationId) ?? "aiSearchConversationId";
  const sessionStorageKey = (storageKeys == null ? void 0 : storageKeys.sessionId) ?? "aiSearchSessionId";
  const [pipelineStatus, setPipelineStatus] = useState("idle");
  const [messages, setMessages] = useState([]);
  const [query, setQuery] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [conversationId, setConversationId$1] = useState(() => {
    return getConversationId(websiteId) ?? localStorage.getItem(conversationStorageKey) ?? null;
  });
  const [sessionId, setSessionId2] = useState(() => {
    return localStorage.getItem(sessionStorageKey) ?? null;
  });
  const [error, setError] = useState(null);
  const [isThinking, setIsThinking] = useState(false);
  const [isTimedOut, setIsTimedOut] = useState(false);
  const [pendingIntentQuestion, setPendingIntentQuestion] = useState(null);
  const [pendingClarificationQuestion, setPendingClarificationQuestion] = useState(null);
  const currentMessageIdRef = useRef(null);
  const conversationIdRef = useRef(conversationId);
  const messagesRef = useRef(messages);
  messagesRef.current = messages;
  useEffect(() => {
    conversationIdRef.current = conversationId;
    setConversationId(websiteId, conversationId);
    if (conversationId) {
      localStorage.setItem(conversationStorageKey, conversationId);
    } else {
      localStorage.removeItem(conversationStorageKey);
    }
  }, [conversationId, conversationStorageKey, websiteId]);
  const hydrationConfig = useMemo(
    () => buildBCHydrationConfig(config, platformAdapter),
    [config, platformAdapter]
  );
  const api = useMemo(() => ({
    fetchProductData: (products) => hydrateProducts(hydrationConfig, products),
    fetchCategoryData: (categories) => hydrateCategories(hydrationConfig, categories),
    fetchContentData: async (content) => {
      if (!content || content.length === 0) return [];
      return filterEmptyContent(
        content.map((article) => ({
          id: article["id"],
          name: article["title"] || "",
          url: article["url"],
          summary: article["summary"] ? transformSummary(article["summary"]) : "",
          image: { url: article["image"], altText: article["name"] }
        }))
      );
    }
  }), [hydrationConfig]);
  const storefrontToken = platformAdapter.getCredentials()["storefrontToken"] ?? "";
  const hydration = useBCChatHydration({
    storefrontToken,
    setMessages,
    currentMessageIdRef,
    trackRecommendationProvided,
    api,
    redundantContentUrls: (_a = config.ui) == null ? void 0 : _a.redundantContentUrls
  });
  const { handleMessage, startResponseTimer, resetStreamingState } = useChatMessageHandler({
    websiteId,
    setMessages,
    setIsLoading,
    setPipelineStatus,
    setIsThinking,
    setIsTimedOut,
    setError,
    setConversationId: setConversationId$1,
    setSessionId: setSessionId2,
    setPendingIntentQuestion,
    setPendingClarificationQuestion,
    currentMessageIdRef,
    hydration,
    query,
    messages,
    buildFallbackSearchUrl: (q) => `/search.php?search_query=${encodeURIComponent(q)}`
  });
  const {
    connectionStatus,
    hasAttemptedConnection,
    reconnectInfo,
    connect,
    disconnect,
    sendQuery,
    resetConnection,
    isConnected,
    setWebSocketConversationId
  } = useChatConnection({
    websiteId,
    apiBaseUrl,
    sessionId: externalSessionId ?? localStorage.getItem(sessionStorageKey) ?? void 0,
    onMessage: handleMessage,
    conversationIdRef,
    autoConnect,
    connectionTimeout
  });
  useEffect(() => {
    setWebSocketConversationId(conversationId);
  }, [conversationId, setWebSocketConversationId]);
  const sendMessage = useCallback(
    async (content, metadata = {}) => {
      if (!(content == null ? void 0 : content.trim())) return;
      const userMessages = messagesRef.current.filter(
        (m) => m.role === "user"
      );
      const isFollowUp = userMessages.length > 0;
      const turnNumber = userMessages.length + 1;
      trackMessageSent == null ? void 0 : trackMessageSent({
        messageLength: content.trim().length,
        isFollowUp,
        turnNumber
      });
      resetStreamingState();
      setPendingIntentQuestion(null);
      setPendingClarificationQuestion(null);
      setError(null);
      setIsLoading(true);
      setIsThinking(false);
      setIsTimedOut(false);
      startResponseTimer();
      const userMessage = {
        id: generateId(),
        role: "user",
        content: content.trim(),
        timestamp: /* @__PURE__ */ new Date()
      };
      const assistantMessageId = generateId();
      currentMessageIdRef.current = assistantMessageId;
      const assistantMessage = {
        id: assistantMessageId,
        role: "assistant",
        content: "",
        timestamp: /* @__PURE__ */ new Date(),
        isStreaming: true,
        sources: [],
        queryContext: content.trim(),
        suggestions: []
      };
      setMessages((prev) => [assistantMessage, userMessage, ...prev]);
      if (!isConnected()) {
        try {
          await connect();
        } catch (err) {
          log$2.error("Failed to connect WebSocket:", err);
          setError("Unable to connect. Please try again.");
          setIsLoading(false);
          setMessages(
            (prev) => prev.filter((m) => m.id !== assistantMessageId)
          );
          return;
        }
      }
      try {
        sendQuery(content.trim(), metadata);
      } catch (err) {
        log$2.error("Failed to send message:", err);
        setError("Failed to send message");
        setIsLoading(false);
        setMessages(
          (prev) => prev.filter((m) => m.id !== assistantMessageId)
        );
      }
    },
    [
      isConnected,
      connect,
      sendQuery,
      trackMessageSent,
      resetStreamingState,
      startResponseTimer
    ]
  );
  const sendIntentAnswer = useCallback(
    (answerText, answerId, options = {}) => {
      var _a2;
      const question = pendingIntentQuestion;
      const isDiscoveryQuestion = question == null ? void 0 : question["_isDiscoveryQuestion"];
      const questionId = (question == null ? void 0 : question["question_id"]) ?? (question == null ? void 0 : question["id"]);
      if (questionId) {
        try {
          const storageKey = ((_a2 = config.storageKeys) == null ? void 0 : _a2.answeredIntents) ?? "aiAnsweredIntents";
          const raw = localStorage.getItem(storageKey);
          const currentIntents = raw ? JSON.parse(raw) : {};
          if (isDiscoveryQuestion) {
            currentIntents[questionId] = {
              question_id: questionId,
              answer_id: answerId ?? null,
              answer_text: answerText,
              is_other: options.isOtherAnswer || false,
              other_text: options.otherAnswerText
            };
          } else {
            currentIntents[questionId] = {
              answer_id: answerId ?? null,
              answer: answerText
            };
          }
          localStorage.setItem(storageKey, JSON.stringify(currentIntents));
        } catch (e) {
          log$2.warn("Failed to save answered intent:", e);
        }
      }
      if (trackQuestionAnswered && question) {
        trackQuestionAnswered({
          questionId,
          questionText: question["question_text"] ?? question["question"] ?? "",
          answer: answerText,
          context: isDiscoveryQuestion ? "discovery" : "intent"
        });
      }
      if (isDiscoveryQuestion) {
        const metadata = {
          discovery_question_id: questionId
        };
        if (answerId != null) {
          metadata["discovery_answer_id"] = answerId;
        }
        if (options.isOtherAnswer) {
          metadata["is_other_answer"] = true;
          metadata["other_answer_text"] = options.otherAnswerText || answerText;
        }
        sendMessage(answerText, metadata);
      } else {
        sendMessage(
          answerText,
          answerId != null ? { intent_question_answer_id: answerId } : {}
        );
      }
    },
    [sendMessage, pendingIntentQuestion, trackQuestionAnswered, config.storageKeys]
  );
  const sendClarificationAnswer = useCallback(
    (answerText, optionId, paramName) => {
      const question = pendingClarificationQuestion;
      if (trackQuestionAnswered && question) {
        trackQuestionAnswered({
          questionId: question["id"] ?? paramName,
          questionText: question["question_text"] ?? question["question"] ?? "",
          answer: answerText,
          context: "clarification"
        });
      }
      sendMessage(answerText, { [paramName]: optionId });
    },
    [sendMessage, pendingClarificationQuestion, trackQuestionAnswered]
  );
  const clearError = useCallback(() => {
    setError(null);
  }, []);
  const handleResetChat = useCallback((options) => {
    if (trackStartOver && (options == null ? void 0 : options.track) !== false) {
      trackStartOver({
        context: window.location.pathname.includes("/products/") ? "product" : window.location.pathname.includes("/category/") ? "category" : "search",
        messageCount: messagesRef.current.length
      });
    }
    setMessages([]);
    setConversationId$1(null);
    setIsLoading(false);
    setIsThinking(false);
    setIsTimedOut(false);
    setPipelineStatus("idle");
    setQuery("");
    setPendingIntentQuestion(null);
    setPendingClarificationQuestion(null);
    setError(null);
    currentMessageIdRef.current = null;
    resetStreamingState();
    resetConnection();
  }, [trackStartOver, resetStreamingState, resetConnection]);
  return {
    // Connection state
    connectionStatus,
    hasAttemptedConnection,
    reconnectInfo,
    pipelineStatus,
    isConnected: connectionStatus === "connected",
    // Chat state
    messages,
    query,
    setQuery,
    isLoading,
    conversationId,
    sessionId,
    error,
    // Latency states (Non-Negotiable #4)
    isThinking,
    isTimedOut,
    // Intent questions
    pendingIntentQuestion,
    // Clarification questions
    pendingClarificationQuestion,
    // Actions
    connect,
    disconnect,
    sendMessage,
    sendIntentAnswer,
    sendClarificationAnswer,
    handleResetChat,
    clearError,
    // Compatibility
    fetchResults: sendMessage
  };
}
const log$1 = createScopedLogger("useAnalyticsTracking");
function useAnalyticsTracking({
  websiteId
}) {
  const { config, consentService, eventService } = useOmniguideContext();
  const hasProductClickRef = useRef(false);
  const isDebug = typeof window !== "undefined" && (() => {
    try {
      return localStorage.getItem("omniguide_debug_tracking") === "true";
    } catch {
      return false;
    }
  })();
  const canTrack = useCallback((eventName) => {
    const state = consentService ? consentService.getState() : null;
    const hasConsent = state ? state.analytics : true;
    if (hasConsent) {
      if (isDebug && eventName) {
        console.log(`[Omniguide Tracking] BACKEND OK "${eventName}" | consent: initialized=${state == null ? void 0 : state.initialized} websiteConsent=${state == null ? void 0 : state.websiteConsent} omniguideConsent=${state == null ? void 0 : state.omniguideConsent}`);
      }
      return true;
    }
    if (typeof window !== "undefined" && window.location.hostname === "localhost") {
      try {
        if (localStorage.getItem("ai-debug") === "true") {
          log$1.debug("canTrack: consent=NO but bypassed (localhost + ai-debug)");
          return true;
        }
      } catch {
      }
    }
    if (isDebug && eventName) {
      console.warn(`[Omniguide Tracking] BACKEND BLOCKED "${eventName}" | consent: initialized=${state == null ? void 0 : state.initialized} websiteConsent=${state == null ? void 0 : state.websiteConsent} omniguideConsent=${state == null ? void 0 : state.omniguideConsent}`);
    }
    return false;
  }, [consentService, isDebug]);
  const track = useCallback((eventName, payload = {}) => {
    if (!config.analyticsAdapter) {
      if (isDebug) console.warn(`[Omniguide Tracking] ADAPTER SKIP "${eventName}" | no analyticsAdapter configured`);
      return;
    }
    const fullPayload = {
      timestamp: Date.now(),
      session_id: getSessionId(websiteId),
      conversation_id: getConversationId(websiteId),
      // Stamped so the dataLayer bridge can tell this event apart when the
      // adapter pushes it to window.dataLayer and the bridge reads it back.
      // Without it an SDK event is delivered to the backend twice: once here
      // via EventService, once as a storefront event on the return trip.
      [SDK_ORIGIN_MARKER]: true,
      ...payload
    };
    if (isDebug) console.log(`[Omniguide Tracking] ADAPTER "${eventName}" -> dataLayer + PostHog`);
    config.analyticsAdapter.track(eventName, fullPayload);
  }, [config.analyticsAdapter, websiteId, isDebug]);
  const sessionId = getSessionId(websiteId);
  const conversationId = getConversationId(websiteId);
  useEffect(() => {
    if (!eventService) return;
    eventService.updateContext({
      sessionId: sessionId ?? void 0,
      conversationId: conversationId ?? void 0
    });
  }, [eventService, sessionId, conversationId]);
  const trackBackend = useCallback((eventName, data) => {
    if (!canTrack(eventName)) return;
    if (!eventService) {
      if (isDebug) console.warn(`[Omniguide Tracking] BACKEND SKIP "${eventName}" | no eventService`);
      return;
    }
    eventService.track(eventName, data);
  }, [canTrack, eventService, isDebug]);
  const getJourneyMetrics = useCallback(() => {
    const sessionStart = getSessionStart(websiteId) || Date.now();
    const timeInConversation = Math.round((Date.now() - sessionStart) / 1e3);
    return {
      time_in_conversation_sec: timeInConversation,
      has_clicked_product: hasProductClickRef.current
    };
  }, [websiteId]);
  const buildAnalyticsProperties = useCallback((baseProps) => {
    return {
      ...baseProps,
      conversation_id: getConversationId(websiteId),
      session_id: getSessionId(websiteId),
      ...getJourneyMetrics()
    };
  }, [getJourneyMetrics, websiteId]);
  const trackMessageSent = useCallback(
    ({ messageLength, isFollowUp, turnNumber, context, messageType }) => {
      const data = {
        message_length: messageLength,
        is_followup: isFollowUp,
        turn_number: turnNumber,
        context,
        message_type: messageType
      };
      trackBackend("ai_search_message_sent", data);
      track("ai_search_message_sent", data);
    },
    [trackBackend, track]
  );
  const trackProductClick = useCallback(
    ({ messageId, productId, productSku, position, queryContext }) => {
      hasProductClickRef.current = true;
      track("ai_search_product_click", buildAnalyticsProperties({
        message_id: messageId,
        product_id: productId,
        product_sku: productSku,
        position,
        query: queryContext
      }));
    },
    [buildAnalyticsProperties, track]
  );
  const trackCategoryClick = useCallback(
    ({ messageId, categoryId, name, url, position, queryContext }) => {
      hasProductClickRef.current = true;
      const backendData = {
        message_id: messageId,
        category_id: categoryId,
        category_name: name,
        category_url: url,
        category_position: position,
        query_context: queryContext
      };
      trackBackend("ai_search_category_click", backendData);
      track("ai_search_category_click", buildAnalyticsProperties({
        message_id: messageId,
        category_id: categoryId,
        category_name: name,
        category_url: url,
        position,
        query: queryContext
      }));
    },
    [trackBackend, buildAnalyticsProperties, track]
  );
  const trackContentClick = useCallback(
    ({ messageId, contentId, title, url, position, queryContext }) => {
      hasProductClickRef.current = true;
      const backendData = {
        message_id: messageId,
        content_id: contentId,
        content_title: title,
        content_url: url,
        content_position: position,
        query_context: queryContext
      };
      trackBackend("ai_search_content_click", backendData);
      track("ai_search_content_click", buildAnalyticsProperties({
        message_id: messageId,
        content_id: contentId,
        content_title: title,
        content_url: url,
        position,
        query: queryContext
      }));
    },
    [trackBackend, buildAnalyticsProperties, track]
  );
  const trackFeedback = useCallback(
    ({ messageId, feedbackType, turnNumber }) => {
      const data = {
        message_id: messageId,
        feedback_type: feedbackType,
        conversation_turn: turnNumber
      };
      trackBackend("ai_search_feedback", data);
      track("ai_search_feedback", data);
    },
    [trackBackend, track]
  );
  const trackComponentClose = useCallback(
    ({ sessionDurationMs, totalMessages }) => {
      const durationSeconds = Math.round(sessionDurationMs / 1e3);
      const data = {
        session_duration_ms: sessionDurationMs,
        session_duration: durationSeconds,
        message_count: totalMessages,
        product_clicked: hasProductClickRef.current
      };
      trackBackend("ai_search_closed", data);
      track("ai_search_closed", data);
      hasProductClickRef.current = false;
    },
    [trackBackend, track]
  );
  const trackSearchOpened = useCallback(
    ({ source, page_type }) => {
      const data = { source, page_type };
      trackBackend("ai_search_opened", data);
      track("ai_search_opened", data);
    },
    [trackBackend, track]
  );
  const trackQuestionAnswered = useCallback(
    ({ questionId, questionText, answer, context }) => {
      const data = {
        question_id: questionId,
        question_text: questionText,
        answer,
        context
      };
      trackBackend("ai_search_question_answered", data);
      track("ai_search_question_answered", data);
    },
    [trackBackend, track]
  );
  const trackRecommendationProvided = useCallback(
    ({ messageId, recommendationType, itemCount, context }) => {
      const data = {
        message_id: messageId,
        recommendation_type: recommendationType,
        item_count: itemCount,
        context
      };
      trackBackend("ai_search_recommendation_provided", data);
      track("ai_search_recommendation_provided", data);
    },
    [trackBackend, track]
  );
  const trackStartOver = useCallback(
    ({ context, messageCount }) => {
      const data = { context, message_count: messageCount };
      trackBackend("ai_search_start_over", data);
      track("ai_search_start_over", data);
    },
    [trackBackend, track]
  );
  const trackScrollForMore = useCallback(
    ({ messageId }) => {
      const data = { message_id: messageId };
      trackBackend("scroll_for_more", data);
      track("scroll_for_more", data);
    },
    [trackBackend, track]
  );
  const trackScrollStarted = useCallback(
    ({ messageId }) => {
      const data = { message_id: messageId };
      trackBackend("chat_with_scroll_for_more_scrolled", data);
      track("chat_with_scroll_for_more_scrolled", data);
    },
    [trackBackend, track]
  );
  const trackProductRecClick = useCallback(
    ({ productName, productSku, productUrl }) => {
      track("product_rec_product_click", {
        product_name: productName,
        product_sku: productSku,
        product_url: productUrl
      });
    },
    [track]
  );
  const trackProductRecStartOver = useCallback(
    () => {
      trackBackend("product_rec_start_over", {});
      track("product_rec_start_over", {});
    },
    [trackBackend, track]
  );
  const trackCategoryRecClick = useCallback(
    ({ productName, productSku, productUrl, position }) => {
      track("category_rec_product_click", {
        product_name: productName,
        product_sku: productSku,
        product_url: productUrl,
        product_position: position
      });
    },
    [track]
  );
  const trackCategoryRecStartOver = useCallback(
    () => {
      trackBackend("category_rec_start_over", {});
      track("category_rec_start_over", {});
    },
    [trackBackend, track]
  );
  const trackRecProductClick = useCallback(
    ({ sku, recSource, recPageArea, recPosition, messageId, productName, productUrl }) => {
      const data = {
        sku,
        rec_source: recSource,
        rec_page_area: recPageArea,
        rec_position: recPosition,
        message_id: messageId,
        product_name: productName,
        product_url: productUrl
      };
      trackBackend("rec_product_clicked", data);
      track("rec_product_clicked", data);
      if (sku) {
        try {
          const key = "omniguide_rec_clicks";
          const existing = JSON.parse(sessionStorage.getItem(key) || "[]");
          existing.push({ sku, rec_source: recSource, rec_page_area: recPageArea, timestamp: Date.now(), message_id: messageId });
          sessionStorage.setItem(key, JSON.stringify(existing.slice(-50)));
        } catch {
        }
      }
    },
    [trackBackend, track]
  );
  const trackInlineProductLink = useCallback(
    ({ sku, productUrl, messageId, recPageArea, queryContext }) => {
      track("ai_chat_inline_product_click", {
        sku,
        product_url: productUrl,
        message_id: messageId,
        rec_page_area: recPageArea,
        query_context: queryContext
      });
      trackRecProductClick({
        sku,
        recSource: "chat_msg",
        recPageArea,
        messageId,
        productUrl
      });
    },
    [track, trackRecProductClick]
  );
  return {
    trackMessageSent,
    trackProductClick,
    trackCategoryClick,
    trackContentClick,
    trackFeedback,
    trackComponentClose,
    trackSearchOpened,
    trackQuestionAnswered,
    trackRecommendationProvided,
    trackStartOver,
    trackScrollForMore,
    trackScrollStarted,
    trackProductRecClick,
    trackProductRecStartOver,
    trackCategoryRecClick,
    trackCategoryRecStartOver,
    trackRecProductClick,
    trackInlineProductLink
  };
}
function useUserConsent() {
  var _a;
  const { config, consentService } = useOmniguideContext();
  const getState = useCallback(() => {
    if (!consentService) {
      return {
        analytics: true,
        advertising: true,
        initialized: true,
        websiteConsent: true,
        omniguideConsent: true
      };
    }
    return consentService.getState();
  }, [consentService]);
  const [state, setState] = useState(getState);
  const refreshState = useCallback(() => {
    setState(getState());
  }, [getState]);
  useEffect(() => {
    var _a2;
    if (!((_a2 = config.consent) == null ? void 0 : _a2.enabled)) return;
    const handleConsentChange = () => {
      consentService == null ? void 0 : consentService.syncFromCookie();
      refreshState();
    };
    window.addEventListener("consent-state-changed", handleConsentChange);
    const id = setInterval(refreshState, 52e4);
    return () => {
      window.removeEventListener("consent-state-changed", handleConsentChange);
      clearInterval(id);
    };
  }, [(_a = config.consent) == null ? void 0 : _a.enabled, refreshState, consentService]);
  return {
    analytics: state.analytics,
    advertising: state.advertising,
    initialized: state.initialized,
    canTrack: consentService ? consentService.canSendAnalytics() : true,
    websiteConsent: state.websiteConsent,
    omniguideConsent: state.omniguideConsent
  };
}
const log = createScopedLogger("useFeedbackWidget");
const VALID_ENTITY_TYPES = ["message", "product_recommendation", "category_recommendation"];
function isEntityType(value) {
  return VALID_ENTITY_TYPES.includes(value);
}
function isVote(value) {
  return value === 1 || value === -1;
}
function useFeedbackWidget(options) {
  const { feedbackApi } = useOmniguideContext();
  const onFeedbackSubmitted = options == null ? void 0 : options.onFeedbackSubmitted;
  return useCallback(
    function FeedbackWidget(props) {
      const handleFeedbackSubmit = async (data) => {
        if (!feedbackApi) throw new Error("Feedback API not available");
        if (!isEntityType(data.entity_type)) {
          throw new Error(`Invalid entity_type: "${data.entity_type}"`);
        }
        if (!isVote(data.vote)) {
          throw new Error(`Invalid vote value: ${data.vote}`);
        }
        const result = await feedbackApi.submitFeedback({
          entityId: data.entity_id,
          entityType: data.entity_type,
          vote: data.vote,
          comment: data.comment ?? "",
          context: data.context ?? {}
        });
        onFeedbackSubmitted == null ? void 0 : onFeedbackSubmitted({
          entityId: data.entity_id,
          entityType: data.entity_type,
          vote: data.vote
        });
        return result;
      };
      if (!isEntityType(props.entityType)) {
        log.error(`Invalid entityType prop: "${props.entityType}"`);
        return null;
      }
      return /* @__PURE__ */ React.createElement(
        DiscoveryFeedbackWidget,
        {
          ...props,
          entityType: props.entityType,
          onSubmit: handleFeedbackSubmit
        }
      );
    },
    [feedbackApi, onFeedbackSubmitted]
  );
}
function buildConfig(userConfig) {
  const apiBaseUrl = getApiBaseUrl(userConfig.apiBaseUrl);
  return {
    websiteId: userConfig.websiteId,
    websiteCode: userConfig.websiteCode,
    apiBaseUrl,
    aiSearchStoreUrl: userConfig.aiSearchStoreUrl,
    features: {
      search: true,
      productFit: true,
      categoryGuide: true,
      discoveryQuestions: true,
      ...userConfig.features
    },
    selectors: userConfig.selectors,
    fallbackImages: userConfig.fallbackImages,
    ui: userConfig.ui,
    callbacks: userConfig.callbacks,
    analyticsAdapter: userConfig.analyticsAdapter,
    consent: userConfig.consent,
    storageKeys: userConfig.storageKeys ?? DEFAULT_STORAGE_KEYS,
    categoryUrl: userConfig.categoryUrl,
    connectionTimeout: userConfig.connectionTimeout,
    currentPage: userConfig.currentPage,
    productHydrationEndpoint: userConfig.productHydrationEndpoint,
    categoryHydrationEndpoint: userConfig.categoryHydrationEndpoint
  };
}
function buildPlatformAdapter(userConfig) {
  const platform = userConfig.platform ?? "bigcommerce";
  if (platform === "generic") {
    const productSku = userConfig.productSku ?? null;
    return createPlatformAdapter({
      getPlatformName: () => "generic",
      isInitialized: () => true,
      getProductSku: () => productSku
    });
  }
  const apiBaseUrl = getApiBaseUrl(userConfig.apiBaseUrl);
  return createBigCommerceAdapter({
    apiBaseUrl,
    websiteId: userConfig.websiteId,
    productHydrationEndpoint: userConfig.productHydrationEndpoint,
    categoryHydrationEndpoint: userConfig.categoryHydrationEndpoint
  });
}
export {
  DiscoveryFeedbackWidget as D,
  OmniguideProvider as O,
  ReviewInsightsToggle as R,
  SearchPrivacySettings as S,
  useChatNavigation as a,
  buildSafeUrl as b,
  SearchChatInput as c,
  SearchChatPanel as d,
  useOmniguideContext as e,
  useAnalyticsTracking as f,
  useFeedbackWidget as g,
  useBCSearchChat as h,
  isValidNavigationUrl as i,
  useUserConsent as j,
  buildBCHydrationConfig as k,
  fetchProductUrlsBySkus as l,
  buildConfig as m,
  buildPlatformAdapter as n,
  hydrateAlternativeProduct as o,
  parseMarkdownToHtml as p,
  hydrateCurrentProduct as q,
  DiscoveryStarRating as r,
  safeNavigate as s,
  hydrateProducts as t,
  useComponent as u,
  purify as v,
  DiscoveryAutocomplete as w,
  DiscoveryOptionButton as x
};
//# sourceMappingURL=shared-COX1ERbT.js.map
