<!--
  上传任务页 —— 任务化分片上传的管理视图。

  职责边界（与 FileStorageManage 页解耦）：
    1) 上传动作只创建任务：选文件 + 选 bucket（从后端 /buckets 拉取）→ 分片上传 → complete；
       后台（时间轮 + 虚拟线程）负责合并与写入，本页只轮询展示状态。
    2) 任务列表：状态、进度（已收片数/总片数）、失败原因、取消/重传操作。

  数据来源：@pages/filesystem/api/filestorageApi 的 uploadTask* 系列（Spring 侧接口，
  走应用登录态，与文件服务器直连通道无关）。

  【重构 2026-10-24 · 主从工作台 Master-Detail】（增强版）
    布局：左列任务列表（搜索/筛选/分组/多选/速率） + 右列详情（完整元数据/下载/重传/取消）。
    数据点零丢失：文件名/大小/bucket/分片/进度/状态/说明(objectKey/message)/取消全部保留，
    并新增展示：chunkSize(分片大小)、bucket(桶路径)、createdAt(相对时间)、实时传输速率。
    交互新增：文件名搜索、状态筛选、列表按状态分组、多选批量取消、
             失败一键重传（File 引用缓存）、已完成文件下载（objectUrl/resolveObjectUrl）。
-->

<template>
  <div class="upload-task-page">
    <ReSectionHead
      class="upload-head"
      title="上传任务"
      description="任务化分片上传的管理视图：选文件与 bucket 创建任务，后台分片合并，本页只负责轮询展示状态"
    >
      <template #actions>
        <el-button
          size="small"
          text
          :loading="listLoading"
          @click="refreshTasks"
        ><el-icon><Refresh /></el-icon>刷新</el-button>
      </template>
    </ReSectionHead>

    <!-- 概览条：任务计数 + 传输总量（koi 令牌大数字 + 顶部色条） -->
    <div class="stat-grid" role="group" aria-label="上传任务概览">
      <div class="stat-card" style="--accent: var(--brand-500)">
        <span class="stat-label">任务总数</span>
        <span class="stat-value">{{ tasks.length }}</span>
        <span class="stat-trend">全部记录</span>
      </div>
      <div class="stat-card" style="--accent: var(--metric-cpu)">
        <span class="stat-label">进行中</span>
        <span class="stat-value">{{ tasks.filter(t => isActive(t.state)).length }}</span>
        <span class="stat-trend">上传 / 合并</span>
      </div>
      <div class="stat-card" style="--accent: var(--status-success)">
        <span class="stat-label">已完成</span>
        <span class="stat-value">{{ tasks.filter(t => t.state === "COMPLETED").length }}</span>
        <span class="stat-trend">后台合并完毕</span>
      </div>
      <div class="stat-card" style="--accent: var(--status-error)">
        <span class="stat-label">失败</span>
        <span class="stat-value">{{ tasks.filter(t => t.state === "FAILED").length }}</span>
        <span class="stat-trend">需要关注</span>
      </div>
      <div class="stat-card" style="--accent: var(--brand-500)">
        <span class="stat-label">传输总量</span>
        <span class="stat-value stat-value-sm">{{ formatSize(totalUploadedBytes) }}</span>
        <span class="stat-trend">
          <template v-if="totalSpeedBytes > 0">实时 {{ formatSpeed(totalSpeedBytes) }}</template>
          <template v-else>累计已收字节</template>
        </span>
      </div>
    </div>

    <!-- 顶部：发起上传（支持拖拽） -->
    <div
      class="upload-card koi-card"
      :class="{ 'is-dragover': dragOver }"
      @dragover.prevent="dragOver = true"
      @dragleave.prevent="dragOver = false"
      @drop.prevent="onDrop"
    >
      <div class="ut-upload-bar">
        <el-select
          v-model="provider"
          placeholder="选择 bucket（后台已开启）"
          class="ut-bucket-select"
          :loading="bucketsLoading"
          clearable
          size="small"
        >
          <el-option v-for="b in buckets" :key="b" :label="b" :value="b" />
        </el-select>
        <el-select v-model="chunkSizeMb" class="ut-chunk-select" size="small">
          <el-option v-for="n in [1, 5, 10, 20]" :key="n" :label="`分片 ${n} MB`" :value="n" />
        </el-select>
        <el-button type="primary" size="small" :loading="uploading" @click="pickFiles">
          <el-icon><Upload /></el-icon><span>{{ dragOver ? "松开即可上传" : "选择文件上传" }}</span>
        </el-button>
        <el-button size="small" :disabled="uploading" @click="taskInputRef?.click()">批量文件</el-button>
        <span class="ut-drop-hint" aria-hidden="true">或拖拽文件到此处</span>
        <input
          ref="singleInputRef"
          type="file"
          hidden
          @change="(e) => onFilesPicked(e, false)"
        />
        <input
          ref="taskInputRef"
          type="file"
          multiple
          hidden
          @change="(e) => onFilesPicked(e, true)"
        />
        <span v-if="uploading" class="ut-upload-hint">上传中…（后台分片合并，可关闭本页）</span>
      </div>
      <el-alert
        v-if="bucketError"
        :title="bucketError"
        type="warning"
        :closable="true"
        class="ut-bucket-alert"
      />
    </div>

    <!-- 文件记录（主从工作台：左列表 + 右详情，点选联动） -->
    <div class="md-wrap">
      <!-- 左：任务列表 -->
      <div class="md-list-card koi-card">
        <div class="md-card-hd">
          <span class="md-card-title">任务列表</span>
          <el-button size="small" text :icon="Refresh" :loading="listLoading" @click="refreshTasks" />
        </div>

        <!-- 搜索 + 状态筛选 -->
        <div class="md-toolbar">
          <el-input
            v-model="searchKeyword"
            size="small"
            clearable
            placeholder="搜索文件名"
            class="md-search"
          >
            <template #prefix><el-icon><Search /></el-icon></template>
          </el-input>
          <el-select v-model="stateFilter" size="small" class="md-filter" aria-label="状态筛选">
            <el-option label="全部状态" value="all" />
            <el-option label="进行中" value="active" />
            <el-option label="已完成" value="completed" />
            <el-option label="失败" value="failed" />
            <el-option label="已取消" value="cancelled" />
          </el-select>
        </div>

        <div v-if="tasks.length === 0" class="md-list-empty">
          <ReEmpty v-if="!listLoading" layout="modern" description="暂无上传任务，从上方发起上传">
            <el-button size="small" type="primary" @click="pickFiles">选择文件上传</el-button>
          </ReEmpty>
        </div>
        <template v-else>
          <div v-loading="listLoading" class="md-list-scroll">
            <!-- 分组渲染：进行中 / 已完成 / 失败 / 已取消 -->
            <div v-for="g in groupedTasks" :key="g.key" class="md-group">
              <div class="md-group-hd">
                <span class="md-dot" :class="g.dotClass"></span>
                <span class="md-group-name">{{ g.label }}</span>
                <span class="md-group-cnt">{{ g.tasks.length }}</span>
              </div>
              <ul class="md-list" role="listbox" :aria-label="g.label">
                <li
                  v-for="t in g.tasks"
                  :key="t.taskId"
                  class="md-item"
                  :class="{ 'is-selected': t.taskId === selectedTaskId }"
                  role="option"
                  :aria-selected="t.taskId === selectedTaskId"
                  @click="selectedTaskId = t.taskId"
                >
                  <el-checkbox
                    size="small"
                    :model-value="selectedIds.includes(t.taskId)"
                    @click.stop
                    @change="(v: boolean | string | number) => toggleSelect(t.taskId, Boolean(v))"
                    aria-label="选择任务"
                  />
                  <div class="md-item-main">
                    <div class="md-item-name" :title="t.fileName">{{ t.fileName }}</div>
                    <div class="md-item-sub">
                      {{ t.provider || "默认" }}<template v-if="t.bucket"> / {{ t.bucket }}</template>
                      · {{ t.receivedChunks }}/{{ t.totalChunks }} 片
                    </div>
                  </div>
                  <div class="md-item-side">
                    <span class="md-item-pct">{{ taskPercent(t) }}%</span>
                    <div class="md-mini-bar"><i :class="progClass(t.state)" :style="{ width: taskPercent(t) + '%' }" /></div>
                    <span v-if="speeds[t.taskId]" class="md-item-spd">{{ speeds[t.taskId] }}</span>
                  </div>
                  <span class="md-chev" aria-hidden="true">›</span>
                </li>
              </ul>
            </div>
          </div>

          <!-- 批量操作条 -->
          <div v-if="selectedIds.length" class="md-bulk">
            <span class="md-bulk-info">已选 {{ selectedIds.length }} 个任务</span>
            <el-button size="small" text type="primary" @click="selectAllFiltered">全选当前筛选</el-button>
            <el-popconfirm title="确定批量取消选中的可取消任务？" @confirm="batchCancel">
              <template #reference>
                <el-button size="small" text type="danger">批量取消</el-button>
              </template>
            </el-popconfirm>
            <el-button size="small" text @click="selectedIds = []">清空</el-button>
          </div>
        </template>
      </div>

      <!-- 右：选中任务详情 -->
      <div class="md-detail-card koi-card">
        <template v-if="selectedTask">
          <div class="md-detail-hd">
            <span class="md-card-title">任务详情</span>
            <span class="md-state-badge" :class="stateBadgeClass(selectedTask.state)">
              <span class="md-dot" :class="stateDotClass(selectedTask.state)"></span>{{ stateLabel(selectedTask.state) }}
            </span>
          </div>
          <div class="md-detail-body">
            <h3 class="md-detail-name" :title="selectedTask.fileName">{{ selectedTask.fileName }}</h3>

            <div class="md-progress">
              <div class="md-progress-bar">
                <i :class="progClass(selectedTask.state)" :style="{ width: taskPercent(selectedTask) + '%' }" />
              </div>
              <div class="md-progress-meta">
                {{ selectedTask.receivedChunks }}/{{ selectedTask.totalChunks }} 片 · {{ taskPercent(selectedTask) }}%
                <span v-if="isActive(selectedTask.state)" class="md-live" aria-hidden="true"></span>
                <span v-if="speeds[selectedTask.taskId]" class="md-live-spd">{{ speeds[selectedTask.taskId] }}</span>
              </div>
            </div>

            <div class="md-kv">
              <div class="md-kv-item">
                <span class="md-kv-label">大小</span>
                <span class="md-kv-value">{{ formatSize(selectedTask.totalSize) }}</span>
              </div>
              <div class="md-kv-item">
                <span class="md-kv-label">分片大小</span>
                <span class="md-kv-value">{{ selectedTask.chunkSize > 0 ? formatSize(selectedTask.chunkSize) : "-" }}</span>
              </div>
              <div class="md-kv-item">
                <span class="md-kv-label">提供者</span>
                <span class="md-bucket" :class="{ 'is-default': !selectedTask.provider }">{{ selectedTask.provider || "默认" }}</span>
              </div>
              <div class="md-kv-item">
                <span class="md-kv-label">桶路径</span>
                <span class="md-kv-value md-kv-ellipsis" :title="selectedTask.bucket || '-'">{{ selectedTask.bucket || "-" }}</span>
              </div>
              <div class="md-kv-item">
                <span class="md-kv-label">objectKey</span>
                <span class="md-kv-value md-kv-ellipsis" :title="selectedTask.objectKey || '-'">{{ selectedTask.objectKey || "-" }}</span>
              </div>
              <div class="md-kv-item">
                <span class="md-kv-label">任务号</span>
                <span class="md-kv-value md-kv-ellipsis" :title="selectedTask.taskId">{{ selectedTask.taskId }}</span>
              </div>
              <div class="md-kv-item">
                <span class="md-kv-label">创建时间</span>
                <span class="md-kv-value">{{ formatRelTime(selectedTask.createdAt) }}</span>
              </div>
              <div class="md-kv-item">
                <span class="md-kv-label">任务状态</span>
                <span class="md-kv-value">{{ stateLabel(selectedTask.state) }}</span>
              </div>
            </div>

            <div v-if="selectedTask.message" class="md-msg" :class="{ 'is-error': selectedTask.state === 'FAILED' }">
              {{ selectedTask.message }}
            </div>

            <div class="md-detail-actions">
              <!-- 已完成：下载 -->
              <el-button
                v-if="selectedTask.state === 'COMPLETED' && selectedTask.objectKey"
                type="success"
                plain
                size="small"
                @click="downloadObject(selectedTask)"
              >
                <el-icon><Download /></el-icon>下载文件
              </el-button>
              <!-- 失败：一键重传 -->
              <el-tooltip
                v-if="selectedTask.state === 'FAILED'"
                :disabled="canRetry(selectedTask)"
                content="本地无该文件的字节缓存（本会话上传/选择的文件可重传），或需重新选择文件"
                placement="top"
              >
                <span>
                  <el-button
                    type="primary"
                    plain
                    size="small"
                    :disabled="!canRetry(selectedTask)"
                    :loading="retrying === selectedTask.taskId"
                    @click="retryTask(selectedTask)"
                  >
                    <el-icon><RefreshRight /></el-icon>重新上传
                  </el-button>
                </span>
              </el-tooltip>
              <!-- 取消（进行中/失败后可清分片） -->
              <el-popconfirm
                v-if="isActive(selectedTask.state) || selectedTask.state === 'FAILED'"
                :title="isActive(selectedTask.state) ? '确定取消该任务？' : '取消并清理分片？'"
                @confirm="onCancel(selectedTask)"
              >
                <template #reference>
                  <el-button type="danger" plain size="small" :disabled="!isActive(selectedTask.state) && selectedTask.state !== 'FAILED'">
                    取消任务
                  </el-button>
                </template>
              </el-popconfirm>
            </div>
          </div>
        </template>
        <div v-else class="md-detail-empty">从左侧选择一条任务查看详情</div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from "vue";
