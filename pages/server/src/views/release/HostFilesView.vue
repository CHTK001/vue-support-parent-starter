<script setup lang="ts">
/**
 * 主机文件 —— 运行本服务的这台机器的文件工作台。
 *
 * <p>这一页的活儿只有四件：<b>找到包 → 看清楚 → 传上来 → 清掉旧的</b>。
 * 重构前它是一张只读表格：没有面包屑、不能多选、算 MD5 是行内一个按钮、
 * 上传永远落在存储根（进子目录后再传也落在根）、也看不到文件到底在主机哪个路径。</p>
 *
 * <p>现在的结构：</p>
 * <ul>
 *   <li>左栏是「存储 / 位置 / 类型 / 传输」四个稳定锚点，数量与容量都来自真实数据；</li>
 *   <li>中间是目录本体：面包屑可点、可搜索、可按名称 / 大小 / 时间排序；
 *       多选支持 Shift 区间，批量删除逐个回报失败原因；</li>
 *   <li>右栏（选中单个文件时出现）是它的档案：主机绝对路径、按需计算的 MD5、
 *       文本 / 图片预览 —— 发布投放时真正要的那几个值都在这里。</li>
 * </ul>
 *
 * <p>能力按存储后端如实呈现：对象存储没有本地根路径，就不出现「新建文件夹」之外的
 * 本机操作；MD5 只在本地存储可用，界面上不会出现点了会报错的按钮。</p>
 *
 * @author CH
 * @since 4.0.0.62
 */
import { computed, onBeforeUnmount, onMounted, reactive, ref, watch } from "vue";
import { message } from "@repo/core";
import { ElMessageBox } from "element-plus";
import ReButton from "@repo/ui/re-button";
import ReIcon from "@repo/ui/re-icon";
import ReDialog from "@repo/ui/re-dialog";
import ReSectionHead from "@repo/ui/re-section-head";
import {
  completeUploadTask,
  confirmReleaseHostFileMd5,
  createUploadTask,
  deleteReleaseHostFile,
  deleteReleaseHostFiles,
  downloadReleaseHostFile,
  getReleaseHostFileConfig,
  getUploadTask,
  listReleaseHostFiles,
  mkdirReleaseHostDir,
  pushReleaseHostFileToProject,
  renameReleaseHostFile,
  subscribeUploadTasks,
  uploadTaskChunk,
  type ReleaseHostFileConfig,
  type ReleaseHostFileItem,
  type ReleaseHostFileKind,
  type ReleaseHostFileOrder,
  type ReleaseHostFileSort,
  type ReleaseUploadTask,
} from "../../api/releaseHostFile";
import { errorText, toastError } from "../../utils/errors";
import { md5OfBlob, http, unwrapResult } from "@repo/utils";
import {
  KIND_OPTIONS,
  breadcrumbOf,
  formatSize,
  kindLabel,
  parentKey,
} from "../../utils/hostFileUi";
import HostFileBrowser from "./hostfile/HostFileBrowser.vue";
import HostFileDetail from "./hostfile/HostFileDetail.vue";

/** 浏览区实例（用于外部清空 ReTable 勾选） */
const browserRef = ref<InstanceType<typeof HostFileBrowser> | null>(null);

/** 分片大小：5MB（与 filesystem-starter 的默认任务分片一致） */
const CHUNK_SIZE = 5 * 1024 * 1024;

/** 搜索输入的防抖时长 */
const SEARCH_DEBOUNCE = 320;

/* ==================== 存储与目录 ==================== */

const config = ref<ReleaseHostFileConfig>({
  enabled: false,
  bucket: "",
  root: "",
  local: false,
  buckets: [],
  defaultBucket: "",
});
const bucket = ref("");
const path = ref("");
const keyword = ref("");
const sort = ref<ReleaseHostFileSort>("name");
const order = ref<ReleaseHostFileOrder>("asc");
const kindFilter = ref<"" | ReleaseHostFileKind>("");
const view = ref<"list" | "grid">("list");

const items = ref<ReleaseHostFileItem[]>([]);
const total = ref(0);
const truncated = ref(false);
const loading = ref(false);
const error = ref("");
const initializing = ref(true);

/** 历史栈：后退 / 前进按真实访问顺序走，而不是只靠「上级」 */
const history = ref<string[]>([""]);
const historyIndex = ref(0);
const canBack = computed(() => historyIndex.value > 0);
const canForward = computed(() => historyIndex.value < history.value.length - 1);

/* ==================== 选择 ==================== */

/** 由 ReTable 勾选列直接维护的行对象集合 */
const selectedRows = ref<ReleaseHostFileItem[]>([]);

const selectedKeys = computed(() => new Set(selectedRows.value.map(it => it.key)));
/** 当前可见范围内被选中的条目：批量动作只会打到用户看得见的行 */
const selectedItems = computed(() => visibleItems.value.filter(it => selectedKeys.value.has(it.key)));
const selectedSize = computed(() => selectedItems.value.reduce((sum, it) => sum + (it.directory ? 0 : it.size), 0));

/* ==================== 上传到项目 ==================== */

/** 发布选项（用于「上传项目」两级选择） */
interface ReleaseOption {
  id: number;
  releaseName: string;
}

/** 项目选项 */
interface ProjectOption {
  id: number;
  projectName: string;
}

/** 「上传项目」弹窗状态：选发布 → 选项目 → 推送 */
const pushDialog = reactive({
  open: false,
  item: null as ReleaseHostFileItem | null,
  releases: [] as ReleaseOption[],
  projects: [] as ProjectOption[],
  releaseId: 0,
  projectId: 0,
  loading: false,
  pushing: false,
});

/**
 * 打开「上传项目」弹窗并加载发布列表。
 *
 * @param item 目标文件
 */
async function openPushDialog(item: ReleaseHostFileItem): Promise<void> {
  if (item.directory) {
    message.warning("目录不能作为升级包投放，请选择文件");
    return;
  }
  pushDialog.item = item;
  pushDialog.open = true;
  pushDialog.releaseId = 0;
  pushDialog.projectId = 0;
  pushDialog.projects = [];
  pushDialog.loading = true;
  try {
    // 发布列表与项目列表都来自发布管理接口，与发布页同源
    const res = await http().get("/ms/server/release/list");
    const list = unwrapResult<ReleaseOption[]>(res) || [];
    pushDialog.releases = list;
  } catch (e) {
    toastError(e, "加载发布列表失败");
  } finally {
    pushDialog.loading = false;
  }
}

