<script setup>
import { computed, ref } from 'vue';
import { useStore } from 'vuex';
import { format, startOfMonth, endOfMonth, startOfWeek, endOfWeek, eachDayOfInterval, isSameMonth, isSameDay, addMonths, subMonths } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const store = useStore();
const currentMonth = ref(new Date());
const selectedDay = ref(new Date());
const showDailyPanel = ref(false);

const contacts = computed(() => store.getters['contacts/getContactsList']);
const agents = computed(() => store.getters['agents/getAgents']);
const teams = computed(() => store.getters['teams/getTeams']);
const campaigns = computed(() => store.getters['campaigns/getAllCampaigns']);
const selectedProfessional = ref('all');
const selectedTeam = ref('all');

const appointments = computed(() => {
  const contactAppointments = contacts.value.filter(c => {
    const hasDate = c.customAttributes?.appointment_at;
    if (!hasDate) return false;
    
    let matches = true;
    if (selectedProfessional.value !== 'all') {
      matches = matches && c.customAttributes?.appointment_professional === selectedProfessional.value;
    }
    if (selectedTeam.value !== 'all') {
      matches = matches && c.customAttributes?.appointment_team === selectedTeam.value;
    }
    return matches;
  }).map(c => ({
    ...c,
    type: c.customAttributes?.is_agenda_event ? 'event' : 'appointment',
    time: format(new Date(c.customAttributes.appointment_at), 'HH:mm'),
    date: new Date(c.customAttributes.appointment_at),
    colorClass: c.customAttributes?.is_agenda_event ? 'bg-n-slate-8' : 'bg-n-brand',
    tagClass: c.customAttributes?.is_agenda_event ? 'bg-n-slate-10/10 text-n-slate-10' : 'bg-n-brand/10 text-n-brand'
  }));

  const campEvents = campaigns.value.filter(camp => camp.scheduled_at).map(camp => ({
    ...camp,
    name: camp.title,
    type: 'campaign',
    time: format(new Date(camp.scheduled_at), 'HH:mm'),
    date: new Date(camp.scheduled_at),
    colorClass: 'bg-n-blue-9',
    tagClass: 'bg-n-blue-9/10 text-n-blue-9'
  }));

  return [...contactAppointments, ...campEvents].sort((a, b) => a.date - b.date);
});

const days = computed(() => {
  const start = startOfWeek(startOfMonth(currentMonth.value));
  const end = endOfWeek(endOfMonth(currentMonth.value));
  return eachDayOfInterval({ start, end });
});

const nextMonth = () => { currentMonth.value = addMonths(currentMonth.value, 1); };
const prevMonth = () => { currentMonth.value = subMonths(currentMonth.value, 1); };

const getAppointmentsForDay = (day) => {
  return appointments.value.filter(app => isSameDay(app.date, day));
};

const selectDay = (day) => {
  selectedDay.value = day;
  showDailyPanel.value = true;
};
</script>

