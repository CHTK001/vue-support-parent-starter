/**
 * vue-i18n 全局类型增强（必须由各应用显式引用才生效）
 *
 * 背景：vue-i18n 的 `$t` / `$i18n` 来自它 dist/vue-i18n.d.ts 里的
 * `declare module 'vue'` 模块增强。各应用的 tsconfig 都设了
 * `"types": ["vite/client"]`（types 白名单，只自动加载列出的全局类型包），
 * 且不少 .vue 只在模板里用 `$t`、没有 import { useI18n }，于是 vue-i18n
 * 的类型从未进入程序，模板里报 TS2339「Property '$t' does not exist」。
 *
 * 细微之处：仅仅「被某文件 import」不够——比如 theme 的组件经
 * `@repo/theme/koi/*` 解析时由 vite 插件编译、并不 import @repo/languages，
 * 增强就可能缺席。所以下面的空 import 写在增强声明 之前，并把它作为
 * 「应用级类型入口」使用：
 *
 *   /// <reference path="../../../packages/languages/src/vue-i18n.d.ts" />
 *
 * 在应用自己的 env.d.ts 里放这一行即可（见 apps/vue-support-system-starter/src/env.d.ts）。
 */
import "vue-i18n";

export {};