/**
 * 切换发布：加载该发布下的项目。
 *
 * @param releaseId 发布 ID
 */
async function onPushReleaseChange(releaseId: number): Promise<void> {
  pushDialog.releaseId = releaseId;
  pushDialog.projectId = 0;
  pushDialog.projects = [];
  if (!releaseId) {
    return;
  }
  try {
    const res = await http().get(`/ms/server/release/${releaseId}/projects`);
    const list = unwrapResult<ProjectOption[]>(res) || [];
    pushDialog.projects = list.filter((p: ProjectOption) => p.projectName);
  } catch (e) {
    toastError(e, "加载项目列表失败");
  }
}

/**
 * 执行投放：把当前文件推到选中项目的目标主机 uploads/（不触发升级）。
 */
async function submitPush(): Promise<void> {
  if (!pushDialog.item || !pushDialog.projectId) {
    message.warning("请选择发布与项目");
    return;
  }
  pushDialog.pushing = true;
  try {
    const target = await pushReleaseHostFileToProject(pushDialog.projectId, pushDialog.item.key);
    const project = pushDialog.projects.find(p => p.id === pushDialog.projectId);
    message.success(`已投放到「${project?.projectName ?? pushDialog.projectId}」的主机 uploads${target ? `：${target}` : ""}`);
    pushDialog.open = false;
  } catch (e) {
    toastError(e, "投放失败");
  } finally {
    pushDialog.pushing = false;
  }
}

/** 目录统计（按当前页真实条目算） */
const dirCount = computed(() => items.value.filter(it => it.directory).length);
const fileCount = computed(() => items.value.length - dirCount.value);
const totalSize = computed(() => items.value.reduce((sum, it) => sum + (it.directory ? 0 : it.size), 0));
const packageCount = computed(() => items.value.filter(it => it.kind === "package").length);

/** 类型筛选后的条目（搜索与排序走服务端，类型筛选只作用于当前页） */
const visibleItems = computed(() =>
  kindFilter.value ? items.value.filter(it => it.kind === kindFilter.value) : items.value,
);

/** 各类型的数量：筛选项上直接显示，避免点进去才发现是空的 */
const kindCounts = computed<Record<string, number>>(() => {
  const counts: Record<string, number> = {};
  for (const item of items.value) {
    counts[item.kind] = (counts[item.kind] ?? 0) + 1;
  }
  return counts;
});

/* ==================== 详情 ==================== */

const detailKey = ref("");

/** 详情里的条目：从当前页取，翻页 / 刷新后自然失效 */
const detailItem = computed(() => items.value.find(it => it.key === detailKey.value) ?? null);

/**
 * 点开某条的详情。
 *
 * @param item 条目
 */
function openDetail(item: ReleaseHostFileItem): void {
  detailKey.value = item.key;
}

/* ==================== 数据加载 ==================== */

/** 目录请求序号：慢响应回来时不能覆盖新目录 */
let loadSeq = 0;

/** 搜索防抖句柄 */
let searchTimer: ReturnType<typeof setTimeout> | null = null;

/**
 * 首次进入：读存储信息再列根目录。
 */
async function init(): Promise<void> {
  initializing.value = true;
  try {
    const cfg = await getReleaseHostFileConfig();
    config.value = cfg;
    bucket.value = cfg.bucket || cfg.defaultBucket || "";
    if (!cfg.enabled) {
      error.value = "文件存储未启用：请在应用配置里开启 plugin.filesystem.enable 后重启";
      return;
    }
    await load();
  } catch (e) {
    error.value = errorText(e, "加载主机文件失败");
  } finally {
    initializing.value = false;
  }
}

/**
 * 拉取当前目录。
 *
 * @param keepSelection 是否保留选择（刷新时保留，换目录时清空）
 */
async function load(keepSelection = false): Promise<void> {
  const seq = ++loadSeq;
  loading.value = true;
  error.value = "";
  try {
    const page = await listReleaseHostFiles({
      bucket: bucket.value,
      path: path.value,
      keyword: keyword.value.trim(),
      sort: sort.value,
      order: order.value,
      limit: 500,
    });
    if (seq !== loadSeq) {
      return;
    }
    items.value = page.items ?? [];
    total.value = page.total ?? items.value.length;
    truncated.value = !!page.truncated;
    if (!keepSelection) {
      clearSelection();
    } else {
      // 刷新后保留仍在本页里的选择（ReTable 勾选列会随数据重算，这里只需收敛行对象）
      const keep = new Set(selectedRows.value.map(it => it.key));
      selectedRows.value = selectedRows.value.filter(it => keep.has(it.key));
    }
    if (detailKey.value && !items.value.some(it => it.key === detailKey.value)) {
      detailKey.value = "";
    }
  } catch (e) {
    if (seq === loadSeq) {
      items.value = [];
      total.value = 0;
      error.value = errorText(e, "加载目录失败");
    }
  } finally {
    if (seq === loadSeq) {
      loading.value = false;
    }
  }
}

/**
 * 进入目录（不重置历史）。
 *
 * @param key 目录 key
 */
async function openDir(key: string): Promise<void> {
  path.value = key;
  await load();
}

/**
 * 导航并记入历史。
 *
 * @param target 目录 key
 */
function navigate(target: string): void {
  if (target === path.value) {
    return;
  }
  history.value = history.value.slice(0, historyIndex.value + 1);
  if (history.value[history.value.length - 1] !== target) {
    history.value.push(target);
  }
  historyIndex.value = history.value.length - 1;
  void openDir(target);
}

/** 后退 */
function goBack(): void {
  if (!canBack.value) {
    return;
  }
  historyIndex.value -= 1;
  void openDir(history.value[historyIndex.value] ?? "");
}

/** 前进 */
function goForward(): void {
  if (!canForward.value) {
    return;
  }
  historyIndex.value += 1;
  void openDir(history.value[historyIndex.value] ?? "");
}

/** 刷新当前目录（保留选择与详情） */
function refresh(): void {
  void load(true);
}

/* ==================== 选择逻辑 ==================== */

/** 清空选择（翻页 / 换目录 / 重新检索时调用） */
function clearSelection(): void {
  selectedRows.value = [];
  browserRef.value?.clearSelection();
}

