import { getConfig } from "@repo/config";
import { http } from "@repo/utils";

export function uploadServerFileWithProgress(
  params: {
    serverId: number | string;
    targetPath: string;
    file: File;
    overwrite?: boolean;
    scriptId?: number | string;
  },
  onUploadProgress?: (e: ProgressEvent) => void,
  signal?: AbortSignal,
) {
  const formData = new FormData();
  formData.append("file", params.file);

  Object.keys(params).forEach((key) => {
    if (key !== "file") {
      const value = params[key as keyof typeof params];
      if (value !== undefined && value !== null) {
        formData.append(key, value.toString());
      }
    }
  });

  return http.post(getConfig().BaseUrl + "/v1/file-management/upload", formData, {
    headers: { "Content-Type": "multipart/form-data" },
    timeout: 0,
    onUploadProgress,
    signal,
  });
}
