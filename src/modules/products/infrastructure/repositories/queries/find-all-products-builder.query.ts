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
 * FIND ALL PRODUCTS: runtime SQL generator
 * ========================================
 *
 * The generated statement has five logical steps:
 *
 * 1. JOIN      Only the joins needed to filter or sort (e.g. the lowest visible
 *              variant price when sorting by price). Every join here yields at
 *              most ONE row per product, so products are never multiplied.
 * 2. FILTER    WHERE conditions over products (and EXISTS over variants,
 *              categories). Result: CTE `matched` (one row per product).
 * 3. SORT      Order by the requested key(s) with `id` as a stable tie-breaker.
 * 4. PAGINATE  LIMIT/OFFSET over bare product ids (CTE `page`), so the page size
 *              and the total count are always in products, never in joined rows.
 * 5. SELECT    Attach the cover image id and (optionally) the variants to the
 *              ids of the page only, project the requested fields at the
 *              database level and aggregate everything into one JSON array.
 *
 * The statement is compiled at runtime from small registries (filters, sorts,
 * joins, projections), validated strictly, and cached per request *shape*
 * (never per value) in a bounded LRU. Values are always bound parameters; SQL
 * text is only ever assembled from whitelisted identifiers.
 *
 * Result row (one row per query):
 *   products : [{ product: {...}, variants?: [{...}] }]   (page order)
 *   total    : number of matching products (ignores pagination)
 *
 * `variants` is present only when at least one variant field was requested.
 *
 * How to extend:
 * - New filter: add an entry to FILTERS (and an option to the repository type).
 * - New sort (rating, quantity...): add the key to SORT_BY_OPTIONS; the
 *   exhaustive `Record<SortByOptions, SortDef>` fails to compile until a SORTS
 *   entry exists. If the sort needs a join, add it to JOINS and list it in
 *   `requires`.
 * - New projected column: add it to PRODUCT_FIELDS / PRODUCT_VARIANT_FIELDS.
 *   The column name must equal the field name.
 */

/* -------------------------------------------------------------------------- */
/*                                  Constants                                 */
/* -------------------------------------------------------------------------- */

/** Upper bound of cached request shapes. Normal traffic never reaches it. */
const PLAN_CACHE_MAX_ENTRIES = 2000;

const IDENTIFIER_PATTERN = /^[A-Za-z][A-Za-z0-9_]*$/;

/** Fields that are always returned for a product. */
const PRODUCT_BASE_FIELDS = ['id', 'title', 'createdAt', 'updatedAt'] as const;
/** Fields that are always returned for a variant once any variant field is requested. */
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
/*                         Normalized (validated) options                      */
/* -------------------------------------------------------------------------- */

type ResolvedSort = { kind: 'relevance' } | { kind: 'field'; field: SortByOptions; direction: SortDirection };

type NormalizedOptions = {
  readonly search?: string;
  readonly visibility?: ProductVisibility;
  readonly variantVisibility?: ProductVisibility;
  readonly salesStatus?: ProductSalesStatus;
  readonly brandId?: string;
  readonly category?: { readonly ids: readonly string[]; readonly includeDescendants: boolean };
  readonly minPrice?: number;
  readonly maxPrice?: number;
  /** Optional product fields in canonical order, de-duplicated. */
  readonly productFields: readonly ProductFields[];
  /** Requested variant fields in canonical order, de-duplicated. Empty = no variants. */
  readonly variantFields: readonly ProductVariantFields[];
  readonly sort: ResolvedSort;
  readonly page: number;
  readonly limit: number;
};

/* -------------------------------------------------------------------------- */
/*                                 Validation                                 */
/* -------------------------------------------------------------------------- */

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

  // category: an empty id list means "no category filter".
  let category: NormalizedOptions['category'] = cat
    ? {
        ids: cat?.categoryIds,
        includeDescendants: cat.includeCategoryDescendants === true,
      }
    : undefined;

  // Sorting: explicit sort wins; otherwise relevance when searching, else newest first.
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
    ...normalizePagination(page, limit), // returns { page, limit } object
  };
}

/* -------------------------------------------------------------------------- */
/*                       SQL helpers and parameter binding                    */
/* -------------------------------------------------------------------------- */

type Extractor = (options: NormalizedOptions) => unknown;

/**
 * Allocates `$n` placeholders and records, at the same moment, how to read the
 * matching value from a request. SQL text and parameter array therefore cannot
 * drift apart, which removes the "keep the order in sync by hand" problem.
 */
class SqlParams {
  private readonly extractors: Extractor[] = [];
  private readonly shared = new Map<string, string>();

