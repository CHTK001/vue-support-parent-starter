/**
 * 飞线图面板组件
 * @description 用于管理和显示地图上的飞线图
 */
<template>
  <div class="flight-line-panel" :class="[positionClass, { active }]">
    <div class="panel-header">
      <div class="panel-title">飞线图配置</div>
      <div class="panel-actions">
        <button class="close-btn" @click="handleClose" title="关闭">
          <svg viewBox="0 0 1024 1024" width="14" height="14">
            <path
              d="M563.8 512l262.5-312.9c4.4-5.2.7-13.1-6.1-13.1h-79.8c-4.7 0-9.2 2.1-12.3 5.7L511.6 449.8 295.1 191.7c-3-3.6-7.5-5.7-12.3-5.7H203c-6.8 0-10.5 7.9-6.1 13.1L459.4 512 196.9 824.9c-4.4 5.2-.7 13.1 6.1 13.1h79.8c4.7 0 9.2-2.1 12.3-5.7l216.5-258.1 216.5 258.1c3 3.6 7.5 5.7 12.3 5.7h79.8c6.8 0 10.5-7.9 6.1-13.1L563.8 512z"
              fill="currentColor"
            ></path>
          </svg>
        </button>
      </div>
    </div>

    <div class="panel-content">
      <!-- 飞线配置部分 -->
      <div class="config-section">
        <div class="section-title">飞线样式</div>
        <div class="section-content">
          <div class="form-group">
            <label>线条颜色</label>
            <div class="color-picker">
              <input type="color" v-model="lineColor" @change="updateConfig" />
              <span>{{ lineColor }}</span>
      </div>
      </div>

          <div class="form-group">
            <label>线条宽度</label>
            <div class="slider-with-value">
              <input 
                type="range" 
                min="1" 
                max="10" 
                step="0.5" 
                v-model="lineWidth" 
                @change="updateConfig" 
              />
              <span>{{ lineWidth }}px</span>
        </div>
        </div>

          <div class="form-group">
            <label>弧线高度</label>
            <div class="slider-with-value">
              <input 
                type="range" 
                min="0.1" 
                max="2" 
                step="0.1" 
                v-model="arcHeight" 
                @change="updateConfig" 
              />
              <span>{{ arcHeight }}</span>
        </div>
      </div>

          <div class="form-group">
              <label>动画速度</label>
            <div class="slider-with-value">
              <input 
                type="range" 
                min="0.5" 
                max="10" 
                step="0.5" 
                v-model="animationSpeed" 
                @change="updateConfig" 
              />
              <span>{{ animationSpeed }}x</span>
              </div>
            </div>

          <div class="form-group">
            <div class="checkbox-group">
              <label>
                <input type="checkbox" v-model="showAnimation" @change="updateConfig" />
                <span>显示动画</span>
              </label>
              
              <label>
                <input type="checkbox" v-model="showGradient" @change="updateConfig" />
                <span>使用渐变色</span>
              </label>
                </div>
              </div>
                </div>
              </div>

      <!-- 飞线列表部分 -->
      <div class="flight-lines-section">
        <div class="section-title">
          <span>飞线列表</span>
          <div class="title-actions">
            <button class="action-btn" @click="handleSelectAll">全选</button>
            <button class="action-btn" @click="handleDeselectAll">取消选择</button>
                </div>
              </div>
        
        <div class="flight-lines-list">
          <div 
            v-for="item in flightLines" 
            :key="item.id"
            :class="['flight-line-item', { selected: selectedIds.includes(item.id) }]"
            @click="toggleSelection(item.id)"
          >
            <div class="flight-line-color" :style="{ backgroundColor: item.color || lineColor }"></div>
            <div class="flight-line-info">
              <div class="flight-line-name">{{ item.name || '未命名飞线' }}</div>
              <div class="flight-line-details">
                {{ item.from.name || '起点' }} → {{ item.to.name || '终点' }}
                    </div>
          </div>
            <div class="flight-line-actions">
              <button class="action-btn" @click.stop="toggleVisibility(item.id)">
                <svg viewBox="0 0 1024 1024" width="14" height="14">
                  <path v-if="item.visible !== false" d="M942.2 486.2C847.4 286.5 704.1 186 512 186c-192.2 0-335.4 100.5-430.2 300.3-7.7 16.2-7.7 35.2 0 51.5C176.6 737.5 319.9 838 512 838c192.2 0 335.4-100.5 430.2-300.3 7.7-16.3 7.7-35 0-51.5zM512 766c-161.3 0-279.4-81.8-362.7-254C232.6 339.8 350.7 258 512 258c161.3 0 279.4 81.8 362.7 254C791.5 684.2 673.4 766 512 766zm-4-430c-97.2 0-176 78.8-176 176s78.8 176 176 176 176-78.8 176-176-78.8-176-176-176zm0 288c-61.9 0-112-50.1-112-112s50.1-112 112-112 112 50.1 112 112-50.1 112-112 112z" fill="currentColor"></path>
                  <path v-else d="M942.2 486.2Q889.47 375.11 816.7 305l-50.88 50.88C807.31 395.53 843.45 447.4 874.7 512 791.5 684.2 673.4 766 512 766q-72.67 0-133.87-22.38L323 798.75Q408 838 512 838q288.3 0 430.2-300.3a60.29 60.29 0 000-51.5zm-63.57-320.64L836 122.88a8 8 0 00-11.32 0L715.31 232.2Q624.86 186 512 186q-288.3 0-430.2 300.3a60.3 60.3 0 000 51.5q56.69 119.4 136.5 191.41L112.48 835a8 8 0 000 11.31L155.17 889a8 8 0 0011.31 0l712.15-712.12a8 8 0 000-11.32zM149.3 512C232.6 339.8 350.7 258 512 258c54.54 0 104.13 9.36 149.12 28.39l-70.3 70.3a176 176 0 00-238.13 238.13l-83.42 83.42C223.1 637.49 183.3 582.28 149.3 512zm246.7 0a112.11 112.11 0 01146.2-106.69L401.31 546.2A112 112 0 01396 512z" fill="currentColor"></path>
                </svg>
              </button>
              <button class="action-btn delete-btn" @click.stop="handleDelete(item.id)">
                <svg viewBox="0 0 1024 1024" width="14" height="14">
                  <path d="M360 184h-8c4.4 0 8-3.6 8-8v8h304v-8c0 4.4 3.6 8 8 8h-8v72h72v-80c0-35.3-28.7-64-64-64H352c-35.3 0-64 28.7-64 64v80h72v-72zm504 72H160c-17.7 0-32 14.3-32 32v32c0 4.4 3.6 8 8 8h60.4l24.7 523c1.6 34.1 29.8 61 63.9 61h454c34.2 0 62.3-26.8 63.9-61l24.7-523H200c4.4 0 8-3.6 8-8v-32c0-17.7-14.3-32-32-32z" fill="currentColor"></path>
                </svg>
              </button>
          </div>
        </div>

          <div v-if="flightLines.length === 0" class="empty-list">
            暂无飞线数据
      </div>
    </div>
          </div>

      <!-- 底部操作区域 -->
      <div class="panel-footer">
        <button 
          class="primary-btn" 
          @click="handleAddFlightLine" 
          title="点击后在地图上选择两个点创建飞线"
        >
          添加飞线
        </button>
            </div>
            </div>
  </div>
