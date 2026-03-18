/**
 * 节日动画组合函数
 * @description 提供节日动画效果的控制和管理
 */
import { ref, onMounted, onUnmounted, type Ref } from 'vue';

export interface AnimationConfig {
  /** 动画名称 */
  name: string;
  /** 目标元素选择器或 ref */
  target: string | HTMLElement;
  /** 动画持续时间（毫秒） */
  duration?: number;
  /** 延迟时间（毫秒） */
  delay?: number;
  /** 缓动函数 */
  easing?: 'linear' | 'ease' | 'ease-in' | 'ease-out' | 'ease-in-out';
  /** 迭代次数 */
  iterations?: number | 'infinite';
  /** 动画方向 */
  direction?: 'normal' | 'reverse' | 'alternate' | 'alternate-reverse';
  /** 填充模式 */
  fillMode?: 'none' | 'forwards' | 'backwards' | 'both';
  /** 是否自动播放 */
  autoPlay?: boolean;
}

export interface AnimationInstance {
  id: string;
  config: AnimationConfig;
  element: HTMLElement | null;
  animation: Animation | null;
  isPlaying: boolean;
}

export function useFestivalAnimation() {
  const animations: Ref<AnimationInstance[]> = ref([]);
  const rafId: Ref<number | null> = ref(null);

  /**
   * 创建动画实例
   */
  const createAnimation = (config: AnimationConfig): string => {
    const id = `animation-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    const instance: AnimationInstance = {
      id,
      config,
      element: null,
      animation: null,
      isPlaying: false,
    };

    // 获取目标元素
    if (typeof config.target === 'string') {
      instance.element = document.querySelector(config.target);
    } else {
      instance.element = config.target;
    }

    if (instance.element) {
      // 创建 Web Animations API 动画
      const keyframes = getKeyframesByName(config.name);
      if (keyframes) {
        instance.animation = instance.element.animate(keyframes, {
          duration: config.duration || 1000,
          delay: config.delay || 0,
          easing: config.easing || 'ease',
          iterations: config.iterations === 'infinite' ? Infinity : (config.iterations || 1),
          direction: config.direction || 'normal',
          fill: config.fillMode || 'none',
        });

        // 默认暂停，等待手动播放
        if (!config.autoPlay) {
          instance.animation.pause();
        } else {
          instance.isPlaying = true;
        }
      }
    }

    animations.value.push(instance);
    return id;
  };

  /**
   * 根据名称获取关键帧
   */
  const getKeyframesByName = (name: string): Keyframe[] | null => {
    const keyframesMap: Record<string, Keyframe[]> = {
      swing: [
        { transform: 'rotate(-5deg)' },
        { transform: 'rotate(5deg)' },
        { transform: 'rotate(-5deg)' },
      ],
      float: [
        { transform: 'translateY(0)' },
        { transform: 'translateY(-10px)' },
        { transform: 'translateY(0)' },
      ],
      rotate: [
        { transform: 'rotate(0deg)' },
        { transform: 'rotate(360deg)' },
      ],
      pulse: [
        { transform: 'scale(1)', opacity: '1' },
        { transform: 'scale(1.1)', opacity: '0.8' },
        { transform: 'scale(1)', opacity: '1' },
      ],
      fadeIn: [
        { opacity: '0' },
        { opacity: '1' },
      ],
      fadeOut: [
        { opacity: '1' },
        { opacity: '0' },
      ],
      slideInLeft: [
        { transform: 'translateX(-100%)' },
        { transform: 'translateX(0)' },
      ],
      slideInRight: [
        { transform: 'translateX(100%)' },
        { transform: 'translateX(0)' },
      ],
      bounce: [
        { transform: 'translateY(0)' },
        { transform: 'translateY(-20px)', offset: 0.5 },
        { transform: 'translateY(0)' },
      ],
    };

    return keyframesMap[name] || null;
  };

  /**
   * 播放动画
   */
  const play = (id: string): void => {
    const instance = animations.value.find(a => a.id === id);
    if (instance && instance.animation) {
      instance.animation.play();
      instance.isPlaying = true;
    }
  };

  /**
   * 暂停动画
   */
  const pause = (id: string): void => {
    const instance = animations.value.find(a => a.id === id);
    if (instance && instance.animation) {
      instance.animation.pause();
      instance.isPlaying = false;
    }
  };

  /**
   * 停止动画
   */
  const stop = (id: string): void => {
    const instance = animations.value.find(a => a.id === id);
    if (instance && instance.animation) {
      instance.animation.cancel();
      instance.isPlaying = false;
    }
  };

  /**
   * 重置动画
   */
  const reset = (id: string): void => {
    const instance = animations.value.find(a => a.id === id);
    if (instance && instance.animation) {
      instance.animation.currentTime = 0;
      instance.animation.pause();
      instance.isPlaying = false;
    }
  };

  /**
   * 移除动画
   */
  const removeAnimation = (id: string): void => {
    const index = animations.value.findIndex(a => a.id === id);
    if (index !== -1) {
      const instance = animations.value[index];
      if (instance.animation) {
        instance.animation.cancel();
      }
      animations.value.splice(index, 1);
    }
  };

  /**
   * 播放所有动画
   */
  const playAll = (): void => {
    animations.value.forEach(instance => {
      if (instance.animation) {
        instance.animation.play();
        instance.isPlaying = true;
      }
    });
  };

  /**
   * 暂停所有动画
   */
  const pauseAll = (): void => {
    animations.value.forEach(instance => {
      if (instance.animation) {
        instance.animation.pause();
        instance.isPlaying = false;
      }
    });
  };

  /**
   * 清空所有动画
   */
  const clearAnimations = (): void => {
    animations.value.forEach(instance => {
      if (instance.animation) {
        instance.animation.cancel();
      }
    });
    animations.value = [];
  };

  /**
   * 清理
   */
  onUnmounted(() => {
    clearAnimations();
    if (rafId.value) {
      cancelAnimationFrame(rafId.value);
    }
  });

  return {
    animations,
    createAnimation,
    play,
    pause,
    stop,
    reset,
    removeAnimation,
    playAll,
    pauseAll,
    clearAnimations,
  };
}
