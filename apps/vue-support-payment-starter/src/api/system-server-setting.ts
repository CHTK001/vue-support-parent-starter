// Comprehensive stub for protocol module: system-server-setting
import request from "@/api/config";

export interface SystemServerSetting { id: number; [key: string]: any; }
export interface SystemServerSettingItem { id: number; [key: string]: any; }
export interface ServletFilterObject { type: string; name: string; className: string; version: string; configItems?: any[]; supportedTypes?: string[]; }
export interface FilterConfigItem { name: string; type: string; defaultValue?: string; description?: string; required?: boolean; }
export interface ServiceDiscoveryConfig { [key: string]: any; }
export interface ServiceDiscoveryMapping { [key: string]: any; }
export interface IpRateLimitRule { [key: string]: any; }
export interface AddressRateLimitRule { [key: string]: any; }
export interface QpsRateLimitConfig { [key: string]: any; }
export interface FileStorageConfig { [key: string]: any; }
export interface PreviewExtensionConfig { id: number; [key: string]: any; }
export interface ViewerInfo { id: number; [key: string]: any; }
export interface ViewerConfig { [key: string]: any; }
export interface OnlyOfficeViewerConfig { [key: string]: any; }

// Servlet filter config
export const getServletFilterConfig = (params: any) => request({ url: "/system/server/setting/filter-config", method: "get", params });
export const saveServletFilterConfig = (data: any) => request({ url: "/system/server/setting/filter-config", method: "post", data });

// Page queries
export const getSystemServerSettingPage = (params: any) => request({ url: "/system/server/setting/page", method: "get", params });
export const getSystemServerSettingById = (id: number) => request({ url: `/system/server/setting/${id}`, method: "get" });
export const getSystemServerSettingByServerId = (serverId: number) => request({ url: `/system/server/setting/server/${serverId}`, method: "get" });
export const getSystemServerSettingByServerIdAndEnabled = (serverId: number, enabled: boolean) => request({ url: `/system/server/setting/server/${serverId}/enabled/${enabled}`, method: "get" });

// Servlet filter operations
export const installServletFilter = (serverId: number, filterType: string) => request({ url: "/system/server/setting/install", method: "post", params: { serverId, filterType } });
export const uninstallServletFilter = (id: number) => request({ url: `/system/server/setting/${id}/uninstall`, method: "delete" });
export const enableServletFilter = (id: number) => request({ url: `/system/server/setting/${id}/enable`, method: "post" });
export const disableServletFilter = (id: number) => request({ url: `/system/server/setting/${id}/disable`, method: "post" });
export const updateServletFilterOrder = (serverId: number, settingOrders: any[]) => request({ url: `/system/server/setting/server/${serverId}/order`, method: "post", data: settingOrders });
export const updateServletFilterConfig = (id: number, config: any) => request({ url: `/system/server/setting/${id}/config`, method: "put", data: config });
export const getAvailableServletFilterTypes = () => request({ url: "/system/server/setting/types", method: "get" });
export const getAvailableServletFilterObjects = (serverId?: number) => request({ url: "/system/server/setting/objects", method: "get", params: serverId ? { serverId } : undefined });
export const batchInstallServletFilters = (serverId: number, filterTypes: string[]) => request({ url: "/system/server/setting/batch-install", method: "post", params: { serverId }, data: filterTypes });
export const batchOperationServletFilter = (settingIds: number[], operation: string) => request({ url: "/system/server/setting/batch", method: "post", params: { settingIds: settingIds.join(","), operation } });
export const resetServletFilterConfig = (id: number) => request({ url: `/system/server/setting/${id}/reset`, method: "post" });
export const exportServerFiltersConfig = (serverId: number) => request({ url: `/system/server/setting/server/${serverId}/export`, method: "get" });
export const importServerFiltersConfig = (serverId: number, configData: any) => request({ url: `/system/server/setting/server/${serverId}/import`, method: "post", data: configData });
export const getServletFilterConfigItems = (filterType: string) => request({ url: `/system/server/setting/servlet-filters/${filterType}/config-items`, method: "get" });
export const applyConfigToRunningServer = (serverId: number) => request({ url: `/system/server/setting/server/${serverId}/apply`, method: "post" });
export const cloneServerSettings = (sourceServerId: number, targetServerId: number) => request({ url: "/system/server/setting/clone", method: "post", params: { sourceServerId, targetServerId } });
export const batchUpdateServletFilterEnabled = (settingIds: number[], enabled: boolean) => request({ url: "/system/server/setting/batch-enabled", method: "put", params: { settingIds, enabled } });

