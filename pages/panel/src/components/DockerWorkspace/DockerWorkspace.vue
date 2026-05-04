<template>
  <section class="docker-workspace">
    <ScLayout
      v-model="railTabValue"
      class="docker-layout"
      left-enabled
      :left-width="260"
      rail-enabled
      :rail-tabs="railTabs"
      :rail-width="48"
    >
      <template #left>
        <div class="left-panel">
          <div class="left-header"><strong>{{ selectedTabTitle }}</strong></div>
          <div class="left-hint">Docker {{ dockerVersion }}</div>
        </div>
      </template>

      <template #default>
        <div class="main-content">

          <!-- ═══ 概览 ═══ -->
          <template v-if="railTabValue === 'overview'">
            <div class="panel-view">
              <div class="panel-header">
                <span class="panel-title">系统概览</span>
                <ElButton :icon="RefreshRight" circle size="small" :loading="infoLoading" @click="loadInfo" />
              </div>
              <ElScrollbar class="panel-scroll">
                <div v-if="infoLoading" class="panel-loading"><ElIcon class="is-loading"><Loading /></ElIcon></div>
                <div v-else class="info-grid">
                  <div v-for="item in overviewCards" :key="item.label" class="info-card">
                    <span class="info-card__label">{{ item.label }}</span>
                    <span class="info-card__value">{{ item.value }}</span>
                  </div>
                </div>
              </ElScrollbar>
            </div>
          </template>

          <!-- ═══ 容器 ═══ -->
          <template v-else-if="railTabValue === 'containers'">
            <div class="panel-view">
              <div class="panel-header">
                <span class="panel-title">容器列表</span>
                <div class="panel-header__right">
                  <ElButton size="small" type="primary" :icon="Plus" @click="showCreateContainer = true">创建</ElButton>
                  <ElSwitch v-model="showAllContainers" size="small" active-text="全部" inactive-text="运行中" style="margin-right:8px" />
                  <ElButton :icon="RefreshRight" circle size="small" :loading="containersLoading" @click="loadContainers" />
                </div>
              </div>
              <ElScrollbar class="panel-scroll">
                <div v-if="containersLoading" class="panel-loading"><ElIcon class="is-loading"><Loading /></ElIcon></div>
                <div v-else-if="!containers.length" class="panel-empty"><ElEmpty description="暂无容器" :image-size="48" /></div>
                <table v-else class="data-table">
                  <thead>
                    <tr>
                      <th>ID</th><th>名称</th><th>镜像</th><th>状态</th>
                      <th>运行时间</th><th>端口</th><th>操作</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-for="c in containers" :key="c.id">
                      <td class="cell-mono">{{ shortId(c.id) }}</td>
                      <td>{{ containerName(c) }}</td>
                      <td>{{ c.image }}</td>
                      <td><span class="status-dot" :class="`is-${c.state}`" />{{ c.state }}</td>
                      <td>{{ c.status }}</td>
                      <td class="cell-mono">{{ formatPorts(c.ports) }}</td>
                      <td>
                        <ElDropdown trigger="click" @command="(cmd:string)=>handleContainerAction(c.id, cmd)">
                          <ElButton size="small">操作<ElIcon><ArrowDown /></ElIcon></ElButton>
                          <template #dropdown>
                            <ElDropdownMenu>
                              <ElDropdownItem command="start" :disabled="c.state==='running'" icon="VideoPlay">启动</ElDropdownItem>
                              <ElDropdownItem command="stop" :disabled="c.state!=='running'" icon="VideoPause">停止</ElDropdownItem>
                              <ElDropdownItem command="restart" icon="Refresh">重启</ElDropdownItem>
                              <ElDropdownItem command="kill" :disabled="c.state!=='running'" icon="Remove">终止</ElDropdownItem>
                              <ElDropdownItem command="pause" :disabled="c.state!=='running'" icon="CirclePause">暂停</ElDropdownItem>
                              <ElDropdownItem command="unpause" :disabled="c.state!=='paused'" icon="VideoPlay">恢复</ElDropdownItem>
                              <ElDropdownItem divided command="logs" icon="ChatLineSquare">日志</ElDropdownItem>
                              <ElDropdownItem command="stats" icon="DataLine">统计</ElDropdownItem>
                              <ElDropdownItem command="inspect" icon="InfoFilled">详情</ElDropdownItem>
                              <ElDropdownItem command="exec" icon="Monitor">执行命令</ElDropdownItem>
                              <ElDropdownItem command="diff" icon="List">文件变更</ElDropdownItem>
                              <ElDropdownItem divided command="rename" icon="Edit">重命名</ElDropdownItem>
                              <ElDropdownItem command="commit" icon="Upload">提交为镜像</ElDropdownItem>
                              <ElDropdownItem divided command="remove" icon="Delete">删除</ElDropdownItem>
                            </ElDropdownMenu>
                          </template>
                        </ElDropdown>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </ElScrollbar>
            </div>
          </template>

          <!-- ═══ 镜像 ═══ -->
          <template v-else-if="railTabValue === 'images'">
            <div class="panel-view">
              <div class="panel-header">
                <span class="panel-title">镜像列表</span>
                <div class="panel-header__right">
                  <ElButton size="small" type="primary" :icon="Plus" @click="showPullImage = true">拉取</ElButton>
                  <ElButton size="small" :icon="Search" @click="showSearchImage = true">搜索</ElButton>
                  <ElButton size="small" :icon="DocumentAdd" @click="showBuildImage = true">构建</ElButton>
                  <ElButton :icon="RefreshRight" circle size="small" :loading="imagesLoading" @click="loadImages" />
                </div>
              </div>
              <ElScrollbar class="panel-scroll">
                <div v-if="imagesLoading" class="panel-loading"><ElIcon class="is-loading"><Loading /></ElIcon></div>
                <div v-else-if="!images.length" class="panel-empty"><ElEmpty description="暂无镜像" :image-size="48" /></div>
                <table v-else class="data-table">
                  <thead>
                    <tr><th>ID</th><th>标签</th><th>大小</th><th>创建时间</th><th>操作</th></tr>
                  </thead>
                  <tbody>
                    <tr v-for="img in images" :key="img.id">
                      <td class="cell-mono">{{ shortId(img.id) }}</td>
                      <td>{{ formatTags(img.repotags) }}</td>
                      <td>{{ formatBytes(img.size) }}</td>
                      <td>{{ formatDate(img.created) }}</td>
                      <td>
                        <ElDropdown trigger="click" @command="(cmd:string)=>handleImageAction(img.id, cmd)">
                          <ElButton size="small">操作<ElIcon><ArrowDown /></ElIcon></ElButton>
                          <template #dropdown>
                            <ElDropdownMenu>
                              <ElDropdownItem command="inspect" icon="InfoFilled">详情</ElDropdownItem>
                              <ElDropdownItem command="tag" icon="Edit">标记</ElDropdownItem>
                              <ElDropdownItem command="push" icon="Upload">推送</ElDropdownItem>
                              <ElDropdownItem divided command="remove" icon="Delete">删除</ElDropdownItem>
                            </ElDropdownMenu>
                          </template>
                        </ElDropdown>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </ElScrollbar>
            </div>
          </template>

          <!-- ═══ 网络 ═══ -->
          <template v-else-if="railTabValue === 'networks'">
            <div class="panel-view">
              <div class="panel-header">
                <span class="panel-title">网络列表</span>
                <div class="panel-header__right">
                  <ElButton size="small" type="primary" :icon="Plus" @click="showCreateNetwork = true">创建</ElButton>
                  <ElButton size="small" :icon="Delete" @click="handlePruneNetworks">清理</ElButton>
                  <ElButton :icon="RefreshRight" circle size="small" :loading="networksLoading" @click="loadNetworks" />
                </div>
              </div>
              <ElScrollbar class="panel-scroll">
                <div v-if="networksLoading" class="panel-loading"><ElIcon class="is-loading"><Loading /></ElIcon></div>
                <div v-else-if="!networks.length" class="panel-empty"><ElEmpty description="暂无网络" :image-size="48" /></div>
                <table v-else class="data-table">
                  <thead>
                    <tr><th>ID</th><th>名称</th><th>驱动</th><th>范围</th><th>容器数</th><th>操作</th></tr>
                  </thead>
                  <tbody>
                    <tr v-for="n in networks" :key="n.id">
                      <td class="cell-mono">{{ shortId(n.id) }}</td>
                      <td>{{ n.name }}</td>
                      <td>{{ n.driver }}</td>
                      <td>{{ n.scope }}</td>
                      <td>{{ n.containers?.length || 0 }}</td>
                      <td>
                        <ElButton size="small" :icon="Delete" @click="handleRemoveNetwork(n.id)" />
                      </td>
                    </tr>
                  </tbody>
                </table>
              </ElScrollbar>
            </div>
          </template>

          <!-- ═══ 卷 ═══ -->
          <template v-else-if="railTabValue === 'volumes'">
            <div class="panel-view">
              <div class="panel-header">
                <span class="panel-title">卷列表</span>
                <div class="panel-header__right">
                  <ElButton size="small" type="primary" :icon="Plus" @click="showCreateVolume = true">创建</ElButton>
                  <ElButton size="small" :icon="Delete" @click="handlePruneVolumes">清理</ElButton>
                  <ElButton :icon="RefreshRight" circle size="small" :loading="volumesLoading" @click="loadVolumes" />
                </div>
              </div>
              <ElScrollbar class="panel-scroll">
                <div v-if="volumesLoading" class="panel-loading"><ElIcon class="is-loading"><Loading /></ElIcon></div>
                <div v-else-if="!volumes.length" class="panel-empty"><ElEmpty description="暂无卷" :image-size="48" /></div>
                <table v-else class="data-table">
                  <thead>
                    <tr><th>名称</th><th>驱动</th><th>挂载点</th><th>操作</th></tr>
                  </thead>
                  <tbody>
                    <tr v-for="v in volumes" :key="v.name">
                      <td>{{ v.name }}</td>
                      <td>{{ v.driver }}</td>
                      <td class="cell-mono">{{ v.mountpoint }}</td>
                      <td>
                        <ElButton size="small" :icon="Delete" @click="handleRemoveVolume(v.name)" />
                      </td>
                    </tr>
                  </tbody>
                </table>
              </ElScrollbar>
            </div>
          </template>

          <!-- ═══ 系统 ═══ -->
          <template v-else-if="railTabValue === 'system'">
            <div class="panel-view">
              <div class="panel-header">
                <span class="panel-title">系统信息</span>
                <ElButton :icon="RefreshRight" circle size="small" @click="loadSystemInfo" />
              </div>
              <ElScrollbar class="panel-scroll">
                <div v-if="systemLoading" class="panel-loading"><ElIcon class="is-loading"><Loading /></ElIcon></div>
                <div v-else class="system-content">
                  <ElDescriptions title="Docker 版本" :column="2" border size="small" style="margin:16px">
                    <ElDescriptionsItem v-for="(v,k) in dockerVersionInfo" :key="k" :label="k">{{ v }}</ElDescriptionsItem>
                  </ElDescriptions>
                  <ElDescriptions title="磁盘使用" :column="2" border size="small" style="margin:16px">
                    <ElDescriptionsItem label="镜像数">{{ diskUsage.imageCount }}</ElDescriptionsItem>
                    <ElDescriptionsItem label="容器数">{{ diskUsage.containerCount }}</ElDescriptionsItem>
                    <ElDescriptionsItem label="卷数">{{ diskUsage.volumeCount }}</ElDescriptionsItem>
                    <ElDescriptionsItem label="镜像大小">{{ formatBytes(diskUsage.imagesSize) }}</ElDescriptionsItem>
                    <ElDescriptionsItem label="容器大小">{{ formatBytes(diskUsage.containersSize) }}</ElDescriptionsItem>
                    <ElDescriptionsItem label="卷大小">{{ formatBytes(diskUsage.volumesSize) }}</ElDescriptionsItem>
                    <ElDescriptionsItem label="可回收">{{ formatBytes(diskUsage.layersSize) }}</ElDescriptionsItem>
                  </ElDescriptions>
                  <div class="panel-actions" style="padding:0 16px 16px">
                    <ElButton type="danger" :icon="Delete" @click="handlePruneAll">清理未使用资源</ElButton>
                  </div>
                </div>
              </ElScrollbar>
            </div>
          </template>

        </div>
      </template>
    </ScLayout>

    <!-- ─── 日志对话框 ─── -->
    <ElDialog v-model="logDialogVisible" title="容器日志" width="800px" destroy-on-close>
      <pre class="log-viewer">{{ logContent || '(empty)' }}</pre>
      <template #footer><ElButton @click="logDialogVisible = false">关闭</ElButton></template>
    </ElDialog>

    <!-- ─── 创建容器对话框 ─── -->
    <ElDialog v-model="showCreateContainer" title="创建容器" width="600px" destroy-on-close>
      <ElForm label-width="100px">
        <ElFormItem label="镜像名" required><ElInput v-model="createForm.imageName" placeholder="nginx:latest" /></ElFormItem>
        <ElFormItem label="容器名"><ElInput v-model="createForm.containerName" placeholder="可选" /></ElFormItem>
        <ElFormItem label="环境变量"><ElInput v-model="createForm.env" type="textarea" :rows="2" placeholder="KEY=VALUE, 每行一个" /></ElFormItem>
        <ElFormItem label="端口映射"><ElInput v-model="createForm.ports" type="textarea" :rows="2" placeholder="80:8080, 每行一个" /></ElFormItem>
        <ElFormItem label="挂载卷"><ElInput v-model="createForm.volumes" type="textarea" :rows="2" placeholder="/host:/container, 每行一个" /></ElFormItem>
      </ElForm>
      <template #footer>
        <ElButton @click="showCreateContainer = false">取消</ElButton>
        <ElButton type="primary" :loading="creatingContainer" @click="handleCreateContainer">创建</ElButton>
      </template>
    </ElDialog>

    <!-- ─── 拉取镜像对话框 ─── -->
    <ElDialog v-model="showPullImage" title="拉取镜像" width="450px" destroy-on-close>
      <ElForm label-width="100px">
        <ElFormItem label="镜像名" required><ElInput v-model="pullImageName" placeholder="nginx:latest" /></ElFormItem>
      </ElForm>
      <template #footer>
        <ElButton @click="showPullImage = false">取消</ElButton>
        <ElButton type="primary" :loading="pullingImage" @click="handlePullImage">拉取</ElButton>
      </template>
    </ElDialog>

    <!-- ─── 搜索镜像对话框 ─── -->
    <ElDialog v-model="showSearchImage" title="搜索镜像" width="600px" destroy-on-close>
      <ElForm label-width="100px">
        <ElFormItem label="关键词" required>
          <ElInput v-model="searchImageTerm" placeholder="nginx" @keyup.enter="handleSearchImage" />
        </ElFormItem>
      </ElForm>
      <div v-if="searchResults.length" class="search-results">
        <table class="data-table">
          <thead><tr><th>名称</th><th>描述</th><th>星数</th><th>官方</th></tr></thead>
          <tbody>
            <tr v-for="s in searchResults" :key="s.name">
              <td>{{ s.name }}</td><td>{{ s.description || '-' }}</td>
              <td>{{ s.stars }}</td><td>{{ s.isOfficial ? '是' : '否' }}</td>
            </tr>
          </tbody>
        </table>
      </div>
      <template #footer>
        <ElButton @click="showSearchImage = false">关闭</ElButton>
        <ElButton type="primary" :loading="searchingImage" @click="handleSearchImage">搜索</ElButton>
      </template>
    </ElDialog>

    <!-- ─── 构建镜像对话框 ─── -->
    <ElDialog v-model="showBuildImage" title="构建镜像" width="650px" destroy-on-close>
      <ElForm label-width="100px">
        <ElFormItem label="Dockerfile" required>
          <ElInput v-model="buildDockerfile" type="textarea" :rows="10" placeholder="FROM nginx:latest&#10;COPY . /usr/share/nginx/html" />
        </ElFormItem>
        <ElFormItem label="标签">
          <ElInput v-model="buildTags" placeholder="my-image:latest, 逗号分隔" />
        </ElFormItem>
      </ElForm>
      <template #footer>
        <ElButton @click="showBuildImage = false">取消</ElButton>
        <ElButton type="primary" :loading="buildingImage" @click="handleBuildImage">构建</ElButton>
      </template>
    </ElDialog>

    <!-- ─── 容器详情对话框 ─── -->
    <ElDialog v-model="showInspect" title="容器详情" width="800px" destroy-on-close>
      <pre class="inspect-viewer">{{ inspectData }}</pre>
      <template #footer><ElButton @click="showInspect = false">关闭</ElButton></template>
    </ElDialog>

    <!-- ─── 镜像详情对话框 ─── -->
    <ElDialog v-model="showImageInspect" title="镜像详情" width="700px" destroy-on-close>
      <pre class="inspect-viewer">{{ imageInspectData }}</pre>
      <template #footer><ElButton @click="showImageInspect = false">关闭</ElButton></template>
    </ElDialog>
  </section>
