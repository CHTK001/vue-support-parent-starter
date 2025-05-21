<!-- 区划边界选择组件 -->
<template>
  <div class="boundary-selector" :class="[`position-${position}`, { active }]">
    <div class="boundary-selector-header">
      <div class="title">区划边界</div>
      <div class="header-actions">
          <!-- 设置按钮 -->
        <div class="boundary-player-setting-btn" @click.stop="showSettings = !showSettings" title="播放设置">
          <div class="setting-icon">
            <span>⚙</span>
          </div>
        </div>
      </div>
    </div>
    <div class="boundary-selector-content">
      <!-- 树形选择区域 -->
      <div class="boundary-tree">
        <el-tree
          ref="treeRef"
          :data="treeData"
          :props="defaultProps"
          node-key="code"
          show-checkbox
          @check="handleCheck"
          :default-expanded-keys="['110000']"
        >
          <template #default="{ node, data }">
            <span class="custom-tree-node">
              <span>{{ node.label }}</span>
            </span>
          </template>
        </el-tree>
      </div>

      <!-- 已选择的边界列表 -->
      <div class="selected-boundaries" v-if="selectedBoundaries.length > 0">
        <div class="select-title">已选区域:</div>
        <div class="boundary-list">
          <div v-for="(boundary, index) in selectedBoundaries" :key="boundary.code" class="boundary-item">
            <span>{{ boundary.name }}</span>
            <button @click="handleRemoveBoundary(boundary.code, index)" class="remove-btn">×</button>
          </div>
        </div>
      </div>

      <!-- 操作按钮 -->
      <div class="boundary-action">
        <button @click="handleApply" class="apply-btn">应用</button>
        <button @click="handleClear" class="clear-btn">清除</button>
      </div>
    </div>

    <!-- 设置面板 -->
    <div class="settings-panel" v-if="showSettings">
      <div class="settings-header">
        <span>样式设置</span>
        <button class="close-btn" @click="showSettings = false">×</button>
      </div>
      <div class="settings-content">
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
  boundaryObj: any;
  position?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
  defaultOptions?: {
    url?: string;
    provider?: string;
    fillBoundary?: boolean;
    strokeColor?: string;
    strokeWidth?: number;
    fillColor?: string;
    fillOpacity?: number;
    showLabel?: boolean;
  };
}>();

// 设置默认位置
const position = props.position || 'top-right';

// 定义事件
const emit = defineEmits(['close', 'apply', 'clear', 'remove']);

// 树形数据
const treeData = ref<any[]>([]);
const treeRef = ref();
const defaultProps = {
  children: 'children',
  label: 'name'
};

// 设置面板显示状态
const showSettings = ref(false);

// 样式配置
const boundaryOptions = reactive<BoundaryOptions>({
  ...DEFAULT_BOUNDARY_OPTIONS,
  ...(props.defaultOptions || {})
});

// 已选择的边界列表
const selectedBoundaries = ref<BoundaryData[]>([]);

// 初始化
onMounted(async () => {
  // 加载树形数据
  await loadTreeData();
  
  // 获取当前已选择的边界
  if (props.boundaryObj) {
    selectedBoundaries.value = props.boundaryObj.getSelectedBoundaries();
    
    // 获取当前样式配置
    const currentOptions = props.boundaryObj.getOptions();
    Object.assign(boundaryOptions, currentOptions);
  }
});

// 加载树形数据
const loadTreeData = async () => {
  try {
    // 这里应该调用实际API获取数据
    // 暂时使用模拟数据
    treeData.value = [
      {
        code: '110000',
        name: '北京市',
        children: [
          {
            code: '110100',
            name: '市辖区',
            children: [
              { code: '110101', name: '东城区' },
              { code: '110102', name: '西城区' }
            ]
          }
        ]
      },
      {
        code: '120000',
        name: '天津市',
        children: [
          {
            code: '120100',
            name: '市辖区',
            children: [
              { code: '120101', name: '和平区' },
              { code: '120102', name: '河东区' }
            ]
          }
        ]
      }
    ];
  } catch (error) {
    console.error('加载树形数据失败:', error);
  }
};

