/**
 * XLS → XLSX 转换器（浏览器内 WASM）加载层
 *
 * <p>`.xls` 是 BIFF（二进制复合文档），而前端唯一能渲染表格的
 * {@code @vue-office/excel} 走的是 ZIP/OOXML 解包 —— 直接喂 `.xls` 字节会抛
 * {@code Can't find end of central directory}。所以这里把 `.xls` 转成合法
 * {@code .xlsx} 字节，再交给同一个组件：<b>xls 与 xlsx 于是走同一套 UI 与交互</b>
 * （sheet 页签、冻结窗格、选区、主题跟随），渲染器那边一行都不用改。</p>
 *
 * <p>实现是 Rust/WASM（{@code crates/xls2xlsx}）：calamine 读 BIFF8，
 * rust_xlsxwriter 写 xlsx，两个都是纯 Rust、无 C 依赖。</p>
 *
 * <p><b>保真度边界（务必如实告知用户）</b>：calamine 只读值与类型，读不出单元格
 * 样式（字体/填充/边框/对齐）与 BIFF 公式。所以产出的是「只有值」的 xlsx ——
 * 数据一致、UI 一致，<b>像素级样式不保</b>。这是选 calamine 的必然结果而非实现缺陷。</p>
 *
 * <p>WASM 资产由 {@code wasm-bindgen} 预生成并随包提交（见 crate 的 README 注释），
 * 用 {@code ?url} 打成同源静态资源，避免公网 CDN。</p>
 *
 * @author Buffy
 * @since 2026/10/07
 */
import initWasm, { xls_to_xlsx } from "../wasm/xls2xlsx/xls2xlsx.js";
import wasmUrl from "../wasm/xls2xlsx/xls2xlsx_bg.wasm?url";

/**
 * 在线预览体积上限（字节）。
 *
 * <p>20MB。两个原因：</p>
 * <ul>
 *   <li>wasm 内存线性增长，而 rust_xlsxwriter 的 {@code constant_memory} /
 *       {@code low_memory} 模式依赖 tempfile，浏览器里用不了，只能 standard
 *       模式整份常驻；</li>
 *   <li>calamine 读 {@code Xls} 无法惰性加载（打开时一次载入全部 sheet，
 *       只有 xlsx/xlsb 才有 lazy loading），大文件会一次性吃满内存。</li>
 * </ul>
 *
 * <p>另有实测参考：calamine 读 60MB xls 原生 9.1s、wasm 33.5s（issue #268）。
 * 预览场景卡在 20MB 内没有这个问题。</p>
 */
const MAX_BYTES = 20 * 1024 * 1024;

/** 字节数可读化 */
function formatSize(bytes: number): string {
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
  return `${(bytes / 1024 / 1024 / 1024).toFixed(2)} GB`;
}

/** WASM 初始化 promise（并发复用，只装一次） */
let ready: Promise<void> | null = null;

/**
 * 确保 WASM 已就绪（幂等、可并发）。
 *
 * <p>wasm-bindgen 生成的 {@code init} 内部有「已初始化就短路」的保护，但并发
 * 调用时每个都会各自发一次实例化请求。这里自己缓存 promise，避免同时打开两个
 * 预览弹层时重复下载/实例化。</p>
 */
function ensureReady(): Promise<void> {
  if (!ready) {
    ready = initWasm({ module_or_path: wasmUrl }).then(() => undefined);
    // 初始化失败要清掉缓存，否则一次网络抖动后这个面板永久失效
    ready.catch(() => {
      ready = null;
    });
  }
  return ready;
}

/**
 * 把 BIFF(.xls) 字节转成 xlsx 字节。
 *
 * @param bytes 原始 xls 字节
 * @returns 合法 xlsx 字节；失败时抛出带可读中文文案的 Error
 */
export async function convertXlsToXlsx(bytes: Uint8Array): Promise<ArrayBuffer> {
  if (bytes.byteLength > MAX_BYTES) {
    throw new Error(
      `文件过大（${formatSize(bytes.byteLength)}），超过在线预览上限 ${formatSize(MAX_BYTES)}，`
      + "请下载后用 Excel 打开",
    );
  }
  await ensureReady();
  // 转换是同步的（大文件会阻塞主线程几十毫秒到数百毫秒），
  // 但让出一帧可以让「正在转换…」先画出来，避免看起来像卡死
  await new Promise((r) => setTimeout(r, 0));
  const out = xls_to_xlsx(bytes);
  if (!(out instanceof Uint8Array)) {
    // wasm 侧返回的是 Err(String) 的 JS 投影，不是 Error
    throw new Error(typeof out === "string" ? out : "XLS 转换失败");
  }
  // 必须拷成独立 ArrayBuffer：out 的底层是 wasm 线性内存，
  // 后续任何 wasm 调用都可能覆写它，而它要活到组件解析完。
  return out.slice().buffer;
}