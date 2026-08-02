/**
 * ReUploadChunk 类型定义
 */
export interface ChunkUploadFile {
  /** 文件原始对象 */
  file: File;
  /** 上传 ID（create 后回填） */
  uploadId?: string;
  /** 文件 Key */
  key?: string;
  /** 总分片数 */
  totalChunks?: number;
  /** 分片大小 */
  chunkSize?: number;
  /** 已上传分片 */
  uploadedChunks?: number;
  /** 进度百分比 0-100 */
  percent?: number;
  /** 状态 */
  status: "pending" | "uploading" | "success" | "fail" | "cancelled";
  /** 上传后的 URL */
  url?: string;
  /** 错误信息 */
  error?: string;
  /** 文件名 */
  name: string;
  /** 文件大小 */
  size: number;
}
