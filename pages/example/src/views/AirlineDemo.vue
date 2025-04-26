<template>
  <div class="airline-demo">
    <div class="header">
      <h2>航线示例</h2>
      <p>基于MyUI Flight航线组件的实现</p>
    </div>
    
    <div class="map-container">
      <ScMap
        ref="mapRef"
        type="amap"
        apiKey="your-api-key"
        :center="mapCenter"
        :zoom="zoom"
        height="650px"
        width="100%"
        :markers="[]"
      />
    </div>
    
    <div class="control-panel">
      <div class="panel-section">
        <h3>航线样式</h3>
        <div class="control-row">
          <label>颜色:</label>
          <input type="color" v-model="airlineStyle.color" @change="updateAirline">
        </div>
        <div class="control-row">
          <label>线宽:</label>
          <input type="range" min="1" max="10" v-model.number="airlineStyle.weight" @change="updateAirline">
          <span>{{ airlineStyle.weight }}</span>
        </div>
        <div class="control-row">
          <label>透明度:</label>
          <input type="range" min="0" max="1" step="0.1" v-model.number="airlineStyle.opacity" @change="updateAirline">
          <span>{{ airlineStyle.opacity }}</span>
        </div>
        <div class="control-row">
          <label>线型:</label>
          <select v-model="airlineStyle.lineStyle" @change="updateAirline">
            <option value="solid">实线</option>
            <option value="dashed">虚线</option>
          </select>
        </div>
      </div>
      
      <div class="panel-section">
        <h3>曲线设置</h3>
        <div class="control-row">
          <label>使用曲线:</label>
          <input type="checkbox" v-model="airlineStyle.isCurve" @change="updateAirline">
        </div>
        <div class="control-row" v-if="airlineStyle.isCurve">
          <label>曲率:</label>
          <input type="range" min="0" max="1" step="0.1" v-model.number="airlineStyle.curveness" @change="updateAirline">
          <span>{{ airlineStyle.curveness }}</span>
        </div>
      </div>
      
      <div class="panel-section">
        <h3>箭头设置</h3>
        <div class="control-row">
          <label>显示箭头:</label>
          <input type="checkbox" v-model="airlineStyle.showArrow" @change="updateAirline">
        </div>
        <div class="control-row" v-if="airlineStyle.showArrow">
          <label>箭头颜色:</label>
          <input type="color" v-model="airlineStyle.arrowColor" @change="updateAirline">
        </div>
      </div>
      
      <div class="panel-section">
        <h3>起终点</h3>
        <div class="control-row">
          <label>显示起终点:</label>
          <input type="checkbox" v-model="airlineStyle.showPoints" @change="updateAirline">
        </div>
        <div class="control-row" v-if="airlineStyle.showPoints">
          <label>起点颜色:</label>
          <input type="color" v-model="airlineStyle.startPointColor" @change="updateAirline">
        </div>
        <div class="control-row" v-if="airlineStyle.showPoints">
          <label>终点颜色:</label>
          <input type="color" v-model="airlineStyle.endPointColor" @change="updateAirline">
        </div>
        <div class="control-row" v-if="airlineStyle.showPoints">
          <label>点大小:</label>
          <input type="range" min="2" max="16" v-model.number="airlineStyle.pointSize" @change="updateAirline">
          <span>{{ airlineStyle.pointSize }}</span>
        </div>
        <div class="control-row" v-if="airlineStyle.showPoints">
          <label>点形状:</label>
          <select v-model="airlineStyle.pointStyle" @change="updateAirline">
            <option value="circle">圆形</option>
            <option value="square">方形</option>
            <option value="diamond">菱形</option>
          </select>
        </div>
      </div>
      
      <div class="panel-section">
        <h3>动画设置</h3>
        <div class="control-row">
          <label>启用动画:</label>
          <input type="checkbox" v-model="airlineStyle.animate" @change="updateAirline">
        </div>
        <div class="control-row" v-if="airlineStyle.animate">
          <label>动画时长:</label>
          <input type="range" min="500" max="10000" step="500" v-model.number="airlineStyle.duration" @change="updateAirline">
          <span>{{ airlineStyle.duration }}ms</span>
        </div>
        <div class="control-row" v-if="airlineStyle.animate">
          <label>轨迹长度:</label>
          <input type="range" min="0" max="1" step="0.1" v-model.number="airlineStyle.trailLength" @change="updateAirline">
          <span>{{ airlineStyle.trailLength }}</span>
        </div>
        <div class="control-row" v-if="airlineStyle.animate">
          <label>重复次数:</label>
          <input type="number" min="-1" max="10" v-model.number="airlineStyle.repeatCount" @change="updateAirline">
          <span>(-1 = 无限循环)</span>
        </div>
      </div>
      
      <div class="panel-section">
        <h3>特效设置</h3>
        <div class="control-row">
          <label>发光效果:</label>
          <input type="checkbox" v-model="airlineStyle.glow" @change="updateAirline">
        </div>
        <div class="control-row" v-if="airlineStyle.glow">
          <label>发光颜色:</label>
          <input type="color" v-model="airlineStyle.glowColor" @change="updateAirline">
        </div>
        <div class="control-row" v-if="airlineStyle.glow">
          <label>发光大小:</label>
          <input type="range" min="1" max="10" v-model.number="airlineStyle.glowSize" @change="updateAirline">
          <span>{{ airlineStyle.glowSize }}</span>
        </div>
      </div>
      
      <div class="panel-section">
        <h3>航线操作</h3>
        <div class="button-row">
          <button class="btn" @click="addRandomLine">添加随机航线</button>
          <button class="btn" @click="clearAllLines">清除所有航线</button>
        </div>
        <div class="button-row">
          <button class="btn" @click="addFlightLines">添加多条航线</button>
          <button class="btn" :disabled="!currentAirline" @click="removeCurrentLine">移除当前航线</button>
        </div>
        <div class="button-row" v-if="currentAirline && airlineStyle.animate">
          <button class="btn" @click="playAnimation">播放动画</button>
          <button class="btn" @click="pauseAnimation">暂停动画</button>
          <button class="btn" @click="stopAnimation">停止动画</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue';
