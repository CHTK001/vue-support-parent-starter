<script setup>
import { fetchPageOrder, fetchStatisticOrder } from "@/api/order";
import { handleOrigin, handlePayWay, handleStatus, handleStatusType, listOrigin, mapStatus } from "@/utils/pay";
import { useRenderIcon } from "@repo/components/ReIcon/src/hooks";
import { defineAsyncComponent, nextTick, onMounted, reactive, ref } from "vue";
import { fetchRefundOrder, fetchCancelOrder } from "@/api/pay";
import { message } from "@repo/utils";
const ScQuery = defineAsyncComponent(() => import("@repo/components/ScQuery/index.vue"));
const OrderArchive = defineAsyncComponent(() => import("./components/OrderArchive.vue"));

const DetailDialog = defineAsyncComponent(() => import("./detail.vue"));
const WaterDialog = defineAsyncComponent(() => import("./water.vue"));
const detailRef = ref();
const waterRef = ref();
const tableRef = ref();

const total = ref(0);
const statsData = ref({
  totalCount: 0,
  completedCount: 0,
  pendingCount: 0,
  closedCount: 0,
});

const form = reactive({});

// 获取订单统计数据
const getOrderStats = () => {
  fetchStatisticOrder()
    .then((res) => {
      if (res.code === "00000" && res.data) {
        statsData.value = res.data;
        total.value = res.data.totalCount || 0;
      }
    })
    .catch((error) => {
      console.error("获取订单统计数据失败", error);
    });
};

const handleDetail = (row, type) => {
  nextTick(() => {
    detailRef.value.handleOpen(type, row, {
      handlePayWay,
      handleOrigin,
      handleStatus,
      handleStatusType,
    });
  });
};

const handleRefreshSearch = (form) => {
  tableRef.value.reload(form);
  getOrderStats();
};

const handleRefresh = () => {
  tableRef.value.refresh(form);
  getOrderStats();
};

const handleWater = (row, type) => {
  nextTick(() => {
    waterRef.value.handleOpen(type, row, {
      handlePayWay,
      handleOrigin,
      handleStatus,
      handleStatusType,
    });
  });
};

const handleRefund = (row) => {
  fetchRefundOrder({
    payMerchantOrderCode: row.payMerchantOrderCode,
  }).then((res) => {
    if (res.code === "00000") {
      message("退款成功", { type: "success" });
      handleRefresh();
      return;
    }
    message(res.msg, { type: "error" });
  });
};

const handleCancel = (row) => {
  fetchCancelOrder({
    payMerchantOrderCode: row.payMerchantOrderCode,
  }).then((res) => {
    if (res.code === "00000") {
      message("关闭成功", { type: "success" });
      handleRefresh();
      return;
    }
    message(res.msg, { type: "error" });
  });
};

const isCanClose = (row) => {
  return row.payMerchantOrderStatus != "4000" && !row.payMerchantOrderStatus.startsWith("500");
};

const handleDataLoaded = (data, _total) => {
  total.value = _total || 0;
  // 刷新统计数据
  getOrderStats();
};

const columns = [
  {
    label: "支付方式",
    type: "select",
    prop: "payMerchantOrderTradeType",
    selectOption: listOrigin(),
    width: 100,
  },
  {
    label: "订单状态",
    type: "select",
    prop: "payMerchantOrderStatus",
    selectOption: mapStatus(),
    width: 100,
  },
  {
    label: "订单时间",
    type: "dateDayPicker",
    prop: "payMerchantOrderTime",
    width: "auto",
    timeOption: {
      rangeValue: ["startTime", "endTime"],
    },
  },
];

onMounted(() => {
  getOrderStats();
});
</script>

