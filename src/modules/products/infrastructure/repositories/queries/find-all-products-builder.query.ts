import { type SortDirection } from 'src/modules/shared/types/sort-direction';
import { type SortByOptions } from 'src/modules/products/application/models/sort-by-options';
import { type ProductFields } from 'src/modules/products/domain/product';
import { type ProductVariantFields } from 'src/modules/products/domain/product-variant';
import { type ProductVisibility } from 'src/modules/products/domain/product-visibility';
import { type ProductSalesStatus } from 'src/modules/products/domain/product-sales-status';
import type { FindAllProductsSearchOptions } from '../product.repository';
import { PlanCache } from './plan-cache';
import { normalizePagination } from 'src/modules/shared/utils/normalize-pagintation.util';

/**
 * FIND ALL PRODUCTS — runtime SQL compiler.
 *
 * One statement, five logical steps:
 *   1. JOIN      only what a filter/sort needs; every join yields at most ONE row
 *                per product, so products are never multiplied.
 *   2. FILTER    WHERE over products (+ EXISTS over variants/categories) → CTE `matched`.
 *   3. SORT      requested keys exposed as k0..kN, `id` as stable tie-breaker.
 *   4. PAGINATE  LIMIT/OFFSET over ids only → CTE `page`; COUNT(*) over `matched`.
 *   5. SELECT    attach cover image and variants to the page ids only, project the
 *                requested columns in the database, aggregate to one JSON array.
 *
 * Shape vs value: everything that changes the SQL text (which filters are present,
 * the sort, the requested field lists) is a *shape*; everything else is a bound
 * parameter. A plan is compiled once per shape and cached, so two requests that
 * differ only in values reuse the identical SQL string.
 *
 * Result (single row):
 *   products : [{ product: {...}, variants?: [{...}] }]  — in page order
 *   total    : matching products, ignoring pagination
 * `variants` exists only when at least one variant field was requested; an empty
 * array then means "requested, but none qualify".
 *
 * Safety: SQL text is assembled only from the whitelisted registries below; values
 * are never interpolated. Value validation (UUIDs, ranges, enums) belongs to the DTO.
 *
 * Extending:
 *   filter    → entry in FILTERS + option on the repository type.
 *   sort      → key in SortByOptions; the exhaustive Record<SortByOptions, SortDef>
 *               fails to compile until SORTS has an entry. If it needs a join, add
 *               it to JOINS and list it in `requires`.
 *   projection→ add to ProductFields / ProductVariantFields; the field name must
 *               equal the column name.
 */

/* -------------------------------------------------------------------------- */
/*                                  Constants                                 */
/* -------------------------------------------------------------------------- */

/** LRU cap. A safeguard against clients enumerating shapes; normal traffic never fills it. */
const PLAN_CACHE_MAX_ENTRIES = 2000;

/** Allowed identifier charset, checked before quoting (defense in depth, not the primary guard). */
const IDENTIFIER_PATTERN = /^[A-Za-z][A-Za-z0-9_]*$/;

/** Always projected for a product, regardless of the request. */
const PRODUCT_BASE_FIELDS = ['id', 'title', 'createdAt', 'updatedAt'] as const;
/** Always projected for a variant once any variant field is requested. */
const VARIANT_BASE_FIELDS = ['id', 'productId', 'createdAt', 'updatedAt'] as const;

/* -------------------------------------------------------------------------- */
/*                                Public types                                */
/* -------------------------------------------------------------------------- */

export class InvalidProductQueryError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'InvalidProductQueryError';
  }
}

export type BuiltProductQuery = {
  sql: string;
  parameters: unknown[];
  pagination: { page: number; limit: number };
};

/* -------------------------------------------------------------------------- */
/*                         Normalized (validated) options                     */
/* -------------------------------------------------------------------------- */

/** Relevance is only chosen implicitly (search without an explicit sort). */
type ResolvedSort = { kind: 'relevance' } | { kind: 'field'; field: SortByOptions; direction: SortDirection };

