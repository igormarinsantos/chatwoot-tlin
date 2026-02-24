<script setup>
import { ref, computed } from 'vue';
import { useStore } from 'vuex';

const store = useStore();
const professionals = computed(() => store.getters['clinicScheduler/getProfessionals']);
const procedures = computed(() => store.getters['clinicScheduler/getProcedures']);
const isCreating = ref(false);
const editingProfessional = ref(null);
const newProfessional = ref({ id: null, name: '', color: 'blue', procedure_ids: [] });

const professionalColors = [
  { id: 'blue', hex: '#3b82f6', bgHex: '#dbeafe', textHex: '#1e40af' },
  { id: 'purple', hex: '#a855f7', bgHex: '#f3e8ff', textHex: '#6b21a8' },
  { id: 'pink', hex: '#ec4899', bgHex: '#fce7f3', textHex: '#9d174d' },
  { id: 'orange', hex: '#f97316', bgHex: '#ffedd5', textHex: '#c2410c' },
  { id: 'green', hex: '#22c55e', bgHex: '#dcfce7', textHex: '#166534' },
];

const addProfessional = async () => {
  if (!newProfessional.value.name.trim()) return;
  if (newProfessional.value.id) {
    await store.dispatch('clinicScheduler/updateProfessional', newProfessional.value);
  } else {
    await store.dispatch('clinicScheduler/createProfessional', newProfessional.value);
  }
  newProfessional.value = { id: null, name: '', color: 'blue', procedure_ids: [] };
  isCreating.value = false;
};

const editProfessional = (prof) => {
  newProfessional.value = { 
    id: prof.id, 
    name: prof.name, 
    color: prof.color || 'blue', 
    procedure_ids: prof.procedures?.map(p => p.id) || [] 
  };
  isCreating.value = true;
};

const deleteProfessional = async (id) => {
  if (confirm('Deseja excluir este profissional?')) {
    await store.dispatch('clinicScheduler/deleteProfessional', id);
  }
};

const toggleProcedure = (prof, procId) => {
  const currentIds = prof.procedures?.map(p => p.id) || [];
  const newIds = currentIds.includes(procId)
    ? currentIds.filter(id => id !== procId)
    : [...currentIds, procId];
  
  store.dispatch('clinicScheduler/updateProfessionalProcedures', {
    id: prof.id,
    procedure_ids: newIds
  });
};
</script>