</template>

<script setup lang="ts">
import {
  ArrowDown, ChatLineSquare, CirclePause, DataLine, Delete, DocumentAdd,
  Edit, InfoFilled, List, Loading, Monitor, Plus, Refresh, RefreshRight,
  Remove, Search, Upload, VideoPlay, VideoPause,
} from "@element-plus/icons-vue";
import {
  ElButton, ElDescriptions, ElDescriptionsItem, ElDialog, ElDropdown,
  ElDropdownItem, ElDropdownMenu, ElEmpty, ElForm, ElFormItem,
  ElIcon, ElInput, ElMessage, ElMessageBox, ElScrollbar, ElSwitch, ElTooltip,
} from "element-plus";
import { computed, markRaw, onMounted, reactive, ref } from "vue";
import ScLayout from "@repo/components/ScLayout";
import * as dockerApi from "../../api/docker";

const props = defineProps<{ connectionId: string }>();

const railTabs = [
  { name: "overview", title: "概览", icon: markRaw(RefreshRight) },
  { name: "containers", title: "容器", icon: markRaw(VideoPlay) },
  { name: "images", title: "镜像", icon: markRaw(Refresh) },
  { name: "networks", title: "网络", icon: markRaw(DataLine) },
  { name: "volumes", title: "卷", icon: markRaw(List) },
  { name: "system", title: "系统", icon: markRaw(Monitor) },
];
const railTabValue = ref("overview");
const selectedTabTitle = computed(() => railTabs.find(t => t.name === railTabValue.value)?.title || "Docker");

