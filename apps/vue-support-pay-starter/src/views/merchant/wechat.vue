<template>
  <div>
    <el-dialog v-model="visible" :title="config.title" draggable @close="handleClose">
      <el-form ref="formRef" :model="form" :rules="rules" label-width="120px">
        <el-form-item label="AppId" prop="payMerchantConfigWechatAppId">
          <el-input v-model="form.payMerchantConfigWechatAppId" placeholder="请输入AppId" type="password" show-password />
        </el-form-item>
        <el-form-item label="appSercret" prop="payMerchantConfigWechatAppSecret">
          <el-input v-model="form.payMerchantConfigWechatAppSecret" placeholder="请输入appSercret" type="password" show-password />
        </el-form-item>
        <el-form-item label="mchId" prop="payMerchantConfigWechatMchId">
          <el-input v-model="form.payMerchantConfigWechatMchId" placeholder="请输入MchId" type="password" show-password />
        </el-form-item>
        <el-form-item label="serialNo" prop="payMerchantConfigWechatMchSerialNo">
          <el-input v-model="form.payMerchantConfigWechatMchSerialNo" placeholder="请输入serialNo" type="password" show-password />
        </el-form-item>
        <el-form-item label="ApiKeyV3" prop="payMerchantConfigWechatApiKeyV3">
          <el-input v-model="form.payMerchantConfigWechatApiKeyV3" placeholder="请输入ApiKeyV3" type="password" show-password />
        </el-form-item>
        <el-form-item label="证书地址" prop="payMerchantConfigWechatPrivateKeyPath">
          <el-input v-model="form.payMerchantConfigWechatPrivateKeyPath" placeholder="请输入Pem文件地址" />
        </el-form-item>
        <el-form-item label="是否开启" prop="payMerchantConfigStatus">
          <el-radio-group v-model="form.payMerchantConfigStatus">
            <el-radio-button :value="1" label="开启" />
            <el-radio-button :value="0" label="关闭" />
          </el-radio-group>
        </el-form-item>
        <el-form-item label="订单回调地址" prop="payMerchantConfigWechatNotifyUrl">
          <el-input v-model="form.payMerchantConfigWechatNotifyUrl" placeholder="请输入订单回调地址" />
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
import { fetchSaveMerchantWechat, fetchUpdateMerchantWechat } from "@/api/wechat";
import { message } from "@repo/utils";
import { defineExpose, reactive, ref } from "vue";
const config = {
  title: "测试",
  mode: "add",
  confirmLoading: false
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
  payMerchantConfigWechatNotifyUrl: [{ required: true, message: "请输入回调地址" }]
};

const visible = ref(false);

const handleUpdate = async () => {
  formRef.value.validate(async valid => {
    if (valid) {
      config.confirmLoading = true;
      if (config.mode === "add") {
        fetchSaveMerchantWechat(form)
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

      fetchUpdateMerchantWechat(form)
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
  form = reactive({});
  formRef.value.resetFields();
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
  handleOpen
});
</script>
