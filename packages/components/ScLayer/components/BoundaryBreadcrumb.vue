<template>
  <div class="boundary-breadcrumb" v-if="showBreadcrumb">
    <el-breadcrumb separator="/">
      <el-breadcrumb-item v-for="(item, index) in breadcrumbItems" :key="item.code" :class="{ 'is-last': index === breadcrumbItems.length - 1 }">
        <span v-if="index === breadcrumbItems.length - 1">{{ item.name }}</span>
        <a v-else @click="handleBreadcrumbClick(item)">{{ item.name }}</a>
      </el-breadcrumb-item>
    </el-breadcrumb>
    <div class="drill-buttons" v-if="showBackButton">
      <el-button size="small" @click="handleDrillUp">
        <template #icon>
          <IconifyIconOnline icon="ep:back" />
        </template>
        返回上级
      </el-button>
    </div>
  </div>
</template>

<script lang="ts">
import { IconifyIconOnline } from "@repo/components/ReIcon";
import { computed, defineComponent, PropType, ref, watch } from "vue";
import { BoundaryData, BoundaryLevel } from "../types/boundary";

export default defineComponent({
  name: "BoundaryBreadcrumb",
  components: { IconifyIconOnline },
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
  emits: ["drill-to", "drill-up"],
  setup(props, { emit }) {
    // 面包屑项目
    const breadcrumbItems = ref<BoundaryData[]>([]);

    // 监听历史和当前边界变化 - 使用版本号避免深度监听
    const boundaryVersion = computed(() => `${props.historyBoundaries?.length ?? 0}-${props.currentBoundary?.code ?? ""}`);
    watch(
      boundaryVersion,
      () => {
        const history = props.historyBoundaries;
        const current = props.currentBoundary;
        if (current) {
          // 构建面包屑路径
          breadcrumbItems.value = [
            // 添加一个根级别的面包屑项目
            { code: "100000", name: "中国", level: "country" as BoundaryLevel, coordinates: [] },
            // 添加历史记录中的项目
            ...history,
            // 添加当前边界
            current
          ];
        } else {
          // 如果没有当前边界，只显示根级别
          breadcrumbItems.value = [{ code: "100000", name: "中国", level: "country" as BoundaryLevel, coordinates: [] }];
        }
      },
      { immediate: true }
    );

    // 处理面包屑点击
    const handleBreadcrumbClick = (item: BoundaryData) => {
      emit("drill-to", item.code);
    };

    // 处理返回上级
    const handleDrillUp = () => {
      emit("drill-up");
    };

    return {
      breadcrumbItems,
      handleBreadcrumbClick,
      handleDrillUp
    };
  }
});
</script>

<style scoped lang="scss">
.boundary-breadcrumb {
  position: absolute;
  top: 20px;
  left: 20px;
  z-index: 1000;
  display: flex;
  align-items: center;
  background-color: var(--el-bg-color-overlay);
  padding: 8px 16px;
  border-radius: var(--el-border-radius-base);
  box-shadow: var(--el-box-shadow-light);
  gap: 16px;
  transition: all 0.3s;
  border: 1px solid var(--el-border-color-light);

  :deep(.el-breadcrumb__item) {
    .el-breadcrumb__inner {
      color: var(--el-text-color-regular);
      font-weight: normal;
      cursor: pointer;

      &:hover {
        color: var(--el-color-primary);
      }

      a {
        color: var(--el-text-color-regular);
        font-weight: normal;
        transition: color 0.3s;

        &:hover {
          color: var(--el-color-primary);
        }
      }
    }

    &:last-child {
      .el-breadcrumb__inner {
        color: var(--el-text-color-primary);
        font-weight: bold;
        cursor: default;

        &:hover {
          color: var(--el-text-color-primary);
        }
      }
    }
  }
}

.drill-buttons {
  display: flex;
  gap: 8px;
}
</style>
