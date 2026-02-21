<script setup>
import { computed } from 'vue';

const props = defineProps({
  conversation: {
    type: Object,
    required: true,
  },
});

const contactName = computed(() => props.conversation.meta.sender.name || 'Unknown');
const lastMessage = computed(() => {
  const lastMsg = props.conversation.messages[props.conversation.messages.length - 1];
  return lastMsg ? lastMsg.content : 'No messages';
});
const inboxName = computed(() => props.conversation.inbox_name || 'Inbox');
const lastActivityAt = computed(() => {
  const date = new Date(props.conversation.last_activity_at * 1000);
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
});

const avatarUrl = computed(() => props.conversation.meta.sender.thumbnail || '');
</script>

<template>
  <div class="bg-white rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow cursor-pointer border border-n-weak group">
    <div class="flex items-start gap-3">
      <div class="relative">
        <img
          v-if="avatarUrl"
          :src="avatarUrl"
          class="size-10 rounded-full object-cover border border-n-weak"
        />
        <div
          v-else
          class="size-10 rounded-full bg-n-brand/10 flex items-center justify-center text-n-brand font-bold text-sm"
        >
          {{ contactName.charAt(0).toUpperCase() }}
        </div>
        <div class="absolute -bottom-1 -right-1 size-4 bg-white rounded-full flex items-center justify-center shadow-sm">
           <span class="i-lucide-message-square size-2.5 text-n-slate-10" />
        </div>
      </div>

      <div class="flex-1 min-w-0">
        <div class="flex justify-between items-start mb-1">
          <h3 class="font-bold text-n-slate-12 truncate text-sm">
            {{ contactName }}
          </h3>
          <span class="text-[10px] text-n-slate-9 font-medium uppercase tracking-tight">
            {{ lastActivityAt }}
          </span>
        </div>
        
        <p class="text-xs text-n-slate-10 line-clamp-2 mb-3 leading-relaxed">
          {{ lastMessage }}
        </p>

        <div class="flex items-center gap-2 mt-auto">
          <span class="px-2 py-0.5 bg-n-alpha-1 border border-n-weak rounded text-[10px] text-n-slate-11 font-medium">
            {{ inboxName }}
          </span>
          <div v-if="conversation.labels && conversation.labels.length" class="flex gap-1 overflow-hidden">
            <span
              v-for="label in conversation.labels.slice(0, 1)"
              :key="label"
              class="px-2 py-0.5 bg-n-brand/5 border border-n-brand/20 rounded text-[10px] text-n-brand font-medium truncate"
            >
              #{{ label }}
            </span>
            <span v-if="conversation.labels.length > 1" class="text-[10px] text-n-slate-8">
              +{{ conversation.labels.length - 1 }}
            </span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.group:hover {
  border-color: #B597FF;
}
</style>
