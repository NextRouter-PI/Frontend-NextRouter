import { onScopeDispose, shallowRef, watch } from 'vue'

/**
 * Retorna um ref debounced para filtros locais, evitando recomputações a cada tecla em listas grandes.
 */
export function useDebounce(source, delayMs = 150) {
  const debounced = shallowRef(source.value)
  let timer = null

  function clear() {
    if (timer !== null) {
      clearTimeout(timer)
      timer = null
    }
  }

  watch(source, (value) => {
    clear()
    if (!value) {
      debounced.value = value
      return
    }
    timer = setTimeout(() => {
      debounced.value = value
      timer = null
    }, delayMs)
  })

  onScopeDispose(clear)

  return debounced
}
