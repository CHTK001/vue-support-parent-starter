import {createRouter, createWebHistory} from "vue-router"
import Home from "@/view/home.vue"


const routes = [{
    path: "/",
    name: 'home',
    component: Home
},
{
    path: "/ocr",
    name: 'ocr',
    component: () => import("@/view/ocr.vue"),
}];


const router = createRouter({
    routes,
    history: createWebHistory(),
});
export default router;