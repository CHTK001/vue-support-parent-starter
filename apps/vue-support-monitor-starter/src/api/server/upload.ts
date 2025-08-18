import { getConfig } from "@repo/config";
import axios from "axios";

/**
 * 服务器文件上传（带进度 & scriptId）
 */
export function uploadServerFileWithProgress(
  params: {
    serverId: number | string;
    targetPath: string;
    file: File;
    overwrite?: boolean;
    scriptId?: number | string;
  },
  onUploadProgress?: (e: ProgressEvent) => void,
  signal?: AbortSignal
) {
  const formData = new FormData();
  formData.append("file", params.file);
  return axios({
    url: getConfig().BaseUrl + "/v1/file-management/upload",
    method: "post",
    data: formData,
    params: {
      serverId: Number(params.serverId),
      targetPath: params.targetPath,
      overwrite: Boolean(params.overwrite ?? false),
      ...(params.scriptId != null ? { scriptId: params.scriptId } : {})
    },
    headers: { "Content-Type": "multipart/form-data" },
    timeout: 0,
    onUploadProgress,
    signal
  });
}
