/** 厂商与厂商 API Key 管理接口 */
import { get, post, put, del } from './request';
import { uploadFile } from './upload';
import type { Manufacturer, ManufacturerKey } from './types';

/** 厂商管理接口（/api/ai/v2/manufacturer） */
export const manufacturersApi = {
  /** 查询所有厂商 */
  list: () => get<Manufacturer[]>('/v2/manufacturer/list'),
  /** 获取支持的工厂列表 */
  factories: () => get<string[]>('/v2/manufacturer/factories'),
  /** 新增厂商 */
  save: (data: Partial<Manufacturer>) => post<Manufacturer>('/v2/manufacturer/save', data),
  /** 更新厂商 */
  update: (data: Partial<Manufacturer>) => put<boolean>('/v2/manufacturer/update', data),
  /** 删除厂商 */
  delete: (sysAiManufacturerId: number) =>
    del<boolean>('/v2/manufacturer/delete', { sysAiManufacturerId }),
  /** 从厂商 API 直拉模型列表并同步到模型表 */
  syncModels: (code: string) => put<number>(`/v2/manufacturer/sync-models?code=${encodeURIComponent(code)}`),
  /** 同步模型价格 */
  updateModelPrices: (code: string) =>
    put<void>(`/v2/manufacturer/update-model-prices?code=${encodeURIComponent(code)}`),
  /** 替换厂商模型（从 API 拉取，先删后插，保留本地模型） */
  replaceModels: (code: string) => put<void>(`/v2/manufacturer/replace-models?code=${encodeURIComponent(code)}`),
  /** 上传厂商 Logo，返回 Logo 地址 */
  uploadLogo: (file: File) => uploadFile<string>('/v2/manufacturer/upload-logo', file),
};

/** 厂商 API Key 管理接口（/api/ai/v2/manufacturer-key） */
export const manufacturerKeysApi = {
  /** 查询全部厂商 API Key */
  list: () => get<ManufacturerKey[]>('/v2/manufacturer-key/list'),
  /** 按厂商编码查询 API Key */
  listByCode: (manufacturerCode: string) =>
    get<ManufacturerKey[]>('/v2/manufacturer-key/list-by-code', { manufacturerCode }),
  /** 新增厂商 API Key */
  save: (data: Partial<ManufacturerKey>) => post<ManufacturerKey>('/v2/manufacturer-key/save', data),
  /** 更新厂商 API Key */
  update: (data: Partial<ManufacturerKey>) => put<boolean>('/v2/manufacturer-key/update', data),
  /** 删除厂商 API Key */
  delete: (id: number) => del<boolean>('/v2/manufacturer-key/delete', { id }),
  /** 切换 API Key 启停状态 */
  toggle: (id: number, enabled: boolean) =>
    put<boolean>(`/v2/manufacturer-key/toggle?id=${id}&enabled=${enabled}`),
};
