import { http, type ReturnResult } from "@repo/utils";

/**
 * 文件上传请求接口
 * @author CH
 * @since 2024/12/4
 * @version 1.0.0
 */
export interface SysFileUploadRequest {
  /** 文件bucket */
  fileBucket: string;
  /** 文件名 */
  fileName?: string;
  /** OSS类型; 本地(FILESYSTEM: 默认), 七牛(QINIU) */
  ossType?: string;
}

/**
 * 分片任务创建请求接口
 * @author CH
 * @since 2024/12/4
 * @version 1.0.0
 */
export interface SysFileUploadTaskRequest {
  /** 文件名称 */
  fileName?: string;
  /** 文件md5 */
  fileMd5: string;
  /** 文件类型 */
  fileType: string;
  /** 任务摘要 */
  fileSummary?: string;
  /** 存储桶 */
  fileBucket: string;
  /** OSS类型; 本地(FILESYSTEM: 默认), 七牛(QINIU) */
  ssoType?: string;
  /** 文件大小 */
  fileSize: number;
}

/**
 * 分片任务创建响应接口
 * @author CH
 * @since 2024/12/4
 * @version 1.0.0
 */
export interface SysFileUploadTaskResponse {
  /** 任务ID */
  taskId: string;
  /** 任务数量 */
  setSysTaskSsoNumber?: number;
  /** 文件大小 */
  sysTaskSsoChuck?: number;
  /** 文件名称/url */
  url?: string;
}

/**
 * 分片上传请求接口
 * @author CH
 * @since 2024/12/4
 * @version 1.0.0
 */
export interface SysFileUploadTaskPartRequest {
  /** 任务ID */
  taskId: string;
  /** 分片序号 */
  partNumber: number;
}

/**
 * 分片上传响应接口
 * @author CH
 * @since 2024/12/4
 * @version 1.0.0
 */
export interface SysFileUploadTaskPartResponse {
  /** 是否成功 */
  success: boolean;
  /** 分片序号 */
  partNumber?: number;
  /** 已上传大小 */
  uploadedSize?: number;
}

/**
 * 上传结果接口
 * @author CH
 * @since 2024/12/4
 * @version 1.0.0
 */
export interface PutObjectResult {
  /** 文件URL */
  url?: string;
  /** 文件名 */
  name?: string;
  /** 文件大小 */
  size?: number;
  /** 上传时间 */
  uploadTime?: string;
}

/**
 * 上传文件
 * @param request 上传请求参数
 * @param file 文件
 * @returns 上传结果
 * @author CH
 * @since 2024/12/4
 * @version 1.0.0
 */
export const uploadFile = (
  request: SysFileUploadRequest,
  file: File
): Promise<ReturnResult<PutObjectResult>> => {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("fileBucket", request.fileBucket);
  if (request.fileName) {
    formData.append("fileName", request.fileName);
  }
  if (request.ossType) {
    formData.append("ossType", request.ossType);
  }

  return http.request<PutObjectResult>("put", "/v2/file/upload", {
    data: formData,
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });
};

/**
 * 创建分片上传任务
 * @param request 任务创建请求
 * @returns 任务创建响应
 * @author CH
 * @since 2024/12/4
 * @version 1.0.0
 */
export const createUploadTask = (
  request: SysFileUploadTaskRequest
): Promise<ReturnResult<SysFileUploadTaskResponse>> => {
  return http.request<SysFileUploadTaskResponse>("post", "/v2/file/task/create", {
    data: request,
  });
};

/**
 * 上传分片
 * @param request 分片上传请求
 * @param file 分片文件
 * @returns 分片上传响应
 * @author CH
 * @since 2024/12/4
 * @version 1.0.0
 */
export const uploadTaskPart = (
  request: SysFileUploadTaskPartRequest,
  file: Blob
): Promise<ReturnResult<SysFileUploadTaskPartResponse>> => {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("taskId", request.taskId);
  formData.append("partNumber", String(request.partNumber));

  return http.request<SysFileUploadTaskPartResponse>("post", "/v2/file/task/upload", {
    data: formData,
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });
};
