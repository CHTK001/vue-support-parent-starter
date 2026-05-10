import { http, type ReturnResult } from "@repo/utils";

export interface FaceLibraryItem {
  sysAiFaceLibraryId: number;
  sysAiFaceLibraryName: string;
  sysAiFaceLibraryFullName?: string;
  sysAiFaceLibraryIdCard?: string;
  sysAiFaceLibraryVectorId: string;
  sysAiFaceLibraryThumbnail?: string;
  sysAiFaceLibraryGroup: string;
  sysAiFaceLibraryStatus: number;
  createTime?: string;
}

export interface FaceRecognizeResult {
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

export interface FaceGroupItem {
  sysAiFaceGroupId: number;
  sysAiFaceGroupName: string;
  sysAiFaceGroupSort: number;
  sysAiFaceGroupRemark?: string;
  sysAiFaceGroupStatus?: number;
}

export const listFaceLibrary = async (group?: string) => {
  const params: Record<string, string> = {};
  if (group) {
    params.group = group;
  }
  return http.request<ReturnResult<FaceLibraryItem[]>>(
    "get", "/v2/ai/face-library/list",
    { params },
  );
};

export const registerFace = async (data: {
  name: string;
  fullName?: string;
  idCard?: string;
  image: string;
  group?: string;
}) => {
  return http.request<ReturnResult<FaceLibraryItem>>(
    "post", "/v2/ai/face-library/register",
    { data },
  );
};

export const deleteFace = async (id: number) => {
  return http.request<ReturnResult<boolean>>(
    "delete", `/v2/ai/face-library/delete/${id}`,
  );
};

export const recognizeFace = async (data: {
  image: string;
  topK?: number;
  minSimilarity?: number;
  group?: string;
}) => {
  return http.request<ReturnResult<FaceRecognizeResult[]>>(
    "post", "/v2/ai/face-library/recognize",
    { data },
  );
};

export const getFaceDetail = async (id: number) => {
  return http.request<ReturnResult<FaceLibraryItem>>(
    "get", `/v2/ai/face-library/detail/${id}`,
  );
};

export const updateFace = async (data: {
  id: number;
  name: string;
  fullName?: string;
  idCard: string;
  group?: string;
}) => {
  return http.request<ReturnResult<boolean>>(
    "put", "/v2/ai/face-library/update",
    { data },
  );
};

// ── 分组管理 API ──────────────────────────────────────────────

export const listFaceGroups = async () => {
  return http.request<ReturnResult<FaceGroupItem[]>>(
    "get", "/v2/ai/face-library/group/list",
  );
};

export const createFaceGroup = async (data: {
  name: string;
  sort?: number;
  remark?: string;
}) => {
  return http.request<ReturnResult<boolean>>(
    "post", "/v2/ai/face-library/group/create",
    { data },
  );
};

export const updateFaceGroup = async (data: {
  id: number;
  name?: string;
  sort?: number;
  remark?: string;
}) => {
  return http.request<ReturnResult<boolean>>(
    "put", "/v2/ai/face-library/group/update",
    { data },
  );
};

export const deleteFaceGroup = async (id: number) => {
  return http.request<ReturnResult<boolean>>(
    "delete", `/v2/ai/face-library/group/delete/${id}`,
  );
};

export const getFaceGroupOptions = async () => {
  return http.request<ReturnResult<FaceGroupItem[]>>(
    "get", "/v2/ai/face-library/group/options",
  );
};

// ── 识别记录 API ──────────────────────────────────────────────

export interface RecognizeRecordItem {
  sysAiFaceRecognizeRecordId: number;
  sysAiFaceRecognizeRecordThumbnail?: string;
  sysAiFaceRecognizeRecordResult?: string;
  sysAiFaceRecognizeRecordFaceCount: number;
  sysAiFaceRecognizeRecordMatchCount: number;
  sysAiFaceRecognizeRecordGroup?: string;
  sysAiFaceRecognizeRecordCost: number;
  sysAiFaceRecognizeRecordStatus: number;
  createTime?: string;
}

export const listRecognizeRecords = async (page = 1, size = 20) => {
  return http.request<ReturnResult<{ records: RecognizeRecordItem[]; total: number }>>(
    "get", "/v2/ai/face-library/recognize-record/list",
    { params: { page, size } },
  );
};

export const getRecognizeRecordDetail = async (id: number) => {
  return http.request<ReturnResult<RecognizeRecordItem>>(
    "get", `/v2/ai/face-library/recognize-record/detail/${id}`,
  );
};
