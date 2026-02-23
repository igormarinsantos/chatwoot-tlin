<script setup>
import { computed, onMounted } from 'vue';
import { useStore, useMapGetter } from 'dashboard/composables/store';
import { useRouter } from 'vue-router';
import { format, isToday } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const store = useStore();
const router = useRouter();

const currentUser = useMapGetter('getCurrentUser');
const notifications = computed(() => {
  const all = store.getters['notifications/getFilteredNotificationsV4']({ sortOrder: 'newest' });
  return all || [];
});
const contacts = computed(() => store.getters['contacts/getContactsList'] || []);

onMounted(async () => {
  await Promise.all([
    store.dispatch('notifications/index', { page: 1 }),
    store.dispatch('contacts/get'),
    store.dispatch('agents/get')
  ]);
});

const greeting = computed(() => {
  const hour = new Date().getHours();
  if (hour < 12) return 'Bom dia';
  if (hour < 18) return 'Boa tarde';
  return 'Boa noite';
});

const firstName = computed(() => currentUser.value?.name?.split(' ')[0] || '');

const stats = computed(() => {
  const unreadCount = notifications.value.filter(n => !n.readAt).length;
  const todayAppointments = contacts.value.filter(c => {
    const date = c.customAttributes?.appointment_at;
    return date && isToday(new Date(date));
  }).length;

  return [
    { label: 'Conversas Ativas', value: unreadCount, icon: 'i-lucide-message-circle', color: 'text-n-blue-9', bg: 'bg-n-blue-9/10' },
    { label: 'Compromissos Hoje', value: todayAppointments, icon: 'i-lucide-calendar', color: 'text-n-brand', bg: 'bg-n-brand/10' },
    { label: 'Novos Leads', value: contacts.value.length, icon: 'i-lucide-user-plus', color: 'text-n-iris-9', bg: 'bg-n-iris-9/10' },
  ];
});

const recentNotifications = computed(() => {
  return notifications.value.slice(0, 5);
});

const todayEvents = computed(() => {
  return contacts.value
    .filter(c => {
      const date = c.customAttributes?.appointment_at;
      return date && isToday(new Date(date));
    })
    .map(c => ({
      id: c.id,
      name: c.name,
      time: format(new Date(c.customAttributes.appointment_at), 'HH:mm'),
      type: c.customAttributes?.is_agenda_event ? 'evento' : 'consulta'
    }))
    .sort((a, b) => a.time.localeCompare(b.time));
});

const openConversation = (notification) => {
  const { primaryActorId, primaryActorType, primaryActor: { inboxId, id: conversationId } } = notification;
  router.push({
    name: 'inbox_view_conversation',
    params: { inboxId, type: 'conversation', id: conversationId },
  });
};

const goToAgenda = () => router.push({ name: 'agenda_view' });
const goToContacts = () => router.push({ name: 'contacts_dashboard_index' });
</script>

