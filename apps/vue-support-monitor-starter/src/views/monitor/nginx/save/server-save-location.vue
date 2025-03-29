<template>
  <div class="server-save-location">
    <!-- 主对话框组件 -->
    <el-dialog v-model="visible" width="70%" title="更新 Location 配置" draggable :close-on-click-modal="false" :modal-append-to-body="false" class="server-save-location__dialog" @close="handleClose">
      <!-- 内容区域 -->
      <div class="server-save-location__content">
        <el-form :model="form" label-width="160px" :rules="rules" class="server-save-location__form">
          <!-- 基础配置卡片 -->
          <div class="server-save-location__card">
            <div class="server-save-location__card-header">
              <div class="server-save-location__card-title">
                <IconifyIconOnline icon="ri:settings-line" class="server-save-location__card-icon" />
                <span>基础配置</span>
              </div>
            </div>
            <div class="server-save-location__card-body">
              <el-row :gutter="20">
                <el-col :span="12">
                  <el-form-item label="路径" prop="monitorNginxHttpServerLocationName" class="server-save-location__form-item">
                    <el-input v-model="form.monitorNginxHttpServerLocationName" placeholder="/test" class="server-save-location__input" />
                    <div class="server-save-location__form-tip">nginx开放路径</div>
                  </el-form-item>
                </el-col>
                <el-col :span="12">
                  <el-form-item label="类型" prop="monitorNginxHttpServerLocationType" class="server-save-location__form-item">
                    <el-select v-model="form.monitorNginxHttpServerLocationType" class="server-save-location__select">
                      <el-option value="proxy" label="代理" />
                      <el-option value="local" label="本地" />
                    </el-select>
                  </el-form-item>
                </el-col>

                <el-col :span="12">
                  <el-form-item label="根目录" class="server-save-location__form-item">
                    <el-input v-model="form.monitorNginxHttpServerLocationRoot" placeholder="html" class="server-save-location__input" />
                    <div class="server-save-location__form-tip">root html</div>
                  </el-form-item>
                </el-col>

                <el-col :span="12">
                  <el-form-item label="索引目录" class="server-save-location__form-item">
                    <el-input v-model="form.monitorNginxHttpServerLocationIndex" placeholder="index.html index.htm" class="server-save-location__input" />
                    <div class="server-save-location__form-tip">index index.html index.htm</div>
                  </el-form-item>
                </el-col>

                <el-col :span="12">
                  <el-form-item label="尝试文件" class="server-save-location__form-item">
                    <el-input v-model="form.monitorNginxHttpServerLocationTryFiles" placeholder="$uri $uri/ /index.html" class="server-save-location__input" />
                    <div class="server-save-location__form-tip">try_files $uri $uri/ /index.html</div>
                  </el-form-item>
                </el-col>

                <el-col :span="12">
                  <el-form-item label="限流" class="server-save-location__form-item">
                    <el-input v-model="form.monitorNginxHttpServerLocationLimitReq" placeholder="zone=mylimit burst=5 nodelay" class="server-save-location__input" />
                    <div class="server-save-location__form-tip">limit_req zone=mylimit burst=5 nodelay</div>
                  </el-form-item>
                </el-col>

                <el-col :span="12">
                  <el-form-item label="客户端请求大小" class="server-save-location__form-item">
                    <el-input v-model="form.monitorNginxHttpServerLocationClientMaxBodySize" placeholder="10m" class="server-save-location__input" />
                    <div class="server-save-location__form-tip">client_max_body_size 10m</div>
                  </el-form-item>
                </el-col>

                <el-col :span="12">
                  <el-form-item label="客户端缓存大小" class="server-save-location__form-item">
                    <el-input v-model="form.monitorNginxHttpServerLocationClientBodyBufferSize" placeholder="128k" class="server-save-location__input" />
                    <div class="server-save-location__form-tip">client_body_buffer_size 128k</div>
                  </el-form-item>
                </el-col>
              </el-row>
            </div>
          </div>

          <!-- 代理配置卡片 -->
          <div v-if="form.monitorNginxHttpServerLocationType === 'proxy'" class="server-save-location__card">
            <div class="server-save-location__card-header">
              <div class="server-save-location__card-title">
                <IconifyIconOnline icon="ri:global-line" class="server-save-location__card-icon" />
                <span>代理配置</span>
              </div>
            </div>
            <div class="server-save-location__card-body">
              <el-row :gutter="20">
                <el-col :span="12">
                  <el-form-item label="代理地址" class="server-save-location__form-item">
                    <el-input v-model="form.monitorNginxHttpServerLocationProxyPass" clearable placeholder="http://192.168.247.129:8080" class="server-save-location__input" />
                    <div class="server-save-location__form-tip">proxy_pass http://192.168.247.129:8080;</div>
                  </el-form-item>
                </el-col>

                <el-col :span="12">
                  <el-form-item label="代理缓存" class="server-save-location__form-item">
                    <el-input v-model="form.monitorNginxHttpServerLocationProxyCache" clearable placeholder="my_cache" class="server-save-location__input" />
                    <div class="server-save-location__form-tip">proxy_cache my_cache;</div>
                  </el-form-item>
                </el-col>

                <el-col :span="12">
                  <el-form-item label="响应缓存" class="server-save-location__form-item">
                    <el-input v-model="form.monitorNginxHttpServerLocationProxyCacheValid" clearable placeholder="200 302 10m" class="server-save-location__input" />
                    <div class="server-save-location__form-tip">proxy_cache_valid 200 302 10m</div>
                  </el-form-item>
                </el-col>

                <el-col :span="12">
                  <el-form-item label="缓存类型" class="server-save-location__form-item">
                    <el-select v-model="form.monitorNginxHttpServerLocationProxyCacheMethods" clearable placeholder="GET HEAD" class="server-save-location__select">
                      <el-option v-for="item in ['GET', 'HEAD', 'POST', 'PUT', 'DELETE', 'OPTION', 'TRACE']" :key="item" :label="item" :value="item" />
                    </el-select>
                    <div class="server-save-location__form-tip">proxy_cache_methods GET HEAD</div>
                  </el-form-item>
                </el-col>

                <el-col :span="12">
                  <el-form-item label="请求时间" class="server-save-location__form-item">
                    <el-input v-model="form.monitorNginxHttpServerLocationProxyReadTimeout" clearable placeholder="1000" class="server-save-location__input" />
                    <div class="server-save-location__form-tip">proxy_read_timeout 1000</div>
                  </el-form-item>
                </el-col>

                <el-col :span="12">
                  <el-form-item label="发送时间" class="server-save-location__form-item">
                    <el-input v-model="form.monitorNginxHttpServerLocationProxySendTimeout" clearable placeholder="1000" class="server-save-location__input" />
                    <div class="server-save-location__form-tip">proxy_send_timeout 1000</div>
                  </el-form-item>
                </el-col>

                <el-col :span="12">
                  <el-form-item label="连接时间" class="server-save-location__form-item">
                    <el-input v-model="form.monitorNginxHttpServerLocationProxyConnectTimeout" clearable placeholder="1000" class="server-save-location__input" />
                    <div class="server-save-location__form-tip">proxy_connect_timeout 1000</div>
                  </el-form-item>
                </el-col>
              </el-row>
            </div>
          </div>

          <!-- 本地配置卡片 -->
          <div v-else class="server-save-location__card">
            <div class="server-save-location__card-header">
              <div class="server-save-location__card-title">
                <IconifyIconOnline icon="ri:folder-line" class="server-save-location__card-icon" />
                <span>本地配置</span>
              </div>
            </div>
            <div class="server-save-location__card-body">
              <el-row :gutter="20">
                <el-col :span="12">
                  <el-form-item label="文件路径" class="server-save-location__form-item">
                    <el-input v-model="form.monitorNginxHttpServerLocationAlias" clearable placeholder="/home" class="server-save-location__input" />
                    <div class="server-save-location__form-tip">alias /data/nginx/www/;</div>
                  </el-form-item>
                </el-col>
              </el-row>
            </div>
          </div>

          <!-- 通用配置卡片 -->
          <div class="server-save-location__card">
            <div class="server-save-location__card-header">
              <div class="server-save-location__card-title">
                <IconifyIconOnline icon="ri:time-line" class="server-save-location__card-icon" />
                <span>超时配置</span>
              </div>
            </div>
            <div class="server-save-location__card-body">
              <el-row :gutter="20">
                <el-col :span="12">
                  <el-form-item label="读取时间" class="server-save-location__form-item">
                    <el-input v-model="form.monitorNginxHttpServerProxyReadTimeout" clearable placeholder="60s" class="server-save-location__input" />
                    <div class="server-save-location__form-tip">proxy_read_timeout 60s;</div>
                  </el-form-item>
                </el-col>

                <el-col :span="12">
                  <el-form-item label="发送时间" class="server-save-location__form-item">
                    <el-input v-model="form.monitorNginxHttpServerProxySendTimeout" clearable placeholder="60s" class="server-save-location__input" />
                    <div class="server-save-location__form-tip">proxy_send_timeout 60s;</div>
                  </el-form-item>
                </el-col>

                <el-col :span="12">
                  <el-form-item label="连接时间" class="server-save-location__form-item">
                    <el-input v-model="form.monitorNginxHttpServerProxyConnectTimeout" clearable placeholder="60s" class="server-save-location__input" />
                    <div class="server-save-location__form-tip">proxy_connect_timeout 60s;</div>
                  </el-form-item>
                </el-col>
              </el-row>
            </div>
          </div>

          <!-- SSL配置卡片 -->
          <div class="server-save-location__card">
            <div class="server-save-location__card-header" @click="() => (statusObject.baseSslVisible = !statusObject.baseSslVisible)">
              <div class="server-save-location__card-title">
                <IconifyIconOnline icon="ri:lock-line" class="server-save-location__card-icon" />
                <span>SSL 配置</span>
              </div>
              <div class="server-save-location__card-action">
                <IconifyIconOnline :icon="statusObject.baseSslVisible ? 'ep:arrow-up' : 'ep:arrow-down'" class="server-save-location__card-arrow" />
              </div>
            </div>
            <div class="server-save-location__card-body" :class="{ 'server-save-location__card-body--collapsed': !statusObject.baseSslVisible }">
              <el-row :gutter="20">
                <el-col :span="12">
                  <el-form-item label="ssl加密优先级" class="server-save-location__form-item">
                    <el-select v-model="form.monitorNginxHttpServerSslPreferServerCiphers" clearable class="server-save-location__select">
                      <el-option value="on" label="是">是</el-option>
                      <el-option value="off" label="否">否</el-option>
                    </el-select>
                    <div class="server-save-location__form-tip">ssl_prefer_server_ciphers on;</div>
                  </el-form-item>
                </el-col>

                <el-col :span="12">
                  <el-form-item label="ssl证书密钥" class="server-save-location__form-item">
                    <ScFile
                      v-model="form.monitorNginxHttpServerSslCertificateKey"
                      class="server-save-location__file"
                      :url="fetchListFileSystem"
                      placeholder="/root/.acme.sh/zjedu-ai.com_ecc/private.key"
                    />
                    <div class="server-save-location__form-tip">ssl_certificate_key /root/.acme.sh/zjedu-ai.com_ecc/private.key</div>
                  </el-form-item>
                </el-col>

                <el-col :span="12">
                  <el-form-item label="ssl证书" class="server-save-location__form-item">
                    <ScFile
                      v-model="form.monitorNginxHttpServerSslCertificate"
                      class="server-save-location__file"
                      :url="fetchListFileSystem"
                      placeholder="/root/.acme.sh/zjedu-ai.com_ecc/fullchain.cer"
                    />
                    <div class="server-save-location__form-tip">/root/.acme.sh/zjedu-ai.com_ecc/fullchain.cer</div>
                  </el-form-item>
                </el-col>

                <el-col :span="12">
                  <el-form-item label="ssl加密协议" class="server-save-location__form-item">
                    <el-input v-model="form.monitorNginxHttpServerSslProtocols" placeholder="ssl_protocols TLSv1 TLSv1.1 TLSv1.2" class="server-save-location__input" />
                    <div class="server-save-location__form-tip">ssl_protocols TLSv1 TLSv1.1 TLSv1.2;</div>
                  </el-form-item>
                </el-col>

                <el-col :span="12">
                  <el-form-item label="ssl加密算法" class="server-save-location__form-item">
                    <el-input
                      v-model="form.monitorNginxHttpServerSslCiphers"
                      placeholder="ECDHE-RSA-AES128-GCM-SHA256:ECDHE:ECDH:AES:HIGH:!NULL:!aNULL:!MD5:!ADH:!RC4"
                      class="server-save-location__input"
                    />
                    <div class="server-save-location__form-tip">ECDHE-RSA-AES128-GCM-SHA256:ECDHE:ECDH:AES:HIGH:!NULL:!aNULL:!MD5:!ADH:!RC4;</div>
                  </el-form-item>
                </el-col>

                <el-col :span="12">
                  <el-form-item label="ssl会话缓存" class="server-save-location__form-item">
                    <el-input v-model="form.monitorNginxHttpServerSslSessionTimeout" placeholder="5m" class="server-save-location__input" />
                    <div class="server-save-location__form-tip">ssl_session_timeout 5m</div>
                  </el-form-item>
                </el-col>
              </el-row>
            </div>
          </div>

          <!-- 消息头配置卡片 -->
          <div class="server-save-location__card">
            <div class="server-save-location__card-header" @click="() => (statusObject.baseHeaderVisible = !statusObject.baseHeaderVisible)">
              <div class="server-save-location__card-title">
                <IconifyIconOnline icon="ri:message-line" class="server-save-location__card-icon" />
                <span>消息头配置</span>
              </div>
              <div class="server-save-location__card-action">
                <IconifyIconOnline :icon="statusObject.baseHeaderVisible ? 'ep:arrow-up' : 'ep:arrow-down'" class="server-save-location__card-arrow" />
              </div>
            </div>
            <div class="server-save-location__card-body" :class="{ 'server-save-location__card-body--collapsed': !statusObject.baseHeaderVisible }">
              <ScFormTable v-model="formTable" :addTemplate="formTableTemplate" class="server-save-location__form-table">
                <el-table-column prop="monitorNginxHttpServerLocationHeaderName" label="消息头名称">
                  <template #default="{ row }">
                    <el-select v-model="row.monitorNginxHttpServerLocationHeaderName" :allow-create="true" :filterable="true" class="server-save-location__select">
                      <el-option label="主机" value="HOST" />
                      <el-option label="真实IP" value="X-Real-IP" />
                      <el-option label="原始IP" value="X-Forwarded-For" />
                    </el-select>
                  </template>
                </el-table-column>
                <el-table-column prop="monitorNginxHttpServerLocationHeaderValue" label="消息头值">
                  <template #default="{ row }">
                    <el-select v-model="row.monitorNginxHttpServerLocationHeaderValue" :allow-create="true" :filterable="true" class="server-save-location__select">
                      <el-option label="主机" value="$host" />
                      <el-option label="真实IP" value="$remote_addr" />
                      <el-option label="原始IP" value="$proxy_add_x_forwarded_for" />
                    </el-select>
                  </template>
                </el-table-column>
                <el-table-column prop="monitorNginxHttpServerLocationHeaderType" label="消息头类型">
                  <template #default="{ row }">
                    <el-select v-model="row.monitorNginxHttpServerLocationHeaderType" :allow-create="true" :filterable="true" class="server-save-location__select">
                      <el-option v-if="form.monitorNginxHttpServerLocationType == 'local'" label="设置" value="set_header" />
                      <el-option v-if="form.monitorNginxHttpServerLocationType == 'local'" label="追加" value="add_header" />
                      <el-option v-if="form.monitorNginxHttpServerLocationType == 'proxy'" label="代理设置" value="proxy_set_header" />
                      <el-option v-if="form.monitorNginxHttpServerLocationType == 'proxy'" label="代理追加" value="proxy_add_header" />
                    </el-select>
                  </template>
                </el-table-column>
              </ScFormTable>
            </div>
          </div>
        </el-form>
      </div>
      <template #footer>
        <div class="server-save-location__footer">
          <el-button class="server-save-location__cancel-btn" @click="handleClose">
            <IconifyIconOnline icon="ri:close-line" />
            <span>关闭</span>
          </el-button>
          <el-button class="server-save-location__save-btn" type="primary" @click="handleSaveOrUpdate">
            <IconifyIconOnline icon="ri:save-3-line" />
            <span>保存</span>
          </el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { fetchSaveOrUpdateNginxHttpServerLocationConfig } from "@/api/monitor/nginx-http-server-location";
