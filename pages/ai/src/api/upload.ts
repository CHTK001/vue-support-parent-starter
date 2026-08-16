/**
 * 统一文件上传工具
 *
 * 封装 FormData 上传与响应解包（face / audio / manufacturer 等上传类接口复用），
 * 避免各 API 模块重复手写 unwrapUpload + FormData 组装。
 */
import { getApiHttp } from '@repo/core';

/** 解包上传类响应：支持 ReturnResult { code, data, msg } 与 { ok, success } */
export function unwrapUpload<T>(json: unknown): T {
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

/** 构建 FormData 并追加字段 */
export function buildFormData(fields: Record<string, unknown>): FormData {
  const fd = new FormData();
  for (const [k, v] of Object.entries(fields)) {
    if (v === undefined || v === null) continue;
    fd.append(k, v as string | Blob);
  }
  return fd;
}

/**
 * 上传单文件并返回 JSON 数据。
 *
 * @param url 上传接口地址
 * @param file 文件
 * @param extra 额外字段（默认 file 字段名 file，可覆盖）
 */
export async function uploadFile<T>(url: string, file: File, extra?: Record<string, unknown>): Promise<T> {
  const fd = buildFormData({ file, ...extra });
  const res = await getApiHttp().post(url).data(fd);
  return unwrapUpload<T>(res?.data);
}

/**
 * 上传多文件并返回 JSON 数据。
 */
export async function uploadFiles<T>(url: string, fields: Record<string, unknown>): Promise<T> {
  const fd = buildFormData(fields);
  const res = await getApiHttp().post(url).data(fd);
  return unwrapUpload<T>(res?.data);
}

/**
 * 上传文件并返回二进制（如超分/修复图片）。
 */
export async function uploadFileBinary(url: string, file: File): Promise<Blob> {
  const fd = buildFormData({ file });
  const res = await getApiHttp().post(url).data(fd).responseType('blob');
  return res?.data as Blob;
}
