/**
 * @pages/bigscreen 可视化大屏模块入口
 *
 * <p>three-screen-lab 七屏（风电 / 工厂 / 人口 / 巡检 / 农业 / 工业 / 园区）整体迁入：
 * 屏幕源码逐字节保留，由 {@code lib/assemble.ts} 按 three-screen-lab 的构建规则
 * 运行时拼装成完整 HTML 文档，iframe srcdoc 承载，观测台视觉与 3D 内核原样呈现。</p>
 *
 * <p><b>自注册</b>：import 本模块（哪怕只为拿工具函数）即完成内置七屏注册 ——
 * 宿主与各 {@code pages/xx} 模块无需显式调用注册逻辑。</p>
 *
 * <p><b>模块贡献</b>：其他 pages 模块可用 {@link defineBigScreenContribution}
 * 贡献自己的大屏（文档工厂或 Vue 组件），或按 id 覆盖内置屏（换肤 / 换数据）。</p>
 *
 * @author CH
 * @since 4.0.0.52
 */
import "./builtin";

export type {
  BigScreenCatalogItem,
  BigScreenCategory,
  BigScreenComponentFactory,
  BigScreenContribution,
  BigScreenDocumentFactory,
  BigScreenRegistration,
} from "./types";
export {
  bigScreenCatalog,
  defineBigScreenContribution,
  getBigScreenCatalog,
  getBigScreenRegistration,
  getBigScreenRegistrations,
  isBigScreenRegistered,
  registerBigScreens,
} from "./registry";
export { createBigScreenRoutes, type BigScreenRoutesOptions } from "./routes";
export { default as BigScreenFrame } from "./components/BigScreenFrame.vue";
export { default as BigScreenGallery } from "./components/BigScreenGallery.vue";
