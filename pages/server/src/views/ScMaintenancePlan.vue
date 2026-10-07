<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { message } from '@repo/core';
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

const hostOptions = ref<Array<{ label: string; value: number }>>([]);

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
    hostOptions.value = (hostList ?? []).map(h => ({ label: `${h.serverHostName} (${h.serverHostAddress})`, value: h.id }));
  } catch (e) {
    message.error((e as Error).message);
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
    message.warning('计划名称不能为空');
    return;
  }
  if (!form.value.startTime || !form.value.endTime) {
    message.warning('请选择开始和结束时间');
    return;
  }
  const payload = {
    ...form.value,
    targetHostIds: JSON.stringify(form.value.targetHostIds),
  };
  await saveMaintenancePlan(editingId.value, payload);
  message.success('已保存');
  formVisible.value = false;
  refresh();
}

async function removePlan(row: PlanRow) {
  await message.confirm(`确认删除维护计划 ${row.planName}?`, '删除');
  await delMaintenancePlan(row.id);
  message.success('已删除');
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
  <div class="plan-list sc-page">
    <ReSectionHead class="page-head" title="维护计划" description="窗口期内的维护 / 升级 / 备份 / 重启安排">
      <template #actions>
        <ReButton show-text icon="Plus" type="primary" @click="openCreate">新建计划</ReButton>
        <ReButton show-text icon="Refresh" @click="refresh">刷新</ReButton>
      </template>
    </ReSectionHead>

    <ReTable :data="plans" :loading="loading" border stripe size="default" :pagination="false" :toolbar="false" empty-text="暂无维护计划，点击右上角「新建计划」创建">
      <ReTableColumn prop="planName" label="计划名称" min-width="140" show-overflow-tooltip />
      <ReTableColumn label="类型" width="90">
        <template #default="{ row }">
          <ReTag >{{ planTypes.find(t => t.value === row.planType)?.label || row.planType }}</ReTag>
        </template>
      </ReTableColumn>
      <ReTableColumn label="状态" width="80">
        <template #default="{ row }">
          <ReTag :type="statusType[row.status] || 'info'" >{{ statusMap[row.status] || row.status }}</ReTag>
        </template>
      </ReTableColumn>
      <ReTableColumn label="开始时间" width="160">
        <template #default="{ row }">{{ row.startTime?.replace('T', ' ') || '-' }}</template>
      </ReTableColumn>
      <ReTableColumn label="结束时间" width="160">
        <template #default="{ row }">{{ row.endTime?.replace('T', ' ') || '-' }}</template>
      </ReTableColumn>
      <ReTableColumn label="目标主机" min-width="200" show-overflow-tooltip>
        <template #default="{ row }">{{ hostNames(row.targetHostIds) }}</template>
      </ReTableColumn>
      <ReTableColumn prop="description" label="描述" min-width="140" show-overflow-tooltip />
      <ReTableColumn label="操作" width="130" fixed="right">
        <template #default="{ row }">
          <ReButton link @click="openEdit(row)">编辑</ReButton>
          <ReButton link type="danger" @click="removePlan(row)">删除</ReButton>
        </template>
      </ReTableColumn>
    </ReTable>

    <ReDialog v-model="formVisible" :title="editingId ? '编辑计划' : '新建计划'" width="560" :height="520" confirm-text="保存" cancel-text="取消" :footer-hidden="false" @confirm="submitForm" @cancel="formVisible = false">
      <ReForm label-width="100px" label-position="right">
        <ReFormItem label="计划名称" required>
          <ReInput v-model="form.planName" placeholder="如 核心服务升级" />
        </ReFormItem>
        <ReFormItem label="类型">
          <ReSelect v-model="form.planType" :data="planTypes" style="width: 100%" />
        </ReFormItem>
        <ReFormItem label="开始时间" required>
          <ReDatePicker v-model="form.startTime" type="datetime" placeholder="选择开始时间" style="width: 100%" value-format="YYYY-MM-DDTHH:mm:ss" />
        </ReFormItem>
        <ReFormItem label="结束时间" required>
          <ReDatePicker v-model="form.endTime" type="datetime" placeholder="选择结束时间" style="width: 100%" value-format="YYYY-MM-DDTHH:mm:ss" />
        </ReFormItem>
        <ReFormItem label="目标主机">
          <ReSelect v-model="form.targetHostIds" multiple filterable :data="hostOptions" style="width: 100%" />
        </ReFormItem>
        <ReFormItem label="描述">
          <ReInput v-model="form.description" type="textarea" :rows="2" />
        </ReFormItem>
      </ReForm>
    </ReDialog>
  </div>
</template>

 <style scoped lang="scss">
.plan-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}
</style>