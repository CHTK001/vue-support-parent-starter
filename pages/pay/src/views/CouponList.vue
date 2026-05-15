<template>
  <PmPageShell page-class="coupon-page">
    <PmSurface
      title="优惠券管理"
      description="管理优惠券模板，支持创建、启用/停用和删除。"
    >
      <template #actions>
        <el-tooltip content="刷新">
          <ScButton circle :icon="RefreshRight" @click="reloadAll" />
        </el-tooltip>
        <ScButton type="primary" :icon="Plus" @click="openCreateDialog">新增优惠券</ScButton>
      </template>
    </PmSurface>

    <PmStatGrid>
      <PmStatCard label="优惠券总数" hint="所有状态的优惠券模板总数">
        <template #value>{{ stats.total }}</template>
      </PmStatCard>
      <PmStatCard label="已启用" hint="当前可正常使用的优惠券">
        <template #value>{{ stats.enabled }}</template>
      </PmStatCard>
      <PmStatCard label="总发放量" hint="所有优惠券的发放总数">
        <template #value>{{ stats.totalCount }}</template>
      </PmStatCard>
    </PmStatGrid>

    <PmToolbar>
      <template #form>
        <el-select v-model="queryForm.merchantId" clearable placeholder="全部商户" style="width: 220px">
          <el-option v-for="item in merchantOptions" :key="item.id" :label="item.merchantName" :value="item.id" />
        </el-select>
        <el-input v-model="queryForm.couponName" clearable placeholder="优惠券名称" style="width: 220px" @keyup.enter="handleSearch" />
        <el-select v-model="queryForm.status" clearable placeholder="状态" style="width: 140px">
          <el-option label="已启用" :value="1" />
          <el-option label="已停用" :value="0" />
        </el-select>
      </template>
      <template #actions>
        <ScButton type="primary" :icon="Search" @click="handleSearch">查询</ScButton>
        <ScButton @click="handleReset">重置</ScButton>
      </template>
    </PmToolbar>

    <PmPanel title="优惠券列表" description="优惠券模板的创建、状态管理和使用情况概览。">
      <ScTable
        ref="tableRef"
        table-name="payment-coupon-list"
        row-key="id"
        border
        stripe
        :search="false"
        :hide-do="true"
        :hide-refresh="true"
        :hide-setting="true"
        :params="queryForm"
        :url="fetchCouponList"
      >
        <el-table-column label="优惠券编码" width="160">
          <template #default="{ row }">
            <el-tag effect="plain">{{ row.couponCode || '-' }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="优惠券名称" min-width="160">
          <template #default="{ row }">
            <div class="cell-main">
              <strong>{{ row.couponName }}</strong>
              <span>{{ row.couponType === 'CASH' ? '现金抵扣' : '折扣券' }}</span>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="优惠类型" width="120" align="center">
          <template #default="{ row }">
            <span>{{ row.discountType === 'PERCENT' ? `${row.discountValue}折` : `¥${row.discountValue}` }}</span>
          </template>
        </el-table-column>
        <el-table-column label="使用门槛" width="120" align="center">
          <template #default="{ row }">
            <span>{{ row.minAmount > 0 ? `满¥${row.minAmount}` : '无门槛' }}</span>
          </template>
        </el-table-column>
        <el-table-column label="发放/总量" width="120" align="center">
          <template #default="{ row }">
            <span>{{ row.usedCount }}/{{ row.totalCount }}</span>
          </template>
        </el-table-column>
        <el-table-column label="有效期" min-width="200">
          <template #default="{ row }">
            <span>{{ row.startTime || '-' }} ~ {{ row.endTime || '-' }}</span>
          </template>
        </el-table-column>
        <el-table-column label="商户" prop="merchantName" min-width="140" />
        <el-table-column label="状态" width="80" align="center">
          <template #default="{ row }">
            <el-tag :type="row.status === 1 ? 'success' : 'info'" effect="plain">
              {{ row.status === 1 ? '启用' : '停用' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="创建时间" width="170">
          <template #default="{ row }">
            <span>{{ row.createdAt || row.updatedAt || '-' }}</span>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="180" fixed="right">
          <template #default="{ row }">
            <div class="pm-icon-actions ops-hover-actions">
              <el-tooltip content="编辑">
                <ScButton circle :icon="Edit" @click="openEditDialog(row)" />
              </el-tooltip>
              <el-tooltip :content="row.status === 1 ? '停用' : '启用'">
                <ScButton circle :type="row.status === 1 ? 'warning' : 'success'" :icon="row.status === 1 ? SwitchButton : CircleCheck" @click="toggleStatus(row)" />
              </el-tooltip>
              <el-tooltip content="删除">
                <ScButton circle type="danger" :icon="Delete" @click="handleDelete(row)" />
              </el-tooltip>
            </div>
          </template>
        </el-table-column>
      </ScTable>
    </PmPanel>

    <ScDialog v-model="dialogVisible" :title="isEditing ? '编辑优惠券' : '新增优惠券'" width="640px" destroy-on-close>
      <el-form label-width="110px">
        <div class="pm-form-grid">
          <el-form-item label="优惠券编码" required>
            <el-input v-model="form.couponCode" placeholder="唯一编码，例如：NEWUSER50" />
          </el-form-item>
          <el-form-item label="优惠券名称" required>
            <el-input v-model="form.couponName" placeholder="例如：新用户专享券" />
          </el-form-item>
          <el-form-item label="优惠类型">
            <el-select v-model="form.discountType">
              <el-option label="固定金额" value="FIXED" />
              <el-option label="折扣比例" value="PERCENT" />
            </el-select>
          </el-form-item>
          <el-form-item label="优惠值" required>
            <el-input-number v-model="form.discountValue" :min="0.01" :precision="2" :step="1" />
          </el-form-item>
          <el-form-item label="使用门槛">
            <el-input-number v-model="form.minAmount" :min="0" :precision="2" :step="10" />
          </el-form-item>
          <el-form-item label="总量" required>
            <el-input-number v-model="form.totalCount" :min="1" :step="100" />
          </el-form-item>
          <el-form-item label="所属商户">
            <el-select v-model="form.merchantId" clearable placeholder="不选则全局">
              <el-option v-for="item in merchantOptions" :key="item.id" :label="item.merchantName" :value="item.id" />
            </el-select>
          </el-form-item>
          <el-form-item label="开始时间">
            <el-date-picker v-model="form.startTime" type="datetime" placeholder="选择开始时间" value-format="YYYY-MM-DD HH:mm:ss" />
          </el-form-item>
          <el-form-item label="结束时间">
            <el-date-picker v-model="form.endTime" type="datetime" placeholder="选择结束时间" value-format="YYYY-MM-DD HH:mm:ss" />
          </el-form-item>
          <el-form-item label="描述" class="pm-form-span-2">
            <el-input v-model="form.description" type="textarea" :rows="3" />
          </el-form-item>
        </div>
      </el-form>
      <template #footer>
        <ScButton @click="dialogVisible = false">取消</ScButton>
        <ScButton type="primary" :loading="saving" @click="submitForm">保存</ScButton>
      </template>
    </ScDialog>
  </PmPageShell>
</template>

<script setup lang="ts">
import { onMounted, reactive, ref } from "vue";
import { CircleCheck, Delete, Edit, Plus, RefreshRight, Search, SwitchButton } from "@element-plus/icons-vue";
import { ElMessage, ElMessageBox } from "element-plus";
import { createCoupon, deleteCoupon, disableCoupon, enableCoupon, getCouponList, getMerchantList, updateCoupon } from "../api/payment";
import type { CouponTemplate, Merchant } from "../types/payment";
import PmPageShell from "../components/layout/PmPageShell.vue";
import PmSurface from "../components/layout/PmSurface.vue";
import PmStatGrid from "../components/layout/PmStatGrid.vue";
import PmStatCard from "../components/layout/PmStatCard.vue";
import PmToolbar from "../components/layout/PmToolbar.vue";
import PmPanel from "../components/layout/PmPanel.vue";

const tableRef = ref();
const merchantOptions = ref<Merchant[]>([]);
const dialogVisible = ref(false);
const saving = ref(false);
const isEditing = ref(false);
const editingId = ref(0);

const stats = reactive({ total: 0, enabled: 0, totalCount: 0 });
const queryForm = reactive({ merchantId: undefined as number | undefined, couponName: "", status: undefined as number | undefined });
const form = reactive({
  couponCode: "", couponName: "", discountType: "FIXED", discountValue: 0, minAmount: 0,
  totalCount: 100, merchantId: undefined as number | undefined,
  startTime: "", endTime: "", description: "",
});

const fetchCouponList = async (params: Record<string, unknown>) => {
  try {
    const res = await getCouponList({ page: params.page, size: params.pageSize, merchantId: params.merchantId, couponName: params.couponName, status: params.status });
    if (res?.code && res.code !== "00000") {
      return { code: "00000", data: { records: [], total: 0 } };
    }
    return res;
  } catch {
    return { code: "00000", data: { records: [], total: 0 } };
  }
};

async function loadBase() {
  try {
    const res = await getMerchantList({ page: 1, size: 200 });
    merchantOptions.value = res.data.records || [];
  } catch { merchantOptions.value = []; }
}

async function loadStats() {
  try {
    const res = await getCouponList({ page: 1, size: 200 });
    if (res?.code && res.code !== "00000") return;
    const records = res?.data?.records || [];
    stats.total = res?.data?.total || 0;
    stats.enabled = records.filter((item) => item.status === 1).length;
    stats.totalCount = records.reduce((sum, item) => sum + Number(item.totalCount || 0), 0);
  } catch { /* 优惠券模块尚未初始化 */ }
}

async function reloadAll() {
  await Promise.all([loadStats(), tableRef.value?.reload({ ...queryForm }, 1)]);
}

function handleSearch() { tableRef.value?.reload({ ...queryForm }, 1); }
function handleReset() { queryForm.merchantId = undefined; queryForm.couponName = ""; queryForm.status = undefined; handleSearch(); }

function openCreateDialog() {
  isEditing.value = false;
  editingId.value = 0;
  Object.assign(form, { couponCode: "", couponName: "", discountType: "FIXED", discountValue: 0, minAmount: 0, totalCount: 100, merchantId: undefined, startTime: "", endTime: "", description: "" });
  dialogVisible.value = true;
}

function openEditDialog(row: CouponTemplate) {
  isEditing.value = true;
  editingId.value = row.id;
  Object.assign(form, {
    couponCode: row.couponCode, couponName: row.couponName, discountType: row.discountType, discountValue: row.discountValue,
    minAmount: row.minAmount, totalCount: row.totalCount, merchantId: row.merchantId,
    startTime: row.startTime || "", endTime: row.endTime || "", description: row.description || "",
  });
  dialogVisible.value = true;
}

async function submitForm() {
  if (!form.couponName || !form.discountValue) {
    ElMessage.error("优惠券名称和优惠值不能为空");
    return;
  }
  saving.value = true;
  try {
    if (isEditing.value) {
      await updateCoupon(editingId.value, { ...form });
      ElMessage.success("优惠券已更新");
    } else {
      await createCoupon({ ...form });
      ElMessage.success("优惠券已创建");
    }
    dialogVisible.value = false;
    await reloadAll();
  } finally {
    saving.value = false;
  }
}

async function toggleStatus(row: CouponTemplate) {
  try {
    if (row.status === 1) {
      await disableCoupon(row.id);
      ElMessage.success("优惠券已停用");
    } else {
      await enableCoupon(row.id);
      ElMessage.success("优惠券已启用");
    }
    await reloadAll();
  } catch { /* handled */ }
}

async function handleDelete(row: CouponTemplate) {
  try {
    await ElMessageBox.confirm(`确认删除优惠券「${row.couponName}」？`, "删除确认", { type: "warning" });
    await deleteCoupon(row.id);
    ElMessage.success("优惠券已删除");
    await reloadAll();
  } catch { /* cancelled */ }
}

onMounted(async () => {
  await Promise.all([loadBase(), loadStats()]);
  tableRef.value?.reload();
});
</script>

<style scoped>

.cell-main {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.cell-main span {
  color: var(--pm-text-muted, #8b97a9);
  font-size: var(--pm-font-size-xs, 11px);
  line-height: 1.6;
}

.cell-main strong {
  color: var(--pm-text-primary, #070b15);
}

.ops-hover-actions .el-button {
  opacity: 0;
  transition: opacity 0.2s ease;
}
.el-table__row:hover .ops-hover-actions .el-button {
  opacity: 1;
}
</style>
