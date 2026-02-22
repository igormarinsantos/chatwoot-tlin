<script setup>
import { computed, ref } from 'vue';
import { useStore } from 'vuex';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const props = defineProps({
  initialDate: { type: Date, default: () => new Date() }
});

const emit = defineEmits(['close']);

const store = useStore();
const date = ref(format(props.initialDate, "yyyy-MM-dd'T'HH:mm"));
const selectedLeadId = ref(null);
const selectedProfessional = ref('');

const leads = computed(() => store.getters['contacts/getContactsList']);
const agents = computed(() => store.getters['agents/getAgents']);

const saveAppointment = async () => {
  if (!selectedLeadId.value) return;

  const lead = leads.value.find(l => l.id === selectedLeadId.value);
  await store.dispatch('contacts/update', {
    id: selectedLeadId.value,
    customAttributes: {
      ...lead.customAttributes,
      appointment_at: date.value,
      appointment_professional: selectedProfessional.value,
    },
  });
  emit('close');
};
</script>

<template>
  <div class="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-n-slate-12/40 backdrop-blur-sm animate-in fade-in duration-200">
    <div class="bg-white dark:bg-n-solid-1 rounded-3xl w-full max-w-md shadow-2xl border border-n-weak dark:border-n-weak/50 overflow-hidden flex flex-col max-h-[90vh]">
      <header class="p-6 border-b border-n-weak dark:border-n-weak/50 flex justify-between items-center bg-n-slate-1 dark:bg-n-solid-2">
        <h3 class="text-lg font-bold text-n-slate-12">Agendar Consulta</h3>
        <button @click="emit('close')" class="p-2 hover:bg-n-alpha-1 rounded-xl transition-colors text-n-slate-10">
          <span class="i-lucide-x size-5" />
        </button>
      </header>

      <div class="p-6 space-y-5 overflow-y-auto">
        <div class="space-y-1">
          <label class="text-sm font-bold text-n-slate-11">Data e Hora</label>
          <input 
            v-model="date" 
            type="datetime-local" 
            class="w-full px-4 py-3 bg-white dark:bg-n-solid-2 border border-n-weak rounded-xl focus:border-n-brand outline-none transition-colors text-n-slate-12"
          />
        </div>

        <div class="space-y-1">
          <label class="text-sm font-bold text-n-slate-11">Selecionar Lead</label>
          <select 
            v-model="selectedLeadId"
            class="w-full px-4 py-3 bg-white dark:bg-n-solid-2 border border-n-weak rounded-xl focus:border-n-brand outline-none transition-colors text-n-slate-12"
          >
            <option :value="null">Selecione um lead...</option>
            <option v-for="lead in leads" :key="lead.id" :value="lead.id">
              {{ lead.name || lead.email || 'Lead sem nome' }}
            </option>
          </select>
        </div>

        <div class="space-y-1">
          <label class="text-sm font-bold text-n-slate-11">Profissional Responsável</label>
          <select 
            v-model="selectedProfessional"
            class="w-full px-4 py-3 bg-white dark:bg-n-solid-2 border border-n-weak rounded-xl focus:border-n-brand outline-none transition-colors text-n-slate-12"
          >
            <option value="">Selecione um profissional...</option>
            <option v-for="agent in agents" :key="agent.id" :value="agent.name">
              {{ agent.name }}
            </option>
          </select>
        </div>
      </div>

      <footer class="p-6 bg-n-slate-1 dark:bg-n-solid-2 border-t border-n-weak dark:border-n-weak/50 flex gap-3">
        <button 
          class="flex-1 py-3 bg-n-brand text-white font-bold rounded-2xl hover:bg-n-brand-strong transition-all shadow-lg shadow-n-brand/20 active:scale-95 disabled:opacity-50 disabled:active:scale-100"
          :disabled="!selectedLeadId || !date"
          @click="saveAppointment"
        >
          Confirmar Agendamento
        </button>
      </footer>
    </div>
  </div>
</template>
