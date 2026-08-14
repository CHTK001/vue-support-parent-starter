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
 * 注意：不得在此处显式 re-export 单个 API（如 getLocale/setCanvasCreator），
 * Vite optimizeDeps 预构建 echarts 时 chunk 可能不包含所有命名导出，会导致
 * "does not provide an export named xxx" 语法错误，阻断整个模块图。
 * 依赖 `export *` 与 default namespace 即可。
 */
export * from "echarts/index.js";
import * as echarts from "echarts/index.js";
export default echarts;
