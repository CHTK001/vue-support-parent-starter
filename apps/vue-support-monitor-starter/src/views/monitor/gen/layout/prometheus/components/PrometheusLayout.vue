<template>
  <div class="prometheus-layout h-full" ref="prometheusLayoutRef">
    <div class="layout-header" v-if="layout.length > 0">
      <div class="layout-actions">
        <el-tooltip content="浏览器全屏">
          <el-button type="primary" circle size="small" @click="toggleBrowserFullscreen">
            <IconifyIconOnline :icon="isBrowserFullscreen ? 'ri:fullscreen-exit-line' : 'ri:fullscreen-line'" />
          </el-button>
        </el-tooltip>
        <el-tooltip content="容器全屏">
          <el-button type="primary" circle size="small" @click="toggleContainerFullscreen">
            <IconifyIconOnline :icon="isContainerFullscreen ? 'ri:contract-left-right-line' : 'ri:expand-left-right-line'" />
          </el-button>
        </el-tooltip>
      </div>
    </div>
    
    <GridLayout
      v-if="layout.length > 0"
      class="h-full"
      :layout="layout"
      :col-num="24"
      :row-height="30"
      :is-draggable="editable"
      :is-resizable="editable"
      :vertical-compact="true"
      :use-css-transforms="true"
      :margin="[10, 10]"
      @layout-updated="handleLayoutUpdated"
    >
      <GridItem
        v-for="item in layout"
        :key="item.i"
        :x="item.x"
        :y="item.y"
        :w="item.w"
        :h="item.h"
        :i="item.i"
      >
        <div class="grid-item-content">
          <div v-if="editable" class="grid-item-overlay">
            <div class="grid-item-actions">
              <el-tooltip content="编辑组件">
                <el-button type="primary" circle size="small" @click="editComponent(item)">
                  <IconifyIconOnline icon="ri:edit-line" />
                </el-button>
              </el-tooltip>
              <el-tooltip content="删除组件">
                <el-button type="danger" circle size="small" @click="removeComponent(item)">
                  <IconifyIconOnline icon="ri:delete-bin-line" />
                </el-button>
              </el-tooltip>
            </div>
            <div class="grid-item-drag-handle">
              <IconifyIconOnline icon="ri:drag-move-fill" />
            </div>
          </div>
          
          <component 
            :is="getComponentByType(item.type)" 
            :chart-data="getComponentData(item)" 
            :height="getComponentHeight(item)"
            :loading="loading"
          />
        </div>
      </GridItem>
    </GridLayout>
    
    <div v-else class="empty-layout">
      <el-empty description="暂无监控组件" :image-size="100">
        <template #image>
          <IconifyIconOnline icon="ri:dashboard-line" style="font-size: 80px; color: #909399;" />
        </template>
        <el-button v-if="editable" type="primary" @click="showAddComponentDrawer = true">添加组件</el-button>
      </el-empty>
    </div>
    
    <!-- 添加/编辑组件抽屉 -->
    <el-drawer
      v-model="showAddComponentDrawer"
      :title="editingComponent ? '编辑监控组件' : '添加监控组件'"
      size="40%"
      destroy-on-close
    >
      <div class="component-drawer">
        <el-form ref="componentFormRef" :model="componentForm" :rules="componentFormRules" label-width="100px">
          <el-form-item label="组件标题" prop="title">
            <el-input v-model="componentForm.title" placeholder="请输入组件标题" />
          </el-form-item>
          <el-form-item label="组件类型" prop="type">
            <ScSelect v-model="componentForm.type" placeholder="选择组件类型">
              <ScSelectOption v-for="item in componentTypeOptions" :key="item.value" :label="item.label" :value="item.value" />
            </ScSelect>
          </el-form-item>
          <el-form-item label="PromQL" prop="promQL">
            <el-input v-model="componentForm.promQL" type="textarea" :rows="4" placeholder="请输入Prometheus查询语句" />
          </el-form-item>
          <el-form-item label="组件宽度" prop="width">
            <el-slider v-model="componentForm.width" :min="6" :max="24" :step="6" :marks="{
              6: '25%',
              12: '50%',
              18: '75%',
              24: '100%'
            }" />
          </el-form-item>
          <el-form-item label="组件高度" prop="height">
            <el-slider v-model="componentForm.height" :min="6" :max="18" :step="3" :marks="{
              6: '小',
              9: '中',
              12: '大',
              18: '特大'
            }" />
          </el-form-item>
          <el-form-item label="刷新间隔" prop="refreshInterval">
            <el-input-number v-model="componentForm.refreshInterval" :min="10" :max="600" :step="10" />
            <span class="ml-2">秒</span>
          </el-form-item>
        </el-form>
        <div class="drawer-footer">
          <el-button @click="showAddComponentDrawer = false">取消</el-button>
          <el-button type="primary" @click="saveComponent">保存</el-button>
        </div>
      </div>
    </el-drawer>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted, onBeforeUnmount, watch } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import { GridLayout, GridItem } from 'grid-layout-plus';
