import { createRouter, createWebHistory } from 'vue-router'
import { ROUTE_NAMES, ROUTE_PATHS, STORAGE_KEYS, THEME_MODES, USER_ROLES } from '@/constants'
import { useAuthStore } from '@/stores/useAuthStore.js'
import { authenticatedRoutes } from './routes/authenticated'
import { companyRoutes } from './routes/company'
import { publicRoutes } from './routes/public'

const COMPANY_DEFAULT_TAB_PATHS = {
  [ROUTE_NAMES.TRANSPORT]: ROUTE_PATHS.TRANSPORT_FLEET,
  [ROUTE_NAMES.LIST]: ROUTE_PATHS.LIST_GROUPS,
}

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  scrollBehavior() {
    return { top: 0 }
  },
  routes: [...authenticatedRoutes, ...companyRoutes, ...publicRoutes],
})

router.beforeEach(async (to) => {
  const auth = useAuthStore()

  const saved = localStorage.getItem(STORAGE_KEYS.THEME)
  document.documentElement.className = saved === THEME_MODES.DARK ? THEME_MODES.DARK : ''

  if (!auth.initialized && to.name !== ROUTE_NAMES.LOGOUT) {
    await auth.checkAuth()
  }

  if (
    auth.logged &&
    to.meta.requiresAuth === false &&
    !to.meta.allowAuthenticated &&
    to.name !== ROUTE_NAMES.LOGOUT
  ) {
    return { name: ROUTE_NAMES.HOME }
  }

  if (to.meta.requiresAuth && !auth.logged) {
    const query = {}
    if (to.name === ROUTE_NAMES.MEMBERSHIPS) {
      if (to.query.company) query.company = to.query.company
      if (to.query.group) query.group = to.query.group
    }
    return { name: ROUTE_NAMES.LOGIN, query }
  }

  if (to.meta.requiresRole && auth.logged && !to.meta.requiresRole.includes(auth.role)) {
    return { name: ROUTE_NAMES.FORBIDDEN }
  }

  if (auth.logged && auth.role === USER_ROLES.COMPANY && !to.params.tab) {
    const defaultTabPath = COMPANY_DEFAULT_TAB_PATHS[to.name]
    if (defaultTabPath) {
      return { path: defaultTabPath, query: to.query, hash: to.hash, replace: true }
    }
    if (to.name === ROUTE_NAMES.EDIT_ROUTE) {
      return {
        path: `/routes/${to.params.id}/edit/settings`,
        query: to.query,
        hash: to.hash,
        replace: true,
      }
    }
  }

  return true
})

export default router
