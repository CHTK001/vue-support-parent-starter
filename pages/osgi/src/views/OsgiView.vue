<!--
  OSGi 插件管理 —— 调音台版式。

  设计语言：把 OSGi 运行时当作一台正在工作的调音台——
  - 每个 bundle 一路通道条（CH）：状态灯 + LED 电平表 + 推子反映生命周期电平，
    推子旁的按钮就是启停 / 升级 / 下载 / 卸载；
  - 跳线盘（PATCH BAY）= 服务注册表，每路服务一个插孔，已注册即点亮；
  - 磁带机（TAPE）+ 右侧机架 = Socket 实时操作日志，后端每次写操作广播
    开始 / 成功 / 失败三帧，磁带与日志同步滚动；
  - 文件仓 = 部署目录 jar 清单，卸载后文件仍在，在此删除。

  能力与后端 /osgi/** 完全对齐，全部真实链路：清单、统计、快照、服务登记走
  GET 端点，安装 / 升级 / 启停 / 卸载 / 删除 / 下载走变更端点，无一处 mock。
  卸载与升级前做二次确认；删除 jar 前确认且仅在 bundle 已卸载时可用。

  颜色与圆角全部走 koi / element 主题变量，明暗自动跟随；状态配色固定：
  INSTALLED=info、RESOLVED=primary、STARTING=warning、ACTIVE=success、
  STOPPING=primary-light、UNINSTALLED=danger。
-->
<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from "vue";
import { ElInput, ElMessageBox, ElSwitch } from "element-plus";
import { Search } from "@element-plus/icons-vue";
import { msgError, msgSuccess, useSocketService } from "@repo/core";
import ReButton from "@repo/ui/re-button";
import ReTag from "@repo/ui/re-tag";
import {
  OsgiError,
  deleteJar,
  downloadBundle,
  getSnapshot,
  installBundle,
  listBundles,
  listJars,
  listServices,
  listStats,
  startBundle,
  stopBundle,
  uninstallBundle,
  updateBundle,
} from "../api/osgiApi";
import type {
  OsgiBundle,
  OsgiJar,
  OsgiLogEntry,
  OsgiService,
  OsgiSnapshot,
  OsgiStats,
} from "../types/osgi";

defineOptions({ name: "OsgiManage" });

/** 运行时插件清单 */
const rows = ref<OsgiBundle[]>([]);
const loading = ref(false);
/** 正在执行变更的符号名，用于禁用整行操作，避免并发点击 */
const busy = ref("");

/** 部署目录 jar 清单（含是否仍在框架中） */
const jars = ref<OsgiJar[]>([]);
/** 部署目录读取中 */
const jarLoading = ref(false);
/** 正在删除的文件名 */
const jarBusy = ref("");
/** 文件仓筛选：all / installed（在框架中）/ only（仅文件） */
const trayFilter = ref<"all" | "installed" | "only">("all");

/** 框架统计（顶部芯片） */
const stats = ref<OsgiStats | null>(null);
/** 容器侧桥接快照（顶部芯片） */
const snapshot = ref<OsgiSnapshot | null>(null);
/** 服务注册表（跳线盘） */
const services = ref<OsgiService[]>([]);

/** 搜索关键字（符号名 / ID / 文件名 模糊匹配，纯前端展示过滤） */
const searchText = ref("");
/** 状态筛选键：all / ACTIVE / RESOLVED / transition / stopped */
const filterState = ref("all");
/** 通道条点击定位后临时高亮的行符号名 */
const highlightName = ref("");

const installInput = ref<HTMLInputElement | null>(null);
const upgradeInput = ref<HTMLInputElement | null>(null);
const upgradeTarget = ref("");

/** 每 30s 自动刷新开关，默认关，避免端点未开启时反复报错 */
const autoRefresh = ref(false);

/** 实时日志面板是否展开 */
const logOpen = ref(true);
/** 实时日志条目（最新的在末尾） */
const logs = ref<OsgiLogEntry[]>([]);
/** 日志条数上限：面板是「正在发生什么」的窗口，不是审计库 */
const LOG_LIMIT = 200;
/** 是否已接入 socket 通道（接入前日志区显示提示，避免误以为是后端没推） */
const logChannelReady = ref(false);
/** 最近一帧 socket 原始载荷，用于右侧展示载荷形状 */
const lastFrame = ref<{ module: string; event: string; dataId: string; timestamp: string } | null>(null);
/** 日志滚动容器 */
const logBox = ref<HTMLElement | null>(null);
/** 只保留失败与警告 */
const logOnlyProblem = ref(false);
/** 每次新日志 +1，用于重触发电平表 / 磁带机动画（新事件 = 电平跳动） */
const logPulse = ref(0);

let unsubscribeLog: (() => void) | undefined;

/** 过滤后的日志 */
const visibleLogs = computed(() =>
  logOnlyProblem.value ? logs.value.filter(item => item.level === "ERROR" || item.level === "WARN") : logs.value,
);

/** 失败 / 警告条数（面板折叠时也能看到异常） */
const problemCount = computed(
  () => logs.value.filter(item => item.level === "ERROR" || item.level === "WARN").length,
);

/** 磁带机上显示的最近若干条（倒序，最新在最下） */
const tapeTicks = computed(() => logs.value.slice(-7).reverse());

/** 运行中的 bundle 数（驾驶舱口径：按 state 统计全部 bundle） */
const activeCount = computed(() => rows.value.filter(row => row.state === "ACTIVE").length);

/** 框架系统 bundle（bundleId === 0）：不可停止/卸载/升级，界面上只展示 */
const framework = computed(() => rows.value.find(row => row.bundleId === 0));

/**
 * 顶部芯片：全部来自真实端点，取不到就显示 —，不用前端兜底编造。
 */
const chips = computed(() => {
  const rejected = snapshot.value?.rejected;
  const rejectedText = rejected ? JSON.stringify(rejected) : "{}";
  return [
    { label: "framework", value: snapshot.value?.frameworkVersion || stats.value?.frameworkVersion || "—" },
    { label: "bundles", value: String(stats.value?.totalBundles ?? rows.value.length) },
    { label: "serviceRefs", value: String(stats.value?.heldServiceReferences ?? "—") },
    { label: "definitions", value: String(snapshot.value?.definitionCount ?? "—") },
    { label: "jars", value: String(jars.value.length) },
    { label: "autoStartFailures", value: String(stats.value?.autoStartFailures ?? "—") },
    { label: "bridge", value: snapshot.value?.bridgeAvailable ? "✓" : "—" },
    { label: "acceptance", value: snapshot.value?.acceptanceEnabled ? "✓" : "—" },
    { label: "rejected", value: rejectedText.length > 20 ? `${rejectedText.slice(0, 20)}…` : rejectedText },
  ];
});

/** 主电平表点亮数：有运行中的 bundle 即高电平，否则维持中位 */
const masterLevel = computed(() => (activeCount.value > 0 ? 8 : 4));

/** 筛选项定义 */
const filters: Array<{ key: string; label: string }> = [
  { key: "all", label: "全部" },
  { key: "ACTIVE", label: "运行中" },
  { key: "RESOLVED", label: "已解析" },
  { key: "transition", label: "启动中" },
  { key: "stopped", label: "已停止" },
];

