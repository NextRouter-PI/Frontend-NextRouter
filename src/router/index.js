import { createRouter, createWebHistory } from 'vue-router'
import {
  PERSONAL_ROLES,
  ROUTE_NAMES,
  ROUTE_PATHS,
  STORAGE_KEYS,
  THEME_MODES,
  USER_ROLES,
} from '@/constants'
import { state } from '@/stores/state.js'
import { useLoginState } from '@/stores/useLoginState.js'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  scrollBehavior() {
    return { top: 0 }
  },
  routes: [
    {
      path: ROUTE_PATHS.HOME,
      name: ROUTE_NAMES.HOME,
      component: () => import('@/views/HomeView.vue'),
      meta: { requiresAuth: true },
    },
    {
      path: ROUTE_PATHS.USER,
      component: () => import('@/views/UserView.vue'),
      meta: { requiresAuth: true },
      redirect: ROUTE_PATHS.USER_PROFILE,
      children: [
        {
          path: 'profile',
          name: ROUTE_NAMES.USER_PROFILE,
          component: () => import('@/views/UserProfileView.vue'),
          meta: { requiresAuth: true },
        },
        {
          path: 'security',
          name: ROUTE_NAMES.USER_SECURITY,
          component: () => import('@/views/AccountSecurityView.vue'),
          meta: { requiresAuth: true },
        },
      ],
    },
    {
      path: ROUTE_PATHS.LIST,
      name: ROUTE_NAMES.LIST,
      component: () => import('@/views/ListView.vue'),
      meta: { requiresAuth: true },
    },
    {
      path: ROUTE_PATHS.TRANSPORT,
      name: ROUTE_NAMES.TRANSPORT,
      component: () => import('@/views/TransportView.vue'),
      meta: { requiresAuth: true },
    },
    {
      path: ROUTE_PATHS.HISTORY,
      name: ROUTE_NAMES.HISTORY,
      component: () => import('@/views/TransportView.vue'),
      meta: { requiresAuth: true },
    },
    {
      path: ROUTE_PATHS.REGISTER_VEHICLE,
      name: ROUTE_NAMES.REGISTER_VEHICLE,
      component: () => import('@/features/company/components/CadastrarVeiculo.vue'),
      meta: { requiresAuth: true, requiresRole: [USER_ROLES.COMPANY] },
    },
    {
      path: ROUTE_PATHS.EDIT_VEHICLE,
      name: ROUTE_NAMES.EDIT_VEHICLE,
      component: () => import('@/features/company/components/EditarVeiculo.vue'),
      meta: { requiresAuth: true, requiresRole: [USER_ROLES.COMPANY] },
    },
    {
      path: ROUTE_PATHS.REGISTER_ROUTE,
      name: ROUTE_NAMES.REGISTER_ROUTE,
      component: () => import('@/features/company/components/CadastrarRota.vue'),
      meta: { requiresAuth: true, requiresRole: [USER_ROLES.COMPANY] },
    },
    {
      path: ROUTE_PATHS.EDIT_ROUTE,
      name: ROUTE_NAMES.EDIT_ROUTE,
      component: () => import('@/features/company/components/EditarRota.vue'),
      meta: { requiresAuth: true, requiresRole: [USER_ROLES.COMPANY] },
    },
    {
      path: ROUTE_PATHS.OPERATIONAL_POINTS,
      name: ROUTE_NAMES.OPERATIONAL_POINTS,
      component: () => import('@/views/OperationalPointsView.vue'),
      meta: { requiresAuth: true, requiresRole: [USER_ROLES.COMPANY] },
    },
    {
      path: ROUTE_PATHS.USERS,
      name: ROUTE_NAMES.USERS,
      component: () => import('@/features/company/components/CompanyUsuarios.vue'),
      meta: { requiresAuth: true, requiresRole: [USER_ROLES.COMPANY] },
    },
    {
      path: ROUTE_PATHS.COMPANIES,
      name: ROUTE_NAMES.COMPANIES,
      component: () => import('@/views/CompanyDirectoryView.vue'),
      meta: { requiresAuth: false, allowAuthenticated: true },
    },
    {
      path: ROUTE_PATHS.MEMBERSHIPS,
      name: ROUTE_NAMES.MEMBERSHIPS,
      component: () => import('@/views/MembershipsView.vue'),
      meta: { requiresAuth: true, requiresRole: [...PERSONAL_ROLES] },
    },
    {
      path: ROUTE_PATHS.SECURITY_REDIRECT,
      name: ROUTE_NAMES.SECURITY_REDIRECT,
      redirect: ROUTE_PATHS.USER_SECURITY,
      meta: { requiresAuth: true },
    },
    {
      path: ROUTE_PATHS.LINKED_DRIVER,
      name: ROUTE_NAMES.LINKED_DRIVER,
      component: () => import('@/views/LinkedProfileView.vue'),
      meta: { requiresAuth: true, requiresRole: [USER_ROLES.COMPANY] },
    },
    {
      path: ROUTE_PATHS.LINKED_PASSENGER,
      name: ROUTE_NAMES.LINKED_PASSENGER,
      component: () => import('@/views/LinkedProfileView.vue'),
      meta: { requiresAuth: true, requiresRole: [USER_ROLES.COMPANY] },
    },
    {
      path: ROUTE_PATHS.LOGIN,
      name: ROUTE_NAMES.LOGIN,
      component: () => import('@/views/LoginView.vue'),
      meta: { requiresAuth: false },
    },
    {
      path: ROUTE_PATHS.SIGNUP,
      name: ROUTE_NAMES.SIGNUP,
      component: () => import('@/views/SignUpView.vue'),
      meta: { requiresAuth: false },
    },
    {
      path: ROUTE_PATHS.SIGNUP_PASSENGER,
      name: ROUTE_NAMES.SIGNUP_PASSENGER,
      component: () => import('@/features/auth/components/SignUpPassenger.vue'),
      meta: { requiresAuth: false },
    },
    {
      path: ROUTE_PATHS.SIGNUP_DRIVER,
      name: ROUTE_NAMES.SIGNUP_DRIVER,
      component: () => import('@/features/auth/components/SignUpDriver.vue'),
      meta: { requiresAuth: false },
    },
    {
      path: ROUTE_PATHS.SIGNUP_COMPANY,
      name: ROUTE_NAMES.SIGNUP_COMPANY,
      component: () => import('@/features/auth/components/SignUpCompany.vue'),
      meta: { requiresAuth: false },
    },
    {
      path: ROUTE_PATHS.SIGNUP_CONFIRMATION,
      name: ROUTE_NAMES.SIGNUP_CONFIRMATION,
      component: () => import('@/views/ConfirmationView.vue'),
      meta: { requiresAuth: false },
    },
    {
      path: ROUTE_PATHS.FORGOT_PASSWORD,
      name: ROUTE_NAMES.FORGOT_PASSWORD,
      component: () => import('@/views/ForgotPasswordView.vue'),
      meta: { requiresAuth: false },
    },
    {
      path: ROUTE_PATHS.LOGOUT,
      name: ROUTE_NAMES.LOGOUT,
      component: () => import('@/views/LogoutView.vue'),
      meta: { requiresAuth: false },
    },
    {
      path: ROUTE_PATHS.FORBIDDEN,
      name: ROUTE_NAMES.FORBIDDEN,
      component: () => import('@/views/ForbiddenView.vue'),
      meta: { requiresAuth: true, hideChrome: true },
    },
    {
      path: '/:pathMatch(.*)*',
      name: ROUTE_NAMES.NOT_FOUND,
      component: () => import('@/views/NotFoundView.vue'),
      meta: { requiresAuth: false, allowAuthenticated: true, hideChrome: true },
    },
  ],
})

router.beforeEach(async (to) => {
  const { checkAuth } = useLoginState()

  const saved = localStorage.getItem(STORAGE_KEYS.THEME)
  document.documentElement.className = saved === THEME_MODES.DARK ? THEME_MODES.DARK : ''

  if (!state.initialized && to.name !== ROUTE_NAMES.LOGOUT) {
    await checkAuth()
  }

  if (
    state.logged &&
    to.meta.requiresAuth === false &&
    !to.meta.allowAuthenticated &&
    to.name !== ROUTE_NAMES.LOGOUT
  ) {
    return { name: ROUTE_NAMES.HOME }
  }

  if (to.meta.requiresAuth && !state.logged) {
    const query = {}
    if (to.name === ROUTE_NAMES.MEMBERSHIPS) {
      if (to.query.company) query.company = to.query.company
      if (to.query.group) query.group = to.query.group
    }
    return { name: ROUTE_NAMES.LOGIN, query }
  }

  if (to.meta.requiresRole && state.logged && !to.meta.requiresRole.includes(state.role)) {
    return { name: ROUTE_NAMES.FORBIDDEN }
  }

  return true
})

export default router
