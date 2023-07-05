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
    path: "/task",
    name: "task",
    component: () => import('@/view/task.vue'),
    meta: {
        title: '任务管理'
    }
},{
    path: "/oss-view",
    name: "oss-view",
    component: () => import('@/view/oss-view.vue'),
    meta: {
        title: '文件管理-预览'
    }
},{
    path: "/compress",
    name: "compress",
    component: () => import('@/view/subview/compress.vue'),
    meta: {
        title: 'html-预览'
    }
},{
    path: "/html",
    name: "html",
    component: () => import('@/view/subview/html.vue'),
    meta: {
        title: 'html-预览'
    }
},{
    path: "/txt",
    name: "txt",
    component: () => import('@/view/subview/txt.vue'),
    meta: {
        title: 'txt-预览'
    }
},{
    path: "/pdf",
    name: "pdf",
    component: () => import('@/view/subview/pdf.vue'),
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
    path: "/docx",
    name: "docx",
    component: () => import('@/view/subview/docx.vue'),
    meta: {
        title: 'docx-预览'
    }
},{
    path: "/excel",
    name: "excel",
    component: () => import('@/view/subview/excel.vue'),
    meta: {
        title: 'excel-预览'
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