import { debounce } from 'lodash-es';
import LineChart from './LineChart.vue';
import BarChart from './BarChart.vue';
import GaugeChart from './GaugeChart.vue';
import { ScSelect, ScSelectOption } from '@/components/Select';
import { fetchPrometheusSaveConfig, fetchPrometheusListConfig, fetchPrometheusUpdateConfig, fetchPrometheusDeleteConfig, MonitorSysGenPrometheusConfig } from '@/api/prometheus/config';
import { fetchPrometheusQueryRangeGen, fetchPrometheusQueryGen } from '@/api/prometheus/index';

const props = defineProps({
  data: Object,
  editable: {
    type: Boolean,
    default: false
  }
});

// 布局相关
const layout = ref([]);
const loading = ref(false);
const layoutChanged = ref(false);
const configId = ref(null);

// 全屏相关
const prometheusLayoutRef = ref(null);
const isBrowserFullscreen = ref(false);
const isContainerFullscreen = ref(false);

// 组件类型选项
const componentTypeOptions = [
  { label: '折线图', value: 'line' },
  { label: '柱状图', value: 'bar' },
  { label: '仪表盘', value: 'gauge' }
];

// 组件表单
const showAddComponentDrawer = ref(false);
const editingComponent = ref(null);
const componentFormRef = ref(null);
const componentForm = reactive({
  title: '',
  type: 'line',
  promQL: '',
  width: 12,
  height: 9,
  refreshInterval: 60
});
const componentFormRules = {
  title: [{ required: true, message: '请输入组件标题', trigger: 'blur' }],
  type: [{ required: true, message: '请选择组件类型', trigger: 'change' }],
  promQL: [{ required: true, message: '请输入Prometheus查询语句', trigger: 'blur' }]
};

// 组件数据
const componentsData = ref({});
let refreshTimers = {};

// 获取时间范围参数
const getTimeRangeParams = () => {
  const end = Math.floor(Date.now() / 1000);
  const start = end - 60 * 60; // 默认1小时
  const step = 60; // 默认步长60秒
  return { start, end, step };
};

// 根据组件类型获取对应的组件
const getComponentByType = (type) => {
  // 目前只实现了折线图，其他类型可以后续添加
  if (type === 'line') return LineChart;
  if (type === 'bar') return BarChart;
  if (type === 'gauge') return GaugeChart;
  return LineChart;
};

// 获取组件数据
const getComponentData = (item) => {
  if (!componentsData.value[item.i]) {
    return {
      labels: [],
      datasets: [
        {
          label: item.title || '数据',
          data: [],
          borderColor: item.color || '#409EFF',
          backgroundColor: item.bgColor || 'rgba(64, 158, 255, 0.1)',
          fill: true
        }
      ]
    };
  }
  return componentsData.value[item.i];
};

// 获取组件高度
const getComponentHeight = (item) => {
  return item.h * 10;
};

