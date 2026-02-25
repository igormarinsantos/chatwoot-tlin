<script setup>
import { ref, computed, onMounted } from 'vue';
import { useStore } from 'vuex';
import { DateTime, Info } from 'luxon';

const store = useStore();
const professionals = computed(() => store.getters['clinicScheduler/getProfessionals']);
const procedures_global = computed(() => store.getters['clinicScheduler/getProcedures']);
const appointments = computed(() => store.getters['clinicScheduler/getAppointments']);
const selectedProfessionalId = ref('all');
const currentDate = ref(DateTime.now());
const viewMode = ref('week'); // 'day', '3days', 'week'

const selectedAppointment = ref(null);
const isViewingAppointment = ref(false);

const isModalOpen = ref(false);
const modalMode = ref('create'); // 'create' or 'edit'

const appointmentForm = ref({
  id: null,
  professional_id: null,
  procedure_id: null,
  start_date: '',
  start_time: '',
  patient_name: '',
  patient_phone: '',
});

const selectProfessional = (id) => {
  selectedProfessionalId.value = id;
};

const openAppointmentModal = (day, hour, minute = 0) => {
  let prof_id = selectedProfessionalId.value;
  if (prof_id === 'all') {
    prof_id = professionals.value.length > 0 ? professionals.value[0].id : null;
  }
  
  appointmentForm.value = {
    id: null,
    professional_id: prof_id,
    procedure_id: null,
    start_date: day.toISODate(),
    start_time: `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`,
    patient_name: '',
    patient_phone: '',
  };
  modalMode.value = 'create';
  isModalOpen.value = true;
};

const openEditModal = () => {
  const dt = DateTime.fromISO(selectedAppointment.value.start_datetime);
  appointmentForm.value = {
    id: selectedAppointment.value.id,
    professional_id: selectedAppointment.value.professional_id,
    procedure_id: selectedAppointment.value.procedure_id,
    start_date: dt.toISODate(),
    start_time: dt.toFormat('HH:mm'),
    patient_name: selectedAppointment.value.patient_name,
    patient_phone: selectedAppointment.value.patient_phone,
  };
  modalMode.value = 'edit';
  modalMode.value = 'edit';
  isViewingAppointment.value = false;
  isModalOpen.value = true;
};

const parseTimeToFloat = (timeString) => {
  if (!timeString) return -1;
  const [h, m] = timeString.split(':').map(Number);
  return h + (m / 60);
};

const isSlotDisabled = (profId, hour, minute) => {
  if (profId === 'all') return false;
  const prof = professionals.value.find(p => p.id === profId);
  if (!prof || !prof.working_hours) return false;
  
  const timeNum = hour + (minute / 60);
  const startNum = parseTimeToFloat(prof.working_hours.start);
  const endNum = parseTimeToFloat(prof.working_hours.end);
  const breakStartNum = parseTimeToFloat(prof.working_hours.break_start);
  const breakEndNum = parseTimeToFloat(prof.working_hours.break_end);

  if (startNum >= 0 && endNum >= 0 && (timeNum < startNum || timeNum >= endNum)) return true;
  if (breakStartNum >= 0 && breakEndNum >= 0 && timeNum >= breakStartNum && timeNum < breakEndNum) return true;
  return false;
};

const getSlotClass = (profId, hour, minute) => {
  if (isSlotDisabled(profId, hour, minute)) {
    // Determine if it's break or out of shift for different styling
    const prof = professionals.value.find(p => p.id === profId);
    if (!prof || !prof.working_hours) return 'bg-n-slate-2/50 dark:bg-n-solid-3/50 cursor-not-allowed opacity-50 relative overflow-hidden repeating-linear-bg';
    
    const timeNum = hour + (minute / 60);
    const breakStartNum = parseTimeToFloat(prof.working_hours.break_start);
    const breakEndNum = parseTimeToFloat(prof.working_hours.break_end);
    
    if (breakStartNum >= 0 && breakEndNum >= 0 && timeNum >= breakStartNum && timeNum < breakEndNum) {
      return 'bg-amber-500/5 cursor-not-allowed opacity-60'; // visually distinguish lunch
    }
    return 'bg-n-slate-2/50 dark:bg-n-solid-3/50 cursor-not-allowed opacity-50';
  }
  return 'hover:bg-n-slate-1 dark:hover:bg-n-alpha-2 cursor-crosshair';
};

