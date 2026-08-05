import type { App, Plugin } from "vue";
import ReFilter from "./ReFilter.vue";

const plugin: Plugin = {
  install(app: App) {
    app.component("ReFilter", ReFilter);
  },
};

export { plugin as install };
export default ReFilter;
export type { ReFilterItem, ReFilterProps } from "./types";
