/** 视觉理解接口（图像描述/OCR/视觉问答） */
import { uploadFile } from './upload';

/** 图像内容描述（多模态 LLM） */
export interface DescribeResult {
  description: string;
}

/** 图像问答（多模态 LLM） */
export interface AskResult {
  answer: string;
}

/** OCR 文本提取 */
export interface OcrTextResult {
  text: string;
}

export const visionApi = {
  /** 图像内容描述（可选 prompt） */
  describe: (file: File, prompt?: string) =>
    uploadFile<DescribeResult>(
      '/v2/vision/describe',
      file,
      { ...(prompt ? { prompt } : {}) },
    ),
  /** 图像问答（必传 question） */
  ask: (file: File, question: string, prompt?: string) =>
    uploadFile<AskResult>('/v2/vision/ask', file, {
      question,
      ...(prompt ? { prompt } : {}),
    }),
  /** OCR 文本提取 */
  ocr: (file: File) => uploadFile<OcrTextResult>('/v2/vision/ocr', file),
};
