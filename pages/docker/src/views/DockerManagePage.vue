<template>
  <section class="docker-manage-shell">
    <div class="docker-manage-shell__backdrop" aria-hidden="true">
      <span class="docker-manage-shell__orb docker-manage-shell__orb--cyan" />
      <span class="docker-manage-shell__orb docker-manage-shell__orb--emerald" />
      <span class="docker-manage-shell__grid" />
    </div>

    <header class="docker-topbar">
      <div class="docker-brand">
        <div class="docker-brand__logo">
          <IconifyIconOnline icon="mdi:docker" />
        </div>
        <div>
          <span class="docker-brand__eyebrow">SERVER DOCKER CONSOLE</span>
          <strong>Docker管理平台</strong>
          <p>{{ heroSubtitle }}</p>
        </div>
      </div>


      <div class="docker-topbar__tools">
        <span class="docker-badge" :class="dockerSocketBadgeClass">
          {{ dockerSocketBadgeText }}
        </span>
        <label class="docker-searchbox">
          <IconifyIconOnline icon="ri:search-line" />
          <input
            v-model="queryKeyword"
            type="text"
            placeholder="搜索容器 / 镜像 / 数据卷 / 网络"
          />
        </label>
        <button
          type="button"
          class="docker-icon-button"
          :disabled="loading"
          @click="loadPageData"
        >
          <IconifyIconOnline :icon="loading ? 'svg-spinners:90-ring-with-bg' : 'ri:refresh-line'" />
        </button>
      </div>
    </header>

    <main class="docker-layout">
      <aside class="docker-sidebar">
        <section class="docker-card docker-card--menu">
          <div class="docker-card__eyebrow">RESOURCE SWITCH</div>
          <button
            v-for="item in navItems"
            :key="`side-${item.key}`"
            type="button"
            class="docker-side-link"
            :class="{ 'is-active': activeSection === item.key }"
            @click="switchSection(item.key)"
          >
            <span class="docker-side-link__icon">
              <IconifyIconOnline :icon="item.icon" />
            </span>
            <span class="docker-side-link__copy">
              <strong>{{ item.label }}</strong>
              <small>{{ item.description }}</small>
            </span>
            <span class="docker-side-link__count">{{ item.count }}</span>
          </button>
        </section>
      </aside>

      <section class="docker-content">
        <template v-if="activeSection === 'overview'">
          <section class="docker-overview-grid">
            <article class="docker-card docker-card--runtime">
              <header class="docker-panel-header">
                <div>
                  <small>RUNTIME CORE</small>
                  <h3>正在运行的容器</h3>
                  <p>{{ runtimePanelDescription }}</p>
                </div>
                <span class="docker-badge" :class="statusToneClass">
                  {{ capability?.dockerConnectable ? "CONNECTED" : "CHECKING" }}
                </span>
              </header>

              <div class="docker-runtime-scene">
                <div class="docker-runtime-scene__ring" />
                <div class="docker-runtime-scene__stack">
                  <span />
                  <span />
                </div>
                <div class="docker-runtime-scene__pulse" />
              </div>

              <div class="docker-runtime-metrics">
                <article>
                  <span>运行中</span>
                  <strong>{{ runningContainerCount }}</strong>
                </article>
                <article>
                  <span>已停止</span>
                  <strong>{{ stoppedContainerCount }}</strong>
                </article>
                <article>
                  <span>容器总量</span>
                  <strong>{{ containers.length }}</strong>
                </article>
              </div>
            </article>

            <article class="docker-card docker-card--table docker-card--main-table">
              <header class="docker-panel-header">
                <div>
                  <small>02 CONTAINER TABLE</small>
                  <h3>当前所有容器</h3>
                  <p>进入首页后直接按 serverId 读取 docker 配置与资源，不再依赖地址栏传整包服务器信息。</p>
                </div>
                <span class="docker-badge">{{ containerTable.rows.length }} 条</span>
              </header>
              <div class="docker-table-shell">
                <div class="docker-table-shell__toolbar">
                  <span class="docker-table-shell__chip">
                    <IconifyIconOnline icon="ri:apps-2-line" />
                    资源主屏
                  </span>
                  <button type="button" class="docker-table-shell__arrow" @click="switchSection('containers')">
                    <IconifyIconOnline icon="ri:arrow-right-s-line" />
                  </button>
                </div>
                <div class="docker-table-wrap">
                  <table v-if="containerTable.rows.length" class="docker-table">
                    <thead>
                      <tr>
                        <th v-for="header in containerTable.headers" :key="header">{{ header }}</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr
                        v-for="row in containerTable.rows"
                        :key="row.key"
                        :class="{ 'is-selected': selectedRowKey === row.key }"
                      >
                        <td v-for="cell in row.cells" :key="`${row.key}-${cell.text}`">
                          <span
                            class="docker-table__cell"
                            :class="[
                              cell.tone ? `is-${cell.tone}` : '',
                              cell.kind ? `is-${cell.kind}` : '',
                            ]"
                          >
                            {{ cell.text }}
                          </span>
                        </td>
                        <td>
                          <div class="docker-table__actions">
                            <button
                              v-for="action in row.actions || []"
                              :key="`${row.key}-${action.key}`"
                              type="button"
                              class="docker-action-button"
                              :class="action.tone ? `is-${action.tone}` : ''"
                              :disabled="actionLoadingKey === `containers:${row.key}:${action.key}`"
                              @click="handleRowAction('containers', row, action.key)"
                            >
                              {{ action.label }}
                            </button>
                          </div>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                  <el-empty v-else :description="loading ? '正在读取容器数据' : '当前服务器暂无容器'" />
                </div>
              </div>
            </article>

            <button
              v-for="card in overviewCards"
              :key="card.key"
              type="button"
              class="docker-card docker-card--feature"
              @click="switchSection(card.key)"
            >
              <header class="docker-feature-header">
                <span class="docker-feature-header__icon">
                  <IconifyIconOnline :icon="card.icon" />
                </span>
                <div>
                  <h3>{{ card.title }}</h3>
                  <p>{{ card.description }}</p>
                </div>
                <strong>{{ card.count }}</strong>
              </header>

              <div class="docker-feature-illustration" :class="`is-${card.key}`">
                <span />
                <span />
                <span />
              </div>
            </button>
          </section>
        </template>

        <template v-else>
          <section class="docker-detail-shell">
            <article class="docker-card docker-card--table docker-card--main-table">
              <header class="docker-panel-header">
                <div>
                  <small>{{ activeSectionMeta.serial }} {{ activeSectionMeta.label }}</small>
                  <h3>{{ activeSectionMeta.tableTitle }}</h3>
                  <p>{{ activeSectionMeta.description }}</p>
                </div>
                <span class="docker-badge">{{ activeTable.rows.length }} 条</span>
              </header>
              <div class="docker-table-shell">
                <div class="docker-table-shell__toolbar">
                  <div class="docker-table-shell__toolbar-left">
                    <span class="docker-table-shell__chip">
                      <IconifyIconOnline :icon="activeSectionMeta.icon" />
                      {{ activeSectionMeta.label }}
                    </span>
                    <div class="docker-toolbar-actions">
                      <button
                        v-if="activeSection === 'images'"
                        type="button"
                        class="docker-action-button is-ok"
                        @click="openImagePullDialog"
                      >
                        拉取镜像
                      </button>
                      <button
                        v-if="activeSection === 'mounts'"
                        type="button"
                        class="docker-action-button is-ok"
                        @click="openMountDialog()"
                      >
                        新增数据卷
                      </button>
                      <button
                        v-if="activeSection === 'networks'"
                        type="button"
                        class="docker-action-button is-ok"
                        @click="openNetworkDialog()"
                      >
                        新增网络
                      </button>
                    </div>
                  </div>
                  <button type="button" class="docker-table-shell__arrow" @click="switchSection('overview')">
                    <IconifyIconOnline icon="ri:arrow-left-s-line" />
                  </button>
                </div>
                <div class="docker-table-wrap">
                  <table v-if="activeTable.rows.length" class="docker-table">
                    <thead>
                      <tr>
                        <th v-for="header in activeTable.headers" :key="header">{{ header }}</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr
                        v-for="row in activeTable.rows"
                        :key="row.key"
                        :class="{ 'is-selected': selectedRowKey === row.key }"
                      >
                        <td v-for="cell in row.cells" :key="`${row.key}-${cell.text}`">
                          <span
                            class="docker-table__cell"
                            :class="[
                              cell.tone ? `is-${cell.tone}` : '',
                              cell.kind ? `is-${cell.kind}` : '',
                            ]"
                          >
                            {{ cell.text }}
                          </span>
                        </td>
                        <td>
                          <div class="docker-table__actions">
                            <button
                              v-for="action in row.actions || []"
                              :key="`${row.key}-${action.key}`"
                              type="button"
                              class="docker-action-button"
                              :class="action.tone ? `is-${action.tone}` : ''"
                              :disabled="actionLoadingKey === `${activeSection}:${row.key}:${action.key}`"
                              @click="handleRowAction(activeSection, row, action.key)"
                            >
                              {{ action.label }}
                            </button>
                          </div>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                  <el-empty
                    v-else
                    :description="loading ? '正在读取当前服务器 Docker 数据' : `${activeSectionMeta.label} 暂无可展示数据`"
                  />
                </div>
              </div>
            </article>
          </section>
        </template>

        <section v-if="loadWarnings.length" class="docker-warning-strip">
          <span v-for="warning in loadWarnings" :key="warning">{{ warning }}</span>
        </section>
      </section>
    </main>

    <el-dialog v-model="execDialogVisible" title="容器终端命令" width="620px" destroy-on-close>
      <div class="docker-dialog-form">
        <el-form label-position="top">
          <el-form-item label="容器ID">
            <el-input :model-value="activeContainerId" readonly />
          </el-form-item>
          <el-form-item label="执行命令">
            <el-input
              v-model="execCommand"
              type="textarea"
              :rows="4"
              placeholder="例如 /bin/sh 或 sh -lc 'env'"
            />
          </el-form-item>
          <el-form-item label="执行输出">
            <el-input :model-value="execOutput" type="textarea" :rows="8" readonly />
          </el-form-item>
        </el-form>
      </div>
      <template #footer>
        <button type="button" class="docker-action-button" @click="execDialogVisible = false">关闭</button>
        <button type="button" class="docker-action-button is-ok" :disabled="execSubmitting" @click="submitExecCommand">
          执行
        </button>
      </template>
    </el-dialog>

    <el-dialog v-model="configDialogVisible" title="容器配置" width="620px" destroy-on-close>
      <div class="docker-dialog-form">
        <el-form label-position="top">
          <el-form-item label="重启策略">
            <el-input v-model="configForm.restartPolicy" placeholder="always / unless-stopped / on-failure" />
          </el-form-item>
          <el-form-item label="CPU 限制">
            <el-input v-model="configForm.cpuLimit" placeholder="例如 1.5" />
          </el-form-item>
          <el-form-item label="内存限制">
            <el-input v-model="configForm.memoryLimit" placeholder="例如 512m" />
          </el-form-item>
        </el-form>
      </div>
      <template #footer>
        <button type="button" class="docker-action-button" @click="configDialogVisible = false">取消</button>
        <button type="button" class="docker-action-button is-ok" :disabled="configSubmitting" @click="submitContainerConfig">
          保存
        </button>
      </template>
    </el-dialog>

    <el-dialog v-model="imagePullVisible" title="拉取镜像" width="560px" destroy-on-close>
      <div class="docker-dialog-form">
        <el-form label-position="top">
          <el-form-item label="镜像名">
            <el-input v-model="imagePullForm.imageName" placeholder="例如 nginx 或 registry.example.com/team/nginx" />
          </el-form-item>
          <el-form-item label="标签">
            <el-input v-model="imagePullForm.imageTag" placeholder="默认 latest" />
          </el-form-item>
        </el-form>
      </div>
      <template #footer>
        <button type="button" class="docker-action-button" @click="imagePullVisible = false">取消</button>
        <button type="button" class="docker-action-button is-ok" :disabled="imagePullSubmitting" @click="submitImagePull">
          拉取
        </button>
      </template>
    </el-dialog>

    <el-dialog v-model="mountDialogVisible" title="新增数据卷" width="620px" destroy-on-close>
      <div class="docker-dialog-form">
        <el-form label-position="top">
          <el-form-item label="数据卷名称">
            <el-input v-model="mountForm.mountName" />
          </el-form-item>
          <el-form-item label="挂载点">
            <el-input v-model="mountForm.hostPath" placeholder="创建后由 Docker 返回，允许留空" />
          </el-form-item>
          <el-form-item label="驱动">
            <el-input v-model="mountForm.mountType" placeholder="默认 local" />
          </el-form-item>
        </el-form>
      </div>
      <template #footer>
        <button type="button" class="docker-action-button" @click="mountDialogVisible = false">取消</button>
        <button type="button" class="docker-action-button is-ok" :disabled="mountSubmitting" @click="submitMount">
          保存
        </button>
      </template>
    </el-dialog>

    <el-dialog v-model="networkDialogVisible" title="新增网络" width="620px" destroy-on-close>
      <div class="docker-dialog-form">
        <el-form label-position="top">
          <el-form-item label="网络名称">
            <el-input v-model="networkForm.networkName" />
          </el-form-item>
          <el-form-item label="驱动">
            <el-input v-model="networkForm.driver" placeholder="bridge / overlay / macvlan" />
          </el-form-item>
          <el-form-item label="网段">
            <el-input v-model="networkForm.subnetCidr" placeholder="例如 172.18.0.0/16" />
          </el-form-item>
          <el-form-item label="网关">
            <el-input v-model="networkForm.gatewayIp" placeholder="例如 172.18.0.1" />
          </el-form-item>
        </el-form>
      </div>
      <template #footer>
        <button type="button" class="docker-action-button" @click="networkDialogVisible = false">取消</button>
        <button type="button" class="docker-action-button is-ok" :disabled="networkSubmitting" @click="submitNetwork">
          保存
        </button>
      </template>
    </el-dialog>

    <ScTaskMessageDialog
      v-model:visible="dockerTaskDialogVisible"
      title="Docker 实时任务"
      :task="dockerTaskDialogModel"
      :loading="loading"
      @refresh="loadPageData"
    />
  </section>
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref, watch } from "vue";
import { useRoute, useRouter } from "vue-router";
import { resolveRuntimeProviders } from "@layout/default";
import ScTaskMessageDialog from "@repo/components/ScTaskMessageDialog";
import {
  createDockerMount,
  createDockerNetwork,
  deleteDockerContainer,
  deleteDockerImage,
  execDockerContainer,
  getDockerServerConnection,
  listDockerContainers,
  listDockerImages,
  listDockerMounts,
  listDockerNetworks,
  listDockerRegistries,
  listDockerServerCapabilities,
  pullDockerImage,
  restartDockerContainer,
  startDockerContainer,
  stopDockerContainer,
  updateDockerContainerConfig,
} from "../api";
import { useDockerRealtimeStream } from "../composables/useDockerRealtimeStream";
import { message } from "@repo/utils";
import type {
  DockerContainerView,
  DockerImageView,
  DockerContainerConfigUpdateRequest,
  DockerMount,
  DockerNetwork,
  DockerRealtimeEnvelope,
  DockerRegistry,
  DockerServerCapabilityView,
  DockerServerConnectionConfig,
  TaskDialogModel,
  TaskDialogStep,
} from "../types";

