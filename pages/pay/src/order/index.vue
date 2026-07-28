<template>
  <PmPageShell page-class="order-page">
    <PmSurface title="订单管理" description="查看和管理所有支付订单，支持退款和关闭操作。">
      <template #actions>
        <ScButton :icon="Refresh" @click="handleRefresh">刷新</ScButton>
      </template>
    </PmSurface>

    <PmToolbar>
      <template #form>
        <ScSelect v-model="form.payMerchantOrderStatus" placeholder="全部状态" clearable style="width: 160px">
          <ScOption v-for="opt in statusOptions" :key="opt.value" :label="opt.label" :value="opt.value" />
        </ScSelect>
        <ScSelect v-model="form.payMerchantId" filterable clearable placeholder="选择商户" style="width: 200px">
          <ScOption v-for="m in merchants" :key="m.payMerchantId" :label="m.payMerchantName" :value="m.payMerchantId" />
        </ScSelect>
        <ScDatePicker v-model="payTime" type="datetimerange" range-separator="至" start-placeholder="支付开始" end-placeholder="支付结束" @change="onPayTimeChange" />
        <ScDatePicker v-model="finishTime" type="datetimerange" range-separator="至" start-placeholder="完成开始" end-placeholder="完成结束" @change="onFinishTimeChange" />
      </template>
      <template #actions>
        <ScButton type="primary" :icon="Search" @click="handleRefresh">查询</ScButton>
      </template>
    </PmToolbar>

    <PmPanel title="订单列表" description="支持行点击查看详细流水和失败记录。">
      <ScTable
        ref="tableRef"
        :url="fetchPageOrder"
        :params="form"
        class="order-table"
        @data-loaded="onLoaded"
        :rowClick="handleRowClick"
      >
        <ScTableColumn label="订单号" prop="payMerchantOrderCode" min-width="220" fixed>
          <template #default="{ row }">
            <span class="flex gap-2 items-center">
              <el-text>{{ row.payMerchantOrderCode }}</el-text>
              <iconifyIconOnline icon="ep:document-copy" class="cursor-pointer" v-copy:click="row.payMerchantOrderCode" />
            </span>
          </template>
        </ScTableColumn>
        <ScTableColumn label="商户" prop="payMerchantName" min-width="160" />
        <ScTableColumn label="金额" prop="payMerchantOrderAmount" width="120" />
        <ScTableColumn label="状态" prop="payMerchantOrderStatus" width="130">
          <template #default="{ row }">
            <ScTag :type="statusType(row.payMerchantOrderStatus)">{{ statusLabel(row.payMerchantOrderStatus) }}</ScTag>
          </template>
        </ScTableColumn>
        <ScTableColumn label="支付时间" prop="payMerchantOrderPayTime" min-width="170" />
        <ScTableColumn label="完成时间" prop="payMerchantOrderFinishedTime" min-width="170" />

        <ScTableColumn label="详情" width="120" align="center">
          <template #default="{ row }">
            <ScPopover placement="bottom" trigger="click" width="420">
              <template #reference>
                <ScButton text size="small"><iconifyIconOnline icon="ep:view" />查看</ScButton>
              </template>
              <div class="grid grid-cols-2 gap-2 text-sm">
                <div><b>OpenID</b>：{{ row.payMerchantOrderOpenid || "-" }}</div>
                <div><b>交易号</b>：{{ row.payMerchantOrderTransactionId || "-" }}</div>
                <div><b>浏览器</b>：{{ row.payMerchantOrderBrowser || "-" }}</div>
                <div><b>客户端IP</b>：{{ row.payMerchantOrderAddress || "-" }}</div>
                <div class="col-span-2"><b>备注</b>：{{ row.payMerchantOrderRemark || "-" }}</div>
                <div class="col-span-2"><b>附加参数</b>：{{ row.payMerchantOrderAttach || "-" }}</div>
              </div>
            </ScPopover>
          </template>
        </ScTableColumn>

        <ScTableColumn label="操作" width="240" fixed="right">
          <template #default="{ row }">
            <div class="pm-icon-actions ops-hover-actions">
              <el-tooltip content="退款">
                <ScButton circle :icon="Refund" :disabled="!canRefund(row)" type="warning" @click="onRefund(row)" />
              </el-tooltip>
              <el-tooltip content="关闭">
                <ScButton circle :icon="Close" :disabled="!canClose(row)" type="danger" @click="onClose(row)" />
              </el-tooltip>
            </div>
          </template>
        </ScTableColumn>
      </ScTable>
    </PmPanel>

    <sc-drawer v-model="detail.visible" :title="`订单详情 - ${detail.row?.payMerchantOrderCode || ''}`" size="60%">
      <div class="grid grid-cols-5 gap-4">
        <div class="col-span-3">
          <h4 class="pm-drawer-section-title">订单流水</h4>
          <el-timeline>
            <el-timeline-item v-for="(it, idx) in detail.water" :key="idx" :timestamp="it.createTime" type="primary">
              <span>状态：{{ statusLabel(it.payMerchantOrderStatus) }}</span>
              <span class="ml-2">流水号：{{ it.payMerchantOrderWaterCode }}</span>
            </el-timeline-item>
          </el-timeline>
        </div>
        <div class="col-span-2">
          <h4 class="pm-drawer-section-title">失败记录</h4>
          <ScEmpty v-if="!(detail.failure?.length > 0)" description="暂无失败记录" />
          <div v-else class="flex flex-col gap-2 max-h-[400px] overflow-y-auto">
            <ScCard v-for="(fr, i) in detail.failure" :key="i" shadow="never">
              <div><b>类型</b>：{{ fr.payMerchantFailureType || "-" }}</div>
              <div><b>原因</b>：{{ fr.payMerchantFailureReason || "-" }}</div>
              <div><b>时间</b>：{{ fr.createTime || "-" }}</div>
            </ScCard>
          </div>
        </div>
      </div>
    </sc-drawer>
  </PmPageShell>
