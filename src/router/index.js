import { createRouter, createWebHistory } from "vue-router";
import HomeView from "../views/HomeView.vue";
import { useLoginState } from "@/store/useLoginState";

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: "/",
      name: "home",
      component: HomeView,
      meta: { requiresAuth: true }
    },
    {
      path: "/list",
      name: "list",
      component: () => import("../views/ListView.vue"),
      meta: { requiresAuth: true }
    },
    {
      path: "/user",
      name: "user",
      component: () => import("../views/UserView.vue"),
      meta: { requiresAuth: true }
    },
    {
      path: "/transport",
      name: "transport",
      component: () => import("../views/TransportView.vue"),
      meta: { requiresAuth: true }
    },
    {
      path: "/login",
      name: "login",
      component: () => import("../views/LoginView.vue"),
      meta: { requiresAuth: false }
    }
  ],
});

export default router;