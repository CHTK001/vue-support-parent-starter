<template>
  <div>
    <el-drawer v-model="visible" :append-to-body="true" draggable :title="env.title" :close-on-click-modal="false" size="60%" @close="handleClose">
      <div>
        <div class="sticky top-[-20px] z-[10] bg-transparent">
          <el-button :icon="useRenderIcon('bi:database')" title="查看" @click="handleAnalays" />
          <el-button :icon="useRenderIcon('bi:database-fill-down')" title="生成配置" @click="handleCreate" />
          <el-button :icon="useRenderIcon('bi:save2')" title="保存配置" @click="handleSaveOrUpdateAll" />
        </div>
        <el-form :model="data.nginxHttpData" label-width="160px">
          <el-divider>
            <template #default>
              基础配置
              <el-icon class="cursor-pointer">
                <component :is="useRenderIcon('ep:arrow-down')" v-if="!statusObject.baseVisible" @click="() => (statusObject.baseVisible = true)" />
                <component :is="useRenderIcon('ep:arrow-up')" v-else @click="() => (statusObject.baseVisible = false)" />
              </el-icon>
            </template>
          </el-divider>
          <transition name="fade">
            <el-row v-if="statusObject.baseVisible" class="transform">
              <el-col :span="12">
                <el-form-item label="客户端请求体大小">
                  <el-input v-model="data.nginxHttpData.monitorNginxHttpClientBodyBufferSize" clearable placeholder="8m" />
                  <div class="el-form-item-msg">客户端请求体的大小</div>
                </el-form-item>
              </el-col>
              <el-col :span="12">
                <<el-form-item label="日志名称" prop="monitorNginxHttpLogName">
                  <el-select :allow-create="true" :filterable="true" v-model="form.monitorNginxHttpLogName">
                    <el-option label="main" value="main"></el-option>
                  </el-select>
                </el-form-item>
              </el-col>

              <el-col :span="12">
                <el-form-item label="日志格式">
                  <el-input v-model="data.nginxHttpData.monitorNginxHttpLogFormat" type="textarea" clearable placeholder="'$remote_addr - $remote_user [$time_local] ' " />
                  <div class="el-form-item-msg">
                    <pre>
                      <code>
    $remote_addr：客户端的 IP 地址。
    $remote_user：客户端的用户名（如果启用了身份验证）。
    $time_local：本地时间。
    $request：请求的完整内容（例如 GET /index.html HTTP/1.1）。
    $status：HTTP 状态码。
    $body_bytes_sent：发送给客户端的字节数。
    $http_referer：HTTP Referer 头部。
    $http_user_agent：HTTP User-Agent 头部。
    $request_time：请求处理的总时间（秒）。
    $upstream_response_time：上游服务器的响应时间。
    $upstream_addr：上游服务器的地址。
                      </code>
                    </pre>
                    <p>log_format custom '$remote_addr - $remote_user [$time_local] ' '"$request" $status $body_bytes_sent ' '"$http_referer" "$http_user_agent" ' 'request_time=$request_time';</p>
                  </div>
                </el-form-item>
              </el-col>

              <el-col :span="12">
                <el-form-item label="日志路径">
                  <el-input v-model="data.nginxHttpData.monitorNginxHttpAccessLog" clearable placeholder="/var/logs/nginx/access.log main" />
                  <div class="el-form-item-msg">用了log_format指令设置了日志格式之后，需要用access_log指令指定日志文件的存放路径记录了哪些用户，哪些页面以及用户浏览器、ip和其他的访问信息</div>
                </el-form-item>
              </el-col>

              <el-col :span="12">
                <el-form-item label="长连接超时时间">
                  <el-input v-model="data.nginxHttpData.monitorNginxHttpKeepaliveTimeout" clearable placeholder="60" />
                  <div class="el-form-item-msg">长连接超时时间，单位是秒</div>
                </el-form-item>
              </el-col>

              <el-col :span="12">
                <el-form-item label="高效传输模式">
                  <el-select v-model="data.nginxHttpData.monitorNginxHttpSendfile">
                    <el-option value="on" label="是">是</el-option>
                    <el-option value="off" label="否">否</el-option>
                  </el-select>
                  <div class="el-form-item-msg">开启高效文件传输模式，sendfile指令指定nginx是否调用sendfile函数来输出文件，对于普通应用设为 on，如果用来进行下载等应用磁盘IO重负载应用，可设置为off，以平衡磁盘与网络I/O处理速度，降低系统的负载。注意：如果图片显示不正常把这个改成off。</div>
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
          </transition>
          <el-divider>
            <template #default>
              gzip压缩
              <el-icon class="cursor-pointer">
                <component :is="useRenderIcon('ep:arrow-down')" v-if="!statusObject.baseGzipVisible" @click="() => (statusObject.baseGzipVisible = true)" />
                <component :is="useRenderIcon('ep:arrow-up')" v-else @click="() => (statusObject.baseGzipVisible = false)" />
              </el-icon>
            </template>
          </el-divider>
          <transition name="fade">
            <el-row v-if="statusObject.baseGzipVisible">
              <el-col :span="12">
                <el-form-item label="gzip压缩输出">
                  <el-select v-model="data.nginxHttpData.monitorNginxHttpGzip" clearable>
                    <el-option value="on" label="是">是</el-option>
                    <el-option value="off" label="否">否</el-option>
                  </el-select>
                  <div class="el-form-item-msg">gzip模块设置，使用 gzip 压缩可以降低网站带宽消耗，同时提升访问速度</div>
                </el-form-item>
              </el-col>

              <el-col :span="12">
                <el-form-item label="压缩缓冲区">
                  <el-input v-model="data.nginxHttpData.monitorNginxHttpGzipBuffers" clearable placeholder="4 16k" />
                  <div class="el-form-item-msg">压缩缓冲区4 16k</div>
                </el-form-item>
              </el-col>

              <el-col :span="12">
                <el-form-item label="压缩等级">
                  <el-input v-model="data.nginxHttpData.monitorNginxHttpGzipCompLevel" clearable type="number" placeholder="2" />
                  <div class="el-form-item-msg">gzip_comp_level 2</div>
                </el-form-item>
              </el-col>

              <el-col :span="12">
                <el-form-item label="压缩版本">
                  <el-input v-model="data.nginxHttpData.monitorNginxHttpGzipHttpVersion" clearable placeholder="1.0" />
                  <div class="el-form-item-msg">gzip_http_version 1.0</div>
                </el-form-item>
              </el-col>

              <el-col :span="12">
                <el-form-item label="最小压缩文件大小">
                  <el-input v-model="data.nginxHttpData.monitorNginxHttpGzipMinLength" clearable placeholder="1024" />
                  <div class="el-form-item-msg">最小压缩文件大小，页面字节数从header头的Content-Length中获取。默认值为0，不管多大页面都压缩，建议设置成大于1K的字节数，小于1K可能会越压越大。</div>
                </el-form-item>
              </el-col>
              <el-col :span="24">
                <el-form-item label="压缩类型">
                  <el-input v-model="data.nginxHttpData.monitorNginxHttpGzipTypes" type="textarea" placeholder="text/plain text/css text/xml text/javascript application/json application/x-javascript application/xml application/xml+rss" />
                  <div class="el-form-item-msg">gzip_types text/plain text/css text/xml text/javascript application/json application/x-javascript application/xml application/xml+rss</div>
                </el-form-item>
              </el-col>
            </el-row>
          </transition>
          <el-divider>
            <template #default>
              其它
              <el-icon class="cursor-pointer">
                <component :is="useRenderIcon('ep:arrow-down')" v-if="!statusObject.baseOtherVisible" @click="() => (statusObject.baseOtherVisible = true)" />
                <component :is="useRenderIcon('ep:arrow-up')" v-else @click="() => (statusObject.baseOtherVisible = false)" />
              </el-icon>
            </template>
          </el-divider>
          <transition name="fade">
            <el-row v-if="statusObject.baseOtherVisible">
              <el-col :span="12">
                <el-form-item label="限流">
                  <el-input v-model="data.nginxHttpData.monitorNginxHttpLimitReqZone" clearable placeholder="$binary_remote_addr 10m;" />
                  <div class="el-form-item-msg">限流；limit_req_zone $binary_remote_addr zone=mylimit:10m rate=1r/s;</div>
                </el-form-item>
              </el-col>
              <el-col :span="12">
                <el-form-item label="内部重定向">
                  <el-input v-model="data.nginxHttpData.monitorNginxHttpServerNameInRedirect" clearable />
                  <div class="el-form-item-msg">让 nginx 在处理自己内部重定向时不默认使用 server_name设置中的第一个域名</div>
                </el-form-item>
              </el-col>

              <el-col :span="12">
                <el-form-item label="包含配置">
                  <el-input v-model="data.nginxHttpData.monitorNginxHttpInclude" clearable placeholder="/etc/nginx/conf.d/*.conf;" />
                  <div class="el-form-item-msg">包含其他的配置文件include /etc/nginx/conf.d/*.conf;</div>
                </el-form-item>
              </el-col>
            </el-row>
          </transition>
          <el-row class="flex justify-end">
            <el-button :icon="useRenderIcon('ri:save-3-line')" type="primary" @click="handleSaveOrUpdate" />
          </el-row>

          <el-divider>
            <template #default>
              事件
              <el-icon class="cursor-pointer">
                <component :is="useRenderIcon('ep:arrow-down')" v-if="!statusObject.baseEventsVisible" @click="() => (statusObject.baseEventsVisible = true)" />
                <component :is="useRenderIcon('ep:arrow-up')" v-else @click="() => (statusObject.baseEventsVisible = false)" />
              </el-icon>
            </template>
          </el-divider>
          <transition name="fade">
            <el-row v-if="statusObject.baseEventsVisible">
              <el-col :span="12">
                <el-form-item label="连接数">
                  <el-input v-model="data.events.monitorNginxEventWorkerConnections" type="number" clearable placeholder="1024" />
                  <div class="el-form-item-msg">Nginx 的工作模式及连接数上限 worker_connections 1024;</div>
                </el-form-item>
              </el-col>
              <el-col :span="12">
                <el-form-item label="事件模型">
                  <el-input v-model="data.events.monitorNginxEventUse" clearable placeholder="poll" />
                  <div class="el-form-item-msg">use epoll;指定使用哪种事件模型。Nginx 支持多种事件模型，如 epoll（Linux）、kqueue（BSD）、select 和 poll 等。通常，Nginx 会根据操作系统自动选择最佳的事件模型，但也可以手动指定</div>
                </el-form-item>
              </el-col>
              <el-col :span="12">
                <el-form-item label="多连接">
                  <el-select v-model="data.events.monitorNginxEventMultiAccept" clearable placeholder="是">
                    <el-option value="on" label="是">是</el-option>
                    <el-option value="off" label="否">否</el-option>
                  </el-select>
                  <div class="el-form-item-msg">multi_accept on; 设置是否允许服务器在单个监听事件中接受多个连接。这可以减少 I/O 等待时间，提高性能</div>
                </el-form-item>
              </el-col>

              <el-col :span="12">
                <el-form-item label="多工作进程">
                  <el-select v-model="data.events.monitorNginxEventAcceptMutex" clearable placeholder="是">
                    <el-option value="on" label="是">是</el-option>
                    <el-option value="off" label="否">否</el-option>
                  </el-select>
                  <div class="el-form-item-msg">accept_mutex on;在某些情况下，可以设置为 on 来允许多个工作进程同时监听相同的端口。默认情况下，它是关闭的，以避免多个进程间的端口竞争</div>
                </el-form-item>
              </el-col>
              <el-col :span="24">
                <div class="flex justify-end w-full">
                  <el-button :icon="useRenderIcon('ri:save-3-line')" type="primary" @click="handleSaveOrUpdateEvents" />
                </div>
              </el-col>
            </el-row>
          </transition>
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
    <Processor ref="processorRef" :event-name="env.eventName" @finish="handleFinish" />
    <Boradcast ref="boradcastRef" @success="handleRefresh" />
  </div>
</template>

<script setup>
import { fetchCreateNginxConfig } from "@/api/monitor/nginx";
import { fetchPageNginxHttpConfig, fetchSaveOrUpdateNginxHttpConfig } from "@/api/monitor/nginx-http";
import { fetchDeleteNginxHttpServerConfig, fetchPageNginxHttpServerConfig } from "@/api/monitor/nginx-http-server";
import { defineExpose, reactive, ref, defineAsyncComponent, nextTick, defineEmits } from "vue";
import { useRenderIcon } from "@repo/components/ReIcon/src/hooks";
import { message } from "@repo/utils";
import { fetchSaveNginxEventsConfig } from "@/api/monitor/nginx-events";
import { useI18n } from "vue-i18n";
const { t } = useI18n();
const Processor = defineAsyncComponent(() => import("./processor.vue"));
const SettingLocation = defineAsyncComponent(() => import("./server-location.vue"));
const SettingSave = defineAsyncComponent(() => import("./save/server-save.vue"));
const Boradcast = defineAsyncComponent({
  loader: () => import("./analysis.vue"),
  delay: 1000,
});
const tableRef = ref();
const settingDetailRef = ref();
const settingSaveRef = ref();
const boradcastRef = ref();
const processorRef = ref("");
const form = reactive({});
const statusObject = reactive({
  baseVisible: true,
  baseOtherVisible: false,
  baseEventsVisible: true,
  baseGzipVisible: false,
});
const env = reactive({
  eventName: "nginx-create-",
  httpColumns: [
    {
      label: "服务名称",
      prop: "monitorNginxHttpServerName",
    },
    {
      label: "端口",
      prop: "monitorNginxHttpServerPort",
    },
    {
      label: "错误页",
      prop: "monitorNginxHttpServerErrorPage",
    },
    {
      label: "重定向",
      prop: "monitorNginxHttpServerReturn",
    },
    {
      label: "操作",
      prop: "opt",
    },
  ],
});
const data = reactive({
  nginxHttpData: {},
  events: {},
});
const visible = ref(false);
const handleFinish = async () => {
  processorRef.value.handleClose();
};

const handleAnalays = async () => {
  boradcastRef.value.handleOpen("edit", form);
};

const handleCreate = async () => {
  processorRef.value.handleOpen();
  fetchCreateNginxConfig(data.nginxHttpData).then((res) => {
    if (res.code === "00000") {
      message("生成成功", { type: "success" });
      processorRef.value.handleClose();
      return;
    }
    message(res.msg, { type: "error" });
  });
};

const handleSaveOrUpdateEvents = async () => {
  fetchSaveNginxEventsConfig(data.events).then((res) => {
    if (res.code === "00000") {
      message("事件配置更新成功", { type: "success" });
      return;
    }
    message(res.msg, { type: "error" });
  });
};

const handleSaveOrUpdateAll = async () => {
  handleSaveOrUpdateEvents();
  handleSaveOrUpdate();
};
const handleSaveOrUpdate = async () => {
  fetchSaveOrUpdateNginxHttpConfig(data.nginxHttpData).then((res) => {
    if (res.code === "00000") {
      message("基本配置更新成功", { type: "success" });
      return;
    }
    message(res.msg, { type: "error" });
  });
};

const handleRefresh = async () => {
  settingSaveRef.value.handleClose();
  tableRef.value.reload(env.params);
};

const handleNewServerSave = async (row) => {
  nextTick(() => {
    settingSaveRef.value.handleOpen("add", {}, row);
  });
};

const handleDelete = async (row) => {
  fetchDeleteNginxHttpServerConfig({ id: row.monitorNginxHttpServerId }).then((res) => {
    if (res.code === "00000") {
      message(t("message.updateSuccess"), { type: "success" });
      tableRef.value.reload(env.params);
      return;
    }
    message(res.msg, { type: "error" });
  });
};
const handleDetail = async (row) => {
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
const handleOpen = async (mode, form1) => {
  visible.value = true;
  env.title = "nginx配置文件 - " + form1.monitorNginxConfigName;
  Object.assign(form, form1);
  env.eventName = "nginx-create-" + form1.monitorNginxConfigId;
  data.events = form1.events || {};
  data.events.monitorNginxConfigId = form1.monitorNginxConfigId;
  await handleNginxConfigHttp();
};

defineExpose({
  handleOpen,
});
</script>
