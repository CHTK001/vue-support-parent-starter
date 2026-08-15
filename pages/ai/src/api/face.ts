/** AI 人脸识别接口 */
import { get, post, put } from './request';
import { getApiHttp } from '@repo/core';

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

/** 解包上传类 FormData 响应 */
function unwrapUpload<T>(json: unknown): T {
  const j = json as { code?: string; data?: T; msg?: string; success?: boolean; ok?: boolean };
  if (j && typeof j === 'object' && 'code' in j && 'data' in j) {
    const code = String(j.code);
    if (code === '00000' || code === '200' || j.success === true || j.ok === true) {
      return j.data as T;
    }
    throw new Error(j.msg || '请求失败');
  }
  return j as T;
}

/** 上传单张图片并调用人脸接口 */
async function upload<T>(url: string, file: File, extra?: Record<string, string>): Promise<T> {
  const fd = new FormData();
  fd.append('file', file);
  if (extra) {
    for (const [k, v] of Object.entries(extra)) {
      fd.append(k, v);
    }
  }
  const res = await getApiHttp().post(url).data(fd);
  return unwrapUpload<T>(res?.data);
}

/** 上传双图片（1:1 比对） */
async function uploadTwo<T>(url: string, fileA: File, fileB: File): Promise<T> {
  const fd = new FormData();
  fd.append('fileA', fileA);
  fd.append('fileB', fileB);
  const res = await getApiHttp().post(url).data(fd);
  return unwrapUpload<T>(res?.data);
}

/** 上传单图片并返回二进制（超分/修复） */
async function uploadImage(url: string, file: File): Promise<Blob> {
  const fd = new FormData();
  fd.append('file', file);
  const res = await getApiHttp().post(url).data(fd).responseType('blob');
  return res?.data as Blob;
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

  /** 人脸检测 */
  detect: (file: File) =>
    upload<{ count: number; faces: Array<{ box: FaceBox; live: boolean; liveScore: number }> }>(
      '/v2/face/detect',
      file,
    ),
  /** 特征提取 */
  feature: (file: File) => upload<{ feature: number[] }>('/v2/face/feature', file),
  /** 1:1 比对 */
  compare: (fileA: File, fileB: File) =>
    uploadTwo<{ score: number; matched: boolean }>('/v2/face/compare', fileA, fileB),
  /** 登记入库 */
  enroll: (id: string, file: File, metadata?: string) =>
    upload<string>('/v2/face/enroll', file, { id, ...(metadata ? { metadata } : {}) }),
  /** 1:N 识别 */
  identify: (file: File) =>
    upload<{ matched: boolean; bestId?: string; bestScore?: number; hits: FaceSearchHit[] }>(
      '/v2/face/identify',
      file,
    ),
  /** 核验 */
  verify: (id: string, file: File) =>
    upload<{ matched: boolean }>('/v2/face/verify', file, { id }),

  /** 活体检测 */
  liveness: (file: File) =>
    upload<{ live: boolean; score: number }>('/v2/face/liveness', file),
  /** 动漫人脸检测 */
  animeDetect: (file: File) =>
    upload<{ count: number; faces: AnimeFace[] }>('/v2/face/anime-detect', file),
  /** 人脸超分 */
  superResolution: (file: File) => uploadImage('/v2/face/super-resolution', file),
  /** 人脸修复 */
  restore: (file: File) => uploadImage('/v2/face/restore', file),
  /** 人脸属性分析 */
  attributes: (file: File) => upload<{ attributes: string }>('/v2/face/attributes', file),
  /** 人脸表情识别 */
  emotion: (file: File) => upload<{ emotion: string }>('/v2/face/emotion', file),
  /** 人脸关键点 */
  landmark: (file: File) => upload<{ points: number[] }>('/v2/face/landmark', file),
  /** 人脸质量评估 */
  quality: (file: File) => upload<FaceQuality>('/v2/face/quality', file),
  /** 换脸检测 */
  deepfake: (file: File) => upload<{ deepfake: boolean }>('/v2/face/deepfake', file),
};
