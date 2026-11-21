import { ROUTE_NAMES, ROUTE_PATHS, USER_ROLES } from '@/constants'

const COMPANY_META = { requiresAuth: true, requiresRole: [USER_ROLES.COMPANY] }

export const companyRoutes = [
  {
    path: ROUTE_PATHS.REGISTER_VEHICLE,
    name: ROUTE_NAMES.REGISTER_VEHICLE,
    component: () => import('@/features/company/components/CadastrarVeiculo.vue'),
    meta: COMPANY_META,
  },
  {
    path: ROUTE_PATHS.EDIT_VEHICLE,
    name: ROUTE_NAMES.EDIT_VEHICLE,
    component: () => import('@/features/company/components/EditarVeiculo.vue'),
    meta: COMPANY_META,
  },
  {
    path: ROUTE_PATHS.REGISTER_ROUTE,
    name: ROUTE_NAMES.REGISTER_ROUTE,
    component: () => import('@/features/company/components/CadastrarRota.vue'),
    meta: COMPANY_META,
  },
  {
    path: `${ROUTE_PATHS.EDIT_ROUTE}/:tab(settings|routes)?`,
    name: ROUTE_NAMES.EDIT_ROUTE,
    component: () => import('@/features/company/components/EditarRota.vue'),
    meta: COMPANY_META,
  },
  {
    path: ROUTE_PATHS.OPERATIONAL_POINTS,
    name: ROUTE_NAMES.OPERATIONAL_POINTS,
    component: () => import('@/views/OperationalPointsView.vue'),
    meta: COMPANY_META,
  },
  {
    path: ROUTE_PATHS.USERS,
    name: ROUTE_NAMES.USERS,
    component: () => import('@/features/company/components/CompanyUsuarios.vue'),
    meta: COMPANY_META,
  },
  {
    path: ROUTE_PATHS.LINKED_DRIVER,
    name: ROUTE_NAMES.LINKED_DRIVER,
    component: () => import('@/views/LinkedProfileView.vue'),
    meta: COMPANY_META,
  },
  {
    path: ROUTE_PATHS.LINKED_PASSENGER,
    name: ROUTE_NAMES.LINKED_PASSENGER,
    component: () => import('@/views/LinkedProfileView.vue'),
    meta: COMPANY_META,
  },
]
