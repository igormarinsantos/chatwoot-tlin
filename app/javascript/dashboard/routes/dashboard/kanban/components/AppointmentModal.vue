<script setup>
import { computed, ref, onMounted } from 'vue';
import { useStore } from 'vuex';
import { format } from 'date-fns';

const props = defineProps({
  initialDate: { type: Date, default: () => new Date() },
  appointment: { type: Object, default: null }
});

const emit = defineEmits(['close']);

const store = useStore();

// UI State
const dateOnly = ref('');
const timeOnly = ref('');
const selectedProfessional = ref('');
const selectedTeam = ref('');
const eventTitle = ref('');

const isEditing = computed(() => !!props.appointment);
const agents = computed(() => store.getters['agents/getAgents']);
const teams = computed(() => store.getters['teams/getTeams']);

onMounted(() => {
  if (props.appointment) {
    const appAt = props.appointment.customAttributes?.appointment_at;
    if (appAt) {
      const parsedDate = new Date(appAt);
      dateOnly.value = format(parsedDate, 'yyyy-MM-dd');
      timeOnly.value = format(parsedDate, 'HH:mm');
    }
    selectedProfessional.value = props.appointment.customAttributes?.appointment_professional || '';
    selectedTeam.value = props.appointment.customAttributes?.appointment_team || '';
    eventTitle.value = props.appointment.name;
  } else {
    dateOnly.value = format(props.initialDate, 'yyyy-MM-dd');
    timeOnly.value = format(new Date(), 'HH:mm');
  }
});

const saveAppointment = async () => {
  const combinedDateTime = `${dateOnly.value}T${timeOnly.value}`;
  
  if (!eventTitle.value) return;
  
  if (isEditing.value) {
    await store.dispatch('contacts/update', {
      id: props.appointment.id,
      name: eventTitle.value,
      customAttributes: {
        ...props.appointment.customAttributes,
        appointment_at: combinedDateTime,
        appointment_professional: selectedProfessional.value,
        appointment_team: selectedTeam.value,
        is_agenda_event: true,
      }
    });
  } else {
    await store.dispatch('contacts/create', {
      name: eventTitle.value,
      customAttributes: {
        appointment_at: combinedDateTime,
        appointment_professional: selectedProfessional.value,
        appointment_team: selectedTeam.value,
        is_agenda_event: true,
      }
    });
  }
  emit('close');
};

const deleteAppointment = async () => {
  if (!props.appointment) return;
  
  if (confirm('Tem certeza que deseja excluir este compromisso?')) {
    await store.dispatch('contacts/delete', props.appointment.id);
    emit('close');
  }
};
</script>

<template>
  <div class="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-n-slate-12/40 backdrop-blur-sm animate-in fade-in duration-200">
    <div class="bg-white dark:bg-n-solid-1 rounded-3xl w-full max-w-md shadow-2xl border border-n-weak dark:border-n-weak/50 overflow-hidden flex flex-col max-h-[90vh]">
      <header class="p-6 border-b border-n-weak dark:border-n-weak/50 flex justify-between items-center bg-n-slate-1 dark:bg-n-solid-2">
        <h3 class="text-lg font-bold text-n-slate-12">
          {{ isEditing ? 'Editar' : 'Novo' }} Compromisso de Equipe
        </h3>
        <button @click="emit('close')" class="p-2 hover:bg-n-alpha-1 rounded-xl transition-colors text-n-slate-10">
          <span class="i-lucide-x size-5" />
        </button>
      </header>

      <div class="p-6 space-y-5 overflow-y-auto">
        <!-- Date and Time Inputs -->
        <div class="grid grid-cols-2 gap-4">
          <div class="space-y-1">
            <label class="text-[10px] font-bold text-n-slate-9 uppercase tracking-wider">Data</label>
            <input 
              v-model="dateOnly" 
              type="date" 
              class="w-full px-4 py-3 bg-n-slate-1 dark:bg-n-solid-2 border border-n-weak rounded-xl focus:border-n-brand outline-none transition-colors text-n-slate-12 text-sm"
            />
          </div>
          <div class="space-y-1">
            <label class="text-[10px] font-bold text-n-slate-9 uppercase tracking-wider">Hora</label>
            <input 
              v-model="timeOnly" 
              type="time" 
              class="w-full px-4 py-3 bg-n-slate-1 dark:bg-n-solid-2 border border-n-weak rounded-xl focus:border-n-brand outline-none transition-colors text-n-slate-12 text-sm"
            />
          </div>
        </div>

        <div class="space-y-1">
          <label class="text-[10px] font-bold text-n-slate-9 uppercase tracking-wider">Título do Compromisso</label>
          <input 
            v-model="eventTitle" 
            type="text" 
            placeholder="Ex: Reunião Diária, Almoço de Equipe..."
            class="w-full px-4 py-3 bg-n-slate-1 dark:bg-n-solid-2 border border-n-weak rounded-xl focus:border-n-brand outline-none transition-colors text-n-slate-12 text-sm"
          />
        </div>

        <div class="grid grid-cols-2 gap-4">
          <div class="space-y-1">
            <label class="text-[10px] font-bold text-n-slate-9 uppercase tracking-wider">Equipe</label>
            <select 
              v-model="selectedTeam"
              class="w-full px-4 py-3 bg-n-slate-1 dark:bg-n-solid-2 border border-n-weak rounded-xl focus:border-n-brand outline-none transition-colors text-n-slate-12 text-sm"
            >
              <option value="">Nenhuma</option>
              <option v-for="team in teams" :key="team.id" :value="team.name">
                {{ team.name }}
              </option>
            </select>
          </div>
          <div class="space-y-1">
            <label class="text-[10px] font-bold text-n-slate-9 uppercase tracking-wider">Responsável</label>
            <select 
              v-model="selectedProfessional"
              class="w-full px-4 py-3 bg-n-slate-1 dark:bg-n-solid-2 border border-n-weak rounded-xl focus:border-n-brand outline-none transition-colors text-n-slate-12 text-sm"
            >
              <option value="">Nenhum</option>
              <option v-for="agent in agents" :key="agent.id" :value="agent.name">
                {{ agent.name }}
              </option>
            </select>
          </div>
        </div>
      </div>

      <footer class="p-6 bg-n-slate-1 dark:bg-n-solid-2 border-t border-n-weak dark:border-n-weak/50 flex gap-3">
        <button 
          v-if="isEditing"
          class="px-4 py-3 bg-ruby-1 text-ruby-9 font-bold rounded-2xl hover:bg-ruby-2 transition-all active:scale-95 border border-ruby-2"
          @click="deleteAppointment"
        >
          Excluir
        </button>
        <button 
          class="flex-1 py-3 bg-n-brand text-white font-bold rounded-2xl hover:bg-n-brand-strong transition-all shadow-lg shadow-n-brand/20 active:scale-95 disabled:opacity-50 disabled:active:scale-100"
          :disabled="!eventTitle || !dateOnly || !timeOnly"
          @click="saveAppointment"
        >
          {{ isEditing ? 'Salvar Alterações' : 'Confirmar' }}
        </button>
      </footer>
    </div>
  </div>
</template>
