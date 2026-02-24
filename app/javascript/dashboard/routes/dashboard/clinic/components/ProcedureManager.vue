<script setup>
import { ref, computed } from 'vue';
import { useStore } from 'vuex';

const store = useStore();
const procedures = computed(() => store.getters['clinicScheduler/getProcedures']);
const isCreating = ref(false);
const newProcedure = ref({ name: '', duration_minutes: 30, price: null });

const formatCurrency = (value) => {
  if (value === null || value === undefined) return 'Consulte';
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
};

const addProcedure = async () => {
  if (!newProcedure.value.name.trim()) return;
  await store.dispatch('clinicScheduler/createProcedure', { ...newProcedure.value });
  newProcedure.value = { name: '', duration_minutes: 30, price: null };
  isCreating.value = false;
};

const deleteProcedure = async (id) => {
  if (confirm('Deseja excluir este procedimento?')) {
    await store.dispatch('clinicScheduler/deleteProcedure', id);
  }
};
</script>

<template>
  <div class="bg-[#18181E] rounded-2xl flex flex-col h-full border border-[#26262F]">
    <header class="p-5 flex justify-between items-center w-full">
      <div>
        <h3 class="text-white font-semibold text-lg">Procedimentos</h3>
        <p class="text-[#8B8B9B] text-[10px] uppercase font-bold tracking-wider mt-0.5">Serviços Oferecidos</p>
      </div>
      <button
        @click="isCreating = true"
        class="w-8 h-8 rounded-full bg-[#26262F] flex items-center justify-center text-[#B597FF] hover:bg-[#30303B] transition-colors"
      >
        <span class="i-lucide-plus w-4 h-4" />
      </button>
    </header>

    <div class="p-5 space-y-4 flex-1 overflow-y-auto custom-scrollbar">
      <div v-if="isCreating" class="p-5 bg-[#1F1F27] rounded-xl border border-[#26262F] space-y-4">
        <input
          v-model="newProcedure.name"
          placeholder="Nome do procedimento.."
          class="w-full px-4 py-2.5 bg-[#18181E] border border-[#26262F] text-white rounded-lg outline-none focus:border-[#B597FF] text-sm placeholder-[#6C6C7D]"
        />
        <div class="grid grid-cols-2 gap-3">
          <div class="space-y-1.5">
            <span class="text-xs text-[#8B8B9B]">Duração (min):</span>
            <input
              v-model.number="newProcedure.duration_minutes"
              type="number"
              class="w-full px-3 py-2 bg-[#18181E] border border-[#26262F] text-white rounded-lg outline-none focus:border-[#B597FF] text-sm"
            />
          </div>
          <div class="space-y-1.5">
            <span class="text-xs text-[#8B8B9B]">Valor (R$):</span>
            <input
              v-model.number="newProcedure.price"
              type="number"
              placeholder="0.00"
              step="0.01"
              class="w-full px-3 py-2 bg-[#18181E] border border-[#26262F] text-white rounded-lg outline-none focus:border-[#B597FF] text-sm"
            />
          </div>
        </div>
        <div class="flex items-center gap-3 pt-2">
          <button @click="isCreating = false" class="text-[#8B8B9B] text-xs font-medium hover:text-white px-2">Cancelar</button>
          <button @click="addProcedure" class="flex-1 py-2.5 text-sm font-semibold bg-[#B597FF] text-white rounded-lg hover:bg-[#9d7cf0] transition-colors">Adicionar</button>
        </div>
      </div>

      <div class="space-y-3">
        <div
          v-for="proc in procedures"
          :key="proc.id"
          class="group flex flex-col p-4 bg-[#1F1F27] rounded-xl border border-[#26262F] hover:border-[#30303B] transition-colors"
        >
          <div class="flex items-start justify-between">
            <div class="flex items-center gap-3">
              <div class="w-8 h-8 rounded-full bg-[#26262F] text-[#8B8B9B] flex items-center justify-center">
                <span class="i-lucide-activity w-4 h-4" />
              </div>
              <div>
                <p class="font-semibold text-white text-sm">{{ proc.name }}</p>
                <div class="flex items-center gap-3 mt-1">
                  <div class="flex items-center gap-1">
                    <span class="i-lucide-clock w-3.5 h-3.5 text-[#8B8B9B]" />
                    <span class="text-[11px] text-[#8B8B9B] font-medium">{{ proc.duration_minutes }} min</span>
                  </div>
                </div>
              </div>
            </div>
            <button @click="deleteProcedure(proc.id)" class="opacity-0 group-hover:opacity-100 p-1.5 text-[#8B8B9B] hover:text-red-400 hover:bg-red-400/10 rounded-md transition-all">
              <span class="i-lucide-trash-2 w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.custom-scrollbar::-webkit-scrollbar {
  width: 4px;
}
.custom-scrollbar::-webkit-scrollbar-track {
  background: transparent;
}
.custom-scrollbar::-webkit-scrollbar-thumb {
  background: #26262F;
  border-radius: 4px;
}
</style>
