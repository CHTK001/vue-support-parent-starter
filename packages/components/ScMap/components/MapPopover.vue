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

        <!-- 自定义内容 -->
        <slot>
          <!-- 默认内容 -->
          <div>
            <!-- 如果有自定义模板，使用自定义模板 -->
            <div v-if="template" class="custom-template" v-html="renderedTemplate"></div>

            <!-- 否则使用默认模板 -->
            <div v-else>
              <h3 class="map-popover-title">{{ title }}</h3>

              <!-- 位置信息 -->
              <p v-if="marker && marker.position">
                <span class="popover-data-key">位置:</span>
                <span class="popover-data-value">{{ formatPosition(marker.position) }}</span>
              </p>

              <!-- 标记点自定义数据 -->
              <div v-if="marker && marker.data" class="popover-data-section">
                <div v-for="(value, key) in getDisplayableData(marker.data)" :key="key" class="popover-data-item">
                  <span class="popover-data-key">{{ formatKey(key) }}:</span>
                  <span class="popover-data-value">{{ formatValue(value) }}</span>
                </div>
              </div>

              <!-- 如果是聚合点，显示聚合信息 -->
              <div v-if="marker && marker.clustered" class="map-popover-cluster">
                <p><strong>包含:</strong> {{ marker.count || 0 }} 个标记点</p>
                <p class="popover-cluster-tip">点击可查看详细信息</p>
              </div>
            </div>
          </div>
        </slot>

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
  console.log('MapPopover visible变化:', visible, '标记数据:', props.marker);
  if (visible) {
    fadeIn.value = false;
    nextTick(() => {
      setTimeout(() => {
        fadeIn.value = true;
        console.log('MapPopover淡入动画激活');
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
    console.log('重新定位弹窗，当前位置:', props.position);
    const popover = popoverRef.value as HTMLElement;
    const arrowElement = popover.querySelector('.map-popover-arrow') as HTMLElement;

    // 获取窗口尺寸作为边界
    const windowWidth = window.innerWidth;
    const windowHeight = window.innerHeight;

    // 获取弹窗尺寸
    const popoverRect = popover.getBoundingClientRect();
    const popoverWidth = popoverRect.width;
    const popoverHeight = popoverRect.height;

    // 获取当前标记点位置
    let x = props.position ? props.position[0] : 0; // 标记点的x坐标
    let y = props.position ? props.position[1] : 0; // 标记点的y坐标

    // 应用垂直偏移（避免弹窗紧贴标记点）
    // 这个偏移是额外的，通常由父组件已经计算过一部分
    const verticalOffset = 5;

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

    // 将弹窗设置为标记点位置
    popover.style.left = `${x}px`;
    popover.style.top = `${y - verticalOffset}px`; // 添加偏移

    // 设置默认为标记点上方
    let isAboveMarker = true;
    popover.style.transform = 'translate(-50%, -100%)';
    popover.style.transformOrigin = 'bottom center';

    // 重置箭头样式
    if (arrowElement) {
      arrowElement.className = 'map-popover-arrow';
      arrowElement.style.left = '50%';
      arrowElement.style.transform = 'translateX(-50%) rotate(45deg)';
    }

    // 检查水平溢出
    const leftOverflow = containerLeft - (x - popoverWidth / 2);
    const rightOverflow = (x + popoverWidth / 2) - containerRight;

    // 水平方向调整
    if (leftOverflow > 0) {
      // 如果弹窗左侧超出容器
      const adjustedLeft = Math.max(x - popoverWidth / 2 + leftOverflow + 10, containerLeft + 10);
      popover.style.left = `${adjustedLeft}px`;
      popover.style.transform = isAboveMarker ? 'translate(0, -100%)' : 'translate(0, 10px)';

      // 调整箭头位置
      if (arrowElement) {
        const arrowPos = x - adjustedLeft;
        arrowElement.style.left = `${arrowPos}px`;
        arrowElement.style.transform = 'translateX(0) rotate(45deg)';
      }
    } else if (rightOverflow > 0) {
      // 如果弹窗右侧超出容器
      const adjustedLeft = Math.min(x - popoverWidth / 2 - rightOverflow - 10, containerRight - popoverWidth - 10);
      popover.style.left = `${adjustedLeft}px`;
      popover.style.transform = isAboveMarker ? 'translate(0, -100%)' : 'translate(0, 10px)';

      // 调整箭头位置
      if (arrowElement) {
        const arrowPos = x - adjustedLeft;
        arrowElement.style.left = `${arrowPos}px`;
        arrowElement.style.transform = 'translateX(0) rotate(45deg)';
      }
    }

    // 检查垂直溢出 - 弹窗是否超出顶部
    const topOverflow = containerTop - (y - popoverHeight - verticalOffset);

    // 垂直方向调整
    if (topOverflow > 0) {
      // 如果弹窗顶部超出容器，显示在标记点下方
      isAboveMarker = false;
      popover.style.transform = popover.style.transform.includes('translate(-50%')
        ? 'translate(-50%, 10px)'
        : 'translate(0, 10px)';

      // 更新箭头样式，指向上方
      if (arrowElement) {
        arrowElement.classList.add('map-popover-arrow-top');
      }
    } else {
      // 正常情况，显示在标记点上方
      if (arrowElement) {
        arrowElement.classList.add('map-popover-arrow-bottom');
      }
    }

    console.log('弹窗位置调整完成:', {
      left: popover.style.left,
      top: popover.style.top,
      transform: popover.style.transform,
      isAboveMarker
    });

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
  z-index: 9000;
  opacity: 0;
  transition: opacity 0.2s ease, transform 0.2s ease;
  margin-bottom: 12px;
}

.fade-in {
  opacity: 1;
}

.map-popover-hover {
  padding: 10px 14px;
}

.map-popover-click {
  padding: 14px 18px;
  z-index: 9001;
}

/* 底部箭头样式 */
.map-popover-arrow {
  position: absolute;
  width: 14px;
  height: 14px;
  background-color: white;
  transform: translateX(-50%) rotate(45deg);
  left: 50%;
  pointer-events: none;
  z-index: 1;
}

/* 指向下方的箭头 */
.map-popover-arrow-bottom {
  bottom: -7px;
  border-right: 1px solid rgba(0, 0, 0, 0.1);
  border-bottom: 1px solid rgba(0, 0, 0, 0.1);
  border-top: none;
  border-left: none;
  box-shadow: 2px 2px 4px rgba(0, 0, 0, 0.05);
}

/* 指向上方的箭头 */
.map-popover-arrow-top {
  top: -7px;
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
  position: relative;
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

.map-popover-cluster {
  color: #409eff;
}

.popover-cluster-tip {
  font-style: italic;
  font-size: 12px;
  color: #909399;
  margin-top: 10px;
  text-align: center;
}

.custom-template {
  max-width: 100%;
  word-break: break-word;
}
</style>