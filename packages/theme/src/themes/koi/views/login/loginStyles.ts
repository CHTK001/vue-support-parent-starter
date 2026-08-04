/**
 * 登录页样式注册表（koi 主题）
 *
 * 与线上 koi-ui 的 loginStyle 一致，供登录页容器动态切换：
 *  - default：臻享双栏（品牌展示 + 登录表单）
 *  - glass：动感玻璃（光斑动效 + 毛玻璃卡片）
 *  - slide：滑动登录（登录 / 注册滑动切换）
 *  - bubble：气泡简约（气泡背景 + 轻量卡片）
 *  - split：分屏沉浸（大屏分栏沉浸布局）
 *  - simple：经典点阵（蓝图网格 + 终端登录面板）
 *  - mono：极简终端（纯黑背景 + 大圆点终端面板）
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
  { value: "glass", label: "动感玻璃", desc: "光斑动效与毛玻璃卡片", preview: "glass" },
  { value: "slide", label: "滑动登录", desc: "登录 / 注册滑动切换", preview: "slide" },
  { value: "bubble", label: "气泡简约", desc: "气泡背景轻量卡片", preview: "center" },
  { value: "split", label: "分屏沉浸", desc: "大屏分栏沉浸布局", preview: "immersive" },
  { value: "simple", label: "经典点阵", desc: "蓝图网格 + 终端登录面板", preview: "classic" },
  { value: "mono", label: "极简终端", desc: "纯黑背景 + 大圆点终端面板", preview: "mono" },
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