<template>
  <div class="flex-1 bg-n-slate-1 dark:bg-n-solid-1 overflow-y-auto p-4 md:p-8 custom-scroll">
    <!-- Header -->
    <header class="mb-6 md:mb-10 animate-in fade-in slide-in-from-top-4 duration-700">
      <h1 class="text-3xl md:text-4xl font-bold text-n-slate-12 tracking-tight">
        {{ greeting }}, <span class="bg-gradient-to-r from-n-brand to-n-iris-9 bg-clip-text text-transparent">{{ firstName }}</span>!
      </h1>
      <p class="text-n-slate-10 mt-2 text-base md:text-lg">Aqui está o que está acontecendo hoje na Tlin.</p>
    </header>

    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8">
      <!-- Left Column: Stats & Recent -->
      <div class="lg:col-span-2 space-y-6 md:space-y-8 order-2 lg:order-1">
        <!-- Stats Grid -->
        <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 animate-in fade-in slide-in-from-left-4 duration-700 delay-100">
          <div 
            v-for="stat in stats" 
            :key="stat.label"
            class="p-5 md:p-6 bg-white dark:bg-n-solid-2 rounded-3xl border border-n-weak hover:border-n-brand/30 transition-all hover:shadow-xl hover:shadow-n-brand/5 group"
          >
            <div :class="['size-10 md:size-12 rounded-2xl flex items-center justify-center mb-3 md:mb-4 transition-transform group-hover:scale-110', stat.bg]">
              <span :class="[stat.icon, stat.color, 'size-5 md:size-6']" />
            </div>
            <div class="text-2xl md:text-3xl font-black text-n-slate-12 mb-1">{{ stat.value }}</div>
            <div class="text-[10px] md:text-xs font-bold text-n-slate-10 uppercase tracking-wider">{{ stat.label }}</div>
          </div>
        </div>

        <!-- Recent Conversations -->
        <section class="bg-white dark:bg-n-solid-2 rounded-3xl border border-n-weak overflow-hidden shadow-sm animate-in fade-in slide-in-from-bottom-4 duration-700 delay-200">
          <header class="p-5 md:p-6 border-b border-n-weak flex items-center justify-between">
            <h2 class="text-lg md:text-xl font-bold text-n-slate-12 flex items-center gap-2">
              <span class="i-lucide-message-square size-5 text-n-brand" />
              Conversas Recentes
            </h2>
            <button @click="router.push({ name: 'inbox_view' })" class="text-xs font-bold text-n-brand hover:underline">Ver todas</button>
          </header>
          <div class="divide-y divide-n-weak">
            <div 
              v-for="notification in recentNotifications" 
              :key="notification.id"
              class="p-4 hover:bg-n-alpha-1 cursor-pointer transition-colors flex items-center gap-4 group"
              @click="openConversation(notification)"
            >
              <div class="size-10 rounded-full bg-n-slate-2 dark:bg-n-solid-3 flex items-center justify-center flex-shrink-0 group-hover:border-n-brand border border-transparent">
                <span class="i-lucide-user size-5 text-n-slate-9" />
              </div>
              <div class="flex-1 min-w-0">
                <div class="flex items-center justify-between gap-2">
                  <h4 class="font-bold text-n-slate-12 truncate">{{ notification.pushTitle }}</h4>
                  <span class="text-[10px] text-n-slate-9 font-medium">{{ format(new Date(notification.createdAt), 'HH:mm') }}</span>
                </div>
                <p class="text-sm text-n-slate-10 truncate mt-0.5">{{ notification.message?.content || 'Nova mensagem recebida' }}</p>
              </div>
            </div>
            <div v-if="recentNotifications.length === 0" class="p-10 md:p-12 text-center text-n-slate-9 italic">
              Nenhuma conversa recente encontrada.
            </div>
          </div>
        </section>
      </div>

      <!-- Right Column: Agenda & Actions -->
      <div class="space-y-6 md:space-y-8 animate-in fade-in slide-in-from-right-4 duration-700 delay-300 order-1 lg:order-2">
        <!-- Quick Actions -->
        <section class="bg-white dark:bg-n-solid-2 rounded-3xl border border-n-weak p-5 md:p-6 shadow-sm">
          <h2 class="text-lg md:text-xl font-bold text-n-slate-12 mb-4 md:mb-6 flex items-center gap-2">
            <span class="i-lucide-zap size-5 text-n-iris-9" />
            Ações Rápidas
          </h2>
          <div class="grid grid-cols-2 lg:grid-cols-1 gap-3">
            <button 
              @click="goToContacts"
              class="flex items-center justify-center lg:justify-start gap-3 p-3 md:p-4 bg-n-slate-1 dark:bg-n-solid-3 rounded-2xl hover:bg-n-brand hover:text-white transition-all group"
            >
              <span class="i-lucide-user-plus size-5 text-n-brand group-hover:text-white" />
              <span class="font-bold text-sm md:text-base">Novo Lead</span>
            </button>
            <button 
              @click="goToAgenda"
              class="flex items-center justify-center lg:justify-start gap-3 p-3 md:p-4 bg-n-slate-1 dark:bg-n-solid-3 rounded-2xl hover:bg-n-brand hover:text-white transition-all group"
            >
              <span class="i-lucide-calendar-plus size-5 text-n-brand group-hover:text-white" />
              <span class="font-bold text-sm md:text-base">Agendar</span>
            </button>
          </div>
        </section>

        <!-- Today's Agenda -->
        <section class="bg-white dark:bg-n-solid-2 rounded-3xl border border-n-weak overflow-hidden shadow-sm flex-1">
          <header class="p-5 md:p-6 border-b border-n-weak flex items-center justify-between bg-n-slate-1/50 dark:bg-n-solid-3/50">
            <h2 class="text-lg md:text-xl font-bold text-n-slate-12 flex items-center gap-2">
              <span class="i-lucide-calendar-days size-5 text-n-brand" />
              Hoje
            </h2>
            <button @click="goToAgenda" class="text-xs font-bold text-n-brand hover:underline">Ver agenda</button>
          </header>
          <div class="p-5 md:p-6 space-y-6">
            <div v-if="todayEvents.length === 0" class="flex flex-col items-center justify-center py-6 md:py-8 text-n-slate-9 gap-3">
              <span class="i-lucide-calendar-x size-8 md:size-10 opacity-20" />
              <p class="text-sm font-medium">Nada planejado para hoje.</p>
            </div>
            <div v-else class="space-y-4">
              <div 
                v-for="event in todayEvents" 
                :key="event.id"
                class="flex gap-4 items-start group"
              >
                <div class="w-12 text-sm font-bold text-n-brand pt-1">{{ event.time }}</div>
                <div class="flex-1 min-w-0">
                  <div class="font-bold text-n-slate-12 truncate group-hover:text-n-brand transition-colors text-sm md:text-base">{{ event.name }}</div>
                  <div class="text-[9px] md:text-[10px] uppercase font-black tracking-tighter text-n-slate-9 mt-0.5">{{ event.type }}</div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  </div>
</template>

<style scoped>
.custom-scroll::-webkit-scrollbar {
  width: 6px;
}
.custom-scroll::-webkit-scrollbar-thumb {
  background: var(--n-slate-3);
  border-radius: 10px;
}
.custom-scroll::-webkit-scrollbar-thumb:hover {
  background: var(--n-slate-4);
}
</style>