/**
 * The single object a plan reads from: it decides the shape *and* supplies every
 * bound value. Extractors are applied to this object at bind time, never at compile time.
 */
type NormalizedOptions = {
  readonly search?: string;
  readonly visibility?: ProductVisibility;
  readonly variantVisibility?: ProductVisibility;
  readonly salesStatus?: ProductSalesStatus;
  readonly brandId?: string;
  /** Present whenever a category object was passed; an empty `ids` list matches nothing. */
  readonly category?: { readonly ids: readonly string[]; readonly includeDescendants: boolean };
  readonly minPrice?: number;
  readonly maxPrice?: number;
  /** Optional product fields as supplied: order and duplicates are part of the cache key. */
  readonly productFields: readonly ProductFields[];
  /** Requested variant fields. Empty = variants are not touched for output at all. */
  readonly variantFields: readonly ProductVariantFields[];
  readonly sort: ResolvedSort;
  readonly page: number;
  readonly limit: number;
};

/* -------------------------------------------------------------------------- */
/*                                 Validation                                 */
/* -------------------------------------------------------------------------- */

/**
 * Resolves the request into a shape + value source. It applies defaults and maps
 * the category DTO; it does not validate values, because values are bound and can
 * only cause a database error, never injection.
 */
function normalizeOptions(raw: FindAllProductsSearchOptions): NormalizedOptions {
  const {
    search,
    visibility,
    variantVisibility,
    salesStatus,
    brandId,
    category: cat,
    minPrice,
    maxPrice,
    page,
    limit,
  } = raw;

  // Presence of the object activates the filter; `includeCategoryDescendants` picks its mode.
  let category: NormalizedOptions['category'] = cat
    ? {
        ids: cat?.categoryIds,
        includeDescendants: cat.includeCategoryDescendants === true,
      }
    : undefined;

  // Precedence: explicit sort > relevance (when searching) > newest first.
  const sort: ResolvedSort =
    raw.sort != null
      ? { kind: 'field', field: raw.sort.field, direction: raw.sort.direction }
      : search != null
        ? { kind: 'relevance' }
        : { kind: 'field', field: 'createdAt', direction: 'DESC' };

  return {
    search,
    visibility,
    variantVisibility,
    salesStatus,
    brandId,
    category,
    minPrice,
    maxPrice,
    productFields: raw.product ?? [],
    variantFields: raw.variant ?? [],
    sort,
    ...normalizePagination(page, limit), // { page, limit } with defaults applied
  };
}

/* -------------------------------------------------------------------------- */
/*                       SQL helpers and parameter binding                    */
/* -------------------------------------------------------------------------- */

/** Reads one bound value from the request. Stored in the plan, executed per request. */
type Extractor = (options: NormalizedOptions) => unknown;

/**
 * Allocates `$n` and, at the same moment, records where its value comes from.
 * Invariant: allocation order === parameter array order, so SQL and values cannot
 * drift apart. The SQL may reference placeholders out of order — that is legal.
 */
class SqlParams {
  private readonly extractors: Extractor[] = [];
  private readonly shared = new Map<string, string>();

  /** Binds a new value; returns its placeholder. */
  add(extract: Extractor): string {
    this.extractors.push(extract);
    return `$${this.extractors.length}`;
  }

  /**
   * Binds a value once per name and reuses the placeholder everywhere (e.g.
   * `variantVisibility` in the existence check, price aggregate and projection).
   */
  addShared(name: string, extract: Extractor): string {
    let placeholder = this.shared.get(name);
    if (placeholder === undefined) {
      placeholder = this.add(extract);
      this.shared.set(name, placeholder);
    }
    return placeholder;
  }

  build(): readonly Extractor[] {
    return [...this.extractors];
  }
}

/** Double-quotes a camelCase column name after a charset check. Called with constants only. */
function quote(identifier: string): string {
  if (!IDENTIFIER_PATTERN.test(identifier)) throw new Error(`Unsafe SQL identifier: ${identifier}`);
  return `"${identifier}"`;
}

