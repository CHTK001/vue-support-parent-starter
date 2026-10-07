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