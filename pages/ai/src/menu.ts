/**
 * @pages/ai —— 宿主嵌入用的「菜单 → 视图」注册
 *
 * 与包根 index.ts 的区别：这里**不**引入 ./main.js（那是 ai-guada 启动壳的整应用入口，
 * 会同步加载 App.vue 壳与 element-plus/tailwind/refactor 等全局样式）。宿主（如系统平台）
 * 只想把「AI 提供商管理」作为**内部普通页面菜单**嵌入，因此单独走本模块，避免把 AI 控制台
 * 的整壳与全局 CSS 拖进宿主包。
 *
 * 后端 sys_menu 配 component = `ai/models/index`（type=0 普通页面、无 frame_src）即命中
 * 下面的 views/ai/models/index.vue；不再用外链弹独立 ai-guada 应用。
 */
import { registerMenuViewModules } from "@repo/core";

// 后端菜单 component → 本地页面（懒加载，仅访问时 import，不预载）
registerMenuViewModules({
  "views/ai/models/index.vue": () => import("./components/models/ModelsPage.vue"),
});