import { ElMessage } from "element-plus";
import { Download, Refresh, RefreshRight, Search, Upload } from "@element-plus/icons-vue";
import ReEmpty from "@repo/ui/re-empty";
import ReSectionHead from "@repo/ui/re-section-head";
import {
  SIMPLE_SYNC_MAX_MB,
  cancelUploadTask,
  completeUploadTask,
  createUploadTask,
  listUploadBuckets,
  listUploadTasks,
  objectUrl,
  resolveObjectUrl,
  subscribeUploadTasks,
  uploadFileSimple,
  uploadTaskChunk,
  type UploadTaskInfo,
  type UploadTaskState,
} from "../api/filestorageApi";

/** 可选 bucket（后端 /buckets 下发，不硬编码） */
const buckets = ref<string[]>([]);
/** 选中 bucket（空 = 默认提供者） */
const provider = ref("");
/** bucket 列表加载中 */
const bucketsLoading = ref(false);
/** bucket 列表失败提示 */
const bucketError = ref("");

/** 分片大小（MB） */
const chunkSizeMb = ref(5);

/** 任务列表 */
const tasks = ref<UploadTaskInfo[]>([]);
const listLoading = ref(false);

/** 主从工作台：当前选中的任务 id（默认选中第一项；列表刷新后若该项仍在则跟随） */
const selectedTaskId = ref<string>("");