const conflictCheck = () => {
  if (!appointmentForm.value.procedure_id || !appointmentForm.value.professional_id) return false;
  
  // Working hours validation
  const prof = professionals.value.find(p => p.id === appointmentForm.value.professional_id);
  if (prof && prof.working_hours) {
    const timeNum = parseTimeToFloat(appointmentForm.value.start_time);
    
    const startNum = parseTimeToFloat(prof.working_hours.start);
    const endNum = parseTimeToFloat(prof.working_hours.end);
    if (startNum >= 0 && endNum >= 0 && (timeNum < startNum || timeNum >= endNum)) {
      alert(`O horário está fora do expediente do profissional (${prof.working_hours.start} às ${prof.working_hours.end}).`);
      return true;
    }
    
    const breakStartNum = parseTimeToFloat(prof.working_hours.break_start);
    const breakEndNum = parseTimeToFloat(prof.working_hours.break_end);
    if (breakStartNum >= 0 && breakEndNum >= 0 && timeNum >= breakStartNum && timeNum < breakEndNum) {
      alert(`O horário coincide com o intervalo do profissional (${prof.working_hours.break_start} às ${prof.working_hours.break_end}).`);
      return true;
    }
  }
  
  const startObj = DateTime.fromISO(`${appointmentForm.value.start_date}T${appointmentForm.value.start_time}`);
  if (!startObj.isValid) return true;

  const duration = getProcedureDuration(appointmentForm.value.procedure_id);
  const endObj = startObj.plus({ minutes: duration });

  const profAppts = appointments.value.filter(a => 
    a.professional_id === appointmentForm.value.professional_id && a.status !== 'canceled' && a.id !== appointmentForm.value.id
  );

  for (const appt of profAppts) {
    const existingStart = DateTime.fromISO(appt.start_datetime);
    if (!existingStart.isValid) continue;
    
    const existingDuration = getProcedureDuration(appt.procedure_id);
    const existingEnd = existingStart.plus({ minutes: existingDuration });

    if (startObj < existingEnd && endObj > existingStart) {
      return true;
    }
  }
  return false;
};

const validateForm = () => {
  if (!appointmentForm.value.professional_id) return 'Selecione um profissional.';
  if (!appointmentForm.value.procedure_id) return 'Selecione um procedimento.';
  if (!appointmentForm.value.patient_name.trim()) return 'Nome do paciente é obrigatório.';
  if (!appointmentForm.value.patient_phone.trim()) return 'Telefone do paciente é obrigatório.';
  if (!appointmentForm.value.start_date || !appointmentForm.value.start_time) return 'Data e Hora são obrigatórios.';
  return null;
};

const saveAppointment = async () => {
  const validationError = validateForm();
  if (validationError) {
    alert(validationError);
    return;
  }

  if (conflictCheck()) {
    alert('Erro: O profissional já possui um agendamento conflitante neste horário. Por favor, escolha outro horário ou profissional.');
    return;
  }

  try {
    const isoDate = DateTime.fromISO(`${appointmentForm.value.start_date}T${appointmentForm.value.start_time}`).toISO();
    
    if (modalMode.value === 'create') {
      const hold = await store.dispatch('clinicScheduler/createHold', {
        professional_id: appointmentForm.value.professional_id,
        procedure_id: appointmentForm.value.procedure_id,
        start_datetime: isoDate,
      });
      
      await store.dispatch('clinicScheduler/confirmAppointment', {
        holdId: hold.id,
        data: {
          patient_name: appointmentForm.value.patient_name,
          patient_phone: appointmentForm.value.patient_phone,
        }
      });
    } else {
      await store.dispatch('clinicScheduler/updateAppointment', {
        appointmentId: appointmentForm.value.id,
        data: {
          professional_id: appointmentForm.value.professional_id,
          procedure_id: appointmentForm.value.procedure_id,
          start_datetime: isoDate,
          patient_name: appointmentForm.value.patient_name,
          patient_phone: appointmentForm.value.patient_phone,
        }
      });
    }
    
    isModalOpen.value = false;
  } catch (error) {
    alert('Erro ao processar agendamento: ' + error.message);
  }
};

