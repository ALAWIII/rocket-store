import { SORT_DIRECTION, SortDirection } from 'src/modules/shared/types/sort-direction';
import { normalizePagination } from 'src/modules/shared/utils/normalize-pagination.util';
import type { FindAllProductsSearchOptions } from '../product.repository';
import { SORT_BY_OPTIONS, SortByOptions } from 'src/modules/products/application/models/sort-by-options';

/* -------------------------------------------------------------------------- */
/*                                Query types                                 */
/* -------------------------------------------------------------------------- */

/**
 * The supported category filtering modes.
 *
 * - none: no category filtering.
 * - direct: match only the specified categories.
 * - descendants: also match products belonging to descendant categories.
 */
type CategoryMode = 'none' | 'direct' | 'descendants';

type JoinFields<T extends readonly unknown[]> = T extends readonly [infer H, ...infer R]
  ? H extends unknown
    ? JoinFields<R> extends infer Rest
      ? Rest extends unknown
        ? H & Rest
        : never
      : never
    : never
  : unknown;
type CombinationOf<Key extends PropertyKey, Value> = Value extends unknown ? Record<Key, Value> : never;
type BooleanCombination<Key extends PropertyKey> = CombinationOf<Key, boolean>;

type SearchComb = BooleanCombination<'search'>;
type VisibilityComb = BooleanCombination<'visibility'>;
type SalesStatusComb = BooleanCombination<'salesStatus'>;
type BrandComb = BooleanCombination<'brand'>;
type CategoryComb = CombinationOf<'category', CategoryMode>;
type Price = JoinFields<[BooleanCombination<'minPrice'>, BooleanCombination<'maxPrice'>]>;
type Ordering = JoinFields<[CombinationOf<'sortBy', SortByOptions>, CombinationOf<'sortDirection', SortDirection>]>;
/**
 * Represents every valid combination of optional product filters.
 *
 * There are three independent boolean filters and three category modes,
 * resulting in 2 × 2 × 2 × 3 = 24 possible combinations.
 */
export type Combination = JoinFields<
  [SearchComb, VisibilityComb, SalesStatusComb, BrandComb, CategoryComb, Price, Ordering]
>;

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
 * - { search: false, visibility: false, brand: false, category: 'none' }
 *   -> 'DEFAULT'
 * - { search: true, visibility: false, brand: false, category: 'none' }
 *   -> 'SEARCH'
 * - { search: true, visibility: true, brand: false, category: 'direct' }
 *   -> 'SEARCH_STATUS_CATEGORY'
 */
type AppendKeys<T extends readonly string[], Acc extends string = ''> = T extends readonly [
  infer H extends string,
  ...infer R extends string[],
]
  ? AppendKeys<R, AppendKey<Acc, H>>
  : Acc;

type Flag<V, Label extends string> = V extends true ? Label : '';

type CategoryFlag<M> = M extends 'direct' ? 'CATEGORY' : M extends 'descendants' ? 'INCLUDE_CATEGORY' : '';

export type CombinationKey<C extends Combination> = C extends Combination
  ? AppendKeys<
      [
        Flag<C['search'], 'SEARCH'>,
        Flag<C['visibility'], 'VISIBILITY'>,
        Flag<C['salesStatus'], 'SALES_STATUS'>,
        Flag<C['brand'], 'BRAND'>,
        CategoryFlag<C['category']>,
        Flag<C['minPrice'], 'MIN'>,
        Flag<C['maxPrice'], 'MAX'>,
        Uppercase<C['sortBy']>,
        Uppercase<C['sortDirection']>,
      ]
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
   * Filters products by their visibility.
   */
  visibility: (index: number) => `p.visibility = $${index}`,
  /**
   * Filters products by their salesStatus.
   */
  salesStatus: (index: number) => `p."salesStatus" = $${index}`,
  /**
   * Filters products by their brand.
   */
  brand: (index: number) => `p."brandId" = $${index}`,

  /**
   * Filters products by min price.
   */
  minPrice: (index: number) => `p.price <= $${index}`,

  /**
   * Filters products by max price.
   */
  maxPrice: (index: number) => `p.price >= $${index}`,
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

  byField: (f: SortByOptions, direction: SortDirection) => ({
    selection: '',

    pageOrdering: `ORDER BY "${f}" ${direction}, id ${direction}`,

    aggregateOrdering: `ORDER BY pg."${f}" ${direction}, pg.id ${direction}`,
  }),
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
 * search -> visibility -> brand -> categoryIds -> limit -> offset
 *
 * This order must remain synchronized with the builder's parameter array.
 */
