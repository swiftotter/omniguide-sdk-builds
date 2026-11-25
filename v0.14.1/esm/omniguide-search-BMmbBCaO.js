import { u as useT, r as renderableFlags, F as FlagBadges, R as ReviewInsightsToggle, b as buildSafeUrl, s as safeNavigate, i as isValidNavigationUrl, a as useComponent, S as SearchChatPanel, c as useChatNavigation, d as SearchPrivacySettings, e as SearchChatInput, f as useOmniguideContext, g as useLocalizedList, h as useAnalyticsTracking, j as useFeedbackWidget, k as useBCSearchChat, l as useUserConsent, m as buildBCHydrationConfig, n as fetchProductUrlsBySkus, Q as QuestionnaireTeaser, O as OmniguideProvider } from "./shared-ciXz81MU.js";
import { o, p } from "./shared-ciXz81MU.js";
import React, { memo, useRef, useState, useEffect, useMemo, useCallback, useLayoutEffect, Suspense, lazy } from "react";
import { createPortal, flushSync } from "react-dom";
import { createRoot } from "react-dom/client";
import { e as emitRecommendations } from "./shared-BVEY4TgW.js";
import { m as markdownOf, t as transformSummary, s as safeHref, a as setSessionId, g as getConversationId, b as getCurrentPage, n as normalizeSessionResponse, R as RestSessionResponseSchema, c as setFeatureStatus, r as resolveSearchPage, d as setSessionStart, e as sanitizeUrl, i as inlineTypeName } from "./shared-iBjwBYJu.js";
import { s as savePercent, f as formatPrice, l as logger, A as API_ENDPOINTS, n as nativeFetch, a as setRecognizedLocale, b as localeMemory, c as createScopedLogger } from "./shared-dt7kNtBU.js";
import { l as localizedTagValue, P as ProductTag, B as BCCategoryRecommendations, b as buildTeaserCopy } from "./shared-BvLivsqw.js";
const TAG_LABELS = {
  "top-pick": "tag.topPick",
  "runner-up": "tag.runnerUp"
};
const TrophyIcon = () => /* @__PURE__ */ React.createElement("svg", { width: "14", height: "14", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", style: { marginRight: "4px" } }, /* @__PURE__ */ React.createElement("path", { d: "M6 9H4.5a2.5 2.5 0 0 1 0-5H6" }), /* @__PURE__ */ React.createElement("path", { d: "M18 9h1.5a2.5 2.5 0 0 0 0-5H18" }), /* @__PURE__ */ React.createElement("path", { d: "M4 22h16" }), /* @__PURE__ */ React.createElement("path", { d: "M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22" }), /* @__PURE__ */ React.createElement("path", { d: "M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22" }), /* @__PURE__ */ React.createElement("path", { d: "M18 2H6v7a6 6 0 0 0 12 0V2Z" }));
const AwardIcon = () => /* @__PURE__ */ React.createElement("svg", { width: "14", height: "14", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", style: { marginRight: "4px" } }, /* @__PURE__ */ React.createElement("circle", { cx: "12", cy: "8", r: "6" }), /* @__PURE__ */ React.createElement("path", { d: "M15.477 12.89 17 22l-5-3-5 3 1.523-9.11" }));
const TAG_ICONS = {
  "top-pick": TrophyIcon,
  "runner-up": AwardIcon
};
const SearchAITag = memo(({ status }) => {
  const t = useT();
  if (!status || !TAG_LABELS[status]) {
    return null;
  }
  const IconComponent = TAG_ICONS[status];
  const className = `omniguide-ai-tag omniguide-ai-tag--${status}`;
  return /* @__PURE__ */ React.createElement("span", { className }, IconComponent && /* @__PURE__ */ React.createElement(IconComponent, null), t(TAG_LABELS[status]));
});
SearchAITag.displayName = "SearchAITag";
function decodeHtmlEntities(text) {
  if (!text) return "";
  const textarea = document.createElement("textarea");
  textarea.innerHTML = text;
  return textarea.value;
}
function productImageUrl(product) {
  var _a;
  return ((_a = product.variant_match) == null ? void 0 : _a.variant_image_url) || product.image_url || product.imageUrl || void 0;
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
  const t = useT();
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
  const sale = markdownOf({
    price: product.price,
    sale_price: product.sale_price,
    retail_price: product.retail_price ?? product.originalPrice
  });
  const savePct = sale ? savePercent(sale.was, sale.now) : null;
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
  const railFallback = t(isTopPick ? "card.topPick" : "card.runnerUp");
  const railBadgeLabel = ((_b = product.tag) == null ? void 0 : _b.label) || localizedTagValue(product.tag, railFallback) || railFallback;
  const hasStock = typeof product.in_stock === "boolean";
  const stockLabel = t(product.in_stock ? "card.inStock" : "card.outOfStock");
  const badgeLabels = renderableFlags(product.flags).map((f) => `, ${String(f.label ?? f.key)}`).join("");
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
      "aria-label": `${brandName ? t("card.viewByBrand", { name: decodeHtmlEntities(cleanDisplayName), brand: decodeHtmlEntities(brandName) }) : t("card.view", { name: decodeHtmlEntities(cleanDisplayName) })}${isRail && hasStock ? `, ${stockLabel}` : ""}${badgeLabels}`,
      "data-product-card": true
    },
    /* @__PURE__ */ React.createElement("div", { className: "omniguide-product-card__image-wrapper" }, /* @__PURE__ */ React.createElement(
      "img",
      {
        src: productImageUrl(product) || fallbackImage || "",
        alt: decodeHtmlEntities(cleanDisplayName),
        className: "omniguide-product-card__image"
      }
    ), savePct != null && /* @__PURE__ */ React.createElement("div", { className: "omniguide-product-card__discount-badge" }, t("price.save", { percent: savePct })), !isRail && showProductTags && savePct == null && product.tag && /* @__PURE__ */ React.createElement(ProductTag, { tag: product.tag, classPrefix: "omniguide-ai-tag" })),
    /* @__PURE__ */ React.createElement("div", { className: "omniguide-product-card__body" }, isRail && (showProductTags || hasStock) && /* @__PURE__ */ React.createElement("div", { className: "omniguide-product-card__flags" }, showProductTags && /* @__PURE__ */ React.createElement("span", { className: "omniguide-product-card__badge" }, railBadgeLabel), hasStock && /* @__PURE__ */ React.createElement("span", { className: `omniguide-product-card__stock omniguide-product-card__stock--${product.in_stock ? "in" : "out"}` }, stockLabel)), /* @__PURE__ */ React.createElement(FlagBadges, { flags: product.flags, listClassName: "omniguide-flag-badges" }), /* @__PURE__ */ React.createElement("div", { className: "omniguide-product-card__title-group" }, brandName && /* @__PURE__ */ React.createElement("p", { className: "omniguide-product-card__brand" }, decodeHtmlEntities(brandName)), /* @__PURE__ */ React.createElement("h4", { className: "omniguide-product-card__title" }, decodeHtmlEntities(cleanDisplayName))), /* @__PURE__ */ React.createElement("div", { className: "omniguide-product-card__price-rating-row" }, /* @__PURE__ */ React.createElement("div", { className: "omniguide-product-card__price-group" }, showCustomZeroPriceText ? /* @__PURE__ */ React.createElement("span", { className: "omniguide-product-card__price omniguide-product-card__price--call" }, zeroPriceDisplay) : /* @__PURE__ */ React.createElement(React.Fragment, null, product.price != null && /* @__PURE__ */ React.createElement("span", { className: "omniguide-product-card__price" }, formatPrice(sale ? sale.now : product.price)), sale && /* @__PURE__ */ React.createElement("s", { className: "omniguide-product-card__price omniguide-product-card__price--original" }, /* @__PURE__ */ React.createElement("span", { className: "sr-only" }, t("price.was"), " "), formatPrice(sale.was)))), (((_c = product.review_insights) == null ? void 0 : _c.average_rating) != null && product.review_insights.average_rating > 0 || product.rating) && /* @__PURE__ */ React.createElement(
      ReviewInsightsToggle,
      {
        rating: ((_d = product.review_insights) == null ? void 0 : _d.average_rating) || product.rating || 0,
        reviewCount: ((_e = product.review_insights) == null ? void 0 : _e.review_count) || 0,
        summary: (_f = product.review_insights) == null ? void 0 : _f.summary,
        likes: (_g = product.review_insights) == null ? void 0 : _g.likes
      }
    )), isRail && (product.reason || isTopPick && product.summary) && /* @__PURE__ */ React.createElement("p", { className: "omniguide-product-card__reason" }, decodeHtmlEntities(product.reason || product.summary || "")), isRail && /* @__PURE__ */ React.createElement(
      "button",
      {
        type: "button",
        className: "omniguide-product-card__view",
        onClick: (e) => {
          e.stopPropagation();
          handleClick(e);
        }
      },
      t("card.viewProduct"),
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
  const t = useT();
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
  const imageAlt = ((_b = data.image) == null ? void 0 : _b.altText) || data.name || t("card.categoryFallbackAlt");
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
  const t = useT();
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
      "aria-label": t("card.readArticle", { title })
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
function answerOf(card) {
  var _a;
  const group = (_a = card.data) == null ? void 0 : _a["group"];
  if ((group == null ? void 0 : group.kind) !== "value") return "";
  if (typeof group.value === "string") return group.value;
  warnUnheaded();
  return "";
}
let warnedUnheaded = false;
function warnUnheaded() {
  if (warnedUnheaded) return;
  warnedUnheaded = true;
  logger.warn("Answer groups: a card grouped by value carries no string group.value; its cards render ungrouped (SOI-2942).");
}
function answerGroups(cards) {
  const groups = [];
  const byAnswer = /* @__PURE__ */ new Map();
  cards.forEach((card, i) => {
    const answer = answerOf(card);
    const last = groups[groups.length - 1];
    const group = answer ? byAnswer.get(answer) : last && !last.answer ? last : void 0;
    if (group) {
      group.cards.push(card);
      return;
    }
    const fresh = { answer, cards: [card], start: i };
    groups.push(fresh);
    if (answer) byAnswer.set(answer, fresh);
  });
  return byAnswer.size > 1 ? groups : null;
}
function AnswerGroups({ groups, onAnswerClick, renderCard, className }) {
  const t = useT();
  return /* @__PURE__ */ React.createElement(React.Fragment, null, groups.map(({ answer, cards, start }) => /* @__PURE__ */ React.createElement("div", { key: start, className: "omniguide-results__answer-group" }, answer && /* @__PURE__ */ React.createElement("h4", { className: "omniguide-results__answer-title" }, /* @__PURE__ */ React.createElement(
    "button",
    {
      type: "button",
      className: "omniguide-results__answer-heading",
      onClick: () => onAnswerClick == null ? void 0 : onAnswerClick(answer),
      disabled: !onAnswerClick,
      "aria-label": t("search.askForAnswer", { answer })
    },
    answer
  )), /* @__PURE__ */ React.createElement("div", { className }, cards.map(renderCard)))));
}
const CATEGORIES_FIRST_ROW = 3;
const PRODUCTS_FIRST_ROW = 3;
const CONTENT_FIRST_ROW = 3;
const CategoryPillSkeleton = () => /* @__PURE__ */ React.createElement("div", { className: "omniguide-skeleton__pill omniguide-skeleton" }, /* @__PURE__ */ React.createElement("span", { className: "omniguide-skeleton__text", style: { width: "120px" } }), /* @__PURE__ */ React.createElement("span", { className: "omniguide-skeleton__text", style: { width: "30px" } }));
const ProductCardSkeleton = () => /* @__PURE__ */ React.createElement("div", { className: "omniguide-skeleton__card omniguide-skeleton" }, /* @__PURE__ */ React.createElement("div", { className: "omniguide-skeleton__image" }), /* @__PURE__ */ React.createElement("div", { className: "omniguide-skeleton__body" }, /* @__PURE__ */ React.createElement("div", { className: "omniguide-skeleton__text omniguide-skeleton__text--brand" }), /* @__PURE__ */ React.createElement("div", { className: "omniguide-skeleton__text omniguide-skeleton__text--title" }), /* @__PURE__ */ React.createElement("div", { className: "omniguide-skeleton__text omniguide-skeleton__text--price" })));
const SkeletonResults = () => {
  const t = useT();
  return /* @__PURE__ */ React.createElement("div", { style: { display: "flex", flexDirection: "column", gap: "32px" } }, /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("h3", { className: "omniguide-results__section-title" }, t("section.categories")), /* @__PURE__ */ React.createElement("div", { className: "omniguide-results__categories-grid" }, /* @__PURE__ */ React.createElement(CategoryPillSkeleton, null), /* @__PURE__ */ React.createElement(CategoryPillSkeleton, null), /* @__PURE__ */ React.createElement(CategoryPillSkeleton, null))), /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("h3", { className: "omniguide-results__section-title" }, t("section.products")), /* @__PURE__ */ React.createElement("div", { className: "omniguide-results__grid" }, /* @__PURE__ */ React.createElement(ProductCardSkeleton, null), /* @__PURE__ */ React.createElement(ProductCardSkeleton, null), /* @__PURE__ */ React.createElement(ProductCardSkeleton, null))));
};
const CategoryPills = ({ categories, onCategoryClick, messageId, queryContext, aiSearchStoreUrl }) => {
  const t = useT();
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
    t("results.seeMoreCount", { count: remainingCount })
  ));
};
const SeeMoreProductCard = ({ onClick, remainingCount }) => {
  const t = useT();
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
    /* @__PURE__ */ React.createElement("span", { className: "omniguide-product-card__see-more-text" }, t("results.seeMore")),
    /* @__PURE__ */ React.createElement("span", { className: "omniguide-product-card__see-more-count" }, "+", remainingCount)
  );
};
const SeeMoreBlogCard = ({ onClick, remainingCount }) => {
  const t = useT();
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
    /* @__PURE__ */ React.createElement("span", { className: "omniguide-blog-card__see-more-text" }, t("results.showMore")),
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
  zeroPriceDisplay,
  intent,
  relatedContentFirstForQuestions = true,
  titles: titleOverrides,
  onAnswerClick
}) => {
  const t = useT();
  const titles = {
    products: t("section.products"),
    categories: t("section.categories"),
    content: t("section.relatedContent"),
    ...titleOverrides
  };
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
  const productCard = (source) => {
    var _a, _b;
    return /* @__PURE__ */ React.createElement(
      SearchProductCard$1,
      {
        key: ((_a = source.data) == null ? void 0 : _a["entityId"]) || ((_b = source.data) == null ? void 0 : _b["id"]) || products.indexOf(source),
        product: source.data,
        index: products.indexOf(source),
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
  };
  const grouped = answerGroups(products);
  const groupedHidden = grouped ? grouped.reduce((n, g) => n + Math.max(0, g.cards.length - PRODUCTS_FIRST_ROW), 0) : 0;
  const visibleGroups = grouped && !showAllProducts ? grouped.map((g) => ({ ...g, cards: g.cards.slice(0, PRODUCTS_FIRST_ROW) })) : grouped;
  const productsBlock = products.length > 0 && /* @__PURE__ */ React.createElement("div", { key: "products" }, /* @__PURE__ */ React.createElement("h3", { className: "omniguide-results__section-title" }, titles.products), visibleGroups ? /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement(AnswerGroups, { groups: visibleGroups, onAnswerClick, renderCard: productCard, className: "omniguide-results__rail" }), groupedHidden > 0 && !showAllProducts && /* @__PURE__ */ React.createElement("div", { className: "omniguide-results__answer-group" }, /* @__PURE__ */ React.createElement("div", { className: "omniguide-results__rail" }, /* @__PURE__ */ React.createElement(SeeMoreProductCard, { onClick: () => setShowAllProducts(true), remainingCount: groupedHidden })))) : /* @__PURE__ */ React.createElement("div", { className: "omniguide-results__rail" }, visibleProducts.map(productCard), hasMoreProducts && !showAllProducts && /* @__PURE__ */ React.createElement(
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
  return /* @__PURE__ */ React.createElement("div", { className: "omniguide-results" }, /* @__PURE__ */ React.createElement("div", { className: "omniguide-results__content" }, isLoading ? /* @__PURE__ */ React.createElement(SkeletonResults, null) : !hasResults ? /* @__PURE__ */ React.createElement("div", { className: "omniguide-results__empty-state" }, /* @__PURE__ */ React.createElement("p", null, t("results.empty"))) : /* @__PURE__ */ React.createElement("div", { style: { display: "flex", flexDirection: "column", gap: "32px" } }, orderedBlocks)));
};
const MobileProductSkeleton = () => /* @__PURE__ */ React.createElement("div", { className: "omniguide-skeleton__card omniguide-skeleton" }, /* @__PURE__ */ React.createElement("div", { className: "omniguide-skeleton__image" }), /* @__PURE__ */ React.createElement("div", { className: "omniguide-skeleton__body" }, /* @__PURE__ */ React.createElement("div", { className: "omniguide-skeleton__text omniguide-skeleton__text--brand" }), /* @__PURE__ */ React.createElement("div", { className: "omniguide-skeleton__text omniguide-skeleton__text--title" }), /* @__PURE__ */ React.createElement("div", { className: "omniguide-skeleton__text omniguide-skeleton__text--price" })));
const LoadingOverlay = () => {
  const t = useT();
  return /* @__PURE__ */ React.createElement("div", { className: "omniguide-mobile-results__loading-overlay" }, /* @__PURE__ */ React.createElement("div", { className: "omniguide-mobile-results__loading-spinner" }, /* @__PURE__ */ React.createElement("svg", { width: "32", height: "32", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2" }, /* @__PURE__ */ React.createElement("circle", { cx: "12", cy: "12", r: "10", strokeOpacity: "0.25" }), /* @__PURE__ */ React.createElement("path", { d: "M12 2a10 10 0 0 1 10 10", strokeLinecap: "round" }, /* @__PURE__ */ React.createElement(
    "animateTransform",
    {
      attributeName: "transform",
      type: "rotate",
      from: "0 12 12",
      to: "360 12 12",
      dur: "1s",
      repeatCount: "indefinite"
    }
  ))), /* @__PURE__ */ React.createElement("span", null, t("results.loadingRecommendations"))));
};
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
  relatedContentFirstForQuestions = true,
  onAnswerClick
}) => {
  const t = useT();
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
      /* @__PURE__ */ React.createElement("p", null, t("results.askToSee"))
    );
  }
  const section = sections[currentSectionIndex];
  if (!section) {
    return /* @__PURE__ */ React.createElement("div", { className: "omniguide-results__empty-state", style: { height: "100%", padding: "32px" } }, /* @__PURE__ */ React.createElement("p", null, t("results.askToSee")));
  }
  const products = section.sources.filter((s) => s.type === "product" && s.data);
  const categories = section.sources.filter((s) => s.type === "category" && s.data);
  const content = section.sources.filter((s) => s.type === "content" && s.data);
  const displayQuestion = isLoading && currentQuestion ? currentQuestion : section.question;
  const productCard = (source) => {
    var _a, _b;
    return /* @__PURE__ */ React.createElement(
      SearchProductCard$1,
      {
        key: ((_a = source.data) == null ? void 0 : _a["entityId"]) || ((_b = source.data) == null ? void 0 : _b["id"]) || products.indexOf(source),
        product: source.data,
        index: products.indexOf(source),
        messageId: section.messageId,
        queryContext: section.queryContext,
        trackProductClick,
        aiSearchStoreUrl,
        fallbackImage: fallbackProductImage,
        showProductTags,
        zeroPriceDisplay
      }
    );
  };
  const grouped = answerGroups(products);
  const productsBlock = products.length > 0 && (grouped ? /* @__PURE__ */ React.createElement("div", { key: "products", className: "omniguide-mobile-results__answer-groups" }, /* @__PURE__ */ React.createElement(AnswerGroups, { groups: grouped, onAnswerClick, renderCard: productCard, className: "omniguide-mobile-results__grid" })) : /* @__PURE__ */ React.createElement("div", { key: "products", className: "omniguide-mobile-results__grid" }, products.map(productCard)));
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
const lockPageScroll = () => {
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
  useEffect(() => isLocked ? lockPageScroll() : void 0, [isLocked]);
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
  title: titleProp,
  subtitle: subtitleProp,
  searchIcon,
  anchored,
  anchorSelector,
  anchorMatchWidth,
  onAskAssistant,
  renderGuide: renderGuide2,
  renderGuideOffer: renderGuideOffer2,
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
  supportLabel: supportLabelProp,
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
  const t = useT();
  const supportLabel = t.withProp("search.supportLabel", supportLabelProp);
  const title = t.withProp("search.title", titleProp);
  const subtitle = t.withProp("search.subtitle", subtitleProp);
  const SearchChatPanel$1 = useComponent("SearchChatPanel", SearchChatPanel);
  const SearchResultsPanel$1 = useComponent("SearchResultsPanel", SearchResultsPanel);
  const SearchMobileResultsPanel$1 = useComponent("SearchMobileResultsPanel", SearchMobileResultsPanel);
  const SheetLogo = useComponent("SearchSheetLogo", SearchSheetLogo);
  const [isBottomSheetExpanded, setIsBottomSheetExpanded] = useState(true);
  const [closeButtonHovered, setCloseButtonHovered] = useState(false);
  const [liveQuery, setLiveQuery] = useState("");
  const [typeaheadJump, setTypeaheadJump] = useState(null);
  const [typedQuestion, setTypedQuestion] = useState(false);
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
  const [view, setView] = useState(null);
  const shownView = view ?? (messages.length > 0 ? "ask" : "search");
  const openGuide = typeof shownView === "object" ? shownView.guide : null;
  const guideView = sheetShell && !!openGuide && !!renderGuide2;
  const askView = sheetShell && shownView === "ask";
  const isCompactMode = sheetShell ? !askView : !inline && shownView === "search";
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
    setView(null);
    setFill(null);
  }, [isOpen]);
  const noConversation = messages.length === 0;
  useEffect(() => {
    if (!noConversation) return;
    setView(null);
    setFill(null);
  }, [noConversation]);
  useEffect(() => {
    if (!isOpen || !_query) return;
    fillQuery(_query);
    setView("search");
  }, [isOpen]);
  const newestLiveTurn = messages[0] && !messages[0].restored ? messages[0].id : null;
  const seenTurnRef = useRef(newestLiveTurn);
  useEffect(() => {
    if (newestLiveTurn && newestLiveTurn !== seenTurnRef.current) setView(null);
    seenTurnRef.current = newestLiveTurn;
  }, [newestLiveTurn]);
  const closeGuide = useCallback(() => setView("search"), []);
  const onFieldChange = useCallback((value) => {
    setLiveQuery(value);
    setView((v) => typeof v === "object" && v ? "search" : v);
  }, []);
  const backToSearch = useCallback(() => {
    setView("search");
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
      if (guideView) closeGuide();
      else if (askView) backToSearch();
      else onClose();
    };
    document.addEventListener("keydown", onKeyDown, true);
    return () => document.removeEventListener("keydown", onKeyDown, true);
  }, [isOpen, inline, onClose, askView, guideView, backToSearch, closeGuide]);
  const handleSendMessage = (content) => {
    setView("ask");
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
    setView("ask");
    onAskAssistant(content);
  };
  useEffect(() => {
    var _a2, _b2;
    const modal = modalRef.current;
    if (!sheetShell || !isOpen || !modal) return;
    if (guideView) {
      (_a2 = modal.querySelector(".omniguide-sheet__guide-view .omniguide-sheet__back")) == null ? void 0 : _a2.focus();
      return;
    }
    const active = document.activeElement;
    if (active && modal.contains(active) && !active.disabled) return;
    (_b2 = modal.querySelector(".omniguide-chat__input:not(:disabled)") ?? modal.querySelector(".omniguide-sheet__back")) == null ? void 0 : _b2.focus();
  }, [askView, guideView, isLoading]);
  const askDisabled = isLoading || ["connecting", "reconnecting", "disconnected"].includes(connectionStatus ?? "");
  const openAsk = () => {
    var _a2, _b2;
    const typed = liveQuery.trim();
    const lastAsked = (_b2 = (_a2 = qaPairs[qaPairs.length - 1]) == null ? void 0 : _a2.userMessage) == null ? void 0 : _b2.content;
    if (typed && typed !== lastAsked) askAssistant(typed);
    else setView("ask");
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
  const assistantName = t.withProp("search.askAssistant", assistantLabel);
  const searchInput = /* @__PURE__ */ React.createElement(
    SearchChatInput,
    {
      onSendMessage: handleSendMessage,
      onValueChange: onFieldChange,
      isLoading,
      isMobile: false,
      topSearch: true,
      jump: typeaheadJump,
      isQuestion: typedQuestion,
      onQuestionSubmit: askAssistant,
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
        "aria-label": t("search.dialogLabel")
      },
      inline && /* @__PURE__ */ React.createElement(
        "button",
        {
          type: "button",
          className: "omniguide-search-inline__close",
          onClick: onClose,
          "aria-label": t("common.close")
        },
        /* @__PURE__ */ React.createElement("svg", { width: "18", height: "18", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round" }, /* @__PURE__ */ React.createElement("line", { x1: "18", y1: "6", x2: "6", y2: "18" }), /* @__PURE__ */ React.createElement("line", { x1: "6", y1: "6", x2: "18", y2: "18" }))
      ),
      isCompactMode ? /* @__PURE__ */ React.createElement("div", { className: "omniguide-modal__searchbar" }, sheetActive && /* @__PURE__ */ React.createElement("div", { className: "omniguide-sheet__brand" }, /* @__PURE__ */ React.createElement(SheetLogo, { logo: sheetLogo })), sheetActive ? /* @__PURE__ */ React.createElement("div", { className: "omniguide-sheet__field" }, searchInput, /* @__PURE__ */ React.createElement("span", { className: "omniguide-sheet__or", "aria-hidden": "true" }, t("common.or")), /* @__PURE__ */ React.createElement("button", { type: "button", className: "omniguide-sheet__ask-open", onMouseDown: (e) => e.preventDefault(), onClick: openAsk, disabled: askDisabled }, /* @__PURE__ */ React.createElement("span", { className: "omniguide-sheet__spark", "aria-hidden": "true" }, /* @__PURE__ */ React.createElement(SparkleIcon, { size: 16 })), assistantName)) : searchInput, sheetActive ? /* @__PURE__ */ React.createElement("div", { className: "omniguide-sheet__corner" }, /* @__PURE__ */ React.createElement(SheetCloseButton, { onClose })) : /* @__PURE__ */ React.createElement(
        "button",
        {
          onClick: onClose,
          className: "omniguide-modal__close-btn omniguide-modal__close-btn--inline",
          "data-hovered": closeButtonHovered,
          onMouseEnter: () => setCloseButtonHovered(true),
          onMouseLeave: () => setCloseButtonHovered(false),
          "aria-label": t("search.closeSearch")
        },
        /* @__PURE__ */ React.createElement("svg", { width: "20", height: "20", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round" }, /* @__PURE__ */ React.createElement("line", { x1: "18", y1: "6", x2: "6", y2: "18" }), /* @__PURE__ */ React.createElement("line", { x1: "6", y1: "6", x2: "18", y2: "18" }))
      )) : null,
      isCompactMode && !sheetShell && messages.length > 0 && /* @__PURE__ */ React.createElement("div", { className: "omniguide-modal__resume" }, /* @__PURE__ */ React.createElement("button", { type: "button", className: "omniguide-modal__back-to-chat", onClick: () => setView("ask") }, /* @__PURE__ */ React.createElement("svg", { width: "14", height: "14", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", "aria-hidden": "true" }, /* @__PURE__ */ React.createElement("path", { d: "m12 19-7-7 7-7M19 12H5" })), t("search.backToConversation"))),
      isCompactMode ? null : askView ? /* @__PURE__ */ React.createElement("div", { className: "omniguide-modal__searchbar" }, /* @__PURE__ */ React.createElement("div", { className: "omniguide-sheet__brand" }, /* @__PURE__ */ React.createElement(SheetLogo, { logo: sheetLogo })), /* @__PURE__ */ React.createElement("div", { className: "omniguide-sheet__ask-title" }, /* @__PURE__ */ React.createElement("span", { className: "omniguide-sheet__spark omniguide-sheet__spark--lg", "aria-hidden": "true" }, /* @__PURE__ */ React.createElement(SparkleIcon, { size: 18 })), /* @__PURE__ */ React.createElement("h2", null, assistantName)), /* @__PURE__ */ React.createElement("div", { className: "omniguide-sheet__corner" }, /* @__PURE__ */ React.createElement("button", { type: "button", className: "omniguide-sheet__back", onClick: backToSearch }, /* @__PURE__ */ React.createElement("svg", { width: "16", height: "16", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", "aria-hidden": "true" }, /* @__PURE__ */ React.createElement("path", { d: "m12 19-7-7 7-7M19 12H5" })), t("search.backToSearch")), /* @__PURE__ */ React.createElement(SheetCloseButton, { onClose }))) : !inline && /* @__PURE__ */ React.createElement("div", { className: "omniguide-modal__header" }, /* @__PURE__ */ React.createElement("span", { className: "omniguide-modal__header-icon", "aria-hidden": "true" }, searchIcon || /* @__PURE__ */ React.createElement(DefaultAISearchIcon, null)), /* @__PURE__ */ React.createElement("div", { className: "omniguide-modal__header-titles" }, title && /* @__PURE__ */ React.createElement("h1", { className: "omniguide-modal__header-title" }, title), subtitle && /* @__PURE__ */ React.createElement("span", { className: "omniguide-modal__header-sub" }, subtitle)), /* @__PURE__ */ React.createElement("span", { className: "omniguide-modal__header-spacer" }), /* @__PURE__ */ React.createElement("span", { className: "omniguide-modal__header-pill" }, /* @__PURE__ */ React.createElement("span", { className: "omniguide-modal__header-led", "aria-hidden": "true" }), t("search.aiAssisted")), (supportHref || onOpenSupport) && (supportHref ? /* @__PURE__ */ React.createElement(
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
          "aria-label": t("search.closeSearch")
        },
        /* @__PURE__ */ React.createElement("svg", { width: "20", height: "20", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round" }, /* @__PURE__ */ React.createElement("line", { x1: "18", y1: "6", x2: "6", y2: "18" }), /* @__PURE__ */ React.createElement("line", { x1: "6", y1: "6", x2: "18", y2: "18" }))
      )),
      guideView && /* @__PURE__ */ React.createElement("div", { className: "omniguide-sheet__guide-view" }, /* @__PURE__ */ React.createElement("div", { className: "omniguide-sheet__guide-head" }, /* @__PURE__ */ React.createElement("button", { type: "button", className: "omniguide-sheet__back", onClick: closeGuide }, /* @__PURE__ */ React.createElement("svg", { width: "16", height: "16", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", "aria-hidden": "true" }, /* @__PURE__ */ React.createElement("path", { d: "m12 19-7-7 7-7M19 12H5" })), t("search.backToSearch")), /* @__PURE__ */ React.createElement("h2", { className: "omniguide-sheet__guide-title" }, t("search.findGuide", { subject: openGuide.name_plural }))), renderGuide2(openGuide, closeGuide)),
      /* @__PURE__ */ React.createElement("div", { className: "omniguide-split-panel", hidden: guideView }, askView && /* @__PURE__ */ React.createElement(
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
          onQuestionChange: setTypedQuestion,
          guideOffer: sheetShell && renderGuide2 && renderGuideOffer2 ? (guide) => renderGuideOffer2(guide, () => setView({ guide })) : void 0,
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
          askPlaceholder: askView ? t(messages.length > 0 ? "search.askFollowUp" : "search.askAnything") : void 0,
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
          titles: askView ? { products: t("search.recommended"), categories: t("search.shopByCategory"), content: t("search.guidesAndDocs") } : void 0,
          onAnswerClick: askDisabled ? void 0 : handleSendMessage
        }
      )),
      !inline && !isCompactMode && !guideView && /* @__PURE__ */ React.createElement("div", { className: "omniguide-modal__foot" }, /* @__PURE__ */ React.createElement("span", { className: "omniguide-modal__foot-note" }, t("search.verifyDetails")), askView && /* @__PURE__ */ React.createElement(SearchPrivacySettings, { ...privacySettingsProps, isMobile: false, onResetChat }))
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
      "aria-label": t("search.dialogLabel")
    },
    /* @__PURE__ */ React.createElement(
      "button",
      {
        onClick: onClose,
        className: "omniguide-modal__close-btn omniguide-modal__close-btn--mobile",
        "aria-label": t("search.closeSearch")
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
          relatedContentFirstForQuestions,
          onAnswerClick: askDisabled ? void 0 : handleSendMessage
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
          onQuestionChange: setTypedQuestion,
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
const SparkleIcon = ({ size }) => /* @__PURE__ */ React.createElement("svg", { width: size, height: size, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "1.75", strokeLinecap: "round", strokeLinejoin: "round" }, /* @__PURE__ */ React.createElement("path", { d: "M9.937 15.5A2 2 0 0 0 8.5 14.063l-6.135-1.582a.5.5 0 0 1 0-.962L8.5 9.936A2 2 0 0 0 9.937 8.5l1.582-6.135a.5.5 0 0 1 .963 0L14.063 8.5A2 2 0 0 0 15.5 9.937l6.135 1.581a.5.5 0 0 1 0 .964L15.5 14.063a2 2 0 0 0-1.437 1.437l-1.582 6.135a.5.5 0 0 1-.963 0z" }), /* @__PURE__ */ React.createElement("path", { d: "M20 3v4M22 5h-4" }));
const SheetCloseButton = ({ onClose }) => {
  const t = useT();
  return /* @__PURE__ */ React.createElement("button", { type: "button", className: "omniguide-sheet__close", onClick: onClose, "aria-label": t("search.closeSearch") }, /* @__PURE__ */ React.createElement("svg", { width: "20", height: "20", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", "aria-hidden": "true" }, /* @__PURE__ */ React.createElement("path", { d: "M18 6 6 18M6 6l12 12" })));
};
const SheetTurns = ({ questions, current, onPick }) => {
  const t = useT();
  return /* @__PURE__ */ React.createElement("nav", { className: "omniguide-sheet__turns", "aria-label": t("search.thisConversation") }, questions.some(Boolean) && /* @__PURE__ */ React.createElement("h4", { className: "omniguide-sheet__eyebrow" }, t("search.thisConversation")), questions.map((question, index) => question && // eslint-disable-next-line react/no-array-index-key -- turns are positional; a question can repeat
  /* @__PURE__ */ React.createElement("button", { key: index, type: "button", className: "omniguide-sheet__turn", "aria-current": index === current || void 0, onClick: () => onPick(index) }, question)));
};
const log$1 = createScopedLogger("useSessionInit");
function useSessionInit() {
  const { config, consentService, storageAdapter } = useOmniguideContext();
  const { apiBaseUrl, websiteId, callbacks, storageKeys } = config;
  const sessionStorageKey = (storageKeys == null ? void 0 : storageKeys.sessionId) ?? "aiSearchSessionId";
  const conversationStorageKey = (storageKeys == null ? void 0 : storageKeys.conversationId) ?? "aiSearchConversationId";
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
  const [resumableConversationId, setResumableConversationId] = useState(void 0);
  useEffect(() => {
    const initializeSession = async () => {
      var _a;
      if (callbacks == null ? void 0 : callbacks.waitForFeatureFlags) {
        await callbacks.waitForFeatureFlags();
      }
      if ((callbacks == null ? void 0 : callbacks.isFeatureEnabled) && !callbacks.isFeatureEnabled()) {
        setIsInitialized(true);
        return;
      }
      let resumable;
      try {
        const currentSessionId = localStorage.getItem(sessionStorageKey) ?? void 0;
        const conversationId = getConversationId(websiteId) ?? localStorage.getItem(conversationStorageKey) ?? void 0;
        const url = `${apiBaseUrl}${API_ENDPOINTS.CONVERSATIONAL_SEARCH_INIT}`;
        const response = await nativeFetch(url, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            website_code: websiteId,
            session_id: currentSessionId,
            current_page: getCurrentPage(),
            conversation_id: conversationId
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
            setRecognizedLocale(((_a = data.language) == null ? void 0 : _a.recognized) ?? null, localeMemory(config, storageAdapter));
            resumable = data.conversationResumable && conversationId ? conversationId : null;
            setFeatureStatus(websiteId, {
              aiDisabled: data.aiDisabled ?? false
            });
          }
        }
      } catch (error) {
        log$1.error("Failed to initialize session:", error);
        setFeatureStatus(websiteId, { aiDisabled: false });
      } finally {
        setResumableConversationId(resumable);
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
    isInitialized,
    resumableConversationId
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
const renderGuide = (guide, exit) => /* @__PURE__ */ React.createElement(BCCategoryRecommendations, { key: guide.product_type_id, guide, onExit: exit });
let resultsModalChunk;
const loadResultsModal = () => resultsModalChunk ?? (resultsModalChunk = import("./shared-DORzTfSC.js").catch((err) => {
  resultsModalChunk = void 0;
  throw err;
}));
const CarouselContainer = lazy(() => import("./shared-B_yf0PjW.js").then(
  (m) => ({ default: m.CarouselContainer }),
  (err) => {
    log.warn("Trending carousel failed to load; hiding the row", err);
    return { default: () => null };
  }
));
const SearchResultsModal = lazy(() => loadResultsModal().then(
  (m) => ({ default: m.SearchResultsModal }),
  (err) => {
    log.warn("Results modal failed to load; falling back to store search", err);
    return { default: StoreSearchFallback };
  }
));
function StoreSearchFallback({ initialQuery, onClose }) {
  const { platformAdapter } = useOmniguideContext();
  useEffect(() => {
    const searchPage = resolveSearchPage(platformAdapter);
    if (searchPage) safeNavigate(searchPage(initialQuery));
    else onClose();
  }, [initialQuery, platformAdapter, onClose]);
  return null;
}
function SearchGuideOffer({ guide, open }) {
  const t = useT();
  const copy = buildTeaserCopy(inlineTypeName(guide.name), "", void 0, t);
  return /* @__PURE__ */ React.createElement("div", { className: "omniguide" }, /* @__PURE__ */ React.createElement(QuestionnaireTeaser, { classPrefix: "omniguide-cr", ...copy, onExpand: open }));
}
const renderGuideOffer = (guide, open) => /* @__PURE__ */ React.createElement(SearchGuideOffer, { guide, open });
const SEARCH_HASH = "#!/search";
function BCSearchContainer() {
  var _a, _b, _c;
  const { config, platformAdapter, consentService } = useOmniguideContext();
  const searchPage = useMemo(() => resolveSearchPage(platformAdapter), [platformAdapter]);
  const SheetLogo = useComponent("SearchSheetLogo", SearchSheetLogo);
  const t = useT();
  const {
    websiteId,
    websiteCode,
    aiSearchStoreUrl,
    callbacks,
    consent,
    fallbackImages,
    ui
  } = config;
  const searchExamples = useLocalizedList(ui == null ? void 0 : ui.searchExampleQuestions);
  const popularTerms = useLocalizedList(ui == null ? void 0 : ui.searchPopularTerms);
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
  const { sessionId, welcomeText, seedQuestions, resumableConversationId } = useSessionInit();
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
    sessionId,
    persistTranscript: true,
    resumableConversationId
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
  const fastSearch = !!((ui == null ? void 0 : ui.typeahead) || (ui == null ? void 0 : ui.searchResultsModal));
  useEffect(() => {
    if (!(ui == null ? void 0 : ui.searchResultsModal)) return;
    loadResultsModal().catch((err) => log.warn("Results modal preload failed", err));
  }, [ui == null ? void 0 : ui.searchResultsModal]);
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
      (m) => m.role === "assistant" && Array.isArray(m.sources) && m.sources.some((s) => (s == null ? void 0 : s.type) === "product" && s.data)
    );
    if (!latest || latest.restored) return;
    const products = latest.sources.filter((s) => (s == null ? void 0 : s.type) === "product" && s.data).map((s) => {
      var _a2;
      const d = s.data;
      const brand = typeof d["brand"] === "object" ? (_a2 = d["brand"]) == null ? void 0 : _a2.name : d["product_line"] ?? d["brand"];
      return {
        sku: String(d["sku"] ?? d["id"] ?? d["entityId"] ?? ""),
        id: d["id"] ?? d["entityId"],
        name: d["name"] ?? d["display_name"],
        brand,
        url: d["url"] ?? d["path"],
        image_url: productImageUrl(d),
        price: d["price"],
        retail_price: d["originalPrice"] ?? d["retail_price"],
        rank: d["rank"]
      };
    }).filter((p2) => p2.sku || p2.name);
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
      } else if (searchPage) {
        safeNavigate(searchPage(searchQuery));
      } else {
        return;
      }
      setQuery("");
    },
    [query, isLoading, isConversational, sendMessage, setQuery, searchPage]
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
  const handleStoreSearch = useMemo(
    () => searchPage ? (searchQuery) => {
      safeNavigate(searchPage(searchQuery));
    } : void 0,
    [searchPage]
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
    const lastAsked = (_a2 = [...messages].reverse().find((m) => m.role === "user")) == null ? void 0 : _a2.content;
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
    (answerText, optionId, paramName, params) => {
      sendClarificationAnswer(answerText, String(optionId), paramName, params);
    },
    [sendClarificationAnswer]
  );
  const trendingRow = useMemo(() => {
    if (!(ui == null ? void 0 : ui.searchTrending)) return null;
    return /* @__PURE__ */ React.createElement("div", { className: "omniguide", "aria-live": "off" }, /* @__PURE__ */ React.createElement(Suspense, { fallback: null }, /* @__PURE__ */ React.createElement(
      CarouselContainer,
      {
        slot: "home_trending",
        label: t("search.trending"),
        apiBaseUrl: config.apiBaseUrl,
        websiteCode: websiteCode ?? websiteId,
        fallbackImage: fallbackImages == null ? void 0 : fallbackImages.product,
        showLoadingSkeleton: false,
        headingLevel: 5,
        getSessionId: () => sessionId ?? null
      }
    )));
  }, [
    ui == null ? void 0 : ui.searchTrending,
    t,
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
      renderGuide,
      renderGuideOffer,
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
      onModalOpen: handleModalOpen,
      onModalClose: handleModalClose,
      privacyPolicyUrl: (consent == null ? void 0 : consent.privacyPolicyUrl) ?? "/privacy-policy",
      defaultSearchExamples: searchExamples,
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
      popularTerms,
      currency: ui == null ? void 0 : ui.currency,
      sheetLogo: ui == null ? void 0 : ui.searchSheetLogo,
      onSeeAllResults: handleSeeAllResults,
      onSearchSubmit: fastSearch ? handleSeeAllResults : void 0,
      emptyStateFooter: trendingRow,
      hideMobileAskBox: ((_c = config.features) == null ? void 0 : _c.hideMobileAskBox) === true
    }
  ), resultsQuery !== null ? /* @__PURE__ */ React.createElement(Suspense, { fallback: null }, /* @__PURE__ */ React.createElement(
    SearchResultsModal,
    {
      apiBaseUrl: config.apiBaseUrl,
      origin: sanitizeUrl(getCurrentPage()) || void 0,
      initialQuery: resultsQuery,
      expandFrom: expandFromRef.current,
      onClose: closeResults,
      onAskAssistant: askFromResults,
      logo: /* @__PURE__ */ React.createElement(SheetLogo, { logo: ui == null ? void 0 : ui.searchSheetLogo }),
      sheet: !!(ui == null ? void 0 : ui.searchSheet),
      fallbackImage: fallbackImages == null ? void 0 : fallbackImages.product,
      currency: ui == null ? void 0 : ui.currency
    }
  )) : null);
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
  o as buildConfig,
  p as buildPlatformAdapter
};
