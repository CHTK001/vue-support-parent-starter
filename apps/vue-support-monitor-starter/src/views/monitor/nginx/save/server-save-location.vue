<template>
  <div>
    <el-dialog v-model="visible" width="50%" title="更新[location]" draggable :close-on-click-modal="false" :modal-append-to-body="false" @close="handleClose">
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
              <el-form-item label="根目录">
                <el-input v-model="form.monitorNginxHttpServerLocationRoot" placeholder="html" />
                <div class="el-form-item-msg">root html</div>
              </el-form-item>
            </el-col>

            <el-col :span="24">
              <el-form-item label="类型">
                <el-select v-model="form.monitorNginxHttpServerLocationType">
                  <el-option value="proxy" label="代理" />
                  <el-option value="local" label="本地" />
                </el-select>
              </el-form-item>
            </el-col>

            <el-col :span="12">
              <el-form-item label="索引目录">
                <el-input v-model="form.monitorNginxHttpServerLocationIndex" placeholder="index.html index.htm" />
                <div class="el-form-item-msg">index index.html index.htm</div>
              </el-form-item>
            </el-col>

            <el-col :span="12">
              <el-form-item label="尝试文件">
                <el-input v-model="form.monitorNginxHttpServerLocationTryFiles" placeholder="$uri $uri/ /index.html" />
                <div class="el-form-item-msg">try_files $uri $uri/ /index.html</div>
              </el-form-item>
            </el-col>

            <el-col :span="12">
              <el-form-item label="限流">
                <el-input v-model="form.monitorNginxHttpServerLocationLimitReq" placeholder="zone=mylimit burst=5 nodelay" />
                <div class="el-form-item-msg">limit_req zone=mylimit burst=5 nodelay</div>
              </el-form-item>
            </el-col>

            <el-col :span="12">
              <el-form-item label="客户端请求大小">
                <el-input v-model="form.monitorNginxHttpServerLocationClientMaxBodySize" placeholder="10m" />
                <div class="el-form-item-msg">client_max_body_size 10m</div>
              </el-form-item>
            </el-col>

            <el-col :span="12">
              <el-form-item label="客户端缓存大小">
                <el-input v-model="form.monitorNginxHttpServerLocationClientBodyBufferSize" placeholder="128k" />
                <div class="el-form-item-msg">client_body_buffer_size 128k</div>
              </el-form-item>
            </el-col>

            <template v-if="form.monitorNginxHttpServerLocationType === 'proxy'">
              <el-divider>
                <template #default>代理配置</template>
              </el-divider>
              <el-col :span="12">
                <el-form-item label="代理地址">
                  <el-input v-model="form.monitorNginxHttpServerLocationProxyPass" placeholder="http://192.168.247.129:8080" />
                  <div class="el-form-item-msg">proxy_pass http://192.168.247.129:8080;</div>
                </el-form-item>
              </el-col>

              <el-col :span="12">
                <el-form-item label="代理缓存">
                  <el-input v-model="form.monitorNginxHttpServerLocationProxyCache" placeholder="my_cache" />
                  <div class="el-form-item-msg">proxy_cache my_cache;</div>
                </el-form-item>
              </el-col>

              <el-col :span="12">
                <el-form-item label="响应缓存">
                  <el-input v-model="form.monitorNginxHttpServerLocationProxyCacheValid" placeholder="200 302 10m" />
                  <div class="el-form-item-msg">proxy_cache_valid 200 302 10m</div>
                </el-form-item>
              </el-col>

              <el-col :span="12">
                <el-form-item label="缓存类型">
                  <el-select v-model="form.monitorNginxHttpServerLocationProxyCacheMethods" placeholder="GET HEAD">
                    <el-option v-for="item in ['GET', 'HEAD', 'POST', 'PUT', 'DELETE', 'OPTION', 'TRACE']" :key="item" :label="item" :value="item" />
                  </el-select>
                  <div class="el-form-item-msg">proxy_cache_methods GET HEAD</div>
                </el-form-item>
              </el-col>

              <el-col :span="12">
                <el-form-item label="请求时间">
                  <el-input v-model="form.monitorNginxHttpServerLocationProxyReadTimeout" placeholder="1000" />
                  <div class="el-form-item-msg">proxy_read_timeout 1000</div>
                </el-form-item>
              </el-col>

              <el-col :span="12">
                <el-form-item label="发送时间">
                  <el-input v-model="form.monitorNginxHttpServerLocationProxySendTimeout" placeholder="1000" />
                  <div class="el-form-item-msg">proxy_send_timeout 1000</div>
                </el-form-item>
              </el-col>

              <el-col :span="12">
                <el-form-item label="连接时间">
                  <el-input v-model="form.monitorNginxHttpServerLocationProxyConnectTimeout" placeholder="1000" />
                  <div class="el-form-item-msg">proxy_connect_timeout 1000</div>
                </el-form-item>
              </el-col>
            </template>
            <template v-else>
              <el-divider>
                <template #default>本地配置</template>
              </el-divider>
              <el-col :span="12">
                <el-form-item label="文件路径">
                  <el-input v-model="form.monitorNginxHttpServerLocationAlias" placeholder="/home" />
                  <div class="el-form-item-msg">alias /data/nginx/www/;</div>
                </el-form-item>
              </el-col>
            </template>

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
import { fetchListFileSystem } from "@/api/monitor/filesystem";
const ScFile = defineAsyncComponent(() => import("@repo/components/ScFile/index.vue"));

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
  Object.assign(form, form1);
  form.monitorNginxHttpServerLocationType = !!form1.monitorNginxHttpServerLocationProxyPass ? "proxy" : "local";
};

defineExpose({
  handleOpen,
  handleClose
});
</script>
