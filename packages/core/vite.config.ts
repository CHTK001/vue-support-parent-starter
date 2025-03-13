import { type UserConfigExport, type ConfigEnv, loadEnv } from "vite";

export default ({ mode }: ConfigEnv): UserConfigExport => {
  return {
    // 服务端渲染
    css: {
      preprocessorOptions: {
        scss: {
          additionalData: `
            @use "@repo/assets/style/layout/default/variables.scss" as *;
            @use "@repo/assets/style/layout/default/mixin.scss";
          `,
        },
      },
    },
    build: {
      // https://cn.vitejs.dev/guide/build.html#browser-compatibility
      target: "esnext",
      sourcemap: false,
      // 消除打包大小超过500kb警告
      chunkSizeWarningLimit: 4000,
      terserOptions: {
        compress: {
          drop_console: true,
        },
      },
    },
  };
};
