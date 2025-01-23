<template>
  <div>
    <el-form :model="form" label-width="160px">
      <el-divider>
        <template #default>基础配置</template>
      </el-divider>
      <el-row>
        <el-col :span="12">
          <el-form-item label="开放域名">
            <el-input v-model="form.monitorNginxHttpServerName" clearable placeholder="localhost" />
            <div class="el-form-item-msg">nginx开放域名</div>
          </el-form-item>
        </el-col>

        <el-col :span="12">
          <el-form-item label="开放端口">
            <el-input v-model="form.monitorNginxHttpServerPort" clearable placeholder="80" type="number" />
            <div class="el-form-item-msg">nginx开放的端口</div>
          </el-form-item>
        </el-col>

        <el-col :span="12">
          <el-form-item label="最大消息体">
            <el-input v-model="form.monitorNginxHttpServerClientMaxBodySize" clearable placeholder="10m" />
            <div class="el-form-item-msg">client_max_body_size 10m</div>
          </el-form-item>
        </el-col>

        <el-col :span="12">
          <el-form-item label="根目录">
            <el-input v-model="form.monitorNginxHttpServerRoot" clearable placeholder="/home" type="textarea" />
            <div class="el-form-item-msg">root /usr/share/nginx/html;</div>
          </el-form-item>
        </el-col>

        <el-col :span="12">
          <el-form-item label="读取超时时间">
            <el-input v-model="form.monitorNginxHttpServerProxyReadTimeout" clearable placeholder="60s" />
            <div class="el-form-item-msg">proxy_read_timeout 60s;</div>
          </el-form-item>
        </el-col>

        <el-col :span="12">
          <el-form-item label="发送超时时间">
            <el-input v-model="form.monitorNginxHttpServerProxySendTimeout" clearable placeholder="60s" />
            <div class="el-form-item-msg">proxy_send_timeout 60s;</div>
          </el-form-item>
        </el-col>

        <el-col :span="12">
          <el-form-item label="连接超时时间">
            <el-input v-model="form.monitorNginxHttpServerProxyConnectTimeout" clearable placeholder="60s" />
            <div class="el-form-item-msg">proxy_connect_timeout 60s;</div>
          </el-form-item>
        </el-col>
      </el-row>
      <el-divider>
        <template #default
          >SSL
          <el-icon class="cursor-pointer">
            <component :is="useRenderIcon('ep:arrow-down')" v-if="!statusObject.baseSslVisible" @click="() => (statusObject.baseSslVisible = true)" />
            <component :is="useRenderIcon('ep:arrow-up')" v-else @click="() => (statusObject.baseSslVisible = false)" /> </el-icon
        ></template>
      </el-divider>

      <el-row v-if="statusObject.baseSslVisible">
        <el-col :span="12">
          <el-form-item label="ssl加密优先级">
            <el-select v-model="form.monitorNginxHttpServerSslPreferServerCiphers" clearable>
              <el-option value="on" label="是">是</el-option>
              <el-option value="off" label="否">否</el-option>
            </el-select>
            <div class="el-form-item-msg">ssl_prefer_server_ciphers on;</div>
          </el-form-item>
        </el-col>

        <el-col :span="12">
          <el-form-item label="ssl证书密钥">
            <ScFile v-model="form.monitorNginxHttpServerSslCertificateKey" class="w-full" :url="fetchListFileSystem" placeholder="/root/.acme.sh/zjedu-ai.com_ecc/private.key" />
            <div class="el-form-item-msg">ssl_certificate_key /root/.acme.sh/zjedu-ai.com_ecc/private.key</div>
          </el-form-item>
        </el-col>

        <el-col :span="12">
          <el-form-item label="ssl证书">
            <ScFile v-model="form.monitorNginxHttpServerSslCertificate" class="w-full" :url="fetchListFileSystem" placeholder="/root/.acme.sh/zjedu-ai.com_ecc/fullchain.cer" />
            <div class="el-form-item-msg">/root/.acme.sh/zjedu-ai.com_ecc/fullchain.cer</div>
          </el-form-item>
        </el-col>

        <el-col :span="12">
          <el-form-item label="ssl加密协议">
            <el-input v-model="form.monitorNginxHttpServerSslProtocols" placeholder="ssl_protocols TLSv1 TLSv1.1 TLSv1.2" />
            <div class="el-form-item-msg">ssl_protocols TLSv1 TLSv1.1 TLSv1.2;</div>
          </el-form-item>
        </el-col>

        <el-col :span="12">
          <el-form-item label="ssl加密算法">
            <el-input v-model="form.monitorNginxHttpServerSslCiphers" placeholder="ECDHE-RSA-AES128-GCM-SHA256:ECDHE:ECDH:AES:HIGH:!NULL:!aNULL:!MD5:!ADH:!RC4" />
            <div class="el-form-item-msg">ECDHE-RSA-AES128-GCM-SHA256:ECDHE:ECDH:AES:HIGH:!NULL:!aNULL:!MD5:!ADH:!RC4;</div>
          </el-form-item>
        </el-col>

        <el-col :span="12">
          <el-form-item label="ssl会话缓存">
            <el-input v-model="form.monitorNginxHttpServerSslSessionTimeout" placeholder="5m" />
            <div class="el-form-item-msg">ssl_session_timeout 5m</div>
          </el-form-item>
        </el-col>
      </el-row>
      <el-divider>
        <template #default
          >消息头
          <el-icon class="cursor-pointer">
            <component :is="useRenderIcon('ep:arrow-down')" v-if="!statusObject.baseHeaderVisible" @click="() => (statusObject.baseHeaderVisible = true)" />
            <component :is="useRenderIcon('ep:arrow-up')" v-else @click="() => (statusObject.baseHeaderVisible = false)" /> </el-icon
        ></template>
      </el-divider>
      <el-row v-if="statusObject.baseHeaderVisible">
        <ScFormTable v-model="formTable" :addTemplate="formTableTemplate">
          <el-table-column prop="monitorNginxHttpServerLocationHeaderName" label="消息头名称">
            <template #default="{ row }">
              <el-select v-model="row.monitorNginxHttpServerLocationHeaderName" :allow-create="true" :filterable="true">
                <el-option label="主机" value="HOST" />
                <el-option label="真实IP" value="X-Real-IP" />
                <el-option label="原始IP" value="X-Forwarded-For" />
              </el-select>
            </template>
          </el-table-column>
          <el-table-column prop="monitorNginxHttpServerLocationHeaderValue" label="消息头值">
            <template #default="{ row }">
              <el-select v-model="row.monitorNginxHttpServerLocationHeaderName" :allow-create="true" :filterable="true">
                <el-option label="主机" value="$host" />
                <el-option label="真实IP" value="$remote_addr" />
                <el-option label="原始IP" value="$proxy_add_x_forwarded_for" />
              </el-select>
            </template>
          </el-table-column>
          <el-table-column prop="monitorNginxHttpServerLocationHeaderType" label="消息头类型">
            <template #default="{ row }">
              <el-select v-model="row.monitorNginxHttpServerLocationHeaderType" :allow-create="true" :filterable="true">
                <el-option label="设置" value="set_header" />
                <el-option label="追加" value="add_header" />
                <el-option label="代理设置" value="proxy_set_header" />
                <el-option label="代理追加" value="proxy_add_header" />
              </el-select>
            </template>
          </el-table-column>
        </ScFormTable>
      </el-row>
    </el-form>
  </div>
