<template>
  <div>
    <sc-dialog
      v-model="visible"
      draggable
      title="设置默认"
      width="400px"
      class="default-setting-dialog"
    >
      <ScForm>
        <ScFormItem
          v-for="item in currentValue"
          :key="item.value"
          prop="label"
          :label="item.label"
        >
          <el-segmented
            v-model="defaultValue[item.value]"
            :options="[
              { value: false, label: '否' },
              { value: true, label: '是' },
            ]"
          />
        </ScFormItem>
      </ScForm>
      <template #footer>
        <ScButton @click="handleClose">取消</ScButton>
        <ScButton
          type="primary"
          :icon="useRenderIcon('ri:save-2-line')"
          @click="handleSubmit"
        >
          保存
        </ScButton>
      </template>
    </sc-dialog>
  </div>
</template>

<script setup>
import { useRenderIcon } from "@repo/components/ReIcon";
import { message } from "@repo/utils";
import { defineExpose, reactive, ref } from "vue";
import { fetchUpdateSecretDefault } from "../../api/manage/secret";

const emit = defineEmits(["success"]);
const visible = ref(false);
const defaultValue = reactive({});
let form = {};
let options = reactive([]);
let currentValue = reactive([]);

const splitValueList = (value) =>
  String(value ?? "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);

const handleClose = async () => {
  visible.value = false;
  form = reactive({});
  options = reactive([]);
  currentValue = reactive([]);
  Object.keys(defaultValue).forEach((key) => {
    delete defaultValue[key];
  });
};

const handleSubmit = async () => {
  const tasks = currentValue.map((item) =>
    fetchUpdateSecretDefault({
      sysSecretId: form.sysSecretId,
      sysProjectDefaultType: item.value,
      sysSetDefault: defaultValue[item.value] ? 1 : 0,
    }),
  );
  const results = await Promise.all(tasks);
  const failed = results.find((item) => item?.code !== "00000");
  if (failed) {
    message(failed.message || "修改失败", { type: "error" });
    return;
  }
  message("修改成功", { type: "success" });
  handleClose();
  emit("success");
};

const handleType = async (items) => {
  options = items.map((item) => ({
    label: item.sysDictItemName,
    value: String(item.sysDictItemId),
    key: String(item.sysDictItemId),
  }));
};

const handleOpen = async (data) => {
  visible.value = true;
  form = data;

  Object.keys(defaultValue).forEach((key) => {
    delete defaultValue[key];
  });

  splitValueList(form.sysSecretFunctionDefaultIds).forEach((element) => {
    defaultValue[element] = true;
  });

  const storeValues = splitValueList(form.sysSecretFunction);
  currentValue = options.filter((item) => storeValues.includes(item.value));
};

defineExpose({
  handleClose,
  handleType,
  handleOpen,
});
</script>

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
  margin-bottom: 20px;
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

:deep(.el-segmented) {
  border-radius: 10px;

  .el-segmented__item {
    border-radius: 8px;
    transition: all 0.3s ease;
    font-weight: 500;

    &.is-selected {
      background: linear-gradient(
        135deg,
        var(--el-color-primary) 0%,
        var(--el-color-primary-light-3) 100%
      );
      box-shadow: 0 2px 8px rgba(var(--el-color-primary-rgb), 0.3);
    }
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
