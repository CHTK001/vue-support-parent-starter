import { http, type ReturnResult } from "@repo/utils";

export interface SysAiGlobalSetting {
  sysAiGlobalSettingId?: number;
  sysAiGlobalSettingGroup?: string;
  sysAiGlobalSettingField: string;
  sysAiGlobalSettingValue?: string;
  sysAiGlobalSettingValueType: string;
  sysAiGlobalSettingDescription?: string;
  sysAiGlobalSettingSort?: number;
}

export const listAiGlobalSettings = async (sysAiGlobalSettingGroup = "default") => {
  return http.request<ReturnResult<SysAiGlobalSetting[]>>(
    "get",
    "/v2/ai/global-setting/list",
    {
      params: { sysAiGlobalSettingGroup },
    },
  );
};

export const replaceAiGlobalSettings = async (
  settings: SysAiGlobalSetting[],
  sysAiGlobalSettingGroup = "default",
) => {
  return http.request<ReturnResult<boolean>>(
    "post",
    "/v2/ai/global-setting/replace",
    {
      data: {
        sysAiGlobalSettingGroup,
        settings,
      },
    },
  );
};
