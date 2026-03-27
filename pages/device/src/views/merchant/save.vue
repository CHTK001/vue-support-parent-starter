<template>
  <ScDialog v-model="visible" :title="title" width="760px" append-to-body>
    <ScForm ref="formRef" :model="form" :rules="rules" label-width="96px">
      <div class="form-grid">
        <ScFormItem label="商户名称" prop="sysProjectName">
          <ScInput v-model="form.sysProjectName" placeholder="请输入商户名称" />
        </ScFormItem>
        <ScFormItem label="厂商" prop="sysProjectVender">
          <ScSelect
            v-model="form.sysProjectVender"
            :data="vendorOptions"
            filterable
            placeholder="请选择厂商"
          />
        </ScFormItem>
        <ScFormItem label="API 地址" prop="sysProjectApiAddress">
          <ScInput
            v-model="form.sysProjectApiAddress"
            placeholder="例如 https://open.example.com"
          />
        </ScFormItem>
        <ScFormItem label="Endpoint">
          <ScInput v-model="form.sysProjectEndpoint" placeholder="可选" />
        </ScFormItem>
        <ScFormItem label="AppId">
          <ScInput v-model="form.sysProjectAppId" placeholder="请输入 AppId" />
        </ScFormItem>
        <ScFormItem label="AppSecret">
          <ScInput
            v-model="form.sysProjectAppSecret"
            type="password"
            show-password
            placeholder="请输入 AppSecret"
          />
        </ScFormItem>
        <ScFormItem label="签名标识">
          <ScInput v-model="form.sysProjectSign" placeholder="可选" />
        </ScFormItem>
        <ScFormItem label="备注">
          <ScInput v-model="form.sysProjectRemark" type="textarea" :rows="3" />
        </ScFormItem>
      </div>
    </ScForm>

    <template #footer>
      <ScButton @click="visible = false">取消</ScButton>
      <ScButton type="primary" :loading="loading" @click="handleSubmit">保存</ScButton>
    </template>
  </ScDialog>
</template>

<script setup lang="ts">
import { fetchListDictItem } from "@repo/core";
import { message } from "@repo/utils";
import { onMounted, reactive, ref } from "vue";
import {
  fetchSaveDeviceMerchant,
  fetchUpdateDeviceMerchant,
} from "../../api/manage/device-merchant";

const emit = defineEmits(["success"]);

const visible = ref(false);
const loading = ref(false);
const title = ref("新增商户");
const formRef = ref();
const vendorOptions = ref([]);
const form = reactive<any>({
  sysProjectStatus: 1,
});

const rules = {
  sysProjectName: [{ required: true, message: "请输入商户名称", trigger: "blur" }],
  sysProjectVender: [{ required: true, message: "请选择厂商", trigger: "change" }],
};

const resetForm = () => {
  Object.keys(form).forEach((key) => delete form[key]);
  form.sysProjectStatus = 1;
};

const handleOpen = (mode: "add" | "edit", row: any) => {
  resetForm();
  visible.value = true;
  title.value = mode === "add" ? "新增商户" : "编辑商户";
  Object.assign(form, row || {});
};

const handleSubmit = async () => {
  await formRef.value?.validate();
  loading.value = true;
  const api = form.sysProjectId ? fetchUpdateDeviceMerchant : fetchSaveDeviceMerchant;
  const res = await api({ ...form });
  loading.value = false;
  if (res.code !== "00000") {
    message(res.msg || "保存失败", { type: "error" });
    return;
  }
  message("保存成功", { type: "success" });
  visible.value = false;
  emit("success");
};

defineExpose({ handleOpen });

onMounted(async () => {
  const res = await fetchListDictItem({
    sysDictId: 1,
  });
  vendorOptions.value =
    res?.data?.map((item) => ({
      label: item.sysDictItemName,
      value: item.sysDictItemId,
    })) || [];
});
</script>

<style scoped lang="scss">
.form-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px 18px;
}

:deep(.el-textarea),
:deep(.el-form-item:last-child) {
  grid-column: 1 / -1;
}

@media (width <= 900px) {
  .form-grid {
    grid-template-columns: 1fr;
  }
}
</style>