/** 选中的任务对象（未选中或不存在时为 undefined） */
const selectedTask = computed<UploadTaskInfo | undefined>(() => {
  return tasks.value.find((t) => t.taskId === selectedTaskId.value) ?? tasks.value[0];
});

/** 是否有分片正在上传 */
const uploading = ref(false);
/** 拖拽悬停态 */
const dragOver = ref(false);

/** 文件名搜索关键字 */
const searchKeyword = ref("");
/** 状态筛选：all|active|completed|failed|cancelled */
const stateFilter = ref<"all" | "active" | "completed" | "failed" | "cancelled">("all");
/** 已勾选的任务 id（批量操作） */
const selectedIds = ref<string[]>([]);

/** 正在重传的任务 id（按钮 loading） */
const retrying = ref("");

/** 本会话选择过的文件引用（fileName -> File），供失败重传重放字节 */
const fileRefs = new Map<string, File>();

/** 传输速率：taskId -> 可读速率；由 3 秒采样器计算 */
const speeds = ref<Record<string, string>>({});
/** 速率采样快照（taskId -> 上次字节数+时间戳） */
const speedSnapshot = new Map<string, { bytes: number; ts: number }>();
/** 速率采样定时器 */
let speedTimer: ReturnType<typeof setInterval> | null = null;

const singleInputRef = ref<HTMLInputElement>();
const taskInputRef = ref<HTMLInputElement>();

/** 列表轮询句柄（SSE 失效时的兜底） */
let pollTimer: ReturnType<typeof setInterval> | null = null;

/** SSE 订阅取消函数 */
let unsubscribeSse: (() => void) | null = null;

// ==================== 过滤 / 分组 ====================

/** 搜索 + 状态筛选后的任务 */
const filteredTasks = computed<UploadTaskInfo[]>(() => {
  const kw = searchKeyword.value.trim().toLowerCase();
  return tasks.value.filter((t) => {
    if (stateFilter.value === "active" && !isActive(t.state)) return false;
    if (stateFilter.value === "completed" && t.state !== "COMPLETED") return false;
    if (stateFilter.value === "failed" && t.state !== "FAILED") return false;
    if (stateFilter.value === "cancelled" && t.state !== "CANCELLED") return false;
    if (kw && !t.fileName.toLowerCase().includes(kw)) return false;
    return true;
  });
});

