/**
 * 热力图控制面板
 * @author CH
 * @date 2025-04-30
 */
<template>
  <div class="heatmap-panel" :class="[`position-${position}`, { active }]">
    <div class="panel-header">
      <div class="panel-title">热力图控制面板</div>
      <div class="panel-close" @click="handleClose">
        <svg viewBox="0 0 1024 1024" width="16" height="16">
          <path d="M563.2 512l262.4-262.4c14.1-14.1 14.1-36.9 0-51s-36.9-14.1-51 0L512 460.8 249.6 198.4c-14.1-14.1-36.9-14.1-51 0s-14.1 36.9 0 51L460.8 512 198.4 774.4c-14.1 14.1-14.1 36.9 0 51s36.9 14.1 51 0L512 563.2l262.4 262.4c14.1 14.1 36.9 14.1 51 0s14.1-36.9 0-51L563.2 512z" fill="currentColor"></path>
        </svg>
      </div>
    </div>
    
    <div class="panel-content">
      <!-- 热力图状态与操作 -->
      <div class="panel-section">
        <div class="section-title">状态</div>
        <div class="control-group">
          <label class="control-label">启用热力图:</label>
          <div class="toggle-switch" @click="toggleHeatmap">
            <div class="toggle-track" :class="{ active: active }">
              <div class="toggle-indicator"></div>
            </div>
          </div>
        </div>
        <div class="button-group">
          <button @click="randomPoints" :disabled="!active">随机点位</button>
          <button @click="clearPoints" :disabled="!active">清除全部</button>
        </div>
      </div>
      
      <!-- 热力图样式设置 -->
      <div class="panel-section">
        <div class="section-title">外观</div>
        <div class="control-group">
          <label class="control-label">热力点半径:</label>
          <div class="slider-container">
            <input type="range" min="5" max="30" step="1" v-model.number="radius" @input="updateConfig" />
            <div class="slider-value">{{ radius }}px</div>
          </div>
        </div>
        
        <div class="control-group">
          <label class="control-label">模糊度:</label>
          <div class="slider-container">
            <input type="range" min="5" max="30" step="1" v-model.number="blur" @input="updateConfig" />
            <div class="slider-value">{{ blur }}px</div>
          </div>
        </div>
        
        <div class="control-group">
          <label class="control-label">不透明度:</label>
          <div class="slider-container">
            <input type="range" min="0.1" max="1" step="0.1" v-model.number="opacity" @input="updateConfig" />
            <div class="slider-value">{{ opacity * 100 }}%</div>
          </div>
        </div>
        
        <div class="control-group">
          <label class="control-label">显示数据点:</label>
          <div class="toggle-switch" @click="togglePoints">
            <div class="toggle-track" :class="{ active: showPoints }">
              <div class="toggle-indicator"></div>
            </div>
          </div>
        </div>
        
        <div class="control-group" v-if="showPoints">
          <label class="control-label">点大小:</label>
          <div class="slider-container">
            <input type="range" min="2" max="10" step="1" v-model.number="pointRadius" @input="updateConfig" />
            <div class="slider-value">{{ pointRadius }}px</div>
          </div>
        </div>
      </div>
      
      <!-- 数据统计 -->
      <div class="panel-section">
        <div class="section-title">数据</div>
        <div class="panel-stat">
          <div class="stat-item">
            <div class="stat-value">{{ pointCount }}</div>
            <div class="stat-label">点位数量</div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue';
import { HeatmapObject } from '../composables/HeatmapObject';
import type { HeatmapConfig, HeatmapPoint } from '../types/heatmap';
import logger from '../composables/LogObject';
import { toLonLat } from 'ol/proj';

const props = defineProps<{
  position: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
  active: boolean;
  heatmapObj?: HeatmapObject | null;
}>();

const emit = defineEmits<{
  (e: 'close'): void;
  (e: 'update:active', active: boolean): void;
  (e: 'config-update', config: Partial<HeatmapConfig>): void;
}>();

