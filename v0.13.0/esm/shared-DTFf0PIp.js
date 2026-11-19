import { bu as objectType, bv as booleanType, bw as numberType, bx as arrayType, by as stringType, bz as unionType, bA as unknownType, bB as preprocessType } from "./shared-B8dgHFMk.js";
const NumOrString = unionType([numberType(), stringType()]);
const PriceLike = NumOrString.nullable().optional();
const PLPVariantImageSchema = objectType({
  variant_id: NumOrString.nullish(),
  sku: stringType().nullish(),
  url: stringType().nullish(),
  // The PDP with this swatch's variant preselected (SOI-2708); `url` is the photo.
  link_url: stringType().nullish(),
  alt_text: stringType().nullish(),
  variant_display_name: stringType().nullish()
}).passthrough();
const PLPFlagSchema = objectType({
  key: stringType().optional(),
  label: stringType().optional(),
  icon_url: stringType().nullable().optional(),
  color: stringType().nullable().optional()
}).passthrough();
const PLPRatingSchema = objectType({
  value: numberType().min(0).max(5),
  count: numberType().int().nonnegative().optional()
}).passthrough();
const PLPReviewsSchema = objectType({
  average_rating: NumOrString.nullable().optional().catch(null),
  review_count: NumOrString.nullable().optional().catch(null),
  summary: stringType().nullable().optional().catch(null)
}).passthrough();
const PLPBulkPricingTierSchema = objectType({
  min_qty: numberType().optional(),
  max_qty: numberType().nullable().optional(),
  price: PriceLike,
  type: stringType().optional()
}).passthrough();
const PLPProductSchema = objectType({
  id: NumOrString,
  sku: stringType().nullable().optional(),
  name: stringType().nullable().optional(),
  // Display-only brand / product-line label (e.g. "TRACT OPTICS"). Optional —
  // mirrors the carousel product schema; rendered above the name when present.
  brand: stringType().nullable().optional(),
  url: stringType().nullable().optional(),
  price: PriceLike,
  retail_price: PriceLike,
  sale_price: PriceLike,
  // The family's range across its variants ("From $min to $max"); equal for one price.
  min_price: PriceLike,
  max_price: PriceLike,
  image_url: stringType().nullable().optional(),
  alternate_image_url: stringType().nullable().optional(),
  variant_images: arrayType(PLPVariantImageSchema).default([]),
  flags: arrayType(PLPFlagSchema).default([]),
  bulk_pricing: arrayType(PLPBulkPricingTierSchema).default([]),
  pinned_position: numberType().nullable().optional(),
  use_case_ids: arrayType(numberType()).default([]),
  rating: PLPRatingSchema.nullable().optional(),
  reviews: PLPReviewsSchema.nullable().optional()
}).passthrough();
const PLPCategoryChildSchema = objectType({
  id: NumOrString,
  name: stringType().optional(),
  url: stringType().optional(),
  product_count: numberType().optional()
}).passthrough();
const PLPCategoryRedirectSchema = objectType({
  id: NumOrString,
  name: stringType().optional(),
  url: stringType().optional()
}).passthrough();
const PLPCategorySchema = objectType({
  id: NumOrString,
  name: stringType().optional(),
  description: stringType().nullable().optional(),
  children: arrayType(PLPCategoryChildSchema).default([]),
  redirect_to: PLPCategoryRedirectSchema.nullable().optional()
}).passthrough();
const PLPFacetValueSchema = objectType({
  value: unknownType().optional(),
  label: stringType().nullable().optional(),
  count: numberType().optional(),
  value_id: unionType([stringType(), numberType()]).nullable().optional(),
  // readable stand-in for value_id in a page URL; null when the label has no letters or digits (SOI-2709)
  slug: stringType().nullable().optional(),
  selected: booleanType().optional(),
  // price-range buckets
  min: numberType().nullable().optional(),
  max: numberType().nullable().optional(),
  currency_code: stringType().nullable().optional()
}).passthrough();
const PLPFacetSchema = objectType({
  key: stringType(),
  label: stringType().nullable().optional(),
  // type ∈ attribute | use_case | flag | price_range | rating | in_stock — kept loose
  type: stringType(),
  values: arrayType(PLPFacetValueSchema).default([])
}).passthrough();
const PLPPaginationSchema = objectType({
  next_cursor: stringType().nullable().optional(),
  prev_cursor: stringType().nullable().optional(),
  total_estimate: numberType().optional(),
  page_size: numberType().optional()
}).passthrough();
const PLPBrandSchema = objectType({
  id: NumOrString,
  name: stringType().optional(),
  url: stringType().nullable().optional()
}).passthrough();
function brandAsCategory(raw) {
  var _a;
  if (!raw || typeof raw !== "object") return raw;
  const body = raw;
  if (body.category != null || typeof ((_a = body.brand) == null ? void 0 : _a.name) !== "string") return raw;
  return { ...body, category: { id: "", name: body.brand.name, children: [] } };
}
const PLPResponseSchema = preprocessType(brandAsCategory, objectType({
  category: PLPCategorySchema,
  brand: PLPBrandSchema.nullable().optional(),
  products: arrayType(PLPProductSchema).default([]),
  facets: arrayType(PLPFacetSchema).default([]),
  pagination: PLPPaginationSchema.optional(),
  sort: stringType().nullable().optional(),
  applied_rule_ids: arrayType(numberType()).default([])
}).passthrough());
const FacetsValuesResponseSchema = objectType({
  facet_key: stringType().optional(),
  values: arrayType(PLPFacetValueSchema).default([]),
  total_estimate: numberType().optional(),
  has_more: booleanType().optional()
}).passthrough();
function narrowFacetValue(raw) {
  if (raw === null || raw === void 0) return null;
  if (typeof raw === "string" || typeof raw === "number" || typeof raw === "boolean") {
    return raw;
  }
  return null;
}
function resolveProductRating(product) {
  var _a, _b;
  const explicit = product == null ? void 0 : product.rating;
  if (explicit) return explicit.value > 0 ? explicit : null;
  const average = toFiniteNumber((_a = product == null ? void 0 : product.reviews) == null ? void 0 : _a.average_rating);
  if (average === null || average <= 0) return null;
  const value = Math.min(average, 5);
  const count = toFiniteNumber((_b = product == null ? void 0 : product.reviews) == null ? void 0 : _b.review_count);
  const whole = count === null ? 0 : Math.floor(count);
  return whole > 0 ? { value, count: whole } : { value };
}
function toFiniteNumber(value) {
  if (typeof value === "number") return Number.isFinite(value) ? value : null;
  if (typeof value === "string" && value.trim()) {
    const parsed = Number.parseFloat(value);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
}
export {
  FacetsValuesResponseSchema as F,
  PLPBrandSchema as P,
  PLPBulkPricingTierSchema as a,
  PLPCategorySchema as b,
  PLPFacetSchema as c,
  PLPFacetValueSchema as d,
  PLPFlagSchema as e,
  PLPPaginationSchema as f,
  PLPProductSchema as g,
  PLPRatingSchema as h,
  PLPResponseSchema as i,
  PLPReviewsSchema as j,
  PLPVariantImageSchema as k,
  narrowFacetValue as n,
  resolveProductRating as r
};
