<template>
  <div class="system-container modern-bg">
    <sc-dialog
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
    </sc-dialog>
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
<style lang="scss" scoped>

.modern-bg {
  position: relative;
  overflow: hidden;

  // 渐变背景
  &::before {
    content: "";
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background:
      radial-gradient(
        circle at 20% 30%,
        rgba(99, 102, 241, 0.08) 0%,
        transparent 50%
      ),
      radial-gradient(
        circle at 80% 70%,
        rgba(168, 85, 247, 0.06) 0%,
        transparent 50%
      );
    pointer-events: none;
    z-index: 0;
  }

  > * {
    position: relative;
    z-index: 1;
  }
}



// 响应式设计
@media (max-width: 768px) {
  .page-header {
    flex-direction: column;
    gap: 12px;
    padding: 12px 16px;
  }
}

</style>

