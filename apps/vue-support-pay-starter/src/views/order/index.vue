<script setup>
import { fetchPageOrder } from "@/api/order";
import { handleOrigin, handlePayWay, handleStatus, handleStatusType, listOrigin, mapStatus } from "@/utils/pay";
import { useRenderIcon } from "@repo/components/ReIcon/src/hooks";
import { defineAsyncComponent, nextTick, reactive, ref } from "vue";
import { fetchRefundOrder, fetchCancelOrder } from "@/api/pay";
import { message } from "@repo/utils";
const ScQuery = defineAsyncComponent(() => import("@repo/components/ScQuery/index.vue"));

const DetailDialog = defineAsyncComponent(() => import("./detail.vue"));
const WaterDialog = defineAsyncComponent(() => import("./water.vue"));
const detailRef = ref();
const waterRef = ref();
const tableRef = ref();

const form = reactive({});

const handleDetail = async (row, type) => {
  nextTick(() => {
    detailRef.value.handleOpen(type, row, {
      handlePayWay,
      handleOrigin,
      handleStatus,
      handleStatusType
    });
  });
};

const handleRefreshSearch = async form => {
  tableRef.value.reload(form);
};

const handleRefresh = async () => {
  tableRef.value.refresh(form);
};
const handleWater = async (row, type) => {
  nextTick(() => {
    waterRef.value.handleOpen(type, row, {
      handlePayWay,
      handleOrigin,
      handleStatus,
      handleStatusType
    });
  });
};

const handleRefund = async row => {
  fetchRefundOrder({
    payMerchantOrderCode: row.payMerchantOrderCode
  }).then(res => {
    if (res.code === "00000") {
      message("退款成功", { type: "success" });
      return;
    }
    message(res.msg, { type: "error" });
  });
};
const handleCancel = async row => {
  fetchCancelOrder({
    payMerchantOrderCode: row.payMerchantOrderCode
  }).then(res => {
    if (res.code === "00000") {
      message("关闭成功", { type: "success" });
      return;
    }
    message(res.msg, { type: "error" });
  });
};

const isCanClose = row => {
  return row.payMerchantOrderStatus != "4000" && !row.payMerchantOrderStatus.startsWith("500");
};

const columns = [
  {
    label: "支付方式",
    type: "select",
    prop: "payMerchantOrderTradeType",
    selectOption: listOrigin(),
    width: 100
  },
  {
    label: "订单状态",
    type: "select",
    prop: "payMerchantOrderStatus",
    selectOption: mapStatus(),
    width: 100
  },
  {
    label: "订单时间",
    type: "dateDayPicker",
    prop: "payMerchantOrderTime",
    width: "auto",
    timeOption: {
      rangeValue: ["startTime", "endTime"]
    }
  }
];
</script>

<template>
  <div class="main background-color w-full h-full p-1">
    <DetailDialog ref="detailRef" />
    <WaterDialog ref="waterRef" />
    <div>
      <ScQuery v-model="form" :columns="columns" @onSearch="handleRefreshSearch" />
    </div>
    <ScTable ref="tableRef" style="height: calc(100% - 54px)" :rowClick="handleDetail" :url="fetchPageOrder" :params="form" :pageSize="20" :border="false" :stripe="true">
      <el-table-column label="商户名称" prop="payMerchantName" width="100" show-overflow-tooltip>
        <template #default="{ row }">
          <el-tag :title="row.payMerchantCode">{{ row.payMerchantName }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column label="订单编号" prop="payMerchantOrderCode" show-overflow-tooltip min-width="160px">
        <template #default="{ row }">
          <el-tag v-copy:click.stop="row.payMerchantOrderCode">
            {{ row.payMerchantOrderCode }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column label="商品来源" prop="payMerchantOrderOrigin" show-overflow-tooltip>
        <template #default="{ row }">
          <el-tag>{{ handleOrigin(row.payMerchantOrderOrigin) }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column label="商品名称" prop="payMerchantOrderProductName" show-overflow-tooltip />
      <el-table-column label="支付金额" prop="payMerchantOrderTotalPrice" show-overflow-tooltip min-width="140px">
        <template #default="{ row }">
          <el-tag type="primary">
            <el-icon v-if="row.payMerchantCouponCode" color="red">
              <component :is="useRenderIcon('ri:coupon-2-fill')" />
            </el-icon>
            {{ row.payMerchantOrderTotalPrice }} | {{ row.payMerchantOrderPrice }}
          </el-tag>
          <el-tag type="info">{{ handlePayWay(row.payMerchantOrderTradeType) }}</el-tag>
        </template>
      </el-table-column>

      <el-table-column label="支付状态" prop="payMerchantOrderStatus">
        <template #default="{ row }">
          <el-tag :type="handleStatusType(row.payMerchantOrderStatus)">{{ handleStatus(row.payMerchantOrderStatus) }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column label="支付设备" prop="payMerchantOrderBrowserSystem" />

      <el-table-column label="创建时间" min-width="90px">
        <template #default="{ row }">
          {{ row.createTime }}
        </template>
      </el-table-column>
      <el-table-column label="创建时间" width="200px" :fixed="false">
        <template #default="{ row }">
          <el-button v-if="(row.payMerchantOrderStatus + '')?.startsWith('200')" title="退款" class="btn-text z-[100]" :icon="useRenderIcon('ri:refund-2-line')" @click.stop="handleRefund(row)" />
          <el-button v-if="isCanClose(row)" type="danger" title="关闭" class="btn-text z-[100]" :icon="useRenderIcon('ri:close-circle-fill')" @click.stop="handleCancel(row)" />
          <el-button class="btn-text z-[100]" title="流水" :icon="useRenderIcon('ri:stack-line')" @click.stop="handleWater(row)" />
        </template>
      </el-table-column>
    </ScTable>
  </div>
</template>
