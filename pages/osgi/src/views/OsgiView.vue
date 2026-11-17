<!--
  OSGi 插件管理 —— 机柜版式（Rack Cabinet）。

  设计语言：把 OSGi 运行时当作一台上电工作的标准机柜——
  - 每个 bundle 是一块插在柜里的 1U 模块：面板左侧是电源/状态灯，中间是丝印
    名称与版本，右侧是生命周期电平灯条；模块上的按钮就是启停 / 升级 /
    下载 / 卸载，系统模块（bundleId=0）是柜子的电源模块，只展示不操作；
  - 右侧竖立 PATCH 面板 = 服务注册表，每个已注册服务点亮一个插座；
  - 柜子底部的磁带机 = Socket 实时操作日志，后端每次写操作广播
    开始 / 成功 / 失败三帧，磁带随新帧滚动；
  - 机柜下方的拉出式抽屉 = 部署目录 jar 文件仓，三态筛选，卸载后可在此删文件。

  本页没有传统页头：页面身份是刻在机柜顶梁上的铭牌，操作内嵌在控制单元里。

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
/** 文件仓抽屉是否拉出 */
const drawerOpen = ref(false);

/** 框架统计（控制面板丝印） */
const stats = ref<OsgiStats | null>(null);
/** 容器侧桥接快照（控制面板丝印） */
const snapshot = ref<OsgiSnapshot | null>(null);
/** 服务注册表（PATCH 面板） */
const services = ref<OsgiService[]>([]);

/** 搜索关键字（符号名 / ID / 文件名 模糊匹配，纯前端展示过滤） */
const searchText = ref("");
/** 状态筛选键：all / ACTIVE / RESOLVED / transition / stopped */
const filterState = ref("all");
/** 模块点击定位后临时高亮的行符号名 */
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
/** 最近一帧 socket 原始载荷，用于展示载荷形状 */
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
 * 顶部丝印：全部来自真实端点，取不到就显示 —，不用前端兜底编造。
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

/** 搜索 + 状态筛选后的模块清单 */
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
 * 状态 → 电平（0–10），LED 电平灯条与数字读数共用这一口径。
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
 * LED 电平灯条分段样式：底部起点亮，高段用警示色。
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
 * 模块槽位号：两位补零，与 bundleId 一一对应（1U 起算）。
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
 * <p>三块都是只读观测数据，任一失败只影响对应丝印与跳线盘，
 * 不牵连模块墙（bundle 清单）的展示。</p>
 */