/** 搜索 + 状态筛选后的通道条 */
const filteredRows = computed(() => {
  const kw = searchText.value.trim().toLowerCase();
  return rows.value.filter(row => {
    if (!matchFilter(row)) {
      return false;
    }
    if (kw) {
      const hit = row.symbolicName.toLowerCase().includes(kw) || String(row.bundleId).includes(kw);
      if (!hit) {
        return false;
      }
    }
    return true;
  });
});

/** 文件仓筛选结果 */
const filteredJars = computed(() => {
  const kw = searchText.value.trim().toLowerCase();
  return jars.value.filter(jar => {
    if (trayFilter.value === "installed" && !jar.installed) {
      return false;
    }
    if (trayFilter.value === "only" && jar.installed) {
      return false;
    }
    if (kw && !jar.fileName.toLowerCase().includes(kw) && !(jar.symbolicName ?? "").toLowerCase().includes(kw)) {
      return false;
    }
    return true;
  });
});

/**
 * 是否为框架系统 bundle。系统 bundle 不可停止/卸载/升级，界面上只展示。
 *
 * @param row bundle
 * @return 系统 bundle 返回 true
 */
function isSystem(row: OsgiBundle): boolean {
  return row.bundleId === 0;
}

/**
 * 状态筛选匹配。
 *
 * @param row bundle
 * @return 命中当前筛选返回 true
 */
function matchFilter(row: OsgiBundle): boolean {
  const key = filterState.value;
  if (key === "all") {
    return true;
  }
  if (key === "transition") {
    return row.state === "STARTING" || row.state === "STOPPING";
  }
  if (key === "stopped") {
    return !["ACTIVE", "RESOLVED", "STARTING", "STOPPING"].includes(row.state);
  }
  return row.state === key;
}

/**
 * 状态 → 电平（0–10），推子与 LED 电平表共用这一口径。
 *
 * <p>与状态配色一致：卸载为 0，安装为低位，解析/停止中为中位，
 * 启动中过半，运行中满格。</p>
 *
 * @param state OSGi bundle 状态
 * @return 电平值
 */
function stateLevel(state: string): number {
  const map: Record<string, number> = {
    UNINSTALLED: 0,
    INSTALLED: 3,
    RESOLVED: 4,
    STOPPING: 5,
    STARTING: 6,
    ACTIVE: 8,
  };
  return map[state] ?? 2;
}

/**
 * LED 电平表分段样式：底部起点亮，高段用警示色。
 *
 * @param state OSGi bundle 状态
 * @param index 分段序号（1 起，自下而上）
 * @return 样式类名，未点亮返回空串
 */
function ladderClass(state: string, index: number): string {
  const level = stateLevel(state);
  if (index > level) {
    return "";
  }
  if (index >= 8) {
    return "max";
  }
  if (index >= 6) {
    return "hot";
  }
  return "on";
}

/**
 * 通道编号：两位补零，与 bundleId 一一对应。
 *
 * @param id bundleId
 * @return 展示文本
 */
function chNo(id: number): string {
  return String(id).padStart(2, "0");
}

/**
 * 状态中文名，未知状态原样返回。
 *
 * @param state OSGi bundle 状态
 * @return 展示文本
 */
function stateText(state: string): string {
  const labels: Record<string, string> = {
    ACTIVE: "运行中",
    RESOLVED: "已解析",
    INSTALLED: "已安装",
    STARTING: "启动中",
    STOPPING: "停止中",
    UNINSTALLED: "已卸载",
  };
  return labels[state] ?? state;
}

/**
 * 状态标签色（固定口径）：
 * INSTALLED=info、RESOLVED=primary、STARTING=warning、ACTIVE=success、
 * STOPPING=primary-light、UNINSTALLED=danger。
 *
 * @param state OSGi bundle 状态
 * @return ReTag 类型
 */
function stateTagType(state: string): "primary" | "success" | "warning" | "info" | "danger" {
  switch (state) {
    case "ACTIVE":
      return "success";
    case "STARTING":
      return "warning";
    case "RESOLVED":
    case "STOPPING":
      return "primary";
    case "UNINSTALLED":
      return "danger";
    default:
      return "info";
  }
}

/**
 * 统一错误文案：端点未开启时给出明确排查方向。
 *
 * @param error 异常
 * @return 展示文本
 */
function errText(error: unknown): string {
  if (error instanceof OsgiError && (error.status === 404 || error.status === 405)) {
    return `${error.message}；请确认后端已开启 plugin.osgi.endpoint.enabled=true`;
  }
  return error instanceof Error ? error.message : String(error);
}

async function reload(): Promise<void> {
  loading.value = true;
  try {
    rows.value = (await listBundles()) ?? [];
  } catch (error) {
    msgError(errText(error));
  } finally {
    loading.value = false;
  }
}

/**
 * 读取部署目录 jar 清单。
 *
 * <p>与 bundle 清单分开请求：bundle 列表在运行时一直在变，而 jar 列表只在
 * 上传/删除后变化。两个请求任一失败都不该让另一块显示成空。</p>
 */
async function reloadJars(): Promise<void> {
  jarLoading.value = true;
  try {
    jars.value = (await listJars()) ?? [];
  } catch (error) {
    msgError(errText(error));
  } finally {
    jarLoading.value = false;
  }
}

/**
 * 读取统计 / 快照 / 服务登记。
 *
 * <p>三块都是只读观测数据，任一失败只影响对应芯片与跳线盘，
 * 不牵连通道条（bundle 清单）的展示。</p>
 */
async function loadMetrics(): Promise<void> {
  try {
    stats.value = (await listStats()) ?? null;
  } catch {
    // 统计取不到时芯片显示 —，通道条不受影响
  }
  try {
    snapshot.value = (await getSnapshot()) ?? null;
  } catch {
    // 快照取不到时芯片显示 —，通道条不受影响
  }
  try {
    services.value = (await listServices()) ?? [];
  } catch {
    services.value = [];
  }
}

/** 刷新全部数据：变更操作后调用，避免「卸载了但文件仓还显示在框架中」 */
async function reloadAll(): Promise<void> {
  await Promise.all([reload(), reloadJars()]);
  await loadMetrics();
}

/**
 * 删除部署目录中的 jar。
 *
 * <p>删除是不可逆的破坏性操作，二次确认里把文件名整串写出来：
 * 部署目录常有 `xxx-1.0.0.jar` 与 `xxx-1.0.1.jar` 并存，只显示前缀很容易删错版本。</p>
 *
 * @param jar 待删除的 jar
 */
async function removeJar(jar: OsgiJar): Promise<void> {
  if (jar.installed) {
    msgError(`${jar.fileName} 仍是框架中的插件（${jar.symbolicName}），请先卸载再删除`);
    return;
  }
  try {
    await ElMessageBox.confirm(
      `确认从部署目录删除 ${jar.fileName}？该文件不可恢复，下次启动不会再加载它。`,
      "删除 jar 文件",
      { type: "warning", confirmButtonText: "删除", cancelButtonText: "取消" },
    );
  } catch {
    return;
  }
  jarBusy.value = jar.fileName;
  try {
    const result = await deleteJar(jar.fileName);
    if (result?.deleted) {
      msgSuccess(`已删除 ${jar.fileName}`);
    } else {
      msgError(`${jar.fileName} 已不存在，可能是被其他进程清理`);
    }
    await reloadAll();
  } catch (error) {
    msgError(errText(error));
  } finally {
    jarBusy.value = "";
  }
}

/**
 * 追加一条实时日志并滚到底部；同时让电平表与磁带机随新事件跳动。
 *
 * @param entry 日志条目
 */
