<template>
  <div>
    <el-dialog v-model="visible" title="支付" width="600px" :close-on-click-modal="false" draggable @close="handleClose">
      <el-form :model="form">
        <el-form-item label="商户名称" prop="merchantName">
          <el-input v-model="merchant.payMerchantName" disabled />
        </el-form-item>
      </el-form>
      <template #footer>
        <div class="dialog-footer">
          <el-button @click="handleClose">取 消</el-button>
          <el-button type="primary" :loading="confirmLoading" @click="handleOk">确 定</el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>
<script setup>
import { ref, defineExpose, reactive } from "vue";

let row = ref({});
let merchant = ref({});
let form = reactive({});
const visible = ref(false);

const handleClose = async () => {
  visible.value = false;
};

const handleOpen = async (row1, merchant1) => {
  visible.value = true;
  Object.assign(row, row1);
  Object.assign(merchant, merchant1);
  console.log("merchant", merchant);
  console.log("row", row);
};

defineExpose({
  handleOpen,
  handleClose
});
</script>
