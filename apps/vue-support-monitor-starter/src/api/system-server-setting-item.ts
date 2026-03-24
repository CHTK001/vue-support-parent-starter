import request from "./config";

// 系统服务器配置项相关接口

/**
 * 系统服务器配置项接口
 */
export interface SystemServerSettingItem {
  systemServerSettingItemId?: number;
  systemServerSettingItemSettingId: number;
  systemServerSettingItemName: string;
  systemServerSettingItemValue?: string;
  systemServerSettingItemDescription?: string;
  systemServerSettingItemType?: string;
  systemServerSettingItemRequired?: boolean;
  systemServerSettingItemDefaultValue?: string;
  systemServerSettingItemValidationRule?: string;
  systemServerSettingItemOrder?: number;
  createTime?: string;
  updateTime?: string;
}

/**
 * 分页查询参数
 */
export interface SystemServerSettingItemPageParams {
  current?: number;
  size?: number;
  settingId?: number;
  itemName?: string;
  itemType?: string;
  required?: boolean;
}

/**
 * 配置项更新参数
 */
export interface ItemValueUpdate {
  itemId: number;
  value: string;
}

/**
 * 分页查询配置项
 */
export function getSystemServerSettingItemPage(params: SystemServerSettingItemPageParams) {
  return request({
    url: "/api/system/server/setting/item/page",
    method: "get",
    params
  });
}

/**
 * 根据ID查询配置项详情
 */
export function getSystemServerSettingItemById(id: number) {
  return request({
    url: `/api/system/server/setting/item/${id}`,
    method: "get"
  });
}

/**
 * 根据配置ID查询配置项列表
 */
export function getSystemServerSettingItemBySettingId(settingId: number) {
  return request({
    url: `/api/system/server/setting/item/setting/${settingId}`,
    method: "get"
  });
}

/**
 * 新增配置项
 */
export function addSystemServerSettingItem(data: SystemServerSettingItem) {
  return request({
    url: "/api/system/server/setting/item",
    method: "post",
    data
  });
}

/**
 * 更新配置项
 */
export function updateSystemServerSettingItem(data: SystemServerSettingItem) {
  return request({
    url: "/api/system/server/setting/item",
    method: "put",
    data
  });
}

/**
 * 删除配置项
 */
export function deleteSystemServerSettingItem(id: number) {
  return request({
    url: `/api/system/server/setting/item/${id}`,
    method: "delete"
  });
}

/**
 * 批量保存配置项
 */
export function batchSaveSystemServerSettingItems(settingId: number, items: SystemServerSettingItem[]) {
  return request({
    url: "/api/system/server/setting/item/batch",
    method: "post",
    params: { settingId },
    data: items
  });
}

/**
 * 更新配置项值
 */
export function updateSystemServerSettingItemValue(itemId: number, value: string) {
  return request({
    url: `/api/system/server/setting/item/${itemId}/value`,
    method: "put",
    params: { value }
  });
}

/**
 * 批量更新配置项值
 */
export function batchUpdateSystemServerSettingItemValues(updates: ItemValueUpdate[]) {
  return request({
    url: "/api/system/server/setting/item/batch-values",
    method: "put",
    data: updates
  });
}

/**
 * 根据配置ID删除所有配置项
 */
export function deleteSystemServerSettingItemsBySettingId(settingId: number) {
  return request({
    url: `/api/system/server/setting/item/setting/${settingId}`,
    method: "delete"
  });
}

/**
 * 验证配置项值
 */
export function validateSystemServerSettingItemValue(item: SystemServerSettingItem) {
  return request({
    url: "/api/system/server/setting/item/validate",
    method: "post",
    data: item
  });
}

/**
 * 获取配置项的默认值
 */
export function getSystemServerSettingItemDefaultValue(settingId: number, itemName: string) {
  return request({
    url: `/api/system/server/setting/item/setting/${settingId}/item/${itemName}/default-value`,
    method: "get"
  });
}

/**
 * 重置配置项为默认值
 */
export function resetSystemServerSettingItemToDefault(itemId: number) {
  return request({
    url: `/api/system/server/setting/item/${itemId}/reset`,
    method: "post"
  });
}

/**
 * 批量重置配置项为默认值
 */
export function batchResetSystemServerSettingItemsToDefault(itemIds: number[]) {
  return request({
    url: "/api/system/server/setting/item/batch-reset",
    method: "post",
    data: itemIds
  });
}

/**
 * 根据配置ID和必填状态查询配置项列表
 */
export function getSystemServerSettingItemBySettingIdAndRequired(settingId: number, required: boolean) {
  return request({
    url: `/api/system/server/setting/item/setting/${settingId}/required/${required}`,
    method: "get"
  });
}

/**
 * 检查必填配置项是否都已配置
 */
export function checkSystemServerSettingRequiredItemsConfigured(settingId: number) {
  return request({
    url: `/api/system/server/setting/item/setting/${settingId}/check-required`,
    method: "get"
  });
}

/**
 * 将配置项转换为Map格式
 */
export function getSystemServerSettingItemsAsMap(settingId: number) {
  return request({
    url: `/api/system/server/setting/item/setting/${settingId}/as-map`,
    method: "get"
  });
}
