/** * 飞线图面板组件 * @description 显示飞线图数据列表，支持单选 */
<template>
  <div
    v-show="props.active"
    class="flight-line-panel"
    :class="{
      active: props.active,
      collapsed,
      'position-top-left': position === 'top-left',
      'position-top-right': position === 'top-right',
      'position-bottom-left': position === 'bottom-left',
      'position-bottom-right': position === 'bottom-right'
    }"
    @click.stop
  >
    <div class="flight-line-panel-header">
      <span class="panel-title">飞线数据</span>
      <div class="panel-actions">
        <span v-if="!collapsed && selectedId" class="panel-selected">
          <span class="selected-indicator" />
          已选中
        </span>
        <button class="toolbar-btn toolbar-btn-settings" title="飞线设置" @click.stop="toggleSettingsPanel">
          <i class="settings-icon">⚙</i>
        </button>
        <button class="minimize-btn" title="最小化/展开面板" @click.stop="toggleCollapse">
          <span v-if="collapsed">+</span>
          <span v-else>-</span>
        </button>
      </div>
    </div>
    <div v-if="!collapsed" class="flight-line-panel-content">
      <!-- 添加背景蒙版，确保在内容之上但面板之下 -->
      <div v-if="showSettingsPanel" class="settings-backdrop" @click.stop="showSettingsPanel = false" />

      <div class="flight-line-stats">
        <span>总数: {{ flightLineCount }}</span>
        <span>选中: {{ selectedCount }}</span>
      </div>
      <div class="flight-line-toolbar">
        <button class="toolbar-btn" :disabled="!selectedId" @click.stop="clearSelection">全部显示</button>
        <button class="toolbar-btn toolbar-btn-primary" title="调整到最佳视角" @click.stop="setOptimalView">最佳视角</button>
        <button v-if="isDevelopment" class="toolbar-btn" title="添加演示数据" @click.stop="addDemoFlightLines">添加演示数据</button>
        <button class="toolbar-btn" title="强制刷新列表" @click.stop="forceRefreshList">刷新列表</button>
      </div>

      <!-- 添加性能相关设置 -->
      <div class="performance-settings">
        <div class="performance-option">
          <input id="performanceMode" v-model="performanceMode" type="checkbox" @change="updatePerformanceMode" />
          <label for="performanceMode">性能模式 (移动/缩放时隐藏飞线)</label>
        </div>

        <div class="performance-option">
          <input id="forcedPrecomposeRerenderMode" v-model="forcedPrecomposeRerenderMode" type="checkbox" @change="updateForcedPrecomposeRerenderMode" />
          <label for="forcedPrecomposeRerenderMode">强制重渲染 (强制重渲染)</label>
        </div>

        <div class="performance-option">
          <input id="glRenderMode" v-model="glRenderMode" type="checkbox" @change="updateGLRenderMode" />
          <label for="glRenderMode">3D渲染 (提高帧率)</label>
          <div v-if="!glModeAvailable" class="gl-mode-notice">暂不支持</div>
        </div>
      </div>
      <div class="flight-line-list thin-scrollbar">
        <div v-if="flightLines.length === 0" class="no-flight-lines">
          暂无飞线数据
          <div class="diagnose-info">请点击"添加演示数据"或"刷新列表"按钮</div>
        </div>
        <div v-if="flightLines.length === 0" class="empty-list-debug">
          <div class="debug-panel">
            <h4>调试信息</h4>
            <p>flightLineObj存在: {{ !!props.flightLineObj }}</p>
            <p>面板激活状态: {{ props.active }}</p>
            <p>面板初始化状态: {{ panelInitialized }}</p>
            <p>当前环境: {{ isDevelopment ? "开发环境" : "生产环境" }}</p>
          </div>
        </div>
        <div v-if="filteredFlightLines.length > 0 && !selectedId" class="initial-tip">
          <i class="initial-tip-icon">☝️</i>
          <span class="initial-tip-text">点击列表项可以在地图上显示对应飞线</span>
        </div>
        <div
          v-for="line in filteredFlightLines"
          :key="line.id"
          class="flight-line-item"
          :class="{
            'flight-line-item-active': line.id === selectedId
          }"
          @click="selectFlightLine(line.id)"
        >
          <div class="flight-line-content">
            <div class="flight-line-title">{{ line.fromName }} → {{ line.toName }}</div>
            <div class="flight-line-details">
              <span class="flight-line-id">ID: {{ line.id.slice(0, 8) }}...</span>
              <span v-if="line.value" class="flight-line-value">值: {{ line.value }}</span>
            </div>
          </div>
          <div v-if="line.id === selectedId" class="flight-line-active-badge">激活</div>
        </div>
      </div>

      <!-- 添加内部弹出式设置面板 -->
      <div v-if="showSettingsPanel" class="flight-line-settings-popup thin-scrollbar">
        <div class="settings-popup-header">
          <span class="settings-popup-title">飞线设置</span>
          <button class="settings-popup-close" @click.stop="showSettingsPanel = false">×</button>
        </div>
        <div class="settings-popup-content thin-scrollbar">
          <div class="settings-section">
            <div class="section-title">线条设置</div>

            <div class="setting-item">
              <label>线条粗细</label>
              <div class="slider-wrap">
                <el-slider v-model="lineSettings.width" :min="0.5" :max="5" :step="0.1" @change="updateLineSetting('width')" />
              </div>
              <div class="setting-value">{{ lineSettings.width }}</div>
            </div>

            <div class="setting-item">
              <label>透明度</label>
              <div class="slider-wrap">
                <el-slider v-model="lineSettings.opacity" :min="0.1" :max="1" :step="0.05" @change="updateLineSetting('opacity')" />
              </div>
              <div class="setting-value">{{ lineSettings.opacity }}</div>
            </div>

            <div class="setting-item">
              <label>曲率</label>
              <div class="slider-wrap">
                <el-slider v-model="lineSettings.curveness" :min="0" :max="1" :step="0.05" @change="updateLineSetting('curveness')" />
              </div>
              <div class="setting-value">{{ lineSettings.curveness }}</div>
            </div>

            <div class="setting-item">
              <label>平滑曲线</label>
              <el-switch v-model="lineSettings.smooth" @change="updateLineSetting('smooth')" />
            </div>
          </div>

          <div class="settings-section">
            <div class="section-title">动画效果</div>

            <div class="setting-item">
              <label>飞线动画</label>
              <el-switch v-model="lineSettings.showEffect" @change="updateLineSetting('showEffect')" />
            </div>

            <div v-if="lineSettings.showEffect" class="setting-item">
              <label>动画周期(秒)</label>
              <div class="slider-wrap">
                <el-slider v-model="lineSettings.effectPeriod" :min="1" :max="10" :step="0.5" @change="updateLineSetting('effectPeriod')" />
              </div>
              <div class="setting-value">{{ lineSettings.effectPeriod }}</div>
            </div>

            <div v-if="lineSettings.showEffect" class="setting-item">
              <label>动画速度</label>
              <div class="slider-wrap">
                <el-slider v-model="lineSettings.effectSpeed" :min="1" :max="50" :step="1" @change="updateLineSetting('effectSpeed')" />
              </div>
              <div class="setting-value">{{ lineSettings.effectSpeed }}</div>
            </div>

            <div v-if="lineSettings.showEffect" class="setting-item">
              <label>轨迹长度</label>
              <div class="slider-wrap">
                <el-slider v-model="lineSettings.effectTrailLength" :min="0" :max="1" :step="0.05" @change="updateLineSetting('effectTrailLength')" />
              </div>
              <div class="setting-value">{{ lineSettings.effectTrailLength }}</div>
            </div>

            <!-- 添加拖尾设置选项 -->
            <template v-if="lineSettings.showEffect && lineSettings.effectTrailLength > 0">
              <div class="setting-item">
                <label>拖尾颜色</label>
                <div class="color-picker-wrap">
                  <el-color-picker v-model="lineSettings.trailColor" @change="updateLineSetting('trailColor')" />
                </div>
                <div class="setting-value color-value">{{ lineSettings.trailColor }}</div>
              </div>

              <div class="setting-item">
                <label>拖尾透明度</label>
                <div class="slider-wrap">
                  <el-slider v-model="lineSettings.trailOpacity" :min="0.1" :max="1" :step="0.05" @change="updateLineSetting('trailOpacity')" />
                </div>
                <div class="setting-value">{{ lineSettings.trailOpacity }}</div>
              </div>

              <div class="setting-item">
                <label>拖尾宽度</label>
                <div class="slider-wrap">
                  <el-slider v-model="lineSettings.trailWidth" :min="1" :max="5" :step="0.5" @change="updateLineSetting('trailWidth')" />
                </div>
                <div class="setting-value">{{ lineSettings.trailWidth }}</div>
              </div>
            </template>

            <div v-if="lineSettings.showEffect" class="setting-item">
              <label>图标大小</label>
              <div class="slider-wrap">
                <el-slider v-model="lineSettings.effectSymbolSize" :min="5" :max="40" :step="1" @change="updateLineSetting('effectSymbolSize')" />
              </div>
              <div class="setting-value">{{ lineSettings.effectSymbolSize }}</div>
            </div>

            <div class="setting-item">
              <label>图标类型</label>
              <el-select v-model="lineSettings.effectSymbol" style="width: 120px" @change="updateLineSetting('effectSymbol')">
                <el-option v-for="icon in iconOptions" :key="icon.value" :label="icon.label" :value="icon.value" />
              </el-select>
            </div>
          </div>

          <div class="settings-section">
            <div class="section-title">节点设置</div>

            <div class="setting-item">
              <label>显示节点</label>
              <el-switch v-model="lineSettings.showNodes" @change="updateLineSetting('showNodes')" />
            </div>

            <div v-if="lineSettings.showNodes" class="setting-item">
              <label>节点大小</label>
              <div class="slider-wrap">
                <el-slider v-model="lineSettings.nodeSymbolSize" :min="2" :max="20" :step="1" @change="updateLineSetting('nodeSymbolSize')" />
              </div>
              <div class="setting-value">{{ lineSettings.nodeSymbolSize }}</div>
            </div>

            <div v-if="lineSettings.showNodes" class="setting-item">
              <label>节点特效</label>
              <el-switch v-model="lineSettings.nodeEffect" @change="updateLineSetting('nodeEffect')" />
            </div>

            <template v-if="lineSettings.showNodes && lineSettings.nodeEffect">
              <div class="setting-item">
                <label>涟漪周期</label>
                <div class="slider-wrap">
                  <el-slider v-model="lineSettings.rippleEffect.period" :min="1" :max="5" :step="0.1" @change="updateRippleEffect('period')" />
                </div>
                <div class="setting-value">{{ lineSettings.rippleEffect.period }}</div>
              </div>

              <div class="setting-item">
                <label>涟漪比例</label>
                <div class="slider-wrap">
                  <el-slider v-model="lineSettings.rippleEffect.scale" :min="2" :max="15" :step="0.5" @change="updateRippleEffect('scale')" />
                </div>
                <div class="setting-value">{{ lineSettings.rippleEffect.scale }}</div>
              </div>

              <div class="setting-item">
                <label>涟漪类型</label>
                <el-select v-model="lineSettings.rippleEffect.brushType" style="width: 120px" @change="updateRippleEffect('brushType')">
                  <el-option label="填充" value="fill" />
                  <el-option label="描边" value="stroke" />
                </el-select>
              </div>

              <div class="setting-item">
                <label>阴影模糊度</label>
                <div class="slider-wrap">
                  <el-slider v-model="lineSettings.shadowBlur" :min="0" :max="30" :step="1" @change="updateLineSetting('shadowBlur')" />
                </div>
                <div class="setting-value">{{ lineSettings.shadowBlur }}</div>
              </div>
            </template>
          </div>

          <div class="settings-section">
            <div class="settings-actions">
              <button class="toolbar-btn" @click="resetToDefault">恢复默认值</button>
              <button class="toolbar-btn toolbar-btn-primary" @click="applySettingsToAll">应用设置</button>
            </div>
          </div>
        </div>
      </div>
    </div>
    <!-- 折叠/最小化状态下的图标 -->
    <div v-if="collapsed" class="track-player-minimized" @click.stop="toggleCollapse">
      <div class="minimized-restore-icon">
        <span v-html="FLIGHT_LINE_ICON" />
      </div>
    </div>
  </div>