</template>

<script lang="ts">
export default {
  name: 'FlightLinePanel'
};
</script>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue';

// 飞线数据接口
interface FlightLine {
  id: string;
  name?: string;
  from: {
    name?: string;
    latlng: [number, number];
  };
  to: {
    name?: string;
    latlng: [number, number];
  };
  color?: string;
  width?: number;
  arcHeight?: number;
  animationSpeed?: number;
  showAnimation?: boolean;
  showGradient?: boolean;
  visible?: boolean;
}

// 飞线对象接口
interface FlightLineObject {
  getAllFlightLines: () => FlightLine[];
  addFlightLine: (flightLine: Partial<FlightLine>) => string;
  updateFlightLine: (id: string, options: Partial<FlightLine>) => boolean;
  removeFlightLine: (id: string) => boolean;
  toggleFlightLineVisibility: (id: string) => boolean;
  startDrawing: () => void;
  getFlightLineById: (id: string) => FlightLine | null;
  updateFlightLineStyle: (options: {
    color?: string;
    width?: number;
    arcHeight?: number;
    animationSpeed?: number;
    showAnimation?: boolean;
    showGradient?: boolean;
  }) => void;
}

// 组件属性
const props = defineProps<{
  flightLineObj?: FlightLineObject;
  active: boolean;
  position?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
}>();

