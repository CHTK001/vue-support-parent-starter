import { http, type ReturnResult } from "@repo/utils";

export interface ImageLibraryItem {
  sysAiImageLibraryId: number;
  sysAiImageLibraryName?: string;
  sysAiImageLibraryVectorId: string;
  sysAiImageLibraryThumbnail?: string;
  sysAiImageLibraryUrl?: string;
  sysAiImageLibraryTags?: string;
  sysAiImageLibraryWidth: number;
  sysAiImageLibraryHeight: number;
  sysAiImageLibraryStatus: number;
  createTime?: string;
}

export interface ImageSearchResultItem {
  id: number;
  name?: string;
  thumbnail?: string;
  url?: string;
  tags?: string;
  width: number;
  height: number;
  similarity: number;
  score: number;
  distance: number;
}

export const uploadImage = async (data: {
  image: string;
  name?: string;
  tags?: string;
}) => {
  return http.request<ReturnResult<ImageLibraryItem>>(
    "post", "/v2/ai/image-library/upload",
    { data },
  );
};

export const searchImage = async (data: {
  image: string;
  topK?: number;
  minSimilarity?: number;
  tags?: string;
}) => {
  return http.request<ReturnResult<ImageSearchResultItem[]>>(
    "post", "/v2/ai/image-library/search",
    { data },
  );
};

export const deleteImage = async (id: number) => {
  return http.request<ReturnResult<boolean>>(
    "delete", `/v2/ai/image-library/delete/${id}`,
  );
};

export const listImages = async (params: {
  name?: string;
  tags?: string;
  page?: number;
  size?: number;
}) => {
  return http.request<ReturnResult<{ records: ImageLibraryItem[]; total: number }>>(
    "get", "/v2/ai/image-library/list",
    { params },
  );
};

export const getImageDetail = async (id: number) => {
  return http.request<ReturnResult<ImageLibraryItem>>(
    "get", `/v2/ai/image-library/detail/${id}`,
  );
};
