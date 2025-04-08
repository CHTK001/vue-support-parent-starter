<template>
  <div class="order-archive">
    <div class="archive-header">
      <el-icon class="mr-2"><component :is="useRenderIcon('ri:file-list-3-line')" /></el-icon>
      <span class="font-bold">订单档案</span>
    </div>
    <div class="archive-content">
      <!-- 基本信息 -->
      <div class="archive-section">
        <div class="section-title">
          <el-icon class="mr-1"><component :is="useRenderIcon('ep:info-filled')" /></el-icon>
          <span>基本信息</span>
        </div>
        <div class="section-content">
          <div class="info-item">
            <span class="item-label">商户名称:</span>
            <span class="item-value">{{ order.payMerchantName }}</span>
          </div>
          <div class="info-item">
            <span class="item-label">订单编号:</span>
            <span class="item-value">{{ order.payMerchantOrderCode }}</span>
          </div>
          <div class="info-item">
            <span class="item-label">商品名称:</span>
            <span class="item-value">{{ order.payMerchantOrderProductName }}</span>
          </div>
          <div class="info-item">
            <span class="item-label">商品来源:</span>
            <el-tag size="small" effect="plain">{{ handleOrigin(order.payMerchantOrderOrigin) }}</el-tag>
          </div>
        </div>
      </div>
      <!-- 支付信息 -->
      <div class="archive-section">
        <div class="section-title">
          <el-icon class="mr-1"><component :is="useRenderIcon('ep:money')" /></el-icon>
          <span>支付信息</span>
        </div>
        <div class="section-content">
          <div class="info-item">
            <span class="item-label">支付金额:</span>
            <span class="item-value price-text">¥ {{ order.payMerchantOrderTotalPrice }}</span>
          </div>
          <div class="info-item" v-if="order.payMerchantOrderPrice !== order.payMerchantOrderTotalPrice">
            <span class="item-label">原始金额:</span>
            <span class="item-value original-price">¥ {{ order.payMerchantOrderPrice }}</span>
          </div>
          <div class="info-item">
            <span class="item-label">支付方式:</span>
            <el-tag size="small" effect="plain" type="info">{{ handlePayWay(order.payMerchantOrderTradeType) }}</el-tag>
          </div>
          <div class="info-item">
            <span class="item-label">支付状态:</span>
            <el-tag :type="handleStatusType(order.payMerchantOrderStatus)" size="small" effect="light">
              {{ handleStatus(order.payMerchantOrderStatus) }}
            </el-tag>
          </div>
        </div>
      </div>
      <!-- 时间信息 -->
      <div class="archive-section">
        <div class="section-title">
          <el-icon class="mr-1"><component :is="useRenderIcon('ep:calendar')" /></el-icon>
          <span>时间信息</span>
        </div>
        <div class="section-content">
          <div class="info-item">
            <span class="item-label">创建时间:</span>
            <span class="item-value">{{ order.createTime }}</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { useRenderIcon } from "@repo/components/ReIcon/src/hooks";
import { handleOrigin, handlePayWay, handleStatus, handleStatusType } from "@/utils/pay";

defineProps({
  order: {
    type: Object,
    required: true,
  },
});
</script>

<style scoped>
.order-archive {
  font-size: 14px;
}

.archive-header {
  display: flex;
  align-items: center;
  padding: 12px 15px;
  background-color: #f5f7fa;
  border-bottom: 1px solid #e4e7ed;
  color: #303133;
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
  color: #909399;
  font-size: 13px;
}

.item-value {
  flex: 1;
  color: #303133;
  word-break: break-all;
}

.price-text {
  font-weight: 600;
  color: #f56c6c;
}

.original-price {
  text-decoration: line-through;
  color: #909399;
  font-size: 0.85em;
}

@keyframes slideRight {
  from {
    transform: translateX(-100%);
  }
  to {
    transform: translateX(0);
  }
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>
