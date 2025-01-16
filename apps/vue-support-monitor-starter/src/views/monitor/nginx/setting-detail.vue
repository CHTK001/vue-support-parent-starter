<template>
  <div>
    <el-drawer v-model="visible" direction="ltr" :append-to-body="true" draggable :title="env.title" :close-on-click-modal="false" size="70%" @close="handleClose">
      <div>
        <el-form :model="form" label-width="160px">
          <el-divider>
            <template #default>基础配置</template>
          </el-divider>
          <el-row>
            <el-col :span="12">
              <el-form-item label="服务名称">
                <el-input v-model="form.monitorNginxHttpServerName" placeholder="localhost" />
              </el-form-item>
            </el-col>

            <el-col :span="12">
              <el-form-item label="服务端口">
                <el-input v-model="form.monitorNginxHttpServerPort" type="number" placeholder="80" />
              </el-form-item>
            </el-col>

            <el-col :span="12">
              <el-form-item label="根目录">
                <el-input v-model="form.monitorNginxHttpServerRoot" placeholder="/home" />
                <div class="el-form-item-msg">根目录</div>
                <div class="el-form-item-msg">客户端请求体的大小</div>
              </el-form-item>
            </el-col>

            <el-col :span="12">
              <el-form-item label="连接时间">
                <el-input v-model="form.monitorNginxHttpServerProxyConnectTimeout" placeholder="60s" />
                <div class="el-form-item-msg">proxy_connect_timeout 60s</div>
              </el-form-item>
            </el-col>

            <el-col :span="12">
              <el-form-item label="发送时间">
                <el-input v-model="form.monitorNginxHttpServerProxySendTimeout" placeholder="60s" />
                <div class="el-form-item-msg">proxy_send_timeout 60s</div>
              </el-form-item>
            </el-col>

            <el-col :span="12">
              <el-form-item label="读取时间">
                <el-input v-model="form.monitorNginxHttpServerProxyReadTimeout" placeholder="60s" />
                <div class="el-form-item-msg">proxy_read_timeout 60s</div>
              </el-form-item>
            </el-col>

            <el-col :span="12">
              <el-form-item label="编码">
                <el-input v-model="form.monitorNginxHttpServerCharset" placeholder="utf8" />
                <div class="el-form-item-msg">编码</div>
              </el-form-item>
            </el-col>
          </el-row>

          <el-divider>
            <template #default>SSL</template>
          </el-divider>
          <el-row>
            <el-col :span="12">
              <el-form-item label="开启SSL">
                <el-select v-model="form.monitorNginxHttpServerSsl">
                  <el-option value="ssl" label="是">是</el-option>
                  <el-option value="" label="否">否</el-option>
                </el-select>
              </el-form-item>
            </el-col>

            <el-col :span="12">
              <el-form-item label="密钥文件">
                <ScFile v-model="form.monitorNginxHttpServerSslCertificate" class="w-full" :url="fetchListFileSystem" placeholder="请选择密钥文件" />
                <div class="el-form-item-msg">ssl证书; ssl_certificate /root/.acme.sh/zjedu-ai.com_ecc/fullchain.cer</div>
              </el-form-item>
            </el-col>

            <el-col :span="12">
              <el-form-item label="密钥文件Key">
                <ScFile v-model="form.monitorNginxHttpServerSslCertificateKey" class="w-full" :url="fetchListFileSystem" placeholder="请选择密钥文件" />
                <div class="el-form-item-msg">ssl证书密钥; ssl_certificate_key /root/.acme.sh/zjedu-ai.com_ecc/private.key</div>
              </el-form-item>
            </el-col>

            <el-col :span="12">
              <el-form-item label="优先加密">
                <el-select v-model="form.monitorNginxHttpServerSslPreferServerCiphers">
                  <el-option value="on" label="是">是</el-option>
                  <el-option value="off" label="否">否</el-option>
                </el-select>
                <div class="el-form-item-msg">ssl加密优先级; ssl_prefer_server_ciphers on;</div>
              </el-form-item>
            </el-col>

            <el-col :span="12">
              <el-form-item label="超时时间">
                <el-input v-model="form.monitorNginxHttpServerSslSessionTimeout" />
                <div class="el-form-item-msg">ssl会话缓存; ssl_session_timeout 5m</div>
              </el-form-item>
            </el-col>

            <el-col :span="24">
              <el-form-item label="加密协议">
                <el-input v-model="form.monitorNginxHttpServerSslProtocols" type="textarea" />
                <div class="el-form-item-msg">ssl加密协议; ssl_protocols TLSv1 TLSv1.1 TLSv1.2;</div>
              </el-form-item>
            </el-col>

            <el-col :span="24">
              <el-form-item label="加密算法">
                <el-input v-model="form.monitorNginxHttpServerSslCiphers" type="textarea" />
                <div class="el-form-item-msg">ssl加密算法; ssl_ciphers ECDHE-RSA-AES128-GCM-SHA256:ECDHE:ECDH:AES:HIGH:!NULL:!aNULL:!MD5:!ADH:!RC4;</div>
              </el-form-item>
            </el-col>
          </el-row>
          <el-divider>
            <template #default>高级</template>
          </el-divider>

          <el-row>
            <el-col :span="24">
              <el-form-item label="错误页">
                <el-input v-model="form.monitorNginxHttpServerErrorPage" type="textarea" />
              </el-form-item>
            </el-col>

            <el-col :span="24">
              <el-form-item label="重定向">
                <el-input v-model="form.monitorNginxHttpServerReturn" type="textarea" />
              </el-form-item>
            </el-col>
          </el-row>
        </el-form>
      </div>
      <el-divider>
        <template #default>Server配置</template>
      </el-divider>
      <el-row class="flex justify-end pb-3">
        <el-form :inline="true">
          <el-form-item label="名称">
            <el-input v-model="env.params.monitorNginxHttpServerLocationName" placeholder="输入搜索关键字" />
          </el-form-item>
        </el-form>
        <el-button type="primary" :icon="useRenderIcon('ep:search')" class="btn-text" @click="handleNewSave" />
        <el-button :icon="useRenderIcon('ep:plus')" class="btn-text" @click="handleNewSave" />
      </el-row>
      <ScTable ref="tableRef" border :url="fetchPageNginxHttpServerLocationConfig" :params="env.params" :columns="env.httpColumns" :search="false">
        <template #opt>
          <el-button :icon="useRenderIcon('ep:edit')" class="btn-text" />
        </template>
      </ScTable>
    </el-drawer>
  </div>
