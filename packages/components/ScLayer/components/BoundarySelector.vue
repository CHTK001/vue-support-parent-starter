<!-- 区划边界选择组件 -->
<template>
  <div class="boundary-selector" :class="{ active }">
    <div class="boundary-selector-header">
      <div class="title">区划边界</div>
      <div class="close-btn" @click="handleClose">×</div>
    </div>
    <div class="boundary-selector-content">
      <div class="boundary-selector-row">
        <div class="select-label">选择区域:</div>
        <div class="select-container">
          <select v-model="selectedProvince" @change="handleProvinceChange">
            <option value="">请选择省份</option>
            <option v-for="item in provinces" :key="item.code" :value="item.code">
              {{ item.name }}
            </option>
          </select>
          <select v-model="selectedCity" @change="handleCityChange" :disabled="!selectedProvince">
            <option value="">请选择城市</option>
            <option v-for="item in cities" :key="item.code" :value="item.code">
              {{ item.name }}
            </option>
          </select>
          <select v-model="selectedDistrict" @change="handleDistrictChange" :disabled="!selectedCity">
            <option value="">请选择区县</option>
            <option v-for="item in districts" :key="item.code" :value="item.code">
              {{ item.name }}
            </option>
          </select>
        </div>
      </div>

      <div class="boundary-style">
        <div class="style-title">样式设置</div>
        <div class="style-row">
          <div class="style-label">填充区域:</div>
          <div class="style-value">
            <input type="checkbox" v-model="boundaryOptions.fillBoundary" />
          </div>
        </div>
        <div class="style-row">
          <div class="style-label">边框颜色:</div>
          <div class="style-value">
            <input type="color" v-model="boundaryOptions.strokeColor" />
          </div>
        </div>
        <div class="style-row">
          <div class="style-label">边框宽度:</div>
          <div class="style-value">
            <input type="number" v-model.number="boundaryOptions.strokeWidth" min="1" max="10" />
          </div>
        </div>
        <div class="style-row" v-if="boundaryOptions.fillBoundary">
          <div class="style-label">填充颜色:</div>
          <div class="style-value">
            <input type="color" v-model="boundaryOptions.fillColor" />
          </div>
        </div>
        <div class="style-row" v-if="boundaryOptions.fillBoundary">
          <div class="style-label">填充透明度:</div>
          <div class="style-value">
            <input type="range" v-model.number="boundaryOptions.fillOpacity" min="0" max="1" step="0.1" />
            <span>{{ boundaryOptions.fillOpacity }}</span>
          </div>
        </div>
        <div class="style-row">
          <div class="style-label">显示标签:</div>
          <div class="style-value">
            <input type="checkbox" v-model="boundaryOptions.showLabel" />
          </div>
        </div>
      </div>

      <div class="boundary-action">
        <button @click="handleApply" class="apply-btn">应用</button>
        <button @click="handleClear" class="clear-btn">清除</button>
      </div>

      <div class="selected-boundaries" v-if="selectedBoundaries.length > 0">
        <div class="select-title">已选区域:</div>
        <div class="boundary-list">
          <div v-for="(boundary, index) in selectedBoundaries" :key="boundary.code" class="boundary-item">
            <span>{{ boundary.name }}</span>
            <button @click="handleRemoveBoundary(boundary.code, index)" class="remove-btn">×</button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
export default {
  name: 'BoundarySelector'
};
</script>

<script setup lang="ts">
import { ref, reactive, watchEffect, onMounted, defineProps, defineEmits } from 'vue';
import { BoundaryLevel, BoundaryItem, BoundaryOptions, DEFAULT_BOUNDARY_OPTIONS, BoundaryData } from '../types/boundary';

// 定义组件属性
const props = defineProps<{
  active: boolean;
  boundaryObj: any; // BoundaryObject 实例
}>();

// 定义事件
const emit = defineEmits(['close', 'apply', 'clear', 'remove']);

// 区划选择状态
const selectedProvince = ref('');
const selectedCity = ref('');
const selectedDistrict = ref('');

// 区划数据列表
const provinces = ref<BoundaryItem[]>([]);
const cities = ref<BoundaryItem[]>([]);
const districts = ref<BoundaryItem[]>([]);

// 样式配置
const boundaryOptions = reactive<BoundaryOptions>({
  ...DEFAULT_BOUNDARY_OPTIONS
});

