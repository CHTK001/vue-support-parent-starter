<template>
  <div class="system-container order-page">
    <div class="order-header">
      <div class="left">
        <iconifyIconOnline icon="ep:document" width="18" />
        <span class="title">订单管理</span>
      </div>
      <div class="right">
        <ScForm :inline="true" :model="form" class="search-form">
          <ScFormItem label="状态">
            <ScSelect 
              v-model="form.payMerchantOrderStatus"
              placeholder="全部"
              clearable
              class="!w-[160px]"
            >
              <ScOption 
                v-for="opt in statusOptions"
                :key="opt.value"
                :label="opt.label"
                :value="opt.value"
              />
            </ScSelect>
          </ScFormItem>
          <ScFormItem label="商户">
            <ScSelect 
              v-model="form.payMerchantId"
              filterable
              clearable
              placeholder="选择商户"
              class="!w-[200px]"
            >
              <ScOption 
                v-for="m in merchants"
                :key="m.payMerchantId"
                :label="m.payMerchantName"
                :value="m.payMerchantId"
              />
            </ScSelect>
          </ScFormItem>
          <ScFormItem label="支付时间">
            <ScDatePicker 
              v-model="payTime"
              type="datetimerange"
              range-separator="至"
              start-placeholder="开始"
              end-placeholder="结束"
              @change="onPayTimeChange"
            />
          </ScFormItem>
          <ScFormItem label="完成时间">
            <ScDatePicker 
              v-model="finishTime"
              type="datetimerange"
              range-separator="至"
              start-placeholder="开始"
              end-placeholder="结束"
              @change="onFinishTimeChange"
            />
          </ScFormItem>
          <ScFormItem>
            <ScButton @click="handleRefresh"
              ><iconifyIconOnline icon="ep:refresh" />刷新</el-button
            >
          </ScFormItem>
        </ScForm>
      </div>
    </div>

    <ScTable
      ref="tableRef"
      :url="fetchPageOrder"
      :params="form"
      class="modern-table order-table"
      @data-loaded="onLoaded"
      :rowClick="handleRowClick"
    >
      <ScTableColumn 
        label="订单号"
        prop="payMerchantOrderCode"
        min-width="220"
        fixed
      >
        <template #default="{ row }">
          <span class="flex gap-2 items-center">
            <el-text>{{ row.payMerchantOrderCode }}</el-text>
            <iconifyIconOnline
              icon="ep:document-copy"
              class="cursor-pointer"
              v-copy:click="row.payMerchantOrderCode"
            />
          </span>
        </template>
      </ScTableColumn>
      <ScTableColumn label="商户" prop="payMerchantName" min-width="160" />
      <ScTableColumn label="金额" prop="payMerchantOrderAmount" width="120" />
      <ScTableColumn label="状态" prop="payMerchantOrderStatus" width="130">
        <template #default="{ row }">
          <ScTag :type="statusType(row.payMerchantOrderStatus)">{{
            statusLabel(row.payMerchantOrderStatus)
          }}</ScTag>
        </template>
      </ScTableColumn>
      <ScTableColumn 
        label="支付时间"
        prop="payMerchantOrderPayTime"
        min-width="170"
      />
      <ScTableColumn 
        label="完成时间"
        prop="payMerchantOrderFinishedTime"
        min-width="170"
      />

      <ScTableColumn label="详情" width="120" align="center">
        <template #default="{ row }">
          <ScPopover placement="bottom" trigger="click" width="420">
            <template #reference>
              <ScButton text size="small"
                ><iconifyIconOnline icon="ep:view" />查看</el-button
              >
            </template>
            <div class="grid grid-cols-2 gap-2 text-sm">
              <div><b>OpenID</b>：{{ row.payMerchantOrderOpenid || "-" }}</div>
              <div>
                <b>交易号</b>：{{ row.payMerchantOrderTransactionId || "-" }}
              </div>
              <div><b>浏览器</b>：{{ row.payMerchantOrderBrowser || "-" }}</div>
              <div>
                <b>客户端IP</b>：{{ row.payMerchantOrderAddress || "-" }}
              </div>
              <div class="col-span-2">
                <b>备注</b>：{{ row.payMerchantOrderRemark || "-" }}
              </div>
              <div class="col-span-2">
                <b>附加参数</b>：{{ row.payMerchantOrderAttach || "-" }}
              </div>
            </div>
          </ScPopover>
        </template>
      </ScTableColumn>

      <ScTableColumn label="操作" width="240" fixed="right">
        <template #default="{ row }">
          <ScButton 
            text
            size="small"
            :disabled="!canRefund(row)"
            @click="onRefund(row)"
            ><iconifyIconOnline icon="ri:refund-2-line" />退款</el-button
          >
          <ScButton 
            text
            size="small"
            :disabled="!canClose(row)"
            type="danger"
            @click="onClose(row)"
            ><iconifyIconOnline icon="ep:close" />关闭</el-button
          >
        </template>
      </ScTableColumn>
    </ScTable>
  </div>
  <sc-drawer
    v-model="detail.visible"
    :title="`订单详情 - ${detail.row?.payMerchantOrderCode || ''}`"
    size="60%"
  >
    <div class="dialog-header">
      <h3>订单详情 - {{ detail.row?.payMerchantOrderCode || '' }}</h3>
    </div>
    <div class="grid grid-cols-5 gap-4">
      <div class="col-span-3">
        <h4>订单流水</h4>
        <el-timeline>
          <el-timeline-item
            v-for="(it, idx) in detail.water"
            :key="idx"
            :timestamp="it.createTime"
            :type="'primary'"
          >
            <span>状态：{{ statusLabel(it.payMerchantOrderStatus) }}</span>
            <span class="ml-2">流水号：{{ it.payMerchantOrderWaterCode }}</span>
          </el-timeline-item>
        </el-timeline>
      </div>
      <div class="col-span-2">
        <h4>失败记录</h4>
        <ScEmpty 
          v-if="!(detail.failure?.length > 0)"
          description="暂无失败记录"
        />
        <el-scrollbar v-else height="400px">
          <ScCard 
            v-for="(fr, i) in detail.failure"
            :key="i"
            class="mb-2"
            shadow="never"
          >
            <div><b>类型</b>：{{ fr.payMerchantFailureType || "-" }}</div>
            <div><b>原因</b>：{{ fr.payMerchantFailureReason || "-" }}</div>
            <div><b>时间</b>：{{ fr.createTime || "-" }}</div>
          </ScCard>
        </el-scrollbar>
      </div>
    </div>
  </sc-drawer>