// 浏览器全屏切换
const toggleBrowserFullscreen = () => {
  if (!document.fullscreenElement) {
    document.documentElement.requestFullscreen().then(() => {
      isBrowserFullscreen.value = true;
    }).catch(err => {
      ElMessage.error(`全屏错误: ${err.message}`);
    });
  } else {
    if (document.exitFullscreen) {
      document.exitFullscreen().then(() => {
        isBrowserFullscreen.value = false;
      }).catch(err => {
        ElMessage.error(`退出全屏错误: ${err.message}`);
      });
    }
  }
};

// 容器全屏切换
const toggleContainerFullscreen = () => {
  isContainerFullscreen.value = !isContainerFullscreen.value;
  
  // 添加或移除全屏样式类
  if (prometheusLayoutRef.value) {
    if (isContainerFullscreen.value) {
      prometheusLayoutRef.value.classList.add('prometheus-layout-fullscreen');
    } else {
      prometheusLayoutRef.value.classList.remove('prometheus-layout-fullscreen');
    }
  }
  
  // 触发布局重新计算
  setTimeout(() => {
    window.dispatchEvent(new Event('resize'));
  }, 100);
};

// 监听全屏变化事件
const handleFullscreenChange = () => {
  isBrowserFullscreen.value = !!document.fullscreenElement;
};

// 加载组件数据
const loadComponentData = async (item) => {
  if (!props.data.genId || !item.promQL) return;
  
  try {
    // 根据组件类型选择不同的API
    if (item.type === 'gauge') {
      // 仪表盘使用fetchPrometheusQueryGen接口
      const res = await fetchPrometheusQueryGen({
        monitorSysGenId: props.data.genId,
        promQL: item.promQL
      });
      
      if (res.code === 200 && res.data && res.data.result && res.data.result.length > 0) {
        const result = res.data.result[0];
        const value = result.value ? result.value[1] : 0;
        
        const chartData = {
          labels: [item.title || '数据'],
          datasets: [
            {
              label: item.title || '数据',
              data: [parseFloat(value).toFixed(2)],
              borderColor: item.color || '#409EFF',
              backgroundColor: item.bgColor || 'rgba(64, 158, 255, 0.1)',
              fill: true
            }
          ]
        };
        
        componentsData.value[item.i] = chartData;
      }
    } else {
      // 其他图表类型使用fetchPrometheusQueryRangeGen接口
      const timeParams = getTimeRangeParams();
      const res = await fetchPrometheusQueryRangeGen({
        monitorSysGenId: props.data.genId,
        promQL: item.promQL,
        ...timeParams
      });
      
      if (res.code === 200 && res.data && res.data.result && res.data.result.length > 0) {
        const result = res.data.result[0];
        const values = result.values || [];
        
        const chartData = {
          labels: values.map(item => new Date(item[0] * 1000).toLocaleTimeString()),
          datasets: [
            {
              label: item.title || '数据',
              data: values.map(item => parseFloat(item[1]).toFixed(2)),
              borderColor: item.color || '#409EFF',
              backgroundColor: item.bgColor || 'rgba(64, 158, 255, 0.1)',
              fill: true
            }
          ]
        };
        
        componentsData.value[item.i] = chartData;
      }
    }
  } catch (error) {
    console.error(`加载组件 ${item.title} 数据失败:`, error);
  }
};

// 设置组件刷新定时器
const setupComponentRefreshTimer = (item) => {
  // 清除已有的定时器
  if (refreshTimers[item.i]) {
    clearInterval(refreshTimers[item.i]);
  }
  
  // 设置新的定时器
  if (item.refreshInterval && item.refreshInterval > 0) {
    refreshTimers[item.i] = setInterval(() => {
      loadComponentData(item);
    }, item.refreshInterval * 1000);
  }
};

// 清除所有定时器
const clearAllRefreshTimers = () => {
  Object.values(refreshTimers).forEach(timer => {
    clearInterval(timer);
  });
  refreshTimers = {};
};

