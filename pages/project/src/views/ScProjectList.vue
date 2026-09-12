<script setup lang="ts">
/**
 * 发布项目管理 —— 图标宫格门户（对齐 kodcloud 项目主页布局）
 * 顶部状态导航 + 大图标宫格 + hover 操作浮层 + 详情抽屉
 * 组件约定：全量使用 Re 组件体系。
 */
import { computed, onBeforeUnmount, onMounted, ref } from 'vue';
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
  msProjectHealthEnabled?: number;
  msProjectHealthType?: string;
  msProjectHealthTarget?: string;
  msProjectHealthTimeout?: number;
  msProjectAutoRollback?: number;
  msProjectDeployRetry?: number;
  msProjectArchiveKeep?: number;
  msProjectCurrentVersion?: string;
  msProjectRuntimeStatus?: string;
  msProjectEnabled?: number;
  msProjectSort?: number;
  msProjectRemark?: string;
}

const loading = ref(false);
const projects = ref<ProjectRow[]>([]);

/* ================== 顶部状态导航 ================== */
const navItems = [
  { label: '全部', value: 'all' },
  { label: '运行中', value: 'RUNNING' },
  { label: '部署中', value: 'deploying' },
  { label: '已停止', value: 'STOPPED' },
  { label: '异常', value: 'abnormal' },
];
const activeNav = ref('all');

const filteredProjects = computed(() => {
  if (activeNav.value === 'all') return projects.value;
  if (activeNav.value === 'deploying')
    return projects.value.filter(r => ['DEPLOYING', 'UPGRADING', 'RESTARTING', 'ROLLING_BACK'].includes(r.msProjectRuntimeStatus || ''));
  if (activeNav.value === 'abnormal')
    return projects.value.filter(r => ['UNKNOWN'].includes(r.msProjectRuntimeStatus || '') || r.msProjectEnabled === 0);
  return projects.value.filter(r => r.msProjectRuntimeStatus === activeNav.value);
});

/* 类型：图标 + 配色（kodcloud 式大图标） */
const typeMeta: Record<string, { icon: string; cls: string; label: string }> = {
  SPRINGBOOT_MONO: { icon: 'Box', cls: 't-green', label: 'SpringBoot 单体jar' },
  SPRINGBOOT_WAR: { icon: 'TakeawayBox', cls: 't-blue', label: 'SpringBoot war包' },
  SPRINGBOOT_SPLIT: { icon: 'CopyDocument', cls: 't-violet', label: '前后端分离' },
  NODEJS: { icon: 'Document', cls: 't-amber', label: 'Node.js' },
  STATIC: { icon: 'Picture', cls: 't-cyan', label: '静态资源' },
  CUSTOM: { icon: 'Setting', cls: 't-gray', label: '自定义' },
};
function iconOf(row: ProjectRow) {
  return typeMeta[row.msProjectType]?.icon || 'Box';
}
function iconClsOf(row: ProjectRow) {
  return typeMeta[row.msProjectType]?.cls || 't-gray';
}

/* 状态：标签 + 角标色 */
const statusMap: Record<string, { label: string; cls: string; dot: string }> = {
  RUNNING: { label: '运行中', cls: 'success', dot: 'dot-green' },
  STOPPED: { label: '已停止', cls: 'info', dot: 'dot-gray' },
  UNKNOWN: { label: '未知', cls: 'warning', dot: 'dot-amber' },
  DEPLOYING: { label: '部署中', cls: 'warning', dot: 'dot-amber' },
  UPGRADING: { label: '升级中', cls: 'warning', dot: 'dot-amber' },
  RESTARTING: { label: '重启中', cls: 'warning', dot: 'dot-amber' },
  ROLLING_BACK: { label: '回滚中', cls: 'warning', dot: 'dot-amber' },
};

const deployingIds = ref<Set<number>>(new Set());
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
      projectProgress.value[pid] = {
        stage: payload.stage,
        status: payload.status,
        message: payload.message,
      };
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
    const filterMap: Record<string, string> = {};
    if (filterType.value) filterMap.type = filterType.value;
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

/* 工具条搜索 */
const keyword = ref('');
const filterType = ref('');
const typeOptions = Object.entries(typeMeta).map(([value, m]) => ({ label: m.label, value }));

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
  detailVisible.value = false;
  refresh();
}

/* ================== 详情抽屉 ================== */
const detailVisible = ref(false);
const detailProject = ref<ProjectRow | null>(null);

function openDetail(row: ProjectRow) {
  detailProject.value = row;
  detailVisible.value = true;
}

async function toggleEnabled(row: ProjectRow) {
  await switchProject(row.id, !row.msProjectEnabled);
  message.success(row.msProjectEnabled ? '已停用' : '已启用');
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
  return parseHostIds(row.msProjectHostIds).length;
}
function healthTargetOf(row: ProjectRow): string {
  if (row.msProjectHealthEnabled !== 1) return '';
  const type = row.msProjectHealthType || 'PORT';
  return `${type}: ${row.msProjectHealthTarget || '-'} (超时${row.msProjectHealthTimeout ?? 30}s)`;
}
function healthTypeLabel(type?: string): string {
  const map: Record<string, string> = { PORT: '端口', HTTP: 'HTTP', PROCESS: '进程' };
  return map[type || 'PORT'] || '端口';
}
</script>

