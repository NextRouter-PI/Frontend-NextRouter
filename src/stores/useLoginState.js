import { http } from '@/api/client'
import { state } from '@/stores/state'
import { createAuthSession } from './session.js'

const session = createAuthSession({ state, http })
if (import.meta.hot) import.meta.hot.dispose(() => session.dispose())

export function useLoginState() { return session }
