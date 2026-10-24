export const UPDATE_VARIANT_IMAGE_SORT_ORDER_SQL =
  /*sql*/
  `
  UPDATE product_variant_images AS pvi
  SET "sortOrder" = v.sort_order,
      "updatedAt" = now()
  FROM unnest($1::uuid[], $2::integer[]) AS v(id, sort_order)
  WHERE pvi."productVariantId" = $3
    AND pvi.id = v.id
  RETURNING *;
  `;