// ─── 概览 ───
const dockerInfo = ref<Record<string, any>>({});
const dockerVersion = ref("");
const infoLoading = ref(false);
const overviewCards = computed(() => [
  { label: "版本", value: dockerInfo.value.serverVersion || "-" },
  { label: "操作系统", value: dockerInfo.value.operatingSystem || "-" },
  { label: "内核", value: dockerInfo.value.kernelVersion || "-" },
  { label: "架构", value: dockerInfo.value.architecture || "-" },
  { label: "CPU", value: dockerInfo.value.nCPU ?? "-" },
  { label: "内存", value: formatBytes(dockerInfo.value.memTotal) },
  { label: "容器总数", value: dockerInfo.value.containers ?? "-" },
  { label: "运行中", value: dockerInfo.value.containersRunning ?? "-" },
  { label: "已暂停", value: dockerInfo.value.containersPaused ?? "-" },
  { label: "已停止", value: dockerInfo.value.containersStopped ?? "-" },
  { label: "镜像数", value: dockerInfo.value.images ?? "-" },
  { label: "存储驱动", value: dockerInfo.value.driver || "-" },
]);

// ─── 容器 ───
const containers = ref<any[]>([]);
const containersLoading = ref(false);
const showAllContainers = ref(false);
const logDialogVisible = ref(false);
const logContent = ref("");
const showInspect = ref(false);
const inspectData = ref("");
const showExecDialog = ref(false);
const execContainerId = ref("");
const execCommand = ref("");

