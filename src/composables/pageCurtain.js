import { shallowRef } from 'vue'
import { ROUTE_NAMES } from '@/constants'

// Lado da foto em cada tela pública. A onda sempre sai do lado da foto da tela atual
// e atravessa para o outro lado, de forma contínua.
const PHOTO_SIDE = {
  [ROUTE_NAMES.LOGIN]: 'left',
  [ROUTE_NAMES.SIGNUP]: 'right',
  [ROUTE_NAMES.FORGOT_PASSWORD]: 'right',
  [ROUTE_NAMES.SIGNUP_PASSENGER]: 'left',
  [ROUTE_NAMES.SIGNUP_DRIVER]: 'left',
  [ROUTE_NAMES.SIGNUP_COMPANY]: 'left',
  [ROUTE_NAMES.COMPANIES]: 'left',
}

/**
 * Regra única da cortina laranja entre páginas:
 * - 'side' / 'side-back': entre as telas públicas com foto (entra pelo lado da foto da tela atual);
 * - 'up': ao entrar na conta (de uma tela pública para uma área logada);
 * - null: em todo o resto (inclusive entre páginas logadas), sem onda.
 * Também é usada pelo indicador de navegação, que não deve aparecer por baixo da cortina.
 */
export function curtainMode(to, from) {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return null
  if (!from.matched.length) return null // primeira carga já tem a tela de abertura
  if (to.name && to.name === from.name) return null

  const fromSide = PHOTO_SIDE[from.name]
  if (fromSide && PHOTO_SIDE[to.name]) return fromSide === 'left' ? 'side' : 'side-back'
  if (from.meta?.requiresAuth === false && to.meta?.requiresAuth) return 'up'
  return null
}

export function shouldPlayCurtain(to, from) {
  return curtainMode(to, from) !== null
}

// Cobrir a tela fora do roteador (ex.: login, que recarrega a página por segurança).
// Depois do recarregamento, a cortina começa fechada e desce revelando a área logada.

export const CURTAIN_RESUME_KEY = 'nr-curtain-resume'
export const curtainRequest = shallowRef(null)

export function requestCurtainCover(mode = 'up') {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return Promise.resolve()
  return new Promise((resolve) => {
    curtainRequest.value = { mode, resolve }
  })
}