</template>

<script lang="ts">
export default {
  name: "FlightLinePanel"
};
</script>

<script setup lang="ts">
import { FLIGHT_LINE_ICON } from "../types/icon";
import { ref, computed, watch, onMounted, onBeforeUnmount, nextTick } from "vue";
import type { FlightLineData } from "../types/flightline";
import { DEFAULT_FLIGHTLINE_CONFIG } from "../types/flightline";
import { ElButton, ElTooltip, ElSlider, ElPopover } from "element-plus";

// 环境变量判断
const isDevelopment = ref(process.env.NODE_ENV === "development");

const props = defineProps<{
  flightLineObj: any;
  active: boolean;
  position?: "top-left" | "top-right" | "bottom-left" | "bottom-right";
}>();

const emit = defineEmits<{
  (e: "collapse-change", collapsed: boolean): void;
  (e: "selection-change", selectedId: string | null): void;
}>();

// 状态
const collapsed = ref(false);
const flightLines = ref<Array<FlightLineData & { id: string }>>([]);
const selectedId = ref<string | null>(null);
const isInitialized = ref(false);
const isPanelTouched = ref(false);
const panelInitialized = ref(false);
// 添加设置面板状态
const showSettingsPanel = ref(false);

// 性能模式
const performanceMode = ref(false);

// 强制重渲染
const forcedPrecomposeRerenderMode = ref(true);
// GL渲染模式
const glRenderMode = ref(false);
// GL模式是否可用
const glModeAvailable = ref(false);

// 添加飞线设置
const lineSettings = ref({
  width: 1,
  opacity: 0.8,
  curveness: 0.4,
  smooth: true,
  smoothConstraint: true,
  smoothMonotone: null,

  showEffect: true,
  effectPeriod: 3,
  effectTrailLength: 0.3,
  effectSymbol: "plane",
  effectSymbolSize: 18,
  effectSpeed: 40, // 添加动画速度

  // 添加拖尾相关属性
  trailColor: "#1677ff", // 拖尾颜色
  trailOpacity: 0.7, // 拖尾透明度
  trailWidth: 3, // 拖尾宽度

  showNodes: true,
  nodeSymbolSize: 12,
  nodeColor: "#1677ff",
  nodeEffect: true,

  rippleEffect: {
    period: 2.5,
    scale: 8,
    brushType: "stroke"
  },

  shadowBlur: 20,
  shadowColor: "#1677ff"
});

