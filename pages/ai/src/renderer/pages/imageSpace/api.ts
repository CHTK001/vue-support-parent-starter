/**
 * @license
 * Copyright 2025-2026 NomiFun (nomifun.com)
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Image Space REST client.
 *
 * Talks to the spring-ai capability endpoints (`/v2/face/*`, `/v2/ocr/*`,
 * `/v2/layout/*`, `/v2/image-recognition/*`). All execute endpoints are
 * multipart uploads answered with the `ReturnResult` envelope
 * (`{ code, data, msg, success }`): JSON calls resolve `data` and reject with
 * `msg` when `success` is false. Multipart uploads go through raw `XMLHttpRequest`
 * (mirroring `services/FileService` / `workshop/api.ts`) so the local-trust /
 * CSRF headers are applied and binary responses (JPEG/PNG) can be retrieved.
 */

import { buildBackendAuthHeaders, getBaseUrl } from '@/common/adapter/httpBridge';

// ─────────────────────────────────────────────────────────────────────────────
// Wire types (mirror the backend DTOs)
// ─────────────────────────────────────────────────────────────────────────────

/** PredictRectangle — 检测/识别区域框 */
export interface ImageSpaceBox {
  x: number;
  y: number;
  width: number;
  height: number;
  confidence: number;
  label: number;
  labelName: string;
}

/** OcrResult — 单个文本块 */
export interface OcrItem {
  text: string;
  confidence: number;
  boundingBox: ImageSpaceBox | null;
  angle: number;
}

/** POST /v2/ocr/recognize 响应 data */
export interface OcrRecognizeResult {
  count: number;
  text: string;
  results: OcrItem[];
  elapsedMs: number;
}

/** POST /v2/layout/detect 响应 data */
export interface LayoutDetectResult {
  regions: Record<string, ImageSpaceBox[]>;
  total: number;
  elapsedMs: number;
}

/** POST /v2/layout/parse 响应 data */
export interface LayoutParseResult {
  markdown: string;
  elapsedMs: number;
}

/** FaceDetectionHit — 人脸命中 */
export interface FaceHit {
  box: ImageSpaceBox | null;
  live: boolean;
  liveScore: number;
}

/** POST /v2/face/detect 响应 data */
export interface FaceDetectResult {
  count: number;
  faces: FaceHit[];
}

/** POST /v2/face/attributes 响应 data */
export interface FaceAttributesResult {
  attributes: string;
}

/** POST /v2/face/emotion 响应 data */
export interface FaceEmotionResult {
  emotion: string;
}

/** DetectionInfo — 分类/检测结果项 */
export interface ImageDetection {
  label: string;
  confidence: number;
  x: number;
  y: number;
  width: number;
  height: number;
  angle?: number;
  rw?: number;
  rh?: number;
  cx?: number;
  cy?: number;
}

/** POST /v2/image-recognition/analyze 响应 data（未配置的能力为 null） */
export interface ImageAnalyzeResult {
  classification: ImageDetection[] | null;
  detections: ImageDetection[] | null;
  caption: string | null;
  elapsedMs: number;
}

/** 能力未启用（后端 409）时抛出的错误码 */
export const IMAGE_SPACE_NOT_ENABLED = 'NOT_ENABLED';

// ─────────────────────────────────────────────────────────────────────────────
// Multipart transport
// ─────────────────────────────────────────────────────────────────────────────

interface MultipartOptions {
  /** 附加表单字段 */
  extra?: Record<string, string>;
  /** 二进制响应（JPEG/PNG） */
  binary?: boolean;
}

/**
 * POST multipart/form-data 到后端能力端点。
 *
 * JSON 端点解析 ReturnResult 信封：`success` 为 true 时 resolve `data`，
 * 否则 reject（message 为后端 `msg`）。二进制端点直接 resolve Blob，
 * 409 映射为 {@link IMAGE_SPACE_NOT_ENABLED} 错误。
 */
function postMultipart<T>(endpoint: string, file: File, options?: MultipartOptions): Promise<T> {
  const formData = new FormData();
  formData.append('file', file);
  for (const [name, value] of Object.entries(options?.extra ?? {})) {
    formData.append(name, value);
  }

  return new Promise<T>((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open('POST', `${getBaseUrl()}${endpoint}`);
    for (const [name, value] of Object.entries(buildBackendAuthHeaders('POST'))) {
      xhr.setRequestHeader(name, value);
    }
    if (options?.binary) {
      xhr.responseType = 'blob';
    }

    xhr.addEventListener('load', () => {
      if (xhr.status === 409) {
        reject(new Error(IMAGE_SPACE_NOT_ENABLED));
        return;
      }
      if (xhr.status < 200 || xhr.status >= 300) {
        reject(new Error(`请求失败: ${xhr.status} ${xhr.statusText}`));
        return;
      }
      if (options?.binary) {
        const blob = xhr.response as Blob;
        if (!blob || blob.size === 0) {
          reject(new Error('响应为空'));
          return;
        }
        resolve(blob as unknown as T);
        return;
      }
      try {
        const envelope = JSON.parse(xhr.responseText) as {
          success?: boolean;
          data?: T;
          msg?: string;
        };
        if (envelope.success === false || (envelope.data == null && envelope.success === undefined)) {
          reject(new Error(envelope.msg || '后端返回失败'));
          return;
        }
        resolve(envelope.data as T);
      } catch {
        reject(new Error('响应解析失败'));
      }
    });

    xhr.addEventListener('error', () => {
      reject(new Error('网络错误'));
    });

    xhr.send(formData);
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// Capability endpoints
// ─────────────────────────────────────────────────────────────────────────────

/** 图像空间能力端点集合 */
export const imageSpaceApi = {
  /** 人脸检测（detect → crop → liveness 管线） */
  faceDetect: (file: File) => postMultipart<FaceDetectResult>('/v2/face/detect', file),

  /** 人脸属性分析（年龄/性别/种族） */
  faceAttributes: (file: File) => postMultipart<FaceAttributesResult>('/v2/face/attributes', file),

  /** 人脸表情识别 */
  faceEmotion: (file: File) => postMultipart<FaceEmotionResult>('/v2/face/emotion', file),

  /** OCR 文字识别（检测 → 裁剪 → 方向矫正 → 修复 → 识别） */
  ocrRecognize: (file: File) => postMultipart<OcrRecognizeResult>('/v2/ocr/recognize', file),

  /** OCR 检测标注图（旋转框 + 识别文字，JPEG） */
  ocrAnnotate: (file: File) => postMultipart<Blob>('/v2/ocr/annotate', file, { binary: true }),

  /** 版面区域检测 */
  layoutDetect: (file: File) => postMultipart<LayoutDetectResult>('/v2/layout/detect', file),

  /** 版面结构化解析（Markdown） */
  layoutParse: (file: File) => postMultipart<LayoutParseResult>('/v2/layout/parse', file),

  /** 图片综合分析（分类/检测/描述，未配置能力为 null） */
  imageAnalyze: (file: File, topK = 5) =>
    postMultipart<ImageAnalyzeResult>(`/v2/image-recognition/analyze?topK=${topK}`, file),

  /** 图像超分修复（PNG；能力未启用时 reject IMAGE_SPACE_NOT_ENABLED） */
  imageSuperResolution: (file: File) =>
    postMultipart<Blob>('/v2/image-recognition/super-resolution', file, { binary: true }),
};
