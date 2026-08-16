/** 语音识别（ASR）接口 —— 音频转文字 */
import { getApiHttp } from '@repo/core';

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

/** 音频转文字上传 */
async function uploadToText(file: File, extra?: Record<string, string>): Promise<string> {
  const fd = new FormData();
  fd.append('file', file);
  if (extra) {
    for (const [k, v] of Object.entries(extra)) {
      fd.append(k, v);
    }
  }
  const res = await getApiHttp().post('/v2/audio/to-text').data(fd);
  return unwrapUpload<string>(res?.data);
}

export const audioApi = {
  /** 音频转文字（上传音频文件，返回识别文字） */
  toText: (file: File, options?: { model?: string; language?: string }) =>
    uploadToText(file, {
      ...(options?.model ? { model: options.model } : {}),
      ...(options?.language ? { language: options.language } : {}),
    }),
};