// 图标选项
const iconOptions = [
  { value: "plane", label: "飞机" },
  { value: "arrow", label: "箭头" },
  { value: "triangle", label: "三角形" },
  { value: "circle", label: "圆形" },
  { value: "pin", label: "定位" }
];

// 图标路径定义
const iconPaths = {
  plane:
    "M1705.06,1318.313v-89.254l-319.9-221.799l0.073-208.063c0.521-84.662-26.629-121.796-63.961-121.491c-37.332-0.305-64.482,36.829-63.961,121.491l0.073,208.063l-319.9,221.799v89.254l330.343-157.288l12.238,241.308l-134.449,92.931l0.531,42.034l175.125-42.917l175.125,42.917l0.531-42.034l-134.449-92.931l12.238-241.308L1705.06,1318.313z",
  arrow: "M30,10 L5,25 L30,40 L40,30 L25,25 L40,20 L30,10 z",
  triangle: "M16,0 L32,32 L0,32 L16,0 z",
  circle: "M16,0 C7.16,0 0,7.16 0,16 C0,24.84 7.16,32 16,32 C24.84,32 32,24.84 32,16 C32,7.16 24.84,0 16,0 Z",
  pin: "M16,0 C7.16,0 0,7.16 0,16 C0,24.84 7.16,32 16,32 C24.84,32 32,24.84 32,16 C32,7.16 24.84,0 16,0 Z M16,5 C21.15,5 25.33,9.18 25.33,14.33 C25.33,19.48 21.15,23.67 16,23.67 C10.85,23.67 6.67,19.48 6.67,14.33 C6.67,9.18 10.85,5 16,5 Z"
};

/**
 * 获取有效的飞线图标路径
 * 统一处理图标路径获取逻辑
 * @param effectSymbol 图标类型名称
 * @param effectSymbolPath 自定义图标路径
 * @returns 处理后的有效图标路径
 */
const getEffectSymbol = (effectSymbol?: string, effectSymbolPath?: string): string => {
  // 如果有自定义路径，优先使用
  if (effectSymbolPath) {
    // 确保路径以path://开头
    return effectSymbolPath.startsWith("path://") ? effectSymbolPath : `path://${effectSymbolPath}`;
  }

  // 如果有内置图标类型且在预定义图标中存在
  if (effectSymbol && effectSymbol in iconPaths) {
    return `path://${iconPaths[effectSymbol]}`;
  }

  // 默认使用飞机图标
  return `path://${iconPaths.plane}`;
};

// 飞线图标预览动画
const previewTransform = computed(() => {
  return "translateX(" + Math.sin(Date.now() / 600) * 10 + "px)";
});

// 计算属性
const selectedCount = computed(() => (selectedId.value ? 1 : 0));
const position = computed(() => props.position || "top-right"); // 默认右上角，使用props传入的值
const flightLineCount = computed(() => flightLines.value.length);
// 过滤飞线列表
const filteredFlightLines = computed(() => flightLines.value);

// 调试用：列出飞线数据
const dumpFlightLines = () => {
  console.log("当前飞线列表数据:");
  flightLines.value.forEach((line, index) => {
    console.log(`[${index}] ID: ${line.id}, 名称: ${line.fromName} → ${line.toName}`);
  });
};

// 强制刷新列表按钮
const forceRefreshList = () => {
  console.log("强制刷新飞线列表");
  refreshFlightLineList();
  nextTick(() => {
    dumpFlightLines();
  });
};

// 刷新飞线列表数据
const refreshFlightLineList = () => {
  if (!props.flightLineObj) {
    console.warn("无法刷新飞线列表，飞线图对象不存在");
    return;
  }

  // 获取所有飞线数据
  const allFlightLines = props.flightLineObj.getAllFlightLines();
  if (!allFlightLines) {
    flightLines.value = [];
    selectedId.value = null;
    return;
  }

  // 转换Map为数组
  const linesArray: Array<FlightLineData & { id: string }> = [];
  allFlightLines.forEach((line, id) => {
    linesArray.push({
      ...line,
      id
    });
  });

  // 按创建时间排序，新的在前面
  linesArray.sort((a, b) => {
    const timeA = a._createTime || 0;
    const timeB = b._createTime || 0;
    return timeB - timeA;
  });

  // 更新飞线列表
  flightLines.value = linesArray;

  // 获取当前活跃的飞线ID，但不自动选中
  const activeId = props.flightLineObj.getActiveFlightLine();

  // 只有当存在活跃飞线ID时才更新选中状态
  if (activeId) {
    selectedId.value = activeId;
    console.log(`刷新飞线列表，当前活跃飞线ID: ${activeId}`);
  } else {
    // 当没有活跃飞线时，确保selectedId为null
    selectedId.value = null;
    console.log("刷新飞线列表，当前没有活跃飞线");

    // 确保地图上没有显示任何飞线
    if (props.flightLineObj.isEnabled()) {
      props.flightLineObj.clearFlightLines();
    }
  }
};

// 缩短ID显示
const shortId = (id: string) => {
  if (!id) return "无ID";
  return typeof id === "string" ? id.slice(-8) : String(id);
};

// 检查是否选中
const isSelected = (id: string) => {
  return selectedId.value === id;
};

// 切换折叠状态
const toggleCollapse = () => {
  collapsed.value = !collapsed.value;
  emit("collapse-change", collapsed.value);

  // 标记面板已被用户触摸
  isPanelTouched.value = true;

  // 如果是从折叠状态展开，则刷新列表
  if (!collapsed.value) {
    nextTick(() => {
      refreshFlightLineList();
    });
  }
};

// 选择飞线
const selectFlightLine = (id: string) => {
  if (!props.flightLineObj) return;

  // 如果点击的是当前选中的飞线，则取消选择并清空图层
  if (selectedId.value === id) {
    // 调用clearSelection方法完全清空图层
    clearSelection();
    return;
  }

  // 使用更可靠的切换方法
  switchFlightLine(id);

  // 记录选中的飞线ID
  selectedId.value = id;
  emit("selection-change", id);
};

// 清除选择并清空图层
const clearSelection = () => {
  if (!props.flightLineObj) return;

  // 清除选中状态
  selectedId.value = null;
  emit("selection-change", null);

  // 调用API清空飞线图层
  clearFlightLineLayer(); // 使用更彻底的清空方法

  // 确保UI状态更新
  nextTick(() => {
    refreshFlightLineList();
  });
};

