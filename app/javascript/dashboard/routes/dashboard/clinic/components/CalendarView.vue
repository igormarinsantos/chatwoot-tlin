<script setup>
import { ref, computed, onMounted } from 'vue';
import { useStore } from 'vuex';
import { DateTime, Info } from 'luxon';

const store = useStore();
const professionals = computed(() => store.getters['clinicScheduler/getProfessionals']);
const selectedProfessionalId = ref(null);
const currentWeek = ref(DateTime.now().startOf('week'));

const days = computed(() => {
  return [0, 1, 2, 3, 4, 5, 6].map(i => currentWeek.value.plus({ days: i }));
});

const hours = Array.from({ length: 14 }, (_, i) => i + 8); // 8:00 to 21:00

const selectProfessional = (id) => {
  selectedProfessionalId.value = id;
};

onMounted(() => {
  if (professionals.value.length > 0) {
    selectedProfessionalId.value = professionals.value[0].id;
  }
});
</script>

<template>
  <div class="flex flex-col h-full bg-white dark:bg-n-solid-1">
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
              class="h-20 border-b border-n-weak/30 dark:border-n-weak/10 relative hover:bg-n-slate-1 dark:hover:bg-n-alpha-2 transition-colors cursor-crosshair"
            >
              <!-- Slot content would go here -->
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
