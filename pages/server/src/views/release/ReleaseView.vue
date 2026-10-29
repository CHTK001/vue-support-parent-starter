<template>
  <div class="px tel-page release-page">
    <ReSectionHead description="管理服务器发布与项目 · 支持启动/停止/重启/升级/备份/回滚">
      <template #title>发布管理</template>
      <template #actions>
        <ReButton icon="Top" :show-text="true" :loading="batchLoading" @click="openBatchUpgrade">批量升级</ReButton>
        <ReButton icon="Plus" :show-text="true" type="primary" @click="openCreateDialog">新增发布</ReButton>
      </template>
    </ReSectionHead>

    <div class="release-wrap">
      <ReEmpty v-if="!list.length" description="点击右上角「新增发布」创建发布" :image-size="80" style="padding: 56px 0" />
      <div v-else class="card-grid">
        <div v-for="item in list" :key="item.id" class="release-card" @click="goToProjects(item)">
          <!-- 左侧：服务器背景图 / 平台图标（按服务器平台着色） -->
          <div class="card-media" :class="osType(item)">
            <img v-if="item.backgroundImage" :src="item.backgroundImage" class="media-img" alt="" />
            <template v-else>
              <span class="media-ico" v-html="osIconSvg(hostOsOf(item))"></span>
              <span class="media-os">{{ osLabel(hostOsOf(item)) }}</span>
            </template>
          </div>

          <!-- 右侧：详情 -->
          <div class="card-content">
            <!-- 悬停浮现：编辑 / 删除 -->
            <div class="card-actions" @click.stop>
              <button class="mini-ico" title="编辑" @click="openEditDialog(item)">
                <el-icon><EditPen /></el-icon>
              </button>
              <button class="mini-ico danger" title="删除" @click="handleDelete(item)">
                <el-icon><Delete /></el-icon>
              </button>
            </div>

            <div class="content-top">
              <h3 class="release-name" :title="item.releaseName">{{ item.releaseName }}</h3>
              <span class="proj-count">
                <el-icon><Files /></el-icon>{{ counts[item.id] ?? 0 }} 个项目
              </span>
            </div>
            <div class="host-line">
              <span class="host-chip">{{ hostNameOf(item) }}</span>
              <span class="host-ip">{{ item.hostIp || '未绑定主机' }}</span>
            </div>
            <p class="release-desc" :class="{ muted: !item.description }">
              {{ item.description || '暂无描述，点击卡片添加项目' }}
            </p>
            <div class="card-footer" @click.stop>
              <button class="ghost-ico" title="软件仓库" @click="goToHost(item)">
                <el-icon><Box /></el-icon><span>软件仓库</span>
              </button>
              <button class="enter-link" @click="goToProjects(item)">
                进入项目<el-icon><ArrowRight /></el-icon>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 新增/编辑对话框 -->
    <ReDialog v-model="dialogVisible" :title="editingId != null ? '编辑发布' : '新增发布'" width="500px">
      <ReForm :model="form" label-position="top">
        <ReFormItem label="发布名称">
          <ReInput v-model="form.releaseName" placeholder="如：生产环境发布" style="width:100%" />
        </ReFormItem>
        <ReFormItem label="主机">
          <ReSelect v-model="form.hostId" placeholder="选择主机" style="width:100%" filterable :teleported="true" popper-class="host-select-popper">
            <ReOption v-for="host in hosts" :key="host.id" :label="host.serverHostName" :value="host.id">
              <span style="float:left">{{ host.serverHostName }}</span>
              <span style="float:right;color:var(--el-text-color-secondary);font-size:12px">{{ host.serverHostAddress }}</span>
            </ReOption>
          </ReSelect>
        </ReFormItem>
        <ReFormItem label="描述">
          <ReInput v-model="form.description" type="textarea" :rows="3" placeholder="发布描述" style="width:100%" />
        </ReFormItem>
        <ReFormItem label="背景图URL">
          <ReInput v-model="form.backgroundImage" placeholder="输入背景图URL（可选）" style="width:100%" />
        </ReFormItem>
      </ReForm>
      <template #footer>
        <ReButton @click="dialogVisible = false">取消</ReButton>
        <ReButton type="primary" @click="handleSave">保存</ReButton>
      </template>
    </ReDialog>

    <!-- 集群批量升级：先选第一个项目定类型，再批量勾选同类型项目 -->
    <ReDialog v-model="batchVisible" title="集群批量升级" width="760px" :close-on-click-modal="false">
      <div class="batch-pane">
        <div class="batch-tip">
          <el-icon class="batch-tip-ic"><InfoFilled /></el-icon>
          <div>
            <div class="batch-tip-title">同类型项目一次下发</div>
            <div class="batch-tip-sub">
              先选一个项目作为「类型基准」，下面自动只列所有发布里与它同类型的项目；
              勾选后按同一份配置逐个下发升级，用于集群升级。
            </div>
          </div>
        </div>

        <el-form label-position="top" class="batch-form">
          <el-form-item label="类型基准项目（决定本次升级的项目类型）">
            <el-select v-model="batchAnchorId" filterable clearable placeholder="选择第一个项目" style="width:100%">
              <el-option
                v-for="p in allProjects"
                :key="p.id"
                :label="`${p.releaseName} / ${p.projectName}`"
                :value="p.id"
              >
                <span class="opt-name">{{ p.releaseName }} / {{ p.projectName }}</span>
                <span class="opt-meta">{{ typeLabel(p.projectType) }}</span>
              </el-option>
            </el-select>
          </el-form-item>
          <el-form-item label="安装包路径（主机上的绝对路径，jar / tar.gz / zip；留空则仅重启）">
            <el-input v-model="batchForm.packagePath" placeholder="如：/data/apps/app.jar" />
          </el-form-item>
        </el-form>

        <div class="batch-switches">
          <el-checkbox v-model="batchForm.autoBackup">自动备份</el-checkbox>
          <el-checkbox v-model="batchForm.autoExtract">自动解压（压缩包）</el-checkbox>
          <el-checkbox v-model="batchForm.autoRestart">自动重启</el-checkbox>
          <el-checkbox v-model="batchForm.autoRollback">失败自动回滚</el-checkbox>
        </div>

        <div class="batch-list-head">
          <span class="blh-title">同类型项目</span>
          <span class="blh-count">已选 {{ batchSelected.length }} / {{ sameTypeProjects.length }}</span>
          <button v-if="sameTypeProjects.length" class="blh-all" @click="toggleBatchAll">
            {{ batchSelected.length === sameTypeProjects.length ? '取消全选' : '全选' }}
          </button>
        </div>
        <div v-if="!batchAnchorId" class="batch-empty">先在上方选择一个项目，类型相同的项目会列在这里</div>
        <div v-else-if="!sameTypeProjects.length" class="batch-empty">没有其它同类型项目</div>
        <div v-else class="batch-list">
          <label v-for="p in sameTypeProjects" :key="p.id" class="batch-row">
            <el-checkbox
              :model-value="batchSelected.includes(p.id)"
              @change="(v: any) => toggleBatchPick(p.id, !!v)"
            />
            <span class="batch-row-name">{{ p.projectName }}</span>
            <span class="batch-row-release">{{ p.releaseName }}</span>
            <span class="batch-row-host">{{ p.hostName }}</span>
            <span v-if="p.enabled === false" class="batch-row-off">已禁用</span>
          </label>
        </div>
      </div>
      <template #footer>
        <ReButton @click="batchVisible = false">取消</ReButton>
        <ReButton type="primary" :loading="batchLoading" :disabled="!batchSelected.length" @click="submitBatchUpgrade">
          开始升级（{{ batchSelected.length }}）
        </ReButton>
      </template>
    </ReDialog>

  </div>
