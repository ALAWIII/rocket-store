import { FindAllProductsSearchOptions } from '../product.repository';

export interface BuiltQuery {
  query: string;
  values: unknown[];
  pagination: { page: number; limit: number };
}

export class FindAllProductsQueryBuilder {
  private conditions: string[] = [];
  private params: unknown[] = [];
  private hasSearch = false;

  constructor(private readonly options: FindAllProductsSearchOptions) {}

  build(): BuiltQuery {
    this.conditions = [];
    this.params = [];
    this.hasSearch = false;

    const { page, limit } = FindAllProductsQueryBuilder.normalizePagination(this.options);

    const search = this.options.search?.trim();

    if (search) {
      const searchParam = this.addParam(search);
      this.conditions.push(`(p.title &@ $${searchParam} OR p.description &@ $${searchParam})`);
      this.hasSearch = true;
    }

    if (this.options.status) {
      const statusParam = this.addParam(this.options.status);
      this.conditions.push(`p.status = $${statusParam}`);
    }

    if (this.options.brandId) {
      const brandParam = this.addParam(this.options.brandId);
      this.conditions.push(`p."brandId" = $${brandParam}`);
    }

    if (this.options.category) {
      const categoryIds = this.options.category.categoryIds?.filter(Boolean) ?? [];

      if (categoryIds.length === 0) {
        this.conditions.push('FALSE');
      } else {
        const categoryParam = this.addParam(categoryIds);

        if (this.options.category.includeCategoryDescendants) {
          this.conditions.push(`
            EXISTS (
              SELECT 1
              FROM product_categories pc
              JOIN categories c ON c.id = pc."categoryId"
              WHERE pc."productId" = p.id
                AND (
                  c.id = ANY($${categoryParam}::uuid[])
                  OR c.path && $${categoryParam}::uuid[]
                )
            )
          `);
        } else {
          this.conditions.push(`
            EXISTS (
              SELECT 1
              FROM product_categories pc
              WHERE pc."productId" = p.id
                AND pc."categoryId" = ANY($${categoryParam}::uuid[])
            )
          `);
        }
      }
    }

    const where = this.conditions.length > 0 ? `WHERE ${this.conditions.join('\n AND ')}` : '';

    const [orderBy, scoreSelection] = this.hasSearch
      ? [`ORDER BY score DESC, "createdAt" DESC, id DESC`, ', pgroonga_score(p.tableoid, p.ctid) AS score']
      : [`ORDER BY "createdAt" DESC, id DESC`, ''];

    const limitParam = this.addParam(limit);
    const offsetParam = this.addParam((page - 1) * limit);

    const query = /*sql*/ `
      WITH filtered AS (
        SELECT
          p.*,
          row_to_json(img) AS "coverImage"
          ${scoreSelection}
        FROM products p
        LEFT JOIN product_images pi ON pi."productId" = p.id
        LEFT JOIN images img ON img.id = pi."imageId"
        ${where}
      ),
      paginated AS (
        SELECT *
        FROM filtered
        ${orderBy}
        LIMIT $${limitParam}
        OFFSET $${offsetParam}
      )
      SELECT
        COALESCE(
          (SELECT json_agg(to_jsonb(pg) - 'score') FROM paginated pg),
          '[]'::json
        ) AS products,
        (SELECT COUNT(*) FROM filtered) AS total;
    `;

    return {
      query,
      values: this.params,
      pagination: { page, limit },
    };
  }

  private addParam(value: unknown): number {
    this.params.push(value);
    return this.params.length;
  }

  private static normalizePagination(pagination: { page?: number; limit?: number }) {
    const rawPage = Number(pagination.page ?? 1);
    const rawLimit = Number(pagination.limit ?? 25);

    const page = Number.isFinite(rawPage) && rawPage > 0 ? Math.floor(rawPage) : 1;

    const limit = Number.isFinite(rawLimit) && rawLimit > 0 ? Math.min(Math.floor(rawLimit), 100) : 25;

    return { page, limit };
  }
}
