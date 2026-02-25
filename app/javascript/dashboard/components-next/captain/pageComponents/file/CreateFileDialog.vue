<script setup>
import { ref } from 'vue';
import { useStore } from 'dashboard/composables/store';
import { useI18n } from 'vue-i18n';
import useVuelidate from '@vuelidate/core';
import { required } from '@vuelidate/validators';
import { useAlert } from 'dashboard/composables';

import Dialog from 'dashboard/components-next/dialog/Dialog.vue';
import DialogWrapper from 'dashboard/components-next/dialog/DialogWrapper.vue';
import Button from 'dashboard/components-next/button/Button.vue';
import Input from 'dashboard/components-next/input/Input.vue';
import TextArea from 'dashboard/components-next/textarea/TextArea.vue';
import FileUpload from 'dashboard/components-next/file-upload/FileUpload.vue';

const props = defineProps({
  assistantId: {
    type: Number,
    required: true,
  },
});

const emit = defineEmits(['close']);

const store = useStore();
const { t } = useI18n();

const state = ref({
  name: '',
  description: '',
  file: null,
});

const rules = {
  name: { required },
  description: { required },
  file: { required },
};

const v$ = useVuelidate(rules, state);
const isCreating = ref(false);
const dialogRef = ref(null);

const handleFileUpload = (file) => {
  state.value.file = file;
};

const removeFile = () => {
  state.value.file = null;
};

const createCaptainFile = async () => {
  v$.value.$touch();
  if (v$.value.$invalid) return;

  isCreating.value = true;
  try {
    const formData = new FormData();
    formData.append('captain_file[name]', state.value.name);
    formData.append('captain_file[description]', state.value.description);
    formData.append('captain_file[assistant_id]', props.assistantId);
    if (state.value.file) {
      formData.append('captain_file[file]', state.value.file);
    }

    // Call store action correctly depending on actual axios configuration
    // Often FormData is passed directly instead of the param object if using axios directly
    await store.dispatch('captainFiles/create', formData);
    
    useAlert(t('CAPTAIN.FILES.CREATE.SUCCESS_MESSAGE'));
    dialogRef.value.close();
  } catch (error) {
    const errorMessage =
      error?.message || t('CAPTAIN.FILES.CREATE.ERROR_MESSAGE');
    useAlert(errorMessage);
  } finally {
    isCreating.value = false;
  }
};

defineExpose({ dialogRef });
</script>

<template>
  <Dialog ref="dialogRef" @close="emit('close')">
    <DialogWrapper
      :title="$t('CAPTAIN.FILES.CREATE.TITLE')"
      :description="$t('CAPTAIN.FILES.FORM_DESCRIPTION')"
    >
      <div class="flex flex-col gap-5 px-6 pb-6">
        <Input
          v-model="state.name"
          :label="$t('CAPTAIN.FILES.FORM.NAME.LABEL')"
          :placeholder="$t('CAPTAIN.FILES.FORM.NAME.PLACEHOLDER')"
          :error="
            v$.name.$error ? $t('CAPTAIN.FILES.FORM.NAME.ERROR') : ''
          "
        />

        <TextArea
          v-model="state.description"
          :label="$t('CAPTAIN.FILES.FORM.DESCRIPTION.LABEL')"
          :placeholder="$t('CAPTAIN.FILES.FORM.DESCRIPTION.PLACEHOLDER')"
          :error="
            v$.description.$error ? $t('CAPTAIN.FILES.FORM.DESCRIPTION.ERROR') : ''
          "
        />

        <div class="flex flex-col gap-2">
          <label class="text-sm font-medium text-slate-800">
            {{ $t('CAPTAIN.FILES.FORM.FILE.LABEL') }}
          </label>
          <FileUpload
            v-if="!state.file"
            @file-uploaded="handleFileUpload"
          />
          <div v-else class="flex items-center gap-2 p-3 bg-slate-50 rounded border border-slate-200">
            <i class="i-ph-file-text text-xl text-slate-500" />
            <span class="flex-1 text-sm truncate">{{ state.file.name }}</span>
            <Button
              icon="i-lucide-x"
              color="slate"
              size="xs"
              variant="ghost"
              @click="removeFile"
            />
          </div>
          <p v-if="v$.file.$error" class="text-xs text-red-500">
            {{ $t('CAPTAIN.FILES.FORM.FILE.ERROR') }}
          </p>
        </div>
      </div>
      <template #footer>
        <div class="flex gap-2 justify-end px-6 pt-5 w-full">
          <Button
            :label="$t('CAPTAIN.FORM.CANCEL')"
            color="slate"
            variant="ghost"
            @click="dialogRef.close()"
          />
          <Button
            :label="$t('CAPTAIN.FORM.CREATE')"
            :is-loading="isCreating"
            @click="createCaptainFile"
          />
        </div>
      </template>
    </DialogWrapper>
  </Dialog>
</template>
