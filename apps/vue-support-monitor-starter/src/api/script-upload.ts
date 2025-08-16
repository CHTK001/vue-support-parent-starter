import { http, type ReturnResult } from "@repo/utils";

/**
 * 将脚本上传到服务器（根据 scriptId 由后端生成文件）
 * 使用 @RequestParam 绑定，因此采用 params 方式传参
 */
export const fetchUploadScriptToServer = (params: {
  serverId: string | number;
  scriptId: string | number;
  overwrite?: boolean | string;
  targetPath?: string;
}) => {
  const {
    serverId,
    scriptId,
    overwrite = false,
    targetPath,
  } = params || ({} as any);
  const query: any = {
    serverId,
    scriptId,
    overwrite,
  };
  if (targetPath) query.targetPath = targetPath;
  return http.request<ReturnResult<any>>("post", "/v1/file-management/upload", {
    params: query,
  });
};

/**
 * 将脚本上传到节点（根据 scriptId 由后端生成文件）
 * 使用 @RequestParam 绑定，因此采用 params 方式传参
 */
export const fetchUploadScriptToNode = (params: {
  nodeId: string | number;
  remoteFilePath: string;
  scriptId: string | number;
  overwrite?: boolean | string;
}) => {
  const {
    nodeId,
    scriptId,
    overwrite = false,
    remoteFilePath,
  } = params || ({} as any);
  const query: any = {
    nodeId,
    scriptId,
    overwrite,
    remoteFilePath,
  };
  return http.request<ReturnResult<any>>(
    "post",
    "/v1/file-management/upload-to-node",
    { params: query }
  );
};

/**
 * 分页获取脚本上传记录
 */
export const fetchScriptUploadRecords = (params: {
  scriptId?: number | string;
  pageNum?: number;
  pageSize?: number;
}) => {
  const { scriptId, pageNum = 1, pageSize = 10 } = params || ({} as any);
  const query: any = { pageNum, pageSize };
  if (scriptId != null) query.scriptId = scriptId;
  return http.request<ReturnResult<{ records: any[]; total: number }>>(
    "get",
    "/v1/script/upload-record/page",
    { params: query }
  );
};
