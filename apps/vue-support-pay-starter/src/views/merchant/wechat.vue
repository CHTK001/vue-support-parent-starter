<template>
  <div>
    <el-dialog v-model="visible" :title="config.title" draggable @close="handleClose" class="wechat-config-dialog" width="650px" top="5vh">
      <!-- 测试支付二维码弹窗 -->
      <el-dialog v-model="qrCodeVisible" title="测试支付二维码" width="400px" append-to-body center>
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
      <div class="dialog-header-decoration"></div>
      <el-form ref="formRef" :model="form" :rules="rules" label-width="120px" class="wechat-config-form">
        <div class="form-section">
          <div class="section-title">
            <el-icon class="section-icon"><component :is="useRenderIcon('simple-icons:wechat')" /></el-icon>
            <span>微信支付基础配置</span>
          </div>
          <el-form-item label="AppId" prop="payMerchantConfigWechatAppId">
            <el-input v-model="form.payMerchantConfigWechatAppId" placeholder="请输入AppId" type="password" show-password prefix-icon="ep:key" />
          </el-form-item>
          <el-form-item label="appSercret" prop="payMerchantConfigWechatAppSecret">
            <el-input v-model="form.payMerchantConfigWechatAppSecret" placeholder="请输入appSercret" type="password" show-password prefix-icon="ep:lock" />
          </el-form-item>
          <el-form-item label="mchId" prop="payMerchantConfigWechatMchId">
            <el-input v-model="form.payMerchantConfigWechatMchId" placeholder="请输入MchId" type="password" show-password prefix-icon="ep:user" />
          </el-form-item>
          <el-form-item label="serialNo" prop="payMerchantConfigWechatMchSerialNo">
            <el-input v-model="form.payMerchantConfigWechatMchSerialNo" placeholder="请输入serialNo" type="password" show-password prefix-icon="ep:document" />
          </el-form-item>
        </div>

        <div class="form-section">
          <div class="section-title">
            <el-icon class="section-icon"><component :is="useRenderIcon('ep:setting')" /></el-icon>
            <span>安全与证书配置</span>
          </div>
          <el-form-item label="ApiKeyV3" prop="payMerchantConfigWechatApiKeyV3">
            <el-input v-model="form.payMerchantConfigWechatApiKeyV3" placeholder="请输入ApiKeyV3" type="password" show-password prefix-icon="ep:key" />
          </el-form-item>
          <el-form-item label="证书地址" prop="payMerchantConfigWechatPrivateKeyPath">
            <el-input v-model="form.payMerchantConfigWechatPrivateKeyPath" placeholder="请输入Pem文件地址" prefix-icon="ep:folder" />
          </el-form-item>
          <el-form-item label="订单回调地址" prop="payMerchantConfigWechatNotifyUrl">
            <el-input v-model="form.payMerchantConfigWechatNotifyUrl" placeholder="请输入订单回调地址" prefix-icon="ep:link" />
          </el-form-item>
          <el-form-item label="是否开启" prop="payMerchantConfigStatus">
            <el-segmented
              v-model="form.payMerchantConfigStatus"
              :options="[
                {
                  value: 1,
                  label: '开启',
                },
                {
                  value: 0,
                  label: '关闭',
                },
              ]"
            ></el-segmented>
          </el-form-item>
        </div>
      </el-form>
      <template #footer>
        <div class="dialog-footer">
          <el-button @click="handleClose" class="cancel-button" plain>
            <el-icon class="mr-1"><component :is="useRenderIcon('ep:close')" /></el-icon>取 消
          </el-button>
          <el-button type="primary" :loading="config.confirmLoading" @click="handleUpdate" class="confirm-button">
            <el-icon class="mr-1"><component :is="useRenderIcon('ep:check')" /></el-icon>确 定
          </el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { fetchSaveMerchantWechat, fetchUpdateMerchantWechat, fetchGenerateTestQrCode } from "@/api/wechat";
import { message } from "@repo/utils";
import { defineExpose, reactive, ref } from "vue";
import { useRenderIcon } from "@repo/components/ReIcon/src/hooks";
const config = {
  title: "测试",
  mode: "add",
  confirmLoading: false,
};
const formRef = ref();
let form = reactive({});
const rules = {
  payMerchantConfigWechatAppId: [{ required: true, message: "请输入AppId", trigger: "blur" }],
  payMerchantConfigWechatAppSecret: [{ required: true, message: "请输入appSercret", trigger: "blur" }],
  payMerchantConfigWechatMchId: [{ required: true, message: "请输入MchId", trigger: "blur" }],
  payMerchantConfigWechatMchSerialNo: [{ required: true, message: "请输入serialNo", trigger: "blur" }],
  payMerchantConfigWechatApiKeyV3: [{ required: true, message: "请输入ApiKeyV3", trigger: "blur" }],
  payMerchantConfigWechatPrivateKeyPath: [{ required: true, message: "请输入证书地址", trigger: "blur" }],
  payMerchantConfigStatus: [{ required: true, message: "请选择是否开启", trigger: "blur" }],
  payMerchantConfigWechatNotifyUrl: [{ required: true, message: "请输入回调地址" }],
};

