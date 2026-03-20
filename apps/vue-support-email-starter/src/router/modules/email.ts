/**
 * 邮箱管理路由配置
 * @author CH
 * @version 1.0.0
 * @since 2026-03-18
 */
import type { RouteConfigsTable } from "@repo/core";
const Layout = () => import("@layout/default");

export default [
  {
    path: "/",
    name: "Email",
    component: Layout,
    redirect: "/inbox",
    meta: {
      icon: "ri:mail-line",
      title: "邮箱管理",
      rank: 0,
    },
    children: [
      {
        path: "/inbox",
        name: "Inbox",
        component: () => import("@/views/inbox/index.vue"),
        meta: {
          icon: "ri:inbox-line",
          title: "收件箱",
          showParent: true,
        },
      },
      {
        path: "/compose",
        name: "Compose",
        component: () => import("@/views/compose/index.vue"),
        meta: {
          icon: "ri:edit-line",
          title: "写邮件",
          showParent: true,
        },
      },
      {
        path: "/sent",
        name: "Sent",
        component: () => import("@/views/sent/index.vue"),
        meta: {
          icon: "ri:send-plane-line",
          title: "已发送",
          showParent: true,
        },
      },
      {
        path: "/drafts",
        name: "Drafts",
        component: () => import("@/views/drafts/index.vue"),
        meta: {
          icon: "ri:draft-line",
          title: "草稿箱",
          showParent: true,
        },
      },
      {
        path: "/accounts",
        name: "Accounts",
        component: () => import("@/views/accounts/index.vue"),
        meta: {
          icon: "ri:user-settings-line",
          title: "账户管理",
          showParent: true,
        },
      },
      {
        path: "/templates",
        name: "Templates",
        component: () => import("@/views/templates/index.vue"),
        meta: {
          icon: "ri:file-list-line",
          title: "邮件模板",
          showParent: true,
        },
      },
      {
        path: "/settings",
        name: "Settings",
        component: () => import("@/views/settings/index.vue"),
        meta: {
          icon: "ri:settings-3-line",
          title: "系统设置",
          showParent: true,
        },
      },
    ],
  },
] satisfies Array<RouteConfigsTable>;
