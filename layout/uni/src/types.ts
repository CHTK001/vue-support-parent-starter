export interface UniBottomNavItem {
  key: string;
  label: string;
  shortLabel: string;
  path: string;
  badge?: number | string;
  mode?: "reLaunch" | "redirectTo" | "switchTab";
}
