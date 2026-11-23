import { c as createScopedLogger } from "./shared-CcHKcuJS.js";
import { b7 as objectType, bb as stringType, ba as arrayType, b9 as numberType, bf as enumType, bg as literalType, bc as unionType, b8 as booleanType } from "./shared-B1REdlek.js";
const log = createScopedLogger("CarouselSchema");
const warnedFields = /* @__PURE__ */ new Set();
function lenient(field, schema) {
  return schema.nullable().optional().catch((ctx) => {
    if (!warnedFields.has(field)) {
      warnedFields.add(field);
      log.warn(`Carousel field "${field}" did not match its schema; rendering without it`, ctx.error.issues);
    }
    return null;
  });
}
const NumOrString = unionType([numberType(), stringType()]);
const CarouselPriceObjectSchema = objectType({
  amount: unionType([stringType(), numberType()]),
  // Nullable, not just optional: the backend hard-codes "USD" today, but
  // `_price_payload` is commented to swap in `website_currency()`, which
  // returns None for a tenant with no currency configured — that would
  // serialize as `"currency": null` and, under a bare `.optional()`, reject
  // the whole carousel. `CarouselCardProps.defaultCurrency` exists precisely
  // to cover a missing currency, so the schema must let null reach it.
  currency: stringType().nullable().optional(),
  // When true, the amount is the min over variants (different sizes /
  // colors / configurations) rather than a single fixed price — UI
  // renders a "Starting at" prefix. Backend doesn't emit this for any
  // tenant yet; SDK accepts it so the contract is forward-compatible.
  from: booleanType().optional()
}).passthrough();
const CarouselPriceSchema = unionType([
  stringType(),
  numberType(),
  CarouselPriceObjectSchema
]);
const CarouselSlotProductSchema = objectType({
  sku: stringType(),
  title: stringType().nullable().optional(),
  image_url: stringType().nullable().optional(),
  url: stringType().nullable().optional(),
  price: CarouselPriceSchema.nullable().optional(),
  // Display-only brand label (e.g., "TRACT OPTICS"). Optional — backend
  // populates when product feed carries it; tile gracefully omits otherwise.
  brand: stringType().nullable().optional(),
  // Compare-at / strike-through price for sale items. Same shape as `price`.
  compare_at_price: CarouselPriceSchema.nullable().optional(),
  // SOI-2622 display fields (see `lenient`). `retail_price > price` is the
  // per-card sale signal; `on_sale` is a family-wide hint (any variant discounted).
  retail_price: lenient("retail_price", CarouselPriceSchema),
  // Parsed for completeness, not rendered: `price` already IS the paid price.
  sale_price: lenient("sale_price", CarouselPriceSchema),
  // Equal on a single-priced product; `min < max` is the cue for "from $min".
  min_price: lenient("min_price", CarouselPriceSchema),
  max_price: lenient("max_price", CarouselPriceSchema),
  on_sale: lenient("on_sale", booleanType()),
  // Family totals by design: a variant shows its family's rating.
  reviews: lenient("reviews", objectType({
    average_rating: NumOrString.nullable().optional(),
    review_count: NumOrString.nullable().optional(),
    summary: stringType().nullable().optional()
  }).passthrough())
}).passthrough();
const CarouselNarrativeSchema = objectType({
  variant_id: stringType().default("default"),
  headline: stringType().nullable().optional(),
  body: stringType().nullable().optional(),
  hash: stringType().nullable().optional()
}).passthrough();
const CarouselSlotScoringSchema = objectType({
  served_propensity: numberType().optional(),
  exploration: booleanType().optional(),
  raw_score: numberType().nullable().optional()
}).passthrough();
const CarouselSlotPinSchema = objectType({
  rule_id: numberType().nullable().optional(),
  reason: stringType().nullable().optional()
}).passthrough();
const CarouselSlotSchema = objectType({
  position: numberType(),
  product: CarouselSlotProductSchema,
  narrative: CarouselNarrativeSchema.nullable(),
  scoring: CarouselSlotScoringSchema.optional(),
  // source ∈ fbt | ymal | trending | pinned_rule | pinned_forced — kept loose
  source: stringType().optional(),
  pin: CarouselSlotPinSchema.nullable().optional(),
  // Why this product is on the rail (pin reason or graph edge). Never generated;
  // the card shows it when `narrative` is null. Null on trending cards.
  match_reason: lenient("match_reason", stringType())
}).passthrough();
const CarouselAnchorSchema = objectType({
  type: stringType(),
  // 'sku' | 'tenant' | 'category' | 'page_type'
  value: stringType().nullable().optional()
}).passthrough();
const CarouselCacheSchema = objectType({
  key: stringType().nullable().optional(),
  ttl_seconds: numberType().optional(),
  expires_at: stringType().nullable().optional()
}).passthrough();
const CarouselResponseSchema = objectType({
  carousel_id: stringType(),
  website_code: stringType(),
  slot_code: stringType(),
  strategy: stringType(),
  anchor: CarouselAnchorSchema,
  policy_snapshot_id: stringType().optional(),
  model_version: stringType().optional(),
  slots: arrayType(CarouselSlotSchema).default([]),
  cache: CarouselCacheSchema.optional()
}).passthrough();
const CarouselNotAvailableSchema = objectType({
  status: literalType("not_available"),
  // Backend model is `reason: Optional[str] = None` (CarouselResponsePayload),
  // and it does not serialize with `exclude_none` — a not-available body with
  // no machine reason ships `"reason": null`, which a bare `.optional()`
  // rejects. Observed as an explicit null on real 200 bodies.
  reason: stringType().nullable().optional()
}).passthrough();
const CarouselEventItemSchema = objectType({
  item_id: stringType(),
  index: numberType().optional(),
  quantity: numberType().optional(),
  price: NumOrString.optional()
}).passthrough();
const CarouselEventSchema = objectType({
  event_name: enumType(["view_item_list", "select_item", "select_promotion", "add_to_cart", "purchase"]),
  carousel_id: stringType(),
  item_list_id: stringType().optional(),
  items: arrayType(CarouselEventItemSchema).default([]),
  timestamp: stringType(),
  session_id: stringType(),
  page_url: stringType()
}).passthrough();
const CarouselEventBatchSchema = objectType({
  website_code: stringType(),
  events: arrayType(CarouselEventSchema).default([])
}).passthrough();
export {
  CarouselAnchorSchema as C,
  CarouselEventBatchSchema as a,
  CarouselEventItemSchema as b,
  CarouselEventSchema as c,
  CarouselNarrativeSchema as d,
  CarouselNotAvailableSchema as e,
  CarouselPriceSchema as f,
  CarouselResponseSchema as g,
  CarouselSlotPinSchema as h,
  CarouselSlotProductSchema as i,
  CarouselSlotSchema as j,
  CarouselSlotScoringSchema as k
};