// 创建容器
const showCreateContainer = ref(false);
const creatingContainer = ref(false);
const createForm = reactive({ imageName: "", containerName: "", env: "", ports: "", volumes: "" });

// ─── 镜像 ───
const images = ref<any[]>([]);
const imagesLoading = ref(false);
const showPullImage = ref(false);
const pullingImage = ref(false);
const pullImageName = ref("");
const showSearchImage = ref(false);
const searchingImage = ref(false);
const searchImageTerm = ref("");
const searchResults = ref<any[]>([]);
const showBuildImage = ref(false);
const buildingImage = ref(false);
const buildDockerfile = ref("");
const buildTags = ref("");
const showImageInspect = ref(false);
const imageInspectData = ref("");

// ─── 网络 ───
const networks = ref<any[]>([]);
const networksLoading = ref(false);
const showCreateNetwork = ref(false);
const networkForm = reactive({ name: "", driver: "bridge" });

// ─── 卷 ───
const volumes = ref<any[]>([]);
const volumesLoading = ref(false);
const showCreateVolume = ref(false);
const volumeForm = reactive({ name: "", driver: "local" });

// ─── 系统 ───
const systemLoading = ref(false);
const dockerVersionInfo = ref<Record<string, any>>({});
const diskUsage = ref<Record<string, any>>({});

