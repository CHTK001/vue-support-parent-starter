export type Config = {
  pageSize: number;
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
  successCode: "00000",
  page: 1,
  paginationLayout: "total, sizes, prev, pager, next",
  request: {
    page: "page",
    pageSize: "pageSize"
  }
};

export const parseData = res => {
  return {
    //分析无分页的数据字段结构
    data: res.data || res.rows,
    rows: res.data || res.rows, //分析行数据字段结构
    total: res.total ?? res?.recordsTotal ?? 0, //分析总数字段结构
    summary: res.summary, //分析合计行字段结构
    msg: res.message, //分析描述字段结构
    code: res.code //分析状态字段结构
  };
};

export default config;
