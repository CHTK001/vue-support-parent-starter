<template>
  <div class="p-4 space-y-4">
    <ProgressMonitor />
    <!-- 工具栏 -->
    <div class="flex items-center justify-between">
      <div class="flex gap-3 items-center">
        <el-input v-model="params.keyword" placeholder="搜索名称/代码" clearable style="width:260px" @change="reload" />
        <el-select v-model="params.category" placeholder="分类" clearable style="width:160px" @change="reload">
          <el-option label="全部" :value="undefined" />
          <el-option v-for="c in categories" :key="c" :label="c" :value="c" />
        </el-select>
        <el-select v-model="params.status" placeholder="状态" clearable style="width:140px" @change="reload">
          <el-option label="启用" :value="1" />
          <el-option label="禁用" :value="0" />
        </el-select>
      </div>
      <div class="flex gap-2">
        <el-button type="primary" v-role="'admin'" @click="openEdit()">
          <IconifyIconOnline icon="mdi:plus" /> 新增软件
        </el-button>
        <el-button @click="reload">
          <IconifyIconOnline icon="mdi:refresh" /> 刷新
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
      table-name="docker-soft-list"
    >
      <template #default="{ row }">
        <div class="space-y-2">
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-2">
              <IconifyIconOnline :icon="row.systemSoftIcon || 'ri:apps-line'" />
              <span class="font-semibold">{{ row.systemSoftName }}</span>
            </div>
            <el-tag size="small" :type="row.systemSoftStatus === 1 ? 'success' : 'info'">{{ row.systemSoftStatus === 1 ? '启用' : '禁用' }}</el-tag>
          </div>
          <div class="text-xs text-gray-500">代码：{{ row.systemSoftCode }}</div>
          <div class="text-xs text-gray-500 truncate-2">{{ row.systemSoftDesc || row.systemSoftDescription || '—' }}</div>
          <div class="flex gap-2 pt-2">
            <el-button size="small" type="primary" @click="openInstall(row)">
              <IconifyIconOnline icon="mdi:download" /> 安装
            </el-button>
            <el-button size="small" v-role="'admin'" @click="openEdit(row)">
              <IconifyIconOnline icon="mdi:pencil" /> 编辑
            </el-button>
            <el-button size="small" type="danger" v-role="'admin'" @click="onDelete(row)">
              <IconifyIconOnline icon="mdi:delete-outline" /> 删除
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
import { ref, reactive, onMounted } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import ScTable from '@repo/components/ScTable/index.vue';
import ProgressMonitor from '@/components/ProgressMonitor.vue';
import { enableAutoConnect, connectSocket } from '@/utils/socket';
import { softwareApi, getServerList } from '@/api/docker-management';

const tableRef = ref();
const params = reactive<any>({ page: 1, size: 12, keyword: '', category: undefined, status: undefined });
const categories = ref<string[]>([]);

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
.truncate-2{ display:-webkit-box; -webkit-line-clamp:2; -webkit-box-orient:vertical; overflow:hidden }
</style>