type SectionKey = "overview" | "containers" | "images" | "mounts" | "networks";
type TableCell = {
  text: string;
  tone?: "ok" | "warn" | "plain";
  kind?: "badge" | "mono";
};
type TableAction = {
  key: string;
  label: string;
  tone?: "ok" | "warn" | "plain";
};
type TableRow = {
  key: string;
  cells: TableCell[];
  actions?: TableAction[];
  meta?: Record<string, unknown>;
};

const sectionCatalog: Array<{
  key: SectionKey;
  serial: string;
  label: string;
  tableTitle: string;
  description: string;
  icon: string;
}> = [
  {
    key: "overview",
    serial: "01",
    label: "总览面板",
    tableTitle: "服务器资源总览",
    description: "顶部切换后只动态加载下方组件，不切路由页面。",
    icon: "ri:dashboard-line",
  },
  {
    key: "containers",
    serial: "02",
    label: "容器管理",
    tableTitle: "容器清单",
    description: "当前服务器所有容器统一按主屏表格样式展示。",
    icon: "mdi:cube-outline",
  },
  {
    key: "images",
    serial: "03",
    label: "镜像仓",
    tableTitle: "镜像资产",
    description: "镜像资源统一切到右侧主表展示，不再切路由。",
    icon: "ri:image-2-line",
  },
  {
    key: "mounts",
    serial: "04",
    label: "数据卷",
    tableTitle: "实时数据卷",
    description: "直接展示 Docker Volume 运行时数据，页面仅提供创建入口。",
    icon: "ri:database-2-line",
  },
  {
    key: "networks",
    serial: "05",
    label: "网络管理",
    tableTitle: "实时网络",
    description: "直接展示 Docker Network 运行时数据，页面仅提供创建入口。",
    icon: "ri:share-forward-2-line",
  },
];

