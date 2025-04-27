<template>
  <div class="sc-map-example">
    <h2>ScMap 地图组件示例</h2>

    <div class="example-content">
      <!-- 左侧地图区域 -->
      <div class="map-area">
        <div class="map-container">
          <sc-map 
            ref="mapRef"
            height="500px" 
            :center="config.center" 
            :zoom="config.zoom" 
            :map-type="config.mapType"
            :dragging="config.dragging" 
            :scroll-wheel-zoom="config.scrollWheelZoom"
            :api-key="config.apiKey"
            :show-toolbar="config.showToolbar"
            :toolbar-config="toolbarConfig"
            @tool-activated="onToolActivated"
            @tool-deactivated="onToolDeactivated"
          />
        </div>
      </div>

      <!-- 右侧配置区域 -->
      <div class="config-area">
        <h3>配置参数</h3>
        
        <div class="config-section">
          <div class="config-item">
            <div class="label">交互控制</div>
            <div class="controls">
              <div class="control-row">
                <span>可拖动:</span>
                <el-switch v-model="config.dragging" />
                <span class="status-text">{{ config.dragging ? '开启' : '关闭' }}</span>
              </div>
              <div class="control-row">
                <span>滚轮缩放:</span>
                <el-switch v-model="config.scrollWheelZoom" />
                <span class="status-text">{{ config.scrollWheelZoom ? '开启' : '关闭' }}</span>
              </div>
            </div>
          </div>

          <div class="config-item">
            <div class="label">工具栏设置</div>
            <div class="controls">
              <div class="control-row">
                <span>显示工具栏:</span>
                <el-switch v-model="config.showToolbar" />
              </div>
              <div class="control-row buttons-row" v-if="config.showToolbar">
                <span>工具栏位置:</span>
                <el-radio-group v-model="toolbarSettings.position" size="small">
                  <el-radio-button label="top-left">左上角</el-radio-button>
                  <el-radio-button label="top-right">右上角</el-radio-button>
                  <el-radio-button label="bottom-left">左下角</el-radio-button>
                  <el-radio-button label="bottom-right">右下角</el-radio-button>
                </el-radio-group>
              </div>
              <div class="control-row" v-if="config.showToolbar">
                <span>排列方向:</span>
                <el-radio-group v-model="toolbarSettings.direction" size="small">
                  <el-radio-button label="horizontal">横向</el-radio-button>
                  <el-radio-button label="vertical">纵向</el-radio-button>
                </el-radio-group>
              </div>
              <div class="control-row" v-if="config.showToolbar">
                <span>每行工具数:</span>
                <el-slider 
                  v-model="toolbarSettings.itemsPerLine" 
                  :min="1" 
                  :max="10" 
                  :step="1"
                />
                <span class="value">{{ toolbarSettings.itemsPerLine }}</span>
              </div>
            </div>
          </div>

          <!-- 添加标记点操作区域 -->
          <div class="config-item">
            <div class="label">标记点操作</div>
            <div class="controls">
              <div class="control-row buttons-row">
                <el-button size="small" @click="addRandomMarkers(3)">添加随机标记</el-button>
                <el-button size="small" @click="clearAllMarkers">清除所有标记</el-button>
              </div>
              <div class="control-row buttons-row">
                <el-button size="small" @click="addMarkerGroup('group1', 'red')">添加红色组</el-button>
                <el-button size="small" @click="addMarkerGroup('group2', 'blue')">添加蓝色组</el-button>
              </div>
              <div class="control-row buttons-row">
                <el-button size="small" @click="toggleGroupVisibility('group1')">
                  {{ groupVisible.group1 ? '隐藏红色组' : '显示红色组' }}
                </el-button>
                <el-button size="small" @click="toggleGroupVisibility('group2')">
                  {{ groupVisible.group2 ? '隐藏蓝色组' : '显示蓝色组' }}
                </el-button>
              </div>
              <div class="control-row buttons-row">
                <el-button size="small" @click="toggleAllMarkers">
                  {{ allMarkersVisible ? '隐藏所有标记' : '显示所有标记' }}
                </el-button>
              </div>
            </div>
          </div>

        </div>
        
        <div class="preset-section">
          <h4>预设位置</h4>
          <div class="preset-buttons">
            <el-button @click="setPreset('beijing')">北京</el-button>
            <el-button @click="setPreset('shanghai')">上海</el-button>
            <el-button @click="setPreset('guangzhou')">广州</el-button>
            <el-button @click="setPreset('chongqing')">重庆</el-button>
          </div>
        </div>

        <div class="map-info">
          <div class="info-item">
            <span class="info-label">当前中心点:</span>
            <span class="info-value">{{ config.center[0].toFixed(4) }}, {{ config.center[1].toFixed(4) }}</span>
          </div>
          <div class="info-item">
            <span class="info-label">当前缩放:</span>
            <span class="info-value">{{ config.zoom }}</span>
          </div>
          <div class="info-item">
            <span class="info-label">交互状态:</span>
            <span class="info-value">{{ config.dragging ? '可拖动' : '禁止拖动' }}, {{ config.scrollWheelZoom ? '可缩放' : '禁止缩放' }}</span>
          </div>
          <div class="info-item">
            <span class="info-label">活动工具:</span>
            <span class="info-value">{{ activeTool || '无' }}</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import ScMap from '@repo/components/ScMap/index.vue';
