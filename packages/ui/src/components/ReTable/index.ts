/**
 * ReTable —— 表格组件（el-table 封装）
 *
 * 支持动态数据源（data / url / 函数）与列 schema 渲染。
 *   <ReTable :columns="[{ prop: 'name', label: '名称' }]" url="/api/users" />
 */
import { defineAsyncComponent, type App, type Plugin } from "vue";
import ReTable from "./ReTable.vue";

import ReTableContextMenu from "./ReTableContextMenu.vue";
import ReTableToolbar from "./ReTableToolbar.vue";

/** 卡片布局使用面窄，异步加载避免打进主包 */
const ReTableCardView = defineAsyncComponent(() => import("./ReTableCardView.vue"));

const plugin: Plugin = {
  install(app: App) {
    app.component("ReTable", ReTable);
    app.component("ReTableCardView", ReTableCardView);
    app.component("ReTableContextMenu", ReTableContextMenu);
    app.component("ReTableToolbar", ReTableToolbar);
  },
};

export { plugin as install };
export default ReTable;
export * from "./types";
export * from "./columnStorage";
export * from "./composables";