const route = useRoute();
const router = useRouter();
const runtimeProviders = resolveRuntimeProviders({
  module: "docker.manage.runtime",
  socketName: "docker-page-global",
});
const runtimeMessage = runtimeProviders.message.provider;
const runtimeTask = runtimeProviders.task.provider;
const {
  latest: dockerRealtimeLatestRef,
  state: dockerRealtimeState,
  logs: dockerRealtimeLogs,
  connect: connectDockerRealtimeStream,
  disconnect: disconnectDockerRealtimeStream,
} = useDockerRealtimeStream(runtimeProviders.socket.provider);
const loading = ref(false);
const loadWarnings = ref<string[]>([]);
const queryKeyword = ref("");
const activeSection = ref<SectionKey>("overview");
const serverContext = ref<{ serverId?: number }>({});
const capability = ref<DockerServerCapabilityView | null>(null);
const connection = ref<DockerServerConnectionConfig | null>(null);
const containers = ref<DockerContainerView[]>([]);
const images = ref<DockerImageView[]>([]);
const mounts = ref<DockerMount[]>([]);
const networks = ref<DockerNetwork[]>([]);
const registries = ref<DockerRegistry[]>([]);
const loadToken = ref(0);
const selectedRowKey = ref("");
const actionLoadingKey = ref("");
const dockerTaskDialogVisible = ref(false);
const dockerTaskDialogModel = ref<TaskDialogModel | null>(null);
const execDialogVisible = ref(false);
const execSubmitting = ref(false);
const activeContainerId = ref("");
const execCommand = ref("/bin/sh");
const execOutput = ref("");
const configDialogVisible = ref(false);
const configSubmitting = ref(false);
const configForm = ref<DockerContainerConfigUpdateRequest>({
  restartPolicy: "",
  cpuLimit: "",
  memoryLimit: "",
});
const imagePullVisible = ref(false);
const imagePullSubmitting = ref(false);
const imagePullForm = ref({
  imageName: "",
  imageTag: "latest",
});
const mountDialogVisible = ref(false);
const mountSubmitting = ref(false);
const mountForm = ref<DockerMount>({
  serverId: 0,
  mountName: "",
  hostPath: "",
  containerPath: "",
  mountType: "local",
  readOnly: false,
  enabled: true,
});
const networkDialogVisible = ref(false);
const networkSubmitting = ref(false);
const networkForm = ref<DockerNetwork>({
  serverId: 0,
  networkName: "",
  driver: "bridge",
  subnetCidr: "",
  gatewayIp: "",
  attachable: true,
  internalNetwork: false,
  enabled: true,
});

const dockerSocketBadgeText = computed(() => {
  const source = runtimeProviders.log.socketSource;
  const sourceLabel =
    source === "lay-xx"
      ? "provider"
      : source === "@repo/core"
        ? "@repo/core"
        : source === "@repo/core-named"
          ? "@repo/core-named"
          : "fallback";
  return dockerRealtimeState.value.connected
    ? `SOCKET ${sourceLabel.toUpperCase()}`
    : `SOCKET ${sourceLabel.toUpperCase()} · WAIT`;
});

const dockerSocketBadgeClass = computed(() =>
  dockerRealtimeState.value.connected ? "is-ok" : "is-warn",
);

const readQueryText = (value: unknown) => Array.isArray(value) ? String(value[0] || "") : String(value || "");
const normalizeText = (value: unknown) => String(value || "").trim().toLowerCase();
const resolveSection = (value: unknown): SectionKey => {
  const target = readQueryText(value) as SectionKey;
  return sectionCatalog.some((item) => item.key === target) ? target : "overview";
};

const serverId = computed(() => Number(serverContext.value.serverId || 0) || 0);
const serverDisplayName = computed(() => connection.value?.serverName || capability.value?.serverName || (serverId.value ? `服务器 #${serverId.value}` : "未指定服务器"));
const addressText = computed(() => {
  const host = capability.value?.host || connection.value?.serverHost || "未提供";
  const port = connection.value?.serverPort ? `:${connection.value.serverPort}` : "";
  return `${host}${port}`;
});
const connectionTypeText = computed(
  () =>
    connection.value?.connectionType?.toUpperCase() ||
    capability.value?.runtimeType ||
    serverContext.value.serverType ||
    "LOCAL",
);
const serverCaption = computed(
  () => [connection.value?.serverOsType || "-", connection.value?.serverType || "-", connection.value?.serverUsername || "匿名访问"].join(" / "),
);
const heroSubtitle = computed(() =>
  serverId.value
    ? `当前页面仅依赖 serverId=${serverId.value}，由 docker 模块直接读取该服务器的连接配置与资源。`
    : "等待地址栏中的服务器信息完成解析。",
);
const runningContainerCount = computed(
  () => containers.value.filter((item) => ["running", "up", "healthy"].some((flag) => normalizeText(item.status).includes(flag))).length,
);
const stoppedContainerCount = computed(() => Math.max(containers.value.length - runningContainerCount.value, 0));
const statusToneClass = computed(() => capability.value?.dockerConnectable ? "is-ok" : "is-warn");
const runtimePanelDescription = computed(
  () => capability.value?.dockerConnectable
    ? `${serverDisplayName.value} 已连通 Docker，首页主屏只展示运行态与容器主表。`
    : `${serverDisplayName.value} 当前处于待探测状态，仍可查看已同步的主表数据。`,
);

const keyword = computed(() => normalizeText(queryKeyword.value));
const matchKeyword = (...fields: Array<unknown>) =>
  !keyword.value || fields.some((field) => normalizeText(field).includes(keyword.value));

const filteredContainers = computed(() =>
  containers.value.filter((item) =>
    matchKeyword(item.containerName, item.imageName, item.imageTag, item.status, item.ports),
  ),
);
const filteredImages = computed(() =>
  images.value.filter((item) =>
    matchKeyword(item.imageName, item.imageTag, item.status, item.imageId),
  ),
);
const filteredMounts = computed(() =>
  mounts.value.filter((item) =>
    matchKeyword(item.mountName, item.hostPath, item.containerPath, item.mountType),
  ),
);
const filteredNetworks = computed(() =>
  networks.value.filter((item) =>
    matchKeyword(item.networkName, item.driver, item.subnetCidr, item.gatewayIp),
  ),
);

