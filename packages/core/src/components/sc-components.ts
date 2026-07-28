/**
 * Sc* 系列组件注册表 - 集中管理所有 Sc* 组件的延迟加载和注册
 *
 * 设计原则：
 * 1. 所有组件默认使用 defineAsyncComponent 延迟加载，不影响首屏
 * 2. 高频组件（ScButton/ScInput/ScIcon）支持 eager 加载
 * 3. 提供精细化控制：可指定仅注册部分组件
 *
 * @author CH
 * @since 1.0.0
 */

import { defineAsyncComponent } from "vue";
import type { App, Component, AsyncComponentLoader } from "vue";

// ─────────────────────────────────────────────
// 组件定义：name → loader
// ─────────────────────────────────────────────

/**
 * 高频组件（全局 eager 注册，阻塞启动）
 * 仅 ScButton/ScInput/ScIcon 三个最核心组件使用同步加载
 */
export const EAGER_COMPONENTS: Record<string, () => Promise<{ default: Component }>> = {
  /** 按钮 - 所有页面都需要 */
  ScButton: () => import("@repo/components/ScButton"),
  /** 输入框 - 所有表单都需要 */
  ScInput: () => import("@repo/components/ScInput"),
  /** 图标包装器 */
  ScIcon: () => import("@repo/components/ScIcon"),
};

/**
 * 通用组件（全局 async 注册，首次使用时加载）
 * 使用频率极高，几乎每个页面都会用到
 */
export const COMMON_COMPONENTS: Record<string, AsyncComponentLoader> = {
  /** 表格 */
  ScTable: () => import("@repo/components/ScTable/index.vue"),
  /** 表格列 */
  ScTableColumn: () => import("@repo/components/ScTableColumn").then((m) => m.default),
  /** 对话框 */
  ScDialog: () => import("@repo/components/ScDialog").then((m) => m.ScDialog),
  /** 表单 */
  ScForm: () => import("@repo/components/ScForm").then((m) => m.default),
  /** 表单项 */
  ScFormItem: () => import("@repo/components/ScFormItem").then((m) => m.default),
  /** 下拉选择 */
  ScSelect: () => import("@repo/components/ScSelect").then((m) => m.default),
  /** 标签 */
  ScTag: () => import("@repo/components/ScTag").then((m) => m.default),
  /** 开关 */
  ScSwitch: () => import("@repo/components/ScSwitch/index.vue").then((m) => m.default),
};

/**
 * 场景组件（局部按需导入，不再全局注册）
 * 仅在特定场景使用，业务页面应自行局部导入
 */
export const SCENE_COMPONENTS: Record<string, AsyncComponentLoader> = {
  /** 提示框 */
  ScTooltip: () => import("@repo/components/ScTooltip").then((m) => m.default),
  /** 标签页 */
  ScTabs: () => import("@repo/components/ScTabs").then((m) => m.ScTabs),
  /** 标签页面板 */
  ScTabPane: () => import("@repo/components/ScTabs").then((m) => m.ScTabPane),
  /** 抽屉 */
  ScDrawer: () => import("@repo/components/ScDrawer").then((m) => m.default),
  /** 徽标 */
  ScBadge: () => import("@repo/components/ScBadge").then((m) => m.default),
  /** 头像 */
  ScAvatar: () => import("@repo/components/ScAvatar").then((m) => m.default),
  /** 回到顶部 */
  ScBacktop: () => import("@repo/components/ScBacktop").then((m) => m.default),
  /** 卡片 */
  ScCard: () => import("@repo/components/ScCard").then((m) => m.default),
  /** 时间文本 */
  ScTimeText: () => import("@repo/components/ScTimeText").then((m) => m.default),
  /** 复选框 */
  ScCheckbox: () => import("@repo/components/ScCheckbox").then((m) => m.ScCheckbox),
  /** 复选框组 */
  ScCheckboxGroup: () => import("@repo/components/ScCheckbox").then((m) => m.ScCheckboxGroup),
  /** 列 */
  ScCol: () => import("@repo/components/ScCol").then((m) => m.default),
  /** 容器 */
  ScContainer: () => import("@repo/components/ScContainer").then((m) => m.default),
  /** 日期选择器 */
  ScDatePicker: () => import("@repo/components/ScDatePicker").then((m) => m.default),
  /** 下拉菜单 */
  ScDropdown: () => import("@repo/components/ScDropdown").then((m) => m.default),
  /** 下拉菜单项 */
  ScDropdownItem: () => import("@repo/components/ScDropdownItem").then((m) => m.default),
  /** 下拉菜单面板 */
  ScDropdownMenu: () => import("@repo/components/ScDropdownMenu").then((m) => m.default),
  /** 空状态 */
  ScEmpty: () => import("@repo/components/ScEmpty").then((m) => m.default),
  /** 装饰 */
  ScDeco: () => import("@repo/components/ScDeco").then((m) => m.ScDeco),
  /** 头部 */
  ScHeader: () => import("@repo/components/ScHeader").then((m) => m.ScHeader),
  /** 面板 */
  ScPanel: () => import("@repo/components/ScPanel").then((m) => m.default),
  /** 图片 */
  ScImage: () => import("@repo/components/ScImage").then((m) => m.default),
  /** 数字输入 */
  ScInputNumber: () => import("@repo/components/ScInputNumber").then((m) => m.default),
  /** 主体 */
  ScMain: () => import("@repo/components/ScMain").then((m) => m.default),
  /** 菜单 */
  ScMenu: () => import("@repo/components/ScMenu").then((m) => m.default),
  /** 菜单项 */
  ScMenuItem: () => import("@repo/components/ScMenuItem").then((m) => m.default),
  /** 选项 */
  ScOption: () => import("@repo/components/ScOption").then((m) => m.default),
  /** 气泡 */
  ScPopover: () => import("@repo/components/ScPopover").then((m) => m.default),
  /** 确认气泡 */
  ScPopconfirm: () => import("@repo/components/ScPopconfirm").then((m) => m.default),
  /** 行 */
  ScRow: () => import("@repo/components/ScRow").then((m) => m.default),
  /** 覆盖页面 */
  ScOverlayPage: () => import("@repo/components/ScOverlayPage").then((m) => m.default),
  /** 音量控制 */
  ScVolumeControl: () => import("@repo/components/ScVolumeControl").then((m) => m.default),
  /** 文本 */
  ScText: () => import("@repo/components/ScText").then((m) => m.default),
};

