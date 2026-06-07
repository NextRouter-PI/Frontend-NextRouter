import { useRouter } from 'vue-router'
import { useLoginState } from '@/store/useLoginState'





export function useLogout() {
  const router = useRouter()
  const { logout } = useLoginState()
  function handleLogout() {
    logout()
    router.push('/login')
  }

  return { handleLogout }
}
