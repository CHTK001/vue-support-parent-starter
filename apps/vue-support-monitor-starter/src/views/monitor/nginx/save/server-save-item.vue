<template>
  <div class="server-save-item">
    <!-- 主表单 -->
    <el-form :model="form" label-width="160px" class="server-save-item__form">
      <!-- 基础配置卡片 -->
      <div class="server-save-item__card">
        <div class="server-save-item__card-header">
          <div class="server-save-item__card-title">
            <IconifyIconOnline icon="ri:settings-line" class="server-save-item__card-icon" />
            <span>基础配置</span>
          </div>
        </div>
        <div class="server-save-item__card-body">
          <el-row :gutter="20">
            <el-col :span="12">
              <el-form-item label="开放域名" class="server-save-item__form-item">
                <el-input v-model="form.monitorNginxHttpServerName" clearable placeholder="localhost" class="server-save-item__input" />
                <div class="server-save-item__form-tip">nginx开放域名</div>
              </el-form-item>
            </el-col>

            <el-col :span="12">
              <el-form-item label="开放端口" class="server-save-item__form-item">
                <el-input v-model="form.monitorNginxHttpServerPort" clearable placeholder="80" type="number" class="server-save-item__input" />
                <div class="server-save-item__form-tip">nginx开放的端口</div>
              </el-form-item>
            </el-col>

            <el-col :span="12">
              <el-form-item label="最大消息体" class="server-save-item__form-item">
                <el-input v-model="form.monitorNginxHttpServerClientMaxBodySize" clearable placeholder="10m" class="server-save-item__input" />
                <div class="server-save-item__form-tip">client_max_body_size 10m</div>
              </el-form-item>
            </el-col>

            <el-col :span="12">
              <el-form-item label="根目录" class="server-save-item__form-item">
                <el-input v-model="form.monitorNginxHttpServerRoot" clearable placeholder="/home" type="textarea" class="server-save-item__textarea" />
                <div class="server-save-item__form-tip">root /usr/share/nginx/html;</div>
              </el-form-item>
            </el-col>

            <el-col :span="12">
              <el-form-item label="读取超时时间" class="server-save-item__form-item">
                <el-input v-model="form.monitorNginxHttpServerProxyReadTimeout" clearable placeholder="60s" class="server-save-item__input" />
                <div class="server-save-item__form-tip">proxy_read_timeout 60s;</div>
              </el-form-item>
            </el-col>

            <el-col :span="12">
              <el-form-item label="发送超时时间" class="server-save-item__form-item">
                <el-input v-model="form.monitorNginxHttpServerProxySendTimeout" clearable placeholder="60s" class="server-save-item__input" />
                <div class="server-save-item__form-tip">proxy_send_timeout 60s;</div>
              </el-form-item>
            </el-col>

            <el-col :span="12">
              <el-form-item label="连接超时时间" class="server-save-item__form-item">
                <el-input v-model="form.monitorNginxHttpServerProxyConnectTimeout" clearable placeholder="60s" class="server-save-item__input" />
                <div class="server-save-item__form-tip">proxy_connect_timeout 60s;</div>
              </el-form-item>
            </el-col>
          </el-row>
        </div>
      </div>

      <!-- SSL配置卡片 -->
      <div class="server-save-item__card">
        <div class="server-save-item__card-header" @click="() => (statusObject.baseSslVisible = !statusObject.baseSslVisible)">
          <div class="server-save-item__card-title">
            <IconifyIconOnline icon="ri:lock-line" class="server-save-item__card-icon" />
            <span>SSL 配置</span>
          </div>
          <div class="server-save-item__card-action">
            <IconifyIconOnline :icon="statusObject.baseSslVisible ? 'ep:arrow-up' : 'ep:arrow-down'" class="server-save-item__card-arrow" />
          </div>
        </div>
        <div class="server-save-item__card-body" :class="{ 'server-save-item__card-body--collapsed': !statusObject.baseSslVisible }">
          <el-row :gutter="20">
            <el-col :span="12">
              <el-form-item label="ssl加密优先级" class="server-save-item__form-item">
                <el-select v-model="form.monitorNginxHttpServerSslPreferServerCiphers" clearable class="server-save-item__select">
                  <el-option value="on" label="是">是</el-option>
                  <el-option value="off" label="否">否</el-option>
                </el-select>
                <div class="server-save-item__form-tip">ssl_prefer_server_ciphers on;</div>
              </el-form-item>
            </el-col>

            <el-col :span="12">
              <el-form-item label="ssl证书密钥" class="server-save-item__form-item">
                <ScFile v-model="form.monitorNginxHttpServerSslCertificateKey" class="server-save-item__file" :url="fetchListFileSystem" placeholder="/root/.acme.sh/zjedu-ai.com_ecc/private.key" />
                <div class="server-save-item__form-tip">ssl_certificate_key /root/.acme.sh/zjedu-ai.com_ecc/private.key</div>
              </el-form-item>
            </el-col>

            <el-col :span="12">
              <el-form-item label="ssl证书" class="server-save-item__form-item">
                <ScFile v-model="form.monitorNginxHttpServerSslCertificate" class="server-save-item__file" :url="fetchListFileSystem" placeholder="/root/.acme.sh/zjedu-ai.com_ecc/fullchain.cer" />
                <div class="server-save-item__form-tip">/root/.acme.sh/zjedu-ai.com_ecc/fullchain.cer</div>
              </el-form-item>
            </el-col>

            <el-col :span="12">
              <el-form-item label="ssl加密协议" class="server-save-item__form-item">
                <el-input v-model="form.monitorNginxHttpServerSslProtocols" placeholder="ssl_protocols TLSv1 TLSv1.1 TLSv1.2" class="server-save-item__input" />
                <div class="server-save-item__form-tip">ssl_protocols TLSv1 TLSv1.1 TLSv1.2;</div>
              </el-form-item>
            </el-col>

            <el-col :span="12">
              <el-form-item label="ssl加密算法" class="server-save-item__form-item">
                <el-input v-model="form.monitorNginxHttpServerSslCiphers" placeholder="ECDHE-RSA-AES128-GCM-SHA256:ECDHE:ECDH:AES:HIGH:!NULL:!aNULL:!MD5:!ADH:!RC4" class="server-save-item__input" />
                <div class="server-save-item__form-tip">ECDHE-RSA-AES128-GCM-SHA256:ECDHE:ECDH:AES:HIGH:!NULL:!aNULL:!MD5:!ADH:!RC4;</div>
              </el-form-item>
            </el-col>

            <el-col :span="12">
              <el-form-item label="ssl会话缓存" class="server-save-item__form-item">
                <el-input v-model="form.monitorNginxHttpServerSslSessionTimeout" placeholder="5m" class="server-save-item__input" />
                <div class="server-save-item__form-tip">ssl_session_timeout 5m</div>
              </el-form-item>
            </el-col>
          </el-row>
        </div>
      </div>
    </el-form>
  </div>
