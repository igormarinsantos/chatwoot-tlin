<script setup>
import { useI18n } from 'vue-i18n';
import ButtonNext from 'next/button/Button.vue';

const { t } = useI18n();
</script>

<template>
  <div class="flex-1 overflow-auto p-8">
    <header class="mb-8">
      <h1 class="text-3xl font-bold text-n-slate-12 mb-2">Integração de Agenda Externa</h1>
      <p class="text-n-slate-10">Conecte sua agenda do Google ou Outlook para sincronizar compromissos automaticamente.</p>
    </header>

    <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
      <!-- Google Calendar -->
      <div class="p-8 bg-white dark:bg-n-solid-2 rounded-3xl border border-n-weak flex flex-col items-center text-center group hover:border-n-brand transition-all">
        <div class="size-20 rounded-2xl bg-n-slate-1 dark:bg-n-solid-3 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
          <span class="i-lucide-calendar size-10 text-blue-600" />
        </div>
        <h3 class="text-xl font-bold text-n-slate-12 mb-2">Google Calendar</h3>
        <p class="text-sm text-n-slate-10 mb-8 max-w-[240px]">Sincronize seus eventos e consultas com o Google Calendar em tempo real.</p>
        <span class="px-3 py-1 bg-n-slate-2 dark:bg-n-solid-3 text-n-slate-11 text-xs font-bold rounded-full mb-4">EM BREVE</span>
        <ButtonNext variant="faded" color="slate" disabled class="w-full">
          Conectar Google Calendar
        </ButtonNext>
      </div>

      <!-- Outlook Calendar -->
      <div class="p-8 bg-white dark:bg-n-solid-2 rounded-3xl border border-n-weak flex flex-col items-center text-center group hover:border-n-brand transition-all">
        <div class="size-20 rounded-2xl bg-n-slate-1 dark:bg-n-solid-3 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
          <span class="i-lucide-calendar-days size-10 text-blue-500" />
        </div>
        <h3 class="text-xl font-bold text-n-slate-12 mb-2">Outlook Calendar</h3>
        <p class="text-sm text-n-slate-10 mb-8 max-w-[240px]">Integre com sua conta Microsoft para gerenciar sua agenda de qualquer lugar.</p>
        <span class="px-3 py-1 bg-n-slate-2 dark:bg-n-solid-3 text-n-slate-11 text-xs font-bold rounded-full mb-4">EM BREVE</span>
        <ButtonNext variant="faded" color="slate" disabled class="w-full">
          Conectar Outlook
        </ButtonNext>
      </div>
    </div>

    <div class="mt-12 p-6 bg-n-iris-5/10 border border-n-iris-5/20 rounded-2xl flex gap-4 items-start">
      <span class="i-lucide-info size-6 text-n-iris-9 flex-shrink-0 mt-1" />
      <div>
        <h4 class="font-bold text-n-iris-12 mb-1">Dica de Produtividade</h4>
        <p class="text-sm text-n-iris-11">Enquanto a integração direta está em desenvolvimento, você pode usar os novos custom attributes em cada contato para gerenciar sua agenda localmente no painel <b>Tlin | Agenda</b>.</p>
      </div>
    </div>
  </div>
</template>
