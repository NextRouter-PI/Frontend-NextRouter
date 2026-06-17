import { createRouter, createWebHistory } from "vue-router";
import { state } from "@/store/state.js";
import { useLoginState } from "@/store/useLoginState.js"

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: "/",
      name: "home",
      component: () => import("../views/HomeView.vue"),
      meta: { requiresAuth: true }
    },
    {
      path: "/usuario",
      name: "usuario",
      component: () => import("../views/UserView.vue"),
      meta: { requiresAuth: true }
    },
    {
      path: "/lista",
      name: "lista",
      component: () => import("../views/ListView.vue"),
      meta: { requiresAuth: true }
    },
    {
      path: "/transporte",
      name: "transporte",
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
      path: "/signup/usuario",
      name: "signup-usuario",
      component: () => import("../components/singUp/SingUp-Passageiro.vue"),
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


router.beforeEach(async (to, from) => {
  const { checkAuth } = useLoginState()

  if (!state.logged && to.meta.requiresAuth) {
    await checkAuth();
  }

  if (state.logged && to.meta.requiresAuth === false) {
    return { name: "home" };
  }

  if (to.meta.requiresAuth && !state.logged) {
    return { name: "login" };
  }

  return true;
});

export default router;
