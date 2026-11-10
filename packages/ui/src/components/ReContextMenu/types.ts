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
  /**
   * 右侧说明文字（灰色、贴右、不参与点击）。
   *
   * <p>用来解释这一项的作用域或当前值，例如「固定在左侧」「当前：users 表」。
   * 需要「点击后才生效的提示」请别放这里 —— 说明文字不可点。</p>
   */
  hint?: string;
  /**
   * 勾选态。
   *
   * <p><b>只有布尔值才会渲染左侧勾选列</b>（false 也渲染，占位但不显示 ✓）：
   * 同一分组里的开关项必须都写 `checked`，才能保证文字左边缘对齐；
   * 不参与勾选的项（{@code undefined}）不占这一列。</p>
   */
  checked?: boolean;
  /**
   * 分组小标题（渲染为不可点的灰字行）。
   *
   * <p>与 {@link note} 的区别：{@code group} 是「下面这几项属于哪一组」的标题，
   * 出现在组首；{@code note} 是补充说明，出现在组尾或孤立成行。</p>
   */
  group?: string;
  /** 纯说明行（不可点、不响应悬停），用来解释紧邻的那组菜单项 */
  note?: string;
}
