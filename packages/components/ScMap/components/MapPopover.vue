<template>
  <teleport to="body">
    <div v-if="visible" ref="popoverRef" class="map-popover" :class="[{ 'fade-in': fadeIn }, popoverClass]" :style="{
      left: `${position[0]}px`,
      top: `${position[1]}px`,
      transform: 'translate(-50%, -100%)',
      opacity: visible ? 1 : 0,
      pointerEvents: visible ? 'auto' : 'none'
    }">
      <div class="map-popover-content">
        <div v-if="type === 'click'" class="map-popover-close" @click="closePopover">×</div>
        <slot />
        <!-- 弹窗底部箭头 -->
        <div :class="arrowClass"></div>
      </div>
    </div>
  </teleport>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, nextTick, watch } from 'vue';
import { Marker, ClusterClickEvent } from '../types';

interface Props {
  // 弹窗类型：hover | click
  type: 'hover' | 'click';
  // 标记点数据
  marker: Marker | any;
  // 是否可见
  visible: boolean;
  // 弹窗位置 [x, y]，相对于地图容器的像素坐标
  position?: [number, number];
  // 弹窗模板
  template?: string;
  // 地图容器DOM元素
  mapContainer?: HTMLElement | null;
  // 弹窗偏移量 [x, y]
  offset?: [number, number];
  popoverClass: string;
}

const props = withDefaults(defineProps<Props>(), {
  visible: false,
  position: () => [0, 0],
  template: '',
  mapContainer: undefined,
  offset: () => [0, -35],
  popoverClass: ''
});
const emit = defineEmits(['close', 'position-updated', 'update:visible', 'hide']);

// 弹窗DOM引用
const popoverRef = ref<HTMLElement | null>(null);
// 是否显示淡入动画
const fadeIn = ref(false);
const arrowClass = ref<string>('map-popover-arrow map-popover-arrow-bottom');

// 延迟设置淡入效果，确保DOM已经渲染
watch(() => props.visible, (visible) => {
  if (visible) {
    fadeIn.value = false;
    nextTick(() => {
      setTimeout(() => {
        fadeIn.value = true;
      }, 10);
    });
  } else {
    fadeIn.value = false;
  }
});

// 弹窗位置样式
const popoverStyle = computed(() => {
  if (!props.position) return {};

  return {
    left: `${props.position[0]}px`,
    top: `${props.position[1]}px`,
    transform: 'translate(-50%, -100%)',
    opacity: props.visible ? 1 : 0,
    pointerEvents: props.visible ? 'auto' : 'none'
  };
});

// 标记点标题
const title = computed(() => {
  if (props.marker.clustered) {
    return "聚合标记点";
  }
  return props.marker.title || props.marker.label || (props.marker.data?.name ?? '');
});

// 是否使用默认模板
const useDefaultTemplate = computed(() => !props.template);

// 渲染自定义模板
const renderedTemplate = computed(() => {
  if (!props.template) return '';

  let template = props.template;

  // 替换插值表达式 ${marker.xxx}
  template = template.replace(/\${marker\.([^}]+)}/g, (match, key) => {
    // 处理嵌套属性 marker.data.xxx
    const keys = key.split('.');
    let value = props.marker;

    for (const k of keys) {
      if (value === undefined || value === null) return '';
      value = value[k];
    }

    return value !== undefined && value !== null ? value : '';
  });

  return template;
});

// 格式化坐标位置
const formatPosition = (position: [number, number]): string => {
  if (!position || position.length !== 2) return '未知';
  return `${position[0].toFixed(6)}, ${position[1].toFixed(6)}`;
};

// 格式化属性键名
const formatKey = (key: string): string => {
  // 将驼峰命名转换为空格分隔的词组，首字母大写
  return key
    .replace(/([A-Z])/g, ' $1')
    .replace(/^./, str => str.toUpperCase());
};

// 格式化属性值
const formatValue = (value: any): string => {
  if (value === null || value === undefined) return '无';
  if (typeof value === 'object') {
    try {
      return JSON.stringify(value);
    } catch (e) {
      return '[对象]';
    }
  }
  return String(value);
};

// 筛选可显示的数据属性
const getDisplayableData = (data: any) => {
  if (!data) return {};

  // 排除不需要显示的字段
  const excludeFields = ['id', 'markerId', 'icon', 'type'];
  const result: Record<string, any> = {};

  Object.keys(data).forEach(key => {
    if (!excludeFields.includes(key)) {
      result[key] = data[key];
    }
  });

  return result;
};

// 关闭弹窗
const closePopover = () => {
  emit('close');
};

