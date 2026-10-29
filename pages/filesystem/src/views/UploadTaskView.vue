<!--
  上传任务页 —— 任务化分片上传的管理视图。

  职责边界（与 FileStorageManage 页解耦）：
    1) 上传动作只创建任务：选文件 + 选 bucket（从后端 /buckets 拉取）→ 分片上传 → complete；
       后台（时间轮 + 虚拟线程）负责合并与写入，本页只轮询展示状态。
    2) 任务列表：状态、进度（已收片数/总片数）、失败原因、取消/重传操作。

  数据来源：@pages/filesystem/api/filestorageApi 的 uploadTask* 系列（Spring 侧接口，
  走应用登录态，与文件服务器直连通道无关）。

  【重构 2026-10-25 · 详情中心 Detail Hub】文件记录区改为「窄文件导航栏 + 宽焦点档案卡」：
    左导航：按状态分组的紧凑文件导航（类型色点、文件名、百分比、速率、多选批量）。
    右焦点：大类型图标 + 文件名 + 状态徽章、渐变大进度条、元数据网格
            （大小/分片/任务号/创建时间/objectKey/桶路径）、失败原因、下载/重传/取消。
    数据点零丢失：文件名/大小/bucket/分片/进度/状态/说明(objectKey/message)/取消全部保留，
    并新增展示：chunkSize(分片大小)、bucket(桶路径)、createdAt(相对时间)、实时传输速率。
    交互：文件名搜索、状态筛选、分组导航、多选批量取消、失败一键重传、
          已完成文件下载（objectUrl/resolveObjectUrl）。
-->