// ═══ 加载 ═══

const loadInfo = async () => {
  infoLoading.value = true;
  try {
    const [pingRes, infoRes] = await Promise.all([
      dockerApi.pingDocker(props.connectionId),
      dockerApi.fetchDockerInfo(props.connectionId),
    ]);
    dockerInfo.value = infoRes?.data || {};
    dockerVersion.value = dockerInfo.value.serverVersion || "";
  } catch { ElMessage.error("加载 Docker 信息失败"); }
  finally { infoLoading.value = false; }
};

const loadContainers = async () => {
  containersLoading.value = true;
  try {
    const res = await dockerApi.listDockerContainers(props.connectionId, showAllContainers.value);
    containers.value = res?.data || [];
  } catch { ElMessage.error("加载容器列表失败"); }
  finally { containersLoading.value = false; }
};

const loadImages = async () => {
  imagesLoading.value = true;
  try {
    const res = await dockerApi.listDockerImages(props.connectionId);
    images.value = res?.data || [];
  } catch { ElMessage.error("加载镜像列表失败"); }
  finally { imagesLoading.value = false; }
};

const loadNetworks = async () => {
  networksLoading.value = true;
  try {
    const res = await dockerApi.listDockerNetworks(props.connectionId);
    networks.value = res?.data || [];
  } catch { ElMessage.error("加载网络列表失败"); }
  finally { networksLoading.value = false; }
};

const loadVolumes = async () => {
  volumesLoading.value = true;
  try {
    const res = await dockerApi.listDockerVolumes(props.connectionId);
    volumes.value = res?.data || [];
  } catch { ElMessage.error("加载卷列表失败"); }
  finally { volumesLoading.value = false; }
};

const loadSystemInfo = async () => {
  systemLoading.value = true;
  try {
    const [ver, du] = await Promise.all([
      dockerApi.fetchDockerVersion(props.connectionId),
      dockerApi.fetchDockerDiskUsage(props.connectionId),
    ]);
    dockerVersionInfo.value = ver?.data || {};
    diskUsage.value = du?.data || {};
  } catch { ElMessage.error("加载系统信息失败"); }
  finally { systemLoading.value = false; }
};

// ═══ 容器操作 ═══

const handleContainerAction = async (containerId: string, cmd: string) => {
  switch (cmd) {
    case "start": await dockerApi.startDockerContainer(props.connectionId, containerId); break;
    case "stop": await dockerApi.stopDockerContainer(props.connectionId, containerId); break;
    case "restart": await dockerApi.restartDockerContainer(props.connectionId, containerId); break;
    case "kill": await dockerApi.killDockerContainer(props.connectionId, containerId); break;
    case "pause": await dockerApi.pauseDockerContainer(props.connectionId, containerId); break;
    case "unpause": await dockerApi.unpauseDockerContainer(props.connectionId, containerId); break;
    case "logs": return handleLogs(containerId);
    case "stats": return handleStats(containerId);
    case "inspect": return handleInspect(containerId);
    case "exec": return handleExec(containerId);
    case "diff": return handleDiff(containerId);
    case "rename": return handleRename(containerId);
    case "commit": return handleCommit(containerId);
    case "remove": return handleRemoveConfirm(containerId);
  }
  ElMessage.success(`容器${cmd}操作已执行`);
  await loadContainers();
};