const navItems = computed(() =>
  sectionCatalog.map((item) => ({
    ...item,
    count:
      item.key === "overview"
        ? String(containers.value.length + images.value.length + mounts.value.length + networks.value.length)
        : item.key === "containers"
          ? String(containers.value.length)
          : item.key === "images"
            ? String(images.value.length)
            : item.key === "mounts"
              ? String(mounts.value.length)
              : String(networks.value.length),
  })),
);
const activeSectionMeta = computed(() => sectionCatalog.find((item) => item.key === activeSection.value) || sectionCatalog[0]);

const formatBytes = (value?: number) => {
  const size = Number(value || 0);
  if (!Number.isFinite(size) || size <= 0) return "-";
  const units = ["B", "KB", "MB", "GB", "TB"];
  let current = size;
  let index = 0;
  while (current >= 1024 && index < units.length - 1) {
    current /= 1024;
    index += 1;
  }
  return `${current.toFixed(current >= 10 || index === 0 ? 0 : 1)} ${units[index]}`;
};

const resolveTone = (value: unknown): TableCell["tone"] => {
  const text = normalizeText(value);
  if (["running", "up", "healthy", "enabled", "bridge", "available"].some((item) => text.includes(item))) return "ok";
  if (["stopped", "down", "disabled", "error", "none"].some((item) => text.includes(item))) return "warn";
  return "plain";
};

const containerTable = computed<{ headers: string[]; rows: TableRow[] }>(() => ({
  headers: ["容器编号", "容器名称", "状态", "镜像", "端口", "展示", "操作"],
  rows: filteredContainers.value.slice(0, 8).map((item) => ({
    key: item.containerId,
    cells: [
      { text: item.containerId || "-", kind: "mono" },
      { text: item.containerName || "-" },
      { text: item.status || "-", tone: resolveTone(item.status), kind: "badge" },
      { text: `${item.imageName || "-"}:${item.imageTag || "latest"}` },
      { text: item.ports || "-" },
      {
        text: capability.value?.dockerConnectable ? "可见" : "待同步",
        tone: resolveTone(capability.value?.dockerConnectable ? "available" : "none"),
        kind: "badge",
      },
    ],
    actions: [
      normalizeText(item.status).includes("running")
        ? { key: "stop", label: "停止", tone: "warn" }
        : { key: "start", label: "启动", tone: "ok" },
      { key: "restart", label: "重启", tone: "plain" },
      { key: "exec", label: "终端", tone: "plain" },
      { key: "config", label: "配置", tone: "plain" },
      { key: "remove", label: "删除", tone: "warn" },
    ],
    meta: { containerId: item.containerId, status: item.status },
  })),
}));

const activeTable = computed<{ headers: string[]; rows: TableRow[] }>(() => {
  if (activeSection.value === "containers") {
    return {
      headers: containerTable.value.headers,
      rows: containerTable.value.rows,
    };
  }
  if (activeSection.value === "images") {
    return {
      headers: ["镜像编号", "镜像名", "标签", "大小", "状态", "操作"],
      rows: filteredImages.value.slice(0, 10).map((item) => ({
        key: item.imageId,
        cells: [
          { text: item.imageId || "-", kind: "mono" },
          { text: item.imageName || "-" },
          { text: item.imageTag || "-" },
          { text: formatBytes(item.sizeBytes) },
          { text: item.status || "AVAILABLE", tone: resolveTone(item.status || "available"), kind: "badge" },
        ],
        actions: [
          { key: "pull", label: "拉取", tone: "ok" },
          { key: "remove", label: "删除", tone: "warn" },
        ],
        meta: { imageId: item.imageId },
      })),
    };
  }
  if (activeSection.value === "mounts") {
    return {
      headers: ["数据卷", "挂载点", "驱动", "来源", "状态", "操作"],
      rows: filteredMounts.value.slice(0, 10).map((item) => ({
        key: String(item.mountName || item.hostPath || "-"),
        cells: [
          { text: item.mountName || "-" },
          { text: item.hostPath || "-", kind: "mono" },
          { text: item.mountType || "local" },
          { text: item.sourceType || "runtime", kind: "badge" },
          { text: item.enabled === false ? "禁用" : "启用", tone: resolveTone(item.enabled === false ? "disabled" : "enabled"), kind: "badge" },
        ],
        actions: [],
        meta: {},
      })),
    };
  }
  return {
    headers: ["网络名", "驱动", "网段", "网关", "状态", "操作"],
    rows: filteredNetworks.value.slice(0, 10).map((item) => ({
      key: String(item.networkName || "-"),
      cells: [
        { text: item.networkName || "-" },
        { text: item.driver || "-" },
        { text: item.subnetCidr || "-", kind: "mono" },
        { text: item.gatewayIp || "-" },
        { text: item.enabled === false ? "禁用" : "启用", tone: resolveTone(item.enabled === false ? "disabled" : "enabled"), kind: "badge" },
      ],
      actions: [],
      meta: {},
    })),
  };
});

const overviewCards = computed(() => [
  {
    key: "images" as SectionKey,
    icon: "ri:image-2-line",
    title: "镜像仓",
    count: images.value.length,
    description: `${images.value.length} 个镜像资产`,
  },
  {
    key: "mounts" as SectionKey,
    icon: "ri:database-2-line",
    title: "数据卷",
    count: mounts.value.length,
    description: `${mounts.value.length} 个实时数据卷`,
  },
  {
    key: "networks" as SectionKey,
    icon: "ri:share-forward-2-line",
    title: "网络管理",
    count: networks.value.length,
    description: `${networks.value.length} 个实时网络`,
  },
]);

const switchSection = (next: SectionKey) => {
  activeSection.value = next;
  router.replace({
    path: "/docker",
    query: {
      ...route.query,
      tab: next,
    },
  });
};

const handleRowAction = (section: SectionKey, row: TableRow, actionKey: string) => {
  selectedRowKey.value = row.key;
  void runRowAction(section, row, actionKey);
};

const openExecDialog = (containerId: string) => {
  activeContainerId.value = containerId;
  execOutput.value = "";
  execCommand.value = "/bin/sh";
  execDialogVisible.value = true;
};

const openConfigDialog = (containerId: string) => {
  activeContainerId.value = containerId;
  configForm.value = {
    restartPolicy: "",
    cpuLimit: "",
    memoryLimit: "",
  };
  configDialogVisible.value = true;
};

const openImagePullDialog = () => {
  imagePullForm.value = {
    imageName: "",
    imageTag: "latest",
  };
  imagePullVisible.value = true;
};

const openMountDialog = () => {
  mountForm.value = {
    serverId: serverId.value,
    mountName: "",
    hostPath: "",
    containerPath: "",
    mountType: "local",
    readOnly: false,
    enabled: true,
  };
  mountDialogVisible.value = true;
};

const openNetworkDialog = () => {
  networkForm.value = {
    serverId: serverId.value,
    networkName: "",
    driver: "bridge",
    subnetCidr: "",
    gatewayIp: "",
    attachable: true,
    internalNetwork: false,
    enabled: true,
  };
  networkDialogVisible.value = true;
};

const resolveDockerTaskStatus = (status?: string | null) => {
  const normalized = String(status || "RUNNING").toUpperCase();
  if (normalized === "SUCCESS") return "SUCCESS";
  if (normalized === "FAILED" || normalized === "ERROR" || normalized === "CANCELLED") return "FAILED";
  return "RUNNING";
};

const resolveDockerRuntimeTaskState = (status?: string | null) => {
  const normalized = resolveDockerTaskStatus(status);
  if (normalized === "SUCCESS") return "success";
  if (normalized === "FAILED") return "error";
  return "running";
};

