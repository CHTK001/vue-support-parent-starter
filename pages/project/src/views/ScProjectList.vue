<script setup lang="ts">
/**
 * 发布项目管理 —— 卡片网格 + 拖拽上传 + 启停/升级 + 部署日志
 * 组件约定：全量使用 Re 组件体系。
 */
import { onMounted, ref } from 'vue';
import { message } from '@repo/core';
import {
  queryProjects,
  delProject,
  switchProject,
  deployProject,
  startProject,
  stopProject,
  restartProject,
} from '../api';
import ScProjectFormDialog from '../components/ScProjectFormDialog.vue';
import ScDeployLog from '../components/ScDeployLog.vue';
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
  msProjectDeleteBefore?: number;
  msProjectOverwriteMode?: string;
  msProjectAutoExtract?: number;
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

/** 类型下拉选项（ReSelect data 格式） */
const typeOptions = Object.entries(typeLabels).map(([value, label]) => ({ label, value }));

const statusMap: Record<string, { label: string; cls: string }> = {
  RUNNING: { label: '运行中', cls: 'success' },
  STOPPED: { label: '已停止', cls: 'info' },
  UNKNOWN: { label: '未知', cls: 'warning' },
  DEPLOYING: { label: '部署中', cls: 'warning' },
  UPGRADING: { label: '升级中', cls: 'warning' },
  RESTARTING: { label: '重启中', cls: 'warning' },
};

const deployingIds = ref<Set<number>>(new Set());

onMounted(refresh);

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

async function toggleEnabled(row: ProjectRow) {
  await switchProject(row.id, !row.msProjectEnabled);
  message.success(row.msProjectEnabled ? '已停用' : '已启用');
  refresh();
}

/* ================== 生命周期操作 ================== */
async function runLifecycle(row: ProjectRow, action: 'start' | 'stop' | 'restart') {
  await message.confirm(`确认${action === 'start' ? '启动' : action === 'stop' ? '停止' : '重启'}项目 ${row.msProjectName}？`, '确认');
  const logs = await (action === 'start' ? startProject(row.id)
    : action === 'stop' ? stopProject(row.id) : restartProject(row.id));
  showActionResult(logs);
  refresh();
}

/* ================== 部署 / 升级上传 ================== */
const uploadMode = ref<'DEPLOY' | 'UPGRADE'>('DEPLOY');

async function uploadToCard(row: ProjectRow, file: File) {
  if (deployingIds.value.has(row.id)) {
    message.warning('该项目正在部署中，请稍候');
    return;
  }
  deployingIds.value.add(row.id);
  try {
    message.info(`开始${uploadMode.value === 'UPGRADE' ? '升级' : '部署'} ${row.msProjectName}...`);
    const logs = await deployProject(row.id, file, uploadMode.value);
    showActionResult(logs);
  } catch (e) {
    message.error(`部署失败: ${(e as Error).message}`);
  } finally {
    deployingIds.value.delete(row.id);
    refresh();
  }
}

function pickFile(row: ProjectRow, mode: 'DEPLOY' | 'UPGRADE') {
  uploadMode.value = mode;
  const input = document.createElement('input');
  input.type = 'file';
  input.style.display = 'none';
  input.onchange = () => {
    const f = input.files?.[0];
    if (f) uploadToCard(row, f);
  };
  document.body.appendChild(input);
  input.click();
  input.remove();
}

function handleDrop(row: ProjectRow, e: DragEvent) {
  e.preventDefault();
  cardDragover.value = null;
  const file = e.dataTransfer?.files?.[0];
  if (file) {
    uploadMode.value = 'DEPLOY';
    uploadToCard(row, file);
  }
}

const cardDragover = ref<number | null>(null);

/* ================== 操作结果展示 ================== */
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

/* ================== 部署日志抽屉 ================== */
const logVisible = ref(false);
const logProject = ref<ProjectRow | null>(null);

function openLogs(row: ProjectRow) {
  logProject.value = row;
  logVisible.value = true;
}

/* ================== 工具函数 ================== */
function hostCount(row: ProjectRow): number {
  try {
    const arr = JSON.parse(row.msProjectHostIds || '[]');
    return Array.isArray(arr) ? arr.length : 0;
  } catch {
    return 0;
  }
}
function isLinux(row: ProjectRow) {
  return (row.msProjectHostOs || '').toUpperCase().startsWith('LINUX');
}
</script>

