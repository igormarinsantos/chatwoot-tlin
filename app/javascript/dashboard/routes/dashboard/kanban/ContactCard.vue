<script setup>
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import { useStore } from 'vuex';

const props = defineProps({
  contact: {
    type: Object,
    required: true,
  },
});

const { t } = useI18n();
const store = useStore();

const contactName = computed(() => props.contact.name || 'Unknown');
const email = computed(() => props.contact.email || '');
const phone = computed(() => props.contact.phoneNumber || '');

const appointmentAt = computed(() => props.contact.customAttributes?.appointment_at || '');
const professional = computed(() => props.contact.customAttributes?.appointment_professional || '');

const formattedAppointmentDate = computed(() => {
  if (!appointmentAt.value) return '';
  try {
    const date = new Date(appointmentAt.value);
    return date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
  } catch (e) {
    return appointmentAt.value;
  }
});

const isWhatsApp = computed(() => {
  const inboxes = props.contact.contactInboxes || [];
  return inboxes.some(i => i.inbox?.channelType === 'Channel::Whatsapp');
});

const lastActivityAt = computed(() => {
  if (!props.contact.lastActivityAt) return '';
  const date = new Date(props.contact.lastActivityAt * 1000);
  return date.toLocaleDateString('pt-BR');
});

const avatarUrl = computed(() => props.contact.thumbnail || '');

const nextAction = computed(() => props.contact.customAttributes?.next_action || '');
const stagnantDays = computed(() => {
  const lastUpdateRaw = props.contact.updatedAt || props.contact.lastActivityAt;
  if (!lastUpdateRaw) return 0;
  const lastUpdate = new Date(lastUpdateRaw * 1000);
  const now = new Date();
  const diffTime = Math.abs(now - lastUpdate);
  return Math.floor(diffTime / (1000 * 60 * 60 * 24));
});

const isStagnant = computed(() => stagnantDays.value >= 3);

const openContact = () => {
  window.location.href = `/app/accounts/${store.getters['getCurrentAccountId']}/contacts/${props.contact.id}`;
};

const openConversation = () => {
  openContact();
};
</script>

<template>
  <div 
    class="bg-white dark:bg-n-solid-2 rounded-2xl p-4 shadow-sm hover:shadow-xl transition-all cursor-pointer border border-n-weak dark:border-n-weak/50 group relative overflow-hidden"
    :class="{ 'border-ruby-2 dark:border-ruby-900/50 bg-ruby-50/30 dark:bg-ruby-900/10': isStagnant }"
    @click="openContact"
  >
    <div v-if="isStagnant" class="absolute top-0 right-14 bg-ruby-9 text-white text-[8px] font-bold px-2 py-0.5 rounded-b-lg uppercase tracking-wider z-10 shadow-sm animate-pulse">
      Estagnado {{ stagnantDays }}d
    </div>

    <div class="flex items-start gap-3">
      <div class="relative">
        <img
          v-if="avatarUrl"
          :src="avatarUrl"
          class="size-11 rounded-full object-cover border border-n-weak group-hover:border-n-brand/50 transition-colors"
        />
        <div
          v-else
          class="size-11 rounded-full bg-n-brand/10 flex items-center justify-center text-n-brand font-bold text-lg"
        >
          {{ contactName.charAt(0).toUpperCase() }}
        </div>
        <div 
          v-if="isWhatsApp"
          class="absolute -bottom-1 -right-1 size-5 bg-[#25D366] rounded-full border-2 border-white dark:border-n-solid-2 flex items-center justify-center shadow-sm"
          title="WhatsApp Lead"
        >
          <span class="i-lucide-phone size-3 text-white" />
        </div>
        <div v-else class="absolute -bottom-1 -right-1 size-5 bg-white dark:bg-n-solid-2 rounded-full border border-n-weak flex items-center justify-center shadow-sm">
          <span class="i-lucide-message-circle size-3 text-n-brand" />
        </div>
      </div>

      <div class="flex-1 min-w-0">
        <div class="flex justify-between items-start mb-1 gap-2">
          <h3 class="font-bold text-n-slate-12 truncate text-sm leading-tight group-hover:text-n-brand transition-colors">
            {{ contactName }}
          </h3>
        </div>
        
        <p class="text-[11px] text-n-slate-10 truncate mb-3 flex items-center gap-1">
          <span v-if="phone" class="i-lucide-phone size-3 opacity-50 ltr:mr-0.5" />
          <span v-else-if="email" class="i-lucide-mail size-3 opacity-50 ltr:mr-0.5" />
          {{ phone || email || t('CONTACT_PANEL.NO_TEXT') }}
        </p>

        <div v-if="nextAction" class="mb-3 px-3 py-1.5 bg-n-brand/5 dark:bg-n-brand/10 border border-n-brand/20 dark:border-n-brand/30 rounded-xl flex items-center gap-2 shadow-sm">
          <span class="i-lucide-zap size-3 text-n-brand" />
          <span class="text-[10px] font-bold text-n-brand uppercase truncate tracking-tight">{{ nextAction }}</span>
        </div>

        <div v-if="appointmentAt || professional" class="mb-3 flex flex-wrap gap-2">
          <div v-if="appointmentAt" class="flex items-center gap-1 px-2 py-0.5 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700/50 rounded-lg">
            <span class="i-lucide-calendar size-3 text-amber-600 dark:text-amber-400" />
            <span class="text-[10px] font-bold text-amber-700 dark:text-amber-300 uppercase tracking-tight">
              {{ formattedAppointmentDate }}
            </span>
          </div>
          <div v-if="professional" class="flex items-center gap-1 px-2 py-0.5 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700/50 rounded-lg">
            <span class="i-lucide-user size-3 text-blue-600 dark:text-blue-400" />
            <span class="text-[10px] font-bold text-blue-700 dark:text-blue-300 truncate max-w-[80px]">
              {{ professional }}
            </span>
          </div>
        </div>

        <div class="flex items-center justify-between mt-auto">
          <div class="flex gap-1 flex-wrap max-w-[70%]">
            <template v-if="contact.labels && contact.labels.length">
              <span
                v-for="label in contact.labels"
                :key="label"
                class="px-1.5 py-0.5 bg-n-brand/10 border border-n-brand/30 rounded-md text-[9px] text-n-brand font-bold uppercase tracking-wider"
              >
                {{ label }}
              </span>
            </template>
            <span v-else class="text-[9px] text-n-slate-8 italic">Sem etiquetas</span>
          </div>
          
          <span class="text-[8px] text-n-slate-9 font-bold uppercase opacity-60 group-hover:opacity-100 transition-opacity whitespace-nowrap ml-2">
            {{ lastActivityAt }}
          </span>
        </div>
      </div>
    </div>

    <!-- Hover shortcut -->
    <div class="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-all translate-x-2 group-hover:translate-x-0">
      <button 
        class="size-8 rounded-full bg-n-brand text-white flex items-center justify-center shadow-lg hover:bg-n-brand-strong active:scale-95 transition-all"
        @click.stop="openConversation"
        title="Abrir Conversa"
      >
        <span class="i-lucide-external-link size-4" />
      </button>
    </div>
  </div>
</template>

<style scoped>
.group:hover {
  border-color: #B597FF;
  transform: translateY(-2px);
}
</style>
