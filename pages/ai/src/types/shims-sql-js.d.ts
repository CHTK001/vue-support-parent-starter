/**
 * sql.js 的模块类型垫片（全局声明）。
 *
 * <p>本文件<b>不能有顶层 import / export</b>：一旦成为模块，里面的
 * {@code declare module} 会被当成「模块增强」，对未声明类型的包直接报错。
 * 只声明 {@link ConfigImportDialog}（cc-switch .db 导入）用到的那一小块：
 * 初始化工厂（带 {@code locateFile}）与 {@code Database.exec} 的结果形状。
 * 形状与 pages/filesystem 的 shims-client-preview-libs.d.ts 保持一致。</p>
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

/** sql.js 的 wasm 资源子路径（`sql.js/dist/sql-wasm.wasm?url` 导入用） */
declare module "sql.js/dist/sql-wasm.wasm" {
  const sqlWasmUrl: string;
  export default sqlWasmUrl;
}
