import { useRouter } from 'vue-router'
import { useLoginState } from '@/store/useLoginState'


const router = useRouter()


const { logout } = useLoginState()


export function useLogout() {
  function handleLogout() {
    logout()
    router.push('/login')
  }

  return { handleLogout }
}
