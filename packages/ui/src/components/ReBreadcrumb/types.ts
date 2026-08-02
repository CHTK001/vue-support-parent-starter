/**
 * ReBreadcrumb 类型定义
 */
export interface BreadcrumbItem {
  key?: string | number;
  label: string;
  href?: string;
  icon?: string;
  to?: string | Record<string, unknown>;
  disabled?: boolean;
}
