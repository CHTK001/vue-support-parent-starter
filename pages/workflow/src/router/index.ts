import type { RouteConfigsTable } from "@repo/core";

const routes: RouteConfigsTable[] = [
  {
    path: "/workflow",
    name: "Workflow",
    redirect: "/workflow/def",
    meta: { icon: "ri:git-branch-line", title: "流程管理", rank: 15, showLink: true },
    children: [
      {
        path: "/workflow/def",
        name: "WorkflowDef",
        component: () => import("../views/designer/index.vue"),
        meta: { title: "流程编排", showLink: true },
      },
      {
        path: "/workflow/myApply",
        name: "WorkflowMyApply",
        component: () => import("../views/instance/MyApply.vue"),
        meta: { title: "我的申请", showLink: true },
      },
      {
        path: "/workflow/myTodo",
        name: "WorkflowMyTodo",
        component: () => import("../views/instance/MyTodo.vue"),
        meta: { title: "我的待办", showLink: true },
      },
      {
        path: "/workflow/detail/:instId",
        name: "WorkflowDetail",
        component: () => import("../views/instance/InstanceDetail.vue"),
        meta: { title: "流程详情", showLink: false },
      },
    ],
  },
];

export default routes;