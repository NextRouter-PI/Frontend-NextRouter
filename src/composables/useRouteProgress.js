import { computed, onUnmounted, shallowRef } from 'vue'
import { useRouter } from 'vue-router'
import { ROUTE_PATHS } from '@/constants'

export function useRouteProgress({ isMobile }) {
  const router = useRouter()
  const transitionName = shallowRef('page-fade')
  const isNavigating = shallowRef(false)
  let navDelayTimer = null

  const isAuthSlide = computed(
    () => transitionName.value === 'slide-forward' || transitionName.value === 'slide-back',
  )

  function finishNavigation() {
    if (navDelayTimer) {
      clearTimeout(navDelayTimer)
      navDelayTimer = null
    }
    isNavigating.value = false
  }

  const removeBeforeEach = router.beforeEach((to, from) => {
    if (!isMobile.value && from.path === ROUTE_PATHS.LOGIN && to.path === ROUTE_PATHS.SIGNUP) {
      transitionName.value = 'slide-forward'
    } else if (!isMobile.value && from.path === ROUTE_PATHS.SIGNUP && to.path === ROUTE_PATHS.LOGIN) {
      transitionName.value = 'slide-back'
    } else {
      transitionName.value = 'page-fade'
    }
    if (to.path !== from.path) {
      if (navDelayTimer) clearTimeout(navDelayTimer)
      navDelayTimer = setTimeout(() => {
        isNavigating.value = true
      }, 100)
    }
  })

  const removeAfterEach = router.afterEach(finishNavigation)
  const removeOnError = router.onError(finishNavigation)

  onUnmounted(() => {
    removeBeforeEach()
    removeAfterEach()
    removeOnError()
    finishNavigation()
  })

  return { transitionName, isNavigating, isAuthSlide }
}