</template>

<script setup>
import { fetchPageNginxHttpServerLocationConfig } from "@/api/monitor/nginx-http-server-location";
import { fetchPageNginxHttpServerConfig } from "@/api/monitor/nginx-http-server";
import { defineExpose, reactive, ref, defineAsyncComponent } from "vue";
import { useRenderIcon } from "@repo/components/ReIcon/src/hooks";
import { message } from "@repo/utils";
import { fetchListFileSystem } from "@/api/monitor/filesystem";

const ScFile = defineAsyncComponent(() => import("@repo/components/ScFile/index.vue"));

const tableRef = ref();
const form = reactive({});
const env = reactive({
  params: {
    monitorNginxHttpServerLocationName: null
  },
  httpColumns: [
    {
      label: "路径",
      prop: "monitorNginxHttpServerLocationName",
      align: "left"
    },
    {
      label: "代理",
      prop: "monitorNginxHttpServerLocationAlias",
      align: "left",
      formatter: row => {
        return row.monitorNginxHttpServerLocationAlias || row.monitorNginxHttpServerLocationProxyPass || "-";
      }
    },
    {
      label: "操作",
      prop: "opt",
      width: 100,
      fixed: "right"
    }
  ]
});
const data = reactive({
  nginxHttpData: {}
});
const visible = ref(false);
const handleNginxConfigHttpServerLocation = async () => {
  setTimeout(async () => {
    const res = await fetchPageNginxHttpServerLocationConfig({ monitorNginxHttpServerId: form.monitorNginxHttpServerId });
    env.params = { monitorNginxHttpId: data.nginxHttpData.monitorNginxHttpId };
    tableRef.value.reload(env.params);
  }, 100);
};
const handleClose = async () => {
  visible.value = false;
};
const handleOpen = async (mode, data) => {
  visible.value = true;
  env.title = data.monitorNginxHttpServerName;
  Object.assign(form, data);
  await handleNginxConfigHttpServerLocation();
};

defineExpose({
  handleOpen
});
</script>
