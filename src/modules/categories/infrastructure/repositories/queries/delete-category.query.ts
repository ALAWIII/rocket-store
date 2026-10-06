/**
 * delete-category.sql
 *
 * Deletes a category in a single, atomic database round trip.
 * Supports two modes based on the $2 parameter:
 *   1. withSubtree = true  : Deletes the category AND all its descendants.
 *   2. withSubtree = false : Deletes ONLY the category. Its direct children are
 *                            reparented to its grandparent, and all descendants
 *                            have the deleted ID removed from their materialized path.
 *
 * Parameters:
 *   $1: UUID    - The ID of the category to delete
 *   $2: boolean - Whether to delete the entire subtree (true) or just the node (false)
 *
 * Returns:
 *   { affected: number }[]
 */
export const DELETE_CATEGORY_SQL = /*sql*/ `
  WITH target AS (
    SELECT id, path, "parentId" AS grandparent_id
    FROM categories
    WHERE id = $1
  ),
  is_valid AS (
    SELECT EXISTS (SELECT 1 FROM target) AS valid
  ),
  update_descendants AS (
      UPDATE categories
      SET
        path = array_remove(path, $1::uuid),
        "parentId" = CASE
          WHEN "parentId" = $1 THEN (SELECT grandparent_id FROM target)
          ELSE "parentId"
        END
      WHERE path @> ARRAY[$1]::uuid[]
        AND id != $1
        AND NOT $2::boolean
        AND (SELECT valid FROM is_valid)
  ),
  delete_nodes AS (
    DELETE FROM categories
    WHERE CASE
        WHEN $2::boolean THEN path @> ARRAY[$1]::uuid[]
        ELSE id = $1
      END
      AND (SELECT valid FROM is_valid)
    RETURNING id
  )
  SELECT count(d.id)::int AS affected
  FROM  delete_nodes d ;
`;
