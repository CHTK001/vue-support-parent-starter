/** Tab 项 */
export interface ReTabItem {
  /** tab 唯一标识（el-tab-pane name） */
  name: string;
  /** 显示文案 */
  label?: string;
  /** 图标名（el 图标或 iconify） */
  icon?: string;
  /** 是否可关闭 */
  closable?: boolean;
  /** 是否禁用 */
  disabled?: boolean;
}
