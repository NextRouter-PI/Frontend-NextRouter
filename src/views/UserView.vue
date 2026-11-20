<script setup>
import { ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import { state } from '@/stores/state'
import '@/assets/css/profile.css'

const route = useRoute()
const tabTransition = ref('account-tab-left')

const tabOrder = {
  'usuario-profile': 0,
  'usuario-security': 1,
}

watch(
  () => route.name,
  (next, prev) => {
    const nextIdx = tabOrder[next] ?? 0
    const prevIdx = tabOrder[prev] ?? 0
    tabTransition.value = nextIdx >= prevIdx ? 'account-tab-left' : 'account-tab-right'
  },
)
</script>

<template>
  <div class="account-workspace" :class="{ authenticated: state.logged }">
    <div class="account-content">
      <nav class="account-tabs" aria-label="Seções da conta">
        <RouterLink to="/usuario/profile" class="account-tab-link">
          <span class="mdi mdi-account-outline" aria-hidden="true"></span>
          <span>Perfil</span>
        </RouterLink>
        <RouterLink to="/usuario/security" class="account-tab-link">
          <span class="mdi mdi-shield-lock-outline" aria-hidden="true"></span>
          <span>Segurança</span>
        </RouterLink>
      </nav>

      <div class="account-tab-stage">
        <router-view v-slot="{ Component }">
          <Transition :name="tabTransition" mode="out-in">
            <component :is="Component" />
          </Transition>
        </router-view>
      </div>
    </div>
  </div>
</template>

<style scoped>
.account-tabs {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 8px;
  padding: 6px;
  margin-bottom: 18px;
  background: var(--superfice);
  border: 1px solid var(--border);
  border-radius: 14px;
}

.account-tab-link {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 10px 14px;
  border-radius: 10px;
  color: var(--text-muted);
  font-weight: 600;
  font-size: 0.94rem;
  text-decoration: none;
  transition: background-color 0.25s ease, color 0.25s ease, box-shadow 0.25s ease;
}

.account-tab-link .mdi {
  font-size: 1.15rem;
}

.account-tab-link:hover {
  color: var(--text);
}

.account-tab-link.router-link-active {
  background: var(--gradient-primary);
  color: #ffffff;
  box-shadow: var(--shadow-primary);
}

.account-tab-stage {
  overflow-x: hidden;
}

.account-tab-left-enter-active,
.account-tab-left-leave-active,
.account-tab-right-enter-active,
.account-tab-right-leave-active {
  transition: opacity 0.24s ease, transform 0.24s ease;
}

.account-tab-left-enter-from {
  opacity: 0;
  transform: translateX(22px);
}

.account-tab-left-leave-to {
  opacity: 0;
  transform: translateX(-22px);
}

.account-tab-right-enter-from {
  opacity: 0;
  transform: translateX(-22px);
}

.account-tab-right-leave-to {
  opacity: 0;
  transform: translateX(22px);
}
</style>
