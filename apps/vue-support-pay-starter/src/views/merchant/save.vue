<template>
  <div>
    <el-dialog v-model="visible" :title="config.title" draggable @close="handleClose" class="merchant-save-dialog" width="600px" top="5vh">
      <template #header>
        <div class="section-title">
          <el-icon class="section-icon"><component :is="useRenderIcon('ri:store-2-fill')" /></el-icon>
          <span>商户基本信息</span>
        </div>
      </template>
      <el-form ref="formRef" :model="form" :rules="rules" label-width="120px" class="merchant-save-form">
        <el-form-item label="商户名称" prop="payMerchantName">
          <el-input v-model="form.payMerchantName" placeholder="请输入商户名称" prefix-icon="ep:shop" />
        </el-form-item>

        <el-form-item label="商户号" prop="payMerchantCode">
          <el-input v-model="form.payMerchantCode" placeholder="请输入商户号" prefix-icon="ep:document" />
        </el-form-item>

        <el-form-item label="开启钱包" prop="payMerchantOpenWallet">
          <div class="wallet-switch-container">
            <el-switch v-model="form.payMerchantOpenWallet" class="wallet-switch" active-color="#13ce66" inactive-color="#ff4949" />
            <el-icon v-if="form.payMerchantOpenWallet" class="wallet-icon wallet-active"><component :is="useRenderIcon('ri:wallet-3-fill')" /></el-icon>
            <el-icon v-else class="wallet-icon wallet-inactive"><component :is="useRenderIcon('ri:wallet-3-line')" /></el-icon>
            <span class="wallet-status">{{ form.payMerchantOpenWallet ? "已开启" : "已关闭" }}</span>
          </div>
        </el-form-item>
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
import { fetchSaveMerchant, fetchUpdateMerchant } from "@/api/merchant";
import { message } from "@repo/utils";
import { defineExpose, reactive, ref } from "vue";
import { useRenderIcon } from "@repo/components/ReIcon/src/hooks";
const config = {
  title: "测试",
  mode: "add",
  confirmLoading: false,
};
const formRef = ref();
const form = reactive({});
const rules = {
  payMerchantName: [{ required: true, message: "请输入商户名称", trigger: "blur" }],
  payMerchantCode: [{ required: true, message: "请输入商户号", trigger: "blur" }],
};

const visible = ref(false);

const handleUpdate = async () => {
  formRef.value.validate(async (valid) => {
    if (valid) {
      config.confirmLoading = true;
      if (config.mode === "add") {
        delete form.payMerchantId;
        fetchSaveMerchant(form)
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

      fetchUpdateMerchant(form)
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
};
const handleOpen = async (mode, data) => {
  visible.value = true;
  config.mode = mode;
  if (mode === "edit") {
    config.title = `修改商户`;
  } else {
    config.title = "添加商户";
  }
  Object.assign(form, data);
};

defineExpose({
  handleOpen,
});
</script>

<style scoped>
.merchant-save-dialog :deep(.el-dialog__header) {
  margin-right: 0;
  text-align: center;
  position: relative;
  border-bottom: 1px solid #f0f0f0;
  background: linear-gradient(135deg, #f8f9fa 0%, #e9f1f6 100%);
}

.merchant-save-dialog :deep(.el-dialog__title) {
  font-size: 18px;
  font-weight: 600;
  color: #303133;
}

.dialog-header-decoration {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 4px;
  background: linear-gradient(90deg, #67c23a, #95d475);
  z-index: 1;
}

.merchant-save-form {
  padding: 20px 10px;
}

.form-section {
  margin-bottom: 24px;
  padding: 16px;
  border-radius: 8px;
  background-color: #f8f9fa;
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
  color: #67c23a;
}

.section-icon {
  margin-right: 8px;
  font-size: 18px;
}

.merchant-save-form :deep(.el-form-item__label) {
  font-weight: 500;
}

.merchant-save-form :deep(.el-input__wrapper) {
  box-shadow: 0 0 0 1px #dcdfe6 inset;
  transition: all 0.2s ease;
}

.merchant-save-form :deep(.el-input__wrapper:hover) {
  box-shadow: 0 0 0 1px #b3e19d inset;
}

.merchant-save-form :deep(.el-input__wrapper.is-focus) {
  box-shadow: 0 0 0 1px #67c23a inset;
}

.wallet-switch-container {
  display: flex;
  align-items: center;
}

.wallet-switch {
  margin-right: 12px;
}

.wallet-icon {
  margin-right: 8px;
  font-size: 18px;
  transition: all 0.3s ease;
}

.wallet-active {
  color: #67c23a;
  transform: scale(1.1);
}

.wallet-inactive {
  color: #909399;
}

.wallet-status {
  font-size: 14px;
  color: #606266;
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
  background: linear-gradient(90deg, #67c23a, #95d475);
  border: none;
}

.confirm-button:hover {
  background: linear-gradient(90deg, #85ce61, #a4da89);
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(103, 194, 58, 0.3);
}
</style>