/**
 * ReTable 勾选变化：行对象直接进集合。
 *
 * @param rows 当前所选行
 */
function onSelectionChange(rows: ReleaseHostFileItem[]): void {
  selectedRows.value = rows;
}

/* ==================== 排序 / 搜索 / 视图 ==================== */

/**
 * 表头排序：ReTable 回调带方向，直接转成后端参数。
 *
 * @param field 字段
 * @param dir   方向
 */
function changeSort(field: ReleaseHostFileSort, dir: ReleaseHostFileOrder): void {
  sort.value = field;
  order.value = dir;
  void load(true);
}

/** 搜索输入：防抖后走服务端过滤 */
watch(keyword, () => {
  if (searchTimer) {
    clearTimeout(searchTimer);
  }
  searchTimer = setTimeout(() => {
    void load();
  }, SEARCH_DEBOUNCE);
});

/** 切换视图：记住选择 */
/** 切换存储位置：回到根目录 */
watch(bucket, () => {
  if (initializing.value) {
    return;
  }
  path.value = "";
  history.value = [""];
  historyIndex.value = 0;
  detailKey.value = "";
  void load();
});

/** 换类型筛选：选择清空，避免批量动作打到被筛掉的行 */
watch(kindFilter, () => {
  clearSelection();
});

/* ==================== 写操作 ==================== */

/**
 * 删除（逐个确认一次，批量一次确认）。
 *
 * @param targets 目标条目
 */
async function removeItems(targets: ReleaseHostFileItem[]): Promise<void> {
  if (!targets.length) {
    return;
  }
  const dirs = targets.filter(it => it.directory).length;
  const tip = targets.length === 1
    ? `确定删除「${targets[0]!.name}」${targets[0]!.directory ? "及其全部内容" : ""}吗？`
    : `确定删除所选 ${targets.length} 项${dirs ? `（其中 ${dirs} 个目录会连同内容一起删除）` : ""}吗？`;
  try {
    await ElMessageBox.confirm(tip, "删除确认", { type: "warning", confirmButtonText: "删除" });
  } catch {
    return;
  }
  try {
    if (targets.length === 1) {
      await deleteReleaseHostFile(targets[0]!.key, bucket.value);
      message.success("已删除");
    } else {
      const result = await deleteReleaseHostFiles(targets.map(it => it.key), bucket.value);
      if (result.failed > 0) {
        message.warning(`已删除 ${result.succeeded} 项，${result.failed} 项失败：${result.failures.slice(0, 2).join("；")}`);
      } else {
        message.success(`已删除 ${result.succeeded} 项`);
      }
    }
    detailKey.value = "";
    await load();
  } catch (e) {
    toastError(e, "删除失败");
  }
}

/**
 * 下载单个文件。
 *
 * @param item 条目
 */
async function downloadItem(item: ReleaseHostFileItem): Promise<void> {
  if (item.directory) {
    message.warning("目录不能直接下载，请进入后选择文件");
    return;
  }
  try {
    const blob = await downloadReleaseHostFile(item.key, bucket.value);
    saveBlob(blob, item.name);
  } catch (e) {
    toastError(e, "下载失败");
  }
}

/**
 * 批量下载：逐个触发，间隔 200ms，避免浏览器把连续下载当成弹窗拦截。
 */
async function downloadSelected(): Promise<void> {
  const files = selectedItems.value.filter(it => !it.directory);
  if (!files.length) {
    message.warning("所选条目里没有文件");
    return;
  }
  for (const item of files) {
    await downloadItem(item);
    await new Promise(resolve => setTimeout(resolve, 200));
  }
}

/**
 * 把 Blob 交给浏览器保存。
 *
 * @param blob 内容
 * @param name 文件名
 */