</template>

<script setup lang="ts">
import { defineExpose, nextTick, reactive, ref, watch } from "vue";
import { Close, Refund, Refresh, Search } from "@element-plus/icons-vue";
import {
  fetchPageOrder, fetchCloseOrder, fetchRefundOrder, fetchRefundToWallet, OrderStatusOptions,
} from "../api/order";
import { fetchPageMerchant } from "../api/merchant";
import { fetchOrderWater, fetchOrderFailure } from "../api/order";
import { message, ScMessageBox } from "@repo/utils";
import { ScOption } from "@repo/components/ScOption";
import { ScDatePicker } from "@repo/components/ScDatePicker";
import ScTable from "@repo/components/ScTable/index.vue";
import { ScPopover } from "@repo/components/ScPopover";
import { ScDrawer } from "@repo/components/ScDrawer";
import { ScEmpty } from "@repo/components/ScEmpty";
import { ScCard } from "@repo/components/ScCard";
import PmPageShell from "../components/layout/PmPageShell.vue";
import PmSurface from "../components/layout/PmSurface.vue";
import PmToolbar from "../components/layout/PmToolbar.vue";
import PmPanel from "../components/layout/PmPanel.vue";

const tableRef = ref();
const form = reactive<any>({});
const statusOptions = OrderStatusOptions;

const merchants = ref<any[]>([]);
const payTime = ref<[Date, Date] | null>(null);
const finishTime = ref<[Date, Date] | null>(null);

const loadMerchants = async () => {
  const { data } = await fetchPageMerchant({ page: 1, size: 50 });
  merchants.value = data || [];
};

const onPayTimeChange = (val: any) => {
  form.payMerchantOrderPayTimeStart = val?.[0] || null;
  form.payMerchantOrderPayTimeEnd = val?.[1] || null;
};
const onFinishTimeChange = (val: any) => {
  form.payMerchantOrderFinishedTimeStart = val?.[0] || null;
  form.payMerchantOrderFinishedTimeEnd = val?.[1] || null;
};

const onLoaded = () => {};
const handleRefresh = () => tableRef.value?.reload(form);

const statusType = (s: string) => {
  switch (s) {
    case "PAY_SUCCESS": return "success";
    case "PAY_WAITING": return "warning";
    case "PAY_REFUND_WAITING": return "warning";
    case "PAY_REFUND_SUCCESS": return "info";
    case "PAY_CLOSE_SUCCESS": return "info";
    case "PAY_TIMEOUT": return "danger";
    default: return "";
  }
};
const statusLabel = (s: string) => statusOptions.find((i) => i.value === s)?.label || s;

const canRefund = (row: any) => row.payMerchantOrderStatus === "PAY_SUCCESS";
const canClose = (row: any) => !["PAY_WAITING", "PAY_CREATE", "PAY_REFUND_WAITING"].includes(row.payMerchantOrderStatus);

const onClose = async (row: any) => {
  await ScMessageBox.confirm(`确认关闭订单 ${row.payMerchantOrderCode} ?`, "提示");
  await fetchCloseOrder(row.payMerchantOrderCode);
  message("关闭成功", { type: "success" });
  handleRefresh();
};

const onRefund = async (row: any) => {
  const { value } = await ScMessageBox.prompt("请输入退款金额", "退款", {
    inputPattern: /^(\d+)(\.\d{1,2})?$/,
    inputErrorMessage: "金额格式不正确",
  });
  const amount = Number(value);
  await fetchRefundOrder(row.payMerchantOrderCode, { refundAmount: amount });
  message("已发起退款", { type: "success" });
  handleRefresh();
};

loadMerchants();

const detail = reactive<any>({ visible: false, water: [], failure: [], row: null });
const handleRowClick = async (row: any) => {
  detail.row = row;
  const [w, f] = await Promise.all([
    fetchOrderWater(row.payMerchantOrderCode),
    fetchOrderFailure(row.payMerchantOrderCode),
  ]);
  detail.water = w?.data || [];
  detail.failure = f?.data || [];
  detail.visible = true;
};

defineExpose({ handleRefresh });

watch(form, () => {}, { deep: true });
</script>

<style scoped>
.order-table :deep(.el-table) {
  border-radius: 8px;
  overflow: hidden;
}
.ops-hover-actions .el-button {
  opacity: 0;
  transition: opacity 0.2s ease;
}
.el-table__row:hover .ops-hover-actions .el-button {
  opacity: 1;
}
.pm-drawer-section-title {
  font-size: 16px;
  font-weight: 600;
  margin-bottom: 16px;
  color: var(--pm-text-primary, #070b15);
}
</style>