function appendLog(entry: OsgiLogEntry): void {
  logs.value.push(entry);
  if (logs.value.length > LOG_LIMIT) {
    logs.value.splice(0, logs.value.length - LOG_LIMIT);
  }
  logPulse.value++;
  void nextTick(() => {
    const box = logBox.value;
    if (box) {
      box.scrollTop = box.scrollHeight;
    }
  });
}

/**
 * 把 socket 载荷归一成日志条目。
 *
 * <p>载荷可能是 {@code {module,event,data}} 整帧，也可能是已取出的 {@code data}；
 * 两种都接受，避免订阅端与后端任一侧调整层级后日志静默失联。</p>
 *
 * @param raw 原始载荷
 * @return 日志条目；缺关键字段时返回 null
 */
function toLogEntry(raw: unknown): OsgiLogEntry | null {
  if (!raw || typeof raw !== "object") {
    return null;
  }
  const frame = raw as Record<string, unknown>;
  const data =
    frame.data && typeof frame.data === "object" ? (frame.data as Record<string, unknown>) : frame;
  const action = typeof data.action === "string" ? data.action : "";
  if (!action) {
    return null;
  }
  return {
    level: typeof data.level === "string" ? data.level : "INFO",
    status: typeof data.status === "string" ? data.status : "success",
    action,
    symbolicName: typeof data.symbolicName === "string" ? data.symbolicName : "",
    message: typeof data.message === "string" ? data.message : "",
    startedAt: typeof data.startedAt === "number" ? data.startedAt : Date.now(),
    duration: typeof data.duration === "number" ? data.duration : 0,
  };
}

/**
 * 接入全局 socket 的插件操作日志。
 *
 * <p>订阅的是 {@code osgi / operation-log}：后端每次写操作都广播
 * 「开始 / 成功 / 失败」三条，因此这里不需要在前端自己拼状态，
 * 也不必等操作返回后才补一条本地日志——后端没走到的分支（如超时）也能看见。</p>
 */
function bindLogChannel(): void {
  const socket = useSocketService();
  if (!socket) {
    logChannelReady.value = false;
    return;
  }
  logChannelReady.value = true;
  unsubscribeLog = socket.subscribe("osgi", "operation-log", (msg: unknown) => {
    const frame = msg as Record<string, unknown> | null;
    if (frame && typeof frame === "object") {
      lastFrame.value = {
        module: typeof frame.module === "string" ? frame.module : "osgi",
        event: typeof frame.event === "string" ? frame.event : "",
        dataId: typeof frame.dataId === "string" ? frame.dataId : "",
        timestamp: typeof frame.timestamp === "string" ? frame.timestamp : "",
      };
    }
    const entry = toLogEntry(msg);
    if (entry) {
      appendLog(entry);
    }
  });
}

/** 清空日志面板（只清本地展示，不影响后端） */
function clearLogs(): void {
  logs.value = [];
}

/**
 * 日志时间格式化：只显示时分秒，日期在同一小时内没有信息量。
 *
 * @param ms 毫秒时间戳
 * @return HH:mm:ss
 */
function logTime(ms: number): string {
  const date = new Date(ms);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
}

/**
 * 操作名中文。
 *
 * @param action 后端操作名
 * @return 展示文本
 */
function actionText(action: string): string {
  const labels: Record<string, string> = {
    install: "安装",
    update: "升级",
    start: "启动",
    stop: "停止",
    uninstall: "卸载",
    "delete-jar": "删除文件",
    list: "读取清单",
    jars: "读取目录",
    download: "下载",
    stats: "读取统计",
    services: "读取服务",
    snapshot: "读取快照",
    context: "读取上下文",
  };
  return labels[action] ?? action;
}

function pickInstall(): void {
  if (installInput.value) {
    installInput.value.value = "";
    installInput.value.click();
  }
}

function pickUpgrade(symbolicName: string): void {
  upgradeTarget.value = symbolicName;
  if (upgradeInput.value) {
    upgradeInput.value.value = "";
    upgradeInput.value.click();
  }
}

/**
 * 安装并启动单个 jar 文件，选择文件与拖放共用。
 *
 * @param file 插件 jar
 */
async function installFromFile(file: File): Promise<void> {
  busy.value = file.name;
  try {
    const bundle = await installBundle(file, true);
    msgSuccess(`已安装并启动 ${bundle.symbolicName}:${bundle.version}`);
    await reloadAll();
  } catch (error) {
    msgError(errText(error));
  } finally {
    busy.value = "";
  }
}

function onInstallFile(event: Event): void {
  const file = (event.target as HTMLInputElement).files?.[0];
  if (file) {
    void installFromFile(file);
  }
}

/** 拖拽到上传坞直接安装 */
function onDropInstall(event: DragEvent): void {
  const file = event.dataTransfer?.files?.[0];
  if (file) {
    void installFromFile(file);
  }
}

async function onUpgradeFile(event: Event): Promise<void> {
  const file = (event.target as HTMLInputElement).files?.[0];
  const target = upgradeTarget.value;
  if (!file || !target) {
    return;
  }
  try {
    await ElMessageBox.confirm(
      `用 ${file.name} 原地升级 ${target}？升级期间该插件会短暂停止。`,
      "升级插件",
      { type: "warning", confirmButtonText: "升级", cancelButtonText: "取消" },
    );
  } catch {
    return;
  }
  busy.value = target;
  try {
    const bundle = await updateBundle(target, file);
    msgSuccess(`已升级 ${bundle.symbolicName} 到 ${bundle.version}`);
    await reloadAll();
  } catch (error) {
    msgError(errText(error));
  } finally {
    busy.value = "";
    upgradeTarget.value = "";
  }
}

async function toggle(row: OsgiBundle): Promise<void> {
  if (isSystem(row)) {
    return;
  }
  busy.value = row.symbolicName;
  try {
    if (row.state === "ACTIVE") {
      await stopBundle(row.symbolicName);
      msgSuccess(`已停止 ${row.symbolicName}`);
    } else {
      await startBundle(row.symbolicName);
      msgSuccess(`已启动 ${row.symbolicName}`);
    }
    await reloadAll();
  } catch (error) {
    msgError(errText(error));
  } finally {
    busy.value = "";
  }
}

async function remove(row: OsgiBundle): Promise<void> {
  if (isSystem(row)) {
    return;
  }
  try {
    await ElMessageBox.confirm(
      `确认卸载 ${row.symbolicName}？该插件提供的扩展会立即失效，jar 文件仍保留在部署目录。`,
      "卸载插件",
      { type: "warning", confirmButtonText: "卸载", cancelButtonText: "取消" },
    );
  } catch {
    return;
  }
  busy.value = row.symbolicName;
  try {
    await uninstallBundle(row.symbolicName);
    msgSuccess(`已卸载 ${row.symbolicName}`);
    await reloadAll();
  } catch (error) {
    msgError(errText(error));
  } finally {
    busy.value = "";
  }
}

async function download(row: OsgiBundle): Promise<void> {
  try {
    await downloadBundle(row.symbolicName);
  } catch (error) {
    msgError(errText(error));
  }
}

/** 通道条点击：滚动定位到对应条并临时高亮 */
function locate(row: OsgiBundle): void {
  highlightName.value = row.symbolicName;
  window.setTimeout(() => {
    if (highlightName.value === row.symbolicName) {
      highlightName.value = "";
    }
  }, 2400);
  const el = document.getElementById(`osgi-ch-${row.bundleId}`);
  el?.scrollIntoView({ behavior: "smooth", block: "center" });
}