/**
 * `'field', alias."field"` for jsonb_build_object: the JSON key equals the column name.
 * The key is interpolated as a literal, which is safe only because fields are whitelisted.
 */
function jsonPair(alias: string, field: string): string {
  return `'${field}', ${alias}.${quote(field)}`;
}

/**
 * `AND v."visibility" = $n`, or '' when unrestricted.
 * Requires the enclosing fragment to alias product_variants as `v`. Shared binding
 * keeps filtering, pricing and returned variants consistent with one bound value.
 */
function variantVisibilityPredicate(params: SqlParams, options: NormalizedOptions): string {
  if (options.variantVisibility === undefined) return '';
  const placeholder = params.addShared('variantVisibility', (o) => o.variantVisibility);
  return `AND v."visibility" = ${placeholder}`;
}

/* -------------------------------------------------------------------------- */
/*                         Step 1: joins (filter / sort)                      */
/* -------------------------------------------------------------------------- */

/** Keys of the joins a filter or sort can depend on. Future modules (ratings, stock) add here. */
type JoinKey = 'priceAgg';

/** Fixed emission order, so the SQL text does not depend on which dependency was seen first. */
const JOIN_ORDER: readonly JoinKey[] = ['priceAgg'];

const JOINS: Record<JoinKey, (params: SqlParams, options: NormalizedOptions) => string> = {
  /**
   * Lowest price among the variants the viewer may see (`pa.min_price`).
   * LATERAL aggregate → one row per product; LEFT → products without a qualifying
   * variant survive with NULL, which the price sort pushes last.
   */
  priceAgg: (params, options) => `LEFT JOIN LATERAL (
      SELECT MIN(v."price") AS min_price
      FROM product_variants v
      WHERE v."productId" = p.id ${variantVisibilityPredicate(params, options)}
    ) pa ON TRUE`,
};

/* -------------------------------------------------------------------------- */
/*                              Step 2: filters                               */
/* -------------------------------------------------------------------------- */

/**
 * One description per filter, used for both the cache key and the SQL — they
 * therefore cannot disagree.
 */
type FilterDef = {
  /** Label for readability; the cache key uses `shape`, not this. */
  readonly name: string;
  /** Joins that must exist before `where` runs. */
  readonly requires?: readonly JoinKey[];
  /** Whether the request activates this filter (presence, never the value). */
  active(options: NormalizedOptions): boolean;
  /** Cache-key token: must distinguish every SQL variant this filter can emit. */
  shape(options: NormalizedOptions): string;
  /** SQL fragment; allocates its placeholders here, in final parameter order. */
  where(params: SqlParams, options: NormalizedOptions): string;
};

