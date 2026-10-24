export const UPDATE_PRODUCT_VARIANT_SORT_ORDER_SQL =
  /*sql*/
  `
  UPDATE product_variants AS pv
  SET "sortOrder" = v.sort_order
  FROM unnest($1::uuid[], $2::integer[]) AS v(id, sort_order)
  WHERE pv."productId" = $3
    AND pv.id = v.id
  RETURNING *;
  `;
