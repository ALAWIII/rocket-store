export const MOVE_CATEGORY_SQL = /*sql*/ `
  WITH current_cat AS (
  SELECT id, path, array_length(path, 1) AS path_length
  FROM categories
  WHERE id = $1
), new_parent AS (
  SELECT id, path
  FROM categories
  WHERE id = $2
    AND $2 IS NOT NULL
), validation AS (
  SELECT CASE WHEN NOT EXISTS (
      SELECT 1
      FROM current_cat) THEN
      'CAT_NOT_FOUND'
    WHEN $2 IS NOT NULL
      AND NOT EXISTS (
        SELECT 1
        FROM new_parent) THEN
      'PARENT_NOT_FOUND'
    WHEN $2 IS NOT NULL
      AND EXISTS (
        SELECT 1
        FROM new_parent
        WHERE path @> ARRAY[$1]::uuid[]) THEN
      'CYCLE_DETECTED'
    ELSE
      'OK'
    END AS status
), new_path AS (
  SELECT CASE WHEN $2 IS NULL THEN
      ARRAY[$1]::uuid[]
    ELSE
      (
        SELECT path
        FROM new_parent) || $1::uuid
    END AS path
  WHERE (
    SELECT status
    FROM validation) = 'OK'
), update_descendants AS (
  UPDATE
    categories
  SET path = (
      SELECT path
      FROM new_path) || path[(
        SELECT path_length
        FROM current_cat) + 1:]
      WHERE path @> (
          SELECT path
          FROM current_cat)
          AND id != $1
          AND (
            SELECT status
            FROM validation) = 'OK'
), update_cat AS (
  UPDATE
    categories
  SET "parentId" = $2, path = (
      SELECT path
      FROM new_path)
    WHERE id = $1
      AND (
        SELECT status
        FROM validation) = 'OK'
      RETURNING *
)
  SELECT row_to_json(u) AS category, v.status AS status
    FROM validation v
  LEFT JOIN update_cat u ON TRUE;
`;