// 已选择的边界列表
const selectedBoundaries = ref<BoundaryData[]>([]);

// 初始化
onMounted(async () => {
  // 加载省份数据
  await loadProvinces();
  
  // 获取当前已选择的边界
  if (props.boundaryObj) {
    selectedBoundaries.value = props.boundaryObj.getSelectedBoundaries();
    
    // 获取当前样式配置
    const currentOptions = props.boundaryObj.getOptions();
    Object.assign(boundaryOptions, currentOptions);
  }
});

// 监听区划选择变化
watchEffect(() => {
  if (!selectedProvince.value) {
    selectedCity.value = '';
    cities.value = [];
  }
  
  if (!selectedCity.value) {
    selectedDistrict.value = '';
    districts.value = [];
  }
});

// 加载省份数据
const loadProvinces = async () => {
  try {
    // 这里应该调用实际API获取省份列表
    // 暂时使用模拟数据
    provinces.value = [
      { id: '1', name: '北京市', level: BoundaryLevel.PROVINCE, code: '110000' },
      { id: '2', name: '天津市', level: BoundaryLevel.PROVINCE, code: '120000' },
      { id: '3', name: '河北省', level: BoundaryLevel.PROVINCE, code: '130000' },
      { id: '4', name: '山西省', level: BoundaryLevel.PROVINCE, code: '140000' },
      { id: '5', name: '内蒙古自治区', level: BoundaryLevel.PROVINCE, code: '150000' },
      // 其他省份...
    ];
  } catch (error) {
    console.error('加载省份数据失败:', error);
  }
};

// 处理省份选择变化
const handleProvinceChange = async () => {
  if (!selectedProvince.value) return;
  
  try {
    // 这里应该调用实际API获取城市列表
    // 暂时使用模拟数据
    cities.value = [
      { id: '1', name: '石家庄市', level: BoundaryLevel.CITY, code: '130100', parentCode: '130000' },
      { id: '2', name: '唐山市', level: BoundaryLevel.CITY, code: '130200', parentCode: '130000' },
      { id: '3', name: '秦皇岛市', level: BoundaryLevel.CITY, code: '130300', parentCode: '130000' },
      // 根据选择的省份显示不同城市...
    ];
    
    // 如果选择的是直辖市，可以直接加载区县
    if (['110000', '120000', '310000', '500000'].includes(selectedProvince.value)) {
      districts.value = [
        { id: '1', name: '东城区', level: BoundaryLevel.DISTRICT, code: '110101', parentCode: '110000' },
        { id: '2', name: '西城区', level: BoundaryLevel.DISTRICT, code: '110102', parentCode: '110000' },
        // 根据直辖市显示对应区县...
      ];
    }
  } catch (error) {
    console.error('加载城市数据失败:', error);
  }
};

// 处理城市选择变化
const handleCityChange = async () => {
  if (!selectedCity.value) return;
  
  try {
    // 这里应该调用实际API获取区县列表
    // 暂时使用模拟数据
    districts.value = [
      { id: '1', name: '长安区', level: BoundaryLevel.DISTRICT, code: '130102', parentCode: '130100' },
      { id: '2', name: '桥西区', level: BoundaryLevel.DISTRICT, code: '130104', parentCode: '130100' },
      { id: '3', name: '新华区', level: BoundaryLevel.DISTRICT, code: '130105', parentCode: '130100' },
      // 根据选择的城市显示不同区县...
    ];
  } catch (error) {
    console.error('加载区县数据失败:', error);
  }
};

// 处理区县选择变化
const handleDistrictChange = () => {
  // 可以在这里添加额外逻辑
};

// 应用区划配置
const handleApply = async () => {
  if (!props.boundaryObj) return;
  
  try {
    // 更新边界样式
    props.boundaryObj.setOptions(boundaryOptions);
    
    // 确定要添加的边界级别和代码
    let code = '';
    let level = BoundaryLevel.PROVINCE;
    
    if (selectedDistrict.value) {
      code = selectedDistrict.value;
      level = BoundaryLevel.DISTRICT;
    } else if (selectedCity.value) {
      code = selectedCity.value;
      level = BoundaryLevel.CITY;
    } else if (selectedProvince.value) {
      code = selectedProvince.value;
      level = BoundaryLevel.PROVINCE;
    } else {
      console.warn('未选择任何区域');
      return;
    }
    
    // 检查是否已添加该边界
    if (props.boundaryObj.hasBoundary(code)) {
      console.warn('已添加该边界');
      return;
    }
    
    // 加载并添加边界
    const boundaryData = await props.boundaryObj.loadBoundary(code, level);
    if (boundaryData) {
      props.boundaryObj.addBoundary(boundaryData);
      
      // 更新已选边界列表
      selectedBoundaries.value = props.boundaryObj.getSelectedBoundaries();
      
      // 发出应用事件
      emit('apply', {
        code,
        level,
        options: boundaryOptions
      });
    }
  } catch (error) {
    console.error('应用区划配置失败:', error);
  }
};

