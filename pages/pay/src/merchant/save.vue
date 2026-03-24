<template>
  <sc-dialog
    v-model="visible"
    :title="mode === 'add' ? '新增商户' : '编辑商户'"
    width="520px"
    append-to-body
  >
    <div class="dialog-header">
      <h3>{{ mode === 'add' ? '新增商户' : '编辑商户' }}</h3>
    </div>
    <ScForm :model="form" label-width="100px" class="modern-form">
      <ScFormItem label="商户名称" prop="payMerchantName">
        <ScInput v-model="form.payMerchantName" placeholder="请输入商户名称" />
      </ScFormItem>
      <ScFormItem label="备注" prop="payMerchantRemark">
        <ScInput 
          v-model="form.payMerchantRemark"
          type="textarea"
          placeholder="请输入备注"
        />
      </ScFormItem>
      <ScFormItem label="启用钱包" prop="payMerchantOpenWallet">
        <ScSwitch
          v-model="form.payMerchantOpenWallet"
          :active-value="1"
          :inactive-value="0"
          layout="modern"
        />
      </ScFormItem>
      <ScFormItem label="订单超时" prop="payMerchantOpenTimeout">
        <ScSwitch
          v-model="form.payMerchantOpenTimeout"
          :active-value="1"
          :inactive-value="0"
          layout="modern"
        />
      </ScFormItem>
      <ScFormItem 
        v-if="form.payMerchantOpenTimeout === 1"
        label="超时时间(min)"
        prop="payMerchantOpenTimeoutTime"
      >
        <ScInputNumber 
          v-model="form.payMerchantOpenTimeoutTime"
          :min="1"
          :max="1440"
        />
      </ScFormItem>
    </ScForm>
    <template #footer>
      <ScButton @click="visible = false">取消</ScButton>
      <ScButton type="primary" @click="handleSubmit">保存</ScButton>
    </template>
  </sc-dialog>
</template>

<script setup lang="ts">
import { reactive, ref, defineExpose, watch } from "vue";
import { fetchSaveMerchant, fetchUpdateMerchant } from "../api/merchant";
import { message } from "@repo/utils";
import ScSwitch from "@repo/components/ScSwitch/index.vue";

const visible = ref(false);
const mode = ref<"add" | "edit">("add");
const form = reactive<any>({});

const handleOpen = (type: "add" | "edit", row: any) => {
  mode.value = type;
  Object.assign(form, {
    payMerchantId: undefined,
    payMerchantName: "",
    payMerchantRemark: "",
    payMerchantOpenWallet: 0,
    payMerchantOpenTimeout: 0,
    payMerchantOpenTimeoutTime: undefined,
  });
  if (type === "edit") {
    Object.assign(form, row);
  }
  visible.value = true;
};

const emit = defineEmits(["success"]);

const handleSubmit = async () => {
  if (mode.value === "add") {
    await fetchSaveMerchant(form);
  } else {
    await fetchUpdateMerchant(form);
  }
  message("保存成功", { type: "success" });
  visible.value = false;
  emit("success");
};

// defineExpose 和 watch 必须放在最后（遵循项目规则）

defineExpose({ handleOpen });

watch(form, () => {}, { deep: true });
</script>
