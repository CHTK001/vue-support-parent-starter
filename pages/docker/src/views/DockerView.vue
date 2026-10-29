<script setup lang="ts">
/**
 * Docker 独立页面（路由 {@code /docker}）
 *
 * <p>页面级页签：容器 / 镜像 / 网络 / 卷 / 镜像库 / 模板。容器页签是左右结构：
 * 左栏清单（搜索 / 状态筛选 / 右键菜单），右栏 {@link ContainerWorkspace}
 * （概览 / 实时日志 / 终端 / 环境变量 / 挂载），可关闭。</p>
 *
 * <p>主机来自 {@code /ms/server/host}；页面不依赖 {@code @pages/server}，
 * 这样从资产页跳转过来（{@code /docker?hostId=}）时本包可以单独挂载。</p>
 *
 * <p>长耗时动作全部在子组件里走 SSE：安装容器（{@link InstallContainerDialog}）、
 * 卸载容器 / 日志 / 终端（{@link ContainerWorkspace}）、镜像下载与删除
 * （{@link ImageWorkbench}）。本文件只负责编排与列表刷新。</p>
 *
 * @author CH
 * @since 4.0.0.46
 */
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from "vue";
import { useRoute } from "vue-router";
import { ElMessageBox } from "element-plus";
import { message } from "@repo/core";
// 自带样式：路由工厂可能被宿主直接深导入（不经过包根 index.ts），
// 因此把 CSS 挂在页面组件上，保证任何挂载方式都有一份样式。
import "../styles/docker.css";
import {
  containerAction,
  createNetwork,
  dockerCapability,
  listContainers,
  listHosts,
  listNetworks,
  listVolumes,
  removeContainer,
} from "../api";
import type { DockerCapability, DockerContainer, DockerHost, DockerNetwork, DockerNetworkRequest, DockerTemplate, DockerVolume } from "../api";
import ContainerWorkspace from "./ContainerWorkspace.vue";
import ImageWorkbench from "./ImageWorkbench.vue";
import InstallContainerDialog from "./InstallContainerDialog.vue";
import RegistryWorkbench from "./RegistryWorkbench.vue";
import TemplateWorkbench from "./TemplateWorkbench.vue";

/** 页面级页签 */
type PageTab = "containers" | "images" | "networks" | "volumes" | "registries" | "templates";

/** 右栏页签（与 ContainerWorkspace 保持一致） */
type WorkspaceTab = "overview" | "logs" | "terminal" | "env" | "mounts";

const route = useRoute();

/* ==================== 主机 ==================== */

const hosts = ref<DockerHost[]>([]);
const hostsLoading = ref(false);
const hostsError = ref("");
const hostId = ref(0);

/** 当前主机 */
const currentHost = computed(() => hosts.value.find((h) => h.id === hostId.value) ?? null);

/** 主机显示名 */
function hostLabel(h: DockerHost): string {
  return `${h.serverHostName || "未命名主机"}（${h.serverHostAddress || "-"}）`;
}

/** 读取主机台账 */
async function loadHosts(): Promise<void> {
  hostsLoading.value = true;
  hostsError.value = "";
  try {
    const list = await listHosts();
    hosts.value = Array.isArray(list) ? list : [];
    const fromQuery = Number(route.query.hostId);
    if (!hostId.value) {
      if (Number.isFinite(fromQuery) && hosts.value.some((h) => h.id === fromQuery)) hostId.value = fromQuery;
      else hostId.value = hosts.value[0]?.id ?? 0;
    }
  } catch (e: any) {
    hostsError.value = e?.message ?? "读取主机列表失败";
    hosts.value = [];
  } finally {
    hostsLoading.value = false;
  }
}

/* ==================== 能力 / 容器 ==================== */

const capability = ref<DockerCapability | null>(null);
const capLoading = ref(false);

const containers = ref<DockerContainer[]>([]);
const containersLoading = ref(false);
const containersError = ref("");

const keyword = ref("");
const stateFilter = ref<"all" | "running" | "stopped">("all");
const showAll = ref(true);

/** 多选：已选中的容器 id 列表 */
const selectedIds = ref<string[]>([]);

/** 已选容器（按列表顺序） */
const selectedContainers = computed(() => containers.value.filter((c) => selectedIds.value.includes(c.id)));