/** Array order = WHERE order = placeholder allocation order. Keep it stable. */
const FILTERS: readonly FilterDef[] = [
  {
    // PGroonga full-text operator; one placeholder reused for both columns.
    name: 'search',
    active: (o) => o.search !== undefined,
    shape: () => 'search',
    where: (params) => {
      const term = params.add((o) => o.search);
      return `(p."title" &@ ${term} OR p."description" &@ ${term})`;
    },
  },
  {
    name: 'visibility',
    active: (o) => o.visibility !== undefined,
    shape: () => 'visibility',
    where: (params) => `p."visibility" = ${params.add((o) => o.visibility)}`,
  },
  {
    /**
     * Hides products with no variant the viewer may see (including products with
     * no variants at all). The same predicate is reused by the price aggregate,
     * the price filter and the variant projection, so everything stays consistent.
     */
    name: 'variantVisibility',
    active: (o) => o.variantVisibility !== undefined,
    shape: () => 'variantVisibility',
    where: (params, options) => `EXISTS (
        SELECT 1 FROM product_variants v
        WHERE v."productId" = p.id ${variantVisibilityPredicate(params, options)}
      )`,
  },
  {
    name: 'salesStatus',
    active: (o) => o.salesStatus !== undefined,
    shape: () => 'salesStatus',
    where: (params) => `p."salesStatus" = ${params.add((o) => o.salesStatus)}`,
  },
  {
    name: 'brand',
    active: (o) => o.brandId !== undefined,
    shape: () => 'brand',
    where: (params) => `p."brandId" = ${params.add((o) => o.brandId)}`,
  },
  {
    /**
     * EXISTS keeps the row count product-based. Descendants mode also matches
     * categories whose ancestor `path` overlaps the ids; the id array is bound once
     * and referenced twice. The two modes emit different SQL, hence two shapes.
     */
    name: 'category',
    active: (o) => o.category !== undefined,
    shape: (o) => (o.category?.includeDescendants ? 'category:descendants' : 'category:direct'),
    where: (params, options) => {
      const ids = params.add((o) => o.category?.ids);

      if (options.category?.includeDescendants) {
        return /*sql*/ `
        EXISTS (
          SELECT 1
          FROM product_categories pc
          JOIN categories c ON c.id = pc."categoryId"
          WHERE pc."productId" = p.id
            AND (c.id = ANY(${ids}::uuid[]) OR c.path && ${ids}::uuid[])
      )`;
      }

      return /*sql*/ `
      EXISTS (
        SELECT 1
        FROM product_categories pc
        WHERE pc."productId" = p.id
          AND pc."categoryId" = ANY(${ids}::uuid[])
      )`;
    },
  },
  {
    /**
     * Matches when at least one visible variant is inside the range. Min and max
     * are applied to the SAME variant row, so a cheap variant plus an expensive one
     * cannot fake a match. Uses its own EXISTS, so it needs no join.
     */
    name: 'price',
    active: (o) => o.minPrice !== undefined || o.maxPrice !== undefined,
    shape: (o) => `price:${o.minPrice !== undefined ? 'min' : ''}${o.maxPrice !== undefined ? 'max' : ''}`,
    where: (params, options) => {
      const conditions: string[] = [];
      if (options.minPrice !== undefined) conditions.push(`v."price" >= ${params.add((o) => o.minPrice)}`);
      if (options.maxPrice !== undefined) conditions.push(`v."price" <= ${params.add((o) => o.maxPrice)}`);

      return /*sql*/ `
      EXISTS (
        SELECT 1 FROM product_variants v
        WHERE v."productId" = p.id ${variantVisibilityPredicate(params, options)}
          AND ${conditions.join(' AND ')}
      )`;
    },
  },
];

/* -------------------------------------------------------------------------- */
/*                               Step 3: sorting                              */
/* -------------------------------------------------------------------------- */

/** One ORDER BY term. `expr` is a whitelisted expression, never user input. */
type SortKey = { expr: string; direction: SortDirection; nullsLast?: boolean };

type SortDef = {
  readonly requires: readonly JoinKey[];
  /** Ordered keys for the requested direction. */
  keys(direction: SortDirection): SortKey[];
};

/** Exhaustive over SortByOptions: a new sort name without an entry is a compile error. */
const SORTS: Record<SortByOptions, SortDef> = {
  createdAt: { requires: [], keys: (direction) => [{ expr: 'p."createdAt"', direction }] },
  updatedAt: { requires: [], keys: (direction) => [{ expr: 'p."updatedAt"', direction }] },
  title: { requires: [], keys: (direction) => [{ expr: 'p."title"', direction }] },
  price: {
    requires: ['priceAgg'],
    // Products with no visible variant price sort last in both directions.
    keys: (direction) => [{ expr: 'pa.min_price', direction, nullsLast: true }],
  },
};

type CompiledSort = {
  shape: string;
  requires: readonly JoinKey[];
  keys: SortKey[];
  /** Direction of the `id` tie-breaker; keeps paging stable when keys are equal. */
  tieBreaker: SortDirection;
};

