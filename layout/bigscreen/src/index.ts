import { default as BigScreenLayout } from "./index.vue";

export type {
  WidgetConfig,
  WidgetRect,
  WidgetId,
  WidgetTypeKey,
  BigScreenProject,
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
export { useWidgetRegistry } from "./composables/useWidgetRegistry";
export { useDataBinding } from "./composables/useDataBinding";

export default BigScreenLayout;
