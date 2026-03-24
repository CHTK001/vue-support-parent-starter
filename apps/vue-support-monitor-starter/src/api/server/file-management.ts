import { http, type ReturnResult } from "@repo/utils";

// 文件信息接口
export interface FileInfo {
  name: string;
  path: string;
  size: number;
  isDirectory: boolean;
  modifiedTime: string;
  permissions?: string;
  owner?: string;
  group?: string;
  children?: FileInfo[];
  extraProperties?: string; // 额外属性（JSON格式）
  leaf?: boolean; // 是否为叶子节点（用于Element Plus el-tree组件）
}

// 文件操作响应接口
export interface FileOperationResponse {
  success: boolean;
  message: string;
  operation: string;
  files?: FileInfo[];
  tree?: FileInfo;
  fileTree?: FileInfo; // 后端实际使用的字段名
  data?: any;
}

/**
 * 获取文件列表
 * @param serverId 服务器ID
 * @param path 文件路径
 * @param includeHidden 是否包含隐藏文件
 * @param sortBy 排序字段
 * @param sortOrder 排序顺序
 * @returns 文件列表
 */
export function getFileList(
  serverId: number,
  path: string,
  includeHidden: boolean = false,
  sortBy: string = "name",
  sortOrder: string = "asc"
) {
  console.log("API: getFileList called with", {
    serverId,
    path,
    includeHidden,
    sortBy,
    sortOrder,
  });

  return http.request<ReturnResult<FileOperationResponse>>(
    "get",
    "v1/file-management/list",
    {
      params: {
        serverId,
        path,
        includeHidden,
        sortBy,
        sortOrder,
      },
    }
  );
}

/**
 * 获取文件树
 * @param serverId 服务器ID
 * @param path 根路径
 * @param maxDepth 最大深度
 * @param includeHidden 是否包含隐藏文件
 * @param lazyLoad 是否启用懒加载模式
 * @param pageSize 每页文件数量限制
 * @param pageIndex 页码（从0开始）
 * @returns 文件树
 */
export function getFileTree(
  serverId: number,
  path: string,
  maxDepth: number = 3,
  includeHidden: boolean = false,
  lazyLoad: boolean = true,
  pageSize: number = 1000,
  pageIndex: number = 0
) {
  return http.request<ReturnResult<FileOperationResponse>>(
    "get",
    "v1/file-management/tree",
    {
      params: {
        serverId,
        path,
        maxDepth,
        includeHidden,
        lazyLoad,
        pageSize,
        pageIndex,
      },
    }
  );
}

/**
 * 上传文件
 * @param serverId 服务器ID
 * @param targetPath 目标路径
 * @param file 文件
 * @param overwrite 是否覆盖
 * @returns 上传结果
 */
export function uploadFile(
  serverId: number,
  targetPath: string,
  file: File,
  overwrite: boolean = false
) {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("targetPath", targetPath);
  formData.append("overwrite", overwrite.toString());

  return http.request<ReturnResult<FileOperationResponse>>(
    "post",
    `v1/file-management/upload/${serverId}`,
    {
      data: formData,
      headers: {
        "Content-Type": "multipart/form-data",
      },
    }
  );
}

/**
 * 创建目录
 * @param serverId 服务器ID
 * @param path 目录路径
 * @param recursive 是否递归创建
 * @returns 创建结果
 */
export function createDirectory(
  serverId: number,
  path: string,
  recursive: boolean = false
) {
  return http.request<ReturnResult<FileOperationResponse>>(
    "post",
    "v1/file-management/mkdir",
    {
      params: {
        serverId,
        path,
        recursive,
      },
    }
  );
}

/**
 * 删除文件或目录
 * @param serverId 服务器ID
 * @param path 文件路径
 * @param recursive 是否递归删除
 * @returns 删除结果
 */
export function deleteFile(
  serverId: number,
  path: string,
  recursive: boolean = false
) {
  return http.request<ReturnResult<FileOperationResponse>>(
    "delete",
    "v1/file-management/delete",
    {
      params: {
        serverId,
        path,
        recursive,
      },
    }
  );
}

/**
 * 重命名文件或目录
 * @param serverId 服务器ID
 * @param oldPath 原路径
 * @param newName 新名称
 * @returns 重命名结果
 */
