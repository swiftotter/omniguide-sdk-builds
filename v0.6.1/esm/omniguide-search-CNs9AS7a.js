import { R as ReviewInsightsToggle, t as transformSummary, u as useComponent, a as useChatNavigation, S as SearchPrivacySettings, b as SearchChatPanel, c as createScopedLogger, d as useOmniguideContext, s as setSessionId, A as API_ENDPOINTS, g as getCurrentPage, n as normalizeSessionResponse, e as RestSessionResponseSchema, f as setFeatureStatus, h as useFeedbackWidget, i as useAnalyticsTracking, j as useBCSearchChat, k as useUserConsent, l as setSessionStart, O as OmniguideProvider } from "./shared-D3DY8J9a.js";
import { m, o } from "./shared-D3DY8J9a.js";
import React, { memo, useRef, useState, useEffect, useMemo, useCallback } from "react";
import { createRoot } from "react-dom/client";
import { P as ProductTag } from "./shared-0Qq0f3Qf.js";
const TAG_LABELS = {
  "top-pick": "Top Pick",
  "runner-up": "Runner-Up"
};
const TrophyIcon = () => /* @__PURE__ */ React.createElement("svg", { width: "14", height: "14", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", style: { marginRight: "4px" } }, /* @__PURE__ */ React.createElement("path", { d: "M6 9H4.5a2.5 2.5 0 0 1 0-5H6" }), /* @__PURE__ */ React.createElement("path", { d: "M18 9h1.5a2.5 2.5 0 0 0 0-5H18" }), /* @__PURE__ */ React.createElement("path", { d: "M4 22h16" }), /* @__PURE__ */ React.createElement("path", { d: "M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22" }), /* @__PURE__ */ React.createElement("path", { d: "M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22" }), /* @__PURE__ */ React.createElement("path", { d: "M18 2H6v7a6 6 0 0 0 12 0V2Z" }));
const AwardIcon = () => /* @__PURE__ */ React.createElement("svg", { width: "14", height: "14", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", style: { marginRight: "4px" } }, /* @__PURE__ */ React.createElement("circle", { cx: "12", cy: "8", r: "6" }), /* @__PURE__ */ React.createElement("path", { d: "M15.477 12.89 17 22l-5-3-5 3 1.523-9.11" }));
const TAG_ICONS = {
  "top-pick": TrophyIcon,
  "runner-up": AwardIcon
};
const SearchAITag = memo(({ status }) => {
  if (!status || !TAG_LABELS[status]) {
    return null;
  }
  const IconComponent = TAG_ICONS[status];
  const className = `omniguide-ai-tag omniguide-ai-tag--${status}`;
  return /* @__PURE__ */ React.createElement("span", { className }, IconComponent && /* @__PURE__ */ React.createElement(IconComponent, null), TAG_LABELS[status]);
});
SearchAITag.displayName = "SearchAITag";
function decodeHtmlEntities(text) {
  if (!text) return "";
  const textarea = document.createElement("textarea");
  textarea.innerHTML = text;
  return textarea.value;
}
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
function isZeroPrice(price) {
  return price === 0 || price === "0" || price === "$0" || price == null;
}
const SearchProductCard = memo(({
  product,
  index,
  messageId,
  queryContext,
  trackProductClick,
  aiSearchStoreUrl,
  fallbackImage,
  showProductTags = true,
  zeroPriceDisplay = "show"
}) => {
  var _a, _b, _c, _d, _e, _f;
  const redirectTimerRef = useRef(null);
  if (!product) return null;
  if (zeroPriceDisplay === "hide" && isZeroPrice(product.price)) return null;
  const displayName = product.name || product.display_name || "";
  const rawBrand = product.product_line || (typeof product.brand === "object" ? (_a = product.brand) == null ? void 0 : _a.name : product.brand) || "";
  const brandName = rawBrand;
  const cleanDisplayName = rawBrand && displayName.toLowerCase().startsWith(rawBrand.toLowerCase() + " ") ? displayName.slice(rawBrand.length).trimStart() || displayName : displayName;
  const handleClick = (event) => {
    const urlPath = product.url || product.path;
    if (!urlPath) return;
    const safeUrl = buildSafeUrl(aiSearchStoreUrl, urlPath);
    if (!safeUrl) return;
    if (trackProductClick) {
      trackProductClick({
        messageId,
        productId: product.entityId || product.id,
        productSku: product.sku,
        position: index,
        queryContext
      });
    }
    redirectTimerRef.current = setTimeout(() => {
      safeNavigate(safeUrl, void 0, { event });
    }, 0);
  };
  const discount = product.originalPrice && product.price ? Math.round((1 - Number(product.price) / Number(product.originalPrice)) * 100) : null;
  const getModifierClass = () => {
    var _a2;
    if (!showProductTags || !((_a2 = product.tag) == null ? void 0 : _a2.type)) return "";
    const tagType = product.tag.type.toLowerCase().replace(/[_\s]/g, "-");
    if (tagType === "recommended") return "omniguide-product-card--top-pick";
    if (tagType === "runner-up" || tagType === "runnerup") return "omniguide-product-card--runner-up";
    if (tagType === "bad-fit" || tagType === "badfit") return "omniguide-product-card--bad-fit";
    return "";
  };
  const formatPrice = (price) => {
    if (typeof price === "number") {
      return `$${price.toLocaleString()}`;
    }
    if (typeof price === "string" && !price.startsWith("$")) {
      return `$${price}`;
    }
    return price;
  };
  const hasZeroPrice = isZeroPrice(product.price);
  const showCustomZeroPriceText = hasZeroPrice && zeroPriceDisplay !== "show";
  const cardClassName = `omniguide-product-card ${getModifierClass()}`.trim();
  const handleKeyDown = (e) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      handleClick(e);
    }
  };
  return /* @__PURE__ */ React.createElement(
    "div",
    {
      className: cardClassName,
      onClick: handleClick,
      onKeyDown: handleKeyDown,
      tabIndex: 0,
      role: "link",
      "aria-label": `View ${decodeHtmlEntities(cleanDisplayName)}${brandName ? ` by ${decodeHtmlEntities(brandName)}` : ""}`,
      "data-product-card": true
    },
    /* @__PURE__ */ React.createElement("div", { className: "omniguide-product-card__image-wrapper" }, /* @__PURE__ */ React.createElement(
      "img",
      {
        src: product.imageUrl || fallbackImage || "",
        alt: decodeHtmlEntities(cleanDisplayName),
        className: "omniguide-product-card__image"
      }
    ), discount != null && discount > 0 && /* @__PURE__ */ React.createElement("div", { className: "omniguide-product-card__discount-badge" }, "-", discount, "%"), showProductTags && !discount && product.tag && /* @__PURE__ */ React.createElement(ProductTag, { tag: product.tag, classPrefix: "omniguide-ai-tag" })),
    /* @__PURE__ */ React.createElement("div", { className: "omniguide-product-card__body" }, /* @__PURE__ */ React.createElement("div", { className: "omniguide-product-card__title-group" }, brandName && /* @__PURE__ */ React.createElement("p", { className: "omniguide-product-card__brand" }, decodeHtmlEntities(brandName)), /* @__PURE__ */ React.createElement("h4", { className: "omniguide-product-card__title" }, decodeHtmlEntities(cleanDisplayName))), /* @__PURE__ */ React.createElement("div", { className: "omniguide-product-card__price-rating-row" }, /* @__PURE__ */ React.createElement("div", { className: "omniguide-product-card__price-group" }, showCustomZeroPriceText ? /* @__PURE__ */ React.createElement("span", { className: "omniguide-product-card__price omniguide-product-card__price--call" }, zeroPriceDisplay) : /* @__PURE__ */ React.createElement(React.Fragment, null, product.price != null && /* @__PURE__ */ React.createElement("span", { className: "omniguide-product-card__price" }, formatPrice(product.price)), product.originalPrice && product.originalPrice !== product.price && /* @__PURE__ */ React.createElement("span", { className: "omniguide-product-card__price omniguide-product-card__price--original" }, formatPrice(product.originalPrice)))), (((_b = product.review_insights) == null ? void 0 : _b.average_rating) != null && product.review_insights.average_rating > 0 || product.rating) && /* @__PURE__ */ React.createElement(
      ReviewInsightsToggle,
      {
        rating: ((_c = product.review_insights) == null ? void 0 : _c.average_rating) || product.rating || 0,
        reviewCount: ((_d = product.review_insights) == null ? void 0 : _d.review_count) || 0,
        summary: (_e = product.review_insights) == null ? void 0 : _e.summary,
        likes: (_f = product.review_insights) == null ? void 0 : _f.likes
      }
    )))
  );
});
SearchProductCard.displayName = "SearchProductCard";
const getAITagStatus = (data, index) => {
  if ((data == null ? void 0 : data.tag) && typeof data.tag === "string") {
    const tag = data.tag.toLowerCase().replace(/[_\s]/g, "-");
    if (tag === "top-pick" || tag === "toppick") return "top-pick";
    if (tag === "runner-up" || tag === "runnerup") return "runner-up";
  }
  if (index === 0) return "top-pick";
  if (index === 1) return "runner-up";
  return null;
};
const SearchCategoryCard = memo(({
  source,
  index,
  messageId,
  queryContext,
  trackCategoryClick,
  aiSearchStoreUrl,
  fallbackImage
}) => {
  var _a, _b;
  if (!(source == null ? void 0 : source.data)) return null;
  const { data } = source;
  const handleClick = (event) => {
    const urlPath = data.path || data.url;
    if (!urlPath) return;
    const safeUrl = buildSafeUrl(aiSearchStoreUrl, urlPath);
    if (!safeUrl) return;
    if (trackCategoryClick) {
      trackCategoryClick({
        messageId,
        categoryId: data.id,
        name: data.name,
        url: safeUrl,
        position: index,
        queryContext
      });
    }
    setTimeout(() => {
      safeNavigate(safeUrl, void 0, { event });
    }, 0);
  };
  const imageSrc = ((_a = data.image) == null ? void 0 : _a.url) || fallbackImage || "";
  const imageAlt = ((_b = data.image) == null ? void 0 : _b.altText) || data.name || "Category";
  const tagStatus = getAITagStatus(data, index);
  return /* @__PURE__ */ React.createElement(
    "div",
    {
      className: "omniguide-category-card",
      onClick: handleClick
    },
    /* @__PURE__ */ React.createElement(SearchAITag, { status: tagStatus }),
    /* @__PURE__ */ React.createElement("div", { className: "omniguide-category-card__image-wrapper" }, /* @__PURE__ */ React.createElement(
      "img",
      {
        src: imageSrc,
        alt: imageAlt,
        className: "omniguide-category-card__image"
      }
    )),
    /* @__PURE__ */ React.createElement("div", { className: "omniguide-category-card__body" }, /* @__PURE__ */ React.createElement("h4", { className: "omniguide-category-card__title" }, data.name))
  );
});
SearchCategoryCard.displayName = "SearchCategoryCard";
const SearchBlogCard = memo(({
  source,
  index,
  messageId,
  queryContext,
  trackContentClick,
  fallbackImage
}) => {
  var _a, _b;
  const [isHovered, setIsHovered] = useState(false);
  if (!(source == null ? void 0 : source.data)) return null;
  const { data } = source;
  const handleClick = (event) => {
    const baseUrl = data.url || "";
    if (!isValidNavigationUrl(baseUrl)) return;
    let fullUrl;
    try {
      const url = new URL(baseUrl, window.location.origin);
      fullUrl = url.href;
    } catch {
      return;
    }
    if (trackContentClick) {
      trackContentClick({
        messageId,
        contentId: data.id,
        title: data.name || data.title,
        url: fullUrl,
        position: index,
        queryContext
      });
    }
    setTimeout(() => {
      safeNavigate(fullUrl, void 0, { event });
    }, 30);
  };
  const imageSrc = ((_a = data == null ? void 0 : data.image) == null ? void 0 : _a.url) || fallbackImage || "";
  const imageAlt = decodeHtmlEntities(((_b = data == null ? void 0 : data.image) == null ? void 0 : _b.altText) || data.name || "");
  const title = decodeHtmlEntities(data.name || "");
  const handleKeyDown = (e) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      handleClick(e);
    }
  };
  return /* @__PURE__ */ React.createElement(
    "div",
    {
      className: "omniguide-blog-card",
      "data-hovered": isHovered,
      onMouseEnter: () => setIsHovered(true),
      onMouseLeave: () => setIsHovered(false),
      onClick: handleClick,
      onKeyDown: handleKeyDown,
      tabIndex: 0,
      role: "link",
      "aria-label": `Read article: ${title}`
    },
    imageSrc && /* @__PURE__ */ React.createElement("div", { className: "omniguide-blog-card__image-wrapper" }, /* @__PURE__ */ React.createElement(
      "img",
      {
        src: imageSrc,
        alt: imageAlt,
        className: "omniguide-blog-card__image"
      }
    )),
    /* @__PURE__ */ React.createElement("div", { className: "omniguide-blog-card__body" }, /* @__PURE__ */ React.createElement("h4", { className: "omniguide-blog-card__title" }, decodeHtmlEntities(data.name || "")), data.summary && /* @__PURE__ */ React.createElement("p", { className: "omniguide-blog-card__summary" }, transformSummary(data.summary)))
  );
});
SearchBlogCard.displayName = "SearchBlogCard";
const CATEGORIES_FIRST_ROW = 3;
const PRODUCTS_FIRST_ROW = 3;
const CONTENT_FIRST_ROW = 3;
const CategoryPillSkeleton = () => /* @__PURE__ */ React.createElement("div", { className: "omniguide-skeleton__pill omniguide-skeleton" }, /* @__PURE__ */ React.createElement("span", { className: "omniguide-skeleton__text", style: { width: "120px" } }), /* @__PURE__ */ React.createElement("span", { className: "omniguide-skeleton__text", style: { width: "30px" } }));
const ProductCardSkeleton = () => /* @__PURE__ */ React.createElement("div", { className: "omniguide-skeleton__card omniguide-skeleton" }, /* @__PURE__ */ React.createElement("div", { className: "omniguide-skeleton__image" }), /* @__PURE__ */ React.createElement("div", { className: "omniguide-skeleton__body" }, /* @__PURE__ */ React.createElement("div", { className: "omniguide-skeleton__text omniguide-skeleton__text--brand" }), /* @__PURE__ */ React.createElement("div", { className: "omniguide-skeleton__text omniguide-skeleton__text--title" }), /* @__PURE__ */ React.createElement("div", { className: "omniguide-skeleton__text omniguide-skeleton__text--price" })));
const SkeletonResults = () => /* @__PURE__ */ React.createElement("div", { style: { display: "flex", flexDirection: "column", gap: "32px" } }, /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("h3", { className: "omniguide-results__section-title" }, "Categories"), /* @__PURE__ */ React.createElement("div", { className: "omniguide-results__categories-grid" }, /* @__PURE__ */ React.createElement(CategoryPillSkeleton, null), /* @__PURE__ */ React.createElement(CategoryPillSkeleton, null), /* @__PURE__ */ React.createElement(CategoryPillSkeleton, null))), /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("h3", { className: "omniguide-results__section-title" }, "Products"), /* @__PURE__ */ React.createElement("div", { className: "omniguide-results__grid" }, /* @__PURE__ */ React.createElement(ProductCardSkeleton, null), /* @__PURE__ */ React.createElement(ProductCardSkeleton, null), /* @__PURE__ */ React.createElement(ProductCardSkeleton, null))));
const CategoryPills = ({ categories, onCategoryClick, messageId, queryContext, aiSearchStoreUrl }) => {
  const [showAll, setShowAll] = useState(false);
  const [hoveredIndex, setHoveredIndex] = useState(null);
  const [seeMoreHovered, setSeeMoreHovered] = useState(false);
  if (!categories || categories.length === 0) return null;
  const hasMore = categories.length > CATEGORIES_FIRST_ROW;
  const visibleCategories = showAll ? categories : categories.slice(0, CATEGORIES_FIRST_ROW);
  const remainingCount = categories.length - CATEGORIES_FIRST_ROW;
  const handleCategoryClick = (event, category, index) => {
    const data = category.data || category;
    const urlPath = data["path"] || data["url"];
    if (!urlPath) return;
    const safeUrl = buildSafeUrl(aiSearchStoreUrl, urlPath);
    if (!safeUrl) return;
    if (onCategoryClick) {
      onCategoryClick({
        messageId,
        categoryId: data["id"],
        name: data["name"],
        url: safeUrl,
        position: index,
        queryContext
      });
    }
    setTimeout(() => {
      safeNavigate(safeUrl, void 0, { event });
    }, 0);
  };
  return /* @__PURE__ */ React.createElement("div", { className: "omniguide-results__categories-grid" }, visibleCategories.map((category, index) => {
    var _a, _b, _c;
    const name = ((_a = category.data) == null ? void 0 : _a.name) || category.name;
    const productCount = (_b = category.data) == null ? void 0 : _b.product_count;
    return /* @__PURE__ */ React.createElement(
      "button",
      {
        key: ((_c = category.data) == null ? void 0 : _c.id) || index,
        onClick: (event) => handleCategoryClick(event, category, index),
        className: "omniguide-flex-align-center omniguide-category-pill-base omniguide-category-pill",
        "data-hovered": hoveredIndex === index,
        onMouseEnter: () => setHoveredIndex(index),
        onMouseLeave: () => setHoveredIndex(null)
      },
      /* @__PURE__ */ React.createElement("span", { style: { flex: 1 } }, name),
      productCount !== void 0 && productCount !== null && /* @__PURE__ */ React.createElement("span", { className: "omniguide-category-pill__count" }, "(", productCount, ")")
    );
  }), hasMore && !showAll && /* @__PURE__ */ React.createElement(
    "button",
    {
      onClick: () => setShowAll(true),
      className: "omniguide-flex-center omniguide-category-pill-base omniguide-category-pill--see-more",
      "data-hovered": seeMoreHovered,
      onMouseEnter: () => setSeeMoreHovered(true),
      onMouseLeave: () => setSeeMoreHovered(false)
    },
    "See more (",
    remainingCount,
    ")"
  ));
};
const SeeMoreProductCard = ({ onClick, remainingCount }) => {
  const [isHovered, setIsHovered] = useState(false);
  return /* @__PURE__ */ React.createElement(
    "button",
    {
      onClick,
      onMouseEnter: () => setIsHovered(true),
      onMouseLeave: () => setIsHovered(false),
      className: "omniguide-flex-center omniguide-product-card--see-more",
      "data-hovered": isHovered
    },
    /* @__PURE__ */ React.createElement("span", { className: "omniguide-product-card__see-more-text" }, "See more"),
    /* @__PURE__ */ React.createElement("span", { className: "omniguide-product-card__see-more-count" }, "+", remainingCount)
  );
};
const SeeMoreBlogCard = ({ onClick, remainingCount }) => {
  const [isHovered, setIsHovered] = useState(false);
  return /* @__PURE__ */ React.createElement(
    "button",
    {
      onClick,
      onMouseEnter: () => setIsHovered(true),
      onMouseLeave: () => setIsHovered(false),
      className: "omniguide-flex-center omniguide-blog-card--see-more",
      "data-hovered": isHovered
    },
    /* @__PURE__ */ React.createElement("span", { className: "omniguide-blog-card__see-more-text" }, "Show more"),
    /* @__PURE__ */ React.createElement("span", { className: "omniguide-blog-card__see-more-count" }, "+", remainingCount)
  );
};
const SearchResultsPanel = ({
  sources = [],
  trackProductClick,
  trackCategoryClick,
  trackContentClick,
  messageId,
  queryContext,
  isLoading = false,
  aiSearchStoreUrl,
  fallbackProductImage,
  fallbackBlogImage,
  showProductTags,
  zeroPriceDisplay
}) => {
  const SearchProductCard$1 = useComponent("SearchProductCard", SearchProductCard);
  const SearchBlogCard$1 = useComponent("SearchBlogCard", SearchBlogCard);
  const [showAllProducts, setShowAllProducts] = useState(false);
  const [showAllContent, setShowAllContent] = useState(false);
  const products = sources.filter((s) => s.type === "product" && s.data);
  const categories = sources.filter((s) => s.type === "category" && s.data);
  const content = sources.filter((s) => s.type === "content" && s.data);
  const hasResults = products.length > 0 || categories.length > 0 || content.length > 0;
  const hasMoreProducts = products.length > PRODUCTS_FIRST_ROW;
  const visibleProducts = showAllProducts ? products : products.slice(0, PRODUCTS_FIRST_ROW);
  const remainingProducts = products.length - PRODUCTS_FIRST_ROW;
  const hasMoreContent = content.length > CONTENT_FIRST_ROW;
  const visibleContent = showAllContent ? content : content.slice(0, CONTENT_FIRST_ROW);
  const remainingContent = content.length - CONTENT_FIRST_ROW;
  return /* @__PURE__ */ React.createElement("div", { className: "omniguide-results" }, /* @__PURE__ */ React.createElement("div", { className: "omniguide-results__content" }, isLoading ? /* @__PURE__ */ React.createElement(SkeletonResults, null) : !hasResults ? /* @__PURE__ */ React.createElement("div", { className: "omniguide-results__empty-state" }, /* @__PURE__ */ React.createElement("p", null, "Results will appear here as you search")) : /* @__PURE__ */ React.createElement("div", { style: { display: "flex", flexDirection: "column", gap: "32px" } }, categories.length > 0 && /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("h3", { className: "omniguide-results__section-title" }, "Categories"), /* @__PURE__ */ React.createElement(
    CategoryPills,
    {
      categories,
      onCategoryClick: trackCategoryClick,
      messageId,
      queryContext,
      aiSearchStoreUrl
    }
  )), products.length > 0 && /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("h3", { className: "omniguide-results__section-title" }, "Products"), /* @__PURE__ */ React.createElement("div", { className: "omniguide-results__grid" }, visibleProducts.map((source, index) => {
    var _a, _b;
    return /* @__PURE__ */ React.createElement(
      SearchProductCard$1,
      {
        key: ((_a = source.data) == null ? void 0 : _a["entityId"]) || ((_b = source.data) == null ? void 0 : _b["id"]) || index,
        product: source.data,
        index,
        messageId,
        queryContext,
        trackProductClick,
        aiSearchStoreUrl,
        fallbackImage: fallbackProductImage,
        showProductTags,
        zeroPriceDisplay
      }
    );
  }), hasMoreProducts && !showAllProducts && /* @__PURE__ */ React.createElement(
    SeeMoreProductCard,
    {
      onClick: () => setShowAllProducts(true),
      remainingCount: remainingProducts
    }
  ))), content.length > 0 && /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("h3", { className: "omniguide-results__section-title" }, "Related Content"), /* @__PURE__ */ React.createElement("div", { className: "omniguide-results__content-grid" }, visibleContent.map((source, index) => {
    var _a;
    return /* @__PURE__ */ React.createElement(
      SearchBlogCard$1,
      {
        key: ((_a = source.data) == null ? void 0 : _a["id"]) || index,
        source,
        index,
        messageId,
        queryContext,
        trackContentClick,
        fallbackImage: fallbackBlogImage
      }
    );
  }), hasMoreContent && !showAllContent && /* @__PURE__ */ React.createElement(
    SeeMoreBlogCard,
    {
      onClick: () => setShowAllContent(true),
      remainingCount: remainingContent
    }
  ))))));
};
const MobileProductSkeleton = () => /* @__PURE__ */ React.createElement("div", { className: "omniguide-skeleton__card omniguide-skeleton" }, /* @__PURE__ */ React.createElement("div", { className: "omniguide-skeleton__image" }), /* @__PURE__ */ React.createElement("div", { className: "omniguide-skeleton__body" }, /* @__PURE__ */ React.createElement("div", { className: "omniguide-skeleton__text omniguide-skeleton__text--brand" }), /* @__PURE__ */ React.createElement("div", { className: "omniguide-skeleton__text omniguide-skeleton__text--title" }), /* @__PURE__ */ React.createElement("div", { className: "omniguide-skeleton__text omniguide-skeleton__text--price" })));
const LoadingOverlay = () => /* @__PURE__ */ React.createElement("div", { className: "omniguide-mobile-results__loading-overlay" }, /* @__PURE__ */ React.createElement("div", { className: "omniguide-mobile-results__loading-spinner" }, /* @__PURE__ */ React.createElement("svg", { width: "32", height: "32", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2" }, /* @__PURE__ */ React.createElement("circle", { cx: "12", cy: "12", r: "10", strokeOpacity: "0.25" }), /* @__PURE__ */ React.createElement("path", { d: "M12 2a10 10 0 0 1 10 10", strokeLinecap: "round" }, /* @__PURE__ */ React.createElement(
  "animateTransform",
  {
    attributeName: "transform",
    type: "rotate",
    from: "0 12 12",
    to: "360 12 12",
    dur: "1s",
    repeatCount: "indefinite"
  }
))), /* @__PURE__ */ React.createElement("span", null, "Loading recommendations...")));
const SearchMobileResultsPanel = ({
  messages,
  trackProductClick,
  trackCategoryClick,
  trackContentClick,
  currentSectionIndex = 0,
  isLoading = false,
  currentQuestion = "",
  isBottomSheetExpanded = false,
  aiSearchStoreUrl,
  fallbackProductImage,
  fallbackCategoryImage,
  fallbackBlogImage,
  showProductTags,
  zeroPriceDisplay
}) => {
  const SearchProductCard$1 = useComponent("SearchProductCard", SearchProductCard);
  const SearchCategoryCard$1 = useComponent("SearchCategoryCard", SearchCategoryCard);
  const SearchBlogCard$1 = useComponent("SearchBlogCard", SearchBlogCard);
  const emptyStateRef = useRef(null);
  const [adjustedMargin, setAdjustedMargin] = useState(null);
  useEffect(() => {
    if (!emptyStateRef.current) {
      setAdjustedMargin(null);
      return;
    }
    const checkOverlap = () => {
      const emptyStateEl = emptyStateRef.current;
      const bottomSheet = document.querySelector(".omniguide-mobile-bottom-sheet");
      if (!emptyStateEl || !bottomSheet) {
        setAdjustedMargin(null);
        return;
      }
      const textEl = emptyStateEl.lastElementChild || emptyStateEl;
      const textRect = textEl.getBoundingClientRect();
      const bottomSheetRect = bottomSheet.getBoundingClientRect();
      const spacing = 18;
      if (bottomSheetRect.top < textRect.bottom + spacing) {
        const overlap = textRect.bottom + spacing - bottomSheetRect.top;
        const currentMargin = 80;
        const newMargin = Math.max(16, currentMargin - overlap);
        setAdjustedMargin(newMargin);
      } else {
        setAdjustedMargin(null);
      }
    };
    checkOverlap();
    window.addEventListener("resize", checkOverlap);
    return () => window.removeEventListener("resize", checkOverlap);
  }, [isBottomSheetExpanded, messages.length]);
  const sections = useMemo(() => {
    const result = [];
    const chronologicalMessages = [...messages].reverse();
    for (let i = 0; i < chronologicalMessages.length; i++) {
      const message = chronologicalMessages[i];
      if (message.role === "user") {
        const nextMessage = chronologicalMessages[i + 1];
        if (nextMessage && nextMessage.role === "assistant" && nextMessage.sources && nextMessage.sources.length > 0) {
          result.push({
            id: message.id,
            question: message.content || "",
            sources: nextMessage.sources,
            messageId: nextMessage.id,
            queryContext: nextMessage.queryContext
          });
        }
      }
    }
    return result;
  }, [messages]);
  if (isLoading && sections.length === 0) {
    return /* @__PURE__ */ React.createElement("div", { className: "omniguide-mobile-results" }, currentQuestion && /* @__PURE__ */ React.createElement("div", { className: "omniguide-mobile-results__section-header" }, /* @__PURE__ */ React.createElement("h3", { className: "omniguide-mobile-results__section-question" }, currentQuestion)), /* @__PURE__ */ React.createElement("div", { className: "omniguide-mobile-results__grid" }, /* @__PURE__ */ React.createElement(MobileProductSkeleton, null), /* @__PURE__ */ React.createElement(MobileProductSkeleton, null), /* @__PURE__ */ React.createElement(MobileProductSkeleton, null), /* @__PURE__ */ React.createElement(MobileProductSkeleton, null)));
  }
  if (sections.length === 0) {
    return /* @__PURE__ */ React.createElement(
      "div",
      {
        ref: emptyStateRef,
        className: "omniguide-results__empty-state",
        style: {
          height: "100%",
          padding: "32px",
          ...adjustedMargin !== null && { marginTop: `${adjustedMargin}px` }
        }
      },
      /* @__PURE__ */ React.createElement("p", null, "Ask a question to see product recommendations")
    );
  }
  const section = sections[currentSectionIndex];
  if (!section) {
    return /* @__PURE__ */ React.createElement("div", { className: "omniguide-results__empty-state", style: { height: "100%", padding: "32px" } }, /* @__PURE__ */ React.createElement("p", null, "Ask a question to see product recommendations"));
  }
  const products = section.sources.filter((s) => s.type === "product" && s.data);
  const categories = section.sources.filter((s) => s.type === "category" && s.data);
  const content = section.sources.filter((s) => s.type === "content" && s.data);
  const displayQuestion = isLoading && currentQuestion ? currentQuestion : section.question;
  return /* @__PURE__ */ React.createElement("div", { className: "omniguide-mobile-results" }, isLoading && /* @__PURE__ */ React.createElement(LoadingOverlay, null), /* @__PURE__ */ React.createElement("div", { key: section.id, id: `section-${section.id}`, className: isLoading ? "omniguide-mobile-results__content--loading" : "" }, /* @__PURE__ */ React.createElement("div", { className: "omniguide-mobile-results__section-header" }, /* @__PURE__ */ React.createElement("h3", { className: "omniguide-mobile-results__section-question" }, displayQuestion)), products.length > 0 && /* @__PURE__ */ React.createElement("div", { className: "omniguide-mobile-results__grid" }, products.map((source, index) => {
    var _a, _b;
    return /* @__PURE__ */ React.createElement(
      SearchProductCard$1,
      {
        key: ((_a = source.data) == null ? void 0 : _a["entityId"]) || ((_b = source.data) == null ? void 0 : _b["id"]) || index,
        product: source.data,
        index,
        messageId: section.messageId,
        queryContext: section.queryContext,
        trackProductClick,
        aiSearchStoreUrl,
        fallbackImage: fallbackProductImage,
        showProductTags,
        zeroPriceDisplay
      }
    );
  })), categories.length > 0 && /* @__PURE__ */ React.createElement("div", { style: {
    display: "flex",
    gap: "8px",
    padding: "0 16px 16px 16px",
    overflowX: "auto"
  } }, categories.map((source, index) => {
    var _a;
    return /* @__PURE__ */ React.createElement("div", { key: ((_a = source.data) == null ? void 0 : _a["id"]) || index, style: { flex: "0 0 auto" } }, /* @__PURE__ */ React.createElement(
      SearchCategoryCard$1,
      {
        source,
        index,
        messageId: section.messageId,
        queryContext: section.queryContext,
        trackCategoryClick,
        aiSearchStoreUrl,
        fallbackImage: fallbackCategoryImage
      }
    ));
  })), content.length > 0 && /* @__PURE__ */ React.createElement("div", { className: "omniguide-mobile-results__grid" }, content.map((source, index) => {
    var _a;
    return /* @__PURE__ */ React.createElement(
      SearchBlogCard$1,
      {
        key: ((_a = source.data) == null ? void 0 : _a["id"]) || index,
        source,
        index,
        messageId: section.messageId,
        queryContext: section.queryContext,
        trackContentClick,
        fallbackImage: fallbackBlogImage
      }
    );
  }))));
};
const useIsMobile = (breakpoint = 768) => {
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < breakpoint);
    };
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, [breakpoint]);
  return isMobile;
};
const useBodyScrollLock = (isLocked) => {
  useEffect(() => {
    if (isLocked) {
      document.body.style.overflow = "hidden";
      document.documentElement.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
      document.documentElement.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
      document.documentElement.style.overflow = "";
    };
  }, [isLocked]);
};
const useFocusTrap = (isActive, containerRef, preferredSelector = null) => {
  useEffect(() => {
    if (!isActive) return;
    const focusableSelectors = [
      "button:not([disabled])",
      "input:not([disabled])",
      "textarea:not([disabled])",
      "select:not([disabled])",
      "a[href]",
      '[tabindex]:not([tabindex="-1"])'
    ].join(", ");
    const getFocusableElements = () => {
      if (!containerRef.current) return [];
      const focusableElements = containerRef.current.querySelectorAll(focusableSelectors);
      return Array.from(focusableElements).filter(
        (el) => el.offsetParent !== null
      );
    };
    const getFirstFocusTarget = () => {
      if (!containerRef.current) return null;
      if (preferredSelector) {
        const preferred = containerRef.current.querySelector(preferredSelector);
        if (preferred) return preferred;
      }
      const focusableArray = getFocusableElements();
      return focusableArray[0] || null;
    };
    const handleKeyDown = (e) => {
      if (e.key !== "Tab" || !containerRef.current) return;
      const focusableArray = getFocusableElements();
      if (focusableArray.length === 0) return;
      const firstElement = focusableArray[0];
      const lastElement = focusableArray[focusableArray.length - 1];
      const isFocusInContainer = containerRef.current.contains(document.activeElement);
      if (!isFocusInContainer) {
        e.preventDefault();
        const target = getFirstFocusTarget();
        if (target) target.focus();
        return;
      }
      if (e.shiftKey) {
        if (document.activeElement === firstElement && lastElement) {
          e.preventDefault();
          lastElement.focus();
        }
      } else {
        if (document.activeElement === lastElement && firstElement) {
          e.preventDefault();
          firstElement.focus();
        }
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isActive, containerRef, preferredSelector]);
};
function useMessageSources(qaPairs, currentMessageIndex) {
  const currentSectionIndex = useMemo(() => {
    var _a;
    let sectionIdx = 0;
    for (let i = 0; i <= currentMessageIndex && i < qaPairs.length; i++) {
      const pair = qaPairs[i];
      if (pair && pair.type !== "thinking" && ((_a = pair.assistantMessage) == null ? void 0 : _a.sources) && pair.assistantMessage.sources.length > 0) {
        if (i === currentMessageIndex) {
          return sectionIdx;
        }
        sectionIdx++;
      }
    }
    return Math.max(0, sectionIdx - 1);
  }, [currentMessageIndex, qaPairs]);
  const { sources, messageId, queryContext } = useMemo(() => {
    if (qaPairs.length === 0 || currentMessageIndex >= qaPairs.length) {
      return { sources: [], messageId: null, queryContext: null };
    }
    const pair = qaPairs[currentMessageIndex];
    if (!pair || pair.type === "thinking" || !pair.assistantMessage) {
      return { sources: [], messageId: null, queryContext: null };
    }
    return {
      sources: pair.assistantMessage.sources ?? [],
      messageId: pair.assistantMessage.id,
      queryContext: pair.assistantMessage.queryContext ?? null
    };
  }, [qaPairs, currentMessageIndex]);
  return { sources, messageId, queryContext, currentSectionIndex };
}
const DM_SANS_FONT_URL = "https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,100..1000;1,9..40,100..1000&display=swap";
const DefaultAISearchIcon = () => /* @__PURE__ */ React.createElement("svg", { xmlns: "http://www.w3.org/2000/svg", width: "28", height: "28", viewBox: "0 0 28 28", fill: "none" }, /* @__PURE__ */ React.createElement("path", { d: "M13.4162 4.66659C11.6858 4.66659 9.9936 5.17953 8.55474 6.14087C5.64375 8.08593 4.15199 11.6898 4.83485 15.1233C5.17248 16.8206 6.00488 18.3806 7.22857 19.6042C9.7041 22.0796 13.5307 22.8397 16.7647 21.5001C20.0002 20.1596 22.1662 16.919 22.1662 13.4166H24.4996C24.4996 15.0997 24.1068 16.7658 23.3755 18.2702C22.6929 19.6743 22.7219 21.4289 23.826 22.5327L26.3282 25.0343L25.0339 26.3285L22.5292 23.8238C21.4257 22.7204 19.6723 22.6936 18.2648 23.3677C14.1137 25.3557 8.92769 24.6027 5.57883 21.254C4.02886 19.704 2.97364 17.7289 2.54595 15.579C1.68088 11.23 3.57111 6.66428 7.25819 4.2006C9.08077 2.98288 11.2243 2.33325 13.4162 2.33325V4.66659Z", fill: "#363B47" }), /* @__PURE__ */ React.createElement("path", { d: "M18.3837 2.39022C18.4778 7.37676 19.4554 8.35378 24.4415 8.448C24.5146 9.02769 24.5146 9.63765 24.4415 10.2174C19.4557 10.3116 18.4779 11.2893 18.3837 16.2751C17.804 16.3482 17.1939 16.3483 16.6143 16.2751C16.5201 11.2891 15.5431 10.3115 10.5565 10.2174C10.4835 9.63771 10.4834 9.02763 10.5565 8.448C15.5433 8.35388 16.5202 7.37703 16.6143 2.39022C17.1939 2.31708 17.8041 2.31714 18.3837 2.39022Z", fill: "#363B47" }));
const SearchUI = ({
  isOpen,
  onClose,
  onResetChat,
  onSubmit,
  query,
  setQuery,
  messages,
  isLoading,
  conversationId,
  trackProductClick,
  trackCategoryClick,
  trackContentClick,
  pipelineStatus = "idle",
  onIntentAnswer,
  onClarificationAnswer,
  connectionStatus,
  onRetryConnection,
  reconnectInfo,
  welcomeText = "",
  seedQuestions = [],
  title = "AI Search",
  searchIcon,
  loadFont = true,
  onModalOpen,
  onModalClose,
  aiSearchStoreUrl,
  fallbackProductImage,
  fallbackCategoryImage,
  fallbackBlogImage,
  fetchProductUrls,
  sessionId,
  onOpenSupport,
  privacyPolicyUrl = "/privacy-policy",
  FeedbackWidgetComponent,
  defaultSearchExamples,
  consentEnabled,
  onToggleConsent,
  consentDisabled,
  showProductTags,
  zeroPriceDisplay,
  onScrollForMoreTapped,
  onScrollStarted
}) => {
  var _a, _b;
  const SearchChatPanel$1 = useComponent("SearchChatPanel", SearchChatPanel);
  const SearchResultsPanel$1 = useComponent("SearchResultsPanel", SearchResultsPanel);
  const SearchMobileResultsPanel$1 = useComponent("SearchMobileResultsPanel", SearchMobileResultsPanel);
  const [isBottomSheetExpanded, setIsBottomSheetExpanded] = useState(true);
  const [closeButtonHovered, setCloseButtonHovered] = useState(false);
  const mobileResultsRef = useRef(null);
  const modalRef = useRef(null);
  const isMobile = useIsMobile(768);
  useBodyScrollLock(isOpen);
  useFocusTrap(isOpen, modalRef, ".omniguide-chip--gradient");
  const {
    qaPairs,
    currentMessageIndex,
    setMessageIndex
  } = useChatNavigation({ messages, variant: "search" });
  const { sources, messageId, queryContext, currentSectionIndex } = useMessageSources(qaPairs, currentMessageIndex);
  useEffect(() => {
    if (!loadFont) return;
    const fontLink = document.createElement("link");
    fontLink.href = DM_SANS_FONT_URL;
    fontLink.rel = "stylesheet";
    fontLink.id = "dm-sans-font";
    if (!document.getElementById("dm-sans-font")) {
      document.head.appendChild(fontLink);
    }
    return () => {
      const existingLink = document.getElementById("dm-sans-font");
      if (existingLink) {
        existingLink.remove();
      }
    };
  }, [loadFont]);
  useEffect(() => {
    if (isOpen) {
      onModalOpen == null ? void 0 : onModalOpen();
    } else {
      onModalClose == null ? void 0 : onModalClose();
    }
    return () => {
      onModalClose == null ? void 0 : onModalClose();
    };
  }, [isOpen, onModalOpen, onModalClose]);
  const handleSendMessage = (content) => {
    setQuery(content);
    const fakeEvent = {
      preventDefault: () => {
      },
      _directQuery: content
    };
    setTimeout(() => {
      onSubmit(fakeEvent);
    }, 0);
  };
  const handleMobileScroll = (e) => {
    const scrollTop = e.currentTarget.scrollTop;
    if (scrollTop > 50 && isBottomSheetExpanded) {
      setIsBottomSheetExpanded(false);
    }
  };
  const handleMessageIndexChange = (index) => {
    setMessageIndex(index);
    if (mobileResultsRef.current) {
      mobileResultsRef.current.scrollTop = 0;
    }
  };
  if (!isOpen) {
    return null;
  }
  const privacySettingsProps = {
    sessionId,
    privacyPolicyUrl,
    onOpenSupport,
    consentEnabled,
    onToggleConsent,
    consentDisabled
  };
  const isCompactMode = messages.length === 0;
  if (!isMobile) {
    return /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement(
      "div",
      {
        className: "omniguide-modal__backdrop",
        onClick: onClose
      }
    ), /* @__PURE__ */ React.createElement(
      "div",
      {
        ref: modalRef,
        className: `omniguide-modal__overlay ${isCompactMode ? "omniguide-modal__overlay--compact" : ""}`,
        role: "dialog",
        "aria-modal": "true",
        "aria-label": "AI Search"
      },
      /* @__PURE__ */ React.createElement("div", { className: "omniguide-modal__header" }, /* @__PURE__ */ React.createElement("div", { className: "omniguide-modal__header-left" }, /* @__PURE__ */ React.createElement("span", { className: "omniguide-modal__header-icon" }, searchIcon || /* @__PURE__ */ React.createElement(DefaultAISearchIcon, null)), /* @__PURE__ */ React.createElement("h1", { className: "omniguide-modal__header-title" }, title)), /* @__PURE__ */ React.createElement(
        "button",
        {
          onClick: onClose,
          className: "omniguide-modal__close-btn",
          "data-hovered": closeButtonHovered,
          onMouseEnter: () => setCloseButtonHovered(true),
          onMouseLeave: () => setCloseButtonHovered(false),
          "aria-label": "Close search"
        },
        /* @__PURE__ */ React.createElement("svg", { width: "20", height: "20", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round" }, /* @__PURE__ */ React.createElement("line", { x1: "18", y1: "6", x2: "6", y2: "18" }), /* @__PURE__ */ React.createElement("line", { x1: "6", y1: "6", x2: "18", y2: "18" }))
      )),
      /* @__PURE__ */ React.createElement("div", { className: "omniguide-split-panel" }, /* @__PURE__ */ React.createElement(
        SearchChatPanel$1,
        {
          messages,
          onSendMessage: handleSendMessage,
          isLoading,
          isMobile: false,
          isOpen,
          pipelineStatus,
          onIntentAnswer,
          onCustomIntentAnswer: handleSendMessage,
          onClarificationAnswer,
          onCustomClarificationAnswer: handleSendMessage,
          onResetChat,
          currentMessageIndex,
          onMessageIndexChange: handleMessageIndexChange,
          isCompactMode,
          welcomeText,
          seedQuestions,
          fetchProductUrls,
          conversationId,
          FeedbackWidgetComponent,
          privacySettingsProps,
          defaultSearchExamples,
          connectionStatus,
          onRetryConnection,
          reconnectInfo,
          onScrollForMoreTapped,
          onScrollStarted
        }
      ), !isCompactMode && /* @__PURE__ */ React.createElement(
        SearchResultsPanel$1,
        {
          sources,
          trackProductClick,
          trackCategoryClick,
          trackContentClick,
          messageId: messageId ?? void 0,
          queryContext: queryContext ?? void 0,
          isLoading,
          aiSearchStoreUrl,
          fallbackProductImage,
          fallbackBlogImage,
          showProductTags,
          zeroPriceDisplay
        }
      ))
    ));
  }
  return /* @__PURE__ */ React.createElement(
    "div",
    {
      ref: modalRef,
      className: "omniguide-modal__overlay omniguide-modal__overlay--fullscreen",
      role: "dialog",
      "aria-modal": "true",
      "aria-label": "AI Search"
    },
    /* @__PURE__ */ React.createElement(
      "button",
      {
        onClick: onClose,
        className: "omniguide-modal__close-btn omniguide-modal__close-btn--mobile",
        "aria-label": "Close search"
      },
      /* @__PURE__ */ React.createElement("svg", { width: "20", height: "20", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round" }, /* @__PURE__ */ React.createElement("line", { x1: "18", y1: "6", x2: "6", y2: "18" }), /* @__PURE__ */ React.createElement("line", { x1: "6", y1: "6", x2: "18", y2: "18" }))
    ),
    /* @__PURE__ */ React.createElement("div", { className: "omniguide-mobile-container" }, /* @__PURE__ */ React.createElement(
      "div",
      {
        className: `omniguide-mobile-results-bg ${messages.length === 0 ? "omniguide-mobile-results-bg--initial" : ""} ${isBottomSheetExpanded ? "omniguide-mobile-results-bg--sheet-expanded" : "omniguide-mobile-results-bg--sheet-collapsed"}`,
        ref: mobileResultsRef,
        onScroll: handleMobileScroll,
        onFocus: () => {
          if (isBottomSheetExpanded) {
            setIsBottomSheetExpanded(false);
          }
        }
      },
      /* @__PURE__ */ React.createElement(
        SearchMobileResultsPanel$1,
        {
          messages,
          trackProductClick,
          trackCategoryClick,
          trackContentClick,
          currentSectionIndex,
          isLoading,
          currentQuestion: ((_b = (_a = qaPairs[currentMessageIndex]) == null ? void 0 : _a.userMessage) == null ? void 0 : _b.content) || "",
          isBottomSheetExpanded,
          aiSearchStoreUrl,
          fallbackProductImage,
          fallbackCategoryImage,
          fallbackBlogImage,
          showProductTags,
          zeroPriceDisplay
        }
      )
    ), /* @__PURE__ */ React.createElement(
      "div",
      {
        className: `omniguide-mobile-bottom-sheet ${isBottomSheetExpanded ? "omniguide-mobile-bottom-sheet--expanded" : "omniguide-mobile-bottom-sheet--collapsed"} ${messages.length === 0 ? "omniguide-mobile-bottom-sheet--initial" : ""}`,
        onClick: () => {
          if (!isBottomSheetExpanded) {
            setIsBottomSheetExpanded(true);
          }
        },
        onFocus: () => {
          if (!isBottomSheetExpanded) {
            setIsBottomSheetExpanded(true);
          }
        }
      },
      /* @__PURE__ */ React.createElement("div", { className: "omniguide-mobile-bottom-sheet__handle" }, /* @__PURE__ */ React.createElement("div", { className: "omniguide-mobile-bottom-sheet__handle-bar" })),
      /* @__PURE__ */ React.createElement(
        SearchChatPanel$1,
        {
          messages,
          onSendMessage: handleSendMessage,
          isLoading,
          isMobile: true,
          isOpen,
          isCollapsed: !isBottomSheetExpanded,
          onCollapseToggle: () => setIsBottomSheetExpanded(true),
          pipelineStatus,
          onIntentAnswer,
          onCustomIntentAnswer: handleSendMessage,
          onClarificationAnswer,
          onCustomClarificationAnswer: handleSendMessage,
          onResetChat,
          welcomeText,
          seedQuestions,
          currentMessageIndex,
          onMessageIndexChange: handleMessageIndexChange,
          fetchProductUrls,
          conversationId,
          FeedbackWidgetComponent,
          defaultSearchExamples,
          connectionStatus,
          onRetryConnection,
          reconnectInfo,
          onScrollForMoreTapped,
          onScrollStarted
        }
      )
    ), /* @__PURE__ */ React.createElement(
      SearchPrivacySettings,
      {
        isMobile: true,
        onResetChat,
        sessionId,
        privacyPolicyUrl,
        onOpenSupport,
        consentEnabled,
        onToggleConsent,
        consentDisabled
      }
    ))
  );
};
const log$2 = createScopedLogger("productUrls");
async function fetchProductUrlsBySkus(skus, config) {
  var _a;
  if (!skus || skus.length === 0) return {};
  const graphqlToken = ((_a = config.getGraphQLToken) == null ? void 0 : _a.call(config)) ?? null;
  try {
    const headers = {
      "Content-Type": "application/json"
    };
    if (graphqlToken) {
      headers["X-Storefront-Token"] = graphqlToken;
    }
    const response = await fetch(
      `${config.apiBaseUrl}/api/v1/bc-search-products`,
      {
        method: "POST",
        headers,
        body: JSON.stringify({
          skus,
          website_code: config.websiteId,
          graphql_token: graphqlToken
        })
      }
    );
    if (!response.ok) {
      log$2.warn("Failed to fetch product URLs: HTTP", response.status);
      return {};
    }
    const data = await response.json();
    const products = (data == null ? void 0 : data.products) ?? [];
    const urlMap = {};
    products.forEach((product) => {
      var _a2;
      const productUrl = product["url"] ?? product["path"] ?? ((_a2 = product["custom_url"]) == null ? void 0 : _a2["url"]);
      if (product["sku"] && productUrl) {
        urlMap[String(product["sku"])] = productUrl;
      }
    });
    const missingSkus = skus.filter((sku) => !urlMap[String(sku)]);
    if (missingSkus.length > 0) {
      log$2.warn("Product URLs not found for SKUs:", missingSkus);
    }
    return urlMap;
  } catch (error) {
    log$2.warn("Failed to fetch product URLs:", error);
    return {};
  }
}
const log$1 = createScopedLogger("useSessionInit");
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
        const url = `${apiBaseUrl}${API_ENDPOINTS.CONVERSATIONAL_SEARCH_INIT}`;
        const response = await fetch(url, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            website_code: websiteId,
            session_id: currentSessionId,
            current_page: getCurrentPage()
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
        log$1.error("Failed to initialize session:", error);
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
const log = createScopedLogger("BCSearchContainer");
const SEARCH_HASH = "#!/search";
function BCSearchContainer() {
  var _a;
  const { config, platformAdapter, consentService } = useOmniguideContext();
  const FeedbackWidgetComponent = useFeedbackWidget();
  const {
    websiteId,
    aiSearchStoreUrl,
    callbacks,
    consent,
    fallbackImages,
    ui
  } = config;
  const [isOpen, setIsOpen] = useState(() => {
    var _a2;
    return window.location.hash === SEARCH_HASH && (((_a2 = callbacks == null ? void 0 : callbacks.isFeatureEnabled) == null ? void 0 : _a2.call(callbacks)) ?? true);
  });
  const sessionStartRef = useRef(null);
  const [isConversational, setIsConversational] = useState(() => {
    const storedMode = localStorage.getItem("aiSearch");
    if (storedMode !== null) return storedMode === "true";
    return true;
  });
  const { sessionId, welcomeText, seedQuestions } = useSessionInit();
  const {
    trackMessageSent,
    trackProductClick,
    trackCategoryClick,
    trackContentClick,
    trackComponentClose,
    trackSearchOpened,
    trackQuestionAnswered,
    trackRecommendationProvided,
    trackStartOver,
    trackScrollForMore,
    trackScrollStarted
  } = useAnalyticsTracking({ websiteId });
  const {
    messages,
    query,
    setQuery,
    isLoading,
    conversationId,
    sendMessage,
    sendIntentAnswer,
    sendClarificationAnswer,
    handleResetChat,
    pipelineStatus,
    connectionStatus,
    hasAttemptedConnection,
    reconnectInfo,
    connect
  } = useBCSearchChat({
    trackMessageSent,
    trackQuestionAnswered,
    trackRecommendationProvided,
    trackStartOver,
    autoConnect: false,
    sessionId
  });
  const { analytics, advertising, websiteConsent, omniguideConsent } = useUserConsent();
  const consentEnabled = analytics && advertising;
  const handleToggleConsent = useCallback(async () => {
    try {
      if (consentService && sessionId && websiteConsent) {
        await consentService.updatePreferences(sessionId, !omniguideConsent);
      }
    } catch (error) {
      log.error("Failed to update consent preferences:", error);
    }
  }, [consentService, sessionId, websiteConsent, omniguideConsent]);
  const hydrationConfig = useMemo(
    () => ({
      apiBaseUrl: config.apiBaseUrl,
      websiteId,
      getGraphQLToken: () => platformAdapter.getCredentials()["graphQLToken"] ?? null
    }),
    [config.apiBaseUrl, websiteId, platformAdapter]
  );
  const fetchProductUrls = useCallback(
    (skus) => fetchProductUrlsBySkus(skus, hydrationConfig),
    [hydrationConfig]
  );
  useEffect(() => {
    if (isOpen) {
      if (window.location.hash !== SEARCH_HASH) {
        window.history.pushState(null, "", SEARCH_HASH);
      }
    } else {
      if (window.location.hash === SEARCH_HASH) {
        window.history.pushState(
          null,
          "",
          window.location.pathname + window.location.search
        );
      }
    }
  }, [isOpen]);
  useEffect(() => {
    const handleHashChange = () => {
      var _a2;
      const shouldBeOpen = window.location.hash === SEARCH_HASH && (((_a2 = callbacks == null ? void 0 : callbacks.isFeatureEnabled) == null ? void 0 : _a2.call(callbacks)) ?? true);
      setIsOpen(shouldBeOpen);
      if (!shouldBeOpen) {
        window.dispatchEvent(new CustomEvent("closeAISearch", { detail: { websiteId } }));
      }
    };
    window.addEventListener("hashchange", handleHashChange);
    return () => window.removeEventListener("hashchange", handleHashChange);
  }, [callbacks]);
  useEffect(() => {
    if (isOpen && sessionId && !sessionStartRef.current) {
      sessionStartRef.current = Date.now();
      setSessionStart(websiteId, Date.now());
      connect().catch((err) => {
        log.error("WebSocket connect failed:", err);
        log.debug("Connection context:", {
          websiteId,
          apiBaseUrl: config.apiBaseUrl,
          sessionId: sessionId ? `${sessionId.substring(0, 20)}...` : "(none)",
          origin: window.location.origin,
          aiSearchStoreUrl
        });
      });
    }
    if (!isOpen && sessionStartRef.current) {
      sessionStartRef.current = null;
    }
  }, [isOpen, sessionId, connect]);
  useEffect(() => {
    localStorage.setItem("aiSearch", isConversational.toString());
    const handleSearchOpen = (event) => {
      var _a2, _b, _c;
      if (((_a2 = event.detail) == null ? void 0 : _a2.websiteId) && event.detail.websiteId !== websiteId) return;
      setIsOpen(true);
      trackSearchOpened({
        source: ((_b = event.detail) == null ? void 0 : _b.source) || "search_button",
        page_type: window.location.pathname.includes("/products/") ? "product" : window.location.pathname.includes("/category/") ? "category" : "other"
      });
      if ((_c = event.detail) == null ? void 0 : _c.query) {
        setQuery(event.detail.query);
      }
    };
    window.addEventListener(
      "openAISearch",
      handleSearchOpen
    );
    const handleEscape = (e) => {
      if (e.key === "Escape" && isOpen) {
        setIsOpen(false);
        window.dispatchEvent(new CustomEvent("closeAISearch", { detail: { websiteId } }));
      }
    };
    document.addEventListener("keydown", handleEscape);
    return () => {
      window.removeEventListener(
        "openAISearch",
        handleSearchOpen
      );
      document.removeEventListener("keydown", handleEscape);
    };
  }, [isOpen, setQuery, isConversational, trackSearchOpened]);
  const handleOpenSupport = useCallback(() => {
    var _a2;
    (_a2 = callbacks == null ? void 0 : callbacks.onOpenSupport) == null ? void 0 : _a2.call(callbacks);
  }, [callbacks]);
  const handleModalOpen = useCallback(() => {
    var _a2;
    (_a2 = callbacks == null ? void 0 : callbacks.onModalOpen) == null ? void 0 : _a2.call(callbacks);
  }, [callbacks]);
  const handleModalClose = useCallback(() => {
    var _a2;
    (_a2 = callbacks == null ? void 0 : callbacks.onModalClose) == null ? void 0 : _a2.call(callbacks);
  }, [callbacks]);
  const handleSubmit = useCallback(
    (e) => {
      e.preventDefault();
      const searchQuery = e._directQuery || query;
      if (!searchQuery.trim() || isLoading) return;
      if (isConversational) {
        sendMessage(searchQuery);
      } else {
        window.location.href = `/search.php?search_query=${encodeURIComponent(searchQuery)}`;
      }
      setQuery("");
    },
    [query, isLoading, isConversational, sendMessage, setQuery]
  );
  const handleModeToggle = useCallback(() => {
    setIsConversational((prev) => !prev);
  }, []);
  const handleClose = useCallback(() => {
    if (trackComponentClose && sessionStartRef.current) {
      const duration = Date.now() - sessionStartRef.current;
      trackComponentClose({
        sessionDurationMs: duration,
        totalMessages: messages.length
      });
    }
    setIsOpen(false);
    window.dispatchEvent(new CustomEvent("closeAISearch", { detail: { websiteId } }));
  }, [trackComponentClose, messages.length, websiteId]);
  const adaptedTrackProductClick = useCallback(
    (data) => trackProductClick(data),
    [trackProductClick]
  );
  const adaptedTrackCategoryClick = useCallback(
    (data) => trackCategoryClick(data),
    [trackCategoryClick]
  );
  const adaptedTrackContentClick = useCallback(
    (data) => trackContentClick(data),
    [trackContentClick]
  );
  const handleScrollForMoreTapped = useCallback(
    (messageId) => trackScrollForMore({ messageId }),
    [trackScrollForMore]
  );
  const handleScrollStarted = useCallback(
    (messageId) => trackScrollStarted({ messageId }),
    [trackScrollStarted]
  );
  const adaptedSendIntentAnswer = useCallback(
    (answerText, answerId, options) => {
      sendIntentAnswer(answerText, String(answerId), options);
    },
    [sendIntentAnswer]
  );
  const adaptedSendClarificationAnswer = useCallback(
    (answerText, optionId, paramName) => {
      sendClarificationAnswer(answerText, String(optionId), paramName);
    },
    [sendClarificationAnswer]
  );
  return /* @__PURE__ */ React.createElement(
    SearchUI,
    {
      isOpen,
      onClose: handleClose,
      onResetChat: handleResetChat,
      onSubmit: handleSubmit,
      query,
      setQuery,
      messages,
      isLoading,
      conversationId: conversationId ?? void 0,
      isConversational,
      onModeToggle: handleModeToggle,
      trackProductClick: adaptedTrackProductClick,
      trackCategoryClick: adaptedTrackCategoryClick,
      trackContentClick: adaptedTrackContentClick,
      pipelineStatus,
      onIntentAnswer: adaptedSendIntentAnswer,
      onClarificationAnswer: adaptedSendClarificationAnswer,
      connectionStatus: hasAttemptedConnection ? connectionStatus : void 0,
      onRetryConnection: connect,
      reconnectInfo,
      welcomeText,
      seedQuestions,
      title: (ui == null ? void 0 : ui.searchTitle) ?? "Smart Shopping",
      aiSearchStoreUrl,
      fallbackProductImage: fallbackImages == null ? void 0 : fallbackImages.product,
      fallbackCategoryImage: fallbackImages == null ? void 0 : fallbackImages.category,
      fallbackBlogImage: fallbackImages == null ? void 0 : fallbackImages.blog,
      fetchProductUrls,
      sessionId: sessionId ?? "",
      FeedbackWidgetComponent,
      onOpenSupport: handleOpenSupport,
      onModalOpen: handleModalOpen,
      onModalClose: handleModalClose,
      privacyPolicyUrl: (consent == null ? void 0 : consent.privacyPolicyUrl) ?? "/privacy-policy",
      defaultSearchExamples: ui == null ? void 0 : ui.searchExampleQuestions,
      consentEnabled: (consent == null ? void 0 : consent.enabled) ? consentEnabled : void 0,
      onToggleConsent: (consent == null ? void 0 : consent.enabled) ? handleToggleConsent : void 0,
      consentDisabled: (consent == null ? void 0 : consent.enabled) ? !websiteConsent : void 0,
      showProductTags: ((_a = config.features) == null ? void 0 : _a.productTags) !== false,
      zeroPriceDisplay: ui == null ? void 0 : ui.zeroPriceDisplay,
      onScrollForMoreTapped: handleScrollForMoreTapped,
      onScrollStarted: handleScrollStarted
    }
  );
}
class BCMobileSearchIntegration {
  constructor(parent, config) {
    var _a;
    this.replacementId = "ai-mobile-search-replacement";
    this.styleId = "ai-mobile-search-styles";
    this.observer = null;
    this.parent = parent;
    const mobileConfig = ((_a = config.ui) == null ? void 0 : _a.mobile) ?? {};
    this.breakpoint = mobileConfig.breakpoint ?? 767;
    this.searchWidth = mobileConfig.searchWidth ?? "80%";
    this.init();
  }
  init() {
    this.injectStyles();
    this.replaceSearchBar();
    this.observeForSearchBar();
  }
  injectStyles() {
    if (document.getElementById(this.styleId)) return;
    const style = document.createElement("style");
    style.id = this.styleId;
    style.textContent = `
      @media (max-width: ${this.breakpoint}px) {
        .navPages-quickSearch form,
        .navPages-quickSearch input,
        .navPages-quickSearch button[type="submit"] {
          display: none !important;
        }
        #${this.replacementId} {
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
      @media (min-width: ${this.breakpoint + 1}px) {
        #${this.replacementId} {
          display: none !important;
        }
      }
    `;
    document.head.appendChild(style);
  }
  replaceSearchBar() {
    const tryReplace = () => {
      if (document.getElementById(this.replacementId)) return true;
      const searchContainer = document.querySelector(".navPages-quickSearch");
      if (!searchContainer) return false;
      const replacement = this.createSearchReplacement();
      searchContainer.innerHTML = "";
      searchContainer.appendChild(replacement);
      requestAnimationFrame(() => {
        replacement.style.width = "auto";
        requestAnimationFrame(() => {
          replacement.style.width = this.searchWidth;
        });
      });
      return true;
    };
    if (!tryReplace()) {
      setTimeout(tryReplace, 100);
    }
  }
  observeForSearchBar() {
    this.observer = new MutationObserver(() => {
      const searchContainer = document.querySelector(".navPages-quickSearch");
      if (searchContainer && !document.getElementById(this.replacementId)) {
        this.replaceSearchBar();
      }
    });
    this.observer.observe(document.body, {
      childList: true,
      subtree: true
    });
  }
  createSearchReplacement() {
    const container = document.createElement("div");
    container.id = this.replacementId;
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
      width: this.searchWidth,
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
      this.closeMobileNav();
      this.parent.openSearch("", "mobile_menu_search");
    });
    container.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        this.closeMobileNav();
        this.parent.openSearch("", "mobile_menu_search_keyboard");
      }
    });
    return container;
  }
  /**
   * Close the mobile nav before opening search.
   * BigCommerce Stencil headers use position: sticky/fixed — when the nav is open
   * (.header.is-open) it covers the full viewport, intercepting touch events
   * behind the search modal.
   */
  closeMobileNav() {
    document.body.classList.remove("has-activeNavPages");
    const header = document.querySelector(".header");
    if (header) header.classList.remove("is-open");
    const navContainer = document.querySelector(".navPages-container");
    if (navContainer) navContainer.classList.remove("is-open");
    const menuToggle = document.querySelector(".mobileMenu-toggle");
    if (menuToggle) {
      menuToggle.classList.remove("is-open");
      menuToggle.setAttribute("aria-expanded", "false");
    }
  }
  destroy() {
    var _a, _b, _c;
    (_a = document.getElementById(this.replacementId)) == null ? void 0 : _a.remove();
    (_b = document.getElementById(this.styleId)) == null ? void 0 : _b.remove();
    (_c = this.observer) == null ? void 0 : _c.disconnect();
  }
}
const MOUNTED_ATTR = "data-omniguide-mounted";
class BCSearchIntegration {
  constructor({ config, platformAdapter, storageAdapter, ContainerComponent, components, skipDomSetup }) {
    this.root = null;
    this.mountedContainer = null;
    this.mobileIntegration = null;
    this.handleClose = null;
    this._eventListeners = [];
    this.initialized = false;
    this.omniguideConfig = config;
    this.platformAdapter = platformAdapter;
    this.storageAdapter = storageAdapter;
    this.containerComponent = ContainerComponent;
    this.components = components;
    this.skipDomSetup = skipDomSetup ?? false;
  }
  init() {
    var _a;
    const selectors = this.omniguideConfig.selectors ?? {};
    const rootId = selectors.rootContainer ?? "ai-search-root";
    const existingContainer = document.getElementById(rootId);
    if (this.root && this.mountedContainer && this.mountedContainer === existingContainer && document.body.contains(this.mountedContainer)) {
      this.initialized = true;
      return true;
    }
    if (this.root && this.mountedContainer !== existingContainer) {
      try {
        this.root.unmount();
      } catch {
      }
      (_a = this.mountedContainer) == null ? void 0 : _a.removeAttribute(MOUNTED_ATTR);
      this.root = null;
      this.mountedContainer = null;
    }
    this.createContainer(rootId);
    this.mountComponent(rootId);
    this.hideDefaultSearch(rootId);
    if (!this.skipDomSetup) {
      this.overrideSearchBehavior();
      this.swapSearchIcon();
      this.mobileIntegration = new BCMobileSearchIntegration(this, this.omniguideConfig);
    }
    const websiteId = this.omniguideConfig.websiteId;
    this.handleClose = () => {
      if (document.body.getAttribute("data-omniguide-search") === websiteId) {
        document.body.classList.remove("ai-search-active");
        document.body.removeAttribute("data-omniguide-search");
      }
    };
    window.addEventListener("closeAISearch", ((e) => {
      var _a2;
      if (((_a2 = e.detail) == null ? void 0 : _a2.websiteId) && e.detail.websiteId !== websiteId) return;
      this.handleClose();
    }));
    this.initialized = true;
    return true;
  }
  openSearch(query = "", source = "unknown") {
    document.body.classList.add("ai-search-active");
    document.body.setAttribute("data-omniguide-search", this.omniguideConfig.websiteId);
    window.dispatchEvent(new CustomEvent("openAISearch", {
      detail: { query, source, websiteId: this.omniguideConfig.websiteId }
    }));
  }
  createContainer(rootId) {
    if (document.getElementById(rootId)) return;
    const container = document.createElement("div");
    container.id = rootId;
    document.body.appendChild(container);
  }
  mountComponent(rootId) {
    const container = document.getElementById(rootId);
    if (container && !container.hasAttribute(MOUNTED_ATTR)) {
      container.setAttribute(MOUNTED_ATTR, "true");
      this.root = createRoot(container);
      this.mountedContainer = container;
      const Container = this.containerComponent ?? BCSearchContainer;
      const providerProps = {
        config: this.omniguideConfig,
        platformAdapter: this.platformAdapter,
        storageAdapter: this.storageAdapter,
        components: this.components,
        children: /* @__PURE__ */ React.createElement(Container, null)
      };
      this.root.render(/* @__PURE__ */ React.createElement(OmniguideProvider, { ...providerProps }));
    }
  }
  hideDefaultSearch(rootId) {
    const selectors = this.omniguideConfig.selectors ?? {};
    const quickSearchResults = selectors.quickSearchResults ?? '.quickSearchResults, [data-search="quickResults"]';
    const style = document.createElement("style");
    const quickSearchSelectors = quickSearchResults.split(",").map((s) => `body.ai-search-active ${s.trim()}`).join(",\n            ");
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
  swapSearchIcon() {
    const selectors = this.omniguideConfig.selectors ?? {};
    const expandSelector = selectors.searchExpandButton ?? "#quick-search-expand";
    const expandId = expandSelector.replace(/^#/, "");
    const searchExpand = document.getElementById(expandId);
    if (!searchExpand) return;
    const existingSvg = searchExpand.querySelector("svg");
    if (!existingSvg) return;
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
  }
  overrideSearchBehavior() {
    const isWordPress = this.isWordPressEnvironment();
    const isDesktop = window.innerWidth > 767;
    if (isDesktop) {
      if (isWordPress) {
        this.overrideWordPressSearch();
      } else {
        this.overrideDesktopSearch();
      }
    }
  }
  isWordPressEnvironment() {
    var _a;
    const selectors = this.omniguideConfig.selectors ?? {};
    const wpSearchButton = ((_a = selectors.wordpress) == null ? void 0 : _a.searchButton) ?? ".header-search-btn";
    return window.location.pathname.includes("/blog") || document.querySelector(wpSearchButton) !== null || document.body.classList.contains("blog");
  }
  overrideWordPressSearch() {
    const selectors = this.omniguideConfig.selectors ?? {};
    const wp = selectors.wordpress ?? {};
    const wpSearchButton = wp.searchButton ?? ".header-search-btn";
    const wpSearchForms = wp.searchForms ?? ".header-search form, form.search-form";
    const wpSearchInputs = wp.searchInputs ?? '.header-search input[type="search"], .search-field';
    document.querySelectorAll(wpSearchButton).forEach((button) => {
      this._addTrackedListener(button, "click", ((e) => {
        e.preventDefault();
        e.stopImmediatePropagation();
        this.openSearch("", "wordpress_search_button");
      }), true);
    });
    document.querySelectorAll(wpSearchForms).forEach((form) => {
      this._addTrackedListener(form, "submit", ((e) => {
        e.preventDefault();
        e.stopImmediatePropagation();
        const input = form.querySelector('input[type="search"], .search-field');
        const query = (input == null ? void 0 : input.value) ?? "";
        this.openSearch(query, "wordpress_search_form_submit");
        if (input) input.value = "";
      }), true);
    });
    document.querySelectorAll(wpSearchInputs).forEach((input) => {
      this._addTrackedListener(input, "focus", ((e) => {
        var _a;
        e.preventDefault();
        e.stopImmediatePropagation();
        (_a = e.target) == null ? void 0 : _a.blur();
        this.openSearch("", "wordpress_search_input_focus");
      }), true);
    });
  }
  overrideDesktopSearch() {
    const selectors = this.omniguideConfig.selectors ?? {};
    const searchToggles = selectors.searchToggles ?? '.navUser-action--quickSearch, [aria-label="Search toggle"]';
    const searchInputs = selectors.searchInputs ?? 'input[name="search_query"]';
    const searchForms = selectors.searchForms ?? 'form[action="/search.php"], form[data-search="quickSearch"]';
    const mobileMenu = selectors.mobileMenu ?? "#mobileMenu, .mobileMenu-search";
    document.querySelectorAll(searchToggles).forEach((toggle) => {
      this._addTrackedListener(toggle, "click", ((e) => {
        e.preventDefault();
        e.stopImmediatePropagation();
        this.openSearch("", "nav_search_button");
      }), true);
    });
    const isInMobileMenu = (el) => {
      const menuSelectors = mobileMenu.split(",").map((s) => s.trim());
      return menuSelectors.some((selector) => el.closest(selector));
    };
    document.querySelectorAll(searchInputs).forEach((input) => {
      if (isInMobileMenu(input)) return;
      this._addTrackedListener(input, "focus", ((e) => {
        var _a;
        e.preventDefault();
        e.stopImmediatePropagation();
        (_a = e.target) == null ? void 0 : _a.blur();
        this.openSearch("", "search_input_focus");
      }), true);
    });
    document.querySelectorAll(searchForms).forEach((form) => {
      if (isInMobileMenu(form)) return;
      this._addTrackedListener(form, "submit", ((e) => {
        e.preventDefault();
        e.stopImmediatePropagation();
        const firstInputSelector = (searchInputs.split(",")[0] ?? searchInputs).trim();
        const input = form.querySelector(firstInputSelector);
        const query = (input == null ? void 0 : input.value) ?? "";
        this.openSearch(query, "search_form_submit");
        if (input) input.value = "";
      }), true);
    });
  }
  _addTrackedListener(element, event, handler, options) {
    element.addEventListener(event, handler, options);
    this._eventListeners.push({ element, event, handler, options });
  }
  destroy() {
    var _a;
    if (this.root) {
      this.root.unmount();
      (_a = this.mountedContainer) == null ? void 0 : _a.removeAttribute(MOUNTED_ATTR);
      this.mountedContainer = null;
      this.root = null;
    }
    if (this.mobileIntegration) {
      this.mobileIntegration.destroy();
    }
    this._eventListeners.forEach(({ element, event, handler, options }) => {
      element.removeEventListener(event, handler, options);
    });
    this._eventListeners = [];
    if (this.handleClose) {
      window.removeEventListener("closeAISearch", this.handleClose);
    }
    if (document.body.getAttribute("data-omniguide-search") === this.omniguideConfig.websiteId) {
      document.body.classList.remove("ai-search-active");
      document.body.removeAttribute("data-omniguide-search");
    }
  }
}
export {
  BCSearchIntegration,
  m as buildConfig,
  o as buildPlatformAdapter
};
//# sourceMappingURL=omniguide-search-CNs9AS7a.js.map