const handleLogs = async (id: string) => {
  try {
    const res = await dockerApi.fetchDockerContainerLogs(props.connectionId, id, 200);
    logContent.value = res?.data || "";
    logDialogVisible.value = true;
  } catch { ElMessage.error("获取日志失败"); }
};

const handleStats = async (id: string) => {
  try {
    const res = await dockerApi.fetchDockerContainerStats(props.connectionId, id);
    inspectData.value = JSON.stringify(res?.data || {}, null, 2);
    showInspect.value = true;
  } catch { ElMessage.error("获取统计失败"); }
};

const handleInspect = async (id: string) => {
  try {
    const res = await dockerApi.inspectDockerContainer(props.connectionId, id);
    inspectData.value = JSON.stringify(res?.data || {}, null, 2);
    showInspect.value = true;
  } catch { ElMessage.error("获取详情失败"); }
};

const handleExec = async (id: string) => {
  const { value: cmd } = await ElMessageBox.prompt("输入要执行的命令", "执行命令", {
    inputValue: "ls -la", inputPlaceholder: "如: ls -la",
  });
  if (!cmd) return;
  try {
    const res = await dockerApi.execDockerContainer(props.connectionId, id, cmd.split(/\s+/));
    ElMessageBox.alert(res?.data || "(empty)", "执行结果");
  } catch { ElMessage.error("执行失败"); }
};

const handleDiff = async (id: string) => {
  try {
    const res = await dockerApi.fetchDockerContainerDiff(props.connectionId, id);
    inspectData.value = JSON.stringify(res?.data || [], null, 2);
    showInspect.value = true;
  } catch { ElMessage.error("获取文件变更失败"); }
};

const handleRename = async (id: string) => {
  const { value: name } = await ElMessageBox.prompt("输入新名称", "重命名容器", { inputValue: "new-name" });
  if (!name) return;
  try {
    await dockerApi.renameDockerContainer(props.connectionId, id, name);
    ElMessage.success("已重命名");
    await loadContainers();
  } catch { ElMessage.error("重命名失败"); }
};

const handleCommit = async (id: string) => {
  const { value: tag } = await ElMessageBox.prompt("输入镜像标签", "提交为镜像", { inputValue: "my-image:latest" });
  if (!tag) return;
  try {
    const parts = tag.split(":");
    await dockerApi.commitDockerContainer(props.connectionId, id, parts[0], parts[1] || "latest");
    ElMessage.success("已提交");
    await loadImages();
  } catch { ElMessage.error("提交失败"); }
};

const handleRemoveConfirm = async (id: string) => {
  try {
    await ElMessageBox.confirm("确定删除此容器？", "确认");
    await dockerApi.removeDockerContainer(props.connectionId, id, true);
    ElMessage.success("已删除");
    await loadContainers();
  } catch { /* cancelled */ }
};

const handleCreateContainer = async () => {
  if (!createForm.imageName) { ElMessage.warning("请输入镜像名"); return; }
  creatingContainer.value = true;
  try {
    const env: Record<string, string> = {};
    createForm.env.split("\n").filter(Boolean).forEach(l => { const [k, ...v] = l.split("="); env[k.trim()] = v.join("=").trim(); });
    const ports: Record<string, string> = {};
    createForm.ports.split("\n").filter(Boolean).forEach(l => { const [h, c] = l.split(":"); ports[c?.trim() || h.trim()] = h.trim(); });
    const volumes: Record<string, string> = {};
    createForm.volumes.split("\n").filter(Boolean).forEach(l => { const [h, c] = l.split(":"); volumes[h.trim()] = c?.trim() || ""; });
    await dockerApi.createDockerContainer(props.connectionId, {
      imageName: createForm.imageName,
      containerName: createForm.containerName || undefined,
      env: Object.keys(env).length ? env : undefined,
      ports: Object.keys(ports).length ? ports : undefined,
      volumes: Object.keys(volumes).length ? volumes : undefined,
    });
    ElMessage.success("容器已创建");
    showCreateContainer.value = false;
    await loadContainers();
  } catch { ElMessage.error("创建失败"); }
  finally { creatingContainer.value = false; }
};

// ═══ 镜像操作 ═══

const handleImageAction = async (imageId: string, cmd: string) => {
  switch (cmd) {
    case "inspect": return handleImageInspect(imageId);
    case "tag": return handleImageTag(imageId);
    case "push": return handleImagePush(imageId);
    case "remove": return handleImageRemove(imageId);
  }
};

const handleImageInspect = async (id: string) => {
  try {
    const res = await dockerApi.inspectDockerImage(props.connectionId, id);
    imageInspectData.value = JSON.stringify(res?.data || {}, null, 2);
    showImageInspect.value = true;
  } catch { ElMessage.error("获取镜像详情失败"); }
};

