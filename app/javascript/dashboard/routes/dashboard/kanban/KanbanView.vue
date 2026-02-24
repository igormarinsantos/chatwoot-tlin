<script setup>
import { computed, onMounted, ref, watch } from 'vue';
import { useStore } from 'vuex';
import { useI18n } from 'vue-i18n';
import draggable from 'vuedraggable';
import ContactCard from './ContactCard.vue';
import PipelineManager from './components/PipelineManager.vue';
import LeadSelector from './components/LeadSelector.vue';
import DropdownMenu from 'dashboard/components-next/dropdown-menu/DropdownMenu.vue';

const store = useStore();
const { t } = useI18n();

const showManager = ref(false);
const activeStageForLead = ref(null);
const activeDropdownStage = ref(null);
const selectedPipelineId = ref(null);
const isCreatingPipeline = ref(false);

const contacts = computed(() => store.getters['contacts/getContactsList']);
const customAttributes = computed(() => store.getters['attributes/getContactAttributes']);
const pipelines = computed(() => store.getters['pipelines/getPipelines']);

const activePipeline = computed(() => {
  if (selectedPipelineId.value) {
    return pipelines.value.find(p => p.id === selectedPipelineId.value);
  }
  return pipelines.value[0];
});

const currentBoundAttributeKey = computed(() => activePipeline.value?.bound_attribute_key || 'pipeline_stage');

const pipelineAttribute = computed(() => 
  customAttributes.value.find(attr => attr.attributeKey === currentBoundAttributeKey.value)
);

const stages = computed(() => {
  if (pipelineAttribute.value && pipelineAttribute.value.attributeValues) {
    return pipelineAttribute.value.attributeValues;
  }
  return ['Lead', 'Qualificado', 'Proposta', 'Negociação', 'Ganhos', 'Perdas'];
});

const appointmentAtAttribute = computed(() => 
  customAttributes.value.find(attr => attr.attributeKey === 'appointment_at')
);

const nextActionAttribute = computed(() => 
  customAttributes.value.find(attr => attr.attributeKey === 'next_action')
);

// Local state for draggable to work correctly
const localContactsByStage = ref({});

const searchQuery = ref('');

const filteredContacts = computed(() => {
  if (!searchQuery.value) return contacts.value;
  const query = searchQuery.value.toLowerCase();
  return contacts.value.filter(c => 
    c.name?.toLowerCase().includes(query) || 
    c.email?.toLowerCase().includes(query) || 
    c.phoneNumber?.includes(query)
  );
});

const isUpdating = computed(() => store.getters['contacts/getUIFlags'].isUpdating);

const syncLocalContacts = () => {
  const newMap = {};
  stages.value.forEach(stage => {
    newMap[stage] = filteredContacts.value.filter(contact => {
      const contactStage = contact.customAttributes?.[currentBoundAttributeKey.value];
      if (!contactStage && stage === stages.value[0]) return true;
      return contactStage === stage;
    });
  });
  localContactsByStage.value = newMap;
};

watch([filteredContacts, stages, currentBoundAttributeKey], syncLocalContacts, { immediate: true });

const onMove = (evt, stage) => {
  const { added } = evt;
  if (added) {
    const { element } = added;
    store.dispatch('contacts/update', {
      id: element.id,
      customAttributes: {
        ...(element.customAttributes || {}),
        [currentBoundAttributeKey.value]: stage,
      },
    });
  }
};

const openPipelineManager = (mode = 'edit') => {
  isCreatingPipeline.value = mode === 'create';
  showManager.value = true;
};

const columnActions = (stage) => [
  {
    label: 'Configurar Etapas',
    value: 'configure',
    icon: 'i-lucide-settings',
    action: () => { openPipelineManager('edit'); activeDropdownStage.value = null; },
  }
];

const handleAction = (item) => {
  if (item.action) item.action();
};

