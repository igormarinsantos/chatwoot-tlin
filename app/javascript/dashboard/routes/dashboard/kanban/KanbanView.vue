<script setup>
import { computed, onMounted, ref } from 'vue';
import { useStore } from 'vuex';
import { useI18n } from 'vue-i18n';
import draggable from 'vuedraggable';
import ContactCard from './ContactCard.vue';
import PipelineManager from './components/PipelineManager.vue';

const store = useStore();
const { t } = useI18n();

const showManager = ref(false);

const contacts = computed(() => store.getters['contacts/getContactsList']);
const customAttributes = computed(() => store.getters['attributes/getContactAttributes']);

const pipelineAttribute = computed(() => 
  customAttributes.value.find(attr => attr.attributeKey === 'pipeline_stage')
);

const stages = computed(() => {
  if (pipelineAttribute.value && pipelineAttribute.value.attributeValues) {
    return pipelineAttribute.value.attributeValues;
  }
  return ['Lead', 'Qualified', 'Proposal', 'Negotiation', 'Won', 'Lost'];
});

const getContactsByStage = (stage) => {
  return contacts.value.filter(contact => {
    const contactStage = contact.customAttributes?.pipeline_stage;
    if (!contactStage && stage === 'Lead') return true;
    return contactStage === stage;
  });
};

const onMove = (evt, stage) => {
  const { added } = evt;
  if (added) {
    const { element } = added;
    store.dispatch('contacts/update', {
      id: element.id,
      customAttributes: {
        ...element.customAttributes,
        pipeline_stage: stage,
      },
    });
  }
};

const ensurePipelineAttribute = async () => {
  if (!pipelineAttribute.value) {
    try {
      await store.dispatch('attributes/create', {
        attribute_display_name: 'Pipeline Stage',
        attribute_key: 'pipeline_stage',
        attribute_model: 'contact_attribute',
        attribute_display_type: 'list',
        attribute_values: ['Lead', 'Qualified', 'Proposal', 'Negotiation', 'Won', 'Lost'],
      });
    } catch (error) {
      console.error('Failed to create pipeline attribute', error);
    }
  }
};

onMounted(async () => {
  await store.dispatch('attributes/get');
  await store.dispatch('contacts/get');
  ensurePipelineAttribute();
});
</script>

<template>
  <div class="flex flex-col h-full w-full overflow-hidden bg-n-slate-2 p-8 gap-8">
    <header class="flex justify-between items-center">
      <div>
        <h1 class="text-3xl font-bold text-n-slate-12 tracking-tight">Vendas & Funil</h1>
        <p class="text-sm text-n-slate-10 mt-1">Gerencie seus leads e oportunidades de forma ágil.</p>
      </div>
      <div class="flex gap-3">
        <button class="px-4 py-2 bg-white border border-n-weak rounded-xl text-sm font-medium hover:bg-n-alpha-1 transition-colors">
          Configurar Etapas
        </button>
      </div>
    </header>

    <div class="flex flex-1 gap-6 overflow-x-auto pb-6 custom-scrollbar">
      <div
        v-for="stage in stages"
        :key="stage"
        class="flex flex-col w-80 flex-shrink-0 bg-white/50 rounded-2xl border border-n-weak shadow-sm"
      >
        <div class="p-5 flex items-center justify-between border-b border-n-weak bg-white/30 rounded-t-2xl">
          <h2 class="font-bold text-n-slate-12 text-sm">
            {{ stage }}
            <span class="ml-2 text-n-slate-9 font-normal text-xs">
              {{ getContactsByStage(stage).length }}
            </span>
          </h2>
          <button class="p-1 hover:bg-n-alpha-1 rounded-md transition-colors text-n-slate-8">
            <span class="i-lucide-more-horizontal size-4" />
          </button>
        </div>

        <draggable
          class="flex-1 p-4 overflow-y-auto flex flex-col gap-4 min-h-[200px]"
          :list="getContactsByStage(stage)"
          group="contacts"
          item-key="id"
          @change="(evt) => onMove(evt, stage)"
        >
          <template #item="{ element }">
            <ContactCard :contact="element" />
          </template>
        </draggable>

        <div class="p-4 border-t border-n-weak/50">
          <button class="w-full py-2 flex items-center justify-center gap-2 text-xs font-medium text-n-slate-9 hover:text-n-brand transition-colors">
            <span class="i-lucide-plus size-3" />
            Adicionar Lead
          </button>
        </div>
      </div>
      
      <button
        class="flex flex-col items-center justify-center w-80 flex-shrink-0 border-2 border-dashed border-n-weak rounded-2xl hover:border-n-brand/40 hover:bg-n-brand/5 transition-all group p-8"
        @click="showManager = true"
      >
        <div class="size-12 rounded-full bg-n-brand/10 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
          <span class="i-lucide-plus size-6 text-n-brand" />
        </div>
        <span class="font-bold text-n-slate-11 text-sm">Nova Etapa</span>
      </button>
    </div>

    <!-- Transition or just v-if for modal -->
    <PipelineManager
      v-if="showManager && pipelineAttribute"
      :attribute="pipelineAttribute"
      @close="showManager = false"
    />
  </div>
</template>

<style scoped>
.custom-scrollbar::-webkit-scrollbar {
  height: 8px;
}
.custom-scrollbar::-webkit-scrollbar-track {
  background: transparent;
}
.custom-scrollbar::-webkit-scrollbar-thumb {
  background: rgba(0, 0, 0, 0.05);
  border-radius: 10px;
}
.custom-scrollbar::-webkit-scrollbar-thumb:hover {
  background: rgba(0, 0, 0, 0.1);
}
</style>