// 内部配置状态
const radius = ref(15);
const blur = ref(15);
const opacity = ref(0.8);
const showPoints = ref(false);
const pointRadius = ref(4);
const pointCount = ref(0);

// 更新配置
const updateConfig = () => {
  const config: Partial<HeatmapConfig> = {
    radius: radius.value,
    blur: blur.value,
    opacity: opacity.value,
    showPoints: showPoints.value,
    pointRadius: pointRadius.value
  };
  
  if (props.heatmapObj) {
    props.heatmapObj.setConfig(config);
    
    // 更新点位显示状态
    props.heatmapObj.setPointsVisible(showPoints.value);
  }
  
  emit('config-update', config);
};

// 切换热力图状态
const toggleHeatmap = () => {
  if (props.heatmapObj) {
    if (props.active) {
      props.heatmapObj.disable();
    } else {
      props.heatmapObj.enable();
    }
    
    emit('update:active', !props.active);
  }
};

// 切换点位显示
const togglePoints = () => {
  showPoints.value = !showPoints.value;
  updateConfig();
};

// 关闭面板
const handleClose = () => {
  emit('close');
};

// 生成随机点位
const randomPoints = () => {
  if (!props.heatmapObj) return;
  
  // 清除现有点
  props.heatmapObj.clear();
  
  // 获取中心点
  let centerLon = 116.4;
  let centerLat = 39.9;
  
  try {
    // 尝试获取当前地图视图中心
    const view = props.heatmapObj['mapInstance']?.getView();
    if (view) {
      const center = view.getCenter();
      if (center) {
        const lonlat = view.getProjection().getCode() === 'EPSG:4326' 
          ? center 
          : toLonLat(center);
        centerLon = lonlat[0];
        centerLat = lonlat[1];
      }
    }
  } catch (e) {
    logger.warn('[HeatmapPanel] 获取地图中心点失败，使用默认值', e);
  }
  
  // 生成一些随机点
  const points: HeatmapPoint[] = [];
  const count = 100 + Math.floor(Math.random() * 150); // 100-250个点
  
  for (let i = 0; i < count; i++) {
    // 在中心点周围随机生成点，范围约为0.1经纬度
    const lon = centerLon + (Math.random() - 0.5) * 0.2;
    const lat = centerLat + (Math.random() - 0.5) * 0.2;
    
    // 为热点密度区域增加更多点
    let weight = Math.random();
    
    // 20%的点具有更高的权重
    if (Math.random() < 0.2) {
      weight = 0.7 + Math.random() * 0.3; // 0.7-1.0
    }
    
    points.push({
      longitude: lon,
      latitude: lat,
      weight: weight,
      name: `热力点 ${i+1}`
    });
  }
  
  // 添加点位
  props.heatmapObj.addPoints(points);
  updatePointCount();
};

// 清除所有点位
const clearPoints = () => {
  if (props.heatmapObj) {
    props.heatmapObj.clear();
    updatePointCount();
  }
};

// 更新点位计数
const updatePointCount = () => {
  if (props.heatmapObj) {
    pointCount.value = props.heatmapObj.getPointCount();
  } else {
    pointCount.value = 0;
  }
};

// 初始化配置
onMounted(() => {
  if (props.heatmapObj) {
    // 从heatmapObj获取当前配置
    try {
      const config = props.heatmapObj['config'];
      if (config) {
        radius.value = config.radius || 15;
        blur.value = config.blur || 15;
        opacity.value = config.opacity || 0.8;
        showPoints.value = config.showPoints || false;
        pointRadius.value = config.pointRadius || 4;
      }
    } catch (e) {
      logger.warn('[HeatmapPanel] 获取热力图配置失败，使用默认值', e);
    }
    
    // 获取点位数量
    updatePointCount();
  }
});

// 监听heatmapObj变化
watch(() => props.heatmapObj, (newObj) => {
  if (newObj) {
    updatePointCount();
  }
});
</script>

