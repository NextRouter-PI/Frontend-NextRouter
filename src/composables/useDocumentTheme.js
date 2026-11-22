import { onMounted, onUnmounted, shallowRef } from 'vue'

export function useDocumentTheme() {
  const theme = shallowRef(
    typeof document !== 'undefined' && document.documentElement.classList.contains('dark')
      ? 'dark'
      : 'light',
  )
  let observer = null

  onMounted(() => {
    if (typeof MutationObserver === 'undefined') return
    observer = new MutationObserver(() => {
      theme.value = document.documentElement.classList.contains('dark') ? 'dark' : 'light'
    })
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] })
  })

  onUnmounted(() => {
    observer?.disconnect()
    observer = null
  })

  return { theme }
}
