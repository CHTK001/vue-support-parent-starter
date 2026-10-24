/**
 * 应用级类型入口：必须被 tsconfig 的 include 覆盖（这里已由 src\/**\/*.d.ts 覆盖）。
 *
 * vue-i18n 的 `$t` 通过 `declare module 'vue'` 做全局增强，前提是它的
 * dist/vue-i18n.d.ts 真的进入类型程序。本应用 tsconfig 设了
 * `"types": ["vite/client"]`（白名单），不会自动加载；模板里只用 `$t`
 * 的组件也不 import vue-i18n。下面这一行把增强显式带进来。
 */
/// <reference path="../../../packages/languages/src/vue-i18n.d.ts" />

export {};