  /** Binds a new value and returns its placeholder. */
  add(extract: Extractor): string {
    this.extractors.push(extract);
    return `$${this.extractors.length}`;
  }

  /**
   *  Binds a value once and reuses the same placeholder for every later use.
   *  a query may needs to use same placeholder for example $1 in many query fragments.
   *
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

/** Defense in depth: identifiers come from whitelists, but are verified anyway. */
function quote(identifier: string): string {
  if (!IDENTIFIER_PATTERN.test(identifier)) throw new Error(`Unsafe SQL identifier: ${identifier}`);
  return `"${identifier}"`;
}

/** `'field', alias."field"` pair for jsonb_build_object. */
function jsonPair(alias: string, field: string): string {
  return `'${field}', ${alias}.${quote(field)}`;
}

/** `AND v."visibility" = $n` when variants must be restricted, else ''. */
function variantVisibilityPredicate(params: SqlParams, options: NormalizedOptions): string {
  if (options.variantVisibility === undefined) return '';
  const placeholder = params.addShared('variantVisibility', (o) => o.variantVisibility);
  return `AND v."visibility" = ${placeholder}`;
}

/* -------------------------------------------------------------------------- */
/*                         Step 1: joins (filter / sort)                      */
/* -------------------------------------------------------------------------- */

/**
 * Joins that filters or sorts may require. Each one must produce at most one
 * row per product (LATERAL aggregate), so pagination stays product-based.
 * Future modules (ratings, stock...) add their join here.
 */
type JoinKey = 'priceAgg';

const JOIN_ORDER: readonly JoinKey[] = ['priceAgg'];

const JOINS: Record<JoinKey, (params: SqlParams, options: NormalizedOptions) => string> = {
  /** Lowest price among the variants the viewer is allowed to see. */
  priceAgg: (params, options) => `LEFT JOIN LATERAL (
      SELECT MIN(v."price") AS min_price
      FROM product_variants v
      WHERE v."productId" = p.id ${variantVisibilityPredicate(params, options)}
    ) pa ON TRUE`,
};

/* -------------------------------------------------------------------------- */
/*                              Step 2: filters                               */
/* -------------------------------------------------------------------------- */

type FilterDef = {
  readonly name: string;
  readonly requires?: readonly JoinKey[];
  /** True when the request activates this filter. */
  active(options: NormalizedOptions): boolean;
  /** Contribution to the cache key: everything that changes the SQL text, never values. */
  shape(options: NormalizedOptions): string;
  where(params: SqlParams, options: NormalizedOptions): string;
};

const FILTERS: readonly FilterDef[] = [
  {
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
     * Restricts which variants the viewer may see, and hides products that
     * have no such variant (e.g. customers never see products whose variants
     * are all private). Also applied to variant aggregates and the variant
     * projection, so price filtering, price sorting and the returned variants
     * are consistent.
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
     * A product matches when at least one variant the viewer may see has a
     * price inside the requested range. Min and max apply to the SAME variant.
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

type SortKey = { expr: string; direction: SortDirection; nullsLast?: boolean };

type SortDef = {
  readonly requires: readonly JoinKey[];
  keys(direction: SortDirection): SortKey[];
};

/**
 * Exhaustive over SORT_BY_OPTIONS: adding an option without an entry here is a
 * compile error. (`rating` / `quantity` will be added with their modules.)
 */
const SORTS: Record<SortByOptions, SortDef> = {
  createdAt: { requires: [], keys: (direction) => [{ expr: 'p."createdAt"', direction }] },
  updatedAt: { requires: [], keys: (direction) => [{ expr: 'p."updatedAt"', direction }] },
  title: { requires: [], keys: (direction) => [{ expr: 'p."title"', direction }] },
  price: {
    requires: ['priceAgg'],
    // Products without a visible variant price sort last in both directions.
    keys: (direction) => [{ expr: 'pa.min_price', direction, nullsLast: true }],
  },
};

type CompiledSort = {
  shape: string;
  requires: readonly JoinKey[];
  keys: SortKey[];
  tieBreaker: SortDirection;
};

function compileSort(sort: ResolvedSort): CompiledSort {
  if (sort.kind === 'relevance') {
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
  // `def.requires` will be empty array for any field that isnt `JoinKey` element
  const def = SORTS[sort.field];
  return {
    shape: `sort:${sort.field}:${sort.direction}`,
    requires: def.requires,
    keys: def.keys(sort.direction),
    tieBreaker: sort.direction,
  };
}

/** ORDER BY over the sort columns exposed by the `matched` CTE (k0, k1, ..., id). */
function orderBy(alias: string, sort: CompiledSort): string {
  const parts = sort.keys.map((key, i) => `${alias}.k${i} ${key.direction}${key.nullsLast ? ' NULLS LAST' : ''}`);
  parts.push(`${alias}.id ${sort.tieBreaker}`);
  return `ORDER BY ${parts.join(', ')}`;
}

/* -------------------------------------------------------------------------- */
/*                      Step 5: projection and aggregation                    */
/* -------------------------------------------------------------------------- */

/**
 *  used to construct products fields
 */
function productObject(options: NormalizedOptions): string {
  const pairs = [
    ...PRODUCT_BASE_FIELDS.map((field) => jsonPair('p', field)),
    // `product_images.productId` is unique, so this is a 1:1 relation.
    `'coverImageId', cover."imageId"`,
    ...options.productFields.map((field) => jsonPair('p', field)),
  ];
  return `jsonb_build_object(${pairs.join(', ')})`;
}

/**
 *  used to construct product variants fields
 */
function variantObject(options: NormalizedOptions): string {
  const pairs = [...VARIANT_BASE_FIELDS, ...options.variantFields].map((field) => jsonPair('v', field));
  return `jsonb_build_object(${pairs.join(', ')})`;
}

/* -------------------------------------------------------------------------- */
/*                                 Compilation                                */
/* -------------------------------------------------------------------------- */

type CompiledPlan = {
  readonly sql: string;
  readonly extractors: readonly Extractor[];
};

/**
 * Cache key: every dimension that changes the SQL text, none of the values.
 * Built from the same registries as the SQL, so key and SQL cannot disagree.
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

function compile(options: NormalizedOptions, sort: CompiledSort): CompiledPlan {
  const params = new SqlParams();
  // collect active or provided filters.
  const activeFilters = FILTERS.filter((f) => f.active(options));

  // Step 1: joins required by the active filters and the sort.
  const required = new Set<JoinKey>(sort.requires);
  for (const filter of activeFilters) filter.requires?.forEach((key) => required.add(key));
  // iterates over conditions that requires joins in order to be checked, then if the input `required` includes any of the join keys, it then takes care of calling the appropriate join query and provide it the `params` and `options` values.
  const joins = JOIN_ORDER.filter((key) => required.has(key)).map((key) => JOINS[key](params, options));

  // Step 2: filters.
  const conditions = activeFilters.map((filter) => filter.where(params, options));
  const where = conditions.length ? `WHERE ${conditions.join('\n      AND ')}` : '';

  // Step 3: sort columns exposed by the matched set.
  const sortColumns = sort.keys.map((key, i) => `, ${key.expr} AS k${i}`).join('');

  // Step 4: pagination.
  const limit = params.add((o) => o.limit);
  const offset = params.add((o) => (o.page - 1) * o.limit);

  // Step 5: projection and aggregation.
  const withVariants = options.variantFields.length > 0;
  const item = withVariants
    ? `jsonb_build_object(
          'product', ${productObject(options)},
          'variants', COALESCE(vs.variants, '[]'::jsonb)
        )`
    : `jsonb_build_object('product', ${productObject(options)})`;

  // Variants are returned in a stable (creation) order; `sortOrder` is a UI concern.
  const variantJoin = withVariants
    ? `LEFT JOIN LATERAL (
        SELECT jsonb_agg(${variantObject(options)} ORDER BY v.id) AS variants
        FROM product_variants v
        WHERE v."productId" = p.id ${variantVisibilityPredicate(params, options)}
      ) vs ON TRUE`
    : '';

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
 * Compiled plans live until the process restarts. Only validated and
 * canonicalized shapes can enter the cache; the LRU cap is purely a safeguard
 * against clients enumerating valid combinations to exhaust memory.
 *
 * `get -> compile -> set` is fully synchronous (no `await`), so it is safe
 * under Node's single-threaded execution model.
 */
const PLAN_CACHE = new PlanCache<CompiledPlan>(PLAN_CACHE_MAX_ENTRIES);

function getPlan(options: NormalizedOptions): CompiledPlan {
  const sort = compileSort(options.sort);
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
 * Validates the search options, selects (or compiles) the SQL plan for their
 * shape and binds the request's values.
 *
 * `build()` throws `InvalidProductQueryError` for invalid options.
 *
 * Visibility is enforced by the caller through two independent options:
 * - `visibility`        filters products;
 * - `variantVisibility` restricts the variants that are aggregated, priced and
 *                       returned, and hides products left with no such variant.
 * The customer endpoint's service must force both to 'public'.
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
