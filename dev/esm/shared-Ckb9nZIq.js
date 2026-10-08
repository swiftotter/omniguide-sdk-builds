import { d as API_ENDPOINTS, n as normalizeQuestions, aq as RestQuestionsResponseSchema, c as getCurrentPage } from "./shared-D0xOJ5Vk.js";
function pick(raw, keys) {
  for (const k of keys) {
    if (raw[k] !== void 0 && raw[k] !== null) return raw[k];
  }
  return void 0;
}
function pickString(raw, keys) {
  const v = pick(raw, keys);
  return typeof v === "string" && v.trim() ? v : void 0;
}
function pickNumber(raw, keys) {
  const v = pick(raw, keys);
  if (typeof v === "number" && Number.isFinite(v)) return v;
  if (typeof v === "string" && v.trim() && Number.isFinite(Number(v))) return Number(v);
  return void 0;
}
function pickBullets(raw, keys) {
  const v = pick(raw, keys);
  if (!Array.isArray(v)) return void 0;
  const out = v.map((item) => {
    if (typeof item === "string") return item.trim();
    if (item && typeof item === "object") {
      const o = item;
      const s = o["text"] ?? o["label"] ?? o["value"];
      return typeof s === "string" ? s.trim() : "";
    }
    return "";
  }).filter((s) => !!s);
  return out.length ? out : void 0;
}
function pickReasons(raw, keys) {
  const v = pick(raw, keys);
  if (!Array.isArray(v)) return void 0;
  const out = [];
  for (const item of v) {
    if (!item || typeof item !== "object") continue;
    const o = item;
    const label = o["label"] ?? o["k"] ?? o["key"] ?? o["name"];
    const value = o["value"] ?? o["v"] ?? o["text"];
    if (typeof label === "string" && typeof value === "string" && label.trim() && value.trim()) {
      out.push({ label: label.trim(), value: value.trim() });
    }
  }
  return out.length ? out : void 0;
}
function toMatchPct(raw) {
  return clampPct(raw > 0 && raw <= 1 ? raw * 100 : raw);
}
function normalizeMatchPct(raw) {
  const explicit = pickNumber(raw, ["match_pct", "matchPct", "match_percentage", "matchPercentage", "match_score", "pct", "percentage"]);
  if (explicit !== void 0) return clampPct(explicit > 1 ? explicit : explicit * 100);
  const score = pickNumber(raw, ["score"]);
  if (score === void 0) return void 0;
  return toMatchPct(score);
}
function clampPct(n) {
  return Math.max(0, Math.min(100, Math.round(n)));
}
function normalizeRecommendedProduct(raw) {
  const sku = pickString(raw, ["sku", "SKU"]) ?? "";
  const matchPct = normalizeMatchPct(raw);
  const rank = pickNumber(raw, ["rank"]);
  const summary = pickString(raw, ["summary", "why", "one_liner", "oneLiner", "headline", "statement"]);
  const bullets = pickBullets(raw, ["bullets", "why_bullets", "whyBullets", "highlights", "callouts"]);
  const detail = pickString(raw, ["detail", "why_more", "whyMore", "explanation", "details", "long_explanation"]);
  const reasons = pickReasons(raw, ["reasons", "tags", "attributes", "reason_tags", "reasonTags", "spec_highlights"]);
  return {
    ...raw,
    sku,
    ...matchPct !== void 0 ? { matchPct } : {},
    ...rank !== void 0 ? { rank } : {},
    ...summary !== void 0 ? { summary } : {},
    ...bullets !== void 0 ? { bullets } : {},
    ...detail !== void 0 ? { detail } : {},
    ...reasons !== void 0 ? { reasons } : {}
  };
}
function normalizeRecommendedProducts(raw) {
  if (!Array.isArray(raw)) return [];
  return raw.map((p) => normalizeRecommendedProduct(p ?? {}));
}
function formatPrice(value) {
  if (value === null || value === void 0 || value === "") return null;
  let numericPrice;
  if (typeof value === "number") {
    numericPrice = value;
  } else if (typeof value === "string") {
    numericPrice = parseFloat(value.replace("$", ""));
  } else {
    return null;
  }
  if (Number.isNaN(numericPrice)) return null;
  if (Number.isInteger(numericPrice)) {
    return `$${numericPrice}`;
  }
  return `$${numericPrice.toFixed(2)}`;
}
async function fetchProductQuestions(config, sku) {
  if (!sku) {
    return { questions: [] };
  }
  const currentPage = getCurrentPage();
  const params = new URLSearchParams({
    website_code: config.websiteId,
    sku,
    current_page: currentPage
  });
  const url = `${config.apiBaseUrl}${API_ENDPOINTS.PRODUCT_QUESTIONS}?${params}`;
  const response = await fetch(url, {
    method: "GET",
    headers: { "Content-Type": "application/json" }
  });
  if (!response.ok) {
    if (response.status === 404) {
      return { questions: [] };
    }
    throw new Error(`Failed to fetch product questions: ${response.statusText}`);
  }
  const raw = await response.json();
  const normalized = normalizeQuestions(raw);
  const validated = RestQuestionsResponseSchema.safeParse(normalized);
  return {
    ...raw,
    questions: validated.success ? validated.data : []
  };
}
async function fetchCategoryQuestions(config, categoryUrl) {
  const resolvedUrl = categoryUrl ?? (typeof window !== "undefined" ? window.location.pathname : "");
  const currentPage = getCurrentPage();
  const params = new URLSearchParams({
    website_code: config.websiteId,
    category_url: resolvedUrl,
    current_page: currentPage
  });
  const url = `${config.apiBaseUrl}${API_ENDPOINTS.CATEGORY_QUESTIONS}?${params}`;
  const response = await fetch(url, {
    method: "GET",
    headers: { "Content-Type": "application/json" }
  });
  if (!response.ok) {
    if (response.status === 404) {
      return { questions: [] };
    }
    throw new Error(`Failed to fetch category questions: ${response.statusText}`);
  }
  const raw = await response.json();
  const normalized = normalizeQuestions(raw);
  const validated = RestQuestionsResponseSchema.safeParse(normalized);
  return {
    ...raw,
    questions: validated.success ? validated.data : []
  };
}
export {
  fetchProductQuestions as a,
  fetchCategoryQuestions as b,
  clampPct as c,
  normalizeMatchPct as d,
  normalizeRecommendedProduct as e,
  formatPrice as f,
  normalizeRecommendedProducts as n,
  toMatchPct as t
};
//# sourceMappingURL=shared-Ckb9nZIq.js.map
