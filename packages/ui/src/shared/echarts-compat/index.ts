// @ts-nocheck
/**
 * echarts 兼容层
 *
 * 业务代码大量使用 `import * as echarts from "echarts"`，而 ol-echarts 等第三方库
 * 使用默认导入 `import echarts from 'echarts'`。echarts 5 的 ESM 入口（index.js）
 * 只提供命名导出，没有 default，导致 Rollup 解析默认导入时报错。
 *
 * 本目录通过 Vite resolve.alias 被映射为 "echarts" 的解析目标：
 *   - export * 保留全部命名导出，业务 `import * as echarts` 继续可用
 *   - 再导出一个 default namespace，满足 ol-echarts 的默认导入
 *
 * 注意：部分 Vite 预构建（optimizeDeps）场景下 `export *` 在兼容层边界会丢失
 * `init` 等命名导出，导致 `echarts.init is not a function`。这里显式 re-export
 * 核心 API（init / getInstanceByDom / dispose / use / registerMap / connect 等），
 * 确保 `import * as echarts from "echarts"` 始终可用。
 */
export * from "echarts/index.js";
import * as echarts from "echarts/index.js";
export { init, getInstanceByDom, getInstanceById, registerMap, getMap, connect, disconnect, dispose, use, setPlatformAPI, registerLocale, getLocale, setCanvasCreator } from "echarts/index.js";
export default echarts;
