// uno.shared.ts
// 与 pages/ai/uno.config.ts 共享的自定义 UnoCSS 颜色与规则。
// 独立成文件的原因：createVite（turbo/vite/createVite.ts）内联 UnoCSS 配置时
// 不加载 uno.config.ts（cwd 歧义），apps/* 构建会丢失这些自定义规则与颜色，
// 导致 `bg-primary-1`、`text-t-primary`、`bg-fill-2` 等工具类完全不生成。
// 业务 app 通过 createVite 的 unoTheme + unoRules 合并本文件内容。

// ==================== 语义化文字颜色 / Semantic Text Colors ====================
export const unoTextColors = {
  't-primary': 'var(--text-primary)',
  't-secondary': 'var(--text-secondary)',
  't-tertiary': 'var(--bg-6)',
  't-quaternary': 'var(--text-secondary)',
  't-disabled': 'var(--text-disabled)',
};

// ==================== 语义状态色 / Semantic State Colors ====================
export const unoSemanticColors = {
  primary: 'var(--primary)',
  success: 'var(--success)',
  warning: 'var(--warning)',
  danger: 'var(--danger)',
  info: 'var(--info)',
};

// ==================== 背景色系统 / Background Color System ====================
export const unoBackgroundColors = {
  base: 'var(--bg-base)',
  1: 'var(--bg-1)',
  2: 'var(--bg-2)',
  3: 'var(--bg-3)',
  4: 'var(--bg-4)',
  5: 'var(--bg-5)',
  6: 'var(--bg-6)',
  8: 'var(--bg-8)',
  9: 'var(--bg-9)',
  10: 'var(--bg-10)',
  hover: 'var(--bg-hover)',
  active: 'var(--bg-active)',
};

// ==================== 品牌色 / Brand Colors ====================
export const unoBrandColors = {
  brand: 'var(--brand)',
  'brand-light': 'var(--brand-light)',
  'brand-hover': 'var(--brand-hover)',
};

// ==================== AOU 品牌色系 / AOU Brand Colors ====================
export const unoAouColors = {
  aou: {
    1: 'var(--aou-1)',
    2: 'var(--aou-2)',
    3: 'var(--aou-3)',
    4: 'var(--aou-4)',
    5: 'var(--aou-5)',
    6: 'var(--aou-6)',
    7: 'var(--aou-7)',
    8: 'var(--aou-8)',
    9: 'var(--aou-9)',
    10: 'var(--aou-10)',
  },
};

// ==================== UI 组件专用颜色 / UI Component Specific Colors ====================
export const unoComponentColors = {
  'message-tips': 'var(--message-tips-bg)',
};

// 合并后的完整颜色映射（与 pages/ai uno.config.ts theme.colors 一致）
export const unoColors = {
  ...unoTextColors,
  ...unoSemanticColors,
  ...unoBackgroundColors,
  ...unoBrandColors,
  ...unoAouColors,
  ...unoComponentColors,
};

// ==================== 自定义规则 / Custom Rules ====================
export const unoRules = [
  // Arco Design 官方文字颜色 text-1 到 text-4
  [/^text-([1-4])$/, ([, d]: RegExpExecArray) => ({ color: `var(--color-text-${d})` })],

  // Arco Design 官方填充色 fill-1 到 fill-4
  [/^bg-fill-([1-4])$/, ([, d]: RegExpExecArray) => ({ 'background-color': `var(--color-fill-${d})` })],

  // Arco Design 官方边框色 border-1 到 border-4
  [/^border-arco-([1-4])$/, ([, d]: RegExpExecArray) => ({ 'border-color': `var(--color-border-${d})` })],

  // Arco Design 官方浅色系 primary/success/warning/danger/link-light-1 到 -light-4
  [
    /^bg-(primary|success|warning|danger|link)-light-([1-4])$/,
    ([, color, d]: RegExpExecArray) => ({ 'background-color': `var(--color-${color}-light-${d})` }),
  ],

  // Arco Design 官方色阶 primary/success/warning/danger 1-9
  [
    /^(bg|text|border)-(primary|success|warning|danger)-([1-9])$/,
    ([, prefix, color, d]: RegExpExecArray) => {
      const prop = prefix === 'bg' ? 'background-color' : prefix === 'text' ? 'color' : 'border-color';
      return { [prop]: `rgb(var(--${color}-${d}))` };
    },
  ],

  // 项目自定义颜色 / Project custom colors
  ['bg-dialog-fill-0', { 'background-color': 'var(--dialog-fill-0)' }],
  ['text-0', { color: 'var(--text-0)' }],
  ['text-white', { color: 'var(--text-white)' }],
  ['bg-fill-0', { 'background-color': 'var(--fill-0)' }],
];
