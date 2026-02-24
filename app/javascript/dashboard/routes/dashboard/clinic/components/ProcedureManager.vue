<script setup>
import { ref, computed } from 'vue';
import { useStore } from 'vuex';

const store = useStore();
const procedures = computed(() => store.getters['clinicScheduler/getProcedures']);
const isCreating = ref(false);
const newProcedure = ref({ name: '', duration_minutes: 30 });

const addProcedure = async () => {
  if (!newProcedure.value.name.trim()) return;
  await store.dispatch('clinicScheduler/createProcedure', { ...newProcedure.value });
  newProcedure.value = { name: '', duration_minutes: 30 };
  isCreating.value = false;
};
</script>

<template>
  <div class="bg-white dark:bg-n-solid-2 rounded-3xl border border-n-weak dark:border-n-weak/50 overflow-hidden shadow-sm">
    <header class="p-6 border-b border-n-weak dark:border-n-weak/50 flex justify-between items-center">
      <div>
        <h3 class="text-lg font-bold text-n-slate-12">Procedimentos</h3>
        <p class="text-xs text-n-slate-10 uppercase font-bold tracking-widest mt-1">Serviços Oferecidos</p>
      </div>
      <button
        @click="isCreating = true"
        class="size-10 bg-n-brand/10 text-n-brand rounded-xl flex items-center justify-center hover:bg-n-brand/20 transition-all"
      >
        <span class="i-lucide-plus size-5" />
      </button>
    </header>

    <div class="p-6 space-y-4">
      <div v-if="isCreating" class="p-4 bg-n-slate-1 dark:bg-n-solid-3 rounded-2xl border border-n-brand/30 space-y-4 animate-in fade-in slide-in-from-top-2">
        <div class="space-y-4">
          <input
            v-model="newProcedure.name"
            placeholder="Nome do procedimento..."
            class="w-full px-4 py-2 bg-white dark:bg-n-solid-2 border border-n-weak rounded-xl outline-none focus:border-n-brand focus:ring-1 focus:ring-n-brand text-sm"
          />
          <div class="flex items-center gap-3">
            <span class="text-xs font-bold text-n-slate-10">Duração (min):</span>
            <input
              v-model.number="newProcedure.duration_minutes"
              type="number"
              class="w-24 px-3 py-1.5 bg-white dark:bg-n-solid-2 border border-n-weak rounded-lg outline-none focus:border-n-brand text-xs font-bold"
            />
          </div>
        </div>
        <div class="flex gap-2">
          <button @click="isCreating = false" class="flex-1 py-2 text-xs font-bold text-n-slate-10 hover:bg-n-alpha-1 rounded-lg">Cancelar</button>
          <button @click="addProcedure" class="flex-1 py-2 text-xs font-bold bg-n-brand text-white rounded-lg">Adicionar</button>
        </div>
      </div>

      <div class="space-y-2">
        <div
          v-for="proc in procedures"
          :key="proc.id"
          class="group flex items-center justify-between p-4 bg-n-slate-1 dark:bg-n-solid-3/50 hover:bg-white dark:hover:bg-n-solid-3 rounded-2xl border border-transparent hover:border-n-weak transition-all"
        >
          <div class="flex items-center gap-4">
            <div class="size-10 rounded-xl bg-orange-100 dark:bg-orange-900/20 text-orange-600 flex items-center justify-center">
              <span class="i-lucide-activity size-5" />
            </div>
            <div>
              <p class="font-bold text-n-slate-12 text-sm">{{ proc.name }}</p>
              <div class="flex items-center gap-1.5 mt-0.5">
                <span class="i-lucide-clock size-3 text-n-slate-8" />
                <span class="text-[10px] text-n-slate-9 font-bold">{{ proc.duration_minutes }} min</span>
              </div>
            </div>
          </div>
          <button class="opacity-0 group-hover:opacity-100 p-2 text-n-slate-8 hover:text-n-brand transition-all">
            <span class="i-lucide-edit size-4" />
          </button>
        </div>
      </div>

      <div v-if="!procedures.length && !isCreating" class="py-12 text-center space-y-3">
        <div class="size-12 bg-n-slate-3 dark:bg-n-solid-3 rounded-full flex items-center justify-center mx-auto grayscale opacity-50">
          <span class="i-lucide-stethoscope size-6" />
        </div>
        <p class="text-sm text-n-slate-9">Nenhum procedimento cadastrado.</p>
      </div>
    </div>
  </div>
</template>
