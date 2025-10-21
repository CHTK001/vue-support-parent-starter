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
        <el-button @click="onlineVisible = true">
          <IconifyIconOnline icon="ri:search-eye-line" class="mr-1" />
          在线搜索
        </el-button>
        <el-button type="primary" v-admin @click="openEdit()">
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
          <IconifyIconOnline icon="ri:search-2-line" class="mr-1" />
          搜索
        </el-button>
      </div>
    </div>

    <!-- 软件卡片：使用 ScTable 的 card 布局 & url 模式 -->
    <ScTable ref="tableRef" :url="softwareApi.getSoftPageList" :params="params" row-key="systemSoftId" layout="card"
      :col-size="4" :row-size="3" :page-size="12" :pagination-type="paginationType"
      :auto-load="paginationType === 'scroll'" :load-distance="120" table-name="docker-soft-list">
      <template #default="{ row }">
        <div class="soft-card">
          <div class="soft-card-header">
            <div class="soft-card-title">
              <IconifyIconOnline :icon="row.systemSoftIcon || 'ri:apps-line'" class="soft-card-icon" />
              <span class="name">{{ row.systemSoftName }}</span>
              <el-tag v-if="row.systemSoftIsOfficial === 1" size="small" type="warning" round class="ml-2">官方</el-tag>
            </div>
            <div class="soft-badges">
              <el-tag size="small" effect="plain"><IconifyIconOnline icon="ri:star-line" class="mr-1" />{{ row.systemSoftStarCount ?? 0 }}</el-tag>
              <el-tag size="small" effect="plain"><IconifyIconOnline icon="ri:download-2-line" class="mr-1" />{{ row.systemSoftPullCount ?? 0 }}</el-tag>
              <el-tag size="small" :type="row.systemSoftStatus === 1 ? 'success' : 'info'">
                {{ row.systemSoftStatus === 1 ? '启用' : '禁用' }}
              </el-tag>
            </div>
          </div>
          <div class="soft-meta">代码：{{ row.systemSoftCode }}</div>
          <div class="soft-meta">镜像：{{ row.systemSoftDockerImage || '—' }}</div>
          <div class="soft-desc">{{ row.systemSoftDesc || row.systemSoftDescription || '—' }}</div>
          <div class="soft-actions">
            <el-button size="small" type="primary" plain @click="openInstall(row)">
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
        <el-button @click="editVisible = false">取消</el-button>
        <el-button type="primary" @click="onSubmit">保存</el-button>
      </template>
    </ScDialog>

    <!-- 全屏安装向导 -->
    <SoftInstallDialog v-model:visible="installVisible" :soft="currentSoft" @success="onInstallSuccess" />

    <!-- 在线搜索弹框 -->
    <SoftOnlineSearchDialog v-model:visible="onlineVisible" @success="reload" />
  </div>
</template>

<script setup lang="ts">
import { softwareApi } from '@/api/docker-management';
import ProgressMonitor from '@/components/ProgressMonitor.vue';
import { connectSocket, enableAutoConnect } from '@/utils/socket';
import ScDialog from '@repo/components/ScDialog/src/index.vue';
import ScTable from '@repo/components/ScTable/index.vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import { onMounted, reactive, ref, watch } from 'vue';
import SoftInstallDialog from './components/SoftInstallDialog.vue';
import SoftOnlineSearchDialog from './components/SoftOnlineSearchDialog.vue';

const tableRef = ref();
const onlineVisible = ref(false);
const params = reactive<any>({ page: 1, size: 12, keyword: '', category: undefined, status: undefined });
const categories = ref<string[]>([]);

// 分页模式：默认 normal / 滚动 scroll
const paginationType = ref<'default' | 'scroll'>('default');
const isScroll = ref(false);
watch(isScroll, v => (paginationType.value = v ? 'scroll' : 'default'));

onMounted(() => { enableAutoConnect(); connectSocket().catch(() => { }); });

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
function openInstall(row: any) {
  currentSoft.value = row;
  installVisible.value = true;
}
function onInstallSuccess() {
  ElMessage.success('已开始安装，进度见镜像/容器管理');
}
</script>

<style scoped>
.soft-management { padding: 20px; background: var(--app-bg-secondary); }

.page-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 16px; }
.header-left .page-title { display: flex; align-items: center; font-size: 20px; font-weight: 600; }
.title-icon { margin-right: 8px; }
.page-subtitle { color: var(--app-text-secondary); font-size: 12px; }

.search-bar { display: flex; align-items: center; justify-content: space-between; padding: 12px; border-radius: 12px; background: linear-gradient(90deg, rgba(99,102,241,0.08), rgba(14,165,233,0.08)); margin-bottom: 16px; }
.search-input { width: 280px; }
.filter-select { width: 160px; margin-left: 8px; }

.soft-card { background: var(--el-bg-color); border-radius: 14px; border: 1px solid var(--el-border-color-lighter); box-shadow: 0 6px 18px rgba(0,0,0,0.06); transition: transform .18s ease, box-shadow .18s ease, border-color .18s ease; padding: 14px; }
.soft-card:hover { transform: translateY(-3px); box-shadow: 0 10px 24px rgba(0,0,0,0.10); border-color: var(--el-color-primary-light-5); }
.soft-card-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 8px; }
.soft-card-title { display: flex; align-items: center; gap: 8px; }
.soft-badges { display: flex; align-items: center; gap: 6px; }
.soft-card-icon { font-size: 22px; color: var(--el-color-primary); }
.name { font-weight: 600; }
.soft-meta { color: var(--app-text-secondary); font-size: 12px; margin-bottom: 6px; }
.soft-desc { color: var(--app-text-secondary); line-height: 1.5; min-height: 36px; }
.soft-actions { display: flex; gap: 8px; margin-top: 10px; }


.filter-select {
  width: 160px;
}

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

.soft-card:hover {
  box-shadow: var(--app-card-shadow);
  transform: translateY(-2px);
}

.soft-card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.soft-card-title {
  display: flex;
  align-items: center;
  gap: 8px;
}

.soft-card-icon {
  font-size: 18px;
  color: var(--app-primary);
}

.soft-card .name {
  font-weight: 600;
  color: var(--app-text-primary);
}

.soft-meta {
  font-size: 12px;
  color: var(--app-text-secondary);
}

.soft-desc {
  color: var(--app-text-secondary);
  font-size: 13px;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.soft-actions {
  display: flex;
  gap: 8px;
  padding-top: 6px;
}

/* 兼容原有截断类 */
.truncate-2 {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden
}

@media (max-width: 768px) {
  .search-bar {
    flex-direction: column;
    align-items: stretch;
  }

  .search-left {
    flex-wrap: wrap;
  }

  .search-input,
  .filter-select {
    width: 100%;
  }
}
</style>
