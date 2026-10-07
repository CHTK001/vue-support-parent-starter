/**
 * 建表 / 补列对话框（组件化）。
 *
 * <p>数据源中心 JDBC DDL 能力的统一前端入口：打开即预览 SQL，确认后执行。
 * 请求与 preview / execute 回调由宿主注入，采集侧与数据源中心共用这一份实现。</p>
 */
import CreateTableDialog from "./CreateTableDialog.vue";

export type { TableDdlRequest, TableDdlResult } from "./types";
export default CreateTableDialog;
