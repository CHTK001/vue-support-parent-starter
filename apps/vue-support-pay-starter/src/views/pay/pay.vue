<template>
  <div>
    <el-dialog v-model="visible" title="支付" width="600px" :close-on-click-modal="false" draggable @close="handleClose">
      <el-form :model="form">
        <el-form-item label="商户名称" prop="merchantName">
          <el-input v-model="form.payMerchantName" disabled />
        </el-form-item>

        <el-form-item label="商户编码" prop="merchantCode">
          <el-input v-model="form.payMerchantCode" disabled />
        </el-form-item>

        <el-form-item label="支付来源" prop="origin">
          <el-input v-model="form.origin" placeholder="请输入支付来源" />
        </el-form-item>

        <el-form-item label="商品名称" prop="produceName">
          <el-input v-model="form.produceName" placeholder="请输入商品名称" />
        </el-form-item>

        <el-form-item label="支付金额" prop="totalPrice">
          <el-input v-model="form.totalPrice" min="0" placeholder="请输入支付金额" type="number" />
          <span>原始金额: {{ form.price }}</span>
        </el-form-item>
      </el-form>

      <template #footer>
        <div class="dialog-footer">
          <el-button @click="handleClose">取 消</el-button>
          <el-button type="primary" @click="handleOk">确 定</el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>
<script setup>
import { fetchCreateOrder } from "@/api/pay";
import { message } from "@repo/utils";
import { ref, defineExpose, reactive, watch } from "vue";

let form = reactive({});
const visible = ref(false);

watch(
  form,
  () => {
    form.price = form.totalPrice;
    form.produceCode = form.produceName;
    form.tradeType = form.type;
  },
  { deep: true }
);

const handleOk = async () => {
  fetchCreateOrder(form).then(res => {
    if (res.code === "00000") {
      message("支付成功", { type: "success" });
      return;
    }
    message(res.msg, { type: "error" });
  });
};
const handleClose = async () => {
  visible.value = false;
};

const handleOpen = async (row1, merchant1) => {
  visible.value = true;
  Object.assign(form, row1);
  Object.assign(form, merchant1);
  form.produceName = "测试";
  form.origin = "TEST";
  form.totalPrice = 0.01;
};

defineExpose({
  handleOpen,
  handleClose
});
</script>
