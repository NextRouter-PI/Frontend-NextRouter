import { onScopeDispose, shallowRef } from 'vue'

/**
 * Controla contagem regressiva de cooldown em segundos com limpeza automática no escopo Vue.
 */
export function useCooldownTimer(defaultSeconds = 60) {
  const cooldown = shallowRef(0)
  let intervalId = null

  function stopCooldown() {
    if (intervalId !== null) {
      clearInterval(intervalId)
      intervalId = null
    }
  }

  function startCooldown(seconds = defaultSeconds) {
    stopCooldown()
    const duration = Math.max(1, Number(seconds) || defaultSeconds)
    const until = Date.now() + duration * 1000
    cooldown.value = duration
    intervalId = setInterval(() => {
      cooldown.value = Math.max(0, Math.ceil((until - Date.now()) / 1000))
      if (cooldown.value <= 0) stopCooldown()
    }, 1000)
  }

  function resetCooldown() {
    stopCooldown()
    cooldown.value = 0
  }

  onScopeDispose(stopCooldown)

  return {
    cooldown,
    startCooldown,
    stopCooldown,
    resetCooldown,
  }
}
