import { createRouter, createWebHistory } from "vue-router";
import { useLoginState } from "@/store/useLoginState";

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: "/",
      name: "home",
      component: () => import("../views/HomeView.vue"),
      meta: { requiresAuth: true }
    },
    // Rotas para Passageiros/Usuários
    {
      path: "/usuarios/home",
      name: "usuarios-home",
      component: () => import("../views/passageiro-view/PassageiroHomeView.vue"),
      meta: { requiresAuth: true, userType: "passageiro" }
    },
    {
      path: "/usuarios/list",
      name: "usuarios-list",
      component: () => import("../views/passageiro-view/PassageiroListView.vue"),
      meta: { requiresAuth: true, userType: "passageiro" }
    },
    {
      path: "/usuarios/user",
      name: "usuarios-user",
      component: () => import("../views/passageiro-view/PassageiroUserView.vue"),
      meta: { requiresAuth: true, userType: "passageiro" }
    },
    {
      path: "/usuarios/transport",
      name: "usuarios-transport",
      component: () => import("../views/passageiro-view/PassageiroTransportView.vue"),
      meta: { requiresAuth: true, userType: "passageiro" }
    },
    // Rotas para Motoristas
    {
      path: "/motorista/home",
      name: "motorista-home",
      component: () => import("../views/motorista-view/MotoristaHomeView.vue"),
      meta: { requiresAuth: true, userType: "motorista" }
    },
    {
      path: "/motorista/list",
      name: "motorista-list",
      component: () => import("../views/motorista-view/MotoristaListView.vue"),
      meta: { requiresAuth: true, userType: "motorista" }
    },
    {
      path: "/motorista/user",
      name: "motorista-user",
      component: () => import("../views/motorista-view/MotoristaUserView.vue"),
      meta: { requiresAuth: true, userType: "motorista" }
    },
    {
      path: "/motorista/transport",
      name: "motorista-transport",
      component: () => import("../views/motorista-view/MotoristaTransportView.vue"),
      meta: { requiresAuth: true, userType: "motorista" }
    },
    // Rotas de Autenticação
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
