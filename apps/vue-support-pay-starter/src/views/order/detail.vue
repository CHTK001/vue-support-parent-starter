<template>
  <div>
    <el-dialog v-model="visible" :title="config.title" draggable top="10px" @close="handleClose">
      <el-form ref="formRef" :model="form" label-width="120px">
        <el-form-item label="商家">
          <el-text>
            {{ form.payMerchantName }}
          </el-text>
          <el-tag>
            {{ form.payMerchantCode }}
          </el-tag>
        </el-form-item>

        <el-form-item label="订单编号">
          <el-text>
            {{ form.payMerchantOrderCode }}
          </el-text>
          <el-tag :type="config.fun.handleStatusType(form.payMerchantOrderStatus)">
            {{ config.fun.handleStatus(form.payMerchantOrderStatus) }}
          </el-tag>
          <el-icon class="cursor-pointer z-[10px]">
            <component :is="useRenderIcon('ep:document-copy')" v-copy.click="form.payMerchantOrderCode" />
          </el-icon>
        </el-form-item>

        <el-form-item label="原始金额">
          <el-text>
            {{ form.payMerchantOrderPrice }}
          </el-text>
        </el-form-item>

        <el-form-item label="支付金额">
          <el-text>
            {{ form.payMerchantOrderTotalPrice }}
          </el-text>
          <el-tag type="info">
            {{ handlePayWay(form.payMerchantOrderTradeType) }}
          </el-tag>
        </el-form-item>

        <el-form-item label="优惠券码">
          <el-text>
            {{ form.payMerchantCouponCode || "-" }}
          </el-text>
        </el-form-item>

        <el-form-item label="用户编码">
          <el-text>
            {{ form.payMerchantOrderUserId }}
          </el-text>
        </el-form-item>

        <el-form-item label="客户端">
          <el-text>
            {{ form.payMerchantOrderBrowserSystem }}
          </el-text>
        </el-form-item>

        <el-form-item label="附加信息">
          <el-space direction="vertical" alignment="flex-start">
            <el-text v-for="(item, index) in handleFormat(form.payMerchantOrderAttach)" :key="index" type="info" tag="p">{{ item.key }}:{{ item.value }}</el-text>
          </el-space>
        </el-form-item>
      </el-form>
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
import { useRenderIcon } from "@repo/components/ReIcon/src/hooks";
import { defineExpose, reactive, ref } from "vue";
const config = {
  title: "测试",
  mode: "add",
  confirmLoading: false
};
let form = reactive({});

const visible = ref(false);

const handleFormat = data => {
  if (data) {
    try {
      const obj = JSON.parse(data);
      const rs = Object.keys(obj).map(key => {
        return {
          key,
          value: obj[key]
        };
      });
      return rs;
    } catch (error) {
      return [
        {
          key: "",
          value: data.split("\n")
        }
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
  config.title = `订单${data.payMerchantOrderCode}`;
  config.fun = fun;
  Object.assign(form, data);
};

defineExpose({
  handleOpen
});
</script>
