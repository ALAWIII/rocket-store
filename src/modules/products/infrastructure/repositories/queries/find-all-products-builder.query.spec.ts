import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { PGlite } from '@electric-sql/pglite';
import { FindAllProductsQueryBuilder } from './find-all-products-builder.query';
import type { FindAllProductsSearchOptions } from '../product.repository';

type QueryItem = {
  product: Record<string, unknown> & { id: string; title: string };
  variants?: Array<Record<string, unknown> & { id: string; productId: string }>;
};
type QueryRow = { products: QueryItem[] | string; total: number };

const IDS = {
  product1: '018f0000-0000-7000-8000-000000000001',
  product2: '018f0000-0000-7000-8000-000000000002',
  product3: '018f0000-0000-7000-8000-000000000003',
  product4: '018f0000-0000-7000-8000-000000000004',
  variant1: '018f0000-0000-7000-8000-000000000101',
  variant2: '018f0000-0000-7000-8000-000000000102',
  variant3: '018f0000-0000-7000-8000-000000000103',
  variant4: '018f0000-0000-7000-8000-000000000104',
  variant5: '018f0000-0000-7000-8000-000000000105',
  brandA: '018f0000-0000-7000-8000-000000000201',
  brandB: '018f0000-0000-7000-8000-000000000202',
  categoryParent: '018f0000-0000-7000-8000-000000000301',
  categoryChild: '018f0000-0000-7000-8000-000000000302',
  categoryOther: '018f0000-0000-7000-8000-000000000303',
  image1: '018f0000-0000-7000-8000-000000000401',
} as const;

/**
 * Use the production query builder directly. The cast keeps this spec focused on
 * runtime SQL behavior; DTO validation and compile-time option validation belong
 * in their own tests.
 */
function build(options: object = {}) {
  return new FindAllProductsQueryBuilder(options as FindAllProductsSearchOptions).build();
}

function readProducts(row: QueryRow): QueryItem[] {
  return typeof row.products === 'string' ? JSON.parse(row.products) : row.products;
}

function ids(items: QueryItem[]): string[] {
  return items.map(({ product }) => product.id);
}

const SCHEMA_SQL = /* sql */ `
  CREATE TABLE products (
    id uuid PRIMARY KEY,
    title varchar(200) NOT NULL,
    description text NOT NULL DEFAULT '',
    visibility varchar(9) NOT NULL,
    "salesStatus" varchar(7) NOT NULL,
    "brandId" uuid,
    "pageId" uuid,
    "createdAt" timestamptz NOT NULL,
    "updatedAt" timestamptz NOT NULL
  );

  CREATE TABLE product_variants (
    id uuid PRIMARY KEY,
    "productId" uuid NOT NULL,
    title varchar(50) NOT NULL,
    price integer NOT NULL,
    info jsonb NOT NULL DEFAULT '{}'::jsonb,
    description varchar(2000),
    visibility varchar(9) NOT NULL,
    "salesStatus" varchar(7) NOT NULL,
    "sortOrder" integer NOT NULL,
    "createdAt" timestamptz NOT NULL,
    "updatedAt" timestamptz NOT NULL
  );

  CREATE TABLE product_images (
    id uuid PRIMARY KEY,
    "imageId" uuid NOT NULL,
    "productId" uuid NOT NULL UNIQUE,
    "createdAt" timestamptz NOT NULL
  );

  CREATE TABLE categories (
    id uuid PRIMARY KEY,
    name varchar(50) NOT NULL,
    "parentId" uuid,
    path uuid[] NOT NULL DEFAULT '{}',
    description varchar(125),
    "createdAt" timestamptz NOT NULL,
    "updatedAt" timestamptz NOT NULL
  );

  CREATE TABLE product_categories (
    "categoryId" uuid NOT NULL,
    "productId" uuid NOT NULL,
    PRIMARY KEY ("categoryId", "productId")
  );
`;

