<script setup>
import { ref, watch, computed } from 'vue';
import { useStore } from 'vuex';

const store = useStore();
const settings = computed(() => store.getters['clinicScheduler/getClinicSettings']);

const localSettings = ref({
  name: '',
  webhook_url: '',
  operating_hours: {
    monday: { open: '08:00', close: '18:00' },
    tuesday: { open: '08:00', close: '18:00' },
    wednesday: { open: '08:00', close: '18:00' },
    thursday: { open: '08:00', close: '18:00' },
    friday: { open: '08:00', close: '18:00' },
    saturday: { open: null, close: null },
    sunday: { open: null, close: null }
  }
});

watch(settings, (newVal) => {
  if (newVal) {
    localSettings.value = { 
      ...newVal, 
      operating_hours: typeof newVal.operating_hours === 'string' 
        ? JSON.parse(newVal.operating_hours) 
        : newVal.operating_hours 
    };
  }
}, { immediate: true });

const saveSettings = () => {
  store.dispatch('clinicScheduler/updateClinicSettings', localSettings.value);
};

const days = [
  { id: 'monday', name: 'Segunda-feira' },
  { id: 'tuesday', name: 'Terça-feira' },
  { id: 'wednesday', name: 'Quarta-feira' },
  { id: 'thursday', name: 'Quinta-feira' },
  { id: 'friday', name: 'Sexta-feira' },
  { id: 'saturday', name: 'Sábado' },
  { id: 'sunday', name: 'Domingo' }
];

const testWebhook = async () => {
  if (!localSettings.value.webhook_url) {
    alert('Por favor, defina a URL do Webhook primeiro.');
    return;
  }
  try {
    const response = await fetch(localSettings.value.webhook_url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        event: 'test_webhook',
        timestamp: new Date().toISOString(),
        data: { message: 'Hello from Tlin.ai Clinic Agenda!' }
      })
    });
    if (response.ok) {
      alert('Webhook testado com sucesso!');
    } else {
      alert('O payload foi enviado, mas o webhook retornou um erro.');
    }
  } catch (error) {
    alert('Erro de rede ao testar o webhook. Verifique CORS ou a URL.');
  }
};
</script>

<template>
  <div class="bg-white dark:bg-n-solid-2 rounded-3xl border border-n-weak dark:border-n-weak/50 overflow-hidden shadow-sm">
    <header class="p-6 border-b border-n-weak dark:border-n-weak/50">
      <h3 class="text-lg font-bold text-n-slate-12">Configurações da Clínica</h3>
      <p class="text-xs text-n-slate-10 uppercase font-bold tracking-widest mt-1">Horários e Identidade</p>
    </header>

    <div class="p-6 space-y-8">
      <!-- Clinic Name -->
      <div class="space-y-3">
        <label class="text-sm font-bold text-n-slate-11">Nome da Clínica</label>
        <input
          v-model="localSettings.name"
          class="w-full px-4 py-2 bg-n-slate-1 dark:bg-n-solid-3 border border-n-weak rounded-xl outline-none focus:border-n-brand text-sm"
          placeholder="Ex: Clínica Tlin Dental"
        />
      </div>

      <!-- Operating Hours -->
      <div class="space-y-4">
        <label class="text-sm font-bold text-n-slate-11">Horário de Funcionamento</label>
        <div class="space-y-3">
          <div v-for="day in days" :key="day.id" class="flex items-center justify-between p-3 rounded-2xl bg-n-slate-1 dark:bg-n-solid-3/50 border border-transparent hover:border-n-weak transition-all">
            <span class="text-xs font-bold text-n-slate-12 w-28">{{ day.name }}</span>
            <div class="flex items-center gap-2">
              <input
                v-model="localSettings.operating_hours[day.id].open"
                type="time"
                class="px-2 py-1 bg-white dark:bg-n-solid-2 border border-n-weak rounded-lg text-xs outline-none"
                :disabled="!localSettings.operating_hours[day.id].open && localSettings.operating_hours[day.id].open !== ''"
              />
              <span class="text-n-slate-8">até</span>
              <input
                v-model="localSettings.operating_hours[day.id].close"
                type="time"
                class="px-2 py-1 bg-white dark:bg-n-solid-2 border border-n-weak rounded-lg text-xs outline-none"
              />
              <button 
                @click="localSettings.operating_hours[day.id].open = localSettings.operating_hours[day.id].open ? null : '08:00'"
                class="ml-2 text-[10px] font-bold"
                :class="localSettings.operating_hours[day.id].open ? 'text-red-500' : 'text-n-brand'"
              >
                {{ localSettings.operating_hours[day.id].open ? 'Fechar' : 'Abrir' }}
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Integraction & Webhooks -->
      <div class="space-y-6 pt-8 border-t border-n-weak dark:border-n-weak/50">
        <div>
          <h4 class="text-sm font-bold text-n-slate-12 flex items-center gap-2">
            <span class="i-lucide-webhook size-4 text-n-brand" />
            Integração & Webhooks
          </h4>
          <p class="text-xs text-n-slate-10 mt-1">Configure como o sistema conversa com influenciadores externos.</p>
        </div>

        <div class="p-4 bg-n-brand/5 rounded-2xl border border-n-brand/20 space-y-4">
          <div class="space-y-2">
            <label class="text-[10px] font-bold text-n-brand uppercase">Endpoints da API</label>
            <div class="flex items-center gap-2">
              <code class="flex-1 p-2 bg-white dark:bg-n-solid-2 rounded-lg text-[11px] font-medium border border-n-weak overflow-x-auto whitespace-nowrap">
                POST http://localhost:4000/api/clinics/{{ settings?.id }}/holds
              </code>
              <button class="p-2 hover:bg-n-brand/10 rounded-lg text-n-brand transition-colors">
                <span class="i-lucide-copy size-4" />
              </button>
            </div>
          </div>

          <div class="space-y-4">
            <label class="text-[10px] font-bold text-n-brand uppercase">Webhook de Destino (n8n, etc)</label>
            <div class="flex gap-2">
              <input
                v-model="localSettings.webhook_url"
                placeholder="https://sua-url-de-webhook.com/..."
                class="flex-1 px-4 py-2 bg-white dark:bg-n-solid-2 border border-n-weak rounded-xl outline-none focus:border-n-brand text-sm"
              />
              <button @click="testWebhook" class="px-4 py-2 bg-n-brand text-white text-xs font-bold rounded-xl whitespace-nowrap">Testar</button>
            </div>
          </div>
        </div>
      </div>

      <div class="pt-4 border-t border-n-weak dark:border-n-weak/50">
        <button
          @click="saveSettings"
          class="w-full py-3 bg-n-brand text-white font-bold rounded-2xl shadow-lg shadow-n-brand/20 hover:scale-[1.02] active:scale-95 transition-all"
        >
          Salvar Configurações
        </button>
      </div>
    </div>
  </div>
</template>
