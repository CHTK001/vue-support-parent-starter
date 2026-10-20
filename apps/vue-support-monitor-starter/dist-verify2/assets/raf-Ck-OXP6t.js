import { a as isClient } from "./dist-DI3cGDuP.js";
//#region ../../node_modules/.pnpm/element-plus@2.14.3_vue@3.5.40_typescript@5.9.3_/node_modules/element-plus/es/utils/raf.mjs
var rAF = (fn) => isClient ? window.requestAnimationFrame(fn) : setTimeout(fn, 16);
var cAF = (handle) => isClient ? window.cancelAnimationFrame(handle) : clearTimeout(handle);
//#endregion
export { rAF as n, cAF as t };
