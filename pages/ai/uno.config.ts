import { defineConfig, presetWind3, presetAttributify, presetIcons, presetTypography, transformerDirectives, transformerVariantGroup } from 'unocss';

export default defineConfig({
  presets: [
    presetWind3(),
    presetAttributify(),
    presetIcons(),
    presetTypography(),
  ],
  transformers: [
    transformerVariantGroup(),
    transformerDirectives(),
  ],
  content: {
    filesystem: [
      'src/**/*.{vue,ts,tsx,js,jsx,html}',
    ],
  },
  theme: {
    extend: {
      fontFamily: {
        mono: 'ui-monospace, SFMono-Regular, Menlo, Consolas, monospace',
      },
      borderRadius: {
        lg: 'var(--radius-lg, 12px)',
        xl: 'var(--radius-xl, 16px)',
      },
    },
  },
  dark: 'class',
});
