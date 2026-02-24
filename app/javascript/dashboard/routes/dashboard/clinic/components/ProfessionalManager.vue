<script setup>
import { ref, computed } from 'vue';
import { useStore } from 'vuex';

const store = useStore();
const professionals = computed(() => store.getters['clinicScheduler/getProfessionals']);
const procedures = computed(() => store.getters['clinicScheduler/getProcedures']);
const isCreating = ref(false);
const newProfessional = ref({ name: '', color: 'blue', procedure_ids: [] });

const professionalColors = [
  { id: 'blue', classes: 'bg-blue-500' },
  { id: 'purple', classes: 'bg-purple-500' },
  { id: 'pink', classes: 'bg-pink-500' },
  { id: 'orange', classes: 'bg-orange-500' },
  { id: 'green', classes: 'bg-green-500' },
];

const addProfessional = async () => {
  if (!newProfessional.value.name.trim()) return;
  await store.dispatch('clinicScheduler/createProfessional', newProfessional.value);
  newProfessional.value = { name: '', color: 'blue', procedure_ids: [] };
  isCreating.value = false;
};

const deleteProfessional = async (id) => {
  if (confirm('Deseja excluir este profissional?')) {
    await store.dispatch('clinicScheduler/deleteProfessional', id);
  }
};

const toggleProcedure = (procId) => {
  if (newProfessional.value.procedure_ids.includes(procId)) {
    newProfessional.value.procedure_ids = newProfessional.value.procedure_ids.filter(id => id !== procId);
  } else {
    newProfessional.value.procedure_ids.push(procId);
  }
};
</script>

<template>
  <div class="bg-[#18181E] rounded-2xl flex flex-col h-full border border-[#26262F]">
    <header class="p-5 flex justify-between items-center w-full">
      <div>
        <h3 class="text-white font-semibold text-lg">Profissionais</h3>
        <p class="text-[#8B8B9B] text-[10px] uppercase font-bold tracking-wider mt-0.5">Especialistas da Clínica</p>
      </div>
      <button
        @click="isCreating = true"
        class="w-8 h-8 rounded-full bg-[#26262F] flex items-center justify-center text-[#B597FF] hover:bg-[#30303B] transition-colors"
      >
        <span class="i-lucide-plus w-4 h-4" />
      </button>
    </header>

    <div class="p-5 space-y-4 flex-1 overflow-y-auto custom-scrollbar">
      <!-- Create Flow -->
      <div v-if="isCreating" class="p-5 bg-[#1F1F27] rounded-xl border border-[#26262F] space-y-4">
        <input
          v-model="newProfessional.name"
          placeholder="Nome do profissional.."
          class="w-full px-4 py-2.5 bg-[#18181E] border border-[#26262F] text-white rounded-lg outline-none focus:border-[#B597FF] text-sm placeholder-[#6C6C7D]"
        />
        
        <div class="space-y-2">
          <p class="text-xs text-[#8B8B9B]">Cor de Identificação:</p>
          <div class="flex gap-2">
            <button
              v-for="color in professionalColors"
              :key="color.id"
              @click="newProfessional.color = color.id"
              class="w-6 h-6 rounded-full flex items-center justify-center transition-transform hover:scale-110"
              :class="[color.classes, newProfessional.color === color.id ? 'ring-2 ring-white ring-offset-2 ring-offset-[#1F1F27]' : 'opacity-50 hover:opacity-100']"
            >
              <span v-if="newProfessional.color === color.id" class="i-lucide-check w-3 h-3 text-white" />
            </button>
          </div>
        </div>

        <div class="space-y-2">
          <p class="text-xs text-[#8B8B9B]">Procedimentos que atende:</p>
          <div class="flex flex-wrap gap-2">
            <button
              v-for="proc in procedures"
              :key="proc.id"
              @click="toggleProcedure(proc.id)"
              class="px-3 py-1.5 rounded-lg text-xs font-medium transition-colors border"
              :class="newProfessional.procedure_ids.includes(proc.id) 
                ? 'bg-[#B597FF] text-white border-[#B597FF]' 
                : 'bg-[#18181E] text-[#8B8B9B] border-[#26262F] hover:border-[#8B8B9B]'"
            >
              {{ proc.name }}
            </button>
          </div>
        </div>

        <div class="flex items-center gap-3 pt-2">
          <button @click="isCreating = false" class="text-[#8B8B9B] text-xs font-medium hover:text-white px-2">Cancelar</button>
          <button @click="addProfessional" class="flex-1 py-2.5 text-sm font-semibold bg-[#B597FF] text-white rounded-lg hover:bg-[#9d7cf0] transition-colors">Adicionar</button>
        </div>
      </div>

      <!-- List -->
      <div class="space-y-3">
        <div
          v-for="prof in professionals"
          :key="prof.id"
          class="group p-4 bg-[#1F1F27] rounded-xl border border-[#26262F] hover:border-[#30303B] transition-colors flex flex-col justify-between"
        >
          <div class="flex items-start justify-between">
            <div class="flex items-center gap-3">
              <div 
                class="w-8 h-8 rounded-full flex items-center justify-center text-white font-bold"
                :class="professionalColors.find(c => c.id === (prof.color || 'blue'))?.classes || 'bg-[#B597FF]'"
              >
                {{ prof.name.charAt(0).toUpperCase() }}
              </div>
              <div>
                <p class="font-semibold text-white text-sm">{{ prof.name }}</p>
                <p class="text-[9px] text-[#8B8B9B] font-bold tracking-wider">PROFISSIONAL</p>
              </div>
            </div>
            <button @click="deleteProfessional(prof.id)" class="opacity-0 group-hover:opacity-100 p-1.5 text-[#8B8B9B] hover:text-red-400 hover:bg-red-400/10 rounded-md transition-all">
              <span class="i-lucide-trash-2 w-4 h-4" />
            </button>
          </div>

          <div class="mt-4 pt-3 border-t border-[#26262F]">
            <p class="text-[9px] font-bold text-[#8B8B9B] uppercase tracking-wider mb-2">Atendimentos</p>
            <div class="flex flex-wrap gap-1.5">
              <div
                v-for="procId in (prof.procedures || []).map(p => p.id)"
                :key="procId"
                class="px-2.5 py-1 rounded bg-white text-[#111115] text-[10px] font-bold"
              >
                {{ procedures.find(p => p.id === procId)?.name || 'Desconhecido' }}
              </div>
            </div>
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
