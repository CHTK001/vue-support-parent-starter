import { http, type ReturnResult } from "@repo/utils";

export interface FileDistributeRequest {
  sourceServerId: number;
  sourceFilePath: string;
  targetType: "SERVER" | "NODE";
  targetIds: Array<string | number>;
  targetDir: string;
  overwrite?: boolean;
}

export interface FileDistributeOperationResponse {
  success: boolean;
  message: string;
  operation: string;
  totalCount?: number;
  processedCount?: number;
}

export function distributeFile(req: FileDistributeRequest) {
  return http.request<ReturnResult<FileDistributeOperationResponse>>(
    "post",
    "/v1/file-management/distribute",
    { data: req },
  );
}
