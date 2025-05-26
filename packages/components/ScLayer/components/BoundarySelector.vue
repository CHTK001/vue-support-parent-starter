<!-- 区划边界选择组件 -->
<template>
  <div class="boundary-selector" :class="{ active: active }" :style="positionStyle">
    <div class="boundary-selector-header">
      <div class="title">区划选择器</div>
      <div class="actions">
        <button class="btn btn-icon" @click="locateCurrent" title="定位到当前">
          <i class="iconfont icon-location"></i>
        </button>
        <button class="btn btn-icon" @click="toggleSettings" title="设置">
          <i class="iconfont icon-setting"></i>
        </button>
        <button class="btn btn-icon" @click="$emit('close')" title="关闭">
          <i class="iconfont icon-close"></i>
        </button>
      </div>
    </div>
    
    <div class="boundary-selector-content">
      <div class="search-box">
        <input type="text" v-model="searchText" placeholder="搜索行政区划..." />
      </div>
      
      <div class="tree-container">
        <a-tree
          v-if="treeData.length > 0"
          :tree-data="treeData"
          :expandedKeys="expandedKeys"
          :selectedKeys="selectedKeys"
          :replaceFields="{ children: 'children', title: 'title', key: 'key' }"
          @select="onSelect"
          @expand="onExpand"
        >
          <template #title="{ title, selected }">
            <span :class="{ 'selected-node': selected }">{{ title }}</span>
          </template>
        </a-tree>
        <div v-else class="loading-state">
          <div v-if="isLoading">加载中...</div>
          <div v-else class="error-state">
            <p>加载失败</p>
            <button class="btn btn-sm" @click="loadDistrictTree">重试</button>
          </div>
        </div>
      </div>
      
      <div class="selected-boundaries" v-if="selectedBoundaries.length > 0">
        <div class="selected-header">
          <span>已选区划</span>
          <div class="actions">
            <button class="btn btn-sm btn-primary" @click="applyBoundaries">应用</button>
            <button class="btn btn-sm" @click="clearBoundaries">清空</button>
          </div>
        </div>
        <div class="selected-list">
          <div v-for="item in selectedBoundaries" :key="item.code" class="selected-item">
            <span>{{ item.name }}</span>
            <button class="btn btn-icon btn-sm" @click="removeBoundary(item.code)" title="移除">
              <i class="iconfont icon-delete"></i>
            </button>
          </div>
        </div>
      </div>
    </div>
    
    <div class="settings-panel" v-if="showSettings">
      <h3>边界显示设置</h3>
      
      <div class="setting-item">
        <label>填充区域</label>
        <a-switch v-model:checked="options.fillBoundary" />
      </div>
      
      <div class="setting-item">
        <label>边框颜色</label>
        <a-color-picker v-model:value="options.strokeColor" />
      </div>
      
      <div class="setting-item">
        <label>边框宽度</label>
        <a-slider v-model:value="options.strokeWidth" :min="1" :max="5" :step="0.5" />
      </div>
      
      <div class="setting-item">
        <label>填充颜色</label>
        <a-color-picker v-model:value="options.fillColor" />
      </div>
      
      <div class="setting-item">
        <label>填充透明度</label>
        <a-slider v-model:value="options.fillOpacity" :min="0" :max="1" :step="0.05" />
      </div>
      
      <div class="setting-item">
        <label>显示标签</label>
        <a-switch v-model:checked="options.showLabel" />
      </div>
      
      <div class="setting-item" v-if="options.showLabel">
        <label>标签大小</label>
        <a-slider v-model:value="options.labelOptions.fontSize" :min="10" :max="24" :step="1" />
      </div>
      
      <div class="setting-item" v-if="options.showLabel">
        <label>标签颜色</label>
        <a-color-picker v-model:value="options.labelOptions.fontColor" />
      </div>
      
      <div class="actions">
        <button class="btn btn-sm btn-primary" @click="applySettings">应用</button>
        <button class="btn btn-sm" @click="resetSettings">重置</button>
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
import { ref, computed, onMounted, watch } from 'vue';
import type { TreeDataItem } from 'ant-design-vue';
import { BoundaryLevel, BoundaryData, BoundaryOptions } from '../types/boundary';
import { DEFAULT_BOUNDARY_OPTIONS } from '../types/default';
import { MapType } from '../types/map';
import { ApiUrls } from '../types/api';
import logger from '../composables/LogObject';
import { message } from '@repo/utils';

