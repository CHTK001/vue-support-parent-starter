/**
 * 业务路由 —— /home 组件列表 + /debug/:name 调试
 *
 * 单页面应用，不挂 layout，使用本地 router + App.vue 渲染。
 */
import { createRouter, createWebHashHistory, type RouteRecordRaw } from "vue-router";

const routes: RouteRecordRaw[] = [
  {
    path: "/",
    redirect: "/home",
  },
  {
    path: "/home",
    name: "home",
    component: () => import("./views/Home.vue"),
    meta: { title: "组件模板" },
  },
  {
    path: "/debug/:name",
    name: "debug",
    component: () => import("./views/Debug.vue"),
    meta: { title: "调试组件" },
    props: true,
  },
  {
    /*
     * 按钮组 / square 图标选择器的对照组页。
     *
     * <p>供 `scripts/re-controls-acceptance.mjs` 做「每个可点按钮与图标」普查：
     * 这一页把所有形态都摆出来，状态确定、无后端依赖，离线即可跑。
     * 不放进 `/debug/:name` 是因为调试页靠参数面板驱动、每次进页面状态不同，
     * 而验收需要可重复的初始状态。</p>
     */
    path: "/lab/re-controls",
    name: "lab-re-controls",
    component: () => import("./views/ReControlsLab.vue"),
    meta: { title: "Re 按钮组对照组" },
  },
  {
    /*
     * ReTree「弹窗编辑路径」对照组页。
     *
     * <p>供 `scripts/re-controls-acceptance.mjs` 第 7 节（弹窗编排）使用：
     * ReTree 的增删改都要开模态弹窗，模态一开就盖住整页，
     * 因此**不能**并进 `/lab/re-controls` 的「逐个点」遍历（会被遮罩吞成假死按钮）。</p>
     */
    path: "/lab/re-tree",
    name: "lab-re-tree",
    component: () => import("./views/ReTreeLab.vue"),
    meta: { title: "ReTree 弹窗对照组" },
  },
  {
    /*
     * ReGraphG6 · 关系图（G6 v5.1.1 原生）验收页。
     *
     * <p>以 G6 官方 bubble-sets 示例为地基，逐步添加功能。
     * 独立路由而非模板体系：G6 直接实例化，不经过 @repo/ui 包装层，
     * 便于对照官方示例逐版验收。</p>
     */
    path: "/lab/re-graph-g6",
    name: "lab-re-graph-g6",
    component: () => import("./views/ReGraphG6Lab.vue"),
    meta: { title: "ReGraphG6 · 关系图（G6 原生）" },
  },
  {
    path: "/:pathMatch(.*)*",
    redirect: "/home",
  },
];

export default createRouter({
  history: createWebHashHistory(),
  routes,
});