<template>
  <div>
    <el-dialog
      v-model="visible"
      draggable
      title="设置默认"
      width="400px"
      class="default-setting-dialog"
    >
      <el-form>
        <el-form-item
          v-for="item in currentValue"
          :key="item.value"
          prop="label"
          :label="item.label"
        >
          <el-segmented
            v-model="defaultValue[item.value]"
            :options="[
              {
                value: false,
                label: '否',
              },
              {
                value: true,
                label: '是',
              },
            ]"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="handleClose">取消</el-button>
        <el-button
          type="primary"
          :icon="useRenderIcon('ri:save-2-line')"
          @click="handleSubmit"
          >保存</el-button
        >
      </template>
    </el-dialog>
  </div>
</template>
<script setup>
import { useRenderIcon } from "@repo/components/ReIcon/src/hooks";
import { message, stringSplitToNumber } from "@repo/utils";
import { defineExpose, reactive, ref } from "vue";
import { fetchUpdateProject } from "../../api/manage/project";

const emit = defineEmits(["success"]);
const visible = ref(false);
let defaultValue = reactive({});
let form = {};
let options = reactive([]);
let currentValue = reactive([]);
const handleClose = async () => {
  visible.value = false;
  form = reactive({});
  options = reactive([]);
};
const handleSubmit = async () => {
  console.log(defaultValue);
  const defaultValueArr = Object.keys(defaultValue).map((key) => {
    return defaultValue[key] ? key : 0;
  });
  form.sysProjectFunctionDefaultIds = defaultValueArr;
  fetchUpdateProject(form).then((res) => {
    if (res.code == "00000") {
      message("修改成功", { type: "success" });
      handleClose();
      emit("success", res?.data);
      return;
    }
  });
};
const handleType = async (items) => {
  options = items.map((item) => {
    return {
      label: item.sysDictItemName,
      value: item.sysDictItemId,
      key: item.sysDictItemId,
    };
  });
};
const handleOpen = async (data) => {
  visible.value = true;
  form = data;
  const storeValues1 = stringSplitToNumber(form.sysProjectFunctionDefaultIds);
  storeValues1.forEach((element) => {
    defaultValue[element] = true;
  });
  const storeValues = stringSplitToNumber(form.sysProjectFunction);
  currentValue = options.filter((item) => {
    return storeValues.includes(item.value);
  });
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
