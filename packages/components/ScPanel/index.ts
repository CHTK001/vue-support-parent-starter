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

export default ScPanel;
export { ScPanel };