import { useRenderIcon } from "@repo/components/ReIcon/src/hooks";
import { message } from "@repo/utils";
import { defineAsyncComponent, defineEmits, defineExpose, h, reactive, ref, watch } from "vue";
import { fetchListFileSystem } from "@/api/monitor/filesystem";
import { useI18n } from "vue-i18n";

// 国际化
const { t } = useI18n();

// 异步加载组件
const ScFile = defineAsyncComponent(() => import("@repo/components/ScFile/index.vue"));
const ScFormTable = defineAsyncComponent(() => import("@repo/components/ScFormTable/index.vue"));

// 状态对象 - 控制各部分的显示/隐藏
const statusObject = reactive({
  baseSslVisible: false,
  baseHeaderVisible: true
});

// 表单验证规则
let rules = {};

// 定义事件
const emit = defineEmits(["update:modelValue", "success"]);

// 表格模板
const formTableTemplate = reactive({
  monitorNginxHttpServerLocationHeaderName: null,
  monitorNginxHttpServerLocationHeaderValue: null,
  monitorNginxHttpServerLocationHeaderType: null
});

// 表格数据
let formTable = [];

// 服务器数据
let _serverData = {};

// 对话框可见性
const visible = ref(false);

// 表单数据
const form = reactive({
  headers: []
});

