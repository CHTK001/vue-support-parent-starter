<template>
  <teleport to="body">
    <div class="map-popover-container">
      <Transition name="fade">
        <div v-if="visible" ref="popoverRef" class="map-popover"
          :class="[popoverClass, { 'is-click': type === 'click', 'showBelow': showBelow }]" :style="{
            left: `${position[0]}px`,
            top: `${position[1]}px`,
            transform: showBelow ? 'translate(-50%, 0)' : 'translate(-50%, -100%)',
            opacity: visible ? 1 : 0,
            pointerEvents: visible ? 'auto' : 'none'
          }">
          <div class="popover-content">
            <slot>
              <!-- 默认内容 -->
              <div>
                <!-- 如果有自定义模板，使用自定义模板 -->
                <div v-if="template" class="custom-template" v-html="renderedTemplate"></div>

                <!-- 否则使用默认模板 -->
                <div v-else>
                  <h3 class="popover-title">{{ title }}</h3>

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
                  <div v-if="marker && marker.clustered" class="popover-cluster">
                    <p><strong>包含:</strong> {{ marker.count || 0 }} 个标记点</p>
                    <p class="popover-cluster-tip">点击可查看详细信息</p>
                  </div>
                </div>
              </div>
            </slot>
          </div>
          <div class="popover-close" v-if="type === 'click'" @click="closePopover">×</div>
          <div class="popover-arrow"></div>
        </div>
      </Transition>
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
  // 弹窗CSS类名
  popoverClass: string;
  // 是否在标记点下方显示
  showBelow?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  visible: false,
  position: () => [0, 0],
  template: '',
  mapContainer: undefined,
  offset: () => [0, -35],
  popoverClass: '',
  showBelow: false
});
const emit = defineEmits(['close', 'position-updated', 'update:visible', 'hide']);

// 弹窗DOM引用
const popoverRef = ref<HTMLElement | null>(null);
// 是否显示淡入动画
const fadeIn = ref(false);
const arrowClass = ref<string>('map-popover-arrow map-popover-arrow-bottom');

// 延迟设置淡入效果，确保DOM已经渲染
watch(() => props.visible, (visible) => {
  console.log('MapPopover visible变化:', visible, '标记数据:', props.marker, '显示位置:', props.showBelow ? '下方' : '上方');
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
  if (!popoverRef.value || !props.visible) return;

  nextTick(() => {
    const popover = popoverRef.value as HTMLElement;
    if (!popover) return;

    const arrow = popover.querySelector('.popover-arrow') as HTMLElement;

    // 获取弹窗尺寸
    const popoverRect = popover.getBoundingClientRect();
    const arrowWidth = 14; // 箭头宽度

    // 确保弹窗不超出屏幕边界
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;

    let x = props.position[0];
    let y = props.position[1];

    // 水平方向调整
    if (x < popoverRect.width / 2 + 10) {
      // 太靠左
      x = popoverRect.width / 2 + 10;
      // 移动箭头位置
      if (arrow) {
        const offset = props.position[0] - x;
        arrow.style.left = `calc(50% + ${offset}px)`;
      }
    } else if (x > viewportWidth - popoverRect.width / 2 - 10) {
      // 太靠右
      x = viewportWidth - popoverRect.width / 2 - 10;
      // 移动箭头位置
      if (arrow) {
        const offset = props.position[0] - x;
        arrow.style.left = `calc(50% + ${offset}px)`;
      }
    } else if (arrow) {
      // 重置箭头位置
      arrow.style.left = `calc(50% - ${arrowWidth / 2}px)`;
    }

    // 计算显示方向
    let showBelow = !!props.showBelow;

    // 垂直方向调整
    if (showBelow) {
      // 显示在下方
      const bottomSpace = viewportHeight - y;
      if (bottomSpace < popoverRect.height + 40) {
        // 空间不足，改为显示在上方
        showBelow = false;
      }
    } else {
      // 显示在上方
      if (y < popoverRect.height + 40) {
        // 上方空间不足，显示在下方
        showBelow = true;
      }
    }

    // 应用新位置
    popover.style.left = `${x}px`;
    popover.style.top = `${y}px`;
    popover.style.transform = showBelow ? 'translate(-50%, 0)' : 'translate(-50%, -100%)';

    // 更新箭头方向样式
    if (showBelow) {
      popover.classList.add('showBelow');
    } else {
      popover.classList.remove('showBelow');
    }

    // 触发位置更新事件
    emit('position-updated', {
      left: popover.style.left,
      top: popover.style.top,
      showBelow: showBelow
    });
  });
};

// 监听visible变化，重新定位弹窗
watch(() => props.visible, (newVal) => {
  if (newVal) {
    nextTick(() => {
      repositionPopover();
    });
  }
});

// 监听position变化，重新定位弹窗
watch(() => props.position, () => {
  if (props.visible) {
    nextTick(() => {
      repositionPopover();
    });
  }
});

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
.map-popover-container {
  position: fixed;
  top: 0;
  left: 0;
  width: 0;
  height: 0;
  overflow: visible;
  pointer-events: none;
  z-index: 9000;
}

.map-popover {
  position: absolute;
  z-index: 1000;
  background-color: white;
  border-radius: 8px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.15);
  padding: 12px;
  max-width: 300px;
  min-width: 150px;
  word-break: break-word;
  transform-origin: center bottom;
  transition: opacity 0.3s, transform 0.3s;
  border: 1px solid #ebeef5;
  font-size: 14px;
  color: #303133;
  pointer-events: auto;
  line-height: 1.5;
  animation: popoverIn 0.3s ease-out forwards;
}