import { ScMap } from '@repo/components';
import { AirlineStyle } from '@repo/types';

// 地图中心和缩放
const mapCenter = ref<[number, number]>([116.397428, 39.90923]);
const zoom = ref<number>(5);

// 地图引用
const mapRef = ref<any>(null);

// 当前选中的航线ID
const currentAirline = ref<string | null>(null);

// 航线样式
const airlineStyle = reactive<AirlineStyle>({
  color: '#1890FF',
  opacity: 0.8,
  weight: 3,
  lineStyle: 'solid',
  animate: true,
  duration: 3000,
  delay: 0,
  trailLength: 0.3,
  repeatCount: -1,
  gradient: false,
  startColor: '#1890FF',
  endColor: '#52C41A',
  showArrow: true,
  arrowColor: '#1890FF',
  showPoints: true,
  startPointColor: '#1890FF',
  endPointColor: '#52C41A',
  pointSize: 6,
  pointStyle: 'circle',
  isCurve: true,
  curveness: 0.2,
  glow: false,
  glowColor: '#FFFFFF',
  glowSize: 3,
  geodesic: true,
  zIndex: 50
});

// 常见城市坐标
const cities = [
  { name: '北京', position: [116.397428, 39.90923] },
  { name: '上海', position: [121.473701, 31.230416] },
  { name: '广州', position: [113.264435, 23.129163] },
  { name: '深圳', position: [114.085947, 22.547] },
  { name: '成都', position: [104.065735, 30.659462] },
  { name: '杭州', position: [120.155071, 30.274084] },
  { name: '南京', position: [118.767413, 32.041546] },
  { name: '武汉', position: [114.298572, 30.584355] },
  { name: '西安', position: [108.939838, 34.341568] },
  { name: '重庆', position: [106.551556, 29.563009] },
  { name: '青岛', position: [120.383428, 36.067235] },
  { name: '天津', position: [117.190186, 39.125595] },
  { name: '沈阳', position: [123.431474, 41.805698] },
  { name: '长沙', position: [112.938814, 28.228209] },
  { name: '哈尔滨', position: [126.642464, 45.756966] }
];

// 添加随机航线
const addRandomLine = () => {
  if (!mapRef.value) return;
  
  // 随机选择两个城市
  const sourceIndex = Math.floor(Math.random() * cities.length);
  let targetIndex;
  do {
    targetIndex = Math.floor(Math.random() * cities.length);
  } while (targetIndex === sourceIndex);
  
  const source = cities[sourceIndex];
  const target = cities[targetIndex];
  
  const path: [number, number][] = [
    source.position as [number, number],
    target.position as [number, number]
  ];
  
  // 复制当前样式
  const style = { ...airlineStyle };
  
  // 添加航线
  const airline = mapRef.value.addAirline(path, style);
  
  if (airline) {
    currentAirline.value = airline;
    console.log(`添加航线: ${source.name} -> ${target.name}, ID: ${airline}`);
  }
};