// 环境配置
const env = reactive({
  mode: "add"
});

/**
 * 保存或更新配置
 */
const handleSaveOrUpdate = async () => {
  form.monitorNginxHttpServerId = _serverData.monitorNginxHttpServerId;
  form.headers = formTable;

  fetchSaveOrUpdateNginxHttpServerLocationConfig(form).then(res => {
    if (res.code === "00000") {
      message(t("message.updateSuccess"), { type: "success" });
      emit("success");
      handleClose();
      return;
    }
    message(res.msg, { type: "error" });
  });
};

/**
 * 关闭对话框
 */
const handleClose = async () => {
  visible.value = false;
  rules = {};
};

/**
 * 打开对话框
 * @param {Object} form1 - 表单数据
 * @param {Object} serverData - 服务器数据
 */
const handleOpen = async (form1, serverData) => {
  visible.value = true;
  _serverData = serverData;
  Object.assign(form, form1);
  formTable = form1.headers || [];

  // 设置验证规则
  rules = {
    monitorNginxHttpServerLocationName: [
      {
        required: true,
        message: "请输入名称",
        trigger: "blur"
      }
    ],
    monitorNginxHttpServerLocationType: [
      {
        required: true,
        message: "请选择类型",
        trigger: "blur"
      }
    ]
  };

  // 根据代理地址判断类型
  form.monitorNginxHttpServerLocationType = !!form1.monitorNginxHttpServerLocationProxyPass ? "proxy" : "local";
};

