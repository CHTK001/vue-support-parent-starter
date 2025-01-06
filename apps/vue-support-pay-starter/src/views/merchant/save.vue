<template>
  <div>
    <el-dialog v-model="visible" :title="config.title" draggable>
      <el-form ref="formRef" :form="form" :rules="rules" label-width="120px">
        <el-form-item label="商户名称" prop="payMerchantName">
          <el-input v-model="form.payMerchantName" placeholder="请输入商户名称" />
        </el-form-item>

        <el-form-item label="商户号" prop="payMerchantCode">
          <el-input v-model="form.payMerchantCode" placeholder="请输入商户号" />
        </el-form-item>

        <el-form-item label="开启钱包" prop="payMerchantOpenWallet">
          <el-switch v-model="form.payMerchantOpenWallet" />
        </el-form-item>
      </el-form>
      <template #footer>
        <div class="dialog-footer">
          <el-button @click="handleClose">取 消</el-button>
          <el-button type="primary" :loading="config.confirmLoading" @click="handleUpdate">确 定</el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { fetchSaveMerchant, fetchUpdateMerchant } from "@/api/merchant";
import { message } from "@repo/utils";
import { defineExpose, reactive, ref } from "vue";
const config = {
  title: "测试",
  mode: "add",
  confirmLoading: false
};
const formRef = ref();
const form = reactive({});
const rules = {
  payMerchantName: [{ required: true, message: "请输入商户名称", trigger: "blur" }],
  payMerchantCode: [{ required: true, message: "请输入商户号", trigger: "blur" }]
};

const visible = ref(false);

const handleUpdate = async () => {
  formRef.value.validate(async valid => {
    if (valid) {
      config.confirmLoading = true;
      if (config.mode === "add") {
        fetchSaveMerchant(form)
          .then(res => {
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
        .then(res => {
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
  handleOpen
});
</script>