async function loadMetrics(): Promise<void> {
  try {
    stats.value = (await listStats()) ?? null;
  } catch {
    // 统计取不到时丝印显示 —，模块墙不受影响
  }
  try {
    snapshot.value = (await getSnapshot()) ?? null;
  } catch {
    // 快照取不到时丝印显示 —，模块墙不受影响
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

/** 模块点击：滚动定位到对应模块并临时高亮 */
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
 * 从文件仓跳到对应的运行时模块。
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
    <!-- 机柜主体：无页头，页面身份是顶梁铭牌 -->
    <section class="rk osg-hd" :class="{ 'rk--booting': loading && !rows.length }">
      <!-- 顶梁：铭牌 + 电源指示 + 主操作（全部内嵌在柜体上） -->
      <div class="rk-top">
        <div class="rk-plate">
          <span class="rk-plate__screw tl"></span><span class="rk-plate__screw tr"></span>
          <span class="rk-plate__brand">OSGi PLUGIN RACK</span>
          <span class="rk-plate__model">RACK UNIT · 19" · MODULAR</span>
          <span class="rk-live osg-live" :class="{ 'rk-live--off': !logChannelReady }">
            <i class="rk-live__dot"></i>{{ logChannelReady ? "LIVE · POWER · LINK OK" : "SOCKET 未接入" }}
          </span>
          <span class="rk-plate__screw bl"></span><span class="rk-plate__screw br"></span>
        </div>
        <div class="rk-top__acts osg-hd__acts">
          <ReButton icon="RefreshRight" :loading="loading" @click="reloadAll">刷新</ReButton>
          <ReButton type="primary" icon="Upload" :disabled="!!busy" @click="pickInstall">上传 jar</ReButton>
        </div>
      </div>

      <!-- 控制单元：主电平表 + 搜索 + 状态筛选 + 框架丝印 -->
      <div class="rk-ctrl">
        <div class="rk-ctrl__row">
          <span class="rk-ctrl__ttl">MASTER</span>
          <div class="rk-mleds" :key="logPulse">
            <i v-for="i in 10" :key="i" :class="{ on: i <= masterLevel }"></i>
          </div>
          <span class="rk-ctrl__meta">
            {{ framework ? `FW ${framework.symbolicName} · v${framework.version}` : "FW —" }} · 运行
            {{ activeCount }}/{{ rows.length }}
          </span>
          <div class="rk-ctrl__search osg-ctrl__search">
            <el-input
              v-model="searchText"
              placeholder="搜索符号名 / ID / 文件名…"
              clearable
              :prefix-icon="Search"
            />
          </div>
          <div class="rk-seg">
            <button
              v-for="f in filters"
              :key="f.key"
              type="button"
              class="rk-seg__btn osg-chipbtn"
              :class="{ 'rk-seg__btn--on': filterState === f.key }"
              @click="filterState = f.key"
            >
              {{ f.label }}
            </button>
          </div>
        </div>
        <div class="rk-silk osg-chips">
          <span v-for="c in chips" :key="c.label" class="rk-silk__item osg-chip" :title="c.label">
            {{ c.label }} <b>{{ c.value }}</b>
          </span>
        </div>
      </div>

      <!-- 柜体：左立柱 + 模块墙 + PATCH 面板 + 右立柱 -->
      <div class="rk-body">
        <div class="rk-rail rk-rail--l" aria-hidden="true">
          <i v-for="i in 14" :key="i"></i>
        </div>

        <div class="rk-bay" :class="{ 'rk-bay--empty': !loading && !rows.length }">
          <template v-for="row in filteredRows" :key="row.bundleId">
            <div
              :id="`osgi-ch-${row.bundleId}`"
              class="mod osg-ch"
              :class="[`mod--${row.state.toLowerCase()}`, { 'mod--hl': highlightName === row.symbolicName }]"
            >
              <!-- 模块前面板：左 = 状态灯区，中 = 丝印，右 = 电平灯条 -->
              <div class="mod__lamp">
                <i class="mod__pwr"></i>
                <span class="mod__slot">U{{ chNo(row.bundleId) }}</span>
              </div>

              <div class="mod__face">
                <div class="mod__name">
                  {{ row.symbolicName }}
                  <span class="mod__ver">v{{ row.version }}</span>
                  <span class="mod__bid">#{{ row.bundleId }}</span>
                </div>
                <div class="mod__ops">
                  <template v-if="isSystem(row)">
                    <ReTag type="info" effect="plain">系统内置</ReTag>
                    <span class="mod__sysnote">框架电源模块，无启停 / 升级 / 卸载操作</span>
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

              <div class="mod__meter osg-ch__lad" :title="`状态电平 · ${stateText(row.state)}`">
                <div class="mod__ladder">
                  <i v-for="i in 10" :key="i" :class="ladderClass(row.state, i)"></i>
                </div>
                <span class="mod__level osg-fader__val">LVL <b>{{ stateLevel(row.state) }}</b>/10</span>
              </div>
            </div>
          </template>

          <div v-if="!loading && !filteredRows.length" class="rk-empty osg-empty">
            <p v-if="rows.length">没有符合当前搜索 / 筛选条件的 bundle</p>
            <div v-else>
              <p>机柜内暂无已安装模块</p>
              <p class="rk-empty__hint">
                从下方文件仓上传 jar 即可插入；端点需开启 <code>plugin.osgi.endpoint.enabled=true</code>
              </p>
            </div>
          </div>
        </div>

        <!-- PATCH 面板：服务注册表，竖排在柜体右侧 -->
        <aside class="rk-patch osg-panel">
          <div class="rk-patch__h">PATCH<span>服务跳线 · {{ services.length }} 路</span></div>
          <div v-if="services.length" class="rk-jacks osg-jacks">
            <div v-for="svc in services" :key="svc.osgiServiceId" class="rk-jack osg-jack" title="已注册服务">
              <span class="rk-jack__hole"></span>
              <span class="rk-jack__nm">{{ svc.type }}</span>
              <span class="rk-jack__pid">{{ svc.pid }}</span>
            </div>
          </div>
          <p v-else class="rk-patch__empty">当前无已注册服务，启动 bundle 后自动点亮</p>
        </aside>

        <div class="rk-rail rk-rail--r" aria-hidden="true">
          <i v-for="i in 14" :key="i"></i>
        </div>
      </div>

      <!-- 柜底：磁带机（socket 日志回放）+ 载荷读数 -->
      <div class="rk-base">
        <div class="rk-reel osg-reel" :class="{ spinning: logPulse > 0 }" :key="`ra-${logPulse}`"></div>
        <div class="rk-tape osg-tape" :key="`t-${logPulse}`">
          <span v-for="(item, index) in tapeTicks" :key="`${item.startedAt}-${index}`" class="rk-tape__tick osg-tick">
            ● {{ actionText(item.action) }} · {{ item.symbolicName || "—" }} · {{ logTime(item.startedAt) }}
          </span>
          <span v-if="!tapeTicks.length" class="rk-tape__tick rk-tape__tick--idle">等待操作…</span>
        </div>
        <div class="rk-reel osg-reel" :class="{ spinning: logPulse > 0 }" :key="`rb-${logPulse}`"></div>
        <div class="rk-frame osg-frame">
          <template v-if="lastFrame">
            <code>{ module: "{{ lastFrame.module }}", event: "{{ lastFrame.event }}", dataId: "{{ lastFrame.dataId }}", ts: "{{ lastFrame.timestamp }}" }</code>
          </template>
          <code v-else class="rk-frame--idle">payload { module, event, data, dataId, timestamp } · 等待首帧…</code>
        </div>
      </div>
    </section>

    <!-- 文件仓：拉出式抽屉 -->
    <section class="drawer osg-tray" :class="{ 'drawer--open': drawerOpen }">
      <button type="button" class="drawer__grip" @click="drawerOpen = !drawerOpen">
        <span class="drawer__grip__lines" aria-hidden="true"><i></i><i></i><i></i></span>
        <span class="drawer__grip__ttl">部署目录 · 文件仓 <b>{{ jars.length }}</b> 个 jar</span>
        <span class="drawer__grip__caret">{{ drawerOpen ? "▾ 收起" : "▸ 拉出" }}</span>
      </button>

      <div v-show="drawerOpen" class="drawer__body">
        <div class="drawer__tools">
          <div class="drawer__seg">
            <button
              type="button"
              class="drawer__seg__btn osg-seg__btn"
              :class="{ 'drawer__seg__btn--on': trayFilter === 'all' }"
              @click="trayFilter = 'all'"
            >
              全部
            </button>
            <button
              type="button"
              class="drawer__seg__btn osg-seg__btn"
              :class="{ 'drawer__seg__btn--on': trayFilter === 'installed' }"
              @click="trayFilter = 'installed'"
            >
              在框架中
            </button>
            <button
              type="button"
              class="drawer__seg__btn osg-seg__btn"
              :class="{ 'drawer__seg__btn--on': trayFilter === 'only' }"
              @click="trayFilter = 'only'"
            >
              仅文件
            </button>
          </div>
          <div class="drawer__auto osg-foot__auto">
            <span>每 30s 自动刷新</span>
            <el-switch v-model="autoRefresh" size="small" />
          </div>
        </div>

        <div class="drawer__list" :class="{ 'drawer__list--empty': !jarLoading && !filteredJars.length }">
          <div v-for="jar in filteredJars" :key="jar.fileName" class="jar osg-jar" :class="jar.installed ? 'jar--on osg-jar--on' : 'jar--off osg-jar--off'">
            <span class="jar__bar"></span>
            <div class="jar__body">
              <div class="jar__name">
                {{ jar.fileName }}
                <span class="jar__size">{{ formatSize(jar.size) }}</span>
              </div>
              <div class="jar__meta">
                <span v-if="jar.installed">框架中 · {{ jar.symbolicName }} · {{ stateText(jar.state ?? "") }}</span>
                <span v-else>仅文件 · 未安装</span>
                <span class="jar__time">{{ formatTime(jar.lastModified) }}</span>
              </div>
            </div>
            <ReTag :type="jar.installed ? 'success' : 'info'" effect="plain">
              {{ jar.installed ? "在框架中" : "仅文件" }}
            </ReTag>
            <div class="jar__ops">
              <ReButton
                v-if="jar.installed"
                size="small"
                :disabled="!!jarBusy"
                @click="locateBySymbolic(jar.symbolicName ?? '')"
              >
                查看模块
              </ReButton>
              <ReButton
                size="small"
                type="danger"
                :disabled="jar.installed || !!jarBusy"
                :loading="jarBusy === jar.fileName"
                :title="jar.installed ? '仍在框架中，请先在模块上卸载' : ''"
                @click="removeJar(jar)"
              >
                删除文件
              </ReButton>
            </div>
          </div>

          <div v-if="!jarLoading && !filteredJars.length" class="rk-empty osg-empty">
            <p v-if="jars.length">没有符合当前搜索 / 筛选条件的文件</p>
            <div v-else>
              <p>部署目录暂无 jar 文件</p>
              <p class="rk-empty__hint">上传安装后会在这里显示，卸载后可在此删除文件</p>
            </div>
          </div>
        </div>

        <div class="drawer__dock osg-dock" @click="pickInstall" @dragover.prevent @drop.prevent="onDropInstall">
          <span class="drawer__dock__plus">+</span>
          <span>拖入 .jar 即刻插入机柜 <small>· 同符号名上传 = 原地升级 · 点击选择文件</small></span>
        </div>
      </div>
    </section>

    <!-- 机架显示屏：实时操作日志（可折叠） -->
    <section class="mon osg-log" :class="{ 'mon--closed osg-log--closed': !logOpen }">
      <header class="mon__head osg-log__head" @click="logOpen = !logOpen">
        <span class="mon__caret">{{ logOpen ? "▾" : "▸" }}</span>
        <span class="mon__title">实时操作日志</span>
        <span class="mon__chan" :class="{ 'mon__chan--off': !logChannelReady }">
          {{ logChannelReady ? "socket · osgi / operation-log" : "socket 未接入" }}
        </span>
        <span v-if="problemCount" class="mon__badge">{{ problemCount }} 异常</span>
        <span class="mon__count">{{ logs.length }} 条</span>
        <div class="mon__spacer"></div>
        <button
          type="button"
          class="mon__act osg-log__act"
          :class="{ 'mon__act--on osg-log__act--on': logOnlyProblem }"
          @click.stop="logOnlyProblem = !logOnlyProblem"
        >
          仅异常
        </button>
        <button type="button" class="mon__act osg-log__act" @click.stop="clearLogs">清空</button>
      </header>

      <div v-show="logOpen" ref="logBox" class="mon__body">
        <p v-if="!visibleLogs.length" class="mon__empty">
          {{ logs.length ? "当前没有异常日志" : "等待操作…安装 / 卸载 / 启停 / 升级 的每一步都会实时出现在这里" }}
        </p>
        <div
          v-for="(item, index) in visibleLogs"
          :key="`${item.startedAt}-${index}`"
          class="mon__row osg-log__row"
          :class="`mon__row--${item.level.toLowerCase()}`"
        >
          <span class="mon__time">{{ logTime(item.startedAt) }}</span>
          <span class="mon__stage" :class="`mon__stage--${item.status}`">
            {{ item.status === "start" ? "开始" : item.status === "failure" ? "失败" : "完成" }}
          </span>
          <span class="mon__action">{{ actionText(item.action) }}</span>
          <span class="mon__symbol">{{ item.symbolicName || "—" }}</span>
          <span class="mon__msg">{{ item.message || "—" }}</span>
          <span v-if="item.duration > 0" class="mon__dur">{{ item.duration }}ms</span>
        </div>
      </div>
    </section>

    <input ref="installInput" type="file" accept=".jar" class="osgi-page__file" @change="onInstallFile" />
    <input ref="upgradeInput" type="file" accept=".jar" class="osgi-page__file" @change="onUpgradeFile" />
  </div>
</template>

<style scoped>
.osgi-page {
  display: flex;
  flex-direction: column;
  gap: 14px;
  padding: 16px;
}

.osgi-page__file {
  display: none;
}

/* ============ 机柜主体 ============ */
.rk {
  --rk-frame: var(--el-border-color);
  --rk-panel: var(--el-bg-color);
  --rk-well: var(--el-fill-color-lighter);
  border: 1px solid var(--rk-frame);
  border-radius: var(--el-radius-lg);
  background:
    linear-gradient(180deg, color-mix(in srgb, var(--el-color-primary) 4%, transparent), transparent 120px),
    var(--rk-well);
  box-shadow: 0 18px 40px -30px rgba(0, 0, 0, 0.5);
  overflow: hidden;
}

/* ---- 顶梁铭牌 ---- */
.rk-top {
  display: flex;
  align-items: stretch;
  gap: 12px;
  padding: 10px 14px;
  border-bottom: 1px solid var(--rk-frame);
  background: color-mix(in srgb, var(--el-color-primary) 6%, var(--rk-panel));
}

.rk-plate {
  position: relative;
  flex: 1;
  min-width: 0;
  display: flex;
  align-items: baseline;
  gap: 14px;
  flex-wrap: wrap;
  padding: 6px 26px;
  border: 1px solid var(--el-border-color-light);
  border-radius: var(--el-radius-sm);
  background: var(--rk-well);
}

.rk-plate__brand {
  font-family: var(--el-font-family-mono);
  font-size: 15px;
  font-weight: 800;
  letter-spacing: 0.18em;
  color: var(--el-color-primary);
}

.rk-plate__model {
  font-family: var(--el-font-family-mono);
  font-size: 10px;
  letter-spacing: 0.22em;
  color: var(--el-text-color-placeholder);
}

.rk-live {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  margin-left: auto;
  padding: 3px 10px;
  border: 1px solid var(--el-color-success);
  border-radius: 9999px;
  font-family: var(--el-font-family-mono);
  font-size: 10px;
  letter-spacing: 0.08em;
  color: var(--el-color-success);
}

.rk-live--off {
  border-color: var(--el-color-warning);
  color: var(--el-color-warning);
}

.rk-live__dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: currentColor;
  animation: rk-blink 1.6s infinite;
}

@keyframes rk-blink {
  50% {
    opacity: 0.25;
  }
}

.rk-plate__screw {
  position: absolute;
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: var(--el-border-color);
  box-shadow: inset 0 0 0 1.5px var(--el-fill-color);
}

.rk-plate__screw.tl { left: 8px; top: 8px; }
.rk-plate__screw.tr { right: 8px; top: 8px; }
.rk-plate__screw.bl { left: 8px; bottom: 8px; }
.rk-plate__screw.br { right: 8px; bottom: 8px; }

.rk-top__acts {
  display: flex;
  align-items: center;
  gap: 8px;
}

/* ---- 控制单元 ---- */
.rk-ctrl {
  padding: 10px 14px;
  border-bottom: 1px solid var(--rk-frame);
  background: var(--rk-panel);
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.rk-ctrl__row {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
}

.rk-ctrl__ttl {
  font-family: var(--el-font-family-mono);
  font-size: 11px;
  letter-spacing: 0.22em;
  font-weight: 700;
  color: var(--el-color-primary);
}

.rk-mleds {
  display: flex;
  gap: 3px;
}

.rk-mleds i {
  width: 7px;
  height: 12px;
  border-radius: 2px;
  background: var(--el-fill-color);
}

.rk-mleds i.on {
  background: var(--el-color-success);
  animation: rk-fw-pulse 1.2s ease-out;
}

@keyframes rk-fw-pulse {
  0% {
    box-shadow: 0 0 8px var(--el-color-success);
  }
  100% {
    box-shadow: 0 0 0 var(--el-color-success);
  }
}

.rk-ctrl__meta {
  font-family: var(--el-font-family-mono);
  font-size: 10px;
  color: var(--el-text-color-secondary);
}

.rk-ctrl__search {
  margin-left: auto;
  width: 240px;
}

.rk-seg {
  display: inline-flex;
  padding: 2px;
  border: 1px solid var(--el-border-color);
  border-radius: 14px;
  background: var(--el-fill-color-light);
}

.rk-seg__btn {
  height: 26px;
  padding: 0 11px;
  border: 0;
  border-radius: 12px;
  background: transparent;
  color: var(--el-text-color-secondary);
  font-size: 12px;
  cursor: pointer;
  transition: color 0.15s, background 0.15s;
}

.rk-seg__btn:hover {
  color: var(--el-color-primary);
}

.rk-seg__btn--on {
  background: var(--el-bg-color);
  color: var(--el-color-primary);
  font-weight: 600;
  box-shadow: var(--el-box-shadow-lighter);
}

.rk-silk {
  display: flex;
  flex-wrap: wrap;
  gap: 5px 16px;
  padding: 6px 10px;
  border: 1px dashed var(--el-border-color-lighter);
  border-radius: var(--el-radius-sm);
  background: var(--rk-well);
}

.rk-silk__item {
  font-family: var(--el-font-family-mono);
  font-size: 10px;
  letter-spacing: 0.04em;
  color: var(--el-text-color-secondary);
  white-space: nowrap;
}

.rk-silk__item b {
  color: var(--el-color-primary);
  font-weight: 700;
}

/* ---- 柜体 ---- */
.rk-body {
  display: grid;
  grid-template-columns: 26px minmax(0, 1fr) 224px 26px;
  align-items: stretch;
}

.rk-rail {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 14px;
  padding: 16px 0;
  background: color-mix(in srgb, var(--el-text-color-placeholder) 8%, var(--rk-well));
  border-right: 1px solid var(--rk-frame);
}

.rk-rail--r {
  border-right: 0;
  border-left: 1px solid var(--rk-frame);
}

.rk-rail i {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: var(--el-bg-color);
  border: 1px solid var(--el-border-color);
  box-shadow: inset 0 1px 2px rgba(0, 0, 0, 0.18);
}

/* ---- 模块墙 ---- */
.rk-bay {
  display: flex;
  flex-direction: column;
  padding: 12px;
  gap: 8px;
  min-width: 0;
}

.rk-bay--empty {
  min-height: 120px;
}

.mod {
  --mod-color: var(--el-text-color-placeholder);
  display: flex;
  align-items: stretch;
  gap: 12px;
  padding: 10px 12px;
  border: 1px solid var(--el-border-color-light);
  border-radius: var(--el-radius-md);
  background: var(--rk-panel);
  box-shadow: 0 2px 0 0 var(--el-border-color-lighter), var(--el-box-shadow-lighter);
  transition: box-shadow 0.15s, border-color 0.15s, transform 0.15s;
}

.mod:hover {
  border-color: var(--el-color-primary-light-5);
  transform: translateY(-1px);
}

.mod--hl {
  border-color: var(--el-color-primary);
  box-shadow: 0 0 0 2px var(--el-color-primary-light-5), var(--el-box-shadow-light);
}

.mod--active { --mod-color: var(--el-color-success); }
.mod--resolved { --mod-color: var(--el-color-primary); }
.mod--installed { --mod-color: var(--el-color-info); }
.mod--starting { --mod-color: var(--el-color-warning); }
.mod--stopping { --mod-color: var(--el-color-primary-light); }
.mod--uninstalled { --mod-color: var(--el-color-danger); }

.mod__lamp {
  flex: none;
  width: 58px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
  border-right: 1px dashed var(--el-border-color-lighter);
  padding-right: 10px;
}

.mod__pwr {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background: var(--mod-color);
  box-shadow: 0 0 8px color-mix(in srgb, var(--mod-color) 65%, transparent);
}

.mod__slot {
  font-family: var(--el-font-family-mono);
  font-size: 9px;
  letter-spacing: 0.14em;
  color: var(--el-text-color-placeholder);
}

.mod__face {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 8px;
  justify-content: center;
}

.mod__name {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 15px;
  font-weight: 700;
  color: var(--el-text-color-primary);
  overflow: hidden;
}

.mod__ver {
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

.mod__bid {
  flex: none;
  font-family: var(--el-font-family-mono);
  font-size: 10px;
  font-weight: 400;
  color: var(--el-text-color-placeholder);
}

.mod__ops {
  display: flex;
  align-items: center;
  gap: 6px;
  flex-wrap: wrap;
}

.mod__sysnote {
  font-size: 11px;
  color: var(--el-text-color-placeholder);
}

.mod__meter {
  flex: none;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding-left: 10px;
  border-left: 1px dashed var(--el-border-color-lighter);
}

.mod__ladder {
  display: flex;
  flex-direction: column-reverse;
  gap: 2px;
}

.mod__ladder i {
  width: 22px;
  height: 5px;
  border-radius: 2px;
  background: var(--el-fill-color);
  transition: background 0.2s;
}

.mod__ladder i.on {
  background: var(--mod-color);
}

.mod__ladder i.hot {
  background: var(--el-color-warning);
}

.mod__ladder i.max {
  background: var(--el-color-danger);
}

.mod__level {
  font-family: var(--el-font-family-mono);
  font-size: 9px;
  color: var(--el-text-color-secondary);
}

.mod__level b {
  color: var(--el-color-primary);
}

/* ---- PATCH 面板 ---- */
.rk-patch {
  border-left: 1px solid var(--rk-frame);
  background: color-mix(in srgb, var(--el-color-primary) 4%, var(--rk-well));
  padding: 12px;
  display: flex;
  flex-direction: column;
  gap: 10px;
  min-width: 0;
}

.rk-patch__h {
  display: flex;
  flex-direction: column;
  gap: 2px;
  font-family: var(--el-font-family-mono);
  font-size: 12px;
  font-weight: 800;
  letter-spacing: 0.2em;
  color: var(--el-color-primary);
}

.rk-patch__h span {
  font-size: 10px;
  font-weight: 400;
  letter-spacing: 0.02em;
  color: var(--el-text-color-secondary);
}

.rk-jacks {
  display: flex;
  flex-direction: column;
  gap: 8px;
  overflow-y: auto;
  max-height: 320px;
}

.rk-jack {
  display: grid;
  grid-template-columns: 20px minmax(0, 1fr);
  grid-template-rows: auto auto;
  column-gap: 8px;
  align-items: center;
  padding: 6px 8px;
  border: 1px solid var(--el-border-color-lighter);
  border-radius: var(--el-radius-sm);
  background: var(--rk-panel);
}

.rk-jack__hole {
  grid-row: 1 / span 2;
  width: 16px;
  height: 16px;
  border: 2px solid var(--el-color-success);
  border-radius: 50%;
  background: var(--el-fill-color);
  box-shadow: 0 0 8px color-mix(in srgb, var(--el-color-success) 55%, transparent);
}

.rk-jack__nm {
  font-family: var(--el-font-family-mono);
  font-size: 10px;
  font-weight: 600;
  color: var(--el-text-color-primary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.rk-jack__pid {
  font-family: var(--el-font-family-mono);
  font-size: 9px;
  color: var(--el-text-color-placeholder);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.rk-patch__empty {
  margin: 0;
  font-size: 12px;
  color: var(--el-text-color-placeholder);
}

/* ---- 柜底：磁带机 + 载荷读数 ---- */
.rk-base {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 14px;
  border-top: 1px solid var(--rk-frame);
  background: var(--rk-panel);
}

.rk-reel {
  width: 38px;
  height: 38px;
  flex: none;
  border-radius: 50%;
  border: 3px solid var(--el-border-color);
  position: relative;
}

.rk-reel::before {
  content: "";
  position: absolute;
  inset: 10px;
  border-radius: 50%;
  border: 2px dashed var(--el-text-color-secondary);
}

.rk-reel.spinning {
  animation: rk-spin 3.6s linear infinite;
}

@keyframes rk-spin {
  to {
    transform: rotate(360deg);
  }
}

.rk-tape {
  flex: 1;
  min-width: 0;
  height: 46px;
  padding: 4px 6px;
  border: 1px solid var(--el-border-color-lighter);
  border-radius: var(--el-radius-sm);
  background: var(--rk-well);
  overflow: hidden;
  display: flex;
  flex-direction: column-reverse;
  gap: 2px;
}

.rk-tape__tick {
  font-family: var(--el-font-family-mono);
  font-size: 9px;
  color: var(--el-text-color-secondary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.rk-tape__tick--idle {
  color: var(--el-text-color-placeholder);
}

.rk-frame {
  flex: none;
  max-width: 380px;
  padding: 6px 8px;
  border: 1px dashed var(--el-border-color-lighter);
  border-radius: var(--el-radius-sm);
  background: var(--rk-well);
  overflow: hidden;
}

.rk-frame code {
  display: block;
  font-family: var(--el-font-family-mono);
  font-size: 9px;
  line-height: 1.5;
  color: var(--el-color-primary);
  word-break: break-all;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.rk-frame code.rk-frame--idle {
  color: var(--el-text-color-placeholder);
}

/* ---- 空态 ---- */
.rk-empty {
  padding: 24px 16px;
  text-align: center;
  font-size: 13px;
  color: var(--el-text-color-secondary);
}

.rk-empty p {
  margin: 4px 0;
}

.rk-empty__hint {
  font-size: 12px;
  color: var(--el-text-color-placeholder);
}

.rk-empty__hint code {
  padding: 0 4px;
  border-radius: var(--el-radius-sm);
  background: var(--el-fill-color-light);
}

/* ============ 文件仓抽屉 ============ */
.drawer {
  border: 1px solid var(--el-border-color);
  border-radius: var(--el-radius-lg);
  background: var(--el-bg-color);
  overflow: hidden;
}

.drawer__grip {
  display: flex;
  align-items: center;
  gap: 10px;
  width: 100%;
  padding: 10px 14px;
  border: 0;
  border-bottom: 1px solid var(--el-border-color-lighter);
  background: color-mix(in srgb, var(--el-text-color-placeholder) 5%, var(--el-bg-color));
  cursor: pointer;
  user-select: none;
}

.drawer__grip__lines {
  display: flex;
  flex-direction: column;
  gap: 3px;
}

.drawer__grip__lines i {
  width: 26px;
  height: 2px;
  border-radius: 2px;
  background: var(--el-border-color);
}

.drawer__grip__ttl {
  font-size: 13px;
  font-weight: 600;
  color: var(--el-text-color-primary);
}

.drawer__grip__ttl b {
  color: var(--el-color-primary);
}

.drawer__grip__caret {
  margin-left: auto;
  font-size: 12px;
  color: var(--el-text-color-secondary);
}

.drawer__body {
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: 12px 14px;
}

.drawer__tools {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
}

.drawer__seg {
  display: inline-flex;
  padding: 2px;
  border: 1px solid var(--el-border-color);
  border-radius: 14px;
  background: var(--el-fill-color-light);
}

.drawer__seg__btn {
  height: 24px;
  padding: 0 10px;
  border: 0;
  border-radius: 12px;
  background: transparent;
  color: var(--el-text-color-secondary);
  font-size: 12px;
  cursor: pointer;
  transition: color 0.15s, background 0.15s;
}

.drawer__seg__btn:hover {
  color: var(--el-color-primary);
}

.drawer__seg__btn--on {
  background: var(--el-bg-color);
  color: var(--el-color-primary);
  font-weight: 600;
  box-shadow: var(--el-box-shadow-lighter);
}

.drawer__auto {
  margin-left: auto;
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  color: var(--el-text-color-secondary);
}

.drawer__list {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.drawer__list--empty {
  min-height: 48px;
}

.jar {
  position: relative;
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 12px;
  border: 1px solid var(--el-border-color-light);
  border-radius: var(--el-radius-md);
  transition: border-color 0.15s, box-shadow 0.15s;
}

.jar:hover {
  border-color: var(--el-color-primary-light-5);
  box-shadow: var(--el-box-shadow-light);
}

.jar__bar {
  align-self: stretch;
  width: 3px;
  flex: none;
  margin: 2px 0;
  border-radius: 2px;
  background: var(--el-text-color-placeholder);
}

.jar--on .jar__bar {
  background: var(--el-color-success);
}

.jar__body {
  min-width: 0;
  flex: 1;
}

.jar__name {
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

.jar__size {
  flex: none;
  padding: 1px 6px;
  border: 1px solid var(--el-border-color-lighter);
  border-radius: var(--el-radius-xs);
  background: var(--el-fill-color-light);
  font-size: 11px;
  font-weight: 400;
  color: var(--el-text-color-secondary);
}

.jar__meta {
  display: flex;
  gap: 10px;
  margin-top: 2px;
  font-size: 11px;
  color: var(--el-text-color-placeholder);
}

.jar__time {
  font-family: var(--el-font-family-mono);
}

.jar__ops {
  display: flex;
  gap: 4px;
  flex: none;
}

.drawer__dock {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  min-height: 52px;
  border: 1.5px dashed var(--el-border-color);
  border-radius: var(--el-radius-lg);
  font-size: 13px;
  color: var(--el-text-color-secondary);
  cursor: pointer;
  transition: border-color 0.15s, color 0.15s, background 0.15s;
}

.drawer__dock:hover {
  border-color: var(--el-color-primary);
  background: var(--el-color-primary-light-9);
  color: var(--el-color-primary);
}

.drawer__dock__plus {
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

.drawer__dock:hover .drawer__dock__plus {
  background: var(--el-color-primary);
  color: var(--el-button-text-color);
}

.drawer__dock small {
  font-size: 11px;
  color: var(--el-text-color-placeholder);
}

.drawer__dock:hover small {
  color: var(--el-color-primary);
}

/* ============ 实时日志（机架显示屏） ============ */
.mon {
  border: 1px solid var(--el-border-color);
  border-radius: var(--el-radius-lg);
  background: var(--el-bg-color);
  overflow: hidden;
}

.mon__head {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 14px;
  border-bottom: 1px solid var(--el-border-color-lighter);
  cursor: pointer;
  user-select: none;
}

.mon--closed .mon__head {
  border-bottom: 0;
}

.mon__caret {
  width: 10px;
  font-size: 10px;
  color: var(--el-text-color-placeholder);
}

.mon__title {
  font-size: 13px;
  font-weight: 600;
  color: var(--el-text-color-primary);
}

.mon__chan {
  font-family: var(--el-font-family-mono);
  font-size: 11px;
  color: var(--el-color-success);
}

.mon__chan--off {
  color: var(--el-color-warning);
}

.mon__badge {
  padding: 1px 6px;
  border-radius: 8px;
  background: var(--el-color-danger-light-9);
  color: var(--el-color-danger);
  font-size: 11px;
}

.mon__count {
  font-size: 11px;
  color: var(--el-text-color-placeholder);
}

.mon__spacer {
  flex: 1;
}

.mon__act {
  height: 22px;
  padding: 0 8px;
  border: 1px solid var(--el-border-color);
  border-radius: 11px;
  background: transparent;
  color: var(--el-text-color-secondary);
  font-size: 11px;
  cursor: pointer;
}

.mon__act:hover,
.mon__act--on {
  border-color: var(--el-color-primary);
  color: var(--el-color-primary);
}

.mon__body {
  max-height: 240px;
  overflow-y: auto;
  padding: 6px 0;
  font-family: var(--el-font-family-mono);
  font-size: 12px;
}

.mon__empty {
  margin: 10px 14px;
  font-family: var(--el-font-family);
  font-size: 12px;
  color: var(--el-text-color-placeholder);
}

.mon__row {
  display: flex;
  align-items: baseline;
  gap: 10px;
  padding: 3px 14px;
  line-height: 1.5;
}

.mon__row:hover {
  background: var(--el-fill-color-light);
}

.mon__row--error {
  background: var(--el-color-danger-light-9);
}

.mon__row--warn {
  background: var(--el-color-warning-light-9);
}

.mon__time {
  flex: none;
  color: var(--el-text-color-placeholder);
}

.mon__stage {
  flex: none;
  width: 30px;
  font-family: var(--el-font-family);
  font-size: 11px;
  color: var(--el-text-color-secondary);
}

.mon__stage--start {
  color: var(--el-color-info);
}

.mon__stage--success {
  color: var(--el-color-success);
}

.mon__stage--failure {
  color: var(--el-color-danger);
}

.mon__action {
  flex: none;
  min-width: 48px;
  color: var(--el-text-color-primary);
}

.mon__symbol {
  flex: none;
  max-width: 180px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  color: var(--el-color-primary);
}

.mon__msg {
  flex: 1;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  color: var(--el-text-color-regular);
}

.mon__dur {
  flex: none;
  color: var(--el-text-color-placeholder);
}

/* ============ 响应式 ============ */
@media (max-width: 1180px) {
  .rk-body {
    grid-template-columns: 20px minmax(0, 1fr) 20px;
  }

  .rk-patch {
    grid-column: 1 / -1;
    border-left: 0;
    border-top: 1px solid var(--rk-frame);
  }

  .rk-jacks {
    flex-direction: row;
    flex-wrap: wrap;
    max-height: none;
  }

  .rk-jack {
    width: 200px;
  }

  .rk-frame {
    display: none;
  }
}

@media (max-width: 640px) {
  .rk-body {
    grid-template-columns: minmax(0, 1fr);
  }

  .rk-rail {
    display: none;
  }

  .rk-ctrl__search {
    width: 100%;
    margin-left: 0;
  }

  .mod {
    flex-wrap: wrap;
  }

  .mod__meter {
    flex-direction: row;
    width: 100%;
    padding-left: 0;
    border-left: 0;
    border-top: 1px dashed var(--el-border-color-lighter);
    padding-top: 8px;
  }

  .mod__ladder {
    flex-direction: row;
  }
}

@media (prefers-reduced-motion: reduce) {
  .rk-live__dot,
  .rk-mleds i.on,
  .rk-reel.spinning {
    animation: none !important;
  }
}
</style>
