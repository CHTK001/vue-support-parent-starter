<template>
  <div>
    <el-dialog
      title="更新配置"
      width="400px"
      draggable
      v-model="props.visible"
      @close="handleClose"
      :close-on-click-modal="false"
      :close-on-press-escape="false"
      append-to-body
    >
      <el-form :model="form">
        <el-form-item label="平台" prop="monitorApplicationName">
          <el-input
            v-model="form.monitorApplicationName"
            placeholder="请输入平台"
          />
        </el-form-item>
        <el-form-item label="名称" prop="monitorName">
          <el-input v-model="form.monitorName" placeholder="请输入名称" />
        </el-form-item>
      </el-form>

      <template #footer>
        <el-button @click="handleClose">取消</el-button>
        <el-button type="primary" @click="handleSubmit">确定</el-button>
      </template>
    </el-dialog>
  </div>
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