const resolveDockerTaskTitle = (payload?: Record<string, unknown> | null) => {
  const scope = String(payload?.scope || "");
  const stepKey = String(payload?.stepKey || "");
  if (scope === "install") {
    return "容器安装";
  }
  if (scope === "operation") {
    if (stepKey.includes("image.pull")) return "镜像拉取";
    if (stepKey.includes("image.import")) return "镜像导入";
    if (stepKey.includes("image.export")) return "镜像导出";
    return "Docker 操作";
  }
  if (scope === "images") return "镜像同步";
  if (scope === "containers") return "容器同步";
  return "Docker 任务";
};

const resolveDockerStepTitle = (stepKey?: string | null, scope?: string | null) => {
  const normalized = String(stepKey || "").toLowerCase();
  if (scope === "install") {
    const installMap: Record<string, string> = {
      servers: "选择服务器",
      "registry-image": "仓库与镜像",
      "container-config": "容器参数",
      dockerfile: "Dockerfile",
      confirm: "确认执行",
    };
    return installMap[normalized] || (normalized ? normalized : "安装执行");
  }
  if (normalized.includes("image.pull")) return "镜像拉取";
  if (normalized.includes("image.import")) return "镜像导入";
  if (normalized.includes("image.export")) return "镜像导出";
  if (scope === "images") return "镜像同步";
  if (scope === "containers") return "容器同步";
  return stepKey || "任务执行";
};

const resolveDockerSummaryItems = (
  payload: Record<string, unknown>,
  taskId: string,
) => {
  const detail =
    payload.detail && typeof payload.detail === "object"
      ? (payload.detail as Record<string, unknown>)
      : {};
  const target = String(detail.target || detail.imageName || "");
  const operationType = String(detail.operationType || payload.stepKey || "");
  return [
    {
      label: "任务类型",
      value: resolveDockerTaskTitle(payload),
    },
    {
      label: "任务编号",
      value: taskId,
    },
    {
      label: "服务器",
      value: String(detail.serverId || serverId.value || "-"),
    },
    {
      label: "目标",
      value: target || operationType || "-",
    },
  ];
};

const mergeDockerTaskStep = (
  steps: TaskDialogStep[],
  payload: Record<string, unknown>,
  messageText: string,
  updatedAt: number,
) => {
  const stepKey = String(payload.stepKey || payload.scope || "docker-task");
  const nextSteps = [...steps];
  const exists = nextSteps.find(item => item.stepKey === stepKey);
  if (exists) {
    exists.status = resolveDockerTaskStatus(String(payload.status || ""));
    exists.message = messageText;
    exists.updatedAt = updatedAt;
    return nextSteps;
  }
  nextSteps.push({
    stepKey,
    title: resolveDockerStepTitle(String(payload.stepKey || ""), String(payload.scope || "")),
    status: resolveDockerTaskStatus(String(payload.status || "")),
    message: messageText,
    updatedAt,
  });
  return nextSteps;
};

const upsertDockerRealtimeTask = (envelope: DockerRealtimeEnvelope | null) => {
  const payload = (envelope?.data || null) as Record<string, unknown> | null;
  const taskId = String(envelope?.dataId || payload?.taskId || "").trim();
  if (!payload || !taskId) {
    return;
  }
  const now = Date.now();
  const status = resolveDockerTaskStatus(String(payload.status || ""));
  const messageText = String(payload.message || payload.line || "Docker 任务更新");
  const current = dockerTaskDialogModel.value?.taskId === taskId ? dockerTaskDialogModel.value : null;
  const nextLogs = dockerRealtimeLogs.value[taskId] ? [...dockerRealtimeLogs.value[taskId]] : (current?.logs || []);
  const nextSteps = mergeDockerTaskStep(current?.steps || [], payload, messageText, now);
  const nextTask: TaskDialogModel = {
    taskId,
    status,
    message: messageText,
    serverIds: current?.serverIds || [String((payload.detail as Record<string, unknown> | undefined)?.serverId || serverId.value || "-")],
    imageName: current?.imageName,
    imageTag: current?.imageTag,
    summaryItems: resolveDockerSummaryItems(payload, taskId),
    errorSummary: status === "FAILED" ? messageText : undefined,
    logs: nextLogs,
    createdAt: current?.createdAt || now,
    updatedAt: now,
    steps: nextSteps,
  };
  dockerTaskDialogModel.value = nextTask;

  runtimeTask.updateTask(taskId, {
    requestId: taskId,
    title: resolveDockerTaskTitle(payload),
    description: serverDisplayName.value ? `服务器 ${serverDisplayName.value}` : undefined,
    status: resolveDockerRuntimeTaskState(String(payload.status || "")),
    progress: Number.isFinite(Number(payload.progressPercent))
      ? Math.max(0, Math.min(100, Number(payload.progressPercent)))
      : status === "SUCCESS"
        ? 100
        : 40,
    source: "system",
    mode: "stream",
    message: messageText,
    stageLabel: resolveDockerStepTitle(String(payload.stepKey || ""), String(payload.scope || "")),
  });

  if (payload.line) {
    runtimeTask.appendMessage(taskId, { content: String(payload.line) });
  }

  if (payload.scope === "install" || payload.scope === "operation") {
    dockerTaskDialogVisible.value = true;
  }

  if (payload.finished === true) {
    if (status === "SUCCESS") {
      runtimeTask.finishTask(taskId, { message: messageText, progress: 100 });
      runtimeMessage.success(messageText);
    } else if (status === "FAILED") {
      runtimeTask.failTask(taskId, { message: messageText });
      runtimeMessage.error(messageText);
    }
    void loadPageData();
  }
};

const runRowAction = async (section: SectionKey, row: TableRow, actionKey: string) => {
  const actionId = `${section}:${row.key}:${actionKey}`;
  actionLoadingKey.value = actionId;
  try {
    if (section === "containers") {
      const containerId = String(row.meta?.containerId || row.key || "");
      if (!containerId) return;
      if (actionKey === "start") {
        await startDockerContainer(containerId);
        message("容器已启动", { type: "success" });
      } else if (actionKey === "stop") {
        await stopDockerContainer(containerId);
        message("容器已停止", { type: "success" });
      } else if (actionKey === "restart") {
        await restartDockerContainer(containerId);
        message("容器已重启", { type: "success" });
      } else if (actionKey === "exec") {
        openExecDialog(containerId);
        return;
      } else if (actionKey === "config") {
        openConfigDialog(containerId);
        return;
      } else if (actionKey === "remove") {
        if (typeof window !== "undefined" && !window.confirm(`确认删除容器 ${containerId}？`)) return;
        await deleteDockerContainer(containerId, true);
        message("容器已删除", { type: "success" });
      }
      await loadPageData();
      return;
    }

    if (section === "images") {
      const imageId = String(row.meta?.imageId || row.key || "");
      if (!imageId) return;
      if (actionKey === "pull") {
        imagePullForm.value.imageName = imageId;
        imagePullVisible.value = true;
        return;
      }
      if (typeof window !== "undefined" && !window.confirm(`确认删除镜像 ${imageId}？`)) return;
      await deleteDockerImage(imageId, { serverId: serverId.value, force: true });
      message("镜像已删除", { type: "success" });
      await loadPageData();
      return;
    }

    if (section === "mounts" || section === "networks") return;
  } catch (error: any) {
    message(error?.message || "Docker 操作失败", { type: "error" });
  } finally {
    actionLoadingKey.value = "";
  }
};

const submitExecCommand = async () => {
  if (!activeContainerId.value || !execCommand.value.trim()) {
    message("请输入要执行的命令", { type: "warning" });
    return;
  }
  execSubmitting.value = true;
  try {
    const command = execCommand.value.trim().split(/\s+/);
    const result = await execDockerContainer(activeContainerId.value, { command });
    execOutput.value = result.data?.message || result.message || "执行完成";
    message("容器命令已执行", { type: "success" });
  } catch (error: any) {
    execOutput.value = error?.message || "执行失败";
    message(error?.message || "执行容器命令失败", { type: "error" });
  } finally {
    execSubmitting.value = false;
  }
};

