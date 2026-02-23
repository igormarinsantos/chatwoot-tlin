<script setup>
import { computed, ref, onMounted } from 'vue';
import { useStore } from 'vuex';
import { format, parseISO } from 'date-fns';

const props = defineProps({
  initialDate: { type: Date, default: () => new Date() },
  appointment: { type: Object, default: null }
});

const emit = defineEmits(['close']);

const store = useStore();

// UI State
const dateOnly = ref('');
const timeOnly = ref('');
const selectedLeadId = ref(null);
const selectedProfessional = ref('');
const selectedTeam = ref('');
const eventType = ref('appointment'); // 'appointment' or 'event'
const eventTitle = ref('');

const isEditing = computed(() => !!props.appointment);
const leads = computed(() => store.getters['contacts/getContactsList']);
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
    eventType.value = props.appointment.customAttributes?.is_agenda_event ? 'event' : 'appointment';
    
    if (eventType.value === 'appointment') {
      selectedLeadId.value = props.appointment.id;
    } else {
      eventTitle.value = props.appointment.name;
    }
  } else {
    dateOnly.value = format(props.initialDate, 'yyyy-MM-dd');
    timeOnly.value = format(new Date(), 'HH:mm');
  }
});

const saveAppointment = async () => {
  const combinedDateTime = `${dateOnly.value}T${timeOnly.value}`;
  
  if (eventType.value === 'appointment') {
    if (!selectedLeadId.value) return;
    const lead = leads.value.find(l => l.id === selectedLeadId.value);
    await store.dispatch('contacts/update', {
      id: selectedLeadId.value,
      customAttributes: {
        ...(lead?.customAttributes || {}),
        appointment_at: combinedDateTime,
        appointment_professional: selectedProfessional.value,
        appointment_team: selectedTeam.value,
        is_agenda_event: false
      },
    });
  } else {
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
  }
  emit('close');
};

const deleteAppointment = async () => {
  if (!props.appointment) return;
  
  if (confirm('Tem certeza que deseja excluir este agendamento?')) {
    if (eventType.value === 'event') {
      // For general events, we delete the "Contact" that represents it
      await store.dispatch('contacts/delete', props.appointment.id);
    } else {
      // For leads, we just clear the appointment attributes
      await store.dispatch('contacts/update', {
        id: props.appointment.id,
        customAttributes: {
          ...props.appointment.customAttributes,
          appointment_at: null,
          appointment_professional: null,
          appointment_team: null,
        }
      });
    }
    emit('close');
  }
};
</script>

<template>
  <div class="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-n-slate-12/40 backdrop-blur-sm animate-in fade-in duration-200">
    <div class="bg-white dark:bg-n-solid-1 rounded-3xl w-full max-w-md shadow-2xl border border-n-weak dark:border-n-weak/50 overflow-hidden flex flex-col max-h-[90vh]">
      <header class="p-6 border-b border-n-weak dark:border-n-weak/50 flex justify-between items-center bg-n-slate-1 dark:bg-n-solid-2">
        <h3 class="text-lg font-bold text-n-slate-12">
          {{ isEditing ? 'Editar' : 'Agendar' }} {{ eventType === 'appointment' ? 'Consulta' : 'Evento' }}
        </h3>
        <button @click="emit('close')" class="p-2 hover:bg-n-alpha-1 rounded-xl transition-colors text-n-slate-10">
          <span class="i-lucide-x size-5" />
        </button>
      </header>

      <div class="p-6 space-y-5 overflow-y-auto">
        <!-- Event Type Toggle (Only if not editing) -->
        <div v-if="!isEditing" class="flex bg-n-slate-1 dark:bg-n-solid-2 p-1 rounded-2xl border border-n-weak">
          <button 
            class="flex-1 py-2 text-xs font-bold rounded-xl transition-all"
            :class="eventType === 'appointment' ? 'bg-n-brand text-white shadow-lg shadow-n-brand/20' : 'text-n-slate-10 hover:text-n-slate-12'"
            @click="eventType = 'appointment'"
          >
            Consulta (Lead)
          </button>
          <button 
            class="flex-1 py-2 text-xs font-bold rounded-xl transition-all"
            :class="eventType === 'event' ? 'bg-n-brand text-white shadow-lg shadow-n-brand/20' : 'text-n-slate-10 hover:text-n-slate-12'"
            @click="eventType = 'event'"
          >
            Evento Geral
          </button>
        </div>

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

        <div v-if="eventType === 'appointment'" class="space-y-1">
          <label class="text-[10px] font-bold text-n-slate-9 uppercase tracking-wider">Lead</label>
          <select 
            v-model="selectedLeadId"
            :disabled="isEditing"
            class="w-full px-4 py-3 bg-n-slate-1 dark:bg-n-solid-2 border border-n-weak rounded-xl focus:border-n-brand outline-none transition-colors text-n-slate-12 text-sm disabled:opacity-50"
          >
            <option :value="null">Selecione um lead...</option>
            <option v-for="lead in leads" :key="lead.id" :value="lead.id">
              {{ lead.name || lead.email || 'Lead sem nome' }}
            </option>
          </select>
        </div>

        <div v-else class="space-y-1">
          <label class="text-[10px] font-bold text-n-slate-9 uppercase tracking-wider">Título do Evento</label>
          <input 
            v-model="eventTitle" 
            type="text" 
            placeholder="Ex: Almoço, Reunião Interna..."
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
          :disabled="(eventType === 'appointment' && !selectedLeadId) || (eventType === 'event' && !eventTitle) || !dateOnly || !timeOnly"
          @click="saveAppointment"
        >
          {{ isEditing ? 'Salvar Alterações' : 'Confirmar' }}
        </button>
      </footer>
    </div>
  </div>
</template>
