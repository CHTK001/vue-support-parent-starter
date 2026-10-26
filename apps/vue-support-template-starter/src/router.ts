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
     * ReTable / ReSelect / ReSwitch / ReRadio 状态图标与视觉打磨对照页。
     *
     * <p>把本次新增的两态图标能力（ReStateIcon 预设 + active/inactive props）与
     * 四个组件的美化结果集中摆出来，人工验收时可逐项点击观察切换动画。</p>
     */
    path: "/lab/re-icon-state",
    name: "lab-re-icon-state",
    component: () => import("./views/ReIconStateLab.vue"),
    meta: { title: "Re 状态图标对照" },
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
     * ReRelationGraph · 关系图（G6 v5.1.1 原生）集成示例页。
     *
     * <p>以三国演义数据演示新组件的全部能力：19 种布局（含自研鱼骨）、
     * 气泡集 / Hull 双分组轮廓、分组折叠、最短路径、撤销重做、右键菜单、
     * 场景预设与边交叉统计。独立路由而非模板体系，便于逐项对照验收。</p>
     */
    path: "/lab/re-relation-graph",
    name: "lab-re-relation-graph",
    component: () => import("./views/ReRelationGraphLab.vue"),
    meta: { title: "ReRelationGraph · 关系图（G6 原生）" },
  },
  {
    /*
     * ReDialog 拖拽对照组。
     *
     * <p>回归「弹窗能不能拖」：Element 的 useDraggable 在 overflow=false 时会把位移
     * 钳制成「整个弹窗留在视口内」，近满高弹窗的竖向余量趋近 0，表现为完全拖不动。
     * 本页把普通 / modern / 近满高 / headless 四种规格摆在一起，逐个拖一遍即可验收。</p>
     */
    path: "/lab/re-dialog-drag",
    name: "lab-re-dialog-drag",
    component: () => import("./views/ReDialogDragLab.vue"),
    meta: { title: "ReDialog 拖拽对照组" },
  },
  {
    /*
     * http.useQuery / useMutation 运行时验证台。
     *
     * <p>验证 `http.get(url).useQuery(key)` 确实走通了 Http + unwrapResult + vue-query 全链路：
     * 缓存命中、同 key 去重、staleTime 抑制重取、mutation 后 invalidate 重取。
     * 用内存 adapter 顶替后端，因此无需启动任何服务即可验收。</p>
     */
    path: "/lab/query",
    name: "lab-query",
    component: () => import("./views/QueryLab.vue"),
    meta: { title: "http.useQuery 验证台" },
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