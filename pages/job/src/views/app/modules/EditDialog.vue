<template>
  <sc-dialog
    v-model="dialogVisible"
    title="应用配置"
    width="480px"
    draggable
    append-to-body
    :close-on-click-modal="false"
    :close-on-press-escape="false"
    @close="handleClose"
  >
    <el-form ref="formRef" :model="form" label-width="88px" class="app-form">
      <el-form-item label="平台" prop="monitorApplicationName">
        <el-input
          v-model="form.monitorApplicationName"
          placeholder="例如 spring / node / python"
        />
      </el-form-item>
      <el-form-item label="名称" prop="monitorName">
        <el-input v-model="form.monitorName" placeholder="请输入应用名称" />
      </el-form-item>
    </el-form>

    <template #footer>
      <el-button @click="handleClose">取消</el-button>
      <el-button type="primary" :loading="submitting" @click="handleSubmit">
        保存
      </el-button>
    </template>
  </sc-dialog>
</template>

<script setup lang="ts">
import { ref, watch } from "vue";
import { message } from "@repo/utils";
import { fetchAppSave, fetchAppUpdate } from "../../../api/monitor/app";

type MonitorApplication = {
  monitorId?: number;
  monitorApplicationName?: string;
  monitorName?: string;
};

interface Props {
  data?: MonitorApplication;
  visible?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  data: () => ({}),
  visible: false,
});

const emit = defineEmits(["update:visible", "success"]);

const dialogVisible = ref(false);
const submitting = ref(false);
const formRef = ref();
const form = ref<MonitorApplication>({
  monitorApplicationName: "",
  monitorName: "",
});

const syncForm = () => {
  form.value = {
    monitorId: props.data?.monitorId,
    monitorApplicationName: props.data?.monitorApplicationName || "",
    monitorName: props.data?.monitorName || "",
  };
};

const handleClose = () => {
  emit("update:visible", false);
};

const handleSubmit = async () => {
  submitting.value = true;
  try {
    const request = form.value.monitorId ? fetchAppUpdate : fetchAppSave;
    const res = await request(form.value);
    if (res?.code === "00000") {
      message.success("保存成功");
      emit("update:visible", false);
      emit("success");
      return;
    }
    message.error(res?.msg || "保存失败");
  } catch (error) {
    console.error("保存应用配置失败:", error);
    message.error("保存失败");
  } finally {
    submitting.value = false;
  }
};

watch(
  () => props.visible,
  value => {
    dialogVisible.value = value;
    if (value) {
      syncForm();
    }
  },
  { immediate: true },
);

watch(
  () => dialogVisible.value,
  value => {
    if (value !== props.visible) {
      emit("update:visible", value);
    }
  },
);

watch(
  () => props.data,
  () => {
    if (dialogVisible.value) {
      syncForm();
    }
  },
  { deep: true },
);
</script>

<style scoped lang="scss">
.app-form {
  padding-top: 8px;
}
</style>
