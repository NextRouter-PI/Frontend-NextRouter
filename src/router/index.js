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
    }
  ],
});


const ADMIN_URL = import.meta.env.VITE_ADMIN_URL

router.beforeEach(async (to, from) => {
  const { checkAuth } = useLoginState()

  if (to.meta.requiresAuth === false) {
    document.documentElement.className = ""
  } else {
    const saved = localStorage.getItem("theme")
    document.documentElement.className = saved === "dark" ? "dark" : ""
  }

  if (!state.logged && to.meta.requiresAuth) {
    await checkAuth();
  }

  if (state.logged && to.meta.requiresAuth === false && to.name !== 'logout' && to.name !== 'login') {
    return { name: "home" };
  }

  if (to.meta.requiresAuth && !state.logged) {
    return { name: "login" };
  }

  if (state.user?.type === 'company' && to.name !== 'logout' && to.name !== 'login') {
    const name = encodeURIComponent(state.user.name)
    const token = state.access
    window.location.href = `${ADMIN_URL}/?company=${name}&token=${token}`
    return false
  }

  return true;
});

export default router;
