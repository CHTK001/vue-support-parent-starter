<script setup>
import { useRenderIcon } from "@repo/components/ReIcon";
import { message, stringSplitToArray } from "@repo/utils";
import { defineAsyncComponent, defineExpose, reactive, ref, watch } from "vue";
import { fetctSenderProjectForDevice } from "../../../api/manage/device-template";

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
const loading = reactive({ send: false });
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
    <sc-dialog
      v-model="visible"
      :title="title"
      :close-on-click-modal="false"
      draggable
      width="40%"
      @close="handleClose"
      class="device-dialog"
    >
      <div class="device-dialog__header">
        <div class="device-dialog__summary">
          <span class="device-dialog__summary-label">设备</span>
          <span class="device-dialog__summary-value">{{ title }}</span>
        </div>
        <div class="device-dialog__summary">
          <span class="device-dialog__summary-label">状态</span>
          <span class="device-dialog__summary-value">消息下发</span>
        </div>
      </div>
      <ScForm ref="formRef" :model="form" :rules="rules" label-width="100px">
        <ScFormItem prop="target" label="被叫号码">
          <ScInput v-model="form.target" placeholder="请输入被叫号码" />
        </ScFormItem>
        <ScFormItem prop="参数">
          <ScFormTable v-model="tempData" :add-template="template">
            <ScTableColumn prop="key" label="参数名" width="120px">
              <template #default="{ row }">
                <ScInput v-model="row.key" placeholder="请输入参数名" />
              </template>
            </ScTableColumn>
            <ScTableColumn prop="value" label="参数值">
              <template #default="{ row }">
                <ScInput v-model="row.value" placeholder="请输入参数值" />
              </template>
            </ScTableColumn>
          </ScFormTable>
        </ScFormItem>
      </ScForm>
      <template #footer>
        <ScButton
          type="primary"
          :loading="loading.send"
          size="default"
          :icon="useRenderIcon('bi:send')"
          @click="handleSubmit"
        >
          发送
        </ScButton>
      </template>
    </sc-dialog>
  </div>
</template>

<style scoped lang="scss">
.device-dialog {
  :deep(.el-dialog) {
    border-radius: 16px;
    overflow: hidden;
    box-shadow: 0 20px 60px rgba(0, 0, 0, 0.15);

    .el-dialog__header {
      padding: 20px 24px;
      margin: 0;
      background: var(--el-bg-color-overlay);
      border-bottom: 1px solid var(--el-border-color-lighter);

      .el-dialog__title {
        font-size: 18px;
        font-weight: 700;
        color: var(--el-text-color-primary);
      }
    }

    .el-dialog__body {
      padding: 24px 28px;
      background: var(--el-bg-color);
    }

    .el-dialog__footer {
      padding: 16px 24px;
      border-top: 1px solid var(--el-border-color-lighter);
      background: var(--el-bg-color-overlay);
    }
  }

  &__header {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 12px;
    margin-bottom: 20px;
  }

  &__summary {
    padding: 12px 14px;
    border: 1px solid var(--el-border-color-lighter);
    border-radius: 12px;
    background: var(--el-bg-color-overlay);
  }

  &__summary-label {
    display: block;
    font-size: 12px;
    color: var(--el-text-color-secondary);
  }

  &__summary-value {
    display: block;
    margin-top: 6px;
    font-size: 13px;
    font-weight: 600;
    color: var(--el-text-color-primary);
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
}
</style>
