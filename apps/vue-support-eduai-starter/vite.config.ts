import { createVite } from "../../turbo/vite/createVite.ts";

/**
 * 教育 AI 应用 Vite 配置。
 *
 * 后端代理指向 spring-support-eduai-starter（默认 19095）。
 * 同机可能同时跑多套后端，验证时用 VUE_EDUAI_API_TARGET 改指向，不必改这里。
 */
const apiTarget = process.env.VUE_EDUAI_API_TARGET ?? "http://localhost:19095";

/**
 * three 单例化。
 *
 * 3D 展台（pages/eduai/src/components/insect/InsectStage3D.vue）同时 import 了
 * `three` 与 `three/examples/jsm/controls/OrbitControls.js`。
 *
 * 重复实例不是警告而是静默故障：各副本之间 instanceof 互不相认，builders 里
 * `mesh.isMesh` 之类判断会全部落空，模型被当成空 Group，页面只剩一块空画布。
 *
 * 两道保险：
 *   1. pages/eduai 的 three 版本与 packages/ui、pages/monitor 对齐（^0.185.1），
 *      避免同一应用里出现两个 three 版本 —— 这是重复实例的真正来源；
 *   2. 这里再补 resolve.dedupe，挡住 examples/jsm 被预构建成独立 chunk 的情况。
 *
 * createVite 的 config 透传刻意排除了 resolve，所以 dedupe 用 config 钩子注入，
 * 不改动 turbo/vite 共享基线。three 保持预构建（不要 exclude）——
 * 排除后 three.module.js 与 three.core.js 会各成一份，反而制造重复实例。
 */
function threeDedupe() {
  return {
    name: "insect-three-dedupe",
    enforce: "pre" as const,
    config() {
      return {
        resolve: {
          dedupe: ["three"],
        },
      };
    },
  };
}

export default createVite({
  appName: "vue-support-eduai-starter",
  title: "教育 AI 工作台",
  plugins: [threeDedupe()],
  server: {
    port: 19093,
    strictPort: false,
    proxy: {
      "/v2/edu": {
        target: apiTarget,
        changeOrigin: true,
      },
      "/v2/user": {
        target: apiTarget,
        changeOrigin: true,
      },
      "/edu-api": {
        target: apiTarget,
        changeOrigin: true,
      },
    },
  },
});