</template>

<script setup lang="ts">
import { message } from "@repo/core";
import { ref, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { ElMessageBox } from 'element-plus';
import { Files, Box, ArrowRight, EditPen, Delete, InfoFilled, Top } from '@element-plus/icons-vue';
import { http, unwrapResult } from '@repo/utils';
import { osIconSvg, osLabel } from '../../utils/osIcon';
import { trackTask } from '../../utils/processTasks';

const BASE = '/ms/server/release';

async function api<T>(path: string): Promise<T> {
  const res = await http().get(BASE + path);
  return unwrapResult<T>(res);
}

const router = useRouter();

interface Release {
  id: number;
  releaseName: string;
  hostId: number;
  hostIp: string;
  description: string;
  backgroundImage: string;
}

interface Host {
  id: number;
  serverHostName: string;
  serverHostAddress: string;
  serverHostOsType?: string;
}

const list = ref<Release[]>([]);
const hosts = ref<Host[]>([]);
const counts = ref<Record<number, number>>({});
const dialogVisible = ref(false);
const editingId = ref<number | null>(null);

const form = ref({
  releaseName: '',
  hostId: undefined as number | undefined,
  description: '',
  backgroundImage: '',
});

/** 平台类型 -> 样式类 */
function osType(item: Release): string {
  const h = hosts.value.find((x) => x.id === item.hostId);
  const t = String(h?.serverHostOsType || '').toUpperCase();
  if (t === 'WINDOWS') return 'win';
  if (t === 'MACOS') return 'mac';
  return 'linux';
}

/** 主机名称 */
function hostNameOf(item: Release): string {
  const h = hosts.value.find((x) => x.id === item.hostId);
  return h ? h.serverHostName : '未绑定主机';
}

/** 主机平台类型（供平台图标/名称使用） */
function hostOsOf(item: Release): string {
  const h = hosts.value.find((x) => x.id === item.hostId);
  return h?.serverHostOsType || '';
}

async function loadList() {
  try {
    const res = await api<Release[]>('/list');
    list.value = res || [];
    loadCounts();
  } catch (e) {
    message.error('加载发布列表失败');
  }
}

/** 并行加载每个发布的项目数量（一次性，非轮询） */
async function loadCounts() {
  await Promise.all(
    list.value.map(async (r) => {
      try {
        const res = await http().get(`${BASE}/${r.id}/projects`);
        const projects = unwrapResult<any[]>(res) || [];
        counts.value[r.id] = projects.length;
      } catch (e) {
        counts.value[r.id] = 0;
      }
    }),
  );
}

async function loadHosts() {
  // 自动重试：后端启动中 / 网络抖动等瞬时失败时，避免主机下拉永久“无数据”
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const res = await http().get('/ms/server/host');
      hosts.value = unwrapResult(res) || [];
      return;
    } catch (e) {
      console.error('加载主机列表失败:', e);
      if (attempt < 2) {
        await new Promise((r) => setTimeout(r, 600));
      }
    }
  }
}

