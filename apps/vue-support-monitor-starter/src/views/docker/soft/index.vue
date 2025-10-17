<template>
  <div class="soft-management">
    <ProgressMonitor />
    <!-- 页面头部 -->
    <div class="page-header">
      <div class="header-left">
        <div class="page-title">
          <IconifyIconOnline icon="ri:apps-line" class="title-icon" />
          <span>软件库</span>
        </div>
        <div class="page-subtitle">从仓库检索并管理可安装的软件</div>
      </div>
      <div class="header-right">
        <el-button @click="reload">
          <IconifyIconOnline icon="ri:refresh-line" class="mr-1" />
          刷新
        </el-button>
        <el-button type="primary" v-role="'admin'" @click="openEdit()">
          <IconifyIconOnline icon="ri:add-line" class="mr-1" />
          新增软件
        </el-button>
      </div>
    </div>

    <!-- 搜索栏 -->
    <div class="search-bar">
      <div class="search-left">
        <el-input v-model="params.keyword" placeholder="搜索名称/代码" class="search-input" clearable @keyup.enter="reload">
          <template #prefix>
            <IconifyIconOnline icon="ri:search-line" />
          </template>
        </el-input>
        <el-select v-model="params.category" placeholder="分类" clearable class="filter-select" @change="reload">
          <el-option label="全部" :value="undefined" />
          <el-option v-for="c in categories" :key="c" :label="c" :value="c" />
        </el-select>
        <el-select v-model="params.status" placeholder="状态" clearable class="filter-select" @change="reload">
          <el-option label="启用" :value="1" />
          <el-option label="禁用" :value="0" />
        </el-select>
      </div>
      <div class="search-right">
        <el-button @click="reload">
          <IconifyIconOnline icon="ri:refresh-line" class="mr-1" />
          搜索
        </el-button>
      </div>
    </div>

    <!-- 软件卡片：使用 ScTable 的 card 布局 & url 模式 -->
    <ScTable
      ref="tableRef"
      :url="softwareApi.getSoftPageList"
      :params="params"
      row-key="systemSoftId"
      layout="card"
      :col-size="4"
      :row-size="3"
      :page-size="12"
      :pagination-type="paginationType"
      :auto-load="paginationType === 'scroll'"
      :load-distance="120"
      table-name="docker-soft-list"
    >
      <template #default="{ row }">
        <div class="soft-card">
          <div class="soft-card-header">
            <div class="soft-card-title">
              <IconifyIconOnline :icon="row.systemSoftIcon || 'ri:apps-line'" class="soft-card-icon" />
              <span class="name">{{ row.systemSoftName }}</span>
            </div>
            <el-tag size="small" :type="row.systemSoftStatus === 1 ? 'success' : 'info'">
              {{ row.systemSoftStatus === 1 ? '启用' : '禁用' }}
            </el-tag>
          </div>
          <div class="soft-meta">代码：{{ row.systemSoftCode }}</div>
          <div class="soft-desc">{{ row.systemSoftDesc || row.systemSoftDescription || '—' }}</div>
          <div class="soft-actions">
            <el-button size="small" type="primary" @click="openInstall(row)">
              <IconifyIconOnline icon="ri:download-line" class="mr-1" /> 安装
            </el-button>
            <el-button size="small" v-role="'admin'" @click="openEdit(row)">
              <IconifyIconOnline icon="ri:edit-line" class="mr-1" /> 编辑
            </el-button>
            <el-button size="small" type="danger" v-role="'admin'" @click="onDelete(row)">
              <IconifyIconOnline icon="ri:delete-bin-line" class="mr-1" /> 删除
            </el-button>
          </div>
        </div>
      </template>
    </ScTable>

    <!-- 新增/编辑软件 -->
    <ScDialog v-model:visible="editVisible" title="软件信息" width="560px">
      <el-form ref="formRef" :model="form" :rules="rules" label-width="96px">
        <el-form-item label="名称" prop="systemSoftName">
          <el-input v-model="form.systemSoftName" />
        </el-form-item>
        <el-form-item label="代码" prop="systemSoftCode">
          <el-input v-model="form.systemSoftCode" />
        </el-form-item>
        <el-form-item label="分类">
          <el-input v-model="form.systemSoftCategory" />
        </el-form-item>
        <el-form-item label="描述">
          <el-input v-model="form.systemSoftDesc" type="textarea" :rows="3" />
        </el-form-item>
        <el-form-item label="状态">
          <el-switch v-model="form.systemSoftStatus" :active-value="1" :inactive-value="0" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="editVisible=false">取消</el-button>
        <el-button type="primary" @click="onSubmit">保存</el-button>
      </template>
    </ScDialog>

    <!-- 安装到服务器 -->
    <ScDialog v-model:visible="installVisible" title="选择服务器安装" width="780px">
      <div class="mb-3 flex items-center gap-3">
        <el-select v-model="installTag" placeholder="镜像标签" clearable filterable style="width:220px">
          <el-option v-for="t in tags" :key="t" :label="t" :value="t" />
        </el-select>
      </div>
      <ScTable
        ref="serverTableRef"
        :url="getServerList"
        :params="{ }"
        row-key="id"
        table-name="docker-soft-install-servers"
        :page-size="10"
        :hide-pagination="true"
      >
        <el-table-column type="selection" width="48" />
        <el-table-column label="名称" prop="name" min-width="160" />
        <el-table-column label="地址" prop="host" min-width="160" />
        <el-table-column label="端口" prop="port" width="80" />
        <el-table-column label="状态" prop="status" width="100" />
      </ScTable>
      <template #footer>
        <el-button @click="installVisible=false">取消</el-button>
        <el-button type="primary" @click="doInstall">开始安装</el-button>
      </template>
    </ScDialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, watch } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import ScTable from '@repo/components/ScTable/index.vue';