<style scoped>
.heatmap-panel {
  position: absolute;
  width: 280px;
  background-color: #ffffff;
  border-radius: 4px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.15);
  overflow: hidden;
  z-index: 1000;
  transition: transform 0.3s ease, opacity 0.3s ease;
  max-height: 500px;
  display: flex;
  flex-direction: column;
}

.panel-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 15px;
  background-color: #f0f2f5;
  border-bottom: 1px solid #e4e7ed;
}

.panel-title {
  font-weight: 600;
  font-size: 14px;
  color: #303133;
}

.panel-close {
  cursor: pointer;
  color: #909399;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  border-radius: 50%;
  transition: background-color 0.3s;
}

.panel-close:hover {
  background-color: #e4e7ed;
  color: #606266;
}

.panel-content {
  padding: 15px;
  overflow-y: auto;
  flex: 1;
}

.panel-section {
  margin-bottom: 20px;
}

.section-title {
  font-weight: 600;
  font-size: 13px;
  color: #606266;
  margin-bottom: 10px;
  padding-bottom: 5px;
  border-bottom: 1px solid #ebeef5;
}

.control-group {
  display: flex;
  align-items: center;
  margin-bottom: 10px;
}

.control-label {
  flex: 0 0 100px;
  font-size: 13px;
  color: #606266;
}

.slider-container {
  flex: 1;
  display: flex;
  align-items: center;
}

.slider-container input[type="range"] {
  flex: 1;
  height: 4px;
  -webkit-appearance: none;
  width: 100%;
  border-radius: 2px;
  background: #e4e7ed;
  outline: none;
}

.slider-container input[type="range"]::-webkit-slider-thumb {
  -webkit-appearance: none;
  width: 14px;
  height: 14px;
  border-radius: 50%;
  background: #409eff;
  cursor: pointer;
  transition: all 0.3s ease;
}

.slider-container input[type="range"]::-webkit-slider-thumb:hover {
  transform: scale(1.2);
}

.slider-value {
  margin-left: 10px;
  font-size: 13px;
  color: #606266;
  width: 40px;
  text-align: right;
}

.button-group {
  display: flex;
  gap: 10px;
  margin-top: 15px;
}

.button-group button {
  flex: 1;
  padding: 6px 12px;
  background-color: #409eff;
  color: #ffffff;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 13px;
  transition: background-color 0.3s;
}

.button-group button:hover {
  background-color: #66b1ff;
}

.button-group button:disabled {
  background-color: #c0c4cc;
  cursor: not-allowed;
}

.toggle-switch {
  cursor: pointer;
}

.toggle-track {
  width: 36px;
  height: 18px;
  border-radius: 9px;
  background-color: #dcdfe6;
  position: relative;
  transition: background-color 0.3s;
}

.toggle-track.active {
  background-color: #409eff;
}

.toggle-indicator {
  position: absolute;
  width: 14px;
  height: 14px;
  border-radius: 50%;
  background-color: #ffffff;
  top: 2px;
  left: 2px;
  transition: transform 0.3s;
}

.toggle-track.active .toggle-indicator {
  transform: translateX(18px);
}

.panel-stat {
  display: flex;
  justify-content: center;
  margin-top: 10px;
}

.stat-item {
  text-align: center;
  padding: 10px 15px;
  background-color: #f0f2f5;
  border-radius: 4px;
  min-width: 100px;
}

.stat-value {
  font-size: 20px;
  font-weight: 600;
  color: #409eff;
}

.stat-label {
  font-size: 12px;
  color: #606266;
  margin-top: 5px;
}

/* 位置样式 */
.position-top-left {
  top: 60px;
  left: 10px;
}

.position-top-right {
  top: 60px;
  right: 10px;
}

.position-bottom-left {
  bottom: 25px;
  left: 10px;
}

.position-bottom-right {
  bottom: 25px;
  right: 10px;
}
</style> 