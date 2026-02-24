<script setup>
import { ref, onMounted } from 'vue';
import { useStore } from 'vuex';
import ProfessionalManager from './components/ProfessionalManager.vue';
import ProcedureManager from './components/ProcedureManager.vue';
import CalendarView from './components/CalendarView.vue';
import ClinicSettings from './components/ClinicSettings.vue';

const store = useStore();
const activeTab = ref('agenda');

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
  <div class="flex flex-col h-full bg-[#111115] text-white overflow-hidden">
    <!-- Header -->
    <header class="pt-6 pb-4 px-8 border-b border-[#26262F] flex justify-between items-center bg-[#111115]">
      <div>
        <h1 class="text-2xl font-bold tracking-tight text-white mb-1">Agenda Clínica</h1>
        <p class="text-[11px] text-[#8B8B9B] font-medium tracking-wide">Gerencie profissionais, procedimentos e consultas.</p>
      </div>

      <div class="flex bg-[#18181E] p-1.5 rounded-xl border border-[#26262F]">
        <button
          v-for="tab in tabs"
          :key="tab.id"
          @click="activeTab = tab.id"
          class="px-5 py-2 rounded-lg text-xs font-semibold transition-all flex items-center gap-2"
          :class="activeTab === tab.id 
            ? 'bg-[#26262F] text-[#B597FF]' 
            : 'text-[#8B8B9B] hover:text-white'"
        >
          <span :class="tab.icon" class="w-4 h-4" />
          {{ tab.name }}
        </button>
      </div>
    </header>

    <!-- Main Content -->
    <main class="flex-1 overflow-hidden relative">
      <div v-if="activeTab === 'agenda'" class="absolute inset-0">
        <CalendarView />
      </div>

      <div v-else-if="activeTab === 'settings'" class="absolute inset-0 overflow-y-auto p-8 flex justify-center custom-scrollbar">
        <div class="w-full max-w-3xl">
          <ClinicSettings />
        </div>
      </div>

      <div v-else class="absolute inset-0 overflow-y-auto p-8 custom-scrollbar">
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-8 h-full max-h-[800px]">
          <ProfessionalManager />
          <ProcedureManager />
        </div>
      </div>
    </main>
  </div>
</template>

<style scoped>
.custom-scrollbar::-webkit-scrollbar {
  width: 6px;
}
.custom-scrollbar::-webkit-scrollbar-track {
  background: transparent;
}
.custom-scrollbar::-webkit-scrollbar-thumb {
  background: #26262F;
  border-radius: 6px;
}
</style>
