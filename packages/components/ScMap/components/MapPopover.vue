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

// 重新定位弹窗
const repositionPopover = () => {
  if (!popoverRef.value) return;

  console.log('重新定位弹窗', props.position);

  // 弹窗元素
  const popover = popoverRef.value as HTMLElement;
  const arrowElement = popover.querySelector('.map-popover-arrow') as HTMLElement;
  if (!arrowElement) return;

  // 应用传入的位置
  const [x, y] = props.position;

  // 获取弹窗尺寸
  const popoverRect = popover.getBoundingClientRect();
  const popoverWidth = popoverRect.width;
  const popoverHeight = popoverRect.height;

  // 偏移量，用于避免弹窗紧贴标记点
  const verticalOffset = 10;

  // 获取浏览器视口尺寸
  const viewportWidth = window.innerWidth;
  const viewportHeight = window.innerHeight;

  // 计算视口边界（考虑一些边距）
  const margin = 10;
  const containerTop = margin;
  const containerLeft = margin;
  const containerRight = viewportWidth - margin;
  const containerBottom = viewportHeight - margin;

  // 默认定位：在标记点正上方，箭头指向下方
  popover.style.left = `${x}px`;
  popover.style.top = `${y - verticalOffset}px`; // 添加偏移

  // 默认弹窗在标记点上方，箭头向下
  let isAboveMarker = true;
  popover.style.transform = 'translate(-50%, -100%)';
  popover.style.transformOrigin = 'bottom center';

  // 清除箭头之前的类名
  arrowElement.className = 'map-popover-arrow';

  // 检查弹窗是否超出左边界
  const leftOverflow = containerLeft - (x - popoverWidth / 2);
  if (leftOverflow > 0) {
    // 弹窗左侧超出边界，将其向右移动
    const adjustedLeft = Math.max(x - popoverWidth / 2 + leftOverflow + 10, containerLeft + 10);
    popover.style.left = `${adjustedLeft}px`;
    popover.style.transform = isAboveMarker ? 'translate(0, -100%)' : 'translate(0, 10px)';

    // 调整箭头位置
    const arrowX = x - adjustedLeft;
    // 确保箭头在弹窗范围内
    const clampedArrowX = Math.max(10, Math.min(arrowX, popoverWidth - 10));
    arrowElement.style.left = `${clampedArrowX}px`;
    arrowElement.style.transform = 'rotate(45deg)';
  }

  // 检查弹窗是否超出右边界
  const rightOverflow = (x + popoverWidth / 2) - containerRight;
  if (rightOverflow > 0) {
    // 弹窗右侧超出边界，将其向左移动
    const adjustedLeft = Math.min(x - popoverWidth / 2 - rightOverflow - 10, containerRight - popoverWidth - 10);
    popover.style.left = `${adjustedLeft}px`;
    popover.style.transform = isAboveMarker ? 'translate(0, -100%)' : 'translate(0, 10px)';

    // 调整箭头位置
    const arrowX = x - adjustedLeft;
    // 确保箭头在弹窗范围内
    const clampedArrowX = Math.max(10, Math.min(arrowX, popoverWidth - 10));
    arrowElement.style.left = `${clampedArrowX}px`;
    arrowElement.style.transform = 'rotate(45deg)';
  }

  // 检查弹窗是否超出顶部边界
  const topOverflow = containerTop - (y - popoverHeight - verticalOffset);
  if (topOverflow > 0) {
    // 如果超出顶部边界，将弹窗放在标记点下方，并修改箭头方向
    popover.style.top = `${y + verticalOffset}px`;

    // 切换为下方显示模式
    isAboveMarker = false;
    popover.style.transform = popover.style.transform.includes('translate(-50%')
      ? 'translate(-50%, 0)'
      : 'translate(0, 0)';

    // 确保鼠标不在popover上时，标记点能点击
    popover.style.pointerEvents = 'auto';

    // 设置箭头向上
    arrowElement.classList.add('map-popover-arrow-top');
  } else {
    // 设置箭头向下
    arrowElement.classList.add('map-popover-arrow-bottom');
  }

  // 保存最终位置信息
  const finalPosition = {
    left: popover.style.left,
    top: popover.style.top,
    transform: popover.style.transform,
    isAboveMarker
  };

  // 触发位置更新事件
  emit('position-updated', { left: popover.style.left, top: popover.style.top });
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