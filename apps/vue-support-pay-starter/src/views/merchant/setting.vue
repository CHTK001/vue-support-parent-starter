<template>
  <div>
    <el-drawer v-model="visible" :title="config.title" size="80%" @close="handleClose" class="merchant-setting-drawer" :show-close="true" direction="rtl">
      <!-- 测试支付二维码弹窗 -->
      <el-dialog v-model="qrCodeVisible" title="测试支付二维码" width="400px" append-to-body center @close="handleCloseQrCode">
        <div class="qrcode-container">
          <div v-if="qrCodeLoading" class="qrcode-loading">
            <el-icon class="loading-icon"><component :is="useRenderIcon('ep:loading')" /></el-icon>
            <span>二维码生成中...</span>
          </div>
          <div v-else-if="qrCodeUrl" class="qrcode-content">
            <img :src="qrCodeUrl" alt="支付二维码" class="qrcode-image" />
            <p class="qrcode-tip">请使用微信扫描二维码进行测试支付</p>
          </div>
          <div v-else class="qrcode-error">
            <el-icon class="error-icon"><component :is="useRenderIcon('ep:warning')" /></el-icon>
            <span>二维码生成失败，请重试</span>
          </div>
        </div>
      </el-dialog>

      <div class="drawer-header-decoration"></div>
      <div class="merchant-setting-container">
        <div class="setting-header">
          <div class="setting-title">
            <el-icon class="title-icon"><component :is="useRenderIcon('ri:settings-2-line')" /></el-icon>
            <span>支付配置</span>
          </div>
          <div class="setting-description">请选择需要配置的支付方式</div>
        </div>
        <ScTable layout="card" :data="config.configList" class="setting-article" @row-click="handleRowClick">
          <template #default="{ row }">
            <el-card shadow="hover" class="payment-card">
              <template #header>
                <div class="card-header">
                  <div class="card-title">
                    <el-icon class="card-icon"><component :is="row.homeImg" /></el-icon>
                    <span>{{ row.title }}</span>
                  </div>
                  <el-tag :type="row.data?.payMerchantConfigStatus === 1 ? 'success' : 'info'" size="small" effect="light">
                    {{ row.data?.payMerchantConfigStatus === 1 ? "已启用" : "未启用" }}
                  </el-tag>
                </div>
              </template>
              <div class="card-content">
                <div class="card-info">
                  <div class="info-item">
                    <span class="info-label">支付类型：</span>
                    <span class="info-value">{{ row.typeName }}</span>
                  </div>
                  <div class="info-item">
                    <span class="info-label">交易类型：</span>
                    <span class="info-value">{{ row.type }}</span>
                  </div>
                  <div class="info-item">
                    <span class="info-label">创建时间：</span>
                    <span class="info-value">{{ new Date(row.createTime).toLocaleDateString() }}</span>
                  </div>
                </div>
                <div class="card-actions">
                  <el-button type="warning" size="small" plain @click.stop="handleTestPayment(row)" :disabled="!row.data?.payMerchantConfigWechatId">
                    <el-icon><component :is="useRenderIcon('ep:monitor')" /></el-icon>
                    <span>测试</span>
                  </el-button>
                  <el-button type="primary" size="small" plain @click.stop="handleRowClick(row)">
                    <el-icon><component :is="useRenderIcon('ep:edit')" /></el-icon>
                    <span>{{ row.data?.payMerchantConfigWechatId ? "编辑" : "配置" }}</span>
                  </el-button>
                </div>
              </div>
            </el-card>
          </template>
        </ScTable>
      </div>
    </el-drawer>
    <Wechat ref="wechatRef" />
  </div>
</template>
<script setup>
import { fetchListMerchantWechat, fetchGenerateTestQrCode } from "@/api/wechat";
import { useRenderIcon } from "@repo/components/ReIcon/src/hooks";
import { reactive, defineAsyncComponent, defineExpose, nextTick, ref } from "vue";
import { message } from "@repo/utils";
import { handleToTradeType } from "@/utils/pay";
const Wechat = defineAsyncComponent(() => import("./wechat.vue"));

