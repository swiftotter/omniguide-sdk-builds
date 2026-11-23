import { jsx, jsxs } from "react/jsx-runtime";
import { memo } from "react";
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
export {
  ProductTileRating as P
};