// 定义组件属性
const props = defineProps({
  active: {
    type: Boolean,
    default: false
  },
  position: {
    type: String,
    default: 'top-right',
    validator: (value: string) => ['top-left', 'top-right', 'bottom-left', 'bottom-right'].includes(value)
  },
  boundaryObj: {
    type: Object,
    required: true
  },
  defaultOptions: {
    type: Object,
    default: () => DEFAULT_BOUNDARY_OPTIONS
  },
  mapKey: {
    type: Object,
    default: () => ({})
  },
  // 添加 apiUrls 属性
  apiUrls: {
    type: Object as () => ApiUrls,
    default: () => ({})
  },
  // 保留旧属性以保持向后兼容性
  boundaryUrl: {
    type: String,
    default: ''
  },
  districtUrl: {
    type: String,
    default: ''
  }
});

// 定义组件事件
const emit = defineEmits(['close', 'apply', 'clear', 'remove']);

// 组件状态
const searchText = ref('');
const treeData = ref<TreeDataItem[]>([]);
const rawTreeData = ref<any[]>([]);
const expandedKeys = ref<string[]>([]);
const selectedKeys = ref<string[]>([]);
const selectedBoundaries = ref<BoundaryData[]>([]);
const showSettings = ref(false);
const isLoading = ref(false);
const options = ref<BoundaryOptions>({...DEFAULT_BOUNDARY_OPTIONS, ...props.defaultOptions});

// 位置样式
const positionStyle = computed(() => {
  switch (props.position) {
    case 'top-left':
      return { top: '10px', left: '10px' };
    case 'top-right':
      return { top: '10px', right: '10px' };
    case 'bottom-left':
      return { bottom: '10px', left: '10px' };
    case 'bottom-right':
      return { bottom: '10px', right: '10px' };
    default:
      return { top: '10px', right: '10px' };
  }
});

// 过滤后的树数据
const filteredTreeData = computed(() => {
  if (!searchText.value) return treeData.value;
  
  const filterTree = (nodes: TreeDataItem[]): TreeDataItem[] => {
    return nodes.filter(node => {
      const titleMatch = (node.title as string).toLowerCase().includes(searchText.value.toLowerCase());
      const childMatch = node.children ? filterTree(node.children as TreeDataItem[]).length > 0 : false;
      
      if (childMatch && node.children) {
        node.children = filterTree(node.children as TreeDataItem[]);
      }
      
      return titleMatch || childMatch;
    });
  };
  
  return filterTree([...treeData.value]);
});

// 生命周期钩子
onMounted(async () => {
  try {
    await loadDistrictTree();
  } catch (error) {
    logger.error('加载区划树失败:', error);
  }
});

// 加载区划树
async function loadDistrictTree() {
  isLoading.value = true;
  try {
    // 优先使用 apiUrls，然后是旧的 districtUrl 属性
    const districtUrl = props.apiUrls?.district || props.districtUrl || undefined;
    
    // 获取区划树数据
    const districtTree = await props.boundaryObj.loadDistrictTree(props.mapKey, districtUrl);
    rawTreeData.value = districtTree;
    
    // 转换为树形结构
    treeData.value = formatTreeData(districtTree);
    
    // 默认展开第一级
    if (treeData.value.length > 0) {
      expandedKeys.value = [treeData.value[0].key as string];
    }
  } catch (error) {
    logger.error('加载区划树失败:', error);
    message.error('加载区划树失败，请检查网络连接或API密钥');
  } finally {
    isLoading.value = false;
  }
}

// 格式化树形数据
function formatTreeData(data: any[]): TreeDataItem[] {
  return data.map(item => ({
    title: item.name,
    key: item.adcode,
    children: item.districts && item.districts.length > 0 ? formatTreeData(item.districts) : undefined,
    isLeaf: !item.districts || item.districts.length === 0
  }));
}

// 选择节点
async function onSelect(selectedKeys: string[], info: any) {
  if (selectedKeys.length === 0) return;
  
  const key = selectedKeys[0];
  const node = info.node;
  
  // 如果已经选择了该节点，则不重复添加
  if (selectedBoundaries.value.some(item => item.code === key)) {
    return;
  }
  
  try {
    // 优先使用 apiUrls，然后是旧的 boundaryUrl 属性
    const boundaryUrl = props.apiUrls?.boundary || props.boundaryUrl || undefined;
    
    // 添加边界
    const added = await props.boundaryObj.addBoundaryByAdcode(key, {
      ...options.value,
      mapKey: props.mapKey,
      // 使用 apiUrls 对象传递 API URL
      apiUrls: {
        boundary: boundaryUrl
      }
    });
    
    if (added) {
      // 获取添加的边界数据
      const boundaries = props.boundaryObj.getSelectedBoundaries();
      const boundary = boundaries.find(b => b.code === key);
      
      if (boundary) {
        selectedBoundaries.value.push(boundary);
      }
    }
  } catch (error) {
    logger.error('添加边界失败:', error);
    message.error('添加边界失败');
  }
}

