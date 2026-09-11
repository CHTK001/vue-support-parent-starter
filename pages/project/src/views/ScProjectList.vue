<script setup lang="ts">
/**
 * 发布项目管理 —— 卡片网格 + 拖拽上传 + 启停/升级/回滚 + 实时日志
 * 组件约定：全量使用 Re 组件体系。
 */
import { onBeforeUnmount, onMounted, ref } from 'vue';
import { message, useSocketService } from '@repo/core';
import {
  queryProjects,
  delProject,
  switchProject,
  deployProject,
  startProject,
  stopProject,
  restartProject,
  getArchives,
  rollbackProject,
  queryHostOptions,
} from '../api';
import ScProjectFormDialog from '../components/ScProjectFormDialog.vue';
import ScDeployLog from '../components/ScDeployLog.vue';
import ScLiveLog from '../components/ScLiveLog.vue';
import '../styles/page.css';

interface ProjectRow {
  id: number;
  msProjectName: string;
  msProjectCode?: string;
  msProjectType: string;
  msProjectHostIds?: string;
  msProjectHostOs?: string;
  msProjectDeployDir?: string;
  msProjectStartScript?: string;
  msProjectStopScript?: string;
  msProjectRestartScript?: string;
  msProjectLogDir?: string;
  msProjectLogFile?: string;
  msProjectDeleteBefore?: number;
  msProjectOverwriteMode?: string;
  msProjectAutoExtract?: number;
  msProjectAutoStart?: number;
  msProjectCurrentVersion?: string;
  msProjectRuntimeStatus?: string;
  msProjectEnabled?: number;
  msProjectSort?: number;
  msProjectRemark?: string;
}

const loading = ref(false);
const projects = ref<ProjectRow[]>([]);
const keyword = ref('');
const filterType = ref('');

const typeLabels: Record<string, string> = {
  SPRINGBOOT_MONO: 'SpringBoot 单体jar',
  SPRINGBOOT_WAR: 'SpringBoot war包',
  SPRINGBOOT_SPLIT: '前后端分离',
  NODEJS: 'Node.js',
  STATIC: '静态资源(dist)',
  CUSTOM: '自定义',
};

const typeOptions = Object.entries(typeLabels).map(([value, label]) => ({ label, value }));

const statusMap: Record<string, { label: string; cls: string }> = {
  RUNNING: { label: '运行中', cls: 'success' },
  STOPPED: { label: '已停止', cls: 'info' },
  UNKNOWN: { label: '未知', cls: 'warning' },
  DEPLOYING: { label: '部署中', cls: 'warning' },
  UPGRADING: { label: '升级中', cls: 'warning' },
  RESTARTING: { label: '重启中', cls: 'warning' },
  ROLLING_BACK: { label: '回滚中', cls: 'warning' },
};

const deployingIds = ref<Set<number>>(new Set());
/** 项目进度：projectId → 整体 stage/status/message */
const projectProgress = ref<Record<number, { stage: string; status: string; message: string }>>({});

onMounted(refresh);
setupSocket();

/* ================== Socket 进度订阅 ================== */
function setupSocket() {
  try {
    const socket = useSocketService();
    if (!socket) return;
    const unsub = socket.subscribe('project', 'deploy-progress', (msg: any) => {
      const payload = msg?.data?.data ?? msg?.data ?? msg;
      if (!payload?.projectId) return;
      const pid = Number(payload.projectId);
      if (payload.hostId) {
        // 单主机进度，合并到整体描述
        const prev = projectProgress.value[pid];
        projectProgress.value[pid] = {
          stage: payload.stage,
          status: payload.status,
          message: prev && prev.status === 'SUCCESS' ? prev.message : payload.message,
        };
      } else {
        projectProgress.value[pid] = {
          stage: payload.stage,
          status: payload.status,
          message: payload.message,
        };
      }
      if (payload.status === 'SUCCESS' || payload.status === 'FAIL') {
        setTimeout(() => {
          delete projectProgress.value[pid];
          refresh();
        }, 1500);
      }
    });
    onBeforeUnmount(() => unsub?.());
  } catch { /* socket 未启用时静默 */ }
}

