<template>
  <div class="nginx-http">
    <el-drawer v-model="visible" :append-to-body="true" draggable :title="env.title" :close-on-click-modal="false" size="60%" class="nginx-http__drawer" @close="handleClose">
      <div class="nginx-http__content">
        <!-- 顶部工具栏 -->
        <div class="nginx-http__toolbar">
          <el-tooltip content="查看配置" placement="top">
            <el-button class="nginx-http__toolbar-btn" type="primary" plain @click="handleAnalays">
              <IconifyIconOnline icon="bi:database" />
              <span>查看配置</span>
            </el-button>
          </el-tooltip>

          <el-tooltip content="生成配置" placement="top">
            <el-button class="nginx-http__toolbar-btn" type="success" plain @click="handleCreate">
              <IconifyIconOnline icon="bi:database-fill-down" />
              <span>生成配置</span>
            </el-button>
          </el-tooltip>

          <el-tooltip content="保存配置" placement="top">
            <el-button class="nginx-http__toolbar-btn" type="warning" plain @click="handleSaveOrUpdateAll">
              <IconifyIconOnline icon="bi:save2" />
              <span>保存配置</span>
            </el-button>
          </el-tooltip>
        </div>

        <!-- 表单区域 -->
        <el-form :model="data.nginxHttpData" label-width="160px" class="nginx-http__form">
          <!-- 基础配置卡片 -->
          <div class="nginx-http__card">
            <div class="nginx-http__card-header" @click="() => (statusObject.baseVisible = !statusObject.baseVisible)">
              <div class="nginx-http__card-title">
                <IconifyIconOnline icon="ri:settings-line" class="nginx-http__card-icon" />
                <span>基础配置</span>
              </div>
              <div class="nginx-http__card-action">
                <IconifyIconOnline :icon="statusObject.baseVisible ? 'ep:arrow-up' : 'ep:arrow-down'" class="nginx-http__card-arrow" />
              </div>
            </div>

            <div class="nginx-http__card-body" :class="{ 'nginx-http__card-body--collapsed': !statusObject.baseVisible }">
              <el-row :gutter="20">
                <!-- 现有表单项保持不变 -->
                <el-col :span="12">
                  <el-form-item label="客户端请求体大小" class="nginx-http__form-item">
                    <el-input v-model="data.nginxHttpData.monitorNginxHttpClientBodyBufferSize" clearable placeholder="8m" class="nginx-http__input" />
                    <div class="nginx-http__form-tip">客户端请求体的大小</div>
                  </el-form-item>
                </el-col>

                <el-col :span="12">
                  <el-form-item label="日志名称" prop="monitorNginxHttpLogName" class="nginx-http__form-item">
                    <el-select v-model="form.monitorNginxHttpLogName" :allow-create="true" :filterable="true">
                      <el-option label="main" value="main" />
                    </el-select>
                  </el-form-item>
                </el-col>

                <el-col :span="12">
                  <el-form-item label="日志格式" class="nginx-http__form-item">
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
                  <el-form-item label="日志路径" class="nginx-http__form-item">
                    <el-input v-model="data.nginxHttpData.monitorNginxHttpAccessLog" clearable placeholder="/var/logs/nginx/access.log main" />
                    <div class="el-form-item-msg">用了log_format指令设置了日志格式之后，需要用access_log指令指定日志文件的存放路径记录了哪些用户，哪些页面以及用户浏览器、ip和其他的访问信息</div>
                  </el-form-item>
                </el-col>

                <el-col :span="12">
                  <el-form-item label="长连接超时时间" class="nginx-http__form-item">
                    <el-input v-model="data.nginxHttpData.monitorNginxHttpKeepaliveTimeout" clearable placeholder="60" />
                    <div class="el-form-item-msg">长连接超时时间，单位是秒</div>
                  </el-form-item>
                </el-col>

                <el-col :span="12">
                  <el-form-item label="高效传输模式" class="nginx-http__form-item">
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
                  <el-form-item label="一次发送" class="nginx-http__form-item">
                    <el-select v-model="data.nginxHttpData.monitorNginxHttpTcpNopush" class="!min-w-[100px]">
                      <el-option value="on" label="是">是</el-option>
                      <el-option value="off" label="否">否</el-option>
                    </el-select>
                    <div class="el-form-item-msg">告诉nginx在一个数据包里发送所有头文件，而不一个接一个的发送</div>
                  </el-form-item>
                </el-col>
              </el-row>
            </div>
          </div>

          <!-- GZIP压缩卡片 -->
          <div class="nginx-http__card">
            <div class="nginx-http__card-header" @click="() => (statusObject.baseGzipVisible = !statusObject.baseGzipVisible)">
              <div class="nginx-http__card-title">
                <IconifyIconOnline icon="ri:file-zip-line" class="nginx-http__card-icon" />
                <span>GZIP压缩</span>
              </div>
              <div class="nginx-http__card-action">
                <IconifyIconOnline :icon="statusObject.baseGzipVisible ? 'ep:arrow-up' : 'ep:arrow-down'" class="nginx-http__card-arrow" />
              </div>
            </div>

            <div class="nginx-http__card-body" :class="{ 'nginx-http__card-body--collapsed': !statusObject.baseGzipVisible }">
              <transition name="fade">
                <el-row v-if="statusObject.baseGzipVisible">
                  <el-col :span="12">
                    <el-form-item label="gzip压缩输出" class="nginx-http__form-item">
                      <el-select v-model="data.nginxHttpData.monitorNginxHttpGzip" clearable>
                        <el-option value="on" label="是">是</el-option>
                        <el-option value="off" label="否">否</el-option>
                      </el-select>
                      <div class="el-form-item-msg">gzip模块设置，使用 gzip 压缩可以降低网站带宽消耗，同时提升访问速度</div>
                    </el-form-item>
                  </el-col>

                  <el-col :span="12">
                    <el-form-item label="压缩缓冲区" class="nginx-http__form-item">
                      <el-input v-model="data.nginxHttpData.monitorNginxHttpGzipBuffers" clearable placeholder="4 16k" />
                      <div class="el-form-item-msg">压缩缓冲区4 16k</div>
                    </el-form-item>
                  </el-col>

                  <el-col :span="12">
                    <el-form-item label="压缩等级" class="nginx-http__form-item">
                      <el-input v-model="data.nginxHttpData.monitorNginxHttpGzipCompLevel" clearable type="number" placeholder="2" />
                      <div class="el-form-item-msg">gzip_comp_level 2</div>
                    </el-form-item>
                  </el-col>

                  <el-col :span="12">
                    <el-form-item label="压缩版本" class="nginx-http__form-item">
                      <el-input v-model="data.nginxHttpData.monitorNginxHttpGzipHttpVersion" clearable placeholder="1.0" />
                      <div class="el-form-item-msg">gzip_http_version 1.0</div>
                    </el-form-item>
                  </el-col>

                  <el-col :span="12">
                    <el-form-item label="最小压缩文件大小" class="nginx-http__form-item">
                      <el-input v-model="data.nginxHttpData.monitorNginxHttpGzipMinLength" clearable placeholder="1024" />
                      <div class="el-form-item-msg">最小压缩文件大小，页面字节数从header头的Content-Length中获取。默认值为0，不管多大页面都压缩，建议设置成大于1K的字节数，小于1K可能会越压越大。</div>
                    </el-form-item>
                  </el-col>
                  <el-col :span="24">
                    <el-form-item label="压缩类型" class="nginx-http__form-item">
                      <el-input
                        v-model="data.nginxHttpData.monitorNginxHttpGzipTypes"
                        type="textarea"
                        placeholder="text/plain text/css text/xml text/javascript application/json application/x-javascript application/xml application/xml+rss"
                      />
                      <div class="el-form-item-msg">gzip_types text/plain text/css text/xml text/javascript application/json application/x-javascript application/xml application/xml+rss</div>
                    </el-form-item>
                  </el-col>
                </el-row>
              </transition>
            </div>
          </div>

          <!-- 其他配置卡片 -->
          <div class="nginx-http__card">
            <div class="nginx-http__card-header" @click="() => (statusObject.baseOtherVisible = !statusObject.baseOtherVisible)">
              <div class="nginx-http__card-title">
                <IconifyIconOnline icon="ri:more-line" class="nginx-http__card-icon" />
                <span>其它配置</span>
              </div>
              <div class="nginx-http__card-action">
                <IconifyIconOnline :icon="statusObject.baseOtherVisible ? 'ep:arrow-up' : 'ep:arrow-down'" class="nginx-http__card-arrow" />
              </div>
            </div>

            <div class="nginx-http__card-body" :class="{ 'nginx-http__card-body--collapsed': !statusObject.baseOtherVisible }">
              <transition name="fade">
                <el-row v-if="statusObject.baseOtherVisible">
                  <el-col :span="12">
                    <el-form-item label="限流" class="nginx-http__form-item">
                      <el-input v-model="data.nginxHttpData.monitorNginxHttpLimitReqZone" clearable placeholder="$binary_remote_addr 10m;" />
                      <div class="el-form-item-msg">限流；limit_req_zone $binary_remote_addr zone=mylimit:10m rate=1r/s;</div>
                    </el-form-item>
                  </el-col>
                  <el-col :span="12">
                    <el-form-item label="内部重定向" class="nginx-http__form-item">
                      <el-input v-model="data.nginxHttpData.monitorNginxHttpServerNameInRedirect" clearable />
                      <div class="el-form-item-msg">让 nginx 在处理自己内部重定向时不默认使用 server_name设置中的第一个域名</div>
                    </el-form-item>
                  </el-col>

                  <el-col :span="12">
                    <el-form-item label="包含配置" class="nginx-http__form-item">
                      <el-input v-model="data.nginxHttpData.monitorNginxHttpInclude" clearable placeholder="/etc/nginx/conf.d/*.conf;" />
                      <div class="el-form-item-msg">包含其他的配置文件include /etc/nginx/conf.d/*.conf;</div>
                    </el-form-item>
                  </el-col>
                </el-row>
              </transition>
            </div>
          </div>

          <!-- 保存按钮 -->
          <div class="nginx-http__form-actions">
            <el-button type="primary" class="nginx-http__save-btn" @click="handleSaveOrUpdate">
              <IconifyIconOnline icon="ri:save-3-line" />
              <span>保存配置</span>
            </el-button>
          </div>

          <!-- 事件配置卡片 -->
          <div class="nginx-http__card">
            <div class="nginx-http__card-header" @click="() => (statusObject.baseEventsVisible = !statusObject.baseEventsVisible)">
              <div class="nginx-http__card-title">
                <IconifyIconOnline icon="ri:calendar-event-line" class="nginx-http__card-icon" />
                <span>事件配置</span>
              </div>
              <div class="nginx-http__card-action">
                <IconifyIconOnline :icon="statusObject.baseEventsVisible ? 'ep:arrow-up' : 'ep:arrow-down'" class="nginx-http__card-arrow" />
              </div>
            </div>

            <div class="nginx-http__card-body" :class="{ 'nginx-http__card-body--collapsed': !statusObject.baseEventsVisible }">
              <transition name="fade">
                <el-row v-if="statusObject.baseEventsVisible">
                  <el-col :span="12">
                    <el-form-item label="连接数" class="nginx-http__card-icon">
                      <el-input v-model="data.events.monitorNginxEventWorkerConnections" type="number" clearable placeholder="1024" />
                      <div class="el-form-item-msg">Nginx 的工作模式及连接数上限 worker_connections 1024;</div>
                    </el-form-item>
                  </el-col>
                  <el-col :span="12">
                    <el-form-item label="事件模型" class="nginx-http__card-icon">
                      <el-input v-model="data.events.monitorNginxEventUse" clearable placeholder="poll" />
                      <div class="el-form-item-msg">
                        use epoll;指定使用哪种事件模型。Nginx 支持多种事件模型，如 epoll（Linux）、kqueue（BSD）、select 和 poll 等。通常，Nginx 会根据操作系统自动选择最佳的事件模型，但也可以手动指定
                      </div>
                    </el-form-item>
                  </el-col>
                  <el-col :span="12">
                    <el-form-item label="多连接" class="nginx-http__card-icon">
                      <el-select v-model="data.events.monitorNginxEventMultiAccept" clearable placeholder="是">
                        <el-option value="on" label="是">是</el-option>
                        <el-option value="off" label="否">否</el-option>
                      </el-select>
                      <div class="el-form-item-msg">multi_accept on; 设置是否允许服务器在单个监听事件中接受多个连接。这可以减少 I/O 等待时间，提高性能</div>
                    </el-form-item>
                  </el-col>

                  <el-col :span="12">
                    <el-form-item label="多工作进程" class="nginx-http__card-icon">
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
              <!-- ... 事件配置项 ... -->

              <!-- 事件保存按钮 -->
              <div class="nginx-http__form-actions">
                <el-button type="primary" class="nginx-http__save-btn" @click="handleSaveOrUpdateEvents">
                  <IconifyIconOnline icon="ri:save-3-line" />
                  <span>保存事件配置</span>
                </el-button>
              </div>
            </div>
          </div>
        </el-form>

        <!-- Server配置区域 -->
        <div class="nginx-http__server-section">
          <div class="nginx-http__section-header">
            <div class="nginx-http__section-title">
              <IconifyIconOnline icon="ri:server-line" class="nginx-http__section-icon" />
              <span>Server配置</span>
            </div>
            <el-button type="primary" class="nginx-http__add-btn" @click="handleNewServerSave(data.nginxHttpData)">
              <IconifyIconOnline icon="ep:plus" />
              <span>添加Server</span>
            </el-button>
          </div>

          <div class="nginx-http__server-table">
            <ScTable ref="tableRef" border :url="fetchPageNginxHttpServerConfig" :params="env.params" :columns="env.httpColumns" :search="false" class="nginx-http__table">
              <el-table-column>
                <template #default="{ row }">
                  <div class="flex">
                    <el-button type="primary" plain size="small" class="nginx-http__table-btn" @click="handleDetail(row)">
                      <IconifyIconOnline icon="ep:edit" />
                      <span>编辑</span>
                    </el-button>
                    <el-button type="danger" plain size="small" class="nginx-http__table-btn" @click="handleDelete(row)">
                      <IconifyIconOnline icon="ep:delete" />
                      <span>删除</span>
                    </el-button>
                  </div>
                </template>
              </el-table-column>
            </ScTable>
          </div>
        </div>
      </div>
    </el-drawer>

    <!-- 组件引用 -->
    <SettingLocation ref="settingDetailRef" @success="handleRefresh" />
    <SettingSave ref="settingSaveRef" @success="handleRefresh" />
    <Processor ref="processorRef" :event-name="env.eventName" @finish="handleFinish" />
    <Boradcast ref="boradcastRef" @success="handleRefresh" />
  </div>
</template>

<script setup>
// 导入保持不变
import { fetchCreateNginxConfig } from "@/api/monitor/nginx";
import { fetchPageNginxHttpConfig, fetchSaveOrUpdateNginxHttpConfig } from "@/api/monitor/nginx-http";
import { fetchDeleteNginxHttpServerConfig, fetchPageNginxHttpServerConfig } from "@/api/monitor/nginx-http-server";
import { defineExpose, reactive, ref, defineAsyncComponent, nextTick } from "vue";
import { useRenderIcon } from "@repo/components/ReIcon/src/hooks";
import { message } from "@repo/utils";
import { fetchSaveNginxEventsConfig } from "@/api/monitor/nginx-events";
import { useI18n } from "vue-i18n";

// 国际化
const { t } = useI18n();

// 异步加载组件
const Processor = defineAsyncComponent(() => import("./processor.vue"));
const SettingLocation = defineAsyncComponent(() => import("./server-location.vue"));
const SettingSave = defineAsyncComponent(() => import("./save/server-save.vue"));
const Boradcast = defineAsyncComponent({
  loader: () => import("./analysis.vue"),
  delay: 1000
});

// 组件引用
const tableRef = ref();
const settingDetailRef = ref();
const settingSaveRef = ref();
const boradcastRef = ref();
const processorRef = ref("");
const form = reactive({});

// 状态对象 - 控制各部分的显示/隐藏
const statusObject = reactive({
  baseVisible: true,
  baseOtherVisible: false,
  baseEventsVisible: true,
  baseGzipVisible: false
});

// 环境配置
const env = reactive({
  eventName: "nginx-create-",
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

// 数据对象
const data = reactive({
  nginxHttpData: {},
  events: {}
});

// 抽屉可见性
const visible = ref(false);

// 处理函数保持不变
const handleFinish = async () => {
  processorRef.value.handleClose();
};

const handleAnalays = async () => {
  boradcastRef.value.handleOpen("edit", form);
};

const handleCreate = async () => {
  processorRef.value.handleOpen();
  fetchCreateNginxConfig(data.nginxHttpData).then(res => {
    if (res.code === "00000") {
      message("生成成功", { type: "success" });
      processorRef.value.handleClose();
      return;
    }
    message(res.msg, { type: "error" });
  });
};

const handleSaveOrUpdateEvents = async () => {
  fetchSaveNginxEventsConfig(data.events).then(res => {
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
  fetchSaveOrUpdateNginxHttpConfig(data.nginxHttpData).then(res => {
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

const handleNewServerSave = async row => {
  nextTick(() => {
    settingSaveRef.value.handleOpen("add", {}, row);
  });
};

const handleDelete = async row => {
  fetchDeleteNginxHttpServerConfig({ id: row.monitorNginxHttpServerId }).then(res => {
    if (res.code === "00000") {
      message(t("message.updateSuccess"), { type: "success" });
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

const handleOpen = async (mode, form1) => {
  visible.value = true;
  env.title = "nginx配置文件 - " + form1.monitorNginxConfigName;
  Object.assign(form, form1);
  env.eventName = "nginx-create-" + form1.monitorNginxConfigId;
  data.events = form1.events || {};
  data.events.monitorNginxConfigId = form1.monitorNginxConfigId;
  await handleNginxConfigHttp();
};

// 暴露方法
defineExpose({
  handleOpen
});
</script>

<style lang="scss" scoped>
.nginx-http {
  /* 抽屉样式优化 */
  &__drawer {
    :deep(.el-drawer__header) {
      margin-bottom: 0;
      padding: 16px 20px;
      border-bottom: 1px solid var(--el-border-color-lighter);
      background: linear-gradient(to right, var(--el-color-primary-light-9), var(--el-bg-color));
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
    }

    :deep(.el-drawer__body) {
      padding: 0;
      overflow: auto;
    }
  }

  /* 内容区域样式 */
  &__content {
    padding: 20px;
    height: 100%;
    overflow: auto;
    background-color: var(--el-bg-color-page);
  }

  /* 工具栏样式 */
  &__toolbar {
    display: flex;
    gap: 12px;
    margin-bottom: 20px;
    padding: 12px 16px;
    background-color: var(--el-bg-color-overlay);
    border-radius: 8px;
    box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.05);
    position: sticky;
    top: 0;
    z-index: 10;
    backdrop-filter: blur(4px);
    border: 1px solid var(--el-border-color-lighter);
    transition: all 0.3s ease;

    &:hover {
      box-shadow: 0 4px 16px 0 rgba(0, 0, 0, 0.1);
      transform: translateY(-2px);
    }
  }

  /* 工具栏按钮样式 */
  &__toolbar-btn {
    display: flex;
    align-items: center;
    gap: 6px;
    transition: all 0.3s ease;
    border-radius: 6px;
    overflow: hidden;
    position: relative;

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
      box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);

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

    &:hover {
      box-shadow: 0 4px 16px 0 rgba(0, 0, 0, 0.1);
      border-color: var(--el-color-primary-light-7);
      transform: translateY(-2px);
    }
  }

  /* 卡片头部样式 */
  &__card-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 12px 16px;
    background: linear-gradient(to right, var(--el-color-primary-light-9), var(--el-bg-color));
    cursor: pointer;
    transition: all 0.3s ease;
    border-bottom: 1px solid var(--el-border-color-lighter);

    &:hover {
      background: linear-gradient(to right, var(--el-color-primary-light-8), var(--el-bg-color));
    }
  }

  /* 卡片标题样式 */
  &__card-title {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 16px;
    font-weight: 600;
    color: var(--el-text-color-primary);
  }

  /* 卡片图标样式 */
  &__card-icon {
    font-size: 20px;
    color: var(--el-color-primary);
    filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.1));
  }

  /* 卡片箭头样式 */
  &__card-arrow {
    font-size: 16px;
    color: var(--el-text-color-secondary);
    transition: transform 0.3s ease;
  }

  /* 卡片内容样式 */
  &__card-body {
    padding: 16px;
    background-color: var(--el-bg-color);
    transition:
      max-height 0.3s ease,
      opacity 0.3s ease,
      transform 0.3s ease,
      padding 0.3s ease;
    max-height: 2000px;
    opacity: 1;
    transform: translateY(0);

    &--collapsed {
      max-height: 0;
      padding: 0 16px;
      opacity: 0;
      transform: translateY(-10px);
      overflow: hidden;
    }
  }

  /* 表单项样式 */
  &__form-item {
    margin-bottom: 16px;
    transition: all 0.3s ease;
    border-radius: 4px;
    padding: 8px;

    &:hover {
      background-color: var(--el-fill-color-light);
      transform: translateX(4px);
    }
  }

  /* 表单提示样式 */
  &__form-tip {
    margin-top: 4px;
    font-size: 12px;
    color: var(--el-text-color-secondary);
    line-height: 1.4;
  }

  /* 表单操作样式 */
  &__form-actions {
    display: flex;
    justify-content: flex-end;
    margin-top: 16px;
    padding-top: 16px;
    border-top: 1px dashed var(--el-border-color-lighter);
  }

  /* 保存按钮样式 */
  &__save-btn {
    display: flex;
    align-items: center;
    gap: 6px;
    transition: all 0.3s ease;
    border-radius: 6px;
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

  /* 服务器配置区域样式 */
  &__server-section {
    margin-top: 24px;
    border-radius: 8px;
    overflow: hidden;
    box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.05);
    border: 1px solid var(--el-border-color-lighter);
    background-color: var(--el-bg-color);
    transition: all 0.3s ease;

    &:hover {
      box-shadow: 0 4px 16px 0 rgba(0, 0, 0, 0.1);
      border-color: var(--el-color-primary-light-7);
      transform: translateY(-2px);
    }
  }

  /* 区域头部样式 */
  &__section-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 12px 16px;
    background: linear-gradient(to right, var(--el-color-primary-light-9), var(--el-bg-color));
    border-bottom: 1px solid var(--el-border-color-lighter);
  }

  /* 区域标题样式 */
  &__section-title {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 16px;
    font-weight: 600;
    color: var(--el-text-color-primary);
  }

  /* 区域图标样式 */
  &__section-icon {
    font-size: 20px;
    color: var(--el-color-primary);
    filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.1));
  }

  /* 添加按钮样式 */
  &__add-btn {
    display: flex;
    align-items: center;
    gap: 6px;
    transition: all 0.3s ease;
    border-radius: 6px;
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

  /* 服务器表格区域样式 */
  &__server-table {
    padding: 16px;
  }

  /* 表格样式 */
  &__table {
    :deep(.el-table) {
      border-radius: 8px;
      overflow: hidden;
      box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.05);

      .el-table__header-wrapper {
        th {
          background-color: var(--el-fill-color-light);
          color: var(--el-text-color-primary);
          font-weight: 600;
          padding: 12px 0;

          .cell {
            padding: 0 12px;
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
          z-index: 1;
        }

        &:nth-child(even) {
          background-color: var(--el-fill-color-light);
        }
      }
    }
  }

  /* 表格按钮样式 */
  &__table-btn {
    display: flex;
    align-items: center;
    gap: 4px;
    margin: 0 4px;
    transition: all 0.3s ease;
    border-radius: 4px;

    &:hover {
      transform: translateY(-2px);
      box-shadow: 0 2px 6px rgba(0, 0, 0, 0.1);
    }

    &:active {
      transform: translateY(0);
    }
  }

  /* 输入框样式 */
  &__input {
    transition: all 0.3s ease;

    &:focus {
      transform: translateY(-2px);
      box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
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