function compileSort(sort: ResolvedSort): CompiledSort {
  if (sort.kind === 'relevance') {
    // pgroonga_score is only meaningful while the search filter is active;
    // createdAt then id keep the order deterministic for equal scores.
    return {
      shape: 'sort:relevance',
      requires: [],
      keys: [
        { expr: 'pgroonga_score(p.tableoid, p.ctid)', direction: 'DESC' },
        { expr: 'p."createdAt"', direction: 'DESC' },
      ],
      tieBreaker: 'DESC',
    };
  }
  const def = SORTS[sort.field];
  return {
    shape: `sort:${sort.field}:${sort.direction}`,
    requires: def.requires,
    keys: def.keys(sort.direction),
    tieBreaker: sort.direction,
  };
}

/**
 * ORDER BY over the k0..kN columns of the matched set (qualified, so they can never
 * clash with joined tables' columns). Applied twice: to pick the page, and again
 * inside jsonb_agg, because a join does not preserve the CTE's order.
 */
function orderBy(alias: string, sort: CompiledSort): string {
  const parts = sort.keys.map((key, i) => `${alias}.k${i} ${key.direction}${key.nullsLast ? ' NULLS LAST' : ''}`);
  parts.push(`${alias}.id ${sort.tieBreaker}`);
  return `ORDER BY ${parts.join(', ')}`;
}

/* -------------------------------------------------------------------------- */
/*                      Step 5: projection and aggregation                    */
/* -------------------------------------------------------------------------- */

/**
 * Product JSON: base fields + cover image id + requested fields. Only the image id
 * is returned (the storage key is enough to build a URL), so `images` is not joined.
 * Unrequested columns never leave the database.
 */
function productObject(options: NormalizedOptions): string {
  const pairs = [
    ...PRODUCT_BASE_FIELDS.map((field) => jsonPair('p', field)),
    // product_images.productId is unique → 1:1, safe as a plain LEFT JOIN.
    `'coverImageId', cover."imageId"`,
    ...options.productFields.map((field) => jsonPair('p', field)),
  ];
  return `jsonb_build_object(${pairs.join(', ')})`;
}

/** Variant JSON: base fields + requested fields. Keep the pair count well under ~50. */

function variantObject(options: NormalizedOptions): string {
  const pairs = [...VARIANT_BASE_FIELDS, ...options.variantFields].map((field) => jsonPair('v', field));
  return `jsonb_build_object(${pairs.join(', ')})`;
}

/* -------------------------------------------------------------------------- */
/*                                 Compilation                                */
/* -------------------------------------------------------------------------- */

/** Value-independent, immutable, reusable across requests of the same shape. */
type CompiledPlan = {
  readonly sql: string;
  /** extractors[n] supplies `$n+1`. */
  readonly extractors: readonly Extractor[];
};

/**
 * Cache key: every dimension that changes the SQL text, no values. Derived from the
 * same registries as the SQL, so key and statement cannot disagree.
 */
function shapeKey(options: NormalizedOptions, sort: CompiledSort): string {
  const filters = FILTERS.filter((f) => f.active(options)).map((f) => f.shape(options));
  return [
    `f=${filters.join(',')}`,
    sort.shape,
    `p=${options.productFields.join(',')}`,
    `v=${options.variantFields.join(',')}`,
  ].join('|');
}

