/**
 * ScPanel 面板组件（原 ScContainer）
 * 支持拖拽、折叠、最大化、可调整大小等功能
 * @author CH
 * @version 2.0.0
 * @since 2025-12-02
 * @since 2025-12-05 重构：更名为 ScPanel，添加拖拽、折叠、最大化功能
 */
import ScPanel from "./src/index.vue";

// 导出新名称
export default ScPanel;
export { ScPanel };

// 保留旧名称兼容
export const ScContainer = ScPanel;
