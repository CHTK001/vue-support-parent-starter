<script setup>
import { fetchPageProjectForSms, fetctSenderProjectForSms } from "@/api/manage/project-sms";
import { useRenderIcon } from "@repo/components/ReIcon/src/hooks";
import { message, stringSplitToArray } from "@repo/utils";
import { defineAsyncComponent, defineExpose, reactive, ref, watch } from "vue";

const ScFormTable = defineAsyncComponent(() => import("@repo/components/ScFormTable/index.vue"));
const ScTableSelect = defineAsyncComponent(() => import("@repo/components/ScTableSelect/index.vue"));
const visible = ref(false);
let form = reactive({});
const title = ref("发送短信");
const formRef = ref();
const keywords = reactive({
  label: "sysSmsTemplateName",
  value: "sysSmsTemplateId"
});
const env = reactive({
  columns: [
    {
      label: "名称",
      prop: "sysSmsTemplateName"
    },
    {
      label: "编码",
      prop: "sysSmsTemplateCode"
    },
    {
      label: "内容",
      prop: "sysSmsTemplateContent"
    }
  ]
});
const tempData = reactive([]);
const sysTemplateObject = ref({});
const params = {};
const template = {
  key: null,
  value: null
};
const rules = {
  target: [{ required: true, message: "请输入被叫号码", trigger: "blur" }]
};
const handleClose = async () => {
  visible.value = false;
  form = reactive({});
};

const handleOpen = async data => {
  visible.value = true;
  params.sysProjectId = data.sysProjectId;
  title.value = data.sysSmsTemplateName;
};

const handleSelectionChange = async (val, ids) => {
  sysTemplateObject.value = val;
};
const handleSubmit = async () => {
  formRef.value.validate(async valid => {
    if (!valid) {
      return;
    }
    form.sysSmsTemplateId = sysTemplateObject.value.sysSmsTemplateId;
    form.target = stringSplitToArray(form.target);
    fetctSenderProjectForSms(form).then(res => {
      if (res.code == "00000") {
        message("发送成功", { type: "success" });
        handleClose();
      } else {
        message(res.msg, { type: "error" });
      }
    });
  });
};

watch(
  sysTemplateObject,
  val => {
    form.sysTemplateId = val?.sysTemplateId;
  },
  { deep: true, immediate: true }
);
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
        <el-form-item label="模板" class="w-full">
          <ScTableSelect
            v-model="sysTemplateObject"
            placeholder="请选择模板"
            :keywords="keywords"
            remoteParameterName="sysSmsTemplateName"
            :columns="env.columns"
            :url="fetchPageProjectForSms"
            :params="params"
            class="w-full"
            @selectionChange="handleSelectionChange"
          />
          <div v-if="sysTemplateObject?.sysTemplateContent">
            {{ sysTemplateObject?.sysTemplateContent }}
          </div>
        </el-form-item>
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
        <el-button type="primary" size="default" :icon="useRenderIcon('bi:send')" @click="handleSubmit" />
      </template>
    </el-dialog>
  </div>
</template>
