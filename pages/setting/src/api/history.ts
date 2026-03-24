import { http, type ReturnResult } from "@repo/utils";

export type SettingHistory = {
  sysSettingHistoryId: number;
  sysSettingId: number;
  sysSettingName: string;
  sysSettingGroup: string;
  sysSettingOldValue: string;
  sysSettingNewValue: string;
  sysSettingOperation: string;
  sysSettingOperatorId: string;
  sysSettingOperatorName: string;
  sysSettingRemark: string;
  sysSettingBatchNo: string;
  createTime: string;
};

export type PageResult<T> = {
  records: T[];
  total: number;
  size: number;
  current: number;
};

/** 导出配置 */
export const fetchExportSettings = (group?: string) => {
  const params = group ? { group } : {};
  return http.request<ReturnResult<string>>("get", "/v2/setting/export", {
    params,
  });
};

/** 导入配置 */
export const fetchImportSettings = (json: string, overwrite: boolean) => {
  const params = { overwrite };
  return http.request<ReturnResult<string>>("post", "/v2/setting/import", {
    params,
    data: json,
    headers: {
      "Content-Type": "text/plain",
    },
  });
};

/** 分页查询变更历史 */
export const fetchHistoryPage = (params: {
  page?: number;
  pageSize?: number;
  settingId?: number;
  group?: string;
}) => {
  return http.request<ReturnResult<PageResult<SettingHistory>>>(
    "get",
    "/v2/setting/history/page",
    { params }
  );
};

/** 根据批次号查询变更历史 */
export const fetchHistoryByBatch = (batchNo: string) => {
  const params = { batchNo };
  return http.request<ReturnResult<SettingHistory[]>>(
    "get",
    "/v2/setting/history/batch",
    { params }
  );
};

/** 回滚整个批次 */
export const fetchRollbackBatch = (batchNo: string) => {
  const params = { batchNo };
  return http.request<ReturnResult<boolean>>(
    "post",
    "/v2/setting/history/rollback/batch",
    { params }
  );
};

/** 回滚单条历史记录 */
export const fetchRollbackSingle = (historyId: number) => {
  const params = { historyId };
  return http.request<ReturnResult<boolean>>(
    "post",
    "/v2/setting/history/rollback/single",
    { params }
  );
};
