<script setup>
import { onMounted } from 'vue';
import { useStore } from 'vuex';
import AgendaView from '../kanban/AgendaView.vue';
import AppointmentModal from '../kanban/components/AppointmentModal.vue';
import { ref } from 'vue';

const store = useStore();
const showAppointmentModal = ref(false);
const selectedDate = ref(new Date());

onMounted(async () => {
  await store.dispatch('contacts/get');
  await store.dispatch('agents/get');
  await store.dispatch('attributes/get');
  await store.dispatch('campaigns/get');

  // Ensure agenda attributes exist
  const contactAttributes = store.getters['attributes/getContactAttributes'];
  const requiredAttributes = [
    { key: 'appointment_at', displayName: 'Data do Compromisso', type: 'date' },
    { key: 'appointment_professional', displayName: 'Profissional', type: 'text' },
    { key: 'is_agenda_event', displayName: 'É Evento da Agenda?', type: 'checkbox' }
  ];

  for (const attr of requiredAttributes) {
    const exists = contactAttributes.find(a => a.attributeKey === attr.key);
    if (!exists) {
      try {
        await store.dispatch('attributes/create', {
          attribute_key: attr.key,
          attribute_display_name: attr.displayName,
          attribute_model: 'contact_attribute',
          attribute_display_type: attr.type === 'date' ? 2 : (attr.type === 'checkbox' ? 1 : 0),
          attribute_description: `Atributo para a Agenda: ${attr.displayName}`
        });
      } catch (e) {
        console.error(`Failed to create attribute ${attr.key}`, e);
      }
    }
  }
});
</script>

<template>
  <div class="flex-1 flex flex-col p-6 bg-n-slate-1 dark:bg-n-solid-1 overflow-hidden h-full">
    <header class="mb-8 overflow-hidden">
      <h1 class="text-3xl font-bold text-n-slate-12 mb-2">Agenda</h1>
      <p class="text-n-slate-10">Gerencie seus compromissos e eventos de forma centralizada.</p>
    </header>

    <div class="flex-1 overflow-hidden bg-white dark:bg-n-solid-2 rounded-3xl border border-n-weak p-2 md:p-6 shadow-sm">
      <AgendaView 
        @schedule="(date) => { selectedDate = date; showAppointmentModal = true; }"
        @select="(app) => { 
          if (app.conversation_id) {
            $router.push({ name: 'messages', params: { conversationId: app.conversation_id } });
          } else {
            $router.push({ name: 'contact_profile', params: { contactId: app.id } });
          }
        }"
      />
    </div>

    <AppointmentModal
      v-if="showAppointmentModal"
      :initial-date="selectedDate"
      @close="showAppointmentModal = false"
    />
  </div>
</template>
