import { http, type ReturnResult } from "@repo/utils";

export interface ReidLibraryItem {
  sysAiReidLibraryId: number;
  sysAiReidLibraryFaceId?: number;
  sysAiReidLibraryName: string;
  sysAiReidLibraryFaceName?: string;
  sysAiReidLibraryVectorId: string;
  sysAiReidLibraryThumbnail?: string;
  sysAiReidLibraryGroup: string;
  sysAiReidLibraryStatus: number;
  createTime?: string;
}

export interface ReidRecognizeResult {
  faceLibraryId: number;
  name: string;
  fullName?: string;
  idCard?: string;
  similarity: number;
  thumbnail?: string;
  score: number;
  distance: number;
  group?: string;
}

export const listReidLibrary = async (group?: string) => {
  const params: Record<string, string> = {};
  if (group) params.group = group;
  return http.request<ReturnResult<ReidLibraryItem[]>>(
    "get", "/v2/ai/reid-library/list", { params },
  );
};

export const registerReid = async (data: {
  faceId?: number;
  name: string;
  faceName?: string;
  image: string;
  group?: string;
}) => {
  return http.request<ReturnResult<ReidLibraryItem>>(
    "post", "/v2/ai/reid-library/register", { data },
  );
};

export const deleteReid = async (id: number) => {
  return http.request<ReturnResult<boolean>>(
    "delete", `/v2/ai/reid-library/delete/${id}`,
  );
};

export const recognizeReid = async (data: {
  image: string;
  topK?: number;
  minSimilarity?: number;
  group?: string;
}) => {
  return http.request<ReturnResult<ReidRecognizeResult[]>>(
    "post", "/v2/ai/reid-library/recognize", { data },
  );
};

export const getReidDetail = async (id: number) => {
  return http.request<ReturnResult<ReidLibraryItem>>(
    "get", `/v2/ai/reid-library/detail/${id}`,
  );
};

export const updateReid = async (data: {
  id: number;
  name?: string;
  faceName?: string;
  group?: string;
}) => {
  return http.request<ReturnResult<boolean>>(
    "put", "/v2/ai/reid-library/update", { data },
  );
};

export const listReidPaged = async (page = 1, size = 20, group?: string) => {
  const params: Record<string, any> = { page, size };
  if (group) params.group = group;
  return http.request<ReturnResult<{ records: ReidLibraryItem[]; total: number }>>(
    "get", "/v2/ai/reid-library/list/paged", { params },
  );
};
