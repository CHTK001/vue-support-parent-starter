/**
 * ReSectionHead 组件默认导出类型声明
 */
declare const ReSectionHead: import("vue").DefineComponent<{
  title?: string;
  description?: string;
}>;
export default ReSectionHead;
export const component: () => Promise<typeof ReSectionHead>;
export const install: (app: import("vue").App) => Promise<void>;
