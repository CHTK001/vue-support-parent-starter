<template>
  <el-dialog
    v-model="dialogVisible"
    title="下载证书"
    width="400px"
    :close-on-click-modal="false"
  >
    <div class="download-options">
      <p class="domain-info">
        <IconifyIconOnline icon="mdi:certificate" />
        <span>{{ props.cert?.acmeCertPrimaryDomain }}</span>
      </p>
      <el-divider />
      <div class="download-list">
        <div class="download-item" @click="handleDownload('cert')">
          <div class="download-icon">
            <IconifyIconOnline icon="mdi:file-certificate" />
          </div>
          <div class="download-info">
            <div class="download-title">证书文件 (.crt)</div>
            <div class="download-desc">包含完整证书链的PEM格式证书</div>
          </div>
          <IconifyIconOnline icon="mdi:download" class="download-action" />
        </div>
        <div class="download-item" @click="handleDownload('key')">
          <div class="download-icon">
            <IconifyIconOnline icon="mdi:key" />
          </div>
          <div class="download-info">
            <div class="download-title">私钥文件 (.key)</div>
            <div class="download-desc">PEM格式的私钥文件</div>
          </div>
          <IconifyIconOnline icon="mdi:download" class="download-action" />
        </div>
        <div class="download-item" @click="handleDownload('chain')">
          <div class="download-icon">
            <IconifyIconOnline icon="mdi:link-variant" />
          </div>
          <div class="download-info">
            <div class="download-title">证书链文件 (_chain.crt)</div>
            <div class="download-desc">中间证书和根证书链</div>
          </div>
          <IconifyIconOnline icon="mdi:download" class="download-action" />
        </div>
      </div>
    </div>
    <template #footer>
      <el-button @click="dialogVisible = false">关闭</el-button>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { downloadCert, type AcmeCertificate } from "@/api/acme";

defineOptions({
  name: "DownloadDialog",
});

const props = defineProps<{
  visible: boolean;
  cert?: AcmeCertificate;
}>();

const emit = defineEmits<{
  "update:visible": [value: boolean];
}>();

const dialogVisible = computed({
  get: () => props.visible,
  set: (val) => emit("update:visible", val),
});

/**
 * 下载文件
 */
function handleDownload(fileType: string) {
  if (!props.cert?.acmeCertId) return;
  const url = downloadCert(props.cert.acmeCertId, fileType);
  window.open(url as unknown as string, "_blank");
}
</script>

<style scoped lang="scss">
.download-options {
  .domain-info {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 16px;
    font-weight: 500;
    color: var(--el-text-color-primary);

    svg {
      color: var(--el-color-primary);
      font-size: 24px;
    }
  }

  .download-list {
    display: flex;
    flex-direction: column;
    gap: 12px;
  }

  .download-item {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 12px;
    border: 1px solid var(--el-border-color);
    border-radius: 8px;
    cursor: pointer;
    transition: all 0.3s;

    &:hover {
      border-color: var(--el-color-primary);
      background-color: var(--el-color-primary-light-9);

      .download-action {
        color: var(--el-color-primary);
      }
    }

    .download-icon {
      width: 40px;
      height: 40px;
      border-radius: 8px;
      background-color: var(--el-color-primary-light-9);
      display: flex;
      align-items: center;
      justify-content: center;

      svg {
        font-size: 20px;
        color: var(--el-color-primary);
      }
    }

    .download-info {
      flex: 1;

      .download-title {
        font-weight: 500;
        color: var(--el-text-color-primary);
      }

      .download-desc {
        font-size: 12px;
        color: var(--el-text-color-secondary);
        margin-top: 4px;
      }
    }

    .download-action {
      font-size: 20px;
      color: var(--el-text-color-secondary);
    }
  }
}
</style>
