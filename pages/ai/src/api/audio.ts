/** 语音识别（ASR）接口 —— 音频转文字 */
import { uploadFile } from './upload';

export const audioApi = {
  /** 音频转文字（上传音频文件，返回识别文字） */
  toText: (file: File, options?: { model?: string; language?: string }) =>
    uploadFile<string>('/v2/audio/to-text', file, {
      ...(options?.model ? { model: options.model } : {}),
      ...(options?.language ? { language: options.language } : {}),
    }),
};
