<script setup lang="ts">
import { useI18n } from "vue-i18n";
import { ScButton } from "@repo/components";

const { t } = useI18n();

interface Props {
  /** 是否显示云同步 */
  showCloudSync: boolean;
  /** 云同步地址 */
  cloudSyncUrl: string;
  /** 同步加载状态 */
  syncLoading: boolean;
  /** 上传配置到云端 */
  syncToCloud: () => void;
  /** 从云端下载配置 */
  syncFromCloud: () => void;
}

defineProps<Props>();
</script>

<template>
  <!-- 云同步选项 -->
  <div v-if="showCloudSync" class="setting-group">
    <h4 class="group-title">
      <IconifyIconOnline icon="ri:cloud-line" class="group-icon" />
      {{ t("panel.cloudSync") || "云同步" }}
    </h4>
    <div class="reset-actions">
      <ScButton
        type="primary"
        plain
        :loading="syncLoading"
        @click="syncToCloud"
      >
        <IconifyIconOnline icon="ri:cloud-upload-line" />
        {{ t("panel.syncToCloud") || "上传到云端" }}
      </ScButton>
      <ScButton
        type="primary"
        plain
        :loading="syncLoading"
        @click="syncFromCloud"
      >
        <IconifyIconOnline icon="ri:cloud-download-line" />
        {{ t("panel.syncFromCloud") || "从云端下载" }}
      </ScButton>
    </div>
    <div v-if="cloudSyncUrl" class="cloud-sync-url">
      <span class="sync-url-label">
        {{ t("panel.syncUrl") || "同步地址" }}:
      </span>
      <span class="sync-url-value">{{ cloudSyncUrl }}</span>
    </div>
  </div>
</template>