const visible = ref(false);
const qrCodeVisible = ref(false);
const qrCodeLoading = ref(false);
const qrCodeUrl = ref("");
const isFormValid = ref(false);

// 验证表单是否有效
const validateForm = () => {
  return new Promise((resolve) => {
    formRef.value.validate((valid) => {
      isFormValid.value = valid;
      resolve(valid);
    });
  });
};

const handleUpdate = async () => {
  formRef.value.validate(async (valid) => {
    if (valid) {
      config.confirmLoading = true;
      if (config.mode === "add") {
        fetchSaveMerchantWechat(form)
          .then((res) => {
            if (res.code == "00000") {
              message("保存成功", { type: "success" });
              handleClose();
            }
          })
          .finally(() => {
            config.confirmLoading = false;
          });
        return;
      }

      fetchUpdateMerchantWechat(form)
        .then((res) => {
          if (res.code == "00000") {
            message("修改成功", { type: "success" });
            handleClose();
          }
        })
        .finally(() => {
          config.confirmLoading = false;
        });
    }
  });
};

const handleClose = async () => {
  visible.value = false;
  qrCodeVisible.value = false;
  qrCodeUrl.value = "";
  form = reactive({});
  formRef.value.resetFields();
  isFormValid.value = false;
};
const handleOpen = async (mode, data) => {
  visible.value = true;
  config.mode = mode;
  if (mode === "edit") {
    config.title = `修改微信支付配置${data.title}`;
  } else {
    config.title = `添加微信支付配置${data.title}`;
    data.payMerchantConfigWechatTradeType = data.type;
  }
  Object.assign(form, data.data);
};

defineExpose({
  handleOpen,
});
</script>

<style scoped>
.wechat-config-dialog :deep(.el-dialog__header) {
  padding: 20px;
  margin-right: 0;
  text-align: center;
  position: relative;
  border-bottom: 1px solid var(--el-border-color);
  background: linear-gradient(135deg, #f8f9fa 0%, #e9f1f6 100%);
}

.wechat-config-dialog :deep(.el-dialog__title) {
  font-size: 18px;
  font-weight: 600;
  color: var(--el-text-color-primary);
}

.dialog-header-decoration {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 4px;
  background: linear-gradient(90deg, #1989fa, #5cadff);
  z-index: 1;
}

.wechat-config-form {
  padding: 20px 10px;
}

.form-section {
  margin-bottom: 24px;
  padding: 16px;
  border-radius: 8px;
  background: var(--el-bg-color-overlay);
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.05);
  transition: all 0.3s ease;
}

.form-section:hover {
  box-shadow: 0 4px 16px 0 rgba(0, 0, 0, 0.1);
  transform: translateY(-2px);
}

.section-title {
  display: flex;
  align-items: center;
  margin-bottom: 16px;
  padding-bottom: 8px;
  border-bottom: 1px dashed #e0e0e0;
  font-size: 16px;
  font-weight: 600;
  color: #409eff;
}

.section-icon {
  margin-right: 8px;
  font-size: 18px;
}

.wechat-config-form :deep(.el-form-item__label) {
  font-weight: 500;
}

.wechat-config-form :deep(.el-input__wrapper) {
  box-shadow: 0 0 0 1px #dcdfe6 inset;
  transition: all 0.2s ease;
}

.wechat-config-form :deep(.el-input__wrapper:hover) {
  box-shadow: 0 0 0 1px #a0cfff inset;
}

.wechat-config-form :deep(.el-input__wrapper.is-focus) {
  box-shadow: 0 0 0 1px #409eff inset;
}

.status-radio-group {
  display: flex;
}

.status-radio {
  transition: all 0.3s ease;
}

.status-active :deep(.el-radio-button__inner) {
  background-color: #67c23a;
  border-color: #67c23a;
  color: var(--el-text-color-primary);
  box-shadow: none;
}

.status-inactive :deep(.el-radio-button__inner) {
  background-color: #f56c6c;
  border-color: #f56c6c;
  color: var(--el-text-color-primary);
  box-shadow: none;
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  padding-top: 16px;
}

.cancel-button,
.confirm-button {
  padding: 10px 20px;
  display: flex;
  align-items: center;
  transition: all 0.3s ease;
}

.cancel-button:hover {
  color: #f56c6c;
  border-color: #f56c6c;
}

.confirm-button {
  background: linear-gradient(90deg, #409eff, #5cadff);
  border: none;
}

.confirm-button:hover {
  background: linear-gradient(90deg, #66b1ff, #79bbff);
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(64, 158, 255, 0.3);
}
.test-button {
  padding: 10px 20px;
  display: flex;
  align-items: center;
  transition: all 0.3s ease;
  margin-right: 10px;
  background: linear-gradient(90deg, #e6a23c, #f0c78a);
  border: none;
  color: var(--el-text-color-primary);
}

.test-button:hover:not(:disabled) {
  background: linear-gradient(90deg, #f0b14f, #f8d89d);
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(230, 162, 60, 0.3);
}

.test-button:disabled {
  background: var(--el-bg-color-overlay);
  color: #c0c4cc;
  cursor: not-allowed;
  border: 1px solid #e4e7ed;
}

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
   color: var(--el-text-color-primary);
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
  background-color: var(--el-bg-color-overlay);
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
