/**
 * TIFF / HEIC 解码库的模块类型垫片（全局声明）。
 *
 * <p>本文件**不能有顶层 import / export**：一旦成为模块，
 * 里面的 {@code declare module} 会被当成「模块增强」，对未声明类型的包会直接报错。
 * 形状定义放在 {@code ./client-preview-libs}。</p>
 *
 * @author Buffy
 * @since 2026/10/07
 */

/**
 * UTIF.js（npm 包 {@code utif}）
 *
 * <p>包的 {@code main} 字段是 {@code "UTIF"}（无扩展名），Vite 的解析器可能拒绝，
 * 故按文件路径引入。</p>
 */
declare module "utif/UTIF.js" {
  const UTIF: import("./client-preview-libs").UtifApi;
  export default UTIF;
}

/**
 * libheif-js 的自包含 wasm ESM 产物
 *
 * <p>刻意用 {@code libheif-bundle.mjs} 而不是包根的 {@code wasm-bundle}：
 * 后者是 {@code module.exports = require('...libheif-bundle.js')()} 的 CJS 包装，
 * 内层 bundle 自带 require 兜底逻辑，交给打包器处理容易出意外；mjs 版是官方推荐的
 * ES Module 形态，wasm 已内联为 base64（{@code wasmBinary}），无需再配 locateFile。</p>
 */
declare module "libheif-js/libheif-wasm/libheif-bundle.mjs" {
  const factory: import("./client-preview-libs").LibheifFactory;
  export default factory;
}

/**
 * sql.js（npm 包 {@code sql.js}）
 *
 * <p>包里只有 {@code dist/sql-wasm.js}，没带 {@code .d.ts}。
 * 这里只声明 {@link DataPreviewPanel} 用到的那一小块：
 * 初始化工厂（带 {@code locateFile}）与 {@code Database.exec} 的结果形状。</p>
 */
declare module "sql.js" {
  /** 一条查询结果 */
  interface SqlJsQueryResult {
    /** 列名 */
    columns: string[];
    /** 行数据 */
    values: unknown[][];
  }
  /** 初始化配置 */
  interface SqlJsConfig {
    /** 把库内部的 wasm 文件名解析成真实地址 */
    locateFile?: (file: string) => string;
  }
  /** 初始化后的 sql.js 运行时 */
  interface SqlJsStatic {
    /** 数据库句柄 */
    Database: new (data?: Uint8Array) => {
      /** 执行 SQL，返回每个结果集的列名与行 */
      exec(sql: string): SqlJsQueryResult[];
      /** 关闭并释放内存 */
      close(): void;
    };
  }
  /** 加载 sql.js（异步，含 wasm 编译） */
  const initSqlJs: (config?: SqlJsConfig) => Promise<SqlJsStatic>;
  export default initSqlJs;
}

/**
 * e-virt-table 的 ESM 产物子路径。
 *
 * <p>{@code @file-viewer/renderer-spreadsheet} 与
 * {@link module:eVirtTableSelectionBridge} 都以
 * {@code 'e-virt-table/dist/index.es.js'} 这一<b>完全相同</b>的路径 import，
 * 保证拿到同一模块实例（补丁才能命中渲染器实际用的那张表）。</p>
 *
 * <p>包的 {@code types} 字段只映射主入口（{@code dist/lib/index.d.ts}），
 * 子路径没有类型映射，动态 import 会报 TS7016。这里只声明桥接用到的
 * 默认导出形状（要 patch 其 {@code prototype.draw} 的主类）。</p>
 */
declare module "e-virt-table/dist/index.es.js" {
  /** 主类（默认导出），桥接只 patch 其 prototype.draw */
  const EVirtTable: { prototype?: Record<string, unknown> };
  export default EVirtTable;
}

/**
 * @cornerstonejs/codec-libjxl 的 WASM 子路径没有类型声明。
 *
 * <p>FvJxlPanel 只用默认导出的异步工厂，这里声明最小形状即可。</p>
 */
declare module "@cornerstonejs/codec-libjxl/decodewasmjs" {
  /** 创建 JXL WASM 解码器工厂 */
  const createDecoder: (opts?: Record<string, unknown>) => Promise<unknown>;
  export default createDecoder;
}

/**
 * mammoth（docx → HTML）没有自带类型声明。
 *
 * <p>协同 Word 编辑器（WordCollabEditor.vue）与协同管理页上传转协同
 * （FileCollabManage.vue）只用 convertToHtml，这里声明最小形状。</p>
 */
declare module "mammoth" {
  /** 转换选项：arrayBuffer 为源文件字节 */
  interface MammothOptions {
    arrayBuffer: ArrayBuffer;
  }
  /** 转换结果 */
  interface MammothResult {
    /** 转换后的 HTML 片段 */
    value: string;
    /** 转换过程消息（警告等） */
    messages?: Array<{ type?: string; message?: string }>;
  }
  /** docx → HTML 转换 */
  export function convertToHtml(options: MammothOptions): Promise<MammothResult>;
}