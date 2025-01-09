<template>
  <div>
    <el-dialog v-model="visible" :title="config.title" draggable top="10px" @close="handleClose">
      <el-skeleton animated :loading="loading.data">
        <template #default>
          <div class="overflow-auto h-[50vh]">
            <div v-for="(item, index) in payMerchantOrderWaterList" :key="index">
              <el-form ref="formRef" :model="form" label-width="120px">
                <el-form-item label="流水单号编号">
                  <el-text>
                    {{ item.payMerchantOrderWaterCode }}
                  </el-text>
                </el-form-item>

                <el-form-item label="订单编号">
                  <el-text>
                    {{ form.payMerchantOrderCode }}
                  </el-text>
                </el-form-item>

                <el-form-item label="流水单时间">
                  <el-text>
                    {{ item.createTime }}
                    <el-tag :type="config.fun.handleStatusType(item.payMerchantOrderStatus)">
                      {{ config.fun.handleStatus(item.payMerchantOrderStatus) }}
                    </el-tag>
                  </el-text>
                </el-form-item>

                <el-form-item label="钱包余额">
                  <el-text>
                    {{ item.payMerchantOrderWallet || "-" }}
                  </el-text>
                </el-form-item>
              </el-form>
              <el-divider />
            </div>
          </div>
        </template>
      </el-skeleton>
      <template #footer>
        <div class="dialog-footer">
          <el-button @click="handleClose">取 消</el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { handlePayWay } from "@/utils/pay";
import { defineExpose, reactive, ref } from "vue";
import { fetchPageOrderWater } from "@/api/order";
const config = {
  title: "测试",
  mode: "add",
  confirmLoading: false
};
let form = reactive({});

const visible = ref(false);
const payMerchantOrderWaterList = ref([]);
const loading = reactive({
  data: false
});
const handleClose = async () => {
  visible.value = false;
  loading.data = false;
  form = reactive({});
};
const handleOpen = async (mode, data, fun) => {
  visible.value = true;
  config.title = `订单流水${data.payMerchantOrderCode}`;
  config.fun = fun;
  Object.assign(form, data);
  loading.data = true;
  fetchPageOrderWater({ payMerchantOrderCode: data.payMerchantOrderCode })
    .then(res => {
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
  handleOpen
});
</script>
