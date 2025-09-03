<script setup>
import { useRenderIcon } from "@repo/components/ReIcon/src/hooks";
import { message, stringSplitToArray } from "@repo/utils";
import { defineAsyncComponent, defineExpose, reactive, ref, watch } from "vue";
import { fetctSenderProjectForSms } from "../../../api/manage/project-sms";

const ScFormTable = defineAsyncComponent(() => import("@repo/components/ScFormTable/index.vue"));
const visible = ref(false);
let form = reactive({});
const rules = {
  target: [{ required: true, message: "请输入被叫号码", trigger: "blur" }],
};

const loading = reactive({});
const title = ref();
const formRef = ref();
const tempData = reactive([]);
const template = {
  key: null,
  value: null,
};
const handleClose = async () => {
  visible.value = false;
  form = reactive({});
};

const handleOpen = async (data) => {
  visible.value = true;
  const keywords = data.sysSmsTemplateContent.match(/\$\{(\w+)\}/g)?.map((match) => match.replace(/\$\{|\}/g, "")) || [];
  form.sysSmsTemplateId = data.sysSmsTemplateId;
  tempData.length = 0;

  keywords.forEach((key) => {
    tempData.push({
      key,
      value: "",
    });
  });

  title.value = data.sysSmsTemplateName;
};

const handleSubmit = async () => {
  formRef.value.validate(async (valid) => {
    if (!valid) {
      return;
    }
    loading.send = true;
    form.target = stringSplitToArray(form.target);
    fetctSenderProjectForSms(form)
      .then((res) => {
        if (res.code == "00000") {
          message("发送成功", { type: "success" });
          handleClose();
        } else {
          message(res.msg, { type: "error" });
        }
      })
      .finally(() => {
        loading.send = false;
      });
  });
};
watch(
  () => tempData,
  (val) => {
    if (val) {
      form.params = {};
      val.forEach((item) => {
        form.params[item["key"]] = item?.value;
      });
    }
  },
  { deep: true, immediate: true }
);
defineExpose({
  handleOpen,
  handleClose,
});
</script>
<template>
  <div>
    <el-dialog v-model="visible" :title="title" :close-on-click-modal="false" draggable width="55%" @close="handleClose">
      <el-form ref="formRef" :model="form" :rules="rules" label-width="80px">
        <el-form-item prop="target" label="被叫号码">
          <el-input v-model="form.target" placeholder="请输入被叫号码" />
        </el-form-item>
        <el-form-item prop="参数">
          <ScFormTable v-model="tempData" :add-template="template">
            <el-table-column prop="key" label="参数名" width="120px">
              <template #default="{ row }">
                <el-input v-model="row.key" placeholder="请输入参数名" />
              </template>
            </el-table-column>
            <el-table-column prop="value" label="参数值">
              <template #default="{ row }">
                <el-input v-model="row.value" placeholder="请输入参数值" />
              </template>
            </el-table-column>
          </ScFormTable>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button type="primary" :loading="loading.send" size="default" :icon="useRenderIcon('bi:send')" @click="handleSubmit" />
      </template>
    </el-dialog>
  </div>
</template>
