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

const resolvePagePayload = payload => {
  if (!payload) {
    return { rows: [], total: 0 };
  }

  const candidates = [payload, payload.data].filter(Boolean);

  for (const item of candidates) {
    if (Array.isArray(item)) {
      return {
        rows: item,
        total: payload?.total ?? item.length,
      };
    }

    if (Array.isArray(item?.data)) {
      return {
        rows: item.data,
        total: item.total ?? payload?.total ?? item.data.length,
      };
    }

    if (Array.isArray(item?.rows)) {
      return {
        rows: item.rows,
        total: item.total ?? payload?.total ?? item.rows.length,
      };
    }

    if (Array.isArray(item?.records)) {
      return {
        rows: item.records,
        total: item.total ?? item.recordsTotal ?? payload?.total ?? item.records.length,
      };
    }
  }

  return {
    rows: [],
    total: payload?.total ?? payload?.recordsTotal ?? 0,
  };
};

export const parseData = res => {
  const payload = res?.data;
  const { rows, total } = resolvePagePayload(payload);
  const normalizedCode =
    res?.success !== false && (res?.code === 200 || res?.code == null)
      ? config.successCode
      : res?.code;

  return {
    // 分析无分页/分页数据字段结构，统一只兼容一层容器
    data: rows,
    rows,
    total,
    summary: res?.summary ?? payload?.summary,
    msg: res?.msg || res?.message,
    code: normalizedCode,
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
