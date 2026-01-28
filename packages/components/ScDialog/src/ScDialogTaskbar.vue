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
            <div
              v-for="group in groupedItems"
              :key="group.groupId"
              class="sc-dialog-taskbar__group"
              :class="{ 'is-expanded': group.expanded }"
              @mouseenter="handleGroupMouseEnter(group)"
              @mouseleave="handleGroupMouseLeave"
            >
              <!-- 分组头部 -->
              <div class="sc-dialog-taskbar__group-header" @click="handleGroupClick(group)">
                <!-- 重叠图标效果 -->
                <div class="sc-dialog-taskbar__group-icons" :class="{ 'has-multiple': group.items.length > 1 }">
                  <template v-for="(item, index) in group.items.slice(0, 3)" :key="item.id">
                    <div
                      class="sc-dialog-taskbar__group-icon-wrapper"
                      :class="[`sc-dialog-taskbar__group-icon-wrapper--${item.type}`]"
                      :style="{
                        zIndex: 3 - index,
                        marginLeft: index > 0 ? '-8px' : '0',
                        transform: `scale(${1 - index * 0.06})`,
                        opacity: 1 - index * 0.12
                      }"
                    >
                      <IconifyIconOnline :icon="item.icon" class="sc-dialog-taskbar__group-icon" />
                    </div>
                  </template>
                </div>
                <!-- 分组合并开启时只显示图标，不显示分组名 -->
                <!-- 数量徽章，预留给通知使用 -->
                <!-- <span v-if="group.notificationCount" class="sc-dialog-taskbar__group-badge">
                  {{ group.notificationCount }}
                </span> -->
              </div>

              <!-- 分组预览弹窗（类似 Windows 任务栏） -->
              <Transition name="taskbar-preview">
                <div v-if="group.expanded" class="sc-dialog-taskbar__preview" :class="[`sc-dialog-taskbar__preview--${position}`, { 'is-vertical': isVertical }]">
                  <div class="sc-dialog-taskbar__preview-header">
                    <span>{{ group.groupName }}</span>
                    <span class="sc-dialog-taskbar__preview-count">{{ group.items.length }} 个窗口</span>
                  </div>
                  <div class="sc-dialog-taskbar__preview-list">
                    <div v-for="item in group.items" :key="item.id" class="sc-dialog-taskbar__preview-item" :class="[`sc-dialog-taskbar__preview-item--${item.type}`]" @click="handleItemClick(item)">
                      <div class="sc-dialog-taskbar__preview-item-content">
                        <IconifyIconOnline :icon="item.icon" class="sc-dialog-taskbar__preview-item-icon" />
                        <span class="sc-dialog-taskbar__preview-item-title">{{ item.title }}</span>
                      </div>
                      <button class="sc-dialog-taskbar__preview-item-close" @click.stop="handleItemClose(item)" title="关闭">
                        <IconifyIconOnline icon="ep:close" />
                      </button>
                    </div>
                  </div>
                </div>
              </Transition>
            </div>
          </template>

          <!-- 未分组项 / 所有项 -->
          <div v-for="item in displayItems" :key="item.id" class="sc-dialog-taskbar__single-item" @mouseenter="handleSingleItemMouseEnter(item)" @mouseleave="handleSingleItemMouseLeave">
            <div class="sc-dialog-taskbar__item" :class="[`sc-dialog-taskbar__item--${item.type}`, { 'is-active': item.active }]" @click="handleItemClick(item)">
              <IconifyIconOnline :icon="item.icon" class="sc-dialog-taskbar__item-icon" />
              <span v-if="!isVertical && !groupCollapse" class="sc-dialog-taskbar__item-title">{{ item.title }}</span>
              <button class="sc-dialog-taskbar__item-close" @click.stop="handleItemClose(item)" title="关闭">
                <IconifyIconOnline icon="ep:close" />
              </button>
            </div>

            <!-- 单项悬停预览 -->
            <Transition name="taskbar-preview">
              <div v-if="hoveredItemId === item.id" class="sc-dialog-taskbar__preview" :class="[`sc-dialog-taskbar__preview--${position}`]">
                <div class="sc-dialog-taskbar__preview-list">
                  <div class="sc-dialog-taskbar__preview-item" :class="[`sc-dialog-taskbar__preview-item--${item.type}`]" @click="handleItemClick(item)">
                    <div class="sc-dialog-taskbar__preview-item-content">
                      <IconifyIconOnline :icon="item.icon" class="sc-dialog-taskbar__preview-item-icon" />
                      <span class="sc-dialog-taskbar__preview-item-title">{{ item.title }}</span>
                    </div>
                    <button class="sc-dialog-taskbar__preview-item-close" @click.stop="handleItemClose(item)" title="关闭">
                      <IconifyIconOnline icon="ep:close" />
                    </button>
                  </div>
                </div>
              </div>
            </Transition>
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
import { useTaskbar, getTaskbarStyle, type TaskbarPosition, type TaskbarAlignment, type TaskbarItem, type TaskbarGroupItem } from "./useTaskbar";