// 清空飞线图层
const clearFlightLineLayer = () => {
  if (!props.flightLineObj) return;

  console.log("开始彻底清空飞线图层");

  try {
    // 调用API清空飞线图层
    props.flightLineObj.clearFlightLines();

    // 再次尝试强制清空echarts图层
    if (props.flightLineObj.echartsLayer) {
      // 第一次清空
      props.flightLineObj.echartsLayer.setChartOptions({
        animation: false,
        backgroundColor: "transparent",
        tooltip: {},
        series: [] // 完全空的系列
      });

      // 强制重绘
      if (typeof props.flightLineObj.echartsLayer.redraw === "function") {
        props.flightLineObj.echartsLayer.redraw();
      }

      // 延迟再次确认清除
      setTimeout(() => {
        if (props.flightLineObj && props.flightLineObj.echartsLayer) {
          // 第二次清空
          props.flightLineObj.echartsLayer.setChartOptions({
            series: []
          });

          // 再次强制重绘
          if (typeof props.flightLineObj.echartsLayer.redraw === "function") {
            props.flightLineObj.echartsLayer.redraw();
          }

          // 第三次清空 - 尝试移除并重新初始化图层
          setTimeout(() => {
            try {
              if (props.flightLineObj && props.flightLineObj.echartsLayer) {
                // 如果有移除方法，则尝试移除图层
                if (typeof props.flightLineObj.echartsLayer.remove === "function") {
                  props.flightLineObj.echartsLayer.remove();
                  console.log("已移除旧的Echarts图层");

                  // 如果有初始化方法，则重新初始化
                  if (typeof props.flightLineObj.initEchartsLayer === "function") {
                    setTimeout(() => {
                      props.flightLineObj
                        .initEchartsLayer()
                        .then(() => {
                          console.log("清空后重新初始化图层完成");
                        })
                        .catch((err: any) => {
                          console.error("清空后重新初始化图层失败:", err);
                        });
                    }, 50);
                  }
                }
              }
            } catch (error) {
              console.error("尝试重新初始化图层时出错:", error);
            }
          }, 100);
        }
      }, 50);
    }
  } catch (error) {
    console.error("强制清空图层失败:", error);
  }

  console.log("已完成飞线图层清空操作");
};

// 设置最佳视角
const setOptimalView = () => {
  if (!props.flightLineObj) {
    console.error("无法设置最佳视角：flightLineObj不可用");
    return;
  }

  try {
    console.log("正在设置飞线图最佳视角...");

    // 确保飞线图已启用
    if (!props.flightLineObj.isEnabled()) {
      console.log("飞线图未启用，正在启用...");
      props.flightLineObj
        .enable()
        .then(() => {
          // 启用后再设置最佳视角
          console.log("飞线图已启用，设置最佳视角");
          props.flightLineObj.setOptimalView(5);
        })
        .catch(err => {
          console.error("启用飞线图失败:", err);
        });
    } else {
      // 已启用，直接设置最佳视角
      props.flightLineObj.setOptimalView(5);
      console.log("已设置飞线图最佳视角");
    }
  } catch (error) {
    console.error("设置最佳视角时发生错误:", error);
  }
};

// 为指定飞线设置最佳视角
const setOptimalViewForLine = (id: string) => {
  if (!props.flightLineObj) return;

  try {
    // 获取选中的飞线数据
    const line = flightLines.value.find(l => l.id === id);
    if (!line) return;

    // 使用飞线对象的setOptimalView方法设置最佳视角
    // 飞线的对象已经知道如何处理这个飞线的视角
    props.flightLineObj.setOptimalView(6); // 使用6作为缩放级别

    console.log(`已设置飞线 ${id} 的最佳视角`);
  } catch (error) {
    console.error(`设置飞线 ${id} 最佳视角失败:`, error);
  }
};

// 更新单个飞线高亮状态
const updateFlightLineHighlight = (id: string) => {
  if (!props.flightLineObj) return;

  try {
    const selected = selectedId.value === id;

    // 首先确保飞线图对象已启用
    if (selected && !props.flightLineObj.isEnabled()) {
      props.flightLineObj.enable().catch(err => {
        console.error("启用飞线图失败:", err);
      });
    }

    // 更新飞线样式
    props.flightLineObj.updateFlightLine(id, {
      highlight: selected,
      style: selected
        ? {
            width: 3, // 加粗线条
            opacity: 1,
            color: "#1890ff" // 蓝色高亮
          }
        : undefined
    });
  } catch (error) {
    console.error("更新飞线高亮状态失败:", error);
  }
};

// 更新所有飞线高亮状态
const updateAllFlightLineHighlights = () => {
  if (!props.flightLineObj) return;

  // 首先确保飞线图对象已启用
  if (!props.flightLineObj.isEnabled() && selectedId.value) {
    props.flightLineObj.enable().catch(err => {
      console.error("启用飞线图失败:", err);
    });
  }

  flightLines.value.forEach(line => {
    updateFlightLineHighlight(line.id);
  });
};

// 显示单个飞线
const showFlightLine = (id: string) => {
  if (!props.flightLineObj) return;

  try {
    // 选择该飞线，使其显示在地图上
    selectFlightLine(id);

    console.log(`已显示飞线: ${id}`);
  } catch (error) {
    console.error(`显示飞线 ${id} 失败:`, error);
  }
};

// 添加示例飞线数据
const addDemoFlightLines = () => {
  if (!props.flightLineObj) {
    console.error("添加演示数据失败：flightLineObj不存在");
    return;
  }

  try {
    console.log("开始添加演示飞线数据");
    const cities = [
      { name: "北京", lng: 116.4, lat: 39.9 }, // 北京作为起点
      { name: "上海", lng: 121.4, lat: 31.2 },
      { name: "广州", lng: 113.2, lat: 23.1 },
      { name: "成都", lng: 104.0, lat: 30.6 },
      { name: "西安", lng: 108.9, lat: 34.2 },
      { name: "武汉", lng: 114.3, lat: 30.5 },
      { name: "深圳", lng: 114.0, lat: 22.5 },
      { name: "南京", lng: 118.8, lat: 32.0 },
      { name: "重庆", lng: 106.5, lat: 29.5 },
      { name: "杭州", lng: 120.1, lat: 30.2 }
    ];

    const demoLines = [];
    const beijing = cities[0]; // 北京作为起点
    const currentTime = Date.now();

    // 创建从北京飞往其他城市的传统飞线
    cities.forEach((city, index) => {
      // 跳过北京自身
      if (index === 0) return;

      // 创建飞线，从北京到目标城市，使用默认样式
      demoLines.push({
        from: [beijing.lng, beijing.lat],
        to: [city.lng, city.lat],
        fromName: beijing.name,
        toName: city.name,
        value: 100, // 使用统一的默认值
        _createTime: currentTime - (cities.length - index) * 10000 // 越晚添加的城市_createTime越大
      });
    });

    // 创建一个使用FlightCoord多组坐标的飞线示例
    // 此飞线将在一个ID下包含多条飞线路径，全部从北京出发到多个城市
    const multiCoordsExample = {
      fromName: "北京", // 主起点名称
      toName: "多目的地", // 主终点名称（仅显示用）
      isMultiCoords: true, // 标记为多组坐标
      _createTime: currentTime, // 使其排在最前面
      // 使用FlightCoord数组替代传统coords
      coords: cities.slice(1, 6).map(city => {
        return {
          from: [beijing.lng, beijing.lat], // 起点始终是北京
          to: [city.lng, city.lat], // 终点是当前城市
          fromName: beijing.name,
          toName: city.name,
          value: 100 // 使用统一的默认值
        };
      })
    };

    // 将多组坐标示例添加到演示数据中
    demoLines.push(multiCoordsExample);

    console.log("准备添加演示数据:", demoLines);

    // 按照_createTime降序排序（最新的在前）
    demoLines.sort((a, b) => (b._createTime || 0) - (a._createTime || 0));

    // 添加示例数据，使用false表示不保持原始顺序(会按_createTime排序)，0表示不限制数量
    const ids = props.flightLineObj.addFlightLines(demoLines, false, 0);
    console.log("添加演示数据完成，返回的ID:", ids);

    // 设置第一条飞线（多组坐标示例）为活动状态
    if (ids.length > 0) {
      props.flightLineObj.setActiveFlightLine(ids[0]);
      console.log(`设置飞线 ${ids[0]} 为活动状态`);
    }

    // 刷新列表
    console.log("开始延迟刷新列表");
    setTimeout(() => {
      console.log("执行刷新列表");
      refreshFlightLineList();
    }, 200);

    console.log("已添加示例飞线数据");
  } catch (error) {
    console.error("添加示例飞线数据失败:", error);
  }
};

