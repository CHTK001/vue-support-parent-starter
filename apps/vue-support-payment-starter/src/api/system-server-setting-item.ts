// Comprehensive stub for protocol module: system-server-setting-item
import request from "@/api/config";

export interface SystemServerSettingItem { id: number; [key: string]: any; }
export interface SystemServerSettingItemPageParams { current?: number; size?: number; settingId?: number; itemName?: string; itemType?: string; required?: boolean; }
export interface ItemValueUpdate { itemId: number; value: string; }

export const getSystemServerSettingItemPage = (params: any) => request({ url: "/system/server/setting/item/page", method: "get", params });
export const getSystemServerSettingItemById = (id: number) => request({ url: `/system/server/setting/item/${id}`, method: "get" });
export const getSystemServerSettingItemBySettingId = (settingId: number) => request({ url: `/system/server/setting/item/setting/${settingId}`, method: "get" });
export const addSystemServerSettingItem = (data: any) => request({ url: "/system/server/setting/item", method: "post", data });
export const updateSystemServerSettingItem = (data: any) => request({ url: "/system/server/setting/item", method: "put", data });
export const deleteSystemServerSettingItem = (id: number) => request({ url: `/system/server/setting/item/${id}`, method: "delete" });
export const batchSaveSystemServerSettingItems = (settingId: number, items: any[]) => request({ url: "/system/server/setting/item/batch", method: "post", params: { settingId }, data: items });
export const updateSystemServerSettingItemValue = (itemId: number, value: string) => request({ url: `/system/server/setting/item/${itemId}/value`, method: "put", params: { value } });
export const batchUpdateSystemServerSettingItemValues = (updates: ItemValueUpdate[]) => request({ url: "/system/server/setting/item/batch-values", method: "put", data: updates });
export const deleteSystemServerSettingItemsBySettingId = (settingId: number) => request({ url: `/system/server/setting/item/setting/${settingId}`, method: "delete" });
export const validateSystemServerSettingItemValue = (item: any) => request({ url: "/system/server/setting/item/validate", method: "post", data: item });
export const getSystemServerSettingItemDefaultValue = (settingId: number, itemName: string) => request({ url: `/system/server/setting/item/setting/${settingId}/item/${itemName}/default-value`, method: "get" });
export const resetSystemServerSettingItemToDefault = (itemId: number) => request({ url: `/system/server/setting/item/${itemId}/reset`, method: "post" });
export const batchResetSystemServerSettingItemsToDefault = (itemIds: number[]) => request({ url: "/system/server/setting/item/batch-reset", method: "post", data: itemIds });
export const getSystemServerSettingItemBySettingIdAndRequired = (settingId: number, required: boolean) => request({ url: `/system/server/setting/item/setting/${settingId}/required/${required}`, method: "get" });
export const checkSystemServerSettingRequiredItemsConfigured = (settingId: number) => request({ url: `/system/server/setting/item/setting/${settingId}/check-required`, method: "get" });
export const getSystemServerSettingItemsAsMap = (settingId: number) => request({ url: `/system/server/setting/item/setting/${settingId}/as-map`, method: "get" });
