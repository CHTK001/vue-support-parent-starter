import { http, type ReturnResult } from "@repo/utils";
import type { AiModule } from "./module";

export interface ImageStudioTaskRequest {
  sysAiModuleCode: string;
  prompt: string;
  negativePrompt?: string;
  templateId?: number;
  styleCode?: string;
  size?: string;
  quality?: string;
  number?: number;
  parameters?: Record<string, unknown>;
}

export interface ImageStudioTask {
  sysAiTaskId: number;
  sysAiTaskType?: string;
  sysAiModuleCode?: string;
  sysAiTaskPrompt?: string;
  sysAiTaskRequest?: string;
  sysAiTaskResult?: string;
  sysAiTaskStatus?: string;
  sysAiTaskProgress?: number;
  sysAiTaskUrl?: string;
  sysAiTaskLocalUrl?: string;
  sysAiTaskRequestId?: string;
  createTime?: string;
  updateTime?: string;
}

export interface ImageStudioTaskDetail {
  taskId?: number;
  requestId?: string;
  taskStatus?: string;
  progress?: number;
  total?: number;
  succeeded?: number;
  failed?: number;
  summary?: string;
  message?: string;
  results?: Array<{
    url?: string;
    image?: string;
  }>;
  output?: {
    taskId?: number | string;
    taskStatus?: string;
    images?: string[];
    results?: Array<{ url?: string }>;
  };
}

export interface ImageStudioTemplate {
  sysAiTemplateId: number;
  sysAiTemplateName?: string;
  sysAiTemplateAddress?: string;
  sysAiTemplateRemark?: string;
  sysAiTemplateRecommendPrompt?: string;
  sysAiTemplateResolutions?: string;
  sysAiTemplateCategory?: string;
}

export interface ImageStudioStyle {
  sysAiStyleId: number;
  sysAiStyleName?: string;
  sysAiStyleCode?: string;
  sysAiStyleImage?: string;
}

export interface ImageStudioSetting {
  sysAiSettingField: string;
  sysAiSettingValue?: string;
  sysAiSettingValueType?: string;
  sysAiSettingDescription?: string;
}

export const createImageStudioTask = async (data: ImageStudioTaskRequest) => {
  return http.request<ReturnResult<ImageStudioTask>>("post", "/v2/ai/image/task", {
    data: {
      sysAiModuleCode: data.sysAiModuleCode,
      prompt: data.prompt,
      negativePrompt: data.negativePrompt,
      parameters: {
        templateId: data.templateId,
        styleCode: data.styleCode,
        size: data.size,
        quality: data.quality,
        number: data.number ?? 1,
        ...(data.parameters || {}),
      },
    },
  });
};

export const getImageStudioTask = async (taskId: number) => {
  return http.request<ReturnResult<ImageStudioTaskDetail>>("get", `/v2/ai/task/${taskId}`);
};

export const listImageStudioHistory = async () => {
  return http.request<ReturnResult<ImageStudioTask[]>>("get", "/v2/ai/task/history", {
    params: { taskType: "IMAGE" },
  });
};

export const listImageStudioTemplates = async (sysAiModuleId?: number) => {
  return http.request<ReturnResult<ImageStudioTemplate[]>>("get", "/v2/ai/template/list", {
    params: { sysAiModuleId },
  });
};

export const listImageStudioStyles = async (sysAiModuleId?: number) => {
  return http.request<ReturnResult<ImageStudioStyle[]>>("get", "/v2/ai/style/list", {
    params: { sysAiModuleId },
  });
};

export const listImageStudioSettings = async (sysAiModuleId?: number) => {
  return http.request<ReturnResult<ImageStudioSetting[]>>("get", "/v2/ai/setting/list", {
    params: { sysAiModuleId },
  });
};

export const buildImageModelSettings = (
  module: AiModule | undefined,
  settings: ImageStudioSetting[],
) => {
  const map = new Map(settings.map((item) => [item.sysAiSettingField, item.sysAiSettingValue || ""]));
  const fallbackSizes = module?.vincentSetting?.sysAiVincentSupportedSize || "";
  const fallbackNumber = module?.vincentSetting?.sysAiVincentSupportedNumber;
  const fallbackAsync = module?.vincentSetting?.sysAiVincentSupportAsync;
  const fallbackRefImage = module?.vincentSetting?.sysAiVincentSupportRefImage;
  const fallbackQuality = module?.vincentSetting?.sysAiVincentSupportedQuality || "";
  return {
    sizes:
      (map
        .get("vincent_supported_size") || fallbackSizes)
        ?.split(",")
        .map((item) => item.trim())
        .filter(Boolean) || [],
    maxNumber: Number(map.get("vincent_supported_number") || fallbackNumber || "1") || 1,
    supportAsync: (map.get("vincent_support_async") || String(fallbackAsync || 0)) === "1",
    supportRefImage: (map.get("vincent_support_ref_image") || String(fallbackRefImage || 0)) === "1",
    supportedQuality:
      (map.get("vincent_supported_quality") || fallbackQuality)
        ?.split(",")
        .map((item) => item.trim())
        .filter(Boolean) || [],
    defaultSize:
      ((map.get("vincent_supported_size") || fallbackSizes)?.split(",")[0]?.trim()) || "1024*1024",
    moduleId: module?.sysAiModuleId,
  };
};