/** 按状态分组（固定顺序：进行中 → 已完成 → 失败 → 已取消），空组不渲染 */
const groupedTasks = computed(() => {
  const groups: Array<{ key: string; label: string; dotClass: string; tasks: UploadTaskInfo[] }> = [
    { key: "active", label: "进行中", dotClass: "is-primary", tasks: [] },
    { key: "completed", label: "已完成", dotClass: "is-success", tasks: [] },
    { key: "failed", label: "失败", dotClass: "is-danger", tasks: [] },
    { key: "cancelled", label: "已取消", dotClass: "is-info", tasks: [] },
  ];
  for (const t of filteredTasks.value) {
    const g = t.state === "COMPLETED" ? groups[1] : t.state === "FAILED" ? groups[2] : t.state === "CANCELLED" ? groups[3] : groups[0];
    g.tasks.push(t);
  }
  return groups.filter((g) => g.tasks.length > 0);
});

/** 累计已收字节（传输总量） */
const totalUploadedBytes = computed(() => tasks.value.reduce((sum, t) => sum + (t.receivedBytes || 0), 0));

/** 实时总速率（B/s） */
const totalSpeedBytes = computed(() => {
  let total = 0;
  for (const v of Object.values(speeds.value)) {
    const n = parseFloat(v);
    if (!Number.isNaN(n)) total += n;
  }
  return total;
});

// ==================== 生命周期 ====================

onMounted(() => {
  loadBuckets();
  refreshTasks();
  // 实时推送：任务创建/分片进度/状态变化由后端 SSE 即时下发
  unsubscribeSse = subscribeUploadTasks(
    (snapshot) => {
      tasks.value = snapshot;
    },
    (task) => {
      const index = tasks.value.findIndex((t) => t.taskId === task.taskId);
      if (index >= 0) {
        tasks.value.splice(index, 1, task);
      } else {
        tasks.value.unshift(task);
      }
    },
  );
  // 兜底：SSE 断连重连间隙或推送丢失时，30 秒慢轮询补齐
  pollTimer = setInterval(refreshTasks, 30000);
  // 传输速率采样：每 3 秒对上传中的任务差分 receivedBytes
  speedTimer = setInterval(sampleSpeeds, 3000);
});

onBeforeUnmount(() => {
  unsubscribeSse?.();
  unsubscribeSse = null;
  if (pollTimer) {
    clearInterval(pollTimer);
    pollTimer = null;
  }
  if (speedTimer) {
    clearInterval(speedTimer);
    speedTimer = null;
  }
});

// ==================== 数据加载 ====================

/** 拉取后台已开启的 bucket */
async function loadBuckets() {
  bucketsLoading.value = true;
  bucketError.value = "";
  try {
    buckets.value = await listUploadBuckets();
    if (buckets.value.length === 0) {
      bucketError.value = "后台未开启任何 bucket（plugin.filesystem.providers 为空）";
    }
  } catch (e) {
    bucketError.value = (e as Error).message;
  } finally {
    bucketsLoading.value = false;
  }
}

/** 刷新任务列表 */
async function refreshTasks() {
  listLoading.value = true;
  try {
    tasks.value = await listUploadTasks();
    // 主从联动：列表刷新后保持选中项，若该项已不存在则回落到第一项
    if (selectedTaskId.value && !tasks.value.some((t) => t.taskId === selectedTaskId.value)) {
      selectedTaskId.value = tasks.value[0]?.taskId ?? "";
    }
  } catch {
    // 轮询失败静默，不打断页面
  } finally {
    listLoading.value = false;
  }
}

// ==================== 上传 / 选择 / 拖拽 ====================

/** 触发文件选择（单个入口与批量入口共用处理） */
function pickFiles() {
  taskInputRef.value?.click();
}

/** 拖拽放文件到上传卡 */
function onDrop(e: DragEvent) {
  dragOver.value = false;
  const files = Array.from(e.dataTransfer?.files ?? []);
  if (files.length) {
    void pickFilesFromList(files);
  }
}

/** 文件选择回调：逐个创建任务并分片上传 */
async function onFilesPicked(e: Event, _batch: boolean) {
  const input = e.target as HTMLInputElement;
  const files = Array.from(input.files ?? []);
  input.value = "";
  await pickFilesFromList(files);
}

/** 统一处理一组文件：小文件同步、大文件任务化分片，并缓存 File 引用 */
async function pickFilesFromList(files: File[]) {
  if (!files.length) {
    return;
  }
  for (const f of files) {
    fileRefs.set(f.name, f);
  }
  uploading.value = true;
  try {
    for (const file of files) {
      await uploadOne(file);
    }
    ElMessage.success(files.length === 1 ? "上传完成，后台合并中" : `${files.length} 个文件上传完成，后台合并中`);
  } catch (err) {
    ElMessage.error((err as Error).message);
  } finally {
    uploading.value = false;
    refreshTasks();
  }
}

/** 单文件上传：小文件同步直传，大文件任务化分片 */
async function uploadOne(file: File) {
  // 小文件同步（后端 /simple 直接写存储返回 COMPLETED）；大文件走任务链路
  if (file.size <= SIMPLE_SYNC_MAX_MB * 1024 * 1024) {
    await uploadFileSimple(file, { provider: provider.value || undefined });
    return;
  }
  await uploadLargeAsTask(file, provider.value || undefined, chunkSizeMb.value);
}

/** 大文件任务化分片：创建任务 → 逐片上传 → complete */
async function uploadLargeAsTask(file: File, providerName: string | undefined, chunkMb: number) {
  const task = await createUploadTask({
    fileName: file.name,
    totalSize: file.size,
    chunkSize: chunkMb * 1024 * 1024,
    provider: providerName,
  });
  const chunkSize = chunkMb * 1024 * 1024;
  const totalChunks = Math.max(task.totalChunks, 1);
  for (let index = 0; index < totalChunks; index++) {
    const start = index * chunkSize;
    const blob = file.slice(start, Math.min(start + chunkSize, file.size));
    await uploadTaskChunk(task.taskId, index, await blob.arrayBuffer());
  }
  await completeUploadTask(task.taskId);
}