function saveBlob(blob: Blob, name: string): void {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = name;
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/* ==================== 新建 / 重命名 ==================== */

const nameDialog = reactive({
  open: false,
  mode: "mkdir" as "mkdir" | "rename",
  value: "",
  target: null as ReleaseHostFileItem | null,
  saving: false,
});

/** 打开新建文件夹 */
function openMkdir(): void {
  nameDialog.mode = "mkdir";
  nameDialog.value = "";
  nameDialog.target = null;
  nameDialog.open = true;
}

/**
 * 打开重命名。
 *
 * @param item 条目
 */
function openRename(item: ReleaseHostFileItem): void {
  nameDialog.mode = "rename";
  nameDialog.value = item.name;
  nameDialog.target = item;
  nameDialog.open = true;
}

/** 提交新建 / 重命名 */
async function submitName(): Promise<void> {
  const name = nameDialog.value.trim();
  if (!name || nameDialog.saving) {
    return;
  }
  if (name.includes("/") || name.includes("\\")) {
    message.warning("名称里不能包含路径分隔符");
    return;
  }
  nameDialog.saving = true;
  try {
    if (nameDialog.mode === "mkdir") {
      await mkdirReleaseHostDir(path.value, name, bucket.value);
      message.success("目录已创建");
    } else if (nameDialog.target) {
      await renameReleaseHostFile(nameDialog.target.key, name, bucket.value);
      message.success("已重命名");
    }
    nameDialog.open = false;
    await load(true);
  } catch (e) {
    toastError(e, nameDialog.mode === "mkdir" ? "创建目录失败" : "重命名失败");
  } finally {
    nameDialog.saving = false;
  }
}

/** 行内改名提交（列表里直接回车） */

/* ==================== 浏览区菜单分发 ==================== */

/**
 * ReTable 右键菜单 / 操作列 square 按钮的统一下发口。
 *
 * @param command 命令（open / download / push / md5 / rename / copy-name / copy-key / delete / __more）
 * @param item    条目
 */
async function onMenuSelect(command: string, item: ReleaseHostFileItem): Promise<void> {
  if (command === "open") {
    if (item.directory) {
      navigate(item.key);
    } else {
      openDetail(item);
    }
    return;
  }
  if (command === "download") {
    await downloadItem(item);
    return;
  }
  if (command === "push") {
    await openPushDialog(item);
    return;
  }
  if (command === "md5") {
    openDetail(item);
    return;
  }
  if (command === "rename") {
    openRename(item);
    return;
  }
  if (command === "copy-name") {
    await copyText(item.name, "名称");
    return;
  }
  if (command === "copy-key") {
    await copyText(item.key, "存储路径");
    return;
  }
  if (command === "delete") {
    await removeItems([item]);
  }
}

/* ==================== 上传 ==================== */

type UploadState = "hashing" | "uploading" | "merging" | "done" | "error";

/** 上传任务行 */
interface UploadJob {
  id: string;
  file: File;
  taskId: string;
  name: string;
  size: number;
  progress: number;
  state: UploadState;
  error: string;
  dir: string;
}

const uploads = ref<UploadJob[]>([]);
const fileInput = ref<HTMLInputElement | null>(null);
let uploadSse: { close(): void } | null = null;
let uploadRunning = false;
let uploadSeq = 0;

/** 有任务的「进行中」数量：驱动左栏小标题 */
const activeUploads = computed(() => uploads.value.filter(it => it.state !== "done" && it.state !== "error").length);

/** 打开系统文件选择器 */
function pickFiles(): void {
  fileInput.value?.click();
}

/**
 * 选择文件后入队。
 *
 * @param event change 事件
 */
function onFilesPicked(event: Event): void {
  const input = event.target as HTMLInputElement;
  const files = Array.from(input.files ?? []);
  input.value = "";
  enqueue(files, path.value);
}

/**
 * 把文件放进上传队列。
 *
 * @param files 文件列表
 * @param dir   目标目录 key
 */
function enqueue(files: File[], dir: string): void {
  if (!files.length) {
    return;
  }
  for (const file of files) {
    uploadSeq += 1;
    uploads.value.push({
      id: `up-${uploadSeq}`,
      file,
      taskId: "",
      name: file.name,
      size: file.size,
      progress: 0,
      state: "hashing",
      error: "",
      dir,
    });
  }
  void runQueue();
}

/** 顺序执行队列：并发上传只会在同一网卡上互相抢带宽，进度还看不清 */
async function runQueue(): Promise<void> {
  if (uploadRunning) {
    return;
  }
  uploadRunning = true;
  ensureUploadSse();
  try {
    for (;;) {
      const job = uploads.value.find(it => it.state === "hashing");
      if (!job) {
        break;
      }
      await uploadOne(job);
    }
  } finally {
    uploadRunning = false;
    closeUploadSse();
  }
}

/**
 * 上传单个文件。
 *
 * <p>带整文件 MD5 的完整链路：本地先按 4MB 分片把 MD5 算出来 → 建任务时声明
 * （后端合并后会复核一次整文件）→ 传完后再调「复核并登记」落库 → 列表页直接显示。
 * 任何一环不一致都会把行标红，绝不把「服务端收到的字节」与「本地文件」画等号。</p>
 *
 * @param job 任务行
 */
async function uploadOne(job: UploadJob): Promise<void> {
  job.state = "uploading";
  job.progress = 0;
  job.error = "";
  try {
    const md5 = await md5OfBlob(job.file, percent => {
      // 本地计算本身也是几秒级的大文件 IO：把进度映射到 0~70%，
      // 让「卡住不动」和「正在读文件」一眼能分
      job.progress = Math.round((percent / 100) * 70);
    });
    job.progress = 70;
    if (md5.length !== 32) {
      throw new Error("本地 MD5 计算异常");
    }
    const task = await createUploadTask(job.file.name, job.file.size, CHUNK_SIZE, job.dir, bucket.value, md5);
    job.taskId = String(task?.taskId || "");
    if (!job.taskId) {
      throw new Error("上传任务未返回 taskId");
    }
    const totalChunks = Math.max(1, Math.ceil(job.file.size / CHUNK_SIZE));
    for (let index = 0; index < totalChunks; index += 1) {
      const chunk = job.file.slice(index * CHUNK_SIZE, Math.min(job.file.size, (index + 1) * CHUNK_SIZE));
      const snapshot = await uploadTaskChunk(job.taskId, index, chunk);
      if (snapshot) {
        applyProgress(job, snapshot);
      } else {
        job.progress = Math.round(70 + ((index + 1) / totalChunks) * 29);
      }
    }
    job.state = "merging";
    job.progress = 99;
    const done = await completeUploadTask(job.taskId);
    if (done && String(done.state || "").toUpperCase() === "COMPLETED") {
      await confirmJob(job, md5);
    } else {
      // 合并是后台任务：SSE 正常会推 COMPLETED，这里再挂一个兜底轮询，
      // 避免进度流被代理掐断后这一行永远停在「合并中」
      void pollJob(job, md5);
    }
  } catch (e) {
    job.state = "error";
    job.error = errorText(e, "上传失败");
  }
}

/**
 * 合并完成后：调「复核并登记 MD5」，成功后落库、刷列表。
 *
 * <p>文件 key 由「目标目录 + 文件名」构成（与后端 putObject 的 filePath/fileName
 * 拼接规则一致，上传任务的 objectKey 要等合并后才回填，不能在这里依赖它）。</p>
 *
 * @param job 任务行
 * @param md5 本地算出的整文件 MD5
 */
async function confirmJob(job: UploadJob, md5: string): Promise<void> {
  const key = job.dir ? `${job.dir}/${job.name}` : job.name;
  try {
    await confirmReleaseHostFileMd5(key, md5, bucket.value);
    finishJob(job);
  } catch (e) {
    job.state = "error";
    job.error = `${errorText(e, "指纹登记失败")}（文件已落盘，可先下载校验）`;
  }
}

/**
 * 兜底轮询任务状态。
 *
 * @param job 任务行
 * @param md5 本地算出的整文件 MD5
 */
async function pollJob(job: UploadJob, md5: string): Promise<void> {
  for (let i = 0; i < 40; i += 1) {
    await new Promise(resolve => setTimeout(resolve, 1500));
    if (job.state !== "merging") {
      return;
    }
    try {
      const snapshot = await getUploadTask(job.taskId);
      if (String(snapshot?.state || "").toUpperCase() === "COMPLETED") {
        await confirmJob(job, md5);
        return;
      }
      if (String(snapshot?.state || "").toUpperCase() === "FAILED") {
        job.state = "error";
        job.error = (snapshot as { message?: string })?.message || "服务端合并失败";
        return;
      }
    } catch {
      // 轮询失败不打断：下一次再试
    }
  }
}

/**
 * 标记完成并刷新当前目录。
 *
 * @param job 任务行
 */
function finishJob(job: UploadJob): void {
  job.state = "done";
  job.progress = 100;
  if (job.dir === path.value) {
    void load(true);
  }
}

/**
 * 用任务快照更新进度。
 *
 * @param job  任务行
 * @param task 快照
 */
function applyProgress(job: UploadJob, task: ReleaseUploadTask): void {
  if (!task.totalSize) {
    return;
  }
  const done = Number(task.receivedBytes || 0);
  job.progress = Math.min(99, Math.round((done / Number(task.totalSize)) * 100));
}

/** 上传进度流：整个页面只开一条，离开时关闭 */
function ensureUploadSse(): void {
  if (uploadSse) {
    return;
  }
  uploadSse = subscribeUploadTasks(task => {
    if (!task.taskId) {
      return;
    }
    const job = uploads.value.find(it => it.taskId === task.taskId);
    if (!job) {
      return;
    }
    const state = String(task.state || "").toUpperCase();
    if (state === "COMPLETED") {
      finishJob(job);
    } else if (state === "FAILED") {
      job.state = "error";
      job.error = "服务端合并失败";
    } else {
      applyProgress(job, task);
    }
  });
}

/** 关掉进度流 */
function closeUploadSse(): void {
  uploadSse?.close();
  uploadSse = null;
}

/** 清掉已完成 / 失败的行 */
function clearFinishedUploads(): void {
  uploads.value = uploads.value.filter(it => it.state !== "done" && it.state !== "error");
}

/**
 * 重试失败的上传。
 *
 * @param job 任务行
 */
function retryUpload(job: UploadJob): void {
  job.state = "hashing";
  job.progress = 0;
  job.error = "";
  job.taskId = "";
  void runQueue();
}

/**
 * 拖入文件：落到目标目录（不改变当前浏览位置）。
 *
 * @param files 文件
 * @param dir   目标目录条目
 */
function onDropFiles(files: File[], dir?: ReleaseHostFileItem): void {
  const target = dir?.key ?? path.value;
  if (!files.length) {
    return;
  }
  enqueue(files, target);
  if (dir && dir.key !== path.value) {
    message.info(`已加入队列：上传到 /${dir.key}`);
  }
}

/* ==================== 工具 ==================== */

/**
 * 复制文本并提示。
 *
 * @param text  文本
 * @param label 对象名
 */
async function copyText(text: string, label: string): Promise<void> {
  if (!text) {
    return;
  }
  try {
    await navigator.clipboard.writeText(text);
    message.success(`已复制${label}`);
  } catch {
    const area = document.createElement("textarea");
    area.value = text;
    area.style.position = "fixed";
    area.style.opacity = "0";
    document.body.appendChild(area);
    area.select();
    const ok = document.execCommand("copy");
    document.body.removeChild(area);
    if (ok) {
      message.success(`已复制${label}`);
    } else {
      message.warning("浏览器不允许自动复制，请手动选中");
    }
  }
}

/**
 * 键盘：Esc 关详情、Delete 删除所选、Ctrl+A 全选、Backspace 上级。
 *
 * @param event 键盘事件
 */
function onKeydown(event: KeyboardEvent): void {
  const target = event.target as HTMLElement | null;
  if (target && (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable)) {
    return;
  }
  if (event.key === "Escape") {
    detailKey.value = "";
    clearSelection();
    return;
  }
  if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "a") {
    event.preventDefault();
    message.info("当前不支持整页全选：请用表头勾选框选择当前页条目");
    return;
  }
  if (event.key === "Delete" && selectedRows.value.length) {
    event.preventDefault();
    void removeItems(selectedItems.value);
    return;
  }
  if (event.key === "Backspace" && path.value) {
    event.preventDefault();
    navigate(parentKey(path.value));
  }
}