<template>
  <div class="upload-task-page">
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
        <el-button size="small" text :icon="Refresh" :loading="listLoading" class="ut-refresh-btn" @click="refreshTasks">
          刷新
        </el-button>
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

    <!-- 文件记录：左存储桶 · 中文件列表(ReTable) · 右详情(默认折叠) -->
    <div class="dh-wrap tri">
      <!-- 左：存储桶 -->
      <div class="dh-bucket koi-card">
        <div class="md-card-hd">
          <span class="md-card-title">存储桶</span>
          <el-button size="small" text :icon="Refresh" :loading="listLoading" @click="refreshTasks" />
        </div>
        <div class="bucket-list">
          <el-dropdown
            trigger="contextmenu"
            @command="(cmd: string) => onBucketCmd(cmd, '')"
          >
            <button
              type="button"
              class="bucket-it"
              :class="{ 'is-active': activeBucket === '' }"
              @click="selectBucket('')"
            >
              <el-icon><Folder /></el-icon><span>全部</span>
            </button>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item command="info" :icon="InfoFilled">信息</el-dropdown-item>
                <el-dropdown-item command="upload" :icon="Upload">上传</el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
          <el-dropdown
            v-for="b in buckets"
            :key="b"
            trigger="contextmenu"
            @command="(cmd: string) => onBucketCmd(cmd, b)"
          >
            <button
              type="button"
              class="bucket-it"
              :class="{ 'is-active': activeBucket === b }"
              @click="selectBucket(b)"
            >
              <el-icon><FolderOpened /></el-icon><span>{{ b }}</span>
            </button>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item command="info" :icon="InfoFilled">信息</el-dropdown-item>
                <el-dropdown-item command="upload" :icon="Upload">上传</el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
          <div v-if="!buckets.length && !bucketsLoading" class="bucket-empty">后台未开启任何 bucket</div>
        </div>
      </div>

      <!-- 中：文件 ReTable（视图模式） -->
      <div class="dh-files koi-card">
        <div class="md-card-hd">
          <span class="md-card-title">文件</span>
          <div class="md-toolbar file-toolbar">
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
            <ReButton layout="square" icon="Tickets" tip="文件日志" @click="openLogs" />
            <el-button size="small" text :icon="Refresh" :loading="listLoading" @click="refreshTasks" />
          </div>
        </div>
        <div v-if="tasks.length === 0" class="files-empty">
          <el-empty v-if="!listLoading" description="暂无上传文件" :image-size="110">
            <el-button size="small" type="primary" @click="pickFiles">上传文件</el-button>
          </el-empty>
        </div>
        <ReTable
          v-else
          :data="fileRows"
          :columns="fileColumns"
          layout="view"
          :layout-view="{ gap: 8, minHeight: 64, hoverable: true }"
          size="small"
          class="file-table file-table--view"
          empty-text="暂无符合条件的文件"
          :pagination="true"
          pagination-mode="scroll"
          :page-size="8"
          :toolbar="false"
          show-selection
          row-key="taskId"
          selectable
          @selection-change="onSelectionChange"
          @row-click="onFileRowClick"
        >
          <template #view="{ row, selected }">
            <div class="fv-row" :class="{ 'is-selected': selected }">
              <span class="dh-big-ic fv-ic" :class="fileTypeMeta(toTask(row).fileName).cls" aria-hidden="true">
                {{ fileTypeMeta(toTask(row).fileName).ext }}
              </span>
              <div class="fv-main">
                <span class="fv-name" :title="toTask(row).fileName">{{ toTask(row).fileName }}</span>
                <span class="fv-sub">
                  <el-tag size="small" :type="tagType(toTask(row).state)" effect="light">
                    {{ stateLabel(toTask(row).state) }}
                  </el-tag>
                  <span class="fv-size">{{ formatSize(toTask(row).totalSize) }}</span>
                </span>
                <div class="fv-prog">
                  <i
                    class="dh-rail-prog-fill"
                    :class="{ 'is-done': toTask(row).state === 'COMPLETED' }"
                    :style="{ width: taskPercent(toTask(row)) + '%' }"
                  />
                  <span class="fv-pct">{{ taskPercent(toTask(row)) }}%</span>
                </div>
              </div>
              <div class="fv-acts" @click.stop>
                <ReButton
                  v-if="toTask(row).state === 'COMPLETED' && toTask(row).objectKey"
                  layout="square"
                  icon="Download"
                  tip="下载"
                  size="small"
                  type="primary"
                  @click="downloadObject(toTask(row))"
                />
                <ReButton
                  v-if="toTask(row).state === 'COMPLETED' && toTask(row).objectKey"
                  layout="square"
                  icon="Delete"
                  tip="删除"
                  size="small"
                  type="danger"
                  :disabled="!!deletingId"
                  @click="onDelete(toTask(row))"
                />
                <ReButton
                  v-if="isActive(toTask(row).state) || toTask(row).state === 'FAILED'"
                  layout="square"
                  icon="Close"
                  tip="取消"
                  size="small"
                  type="warning"
                  @click="onCancel(toTask(row))"
                />
              </div>
            </div>
          </template>
        </ReTable>
        <div v-if="selectedRows.length" class="md-bulk">
          <span class="md-bulk-info">已选 {{ selectedRows.length }} 个任务</span>
          <el-button size="small" text @click="clearSelection">清空</el-button>
          <el-popconfirm title="确定批量取消选中的可取消任务？" @confirm="batchCancel">
            <template #reference>
              <el-button size="small" text type="danger">批量取消</el-button>
            </template>
          </el-popconfirm>
          <el-popconfirm title="确定删除选中的已完成文件？将同时移除存储对象。" @confirm="batchDelete">
            <template #reference>
              <el-button size="small" text type="danger">批量删除</el-button>
            </template>
          </el-popconfirm>
        </div>
      </div>

      <!-- 右：文件详情（方案 A · 横向 Hero + 网格，常显不折叠） -->
      <div class="dh-detail koi-card">
        <div class="md-card-hd">
          <span class="md-card-title">文件详情</span>
          <span v-if="selectedTask" class="detail-subtitle">{{ selectedTask.fileName }}</span>
        </div>
        <template v-if="selectedTask">
          <!-- 横向 Hero：大类型图标 + 文件名 + 状态徽章 -->
          <div class="dh-focus-hd">
            <span class="dh-big-ic" :class="fileTypeMeta(selectedTask.fileName).cls" aria-hidden="true">
              {{ fileTypeMeta(selectedTask.fileName).ext }}
            </span>
            <div class="dh-focus-t">
              <h3 class="dh-fn" :title="selectedTask.fileName">{{ selectedTask.fileName }}</h3>
              <div class="dh-fn-sub">
                {{ selectedTask.provider || "默认" }}<template v-if="selectedTask.bucket"> / {{ selectedTask.bucket }}</template>
                <span class="md-dot" :class="stateDotClass(selectedTask.state)" style="margin: 0 2px 0 8px"></span>
                {{ stateLabel(selectedTask.state) }}
              </div>
            </div>
            <span class="md-state-badge" :class="stateBadgeClass(selectedTask.state)">
              <span class="md-dot" :class="stateDotClass(selectedTask.state)"></span>{{ taskPercent(selectedTask) }}%
            </span>
          </div>

          <!-- 渐变大进度条 -->
          <div class="dh-bigp">
            <i :class="progClass(selectedTask.state)" :style="{ width: taskPercent(selectedTask) + '%' }" />
          </div>
          <div class="dh-bigp-meta">
            <span>{{ selectedTask.receivedChunks }}/{{ selectedTask.totalChunks }} 片 · {{ taskPercent(selectedTask) }}%</span>
            <span v-if="speeds[selectedTask.taskId]" class="dh-live-spd">{{ speeds[selectedTask.taskId] }}</span>
            <span v-if="isActive(selectedTask.state)" class="md-live" aria-hidden="true"></span>
          </div>

          <!-- 元数据网格 -->
          <div class="dh-kv">
            <div class="dh-kv-item">
              <span class="dh-kv-label">大小</span>
              <span class="dh-kv-value">{{ formatSize(selectedTask.totalSize) }}</span>
            </div>
            <div class="dh-kv-item">
              <span class="dh-kv-label">分片</span>
              <span class="dh-kv-value">
                {{ selectedTask.chunkSize > 0 ? formatSize(selectedTask.chunkSize) : "-" }} × {{ selectedTask.totalChunks }}
              </span>
            </div>
            <div class="dh-kv-item">
              <span class="dh-kv-label">任务号</span>
              <span class="dh-kv-value dh-kv-ellipsis" :title="selectedTask.taskId">{{ selectedTask.taskId }}</span>
            </div>
            <div class="dh-kv-item">
              <span class="dh-kv-label">创建时间</span>
              <span class="dh-kv-value">{{ formatRelTime(selectedTask.createdAt) }}</span>
            </div>
            <div class="dh-kv-item">
              <span class="dh-kv-label">objectKey</span>
              <span class="dh-kv-value dh-kv-ellipsis" :title="selectedTask.objectKey || '-'">{{ selectedTask.objectKey || "-" }}</span>
            </div>
            <div class="dh-kv-item">
              <span class="dh-kv-label">桶路径</span>
              <span class="dh-kv-value dh-kv-ellipsis" :title="selectedTask.bucket || '-'">{{ selectedTask.bucket || "-" }}</span>
            </div>
            <div v-if="selectedTask.ext" class="dh-kv-item">
              <span class="dh-kv-label">类型</span>
              <span class="dh-kv-value">{{ selectedTask.ext.toUpperCase() }}<template v-if="selectedTask.mime"> · {{ selectedTask.mime }}</template></span>
            </div>
            <div v-if="selectedTask.width && selectedTask.height" class="dh-kv-item">
              <span class="dh-kv-label">图片尺寸</span>
              <span class="dh-kv-value">{{ selectedTask.width }} × {{ selectedTask.height }} px</span>
            </div>
          </div>

          <!-- 说明 / 失败原因 -->
          <div v-if="selectedTask.message" class="md-msg" :class="{ 'is-error': selectedTask.state === 'FAILED' }">
            {{ selectedTask.message }}
          </div>

          <!-- 操作区 -->
          <div class="dh-acts">
            <el-button
              v-if="selectedTask.state === 'COMPLETED' && selectedTask.objectKey"
              type="success"
              plain
              size="small"
              @click="downloadObject(selectedTask)"
            >
              <el-icon><Download /></el-icon>下载文件
            </el-button>
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
            <el-popconfirm
              v-if="selectedTask.state === 'COMPLETED' && selectedTask.objectKey"
              title="确定删除该文件？将同时移除存储对象。"
              :disabled="!!deletingId"
              @confirm="onDelete(selectedTask)"
            >
              <template #reference>
                <el-button type="danger" plain size="small" :disabled="!!deletingId">删除文件</el-button>
              </template>
            </el-popconfirm>
          </div>
        </template>
        <div v-else class="dh-focus-empty">从中间列表选择一个文件查看详情</div>
      </div>
    </div>

    <!-- 文件日志抽屉（合并到文件管理，不再单独成页） -->
    <ReDrawer
      v-model="logVisible"
      title="文件日志"
      size="540px"
      direction="rtl"
      :modal="true"
      :footer-hidden="true"
      class="ut-log-drawer"
    >
      <div v-loading="logLoading" class="log-drawer-body">
        <div class="log-toolbar">
          <span class="log-toolbar-title">操作流水</span>
          <el-popover placement="bottom-end" :width="180" trigger="click" :disabled="logCleaning || !logs.length">
            <template #reference>
              <el-button size="small" :disabled="logCleaning || !logs.length">
                <el-icon :size="14"><Tickets /></el-icon>&nbsp;清理日志
              </el-button>
            </template>
            <template #default>
              <div class="log-clean-menu">
                <button type="button" class="log-clean-it" @click="cleanLogs('today')">删除一天前</button>
                <button type="button" class="log-clean-it" @click="cleanLogs('week')">删除一周前</button>
                <button type="button" class="log-clean-it" @click="cleanLogs('month')">删除一月前</button>
                <el-divider style="margin:6px 0" />
                <button type="button" class="log-clean-it is-danger" @click="cleanLogs('all')">清空全部</button>
              </div>
            </template>
          </el-popover>
        </div>
        <ReTable
          :data="logRows"
          :columns="logColumns"
          layout="view"
          :layout-view="{ gap: 6, minHeight: 52, hoverable: false, showIndex: false }"
          size="small"
          empty-text="暂无文件操作日志"
          :pagination="false"
          :toolbar="false"
          row-key="id"
          class="log-table"
        >
          <template #view="{ row }">
            <div class="lg-row">
              <el-tag size="small" :type="tagType(toLog(row).operation.startsWith('TASK') ? 'warning' : 'info')" effect="plain">
                {{ toLog(row).operation }}
              </el-tag>
              <span class="lg-target" :title="toLog(row).target">{{ toLog(row).target }}</span>
              <span class="lg-status" :class="{ 'is-err': toLog(row).status >= 400 }">{{ toLog(row).status }}</span>
              <span class="lg-time">{{ formatRelTime(toLog(row).time) }}</span>
            </div>
          </template>
        </ReTable>
      </div>
    </ReDrawer>

    <!-- 存储桶信息弹窗 -->
    <ReDialog
      v-model="bucketInfoVisible"
      class="ut-bucket-dialog"
      width="420px"
      :append-to-body="true"
      :close-on-click-modal="false"
    >
      <template #header>
        <div class="bucket-dialog-head">
          <el-icon :size="18"><FolderOpened /></el-icon>
          <span>存储桶信息 · {{ bucketInfo.name }}</span>
        </div>
      </template>
      <div class="bucket-dialog-body">
        <div class="bucket-stat-row">
          <div class="bucket-stat">
            <span class="bucket-stat-label">文件/任务</span>
            <span class="bucket-stat-value">{{ bucketInfo.count }}</span>
          </div>
          <div class="bucket-stat">
            <span class="bucket-stat-label">累计大小</span>
            <span class="bucket-stat-value">{{ formatSize(bucketInfo.totalBytes) }}</span>
          </div>
          <div class="bucket-stat">
            <span class="bucket-stat-label">进行中</span>
            <span class="bucket-stat-value">{{ bucketInfo.active }}</span>
          </div>
          <div class="bucket-stat">
            <span class="bucket-stat-label">已完成</span>
            <span class="bucket-stat-value">{{ bucketInfo.completed }}</span>
          </div>
          <div class="bucket-stat">
            <span class="bucket-stat-label">失败</span>
            <span class="bucket-stat-value">{{ bucketInfo.failed }}</span>
          </div>
        </div>
      </div>
      <template #footer>
        <el-button type="primary" @click="bucketInfoVisible = false">知道了</el-button>
      </template>
    </ReDialog>
  </div>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from "vue";