// 布局更新处理
const handleLayoutUpdated = (newLayout) => {
  layout.value = newLayout;
  layoutChanged.value = true;
  
  // 延迟保存，避免频繁保存
  if (props.editable) {
    debounceUpdateConfig();
  }
};

// 防抖保存配置
const debounceUpdateConfig = debounce(() => {
  if (layoutChanged.value) {
    saveConfigToServer();
    layoutChanged.value = false;
  }
}, 1000);

// 保存配置到服务器
const saveConfigToServer = async () => {
  if (!props.data.genId) return;
  
  try {
    const config = {
      monitorSysGenId: props.data.genId,
      monitorSysGenPrometheusConfigType: 'layout',
      monitorSysGenPrometheusConfigQl: JSON.stringify({
        layout: layout.value
      }),
      monitorSysGenPrometheusConfigName: '布局配置',
      monitorSysGenPrometheusConfigEnable: true,
      monitorSysGenPrometheusConfigChartType: 'layout',
      monitorSysGenPrometheusConfigShare: false
    };
    
    // 如果是更新已有配置
    if (configId.value) {
      config.monitorSysGenPrometheusConfigId = configId.value;
      await fetchPrometheusUpdateConfig(config);
    } else {
      // 如果是新建配置
      const res = await fetchPrometheusSaveConfig(config);
      if (res.code === 200 && res.data) {
        // 保存配置ID，用于后续更新
        configId.value = res.data.monitorSysGenPrometheusConfigId;
      }
    }
    
    ElMessage.success('布局已保存');
  } catch (error) {
    console.error('保存布局失败:', error);
    ElMessage.error('保存布局失败');
  }
};

// 加载组件配置
const loadComponentConfigs = async () => {
  if (!props.data.genId) return;
  
  try {
    const res = await fetchPrometheusListConfig({ 
      monitorSysGenId: props.data.genId, 
      monitorSysGenPrometheusConfigType: 'component' 
    });
    
    if (res.code === 200 && res.data && res.data.length > 0) {
      // 将组件配置与布局项关联
      for (const config of res.data) {
        try {
          const position = JSON.parse(config.monitorSysGenPrometheusConfigPostion || '{}');
          const itemIndex = layout.value.findIndex(item => item.i === position.i);
          
          if (itemIndex !== -1) {
            // 更新布局项的配置ID
            layout.value[itemIndex].configId = config.monitorSysGenPrometheusConfigId;
          }
        } catch (e) {
          console.error('解析组件位置配置失败:', e);
        }
      }
    }
  } catch (error) {
    console.error('加载组件配置失败:', error);
  }
};

// 加载配置
const loadConfig = async () => {
  if (!props.data.genId) return;
  
  try {
    loading.value = true;
    const res = await fetchPrometheusListConfig({ 
      monitorSysGenId: props.data.genId, 
      monitorSysGenPrometheusConfigType: 'layout' 
    });
    
    if (res.code === 200 && res.data && res.data.length > 0) {
      const config = res.data[0];
      configId.value = config.monitorSysGenPrometheusConfigId;
      
      try {
        const content = JSON.parse(config.monitorSysGenPrometheusConfigQl || '{}');
        
        if (content.layout && Array.isArray(content.layout)) {
          layout.value = content.layout;
          
          // 加载组件配置
          await loadComponentConfigs();
          
          // 加载所有组件数据
          for (const item of layout.value) {
            await loadComponentData(item);
            setupComponentRefreshTimer(item);
          }
        }
      } catch (e) {
        console.error('解析布局配置失败:', e);
      }
    }
  } catch (error) {
    console.error('加载配置失败:', error);
    ElMessage.error('加载配置失败');
  } finally {
    loading.value = false;
  }
};

