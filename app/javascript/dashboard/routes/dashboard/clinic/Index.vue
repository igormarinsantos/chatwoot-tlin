<script setup>
import { ref, onMounted, computed } from 'vue';
import { useStore } from 'vuex';
import ProfessionalManager from './components/ProfessionalManager.vue';
import ProcedureManager from './components/ProcedureManager.vue';
import CalendarView from './components/CalendarView.vue';
import ClinicSettings from './components/ClinicSettings.vue';

const store = useStore();
const activeTab = ref('agenda'); // agenda, management, settings

onMounted(() => {
  store.dispatch('clinicScheduler/fetchClinicSettings');
  store.dispatch('clinicScheduler/fetchProfessionals');
  store.dispatch('clinicScheduler/fetchProcedures');
});

const tabs = [
  { id: 'agenda', name: 'Agenda', icon: 'i-lucide-calendar' },
  { id: 'management', name: 'Gestão de Clínica', icon: 'i-lucide-users' },
  { id: 'settings', name: 'Configurações', icon: 'i-lucide-settings' },
];
</script>

<template>
  <div class="w-full flex flex-col h-full bg-n-slate-1 dark:bg-n-solid-1 overflow-hidden">
    <!-- Header -->
    <header class="p-6 border-b border-n-weak dark:border-n-weak/50 flex justify-between items-center bg-white dark:bg-n-solid-2">
      <div>
        <h1 class="text-3xl font-bold text-n-slate-12 tracking-tight">Agenda Clínica</h1>
        <p class="text-sm text-n-slate-10 mt-1">Gerencie profissionais, procedimentos e consultas.</p>
      </div>

      <div class="flex bg-n-slate-3 dark:bg-n-solid-3 p-1 rounded-2xl">
        <button
          v-for="tab in tabs"
          :key="tab.id"
          @click="activeTab = tab.id"
          class="px-6 py-2.5 rounded-xl text-sm font-bold transition-all flex items-center gap-2"
          :class="activeTab === tab.id 
            ? 'bg-white dark:bg-n-solid-2 text-n-brand shadow-sm' 
            : 'text-n-slate-10 hover:text-n-slate-12'"
        >
          <span :class="tab.icon" class="size-4" />
          {{ tab.name }}
        </button>
      </div>
    </header>

    <!-- Main Content -->
    <main class="flex-1 overflow-hidden">
      <div v-if="activeTab === 'agenda'" class="h-full">
        <CalendarView />
      </div>

      <div v-else-if="activeTab === 'settings'" class="h-full overflow-y-auto p-8 max-w-4xl mx-auto">
        <ClinicSettings />
      </div>

      <div v-else class="h-full overflow-y-auto p-8 space-y-12">
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-12">
          <ProfessionalManager />
          <ProcedureManager />
        </div>
      </div>
    </main>
  </div>
</template>

<style scoped>
/* Custom Scrollbar for the main view */
::-webkit-scrollbar {
  width: 6px;
}
::-webkit-scrollbar-track {
  background: transparent;
}
::-webkit-scrollbar-thumb {
  background: rgba(0,0,0,0.1);
  border-radius: 10px;
}
</style>
