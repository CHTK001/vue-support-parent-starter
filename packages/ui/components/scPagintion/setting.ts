export type Config = {
  pageSize: number;
  pageSizes: number[];
  page: number;
  paginationLayout: string;
  successCode: string | number;
  request: Request;
};

export type Request = {
  page: string;
  pageSize: string;
  order?: string;
  prop?: string;
};

export const config: Config = {
  pageSize: 10,
  pageSizes: [10, 20, 30, 40, 50],
  successCode: "00000",
  page: 1,
  paginationLayout: "total, sizes, prev, pager, next",
  request: {
    page: "page",
    pageSize: "pageSize"
  }
};

export default config;