const props = withDefaults(
  defineProps<{
    /** 是否启用任务栏 */
    enabled?: boolean;
    /** 任务栏位置 */
    position?: TaskbarPosition;
    /** 任务栏对齐方式（start=左侧/顶部, center=居中, end=右侧/底部） */
    alignment?: TaskbarAlignment;
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
    alignment: "center",
    width: "auto",
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
const hoveredItemId = ref<string | null>(null);

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
    alignment: props.alignment,
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
  // 必须启用且有项目才显示
  if (!props.enabled || !taskbar.hasAnyItems.value) {
    return false;
  }
  // 永久显示模式或者悬停时显示
  return props.alwaysVisible || isHovering.value;
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

  // 只要有分组就显示，即使只有一个项目
  groupMap.forEach((items, groupId) => {
    groups.push({
      groupId,
      groupName: groupId,
      groupIcon: items[0]?.icon || "ep:folder",
      items: items.sort((a, b) => a.timestamp - b.timestamp),
      expanded: expandedGroups.value.has(groupId)
    });
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
    alignment: props.alignment,
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

// 分组预览延迟关闭定时器
let groupHideTimer: ReturnType<typeof setTimeout> | null = null;

/**
 * 切换分组展开状态
 * @param group 分组项
 */
function toggleGroup(group: TaskbarGroupItem): void {
  if (expandedGroups.value.has(group.groupId)) {
    expandedGroups.value.delete(group.groupId);
  } else {
    // 关闭其他分组
    expandedGroups.value.clear();
    expandedGroups.value.add(group.groupId);
  }
}

/**
 * 处理分组点击
 * 如果只有一个项目，直接恢复；否则显示/隐藏预览
 * @param group 分组项
 */
function handleGroupClick(group: TaskbarGroupItem): void {
  if (group.items.length === 1) {
    // 只有一个项目时，直接恢复
    handleItemClick(group.items[0]);
  } else {
    // 多个项目时，切换预览显示
    toggleGroup(group);
  }
}

/**
 * 处理分组鼠标进入
 * @param group 分组项
 */
function handleGroupMouseEnter(group: TaskbarGroupItem): void {
  // 清除隐藏定时器
  if (groupHideTimer) {
    clearTimeout(groupHideTimer);
    groupHideTimer = null;
  }
  // 悬停时自动展开预览（无论有多少项目）
  if (!expandedGroups.value.has(group.groupId)) {
    // 关闭其他分组
    expandedGroups.value.clear();
    expandedGroups.value.add(group.groupId);
  }
}

/**
 * 处理分组鼠标离开
 */
function handleGroupMouseLeave(): void {
  // 延迟隐藏预览，给用户时间移动到预览窗口
  groupHideTimer = setTimeout(() => {
    expandedGroups.value.clear();
  }, 300);
}

// 单项悬停延迟关闭定时器
let singleItemHideTimer: ReturnType<typeof setTimeout> | null = null;

/**
 * 处理单个项目鼠标进入
 * @param item 任务栏项
 */
function handleSingleItemMouseEnter(item: TaskbarItem): void {
  // 清除隐藏定时器
  if (singleItemHideTimer) {
    clearTimeout(singleItemHideTimer);
    singleItemHideTimer = null;
  }
  // 显示预览
  hoveredItemId.value = item.id;
}

/**
 * 处理单个项目鼠标离开
 */
function handleSingleItemMouseLeave(): void {
  // 延迟隐藏预览
  singleItemHideTimer = setTimeout(() => {
    hoveredItemId.value = null;
  }, 300);
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
  background: rgba(255, 255, 255, 0.85);
  backdrop-filter: blur(20px);
  border: 1px solid rgba(0, 0, 0, 0.08);
  box-shadow:
    0 -4px 24px rgba(0, 0, 0, 0.12),
    0 0 0 1px rgba(255, 255, 255, 0.5) inset;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  overflow: visible;

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

  // 对齐方式相关的圆角调整
  &--bottom,
  &--top {
    justify-content: center;
  }

  &--left,
  &--right {
    justify-content: center;
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
    // 使用 clip 代替 overflow，让预览窗口可以超出容器
    overflow: visible;

    &.is-vertical {
      flex-direction: column;
      overflow: visible;
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

  // 单个项目容器（用于悬停预览）
  &__single-item {
    position: relative;

    // 确保预览窗口可以显示
    &:hover {
      z-index: 10;
    }
  }

  // 任务栏项
  &__item {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 8px 14px;
    background: rgba(0, 0, 0, 0.04);
    border-radius: 10px;
    cursor: pointer;
    transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
    white-space: nowrap;
    min-width: 40px;
    position: relative;
    border: 1px solid transparent;

    &:hover {
      background: rgba(0, 0, 0, 0.08);
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);

      .sc-dialog-taskbar__item-close {
        opacity: 1;
      }
    }

    &.is-active {
      background: linear-gradient(135deg, rgba(99, 102, 241, 0.15), rgba(99, 102, 241, 0.25));
      border-bottom: 3px solid var(--el-color-primary);
      box-shadow: 0 2px 8px rgba(99, 102, 241, 0.2);
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

    // 确保预览窗口可以显示
    &:hover {
      z-index: 10;
    }

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

    // 重叠图标容器
    &-icons {
      display: flex;
      align-items: center;
      position: relative;
      margin-right: 4px;

      &.has-multiple {
        margin-right: 8px;
      }
    }

    // 图标包装器
    &-icon-wrapper {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 24px;
      height: 24px;
      background: var(--el-bg-color);
      border: 2px solid var(--el-border-color-lighter);
      border-radius: 5px;
      position: relative;
      transition: all 0.2s ease;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);

      // 类型颜色
      &--info {
        border-color: var(--el-color-info-light-5);
        background: var(--el-color-info-light-9);
      }
      &--success {
        border-color: var(--el-color-success-light-5);
        background: var(--el-color-success-light-9);
      }
      &--warning {
        border-color: var(--el-color-warning-light-5);
        background: var(--el-color-warning-light-9);
      }
      &--error {
        border-color: var(--el-color-danger-light-5);
        background: var(--el-color-danger-light-9);
      }
    }

    &-icon {
      font-size: 16px;
      color: var(--el-text-color-primary);
    }

    &-name {
      font-size: 13px;
      color: var(--el-text-color-regular);
    }

    // 通知徽章（预留）
    &-badge {
      position: absolute;
      top: -4px;
      right: -4px;
      display: flex;
      align-items: center;
      justify-content: center;
      min-width: 16px;
      height: 16px;
      padding: 0 4px;
      background: var(--el-color-danger);
      color: #fff;
      font-size: 10px;
      font-weight: 600;
      border-radius: 8px;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.2);
    }
  }

  // 预览弹窗（类似 Windows 任务栏预览）
  &__preview {
    position: absolute;
    background: var(--el-bg-color);
    border: 1px solid var(--el-border-color-lighter);
    border-radius: 8px;
    box-shadow: 0 -8px 24px rgba(0, 0, 0, 0.2);
    min-width: 280px;
    max-width: 400px;
    z-index: 9999;

    // 底部任务栏时，预览在上方
    &--bottom {
      bottom: calc(100% + 8px);
      left: 50%;
      transform: translateX(-50%);
    }

    // 顶部任务栏时，预览在下方
    &--top {
      top: calc(100% + 8px);
      left: 50%;
      transform: translateX(-50%);
    }

    // 左侧任务栏时，预览在右侧
    &--left {
      left: calc(100% + 8px);
      top: 0;
    }

    // 右侧任务栏时，预览在左侧
    &--right {
      right: calc(100% + 8px);
      top: 0;
    }

    &-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 12px 16px;
      border-bottom: 1px solid var(--el-border-color-lighter);
      font-size: 14px;
      font-weight: 500;
      color: var(--el-text-color-primary);
    }

    &-count {
      font-size: 12px;
      font-weight: normal;
      color: var(--el-text-color-secondary);
    }

    &-list {
      padding: 10px;
      display: flex;
      flex-direction: column;
      gap: 6px;
      max-height: 400px;
      overflow-y: auto;

      &::-webkit-scrollbar {
        width: 4px;
      }

      &::-webkit-scrollbar-thumb {
        background: var(--el-border-color);
        border-radius: 2px;
      }
    }

    &-item {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 12px 14px;
      background: var(--el-fill-color-light);
      border-radius: 8px;
      cursor: pointer;
      transition: all 0.2s ease;

      &:hover {
        background: var(--el-fill-color);

        .sc-dialog-taskbar__preview-item-close {
          opacity: 1;
        }
      }

      &-content {
        display: flex;
        align-items: center;
        gap: 10px;
        flex: 1;
        overflow: hidden;
      }

      &-icon {
        font-size: 22px;
        color: var(--el-text-color-primary);
        flex-shrink: 0;
      }

      &-title {
        font-size: 14px;
        color: var(--el-text-color-regular);
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }

      &-close {
        display: flex;
        align-items: center;
        justify-content: center;
        width: 24px;
        height: 24px;
        padding: 0;
        background: none;
        border: none;
        border-radius: 4px;
        cursor: pointer;
        color: var(--el-text-color-secondary);
        opacity: 0;
        transition: all 0.2s ease;
        flex-shrink: 0;

        &:hover {
          background: var(--el-color-danger-light-9);
          color: var(--el-color-danger);
        }
      }

      // 类型样式
      &--info .sc-dialog-taskbar__preview-item-icon {
        color: var(--el-color-info);
      }
      &--success .sc-dialog-taskbar__preview-item-icon {
        color: var(--el-color-success);
      }
      &--warning .sc-dialog-taskbar__preview-item-icon {
        color: var(--el-color-warning);
      }
      &--error .sc-dialog-taskbar__preview-item-icon {
        color: var(--el-color-danger);
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

// 预览弹窗动画
.taskbar-preview-enter-active,
.taskbar-preview-leave-active {
  transition: all 0.2s ease;
}

.taskbar-preview-enter-from,
.taskbar-preview-leave-to {
  opacity: 0;
  transform: scale(0.95);
}
</style>