// 切换飞线图
const switchFlightLine = (id: string) => {
  if (!props.flightLineObj) return;

  console.log(`开始切换到飞线 ${id}`);

  try {
    // 直接使用showOnlyFlightLine方法，它会处理所有必要的清空和激活逻辑
    props.flightLineObj.showOnlyFlightLine(id);

    // 更新选中状态
    selectedId.value = id;
    emit("selection-change", id);

    console.log(`已切换到飞线 ${id}`);
  } catch (error) {
    console.error("切换飞线失败:", error);
  }
};

// 加载并确保数据显示
const loadAndEnsureData = () => {
  console.log("执行loadAndEnsureData，确保面板有数据显示");
  // 首先尝试刷新飞线列表
  refreshFlightLineList();
};

// 初始化面板
const initPanel = () => {
  console.log("初始化面板，panelInitialized =", panelInitialized.value);

  if (panelInitialized.value) {
    console.log("面板已初始化，跳过");
    return;
  }

  // 延迟加载数据，确保组件已完全挂载
  nextTick(() => {
    console.log("nextTick执行，开始延迟加载数据");
    loadAndEnsureData();
  });
};

// 更新性能模式
const updatePerformanceMode = () => {
  if (!props.flightLineObj) return;

  try {
    // 更新飞线图对象的性能配置
    props.flightLineObj.setConfig({
      enablePerformanceMode: performanceMode.value,
      hideOnMoving: performanceMode.value,
      hideOnZooming: performanceMode.value,
      forcedPrecomposeRerender: forcedPrecomposeRerenderMode.value
    });

    console.log(`飞线图性能模式已${performanceMode.value ? "启用" : "禁用"}`);
  } catch (error) {
    console.error("更新性能模式设置失败:", error);
  }
};

const updateForcedPrecomposeRerenderMode = () => {
  if (!props.flightLineObj) return;

  props.flightLineObj.setConfig({
    forcedPrecomposeRerender: forcedPrecomposeRerenderMode.value
  });
};

// 更新GL渲染模式
const updateGLRenderMode = () => {
  if (!props.flightLineObj) return;

  try {
    // 检查是否可以使用GL模式
    checkGLModeAvailable().then(available => {
      if (!available && glRenderMode.value) {
        console.warn("echarts-gl未安装，无法使用GL渲染模式");
        glRenderMode.value = false;
      }

      // 更新飞线图对象的GL渲染模式
      props.flightLineObj.setConfig({
        useGLMode: glRenderMode.value && available
      });

      console.log(`飞线图GL渲染模式已${glRenderMode.value && available ? "启用" : "禁用"}`);
    });
  } catch (error) {
    console.error("更新GL渲染模式设置失败:", error);
  }
};

// 检查GL模式是否可用
const checkGLModeAvailable = async (): Promise<boolean> => {
  try {
    // 尝试动态导入echarts-gl，如果成功则可用
    await import("echarts-gl");
    glModeAvailable.value = true;
    return true;
  } catch (error) {
    glModeAvailable.value = false;
    return false;
  }
};

// 更新飞线图标
const updateFlightLineIcon = () => {
  if (!props.flightLineObj) return;

  try {
    // 更新飞线图对象的图标配置
    props.flightLineObj.setConfig({
      effectSymbol: lineSettings.value.effectSymbol,
      effectSymbolSize: lineSettings.value.effectSymbolSize
    });

    console.log(`飞线图图标已更新为: ${lineSettings.value.effectSymbol}, 大小: ${lineSettings.value.effectSymbolSize}`);
  } catch (error) {
    console.error("更新飞线图图标失败:", error);
  }
};

// 切换设置面板
const toggleSettingsPanel = () => {
  showSettingsPanel.value = !showSettingsPanel.value;

  // 如果打开设置面板，从当前配置初始化设置值
  if (showSettingsPanel.value && props.flightLineObj) {
    const config = props.flightLineObj.config || DEFAULT_FLIGHTLINE_CONFIG;

    // 复制配置到设置中
    lineSettings.value = {
      width: config.width || 1,
      opacity: config.opacity || 0.8,
      curveness: config.curveness || 0.4,
      smooth: config.smooth !== undefined ? config.smooth : true,
      smoothConstraint: config.smoothConstraint !== undefined ? config.smoothConstraint : true,
      smoothMonotone: config.smoothMonotone,

      showEffect: config.showEffect !== undefined ? config.showEffect : true,
      effectPeriod: config.effectPeriod || 3,
      effectTrailLength: config.effectTrailLength || 0.3,
      effectSymbol: config.effectSymbol || "plane",
      effectSymbolSize: config.effectSymbolSize || 18,
      effectSpeed: config.effectSpeed || 40, // 添加动画速度

      trailColor: config.trailColor || "#1677ff",
      trailOpacity: config.trailOpacity || 0.7,
      trailWidth: config.trailWidth || 3,

      showNodes: config.showNodes !== undefined ? config.showNodes : true,
      nodeSymbolSize: config.nodeSymbolSize || 12,
      nodeColor: config.nodeColor || "#1677ff",
      nodeEffect: config.nodeEffect !== undefined ? config.nodeEffect : true,

      rippleEffect: {
        period: config.rippleEffect?.period || 2.5,
        scale: config.rippleEffect?.scale || 8,
        brushType: config.rippleEffect?.brushType || "stroke"
      },

      shadowBlur: config.shadowBlur || 20,
      shadowColor: config.shadowColor || "#1677ff"
    };
  }
};

// 更新线条设置
const updateLineSetting = (name: string) => {
  if (!props.flightLineObj) return;

  try {
    // 构建更新对象
    const updateConfig: any = {};
    updateConfig[name] = lineSettings.value[name];

    // 更新配置
    props.flightLineObj.setConfig(updateConfig);

    console.log(`[FlightLine] 更新配置 ${name} 为: `, updateConfig[name]);
  } catch (error) {
    console.error(`更新配置 ${name} 失败:`, error);
  }
};