import { message } from "@repo/core";
import { Download, Folder, FolderOpened, InfoFilled, Refresh, RefreshRight, Search, Upload, Tickets } from "@element-plus/icons-vue";
import ReButton from "@repo/ui/re-button";
import ReDialog from "@repo/ui/re-dialog";
import ReDrawer from "@repo/ui/re-drawer";
import ReTable from "@repo/ui/re-table";
import type { ReTableColumn } from "@repo/ui/re-table";
import {
  SIMPLE_SYNC_MAX_MB,
  cancelUploadTask,
  cleanFileLogsBefore,
  completeUploadTask,
  createUploadTask,
  deleteUploadTask,
  listFileLogs,
  logCleanCutoff,
  listUploadBuckets,
  listUploadTasks,
  objectUrl,
  resolveObjectUrl,
  subscribeUploadTasks,
  uploadFileSimple,
  uploadTaskChunk,
  type FileLogCleanScope,
  type FileLogEntry,
  type UploadTaskInfo,
  type UploadTaskState,
} from "../api/filestorageApi";

/** 将 ReTable 插槽里的 row（Record<string, unknown>）转成任务类型 */
function toTask(r: unknown): UploadTaskInfo {
  return r as UploadTaskInfo;
}

/** 将 ReTable 插槽里的 row（Record<string, unknown>）转成日志类型 */
function toLog(r: unknown): FileLogEntry {
  return r as FileLogEntry;
}

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
/** 正在重传的任务 id（按钮 loading） */
const retrying = ref("");
/** 正在删除的任务 id（删除进行中禁用删除按钮，防止反复点击） */
const deletingId = ref("");

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

