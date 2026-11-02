/**
 * 消息推送模块路由配置（@pages/message）
 *
 * 嵌套结构：/message 父节点 + 叶子子路由。
 *
 * 2026-11 合并说明：**「消息模板」路由已下线**。
 * 短信 / 邮件模板的编辑入口统一收敛到系统管理的 {@code /manage/message}
 * （pages/system/MessageManage.vue 的「消息模板」页签）——它打的是同一组
 * {@code /v2/message/template/*} 接口，但表单字段更全（渠道、外部运营商模板码、
 * 参数说明、富文本、预览、按模板发送），且带页面测试。
 * 原先本模块的 TemplateManage.vue 与它完全重复，又没有任何应用挂载，
 * 属未接线的死代码，故不再注册路由与菜单。
 * 只读查看统一模板库请走 {@code /template}（pages/template）。
 */
import type { RouteConfigsTable } from "@repo/core";

export const messageRoutes: RouteConfigsTable[] = [
  {
    path: "/message",
    name: "Message",
    redirect: "/message/provider",
    meta: {
      title: "消息推送",
      icon: "Message",
      showLink: true,
    },
    children: [
      {
        path: "/message/provider",
        name: "MessageProvider",
        component: () => import("../views/ProviderManage.vue"),
        meta: {
          title: "消息提供商",
          icon: "OfficeBuilding",
          showLink: true,
          keepAlive: true,
        },
      },
      {
        path: "/message/log",
        name: "MessageLog",
        component: () => import("../views/SendLog.vue"),
        meta: {
          title: "发送日志",
          icon: "Document",
          showLink: true,
          keepAlive: true,
        },
      },
    ],
  },
];