</template>
<script setup>
import { fetchListFileSystem } from "@/api/monitor/filesystem";
import { useRenderIcon } from "@repo/components/ReIcon/src/hooks";
import { defineAsyncComponent, defineEmits, defineExpose, defineProps, reactive, watch, ref } from "vue";
const emit = defineEmits(["update:modelValue"]);

const ScFile = defineAsyncComponent(() => import("@repo/components/ScFile/index.vue"));
const ScFormTable = defineAsyncComponent(() => import("@repo/components/scFormTable/index.vue"));
const form = reactive({});
const formTableTemplate = reactive({
  monitorNginxHttpServerLocationHeaderName: null,
  monitorNginxHttpServerLocationHeaderValue: null,
  monitorNginxHttpServerLocationHeaderType: null,
});
const formTable = reactive([]);
const statusObject = reactive({
  baseSslVisible: false,
  baseHeaderVisible: true,
});
const props = defineProps({
  modelValue: {
    type: Object,
    default: () => {},
  },
});
watch(
  () => props.modelValue,
  (value) => {
    Object.assign(form, value);
  },
  { deep: true, immediate: true }
);
watch(
  form,
  () => {
    emit("update:modelValue", form);
  },
  { deep: true, immediate: true }
);

const reload = async (value) => {
  Object.assign(form, value);
};

const getValue = () => {
  form.monitorNginxHttpServerId = props.modelValue.monitorNginxHttpServerId;
  return form;
};
defineExpose({ reload, getValue });
</script>
