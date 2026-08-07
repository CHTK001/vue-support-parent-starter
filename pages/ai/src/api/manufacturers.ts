/** 厂商与厂商 API Key 管理接口 */
import { get, post, put, del } from './request';
import { getApiHttp } from '@repo/core';
import type { Manufacturer, ManufacturerKey } from './types';

/** 厂商管理接口（/v2/ai/manufacturer） */
export const manufacturersApi = {
  /** 查询所有厂商 */
  list: () => get<Manufacturer[]>('/manufacturer/list'),
  /** 获取支持的工厂列表 */
  factories: () => get<string[]>('/manufacturer/factories'),
  /** 新增厂商 */
  save: (data: Partial<Manufacturer>) => post<Manufacturer>('/manufacturer/save', data),
  /** 更新厂商 */
  update: (data: Partial<Manufacturer>) => put<boolean>('/manufacturer/update', data),
  /** 删除厂商 */
  delete: (sysAiManufacturerId: number) =>
    del<boolean>('/manufacturer/delete', { sysAiManufacturerId }),
  /** 从厂商 API 直拉模型列表并同步到模型表 */
  syncModels: (code: string) => put<number>(`/manufacturer/sync-models?code=${encodeURIComponent(code)}`),
  /** 同步模型价格 */
  updateModelPrices: (code: string) =>
    put<void>(`/manufacturer/update-model-prices?code=${encodeURIComponent(code)}`),
  /** 替换厂商模型（从 API 拉取，先删后插，保留本地模型） */
  replaceModels: (code: string) => put<void>(`/manufacturer/replace-models?code=${encodeURIComponent(code)}`),
  /** 上传厂商 Logo，返回 Logo 地址 */
  uploadLogo: async (file: File): Promise<string> => {
    const fd = new FormData();
    fd.append('file', file);
    const res = await getApiHttp().post('/manufacturer/upload-logo').data(fd);
    const json = res?.data;
    if (json && typeof json === 'object' && 'code' in json && 'data' in json) {
      const code = String(json.code);
      if (code === '00000' || code === '200' || json.success === true || json.ok === true) {
        return json.data as string;
      }
      throw new Error(json.msg || '上传失败');
    }
    return json as string;
  },
};

/** 厂商 API Key 管理接口（/v2/ai/manufacturer-key） */
export const manufacturerKeysApi = {
  /** 查询全部厂商 API Key */
  list: () => get<ManufacturerKey[]>('/manufacturer-key/list'),
  /** 按厂商编码查询 API Key */
  listByCode: (manufacturerCode: string) =>
    get<ManufacturerKey[]>('/manufacturer-key/list-by-code', { manufacturerCode }),
  /** 新增厂商 API Key */
  save: (data: Partial<ManufacturerKey>) => post<ManufacturerKey>('/manufacturer-key/save', data),
  /** 更新厂商 API Key */
  update: (data: Partial<ManufacturerKey>) => put<boolean>('/manufacturer-key/update', data),
  /** 删除厂商 API Key */
  delete: (id: number) => del<boolean>('/manufacturer-key/delete', { id }),
  /** 切换 API Key 启停状态 */
  toggle: (id: number, enabled: boolean) =>
    put<boolean>(`/manufacturer-key/toggle?id=${id}&enabled=${enabled}`),
};