/** 打开对话框前确保主机列表已加载（首次失败也能在点击新增/编辑时重新拉取） */
async function ensureHosts() {
  if (!hosts.value.length) {
    await loadHosts();
  }
}

async function openCreateDialog() {
  await ensureHosts();
  editingId.value = null;
  form.value = { releaseName: '', hostId: undefined, description: '', backgroundImage: '' };
  dialogVisible.value = true;
}

async function openEditDialog(item: Release) {
  await ensureHosts();
  editingId.value = item.id;
  form.value = {
    releaseName: item.releaseName,
    hostId: item.hostId,
    description: item.description,
    backgroundImage: item.backgroundImage || '',
  };
  dialogVisible.value = true;
}

async function handleSave() {
  try {
    if (editingId.value != null) {
      await http().put(BASE + `/${editingId.value}`).data(form.value);
      message.success('更新成功');
    } else {
      await http().post(BASE).data(form.value);
      message.success('创建成功');
    }
    dialogVisible.value = false;
    loadList();
  } catch (e) {
    message.error('保存失败');
  }
}

async function handleDelete(item: Release) {
  try {
    await ElMessageBox.confirm(`确定删除发布「${item.releaseName}」吗？其下项目将一并删除。`, '提示', { type: 'warning' });
    await http().delete(BASE + `/${item.id}`);
    message.success('删除成功');
    loadList();
  } catch (e) {
    if (e !== 'cancel') {
      message.error('删除失败');
    }
  }
}

function goToProjects(item: Release) {
  router.push(`/projects?releaseId=${item.id}`);
}