/** 当前选中的存储桶（空 = 全部） */
const activeBucket = ref("");

/** 按存储桶筛选后的文件行（供中间 ReTable 使用） */
const fileRows = computed<Array<Record<string, unknown>>>(() => {
  const bucket = activeBucket.value;
  return filteredTasks.value
    .filter((t) => !bucket || t.bucket === bucket || t.provider === bucket)
    .map((t) => ({ ...t }));
});

/** ReTable 列定义（视图模式：列定义仅用于默认模板兜底，实际渲染走 #view 插槽） */
const fileColumns: ReTableColumn[] = [
  { prop: "fileName", label: "文件名" },
  { prop: "state", label: "状态" },
  { prop: "progress", label: "进度" },
];

/** 当前勾选的行（批量操作） */
const selectedRows = ref<Array<Record<string, unknown>>>([]);

/** 文件日志抽屉状态 */
const logVisible = ref(false);
const logLoading = ref(false);
const logCleaning = ref(false);
const logs = ref<FileLogEntry[]>([]);
const logRows = computed<Array<Record<string, unknown>>>(() => logs.value.map((l) => ({ ...l })));
const logColumns: ReTableColumn[] = [
  { prop: "operation", label: "操作" },
  { prop: "target", label: "目标" },
  { prop: "status", label: "状态" },
  { prop: "time", label: "时间" },
];

/** 存储桶信息弹窗 */
const bucketInfoVisible = ref(false);
const bucketInfo = ref({ name: "", count: 0, active: 0, completed: 0, failed: 0, totalBytes: 0 });

/** 打开文件日志抽屉 */
async function openLogs() {
  logVisible.value = true;
  logLoading.value = true;
  try {
    logs.value = await listFileLogs({ limit: 200 });
  } catch {
    logs.value = [];
  } finally {
    logLoading.value = false;
  }
}

/** 清理日志：today/week/month 删除对应时间点之前的；all 清空全部 */
async function cleanLogs(scope: FileLogCleanScope | "all") {
  if (logCleaning.value) return;
  logCleaning.value = true;
  try {
    const removed = scope === "all"
      ? await cleanFileLogsBefore(0)
      : await cleanFileLogsBefore(logCleanCutoff(scope));
    // 本地同步移除对应日志，避免等待刷新
    if (scope !== "all") {
      const cutoff = logCleanCutoff(scope);
      logs.value = logs.value.filter((l) => l.time >= cutoff);
    } else {
      logs.value = [];
    }
    message.success(`已清理 ${removed} 条日志`);
  } catch (e) {
    message.error((e as Error).message);
  } finally {
    logCleaning.value = false;
  }
}

/** ReTable 勾选变化 → 同步批量选中行 */
function onSelectionChange(rows: Array<Record<string, unknown>>) {
  selectedRows.value = rows;
}

function clearSelection() {
  selectedRows.value = [];
}

/** 批量取消：仅取消可取消（进行中/失败）的任务 */
async function batchCancel() {
  const targets = selectedRows.value.filter((r) => {
    const t = toTask(r);
    return isActive(t.state) || t.state === "FAILED";
  });
  if (!targets.length) {
    message.info("选中的任务均不可取消");
    clearSelection();
    return;
  }
  try {
    for (const t of targets) {
      await cancelUploadTask(toTask(t).taskId);
    }
    message.success(`已取消 ${targets.length} 个任务`);
  } catch (e) {
    message.error((e as Error).message);
  } finally {
    clearSelection();
    refreshTasks();
  }
}

/** 批量删除：仅删除已完成且具备 objectKey 的文件 */
async function batchDelete() {
  const targets = selectedRows.value.filter((r) => {
    const t = toTask(r);
    return t.state === "COMPLETED" && t.objectKey;
  });
  if (!targets.length) {
    message.info("选中的任务均不可删除（仅已完成文件可删除）");
    clearSelection();
    return;
  }
  try {
    for (const t of targets) {
      await deleteUploadTask(toTask(t).taskId);
    }
    message.success(`已删除 ${targets.length} 个文件`);
  } catch (e) {
    message.error((e as Error).message);
  } finally {
    clearSelection();
    refreshTasks();
  }
}

/** 选择存储桶 */
function selectBucket(bucket: string) {
  activeBucket.value = bucket;
}

/** 存储桶右键菜单：信息 / 上传 */
function onBucketCmd(cmd: string, bucket: string) {
  if (cmd === "upload") {
    // 选择该 bucket 作为上传目标并触发文件选择
    provider.value = bucket || "";
    pickFiles();
    return;
  }
  // info：弹 ReDialog 展示桶基本信息
  const bucketTasks = bucket
    ? tasks.value.filter((t) => t.bucket === bucket || t.provider === bucket)
    : tasks.value;
  bucketInfo.value = {
    name: bucket || "全部",
    count: bucketTasks.length,
    active: bucketTasks.filter((t) => isActive(t.state)).length,
    completed: bucketTasks.filter((t) => t.state === "COMPLETED").length,
    failed: bucketTasks.filter((t) => t.state === "FAILED").length,
    totalBytes: bucketTasks.reduce((sum, t) => sum + (t.receivedBytes || 0), 0),
  };
  bucketInfoVisible.value = true;
}