const FIXTURE_SQL = /* sql */ `
  INSERT INTO products
    (id, title, description, visibility, "salesStatus", "brandId", "pageId", "createdAt", "updatedAt")
  VALUES
    ('${IDS.product1}', 'Alpha Lamp', 'Warm desk lamp', 'public', 'active', '${IDS.brandA}', NULL, '2026-01-01T00:00:00Z', '2026-01-05T00:00:00Z'),
    ('${IDS.product2}', 'Beta Chair', 'Oak chair', 'public', 'paused', '${IDS.brandB}', NULL, '2026-01-02T00:00:00Z', '2026-01-06T00:00:00Z'),
    ('${IDS.product3}', 'Gamma Desk', 'Wide desk', 'private', 'active', '${IDS.brandA}', NULL, '2026-01-03T00:00:00Z', '2026-01-07T00:00:00Z'),
    ('${IDS.product4}', 'Delta Shelf', 'Small shelf', 'public', 'active', '${IDS.brandA}', NULL, '2026-01-04T00:00:00Z', '2026-01-08T00:00:00Z');

  INSERT INTO product_variants
    (id, "productId", title, price, info, description, visibility, "salesStatus", "sortOrder", "createdAt", "updatedAt")
  VALUES
    ('${IDS.variant1}', '${IDS.product1}', 'Standard', 100, '{"color":"black"}', 'Standard finish', 'public', 'active', 2, '2026-01-01T00:00:00Z', '2026-01-01T00:00:00Z'),
    ('${IDS.variant2}', '${IDS.product1}', 'Premium', 500, '{"color":"oak"}', 'Premium finish', 'public', 'active', 1, '2026-01-01T00:00:00Z', '2026-01-01T00:00:00Z'),
    ('${IDS.variant3}', '${IDS.product1}', 'Internal', 10, '{}', NULL, 'private', 'active', 3, '2026-01-01T00:00:00Z', '2026-01-01T00:00:00Z'),
    ('${IDS.variant4}', '${IDS.product2}', 'Single', 300, '{}', NULL, 'public', 'active', 1, '2026-01-02T00:00:00Z', '2026-01-02T00:00:00Z'),
    ('${IDS.variant5}', '${IDS.product3}', 'Internal', 50, '{}', NULL, 'private', 'active', 1, '2026-01-03T00:00:00Z', '2026-01-03T00:00:00Z');

  INSERT INTO product_images (id, "imageId", "productId", "createdAt")
  VALUES ('${IDS.image1}', '${IDS.image1}', '${IDS.product1}', '2026-01-01T00:00:00Z');

  INSERT INTO categories (id, name, "parentId", path, "createdAt", "updatedAt")
  VALUES
    ('${IDS.categoryParent}', 'Furniture', NULL, '{}', '2026-01-01T00:00:00Z', '2026-01-01T00:00:00Z'),
    ('${IDS.categoryChild}', 'Chairs', '${IDS.categoryParent}', ARRAY['${IDS.categoryParent}'::uuid], '2026-01-01T00:00:00Z', '2026-01-01T00:00:00Z'),
    ('${IDS.categoryOther}', 'Lighting', NULL, '{}', '2026-01-01T00:00:00Z', '2026-01-01T00:00:00Z');

  INSERT INTO product_categories ("categoryId", "productId")
  VALUES
    ('${IDS.categoryParent}', '${IDS.product1}'),
    ('${IDS.categoryChild}', '${IDS.product2}'),
    ('${IDS.categoryOther}', '${IDS.product3}');
`;

let db: PGlite | undefined;

beforeAll(async () => {
  db = new PGlite();
  await db.exec(SCHEMA_SQL);
  await db.exec(FIXTURE_SQL);

  // Minimal stand-ins let PGlite parse and execute the PGroonga-dependent SQL shape.
  // They test SQL composition/binding, not PGroonga's matching, scoring, or indexes.
  await db.exec(/* sql */ `
    CREATE FUNCTION test_pgroonga_match(text, text)
    RETURNS boolean
    LANGUAGE SQL
    IMMUTABLE
    AS $$ SELECT strpos($1, $2) > 0 $$;

    CREATE OPERATOR &@ (
      LEFTARG = text,
      RIGHTARG = text,
      FUNCTION = test_pgroonga_match
    );

    CREATE FUNCTION pgroonga_score(oid, tid)
    RETURNS double precision
    LANGUAGE SQL
    IMMUTABLE
    AS $$ SELECT 1.0::double precision $$;
  `);
}, 30_000);

afterAll(async () => {
  if (db) await db.close();
});

async function execute(options: object = {}): Promise<QueryRow> {
  if (!db) throw new Error('PGlite has not been initialized');
  const query = build(options);
  const result = await db.query<QueryRow>(query.sql, query.parameters);
  const row = result.rows[0];
  if (!row) throw new Error('The query returned no result row');
  return row;
}