/**
 * 软件仓库：进入该主机资产工作区的「软件管理」页签。
 *
 * <p>此前跳 {@code /host/:id}（主机监控详情），点「软件仓库」看到的却是监控图表。
 * 现在改为跳到资产页并带上深链参数，落地直接打开软件管理页签。</p>
 */
function goToHost(item: Release) {
  if (!item.hostId) {
    message.warning('该发布未绑定主机');
    return;
  }
  router.push({ path: '/assets', query: { hostId: String(item.hostId), tab: 'software' } });
}

// ==================== 集群批量升级 ====================

/** 所有发布下的全部项目（批量升级的候选池） */
interface BatchProject {
  id: number;
  projectName: string;
  projectType: string;
  enabled: boolean;
  releaseId: number;
  releaseName: string;
  hostName: string;
}

const allProjects = ref<BatchProject[]>([]);
const batchVisible = ref(false);
const batchLoading = ref(false);
/** 类型基准项目：决定本次批量升级的项目类型 */
const batchAnchorId = ref<number | undefined>(undefined);
const batchSelected = ref<number[]>([]);
const batchForm = ref({
  packagePath: '',
  autoBackup: true,
  autoExtract: true,
  autoRestart: true,
  autoRollback: false,
});

const PROJECT_TYPE_LABELS: Record<string, string> = {
  springboot: 'SpringBoot',
  fatjar: 'FatJar',
  git: 'Git 源码部署',
  separated: '分离式',
  model: '模型',
  static: '静态页面',
  nginx: 'Nginx',
};

function typeLabel(t: string): string {
  return PROJECT_TYPE_LABELS[t] || t || '未知';
}

/** 基准项目的类型；未选基准时为 undefined */
const anchorType = computed(() => {
  if (batchAnchorId.value == null) return undefined;
  return allProjects.value.find(p => p.id === batchAnchorId.value)?.projectType;
});

/** 与基准项目同类型的全部项目 */
const sameTypeProjects = computed(() => {
  const t = anchorType.value;
  if (t == null) return [];
  return allProjects.value.filter(p => p.projectType === t);
});

/** 打开批量升级弹框：拉取所有发布下的项目 */
async function openBatchUpgrade() {
  batchLoading.value = true;
  try {
    if (!list.value.length) await loadList();
    if (!hosts.value.length) await loadHosts();
    const rows: BatchProject[] = [];
    await Promise.all(
      list.value.map(async (r) => {
        try {
          const res = await http().get(`${BASE}/${r.id}/projects`);
          const projects = unwrapResult<any[]>(res) || [];
          const host = hosts.value.find(h => h.id === r.hostId);
          for (const p of projects) {
            rows.push({
              id: p.id,
              projectName: p.projectName,
              projectType: p.projectType,
              enabled: p.enabled !== false,
              releaseId: r.id,
              releaseName: r.releaseName,
              hostName: host?.serverHostName || r.hostIp || '未知主机',
            });
          }
        } catch {
          // 单个发布读取失败不影响其它发布
        }
      }),
    );
    allProjects.value = rows;
    batchAnchorId.value = undefined;
    batchSelected.value = [];
    batchForm.value = {
      packagePath: '',
      autoBackup: true,
      autoExtract: true,
      autoRestart: true,
      autoRollback: false,
    };
    batchVisible.value = true;
  } finally {
    batchLoading.value = false;
  }
}

function toggleBatchPick(id: number, checked: boolean) {
  if (checked) {
    if (!batchSelected.value.includes(id)) batchSelected.value = [...batchSelected.value, id];
  } else {
    batchSelected.value = batchSelected.value.filter(x => x !== id);
  }
}

function toggleBatchAll() {
  batchSelected.value = batchSelected.value.length === sameTypeProjects.value.length
    ? []
    : sameTypeProjects.value.map(p => p.id);
}