// 更新涟漪效果
const updateRippleEffect = (name: string) => {
  if (!props.flightLineObj) return;

  try {
    // 构建更新对象，包含完整的rippleEffect对象
    const updateConfig = {
      rippleEffect: { ...lineSettings.value.rippleEffect }
    };

    // 更新配置
    props.flightLineObj.setConfig(updateConfig);

    console.log(`[FlightLine] 更新涟漪效果 ${name} 为: `, lineSettings.value.rippleEffect[name]);
  } catch (error) {
    console.error(`更新涟漪效果 ${name} 失败:`, error);
  }
};

// 恢复默认值
const resetToDefault = () => {
  if (!props.flightLineObj) return;

  try {
    // 使用默认配置
    const defaultConfig = { ...DEFAULT_FLIGHTLINE_CONFIG };

    // 更新设置面板数据
    lineSettings.value = {
      width: defaultConfig.width || 1,
      opacity: defaultConfig.opacity || 0.8,
      curveness: defaultConfig.curveness || 0.4,
      smooth: defaultConfig.smooth !== undefined ? defaultConfig.smooth : true,
      smoothConstraint: defaultConfig.smoothConstraint !== undefined ? defaultConfig.smoothConstraint : true,
      smoothMonotone: defaultConfig.smoothMonotone,

      showEffect: defaultConfig.showEffect !== undefined ? defaultConfig.showEffect : true,
      effectPeriod: defaultConfig.effectPeriod || 3,
      effectTrailLength: defaultConfig.effectTrailLength || 0.3,
      effectSymbol: defaultConfig.effectSymbol || "plane",
      effectSymbolSize: defaultConfig.effectSymbolSize || 18,
      effectSpeed: defaultConfig.effectSpeed || 40, // 添加动画速度

      trailColor: defaultConfig.trailColor || "#1677ff",
      trailOpacity: defaultConfig.trailOpacity || 0.7,
      trailWidth: defaultConfig.trailWidth || 3,

      showNodes: defaultConfig.showNodes !== undefined ? defaultConfig.showNodes : true,
      nodeSymbolSize: defaultConfig.nodeSymbolSize || 12,
      nodeColor: defaultConfig.nodeColor || "#1677ff",
      nodeEffect: defaultConfig.nodeEffect !== undefined ? defaultConfig.nodeEffect : true,

      rippleEffect: {
        period: defaultConfig.rippleEffect?.period || 2.5,
        scale: defaultConfig.rippleEffect?.scale || 8,
        brushType: defaultConfig.rippleEffect?.brushType || "stroke"
      },

      shadowBlur: defaultConfig.shadowBlur || 20,
      shadowColor: defaultConfig.shadowColor || "#1677ff"
    };

    // 应用配置
    props.flightLineObj.setConfig(defaultConfig);

    console.log("[FlightLine] 已恢复默认配置");
  } catch (error) {
    console.error("恢复默认配置失败:", error);
  }
};

// 更新飞线
const updateFlightLine = (id, options) => {
  if (!props.flightLineObj) return false;

  try {
    // 更新飞线配置
    const result = props.flightLineObj.updateFlightLine(id, options);

    // 如果成功且有自定义设置，更新本地数据
    if (result && options.custom) {
      const line = flightLines.value.find(l => l.id === id);
      if (line) {
        if (options.custom.effectSymbol !== undefined) {
          line.effectSymbol = options.custom.effectSymbol;
        }
        if (options.custom.effectSymbolSize !== undefined) {
          line.effectSymbolSize = options.custom.effectSymbolSize;
        }
      }
    }

    return result;
  } catch (error) {
    console.error(`更新飞线 ${id} 失败:`, error);
    return false;
  }
};

// 应用到所有飞线
const applySettingsToAll = () => {
  if (!props.flightLineObj) return;

  try {
    // 将当前设置应用到全局配置
    props.flightLineObj.setConfig(lineSettings.value);

    // 刷新当前显示的飞线
    if (selectedId.value) {
      // 如果有选中的飞线，先更新它
      updateFlightLine(selectedId.value, {
        custom: {
          effectSymbol: lineSettings.value.effectSymbol,
          effectSymbolSize: lineSettings.value.effectSymbolSize
        }
      });
      // 重新显示该飞线
      props.flightLineObj.showOnlyFlightLine(selectedId.value);
    } else if (typeof props.flightLineObj.updateEchartsOptions === "function") {
      // 没有选中飞线，调用更新方法刷新图表
      props.flightLineObj.updateEchartsOptions();
    }

    console.log("[FlightLine] 已将设置应用到所有飞线");

    // 可选：关闭设置面板
    showSettingsPanel.value = false;
  } catch (error) {
    console.error("应用设置到所有飞线失败:", error);
  }
};

// 监听飞线对象状态并自动调整面板显示
const checkFlightLineStatus = () => {
  if (!props.flightLineObj) {
    // 如果飞线对象不存在，确保面板处于非激活状态
    return false;
  }

  try {
    // 检查飞线图层是否启用
    const isEnabled = typeof props.flightLineObj.isEnabled === "function" ? props.flightLineObj.isEnabled() : true;

    // 如果飞线图层被禁用，则隐藏设置面板并折叠
    if (!isEnabled && showSettingsPanel.value) {
      showSettingsPanel.value = false;
      console.log("[FlightLinePanel] 飞线图层已禁用，关闭设置面板");
    }

    return isEnabled;
  } catch (error) {
    console.error("[FlightLinePanel] 检查飞线状态出错:", error);
    return false;
  }
};

// 周期性检查飞线状态
let statusCheckInterval: any = null;

onMounted(() => {
  console.log("FlightLinePanel组件挂载");

  // 确保初始化只执行一次
  initPanel();

  // 检查GL模式是否可用
  checkGLModeAvailable().then(available => {
    glModeAvailable.value = available;
    glRenderMode.value = available; // 如果可用则默认启用
  });

  // 初始应用性能模式和GL渲染模式设置
  nextTick(() => {
    if (props.flightLineObj) {
      updatePerformanceMode();
      updateGLRenderMode();
      updateFlightLineIcon(); // 初始应用图标设置
    }
  });

  // 监听active属性变化
  watch(
    () => props.active,
    newActive => {
      console.log("面板active状态变更:", newActive);
      if (newActive) {
        // 当面板变为活动状态时，加载数据
        nextTick(() => {
          console.log("面板激活，加载数据");
          loadAndEnsureData();
        });
      } else {
        // 当组件变为非激活状态时
        console.log("面板非激活，清理状态");

        // 隐藏设置面板
        showSettingsPanel.value = false;

        // 如果需要，也可以清空选中的飞线
        if (selectedId.value) {
          clearSelection();
        }

        // 折叠面板
        collapsed.value = true;
      }
    },
    { immediate: true }
  );

  // 设置周期性检查
  statusCheckInterval = setInterval(() => {
    checkFlightLineStatus();
  }, 1000); // 每秒检查一次
});

onBeforeUnmount(() => {
  // 清除定时器
  if (statusCheckInterval) {
    clearInterval(statusCheckInterval);
    statusCheckInterval = null;
  }
});

// 暴露方法给父组件
defineExpose({
  refreshFlightLineList,
  selectFlightLine,
  clearSelection,
  addDemoFlightLines,
  setOptimalView,
  showFlightLine,
  updateFlightLine,
  loadAndEnsureData, // 暴露新方法
  clearFlightLineLayer, // 暴露清空图层方法
  switchFlightLine // 暴露切换飞线方法
});
</script>

