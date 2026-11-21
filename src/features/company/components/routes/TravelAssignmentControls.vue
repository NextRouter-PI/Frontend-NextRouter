<script setup>
import { reactive, shallowRef } from 'vue'
import BaseButton from '@/components/ui/BaseButton.vue'

const props = defineProps({
  travel: { type: Object, required: true },
  veiculosAtivos: { type: Array, required: true },
  motoristasAtivos: { type: Array, required: true },
  busy: { type: Boolean, default: false },
})

const emit = defineEmits(['assign-vehicle', 'invite-driver'])
const veiculoSubstituto = shallowRef('')
const convite = reactive({ driverMembershipId: '', expiresAt: '' })

function submitVehicle() {
  if (!veiculoSubstituto.value) return
  emit('assign-vehicle', {
    travel: props.travel,
    vehicleId: veiculoSubstituto.value,
    onSuccess: () => {
      veiculoSubstituto.value = ''
    },
  })
}

function submitInvite() {
  emit('invite-driver', {
    travel: props.travel,
    driverMembershipId: convite.driverMembershipId,
    expiresAt: convite.expiresAt,
    onSuccess: () => {
      convite.driverMembershipId = ''
      convite.expiresAt = ''
    },
  })
}
</script>

<template>
  <div class="sub-actions">
    <div class="op-grid">
      <select v-model="veiculoSubstituto" :disabled="busy">
        <option value="">Substituir veículo...</option>
        <option v-for="v in veiculosAtivos" :key="v.id" :value="v.id">
          {{ v.plate }} ({{ v.capacity }} lug.)
        </option>
      </select>
      <BaseButton variant="outline" size="sm" :disabled="busy" @click="submitVehicle">
        Designar veículo
      </BaseButton>
    </div>

    <div class="op-grid">
      <select v-model="convite.driverMembershipId" :disabled="busy">
        <option value="">Convidar motorista substituto...</option>
        <option v-for="m in motoristasAtivos" :key="m.id" :value="m.id">
          {{ m.applicant_name }} (vínculo #{{ m.id }})
        </option>
      </select>
      <input v-model="convite.expiresAt" type="datetime-local" :disabled="busy" aria-label="Prazo do convite" />
      <BaseButton variant="outline" size="sm" :disabled="busy" @click="submitInvite">
        Convidar motorista
      </BaseButton>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.sub-actions {
  display: flex;
  flex-direction: column;
  gap: $space-2;
}

.op-grid {
  display: flex;
  flex-wrap: wrap;
  gap: $space-2;
  align-items: center;

  input,
  select {
    flex: 1 1 160px;
    padding: 9px $space-3;
    border-radius: $radius-sm;
    background: var(--color-surface);
    outline: 1.5px solid var(--border);
    outline-offset: -1.5px;
    color: var(--text);
    font-size: $text-sm;
  }
}
</style>
