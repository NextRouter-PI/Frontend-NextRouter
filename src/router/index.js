import { createRouter, createWebHistory } from 'vue-router'
import { ROUTE_NAMES, STORAGE_KEYS, THEME_MODES } from '@/constants'
import { state } from '@/stores/state.js'
import { useLoginState } from '@/stores/useLoginState.js'
import { authenticatedRoutes } from './routes/authenticated'
import { companyRoutes } from './routes/company'
import { publicRoutes } from './routes/public'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  scrollBehavior() {
    return { top: 0 }
  },
  routes: [...authenticatedRoutes, ...companyRoutes, ...publicRoutes],
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
