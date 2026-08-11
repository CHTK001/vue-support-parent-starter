/**
 * ReStateDot 组件默认导出类型声明
 */
declare const ReStateDot: import("vue").DefineComponent<{
  state: "connected" | "connecting" | "error" | "disconnected" | "idle";
  pulse?: boolean;
}>;
export default ReStateDot;
export const component: () => Promise<typeof ReStateDot>;
export const install: (app: import("vue").App) => Promise<void>;