describe('FindAllProductsQueryBuilder — SQL generation', () => {
  it('builds the default query without touching variants', () => {
    const query = build();

    expect(query.sql).toContain('WITH matched AS');
    expect(query.sql).toContain('page AS');
    expect(query.sql).toContain('FROM products p');
    expect(query.sql).toContain('LEFT JOIN product_images cover');
    expect(query.sql).toContain('\'coverImageId\', cover."imageId"');
    expect(query.sql).toContain('(SELECT COUNT(*) FROM matched)::int AS total');
    expect(query.sql).not.toContain('product_variants');
    expect(query.sql).not.toContain('WHERE');
    expect(query.sql).toContain('ORDER BY m.k0 DESC, m.id DESC');
    expect(query.parameters).toEqual([query.pagination.limit, 0]);
  });

  it.each([
    ['visibility', { visibility: 'public' }, 'p."visibility" = $1'],
    ['sales status', { salesStatus: 'active' }, 'p."salesStatus" = $1'],
    ['brand', { brandId: IDS.brandA }, 'p."brandId" = $1'],
    ['variant visibility', { variantVisibility: 'public' }, 'v."visibility" = $1'],
    ['minimum price', { minPrice: 100 }, 'v."price" >= $1'],
    ['maximum price', { maxPrice: 500 }, 'v."price" <= $1'],
  ] as const)('compiles the %s filter', (_name, options, fragment) => {
    const query = build(options);
    expect(query.sql).toContain(fragment);
    expect(query.parameters[0]).toEqual(Object.values(options)[0]); // takes out the first value for example in case of visibility: 'public', it extracts 'public'
  });

  it('compiles direct category filtering and binds the ID array once', () => {
    const categoryIds = [IDS.categoryParent, IDS.categoryOther];
    const query = build({ category: { categoryIds, includeCategoryDescendants: false } });

    expect(query.sql).toContain('FROM product_categories pc');
    expect(query.sql).toContain('pc."categoryId" = ANY($1::uuid[])');
    expect(query.sql).not.toContain('c.path &&');
    expect(query.parameters[0]).toEqual(categoryIds);
  });

  it('compiles descendant category filtering with the category path overlap operator', () => {
    const categoryIds = [IDS.categoryParent];
    const query = build({ category: { categoryIds, includeCategoryDescendants: true } });

    expect(query.sql).toContain('JOIN categories c ON c.id = pc."categoryId"');
    expect(query.sql).toContain('c.id = ANY($1::uuid[]) OR c.path && $1::uuid[]');
    expect(query.parameters[0]).toEqual(categoryIds);
  });

  it('keeps an explicitly supplied empty category list as an active filter', () => {
    const query = build({ category: { categoryIds: [], includeCategoryDescendants: false } });

    expect(query.sql).toContain('pc."categoryId" = ANY($1::uuid[])');
    expect(query.parameters[0]).toEqual([]);
  });

  it.each([
    ['minimum only', { minPrice: 100 }, 'v."price" >= $1'],
    ['maximum only', { maxPrice: 500 }, 'v."price" <= $1'],
    ['minimum and maximum', { minPrice: 100, maxPrice: 500 }, 'v."price" >= $1 AND v."price" <= $2'],
  ] as const)('generates the price predicate for %s', (_name, options, fragment) => {
    expect(build(options).sql).toContain(fragment);
  });

  it('uses the price aggregate join only when price sorting requires it', () => {
    const priceSort = build({ sort: { field: 'price', direction: 'ASC' } });
    const titleSort = build({ sort: { field: 'title', direction: 'ASC' } });

    expect(priceSort.sql).toContain('LEFT JOIN LATERAL');
    expect(priceSort.sql).toContain('MIN(v."price") AS min_price');
    expect(priceSort.sql).toContain('pa.min_price AS k0');
    expect(priceSort.sql).toContain('ORDER BY m.k0 ASC NULLS LAST, m.id ASC');
    expect(titleSort.sql).not.toContain('MIN(v."price")');
    expect(titleSort.sql).toContain('p."title" AS k0');
    expect(titleSort.sql).toContain('ORDER BY m.k0 ASC, m.id ASC');
  });

  it.each([
    ['createdAt', 'DESC'],
    ['createdAt', 'ASC'],
    ['updatedAt', 'DESC'],
    ['updatedAt', 'ASC'],
    ['title', 'DESC'],
    ['title', 'ASC'],
    ['price', 'DESC'],
    ['price', 'ASC'],
  ] as const)('supports sorting by %s %s with a deterministic ID tie-breaker', (field, direction) => {
    const query = build({ sort: { field, direction } });
    const nullsLast = field === 'price' ? ' NULLS LAST' : '';
    expect(query.sql).toContain(`ORDER BY m.k0 ${direction}${nullsLast}, m.id ${direction}`);
    expect(query.sql).toContain(`ORDER BY pg.k0 ${direction}${nullsLast}, pg.id ${direction}`);
  });

  it('defaults to relevance sorting for search, unless an explicit sort is supplied', () => {
    const relevance = build({ search: 'lamp' });
    const explicit = build({ search: 'lamp', sort: { field: 'title', direction: 'ASC' } });

    expect(relevance.sql).toContain('p."title" &@ $1 OR p."description" &@ $1');
    expect(relevance.sql).toContain('pgroonga_score(p.tableoid, p.ctid) AS k0');
    expect(relevance.sql).toContain('p."createdAt" AS k1');
    expect(relevance.sql).toContain('ORDER BY m.k0 DESC, m.k1 DESC, m.id DESC');
    expect(explicit.sql).not.toContain('pgroonga_score');
    expect(explicit.sql).toContain('p."title" AS k0');
    expect(explicit.sql).toContain('ORDER BY m.k0 ASC, m.id ASC');
  });

  it('does not interpolate search text or other filter values into SQL', () => {
    const maliciousSearch = "lamp' OR 1=1 --";
    const query = build({ search: maliciousSearch, brandId: IDS.brandA });

    expect(query.sql).not.toContain(maliciousSearch);
    expect(query.sql).not.toContain(IDS.brandA);
    expect(query.parameters).toContain(maliciousSearch);
    expect(query.parameters).toContain(IDS.brandA);
  });

  it('projects only the requested product fields in their supplied order', () => {
    const query = build({ product: ['salesStatus', 'description', 'visibility'] });

    const salesStatusIndex = query.sql.indexOf('\'salesStatus\', p."salesStatus"');
    const descriptionIndex = query.sql.indexOf('\'description\', p."description"');
    const visibilityIndex = query.sql.indexOf('\'visibility\', p."visibility"');

    expect(salesStatusIndex).toBeGreaterThan(-1);
    expect(descriptionIndex).toBeGreaterThan(salesStatusIndex);
    expect(visibilityIndex).toBeGreaterThan(descriptionIndex);
    expect(query.sql).not.toContain('\'brandId\', p."brandId"');
  });

  it('adds variant output only when at least one variant field is requested', () => {
    const withoutVariants = build();
    const withVariants = build({ variant: ['title', 'price', 'info', 'sortOrder'] });

    expect(withoutVariants.sql).not.toContain("'variants'");
    expect(withVariants.sql).toContain("'variants', COALESCE(vs.variants, '[]'::jsonb)");
    expect(withVariants.sql).toContain('\'id\', v."id"');
    expect(withVariants.sql).toContain('\'productId\', v."productId"');
    expect(withVariants.sql).toContain('\'title\', v."title"');
    expect(withVariants.sql).toContain('\'price\', v."price"');
    expect(withVariants.sql).toContain('\'info\', v."info"');
    expect(withVariants.sql).toContain('\'sortOrder\', v."sortOrder"');
    expect(withVariants.sql).toContain('jsonb_agg(jsonb_build_object');
  });

  it('reuses variant visibility placeholders across filtering, pricing, sorting and projection', () => {
    const query = build({
      variantVisibility: 'public',
      minPrice: 100,
      maxPrice: 500,
      sort: { field: 'price', direction: 'DESC' },
      variant: ['price'],
      page: 2,
      limit: 5,
    });

    // The price-sort join allocates the shared visibility parameter first.
    expect(query.parameters).toEqual(['public', 100, 500, 5, 5]);
    expect(query.sql.match(/v\."visibility" = \$1/g)).toHaveLength(4);
    expect(query.sql).toContain('LIMIT $4 OFFSET $5');
  });

  it('binds every active filter in deterministic SQL allocation order', () => {
    const query = build({
      search: 'desk',
      visibility: 'public',
      variantVisibility: 'public',
      salesStatus: 'active',
      brandId: IDS.brandA,
      category: { categoryIds: [IDS.categoryParent], includeCategoryDescendants: false },
      minPrice: 50,
      maxPrice: 500,
      sort: { field: 'title', direction: 'ASC' },
      page: 3,
      limit: 10,
      variant: ['price'],
    });

    expect(query.parameters).toEqual([
      'desk',
      'public',
      'public',
      'active',
      IDS.brandA,
      [IDS.categoryParent],
      50,
      500,
      10,
      20,
    ]);
    expect(query.sql).toContain('p."title" &@ $1 OR p."description" &@ $1');
    expect(query.sql).toContain('p."visibility" = $2');
    expect(query.sql).toContain('v."visibility" = $3');
    expect(query.sql).toContain('p."salesStatus" = $4');
    expect(query.sql).toContain('p."brandId" = $5');
    expect(query.sql).toContain('pc."categoryId" = ANY($6::uuid[])');
    expect(query.sql).toContain('v."price" >= $7 AND v."price" <= $8');
    expect(query.sql).toContain('LIMIT $9 OFFSET $10');
  });

  it('returns normalized pagination and binds its limit and offset', () => {
    const query = build({ page: 4, limit: 7 });

    expect(query.pagination).toEqual({ page: 4, limit: 7 });
    expect(query.parameters.slice(-2)).toEqual([7, 21]);
    expect(query.sql).toContain('LIMIT $1 OFFSET $2');
  });

  it('reuses the same SQL for different values of the same shape', () => {
    const first = build({ brandId: IDS.brandA, page: 1, limit: 10 });
    const second = build({ brandId: IDS.brandB, page: 3, limit: 5 });

    expect(second.sql).toBe(first.sql);
    expect(second.parameters).not.toEqual(first.parameters);
  });

  it.each([
    [
      'category mode',
      { category: { categoryIds: [IDS.categoryParent], includeCategoryDescendants: false } },
      { category: { categoryIds: [IDS.categoryParent], includeCategoryDescendants: true } },
    ],
    ['sort direction', { sort: { field: 'title', direction: 'ASC' } }, { sort: { field: 'title', direction: 'DESC' } }],
    ['product projection', { product: ['description'] }, { product: ['visibility'] }],
    [
      'product projection order',
      { product: ['description', 'visibility'] },
      { product: ['visibility', 'description'] },
    ],
    ['variant projection', { variant: ['price'] }, { variant: ['title'] }],
    ['variant projection order', { variant: ['title', 'price'] }, { variant: ['price', 'title'] }],
    ['variant projection presence', {}, { variant: ['price'] }],
  ] as const)('creates a different cached SQL shape when %s changes', (_name, firstOptions, secondOptions) => {
    expect(build(firstOptions).sql).not.toBe(build(secondOptions).sql);
  });
});

