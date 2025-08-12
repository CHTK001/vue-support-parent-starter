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
  systemDataSettingTimeoutMs?: number;
  systemDataSettingIsFile?: boolean;
  systemDataSettingEnabled?: boolean;
  systemDataSettingConfig?: string;
}

export function listSystemDataSettings() {
  return request({ url: "/system/data/setting/list", method: "get" });
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
