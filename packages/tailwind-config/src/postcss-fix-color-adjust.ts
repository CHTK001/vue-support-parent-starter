/**
 * PostCSS plugin to fix color-adjust deprecation warning
 * Replaces `color-adjust` with `print-color-adjust`
 */
const plugin = () => {
  return {
    postcssPlugin: 'postcss-fix-color-adjust',
    Declaration(decl: any) {
      if (decl.prop === 'color-adjust') {
        decl.prop = 'print-color-adjust';
      }
    }
  };
};

plugin.postcss = true;

export default plugin;
