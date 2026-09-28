/**
 * ReStatCard 组件默认导出类型声明
 */
declare const ReStatCard: import("vue").DefineComponent<{
  title: string;
  value?: string | number;
  desc?: string;
  icon?: import("vue").Component;
  iconColor?: string;
  size?: "default" | "compact";
}>;
export default ReStatCard;
export const component: () => Promise<typeof ReStatCard>;
export const install: (app: import("vue").App) => Promise<void>;
