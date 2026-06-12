import { default as TechIndexPage } from "./index.vue";
export { default as TechTemplatePage } from "./views/template/index.vue";
export { default as TechComponentsDemoPage } from "./views/components-demo/index.vue";
export { default as BigScreenLayout } from "./index.vue";

export { useBigScreenStore } from "./composables/useBigScreenStore";
export { useWidgetRegistry, getWidgetType, getAllWidgetTypes, getWidgetCategories } from "./composables/useWidgetRegistry";
export { useDataBinding } from "./composables/useDataBinding";
export { registerAllWidgetTypes } from "./widgets";
export { default as WidgetRenderer } from "./components/WidgetRenderer.vue";
export { default as WidgetItem } from "./components/WidgetItem.vue";

export default TechIndexPage;
