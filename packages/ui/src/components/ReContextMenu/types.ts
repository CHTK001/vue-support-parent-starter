/** 菜单项定义 */
export interface ReContextMenuItem {
  /** 显示文本 */
  label: string;
  /** 图标名（ReIcon name） */
  icon?: string;
  /** 命令标识，点击时通过 select 事件发出 */
  command?: string;
  /** 是否危险操作（红色文字） */
  danger?: boolean;
  /** 是否显示（false 则隐藏） */
  visible?: boolean;
  /** 是否渲染为分隔线 */
  separator?: boolean;
  /** 子菜单（存在则渲染为分组节点，hover 展开） */
  children?: ReContextMenuItem[];
}
