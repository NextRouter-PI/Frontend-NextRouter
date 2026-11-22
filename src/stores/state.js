import { useAuthStore } from './useAuthStore.js'

// Ponte reativa compatível com o singleton legado enquanto os consumidores migram para useAuthStore().
export const state = new Proxy(
  {},
  {
    get(_, prop) {
      return useAuthStore()[prop]
    },
    set(_, prop, value) {
      useAuthStore()[prop] = value
      return true
    },
    has(_, prop) {
      return prop in useAuthStore()
    },
    ownKeys() {
      return Reflect.ownKeys(useAuthStore())
    },
    getOwnPropertyDescriptor(_, prop) {
      const store = useAuthStore()
      if (!(prop in store)) return undefined
      return { enumerable: true, configurable: true, value: store[prop] }
    },
  },
)
