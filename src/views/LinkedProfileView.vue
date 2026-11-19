<script setup>
import { computed, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import { state } from '@/stores/state'
import api from '@/api/client'
import { sessionError } from '@/stores/session'
import { formatApiError } from '@/utils/apiErrors'
import BaseButton from '@/components/ui/BaseButton.vue'
import ErrorMessage from '@/components/ui/ErrorMessage.vue'
import '@/assets/css/profile.css'

const route = useRoute()
const driver = computed(() => route.name === 'usuario-motorista')
const profile = ref(null)
const loading = ref(false)
const error = ref('')
const reload = ref(0)
watch([() => route.params.id, driver, () => `${state.logged}:${state.role}:${state.user?.id}`, reload], async (_value, _old, onCleanup) => {
  profile.value = null
  error.value = ''
  loading.value = false
  if (!state.logged || state.role !== 'company') return
  const id = String(route.params.id)
  if (!/^[1-9]\d*$/.test(id) || !Number.isSafeInteger(Number(id))) {
    error.value = 'Identificador de perfil inválido.'
    return
  }
  const controller = new AbortController()
  onCleanup(() => controller.abort())
  loading.value = true
  try {
    const { data } = await api.get(`/${driver.value ? 'drivers' : 'passengers'}/${id}/`, { signal: controller.signal })
    if (!controller.signal.aborted) {
      profile.value = { id: data.id, name: data.user_data?.name, average: data.average_rating, ratings: data.ratings_count }
    }
  } catch (cause) {
    if (!controller.signal.aborted) error.value = sessionError(cause, formatApiError(cause, 'O perfil não está disponível para esta empresa.'))
  } finally {
    if (!controller.signal.aborted) loading.value = false
  }
}, { immediate: true, flush: 'sync' })
</script>

<template>
  <div class="account-workspace" :class="{ authenticated: state.logged }">
    <div class="account-content">
      <h1>Identidade do titular vinculado</h1>
      <RouterLink to="/usuarios" class="account-link">Voltar aos vínculos da empresa</RouterLink>
      <p>Esta consulta não fornece CPF, endereço, contato ou CNH. Ausência desses campos é uma restrição de acesso, não falta de cadastro.</p>
      <p v-if="loading" role="status">Consultando perfil autorizado...</p>
      <div role="alert"><ErrorMessage :message="error" /></div>
      <section v-if="profile" class="account-section">
        <h2>{{ profile.name || 'Nome não disponível' }}</h2>
        <p>{{ driver ? 'Motorista' : 'Passageiro' }} · perfil nº {{ profile.id }}</p>
        <p v-if="driver && profile.ratings != null">{{ profile.ratings }} avaliações · média {{ profile.average ?? 'não disponível' }}</p>
      </section>
      <BaseButton v-if="state.role === 'company'" type="button" variant="outline" :disabled="loading" @click="reload++">Atualizar consulta</BaseButton>
      <p v-else>Somente uma empresa autorizada pode consultar esta tela.</p>
    </div>
  </div>
</template>
