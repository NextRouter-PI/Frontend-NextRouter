// v-reveal: o elemento entra (sobe e aparece) quando chega na tela ao rolar.
// Sem IntersectionObserver ou com "reduzir movimento", aparece direto.
let observer = null

function getObserver() {
  if (observer || typeof IntersectionObserver === 'undefined') return observer
  observer = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue
        entry.target.classList.add('is-revealed')
        observer.unobserve(entry.target)
      }
    },
    { rootMargin: '0px 0px -8% 0px', threshold: 0.08 },
  )
  return observer
}

export const revealDirective = {
  mounted(el) {
    const io = getObserver()
    if (!io || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    el.classList.add('reveal')
    io.observe(el)
  },
  unmounted(el) {
    observer?.unobserve(el)
  },
}