</template>

<script setup>
import { fetchListFileSystem } from "@/api/monitor/filesystem";
import { useRenderIcon } from "@repo/components/ReIcon/src/hooks";
import { defineAsyncComponent, defineEmits, defineExpose, defineProps, reactive, watch, ref } from "vue";

// 定义事件
const emit = defineEmits(["update:modelValue"]);

// 异步加载组件
const ScFile = defineAsyncComponent(() => import("@repo/components/ScFile/index.vue"));

// 表单数据
const form = reactive({});

// 表格模板
const formTableTemplate = reactive({
  monitorNginxHttpServerLocationHeaderName: null,
  monitorNginxHttpServerLocationHeaderValue: null,
  monitorNginxHttpServerLocationHeaderType: null
});

// 表格数据
const formTable = reactive([]);

// 状态对象 - 控制各部分的显示/隐藏
const statusObject = reactive({
  baseSslVisible: false,
  baseHeaderVisible: true
});

// 组件属性
const props = defineProps({
  modelValue: {
    type: Object,
    default: () => {}
  }
});

/**
 * 监听属性变化，更新表单数据
 */
watch(
  () => props.modelValue,
  value => {
    Object.assign(form, value);
    // 设置默认值
    if (!form.monitorNginxHttpServerName) {
      form.monitorNginxHttpServerName = "localhost";
    }

    if (!form.monitorNginxHttpServerPort) {
      form.monitorNginxHttpServerPort = 80;
    }
  },
  { deep: true, immediate: true }
);

/**
 * 监听表单变化，更新父组件数据
 */
watch(
  form,
  () => {
    emit("update:modelValue", form);
  },
  { deep: true, immediate: true }
);