const handleImageTag = async (id: string) => {
  const { value: tag } = await ElMessageBox.prompt("输入仓库:标签", "标记镜像", { inputValue: "my-repo/my-image:latest" });
  if (!tag) return;
  try {
    const idx = tag.lastIndexOf(":");
    const repo = idx > 0 ? tag.substring(0, idx) : tag;
    const t = idx > 0 ? tag.substring(idx + 1) : "latest";
    await dockerApi.tagDockerImage(props.connectionId, id, repo, t);
    ElMessage.success("已标记");
  } catch { ElMessage.error("标记失败"); }
};

const handleImagePush = async (id: string) => {
  await ElMessageBox.confirm("确定推送此镜像？", "确认");
  try {
    await dockerApi.pushDockerImage(props.connectionId, id);
    ElMessage.success("已推送");
  } catch { ElMessage.error("推送失败"); }
};

const handleImageRemove = async (id: string) => {
  try {
    await ElMessageBox.confirm("确定删除此镜像？", "确认");
    await dockerApi.removeDockerImage(props.connectionId, id, true);
    ElMessage.success("已删除");
    await loadImages();
  } catch { /* cancelled */ }
};

const handlePullImage = async () => {
  if (!pullImageName.value) { ElMessage.warning("请输入镜像名"); return; }
  pullingImage.value = true;
  try {
    await dockerApi.pullDockerImage(props.connectionId, pullImageName.value);
    ElMessage.success("拉取完成");
    showPullImage.value = false;
    await loadImages();
  } catch { ElMessage.error("拉取失败"); }
  finally { pullingImage.value = false; }
};

const handleSearchImage = async () => {
  if (!searchImageTerm.value) return;
  searchingImage.value = true;
  try {
    const res = await dockerApi.searchDockerImages(props.connectionId, searchImageTerm.value);
    searchResults.value = res?.data || [];
  } catch { ElMessage.error("搜索失败"); }
  finally { searchingImage.value = false; }
};

const handleBuildImage = async () => {
  if (!buildDockerfile.value) { ElMessage.warning("请输入 Dockerfile"); return; }
  buildingImage.value = true;
  try {
    const tags = buildTags.value ? buildTags.value.split(",").map(s => s.trim()).filter(Boolean) : undefined;
    const res = await dockerApi.buildDockerImage(props.connectionId, buildDockerfile.value, tags);
    showBuildImage.value = false;
    ElMessageBox.alert(res?.data?.buildLog || "(empty)", "构建日志", { dangerouslyUseHTMLString: false });
    await loadImages();
  } catch { ElMessage.error("构建失败"); }
  finally { buildingImage.value = false; }
};

// ═══ 网络操作 ═══

const handleCreateNetwork = async () => {
  if (!networkForm.name) { ElMessage.warning("请输入网络名"); return; }
  try {
    await dockerApi.createDockerNetwork(props.connectionId, networkForm.name, networkForm.driver);
    ElMessage.success("网络已创建");
    showCreateNetwork.value = false;
    await loadNetworks();
  } catch { ElMessage.error("创建失败"); }
};

const handleRemoveNetwork = async (id: string) => {
  try {
    await ElMessageBox.confirm("确定删除此网络？", "确认");
    await dockerApi.removeDockerNetwork(props.connectionId, id);
    ElMessage.success("已删除");
    await loadNetworks();
  } catch { /* cancelled */ }
};

const handlePruneNetworks = async () => {
  try {
    await ElMessageBox.confirm("确定清理未使用的网络？", "确认");
    const res = await dockerApi.pruneDockerNetworks(props.connectionId);
    ElMessage.success(`已清理 ${(res?.data?.networksDeleted || []).length} 个网络`);
    await loadNetworks();
  } catch { /* cancelled */ }
};

// ═══ 卷操作 ═══

const handleCreateVolume = async () => {
  if (!volumeForm.name) { ElMessage.warning("请输入卷名"); return; }
  try {
    await dockerApi.createDockerVolume(props.connectionId, volumeForm.name, volumeForm.driver);
    ElMessage.success("卷已创建");
    showCreateVolume.value = false;
    await loadVolumes();
  } catch { ElMessage.error("创建失败"); }
};

const handleRemoveVolume = async (name: string) => {
  try {
    await ElMessageBox.confirm(`确定删除卷 ${name}？`, "确认");
    await dockerApi.removeDockerVolume(props.connectionId, name, true);
    ElMessage.success("已删除");
    await loadVolumes();
  } catch { /* cancelled */ }
};

const handlePruneVolumes = async () => {
  try {
    await ElMessageBox.confirm("确定清理未使用的卷？", "确认");
    await dockerApi.pruneDockerVolumes(props.connectionId);
    ElMessage.success("已清理");
    await loadVolumes();
  } catch { /* cancelled */ }
};

