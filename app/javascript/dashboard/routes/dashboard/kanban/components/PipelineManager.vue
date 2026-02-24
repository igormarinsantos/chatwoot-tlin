<script setup>
import { computed, ref } from 'vue';
import { useStore } from 'vuex';
import draggable from 'vuedraggable';

const props = defineProps({
  pipeline: {
    type: Object,
    default: null,
  },
  attribute: {
    type: Object,
    default: null,
  },
});

const emit = defineEmits(['close']);

const store = useStore();
const isNew = computed(() => !props.pipeline);
const localName = ref(props.pipeline?.name || '');
const localStages = ref([...(props.attribute?.attributeValues || ['Em Aberto', 'Ganhos', 'Perdas'])]);
const newStage = ref('');

const contacts = computed(() => store.getters['contacts/getContactsList']);
const boundAttributeKey = computed(() => props.pipeline?.bound_attribute_key || 'pipeline_stage');

const addStage = () => {
  const stageName = newStage.value.trim();
  if (stageName && !localStages.value.includes(stageName)) {
    localStages.value.push(stageName);
    newStage.value = '';
  }
};

const removeStage = (index) => {
  const stage = localStages.value[index];
  const contactsInStage = contacts.value.filter(c => c.customAttributes?.[boundAttributeKey.value] === stage);
  
  if (contactsInStage.length > 0) {
    alert(`Não é possível excluir a etapa "${stage}" pois ela possui ${contactsInStage.length} contatos vinculados. Por favor, mova os contatos antes de excluir.`);
    return;
  }
  localStages.value.splice(index, 1);
};

const savePipeline = async () => {
  if (!localName.value.trim()) return;

  try {
    if (isNew.value) {
      // 1. Create the custom attribute first
      // generate a slug from name
      const slug = localName.value.toLowerCase().trim().replace(/[^\w\s-]/g, '').replace(/[\s_-]+/g, '_').replace(/^-+|-+$/g, '');
      const attributeKey = `funnel_${slug}_${Date.now().toString().slice(-4)}`;
      
      await store.dispatch('attributes/create', {
        attribute_display_name: `${localName.value}`,
        attribute_key: attributeKey,
        attribute_model: 'contact_attribute',
        attribute_display_type: 'list',
        attribute_values: localStages.value,
      });

      // 2. Create the pipeline
      await store.dispatch('pipelines/create', {
        name: localName.value,
        bound_attribute_key: attributeKey,
        is_attribute_driven: true,
      });
    } else {
      // Update existing
      if (localName.value !== props.pipeline.name) {
        await store.dispatch('pipelines/update', {
          id: props.pipeline.id,
          name: localName.value,
        });
      }
      if (props.attribute) {
        await store.dispatch('attributes/update', {
          id: props.attribute.id,
          attribute_values: localStages.value,
        });
      }
    }
    emit('close');
  } catch (error) {
    console.error('Failed to save pipeline', error);
  }
};
</script>

<template>
  <div class="fixed inset-0 z-[100] flex items-center justify-center bg-n-slate-12/20 backdrop-blur-sm">
    <div class="bg-white dark:bg-n-solid-1 rounded-3xl w-full max-w-md shadow-2xl border border-n-weak dark:border-n-weak/50 overflow-hidden flex flex-col max-h-[80vh]">
      <header class="p-6 border-b border-n-weak dark:border-n-weak/50 flex justify-between items-center bg-n-slate-1 dark:bg-n-solid-2">
        <div>
          <h3 class="text-xl font-bold text-n-slate-12">{{ isNew ? 'Novo Funil' : 'Configurar Funil' }}</h3>
          <p class="text-xs text-n-slate-10 mt-1">Defina o nome e as etapas do seu processo de vendas.</p>
        </div>
        <button @click="$emit('close')" class="p-2 hover:bg-n-alpha-1 dark:hover:bg-n-alpha-2 rounded-full transition-colors">
          <span class="i-lucide-x size-5 text-n-slate-11" />
        </button>
      </header>

      <div class="flex-1 overflow-y-auto p-6 bg-white dark:bg-n-solid-1 space-y-6">
        <!-- Pipeline Name -->
        <div class="space-y-2">
          <label class="text-xs font-bold text-n-slate-11 uppercase tracking-wider">Nome do Funil</label>
          <input
            v-model="localName"
            placeholder="Ex: Vendas Internas, Recrutamento..."
            class="w-full px-4 py-3 rounded-xl border border-n-weak dark:border-n-weak/50 bg-n-slate-1 dark:bg-n-solid-2 focus:border-n-brand focus:ring-1 focus:ring-n-brand outline-none text-sm text-n-slate-12 placeholder:text-n-slate-9"
          />
        </div>

        <div class="space-y-2">
          <label class="text-xs font-bold text-n-slate-11 uppercase tracking-wider">Etapas</label>
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

          <div class="mt-4 flex gap-2">
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
      </div>

      <footer class="p-6 bg-n-slate-1 dark:bg-n-solid-2 border-t border-n-weak dark:border-n-weak/50 flex gap-3 text-center">
        <button
          @click="$emit('close')"
          class="flex-1 py-3 text-sm font-bold text-n-slate-11 dark:text-n-slate-11 hover:bg-n-alpha-1 dark:hover:bg-n-alpha-2 rounded-2xl transition-colors"
        >
          Cancelar
        </button>
        <button
          @click="savePipeline"
          class="flex-1 py-3 bg-n-brand text-white text-sm font-bold rounded-2xl hover:bg-n-brand-strong shadow-lg shadow-n-brand/20 transition-all active:scale-95 disabled:opacity-50"
          :disabled="!localName.trim() || localStages.length === 0"
        >
          {{ isNew ? 'Criar Funil' : 'Salvar Alterações' }}
        </button>
      </footer>
    </div>
  </div>
</template>