/** 全选 / 取消全选（在已过滤的列表中） */
function toggleSelectAll(): void {
  if (selectedIds.value.length === filteredContainers.value.length) {
    selectedIds.value = [];
  } else {
    selectedIds.value = filteredContainers.value.map((c) => c.id);
  }
}

/** 过滤后的容器 */
const filteredContainers = computed(() => {
  const kw = keyword.value.trim().toLowerCase();
  return containers.value.filter((c) => {
    if (stateFilter.value === "running" && c.state !== "running") return false;
    if (stateFilter.value === "stopped" && c.state === "running") return false;
    if (!kw) return true;
    return [c.name, c.image, c.status, c.ports, c.id].some((v) => String(v ?? "").toLowerCase().includes(kw));
  });
});

/** 主机能力探测 */
async function loadCapability(): Promise<void> {
  if (!hostId.value) return;
  capLoading.value = true;
  try {
    capability.value = await dockerCapability(hostId.value);
  } catch (e: any) {
    capability.value = { installed: false };
    // 能力探测失败通常意味着后端模块未就绪，用页内提示即可，不弹 toast 打扰
    containersError.value = e?.message ?? "";
  } finally {
    capLoading.value = false;
  }
}

/** 容器清单 */
async function loadContainers(): Promise<void> {
  if (!hostId.value) return;
  containersLoading.value = true;
  containersError.value = "";
  try {
    const list = await listContainers(hostId.value, showAll.value);
    containers.value = Array.isArray(list) ? list : [];
    if (selected.value && !containers.value.some((c) => c.id === selected.value?.id)) selected.value = null;
  } catch (e: any) {
    containersError.value = e?.message ?? "读取容器列表失败";
    containers.value = [];
  } finally {
    containersLoading.value = false;
  }
}

/* ==================== 网络 / 卷 ==================== */

const networks = ref<DockerNetwork[]>([]);
const networksLoading = ref(false);
const volumes = ref<DockerVolume[]>([]);
const volumesLoading = ref(false);

/** 网络清单 */
async function loadNetworks(): Promise<void> {
  if (!hostId.value) return;
  networksLoading.value = true;
  try {
    const list = await listNetworks(hostId.value);
    networks.value = Array.isArray(list) ? list : [];
  } catch (e: any) {
    message.error(e?.message ?? "读取网络列表失败");
    networks.value = [];
  } finally {
    networksLoading.value = false;
  }
}

/** 卷清单 */
async function loadVolumes(): Promise<void> {
  if (!hostId.value) return;
  volumesLoading.value = true;
  try {
    const list = await listVolumes(hostId.value);
    volumes.value = Array.isArray(list) ? list : [];
  } catch (e: any) {
    message.error(e?.message ?? "读取卷列表失败");
    volumes.value = [];
  } finally {
    volumesLoading.value = false;
  }
}

/* ==================== 页签 ==================== */

const tab = ref<PageTab>("containers");

/** 切换页签：首次进入按需拉数据 */
function switchTab(t: PageTab): void {
  tab.value = t;
  if (t === "networks" && !networks.value.length) void loadNetworks();
  if (t === "volumes" && !volumes.value.length) void loadVolumes();
}

/** 刷新当前页签的数据 */
function refresh(): void {
  if (!hostId.value) return;
  void loadCapability();
  void loadContainers();
  if (networks.value.length || tab.value === "networks") void loadNetworks();
  if (volumes.value.length || tab.value === "volumes") void loadVolumes();
}

/* ==================== 选中容器 / 右栏 ==================== */

const selected = ref<DockerContainer | null>(null);
const workspaceTab = ref<WorkspaceTab>("overview");
const workspaceRef = ref<InstanceType<typeof ContainerWorkspace> | null>(null);

/** 打开右栏（默认沿用当前内部页签，避免看日志时点另一台容器被弹回概览） */
function openWorkspace(c: DockerContainer, t: WorkspaceTab = workspaceTab.value): void {
  selected.value = c;
  workspaceTab.value = t;
}

/** 关闭右栏 */
function closeWorkspace(): void {
  selected.value = null;
}

/* ==================== 右键菜单 ==================== */

const menu = ref<{ open: boolean; x: number; y: number; container: DockerContainer | null }>({
  open: false,
  x: 0,
  y: 0,
  container: null,
});

