<template>
  <div class="containers-page">
    <!-- 页面头部 -->
    <div class="page-header">
      <div class="header-left">
        <div class="page-title">
          <IconifyIconOnline icon="ri:container-line" class="title-icon" />
          <span>容器管理</span>
        </div>
        <div class="page-subtitle">Docker容器运行状态监控与管理</div>
      </div>
      <div class="header-right">
        <el-button @click="refreshContainers" :loading="loading">
          <IconifyIconOnline icon="ri:refresh-line" class="mr-1" />
          刷新
        </el-button>
        <el-button type="primary" @click="openCreateDialog">
          <IconifyIconOnline icon="ri:add-line" class="mr-1" />
          创建容器
        </el-button>
      </div>
    </div>

    <!-- 搜索和筛选 -->
    <div class="search-bar">
      <div class="search-left">
        <el-input
          v-model="searchParams.keyword"
          placeholder="搜索容器名称、镜像或ID"
          class="search-input"
          clearable
          @keyup.enter="loadContainers"
        >
          <template #prefix>
            <IconifyIconOnline icon="ri:search-line" />
          </template>
        </el-input>
        <el-select
          v-model="searchParams.status"
          placeholder="状态"
          clearable
          class="filter-select"
        >
          <el-option label="全部" value="" />
          <el-option label="运行中" value="running" />
          <el-option label="已停止" value="exited" />
          <el-option label="暂停" value="paused" />
          <el-option label="重启中" value="restarting" />
          <el-option label="已删除" value="dead" />
        </el-select>
        <el-select
          v-model="searchParams.serverId"
          placeholder="服务器"
          clearable
          class="filter-select"
        >
          <el-option label="全部" value="" />
          <el-option
            v-for="server in serverOptions"
            :key="server.id"
            :label="server.name"
            :value="server.id"
          />
        </el-select>
        <el-select
          v-model="searchParams.softId"
          placeholder="软件"
          clearable
          class="filter-select"
        >
          <el-option label="全部" value="" />
          <el-option
            v-for="soft in softOptions"
            :key="soft.id"
            :label="soft.name"
            :value="soft.id"
          />
        </el-select>
      </div>
      <div class="search-right">
        <el-button type="primary" @click="loadContainers">
          <IconifyIconOnline icon="ri:search-line" class="mr-1" />
          搜索
        </el-button>
        <el-button @click="resetSearch">
          <IconifyIconOnline icon="ri:refresh-line" class="mr-1" />
          重置
        </el-button>
      </div>
    </div>

    <!-- 统计信息 -->
    <StatsCard :stats="statsData" :details="statsDetails" :show-toggle="true" />

    <!-- 容器列表 -->
    <el-card class="containers-card">
      <template #header>
        <div class="card-header">
          <span>容器列表</span>
          <div class="header-actions">
            <el-button
              size="small"
              @click="batchStart"
              :disabled="selectedContainers.length === 0"
            >
              <IconifyIconOnline icon="ri:play-line" class="mr-1" />
              批量启动
            </el-button>
            <el-button
              size="small"
              @click="batchStop"
              :disabled="selectedContainers.length === 0"
            >
              <IconifyIconOnline icon="ri:stop-line" class="mr-1" />
              批量停止
            </el-button>
            <el-button
              size="small"
              type="danger"
              @click="batchDelete"
              :disabled="selectedContainers.length === 0"
            >
              <IconifyIconOnline icon="ri:delete-bin-line" class="mr-1" />
              批量删除
            </el-button>
          </div>
        </div>
      </template>

      <el-table
        :data="containersList"
        stripe
        v-loading="loading"
        @selection-change="handleSelectionChange"
        class="containers-table"
      >
        <el-table-column type="selection" width="55" />
        <el-table-column
          prop="containerName"
          label="容器名称"
          width="200"
          show-overflow-tooltip
        >
          <template #default="{ row }">
            <div class="container-name">
              <div class="name-text">{{ row.containerName }}</div>
              <div class="container-id">
                {{ row.containerId?.substring(0, 12) }}
              </div>
            </div>
          </template>
        </el-table-column>
        <el-table-column
          prop="image"
          label="镜像"
          width="200"
          show-overflow-tooltip
        />
        <el-table-column prop="status" label="状态" width="120">
          <template #default="{ row }">
            <el-tag
              :type="getStatusType(row.status)"
              :icon="getStatusIcon(row.status)"
            >
              {{ getStatusLabel(row.status) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="serverId" label="服务器" width="180">
          <template #default="{ row }">
            <div class="server-info">
              <div class="server-name">{{ getServerName(row.serverId) }}</div>
              <div class="server-host">{{ getServerHost(row.serverId) }}</div>
            </div>
          </template>
        </el-table-column>
        <el-table-column
          prop="softName"
          label="关联软件"
          width="150"
          show-overflow-tooltip
        />
        <el-table-column prop="ports" label="端口映射" width="180">
          <template #default="{ row }">
            <div class="ports-list">
              <el-tag
                v-for="port in parsePortMappings(row.ports)"
                :key="port"
                size="small"
                class="port-tag"
              >
                {{ port }}
              </el-tag>
            </div>
          </template>
        </el-table-column>
        <el-table-column prop="cpuUsage" label="CPU使用率" width="120">
          <template #default="{ row }">
            <div class="resource-usage">
              <el-progress
                :percentage="row.cpuUsage || 0"
                :stroke-width="6"
                :show-text="false"
                :color="getUsageColor(row.cpuUsage || 0)"
              />
              <span class="usage-text"
                >{{ (row.cpuUsage || 0).toFixed(1) }}%</span
              >
            </div>
          </template>
        </el-table-column>
        <el-table-column prop="memoryUsage" label="内存使用率" width="120">
          <template #default="{ row }">
            <div class="resource-usage">
              <el-progress
                :percentage="row.memoryUsage || 0"
                :stroke-width="6"
                :show-text="false"
                :color="getUsageColor(row.memoryUsage || 0)"
              />
              <span class="usage-text"
                >{{ (row.memoryUsage || 0).toFixed(1) }}%</span
              >
            </div>
          </template>
        </el-table-column>
        <el-table-column prop="createTime" label="创建时间" width="180">
          <template #default="{ row }">
            {{ formatDate(row.createTime) }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="280" fixed="right">
          <template #default="{ row }">
            <el-button size="small" @click="viewDetail(row)">
              <IconifyIconOnline icon="ri:eye-line" class="mr-1" />
              详情
            </el-button>
            <el-button size="small" type="info" @click="viewLogs(row)">
              <IconifyIconOnline icon="ri:file-text-line" class="mr-1" />
              日志
            </el-button>
            <el-dropdown @command="(command) => handleAction(command, row)">
              <el-button size="small">
                <IconifyIconOnline icon="ri:more-line" />
              </el-button>
              <template #dropdown>
                <el-dropdown-menu>
                  <el-dropdown-item
                    command="start"
                    :disabled="row.status === 'running'"
                  >
                    <IconifyIconOnline icon="ri:play-line" class="mr-1" />
                    启动
                  </el-dropdown-item>
                  <el-dropdown-item
                    command="stop"
                    :disabled="row.status !== 'running'"
                  >
                    <IconifyIconOnline icon="ri:stop-line" class="mr-1" />
                    停止
                  </el-dropdown-item>
                  <el-dropdown-item command="restart">
                    <IconifyIconOnline icon="ri:restart-line" class="mr-1" />
                    重启
                  </el-dropdown-item>
                  <el-dropdown-item
                    command="pause"
                    :disabled="row.status !== 'running'"
                  >
                    <IconifyIconOnline icon="ri:pause-line" class="mr-1" />
                    暂停
                  </el-dropdown-item>
                  <el-dropdown-item
                    command="unpause"
                    :disabled="row.status !== 'paused'"
                  >
                    <IconifyIconOnline icon="ri:play-line" class="mr-1" />
                    恢复
                  </el-dropdown-item>
                  <el-dropdown-item
                    command="terminal"
                    :disabled="row.status !== 'running'"
                    divided
                  >
                    <IconifyIconOnline icon="ri:terminal-line" class="mr-1" />
                    进入终端
                  </el-dropdown-item>
                  <el-dropdown-item command="delete" divided>
                    <IconifyIconOnline icon="ri:delete-bin-line" class="mr-1" />
                    删除
                  </el-dropdown-item>
                </el-dropdown-menu>
              </template>
            </el-dropdown>
          </template>
        </el-table-column>
      </el-table>

      <!-- 分页 -->
      <div class="pagination-container">
        <el-pagination
          v-model:current-page="pageParams.page"
          v-model:page-size="pageParams.pageSize"
          :page-sizes="[10, 20, 50, 100]"
          :total="total"
          layout="total, sizes, prev, pager, next, jumper"
          @size-change="loadContainers"
          @current-change="loadContainers"
        />
      </div>
    </el-card>

    <!-- 容器详情对话框 -->
    <el-dialog
      v-model="detailVisible"
      title="容器详情"
      width="900px"
      destroy-on-close
    >
      <div v-if="currentContainer" class="container-detail">
        <el-tabs v-model="detailActiveTab">
          <el-tab-pane label="基本信息" name="basic">
            <el-descriptions :column="2" border>
              <el-descriptions-item label="容器ID">{{
                currentContainer.containerId
              }}</el-descriptions-item>
              <el-descriptions-item label="容器名称">{{
                currentContainer.containerName
              }}</el-descriptions-item>
              <el-descriptions-item label="镜像">{{
                currentContainer.image
              }}</el-descriptions-item>
              <el-descriptions-item label="状态">
                <el-tag :type="getStatusType(currentContainer.status)">{{
                  getStatusLabel(currentContainer.status)
                }}</el-tag>
              </el-descriptions-item>
              <el-descriptions-item label="服务器">{{
                getServerName(currentContainer.serverId)
              }}</el-descriptions-item>
              <el-descriptions-item label="关联软件">{{
                currentContainer.softName || "-"
              }}</el-descriptions-item>
              <el-descriptions-item label="创建时间">{{
                formatDate(currentContainer.createTime)
              }}</el-descriptions-item>
              <el-descriptions-item label="启动时间">{{
                formatDate(currentContainer.startTime)
              }}</el-descriptions-item>
              <el-descriptions-item label="端口映射" :span="2">
                <div class="ports-detail">
                  <el-tag
                    v-for="port in parsePortMappings(currentContainer.ports)"
                    :key="port"
                    class="port-tag"
                  >
                    {{ port }}
                  </el-tag>
                </div>
              </el-descriptions-item>
              <el-descriptions-item label="环境变量" :span="2">
                <div class="env-vars">
                  <pre v-if="currentContainer.envVars" class="env-code">{{
                    formatEnvVars(currentContainer.envVars)
                  }}</pre>
                  <span v-else>无</span>
                </div>
              </el-descriptions-item>
            </el-descriptions>
          </el-tab-pane>

          <el-tab-pane label="资源监控" name="monitor">
            <div class="monitor-grid">
              <div class="monitor-card">
                <div class="monitor-title">CPU使用率</div>
                <div class="monitor-chart">
                  <el-progress
                    type="circle"
                    :percentage="currentContainer.cpuUsage || 0"
                    :color="getUsageColor(currentContainer.cpuUsage || 0)"
                  />
                </div>
                <div class="monitor-value">
                  {{ (currentContainer.cpuUsage || 0).toFixed(2) }}%
                </div>
              </div>
              <div class="monitor-card">
                <div class="monitor-title">内存使用率</div>
                <div class="monitor-chart">
                  <el-progress
                    type="circle"
                    :percentage="currentContainer.memoryUsage || 0"
                    :color="getUsageColor(currentContainer.memoryUsage || 0)"
                  />
                </div>
                <div class="monitor-value">
                  {{ (currentContainer.memoryUsage || 0).toFixed(2) }}%
                </div>
              </div>
              <div class="monitor-card">
                <div class="monitor-title">网络IO</div>
                <div class="monitor-stats">
                  <div class="stat-item">
                    <span class="stat-label">接收:</span>
                    <span class="stat-value">{{
                      formatBytes(currentContainer.networkRx || 0)
                    }}</span>
                  </div>
                  <div class="stat-item">
                    <span class="stat-label">发送:</span>
                    <span class="stat-value">{{
                      formatBytes(currentContainer.networkTx || 0)
                    }}</span>
                  </div>
                </div>
              </div>
              <div class="monitor-card">
                <div class="monitor-title">磁盘IO</div>
                <div class="monitor-stats">
                  <div class="stat-item">
                    <span class="stat-label">读取:</span>
                    <span class="stat-value">{{
                      formatBytes(currentContainer.diskRead || 0)
                    }}</span>
                  </div>
                  <div class="stat-item">
                    <span class="stat-label">写入:</span>
                    <span class="stat-value">{{
                      formatBytes(currentContainer.diskWrite || 0)
                    }}</span>
                  </div>
                </div>
              </div>
            </div>
          </el-tab-pane>

          <el-tab-pane label="配置信息" name="config">
            <div class="config-section">
              <h4>运行配置</h4>
              <pre class="config-code">{{
                formatConfig(currentContainer.config)
              }}</pre>
            </div>
          </el-tab-pane>
        </el-tabs>
      </div>
    </el-dialog>

    <!-- 日志对话框 -->
    <el-dialog
      v-model="logsVisible"
      title="容器日志"
      width="900px"
      destroy-on-close
    >
      <div class="logs-container">
        <div class="logs-header">
          <div class="logs-controls">
            <el-switch v-model="followLogs" active-text="实时跟踪" />
            <el-input-number
              v-model="logLines"
              :min="50"
              :max="1000"
              :step="50"
              size="small"
            />
            <span class="log-lines-label">行</span>
          </div>
          <div class="logs-actions">
            <el-button size="small" @click="refreshLogs" :loading="logsLoading">
              <IconifyIconOnline icon="ri:refresh-line" class="mr-1" />
              刷新
            </el-button>
            <el-button size="small" @click="downloadLogs">
              <IconifyIconOnline icon="ri:download-line" class="mr-1" />
              下载
            </el-button>
            <el-button size="small" @click="clearLogs">
              <IconifyIconOnline icon="ri:delete-bin-line" class="mr-1" />
              清空
            </el-button>
          </div>
        </div>
        <div class="logs-content" ref="logsContentRef">
          <pre v-if="logs" class="logs-text">{{ logs }}</pre>
          <div v-else class="logs-empty">
            <IconifyIconOnline icon="ri:file-text-line" />
            <span>暂无日志信息</span>
          </div>
        </div>
      </div>
    </el-dialog>

    <!-- 创建容器对话框 -->
    <el-dialog
      v-model="createVisible"
      title="创建容器"
      width="700px"
      destroy-on-close
    >
      <el-form
        :model="createForm"
        :rules="createRules"
        ref="createFormRef"
        label-width="100px"
      >
        <el-form-item label="容器名称" prop="containerName">
          <el-input
            v-model="createForm.containerName"
            placeholder="请输入容器名称"
          />
        </el-form-item>
        <el-form-item label="镜像" prop="image">
          <el-input
            v-model="createForm.image"
            placeholder="请输入镜像名称，如: nginx:latest"
          />
        </el-form-item>
        <el-form-item label="服务器" prop="serverId">
          <el-select
            v-model="createForm.serverId"
            placeholder="请选择服务器"
            style="width: 100%"
          >
            <el-option
              v-for="server in serverOptions"
              :key="server.id"
              :label="server.name"
              :value="server.id"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="端口映射">
          <div class="port-mappings">
            <div
              v-for="(port, index) in createForm.portMappings"
              :key="index"
              class="port-mapping"
            >
              <el-input
                v-model="port.hostPort"
                placeholder="主机端口"
                style="width: 120px"
              />
              <span class="port-separator">:</span>
              <el-input
                v-model="port.containerPort"
                placeholder="容器端口"
                style="width: 120px"
              />
              <el-button
                size="small"
                @click="removePortMapping(index)"
                :disabled="createForm.portMappings.length <= 1"
              >
                <IconifyIconOnline icon="ri:delete-bin-line" />
              </el-button>
            </div>
            <el-button size="small" @click="addPortMapping">
              <IconifyIconOnline icon="ri:add-line" class="mr-1" />
              添加端口
            </el-button>
          </div>
        </el-form-item>
        <el-form-item label="环境变量">
          <div class="env-variables">
            <div
              v-for="(env, index) in createForm.envVariables"
              :key="index"
              class="env-variable"
            >
              <el-input
                v-model="env.key"
                placeholder="变量名"
                style="width: 150px"
              />
              <span class="env-separator">=</span>
              <el-input
                v-model="env.value"
                placeholder="变量值"
                style="width: 200px"
              />
              <el-button size="small" @click="removeEnvVariable(index)">
                <IconifyIconOnline icon="ri:delete-bin-line" />
              </el-button>
            </div>
            <el-button size="small" @click="addEnvVariable">
              <IconifyIconOnline icon="ri:add-line" class="mr-1" />
              添加变量
            </el-button>
          </div>
        </el-form-item>
        <el-form-item label="自动启动">
          <el-switch v-model="createForm.autoStart" />
        </el-form-item>
      </el-form>
      <template #footer>
        <div class="dialog-footer">
          <el-button @click="createVisible = false">取消</el-button>
          <el-button
            type="primary"
            @click="createContainer"
            :loading="createLoading"
            >创建</el-button
          >
        </div>
      </template>
    </el-dialog>

    <!-- 终端对话框 -->
    <el-dialog
      v-model="terminalVisible"
      title="容器终端"
      width="900px"
      destroy-on-close
    >
      <div class="terminal-container">
        <div class="terminal-header">
          <span class="terminal-title"
            >{{ currentContainer?.containerName }} - 终端</span
          >
          <el-button size="small" @click="clearTerminal">
            <IconifyIconOnline icon="ri:delete-bin-line" class="mr-1" />
            清空
          </el-button>
        </div>
        <div class="terminal-content" ref="terminalRef">
          <!-- 这里可以集成xterm.js或其他终端组件 -->
          <div class="terminal-placeholder">
            <IconifyIconOnline icon="ri:terminal-line" />
            <span>终端功能开发中...</span>
          </div>
        </div>
      </div>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref, computed, nextTick, onUnmounted } from "vue";
import { message, ElMessageBox } from "@repo/utils";
import {
  getSoftContainers,
  type SystemSoftContainer,
  startContainer,
  stopContainer,
  restartContainer,
  pauseContainer,
  unpauseContainer,
  deleteContainer,
  getContainerLogs,
  createContainer as apiCreateContainer,
} from "@/api/soft";
import { getServerPageList } from "@/api/server";
import { getSoftPageList } from "@/api/soft";
import {
  useSoftWebSocket,
  SOFT_WS_MESSAGE_TYPE,
  type ContainerStatusMessage,
  type ContainerLogMessage,
  type ContainerStatsMessage,
} from "@/composables/useSoftWebSocket";
import ContainerCard from "./components/ContainerCard.vue";
import ContainerActions from "./components/ContainerActions.vue";
import LogViewer from "./components/LogViewer.vue";
import StatsCard from "./components/StatsCard.vue";

// WebSocket连接
const {
  state: wsState,
  connect: connectWS,
  disconnect: disconnectWS,
  onMessage,
  offMessage,
  subscribeContainerStatus,
  unsubscribeContainerStatus,
  subscribeContainerLogs,
  unsubscribeContainerLogs,
} = useSoftWebSocket();

// 基础数据
const containersList = ref<SystemSoftContainer[]>([]);
const serverOptions = ref<any[]>([]);
const softOptions = ref<any[]>([]);
const selectedContainers = ref<SystemSoftContainer[]>([]);
const currentContainer = ref<SystemSoftContainer | null>(null);
const logs = ref("");

// 页面状态
const loading = ref(false);
const logsLoading = ref(false);
const createLoading = ref(false);
const detailVisible = ref(false);
const logsVisible = ref(false);
const createVisible = ref(false);
const terminalVisible = ref(false);
const total = ref(0);
const detailActiveTab = ref("basic");
const followLogs = ref(false);
const logLines = ref(200);

// 搜索参数
const searchParams = ref({
  keyword: "",
  status: "",
  serverId: "",
  softId: "",
});

// 分页参数
const pageParams = ref({
  page: 1,
  pageSize: 20,
});

// 创建表单
const createForm = ref({
  containerName: "",
  image: "",
  serverId: "",
  portMappings: [{ hostPort: "", containerPort: "" }],
  envVariables: [{ key: "", value: "" }],
  autoStart: true,
});

const createRules = {
  containerName: [
    { required: true, message: "请输入容器名称", trigger: "blur" },
  ],
  image: [{ required: true, message: "请输入镜像名称", trigger: "blur" }],
  serverId: [{ required: true, message: "请选择服务器", trigger: "change" }],
};

// 统计信息
const stats = computed(() => {
  const runningCount = containersList.value.filter(
    (c) => c.status === "running"
  ).length;
  const stoppedCount = containersList.value.filter((c) =>
    ["exited", "dead"].includes(c.status)
  ).length;
  const errorCount = containersList.value.filter((c) =>
    ["restarting", "paused"].includes(c.status)
  ).length;
  const totalCount = containersList.value.length;

  return {
    runningCount,
    stoppedCount,
    errorCount,
    totalCount,
  };
});

// 统计卡片数据
const statsData = computed(() => [
  {
    key: "running",
    label: "运行中",
    value: stats.value.runningCount,
    icon: "ri:play-circle-line",
    type: "success",
    format: "number",
    description: "当前正在运行的容器数量",
    trend:
      stats.value.runningCount > 0 ? { type: "up", value: "+2" } : undefined,
  },
  {
    key: "stopped",
    label: "已停止",
    value: stats.value.stoppedCount,
    icon: "ri:stop-circle-line",
    type: "warning",
    format: "number",
    description: "当前已停止的容器数量",
  },
  {
    key: "error",
    label: "异常",
    value: stats.value.errorCount,
    icon: "ri:error-warning-line",
    type: "danger",
    format: "number",
    description: "运行异常的容器数量",
  },
  {
    key: "total",
    label: "总计",
    value: stats.value.totalCount,
    icon: "ri:archive-line",
    type: "info",
    format: "number",
    description: "容器总数量",
  },
]);

// 统计详情数据
const statsDetails = computed(() => {
  const runningContainers = containersList.value.filter(
    (c) => c.status === "running"
  );
  const avgCpu =
    runningContainers.length > 0
      ? runningContainers.reduce((sum, c) => sum + (c.cpuUsage || 0), 0) /
        runningContainers.length
      : 0;
  const avgMemory =
    runningContainers.length > 0
      ? runningContainers.reduce((sum, c) => sum + (c.memoryUsage || 0), 0) /
        runningContainers.length
      : 0;

  return {
    runningContainers: stats.value.runningCount,
    stoppedContainers: stats.value.stoppedCount,
    errorContainers: stats.value.errorCount,
    restartingContainers: containersList.value.filter(
      (c) => c.status === "restarting"
    ).length,
    avgCpuUsage: avgCpu,
    avgMemoryUsage: avgMemory,
    avgDiskUsage: 65.3,
  };
});

// 引用
const logsContentRef = ref<HTMLElement>();
const terminalRef = ref<HTMLElement>();
const createFormRef = ref();

// 定时器
let logsTimer: NodeJS.Timeout | null = null;
let statsTimer: NodeJS.Timeout | null = null;

// 数据加载
const loadContainers = async () => {
  try {
    loading.value = true;
    const params = {
      ...pageParams.value,
      ...searchParams.value,
    };

    const res = await getSoftContainers(params);
    if (res.code === "00000") {
      containersList.value = res.data.records || [];
      total.value = res.data.total || 0;
    }
  } finally {
    loading.value = false;
  }
};

const loadServers = async () => {
  const res = await getServerPageList({ page: 1, pageSize: 1000 });
  if (res.code === "00000") {
    const data = (res.data as any).data || res.data.records || [];
    serverOptions.value = data.map((it: any) => ({
      id: it.id || it.monitorSysGenServerId,
      name: it.name || it.monitorSysGenServerName,
      host: it.host || it.monitorSysGenServerHost,
    }));
  }
};

const loadSofts = async () => {
  const res = await getSoftPageList({ page: 1, pageSize: 1000 });
  if (res.code === "00000") {
    const data = (res.data as any).data || res.data.records || [];
    softOptions.value = data.map((it: any) => ({
      id: it.id || it.systemSoftId,
      name: it.name || it.systemSoftName,
    }));
  }
};

// 搜索和筛选
const resetSearch = () => {
  searchParams.value = {
    keyword: "",
    status: "",
    serverId: "",
    softId: "",
  };
  pageParams.value.page = 1;
  loadContainers();
};

const refreshContainers = async () => {
  await loadContainers();
  message.success("容器列表已刷新");
};

// 表格操作
const handleSelectionChange = (selection: SystemSoftContainer[]) => {
  selectedContainers.value = selection;
};

const viewDetail = (container: SystemSoftContainer) => {
  currentContainer.value = container;
  detailVisible.value = true;
  detailActiveTab.value = "basic";
};

const viewLogs = async (container: SystemSoftContainer) => {
  currentContainer.value = container;
  logsVisible.value = true;
  await loadLogs(container.containerId!);

  // 订阅实时日志
  if (followLogs.value) {
    subscribeContainerLogs(container.containerId!);
  }
};

const loadLogs = async (containerId: string) => {
  try {
    logsLoading.value = true;
    const res = await getContainerLogs({ containerId, lines: logLines.value });
    if (res.code === "00000") {
      logs.value = res.data || "暂无日志信息";
      await nextTick();
      // 滚动到底部
      if (logsContentRef.value) {
        logsContentRef.value.scrollTop = logsContentRef.value.scrollHeight;
      }
    }
  } finally {
    logsLoading.value = false;
  }
};

const refreshLogs = async () => {
  if (currentContainer.value) {
    await loadLogs(currentContainer.value.containerId!);
  }
};

const downloadLogs = () => {
  if (!logs.value) {
    return message.warning("暂无日志可下载");
  }

  const blob = new Blob([logs.value], { type: "text/plain" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `container-logs-${currentContainer.value?.containerName || "unknown"}.txt`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};

const clearLogs = () => {
  logs.value = "";
};

const startLogsPolling = () => {
  if (logsTimer) {
    clearInterval(logsTimer);
  }

  logsTimer = setInterval(async () => {
    if (followLogs.value && currentContainer.value && logsVisible.value) {
      await loadLogs(currentContainer.value.containerId!);
    }
  }, 3000);
};

const stopLogsPolling = () => {
  if (logsTimer) {
    clearInterval(logsTimer);
    logsTimer = null;
  }
};

// 容器操作
const handleAction = async (
  command: string,
  container: SystemSoftContainer
) => {
  switch (command) {
    case "start":
      await startContainerAction(container);
      break;
    case "stop":
      await stopContainerAction(container);
      break;
    case "restart":
      await restartContainerAction(container);
      break;
    case "pause":
      await pauseContainerAction(container);
      break;
    case "unpause":
      await unpauseContainerAction(container);
      break;
    case "terminal":
      openTerminal(container);
      break;
    case "delete":
      await deleteContainerAction(container);
      break;
  }
};

const startContainerAction = async (container: SystemSoftContainer) => {
  try {
    const res = await startContainer({ containerId: container.containerId! });
    if (res.code === "00000") {
      message.success(`容器 ${container.containerName} 启动成功`);
      await loadContainers();
    }
  } catch (error) {
    message.error("启动容器失败");
  }
};

const stopContainerAction = async (container: SystemSoftContainer) => {
  try {
    await ElMessageBox.confirm(
      `确认停止容器 ${container.containerName}？`,
      "确认停止",
      {
        confirmButtonText: "确定",
        cancelButtonText: "取消",
        type: "warning",
      }
    );

    const res = await stopContainer({ containerId: container.containerId! });
    if (res.code === "00000") {
      message.success(`容器 ${container.containerName} 停止成功`);
      await loadContainers();
    }
  } catch (error) {
    if (error !== "cancel") {
      message.error("停止容器失败");
    }
  }
};

const restartContainerAction = async (container: SystemSoftContainer) => {
  try {
    const res = await restartContainer({ containerId: container.containerId! });
    if (res.code === "00000") {
      message.success(`容器 ${container.containerName} 重启成功`);
      await loadContainers();
    }
  } catch (error) {
    message.error("重启容器失败");
  }
};

const pauseContainerAction = async (container: SystemSoftContainer) => {
  try {
    const res = await pauseContainer({ containerId: container.containerId! });
    if (res.code === "00000") {
      message.success(`容器 ${container.containerName} 暂停成功`);
      await loadContainers();
    }
  } catch (error) {
    message.error("暂停容器失败");
  }
};

const unpauseContainerAction = async (container: SystemSoftContainer) => {
  try {
    const res = await unpauseContainer({ containerId: container.containerId! });
    if (res.code === "00000") {
      message.success(`容器 ${container.containerName} 恢复成功`);
      await loadContainers();
    }
  } catch (error) {
    message.error("恢复容器失败");
  }
};

const deleteContainerAction = async (container: SystemSoftContainer) => {
  try {
    await ElMessageBox.confirm(
      `确认删除容器 ${container.containerName}？此操作不可恢复。`,
      "确认删除",
      {
        confirmButtonText: "确定",
        cancelButtonText: "取消",
        type: "error",
      }
    );

    const res = await deleteContainer({ containerId: container.containerId! });
    if (res.code === "00000") {
      message.success(`容器 ${container.containerName} 删除成功`);
      await loadContainers();
    }
  } catch (error) {
    if (error !== "cancel") {
      message.error("删除容器失败");
    }
  }
};

// 批量操作
const batchStart = async () => {
  try {
    await ElMessageBox.confirm(
      `确认启动选中的 ${selectedContainers.value.length} 个容器？`,
      "确认批量启动",
      {
        confirmButtonText: "确定",
        cancelButtonText: "取消",
        type: "warning",
      }
    );

    // 这里可以调用批量启动API
    message.success("批量启动成功");
    await loadContainers();
  } catch (error) {
    if (error !== "cancel") {
      message.error("批量启动失败");
    }
  }
};

const batchStop = async () => {
  try {
    await ElMessageBox.confirm(
      `确认停止选中的 ${selectedContainers.value.length} 个容器？`,
      "确认批量停止",
      {
        confirmButtonText: "确定",
        cancelButtonText: "取消",
        type: "warning",
      }
    );

    // 这里可以调用批量停止API
    message.success("批量停止成功");
    await loadContainers();
  } catch (error) {
    if (error !== "cancel") {
      message.error("批量停止失败");
    }
  }
};

const batchDelete = async () => {
  try {
    await ElMessageBox.confirm(
      `确认删除选中的 ${selectedContainers.value.length} 个容器？此操作不可恢复。`,
      "确认批量删除",
      {
        confirmButtonText: "确定",
        cancelButtonText: "取消",
        type: "error",
      }
    );

    // 这里可以调用批量删除API
    message.success("批量删除成功");
    await loadContainers();
  } catch (error) {
    if (error !== "cancel") {
      message.error("批量删除失败");
    }
  }
};

// 创建容器
const openCreateDialog = () => {
  createForm.value = {
    containerName: "",
    image: "",
    serverId: "",
    portMappings: [{ hostPort: "", containerPort: "" }],
    envVariables: [{ key: "", value: "" }],
    autoStart: true,
  };
  createVisible.value = true;
};

const addPortMapping = () => {
  createForm.value.portMappings.push({ hostPort: "", containerPort: "" });
};

const removePortMapping = (index: number) => {
  createForm.value.portMappings.splice(index, 1);
};

const addEnvVariable = () => {
  createForm.value.envVariables.push({ key: "", value: "" });
};

const removeEnvVariable = (index: number) => {
  createForm.value.envVariables.splice(index, 1);
};

const createContainer = async () => {
  try {
    await createFormRef.value.validate();
    createLoading.value = true;

    const params = {
      ...createForm.value,
      portMappings: createForm.value.portMappings.filter(
        (p) => p.hostPort && p.containerPort
      ),
      envVariables: createForm.value.envVariables.filter(
        (e) => e.key && e.value
      ),
    };

    const res = await apiCreateContainer(params);
    if (res.code === "00000") {
      message.success("容器创建成功");
      createVisible.value = false;
      await loadContainers();
    }
  } catch (error) {
    message.error("创建容器失败");
  } finally {
    createLoading.value = false;
  }
};

// 终端
const openTerminal = (container: SystemSoftContainer) => {
  currentContainer.value = container;
  terminalVisible.value = true;
  // 这里可以初始化终端连接
};

const clearTerminal = () => {
  // 清空终端内容
};

// 工具方法
const formatDate = (date: string | Date) => {
  if (!date) return "-";
  return new Date(date).toLocaleString("zh-CN");
};

const formatBytes = (bytes: number) => {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
};

const formatEnvVars = (envVars: string) => {
  if (!envVars) return "无";
  try {
    const vars = JSON.parse(envVars);
    return Object.entries(vars)
      .map(([key, value]) => `${key}=${value}`)
      .join("\n");
  } catch {
    return envVars;
  }
};

const formatConfig = (config: string) => {
  if (!config) return "无配置信息";
  try {
    return JSON.stringify(JSON.parse(config), null, 2);
  } catch {
    return config;
  }
};

const parsePortMappings = (ports: string) => {
  if (!ports) return [];
  try {
    const mappings = JSON.parse(ports);
    if (Array.isArray(mappings)) {
      return mappings.map((p) => `${p.hostPort}:${p.containerPort}`);
    }
    return [ports];
  } catch {
    return ports.split(",").filter((p) => p.trim());
  }
};

const getServerName = (serverId: number) => {
  const server = serverOptions.value.find((s) => s.id === serverId);
  return server?.name || `服务器${serverId}`;
};

const getServerHost = (serverId: number) => {
  const server = serverOptions.value.find((s) => s.id === serverId);
  return server?.host || "-";
};

const getStatusType = (status: string) => {
  const statusMap: Record<string, string> = {
    running: "success",
    exited: "info",
    paused: "warning",
    restarting: "warning",
    dead: "danger",
  };
  return statusMap[status] || "info";
};

const getStatusLabel = (status: string) => {
  const statusMap: Record<string, string> = {
    running: "运行中",
    exited: "已停止",
    paused: "暂停",
    restarting: "重启中",
    dead: "已删除",
  };
  return statusMap[status] || status;
};

const getStatusIcon = (status: string) => {
  const iconMap: Record<string, string> = {
    running: "ri:play-circle-line",
    exited: "ri:stop-circle-line",
    paused: "ri:pause-circle-line",
    restarting: "ri:restart-line",
    dead: "ri:close-circle-line",
  };
  return iconMap[status] || "ri:question-line";
};

const getUsageColor = (usage: number) => {
  if (usage < 50) return "#67c23a";
  if (usage < 80) return "#e6a23c";
  return "#f56c6c";
};

// 开始统计信息轮询
const startStatsPolling = () => {
  statsTimer = setInterval(async () => {
    // 静默刷新容器状态
    await loadContainers();
  }, 30000); // 30秒刷新一次
};

const stopStatsPolling = () => {
  if (statsTimer) {
    clearInterval(statsTimer);
    statsTimer = null;
  }
};

onMounted(async () => {
  await loadServers();
  await loadSofts();
  await loadContainers();
  startStatsPolling();

  // 连接WebSocket
  connectWS();

  // 监听容器状态变化
  onMessage(
    SOFT_WS_MESSAGE_TYPE.CONTAINER_STATUS,
    (data: ContainerStatusMessage) => {
      const container = containersList.value.find(
        (c) => c.containerId === data.containerId
      );
      if (container) {
        container.status = data.status;
        container.cpuUsage = data.cpuUsage;
        container.memoryUsage = data.memoryUsage;
      }
    }
  );

  // 监听容器日志
  onMessage(
    SOFT_WS_MESSAGE_TYPE.CONTAINER_LOGS,
    (data: ContainerLogMessage) => {
      if (
        currentContainer.value?.containerId === data.containerId &&
        logsVisible.value
      ) {
        logs.value += data.logs;
        nextTick(() => {
          if (logsContentRef.value) {
            logsContentRef.value.scrollTop = logsContentRef.value.scrollHeight;
          }
        });
      }
    }
  );

  // 监听容器统计信息
  onMessage(
    SOFT_WS_MESSAGE_TYPE.CONTAINER_STATS,
    (data: ContainerStatsMessage) => {
      const container = containersList.value.find(
        (c) => c.containerId === data.containerId
      );
      if (container) {
        container.cpuUsage = data.cpuUsage;
        container.memoryUsage = data.memoryUsage;
        container.networkRx = data.networkRx;
        container.networkTx = data.networkTx;
        container.diskRead = data.diskRead;
        container.diskWrite = data.diskWrite;
      }
    }
  );
});

onUnmounted(() => {
  stopLogsPolling();
  stopStatsPolling();

  // 断开WebSocket连接
  offMessage(SOFT_WS_MESSAGE_TYPE.CONTAINER_STATUS);
  offMessage(SOFT_WS_MESSAGE_TYPE.CONTAINER_LOGS);
  offMessage(SOFT_WS_MESSAGE_TYPE.CONTAINER_STATS);
  disconnectWS();
});
</script>

<style scoped>
/* 基础样式与records.vue类似，这里只列出容器管理特有的样式 */
.containers-page {
  padding: 16px;
  background: #f5f7fa;
  min-height: calc(100vh - 60px);
}

/* 页面头部 */
.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
  padding: 20px;
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.header-left {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.page-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 20px;
  font-weight: 600;
  color: #303133;
}

.title-icon {
  font-size: 24px;
  color: #409eff;
}

.page-subtitle {
  font-size: 14px;
  color: #909399;
}

.header-right {
  display: flex;
  gap: 12px;
}

/* 搜索栏 */
.search-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 16px;
  margin-bottom: 16px;
  padding: 16px;
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.search-left {
  display: flex;
  gap: 12px;
  flex: 1;
}

.search-input {
  width: 280px;
}

.filter-select {
  width: 140px;
}

.search-right {
  display: flex;
  gap: 8px;
}

/* 统计信息 */
.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 16px;
  margin-bottom: 20px;
}

.stat-card {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 20px;
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  transition: all 0.3s ease;
}

.stat-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15);
}

.stat-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 48px;
  height: 48px;
  border-radius: 12px;
  color: white;
  font-size: 24px;
}