const openViewModal = (appt, event) => {
  event.stopPropagation();
  selectedAppointment.value = appt;
  isViewingAppointment.value = true;
};

const cancelAppointmentAction = async () => {
  if (confirm('Deseja realmente cancelar este agendamento? Ele será excluído da sua agenda livre.')) {
    try {
      await store.dispatch('clinicScheduler/cancelAppointment', selectedAppointment.value.id);
      isViewingAppointment.value = false;
      // Note: cancel returns updated state, so local list might stay with status 'canceled'
      // We should refetch to update UI accurately based on how the list is generated
      store.dispatch('clinicScheduler/fetchAppointments');
    } catch(e) {
      alert('Erro: ' + e.message);
    }
  }
};

const columns = computed(() => {
  let cols = [];
  
  if (viewMode.value === 'day') {
    if (selectedProfessionalId.value === 'all') {
      cols = professionals.value.map(prof => ({
        id: `day-${prof.id}`,
        day: currentDate.value,
        professional_id: prof.id,
        label: prof.name,
        subLabel: currentDate.value.toFormat('dd/MM'),
      }));
    } else {
      cols = [{
        id: 'day-single',
        day: currentDate.value,
        professional_id: selectedProfessionalId.value,
        label: currentDate.value.weekdayLong,
        subLabel: currentDate.value.toFormat('dd/MM'),
      }];
    }
  } else if (viewMode.value === '3days') {
      for (let i = 0; i < 3; i++) {
        const d = currentDate.value.plus({ days: i });
        cols.push({
          id: `3days-${i}`,
          day: d,
          professional_id: selectedProfessionalId.value,
          label: d.weekdayShort,
          subLabel: d.toFormat('dd/MM'),
        });
      }
  } else if (viewMode.value === 'week') {
      const start = currentDate.value.startOf('week');
      for (let i = 0; i < 7; i++) {
        const d = start.plus({ days: i });
        cols.push({
          id: `week-${i}`,
          day: d,
          professional_id: selectedProfessionalId.value,
          label: d.weekdayShort,
          subLabel: d.toFormat('dd/MM'),
        });
      }
  }

  if (cols.length === 0 && viewMode.value === 'day') {
    cols = [{
      id: 'day-empty',
      day: currentDate.value,
      professional_id: 'all',
      label: currentDate.value.weekdayLong,
      subLabel: currentDate.value.toFormat('dd/MM'),
    }];
  }

  return cols;
});

const navigatePrevious = () => {
  if (viewMode.value === 'week') currentDate.value = currentDate.value.minus({ weeks: 1 });
  else if (viewMode.value === '3days') currentDate.value = currentDate.value.minus({ days: 3 });
  else currentDate.value = currentDate.value.minus({ days: 1 });
};

const navigateNext = () => {
  if (viewMode.value === 'week') currentDate.value = currentDate.value.plus({ weeks: 1 });
  else if (viewMode.value === '3days') currentDate.value = currentDate.value.plus({ days: 3 });
  else currentDate.value = currentDate.value.plus({ days: 1 });
};

const currentDateLabel = computed(() => {
  if (viewMode.value === 'week') return currentDate.value.startOf('week').toFormat('MMMM yyyy');
  return currentDate.value.toFormat('dd MMM yyyy');
});

const hours = Array.from({ length: 16 }, (_, i) => i + 8); // 8:00 to 23:00

const procedures = computed(() => {
  if (!appointmentForm.value.professional_id) return [];
  const prof = professionals.value.find(p => p.id === appointmentForm.value.professional_id);
  if (!prof || !prof.procedure_ids) return [];
  return procedures_global.value.filter(proc => prof.procedure_ids.includes(proc.id));
});

const professionalColors = [
  { id: 'blue', hex: '#3b82f6', bgHex: '#dbeafe', textHex: '#1e40af' },
  { id: 'purple', hex: '#a855f7', bgHex: '#f3e8ff', textHex: '#6b21a8' },
  { id: 'pink', hex: '#ec4899', bgHex: '#fce7f3', textHex: '#9d174d' },
  { id: 'orange', hex: '#f97316', bgHex: '#ffedd5', textHex: '#c2410c' },
  { id: 'green', hex: '#22c55e', bgHex: '#dcfce7', textHex: '#166534' },
];

