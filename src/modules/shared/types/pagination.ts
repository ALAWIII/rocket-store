export type Pagination = {
  page: number;
  limit: number;
};
export type OutputPagination = {
  total: number;
} & Pagination;