const wechat = ref();
const wechatRef = ref();
const qrCodeVisible = ref(false);
const qrCodeLoading = ref(false);
const qrCodeUrl = ref("");
const configListDefault = {
  js_api: {
    id: 1,
    title: "微信小程序",
    type: "js_api",
    createTime: "2024-08-26T00:00:00.000Z",
    homeImg: useRenderIcon("simple-icons:wechat"),
    typeName: "微信",
  },
  h5: {
    id: 2,
    title: "微信H5",
    type: "h5",
    createTime: "2024-08-26T00:00:00.000Z",
    homeImg: useRenderIcon("simple-icons:wechat"),
    typeName: "微信",
  },
  native: {
    id: 3,
    title: "微信支付",
    type: "native",
    createTime: "2024-08-26T00:00:00.000Z",
    homeImg: useRenderIcon("simple-icons:wechat"),
    typeName: "微信",
  },
};
const config = reactive({
  title: "",
  data: {},
  configList: Object.values(configListDefault),
});
const visible = ref(false);

const handleClose = async () => {
  visible.value = false;
  config.data = {};
};
const handleOpen = async (data) => {
  config.data = data;
  visible.value = true;
  await handleSearchWechat(data);
  await handleRenderWechat();
};

const handleRowClick = async (data) => {
  nextTick(() => {
    wechatRef.value.handleOpen(data?.data?.payMerchantConfigWechatId ? "edit" : "add", data);
  });
};
const handleCloseQrCode = async () => {
  qrCodeVisible.value = false;
  qrCodeLoading.value = true;
  URL.revokeObjectURL(qrCodeUrl.value); // 释放ObjectURL
  qrCodeUrl.value = "";
};
const handleTestPayment = async (row) => {
  // 检查是否已配置
  if (!row.data?.payMerchantConfigWechatId) {
    message("请先完成支付配置", { type: "warning" });
    return;
  }

  qrCodeLoading.value = true;
  qrCodeUrl.value = "";
  qrCodeVisible.value = true;

  const params = {
    merchantCode: config.data.payMerchantCode,
    price: 0.01, // 测试金额，1分钱
    tradeType: handleToTradeType(row.data.payMerchantConfigWechatTradeType),
  };
  fetchGenerateTestQrCode(params)
    .then((res) => {
      qrCodeUrl.value = URL.createObjectURL(res.data);
    })
    .catch((error) => {
      console.error("生成测试支付二维码失败:", error);
      message("生成二维码失败，请检查配置信息", { type: "error" });
    })
    .finally(() => {
      qrCodeLoading.value = false;
    });
};

const handleRenderWechat = async () => {
  config.configList.forEach((ele) => {
    let value = wechat.value.find((item) => {
      return item.payMerchantConfigWechatTradeType === ele.type;
    });
    if (value) {
      ele.data = value;
      return;
    }
    ele.data = {
      payMerchantId: config.data.payMerchantId,
    };
  });
};
const handleSearchWechat = async (condition) => {
  const { data } = await fetchListMerchantWechat(condition);
  const temp = [];
  data.forEach((element) => {
    temp.push({
      payMerchantConfigStatus: element.payMerchantConfigStatus,
      payMerchantConfigWechatApiKeyV3: element.payMerchantConfigWechatApiKeyV3,
      payMerchantConfigWechatId: element.payMerchantConfigWechatId,
      payMerchantConfigWechatMchId: element.payMerchantConfigWechatMchId,
      payMerchantConfigWechatAppId: element.payMerchantConfigWechatAppId,
      payMerchantConfigWechatId: element.payMerchantConfigWechatId,
      payMerchantConfigWechatMchSerialNo: element.payMerchantConfigWechatMchSerialNo,
      payMerchantConfigWechatAppSecret: element.payMerchantConfigWechatAppSecret,
      payMerchantConfigWechatTradeType: element.payMerchantConfigWechatTradeType,
      payMerchantConfigWechatNotifyUrl: element.payMerchantConfigWechatNotifyUrl,
      payMerchantConfigWechatPrivateKeyPath: element.payMerchantConfigWechatPrivateKeyPath,
      payMerchantConfigStatus: element.payMerchantConfigStatus,
      payMerchantId: config.data.payMerchantId,
    });
  });
  wechat.value = temp;
};

