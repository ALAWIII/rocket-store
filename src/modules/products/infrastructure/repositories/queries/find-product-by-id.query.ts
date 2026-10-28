/**
 * @param $1 `productId`
 * @param $2 `variants`   : flag to fetch all product variants
 * @param $3 `brand`      : flag to fetch the brand
 * @param $4 `categories` : flag to fetch categories
 *
 */
export const FIND_PRODUCT_BY_ID_SQL =
  /*sql*/
  `
  WITH find_product AS (
    SELECT * FROM products WHERE id = $1
  ),

  find_variants AS (
    SELECT
      pv.*,
      COALESCE(json_agg(img) FILTER (WHERE img.id IS NOT NULL), '[]') AS images
    FROM product_variants pv
    LEFT JOIN product_variant_images pvi
      ON pvi."productVariantId" = pv.id
    LEFT JOIN images img
      ON img.id = pvi."imageId"
    WHERE pv."productId" = $1
      AND $2
    GROUP BY pv.id
  ),

  find_brand AS (
    SELECT b.*, row_to_json(img) AS logo
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
    JOIN categories c
      ON c.id = pc."categoryId"
    WHERE pc."productId" = $1
      AND $4
  )
  SELECT
    (SELECT row_to_json(fp) FROM find_product fp)                AS product,
    (SELECT row_to_json(b) FROM find_brand b)                    AS brand,

    COALESCE(
       (SELECT json_agg(row_to_json(v))
        FROM find_variants v),
       '[]'::json
     ) AS variants,

    COALESCE(
      (SELECT json_agg(row_to_json(c)) FROM find_categories c),
      '[]'::json
      ) AS categories;
  `;
