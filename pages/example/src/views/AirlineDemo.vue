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
import { ScMap } from '@/components';
import { AirlineStyle } from '@/types';

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
    currentAirline.value = airline.__id;
    console.log(`添加航线: ${source.name} -> ${target.name}，ID: ${airline.__id}`);
  }
};

// 添加多条航线
const addFlightLines = () => {
  if (!mapRef.value) return;
  
  // 以北京为中心，添加到其他城市的航线
  const sourceCity = cities[0]; // 北京
  
  for (let i = 1; i < 7; i++) {
    const targetCity = cities[i];
    
    const path: [number, number][] = [
      sourceCity.position as [number, number],
      targetCity.position as [number, number]
    ];
    
    // 为每条航线设置不同的样式
    const style: AirlineStyle = {
      ...airlineStyle,
      color: getRandomColor(),
      animate: true,
      delay: i * 500, // 错开延迟
      duration: 2000 + i * 500, // 不同的动画持续时间
      isCurve: true,
      curveness: 0.1 + i * 0.05,
      showPoints: true
    };
    
    // 添加航线
    const airline = mapRef.value.addAirline(path, style);
    
    if (airline) {
      console.log(`添加航线: ${sourceCity.name} -> ${targetCity.name}，ID: ${airline.__id}`);
    }
  }
};

// 移除当前航线
const removeCurrentLine = () => {
  if (!mapRef.value || !currentAirline.value) return;
  
  mapRef.value.removeAirline(currentAirline.value);
  currentAirline.value = null;
};

// 清除所有航线
const clearAllLines = () => {
  if (!mapRef.value) return;
  
  mapRef.value.clearAirlines();
  currentAirline.value = null;
};

// 更新航线样式
const updateAirline = () => {
  if (!mapRef.value || !currentAirline.value) return;
  
  mapRef.value.updateAirline(currentAirline.value, undefined, airlineStyle);
};

// 播放动画
const playAnimation = () => {
  if (!mapRef.value || !currentAirline.value) return;
  
  const updatedStyle = { ...airlineStyle, animate: true };
  mapRef.value.updateAirline(currentAirline.value, undefined, updatedStyle);
};

// 暂停动画
const pauseAnimation = () => {
  // 暂停需要特殊处理，这里简化为修改重复次数为0
  if (!mapRef.value || !currentAirline.value) return;
  
  const updatedStyle = { ...airlineStyle, repeatCount: 0 };
  mapRef.value.updateAirline(currentAirline.value, undefined, updatedStyle);
};

// 停止动画
const stopAnimation = () => {
  if (!mapRef.value || !currentAirline.value) return;
  
  const updatedStyle = { ...airlineStyle, animate: false };
  mapRef.value.updateAirline(currentAirline.value, undefined, updatedStyle);
};

// 获取随机颜色
const getRandomColor = () => {
  const letters = '0123456789ABCDEF';
  let color = '#';
  for (let i = 0; i < 6; i++) {
    color += letters[Math.floor(Math.random() * 16)];
  }
  return color;
};

// 组件挂载后自动添加一条航线
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
  max-width: 1200px;
  margin: 0 auto;
}

.header {
  margin-bottom: 20px;
}

.header h2 {
  font-size: 24px;
  margin-bottom: 8px;
}

.header p {
  color: #666;
}

.map-container {
  width: 100%;
  height: 650px;
  margin-bottom: 20px;
  border: 1px solid #e0e0e0;
  border-radius: 4px;
  overflow: hidden;
}

.control-panel {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 20px;
}

.panel-section {
  background-color: #f5f5f5;
  border-radius: 4px;
  padding: 15px;
}

.panel-section h3 {
  margin-top: 0;
  margin-bottom: 15px;
  font-size: 16px;
  border-bottom: 1px solid #e0e0e0;
  padding-bottom: 8px;
}

.control-row {
  display: flex;
  align-items: center;
  margin-bottom: 10px;
}

.control-row label {
  width: 100px;
  flex-shrink: 0;
}

.control-row input[type="range"] {
  flex: 1;
  margin-right: 10px;
}

.control-row span {
  min-width: 35px;
  text-align: right;
}

.button-row {
  display: flex;
  gap: 10px;
  margin-bottom: 10px;
}

.btn {
  padding: 8px 12px;
  background-color: #1890ff;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  transition: background-color 0.3s;
}

.btn:hover {
  background-color: #40a9ff;
}

.btn:disabled {
  background-color: #d9d9d9;
  cursor: not-allowed;
}
</style> 