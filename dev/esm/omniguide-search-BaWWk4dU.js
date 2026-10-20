import { R as ReviewInsightsToggle, b as buildSafeUrl, s as safeNavigate, i as isValidNavigationUrl, u as useComponent, S as SearchChatPanel, a as useChatNavigation, c as SearchPrivacySettings, d as SearchChatInput, P as PriceDisplay, p as purify, e as useOmniguideContext, f as useAnalyticsTracking, g as useFeedbackWidget, h as useBCSearchChat, j as useUserConsent, k as buildBCHydrationConfig, l as fetchProductUrlsBySkus, O as OmniguideProvider } from "./shared-BXtab5uU.js";
import { m, n } from "./shared-BXtab5uU.js";
import React, { memo, useRef, useState, useEffect, useMemo, useCallback, useLayoutEffect, useId } from "react";
import { createPortal, flushSync } from "react-dom";
import { createRoot } from "react-dom/client";
import { f as formatPrice, t as transformSummary, s as safeHref, a as sanitizeUrl, T as TYPEAHEAD_MIN_QUERY_LENGTH, b as setSessionId, A as API_ENDPOINTS, g as getCurrentPage, n as normalizeSessionResponse, R as RestSessionResponseSchema, c as setFeatureStatus, d as setSessionStart, e as emitRecommendations } from "./shared-C3FRfYO7.js";
import { l as logger, c as createScopedLogger } from "./shared-hPZZXuBd.js";
import { jsxs, jsx, Fragment } from "react/jsx-runtime";
import { C as CarouselResponseSchema, a as CarouselEventBatchSchema, c as createEventQueue, r as resolveProductRating, P as PLPResponseSchema } from "./shared-DsCASdF5.js";
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
  zeroPriceDisplay = "show",
  variant = "grid"
}) => {
  var _a, _b, _c, _d, _e, _f, _g;
  const redirectTimerRef = useRef(null);
  if (!product) return null;
  const isRail = variant === "rail";
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
  const hasZeroPrice = isZeroPrice(product.price);
  const showCustomZeroPriceText = hasZeroPrice && zeroPriceDisplay !== "show";
  const modifierClass = getModifierClass() || (isRail ? index === 0 ? "omniguide-product-card--top-pick" : "omniguide-product-card--runner-up" : "");
  const isTopPick = modifierClass === "omniguide-product-card--top-pick";
  const railBadgeLabel = ((_b = product.tag) == null ? void 0 : _b.label) || (isTopPick ? "Top pick" : "Runner-up");
  const cardClassName = `omniguide-product-card ${modifierClass} ${isRail ? "omniguide-product-card--rail" : ""}`.trim();
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
    ), discount != null && discount > 0 && /* @__PURE__ */ React.createElement("div", { className: "omniguide-product-card__discount-badge" }, "-", discount, "%"), !isRail && showProductTags && !discount && product.tag && /* @__PURE__ */ React.createElement(ProductTag, { tag: product.tag, classPrefix: "omniguide-ai-tag" })),
    /* @__PURE__ */ React.createElement("div", { className: "omniguide-product-card__body" }, isRail && showProductTags && /* @__PURE__ */ React.createElement("span", { className: "omniguide-product-card__badge" }, railBadgeLabel), /* @__PURE__ */ React.createElement("div", { className: "omniguide-product-card__title-group" }, brandName && /* @__PURE__ */ React.createElement("p", { className: "omniguide-product-card__brand" }, decodeHtmlEntities(brandName)), /* @__PURE__ */ React.createElement("h4", { className: "omniguide-product-card__title" }, decodeHtmlEntities(cleanDisplayName))), /* @__PURE__ */ React.createElement("div", { className: "omniguide-product-card__price-rating-row" }, /* @__PURE__ */ React.createElement("div", { className: "omniguide-product-card__price-group" }, showCustomZeroPriceText ? /* @__PURE__ */ React.createElement("span", { className: "omniguide-product-card__price omniguide-product-card__price--call" }, zeroPriceDisplay) : /* @__PURE__ */ React.createElement(React.Fragment, null, product.price != null && /* @__PURE__ */ React.createElement("span", { className: "omniguide-product-card__price" }, formatPrice(product.price)), product.originalPrice && product.originalPrice !== product.price && /* @__PURE__ */ React.createElement("span", { className: "omniguide-product-card__price omniguide-product-card__price--original" }, formatPrice(product.originalPrice)))), (((_c = product.review_insights) == null ? void 0 : _c.average_rating) != null && product.review_insights.average_rating > 0 || product.rating) && /* @__PURE__ */ React.createElement(
      ReviewInsightsToggle,
      {
        rating: ((_d = product.review_insights) == null ? void 0 : _d.average_rating) || product.rating || 0,
        reviewCount: ((_e = product.review_insights) == null ? void 0 : _e.review_count) || 0,
        summary: (_f = product.review_insights) == null ? void 0 : _f.summary,
        likes: (_g = product.review_insights) == null ? void 0 : _g.likes
      }
    ), isRail && product.matchPct != null && /* @__PURE__ */ React.createElement("span", { className: "omniguide-product-card__match" }, /* @__PURE__ */ React.createElement("span", { className: "omniguide-product-card__match-dot", "aria-hidden": "true" }), product.matchPct, "% match")), isRail && isTopPick && product.summary && /* @__PURE__ */ React.createElement("p", { className: "omniguide-product-card__reason" }, decodeHtmlEntities(product.summary)), isRail && /* @__PURE__ */ React.createElement(
      "button",
      {
        type: "button",
        className: "omniguide-product-card__view",
        onClick: (e) => {
          e.stopPropagation();
          handleClick(e);
        }
      },
      "View product",
      /* @__PURE__ */ React.createElement("svg", { viewBox: "0 0 14 14", width: "13", height: "13", fill: "none", stroke: "currentColor", strokeWidth: "1.9", strokeLinecap: "round", strokeLinejoin: "round", "aria-hidden": "true" }, /* @__PURE__ */ React.createElement("path", { d: "M3 7h8M7.5 3.5L11 7l-3.5 3.5" }))
    ))
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
    /* @__PURE__ */ React.createElement("div", { className: "omniguide-blog-card__body" }, /* @__PURE__ */ React.createElement("h4", { className: "omniguide-blog-card__title" }, decodeHtmlEntities(data.name || "")), data.summary && /* @__PURE__ */ React.createElement("p", { className: "omniguide-blog-card__summary" }, transformSummary(decodeHtmlEntities(data.summary))))
  );
});
SearchBlogCard.displayName = "SearchBlogCard";
const SearchSheetLogo = ({ logo }) => {
  if (logo == null ? void 0 : logo.selector) return /* @__PURE__ */ React.createElement(ClonedLogo, { selector: logo.selector });
  if (!(logo == null ? void 0 : logo.src)) return null;
  const img = /* @__PURE__ */ React.createElement("img", { className: "omniguide-sheet__logo", src: logo.src, alt: logo.alt ?? "" });
  const href = safeHref(logo.href);
  if (logo.href && !href) logger.warn("searchSheetLogo.href is not a safe navigation URL; the logo renders unlinked.");
  return href ? /* @__PURE__ */ React.createElement("a", { className: "omniguide-sheet__logo-link", href }, img) : img;
};
const ClonedLogo = ({ selector }) => {
  const ref = useRef(null);
  useEffect(() => {
    const source = document.querySelector(selector);
    const host = ref.current;
    if (!source) logger.warn(`searchSheetLogo: no element matches selector "${selector}" — the sheet's logo slot is empty.`);
    if (!source || !host) return;
    const copy = source.cloneNode(true);
    [copy, ...copy.querySelectorAll("[id]")].forEach((el) => el.removeAttribute("id"));
    host.replaceChildren(copy);
    host.setAttribute("inert", "");
    return () => host.replaceChildren();
  }, [selector]);
  return /* @__PURE__ */ React.createElement("div", { ref, className: "omniguide-sheet__logo-clone", "aria-hidden": "true" });
};
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
const DEFAULT_TITLES = { products: "Products", categories: "Categories", content: "Related Content" };
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
  zeroPriceDisplay,
  intent,
  relatedContentFirstForQuestions = true,
  titles: titleOverrides
}) => {
  const titles = { ...DEFAULT_TITLES, ...titleOverrides };
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
  const categoriesBlock = categories.length > 0 && /* @__PURE__ */ React.createElement("div", { key: "categories" }, /* @__PURE__ */ React.createElement("h3", { className: "omniguide-results__section-title" }, titles.categories), /* @__PURE__ */ React.createElement(
    CategoryPills,
    {
      categories,
      onCategoryClick: trackCategoryClick,
      messageId,
      queryContext,
      aiSearchStoreUrl
    }
  ));
  const productsBlock = products.length > 0 && /* @__PURE__ */ React.createElement("div", { key: "products" }, /* @__PURE__ */ React.createElement("h3", { className: "omniguide-results__section-title" }, titles.products), /* @__PURE__ */ React.createElement("div", { className: "omniguide-results__rail" }, visibleProducts.map((source, index) => {
    var _a, _b;
    return /* @__PURE__ */ React.createElement(
      SearchProductCard$1,
      {
        key: ((_a = source.data) == null ? void 0 : _a["entityId"]) || ((_b = source.data) == null ? void 0 : _b["id"]) || index,
        product: source.data,
        index,
        variant: "rail",
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
  )));
  const contentBlock = content.length > 0 && /* @__PURE__ */ React.createElement("div", { key: "content" }, /* @__PURE__ */ React.createElement("h3", { className: "omniguide-results__section-title" }, titles.content), /* @__PURE__ */ React.createElement("div", { className: "omniguide-results__content-grid" }, visibleContent.map((source, index) => {
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
  )));
  const contentFirst = relatedContentFirstForQuestions && intent === "question";
  const orderedBlocks = contentFirst ? [contentBlock, categoriesBlock, productsBlock] : [productsBlock, categoriesBlock, contentBlock];
  return /* @__PURE__ */ React.createElement("div", { className: "omniguide-results" }, /* @__PURE__ */ React.createElement("div", { className: "omniguide-results__content" }, isLoading ? /* @__PURE__ */ React.createElement(SkeletonResults, null) : !hasResults ? /* @__PURE__ */ React.createElement("div", { className: "omniguide-results__empty-state" }, /* @__PURE__ */ React.createElement("p", null, "Results will appear here as you search")) : /* @__PURE__ */ React.createElement("div", { style: { display: "flex", flexDirection: "column", gap: "32px" } }, orderedBlocks)));
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
  zeroPriceDisplay,
  relatedContentFirstForQuestions = true
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
          const meta = nextMessage.metadata;
          const intent = meta && typeof meta["intent"] === "string" ? meta["intent"] : null;
          result.push({
            id: message.id,
            question: message.content || "",
            sources: nextMessage.sources,
            messageId: nextMessage.id,
            queryContext: nextMessage.queryContext,
            intent
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
  const productsBlock = products.length > 0 && /* @__PURE__ */ React.createElement("div", { key: "products", className: "omniguide-mobile-results__grid" }, products.map((source, index) => {
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
  }));
  const categoriesBlock = categories.length > 0 && /* @__PURE__ */ React.createElement("div", { key: "categories", style: {
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
  }));
  const contentBlock = content.length > 0 && /* @__PURE__ */ React.createElement("div", { key: "content", className: "omniguide-mobile-results__grid" }, content.map((source, index) => {
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
  }));
  const contentFirst = relatedContentFirstForQuestions && section.intent === "question";
  const orderedBlocks = contentFirst ? [contentBlock, categoriesBlock, productsBlock] : [productsBlock, categoriesBlock, contentBlock];
  return /* @__PURE__ */ React.createElement("div", { className: "omniguide-mobile-results" }, isLoading && /* @__PURE__ */ React.createElement(LoadingOverlay, null), /* @__PURE__ */ React.createElement("div", { key: section.id, id: `section-${section.id}`, className: isLoading ? "omniguide-mobile-results__content--loading" : "" }, /* @__PURE__ */ React.createElement("div", { className: "omniguide-mobile-results__section-header" }, /* @__PURE__ */ React.createElement("h3", { className: "omniguide-mobile-results__section-question" }, displayQuestion)), orderedBlocks));
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
const lockPageScroll$1 = () => {
  const root = document.documentElement;
  const previous = { root: root.style.overflow, body: document.body.style.overflow };
  const reserve = !root.style.scrollbarGutter && window.innerWidth > root.clientWidth;
  if (reserve) root.style.scrollbarGutter = "stable";
  root.style.overflow = "hidden";
  document.body.style.overflow = "hidden";
  return () => {
    root.style.overflow = previous.root;
    document.body.style.overflow = previous.body;
    if (reserve) root.style.scrollbarGutter = "";
  };
};
const useBodyScrollLock = (isLocked) => {
  useEffect(() => isLocked ? lockPageScroll$1() : void 0, [isLocked]);
};
const useFocusTrap = (isActive, containerRef, preferredSelector = null) => {
  useEffect(() => {
    if (!isActive) return;
    const previouslyFocused = typeof document !== "undefined" ? document.activeElement : null;
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
        // An inert subtree (the cloned host logo) cannot take focus; counting it strands Tab.
        (el) => el.offsetParent !== null && !el.closest("[inert]")
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
      if (previouslyFocused && typeof previouslyFocused.focus === "function" && document.contains(previouslyFocused)) {
        previouslyFocused.focus();
      }
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
  const { sources, messageId, queryContext, intent } = useMemo(() => {
    if (qaPairs.length === 0 || currentMessageIndex >= qaPairs.length) {
      return { sources: [], messageId: null, queryContext: null, intent: null };
    }
    const pair = qaPairs[currentMessageIndex];
    if (!pair || pair.type === "thinking" || !pair.assistantMessage) {
      return { sources: [], messageId: null, queryContext: null, intent: null };
    }
    const meta = pair.assistantMessage.metadata;
    const metaIntent = meta && typeof meta["intent"] === "string" ? meta["intent"] : null;
    return {
      sources: pair.assistantMessage.sources ?? [],
      messageId: pair.assistantMessage.id,
      queryContext: pair.assistantMessage.queryContext ?? null,
      intent: metaIntent
    };
  }, [qaPairs, currentMessageIndex]);
  return { sources, messageId, queryContext, currentSectionIndex, intent };
}
const DefaultAISearchIcon = () => /* @__PURE__ */ React.createElement("svg", { xmlns: "http://www.w3.org/2000/svg", width: "28", height: "28", viewBox: "0 0 28 28", fill: "none" }, /* @__PURE__ */ React.createElement("path", { d: "M13.4162 4.66659C11.6858 4.66659 9.9936 5.17953 8.55474 6.14087C5.64375 8.08593 4.15199 11.6898 4.83485 15.1233C5.17248 16.8206 6.00488 18.3806 7.22857 19.6042C9.7041 22.0796 13.5307 22.8397 16.7647 21.5001C20.0002 20.1596 22.1662 16.919 22.1662 13.4166H24.4996C24.4996 15.0997 24.1068 16.7658 23.3755 18.2702C22.6929 19.6743 22.7219 21.4289 23.826 22.5327L26.3282 25.0343L25.0339 26.3285L22.5292 23.8238C21.4257 22.7204 19.6723 22.6936 18.2648 23.3677C14.1137 25.3557 8.92769 24.6027 5.57883 21.254C4.02886 19.704 2.97364 17.7289 2.54595 15.579C1.68088 11.23 3.57111 6.66428 7.25819 4.2006C9.08077 2.98288 11.2243 2.33325 13.4162 2.33325V4.66659Z", fill: "#363B47" }), /* @__PURE__ */ React.createElement("path", { d: "M18.3837 2.39022C18.4778 7.37676 19.4554 8.35378 24.4415 8.448C24.5146 9.02769 24.5146 9.63765 24.4415 10.2174C19.4557 10.3116 18.4779 11.2893 18.3837 16.2751C17.804 16.3482 17.1939 16.3483 16.6143 16.2751C16.5201 11.2891 15.5431 10.3115 10.5565 10.2174C10.4835 9.63771 10.4834 9.02763 10.5565 8.448C15.5433 8.35388 16.5202 7.37703 16.6143 2.39022C17.1939 2.31708 17.8041 2.31714 18.3837 2.39022Z", fill: "#363B47" }));
const SearchUI = ({
  isOpen,
  onClose: closeNow,
  onResetChat,
  onSubmit,
  query: _query,
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
  subtitle = "Shopping Advisor",
  searchIcon,
  anchored,
  anchorSelector,
  anchorMatchWidth,
  onAskAssistant,
  inline,
  inlineTarget,
  onModalOpen,
  onModalClose,
  aiSearchStoreUrl,
  fallbackProductImage,
  fallbackCategoryImage,
  fallbackBlogImage,
  fetchProductUrls,
  sessionId,
  onOpenSupport,
  supportHref,
  supportLabel = "Talk to a specialist",
  privacyPolicyUrl = "/privacy-policy",
  FeedbackWidgetComponent,
  defaultSearchExamples,
  consentEnabled,
  onToggleConsent,
  consentDisabled,
  showProductTags,
  zeroPriceDisplay,
  relatedContentFirstForQuestions,
  onScrollForMoreTapped,
  onScrollStarted,
  typeahead,
  emptyStateFooter,
  onInlineProductLinkClick,
  hideMobileAskBox = false,
  mobileAskPlaceholder,
  onSeeAllResults,
  onSearchSubmit,
  assistantLabel,
  sheet,
  popularTerms,
  currency,
  sheetLogo
}) => {
  var _a, _b;
  const SearchChatPanel$1 = useComponent("SearchChatPanel", SearchChatPanel);
  const SearchResultsPanel$1 = useComponent("SearchResultsPanel", SearchResultsPanel);
  const SearchMobileResultsPanel$1 = useComponent("SearchMobileResultsPanel", SearchMobileResultsPanel);
  const SheetLogo = useComponent("SearchSheetLogo", SearchSheetLogo);
  const [isBottomSheetExpanded, setIsBottomSheetExpanded] = useState(true);
  const [closeButtonHovered, setCloseButtonHovered] = useState(false);
  const [liveQuery, setLiveQuery] = useState("");
  const [typeaheadJump, setTypeaheadJump] = useState(null);
  const [fill, setFill] = useState(null);
  const fillQuery = useCallback(
    (value) => setFill((prev) => ({ value, seq: ((prev == null ? void 0 : prev.seq) ?? 0) + 1 })),
    []
  );
  const mobileResultsRef = useRef(null);
  const modalRef = useRef(null);
  const isMobile = useIsMobile(860);
  const desktopFlow = !isMobile || !!typeahead;
  const sheetShell = !!sheet && !!typeahead && desktopFlow && !inline;
  const [sheetView, setSheetView] = useState(null);
  const askView = sheetShell && (sheetView ?? (messages.length > 0 ? "ask" : "search")) === "ask";
  const isCompactMode = sheetShell ? !askView : !inline && messages.length === 0;
  const sheetActive = sheetShell && isCompactMode;
  const [onClose, sheetClosing] = useExitAnimation(sheetShell, isOpen, closeNow);
  const anchoredRequested = !!anchored && !sheetActive && isOpen && isCompactMode && desktopFlow;
  const [anchorStyle, setAnchorStyle] = useState({});
  const [anchorReady, setAnchorReady] = useState(false);
  const anchoredActive = anchoredRequested && anchorReady;
  useBodyScrollLock(isOpen && !anchoredActive && !inline && !sheetShell);
  useFocusTrap(isOpen && !anchoredActive && !inline, modalRef, ".omniguide-chip--gradient");
  const {
    qaPairs,
    currentMessageIndex,
    setMessageIndex
  } = useChatNavigation({ messages, variant: "search" });
  const { sources, messageId, queryContext, currentSectionIndex, intent } = useMessageSources(qaPairs, currentMessageIndex);
  useEffect(() => {
    if (!isOpen || messages.length === 0) setLiveQuery("");
  }, [isOpen, messages.length]);
  useEffect(() => {
    if (isOpen) return;
    setSheetView(null);
    setFill(null);
  }, [isOpen]);
  useEffect(() => {
    if (isOpen && _query && messages.length === 0) fillQuery(_query);
  }, [isOpen]);
  const backToSearch = useCallback(() => {
    setSheetView("search");
    setLiveQuery("");
    setFill(null);
  }, []);
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
  useLayoutEffect(() => {
    if (!anchoredRequested) {
      setAnchorReady(false);
      return;
    }
    if (!anchorSelector) {
      logger.warn("anchoredSearch is enabled but no `searchAnchorSelector` was provided — falling back to a centered modal.");
      setAnchorReady(false);
      return;
    }
    let anchor = null;
    try {
      anchor = document.querySelector(anchorSelector);
    } catch {
      logger.warn(`anchoredSearch: searchAnchorSelector "${anchorSelector}" is not a valid CSS selector — falling back to a centered modal.`);
      setAnchorReady(false);
      return;
    }
    if (!anchor) {
      logger.warn(`anchoredSearch: no element matches searchAnchorSelector "${anchorSelector}" — falling back to a centered modal.`);
      setAnchorReady(false);
      return;
    }
    const MIN_WIDTH = 480;
    const MAX_WIDTH = 560;
    const EDGE = 8;
    let last = { top: NaN, left: NaN, width: NaN };
    const reposition = () => {
      const r = anchor.getBoundingClientRect();
      const available = window.innerWidth - EDGE * 2;
      const width = anchorMatchWidth ? Math.min(r.width, available) : Math.min(Math.max(r.width, MIN_WIDTH), MAX_WIDTH, available);
      const desiredLeft = anchorMatchWidth ? r.left : r.right - width;
      const left = Math.max(EDGE, Math.min(desiredLeft, window.innerWidth - width - EDGE));
      const next = { top: Math.round(r.top), left: Math.round(left), width: Math.round(width) };
      if (next.top === last.top && next.left === last.left && next.width === last.width) return;
      last = next;
      setAnchorStyle(next);
    };
    reposition();
    window.addEventListener("scroll", reposition, true);
    window.addEventListener("resize", reposition);
    const ro = typeof ResizeObserver !== "undefined" ? new ResizeObserver(reposition) : null;
    ro == null ? void 0 : ro.observe(anchor);
    if (document.body) ro == null ? void 0 : ro.observe(document.body);
    let frame = 0;
    const pollPosition = () => {
      reposition();
      frame = requestAnimationFrame(pollPosition);
    };
    if (typeof requestAnimationFrame !== "undefined") {
      frame = requestAnimationFrame(pollPosition);
    }
    const prevVisibility = anchor.style.visibility;
    anchor.style.visibility = "hidden";
    const onDocMouseDown = (e) => {
      var _a2;
      const target = e.target;
      if ((_a2 = modalRef.current) == null ? void 0 : _a2.contains(target)) return;
      onClose();
    };
    document.addEventListener("mousedown", onDocMouseDown);
    setAnchorReady(true);
    return () => {
      window.removeEventListener("scroll", reposition, true);
      window.removeEventListener("resize", reposition);
      ro == null ? void 0 : ro.disconnect();
      if (frame) cancelAnimationFrame(frame);
      document.removeEventListener("mousedown", onDocMouseDown);
      anchor.style.visibility = prevVisibility;
      setAnchorReady(false);
    };
  }, [anchoredRequested, anchorSelector, anchorMatchWidth, onClose]);
  useEffect(() => {
    if (!isOpen || inline) return;
    const onKeyDown = (e) => {
      if (e.key !== "Escape") return;
      e.preventDefault();
      if (askView) backToSearch();
      else onClose();
    };
    document.addEventListener("keydown", onKeyDown, true);
    return () => document.removeEventListener("keydown", onKeyDown, true);
  }, [isOpen, inline, onClose, askView, backToSearch]);
  const handleSendMessage = (content) => {
    setSheetView("ask");
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
  const askAssistant = (content) => {
    if (!onAskAssistant) {
      handleSendMessage(content);
      return;
    }
    setSheetView("ask");
    onAskAssistant(content);
  };
  useEffect(() => {
    var _a2;
    const modal = modalRef.current;
    if (!sheetShell || !isOpen || !modal) return;
    const active = document.activeElement;
    if (active && modal.contains(active) && !active.disabled) return;
    (_a2 = modal.querySelector(".omniguide-chat__input:not(:disabled)") ?? modal.querySelector(".omniguide-sheet__back")) == null ? void 0 : _a2.focus();
  }, [askView, isLoading]);
  const askDisabled = isLoading || ["connecting", "reconnecting", "disconnected"].includes(connectionStatus ?? "");
  const openAsk = () => {
    var _a2, _b2;
    const typed = liveQuery.trim();
    const lastAsked = (_b2 = (_a2 = qaPairs[qaPairs.length - 1]) == null ? void 0 : _a2.userMessage) == null ? void 0 : _b2.content;
    if (typed && typed !== lastAsked) askAssistant(typed);
    else setSheetView("ask");
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
  const assistantName = (assistantLabel == null ? void 0 : assistantLabel.trim()) || "Ask the assistant";
  const searchInput = /* @__PURE__ */ React.createElement(
    SearchChatInput,
    {
      onSendMessage: handleSendMessage,
      onValueChange: setLiveQuery,
      isLoading,
      isMobile: false,
      topSearch: true,
      jump: typeaheadJump,
      aiSearchStoreUrl,
      assistantLabel,
      onAskAssistant: sheetActive ? void 0 : askAssistant,
      onSearchSubmit,
      connectionStatus,
      reconnectInfo,
      fill,
      clearable: sheetActive
    }
  );
  if (desktopFlow) {
    const modalBody = /* @__PURE__ */ React.createElement(
      "div",
      {
        ref: modalRef,
        className: inline ? "omniguide-search-inline" : `omniguide-modal__overlay ${isCompactMode ? "omniguide-modal__overlay--compact" : ""} ${anchoredActive ? "omniguide-modal__overlay--anchored" : ""} ${sheetShell ? "omniguide-modal__overlay--sheet" : ""} ${askView ? "omniguide-modal__overlay--sheet-ask" : ""} ${sheetClosing ? "omniguide-modal__overlay--closing" : ""}`,
        style: inline ? void 0 : anchoredActive ? anchorStyle : void 0,
        role: "dialog",
        "aria-modal": inline || anchoredActive ? void 0 : "true",
        "aria-label": "AI Search"
      },
      inline && /* @__PURE__ */ React.createElement(
        "button",
        {
          type: "button",
          className: "omniguide-search-inline__close",
          onClick: onClose,
          "aria-label": "Close"
        },
        /* @__PURE__ */ React.createElement("svg", { width: "18", height: "18", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round" }, /* @__PURE__ */ React.createElement("line", { x1: "18", y1: "6", x2: "6", y2: "18" }), /* @__PURE__ */ React.createElement("line", { x1: "6", y1: "6", x2: "18", y2: "18" }))
      ),
      isCompactMode ? /* @__PURE__ */ React.createElement("div", { className: "omniguide-modal__searchbar" }, sheetActive && /* @__PURE__ */ React.createElement("div", { className: "omniguide-sheet__brand" }, /* @__PURE__ */ React.createElement(SheetLogo, { logo: sheetLogo })), sheetActive ? /* @__PURE__ */ React.createElement("div", { className: "omniguide-sheet__field" }, searchInput, /* @__PURE__ */ React.createElement("span", { className: "omniguide-sheet__or", "aria-hidden": "true" }, "or"), /* @__PURE__ */ React.createElement("button", { type: "button", className: "omniguide-sheet__ask-open", onMouseDown: (e) => e.preventDefault(), onClick: openAsk, disabled: askDisabled }, /* @__PURE__ */ React.createElement("span", { className: "omniguide-sheet__spark", "aria-hidden": "true" }, /* @__PURE__ */ React.createElement(SparkleIcon$1, { size: 16 })), assistantName)) : searchInput, sheetActive ? /* @__PURE__ */ React.createElement("div", { className: "omniguide-sheet__corner" }, /* @__PURE__ */ React.createElement(SheetCloseButton, { onClose })) : /* @__PURE__ */ React.createElement(
        "button",
        {
          onClick: onClose,
          className: "omniguide-modal__close-btn omniguide-modal__close-btn--inline",
          "data-hovered": closeButtonHovered,
          onMouseEnter: () => setCloseButtonHovered(true),
          onMouseLeave: () => setCloseButtonHovered(false),
          "aria-label": "Close search"
        },
        /* @__PURE__ */ React.createElement("svg", { width: "20", height: "20", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round" }, /* @__PURE__ */ React.createElement("line", { x1: "18", y1: "6", x2: "6", y2: "18" }), /* @__PURE__ */ React.createElement("line", { x1: "6", y1: "6", x2: "18", y2: "18" }))
      )) : askView ? /* @__PURE__ */ React.createElement("div", { className: "omniguide-modal__searchbar" }, /* @__PURE__ */ React.createElement("div", { className: "omniguide-sheet__brand" }, /* @__PURE__ */ React.createElement(SheetLogo, { logo: sheetLogo })), /* @__PURE__ */ React.createElement("div", { className: "omniguide-sheet__ask-title" }, /* @__PURE__ */ React.createElement("span", { className: "omniguide-sheet__spark omniguide-sheet__spark--lg", "aria-hidden": "true" }, /* @__PURE__ */ React.createElement(SparkleIcon$1, { size: 18 })), /* @__PURE__ */ React.createElement("h2", null, assistantName)), /* @__PURE__ */ React.createElement("div", { className: "omniguide-sheet__corner" }, /* @__PURE__ */ React.createElement("button", { type: "button", className: "omniguide-sheet__back", onClick: backToSearch }, /* @__PURE__ */ React.createElement("svg", { width: "16", height: "16", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", "aria-hidden": "true" }, /* @__PURE__ */ React.createElement("path", { d: "m12 19-7-7 7-7M19 12H5" })), "Back to search"), /* @__PURE__ */ React.createElement(SheetCloseButton, { onClose }))) : !inline && /* @__PURE__ */ React.createElement("div", { className: "omniguide-modal__header" }, /* @__PURE__ */ React.createElement("span", { className: "omniguide-modal__header-icon", "aria-hidden": "true" }, searchIcon || /* @__PURE__ */ React.createElement(DefaultAISearchIcon, null)), /* @__PURE__ */ React.createElement("div", { className: "omniguide-modal__header-titles" }, /* @__PURE__ */ React.createElement("h1", { className: "omniguide-modal__header-title" }, title), /* @__PURE__ */ React.createElement("span", { className: "omniguide-modal__header-sub" }, subtitle)), /* @__PURE__ */ React.createElement("span", { className: "omniguide-modal__header-spacer" }), /* @__PURE__ */ React.createElement("span", { className: "omniguide-modal__header-pill" }, /* @__PURE__ */ React.createElement("span", { className: "omniguide-modal__header-led", "aria-hidden": "true" }), "AI-assisted"), (supportHref || onOpenSupport) && (supportHref ? /* @__PURE__ */ React.createElement(
        "a",
        {
          href: supportHref,
          target: "_blank",
          rel: "noopener noreferrer",
          className: "omniguide-modal__header-talk",
          onClick: onOpenSupport
        },
        supportLabel,
        /* @__PURE__ */ React.createElement("svg", { viewBox: "0 0 16 16", width: "13", height: "13", fill: "none", stroke: "currentColor", strokeWidth: "1.7", strokeLinecap: "round", strokeLinejoin: "round", "aria-hidden": "true" }, /* @__PURE__ */ React.createElement("path", { d: "M3 8h9M8.5 4l4 4-4 4" }))
      ) : /* @__PURE__ */ React.createElement(
        "button",
        {
          type: "button",
          className: "omniguide-modal__header-talk",
          onClick: onOpenSupport
        },
        supportLabel,
        /* @__PURE__ */ React.createElement("svg", { viewBox: "0 0 16 16", width: "13", height: "13", fill: "none", stroke: "currentColor", strokeWidth: "1.7", strokeLinecap: "round", strokeLinejoin: "round", "aria-hidden": "true" }, /* @__PURE__ */ React.createElement("path", { d: "M3 8h9M8.5 4l4 4-4 4" }))
      )), /* @__PURE__ */ React.createElement(
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
      /* @__PURE__ */ React.createElement("div", { className: "omniguide-split-panel" }, askView && /* @__PURE__ */ React.createElement(
        SheetTurns,
        {
          questions: qaPairs.map((pair) => {
            var _a2;
            return ((_a2 = pair.userMessage) == null ? void 0 : _a2.content) ?? "";
          }),
          current: currentMessageIndex,
          onPick: handleMessageIndexChange
        }
      ), /* @__PURE__ */ React.createElement(
        SearchChatPanel$1,
        {
          onJumpChange: setTypeaheadJump,
          messages: isCompactMode ? NO_MESSAGES : messages,
          onSendMessage: handleSendMessage,
          isLoading,
          isMobile: false,
          isOpen,
          pipelineStatus,
          onIntentAnswer,
          onCustomIntentAnswer: handleSendMessage,
          onAskAssistant: askAssistant,
          onClarificationAnswer,
          onCustomClarificationAnswer: handleSendMessage,
          onResetChat,
          currentMessageIndex,
          onMessageIndexChange: handleMessageIndexChange,
          isCompactMode,
          hideInput: isCompactMode,
          liveQuery,
          typeahead: typeahead && !askView,
          askPlaceholder: askView ? messages.length > 0 ? "Ask a follow-up" : "Ask anything" : void 0,
          onSeeAllResults,
          assistantLabel,
          aiSearchStoreUrl,
          emptyStateFooter,
          sheet: sheetActive,
          popularTerms,
          currency,
          onFillQuery: fillQuery,
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
          onScrollStarted,
          onInlineProductLinkClick
        }
      ), !isCompactMode && (!askView || sources.length > 0) && /* @__PURE__ */ React.createElement(
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
          zeroPriceDisplay,
          intent,
          relatedContentFirstForQuestions,
          titles: askView ? ASK_TITLES : void 0
        }
      )),
      !inline && !isCompactMode && /* @__PURE__ */ React.createElement("div", { className: "omniguide-modal__foot" }, /* @__PURE__ */ React.createElement("span", { className: "omniguide-modal__foot-note" }, "Verify details on the linked product pages."), askView && /* @__PURE__ */ React.createElement(SearchPrivacySettings, { ...privacySettingsProps, isMobile: false, onResetChat }))
    );
    if (inline) {
      const target = typeof inlineTarget === "string" ? document.querySelector(inlineTarget) : inlineTarget ?? null;
      return target ? createPortal(modalBody, target) : null;
    }
    return /* @__PURE__ */ React.createElement(React.Fragment, null, !anchoredActive && /* @__PURE__ */ React.createElement("div", { className: sheetClosing ? "omniguide-modal__backdrop omniguide-modal__backdrop--closing" : "omniguide-modal__backdrop", onClick: onClose }), modalBody);
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
          zeroPriceDisplay,
          relatedContentFirstForQuestions
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
          onJumpChange: setTypeaheadJump,
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
          onScrollStarted,
          onInlineProductLinkClick,
          aiSearchStoreUrl,
          hideMobileAskBox,
          mobileAskPlaceholder
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
        supportHref,
        supportLabel,
        consentEnabled,
        onToggleConsent,
        consentDisabled
      }
    ))
  );
};
const SHEET_EXIT_MS = 200;
function useExitAnimation(enabled, isOpen, close) {
  const [closing, setClosing] = useState(false);
  const closeRef = useRef(close);
  closeRef.current = close;
  useEffect(() => {
    if (!closing) return;
    const timer = setTimeout(() => closeRef.current(), SHEET_EXIT_MS);
    return () => clearTimeout(timer);
  }, [closing]);
  useEffect(() => {
    if (!isOpen) setClosing(false);
  }, [isOpen]);
  const requestClose = useCallback(() => {
    var _a, _b;
    const reduced = (_b = (_a = window.matchMedia) == null ? void 0 : _a.call(window, "(prefers-reduced-motion: reduce)")) == null ? void 0 : _b.matches;
    if (enabled && !reduced) setClosing(true);
    else closeRef.current();
  }, [enabled]);
  return [requestClose, closing];
}
const NO_MESSAGES = [];
const ASK_TITLES = { products: "Recommended", categories: "Shop by category", content: "Guides and documentation" };
const SparkleIcon$1 = ({ size }) => /* @__PURE__ */ React.createElement("svg", { width: size, height: size, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "1.75", strokeLinecap: "round", strokeLinejoin: "round" }, /* @__PURE__ */ React.createElement("path", { d: "M9.937 15.5A2 2 0 0 0 8.5 14.063l-6.135-1.582a.5.5 0 0 1 0-.962L8.5 9.936A2 2 0 0 0 9.937 8.5l1.582-6.135a.5.5 0 0 1 .963 0L14.063 8.5A2 2 0 0 0 15.5 9.937l6.135 1.581a.5.5 0 0 1 0 .964L15.5 14.063a2 2 0 0 0-1.437 1.437l-1.582 6.135a.5.5 0 0 1-.963 0z" }), /* @__PURE__ */ React.createElement("path", { d: "M20 3v4M22 5h-4" }));
const SheetCloseButton = ({ onClose }) => /* @__PURE__ */ React.createElement("button", { type: "button", className: "omniguide-sheet__close", onClick: onClose, "aria-label": "Close search" }, /* @__PURE__ */ React.createElement("svg", { width: "20", height: "20", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", "aria-hidden": "true" }, /* @__PURE__ */ React.createElement("path", { d: "M18 6 6 18M6 6l12 12" })));
const SheetTurns = ({ questions, current, onPick }) => /* @__PURE__ */ React.createElement("nav", { className: "omniguide-sheet__turns", "aria-label": "This conversation" }, questions.some(Boolean) && /* @__PURE__ */ React.createElement("h4", { className: "omniguide-sheet__eyebrow" }, "This conversation"), questions.map((question, index) => question && // eslint-disable-next-line react/no-array-index-key -- turns are positional; a question can repeat
/* @__PURE__ */ React.createElement("button", { key: index, type: "button", className: "omniguide-sheet__turn", "aria-current": index === current || void 0, onClick: () => onPick(index) }, question)));
const log$8 = createScopedLogger("Carousel:fetch");
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
  const fetcher = config.fetchImpl ?? fetch;
  log$8.debug("GET", { slot: params.slot, websiteCode: config.websiteCode, url, hasSessionId: !!sessionId, headerKeys: Object.keys(headers) });
  const t0 = typeof performance !== "undefined" ? performance.now() : Date.now();
  const response = await fetcher(url, {
    ...init,
    method: "GET",
    headers
  });
  const elapsedMs = Math.round((typeof performance !== "undefined" ? performance.now() : Date.now()) - t0);
  log$8.debug("response", { slot: params.slot, status: response.status, elapsedMs });
  if (response.status === 204) {
    log$8.debug("204 — slot configured but empty", { slot: params.slot });
    return CAROUSEL_EMPTY;
  }
  if (response.status === 404) {
    log$8.warn("404 — slot not registered", { slot: params.slot, websiteCode: config.websiteCode });
    throw new CarouselSlotNotFoundError(params.slot, config.websiteCode);
  }
  if (!response.ok) {
    log$8.error("non-2xx", { slot: params.slot, status: response.status, statusText: response.statusText });
    throw new Error(`Carousel request failed: ${response.status} ${response.statusText}`);
  }
  let json;
  try {
    json = await response.json();
  } catch (err) {
    const detail = err instanceof Error ? err.message : String(err);
    log$8.error("JSON parse failed", { slot: params.slot, detail });
    throw new Error(`Carousel response was not valid JSON: ${detail}`);
  }
  const parsed = CarouselResponseSchema.safeParse(json);
  if (!parsed.success) {
    log$8.error("schema validation failed", { slot: params.slot, zodError: parsed.error.message, body: json });
    throw new Error("Carousel response failed schema validation");
  }
  log$8.debug("parsed", {
    slot: params.slot,
    carousel_id: parsed.data.carousel_id,
    slotsCount: parsed.data.slots.length,
    anchor: parsed.data.anchor,
    status: parsed.data.status,
    reason: parsed.data.reason
  });
  return parsed.data;
}
const log$7 = createScopedLogger("Carousel:events:transport");
function buildCarouselEventEndpoint(apiBaseUrl) {
  const endpoint = `${apiBaseUrl.replace(/\/+$/, "")}/api/v1/carousels/events`;
  log$7.debug("endpoint resolved →", endpoint);
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
      log$7.error("batch failed schema validation — sending anyway", { zodError: parsed.error.message, batch });
    }
    const body = JSON.stringify(batch);
    log$7.debug("serialize → POST batch", {
      websiteCode,
      eventCount: batch.events.length,
      eventNames: batch.events.map((e) => e.event_name),
      bytes: body.length,
      bodyPreview: body.slice(0, 600) + (body.length > 600 ? "…[truncated]" : "")
    });
    return body;
  };
}
const log$6 = createScopedLogger("Carousel:useCarousel");
function useCarousel(options) {
  const { slot, url, forcedSkus, enabled = true, ...config } = options;
  const [data, setData] = useState(null);
  const [status, setStatus] = useState("idle");
  const [error, setError] = useState(null);
  const configRef = useRef(config);
  configRef.current = config;
  useEffect(() => {
    if (!enabled) {
      log$6.debug("disabled — skipping fetch", { slot });
      setStatus("idle");
      return void 0;
    }
    const resolvedUrl = url ?? (typeof window !== "undefined" ? sanitizeUrl(window.location.href) : "");
    if (!resolvedUrl) {
      log$6.error("missing url and no window.location available", { slot });
      setStatus("error");
      setError(new Error("useCarousel: missing url and no window.location available"));
      return void 0;
    }
    const controller = new AbortController();
    let cancelled = false;
    log$6.debug("fetch start", { slot, url: resolvedUrl, forcedSkus });
    setStatus("loading");
    setError(null);
    fetchCarousel(configRef.current, { slot, url: resolvedUrl, forcedSkus }, { signal: controller.signal }).then((result) => {
      if (cancelled) {
        log$6.debug("result discarded — effect cancelled", { slot });
        return;
      }
      if (result === CAROUSEL_EMPTY) {
        log$6.debug("→ empty (204)", { slot });
        setData(null);
        setStatus("empty");
        return;
      }
      if (result.slots.length === 0) {
        log$6.debug("→ empty (zero slots)", { slot, status: result.status, reason: result.reason });
        setData(result);
        setStatus("empty");
        return;
      }
      log$6.debug("→ success", { slot, slotsCount: result.slots.length, carousel_id: result.carousel_id });
      setData(result);
      setStatus("success");
    }).catch((err) => {
      if (cancelled)
        return;
      if (err instanceof DOMException && err.name === "AbortError") {
        log$6.debug("aborted", { slot });
        return;
      }
      if (err instanceof CarouselSlotNotFoundError) {
        log$6.warn("→ empty (404 slot not registered)", { slot });
        setData(null);
        setStatus("empty");
        setError(err);
        return;
      }
      log$6.error("→ error", { slot, err: err instanceof Error ? err.message : String(err) });
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
const log$5 = createScopedLogger("Carousel:events");
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
    log$5.debug("queue created", { carouselId, slotCode, endpoint, websiteCode });
    return createQueue({
      endpoint,
      serialize: makeCarouselEventSerializer(websiteCode),
      isConsentGranted: () => consentRef.current(),
      flushOnPageHide: true,
      onFlush: ({ count, transport }) => {
        log$5.debug("FLUSH ▶ " + transport.toUpperCase() + " → " + endpoint, {
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
          log$5.warn("emit skipped — no session id (further occurrences suppressed)", {
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
      log$5.debug("ENQUEUE " + eventName + " (queue size after =" + (queue.size() + 1) + ")", {
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
const log$4 = createScopedLogger("Carousel:visibility");
function useCarouselVisibility(ref, options) {
  const callbackRef = useRef(options.onFirstVisible);
  callbackRef.current = options.onFirstVisible;
  const threshold = options.threshold ?? 0.5;
  const enabled = options.enabled ?? true;
  const trackerRef = useRef(null);
  useEffect(() => {
    if (!enabled) {
      log$4.debug("not enabled yet — IO attach deferred");
      return void 0;
    }
    const element = ref.current;
    if (!element) {
      log$4.debug("no element on ref — IO not attached");
      return void 0;
    }
    log$4.debug("attach IntersectionObserver", { threshold, target: element.tagName });
    const tracker = createVisibilityTracker({
      threshold,
      onVisible: () => {
        log$4.debug("first visible — firing onFirstVisible callback");
        callbackRef.current();
      }
    });
    trackerRef.current = tracker;
    tracker.attach(element);
    return () => {
      log$4.debug("detach (unmount or threshold change)");
      tracker.detach();
      trackerRef.current = null;
    };
  }, [ref, threshold, enabled]);
}
function SparkleIcon({ size = 14 }) {
  return jsxs("svg", { width: size, height: Math.round(size * (24 / 20)), viewBox: "0 0 20 24", fill: "currentColor", "aria-hidden": "true", focusable: "false", children: [jsx("path", { d: "M9.9053 2.33347C6.87579 2.33351 4.0579 4.2161 2.89846 7.01495C1.73921 9.81387 2.40038 13.1374 4.54251 15.2796C6.68479 17.4215 10.0084 18.0818 12.8072 16.9225C15.6057 15.7629 17.4886 12.9461 17.4886 9.9168H19.822C19.822 13.0057 18.3397 15.9094 15.9551 17.7633C15.4571 18.1505 15.4825 18.9831 16.0087 19.331C17.5342 20.3398 18.7955 21.7162 19.667 23.3335H16.9042C15.3078 21.2085 12.7666 19.8335 9.90416 19.8335C7.0417 19.8335 4.50051 21.2084 2.90416 23.3335H0.141301C1.01161 21.7185 2.2713 20.3442 3.79397 19.3356C4.32198 18.9857 4.34423 18.1467 3.84182 17.761C3.51005 17.5065 3.19253 17.2291 2.89277 16.9293C0.083256 14.1197 -0.777662 9.79259 0.742864 6.12172C2.26348 2.45101 5.93208 0.000177863 9.9053 0.000137573V2.33347Z" }), jsx("path", { d: "M12.593 0.0502678C13.1243 -0.0167857 13.6839 -0.0167262 14.2154 0.0502678C14.3017 4.62302 15.1984 5.51921 19.7707 5.60561C19.8378 6.13712 19.8377 6.69646 19.7707 7.228C15.1986 7.31439 14.3017 8.21126 14.2154 12.7833C13.6838 12.8504 13.1245 12.8504 12.593 12.7833C12.5066 8.21101 11.6104 7.3143 7.03762 7.228C6.97064 6.69651 6.97054 6.13706 7.03762 5.60561C11.6106 5.5193 12.5067 4.62327 12.593 0.0502678Z" })] });
}
const DEFAULT_FALLBACK = "A smart pick for your needs.";
const HEADLINE_MAX = 35;
const BODY_MAX = 80;
function truncate(s, max) {
  if (s.length <= max)
    return s;
  return s.slice(0, max - 1).trimEnd() + "…";
}
function InsightIcon() {
  return jsx("span", { className: "omniguide-carousel-card__narrative-icon", "aria-hidden": "true", children: jsx(SparkleIcon, { size: 16 }) });
}
function NarrativeBlockImpl({ narrative, placement, hideWhenAbsent = false, fallbackBody = DEFAULT_FALLBACK, untruncated = false }) {
  var _a, _b;
  const rawHeadline = ((_a = narrative == null ? void 0 : narrative.headline) == null ? void 0 : _a.trim()) ?? "";
  const rawBody = ((_b = narrative == null ? void 0 : narrative.body) == null ? void 0 : _b.trim()) ?? "";
  const headline = rawHeadline ? untruncated ? rawHeadline : truncate(rawHeadline, HEADLINE_MAX) : "";
  const body = rawBody ? untruncated ? rawBody : truncate(rawBody, BODY_MAX) : "";
  if (placement === "lead") {
    if (!headline)
      return null;
    return jsxs("p", { className: "omniguide-carousel-card__narrative omniguide-carousel-card__narrative--lead", "aria-label": "Expert insight", children: [jsx(InsightIcon, {}), jsx("span", { className: "omniguide-carousel-card__narrative-text", children: headline })] });
  }
  if (placement === "body") {
    if (!body && hideWhenAbsent)
      return null;
    return jsx("p", { className: "omniguide-carousel-card__narrative omniguide-carousel-card__narrative--body", children: body || fallbackBody });
  }
  if (!headline && !body) {
    if (hideWhenAbsent)
      return null;
    return jsx("div", { className: "omniguide-carousel-card__narrative omniguide-carousel-card__narrative--combined", children: jsx("p", { className: "omniguide-carousel-card__narrative-body-text", children: fallbackBody }) });
  }
  return jsxs("div", { className: "omniguide-carousel-card__narrative omniguide-carousel-card__narrative--combined", "aria-label": "Staff insight", children: [headline ? jsx("p", { className: "omniguide-carousel-card__narrative-headline", children: jsx("span", { children: headline }) }) : null, body ? jsx("p", { className: "omniguide-carousel-card__narrative-body-text", children: body }) : null] });
}
const NarrativeBlock = memo(NarrativeBlockImpl);
const SOURCE_LABELS = {
  pinned_rule: {
    text: "Merchant Pick",
    aria: "Merchant pick — curated by the merchant",
    modifier: "curated"
  },
  trending: {
    text: "Trending",
    aria: "Trending — popular right now",
    modifier: "algorithmic"
  },
  fbt: {
    text: "Frequently Together",
    aria: "Frequently bought together",
    modifier: "algorithmic"
  },
  ymal: {
    text: "You May Also Like",
    aria: "You may also like — related recommendation",
    modifier: "algorithmic"
  }
};
function CarouselSourceBadgeImpl({ source }) {
  if (!source)
    return null;
  const entry = SOURCE_LABELS[source];
  if (!entry)
    return null;
  return jsx("span", { className: `omniguide-carousel-card__badge omniguide-carousel-card__badge--${entry.modifier}`, "aria-label": entry.aria, children: entry.text });
}
const CarouselSourceBadge = memo(CarouselSourceBadgeImpl);
const measureCallbacks = /* @__PURE__ */ new Set();
let resizeListenerAttached = false;
function ensureResizeListener() {
  if (resizeListenerAttached)
    return;
  if (typeof window === "undefined")
    return;
  window.addEventListener("resize", () => {
    measureCallbacks.forEach((cb) => cb());
  }, { passive: true });
  resizeListenerAttached = true;
}
function subscribeBodyMeasure(cb) {
  ensureResizeListener();
  measureCallbacks.add(cb);
  return () => {
    measureCallbacks.delete(cb);
  };
}
function SignatureDivider() {
  return jsxs("svg", { className: "omniguide-carousel-card__signature", width: "100", height: "14", viewBox: "0 0 100 14", "aria-hidden": "true", focusable: "false", children: [jsx("path", { d: "M 4 10 Q 50 -2 96 10", fill: "none", stroke: "currentColor", strokeWidth: "1.2", strokeDasharray: "2 4" }), jsx("circle", { cx: "4", cy: "10", r: "2.5", fill: "currentColor" }), jsx("circle", { cx: "96", cy: "10", r: "2.5", fill: "currentColor" })] });
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
  if (!Number.isFinite(value))
    return null;
  const resolved = currency ?? fallbackCurrency ?? null;
  return { value, currency: resolved && resolved.length > 0 ? resolved : null };
}
function CarouselCardImpl({ slot, fallbackImage, onSelect, onAddToCart, position, locale = "en-US", priceFormat, defaultCurrency }) {
  var _a, _b, _c, _d, _e, _f;
  const NarrativeBlock$1 = useComponent("NarrativeBlock", NarrativeBlock);
  const CarouselSourceBadge$1 = useComponent("CarouselSourceBadge", CarouselSourceBadge);
  const product = slot.product;
  const title = ((_a = product.title) == null ? void 0 : _a.trim()) || "Product";
  const url = safeHref(product.url);
  const image = product.image_url ?? fallbackImage ?? "";
  const priceParsed = parsePrice(product.price, defaultCurrency);
  const compareAtParsed = parsePrice(product.compare_at_price, defaultCurrency);
  const showCompareAt = compareAtParsed !== null && priceParsed !== null && !(compareAtParsed.value === priceParsed.value && compareAtParsed.currency === priceParsed.currency);
  const isFromPrice = typeof product.price === "object" && product.price !== null && !Array.isArray(product.price) && product.price.from === true;
  const brand = ((_b = product.brand) == null ? void 0 : _b.trim()) ?? "";
  const narrativeBody = ((_d = (_c = slot.narrative) == null ? void 0 : _c.body) == null ? void 0 : _d.trim()) ?? "";
  const hasNarrative = !!(((_f = (_e = slot.narrative) == null ? void 0 : _e.headline) == null ? void 0 : _f.trim()) || narrativeBody);
  const [expanded, setExpanded] = useState(false);
  const [bodyOverflows, setBodyOverflows] = useState(false);
  const noteRef = useRef(null);
  const noteEyebrowId = useId();
  useEffect(() => {
    if (!hasNarrative) {
      setBodyOverflows(false);
      return void 0;
    }
    const note2 = noteRef.current;
    if (!note2)
      return void 0;
    const body = note2.querySelector(".omniguide-carousel-card__narrative-body-text");
    if (!body) {
      setBodyOverflows(false);
      return void 0;
    }
    const measure = () => {
      const cs = window.getComputedStyle(body);
      const lh = parseFloat(cs.lineHeight);
      const limit = Number.isFinite(lh) && lh > 0 ? lh * 2 + 1 : body.clientHeight + 1;
      setBodyOverflows(body.scrollHeight > limit);
    };
    measure();
    return subscribeBodyMeasure(measure);
  }, [hasNarrative, narrativeBody]);
  const cardClass = "omniguide-carousel-card" + (hasNarrative ? " omniguide-carousel-card--has-narrative" : "");
  const handleLinkClick = (event) => {
    onSelect(slot);
    if (!url)
      event.preventDefault();
  };
  const handleAddClick = (event) => {
    event.preventDefault();
    event.stopPropagation();
    if (onAddToCart)
      onAddToCart(slot);
  };
  const handleToggleExpand = (event) => {
    event.preventDefault();
    event.stopPropagation();
    setExpanded((v) => !v);
  };
  const linkContent = jsxs(Fragment, { children: [jsxs("div", { className: "omniguide-carousel-card__media", children: [image ? jsx("img", { className: "omniguide-carousel-card__image", src: image, alt: title, loading: "lazy", decoding: "async" }) : jsx("div", { className: "omniguide-carousel-card__image-placeholder", "aria-hidden": "true" }), jsx(CarouselSourceBadge$1, { source: slot.source })] }), jsxs("div", { className: "omniguide-carousel-card__body-link", children: [brand ? jsx("p", { className: "omniguide-carousel-card__brand", children: brand }) : null, jsx("h3", { className: "omniguide-carousel-card__title", children: title })] })] });
  const innerTile = jsxs("div", { className: "omniguide-carousel-card__tile", children: [url ? jsx("a", { className: "omniguide-carousel-card__link", href: url, onClick: handleLinkClick, "aria-label": title, children: linkContent }) : jsx("button", { type: "button", className: "omniguide-carousel-card__link", onClick: () => onSelect(slot), "aria-label": title, children: linkContent }), jsxs("div", { className: "omniguide-carousel-card__footer", children: [priceParsed ? jsxs("p", { className: "omniguide-carousel-card__price", children: [isFromPrice ? jsx("span", { className: "omniguide-carousel-card__price-prefix", children: "Starting at" }) : null, jsx(PriceDisplay, { value: priceParsed.value, currency: priceParsed.currency, locale, priceFormat, className: "omniguide-carousel-card__price-current" }), showCompareAt && !isFromPrice ? jsx(PriceDisplay, { value: compareAtParsed.value, currency: compareAtParsed.currency, locale, priceFormat, className: "omniguide-carousel-card__price-compare" }) : null] }) : null, onAddToCart ? jsxs("button", { type: "button", className: "omniguide-carousel-card__cta", onClick: handleAddClick, "aria-label": `Add ${title} to cart`, children: [jsx("span", { children: "Add" }), jsx("span", { "aria-hidden": "true", className: "omniguide-carousel-card__cta-arrow", children: "▸" })] }) : null] })] });
  const noteClass = "omniguide-carousel-card__note" + (expanded ? " omniguide-carousel-card__note--expanded" : "");
  const note = hasNarrative ? jsxs("div", { className: noteClass, ref: noteRef, role: "group", "aria-labelledby": noteEyebrowId, children: [jsx("span", { className: "omniguide-carousel-card__watermark", "aria-hidden": "true", children: jsx(SparkleIcon, { size: 120 }) }), jsxs("p", { id: noteEyebrowId, className: "omniguide-carousel-card__note-eyebrow", children: [jsx("span", { className: "omniguide-carousel-card__note-icon", children: jsx(SparkleIcon, { size: 14 }) }), "Expert take"] }), jsx(NarrativeBlock$1, { narrative: slot.narrative, placement: "combined", hideWhenAbsent: true, untruncated: true }), jsxs("div", { className: "omniguide-carousel-card__note-foot", children: [jsx(SignatureDivider, {}), bodyOverflows ? jsx("button", { type: "button", className: "omniguide-carousel-card__expand", onClick: handleToggleExpand, "aria-expanded": expanded, children: expanded ? "Show less" : "Show more" }) : null] })] }) : null;
  return jsxs("li", { className: cardClass, "data-position": position, "data-source": slot.source ?? "unknown", children: [note, innerTile] });
}
const CarouselCard = memo(CarouselCardImpl);
const INITIAL_SCROLL_STATE = {
  hasOverflow: false,
  atStart: true,
  atEnd: false
};
function CarouselRow({ label, labelId, eyebrow, slots, fallbackImage, locale, onSelect, onAddToCart, priceFormat, defaultCurrency, rootRef, reserveSpace = true, headingLevel = 2 }) {
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
        const cardLink = target.closest(".omniguide-carousel-card__link");
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
  return jsxs("section", { ref: rootRef, className: "omniguide-carousel" + (reservingSpace ? " omniguide-carousel--reserving-space" : ""), "aria-labelledby": labelId, "data-overflow": scrollState.hasOverflow ? "true" : "false", "data-at-start": scrollState.atStart ? "true" : "false", "data-at-end": scrollState.atEnd ? "true" : "false", children: [jsxs("header", { className: "omniguide-carousel__header", children: [jsxs("div", { className: "omniguide-carousel__heading", children: [eyebrow ? jsx("p", { className: "omniguide-carousel__eyebrow", children: eyebrow }) : null, jsx(Heading, { id: labelId, className: "omniguide-carousel__label", children: label })] }), scrollState.hasOverflow ? jsxs("div", { className: "omniguide-carousel__controls", children: [jsx("button", { type: "button", className: "omniguide-carousel__chevron omniguide-carousel__chevron--prev", "aria-label": "Previous products", onClick: () => scrollBy("prev"), disabled: scrollState.atStart, children: jsx("svg", { viewBox: "0 0 16 16", width: "16", height: "16", focusable: "false", children: jsx("path", { d: "M10 13L5 8l5-5", stroke: "currentColor", strokeWidth: "1.5", fill: "none", strokeLinecap: "round", strokeLinejoin: "round" }) }) }), jsx("button", { type: "button", className: "omniguide-carousel__chevron omniguide-carousel__chevron--next", "aria-label": "Next products", onClick: () => scrollBy("next"), disabled: scrollState.atEnd, children: jsx("svg", { viewBox: "0 0 16 16", width: "16", height: "16", focusable: "false", children: jsx("path", { d: "M6 3l5 5-5 5", stroke: "currentColor", strokeWidth: "1.5", fill: "none", strokeLinecap: "round", strokeLinejoin: "round" }) }) })] }) : null] }), jsxs("div", { className: "omniguide-carousel__viewport", "aria-hidden": "false", children: [jsx("ul", { ref: listRef, className: "omniguide-carousel__list", children: slots.map((slot, idx) => jsx(CarouselCard$1, { slot, position: slot.position ?? idx + 1, fallbackImage, locale, onSelect, onAddToCart, priceFormat, defaultCurrency }, `${slot.product.sku}-${slot.position ?? idx}`)) }), jsx("span", { className: "omniguide-carousel__fade omniguide-carousel__fade--left", "aria-hidden": "true" }), jsx("span", { className: "omniguide-carousel__fade omniguide-carousel__fade--right", "aria-hidden": "true" })] })] });
}
function CarouselRowSkeletonImpl({ label, count = 5 }) {
  const cards = Array.from({ length: count }, (_, idx) => idx);
  return jsxs("section", { className: "omniguide-carousel omniguide-carousel--loading omniguide-carousel--reserving-space", "aria-busy": "true", "aria-label": label ?? "Loading recommendations", children: [label ? jsx("header", { className: "omniguide-carousel__header", children: jsx("h2", { className: "omniguide-carousel__label", children: label }) }) : null, jsx("ul", { className: "omniguide-carousel__list", children: cards.map((idx) => jsxs("li", { className: "omniguide-carousel-card omniguide-carousel-card--skeleton", children: [jsx("div", { className: "omniguide-carousel-card__skeleton-narrative" }), jsx("div", { className: "omniguide-carousel-card__skeleton-image" }), jsx("div", { className: "omniguide-carousel-card__skeleton-title" }), jsx("div", { className: "omniguide-carousel-card__skeleton-price" })] }, idx)) })] });
}
const CarouselRowSkeleton = memo(CarouselRowSkeletonImpl);
const log$3 = createScopedLogger("Carousel:container");
function CarouselContainer(props) {
  const {
    slot,
    label,
    eyebrow,
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
    log$3.debug("skipVisibilityGate=true — firing view immediately on data load", { slot });
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
    log$3.debug("render decision", {
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
function buildCanonicalQuery(filters) {
  const entries = [];
  if (filters.cursor)
    entries.push(["cursor", filters.cursor]);
  const fKeys = Object.keys(filters.f).sort();
  for (const attr of fKeys) {
    const ids = filters.f[attr];
    if (!ids || ids.length === 0)
      continue;
    const sorted = [...ids].sort((a, b) => a - b);
    entries.push([`f[${attr}]`, sorted.join(",")]);
  }
  if (filters.flag.length > 0) {
    const sorted = [...filters.flag].sort();
    entries.push(["flag", sorted.join(",")]);
  }
  if (filters.priceMax !== void 0)
    entries.push(["price_max", String(filters.priceMax)]);
  if (filters.priceMin !== void 0)
    entries.push(["price_min", String(filters.priceMin)]);
  if (filters.sort)
    entries.push(["sort", filters.sort]);
  if (filters.uc.length > 0) {
    const sorted = [...filters.uc].sort((a, b) => a - b);
    entries.push(["uc", sorted.join(",")]);
  }
  entries.sort(([a], [b]) => a < b ? -1 : a > b ? 1 : 0);
  if (entries.length === 0)
    return "";
  const params = new URLSearchParams();
  for (const [key, value] of entries) {
    params.append(key, value);
  }
  return `?${params.toString()}`;
}
const ALLOWED_TAGS = ["p", "br", "b", "strong", "i", "em", "u", "ul", "ol", "li", "a", "span", "small", "sub", "sup", "h2", "h3", "h4"];
const ALLOWED_ATTR = ["href", "target", "rel"];
const ENVELOPE_PREFIX = /^\s*Name:[^\n]*\n\s*Description:\s*/;
const CHILD_PRODUCTS_MARKER = /\n?\s*Child Products:/;
function extractDescriptionBody(raw) {
  const startMatch = raw.match(ENVELOPE_PREFIX);
  if (!startMatch || startMatch.index === void 0)
    return raw;
  const afterStart = raw.slice(startMatch.index + startMatch[0].length);
  const endMatch = afterStart.match(CHILD_PRODUCTS_MARKER);
  const body = endMatch && endMatch.index !== void 0 ? afterStart.slice(0, endMatch.index) : afterStart;
  return body.trim();
}
function sanitize(html) {
  if (typeof window === "undefined" || typeof purify.sanitize !== "function") {
    return html.replace(/<[^>]*>/g, "");
  }
  return purify.sanitize(html, { ALLOWED_TAGS, ALLOWED_ATTR });
}
function CategoryHeaderImpl({ category, wizardSlot }) {
  const name = category == null ? void 0 : category.name;
  const description = category == null ? void 0 : category.description;
  const sanitized = useMemo(() => description ? sanitize(extractDescriptionBody(description)) : "", [description]);
  const contentRef = useRef(null);
  const [overflowing, setOverflowing] = useState(null);
  const [expanded, setExpanded] = useState(false);
  useEffect(() => {
    const el = contentRef.current;
    if (!el)
      return;
    const measure = () => {
      const s = el.style;
      const prev = {
        display: s.display,
        webkitBoxOrient: s.getPropertyValue("-webkit-box-orient"),
        webkitLineClamp: s.getPropertyValue("-webkit-line-clamp"),
        overflow: s.overflow
      };
      s.display = "-webkit-box";
      s.setProperty("-webkit-box-orient", "vertical");
      s.setProperty("-webkit-line-clamp", "3");
      s.overflow = "hidden";
      const overflows = el.scrollHeight - el.clientHeight > 1;
      s.display = prev.display;
      s.setProperty("-webkit-box-orient", prev.webkitBoxOrient);
      s.setProperty("-webkit-line-clamp", prev.webkitLineClamp);
      s.overflow = prev.overflow;
      setOverflowing(overflows);
    };
    measure();
    if (typeof ResizeObserver === "undefined")
      return;
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, [sanitized]);
  if (!name && !sanitized && !wizardSlot)
    return null;
  const clamped = overflowing === true && !expanded;
  return jsxs("header", { className: "omniguide-product-list__header", children: [wizardSlot, name ? jsx("h1", { className: "omniguide-product-list__title", children: name }) : null, sanitized ? jsxs("div", { className: "omniguide-product-list__description", "data-expanded": clamped ? "false" : "true", children: [jsx("div", { ref: contentRef, className: "omniguide-product-list__description-content", dangerouslySetInnerHTML: { __html: sanitized } }), overflowing === true ? jsx("button", { type: "button", className: "omniguide-product-list__description-toggle", "aria-expanded": expanded, onClick: () => setExpanded((v) => !v), children: expanded ? "Read less" : "Read more" }) : null] }) : null] });
}
const CategoryHeader = memo(CategoryHeaderImpl);
function ProductImageImpl(props) {
  const { product, fallbackImage, isPriority, alt, overrideImageUrl } = props;
  const primary = overrideImageUrl ?? (product == null ? void 0 : product.image_url) ?? fallbackImage ?? "";
  const declaredAlternate = overrideImageUrl ? null : (product == null ? void 0 : product.alternate_image_url) ?? null;
  const altText = alt ?? (product == null ? void 0 : product.name) ?? "Product";
  const [failedAlternate, setFailedAlternate] = useState(null);
  const alternate = declaredAlternate !== null && declaredAlternate !== failedAlternate ? declaredAlternate : null;
  const loading = isPriority ? "eager" : "lazy";
  const fetchPriority = isPriority ? "high" : "auto";
  const decoding = "async";
  return jsxs("span", { className: "omniguide-product-tile__image-wrap", children: [jsx("img", { className: "omniguide-product-tile__image omniguide-product-tile__image--primary", src: primary, alt: altText, loading, decoding, ...{ fetchpriority: fetchPriority } }), alternate ? jsx("img", { className: "omniguide-product-tile__image omniguide-product-tile__image--alt", src: alternate, alt: "", "aria-hidden": "true", loading: "lazy", decoding, onError: () => {
    setFailedAlternate(alternate);
  } }) : null] });
}
const ProductImage = memo(ProductImageImpl);
ProductImage.displayName = "ProductImage";
const log$2 = createScopedLogger("PriceBlock");
let __omniguidePlpCurrencyFallbackWarned = false;
function warnPlpCurrencyFallbackOnce() {
  if (__omniguidePlpCurrencyFallbackWarned)
    return;
  __omniguidePlpCurrencyFallbackWarned = true;
  log$2.warn("PLP rendering prices without a currency token — no `currency` configured at the integration boundary. Fix preferred: backend team adds `currency` to PLP product schema. Stopgap for single-currency stores: pass `currency` to renderProductList / ProductListContainer.");
}
function toNumber(value) {
  if (typeof value === "number" && Number.isFinite(value))
    return value;
  if (typeof value === "string" && value.trim().length > 0) {
    const n2 = Number.parseFloat(value);
    return Number.isFinite(n2) ? n2 : null;
  }
  return null;
}
function formatMoney(amount, currency, locale) {
  if (!currency) {
    warnPlpCurrencyFallbackOnce();
    try {
      return new Intl.NumberFormat(locale, {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
      }).format(amount);
    } catch {
      return amount.toFixed(2);
    }
  }
  try {
    return new Intl.NumberFormat(locale, { style: "currency", currency }).format(amount);
  } catch {
    return amount.toFixed(2);
  }
}
function PriceBlockImpl(props) {
  const { product, currency, locale = "en-US" } = props;
  const price = toNumber(product == null ? void 0 : product.price);
  const retail = toNumber(product == null ? void 0 : product.retail_price);
  const sale = toNumber(product == null ? void 0 : product.sale_price);
  if (price === null && sale === null)
    return null;
  if (sale !== null && price !== null && sale < price) {
    return jsxs("span", { className: "omniguide-product-tile__price omniguide-product-tile__price--sale", children: [jsx("span", { className: "omniguide-product-tile__price-current", children: formatMoney(sale, currency, locale) }), jsx("span", { className: "omniguide-product-tile__price-was", "aria-label": "Was", children: formatMoney(price, currency, locale) })] });
  }
  if (retail !== null && price !== null && retail > price) {
    return jsxs("span", { className: "omniguide-product-tile__price", children: [jsx("span", { className: "omniguide-product-tile__price-current", children: formatMoney(price, currency, locale) }), jsx("span", { className: "omniguide-product-tile__price-msrp", "aria-label": "MSRP", children: formatMoney(retail, currency, locale) })] });
  }
  if (price !== null) {
    return jsx("span", { className: "omniguide-product-tile__price", children: jsx("span", { className: "omniguide-product-tile__price-current", children: formatMoney(price, currency, locale) }) });
  }
  return null;
}
const PriceBlock = memo(PriceBlockImpl);
PriceBlock.displayName = "PriceBlock";
function FlagBadgesImpl(props) {
  const { flags, max = 4 } = props;
  if (!flags || flags.length === 0)
    return null;
  const visible = flags.slice(0, max);
  const renderable = visible.filter((f) => {
    var _a;
    return (_a = (f == null ? void 0 : f.label) ?? (f == null ? void 0 : f.key)) == null ? void 0 : _a.trim();
  });
  if (renderable.length === 0)
    return null;
  return jsx("ul", { className: "omniguide-product-tile__flags", children: renderable.map((flag, idx) => {
    const text = (flag == null ? void 0 : flag.label) ?? (flag == null ? void 0 : flag.key) ?? "";
    const color = (flag == null ? void 0 : flag.color) ?? void 0;
    const iconUrl = (flag == null ? void 0 : flag.icon_url) ?? void 0;
    const key = (flag == null ? void 0 : flag.key) ?? `flag-${String(idx)}`;
    const style = color ? { backgroundColor: color } : void 0;
    const typeSlug = ((flag == null ? void 0 : flag.key) ?? "").toLowerCase().replace(/[_\s]+/g, "-").replace(/^recommended$/, "top-pick").replace(/^runnerup$/, "runner-up");
    const flagClassName = typeSlug ? `omniguide-product-tile__flag omniguide-product-tile__flag--${typeSlug}` : "omniguide-product-tile__flag";
    return jsxs("li", { className: flagClassName, style, children: [iconUrl ? jsx("img", { className: "omniguide-product-tile__flag-icon", src: iconUrl, alt: "", "aria-hidden": "true", loading: "lazy", decoding: "async" }) : null, jsx("span", { className: "omniguide-product-tile__flag-label", children: text })] }, key);
  }) });
}
const FlagBadges = memo(FlagBadgesImpl);
FlagBadges.displayName = "FlagBadges";
const STAR_PATH_D = "M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z";
function StarIcon({ filled, half }) {
  if (half) {
    return jsxs("svg", { className: "omniguide-pr-star-rating__icon omniguide-pr-star-rating__icon--half", viewBox: "0 0 20 20", "aria-hidden": "true", children: [jsx("path", { className: "omniguide-pr-star-rating__icon-bg", d: STAR_PATH_D }), jsx("path", { className: "omniguide-pr-star-rating__icon-fill-half", d: STAR_PATH_D })] });
  }
  const className = `omniguide-pr-star-rating__icon ${filled ? "omniguide-pr-star-rating__icon--filled" : "omniguide-pr-star-rating__icon--empty"}`;
  return jsx("svg", { className, viewBox: "0 0 20 20", fill: "currentColor", "aria-hidden": "true", children: jsx("path", { d: STAR_PATH_D }) });
}
function ProductTileRatingImpl({ rating, maxStars = 5 }) {
  const value = Number(Math.min(Math.max((rating == null ? void 0 : rating.value) ?? 0, 0), maxStars).toFixed(1));
  if (value <= 0)
    return null;
  const stars = [];
  for (let i = 1; i <= maxStars; i++) {
    if (i <= Math.floor(value)) {
      stars.push(jsx(StarIcon, { filled: true }, i));
    } else if (i === Math.ceil(value) && value % 1 >= 0.75) {
      stars.push(jsx(StarIcon, { filled: true }, i));
    } else if (i === Math.ceil(value) && value % 1 >= 0.25) {
      stars.push(jsx(StarIcon, { half: true }, i));
    } else {
      stars.push(jsx(StarIcon, { filled: false }, i));
    }
  }
  const count = rating == null ? void 0 : rating.count;
  const countLabel = typeof count === "number" && count > 0 ? `${count} ${count === 1 ? "review" : "reviews"}` : null;
  const ariaLabel = `${value} out of ${maxStars} stars${countLabel ? `, ${countLabel}` : ""}`;
  return jsxs("div", { className: "omniguide-pr-star-rating", role: "img", "aria-label": ariaLabel, children: [stars, countLabel ? jsx("span", { className: "omniguide-pr-star-rating__count", children: countLabel }) : null] });
}
const ProductTileRating = memo(ProductTileRatingImpl);
ProductTileRating.displayName = "ProductTileRating";
function VariantSwatchesImpl(props) {
  const { variants, selectedVariantId, onSelect, max = 6 } = props;
  const groupId = useId();
  const btnRefs = useRef([]);
  const [failedUrls, setFailedUrls] = useState(() => /* @__PURE__ */ new Set());
  const markFailed = useCallback((url) => {
    setFailedUrls((prev) => prev.has(url) ? prev : new Set(prev).add(url));
  }, []);
  const seen = /* @__PURE__ */ new Set();
  const renderable = [];
  for (const v of variants ?? []) {
    if (typeof (v == null ? void 0 : v.url) !== "string" || v.url.length === 0)
      continue;
    if (failedUrls.has(v.url))
      continue;
    const dedupeKey = String((v == null ? void 0 : v.variant_id) ?? (v == null ? void 0 : v.sku) ?? v.url);
    if (seen.has(dedupeKey))
      continue;
    seen.add(dedupeKey);
    renderable.push(v);
    if (renderable.length >= max)
      break;
  }
  const handleClick = useCallback((variant) => (event) => {
    event.preventDefault();
    onSelect == null ? void 0 : onSelect(variant);
  }, [onSelect]);
  if (renderable.length === 0)
    return null;
  const selectedIdx = renderable.findIndex((v) => selectedVariantId != null && (v == null ? void 0 : v.variant_id) === selectedVariantId);
  const tabbableIdx = selectedIdx >= 0 ? selectedIdx : 0;
  const focusAndSelect = (i) => {
    var _a;
    const n2 = renderable.length;
    const next = (i % n2 + n2) % n2;
    (_a = btnRefs.current[next]) == null ? void 0 : _a.focus();
    onSelect == null ? void 0 : onSelect(renderable[next]);
  };
  const handleKeyDown = (event, idx) => {
    switch (event.key) {
      case "ArrowRight":
      case "ArrowDown":
        event.preventDefault();
        focusAndSelect(idx + 1);
        break;
      case "ArrowLeft":
      case "ArrowUp":
        event.preventDefault();
        focusAndSelect(idx - 1);
        break;
      case "Home":
        event.preventDefault();
        focusAndSelect(0);
        break;
      case "End":
        event.preventDefault();
        focusAndSelect(renderable.length - 1);
        break;
    }
  };
  return jsx("ul", { className: "omniguide-product-tile__swatches", role: "radiogroup", "aria-label": "Available variants", children: renderable.map((variant, idx) => {
    const id = (variant == null ? void 0 : variant.variant_id) ?? (variant == null ? void 0 : variant.sku) ?? `swatch-${String(idx)}`;
    const isSelected2 = selectedVariantId != null && (variant == null ? void 0 : variant.variant_id) === selectedVariantId;
    const altText = (variant == null ? void 0 : variant.alt_text) ?? (variant == null ? void 0 : variant.variant_display_name) ?? (variant == null ? void 0 : variant.sku) ?? "Variant";
    return jsx("li", { className: "omniguide-product-tile__swatch-item", children: jsxs("button", { type: "button", ref: (el) => {
      btnRefs.current[idx] = el;
    }, className: isSelected2 ? "omniguide-product-tile__swatch omniguide-product-tile__swatch--selected" : "omniguide-product-tile__swatch", role: "radio", "aria-checked": isSelected2, tabIndex: idx === tabbableIdx ? 0 : -1, "aria-labelledby": `${groupId}-${String(id)}-label`, onClick: handleClick(variant), onKeyDown: (e) => handleKeyDown(e, idx), children: [jsx("img", { className: "omniguide-product-tile__swatch-image", src: variant.url ?? "", alt: "", "aria-hidden": "true", loading: "lazy", decoding: "async", onError: () => {
      markFailed(variant.url ?? "");
    } }), jsx("span", { id: `${groupId}-${String(id)}-label`, className: "omniguide-product-tile__swatch-label", children: altText })] }) }, String(id));
  }) });
}
const VariantSwatches = memo(VariantSwatchesImpl);
VariantSwatches.displayName = "VariantSwatches";
function ProductTileImpl(props) {
  var _a;
  const { product, fallbackImage, isPriority, currency, locale, showVariants = true, onVariantClick } = props;
  const [selectedVariant, setSelectedVariant] = useState(null);
  const handleVariantSelect = useCallback((variant) => {
    setSelectedVariant(variant);
    onVariantClick == null ? void 0 : onVariantClick(variant);
  }, [onVariantClick]);
  const name = (product == null ? void 0 : product.name) ?? "Unnamed product";
  const url = safeHref(product == null ? void 0 : product.url);
  const brand = (product == null ? void 0 : product.brand) ?? null;
  const rating = resolveProductRating(product);
  const savePercent = computeSavePercent(product);
  const inner = jsxs(Fragment, { children: [savePercent !== null ? jsxs("span", { className: "omniguide-product-tile__save-badge", children: ["Save ", savePercent, "%"] }) : null, jsx(ProductImage, { product, fallbackImage, isPriority, overrideImageUrl: (selectedVariant == null ? void 0 : selectedVariant.url) ?? null }), jsx(FlagBadges, { flags: product == null ? void 0 : product.flags }), brand ? jsx("p", { className: "omniguide-product-tile__brand", children: brand }) : null, jsx("h3", { className: "omniguide-product-tile__name", children: name }), jsx(PriceBlock, { product, currency, locale }), rating ? jsx(ProductTileRating, { rating }) : null, showVariants && ((_a = product == null ? void 0 : product.variant_images) == null ? void 0 : _a.length) ? jsx(VariantSwatches, { variants: product.variant_images, selectedVariantId: (selectedVariant == null ? void 0 : selectedVariant.variant_id) ?? null, onSelect: handleVariantSelect }) : null] });
  if (url) {
    return jsx("article", { className: "omniguide-product-tile", children: jsx("a", { className: "omniguide-product-tile__link", href: url, children: inner }) });
  }
  return jsx("article", { className: "omniguide-product-tile", children: inner });
}
const ProductTile = memo(ProductTileImpl);
ProductTile.displayName = "ProductTile";
function computeSavePercent(product) {
  const toNum = (v) => {
    if (typeof v === "number" && Number.isFinite(v))
      return v;
    if (typeof v === "string" && v.trim()) {
      const n2 = Number.parseFloat(v);
      return Number.isFinite(n2) ? n2 : null;
    }
    return null;
  };
  const price = toNum(product == null ? void 0 : product.price);
  const retail = toNum(product == null ? void 0 : product.retail_price);
  const sale = toNum(product == null ? void 0 : product.sale_price);
  let was = null;
  let now = null;
  if (sale !== null && price !== null && sale < price) {
    was = price;
    now = sale;
  } else if (retail !== null && price !== null && retail > price) {
    was = retail;
    now = price;
  }
  if (was === null || now === null || was <= 0)
    return null;
  const pct = Math.round((was - now) / was * 100);
  return pct > 0 ? pct : null;
}
function ProductGridImpl({ products, fallbackImage, currency, locale, priorityCount = 6, showVariants = true }) {
  return jsx("ul", { className: "omniguide-product-list__grid", children: products.map((product, index) => {
    const id = (product == null ? void 0 : product.id) ?? index;
    return jsx("li", { className: "omniguide-product-list__grid-item", children: jsx(ProductTile, { product, fallbackImage, isPriority: index < priorityCount, currency, locale, showVariants }) }, String(id));
  }) });
}
const ProductGrid = memo(ProductGridImpl);
const SORT_VALUES = [
  "relevance",
  "price_asc",
  "price_desc",
  "newest",
  "rating"
];
const DEFAULT_LABELS = {
  relevance: "Relevance",
  price_asc: "Price: Low to High",
  price_desc: "Price: High to Low",
  newest: "Newest",
  rating: "Top Rated"
};
function SortSelectImpl({ value, onChange, labels, legend = "Sort by", disabled }) {
  const selectId = useId();
  const handleChange = useCallback((event) => {
    onChange(event.target.value);
  }, [onChange]);
  return jsxs("div", { className: "omniguide-product-list__sort", children: [jsx("label", { className: "omniguide-product-list__sort-label", htmlFor: selectId, children: legend }), jsx("select", { id: selectId, className: "omniguide-product-list__sort-select", value, onChange: handleChange, disabled, children: SORT_VALUES.map((sort) => jsx("option", { value: sort, children: (labels == null ? void 0 : labels[sort]) ?? DEFAULT_LABELS[sort] }, sort)) })] });
}
const SortSelect = memo(SortSelectImpl);
function defaultFormatResultCount(count) {
  if (count === 1)
    return "1 result";
  return `${count.toLocaleString()} results`;
}
function ToolbarImpl({ resultCount, sort, formatResultCount = defaultFormatResultCount }) {
  const filterToggleId = useId();
  return jsxs("div", { className: "omniguide-product-list__toolbar", children: [jsx("input", { type: "checkbox", id: filterToggleId, className: "omniguide-product-list__filter-toggle" }), jsxs("label", { htmlFor: filterToggleId, className: "omniguide-product-list__filter-toggle-label", children: [jsx("span", { children: "Filter Products" }), jsx("svg", { className: "omniguide-product-list__filter-toggle-chevron", width: "14", height: "14", viewBox: "0 0 12 12", fill: "none", stroke: "currentColor", strokeWidth: "1.5", "aria-hidden": "true", children: jsx("path", { d: "M3 4.5L6 7.5L9 4.5" }) })] }), jsx("div", { className: "omniguide-product-list__result-count", children: typeof resultCount === "number" ? formatResultCount(resultCount) : null }), jsx(SortSelect, { ...sort })] });
}
const Toolbar = memo(ToolbarImpl);
function valueKey(value, fallback) {
  const id = value == null ? void 0 : value.value_id;
  if (typeof id === "string" || typeof id === "number")
    return String(id);
  if (typeof (value == null ? void 0 : value.value) === "string" || typeof (value == null ? void 0 : value.value) === "number") {
    return String(value.value);
  }
  return String(fallback);
}
function isSelected(value, selection) {
  if ((value == null ? void 0 : value.selected) === true)
    return true;
  if (selection.kind === "flag") {
    const v = value == null ? void 0 : value.value;
    return typeof v === "string" && selection.values.includes(v);
  }
  const id = value == null ? void 0 : value.value_id;
  if (typeof id !== "number")
    return false;
  return selection.valueIds.includes(id);
}
function groupFacetValues(values, selection) {
  const groups = {
    selected: [],
    available: [],
    unavailable: []
  };
  for (const value of values) {
    if (isSelected(value, selection)) {
      groups.selected.push(value);
      continue;
    }
    if ((value == null ? void 0 : value.count) === 0) {
      groups.unavailable.push(value);
      continue;
    }
    groups.available.push(value);
  }
  return groups;
}
function toggleSelection(value, selection) {
  if (selection.kind === "flag") {
    const v = value == null ? void 0 : value.value;
    if (typeof v !== "string")
      return selection;
    const exists2 = selection.values.includes(v);
    return {
      kind: "flag",
      values: exists2 ? selection.values.filter((entry) => entry !== v) : [...selection.values, v]
    };
  }
  const id = value == null ? void 0 : value.value_id;
  if (typeof id !== "number")
    return selection;
  const exists = selection.valueIds.includes(id);
  const nextIds = exists ? selection.valueIds.filter((entry) => entry !== id) : [...selection.valueIds, id];
  if (selection.kind === "attribute") {
    return { kind: "attribute", key: selection.key, valueIds: nextIds };
  }
  return { kind: "use_case", valueIds: nextIds };
}
function MultiSelectFacetImpl({ facet, selected, onChange, inlineLimit = 10, disabled }) {
  const values = (facet == null ? void 0 : facet.values) ?? [];
  const grouped = useMemo(() => groupFacetValues(values, selected), [values, selected]);
  const inlineRows = useMemo(() => [...grouped.selected, ...grouped.available].slice(0, Math.max(inlineLimit, grouped.selected.length)), [grouped, inlineLimit]);
  const inlineAvailableShown = Math.max(0, inlineRows.length - grouped.selected.length);
  const overflowCount = grouped.available.length - inlineAvailableShown;
  const [unavailableOpen, setUnavailableOpen] = useState(false);
  const unavailableId = useId();
  const bodyId = useId();
  const userToggledRef = useRef(false);
  const [facetOpen, setFacetOpen] = useState(false);
  useEffect(() => {
    if (typeof window === "undefined" || typeof window.matchMedia !== "function") {
      return;
    }
    const mql = window.matchMedia("(max-width: 720px)");
    const apply = (matches) => {
      if (userToggledRef.current)
        return;
      if (matches)
        setFacetOpen(false);
    };
    apply(mql.matches);
    const handler = (e) => apply(e.matches);
    mql.addEventListener("change", handler);
    return () => mql.removeEventListener("change", handler);
  }, []);
  const handleToggleFacet = () => {
    userToggledRef.current = true;
    setFacetOpen((prev) => !prev);
  };
  const selectedCount = grouped.selected.length;
  if (grouped.selected.length === 0 && grouped.available.length === 0 && grouped.unavailable.length === 0) {
    return null;
  }
  const renderRow = (value, index) => {
    const id = valueKey(value, index);
    const checked = isSelected(value, selected);
    const rawValue = value == null ? void 0 : value.value;
    const fallbackLabel = typeof rawValue === "string" || typeof rawValue === "number" ? String(rawValue) : "";
    const label = (value == null ? void 0 : value.label) ?? fallbackLabel;
    const count = typeof (value == null ? void 0 : value.count) === "number" ? value.count : null;
    const rowZeroDisabled = count === 0 && !checked;
    const inputDisabled = rowZeroDisabled || disabled === true;
    const rowClassName = rowZeroDisabled ? "omniguide-product-list__facet-row omniguide-product-list__facet-row--disabled" : "omniguide-product-list__facet-row";
    return jsx("li", { className: "omniguide-product-list__facet-item", children: jsxs("label", { className: rowClassName, "aria-disabled": rowZeroDisabled || void 0, children: [jsx("input", { type: "checkbox", className: "omniguide-product-list__facet-checkbox", checked, disabled: inputDisabled, onChange: () => onChange(toggleSelection(value, selected)) }), jsx("span", { className: "omniguide-product-list__facet-label-text", children: label }), count !== null ? jsx("span", { className: "omniguide-product-list__facet-count", children: count }) : null] }) }, id);
  };
  const rawTitle = facet.label ?? facet.key;
  const title = rawTitle.charAt(0).toUpperCase() + rawTitle.slice(1);
  const fieldsetClassName = facetOpen ? "omniguide-product-list__facet omniguide-product-list__facet--multiselect" : "omniguide-product-list__facet omniguide-product-list__facet--multiselect omniguide-product-list__facet--collapsed";
  return (
    // We intentionally do NOT pass `disabled` to the <fieldset> — per spec
    // a disabled fieldset disables ALL descendant form controls, including
    // our title disclosure button, and there is no per-button override.
    // That would lock the user out of expanding a collapsed-by-default
    // mobile facet during a refetch. Instead we forward `disabled` only
    // to the row inputs and the unavailable-disclosure button, which is
    // the actual interaction we want to freeze.
    jsxs("fieldset", { className: fieldsetClassName, "aria-busy": disabled || void 0, children: [jsx("legend", { className: "omniguide-product-list__facet-legend omniguide-product-list__facet-legend--sr-only", children: title }), jsxs("button", { type: "button", className: "omniguide-product-list__facet-title", "aria-expanded": facetOpen, "aria-controls": bodyId, onClick: handleToggleFacet, children: [jsx("span", { className: "omniguide-product-list__facet-title-text", children: title }), selectedCount > 0 ? jsx("span", { className: "omniguide-product-list__facet-active-count", "aria-label": `${selectedCount} selected`, children: selectedCount }) : null, jsx("span", { className: "omniguide-product-list__facet-chevron", "aria-hidden": "true" })] }), jsx("div", { id: bodyId, className: "omniguide-product-list__facet-body", "aria-hidden": !facetOpen, children: jsxs("div", { className: "omniguide-product-list__facet-body-inner", children: [grouped.selected.length > 0 ? jsx("div", { className: "omniguide-product-list__facet-section-label", "aria-hidden": "true", children: "Selected" }) : null, jsx("ul", { className: "omniguide-product-list__facet-list", children: inlineRows.map((value, index) => renderRow(value, index)) }), overflowCount > 0 ? jsxs("p", { className: "omniguide-product-list__facet-more", children: ["+ ", overflowCount, " more"] }) : null, grouped.unavailable.length > 0 ? jsxs(Fragment, { children: [jsx("div", { role: "separator", className: "omniguide-product-list__facet-divider", "aria-hidden": "true" }), jsxs("button", { type: "button", className: "omniguide-product-list__facet-unavailable-toggle", "aria-expanded": unavailableOpen, "aria-controls": unavailableId, disabled, onClick: () => setUnavailableOpen((prev) => !prev), children: [unavailableOpen ? "Hide" : "Show", " unavailable options (", grouped.unavailable.length, ")"] }), unavailableOpen ? jsxs(Fragment, { children: [jsx("div", { className: "omniguide-product-list__facet-section-label", "aria-hidden": "true", children: "Unavailable with current filters" }), jsx("ul", { id: unavailableId, className: "omniguide-product-list__facet-list omniguide-product-list__facet-unavailable-list", children: grouped.unavailable.map((value, index) => renderRow(value, index)) })] }) : null] }) : null] }) })] })
  );
}
const MultiSelectFacet = memo(MultiSelectFacetImpl);
function toInput(value) {
  return typeof value === "number" && Number.isFinite(value) ? String(value) : "";
}
function parseInput(raw) {
  const trimmed = raw.trim();
  if (trimmed === "")
    return void 0;
  const parsed = Number(trimmed);
  return Number.isFinite(parsed) ? parsed : void 0;
}
function PriceRangeFacetImpl({ facet, value, onChange, currencySymbol = "$", disabled, invertedMessage = "Min must be less than or equal to Max." }) {
  const [minDraft, setMinDraft] = useState(() => toInput(value == null ? void 0 : value.min));
  const [maxDraft, setMaxDraft] = useState(() => toInput(value == null ? void 0 : value.max));
  const [invalid, setInvalid] = useState(false);
  useEffect(() => {
    setMinDraft(toInput(value == null ? void 0 : value.min));
  }, [value == null ? void 0 : value.min]);
  useEffect(() => {
    setMaxDraft(toInput(value == null ? void 0 : value.max));
  }, [value == null ? void 0 : value.max]);
  const apply = useCallback(() => {
    const next = {
      min: parseInput(minDraft),
      max: parseInput(maxDraft)
    };
    if (typeof next.min === "number" && typeof next.max === "number" && next.min > next.max) {
      setInvalid(true);
      return;
    }
    setInvalid(false);
    if (next.min !== (value == null ? void 0 : value.min) || next.max !== (value == null ? void 0 : value.max)) {
      onChange(next);
    }
  }, [minDraft, maxDraft, onChange, value == null ? void 0 : value.min, value == null ? void 0 : value.max]);
  const onMinChange = useCallback((next) => {
    setMinDraft(next);
    if (invalid)
      setInvalid(false);
  }, [invalid]);
  const onMaxChange = useCallback((next) => {
    setMaxDraft(next);
    if (invalid)
      setInvalid(false);
  }, [invalid]);
  const errorId = invalid ? "omniguide-price-range-error" : void 0;
  return jsxs("fieldset", { className: "omniguide-product-list__facet omniguide-product-list__facet--price", disabled, children: [jsx("legend", { className: "omniguide-product-list__facet-legend omniguide-product-list__facet-legend--sr-only", children: facet.label ?? "Price" }), jsx("div", { className: "omniguide-product-list__facet-title", "aria-hidden": "true", children: facet.label ?? "Price" }), jsxs("div", { className: "omniguide-product-list__price-inputs", children: [jsxs("label", { className: "omniguide-product-list__price-field", children: [jsxs("span", { className: "omniguide-product-list__price-label", children: ["Min (", currencySymbol, ")"] }), jsx("input", { type: "number", inputMode: "decimal", min: 0, value: minDraft, onChange: (event) => onMinChange(event.target.value), onBlur: apply, "aria-invalid": invalid || void 0, "aria-describedby": errorId, className: "omniguide-product-list__price-input" })] }), jsxs("label", { className: "omniguide-product-list__price-field", children: [jsxs("span", { className: "omniguide-product-list__price-label", children: ["Max (", currencySymbol, ")"] }), jsx("input", { type: "number", inputMode: "decimal", min: 0, value: maxDraft, onChange: (event) => onMaxChange(event.target.value), onBlur: apply, "aria-invalid": invalid || void 0, "aria-describedby": errorId, className: "omniguide-product-list__price-input" })] })] }), invalid ? jsx("p", { id: errorId, className: "omniguide-product-list__price-error", role: "alert", children: invertedMessage }) : null, jsx("button", { type: "button", className: "omniguide-product-list__price-apply", onClick: apply, disabled, "aria-label": "Apply price filter", children: "Apply" })] });
}
const PriceRangeFacet = memo(PriceRangeFacetImpl);
function applyMultiSelect(filters, next) {
  if (next.kind === "attribute") {
    const f = { ...filters.f };
    if (next.valueIds.length === 0) {
      delete f[next.key];
    } else {
      f[next.key] = next.valueIds;
    }
    return { ...filters, f };
  }
  if (next.kind === "use_case") {
    return { ...filters, uc: next.valueIds };
  }
  return { ...filters, flag: next.values };
}
function selectionFor(facet, filters) {
  var _a;
  if (facet.type === "use_case") {
    return { kind: "use_case", valueIds: filters.uc ?? [] };
  }
  if (facet.type === "flag") {
    return { kind: "flag", values: filters.flag ?? [] };
  }
  return {
    kind: "attribute",
    key: facet.key,
    valueIds: ((_a = filters.f) == null ? void 0 : _a[facet.key]) ?? []
  };
}
function FacetSidebarImpl({ facets, filters, onChange, disabled, inlineLimit }) {
  if (!facets || facets.length === 0)
    return null;
  return jsx("div", { className: "omniguide-product-list__facets", "aria-label": "Filters", children: facets.map((facet) => {
    const key = `${facet.type}:${facet.key}`;
    switch (facet.type) {
      case "price":
      case "price_range":
        return jsx(PriceRangeFacet, { facet, value: { min: filters.priceMin, max: filters.priceMax }, onChange: (next) => onChange({
          ...filters,
          priceMin: next.min,
          priceMax: next.max
        }), disabled }, key);
      case "attribute":
      case "use_case":
      case "flag":
        return jsx(MultiSelectFacet, { facet, selected: selectionFor(facet, filters), onChange: (next) => onChange(applyMultiSelect(filters, next)), inlineLimit, disabled }, key);
      default:
        return null;
    }
  }) });
}
const FacetSidebar = memo(FacetSidebarImpl);
function LoadMoreImpl({ cursor, onLoadMore, loading, label = "Load more", loadingLabel = "Loading…" }) {
  const handleClick = useCallback(() => {
    if (cursor)
      onLoadMore(cursor);
  }, [cursor, onLoadMore]);
  if (!cursor)
    return null;
  return jsx("div", { className: "omniguide-product-list__load-more", children: jsx("button", { type: "button", className: "omniguide-product-list__load-more-button", onClick: handleClick, disabled: loading, "aria-busy": loading || void 0, children: loading ? loadingLabel : label }) });
}
const LoadMore = memo(LoadMoreImpl);
function PaginationImpl({ page, totalPages, hasPrev, hasNext, onPrev, onNext, loading }) {
  const scrollListToTop = useCallback((trigger) => {
    const list = trigger.closest(".omniguide-product-list");
    if (list && typeof list.scrollIntoView === "function") {
      const reduceMotion = typeof window !== "undefined" && typeof window.matchMedia === "function" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      list.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth", block: "start" });
    }
  }, []);
  const handlePrev = useCallback((e) => {
    scrollListToTop(e.currentTarget);
    onPrev();
  }, [scrollListToTop, onPrev]);
  const handleNext = useCallback((e) => {
    scrollListToTop(e.currentTarget);
    onNext();
  }, [scrollListToTop, onNext]);
  if (!hasPrev && !hasNext)
    return null;
  const label = totalPages && totalPages > 0 ? `Page ${String(page)} of ${String(totalPages)}` : `Page ${String(page)}`;
  return jsxs("nav", { className: "omniguide-product-list__pagination", "aria-label": "Pagination", children: [hasPrev ? jsxs("button", { type: "button", className: "omniguide-product-list__pagination-button omniguide-product-list__pagination-button--prev", onClick: handlePrev, disabled: loading, "aria-busy": loading || void 0, children: [jsx("span", { "aria-hidden": "true", children: "‹" }), " Previous"] }) : null, jsx("span", { className: "omniguide-product-list__pagination-status", "aria-live": "polite", children: label }), jsxs("button", { type: "button", className: "omniguide-product-list__pagination-button omniguide-product-list__pagination-button--next", onClick: handleNext, disabled: !hasNext || loading, "aria-busy": loading || void 0, children: ["Next ", jsx("span", { "aria-hidden": "true", children: "›" })] })] });
}
const Pagination = memo(PaginationImpl);
Pagination.displayName = "Pagination";
function RedirectDrilldownImpl({ items, onChildClick, facetTitle }) {
  if (!items || items.length === 0)
    return null;
  if (facetTitle) {
    return jsx(DrilldownFacet, { items, onChildClick, title: facetTitle });
  }
  return jsx("nav", { className: "omniguide-product-list__drilldown", "aria-label": "Subcategories", children: jsx("ul", { className: "omniguide-product-list__drilldown-list", children: items.map((child, index) => {
    const id = (child == null ? void 0 : child.id) ?? index;
    const url = safeHref(typeof (child == null ? void 0 : child.url) === "string" ? child.url : void 0);
    const name = (child == null ? void 0 : child.name) ?? `Category ${String(id)}`;
    const productCount = typeof (child == null ? void 0 : child.product_count) === "number" ? child.product_count : null;
    const handleClick = onChildClick ? (event) => {
      event.preventDefault();
      onChildClick(child);
    } : void 0;
    return jsx("li", { className: "omniguide-product-list__drilldown-item", children: url ? jsxs("a", { className: "omniguide-product-list__drilldown-link", href: url, onClick: handleClick, children: [jsx("span", { className: "omniguide-product-list__drilldown-name", children: name }), productCount !== null ? jsxs("span", { className: "omniguide-product-list__drilldown-count", children: ["(", productCount, ")"] }) : null] }) : jsx("span", { className: "omniguide-product-list__drilldown-name", children: name }) }, String(id));
  }) }) });
}
function DrilldownFacet({ items, onChildClick, title }) {
  const [open, setOpen] = useState(true);
  const bodyId = useId();
  const className = open ? "omniguide-product-list__facet omniguide-product-list__facet--drilldown" : "omniguide-product-list__facet omniguide-product-list__facet--drilldown omniguide-product-list__facet--collapsed";
  return jsxs("nav", { className, "aria-label": title, children: [jsxs("button", { type: "button", className: "omniguide-product-list__facet-title", "aria-expanded": open, "aria-controls": bodyId, onClick: () => setOpen((prev) => !prev), children: [jsx("span", { className: "omniguide-product-list__facet-title-text", children: title }), jsx("span", { className: "omniguide-product-list__facet-chevron", "aria-hidden": "true" })] }), jsx("div", { id: bodyId, className: "omniguide-product-list__facet-body", "aria-hidden": !open, children: jsx("div", { className: "omniguide-product-list__facet-body-inner", children: jsx("ul", { className: "omniguide-product-list__facet-list", children: items.map((child, index) => jsx(DrilldownFacetRow, { child, onChildClick }, String((child == null ? void 0 : child.id) ?? index))) }) }) })] });
}
function DrilldownFacetRow({ child, onChildClick }) {
  const url = safeHref(typeof (child == null ? void 0 : child.url) === "string" ? child.url : void 0);
  const content = jsxs(Fragment, { children: [jsx("span", { className: "omniguide-product-list__facet-label-text", children: (child == null ? void 0 : child.name) ?? "" }), typeof (child == null ? void 0 : child.product_count) === "number" ? jsx("span", { className: "omniguide-product-list__facet-count", children: child.product_count }) : null] });
  const handleClick = onChildClick ? (event) => {
    event.preventDefault();
    onChildClick(child);
  } : void 0;
  return jsx("li", { className: "omniguide-product-list__facet-item", children: url ? jsx("a", { className: "omniguide-product-list__facet-row omniguide-product-list__facet-row--link", href: url, onClick: handleClick, children: content }) : jsx("span", { className: "omniguide-product-list__facet-row", children: content }) });
}
const RedirectDrilldown = memo(RedirectDrilldownImpl);
function ProductListError(props) {
  const { onRetry, retryDisabled } = props;
  return jsxs("div", { className: "omniguide-product-list__error", role: "alert", children: [jsx("p", { className: "omniguide-product-list__error-text", children: "An error occurred while trying to perform this action." }), onRetry ? jsx("button", { type: "button", className: "omniguide-product-list__error-action", onClick: onRetry, disabled: retryDisabled, children: "Try again" }) : null] });
}
const EMPTY_CLEARED = { f: {}, uc: [], flag: [] };
function buildChips(filters, facets, onChange) {
  const chips = [];
  for (const [attrKey, valueIds] of Object.entries(filters.f ?? {})) {
    const facet = facets.find((f) => f.key === attrKey);
    const facetLabel = (facet == null ? void 0 : facet.label) ?? attrKey;
    for (const valueId of valueIds) {
      const value = facet == null ? void 0 : facet.values.find((v) => v.value_id === valueId);
      const valueLabel = (value == null ? void 0 : value.label) ?? String(valueId);
      chips.push({
        id: `f:${attrKey}:${valueId}`,
        label: `${facetLabel}: ${valueLabel}`,
        onRemove: () => {
          const nextValues = (filters.f[attrKey] ?? []).filter((v) => v !== valueId);
          const nextF = { ...filters.f };
          if (nextValues.length === 0)
            delete nextF[attrKey];
          else
            nextF[attrKey] = nextValues;
          onChange({ ...filters, f: nextF, cursor: void 0 });
        }
      });
    }
  }
  const ucFacet = facets.find((f) => f.type === "use_case");
  for (const ucId of filters.uc ?? []) {
    const value = ucFacet == null ? void 0 : ucFacet.values.find((v) => v.value_id === ucId);
    const label = (value == null ? void 0 : value.label) ?? String(ucId);
    chips.push({
      id: `uc:${ucId}`,
      label,
      onRemove: () => onChange({
        ...filters,
        uc: (filters.uc ?? []).filter((u) => u !== ucId),
        cursor: void 0
      })
    });
  }
  const flagFacet = facets.find((f) => f.type === "flag");
  for (const flagKey of filters.flag ?? []) {
    const value = flagFacet == null ? void 0 : flagFacet.values.find((v) => v.value === flagKey);
    const label = (value == null ? void 0 : value.label) ?? flagKey;
    chips.push({
      id: `flag:${flagKey}`,
      label,
      onRemove: () => onChange({
        ...filters,
        flag: (filters.flag ?? []).filter((f) => f !== flagKey),
        cursor: void 0
      })
    });
  }
  if (filters.priceMin !== void 0 || filters.priceMax !== void 0) {
    const min = filters.priceMin !== void 0 ? `$${filters.priceMin}` : "";
    const max = filters.priceMax !== void 0 ? `$${filters.priceMax}` : "";
    const label = min && max ? `${min} – ${max}` : min ? `${min}+` : `up to ${max}`;
    chips.push({
      id: "price",
      label: `Price: ${label}`,
      onRemove: () => onChange({
        ...filters,
        priceMin: void 0,
        priceMax: void 0,
        cursor: void 0
      })
    });
  }
  return chips;
}
function ActiveFiltersImpl({ filters, facets, onChange, disabled }) {
  const chips = buildChips(filters, facets, onChange);
  if (chips.length === 0)
    return null;
  const handleClearAll = () => {
    onChange({ ...EMPTY_CLEARED, sort: filters.sort });
  };
  return jsxs("div", { className: "omniguide-product-list__active-filters", role: "region", "aria-label": "Active filters", children: [jsx("ul", { className: "omniguide-product-list__chips", children: chips.map((chip) => jsxs("li", { className: "omniguide-product-list__chip", children: [jsx("span", { className: "omniguide-product-list__chip-label", children: chip.label }), jsx("button", { type: "button", className: "omniguide-product-list__chip-remove", "aria-label": `Remove filter: ${chip.label}`, disabled, onClick: chip.onRemove, children: "×" })] }, chip.id)) }), jsx("button", { type: "button", className: "omniguide-product-list__clear-all", disabled, onClick: handleClearAll, children: "Clear all" })] });
}
const ActiveFilters = memo(ActiveFiltersImpl);
ActiveFilters.displayName = "ActiveFilters";
const KNOWN_SORTS = new Set(SORT_VALUES);
const EMPTY_FILTERS$1 = { f: {}, uc: [], flag: [] };
function hasActiveFilters(filters) {
  if (Object.keys(filters.f ?? {}).length > 0)
    return true;
  if ((filters.uc ?? []).length > 0)
    return true;
  if ((filters.flag ?? []).length > 0)
    return true;
  if (filters.priceMin !== void 0 || filters.priceMax !== void 0)
    return true;
  return false;
}
function resolveSort(data, override) {
  if ((override == null ? void 0 : override.sort) && KNOWN_SORTS.has(override.sort)) {
    return override.sort;
  }
  const fromData = data == null ? void 0 : data.sort;
  if (typeof fromData === "string" && KNOWN_SORTS.has(fromData)) {
    return fromData;
  }
  return "relevance";
}
function ProductListContainer(props) {
  var _a, _b, _c, _d;
  const { data, fallbackImage, currency, locale, priorityCount, filters, onFiltersChange, filtersDisabled, onLoadMore, loadMoreLoading, pageInfo, onRedirect, onChildCategoryClick, error, onRetry, showCategoryHeader = true, drilldownPlacement = "top", recommendationFilter, formatResultCount } = props;
  const products = (data == null ? void 0 : data.products) ?? [];
  const totalEstimate = (_a = data == null ? void 0 : data.pagination) == null ? void 0 : _a.total_estimate;
  const recActive = !!(recommendationFilter == null ? void 0 : recommendationFilter.active);
  const interactive = typeof onFiltersChange === "function" && !recActive;
  const currentFilters = filters ?? EMPTY_FILTERS$1;
  const redirectTo = ((_b = data == null ? void 0 : data.category) == null ? void 0 : _b.redirect_to) ?? null;
  const childCategories = ((_c = data == null ? void 0 : data.category) == null ? void 0 : _c.children) ?? [];
  const drilldownInSidebar = drilldownPlacement === "sidebar" && interactive;
  useEffect(() => {
    if (redirectTo && onRedirect)
      onRedirect(redirectTo);
  }, [redirectTo, onRedirect]);
  const handleSortChange = useCallback((next) => {
    if (!onFiltersChange)
      return;
    onFiltersChange({ ...currentFilters, sort: next, cursor: void 0 });
  }, [onFiltersChange, currentFilters]);
  const handleFacetChange = useCallback((next) => {
    if (!onFiltersChange)
      return;
    onFiltersChange({ ...next, cursor: void 0 });
  }, [onFiltersChange]);
  const handleClearAll = useCallback(() => {
    if (!onFiltersChange)
      return;
    onFiltersChange({ ...EMPTY_FILTERS$1, sort: currentFilters.sort });
  }, [onFiltersChange, currentFilters.sort]);
  const filtersActive = hasActiveFilters(currentFilters);
  if (redirectTo) {
    return jsx("section", { className: "omniguide-product-list omniguide-product-list--redirecting", "aria-busy": "true" });
  }
  return jsx("div", { className: "omniguide", children: jsxs("section", { className: "omniguide-product-list", children: [showCategoryHeader ? jsx(CategoryHeader, { category: (data == null ? void 0 : data.category) ?? {}, wizardSlot: jsx("div", { className: "omniguide-product-list__wizard" }) }) : null, childCategories.length > 0 && !drilldownInSidebar ? jsx(RedirectDrilldown, { items: childCategories, onChildClick: onChildCategoryClick }) : null, interactive ? jsx(Toolbar, { resultCount: typeof totalEstimate === "number" ? totalEstimate : products.length, formatResultCount, sort: {
    value: resolveSort(data, filters),
    onChange: handleSortChange,
    disabled: filtersDisabled
  } }) : null, interactive ? jsx(ActiveFilters, { filters: currentFilters, facets: (data == null ? void 0 : data.facets) ?? [], onChange: handleFacetChange, disabled: filtersDisabled }) : null, jsxs("div", { className: `omniguide-product-list__layout${interactive ? "" : " omniguide-product-list__layout--full"}`, children: [interactive ? jsxs("aside", { className: "omniguide-product-list__sidebar", children: [drilldownInSidebar ? jsx(RedirectDrilldown, { items: childCategories, onChildClick: onChildCategoryClick, facetTitle: "Categories" }) : null, jsx(FacetSidebar, { facets: (data == null ? void 0 : data.facets) ?? [], filters: currentFilters, onChange: handleFacetChange, disabled: filtersDisabled })] }) : null, jsxs("div", { className: "omniguide-product-list__results", "aria-busy": filtersDisabled || void 0, "aria-live": "polite", children: [jsx("div", { className: "omniguide-product-list__results-wizard" }), recActive ? jsxs("div", { className: "omniguide-product-list__rec-banner", role: "status", children: [jsxs("span", { className: "omniguide-product-list__rec-banner-text", children: ["Showing a filtered subset of products based on your question", recommendationFilter ? ` — ${recommendationFilter.count} ${recommendationFilter.count === 1 ? "pick" : "picks"}` : "", "."] }), jsx("button", { type: "button", className: "omniguide-product-list__rec-banner-clear", onClick: recommendationFilter == null ? void 0 : recommendationFilter.onClear, children: "Show all products" })] }) : null, error ? jsx(ProductListError, { onRetry, retryDisabled: filtersDisabled }) : products.length === 0 ? jsxs("div", { className: "omniguide-product-list__empty", role: "status", children: [jsx("p", { className: "omniguide-product-list__empty-text", children: filtersActive ? "No products match these filters." : "No products available." }), filtersActive && interactive ? jsx("button", { type: "button", className: "omniguide-product-list__empty-action", onClick: handleClearAll, disabled: filtersDisabled, children: "Clear filters" }) : null] }) : jsxs(Fragment, { children: [jsx(ProductGrid, { products, fallbackImage, currency, locale, priorityCount }), recActive ? null : pageInfo ? jsx(Pagination, { page: pageInfo.page, totalPages: pageInfo.totalPages, hasPrev: pageInfo.hasPrev, hasNext: pageInfo.hasNext, onPrev: pageInfo.onPrev, onNext: pageInfo.onNext, loading: pageInfo.loading }) : onLoadMore ? jsx(LoadMore, { cursor: ((_d = data == null ? void 0 : data.pagination) == null ? void 0 : _d.next_cursor) ?? null, onLoadMore, loading: loadMoreLoading }) : null] })] })] })] }) });
}
const MAX_TILES = 200;
function tileCount(tiles) {
  if (!Number.isFinite(tiles))
    return 0;
  return Math.min(MAX_TILES, Math.max(0, Math.floor(tiles)));
}
function ProductListSkeleton({ tiles = 24, showCategoryHeader = true, showPagination = false }) {
  return jsxs("div", { className: "omniguide-product-list omniguide-product-list--loading omniguide-product-list-skeleton", "aria-busy": "true", children: [showCategoryHeader ? jsx("div", { className: "omniguide-product-list__header omniguide-product-list-skeleton__header" }) : null, jsx("div", { className: "omniguide-product-list__toolbar omniguide-product-list-skeleton__toolbar" }), jsxs("div", { className: "omniguide-product-list__layout", children: [jsx("div", { className: "omniguide-product-list__sidebar omniguide-product-list-skeleton__sidebar" }), jsxs("div", { className: "omniguide-product-list__results", children: [jsx("div", { className: "omniguide-product-list__grid", children: Array.from({ length: tileCount(tiles) }, (_, i) => jsx("div", { className: "omniguide-product-tile omniguide-product-list-skeleton__tile" }, i)) }), showPagination ? jsx("div", { className: "omniguide-product-list__pagination omniguide-product-list-skeleton__pagination" }) : null] })] })] });
}
function buildSearchUrl(config, query, filters) {
  const base = config.apiBaseUrl.replace(/\/+$/, "");
  const filterQs = buildCanonicalQuery(filters).replace(/^\?/, "");
  const pageSize = `page_size=${config.pageSize ?? 24}`;
  return `${base}/api/v1/search?query=${encodeURIComponent(query)}&${pageSize}${filterQs ? `&${filterQs}` : ""}`;
}
async function fetchSearchResults(config, query, filters, signal) {
  const headers = { Accept: "application/json" };
  if (config.origin)
    headers["X-Omniguide-Origin"] = config.origin;
  const response = await (config.fetchImpl ?? fetch)(buildSearchUrl(config, query, filters), {
    method: "GET",
    headers,
    signal
  });
  if (!response.ok) {
    throw new Error(`Search request failed: ${response.status} ${response.statusText}`);
  }
  const parsed = PLPResponseSchema.safeParse({ category: { id: "" }, ...await response.json() });
  if (!parsed.success) {
    logger.error("Search response failed schema validation", { zodError: parsed.error.message });
    throw new Error("Search response failed schema validation");
  }
  return parsed.data;
}
function expandStyle(from) {
  if (!from || typeof window === "undefined")
    return void 0;
  const inset = `inset(${from.top}px ${window.innerWidth - from.right}px ${window.innerHeight - from.bottom}px ${from.left}px round 24px)`;
  return { "--omniguide-srp-from": inset };
}
const EMPTY_FILTERS = { f: {}, uc: [], flag: [] };
const LIVE_MIN_LENGTH = TYPEAHEAD_MIN_QUERY_LENGTH;
const LIVE_DEBOUNCE_MS = 250;
function SearchResultsModal(props) {
  var _a, _b, _c;
  const { initialQuery, onClose } = props;
  const [input, setInput] = useState(initialQuery);
  const [query, setQuery] = useState(initialQuery.trim());
  const [filters, setFiltersState] = useState(EMPTY_FILTERS);
  const [pageStack, setPageStack] = useState([null]);
  const [pageIndex, setPageIndex] = useState(0);
  const { data, loading, error, retry } = useSearchResults(props, query, filters, pageStack[pageIndex] ?? null);
  const bodyRef = useRef(null);
  const inputRef = useRef(null);
  const dialogRef = useRef(null);
  const [openStyle] = useState(() => expandStyle(props.expandFrom));
  useModalChrome(onClose, dialogRef, inputRef);
  const resetPaging = useCallback(() => {
    setPageStack([null]);
    setPageIndex(0);
  }, []);
  const commit = useCallback((next) => {
    const trimmed = next.trim();
    if (!trimmed || trimmed === query)
      return;
    setQuery(trimmed);
    setFiltersState(EMPTY_FILTERS);
    resetPaging();
  }, [query, resetPaging]);
  useEffect(() => {
    if (input.trim().length < LIVE_MIN_LENGTH)
      return;
    const timer = setTimeout(() => commit(input), LIVE_DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [input, commit]);
  const setFilters = useCallback((next) => {
    setFiltersState(next);
    resetPaging();
  }, [resetPaging]);
  const turnPage = useCallback((index, cursor) => {
    var _a2;
    if (cursor !== void 0) {
      setPageStack((prev) => [...prev.slice(0, index), cursor]);
    }
    setPageIndex(index);
    (_a2 = bodyRef.current) == null ? void 0 : _a2.scrollTo({ top: 0 });
  }, []);
  const nextCursor = ((_a = data == null ? void 0 : data.pagination) == null ? void 0 : _a.next_cursor) ?? null;
  const pageSize = (_b = data == null ? void 0 : data.pagination) == null ? void 0 : _b.page_size;
  const total = (_c = data == null ? void 0 : data.pagination) == null ? void 0 : _c.total_estimate;
  return jsx("div", { className: "omniguide", children: jsxs("div", { className: props.sheet ? "omniguide-srp omniguide-srp--sheet" : "omniguide-srp", role: "dialog", "aria-modal": "true", "aria-label": "Search results", style: openStyle, ref: dialogRef, children: [jsxs("div", { className: "omniguide-srp__header", children: [jsx("div", { className: "omniguide-sheet__brand", children: props.logo }), jsxs("div", { className: "omniguide-srp__bar", children: [jsxs("form", { className: "omniguide-srp__form", role: "search", onSubmit: (e) => {
    e.preventDefault();
    commit(input);
  }, children: [jsx(SearchGlyph, {}), jsx("input", { ref: inputRef, className: "omniguide-srp__input", type: "search", value: input, onChange: (e) => setInput(e.target.value), placeholder: "Search products", "aria-label": "Search products", autoFocus: true }), input && jsx("button", { type: "button", className: "omniguide-srp__clear", onClick: () => {
    var _a2;
    setInput("");
    (_a2 = inputRef.current) == null ? void 0 : _a2.focus();
  }, "aria-label": "Clear", children: jsx(CrossGlyph, { size: 18 }) })] }), props.onAskAssistant && data && !data.is_question && jsxs(Fragment, { children: [jsx("span", { className: "omniguide-sheet__or", "aria-hidden": "true", children: "or" }), jsxs("button", { type: "button", className: "omniguide-sheet__ask-open", onClick: () => {
    var _a2;
    return (_a2 = props.onAskAssistant) == null ? void 0 : _a2.call(props, input.trim() || query);
  }, children: [jsx("span", { className: "omniguide-sheet__spark", children: jsx(SparkGlyph, {}) }), jsx("span", { className: "omniguide-srp__ask-label", children: props.assistantLabel ?? "Ask the assistant" })] })] })] }), jsx("div", { className: "omniguide-sheet__corner", children: jsx("button", { type: "button", className: "omniguide-sheet__close", onClick: onClose, "aria-label": "Close search results", children: jsx(CrossGlyph, { size: 20 }) }) })] }), jsx("div", { className: "omniguide-srp__body", ref: bodyRef, children: (data == null ? void 0 : data.is_question) && props.onAskAssistant ? jsxs("div", { className: "omniguide-srp__question", role: "status", children: [jsx("p", { children: "That sounds like a question." }), jsx("button", { type: "button", onClick: () => {
    var _a2;
    return (_a2 = props.onAskAssistant) == null ? void 0 : _a2.call(props, query);
  }, children: props.assistantLabel ?? "Ask the assistant" })] }) : data ? jsx(ProductListContainer, { data, filters, onFiltersChange: setFilters, filtersDisabled: loading, showCategoryHeader: false, formatResultCount: resultCountLabel(data, narrows(filters)), pageInfo: {
    page: pageIndex + 1,
    // The header names every catalog match when the window is capped, and
    // the pager can only walk that window: "654 results, Page 1 of 4" read
    // as a bug. No page total then; Next still follows the cursor.
    totalPages: data.found_capped && !narrows(filters) || !total || !pageSize ? null : Math.max(1, Math.ceil(total / pageSize)),
    hasPrev: pageIndex > 0,
    hasNext: Boolean(nextCursor),
    onPrev: () => turnPage(pageIndex - 1),
    onNext: () => turnPage(pageIndex + 1, nextCursor),
    loading
  }, error, onRetry: retry, fallbackImage: props.fallbackImage, currency: props.currency, locale: props.locale }) : error ? jsx(ProductListError, { onRetry: retry, retryDisabled: loading }) : jsx(ProductListSkeleton, { showCategoryHeader: false }) })] }) });
}
function resultCountLabel(data, filtered) {
  return (windowCount) => {
    const found = data.found_capped && !filtered ? data.found ?? windowCount : windowCount;
    return `${found.toLocaleString()} ${found === 1 ? "result" : "results"}`;
  };
}
function narrows(filters) {
  return Object.keys(filters.f ?? {}).length > 0 || (filters.uc ?? []).length > 0 || (filters.flag ?? []).length > 0 || filters.priceMin !== void 0 || filters.priceMax !== void 0;
}
function useSearchResults(config, query, filters, cursor) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [attempt, setAttempt] = useState(0);
  const { apiBaseUrl, origin, pageSize, fetchImpl } = config;
  useEffect(() => {
    if (!query)
      return;
    const controller = new AbortController();
    setLoading(true);
    fetchSearchResults({ apiBaseUrl, origin, pageSize, fetchImpl }, query, { ...filters, cursor: cursor ?? void 0 }, controller.signal).then((next) => {
      if (controller.signal.aborted)
        return;
      setData(next);
      setError(null);
    }).catch((err) => {
      if (controller.signal.aborted)
        return;
      const failure = err instanceof Error ? err : new Error(String(err));
      logger.error("Search results request failed", { query, message: failure.message });
      setError(failure);
    }).finally(() => {
      if (!controller.signal.aborted)
        setLoading(false);
    });
    return () => controller.abort();
  }, [apiBaseUrl, origin, pageSize, fetchImpl, query, filters, cursor, attempt]);
  return { data, loading, error, retry: () => setAttempt((n2) => n2 + 1) };
}
function useModalChrome(onClose, dialogRef, initialFocusRef) {
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;
  useEffect(() => {
    var _a;
    const returnFocus = document.activeElement;
    const unlockScroll = lockPageScroll();
    (_a = initialFocusRef.current) == null ? void 0 : _a.focus();
    const onKey = (e) => {
      if (e.key === "Escape")
        onCloseRef.current();
      if (e.key === "Tab" && dialogRef.current)
        trapTab(e, dialogRef.current);
    };
    document.addEventListener("keydown", onKey);
    return () => {
      var _a2;
      document.removeEventListener("keydown", onKey);
      unlockScroll();
      (_a2 = returnFocus == null ? void 0 : returnFocus.focus) == null ? void 0 : _a2.call(returnFocus);
    };
  }, [dialogRef, initialFocusRef]);
}
function lockPageScroll() {
  const root = document.documentElement;
  const { body } = document;
  const previous = [root.style.overflow, body.style.overflow];
  const reserve = !root.style.scrollbarGutter && window.innerWidth > root.clientWidth;
  if (reserve)
    root.style.scrollbarGutter = "stable";
  root.style.overflow = "hidden";
  body.style.overflow = "hidden";
  return () => {
    [root.style.overflow, body.style.overflow] = previous;
    if (reserve)
      root.style.scrollbarGutter = "";
  };
}
const FOCUSABLE = 'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';
function trapTab(e, dialog) {
  const focusable = Array.from(dialog.querySelectorAll(FOCUSABLE)).filter((el) => el.getClientRects().length > 0 && !el.closest("[inert]"));
  const first = focusable[0];
  const last = focusable[focusable.length - 1];
  if (!first || !last)
    return;
  const active = document.activeElement;
  const wrapTo = !dialog.contains(active) ? first : e.shiftKey && active === first ? last : !e.shiftKey && active === last ? first : null;
  if (!wrapTo)
    return;
  e.preventDefault();
  wrapTo.focus();
}
const GLYPH = { fill: "none", stroke: "currentColor", strokeWidth: 2, strokeLinecap: "round", strokeLinejoin: "round", "aria-hidden": true };
function SearchGlyph() {
  return jsxs("svg", { width: "20", height: "20", viewBox: "0 0 24 24", ...GLYPH, children: [jsx("circle", { cx: "11", cy: "11", r: "8" }), jsx("path", { d: "m21 21-4.3-4.3" })] });
}
function CrossGlyph({ size }) {
  return jsxs("svg", { width: size, height: size, viewBox: "0 0 24 24", ...GLYPH, children: [jsx("path", { d: "M18 6 6 18" }), jsx("path", { d: "m6 6 12 12" })] });
}
function SparkGlyph() {
  return jsxs("svg", { width: "16", height: "16", viewBox: "0 0 24 24", ...GLYPH, strokeWidth: 1.75, children: [jsx("path", { d: "M9.937 15.5A2 2 0 0 0 8.5 14.063l-6.135-1.582a.5.5 0 0 1 0-.962L8.5 9.936A2 2 0 0 0 9.937 8.5l1.582-6.135a.5.5 0 0 1 .963 0L14.063 8.5A2 2 0 0 0 15.5 9.937l6.135 1.581a.5.5 0 0 1 0 .964L15.5 14.063a2 2 0 0 0-1.437 1.437l-1.582 6.135a.5.5 0 0 1-.963 0z" }), jsx("path", { d: "M20 3v4" }), jsx("path", { d: "M22 5h-4" })] });
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
const RETURN_FOCUS = "data-omniguide-return-focus";
const SUBMIT = 'button[type="submit"], input[type="submit"], button:not([type])';
function rememberOpener(input) {
  forgetOpener();
  input.setAttribute(RETURN_FOCUS, "");
}
function forgetOpener() {
  document.querySelectorAll(`[${RETURN_FOCUS}]`).forEach((el) => el.removeAttribute(RETURN_FOCUS));
}
function restoreFocus() {
  var _a, _b;
  const input = document.querySelector(`[${RETURN_FOCUS}]`);
  forgetOpener();
  (_b = (_a = input == null ? void 0 : input.form) == null ? void 0 : _a.querySelector(SUBMIT)) == null ? void 0 : _b.focus({ preventScroll: true });
}
let reservedGutter = false;
function activateSearchBody(websiteId) {
  const root = document.documentElement;
  if (!root.style.scrollbarGutter && window.innerWidth > root.clientWidth) {
    root.style.scrollbarGutter = "stable";
    reservedGutter = true;
  }
  document.body.classList.add("ai-search-active");
  document.body.setAttribute("data-omniguide-search", websiteId);
}
function deactivateSearchBody() {
  document.body.classList.remove("ai-search-active");
  document.body.removeAttribute("data-omniguide-search");
  if (reservedGutter) document.documentElement.style.scrollbarGutter = "";
  reservedGutter = false;
}
const log = createScopedLogger("BCSearchContainer");
const SEARCH_HASH = "#!/search";
function BCSearchContainer() {
  var _a, _b, _c;
  const { config, platformAdapter, consentService } = useOmniguideContext();
  const SheetLogo = useComponent("SearchSheetLogo", SearchSheetLogo);
  const {
    websiteId,
    websiteCode,
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
  const [inlineOpen, setInlineOpen] = useState(false);
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
    trackFeedback,
    trackComponentClose,
    trackSearchOpened,
    trackQuestionAnswered,
    trackRecommendationProvided,
    trackStartOver,
    trackScrollForMore,
    trackScrollStarted,
    trackRecProductClick,
    trackInlineProductLink
  } = useAnalyticsTracking({ websiteId });
  const handleFeedbackSubmitted = useCallback(({ entityId, vote }) => {
    trackFeedback({
      messageId: entityId,
      feedbackType: vote > 0 ? "thumbs_up" : "thumbs_down",
      turnNumber: 0
    });
  }, [trackFeedback]);
  const FeedbackWidgetComponent = useFeedbackWidget({
    onFeedbackSubmitted: handleFeedbackSubmitted
  });
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
    () => buildBCHydrationConfig(config, platformAdapter),
    [config, platformAdapter]
  );
  const fetchProductUrls = useCallback(
    (skus) => fetchProductUrlsBySkus(skus, hydrationConfig),
    [hydrationConfig]
  );
  const isInlineSearch = inlineOpen && !!(ui == null ? void 0 : ui.inlineSearchTarget);
  useEffect(() => {
    if (isOpen && !isInlineSearch) {
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
  }, [isOpen, isInlineSearch]);
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
  }, [callbacks, websiteId]);
  const wasOpenRef = useRef(isOpen);
  useEffect(() => {
    if (wasOpenRef.current && !isOpen) {
      handleResetChat({ track: false });
    }
    wasOpenRef.current = isOpen;
  }, [isOpen, handleResetChat]);
  useEffect(() => {
    if (isOpen && sessionId && !sessionStartRef.current) {
      sessionStartRef.current = Date.now();
      setSessionStart(websiteId, Date.now());
    }
    if (!isOpen && sessionStartRef.current) {
      sessionStartRef.current = null;
    }
  }, [isOpen, sessionId, websiteId]);
  const sendUnlessBusyRef = useRef(() => {
  });
  useEffect(() => {
    localStorage.setItem("aiSearch", isConversational.toString());
    const handleSearchOpen = (event) => {
      var _a2, _b2, _c2, _d, _e, _f;
      if (((_a2 = event.detail) == null ? void 0 : _a2.websiteId) && event.detail.websiteId !== websiteId) return;
      setInlineOpen(((_b2 = event.detail) == null ? void 0 : _b2.source) === "category_guide_teaser");
      setIsOpen(true);
      trackSearchOpened({
        source: ((_c2 = event.detail) == null ? void 0 : _c2.source) || "search_button",
        page_type: window.location.pathname.includes("/products/") ? "product" : window.location.pathname.includes("/category/") ? "category" : "other"
      });
      const openedWith = typeof ((_d = event.detail) == null ? void 0 : _d.query) === "string" ? event.detail.query.trim() : "";
      if (openedWith && ((_e = event.detail) == null ? void 0 : _e.ask) && isConversational) {
        sendUnlessBusyRef.current(openedWith);
      } else if ((_f = event.detail) == null ? void 0 : _f.query) {
        setQuery(event.detail.query);
      }
    };
    window.addEventListener(
      "openAISearch",
      handleSearchOpen
    );
    const handleEscape = (e) => {
      if (e.key === "Escape" && isOpen && !e.defaultPrevented) {
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
  }, [isOpen, setQuery, isConversational, trackSearchOpened, websiteId]);
  useEffect(() => {
    const latest = messages.find(
      (m2) => m2.role === "assistant" && Array.isArray(m2.sources) && m2.sources.some((s) => (s == null ? void 0 : s.type) === "product" && s.data)
    );
    if (!latest) return;
    const products = latest.sources.filter((s) => (s == null ? void 0 : s.type) === "product" && s.data).map((s, i) => {
      var _a2;
      const d = s.data;
      const brand = typeof d["brand"] === "object" ? (_a2 = d["brand"]) == null ? void 0 : _a2.name : d["product_line"] ?? d["brand"];
      return {
        sku: String(d["sku"] ?? d["id"] ?? d["entityId"] ?? ""),
        id: d["id"] ?? d["entityId"],
        name: d["name"] ?? d["display_name"],
        brand,
        url: d["url"] ?? d["path"],
        image_url: d["imageUrl"] ?? d["image_url"],
        price: d["price"],
        retail_price: d["originalPrice"] ?? d["retail_price"],
        matchPct: d["matchPct"],
        rank: d["rank"] ?? i + 1
      };
    }).filter((p) => p.sku || p.name);
    if (products.length) emitRecommendations({ page: "plp", products, source: "search" });
  }, [messages]);
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
  const handleAskAssistant = useCallback(
    (searchQuery) => {
      setIsConversational(true);
      const trimmed = searchQuery.trim();
      if (!trimmed || isLoading) return;
      sendMessage(trimmed);
      setQuery("");
    },
    [isLoading, sendMessage, setQuery]
  );
  const handleStoreSearch = useCallback((searchQuery) => {
    window.location.href = `/search.php?search_query=${encodeURIComponent(searchQuery)}`;
  }, []);
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
  const [resultsQuery, setResultsQuery] = useState(null);
  const expandFromRef = useRef(null);
  const openResults = useCallback((searchQuery) => {
    var _a2;
    expandFromRef.current = ((_a2 = document.querySelector(".omniguide-modal__overlay--anchored, .omniguide-modal__overlay--sheet")) == null ? void 0 : _a2.getBoundingClientRect()) ?? null;
    handleClose();
    setResultsQuery(searchQuery);
  }, [handleClose]);
  const closeResults = useCallback(() => setResultsQuery(null), []);
  const sendUnlessBusy = useCallback((searchQuery) => {
    var _a2;
    const lastAsked = (_a2 = [...messages].reverse().find((m2) => m2.role === "user")) == null ? void 0 : _a2.content;
    if (isLoading || searchQuery.trim() === (lastAsked == null ? void 0 : lastAsked.trim())) return;
    sendMessage(searchQuery);
  }, [sendMessage, messages, isLoading]);
  sendUnlessBusyRef.current = sendUnlessBusy;
  const askFromResults = useCallback((searchQuery) => {
    setResultsQuery(null);
    activateSearchBody(websiteId);
    setIsOpen(true);
    sendUnlessBusy(searchQuery);
  }, [sendUnlessBusy, websiteId]);
  const handleSeeAllResults = (ui == null ? void 0 : ui.searchResultsModal) ? openResults : handleStoreSearch;
  const adaptedTrackProductClick = useCallback(
    (data) => {
      trackProductClick(data);
      trackRecProductClick({
        sku: String(data["productSku"] || ""),
        recSource: "chat_result",
        recPageArea: "header",
        recPosition: typeof data["position"] === "number" ? data["position"] : void 0,
        messageId: typeof data["messageId"] === "string" ? data["messageId"] : void 0,
        // The same `queryContext` handed to `trackProductClick` on the line
        // above. This is the surface SOI-2373 AC1 describes — a product click
        // out of conversation search — and the backend write was dropping the
        // one field that says what the shopper was looking for.
        queryContext: typeof data["queryContext"] === "string" ? data["queryContext"] : void 0
      });
    },
    [trackProductClick, trackRecProductClick]
  );
  const adaptedTrackCategoryClick = useCallback(
    (data) => trackCategoryClick(data),
    [trackCategoryClick]
  );
  const adaptedTrackContentClick = useCallback(
    (data) => trackContentClick(data),
    [trackContentClick]
  );
  const handleInlineProductLinkClick = useCallback(
    (data) => {
      trackInlineProductLink({
        sku: data.sku,
        productUrl: data.href,
        messageId: data.messageId,
        recPageArea: "header",
        queryContext: data.queryContext
      });
    },
    [trackInlineProductLink]
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
      sendIntentAnswer(
        answerText,
        answerId == null ? null : String(answerId),
        options
      );
    },
    [sendIntentAnswer]
  );
  const adaptedSendClarificationAnswer = useCallback(
    (answerText, optionId, paramName) => {
      sendClarificationAnswer(answerText, String(optionId), paramName);
    },
    [sendClarificationAnswer]
  );
  const trendingRow = useMemo(() => {
    if (!(ui == null ? void 0 : ui.searchTrending)) return null;
    return /* @__PURE__ */ React.createElement("div", { className: "omniguide", "aria-live": "off" }, /* @__PURE__ */ React.createElement(
      CarouselContainer,
      {
        slot: "home_trending",
        label: (ui == null ? void 0 : ui.searchTrendingLabel) ?? "Trending Now",
        apiBaseUrl: config.apiBaseUrl,
        websiteCode: websiteCode ?? websiteId,
        fallbackImage: fallbackImages == null ? void 0 : fallbackImages.product,
        showLoadingSkeleton: false,
        headingLevel: 5,
        getSessionId: () => sessionId ?? null
      }
    ));
  }, [
    ui == null ? void 0 : ui.searchTrending,
    ui == null ? void 0 : ui.searchTrendingLabel,
    config.apiBaseUrl,
    websiteCode,
    websiteId,
    fallbackImages == null ? void 0 : fallbackImages.product,
    sessionId
  ]);
  return /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement(
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
      onAskAssistant: handleAskAssistant,
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
      subtitle: (ui == null ? void 0 : ui.searchSubtitle) ?? "Shopping Advisor",
      searchIcon: (ui == null ? void 0 : ui.searchIconUrl) ? /* @__PURE__ */ React.createElement("img", { className: "omniguide-modal__header-icon-img", src: ui.searchIconUrl, alt: "" }) : void 0,
      aiSearchStoreUrl,
      fallbackProductImage: fallbackImages == null ? void 0 : fallbackImages.product,
      fallbackCategoryImage: fallbackImages == null ? void 0 : fallbackImages.category,
      fallbackBlogImage: fallbackImages == null ? void 0 : fallbackImages.blog,
      fetchProductUrls,
      sessionId: sessionId ?? "",
      FeedbackWidgetComponent,
      onOpenSupport: (callbacks == null ? void 0 : callbacks.onOpenSupport) ? handleOpenSupport : void 0,
      supportHref: ui == null ? void 0 : ui.supportHref,
      supportLabel: ui == null ? void 0 : ui.supportLabel,
      onModalOpen: handleModalOpen,
      onModalClose: handleModalClose,
      privacyPolicyUrl: (consent == null ? void 0 : consent.privacyPolicyUrl) ?? "/privacy-policy",
      defaultSearchExamples: ui == null ? void 0 : ui.searchExampleQuestions,
      consentEnabled: (consent == null ? void 0 : consent.enabled) ? consentEnabled : void 0,
      onToggleConsent: (consent == null ? void 0 : consent.enabled) ? handleToggleConsent : void 0,
      consentDisabled: (consent == null ? void 0 : consent.enabled) ? !websiteConsent : void 0,
      showProductTags: ((_a = config.features) == null ? void 0 : _a.productTags) !== false,
      zeroPriceDisplay: ui == null ? void 0 : ui.zeroPriceDisplay,
      relatedContentFirstForQuestions: ((_b = ui == null ? void 0 : ui.search) == null ? void 0 : _b.relatedContentFirstForQuestions) ?? true,
      onScrollForMoreTapped: handleScrollForMoreTapped,
      onScrollStarted: handleScrollStarted,
      onInlineProductLinkClick: handleInlineProductLinkClick,
      anchored: ui == null ? void 0 : ui.anchoredSearch,
      anchorSelector: ui == null ? void 0 : ui.searchAnchorSelector,
      anchorMatchWidth: ui == null ? void 0 : ui.anchorMatchWidth,
      inline: inlineOpen && !!(ui == null ? void 0 : ui.inlineSearchTarget),
      inlineTarget: ui == null ? void 0 : ui.inlineSearchTarget,
      typeahead: ui == null ? void 0 : ui.typeahead,
      sheet: ui == null ? void 0 : ui.searchSheet,
      popularTerms: ui == null ? void 0 : ui.searchPopularTerms,
      currency: ui == null ? void 0 : ui.currency,
      sheetLogo: ui == null ? void 0 : ui.searchSheetLogo,
      onSeeAllResults: handleSeeAllResults,
      onSearchSubmit: (ui == null ? void 0 : ui.searchResultsModal) ? openResults : void 0,
      assistantLabel: ui == null ? void 0 : ui.assistantLabel,
      emptyStateFooter: trendingRow,
      hideMobileAskBox: ((_c = config.features) == null ? void 0 : _c.hideMobileAskBox) === true
    }
  ), resultsQuery !== null ? /* @__PURE__ */ React.createElement(
    SearchResultsModal,
    {
      apiBaseUrl: config.apiBaseUrl,
      origin: sanitizeUrl(getCurrentPage()) || void 0,
      initialQuery: resultsQuery,
      expandFrom: expandFromRef.current,
      onClose: closeResults,
      onAskAssistant: askFromResults,
      assistantLabel: ui == null ? void 0 : ui.assistantLabel,
      logo: /* @__PURE__ */ React.createElement(SheetLogo, { logo: ui == null ? void 0 : ui.searchSheetLogo }),
      sheet: !!(ui == null ? void 0 : ui.searchSheet),
      fallbackImage: fallbackImages == null ? void 0 : fallbackImages.product,
      currency: ui == null ? void 0 : ui.currency
    }
  ) : null);
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
const SEARCH_ICON_VIEWBOX = "0 0 20.5627 20.5674";
const SEARCH_ICON_BOX = "21";
const SEARCH_ICON_PATHS = `<path d="M9.4953 2C8.01204 2 6.56162 2.43967 5.32831 3.26367C2.83318 4.93087 1.55452 8.01993 2.13983 10.9629C2.42923 12.4177 3.14271 13.7548 4.19159 14.8037C6.31348 16.9255 9.59339 17.5769 12.3654 16.4287C15.1387 15.2798 16.9953 12.5021 16.9953 9.5H18.9953C18.9953 10.8103 18.7176 12.1086 18.197 13.3018C17.5727 14.7328 17.593 16.4891 18.6971 17.5929L20.5627 19.458L19.4533 20.5674L17.5853 18.6994C16.4819 17.5959 14.7266 17.5782 13.292 18.1923C9.7981 19.6879 5.55216 18.9923 2.77753 16.2178C1.44898 14.8892 0.544506 13.1962 0.177917 11.3535C-0.563569 7.62581 1.05663 3.71231 4.21698 1.60059C5.77919 0.55682 7.61648 0 9.4953 0V2Z" fill="currentColor"/>
  <path d="M13.7531 0.0488281C13.8338 4.32301 14.6717 5.16046 18.9455 5.24121C19.0082 5.73809 19.0081 6.26091 18.9455 6.75781C14.6719 6.83856 13.8339 7.67665 13.7531 11.9502C13.2563 12.0129 12.7333 12.0129 12.2365 11.9502C12.1558 7.67642 11.3183 6.83848 7.04413 6.75781C6.98149 6.26096 6.98141 5.73804 7.04413 5.24121C11.3185 5.16054 12.1558 4.32324 12.2365 0.0488281C12.7333 -0.0138614 13.2563 -0.0138114 13.7531 0.0488281Z" fill="currentColor"/>`;
const DEFAULT_ICON_MAX_SIZE = "20px";
function readHostIconStyle(svg) {
  const cs = getComputedStyle(svg);
  return { fill: cs.fill, verticalAlign: cs.verticalAlign };
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
      if (document.body.getAttribute("data-omniguide-search") === websiteId) deactivateSearchBody();
      restoreFocus();
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
    if (!source.endsWith("_input_focus")) forgetOpener();
    activateSearchBody(this.omniguideConfig.websiteId);
    window.dispatchEvent(new CustomEvent("openAISearch", {
      detail: { query, source, websiteId: this.omniguideConfig.websiteId }
    }));
  }
  /**
   * Opens straight into the assistant with `query` as the shopper's first
   * message, skipping the search step — for a host entry point that has
   * already collected the query, such as its own autocomplete. Without a query
   * it is `openSearch`, and so it is in non-conversational search mode, where
   * there is no assistant to skip to. Never sends over a streaming answer or
   * repeats the last question (see BCSearchContainer).
   */
  askAssistant(query = "", source = "unknown") {
    forgetOpener();
    activateSearchBody(this.omniguideConfig.websiteId);
    window.dispatchEvent(new CustomEvent("openAISearch", {
      detail: { query, source, websiteId: this.omniguideConfig.websiteId, ask: true }
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
      flushSync(() => this.root.render(/* @__PURE__ */ React.createElement(OmniguideProvider, { ...providerProps })));
    }
  }
  hideDefaultSearch(rootId) {
    var _a, _b;
    const selectors = this.omniguideConfig.selectors ?? {};
    const quickSearchResults = selectors.quickSearchResults ?? '.quickSearchResults, [data-search="quickResults"]';
    const anchored = !!((_a = this.omniguideConfig.ui) == null ? void 0 : _a.anchoredSearch);
    const sheet = !!((_b = this.omniguideConfig.ui) == null ? void 0 : _b.searchSheet);
    const pageScrollLock = anchored || sheet ? "" : "body.ai-search-active { overflow: hidden; }";
    const style = document.createElement("style");
    const quickSearchSelectors = quickSearchResults.split(",").map((s) => `body.ai-search-active ${s.trim()}`).join(",\n            ");
    style.textContent = `
      ${quickSearchSelectors} {
        display: none !important;
      }
      ${pageScrollLock}
      #${rootId} {
        z-index: 10000;
      }
    `;
    document.head.appendChild(style);
  }
  swapSearchIcon() {
    const selectors = this.omniguideConfig.selectors ?? {};
    const expandSelector = selectors.searchExpandButton ?? "#quick-search-expand";
    const searchExpand = document.querySelector(expandSelector);
    if (!searchExpand) return;
    const existingSvg = searchExpand.querySelector("svg");
    if (!existingSvg) return;
    const host = readHostIconStyle(existingSvg);
    preserveAccessibleName(searchExpand, existingSvg);
    const aiSearchIcon = buildDefaultIcon();
    sizeDefaultIcon(aiSearchIcon);
    applyHostFill(aiSearchIcon, host.fill);
    alignIconToHost(aiSearchIcon, host.verticalAlign);
    existingSvg.replaceWith(aiSearchIcon);
  }
  // Typeahead tenants take the header box at every width (SOI-2436); the rest keep
  // the theme's own phone search. The mobile menu's field is BCMobileSearchIntegration's.
  overrideSearchBehavior() {
    var _a;
    if (!((_a = this.omniguideConfig.ui) == null ? void 0 : _a.typeahead) && window.innerWidth <= 767) return;
    if (this.isWordPressEnvironment()) {
      this.overrideWordPressSearch();
    } else {
      this.overrideDesktopSearch();
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
        rememberOpener(e.target);
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
      const open = (el) => {
        rememberOpener(el);
        el.blur();
        const query = el.value;
        el.value = "";
        this.openSearch(query, "search_input_focus");
      };
      this._addTrackedListener(input, "focus", ((e) => {
        e.preventDefault();
        e.stopImmediatePropagation();
        open(e.target);
      }), true);
      if (document.activeElement === input) open(input);
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
    if (document.body.getAttribute("data-omniguide-search") === this.omniguideConfig.websiteId) deactivateSearchBody();
  }
}
export {
  BCSearchIntegration,
  m as buildConfig,
  n as buildPlatformAdapter
};
//# sourceMappingURL=omniguide-search-BaWWk4dU.js.map
