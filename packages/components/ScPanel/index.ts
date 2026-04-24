/**
 * ScPanel 面板组件
 * 基于 el-card，支持多种主题风格（default/tech/glass/neon）
 * @author CH
 * @version 1.0.0
 * @since 2025-12-05
 */
import ScPanel from "./src/index.vue";

export type PanelTheme =
  | "default"
  | "tech"
  | "techui"
  | "glass"
  | "neon"
  | "modern"
  | "gradient";
export type ScPanelTechVariant =
  | "A1"
  | "A2"
  | "A3"
  | "B1"
  | "B2"
  | "B3"
  | "B4"
  | "DV1"
  | "DV2"
  | "DV3"
  | "DV4"
  | "DV5"
  | "DV6"
  | "DV7"
  | "DV8"
  | "DV9";

export default ScPanel;
export { ScPanel };