/**
 * 从文件仓跳到对应的运行时通道条。
 *
 * <p>文件与 bundle 的对应关系唯一可靠的键是符号名（文件名可以随便改），
 * 因此先按符号名找 bundle，找不到就只提示，不改视图——静默无反应会让人以为是点了没生效。</p>
 *
 * @param symbolicName bundle 符号名
 */
function locateBySymbolic(symbolicName: string): void {
  const row = rows.value.find(item => item.symbolicName === symbolicName);
  if (!row) {
    msgError(`框架中已找不到 ${symbolicName}，请刷新后再看`);
    return;
  }
  void nextTick(() => {
    locate(row);
  });
}

/**
 * 字节数格式化。
 *
 * @param size 字节数，未知为 -1
 * @return 展示文本
 */
function formatSize(size: number): string {
  if (!Number.isFinite(size) || size < 0) {
    return "大小未知";
  }
  if (size < 1024) {
    return `${size} B`;
  }
  if (size < 1024 * 1024) {
    return `${(size / 1024).toFixed(1)} KB`;
  }
  return `${(size / 1024 / 1024).toFixed(2)} MB`;
}

/**
 * 毫秒时间戳格式化为本地时间。
 *
 * @param ms 毫秒时间戳，未知为 0
 * @return 展示文本
 */
