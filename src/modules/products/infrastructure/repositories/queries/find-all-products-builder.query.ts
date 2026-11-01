import type { FindAllProductsSearchOptions } from '../product.repository';

/* -------------------------------------------------------------------------- */
/*                                Query types                                 */
/* -------------------------------------------------------------------------- */

/**
 * String representations of boolean values.
 *
 * These are used as mapped-type keys because TypeScript mapped types
 * require string, number, or symbol keys.
 */
type BooleanKey = 'true' | 'false';

/**
 * The supported category filtering modes.
 *
 * - none: no category filtering.
 * - direct: match only the specified categories.
 * - descendants: also match products belonging to descendant categories.
 */
type CategoryMode = 'none' | 'direct' | 'descendants';

/**
 * Converts a string boolean literal into its corresponding boolean type.
 */
type ToBoolean<B extends BooleanKey> = B extends 'true' ? true : false;

/**
 * Represents every valid combination of optional product filters.
 *
 * There are three independent boolean filters and three category modes,
 * resulting in 2 × 2 × 2 × 3 = 24 possible combinations.
 */
export type Combination = {
  [Search in BooleanKey]: {
    [Status in BooleanKey]: {
      [Brand in BooleanKey]: {
        [Category in CategoryMode]: {
          search: ToBoolean<Search>;
          status: ToBoolean<Status>;
          brand: ToBoolean<Brand>;
          category: Category;
        };
      }[CategoryMode];
    }[BooleanKey];
  }[BooleanKey];
}[BooleanKey];

/**
 * Appends a query-key segment to an existing key.
 *
 * Empty segments are ignored, and underscores are inserted only
 * when both segments contain a value.
 */
type AppendKey<Current extends string, Next extends string> = Next extends ''
  ? Current
  : Current extends ''
    ? Next
    : `${Current}_${Next}`;

/**
 * Derives the query key corresponding to a filter combination.
 *
 * Examples:
 * - { search: false, status: false, brand: false, category: 'none' }
 *   -> 'DEFAULT'
 * - { search: true, status: false, brand: false, category: 'none' }
 *   -> 'SEARCH'
 * - { search: true, status: true, brand: false, category: 'direct' }
 *   -> 'SEARCH_STATUS_CATEGORY'
 */
export type CombinationKey<C extends Combination> = C extends Combination
  ? AppendKey<
      AppendKey<
        AppendKey<C['search'] extends true ? 'SEARCH' : '', C['status'] extends true ? 'STATUS' : ''>,
        C['brand'] extends true ? 'BRAND' : ''
      >,
      C['category'] extends 'direct' ? 'CATEGORY' : C['category'] extends 'descendants' ? 'INCLUDE_CATEGORY' : ''
    >
  : never;

/**
 * Replaces the empty combination key with DEFAULT.
 */
type NormalizeQueryKey<Key extends string> = Key extends '' ? 'DEFAULT' : Key;

/**
 * Maps every valid filter combination to its corresponding SQL query.
 *
 * The mapped type guarantees that every valid combination has a key
 * and that invalid query keys are rejected by TypeScript.
 */
export type QueryMap = {
  [C in Combination as NormalizeQueryKey<CombinationKey<C>>]: string;
};

/**
 * Union of all supported query keys.
 */
export type QueryKey = keyof QueryMap;

/**
 * Result returned by the query builder.
 */
export type BuiltProductQuery = {
  sql: string;
  parameters: unknown[];
  pagination: { page: number; limit: number };
};

/* -------------------------------------------------------------------------- */
/*                              SQL definitions                               */
/* -------------------------------------------------------------------------- */

/**
 * SQL conditions used by the generated query variants.
 *
 * Each function receives the PostgreSQL parameter index to use.
 * Values themselves are always passed separately as query parameters.
 */
const CONDITIONS = {
  /**
   * Searches product titles and descriptions using PGroonga.
   */
  search: (index: number) => `(p.title &@ $${index} OR p.description &@ $${index})`,

  /**
   * Filters products by their status.
   */
  status: (index: number) => `p.status = $${index}`,

  /**
   * Filters products by their brand.
   */
  brand: (index: number) => `p."brandId" = $${index}`,

  /**
   * Matches products assigned directly to any specified category.
   */
  category: (index: number) => /*sql*/ `
    EXISTS (
      SELECT 1
      FROM product_categories pc
      WHERE pc."productId" = p.id
        AND pc."categoryId" = ANY($${index}::uuid[])
    )
  `,

  /**
   * Matches products assigned to the specified categories
   * or to any of their descendants.
   */
  includeCategories: (index: number) => /*sql*/ `
    EXISTS (
      SELECT 1
      FROM product_categories pc
      JOIN categories c ON c.id = pc."categoryId"
      WHERE pc."productId" = p.id
        AND (
          c.id = ANY($${index}::uuid[])
          OR c.path && $${index}::uuid[]
        )
    )
  `,
} as const;