onMounted(() => {
  void init();
  window.addEventListener("keydown", onKeydown);
});

onBeforeUnmount(() => {
  window.removeEventListener("keydown", onKeydown);
  closeUploadSse();
  if (searchTimer) {
    clearTimeout(searchTimer);
  }
});
</script>

<template>
  <div class="px tel-page hf-page">
    <div class="hf-head">
      <ReSectionHead description="运行本服务的这台机器 · 文件存储里的包与目录，可直接作为发布升级产物">
        <template #title>主机文件</template>
        <template #actions>
          <ReButton icon="Refresh" :loading="loading" @click="refresh">刷新</ReButton>
          <ReButton v-if="config.local" icon="FolderAdd" @click="openMkdir">新建文件夹</ReButton>
          <ReButton type="primary" icon="Upload" :disabled="!config.enabled" @click="pickFiles">上传文件</ReButton>
        </template>
      </ReSectionHead>
    </div>

    <input ref="fileInput" type="file" multiple class="hf-input" @change="onFilesPicked" />

    <div v-if="initializing" class="hf-boot">正在读取存储信息…</div>

    <div v-else class="hf-wrap">
      <!-- 左栏：存储 / 位置 / 类型 / 传输 -->
      <aside class="hf-rail">
        <section class="hf-card">
          <header class="hf-card-head">存储</header>
          <div class="hf-storage">
            <span class="pdot" :class="config.enabled ? 'pdot-online' : 'pdot-offline'" />
            <b class="hf-storage-name">{{ config.bucket || "未配置" }}</b>
            <span class="hf-tag">{{ config.local ? "本地存储" : "对象存储" }}</span>
          </div>
          <button
            v-if="config.root"
            type="button"
            class="hf-root mono"
            :title="`${config.root}（点击复制）`"
            @click="copyText(config.root, '存储根目录')"
          >
            {{ config.root }}
          </button>
          <div class="hf-metrics">
            <span><b>{{ items.length }}</b> 项</span>
            <span><b>{{ dirCount }}</b> 目录</span>
            <span><b>{{ fileCount }}</b> 文件</span>
            <span>合计 <b>{{ formatSize(totalSize) }}</b></span>
          </div>
          <p class="hf-tip">
            {{ config.local ? "安装包与压缩包都可以直接选作升级产物。" : "对象存储上没有本机路径，MD5 / 重命名不可用。" }}
          </p>
        </section>

        <section v-if="config.buckets.length > 1" class="hf-card">
          <header class="hf-card-head">存储位置</header>
          <div class="hf-locations">
            <button
              v-for="name in config.buckets"
              :key="name"
              type="button"
              class="hf-loc"
              :class="{ on: name === bucket }"
              @click="bucket = name"
            >
              <ReIcon name="Coin" :size="13" />
              <span>{{ name }}</span>
            </button>
          </div>
        </section>

        <section class="hf-card">
          <header class="hf-card-head">
            类型
            <span class="hf-card-sub">本页 {{ items.length }} 项</span>
          </header>
          <div class="hf-kinds">
            <button type="button" class="hf-kind" :class="{ on: kindFilter === '' }" @click="kindFilter = ''">
              <span>全部</span><b>{{ items.length }}</b>
            </button>
            <button
              v-for="kind in KIND_OPTIONS"
              :key="kind.value"
              type="button"
              class="hf-kind"
              :class="{ on: kindFilter === kind.value, 'is-empty': !kindCounts[kind.value] }"
              @click="kindFilter = kindFilter === kind.value ? '' : kind.value"
            >
              <span>{{ kind.label }}</span><b>{{ kindCounts[kind.value] ?? 0 }}</b>
            </button>
          </div>
          <p v-if="packageCount" class="hf-tip">本页有 {{ packageCount }} 个可直接投放的运行包。</p>
        </section>

        <section v-if="uploads.length" class="hf-card">
          <header class="hf-card-head">
            传输
            <span class="hf-card-sub">{{ activeUploads }} 进行中</span>
            <button type="button" class="hf-card-link" @click="clearFinishedUploads">清空已完成</button>
          </header>
          <div class="hf-uploads">
            <div v-for="job in uploads" :key="job.id" class="hf-up" :class="`is-${job.state}`">
              <div class="hf-up-top">
                <span class="hf-up-name" :title="job.name">{{ job.name }}</span>
                <span class="hf-up-size">{{ formatSize(job.size) }}</span>
              </div>
              <div class="hf-up-bar"><i :style="{ width: job.progress + '%' }" /></div>
              <div class="hf-up-foot">
                <span v-if="job.state === 'hashing'">本地指纹 {{ job.progress }}%</span>
                <span v-else-if="job.state === 'uploading'">上传 {{ job.progress }}%</span>
                <span v-else-if="job.state === 'merging'">合并中…</span>
                <span v-else-if="job.state === 'done'">已完成</span>
                <span v-else class="hf-up-error" :title="job.error">{{ job.error }}</span>
                <button v-if="job.state === 'error'" type="button" class="hf-up-retry" @click="retryUpload(job)">
                  重试
                </button>
              </div>
            </div>
          </div>
        </section>
      </aside>

      <!-- 主区：工具条 + 目录 -->
      <section class="hf-main">
        <div class="hf-toolbar">
          <div class="hf-nav">
            <button type="button" class="hf-icon-btn" title="后退 (Alt+←)" :disabled="!canBack" @click="goBack">
              <ReIcon name="ArrowLeft" :size="14" />
            </button>
            <button type="button" class="hf-icon-btn" title="前进" :disabled="!canForward" @click="goForward">
              <ReIcon name="ArrowRight" :size="14" />
            </button>
            <button
              type="button"
              class="hf-icon-btn"
              title="上级目录 (Backspace)"
              :disabled="!path"
              @click="navigate(parentKey(path))"
            >
              <ReIcon name="Top" :size="14" />
            </button>
          </div>

          <nav class="hf-crumbs" aria-label="目录路径">
            <template v-for="(node, index) in breadcrumbOf(path)" :key="node.key || 'root'">
              <span v-if="index" class="hf-sep">/</span>
              <button
                type="button"
                class="hf-crumb"
                :class="{ on: index === breadcrumbOf(path).length - 1 }"
                :title="node.key || '存储根'"
                @click="navigate(node.key)"
              >
                {{ node.label }}
              </button>
            </template>
          </nav>

          <div class="hf-tools">
            <label class="hf-search">
              <ReIcon name="Search" :size="13" />
              <input v-model="keyword" type="search" placeholder="搜索当前目录" spellcheck="false" />
            </label>
            <div class="hf-view">
              <button
                type="button"
                class="hf-icon-btn"
                :class="{ on: view === 'list' }"
                title="列表"
                @click="view = 'list'"
              >
                <ReIcon name="Tickets" :size="14" />
              </button>
              <button
                type="button"
                class="hf-icon-btn"
                :class="{ on: view === 'grid' }"
                title="图标"
                @click="view = 'grid'"
              >
                <ReIcon name="Grid" :size="14" />
              </button>
            </div>
          </div>
        </div>

        <HostFileBrowser
          ref="browserRef"
          :items="visibleItems"
          :sort="sort"
          :order="order"
          :loading="loading"
          :error="error"
          :truncated="truncated"
          :view="view"
          @sort="changeSort"
          @selection-change="onSelectionChange"
          @open="item => (item.directory ? navigate(item.key) : openDetail(item))"
          @menu-select="onMenuSelect"
          @drop-files="onDropFiles"
        />
        <div v-if="selectedRows.length" class="hf-batch">
          <span class="hf-batch-count">已选 {{ selectedRows.length }} 项</span>
          <span class="hf-batch-size">合计 {{ formatSize(selectedSize) }}</span>
          <span class="hf-grow" />
          <button type="button" class="hf-batch-btn" @click="downloadSelected">下载所选</button>
          <button type="button" class="hf-batch-btn hf-batch-btn--danger" @click="removeItems(selectedItems)">
            删除所选
          </button>
          <button type="button" class="hf-batch-btn" @click="clearSelection">取消选择</button>
        </div>

        <div class="hf-foot">
          <span>
            共 {{ total }} 项<template v-if="kindFilter"> · 筛选「{{ kindLabel(kindFilter) }}」{{ visibleItems.length }} 项</template>
            <template v-if="keyword"> · 搜索「{{ keyword }}」</template>
          </span>
          <span class="hf-grow" />
          <span>{{ config.enabled ? "拖拽文件到窗口即可上传；Shift + 点击可连续选中" : "文件存储未启用" }}</span>
        </div>
      </section>

      <!-- 右栏：详情 -->
      <HostFileDetail
        v-if="detailItem"
        :item="detailItem"
        :root="config.root"
        :bucket="bucket"
        :local="config.local"
        @close="detailKey = ''"
        @rename="openRename"
        @remove="item => removeItems([item])"
      />
    </div>

    <ReDialog
      v-model="nameDialog.open"
      :title="nameDialog.mode === 'mkdir' ? '新建文件夹' : '重命名'"
      width="380px"
      append-to-body
    >
      <input
        v-model="nameDialog.value"
        class="hf-name-input"
        :placeholder="nameDialog.mode === 'mkdir' ? '文件夹名称' : '新名称'"
        @keyup.enter="submitName"
      />
      <p class="hf-name-hint">
        当前位置：<span class="mono">{{ path ? "/" + path : "/（存储根）" }}</span>
      </p>
      <template #footer>
        <el-button @click="nameDialog.open = false">取消</el-button>
        <el-button type="primary" :loading="nameDialog.saving" :disabled="!nameDialog.value.trim()" @click="submitName">
          {{ nameDialog.mode === "mkdir" ? "创建" : "保存" }}
        </el-button>
      </template>
    </ReDialog>

    <ReDialog
      v-model="pushDialog.open"
      title="上传到项目"
      width="440px"
      append-to-body
      :close-on-click-modal="false"
    >
      <div class="hf-push">
        <div class="hf-push-file">
          <span class="hf-push-file-icon"><ReIcon name="Box" :size="16" /></span>
          <div class="hf-push-file-text">
            <b :title="pushDialog.item?.name">{{ pushDialog.item?.name }}</b>
            <span class="dim">{{ pushDialog.item ? formatSize(pushDialog.item.size) : "" }}</span>
          </div>
        </div>
        <label class="hf-push-field">
          <span>发布</span>
          <el-select
            v-model="pushDialog.releaseId"
            placeholder="选择发布（对应目标主机）"
            style="width: 100%"
            :loading="pushDialog.loading"
            @change="onPushReleaseChange"
          >
            <el-option
              v-for="r in pushDialog.releases"
              :key="r.id"
              :label="r.releaseName"
              :value="r.id"
            />
          </el-select>
        </label>
        <label class="hf-push-field">
          <span>项目</span>
          <el-select
            v-model="pushDialog.projectId"
            placeholder="选择要投放的项目"
            style="width: 100%"
            :disabled="!pushDialog.releaseId"
          >
            <el-option
              v-for="p in pushDialog.projects"
              :key="p.id"
              :label="p.projectName"
              :value="p.id"
            />
          </el-select>
        </label>
        <p class="hf-push-tip">
          文件会投放到目标项目的 uploads/ 目录，<b>不触发升级</b>；需要升级时再到发布管理里操作。
        </p>
      </div>
      <template #footer>
        <el-button @click="pushDialog.open = false">取消</el-button>
        <el-button type="primary" :loading="pushDialog.pushing" :disabled="!pushDialog.projectId" @click="submitPush">
          投放
        </el-button>
      </template>
    </ReDialog>
  </div>