const getAppointmentColorClasses = (appt) => {
  const prof = professionals.value.find(p => p.id === appt.professional_id);
  const colorId = prof?.color || 'blue';
  return professionalColors.find(c => c.id === colorId) || professionalColors[0];
};

const getProcedureDuration = (id) => {
  const proc = procedures_global.value.find(p => p.id === id);
  return proc ? proc.duration_minutes : 30;
};

const getProcedureName = (id) => {
  const proc = procedures_global.value.find(p => p.id === id);
  return proc ? proc.name : 'Procedimento';
};

const getAppointmentsForColumn = (col) => {
  return appointments.value.filter(a => {
    if (a.status === 'canceled') return false;
    if (col.professional_id !== 'all' && a.professional_id !== col.professional_id) return false;
    
    const apptDate = DateTime.fromISO(a.start_datetime);
    return apptDate.isValid && apptDate.hasSame(col.day, 'day');
  });
};

const getAppointmentStyle = (appt, col) => {
  const start = DateTime.fromISO(appt.start_datetime);
  if (!start.isValid) return { display: 'none' };

  const hourOffset = start.hour - 8;
  const minuteOffset = start.minute / 60;
  
  const top = (hourOffset + minuteOffset) * 80;
  
  const duration = getProcedureDuration(appt.procedure_id);
  const height = Math.max((duration / 60) * 80, 20); // enforce min height visual
  
  let leftOffset = '4px';
  let zIndex = 10;

  if (col.professional_id === 'all' && viewMode.value !== 'day') {
    const profIndex = professionals.value.findIndex(p => p.id === appt.professional_id);
    if (profIndex > 0) {
      leftOffset = `${4 + (profIndex * 15)}px`;
      zIndex += profIndex;
    }
  }
  
  return {
    top: `${Math.max(0, top)}px`,
    height: `${Math.max(20, height)}px`,
    left: leftOffset,
    right: '4px',
    zIndex,
  };
};

onMounted(() => {
  store.dispatch('clinicScheduler/fetchAppointments');
});
</script>

