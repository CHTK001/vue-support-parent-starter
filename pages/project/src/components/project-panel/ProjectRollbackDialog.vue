<template>
  <ScDialog
    v-model="visible"
    :title="`回滚 · ${project?.projectName || ''}`"
    width="620px"
    append-to-body
    destroy-on-close
    layout="simple"
  >
    <div v-loading="loading" class="rollback-list">
      <div v-for="backup in backups" :key="backup.backupId" class="rollback-item">
        <div class="rollback-item__meta">
          <strong>{{ backup.backupTime }}</strong>
          <span>{{ formatSize(backup.size) }}</span>
          <p v-if="backup.note">{{ backup.note }}</p>
        </div>
        <ScButton size="small" type="warning" plain @click="$emit('rollback', backup)">回滚到此版本</ScButton>
      </div>
      <el-empty v-if="!loading && !backups.length" description="暂无备份" :image-size="60" />
    </div>
  </ScDialog>
</template>

<script setup lang="ts">
import { computed } from "vue";
import type {
  RemoteProject,
  RemoteProjectBackup,
} from "../../api/manage/remote";
import { formatSize } from "./projectPanelShared";

const props = defineProps<{
  modelValue: boolean;
  project: RemoteProject | null;
  backups: RemoteProjectBackup[];
  loading: boolean;
}>();

const emit = defineEmits<{
  (e: "rollback", backup: RemoteProjectBackup): void;
  (e: "update:modelValue", value: boolean): void;
}>();

const visible = computed({
  get: () => props.modelValue,
  set: value => emit("update:modelValue", value),
});
</script>

<style scoped lang="scss">
.rollback-list {
  display: grid;
  gap: 12px;
  max-height: 420px;
  overflow-y: auto;
}

.rollback-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 16px 18px;
  border-radius: 18px;
  background: rgba(248, 250, 252, 0.92);
  border: 1px solid rgba(226, 232, 240, 0.92);
}

.rollback-item__meta {
  display: grid;
  gap: 4px;

  strong {
    color: #0f172a;
    font-size: 14px;
  }

  span,
  p {
    margin: 0;
    color: #64748b;
    font-size: 12px;
  }
}
</style>
