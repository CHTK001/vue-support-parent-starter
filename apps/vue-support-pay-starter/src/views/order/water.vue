<template>
  <div>
    <el-dialog v-model="visible" :title="config.title" draggable width="650px" top="5vh" class="order-water-dialog" @close="handleClose">
      <el-skeleton animated :loading="loading.data" style="min-height: 400px">
        <template #default>
          <div class="water-container">
            <div class="water-header">
              <div class="flex items-center gap-2 mb-4">
                <el-icon class="text-blue-500"><component :is="useRenderIcon('ri:bill-line')" /></el-icon>
                <span class="text-lg font-bold">订单编号: </span>
                <el-tag effect="plain" class="order-code" v-copy:click="form.payMerchantOrderCode">
                  {{ form.payMerchantOrderCode }}
                  <el-icon class="ml-1 cursor-pointer copy-icon">
                    <component :is="useRenderIcon('ep:document-copy')" />
                  </el-icon>
                </el-tag>
              </div>
            </div>

            <div class="water-timeline">
              <el-timeline>
                <el-timeline-item v-for="(item, index) in payMerchantOrderWaterList" :key="index" :type="getTimelineItemType(item.payMerchantOrderStatus)" :icon="getTimelineIcon(item.payMerchantOrderStatus)" :timestamp="item.createTime" :hollow="index !== 0">
                  <div class="water-card">
                    <div class="card-header">
                      <div class="flex justify-between items-center">
                        <div class="flex items-center gap-2">
                          <span class="font-bold">流水单号:</span>
                          <el-tag effect="plain" size="small" class="water-code">{{ item.payMerchantOrderWaterCode }}</el-tag>
                        </div>
                        <el-tag :type="config.fun.handleStatusType(item.payMerchantOrderStatus)" size="small" class="status-tag">
                          {{ config.fun.handleStatus(item.payMerchantOrderStatus) }}
                        </el-tag>
                      </div>
                    </div>

                    <div class="card-content">
                      <div class="grid grid-cols-2 gap-4">
                        <div class="info-item">
                          <div class="info-label">钱包余额</div>
                          <div class="info-value">
                            <el-icon class="mr-1"><component :is="useRenderIcon('ri:wallet-3-fill')" /></el-icon>
                            {{ item.payMerchantOrderWallet || "-" }}
                          </div>
                        </div>

                        <div class="info-item">
                          <div class="info-label">状态变更</div>
                          <div class="info-value">
                            <el-icon class="mr-1"><component :is="getStatusIcon(item.payMerchantOrderStatus)" /></el-icon>
                            {{ config.fun.handleStatus(item.payMerchantOrderStatus) }}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </el-timeline-item>

                <el-timeline-item v-if="payMerchantOrderWaterList.length === 0" type="primary">
                  <div class="empty-water">
                    <el-empty description="暂无流水记录" />
                  </div>
                </el-timeline-item>
              </el-timeline>
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
import { fetchPageOrderWater } from "@/api/order";
const config = {
  title: "测试",
  mode: "add",
  confirmLoading: false,
};
let form = reactive({});

const visible = ref(false);
const payMerchantOrderWaterList = ref([]);
const loading = reactive({
  data: false,
});

// 获取时间线项目类型
const getTimelineItemType = (status) => {
  if ((status + "").startsWith("200")) {
    return "success";
  } else if ((status + "").startsWith("100")) {
    return "primary";
  } else if ((status + "").startsWith("300")) {
    return "warning";
  } else if (status === "4000" || (status + "").startsWith("500")) {
    return "danger";
  }
  return "info";
};

// 获取时间线图标
const getTimelineIcon = (status) => {
  if ((status + "").startsWith("200")) {
    return "ep:checked";
  } else if ((status + "").startsWith("100")) {
    return "ri:time-line";
  } else if ((status + "").startsWith("300")) {
    return "ri:error-warning-line";
  } else if (status === "4000" || (status + "").startsWith("500")) {
    return "ri:close-circle-line";
  }
  return "ri:question-line";
};

// 获取状态图标
const getStatusIcon = (status) => {
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
};

const handleClose = async () => {
  visible.value = false;
  loading.data = false;
  form = reactive({});
};

const handleOpen = async (mode, data, fun) => {
  visible.value = true;
  config.title = `订单流水 - ${data.payMerchantOrderCode}`;
  config.fun = fun;
  Object.assign(form, data);
  loading.data = true;
  fetchPageOrderWater({ payMerchantOrderCode: data.payMerchantOrderCode })
    .then((res) => {
      if (res.code === "00000") {
        payMerchantOrderWaterList.value = Object.freeze(res.data);
        return;
      }
    })
    .finally(() => {
      loading.data = false;
    });
};

defineExpose({
  handleOpen,
});
</script>

<style scoped>
.order-water-dialog :deep(.el-dialog__header) {
  border-bottom: 1px solid #f0f0f0;
  padding-bottom: 15px;
  margin-bottom: 0;
}

.order-water-dialog :deep(.el-dialog__body) {
  padding: 20px;
}

.water-container {
  animation: fadeIn 0.5s ease-in-out;
}

.water-header {
  padding-bottom: 10px;
  border-bottom: 1px dashed #e0e0e0;
  margin-bottom: 20px;
}

.order-code {
  font-family: monospace;
  font-weight: 500;
  transition: all 0.3s;
}

.order-code:hover {
  transform: translateY(-2px);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.copy-icon {
  transition: all 0.3s;
}

.copy-icon:hover {
  transform: scale(1.2);
}

.water-timeline {
  padding: 0 10px;
  max-height: 60vh;
  overflow-y: auto;
}

.water-timeline::-webkit-scrollbar {
  width: 6px;
}

.water-timeline::-webkit-scrollbar-thumb {
  background-color: #dcdfe6;
  border-radius: 3px;
}

.water-timeline::-webkit-scrollbar-track {
  background-color: #f5f7fa;
}

.water-card {
  background-color: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.05);
  padding: 15px;
  transition: all 0.3s;
  animation: slideRight 0.5s ease-in-out;
}

.water-card:hover {
  box-shadow: 0 4px 16px 0 rgba(0, 0, 0, 0.1);
  transform: translateY(-2px);
}

.card-header {
  margin-bottom: 15px;
}

.water-code {
  font-family: monospace;
}

.status-tag {
  font-weight: 600;
}

.card-content {
  padding: 0 5px;
}

.info-item {
  margin-bottom: 10px;
}

.info-label {
  font-size: 13px;
  color: #909399;
  margin-bottom: 5px;
}

.info-value {
  font-weight: 500;
  display: flex;
  align-items: center;
}

.empty-water {
  padding: 20px 0;
  text-align: center;
}

.cancel-button {
  transition: all 0.3s;
}

.cancel-button:hover {
  transform: translateY(-2px);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
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
</style>
