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
    let parsedHours = newVal.operating_hours;
    if (typeof parsedHours === 'string') {
      try { parsedHours = JSON.parse(parsedHours); } catch(e) { parsedHours = {}; }
    }
    
    // Ensure nested objects exist to prevent undefined errors in v-model
    const defaultOperatingHours = {
      monday: { open: '08:00', close: '18:00' },
      tuesday: { open: '08:00', close: '18:00' },
      wednesday: { open: '08:00', close: '18:00' },
      thursday: { open: '08:00', close: '18:00' },
      friday: { open: '08:00', close: '18:00' },
      saturday: { open: null, close: null },
      sunday: { open: null, close: null }
    };
    
    const safeHours = parsedHours && Object.keys(parsedHours).length > 0 
      ? { ...defaultOperatingHours, ...parsedHours } 
      : defaultOperatingHours;

    localSettings.value = { 
      ...newVal, 
      operating_hours: safeHours
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

      <!-- Integration & Webhooks -->
      <div class="space-y-6 pt-8 border-t border-n-weak dark:border-n-weak/50">
        <div class="flex items-center justify-between">
          <div>
            <h4 class="text-sm font-bold text-n-slate-12 flex items-center gap-2">
              <span class="i-lucide-webhook size-4 text-n-brand" />
              Integração via Webhooks (n8n/Make)
            </h4>
            <p class="text-[11px] font-medium text-n-slate-10 mt-1 max-w-xl">
              Configure URLs para receber notificações em tempo real. Cada evento disparado envia um JSON para o seu fluxo de automação, permitindo enviar mensagens no WhatsApp, e-mails ou integração com CRM.
            </p>
          </div>
        </div>

        <div class="grid md:grid-cols-2 gap-4">
          <!-- Webhook Settings -->
          <div class="space-y-4 p-5 bg-n-slate-1 dark:bg-n-solid-3 rounded-2xl border border-n-weak">
            <label class="text-xs font-bold text-n-slate-11 uppercase flex items-center gap-2">
              <span class="i-lucide-link size-4" />
              URL Base do Webhook (Recebimento)
            </label>
            <div class="flex gap-2">
              <input
                v-model="localSettings.webhook_url"
                placeholder="https://sua-url-n8n.com/webhook/..."
                class="flex-1 px-4 py-2.5 bg-white dark:bg-n-solid-2 border border-n-weak rounded-xl outline-none focus:border-n-brand text-sm shadow-sm"
              />
              <button @click="testWebhook" class="px-4 py-2.5 bg-n-brand/10 text-n-brand text-xs font-bold rounded-xl whitespace-nowrap hover:bg-n-brand/20 transition-colors">Testar</button>
            </div>
            <p class="text-[10px] text-n-slate-9 italic">Todos os eventos da tabela ao lado serão enviados para esta URL via método POST.</p>
          </div>

          <!-- Documentation / API Endpoints -->
          <div class="space-y-4 p-5 bg-n-brand/5 rounded-2xl border border-n-brand/20 relative overflow-hidden">
            <div class="absolute -right-4 -top-4 size-24 bg-n-brand/10 rounded-full blur-2xl"></div>
            <label class="text-xs font-bold text-n-brand uppercase flex items-center gap-2 relative z-10">
              <span class="i-lucide-code size-4" />
              API Endpoints (Envio)
            </label>
            <p class="text-[10px] text-n-slate-11/80 relative z-10">
              Para automatizar a <strong>criação</strong> de agendamentos vindos do WhatsApp (n8n), envie um POST para a URL abaixo com payload JSON.
            </p>
            <div class="flex items-center gap-2 relative z-10">
              <code class="flex-1 p-2 bg-white dark:bg-n-solid-2 shadow-sm rounded-lg text-[10px] font-mono text-n-brand border border-n-brand/20 overflow-x-auto whitespace-nowrap select-all cursor-text">
                POST http://localhost:4000/api/clinics/{{ settings?.id || '1' }}/holds
              </code>
            </div>
          </div>
        </div>

        <!-- Events List -->
        <div class="mt-4 border border-n-weak rounded-2xl overflow-hidden text-sm relative">
           <table class="w-full text-left">
             <thead class="bg-n-slate-1/50 dark:bg-n-solid-3/50 text-xs font-bold text-n-slate-10 uppercase">
               <tr>
                 <th class="px-4 py-3 border-b border-n-weak">Nome do Evento (event)</th>
                 <th class="px-4 py-3 border-b border-n-weak">Disparado Quando</th>
                 <th class="px-4 py-3 border-b border-n-weak">Status</th>
               </tr>
             </thead>
             <tbody class="divide-y divide-n-weak text-[11px] font-medium text-n-slate-11">
               <tr class="hover:bg-n-slate-1 dark:hover:bg-n-solid-3/30 transition-colors">
                 <td class="px-4 py-3 font-mono text-n-brand">appointment_created</td>
                 <td class="px-4 py-3">Iniciado agendamento via sistema ou paciente (Hold).</td>
                 <td class="px-4 py-3"><span class="px-2 py-0.5 bg-green-500/10 text-green-500 rounded-md font-bold">Ativo</span></td>
               </tr>
               <tr class="hover:bg-n-slate-1 dark:hover:bg-n-solid-3/30 transition-colors">
                 <td class="px-4 py-3 font-mono text-n-brand">appointment_confirmed</td>
                 <td class="px-4 py-3">Agendamento possui todos os dados firmes.</td>
                 <td class="px-4 py-3"><span class="px-2 py-0.5 bg-green-500/10 text-green-500 rounded-md font-bold">Ativo</span></td>
               </tr>
               <tr class="hover:bg-n-slate-1 dark:hover:bg-n-solid-3/30 transition-colors">
                 <td class="px-4 py-3 font-mono text-n-brand">appointment_updated</td>
                 <td class="px-4 py-3">Horário reagendado, status alterado em painel, etc.</td>
                 <td class="px-4 py-3"><span class="px-2 py-0.5 bg-green-500/10 text-green-500 rounded-md font-bold">Ativo</span></td>
               </tr>
               <tr class="hover:bg-n-slate-1 dark:hover:bg-n-solid-3/30 transition-colors">
                 <td class="px-4 py-3 font-mono text-n-brand">appointment_cancelled</td>
                 <td class="px-4 py-3">Horário cancelado e liberado da agenda.</td>
                 <td class="px-4 py-3"><span class="px-2 py-0.5 bg-green-500/10 text-green-500 rounded-md font-bold">Ativo</span></td>
               </tr>
             </tbody>
           </table>
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