async function refresh() {
  loading.value = true;
  try {
    projects.value = await queryProjects({
      keyword: keyword.value || undefined,
      type: filterType.value || undefined,
    });
  } catch (e) {
    message.error((e as Error).message);
  } finally {
    loading.value = false;
  }
}

/* ================== 表单弹窗 ================== */
const formVisible = ref(false);
const editingProject = ref<ProjectRow | null>(null);

function openCreate() {
  editingProject.value = null;
  formVisible.value = true;
}
function openEdit(row: ProjectRow) {
  editingProject.value = { ...row };
  formVisible.value = true;
}

async function removeProject(row: ProjectRow) {
  await message.confirm(`确认删除项目 ${row.msProjectName}？该操作不可恢复`, '删除');
  await delProject(row.id);
  message.success('已删除');
  refresh();
}

/* ================== 生命周期 ================== */
async function runLifecycle(row: ProjectRow, action: 'start' | 'stop' | 'restart') {
  await message.confirm(`确认${action === 'start' ? '启动' : action === 'stop' ? '停止' : '重启'}项目 ${row.msProjectName}？`, '确认');
  const logs = await (action === 'start' ? startProject(row.id)
    : action === 'stop' ? stopProject(row.id) : restartProject(row.id));
  showActionResult(logs);
  refresh();
}

/* ================== 部署/升级 ================== */
async function uploadToCard(row: ProjectRow, file: File, act: 'DEPLOY' | 'UPGRADE') {
  if (deployingIds.value.has(row.id)) {
    message.warning('该项目正在处理中，请稍候');
    return;
  }
  deployingIds.value.add(row.id);
  try {
    message.info(`开始${act === 'UPGRADE' ? '升级' : '部署'} ${row.msProjectName}...`);
    const logs = await deployProject(row.id, file, act);
    showActionResult(logs);
  } catch (e) {
    message.error(`部署失败: ${(e as Error).message}`);
  } finally {
    deployingIds.value.delete(row.id);
    refresh();
  }
}

function pickFile(row: ProjectRow, mode: 'DEPLOY' | 'UPGRADE') {
  const input = document.createElement('input');
  input.type = 'file';
  input.style.display = 'none';
  input.onchange = () => {
    const f = input.files?.[0];
    if (f) uploadToCard(row, f, mode);
  };
  document.body.appendChild(input);
  input.click();
  input.remove();
}

function handleDrop(row: ProjectRow, e: DragEvent) {
  e.preventDefault();
  cardDragover.value = null;
  const file = e.dataTransfer?.files?.[0];
  if (file) uploadToCard(row, file, 'DEPLOY');
}

const cardDragover = ref<number | null>(null);

/* ================== 回滚 ================== */
const rollbackVisible = ref(false);
const rollbackProjectRow = ref<ProjectRow | null>(null);
const rollbackArchives = ref<any[]>([]);
const rollbackSelected = ref<number | null>(null);
const rollbackLoading = ref(false);

async function openRollback(row: ProjectRow) {
  rollbackProjectRow.value = row;
  rollbackSelected.value = null;
  rollbackArchives.value = [];
  rollbackVisible.value = true;
  try {
    const list = await getArchives(row.id);
    rollbackArchives.value = list ?? [];
    if (rollbackArchives.value.length === 0) {
      message.warning('暂无可回滚的历史版本');
    }
  } catch (e) {
    message.error((e as Error).message);
  }
}

async function submitRollback() {
  if (!rollbackProjectRow.value || !rollbackSelected.value) {
    message.warning('请选择回滚版本');
    return;
  }
  if (deployingIds.value.has(rollbackProjectRow.value.id)) {
    message.warning('该项目正在处理中');
    return;
  }
  deployingIds.value.add(rollbackProjectRow.value.id);
  rollbackLoading.value = true;
  try {
    message.info('开始回滚...');
    const logs = await rollbackProject(rollbackProjectRow.value.id, rollbackSelected.value);
    showActionResult(logs);
    rollbackVisible.value = false;
  } catch (e) {
    message.error(`回滚失败: ${(e as Error).message}`);
  } finally {
    rollbackLoading.value = false;
    deployingIds.value.delete(rollbackProjectRow.value.id);
    refresh();
  }
}

