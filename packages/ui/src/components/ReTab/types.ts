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
  /**
   * 计数 badge（underline 变体渲染；其它变体忽略）。
   *
   * <p>空串 / null / undefined 不渲染 —— 空壳数字只添噪音。</p>
   */
  badge?: string | number | null;
}
