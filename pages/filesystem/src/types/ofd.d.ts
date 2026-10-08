/**
 * ofd.js（国产版式文档 OFD 前端渲染库）的模块类型垫片。
 *
 * <p><b>为什么需要手写声明。</b>ofd.js@1.5.0 只发布了一个约 4.9 MB 的 webpack
 * UMD 产物（{@code dist/ofd.js}，形如
 * {@code module.exports = factory(require("parser_helper_x.js"), require("axios"))}），
 * 包里没有任何 {@code .d.ts}。UMD 的具名导出由 webpack 的
 * {@code Object.defineProperty(exports, name, { get }) } 挂出，打包器
 * （esbuild / rollup 的 CJS interop）无法静态识别出全部具名导出，因此在运行时
 * 一律按「default 导出对象」取用，并在组件里逐函数做存在性校验。</p>
 *
 * <p><b>本文件不能有顶层 import / export。</b>一旦成为模块，
 * 下面的 {@code declare module} 会被当成「模块增强」，对未声明类型的包会直接报错
 * （与 {@code shims-client-preview-libs.d.ts} 同一口径）。</p>
 *
 * <p><b>已核对的导入形态（ofd.js@1.5.0）：</b></p>
 * <ul>
 *   <li>{@code parseOfdDocument}／{@code renderOfd}／{@code renderOfdByIndex}／
 *       {@code getOFDPageCount}／{@code pageSize} 等具名导出确实存在（webpack
 *       {@code __webpack_require__.d} 挂载）。</li>
 *   <li>运行时依赖 {@code parser_helper_x.js} 与 {@code axios}，由 pnpm 作为
 *       ofd.js 的邻接依赖安装（{@code .pnpm/ofd.js@1.5.0/node_modules/}），
 *       {@code require} 可解析，无需额外补装。</li>
 *   <li><b>不需要全局 JSZip</b>：OFD 的 ZIP 解包与版式解析全部在
 *       {@code parser_helper_x.js} 的 WASM 里完成；该 WASM 以
 *       {@code data:application/wasm;base64,...} 内联在 ofd.js 产物中
 *       （{@code locateFile} 返回该 data URL），不请求外部 {@code .wasm} 文件。</li>
 * </ul>
 *
 * @author CH
 * @since 2026/10/08
 */

declare module "ofd.js" {
  /** {@code parseOfdDocument} 入参 */
  export interface OfdParseOptions {
    /** OFD 内容：File / Blob / ArrayBuffer / URL 字符串（URL 形态需外网可达） */
    ofd: File | Blob | ArrayBuffer | string;
    /**
     * 核心库授权码。
     *
     * <p>不传时库会把全局水印置为 {@code "demotest"}，渲染出的每一页都会带上
     * 该水印；有正式授权时传入即可消除。</p>
     */
    secret?: string;
    /** 核心库授权摘要（与 {@link secret} 配套） */
    digest?: string;
    /** 全局水印文字 */
    waterText?: string;
    /** {@link ofd} 传 URL 时的自定义请求头 */
    headers?: Record<string, string>;
    /** 解析成功回调（参数为库内部 Ofd_Core，本面板不使用） */
    success?: (core: unknown) => void;
    /** 解析失败回调（多为 string 文案；URL 分支可能是 Error） */
    fail?: (message: unknown) => void;
  }

  /** {@code renderOfd} / {@code renderOfdByIndex} 的可选渲染项 */
  export interface OfdRenderOptions {
    /** 单页水印文字 */
    waterText?: string;
    /** 只渲染前 N 页（{@code renderOfd} 用） */
    frontPages?: number;
    /** 混合模式（如 multiply） */
    mixBlendMode?: string;
  }

  /** 页面尺寸（{@code pageSize()} 返回） */
  export interface OfdPageSize {
    /** 物理宽度（毫米） */
    width: number;
    /** 物理高度（毫米） */
    height: number;
    /** 渲染宽度（像素，随 dpi 缩放） */
    renderWidth: number;
    /** 渲染高度（像素，随 dpi 缩放） */
    renderHeight: number;
  }

  /** 解析 OFD 字节（回调式；内部先初始化内嵌 WASM） */
  export function parseOfdDocument(options: OfdParseOptions): void;

  /** 解析 base64 形态的 OFD */
  export function parseOfdDocumentFromBase64(options: OfdParseOptions): void;

  /** 一次性渲染某文档的全部页，返回 div 数组（每页一个，默认 96 DPI 基准换算） */
  export function renderOfd(
    documentIndex: number,
    width: number,
    options?: OfdRenderOptions,
  ): HTMLDivElement[];

  /** 渲染某文档的单页，返回一个 div */
  export function renderOfdByIndex(
    documentIndex: number,
    pageIndex: number,
    width: number,
    options?: OfdRenderOptions,
  ): HTMLDivElement;

  /** 取某文档的页数 */
  export function getOFDPageCount(documentIndex?: number): number;

  /** 取某页的物理尺寸与渲染尺寸（{@code dpi} 缺省按 96 计） */
  export function pageSize(
    documentIndex: number,
    pageIndex: number,
    dpi?: number,
  ): OfdPageSize;

  /**
   * 释放当前解析的文档。
   *
   * <p>注意：实现只释放底层文档、**不清空库内部单例**，重复调用或紧随其后再次
   * {@code parseOfdDocument} 会对同一指针二次 free。面板因此不调用它，
   * 交给下一次 {@code parseOfdDocument} 内部释放上一份文档。</p>
   */
  export function free(): void;

  /** 切换查看器语言（仅独立 viewer 形态有效） */
  export function setLanguage(lang: string): void;

  /** default 导出：全部 API 挂在同一个对象上（UMD 的 module.exports） */
  const ofd: {
    parseOfdDocument: typeof parseOfdDocument;
    parseOfdDocumentFromBase64: typeof parseOfdDocumentFromBase64;
    renderOfd: typeof renderOfd;
    renderOfdByIndex: typeof renderOfdByIndex;
    getOFDPageCount: typeof getOFDPageCount;
    pageSize: typeof pageSize;
    free: typeof free;
    setLanguage: typeof setLanguage;
  };
  export default ofd;
}
