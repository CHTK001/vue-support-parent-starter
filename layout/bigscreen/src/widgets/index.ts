/**
 * 内置 Widget 类型注册入口
 * 在大屏布局初始化时调用 registerAllWidgetTypes()
 */
import { registerWidgetType } from "../composables/useWidgetRegistry";
import { panelWidgets } from "./panel";
import { headerWidgets } from "./header";
import { decorationWidgets } from "./decoration";
import { geometryWidgets } from "./geometry";
import { scrollingTextWidgets } from "./scrolling-text";
import { iframeWidgets } from "./iframe";

export { panelWidgets } from "./panel";
export { headerWidgets } from "./header";
export { decorationWidgets } from "./decoration";
export { geometryWidgets } from "./geometry";
export { scrollingTextWidgets } from "./scrolling-text";
export { iframeWidgets } from "./iframe";

const allWidgets = [
  ...panelWidgets,
  ...headerWidgets,
  ...decorationWidgets,
  ...geometryWidgets,
  ...scrollingTextWidgets,
  ...iframeWidgets,
];

export function registerAllWidgetTypes(): void {
  allWidgets.forEach(registerWidgetType);
}
