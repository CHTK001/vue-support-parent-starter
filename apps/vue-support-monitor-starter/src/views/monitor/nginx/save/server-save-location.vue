<template>
  <div>
    <el-dialog v-model="visible" width="80%" title="新增[server]" draggable :close-on-click-modal="false" :modal-append-to-body="false" @close="handleClose">
      <div class="!h-[500px] overflow-y-auto p-[20px]">
        <el-form :model="form" label-width="160px">
          <el-divider>
            <template #default>基础配置</template>
          </el-divider>
          <el-row>
            <el-col :span="12">
              <el-form-item label="路径">
                <el-input v-model="form.monitorNginxHttpServerLocationName" placeholder="localhost" />
                <div class="el-form-item-msg">nginx开放路径</div>
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
                <el-input v-model="form.monitorNginxHttpServerRoot" placeholder="/home" />
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
      <template #footer>
        <div>
          <el-button @click="handleClose">关闭</el-button>
          <el-button :icon="useRenderIcon('ri:save-3-line')" type="primary" @click="handleSaveOrUpdate">保存</el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>
<script setup>
import { fetchSaveOrUpdateNginxHttpServerLocationConfig } from "@/api/monitor/nginx-http-server-location";
import { useRenderIcon } from "@repo/components/ReIcon/src/hooks";
import { message } from "@repo/utils";
import { defineAsyncComponent, defineEmits, defineExpose, reactive, ref } from "vue";
const emit = defineEmits(["update:modelValue"]);

const visible = ref(false);
const form = reactive({});
const env = reactive({
  mode: "add"
});
const handleSaveOrUpdate = async () => {
  fetchSaveOrUpdateNginxHttpServerLocationConfig(form).then(res => {
    if (res.code === "00000") {
      message("更新成功", { type: "success" });
      emit("success");

      return;
    }
    message(res.msg, { type: "error" });
  });
};
const handleClose = async () => {
  visible.value = false;
};

const handleOpen = async form1 => {
  visible.value = true;
  env.mode = mode;
  Object.assign(form, form1);
};

defineExpose({
  handleOpen,
  handleClose
});
</script>
