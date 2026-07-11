/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./index.html', './src/**/*.{vue,ts,js}'],
  theme: {
    extend: {
      colors: {
        'el-primary': 'rgb(var(--el-color-primary))',
        'el-bg': 'var(--el-bg-color)',
        'el-surface': 'var(--el-bg-color-overlay)',
        'el-text': 'var(--el-text-color-primary)',
        'el-text-secondary': 'var(--el-text-color-secondary)',
        'el-border': 'var(--el-border-color-light)',
        'el-fill': 'var(--el-fill-color-light)',
      },
      borderRadius: {
        'el': 'var(--el-border-radius-base)',
      }
    },
  },
  plugins: [],
}
