import {createRouter, createWebHistory} from "vue-router"
import Home from "@/view/home.vue"


const routes = [{
    path: "/",
    name: 'home',
    component: Home
},{
    path: "/oss",
    name: "oss",
    component: () => import('@/view/oss.vue'),
    meta: {
        title: '文件管理'
    }
},{
    path: "/oss-view",
    name: "oss-view",
    component: () => import('@/view/oss-view.vue'),
    meta: {
        title: '文件管理-预览'
    }
},{
    path: "/markdown",
    name: "markdown",
    component: () => import('@/view/subview/markdown.vue'),
    meta: {
        title: 'MD-预览'
    }
},{
    path: "/json",
    name: "json",
    component: () => import('@/view/subview/json.vue'),
    meta: {
        title: 'json-预览'
    }
},{
    path: "/sql-editor",
    name: 'sql-editor',
    component: () => import("@/view/sql-editor.vue"),
    meta: {
        title: 'SQL编辑器'
    }
},{
    path: "/terminal",
    name: 'terminal',
    component: () => import("@/view/terminal.vue"),
    meta: {
        title: '终端管理'
    }
}];


const router = createRouter({
    routes,
    history: createWebHistory(),
});
export default router;