const ensurePipelineAttribute = async () => {
  if (!pipelineAttribute.value && (!pipelines.value || pipelines.value.length === 0)) {
    try {
      await store.dispatch('attributes/create', {
        attribute_display_name: 'Pipeline Stage',
        attribute_key: 'pipeline_stage',
        attribute_model: 'contact_attribute',
        attribute_display_type: 'list',
        attribute_values: ['Lead', 'Qualificado', 'Proposta', 'Negociação', 'Ganhos', 'Perdas'],
      });
      // After creating default attribute, create default pipeline
      await store.dispatch('pipelines/create', {
        name: 'CRM',
        bound_attribute_key: 'pipeline_stage',
        is_attribute_driven: true,
      });
    } catch (error) {
      console.error('Failed to create default pipeline', error);
    }
  }

  if (!nextActionAttribute.value) {
    try {
      await store.dispatch('attributes/create', {
        attribute_display_name: 'Próxima Ação',
        attribute_key: 'next_action',
        attribute_model: 'contact_attribute',
        attribute_display_type: 'text',
      });
    } catch (error) {
      console.error('Failed to create next_action attribute', error);
    }
  }

  if (!appointmentAtAttribute.value) {
    try {
      await store.dispatch('attributes/create', {
        attribute_display_name: 'Data da Consulta',
        attribute_key: 'appointment_at',
        attribute_model: 'contact_attribute',
        attribute_display_type: 'date',
      });
    } catch (error) {
      console.error('Failed to create appointment_at attribute', error);
    }
  }

  if (!appointmentProfessionalAttribute.value) {
    try {
      await store.dispatch('attributes/create', {
        attribute_display_name: 'Profissional Responsável',
        attribute_key: 'appointment_professional',
        attribute_model: 'contact_attribute',
        attribute_display_type: 'list',
        attribute_values: store.getters['agents/getAgents'].map(a => a.name) || [],
      });
    } catch (error) {
      console.error('Failed to create appointment_professional attribute', error);
    }
  }
};

onMounted(async () => {
  await store.dispatch('attributes/get');
  await store.dispatch('contacts/get');
  await store.dispatch('agents/get');
  await store.dispatch('pipelines/get');
  ensurePipelineAttribute();
});
</script>