// ==================== 取消 / 重传 / 下载 ====================

/** 取消任务（失败任务取消 = 清理分片） */
async function onCancel(row: UploadTaskInfo) {
  try {
    await cancelUploadTask(row.taskId);
    ElMessage.success(row.state === "FAILED" ? "已取消并清理分片" : "任务已取消");
    refreshTasks();
  } catch (e) {
    ElMessage.error((e as Error).message);
  }
}

/** 是否有本地 File 引用可重传 */
function canRetry(t: UploadTaskInfo): boolean {
  return t.state === "FAILED" && fileRefs.has(t.fileName);
}

/** 失败一键重传：用缓存的文件字节重建任务并重放分片 */
async function retryTask(t: UploadTaskInfo) {
  const file = fileRefs.get(t.fileName);
  if (!file) {
    ElMessage.warning("本地已无该文件的字节缓存，请重新选择文件上传");
    return;
  }
  retrying.value = t.taskId;
  try {
    // 保持原 bucket/provider 重放；分片大小沿用任务原始 chunkSize
    const chunkMb = t.chunkSize > 0 ? Math.max(1, Math.round(t.chunkSize / (1024 * 1024))) : chunkSizeMb.value;
    await uploadLargeAsTask(file, t.provider || undefined, chunkMb);
    ElMessage.success("重传完成，后台合并中");
  } catch (e) {
    ElMessage.error((e as Error).message);
  } finally {
    retrying.value = "";
    refreshTasks();
  }
}

/** 已完成文件下载：优先短时票据 URL，失败退化为无凭据直链 */
async function downloadObject(t: UploadTaskInfo) {
  if (!t.objectKey) {
    ElMessage.warning("该任务尚无 objectKey，无法下载");
    return;
  }
  const bucketName = t.bucket || t.provider || "local";
  try {
    const url = await resolveObjectUrl(bucketName, t.objectKey);
    window.open(url, "_blank", "noopener");
  } catch {
    window.open(objectUrl(bucketName, t.objectKey, true), "_blank", "noopener");
  }
}

/** 批量取消：仅取消可取消（进行中/失败）的任务 */
async function batchCancel() {
  const targets = tasks.value.filter((t) => selectedIds.value.includes(t.taskId) && (isActive(t.state) || t.state === "FAILED"));
  if (!targets.length) {
    ElMessage.info("选中的任务均不可取消");
    selectedIds.value = [];
    return;
  }
  try {
    for (const t of targets) {
      await cancelUploadTask(t.taskId);
    }
    ElMessage.success(`已取消 ${targets.length} 个任务`);
  } catch (e) {
    ElMessage.error((e as Error).message);
  } finally {
    selectedIds.value = [];
    refreshTasks();
  }
}

/** 勾选/取消勾选 */
function toggleSelect(taskId: string, checked: boolean) {
  if (checked) {
    if (!selectedIds.value.includes(taskId)) selectedIds.value.push(taskId);
  } else {
    selectedIds.value = selectedIds.value.filter((id) => id !== taskId);
  }
}

/** 全选当前筛选结果 */
function selectAllFiltered() {
  const ids = filteredTasks.value.map((t) => t.taskId);
  selectedIds.value = Array.from(new Set([...selectedIds.value, ...ids]));
}

// ==================== 展示辅助 ====================

/** 传输速率采样：对上传中的任务差分 receivedBytes */
function sampleSpeeds() {
  const now = Date.now();
  const running = tasks.value.filter((t) => t.state === "UPLOADING");
  const next: Record<string, string> = {};
  const nextSnapshot = new Map<string, { bytes: number; ts: number }>();
  for (const t of running) {
    const prev = speedSnapshot.get(t.taskId);
    nextSnapshot.set(t.taskId, { bytes: t.receivedBytes || 0, ts: now });
    if (prev && now > prev.ts && (t.receivedBytes || 0) >= prev.bytes) {
      const bps = ((t.receivedBytes || 0) - prev.bytes) / ((now - prev.ts) / 1000);
      if (bps > 0) next[t.taskId] = formatSpeed(bps);
    }
  }
  // 非上传中任务移除速率
  const keep: Record<string, string> = {};
  for (const id of running.map((t) => t.taskId)) {
    if (next[id]) keep[id] = next[id];
  }
  speeds.value = keep;
  speedSnapshot.clear();
  nextSnapshot.forEach((v, k) => speedSnapshot.set(k, v));
}

/** 任务进度百分比（合并中显示 100，完成看后端状态） */
function taskPercent(row: UploadTaskInfo): number {
  if (row.state === "COMPLETED" || row.state === "MERGING") {
    return 100;
  }
  if (row.totalChunks > 0) {
    return Math.round((row.receivedChunks / row.totalChunks) * 100);
  }
  if (row.totalSize > 0) {
    return Math.round((row.receivedBytes / row.totalSize) * 100);
  }
  return 0;
}

/** 进度条填充色（失败红、完成绿、其余主色） */
function progClass(state: UploadTaskState): string {
  if (state === "FAILED") {
    return "is-danger";
  }
  if (state === "COMPLETED") {
    return "is-success";
  }
  if (state === "CANCELLED") {
    return "is-info";
  }
  return "";
}

/** 状态色点 */
function stateDotClass(state: UploadTaskState): string {
  switch (state) {
    case "COMPLETED":
      return "is-success";
    case "FAILED":
      return "is-danger";
    case "CANCELLED":
      return "is-info";
    case "MERGING":
      return "is-warning";
    default:
      return "is-primary";
  }
}

/** 状态徽章描边色（与色点同语义） */
function stateBadgeClass(state: UploadTaskState): string {
  switch (state) {
    case "COMPLETED":
      return "is-success";
    case "FAILED":
      return "is-danger";
    case "CANCELLED":
      return "is-info";
    case "MERGING":
      return "is-warning";
    default:
      return "is-primary";
  }
}

