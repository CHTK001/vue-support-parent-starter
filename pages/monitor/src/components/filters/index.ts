/**
 * ServerFilter 配置组件注册表。
 *
 * 规格：每个 ServerFilter 在前端都有对应的**特定组件**，配置面板按类型分派；
 * 没有专用实现的过滤器回退到 schema 驱动的通用表单（因此新增插件零改动也能用）。
 *
 * 新增一个带专属页面的过滤器只需两步：
 *   1. 在 components/filters/ 下新建面板组件（props 用 FilterPanel 契约）；
 *   2. 在下方 REGISTRY 里加一行 `'<插件类型>': markRaw(YourPanel)`。
 *
 * 与 filterDetail.ts 的元数据驱动思路一致：后端 /filters 仍是参数与能力的唯一事实来源，
 * 这里只决定「用哪个组件渲染」。
 */
import { markRaw, type Component } from 'vue';
import ScFileStorageFilterPanel from './ScFileStorageFilterPanel.vue';
import ScDiscoveryFilterPanel from './ScDiscoveryFilterPanel.vue';
import ScFirewallFilterPanel from './ScFirewallFilterPanel.vue';
import ScMappingFilterPanel from './ScMappingFilterPanel.vue';
import ScGenericFilterPanel from './ScGenericFilterPanel.vue';

/**
 * 类型别名归一：后端历史上给过 fileStorage 这类别名，
 * 注册表按规范名（连字符）查找，避免同插件出现两套配置页。
 */
const ALIAS: Record<string, string> = {
  fileStorage: 'file-storage',
  file_storage: 'file-storage',
  serviceDiscovery: 'service-discovery',
  service_discovery: 'service-discovery',
};

/** 专用面板注册表（规范名 → 组件） */
const REGISTRY: Record<string, Component> = {
  'file-storage': markRaw(ScFileStorageFilterPanel),
  'service-discovery': markRaw(ScDiscoveryFilterPanel),
  firewall: markRaw(ScFirewallFilterPanel),
  ip: markRaw(ScFirewallFilterPanel),
  // 映射类：后端下发的 type 是大写（URL-MAPPING / SHELL-URL-MAPPING），两种写法都收
  'url-mapping': markRaw(ScMappingFilterPanel),
  'URL-MAPPING': markRaw(ScMappingFilterPanel),
  'shell-url-mapping': markRaw(ScMappingFilterPanel),
  'SHELL-URL-MAPPING': markRaw(ScMappingFilterPanel),
};

/**
 * 归一化过滤器类型
 *
 * @param type 后端给出的过滤器类型
 * @returns 规范名；无法归一时返回去空格后的原值
 */
export function normalizeFilterType(type?: string | null): string {
  const t = (type ?? '').trim();
  return ALIAS[t] ?? t;
}

/**
 * 解析该过滤器类型应使用的配置组件
 *
 * @param type 后端给出的过滤器类型
 * @returns 专用组件；未注册时返回通用 schema 表单
 */
export function resolveFilterPanel(type?: string | null): Component {
  return REGISTRY[normalizeFilterType(type)] ?? ScGenericFilterPanel;
}

/**
 * 该类型是否有专用配置组件
 *
 * @param type 后端给出的过滤器类型
 * @returns 有专用组件返回 true
 */
export function hasDedicatedFilterPanel(type?: string | null): boolean {
  return Boolean(REGISTRY[normalizeFilterType(type)]);
}

export {
  ScFileStorageFilterPanel,
  ScDiscoveryFilterPanel,
  ScFirewallFilterPanel,
  ScMappingFilterPanel,
  ScGenericFilterPanel,
};
