/**
 * 可视化编辑器类型定义（自由布局版）
 * 基于 bigscreen 的 WidgetConfig，扩展数据绑定脚本和保存选项
 */
import type { WidgetConfig, DataBindingConfig } from "@layout/bigscreen";

/** 编辑器数据绑定（扩展 bigscreen，增加处理脚本） */
export interface EditorDataBinding extends DataBindingConfig {
  processScript?: string;
}

/** 保存目标 */
export type SaveTarget = "local" | "backend" | "both";

/** 保存配置（弹窗表单） */
export interface SaveConfig {
  target: SaveTarget;
  backendUrl: string;
}

export const DEFAULT_SAVE_CONFIG: SaveConfig = {
  target: "local",
  backendUrl: "",
};

export const STORAGE_KEY = "editor-project";
