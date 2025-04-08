<template>
  <div>
    <el-dialog v-model="visible" :title="config.title" draggable width="650px" top="5vh" class="order-detail-dialog" @close="handleClose">
      <el-skeleton animated :loading="loading" style="min-height: 400px">
        <template #default>
          <div class="order-detail-container">
            <!-- 订单基本信息卡片 -->
            <div class="detail-card">
              <div class="card-header">
                <el-icon class="header-icon"><component :is="useRenderIcon('ep:shopping-cart')" /></el-icon>
                <span class="header-title">订单基本信息</span>
              </div>
              <div class="card-content">
                <el-descriptions :column="1" border>
                  <el-descriptions-item label="商家">
                    <div class="flex items-center gap-2">
                      <el-text class="merchant-name">{{ form.payMerchantName }}</el-text>
                      <el-tag effect="dark" size="small" class="merchant-tag">{{ form.payMerchantCode }}</el-tag>
                    </div>
                  </el-descriptions-item>

                  <el-descriptions-item label="订单编号">
                    <div class="flex items-center gap-2">
                      <el-text class="order-code">{{ form.payMerchantOrderCode }}</el-text>
                      <span v-copy:click="form.payMerchantOrderCode" class="copy-icon">
                        <el-icon class="cursor-pointer hover:text-blue-500 transition-all">
                          <component :is="useRenderIcon('ep:document-copy')" />
                        </el-icon>
                      </span>
                      <el-tag :type="config.fun.handleStatusType(form.payMerchantOrderStatus)" class="status-tag">
                        {{ config.fun.handleStatus(form.payMerchantOrderStatus) }}
                      </el-tag>
                    </div>
                  </el-descriptions-item>
                </el-descriptions>
              </div>
            </div>

            <!-- 支付信息卡片 -->
            <div class="detail-card">
              <div class="card-header">
                <el-icon class="header-icon"><component :is="useRenderIcon('ep:money')" /></el-icon>
                <span class="header-title">支付信息</span>
              </div>
              <div class="card-content">
                <el-descriptions :column="1" border>
                  <el-descriptions-item label="原始金额">
                    <el-text class="price-text">¥ {{ form.payMerchantOrderPrice }}</el-text>
                  </el-descriptions-item>

                  <el-descriptions-item label="支付金额">
                    <div class="flex items-center gap-2">
                      <el-text class="price-text total-price">¥ {{ form.payMerchantOrderTotalPrice }}</el-text>
                      <el-tag type="info" size="small" class="payment-method-tag">
                        {{ handlePayWay(form.payMerchantOrderTradeType) }}
                      </el-tag>
                    </div>
                  </el-descriptions-item>

                  <el-descriptions-item label="优惠券码">
                    <div class="flex items-center gap-2">
                      <el-text>
                        <template v-if="form.payMerchantCouponCode">
                          <el-icon color="#f56c6c" class="mr-1"><component :is="useRenderIcon('ri:coupon-2-fill')" /></el-icon>
                          {{ form.payMerchantCouponCode }}
                        </template>
                        <template v-else>-</template>
                      </el-text>
                    </div>
                  </el-descriptions-item>
                </el-descriptions>
              </div>
            </div>

            <!-- 用户信息卡片 -->
            <div class="detail-card">
              <div class="card-header">
                <el-icon class="header-icon"><component :is="useRenderIcon('ep:user')" /></el-icon>
                <span class="header-title">用户信息</span>
              </div>
              <div class="card-content">
                <el-descriptions :column="1" border>
                  <el-descriptions-item label="用户编码">
                    <el-text>{{ form.payMerchantOrderUserId }}</el-text>
                  </el-descriptions-item>

                  <el-descriptions-item label="客户端">
                    <div class="flex items-center gap-2">
                      <el-icon class="mr-1"><component :is="useRenderIcon('ep:monitor')" /></el-icon>
                      <el-text>{{ form.payMerchantOrderBrowserSystem }}</el-text>
                    </div>
                  </el-descriptions-item>
                </el-descriptions>
              </div>
            </div>

            <!-- 附加信息卡片 -->
            <div class="detail-card" v-if="handleFormat(form.payMerchantOrderAttach).length > 0">
              <div class="card-header">
                <el-icon class="header-icon"><component :is="useRenderIcon('ep:info-filled')" /></el-icon>
                <span class="header-title">附加信息</span>
              </div>
              <div class="card-content">
                <el-descriptions :column="1" border>
                  <el-descriptions-item v-for="(item, index) in handleFormat(form.payMerchantOrderAttach)" :key="index" :label="item.key || '信息'">
                    <el-text type="info" tag="p" class="attach-info">{{ item.value }}</el-text>
                  </el-descriptions-item>
                </el-descriptions>
              </div>
            </div>
          </div>
        </template>
      </el-skeleton>

      <template #footer>
        <div class="dialog-footer">
          <el-button @click="handleClose" class="cancel-button">关 闭</el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { handlePayWay } from "@/utils/pay";