// 展开节点
function onExpand(expandedKeys: string[]) {
  expandedKeys.value = expandedKeys;
}

// 应用边界
function applyBoundaries() {
  emit('apply', selectedBoundaries.value);
}

// 清空边界
function clearBoundaries() {
  selectedBoundaries.value = [];
  props.boundaryObj.clearBoundaries();
  emit('clear');
}

// 移除边界
function removeBoundary(code: string) {
  selectedBoundaries.value = selectedBoundaries.value.filter(item => item.code !== code);
  props.boundaryObj.removeBoundary(code);
  emit('remove', code);
}

// 定位到当前
function locateCurrent() {
  // 实现定位到当前位置的逻辑
  // 此处代码略
}

// 切换设置面板
function toggleSettings() {
  showSettings.value = !showSettings.value;
}

// 应用设置
function applySettings() {
  props.boundaryObj.setOptions(options.value);
  props.boundaryObj.updateAllBoundariesStyle();
  showSettings.value = false;
}

// 重置设置
function resetSettings() {
  options.value = {...DEFAULT_BOUNDARY_OPTIONS, ...props.defaultOptions};
}

// 监听选项变化
watch(() => props.defaultOptions, (newOptions) => {
  options.value = {...DEFAULT_BOUNDARY_OPTIONS, ...newOptions};
}, { deep: true });

// 监听搜索文本变化
watch(() => searchText.value, () => {
  // 实现搜索逻辑
});
</script>

<style scoped>
.boundary-selector {
  position: absolute;
  width: 300px;
  max-height: 500px;
  background-color: white;
  border-radius: 4px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
  display: flex;
  flex-direction: column;
  z-index: 1000;
  opacity: 0;
  pointer-events: none;
  transition: opacity 0.3s;
  overflow: hidden;
}

.boundary-selector.active {
  opacity: 1;
  pointer-events: auto;
}

.boundary-selector-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px;
  border-bottom: 1px solid #e8e8e8;
}

.boundary-selector-header .title {
  font-weight: bold;
}

.boundary-selector-header .actions {
  display: flex;
  gap: 5px;
}

.boundary-selector-content {
  flex: 1;
  overflow-y: auto;
  padding: 10px;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.search-box input {
  width: 100%;
  padding: 8px;
  border: 1px solid #d9d9d9;
  border-radius: 4px;
}

.tree-container {
  flex: 1;
  min-height: 200px;
  overflow-y: auto;
  border: 1px solid #e8e8e8;
  border-radius: 4px;
  padding: 5px;
}

.selected-boundaries {
  border-top: 1px solid #e8e8e8;
  padding-top: 10px;
}

.selected-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 5px;
}

.selected-list {
  max-height: 150px;
  overflow-y: auto;
}

.selected-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 5px;
  border-bottom: 1px solid #f0f0f0;
}

.settings-panel {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: white;
  z-index: 1001;
  padding: 15px;
  overflow-y: auto;
}

.settings-panel h3 {
  margin-top: 0;
  margin-bottom: 15px;
  border-bottom: 1px solid #e8e8e8;
  padding-bottom: 10px;
}

.setting-item {
  margin-bottom: 15px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.setting-item label {
  flex: 1;
}

.actions {
  display: flex;
  gap: 8px;
  justify-content: flex-end;
  margin-top: 15px;
}

.btn {
  padding: 4px 8px;
  border: 1px solid #d9d9d9;
  border-radius: 4px;
  background-color: white;
  cursor: pointer;
}

.btn-primary {
  background-color: #1677ff;
  color: white;
  border-color: #1677ff;
}

.btn-icon {
  padding: 4px;
  border: none;
  background: transparent;
  cursor: pointer;
}

.btn-sm {
  padding: 2px 6px;
  font-size: 12px;
}

.loading-state,
.error-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 200px;
  color: #999;
}

.error-state p {
  margin-bottom: 10px;
}

.selected-node {
  color: #1677ff;
  font-weight: bold;
}

/* 响应式调整 */
@media (max-width: 768px) {
  .boundary-selector {
    width: 100%;
    max-width: 300px;
  }
}
</style> 