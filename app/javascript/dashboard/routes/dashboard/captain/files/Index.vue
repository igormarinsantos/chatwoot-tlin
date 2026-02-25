<script setup>
import { computed, onMounted, ref, nextTick } from 'vue';
import { useMapGetter, useStore } from 'dashboard/composables/store';
import { useRoute } from 'vue-router';
import { FEATURE_FLAGS } from 'dashboard/featureFlags';
import { useAccount } from 'dashboard/composables/useAccount';

import DeleteDialog from 'dashboard/components-next/captain/pageComponents/DeleteDialog.vue';
import FileCard from 'dashboard/components-next/captain/assistant/FileCard.vue';
import PageLayout from 'dashboard/components-next/captain/PageLayout.vue';
import CaptainPaywall from 'dashboard/components-next/captain/pageComponents/Paywall.vue';
import CreateFileDialog from 'dashboard/components-next/captain/pageComponents/file/CreateFileDialog.vue';
import FilePageEmptyState from 'dashboard/components-next/captain/pageComponents/emptyStates/FilePageEmptyState.vue';
import FeatureSpotlightPopover from 'dashboard/components-next/feature-spotlight/FeatureSpotlightPopover.vue';

const route = useRoute();
const store = useStore();

const { isOnChatwootCloud } = useAccount();
const uiFlags = useMapGetter('captainFiles/getUIFlags');
const files = useMapGetter('captainFiles/getRecords');
const isFetching = computed(() => uiFlags.value.fetchingList);
const filesMeta = useMapGetter('captainFiles/getMeta');

const selectedAssistantId = computed(() => Number(route.params.assistantId));

const selectedFile = ref(null);
const deleteFileDialog = ref(null);

const handleDelete = () => {
  deleteFileDialog.value.dialogRef.open();
};

const showCreateDialog = ref(false);
const createFileDialog = ref(null);

const handleCreateFile = () => {
  showCreateDialog.value = true;
  nextTick(() => createFileDialog.value.dialogRef.open());
};

const handleCreateDialogClose = () => {
  showCreateDialog.value = false;
};

const handleAction = ({ action, id }) => {
  selectedFile.value = files.value.find(
    captainFile => id === captainFile.id
  );

  nextTick(() => {
    if (action === 'delete') {
      handleDelete();
    }
  });
};

const fetchFiles = (page = 1) => {
  const filterParams = { page };

  if (selectedAssistantId.value) {
    filterParams.assistantId = selectedAssistantId.value;
  }
  store.dispatch('captainFiles/get', filterParams);
};

const onPageChange = page => fetchFiles(page);

const onDeleteSuccess = () => {
  if (files.value?.length === 0 && filesMeta.value?.page > 1) {
    onPageChange(filesMeta.value.page - 1);
  }
};

onMounted(() => {
  fetchFiles();
});
</script>

<template>
  <PageLayout
    :header-title="$t('CAPTAIN.FILES.HEADER')"
    :button-label="$t('CAPTAIN.FILES.ADD_NEW')"
    :button-policy="['administrator']"
    :total-count="filesMeta?.totalCount || 0"
    :current-page="filesMeta?.page || 1"
    :show-pagination-footer="!isFetching && !!files.length"
    :is-fetching="isFetching"
    :is-empty="!files.length"
    :show-know-more="false"
    :feature-flag="FEATURE_FLAGS.CAPTAIN"
    @update:current-page="onPageChange"
    @click="handleCreateFile"
  >
    <template #knowMore>
      <FeatureSpotlightPopover
        :button-label="$t('CAPTAIN.HEADER_KNOW_MORE')"
        :title="$t('CAPTAIN.FILES.EMPTY_STATE.FEATURE_SPOTLIGHT.TITLE')"
        :note="$t('CAPTAIN.FILES.EMPTY_STATE.FEATURE_SPOTLIGHT.NOTE')"
        :hide-actions="!isOnChatwootCloud"
        fallback-thumbnail="/assets/images/dashboard/captain/document-popover-light.svg"
        fallback-thumbnail-dark="/assets/images/dashboard/captain/document-popover-dark.svg"
      />
    </template>

    <template #emptyState>
      <FilePageEmptyState @click="handleCreateFile" />
    </template>

    <template #paywall>
      <CaptainPaywall />
    </template>

    <template #body>
      <div class="flex flex-col gap-4">
        <FileCard
          v-for="file in files"
          :id="file.id"
          :key="file.id"
          :name="file.name"
          :description="file.description"
          :assistant="file.assistant"
          :created-at="file.created_at"
          @action="handleAction"
        />
      </div>
    </template>

    <CreateFileDialog
      v-if="showCreateDialog"
      ref="createFileDialog"
      :assistant-id="selectedAssistantId"
      @close="handleCreateDialogClose"
    />
    <DeleteDialog
      v-if="selectedFile"
      ref="deleteFileDialog"
      :entity="selectedFile"
      type="Files"
      @delete-success="onDeleteSuccess"
    />
  </PageLayout>
</template>