import type { ScMapProps } from '@repo/components/ScMap/types';
import MAP_TYPES from '@repo/components/ScMap/types/default';
import * as logUtil from '@repo/utils';
import { computed, reactive, ref } from 'vue';
const { info, warn, error } = logUtil;

// 地图类型引用
const mapTypes = ref(MAP_TYPES);
const mapRef = ref<InstanceType<typeof ScMap> | null>(null);
const activeTool = ref<string>('');
const customToolCount = ref(0);
const allMarkersVisible = ref(true);
const groupVisible = reactive({
  group1: true,
  group2: true
});

// 基本配置
const config = reactive({
  center: [39.92, 116.40] as [number, number], // 默认北京
  zoom: 12,
  mapType: MAP_TYPES,
  dragging: true,
  scrollWheelZoom: true,
  apiKey: '',
  showToolbar: true,
});

// 工具栏配置
const toolbarSettings = reactive({
  position: 'top-left' as const,
  direction: 'horizontal' as const,
  itemsPerLine: 4,
  size: 36
});

// 合并为toolbarConfig
const toolbarConfig = computed(() => ({
  position: toolbarSettings.position,
  direction: toolbarSettings.direction,
  itemsPerLine: toolbarSettings.itemsPerLine,
  size: toolbarSettings.size
}));

// 设置预设位置
const setPreset = (city: string): void => {
  switch(city) {
    case 'beijing':
      config.center = [39.92, 116.40] as [number, number];
      config.zoom = 12;
      break;
    case 'shanghai':
      config.center = [31.23, 121.47] as [number, number];
      config.zoom = 11;
      break;
    case 'guangzhou':
      config.center = [23.13, 113.26] as [number, number];
      config.zoom = 10;
      break;
    case 'chongqing':
      config.center = [29.56, 106.55] as [number, number];
      config.zoom = 9;
      break;
  }
};

// 处理工具激活事件
const onToolActivated = (toolId: string): void => {
  activeTool.value = toolId;
};

// 处理工具停用事件
const onToolDeactivated = (toolId: string): void => {
  if (activeTool.value === toolId) {
    activeTool.value = '';
  }
};

// 添加随机标记点
const addRandomMarkers = (count: number = 3) => {
  if (!mapRef.value) {
    warn('地图实例未初始化');
    return;
  }
  
  const map = mapRef.value;
  const center = config.center;
  const offsetRange = 0.05; // 经纬度偏移范围
  
  try {
    for (let i = 0; i < count; i++) {
      // 计算随机位置（当前中心点附近）
      const lat = center[0] + (Math.random() * offsetRange * 2 - offsetRange);
      const lng = center[1] + (Math.random() * offsetRange * 2 - offsetRange);
      
      // 生成随机颜色
      const colors = ['#FF5252', '#448AFF', '#66BB6A', '#FFC107', '#AB47BC'];
      const color = colors[Math.floor(Math.random() * colors.length)];
      
      // 添加标记，并处理可能的错误
      try {
        const marker = map.addMarker({ lat, lng }, {
          markerId: `marker-random-${Date.now()}-${i}`,
          markerLabel: `标记 ${i+1}`,
          markerShowLabel: true,
          markerColor: color,
          markerClickable: true
        });
        
        if (!marker) {
          warn(`标记 ${i+1} 添加失败，可能地图组件尚未完全初始化`);
        }
      } catch (err) {
        error(`添加标记 ${i+1} 失败:`, err);
      }
    }
  } catch (e) {
    error('添加随机标记失败:', e);
  }
};

