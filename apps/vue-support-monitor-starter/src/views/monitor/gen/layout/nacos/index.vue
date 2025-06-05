<template>
  <div class="nacos-container h-full flex flex-col relative">
   <iframe :src="`http://${dataSource.genHost}:${dataSource.genPort}/nacos/index.html`" class="w-full h-full"></iframe>
  </div>
</template>

<script setup>
import { ref, defineProps, computed, defineAsyncComponent } from 'vue';

// 组件属性
const props = defineProps({
  data: {
    type: Object,
    required: true,
    default: () => ({})
  }
});

// 数据源信息
const dataSource = computed(() => props.data || {});

/**
 * 更新数据
 */
const upgrade = async (data, node) => {
  // 不需要处理树节点事件，因为已经设置为全屏模式
  console.log('Nacos组件不需要处理节点更新事件');
};

/**
 * 更新提示信息
 */
const upgradeHits = async (hits) => {
  // 这里可以实现提示信息的更新逻辑
  console.log('Nacos组件接收到提示信息更新:', hits);
};

// 导出方法
defineExpose({
  upgrade,
  upgradeHits
});
</script>

<style scoped lang="scss">
.nacos-container {
  padding: 16px;
  
  .nacos-tabs {
    background-color: var(--el-bg-color);
    border-radius: var(--el-border-radius-base);
    
    :deep(.el-tabs__header) {
      margin-bottom: 16px;
      padding: 0 16px;
    }
    
    :deep(.el-tabs__content) {
      padding: 0;
      height: calc(100% - 55px);
      overflow: hidden;
      
      .el-tab-pane {
        height: 100%;
      }
    }
  }
  
  .nacos-empty {
    background-color: var(--el-bg-color-page);
    border-radius: var(--el-border-radius-base);
    padding: 32px;
  }
}
</style> 