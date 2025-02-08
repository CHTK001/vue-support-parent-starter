<template>
  <div>
    <el-dialog v-model="visible" width="70%" title="更新[location]" draggable :close-on-click-modal="false" :modal-append-to-body="false" @close="handleClose">
      <div class="!h-[500px] overflow-y-auto p-[20px]">
        <el-form :model="form" label-width="160px" :rules="rules">
          <el-divider>
            <template #default>基础配置</template>
          </el-divider>
          <el-row>
            <el-col :span="12">
              <el-form-item label="路径" prop="monitorNginxHttpServerLocationName">
                <el-input v-model="form.monitorNginxHttpServerLocationName" placeholder="/test" />
                <div class="el-form-item-msg">nginx开放路径</div>
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="类型" prop="monitorNginxHttpServerLocationType">
                <el-select v-model="form.monitorNginxHttpServerLocationType">
                  <el-option value="proxy" label="代理" />
                  <el-option value="local" label="本地" />
                </el-select>
              </el-form-item>
            </el-col>

            <el-col :span="12">
              <el-form-item label="根目录">
                <el-input v-model="form.monitorNginxHttpServerLocationRoot" placeholder="html" />
                <div class="el-form-item-msg">root html</div>
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
                  <el-input v-model="form.monitorNginxHttpServerLocationProxyPass" clearable placeholder="http://192.168.247.129:8080" />
                  <div class="el-form-item-msg">proxy_pass http://192.168.247.129:8080;</div>
                </el-form-item>
              </el-col>

              <el-col :span="12">
                <el-form-item label="代理缓存">
                  <el-input v-model="form.monitorNginxHttpServerLocationProxyCache" clearable placeholder="my_cache" />
                  <div class="el-form-item-msg">proxy_cache my_cache;</div>
                </el-form-item>
              </el-col>

              <el-col :span="12">
                <el-form-item label="响应缓存">
                  <el-input v-model="form.monitorNginxHttpServerLocationProxyCacheValid" clearable placeholder="200 302 10m" />
                  <div class="el-form-item-msg">proxy_cache_valid 200 302 10m</div>
                </el-form-item>
              </el-col>

              <el-col :span="12">
                <el-form-item label="缓存类型">
                  <el-select v-model="form.monitorNginxHttpServerLocationProxyCacheMethods" clearable placeholder="GET HEAD">
                    <el-option v-for="item in ['GET', 'HEAD', 'POST', 'PUT', 'DELETE', 'OPTION', 'TRACE']" :key="item" :label="item" :value="item" />
                  </el-select>
                  <div class="el-form-item-msg">proxy_cache_methods GET HEAD</div>
                </el-form-item>
              </el-col>

              <el-col :span="12">
                <el-form-item label="请求时间">
                  <el-input v-model="form.monitorNginxHttpServerLocationProxyReadTimeout" clearable placeholder="1000" />
                  <div class="el-form-item-msg">proxy_read_timeout 1000</div>
                </el-form-item>
              </el-col>

              <el-col :span="12">
                <el-form-item label="发送时间">
                  <el-input v-model="form.monitorNginxHttpServerLocationProxySendTimeout" clearable placeholder="1000" />
                  <div class="el-form-item-msg">proxy_send_timeout 1000</div>
                </el-form-item>
              </el-col>

              <el-col :span="12">
                <el-form-item label="连接时间">
                  <el-input v-model="form.monitorNginxHttpServerLocationProxyConnectTimeout" clearable placeholder="1000" />
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
                  <el-input v-model="form.monitorNginxHttpServerLocationAlias" clearable placeholder="/home" />
                  <div class="el-form-item-msg">alias /data/nginx/www/;</div>
                </el-form-item>
              </el-col>
            </template>

            <el-col :span="12">
              <el-form-item label="读取时间">
                <el-input v-model="form.monitorNginxHttpServerProxyReadTimeout" clearable placeholder="60s" />
                <div class="el-form-item-msg">proxy_read_timeout 60s;</div>
              </el-form-item>
            </el-col>

            <el-col :span="12">
              <el-form-item label="发送时间">
                <el-input v-model="form.monitorNginxHttpServerProxySendTimeout" clearable placeholder="60s" />
                <div class="el-form-item-msg">proxy_send_timeout 60s;</div>
              </el-form-item>
            </el-col>

            <el-col :span="12">
              <el-form-item label="连接时间">
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
                  <el-select v-model="row.monitorNginxHttpServerLocationHeaderValue" :allow-create="true" :filterable="true">
                    <el-option label="主机" value="$host" />
                    <el-option label="真实IP" value="$remote_addr" />
                    <el-option label="原始IP" value="$proxy_add_x_forwarded_for" />
                  </el-select>
                </template>
              </el-table-column>
              <el-table-column prop="monitorNginxHttpServerLocationHeaderType" label="消息头类型">
                <template #default="{ row }">
                  <el-select v-model="row.monitorNginxHttpServerLocationHeaderType" :allow-create="true" :filterable="true">
                    <el-option label="设置" value="set_header" v-if="form.monitorNginxHttpServerLocationType == 'local'" />
                    <el-option label="追加" value="add_header" v-if="form.monitorNginxHttpServerLocationType == 'local'" />
                    <el-option label="代理设置" value="proxy_set_header" v-if="form.monitorNginxHttpServerLocationType == 'proxy'" />
                    <el-option label="代理追加" value="proxy_add_header" v-if="form.monitorNginxHttpServerLocationType == 'proxy'" />
                  </el-select>
                </template>
              </el-table-column>
            </ScFormTable>
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
import { defineAsyncComponent, defineEmits, defineExpose, h, reactive, ref, watch } from "vue";
import { fetchListFileSystem } from "@/api/monitor/filesystem";
import { useI18n } from "vue-i18n";
const { t } = useI18n();
const ScFile = defineAsyncComponent(() => import("@repo/components/ScFile/index.vue"));
const ScFormTable = defineAsyncComponent(() => import("@repo/components/ScFormTable/index.vue"));
const statusObject = reactive({
  baseSslVisible: false,
  baseHeaderVisible: true,
});
let rules = {};
const emit = defineEmits(["update:modelValue"]);
const formTableTemplate = reactive({
  monitorNginxHttpServerLocationHeaderName: null,
  monitorNginxHttpServerLocationHeaderValue: null,
  monitorNginxHttpServerLocationHeaderType: null,
});
let formTable = [];
let _serverData = {};
const visible = ref(false);
const form = reactive({
  headers: [],
});
const env = reactive({
  mode: "add",
});
const handleSaveOrUpdate = async () => {
  form.monitorNginxHttpServerId = _serverData.monitorNginxHttpServerId;
  form.headers = formTable;
  fetchSaveOrUpdateNginxHttpServerLocationConfig(form).then((res) => {
    if (res.code === "00000") {
      message(t("message.updateSuccess"), { type: "success" });
      emit("success");
      handleClose();
      return;
    }
    message(res.msg, { type: "error" });
  });
};
const handleClose = async () => {
  visible.value = false;
  rules = {};
};

const handleOpen = async (form1, serverData) => {
  visible.value = true;
  _serverData = serverData;
  Object.assign(form, form1);
  formTable = form1.headers;
  rules = {
    monitorNginxHttpServerLocationName: [
      {
        required: true,
        message: "请输入名称",
        trigger: "blur",
      },
    ],
    monitorNginxHttpServerLocationType: [
      {
        required: true,
        message: "请选择类型",
        trigger: "blur",
      },
    ],
  };
  form.monitorNginxHttpServerLocationType = !!form1.monitorNginxHttpServerLocationProxyPass ? "proxy" : "local";
  if (!form.monitorNginxHttpServerId) {
  }
};
watch(form.monitorNginxHttpServerLocationType, (val, oldVal) => {
  if (val === "proxy") {
    rules["monitorNginxHttpServerLocationProxyPass"] = [
      {
        required: true,
        message: "请输入代理地址",
        trigger: "blur",
      },
    ];
    return;
  }

  delete rules["monitorNginxHttpServerLocationProxyPass"];
});

defineExpose({
  handleOpen,
  handleClose,
});
</script>
