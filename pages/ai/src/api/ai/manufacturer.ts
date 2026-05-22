import { http, type ReturnResult } from "@repo/utils";

export interface AiManufacturer {
  sysAiManufacturerId?: number;
  sysAiManufacturerCode: string;
  sysAiManufacturerName: string;
  sysAiManufacturerFactory?: string;
  sysAiManufacturerBaseUrl?: string;
  sysAiManufacturerAppKey?: string;
  sysAiManufacturerAppSecret?: string;
  sysAiManufacturerIcon?: string;
  sysAiManufacturerLogo?: string;
  sysAiManufacturerWebsite?: string;
  sysAiManufacturerOpenaiCompatible?: number;
  sysAiManufacturerAppId?: string;
  sysAiManufacturerApiSecret?: string;
  sysAiManufacturerApiVersion?: string;
  sysAiManufacturerApiDomain?: string;
  sysAiManufacturerMemoryEnabled?: number;
  sysAiManufacturerCompressionEnabled?: number;
  sysAiManufacturerCompressionThreshold?: number;
  sysAiManufacturerStatus?: number;
  sysAiManufacturerSort?: number;
  sysAiManufacturerRemark?: string;
  moduleCount?: number;
}

export const listAiManufacturers = async () => {
  return http.request<ReturnResult<AiManufacturer[]>>(
    "get",
    "/v2/ai/manufacturer/list",
  );
};

export const saveAiManufacturer = async (data: AiManufacturer) => {
  return http.request<ReturnResult<AiManufacturer>>(
    "post",
    "/v2/ai/manufacturer/save",
    { data },
  );
};

export const updateAiManufacturer = async (data: AiManufacturer) => {
  return http.request<ReturnResult<boolean>>(
    "put",
    "/v2/ai/manufacturer/update",
    { data },
  );
};

export const deleteAiManufacturer = async (sysAiManufacturerId: number) => {
  return http.request<ReturnResult<boolean>>(
    "delete",
    "/v2/ai/manufacturer/delete",
    { params: { sysAiManufacturerId } },
  );
};

export const uploadAiManufacturerLogo = async (file: File) => {
  const formData = new FormData();
  formData.append("file", file);
  return http.request<ReturnResult<string>>(
    "post",
    "/v2/ai/manufacturer/upload-logo",
    {
      data: formData,
      headers: {
        "Content-Type": "multipart/form-data",
      },
    },
  );
};

export const listAiManufacturerFactories = async () => {
  return http.request<ReturnResult<string[]>>(
    "get",
    "/v2/ai/manufacturer/factories",
  );
};

export const updateAiManufacturerModelPrices = async (code: string) => {
  return http.request<ReturnResult<number>>(
    "put",
    "/v2/ai/manufacturer/update-model-prices",
    { params: { code } },
  );
};

/** 从 API 拉取厂商最新模型列表，先删后插（保留本地模型） */
export const replaceAiManufacturerModels = async (code: string) => {
  return http.request<ReturnResult<number>>(
    "put",
    "/v2/ai/manufacturer/replace-models",
    { params: { code }, timeout: 180000 },
  );
};
