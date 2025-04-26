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
            :layer-type="config.layerType"
            :dragging="config.dragging" 
            :scroll-wheel-zoom="config.scrollWheelZoom"
            :api-key="config.apiKey"
            :show-toolbar="config.showToolbar"
            :toolbar-position="config.toolbarPosition"
            :toolbar-direction="config.toolbarDirection"
            :toolbar-items-per-line="config.toolbarItemsPerLine"
            :toolbar-size="config.toolbarSize"
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
            <div class="label">图层类型</div>
            <div class="controls">
              <el-radio-group v-model="config.layerType" size="small">
                <el-radio-button v-for="(type, key) in mapTypes" :key="key" :label="key">
                  {{ type.name }}
                </el-radio-button>
              </el-radio-group>
            </div>
          </div>

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
              <div class="control-row" v-if="config.showToolbar">
                <span>工具栏位置:</span>
                <el-select v-model="config.toolbarPosition" size="small">
                  <el-option label="左上角" value="top-left" />
                  <el-option label="右上角" value="top-right" />
                  <el-option label="左下角" value="bottom-left" />
                  <el-option label="右下角" value="bottom-right" />
                </el-select>
              </div>
              <div class="control-row" v-if="config.showToolbar">
                <span>排列方向:</span>
                <el-radio-group v-model="config.toolbarDirection" size="small">
                  <el-radio-button label="horizontal">横向</el-radio-button>
                  <el-radio-button label="vertical">纵向</el-radio-button>
                </el-radio-group>
              </div>
              <div class="control-row" v-if="config.showToolbar">
                <span>每行工具数:</span>
                <el-slider 
                  v-model="config.toolbarItemsPerLine" 
                  :min="1" 
                  :max="10" 
                  :step="1"
                />
                <span class="value">{{ config.toolbarItemsPerLine }}</span>
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
import { ref, reactive, onMounted } from 'vue';
import ScMap from '@repo/components/ScMap/index.vue';
import MAP_TYPES, { LayerType } from '@repo/components/ScMap/types';
import type { ScMapProps } from '@repo/components/ScMap/types';

// 地图类型引用
const mapTypes = ref(MAP_TYPES);
const mapRef = ref<InstanceType<typeof ScMap> | null>(null);
const activeTool = ref<string>('');
const customToolCount = ref(0);


const config = reactive<ScMapProps>({
  center: [39.92, 116.40], // 默认北京
  zoom: 12,
  mapType: MAP_TYPES,
  layerType: LayerType.NORMAL, // 默认标准地图
  dragging: true,
  scrollWheelZoom: true,
  apiKey: '',
  showToolbar: true,
  toolbarPosition: 'top-left',
  toolbarDirection: 'horizontal',
  toolbarItemsPerLine: 4,
});

// 设置预设位置
const setPreset = (city: string): void => {
  switch(city) {
    case 'beijing':
      config.center = [39.92, 116.40];
      config.zoom = 12;
      break;
    case 'shanghai':
      config.center = [31.23, 121.47];
      config.zoom = 11;
      break;
    case 'guangzhou':
      config.center = [23.13, 113.26];
      config.zoom = 10;
      break;
    case 'chongqing':
      config.center = [29.56, 106.55];
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
</style>
