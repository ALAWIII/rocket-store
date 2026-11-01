import { describe, expect, it } from 'vitest';

import type { FindAllProductsSearchOptions } from '../product.repository';

import {
  FindAllProductsQueryBuilder,
  QUERIES,
  type Combination,
  type QueryKey,
} from '../queries/find-all-products-builder.query';

/* -------------------------------------------------------------------------- */
/*                               Test fixtures                                */
/* -------------------------------------------------------------------------- */

const SEARCH_VALUE = 'laptop';
const STATUS_VALUE = 'active' as NonNullable<FindAllProductsSearchOptions['status']>;

const BRAND_ID = '00000000-0000-7000-8000-000000000001';

const CATEGORY_IDS = ['00000000-0000-7000-8000-000000000002', '00000000-0000-7000-8000-000000000003'];

/**
 * Generates every supported combination independently of the
 * production query generator.
 *
 * This allows us to verify that no filter combination is missing
 * from the exported QUERIES registry.
 */
function generateTestCombinations(): Combination[] {
  const combinations: Combination[] = [];

  for (const search of [false, true]) {
    for (const status of [false, true]) {
      for (const brand of [false, true]) {
        for (const category of ['none', 'direct', 'descendants'] as const) {
          combinations.push({
            search,
            status,
            brand,
            category,
          });
        }
      }
    }
  }

  return combinations;
}

/**
 * Independently derives the expected query key for a combination.
 */
function getExpectedQueryKey(combination: Combination): QueryKey {
  const parts: string[] = [];

  if (combination.search) parts.push('SEARCH');
  if (combination.status) parts.push('STATUS');
  if (combination.brand) parts.push('BRAND');

  if (combination.category === 'direct') {
    parts.push('CATEGORY');
  }

  if (combination.category === 'descendants') {
    parts.push('INCLUDE_CATEGORY');
  }

  return (parts.join('_') || 'DEFAULT') as QueryKey;
}

/**
 * Normalizes whitespace and casing to simplify SQL structure assertions.
 */
function normalizeSql(sql: string): string {
  return sql.replace(/\s+/g, ' ').trim().toLowerCase();
}

/**
 * Extracts unique PostgreSQL parameter indexes from a query.
 *
 * For example:
 *   WHERE title = $1 OR description = $1 AND status = $2
 *
 * Returns:
 *   [1, 2]
 */
function getParameterIndexes(sql: string): number[] {
  const indexes = [...sql.matchAll(/\$(\d+)/g)].map((match) => Number(match[1]));

  return [...new Set(indexes)].sort((a, b) => a - b);
}

const combinations = generateTestCombinations();

/* -------------------------------------------------------------------------- */
/*                           SQL generation tests                             */
/* -------------------------------------------------------------------------- */