import ScDialog from '@repo/components/ScDialog/src/index.vue';
import ProgressMonitor from '@/components/ProgressMonitor.vue';
import { enableAutoConnect, connectSocket } from '@/utils/socket';
import { softwareApi, getServerList } from '@/api/docker-management';

const tableRef = ref();
const params = reactive<any>({ page: 1, size: 12, keyword: '', category: undefined, status: undefined });
const categories = ref<string[]>([]);

// 分页模式：默认 normal / 滚动 scroll
const paginationType = ref<'default' | 'scroll'>('default');
const isScroll = ref(false);
watch(isScroll, v => (paginationType.value = v ? 'scroll' : 'default'));

onMounted(() => { enableAutoConnect(); connectSocket().catch(()=>{}); });

function reload() {
  tableRef.value?.reload?.(params, 1);
}

// 编辑
const editVisible = ref(false);
const formRef = ref();
const form = reactive<any>({ systemSoftId: undefined, systemSoftName: '', systemSoftCode: '', systemSoftCategory: '', systemSoftDesc: '', systemSoftStatus: 1 });
const rules = { systemSoftName: [{ required: true, message: '必填', trigger: 'blur' }], systemSoftCode: [{ required: true, message: '必填', trigger: 'blur' }] };

function openEdit(row?: any) {
  if (row) Object.assign(form, row);
  else Object.assign(form, { systemSoftId: undefined, systemSoftStatus: 1 });
  editVisible.value = true;
}

async function onSubmit() {
  await formRef.value?.validate();
  const id = form.systemSoftId as number | undefined;
  if (id) {
    const { code, msg } = await softwareApi.updateSoft(id, { ...form });
    if (code === 0) { ElMessage.success('更新成功'); editVisible.value = false; reload(); } else { ElMessage.error(msg || '更新失败'); }
  } else {
    const { code, msg } = await softwareApi.createSoft({ ...form });
    if (code === 0) { ElMessage.success('新增成功'); editVisible.value = false; reload(); } else { ElMessage.error(msg || '新增失败'); }
  }
}

async function onDelete(row: any) {
  await ElMessageBox.confirm(`确认删除软件【${row.systemSoftName}】?`, '提示', { type: 'warning' });
  const { code, msg } = await softwareApi.deleteSoft(row.systemSoftId);
  if (code === 0) { ElMessage.success('删除成功'); reload(); } else { ElMessage.error(msg || '删除失败'); }
}

// 安装
const installVisible = ref(false);
const currentSoft = ref<any>();
const installTag = ref<string>('latest');
const tags = ref<string[]>(['latest']);
const serverTableRef = ref();

async function openInstall(row: any) {
  currentSoft.value = row;
  installVisible.value = true;
}

async function doInstall() {
  const selection = serverTableRef.value?.getSelection?.() || [];
  const ids = selection.map((s: any) => s.id);
  if (!ids.length) return ElMessage.warning('请选择服务器');
  const { code, msg } = await softwareApi.installSoftware({ softId: currentSoft.value.systemSoftId, serverIds: ids, imageTag: installTag.value });
  if (code === 0) { ElMessage.success('已开始安装，进度见镜像/容器管理'); installVisible.value = false; } else { ElMessage.error(msg || '安装失败'); }
}
</script>

<style scoped>
.soft-management {
  padding: 20px;
  background: var(--app-bg-secondary);
  min-height: calc(100vh - 60px);
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 16px;
  padding: 20px;
  background: var(--app-card-bg);
  border-radius: 8px;
  box-shadow: var(--app-card-shadow);
}

.page-title {
  display: flex;
  align-items: center;
  font-size: 22px;
  font-weight: 600;
  color: var(--app-text-primary);
}

.title-icon { margin-right: 8px; color: var(--app-primary); }
.page-subtitle { color: var(--app-text-secondary); margin-top: 6px; font-size: 14px; }
.header-right { display: flex; gap: 12px; }

.search-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
  margin-bottom: 16px;
  padding: 16px;
  background: var(--app-card-bg);
  border-radius: 8px;
  box-shadow: var(--app-card-shadow);
}
.search-left { display: flex; gap: 12px; flex: 1; }
.search-right { display: flex; gap: 8px; align-items: center; }
.search-input { width: 280px; }
.filter-select { width: 160px; }

/* 卡片样式 */
.soft-card {
  display: flex;
  flex-direction: column;
  gap: 8px;
  background: var(--app-card-bg);
  border: 1px solid var(--app-card-border);
  border-radius: 10px;
  padding: 14px;
  transition: box-shadow .2s ease, transform .2s ease;
}
.soft-card:hover { box-shadow: var(--app-card-shadow); transform: translateY(-2px); }
.soft-card-header { display:flex; align-items:center; justify-content:space-between; }
.soft-card-title { display:flex; align-items:center; gap:8px; }
.soft-card-icon { font-size: 18px; color: var(--app-primary); }
.soft-card .name { font-weight: 600; color: var(--app-text-primary); }
.soft-meta { font-size: 12px; color: var(--app-text-secondary); }
.soft-desc { color: var(--app-text-secondary); font-size: 13px; display:-webkit-box; -webkit-line-clamp:2; -webkit-box-orient:vertical; overflow:hidden; }
.soft-actions { display:flex; gap: 8px; padding-top: 6px; }

/* 兼容原有截断类 */
.truncate-2{ display:-webkit-box; -webkit-line-clamp:2; -webkit-box-orient:vertical; overflow:hidden }

@media (max-width: 768px) {
  .search-bar { flex-direction: column; align-items: stretch; }
  .search-left { flex-wrap: wrap; }
  .search-input, .filter-select { width: 100%; }
}
</style>
