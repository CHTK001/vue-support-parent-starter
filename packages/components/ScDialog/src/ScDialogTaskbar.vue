<template>
  <Teleport to="body">
    <Transition :name="transitionName">
      <div
        v-if="shouldShow"
        ref="taskbarRef"
        class="sc-dialog-taskbar"
        :class="[
          `sc-dialog-taskbar--${position}`,
          {
            'is-vertical': isVertical,
            'is-hovering': isHovering,
            'is-auto-hide': !alwaysVisible
          }
        ]"
        :style="taskbarStyle"
        @mouseenter="handleMouseEnter"
        @mouseleave="handleMouseLeave"
      >
        <!-- 任务栏内容区域 -->
        <div class="sc-dialog-taskbar__content" :class="{ 'is-vertical': isVertical }">
          <!-- 分组项 -->
          <template v-if="groupCollapse">
            <div v-for="group in groupedItems" :key="group.groupId" class="sc-dialog-taskbar__group" :class="{ 'is-expanded': group.expanded }">
              <!-- 分组头部 -->
              <div class="sc-dialog-taskbar__group-header" @click="toggleGroup(group)">
                <IconifyIconOnline :icon="group.groupIcon" class="sc-dialog-taskbar__group-icon" />
                <span v-if="!isVertical" class="sc-dialog-taskbar__group-name">{{ group.groupName }}</span>
                <span v-if="group.items.length > 1" class="sc-dialog-taskbar__group-count">
                  {{ group.items.length }}
                </span>
              </div>

              <!-- 分组展开的子项 -->
              <Transition name="taskbar-group">
                <div v-if="group.expanded" class="sc-dialog-taskbar__group-items" :class="{ 'is-vertical': isVertical }">
                  <div
                    v-for="item in group.items"
                    :key="item.id"
                    class="sc-dialog-taskbar__item"
                    :class="[`sc-dialog-taskbar__item--${item.type}`, { 'is-active': item.active }]"
                    :title="item.title"
                    @click="handleItemClick(item)"
                  >
                    <IconifyIconOnline :icon="item.icon" class="sc-dialog-taskbar__item-icon" />
                    <span v-if="!isVertical" class="sc-dialog-taskbar__item-title">{{ item.title }}</span>
                    <button class="sc-dialog-taskbar__item-close" @click.stop="handleItemClose(item)" title="关闭">
                      <IconifyIconOnline icon="ep:close" />
                    </button>
                  </div>
                </div>
              </Transition>
            </div>
          </template>

          <!-- 未分组项 / 所有项 -->
          <div
            v-for="item in displayItems"
            :key="item.id"
            class="sc-dialog-taskbar__item"
            :class="[`sc-dialog-taskbar__item--${item.type}`, { 'is-active': item.active }]"
            :title="item.title"
            @click="handleItemClick(item)"
          >
            <IconifyIconOnline :icon="item.icon" class="sc-dialog-taskbar__item-icon" />
            <span v-if="!isVertical" class="sc-dialog-taskbar__item-title">{{ item.title }}</span>
            <button class="sc-dialog-taskbar__item-close" @click.stop="handleItemClose(item)" title="关闭">
              <IconifyIconOnline icon="ep:close" />
            </button>
          </div>
        </div>

        <!-- 自动隐藏时的触发条 -->
        <div v-if="!alwaysVisible" class="sc-dialog-taskbar__trigger" :class="`sc-dialog-taskbar__trigger--${position}`" />
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
/**
 * 对话框任务栏组件
 * 用于展示最小化的对话框，类似 Windows 操作系统任务栏
 * @author CH
 * @version 1.0.0
 * @since 2025-12-04
 */
import { ref, computed, watch, onMounted, onUnmounted, type PropType } from "vue";
import { useTaskbar, getTaskbarStyle, type TaskbarPosition, type TaskbarItem, type TaskbarGroupItem } from "./useTaskbar";

