import config from ".";
import fixColorAdjust from "./postcss-fix-color-adjust";

import nesting from "@tailwindcss/nesting";
import autoprefixer from "autoprefixer";
import cssnano from "cssnano";
import postcssAntdFixes from "postcss-antd-fixes";
import postcssImport from "postcss-import";
import postcssPresetEnv from "postcss-preset-env";
import tailwindcss from "tailwindcss";

export default {
  plugins: [
    ...(process.env.NODE_ENV === "production" ? [cssnano({})] : []),
    nesting,
    tailwindcss({ config }),
    autoprefixer(),
    postcssAntdFixes({ prefixes: ["ant", "el"] }),
    postcssImport(),
    postcssPresetEnv(),
    fixColorAdjust,
  ],
};
