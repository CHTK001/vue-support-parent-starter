import {createRouter, createWebHistory} from "vue-router"
import Home from "@/view/home.vue"


const routes = [{
    path: "/",
    name: 'home',
    component: Home
},{
    path: "/sql-editor",
    name: 'sql-editor',
    component: () => import("@/view/sql-editor.vue")
},{
    path: "/terminal",
    name: 'terminal',
    component: () => import("@/view/terminal.vue")
}];


const router = createRouter({
    routes,
    history: createWebHistory(),
});
export default router;