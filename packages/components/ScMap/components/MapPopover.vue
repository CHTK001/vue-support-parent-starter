<template>
  <teleport to="body">
    <div v-if="visible" ref="popoverRef" class="map-popover" :class="[
      type === 'hover' ? 'map-popover-hover' : 'map-popover-click',
      marker.clustered ? 'map-popover-cluster' : ''
    ]" :style="popoverStyle">11
      <!-- 关闭按钮，仅在点击弹窗模式下显示 -->
      <div v-if="type === 'click'" class="map-popover-close" @click.stop="closePopover">×</div>

      <!-- 标题 -->
      <div v-if="title" class="map-popover-title">{{ title }}</div>

      <!-- 弹窗内容 -->
      <div class="map-popover-content">
        <template v-if="useDefaultTemplate">
          <!-- 聚合点信息模板 -->
          <template v-if="marker.clustered">
            <div class="popover-cluster-info">
              <h3>{{ marker.count }}个标记点聚合</h3>
              <p>中心位置: {{ formatPosition(marker.position) }}</p>
              <p v-if="marker.totalWeight">权重总和: {{ marker.totalWeight }}</p>
              <p class="popover-cluster-tip">点击可查看聚合详情</p>
            </div>
          </template>

          <!-- 普通标记点信息模板 -->
          <template v-else>
            <div class="popover-marker-info">
              <h3 v-if="marker.title">{{ marker.title }}</h3>
              <p v-if="marker.label">标签: {{ marker.label }}</p>
              <p>位置: {{ formatPosition(marker.position) }}</p>

              <!-- 显示标记点数据 -->
              <template v-if="marker.data && Object.keys(marker.data).length">
                <div class="popover-data-section">
                  <div v-for="(value, key) in getDisplayableData(marker.data)" :key="key" class="popover-data-item">
                    <span class="popover-data-key">{{ formatKey(key) }}:</span>
                    <span class="popover-data-value">{{ formatValue(value) }}</span>
                  </div>
                </div>
              </template>
            </div>
          </template>
        </template>

        <!-- 使用自定义模板 -->
        <template v-else>
          <div v-html="renderedTemplate"></div>
        </template>
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
  mapContainer?: HTMLElement;
  // 弹窗偏移量 [x, y]
  offset?: [number, number];
}

const props = withDefaults(defineProps<Props>(), {
  visible: false,
  position: () => [0, 0],
  template: '',
  mapContainer: undefined,
  offset: () => [0, -35]
});
const emit = defineEmits(['close']);

// 弹窗DOM引用
const popoverRef = ref<HTMLElement | null>(null);

// 弹窗位置样式
const popoverStyle = computed(() => {
  if (!props.position) return {};

  return {
    left: `${props.position[0] + props.offset[0]}px`,
    top: `${props.position[1] + props.offset[1]}px`,
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

// 重新定位弹窗以防止溢出地图容器
const repositionPopover = () => {
  if (!popoverRef.value || !props.mapContainer) return;

  nextTick(() => {
    const popover = popoverRef.value as HTMLElement;
    const container = props.mapContainer as HTMLElement;

    const popoverRect = popover.getBoundingClientRect();
    const containerRect = container.getBoundingClientRect();

    let { left, top } = popoverStyle.value;
    let offsetX = 0;
    let offsetY = 0;

    // 处理水平方向溢出
    if (popoverRect.right > containerRect.right) {
      offsetX = containerRect.right - popoverRect.right - 10;
    }
    if (popoverRect.left < containerRect.left) {
      offsetX = containerRect.left - popoverRect.left + 10;
    }

    // 处理垂直方向溢出
    if (popoverRect.bottom > containerRect.bottom) {
      offsetY = containerRect.bottom - popoverRect.bottom - 10;
    }
    if (popoverRect.top < containerRect.top) {
      offsetY = containerRect.top - popoverRect.top + 10;
    }

    // 应用偏移量
    if (offsetX !== 0 || offsetY !== 0) {
      const leftValue = parseFloat(String(left).replace('px', ''));
      const topValue = parseFloat(String(top).replace('px', ''));

      popover.style.left = `${leftValue + offsetX}px`;
      popover.style.top = `${topValue + offsetY}px`;
    }
  });
};

// 监听弹窗可见性变化，进行重新定位
watch(() => props.visible, (visible) => {
  if (visible) {
    repositionPopover();
  }
});

// 组件挂载时
onMounted(() => {
  // 弹窗可见时，进行定位调整
  if (props.visible) {
    repositionPopover();
  }

  // 添加窗口大小变化监听器，以调整弹窗位置
  window.addEventListener('resize', repositionPopover);
});

// 组件卸载时
onUnmounted(() => {
  window.removeEventListener('resize', repositionPopover);
});
</script>

<style scoped>
.map-popover {
  position: absolute;
  background-color: white;
  border-radius: 4px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.15);
  padding: 12px;
  max-width: 300px;
  min-width: 120px;
  word-break: break-word;
  font-size: 14px;
  line-height: 1.5;
  pointer-events: auto;
  border: 1px solid #ebeef5;
  z-index: 1000;
  transform-origin: center bottom;
  transition: opacity 0.2s, transform 0.2s;
}

.map-popover-hover {
  padding: 8px 12px;
  animation: fadeIn 0.2s;
}

.map-popover-click {
  padding: 12px 16px;
  z-index: 3001;
  animation: scaleIn 0.25s;
}

.map-popover-close {
  position: absolute;
  top: 8px;
  right: 10px;
  width: 20px;
  height: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  color: #909399;
  font-size: 18px;
  font-weight: bold;
  border-radius: 50%;
  transition: background-color 0.2s ease;
}

.map-popover-close:hover {
  background-color: #f2f6fc;
  color: #606266;
}

.map-popover-title {
  font-weight: bold;
  margin-bottom: 8px;
  color: #303133;
  border-bottom: 1px solid #ebeef5;
  padding-bottom: 8px;
  padding-right: 15px;
}

.map-popover-content {
  color: #606266;
}

.map-popover-content h3 {
  margin: 0 0 8px 0;
  font-size: 16px;
  color: #303133;
}

.map-popover-content p {
  margin: 5px 0;
}

.popover-data-section {
  margin-top: 8px;
  border-top: 1px dashed #ebeef5;
  padding-top: 8px;
}

.popover-data-item {
  display: flex;
  margin-bottom: 4px;
}

.popover-data-key {
  color: #909399;
  margin-right: 5px;
  flex-shrink: 0;
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
}

/* 动画 */
@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(5px);
  }

  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes scaleIn {
  from {
    opacity: 0;
    transform: scale(0.95);
  }

  to {
    opacity: 1;
    transform: scale(1);
  }
}
</style>