// 处理点击外部关闭弹窗
const handleOutsideClick = (event: MouseEvent) => {
  if (props.visible && popoverRef.value && !popoverRef.value.contains(event.target as Node)) {
    // 检查是否点击在标记点上 - 标记点通常有特定的类名
    const targetEl = event.target as HTMLElement;
    const isMarkerClick =
      targetEl.classList.contains('amap-marker') ||
      targetEl.classList.contains('tmap-marker') ||
      targetEl.closest('.amap-marker') ||
      targetEl.closest('.tmap-marker');

    // 如果不是点击在标记点上，则关闭弹窗
    if (!isMarkerClick) {
      closePopover();
    }
  }
};

// 重新定位弹窗以防止溢出地图容器
const repositionPopover = () => {
  if (!popoverRef.value) return;

  nextTick(() => {
    const popover = popoverRef.value as HTMLElement;
    const arrowElement = popover.querySelector('.map-popover-arrow') as HTMLElement;

    // 获取窗口尺寸作为边界
    const windowWidth = window.innerWidth;
    const windowHeight = window.innerHeight;

    // 获取弹窗尺寸
    const popoverRect = popover.getBoundingClientRect();
    const popoverWidth = popoverRect.width;
    const popoverHeight = popoverRect.height;

    // 获取当前标记点位置(已经应用了transform偏移)
    let x = props.position ? props.position[0] : 0; // 标记点的x坐标
    let y = props.position ? props.position[1] : 0; // 标记点的y坐标

    // 应用额外的垂直偏移（避免弹窗紧贴标记点）
    const verticalOffset = 10; // 10px上方偏移

    // 地图容器的边界
    let containerLeft = 0;
    let containerTop = 0;
    let containerRight = windowWidth;
    let containerBottom = windowHeight;

    // 如果有地图容器引用，使用容器边界
    if (props.mapContainer) {
      try {
        const containerRect = props.mapContainer.getBoundingClientRect();
        containerLeft = containerRect.left;
        containerTop = containerRect.top;
        containerRight = containerRect.right;
        containerBottom = containerRect.bottom;
      } catch (e) {
        console.warn('获取地图容器边界失败', e);
      }
    }

    // 计算弹窗在应用transform后的实际位置
    let actualLeft = x - popoverWidth / 2; // 弹窗水平居中于标记点
    let actualTop = y - popoverHeight - verticalOffset; // 弹窗在标记点上方
    let isAboveMarker = true; // 默认弹窗在标记点上方

    // 重置箭头样式
    if (arrowElement) {
      // 重置所有箭头样式
      arrowElement.className = 'map-popover-arrow';
      arrowElement.style.left = '50%';
      arrowElement.style.transform = 'rotate(45deg) translateX(-50%)';
    }

    // 水平方向调整
    if (actualLeft < containerLeft + 10) {
      // 如果弹窗左侧超出容器，调整transform-origin并修正位置
      const leftOverflow = containerLeft + 10 - actualLeft;
      actualLeft = containerLeft + 10;
      popover.style.transform = isAboveMarker ? 'translate(0, -100%)' : 'translate(0, 10px)';
      popover.style.left = `${actualLeft}px`;

      // 调整箭头位置
      if (arrowElement) {
        const arrowLeftPos = Math.min(popoverWidth / 2, x - actualLeft);
        arrowElement.style.left = `${arrowLeftPos}px`;
        arrowElement.style.transform = 'rotate(45deg)';
      }
    } else if (actualLeft + popoverWidth > containerRight - 10) {
      // 如果弹窗右侧超出容器，调整transform-origin并修正位置
      actualLeft = containerRight - 10 - popoverWidth;
      popover.style.transform = isAboveMarker ? 'translate(0, -100%)' : 'translate(0, 10px)';
      popover.style.left = `${actualLeft}px`;

      // 调整箭头位置
      if (arrowElement) {
        const arrowLeftPos = Math.max(popoverWidth - (containerRight - x - 10), popoverWidth / 2);
        arrowElement.style.left = `${arrowLeftPos}px`;
        arrowElement.style.transform = 'rotate(45deg)';
      }
    } else {
      // 正常情况，保持水平居中
      popover.style.transform = isAboveMarker ? 'translate(-50%, -100%)' : 'translate(-50%, 10px)';
      popover.style.left = `${x}px`;
    }

    // 垂直方向调整
    if (actualTop < containerTop + 10) {
      // 如果弹窗顶部超出容器，显示在标记点下方
      isAboveMarker = false;
      popover.style.transform = popover.style.transform.replace('-100%', '10px');
      popover.style.top = `${y}px`;

      // 更新箭头样式，指向上方
      if (arrowElement) {
        arrowElement.classList.add('map-popover-arrow-top');
      }
    } else {
      // 正常情况，显示在标记点上方
      popover.style.top = `${y}px`;

      // 更新箭头样式，指向下方
      if (arrowElement) {
        arrowElement.classList.add('map-popover-arrow-bottom');
      }
    }

    // 通知位置已更新
    emit('position-updated', { left: popover.style.left, top: popover.style.top });
  });
};