// 编辑组件
const editComponent = (item) => {
  editingComponent.value = item;
  
  componentForm.title = item.title || '';
  componentForm.type = item.type || 'line';
  componentForm.promQL = item.promQL || '';
  componentForm.width = item.w || 12;
  componentForm.height = item.h || 9;
  componentForm.refreshInterval = item.refreshInterval || 60;
  
  showAddComponentDrawer.value = true;
};

// 删除组件
const removeComponent = (item) => {
  ElMessageBox.confirm('确定要删除此监控组件吗?', '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(async () => {
    // 清除定时器
    if (refreshTimers[item.i]) {
      clearInterval(refreshTimers[item.i]);
      delete refreshTimers[item.i];
    }
    
    // 删除组件数据
    delete componentsData.value[item.i];
    
    // 从布局中移除
    layout.value = layout.value.filter(i => i.i !== item.i);
    
    // 删除组件配置
    if (item.configId) {
      try {
        await fetchPrometheusDeleteConfig({
          monitorSysGenPrometheusConfigId: item.configId,
          monitorSysGenId: props.data.genId,
          monitorSysGenPrometheusConfigType: 'component',
          monitorSysGenPrometheusConfigName: item.title || '',
          monitorSysGenPrometheusConfigEnable: true,
          monitorSysGenPrometheusConfigChartType: item.type || 'line',
          monitorSysGenPrometheusConfigShare: false
        });
      } catch (error) {
        console.error('删除组件配置失败:', error);
      }
    }
    
    // 保存布局配置
    saveConfigToServer();
    
    ElMessage.success('删除成功');
  }).catch(() => {});
};

// 保存组件配置到服务器
const saveComponentConfig = async (item) => {
  if (!props.data.genId) return;
  
  try {
    const config = {
      monitorSysGenId: props.data.genId,
      monitorSysGenPrometheusConfigType: 'component',
      monitorSysGenPrometheusConfigQl: item.promQL,
      monitorSysGenPrometheusConfigName: item.title,
      monitorSysGenPrometheusConfigChartType: item.type,
      monitorSysGenPrometheusConfigEnable: true,
      monitorSysGenPrometheusConfigShare: false,
      monitorSysGenPrometheusConfigPostion: JSON.stringify({
        x: item.x,
        y: item.y,
        w: item.w,
        h: item.h,
        i: item.i,
        refreshInterval: item.refreshInterval,
        color: item.color,
        bgColor: item.bgColor
      })
    };
    
    // 如果组件已有配置ID
    if (item.configId) {
      config.monitorSysGenPrometheusConfigId = item.configId;
      await fetchPrometheusUpdateConfig(config);
    } else {
      // 如果是新建组件配置
      const res = await fetchPrometheusSaveConfig(config);
      if (res.code === 200 && res.data) {
        // 保存组件配置ID
        item.configId = res.data.monitorSysGenPrometheusConfigId;
      }
    }
  } catch (error) {
    console.error('保存组件配置失败:', error);
  }
};

// 保存组件
const saveComponent = async () => {
  if (!componentFormRef.value) return;
  
  await componentFormRef.value.validate(async (valid) => {
    if (valid) {
      // 生成唯一ID
      const componentId = editingComponent.value ? editingComponent.value.i : `component-${Date.now()}`;
      
      // 创建或更新组件
      const componentItem = {
        i: componentId,
        x: editingComponent.value ? editingComponent.value.x : 0,
        y: editingComponent.value ? editingComponent.value.y : layout.value.length,
        w: componentForm.width,
        h: componentForm.height,
        title: componentForm.title,
        type: componentForm.type,
        promQL: componentForm.promQL,
        refreshInterval: componentForm.refreshInterval,
        color: editingComponent.value ? editingComponent.value.color : getRandomColor(),
        bgColor: editingComponent.value ? editingComponent.value.bgColor : getRandomColor(0.1),
        configId: editingComponent.value ? editingComponent.value.configId : null
      };
      
      if (editingComponent.value) {
        // 更新现有组件
        const index = layout.value.findIndex(item => item.i === componentId);
        if (index !== -1) {
          layout.value[index] = componentItem;
        }
      } else {
        // 添加新组件
        layout.value.push(componentItem);
      }
      
      // 加载组件数据
      await loadComponentData(componentItem);
      
      // 设置刷新定时器
      setupComponentRefreshTimer(componentItem);
      
      // 保存组件配置
      await saveComponentConfig(componentItem);
      
      // 保存布局配置
      saveConfigToServer();
      
      // 关闭抽屉
      showAddComponentDrawer.value = false;
      
      // 重置表单
      editingComponent.value = null;
      
      ElMessage.success(editingComponent.value ? '组件更新成功' : '组件添加成功');
    }
  });
};