/** Builds the statement and, as a side effect, the ordered extractors for its placeholders. */
function compile(options: NormalizedOptions, sort: CompiledSort): CompiledPlan {
  const params = new SqlParams();
  // collect active or provided filters.
  const activeFilters = FILTERS.filter((f) => f.active(options));

  // Step 1: union of the joins required by the sort and by the active filters.
  const required = new Set<JoinKey>(sort.requires);
  for (const filter of activeFilters) filter.requires?.forEach((key) => required.add(key));

  // Emitted first, so join placeholders precede filter placeholders in the array.
  const joins = JOIN_ORDER.filter((key) => required.has(key)).map((key) => JOINS[key](params, options));

  // Step 2: filters.
  const conditions = activeFilters.map((filter) => filter.where(params, options));
  const where = conditions.length ? `WHERE ${conditions.join('\n      AND ')}` : '';

  // Step 3: expose the sort keys as k0..kN on the matched set.
  const sortColumns = sort.keys.map((key, i) => `, ${key.expr} AS k${i}`).join('');

  // Step 4: pagination over bare ids (+ sort keys), so limit/offset count products.
  const limit = params.add((o) => o.limit);
  const offset = params.add((o) => (o.page - 1) * o.limit);

  // Step 5: projection and aggregation, for the page ids only.
  const withVariants = options.variantFields.length > 0;
  const item = withVariants
    ? `jsonb_build_object(
          'product', ${productObject(options)},
          'variants', COALESCE(vs.variants, '[]'::jsonb)
        )`
    : `jsonb_build_object('product', ${productObject(options)})`;

  // LATERAL aggregate → one row per product; jsonb_agg over zero rows is NULL, hence
  // COALESCE to []. Order by v.id (UUIDv7 = creation order); `sortOrder` is a UI concern.
  const variantJoin = withVariants
    ? `LEFT JOIN LATERAL (
        SELECT jsonb_agg(${variantObject(options)} ORDER BY v.id) AS variants
        FROM product_variants v
        WHERE v."productId" = p.id ${variantVisibilityPredicate(params, options)}
      ) vs ON TRUE`
    : '';

  // `matched` is referenced twice (page + count), so it is materialized once.
  // The count is separate from the page: an out-of-range page still reports the total.
  const sql = /*sql*/ `
    WITH matched AS (
      SELECT p.id${sortColumns}
      FROM products p
      ${joins.join('\n      ')}
      ${where}
    ),
    page AS (
      SELECT m.*
      FROM matched m
      ${orderBy('m', sort)}
      LIMIT ${limit} OFFSET ${offset}
    )
    SELECT
      COALESCE(
        (
          SELECT jsonb_agg(
            ${item}
            ${orderBy('pg', sort)}
          )
          FROM page pg
          JOIN products p ON p.id = pg.id
          LEFT JOIN product_images cover ON cover."productId" = p.id
          ${variantJoin}
        ),
        '[]'::jsonb
      ) AS products,
      (SELECT COUNT(*) FROM matched)::int AS total
  `;

  return Object.freeze({ sql, extractors: Object.freeze(params.build()) });
}

/* -------------------------------------------------------------------------- */
/*                                 Plan cache                                 */
/* -------------------------------------------------------------------------- */

/**
 * Plans are derived from code + shape only, so they never go stale; they live until
 * restart. `get → compile → set` is fully synchronous (no `await`), so requests
 * cannot interleave inside one Node process. Keep it that way.
 */
const PLAN_CACHE = new PlanCache<CompiledPlan>(PLAN_CACHE_MAX_ENTRIES);

function getPlan(options: NormalizedOptions): CompiledPlan {
  const sort = compileSort(options.sort); // needed for the key, not only for the SQL
  const key = shapeKey(options, sort);

  let plan = PLAN_CACHE.get(key);
  if (plan === undefined) {
    plan = compile(options, sort);
    PLAN_CACHE.set(key, plan);
  }
  return plan;
}

/* -------------------------------------------------------------------------- */
/*                            Product query builder                           */
/* -------------------------------------------------------------------------- */

/**
 * Public entry point: resolve → get/compile plan → bind this request's values.
 * Only the binding step is per-value work; the SQL text is shared across requests
 * of the same shape.
 *
 * Visibility is the caller's responsibility, through two independent options:
 *   visibility        filters products by their own visibility;
 *   variantVisibility restricts which variants are counted, priced and returned,
 *                     and hides products left with none.
 * The customer service must force both to 'public' after spreading the DTO.
 */
export class FindAllProductsQueryBuilder {
  constructor(private readonly options: FindAllProductsSearchOptions) {}

  build(): BuiltProductQuery {
    const normalized = normalizeOptions(this.options);
    const plan = getPlan(normalized);

    return {
      sql: plan.sql,
      parameters: plan.extractors.map((extract) => extract(normalized)),
      pagination: { page: normalized.page, limit: normalized.limit },
    };
  }
}
