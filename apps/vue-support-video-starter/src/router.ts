/**
 * 业务路由 —— 视频资源中心
 *
 * / 主页（热播推荐）  /channel/:type 频道页（电影/电视剧/动漫/综艺）
 * /watch/:id 站内详情播放  /play 直链播放（输入 URL 即时播放）
 * /browse 搜索结果页
 *
 * 单页面应用，不挂 layout，App.vue 提供站点导航。
 */
import { createRouter, createWebHashHistory, type RouteRecordRaw } from "vue-router";

const routes: RouteRecordRaw[] = [
  {
    path: "/",
    name: "home",
    component: () => import("./views/HomeView.vue"),
    meta: { title: "主页" },
  },
  {
    path: "/channel/:type",
    name: "channel",
    component: () => import("./views/ChannelView.vue"),
    meta: { title: "频道" },
    props: true,
  },
  {
    path: "/watch/:id",
    name: "watch",
    component: () => import("./views/WatchView.vue"),
    meta: { title: "播放" },
    props: true,
  },
  {
    path: "/play",
    name: "play",
    component: () => import("./views/PlayUrlView.vue"),
    meta: { title: "直链播放" },
  },
  {
    path: "/browse",
    name: "browse",
    component: () => import("./views/BrowseView.vue"),
    meta: { title: "搜索" },
  },
  {
    path: "/live",
    name: "live",
    component: () => import("./views/LiveView.vue"),
    meta: { title: "电视直播" },
  },
  {
    path: "/live/cctv",
    name: "live-cctv",
    component: () => import("./views/LiveView.vue"),
    props: { cctvOnly: true },
    meta: { title: "CCTV直播" },
  },
  {
    path: "/:pathMatch(.*)*",
    redirect: "/",
  },
];

export default createRouter({
  history: createWebHashHistory(),
  routes,
});