<template>
  <div class="h-full flex flex-col gap-6">
    <header class="flex items-center justify-between">
      <div class="flex items-center gap-4">
        <div>
          <h1 class="text-3xl font-black text-n-slate-12 tracking-tight">Agenda da Equipe</h1>
          <p class="text-xs text-n-slate-10 font-medium">Organização e compromissos internos do time</p>
        </div>
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

      <div class="flex items-center gap-4">
        <div class="flex items-center gap-2">
          <span class="text-[10px] font-bold text-n-slate-9 uppercase tracking-wider">Equipe:</span>
          <select 
            v-model="selectedTeam"
            class="bg-white dark:bg-n-solid-2 border border-n-weak rounded-xl px-3 py-1.5 text-xs font-bold text-n-slate-12 outline-none focus:border-n-brand transition-colors"
          >
            <option value="all">Todas</option>
            <option v-for="team in teams" :key="team.id" :value="team.name">
              {{ team.name }}
            </option>
          </select>
        </div>

        <div class="flex items-center gap-2">
          <span class="text-[10px] font-bold text-n-slate-9 uppercase tracking-wider">Agente:</span>
          <select 
            v-model="selectedProfessional"
            class="bg-white dark:bg-n-solid-2 border border-n-weak rounded-xl px-3 py-1.5 text-xs font-bold text-n-slate-12 outline-none focus:border-n-brand transition-colors"
          >
            <option value="all">Todos</option>
            <option v-for="agent in agents" :key="agent.id" :value="agent.name">
              {{ agent.name }}
            </option>
          </select>
        </div>
      </div>
    </header>

    <div class="flex-1 flex gap-6 overflow-hidden">
      <div class="flex-1 bg-white dark:bg-n-solid-2 rounded-2xl border border-n-weak overflow-hidden flex flex-col shadow-sm">
        <!-- Weekday headers -->
        <div class="grid grid-cols-7 border-b border-n-weak bg-n-slate-1 dark:bg-n-solid-1">
          <div v-for="day in ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']" :key="day" class="p-3 text-center text-[10px] font-bold uppercase tracking-widest text-n-slate-9">
            {{ day }}
          </div>
        </div>

        <!-- Calendar grid -->
        <div class="grid grid-cols-7 flex-1 overflow-y-auto min-h-0">
          <div 
            v-for="day in days" 
            :key="day.toString()" 
            class="min-h-[120px] p-2 border-r border-b border-n-weak/50 last:border-r-0 transition-colors group relative hover:bg-n-alpha-1/50 cursor-pointer"
            :class="[
              !isSameMonth(day, currentMonth) ? 'bg-n-slate-1/30 opacity-40' : '',
              isSameDay(day, new Date()) ? 'bg-n-brand/5' : '',
              isSameDay(day, selectedDay) ? 'ring-2 ring-inset ring-n-brand' : ''
            ]"
            @click="selectDay(day)"
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
                @click.stop="$emit('schedule', day)"
              >
                <span class="i-lucide-plus size-3" />
              </button>
            </div>

            <div class="flex flex-col gap-1.5">
              <div 
                v-for="app in getAppointmentsForDay(day).slice(0, 3)" 
                :key="app.id"
                class="px-2 py-1 bg-white dark:bg-n-solid-3 border border-n-weak dark:border-n-weak/50 shadow-sm rounded-lg text-[10px] font-bold text-n-slate-12 truncate flex items-center gap-2 transition-transform hover:scale-[1.02]"
              >
                <div 
                  class="size-1.5 rounded-full flex-shrink-0" 
                  :class="app.colorClass"
                />
                <span class="opacity-60">{{ app.time }}</span> 
                <span class="truncate">{{ app.name }}</span>
              </div>
              <div v-if="getAppointmentsForDay(day).length > 3" class="text-[9px] font-bold text-n-slate-9 text-center">
                + {{ getAppointmentsForDay(day).length - 3 }} mais
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Daily Schedule Panel -->
      <aside v-if="showDailyPanel" class="w-80 bg-white dark:bg-n-solid-2 rounded-2xl border border-n-weak flex flex-col shadow-sm animate-in slide-in-from-right duration-300">
        <header class="p-5 border-b border-n-weak flex items-center justify-between">
          <div>
            <h3 class="font-bold text-n-slate-12">Compromissos do Dia</h3>
            <p class="text-xs text-n-slate-9 uppercase tracking-wider font-bold mt-0.5">{{ format(selectedDay, 'EEEE', { locale: ptBR }) }}</p>
          </div>
          <button @click="showDailyPanel = false" class="p-2 hover:bg-n-alpha-1 rounded-xl transition-colors text-n-slate-10">
            <span class="i-lucide-x size-4" />
          </button>
        </header>

        <div class="flex-1 overflow-y-auto p-5 space-y-6">
          <div v-if="getAppointmentsForDay(selectedDay).length === 0" class="flex flex-col items-center justify-center h-full text-n-slate-9 gap-4 py-12">
            <div class="size-16 rounded-full bg-n-slate-1 dark:bg-n-solid-1 flex items-center justify-center opacity-40">
              <span class="i-lucide-calendar-x size-8" />
            </div>
            <p class="text-sm font-medium">Nada agendado para hoje.</p>
            <button 
              class="px-4 py-2 bg-n-brand text-white text-xs font-bold rounded-xl shadow-lg shadow-n-brand/20 active:scale-95 transition-all"
              @click="$emit('schedule', selectedDay)"
            >
              Agendar Agora
            </button>
          </div>

          <div v-else class="space-y-4">
            <div 
              v-for="app in getAppointmentsForDay(selectedDay)" 
              :key="app.id"
              class="group relative flex gap-4 cursor-pointer hover:bg-n-alpha-1 -mx-2 p-3 rounded-2xl transition-all border border-transparent hover:border-n-weak"
              @click="$emit('select', app)"
            >
              <div class="flex-shrink-0 w-12 text-sm font-bold pt-1 text-center" :class="app.type === 'campaign' ? 'text-n-blue-9' : 'text-n-brand'">
                {{ app.time }}
              </div>
              <div class="flex-1 min-w-0">
                <h4 class="font-bold text-n-slate-12 truncate">{{ app.name }}</h4>
                <div class="flex items-center gap-2 mt-1">
                  <span 
                    class="text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider"
                    :class="app.tagClass"
                  >
                    {{ app.type === 'event' ? 'Evento' : app.type === 'campaign' ? 'Campanha' : 'Compromisso' }}
                  </span>
                  <span v-if="app.customAttributes?.appointment_professional" class="text-[10px] text-n-slate-9 font-medium truncate">
                    • {{ app.customAttributes.appointment_professional }}
                  </span>
                  <span v-if="app.custom_attributes?.pipeline_stage" class="text-[10px] text-n-brand font-bold uppercase tracking-tighter">
                    • {{ app.custom_attributes.pipeline_stage }}
                  </span>
                  <span v-else-if="app.inbox" class="text-[10px] text-n-slate-9 font-medium truncate">
                    • {{ app.inbox.name }}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <footer class="p-5 border-t border-n-weak">
          <button 
            class="w-full py-3 bg-n-brand text-white font-bold rounded-2xl shadow-lg shadow-n-brand/20 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2"
            @click="$emit('schedule', selectedDay)"
          >
            <span class="i-lucide-plus size-4" />
            Novo Agendamento
          </button>
        </footer>
      </aside>
    </div>
  </div>
</template>
