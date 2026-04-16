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
    },
    {
      path: "/signup",
      name: "signup",
      component: () => import("../views/SignUpView.vue"),
      meta: { requiresAuth: false }
    },
    {
      path: "/register",
      name: "register",
      component: () => import("../views/RegisterFormView.vue"),
      meta: { requiresAuth: false }
    },
    {
      path: "/signup/usuario",
      name: "signup-usuario",
      component: () => import("../components/singUp/SingUp-Usuarios.vue"),
      meta: { requiresAuth: false }
    },
    {
      path: "/signup/motorista",
      name: "signup-motorista",
      component: () => import("../components/singUp/SingUp-Motorista.vue"),
      meta: { requiresAuth: false }
    },
    {
      path: "/signup/empresa",
      name: "signup-empresa",
      component: () => import("../components/singUp/SingUp-Empresa.vue"),
      meta: { requiresAuth: false }
    },
    {
      path: "/signup/usuario/cidade",
      name: "signup-usuario-cidade",
      component: () => import("../views/CitySelectionView.vue"),
      meta: { requiresAuth: false }
    },
    {
      path: "/signup/motorista/empresa",
      name: "signup-motorista-empresa",
      component: () => import("../views/CompanySelectionView.vue"),
      meta: { requiresAuth: false }
    },
    {
      path: "/signup/confirmacao",
      name: "signup-confirmacao",
      component: () => import("../views/ConfirmationView.vue"),
      meta: { requiresAuth: false }
    },
    {
      path: "/forgot-password",
      name: "forgot-password",
      component: () => import("../views/ForgotPasswordView.vue"),
      meta: { requiresAuth: false }
    }
  ],
});

const { state } = useLoginState();

router.beforeEach((to, from, next) => {
  if (to.meta.requiresAuth && !state.logado) {
    next({ name: "login" });
  } else {
    next();
  }
});

export default router;