@keyframes popoverIn {
  0% {
    opacity: 0;
    transform: translate(-50%, -90%) scale(0.8);
  }

  50% {
    opacity: 1;
    transform: translate(-50%, -105%) scale(1.03);
  }

  100% {
    opacity: 1;
    transform: translate(-50%, -100%) scale(1);
  }
}

.map-popover.showBelow {
  animation: popoverInBelow 0.3s ease-out forwards;
}

@keyframes popoverInBelow {
  0% {
    opacity: 0;
    transform: translate(-50%, 10%) scale(0.8);
  }

  50% {
    opacity: 1;
    transform: translate(-50%, -5%) scale(1.03);
  }

  100% {
    opacity: 1;
    transform: translate(-50%, 0) scale(1);
  }
}

.map-popover.is-click {
  z-index: 1001;
  padding: 14px 16px;
}

.map-popover.fade-enter-from,
.map-popover.fade-leave-to {
  opacity: 0;
  transform: translateY(-10px);
}

.map-popover.fade-enter-active,
.map-popover.fade-leave-active {
  transition: opacity 0.3s, transform 0.3s;
}

.popover-close {
  position: absolute;
  top: 8px;
  right: 10px;
  width: 20px;
  height: 20px;
  display: flex;
  z-index: 3;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  color: #909399;
  font-size: 18px;
  border-radius: 50%;
  transition: background-color 0.2s;
}

.popover-close:hover {
  background-color: #f2f6fc;
  color: #606266;
}

.popover-content {
  position: relative;
  z-index: 2;
}

.popover-title {
  margin: 0 0 8px 0;
  font-size: 16px;
  font-weight: bold;
  color: #303133;
  padding-bottom: 8px;
  border-bottom: 1px solid #ebeef5;
}

.popover-data-key {
  font-weight: 500;
  color: #606266;
  margin-right: 4px;
}

.popover-data-value {
  color: #909399;
}

.popover-data-section {
  margin-top: 8px;
}

.popover-data-item {
  margin-bottom: 4px;
}

.popover-cluster {
  margin-top: 10px;
  text-align: center;
}

.popover-cluster-tip {
  font-style: italic;
  font-size: 12px;
  color: #909399;
  margin-top: 5px;
}

/* 弹窗箭头样式 */
.popover-arrow {
  position: absolute;
  width: 14px;
  height: 14px;
  background-color: white;
  transform: rotate(45deg);
  box-shadow: 2px 2px 5px rgba(0, 0, 0, 0.1);
  z-index: 1;
  border: 1px solid #ebeef5;
  animation: arrowIn 0.4s ease-out forwards;
}

@keyframes arrowIn {
  0% {
    opacity: 0;
    transform: rotate(45deg) scale(0.5);
  }

  50% {
    opacity: 1;
    transform: rotate(45deg) scale(1.2);
  }

  100% {
    opacity: 1;
    transform: rotate(45deg) scale(1);
  }
}

/* 显示在上方时，箭头在底部 */
.map-popover:not(.showBelow) .popover-arrow {
  bottom: -7px;
  left: calc(50% - 7px);
  box-shadow: 2px 2px 3px rgba(0, 0, 0, 0.1);
  border-right: 1px solid #ebeef5;
  border-bottom: 1px solid #ebeef5;
  border-left: none;
  border-top: none;
}

/* 显示在下方时，箭头在顶部 */
.map-popover.showBelow .popover-arrow {
  top: -7px;
  left: calc(50% - 7px);
  box-shadow: -1px -1px 3px rgba(0, 0, 0, 0.05);
  border-left: 1px solid #ebeef5;
  border-top: 1px solid #ebeef5;
  border-right: none;
  border-bottom: none;
}

/* 自定义模板样式 */
.custom-template {
  line-height: 1.5;
}

.custom-template :deep(h3) {
  margin-top: 0;
  margin-bottom: 8px;
  font-size: 16px;
  color: #303133;
}

.custom-template :deep(p) {
  margin: 5px 0;
  color: #606266;
}
</style>