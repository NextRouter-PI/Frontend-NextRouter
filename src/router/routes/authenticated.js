import { PERSONAL_ROLES, ROUTE_NAMES, ROUTE_PATHS } from '@/constants'

export const authenticatedRoutes = [
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
    path: ROUTE_PATHS.SECURITY_REDIRECT,
    name: ROUTE_NAMES.SECURITY_REDIRECT,
    redirect: ROUTE_PATHS.USER_SECURITY,
    meta: { requiresAuth: true },
  },
  {
    path: `${ROUTE_PATHS.LIST}/:tab(groups|operations|history)?`,
    name: ROUTE_NAMES.LIST,
    component: () => import('@/views/ListView.vue'),
    meta: { requiresAuth: true },
  },
  {
    path: `${ROUTE_PATHS.TRANSPORT}/:tab(fleet|garages)?`,
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
    path: ROUTE_PATHS.MEMBERSHIPS,
    name: ROUTE_NAMES.MEMBERSHIPS,
    component: () => import('@/views/MembershipsView.vue'),
    meta: { requiresAuth: true, requiresRole: [...PERSONAL_ROLES] },
  },
]