const props = withDefaults(
  defineProps<{
    /** 是否启用任务栏 */
    enabled?: boolean;
    /** 任务栏位置 */
    position?: TaskbarPosition;
    /** 任务栏宽度（横向布局时，支持 px 和百分比） */
    width?: string;
    /** 任务栏高度（纵向布局时，单位 px） */
    height?: number;
    /** 是否永久显示（false 时自动隐藏） */
    alwaysVisible?: boolean;
    /** 自动隐藏延迟（毫秒） */
    autoHideDelay?: number;
    /** 是否启用分组自动合并 */
    groupCollapse?: boolean;
    /** z-index 层级 */
    zIndex?: number;
  }>(),
  {
    enabled: true,
    position: "bottom",
    width: "100%",
    height: 48,
    alwaysVisible: true,
    autoHideDelay: 2000,
    groupCollapse: false,
    zIndex: 3000
  }
);

const emit = defineEmits<{
  /** 点击任务栏项 */
  itemClick: [item: TaskbarItem];
  /** 关闭任务栏项 */
  itemClose: [item: TaskbarItem];
  /** 任务栏显示状态变化 */
  visibilityChange: [visible: boolean];
}>();

// 使用任务栏管理器
const taskbar = useTaskbar();

// 状态
const taskbarRef = ref<HTMLElement | null>(null);
const isHovering = ref(false);
const expandedGroups = ref<Set<string>>(new Set());

// 是否为垂直布局
const isVertical = computed(() => props.position === "left" || props.position === "right");

// 过渡动画名称
const transitionName = computed(() => {
  switch (props.position) {
    case "top":
      return "taskbar-slide-top";
    case "bottom":
      return "taskbar-slide-bottom";
    case "left":
      return "taskbar-slide-left";
    case "right":
      return "taskbar-slide-right";
    default:
      return "taskbar-slide-bottom";
  }
});

// 任务栏样式
const taskbarStyle = computed(() => {
  return getTaskbarStyle({
    enabled: props.enabled,
    position: props.position,
    width: props.width,
    height: props.height,
    alwaysVisible: props.alwaysVisible,
    autoHideDelay: props.autoHideDelay,
    groupCollapse: props.groupCollapse,
    zIndex: props.zIndex
  });
});

// 是否应该显示任务栏
const shouldShow = computed(() => {
  return props.enabled && (taskbar.hasAnyItems.value || isHovering.value);
});

// 分组后的任务栏项
const groupedItems = computed(() => {
  if (!props.groupCollapse) return [];

  const groups: TaskbarGroupItem[] = [];
  const groupMap = new Map<string, TaskbarItem[]>();

  taskbar.items.value.forEach(item => {
    if (item.group) {
      const group = groupMap.get(item.group) || [];
      group.push(item);
      groupMap.set(item.group, group);
    }
  });

  groupMap.forEach((items, groupId) => {
    if (items.length > 1) {
      groups.push({
        groupId,
        groupName: groupId,
        groupIcon: items[0]?.icon || "ep:folder",
        items: items.sort((a, b) => a.timestamp - b.timestamp),
        expanded: expandedGroups.value.has(groupId)
      });
    }
  });

  return groups;
});

// 显示的项（未分组或分组关闭时）
const displayItems = computed(() => {
  if (!props.groupCollapse) {
    return taskbar.items.value;
  }

  // 获取已分组的项 ID
  const groupedIds = new Set<string>();
  groupedItems.value.forEach(group => {
    group.items.forEach(item => {
      groupedIds.add(item.id);
    });
  });

  // 返回未分组的项
  return taskbar.items.value.filter(item => !groupedIds.has(item.id));
});

// 同步配置到任务栏管理器
watch(
  () => ({
    enabled: props.enabled,
    position: props.position,
    width: props.width,
    height: props.height,
    alwaysVisible: props.alwaysVisible,
    autoHideDelay: props.autoHideDelay,
    groupCollapse: props.groupCollapse,
    zIndex: props.zIndex
  }),
  config => {
    taskbar.updateConfig(config);
  },
  { immediate: true }
);

// 监听显示状态变化
watch(
  () => taskbar.visible.value,
  visible => {
    emit("visibilityChange", visible);
  }
);

/**
 * 切换分组展开状态
 * @param group 分组项
 */
function toggleGroup(group: TaskbarGroupItem): void {
  if (expandedGroups.value.has(group.groupId)) {
    expandedGroups.value.delete(group.groupId);
  } else {
    expandedGroups.value.add(group.groupId);
  }
}

/**
 * 处理鼠标进入
 */
function handleMouseEnter(): void {
  isHovering.value = true;
  taskbar.setHovered(true);
}