// 组件事件
const emit = defineEmits<{
  (e: 'close'): void;
  (e: 'selection-change', payload: { selectedIds: string[]; count: number }): void;
}>();

// 组件状态
const flightLines = ref<FlightLine[]>([]);
const selectedIds = ref<string[]>([]);
const lineColor = ref('#1890ff');
const lineWidth = ref(2);
const arcHeight = ref(0.5);
const animationSpeed = ref(3);
const showAnimation = ref(true);
const showGradient = ref(true);

// 计算位置样式类
const positionClass = computed(() => props.position ? `position-${props.position}` : 'position-top-right');
  
// 刷新飞线列表
const refreshFlightLines = () => {
  if (!props.flightLineObj) return;
  
  try {
    flightLines.value = props.flightLineObj.getAllFlightLines();
            } catch (error) {
    console.error('获取飞线数据失败:', error);
    flightLines.value = [];
  }
};

// 更新配置
const updateConfig = () => {
  if (!props.flightLineObj) return;
  
  props.flightLineObj.updateFlightLineStyle({
    color: lineColor.value,
    width: Number(lineWidth.value),
    arcHeight: Number(arcHeight.value),
    animationSpeed: Number(animationSpeed.value),
    showAnimation: showAnimation.value,
    showGradient: showGradient.value
  });
};

// 切换选择状态
const toggleSelection = (id: string) => {
  const index = selectedIds.value.indexOf(id);
  if (index > -1) {
    selectedIds.value.splice(index, 1);
  } else {
    selectedIds.value.push(id);
  }
  
  // 通知选择变化
  emit('selection-change', {
    selectedIds: [...selectedIds.value],
    count: selectedIds.value.length
  });
};

// 全选
const handleSelectAll = () => {
  selectedIds.value = flightLines.value.map(item => item.id);
      
  // 通知选择变化
  emit('selection-change', {
    selectedIds: [...selectedIds.value],
    count: selectedIds.value.length
  });
};

// 取消全选
const handleDeselectAll = () => {
  selectedIds.value = [];
  
  // 通知选择变化
  emit('selection-change', {
    selectedIds: [],
    count: 0
  });
};

// 切换可见性
const toggleVisibility = (id: string) => {
  if (!props.flightLineObj) return;
  
  props.flightLineObj.toggleFlightLineVisibility(id);
  
  // 刷新列表
  refreshFlightLines();
};

// 删除飞线
const handleDelete = (id: string) => {
  if (!props.flightLineObj) return;
  
  // 如果飞线在选中列表中，先移除
  const index = selectedIds.value.indexOf(id);
  if (index > -1) {
    selectedIds.value.splice(index, 1);
  }
  
  // 删除飞线
  props.flightLineObj.removeFlightLine(id);
  
  // 刷新列表
  refreshFlightLines();
    
  // 通知选择变化
  emit('selection-change', {
    selectedIds: [...selectedIds.value],
    count: selectedIds.value.length
  });
};

// 添加飞线
const handleAddFlightLine = () => {
  if (!props.flightLineObj) return;
  
  // 开始绘制模式
  props.flightLineObj.startDrawing();
};

// 关闭面板
const handleClose = () => {
  emit('close');
};

// 监听飞线对象变化
watch(() => props.flightLineObj, (newObj) => {
  if (newObj) {
    refreshFlightLines();
    }
}, { immediate: true });

// 组件挂载
onMounted(() => {
  // 初始化飞线列表
  refreshFlightLines();
});
</script>

<style scoped>
.flight-line-panel {
  position: absolute;
  background-color: #fff;
  border-radius: 4px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
  width: 320px;
  max-width: 90%;
  z-index: 1000;
  transform: translateY(-100%);
  opacity: 0;
  visibility: hidden;
  transition: all 0.3s ease;
}