// ─────────────────────────────────────────────
// 注册器 API
// ─────────────────────────────────────────────

/**
 * 初始化 Sc* 组件的 AsyncComponent 映射
 * 返回 { componentName: defineAsyncComponent(loader) }
 */
function initAsyncComponentMap(
  loaders: Record<string, AsyncComponentLoader>,
): Record<string, Component> {
  const map: Record<string, Component> = {};
  for (const [name, loader] of Object.entries(loaders)) {
    map[name] = defineAsyncComponent(loader);
  }
  return map;
}

/**
 * 在 Vue 应用实例上注册 Sc* 组件
 *
 * @param app - Vue 应用实例
 * @param options.eager    - 是否注册高频 eager 组件（默认 true）
 * @param options.common   - 是否注册通用 async 组件（默认 true）
 * @param options.scene    - 是否注册场景组件（默认 false，推荐页面自行局部导入）
 * @param options.extra    - 额外的自定义组件映射
 */
export function registerScComponents(
  app: App,
  options: {
    eager?: boolean;
    common?: boolean;
    scene?: boolean;
    extra?: Record<string, Component>;
  } = {},
): void {
  const { eager = true, common = true, scene = false, extra } = options;

  // ── 高频 eager 组件 ──
  if (eager) {
    for (const [name, loader] of Object.entries(EAGER_COMPONENTS)) {
      loader().then((mod) => {
        app.component(name, mod.default || mod);
      });
    }
  }

  // ── 通用 async 组件 ──
  if (common) {
    const commonMap = initAsyncComponentMap(COMMON_COMPONENTS);
    for (const [name, component] of Object.entries(commonMap)) {
      app.component(name, component);
    }
  }

  // ── 场景组件（仅当显式开启时才全局注册） ──
  if (scene) {
    const sceneMap = initAsyncComponentMap(SCENE_COMPONENTS);
    for (const [name, component] of Object.entries(sceneMap)) {
      app.component(name, component);
    }
  }

  // ── 额外自定义组件 ──
  if (extra) {
    for (const [name, component] of Object.entries(extra)) {
      app.component(name, component);
    }
  }
}

/**
 * 获取指定 Sc* 组件的 defineAsyncComponent 实例（用于局部导入）
 *
 * @example
 * ```ts
 * // 在页面中局部导入
 * import { getScComponent } from "@repo/core/components/sc-components";
 * const ScText = getScComponent("ScText");
 * ```
 */
export function getScComponent(name: string): Component | undefined {
  const loader = SCENE_COMPONENTS[name] || COMMON_COMPONENTS[name];
  if (!loader) {
    return undefined;
  }
  return defineAsyncComponent(loader);
}

/**
 * 获取场景组件的 loader（用于手动 defineAsyncComponent）
 */
export function getScComponentLoader(name: string): AsyncComponentLoader | undefined {
  return SCENE_COMPONENTS[name] || COMMON_COMPONENTS[name];
}