/**
 * 处理鼠标离开
 */
function handleMouseLeave(): void {
  isHovering.value = false;
  taskbar.setHovered(false);
}

/**
 * 处理任务栏项点击
 * @param item 任务栏项
 */
function handleItemClick(item: TaskbarItem): void {
  emit("itemClick", item);
  item.restore();
  taskbar.removeItem(item.id);
}

/**
 * 处理任务栏项关闭
 * @param item 任务栏项
 */
function handleItemClose(item: TaskbarItem): void {
  emit("itemClose", item);
  item.close();
  taskbar.removeItem(item.id);
}

// 暴露方法
defineExpose({
  /** 添加任务栏项 */
  addItem: taskbar.addItem,
  /** 移除任务栏项 */
  removeItem: taskbar.removeItem,
  /** 更新任务栏项 */
  updateItem: taskbar.updateItem,
  /** 获取任务栏项 */
  getItem: taskbar.getItem,
  /** 获取所有任务栏项 */
  getAllItems: taskbar.getAllItems,
  /** 清空任务栏 */
  clearItems: taskbar.clearItems,
  /** 显示任务栏 */
  show: taskbar.showTaskbar,
  /** 隐藏任务栏 */
  hide: taskbar.hideTaskbar
});
</script>

<style lang="scss">
// 任务栏主样式
.sc-dialog-taskbar {
  position: fixed;
  display: flex;
  align-items: center;
  background: var(--el-bg-color);
  border: 1px solid var(--el-border-color-lighter);
  box-shadow: 0 -2px 12px rgba(0, 0, 0, 0.1);
  transition: all 0.3s ease;

  // 底部位置
  &--bottom {
    flex-direction: row;
    border-radius: 8px 8px 0 0;
    border-bottom: none;
    box-shadow: 0 -4px 12px rgba(0, 0, 0, 0.1);
  }

  // 顶部位置
  &--top {
    flex-direction: row;
    border-radius: 0 0 8px 8px;
    border-top: none;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  }

  // 左侧位置
  &--left {
    flex-direction: column;
    border-radius: 0 8px 8px 0;
    border-left: none;
    box-shadow: 4px 0 12px rgba(0, 0, 0, 0.1);
  }

  // 右侧位置
  &--right {
    flex-direction: column;
    border-radius: 8px 0 0 8px;
    border-right: none;
    box-shadow: -4px 0 12px rgba(0, 0, 0, 0.1);
  }

  // 自动隐藏状态
  &.is-auto-hide:not(.is-hovering) {
    opacity: 0.3;

    &:hover {
      opacity: 1;
    }
  }

  // 内容区域
  &__content {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 6px 12px;
    flex: 1;
    overflow-x: auto;
    overflow-y: hidden;

    &.is-vertical {
      flex-direction: column;
      overflow-x: hidden;
      overflow-y: auto;
      padding: 12px 6px;
    }

    // 滚动条样式
    &::-webkit-scrollbar {
      width: 4px;
      height: 4px;
    }

    &::-webkit-scrollbar-thumb {
      background: var(--el-border-color);
      border-radius: 2px;
    }

    &::-webkit-scrollbar-track {
      background: transparent;
    }
  }

  // 任务栏项
  &__item {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 6px 12px;
    background: var(--el-fill-color-light);
    border-radius: 6px;
    cursor: pointer;
    transition: all 0.2s ease;
    white-space: nowrap;
    min-width: 36px;
    position: relative;

    &:hover {
      background: var(--el-fill-color);

      .sc-dialog-taskbar__item-close {
        opacity: 1;
      }
    }

    &.is-active {
      background: var(--el-color-primary-light-9);
      border-bottom: 2px solid var(--el-color-primary);
    }

    // 图标
    &-icon {
      font-size: 18px;
      color: var(--el-text-color-primary);
    }

    // 标题
    &-title {
      font-size: 13px;
      color: var(--el-text-color-regular);
      max-width: 120px;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    // 关闭按钮
    &-close {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 16px;
      height: 16px;
      padding: 0;
      background: none;
      border: none;
      border-radius: 4px;
      cursor: pointer;
      color: var(--el-text-color-secondary);
      opacity: 0;
      transition: all 0.2s ease;
      margin-left: 4px;

      &:hover {
        background: var(--el-color-danger-light-9);
        color: var(--el-color-danger);
      }
    }

    // 类型样式
    &--info &-icon {
      color: var(--el-color-info);
    }
    &--success &-icon {
      color: var(--el-color-success);
    }
    &--warning &-icon {
      color: var(--el-color-warning);
    }
    &--error &-icon {
      color: var(--el-color-danger);
    }
  }

  // 分组
  &__group {
    position: relative;

    &-header {
      display: flex;
      align-items: center;
      gap: 6px;
      padding: 6px 12px;
      background: var(--el-fill-color-light);
      border-radius: 6px;
      cursor: pointer;
      transition: all 0.2s ease;

      &:hover {
        background: var(--el-fill-color);
      }
    }

    &-icon {
      font-size: 18px;
      color: var(--el-text-color-primary);
    }

    &-name {
      font-size: 13px;
      color: var(--el-text-color-regular);
    }

    &-count {
      display: flex;
      align-items: center;
      justify-content: center;
      min-width: 18px;
      height: 18px;
      padding: 0 4px;
      background: var(--el-color-primary);
      color: #fff;
      font-size: 11px;
      border-radius: 9px;
    }

    &-items {
      position: absolute;
      bottom: 100%;
      left: 0;
      display: flex;
      flex-direction: column;
      gap: 4px;
      padding: 8px;
      background: var(--el-bg-color);
      border: 1px solid var(--el-border-color-lighter);
      border-radius: 8px;
      box-shadow: 0 -4px 12px rgba(0, 0, 0, 0.1);
      margin-bottom: 4px;
      min-width: 200px;

      &.is-vertical {
        left: 100%;
        bottom: auto;
        top: 0;
        margin-bottom: 0;
        margin-left: 4px;
      }
    }
  }

  // 触发条（自动隐藏时）
  &__trigger {
    position: absolute;
    background: var(--el-color-primary);
    opacity: 0.5;
    transition: opacity 0.2s ease;

    &:hover {
      opacity: 1;
    }

    &--bottom {
      bottom: 0;
      left: 50%;
      transform: translateX(-50%);
      width: 60px;
      height: 4px;
      border-radius: 2px 2px 0 0;
    }

    &--top {
      top: 0;
      left: 50%;
      transform: translateX(-50%);
      width: 60px;
      height: 4px;
      border-radius: 0 0 2px 2px;
    }

    &--left {
      left: 0;
      top: 50%;
      transform: translateY(-50%);
      width: 4px;
      height: 60px;
      border-radius: 0 2px 2px 0;
    }

    &--right {
      right: 0;
      top: 50%;
      transform: translateY(-50%);
      width: 4px;
      height: 60px;
      border-radius: 2px 0 0 2px;
    }
  }
}

// 过渡动画 - 底部滑入
.taskbar-slide-bottom-enter-active,
.taskbar-slide-bottom-leave-active {
  transition: all 0.3s ease;
}

.taskbar-slide-bottom-enter-from,
.taskbar-slide-bottom-leave-to {
  transform: translateY(100%);
  opacity: 0;
}

// 过渡动画 - 顶部滑入
.taskbar-slide-top-enter-active,
.taskbar-slide-top-leave-active {
  transition: all 0.3s ease;
}

.taskbar-slide-top-enter-from,
.taskbar-slide-top-leave-to {
  transform: translateY(-100%);
  opacity: 0;
}

// 过渡动画 - 左侧滑入
.taskbar-slide-left-enter-active,
.taskbar-slide-left-leave-active {
  transition: all 0.3s ease;
}

.taskbar-slide-left-enter-from,
.taskbar-slide-left-leave-to {
  transform: translateX(-100%);
  opacity: 0;
}

// 过渡动画 - 右侧滑入
.taskbar-slide-right-enter-active,
.taskbar-slide-right-leave-active {
  transition: all 0.3s ease;
}

.taskbar-slide-right-enter-from,
.taskbar-slide-right-leave-to {
  transform: translateX(100%);
  opacity: 0;
}

// 分组展开动画
.taskbar-group-enter-active,
.taskbar-group-leave-active {
  transition: all 0.2s ease;
}

.taskbar-group-enter-from,
.taskbar-group-leave-to {
  opacity: 0;
  transform: translateY(10px);
}
</style>