<template>
  <div class="bg-white dark:bg-n-solid-2 rounded-3xl border border-n-weak dark:border-n-weak/50 overflow-hidden shadow-sm">
    <header class="p-6 border-b border-n-weak dark:border-n-weak/50 flex justify-between items-center">
      <div>
        <h3 class="text-lg font-bold text-n-slate-12">Profissionais</h3>
        <p class="text-xs text-n-slate-10 uppercase font-bold tracking-widest mt-1">Especialistas da Clínica</p>
      </div>
      <button
        @click="() => { newProfessional = { id: null, name: '', color: 'blue', procedure_ids: [] }; isCreating = true; }"
        class="size-10 bg-n-brand/10 text-n-brand rounded-xl flex items-center justify-center hover:bg-n-brand/20 transition-all"
      >
        <span class="i-lucide-plus size-5" />
      </button>
    </header>

    <div class="p-6 space-y-4">
      <!-- Create Flow -->
      <div v-if="isCreating" class="p-6 bg-n-slate-1 dark:bg-n-solid-3 rounded-2xl border border-n-brand/30 space-y-4 animate-in fade-in slide-in-from-top-2">
        <input
          v-model="newProfessional.name"
          placeholder="Nome do profissional..."
          class="w-full px-4 py-2 bg-white dark:bg-n-solid-2 border border-n-weak rounded-xl outline-none focus:border-n-brand focus:ring-1 focus:ring-n-brand text-sm"
        />

        <div class="space-y-2">
          <p class="text-xs font-bold text-n-slate-10">Cor de Identificação:</p>
          <div class="flex gap-2">
            <button
              v-for="color in professionalColors"
              :key="color.id"
              @click="newProfessional.color = color.id"
              class="size-8 rounded-full border-2 transition-all flex items-center justify-center"
              :class="[newProfessional.color === color.id ? 'scale-110 shadow-sm' : 'border-transparent']"
              :style="{ backgroundColor: color.bgHex, borderColor: newProfessional.color === color.id ? color.hex : 'transparent', color: color.hex }"
            >
              <span v-if="newProfessional.color === color.id" class="i-lucide-check size-4" />
            </button>
          </div>
        </div>
        
        <div class="space-y-2">
          <p class="text-xs font-bold text-n-slate-10">Procedimentos que atende:</p>
          <div class="flex flex-wrap gap-2">
            <button
              v-for="proc in procedures"
              :key="proc.id"
              @click="newProfessional.procedure_ids.includes(proc.id) 
                ? newProfessional.procedure_ids = newProfessional.procedure_ids.filter(id => id !== proc.id)
                : newProfessional.procedure_ids.push(proc.id)"
              class="px-3 py-1.5 rounded-lg text-[10px] font-bold border transition-all"
              :class="newProfessional.procedure_ids.includes(proc.id) 
                ? 'bg-n-brand text-white border-n-brand' 
                : 'bg-white dark:bg-n-solid-2 text-n-slate-9 border-n-weak'"
            >
              {{ proc.name }}
            </button>
          </div>
        </div>

        <div class="flex gap-2">
          <button @click="isCreating = false" class="flex-1 py-2 text-xs font-bold text-n-slate-10 hover:bg-n-alpha-1 rounded-lg">Cancelar</button>
          <button @click="addProfessional" class="flex-1 py-2 text-xs font-bold bg-n-brand text-white rounded-lg">Adicionar</button>
        </div>
      </div>

      <!-- List -->
      <div class="space-y-4">
        <div
          v-for="prof in professionals"
          :key="prof.id"
          class="group p-4 bg-n-slate-1 dark:bg-n-solid-3/50 hover:bg-white dark:hover:bg-n-solid-3 rounded-2xl border border-transparent hover:border-n-weak transition-all"
        >
          <div class="flex items-center justify-between mb-4">
            <div class="flex items-center gap-4">
              <div 
                class="size-10 rounded-full font-bold flex items-center justify-center"
                :style="`background-color: ${professionalColors.find(c => c.id === (prof.color || 'blue'))?.bgHex || '#dbeafe'}; color: ${professionalColors.find(c => c.id === (prof.color || 'blue'))?.textHex || '#1e40af'};`"
              >
                {{ prof.name.charAt(0).toUpperCase() }}
              </div>
              <div>
                <p class="font-bold text-n-slate-12 text-sm">{{ prof.name }}</p>
                <p class="text-[10px] text-n-slate-9 font-bold">PROFISSIONAL</p>
              </div>
            </div>
            <div class="opacity-0 group-hover:opacity-100 flex items-center gap-2 transition-all">
              <button @click="editProfessional(prof)" class="p-2 text-n-slate-8 hover:text-n-brand transition-all">
                <span class="i-lucide-edit size-4" />
              </button>
              <button @click="deleteProfessional(prof.id)" class="p-2 text-n-slate-8 hover:text-red-500 transition-all">
                <span class="i-lucide-trash-2 size-4" />
              </button>
            </div>
          </div>

          <div class="space-y-2 pl-14">
            <p class="text-[9px] font-bold text-n-slate-8 uppercase tracking-tighter">Atendimentos:</p>
            <div class="flex flex-wrap gap-1.5">
              <button
                v-for="proc in procedures"
                :key="proc.id"
                @click="toggleProcedure(prof, proc.id)"
                class="px-2 py-1 rounded-md text-[9px] font-bold border transition-all"
                :class="prof.procedures?.some(p => p.id === proc.id)
                  ? 'bg-n-brand/10 text-n-brand border-n-brand/20' 
                  : 'bg-white dark:bg-n-solid-4 text-n-slate-7 border-n-weak/50'"
              >
                {{ proc.name }}
              </button>
              <div v-if="!procedures.length" class="text-[9px] text-n-slate-8 italic">Cadastre procedimentos primeiro</div>
            </div>
          </div>
        </div>
      </div>

      <div v-if="!professionals.length && !isCreating" class="py-12 text-center space-y-3">
        <div class="size-12 bg-n-slate-3 dark:bg-n-solid-3 rounded-full flex items-center justify-center mx-auto grayscale opacity-50">
          <span class="i-lucide-users size-6" />
        </div>
        <p class="text-sm text-n-slate-9">Nenhum profissional cadastrado.</p>
      </div>
    </div>
  </div>
</template>
