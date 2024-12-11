import { storageSession } from "@pureadmin/utils";
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
  pageSize: 12,
  pageSizes: [12, 24, 36, 48, 56],
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
    data: res.data?.data || res.data?.rows,
    rows: res.data?.data || res.data?.rows, //分析行数据字段结构
    total: res.data?.total ?? res?.data?.recordsTotal ?? 0, //分析总数字段结构
    summary: res.summary, //分析合计行字段结构
    msg: res.msg || res.message, //分析描述字段结构
    code: res.code //分析状态字段结构
  };
};

/**
 * 自定义列保存处理
 * @tableName scTable组件的props->tableName
 * @column 用户配置好的列
 */
export const columnSettingSave = (tableName, column) => {
  return new Promise(resolve => {
    setTimeout(() => {
      //这里为了演示使用了session和setTimeout演示，开发时应用数据请求
      storageSession().setItem(tableName, column);
      resolve(true);
    }, 1000);
  });
};
/**
 * 获取自定义列
 * @tableName scTable组件的props->tableName
 * @column 组件接受到的props->column
 */
export const columnSettingGet = (tableName, column) => {
  return new Promise(resolve => {
    //这里为了演示使用了session和setTimeout演示，开发时应用数据请求
    const userColumn = storageSession().getItem(tableName);
    if (userColumn) {
      resolve(userColumn);
    } else {
      resolve(column);
    }
  });
};
/**
 * 重置自定义列
 * @tableName scTable组件的props->tableName
 * @column 组件接受到的props->column
 */
export const columnSettingReset = (tableName, column) => {
  return new Promise(resolve => {
    //这里为了演示使用了session和setTimeout演示，开发时应用数据请求
    setTimeout(() => {
      storageSession().removeItem(tableName);
      resolve(column);
    }, 1000);
  });
};

export default config;
