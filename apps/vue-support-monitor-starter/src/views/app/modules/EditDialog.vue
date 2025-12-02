<template>
  <el-dialog
    v-model="props.visible"
    width="480px"
    draggable
    class="modern-dialog"
    :close-on-click-modal="false"
    :close-on-press-escape="false"
    @close="handleClose"
  >
    <template #header>
      <div class="dialog-header">
        <IconifyIconOnline icon="ri:edit-box-line" class="header-icon" />
        <span class="header-title">更新配置</span>
      </div>
    </template>

    <el-form :model="form" label-width="80px" class="modern-form">
      <el-form-item label="平台" prop="monitorApplicationName">
        <el-input
          v-model="form.monitorApplicationName"
          placeholder="请输入平台"
        >
          <template #prefix>
            <IconifyIconOnline icon="ri:apps-line" />
          </template>
        </el-input>
      </el-form-item>
      <el-form-item label="名称" prop="monitorName">
        <el-input v-model="form.monitorName" placeholder="请输入名称">
          <template #prefix>
            <IconifyIconOnline icon="ri:text" />
          </template>
        </el-input>
      </el-form-item>
    </el-form>

    <template #footer>
      <div class="dialog-footer">
        <el-button @click="handleClose">
          <IconifyIconOnline icon="ri:close-line" />
          取消
        </el-button>
        <el-button type="primary" @click="handleSubmit">
          <IconifyIconOnline icon="ri:check-line" />
          确定
        </el-button>
      </div>
    </template>
  </el-dialog>
</template>
<script setup lang="ts">
import { fetchAppSave } from "@/api/monitor/app";
import { message } from "@repo/utils";
import { reactive, ref, watch } from "vue";
const form = ref({
  monitorApplicationName: "",
  monitorName: "",
});
// 定义属性
interface Props {
  data: {
    monitorApplicationName: string;
    monitorName: string;
  };
  visible?: boolean;
}
const emit = defineEmits(["update:visible", "success"]);
const props = withDefaults(defineProps<Props>(), {
  data: () => ({
    monitorApplicationName: "",
    monitorName: "",
  }),
  visible: false,
});

const handleSubmit = () => {
  fetchAppSave(form.value).then((res) => {
    if (res.code === "00000") {
      message.success("保存成功");
      handleClose();
    }
  });
};

const handleClose = () => {
  emit("update:visible", false);
  emit("success");
};

watch(
  () => props.data,
  (val) => {
    if (val) {
      form.value = val;
    }
  }
);
</script>

<style lang="scss" scoped>
.dialog-header {
  display: flex;
  align-items: center;
  gap: 10px;

  .header-icon {
    font-size: 22px;
    color: var(--el-color-primary);
  }

  .header-title {
    font-size: 18px;
    font-weight: 600;
    color: var(--el-text-color-primary);
  }
}

.modern-form {
  padding: 8px 0;

  :deep(.el-form-item) {
    margin-bottom: 20px;
  }

  :deep(.el-input__prefix) {
    color: var(--el-text-color-secondary);
  }
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}
</style>
