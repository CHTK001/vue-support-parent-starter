/** 以图搜图接口（基于人脸特征库的图像检索）
 *
 * 当前复用 FacePipeline 的 identify（1:N 人脸识别）作为"以图搜图"——
 * 底层从图片提取人脸特征 → 向量库检索 TopK 命中。
 * 通用以图搜图（CLIP 等）后续扩展。
 */
import { uploadFile } from './upload';
import type { FaceSearchHit } from './face';

/** 以图搜图命中结果 */
export interface ImageSearchResult {
  matched: boolean;
  bestId?: string;
  bestScore?: number;
  hits: FaceSearchHit[];
}

export const imageSearchApi = {
  /** 上传图片，从人脸库检索 TopK 命中 */
  searchByImage: (file: File) =>
    uploadFile<ImageSearchResult>('/v2/face/identify', file),

  /** 上传图片到人脸库（按 ID 入库） */
  enroll: (id: string, file: File, metadata?: string) =>
    uploadFile<string>('/v2/face/enroll', file, { id, ...(metadata ? { metadata } : {}) }),

  /** 直接比对两张图相似度 */
  compareTwo: (fileA: File, fileB: File) =>
    uploadFile<{ score: number; matched: boolean }>('/v2/face/compare', { fileA, fileB }),
};