/** 点击文件行：选中详情 */
function onFileRowClick(row: Record<string, unknown>) {
  const taskId = String(toTask(row).taskId || "");
  selectedTaskId.value = taskId;
}

/** el-tag type（与状态同步） */
function tagType(state: string): "success" | "warning" | "danger" | "info" | "primary" {
  switch (state) {
    case "COMPLETED":
      return "success";
    case "MERGING":
      return "warning";
    case "FAILED":
      return "danger";
    case "CANCELLED":
      return "info";
    default:
      return "primary";
  }
}

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
  // 实时推送：任务创建/分片进度/状态变化由后端 SSE 即时下发（不再使用定时轮询），
  // 进度条因此随分片事件平滑推进，而非整表周期性刷新"一刷一刷"。
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
  // 传输速率采样：每 3 秒对上传中的任务差分 receivedBytes（仅展示用，不刷新列表）
  speedTimer = setInterval(sampleSpeeds, 3000);
});

onBeforeUnmount(() => {
  unsubscribeSse?.();
  unsubscribeSse = null;
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
    message.success(files.length === 1 ? "上传完成，后台合并中" : `${files.length} 个文件上传完成，后台合并中`);
  } catch (err) {
    message.error((err as Error).message);
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
    message.success(row.state === "FAILED" ? "已取消并清理分片" : "任务已取消");
    refreshTasks();
  } catch (e) {
    message.error((e as Error).message);
  }
}

/** 删除任务（含存储对象） */
async function onDelete(row: UploadTaskInfo) {
  if (deletingId.value) return;
  deletingId.value = row.taskId;
  try {
    await deleteUploadTask(row.taskId);
    message.success(`已删除「${row.fileName}」`);
    if (selectedTaskId.value === row.taskId) {
      selectedTaskId.value = "";
    }
    refreshTasks();
  } catch (e) {
    message.error((e as Error).message);
  } finally {
    deletingId.value = "";
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
    message.warning("本地已无该文件的字节缓存，请重新选择文件上传");
    return;
  }
  retrying.value = t.taskId;
  try {
    // 保持原 bucket/provider 重放；分片大小沿用任务原始 chunkSize
    const chunkMb = t.chunkSize > 0 ? Math.max(1, Math.round(t.chunkSize / (1024 * 1024))) : chunkSizeMb.value;
    await uploadLargeAsTask(file, t.provider || undefined, chunkMb);
    message.success("重传完成，后台合并中");
  } catch (e) {
    message.error((e as Error).message);
  } finally {
    retrying.value = "";
    refreshTasks();
  }
}

