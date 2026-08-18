/** AI 人脸识别接口 */
import { get, put } from './request';
import { uploadFile, uploadFiles, uploadFileBinary } from './upload';

/** 人脸配置项（来自 face 分组全局设置） */
export interface FaceConfigItem {
  field: string;
  value: string;
  valueType: 'STRING' | 'NUMBER' | 'BOOLEAN';
  description: string;
  sort: number;
}

/** 检测命中 */
export interface FaceBox {
  x: number;
  y: number;
  width: number;
  height: number;
  confidence: number;
  label: number;
  labelName: string;
}

/** 识别命中（TopK） */
export interface FaceSearchHit {
  id: string;
  score: number;
  feature?: number[];
  metadata?: Record<string, unknown>;
  content?: string;
}

/** 动漫检测命中 */
export interface AnimeFace {
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  confidence?: number;
  labelName?: string;
}

/** 质量评估结果 */
export interface FaceQuality {
  enabled: boolean;
  faceCount?: number;
  faceAreaRatio?: number;
  blurScore?: number;
  brightness?: number;
  faceOk?: boolean;
}

export const faceApi = {
  /** 人脸配置（face 分组） */
  config: () => get<FaceConfigItem[]>('/v2/face/config'),
  updateConfig: (fields: { field: string; value: string }[]) =>
    put<unknown>('/v2/face/config', { fields }),
  /** 可用模型清单 */
  models: () => get<Record<string, string[]>>('/v2/face/config/models'),

  /** OCR 配置（ocr 分组） */
  ocrConfig: () => get<FaceConfigItem[]>('/v2/ocr/config'),
  updateOcrConfig: (fields: { field: string; value: string }[]) =>
    put<unknown>('/v2/ocr/config', { fields }),

  /** 人脸检测 */
  detect: (file: File) =>
    uploadFile<{ count: number; faces: Array<{ box: FaceBox; faceImage?: number[]; live: boolean; liveScore: number }> }>(
      '/v2/face/detect',
      file,
    ),
  /** 特征提取 */
  feature: (file: File) => uploadFile<{ feature: number[] }>('/v2/face/feature', file),
  /** 人脸对齐（detect→crop→liveness→align，返回对齐图） */
  align: (file: File) =>
    uploadFile<{
      matched: boolean;
      box?: { x: number; y: number; width: number; height: number; confidence: number; label?: number; labelName?: string };
      alignedFace?: number[];
      live?: boolean;
      liveScore?: number;
      elapsedMs?: number;
    }>('/v2/face/align', file),
  /** 1:1 比对（完整管线：detect→crop→liveness→align→feature→cosine） */
  compare: (fileA: File, fileB: File) =>
    uploadFiles<{
      score: number;
      matched: boolean;
      a: { box: FaceBox; live: boolean; liveScore: number; dim: number };
      b: { box: FaceBox; live: boolean; liveScore: number; dim: number };
      elapsedMs: number;
    }>('/v2/face/compare', { fileA, fileB }),
  /** 登记入库（图像 → 完整管线 → 入库） */
  enroll: (id: string, file: File, metadata?: string) =>
    uploadFile<string>('/v2/face/enroll', file, { id, ...(metadata ? { metadata } : {}) }),
  /** 直接特征入库（不跑管线，调用方需自行 extractFeature 后入库） */
  enrollFeature: (id: string, feature: number[], metadata?: string) =>
    put<string>('/v2/face/enroll-feature', { id, feature, metadata }),
  /** 1:N 识别 */
  identify: (file: File) =>
    uploadFile<{ matched: boolean; bestId?: string; bestScore?: number; hits: FaceSearchHit[] }>(
      '/v2/face/identify',
      file,
    ),
  /** 核验 */
  verify: (id: string, file: File) =>
    uploadFile<{ matched: boolean }>('/v2/face/verify', file, { id }),

  /** 活体检测 */
  liveness: (file: File) =>
    uploadFile<{ live: boolean; score: number }>('/v2/face/liveness', file),
  /** 动漫人脸检测 */
  animeDetect: (file: File) =>
    uploadFile<{ count: number; faces: AnimeFace[] }>('/v2/face/anime-detect', file),
  /** 人脸超分 */
  superResolution: (file: File) => uploadFileBinary('/v2/face/super-resolution', file),
  /** 人脸修复 */
  restore: (file: File) => uploadFileBinary('/v2/face/restore', file),
  /** 人脸属性分析 */
  attributes: (file: File) => uploadFile<{ attributes: string }>('/v2/face/attributes', file),
  /** 人脸表情识别 */
  emotion: (file: File) => uploadFile<{ emotion: string }>('/v2/face/emotion', file),
  /** 人脸关键点 */
  landmark: (file: File) => uploadFile<{ points: number[] }>('/v2/face/landmark', file),
  /** 人脸质量评估 */
  quality: (file: File) => uploadFile<FaceQuality>('/v2/face/quality', file),
  /** 换脸检测 */
  deepfake: (file: File) => uploadFile<{ deepfake: boolean }>('/v2/face/deepfake', file),
};
