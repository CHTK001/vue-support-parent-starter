import { http } from "@/utils/http";

/**
 * 服务器组件配置接口
 */

// 组件配置接口
export interface ServerComponent {
  monitorSysGenServerComponentId?: number;
  monitorSysGenServerId: number;
  monitorSysGenServerComponentName: string;
  monitorSysGenServerComponentType: string;
  monitorSysGenServerComponentConfig?: string;
  monitorSysGenServerComponentPosition?: string;
  monitorSysGenServerComponentShared?: number;
  monitorSysGenServerComponentSourceServerId?: number;
  monitorSysGenServerComponentRefreshInterval?: number;
  monitorSysGenServerComponentStatus?: number;
  monitorSysGenServerComponentDescription?: string;
  monitorSysGenServerComponentFixed?: number;
  monitorSysGenServerComponentSort?: number;
  createTime?: string;
  updateTime?: string;
  createBy?: string;
  updateBy?: string;
}

// 组件位置信息接口
export interface ComponentPosition {
  x: number;
  y: number;
  w: number;
  h: number;
  i: string;
  componentId?: number;
  type?: string;
  name?: string;
}

// 组件配置接口
export interface ComponentConfig {
  chartType?: string;
  title?: string;
  unit?: string;
  thresholds?: {
    normal: number;
    warning: number;
    critical: number;
  };
  showPartitions?: boolean;
  maxHeight?: number;
  showInOut?: boolean;
  showFields?: string[];
}

/**
 * 根据服务器ID获取组件列表
 */
export function fetchServerComponents(serverId: number) {
  return http.request<ServerComponent[]>({
    url: `/v1/gen/server/component/list/${serverId}`,
    method: "get"
  });
}

/**
 * 初始化服务器固定组件
 */
export function initServerFixedComponents(serverId: number) {
  return http.request<boolean>({
    url: `/v1/gen/server/component/init/${serverId}`,
    method: "post"
  });
}

/**
 * 保存组件配置
 */
export function saveServerComponent(component: ServerComponent) {
  return http.request<ServerComponent>({
    url: "/v1/gen/server/component/save",
    method: "post",
    data: component
  });
}

/**
 * 更新组件配置
 */
export function updateServerComponent(component: ServerComponent) {
  return http.request<boolean>({
    url: "/v1/gen/server/component/update",
    method: "put",
    data: component
  });
}

/**
 * 删除组件配置
 */
export function deleteServerComponent(componentId: number) {
  return http.request<boolean>({
    url: `/v1/gen/server/component/delete/${componentId}`,
    method: "delete"
  });
}

/**
 * 获取组件详情
 */
export function fetchServerComponentDetail(componentId: number) {
  return http.request<ServerComponent>({
    url: `/v1/gen/server/component/detail/${componentId}`,
    method: "get"
  });
}

/**
 * 批量更新组件位置
 */
export function updateServerComponentPositions(serverId: number, components: ServerComponent[]) {
  return http.request<boolean>({
    url: `/v1/gen/server/component/positions/${serverId}`,
    method: "put",
    data: components
  });
}

/**
 * 获取共享组件列表
 */
export function fetchSharedComponents() {
  return http.request<ServerComponent[]>({
    url: "/v1/gen/server/component/shared",
    method: "get"
  });
}

/**
 * 设置组件为共享
 */
export function shareServerComponent(componentId: number) {
  return http.request<boolean>({
    url: `/v1/gen/server/component/share/${componentId}`,
    method: "put"
  });
}

/**
 * 复制共享组件到指定服务器
 */
export function copySharedComponent(serverId: number, sourceComponentId: number) {
  return http.request<ServerComponent>({
    url: `/v1/gen/server/component/copy/${serverId}/${sourceComponentId}`,
    method: "post"
  });
}

/**
 * 根据组件类型获取组件列表
 */
export function fetchServerComponentsByType(componentType: string) {
  return http.request<ServerComponent[]>({
    url: `/v1/gen/server/component/type/${componentType}`,
    method: "get"
  });
}

/**
 * 检查组件是否可以删除
 */
export function checkCanDeleteComponent(componentId: number) {
  return http.request<boolean>({
    url: `/v1/gen/server/component/can-delete/${componentId}`,
    method: "get"
  });
}

/**
 * 获取服务器布局配置
 */
export function fetchServerLayout(serverId: number) {
  return http.request<string>({
    url: `/v1/gen/server/component/layout/${serverId}`,
    method: "get"
  });
}

/**
 * 保存服务器布局配置
 */
export function saveServerLayout(serverId: number, layoutConfig: string) {
  return http.request<boolean>({
    url: `/v1/gen/server/component/layout/${serverId}`,
    method: "post",
    data: layoutConfig
  });
}
