import { http, type ReturnResult } from "@repo/utils";

export interface FileDistributeRequest {
  sourceServerId: number;
  sourceFilePath: string;
  targetType: "SERVER" | "NODE";
  targetIds: Array<string | number>;
  targetDir: string;
  overwrite?: boolean;
}

export interface FileOperationResponse {
  success: boolean;
  message: string;
  operation: string;
  totalCount?: number;
  processedCount?: number;
}

export function distributeFile(req: FileDistributeRequest) {
  // 后端使用 @RequestBody JSON
  return http.request<ReturnResult<FileOperationResponse>>(
    "post",
    "/v1/file-management/distribute",
    { data: req }
  );
}

