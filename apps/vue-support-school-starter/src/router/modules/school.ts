import { RouteRecordRaw } from "vue-router";

// 学校管理路由
const SchoolRouter: RouteRecordRaw = {
  path: "/school",
  redirect: "/school/list",
  name: "SchoolManage",
  meta: {
    title: "学校管理",
    icon: "ri:school-line",
    order: 2
  },
  children: [
    {
      path: "list",
      name: "SchoolList",
      component: () => import("@/views/school/school-list/index.vue"),
      meta: {
        title: "学校列表",
        icon: "ri:list-check"
      }
    },
    {
      path: "detail/:id",
      name: "SchoolDetail",
      component: () => import("@/views/school/school-detail/index.vue"),
      meta: {
        title: "学校详情",
        icon: "ri:file-list-line",
        hidden: true
      }
    },
    {
      path: "sync",
      name: "SchoolSync",
      component: () => import("@/views/school/school-sync/index.vue"),
      meta: {
        title: "学校同步配置",
        icon: "ri:refresh-line"
      }
    }
  ]
};

export default SchoolRouter; 