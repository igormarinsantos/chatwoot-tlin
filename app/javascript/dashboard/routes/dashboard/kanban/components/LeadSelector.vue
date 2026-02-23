<script setup>
import { ref, computed, onMounted } from 'vue';
import { useStore } from 'vuex';

const props = defineProps({
  stage: {
    type: String,
    required: true,
  },
});

const emit = defineEmits(['close', 'select']);

const store = useStore();
const searchQuery = ref('');
const isSearching = ref(false);

const contacts = computed(() => store.getters['contacts/getContactsList']);

const filteredContacts = computed(() => {
  if (!searchQuery.value) return contacts.value.slice(0, 5);
  const query = searchQuery.value.toLowerCase();
  return contacts.value.filter(c => 
    c.name?.toLowerCase().includes(query) || 
    c.email?.toLowerCase().includes(query) || 
    c.phoneNumber?.includes(query)
  ).slice(0, 10);
});

const selectContact = async (contact) => {
  try {
    await store.dispatch('contacts/update', {
      id: contact.id,
      customAttributes: {
        ...(contact.customAttributes || {}),
        pipeline_stage: props.stage,
      },
    });
    emit('select', contact);
    emit('close');
  } catch (error) {
    console.error('Failed to add contact to funnel', error);
  }
};

onMounted(() => {
  store.dispatch('contacts/get');
});
</script>

<template>
  <div class="fixed inset-0 z-[110] flex items-center justify-center bg-n-slate-12/30 backdrop-blur-[2px]">
    <div class="bg-white dark:bg-n-solid-1 rounded-3xl w-full max-w-md shadow-2xl border border-n-weak dark:border-n-weak/50 overflow-hidden flex flex-col max-h-[60vh]">
      <header class="p-5 border-b border-n-weak dark:border-n-weak/50 flex justify-between items-center bg-n-slate-1 dark:bg-n-solid-2">
        <h3 class="text-lg font-bold text-n-slate-12">Adicionar ao CRM</h3>
        <button @click="$emit('close')" class="p-2 hover:bg-n-alpha-1 dark:hover:bg-n-alpha-2 rounded-full transition-colors">
          <span class="i-lucide-x size-5 text-n-slate-11" />
        </button>
      </header>

      <div class="p-4 border-b border-n-weak dark:border-n-weak/50 bg-white dark:bg-n-solid-1">
        <div class="relative">
          <span class="absolute ltr:left-3 rtl:right-3 top-1/2 -translate-y-1/2 i-lucide-search size-4 text-n-slate-9" />
          <input
            v-model="searchQuery"
            placeholder="Buscar contato (nome, e-mail...)"
            class="w-full ltr:pl-10 rtl:pr-10 px-4 py-2 bg-n-slate-1 dark:bg-n-solid-2 border border-n-weak dark:border-n-weak/50 rounded-xl focus:border-n-brand focus:ring-1 focus:ring-n-brand outline-none text-sm text-n-slate-12 placeholder:text-n-slate-9 transition-all"
            autofocus
          />
        </div>
      </div>

      <div class="flex-1 overflow-y-auto p-2 bg-white dark:bg-n-solid-1">
        <div v-if="filteredContacts.length === 0" class="p-8 text-center text-n-slate-9 text-sm">
          Nenhum contato encontrado.
        </div>
        <button
          v-for="contact in filteredContacts"
          :key="contact.id"
          @click="selectContact(contact)"
          class="w-full flex items-center gap-3 p-3 hover:bg-n-alpha-1 dark:hover:bg-n-alpha-2 rounded-xl transition-colors text-left group"
        >
          <div class="size-10 rounded-full bg-n-brand/10 flex items-center justify-center text-n-brand font-bold text-sm">
            {{ (contact.name || 'U').charAt(0).toUpperCase() }}
          </div>
          <div class="flex-1 min-w-0">
            <h4 class="font-bold text-n-slate-12 dark:text-n-slate-12 text-sm truncate group-hover:text-n-brand transition-colors">
              {{ contact.name || 'Sem nome' }}
            </h4>
            <p class="text-xs text-n-slate-10 dark:text-n-slate-11 truncate">
              {{ contact.email || contact.phoneNumber || 'Sem dados de contato' }}
            </p>
          </div>
          <span class="i-lucide-plus size-4 text-n-slate-8 opacity-0 group-hover:opacity-100 transition-opacity" />
        </button>
      </div>
      
      <footer class="p-4 bg-n-slate-1 dark:bg-n-solid-2 border-t border-n-weak dark:border-n-weak/50 text-center">
        <p class="text-[10px] text-n-slate-9 dark:text-n-slate-10">
          O contato será movido para a etapa: <span class="font-bold text-n-brand">{{ stage }}</span>
        </p>
      </footer>
    </div>
  </div>
</template>
