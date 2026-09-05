// uno.config.ts
import { defineConfig, presetMini, presetWind3, transformerDirectives, transformerVariantGroup } from 'unocss';
import { presetExtra } from 'unocss-preset-extra';
import { unoColors, unoRules } from './uno.shared';

// ⚠️ 背景色系统设计约束（来自 uno.shared.ts）：
// 键名就是类名的后半段，没有 `bg` 这一层：所以 `bg-1` 是对的，`bg-bg-1` 查的是一个
// 叫「bg-1」的颜色，查不到，产出 0 条 CSS（元素完全透明）。同理 `bg-0` 也是死的
// —— 下面没有 `0` 键，要主背景写 `bg-base`。
// 数字键还会劫持带方向的边框类：`border-b-2` 不是「下边框 2px」，而是
// `border-bottom-color: var(--bg-2)`（方向解析先发生，再拿 `2` 查到这里）。
// 宽度要写 `border-b-2px`。详见 ui/src/renderer/styles/MIGRATION.md 第 6 条。

// ==================== 边框颜色 / Border Colors ====================
// ⚠️ 这里曾有一个 borderColors = { 'b-base', 'b-light', 'b-1'... } 配置块，已删除：
//    它永远不可达。UnoCSS 解析 `border-b-*` 时先吃掉 `-b-`（bottom 方向），再去
//    theme.colors 里查剩下的键，所以 `border-b-base` 命中的是 backgroundColors.base，
//    输出 `border-bottom-color: var(--bg-base)`，而不是 `var(--border-base)`。
//    删除前后整站产出 CSS 逐字节相同（见 ui/src/renderer/styles/MIGRATION.md 的
//    「-b- 方向陷阱」一节）。
// ⚠️ A borderColors block used to live here and was deleted: it was unreachable.
//    UnoCSS consumes `-b-` as the bottom direction before looking the remainder up
//    in theme.colors, so `border-b-base` resolves against backgroundColors.base.
//    要给元素上「基础边框色」，用 `border-[var(--border-base)]`。
//    For a base border color use `border-[var(--border-base)]`.

// ==================== 品牌色 / Brand Colors ====================
// 定义已迁移至 ./uno.shared（unoBrandColors / unoAouColors / unoComponentColors），
// 供 createVite 内联配置在 apps/* 构建中复用。此处不再重复定义。

export default defineConfig({
  presets: [presetMini(), presetExtra(), presetWind3()],
  transformers: [transformerVariantGroup(), transformerDirectives({ enforce: 'pre' })],
  content: {
    pipeline: {
      // Use RegExp instead of glob strings so patterns match against absolute
      // module IDs regardless of the Vite root directory.  electron-vite sets
      // the renderer root to packages/desktop/src/renderer/, which causes glob patterns like
      // 'packages/desktop/src/**/*.tsx' to resolve to the wrong nested path.
      include: [/\.[jt]sx?($|\?)/, /\.vue($|\?)/, /\.css($|\?)/],
      exclude: [/[\\/]node_modules[\\/]/, /\.html($|\?)/],
    },
  },
  // 自定义规则 / Custom rules（共享定义见 ./uno.shared）
  rules: unoRules,
  // Preflights - Global base styles 全局基础样式
  // ⚠️ 这里**只有** `color: inherit`，而且是故意的：没有引入
  //    `@unocss/reset/tailwind.css`，也没有 `* { border-width: 0; border-style: solid }`。
  //    后果是 border-style 保持 CSS 初始值 none —— `border-b border-arco-2` 这种「有宽度
  //    有颜色、没样式」的写法一个像素都不画，必须显式补 `border-b-solid`（同方向！
  //    无方向的 `border-solid` 会让没有宽度类的另外三边回落到 medium≈3px）。
  //    加全局 reset 的方案评估过并否决：那条 `*` 规则会抹掉原生表单控件的默认边框，
  //    影响面覆盖 1000+ 文件且无法逐一回归。理由与替代方案见
  //    ui/src/renderer/styles/MIGRATION.md 的「为什么不加全局 border reset」。
  // ⚠️ Intentionally the only preflight: no Tailwind reset, so `border-style` stays at
  //    its initial `none`. Width + colour without a style class paints nothing.
  preflights: [
    {
      getCSS: () => `
        * {
          /* Set default text color to follow theme 所有元素默认使用主题文字颜色 */
          color: inherit;
        }
      `,
    },
  ],
  // 基础配置
  shortcuts: {
    'flex-center': 'flex items-center justify-center',
  },
  theme: {
    colors: unoColors,
  },
});