// 处理树节点选中
const handleCheck = (data: any, checked: any) => {
  console.log('选中节点:', data, checked);
};

// 应用区划配置
const handleApply = async () => {
  if (!props.boundaryObj) return;
  
  try {
    // 更新边界样式
    props.boundaryObj.setOptions(boundaryOptions);
    
    // 获取选中的节点
    const checkedNodes = (treeRef.value as any).getCheckedNodes();
    
    // 添加选中的边界
    for (const node of checkedNodes) {
      if (!props.boundaryObj.hasBoundary(node.code)) {
        const boundaryData = await props.boundaryObj.loadBoundary(node.code, getBoundaryLevel(node));
        if (boundaryData) {
          props.boundaryObj.addBoundary(boundaryData);
        }
      }
    }
    
    // 更新已选边界列表
    selectedBoundaries.value = props.boundaryObj.getSelectedBoundaries();
    
    // 发出应用事件
    emit('apply', {
      options: boundaryOptions
    });
  } catch (error) {
    console.error('应用区划配置失败:', error);
  }
};

// 获取边界级别
const getBoundaryLevel = (node: any): BoundaryLevel => {
  if (node.code.endsWith('0000')) return BoundaryLevel.PROVINCE;
  if (node.code.endsWith('00')) return BoundaryLevel.CITY;
  return BoundaryLevel.DISTRICT;
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
  border-radius: 8px;
  background-color: #ffffff;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.15);
  z-index: 1000;
  opacity: 0;
  pointer-events: none;
  transform: translateY(-10px);
  transition: all 0.3s ease;
  
  &.active {
    opacity: 1;
    pointer-events: auto;
    transform: translateY(0);
  }

  // 按位置调整面板显示位置
  &.position-top-left {
    top: 60px;
    left: 10px;
  }
  
  &.position-top-right {
    top: 60px;
    right: 10px;
  }
  
  &.position-bottom-left {
    bottom: 60px;
    left: 10px;
  }
  
  &.position-bottom-right {
    bottom: 60px;
    right: 10px;
  }
  
  &-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 12px 15px;
    background: linear-gradient(135deg, #1890ff, #096dd9);
    color: #fff;
    border-bottom: 1px solid rgba(255, 255, 255, 0.1);
    
    .title {
      font-weight: 600;
      font-size: 16px;
    }

    .header-actions {
      .settings-btn {
        background: none;
        border: none;
        cursor: pointer;
        padding: 4px;
        color: #666;
        
        &:hover {
          color: #1890ff;
        }
      }
    }
  }
  
  .boundary-player-setting-btn {
    background: rgba(255, 255, 255, 0.2);
    border: none;
    border-radius: 4px;
    width: 26px;
    height: 26px;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    margin-right: 8px;
    transition: background-color 0.2s, transform 0.2s;
  }

  .boundary-player-setting-btn:hover {
    background: rgba(255, 255, 255, 0.3);
    transform: scale(1.05);
  }
  
  &-content {
    padding: 15px;
    max-height: 500px;
    overflow-y: auto;
  }

  .boundary-tree {
    margin-bottom: 15px;
  }
  
  .selected-boundaries {
    margin-top: 15px;
    
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
  
  .boundary-action {
    margin-top: 15px;
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
}

.settings-panel {
  position: absolute;
  top: 0;
  right: -300px;
  width: 280px;
  background-color: #ffffff;
  border-radius: 4px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.15);
  z-index: 1001;
  
  .settings-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 12px 15px;
    border-bottom: 1px solid #e8e8e8;
    
    .close-btn {
      background: none;
      border: none;
      cursor: pointer;
      font-size: 16px;
      color: #999;
      
      &:hover {
        color: #666;
      }
    }
  }
  
  .settings-content {
    padding: 15px;
    
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
}
</style> 