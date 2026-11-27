/**
 * @param $1 `productId`
 * @param $2 `variants`          : flag to fetch all product variants
 * @param $3 `brand`             : flag to fetch the brand
 * @param $4 `categories`        : flag to fetch categories
 * @param $5 `visibility`        : optional product visibility filter
 * @param $6 `variantVisibility` : optional variant visibility filter
 *
 * $6 non-null ⇒ customer view: product must have ≥1 variant with that visibility.
 * Variant-less products are incomplete (not sellable) and intentionally excluded.
 *
 * Pass NULL to disable either visibility filter.
 */
export const FIND_PRODUCT_BY_ID_SQL =
  /*sql*/
  `
  WITH find_product AS (
    SELECT
      p.*,
      row_to_json(img) AS "coverImage"
    FROM products p
    LEFT JOIN product_images pi
      ON pi."productId" = p.id
    LEFT JOIN images img
      ON img.id = pi."imageId"
    WHERE p.id = $1
      AND ($5::varchar IS NULL OR p."visibility" = $5)
      AND (
        $6::varchar IS NULL
        OR EXISTS (
          SELECT 1
          FROM product_variants pv
          WHERE pv."productId" = p.id
            AND pv."visibility" = $6
        )
      )
  ),

  find_variants AS (
    SELECT
      pv.*,
      COALESCE(
        json_agg(img ORDER BY pvi."sortOrder" ASC) FILTER (WHERE img.id IS NOT NULL),
        '[]'::json
      ) AS images
    FROM find_product fp
    JOIN product_variants pv
      ON pv."productId" = fp.id
    LEFT JOIN product_variant_images pvi
      ON pvi."productVariantId" = pv.id
    LEFT JOIN images img
      ON img.id = pvi."imageId"
    WHERE $2
      AND ($6::varchar IS NULL OR pv."visibility" = $6)
    GROUP BY pv.id
  ),

  find_brand AS (
    SELECT
      b.*,
      row_to_json(img) AS logo
    FROM brands b
    JOIN find_product fp
      ON b.id = fp."brandId"
    LEFT JOIN brand_images bi
      ON bi."brandId" = b.id
     AND bi."imageRole" = 'logo'
    LEFT JOIN images img
      ON img.id = bi."imageId"
    WHERE $3
  ),

  find_categories AS (
    SELECT c.*
    FROM product_categories pc
    JOIN find_product fp ON fp.id = pc."productId"
    JOIN categories c   ON c.id = pc."categoryId"
    WHERE $4
  )
  SELECT
    (SELECT row_to_json(fp) FROM find_product fp) AS product,
    (SELECT row_to_json(b) FROM find_brand b) AS brand,

    COALESCE(
      (SELECT json_agg(row_to_json(v))
       FROM find_variants v),
      '[]'::json
    ) AS variants,

    COALESCE(
      (SELECT json_agg(row_to_json(c))
       FROM find_categories c),
      '[]'::json
    ) AS categories;
  `;