<style scoped>
.flight-line-panel {
  position: absolute;
  width: 320px;
  max-height: 600px;
  background-color: rgba(255, 255, 255, 0.95);
  border-radius: 4px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.2);
  display: flex;
  flex-direction: column;
  z-index: 1000;
  overflow: hidden;
  opacity: 0;
  pointer-events: none;
  transition:
    opacity 0.3s,
    transform 0.3s;
  transform: translateY(-10px);
  visibility: hidden; /* 默认隐藏 */
}

.flight-line-panel.active {
  opacity: 1;
  pointer-events: all;
  transform: translateY(0);
  visibility: visible; /* 激活时显示 */
}

.flight-line-panel.collapsed {
  width: 40px !important;
  height: 40px !important;
  overflow: hidden;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.15);
  background: linear-gradient(135deg, #1890ff, #096dd9);
  cursor: pointer;
  border-radius: 10px;
}

/* 位置样式 */
.flight-line-panel.position-top-left {
  top: 10px;
  left: 10px;
}
.flight-line-panel.collapsed.position-top-left {
  top: 60px !important;
}

.flight-line-panel.position-top-right {
  top: 10px;
  right: 10px;
}

.flight-line-panel.collapsed.position-top-right {
  top: 60px !important;
}

.flight-line-panel.position-bottom-left {
  bottom: 10px;
  left: 10px;
}

.flight-line-panel.position-bottom-right {
  bottom: 10px;
  right: 10px;
}

.flight-line-panel-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  background-color: #3498db;
  color: white;
  padding: 8px 12px;
  font-weight: bold;
}

.flight-line-panel.collapsed .flight-line-panel-header {
  display: none;
}

.panel-actions {
  display: flex;
  align-items: center;
  gap: 10px;
}

.panel-count {
  font-size: 12px;
  opacity: 0.8;
  margin-right: 5px;
}

.panel-selected {
  font-size: 12px;
  opacity: 0.8;
  margin-right: 5px;
}

.selected-indicator {
  display: inline-block;
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background-color: #1890ff;
  margin-right: 5px;
}