// 更新航线
const updateAirline = () => {
  if (!mapRef.value || !currentAirline.value) return;
  
  const style = { ...airlineStyle };
  mapRef.value.updateAirline(currentAirline.value, { style });
};

// 添加多条航线
const addFlightLines = () => {
  if (!mapRef.value) return;
  
  // 清除现有航线
  clearAllLines();
  
  // 添加从北京出发到所有其他城市的航线
  const beijing = cities[0]; // 北京
  
  for (let i = 1; i < Math.min(cities.length, 8); i++) {
    const target = cities[i];
    
    const path: [number, number][] = [
      beijing.position as [number, number],
      target.position as [number, number]
    ];
    
    // 随机样式
    const style = { 
      ...airlineStyle,
      color: getRandomColor(),
      opacity: 0.7,
      weight: 2 + Math.random() * 3,
      isCurve: true,
      curveness: 0.1 + Math.random() * 0.3,
      animate: Math.random() > 0.5,
      duration: 2000 + Math.random() * 5000,
      startPointColor: getRandomColor(),
      endPointColor: getRandomColor()
    };
    
    mapRef.value.addAirline(path, style);
  }
};

// 清除所有航线
const clearAllLines = () => {
  if (!mapRef.value) return;
  
  mapRef.value.clearAirlines();
  currentAirline.value = null;
};

// 移除当前航线
const removeCurrentLine = () => {
  if (!mapRef.value || !currentAirline.value) return;
  
  mapRef.value.removeAirline(currentAirline.value);
  currentAirline.value = null;
};

// 播放动画
const playAnimation = () => {
  // 这里不需要实现，因为动画已经在底层处理
  updateAirline();
};

// 暂停动画
const pauseAnimation = () => {
  // 这里不需要实现，因为动画已经在底层处理
};

// 停止动画
const stopAnimation = () => {
  // 这里不需要实现，因为动画已经在底层处理
};

// 生成随机颜色
const getRandomColor = () => {
  const letters = '0123456789ABCDEF';
  let color = '#';
  for (let i = 0; i < 6; i++) {
    color += letters[Math.floor(Math.random() * 16)];
  }
  return color;
};

// 添加初始航线
onMounted(() => {
  setTimeout(() => {
    addRandomLine();
  }, 1000);
});
</script>

<style scoped>
.airline-demo {
  display: flex;
  flex-direction: column;
  padding: 20px;
  background-color: #f5f7fa;
  min-height: 100vh;
}

.header {
  text-align: center;
  margin-bottom: 20px;
}

.header h2 {
  color: #333;
  margin-bottom: 8px;
}

.header p {
  color: #666;
  font-size: 14px;
}

.map-container {
  height: 650px;
  width: 100%;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
  margin-bottom: 20px;
}

.control-panel {
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
  justify-content: center;
}

.panel-section {
  background-color: white;
  padding: 16px;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  min-width: 250px;
  flex: 1;
  max-width: 300px;
}

.panel-section h3 {
  margin-top: 0;
  margin-bottom: 16px;
  font-size: 16px;
  color: #333;
  border-bottom: 1px solid #eee;
  padding-bottom: 8px;
}

.control-row {
  display: flex;
  align-items: center;
  margin-bottom: 12px;
}

.control-row label {
  width: 80px;
  font-size: 14px;
  color: #666;
}

.control-row input[type="range"] {
  flex: 1;
  margin-right: 8px;
}

.control-row span {
  min-width: 30px;
  text-align: right;
  font-size: 14px;
  color: #999;
}

.control-row select {
  flex: 1;
  padding: 4px;
  border-radius: 4px;
  border: 1px solid #ddd;
}

.button-row {
  display: flex;
  gap: 8px;
  margin-bottom: 12px;
}

.btn {
  padding: 8px 12px;
  background-color: #1890ff;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
  flex: 1;
  transition: background-color 0.3s;
}

.btn:hover {
  background-color: #40a9ff;
}

.btn:disabled {
  background-color: #ccc;
  cursor: not-allowed;
}
</style> 