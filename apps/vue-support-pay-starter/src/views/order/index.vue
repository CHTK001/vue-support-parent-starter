<script setup>
import { fetchPageOrder } from "@/api/order";
import { handleOrigin, handlePayWay, handleStatus, handleStatusType } from "@/utils/pay";
import { defineAsyncComponent, nextTick, reactive, ref } from "vue";

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
</script>

<template>
  <div class="main background-color w-full h-full p-1">
    <DetailDialog ref="detailRef" />
    <ScTable ref="tableRef" :rowClick="handleDetail" :url="fetchPageOrder" :params="form" :pageSize="20" :border="false" :stripe="true">
      <el-table-column label="商户名称" prop="payMerchantName">
        <template #default="{ row }">
          <el-tag :title="row.payMerchantCode">{{ row.payMerchantName }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column label="订单编号" prop="payMerchantOrderCode" show-overflow-tooltip>
        <template #default="{ row }">
          <el-tag>{{ row.payMerchantOrderCode }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column label="商品来源" prop="payMerchantOrderOrigin">
        <template #default="{ row }">
          <el-tag>{{ handleOrigin(row.payMerchantOrderOrigin) }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column label="商品名称" prop="payMerchantOrderProductName" />
      <el-table-column label="支付金额" prop="payMerchantOrderTotalPrice">
        <template #default="{ row }">
          <el-tag type="primary">{{ row.payMerchantOrderTotalPrice }} | {{ row.payMerchantOrderPrice }}</el-tag>
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
    </ScTable>
  </div>
</template>
