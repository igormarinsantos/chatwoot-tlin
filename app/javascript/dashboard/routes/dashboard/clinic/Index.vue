<script setup>
import { ref, onMounted, computed } from 'vue';
import { useStore } from 'vuex';
import { useRoute } from 'vue-router';
import ProfessionalManager from './components/ProfessionalManager.vue';
import ProcedureManager from './components/ProcedureManager.vue';
import CalendarView from './components/CalendarView.vue';
import ClinicSettings from './components/ClinicSettings.vue';

const store = useStore();
const route = useRoute();

const activeTab = computed(() => {
  if (route.name === 'clinic_dashboard_settings') return 'settings';
  if (route.name === 'clinic_dashboard_finance') return 'finance';
  return 'agenda';
});

onMounted(() => {
  store.dispatch('clinicScheduler/fetchClinicSettings');
  store.dispatch('clinicScheduler/fetchProfessionals');
  store.dispatch('clinicScheduler/fetchProcedures');
});

</script>

<template>
  <div class="w-full flex flex-col h-full bg-n-slate-1 dark:bg-n-solid-1 overflow-hidden">
    <!-- Header -->
    <header class="p-6 border-b border-n-weak dark:border-n-weak/50 flex justify-between items-center bg-white dark:bg-n-solid-2">
      <div>
        <h1 class="text-3xl font-bold text-n-slate-12 tracking-tight">
          {{ activeTab === 'settings' ? 'Configurações da Clínica' : activeTab === 'finance' ? 'Financeiro da Clínica' : 'Agenda Clínica' }}
        </h1>
        <p class="text-sm text-n-slate-10 mt-1">
          {{ activeTab === 'settings' ? 'Gerencie procedimentos, profissionais e horários operacionais.' : activeTab === 'finance' ? 'Gestão de contas e recebimentos (Em Breve).' : 'Gerencie agendas e consultas de todos os profissionais.' }}
        </p>
      </div>
    </header>

    <!-- Main Content -->
    <main class="flex-1 overflow-hidden">
      <div v-if="activeTab === 'agenda'" class="h-full">
        <CalendarView />
      </div>

      <div v-else class="h-full overflow-y-auto p-8 space-y-12">
        <div class="max-w-4xl mx-auto">
          <ClinicSettings />
        </div>
        
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
