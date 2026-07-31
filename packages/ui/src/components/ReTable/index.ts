/**
 * ReTable —— 表格组件（el-table 封装）
 *
 * 支持动态数据源（data / url / 函数）与列 schema 渲染。
 *   <ReTable :columns="[{ prop: 'name', label: '名称' }]" url="/api/users" />
 */
import type { App, Plugin } from "vue";
import ReTable from "./ReTable.vue";

const plugin: Plugin = {
  install(app: App) {
    app.component("ReTable", ReTable);
  },
};

export { plugin as install };
export default ReTable;
export * from "./types";
export * from "./columnStorage";