function stateLabel(state: UploadTaskState): string {
  const labels: Record<UploadTaskState, string> = {
    UPLOADING: "上传中",
    MERGING: "合并中",
    COMPLETED: "已完成",
    FAILED: "失败",
    CANCELLED: "已取消",
  };
  return labels[state] ?? state;
}

function isActive(state: UploadTaskState): boolean {
  return state === "UPLOADING" || state === "MERGING";
}

/** 字节数可读化 */
function formatSize(bytes: number): string {
  if (!bytes || bytes <= 0) {
    return "-";
  }
  const units = ["B", "KB", "MB", "GB", "TB"];
  let value = bytes;
  let unit = 0;
  while (value >= 1024 && unit < units.length - 1) {
    value /= 1024;
    unit++;
  }
  return `${value.toFixed(value >= 100 || unit === 0 ? 0 : 1)} ${units[unit]}`;
}

/** 速率可读化 */
function formatSpeed(bps: number): string {
  if (!bps || bps <= 0) {
    return "";
  }
  if (bps >= 1024 * 1024) {
    return `${(bps / (1024 * 1024)).toFixed(1)} MB/s`;
  }
  if (bps >= 1024) {
    return `${(bps / 1024).toFixed(1)} KB/s`;
  }
  return `${Math.round(bps)} B/s`;
}

