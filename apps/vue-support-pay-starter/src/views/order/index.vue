<script setup>
import { fetchPageOrder } from "@/api/order";
import { handleOrigin, handlePayWay, handleStatus, handleStatusType } from "@/utils/pay";
import { useRenderIcon } from "@repo/components/ReIcon/src/hooks";
import { defineAsyncComponent, nextTick, reactive, ref } from "vue";
import { fetchRefundOrder, fetchCancelOrder } from "@/api/pay";
import { message } from "@repo/utils";

const DetailDialog = defineAsyncComponent(() => import("./detail.vue"));
const detailRef = ref();

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
</script>

<template>
  <div class="main background-color w-full h-full p-1">
    <DetailDialog ref="detailRef" />
    <ScTable ref="tableRef" :rowClick="handleDetail" :url="fetchPageOrder" :params="form" :pageSize="20" :border="false" :stripe="true">
      <el-table-column label="商户名称" prop="payMerchantName" width="100" show-overflow-tooltip>
        <template #default="{ row }">
          <el-tag :title="row.payMerchantCode">{{ row.payMerchantName }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column label="订单编号" prop="payMerchantOrderCode" show-overflow-tooltip min-width="160px">
        <template #default="{ row }">
          <el-tag>{{ row.payMerchantOrderCode }}</el-tag>
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
            {{ row.payMerchantOrderTotalPrice }} | {{ row.payMerchantOrderPrice }}
            <el-icon v-if="row.payMerchantCouponCode" color="red">
              <component :is="useRenderIcon('ri:coupon-2-fill')" />
            </el-icon>
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

      <el-table-column label="创建时间">
        <template #default="{ row }">
          {{ row.createTime }}
        </template>
      </el-table-column>
      <el-table-column label="创建时间">
        <template #default="{ row }">
          <el-button v-if="(row.payMerchantOrderStatus + '')?.startsWith('200')" title="退款" class="btn-text z-[100]" :icon="useRenderIcon('ri:refund-2-line')" @click.stop="handleRefund(row)" />
          <el-button v-if="isCanClose(row)" type="danger" title="关闭" class="btn-text z-[100]" :icon="useRenderIcon('ri:close-circle-fill')" @click.stop="handleCancel(row)" />
        </template>
      </el-table-column>
    </ScTable>
  </div>
</template>
