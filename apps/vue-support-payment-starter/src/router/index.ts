import { createRouter, createWebHistory } from "vue-router";
import MerchantList from "../views/MerchantList.vue";
import OrderList from "../views/OrderList.vue";
import TransactionList from "../views/TransactionList.vue";

const routes = [
  {
    path: "/",
    redirect: "/merchants",
  },
  {
    path: "/merchants",
    name: "MerchantList",
    component: MerchantList,
  },
  {
    path: "/orders",
    name: "OrderList",
    component: OrderList,
  },
  {
    path: "/transactions",
    name: "TransactionList",
    component: TransactionList,
  },
];

export default createRouter({
  history: createWebHistory(),
  routes,
});
