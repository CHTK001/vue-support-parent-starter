<template>
  <sc-dialog
    v-model="dialogVisible"
    title=""
    width="480px"
    :close-on-click-modal="false"
    class="download-dialog"
    append-to-body
  >
    <template #header>
      <div class="dialog-header">
        <div class="header-icon">
          <IconifyIconOnline icon="mdi:download" />
        </div>
        <div class="header-info">
          <h3>下载证书</h3>
          <p>{{ props.cert?.acmeCertPrimaryDomain }}</p>
        </div>
      </div>
    </template>

    <div class="download-content">
      <div class="download-list">
        <div class="download-item" @click="handleDownload('cert')">
          <div class="item-icon cert">
            <IconifyIconOnline icon="mdi:file-certificate" />
          </div>
          <div class="item-info">
            <div class="item-title">证书文件</div>
            <div class="item-desc">certificate.crt · PEM格式完整证书链</div>
          </div>
          <div class="item-action">
            <IconifyIconOnline icon="mdi:download" />
          </div>
        </div>
        
        <div class="download-item" @click="handleDownload('key')">
          <div class="item-icon key">
            <IconifyIconOnline icon="mdi:key" />
          </div>
          <div class="item-info">
            <div class="item-title">私钥文件</div>
            <div class="item-desc">private.key · PEM格式私钥</div>
          </div>
          <div class="item-action">
            <IconifyIconOnline icon="mdi:download" />
          </div>
        </div>
        
        <div class="download-item" @click="handleDownload('chain')">
          <div class="item-icon chain">
            <IconifyIconOnline icon="mdi:link-variant" />
          </div>
          <div class="item-info">
            <div class="item-title">证书链文件</div>
            <div class="item-desc">ca_bundle.crt · 中间证书和根证书</div>
          </div>
          <div class="item-action">
            <IconifyIconOnline icon="mdi:download" />
          </div>
        </div>
      </div>

      <div class="download-tip">
        <IconifyIconOnline icon="mdi:information-outline" />
        <span>点击上方文件即可开始下载，或右键另存为</span>
      </div>
    </div>

    <template #footer>
      <div class="dialog-footer">
        <el-button @click="dialogVisible = false" class="close-btn">关闭</el-button>
      </div>
    </template>
  </sc-dialog>
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
/* 对话框头部 */
.dialog-header {
  display: flex;
  align-items: center;
  gap: 14px;
  padding-right: 40px;
}

.header-icon {
  width: 44px;
  height: 44px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #11998e 0%, #38ef7d 100%);
  border-radius: 12px;
  color: #fff;
  font-size: 22px;
}

.header-info {
  flex: 1;

  h3 {
    margin: 0;
    font-size: 17px;
    font-weight: 600;
    color: var(--el-text-color-primary);
  }

  p {
    margin: 4px 0 0;
    font-size: 13px;
    color: var(--el-text-color-secondary);
  }
}

/* 下载内容 */
.download-content {
  padding: 4px 0;
}

.download-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.download-item {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 16px;
  background: var(--el-fill-color-lighter);
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.3s ease;
  border: 2px solid transparent;

  &:hover {
    background: var(--el-bg-color);
    border-color: var(--el-color-primary);
    transform: translateY(-2px);
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.08);

    .item-action {
      background: var(--el-color-primary);
      color: #fff;
      transform: scale(1.1);
    }
  }

  .item-icon {
    width: 44px;
    height: 44px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 10px;
    font-size: 22px;
    color: #fff;
    flex-shrink: 0;

    &.cert {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    }

    &.key {
      background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
    }

    &.chain {
      background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
    }
  }

  .item-info {
    flex: 1;
    min-width: 0;

    .item-title {
      font-size: 15px;
      font-weight: 600;
      color: var(--el-text-color-primary);
    }

    .item-desc {
      font-size: 12px;
      color: var(--el-text-color-secondary);
      margin-top: 4px;
    }
  }

  .item-action {
    width: 36px;
    height: 36px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: var(--el-fill-color);
    border-radius: 8px;
    font-size: 18px;
    color: var(--el-text-color-secondary);
    transition: all 0.3s ease;
    flex-shrink: 0;
  }
}

/* 提示信息 */
.download-tip {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 16px;
  padding: 12px 16px;
  background: var(--el-color-info-light-9);
  border-radius: 8px;
  font-size: 12px;
  color: var(--el-color-info);

  svg {
    font-size: 16px;
    flex-shrink: 0;
  }
}

/* 对话框底部 */
.dialog-footer {
  display: flex;
  justify-content: flex-end;
}

.close-btn {
  padding: 10px 24px;
  border-radius: 8px;
}
</style>

<style lang="scss">
.download-dialog {
  .el-dialog__header {
    padding: 20px 24px;
    margin: 0;
    border-bottom: 1px solid var(--el-border-color-lighter);
  }

  .el-dialog__body {
    padding: 20px 24px;
  }

  .el-dialog__footer {
    padding: 16px 24px;
    border-top: 1px solid var(--el-border-color-lighter);
  }
}
</style>
