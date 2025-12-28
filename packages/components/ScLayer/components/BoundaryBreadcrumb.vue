<template>
  <div class="boundary-breadcrumb" v-if="showBreadcrumb">
    <el-breadcrumb separator="/">
      <el-breadcrumb-item 
        v-for="(item, index) in breadcrumbItems" 
        :key="item.code"
        :class="{'is-last': index === breadcrumbItems.length - 1}"
      >
        <span v-if="index === breadcrumbItems.length - 1">{{ item.name }}</span>
        <a v-else @click="handleBreadcrumbClick(item)">{{ item.name }}</a>
      </el-breadcrumb-item>
    </el-breadcrumb>
    <div class="drill-buttons" v-if="showBackButton">
      <el-button size="small" @click="handleDrillUp" icon="el-icon-back">返回上级</el-button>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, ref, PropType, watch } from 'vue';
import { BoundaryData, BoundaryLevel } from '../types/boundary';

export default defineComponent({
  name: 'BoundaryBreadcrumb',
  props: {
    currentBoundary: {
      type: Object as PropType<BoundaryData | null>,
      default: null
    },
    historyBoundaries: {
      type: Array as PropType<BoundaryData[]>,
      default: () => []
    },
    showBreadcrumb: {
      type: Boolean,
      default: true
    },
    showBackButton: {
      type: Boolean,
      default: true
    }
  },
  emits: ['drill-to', 'drill-up'],
  setup(props, { emit }) {
    // 面包屑项目
    const breadcrumbItems = ref<BoundaryData[]>([]);

    // 监听历史和当前边界变化 - 使用版本号避免深度监听
    const boundaryVersion = computed(() => 
      `${props.historyBoundaries?.length ?? 0}-${props.currentBoundary?.code ?? ''}`
    );
    watch(
      boundaryVersion,
      () => {
        const history = props.historyBoundaries;
        const current = props.currentBoundary;
        if (current) {
          // 构建面包屑路径
          breadcrumbItems.value = [
            // 添加一个根级别的面包屑项目
            { code: '100000', name: '中国', level: 'country' as BoundaryLevel, coordinates: [] },
            // 添加历史记录中的项目
            ...history,
            // 添加当前边界
            current
          ];
        } else {
          // 如果没有当前边界，只显示根级别
          breadcrumbItems.value = [
            { code: '100000', name: '中国', level: 'country' as BoundaryLevel, coordinates: [] }
          ];
        }
      },
      { immediate: true }
    );

    // 处理面包屑点击
    const handleBreadcrumbClick = (item: BoundaryData) => {
      emit('drill-to', item.code);
    };

    // 处理返回上级
    const handleDrillUp = () => {
      emit('drill-up');
    };

    return {
      breadcrumbItems,
      handleBreadcrumbClick,
      handleDrillUp
    };
  }
});
</script>

<style lang="scss" scoped>
.boundary-breadcrumb {
  display: flex;
  align-items: center;
  padding: 8px 16px;
  background-color: #f5f7fa;
  border-radius: 4px;
  margin-bottom: 16px;
  
  .el-breadcrumb {
    flex: 1;
  }
  
  a {
    cursor: pointer;
    color: #409eff;
    
    &:hover {
      color: #66b1ff;
    }
  }
  
  .drill-buttons {
    margin-left: 16px;
  }
  
  :deep(.is-last .el-breadcrumb__inner) {
    font-weight: bold;
    color: var(--el-text-color-primary);
  }
}
</style> 