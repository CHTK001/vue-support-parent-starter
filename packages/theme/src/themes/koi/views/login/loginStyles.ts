/**
 * 登录页样式注册表（koi 主题）
 *
 *  - default：臻享双栏（品牌展示 + 登录表单）
 *  - bubble：气泡简约（气泡背景 + 轻量卡片）
 *  - split：分屏沉浸（大屏分栏沉浸布局）
 */
import type { Component } from "vue";

export interface LoginStyleOption {
  /** 样式标识 */
  value: string;
  /** 展示名称 */
  label: string;
  /** 描述 */
  desc: string;
  /** 预览类名（选择器缩略图） */
  preview: string;
}

/** 全部登录样式选项（供设置面板选择器使用） */
export const loginStyleOptions: LoginStyleOption[] = [
  { value: "default", label: "臻享双栏", desc: "品牌展示 + 登录表单", preview: "dual" },
  { value: "bubble", label: "气泡简约", desc: "气泡背景轻量卡片", preview: "center" },
  { value: "split", label: "分屏沉浸", desc: "大屏分栏沉浸布局", preview: "immersive" },
];

const styleModules = import.meta.glob("./styles/*.vue") as Record<string, () => Promise<{ default: Component }>>;

/** 按样式名解析组件路径 */
function stylePath(value: string): string {
  return `./styles/${value}.vue`;
}

/** 获取登录页样式组件（找不到则回退 default） */
export function resolveLoginStyle(value: string): () => Promise<{ default: Component }> {
  return styleModules[stylePath(value)] ?? styleModules[stylePath("default")];
}