.minimize-btn {
  background: none;
  border: none;
  color: white;
  font-size: 16px;
  cursor: pointer;
  width: 26px;
  height: 26px;
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.minimize-btn:hover {
  background-color: rgba(255, 255, 255, 0.2);
}

.flight-line-panel-content {
  flex: 1;
  overflow-y: auto;
  max-height: 500px;
  padding: 10px;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.flight-line-stats {
  display: flex;
  justify-content: space-between;
  font-size: 12px;
  color: #666;
  padding: 5px 0;
  border-bottom: 1px solid #eee;
}

.flight-line-note {
  display: flex;
  align-items: center;
  gap: 5px;
  font-size: 12px;
  color: #666;
  margin-bottom: 10px;
}

.note-icon {
  font-size: 16px;
  color: #1890ff;
}

.note-text {
  font-size: 12px;
  line-height: 1.5;
}

.flight-line-toolbar {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
}

.toolbar-btn {
  padding: 4px 8px;
  font-size: 12px;
  border-radius: 4px;
  cursor: pointer;
}

.toolbar-btn:hover {
  background-color: rgba(255, 255, 255, 0.2);
}

.toolbar-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.toolbar-btn-active {
  background-color: #e6f7ff;
  border-color: #1890ff;
  color: #1890ff;
}

.toolbar-btn-primary {
  background-color: #3498db;
  color: white;
  border-color: #2980b9;
}

.toolbar-btn-primary:hover {
  background-color: #2980b9;
}

.toolbar-btn-info {
  background-color: #3498db;
  color: white;
  border-color: #2980b9;
}

.toolbar-btn-info:hover {
  background-color: #2980b9;
}

.toolbar-btn-highlight {
  position: relative;
  animation: pulse 2s infinite;
  box-shadow: 0 0 5px rgba(24, 144, 255, 0.5);
}

@keyframes pulse {
  0% {
    box-shadow: 0 0 5px rgba(24, 144, 255, 0.5);
  }
  50% {
    box-shadow: 0 0 10px rgba(24, 144, 255, 0.8);
  }
  100% {
    box-shadow: 0 0 5px rgba(24, 144, 255, 0.5);
  }
}

.flight-line-list {
  flex: 1;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.no-flight-lines {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100px;
  color: #999;
  font-size: 14px;
}

.initial-tip {
  display: flex;
  align-items: center;
  gap: 5px;
  font-size: 12px;
  color: #666;
  margin: 10px 0;
  padding: 10px;
  background-color: #f0f8ff;
  border-left: 3px solid #1890ff;
  border-radius: 4px;
}

.initial-tip-icon {
  font-size: 16px;
  color: #1890ff;
}

.initial-tip-text {
  font-size: 12px;
  line-height: 1.5;
}

.thin-scrollbar,
.pure-scrollbar {
  scrollbar-color: var(--el-color-primary) transparent;
  /* 滑块颜色、轨道颜色 */

  /* Firefox */
  scrollbar-width: thin;

  /* 可选值为 'auto', 'thin', 'none' */
  ::-webkit-scrollbar {
    width: 6px;
    /* 滚动条宽度 */
  }

  /* 滚动条轨道 */
  ::-webkit-scrollbar-track {
    background: transparent;
    /* 轨道颜色 */
  }

  /* 滚动条滑块 */
  ::-webkit-scrollbar-thumb {
    background-color: var(--el-color-primary-light-1);
    border-radius: 4px;
  }

  /* 滚动条滑块：hover状态 */
  ::-webkit-scrollbar-thumb:hover {
    background: var(--el-color-primary);
    /* 滑块hover颜色 */
  }
}
.flight-line-item {
  position: relative;
  padding: 12px;
  margin-bottom: 10px;
  border: 1px solid #e8e8e8;
  border-radius: 4px;
  background-color: #f9f9f9;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.flight-line-item:hover {
  background-color: #f0f0f0;
  transform: translateY(-2px);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.flight-line-item-active {
  border: 2px solid #1677ff;
  background-color: #e6f7ff;
}

.flight-line-content {
  flex: 1;
}

.flight-line-title {
  font-weight: bold;
  margin-bottom: 6px;
  font-size: 14px;
  color: #333;
}

.flight-line-details {
  display: flex;
  font-size: 12px;
  color: #666;
  gap: 10px;
}

.flight-line-active-badge {
  position: absolute;
  bottom: 5px;
  right: 5px;
  padding: 2px 8px;
  background-color: #1677ff;
  color: #fff;
  border-radius: 10px;
  font-size: 12px;
  font-weight: bold;
}

/* 最小化后的样式，参考轨迹播放器的实现 */
.track-player-minimized {
  position: absolute;
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  color: white;
  font-size: 18px;
  background: linear-gradient(135deg, #1890ff, #096dd9);
  /* border-radius: 50%; */
  transition: transform 0.3s;
}

.track-player-minimized:hover {
  transform: scale(1.05);
}

.minimized-restore-icon {
  font-size: 20px;
  font-weight: bold;
}

/* 性能设置 */
.performance-settings {
  margin: 8px 0;
  padding: 8px 0;
  border-top: 1px solid #eee;
  border-bottom: 1px solid #eee;
}

.performance-option {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 12px;
  color: #666;
}

.performance-option input[type="checkbox"] {
  margin: 0;
}

/* GL模式提示 */
.gl-mode-notice {
  font-size: 11px;
  color: #ff6a00;
  margin-top: 4px;
  line-height: 1.2;
}

.gl-mode-notice code {
  background-color: #f5f5f5;
  padding: 2px 4px;
  border-radius: 3px;
  font-family: monospace;
}

/* 图标设置 */
.icon-settings {
  margin-top: 10px;
  border-top: 1px solid #eee;
  padding-top: 10px;
  font-size: 12px;
}

.section-title {
  font-weight: bold;
  margin-bottom: 8px;
  color: #666;
}

.icon-option {
  display: flex;
  align-items: center;
  margin-bottom: 8px;
}

.icon-option label {
  width: 80px;
  flex-shrink: 0;
}

.icon-option select {
  flex: 1;
  padding: 4px;
  border: 1px solid #ddd;
  border-radius: 4px;
}

.custom-icon {
  margin-top: 8px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.custom-icon label {
  display: block;
  margin-bottom: 4px;
}

.custom-icon textarea {
  resize: vertical;
  width: 100%;
  height: 60px;
  padding: 4px;
  font-family: monospace;
  font-size: 12px;
  border: 1px solid #ddd;
  border-radius: 4px;
}

.icon-preview {
  display: flex;
  align-items: center;
  margin-top: 4px;
}

.icon-preview-title {
  width: 80px;
  flex-shrink: 0;
}

.icon-preview-container {
  width: 50px;
  height: 50px;
  border: 1px dashed #ddd;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: #f9f9f9;
}

.icon-preview img {
  max-width: 100%;
  max-height: 100%;
}

.icon-preview-error {
  font-size: 10px;
  color: #ff6a00;
}

.icon-size {
  display: flex;
  align-items: center;
  margin-top: 8px;
  gap: 8px;
}

.icon-size label {
  width: 80px;
  flex-shrink: 0;
}

.icon-size input {
  flex: 1;
}

.icon-size span {
  width: 30px;
  text-align: center;
}

.line-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
}

.line-actions {
  display: flex;
  gap: 5px;
}

.action-btn {
  font-size: 12px;
  padding: 4px;
  height: 24px;
  width: 24px;
}

.current-icon-preview {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
}

.current-icon-preview svg {
  transform: scale(1.2);
}

.flight-icon-container {
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: 10px;
}

.flight-icon-preview {
  display: flex;
  justify-content: center;
  align-items: center;
  background-color: #f5f5f5;
  border-radius: 4px;
  padding: 10px;
  height: 60px;
  transition: transform 0.3s;
}

.icon-selector {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.icon-options {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.icon-option {
  width: 36px;
  height: 36px;
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: #f5f5f5;
  cursor: pointer;
  transition: background-color 0.2s;
}

.icon-option:hover {
  background-color: #e6f7ff;
}

.icon-option.selected {
  background-color: #1677ff;
}

.icon-option.selected svg path {
  fill: white;
}

.icon-size-slider {
  margin-top: 10px;
}

.line-style {
  display: flex;
  align-items: center;
  gap: 5px;
  font-size: 12px;
  color: #666;
  margin-top: 4px;
}

.style-color {
  width: 12px;
  height: 12px;
  border-radius: 50%;
}

.style-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 16px;
  height: 16px;
}

.style-label {
  font-size: 11px;
}

.line-info {
  display: flex;
  flex-direction: column;
  margin-top: 6px;
  font-size: 12px;
}

.line-detail {
  display: flex;
  align-items: center;
  gap: 4px;
  margin-bottom: 2px;
}

.detail-label {
  font-weight: bold;
  color: #666;
  width: 40px;
}

.detail-value {
  color: #333;
}

.selection-tip {
  display: flex;
  align-items: center;
  gap: 5px;
  font-size: 12px;
  color: #666;
  margin-bottom: 10px;
}

.selection-tip-icon {
  font-size: 16px;
  color: #1890ff;
}

.selection-tip-text {
  font-size: 12px;
  line-height: 1.5;
}

.empty-list-debug {
  margin: 15px 0;
}

.debug-panel {
  background-color: #f8f8f8;
  border: 1px dashed #ccc;
  padding: 10px;
  border-radius: 4px;
  font-size: 12px;
}

.debug-panel h4 {
  margin: 0 0 8px 0;
  color: #666;
}

.debug-panel p {
  margin: 3px 0;
  color: #333;
}

.diagnose-info {
  font-size: 12px;
  color: #ff6a00;
  margin-top: 8px;
}

/* 添加设置面板 */
.flight-line-settings-popup {
  position: absolute;
  top: 40px;
  left: 10px;
  right: 10px;
  bottom: 10px;
  background-color: white;
  border-radius: 8px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.4);
  z-index: 1001; /* 更高的z-index确保在蒙版上方 */
  display: flex;
  flex-direction: column;
  overflow: hidden;
  transition: all 0.3s ease;
  animation: fade-in 0.3s ease;
}

@keyframes fade-in {
  from {
    opacity: 0;
    transform: translateY(-10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.settings-popup-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 15px;
  background-color: #3498db;
  border-bottom: 1px solid #e4e7ed;
}

.settings-popup-title {
  font-weight: bold;
  color: white;
}

.settings-popup-close {
  background: none;
  border: none;
  font-size: 20px;
  color: white;
  cursor: pointer;
}

.settings-popup-close:hover {
  color: #f0f0f0;
}

.settings-popup-content {
  flex: 1;
  padding: 15px;
  overflow-y: auto;
}

.settings-section {
  margin-bottom: 20px;
  padding-bottom: 10px;
  border-bottom: 1px solid #eee;
}

.setting-item {
  margin-bottom: 12px;
  display: flex;
  align-items: center;
  flex-wrap: wrap;
}

.setting-item label {
  width: 100px;
  flex-shrink: 0;
  font-size: 13px;
  color: #333;
}

.slider-wrap {
  flex: 1;
  min-width: 150px;
  margin: 0 10px;
}

.setting-value {
  width: 40px;
  text-align: right;
  font-size: 12px;
  color: #666;
}

.settings-actions {
  display: flex;
  justify-content: space-between;
  margin-top: 15px;
}

/* 添加设置按钮样式 */
.toolbar-btn-settings {
  color: white;
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 5px;
  border-radius: 4px;
  padding: 0;
}

.settings-icon {
  font-style: normal;
  font-size: 16px;
}

/* 添加背景蒙版 */
.settings-backdrop {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  z-index: 1000; /* 确保在面板内容之上，但在设置面板之下 */
  backdrop-filter: blur(2px); /* 添加模糊效果 */
  animation: backdrop-fade-in 0.3s ease;
}

@keyframes backdrop-fade-in {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

.color-picker-wrap {
  display: flex;
  align-items: center;
}

.color-value {
  margin-left: 10px;
  color: #666;
  font-size: 12px;
}

.setting-subsection {
  margin-left: 15px;
  margin-top: 5px;
  padding-left: 10px;
  border-left: 2px solid #eee;
}

.subsection-title {
  font-size: 12px;
  color: #666;
  margin-bottom: 8px;
}
</style>