const submitContainerConfig = async () => {
  if (!activeContainerId.value) return;
  configSubmitting.value = true;
  try {
    await updateDockerContainerConfig(activeContainerId.value, configForm.value);
    message("容器配置已提交", { type: "success" });
    configDialogVisible.value = false;
    await loadPageData();
  } catch (error: any) {
    message(error?.message || "保存容器配置失败", { type: "error" });
  } finally {
    configSubmitting.value = false;
  }
};

const submitImagePull = async () => {
  if (!imagePullForm.value.imageName.trim()) {
    message("请输入镜像名", { type: "warning" });
    return;
  }
  imagePullSubmitting.value = true;
  try {
    const result = await pullDockerImage({
      serverId: serverId.value,
      imageName: imagePullForm.value.imageName.trim(),
      imageTag: imagePullForm.value.imageTag.trim() || "latest",
    });
    if (result.data?.operationId && !dockerTaskDialogModel.value) {
      runtimeTask.updateTask(result.data.operationId, {
        requestId: result.data.operationId,
        title: "镜像拉取",
        description: `服务器 ${serverDisplayName.value}`,
        status: resolveDockerRuntimeTaskState(result.data.status),
        progress: result.data.status === "SUCCESS" ? 100 : 20,
        source: "system",
        mode: "stream",
        message: result.data.message,
        stageLabel: "镜像拉取",
      });
    }
    imagePullVisible.value = false;
    await loadPageData();
  } catch (error: any) {
    message(error?.message || "拉取镜像失败", { type: "error" });
  } finally {
    imagePullSubmitting.value = false;
  }
};

const submitMount = async () => {
  if (!mountForm.value.mountName?.trim()) {
    message("请输入数据卷名称", { type: "warning" });
    return;
  }
  mountSubmitting.value = true;
  try {
    const payload = {
      ...mountForm.value,
      serverId: serverId.value,
      mountName: mountForm.value.mountName.trim(),
      hostPath: mountForm.value.hostPath?.trim() || "",
      containerPath: "",
      mountType: mountForm.value.mountType?.trim() || "local",
    };
    await createDockerMount(payload);
    message("数据卷已创建", { type: "success" });
    mountDialogVisible.value = false;
    await loadPageData();
  } catch (error: any) {
    message(error?.message || "创建数据卷失败", { type: "error" });
  } finally {
    mountSubmitting.value = false;
  }
};

const submitNetwork = async () => {
  if (!networkForm.value.networkName?.trim()) {
    message("请输入网络名称", { type: "warning" });
    return;
  }
  networkSubmitting.value = true;
  try {
    const payload = {
      ...networkForm.value,
      serverId: serverId.value,
      networkName: networkForm.value.networkName.trim(),
      driver: networkForm.value.driver?.trim() || "bridge",
      subnetCidr: networkForm.value.subnetCidr?.trim() || "",
      gatewayIp: networkForm.value.gatewayIp?.trim() || "",
    };
    await createDockerNetwork(payload);
    message("网络已创建", { type: "success" });
    networkDialogVisible.value = false;
    await loadPageData();
  } catch (error: any) {
    message(error?.message || "创建网络失败", { type: "error" });
  } finally {
    networkSubmitting.value = false;
  }
};

const loadPageData = async () => {
  const currentToken = ++loadToken.value;
  loading.value = true;
  loadWarnings.value = [];
  capability.value = null;
  connection.value = null;
  containers.value = [];
  images.value = [];
  mounts.value = [];
  networks.value = [];
  registries.value = [];

  serverContext.value = {
    serverId: Number(readQueryText(route.query.serverId) || 0) || undefined,
  };
  const currentServerId = serverId.value;
  if (!currentServerId) {
    loadWarnings.value = ["地址栏缺少 serverId，无法加载该服务器的 Docker 数据"];
    loading.value = false;
    return;
  }

  const results = await Promise.allSettled([
    listDockerServerCapabilities({ serverId: currentServerId }),
    getDockerServerConnection(currentServerId),
    listDockerContainers({ serverId: currentServerId }),
    listDockerImages({ serverId: currentServerId }),
    listDockerMounts({ serverId: currentServerId }),
    listDockerNetworks({ serverId: currentServerId }),
    listDockerRegistries({ enabled: true }),
  ]);
  if (currentToken !== loadToken.value) return;

  const [capabilityResult, connectionResult, containerResult, imageResult, mountResult, networkResult, registryResult] = results;
  if (capabilityResult.status === "fulfilled") {
    capability.value =
      capabilityResult.value.data?.find((item) => Number(item.serverId) === currentServerId) || null;
  } else loadWarnings.value.push("服务器 Docker 能力信息读取失败");
  if (connectionResult.status === "fulfilled") {
    connection.value = connectionResult.value.data || null;
  } else loadWarnings.value.push("Docker 连接配置读取失败");
  if (containerResult.status === "fulfilled") containers.value = containerResult.value.data || [];
  else loadWarnings.value.push("容器列表加载失败");
  if (imageResult.status === "fulfilled") images.value = imageResult.value.data || [];
  else loadWarnings.value.push("镜像列表加载失败");
  if (mountResult.status === "fulfilled") mounts.value = mountResult.value.data || [];
  else loadWarnings.value.push("数据卷列表加载失败");
  if (networkResult.status === "fulfilled") networks.value = networkResult.value.data || [];
  else loadWarnings.value.push("网络列表加载失败");
  if (registryResult.status === "fulfilled") registries.value = registryResult.value.data || [];
  else loadWarnings.value.push("仓库列表加载失败");

  loading.value = false;
};

watch(() => route.query.tab, (value) => {
  activeSection.value = resolveSection(value);
}, { immediate: true });

watch(
  () => [route.query.serverId],
  () => {
    loadPageData();
  },
  { immediate: true },
);

watch(
  dockerRealtimeLatestRef,
  (value) => {
    upsertDockerRealtimeTask(value);
  },
  { deep: true },
);

onMounted(() => {
  connectDockerRealtimeStream();
});

onUnmounted(() => {
  disconnectDockerRealtimeStream();
});
</script>

