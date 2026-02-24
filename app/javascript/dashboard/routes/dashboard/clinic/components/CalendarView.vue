<script setup>
import { ref, computed, onMounted } from 'vue';
import { useStore } from 'vuex';
import { DateTime, Info } from 'luxon';

const store = useStore();
const professionals = computed(() => store.getters['clinicScheduler/getProfessionals']);
const procedures_global = computed(() => store.getters['clinicScheduler/getProcedures']);
const appointments = computed(() => store.getters['clinicScheduler/getAppointments']);
const selectedProfessionalId = ref('all');
const currentWeek = ref(DateTime.now().startOf('week'));

const isCreatingAppointment = ref(false);
const newAppointment = ref({
  professional_id: null,
  procedure_id: null,
  start_datetime: null,
  patient_name: '',
  patient_phone: '',
});

const selectProfessional = (id) => {
  selectedProfessionalId.value = id;
};

const openAppointmentModal = (day, hour) => {
  let prof_id = selectedProfessionalId.value;
  if (prof_id === 'all') {
    prof_id = professionals.value.length > 0 ? professionals.value[0].id : null;
  }
  
  newAppointment.value = {
    professional_id: prof_id,
    procedure_id: null,
    start_datetime: day.set({ hour, minute: 0 }).toJSDate(),
    patient_name: '',
    patient_phone: '',
  };
  isCreatingAppointment.value = true;
};

const saveAppointment = async () => {
  // Logic to create hold + confirm
  try {
    // Only ISO string is valid for JSON persistence
    const isoDate = DateTime.fromJSDate(newAppointment.value.start_datetime).toISO();
    
    const hold = await store.dispatch('clinicScheduler/createHold', {
      professional_id: newAppointment.value.professional_id,
      procedure_id: newAppointment.value.procedure_id,
      start_datetime: isoDate,
    });
    
    await store.dispatch('clinicScheduler/confirmAppointment', {
      holdId: hold.id,
      data: {
        patient_name: newAppointment.value.patient_name,
        patient_phone: newAppointment.value.patient_phone,
      }
    });
    
    isCreatingAppointment.value = false;
  } catch (error) {
    alert('Erro ao criar agendamento: ' + error.message);
  }
};

const days = computed(() => {
  return [0, 1, 2, 3, 4, 5, 6].map(i => currentWeek.value.plus({ days: i }));
});

const hours = Array.from({ length: 14 }, (_, i) => i + 8); // 8:00 to 21:00

const procedures = computed(() => {
  if (!newAppointment.value.professional_id) return [];
  const prof = professionals.value.find(p => p.id === newAppointment.value.professional_id);
  return prof ? (prof.procedures || []) : [];
});

const professionalColors = [
  { id: 'blue', classes: 'bg-blue-100 dark:bg-blue-900/40 border-l-4 border-blue-500 text-blue-800 dark:text-blue-300' },
  { id: 'purple', classes: 'bg-purple-100 dark:bg-purple-900/40 border-l-4 border-purple-500 text-purple-800 dark:text-purple-300' },
  { id: 'pink', classes: 'bg-pink-100 dark:bg-pink-900/40 border-l-4 border-pink-500 text-pink-800 dark:text-pink-300' },
  { id: 'orange', classes: 'bg-orange-100 dark:bg-orange-900/40 border-l-4 border-orange-500 text-orange-800 dark:text-orange-300' },
  { id: 'green', classes: 'bg-green-100 dark:bg-green-900/40 border-l-4 border-green-500 text-green-800 dark:text-green-300' },
];

const getAppointmentColorClasses = (appt) => {
  const prof = professionals.value.find(p => p.id === appt.professional_id);
  const colorId = prof?.color || 'blue';
  return professionalColors.find(c => c.id === colorId)?.classes || professionalColors[0].classes;
};

const getProcedureDuration = (id) => {
  const proc = procedures_global.value.find(p => p.id === id);
  return proc ? proc.duration_minutes : 30;
};

const getProcedureName = (id) => {
  const proc = procedures_global.value.find(p => p.id === id);
  return proc ? proc.name : 'Procedimento';
};

const formatCurrency = (value) => {
  if (value === null || value === undefined || value === '') return '';
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
};

const getAppointmentsForDay = (day) => {
  return appointments.value.filter(a => {
    if (selectedProfessionalId.value !== 'all' && a.professional_id !== selectedProfessionalId.value) return false;
    // ensure date parses properly
    const apptDate = DateTime.fromISO(a.start_datetime);
    return apptDate.isValid && apptDate.hasSame(day, 'day');
  });
};

const getAppointmentStyle = (appt) => {
  const start = DateTime.fromISO(appt.start_datetime);
  if (!start.isValid) return { display: 'none' };

  const hourOffset = start.hour - 8;
  const minuteOffset = start.minute / 60;
  
  const top = (hourOffset + minuteOffset) * 80;
  
  const duration = getProcedureDuration(appt.procedure_id);
  const height = (duration / 60) * 80;
  
  return {
    top: `${Math.max(0, top)}px`,
    height: `${Math.max(20, height)}px` // minimum 20px height for visibility
  };
};