/** 相对时间 */
function formatRelTime(ts: number): string {
  if (!ts || ts <= 0) {
    return "-";
  }
  const diff = Date.now() - ts;
  if (diff < 60_000) {
    return "刚刚";
  }
  if (diff < 3600_000) {
    return `${Math.floor(diff / 60_000)} 分钟前`;
  }
  if (diff < 86400_000) {
    return `${Math.floor(diff / 3600_000)} 小时前`;
  }
  const d = new Date(ts);
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${mm}-${dd}`;
}
</script>

<style scoped lang="scss">
.upload-task-page {
  display: flex;
  flex-direction: column;
  gap: 14px;
  background: var(--bg-page, var(--el-bg-color-page, #f5f7fa));
  min-height: 100%;
}

/* ===== 页头（ReSectionHead 容器层） ===== */
.upload-head :deep(.re-section-head__title) { color: var(--text-primary); }
.upload-head :deep(.re-section-head__desc) { color: var(--text-secondary); }
.upload-head :deep(.re-section-head__actions) {
  flex-wrap: wrap;
}

/* ===== 概览条（koi 大数字 + 顶部色条） ===== */
.stat-grid {
  display: grid;
  grid-template-columns: repeat(5, minmax(0, 1fr));
  gap: 12px;
}
.stat-card {
  display: flex;
  flex-direction: column;
  gap: 4px;
  position: relative;
  overflow: hidden;
  padding: 14px 16px;
  background: var(--bg-container, #fff);
  border: 1px solid var(--border-subtle, var(--el-border-color-lighter, #e8ebf0));
  border-radius: var(--radius-lg, 12px);
  box-shadow: var(--shadow-sm);
  transition: box-shadow 0.2s var(--ease-out, ease), transform 0.2s var(--ease-out, ease);
}
.stat-card:hover {
  box-shadow: var(--shadow-md);
  transform: translateY(-1px);
}
.stat-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 3px;
  background: var(--accent, var(--brand-500));
  border-radius: var(--radius-lg, 12px) var(--radius-lg, 12px) 0 0;
}
.stat-label {
  font-size: 12px;
  font-weight: 500;
  letter-spacing: 0.02em;
  color: var(--text-secondary, var(--el-text-color-secondary, #909399));
}
.stat-value {
  font-size: 26px;
  font-weight: 700;
  line-height: 1.1;
  font-variant-numeric: tabular-nums;
  color: var(--text-primary, var(--el-text-color-primary, #303133));
}
.stat-value-sm {
  font-size: 22px;
}
.stat-trend {
  font-size: 11px;
  font-weight: 500;
  color: var(--text-tertiary, var(--el-text-color-secondary, #909399));
}
.stat-trend.is-down { color: var(--status-error); }

/* ===== 卡片壳 ===== */
.koi-card {
  background: var(--bg-container, #fff);
  border: 1px solid var(--border-subtle, var(--el-border-color-lighter, #e8ebf0));
  border-radius: var(--radius-lg, 12px);
  box-shadow: var(--shadow-sm);
  padding: 12px;
  transition: box-shadow 0.2s var(--ease-out, ease), border-color 0.2s;
}
.koi-card:hover {
  box-shadow: var(--shadow-md);
  border-color: var(--border-default, var(--el-border-color, #dcdfe6));
}

/* ===== 发起上传卡（可拖拽） ===== */
.ut-upload-bar {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
}

.upload-card.is-dragover {
  border-color: var(--el-color-primary, #409eff);
  border-style: dashed;
  background: var(--el-color-primary-light-9, #ecf5ff);
  box-shadow: var(--shadow-md);
}

/* 主按钮：主色渐变 + hover 上浮（koi 渐变按钮令牌） */
.ut-upload-bar :deep(.el-button--primary) {
  background: var(--brand-gradient, linear-gradient(135deg, #409eff, #79bbff));
  border: none;
  box-shadow: 0 2px 8px color-mix(in srgb, var(--brand-500, #409eff) 25%, transparent);
  transition: all 0.2s var(--ease-out, ease);
}
.ut-upload-bar :deep(.el-button--primary:hover) {
  transform: translateY(-1px);
  box-shadow: 0 4px 14px color-mix(in srgb, var(--brand-500, #409eff) 35%, transparent);
}

.ut-bucket-select {
  width: 220px;
}

.ut-chunk-select {
  width: 130px;
}

.ut-drop-hint {
  font-size: 12px;
  color: var(--text-tertiary, var(--el-text-color-secondary, #a8abb2));
}

.ut-upload-hint {
  color: var(--text-secondary, var(--el-text-color-secondary, #909399));
  font-size: 12px;
  display: inline-flex;
  align-items: center;
  gap: 6px;
}

.ut-upload-hint::before {
  content: "";
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: var(--brand-500, #409eff);
  animation: ut-pulse 1.2s ease-in-out infinite;
}

@keyframes ut-pulse {
  0%, 100% { opacity: 1; transform: scale(1); }
  50% { opacity: 0.4; transform: scale(0.75); }
}

@media (prefers-reduced-motion: reduce) {
  .ut-upload-hint::before { animation: none; }
  .ut-upload-bar :deep(.el-button--primary:hover) { transform: none; }
}

.ut-bucket-alert {
  margin-top: 10px;
  border-radius: var(--radius-md, 8px);
}

/* ===== 文件记录 · 主从工作台 ===== */
.md-wrap {
  display: grid;
  grid-template-columns: minmax(0, 1.35fr) minmax(0, 1fr);
  gap: 12px;
  align-items: stretch;
}

/* 卡片通用头 */
.md-card-hd {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  padding-bottom: 10px;
  margin-bottom: 6px;
  border-bottom: 1px solid var(--border-subtle, var(--el-border-color-lighter, #e8ebf0));
}
.md-card-title {
  font-weight: 600;
  font-size: 14px;
  color: var(--text-primary, var(--el-text-color-primary, #303133));
}
.md-card-hd :deep(.el-button) {
  color: var(--text-secondary, var(--el-text-color-secondary, #909399));
}

/* ===== 左列：搜索 / 筛选工具栏 ===== */
.md-toolbar {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
}
.md-search {
  flex: 1;
  min-width: 0;
}
.md-filter {
  width: 128px;
  flex: none;
}

/* ===== 左列：分组列表 ===== */
.md-list-scroll {
  max-height: 520px;
  overflow-y: auto;
}
.md-group + .md-group {
  margin-top: 10px;
}
.md-group-hd {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 2px 4px 6px;
  border-bottom: 1px dashed var(--border-subtle, var(--el-border-color-lighter, #e8ebf0));
  margin-bottom: 2px;
}
.md-group-name {
  font-size: 12px;
  font-weight: 600;
  color: var(--text-secondary, var(--el-text-color-secondary, #606266));
}
.md-group-cnt {
  margin-left: auto;
  font-size: 10.5px;
  color: var(--text-tertiary, #a8abb2);
  background: var(--bg-subtle, #f4f4f5);
  border-radius: 999px;
  padding: 0 7px;
  line-height: 1.6;
}

.md-list {
  list-style: none;
  margin: 0;
  padding: 0;
}
.md-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 9px 8px;
  border-radius: var(--el-radius-md, 8px);
  border: 1px solid transparent;
  cursor: pointer;
  transition: background-color 0.15s var(--ease-out, ease), border-color 0.15s;
}
.md-item:hover {
  background: var(--el-fill-color-light, #f5f7fa);
}
.md-item.is-selected {
  background: var(--el-color-primary-light-9, #ecf5ff);
  border-color: var(--el-color-primary-light-7, #b3d8ff);
}
.md-item + .md-item {
  margin-top: 2px;
}
.md-item :deep(.el-checkbox) {
  flex: none;
}

/* 列表色点 */
.md-dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  flex: none;
  background: var(--el-color-primary, #409eff);
}
.md-dot.is-success { background: var(--status-success, #67c23a); }
.md-dot.is-danger { background: var(--status-error, #f56c6c); }
.md-dot.is-warning { background: var(--status-warning, #e6a23c); }
.md-dot.is-info { background: var(--text-tertiary, #909399); }

.md-item-main {
  flex: 1;
  min-width: 0;
}
.md-item-name {
  font-size: 13px;
  font-weight: 500;
  color: var(--text-primary, var(--el-text-color-primary, #303133));
  line-height: 1.35;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.md-item-sub {
  font-size: 11px;
  color: var(--text-tertiary, var(--el-text-color-secondary, #909399));
  margin-top: 2px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.md-item-side {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 3px;
  flex: none;
}
.md-item-pct {
  font-size: 11px;
  font-weight: 500;
  font-variant-numeric: tabular-nums;
  color: var(--text-secondary, var(--el-text-color-secondary, #909399));
}
.md-item-spd {
  font-size: 10.5px;
  font-variant-numeric: tabular-nums;
  color: var(--status-success, #67c23a);
}
.md-mini-bar {
  width: 56px;
  height: 5px;
  border-radius: var(--el-radius-full, 9999px);
  background: var(--bg-subtle, var(--el-fill-color-light, #e8e8e8));
  overflow: hidden;
}
.md-mini-bar i {
  display: block;
  height: 100%;
  border-radius: inherit;
  background: var(--el-color-primary, #409eff);
  transition: width 0.3s var(--ease-out, ease);
}
.md-mini-bar i.is-success { background: var(--status-success, #67c23a); }
.md-mini-bar i.is-danger { background: var(--status-error, #f56c6c); }
.md-mini-bar i.is-warning { background: var(--status-warning, #e6a23c); }
.md-mini-bar i.is-info { background: var(--text-tertiary, #909399); }
.md-chev {
  color: var(--text-tertiary, #c0c4cc);
  font-size: 15px;
  flex: none;
}
.md-item.is-selected .md-chev {
  color: var(--el-color-primary, #409eff);
}
.md-list-empty {
  padding: 24px 8px;
}

/* ===== 批量操作条 ===== */
.md-bulk {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 8px;
  padding: 8px 10px;
  background: var(--el-color-primary-light-9, #ecf5ff);
  border: 1px solid var(--el-color-primary-light-7, #b3d8ff);
  border-radius: var(--el-radius-md, 8px);
}
.md-bulk-info {
  font-size: 12px;
  font-weight: 500;
  color: var(--el-color-primary, #409eff);
}

/* ===== 右列：任务详情 ===== */
.md-detail-card {
  padding: 12px;
  min-width: 0;
  display: flex;
  flex-direction: column;
}
.md-detail-hd {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  padding-bottom: 10px;
  margin-bottom: 10px;
  border-bottom: 1px solid var(--border-subtle, var(--el-border-color-lighter, #e8ebf0));
}
.md-state-badge {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  font-weight: 600;
  padding: 2px 10px;
  border-radius: var(--el-radius-full, 9999px);
  border: 1px solid transparent;
  white-space: nowrap;
}
.md-state-badge.is-primary { color: var(--el-color-primary, #409eff); background: var(--el-color-primary-light-9, #ecf5ff); border-color: var(--el-color-primary-light-7, #b3d8ff); }
.md-state-badge.is-success { color: var(--status-success, #67c23a); background: #f0f9eb; border-color: #c2e7b0; }
.md-state-badge.is-danger { color: var(--status-error, #f56c6c); background: #fef0f0; border-color: #fbc4c4; }
.md-state-badge.is-warning { color: var(--status-warning, #e6a23c); background: #fdf6ec; border-color: #f5dab1; }
.md-state-badge.is-info { color: var(--text-secondary, #909399); background: #f4f4f5; border-color: #e4e7ed; }

.md-detail-body {
  display: flex;
  flex-direction: column;
  gap: 14px;
}
.md-detail-name {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  color: var(--text-primary, var(--el-text-color-primary, #303133));
  line-height: 1.4;
  word-break: break-all;
}

/* 大进度条 */
.md-progress {
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.md-progress-bar {
  height: 8px;
  border-radius: var(--el-radius-full, 9999px);
  background: var(--bg-subtle, var(--el-fill-color-light, #e8e8e8));
  overflow: hidden;
}
.md-progress-bar i {
  display: block;
  height: 100%;
  border-radius: inherit;
  background: var(--el-color-primary, #409eff);
  transition: width 0.3s var(--ease-out, ease);
}
.md-progress-bar i.is-success { background: var(--status-success, #67c23a); }
.md-progress-bar i.is-danger { background: var(--status-error, #f56c6c); }
.md-progress-bar i.is-warning { background: var(--status-warning, #e6a23c); }
.md-progress-meta {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 12px;
  font-variant-numeric: tabular-nums;
  color: var(--text-secondary, var(--el-text-color-secondary, #909399));
}
.md-live {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: var(--el-color-primary, #409eff);
  animation: md-pulse 1.2s ease-in-out infinite;
}
.md-live-spd {
  color: var(--status-success, #67c23a);
  font-weight: 600;
}
@keyframes md-pulse {
  0%, 100% { opacity: 1; transform: scale(1); }
  50% { opacity: 0.4; transform: scale(0.75); }
}

/* 信息网格 */
.md-kv {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px;
}
.md-kv-item {
  display: flex;
  flex-direction: column;
  gap: 4px;
  background: var(--bg-subtle, var(--el-fill-color-lighter, #fafbfc));
  border: 1px solid var(--border-subtle, var(--el-border-color-lighter, #e8ebf0));
  border-radius: var(--el-radius-md, 8px);
  padding: 8px 10px;
  min-width: 0;
}
.md-kv-label {
  font-size: 11px;
  color: var(--text-tertiary, var(--el-text-color-secondary, #909399));
}
.md-kv-value {
  font-size: 12.5px;
  color: var(--text-primary, var(--el-text-color-primary, #303133));
  font-variant-numeric: tabular-nums;
}
.md-kv-ellipsis {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.md-bucket {
  display: inline-flex;
  align-items: center;
  align-self: flex-start;
  font-size: 11px;
  font-weight: 500;
  color: var(--el-color-primary, #409eff);
  background: var(--el-color-primary-light-9, #ecf5ff);
  border: 1px solid var(--el-color-primary-light-7, #b3d8ff);
  border-radius: var(--el-radius-sm, 6px);
  padding: 0 8px;
  line-height: 1.7;
  max-width: 100%;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.md-bucket.is-default {
  color: var(--text-secondary, #909399);
  background: var(--bg-subtle, #f4f4f5);
  border-color: var(--border-subtle, #e4e7ed);
}

/* 说明 / 失败原因 */
.md-msg {
  font-size: 12.5px;
  color: var(--text-secondary, var(--el-text-color-secondary, #606266));
  background: var(--bg-subtle, var(--el-fill-color-lighter, #fafbfc));
  border: 1px solid var(--border-subtle, var(--el-border-color-lighter, #e8ebf0));
  border-left: 3px solid var(--el-color-primary, #409eff);
  border-radius: var(--el-radius-md, 8px);
  padding: 9px 12px;
  line-height: 1.5;
  word-break: break-all;
}
.md-msg.is-error {
  border-left-color: var(--status-error, #f56c6c);
  color: var(--status-error, #f56c6c);
  background: #fef0f0;
}

.md-detail-actions {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}
.md-detail-empty {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--text-tertiary, var(--el-text-color-secondary, #909399));
  font-size: 13px;
  min-height: 200px;
}

/* ===== 响应式 ===== */
@media (max-width: 768px) {
  .stat-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
  .ut-bucket-select,
  .ut-chunk-select {
    width: 100%;
  }
  .md-wrap {
    grid-template-columns: minmax(0, 1fr);
  }
  .md-list-scroll {
    max-height: 320px;
  }
  .md-kv {
    grid-template-columns: minmax(0, 1fr);
  }
}

/* ===== 减少动态效果 ===== */
@media (prefers-reduced-motion: reduce) {
  .stat-card,
  .koi-card {
    transition: none;
  }
  .stat-card:hover,
  .koi-card:hover {
    transform: none;
  }
  .md-mini-bar i,
  .md-progress-bar i {
    transition: none;
  }
  .md-live {
    animation: none;
  }
}
</style>