import { http, type ReturnResult } from "@repo/utils";

export type SysAiSettingValueType =
  | "STRING"
  | "NUMBER"
  | "BOOLEAN"
  | "JSON"
  | "SECRET";

export interface SysAiSetting {
  sysAiSettingId?: number;
  sysAiModuleId?: number;
  sysAiSettingField: string;
  sysAiSettingValue?: string;
  sysAiSettingValueType: SysAiSettingValueType | string;
  sysAiSettingDescription?: string;
  sysAiSettingSort?: number;
}

export const listAiSettings = async (
  sysAiModuleId?: number,
  sysAiSettingScope = "MODULE",
  sysAiSettingGroup = "module",
) => {
  return http.request<ReturnResult<SysAiSetting[]>>("get", "/v2/ai/setting/list", {
    params: { sysAiModuleId, sysAiSettingScope, sysAiSettingGroup },
  });
};

export const replaceAiSettings = async (
  sysAiModuleId: number | null,
  settings: SysAiSetting[],
  sysAiSettingScope = "MODULE",
  sysAiSettingGroup = "module",
) => {
  return http.request<ReturnResult<boolean>>("post", "/v2/ai/setting/replace", {
    data: {
      sysAiModuleId,
      sysAiSettingScope,
      sysAiSettingGroup,
      settings,
    },
  });
};