// 生成随机颜色
const getRandomColor = (alpha = 1) => {
  const r = Math.floor(Math.random() * 255);
  const g = Math.floor(Math.random() * 255);
  const b = Math.floor(Math.random() * 255);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
};

// 监听数据源变化
watch(() => props.data.genId, () => {
  if (props.data.genId) {
    clearAllRefreshTimers();
    loadConfig();
  }
});

// 组件挂载时
onMounted(() => {
  if (props.data.genId) {
    loadConfig();
  }
  
  // 添加全屏变化事件监听
  document.addEventListener('fullscreenchange', handleFullscreenChange);
});

// 组件卸载前
onBeforeUnmount(() => {
  clearAllRefreshTimers();
  
  // 移除全屏变化事件监听
  document.removeEventListener('fullscreenchange', handleFullscreenChange);
  
  // 如果处于全屏状态，退出全屏
  if (document.fullscreenElement) {
    document.exitFullscreen().catch(err => {
      console.error('退出全屏失败:', err);
    });
  }
});

// 暴露方法给父组件
defineExpose({
  refresh: () => {
    layout.value.forEach(item => {
      loadComponentData(item);
    });
  }
});
</script>

<style lang="scss" scoped>
.prometheus-layout {
  height: 100%;
  width: 100%;
  display: flex;
  flex-direction: column;
  position: relative;
  
  &:deep(.vue-grid-layout) {
    flex: 1;
    overflow: auto;
  }
  
  .layout-header {
    padding: 8px 16px;
    display: flex;
    justify-content: flex-end;
    align-items: center;
    background-color: var(--el-bg-color);
    border-bottom: 1px solid var(--el-border-color-light);
    z-index: 10;
    
    .layout-actions {
      display: flex;
      gap: 8px;
    }
  }
  
  .grid-item-content {
    height: 100%;
    width: 100%;
    background-color: var(--el-bg-color);
    border-radius: var(--el-border-radius-base);
    box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.05);
    position: relative;
    padding: 10px;
    overflow: hidden;
  }
  
  .grid-item-overlay {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background-color: rgba(255, 255, 255, 0.7);
    z-index: 10;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    opacity: 0;
    transition: opacity 0.3s;
    
    &:hover {
      opacity: 1;
    }
  }
  
  .grid-item-actions {
    display: flex;
    gap: 10px;
    margin-bottom: 10px;
  }
  
  .grid-item-drag-handle {
    cursor: move;
    font-size: 24px;
    color: var(--el-color-primary);
  }
  
  .empty-layout {
    height: 100%;
    display: flex;
    justify-content: center;
    align-items: center;
  }
  
  .component-drawer {
    padding: 16px;
    
    .drawer-footer {
      position: absolute;
      bottom: 0;
      left: 0;
      right: 0;
      padding: 16px;
      background-color: var(--el-bg-color);
      border-top: 1px solid var(--el-border-color-light);
      display: flex;
      justify-content: flex-end;
      gap: 8px;
    }
  }
  
  .ml-2 {
    margin-left: 8px;
  }
}

// 容器全屏样式
:deep(.prometheus-layout-fullscreen) {
  position: fixed !important;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  width: 100vw !important;
  height: 100vh !important;
  z-index: 9999;
  background-color: var(--el-bg-color);
}
</style> 