defineExpose({ handleOpen });
</script>

<style scoped>
.merchant-setting-drawer :deep(.el-drawer__header) {
  padding: 20px;
  margin-right: 0;
  text-align: center;
  position: relative;
  border-bottom: 1px solid #f0f0f0;
  background: linear-gradient(135deg, #f8f9fa 0%, #e9f1f6 100%);
}

.merchant-setting-drawer :deep(.el-drawer__title) {
  font-size: 20px;
  font-weight: 600;
  color: #303133;
}

.drawer-header-decoration {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 4px;
  background: linear-gradient(90deg, #9254de, #b37feb);
  z-index: 1;
}

.merchant-setting-container {
  padding: 20px;
  height: 100%;
  display: flex;
  flex-direction: column;
}

.setting-header {
  margin-bottom: 24px;
  padding: 16px;
  border-radius: 8px;
  background-color: #f8f9fa;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.05);
  transition: all 0.3s ease;
}

.setting-header:hover {
  box-shadow: 0 4px 16px 0 rgba(0, 0, 0, 0.1);
  transform: translateY(-2px);
}

.setting-title {
  display: flex;
  align-items: center;
  margin-bottom: 8px;
  font-size: 18px;
  font-weight: 600;
  color: #9254de;
}

.title-icon {
  margin-right: 8px;
  font-size: 20px;
}

.setting-description {
  color: #606266;
  font-size: 14px;
  margin-left: 28px;
}

.setting-article {
  flex: 1;
}

.setting-article :deep(.el-card) {
  transition: all 0.3s ease;
  border-radius: 8px;
  overflow: hidden;
  border: none;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.05);
}

.setting-article :deep(.el-card:hover) {
  transform: translateY(-5px);
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.1);
}

.setting-article :deep(.el-card__header) {
  background: linear-gradient(135deg, #f8f9fa 0%, #e9f1f6 100%);
  border-bottom: 1px solid #f0f0f0;
  padding: 15px 20px;
}

.setting-article :deep(.el-card__body) {
  padding: 20px;
}

.setting-article :deep(.el-button) {
  transition: all 0.3s ease;
}

.setting-article :deep(.el-button:hover) {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(146, 84, 222, 0.2);
}

/* 支付卡片样式 */
.payment-card {
  height: 100%;
  transition: all 0.3s ease;
}

.payment-card:hover {
  transform: translateY(-5px);
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.card-title {
  display: flex;
  align-items: center;
  font-size: 16px;
  font-weight: 600;
  color: #303133;
}

.card-icon {
  margin-right: 8px;
  font-size: 18px;
  color: #9254de;
}

.card-content {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.card-info {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.info-item {
  display: flex;
  align-items: center;
  font-size: 14px;
  line-height: 1.5;
}

.info-label {
  color: #909399;
  margin-right: 4px;
}

.info-value {
  color: #606266;
  font-weight: 500;
}

.card-actions {
  display: flex;
  justify-content: flex-end;
  margin-top: 8px;
  gap: 8px;
}

/* 二维码弹窗样式 */
.qrcode-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 20px;
  min-height: 250px;
}

.qrcode-loading {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: #909399;
}

.loading-icon {
  font-size: 40px;
  margin-bottom: 16px;
  animation: spin 1.5s linear infinite;
}

@keyframes spin {
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
}

.qrcode-content {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.qrcode-image {
  max-width: 200px;
  max-height: 200px;
  border: 1px solid #ebeef5;
  border-radius: 4px;
  padding: 8px;
  background-color: white;
}

.qrcode-tip {
  margin-top: 16px;
  color: #606266;
  font-size: 14px;
}

.qrcode-error {
  display: flex;
  flex-direction: column;
  align-items: center;
  color: #f56c6c;
}

.error-icon {
  font-size: 40px;
  margin-bottom: 16px;
}
</style>