// 监听弹窗可见性变化，进行重新定位
watch(() => props.visible, (visible) => {
  if (visible) {
    repositionPopover();
    // 添加点击外部关闭事件
    setTimeout(() => {
      document.addEventListener('click', handleOutsideClick);
    }, 10);
  } else {
    // 移除点击外部关闭事件
    document.removeEventListener('click', handleOutsideClick);
  }
});

// 监听标记点位置变化，重新定位弹窗
watch(() => props.position, () => {
  if (props.visible) {
    repositionPopover();
  }
}, { deep: true });

// 组件挂载时
onMounted(() => {
  // 弹窗可见时，进行定位调整
  if (props.visible) {
    repositionPopover();
    // 添加点击外部关闭事件
    document.addEventListener('click', handleOutsideClick);
  }

  // 添加窗口大小变化监听器，以调整弹窗位置
  window.addEventListener('resize', repositionPopover);
});

// 组件卸载时
onUnmounted(() => {
  window.removeEventListener('resize', repositionPopover);
  document.removeEventListener('click', handleOutsideClick);
});
</script>

<style scoped>
.map-popover {
  position: fixed;
  background-color: white;
  border-radius: 8px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
  padding: 12px;
  max-width: 320px;
  min-width: 150px;
  word-break: break-word;
  font-size: 14px;
  line-height: 1.5;
  pointer-events: auto;
  border: 1px solid rgba(0, 0, 0, 0.05);
  z-index: 2000;
  opacity: 0;
  transition: opacity 0.2s ease, transform 0.2s ease;
}

.fade-in {
  opacity: 1;
}

.map-popover-hover {
  padding: 10px 14px;
}

.map-popover-click {
  padding: 14px 18px;
  z-index: 3001;
}

/* 底部箭头样式 */
.map-popover-arrow {
  position: absolute;
  width: 10px;
  height: 10px;
  background-color: white;
  transform: rotate(45deg) translateX(-50%);
  left: 50%;
  pointer-events: none;
  z-index: 1;
}

/* 指向下方的箭头 */
.map-popover-arrow-bottom {
  bottom: -5px;
  border-right: 1px solid rgba(0, 0, 0, 0.1);
  border-bottom: 1px solid rgba(0, 0, 0, 0.1);
  border-top: none;
  border-left: none;
  box-shadow: 2px 2px 4px rgba(0, 0, 0, 0.05);
}

/* 指向上方的箭头 */
.map-popover-arrow-top {
  top: -5px;
  border-top: 1px solid rgba(0, 0, 0, 0.1);
  border-left: 1px solid rgba(0, 0, 0, 0.1);
  border-bottom: none;
  border-right: none;
  box-shadow: -1px -1px 3px rgba(0, 0, 0, 0.05);
}

.map-popover-close {
  position: absolute;
  top: 8px;
  right: 10px;
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  color: #909399;
  font-size: 18px;
  font-weight: bold;
  border-radius: 50%;
  transition: all 0.2s ease;
}

.map-popover-close:hover {
  background-color: #f2f6fc;
  color: #606266;
  transform: rotate(90deg);
}

.map-popover-title {
  font-weight: bold;
  margin-bottom: 10px;
  color: #303133;
  border-bottom: 1px solid #ebeef5;
  padding-bottom: 8px;
  padding-right: 20px;
  font-size: 16px;
}

.map-popover-content {
  color: #606266;
}

.map-popover-content h3 {
  margin: 0 0 10px 0;
  font-size: 16px;
  color: #303133;
}

.map-popover-content p {
  margin: 6px 0;
}

.popover-data-section {
  margin-top: 10px;
  border-top: 1px dashed #ebeef5;
  padding-top: 10px;
}

.popover-data-item {
  display: flex;
  margin-bottom: 6px;
}

.popover-data-key {
  color: #909399;
  margin-right: 8px;
  flex-shrink: 0;
  font-weight: 500;
}

.popover-data-value {
  flex: 1;
  word-break: break-all;
}

.map-popover-cluster h3 {
  color: #409eff;
}

.popover-cluster-tip {
  font-style: italic;
  font-size: 12px;
  color: #909399;
  margin-top: 10px;
  text-align: center;
}
</style>