<script setup>
import { ref, computed, onMounted } from 'vue';
import { useStore } from 'vuex';
import { DateTime } from 'luxon';

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
  try {
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
  { id: 'blue', classes: 'bg-[#1e3a8a] text-blue-300 border-blue-500', hex: '#3b82f6' },
  { id: 'purple', classes: 'bg-[#4c1d95] text-purple-300 border-purple-500', hex: '#a855f7' },
  { id: 'pink', classes: 'bg-[#831843] text-pink-300 border-pink-500', hex: '#ec4899' },
  { id: 'orange', classes: 'bg-[#7c2d12] text-orange-300 border-orange-500', hex: '#f97316' },
  { id: 'green', classes: 'bg-[#14532d] text-green-300 border-green-500', hex: '#22c55e' },
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
    const apptDate = DateTime.fromISO(a.start_datetime);
    return apptDate.isValid && apptDate.hasSame(day, 'day');
  });
};

const getAppointmentStyle = (appt) => {
  const start = DateTime.fromISO(appt.start_datetime);
  if (!start.isValid) return { display: 'none' };

  const hourOffset = start.hour - 8;
  const minuteOffset = start.minute / 60;
  
  const top = (hourOffset + minuteOffset) * 80; // 80px per hour
  const duration = getProcedureDuration(appt.procedure_id);
  const height = (duration / 60) * 80;
  
  return {
    top: `${Math.max(0, top)}px`,
    height: `${Math.max(20, height)}px`
  };
};

onMounted(() => {
  store.dispatch('clinicScheduler/fetchAppointments');
});
</script>