function generateQuery(combination: Combination): string {
  const { sortBy, sortDirection } = combination;
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

  if (combination.visibility) conditions.push(CONDITIONS.visibility(nextParameter()));

  if (combination.salesStatus) conditions.push(CONDITIONS.salesStatus(nextParameter()));

  if (combination.brand) conditions.push(CONDITIONS.brand(nextParameter()));

  if (combination.category === 'direct') conditions.push(CONDITIONS.category(nextParameter()));

  if (combination.category === 'descendants') conditions.push(CONDITIONS.includeCategories(nextParameter()));

  if (combination.minPrice) conditions.push(CONDITIONS.minPrice(nextParameter()));

  if (combination.maxPrice) conditions.push(CONDITIONS.maxPrice(nextParameter()));

  /**
   * Builds the WHERE clause.
   *
   * An empty condition list means no filters are applied.
   */
  const where = conditions.length ? `WHERE ${conditions.join('\nAND ')}` : '';

  /**
   * Selects the appropriate sorting configuration.
   */
  const ordering = combination.search ? ORDERING.SEARCH : ORDERING.byField(sortBy, sortDirection);

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
      LIMIT $${limit}
      OFFSET $${offset}
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
    for (const visibility of BOOLEAN_VALUES) {
      for (const salesStatus of BOOLEAN_VALUES) {
        for (const brand of BOOLEAN_VALUES) {
          for (const category of CATEGORY_VALUES) {
            for (const minPrice of BOOLEAN_VALUES) {
              for (const maxPrice of BOOLEAN_VALUES) {
                for (const sortBy of SORT_BY_OPTIONS) {
                  for (const sortDirection of SORT_DIRECTION) {
                    yield {
                      search,
                      visibility,
                      salesStatus,
                      brand,
                      category,
                      minPrice,
                      maxPrice,
                      sortBy,
                      sortDirection,
                    } as Combination;
                  }
                }
              }
            }
          }
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

  if (combination.visibility) parts.push('VISIBILITY');

  if (combination.salesStatus) parts.push('SALES_STATUS');

  if (combination.brand) parts.push('BRAND');

  if (combination.category === 'direct') parts.push('CATEGORY');

  if (combination.category === 'descendants') parts.push('INCLUDE_CATEGORY');

  if (combination.minPrice) parts.push('MIN');

  if (combination.maxPrice) parts.push('MAX');

  parts.push(combination.sortBy);
  parts.push(combination.sortDirection);

  return parts.join('_') as QueryKey;
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
   * search -> visibility -> brand -> categoryIds -> limit -> offset.
   */
  build(): BuiltProductQuery {
    const { search: rawSearch, visibility, salesStatus, brandId, category, minPrice, maxPrice, sort } = this.options;
    const { field: sortBy = 'createdAt', direction: sortDirection = 'DESC' } = sort!;

    /**
     * Normalize the search string.
     * Empty or whitespace-only strings do not activate search filtering.
     */
    const search = rawSearch?.trim();

    /**
     * Determine which optional filters are active.
     */
    const hasSearch = Boolean(search);
    const hasVisibility = visibility !== undefined;
    const hasSalesStatus = salesStatus !== undefined;
    const hasBrand = brandId !== undefined;

    /**
     * Determine the category filtering mode.
     */
    const categoryMode: CategoryMode = !category
      ? 'none'
      : category.includeCategoryDescendants
        ? 'descendants'
        : 'direct';

    const hasMinPrice = minPrice !== undefined;
    const hasMaxPrice = maxPrice !== undefined;
    /**
     * Build the combination used to select the SQL template.
     */
    const combination: Combination = {
      search: hasSearch,
      visibility: hasVisibility,
      salesStatus: hasSalesStatus,
      brand: hasBrand,
      category: categoryMode,
      minPrice: hasMinPrice,
      maxPrice: hasMaxPrice,
      sortBy,
      sortDirection,
    } as Combination;

    /**
     * Resolve the matching pre-generated SQL query.
     */
    const queryKey = getCombinationKey(combination);
    const sql = QUERIES[queryKey];

    /**
     * Normalize pagination values.
     */
    const { page, limit } = normalizePagination(this.options);

    /**
     * Prepare parameter values in exactly the same order
     * used when generating the SQL placeholders.
     */
    const parameters: unknown[] = [];

    if (hasSearch) parameters.push(search);

    if (hasVisibility) parameters.push(visibility);
    if (hasSalesStatus) parameters.push(salesStatus);

    if (hasBrand) parameters.push(brandId);

    if (category) parameters.push(category.categoryIds);

    if (hasMinPrice) parameters.push(minPrice);
    if (hasMaxPrice) parameters.push(maxPrice);
    // Pagination parameters are always last.
    parameters.push(limit, (page - 1) * limit);

    return {
      sql,
      parameters,
      pagination: { page, limit },
    };
  }
}
