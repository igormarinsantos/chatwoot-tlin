<script setup>
import { computed } from 'vue';

const props = defineProps({
  contact: {
    type: Object,
    required: true,
  },
});

const contactName = computed(() => props.contact.name || 'Unknown');
const email = computed(() => props.contact.email || '');
const phone = computed(() => props.contact.phoneNumber || '');
const lastActivityAt = computed(() => {
  if (!props.contact.lastActivityAt) return '';
  const date = new Date(props.contact.lastActivityAt * 1000);
  return date.toLocaleDateString();
});

const avatarUrl = computed(() => props.contact.thumbnail || '');
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
        
        <p class="text-xs text-n-slate-10 truncate mb-2">
          {{ email || phone || t('CONTACT_PANEL.NO_TEXT') }}
        </p>

        <div class="flex items-center gap-2 mt-auto">
          <div v-if="contact.labels && contact.labels.length" class="flex gap-1 overflow-hidden">
            <span
              v-for="label in contact.labels.slice(0, 2)"
              :key="label"
              class="px-2 py-0.5 bg-n-brand/5 border border-n-brand/20 rounded text-[10px] text-n-brand font-medium truncate"
            >
              #{{ label }}
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
