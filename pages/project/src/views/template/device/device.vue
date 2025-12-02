<script setup>
import { useRenderIcon } from "@repo/components/ReIcon/src/hooks";
import { message, stringSplitToArray } from "@repo/utils";
import { defineAsyncComponent, defineExpose, reactive, ref, watch } from "vue";
import { fetctSenderProjectForDevice } from "../../../api/manage/project-device";

const ScFormTable = defineAsyncComponent(
  () => import("@repo/components/ScFormTable/index.vue")
);
const visible = ref(false);
let form = reactive({});
const rules = {
  target: [{ required: true, message: "请输入被叫号码", trigger: "blur" }],
};

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
  form.sysDeviceId = data.sysDeviceId;
  title.value = data.sysDeviceName;
};

const handleSubmit = async () => {
  formRef.value.validate(async (valid) => {
    if (!valid) {
      return;
    }
    loading.send = true;
    form.target = stringSplitToArray(form.target);
    fetctSenderProjectForDevice(form)
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
    <el-dialog
      v-model="visible"
      :title="title"
      :close-on-click-modal="false"
      draggable
      width="40%"
      @close="handleClose"
      class="device-dialog"
    >
      <el-form ref="formRef" :model="form" :rules="rules" label-width="100px">
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
        <el-button
          type="primary"
          :loading="loading.send"
          size="default"
          :icon="useRenderIcon('bi:send')"
          @click="handleSubmit"
        />
      </template>
    </el-dialog>
  </div>
</template>

<style scoped lang="scss">
:deep(.el-dialog) {
  border-radius: 16px;
  overflow: hidden;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.15);

  .el-dialog__header {
    padding: 20px 24px;
    margin: 0;
    background: linear-gradient(
      135deg,
      var(--el-color-primary-light-9) 0%,
      var(--el-bg-color-overlay) 100%
    );
    border-bottom: 1px solid var(--el-border-color-lighter);

    .el-dialog__title {
      font-size: 18px;
      font-weight: 700;
      color: var(--el-text-color-primary);
    }
  }

  .el-dialog__body {
    padding: 28px;
    background: var(--el-bg-color);
  }

  .el-dialog__footer {
    padding: 16px 24px;
    border-top: 1px solid var(--el-border-color-lighter);
    background: var(--el-bg-color-overlay);
  }
}

:deep(.el-form-item) {
  margin-bottom: 24px;
  padding: 16px 20px;
  background: var(--el-bg-color-overlay);
  border-radius: 12px;
  border: 1px solid var(--el-border-color-lighter);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);

  &:hover {
    border-color: var(--el-color-primary-light-5);
    box-shadow: 0 4px 16px rgba(var(--el-color-primary-rgb), 0.1);
  }

  .el-form-item__label {
    font-weight: 600;
    color: var(--el-text-color-primary);
  }
}

:deep(.el-input__wrapper) {
  border-radius: 10px;
  transition: all 0.3s ease;

  &:hover,
  &:focus-within {
    box-shadow: 0 4px 12px rgba(var(--el-color-primary-rgb), 0.12);
  }
}

:deep(.el-button) {
  border-radius: 10px;
  font-weight: 600;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);

  &:hover {
    transform: translateY(-2px);
  }

  &.el-button--primary:hover {
    box-shadow: 0 6px 20px rgba(var(--el-color-primary-rgb), 0.35);
  }
}
</style>
