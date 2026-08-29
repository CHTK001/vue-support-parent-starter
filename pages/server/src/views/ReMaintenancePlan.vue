<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import { getMaintenancePlans, saveMaintenancePlan, delMaintenancePlan, queryHosts } from '../api';

interface PlanRow {
  id: number;
  planName: string;
  planType: string;
  startTime: string;
  endTime: string;
  targetHostIds?: string;
  status: string;
  description?: string;
}

interface HostOption {
  id: number;
  serverHostName: string;
  serverHostAddress: string;
}

const loading = ref(false);
const plans = ref<PlanRow[]>([]);
const hosts = ref<HostOption[]>([]);

const formVisible = ref(false);
const editingId = ref<number | null>(null);
const form = ref({
  planName: '',
  planType: 'MAINTENANCE',
  startTime: '',
  endTime: '',
  targetHostIds: [] as number[],
  description: '',
});

const planTypes = [
  { value: 'MAINTENANCE', label: '维护' },
  { value: 'UPGRADE', label: '升级' },
  { value: 'BACKUP', label: '备份' },
  { value: 'REBOOT', label: '重启' },
];

const statusMap: Record<string, string> = {
  PENDING: '待执行',
  RUNNING: '执行中',
  COMPLETED: '已完成',
  CANCELLED: '已取消',
};

const statusType: Record<string, string> = {
  PENDING: 'info',
  RUNNING: 'warning',
  COMPLETED: 'success',
  CANCELLED: 'danger',
};

onMounted(refresh);

async function refresh() {
  loading.value = true;
  try {
    const [planList, hostList] = await Promise.all([
      getMaintenancePlans(),
      queryHosts().catch(() => []),
    ]);
    plans.value = planList ?? [];
    hosts.value = hostList ?? [];
  } catch (e) {
    ElMessage.error((e as Error).message);
  } finally {
    loading.value = false;
  }
}

function openCreate() {
  editingId.value = null;
  form.value = { planName: '', planType: 'MAINTENANCE', startTime: '', endTime: '', targetHostIds: [], description: '' };
  formVisible.value = true;
}

function openEdit(row: PlanRow) {
  editingId.value = row.id;
  const hostIds: number[] = [];
  if (row.targetHostIds) {
    try {
      const parsed = JSON.parse(row.targetHostIds);
      if (Array.isArray(parsed)) hostIds.push(...parsed);
    } catch { /* ignore */ }
  }
  form.value = {
    planName: row.planName,
    planType: row.planType,
    startTime: row.startTime,
    endTime: row.endTime,
    targetHostIds: hostIds,
    description: row.description || '',
  };
  formVisible.value = true;
}

async function submitForm() {
  if (!form.value.planName.trim()) {
    ElMessage.warning('计划名称不能为空');
    return;
  }
  if (!form.value.startTime || !form.value.endTime) {
    ElMessage.warning('请选择开始和结束时间');
    return;
  }
  const payload = {
    ...form.value,
    targetHostIds: JSON.stringify(form.value.targetHostIds),
  };
  await saveMaintenancePlan(editingId.value, payload);
  ElMessage.success('已保存');
  formVisible.value = false;
  refresh();
}

async function removePlan(row: PlanRow) {
  await ElMessageBox.confirm(`确认删除维护计划 ${row.planName}?`, '删除', { type: 'warning' });
  await delMaintenancePlan(row.id);
  ElMessage.success('已删除');
  refresh();
}

function hostNames(ids?: string): string {
  if (!ids) return '-';
  try {
    const parsed: number[] = JSON.parse(ids);
    return parsed.map(id => hosts.value.find(h => h.id === id)?.serverHostName ?? `#${id}`).join(', ');
  } catch {
    return ids;
  }
}
</script>

<template>
  <div class="plan-list">
    <div class="toolbar">
      <el-button type="primary" @click="openCreate">新建计划</el-button>
      <el-button @click="refresh">刷新</el-button>
    </div>

    <el-table v-loading="loading" :data="plans" border stripe size="default">
      <el-table-column prop="planName" label="计划名称" min-width="140" show-overflow-tooltip />
      <el-table-column label="类型" width="90">
        <template #default="{ row }">
          <el-tag size="small">{{ planTypes.find(t => t.value === row.planType)?.label || row.planType }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column label="状态" width="80">
        <template #default="{ row }">
          <el-tag :type="statusType[row.status] || 'info'" size="small">{{ statusMap[row.status] || row.status }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column label="开始时间" width="160">
        <template #default="{ row }">{{ row.startTime?.replace('T', ' ') || '-' }}</template>
      </el-table-column>
      <el-table-column label="结束时间" width="160">
        <template #default="{ row }">{{ row.endTime?.replace('T', ' ') || '-' }}</template>
      </el-table-column>
      <el-table-column label="目标主机" min-width="200" show-overflow-tooltip>
        <template #default="{ row }">{{ hostNames(row.targetHostIds) }}</template>
      </el-table-column>
      <el-table-column prop="description" label="描述" min-width="140" show-overflow-tooltip />
      <el-table-column label="操作" width="130" fixed="right">
        <template #default="{ row }">
          <el-button link size="small" @click="openEdit(row)">编辑</el-button>
          <el-button link type="danger" size="small" @click="removePlan(row)">删除</el-button>
        </template>
      </el-table-column>
    </el-table>

    <el-dialog v-model="formVisible" :title="editingId ? '编辑计划' : '新建计划'" width="520px" append-to-body>
      <el-form label-width="100px">
        <el-form-item label="计划名称" required>
          <el-input v-model="form.planName" placeholder="如 核心服务升级" />
        </el-form-item>
        <el-form-item label="类型">
          <el-select v-model="form.planType" style="width: 100%">
            <el-option v-for="t in planTypes" :key="t.value" :value="t.value" :label="t.label" />
          </el-select>
        </el-form-item>
        <el-form-item label="开始时间" required>
          <el-date-picker v-model="form.startTime" type="datetime" placeholder="选择开始时间" style="width: 100%" value-format="YYYY-MM-DDTHH:mm:ss" />
        </el-form-item>
        <el-form-item label="结束时间" required>
          <el-date-picker v-model="form.endTime" type="datetime" placeholder="选择结束时间" style="width: 100%" value-format="YYYY-MM-DDTHH:mm:ss" />
        </el-form-item>
        <el-form-item label="目标主机">
          <el-select v-model="form.targetHostIds" multiple filterable style="width: 100%">
            <el-option v-for="h in hosts" :key="h.id" :value="h.id" :label="`${h.serverHostName} (${h.serverHostAddress})`" />
          </el-select>
        </el-form-item>
        <el-form-item label="描述">
          <el-input v-model="form.description" type="textarea" :rows="2" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="formVisible = false">取消</el-button>
        <el-button type="primary" @click="submitForm">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<style scoped lang="scss">
.plan-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.toolbar {
  display: flex;
  gap: 8px;
  align-items: center;
}
</style>