/* ================== 实时日志 ================== */
const logVisible = ref(false);
const logProject = ref<ProjectRow | null>(null);
const logHostOptions = ref<Array<{ label: string; value: number }>>([]);

async function openLiveLog(row: ProjectRow) {
  const hostIds: number[] = parseHostIds(row.msProjectHostIds);
  if (hostIds.length === 0) {
    message.warning('项目未绑定目标服务器');
    return;
  }
  try {
    const hosts = await queryHostOptions(row.msProjectHostOs);
    logHostOptions.value = (hosts ?? [])
      .filter(h => hostIds.includes(h.id))
      .map(h => ({ label: `${h.name} (${h.address})`, value: h.id }));
    logProject.value = row;
    logVisible.value = true;
  } catch (e) {
    message.error((e as Error).message);
  }
}

function parseHostIds(json?: string): number[] {
  try {
    const arr = JSON.parse(json || '[]');
    return Array.isArray(arr) ? arr as number[] : [];
  } catch { return []; }
}

/* ================== 结果弹窗 ================== */
const resultVisible = ref(false);
const resultTitle = ref('');
const resultLogs = ref<any[]>([]);

function showActionResult(logs: any[]) {
  if (!logs || logs.length === 0) {
    message.success('操作完成');
    return;
  }
  resultLogs.value = logs;
  const failed = logs.filter(l => l.msProjectDeployLogStatus === 'FAIL').length;
  resultTitle.value = failed > 0 ? `完成，${failed} 台失败` : '全部成功';
  resultVisible.value = true;
}

/* ================== 工具函数 ================== */
function hostCount(row: ProjectRow): number {
  try {
    const arr = JSON.parse(row.msProjectHostIds || '[]');
    return Array.isArray(arr) ? arr.length : 0;
  } catch { return 0; }
}
function isLinux(row: ProjectRow) {
  return (row.msProjectHostOs || '').toUpperCase().startsWith('LINUX');
}
</script>

