<template>
  <div class="px tel-page">
    <ReSectionHead description="管理服务器发布与项目 · 支持启动/停止/重启/升级/备份/回滚">
      <template #title>发布管理</template>
      <template #actions>
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
              <button class="ghost-ico" title="软件仓库" @click="openInstallDialog(item)">
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
          <ReSelect v-model="form.hostId" placeholder="选择主机" style="width:100%" filterable>
            <ReOption v-for="host in hosts" :key="host.id" :label="host.serverHostName + ' (' + host.serverHostAddress + ')'" :value="host.id" />
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

    <!-- 软件仓库检索对话框 -->
    <ReDialog v-model="installDialogVisible" title="软件仓库" width="750px" :close-on-click-modal="false" :footer-hidden="true">
      <div class="software-repo">
        <!-- 顶部搜索栏（主机固定为当前发布绑定的主机） -->
        <div class="search-bar">
          <el-tag size="large" type="info" effect="plain" class="host-tag">
            <el-icon style="vertical-align:-2px;margin-right:4px"><Monitor /></el-icon>{{ currentHostLabel }}
          </el-tag>
          <ReInput v-model="searchForm.keyword" placeholder="输入软件名称，如 nginx" style="flex: 1" @keyup.enter="handleSearch" />
          <ReButton type="primary" icon="Search" @click="handleSearch">查询</ReButton>
        </div>

        <!-- 搜索结果列表 -->
        <div class="software-list">
          <ReEmpty v-if="!searchResults.length && !searching" :description="searchForm.hostId ? '输入关键词搜索软件包' : '该发布未绑定主机'" :image-size="60" />
          <div v-if="searching" class="loading-tip">
            <el-icon class="is-loading"><Loading /></el-icon>
            <span>正在搜索软件包...</span>
          </div>
          <div v-for="pkg in searchResults" :key="pkg.name" class="software-item">
            <div class="software-info">
              <div class="software-name">{{ pkg.name }}</div>
              <div class="software-desc">{{ pkg.summary || '暂无描述' }}</div>
              <div class="software-version" v-if="pkg.version">版本: {{ pkg.version }}</div>
            </div>
            <ReButton type="primary" icon="Download" @click="handleInstall(pkg)">安装</ReButton>
          </div>
        </div>
      </div>
    </ReDialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { ElMessage, ElMessageBox } from 'element-plus';
import { Loading, Monitor, Files, Box, ArrowRight, EditPen, Delete } from '@element-plus/icons-vue';
import { http, unwrapResult } from '@repo/utils';
import { osIconSvg, osLabel } from '../utils/osIcon';
import { trackTask } from '../utils/processTasks';

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

interface SoftwarePackage {
  name: string;
  summary: string;
  version: string;
}

const list = ref<Release[]>([]);
const hosts = ref<Host[]>([]);
const counts = ref<Record<number, number>>({});
const dialogVisible = ref(false);
const editingId = ref<number | null>(null);
const installDialogVisible = ref(false);
const currentRelease = ref<Release | null>(null);
const searching = ref(false);
const searchResults = ref<SoftwarePackage[]>([]);

/** 软件仓库对话框中固定显示的主机（当前发布绑定的主机） */
const currentHostLabel = computed(() => {
  const h = hosts.value.find((x) => x.id === searchForm.value.hostId);
  if (h) {
    return h.serverHostName + ' (' + h.serverHostAddress + ')';
  }
  return currentRelease.value?.hostIp || '未绑定主机';
});

const form = ref({
  releaseName: '',
  hostId: undefined as number | undefined,
  description: '',
  backgroundImage: '',
});

const searchForm = ref({
  hostId: undefined as number | undefined,
  keyword: '',
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
    ElMessage.error('加载发布列表失败');
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
      ElMessage.success('更新成功');
    } else {
      await http().post(BASE).data(form.value);
      ElMessage.success('创建成功');
    }
    dialogVisible.value = false;
    loadList();
  } catch (e) {
    ElMessage.error('保存失败');
  }
}

async function handleDelete(item: Release) {
  try {
    await ElMessageBox.confirm(`确定删除发布「${item.releaseName}」吗？其下项目将一并删除。`, '提示', { type: 'warning' });
    await http().delete(BASE + `/${item.id}`);
    ElMessage.success('删除成功');
    loadList();
  } catch (e) {
    if (e !== 'cancel') {
      ElMessage.error('删除失败');
    }
  }
}

function goToProjects(item: Release) {
  router.push(`/projects?releaseId=${item.id}`);
}

async function openInstallDialog(item: Release) {
  await ensureHosts();
  currentRelease.value = item;
  searchForm.value = { hostId: item.hostId, keyword: '' };
  searchResults.value = [];
  installDialogVisible.value = true;
}

async function handleSearch() {
  if (!searchForm.value.hostId) {
    ElMessage.warning('该发布未绑定主机，请先在编辑中选择主机');
    return;
  }
  if (!searchForm.value.keyword) {
    ElMessage.warning('请输入软件名称');
    return;
  }

  searching.value = true;
  searchResults.value = [];

  try {
    const res = await http()
      .get(BASE + '/software/search')
      .query({ hostId: searchForm.value.hostId, keyword: searchForm.value.keyword })
      .timeout(30000);
    searchResults.value = unwrapResult(res) || [];
  } catch (e) {
    ElMessage.error('搜索失败，请检查主机连接');
  } finally {
    searching.value = false;
  }
}

async function handleInstall(pkg: SoftwarePackage) {
  if (!searchForm.value.hostId) {
    ElMessage.warning('该发布未绑定主机，请先在编辑中选择主机');
    return;
  }
  try {
    const res = await http()
      .post(BASE + '/software/install')
      .query({ hostId: searchForm.value.hostId, name: pkg.name })
      .timeout(30000);
    const taskId = unwrapResult<string>(res);
    if (taskId) {
      trackTask(taskId, pkg.name, 'install');
    }
  } catch (e) {
    ElMessage.error('安装触发失败');
  }
}

onMounted(() => {
  loadList();
  loadHosts();
});
</script>

<style scoped>
.card-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(340px, 1fr));
  gap: 16px;
  padding: 18px;
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
  min-height: 158px;
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
  flex: 0 0 104px;
  width: 104px;
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
  padding: 14px 16px 10px;
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
  gap: 8px;
  margin: 9px 0 7px;
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
  line-height: 1.5;
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
  padding-top: 8px;
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

/* ===== 软件仓库样式 ===== */
.software-repo {
  display: flex;
  flex-direction: column;
  height: 500px;
}
.search-bar {
  display: flex;
  gap: 12px;
  margin-bottom: 16px;
  flex-shrink: 0;
  align-items: center;
}
.host-tag {
  flex-shrink: 0;
  max-width: 300px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.software-list {
  flex: 1;
  overflow-y: auto;
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-md);
  padding: 8px;
}
.loading-tip {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 40px;
  color: var(--text-secondary);
}
.software-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px;
  border-radius: var(--radius-sm);
  transition: background-color 0.2s;
}
.software-item:hover {
  background-color: var(--bg-fill);
}
.software-info {
  flex: 1;
  min-width: 0;
}
.software-name {
  font-weight: 600;
  font-size: 14px;
  margin-bottom: 4px;
}
.software-desc {
  font-size: 12px;
  color: var(--text-secondary);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.software-version {
  font-size: 12px;
  color: var(--text-tertiary);
  margin-top: 4px;
}
</style>