/** 下发批量升级：每个项目独立异步任务，逐个跟踪 */
async function submitBatchUpgrade() {
  if (!batchSelected.value.length) {
    message.warning('请先勾选要升级的项目');
    return;
  }
  batchLoading.value = true;
  try {
    const res = await http()
      .post(`${BASE}/project/batch-upgrade`)
      .data({ projectIds: batchSelected.value, config: { ...batchForm.value } });
    const results = unwrapResult<any[]>(res) || [];
    let ok = 0;
    let fail = 0;
    for (const r of results) {
      const p = allProjects.value.find(x => x.id === r.projectId);
      if (r.ok && r.taskId) {
        ok += 1;
        trackTask(r.taskId, p?.projectName || `项目 ${r.projectId}`, 'upgrade');
      } else {
        fail += 1;
      }
    }
    if (fail === 0) {
      message.success(`已下发 ${ok} 个项目的升级任务`);
    } else {
      message.warning(`已下发 ${ok} 个，${fail} 个触发失败`);
    }
    batchVisible.value = false;
    loadList();
  } catch {
    message.error('批量升级触发失败');
  } finally {
    batchLoading.value = false;
  }
}

onMounted(() => {
  loadList();
  loadHosts();
});
</script>

<style scoped>
/* 页面内边距：.tel-page 全局归零，发布管理自己补一圈留白，
   否则标题、按钮、卡片都贴在容器边上（本次「内部添加间距」的根因）。 */
.release-page {
  padding: 24px 28px 30px;
  box-sizing: border-box;
}
.release-page :deep(.re-section-head) {
  margin-bottom: 18px;
}

.card-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(360px, 1fr));
  gap: 20px;
  padding: 0;
}

/* ===== 发布卡片（左右结构） ===== */
.release-card {
  position: relative;
  background: var(--bg-container);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-lg);
  overflow: hidden;
  cursor: pointer;
  display: flex;
  flex-direction: row;
  min-height: 172px;
  transition: transform 0.22s var(--ease-out), box-shadow 0.22s var(--ease-out), border-color 0.22s;
}
.release-card:hover {
  transform: translateY(-3px);
  box-shadow: var(--shadow-lg);
  border-color: var(--brand-100);
}

