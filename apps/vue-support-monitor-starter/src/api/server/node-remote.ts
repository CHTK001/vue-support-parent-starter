import { http } from "@repo/utils";

/**
 * 上传文件到节点
 */
export function uploadFileToNode(
  params: {
    nodeId: string;
    remoteFilePath: string;
    file: File;
    overwrite?: boolean;
    scriptId?: number | string;
  },
  onUploadProgress?: (e: ProgressEvent) => void,
  signal?: AbortSignal
) {
  const fd = new FormData();
  fd.append("nodeId", params.nodeId);
  fd.append("remoteFilePath", params.remoteFilePath);
  fd.append("overwrite", String(Boolean(params.overwrite)));
  if (params.scriptId !== undefined && params.scriptId !== null) {
    fd.append("scriptId", String(params.scriptId));
  }
  fd.append("file", params.file);

  return http.request("post", "node-remote/upload-file", {
    data: fd,
    headers: { "Content-Type": "multipart/form-data" },
    onUploadProgress,
    signal
  } as any);
}