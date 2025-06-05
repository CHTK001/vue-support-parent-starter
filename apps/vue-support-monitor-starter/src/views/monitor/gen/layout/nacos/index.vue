<template>
  <div class="nacos-container h-full flex flex-col relative">
    <!-- 空状态提示 -->
    <div v-if="!dataSource.genId" class="nacos-empty flex-1 flex flex-col items-center justify-center">
      <el-empty description="请选择或配置Nacos数据源" />
    </div>
    
    <!-- 主内容区域 -->
    <div v-else class="nacos-content flex-1 flex flex-col overflow-hidden">
      <el-tabs v-model="activeTab" class="flex-1 nacos-tabs">
        <el-tab-pane label="配置管理" name="config">
          <config :data-source="dataSource" />
        </el-tab-pane>
        <el-tab-pane label="服务列表" name="service">
          <service :data-source="dataSource" />
        </el-tab-pane>
      </el-tabs>
    </div>
  </div>
</template>

<script setup>
import { ref, defineProps, computed } from 'vue';
import Config from './components/Config.vue';
import Service from './components/Service.vue';

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

// 当前激活的选项卡
const activeTab = ref('config');

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