<template>
  <div class="flex flex-col h-full w-full overflow-hidden bg-n-slate-2 dark:bg-n-solid-1 p-8 gap-8">
    <header class="flex justify-between items-start">
      <div class="flex items-center gap-6">
        <div>
          <h1 class="text-3xl font-bold text-n-slate-12 tracking-tight">CRM</h1>
          <p class="text-sm text-n-slate-10 mt-1">Gerencie seus leads e oportunidades no funil de vendas.</p>
        </div>
        
        <div v-if="pipelines.length > 0" class="flex items-center gap-2 bg-white dark:bg-n-solid-2 border border-n-weak dark:border-n-weak/50 rounded-2xl px-4 py-2 shadow-sm transition-all hover:border-n-brand/30">
          <span class="i-lucide-layout-grid size-4 text-n-brand" />
          <select 
            v-model="selectedPipelineId" 
            class="bg-transparent text-sm font-bold text-n-slate-12 focus:outline-none cursor-pointer pr-2"
          >
            <option :value="null">Selecione o Funil...</option>
            <option v-for="p in pipelines" :key="p.id" :value="p.id">
              {{ p.name }}
            </option>
          </select>
        </div>
      </div>
      <div class="flex items-center gap-3">
        <div v-if="isUpdating" class="flex items-center gap-2 px-3 py-1.5 bg-n-brand/5 border border-n-brand/20 rounded-full animate-pulse">
          <span class="size-2 bg-n-brand rounded-full" />
          <span class="text-[10px] font-bold text-n-brand uppercase tracking-wider">Salvando...</span>
        </div>
        <div class="relative w-64">
          <span class="absolute ltr:left-3 rtl:right-3 top-1/2 -translate-y-1/2 i-lucide-search size-4 text-n-slate-9" />
          <input
            v-model="searchQuery"
            placeholder="Pesquisar leads..."
            class="w-full ltr:pl-10 rtl:pr-10 px-4 py-2.5 bg-white dark:bg-n-solid-2 border border-n-weak dark:border-n-weak/50 rounded-xl focus:border-n-brand focus:ring-1 focus:ring-n-brand outline-none text-sm text-n-slate-12 placeholder:text-n-slate-9 transition-all shadow-sm"
          />
        </div>
        <button
          class="px-5 py-2.5 bg-n-brand/10 text-n-brand border border-n-brand/20 rounded-xl text-sm font-bold hover:bg-n-brand/20 transition-all active:scale-95 whitespace-nowrap"
          @click="openPipelineManager('create')"
        >
          Novo Funil
        </button>
        <button
          class="px-5 py-2.5 bg-n-brand text-white rounded-xl text-sm font-bold hover:bg-n-brand-strong transition-all active:scale-95 shadow-lg shadow-n-brand/20"
          @click="openPipelineManager('edit')"
        >
          Configurar Etapas
        </button>
      </div>
    </header>

    <div class="flex flex-1 gap-6 overflow-x-auto pb-6 custom-scrollbar">
      <div
        v-for="stage in stages"
        :key="stage"
        class="flex flex-col w-80 flex-shrink-0 bg-white/50 dark:bg-n-slate-11/10 rounded-2xl border border-n-weak shadow-sm"
      >
        <div class="p-5 flex items-center justify-between border-b border-n-weak bg-white/30 dark:bg-n-solid-2 rounded-t-2xl relative">
          <h2 class="font-bold text-n-slate-12 text-sm flex items-center gap-2">
            {{ stage }}
            <span class="size-5 flex items-center justify-center bg-n-slate-3 dark:bg-n-solid-3 rounded-full text-[10px] text-n-slate-10 font-bold">
              {{ localContactsByStage[stage]?.length || 0 }}
            </span>
          </h2>
          <div class="relative">
            <button 
              class="p-1 hover:bg-n-alpha-1 rounded-md transition-colors text-n-slate-8"
              @click="activeDropdownStage = activeDropdownStage === stage ? null : stage"
            >
              <span class="i-lucide-more-horizontal size-4" />
            </button>
            <DropdownMenu
              v-if="activeDropdownStage === stage"
              class="top-8 right-0"
              :menu-items="columnActions(stage)"
              @action="handleAction"
            />
          </div>
        </div>

        <draggable
          class="flex-1 p-4 overflow-y-auto flex flex-col gap-4 min-h-[200px]"
          :list="localContactsByStage[stage]"
          group="contacts"
          item-key="id"
          @change="(evt) => onMove(evt, stage)"
        >
          <template #item="{ element }">
            <ContactCard :contact="element" />
          </template>
        </draggable>

        <div class="p-4 border-t border-n-weak/50">
          <button
            class="w-full py-2 flex items-center justify-center gap-2 text-xs font-medium text-n-slate-9 hover:text-n-brand transition-colors"
            @click="activeStageForLead = stage"
          >
            <span class="i-lucide-plus size-3" />
            Adicionar Lead
          </button>
        </div>
      </div>
      
      <button
        class="flex flex-col items-center justify-center w-80 flex-shrink-0 border-2 border-dashed border-n-weak rounded-2xl hover:border-n-brand/40 hover:bg-n-brand/5 transition-all group p-8"
        @click="openPipelineManager('create')"
      >
        <div class="size-12 rounded-full bg-n-brand/10 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
          <span class="i-lucide-plus size-6 text-n-brand" />
        </div>
        <span class="font-bold text-n-slate-11 text-sm">Criar Novo Funil</span>
      </button>
    </div>

    <!-- Modals -->

    <!-- Transition or just v-if for modal -->
    <PipelineManager
      v-if="showManager"
      :pipeline="isCreatingPipeline ? null : activePipeline"
      :attribute="isCreatingPipeline ? null : pipelineAttribute"
      @close="showManager = false"
    />

    <LeadSelector
      v-if="activeStageForLead"
      :stage="activeStageForLead"
      @close="activeStageForLead = null"
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
.dark .custom-scrollbar::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.1);
}
.custom-scrollbar::-webkit-scrollbar-thumb:hover {
  background: rgba(0, 0, 0, 0.1);
}
.dark .custom-scrollbar::-webkit-scrollbar-thumb:hover {
  background: rgba(255, 255, 255, 0.2);
}
</style>