</template>

<script setup lang="ts">
import {
  defineExpose,
  defineAsyncComponent,
  nextTick,
  reactive,
  ref,
  watch,
} from "vue";
import {
  fetchPageOrder,
  fetchCloseOrder,
  fetchRefundOrder,
  fetchRefundToWallet,
  OrderStatusOptions,
} from "../api/order";
import { fetchPageMerchant } from "../api/merchant";

import { message , ScMessageBox} from "@repo/utils";

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
    case "PAY_SUCCESS":
      return "success";
    case "PAY_WAITING":
      return "warning";
    case "PAY_REFUND_WAITING":
      return "warning";
    case "PAY_REFUND_SUCCESS":
      return "info";
    case "PAY_CLOSE_SUCCESS":
      return "info";
    case "PAY_TIMEOUT":
      return "danger";
    default:
      return "";
  }
};
const statusLabel = (s: string) =>
  statusOptions.find((i) => i.value === s)?.label || s;

const canRefund = (row: any) => row.payMerchantOrderStatus === "PAY_SUCCESS";
const canClose = (row: any) =>
  !["PAY_WAITING", "PAY_CREATE", "PAY_REFUND_WAITING"].includes(
    row.payMerchantOrderStatus
  );

const onClose = async (row: any) => {
  await ScMessageBox.confirm(
    `确认关闭订单 ${row.payMerchantOrderCode} ?`,
    "提示"
  );
  await fetchCloseOrder(row.payMerchantOrderCode);
  message("关闭成功", { type: "success" });
  handleRefresh();
};

const onRefund = async (row: any) => {
  const { value } = await ScMessageBox.prompt("请输入退款金额", "退款", {
    inputPattern: /^(\\d+)(\\.\\d{1,2})?$/,
    inputErrorMessage: "金额格式不正确",
  });
  const amount = Number(value);
  await fetchRefundOrder(row.payMerchantOrderCode, { refundAmount: amount });
  message("已发起退款", { type: "success" });
  handleRefresh();
};

loadMerchants();

// 行点击 -> 显示流水/失败详情
const detail = reactive<any>({
  visible: false,
  water: [],
  failure: [],
  row: null,
});
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

// defineExpose 和 watch 必须放在最后（遵循项目规则）

defineExpose({ handleRefresh });

watch(form, () => {}, { deep: true });
</script>

<style scoped lang="scss">
.order-page {
  padding: 24px;
  background-color: var(--el-bg-color);
  border-radius: 12px;
  min-height: 100%;
}

.order-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
  padding: 20px 24px;
  background: linear-gradient(
    135deg,
    var(--el-color-primary-light-9) 0%,
    var(--el-bg-color-overlay) 100%
  );
  border-radius: 12px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.04);

  .left {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 20px;
    color: var(--el-color-primary);
  }
}

.title {
  font-weight: 700;
  font-size: 18px;
  color: var(--el-text-color-primary);
  margin-left: 8px;
}

.search-form {
  :deep(.el-form-item) {
    margin-bottom: 0;
    margin-right: 16px;
  }

  :deep(.el-input__wrapper),
  :deep(.el-select__wrapper) {
    border-radius: 8px;
  }
}

:deep(.el-table) {
  border-radius: 8px;
  overflow: hidden;

  th {
    background-color: var(--el-fill-color-light) !important;
    font-weight: 600;
    color: var(--el-text-color-primary);
  }

  .el-table__row {
    transition: all 0.2s ease;
    cursor: pointer;

    &:hover {
      background-color: var(--el-color-primary-light-9) !important;
    }
  }
}

:deep(.el-tag) {
  border-radius: 6px;
  font-weight: 500;
}

:deep(.el-button--text) {
  transition: all 0.2s ease;

  &:hover {
    transform: translateY(-1px);
  }
}

:deep(.el-drawer) {
  .el-drawer__header {
    background: linear-gradient(
      135deg,
      var(--el-color-primary-light-9) 0%,
      var(--el-bg-color-overlay) 100%
    );
    border-bottom: 1px solid var(--el-border-color-lighter);
    margin-bottom: 0;
    padding: 16px 20px;
  }

  .el-drawer__body {
    padding: 24px;
  }
}

:deep(.el-timeline-item__timestamp) {
  color: var(--el-text-color-secondary);
}

:deep(.el-card) {
  border-radius: 8px;
  border: 1px solid var(--el-border-color-lighter);
}

:deep(.el-popover) {
  border-radius: 8px;
}
</style>
