<script setup>
import { computed } from 'vue'
import { useInputFormat } from '@/composables/useInputFormat'
import BaseButton from '@/components/ui/BaseButton.vue'

const props = defineProps({
  selectedId: { type: Number, default: null },
  selectedCompany: { type: Object, default: null },
  selectionLoading: { type: Boolean, default: false },
  role: { type: String, default: '' },
  userPhone: { type: String, default: '' },
  busy: { type: Boolean, default: false },
  canRequest: { type: Boolean, default: false },
  ready: { type: Boolean, default: false },
  openMembership: { type: Object, default: null },
})

const selectedGroupId = defineModel('selectedGroupId', { type: String, default: '' })
const emit = defineEmits(['submit'])

const { formatPhone } = useInputFormat()
const profilePhoneFormatted = computed(() => formatPhone(props.userPhone || ''))
</script>

<template>
  <section class="membership-panel" aria-label="Revisão de solicitação">
    <h2>Revisar solicitação</h2>
    <p v-if="!selectedId">Identificador de empresa inválido. Escolha uma empresa na busca.</p>
    <p v-else-if="selectionLoading" role="status">Consultando a empresa selecionada...</p>
    <template v-if="selectedCompany">
      <h3>{{ selectedCompany.trade_name }} · empresa nº {{ selectedCompany.id }}</h3>
      <div v-if="role === 'passenger' && selectedCompany.route_groups?.length" class="membership-filters">
        <label>
          Grupo de rota desejado
          <select v-model="selectedGroupId" class="membership-select" :disabled="busy">
            <option value="">Sem grupo específico</option>
            <option v-for="group in selectedCompany.route_groups" :key="group.id" :value="String(group.id)">
              {{ group.name }}{{ group.city ? ` (${group.city}/${group.state})` : '' }}
            </option>
          </select>
        </label>
      </div>
      <p class="membership-phone-hint">
        Telefone enviado do seu perfil:
        <strong>{{ profilePhoneFormatted || 'não informado (você pode preencher em Meu Perfil)' }}</strong>
      </p>
      <p>
        Enviar como {{ role === 'driver' ? 'motorista' : 'passageiro' }}.
        <template v-if="role === 'passenger' && selectedGroupId">
          Ao ser aprovado pela empresa, você será adicionado automaticamente ao grupo de rota escolhido.
        </template>
        <template v-else>
          O pedido depende da decisão da empresa e não altera sua conta.
        </template>
      </p>
      <BaseButton
        type="button"
        :disabled="!canRequest || selectionLoading"
        :loading="busy"
        @click="emit('submit')"
      >
        Enviar pedido de vínculo
      </BaseButton>
      <p v-if="ready && openMembership">Já existe um pedido pendente ou vínculo ativo. Nenhuma troca automática será realizada.</p>
    </template>
  </section>
</template>