<template>
  <div class="flex flex-col h-full bg-white dark:bg-n-solid-1 relative">
    <!-- Modal de Agendamento -->
    <div v-if="isModalOpen" class="absolute inset-0 z-[100] flex items-center justify-center p-6 bg-n-solid-1/50 backdrop-blur-sm">
      <div class="bg-white dark:bg-n-solid-2 w-full max-w-lg rounded-3xl shadow-2xl border border-n-weak dark:border-n-weak/50 overflow-hidden animate-in fade-in zoom-in duration-300">
        <header class="p-6 border-b border-n-weak dark:border-n-weak/50 flex justify-between items-center bg-n-slate-1 dark:bg-n-solid-3">
          <h3 class="text-xl font-bold text-n-slate-12">{{ modalMode === 'create' ? 'Novo Agendamento' : 'Editar Agendamento' }}</h3>
          <button @click="isModalOpen = false" class="p-2 hover:bg-n-weak rounded-xl transition-colors">
            <span class="i-lucide-x size-5" />
          </button>
        </header>

        <div class="p-8 space-y-6">
          <div class="grid grid-cols-2 gap-4">
            <div class="space-y-2">
              <label class="text-xs font-bold text-n-slate-10 uppercase flex gap-1 items-center">
                Profissional <span class="text-red-500">*</span>
              </label>
              <select v-model="appointmentForm.professional_id" class="w-full p-3 bg-n-slate-1 dark:bg-n-solid-3 border border-n-weak rounded-xl text-sm outline-none">
                <option v-for="prof in professionals" :key="prof.id" :value="prof.id">{{ prof.name }}</option>
              </select>
            </div>
            <div class="space-y-2">
              <label class="text-xs font-bold text-n-slate-10 uppercase flex gap-1 items-center">
                Procedimento <span class="text-red-500">*</span>
              </label>
              <select v-model="appointmentForm.procedure_id" class="w-full p-3 bg-n-slate-1 dark:bg-n-solid-3 border border-n-weak rounded-xl text-sm outline-none">
                <option value="" disabled selected>Selecione...</option>
                <option v-for="proc in procedures" :key="proc.id" :value="proc.id">{{ proc.name }} ({{ proc.duration_minutes }} min)</option>
              </select>
            </div>
          </div>

          <div class="space-y-2">
            <label class="text-xs font-bold text-n-slate-10 uppercase flex gap-1 items-center">
              Data e Hora <span class="text-red-500">*</span>
            </label>
            <div class="flex gap-2">
              <input type="date" v-model="appointmentForm.start_date" class="flex-1 p-3 bg-n-slate-3 dark:bg-n-solid-4 border border-n-weak rounded-xl text-sm outline-none font-bold text-n-brand" />
              <input type="time" v-model="appointmentForm.start_time" class="w-1/3 p-3 bg-n-slate-3 dark:bg-n-solid-4 border border-n-weak rounded-xl text-sm outline-none font-bold text-n-brand" />
            </div>
          </div>

          <div class="space-y-2">
            <label class="text-xs font-bold text-n-slate-10 uppercase flex gap-1 items-center">
              Informações do Paciente <span class="text-red-500">*</span>
            </label>
            <input v-model="appointmentForm.patient_name" placeholder="Nome Completo" class="w-full p-3 bg-n-slate-1 dark:bg-n-solid-3 border border-n-weak rounded-xl text-sm outline-none focus:border-n-brand focus:ring-1 focus:ring-n-brand" />
            <input v-model="appointmentForm.patient_phone" placeholder="Telefone (WhatsApp)" class="w-full p-3 bg-n-slate-1 dark:bg-n-solid-3 border border-n-weak rounded-xl text-sm outline-none focus:border-n-brand focus:ring-1 focus:ring-n-brand mt-2" />
          </div>

          <div class="pt-4 flex gap-3">
            <button @click="isModalOpen = false" class="flex-1 py-3 text-sm font-bold text-n-slate-10 hover:bg-n-slate-1 rounded-2xl transition-colors">Cancelar</button>
            <button @click="saveAppointment" class="flex-1 py-3 text-sm font-bold bg-n-brand text-white rounded-2xl shadow-lg shadow-n-brand/20">
              {{ modalMode === 'create' ? 'Confirmar' : 'Salvar Alterações' }}
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Modal View Appointment -->
    <div v-if="isViewingAppointment" class="absolute inset-0 z-[100] flex items-center justify-center p-6 bg-n-solid-1/50 backdrop-blur-sm">
      <div class="bg-white dark:bg-n-solid-2 w-full max-w-sm rounded-3xl shadow-2xl border border-n-weak dark:border-n-weak/50 overflow-hidden animate-in fade-in zoom-in duration-300">
        <header class="p-6 border-b border-n-weak dark:border-n-weak/50 flex justify-between items-center bg-n-slate-1 dark:bg-n-solid-3">
          <h3 class="text-lg font-bold text-n-slate-12">Detalhes da Consulta</h3>
          <button @click="isViewingAppointment = false" class="p-2 hover:bg-n-weak rounded-xl transition-colors">
            <span class="i-lucide-x size-5" />
          </button>
        </header>

        <div class="p-8 space-y-4">
          <div>
            <p class="text-[10px] font-bold text-n-slate-9 uppercase tracking-widest mb-1">Paciente</p>
            <p class="font-bold text-n-slate-12 text-lg">{{ selectedAppointment.patient_name || 'Agendamento em Hold' }}</p>
            <p class="text-sm text-n-slate-10">{{ selectedAppointment.patient_phone || 'Sem Telefone' }}</p>
          </div>
          
          <div class="py-4 border-y border-n-weak dark:border-n-weak/50 space-y-3">
            <div class="flex items-center justify-between">
              <span class="text-xs font-bold text-n-slate-10 uppercase">Data</span>
              <span class="text-sm font-medium text-n-slate-12">{{ DateTime.fromISO(selectedAppointment.start_datetime).toFormat('dd/MM/yyyy HH:mm') }}</span>
            </div>
            <div class="flex items-center justify-between">
              <span class="text-xs font-bold text-n-slate-10 uppercase">Procedimento</span>
              <span class="text-sm font-medium text-n-slate-12">{{ getProcedureName(selectedAppointment.procedure_id) }}</span>
            </div>
            <div class="flex items-center justify-between">
              <span class="text-xs font-bold text-n-slate-10 uppercase">Status</span>
              <span class="text-xs font-bold uppercase" :class="selectedAppointment.status === 'confirmed' ? 'text-green-500' : 'text-amber-500'">{{ selectedAppointment.status === 'confirmed' ? 'Confirmado' : 'Hold' }}</span>
            </div>
          </div>

          <div class="pt-4 flex gap-3">
            <button @click="openEditModal" class="w-full py-3 text-sm font-bold bg-n-brand/10 text-n-brand hover:bg-n-brand/20 rounded-2xl transition-colors">Editar Agendamento</button>
            <button @click="cancelAppointmentAction" class="w-full py-3 text-sm font-bold bg-red-500/10 text-red-600 hover:bg-red-500/20 rounded-2xl transition-colors">Cancelar</button>
          </div>
        </div>
      </div>
    </div>

    <!-- Calendar Header -->
    <div class="p-4 border-b border-n-weak dark:border-n-weak/50 flex flex-col md:flex-row gap-4 items-center justify-between bg-n-slate-1 dark:bg-n-solid-2">
      <div class="flex items-center gap-4 w-full md:w-auto">
        <div class="flex bg-white dark:bg-n-solid-3 p-1 rounded-xl shadow-sm border border-n-weak dark:border-n-weak/50 relative">
          <button @click="navigatePrevious" class="p-2 hover:bg-n-slate-1 dark:hover:bg-n-solid-3 rounded-lg z-10">
            <span class="i-lucide-chevron-left size-4" />
          </button>
          
          <div class="relative flex items-center justify-center px-4 overflow-hidden group">
            <span class="text-sm font-bold text-n-slate-12 pointer-events-none group-hover:text-n-brand transition-colors">{{ currentDateLabel }}</span>
            <input 
              type="date" 
              class="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
              @change="(e) => { if(e.target.value) currentDate = DateTime.fromISO(e.target.value) }"
            />
          </div>

          <button @click="navigateNext" class="p-2 hover:bg-n-slate-1 dark:hover:bg-n-solid-3 rounded-lg z-10">
            <span class="i-lucide-chevron-right size-4" />
          </button>
        </div>
        <button @click="currentDate = DateTime.now()" class="text-xs font-bold text-n-brand px-3 py-2 hover:bg-n-brand/5 rounded-lg transition-colors">
          Hoje
        </button>
      </div>

      <div class="flex items-center gap-2 overflow-x-auto max-w-full no-scrollbar px-2">
        <div class="flex items-center gap-1 bg-n-slate-2 dark:bg-n-solid-4 p-1 rounded-xl mr-2 flex-shrink-0">
          <button @click="viewMode = 'day'" :class="{'bg-white dark:bg-n-solid-1 shadow text-n-slate-12': viewMode === 'day', 'text-n-slate-10': viewMode !== 'day'}" class="px-3 py-1.5 text-xs font-bold rounded-lg transition-all">Dia</button>
          <button @click="viewMode = '3days'" :class="{'bg-white dark:bg-n-solid-1 shadow text-n-slate-12': viewMode === '3days', 'text-n-slate-10': viewMode !== '3days'}" class="px-3 py-1.5 text-xs font-bold rounded-lg transition-all">3 Dias</button>
          <button @click="viewMode = 'week'" :class="{'bg-white dark:bg-n-solid-1 shadow text-n-slate-12': viewMode === 'week', 'text-n-slate-10': viewMode !== 'week'}" class="px-3 py-1.5 text-xs font-bold rounded-lg transition-all">Semana</button>
        </div>

        <button
          @click="selectProfessional('all')"
          class="px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap border flex-shrink-0"
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
    <div class="flex-1 overflow-y-auto overflow-x-auto relative min-h-0 bg-n-slate-1 dark:bg-n-solid-2">
      <div class="min-w-fit flex h-full">
        <!-- Time Column -->
        <div class="w-14 md:w-16 shrink-0 border-r border-n-weak dark:border-n-weak/50 bg-n-slate-1 dark:bg-n-solid-2 sticky left-0 z-20 flex flex-col">
          <div class="h-16 shrink-0 border-b border-n-weak dark:border-n-weak/50"></div>
          <div v-for="hour in hours" :key="hour" class="h-20 shrink-0 text-[10px] md:text-xs font-bold text-n-slate-8 text-center p-2 relative flex justify-center">
            {{ hour }}:00
          </div>
        </div>

        <!-- Columns -->
        <div v-for="col in columns" :key="col.id" class="flex-1 min-w-[200px] md:min-w-[250px] border-r border-n-weak dark:border-n-weak/50 group bg-white dark:bg-n-solid-1">
          <!-- Column Header -->
          <div 
            class="h-16 border-b border-n-weak dark:border-n-weak/50 p-2 flex flex-col items-center justify-center sticky top-0 bg-white dark:bg-n-solid-1 z-10"
            :class="{ 'bg-n-brand/5': col.day.hasSame(DateTime.now(), 'day') }"
          >
            <span class="text-[10px] font-bold text-n-slate-9 uppercase tracking-widest">{{ col.label }}</span>
            <span class="text-sm font-bold" :class="col.day.hasSame(DateTime.now(), 'day') ? 'text-n-brand' : 'text-n-slate-12'">{{ col.subLabel }}</span>
          </div>

          <!-- Time Slots -->
          <div class="relative" :style="{ height: `${hours.length * 80}px` }">
            <div 
              v-for="hour in hours" 
              :key="hour" 
              class="h-20 shrink-0 border-b border-n-weak/30 dark:border-n-weak/10 relative flex flex-col group/slot"
            >
              <div 
                @click="!isSlotDisabled(col.professional_id, hour, 0) && openAppointmentModal(col.day, hour, 0)" 
                class="flex-1 transition-colors flex items-center justify-center relative" 
                :class="getSlotClass(col.professional_id, hour, 0)"
              >
                <span v-if="!isSlotDisabled(col.professional_id, hour, 0)" class="i-lucide-plus-circle size-4 text-n-brand/50 opacity-0 group-hover/slot:opacity-100 absolute" />
              </div>
              
              <div 
                @click="!isSlotDisabled(col.professional_id, hour, 30) && openAppointmentModal(col.day, hour, 30)" 
                class="flex-1 transition-colors border-t border-dashed border-n-weak/20 flex items-center justify-center relative" 
                :class="getSlotClass(col.professional_id, hour, 30)"
              >
              </div>
            </div>

            <!-- Actual Dynamic Data -->
            <div 
              v-for="appt in getAppointmentsForColumn(col)"
              :key="appt.id"
              @click="openViewModal(appt, $event)"
              class="absolute rounded-lg p-1.5 shadow-sm animate-in fade-in zoom-in duration-300 overflow-hidden cursor-pointer hover:brightness-95 transition-all outline outline-1 outline-black/10 flex flex-col gap-0.5 leading-none"
              :style="{
                backgroundColor: getAppointmentColorClasses(appt).bgHex,
                borderLeft: `3px solid ${getAppointmentColorClasses(appt).hex}`,
                color: getAppointmentColorClasses(appt).textHex,
                ...getAppointmentStyle(appt, col)
              }"
            >
              <div v-if="appt.status === 'confirmed'" class="h-full flex flex-col overflow-hidden">
                <p class="text-[8px] font-bold uppercase truncate opacity-80 mb-0.5">Confirmado - {{ appt.patient_name }}</p>
                <p class="text-[9px] font-bold truncate">{{ getProcedureName(appt.procedure_id) }}</p>
                <p v-if="getProcedureDuration(appt.procedure_id) > 20" class="text-[8px] font-medium opacity-80 truncate mt-max">{{ DateTime.fromISO(appt.start_datetime).toFormat('HH:mm') }} - {{ getProcedureDuration(appt.procedure_id) }} min</p>
              </div>

              <div v-else class="h-full opacity-60 flex flex-col overflow-hidden">
                <p class="text-[8px] font-bold uppercase truncate opacity-80 mb-0.5">Hold</p>
                <p class="text-[9px] font-bold truncate">Bloqueado</p>
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
.repeating-linear-bg {
  background-image: repeating-linear-gradient(45deg, transparent, transparent 5px, rgba(0,0,0,0.02) 5px, rgba(0,0,0,0.02) 10px);
}
.dark .repeating-linear-bg {
  background-image: repeating-linear-gradient(45deg, transparent, transparent 5px, rgba(255,255,255,0.02) 5px, rgba(255,255,255,0.02) 10px);
}
</style>