<template>
  <div class="flex flex-col h-full bg-[#111115] relative overflow-hidden rounded-bl-xl rounded-br-xl">
    
    <!-- Header Controls -->
    <div class="p-4 border-b border-[#26262F] flex items-center justify-between">
      <div class="flex items-center gap-4">
        <div class="flex items-center bg-[#18181E] rounded-lg border border-[#26262F] p-1">
          <button @click="currentWeek = currentWeek.minus({ weeks: 1 })" class="p-1.5 hover:bg-[#26262F] rounded text-white transition-colors">
            <span class="i-lucide-chevron-left w-4 h-4" />
          </button>
          <div class="px-3 py-1 text-xs font-semibold text-white min-w-[120px] text-center">
            {{ currentWeek.toFormat('MMMM yyyy') }}
          </div>
          <button @click="currentWeek = currentWeek.plus({ weeks: 1 })" class="p-1.5 hover:bg-[#26262F] rounded text-white transition-colors">
            <span class="i-lucide-chevron-right w-4 h-4" />
          </button>
        </div>
        <button @click="currentWeek = DateTime.now().startOf('week')" class="text-xs font-bold text-[#B597FF] hover:underline">
          Hoje
        </button>
      </div>

      <div class="flex items-center gap-2 overflow-x-auto no-scrollbar max-w-[50%]">
        <button
          @click="selectProfessional('all')"
          class="px-4 py-1.5 rounded-full text-xs font-semibold transition-all"
          :class="selectedProfessionalId === 'all' 
            ? 'bg-[#B597FF] text-white' 
            : 'bg-[#18181E] text-[#8B8B9B] border border-[#26262F] hover:text-white'"
        >
          Todos
        </button>
        <button
          v-for="prof in professionals"
          :key="prof.id"
          @click="selectProfessional(prof.id)"
          class="px-3 py-1.5 rounded-full text-xs font-medium transition-all flex items-center gap-2 border"
          :class="selectedProfessionalId === prof.id 
            ? 'bg-[#1F1F27] text-white border-[#26262F]' 
            : 'bg-[#111115] text-[#8B8B9B] border-transparent hover:text-white'"
        >
          <span 
            class="w-2 h-2 rounded-full" 
            :style="{ backgroundColor: professionalColors.find(c => c.id === (prof.color || 'blue'))?.hex }"
          />
          {{ prof.name }}
        </button>
      </div>
    </div>

    <!-- Calendar Grid -->
    <div class="flex-1 overflow-y-auto overflow-x-auto custom-scrollbar relative bg-[#111115]">
      <div class="min-w-[800px] flex h-full">
        <!-- Time Axis -->
        <div class="w-16 border-r border-[#26262F] bg-[#111115] sticky left-0 z-20">
          <div class="h-16 border-b border-[#26262F]"></div>
          <div v-for="hour in hours" :key="hour" class="h-[80px] text-[10px] font-medium text-[#6C6C7D] text-center pt-2">
            {{ hour }}:00
          </div>
        </div>

        <!-- Days Columns -->
        <div v-for="day in days" :key="day.toISODate()" class="flex-1 min-w-[120px] border-r border-[#26262F] relative group">
          <!-- Day Header -->
          <div 
            class="h-16 border-b border-[#26262F] p-2 flex flex-col items-center justify-center sticky top-0 bg-[#111115] z-10"
          >
            <span class="text-[10px] font-bold text-[#8B8B9B] uppercase tracking-wider mb-1">{{ day.weekdayShort }}</span>
            <span class="text-sm font-bold" :class="day.hasSame(DateTime.now(), 'day') ? 'text-[#B597FF]' : 'text-white'">{{ day.day }}</span>
          </div>

          <!-- Slots -->
          <div class="relative h-[1120px]">
            <div 
              v-for="hour in hours" 
              :key="hour" 
              @click="openAppointmentModal(day, hour)"
              class="h-[80px] border-b border-[#26262F] hover:bg-[#18181E] transition-colors cursor-crosshair"
            ></div>

            <!-- Appointments -->
            <div 
              v-for="appt in getAppointmentsForDay(day)"
              :key="appt.id"
              class="absolute left-1 right-2 rounded-md p-2 shadow-lg overflow-hidden border-l-4 opacity-95 hover:opacity-100 transition-opacity"
              :class="getAppointmentColorClasses(appt)"
              :style="getAppointmentStyle(appt)"
            >
              <div v-if="appt.status === 'confirmed'" class="h-full flex flex-col justify-start">
                <p class="text-[8px] font-bold uppercase tracking-wider opacity-75 mb-0.5">Confirmado</p>
                <p class="font-bold text-xs leading-tight truncate text-white">{{ appt.patient_name }}</p>
                <p v-if="getProcedureDuration(appt.procedure_id) >= 30" class="text-[10px] opacity-90 truncate mt-1 text-gray-200">
                  {{ getProcedureName(appt.procedure_id) }}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Creation Modal -->
    <div v-if="isCreatingAppointment" class="absolute inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div class="bg-[#18181E] border border-[#26262F] w-full max-w-md rounded-2xl shadow-2xl overflow-hidden shadow-[#B597FF]/10">
        <div class="p-5 border-b border-[#26262F] flex justify-between items-center">
          <h3 class="text-white font-semibold">Novo Agendamento</h3>
          <button @click="isCreatingAppointment = false" class="text-[#8B8B9B] hover:text-white transition-colors">
            <span class="i-lucide-x w-5 h-5" />
          </button>
        </div>
        <div class="p-5 space-y-4">
          <div class="space-y-1.5">
            <label class="text-xs text-[#8B8B9B]">Profissional</label>
            <select v-model="newAppointment.professional_id" class="w-full px-3 py-2.5 bg-[#111115] border border-[#26262F] rounded-lg text-white font-medium text-sm outline-none focus:border-[#B597FF]">
              <option v-for="prof in professionals" :key="prof.id" :value="prof.id">{{ prof.name }}</option>
            </select>
          </div>
          <div class="space-y-1.5">
            <label class="text-xs text-[#8B8B9B]">Procedimento</label>
            <select v-model="newAppointment.procedure_id" class="w-full px-3 py-2.5 bg-[#111115] border border-[#26262F] rounded-lg text-white font-medium text-sm outline-none focus:border-[#B597FF]">
              <option value="" disabled selected>Selecione...</option>
              <option v-for="proc in procedures" :key="proc.id" :value="proc.id">
                {{ proc.name }} ({{ proc.duration_minutes }} min) {{ formatCurrency(proc.price) ? ' - ' + formatCurrency(proc.price) : '' }}
              </option>
            </select>
          </div>
          
          <div class="grid grid-cols-2 gap-3 pt-2 border-t border-[#26262F]">
            <div class="space-y-1.5">
              <label class="text-xs text-[#8B8B9B]">Nome do Paciente</label>
              <input v-model="newAppointment.patient_name" class="w-full px-3 py-2 bg-[#111115] border border-[#26262F] rounded-lg text-white text-sm outline-none focus:border-[#B597FF]" />
            </div>
            <div class="space-y-1.5">
              <label class="text-xs text-[#8B8B9B]">Telefone (WhatsApp)</label>
              <input v-model="newAppointment.patient_phone" class="w-full px-3 py-2 bg-[#111115] border border-[#26262F] rounded-lg text-white text-sm outline-none focus:border-[#B597FF]" />
            </div>
          </div>

          <div class="flex items-center gap-3 pt-4">
            <button @click="isCreatingAppointment = false" class="text-[#8B8B9B] hover:text-white px-4 py-2 text-sm font-medium">Cancelar</button>
            <button @click="saveAppointment" class="flex-1 bg-[#B597FF] hover:bg-[#9d7cf0] text-white py-2.5 rounded-lg text-sm font-semibold transition-colors">Confirmar</button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.custom-scrollbar::-webkit-scrollbar {
  width: 6px;
  height: 6px;
}
.custom-scrollbar::-webkit-scrollbar-track {
  background: transparent;
}
.custom-scrollbar::-webkit-scrollbar-thumb {
  background: #26262F;
  border-radius: 6px;
}
.no-scrollbar::-webkit-scrollbar {
  display: none;
}
.no-scrollbar {
  -ms-overflow-style: none;
  scrollbar-width: none;
}
</style>
