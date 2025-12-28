<template>
  <sc-dialog
    v-model="visible"
    title="布局配置"
    width="900px"
    :close-on-click-modal="false"
    destroy-on-close
    class="layout-config-dialog"
  >
    <div class="layout-content">
      <el-alert
        title="布局配置功能开发中"
        type="info"
        description="此功能正在开发中，敬请期待..."
        show-icon
        :closable="false"
      />
      
      <div class="layout-placeholder">
        <el-empty description="布局配置功能开发中..." />
      </div>
    </div>

    <template #footer>
      <div class="dialog-footer">
        <el-button @click="visible = false">关闭</el-button>
        <el-button type="primary" disabled>
          应用布局
        </el-button>
      </div>
    </template>
  </sc-dialog>
</template>

<script setup lang="ts">
import { ref } from "vue";

// 定义事件
const emit = defineEmits<{
  apply: [template: any];
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
.layout-config-dialog {
  :deep(.el-dialog) {
    border-radius: 12px;
  }
}

.layout-content {
  padding: 20px 0;
  
  .layout-placeholder {
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
