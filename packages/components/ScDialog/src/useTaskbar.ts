/**
 * 任务栏管理器
 * 管理对话框的任务栏状态，实现类似 Windows 操作系统的任务栏功能
 * @author CH
 * @version 1.0.0
 * @since 2025-12-04
 */
import { ref, reactive, computed, type Ref, type ComputedRef } from "vue";

/**
 * 任务栏位置枚举
 */
export type TaskbarPosition = "top" | "bottom" | "left" | "right";

/**
 * 任务栏对齐方式枚举
 */
export type TaskbarAlignment = "start" | "center" | "end";

/**
 * 任务栏配置接口
 */
export interface TaskbarConfig {
  /** 是否启用任务栏 */
  enabled: boolean;
  /** 任务栏位置 */
  position: TaskbarPosition;
  /** 任务栏对齐方式（start=左侧/顶部, center=居中, end=右侧/底部） */
  alignment: TaskbarAlignment;
  /** 任务栏宽度（横向布局时，支持 px 和百分比） */
  width: string;
  /** 任务栏高度（纵向布局时，单位 px） */
  height: number;
  /** 是否永久显示（false 时自动隐藏） */
  alwaysVisible: boolean;
  /** 自动隐藏延迟（毫秒） */
  autoHideDelay: number;
  /** 是否启用分组自动合并 */
  groupCollapse: boolean;
  /** z-index 层级 */
  zIndex: number;
}

/**
 * 任务栏项接口
 */
export interface TaskbarItem {
  /** 对话框唯一标识 */
  id: string;
  /** 对话框标题 */
  title: string;
  /** 图标 */
  icon: string;
  /** 类型 */
  type: "default" | "info" | "success" | "warning" | "error";
  /** 分组标识 */
  group?: string;
  /** 是否激活 */
  active: boolean;
  /** 时间戳 */
  timestamp: number;
  /** 恢复对话框的回调 */
  restore: () => void;
  /** 关闭对话框的回调 */
  close: () => void;
}

/**
 * 分组项接口
 */
export interface TaskbarGroupItem {
  /** 分组标识 */
  groupId: string;
  /** 分组名称 */
  groupName: string;
  /** 分组图标 */
  groupIcon: string;
  /** 分组内的项 */
  items: TaskbarItem[];
  /** 是否展开 */
  expanded: boolean;
}

/**
 * 默认任务栏配置
 */
const defaultConfig: TaskbarConfig = {
  enabled: false,
  position: "bottom",
  alignment: "center",
  width: "auto",
  height: 48,
  alwaysVisible: true,
  autoHideDelay: 2000,
  groupCollapse: false,
  zIndex: 3000
};

/**
 * 任务栏状态管理
 */
const taskbarItems = ref<Map<string, TaskbarItem>>(new Map());
const taskbarConfig = reactive<TaskbarConfig>({ ...defaultConfig });
const isTaskbarVisible = ref(true);
const isHovered = ref(false);
let autoHideTimer: ReturnType<typeof setTimeout> | null = null;

/**
 * 更新任务栏配置
 * @param config 配置项
 */
function updateConfig(config: Partial<TaskbarConfig>): void {
  Object.assign(taskbarConfig, config);
}

/**
 * 获取任务栏配置
 * @returns 任务栏配置
 */
function getConfig(): TaskbarConfig {
  return { ...taskbarConfig };
}

/**
 * 添加任务栏项
 * @param item 任务栏项
 */
function addItem(item: TaskbarItem): void {
  taskbarItems.value.set(item.id, item);
}

/**
 * 移除任务栏项
 * @param id 对话框唯一标识
 */
function removeItem(id: string): void {
  taskbarItems.value.delete(id);
}

/**
 * 更新任务栏项
 * @param id 对话框唯一标识
 * @param updates 更新内容
 */
function updateItem(id: string, updates: Partial<TaskbarItem>): void {
  const item = taskbarItems.value.get(id);
  if (item) {
    Object.assign(item, updates);
  }
}

/**
 * 获取任务栏项
 * @param id 对话框唯一标识
 * @returns 任务栏项
 */
function getItem(id: string): TaskbarItem | undefined {
  return taskbarItems.value.get(id);
}

/**
 * 获取所有任务栏项
 * @returns 任务栏项列表
 */
function getAllItems(): TaskbarItem[] {
  return Array.from(taskbarItems.value.values());
}

/**
 * 获取分组后的任务栏项
 * @returns 分组后的任务栏项列表
 */
function getGroupedItems(): TaskbarGroupItem[] {
  if (!taskbarConfig.groupCollapse) {
    return [];
  }

  const groups = new Map<string, TaskbarItem[]>();
  const ungrouped: TaskbarItem[] = [];

  taskbarItems.value.forEach(item => {
    if (item.group) {
      const group = groups.get(item.group) || [];
      group.push(item);
      groups.set(item.group, group);
    } else {
      ungrouped.push(item);
    }
  });

  const result: TaskbarGroupItem[] = [];

  // 处理分组项
  groups.forEach((items, groupId) => {
    if (items.length > 1) {
      // 多个项合并为分组
      result.push({
        groupId,
        groupName: groupId,
        groupIcon: items[0]?.icon || "ep:folder",
        items: items.sort((a, b) => a.timestamp - b.timestamp),
        expanded: false
      });
    } else {
      // 单个项不合并
      ungrouped.push(...items);
    }
  });

  return result;
}

/**
 * 清空所有任务栏项
 */
function clearItems(): void {
  taskbarItems.value.clear();
}