.flight-line-panel.active {
  transform: translateY(0);
  opacity: 1;
  visibility: visible;
}

.position-top-left {
  top: 10px;
  left: 10px;
}

.position-top-right {
  top: 10px;
  right: 10px;
}

.position-bottom-left {
  bottom: 10px;
  left: 10px;
}

.position-bottom-right {
  bottom: 10px;
  right: 10px;
}

.panel-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  background-color: #1890ff;
  color: #fff;
  border-top-left-radius: 4px;
  border-top-right-radius: 4px;
}

.panel-title {
  font-size: 14px;
  font-weight: 500;
}

.panel-actions {
  display: flex;
  align-items: center;
}

.close-btn {
  background: none;
  border: none;
  color: #fff;
  cursor: pointer;
  padding: 2px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: transform 0.3s ease;
}

.close-btn:hover {
  transform: scale(1.1);
}

.panel-content {
  display: flex;
  flex-direction: column;
  max-height: 60vh;
  overflow-y: auto;
}

.config-section {
  padding: 16px;
  border-bottom: 1px solid #f0f0f0;
}

.section-title {
  font-size: 14px;
  font-weight: 500;
  margin-bottom: 12px;
  color: #333;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.title-actions {
  display: flex;
  gap: 8px;
}

.section-content {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.form-group label {
  font-size: 12px;
  color: #666;
}

.color-picker {
  display: flex;
  align-items: center;
  gap: 8px;
}

.color-picker input {
  width: 32px;
  height: 32px;
  border: none;
    border-radius: 4px;
  cursor: pointer;
}

.color-picker span {
  font-size: 12px;
  color: #666;
}

.slider-with-value {
  display: flex;
  align-items: center;
  gap: 8px;
}

.slider-with-value input {
  flex: 1;
}

.slider-with-value span {
  font-size: 12px;
  color: #666;
  min-width: 36px;
  text-align: right;
}

.checkbox-group {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
}

.checkbox-group label {
  display: flex;
  align-items: center;
  gap: 6px;
  cursor: pointer;
}

.flight-lines-section {
  padding: 16px;
}

.flight-lines-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
  max-height: 240px;
  overflow-y: auto;
}

.flight-line-item {
  display: flex;
  align-items: center;
  padding: 10px;
  border: 1px solid #e8e8e8;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.3s ease;
}

.flight-line-item:hover {
  background-color: #f5f5f5;
}

.flight-line-item.selected {
  background-color: #e6f7ff;
  border-color: #1890ff;
}

.flight-line-color {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  margin-right: 10px;
}

.flight-line-info {
  flex: 1;
  min-width: 0;
}

.flight-line-name {
  font-size: 14px;
  color: #333;
  margin-bottom: 4px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.flight-line-details {
  font-size: 12px;
  color: #999;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.flight-line-actions {
  display: flex;
  gap: 8px;
}

.action-btn {
  background: none;
  border: none;
  color: #666;
  cursor: pointer;
  padding: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s ease;
  border-radius: 4px;
}

.action-btn:hover {
  background-color: #f0f0f0;
  color: #1890ff;
}

.delete-btn:hover {
  color: #ff4d4f;
}

.empty-list {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100px;
  color: #999;
  font-size: 14px;
}

.panel-footer {
  padding: 16px;
  border-top: 1px solid #f0f0f0;
  display: flex;
  justify-content: center;
}

.primary-btn {
  background-color: #1890ff;
  color: #fff;
  border: none;
  border-radius: 4px;
  padding: 8px 16px;
  cursor: pointer;
  transition: all 0.3s ease;
  font-size: 14px;
}

.primary-btn:hover {
  background-color: #40a9ff;
}

input[type="range"] {
  -webkit-appearance: none;
  width: 100%;
  height: 6px;
  border-radius: 3px;
  background: #e6e6e6;
  outline: none;
}

input[type="range"]::-webkit-slider-thumb {
  -webkit-appearance: none;
  width: 16px;
  height: 16px;
  border-radius: 50%;
  background: #1890ff;
  cursor: pointer;
}

input[type="range"]::-moz-range-thumb {
  width: 16px;
  height: 16px;
  border-radius: 50%;
  background: #1890ff;
  cursor: pointer;
  border: none;
}
</style> 