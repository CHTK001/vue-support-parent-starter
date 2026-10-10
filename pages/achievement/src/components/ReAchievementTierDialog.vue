<script setup lang="ts">
/**
 * 成就段位编辑对话框组件
 */
import { message } from "@repo/core";
import { ref } from "vue";

import { saveTier, updateTier } from "../api/achievementApi";
import type { AchievementTier } from "../api/types";
import ReDialog from "@repo/ui/re-dialog";

const props = defineProps<{
  visible: boolean;
  isEdit: boolean;
  form: AchievementTier;
}>();

const emit = defineEmits<{
  (e: "update:visible", v: boolean): void;
  (e: "saved"): void;
}>();

const saving = ref(false);

async function handleSubmit() {
  if (!props.form.type || !props.form.name) {
    message.warning("Please enter type and name");
    return;
  }
  saving.value = true;
  try {
    if (props.isEdit) {
      await updateTier(props.form);
      message.success("Updated");
    } else {
      await saveTier(props.form);
      message.success("Created");
    }
    emit("update:visible", false);
    emit("saved");
  } catch (e) {
    message.error((e as Error)?.message ?? "Save failed");
  } finally {
    saving.value = false;
  }
}

</script>

<template>
  <ReDialog
    :model-value="visible"
    :title="isEdit ? 'Edit Tier' : 'Add Tier'"
    width="560"
    :close-on-click-modal="false"
    destroy-on-close
    class="!rounded-2xl"
    @update:model-value="emit('update:visible', $event)"
  >
    <el-form label-width="100px" :model="form">
      <el-form-item label="Type" required>
        <el-input v-model="form.type" placeholder="e.g. login, sign, message" :disabled="isEdit" class="!rounded-xl" />
      </el-form-item>
      <el-form-item label="Level" required>
        <el-input-number v-model="form.level" :min="1" :max="999" class="!w-full" />
      </el-form-item>
      <el-form-item label="Name" required>
        <el-input v-model="form.name" placeholder="e.g. Bronze Logger" class="!rounded-xl" />
      </el-form-item>
      <el-form-item label="Badge">
        <el-input v-model="form.badge" placeholder="Badge icon URL or emoji" class="!rounded-xl" />
      </el-form-item>
      <el-form-item label="Description">
        <el-input v-model="form.description" type="textarea" :rows="2" placeholder="Tier description" class="!rounded-xl" />
      </el-form-item>
      <el-form-item label="Rule">
        <el-input v-model="form.rule" placeholder="e.g. loginCount >= 7" class="!rounded-xl" />
      </el-form-item>
      <el-form-item label="Sort">
        <el-input-number v-model="form.sort" :min="0" class="!w-full" />
      </el-form-item>
      <el-form-item label="Status">
        <el-radio-group v-model="form.status">
          <el-radio :value="1" class="!text-emerald-500">Active</el-radio>
          <el-radio :value="0" class="!text-slate-400">Inactive</el-radio>
        </el-radio-group>
      </el-form-item>
    </el-form>
    <template #footer>
      <el-button class="!rounded-xl !border-slate-200 dark:!border-slate-600" @click="emit('update:visible', false)">Cancel</el-button>
      <el-button
        type="primary"
        :loading="saving"
        class="!rounded-xl !bg-gradient-to-r !from-violet-500 !to-indigo-600 !border-0"
        @click="handleSubmit"
      >
        Confirm
      </el-button>
    </template>
  </ReDialog>
</template>