<template>
  <div class="project-list sc-page">
    <ReSectionHead class="page-head" title="发布项目管理" description="软件部署 / 升级 / 回滚 / 实时日志">
      <template #actions>
        <ReButton layout="square" type="primary" icon="Plus">新建项目</ReButton>
        <ReButton layout="square" icon="Refresh">刷新</ReButton>
      </template>
    </ReSectionHead>

    <!-- 工具条 -->
    <div class="page-toolbar">
      <ReInput
        v-model="keyword"
        placeholder="搜索项目名称/编码"
        clearable
        style="width:240px"
        @keyup.enter="refresh"
        @clear="refresh"
      >
        <template #prefix><ReIcon name="Search" :size="14" /></template>
      </ReInput>
      <ReSelect
        v-model="filterType"
        placeholder="项目类型"
        clearable
        :data="typeOptions"
        style="width:200px"
        @change="refresh"
      />
      <ReButton layout="square" icon="Search" @click="refresh">查询</ReButton>
      <div class="spacer" />
      <span class="muted">{{ projects.length }} 个项目</span>
    </div>

    <!-- 卡片网格 -->
    <div v-loading="loading" class="project-grid">
      <div
        v-for="row in projects"
        :key="row.id"
        class="project-card"
        :class="{
          deploying: deployingIds.has(row.id),
          dragover: cardDragover === row.id,
        }"
        @dragover.prevent="cardDragover = row.id"
        @dragleave="cardDragover = null"
        @drop.prevent="handleDrop(row, $event)"
      >
        <!-- 头部 -->
        <div class="project-card__head">
          <div class="project-card__name">
            <span class="ico"><ReIcon name="Box" :size="17" /></span>
            <div style="min-width:0">
              <div class="project-card__title" :title="row.msProjectName">{{ row.msProjectName }}</div>
              <div class="project-card__code">{{ row.msProjectCode }}</div>
            </div>
          </div>
          <ReTag :type="statusMap[row.msProjectRuntimeStatus || 'UNKNOWN']?.cls || 'info'">
            {{ statusMap[row.msProjectRuntimeStatus || 'UNKNOWN']?.label || row.msProjectRuntimeStatus }}
          </ReTag>
        </div>

        <!-- 进度条（实时） -->
        <div
          v-if="projectProgress[row.id]"
          class="project-card__progress"
        >
          <ReTag size="small" :type="projectProgress[row.id].status === 'FAIL' ? 'danger' : 'warning'">
            {{ projectProgress[row.id].stage }}: {{ projectProgress[row.id].message }}
          </ReTag>
        </div>

        <!-- 元信息 -->
        <div class="project-card__meta">
          <span class="kv"><span>类型</span><span class="v">{{ typeLabels[row.msProjectType] || row.msProjectType }}</span></span>
          <span class="kv"><span>主机</span><span class="v">{{ hostCount(row) }} 台</span></span>
          <span class="kv"><span>OS</span><span class="v">{{ isLinux(row) ? 'Linux' : 'Windows' }}</span></span>
          <span class="kv" v-if="row.msProjectCurrentVersion">
            <span>版本</span><span class="v" :title="row.msProjectCurrentVersion">{{ row.msProjectCurrentVersion }}</span>
          </span>
        </div>

        <!-- 升级策略 + 自动启动 -->
        <div class="project-card__policy">
          <span class="policy-chip" :class="{ 'policy-on': row.msProjectDeleteBefore === 1 }">升级前删除</span>
          <span class="policy-chip">{{ row.msProjectOverwriteMode === 'REPLACE' ? '全量替换' : '直接覆盖' }}</span>
          <span class="policy-chip">{{ row.msProjectAutoExtract === 1 ? '自动解压' : '仅上传' }}</span>
          <span class="policy-chip policy-on" v-if="row.msProjectAutoStart === 1">部署后自动启动</span>
        </div>

        <!-- 拖拽上传区 -->
        <div class="project-card__drop">
          <ReIcon name="UploadFilled" :size="15" />
          <span v-if="deployingIds.has(row.id)">部署中...</span>
          <span v-else>拖拽部署包到此处</span>
        </div>

        <!-- 操作区 -->
        <div class="project-card__actions">
          <ReButton layout="square" size="small" type="primary" icon="VideoPlay" @click="runLifecycle(row, 'start')">启动</ReButton>
          <ReButton layout="square" size="small" icon="VideoPause" @click="runLifecycle(row, 'stop')">停止</ReButton>
          <ReButton layout="square" size="small" icon="RefreshRight" @click="runLifecycle(row, 'restart')">重启</ReButton>
          <ReDropdown trigger="click">
            <ReButton layout="square" size="small" icon="Upload">上传包</ReButton>
            <template #dropdown>
              <ReDropdownMenu>
                <ReDropdownItem @click="pickFile(row, 'DEPLOY')">部署（DEPLOY）</ReDropdownItem>
                <ReDropdownItem @click="pickFile(row, 'UPGRADE')">升级（UPGRADE）</ReDropdownItem>
              </ReDropdownMenu>
            </template>
          </ReDropdown>
          <div class="spacer" />
          <ReButton layout="square" size="small" icon="Document" @click="openLiveLog(row)">实时日志</ReButton>
          <ReButton layout="square" size="small" icon="UploadBack" @click="openRollback(row)">回滚</ReButton>
          <ReButton layout="square" size="small" icon="Edit" @click="openEdit(row)">编辑</ReButton>
          <ReButton layout="square" size="small" icon="Delete" @click="removeProject(row)">删除</ReButton>
        </div>
      </div>
    </div>

    <div v-if="!loading && projects.length === 0" class="empty-state">
      <div class="empty-ico">📦</div>
      <div class="empty-text">暂无项目，点击右上角「新建项目」创建</div>
    </div>

    <!-- 表单弹窗 -->
    <ScProjectFormDialog v-model:visible="formVisible" :project="editingProject" @saved="refresh" />

    <!-- 实时日志抽屉 -->
    <ScLiveLog
      v-if="logProject"
      v-model:visible="logVisible"
      :project-id="logProject.id"
      :project-name="logProject.msProjectName"
      :host-options="logHostOptions"
    />

    <!-- 操作结果弹窗 -->
    <ReDialog
      v-model="resultVisible"
      :title="resultTitle"
      :width="720"
      confirm-text="关闭"
      cancel-text=""
      @confirm="resultVisible = false"
      @cancel="resultVisible = false"
    >
      <ReTable :data="resultLogs" size="small" :pagination="false" :toolbar="false">
        <ReTableColumn label="主机" prop="msProjectDeployLogHostName" min-width="120" show-overflow-tooltip />
        <ReTableColumn label="状态" width="90">
          <template #default="{ row }">
            <ReTag :type="row.msProjectDeployLogStatus === 'SUCCESS' ? 'success' : row.msProjectDeployLogStatus === 'FAIL' ? 'danger' : 'warning'" size="small">
              {{ row.msProjectDeployLogStatus }}
            </ReTag>
          </template>
        </ReTableColumn>
        <ReTableColumn label="耗时" width="80">
          <template #default="{ row }">
            <span class="dim">{{ row.msProjectDeployLogCostMs }}ms</span>
          </template>
        </ReTableColumn>
        <ReTableColumn label="输出" min-width="200">
          <template #default="{ row }">
            <div class="truncate mono">{{ row.msProjectDeployLogOutput || row.msProjectDeployLogError || '-' }}</div>
          </template>
        </ReTableColumn>
      </ReTable>
    </ReDialog>

    <!-- 回滚选择抽屉 -->
    <ReDrawer
      v-model="rollbackVisible"
      :title="`回滚 - ${rollbackProjectRow?.msProjectName}`"
      :size="640"
    >
      <div class="rollback-panel" style="padding:0 4px">
        <p class="dim" style="margin-bottom:12px">选择要回滚到的历史版本：</p>
        <div v-if="rollbackArchives.length === 0" class="empty-state" style="padding:32px">
          <div class="empty-ico">📦</div>
          <div class="empty-text">暂无历史版本</div>
        </div>
        <ReTable v-else :data="rollbackArchives" size="small" :pagination="false" :toolbar="false"
          highlight-current-row @current-change="rollbackSelected = $event?.id">
          <ReTableColumn label="版本" prop="msProjectUploadArchiveVersion" min-width="180" show-overflow-tooltip />
          <ReTableColumn label="主机" prop="msProjectUploadArchiveHostName" width="140" show-overflow-tooltip />
          <ReTableColumn label="类型" prop="msProjectUploadArchiveType" width="100" />
          <ReTableColumn label="部署时间" width="170">
            <template #default="{ row }">
              <span class="dim">{{ row.msProjectUploadArchiveDeployTime || '-' }}</span>
            </template>
          </ReTableColumn>
          <ReTableColumn label="大小" width="80">
            <template #default="{ row }">
              <span class="dim">{{ row.msProjectUploadArchiveFileSize ? (row.msProjectUploadArchiveFileSize / 1024).toFixed(0) + 'KB' : '-' }}</span>
            </template>
          </ReTableColumn>
        </ReTable>
        <div style="margin-top:16px;display:flex;justify-content:flex-end;gap:8px">
          <ReButton @click="rollbackVisible = false">取消</ReButton>
          <ReButton type="primary" :disabled="!rollbackSelected || rollbackLoading" :loading="rollbackLoading" @click="submitRollback">确认回滚</ReButton>
        </div>
      </div>
    </ReDrawer>
  </div>
</template>

<style scoped>
.policy-on { color: var(--brand-600); border-color: var(--brand-300); background: var(--brand-50); }
.project-card__progress { padding-top: 4px; }
</style>