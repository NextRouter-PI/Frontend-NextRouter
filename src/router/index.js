import { createRouter, createWebHistory } from "vue-router";
import { state } from "@/stores/state.js";
import { useLoginState } from "@/stores/useLoginState.js"

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  scrollBehavior() {
    return { top: 0 }
  },
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
      path: "/cadastro-veiculo",
      name: "cadastro-veiculo",
      component: () => import("../components/pages/company/CadastrarVeiculo.vue"),
      meta: { requiresAuth: true, requiresRole: ["company"] }
    },
    {
      path: "/veiculos/editar/:id",
      name: "editar-veiculo",
      component: () => import("../components/pages/company/EditarVeiculo.vue"),
      meta: { requiresAuth: true, requiresRole: ["company"] }
    },
    {
      path: "/cadastro-rota",
      name: "cadastro-rota",
      component: () => import("../components/pages/company/CadastrarRota.vue"),
      meta: { requiresAuth: true, requiresRole: ["company"] }
    },
    {
      path: "/rotas/editar/:id",
      name: "editar-rota",
      component: () => import("../components/pages/company/EditarRota.vue"),
      meta: { requiresAuth: true, requiresRole: ["company"] }
    },
    {
      path: "/pontos-operacionais",
      name: "pontos-operacionais",
      component: () => import("../views/OperationalPointsView.vue"),
      meta: { requiresAuth: true, requiresRole: ["company"] }
    },
    {
      path: "/usuarios",
      name: "usuarios",
      component: () => import("../components/pages/company/CompanyUsuarios.vue"),
      meta: { requiresAuth: true, requiresRole: ["company"] }
    },
    {
      path: '/empresas',
      name: 'empresas',
      component: () => import('../views/CompanyDirectoryView.vue'),
      meta: { requiresAuth: false, allowAuthenticated: true },
    },
    {
      path: '/vinculos',
      name: 'vinculos',
      component: () => import('../views/MembershipsView.vue'),
      meta: { requiresAuth: true, requiresRole: ['passenger', 'driver'] },
    },
    {
      path: '/seguranca',
      name: 'seguranca',
      component: () => import('../views/AccountSecurityView.vue'),
      meta: { requiresAuth: true },
    },
    {
      path: "/usuarios/motorista/:id",
      name: "usuario-motorista",
      component: () => import('../views/LinkedProfileView.vue'),
      meta: { requiresAuth: true, requiresRole: ["company"] }
    },
    {
      path: "/usuarios/passageiro/:id",
      name: "usuario-passageiro",
      component: () => import('../views/LinkedProfileView.vue'),
      meta: { requiresAuth: true, requiresRole: ["company"] }
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
      component: () => import("../components/forms/SignUpPassenger.vue"),
      meta: { requiresAuth: false }
    },
    {
      path: "/signup/motorista",
      name: "signup-motorista",
      component: () => import("../components/forms/SignUpDriver.vue"),
      meta: { requiresAuth: false }
    },
    {
      path: "/signup/empresa",
      name: "signup-empresa",
      component: () => import("../components/forms/SignUpCompany.vue"),
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
    },
    {
      path: "/logout",
      name: "logout",
      component: () => import("../views/LogoutView.vue"),
      meta: { requiresAuth: false }
    },
    {
      path: "/403",
      name: "forbidden",
      component: () => import("../views/ForbiddenView.vue"),
      meta: { requiresAuth: true }
    },
    {
      path: "/:pathMatch(.*)*",
      name: "not-found",
      component: () => import("../views/NotFoundView.vue"),
      meta: { requiresAuth: false, allowAuthenticated: true }
    }
  ],
});

router.beforeEach(async (to) => {
  const { checkAuth } = useLoginState()

  const saved = localStorage.getItem("theme")
  document.documentElement.className = saved === "dark" ? "dark" : ""

  if (!state.initialized && to.name !== 'logout') {
    await checkAuth();
  }

  if (state.logged && to.meta.requiresAuth === false && !to.meta.allowAuthenticated && to.name !== 'logout' && to.name !== 'login') {
    return { name: "home" };
  }

  if (to.meta.requiresAuth && !state.logged) {
    return {
      name: 'login',
      query: to.name === 'vinculos' ? { company: to.query.company } : {},
    };
  }

  if (to.meta.requiresRole && state.logged && !to.meta.requiresRole.includes(state.role)) {
    return { name: 'forbidden' };
  }

  return true;
});

export default router;