/**
 * Sorting configuration for the generated queries.
 *
 * Search queries sort by PGroonga relevance first.
 * Queries without search sort by creation date.
 *
 * Aggregate ordering is specified separately because ordering
 * in a paginated CTE alone does not guarantee aggregate input order.
 */
const ORDERING = {
  SEARCH: {
    selection: ', pgroonga_score(p.tableoid, p.ctid) AS score',

    pageOrdering: 'ORDER BY score DESC, "createdAt" DESC, id DESC',

    aggregateOrdering: 'ORDER BY pg.score DESC, pg."createdAt" DESC, pg.id DESC',
  },

  DEFAULT: {
    selection: '',

    pageOrdering: 'ORDER BY "createdAt" DESC, id DESC',

    aggregateOrdering: 'ORDER BY pg."createdAt" DESC, pg.id DESC',
  },
} as const;

/* -------------------------------------------------------------------------- */
/*                           SQL query generation                             */
/* -------------------------------------------------------------------------- */

/**
 * Generates a SQL query for one specific filter combination.
 *
 * The generated query:
 * 1. Selects matching products and their cover images.
 * 2. Applies the requested filters.
 * 3. Calculates relevance scores when searching.
 * 4. Applies sorting and pagination.
 * 5. Aggregates the products into a JSON array.
 * 6. Returns the total number of matching products.
 *
 * Parameter allocation order:
 * search -> status -> brand -> categoryIds -> limit -> offset
 *
 * This order must remain synchronized with the builder's parameter array.
 */
function generateQuery(combination: Combination): string {
  const conditions: string[] = [];

  /**
   * Tracks the next PostgreSQL parameter index.
   */
  let parameterIndex = 0;

  /**
   * Allocates and returns the next parameter index.
   */
  const nextParameter = () => ++parameterIndex;

  // Add the applicable conditions in a fixed parameter order.
  if (combination.search) conditions.push(CONDITIONS.search(nextParameter()));

  if (combination.status) conditions.push(CONDITIONS.status(nextParameter()));

  if (combination.brand) conditions.push(CONDITIONS.brand(nextParameter()));

  if (combination.category === 'direct') conditions.push(CONDITIONS.category(nextParameter()));

  if (combination.category === 'descendants') conditions.push(CONDITIONS.includeCategories(nextParameter()));

  /**
   * Builds the WHERE clause.
   *
   * An empty condition list means no filters are applied.
   */
  const where = conditions.length ? `WHERE ${conditions.join('\nAND ')}` : '';

  /**
   * Selects the appropriate sorting configuration.
   */
  const ordering = combination.search ? ORDERING.SEARCH : ORDERING.DEFAULT;

  /**
   * Pagination parameters are always allocated last.
   */
  const limit = nextParameter();
  const offset = nextParameter();

  return /*sql*/ `
    WITH filtered AS (
      SELECT
        p.*,
        row_to_json(img) AS "coverImage"
        ${ordering.selection}
      FROM products p
      LEFT JOIN product_images pi ON pi."productId" = p.id
      LEFT JOIN images img ON img.id = pi."imageId"
      ${where}
    ),
    paginated AS (
      SELECT *
      FROM filtered
      ${ordering.pageOrdering}
      LIMIT ${limit}
      OFFSET ${offset}
    )
    SELECT
      COALESCE(
        (
          SELECT json_agg(
            to_jsonb(pg) - 'score'
            ${ordering.aggregateOrdering}
          )
          FROM paginated pg
        ),
        '[]'::json
      ) AS products,
      (SELECT COUNT(*) FROM filtered) AS total;
  `;
}

/* -------------------------------------------------------------------------- */
/*                         Query combination registry                         */
/* -------------------------------------------------------------------------- */

/**
 * Runtime boolean values used when enumerating filter combinations.
 */
const BOOLEAN_VALUES = [false, true] as const;

/**
 * Runtime category modes used when enumerating filter combinations.
 */
const CATEGORY_VALUES = ['none', 'direct', 'descendants'] as const;

/**
 * Generates every supported filter combination.
 *
 * The generated combinations must cover the same possibilities
 * represented by the Combination type.
 *
 * Total combinations: 2 × 2 × 2 × 3 = 24.
 */
