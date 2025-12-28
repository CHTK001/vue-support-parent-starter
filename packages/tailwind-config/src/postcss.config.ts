import config from ".";
import fixColorAdjust from "./postcss-fix-color-adjust";

export default {
  plugins: [
    process.env.NODE_ENV === "production" ? ["cssnano", {}] : false,
    ["tailwindcss/nesting", "postcss-nesting"],
    ["tailwindcss", { config }],
    "autoprefixer",
    ["postcss-antd-fixes", { prefixes: ["ant", "el"] }],
    "postcss-import",
    "postcss-preset-env",
    fixColorAdjust,
  ].filter(Boolean),
};
