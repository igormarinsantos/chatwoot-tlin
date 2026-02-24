<script setup>
import { ref, computed, onMounted } from 'vue';
import { useStore } from 'vuex';
import { DateTime, Info } from 'luxon';

const store = useStore();
const professionals = computed(() => store.getters['clinicScheduler/getProfessionals']);
const selectedProfessionalId = ref(null);
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
  newAppointment.value = {
    professional_id: selectedProfessionalId.value,
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
    const hold = await store.dispatch('clinicScheduler/createHold', {
      professional_id: newAppointment.value.professional_id,
      procedure_id: newAppointment.value.procedure_id,
      start_datetime: newAppointment.value.start_datetime,
    });
    
    await store.dispatch('clinicScheduler/confirmAppointment', {
      holdId: hold.id,
      data: {
        patient_name: newAppointment.value.patient_name,
        patient_phone: newAppointment.value.patient_phone,
      }
    });
    
    isCreatingAppointment.value = false;
    store.dispatch('clinicScheduler/fetchAppointments');
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
  return prof ? prof.procedures : [];
});

onMounted(() => {
  if (professionals.value.length > 0) {
    selectedProfessionalId.value = professionals.value[0].id;
  }
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
                <option v-for="proc in procedures" :key="proc.id" :value="proc.id">{{ proc.name }} ({{ proc.duration_minutes }} min)</option>
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
          v-for="prof in professionals"
          :key="prof.id"
          @click="selectProfessional(prof.id)"
          class="px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap border"
          :class="selectedProfessionalId === prof.id 
            ? 'bg-n-brand text-white border-n-brand shadow-lg shadow-n-brand/20' 
            : 'bg-white dark:bg-n-solid-3 text-n-slate-10 border-n-weak dark:border-n-weak/50 hover:border-n-brand/50'"
        >
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

            <!-- Fake Data for UI Demonstration -->
            <div 
              v-if="day.weekday === 2"
              class="absolute top-[160px] left-1 right-1 h-36 bg-n-brand/10 border-l-4 border-n-brand rounded-lg p-2 shadow-sm animate-in fade-in zoom-in duration-300"
            >
              <p class="text-[10px] font-bold text-n-brand uppercase leading-none mb-1">Confirmado</p>
              <p class="font-bold text-n-slate-12 text-[11px] leading-tight">Maria Silva</p>
              <p class="text-[9px] text-n-slate-10 font-medium">Limpeza Dental</p>
            </div>

            <div 
              v-if="day.weekday === 4"
              class="absolute top-[400px] left-1 right-1 h-20 bg-amber-500/10 border-l-4 border-amber-500 rounded-lg p-2 shadow-sm"
            >
              <p class="text-[10px] font-bold text-amber-600 uppercase leading-none mb-1">Hold</p>
              <p class="font-bold text-n-slate-12 text-[11px] leading-tight">João Santos</p>
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