describe('FindAllProductsQueryBuilder — PGlite execution', () => {
  it('executes the default query and returns products newest-first with a total', async () => {
    const row = await execute();
    const products = readProducts(row);

    expect(row.total).toBe(4);
    expect(ids(products)).toEqual([IDS.product4, IDS.product3, IDS.product2, IDS.product1]);
    expect(products[0].variants).toBeUndefined();
    expect(products[3].product.coverImageId).toBe(IDS.image1);
    expect(Object.keys(products[0].product).sort()).toEqual(
      ['id', 'title', 'createdAt', 'updatedAt', 'coverImageId'].sort(),
    );
  });

  it('executes product visibility, sales status and brand filters together', async () => {
    const row = await execute({ visibility: 'public', salesStatus: 'active', brandId: IDS.brandA });

    expect(row.total).toBe(2);
    expect(ids(readProducts(row))).toEqual([IDS.product4, IDS.product1]);
  });

  it('executes direct category filtering', async () => {
    const row = await execute({
      category: { categoryIds: [IDS.categoryParent], includeCategoryDescendants: false },
    });

    expect(row.total).toBe(1);
    expect(ids(readProducts(row))).toEqual([IDS.product1]);
  });

  it('executes descendant category filtering using categories.path', async () => {
    const row = await execute({
      category: { categoryIds: [IDS.categoryParent], includeCategoryDescendants: true },
    });

    expect(row.total).toBe(2);
    expect(ids(readProducts(row))).toEqual([IDS.product2, IDS.product1]);
  });

  it('matches an explicitly empty category list to no products', async () => {
    const row = await execute({ category: { categoryIds: [], includeCategoryDescendants: false } });

    expect(row.total).toBe(0);
    expect(readProducts(row)).toEqual([]);
  });

  it('executes min/max price filtering against the same variant row', async () => {
    const row = await execute({ minPrice: 200, maxPrice: 400 });

    // Alpha has 100 and 500, but neither variant individually satisfies 200..400.
    expect(row.total).toBe(1);
    expect(ids(readProducts(row))).toEqual([IDS.product2]);
  });

  it('executes min-only and max-only price filters', async () => {
    const minOnly = await execute({ minPrice: 200 });
    const maxOnly = await execute({ maxPrice: 100 });

    expect(ids(readProducts(minOnly))).toEqual([IDS.product2, IDS.product1]);
    expect(ids(readProducts(maxOnly))).toEqual([IDS.product3, IDS.product1]);
  });

  it('uses variant visibility consistently to hide products and variants', async () => {
    const row = await execute({ variantVisibility: 'public', variant: ['title', 'price'] });
    const products = readProducts(row);

    expect(row.total).toBe(2);
    expect(ids(products)).toEqual([IDS.product2, IDS.product1]);
    expect(products[0].variants?.map((variant) => variant.title)).toEqual(['Single']);
    expect(products[1].variants?.map((variant) => variant.title)).toEqual(['Standard', 'Premium']);
  });

  it('returns an empty variants array when a product has no variants and variants are requested', async () => {
    const row = await execute({ visibility: 'public', variant: ['title'] });
    const products = readProducts(row);
    const withoutVariants = products.find(({ product }) => product.id === IDS.product4);

    expect(withoutVariants?.variants).toEqual([]);
  });

  it('sorts by minimum variant price and places products without variants last', async () => {
    const row = await execute({ sort: { field: 'price', direction: 'ASC' } });

    expect(ids(readProducts(row))).toEqual([IDS.product1, IDS.product3, IDS.product2, IDS.product4]);
  });

  it('sorts by title in both directions', async () => {
    const ascending = await execute({ sort: { field: 'title', direction: 'ASC' } });
    const descending = await execute({ sort: { field: 'title', direction: 'DESC' } });

    expect(ids(readProducts(ascending))).toEqual([IDS.product1, IDS.product2, IDS.product4, IDS.product3]);
    expect(ids(readProducts(descending))).toEqual([IDS.product3, IDS.product4, IDS.product2, IDS.product1]);
  });

  it('paginates products while keeping total independent from the requested page', async () => {
    const secondPage = await execute({ page: 2, limit: 2 });
    const outOfRange = await execute({ page: 20, limit: 2 });

    expect(ids(readProducts(secondPage))).toEqual([IDS.product2, IDS.product1]);
    expect(secondPage.total).toBe(4);
    expect(readProducts(outOfRange)).toEqual([]);
    expect(outOfRange.total).toBe(4);
  });

  it('executes search SQL using a test operator and test scoring function', async () => {
    const row = await execute({ search: 'Lamp' });

    expect(row.total).toBe(1);
    expect(ids(readProducts(row))).toEqual([IDS.product1]);
  });

  it('executes search with an explicit sort instead of relevance sorting', async () => {
    const row = await execute({ search: 'Wide', sort: { field: 'title', direction: 'ASC' } });

    expect(row.total).toBe(1);
    expect(ids(readProducts(row))).toEqual([IDS.product3]);
  });

  it('executes a broad combination of filters, requested fields, variants and pagination', async () => {
    const row = await execute({
      visibility: 'public',
      variantVisibility: 'public',
      salesStatus: 'active',
      brandId: IDS.brandA,
      minPrice: 50,
      maxPrice: 150,
      product: ['description', 'visibility'],
      variant: ['title', 'price', 'info'],
      sort: { field: 'price', direction: 'ASC' },
      page: 1,
      limit: 10,
    });

    expect(row.total).toBe(1);
    const [item] = readProducts(row);
    expect(item.product.id).toBe(IDS.product1);
    expect(item.product.description).toBe('Warm desk lamp');
    expect(item.variants?.map((variant) => variant.title)).toEqual(['Standard', 'Premium']);
  });
});