/* 左侧媒体：平台色块 / 背景图 */
.card-media {
  position: relative;
  flex: 0 0 112px;
  width: 112px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
  overflow: hidden;
}
.card-media.linux { background: linear-gradient(150deg, #3b82f6, #2563eb); }
.card-media.win { background: linear-gradient(150deg, #0ea5e9, #0284c7); }
.card-media.mac { background: linear-gradient(150deg, #8b5cf6, #7c3aed); }
.media-img {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
}
.media-ico {
  font-size: 38px;
  line-height: 1;
  color: #fff;
  display: flex;
}
.media-ico :deep(svg) { display: block; }
.media-os {
  font-size: 12px;
  font-weight: 600;
  letter-spacing: 0.5px;
  color: rgba(255, 255, 255, 0.92);
}

/* 右上角操作（悬停浮现） */
.card-actions {
  position: absolute;
  top: 8px;
  right: 8px;
  display: flex;
  gap: 6px;
  opacity: 0;
  transform: translateY(-4px);
  transition: opacity 0.2s, transform 0.2s;
  z-index: 3;
}
.release-card:hover .card-actions {
  opacity: 1;
  transform: translateY(0);
}
.mini-ico {
  width: 28px;
  height: 28px;
  border: none;
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.92);
  color: var(--text-secondary);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 15px;
  transition: background 0.15s, color 0.15s;
}
.mini-ico:hover { color: var(--brand-600); background: #fff; }
.mini-ico.danger:hover { color: var(--el-color-danger); }

/* 右侧详情 */
.card-content {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  padding: 18px 18px 12px;
}
.content-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  padding-right: 64px;
}
.release-name {
  margin: 0;
  font-size: 16px;
  font-weight: 650;
  color: var(--text-primary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.proj-count {
  flex-shrink: 0;
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: 12px;
  color: var(--text-secondary);
  background: var(--bg-fill);
  padding: 2px 8px;
  border-radius: 10px;
}
.host-line {
  display: flex;
  align-items: center;
  gap: 10px;
  margin: 11px 0 9px;
}
.host-chip {
  font-size: 12.5px;
  color: var(--text-primary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.host-ip {
  font-size: 12px;
  color: var(--text-tertiary);
  font-family: ui-monospace, "Cascadia Code", Consolas, monospace;
  white-space: nowrap;
}
.release-desc {
  margin: 0;
  font-size: 12.5px;
  line-height: 1.6;
  color: var(--text-secondary);
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
.release-desc.muted { color: var(--text-tertiary); font-style: italic; }

/* 底部操作 */
.card-footer {
  margin-top: auto;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding-top: 12px;
  border-top: 1px solid var(--border-subtle);
}
.ghost-ico {
  border: none;
  background: transparent;
  color: var(--text-secondary);
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: 5px;
  font-size: 13px;
  padding: 4px 6px;
  border-radius: 8px;
  transition: background 0.15s, color 0.15s;
}
.ghost-ico:hover { color: var(--brand-600); background: var(--brand-50); }
.enter-link {
  border: none;
  background: transparent;
  color: var(--brand-600);
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: 3px;
  font-size: 13px;
  font-weight: 600;
  padding: 4px 6px;
  border-radius: 8px;
  transition: background 0.15s;
}
.enter-link:hover { background: var(--brand-50); }
.enter-link .el-icon { font-size: 14px; }

/* ===== 集群批量升级弹框 ===== */
.batch-pane {
  display: flex;
  flex-direction: column;
  gap: 14px;
}
.batch-tip {
  display: flex;
  gap: 10px;
  padding: 12px 14px;
  border-radius: 10px;
  background: var(--brand-50);
  border: 1px solid var(--brand-100);
}
.batch-tip-ic {
  font-size: 18px;
  color: var(--brand-600);
  flex-shrink: 0;
  margin-top: 1px;
}
.batch-tip-title {
  font-size: 13.5px;
  font-weight: 600;
  color: var(--text-primary);
}
.batch-tip-sub {
  margin-top: 4px;
  font-size: 12.5px;
  line-height: 1.65;
  color: var(--text-secondary);
}
.batch-form {
  margin: 0;
}
.batch-switches {
  display: flex;
  flex-wrap: wrap;
  gap: 18px;
  padding: 10px 14px;
  border: 1px solid var(--border-subtle);
  border-radius: 10px;
}
.batch-list-head {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 12.5px;
  color: var(--text-secondary);
}
.blh-title {
  font-weight: 600;
  color: var(--text-primary);
}
.blh-count {
  margin-left: auto;
  font-variant-numeric: tabular-nums;
}
.blh-all {
  border: none;
  background: transparent;
  color: var(--brand-600);
  font-size: 12.5px;
  cursor: pointer;
  padding: 2px 6px;
  border-radius: 6px;
}
.blh-all:hover {
  background: var(--brand-50);
}
.batch-list {
  display: flex;
  flex-direction: column;
  max-height: 260px;
  overflow-y: auto;
  border: 1px solid var(--border-subtle);
  border-radius: 10px;
}
.batch-row {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 9px 12px;
  cursor: pointer;
  border-bottom: 1px solid var(--border-subtle);
}
.batch-row:last-child {
  border-bottom: none;
}
.batch-row:hover {
  background: var(--bg-fill);
}
.batch-row-name {
  font-size: 13px;
  color: var(--text-primary);
  font-weight: 500;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 220px;
}
.batch-row-release {
  font-size: 12px;
  color: var(--text-tertiary);
}
.batch-row-host {
  margin-left: auto;
  font-size: 12px;
  color: var(--text-secondary);
  font-family: ui-monospace, "Cascadia Code", Consolas, monospace;
}
.batch-row-off {
  font-size: 11.5px;
  color: var(--warning);
}
.batch-empty {
  padding: 22px 0;
  text-align: center;
  font-size: 12.5px;
  color: var(--text-tertiary);
  border: 1px dashed var(--border-default);
  border-radius: 10px;
}
.opt-name {
  float: left;
}
.opt-meta {
  float: right;
  margin-left: 16px;
  font-size: 12px;
  color: var(--text-tertiary);
}

/* ===== 主机下拉框宽度限制 ===== */
:deep(.host-select-popper) {
  width: 320px !important;
  max-width: 320px !important;
}
:deep(.host-select-popper .el-select-dropdown__item) {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
</style>
