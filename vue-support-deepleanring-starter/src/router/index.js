import {createRouter, createWebHistory} from "vue-router"
import Home from "@/view/home.vue"


const routes = [{
    path: "/",
    name: 'home',
    component: Home
},
{
    path: "/detect",
    name: 'detect',
    component: () => import("@/view/learning.vue"),
},
{
    path: "/compare",
    name: 'compare',
    component: () => import("@/view/compare.vue"),
}];


const router = createRouter({
    routes,
    history: createWebHistory(),
});
export default router;