import { getConfig } from "@repo/config";
import request from "./config";

export interface SystemDataSetting {
  systemDataSettingId?: number;
  systemDataSettingName: string;
  systemDataSettingType: string; // SPI 类型: JDBC/REDIS/...
  systemDataSettingServer?: string;
  systemDataSettingHost?: string;
  systemDataSettingPort?: number;
  systemDataSettingUsername?: string;
  systemDataSettingPassword?: string;
  systemDataSettingAuthType?: string;
  systemDataSettingIcon?: string;
  systemDataSettingConsoleType?: "TABLE" | "GRAPH" | "FILE";
  /** 图表类型 */
  systemDataSettingChartType?: string;
  /** 协议（如 jdbc:mysql、redis 等） */
  systemDataSettingProtocol?: string;
  systemDataSettingTimeoutMs?: number;
  /** 模式：REMOTE/FILE */
  systemDataSettingMode?: "REMOTE" | "FILE";
  systemDataSettingEnabled?: boolean;
  systemDataSettingConfig?: string;
  /** JDBC 驱动类名（仅数据库类型使用） */
  systemDataSettingDriverClass?: string;
  /** JDBC 驱动文件路径（仅数据库类型使用） */
  systemDataSettingDriverPath?: string;
  /** 远程图片地址 */
  systemDataSettingImageUrl?: string;
}

export function listSystemDataSettings() {
  return request({ url: "/system/data/setting/list", method: "get" });
}

export function pageSystemDataSettings(params: { current?: number; size?: number; name?: string; type?: string }) {
  return request({ url: "/system/data/setting/page", method: "get", params });
}

export function saveSystemDataSetting(data: SystemDataSetting) {
  return request({ url: "/system/data/setting/save", method: "post", data });
}

export function deleteSystemDataSetting(id: number) {
  return request({ url: `/system/data/setting/${id}`, method: "delete" });
}

export function getSystemDataCapabilities(id: number) {
  return request({
    url: `/system/data/setting/${id}/capabilities`,
    method: "get",
  });
}

export function getConsoleConfig(id: number) {
  return request({
    url: `/system/data/setting/${id}/console/config`,
    method: "get",
  });
}

export function saveConsoleConfig(id: number, config: any) {
  return request({
    url: `/system/data/setting/${id}/console/config`,
    method: "post",
    data: typeof config === "string" ? config : JSON.stringify(config),
  });
}

/**
 * 上传 JDBC 驱动文件
 */
export function uploadJdbcDriver(id: number, file: File) {
  const form = new FormData();
  form.append("file", file);
  return request({
    url: `/system/data/setting/${id}/driver/upload`,
    method: "post",
    data: form,
    headers: { "Content-Type": "multipart/form-data" },
  });
}

/**
 * 文档HTML
 */
export function getDocumentHtmlUrl(id: number) {
  return `${getConfig().BaseUrl}/system/data/setting/${id}/document/html`;
}

export function startBackup(id: number) {
  return request({ url: `/system/data/setting/${id}/backup/start`, method: 'post' })
}
export function stopBackup(id: number) {
  return request({ url: `/system/data/setting/${id}/backup/stop`, method: 'post' })
}
export function backupStatus(id: number) {
  return request({ url: `/system/data/setting/${id}/backup/status`, method: 'get' })
}

/**
 * 查询系统数据（RedisSearchService）
 */
export function querySystemDataSeries(params: {
  name: string; // 例如 system:data:backup 或 system:data:log
  keyword?: string;
  fromTimestamp?: number;
  toTimestamp?: number;
  offset?: number;
  count?: number;
  sort?: string;
}) {
  return request({ url: "/v1/search/series", method: "get", params });
}

/**
 * 聚合查询系统数据
 */
export function aggregateSystemData(params: {
  name: string;
  keyword?: string;
  fromTimestamp?: number;
  toTimestamp?: number;
  offset?: number;
  count?: number;
  sort?: string;
  // 透传聚合参数
  [key: string]: any;
}) {
  return request({ url: "/v1/search/aggregate", method: "get", params });
}

/**
 * 下载备份文件
 */
export function downloadBackup(settingId: number, path: string) {
  return request({
    url: `/system/data/console/${settingId}/backup/download`,
    method: 'get',
    params: { path },
    responseType: 'blob'
  })
}

/**
 * 字段注释：查询
 * @param settingId 数据源配置ID
 * @param nodePath 节点路径（库/表/列 唯一定位）
 */
export function getFieldComment(settingId: number, nodePath: string) {
  return request({ url: `/system/data/console/${settingId}/field/comment`, method: 'get', params: { nodePath } })
}

/**
 * 字段注释：保存
 * @param settingId 数据源配置ID
 * @param payload 包含节点路径与注释内容
 */
export function saveFieldComment(settingId: number, payload: { nodePath: string; comment: string }) {
  return request({ url: `/system/data/console/${settingId}/field/comment`, method: 'post', data: payload })
}