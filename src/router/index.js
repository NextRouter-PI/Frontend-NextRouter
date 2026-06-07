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


router.beforeEach(async (to, from) => {
  const { checkAuth } = useLoginState()
  // SE o usuário não está marcado como logado, tentamos restaurar a sessão do Cookie primeiro
  if (!state.logged) {
    await checkAuth();
  }

  // Agora sim o 'state.logged' e 'state.user' estão atualizados e confiáveis!

  if (to.meta.requiresAuth && !state.logged) {
    return { name: "login" };
  }

  if (state.logged && to.path === "/") {
    // Atenção aqui: Verifique se no seu backend o tipo vem como 'Passageiro' ou 'passageiro'
    // Com base no componente anterior, você usou state.user.type
    const type = state.user?.user_type?.toLowerCase();

    if (type === "passenger") {
      return { name: "usuarios-list" };
    }

    if (type === "driver") {
      return { name: "motorista-list" };
    }
  }

  return true;
});

export default router;