const handlePruneAll = async () => {
  try {
    await ElMessageBox.confirm("确定清理所有未使用的 Docker 资源？此操作不可撤销。", "确认", { confirmButtonText: "清理", type: "warning" });
    await Promise.all([
      dockerApi.pruneDockerContainers(props.connectionId).catch(() => {}),
      dockerApi.pruneDockerImages(props.connectionId).catch(() => {}),
      dockerApi.pruneDockerNetworks(props.connectionId).catch(() => {}),
      dockerApi.pruneDockerVolumes(props.connectionId).catch(() => {}),
    ]);
    ElMessage.success("已清理");
    await loadSystemInfo();
  } catch { /* cancelled */ }
};

// ═══ 工具 ═══

const shortId = (id: string) => (id || "").substring(0, 12);
const containerName = (c: any) => {
  const names = c.names || [];
  return names.length ? names[0].replace(/^\//, "") : c.id?.substring(0, 12);
};
const formatPorts = (ports: any[]) => {
  if (!ports?.length) return "-";
  return ports.map((p: any) => `${p.privatePort}${p.publicPort ? `:${p.publicPort}` : ""}/${p.type || "tcp"}`).join(", ");
};
const formatTags = (tags: string[]) => {
  if (!tags?.length) return "<none>";
  return tags.join(", ");
};
const formatBytes = (bytes: number) => {
  if (!bytes) return "-";
  const units = ["B", "KB", "MB", "GB", "TB"];
  let i = 0;
  let size = bytes;
  while (size >= 1024 && i < units.length - 1) { size /= 1024; i++; }
  return `${size.toFixed(1)} ${units[i]}`;
};
const formatDate = (ts: number) => {
  if (!ts) return "-";
  return new Date(ts * 1000).toLocaleString("zh-CN");
};

onMounted(() => {
  loadInfo();
  loadContainers();
  loadImages();
  loadNetworks();
  loadVolumes();
});
</script>

<style scoped lang="scss">
.docker-workspace {
  display: flex;
  flex-direction: column;
  height: 100%;
  min-height: 0;
  overflow: hidden;
}
.docker-layout { height: 100%; }
.left-panel {
  display: flex; flex-direction: column; height: 100%;
  padding: 16px; background: #f8fafc;
}
.left-header { font-size: 14px; color: #0f2534; margin-bottom: 4px; }
.left-hint { font-size: 12px; color: #9aacb8; }
.main-content {
  display: flex; flex-direction: column; height: 100%;
  min-height: 0; overflow: hidden;
}
.panel-view { display: flex; flex-direction: column; height: 100%; }
.panel-header {
  display: flex; align-items: center; justify-content: space-between;
  padding: 14px 16px;
  border-bottom: 1px solid rgba(127,144,155,0.12);
  background: rgba(248,250,252,0.9);
}
.panel-header__right { display: flex; align-items: center; gap: 8px; }
.panel-title { font-size: 15px; font-weight: 700; color: #0f2534; }
.panel-scroll { flex: 1; min-height: 0; }
.panel-loading, .panel-empty { display: flex; align-items: center; justify-content: center; padding: 48px; }
.info-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
  gap: 12px; padding: 16px;
}
.info-card {
  display: grid; gap: 6px; padding: 14px;
  border: 1px solid rgba(127,144,155,0.14);
  border-radius: 14px; background: #fff;
}
.info-card__label { font-size: 11px; color: #7a8f9d; }
.info-card__value { font-size: 16px; font-weight: 700; color: #0f2534; line-height: 1; }
.data-table {
  width: 100%; border-collapse: collapse; font-size: 12px;
  th {
    padding: 8px 12px; text-align: left; font-size: 11px; font-weight: 600;
    color: #7a8f9d; background: rgba(248,250,252,0.9);
    border-bottom: 1px solid rgba(127,144,155,0.12); white-space: nowrap;
  }
  td {
    padding: 8px 12px; border-bottom: 1px solid rgba(127,144,155,0.08);
    color: #1e3a4f;
  }
  tr:hover td { background: rgba(59,130,246,0.04); }
}
.cell-mono { font-family: "JetBrains Mono", monospace; font-size: 11px; color: #4a6070; }
.status-dot {
  display: inline-block; width: 7px; height: 7px; border-radius: 50%;
  margin-right: 6px;
  &.is-running { background: #22c55e; }
  &.is-exited { background: #ef4444; }
  &.is-paused { background: #f59e0b; }
  &.is-created { background: #3b82f6; }
}
.log-viewer, .inspect-viewer {
  max-height: 500px; padding: 12px; background: #1e293b;
  color: #e2e8f0; font-size: 12px;
  font-family: "JetBrains Mono", monospace; border-radius: 8px;
  overflow: auto; white-space: pre-wrap;
}
.search-results { margin: 16px; max-height: 300px; overflow: auto; }
.system-content { padding-bottom: 16px; }
.panel-actions { display: flex; gap: 8px; flex-wrap: wrap; }
</style>