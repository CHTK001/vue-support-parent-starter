export interface ScTabsRailItem {
  closable?: boolean;
  /** 优先使用全局 Iconify 图标（如 `ri:list-line`），与 `icon` 二选一 */
  iconify?: string;
  icon?: any;
  label?: string;
  name: string | number;
  title?: string;
}