// 清除所有边界
const handleClear = () => {
  if (props.boundaryObj) {
    props.boundaryObj.clearBoundaries();
    selectedBoundaries.value = [];
    emit('clear');
  }
};

// 移除指定边界
const handleRemoveBoundary = (code: string, index: number) => {
  if (props.boundaryObj) {
    props.boundaryObj.removeBoundary(code);
    selectedBoundaries.value.splice(index, 1);
    emit('remove', code);
  }
};

// 关闭面板
const handleClose = () => {
  emit('close');
};
</script>

<style lang="scss" scoped>
.boundary-selector {
  position: absolute;
  width: 350px;
  background-color: #ffffff;
  border-radius: 4px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.15);
  z-index: 1000;
  top: 60px;
  left: 10px;
  opacity: 0;
  pointer-events: none;
  transform: translateY(-10px);
  transition: all 0.3s ease;
  
  &.active {
    opacity: 1;
    pointer-events: auto;
    transform: translateY(0);
  }
  
  &-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 12px 15px;
    border-bottom: 1px solid #e8e8e8;
    
    .title {
      font-weight: 600;
      font-size: 16px;
    }
    
    .close-btn {
      cursor: pointer;
      font-size: 18px;
      color: #999;
      
      &:hover {
        color: #333;
      }
    }
  }
  
  &-content {
    padding: 15px;
    max-height: 500px;
    overflow-y: auto;
  }
  
  &-row {
    margin-bottom: 15px;
    
    .select-label {
      margin-bottom: 8px;
      font-weight: 500;
    }
    
    .select-container {
      display: flex;
      flex-direction: column;
      gap: 8px;
      
      select {
        padding: 6px 8px;
        border: 1px solid #d9d9d9;
        border-radius: 4px;
        
        &:disabled {
          background-color: #f5f5f5;
          cursor: not-allowed;
        }
      }
    }
  }
  
  .boundary-style {
    margin-top: 20px;
    
    .style-title {
      font-weight: 500;
      margin-bottom: 10px;
      padding-bottom: 5px;
      border-bottom: 1px solid #f0f0f0;
    }
    
    .style-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 10px;
      
      .style-label {
        flex: 1;
      }
      
      .style-value {
        flex: 1;
        display: flex;
        align-items: center;
        
        input[type="color"] {
          width: 30px;
          height: 30px;
          border: none;
          border-radius: 4px;
          padding: 0;
          background: none;
          cursor: pointer;
        }
        
        input[type="range"] {
          width: 100px;
          margin-right: 8px;
        }
        
        input[type="number"] {
          width: 60px;
          padding: 4px;
          border: 1px solid #d9d9d9;
          border-radius: 4px;
        }
      }
    }
  }
  
  .boundary-action {
    margin-top: 20px;
    display: flex;
    gap: 10px;
    
    button {
      flex: 1;
      padding: 8px 16px;
      border: none;
      border-radius: 4px;
      cursor: pointer;
      
      &.apply-btn {
        background-color: #1677ff;
        color: white;
        
        &:hover {
          background-color: #0958d9;
        }
      }
      
      &.clear-btn {
        background-color: #f5f5f5;
        color: #333;
        
        &:hover {
          background-color: #e8e8e8;
        }
      }
    }
  }
  
  .selected-boundaries {
    margin-top: 20px;
    
    .select-title {
      font-weight: 500;
      margin-bottom: 10px;
    }
    
    .boundary-list {
      display: flex;
      flex-direction: column;
      gap: 8px;
      
      .boundary-item {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 8px 12px;
        background-color: #f5f5f5;
        border-radius: 4px;
        
        .remove-btn {
          background: none;
          border: none;
          color: #999;
          cursor: pointer;
          font-size: 16px;
          
          &:hover {
            color: #f5222d;
          }
        }
      }
    }
  }
}
</style> 