describe('QUERIES', () => {
  it('generates exactly 24 query variants', () => {
    expect(Object.keys(QUERIES)).toHaveLength(24);
  });

  it('generates every supported query key', () => {
    const expectedKeys = combinations.map(getExpectedQueryKey).sort();

    const actualKeys = Object.keys(QUERIES).sort();

    expect(actualKeys).toEqual(expectedKeys);
  });

  it('generates a unique SQL query for every combination', () => {
    const queries = Object.values(QUERIES);

    expect(new Set(queries).size).toBe(24);
  });

  it.each(combinations)('generates valid query output for %#', (combination) => {
    const options: FindAllProductsSearchOptions = {
      ...(combination.search ? { search: '  laptop  ' } : {}),
      ...(combination.status ? { status: STATUS_VALUE } : {}),
      ...(combination.brand ? { brandId: BRAND_ID } : {}),
      ...(combination.category !== 'none'
        ? {
            category: {
              categoryIds: CATEGORY_IDS,
              includeCategoryDescendants: combination.category === 'descendants',
            },
          }
        : {}),
      page: 3,
      limit: 10,
    };

    // Exercise the actual public API.
    const result = new FindAllProductsQueryBuilder(options).build();

    const { sql: rawSql, parameters, pagination } = result;
    const sql = normalizeSql(rawSql);

    const key = getExpectedQueryKey(combination);

    /* ---------------------------- Query selection ---------------------------- */

    expect(rawSql).toBe(QUERIES[key]);

    /* ---------------------------- Query structure ---------------------------- */

    expect(sql).toContain('with filtered as (');
    expect(sql).toContain('paginated as (');
    expect(sql).toContain('from products p');

    expect(sql).toContain('left join product_images pi on pi."productid" = p.id');

    expect(sql).toContain('left join images img on img.id = pi."imageid"');

    expect(sql).toContain('row_to_json(img) as "coverimage"');

    /* ---------------------------- Filter conditions -------------------------- */

    expect(sql.includes('p.title &@')).toBe(combination.search);
    expect(sql.includes('p.description &@')).toBe(combination.search);
    expect(sql.includes('p.status =')).toBe(combination.status);
    expect(sql.includes('p."brandid" =')).toBe(combination.brand);

    if (combination.category === 'direct') {
      expect(sql).toContain('pc."categoryid" = any(');
      expect(sql).not.toContain('join categories c');
    }

    if (combination.category === 'descendants') {
      expect(sql).toContain('join categories c on c.id = pc."categoryid"');

      expect(sql).toContain('c.id = any(');
      expect(sql).toContain('c.path &&');
    }

    if (combination.category === 'none') {
      expect(sql).not.toContain('from product_categories pc');
    }

    /* ---------------------------- Search ordering ---------------------------- */

    expect(sql.includes('pgroonga_score(')).toBe(combination.search);

    if (combination.search) {
      expect(sql).toContain('order by score desc, "createdat" desc, id desc');

      expect(sql).toContain('order by pg.score desc, pg."createdat" desc, pg.id desc');
    } else {
      expect(sql).toContain('order by "createdat" desc, id desc');

      expect(sql).toContain('order by pg."createdat" desc, pg.id desc');
    }

    /* ---------------------------- Pagination ------------------------------- */

    expect(sql).toMatch(/limit \$\d+ offset \$\d+/);

    expect(pagination).toEqual({
      page: 3,
      limit: 10,
    });

    /* ---------------------------- JSON aggregation --------------------------- */

    expect(sql).toContain('json_agg(');
    expect(sql).toContain("to_jsonb(pg) - 'score'");
    expect(sql).toContain("'[]'::json");
    expect(sql).toContain('count(*) from filtered');

    /* ---------------------------- Parameters -------------------------------- */

    const expectedParameters: unknown[] = [];

    if (combination.search) expectedParameters.push('laptop');
    if (combination.status) expectedParameters.push(STATUS_VALUE);
    if (combination.brand) expectedParameters.push(BRAND_ID);

    if (combination.category !== 'none') {
      expectedParameters.push(CATEGORY_IDS);
    }

    expectedParameters.push(10, 20);

    expect(parameters).toEqual(expectedParameters);

    const activeFilterCount =
      Number(combination.search) +
      Number(combination.status) +
      Number(combination.brand) +
      Number(combination.category !== 'none');

    const parameterIndexes = getParameterIndexes(rawSql);

    expect(parameterIndexes).toEqual(Array.from({ length: activeFilterCount + 2 }, (_, index) => index + 1));
  });
});

/* -------------------------------------------------------------------------- */
/*                         Query builder tests                                */
/* -------------------------------------------------------------------------- */

