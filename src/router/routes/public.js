import { ROUTE_NAMES, ROUTE_PATHS } from '@/constants'

export const publicRoutes = [
  {
    path: ROUTE_PATHS.COMPANIES,
    name: ROUTE_NAMES.COMPANIES,
    component: () => import('@/views/CompanyDirectoryView.vue'),
    meta: { requiresAuth: false, allowAuthenticated: true },
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
]
