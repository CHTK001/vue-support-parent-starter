/**
 * 节日装饰组合函数
 * @description 提供节日装饰元素的管理和渲染功能
 */
import { ref, computed, onMounted, onUnmounted, type Ref } from 'vue';

export interface DecorationConfig {
  /** 装饰类型 */
  type: 'lantern' | 'snowflake' | 'firework' | 'pumpkin' | 'bell' | 'hat';
  /** 位置配置 */
  position?: {
    top?: string;
    left?: string;
    right?: string;
    bottom?: string;
  };
  /** 尺寸 */
  size?: 'small' | 'medium' | 'large';
  /** 动画配置 */
  animation?: {
    type: 'swing' | 'float' | 'rotate' | 'pulse';
    duration?: number;
    delay?: number;
  };
  /** 是否启用 */
  enabled?: boolean;
}

export interface DecorationInstance {
  id: string;
  config: DecorationConfig;
  element: HTMLElement | null;
}

export function useFestivalDecoration(initialConfig: DecorationConfig[] = []) {
  const decorations: Ref<DecorationInstance[]> = ref([]);
  const container: Ref<HTMLElement | null> = ref(null);

  /**
   * 添加装饰元素
   */
  const addDecoration = (config: DecorationConfig): string => {
    const id = `decoration-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const instance: DecorationInstance = {
      id,
      config,
      element: null,
    };
    decorations.value.push(instance);
    return id;
  };

  /**
   * 移除装饰元素
   */
  const removeDecoration = (id: string): void => {
    const index = decorations.value.findIndex(d => d.id === id);
    if (index !== -1) {
      const decoration = decorations.value[index];
      if (decoration.element && decoration.element.parentNode) {
        decoration.element.parentNode.removeChild(decoration.element);
      }
      decorations.value.splice(index, 1);
    }
  };

  /**
   * 清空所有装饰
   */
  const clearDecorations = (): void => {
    decorations.value.forEach(d => {
      if (d.element && d.element.parentNode) {
        d.element.parentNode.removeChild(d.element);
      }
    });
    decorations.value = [];
  };

  /**
   * 更新装饰配置
   */
  const updateDecoration = (id: string, config: Partial<DecorationConfig>): void => {
    const decoration = decorations.value.find(d => d.id === id);
    if (decoration) {
      decoration.config = { ...decoration.config, ...config };
      // 重新渲染装饰元素
      if (decoration.element) {
        applyDecorationStyles(decoration);
      }
    }
  };

  /**
   * 应用装饰样式
   */
  const applyDecorationStyles = (decoration: DecorationInstance): void => {
    if (!decoration.element) return;

    const { position, size, animation } = decoration.config;
    const el = decoration.element;

    // 应用位置
    if (position) {
      Object.entries(position).forEach(([key, value]) => {
        if (value) {
          el.style[key as any] = value;
        }
      });
    }

    // 应用尺寸
    if (size) {
      el.classList.add(`decoration-${size}`);
    }

    // 应用动画
    if (animation) {
      el.style.animationName = animation.type;
      el.style.animationDuration = `${animation.duration || 2}s`;
      el.style.animationDelay = `${animation.delay || 0}s`;
      el.style.animationIterationCount = 'infinite';
    }
  };

  /**
   * 启用的装饰列表
   */
  const enabledDecorations = computed(() => 
    decorations.value.filter(d => d.config.enabled !== false)
  );

  /**
   * 装饰数量
   */
  const decorationCount = computed(() => decorations.value.length);

  /**
   * 初始化
   */
  onMounted(() => {
    // 添加初始装饰
    initialConfig.forEach(config => {
      addDecoration(config);
    });
  });

  /**
   * 清理
   */
  onUnmounted(() => {
    clearDecorations();
  });

  return {
    decorations,
    container,
    enabledDecorations,
    decorationCount,
    addDecoration,
    removeDecoration,
    clearDecorations,
    updateDecoration,
  };
}
