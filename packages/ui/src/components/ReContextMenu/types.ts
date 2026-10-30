import type { Component } from "vue";

/** 菜单项定义 */
export interface ReContextMenuItem {
  /** 显示文本（分隔线条目可省略） */
  label?: string;
  /**
   * 图标。
   *
   * <p>两种写法都支持：字符串按 {@code ReIcon} 的图标名解析（推荐，可被图标集统一换皮），
   * 组件则原样渲染 —— 宿主手里已经有 Element Plus 图标组件、不想再记一遍图标名时用它。</p>
   */
  icon?: string | Component;
  /** 命令标识，点击时通过 select 事件发出 */
  command?: string;
  /** 是否危险操作（红色文字） */
  danger?: boolean;
  /** 是否禁用（灰显、点了没反应）；禁用项无 command 时也不会触发 select */
  disabled?: boolean;
  /** 是否显示（false 则隐藏） */
  visible?: boolean;
  /** 是否渲染为分隔线 */
  separator?: boolean;
  /** 子菜单（存在则渲染为分组节点，hover 展开） */
  children?: ReContextMenuItem[];
}