/** 已完成文件下载：优先短时票据 URL，失败退化为无凭据直链；用 <a> 触发规避弹窗拦截 */
async function downloadObject(t: UploadTaskInfo) {
  if (!t.objectKey) {
    message.warning("该任务尚无 objectKey，无法下载");
    return;
  }
  if (deletingId.value) return;
  const bucketName = t.bucket || t.provider || "local";
  let url: string;
  try {
    url = await resolveObjectUrl(bucketName, t.objectKey);
  } catch {
    url = objectUrl(bucketName, t.objectKey, true);
  }
  const a = document.createElement("a");
  a.href = url;
  a.target = "_blank";
  a.rel = "noopener";
  a.download = t.fileName || t.objectKey;
  document.body.appendChild(a);
  a.click();
  a.remove();
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

/** 文件类型图标：按扩展名返回色块 class 与显示文本（供大类型图标/导航栏识别） */
function fileTypeMeta(fileName: string): { ext: string; cls: string } {
  const dot = fileName.lastIndexOf(".");
  const raw = dot >= 0 ? fileName.slice(dot + 1).toLowerCase() : "";
  const ext = (raw || "file").slice(0, 4).toUpperCase();
  let cls = "fi-oth";
  if (["xlsx", "xls", "csv"].includes(raw)) cls = "fi-xlsx";
  else if (["zip", "rar", "7z", "gz", "tar", "tgz"].includes(raw)) cls = "fi-zip";
  else if (["dump", "sql", "db", "bak", "dat"].includes(raw)) cls = "fi-dump";
  else if (["pem", "key", "crt", "cer", "pfx"].includes(raw)) cls = "fi-pem";
  else if (["exe", "msi", "bin"].includes(raw)) cls = "fi-exe";
  return { ext, cls };
}
</script>

<style scoped lang="scss">
.upload-task-page {
  display: flex;
  flex-direction: column;
  gap: 14px;
  background: var(--bg-page, var(--el-bg-color-page, #f5f7fa));
  /* 吃满 .el-main 的可用高度（上层布局已有确定高度）：
     概览条 / 上传条高度固定，剩余空间全给下方的「文件导航 + 档案卡」双栏。 */
  height: 100%;
  min-height: 0;
}

/* ===== 概览条（koi 大数字 + 顶部色条） ===== */
.stat-grid {
  display: grid;
  grid-template-columns: repeat(5, minmax(0, 1fr));
  gap: 12px;
  /* 高度固定，剩余空间留给下方双栏 */
  flex: 0 0 auto;
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
  /* 卡片不参与高度伸缩（伸缩交给 .dh-wrap / .dh-rail 内部滚动区）；
     否则 flex 列里卡片会被压扁或撑高 */
  flex: 0 0 auto;
}
/* 双栏里的卡片需要跟随列高（左导航栏内部滚动） */
.dh-rail.koi-card {
  flex: 1 1 auto;
  min-height: 0;
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
  /* 上传条高度固定，不参与剩余高度分配 */
  flex: 0 0 auto;
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

/* ===== 文件记录 · 三列详情中心 ===== */
.dh-wrap.tri {
  display: grid;
  grid-template-columns: 190px minmax(0, 2fr) minmax(0, 0.9fr);
  gap: 12px;
  align-items: stretch;
  /* 吃掉概览条与上传条之外的剩余高度；
     min-height:0 让三栏内部的滚动区能真正收缩（grid 子项默认 min-height:auto） */
  flex: 1 1 auto;
  min-height: 0;
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

/* ===== 左：存储桶列 ===== */
.dh-bucket {
  padding: 12px;
  min-width: 0;
  display: flex;
  flex-direction: column;
  min-height: 0;
}
.bucket-list {
  display: flex;
  flex-direction: column;
  gap: 4px;
  overflow-y: auto;
  flex: 1 1 auto;
  min-height: 0;
}
.bucket-it {
  display: flex;
  align-items: center;
  gap: 8px;
  width: 100%;
  padding: 8px 10px;
  border: 1px solid transparent;
  border-radius: var(--el-radius-md, 8px);
  background: transparent;
  color: var(--text-primary, var(--el-text-color-primary, #303133));
  font-size: 13px;
  font-family: inherit;
  text-align: left;
  cursor: pointer;
  transition: background-color 0.15s var(--ease-out, ease), border-color 0.15s;
}
.bucket-it:hover {
  background: var(--el-fill-color-light, #f5f7fa);
}
.bucket-it.is-active {
  background: var(--el-color-primary-light-9, #ecf5ff);
  border-color: var(--el-color-primary-light-7, #b3d8ff);
  color: var(--el-color-primary, #409eff);
  font-weight: 600;
}
.bucket-it .el-icon {
  flex: none;
}
.bucket-empty {
  padding: 16px 8px;
  font-size: 12px;
  color: var(--text-tertiary, #a8abb2);
  text-align: center;
}

/* ===== 中：文件 ReTable 列 ===== */
.dh-files {
  padding: 12px;
  min-width: 0;
  display: flex;
  flex-direction: column;
  min-height: 0;
}
.file-toolbar {
  margin-bottom: 0;
  flex: 1;
  justify-content: flex-end;
}
.file-toolbar .md-search {
  max-width: 240px;
}
.file-table {
  flex: 1 1 auto;
  min-height: 0;
}
.files-empty {
  flex: 1 1 auto;
  min-height: 0;
  display: flex;
  align-items: center;
  justify-content: center;
}
.file-cell-name {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  min-width: 0;
}
.file-name {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.table-prog {
  display: flex;
  align-items: center;
  gap: 8px;
}
.table-prog .dh-rail-prog-fill {
  flex: 1;
}
.table-prog-pct {
  font-size: 11px;
  font-variant-numeric: tabular-nums;
  color: var(--text-secondary, var(--el-text-color-secondary, #909399));
}
.table-acts {
  display: inline-flex;
  align-items: center;
  gap: 2px;
}

/* ===== 视图模式行 ===== */
.file-table--view :deep(.re-table__view-list) {
  gap: 10px;
  padding: 2px 2px 4px;
}
.file-table--view :deep(.re-table__view-item) {
  border: 1px solid var(--border-subtle, var(--el-border-color-lighter, #eef0f3));
  box-shadow: none;
  padding: 12px 14px;
}
.fv-row {
  display: flex;
  align-items: center;
  gap: 12px;
  width: 100%;
  min-width: 0;
}
.fv-ic {
  width: 42px;
  height: 42px;
  border-radius: 10px;
  font-size: 10px;
  flex: none;
}
.fv-main {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.fv-name {
  font-size: 13px;
  font-weight: 600;
  color: var(--text-primary, var(--el-text-color-primary, #303133));
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.fv-sub {
  display: flex;
  align-items: center;
  gap: 8px;
}
.fv-size {
  font-size: 11px;
  color: var(--text-tertiary, var(--el-text-color-secondary, #909399));
  font-variant-numeric: tabular-nums;
}
.fv-prog {
  display: flex;
  align-items: center;
  gap: 8px;
}
.fv-prog .dh-rail-prog-fill {
  flex: 1;
  height: 5px;
}
.fv-pct {
  font-size: 11px;
  font-variant-numeric: tabular-nums;
  color: var(--text-secondary, var(--el-text-color-secondary, #909399));
  min-width: 34px;
  text-align: right;
}
.fv-acts {
  display: flex;
  align-items: center;
  gap: 4px;
  flex: none;
}

/* ===== 文件日志抽屉 ===== */
.log-drawer-body {
  min-height: 0;
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.log-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  padding: 2px 2px 4px;
}
.log-toolbar-title {
  font-size: 12px;
  font-weight: 600;
  color: var(--text-primary, var(--el-text-color-primary, #303133));
}
.log-clean-menu {
  display: flex;
  flex-direction: column;
  gap: 2px;
}
.log-clean-it {
  display: flex;
  align-items: center;
  width: 100%;
  padding: 6px 10px;
  border: none;
  border-radius: var(--el-radius-md, 6px);
  background: transparent;
  color: var(--text-primary, var(--el-text-color-primary, #303133));
  font-size: 13px;
  font-family: inherit;
  text-align: left;
  cursor: pointer;
  transition: background-color var(--el-transition-duration, 0.2s), color var(--el-transition-duration, 0.2s);
}
.log-clean-it:hover {
  background: var(--el-fill-color-light);
}
.log-clean-it.is-danger {
  color: var(--status-error, #f56c6c);
}
.log-clean-it.is-danger:hover {
  background: var(--el-color-danger-light-9);
}
.log-table {
  flex: 1 1 auto;
  min-height: 0;
}

/* ===== 存储桶信息弹窗 ===== */
.ut-bucket-dialog :deep(.el-dialog__body) {
  padding: 4px 4px 0;
}
.bucket-dialog-head {
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: 600;
  color: var(--text-primary, var(--el-text-color-primary, #303133));
}
.bucket-dialog-body {
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.bucket-stat-row {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px;
}
.bucket-stat {
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 10px 12px;
  background: var(--bg-container, #fff);
  border: 1px solid var(--border-subtle, var(--el-border-color-lighter, #eef0f3));
  border-radius: var(--el-radius-md, 8px);
}
.bucket-stat-label {
  font-size: 11px;
  color: var(--text-tertiary, var(--el-text-color-secondary, #909399));
}
.bucket-stat-value {
  font-size: 18px;
  font-weight: 700;
  font-variant-numeric: tabular-nums;
  color: var(--text-primary, var(--el-text-color-primary, #303133));
}
.log-table :deep(.re-table__view-item) {
  border: 1px solid var(--border-subtle, var(--el-border-color-lighter, #eef0f3));
  box-shadow: none;
}
.lg-row {
  display: flex;
  align-items: center;
  gap: 10px;
  width: 100%;
  min-width: 0;
}
.lg-target {
  flex: 1;
  min-width: 0;
  font-size: 12px;
  color: var(--text-primary, var(--el-text-color-primary, #303133));
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.lg-status {
  font-size: 11px;
  font-variant-numeric: tabular-nums;
  color: var(--status-success, #67c23a);
}
.lg-status.is-err {
  color: var(--status-error, #f56c6c);
}
.lg-time {
  font-size: 11px;
  color: var(--text-tertiary, var(--el-text-color-secondary, #909399));
  font-variant-numeric: tabular-nums;
  flex: none;
}

/* ===== 右：文件详情（方案 A · 横向 Hero + 网格，常显不折叠） ===== */
.dh-detail {
  padding: 14px;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 14px;
  min-height: 0;
  overflow-y: auto;
  background: linear-gradient(160deg, var(--bg-container, #fff), var(--el-fill-color-lighter, #f6f9ff));
  border-color: var(--el-color-primary-light-7, #dbe7f7);
}
.dh-detail .md-card-hd {
  margin-bottom: 0;
}
.detail-subtitle {
  font-size: 12px;
  color: var(--text-secondary, var(--el-text-color-secondary, #909399));
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  max-width: 60%;
}

/* 搜索 / 筛选工具栏 */
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
  width: 118px;
  flex: none;
}

/* 导航滚动区 */
.dh-rail-scroll {
  overflow-y: auto;
  flex: 1 1 auto;
  min-height: 0;
}
.dh-group + .dh-group {
  margin-top: 10px;
}
.dh-group-hd {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 2px 4px 6px;
  border-bottom: 1px dashed var(--border-subtle, var(--el-border-color-lighter, #e8ebf0));
  margin-bottom: 2px;
}
.dh-group-name {
  font-size: 12px;
  font-weight: 600;
  color: var(--text-secondary, var(--el-text-color-secondary, #606266));
}
.dh-group-cnt {
  margin-left: auto;
  font-size: 10.5px;
  color: var(--text-tertiary, #a8abb2);
  background: var(--bg-subtle, #f4f4f5);
  border-radius: 999px;
  padding: 0 7px;
  line-height: 1.6;
}

/* 导航项（紧凑一行 + 进度条） */
.dh-rail-it {
  display: flex;
  flex-direction: column;
  gap: 5px;
  padding: 8px 8px;
  border-radius: var(--el-radius-md, 8px);
  border: 1px solid transparent;
  cursor: pointer;
  transition: background-color 0.15s var(--ease-out, ease), border-color 0.15s;
}
.dh-rail-it:hover {
  background: var(--el-fill-color-light, #f5f7fa);
}
.dh-rail-it.is-selected {
  background: var(--el-color-primary-light-9, #ecf5ff);
  border-color: var(--el-color-primary-light-7, #b3d8ff);
}
.dh-rail-top {
  display: flex;
  align-items: center;
  gap: 7px;
}
.dh-rail-it :deep(.el-checkbox) {
  flex: none;
}
.dh-rail-dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  flex: none;
  background: var(--el-color-primary, #409eff);
}
.dh-rail-dot.is-success { background: var(--status-success, #67c23a); }
.dh-rail-dot.is-danger { background: var(--status-error, #f56c6c); }
.dh-rail-dot.is-warning { background: var(--status-warning, #e6a23c); }
.dh-rail-dot.is-info { background: var(--text-tertiary, #909399); }

.dh-rail-name {
  flex: 1;
  min-width: 0;
  font-size: 12.5px;
  font-weight: 500;
  color: var(--text-primary, var(--el-text-color-primary, #303133));
  line-height: 1.3;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.dh-rail-side {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 1px;
  flex: none;
}
.dh-rail-pct {
  font-size: 10.5px;
  font-weight: 500;
  font-variant-numeric: tabular-nums;
  color: var(--text-secondary, var(--el-text-color-secondary, #909399));
}
.dh-rail-spd {
  font-size: 10px;
  font-variant-numeric: tabular-nums;
  color: var(--status-success, #67c23a);
}

/* 导航项进度条 */
.dh-rail-prog {
  height: 4px;
  border-radius: 999px;
  overflow: hidden;
  background: var(--el-fill-color-light, #f0f2f5);
}
.dh-rail-prog-fill {
  display: block;
  height: 100%;
  border-radius: 999px;
  background: linear-gradient(90deg, var(--el-color-primary, #409eff), var(--el-color-primary-light-3, #79bbff));
  transition: width 0.3s var(--ease-out, ease);
}
.dh-rail-prog-fill.is-done {
  background: var(--status-success, #67c23a);
}
.dh-rail-empty {
  padding: 24px 8px;
  /* 空态在剩余空间里居中，不把左栏压扁 */
  flex: 1 1 auto;
  min-height: 0;
  display: flex;
  align-items: center;
  justify-content: center;
}

/* 批量操作条 */
.md-bulk {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 8px;
  padding: 8px 10px;
  background: var(--el-color-primary-light-9, #ecf5ff);
  border: 1px solid var(--el-color-primary-light-7, #b3d8ff);
  border-radius: var(--el-radius-md, 8px);
  flex-wrap: wrap;
}
.md-bulk-info {
  font-size: 12px;
  font-weight: 500;
  color: var(--el-color-primary, #409eff);
}

/* ===== 文件类型图标色块 ===== */
.dh-big-ic {
  width: 52px;
  height: 52px;
  border-radius: 13px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 11px;
  font-weight: 700;
  color: #fff;
  letter-spacing: 0.02em;
  flex: none;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.06);
}
.fi-xlsx { background: linear-gradient(135deg, #67c23a, #95d475); }
.fi-zip { background: linear-gradient(135deg, #e6a23c, #f0c78a); }
.fi-dump { background: linear-gradient(135deg, #409eff, #79bbff); }
.fi-pem { background: linear-gradient(135deg, #b37feb, #c8a8f2); }
.fi-exe { background: linear-gradient(135deg, #f56c6c, #f89898); }
.fi-oth { background: linear-gradient(135deg, #909399, #b3b6bb); }

/* ===== 右：宽焦点档案卡 ===== */
.dh-focus {
  min-width: 0;
  background: linear-gradient(160deg, var(--bg-container, #fff), var(--el-fill-color-lighter, #f6f9ff));
  border: 1px solid var(--el-color-primary-light-7, #dbe7f7);
  border-radius: var(--radius-lg, 14px);
  padding: 18px;
  display: flex;
  flex-direction: column;
  gap: 14px;
  box-shadow: var(--shadow-sm);
  /* 与左栏等高；内容超出时本卡内部滚动，不把整页顶高 */
  min-height: 0;
  overflow-y: auto;
}

.dh-focus-hd {
  display: flex;
  align-items: flex-start;
  gap: 14px;
}
.dh-focus-t {
  flex: 1;
  min-width: 0;
}
.dh-fn {
  margin: 0;
  font-size: 17px;
  font-weight: 700;
  color: var(--text-primary, var(--el-text-color-primary, #303133));
  line-height: 1.4;
  word-break: break-all;
}
.dh-fn-sub {
  display: flex;
  align-items: center;
  font-size: 12px;
  color: var(--text-secondary, var(--el-text-color-secondary, #909399));
  margin-top: 5px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* 渐变大进度条 */
.dh-bigp {
  height: 10px;
  border-radius: var(--el-radius-full, 9999px);
  background: var(--bg-subtle, var(--el-fill-color-light, #e8e8e8));
  overflow: hidden;
}
.dh-bigp i {
  display: block;
  height: 100%;
  border-radius: inherit;
  background: var(--brand-gradient, linear-gradient(90deg, #409eff, #79bbff));
  transition: width 0.3s var(--ease-out, ease);
}
.dh-bigp i.is-success { background: linear-gradient(90deg, #67c23a, #95d475); }
.dh-bigp i.is-danger { background: linear-gradient(90deg, #f56c6c, #f89898); }
.dh-bigp i.is-warning { background: linear-gradient(90deg, #e6a23c, #f0c78a); }
.dh-bigp-meta {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 12.5px;
  font-variant-numeric: tabular-nums;
  color: var(--text-secondary, var(--el-text-color-secondary, #606266));
}
.dh-live-spd {
  color: var(--status-success, #67c23a);
  font-weight: 600;
}

/* 元数据网格 */
.dh-kv {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 10px;
}
.dh-kv-item {
  display: flex;
  flex-direction: column;
  gap: 4px;
  background: var(--bg-container, #fff);
  border: 1px solid var(--border-subtle, var(--el-border-color-lighter, #eef0f3));
  border-radius: var(--el-radius-md, 8px);
  padding: 8px 10px;
  min-width: 0;
}
.dh-kv-label {
  font-size: 10.5px;
  color: var(--text-tertiary, var(--el-text-color-secondary, #909399));
}
.dh-kv-value {
  font-size: 12.5px;
  color: var(--text-primary, var(--el-text-color-primary, #303133));
  font-variant-numeric: tabular-nums;
}
.dh-kv-ellipsis {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* 状态徽章 */
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
  flex: none;
}
.md-state-badge.is-primary { color: var(--el-color-primary, #409eff); background: var(--el-color-primary-light-9, #ecf5ff); border-color: var(--el-color-primary-light-7, #b3d8ff); }
.md-state-badge.is-success { color: var(--status-success, #67c23a); background: #f0f9eb; border-color: #c2e7b0; }
.md-state-badge.is-danger { color: var(--status-error, #f56c6c); background: #fef0f0; border-color: #fbc4c4; }
.md-state-badge.is-warning { color: var(--status-warning, #e6a23c); background: #fdf6ec; border-color: #f5dab1; }
.md-state-badge.is-info { color: var(--text-secondary, #909399); background: #f4f4f5; border-color: #e4e7ed; }

/* 通用色点 */
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

/* 操作区 */
.dh-acts {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}
.dh-focus-empty {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--text-tertiary, var(--el-text-color-secondary, #909399));
  font-size: 13px;
  min-height: 260px;
}

/* 进行中脉冲点 */
.md-live {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: var(--el-color-primary, #409eff);
  animation: md-pulse 1.2s ease-in-out infinite;
}
@keyframes md-pulse {
  0%, 100% { opacity: 1; transform: scale(1); }
  50% { opacity: 0.4; transform: scale(0.75); }
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
  .dh-wrap.tri {
    grid-template-columns: minmax(0, 1fr);
  }
  .dh-bucket {
    max-height: 200px;
  }
  .dh-kv {
    grid-template-columns: repeat(2, minmax(0, 1fr));
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
  .dh-bigp i {
    transition: none;
  }
  .md-live {
    animation: none;
  }
}
</style>