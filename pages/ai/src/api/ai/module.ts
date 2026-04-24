import { http, type ReturnResult } from "@repo/utils";

export type AiModuleType =
  | "LLM"
  | "IMAGE"
  | "VIDEO"
  | "FACE"
  | "COLORIZATION"
  | "RESOLUTION";

export interface AiModule {
  sysAiModuleId?: number;
  sysAiModuleName: string;
  sysAiModuleCode: string;
  sysAiModuleModelId?: string;
  sysAiModuleImage?: string;
  sysAiModuleType: AiModuleType;
  sysAiModuleVendor?: string;
  sysAiModuleManufacturers?: string;
  sysAiModuleUrl?: string;
  sysAiModuleVersion?: string;
  sysAiModuleStatus?: number;
  sysAiModuleSort?: number;
  sysAiModuleVlm?: number;
  sysAiModuleSupportThink?: number;
  sysAiModuleSupportOptimize?: number;
  sysAiModuleLocal?: number;
  sysAiModuleInputPrice?: number;
  sysAiModuleOutputPrice?: number;
  sysAiModuleCachePrice?: number;
  sysAiModuleGenerateLimit?: number;
  sysAiModuleSupportTemplate?: number;
  sysAiModuleSupportStyle?: number;
  sysAiModuleRemark?: string;
}

export const listAiModules = async (
  sysAiModuleType?: string,
  sysAiModuleVendor?: string,
) => {
  return http.request<ReturnResult<AiModule[]>>("get", "/v2/ai/module/list", {
    params: { sysAiModuleType, sysAiModuleVendor },
  });
};

export const pageAiModules = async (params?: Record<string, unknown>) => {
  return http.request<
    ReturnResult<{
      records: AiModule[];
      total: number;
      size: number;
      current: number;
      pages: number;
    }>
  >("get", "/v2/ai/module/page", { params });
};

export const saveAiModule = async (data: AiModule) => {
  return http.request<ReturnResult<AiModule>>("post", "/v2/ai/module/save", {
    data,
  });
};

export const updateAiModule = async (data: AiModule) => {
  return http.request<ReturnResult<boolean>>("put", "/v2/ai/module/update", {
    data,
  });
};

export const deleteAiModule = async (sysAiModuleId: number) => {
  return http.request<ReturnResult<boolean>>("delete", "/v2/ai/module/delete", {
    params: { sysAiModuleId },
  });
};