/** 打开右键菜单（贴边时向内收，避免菜单跑出视口） */
function openMenu(e: MouseEvent, c: DockerContainer): void {
  selected.value = c;
  menu.value = {
    open: true,
    x: Math.min(e.clientX, window.innerWidth - 200),
    y: Math.min(e.clientY, window.innerHeight - 300),
    container: c,
  };
}

/** 关闭右键菜单 */
function closeMenu(): void {
  menu.value.open = false;
}

/** 菜单项是否可用 */
function isRunning(c: DockerContainer | null): boolean {
  return c?.state === "running";
}

/** 菜单动作（启停类直接调接口，删除交给右栏复用 SSE 确认流程） */
async function menuAction(action: "start" | "stop" | "restart" | "pause" | "unpause" | "remove"): Promise<void> {
  const c = menu.value.container;
  closeMenu();
  if (!c || !hostId.value) return;
  if (action === "remove") {
    openWorkspace(c, "overview");
    await nextTick();
    workspaceRef.value?.requestRemove();
    return;
  }
  const label = { start: "启动", stop: "停止", restart: "重启", pause: "暂停", unpause: "恢复" }[action];
  try {
    await containerAction(hostId.value, c.id, action);
    message.success(`${label}成功：${c.name}`);
    await loadContainers();
  } catch (e: any) {
    message.error(e?.message ?? `${label}失败`);
  }
}

/** 复制文本 */
async function copyText(text: string, tip: string): Promise<void> {
  try {
    await navigator.clipboard.writeText(text);
    message.success(`${tip}已复制`);
  } catch {
    message.error("复制失败");
  }
}

/** 菜单 → 打开指定右栏页签 */
function menuOpen(t: WorkspaceTab): void {
  const c = menu.value.container;
  if (c) openWorkspace(c, t);
  closeMenu();
}

/** 菜单 → 复制容器名 / ID */
function menuCopy(kind: "name" | "id"): void {
  const c = menu.value.container;
  if (c) void copyText(kind === "name" ? c.name : c.id, kind === "name" ? "容器名" : "容器 ID");
  closeMenu();
}

/* ==================== 安装弹窗 ==================== */

const installOpen = ref(false);
const installPreset = ref<{ image?: string; registryId?: string; template?: DockerTemplate | null }>({});

/** 打开安装弹窗 */
function openInstall(preset: { image?: string; registryId?: string; template?: DockerTemplate | null } = {}): void {
  if (!hostId.value) {
    message.warning("请先选择主机");
    return;
  }
  installPreset.value = preset;
  installOpen.value = true;
}

/** 批量动作（启停删逐个调接口；删除用同步版，要求确认） */
async function batchAction(action: "start" | "stop" | "remove"): Promise<void> {
  const ids = selectedIds.value.slice();
  if (!ids.length) return;
  const label = { start: "启动", stop: "停止", remove: "删除" }[action];
  const ok = await ElMessageBox.confirm(`确认 ${label} ${ids.length} 个已选容器？`, label, {
    confirmButtonText: action === "remove" ? "删除" : "执行",
    cancelButtonText: "取消",
    type: action === "remove" ? "warning" : "info",
  });
  if (!ok) return;
  let failed = 0;
  for (const c of containers.value) {
    if (!ids.includes(c.id) || !hostId.value) continue;
    try {
      if (action === "remove") {
        await removeContainer(hostId.value, c.id, true);
      } else {
        await containerAction(hostId.value, c.id, action);
      }
    } catch {
      failed++;
    }
  }
  if (failed) {
    message.warning(`${label}完成，${failed} 个失败`);
  } else {
    message.success(`${label}成功`);
  }
  selectedIds.value = [];
  await loadContainers();
}

/* ==================== 网络创建 ==================== */

const netCreateOpen = ref(false);
const netCreateLoading = ref(false);
const netCreateError = ref("");

/** 建网表单 */
const netCreateName = ref("");
const netCreateDriver = ref("bridge");

/** 关闭建网弹窗时清零错误 */
watch(netCreateOpen, (open) => {
  if (open) {
    netCreateError.value = "";
    netCreateName.value = "";
    netCreateDriver.value = "bridge";
  }
});

