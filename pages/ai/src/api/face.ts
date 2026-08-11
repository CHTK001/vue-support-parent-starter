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
};
