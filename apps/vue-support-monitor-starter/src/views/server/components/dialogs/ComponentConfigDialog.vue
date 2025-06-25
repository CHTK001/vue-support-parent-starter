<template>
  <el-dialog
    v-model="visible"
    title="组件配置"
    width="800px"
    :close-on-click-modal="false"
    destroy-on-close
    class="component-config-dialog"
  >
    <div class="config-content">
      <el-alert
        title="组件配置功能开发中"
        type="info"
        description="此功能正在开发中，敬请期待..."
        show-icon
        :closable="false"
      />
      
      <div class="config-placeholder">
        <el-empty description="组件配置功能开发中..." />
      </div>
    </div>

    <template #footer>
      <div class="dialog-footer">
        <el-button @click="visible = false">关闭</el-button>
        <el-button type="primary" disabled>
          保存配置
        </el-button>
      </div>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref } from "vue";

// 定义事件
const emit = defineEmits<{
  success: [];
}>();

// 定义属性
const props = defineProps<{
  serverId?: number;
}>();

// 响应式状态
const visible = ref(false);

/**
 * 打开对话框
 */
const open = () => {
  visible.value = true;
};

// 暴露方法
defineExpose({
  open,
});
</script>

<style lang="scss" scoped>
.component-config-dialog {
  :deep(.el-dialog) {
    border-radius: 12px;
  }
}

.config-content {
  padding: 20px 0;
  
  .config-placeholder {
    margin-top: 20px;
    text-align: center;
  }
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}
</style>