/** 创建网络并刷新列表 */
async function doCreateNetwork(): Promise<void> {
  if (!netCreateName.value.trim() || !hostId.value) return;
  netCreateLoading.value = true;
  netCreateError.value = "";
  try {
    await createNetwork(hostId.value, { name: netCreateName.value.trim(), driver: netCreateDriver.value });
    netCreateOpen.value = false;
    netCreateName.value = "";
    netCreateDriver.value = "bridge";
    message.success("网络已创建");
    await loadNetworks();
  } catch (e: any) {
    netCreateError.value = e?.message ?? "创建网络失败";
    message.error(netCreateError.value);
  } finally {
    netCreateLoading.value = false;
  }
}

/* ==================== 生命周期 ==================== */

/** 主机切换 → 重载全部主机维度数据（连同多选状态一起归零） */
watch(hostId, (id) => {
  selected.value = null;
  selectedIds.value = [];
  capability.value = null;
  containers.value = [];
  networks.value = [];
  volumes.value = [];
  if (!id) return;
  void loadCapability();
  void loadContainers();
  if (tab.value === "networks") void loadNetworks();
  if (tab.value === "volumes") void loadVolumes();
  // 注意：这里**不能**把 hostId 回写进路由 query。
  // 布局用 `<component :key="route.fullPath">` 挂载页面，回写 query 会改变 fullPath，
  // 触发整页销毁重建 —— 于是 loadHosts / loadCapability / loadContainers 又各发一遍
  // （真机实测：host、docker/4/capability、docker/4/containers 全部成对重复），
  // 顺带把 tab 重置回「容器」。query 里的 hostId 只作为进入本页时的初值提示读取。
});

/** 仅显示运行中 / 全部 */
watch(showAll, () => void loadContainers());

onMounted(() => {
  void loadHosts();
  window.addEventListener("click", closeMenu);
  window.addEventListener("scroll", closeMenu, true);
});

onBeforeUnmount(() => {
  window.removeEventListener("click", closeMenu);
  window.removeEventListener("scroll", closeMenu, true);
});
</script>

