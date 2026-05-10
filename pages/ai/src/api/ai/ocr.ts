import { http, type ReturnResult } from "@repo/utils";

export interface OcrBlock {
  text: string;
  confidence: number;
  box?: number[][];
  centerX: number;
  centerY: number;
  width: number;
  height: number;
}

export interface OcrResponse {
  text: string;
  blocks: OcrBlock[];
}

export interface OcrRequest {
  image: string;
  language?: string;
  enhanceContrast?: boolean;
  enhanceBrightness?: number;
  enhanceDenoise?: boolean;
  enhanceBinarize?: boolean;
  enhanceDeskew?: boolean;
}

export const ocrRecognize = (data: OcrRequest) =>
  http.request<ReturnResult<OcrResponse>>("post", "/v2/ai/ocr/recognize", { data });
