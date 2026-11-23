import { readonly, shallowRef } from 'vue'
import { MOBILE_BREAKPOINT_PX } from '@/constants'

const mediaQuery =
  typeof window !== 'undefined' && typeof window.matchMedia === 'function'
    ? window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT_PX}px)`)
    : null

const isMobile = shallowRef(
  mediaQuery
    ? mediaQuery.matches
    : typeof window !== 'undefined'
      ? window.innerWidth <= MOBILE_BREAKPOINT_PX
      : false,
)
const isDesktop = shallowRef(!isMobile.value)

function sync(matches) {
  isMobile.value = matches
  isDesktop.value = !matches
}

if (mediaQuery) {
  const onChange = (event) => sync(event.matches)
  mediaQuery.addEventListener('change', onChange)
}

export function useDeviceLayout() {
  return {
    isMobile: readonly(isMobile),
    isDesktop: readonly(isDesktop),
  }
}