<template>
  <div class="dk-page">
    <!-- 顶部：主机 + 能力 + 刷新 + 安装 -->
    <div class="dk-head">
      <span class="dk-title"><ReIcon name="Box" :size="16" /> Docker</span>

      <select v-model.number="hostId" class="dk-select" :disabled="hostsLoading || !hosts.length" title="选择主机">
        <option v-if="!hosts.length" :value="0">{{ hostsLoading ? "读取主机…" : "暂无主机" }}</option>
        <option v-for="h in hosts" :key="h.id" :value="h.id">{{ hostLabel(h) }}</option>
      </select>

      <span v-if="hostsError" class="dk-pill is-bad">{{ hostsError }}</span>

      <template v-if="capability">
        <span class="dk-pill" :class="capability.installed ? 'is-ok' : 'is-bad'">
          {{ capLoading ? "探测中…" : capability.installed ? `Docker ${capability.version || "已安装"}` : "未安装 Docker" }}
        </span>
        <span v-if="capability.compose" class="dk-pill is-info">compose</span>
        <span v-if="capability.runtime" class="dk-pill">{{ capability.runtime }}</span>
      </template>
      <span v-else-if="capLoading" class="dk-pill">探测中…</span>

      <span class="dk-spacer" />
    </div>

    <!-- 页面级页签 -->
    <nav class="dk-tabs">
      <button type="button" :class="{ on: tab === 'containers' }" @click="switchTab('containers')">
        <ReIcon name="Box" :size="13" /> 容器 <em>{{ containers.length }}</em>
      </button>
      <button type="button" :class="{ on: tab === 'images' }" @click="switchTab('images')">
        <ReIcon name="Files" :size="13" /> 镜像
      </button>
      <button type="button" :class="{ on: tab === 'networks' }" @click="switchTab('networks')">
        <ReIcon name="Share" :size="13" /> 网络 <em v-if="networks.length">{{ networks.length }}</em>
      </button>
      <button type="button" :class="{ on: tab === 'volumes' }" @click="switchTab('volumes')">
        <ReIcon name="Folder" :size="13" /> 卷 <em v-if="volumes.length">{{ volumes.length }}</em>
      </button>
      <button type="button" :class="{ on: tab === 'registries' }" @click="switchTab('registries')">
        <ReIcon name="Coin" :size="13" /> 镜像库
      </button>
      <button type="button" :class="{ on: tab === 'templates' }" @click="switchTab('templates')">
        <ReIcon name="Document" :size="13" /> 模板
      </button>
    </nav>

    <!-- 无主机 -->
    <div v-if="!hostId && !hostsLoading" class="dk-pane dk-pane--full">
      <div class="dk-guide">
        <ReIcon name="Monitor" :size="26" />
        <b>{{ hosts.length ? "正在选择主机" : "还没有可用的主机" }}</b>
        <span>{{ hosts.length ? "从上方下拉框选择一台主机" : "先在主机资产中登记主机，再回到这里管理 Docker" }}</span>
      </div>
    </div>

    <!-- 容器页签 -->
    <template v-else-if="tab === 'containers'">
      <div class="dk-body">
        <div class="dk-pane dk-pane--list">
          <div class="dk-pane-head">
            <ReIcon name="Box" :size="14" />
            <b>容器</b>
            <span class="dk-pill">{{ filteredContainers.length }}/{{ containers.length }}</span>
            <span class="dk-spacer" />
            <ReButton layout="square" icon="Plus" tip="安装容器" :disabled="!hostId" @click="openInstall()">
              安装容器
            </ReButton>
            <ReButton layout="square" link icon="Refresh" tip="刷新容器列表" :loading="containersLoading" @click="loadContainers" />
          </div>

          <!-- 批量操作：已选容器时显示 -->
          <div v-if="selectedIds.length" class="dk-batch">
            <button type="button" class="dk-batch__sel" @click="toggleSelectAll">
              {{ selectedIds.length === filteredContainers.length && filteredContainers.length ? "取消全选" : "全选" }}
            </button>
            <span>已选 {{ selectedIds.length }} / {{ filteredContainers.length }}</span>
            <span class="dk-spacer" />
            <ReButton layout="square" :disabled="!hostId" @click="batchAction('start')">
              <ReIcon name="VideoPlay" :size="13" /> 批量启动
            </ReButton>
            <ReButton layout="square" :disabled="!hostId" @click="batchAction('stop')" type="danger">
              <ReIcon name="VideoPause" :size="13" /> 批量停止
            </ReButton>
            <ReButton layout="square" :disabled="!hostId" type="danger" @click="batchAction('remove')">
              <ReIcon name="Delete" :size="13" /> 批量删除
            </ReButton>
          </div>

          <div class="dk-filter">
            <input v-model="keyword" class="dk-search" placeholder="搜索名称 / 镜像 / 端口" />
            <div class="dk-seg">
              <button type="button" :class="{ on: stateFilter === 'all' }" @click="stateFilter = 'all'">全部</button>
              <button type="button" :class="{ on: stateFilter === 'running' }" @click="stateFilter = 'running'">运行中</button>
              <button type="button" :class="{ on: stateFilter === 'stopped' }" @click="stateFilter = 'stopped'">已停止</button>
            </div>
            <label class="dk-check">
              <input v-model="showAll" type="checkbox" />
              包含已停止（docker ps -a）
            </label>
          </div>

          <div class="dk-pane-body dk-pane-body--flush">
            <div v-if="containersLoading && !containers.length" v-loading="true" class="dk-loading" />
            <div v-else-if="containersError" class="dk-empty">
              <ReIcon name="Warning" :size="22" />
              <b>读取失败</b>
              <span>{{ containersError }}</span>
              <ReButton size="small" icon="Refresh" @click="loadContainers">重试</ReButton>
            </div>
            <div v-else-if="!filteredContainers.length" class="dk-empty">
              <ReIcon name="Box" :size="22" />
              <b>{{ containers.length ? "没有匹配的容器" : "还没有容器" }}</b>
              <span>{{ containers.length ? "调整关键字或状态筛选" : "点击右上角「安装容器」创建第一个容器" }}</span>
            </div>
            <ul v-else class="dk-items">
              <li
                v-for="c in filteredContainers"
                :key="c.id"
                class="dk-item"
                :class="{ on: selected?.id === c.id }"
                @click="openWorkspace(c)"
                @contextmenu.prevent="openMenu($event, c)"
              >
                <input
                  v-model="selectedIds"
                  type="checkbox"
                  class="dk-item__check"
                  :value="c.id"
                  @click.stop
                />
                <span class="dk-dot" :class="c.state === 'running' ? 'is-ok' : c.state === 'paused' ? 'is-warn' : 'is-off'" />
                <span class="dk-item-main">
                  <span class="dk-item-name" :title="c.name">{{ c.name }}</span>
                  <span class="dk-item-sub" :title="c.image">{{ c.image }}</span>
                  <span class="dk-item-sub dk-mono" :title="c.ports">{{ c.ports || "未映射端口" }}</span>
                </span>
                <span class="dk-item-meta">
                  <span class="dk-item-state" :class="c.state === 'running' ? 'is-ok' : ''">{{ c.state }}</span>
                  <span class="dk-item-time" :title="c.status">{{ c.status || c.runningFor || "-" }}</span>
                </span>
              </li>
            </ul>
          </div>
        </div>

        <div class="dk-pane dk-pane--main">
          <ContainerWorkspace
            v-if="selected"
            ref="workspaceRef"
            v-model:tab="workspaceTab"
            :host-id="hostId"
            :container="selected"
            @close="closeWorkspace"
            @refresh="loadContainers"
            @removed="closeWorkspace"
          />
          <div v-else class="dk-guide">
            <ReIcon name="Box" :size="26" />
            <b>选择左侧容器</b>
            <span>单击查看概览，右键可直达日志 / 终端 / 启停 / 删除</span>
          </div>
        </div>
      </div>
    </template>

    <!-- 镜像页签 -->
    <ImageWorkbench
      v-else-if="tab === 'images'"
      :host-id="hostId"
      @create="(image, registryId) => openInstall({ image, registryId })"
    />

    <!-- 网络页签 -->
    <div v-else-if="tab === 'networks'" class="dk-pane dk-pane--full">
      <div class="dk-pane-head">
        <ReIcon name="Share" :size="14" />
        <b>网络</b>
        <span class="dk-pill">{{ networks.length }}</span>
        <span class="dk-spacer" />
        <ReButton layout="square" icon="Plus" tip="创建网络（docker network create）" :disabled="!hostId" @click="netCreateOpen = true">
          创建网络
        </ReButton>
        <ReButton layout="square" link icon="Refresh" tip="刷新网络列表" :loading="networksLoading" @click="loadNetworks" />
      </div>
      <div class="dk-pane-body">
        <div v-if="networksLoading && !networks.length" v-loading="true" class="dk-loading" />
        <div v-else-if="!networks.length" class="dk-empty">
          <ReIcon name="Share" :size="22" />
          <b>没有自定义网络</b>
          <span>Docker 默认提供 bridge / host / none</span>
        </div>
        <ul v-else class="dk-lines">
          <li v-for="n in networks" :key="n.id || n.name">
            <ReIcon name="Share" :size="13" />
            <b>{{ n.name }}</b>
            <span class="dk-tag">{{ n.driver || "-" }}</span>
            <span v-if="n.scope" class="dk-tag">{{ n.scope }}</span>
            <span class="dk-spacer" />
            <span class="dk-hint dk-mono">{{ n.id?.slice(0, 12) }}</span>
          </li>
        </ul>
      </div>
    </div>

    <!-- 卷页签 -->
    <div v-else-if="tab === 'volumes'" class="dk-pane dk-pane--full">
      <div class="dk-pane-head">
        <ReIcon name="Folder" :size="14" />
        <b>卷</b>
        <span class="dk-pill">{{ volumes.length }}</span>
        <span class="dk-spacer" />
        <ReButton layout="square" link icon="Refresh" tip="刷新卷列表" :loading="volumesLoading" @click="loadVolumes" />
      </div>
      <div class="dk-pane-body">
        <div v-if="volumesLoading && !volumes.length" v-loading="true" class="dk-loading" />
        <div v-else-if="!volumes.length" class="dk-empty">
          <ReIcon name="Folder" :size="22" />
          <b>没有数据卷</b>
          <span>安装容器时填写「宿主:容器」挂载后，命名卷会出现在这里</span>
        </div>
        <ul v-else class="dk-lines">
          <li v-for="v in volumes" :key="v.name">
            <ReIcon name="Folder" :size="13" />
            <b>{{ v.name }}</b>
            <span class="dk-tag">{{ v.driver || "local" }}</span>
            <span class="dk-spacer" />
            <span class="dk-hint dk-mono dk-ellipsis" :title="v.mountpoint">{{ v.mountpoint || "-" }}</span>
          </li>
        </ul>
      </div>
    </div>

    <!-- 镜像库页签 -->
    <RegistryWorkbench v-else-if="tab === 'registries'" />

    <!-- 模板页签 -->
    <TemplateWorkbench v-else :host-id="hostId" @run="(tpl) => openInstall({ template: tpl })" />

    <!-- 容器右键菜单（fixed + Teleport，避免被 pane 的 overflow 裁掉） -->
    <Teleport to="body">
      <div
        v-if="menu.open && menu.container"
        class="dk-menu"
        :style="{ left: `${menu.x}px`, top: `${menu.y}px` }"
        @click.stop
      >
        <button type="button" @click="menuAction('start')" :disabled="isRunning(menu.container)">
          <ReIcon name="VideoPlay" :size="13" /> 启动
        </button>
        <button type="button" @click="menuAction('stop')" :disabled="!isRunning(menu.container)">
          <ReIcon name="VideoPause" :size="13" /> 停止
        </button>
        <button type="button" @click="menuAction('restart')" :disabled="!isRunning(menu.container)">
          <ReIcon name="RefreshRight" :size="13" /> 重启
        </button>
        <span class="dk-menu-sep" />
        <button type="button" @click="menuOpen('overview')">
          <ReIcon name="InfoFilled" :size="13" /> 概览
        </button>
        <button type="button" @click="menuOpen('logs')">
          <ReIcon name="Tickets" :size="13" /> 实时日志
        </button>
        <button type="button" @click="menuOpen('terminal')">
          <ReIcon name="Monitor" :size="13" /> 终端
        </button>
        <button type="button" @click="menuOpen('env')">
          <ReIcon name="Memo" :size="13" /> 环境变量
        </button>
        <button type="button" @click="menuOpen('mounts')">
          <ReIcon name="Folder" :size="13" /> 挂载
        </button>
        <span class="dk-menu-sep" />
        <button type="button" @click="menuCopy('name')">
          <ReIcon name="CopyDocument" :size="13" /> 复制容器名
        </button>
        <button type="button" @click="menuCopy('id')">
          <ReIcon name="DocumentCopy" :size="13" /> 复制容器 ID
        </button>
        <span class="dk-menu-sep" />
        <button type="button" class="is-danger" @click="menuAction('remove')">
          <ReIcon name="Delete" :size="13" /> 删除容器
        </button>
      </div>
    </Teleport>

    <!-- 创建网络 -->
    <div v-if="netCreateOpen" class="dk-mask" @click.self="netCreateOpen = false">
      <div class="dk-modal" role="dialog" aria-modal="true">
        <div class="dk-modal-head">
          <ReIcon name="Share" :size="15" />
          <b>创建网络</b>
          <span class="dk-spacer" />
          <ReButton layout="square" link icon="Close" tip="关闭" :disabled="netCreateLoading" @click="netCreateOpen = false" />
        </div>

        <div class="dk-modal-body">
          <div class="dk-form">
            <label class="dk-field">
              <span>网络名称 <i>*</i></span>
              <input v-model="netCreateName" class="dk-input" placeholder="如 web" @keyup.enter="doCreateNetwork" />
            </label>
            <label class="dk-field">
              <span>驱动</span>
              <select v-model="netCreateDriver" class="dk-select">
                <option value="bridge">bridge</option>
                <option value="host">host</option>
                <option value="none">none</option>
                <option value="overlay">overlay（swarm）</option>
              </select>
            </label>
            <div v-if="netCreateError" class="dk-hint dk-hint--bad">{{ netCreateError }}</div>
          </div>
        </div>

        <div class="dk-modal-foot">
          <span class="dk-hint">创建过程走 SSE 实时回显</span>
          <span class="dk-spacer" />
          <ReButton :disabled="netCreateLoading" @click="netCreateOpen = false">取消</ReButton>
          <ReButton type="primary" icon="Plus" tip="创建网络" :loading="netCreateLoading" @click="doCreateNetwork">
            创建
          </ReButton>
        </div>
      </div>
    </div>

    <!-- 安装容器 -->
    <InstallContainerDialog
      v-model="installOpen"
      :host-id="hostId"
      :host-name="currentHost ? hostLabel(currentHost) : undefined"
      :preset-image="installPreset.image"
      :preset-registry-id="installPreset.registryId"
      :preset-template="installPreset.template ?? null"
      @installed="
        () => {
          void loadContainers();
          tab = 'containers';
        }
      "
    />
  </div>
</template>