<style scoped>
.docker-manage-shell {
  --docker-line: rgba(48, 226, 217, 0.34);
  --docker-line-strong: rgba(67, 243, 238, 0.72);
  --docker-text: #edf7ff;
  --docker-text-soft: rgba(192, 225, 242, 0.8);
  --docker-accent: #42f5e6;
  --docker-success: #67f6a8;
  --docker-warn: #ffb86c;
  position: relative;
  height: 100vh;
  width: 100vw;
  padding: 24px;
  overflow: auto;
  color: var(--docker-text);
  background:
    radial-gradient(circle at top left, rgba(53, 126, 196, 0.24), transparent 26%),
    radial-gradient(circle at 82% 12%, rgba(43, 241, 220, 0.12), transparent 18%),
    linear-gradient(180deg, #091522 0%, #060d16 100%);
}

.docker-manage-shell__backdrop { position: absolute; inset: 0; pointer-events: none; }
.docker-manage-shell__orb { position: absolute; border-radius: 999px; filter: blur(90px); opacity: 0.4; }
.docker-manage-shell__orb--cyan { top: -80px; left: 12%; width: 340px; height: 340px; background: rgba(44, 197, 255, 0.18); }
.docker-manage-shell__orb--emerald { right: 8%; top: 22%; width: 300px; height: 300px; background: rgba(66, 245, 230, 0.16); }
.docker-manage-shell__grid {
  position: absolute;
  inset: 0;
  background-image:
    linear-gradient(rgba(75, 138, 165, 0.06) 1px, transparent 1px),
    linear-gradient(90deg, rgba(75, 138, 165, 0.06) 1px, transparent 1px);
  background-size: 48px 48px;
  mask-image: linear-gradient(180deg, rgba(0, 0, 0, 0.7), transparent 92%);
}

.docker-topbar,
.docker-card { position: relative; z-index: 1; }

.docker-topbar {
  display: grid;
  grid-template-columns: 1.25fr 1.7fr 1fr;
  gap: 18px;
  align-items: center;
  padding: 18px 22px;
  border: 1px solid var(--docker-line);
  border-radius: 24px;
  background: linear-gradient(180deg, rgba(10, 25, 41, 0.96), rgba(8, 19, 31, 0.9));
  box-shadow: 0 0 0 1px rgba(255, 255, 255, 0.03) inset, 0 24px 48px rgba(1, 8, 16, 0.42);
}

.docker-brand { display: flex; align-items: center; gap: 14px; min-width: 0; }
.docker-brand__logo {
  display: grid;
  place-items: center;
  width: 58px;
  height: 58px;
  border: 1px solid rgba(66, 245, 230, 0.52);
  border-radius: 18px;
  background: linear-gradient(180deg, rgba(54, 227, 255, 0.2), rgba(66, 245, 230, 0.08));
  color: var(--docker-accent);
  font-size: 30px;
  box-shadow: 0 0 36px rgba(66, 245, 230, 0.16);
}

.docker-brand__eyebrow,
.docker-card__eyebrow,
.docker-panel-header small {
  display: block;
  margin-bottom: 8px;
  color: rgba(123, 197, 223, 0.84);
  font-size: 11px;
  letter-spacing: 0.26em;
  text-transform: uppercase;
}

.docker-brand strong { display: block; margin-bottom: 4px; font-size: 20px; font-family: "Bahnschrift", "DIN Alternate", "Microsoft YaHei", sans-serif; }
.docker-brand p,
.docker-panel-header p,
.docker-feature-header p,
.docker-card--server p { margin: 0; color: var(--docker-text-soft); line-height: 1.6; }

.docker-topbar__nav {
  display: grid;
  grid-template-columns: repeat(5, minmax(0, 1fr));
  min-height: 88px;
  padding: 0 24px;
  border: 1px solid rgba(66, 245, 230, 0.34);
  border-radius: 26px;
  overflow: hidden;
  clip-path: polygon(4% 0, 96% 0, 100% 50%, 96% 100%, 4% 100%, 0 50%);
  background: linear-gradient(90deg, rgba(8, 19, 31, 0.92), rgba(14, 31, 47, 0.92));
}

.docker-topbar__nav-item {
  position: relative;
  display: grid;
  place-items: center;
  gap: 8px;
  padding: 16px 10px;
  border: 0;
  color: rgba(210, 231, 243, 0.72);
  background: transparent;
  cursor: pointer;
}
.docker-topbar__nav-item::after {
  content: "";
  position: absolute;
  left: 20%;
  right: 20%;
  bottom: 0;
  height: 3px;
  border-radius: 999px;
}
.docker-topbar__nav-item.is-active {
  color: var(--docker-accent);
  background: linear-gradient(180deg, rgba(66, 245, 230, 0.18), rgba(66, 245, 230, 0.06));
}
.docker-topbar__nav-item.is-active::after {
  background: linear-gradient(90deg, rgba(66, 245, 230, 0.1), var(--docker-accent), rgba(66, 245, 230, 0.1));
}

.docker-topbar__tools { display: flex; justify-content: flex-end; align-items: center; gap: 12px; }
.docker-searchbox {
  display: flex;
  align-items: center;
  gap: 10px;
  min-width: 280px;
  padding: 0 16px;
  height: 48px;
  border: 1px solid rgba(71, 129, 152, 0.3);
  border-radius: 999px;
  background: rgba(5, 13, 22, 0.64);
  color: var(--docker-text-soft);
}
.docker-searchbox input { width: 100%; border: 0; outline: 0; color: var(--docker-text); background: transparent; }
.docker-icon-button {
  display: grid; place-items: center; width: 48px; height: 48px; border: 1px solid rgba(71, 129, 152, 0.3);
  border-radius: 999px; color: var(--docker-text); background: rgba(5, 13, 22, 0.64); cursor: pointer;
}

.docker-layout { display: grid; grid-template-columns: 300px minmax(0, 1fr); gap: 22px; margin-top: 22px; position: relative; z-index: 1; }
.docker-sidebar { display: grid; gap: 18px; }
.docker-content { display: grid; gap: 20px; }

.docker-card {
  padding: 22px;
  border: 1px solid var(--docker-line);
  border-radius: 28px;
  background: linear-gradient(180deg, rgba(10, 24, 40, 0.9), rgba(7, 18, 30, 0.84));
  box-shadow: 0 0 0 1px rgba(255, 255, 255, 0.03) inset, 0 18px 42px rgba(1, 7, 15, 0.34);
}

.docker-card--server h2,
.docker-panel-header h3,
.docker-feature-header h3 { margin: 0 0 8px; font-family: "Bahnschrift", "DIN Alternate", "Microsoft YaHei", sans-serif; }

.docker-server-address {
  margin-top: 18px;
  padding: 14px 16px;
  border: 1px solid rgba(66, 245, 230, 0.24);
  border-radius: 18px;
  background: linear-gradient(180deg, rgba(66, 245, 230, 0.08), rgba(66, 245, 230, 0.04));
}
.docker-server-address span,
.docker-server-meta dt,
.docker-runtime-metrics span,
.docker-feature-header strong { color: rgba(167, 213, 233, 0.78); font-size: 12px; }
.docker-server-address strong,
.docker-server-meta dd,
.docker-runtime-metrics strong { display: block; margin-top: 4px; font-size: 16px; font-weight: 700; }

.docker-server-meta {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 14px;
  margin: 18px 0 0;
}
.docker-server-meta div,
.docker-runtime-metrics article { padding: 14px; border: 1px solid rgba(67, 111, 130, 0.24); border-radius: 18px; background: rgba(4, 13, 21, 0.42); }

.docker-side-link {
  display: grid;
  grid-template-columns: 42px 1fr auto;
  gap: 12px;
  align-items: center;
  width: 100%;
  padding: 14px;
  border: 1px solid transparent;
  border-radius: 18px;
  color: var(--docker-text);
  background: transparent;
  cursor: pointer;
}
.docker-side-link + .docker-side-link { margin-top: 10px; }
.docker-side-link__icon {
  display: grid; place-items: center; width: 42px; height: 42px; border-radius: 14px; color: var(--docker-accent);
  background: rgba(66, 245, 230, 0.1);
}
.docker-side-link__copy strong,
.docker-side-link__count { display: block; font-weight: 700; }
.docker-side-link__copy small { display: block; margin-top: 4px; color: var(--docker-text-soft); line-height: 1.5; }
.docker-side-link.is-active,
.docker-side-link:hover { border-color: rgba(66, 245, 230, 0.34); background: linear-gradient(90deg, rgba(66, 245, 230, 0.12), rgba(66, 245, 230, 0.02)); }

.docker-overview-grid {
  display: grid;
  grid-template-columns: minmax(320px, 0.86fr) minmax(0, 1.34fr);
  gap: 20px;
}
.docker-card--runtime { min-height: 410px; }
.docker-card--main-table { min-height: 410px; }
.docker-card--feature { min-height: 260px; text-align: left; cursor: pointer; }
.docker-card--feature:hover,
.docker-card--feature:focus-visible { border-color: var(--docker-line-strong); box-shadow: 0 0 0 1px rgba(66, 245, 230, 0.12) inset, 0 18px 38px rgba(0, 0, 0, 0.34), 0 0 32px rgba(66, 245, 230, 0.1); }

.docker-panel-header,
.docker-feature-header { display: flex; justify-content: space-between; gap: 16px; align-items: flex-start; }
.docker-badge {
  display: inline-flex; align-items: center; height: 32px; padding: 0 14px; border: 1px solid rgba(66, 245, 230, 0.26);
  border-radius: 999px; background: rgba(66, 245, 230, 0.08); font-size: 12px; letter-spacing: 0.14em;
}
.docker-badge.is-ok,
.docker-table__cell.is-ok { color: var(--docker-success); }
.docker-badge.is-warn,
.docker-table__cell.is-warn { color: var(--docker-warn); }

.docker-runtime-scene {
  position: relative;
  height: 220px;
  margin: 24px 0 18px;
  overflow: hidden;
  border: 1px solid rgba(66, 245, 230, 0.18);
  border-radius: 26px;
  background: radial-gradient(circle at 50% 30%, rgba(66, 245, 230, 0.12), transparent 34%), linear-gradient(180deg, rgba(7, 21, 35, 0.88), rgba(4, 12, 22, 0.9));
}
.docker-runtime-scene__ring,
.docker-runtime-scene__pulse { position: absolute; left: 50%; transform: translateX(-50%); border-radius: 999px; }
.docker-runtime-scene__ring { bottom: 28px; width: 72%; height: 72px; border: 1px solid rgba(66, 245, 230, 0.26); box-shadow: 0 0 28px rgba(66, 245, 230, 0.12); }
.docker-runtime-scene__pulse { top: 34px; width: 10px; height: 10px; background: var(--docker-accent); box-shadow: 0 0 18px rgba(66, 245, 230, 0.92); animation: pulse-glow 2.4s ease-in-out infinite; }
.docker-runtime-scene__stack { position: absolute; left: 50%; bottom: 54px; display: grid; gap: 12px; width: 160px; transform: translateX(-50%); }
.docker-runtime-scene__stack span { display: block; height: 42px; border: 1px solid rgba(66, 245, 230, 0.32); border-radius: 10px; background: linear-gradient(90deg, rgba(66, 245, 230, 0.22), rgba(82, 208, 255, 0.12)); }
.docker-runtime-metrics { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 12px; }

.docker-table-shell {
  margin-top: 18px;
  padding: 14px;
  border: 1px solid rgba(66, 245, 230, 0.22);
  border-radius: 22px;
  background: linear-gradient(180deg, rgba(9, 21, 34, 0.72), rgba(6, 15, 26, 0.84));
}
.docker-table-shell__toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 14px;
}
.docker-table-shell__chip {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  min-height: 38px;
  padding: 0 14px;
  border: 1px solid rgba(66, 245, 230, 0.16);
  border-radius: 999px;
  background: rgba(66, 245, 230, 0.08);
}
.docker-table-shell__arrow {
  display: grid;
  place-items: center;
  width: 34px;
  height: 34px;
  border: 1px solid rgba(66, 245, 230, 0.18);
  border-radius: 999px;
  color: var(--docker-text);
  background: transparent;
  cursor: pointer;
}

