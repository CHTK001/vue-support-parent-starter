/**
 * vue-i18n 全局类型增强
 *
 * vue-i18n 的 `$t` / `$i18n` 由它自己的 dist/vue-i18n.d.ts 里的
 * `declare module 'vue'` 注入 ComponentCustomProperties。但那是一处模块增强，
 * 只有该 d.ts 进入程序图谱时才生效。各应用的 tsconfig 都设了
 * `"types": ["vite/client"]`（types 白名单，只自动加载列出的全局类型包），
 * 且多数 .vue 只用了模板里的 `$t`、没有 import { useI18n }，于是 vue-i18n
 * 的类型从未被加载，模板里报 TS2339「Property '$t' does not exist」。
 *
 * 这里显式 import 一次，把增强拉进任意引用到本包（@repo/languages）的程序，
 * 与是否写 useI18n 无关。
 */
import "vue-i18n";

export {};
