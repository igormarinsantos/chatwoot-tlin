<script setup>
import { computed, ref } from 'vue';
import { useStore } from 'vuex';
import draggable from 'vuedraggable';

const props = defineProps({
  attribute: {
    type: Object,
    required: true,
  },
});

const emit = defineEmits(['close']);

const store = useStore();
const localStages = ref([...(props.attribute.attributeValues || [])]);
const newStage = ref('');

const addStage = () => {
  const stageName = newStage.value.trim();
  if (stageName && !localStages.value.includes(stageName)) {
    localStages.value.push(stageName);
    newStage.value = '';
  }
};

const removeStage = (index) => {
  localStages.value.splice(index, 1);
};

const saveStages = async () => {
  try {
    await store.dispatch('attributes/update', {
      id: props.attribute.id,
      attribute_values: localStages.value,
    });
    emit('close');
  } catch (error) {
    console.error('Failed to update stages', error);
  }
};
</script>

<template>
  <div class="fixed inset-0 z-[100] flex items-center justify-center bg-n-slate-12/20 backdrop-blur-sm">
    <div class="bg-white dark:bg-n-solid-1 rounded-3xl w-full max-w-md shadow-2xl border border-n-weak dark:border-n-weak/50 overflow-hidden flex flex-col max-h-[80vh]">
      <header class="p-6 border-b border-n-weak dark:border-n-weak/50 flex justify-between items-center bg-n-slate-1 dark:bg-n-solid-2">
        <div>
          <h3 class="text-xl font-bold text-n-slate-12">Configurar CRM</h3>
          <p class="text-xs text-n-slate-10 mt-1">Arraste para reordenar ou adicione novas etapas.</p>
        </div>
        <button @click="$emit('close')" class="p-2 hover:bg-n-alpha-1 dark:hover:bg-n-alpha-2 rounded-full transition-colors">
          <span class="i-lucide-x size-5 text-n-slate-11" />
        </button>
      </header>

      <div class="flex-1 overflow-y-auto p-6 bg-white dark:bg-n-solid-1">
        <draggable
          v-model="localStages"
          class="flex flex-col gap-2"
          item-key="index"
          handle=".drag-handle"
        >
          <template #item="{ element, index }">
            <div class="flex items-center gap-3 p-3 bg-n-slate-1 dark:bg-n-solid-2 rounded-xl border border-n-weak dark:border-n-weak/50 group">
              <span class="drag-handle cursor-grab active:cursor-grabbing text-n-slate-8 group-hover:text-n-brand/60">
                <span class="i-lucide-grip-vertical size-4" />
              </span>
              <span class="flex-1 text-sm font-medium text-n-slate-11 dark:text-n-slate-12">{{ element }}</span>
              <button @click="removeStage(index)" class="p-1 hover:text-ruby-9 text-n-slate-8 transition-colors">
                <span class="i-lucide-trash-2 size-4" />
              </button>
            </div>
          </template>
        </draggable>

        <div class="mt-6 flex gap-2">
          <input
            v-model="newStage"
            placeholder="Nome da nova etapa..."
            class="flex-1 px-4 py-2 rounded-xl border border-n-weak dark:border-n-weak/50 bg-n-slate-1 dark:bg-n-solid-2 focus:border-n-brand focus:ring-1 focus:ring-n-brand outline-none text-sm text-n-slate-12 placeholder:text-n-slate-9"
            @keyup.enter="addStage"
          />
          <button
            @click="addStage"
            class="px-4 py-2 bg-n-brand/10 text-n-brand font-bold rounded-xl text-sm hover:bg-n-brand/20 transition-colors"
          >
            Adicionar
          </button>
        </div>
      </div>

      <footer class="p-6 bg-n-slate-1 dark:bg-n-solid-2 border-t border-n-weak dark:border-n-weak/50 flex gap-3 text-center">
        <button
          @click="$emit('close')"
          class="flex-1 py-3 text-sm font-bold text-n-slate-11 dark:text-n-slate-11 hover:bg-n-alpha-1 dark:hover:bg-n-alpha-2 rounded-2xl transition-colors"
        >
          Cancelar
        </button>
        <button
          @click="saveStages"
          class="flex-1 py-3 bg-n-brand text-white text-sm font-bold rounded-2xl hover:bg-n-brand-strong shadow-lg shadow-n-brand/20 transition-all active:scale-95"
        >
          Salvar Alterações
        </button>
      </footer>
    </div>
  </div>
</template>
