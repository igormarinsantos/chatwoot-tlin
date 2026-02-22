<script setup>
import { computed, onMounted, ref, watch } from 'vue';
import { useStore } from 'vuex';
import { useI18n } from 'vue-i18n';
import draggable from 'vuedraggable';
import ContactCard from './ContactCard.vue';
import PipelineManager from './components/PipelineManager.vue';
import LeadSelector from './components/LeadSelector.vue';
import DropdownMenu from 'dashboard/components-next/dropdown-menu/DropdownMenu.vue';
import AgendaView from './AgendaView.vue';
import AppointmentModal from './components/AppointmentModal.vue';

const store = useStore();
const { t } = useI18n();

const showManager = ref(false);
const activeStageForLead = ref(null);
const activeDropdownStage = ref(null);
const viewMode = ref('kanban'); // 'kanban' or 'agenda'
const showAppointmentModal = ref(false);
const selectedDate = ref(new Date());

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

const appointmentAtAttribute = computed(() => 
  customAttributes.value.find(attr => attr.attributeKey === 'appointment_at')
);

const appointmentProfessionalAttribute = computed(() => 
  customAttributes.value.find(attr => attr.attributeKey === 'appointment_professional')
);

// Local state for draggable to work correctly
const localContactsByStage = ref({});

const syncLocalContacts = () => {
  const newMap = {};
  stages.value.forEach(stage => {
    newMap[stage] = contacts.value.filter(contact => {
      const contactStage = contact.customAttributes?.pipeline_stage;
      if (!contactStage && stage === 'Lead') return true;
      return contactStage === stage;
    });
  });
  localContactsByStage.value = newMap;
};

watch([contacts, stages], syncLocalContacts, { immediate: true });

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

const columnActions = (stage) => [
  {
    label: 'Configurar Etapas',
    value: 'configure',
    icon: 'i-lucide-settings',
    action: () => { showManager.value = true; activeDropdownStage.value = null; },
  }
];

const handleAction = (item) => {
  if (item.action) item.action();
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
  ensurePipelineAttribute();
});
</script>

<template>
  <div class="flex flex-col h-full w-full overflow-hidden bg-n-slate-2 dark:bg-n-solid-1 p-8 gap-8">
    <header class="flex justify-between items-center">
      <div>
        <h1 class="text-3xl font-bold text-n-slate-12 tracking-tight">Funil de Vendas</h1>
        <p class="text-sm text-n-slate-10 mt-1">Gerencie seus leads e oportunidades de forma ágil.</p>
      </div>
      <div class="flex gap-4 items-center">
        <div class="flex bg-white dark:bg-n-solid-2 p-1 rounded-2xl border border-n-weak">
          <button
            class="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all"
            :class="viewMode === 'kanban' ? 'bg-n-brand text-white shadow-lg shadow-n-brand/20' : 'text-n-slate-10 hover:text-n-slate-12'"
            @click="viewMode = 'kanban'"
          >
            <span class="i-lucide-layout-kanban size-4" />
            Funil
          </button>
          <button
            class="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all"
            :class="viewMode === 'agenda' ? 'bg-n-brand text-white shadow-lg shadow-n-brand/20' : 'text-n-slate-10 hover:text-n-slate-12'"
            @click="viewMode = 'agenda'"
          >
            <span class="i-lucide-calendar size-4" />
            Agenda
          </button>
        </div>
        <button
          class="px-5 py-2.5 bg-n-brand/10 text-n-brand border border-n-brand/20 rounded-xl text-sm font-bold hover:bg-n-brand/20 transition-all active:scale-95"
          @click="showManager = true"
        >
          Configurar Etapas
        </button>
      </div>
    </header>

    <div v-if="viewMode === 'kanban'" class="flex flex-1 gap-6 overflow-x-auto pb-6 custom-scrollbar">
      <div
        v-for="stage in stages"
        :key="stage"
        class="flex flex-col w-80 flex-shrink-0 bg-white/50 dark:bg-n-slate-11/10 rounded-2xl border border-n-weak shadow-sm"
      >
        <div class="p-5 flex items-center justify-between border-b border-n-weak bg-white/30 dark:bg-n-solid-2 rounded-t-2xl relative">
          <h2 class="font-bold text-n-slate-12 text-sm">
            {{ stage }}
            <span class="ml-2 text-n-slate-9 font-normal text-xs">
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
        @click="showManager = true"
      >
        <div class="size-12 rounded-full bg-n-brand/10 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
          <span class="i-lucide-plus size-6 text-n-brand" />
        </div>
        <span class="font-bold text-n-slate-11 text-sm">Nova Etapa</span>
      </button>
    </div>

    <div v-else class="flex-1 overflow-hidden">
      <AgendaView 
        @schedule="(date) => { selectedDate = date; showAppointmentModal = true; }"
        @select="(app) => { $router.push({ name: 'contact_profile', params: { contactId: app.id } }) }"
      />
    </div>

    <!-- Modals -->
    <AppointmentModal
      v-if="showAppointmentModal"
      :initial-date="selectedDate"
      @close="showAppointmentModal = false"
    />

    <!-- Transition or just v-if for modal -->
    <PipelineManager
      v-if="showManager && pipelineAttribute"
      :attribute="pipelineAttribute"
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