/**
 * 重新加载数据
 * @param {Object} value - 新的表单数据
 */
const reload = async value => {
  Object.assign(form, value);
};

/**
 * 获取表单数据
 * @returns {Object} 表单数据
 */
const getValue = () => {
  form.monitorNginxHttpServerId = props.modelValue.monitorNginxHttpServerId;
  return form;
};

// 暴露方法
defineExpose({ reload, getValue });
</script>

<style lang="scss" scoped>
.server-save-item {
  /* 表单样式 */
  &__form {
    display: flex;
    flex-direction: column;
    gap: 20px;
  }

  /* 卡片样式 */
  &__card {
    border-radius: 8px;
    overflow: hidden;
    box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.05);
    border: 1px solid var(--el-border-color-lighter);
    transition: all 0.3s ease;
    background-color: var(--el-bg-color);
    margin-bottom: 20px;
    position: relative;

    &:hover {
      box-shadow: 0 4px 16px 0 rgba(0, 0, 0, 0.1);
      transform: translateY(-2px);
      border-color: var(--el-color-primary-light-7);
    }

    /* 卡片头部样式 */
    &-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 12px 16px;
      background: linear-gradient(to right, var(--el-color-primary-light-9), var(--el-bg-color));
      border-bottom: 1px solid var(--el-border-color-lighter);
      cursor: pointer;
      transition: background-color 0.3s ease;

      &:hover {
        background: linear-gradient(to right, var(--el-color-primary-light-8), var(--el-bg-color));
      }
    }

    /* 卡片标题样式 */
    &-title {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 16px;
      font-weight: 600;
      color: var(--el-text-color-primary);
    }

    /* 卡片图标样式 */
    &-icon {
      font-size: 20px;
      color: var(--el-color-primary);
      filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.1));
    }

    /* 卡片操作区域样式 */
    &-action {
      display: flex;
      align-items: center;
    }

    /* 卡片箭头图标样式 */
    &-arrow {
      font-size: 16px;
      color: var(--el-color-primary);
      transition: transform 0.3s ease;

      &:hover {
        transform: scale(1.2);
      }
    }

    /* 卡片内容区域样式 */
    &-body {
      padding: 16px;
      transition: all 0.3s ease;
      max-height: 1000px;
      overflow: hidden;

      &--collapsed {
        max-height: 0;
        padding: 0 16px;
        opacity: 0;
      }
    }
  }

  /* 表单项样式 */
  &__form-item {
    margin-bottom: 16px;

    :deep(.el-form-item__label) {
      font-weight: 500;
      color: var(--el-text-color-primary);
    }

    :deep(.el-form-item__content) {
      display: flex;
      flex-direction: column;
    }
  }

  /* 表单提示文本样式 */
  &__form-tip {
    font-size: 12px;
    color: var(--el-text-color-secondary);
    margin-top: 4px;
    line-height: 1.4;
    transition: color 0.3s ease;
  }

  /* 输入框样式 */
  &__input {
    transition: all 0.3s ease;

    &:hover {
      border-color: var(--el-color-primary-light-5);
    }

    &:focus {
      transform: translateY(-2px);
      box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
    }
  }

  /* 文本域样式 */
  &__textarea {
    transition: all 0.3s ease;

    &:hover {
      border-color: var(--el-color-primary-light-5);
    }

    &:focus {
      transform: translateY(-2px);
      box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
    }
  }

  /* 选择器样式 */
  &__select {
    width: 100%;
    transition: all 0.3s ease;

    &:hover {
      :deep(.el-input__wrapper) {
        border-color: var(--el-color-primary-light-5);
      }
    }

    &:focus {
      transform: translateY(-2px);

      :deep(.el-input__wrapper) {
        box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
      }
    }
  }

  /* 文件选择器样式 */
  &__file {
    width: 100%;
    transition: all 0.3s ease;

    &:hover {
      transform: translateY(-2px);
    }
  }
}

/* 动画效果 */
.fade-enter-active,
.fade-leave-active {
  transition:
    opacity 0.3s ease,
    transform 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
  transform: translateY(-10px);
}

@keyframes pulse {
  0% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.05);
  }
  100% {
    transform: scale(1);
  }
}

@keyframes float {
  0% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-5px);
  }
  100% {
    transform: translateY(0);
  }
}
</style>
