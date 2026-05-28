import { default as BigScreenLayout } from "./index.vue";

export type {
  WidgetConfig,
  WidgetRect,
  WidgetId,
  WidgetTypeKey,
  BigScreenProject,
  BigScreenConfigEntry,
  DataBindingConfig,
  ScrollingTextConfig,
  DigitalNumberConfig,
  IframeConfig,
  CustomCSS,
} from "./types/widget";
export type {
  WidgetTypeDefinition,
  ConfigFieldDefinition,
} from "./types/widget";

export { useBigScreenStore } from "./composables/useBigScreenStore";
export { useWidgetRegistry, getWidgetType, getAllWidgetTypes, getWidgetCategories } from "./composables/useWidgetRegistry";
export { useDataBinding } from "./composables/useDataBinding";
export { registerAllWidgetTypes } from "./widgets";
export { default as WidgetRenderer } from "./components/WidgetRenderer.vue";
export { default as WidgetItem } from "./components/WidgetItem.vue";

export default BigScreenLayout;
