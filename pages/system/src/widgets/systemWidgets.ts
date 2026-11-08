/**
 * @pages/system —— 系统管理模块向 home 仪表板贡献的 widget
 *
 * <p>模块自带「系统组件」的接线处。宿主 app 在 {@code main.ts} 里登记
 * （与 {@code systemRoutes} 等一样从包根 {@code @pages/system} 导入）：</p>
 *
 * <pre>{@code
 * import { createContextApp } from "@repo/app";
 * import { defineWidgetContribution } from "@repo/theme/koi/views/home/registry";
 * import { userLog, systemWidgets } from "@pages/system";
 *
 * createContextApp({ appName: "xxx" })
 *   .routes(systemRoutes)
 *   .widgets([defineWidgetContribution(systemWidgets)])
 *   .mount("#app");
 * }</pre>
 *
 * <p>页面即组件，widget 层不新包装壳：登录日志用 {@code UserLogManage.vue}，
 * 个人设置用 {@code PersonalSettings.vue}（两者都是独立的页面组件，协议口径一致）。</p>
 *
 * <p>已有约定：</p>
 * <ul>
 *   <li>{@code type} 必须<b>全局唯一</b>，建议加模块前缀（如 {@code system-userlog}），
 *       否则会与内置或其他模块的 type 撞名；开发环境重复注册会打印覆盖警告。</li>
 *   <li>{@code source} 必填 —— 它随布局持久化，未启用本模块的 app 靠它显示
 *       「该组件由 system 模块提供」并保留卡片与网格位置。</li>
 *   <li>{@code requiredPermission} 走 app.yaml 的 {@code permissionConfig}，
 *       不要硬编码角色字面量。</li>
 *   <li>组件默认懒加载（{@code component: () => import(...)}），与内置 widget 一致。</li>
 * </ul>
 */
import { Document, User } from "@element-plus/icons-vue";
import type { WidgetRegistration } from "@repo/theme/koi/views/home/registry.ts";

/** 系统管理模块贡献的全部 widget */
export const systemWidgets: WidgetRegistration[] = [
  {
    type: "system-userlog",
    title: "登录日志",
    description: "所有用户的登录审计：账号 / 终端 / IP / 状态与耗时，只读不修改",
    icon: "Document",
    // 直接给组件：WidgetLibrary 的内置 ICON_MAP 只认 9 个内置图标名，
    // 模块贡献的图标名不在其中，只传 icon 字符串会静默退化成默认图标
    iconComponent: Document,
    defaultSize: { w: 8, h: 6 },
    category: "admin",
    environment: "prod",
    requiredPermission: "admin",
    maxCount: 1,
    source: "system",
    component: () => import("../views/UserLogManage.vue"),
  },
  {
    type: "system-personal-settings",
    title: "个人设置",
    description: "界面偏好、通知偏好、安全设置与二次验证（2FA）",
    icon: "User",
    // 直接给组件：WidgetLibrary 的内置 ICON_MAP 只认 9 个内置图标名，
    // 模块贡献的图标名不在其中，只传 icon 字符串会静默退化成默认图标
    iconComponent: User,
    defaultSize: { w: 8, h: 6 },
    category: "personal",
    environment: "prod",
    requiredPermission: "user",
    maxCount: 1,
    source: "system",
    component: () => import("../views/PersonalSettings.vue"),
  },
];
