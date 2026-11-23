import { ref, shallowRef } from 'vue'
import { useAuthStore } from '@/stores/useAuthStore'
import { loadMemberships } from '@/api/memberships'

/**
 * Busca o vínculo aberto e a empresa associada ao perfil ativo (`driver` ou `passenger`).
 */
export function useOpenMembershipSummary({ roleKey, scope }) {
  const auth = useAuthStore()
  const membershipLoaded = shallowRef(false)
  const openMembership = ref(null)
  const openCompany = ref(null)

  async function fetchMembershipStatus() {
    const profileId = auth.profiles?.[roleKey]?.id
    if (!profileId) {
      membershipLoaded.value = true
      return
    }
    try {
      const res = await loadMemberships({ [roleKey]: profileId }, { page: 1, signal: scope.signal })
      if (!scope.current()) return
      openMembership.value = res.openMembership
      openCompany.value = res.openCompany
    } catch {
      // Falha silenciosa: a tela de vínculos oferece diagnóstico detalhado
    } finally {
      if (scope.current()) membershipLoaded.value = true
    }
  }

  return {
    auth,
    membershipLoaded,
    openMembership,
    openCompany,
    fetchMembershipStatus,
  }
}
