<template>
  <div class="h-full overflow-hidden flex flex-col">
    <!-- 页面头部 -->
    <div class="shrink-0 px-6 py-4 svc-header">
      <div class="flex items-center justify-between">
        <div>
          <h1 class="svc-title">服务运行状态</h1>
          <p class="svc-subtitle">
            查看聚合 ChatClient 服务的运行状态、进程号与运行时长，支持登记启动与停止（仅管理员）
          </p>
        </div>
        <div class="flex items-center gap-2">
          <el-button v-if="admin" type="primary" @click="handleCreate">
            <el-icon><Plus /></el-icon>
            登记服务
          </el-button>
          <el-button @click="loadData">
            <el-icon><Refresh /></el-icon>
            刷新
          </el-button>
        </div>
      </div>
    </div>

    <!-- 数据表格 -->
    <div class="flex-1 overflow-auto p-6">
     <div class="panel-card">
      <!-- 表格统一 ReTable（替换裸 el-table）：engine="element" 沿用原 el-table 的 DOM；
           pagination=false —— 页面没有分页，保持全量直出；toolbar=false 不新增工具栏；
           原表没有 border → :settings="{ border: false }"；v-loading → :loading；
           #empty 插槽（原 <template #empty>）ReTable 同名支持，原样保留。 -->
      <ReTable
        :data="tableData"
        :columns="serviceColumns"
        :loading="loading"
        engine="element"
        :pagination="false"
        :toolbar="false"
        :layout-table="{ minHeight: 0 }"
        :settings="{ border: false }"
        stripe
        class="flat-table"
        style="width: 100%"
      >
        <template #col-running="{ row }">
          <el-tag :type="row.running ? 'success' : 'info'" >
            {{ row.running ? '运行中' : '已停止' }}
          </el-tag>
        </template>
        <template #col-pid="{ row }">{{ row.pid ?? '-' }}</template>
        <template #col-uptime="{ row }">{{ formatUptime(row.uptime) }}</template>
        <template #col-actions="{ row }">
          <el-button v-if="!row.running" type="success" link @click="handleStart(row.name)">启动</el-button>
          <el-button v-else type="warning" link @click="handleStop(row.name)">停止</el-button>
        </template>
        <template #empty>
          <span class="svc-empty">暂无服务记录，登记启动后此处展示运行状态</span>
        </template>
      </ReTable>
     </div>
    </div>

    <!-- 登记服务弹窗 -->
    <ReDialog v-model="dialogVisible" title="登记服务" width="460px" :close-on-click-modal="false" append-to-body>
      <el-form label-width="90px">
        <el-form-item label="服务名称">
          <el-input v-model="newServiceName" placeholder="请输入要登记并启动的服务名称" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="saving" @click="handleSubmit">启动</el-button>
      </template>
    </ReDialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import { Plus, Refresh } from '@element-plus/icons-vue';
import { isAdmin } from '@repo/core';
import ReTable from '@repo/ui/re-table';
import type { ReTableColumn } from '@repo/ui/re-table';
import { serviceApi } from '@/services/javaApi';
import ReDialog from '@repo/ui/re-dialog';

const admin = ref(isAdmin());
const loading = ref(false);
const saving = ref(false);
const tableData = ref<any[]>([]);
const dialogVisible = ref(false);
const newServiceName = ref('');

/**
 * 列配置：原模板里的 5 个 el-table-column 收敛为数组。
 *
 * <p>「操作」列原本带 {@code v-if="admin"}，列级条件渲染改由 computed 里拼接同一列数组实现；
 * running / pid / uptime 三列带 {@code <template #default>} → 配 {@code slot} + {@code #col-*}。</p>
 */
const serviceColumns = computed<ReTableColumn[]>(() => {
  const cols: ReTableColumn[] = [
    { prop: 'name', label: '服务名称', minWidth: 180 },
    { prop: 'running', label: '运行状态', width: 120, slot: 'running' },
    { prop: 'pid', label: '进程 PID', width: 140, slot: 'pid' },
    { prop: 'uptime', label: '运行时长', minWidth: 160, slot: 'uptime' },
  ];
  if (admin.value) {
    cols.push({ prop: 'actions', label: '操作', width: 140, fixed: 'right', slot: 'actions' });
  }
  return cols;
});

/** 后端返回 {code,data,msg} 信封，data 为状态数组 */
function asArray(res: any): any[] {
  if (Array.isArray(res)) return res;
  if (Array.isArray(res?.data)) return res.data;
  return [];
}

function formatUptime(seconds?: number | null): string {
  if (!seconds || seconds <= 0) return '-';
  const d = Math.floor(seconds / 86400);
  const h = Math.floor((seconds % 86400) / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  if (d > 0) return `${d}天${h}小时${m}分`;
  if (h > 0) return `${h}小时${m}分${s}秒`;
  if (m > 0) return `${m}分${s}秒`;
  return `${s}秒`;
}

async function loadData() {
  loading.value = true;
  try {
    tableData.value = asArray(await serviceApi.list());
  } catch (e: any) {
    ElMessage.error(`加载失败: ${e?.msg || e?.message || ''}`);
  } finally {
    loading.value = false;
  }
}

function handleCreate() {
  newServiceName.value = '';
  dialogVisible.value = true;
}

async function handleStart(name: string) {
  try {
    await serviceApi.start(name);
    ElMessage.success('服务已启动');
    loadData();
  } catch (e: any) {
    ElMessage.error(`启动失败: ${e?.msg || e?.message || ''}`);
  }
}

async function handleStop(name: string) {
  try {
    await ElMessageBox.confirm(`确定要停止服务「${name}」吗？`, '停止确认', { type: 'warning' });
    await serviceApi.stop(name);
    ElMessage.success('服务已停止');
    loadData();
  } catch (e: any) {
    if (e !== 'cancel') ElMessage.error(`停止失败: ${e?.msg || e?.message || ''}`);
  }
}

async function handleSubmit() {
  const name = newServiceName.value.trim();
  if (!name) {
    ElMessage.warning('请输入服务名称');
    return;
  }
  saving.value = true;
  try {
    await serviceApi.start(name);
    ElMessage.success('登记并启动成功');
    dialogVisible.value = false;
    loadData();
  } catch (e: any) {
    ElMessage.error(`保存失败: ${e?.msg || e?.message || ''}`);
  } finally {
    saving.value = false;
  }
}

onMounted(loadData);
</script>

<style scoped>
.svc-header { border-bottom: 1px solid var(--el-border-color-lighter); }
.svc-title { font-size: 19px; font-weight: 700; color: var(--el-text-color-primary); margin: 0; }
.svc-subtitle { font-size: 13px; color: var(--el-text-color-secondary); margin: 5px 0 0; }
.svc-empty { font-size: 13px; color: var(--el-text-color-secondary); }
.panel-card {
  background: var(--el-bg-color);
  border: 1px solid var(--el-border-color-lighter);
  /* 原值 18px → xl 档 */
  border-radius: var(--el-radius-xl, 16px);
  padding: 14px 16px 12px;
  /* 表格容器是页面区块，不加投影 */
}
.flat-table { --el-table-border-color: var(--el-border-color-lighter); }
.flat-table :deep(th.el-table__cell) {
  background: var(--el-fill-color-light);
  color: var(--el-text-color-regular);
  font-weight: 600;
}
</style>
