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
  <div class="bg-[#18181E] rounded-2xl flex flex-col h-full border border-[#26262F]">
    <header class="p-6 border-b border-[#26262F]">
      <h3 class="text-white font-semibold text-lg">Configurações da Clínica</h3>
      <p class="text-[#8B8B9B] text-[10px] uppercase font-bold tracking-wider mt-0.5">Horários e Identidade</p>
    </header>

    <div class="p-6 space-y-8 flex-1 overflow-y-auto custom-scrollbar">
      <!-- Clinic Name -->
      <div class="space-y-2">
        <label class="text-xs font-semibold text-[#8B8B9B]">Nome da Clínica</label>
        <input
          v-model="localSettings.name"
          class="w-full px-4 py-3 bg-[#111115] border border-[#26262F] text-white rounded-xl outline-none focus:border-[#B597FF] text-sm placeholder-[#6C6C7D]"
          placeholder="Ex: Clínica Tlin Dental"
        />
      </div>

      <!-- Operating Hours -->
      <div class="space-y-4">
        <label class="text-xs font-semibold text-[#8B8B9B]">Horário de Funcionamento</label>
        <div class="space-y-2">
          <div v-for="day in days" :key="day.id" class="flex items-center justify-between p-3 rounded-xl bg-[#1F1F27] border border-[#26262F] hover:border-[#30303B] transition-colors">
            <span class="text-xs font-semibold text-white w-28">{{ day.name }}</span>
            <div class="flex items-center gap-2">
              <input
                v-model="localSettings.operating_hours[day.id].open"
                type="time"
                class="px-3 py-1.5 bg-[#111115] text-white border border-[#26262F] rounded-lg text-xs outline-none focus:border-[#B597FF]"
                :disabled="!localSettings.operating_hours[day.id].open && localSettings.operating_hours[day.id].open !== ''"
              />
              <span class="text-[#8B8B9B] text-xs">até</span>
              <input
                v-model="localSettings.operating_hours[day.id].close"
                type="time"
                class="px-3 py-1.5 bg-[#111115] text-white border border-[#26262F] rounded-lg text-xs outline-none focus:border-[#B597FF]"
              />
              <button 
                @click="localSettings.operating_hours[day.id].open = localSettings.operating_hours[day.id].open ? null : '08:00'"
                class="ml-3 text-[10px] font-bold tracking-wider uppercase transition-colors"
                :class="localSettings.operating_hours[day.id].open ? 'text-red-400 hover:text-red-300' : 'text-[#B597FF] hover:text-white'"
              >
                {{ localSettings.operating_hours[day.id].open ? 'Fechar' : 'Abrir' }}
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Integrations & Webhooks -->
      <div class="space-y-5 pt-8 border-t border-[#26262F]">
        <div>
          <h4 class="text-sm font-semibold text-white flex items-center gap-2">
            <span class="i-lucide-webhook w-4 h-4 text-[#B597FF]" />
            Integração & Webhooks
          </h4>
          <p class="text-xs text-[#8B8B9B] mt-1">Configure como o sistema conversa com influenciadores externos.</p>
        </div>

        <div class="p-5 bg-gradient-to-br from-[#B597FF]/5 to-transparent border border-[#B597FF]/20 rounded-xl space-y-4">
          <div class="space-y-2">
            <label class="text-[10px] font-bold text-[#B597FF] uppercase tracking-wider">Webhook de Destino (n8n, etc)</label>
            <div class="flex gap-3">
              <input
                v-model="localSettings.webhook_url"
                placeholder="https://sua-url-de-webhook.com/..."
                class="flex-1 px-4 py-2.5 bg-[#111115] border border-[#26262F] text-white rounded-lg outline-none focus:border-[#B597FF] text-sm placeholder-[#6C6C7D]"
              />
              <button @click="testWebhook" class="px-5 py-2.5 bg-[#26262F] hover:bg-[#30303B] text-white text-xs font-semibold rounded-lg transition-colors border border-[#30303B] whitespace-nowrap">
                Testar
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Footer Action -->
    <div class="p-6 border-t border-[#26262F] bg-[#111115] rounded-b-2xl">
      <button
        @click="saveSettings"
        class="w-full py-3 bg-[#B597FF] hover:bg-[#9d7cf0] text-white font-semibold rounded-xl transition-all shadow-lg shadow-[#B597FF]/10"
      >
        Salvar Configurações
      </button>
    </div>
  </div>
</template>

<style scoped>
.custom-scrollbar::-webkit-scrollbar {
  width: 4px;
}
.custom-scrollbar::-webkit-scrollbar-track {
  background: transparent;
}
.custom-scrollbar::-webkit-scrollbar-thumb {
  background: #26262F;
  border-radius: 4px;
}
</style>
