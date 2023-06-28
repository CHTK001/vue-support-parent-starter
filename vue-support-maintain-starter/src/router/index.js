import {createRouter, createWebHistory} from "vue-router"
import Home from "@/view/home.vue"


const routes = [{
    path: "/",
    name: 'home',
    component: Home
},{
    path: "/sql-edit",
    name: 'sql-edit',
    component: () => import("@/view/sql-edit.vue")
}];


const router = createRouter({
    routes,
    history: createWebHistory(),
});
export default router;