function formatTime(ms: number): string {
  if (!Number.isFinite(ms) || ms <= 0) {
    return "时间未知";
  }
  const date = new Date(ms);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(
    date.getMinutes(),
  )}`;
}

let refreshTimer: number | undefined;

watch(autoRefresh, on => {
  if (refreshTimer !== undefined) {
    window.clearInterval(refreshTimer);
    refreshTimer = undefined;
  }
  if (on) {
    refreshTimer = window.setInterval(() => {
      void reloadAll();
    }, 30_000);
  }
});

onMounted(() => {
  void reloadAll();
  bindLogChannel();
});

onBeforeUnmount(() => {
  if (refreshTimer !== undefined) {
    window.clearInterval(refreshTimer);
    refreshTimer = undefined;
  }
  unsubscribeLog?.();
  unsubscribeLog = undefined;
});
</script>

<template>
  <div class="osgi-page">
    <!-- 页头：页面身份 + 实时通道状态 + 主操作 -->
    <header class="osg-hd">
      <div class="osg-hd__left">
        <div class="osg-kick">OSGi PLUGIN CENTER · LIVE CONSOLE</div>
        <h1 class="osg-title">插件中心 › OSGi 插件 · 调音台</h1>
        <p class="osg-sub">
          每个 bundle 一路通道：状态灯与推子是生命周期电平，跳线盘是已注册服务，磁带机走 Socket 实时日志。
        </p>
      </div>
      <span class="osg-live" :class="{ 'osg-live--off': !logChannelReady }">
        <i class="osg-live__dot"></i>{{ logChannelReady ? "LIVE · osgi / operation-log" : "socket 未接入" }}
      </span>
      <div class="osg-hd__acts">
        <ReButton icon="RefreshRight" :loading="loading" @click="reloadAll">刷新</ReButton>
        <ReButton type="primary" icon="Upload" :disabled="!!busy" @click="pickInstall">上传 jar</ReButton>
      </div>
    </header>

    <!-- 运行芯片：全部来自真实端点 -->
    <div class="osg-chips">
      <span v-for="c in chips" :key="c.label" class="osg-chip" :title="c.label">
        {{ c.label }} <b>{{ c.value }}</b>
      </span>
    </div>

    <!-- 控制带：搜索 + 状态筛选 -->
    <div class="osg-ctrl">
      <el-input
        v-model="searchText"
        class="osg-ctrl__search"
        placeholder="搜索符号名 / ID / 文件名…"
        clearable
        :prefix-icon="Search"
      />
      <div class="osg-ctrl__chips">
        <button
          v-for="f in filters"
          :key="f.key"
          type="button"
          class="osg-chipbtn"
          :class="{ 'osg-chipbtn--on': filterState === f.key }"
          @click="filterState = f.key"
        >
          {{ f.label }}
        </button>
      </div>
    </div>

    <div class="osg-layout">
      <!-- 左列：调音台 + 文件仓 -->
      <section class="osg-col">
        <div class="osg-desk">
          <!-- 主控条 -->
          <div class="osg-master">
            <span class="osg-master__ttl">OSGi LIVE DESK</span>
            <div class="osg-mleds" :key="logPulse">
              <i v-for="i in 10" :key="i" :class="{ on: i <= masterLevel }"></i>
            </div>
            <span class="osg-master__meta">
              {{ framework ? `FW ${framework.symbolicName} · v${framework.version}` : "FW —" }} · 运行
              {{ activeCount }}/{{ rows.length }}
            </span>
          </div>

          <!-- 通道条：每个 bundle 一路 -->
          <div class="osg-strips" :class="{ 'osg-strips--empty': !loading && !rows.length }">
            <template v-for="row in filteredRows" :key="row.bundleId">
              <div
                :id="`osgi-ch-${row.bundleId}`"
                class="osg-ch"
                :class="[`osg-ch--${row.state.toLowerCase()}`, { 'osg-ch--hl': highlightName === row.symbolicName }]"
              >
                <div class="osg-ch__info">
                  <div class="osg-ch__id">
                    CH {{ chNo(row.bundleId) }} · {{ isSystem(row) ? "SYSTEM" : "BUNDLE" }}
                  </div>
                  <div class="osg-ch__name">
                    {{ row.symbolicName }}
                    <span class="osg-ch__ver">v{{ row.version }}</span>
                    <span class="osg-ch__bid">#{{ row.bundleId }}</span>
                  </div>
                  <div class="osg-ch__lad" :title="`状态电平 · ${stateText(row.state)}`">
                    <i v-for="i in 10" :key="i" :class="ladderClass(row.state, i)"></i>
                  </div>
                  <div class="osg-ch__ops">
                    <template v-if="isSystem(row)">
                      <ReTag type="info" effect="plain">系统内置</ReTag>
                      <span class="osg-ch__sysnote">框架本体，无启停 / 升级 / 卸载操作</span>
                    </template>
                    <template v-else>
                      <ReTag
                        :type="stateTagType(row.state)"
                        effect="plain"
                        :style="row.state === 'STOPPING' ? { '--el-tag-text-color': 'var(--el-color-primary-light)' } : undefined"
                      >
                        {{ stateText(row.state) }}
                      </ReTag>
                      <ReButton
                        size="small"
                        :type="row.state === 'ACTIVE' ? 'warning' : 'success'"
                        :disabled="!!busy"
                        @click="toggle(row)"
                      >
                        {{ row.state === "ACTIVE" ? "停止" : "启动" }}
                      </ReButton>
                      <ReButton size="small" :disabled="!!busy" @click="pickUpgrade(row.symbolicName)">升级</ReButton>
                      <ReButton size="small" :disabled="!!busy" @click="download(row)">下载</ReButton>
                      <ReButton size="small" type="danger" :disabled="!!busy" @click="remove(row)">卸载</ReButton>
                    </template>
                  </div>
                </div>
                <div class="osg-ch__fader">
                  <div class="osg-fader">
                    <span class="osg-fader__slot"></span>
                    <span class="osg-fader__thumb" :style="{ bottom: `calc(10px + (100% - 20px) * ${stateLevel(row.state) / 10})` }"></span>
                  </div>
                  <span class="osg-fader__val">电平 <b>{{ stateLevel(row.state) }}</b>/10</span>
                </div>
              </div>
            </template>

            <div v-if="!loading && !filteredRows.length" class="osg-empty">
              <p v-if="rows.length">没有符合当前搜索 / 筛选条件的 bundle</p>
              <div v-else>
                <p>暂无已安装 bundle</p>
                <p class="osg-empty__hint">
                  从下方上传 jar 即可安装；端点需开启 <code>plugin.osgi.endpoint.enabled=true</code>
                </p>
              </div>
            </div>
          </div>

          <!-- 下半区：跳线盘（服务）+ 磁带机（socket 日志） -->
          <div class="osg-lower">
            <div class="osg-patch">
              <div class="osg-panel__h">PATCH BAY · 服务跳线 <span class="osg-panel__n">{{ services.length }} 路</span></div>
              <div v-if="services.length" class="osg-jacks">
                <div v-for="svc in services" :key="svc.osgiServiceId" class="osg-jack" title="已注册服务">
                  <span class="osg-jack__hole"></span>
                  <span class="osg-jack__nm">{{ svc.type }}</span>
                  <span class="osg-jack__pid">{{ svc.pid }}</span>
                </div>
              </div>
              <p v-else class="osg-patch__empty">当前无已注册服务，启动 bundle 后自动点亮</p>
            </div>
            <div class="osg-tape">
              <div class="osg-reel" :class="{ spinning: logPulse > 0 }" :key="`ra-${logPulse}`"></div>
              <div class="osg-tapeline" :key="`t-${logPulse}`">
                <span v-for="(item, index) in tapeTicks" :key="`${item.startedAt}-${index}`" class="osg-tick">
                  ● {{ actionText(item.action) }} · {{ item.symbolicName || "—" }} · {{ logTime(item.startedAt) }}
                </span>
                <span v-if="!tapeTicks.length" class="osg-tick osg-tick--idle">等待操作…</span>
              </div>
              <div class="osg-reel" :class="{ spinning: logPulse > 0 }" :key="`rb-${logPulse}`"></div>
            </div>
          </div>
        </div>

        <!-- 文件仓：部署目录 jar 清单 + 上传坞 -->
        <section class="osg-tray">
          <div class="osg-tray__head">
            <span class="osg-panel__h">部署目录 · 文件仓 <span class="osg-panel__n">{{ jars.length }} 个 jar</span></span>
            <div class="osg-seg">
              <button
                type="button"
                class="osg-seg__btn"
                :class="{ 'osg-seg__btn--on': trayFilter === 'all' }"
                @click="trayFilter = 'all'"
              >
                全部
              </button>
              <button
                type="button"
                class="osg-seg__btn"
                :class="{ 'osg-seg__btn--on': trayFilter === 'installed' }"
                @click="trayFilter = 'installed'"
              >
                在框架中
              </button>
              <button
                type="button"
                class="osg-seg__btn"
                :class="{ 'osg-seg__btn--on': trayFilter === 'only' }"
                @click="trayFilter = 'only'"
              >
                仅文件
              </button>
            </div>
          </div>

          <div class="osg-tray__body" :class="{ 'osg-tray__body--empty': !jarLoading && !filteredJars.length }">
            <div v-for="jar in filteredJars" :key="jar.fileName" class="osg-jar" :class="jar.installed ? 'osg-jar--on' : 'osg-jar--off'">
              <span class="osg-jar__bar"></span>
              <div class="osg-jar__body">
                <div class="osg-jar__name">
                  {{ jar.fileName }}
                  <span class="osg-jar__size">{{ formatSize(jar.size) }}</span>
                </div>
                <div class="osg-jar__meta">
                  <span v-if="jar.installed">框架中 · {{ jar.symbolicName }} · {{ stateText(jar.state ?? "") }}</span>
                  <span v-else>仅文件 · 未安装</span>
                  <span class="osg-jar__time">{{ formatTime(jar.lastModified) }}</span>
                </div>
              </div>
              <ReTag :type="jar.installed ? 'success' : 'info'" effect="plain">
                {{ jar.installed ? "在框架中" : "仅文件" }}
              </ReTag>
              <div class="osg-jar__ops">
                <ReButton
                  v-if="jar.installed"
                  size="small"
                  :disabled="!!jarBusy"
                  @click="locateBySymbolic(jar.symbolicName ?? '')"
                >
                  查看插件
                </ReButton>
                <ReButton
                  size="small"
                  type="danger"
                  :disabled="jar.installed || !!jarBusy"
                  :loading="jarBusy === jar.fileName"
                  :title="jar.installed ? '仍在框架中，请先在通道条上卸载' : ''"
                  @click="removeJar(jar)"
                >
                  删除文件
                </ReButton>
              </div>
            </div>

            <div v-if="!jarLoading && !filteredJars.length" class="osg-empty">
              <p v-if="jars.length">没有符合当前搜索 / 筛选条件的文件</p>
              <div v-else>
                <p>部署目录暂无 jar 文件</p>
                <p class="osg-empty__hint">上传安装后会在这里显示，卸载后可在此删除文件</p>
              </div>
            </div>
          </div>

          <div class="osg-dock" @click="pickInstall" @dragover.prevent @drop.prevent="onDropInstall">
            <span class="osg-dock__plus">+</span>
            <span>拖入 .jar 即刻安装 <small>· 同符号名上传 = 原地升级 · 点击选择文件</small></span>
          </div>
        </section>
      </section>

      <!-- 右轨：socket 载荷 + 实时日志 -->
      <aside class="osg-rail">
        <div class="osg-panel">
          <div class="osg-panel__h">SOCKET · operation-log</div>
          <p class="osg-panel__sub">
            载荷形状 <code>{ module, event, data, dataId, timestamp }</code>，通道
            <code>osgi / operation-log</code>
          </p>
          <p v-if="lastFrame" class="osg-frame">
            <code>{ module: "{{ lastFrame.module }}", event: "{{ lastFrame.event }}", dataId: "{{ lastFrame.dataId }}", ts: "{{ lastFrame.timestamp }}" }</code>
          </p>
          <p v-else class="osg-panel__sub">等待首帧…</p>
        </div>

        <section class="osg-log" :class="{ 'osg-log--closed': !logOpen }">
          <header class="osg-log__head" @click="logOpen = !logOpen">
            <span class="osg-log__caret">{{ logOpen ? "▾" : "▸" }}</span>
            <span class="osg-log__title">实时操作日志</span>
            <span class="osg-log__chan" :class="{ 'osg-log__chan--off': !logChannelReady }">
              {{ logChannelReady ? "socket · osgi / operation-log" : "socket 未接入" }}
            </span>
            <span v-if="problemCount" class="osg-log__badge">{{ problemCount }} 异常</span>
            <span class="osg-log__count">{{ logs.length }} 条</span>
            <div class="osg-log__spacer"></div>
            <button
              type="button"
              class="osg-log__act"
              :class="{ 'osg-log__act--on': logOnlyProblem }"
              @click.stop="logOnlyProblem = !logOnlyProblem"
            >
              仅异常
            </button>
            <button type="button" class="osg-log__act" @click.stop="clearLogs">清空</button>
          </header>

          <div v-show="logOpen" ref="logBox" class="osg-log__body">
            <p v-if="!visibleLogs.length" class="osg-log__empty">
              {{ logs.length ? "当前没有异常日志" : "等待操作…安装 / 卸载 / 启停 / 升级 的每一步都会实时出现在这里" }}
            </p>
            <div
              v-for="(item, index) in visibleLogs"
              :key="`${item.startedAt}-${index}`"
              class="osg-log__row"
              :class="`osg-log__row--${item.level.toLowerCase()}`"
            >
              <span class="osg-log__time">{{ logTime(item.startedAt) }}</span>
              <span class="osg-log__stage" :class="`osg-log__stage--${item.status}`">
                {{ item.status === "start" ? "开始" : item.status === "failure" ? "失败" : "完成" }}
              </span>
              <span class="osg-log__action">{{ actionText(item.action) }}</span>
              <span class="osg-log__symbol">{{ item.symbolicName || "—" }}</span>
              <span class="osg-log__msg">{{ item.message || "—" }}</span>
              <span v-if="item.duration > 0" class="osg-log__dur">{{ item.duration }}ms</span>
            </div>
          </div>
        </section>
      </aside>
    </div>

    <!-- 底部信息带 -->
    <div class="osg-foot">
      <span class="osg-foot__dot"></span>
      <span>共 {{ rows.length }} 个 bundle · {{ activeCount }} 个运行中 · 服务 {{ services.length }} 路 · jar {{ jars.length }} 个</span>
      <div class="osg-foot__auto">
        <span>每 30s 自动刷新</span>
        <el-switch v-model="autoRefresh" size="small" />
      </div>
    </div>

    <input ref="installInput" type="file" accept=".jar" class="osgi-page__file" @change="onInstallFile" />
    <input ref="upgradeInput" type="file" accept=".jar" class="osgi-page__file" @change="onUpgradeFile" />
  </div>
</template>

<style scoped>
.osgi-page {
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 16px;
}

/* ============ 页头 ============ */
.osg-hd {
  display: flex;
  align-items: flex-end;
  gap: 16px;
  flex-wrap: wrap;
}

.osg-hd__left {
  flex: 1;
  min-width: 260px;
}

.osg-kick {
  font-family: var(--el-font-family-mono);
  font-size: 10px;
  letter-spacing: 0.28em;
  color: var(--el-color-primary);
  text-transform: uppercase;
}

.osg-title {
  margin: 2px 0 2px;
  font-size: 20px;
  font-weight: 700;
  color: var(--el-text-color-primary);
}

.osg-sub {
  font-size: 12px;
  color: var(--el-text-color-secondary);
}

.osg-live {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 3px 10px;
  border: 1px solid var(--el-color-success);
  border-radius: 9999px;
  font-family: var(--el-font-family-mono);
  font-size: 10px;
  color: var(--el-color-success);
}

.osg-live--off {
  border-color: var(--el-color-warning);
  color: var(--el-color-warning);
}

.osg-live__dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: currentColor;
  animation: osg-blink 1.6s infinite;
}

@keyframes osg-blink {
  50% {
    opacity: 0.25;
  }
}

.osg-hd__acts {
  display: flex;
  gap: 8px;
}

/* ============ 运行芯片 ============ */
.osg-chips {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.osg-chip {
  padding: 3px 10px;
  border: 1px solid var(--el-border-color);
  border-radius: 9999px;
  background: var(--el-bg-color);
  font-family: var(--el-font-family-mono);
  font-size: 10px;
  color: var(--el-text-color-regular);
}

.osg-chip b {
  color: var(--el-color-primary);
  font-weight: 700;
}

/* ============ 控制带 ============ */
.osg-ctrl {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
}

.osg-ctrl__search {
  width: 260px;
}

.osg-ctrl__chips {
  margin-left: auto;
  display: flex;
  gap: 4px;
  flex-wrap: wrap;
}

.osg-chipbtn {
  height: 28px;
  padding: 0 12px;
  border: 1px solid var(--el-border-color);
  border-radius: 14px;
  background: var(--el-bg-color);
  color: var(--el-text-color-secondary);
  font-size: 12px;
  cursor: pointer;
  transition: color 0.15s, border-color 0.15s, background 0.15s;
}

.osg-chipbtn:hover {
  border-color: var(--el-color-primary);
  color: var(--el-color-primary);
}

.osg-chipbtn--on {
  border-color: var(--el-color-primary);
  background: var(--el-color-primary);
  color: var(--el-button-text-color);
  font-weight: 500;
}

/* ============ 布局 ============ */
.osg-layout {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 320px;
  gap: 14px;
  align-items: start;
}

.osg-col {
  display: flex;
  flex-direction: column;
  gap: 14px;
  min-width: 0;
}

.osg-rail {
  display: flex;
  flex-direction: column;
  gap: 12px;
  position: sticky;
  top: 16px;
}

@media (max-width: 1180px) {
  .osg-layout {
    grid-template-columns: minmax(0, 1fr);
  }

  .osg-rail {
    position: static;
  }
}

/* ============ 调音台 ============ */
.osg-desk {
  border-radius: var(--el-radius-xl);
  border: 1px solid var(--el-border-color);
  overflow: hidden;
  background: linear-gradient(180deg, var(--el-fill-color-lighter), var(--el-bg-color));
  box-shadow: 0 18px 40px -30px rgba(0, 0, 0, 0.5);
}

.osg-master {
  display: flex;
  align-items: center;
  gap: 16px;
  flex-wrap: wrap;
  padding: 12px 16px;
  border-bottom: 1px solid var(--el-border-color);
  background: color-mix(in srgb, var(--el-color-primary) 7%, transparent);
}

.osg-master__ttl {
  font-family: var(--el-font-family-mono);
  font-size: 11px;
  letter-spacing: 0.22em;
  font-weight: 700;
  color: var(--el-color-primary);
}

.osg-mleds {
  display: flex;
  gap: 3px;
}

.osg-mleds i {
  width: 7px;
  height: 12px;
  border-radius: 2px;
  background: var(--el-fill-color);
}

.osg-mleds i.on {
  background: var(--el-color-success);
  animation: osg-fw-pulse 1.2s ease-out;
}

@keyframes osg-fw-pulse {
  0% {
    box-shadow: 0 0 8px var(--el-color-success);
  }
  100% {
    box-shadow: 0 0 0 var(--el-color-success);
  }
}

.osg-master__meta {
  margin-left: auto;
  font-family: var(--el-font-family-mono);
  font-size: 10px;
  color: var(--el-text-color-secondary);
}

/* ============ 通道条 ============ */
.osg-strips {
  display: flex;
  flex-wrap: wrap;
}

.osg-strips--empty {
  min-height: 64px;
}

.osg-ch {
  --ch-color: var(--el-text-color-placeholder);
  flex: 1 1 320px;
  display: flex;
  gap: 14px;
  padding: 14px 16px 16px;
  border-right: 1px solid var(--el-border-color);
  border-bottom: 1px solid var(--el-border-color);
  transition: box-shadow 0.15s, background 0.15s;
}

.osg-ch:hover {
  background: var(--el-fill-color-lighter);
}

.osg-ch--hl {
  box-shadow: inset 0 0 0 2px var(--el-color-primary);
}

.osg-ch--active {
  --ch-color: var(--el-color-success);
}

.osg-ch--resolved {
  --ch-color: var(--el-color-primary);
}

.osg-ch--installed {
  --ch-color: var(--el-color-info);
}

.osg-ch--starting {
  --ch-color: var(--el-color-warning);
}

.osg-ch--stopping {
  --ch-color: var(--el-color-primary-light);
}

.osg-ch--uninstalled {
  --ch-color: var(--el-color-danger);
}

.osg-ch__info {
  min-width: 0;
  flex: 1;
}

.osg-ch__id {
  font-family: var(--el-font-family-mono);
  font-size: 10px;
  color: var(--el-text-color-secondary);
}

.osg-ch__name {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 2px;
  font-size: 15px;
  font-weight: 700;
  color: var(--el-text-color-primary);
}

.osg-ch__ver {
  flex: none;
  padding: 1px 6px;
  border: 1px solid var(--el-border-color-lighter);
  border-radius: var(--el-radius-xs);
  background: var(--el-fill-color-light);
  font-family: var(--el-font-family-mono);
  font-size: 10px;
  font-weight: 400;
  color: var(--el-text-color-secondary);
}

.osg-ch__bid {
  flex: none;
  font-family: var(--el-font-family-mono);
  font-size: 10px;
  font-weight: 400;
  color: var(--el-text-color-placeholder);
}

.osg-ch__lad {
  display: flex;
  flex-direction: column-reverse;
  gap: 2px;
  margin-top: 10px;
}

.osg-ch__lad i {
  width: 26px;
  height: 6px;
  border-radius: 2px;
  background: var(--el-fill-color);
  transition: background 0.2s;
}

.osg-ch__lad i.on {
  background: var(--ch-color);
}

.osg-ch__lad i.hot {
  background: var(--el-color-warning);
}

.osg-ch__lad i.max {
  background: var(--el-color-danger);
}

.osg-ch__ops {
  display: flex;
  align-items: center;
  gap: 6px;
  flex-wrap: wrap;
  margin-top: 12px;
}

.osg-ch__sysnote {
  font-size: 11px;
  color: var(--el-text-color-placeholder);
}

.osg-ch__fader {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  flex: none;
}

.osg-fader {
  position: relative;
  width: 34px;
  height: 150px;
  border-radius: var(--el-radius-sm);
  border: 1px solid var(--el-border-color);
  background: var(--el-fill-color);
}

.osg-fader__slot {
  position: absolute;
  left: 50%;
  top: 10px;
  bottom: 10px;
  width: 4px;
  transform: translateX(-50%);
  border-radius: 2px;
  background: var(--el-border-color);
}

.osg-fader__thumb {
  position: absolute;
  left: 50%;
  transform: translate(-50%, 50%);
  width: 30px;
  height: 16px;
  border-radius: var(--el-radius-xs);
  background: linear-gradient(180deg, var(--el-color-primary-light), var(--el-color-primary));
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.35);
}

.osg-fader__val {
  font-family: var(--el-font-family-mono);
  font-size: 9px;
  color: var(--el-text-color-secondary);
}

.osg-fader__val b {
  color: var(--el-color-primary);
}

/* ============ 空态 ============ */
.osg-empty {
  flex: 1 1 100%;
  padding: 28px 16px;
  text-align: center;
  font-size: 13px;
  color: var(--el-text-color-secondary);
}

.osg-empty p {
  margin: 4px 0;
}

.osg-empty__hint {
  font-size: 12px;
  color: var(--el-text-color-placeholder);
}

.osg-empty__hint code {
  padding: 0 4px;
  border-radius: var(--el-radius-sm);
  background: var(--el-fill-color-light);
}

/* ============ 下半区：跳线盘 + 磁带机 ============ */
.osg-lower {
  display: grid;
  grid-template-columns: 1.2fr 1fr;
}

.osg-patch {
  padding: 14px 16px;
  border-right: 1px solid var(--el-border-color);
}

.osg-panel__h {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.08em;
  color: var(--el-text-color-secondary);
}

.osg-panel__h::before {
  content: "";
  width: 8px;
  height: 8px;
  border-radius: 2px;
  background: var(--el-color-primary);
}

.osg-panel__n {
  font-family: var(--el-font-family-mono);
  font-size: 10px;
  font-weight: 400;
  color: var(--el-text-color-placeholder);
}

.osg-jacks {
  display: flex;
  flex-wrap: wrap;
  gap: 14px;
  margin-top: 10px;
}

.osg-jack {
  width: 84px;
  text-align: center;
}

.osg-jack__hole {
  display: block;
  width: 22px;
  height: 22px;
  margin: 0 auto 5px;
  border: 2px solid var(--el-color-primary);
  border-radius: 50%;
  background: var(--el-fill-color);
  box-shadow: 0 0 10px color-mix(in srgb, var(--el-color-primary) 50%, transparent);
}

.osg-jack__nm {
  display: block;
  font-family: var(--el-font-family-mono);
  font-size: 9px;
  color: var(--el-text-color-regular);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.osg-jack__pid {
  display: block;
  font-family: var(--el-font-family-mono);
  font-size: 8px;
  color: var(--el-text-color-placeholder);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.osg-patch__empty {
  margin: 10px 0 0;
  font-size: 12px;
  color: var(--el-text-color-placeholder);
}

.osg-tape {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 14px 16px;
}

.osg-reel {
  width: 44px;
  height: 44px;
  flex: none;
  border-radius: 50%;
  border: 3px solid var(--el-border-color);
  position: relative;
}

.osg-reel::before {
  content: "";
  position: absolute;
  inset: 12px;
  border-radius: 50%;
  border: 2px dashed var(--el-text-color-secondary);
}

.osg-reel.spinning {
  animation: osg-spin 3.6s linear infinite;
}

@keyframes osg-spin {
  to {
    transform: rotate(360deg);
  }
}

.osg-tapeline {
  flex: 1;
  min-width: 0;
  height: 52px;
  padding: 5px;
  border: 1px solid var(--el-border-color);
  border-radius: var(--el-radius-sm);
  background: var(--el-fill-color-lighter);
  overflow: hidden;
  display: flex;
  flex-direction: column-reverse;
  gap: 2px;
}

.osg-tick {
  font-family: var(--el-font-family-mono);
  font-size: 9px;
  color: var(--el-text-color-secondary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.osg-tick--idle {
  color: var(--el-text-color-placeholder);
}

/* ============ 文件仓 ============ */
.osg-tray {
  background: var(--el-bg-color);
  border: 1px solid var(--el-border-color);
  border-radius: var(--el-radius-lg);
  padding: 12px 14px;
}

.osg-tray__head {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
  margin-bottom: 8px;
}

.osg-tray__head .osg-panel__h {
  margin: 0;
}

.osg-tray__body {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.osg-tray__body--empty {
  min-height: 48px;
}

.osg-jar {
  position: relative;
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 12px;
  border: 1px solid var(--el-border-color-light);
  border-radius: var(--el-radius-md);
  transition: border-color 0.15s, box-shadow 0.15s;
}

.osg-jar:hover {
  border-color: var(--el-color-primary-light-5);
  box-shadow: var(--el-box-shadow-light);
}

.osg-jar__bar {
  align-self: stretch;
  width: 3px;
  flex: none;
  margin: 2px 0;
  border-radius: 2px;
  background: var(--el-text-color-placeholder);
}

.osg-jar--on .osg-jar__bar {
  background: var(--el-color-success);
}

.osg-jar__body {
  min-width: 0;
  flex: 1;
}

.osg-jar__name {
  display: flex;
  align-items: center;
  gap: 8px;
  font-family: var(--el-font-family-mono);
  font-size: 13px;
  font-weight: 600;
  color: var(--el-text-color-primary);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.osg-jar__size {
  flex: none;
  padding: 1px 6px;
  border: 1px solid var(--el-border-color-lighter);
  border-radius: var(--el-radius-xs);
  background: var(--el-fill-color-light);
  font-size: 11px;
  font-weight: 400;
  color: var(--el-text-color-secondary);
}

.osg-jar__meta {
  display: flex;
  gap: 10px;
  margin-top: 2px;
  font-size: 11px;
  color: var(--el-text-color-placeholder);
}

.osg-jar__time {
  font-family: var(--el-font-family-mono);
}

.osg-jar__ops {
  display: flex;
  gap: 4px;
  flex: none;
}

/* ============ 上传坞 ============ */
.osg-dock {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  min-height: 56px;
  margin-top: 10px;
  border: 1.5px dashed var(--el-border-color);
  border-radius: var(--el-radius-lg);
  font-size: 13px;
  color: var(--el-text-color-secondary);
  cursor: pointer;
  transition: border-color 0.15s, color 0.15s, background 0.15s;
}

.osg-dock:hover {
  border-color: var(--el-color-primary);
  background: var(--el-color-primary-light-9);
  color: var(--el-color-primary);
}

.osg-dock__plus {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 20px;
  height: 20px;
  flex: none;
  border-radius: var(--el-radius-sm);
  background: var(--el-color-primary-light-9);
  color: var(--el-color-primary);
  font-size: 15px;
  line-height: 1;
}

.osg-dock:hover .osg-dock__plus {
  background: var(--el-color-primary);
  color: var(--el-button-text-color);
}

.osg-dock small {
  font-size: 11px;
  color: var(--el-text-color-placeholder);
}

.osg-dock:hover small {
  color: var(--el-color-primary);
}

/* ============ 右轨面板 ============ */
.osg-panel {
  background: var(--el-bg-color);
  border: 1px solid var(--el-border-color);
  border-radius: var(--el-radius-lg);
  padding: 12px 14px;
}

.osg-panel__sub {
  margin: 8px 0 0;
  font-size: 11px;
  color: var(--el-text-color-secondary);
}

.osg-panel__sub code,
.osg-frame code {
  padding: 0 4px;
  border-radius: var(--el-radius-sm);
  background: var(--el-fill-color-light);
  font-family: var(--el-font-family-mono);
  font-size: 10px;
}

.osg-frame {
  margin: 8px 0 0;
  padding: 8px;
  border: 1px solid var(--el-border-color-lighter);
  border-radius: var(--el-radius-sm);
  background: var(--el-fill-color-lighter);
}

.osg-frame code {
  padding: 0;
  background: none;
  font-size: 10px;
  color: var(--el-color-primary);
  word-break: break-all;
}

/* ============ 实时日志 ============ */
.osg-log {
  background: var(--el-bg-color);
  border: 1px solid var(--el-border-color);
  border-radius: var(--el-radius-lg);
  overflow: hidden;
}

.osg-log__head {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 14px;
  border-bottom: 1px solid var(--el-border-color-lighter);
  cursor: pointer;
  user-select: none;
}

.osg-log--closed .osg-log__head {
  border-bottom: 0;
}

.osg-log__caret {
  width: 10px;
  font-size: 10px;
  color: var(--el-text-color-placeholder);
}

.osg-log__title {
  font-size: 13px;
  font-weight: 600;
  color: var(--el-text-color-primary);
}

.osg-log__chan {
  font-family: var(--el-font-family-mono);
  font-size: 11px;
  color: var(--el-color-success);
}

.osg-log__chan--off {
  color: var(--el-color-warning);
}

.osg-log__badge {
  padding: 1px 6px;
  border-radius: 8px;
  background: var(--el-color-danger-light-9);
  color: var(--el-color-danger);
  font-size: 11px;
}

.osg-log__count {
  font-size: 11px;
  color: var(--el-text-color-placeholder);
}

.osg-log__spacer {
  flex: 1;
}

.osg-log__act {
  height: 22px;
  padding: 0 8px;
  border: 1px solid var(--el-border-color);
  border-radius: 11px;
  background: transparent;
  color: var(--el-text-color-secondary);
  font-size: 11px;
  cursor: pointer;
}

.osg-log__act:hover,
.osg-log__act--on {
  border-color: var(--el-color-primary);
  color: var(--el-color-primary);
}

.osg-log__body {
  max-height: 240px;
  overflow-y: auto;
  padding: 6px 0;
  font-family: var(--el-font-family-mono);
  font-size: 12px;
}

.osg-log__empty {
  margin: 10px 14px;
  font-family: var(--el-font-family);
  font-size: 12px;
  color: var(--el-text-color-placeholder);
}

.osg-log__row {
  display: flex;
  align-items: baseline;
  gap: 10px;
  padding: 3px 14px;
  line-height: 1.5;
}

.osg-log__row:hover {
  background: var(--el-fill-color-light);
}

.osg-log__row--error {
  background: var(--el-color-danger-light-9);
}

.osg-log__row--warn {
  background: var(--el-color-warning-light-9);
}

.osg-log__time {
  flex: none;
  color: var(--el-text-color-placeholder);
}

.osg-log__stage {
  flex: none;
  width: 30px;
  font-family: var(--el-font-family);
  font-size: 11px;
  color: var(--el-text-color-secondary);
}

.osg-log__stage--start {
  color: var(--el-color-info);
}

.osg-log__stage--success {
  color: var(--el-color-success);
}

.osg-log__stage--failure {
  color: var(--el-color-danger);
}

.osg-log__action {
  flex: none;
  min-width: 48px;
  color: var(--el-text-color-primary);
}

.osg-log__symbol {
  flex: none;
  max-width: 180px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  color: var(--el-color-primary);
}

.osg-log__msg {
  flex: 1;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  color: var(--el-text-color-regular);
}

.osg-log__dur {
  flex: none;
  color: var(--el-text-color-placeholder);
}

/* ============ 底部信息带 ============ */
.osg-foot {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 2px 4px;
  font-size: 12px;
  color: var(--el-text-color-secondary);
}

.osg-foot__dot {
  width: 5px;
  height: 5px;
  border-radius: 50%;
  background: var(--el-color-primary);
}

.osg-foot__auto {
  margin-left: auto;
  display: flex;
  align-items: center;
  gap: 6px;
}

/* ============ 文件仓分段 ============ */
.osg-seg {
  display: inline-flex;
  padding: 2px;
  border: 1px solid var(--el-border-color);
  border-radius: 16px;
  background: var(--el-fill-color-light);
  margin-left: auto;
}

.osg-seg__btn {
  height: 24px;
  padding: 0 10px;
  border: 0;
  border-radius: 14px;
  background: transparent;
  color: var(--el-text-color-secondary);
  font-size: 12px;
  cursor: pointer;
  transition: color 0.15s, background 0.15s;
}

.osg-seg__btn:hover {
  color: var(--el-color-primary);
}

.osg-seg__btn--on {
  background: var(--el-bg-color);
  color: var(--el-color-primary);
  font-weight: 600;
  box-shadow: var(--el-box-shadow-lighter);
}

.osgi-page__file {
  display: none;
}

@media (prefers-reduced-motion: reduce) {
  .osg-live__dot,
  .osg-mleds i.on,
  .osg-reel.spinning {
    animation: none !important;
  }
}
</style>
