<template>
  <div>
    <el-form :model="form" label-width="160px">
      <el-divider>
        <template #default>基础配置</template>
      </el-divider>
      <el-row>
        <el-col :span="12">
          <el-form-item label="开放域名">
            <el-input v-model="form.monitorNginxHttpServerName" placeholder="localhost" />
            <div class="el-form-item-msg">nginx开放域名</div>
          </el-form-item>
        </el-col>

        <el-col :span="12">
          <el-form-item label="开放端口">
            <el-input v-model="form.monitorNginxHttpServerPort" placeholder="80" type="number" />
            <div class="el-form-item-msg">nginx开放的端口</div>
          </el-form-item>
        </el-col>

        <el-col :span="12">
          <el-form-item label="根目录">
            <el-input v-model="form.monitorNginxHttpServerRoot" placeholder="/home" type="textarea" />
            <div class="el-form-item-msg">root /usr/share/nginx/html;</div>
          </el-form-item>
        </el-col>

        <el-col :span="12">
          <el-form-item label="读取时间">
            <el-input v-model="form.monitorNginxHttpServerProxyReadTimeout" placeholder="60s" />
            <div class="el-form-item-msg">proxy_read_timeout 60s;</div>
          </el-form-item>
        </el-col>

        <el-col :span="12">
          <el-form-item label="发送时间">
            <el-input v-model="form.monitorNginxHttpServerProxySendTimeout" placeholder="60s" />
            <div class="el-form-item-msg">proxy_send_timeout 60s;</div>
          </el-form-item>
        </el-col>

        <el-col :span="12">
          <el-form-item label="连接时间">
            <el-input v-model="form.monitorNginxHttpServerProxyConnectTimeout" placeholder="60s" />
            <div class="el-form-item-msg">proxy_connect_timeout 60s;</div>
          </el-form-item>
        </el-col>
      </el-row>
      <el-divider>
        <template #default>SSL</template>
      </el-divider>

      <el-row>
        <el-col :span="12">
          <el-form-item label="ssl加密优先级">
            <el-select v-model="form.monitorNginxHttpServerSslPreferServerCiphers">
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
    </el-form>
  </div>
</template>
<script setup>
import { fetchListFileSystem } from "@/api/monitor/filesystem";
import { defineAsyncComponent, defineEmits, defineExpose, defineProps, reactive, watch } from "vue";
const emit = defineEmits(["update:modelValue"]);

const ScFile = defineAsyncComponent(() => import("@repo/components/ScFile/index.vue"));
const form = reactive({});
const props = defineProps({
  modelValue: {
    type: Object,
    default: () => {}
  }
});
watch(
  () => props.modelValue,
  value => {
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

const reload = async value => {
  Object.assign(form, value);
};

const getValue = () => {
  return form;
};
defineExpose({ reload, getValue });
</script>