export function renameFile(serverId: number, oldPath: string, newName: string) {
  console.log("API: renameFile called with", { serverId, oldPath, newName });

  return http.request<ReturnResult<FileOperationResponse>>(
    "post",
    "v1/file-management/rename",
    {
      params: {
        serverId,
        oldPath,
        newName,
      },
    }
  );
}

/**
 * 复制文件或目录
 * @param serverId 服务器ID
 * @param sourcePath 源路径
 * @param targetPath 目标路径
 * @param overwrite 是否覆盖
 * @returns 复制结果
 */
export function copyFile(
  serverId: number,
  sourcePath: string,
  targetPath: string,
  overwrite: boolean = false
) {
  console.log("API: copyFile called with", {
    serverId,
    sourcePath,
    targetPath,
    overwrite,
  });

  return http.request<ReturnResult<FileOperationResponse>>(
    "post",
    "v1/file-management/copy",
    {
      params: {
        serverId,
        sourcePath,
        targetPath,
        overwrite,
      },
    }
  );
}

/**
 * 移动文件或目录
 * @param serverId 服务器ID
 * @param sourcePath 源路径
 * @param targetPath 目标路径
 * @param overwrite 是否覆盖
 * @returns 移动结果
 */
export function moveFile(
  serverId: number,
  sourcePath: string,
  targetPath: string,
  overwrite: boolean = false
) {
  console.log("API: moveFile called with", {
    serverId,
    sourcePath,
    targetPath,
    overwrite,
  });

  return http.request<ReturnResult<FileOperationResponse>>(
    "post",
    "v1/file-management/move",
    {
      params: {
        serverId,
        sourcePath,
        targetPath,
        overwrite,
      },
    }
  );
}

/**
 * 批量删除文件
 * @param serverId 服务器ID
 * @param paths 文件路径列表
 * @param recursive 是否递归删除
 * @returns 删除结果
 */
export function batchDeleteFiles(
  serverId: number,
  paths: string[],
  recursive: boolean = false
) {
  console.log("API: batchDeleteFiles called with", {
    serverId,
    paths,
    recursive,
  });

  return http.request<ReturnResult<FileOperationResponse>>(
    "post",
    "v1/file-management/batch-delete",
    {
      data: {
        serverId,
        paths,
        recursive,
      },
    }
  );
}

/**
 * 读取文件内容
 * @param serverId 服务器ID
 * @param filePath 文件路径
 * @returns 文件内容
 */
export function readFileContent(serverId: number, filePath: string) {
  console.log("API: readFileContent called with", { serverId, filePath });

  return http.request<ReturnResult<string>>("get", "v1/file-management/read", {
    params: {
      serverId,
      filePath,
    },
  });
}

/**
 * 保存文件内容
 * @param serverId 服务器ID
 * @param filePath 文件路径
 * @param content 文件内容
 * @returns 保存结果
 */
export function saveFileContent(
  serverId: number,
  filePath: string,
  content: string
) {
  console.log("API: saveFileContent called with", {
    serverId,
    filePath,
    contentLength: content.length,
  });

  return http.request<ReturnResult<FileOperationResponse>>(
    "post",
    "v1/file-management/write",
    {
      data: {
        serverId,
        filePath,
        content,
      },
    }
  );
}

/**
 * 预览文件
 * @param serverId 服务器ID
 * @param filePath 文件路径
 * @param previewType 预览类型
 * @param maxSizeMB 最大文件大小(MB)
 * @returns 文件预览信息
 */
export function previewFile(
  serverId: number,
  filePath: string,
  previewType: string = "auto",
  maxSizeMB: number = 10
) {
  return http.request<ReturnResult<FileOperationResponse>>(
    "get",
    "v1/file-management/preview",
    {
      params: {
        serverId,
        filePath,
        previewType,
        maxSizeMB,
      },
    }
  );
}

/**
 * 下载文件
 * @param serverId 服务器ID
 * @param filePath 文件路径
 * @returns 下载结果
 */
export function downloadFile(serverId: number, filePath: string) {
  console.log("API: downloadFile called with", { serverId, filePath });

  return http.request<ReturnResult<FileOperationResponse>>(
    "get",
    "v1/file-management/download",
    {
      params: {
        serverId,
        filePath,
      },
    }
  );
}