.docker-table-wrap { overflow: auto; }
.docker-table { width: 100%; border-collapse: collapse; }
.docker-table th,
.docker-table td { padding: 14px 10px; text-align: left; border-bottom: 1px solid rgba(66, 245, 230, 0.12); }
.docker-table th { color: rgba(150, 201, 220, 0.84); font-size: 12px; font-weight: 600; }
.docker-table__cell { display: inline-flex; align-items: center; min-height: 24px; color: var(--docker-text); }
.docker-table tbody tr { transition: background 0.2s ease, box-shadow 0.2s ease; }
.docker-table tbody tr.is-selected { background: rgba(66, 245, 230, 0.08); box-shadow: inset 0 0 0 1px rgba(66, 245, 230, 0.16); }
.docker-table__cell.is-badge {
  min-height: 28px;
  padding: 0 10px;
  border: 1px solid rgba(66, 245, 230, 0.16);
  border-radius: 999px;
  background: rgba(66, 245, 230, 0.08);
}
.docker-table__cell.is-mono {
  font-family: "Consolas", "Courier New", monospace;
  font-size: 12px;
  color: rgba(205, 230, 242, 0.88);
}
.docker-table__actions { display: flex; flex-wrap: wrap; gap: 8px; }
.docker-action-button {
  min-height: 28px;
  padding: 0 10px;
  border: 1px solid rgba(66, 245, 230, 0.18);
  border-radius: 999px;
  background: rgba(66, 245, 230, 0.06);
  color: var(--docker-text);
  cursor: pointer;
}
.docker-action-button.is-ok { color: var(--docker-success); }
.docker-action-button.is-warn { color: var(--docker-warn); }

.docker-feature-header__icon {
  display: grid;
  place-items: center;
  width: 52px;
  height: 52px;
  border: 1px solid rgba(66, 245, 230, 0.26);
  border-radius: 18px;
  color: var(--docker-accent);
  background: rgba(66, 245, 230, 0.1);
  font-size: 24px;
}
.docker-feature-illustration {
  position: relative;
  height: 140px;
  margin-top: 24px;
  border: 1px solid rgba(66, 245, 230, 0.14);
  border-radius: 24px;
  background: linear-gradient(180deg, rgba(5, 17, 28, 0.6), rgba(7, 19, 31, 0.9));
}
.docker-feature-illustration span {
  position: absolute;
  left: 50%;
  border: 1px solid rgba(66, 245, 230, 0.26);
  background: linear-gradient(180deg, rgba(66, 245, 230, 0.28), rgba(66, 245, 230, 0.08));
  transform: translateX(-50%);
}
.docker-feature-illustration.is-images span:nth-child(1) { top: 26px; width: 76px; height: 84px; border-radius: 14px; }
.docker-feature-illustration.is-images span:nth-child(2) { bottom: 22px; width: 102px; height: 10px; border-radius: 999px; }
.docker-feature-illustration.is-images span:nth-child(3) { top: 46px; width: 28px; height: 8px; border-radius: 999px; background: var(--docker-accent); }
.docker-feature-illustration.is-mounts span:nth-child(1) { top: 20px; width: 84px; height: 84px; border-radius: 18px; }
.docker-feature-illustration.is-mounts span:nth-child(2) { top: 38px; width: 42px; height: 42px; border-radius: 50%; background: transparent; }
.docker-feature-illustration.is-mounts span:nth-child(3) { bottom: 22px; width: 112px; height: 10px; border-radius: 999px; }
.docker-feature-illustration.is-networks span:nth-child(1) { top: 18px; width: 96px; height: 28px; border-radius: 10px; }
.docker-feature-illustration.is-networks span:nth-child(2) { top: 54px; width: 96px; height: 28px; border-radius: 10px; }
.docker-feature-illustration.is-networks span:nth-child(3) { top: 90px; width: 96px; height: 28px; border-radius: 10px; }

.docker-detail-shell { display: block; }
.docker-warning-strip { display: flex; flex-wrap: wrap; gap: 10px; }
.docker-warning-strip span {
  padding: 10px 14px;
  border: 1px solid rgba(255, 184, 108, 0.2);
  border-radius: 14px;
  color: rgba(255, 210, 161, 0.94);
  background: rgba(255, 184, 108, 0.08);
  font-size: 13px;
}

@keyframes pulse-glow {
  0%, 100% { transform: translateX(-50%) scale(0.85); opacity: 0.64; }
  50% { transform: translateX(-50%) scale(1.2); opacity: 1; }
}

@media (max-width: 1460px) {
  .docker-topbar { grid-template-columns: 1fr; }
  .docker-topbar__tools { justify-content: flex-start; }
  .docker-layout { grid-template-columns: 1fr; }
}

@media (max-width: 1180px) {
  .docker-overview-grid { grid-template-columns: 1fr; }
}

@media (max-width: 820px) {
  .docker-manage-shell { padding: 16px; }
  .docker-topbar { padding: 16px; }
  .docker-topbar__nav { grid-template-columns: repeat(2, minmax(0, 1fr)); clip-path: none; border-radius: 20px; }
  .docker-topbar__tools { flex-direction: column; align-items: stretch; }
  .docker-searchbox { min-width: 0; width: 100%; }
  .docker-server-meta,
  .docker-runtime-metrics { grid-template-columns: 1fr; }
}
</style>
