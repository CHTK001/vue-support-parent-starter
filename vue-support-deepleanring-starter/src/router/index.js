import {createRouter, createWebHistory} from "vue-router"
import Home from "@/view/home.vue"


const routes = [{
    path: "/",
    name: 'home',
    component: Home
}];


const router = createRouter({
    routes,
    history: createWebHistory(),
});
export default router;