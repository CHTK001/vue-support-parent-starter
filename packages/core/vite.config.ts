import { type UserConfigExport, type ConfigEnv } from "vite";
import { createAlias } from "@repo/build-config";

export default ({ mode }: ConfigEnv): UserConfigExport => {
  return {
    resolve: {
      alias: createAlias(import.meta.url),
    },
    // 服务端渲染
    css: {
      preprocessorOptions: {
        scss: {
          additionalData: `
<<<<<<< HEAD
            @use "@repo/assets/styles/layout/default/variables.scss" as *;
            @use "@repo/assets/styles/layout/default/mixin.scss";
=======
            @use "@layout/default/styles/layout/variables.scss" as *;
            @use "@layout/default/styles/layout/mixin.scss";
>>>>>>> 0b6528f1dfbf32db414a1a5d12846317583de126
          `,
        },
      },
    },
    // 生产环境删除 console 和 debugger
    esbuild: {
      drop: mode === "production" ? ["console", "debugger"] : [],
    },
    build: {
      // https://cn.vitejs.dev/guide/build.html#browser-compatibility
      target: "esnext",
      sourcemap: false,
      // 消除打包大小超过500kb警告
      chunkSizeWarningLimit: 4000,
    },
  };
};