/**
 * 设置激活项
 * @param id 对话框唯一标识
 */
function setActiveItem(id: string): void {
  taskbarItems.value.forEach((item, key) => {
    item.active = key === id;
  });
}

/**
 * 显示任务栏
 */
function showTaskbar(): void {
  if (autoHideTimer) {
    clearTimeout(autoHideTimer);
    autoHideTimer = null;
  }
  isTaskbarVisible.value = true;
}

/**
 * 隐藏任务栏
 */
function hideTaskbar(): void {
  if (!taskbarConfig.alwaysVisible && !isHovered.value) {
    isTaskbarVisible.value = false;
  }
}

/**
 * 启动自动隐藏计时器
 */
function startAutoHideTimer(): void {
  if (taskbarConfig.alwaysVisible) return;

  if (autoHideTimer) {
    clearTimeout(autoHideTimer);
  }

  autoHideTimer = setTimeout(() => {
    hideTaskbar();
    autoHideTimer = null;
  }, taskbarConfig.autoHideDelay);
}

/**
 * 设置悬停状态
 * @param hovered 是否悬停
 */
function setHovered(hovered: boolean): void {
  isHovered.value = hovered;
  if (hovered) {
    showTaskbar();
  } else {
    startAutoHideTimer();
  }
}

/**
 * 检查是否有任务栏项
 * @returns 是否有任务栏项
 */
function hasItems(): boolean {
  return taskbarItems.value.size > 0;
}

/**
 * 获取任务栏项数量
 * @returns 任务栏项数量
 */
function getItemCount(): number {
  return taskbarItems.value.size;
}

/**
 * 使用任务栏管理器
 * @returns 任务栏管理器接口
 */
export function useTaskbar() {
  /** 任务栏配置响应式对象 */
  const config: TaskbarConfig = taskbarConfig;

  /** 所有任务栏项 */
  const items: ComputedRef<TaskbarItem[]> = computed(() => getAllItems());

  /** 分组后的任务栏项 */
  const groupedItems: ComputedRef<TaskbarGroupItem[]> = computed(() => getGroupedItems());

  /** 未分组的任务栏项（分组启用时使用） */
  const ungroupedItems: ComputedRef<TaskbarItem[]> = computed(() => {
    if (!taskbarConfig.groupCollapse) {
      return getAllItems();
    }

    const grouped = new Set<string>();
    const groups = getGroupedItems();
    groups.forEach(group => {
      group.items.forEach(item => {
        grouped.add(item.id);
      });
    });

    return getAllItems().filter(item => !grouped.has(item.id));
  });

  /** 任务栏是否可见 */
  const visible: Ref<boolean> = isTaskbarVisible;

  /** 任务栏是否启用 */
  const enabled: ComputedRef<boolean> = computed(() => taskbarConfig.enabled);

  /** 是否有任务栏项 */
  const hasAnyItems: ComputedRef<boolean> = computed(() => hasItems());

  /** 任务栏项数量 */
  const itemCount: ComputedRef<number> = computed(() => getItemCount());

  return {
    // 状态
    config,
    items,
    groupedItems,
    ungroupedItems,
    visible,
    enabled,
    hasAnyItems,
    itemCount,
    // 配置
    updateConfig,
    getConfig,
    // 项管理
    addItem,
    removeItem,
    updateItem,
    getItem,
    getAllItems,
    clearItems,
    setActiveItem,
    // 可见性
    showTaskbar,
    hideTaskbar,
    setHovered
  };
}

/**
 * 任务栏尺寸样式计算
 * @param config 任务栏配置
 * @returns 样式对象
 */
export function getTaskbarStyle(config: TaskbarConfig): Record<string, string> {
  const style: Record<string, string> = {
    zIndex: String(config.zIndex)
  };

  const isHorizontal = config.position === "top" || config.position === "bottom";
  const alignment = config.alignment || "center";

  // 根据位置设置样式
  switch (config.position) {
    case "top":
      style.top = "0";
      style.height = `${config.height}px`;
      // 水平对齐
      if (alignment === "start") {
        style.left = "0";
      } else if (alignment === "end") {
        style.right = "0";
      } else {
        style.left = "50%";
        style.transform = "translateX(-50%)";
      }
      // 宽度：auto 时自适应，否则使用指定宽度
      if (config.width !== "auto" && config.width !== "100%") {
        style.width = config.width;
      }
      break;
    case "bottom":
      style.bottom = "0";
      style.height = `${config.height}px`;
      // 水平对齐
      if (alignment === "start") {
        style.left = "0";
      } else if (alignment === "end") {
        style.right = "0";
      } else {
        style.left = "50%";
        style.transform = "translateX(-50%)";
      }
      // 宽度：auto 时自适应，否则使用指定宽度
      if (config.width !== "auto" && config.width !== "100%") {
        style.width = config.width;
      }
      break;
    case "left":
      style.left = "0";
      style.width = `${config.height}px`;
      // 垂直对齐
      if (alignment === "start") {
        style.top = "0";
      } else if (alignment === "end") {
        style.bottom = "0";
      } else {
        style.top = "50%";
        style.transform = "translateY(-50%)";
      }
      break;
    case "right":
      style.right = "0";
      style.width = `${config.height}px`;
      // 垂直对齐
      if (alignment === "start") {
        style.top = "0";
      } else if (alignment === "end") {
        style.bottom = "0";
      } else {
        style.top = "50%";
        style.transform = "translateY(-50%)";
      }
      break;
  }

  return style;
}

export default useTaskbar;