import { useRenderIcon } from "@repo/components/ReIcon/src/hooks";
import { defineExpose, reactive, ref } from "vue";
const config = {
  title: "测试",
  mode: "add",
  confirmLoading: false,
};
let form = reactive({});

const visible = ref(false);
const loading = ref(false);

const handleFormat = (data) => {
  if (data) {
    try {
      const obj = JSON.parse(data);
      const rs = Object.keys(obj).map((key) => {
        return {
          key,
          value: obj[key],
        };
      });
      return rs;
    } catch (error) {
      return [
        {
          key: "",
          value: data.split("\n"),
        },
      ];
    }
  }
  return [];
};
const handleClose = async () => {
  visible.value = false;
  form = reactive({});
};
const handleOpen = async (mode, data, fun) => {
  visible.value = true;
  loading.value = true;
  config.title = `订单详情 - ${data.payMerchantOrderCode}`;
  config.fun = fun;
  Object.assign(form, data);
  setTimeout(() => {
    loading.value = false;
  }, 300);
};

defineExpose({
  handleOpen,
});
</script>

<style scoped>
.order-detail-dialog :deep(.el-dialog__header) {
  border-bottom: 1px solid #f0f0f0;
  padding-bottom: 15px;
  margin-bottom: 0;
}

.order-detail-dialog :deep(.el-dialog__body) {
  padding: 20px;
}

.order-detail-container {
  display: flex;
  flex-direction: column;
  gap: 20px;
  animation: fadeIn 0.5s ease-in-out;
}

.detail-card {
  border-radius: 8px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.05);
  overflow: hidden;
  transition: all 0.3s;
  animation: slideUp 0.5s ease-in-out;
}

.detail-card:hover {
  box-shadow: 0 4px 16px 0 rgba(0, 0, 0, 0.1);
  transform: translateY(-2px);
}

.card-header {
  background-color: #f5f7fa;
  padding: 12px 15px;
  display: flex;
  align-items: center;
  border-bottom: 1px solid #ebeef5;
}

.header-icon {
  margin-right: 8px;
  font-size: 18px;
  color: #409eff;
}

.header-title {
  font-weight: 600;
  color: #303133;
  font-size: 15px;
}

.card-content {
  padding: 0;
}

:deep(.el-descriptions__label) {
  width: 120px;
  font-weight: 600;
}

.merchant-name {
  font-weight: 600;
}

.merchant-tag {
  background-color: #409eff;
  color: white;
}

.order-code {
  font-family: monospace;
  font-weight: 500;
}

.copy-icon {
  cursor: pointer;
  transition: all 0.3s;
}

.copy-icon:hover {
  transform: scale(1.2);
}

.status-tag {
  font-weight: 600;
}

.price-text {
  font-weight: 600;
  font-size: 15px;
}

.total-price {
  color: #f56c6c;
}

.payment-method-tag {
  font-weight: 500;
}

.attach-info {
  white-space: pre-wrap;
  word-break: break-all;
}

.cancel-button {
  transition: all 0.3s;
}

.cancel-button:hover {
  transform: translateY(-2px);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

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
</style>
