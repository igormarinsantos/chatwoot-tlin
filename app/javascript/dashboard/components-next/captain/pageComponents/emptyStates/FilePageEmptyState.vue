<script setup>
import { useAccount } from 'dashboard/composables/useAccount';
import EmptyStateLayout from 'dashboard/components-next/EmptyStateLayout.vue';
import Button from 'dashboard/components-next/button/Button.vue';
import FileCard from 'dashboard/components-next/captain/assistant/FileCard.vue';
import FeatureSpotlight from 'dashboard/components-next/feature-spotlight/FeatureSpotlight.vue';

const emit = defineEmits(['click']);
const { isOnChatwootCloud } = useAccount();

const mockFiles = [
  { id: 1, name: 'Catálogo de Produtos', description: 'Catálogo com fotos e preços de toda a linha', created_at: Date.now() / 1000 },
  { id: 2, name: 'Menu Pizzaria', description: 'Todos os sabores e valores das pizzas', created_at: Date.now() / 1000 },
];

const onClick = () => {
  emit('click');
};
</script>

<template>
  <FeatureSpotlight
    :title="$t('CAPTAIN.FILES.EMPTY_STATE.FEATURE_SPOTLIGHT.TITLE')"
    :note="$t('CAPTAIN.FILES.EMPTY_STATE.FEATURE_SPOTLIGHT.NOTE')"
    fallback-thumbnail="/assets/images/dashboard/captain/document-light.svg"
    fallback-thumbnail-dark="/assets/images/dashboard/captain/document-dark.svg"
    :hide-actions="!isOnChatwootCloud"
    class="mb-8"
  />
  <EmptyStateLayout
    :title="$t('CAPTAIN.FILES.EMPTY_STATE.TITLE')"
    :subtitle="$t('CAPTAIN.FILES.EMPTY_STATE.SUBTITLE')"
    :action-perms="['administrator']"
  >
    <template #empty-state-item>
      <div class="grid grid-cols-1 gap-4 p-px overflow-hidden opacity-50 pointer-events-none">
        <FileCard
          v-for="(file, index) in mockFiles"
          :id="file.id"
          :key="`file-${index}`"
          :name="file.name"
          :description="file.description"
          :created-at="file.created_at"
        />
      </div>
    </template>
    <template #actions>
      <Button
        :label="$t('CAPTAIN.FILES.ADD_NEW')"
        icon="i-lucide-plus"
        @click="onClick"
      />
    </template>
  </EmptyStateLayout>
</template>