</template>

<style scoped>
.hf-page {
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: 12px 14px 10px;
  min-height: 100%;
}

.hf-head { flex: none; }
.hf-input { display: none; }
.hf-boot {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--text-tertiary);
  font-size: 13px;
}

.hf-wrap {
  flex: 1;
  min-height: 0;
  display: flex;
  align-items: stretch;
  gap: 12px;
}

/* ---------- 左栏 ---------- */
.hf-rail {
  flex: none;
  width: 214px;
  display: flex;
  flex-direction: column;
  gap: 10px;
  overflow: auto;
  padding-right: 2px;
}

.hf-card {
  border: 1px solid var(--border-subtle);
  border-radius: 12px;
  background: var(--bg-container);
  padding: 10px 12px 12px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.hf-card-head {
  display: flex;
  align-items: baseline;
  gap: 6px;
  font-size: 12px;
  font-weight: 600;
  color: var(--text-secondary);
}
.hf-card-sub { font-weight: 400; color: var(--text-tertiary); font-size: 11px; }
.hf-card-link {
  margin-left: auto;
  border: 0;
  background: transparent;
  color: var(--text-tertiary);
  font-size: 11px;
  cursor: pointer;
  padding: 0;
}
.hf-card-link:hover { color: var(--brand-500); }

.hf-storage {
  display: flex;
  align-items: center;
  gap: 6px;
  min-width: 0;
}
.hf-storage-name {
  font-size: 13px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.hf-tag {
  flex: none;
  margin-left: auto;
  font-size: 10px;
  color: var(--text-tertiary);
  border: 1px solid var(--border-subtle);
  border-radius: 4px;
  padding: 0 4px;
  line-height: 16px;
}
.hf-root {
  display: block;
  width: 100%;
  text-align: left;
  border: 0;
  border-radius: 6px;
  background: var(--bg-fill);
  color: var(--text-secondary);
  padding: 5px 7px;
  font-size: 11px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  cursor: copy;
}
.hf-root:hover { background: var(--bg-fill-secondary); }
.hf-metrics {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 4px 8px;
  font-size: 11.5px;
  color: var(--text-tertiary);
}
.hf-metrics b { color: var(--text-primary); font-weight: 600; }
.hf-tip {
  margin: 0;
  font-size: 11px;
  line-height: 1.55;
  color: var(--text-tertiary);
}

.hf-locations { display: flex; flex-direction: column; gap: 2px; }
.hf-loc {
  display: flex;
  align-items: center;
  gap: 6px;
  border: 0;
  border-radius: 6px;
  background: transparent;
  color: var(--text-secondary);
  padding: 4px 6px;
  font-size: 12px;
  text-align: left;
  cursor: pointer;
}
.hf-loc:hover { background: var(--bg-fill); }
.hf-loc.on { background: color-mix(in srgb, var(--brand-500) 12%, transparent); color: var(--brand-600); }
.hf-loc span { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }

.hf-kinds { display: grid; grid-template-columns: 1fr 1fr; gap: 3px; }
.hf-kind {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 6px;
  border: 0;
  border-radius: 6px;
  background: transparent;
  color: var(--text-secondary);
  padding: 3px 6px;
  font-size: 12px;
  cursor: pointer;
}
.hf-kind b { font-weight: 500; color: var(--text-tertiary); font-variant-numeric: tabular-nums; font-size: 11px; }
.hf-kind:hover { background: var(--bg-fill); }
.hf-kind.on { background: color-mix(in srgb, var(--brand-500) 12%, transparent); color: var(--brand-600); }
.hf-kind.on b { color: var(--brand-600); }
.hf-kind.is-empty { opacity: 0.45; }

.hf-uploads { display: flex; flex-direction: column; gap: 9px; max-height: 220px; overflow: auto; }
.hf-up { display: flex; flex-direction: column; gap: 4px; }
.hf-up-top { display: flex; align-items: baseline; gap: 8px; }
.hf-up-name {
  flex: 1;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: 12px;
  color: var(--text-primary);
}
.hf-up-size { flex: none; font-size: 10.5px; color: var(--text-tertiary); }
.hf-up-bar { height: 4px; border-radius: 2px; background: var(--bg-fill-secondary); overflow: hidden; }
.hf-up-bar i { display: block; height: 100%; background: var(--brand-500); transition: width 0.2s linear; }
.hf-up.is-error .hf-up-bar i { background: var(--status-error); }
.hf-up.is-done .hf-up-bar i { background: var(--status-success); }
.hf-up-foot {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 11px;
  color: var(--text-tertiary);
}
.hf-up-error {
  flex: 1;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  color: var(--status-error);
}
.hf-up-retry {
  margin-left: auto;
  border: 0;
  background: transparent;
  color: var(--brand-500);
  font-size: 11px;
  cursor: pointer;
  padding: 0;
}

/* ---------- 主区 ---------- */
.hf-main {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.hf-toolbar {
  flex: none;
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 8px;
  border: 1px solid var(--border-subtle);
  border-radius: 10px;
  background: var(--bg-container);
}
.hf-nav { display: flex; gap: 2px; flex: none; }
.hf-icon-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 26px;
  height: 26px;
  border: 0;
  border-radius: 6px;
  background: transparent;
  color: var(--text-secondary);
  cursor: pointer;
}
.hf-icon-btn:hover:not(:disabled) { background: var(--bg-fill); color: var(--text-primary); }
.hf-icon-btn:disabled { opacity: 0.35; cursor: not-allowed; }
.hf-icon-btn.on { background: color-mix(in srgb, var(--brand-500) 12%, transparent); color: var(--brand-500); }

.hf-crumbs {
  flex: 1;
  min-width: 0;
  display: flex;
  align-items: center;
  gap: 2px;
  overflow-x: auto;
  scrollbar-width: none;
  padding: 0 2px;
}
.hf-crumbs::-webkit-scrollbar { display: none; }
.hf-sep { color: var(--text-tertiary); font-size: 11px; }
.hf-crumb {
  flex: none;
  border: 0;
  border-radius: 5px;
  background: transparent;
  color: var(--text-secondary);
  font-size: 12.5px;
  padding: 2px 5px;
  cursor: pointer;
  max-width: 180px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.hf-crumb:hover { background: var(--bg-fill); color: var(--text-primary); }
.hf-crumb.on { color: var(--text-primary); font-weight: 600; }

.hf-tools { flex: none; display: flex; align-items: center; gap: 8px; }
.hf-search {
  display: flex;
  align-items: center;
  gap: 5px;
  height: 26px;
  padding: 0 8px;
  border: 1px solid var(--border-subtle);
  border-radius: 7px;
  background: var(--bg-fill);
  color: var(--text-tertiary);
}
.hf-search:focus-within { border-color: var(--brand-500); background: var(--bg-container); }
.hf-search input {
  width: 150px;
  border: 0;
  background: transparent;
  color: var(--text-primary);
  font-size: 12px;
  outline: none;
}
.hf-view { display: flex; gap: 2px; }

.hf-batch {
  flex: none;
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 5px 10px;
  border: 1px solid color-mix(in srgb, var(--brand-500) 30%, transparent);
  border-radius: 9px;
  background: color-mix(in srgb, var(--brand-500) 7%, var(--bg-container));
  font-size: 12px;
  color: var(--text-secondary);
}
.hf-batch-count { font-weight: 600; color: var(--brand-600); }
.hf-batch-size { color: var(--text-tertiary); }
.hf-grow { flex: 1; }
.hf-batch-btn {
  border: 1px solid var(--border-secondary);
  background: var(--bg-container);
  color: var(--text-secondary);
  border-radius: 6px;
  padding: 2px 9px;
  font-size: 11.5px;
  cursor: pointer;
}
.hf-batch-btn:hover { border-color: var(--brand-500); color: var(--brand-500); }
.hf-batch-btn--danger:hover { border-color: var(--status-error); color: var(--status-error); }

.hf-foot {
  flex: none;
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 0 2px;
  font-size: 11.5px;
  color: var(--text-tertiary);
}

/* ---------- 弹窗 ---------- */
.hf-name-input {
  width: 100%;
  height: 32px;
  padding: 0 10px;
  border: 1px solid var(--border-secondary);
  border-radius: 7px;
  background: var(--bg-container);
  color: var(--text-primary);
  font-size: 13px;
  outline: none;
  box-sizing: border-box;
}
.hf-name-input:focus { border-color: var(--brand-500); }
.hf-name-hint {
  margin: 8px 0 0;
  font-size: 11.5px;
  color: var(--text-tertiary);
}

/* ---------- 上传到项目弹窗 ---------- */
.hf-push {
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.hf-push-file {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 12px;
  border: 1px solid var(--border-subtle);
  border-radius: 10px;
  background: var(--bg-fill);
}
.hf-push-file-icon {
  flex: none;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border-radius: 8px;
  color: #fff;
  background: var(--brand-500);
}
.hf-push-file-text {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
}
.hf-push-file-text b {
  color: var(--text-primary);
  font-size: 13px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.hf-push-field {
  display: flex;
  flex-direction: column;
  gap: 4px;
  font-size: 12px;
  color: var(--text-secondary);
}
.hf-push-tip {
  margin: 0;
  font-size: 11.5px;
  line-height: 1.6;
  color: var(--text-tertiary);
}
.hf-push-tip b {
  color: var(--text-secondary);
}

@media (max-width: 1180px) {
  .hf-rail { width: 190px; }
  .hf-search input { width: 112px; }
}
@media (max-width: 960px) {
  .hf-wrap { flex-direction: column; }
  .hf-rail { width: 100%; flex-direction: row; flex-wrap: wrap; overflow: visible; }
  .hf-card { flex: 1 1 220px; }
}
</style>