// Service Discovery
export const getServiceDiscoveryConfig = (serverId: number) => request({ url: `/system/server/setting/service-discovery/${serverId}`, method: "get" });
export const saveServiceDiscoveryConfig = (data: ServiceDiscoveryConfig) => request({ url: "/system/server/setting/service-discovery/save", method: "post", data });
export const deleteServiceDiscoveryConfig = (serverId: number) => request({ url: `/system/server/setting/service-discovery/${serverId}`, method: "delete" });
export const getServiceDiscoveryMappings = (serverId: number) => request({ url: `/system/server/setting/service-discovery/${serverId}/mappings`, method: "get" });
export const saveServiceDiscoveryMappings = (serverId: number, mappings: ServiceDiscoveryMapping[]) => request({ url: `/system/server/setting/service-discovery/${serverId}/mappings/save`, method: "post", data: mappings });

// IP rate limit
export const getIpRateLimitRules = (serverId: number, settingId: number) => request({ url: `/system/server/setting/rate-limit/ip/${serverId}/${settingId}`, method: "get" });
export const saveIpRateLimitRules = (serverId: number, settingId: number, rules: IpRateLimitRule[]) => request({ url: `/system/server/setting/rate-limit/ip/${serverId}/${settingId}/save`, method: "post", data: rules });
export const deleteIpRateLimitRules = (serverId: number, settingId: number) => request({ url: `/system/server/setting/rate-limit/ip/${serverId}/${settingId}`, method: "delete" });

// Address rate limit
export const getAddressRateLimitRules = (serverId: number, settingId: number) => request({ url: `/system/server/setting/rate-limit/address/${serverId}/${settingId}`, method: "get" });
export const saveAddressRateLimitRules = (serverId: number, settingId: number, rules: AddressRateLimitRule[]) => request({ url: `/system/server/setting/rate-limit/address/${serverId}/${settingId}/save`, method: "post", data: rules });
export const deleteAddressRateLimitRules = (serverId: number, settingId: number) => request({ url: `/system/server/setting/rate-limit/address/${serverId}/${settingId}`, method: "delete" });

// File storage
export const getFileStorageConfig = (serverId: number) => request({ url: `/system/server/setting/file-storage/${serverId}`, method: "get" });
export const saveFileStorageConfig = (data: FileStorageConfig) => request({ url: "/system/server/setting/file-storage/save", method: "post", data });
export const updateFileStorageConfig = (data: FileStorageConfig) => request({ url: "/system/server/setting/file-storage/update", method: "put", data });
export const deleteFileStorageConfig = (serverId: number) => request({ url: `/system/server/setting/file-storage/${serverId}`, method: "delete" });
export const deleteFileStorageById = (storageId: number) => request({ url: `/system/server/setting/file-storage/item/${storageId}`, method: "delete" });

// Preview extension
export const getPreviewExtensionConfig = (params: any) => request({ url: "/system/server/setting/preview-extension", method: "get", params });
export const savePreviewExtensionConfig = (data: any) => request({ url: "/system/server/setting/preview-extension", method: "post", data });
export const clearPreviewExtensionConfig = (params: any) => request({ url: "/system/server/setting/clear-preview-extension", method: "post", params });
export const addDisabledExtensions = (serverId: number, extensions: string[]) => request({ url: `/system/server/setting/preview-extension/${serverId}/disabled/add`, method: "post", data: extensions });
export const removeDisabledExtensions = (serverId: number, extensions: string[]) => request({ url: `/system/server/setting/preview-extension/${serverId}/disabled/remove`, method: "post", data: extensions });
export const addAllowedExtensions = (serverId: number, extensions: string[]) => request({ url: `/system/server/setting/preview-extension/${serverId}/allowed/add`, method: "post", data: extensions });
export const removeAllowedExtensions = (serverId: number, extensions: string[]) => request({ url: `/system/server/setting/preview-extension/${serverId}/allowed/remove`, method: "post", data: extensions });
export const setPreviewMode = (serverId: number, whitelistMode: boolean) => request({ url: `/system/server/setting/preview-extension/${serverId}/mode`, method: "put", params: { whitelistMode } });

// Viewers
export const getViewerListForSetting = (params: any) => request({ url: "/system/server/setting/viewer-list", method: "get", params });
export const saveViewerConfigForSetting = (data: any) => request({ url: "/system/server/setting/viewer-config", method: "post", data });
export const getViewerConfigForSetting = (settingId: number) => request({ url: `/system/server/setting/${settingId}/viewer-config`, method: "get" });
