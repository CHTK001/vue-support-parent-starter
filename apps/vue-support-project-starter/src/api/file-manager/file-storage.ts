import { http } from "@repo/utils";

export interface UploadSmallFileParams {
  serverId: number;
  bucket?: string;
  filePath?: string;
  file: File;
}

export function fileStorageList(
  params: URLSearchParams | FormData | Record<string, any>,
) {
  return http.post("/file-storage/list", params, {
    headers: {
      "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
    },
  });
}

export function uploadSmallFile(params: UploadSmallFileParams) {
  const formData = new FormData();
  formData.append("serverId", String(params.serverId));
  if (params.bucket) {
    formData.append("bucket", params.bucket);
  }
  if (params.filePath) {
    formData.append("filePath", params.filePath);
  }
  formData.append("file", params.file);

  return http.post("/file-storage/upload", formData, {
    headers: {
      "Content-Type": "multipart/form-data;charset=UTF-8",
    },
    timeout: 60000,
  });
}
