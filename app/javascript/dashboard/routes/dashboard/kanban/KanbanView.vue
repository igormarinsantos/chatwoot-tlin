<script setup>
import { computed, onMounted } from 'vue';
import { useStore } from 'vuex';
import { useI18n } from 'vue-i18n';
import draggable from 'vuedraggable';
import ConversationCard from './ConversationCard.vue';

const store = useStore();
const { t } = useI18n();

const conversations = computed(() => store.getters.getAllConversations);

const columns = computed(() => [
  { id: 'open', title: t('CONVERSATION.HEADER.OPEN_ACTION'), status: 'open' },
  { id: 'pending', title: t('CONVERSATION.RESOLVE_DROPDOWN.MARK_PENDING'), status: 'pending' },
  { id: 'snoozed', title: t('CONVERSATION.HEADER.SNOOZED_UNTIL'), status: 'snoozed' },
  { id: 'resolved', title: t('CONVERSATION.HEADER.RESOLVE_ACTION'), status: 'resolved' },
]);

const getConversationsByStatus = (status) => {
  return conversations.value.filter(conv => conv.status === status);
};

const onMove = (evt, status) => {
  const { added } = evt;
  if (added) {
    const { element } = added;
    store.dispatch('updateConversation', {
      id: element.id,
      status: status,
    });
  }
};

onMounted(() => {
  store.dispatch('fetchAllConversations');
});
</script>

<template>
  <div class="flex flex-col h-full w-full overflow-hidden p-6 gap-6">
    <header class="flex justify-between items-center">
      <h1 class="text-2xl font-bold text-n-slate-12">Pipeline</h1>
    </header>

    <div class="flex flex-1 gap-6 overflow-x-auto pb-4">
      <div
        v-for="column in columns"
        :key="column.id"
        class="flex flex-col w-80 flex-shrink-0 bg-n-alpha-1 rounded-2xl premium-border"
      >
        <div class="p-4 flex items-center justify-between border-b border-n-weak">
          <h2 class="font-semibold text-n-slate-11 uppercase text-xs tracking-wider">
            {{ column.title }}
            <span class="ml-2 px-2 py-0.5 bg-n-alpha-2 rounded-full text-[10px]">
              {{ getConversationsByStatus(column.status).length }}
            </span>
          </h2>
        </div>

        <draggable
          class="flex-1 p-3 overflow-y-auto flex flex-col gap-3 min-h-[100px]"
          :list="getConversationsByStatus(column.status)"
          group="conversations"
          item-key="id"
          @change="(evt) => onMove(evt, column.status)"
        >
          <template #item="{ element }">
            <ConversationCard :conversation="element" />
          </template>
        </draggable>
      </div>
    </div>
  </div>
</template>

<style scoped>
.premium-border {
  backdrop-filter: blur(10px);
  background: rgba(255, 255, 255, 0.4);
}
</style>