function* generateCombinations(): Generator<Combination> {
  for (const search of BOOLEAN_VALUES) {
    for (const status of BOOLEAN_VALUES) {
      for (const brand of BOOLEAN_VALUES) {
        for (const category of CATEGORY_VALUES) {
          yield {
            search,
            status,
            brand,
            category,
          };
        }
      }
    }
  }
}

/**
 * Generates the runtime query key for a filter combination.
 *
 * The segment order must match the CombinationKey type.
 *
 * The returned key is asserted as QueryKey because TypeScript
 * cannot infer the relationship between the dynamically assembled
 * string and the type-level conditional mapping.
 */
function getCombinationKey(combination: Combination): QueryKey {
  const parts: string[] = [];

  if (combination.search) parts.push('SEARCH');

  if (combination.status) parts.push('STATUS');

  if (combination.brand) parts.push('BRAND');

  if (combination.category === 'direct') parts.push('CATEGORY');

  if (combination.category === 'descendants') parts.push('INCLUDE_CATEGORY');

  return (parts.join('_') || 'DEFAULT') as QueryKey;
}

/**
 * Generates and stores all SQL query variants once when this module
 * is initialized.
 *
 * The query templates are reused by every builder instance.
 * No SQL condition construction is needed for individual requests.
 *
 * Query values remain parameterized; user input is never interpolated
 * into the generated SQL.
 */
export const QUERIES = Object.fromEntries(
  [...generateCombinations()].map(
    (combination) => [getCombinationKey(combination), generateQuery(combination)] as const,
  ),
) as QueryMap;

/* -------------------------------------------------------------------------- */
/*                        Product query builder                               */
/* -------------------------------------------------------------------------- */

/**
 * Builds a product query by selecting an existing SQL template
 * and supplying the corresponding parameter values.
 *
 * SQL templates are generated once at module initialization.
 * Each builder instance only determines the appropriate template
 * and prepares its parameter array.
 */
export class FindAllProductsQueryBuilder {
  constructor(private readonly options: FindAllProductsSearchOptions) {}

  /**
   * Builds the SQL query and its parameter array.
   *
   * Parameter ordering must match generateQuery():
   * search -> status -> brand -> categoryIds -> limit -> offset.
   */
  build(): BuiltProductQuery {
    const { search: rawSearch, status, brandId, category } = this.options;

    /**
     * Normalize the search string.
     * Empty or whitespace-only strings do not activate search filtering.
     */
    const search = rawSearch?.trim();

    /**
     * Determine which optional filters are active.
     */
    const hasSearch = Boolean(search);
    const hasStatus = status !== undefined;
    const hasBrand = brandId !== undefined;

    /**
     * Determine the category filtering mode.
     */
    const categoryMode: CategoryMode = !category
      ? 'none'
      : category.includeCategoryDescendants
        ? 'descendants'
        : 'direct';

    /**
     * Build the combination used to select the SQL template.
     */
    const combination: Combination = {
      search: hasSearch,
      status: hasStatus,
      brand: hasBrand,
      category: categoryMode,
    };

    /**
     * Resolve the matching pre-generated SQL query.
     */
    const queryKey = getCombinationKey(combination);
    const sql = QUERIES[queryKey];

    /**
     * Normalize pagination values.
     */
    const { page, limit } = FindAllProductsQueryBuilder.normalizePagination(this.options);

    /**
     * Prepare parameter values in exactly the same order
     * used when generating the SQL placeholders.
     */
    const parameters: unknown[] = [];

    if (hasSearch) parameters.push(search);

    if (hasStatus) parameters.push(status);

    if (hasBrand) parameters.push(brandId);

    if (category) parameters.push(category.categoryIds);

    // Pagination parameters are always last.
    parameters.push(limit, (page - 1) * limit);

    return {
      sql,
      parameters,
      pagination: { page, limit },
    };
  }

  /**
   * Normalizes pagination options.
   *
   * Defaults:
   * - page: 1
   * - limit: 25
   *
   * Constraints:
   * - Page must be a positive integer.
   * - Limit must be a positive integer.
   * - Maximum limit is 100.
   */
  private static normalizePagination(pagination: { page?: number; limit?: number }) {
    const rawPage = Number(pagination.page ?? 1);
    const rawLimit = Number(pagination.limit ?? 25);

    const pageValue = Math.floor(rawPage);
    const limitValue = Math.floor(rawLimit);

    const page = Number.isFinite(rawPage) && pageValue >= 1 ? pageValue : 1;

    const limit = Number.isFinite(rawLimit) && limitValue >= 1 ? Math.min(limitValue, 100) : 25;

    return { page, limit };
  }
}