describe('FindAllProductsQueryBuilder', () => {
  it.each(combinations)('selects the correct query and parameters for %#', (combination) => {
    const options: FindAllProductsSearchOptions = {
      ...(combination.search ? { search: `  ${SEARCH_VALUE}  ` } : {}),

      ...(combination.status ? { status: STATUS_VALUE } : {}),

      ...(combination.brand ? { brandId: BRAND_ID } : {}),

      ...(combination.category !== 'none'
        ? {
            category: {
              categoryIds: CATEGORY_IDS,
              includeCategoryDescendants: combination.category === 'descendants',
            },
          }
        : {}),

      page: 3,
      limit: 10,
    };

    const result = new FindAllProductsQueryBuilder(options).build();

    const key = getExpectedQueryKey(combination);

    // The builder must select the corresponding pre-generated query.
    expect(result.sql).toBe(QUERIES[key]);

    // Parameters must follow the same order as the SQL placeholders.
    const expectedParameters: unknown[] = [];

    if (combination.search) {
      expectedParameters.push(SEARCH_VALUE);
    }

    if (combination.status) {
      expectedParameters.push(STATUS_VALUE);
    }

    if (combination.brand) {
      expectedParameters.push(BRAND_ID);
    }

    if (combination.category !== 'none') {
      expectedParameters.push(CATEGORY_IDS);
    }

    // LIMIT and OFFSET are always the final parameters.
    expectedParameters.push(10, 20);

    expect(result.parameters).toEqual(expectedParameters);
  });

  it('uses the default query when no filters are provided', () => {
    const result = new FindAllProductsQueryBuilder({}).build();

    expect(result.sql).toBe(QUERIES.DEFAULT);
    expect(result.parameters).toEqual([25, 0]);
  });

  it('ignores an empty search string', () => {
    const result = new FindAllProductsQueryBuilder({
      search: '   ',
    }).build();

    expect(result.sql).toBe(QUERIES.DEFAULT);
    expect(result.parameters).toEqual([25, 0]);
  });

  it('trims the search value before passing it as a parameter', () => {
    const result = new FindAllProductsQueryBuilder({
      search: '  laptop  ',
    }).build();

    expect(result.sql).toBe(QUERIES.SEARCH);
    expect(result.parameters).toEqual(['laptop', 25, 0]);
  });

  it('keeps user input outside the SQL string', () => {
    const maliciousSearch = "' OR TRUE; DROP TABLE products; --";

    const result = new FindAllProductsQueryBuilder({
      search: maliciousSearch,
    }).build();

    expect(result.sql).not.toContain(maliciousSearch);
    expect(result.parameters).toContain(maliciousSearch);
  });

  it('preserves category filtering when categoryIds is empty', () => {
    const result = new FindAllProductsQueryBuilder({
      category: {
        categoryIds: [],
      },
    }).build();

    expect(result.sql).toBe(QUERIES.CATEGORY);
    expect(result.parameters).toEqual([[], 25, 0]);
  });
});

/* -------------------------------------------------------------------------- */
/*                         Pagination tests                                   */
/* -------------------------------------------------------------------------- */

describe('pagination parameters', () => {
  it.each([
    {
      name: 'default pagination',
      page: undefined,
      limit: undefined,
      expected: [25, 0],
    },
    {
      name: 'custom pagination',
      page: 3,
      limit: 10,
      expected: [10, 20],
    },
    {
      name: 'fractional values',
      page: 2.9,
      limit: 10.9,
      expected: [10, 10],
    },
    {
      name: 'page below one',
      page: 0,
      limit: 10,
      expected: [10, 0],
    },
    {
      name: 'fractional page below one',
      page: 0.5,
      limit: 10,
      expected: [10, 0],
    },
    {
      name: 'limit below one',
      page: 2,
      limit: 0,
      expected: [25, 25],
    },
    {
      name: 'limit above maximum',
      page: 2,
      limit: 200,
      expected: [100, 100],
    },
    {
      name: 'non-finite values',
      page: Number.NaN,
      limit: Number.POSITIVE_INFINITY,
      expected: [25, 0],
    },
  ])('$name', ({ page, limit, expected }) => {
    const result = new FindAllProductsQueryBuilder({
      page,
      limit,
    }).build();

    expect(result.parameters.slice(-2)).toEqual(expected);
  });
});
