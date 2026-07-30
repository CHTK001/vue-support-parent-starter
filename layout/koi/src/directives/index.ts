import { App } from "vue";
import auth from "./modules/auth";
import waterMarker from "./modules/waterMarker";
import draggable from "./modules/draggable";
import debounce from "./modules/debounce";
import debounceInput from "./modules/debounceInput";
import throttle from "./modules/throttle";
import throttleInput from "./modules/throttleInput";
import adaptive from "./modules/adaptive";
import copy from "./modules/copy";

// @repo/core 的 builtinDirectives 也会注册 auth/copy，这里跳过避免重复注册警告
const CORE_DIRECTIVES = new Set([
  "auth",
  "auths",
  "auths-all",
  "copy",
  "longpress",
  "optimize",
  "ripple",
  "admin",
  "role",
  "roles",
  "screenfull",
  "menu"
]);

const directivesList: any = {
  auth,
  waterMarker,
  draggable,
  debounce,
  debounceInput,
  throttle,
  throttleInput,
  adaptive,
  copy
};

const directives = {
  install: function (app: App<Element>) {
    Object.keys(directivesList).forEach(key => {
      if (CORE_DIRECTIVES.has(key)) {
        return;
      }
      app.directive(key, directivesList[key]);
    });
  }
};

export default directives;