<template>
  <div class="project-portal sc-page">
    <!-- 顶部导航（对齐 kodcloud 项目主页：标题 + 状态 tab + 搜索/操作） -->
    <div class="portal-head">
      <div class="portal-title">
        <ReIcon name="Box" :size="20" />
        <span>发布项目管理</span>
        <span class="portal-count">{{ filteredProjects.length }}</span>
      </div>
      <div class="portal-tabs">
        <button
          v-for="t in navItems"
          :key="t.value"
          class="portal-tab"
          :class="{ active: activeNav === t.value }"
          @click="activeNav = t.value"
        >
          {{ t.label }}
        </button>
      </div>
      <div class="portal-search">
        <ReInput
          v-model="keyword"
          placeholder="搜索项目名称/编码"
          clearable
          style="width:200px"
          @keyup.enter="refresh"
          @clear="refresh"
        >
          <template #prefix><ReIcon name="Search" :size="14" /></template>
        </ReInput>
        <ReButton layout="square" icon="Search" @click="refresh">查询</ReButton>
        <ReButton layout="square" type="primary" icon="Plus" @click="openCreate">新建项目</ReButton>
        <ReButton layout="square" icon="Refresh" @click="refresh">刷新</ReButton>
      </div>
    </div>

    <!-- 图标宫格（对齐 kodcloud 应用宫格：大图标 + 标题 + 状态角标 + hover 操作浮层） -->
    <div v-loading="loading" class="portal-grid" :class="{ 'is-empty': filteredProjects.length === 0 }">
      <div
        v-for="row in filteredProjects"
        :key="row.id"
        class="portal-app"
        :class="{
          working: deployingIds.has(row.id) || !!projectProgress[row.id],
          offline: row.msProjectEnabled === 0,
        }"
        @click="openDetail(row)"
      >
        <!-- 状态角标 -->
        <span class="portal-dot" :class="statusMap[row.msProjectRuntimeStatus || 'UNKNOWN']?.dot || 'dot-amber'" />

        <!-- 大图标 -->
        <div class="portal-icon" :class="iconClsOf(row)">
          <ReIcon :name="iconOf(row)" :size="36" />
        </div>

        <!-- 标题 -->
        <div class="portal-name" :title="row.msProjectName">{{ row.msProjectName }}</div>
        <div class="portal-sub" :title="typeMeta[row.msProjectType]?.label || row.msProjectType">
          <span class="portal-ver" v-if="row.msProjectCurrentVersion" :title="row.msProjectCurrentVersion">
            {{ (row.msProjectCurrentVersion || '').slice(0, 18) }}
          </span>
          <ReTag :type="statusMap[row.msProjectRuntimeStatus || 'UNKNOWN']?.cls || 'info'" size="small" round>
            {{ statusMap[row.msProjectRuntimeStatus || 'UNKNOWN']?.label || row.msProjectRuntimeStatus }}
          </ReTag>
        </div>

        <!-- 策略标识 -->
        <div class="portal-policy">
          <span class="policy-chip" :class="{ 'policy-on': row.msProjectAutoStart === 1 }">启动</span>
          <span class="policy-chip" :class="{ 'policy-on': row.msProjectHealthEnabled === 1 }" :title="healthTargetOf(row)">健康</span>
          <span class="policy-chip" :class="{ 'policy-on': row.msProjectAutoRollback === 1 }">回滚</span>
          <span class="policy-chip" v-if="row.msProjectDeployRetry">重试{{ row.msProjectDeployRetry }}</span>
        </div>

        <!-- 进度 -->
        <div v-if="projectProgress[row.id]" class="portal-progress">
          <span class="portal-progress-text">{{ projectProgress[row.id].stage }}: {{ projectProgress[row.id].message }}</span>
        </div>

        <!-- hover 操作浮层 -->
        <div class="portal-ops" @click.stop>
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
          <ReButton layout="square" size="small" icon="Document" @click="openLiveLog(row)">实时日志</ReButton>
          <ReButton layout="square" size="small" icon="UploadBack" @click="openRollback(row)">回滚</ReButton>
          <ReButton layout="square" size="small" icon="Edit" @click="openEdit(row)">编辑</ReButton>
          <ReButton layout="square" size="small" icon="Delete" @click="removeProject(row)">删除</ReButton>
        </div>
      </div>

      <!-- 空态 -->
      <div v-if="!loading && filteredProjects.length === 0" class="portal-empty">
        <div class="empty-ico">📦</div>
        <div class="empty-text">暂无项目，点击右上角「新建项目」创建</div>
      </div>
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

    <!-- 详情抽屉 -->
    <ReDrawer
      v-model="detailVisible"
      :title="detailProject?.msProjectName || '项目详情'"
      :size="560"
    >
      <div v-if="detailProject" class="detail-panel" style="padding:0 4px">
        <div class="detail-hero">
          <div class="portal-icon lg" :class="iconClsOf(detailProject)">
            <ReIcon :name="iconOf(detailProject)" :size="44" />
          </div>
          <div class="detail-hero__info">
            <div class="detail-hero__name">{{ detailProject.msProjectName }}</div>
            <div class="detail-hero__code">{{ detailProject.msProjectCode }} · {{ typeMeta[detailProject.msProjectType]?.label }}</div>
            <div class="detail-hero__tags">
              <ReTag :type="statusMap[detailProject.msProjectRuntimeStatus || 'UNKNOWN']?.cls || 'info'" size="small">
                {{ statusMap[detailProject.msProjectRuntimeStatus || 'UNKNOWN']?.label }}
              </ReTag>
              <span class="policy-chip">{{ hostCount(detailProject) }} 台主机</span>
              <span v-if="detailProject.msProjectAutoStart === 1" class="policy-chip policy-on">部署后自动启动</span>
              <span v-if="detailProject.msProjectHealthEnabled === 1" class="policy-chip policy-on">健康检查</span>
              <span v-if="detailProject.msProjectAutoRollback === 1" class="policy-chip policy-on">失败自动回滚</span>
            </div>
          </div>
        </div>

        <div class="detail-rows">
          <div class="detail-row"><span>版本</span><span>{{ detailProject.msProjectCurrentVersion || '-' }}</span></div>
          <div class="detail-row"><span>部署目录</span><span class="mono">{{ detailProject.msProjectDeployDir || '-' }}</span></div>
          <div class="detail-row"><span>日志</span><span class="mono">{{ detailProject.msProjectLogDir || '-' }}{{ detailProject.msProjectLogFile ? '/' + detailProject.msProjectLogFile : '' }}</span></div>
          <div class="detail-row"><span>升级策略</span><span>
            {{ detailProject.msProjectDeleteBefore === 1 ? '升级前删除' : '保留旧内容' }} ·
            {{ detailProject.msProjectOverwriteMode === 'REPLACE' ? '全量替换' : '直接覆盖' }} ·
            {{ detailProject.msProjectAutoExtract === 1 ? '自动解压' : '仅上传' }}
          </span></div>
          <div class="detail-row" v-if="detailProject.msProjectHealthEnabled === 1">
            <span>健康检查</span>
            <span>
              {{ healthTypeLabel(detailProject.msProjectHealthType) }} 探测
              <span class="mono">{{ detailProject.msProjectHealthTarget || '-' }}</span>
              （超时 {{ detailProject.msProjectHealthTimeout ?? 30 }}s）
            </span>
          </div>
          <div class="detail-row">
            <span>故障自愈</span>
            <span>
              单台重试 {{ detailProject.msProjectDeployRetry || 0 }} 次 ·
              归档保留 {{ detailProject.msProjectArchiveKeep || 0 }} 份
              {{ detailProject.msProjectArchiveKeep ? '(超出自动清理)' : '(不清理)' }}
            </span>
          </div>
          <div class="detail-row"><span>备注</span><span>{{ detailProject.msProjectRemark || '-' }}</span></div>
        </div>

        <div class="detail-ops">
          <ReButton layout="square" type="primary" icon="VideoPlay" @click="runLifecycle(detailProject, 'start')">启动</ReButton>
          <ReButton layout="square" icon="VideoPause" @click="runLifecycle(detailProject, 'stop')">停止</ReButton>
          <ReButton layout="square" icon="RefreshRight" @click="runLifecycle(detailProject, 'restart')">重启</ReButton>
          <ReDropdown trigger="click">
            <ReButton layout="square" icon="Upload">上传包</ReButton>
            <template #dropdown>
              <ReDropdownMenu>
                <ReDropdownItem @click="pickFile(detailProject, 'DEPLOY')">部署（DEPLOY）</ReDropdownItem>
                <ReDropdownItem @click="pickFile(detailProject, 'UPGRADE')">升级（UPGRADE）</ReDropdownItem>
              </ReDropdownMenu>
            </template>
          </ReDropdown>
          <ReButton layout="square" icon="Document" @click="openLiveLog(detailProject)">实时日志</ReButton>
          <ReButton layout="square" icon="UploadBack" @click="openRollback(detailProject)">回滚</ReButton>
          <ReButton layout="square" icon="Edit" @click="openEdit(detailProject)">编辑</ReButton>
          <ReButton layout="square" icon="Delete" @click="removeProject(detailProject)">删除</ReButton>
        </div>
      </div>
    </ReDrawer>
  </div>
</template>

<style scoped>
.policy-on { color: var(--brand-600); border-color: var(--brand-300); background: var(--brand-50); }
</style>