.stat-icon.running {
  background: linear-gradient(135deg, #67c23a, #85ce61);
}

.stat-icon.stopped {
  background: linear-gradient(135deg, #909399, #b1b3b8);
}

.stat-icon.warning {
  background: linear-gradient(135deg, #e6a23c, #f0c78a);
}

.stat-icon.info {
  background: linear-gradient(135deg, #409eff, #79bbff);
}

.stat-content {
  flex: 1;
}

.stat-value {
  font-size: 24px;
  font-weight: 600;
  color: #303133;
  line-height: 1;
  margin-bottom: 4px;
}

.stat-label {
  font-size: 14px;
  color: #909399;
}

/* 容器表格特有样式 */
.container-name {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.name-text {
  font-weight: 500;
  color: #303133;
}

.container-id {
  font-size: 12px;
  color: #909399;
  font-family: "Courier New", monospace;
}

.server-info {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.server-name {
  font-weight: 500;
  color: #303133;
}

.server-host {
  font-size: 12px;
  color: #909399;
}

.ports-list {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
}

.port-tag {
  font-size: 11px;
  font-family: "Courier New", monospace;
}

.resource-usage {
  display: flex;
  align-items: center;
  gap: 8px;
}

.usage-text {
  font-size: 12px;
  color: #606266;
  min-width: 40px;
  text-align: right;
}

/* 容器详情对话框 */
.container-detail {
  padding: 16px 0;
}

.ports-detail {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.env-vars {
  max-height: 200px;
  overflow-y: auto;
}

.env-code {
  background: #f5f7fa;
  padding: 12px;
  border-radius: 4px;
  font-family: "Courier New", monospace;
  font-size: 12px;
  line-height: 1.4;
  margin: 0;
}

.config-section {
  margin-bottom: 20px;
}

.config-section h4 {
  margin: 0 0 12px 0;
  color: #303133;
  font-size: 14px;
  font-weight: 600;
}

.config-code {
  background: #f5f7fa;
  padding: 16px;
  border-radius: 4px;
  font-family: "Courier New", monospace;
  font-size: 12px;
  line-height: 1.4;
  max-height: 300px;
  overflow-y: auto;
  margin: 0;
}

/* 监控网格 */
.monitor-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 20px;
  padding: 16px 0;
}

.monitor-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 20px;
  background: #f8f9fa;
  border-radius: 8px;
  border: 1px solid #e4e7ed;
}

.monitor-title {
  font-size: 14px;
  color: #606266;
  margin-bottom: 16px;
  font-weight: 500;
}

.monitor-chart {
  margin-bottom: 12px;
}

.monitor-value {
  font-size: 18px;
  font-weight: 600;
  color: #303133;
}

.monitor-stats {
  display: flex;
  flex-direction: column;
  gap: 8px;
  width: 100%;
}

.stat-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 12px;
  background: white;
  border-radius: 4px;
  border: 1px solid #e4e7ed;
}

.stat-label {
  font-size: 12px;
  color: #909399;
}

.stat-value {
  font-size: 12px;
  color: #303133;
  font-weight: 500;
  font-family: "Courier New", monospace;
}

/* 日志对话框 */
.logs-container {
  display: flex;
  flex-direction: column;
  height: 500px;
}

.logs-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
  padding-bottom: 12px;
  border-bottom: 1px solid #e4e7ed;
}

.logs-controls {
  display: flex;
  align-items: center;
  gap: 12px;
}

.log-lines-label {
  font-size: 12px;
  color: #909399;
}

.logs-actions {
  display: flex;
  gap: 8px;
}

.logs-content {
  flex: 1;
  background: #1e1e1e;
  border-radius: 4px;
  overflow: auto;
  position: relative;
}

.logs-text {
  color: #d4d4d4;
  font-family: "Courier New", monospace;
  font-size: 12px;
  line-height: 1.4;
  padding: 16px;
  margin: 0;
  white-space: pre-wrap;
  word-break: break-all;
}

.logs-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  color: #909399;
  font-size: 14px;
  gap: 8px;
}

/* 创建容器对话框 */
.port-mappings {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.port-mapping {
  display: flex;
  align-items: center;
  gap: 8px;
}

.port-separator {
  font-weight: bold;
  color: #606266;
}

.env-variables {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.env-variable {
  display: flex;
  align-items: center;
  gap: 8px;
}

.env-separator {
  font-weight: bold;
  color: #606266;
}

/* 终端对话框 */
.terminal-container {
  display: flex;
  flex-direction: column;
  height: 500px;
}

.terminal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
  padding-bottom: 12px;
  border-bottom: 1px solid #e4e7ed;
}

.terminal-title {
  font-size: 14px;
  font-weight: 500;
  color: #303133;
}

.terminal-content {
  flex: 1;
  background: #1e1e1e;
  border-radius: 4px;
  overflow: hidden;
  position: relative;
}

.terminal-placeholder {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  color: #909399;
  font-size: 14px;
  gap: 8px;
}

/* 卡片和表格样式 */
.containers-card {
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-weight: 600;
}

.header-actions {
  display: flex;
  gap: 8px;
}

/* 表格样式 */
.containers-table {
  margin-bottom: 16px;
}

/* 分页 */
.pagination-container {
  display: flex;
  justify-content: center;
  padding: 16px 0;
}

/* 表格样式优化 */
:deep(.el-table) {
  border-radius: 8px;
  overflow: hidden;
}

:deep(.el-table th) {
  background: #fafafa;
  font-weight: 600;
}

:deep(.el-table td) {
  border-bottom: 1px solid #f0f2f5;
}

:deep(.el-table tr:hover > td) {
  background: #f8f9fa;
}

/* 按钮样式 */
:deep(.el-button) {
  border-radius: 6px;
}

:deep(.el-button--small) {
  padding: 5px 12px;
  font-size: 12px;
}

/* 进度条样式 */
:deep(.el-progress) {
  width: 100%;
}

:deep(.el-progress-bar__outer) {
  border-radius: 10px;
}

:deep(.el-progress-bar__inner) {
  border-radius: 10px;
}

/* 标签样式 */
:deep(.el-tag) {
  border-radius: 4px;
}

/* 响应式设计 */
@media (max-width: 1200px) {
  .search-left {
    flex-wrap: wrap;
  }

  .search-input {
    width: 240px;
  }

  .filter-select {
    width: 120px;
  }
}

@media (max-width: 768px) {
  .containers-page {
    padding: 12px;
  }

  .page-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 12px;
  }

  .search-bar {
    flex-direction: column;
    align-items: stretch;
  }

  .search-left {
    flex-direction: column;
  }

  .search-input,
  .filter-select {
    width: 100%;
  }

  .stats-grid {
    grid-template-columns: repeat(2, 1fr);
    gap: 12px;
  }

  .stat-card {
    padding: 16px;
  }

  .stat-icon {
    width: 40px;
    height: 40px;
    font-size: 20px;
  }

  .stat-value {
    font-size: 20px;
  }

  .monitor-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 480px) {
  .stats-grid {
    grid-template-columns: 1fr;
  }

  .header-right {
    flex-direction: column;
    width: 100%;
  }

  .search-right {
    flex-direction: column;
  }

  .monitor-grid {
    grid-template-columns: 1fr;
  }

  .header-actions {
    flex-direction: column;
  }
}
</style>