// 清除所有标记
const clearAllMarkers = () => {
  mapRef.value?.clearMarkers();
  allMarkersVisible.value = true;
};

// 添加标记分组
const addMarkerGroup = (groupName: string, color: string) => {
  if (!mapRef.value) return;
  
  const map = mapRef.value;
  const center = config.center;
  const offsetRange = 0.04; // 经纬度偏移范围
  const count = 3; // 每组标记数量
  
  // 设置颜色
  const markerColor = color === 'red' ? '#FF5252' : '#448AFF';
  
  for (let i = 0; i < count; i++) {
    // 计算随机位置（当前中心点附近）
    const lat = center[0] + (Math.random() * offsetRange * 2 - offsetRange);
    const lng = center[1] + (Math.random() * offsetRange * 2 - offsetRange);
    
    // 添加标记
    map.addMarker({ lat, lng }, {
      markerId: `${groupName}-${Date.now()}-${i}`,
      markerGroup: groupName,
      markerLabel: `${color} ${i+1}`,
      markerShowLabel: true,
      markerColor: markerColor,
      markerClickable: true
    });
  }
  
  // 更新分组可见状态
  groupVisible[groupName as keyof typeof groupVisible] = true;
};

// 切换分组可见性
const toggleGroupVisibility = (groupName: string) => {
  if (!mapRef.value) return;
  
  if (groupVisible[groupName as keyof typeof groupVisible]) {
    // 隐藏分组
    mapRef.value.hideGroup(groupName);
    groupVisible[groupName as keyof typeof groupVisible] = false;
  } else {
    // 显示分组
    mapRef.value.showGroup(groupName);
    groupVisible[groupName as keyof typeof groupVisible] = true;
  }
};

// 切换所有标记可见性
const toggleAllMarkers = () => {
  if (!mapRef.value) return;
  
  if (allMarkersVisible.value) {
    // 隐藏所有标记
    mapRef.value.hideAllMarkers();
    allMarkersVisible.value = false;
  } else {
    // 显示所有标记
    mapRef.value.showAllMarkers();
    allMarkersVisible.value = true;
  }
};

</script>

<style scoped>
.sc-map-example {
  padding: 20px;
}

h2 {
  margin-bottom: 20px;
  font-size: 24px;
  font-weight: bold;
}

.example-content {
  display: flex;
  gap: 20px;
  min-height: 550px;
}

.map-area {
  flex: 1;
  min-width: 0;
}

.config-area {
  width: 350px;
  flex-shrink: 0;
  padding: 15px;
  border: 1px solid #ebeef5;
  border-radius: 4px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
}

.map-container {
  height: 500px;
  border: 1px solid #dcdfe6;
  border-radius: 4px;
  overflow: hidden;
}

h3 {
  margin-top: 0;
  margin-bottom: 15px;
  font-size: 18px;
  font-weight: bold;
}

h4 {
  margin-top: 20px;
  margin-bottom: 10px;
  font-size: 16px;
}

.config-section {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.config-item {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.label {
  font-weight: bold;
  color: #606266;
  display: flex;
  align-items: center;
}

.value-badge {
  margin-left: 8px;
  background-color: #409eff;
  color: white;
  font-size: 12px;
  padding: 2px 6px;
  border-radius: 10px;
  font-weight: normal;
}

.controls {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.control-row {
  display: flex;
  align-items: center;
  gap: 10px;
}

.control-row span {
  width: 70px;
  flex-shrink: 0;
}

.value {
  width: 40px;
  text-align: right;
}

.status-text {
  font-size: 12px;
  color: #606266;
  width: auto !important;
}

.zoom-buttons {
  display: flex;
  justify-content: center;
  gap: 10px;
  margin-top: 5px;
}

.preset-section {
  margin-top: 20px;
}

.preset-buttons {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.custom-url-hint {
  font-size: 12px;
  color: #E6A23C;
  margin-top: 5px;
}

.map-info {
  margin-top: 20px;
  padding: 10px;
  background-color: #f8f8f8;
  border-radius: 4px;
  border: 1px solid #ebeef5;
}

.info-item {
  display: flex;
  margin-bottom: 5px;
}

.info-label {
  font-weight: bold;
  width: 80px;
  flex-shrink: 0;
}

.info-value {
  color: #409eff;
}

.buttons-row {
  display: flex;
  justify-content: space-between;
  width: 100%;
}

.buttons-row .el-button {
  flex: 1;
  min-width: 0;
}
</style>