<template>
  <div class="project-list sc-page">
    <ReSectionHead class="page-head" title="发布项目管理" description="软件部署 / 升级 / 启停维护">
      <template #actions>
        <ReButton show-text icon="Plus" type="primary" @click="openCreate">新建项目</ReButton>
        <ReButton show-text icon="Refresh" @click="refresh">刷新</ReButton>
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
      <ReButton icon="Search" :show-text="false" title="查询" @click="refresh" />
      <div class="spacer" />
      <span class="muted">{{ projects.length }} 个项目</span>
    </div>

    <!-- 卡片网格 -->
    <div v-loading="loading" class="project-grid">
      <div
        v-for="row in projects"
        :key="row.id"
        class="project-card"
        :class="{ deploying: deployingIds.has(row.id), dragover: cardDragover === row.id }"
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

        <!-- 元信息 -->
        <div class="project-card__meta">
          <span class="kv"><span>类型</span><span class="v">{{ typeLabels[row.msProjectType] || row.msProjectType }}</span></span>
          <span class="kv"><span>主机</span><span class="v">{{ hostCount(row) }} 台</span></span>
          <span class="kv"><span>OS</span><span class="v">{{ isLinux(row) ? 'Linux' : 'Windows' }}</span></span>
          <span class="kv" v-if="row.msProjectCurrentVersion"><span>版本</span><span class="v" :title="row.msProjectCurrentVersion">{{ row.msProjectCurrentVersion }}</span></span>
        </div>

        <!-- 升级策略 -->
        <div class="project-card__policy">
          <span class="policy-chip" :class="{ 'policy-on': row.msProjectDeleteBefore === 1 }">升级前删除</span>
          <span class="policy-chip">{{ row.msProjectOverwriteMode === 'REPLACE' ? '全量替换' : '直接覆盖' }}</span>
          <span class="policy-chip">{{ row.msProjectAutoExtract === 1 ? '自动解压' : '仅上传' }}</span>
        </div>

        <!-- 拖拽上传区 -->
        <div class="project-card__drop">
          <ReIcon name="UploadFilled" :size="15" />
          <span v-if="deployingIds.has(row.id)">部署中...</span>
          <span v-else>拖拽部署包到此处 或 点击选择</span>
        </div>

        <!-- 操作区 -->
        <div class="project-card__actions">
          <ReButton size="small" type="primary" icon="VideoPlay" show-text @click="runLifecycle(row, 'start')">启动</ReButton>
          <ReButton size="small" icon="VideoPause" show-text @click="runLifecycle(row, 'stop')">停止</ReButton>
          <ReButton size="small" icon="RefreshRight" show-text @click="runLifecycle(row, 'restart')">重启</ReButton>
          <ReDropdown trigger="click" style="margin-left:4px">
            <ReButton size="small" icon="Upload">
              <span style="display:inline-flex;align-items:center">上传包<ReIcon name="ArrowDown" :size="12" /></span>
            </ReButton>
            <template #dropdown>
              <ReDropdownMenu>
                <ReDropdownItem @click="pickFile(row, 'DEPLOY')">部署（DEPLOY）</ReDropdownItem>
                <ReDropdownItem @click="pickFile(row, 'UPGRADE')">升级（UPGRADE）</ReDropdownItem>
              </ReDropdownMenu>
            </template>
          </ReDropdown>
          <div class="spacer" />
          <ReButton size="small" icon="Document" :show-text="false" title="部署日志" @click="openLogs(row)" />
          <ReButton size="small" icon="Edit" :show-text="false" title="编辑" @click="openEdit(row)" />
          <ReButton size="small" icon="Delete" :show-text="false" title="删除" @click="removeProject(row)" />
        </div>
      </div>
    </div>

    <div v-if="!loading && projects.length === 0" class="empty-state">
      <div class="empty-ico">📦</div>
      <div class="empty-text">暂无项目，点击右上角「新建项目」创建</div>
    </div>

    <!-- 表单弹窗 -->
    <ScProjectFormDialog v-model:visible="formVisible" :project="editingProject" @saved="refresh" />

    <!-- 部署日志抽屉 -->
    <ScDeployLog v-if="logProject" v-model:visible="logVisible" :project-id="logProject.id" :project-name="logProject.msProjectName" />

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
  </div>
</template>

<style scoped>
.spacer { flex: 1; }
.muted { color: var(--text-tertiary); font-size: 12px; }
.dim { color: var(--text-tertiary); }
.truncate { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.mono { font-family: ui-monospace, SFMono-Regular, monospace; font-size: 12px; }
.policy-on { color: var(--brand-600); border-color: var(--brand-300); background: var(--brand-50); }
</style>