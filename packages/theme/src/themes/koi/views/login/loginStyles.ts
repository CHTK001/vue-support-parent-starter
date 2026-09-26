/**
 * 登录页样式注册表（koi 主题）
 *
 * 与 `styles/` 目录下的组件一一对应，全部可选：
 *  - default：简单双栏（品牌展示 + 登录表单）
 *  - card：居中卡片
 *  - bubble：气泡简约
 *  - glass：玻璃拟态
 *  - slide：流光卡片
 *  - split：分屏沉浸
 *  - splitReverse：左右分屏沉浸式
 *  - voxel：现代立体（3D 体素）
 *  - mono：等宽终端
 *  - simple：轻终端
 */
import type { Component } from "vue";

export interface LoginStyleOption {
  /** 样式标识（同时是 styles/<value>.vue 的文件名） */
  value: string;
  /** 展示名称 */
  label: string;
  /** 描述 */
  desc: string;
  /** 预览类名（选择器缩略图） */
  preview: string;
}

/** 全部登录样式选项（供设置面板选择器使用；label/desc 为 i18n key） */
export const loginStyleOptions: LoginStyleOption[] = [
  { value: "default", label: "menu.login.styleOptions.defaultLabel", desc: "menu.login.styleOptions.defaultDesc", preview: "dual" },
  { value: "card", label: "menu.login.styleOptions.cardLabel", desc: "menu.login.styleOptions.cardDesc", preview: "card" },
  { value: "bubble", label: "menu.login.styleOptions.bubbleLabel", desc: "menu.login.styleOptions.bubbleDesc", preview: "bubble" },
  { value: "glass", label: "menu.login.styleOptions.glassLabel", desc: "menu.login.styleOptions.glassDesc", preview: "glass" },
  { value: "slide", label: "menu.login.styleOptions.slideLabel", desc: "menu.login.styleOptions.slideDesc", preview: "slide" },
  { value: "split", label: "menu.login.styleOptions.splitLabel", desc: "menu.login.styleOptions.splitDesc", preview: "split" },
  { value: "splitReverse", label: "menu.login.styleOptions.splitReverseLabel", desc: "menu.login.styleOptions.splitReverseDesc", preview: "splitReverse" },
  { value: "voxel", label: "menu.login.styleOptions.voxelLabel", desc: "menu.login.styleOptions.voxelDesc", preview: "voxel" },
  { value: "mono", label: "menu.login.styleOptions.monoLabel", desc: "menu.login.styleOptions.monoDesc", preview: "mono" },
  { value: "simple", label: "menu.login.styleOptions.simpleLabel", desc: "menu.login.styleOptions.simpleDesc", preview: "simple" },
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
