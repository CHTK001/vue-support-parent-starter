<script setup>
import { fetctSenderProjectForEmail } from "@/api/manage/project-email";
import { useRenderIcon } from "@repo/components/ReIcon/src/hooks";
import { message, stringSplitToArray, queryEmail } from "@repo/utils";
import { defineExpose, defineAsyncComponent, reactive, ref, watch } from "vue";

const ScFormTable = defineAsyncComponent(() => import("@repo/components/ScFormTable/index.vue"));
const visible = ref(false);
const loading = reactive({
  send: false
});
let form = reactive({});
const rules = {
  target: [{ required: true, message: "请输入被叫号码", trigger: "blur" }]
};
const title = ref();
const formRef = ref();
const tempData = reactive([]);
const template = {
  key: null,
  value: null
};
const handleClose = async () => {
  visible.value = false;
  form = reactive({});
};

const handleOpen = async data => {
  visible.value = true;
  form.sysEmailTemplateId = data.sysEmailTemplateId;
  title.value = data.sysEmailTemplateName;
};

const handleSubmit = async () => {
  formRef.value.validate(async valid => {
    if (!valid) {
      return;
    }
    form.target = stringSplitToArray(form.target);
    loading.send = true;
    fetctSenderProjectForEmail(form)
      .then(res => {
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
  val => {
    if (val) {
      form.params = {};
      val.forEach(item => {
        form.params[item["key"]] = item?.value;
      });
    }
  },
  { deep: true, immediate: true }
);
defineExpose({
  handleOpen,
  handleClose
});
</script>
<template>
  <div>
    <el-dialog v-model="visible" :title="title" :close-on-click-modal="false" draggable width="40%" @close="handleClose">
      <el-form ref="formRef" :model="form" :rules="rules" label-width="100px">
        <el-form-item prop="target" label="被叫号码">
          <el-autocomplete v-model="form.target" :fetch-suggestions="queryEmail" :trigger-on-focus="false" placeholder="请输入主体账号邮箱" clearable class="w-full" />
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
