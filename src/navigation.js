import { PERSONAL_ROLES, ROUTE_PATHS, USER_ROLES } from '@/constants'

export function navigationItems(role) {
  const isCompany = role === USER_ROLES.COMPANY
  return [
    { to: ROUTE_PATHS.HOME, matchPrefix: ROUTE_PATHS.HOME, title: 'Home', icon: 'mdi-home' },
    {
      to: isCompany ? ROUTE_PATHS.TRANSPORT_FLEET : ROUTE_PATHS.HISTORY,
      matchPrefix: isCompany ? ROUTE_PATHS.TRANSPORT : ROUTE_PATHS.HISTORY,
      title: isCompany ? 'Veículos' : 'Histórico',
      icon: isCompany ? 'mdi-bus' : 'mdi-history',
    },
    {
      to: isCompany ? ROUTE_PATHS.LIST_GROUPS : ROUTE_PATHS.LIST,
      matchPrefix: ROUTE_PATHS.LIST,
      title: isCompany ? 'Rotas' : 'Lista',
      icon: isCompany ? 'mdi-map-outline' : 'mdi-format-list-bulleted',
    },
    ...(isCompany
      ? [
          {
            to: ROUTE_PATHS.LIVE_OPERATIONS,
            matchPrefix: ROUTE_PATHS.LIVE_OPERATIONS,
            title: 'Ao vivo',
            icon: 'mdi-radar',
          },
          {
            to: ROUTE_PATHS.OPERATIONAL_POINTS,
            matchPrefix: ROUTE_PATHS.OPERATIONAL_POINTS,
            title: 'Pontos',
            icon: 'mdi-map-marker-radius',
          },
          {
            to: ROUTE_PATHS.USERS,
            matchPrefix: ROUTE_PATHS.USERS,
            title: 'Usuários',
            icon: 'mdi-account-group',
          },
        ]
      : []),
    ...(PERSONAL_ROLES.includes(role)
      ? [
          {
            to: ROUTE_PATHS.MEMBERSHIPS,
            matchPrefix: ROUTE_PATHS.MEMBERSHIPS,
            title: 'Vínculo',
            icon: 'mdi-domain',
          },
        ]
      : []),
  ]
}
