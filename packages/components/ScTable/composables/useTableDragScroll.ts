/**
 * useTableDragScroll - 表格鼠标拖拽滚动 composable
 * 支持鼠标按住左右拖动进行水平滚动
 * @author AI Assistant
 * @version 1.0.0
 * @since 2025-12-29
 */
import { ref, onMounted, onUnmounted, type Ref } from 'vue';

export interface DragScrollOptions {
  /** 是否启用拖拽滚动 */
  enabled?: boolean;
  /** 滚动速度倍数，默认 1 */
  speedMultiplier?: number;
  /** 拖拽触发的最小移动距离（像素），小于此值视为点击 */
  threshold?: number;
  /** 是否在拖拽时显示自定义光标 */
  showGrabCursor?: boolean;
}

export interface DragScrollReturn {
  /** 初始化拖拽滚动 */
  initDragScroll: (container: HTMLElement) => void;
  /** 销毁拖拽滚动 */
  destroyDragScroll: () => void;
  /** 是否正在拖拽中 */
  isDragging: Ref<boolean>;
  /** 是否启用 */
  isEnabled: Ref<boolean>;
  /** 切换启用状态 */
  toggleEnabled: (value?: boolean) => void;
}

/**
 * 表格鼠标拖拽滚动 composable
 * @param options 配置选项
 * @returns DragScrollReturn
 */
export function useTableDragScroll(options: DragScrollOptions = {}): DragScrollReturn {
  const {
    enabled = true,
    speedMultiplier = 1,
    threshold = 5,
    showGrabCursor = true,
  } = options;

  const isDragging = ref(false);
  const isEnabled = ref(enabled);
  
  // 内部状态
  let containerEl: HTMLElement | null = null;
  let scrollableEl: HTMLElement | null = null;
  let startX = 0;
  let startScrollLeft = 0;
  let hasMoved = false;
  let originalCursor = '';

  /**
   * 找到可滚动的表格容器元素
   * 支持 el-table 和 el-table-v2
   */
  const findScrollableElement = (container: HTMLElement): HTMLElement | null => {
    // el-table 的滚动容器
    const elTableBody = container.querySelector('.el-table__body-wrapper') as HTMLElement;
    if (elTableBody) return elTableBody;

    // el-table-v2 的滚动容器
    const elTableV2Body = container.querySelector('.el-table-v2__body') as HTMLElement;
    if (elTableV2Body) return elTableV2Body;

    // 通用滚动容器
    const scrollWrapper = container.querySelector('.scroll-wrapper') as HTMLElement;
    if (scrollWrapper) return scrollWrapper;

    // 如果容器本身可滚动
    if (container.scrollWidth > container.clientWidth) {
      return container;
    }

    return null;
  };

  /**
   * 鼠标按下事件处理
   */
  const handleMouseDown = (e: MouseEvent) => {
    if (!isEnabled.value || !scrollableEl) return;
    
    // 忽略右键和中键
    if (e.button !== 0) return;
    
    // 忽略在输入框、按钮等交互元素上的点击
    const target = e.target as HTMLElement;
    const interactiveElements = ['INPUT', 'TEXTAREA', 'BUTTON', 'SELECT', 'A'];
    if (interactiveElements.includes(target.tagName)) return;
    
    // 忽略在可点击元素上的操作
    if (target.closest('button, a, input, select, textarea, [role="button"], .el-checkbox, .el-radio')) {
      return;
    }

    // 检查是否有水平滚动空间
    if (scrollableEl.scrollWidth <= scrollableEl.clientWidth) return;

    startX = e.pageX;
    startScrollLeft = scrollableEl.scrollLeft;
    hasMoved = false;

    // 添加事件监听
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    
    // 防止选中文本
    e.preventDefault();
  };

  /**
   * 鼠标移动事件处理
   */
  const handleMouseMove = (e: MouseEvent) => {
    if (!scrollableEl) return;

    const deltaX = e.pageX - startX;
    
    // 检查是否超过阈值
    if (!hasMoved && Math.abs(deltaX) < threshold) {
      return;
    }

    // 标记已开始拖拽
    if (!hasMoved) {
      hasMoved = true;
      isDragging.value = true;
      
      // 设置拖拽光标
      if (showGrabCursor) {
        originalCursor = document.body.style.cursor;
        document.body.style.cursor = 'grabbing';
      }
      
      // 禁用文本选择
      document.body.style.userSelect = 'none';
    }

    // 计算滚动位置（向左拖动时向右滚动，所以取负值）
    const scrollDelta = deltaX * speedMultiplier;
    scrollableEl.scrollLeft = startScrollLeft - scrollDelta;
  };

  /**
   * 鼠标释放事件处理
   */
  const handleMouseUp = (e: MouseEvent) => {
    // 移除事件监听
    document.removeEventListener('mousemove', handleMouseMove);
    document.removeEventListener('mouseup', handleMouseUp);

    // 恢复光标和文本选择
    if (showGrabCursor && hasMoved) {
      document.body.style.cursor = originalCursor;
    }
    document.body.style.userSelect = '';

    // 如果发生了拖拽，阻止后续的 click 事件
    if (hasMoved) {
      // 短暂延迟后重置状态，确保 click 事件被阻止
      setTimeout(() => {
        isDragging.value = false;
      }, 10);
    }
  };

  /**
   * 阻止拖拽后的点击事件
   */
  const handleClick = (e: MouseEvent) => {
    if (isDragging.value) {
      e.stopPropagation();
      e.preventDefault();
    }
  };

  /**
   * 初始化拖拽滚动
   */
  const initDragScroll = (container: HTMLElement) => {
    if (!container) return;
    
    containerEl = container;
    scrollableEl = findScrollableElement(container);
    
    if (!scrollableEl) {
      console.warn('[useTableDragScroll] 未找到可滚动的容器元素');
      return;
    }

    // 绑定事件
    containerEl.addEventListener('mousedown', handleMouseDown);
    containerEl.addEventListener('click', handleClick, true);
    
    // 设置默认光标
    if (showGrabCursor && scrollableEl.scrollWidth > scrollableEl.clientWidth) {
      scrollableEl.style.cursor = 'grab';
    }
  };

  /**
   * 销毁拖拽滚动
   */
  const destroyDragScroll = () => {
    if (containerEl) {
      containerEl.removeEventListener('mousedown', handleMouseDown);
      containerEl.removeEventListener('click', handleClick, true);
    }
    
    document.removeEventListener('mousemove', handleMouseMove);
    document.removeEventListener('mouseup', handleMouseUp);
    
    // 恢复光标
    if (scrollableEl) {
      scrollableEl.style.cursor = '';
    }
    
    containerEl = null;
    scrollableEl = null;
  };

  /**
   * 切换启用状态
   */
  const toggleEnabled = (value?: boolean) => {
    isEnabled.value = value !== undefined ? value : !isEnabled.value;
    
    // 更新光标样式
    if (scrollableEl && showGrabCursor) {
      if (isEnabled.value && scrollableEl.scrollWidth > scrollableEl.clientWidth) {
        scrollableEl.style.cursor = 'grab';
      } else {
        scrollableEl.style.cursor = '';
      }
    }
  };

  // 组件卸载时清理
  onUnmounted(() => {
    destroyDragScroll();
  });

  return {
    initDragScroll,
    destroyDragScroll,
    isDragging,
    isEnabled,
    toggleEnabled,
  };
}

export default useTableDragScroll;
