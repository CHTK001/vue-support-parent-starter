<template>
  <RePage data-page="app-keys" title="AppKey管理">
    <template #actions>
      <el-input
        v-model="searchKeyword"
        placeholder="搜索AppKey名称"
        clearable
        @keyup.enter="loadData"
        @clear="loadData"
      >
        <template #prefix><el-icon><Search /></el-icon></template>
      </el-input>
      <el-button type="primary" @click="openCreateDialog">
        <el-icon><Plus /></el-icon> 新增AppKey
      </el-button>
      <el-button @click="loadData"><el-icon><Refresh /></el-icon> 刷新</el-button>
      <el-button v-if="selectedItems.length > 0" type="danger" plain :loading="batchDeleting"
        @click="batchDeleteItems">
        <el-icon><Delete /></el-icon> 批量删除({{ selectedItems.length }})
      </el-button>
    </template>

    <div class="panel-card">
    <!-- 表格统一 ReTable：默认引擎已是 vxe（不再显式写）。
         分页改用 ReTable 自带的 RePagination —— 此前是 :pagination="false" + 页面自写
         el-pagination；现在受控传 page/page-size/total，组件发 update:page 后本页去取数。
         原表没有 border → :settings="{ border: false }"；v-loading → :loading。 -->
    <ReTable
      :data="filteredData"
      :columns="appKeyColumns"
      :loading="loading"
      :pagination="true"
      :total="filteredData.length"
      :page="currentPage"
      :page-size="pageSize"
      :page-sizes="[10, 20, 50]"
      :toolbar="false"
      :layout-table="{ minHeight: 0 }"
      :settings="{ border: false }"
      :show-selection="true"
      stripe
      class="flat-table"
      style="width: 100%"
      @update:page="onPageChange"
      @selection-change="onSelectionChange"
    >
      <template #col-appKey="{ row }">
        <span class="key-text">{{ row.appKey }}</span>
        <el-button link type="primary" @click="copyKey(row.appKey)">复制</el-button>
      </template>
      <template #col-status="{ row }">
        <el-tag :type="row.status === 1 ? 'success' : 'info'" >
          {{ row.status === 1 ? '启用' : '禁用' }}
        </el-tag>
      </template>
      <template #col-overdraft="{ row }">
        <el-tag :type="row.overdraftEnabled ? 'warning' : 'info'" size="small">
          {{ row.overdraftEnabled ? '开放' : '关闭' }}
        </el-tag>
      </template>
      <template #col-balance="{ row }">
        <span class="balance-text">{{ formatBalance(row.balance) }}</span>
      </template>
      <!-- 操作列统一 ReButton square（纯图标 + tooltip），与知识库等页面一致 -->
      <template #col-actions="{ row }">
        <div class="row-actions">
          <ReButton layout="square" type="primary" :icon="Edit" tip="编辑" @click="openEditDialog(row)" />
          <ReButton layout="square" type="primary" :icon="Money" tip="充值" @click="openRechargeDialog(row)" />
          <ReButton layout="square" type="info" :icon="RefreshRight" tip="账单" @click="openLogsDialog(row)" />
          <ReButton layout="square" type="danger" :icon="Delete" tip="删除" @click="deleteItem(row)" />
        </div>
      </template>
    </ReTable>
    </div>

    <ReDialog v-model="dialogVisible" :title="isEdit ? '编辑AppKey' : '新增AppKey'" width="500px" append-to-body>
      <el-form :model="form" :rules="rules" ref="formRef" label-width="100px">
        <el-form-item label="应用名称" prop="appName">
          <el-input v-model="form.appName" placeholder="请输入应用名称" />
        </el-form-item>
        <el-form-item label="AppKey" prop="appKey">
          <el-input v-model="form.appKey" placeholder="请输入AppKey" show-password />
        </el-form-item>
        <el-form-item label="提供商" prop="provider">
          <el-select v-model="form.provider" placeholder="请选择提供商" style="width: 100%">
            <el-option label="OpenAI" value="openai" />
            <el-option label="Anthropic" value="anthropic" />
            <el-option label="DeepSeek" value="deepseek" />
            <el-option label="Qwen" value="qwen" />
            <el-option label="Ollama" value="ollama" />
            <el-option label="自定义" value="custom" />
          </el-select>
        </el-form-item>
        <el-form-item label="状态">
          <el-switch v-model="form.status" :active-value="1" :inactive-value="0" />
        </el-form-item>
        <el-form-item label="备注">
          <el-input v-model="form.remark" type="textarea" :rows="2" placeholder="请输入备注" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="submitForm" :loading="submitting">保存</el-button>
      </template>
    </ReDialog>

    <!-- 充值弹窗：金额 + 备注，保存后回写余额页签 -->
    <ReDialog v-model="rechargeDialogVisible" :title="'AppKey 充值 · ' + currentAppKey.name"
      width="400px" append-to-body>
      <el-form :model="rechargeForm" :rules="rechargeRules" ref="rechargeFormRef" label-width="80px">
        <el-form-item label="金额" prop="amount">
          <el-input-number v-model="rechargeForm.amount" :min="0" :step="100" :precision="2"
            :controls="false" style="width: 100%" placeholder="充值金额" />
        </el-form-item>
        <el-form-item label="备注" prop="remark">
          <el-input v-model="rechargeForm.remark" type="textarea" :rows="2" placeholder="充值备注（可选）" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="rechargeDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="submitRecharge" :loading="submitting">充值</el-button>
      </template>
    </ReDialog>

    <!-- 充值/消费流水弹窗 -->
    <ReDialog v-model="logsDialogVisible" title="AppKey 充值/消费流水" width="700px" append-to-body>
      <el-table v-loading="logsLoading" :data="topupLogs" border>
        <el-table-column prop="createdAt" label="流水时间" min-width="160" align="center" />
        <el-table-column prop="type" label="类型" width="100" align="center">
          <template #default="{ row }">
            <el-tag :type="topupTypeTag(row.type)" size="small">
              {{ topupTypeLabel(row.type) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="amount" label="金额(元)" min-width="110" align="right">
          <template #default="{ row }">
            <span :class="row.amount >= 0 ? 'charge-green' : 'charge-red'">
              {{ row.amount > 0 ? '+' : '' }}{{ row.amount }}
            </span>
          </template>
        </el-table-column>
        <el-table-column prop="balanceBefore" label="变动前余额" min-width="110" align="right" />
        <el-table-column prop="balanceAfter" label="变动后余额" min-width="110" align="right" />
        <el-table-column prop="remark" label="备注" min-width="160" />
      </el-table>
      <template #footer>
        <el-button @click="logsDialogVisible = false">关闭</el-button>
      </template>
    </ReDialog>
  </RePage>
</template>

<script setup lang="ts">
import { message } from "@repo/core";
import { ref, computed, onMounted } from 'vue';
import { ElMessageBox } from 'element-plus';
import { Search, Plus, Refresh, Edit, Delete, Money, RefreshRight } from '@element-plus/icons-vue';
import ReTable from '@repo/ui/re-table';
import type { ReTableColumn } from '@repo/ui/re-table';
import { appKeyApi, topupApi } from '@/services/javaApi';
import ReDialog from '@repo/ui/re-dialog';
import RePage from '@/components/ui/RePage.vue';
import ReButton from '@repo/ui/re-button';

/**
 * 列配置：原模板里的 6 个 el-table-column 收敛为数组。
 * appKey / status 带 {@code <template #default>} → slot；「操作」原本无 prop → 合成 prop actions。
 */
const appKeyColumns: ReTableColumn[] = [
  { prop: 'appName', label: '应用名称', minWidth: 150 },
  { prop: 'appKey', label: 'AppKey', minWidth: 200, slot: 'appKey' },
  { prop: 'provider', label: '提供商', minWidth: 120 },
  { prop: 'status', label: '状态', width: 100, align: 'center', slot: 'status' },
  { prop: 'balance', label: '余额', width: 100, align: 'right', slot: 'balance' },
  { prop: 'overdraftEnabled', label: '透支', width: 80, align: 'center', slot: 'overdraft' },
  { prop: 'minuteRate', label: '每分钟单价', width: 110, align: 'right' },
  { prop: 'totalCost', label: '累计费用', width: 110, align: 'right' },
  { prop: 'createTime', label: '创建时间', minWidth: 160 },
  { prop: 'actions', label: '操作', width: 220, fixed: 'right', align: 'center', slot: 'actions' },
];

const loading = ref(false);
/** AppKey 列表数据（ReTable 受控：分页由 ReTable 内部完成） */
const dataList = ref<any[]>([]);
/** 当前已选中的 AppKey 行（ReTable selection-change 返回跨页缓存的选区） */
const selectedItems = ref<any[]>([]);
/** 批量删除进行中（防连点重复提交） */
const batchDeleting = ref(false);

/** ReTable 多选变化：累计当前所有已选 AppKey 行 */
const onSelectionChange = (rows: any[]) => {
  selectedItems.value = rows;
};

/**
 * 多选取消/查询切换时清空选区。
 */
const clearSelection = () => {
  selectedItems.value = [];
};

const searchKeyword = ref('');
const currentPage = ref(1);
const pageSize = ref(20);
const dialogVisible = ref(false);
const isEdit = ref(false);
const submitting = ref(false);
const formRef = ref();

/** 充值弹窗 */
const rechargeDialogVisible = ref(false);
const rechargeForm = ref({ amount: 0, remark: '' });
const rechargeFormRef = ref();
const rechargeRules = {
  amount: [
    { required: true, message: '请输入充值金额', trigger: 'blur' },
    { type: 'number', min: 0.01, message: '充值金额须正数', trigger: 'blur' },
  ],
};

/** 账单弹窗 */
const logsDialogVisible = ref(false);
const logsLoading = ref(false);
const topupLogs = ref<any[]>([]);
const currentAppKey = ref({ name: '', id: '' });

const defaultForm = () => ({ id: '', appName: '', appKey: '', provider: '', status: 1, remark: '' });
const form = ref(defaultForm());
const rules = {
  appName: [{ required: true, message: '请输入应用名称', trigger: 'blur' }],
  appKey: [{ required: true, message: '请输入AppKey', trigger: 'blur' }],
  provider: [{ required: true, message: '请选择提供商', trigger: 'change' }],
};

/**
 * 过滤后的全量数据（**不再自己切片**）。
 *
 * <p>分页已交给 ReTable 内部完成：页面此前自己 slice + 配一页 el-pagination，
 * 两处都要维护页码/页长/总数，现已收口到组件内。</p>
 */
const filteredData = computed(() => {
  let result = dataList.value;
  if (searchKeyword.value) {
    result = result.filter((item) => item.appName?.includes(searchKeyword.value));
  }
  return result;
});

/** ReTable 分页页码变化（前端分页：组件自己切片，这里只需同步页码态） */
function onPageChange(page: number) {
  currentPage.value = page;
  // 翻页时旧行已不在当前页，清空选区避免误删
  clearSelection();
}

const loadData = async () => {
  loading.value = true;
  try {
    const res: any = await appKeyApi.list();
    dataList.value = res?.data || res?.records || res || [];
  } catch (e: any) {
    message.error('加载失败: ' + (e.message || ''));
    dataList.value = [];
  } finally {
    loading.value = false;
    // 列表刷新后翻页/页长/搜索都会让旧选区失效，直接清空
    clearSelection();
  }
};

const copyKey = (key: string) => {
  navigator.clipboard.writeText(key);
  message.success('已复制到剪贴板');
};

const openCreateDialog = () => {
  isEdit.value = false;
  form.value = defaultForm();
  dialogVisible.value = true;
};

const openEditDialog = (row: any) => {
  isEdit.value = true;
  form.value = { ...defaultForm(), ...row };
  dialogVisible.value = true;
};

const submitForm = async () => {
  if (!formRef.value) return;
  await formRef.value.validate(async (valid: boolean) => {
    if (!valid) return;
    submitting.value = true;
    try {
      if (isEdit.value) {
        await appKeyApi.update(form.value.id, form.value);
        message.success('更新成功');
      } else {
        await appKeyApi.create(form.value);
        message.success('创建成功');
      }
      dialogVisible.value = false;
      loadData();
    } catch (e: any) {
      message.error('保存失败: ' + (e.message || ''));
    } finally {
      submitting.value = false;
    }
  });
};

const deleteItem = async (row: any) => {
  try {
    await ElMessageBox.confirm(`确定删除「${row.appName}」吗？`, '删除确认', { type: 'warning' });
    await appKeyApi.delete(row.id);
    message.success('删除成功');
    loadData();
  } catch (e) {
    if (e !== 'cancel') message.error('删除失败');
  }
};

/**
 * 批量删除 AppKey：改走后端一次性批量接口，归集同一批请求的脏活。
 */
const batchDeleteItems = async () => {
  const targets = selectedItems.value.filter((item: any) => !!item);
  if (!targets.length) return;
  try {
    await ElMessageBox.confirm(
      `确定删除所选 ${targets.length} 个 AppKey 吗？删除后将无法恢复。`,
      '批量删除',
      { type: 'warning', confirmButtonText: '删除', cancelButtonText: '取消' },
    );
  } catch {
    return;
  }
  batchDeleting.value = true;
  try {
    const res: any = await appKeyApi.batchDelete(
      targets.map((item: any) => item.id),
    );
    const deleted = res?.data?.deletedCount ?? res?.deletedCount ?? targets.length;
    clearSelection();
    if (deleted === targets.length) {
      message.success('已删除 ' + targets.length + ' 个 AppKey');
    } else {
      message.warning(`已删除 ${deleted} 个 AppKey，${targets.length - deleted} 个失败`);
    }
  } finally {
    batchDeleting.value = false;
  }
  loadData();
};

/** 打开充值弹窗（保护归属守卫：充值仅消耗归属，不写面板） */
const openRechargeDialog = (row: any) => {
  currentAppKey.value = row;
  rechargeForm.value = { amount: 0, remark: '' };
  rechargeDialogVisible.value = true;
};

/** 充值到 AppKey（余额增加 + 记 RECHARGE 流水） */
const submitRecharge = async () => {
  if (!rechargeFormRef.value) return;
  await rechargeFormRef.value.validate(async (valid: boolean) => {
    if (!valid) return;
    submitting.value = true;
    try {
      await topupApi.recharge(currentAppKey.value.id, rechargeForm.value.amount, rechargeForm.value.remark);
      message.success('充值成功');
      rechargeDialogVisible.value = false;
      await loadData();
    } catch (e: any) {
      message.error('充值失败: ' + (e.message || ''));
    } finally {
      submitting.value = false;
    }
  });
};

/** 打开账单弹窗（充值/消费流水） */
const openLogsDialog = async (row: any) => {
  currentAppKey.value = row;
  logsLoading.value = true;
  logsDialogVisible.value = true;
  try {
    const res: any = await topupApi.list(currentAppKey.value.id);
    topupLogs.value = res?.data || [];
  } catch (e: any) {
    message.error('账单加载失败: ' + (e.message || ''));
    topupLogs.value = [];
  } finally {
    logsLoading.value = false;
  }
};

/** 充值/退款类型标签 */
const topupTypeLabel = (type: string) => {
  switch (type) {
    case 'RECHARGE': return '充值';
    case 'CONSUME': return '消费';
    case 'REFUND': return '退款';
    case 'ADJUST': return '调整';
    default: return type;
  }
};

const topupTypeTag = (type: string) => {
  switch (type) {
    case 'RECHARGE': return 'success';
    case 'CONSUME': return 'primary';
    case 'REFUND': return 'warning';
    case 'ADJUST': return 'info';
    default: return 'info';
  }
};

const formatBalance = (balance?: number) => {
  return balance != null ? balance.toFixed(4) : '0.0000';
};

onMounted(() => loadData());
</script>

<style scoped>
/* 页面外壳（留白 / 标题 / 操作区）已收口到 RePage：
   原来这里的 .app-keys-page 自带 padding + overflow，与 RePage 叠加会出现
   「双层留白 + 双滚动条」，所以整段删掉，只留内容区样式。 */

.panel-card {
  background: var(--el-bg-color);
  border: 1px solid var(--el-border-color-lighter);
  /* 与用量页看板统一：8px 圆角（原来这里是 16px，一页一个圆角标准） */
  border-radius: var(--u-radius, 8px);
  padding: 16px 18px 14px;
  /* 表格容器是页面区块，不加投影 */
}
.flat-table { --el-table-border-color: var(--el-border-color-lighter); }
.flat-table :deep(th.el-table__cell) {
  background: var(--el-fill-color-light);
  color: var(--el-text-color-regular);
  font-weight: 600;
}
.key-text { font-family: ui-monospace, monospace; font-size: 13px; color: var(--el-text-color-secondary); margin-right: 8px; }
/** 账单面板：正/负金额分色 */
.charge-green { color: var(--el-color-success); }
.charge-red { color: var(--el-color-danger); }
.balance-text { font-variant-numeric: tabular-nums; }
/* 注：原 .pagination-wrapper（页面自写 el-pagination 的容器）已随分页收口到 ReTable 内部而移除。 */
</style>
