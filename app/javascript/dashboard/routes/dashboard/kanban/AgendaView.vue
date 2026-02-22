<script setup>
import { computed, ref } from 'vue';
import { useStore } from 'vuex';
import { format, startOfMonth, endOfMonth, startOfWeek, endOfWeek, eachDayOfInterval, isSameMonth, isSameDay, addMonths, subMonths } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const store = useStore();
const currentMonth = ref(new Date());

const contacts = computed(() => store.getters['contacts/getContactsList']);

const agents = computed(() => store.getters['agents/getAgents']);
const selectedProfessional = ref('all');

const appointments = computed(() => {
  return contacts.value.filter(c => {
    const hasDate = c.customAttributes?.appointment_at;
    if (!hasDate) return false;
    
    if (selectedProfessional.value !== 'all') {
      return c.customAttributes?.appointment_professional === selectedProfessional.value;
    }
    return true;
  });
});

const days = computed(() => {
  const start = startOfWeek(startOfMonth(currentMonth.value));
  const end = endOfWeek(endOfMonth(currentMonth.value));
  return eachDayOfInterval({ start, end });
});

const nextMonth = () => { currentMonth.value = addMonths(currentMonth.value, 1); };
const prevMonth = () => { currentMonth.value = subMonths(currentMonth.value, 1); };

const getAppointmentsForDay = (day) => {
  return appointments.value.filter(app => {
    const date = new Date(app.customAttributes.appointment_at);
    return isSameDay(date, day);
  });
};
</script>

<template>
  <div class="h-full flex flex-col gap-6">
    <header class="flex items-center justify-between">
      <div class="flex items-center gap-4">
        <h2 class="text-2xl font-bold text-n-slate-12 capitalize">
          {{ format(currentMonth, 'MMMM yyyy', { locale: ptBR }) }}
        </h2>
        <div class="flex gap-1">
          <button @click="prevMonth" class="p-2 hover:bg-n-alpha-1 rounded-xl transition-colors text-n-slate-10">
            <span class="i-lucide-chevron-left size-5" />
          </button>
          <button @click="currentMonth = new Date()" class="px-3 py-1 hover:bg-n-alpha-1 rounded-xl transition-colors text-xs font-bold text-n-slate-10">
            Hoje
          </button>
          <button @click="nextMonth" class="p-2 hover:bg-n-alpha-1 rounded-xl transition-colors text-n-slate-10">
            <span class="i-lucide-chevron-right size-5" />
          </button>
        </div>
      </div>

      <div class="flex items-center gap-2">
        <span class="text-xs font-bold text-n-slate-9 uppercase tracking-wider">Filtrar Profissional:</span>
        <select 
          v-model="selectedProfessional"
          class="bg-white dark:bg-n-solid-2 border border-n-weak rounded-xl px-3 py-2 text-sm font-medium text-n-slate-12 outline-none focus:border-n-brand transition-colors"
        >
          <option value="all">Todos os Profissionais</option>
          <option v-for="agent in agents" :key="agent.id" :value="agent.name">
            {{ agent.name }}
          </option>
        </select>
      </div>
    </header>

    <div class="flex-1 bg-white dark:bg-n-solid-2 rounded-2xl border border-n-weak overflow-hidden flex flex-col shadow-sm">
      <!-- Weekday headers -->
      <div class="grid grid-cols-7 border-b border-n-weak bg-n-slate-1 dark:bg-n-solid-1">
        <div v-for="day in ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']" :key="day" class="p-3 text-center text-[10px] font-bold uppercase tracking-widest text-n-slate-9">
          {{ day }}
        </div>
      </div>

      <!-- Calendar grid -->
      <div class="grid grid-cols-7 flex-1 overflow-y-auto">
        <div 
          v-for="day in days" 
          :key="day.toString()" 
          class="min-h-[140px] p-2 border-r border-b border-n-weak/50 last:border-r-0 transition-colors group relative hover:bg-n-alpha-1/50"
          :class="[
            !isSameMonth(day, currentMonth) ? 'bg-n-slate-1/30 opacity-40' : '',
            isSameDay(day, new Date()) ? 'bg-n-brand/5' : ''
          ]"
        >
          <div class="flex justify-between items-start mb-2">
            <span 
              class="size-7 flex items-center justify-center rounded-full text-xs font-bold transition-all"
              :class="isSameDay(day, new Date()) ? 'bg-n-brand text-white shadow-lg shadow-n-brand/20' : 'text-n-slate-11'"
            >
              {{ format(day, 'd') }}
            </span>
            <button 
              class="p-1.5 bg-n-brand text-white rounded-lg transition-all opacity-0 group-hover:opacity-100 shadow-lg shadow-n-brand/20 scale-75 group-hover:scale-100"
              @click="$emit('schedule', day)"
            >
              <span class="i-lucide-plus size-3" />
            </button>
          </div>

          <div class="flex flex-col gap-1.5">
            <div 
              v-for="app in getAppointmentsForDay(day)" 
              :key="app.id"
              class="px-2.5 py-1.5 bg-white dark:bg-n-solid-3 border border-n-weak dark:border-n-weak/50 shadow-sm rounded-xl text-[10px] font-bold text-n-slate-12 truncate cursor-pointer hover:border-n-brand hover:text-n-brand transition-all flex items-center gap-2"
              @click="$emit('select', app)"
            >
              <div class="size-1.5 rounded-full bg-n-brand" />
              {{ app.name || 'Sem nome' }}
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
