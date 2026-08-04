/**
 * 应用入口 —— 全部装配逻辑由 @repo/app 的 createContextApp 内部自我处理
 *
 *   createContextApp 内部：
 *     core createApp（config 由 @repo/config 统一管理：环境变量 → app.yaml → 远程）
 *     → 创建 Vue 实例（AppWithRouter）
 *     → 注册 pinia / i18n / router
 *     → 主题安装器按 getConfig().other.themeId 自动解析（默认 koi）
 *     → mount("#app")
 *
 *   .routes(路由树)：路由树即菜单树，自动挂到 layout 之下，并驱动侧边栏。
 *
 *   本应用：
 *     - 开启鉴权（app.yaml openAuth=true）：未登录跳转 /login
 *     - 路由模式 = remote：菜单完全由后端 /v2/user/menu 决定
 *     - 把 @repo/message 与 @repo/system 的页面作为本地 fallback 路由
 *       挂到 koi layout 之下，对应后端菜单的 component 字段
 *       （后端菜单若已配置 component="system/user/index"，可由 koi 视图
 *        glob 解析；未配置时通过本兜底 addRoute 仍可访问）
 */
import { createContextApp } from "@repo/app";
import { systemRoutes } from "@repo/system";
import { messageRoutes } from "@repo/message";

const { context } = await createContextApp()
  .routes([...messageRoutes, ...systemRoutes])
  .mount("#app");
