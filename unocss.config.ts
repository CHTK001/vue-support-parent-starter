/**
 * UnoCSS 配置 —— 解析登录页 / 业务页面里的原子类
 *
 * - presetWind3:     工具类（flex / m-b-32px / bg-#F4F4F5 / shadow-[...]）
 * - presetAttributify: class="flex items-center" 也支持 attribute 写法
 * - presetIcons:     <el-icon><User/></el-icon> / <i class="i-ep-user"/>
 * - presetTypography: 排版增强
 * - transformerVariantGroup / Directives: <div class="hover:(bg-red text-white)">、
 *   @apply / @screen / theme() 等指令
 *
 * dark 模式：默认按 class="dark"，与本项目 theme-vars.scss 里
 * html.dark 保持一致；登录页里的 dark:bg-#141414 自动生效。
 *
 * 主题色：UnoCSS 不内置 el- 变量别名，所以登录页用到的
 * text-[--el-text-color-primary] / bg-[--el-fill-color-light]
 * 直接走 CSS 变量任意值语法，无需在此处声明。
 */
import {
  defineConfig,
  presetWind3,
  presetAttributify,
  presetIcons,
  presetTypography,
  transformerDirectives,
  transformerVariantGroup
} from "unocss";

export default defineConfig({
  presets: [
    presetWind3(),
    presetAttributify(),
    presetIcons({
      scale: 1.2,
      warn: true
    }),
    presetTypography()
  ],
  transformers: [
    transformerVariantGroup(),
    transformerDirectives()
  ],
  // 让 UnoCSS 扫描 monorepo 内所有 vue 文件（含 packages/theme/src/themes/koi/**）
  content: {
    filesystem: [
      "apps/**/*.{vue,ts,tsx,js,jsx,html}",
      "packages/**/*.{vue,ts,tsx,js,jsx,html}",
      "pages/**/*.{vue,ts,tsx,js,jsx,html}"
    ]
  },
  // dark 模式挂在 html 上（与 theme-vars.scss 保持一致）
  dark: "class"
});