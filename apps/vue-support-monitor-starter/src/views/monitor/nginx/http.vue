<template>
  <div>
    <el-drawer v-model="visible" :append-to-body="true" draggable :title="env.title" :close-on-click-modal="false" size="60%" @close="handleClose">
      <div>
        <el-form :model="data.nginxHttpData" label-width="160px">
          <el-divider>
            <template #default>基础配置</template>
          </el-divider>
          <el-row>
            <el-col :span="12">
              <el-form-item label="客户端请求体大小">
                <el-input v-model="data.nginxHttpData.monitorNginxHttpClientBodyBufferSize" />
                <div class="el-form-item-msg">客户端请求体的大小</div>
              </el-form-item>
            </el-col>

            <el-col :span="12">
              <el-form-item label="日志路径">
                <el-input v-model="data.nginxHttpData.monitorNginxHttpAccessLog" />
                <div class="el-form-item-msg">用了log_format指令设置了日志格式之后，需要用access_log指令指定日志文件的存放路径记录了哪些用户，哪些页面以及用户浏览器、ip和其他的访问信息</div>
              </el-form-item>
            </el-col>

            <el-col :span="12">
              <el-form-item label="长连接超时时间">
                <el-input v-model="data.nginxHttpData.monitorNginxHttpKeepaliveTimeout" />
                <div class="el-form-item-msg">长连接超时时间，单位是秒</div>
              </el-form-item>
            </el-col>

            <el-col :span="12">
              <el-form-item label="高效传输模式">
                <el-select v-model="data.nginxHttpData.monitorNginxHttpSendfile">
                  <el-option value="on" label="是">是</el-option>
                  <el-option value="off" label="否">否</el-option>
                </el-select>
                <div class="el-form-item-msg">
                  开启高效文件传输模式，sendfile指令指定nginx是否调用sendfile函数来输出文件，对于普通应用设为
                  on，如果用来进行下载等应用磁盘IO重负载应用，可设置为off，以平衡磁盘与网络I/O处理速度，降低系统的负载。注意：如果图片显示不正常把这个改成off。
                </div>
              </el-form-item>
            </el-col>

            <el-col :span="12">
              <el-form-item label="一次发送">
                <el-select v-model="data.nginxHttpData.monitorNginxHttpTcpNopush" class="!min-w-[100px]">
                  <el-option value="on" label="是">是</el-option>
                  <el-option value="off" label="否">否</el-option>
                </el-select>
                <div class="el-form-item-msg">告诉nginx在一个数据包里发送所有头文件，而不一个接一个的发送</div>
              </el-form-item>
            </el-col>
          </el-row>
          <el-divider>
            <template #default>gzip压缩</template>
          </el-divider>

          <el-row>
            <el-col :span="12">
              <el-form-item label="gzip压缩输出">
                <el-select v-model="data.nginxHttpData.monitorNginxHttpGzip">
                  <el-option value="on" label="是">是</el-option>
                  <el-option value="off" label="否">否</el-option>
                </el-select>
                <div class="el-form-item-msg">gzip模块设置，使用 gzip 压缩可以降低网站带宽消耗，同时提升访问速度</div>
              </el-form-item>
            </el-col>

            <el-col :span="12">
              <el-form-item label="压缩缓冲区">
                <el-input v-model="data.nginxHttpData.monitorNginxHttpGzipBuffers" placeholder="4 16k" />
                <div class="el-form-item-msg">压缩缓冲区4 16k</div>
              </el-form-item>
            </el-col>

            <el-col :span="12">
              <el-form-item label="压缩等级">
                <el-input v-model="data.nginxHttpData.monitorNginxHttpGzipCompLevel" type="number" placeholder="2" />
                <div class="el-form-item-msg">gzip_comp_level 2</div>
              </el-form-item>
            </el-col>

            <el-col :span="12">
              <el-form-item label="压缩版本">
                <el-input v-model="data.nginxHttpData.monitorNginxHttpGzipHttpVersion" placeholder="1.0" />
                <div class="el-form-item-msg">gzip_http_version 1.0</div>
              </el-form-item>
            </el-col>

            <el-col :span="12">
              <el-form-item label="最小压缩文件大小">
                <el-input v-model="data.nginxHttpData.monitorNginxHttpGzipMinLength" placeholder="1024" />
                <div class="el-form-item-msg">最小压缩文件大小，页面字节数从header头的Content-Length中获取。默认值为0，不管多大页面都压缩，建议设置成大于1K的字节数，小于1K可能会越压越大。</div>
              </el-form-item>
            </el-col>
            <el-col :span="24">
              <el-form-item label="压缩类型">
                <el-input
                  v-model="data.nginxHttpData.monitorNginxHttpGzipTypes"
                  type="textarea"
                  placeholder="text/plain text/css text/xml text/javascript application/json application/x-javascript application/xml application/xml+rss"
                />
                <div class="el-form-item-msg">gzip_types text/plain text/css text/xml text/javascript application/json application/x-javascript application/xml application/xml+rss</div>
              </el-form-item>
            </el-col>
          </el-row>

          <el-divider>
            <template #default>其它</template>
          </el-divider>
          <el-row>
            <el-col :span="12">
              <el-form-item label="限流">
                <el-input v-model="data.nginxHttpData.monitorNginxHttpLimitReqZone" placeholder="$binary_remote_addr 10m;" />
                <div class="el-form-item-msg">限流；limit_req_zone $binary_remote_addr zone=mylimit:10m rate=1r/s;</div>
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="内部重定向">
                <el-input v-model="data.nginxHttpData.monitorNginxHttpServerNameInRedirect" />
                <div class="el-form-item-msg">让 nginx 在处理自己内部重定向时不默认使用 server_name设置中的第一个域名</div>
              </el-form-item>
            </el-col>

            <el-col :span="12">
              <el-form-item label="包含配置">
                <el-input v-model="data.nginxHttpData.monitorNginxHttpInclude" placeholder="/etc/nginx/conf.d/*.conf;" />
                <div class="el-form-item-msg">包含其他的配置文件include /etc/nginx/conf.d/*.conf;</div>
              </el-form-item>
            </el-col>
          </el-row>

          <el-row class="flex justify-end">
            <el-button :icon="useRenderIcon('ri:save-3-line')" type="primary" @click="handleSaveOrUpdate" />
          </el-row>
        </el-form>
      </div>
      <el-divider>
        <template #default>Server配置</template>
      </el-divider>
      <el-row class="flex justify-end pb-3">
        <el-button :icon="useRenderIcon('ep:plus')" class="btn-text" @click="handleNewServerSave(data.nginxHttpData)" />
      </el-row>
      <ScTable ref="tableRef" border :url="fetchPageNginxHttpServerConfig" :params="env.params" :columns="env.httpColumns" :search="false">
        <template #opt="{ row }">
          <el-button :icon="useRenderIcon('ep:edit')" class="btn-text" @click="handleDetail(row)" />
          <el-button :icon="useRenderIcon('ep:delete')" type="danger" class="btn-text" @click="handleDelete(row)" />
        </template>
      </ScTable>
    </el-drawer>

    <SettingLocation ref="settingDetailRef" @success="handleRefresh" />
    <SettingSave ref="settingSaveRef" @success="handleRefresh" />
  </div>
</template>

<script setup>
import { fetchPageNginxHttpConfig, fetchSaveOrUpdateNginxHttpConfig } from "@/api/monitor/nginx-http";
import { fetchDeleteNginxHttpServerConfig, fetchPageNginxHttpServerConfig } from "@/api/monitor/nginx-http-server";
import { defineExpose, reactive, ref, defineAsyncComponent, nextTick, defineEmits } from "vue";
import { useRenderIcon } from "@repo/components/ReIcon/src/hooks";
import { message } from "@repo/utils";
const SettingLocation = defineAsyncComponent(() => import("./server-location.vue"));
const SettingSave = defineAsyncComponent(() => import("./save/server-save.vue"));
const tableRef = ref();
const settingDetailRef = ref();
const settingSaveRef = ref();
const form = reactive({});
const env = reactive({
  httpColumns: [
    {
      label: "服务名称",
      prop: "monitorNginxHttpServerName"
    },
    {
      label: "端口",
      prop: "monitorNginxHttpServerPort"
    },
    {
      label: "错误页",
      prop: "monitorNginxHttpServerErrorPage"
    },
    {
      label: "重定向",
      prop: "monitorNginxHttpServerReturn"
    },
    {
      label: "操作",
      prop: "opt"
    }
  ]
});
const data = reactive({
  nginxHttpData: {}
});
const visible = ref(false);

const handleSaveOrUpdate = async () => {
  fetchSaveOrUpdateNginxHttpConfig(data.nginxHttpData).then(res => {
    if (res.code === "00000") {
      message("更新成功", { type: "success" });
      return;
    }
    message(res.msg, { type: "error" });
  });
};

const handleRefresh = async () => {
  settingSaveRef.value.handleClose();
  tableRef.value.reload(env.params);
};

const handleNewServerSave = async row => {
  nextTick(() => {
    settingSaveRef.value.handleOpen("add", {}, row);
  });
};

const handleDelete = async row => {
  fetchDeleteNginxHttpServerConfig({ id: row.monitorNginxHttpServerId }).then(res => {
    if (res.code === "00000") {
      message("更新成功", { type: "success" });
      tableRef.value.reload(env.params);
      return;
    }
    message(res.msg, { type: "error" });
  });
};
const handleDetail = async row => {
  nextTick(() => {
    settingDetailRef.value.handleOpen("edit", row);
  });
};
const handleNginxConfigHttp = async () => {
  setTimeout(async () => {
    const res = await fetchPageNginxHttpConfig({ monitorNginxConfigId: form.monitorNginxConfigId });
    data.nginxHttpData = res.data?.data?.[0];
    env.params = { monitorNginxHttpId: data.nginxHttpData.monitorNginxHttpId };
    tableRef.value.reload(env.params);
  }, 100);
};

const handleClose = async () => {
  visible.value = false;
};
const handleOpen = async (mode, data) => {
  visible.value = true;
  env.title = "nginx配置文件 - " + data.monitorNginxConfigName;
  Object.assign(form, data);
  await handleNginxConfigHttp();
};

defineExpose({
  handleOpen
});
</script>