onMounted(() => {
  store.dispatch('clinicScheduler/fetchAppointments');
});
</script>

<template>
  <div class="flex flex-col h-full bg-white dark:bg-n-solid-1 relative">
    <!-- Modal de Agendamento -->
    <div v-if="isCreatingAppointment" class="absolute inset-0 z-[100] flex items-center justify-center p-6 bg-n-solid-1/50 backdrop-blur-sm">
      <div class="bg-white dark:bg-n-solid-2 w-full max-w-lg rounded-3xl shadow-2xl border border-n-weak dark:border-n-weak/50 overflow-hidden animate-in fade-in zoom-in duration-300">
        <header class="p-6 border-b border-n-weak dark:border-n-weak/50 flex justify-between items-center bg-n-slate-1 dark:bg-n-solid-3">
          <h3 class="text-xl font-bold text-n-slate-12">Novo Agendamento</h3>
          <button @click="isCreatingAppointment = false" class="p-2 hover:bg-n-weak rounded-xl transition-colors">
            <span class="i-lucide-x size-5" />
          </button>
        </header>

        <div class="p-8 space-y-6">
          <div class="grid grid-cols-2 gap-4">
            <div class="space-y-2">
              <label class="text-xs font-bold text-n-slate-10 uppercase">Profissional</label>
              <select v-model="newAppointment.professional_id" class="w-full p-3 bg-n-slate-1 dark:bg-n-solid-3 border border-n-weak rounded-xl text-sm outline-none">
                <option v-for="prof in professionals" :key="prof.id" :value="prof.id">{{ prof.name }}</option>
              </select>
            </div>
            <div class="space-y-2">
              <label class="text-xs font-bold text-n-slate-10 uppercase">Procedimento</label>
              <select v-model="newAppointment.procedure_id" class="w-full p-3 bg-n-slate-1 dark:bg-n-solid-3 border border-n-weak rounded-xl text-sm outline-none">
                <option value="" disabled selected>Selecione...</option>
                <option v-for="proc in procedures" :key="proc.id" :value="proc.id">
                  {{ proc.name }} ({{ proc.duration_minutes }} min) {{ formatCurrency(proc.price) ? ' - ' + formatCurrency(proc.price) : '' }}
                </option>
              </select>
            </div>
          </div>

          <div class="space-y-2">
            <label class="text-xs font-bold text-n-slate-10 uppercase">Data e Hora</label>
            <div class="p-3 bg-n-slate-3 dark:bg-n-solid-4 rounded-xl text-sm font-bold text-n-brand flex items-center gap-2">
              <span class="i-lucide-calendar size-4" />
              {{ DateTime.fromJSDate(newAppointment.start_datetime).toFormat('dd/MM/yyyy HH:mm') }}
            </div>
          </div>

          <div class="space-y-2">
            <label class="text-xs font-bold text-n-slate-10 uppercase">Informações do Paciente</label>
            <input v-model="newAppointment.patient_name" placeholder="Nome Completo" class="w-full p-3 bg-n-slate-1 dark:bg-n-solid-3 border border-n-weak rounded-xl text-sm outline-none" />
            <input v-model="newAppointment.patient_phone" placeholder="Telefone (WhatsApp)" class="w-full p-3 bg-n-slate-1 dark:bg-n-solid-3 border border-n-weak rounded-xl text-sm outline-none" />
          </div>

          <div class="pt-4 flex gap-3">
            <button @click="isCreatingAppointment = false" class="flex-1 py-3 text-sm font-bold text-n-slate-10 hover:bg-n-slate-1 rounded-2xl transition-colors">Cancelar</button>
            <button @click="saveAppointment" class="flex-1 py-3 text-sm font-bold bg-n-brand text-white rounded-2xl shadow-lg shadow-n-brand/20">Confirmar</button>
          </div>
        </div>
      </div>
    </div>

    <!-- Calendar Header -->
    <div class="p-4 border-b border-n-weak dark:border-n-weak/50 flex items-center justify-between bg-n-slate-1 dark:bg-n-solid-2">
      <div class="flex items-center gap-4">
        <div class="flex bg-white dark:bg-n-solid-3 p-1 rounded-xl shadow-sm border border-n-weak dark:border-n-weak/50">
          <button @click="currentWeek = currentWeek.minus({ weeks: 1 })" class="p-2 hover:bg-n-slate-1 dark:hover:bg-n-solid-3 rounded-lg">
            <span class="i-lucide-chevron-left size-4" />
          </button>
          <div class="px-4 py-2 text-sm font-bold text-n-slate-12">
            {{ currentWeek.toFormat('MMMM yyyy') }}
          </div>
          <button @click="currentWeek = currentWeek.plus({ weeks: 1 })" class="p-2 hover:bg-n-slate-1 dark:hover:bg-n-solid-3 rounded-lg">
            <span class="i-lucide-chevron-right size-4" />
          </button>
        </div>
        <button @click="currentWeek = DateTime.now().startOf('week')" class="text-xs font-bold text-n-brand px-3 py-2 hover:bg-n-brand/5 rounded-lg transition-colors">
          Hoje
        </button>
      </div>

      <div class="flex items-center gap-2 overflow-x-auto max-w-md no-scrollbar">
        <button
          @click="selectProfessional('all')"
          class="px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap border"
          :class="selectedProfessionalId === 'all' 
            ? 'bg-n-brand text-white border-n-brand shadow-lg shadow-n-brand/20' 
            : 'bg-white dark:bg-n-solid-3 text-n-slate-10 border-n-weak dark:border-n-weak/50 hover:border-n-brand/50'"
        >
          Todos
        </button>
        <button
          v-for="prof in professionals"
          :key="prof.id"
          @click="selectProfessional(prof.id)"
          class="px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap border flex items-center gap-2"
          :class="selectedProfessionalId === prof.id 
            ? 'bg-n-brand text-white border-n-brand shadow-lg shadow-n-brand/20' 
            : 'bg-white dark:bg-n-solid-3 text-n-slate-10 border-n-weak dark:border-n-weak/50 hover:border-n-brand/50'"
        >
          <span 
            class="size-2 rounded-full" 
            :class="`bg-${prof.color || 'blue'}-500`" 
            :style="`background-color: ${prof.color === 'purple' ? '#a855f7' : prof.color === 'pink' ? '#ec4899' : prof.color === 'orange' ? '#f97316' : prof.color === 'green' ? '#22c55e' : '#3b82f6'}`"
          />
          {{ prof.name }}
        </button>
      </div>
    </div>

    <!-- Calendar Grid -->
    <div class="flex-1 overflow-y-auto overflow-x-auto relative">
      <div class="min-w-[800px] flex h-full">
        <!-- Time Column -->
        <div class="w-20 border-r border-n-weak dark:border-n-weak/50 bg-n-slate-1 dark:bg-n-solid-2 sticky left-0 z-20">
          <div class="h-16 border-b border-n-weak dark:border-n-weak/50"></div>
          <div v-for="hour in hours" :key="hour" class="h-20 text-[10px] font-bold text-n-slate-8 text-center p-2">
            {{ hour }}:00
          </div>
        </div>

        <!-- Days Columns -->
        <div v-for="day in days" :key="day.toISODate()" class="flex-1 min-w-[120px] border-r border-n-weak dark:border-n-weak/50 group">
          <!-- Day Header -->
          <div 
            class="h-16 border-b border-n-weak dark:border-n-weak/50 p-3 flex flex-col items-center justify-center sticky top-0 bg-white dark:bg-n-solid-1 z-10"
            :class="{ 'bg-n-brand/5': day.hasSame(DateTime.now(), 'day') }"
          >
            <span class="text-[10px] font-bold text-n-slate-9 uppercase tracking-widest">{{ day.weekdayShort }}</span>
            <span class="text-lg font-bold" :class="day.hasSame(DateTime.now(), 'day') ? 'text-n-brand' : 'text-n-slate-12'">{{ day.day }}</span>
          </div>

          <!-- Time Slots -->
          <div class="relative h-[1120px]"> <!-- 14 hours * 80px -->
            <div 
              v-for="hour in hours" 
              :key="hour" 
              @click="openAppointmentModal(day, hour)"
              class="h-20 border-b border-n-weak/30 dark:border-n-weak/10 relative hover:bg-n-slate-1 dark:hover:bg-n-alpha-2 transition-colors cursor-crosshair group/slot"
            >
              <div class="absolute inset-0 flex items-center justify-center opacity-0 group-hover/slot:opacity-100 transition-opacity">
                <span class="i-lucide-plus-circle size-6 text-n-brand/50" />
              </div>
            </div>

            <!-- Actual Dynamic Data -->
            <div 
              v-for="appt in getAppointmentsForDay(day)"
              :key="appt.id"
              class="absolute left-1 right-1 rounded-lg p-2 shadow-sm animate-in fade-in zoom-in duration-300 overflow-hidden"
              :class="getAppointmentColorClasses(appt)"
              :style="getAppointmentStyle(appt)"
            >
              <div v-if="appt.status === 'confirmed'" class="h-full flex flex-col justify-between">
                <div>
                  <p class="text-[9px] font-bold uppercase leading-none mb-0.5 opacity-80">Confirmado</p>
                  <p class="font-bold text-[11px] leading-tight truncate">{{ appt.patient_name }}</p>
                </div>
                <!-- Only show proc if height allows -->
                <p v-if="getProcedureDuration(appt.procedure_id) >= 30" class="text-[9px] font-medium opacity-80 truncate">{{ getProcedureName(appt.procedure_id) }}</p>
              </div>

              <div v-else class="h-full opacity-60">
                <p class="text-[9px] font-bold uppercase leading-none mb-0.5 opacity-80">Hold</p>
                <p class="font-bold text-[11px] leading-tight truncate">Bloqueado</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.no-scrollbar::-webkit-scrollbar {
  display: none;
}
.no-scrollbar {
  -ms-overflow-style: none;
  scrollbar-width: none;
}
</style>
