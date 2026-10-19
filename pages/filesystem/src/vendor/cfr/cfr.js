/**
 * @run-slicer/cfr 入口（精简版，本地 vendor）
 *
 * 相对上游的唯一改动：**移除 cfr.runtime.js 回退**。
 * 上游在 WASM 加载失败时退回 3.1 MB 的纯 JS 实现；本项目只在打开 .class 时按需
 * 加载，且失败会由 FvClassPanel 退回十六进制视图，没必要为极少数非标准浏览器
 * 多背 3.1 MB 体积。
 *
 * 许可：MIT（cfr.js 支撑代码与 CFR 本体，见同目录 LICENSE / LICENSE-CFR）。
 */
const isNode = typeof process !== "undefined";

const wasmPath = async () => {
    const url = new URL("./cfr.wasm", import.meta.url).href;
    return isNode ? await import("node:url").then((mod) => mod.fileURLToPath(url)) : url;
};

let decompileFunc = null;

export const decompile = async (names, options) => {
    if (!decompileFunc) {
        const { load } = await import("./cfr.wasm-runtime.js");
        const { exports } = await load(await wasmPath());
        decompileFunc = exports.decompile;
    }

    return decompileFunc(Array.isArray(names) ? names : [names], options);
};
