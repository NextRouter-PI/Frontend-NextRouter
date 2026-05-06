import { createRouter, createWebHistory } from "vue-router";
import { useLoginState } from "@/store/useLoginState";

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: "/" ,
      name: "home",
      component: () => import("../views/HomeView.vue"),
      meta: { requiresAuth: true }
    },
    {
      path: "/usuario",
      name: "usuario",
      component: () => import("../views/UserView.vue"),
    },
    {
      path: "/lista",
      name: "lista",
      component: () => import("../views/ListView.vue"),
    },
    {
      path: "/transporte",
      name: "transporte",
      component: () => import("../views/TransportView.vue"),
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
  // Verifica autenticação
  if (to.meta.requiresAuth && !state.logado) {
    next({ name: "login" });
    return;
  }

  // Se o usuário está logado e tenta ir para a página inicial, redireciona para a página do tipo dele
  if (state.logado && to.path === "/") {
    if (state.tipoUsuario === "passageiro") {
      next({ name: "usuarios-list" });
    } else if (state.tipoUsuario === "motorista") {
      next({ name: "motorista-list" });
    } else {
      next();
    }
    return;
  }

  next();
});

export default router;