/**
 * 监听类型变化，动态设置验证规则
 */
watch(
  () => form.monitorNginxHttpServerLocationType,
  (val, oldVal) => {
    if (val === "proxy") {
      rules["monitorNginxHttpServerLocationProxyPass"] = [
        {
          required: true,
          message: "请输入代理地址",
          trigger: "blur"
        }
      ];
      return;
    }

    delete rules["monitorNginxHttpServerLocationProxyPass"];
  }
);

// 暴露方法
defineExpose({
  handleOpen,
  handleClose
});
</script>

<style lang="scss" scoped>
.server-save-location {
  /* 对话框样式 */
  &__dialog {
    :deep(.el-dialog__header) {
      margin-bottom: 0;
      padding: 16px 20px;
      border-bottom: 1px solid var(--el-border-color-lighter);
      background: linear-gradient(to right, var(--el-color-primary-light-9), var(--el-bg-color));
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);

      .el-dialog__title {
        font-size: 18px;
        font-weight: 600;
        color: var(--el-color-primary);
      }

      .el-dialog__close-btn {
        color: var(--el-color-primary);
        transition: transform 0.3s ease;

        &:hover {
          transform: rotate(90deg);
          color: var(--el-color-primary-dark-2);
        }
      }
    }

    :deep(.el-dialog__body) {
      padding: 0;
    }

    :deep(.el-dialog__footer) {
      padding: 16px 20px;
      border-top: 1px solid var(--el-border-color-lighter);
      background-color: var(--el-bg-color-overlay);
    }
  }

  /* 内容区域样式 */
  &__content {
    height: 500px;
    overflow-y: auto;
    padding: 20px;

    /* 自定义滚动条 */
    &::-webkit-scrollbar {
      width: 8px;
      height: 8px;
    }

    &::-webkit-scrollbar-thumb {
      background-color: var(--el-color-primary-light-7);
      border-radius: 4px;

      &:hover {
        background-color: var(--el-color-primary-light-5);
      }
    }

    &::-webkit-scrollbar-track {
      background-color: var(--el-fill-color-lighter);
      border-radius: 4px;
    }
  }

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

  /* 表单表格样式 */
  &__form-table {
    :deep(.el-table) {
      border-radius: 8px;
      overflow: hidden;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);

      .el-table__header-wrapper {
        th {
          background-color: var(--el-fill-color-light);
          color: var(--el-text-color-primary);
          font-weight: 600;

          .cell {
            padding: 8px 12px;
          }
        }
      }

      .el-table__row {
        transition: all 0.3s ease;

        td {
          padding: 8px 0;

          .cell {
            padding: 0 12px;
          }
        }

        &:hover {
          background-color: var(--el-fill-color-lighter) !important;
          transform: translateY(-2px);
          box-shadow: 0 4px 8px rgba(0, 0, 0, 0.05);
        }

        &:nth-child(even) {
          background-color: var(--el-fill-color-light);
        }
      }
    }

    :deep(.el-button) {
      transition: all 0.3s ease;

      &:hover {
        transform: translateY(-2px);
        box-shadow: 0 2px 6px rgba(0, 0, 0, 0.1);
      }
    }
  }

  /* 底部操作区域样式 */
  &__footer {
    display: flex;
    justify-content: flex-end;
    gap: 12px;
  }

  /* 取消按钮样式 */
  &__cancel-btn {
    display: flex;
    align-items: center;
    gap: 6px;
    transition: all 0.3s ease;

    &:hover {
      transform: translateY(-2px);
      box-shadow: 0 2px 6px rgba(0, 0, 0, 0.1);
    }
  }

  /* 保存按钮样式 */
  &__save-btn {
    display: flex;
    align-items: center;
    gap: 6px;
    transition: all 0.3s ease;
    position: relative;
    overflow: hidden;

    &::before {
      content: "";
      position: absolute;
      top: 50%;
      left: 50%;
      width: 0;
      height: 0;
      background-color: rgba(255, 255, 255, 0.2);
      border-radius: 50%;
      transform: translate(-50%, -50%);
      transition:
        width 0.4s ease,
        height 0.4s ease;
      z-index: 0;
    }

    &:hover {
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);

      &::before {
        width: 150%;
        height: 150%;
      }
    }

    &:active {
      transform: translateY(0);
    }

    span,
    i {
      position: relative;
      z-index: 1;
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