<template>
  <div class="main background-color w-full h-full">
    <DetailDialog ref="detailRef" />
    <WaterDialog ref="waterRef" />

    <!-- 页面标题和搜索区域 -->
    <div class="order-header p-4 mb-4 rounded-lg shadow-sm flex justify-between items-center">
      <div class="header-title">
        <h2 class="text-xl font-bold flex items-center">
          <el-icon class="mr-2"><component :is="useRenderIcon('ri:bill-line')" /></el-icon>
          订单管理
        </h2>
        <p class="text-[var(--el-text-color-regular)] text-sm mt-1">管理和查询支付订单信息</p>
      </div>
      <div class="flex items-center gap-2">
        <el-tooltip content="刷新数据" placement="top">
          <el-button type="info" circle class="refresh-button" :icon="useRenderIcon('ep:refresh')" @click="handleRefresh" />
        </el-tooltip>
      </div>
    </div>

    <!-- 统计卡片区域 -->
    <div class="order-stats grid grid-cols-4 gap-4 mb-4">
      <div class="stat-card bg-white rounded-lg p-4 shadow-sm flex items-center">
        <div class="stat-icon p-3 rounded-lg mr-3 bg-blue-50">
          <el-icon class="text-blue-500 text-xl"><component :is="useRenderIcon('ep:shopping-cart')" /></el-icon>
        </div>
        <div class="stat-info">
          <div class="stat-title text-[var(--el-text-color-regular)] text-sm">订单总数</div>
          <div class="stat-value text-xl font-bold">{{ statsData.totalCount || 0 }}</div>
        </div>
      </div>

      <div class="stat-card bg-white rounded-lg p-4 shadow-sm flex items-center">
        <div class="stat-icon p-3 rounded-lg mr-3 bg-green-50">
          <el-icon class="text-green-500 text-xl"><component :is="useRenderIcon('ep:checked')" /></el-icon>
        </div>
        <div class="stat-info">
          <div class="stat-title text-gray-500 text-sm">已完成订单</div>
          <div class="stat-value text-xl font-bold">{{ statsData.completedCount || 0 }}</div>
        </div>
      </div>

      <div class="stat-card bg-white rounded-lg p-4 shadow-sm flex items-center">
        <div class="stat-icon p-3 rounded-lg mr-3 bg-amber-50">
          <el-icon class="text-amber-500 text-xl"><component :is="useRenderIcon('ri:time-line')" /></el-icon>
        </div>
        <div class="stat-info">
          <div class="stat-title text-gray-500 text-sm">待支付订单</div>
          <div class="stat-value text-xl font-bold">{{ statsData.pendingCount || 0 }}</div>
        </div>
      </div>

      <div class="stat-card bg-white rounded-lg p-4 shadow-sm flex items-center">
        <div class="stat-icon p-3 rounded-lg mr-3 bg-red-50">
          <el-icon class="text-red-500 text-xl"><component :is="useRenderIcon('ri:close-circle-line')" /></el-icon>
        </div>
        <div class="stat-info">
          <div class="stat-title text-gray-500 text-sm">已关闭订单</div>
          <div class="stat-value text-xl font-bold">{{ statsData.closedCount || 0 }}</div>
        </div>
      </div>
    </div>

    <!-- 搜索区域 -->
    <div class="search-container bg-white rounded-lg p-4 mb-4 shadow-sm">
      <ScQuery v-model="form" :columns="columns" @onSearch="handleRefreshSearch" />
    </div>

    <!-- 表格区域 -->
    <div class="order-table-container">
      <ScTable ref="tableRef" class="order-table" height="450px" :rowClick="handleDetail" :url="fetchPageOrder" :params="form" :pageSize="20" :border="false" :stripe="true" @data-loaded="handleDataLoaded">
        <el-table-column label="商户名称" prop="payMerchantName" width="120" show-overflow-tooltip>
          <template #default="{ row }">
            <el-tag effect="plain" class="merchant-tag" :title="row.payMerchantCode">{{ row.payMerchantName }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="订单编号" prop="payMerchantOrderCode" show-overflow-tooltip min-width="160px">
          <template #default="{ row }">
            <el-popover placement="right" trigger="hover" :width="350" popper-class="order-popover">
              <template #reference>
                <div class="flex items-center">
                  <el-tag type="info" effect="plain" v-copy:click.stop="row.payMerchantOrderCode" class="order-code-tag">
                    {{ row.payMerchantOrderCode }}
                  </el-tag>
                  <el-icon class="ml-1 cursor-pointer copy-icon" v-copy:click.stop="row.payMerchantOrderCode">
                    <component :is="useRenderIcon('ep:document-copy')" />
                  </el-icon>
                </div>
              </template>
              <OrderArchive :order="row" />
            </el-popover>
          </template>
        </el-table-column>
        <el-table-column label="商品来源" prop="payMerchantOrderOrigin" width="120" show-overflow-tooltip>
          <template #default="{ row }">
            <el-tag size="small" effect="plain" class="origin-tag">{{ handleOrigin(row.payMerchantOrderOrigin) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="商品名称" prop="payMerchantOrderProductName" min-width="140" show-overflow-tooltip>
          <template #default="{ row }">
            <el-popover placement="right" trigger="hover" :width="350" popper-class="order-popover">
              <template #reference>
                <div class="product-name">{{ row.payMerchantOrderProductName }}</div>
              </template>
              <OrderArchive :order="row" />
            </el-popover>
          </template>
        </el-table-column>
        <el-table-column label="支付金额" prop="payMerchantOrderTotalPrice" width="180" show-overflow-tooltip>
          <template #default="{ row }">
            <div class="flex flex-col gap-1">
              <div class="flex items-center">
                <el-icon v-if="row.payMerchantCouponCode" color="red" class="mr-1">
                  <component :is="useRenderIcon('ri:coupon-2-fill')" />
                </el-icon>
                <span class="price-text">¥ {{ row.payMerchantOrderTotalPrice }}</span>
                <span v-if="row.payMerchantOrderPrice !== row.payMerchantOrderTotalPrice" class="original-price ml-2">¥ {{ row.payMerchantOrderPrice }}</span>
              </div>
              <el-tag size="small" effect="plain" type="info" class="payment-method">{{ handlePayWay(row.payMerchantOrderTradeType) }}</el-tag>
            </div>
          </template>
        </el-table-column>

        <el-table-column label="支付状态" prop="payMerchantOrderStatus" width="120">
          <template #default="{ row }">
            <el-tag :type="handleStatusType(row.payMerchantOrderStatus)" class="status-tag" effect="light">
              <el-icon class="mr-1"><component :is="getStatusIcon(row.payMerchantOrderStatus)" /></el-icon>
              {{ handleStatus(row.payMerchantOrderStatus) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="支付设备" prop="payMerchantOrderBrowserSystem" width="120">
          <template #default="{ row }">
            <div class="flex items-center">
              <el-icon class="mr-1"><component :is="useRenderIcon('ep:monitor')" /></el-icon>
              <span>{{ row.payMerchantOrderBrowserSystem }}</span>
            </div>
          </template>
        </el-table-column>

        <el-table-column label="创建时间" min-width="150" show-overflow-tooltip>
          <template #default="{ row }">
            <div class="flex items-center">
              <el-icon class="mr-1"><component :is="useRenderIcon('ep:calendar')" /></el-icon>
              {{ row.createTime }}
            </div>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="150" fixed="right">
          <template #default="{ row }">
            <div class="flex space-x-2">
              <el-tooltip content="查看详情" placement="top">
                <el-button class="btn-text hover:text-blue-500" :icon="useRenderIcon('ep:view')" @click.stop="handleDetail(row)" />
              </el-tooltip>
              <el-tooltip content="查看流水" placement="top">
                <el-button class="btn-text hover:text-purple-500" :icon="useRenderIcon('ri:stack-line')" @click.stop="handleWater(row)" />
              </el-tooltip>
              <el-tooltip v-if="(row.payMerchantOrderStatus + '')?.startsWith('200')" content="退款" placement="top">
                <el-button class="btn-text hover:text-amber-500" :icon="useRenderIcon('ri:refund-2-line')" @click.stop="handleRefund(row)" />
              </el-tooltip>
              <el-tooltip v-if="isCanClose(row)" content="关闭订单" placement="top">
                <el-button class="btn-text hover:text-red-500" :icon="useRenderIcon('ri:close-circle-fill')" @click.stop="handleCancel(row)" />
              </el-tooltip>
            </div>
          </template>
        </el-table-column>
      </ScTable>
    </div>
  </div>
</template>

<script>
// 获取状态图标
function getStatusIcon(status) {
  if ((status + "").startsWith("100")) {
    return useRenderIcon("ri:time-line");
  } else if ((status + "").startsWith("200")) {
    return useRenderIcon("ep:checked");
  } else if ((status + "").startsWith("300")) {
    return useRenderIcon("ri:error-warning-line");
  } else if (status === "4000" || (status + "").startsWith("500")) {
    return useRenderIcon("ri:close-circle-line");
  }
  return useRenderIcon("ri:question-line");
}
</script>

<style scoped>
.order-header {
  background-color: #fff;
  border-left: 4px solid #4091f7;
  transition: all 0.3s;
  animation: fadeIn 0.5s ease-in-out;
}

.order-header:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.header-title {
  color: var(--el-text-color-primary);
}

.refresh-button {
  transition: all 0.3s;
  border-radius: 4px;
}

.refresh-button:hover {
  transform: translateY(-2px);
  box-shadow: 0 2px 8px rgba(64, 145, 247, 0.3);
  animation: spin 1s ease-in-out;
}

/* 统计卡片样式 */
.order-stats {
  animation: fadeIn 0.8s ease-in-out;
}

.stat-card {
  transition: all 0.3s ease;
  border-left: 3px solid transparent;
}

.stat-card:nth-child(1) {
  border-left-color: #4091f7;
  animation: slideRight 0.5s ease-in-out;
}

.stat-card:nth-child(2) {
  border-left-color: #13ce66;
  animation: slideRight 0.5s ease-in-out 0.1s;
}

.stat-card:nth-child(3) {
  border-left-color: #f59e0b;
  animation: slideRight 0.5s ease-in-out 0.2s;
}

.stat-card:nth-child(4) {
  border-left-color: #f56c6c;
  animation: slideRight 0.5s ease-in-out 0.3s;
}

.stat-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 10px 20px rgba(0, 0, 0, 0.1);
}

.stat-icon {
  transition: all 0.3s;
}

.stat-card:hover .stat-icon {
  transform: scale(1.1);
}

/* 搜索区域样式 */
.search-container {
  animation: slideUp 0.5s ease-in-out;
}

/* 表格容器样式 */
.order-table-container {
  height: calc(100% - 320px);
  animation: slideUp 0.5s ease-in-out 0.2s;
}

.order-table {
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.05);
}

/* 表格内容样式 */
.merchant-tag {
  font-weight: 600;
  transition: all 0.3s;
}

.merchant-tag:hover {
  transform: translateY(-2px);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.order-code-tag {
  font-family: monospace;
  transition: all 0.3s;
}

.copy-icon {
  opacity: 0.7;
  transition: all 0.3s;
}

.copy-icon:hover {
  opacity: 1;
  transform: scale(1.2);
}

.origin-tag {
  transition: all 0.3s;
}

.origin-tag:hover {
  transform: translateY(-2px);
}

.product-name {
  font-weight: 500;
  color: #606266;
}

.price-text {
  font-weight: 600;
  color: #f56c6c;
}

.original-price {
  text-decoration: line-through;
   color: var(--el-text-color-primary);
  font-size: 0.85em;
}

.payment-method {
  font-size: 0.85em;
}

.status-tag {
  font-weight: 600;
  transition: all 0.3s;
}

.status-tag:hover {
  transform: translateY(-2px);
}

/* 订单档案弹窗样式 */
.order-popover {
  padding: 0;
  border-radius: 8px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
  overflow: hidden;
  animation: fadeIn 0.3s ease-in-out;
  transition: all 0.3s ease;
}

:deep(.el-popover.el-popper) {
  transition:
    transform 0.3s ease,
    box-shadow 0.3s ease;
}

:deep(.el-popover.el-popper:hover) {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.15);
}

.order-archive {
  font-size: 14px;
}

.archive-header {
  display: flex;
  align-items: center;
  padding: 12px 15px;
  background-color: #f5f7fa;
  border-bottom: 1px solid #e4e7ed;
  color: var(--el-text-color-primary);
  position: relative;
  overflow: hidden;
}

.archive-header::after {
  content: "";
  position: absolute;
  left: 0;
  bottom: 0;
  width: 100%;
  height: 2px;
  background: linear-gradient(90deg, #4091f7, #13ce66, #f59e0b, #f56c6c);
  transform: translateX(-100%);
  animation: slideRight 1s ease-in-out forwards;
}

.archive-content {
  padding: 12px;
}

.archive-section {
  margin-bottom: 12px;
  background-color: #fff;
  border-radius: 6px;
  overflow: hidden;
  border: 1px solid #ebeef5;
  transition: all 0.3s ease;
  animation: fadeIn 0.5s ease-in-out;
}

.archive-section:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
  border-color: #c0c4cc;
}

.archive-section:nth-child(1) {
  animation-delay: 0.1s;
}

.archive-section:nth-child(2) {
  animation-delay: 0.2s;
}

.archive-section:nth-child(3) {
  animation-delay: 0.3s;
}

.archive-section:last-child {
  margin-bottom: 0;
}

.section-title {
  display: flex;
  align-items: center;
  padding: 8px 12px;
  font-size: 13px;
  font-weight: 600;
  background-color: #f5f7fa;
  border-bottom: 1px solid #ebeef5;
  color: #606266;
  transition: background-color 0.3s ease;
}

.archive-section:hover .section-title {
  background-color: #ecf5ff;
}

.section-content {
  padding: 10px 12px;
}

.info-item {
  display: flex;
  margin-bottom: 6px;
  align-items: center;
  transition: all 0.2s ease;
}

.info-item:hover {
  background-color: #f5f7fa;
  border-radius: 4px;
  padding: 2px 4px;
  margin: 0 -4px 6px -4px;
}

.info-item:last-child {
  margin-bottom: 0;
}

.info-item:last-child:hover {
  margin-bottom: 0;
}

.item-label {
  width: 80px;
   color: var(--el-text-color-primary);
  font-size: 13px;
}

.item-value {
  flex: 1;
  color: var(--el-text-color-primary);
  word-break: break-all;
}

@keyframes slideRight {
  from {
    transform: translateX(-100%);
  }
  to {
    transform: translateX(0);
  }
}

/* 表格行悬停效果 */
:deep(.el-table__row) {
  transition: all 0.3s;
}

:deep(.el-table__row:hover) {
  background-color: #f0f7ff !important;
  transform: translateY(-2px);
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.05);
}

/* 按钮悬停效果 */
:deep(.btn-text) {
  transition: all 0.3s;
}

:deep(.btn-text:hover) {
  transform: scale(1.2);
}

/* 动画关键帧 */
@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

@keyframes slideUp {
  from {
    transform: translateY(20px);
    opacity: 0;
  }
  to {
    transform: translateY(0);
    opacity: 1;
  }
}

@keyframes slideRight {
  from {
    transform: translateX(-20px);
    opacity: 0;
  }
  to {
    transform: translateX(0);
    opacity: 1;
  }
}

@keyframes spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}
</style>
