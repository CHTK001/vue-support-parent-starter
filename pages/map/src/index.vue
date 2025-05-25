<template>
  <div class="sc-layer-example">
    <h2>ScLayer 地图组件示例</h2>

    <div class="example-content">
      <!-- 左侧地图区域 -->
      <div class="map-area">
        <ScLayer ref="layerRef" :height="config.height" :map-type="config.mapType" :map-tile="config.mapTile"
          :center="config.center" :zoom="config.zoom" :dragging="config.dragging"
          :scroll-wheel-zoom="config.scrollWheelZoom" :map-key="config.mapKey" :show-toolbar="config.showToolbar"
          :show-scale-line="config.showScaleLine" :map="config.map" @map-initialized="onMapInit" @map-click="onMapClick"
          @marker-click="onMarkerClick" @toolbar-state-change="onToolbarStateChange" @marker-create="onMarkerCreate"
          @marker-update="onMarkerUpdate" @marker-delete="onMarkerDelete" @shape-create="onShapeCreate"
          @shape-update="onShapeUpdate" @shape-delete="onShapeDelete">
        </ScLayer>
      </div>

      <!-- 右侧配置区域 -->
      <div class="config-area thin-scrollbar">
        <div class="config-section">
          <div class="config-item"></div>
          <div class="label">地图配置</div>
          <div class="controls">

            <!-- 替换地图类型下拉框为按钮组 -->
            <div class="control-row">
              <span>地图类型:</span>
              <div class="button-group">
                <button @click="changeMapType(MapType.GAODE)"
                  :class="{ 'active-button': config.mapType === MapType.GAODE }">
                  高德地图
                </button>
                <button @click="changeMapType(MapType.OSM)"
                  :class="{ 'active-button': config.mapType === MapType.OSM }">
                  OpenStreetMap
                </button>
                <button @click="changeMapType(MapType.TIANDI)"
                  :class="{ 'active-button': config.mapType === MapType.TIANDI }">
                  天地图
                </button>
              </div>
            </div>
            <div class="control-row">
              <span>图层类型:</span>
              <div class="button-group">
                <button @click="changeLayerType('normal')" :class="{ 'active-button': tileType === 'normal' }">
                  标准图层
                </button>
                <button @click="changeLayerType('satellite')" :class="{ 'active-button': tileType === 'satellite' }">
                  卫星图层
                </button>
                <button @click="changeLayerType('hybrid')" :class="{ 'active-button': tileType === 'hybrid' }">
                  混合图层
                </button>
              </div>
            </div>
            <div class="control-row">
              <span>工具栏位置:</span>
              <div class="button-group">
                <button @click="changeToolbarPosition(ToolbarPosition.TOP_LEFT)"
                  :class="{ 'active-button': toolbarPosition === ToolbarPosition.TOP_LEFT }">
                  左上角
                </button>
                <button @click="changeToolbarPosition(ToolbarPosition.TOP_RIGHT)"
                  :class="{ 'active-button': toolbarPosition === ToolbarPosition.TOP_RIGHT }">
                  右上角
                </button>
              </div>
            </div>
            <div class="control-row toolbar-position-row">
              <div class="button-group">
                <button @click="changeToolbarPosition(ToolbarPosition.BOTTOM_LEFT)"
                  :class="{ 'active-button': toolbarPosition === ToolbarPosition.BOTTOM_LEFT }">
                  左下角
                </button>
                <button @click="changeToolbarPosition(ToolbarPosition.BOTTOM_RIGHT)"
                  :class="{ 'active-button': toolbarPosition === ToolbarPosition.BOTTOM_RIGHT }">
                  右下角
                </button>
              </div>
            </div>

            <!-- 添加工具栏方向控制 -->
            <div class="control-row">
              <span>工具栏方向:</span>
              <div class="button-group">
                <button @click="changeToolbarDirection(ToolbarDirection.HORIZONTAL)"
                  :class="{ 'active-button': toolbarDirection === ToolbarDirection.HORIZONTAL }">
                  水平方向
                </button>
                <button @click="changeToolbarDirection(ToolbarDirection.VERTICAL)"
                  :class="{ 'active-button': toolbarDirection === ToolbarDirection.VERTICAL }">
                  垂直方向
                </button>
              </div>
            </div>

            <div class="control-row">
              <span>可拖动:</span>
              <input type="checkbox" v-model="config.dragging" @change="handleInteractionChange">
            </div>
            <div class="control-row">
              <span>滚轮缩放:</span>
              <input type="checkbox" v-model="config.scrollWheelZoom" @change="handleInteractionChange">
            </div>
            <div class="control-row">
              <span>比例尺:</span>
              <input type="checkbox" v-model="config.showScaleLine" @change="handleScaleLineChange">
            </div>
            <div class="control-row">
              <span>缩放级别:</span>
              <input type="range" v-model.number="config.zoom" min="3" max="18" @change="handleZoomChange">
              <span class="value">{{ config.zoom }}</span>
            </div>
            <div class="control-row">
              <span>快速切换:</span>
            </div>
            <div class="control-row buttons-row">
              <button @click="switchToLayer(MapType.GAODE, MapTile.NORMAL)"
                :class="{ 'active-button': config.mapType === MapType.GAODE && config.mapTile === MapTile.NORMAL }">
                高德标准
              </button>
              <button @click="switchToLayer(MapType.GAODE, MapTile.SATELLITE)"
                :class="{ 'active-button': config.mapType === MapType.GAODE && config.mapTile === MapTile.SATELLITE }">
                高德卫星
              </button>
            </div>
            <div class="control-row buttons-row">
              <button @click="switchToLayer(MapType.OSM, MapTile.NORMAL)"
                :class="{ 'active-button': config.mapType === MapType.OSM && config.mapTile === MapTile.NORMAL }">
                OSM地图
              </button>
              <button @click="switchToLayer(MapType.TIANDI, MapTile.NORMAL)"
                :class="{ 'active-button': config.mapType === MapType.TIANDI && config.mapTile === MapTile.NORMAL }">
                天地图
              </button>
            </div>
          </div>
        </div>

        <div class="config-item">
          <div class="label">key操作</div>
          <div class="controls">
            <div class="control-row">
              <span>高德</span>
              <el-input v-model="gaodeKey" type="password" show-password />
            </div>
          </div>
          <div class="label">标记点操作</div>
          <div class="controls">
            <!-- 标记点操作区域 - 添加功能分组 -->
            <div class="feature-group-title">基本标记</div>
            <div class="control-row buttons-row">
              <button @click="addRandomMarkers(3)">添加随机标记</button>
              <button @click="clearAllMarkers">清除所有标记</button>
            </div>
            <div class="control-row buttons-row">
              <button @click="addRandomMarkers(10)">添加10个随机点</button>
            </div>

            <div class="feature-group-title">特殊标记</div>
            <div class="control-row buttons-row">
              <button @click="addColoredMarkers">添加图标类型示例</button>
              <button @click="addClusterMarkers">添加聚合标记</button>
            </div>
            <div class="control-row buttons-row">
              <button @click="addPhotoMarkers">添加Photo样式图标</button>
              <button @click="toggleAllMarkers">{{ allMarkersVisible ? '隐藏所有标记点' : '显示所有标记点' }}</button>
            </div>
            <div class="control-row buttons-row">
              <button @click="toggleAllLabels">{{ allLabelsVisible ? '隐藏所有标签' : '显示所有标签' }}</button>
            </div>

            <div class="feature-group-title">Popover标记</div>
            <div class="control-row buttons-row">
              <button @click="addPopoverMarker">添加默认显示Popover标记</button>
            </div>
            <div class="control-row buttons-row">
              <button @click="addTemplateMarker">添加带模板的标记点</button>
              <button @click="addNoTemplateMarker">添加无模板的标记点</button>
            </div>

            <div class="feature-group-title">分组标记</div>
            <div class="control-row buttons-row">
              <button @click="addGroupedMarkers">添加分组标记点</button>
              <button @click="toggleGroupVisibility">切换分组显示</button>
            </div>
          </div>
        </div>

        <div class="config-item">
          <div class="label">图形操作</div>
          <div class="controls">
            <!-- 图形操作区域 - 添加功能分组 -->
            <div class="feature-group-title">基本图形</div>
            <div class="control-row buttons-row">
              <button @click="addSquareShape">添加正方形</button>
              <button @click="addCircleShape">添加圆形</button>
            </div>
            <div class="control-row buttons-row">
              <button @click="addRectangleShape">添加矩形</button>
              <button @click="addPolygonShape">添加多边形</button>
            </div>

            <div class="feature-group-title">线段和点</div>
            <div class="control-row buttons-row">
              <button @click="addLineShape">添加线段</button>
              <button @click="addPointShape">添加点</button>
            </div>

            <div class="feature-group-title">复合和管理</div>
            <div class="control-row buttons-row">
              <button @click="addCustomShapeExample">添加复合图形示例</button>
              <button @click="clearAllShapes">清除所有图形</button>
            </div>
            <div class="control-row buttons-row">
              <button @click="toggleShapeVisible">{{ allShapesVisible ? '隐藏所有图形' : '显示所有图形' }}</button>
              <button @click="modifyRandomShape">修改随机图形</button>
            </div>

            <div class="feature-group-title">边界绘制</div>
            <div class="control-row buttons-row">
              <button @click="drawTaizhouBoundary">绘制台州边界</button>
            </div>
          </div>
        </div>

        <!-- 添加轨迹操作部分 -->
        <div class="config-item">
          <div class="label">轨迹操作</div>
          <div class="controls">
            <!-- 轨迹操作区域 - 添加功能分组 -->
            <div class="feature-group-title">轨迹示例</div>
            <div class="control-row buttons-row">
              <button @click="addSampleTrack">添加示例轨迹</button>
              <button @click="addComplexTrack">添加复杂轨迹</button>
            </div>
            <div class="control-row buttons-row">
              <button @click="addCircularTrack">添加环形轨迹</button>
              <button @click="addZigzagTrack">添加Z字型轨迹</button>
            </div>
          </div>
        </div>

        <!-- 添加3D模型操作部分 -->
        <div class="config-item">
          <div class="label">3D模型操作</div>
          <div class="controls">
            <!-- 3D模型操作区域 - 添加功能分组 -->
            <div class="feature-group-title">3D模型管理</div>
            <div class="control-row buttons-row">
              <button @click="addSimple3DModel" :disabled="!is3DMode">添加简单模型</button>
              <button @click="addDetailed3DModel" :disabled="!is3DMode">添加详细模型</button>
            </div>
            <div class="control-row buttons-row">
              <button @click="addCustom3DModel" :disabled="!is3DMode">添加自定义模型</button>
              <button @click="clearAll3DModels" :disabled="!is3DMode">清除所有模型</button>
            </div>

            <div class="feature-group-title">模型操作</div>
            <div class="control-row buttons-row">
              <button @click="flyToSelectedModel" :disabled="!is3DMode || !selectedModelId">飞行到模型</button>
              <button @click="rotateSelectedModel" :disabled="!is3DMode || !selectedModelId">旋转模型</button>
            </div>
            <div class="control-row buttons-row">
              <button @click="resizeSelectedModel" :disabled="!is3DMode || !selectedModelId">调整模型大小</button>
              <button @click="changeModelColor" :disabled="!is3DMode || !selectedModelId">更改模型颜色</button>
            </div>
          </div>
        </div>

        <!-- 添加热力图操作部分 -->
        <div class="config-item">
          <div class="label">热力图操作</div>
          <div class="controls">
            <!-- 热力图操作区域 - 添加功能分组 -->
            <div class="feature-group-title">热力图控制</div>
            <div class="control-row buttons-row">
              <button @click="toggleHeatmapPerformanceMode">{{ heatmapPerformanceMode ? '禁用性能模式' : '启用性能模式' }}</button>
            </div>

            <div class="feature-group-title">热力点管理</div>
            <div class="control-row buttons-row">
              <button @click="addRandomHeatmapPoints(20)">添加随机热力点</button>
              <button @click="clearHeatmapPoints">清除热力点</button>
            </div>
            <div class="control-row buttons-row">
              <button @click="addDenseHeatmapPoints">添加密集热力数据</button>
            </div>
          </div>
        </div>

        <!-- 添加风场图操作部分 -->
        <div class="config-item">
          <div class="label">风场图操作</div>
          <div class="controls">
            <div class="feature-group-title">风场参数</div>
            <div class="control-row">
              <span>粒子数量:</span>
              <input type="range" v-model.number="windConfig.paths" min="100" max="5000" @input="updateWindOptions">
              <span class="value">{{ windConfig.paths }}</span>
            </div>
            <div class="control-row">
              <span>线条粗细:</span>
              <input type="range" v-model.number="windConfig.lineWidth" min="1" max="5" step="0.5"
                @input="updateWindOptions">
              <span class="value">{{ windConfig.lineWidth }}</span>
            </div>
            <div class="control-row">
              <span>速度缩放:</span>
              <input type="range" v-model.number="windConfig.velocityScale" min="0.01" max="0.1" step="0.01"
                @input="updateWindOptions">
              <span class="value">{{ windConfig.velocityScale }}</span>
            </div>
          </div>
        </div>

        <div class="config-item">
          <div class="label">标记点列表</div>
          <div class="marker-stats">
            <span>总数: {{ markers.length }}</span>
            <span>可见: {{ visibleMarkerCount }}</span>
          </div>
          <div class="marker-list">
            <div v-if="markers.length === 0" class="no-markers">
              暂无标记点
            </div>
            <div v-for="marker in markers.slice(0, 5)" :key="marker.id" class="marker-item thin-scrollbar">
              <div class="marker-header">
                <span class="marker-id">ID: {{ safeSlice(marker.id) }}</span>
                <span :class="['marker-status', marker.visible ? 'visible' : 'hidden']">
                  {{ marker.visible ? '可见' : '隐藏' }}
                </span>
              </div>
              <div class="marker-position">位置: [{{ marker.position[0].toFixed(4) }}, {{ marker.position[1].toFixed(4)
              }}]</div>
              <div class="marker-title" v-if="marker.title">标题: {{ marker.title }}</div>
              <div class="marker-actions">
                <button @click="toggleMarkerVisibility(marker)">
                  {{ marker.visible ? '隐藏' : '显示' }}
                </button>
                <button @click="toggleMarkerPopover(marker)">
                  {{ marker.showPopover ? '隐藏Popover' : '显示Popover' }}
                </button>
                <button @click="moveMarker(marker)">移动</button>
                <button @click="removeMarker(marker)">删除</button>
              </div>
            </div>
            <div v-if="markers.length > 5" class="more-markers">
              还有 {{ markers.length - 5 }} 个标记点未显示...
            </div>
          </div>
        </div>

        <div class="config-item">
          <div class="label">图形列表</div>
          <div class="shape-stats">
            <span>总数: {{ shapes.length }}</span>
            <span>可见: {{ allShapesVisible ? shapes.length : 0 }}</span>
          </div>
          <div class="shape-list">
            <div v-if="shapes.length === 0" class="no-shapes">
              暂无图形
            </div>
            <div v-for="shape in shapes.slice(0, 5)" :key="shape.id" class="shape-item thin-scrollbar">
              <div class="shape-header">
                <span class="shape-id">ID: {{ safeSlice(shape.id) }}</span>
                <span class="shape-type">类型: {{ getShapeTypeName(shape.type) }}</span>
              </div>
              <div class="shape-data" v-if="shape.data">
                <template v-if="typeof shape.data === 'object'">
                  <div v-for="(value, key) in shape.data" :key="key" class="shape-data-item">
                    {{ key }}: {{ value }}
                  </div>
                </template>
                <template v-else>
                  数据: {{ shape.data }}
                </template>
              </div>
              <div class="shape-status">
                状态: <span :class="[shape.visible === false ? 'hidden' : 'visible']">
                  {{ shape.visible === false ? '隐藏' : '可见' }}
                </span>
              </div>
              <div class="shape-actions">
                <button @click="toggleShapeVisibility(shape)">
                  {{ shape.visible === false ? '显示' : '隐藏' }}
                </button>
                <button @click="changeShapeStyle(shape)">
                  修改样式
                </button>
                <button @click="removeShape(shape)">
                  删除
                </button>
              </div>
            </div>
            <div v-if="shapes.length > 5" class="more-shapes">
              还有 {{ shapes.length - 5 }} 个图形未显示...
            </div>
          </div>
        </div>

        <!-- 飞线图列表 -->
        <div class="config-item">
          <div class="label">飞线图列表</div>
          <div class="flight-line-stats">
            <span>总数: {{ flightLines.length }}</span>
            <span>已选择: {{ selectedFlightLine ? 1 : 0 }}</span>
          </div>
          <div class="flight-line-list">
            <div v-if="flightLines.length === 0" class="no-flight-lines">
              暂无飞线数据
            </div>
            <div v-for="line in flightLines" :key="line.id" class="flight-line-item thin-scrollbar"
              :class="{ 'flight-line-selected': selectedFlightLine === line.id }" @click="selectFlightLine(line.id)">
              <div class="flight-line-header">
                <span class="flight-line-id">ID: {{ safeSlice(line.id) }}</span>
                <span class="flight-line-value" v-if="line.value">值: {{ line.value }}</span>
              </div>
              <div class="flight-line-route">
                <span>{{ line.fromName }}</span>
                <span class="flight-line-arrow">→</span>
                <span>{{ line.toName }}</span>
              </div>
            </div>
            <div v-if="flightLines.length > 10" class="more-flight-lines">
              还有 {{ flightLines.length - 10 }} 条飞线未显示...
            </div>
          </div>
        </div>

        <div class="config-item">
          <div class="label">事件日志</div>
          <div class="log-container">
            <div v-for="(log, index) in logs" :key="index" class="log-item thin-scrollbar">
              <span class="log-time">{{ log.time }}</span>
              <span class="log-type">{{ log.type }}:</span>
              <span class="log-message">{{ log.message }}</span>
            </div>
            <div v-if="logs.length === 0" class="no-logs">
              暂无事件记录
            </div>
          </div>
        </div>

        <div class="config-item">
          <div class="label">标记点分组</div>
          <div class="controls">
            <div class="marker-group-stats">
              <span>分组总数: {{ markerGroups.length }}</span>
            </div>
            <div class="marker-group-list">
              <div v-if="markerGroups.length === 0" class="no-marker-groups">
                暂无标记点分组
              </div>
              <div v-for="group in markerGroups" :key="group.name" class="marker-group-item thin-scrollbar">
                <div class="marker-group-header">
                  <span class="marker-group-name">{{ group.name }}</span>
                  <span :class="['marker-group-status', group.visible ? 'visible' : 'hidden']">
                    {{ group.visible ? '可见' : '隐藏' }}
                  </span>
                </div>
                <div class="marker-group-count">标记点数量: {{ getGroupMarkerCount(group.name) }}</div>
                <div class="marker-group-actions">
                  <button @click="toggleMarkerGroupVisibility(group.name)">
                    {{ group.visible ? '隐藏' : '显示' }}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- 添加热力图点列表 -->
        <div class="config-item">
          <div class="label">热力图点列表</div>
          <div class="controls">
            <div class="heatmap-stats">
              <span>总数: {{ heatmapPoints.length }}</span>
              <span>已选择: {{ selectedHeatmapPoint ? 1 : 0 }}</span>
            </div>
            <div class="heatmap-list">
              <div v-if="heatmapPoints.length === 0" class="no-heatmap-points">
                暂无热力图点数据
              </div>
              <div v-for="point in heatmapPoints" :key="point.id" class="heatmap-item thin-scrollbar"
                :class="{ 'heatmap-selected': selectedHeatmapPoint === point.id }" @click="selectHeatmapPoint(point.id)">
                <div class="heatmap-header">
                  <span class="heatmap-name">{{ point.name || '未命名点' }}</span>
                  <span class="heatmap-weight">权重: {{ point.weight?.toFixed(2) || '0.00' }}</span>
                </div>
                <div class="heatmap-position">
                  坐标: [{{ point.longitude?.toFixed(4) || '0.0000' }}, {{ point.latitude?.toFixed(4) || '0.0000' }}]
                </div>
              </div>
              <div v-if="heatmapPoints.length > 10" class="more-heatmap-points">
                还有 {{ heatmapPoints.length - 10 }} 个热力点未显示...
              </div>
            </div>
          </div>
        </div>

        <!-- 添加3D模型列表 -->
        <div class="config-item">
          <div class="label">3D模型列表</div>
          <div class="controls">
            <div class="model-stats">
              <span>总数: {{ models.length }}</span>
              <span>已选择: {{ selectedModelId ? 1 : 0 }}</span>
            </div>
            <div class="model-list">
              <div v-if="models.length === 0" class="no-models">
                暂无3D模型数据
              </div>
              <div v-for="model in models" :key="model.id" class="model-item thin-scrollbar"
                :class="{ 'model-selected': selectedModelId === model.id }" @click="selectedModelId = model.id">
                <div class="model-header">
                  <span class="model-name">{{ model.name || '未命名模型' }}</span>
                  <span class="model-type">类型: {{ model.type }}</span>
                </div>
                <div class="model-id">
                  ID: {{ safeSlice(model.id) }}
                </div>
                <div class="model-actions">
                  <button @click.stop="selectedModelId = model.id; flyToSelectedModel()">飞行到此模型</button>
                  <button @click.stop="removeModel(model.id)">删除</button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
console.log(console.track());
import ScLayer from '@repo/components/ScLayer/index.vue';
import { ref, reactive, computed, onMounted, onBeforeUnmount, nextTick, watch } from 'vue';
import { MapType, MapTile } from '@repo/components/ScLayer/types/index';
import { DEFAULT_MAP_CONFIG } from '@repo/components/ScLayer/types';
import type { ShapeOption, Track, TrackPlayer } from '@repo/components/ScLayer/types';
import type { HeatmapPoint, HeatmapConfig } from '@repo/components/ScLayer/types';
import { ToolbarPosition, ToolbarDirection } from '@repo/components/ScLayer/types';
import type { WindConfig } from '@repo/components/ScLayer/types';
// 引入CesiumObject和模型类型定义
import type { Model3DOptions } from '@repo/components/ScLayer/composables/CesiumModelObject';

// 标记点聚合模式的枚举
const MarkerClusterMode = {
  CLUSTER: 'cluster',
  NONE: 'none'
};
// 引入飞线图类型定义
import type { FlightLinePoint, FlightLineConfig, FlightLineData } from '@repo/components/ScLayer/types';
// 引入Element Plus组件
import { ElMessage } from 'element-plus';

// 地图实例引用
const layerRef = ref(null);

// 3D模型相关状态
const is3DMode = ref(false);
const models = ref < { id: string; name: string; type: string }[] > ([]);
const selectedModelId = ref < string | null > (null);
const viewMode = ref < '2D' | '3D' | '2.5D' > ('3D');

// 热力图相关
const heatmapPoints = ref < Array < HeatmapPoint >> ([]);
const pointsVisible = ref(false);
// 添加当前选中的热力图记录
const selectedHeatmapPoint = ref < string | null > (null);
// 热力图性能模式
const heatmapPerformanceMode = ref(false);

// 飞线图相关
const flightLinePoints = ref < Array < FlightLinePoint >> ([]);
const flightLineConfig = ref < FlightLineConfig > ({
  curveness: 0.2,        // 曲度调整为0.2，与sakitam示例一致
  width: 1,              // 线宽调整为1
  showEffect: true,      // 显示效果
  showNodes: true,       // 显示节点
  color: '#a6c84c',      // 使用sakitam示例中的颜色
  opacity: 0.5,          // 透明度调整为0.5
  effectPeriod: 6,       // 效果周期调整为6
  effectTrailLength: 0,  // 效果轨迹长度调整为0.7
  effectSymbolSize: 18,  // 动画效果大小设为8
  nodeSymbolSize: 3,     // 节点大小从8减小到3
  effectSymbol: 'plane', // 效果符号改为arrow
  visible: true,         // 可见性
  nodeColor: '#ddb926',  // 节点颜色
  nodeEffect: true,      // 节点效果
  zIndex: 90,            // 层级
  hideOnMoving: false,   // 移动时不隐藏
  hideOnZooming: false,  // 缩放时不隐藏
  enablePerformanceMode: false // 关闭性能模式以确保显示
});

// 飞线图相关状态
const flightLineActive = ref(false);

// 飞线图列表数据 - 修改为单选模式
const flightLines = ref < Array < FlightLineData & { id: string } >> ([]);
const selectedFlightLine = ref < string | null > (null);

// 创建一个Shape枚举常量
const ShapeType = {
  POINT: 'Point',
  LINE: 'LineString',
  POLYGON: 'Polygon',
  CIRCLE: 'Circle',
  RECTANGLE: 'Rectangle',
  SQUARE: 'Square'
};

// 图层类型选择（UI展示用）
const tileType = ref('normal');

// 地图配置
const config = reactive({
  height: 600,
  mapType: MapType.GAODE,
  mapTile: MapTile.NORMAL,
  map: DEFAULT_MAP_CONFIG,
  center: [39.909186, 116.397411] as [number, number],
  zoom: 10,
  dragging: true,
  scrollWheelZoom: true,
  showToolbar: true,
  showScaleLine: true,
  mapKey: {} as Record<string, string>
});

// 标记点数据
const markers = ref < any[] > ([]);
const allMarkersVisible = ref(true);
const allLabelsVisible = ref(true);

// 标记点分组数据
const markerGroups = ref < { name: string, visible: boolean }[] > ([]);
// 当前选中的用于切换显示的分组索引
const currentGroupIndex = ref(0);

// 图形数据
const shapes = ref < ShapeOption[] > ([]);
const allShapesVisible = ref(true);

// 轨迹相关状态
const tracks = ref < { id: string; name: string; points: any[]; visible: boolean }[] > ([]);
const allTracksVisible = ref(true);
const hasTrack = ref(false);
const activeTrackId = ref < string | null > (null); // 当前选中的轨迹ID

// 轨迹播放配置
const trackPlaySpeed = ref(60);
const trackPlayLoop = ref(true);
const trackPlayWithCamera = ref(false);
const trackPlayShowNodes = ref(false);

// 计算可见标记点数量
const visibleMarkerCount = computed(() => {
  return markers.value.filter(marker => marker.visible).length;
});

// 事件日志
const logs = reactive([]);

// 安全地获取ID的后8位字符
function safeSlice(id: any): string {
  if (!id) return '无ID';
  return typeof id === 'string' ? id.slice(-8) : String(id);
}

// 添加日志
function addLog(type, message) {
  const now = new Date();
  const timeStr = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}:${now.getSeconds().toString().padStart(2, '0')}`;

  logs.unshift({
    time: timeStr,
    type: type,
    message: message
  });

  // 只保留最近10条日志
  if (logs.length > 10) {
    logs.pop();
  }
}

// 地图初始化完成回调
function onMapInit(mapInstance) {
  addLog('初始化', '地图加载完成');
  console.log('地图实例:', mapInstance);

  // 添加一个中心标记点
  addCenterMarker();

  // 更新图形列表
  updateShapeList();

  // 更新图层类型显示
  updateLayerTypeDisplay();

  // 移除编辑按钮
  if (layerRef.value) {
    const toolbarManager = layerRef.value.getToolbarManager();
    if (toolbarManager) {
      // 从工具栏中移除编辑按钮
      toolbarManager.removeTool('edit-shape');
      addLog('工具栏', '已移除编辑按钮');
    }
  }

  // 初始化时添加默认热力图并选择第一条记录
  setTimeout(() => {
    addRandomHeatmapPoints(10);
    // 选中第一条热力点
    selectFirstHeatmapPoint();
  }, 500);
}

/**
 * 选中第一条热力点
 */
const selectFirstHeatmapPoint = () => {
  if (heatmapPoints.value.length > 0) {
    const firstPoint = heatmapPoints.value[0];
    if (firstPoint && firstPoint.id) {
      selectedHeatmapPoint.value = firstPoint.id;
      addLog('热力图', `已选中热力点: ${firstPoint.name || '未命名'}`);
    }
  }
};

/**
 * 选择热力点
 */
const selectHeatmapPoint = (id: string) => {
  selectedHeatmapPoint.value = id;
  const point = heatmapPoints.value.find(p => p.id === id);
  if (point) {
    addLog('热力图', `已选中热力点: ${point.name || '未命名'}`);
  }
};

// 地图点击事件
function onMapClick(evt) {
  const coordinates = evt.coordinates;
  addLog('点击', `地图坐标: [${coordinates[0].toFixed(4)}, ${coordinates[1].toFixed(4)}]`);
}

// 标记点击事件
function onMarkerClick(evt) {
  const data = evt.data;
  const markerId = data?.id;
  addLog('点击', `标记点: ${data.title || '未命名'} [ID: ${safeSlice(markerId)}]`);
}

// 添加中心标记点
function addCenterMarker() {
  if (!layerRef.value) return;

  const centerLon = config.center[1];
  const centerLat = config.center[0];

  const markerId = layerRef.value.addMarker({
    id: 'center-marker',
    position: [centerLon, centerLat],
    title: '中心点',
    clickable: true,
    usePopover: true,
    data: { type: 'center', importance: 'high' },
    template: '<div><h3>{{title}}</h3><p>这是地图中心点</p></div>',
    style: {
      scale: 1.2,
      textColor: '#f00',
      textFont: 'bold 14px Arial'
    }
  });

  // 更新标记点列表
  updateMarkerList();
  addLog('操作', '已添加中心标记点');
}

// 添加随机标记点
function addRandomMarkers(count) {
  if (!layerRef.value) return;

  const centerLon = config.center[1];
  const centerLat = config.center[0];

  // 可用的图标类型
  const iconTypes = ['url', 'svg', 'base64', 'default'];
  // 一些预定义的随机URL图标
  const iconUrls = [
    'https://a.amap.com/jsapi_demos/static/demo-center/icons/poi-marker-1.png',
    'https://a.amap.com/jsapi_demos/static/demo-center/icons/poi-marker-2.png',
    'https://a.amap.com/jsapi_demos/static/demo-center/icons/poi-marker-3.png',
    'https://a.amap.com/jsapi_demos/static/demo-center/icons/poi-marker-default.png'
  ];
  // 随机颜色
  const colors = ['#1890ff', '#52c41a', '#faad14', '#722ed1', '#eb2f96', '#fa541c'];
  // 随机分组
  const groups = ['景点', '餐厅', '交通', '购物', null]; // null表示不分组

  for (let i = 0; i < count; i++) {
    const offsetLon = (Math.random() - 0.5) * 0.1;
    const offsetLat = (Math.random() - 0.5) * 0.1;

    const lon = centerLon + offsetLon;
    const lat = centerLat + offsetLat;

    const id = `marker-${Date.now()}-${i}`;
    const usePopover = Math.random() > 0.5; // 随机决定是否使用popover

    // 随机选择一个图标类型
    const iconType = iconTypes[Math.floor(Math.random() * iconTypes.length)];
    // 随机选择一个颜色
    const color = colors[Math.floor(Math.random() * colors.length)];
    // 随机选择一个分组
    const group = groups[Math.floor(Math.random() * groups.length)];

    // 准备图标
    let icon;
    // 创建SVG图标
    const iconSvg = `<svg width="24" height="36" viewBox="0 0 24 36" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M12 0C28 0 24 24 12 36C0 24 -4 0 12 0Z" fill="${color}"/><circle cx="12" cy="12" r="6" fill="white"/></svg>`;

    // 根据不同图标类型准备图标内容
    switch (iconType) {
      case 'svg':
        // 直接传递SVG字符串
        icon = iconSvg;
        break;
      case 'url':
        // 使用URL图标
        icon = iconUrls[Math.floor(Math.random() * iconUrls.length)];
        break;
      case 'base64':
        // 使用base64编码的图标
        icon = 'data:image/svg+xml;base64,' + btoa(iconSvg);
        break;
      case 'default':
      default:
        // 默认图标
        icon = iconSvg;
        break;
    }

    layerRef.value.addMarker({
      id,
      position: [lon, lat],
      title: `标记 ${i + 1} (${iconType})${group ? ' - ' + group : ''}`,
      icon: icon,
      iconType: iconType,
      clickable: true,
      usePopover: usePopover,
      group: group, // 设置分组属性
      data: { type: 'random', index: i }
    });
  }

  // 更新标记点列表
  updateMarkerList();
  // 更新分组列表
  updateMarkerGroups();

  addLog('操作', `已添加 ${count} 个随机标记点 (不同图标类型${count > 1 ? '和分组' : ''})`);
}

// 添加彩色标记点
function addColoredMarkers() {
  if (!layerRef.value) return;

  const centerLon = config.center[1];
  const centerLat = config.center[0];

  // 定义四个方向和颜色
  const directions = [
    { name: '东', offset: [0.05, 0], color: '#1890ff', usePopover: true, iconType: 'svg' },
    { name: '南', offset: [0, -0.05], color: '#52c41a', usePopover: false, iconType: 'url' },
    { name: '西', offset: [-0.05, 0], color: '#faad14', usePopover: true, iconType: 'base64' },
    { name: '北', offset: [0, 0.05], color: '#722ed1', usePopover: false, iconType: 'default' }
  ];

  directions.forEach((dir, index) => {
    const id = `direction-${dir.name}-marker`;
    const lon = centerLon + dir.offset[0];
    const lat = centerLat + dir.offset[1];

    // 创建SVG图标
    const iconSvg = `<svg width="24" height="36" viewBox="0 0 24 36" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M12 0C28 0 24 24 12 36C0 24 -4 0 12 0Z" fill="${dir.color}"/><circle cx="12" cy="12" r="6" fill="white"/></svg>`;

    // 根据不同图标类型准备图标内容
    let icon;
    switch (dir.iconType) {
      case 'svg':
        // 直接传递SVG字符串
        icon = iconSvg;
        break;
      case 'url':
        // 使用URL图标
        icon = 'https://a.amap.com/jsapi_demos/static/demo-center/icons/poi-marker-' + (index + 1) + '.png';
        break;
      case 'base64':
        // 使用base64编码的图标
        icon = 'data:image/svg+xml;base64,' + btoa(iconSvg);
        break;
      case 'default':
      default:
        // 默认使用SVG作为内容
        icon = iconSvg;
        break;
    }

    layerRef.value.addMarker({
      id,
      position: [lon, lat],
      title: `${dir.name}方向 (${dir.iconType})`,
      icon: icon,
      iconType: dir.iconType,
      clickable: true,
      usePopover: dir.usePopover,
      data: { type: 'direction', name: dir.name },
      style: {
        scale: 1,
        textColor: dir.color
      }
    });
  });

  // 更新标记点列表
  updateMarkerList();
  addLog('操作', '已添加四个方向彩色标记点 (不同图标类型)');
}

// 添加聚合标记点
function addClusterMarkers() {
  if (!layerRef.value) return;

  const centerLon = config.center[1];
  const centerLat = config.center[0];

  // 添加10个聚合标记点
  for (let i = 0; i < 10; i++) {
    // 随机生成坐标 (较近的范围以便聚合)
    const offsetLon = (Math.random() - 0.5) * 0.02;
    const offsetLat = (Math.random() - 0.5) * 0.02;

    const lon = centerLon + offsetLon;
    const lat = centerLat + offsetLat;

    // 随机生成ID
    const id = `cluster-${Date.now()}-${i}`;

    // 添加标记点
    layerRef.value.addMarker({
      id,
      position: [lon, lat],
      title: `聚合点 ${i + 1}`,
      clickable: true,
      clusterMode: MARKER_CLUSTER_MODE.CLUSTER,
      data: { type: 'cluster', index: i }
    });
  }

  // 更新标记点列表
  updateMarkerList();
  addLog('操作', '已添加10个聚合标记点');
}

// 添加Photo样式标记点
function addPhotoMarkers() {
  if (!layerRef.value) return;

  const centerLon = config.center[1];
  const centerLat = config.center[0];

  // 远程图片URL列表
  const photoUrls = [
    'https://a.amap.com/jsapi_demos/static/demo-center/icons/poi-marker-1.png',
    'https://a.amap.com/jsapi_demos/static/demo-center/icons/poi-marker-2.png',
    'https://a.amap.com/jsapi_demos/static/demo-center/icons/poi-marker-3.png',
    'https://a.amap.com/jsapi_demos/static/demo-center/icons/poi-marker-default.png',
    'https://openlayers.org/en/latest/examples/data/icon.png'
  ];

  // 不同的Photo样式形状
  const photoStyles = [
    { kind: 'circle', name: '圆形' },
    { kind: 'square', name: '方形' },
    { kind: 'shield', name: '盾牌形' },
    { kind: 'anchor', name: '锚形' },
    { kind: 'folio', name: '文件形' }
  ];

  // 创建不同形状的Photo样式标记点
  photoStyles.forEach((style, i) => {
    // 计算水平放置的位置
    const offsetLon = (i - 2) * 0.01;
    const offsetLat = 0.005;

    const lon = centerLon + offsetLon;
    const lat = centerLat + offsetLat;

    const photoUrl = photoUrls[i % photoUrls.length];
    const id = `photo-marker-${style.kind}-${Date.now()}`;

    // 添加标记点，使用URL图标，并配置Photo样式
    layerRef.value.addMarker({
      id,
      position: [lon, lat],
      title: `${style.name}图片标记`,
      icon: photoUrl,
      iconType: 'url', // 关键：使用url类型，才会启用Photo样式
      clickable: true,
      usePopover: true,
      showPopover: true,
      data: {
        type: 'photo',
        photoKind: style.kind,
        photoStroke: 2,
        photoStrokeColor: '#ffffff',
        photoShadow: true,
        photoShadowBlur: 7,
        photoShadowColor: 'rgba(0,0,0,0.5)',
        photoCrop: true,
        photoBackground: 'rgba(200,200,200,0.2)'
      }
    });
  });

  // 额外添加一个自定义样式的Photo标记点
  const customPhotoId = `photo-marker-custom-${Date.now()}`;
  layerRef.value.addMarker({
    id: customPhotoId,
    position: [centerLon, centerLat - 0.01],
    title: '自定义Photo样式',
    icon: 'https://openlayers.org/en/latest/examples/data/icon.png',
    iconType: 'url',
    clickable: true,
    usePopover: true,
    showPopover: true,
    data: {
      type: 'photo',
      photoKind: 'circle',
      photoStroke: 3,
      photoStrokeColor: '#ff5500',
      photoShadow: true,
      photoShadowBlur: 10,
      photoShadowColor: 'rgba(255,85,0,0.7)',
      photoCrop: true,
      photoBackground: 'rgba(255,240,200,0.3)'
    }
  });

  // 更新标记点列表
  updateMarkerList();
  addLog('操作', '已添加Photo样式图片标记点，使用ol-ext渲染远程URL图标');
}

// 清除所有标记
function clearAllMarkers() {
  if (!layerRef.value) return;

  layerRef.value.clearMarkers();

  // 更新标记点列表
  updateMarkerList();
  addLog('操作', '已清除所有标记点');
}

// 切换所有标记点的可见性
function toggleAllMarkers() {
  if (!layerRef.value) return;

  if (allMarkersVisible.value) {
    // 如果当前标记点可见，则隐藏所有
    layerRef.value.hideAllMarkers();
    allMarkersVisible.value = false;
    addLog('操作', '已隐藏所有标记点');
  } else {
    // 如果当前标记点隐藏，则显示所有
    layerRef.value.showAllMarkers();
    allMarkersVisible.value = true;
    addLog('操作', '已显示所有标记点');
  }

  // 更新标记点列表
  updateMarkerList();
}

// 切换所有标记点标签的可见性
function toggleAllLabels() {
  if (!layerRef.value) return;

  if (allLabelsVisible.value) {
    // 如果当前标签可见，则隐藏所有
    layerRef.value.hideAllLabels();
    allLabelsVisible.value = false;
    addLog('操作', '已隐藏所有标记点标签');
  } else {
    // 如果当前标签隐藏，则显示所有
    layerRef.value.showAllLabels();
    allLabelsVisible.value = true;
    addLog('操作', '已显示所有标记点标签');
  }
}

// 切换标记点可见性
function toggleMarkerVisibility(marker: any) {
  if (!layerRef.value) return;

  if (marker.visible) {
    layerRef.value.hideMarker(marker.id);
    addLog('操作', `已隐藏标记点: ${safeSlice(marker.id)}`);
  } else {
    layerRef.value.showMarker(marker.id);
    addLog('操作', `已显示标记点: ${safeSlice(marker.id)}`);
  }

  // 更新标记点列表
  updateMarkerList();
}

// 切换标记点Popover显示状态
function toggleMarkerPopover(marker: any) {
  if (!layerRef.value) return;

  const showPopover = !marker.showPopover;
  layerRef.value.updateMarker(marker.id, {
    showPopover: showPopover
  });

  // 更新标记点列表
  updateMarkerList();
  addLog('操作', `已${showPopover ? '显示' : '隐藏'}标记点 ${safeSlice(marker.id)} 的Popover`);
}

// 移动标记点
function moveMarker(marker: any) {
  if (!layerRef.value) return;

  // 随机移动一点距离
  const lon = marker.position[0] + (Math.random() - 0.5) * 0.01;
  const lat = marker.position[1] + (Math.random() - 0.5) * 0.01;

  layerRef.value.updateMarker(marker.id, {
    position: [lon, lat]
  });

  // 更新标记点列表
  updateMarkerList();
  addLog('操作', `已移动标记点: ${safeSlice(marker.id)}`);
}

// 删除标记点
function removeMarker(marker: any) {
  if (!layerRef.value) return;

  layerRef.value.removeMarker(marker.id);

  // 更新标记点列表
  updateMarkerList();
  addLog('操作', `已删除标记点: ${safeSlice(marker.id)}`);
}

// 更新标记点列表
function updateMarkerList() {
  if (!layerRef.value) return;

  const allMarkers = layerRef.value.getAllMarkers() || [];
  markers.value = allMarkers;

  // 更新全局标记点可见状态
  allMarkersVisible.value = allMarkers.filter(m => m.visible).length > 0;

  // 更新分组列表
  updateMarkerGroups();
}

// 处理地图类型变更
function handleMapTypeChange() {
  if (!layerRef.value) return;

  layerRef.value.changeMapLayer(config.mapType, config.mapTile);

  // 更新图层类型显示
  updateLayerTypeDisplay();

  addLog('操作', `切换地图类型为: ${config.mapType}`);
}

// 处理图层类型变更
function handleLayerTypeChange() {
  if (!layerRef.value) return;

  // 转换图层类型
  switch (tileType.value) {
    case 'normal':
      config.mapTile = MapTile.NORMAL;
      break;
    case 'satellite':
      config.mapTile = MapTile.SATELLITE;
      break;
    case 'hybrid':
      config.mapTile = MapTile.HYBRID;
      break;
    default:
      config.mapTile = MapTile.NORMAL;
  }

  // 切换地图图层
  layerRef.value.changeMapLayer(config.mapType, config.mapTile);

  addLog('操作', `切换图层类型为: ${getMapTileName(config.mapTile)}`);
}

// 处理缩放级别变更
function handleZoomChange() {
  if (!layerRef.value) return;

  // 设置缩放
  layerRef.value.getMapObject().setZoom(config.zoom);
  addLog('操作', `设置缩放级别为: ${config.zoom}`);
}

// 处理交互控制变更
function handleInteractionChange() {
  if (!layerRef.value) return;

  addLog('用户交互', `地图交互状态变更: 拖动=${config.dragging}, 滚轮缩放=${config.scrollWheelZoom}`);

  layerRef.value.setInteractions({
    dragging: config.dragging,
    scrollWheelZoom: config.scrollWheelZoom
  });
}

// 处理比例尺显示变化
function handleScaleLineChange() {
  if (!layerRef.value) return;

  addLog('比例尺', `比例尺显示状态: ${config.showScaleLine ? '显示' : '隐藏'}`);

  // 注意：由于使用props传递，配置变更会自动更新，不需要额外调用方法
}

// 添加默认显示Popover标记
function addPopoverMarker() {
  if (!layerRef.value) return;

  const centerLon = config.center[1];
  const centerLat = config.center[0];

  const markerId = layerRef.value.addMarker({
    id: 'pop-marker',
    position: [centerLon, centerLat],
    title: 'Popover标记',
    clickable: true,
    usePopover: true,
    showPopover: true,
    data: { type: 'pop', importance: 'high' },
    template: '<div><h3>{{title}}</h3><p>这是默认显示Popover的标记</p></div>',
    style: {
      scale: 1.2,
      textColor: '#f00',
      textFont: 'bold 14px Arial'
    }
  });

  // 更新标记点列表
  updateMarkerList();
  addLog('操作', '已添加默认显示Popover的标记');
}

// 添加带模板的标记点
function addTemplateMarker() {
  if (!layerRef.value) return;

  const centerLon = config.center[1];
  const centerLat = config.center[0];

  // 向右侧偏移位置
  const lon = centerLon + 0.005;
  const lat = centerLat;

  const markerId = layerRef.value.addMarker({
    id: 'template-marker',
    position: [lon, lat],
    title: '带模板标记',
    clickable: true,
    usePopover: false,
    data: { type: 'template', importance: 'high' },
    template: '<div><h3>{{title}}</h3><p>这是带模板的标记</p></div>',
    style: {
      scale: 1.2,
      textColor: '#f00',
      textFont: 'bold 14px Arial'
    }
  });

  // 更新标记点列表
  updateMarkerList();
  addLog('操作', '已添加带模板的标记点，点击时不会显示popover');
}

// 添加无模板的标记点
function addNoTemplateMarker() {
  if (!layerRef.value) return;

  const centerLon = config.center[1];
  const centerLat = config.center[0];

  // 向左侧偏移位置
  const lon = centerLon - 0.005;
  const lat = centerLat;

  const markerId = layerRef.value.addMarker({
    id: 'no-template-marker',
    position: [lon, lat],
    title: '无模板标记',
    clickable: true,
    usePopover: true,
    data: { type: 'no-template', importance: 'high' },
    style: {
      scale: 1.2,
      textColor: '#00a',
      textFont: 'bold 14px Arial'
    }
  });

  // 更新标记点列表
  updateMarkerList();
  addLog('操作', '已添加无模板的标记点，将在点击时显示popover');
}

// 添加正方形图形
function addSquareShape() {
  if (!layerRef.value) return;

  const centerLon = config.center[1];
  const centerLat = config.center[0];

  // 创建一个正方形，边长为500米
  const id = layerRef.value.addSquare(
    [centerLon, centerLat],
    500,
    {
      id: `square-${Date.now()}`,
      style: {
        fill: { color: 'rgba(255, 165, 0, 0.3)' },
        stroke: { color: 'orange', width: 3 }
      },
      data: { type: 'square', createdAt: new Date().toISOString() }
    }
  );

  addLog('操作', `已添加正方形图形，ID: ${id}`);
}

// 添加圆形图形
function addCircleShape() {
  if (!layerRef.value) return;

  const centerLon = config.center[1];
  const centerLat = config.center[0];

  // 向右上角偏移位置
  const lon = centerLon + 0.01;
  const lat = centerLat + 0.01;

  // 创建一个圆，半径为300米
  const id = layerRef.value.addCircle(
    [lon, lat],
    300,
    {
      id: `circle-${Date.now()}`,
      style: {
        fill: { color: 'rgba(24, 144, 255, 0.3)' },
        stroke: { color: '#1890ff', width: 2 }
      },
      data: { type: 'circle', createdAt: new Date().toISOString() }
    }
  );

  addLog('操作', `已添加圆形图形，ID: ${id}`);
}

// 添加矩形图形
function addRectangleShape() {
  if (!layerRef.value) return;

  const centerLon = config.center[1];
  const centerLat = config.center[0];

  // 向左下角偏移
  const minLon = centerLon - 0.02;
  const minLat = centerLat - 0.02;
  const maxLon = centerLon - 0.005;
  const maxLat = centerLat - 0.005;

  // 创建一个矩形
  const id = layerRef.value.addRectangle(
    [minLon, minLat],
    [maxLon, maxLat],
    {
      id: `rectangle-${Date.now()}`,
      style: {
        fill: { color: 'rgba(82, 196, 26, 0.3)' },
        stroke: { color: '#52c41a', width: 2, lineDash: [5, 5] }
      },
      data: { type: 'rectangle', createdAt: new Date().toISOString() }
    }
  );

  addLog('操作', `已添加矩形图形，ID: ${id}`);
}

// 添加多边形图形
function addPolygonShape() {
  if (!layerRef.value) return;

  const centerLon = config.center[1];
  const centerLat = config.center[0];

  // 构建三角形的三个顶点
  const coordinates = [
    [centerLon + 0.02, centerLat],
    [centerLon + 0.01, centerLat + 0.015],
    [centerLon + 0.03, centerLat + 0.015],
  ];

  // 创建一个多边形（三角形）
  const id = layerRef.value.addPolygon(
    coordinates,
    {
      id: `polygon-${Date.now()}`,
      style: {
        fill: { color: 'rgba(245, 34, 45, 0.3)' },
        stroke: { color: '#f5222d', width: 2 }
      },
      data: { type: 'polygon', createdAt: new Date().toISOString() }
    }
  );

  addLog('操作', `已添加多边形图形（三角形），ID: ${id}`);
}

// 添加线段图形
function addLineShape() {
  if (!layerRef.value) return;

  const centerLon = config.center[1];
  const centerLat = config.center[0];

  // 创建一条线的坐标
  const coordinates = [
    [centerLon - 0.02, centerLat + 0.02],
    [centerLon, centerLat + 0.03],
    [centerLon + 0.02, centerLat + 0.02]
  ];

  // 创建一条线
  const id = layerRef.value.addLine(
    coordinates,
    {
      id: `line-${Date.now()}`,
      style: {
        stroke: { color: '#722ed1', width: 4, lineDash: [10, 5] }
      },
      data: { type: 'line', createdAt: new Date().toISOString() }
    }
  );

  addLog('操作', `已添加线段图形，ID: ${id}`);
}

// 添加点图形
function addPointShape() {
  if (!layerRef.value) return;

  const centerLon = config.center[1];
  const centerLat = config.center[0];

  // 向上方偏移位置
  const lon = centerLon;
  const lat = centerLat + 0.02;

  // 创建一个点
  const id = layerRef.value.addPoint(
    [lon, lat],
    {
      id: `point-${Date.now()}`,
      style: {
        fill: { color: 'rgba(255, 0, 0, 0.8)' },
        stroke: { color: '#ffffff', width: 2 },
        radius: 8, // 点的半径
        zIndex: 10 // 置于其他图形之上
      },
      data: { type: 'point', createdAt: new Date().toISOString() }
    }
  );

  // 更新图形列表
  updateShapeList();
  addLog('操作', `已添加点图形，ID: ${id}`);
}

// 添加复合图形示例
function addCustomShapeExample() {
  if (!layerRef.value) return;

  const centerLon = config.center[1];
  const centerLat = config.center[0];

  // 创建一个正方形作为基础
  const squareId = layerRef.value.addSquare(
    [centerLon, centerLat],
    600,
    {
      id: `complex-base-${Date.now()}`,
      style: {
        fill: { color: 'rgba(230, 230, 230, 0.5)' },
        stroke: { color: '#333333', width: 2 }
      },
      data: { type: 'complex-base', part: 'base' }
    }
  );

  // 在四个角添加圆形
  const radius = 100;
  const offset = 300 * 0.7; // 正方形的一半乘以0.7，使圆在角落位置

  // 右上角圆形
  layerRef.value.addCircle(
    [centerLon + offset / 111000, centerLat + offset / 111000],
    radius,
    {
      id: `complex-circle-ne-${Date.now()}`,
      style: {
        fill: { color: 'rgba(24, 144, 255, 0.6)' },
        stroke: { color: '#1890ff', width: 2 }
      },
      data: { type: 'complex-part', part: 'northeast' }
    }
  );

  // 左上角圆形
  layerRef.value.addCircle(
    [centerLon - offset / 111000, centerLat + offset / 111000],
    radius,
    {
      id: `complex-circle-nw-${Date.now()}`,
      style: {
        fill: { color: 'rgba(82, 196, 26, 0.6)' },
        stroke: { color: '#52c41a', width: 2 }
      },
      data: { type: 'complex-part', part: 'northwest' }
    }
  );

  // 左下角圆形
  layerRef.value.addCircle(
    [centerLon - offset / 111000, centerLat - offset / 111000],
    radius,
    {
      id: `complex-circle-sw-${Date.now()}`,
      style: {
        fill: { color: 'rgba(250, 173, 20, 0.6)' },
        stroke: { color: '#faad14', width: 2 }
      },
      data: { type: 'complex-part', part: 'southwest' }
    }
  );

  // 右下角圆形
  layerRef.value.addCircle(
    [centerLon + offset / 111000, centerLat - offset / 111000],
    radius,
    {
      id: `complex-circle-se-${Date.now()}`,
      style: {
        fill: { color: 'rgba(245, 34, 45, 0.6)' },
        stroke: { color: '#f5222d', width: 2 }
      },
      data: { type: 'complex-part', part: 'southeast' }
    }
  );

  // 添加中心点
  layerRef.value.addPoint(
    [centerLon, centerLat],
    {
      id: `complex-center-${Date.now()}`,
      style: {
        fill: { color: 'rgba(0, 0, 0, 0.8)' },
        stroke: { color: '#ffffff', width: 2 },
        radius: 10
      },
      data: { type: 'complex-part', part: 'center' }
    }
  );

  // 更新图形列表
  updateShapeList();
  addLog('操作', '已添加复合图形示例');
}

// 清除所有图形
function clearAllShapes() {
  if (!layerRef.value) return;

  layerRef.value.clearAllShapes();
  addLog('操作', '已清除所有图形');
}

// 切换所有图形的可见性
function toggleShapeVisible() {
  if (!layerRef.value || !layerRef.value.getShapeObject) return;

  const shapeObj = layerRef.value.getShapeObject();
  if (!shapeObj) return;

  if (allShapesVisible.value) {
    // 隐藏所有图形
    shapes.value.forEach(shape => {
      if (shape.id) {
        layerRef.value.updateShape(shape.id, { visible: false });
      }
    });
    allShapesVisible.value = false;
    addLog('操作', '已隐藏所有图形');
  } else {
    // 显示所有图形
    shapes.value.forEach(shape => {
      if (shape.id) {
        layerRef.value.updateShape(shape.id, { visible: true });
      }
    });
    allShapesVisible.value = true;
    addLog('操作', '已显示所有图形');
  }

  // 更新图形列表
  updateShapeList();
}

// 随机修改一个图形的样式
function modifyRandomShape() {
  if (!layerRef.value || shapes.value.length === 0) return;

  // 随机选择一个图形
  const randomIndex = Math.floor(Math.random() * shapes.value.length);
  const shape = shapes.value[randomIndex];

  if (!shape || !shape.id) {
    addLog('操作', '没有可修改的图形');
    return;
  }

  // 生成随机颜色
  const randomColor = `rgba(${Math.floor(Math.random() * 255)}, ${Math.floor(Math.random() * 255)}, ${Math.floor(Math.random() * 255)}, 0.5)`;
  const randomStrokeColor = `#${Math.floor(Math.random() * 16777215).toString(16).padStart(6, '0')}`;

  // 修改图形样式
  layerRef.value.updateShape(shape.id, {
    style: {
      fill: { color: randomColor },
      stroke: { color: randomStrokeColor, width: Math.floor(Math.random() * 5) + 1 }
    }
  });

  // 更新图形列表
  updateShapeList();
  addLog('操作', `已随机修改图形样式，ID: ${safeSlice(shape.id)}`);
}

// 更新图形列表
function updateShapeList() {
  if (!layerRef.value || !layerRef.value.getAllShapes) return;

  const allShapes = layerRef.value.getAllShapeDatas() || [];
  shapes.value = allShapes;
  // 检查图形可见性状态
  allShapesVisible.value = allShapes.length > 0 && allShapes.every(s => s.visible !== false);
}

// 获取图形类型名称
function getShapeTypeName(type: string): string {
  const typeNames = {
    [ShapeType.POINT]: '点',
    [ShapeType.LINE]: '线',
    [ShapeType.POLYGON]: '多边形',
    [ShapeType.CIRCLE]: '圆形',
    [ShapeType.RECTANGLE]: '矩形',
    [ShapeType.SQUARE]: '正方形'
  };

  return typeNames[type] || '未知类型';
}

// 切换图形可见性
function toggleShapeVisibility(shape: any) {
  if (!layerRef.value) return;

  const newVisible = shape.visible === false; // 如果当前是隐藏的，则显示

  layerRef.value.updateShape(shape.id, {
    visible: newVisible
  });

  // 更新图形列表
  updateShapeList();
  addLog('操作', `已${newVisible ? '显示' : '隐藏'}图形: ${safeSlice(shape.id)}`);
}

// 修改图形样式
function changeShapeStyle(shape: any) {
  if (!layerRef.value) return;

  // 根据图形类型生成不同的随机样式
  let style: any = {};

  // 随机颜色
  const randomFillColor = `rgba(${Math.floor(Math.random() * 255)}, ${Math.floor(Math.random() * 255)}, ${Math.floor(Math.random() * 255)}, 0.5)`;
  const randomStrokeColor = `#${Math.floor(Math.random() * 16777215).toString(16).padStart(6, '0')}`;

  // 基础样式
  style = {
    fill: { color: randomFillColor },
    stroke: { color: randomStrokeColor, width: Math.floor(Math.random() * 4) + 1 }
  };

  // 对于点类型，增加半径属性
  if (shape.type === ShapeType.POINT) {
    style.radius = Math.floor(Math.random() * 10) + 5;
  }

  // 应用样式变更
  layerRef.value.updateShape(shape.id, { style });

  // 更新图形列表
  updateShapeList();
  addLog('操作', `已修改图形样式: ${safeSlice(shape.id)}`);
}

// 删除图形
function removeShape(shape: any) {
  if (!layerRef.value) return;

  layerRef.value.removeShape(shape.id);

  // 更新图形列表
  updateShapeList();
  addLog('操作', `已删除图形: ${safeSlice(shape.id)}`);
}


// 更新显示的图层类型（根据配置中的实际值）
function updateLayerTypeDisplay() {
  // 根据 config.mapTile 设置 tileType 显示值
  switch (config.mapTile) {
    case MapTile.NORMAL:
      tileType.value = 'normal';
      break;
    case MapTile.SATELLITE:
      tileType.value = 'satellite';
      break;
    case MapTile.HYBRID:
      tileType.value = 'hybrid';
      break;
    default:
      tileType.value = 'normal';
  }
}

// 处理工具栏状态变更
function onToolbarStateChange(state) {
  const { toolId, active, toolType, data } = state;

  // 记录工具栏状态变化
  addLog('工具栏', `工具ID: ${toolId}, 激活状态: ${active}, 类型: ${toolType}`);

  // 检测图层面板关闭事件
  if (toolId === 'layer-switch' && !active) {
    addLog('图层', '图层选择面板已关闭');
    // 确保UI更新为最新的图层类型
    updateLayerTypeDisplay();
  }

  // 检测图层变更事件
  if (toolId === 'layer-change' && data) {
    addLog('图层', `图层已变更为: ${data.mapType} - ${data.mapTile}`);
    // 更新本地配置
    config.mapType = data.mapType;
    config.mapTile = data.mapTile;
    // 更新UI显示
    updateLayerTypeDisplay();
  }
}

// 切换到指定地图类型和图层类型
function switchToLayer(mapType: MapType, mapTile: MapTile) {
  if (!layerRef.value) return;

  // 更新本地配置
  config.mapType = mapType;
  config.mapTile = mapTile;

  // 切换地图图层
  layerRef.value.changeMapLayer(mapType, mapTile);

  // 更新UI显示
  updateLayerTypeDisplay();

  addLog('操作', `切换地图: ${mapType} - ${getMapTileName(mapTile)}`);
}

// 获取图层类型名称
function getMapTileName(mapTile: MapTile): string {
  switch (mapTile) {
    case MapTile.NORMAL:
      return '标准图层';
    case MapTile.SATELLITE:
      return '卫星图层';
    case MapTile.HYBRID:
      return '混合图层';
    default:
      return '未知图层';
  }
}

// 添加标记创建事件处理函数
function onMarkerCreate(evt) {
  const { id, options } = evt;
  const title = options.title || '未命名标记';
  addLog('创建', `标记点已创建: ${title} [ID: ${safeSlice(id)}]`);

  // 更新标记点列表
  updateMarkerList();
}

// 添加标记更新事件处理函数
function onMarkerUpdate(evt) {
  const { id, options } = evt;
  const position = options.position ? `[${options.position[0].toFixed(4)}, ${options.position[1].toFixed(4)}]` : '位置未变';
  addLog('更新', `标记点已更新: [ID: ${safeSlice(id)}] ${position}`);

  // 更新标记点列表
  updateMarkerList();
}

// 添加标记删除事件处理函数
function onMarkerDelete(evt) {
  const { id } = evt;
  addLog('删除', `标记点已删除: [ID: ${safeSlice(id)}]`);

  // 更新标记点列表
  updateMarkerList();
}

// 添加图形创建事件处理函数
function onShapeCreate(evt) {
  const { id, options } = evt;
  const type = getShapeTypeName(options.type);
  addLog('创建', `图形已创建: ${type} [ID: ${safeSlice(id)}]`);

  // 更新图形列表
  updateShapeList();
}

// 添加图形更新事件处理函数
function onShapeUpdate(evt) {
  const { id, options } = evt;
  addLog('更新', `图形已更新: [ID: ${safeSlice(id)}]`);

  // 更新图形列表
  updateShapeList();
}

// 添加图形删除事件处理函数
function onShapeDelete(evt) {
  const { id } = evt;
  addLog('删除', `图形已删除: [ID: ${safeSlice(id)}]`);

  // 更新图形列表
  updateShapeList();
}

// 添加示例轨迹
const addSampleTrack = () => {
  try {
    // 创建示例轨迹数据
    const center = config.center;
    const now = Math.floor(Date.now() / 1000);
    const points = [];
    // 生成一条简单的轨迹，沿着当前视图中心向东前进，距离不等间隔，时间倒序
    let lastTime = now;
    let lastLng = center[1];
    for (let i = 0; i < 20; i++) {
      // 距离不等间隔，模拟真实轨迹
      const offset = (i === 0) ? 0 : (Math.random() * 0.008 + 0.002); // 0.002~0.01
      lastLng += offset;
      // 时间递减，保证不会超过当前时间
      lastTime -= Math.floor(Math.random() * 80 + 40); // 每点间隔40~120秒
      points.push({
        lat: center[0],
        lng: lastLng,
        time: lastTime,
        dir: 90,
        title: `轨迹点 ${i + 1}`,
        iconUrl: i === 0 ? 'https://a.amap.com/jsapi_demos/static/demo-center/icons/poi-marker-1.png' : undefined,
        iconSize: [24, 24],
        info: [
          { key: '时间', value: new Date(lastTime * 1000).toLocaleTimeString() },
          { key: '速度', value: '45 km/h' },
          { key: '方向', value: '90°' }
        ]
      } as any);
    }
    // 按时间升序排列
    points.sort((a, b) => a.time - b.time);
    // 创建轨迹对象
    const track = {
      id: 'sample-track-' + Math.floor(Math.random() * 1000),
      name: '示例轨迹',
      points: points,
      color: '#FF5252',
      visible: true
    };
    // 添加轨迹
    if (layerRef.value) {
      layerRef.value.addTrack(track);
      tracks.value.push(track);
      hasTrack.value = true;
      addLog('info', `已添加示例轨迹，包含 ${points.length} 个点`);
    } else {
      addLog('error', '获取轨迹对象失败');
    }
  } catch (e) {
    addLog('error', `添加示例轨迹失败: ${e}`);
  }
};

// 添加复杂轨迹示例
const addComplexTrack = () => {
  try {
    // 获取地图中心点
    const center = config.center;
    const now = Math.floor(Date.now() / 1000);
    const points = [];

    // 定义复杂轨迹的关键点 - 包含多个转弯点
    const keyPoints = [
      { lat: center[0], lng: center[1], name: '起点', icon: 'https://a.amap.com/jsapi_demos/static/demo-center/icons/start.png' },
      { lat: center[0] + 0.02, lng: center[1] + 0.02, name: '转弯点1', icon: 'https://a.amap.com/jsapi_demos/static/demo-center/icons/poi-marker-1.png' },
      { lat: center[0] + 0.03, lng: center[1], name: '转弯点2', icon: 'https://a.amap.com/jsapi_demos/static/demo-center/icons/poi-marker-2.png' },
      { lat: center[0] + 0.01, lng: center[1] - 0.02, name: '转弯点3', icon: 'https://a.amap.com/jsapi_demos/static/demo-center/icons/poi-marker-3.png' },
      { lat: center[0] - 0.01, lng: center[1] - 0.03, name: '转弯点4', icon: 'https://a.amap.com/jsapi_demos/static/demo-center/icons/poi-marker-4.png' },
      { lat: center[0] - 0.02, lng: center[1] - 0.01, name: '转弯点5', icon: 'https://a.amap.com/jsapi_demos/static/demo-center/icons/warning.png' },
      { lat: center[0] - 0.01, lng: center[1] + 0.01, name: '终点', icon: 'https://a.amap.com/jsapi_demos/static/demo-center/icons/end.png' },
    ];

    // 为每个关键点之间插入中间点，使路径更平滑
    for (let i = 0; i < keyPoints.length - 1; i++) {
      const start = keyPoints[i];
      const end = keyPoints[i + 1];
      const steps = 8; // 每段关键点之间插入8个中间点

      for (let j = 0; j <= steps; j++) {
        const ratio = j / steps;
        const lat = start.lat + (end.lat - start.lat) * ratio;
        const lng = start.lng + (end.lng - start.lng) * ratio;

        // 计算方向（使用简单的角度计算）
        const direction = Math.atan2(end.lat - start.lat, end.lng - start.lng) * (180 / Math.PI);

        // 设置点位的时间，每点间隔30秒
        const time = now + (i * steps + j) * 30;

        // 创建轨迹点
        const point = {
          lat,
          lng,
          time,
          dir: direction,
          title: j === 0 ? start.name : (j === steps ? end.name : `路线点 ${points.length + 1}`),
          info: [
            { key: '时间', value: new Date(time * 1000).toLocaleTimeString() },
            { key: '类型', value: j === 0 ? '关键点' : '路线点' },
            { key: '方向', value: `${Math.round(direction)}°` }
          ]
        } as any; // 使用类型断言解决TypeScript类型问题

        // 为关键点添加自定义图标
        if (j === 0) {
          point.iconUrl = start.icon;
          point.iconSize = [32, 32]; // 关键点使用大一点的图标
        } else if (j === steps && i === keyPoints.length - 2) {
          // 最后一个点（终点）
          point.iconUrl = end.icon;
          point.iconSize = [32, 32];
        }

        points.push(point);
      }
    }

    // 时间升序排序
    points.sort((a, b) => a.time - b.time);

    // 创建轨迹对象
    const track = {
      id: 'complex-track-' + Math.floor(Math.random() * 1000),
      name: '复杂轨迹示例',
      points: points,
      color: '#1890FF', // 蓝色
      visible: true
    };

    // 添加轨迹
    if (layerRef.value) {
      layerRef.value.addTrack(track);
      tracks.value.push(track);
      hasTrack.value = true;
      addLog('info', `已添加复杂轨迹，包含 ${points.length} 个点，${keyPoints.length} 个关键点`);
    } else {
      addLog('error', '获取轨迹对象失败');
    }
  } catch (e) {
    addLog('error', `添加复杂轨迹失败: ${e}`);
  }
};

// 添加多条轨迹
const addMultipleTrack = () => {
  try {
    const center = config.center;
    const tracksToAdd = [];

    // 生成四条不同方向的轨迹
    const directions = ['north', 'east', 'south', 'west'];
    const colors = ['#FF5252', '#448AFF', '#66BB6A', '#FFC107'];

    for (let i = 0; i < directions.length; i++) {
      const direction = directions[i];
      const points = generateDirectionalTrack(center, direction, 0.05, 10);

      tracksToAdd.push({
        id: `track-${direction}-${Math.floor(Math.random() * 1000)}`,
        name: `${getDirectionName(direction)}向轨迹`,
        points: points,
        color: colors[i],
        visible: true
      });
    }

    // 添加所有轨迹
    if (layerRef.value) {
      let addedCount = 0;
      tracksToAdd.forEach(track => {
        try {
          layerRef.value.addTrack(track);
          tracks.value.push(track);
          addedCount++;
        } catch (e) {
          addLog('error', `添加轨迹 ${track.name} 失败: ${e}`);
        }
      });

      if (addedCount > 0) {
        hasTrack.value = true;
        addLog('info', `已添加 ${addedCount} 条轨迹`);
      } else {
        addLog('warn', '未能添加任何轨迹');
      }
    } else {
      addLog('error', '获取轨迹对象失败');
    }
  } catch (e) {
    addLog('error', `添加多条轨迹失败: ${e}`);
  }
};

// 添加环形轨迹
const addCircularTrack = () => {
  try {
    // 创建圆形轨迹数据
    const center = config.center;
    const now = Math.floor(Date.now() / 1000);
    const points = [];
    const radius = 0.02; // 半径
    const totalPoints = 36; // 点数量

    // 生成一个圆形轨迹
    for (let i = 0; i <= totalPoints; i++) {
      const angle = (i / totalPoints) * Math.PI * 2;
      const lat = center[0] + Math.sin(angle) * radius;
      const lng = center[1] + Math.cos(angle) * radius;

      // 计算方向角度（切线方向）
      const direction = (angle * (180 / Math.PI) + 90) % 360;

      points.push({
        lat,
        lng,
        time: now + i * 60, // 每分钟一个点
        dir: direction,
        title: `环形轨迹点 ${i + 1}`,
        info: [
          { key: '时间', value: new Date((now + i * 60) * 1000).toLocaleTimeString() },
          { key: '速度', value: '30 km/h' },
          { key: '方向', value: `${Math.round(direction)}°` }
        ]
      });
    }

    // 时间升序排序
    points.sort((a, b) => a.time - b.time);

    // 创建轨迹对象
    const track = {
      id: 'circular-track-' + Math.floor(Math.random() * 1000),
      name: '环形轨迹',
      points: points,
      color: '#9C27B0', // 紫色
      visible: true
    };

    // 添加轨迹
    if (layerRef.value) {
      layerRef.value.addTrack(track);
      tracks.value.push(track);
      hasTrack.value = true;
      addLog('info', `已添加环形轨迹，包含 ${points.length} 个点`);
    } else {
      addLog('error', '获取轨迹对象失败');
    }
  } catch (e) {
    addLog('error', `添加环形轨迹失败: ${e}`);
  }
};

// 添加Z字型轨迹
const addZigzagTrack = () => {
  try {
    // 生成Z字形轨迹
    const center = config.center;
    const now = Math.floor(Date.now() / 1000);
    const points = [];

    // Z字形的五个关键点
    const keyPoints = [
      { lat: center[0] - 0.02, lng: center[1] - 0.02 }, // 左上
      { lat: center[0] - 0.02, lng: center[1] + 0.02 }, // 右上
      { lat: center[0], lng: center[1] - 0.01 }, // 中间
      { lat: center[0] + 0.02, lng: center[1] - 0.02 }, // 左下
      { lat: center[0] + 0.02, lng: center[1] + 0.02 }, // 右下
    ];

    // 为每个关键点之间插入中间点
    for (let i = 0; i < keyPoints.length - 1; i++) {
      const start = keyPoints[i];
      const end = keyPoints[i + 1];
      const steps = 5; // 每段插入5个点

      for (let j = 0; j <= steps; j++) {
        const ratio = j / steps;
        const lat = start.lat + (end.lat - start.lat) * ratio;
        const lng = start.lng + (end.lng - start.lng) * ratio;

        // 计算方向（使用简单的角度计算）
        const direction = Math.atan2(end.lat - start.lat, end.lng - start.lng) * (180 / Math.PI);

        points.push({
          lat,
          lng,
          time: now + (i * steps + j) * 60, // 每分钟一个点
          dir: direction,
          title: `Z字形轨迹点 ${points.length + 1}`,
          info: [
            { key: '时间', value: new Date((now + (i * steps + j) * 60) * 1000).toLocaleTimeString() },
            { key: '速度', value: '40 km/h' },
            { key: '方向', value: `${Math.round(direction)}°` }
          ]
        });
      }
    }

    // 时间升序排序
    points.sort((a, b) => a.time - b.time);

    // 创建轨迹对象
    const track = {
      id: 'zigzag-track-' + Math.floor(Math.random() * 1000),
      name: 'Z字形轨迹',
      points: points,
      color: '#E74C3C', // 红色
      visible: true
    };

    // 添加轨迹
    if (layerRef.value) {
      layerRef.value.addTrack(track);
      tracks.value.push(track);
      hasTrack.value = true;
      addLog('info', `已添加Z字形轨迹，包含 ${points.length} 个点`);
    } else {
      addLog('error', '获取轨迹对象失败');
    }
  } catch (e) {
    addLog('error', `添加Z字形轨迹失败: ${e}`);
  }
};

// 清除所有轨迹
const clearAllTracks = () => {
  try {
    if (!hasTrack.value || tracks.value.length === 0) {
      addLog('warn', '没有轨迹可清除');
      return;
    }

    if (layerRef.value) {
      // 停止所有轨迹播放
      tracks.value.forEach(track => {
        try {
          layerRef.value.stopTrack(track.id);
        } catch (e) {
          // 忽略停止失败
        }
      });

      // 清除所有轨迹
      const success = layerRef.value.clearAllTracks();

      if (success) {
        tracks.value = [];
        hasTrack.value = false;

        // 停用轨迹播放器工具
        if (layerRef.value) {
          layerRef.value.deactivateTool('track-player');
        }

        addLog('info', '已清除所有轨迹');
      } else {
        addLog('error', '清除轨迹失败');
      }
    } else {
      addLog('error', '获取轨迹对象失败');
    }
  } catch (e) {
    addLog('error', `清除所有轨迹失败: ${e}`);
  }
};

// 切换所有轨迹的可见性
const toggleTrackVisible = () => {
  try {
    if (!hasTrack.value || tracks.value.length === 0) {
      addLog('warn', '没有轨迹可操作');
      return;
    }

    if (layerRef.value) {
      if (allTracksVisible.value) {
        // 隐藏所有轨迹
        layerRef.value.hideAllTracks();
        allTracksVisible.value = false;
        addLog('info', '已隐藏所有轨迹');
      } else {
        // 显示所有轨迹
        layerRef.value.showAllTracks();
        allTracksVisible.value = true;
        addLog('info', '已显示所有轨迹');
      }
    } else {
      addLog('error', '获取轨迹对象失败');
    }
  } catch (e) {
    addLog('error', `切换轨迹可见性失败: ${e}`);
  }
};

// 生成定向轨迹
const generateDirectionalTrack = (center: [number, number], direction: string, distance: number, points: number) => {
  const now = Math.floor(Date.now() / 1000);
  const interval = 60; // 每点间隔1分钟
  const result = [];

  // 每点之间的距离
  const step = distance / (points - 1);

  // 方向转换为度数
  let dirDegrees = 0;
  let latMultiplier = 0;
  let lngMultiplier = 0;

  switch (direction) {
    case 'north':
      dirDegrees = 0;
      latMultiplier = 1;
      lngMultiplier = 0;
      break;
    case 'east':
      dirDegrees = 90;
      latMultiplier = 0;
      lngMultiplier = 1;
      break;
    case 'south':
      dirDegrees = 180;
      latMultiplier = -1;
      lngMultiplier = 0;
      break;
    case 'west':
      dirDegrees = 270;
      latMultiplier = 0;
      lngMultiplier = -1;
      break;
  }

  // 生成轨迹点
  for (let i = 0; i < points; i++) {
    const lat = center[0] + latMultiplier * i * step;
    const lng = center[1] + lngMultiplier * i * step;

    result.push({
      lat,
      lng,
      time: now + i * interval,
      dir: dirDegrees,
      title: `${getDirectionName(direction)}向轨迹点 ${i + 1}`,
      info: [
        { key: '时间', value: new Date((now + i * interval) * 1000).toLocaleTimeString() },
        { key: '速度', value: '45 km/h' },
        { key: '方向', value: `${dirDegrees}°` }
      ]
    });
  }

  return result;
};

// 获取方向名称
const getDirectionName = (direction: string) => {
  switch (direction) {
    case 'north': return '北';
    case 'east': return '东';
    case 'south': return '南';
    case 'west': return '西';
    default: return direction;
  }
};



/**
 * 添加随机热力点
 * @param count 热力点数量
 */
const addRandomHeatmapPoints = (count) => {
  if (!layerRef.value) return;

  // 先启用热力图
  layerRef.value.enableHeatmap();

  // 获取地图中心点
  const center = config.center;
  const points = [];

  // 生成随机热力点
  for (let i = 0; i < count; i++) {
    // 生成随机经纬度偏移
    const latOffset = Math.random() * 0.1 - 0.05;
    const lngOffset = Math.random() * 0.1 - 0.05;

    const point = {
      longitude: center[1] + lngOffset,
      latitude: center[0] + latOffset,
      weight: 0.4 + Math.random() * 0.6, // 0.4 - 1.0之间的随机权重
      name: `热力点 ${i + 1}`,
      properties: {
        value: Math.floor(Math.random() * 100),
        type: '随机点'
      }
    };

    points.push(point);
  }

  // 批量添加热力点
  const ids = layerRef.value.addHeatmapPoints(points);
  const newPoints = points.map((p, i) => ({ ...p, id: ids[i] }));
  heatmapPoints.value = [...heatmapPoints.value, ...newPoints];

  // 如果没有选中的热力点，则选择第一个
  if (!selectedHeatmapPoint.value && newPoints.length > 0) {
    selectedHeatmapPoint.value = newPoints[0].id;
    addLog('热力图', `已选中热力点: ${newPoints[0].name}`);
  }

  addLog('热力图', `添加了${count}个随机热力点`);
};

/**
 * 添加聚类热力点
 */
const addClusteredHeatmapPoints = () => {
  if (!layerRef.value) return;

  // 先启用热力图
  layerRef.value.enableHeatmap();

  // 获取地图中心点
  const center = config.center;
  const clusters = 5; // 聚类数量
  const pointsPerCluster = 10; // 每个聚类的点数
  const points = [];

  // 生成聚类热力点
  for (let c = 0; c < clusters; c++) {
    // 聚类中心点
    const clusterCenterLat = center[0] + (Math.random() * 0.2 - 0.1);
    const clusterCenterLng = center[1] + (Math.random() * 0.2 - 0.1);

    for (let i = 0; i < pointsPerCluster; i++) {
      // 在聚类中心周围生成点
      const latOffset = Math.random() * 0.02 - 0.01;
      const lngOffset = Math.random() * 0.02 - 0.01;

      const point = {
        longitude: clusterCenterLng + lngOffset,
        latitude: clusterCenterLat + latOffset,
        weight: 0.6 + Math.random() * 0.4, // 0.6 - 1.0之间的随机权重
        name: `聚类 ${c + 1} 热力点 ${i + 1}`,
        properties: {
          cluster: c + 1,
          value: Math.floor(Math.random() * 100),
          type: '聚类点'
        }
      };

      points.push(point);
    }
  }

  // 批量添加热力点
  const ids = layerRef.value.addHeatmapPoints(points);
  heatmapPoints.value = [...heatmapPoints.value, ...points.map((p, i) => ({ ...p, id: ids[i] }))];

  addLog('热力图', `添加了${clusters}个聚类，共${clusters * pointsPerCluster}个热力点`);
};

/**
 * 添加权重热力点
 */
const addWeightedHeatmapPoints = () => {
  if (!layerRef.value) return;

  // 先启用热力图
  layerRef.value.enableHeatmap();

  // 获取地图中心点
  const center = config.center;
  const points = [];

  // 创建一个权重递增的线性分布
  for (let i = 0; i < 10; i++) {
    const weight = 0.1 + (i * 0.1); // 权重从0.1递增到1.0
    const latOffset = -0.05 + (i * 0.01);
    const lngOffset = 0;

    const point = {
      longitude: center[1] + lngOffset,
      latitude: center[0] + latOffset,
      weight: weight,
      name: `权重${weight.toFixed(1)}的点`,
      properties: {
        value: Math.round(weight * 100),
        type: '权重点'
      }
    };

    points.push(point);
  }

  // 批量添加热力点
  const ids = layerRef.value.addHeatmapPoints(points);
  heatmapPoints.value = [...heatmapPoints.value, ...points.map((p, i) => ({ ...p, id: ids[i] }))];

  addLog('热力图', '添加了10个权重递增的热力点');
};

/**
 * 清除热力图
 */
const clearHeatmap = () => {
  if (!layerRef.value) return;

  const result = layerRef.value.clearHeatmap();
  if (result) {
    heatmapPoints.value = [];
    addLog('热力图', '清除热力图点');
  }
};

/**
 * 配置热力图样式
 */
const configureHeatmap = () => {
  if (!layerRef.value) return;

  // 设置热力图配置
  const heatmapConfig = {
    radius: 20,                // 热力点半径
    blur: 15,                  // 模糊大小
    opacity: 0.8,              // 不透明度
    gradient: ['#0000ff', '#00ffff', '#00ff00', '#ffff00', '#ff0000'], // 渐变色
    showPoints: pointsVisible.value,  // 显示数据点
    pointRadius: 4,            // 点半径
    pointColor: 'rgba(0, 0, 255, 0.7)' // 点颜色
  };

  const result = layerRef.value.configureHeatmap(heatmapConfig);
  if (result) {
    addLog('热力图', '更新热力图配置');
  }
};

/**
 * 切换是否显示数据点
 */
const togglePointsVisible = () => {
  if (!layerRef.value) return;

  pointsVisible.value = !pointsVisible.value;

  // 更新热力图配置，切换数据点显示
  layerRef.value.configureHeatmap({
    showPoints: pointsVisible.value
  });

  addLog('热力图', pointsVisible.value ? '显示数据点' : '隐藏数据点');
};

/**
 * 添加密集热力点数据
 */
const addDenseHeatmapPoints = () => {
  if (!layerRef.value) return;

  // 先启用热力图
  layerRef.value.enableHeatmap();

  // 先更新热力图配置以适应密集数据展示
  layerRef.value.configureHeatmap({
    radius: 15,
    blur: 12,
    opacity: 0.85,
    gradient: ['#0000ff', '#00ffff', '#00ff00', '#ffff00', '#ff0000', '#ff00ff'],
  });

  // 获取地图中心点和边界
  const center = config.center;
  const points = [];
  const pointCount = 200; // 使用大量点以创建密集热力图

  // 生成多个热点区
  const hotspots = [
    { lat: center[0] - 0.02, lng: center[1] - 0.02 },
    { lat: center[0] + 0.02, lng: center[1] + 0.02 },
    { lat: center[0] - 0.03, lng: center[1] + 0.01 },
    { lat: center[0] + 0.01, lng: center[1] - 0.03 },
    { lat: center[0], lng: center[1] }
  ];

  // 为每个热点区域生成点
  for (let i = 0; i < pointCount; i++) {
    // 选择一个热点区域 (有80%概率选择热点区域，20%概率完全随机)
    let basePoint;
    if (Math.random() < 0.8) {
      const hotspotIndex = Math.floor(Math.random() * hotspots.length);
      basePoint = hotspots[hotspotIndex];
    } else {
      basePoint = { lat: center[0], lng: center[1] };
    }

    // 在热点周围生成随机偏移
    const latOffset = (Math.random() * 0.06 - 0.03) * (Math.random() < 0.7 ? 0.5 : 1);
    const lngOffset = (Math.random() * 0.06 - 0.03) * (Math.random() < 0.7 ? 0.5 : 1);

    // 根据距离热点中心的距离计算权重（越近权重越高）
    const distanceFromHotspot = Math.sqrt(latOffset * latOffset + lngOffset * lngOffset);
    const weight = Math.max(0.2, 1 - (distanceFromHotspot * 10));

    const point = {
      longitude: basePoint.lng + lngOffset,
      latitude: basePoint.lat + latOffset,
      weight: weight,
      name: `密集点 ${i + 1}`,
      properties: {
        value: Math.floor(weight * 100),
        type: '密集点',
        hotspot: basePoint === center ? "中心" : "热点区域"
      }
    };

    points.push(point);
  }

  // 批量添加热力点
  const ids = layerRef.value.addHeatmapPoints(points);
  const newPoints = points.map((p, i) => ({ ...p, id: ids[i] }));
  heatmapPoints.value = [...heatmapPoints.value, ...newPoints];

  addLog('热力图', `添加了${pointCount}个密集热力点数据`);
};

/**
 * 切换热力图性能模式
 */
const toggleHeatmapPerformanceMode = () => {
  if (!layerRef.value) return;

  heatmapPerformanceMode.value = !heatmapPerformanceMode.value;

  // 更新热力图配置
  layerRef.value.configureHeatmap({
    hideOnMoving: heatmapPerformanceMode.value,
    hideOnZooming: heatmapPerformanceMode.value
  });

  addLog('热力图', heatmapPerformanceMode.value ? '启用性能模式' : '禁用性能模式');
};

// 工具栏位置
const toolbarPosition = ref < ToolbarPosition > (ToolbarPosition.TOP_LEFT);

// 简化工具栏位置更新方法
const changeToolbarPosition = (position: ToolbarPosition) => {
  toolbarPosition.value = position;

  if (!layerRef.value) return;

  // 更新工具栏位置配置
  layerRef.value.updateToolbarConfig({ position });

  // 记录日志
  addLog('工具栏', `切换位置: ${position}`);
};

// 添加工具栏方向数据
const toolbarDirection = ref < ToolbarDirection > (ToolbarDirection.HORIZONTAL);

// 简化工具栏方向更新方法
const changeToolbarDirection = (direction: ToolbarDirection) => {
  toolbarDirection.value = direction;

  if (!layerRef.value) return;

  // 更新工具栏方向配置
  layerRef.value.updateToolbarConfig({ direction });

  // 记录日志
  addLog('工具栏', `切换方向: ${direction}`);
};


/**
 * 更新飞线列表
 */
const updateFlightLineList = () => {
  if (!layerRef.value) return;

  // 获取飞线图对象
  const flightLineObj = layerRef.value.getFlightLineObject();
  if (!flightLineObj) {
    addLog('飞线图', '无法获取飞线图对象');
    return;
  }

  try {
    // 获取所有飞线数据
    const allFlightLines = flightLineObj.getAllFlightLines();
    if (!allFlightLines) {
      flightLines.value = [];
      selectedFlightLine.value = null;
      return;
    }

    // 转换Map为数组并按创建时间排序
    const linesArray: Array<FlightLineData & { id: string }> = [];
    allFlightLines.forEach((line, id) => {
      linesArray.push({
        ...line,
        id
      });
    });

    // 按创建时间倒序排序，最新的在前面
    linesArray.sort((a, b) => {
      const timeA = a._createTime || 0;
      const timeB = b._createTime || 0;
      return timeB - timeA;
    });

    // 更新列表
    flightLines.value = linesArray;

    // 获取当前激活的飞线
    const activeFlightLine = flightLineObj.getActiveFlightLine();

    // 更新选中状态
    selectedFlightLine.value = activeFlightLine;

    addLog('飞线图', `飞线列表已更新，共 ${linesArray.length} 条飞线`);
  } catch (error) {
    console.error('获取飞线列表错误:', error);
    addLog('飞线图', `获取飞线列表失败: ${error.message}`);
  }
};

/**
 * 选择飞线
 * @param id 飞线ID
 */
const selectFlightLine = (id: string) => {
  if (!layerRef.value) return;

  // 获取飞线图对象
  const flightLineObj = layerRef.value.getFlightLineObject();
  if (!flightLineObj) {
    addLog('飞线图', '无法获取飞线图对象');
    return;
  }

  // 如果当前选中的就是这个ID，则取消选中
  if (selectedFlightLine.value === id) {
    // 取消选中当前飞线
    flightLineObj.updateFlightLine(id, {
      highlight: false,
      style: undefined
    });
    selectedFlightLine.value = null;

    // 获取飞线数据记录日志
    const line = flightLines.value.find(line => line.id === id);
    if (line) {
      addLog('飞线图', `取消选中飞线: ${line.fromName} -> ${line.toName}`);
    }
  } else {
    // 设置新选中的飞线
    flightLineObj.setActiveFlightLine(id);
    selectedFlightLine.value = id;

    // 获取飞线数据记录日志
    const line = flightLines.value.find(line => line.id === id);
    if (line) {
      addLog('飞线图', `选中飞线: ${line.fromName} -> ${line.toName}`);
    }
  }
};

// 检查飞线是否被选中
const isFlightLineSelected = (id: string) => {
  return selectedFlightLine.value === id;
};

// 获取分组中的标记点数量
function getGroupMarkerCount(groupName: string): number {
  return markers.value.filter(marker => marker.group === groupName).length;
}

// 切换分组可见性
function toggleMarkerGroupVisibility(groupName: string) {
  if (!layerRef.value) return;

  // 找到分组信息
  const groupInfo = markerGroups.value.find(g => g.name === groupName);
  if (!groupInfo) return;

  if (groupInfo.visible) {
    // 如果当前可见，则隐藏
    layerRef.value.hideMarkerGroup(groupName);
    groupInfo.visible = false;
    addLog('操作', `已隐藏 "${groupName}" 分组的标记点`);
  } else {
    // 如果当前隐藏，则显示
    layerRef.value.showMarkerGroup(groupName);
    groupInfo.visible = true;
    addLog('操作', `已显示 "${groupName}" 分组的标记点`);
  }

  // 更新标记点列表
  updateMarkerList();
}

// 循环切换不同分组的可见性
function toggleGroupVisibility() {
  if (!layerRef.value || markerGroups.value.length === 0) {
    ElMessage.warning('没有可用的标记点分组');
    return;
  }

  // 确保索引在有效范围内
  if (currentGroupIndex.value >= markerGroups.value.length) {
    currentGroupIndex.value = 0;
  }

  // 获取当前分组
  const currentGroup = markerGroups.value[currentGroupIndex.value];

  // 切换当前分组的可见性
  toggleMarkerGroupVisibility(currentGroup.name);

  // 更新索引为下一个分组
  currentGroupIndex.value = (currentGroupIndex.value + 1) % markerGroups.value.length;
}

// 添加分组标记点
function addGroupedMarkers() {
  if (!layerRef.value) return;

  // 定义分组
  const groups = ['景点', '餐厅', '交通', '购物'];

  // 为每个分组添加3个标记点
  groups.forEach(groupName => {
    for (let i = 0; i < 3; i++) {
      const centerLon = config.center[1];
      const centerLat = config.center[0];

      // 根据分组稍微调整位置，避免重叠
      let offsetMultiplier = 0;
      switch (groupName) {
        case '景点': offsetMultiplier = 1; break;
        case '餐厅': offsetMultiplier = -1; break;
        case '交通': offsetMultiplier = 0.5; break;
        case '购物': offsetMultiplier = -0.5; break;
      }

      const offsetLon = (Math.random() - 0.5) * 0.05 + offsetMultiplier * 0.01;
      const offsetLat = (Math.random() - 0.5) * 0.05 + offsetMultiplier * 0.01;

      const lon = centerLon + offsetLon;
      const lat = centerLat + offsetLat;

      const id = `marker-${groupName}-${Date.now()}-${i}`;

      // 根据分组设置不同颜色和图标
      let color;
      switch (groupName) {
        case '景点': color = '#1890ff'; break; // 蓝色
        case '餐厅': color = '#52c41a'; break; // 绿色
        case '交通': color = '#faad14'; break; // 橙色
        case '购物': color = '#722ed1'; break; // 紫色
      }

      // 创建SVG图标
      const iconSvg = `<svg width="24" height="36" viewBox="0 0 24 36" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M12 0C28 0 24 24 12 36C0 24 -4 0 12 0Z" fill="${color}"/><circle cx="12" cy="12" r="6" fill="white"/></svg>`;

      layerRef.value.addMarker({
        id,
        position: [lon, lat],
        title: `${groupName}标记 ${i + 1}`,
        icon: iconSvg,
        iconType: 'svg',
        clickable: true,
        usePopover: true,
        group: groupName, // 设置分组属性
        data: { type: 'grouped', index: i }
      });
    }
  });

  // 更新标记点列表
  updateMarkerList();
  // 更新分组列表
  updateMarkerGroups();

  addLog('操作', '已添加4个分组的标记点，每组3个');
}

// 更新分组列表
function updateMarkerGroups() {
  if (!layerRef.value) return;

  // 获取所有分组
  const groups = layerRef.value.getGroups();
  markerGroups.value = groups;

  addLog('更新', `获取到 ${groups.length} 个标记点分组`);
}

// 切换地图类型
const changeMapType = (mapType: MapType) => {
  config.mapType = mapType;
  handleMapTypeChange();
};

// 切换图层类型
const changeLayerType = (layerType: string) => {
  tileType.value = layerType;
  handleLayerTypeChange();
};

// 标记点聚合模式的常量
const MARKER_CLUSTER_MODE = {
  CLUSTER: 'cluster',
  NONE: 'none'
};

/**
 * 添加随机飞线
 */
const addRandomFlightLines = () => {
  if (!layerRef.value) return;

  // 获取飞线图对象
  const flightLineObj = layerRef.value.getFlightLineObject();
  if (!flightLineObj) {
    addLog('飞线图', '无法获取飞线图对象');
    return;
  }

  // 强制启用飞线图
  flightLineObj.enable().then(() => {
    try {
      // 获取地图中心点
      const center = config.center;
      const centerLon = center[1];
      const centerLat = center[0];

      addLog('飞线图', `地图中心点: [${centerLat}, ${centerLon}]`);

      // 创建坐标映射表 - 参考sakitam.com示例
      const geoCoordMap = {
        '中心点': [centerLon, centerLat]
      };

      // 创建四个主要方向点
      const directions = ['东', '南', '西', '北'];
      const offsets = [
        [0.05, 0],    // 东
        [0, -0.05],   // 南
        [-0.05, 0],   // 西
        [0, 0.05]     // 北
      ];

      // 添加四个固定方向点
      for (let i = 0; i < 4; i++) {
        const name = `${directions[i]}方向`;
        const lon = centerLon + offsets[i][0];
        const lat = centerLat + offsets[i][1];
        geoCoordMap[name] = [lon, lat];
      }

      // 添加一些随机点
      for (let i = 0; i < 6; i++) {
        const name = `随机点${i + 1}`;
        const lon = centerLon + (Math.random() - 0.5) * 0.1;
        const lat = centerLat + (Math.random() - 0.5) * 0.1;
        geoCoordMap[name] = [lon, lat];
      }

      // 将所有坐标点添加到飞线对象中
      flightLineObj.addCoordinates(geoCoordMap);

      // 创建从中心点出发的数据
      const centerData = [
        [{ name: '中心点' }, { name: '东方向', value: 95 }],
        [{ name: '中心点' }, { name: '南方向', value: 85 }],
        [{ name: '中心点' }, { name: '西方向', value: 75 }],
        [{ name: '中心点' }, { name: '北方向', value: 65 }]
      ];

      // 创建从东方向出发的数据
      const eastData = [
        [{ name: '东方向' }, { name: '随机点1', value: 90 }],
        [{ name: '东方向' }, { name: '随机点2', value: 80 }]
      ];

      // 创建从南方向出发的数据
      const southData = [
        [{ name: '南方向' }, { name: '随机点3', value: 85 }],
        [{ name: '南方向' }, { name: '随机点4', value: 75 }]
      ];

      // 转换数据为飞线数据
      const convertData = (data) => {
        const res = [];
        for (let i = 0; i < data.length; i++) {
          const dataItem = data[i];
          const fromCoord = geoCoordMap[dataItem[0].name];
          const toCoord = geoCoordMap[dataItem[1].name];
          if (fromCoord && toCoord) {
            res.push({
              fromName: dataItem[0].name,
              toName: dataItem[1].name,
              coords: [fromCoord, toCoord],
              value: dataItem[1].value
            });
          }
        }
        return res;
      };

      // 转换数据
      const lines = [
        ...convertData(centerData),
        ...convertData(eastData),
        ...convertData(southData)
      ];

      // 为每条线添加样式
      const colors = ['#a6c84c', '#ffa022', '#46bee9'];
      lines.forEach((line, index) => {
        const colorIndex = index % colors.length;
        line.style = {
          color: colors[colorIndex],
          width: 1,
          opacity: 0.5,
          curveness: 0.2
        };
      });

      // 添加飞线
      const ids = flightLineObj.addFlightLines(lines, true, 6);

      // 设置最佳视角
      setTimeout(() => {
        flightLineObj.setOptimalView(6);
      }, 300);

      // 更新飞线列表
      setTimeout(() => {
        updateFlightLineList();
      }, 500);

      addLog('飞线图', `已添加${lines.length}条飞线，请等待显示`);
    } catch (error) {
      console.error('添加飞线时发生错误:', error);
      addLog('飞线图', `添加飞线时发生错误: ${error.message || error}`);
    }
  }).catch(err => {
    console.error('启用飞线图失败:', err);
    addLog('飞线图', `启用飞线图失败: ${err.message || err}`);
  });
};

/**
 * 添加链状飞线
 */
const addChainFlightLines = () => {
  if (!layerRef.value) return;

  // 获取飞线图对象
  const flightLineObj = layerRef.value.getFlightLineObject();
  if (!flightLineObj) {
    addLog('飞线图', '无法获取飞线图对象');
    return;
  }

  // 获取地图中心点
  const center = config.center;
  const centerLon = center[1];
  const centerLat = center[0];

  // 创建链状飞线数据
  const nodeCount = 6;
  const lines = [];
  const points = [];

  // 先创建一系列点，形成链状结构
  for (let i = 0; i < nodeCount; i++) {
    // 使点沿水平线分布
    const lat = centerLat;
    const lon = centerLon - 0.1 + (i * 0.2 / (nodeCount - 1));

    points.push({
      name: `节点${i + 1}`,
      coords: [lon, lat]
    });
  }

  // 创建相邻点之间的飞线连接
  for (let i = 0; i < nodeCount - 1; i++) {
    lines.push({
      fromName: points[i].name,
      toName: points[i + 1].name,
      coords: [
        points[i].coords,
        points[i + 1].coords
      ],
      value: 50
    });
  }

  // 添加飞线
  flightLineObj.addFlightLines(lines);

  // 更新飞线列表
  updateFlightLineList();

  addLog('飞线图', `已添加${lines.length}条链状飞线`);
};

/**
 * 添加星型飞线
 */
const addStarFlightLines = () => {
  if (!layerRef.value) return;

  // 获取飞线图对象
  const flightLineObj = layerRef.value.getFlightLineObject();
  if (!flightLineObj) {
    addLog('飞线图', '无法获取飞线图对象');
    return;
  }

  // 获取地图中心点
  const center = config.center;
  const centerLon = center[1];
  const centerLat = center[0];

  // 创建星型飞线数据
  const nodeCount = 8; // 外围节点数量
  const lines = [];

  // 创建中心点
  const centerName = "中心点";

  // 创建周围的点，形成星型结构
  for (let i = 0; i < nodeCount; i++) {
    // 计算角度，使节点均匀分布在圆周上
    const angle = (i / nodeCount) * Math.PI * 2;
    const radius = 0.05; // 半径

    // 计算坐标
    const lat = centerLat + Math.sin(angle) * radius;
    const lon = centerLon + Math.cos(angle) * radius;

    const name = `节点${i + 1}`;

    // 添加从中心点到外围节点的连线
    lines.push({
      fromName: centerName,
      toName: name,
      coords: [
        [centerLon, centerLat],
        [lon, lat]
      ],
      value: 70
    });
  }

  // 添加飞线
  flightLineObj.addFlightLines(lines);

  // 更新飞线列表
  updateFlightLineList();

  addLog('飞线图', `已添加${lines.length}条星型飞线`);
};


/**
 * 清除飞线
 */
const clearFlightLines = () => {
  if (!layerRef.value) return;

  // 获取飞线图对象
  const flightLineObj = layerRef.value.getFlightLineObject();
  if (!flightLineObj) {
    addLog('飞线图', '无法获取飞线图对象');
    return;
  }

  // 清除飞线
  try {
    // 移除所有飞线
    const allFlightLines = flightLineObj.getAllFlightLines();
    if (allFlightLines && allFlightLines.size > 0) {
      // 逐个删除飞线
      allFlightLines.forEach((line, id) => {
        try {
          flightLineObj.removeFlightLine(id);
        } catch (e) {
          console.error(`删除飞线 ${id} 失败:`, e);
        }
      });
    }

    // 更新飞线列表
    flightLines.value = [];
    selectedFlightLine.value = null;

    addLog('飞线图', '已清除所有飞线');
  } catch (error) {
    console.error('清除飞线失败:', error);
    addLog('飞线图', `清除飞线失败: ${error.message}`);
  }
};

// 选择单条飞线
const selectSingleFlightLine = (id: string) => {
  if (!layerRef.value) return;

  // 获取飞线图对象
  const flightLineObj = layerRef.value.getFlightLineObject();
  if (!flightLineObj) {
    addLog('飞线图', '无法获取飞线图对象');
    return;
  }

  // 如果当前选中的就是这个ID，则切换到显示全部
  if (selectedFlightLine.value === id) {
    // 显示所有飞线
    flightLineObj.showAllFlightLines();
    selectedFlightLine.value = null;

    // 获取飞线数据记录日志
    const line = flightLines.value.find(line => line.id === id);
    if (line) {
      addLog('飞线图', `取消单飞线显示，恢复显示全部`);
    }
  } else {
    // 只显示选中的飞线
    flightLineObj.showOnlyFlightLine(id);
    selectedFlightLine.value = id;

    // 获取飞线数据记录日志
    const line = flightLines.value.find(line => line.id === id);
    if (line) {
      addLog('飞线图', `只显示飞线: ${line.fromName} -> ${line.toName}`);
    }
  }
};

/**
 * 地图初始化完成
 */
const onMapInitialized = (map: any) => {
  addLog('地图', '地图初始化完成');
  // 更新飞线列表
  setTimeout(() => {
    updateFlightLineList();
  }, 500);
};

/**
 * 添加测试飞线数据
 */
const addTestFlightLines = () => {
  if (!layerRef.value) return;

  // 获取飞线图对象
  const flightLineObj = layerRef.value.getFlightLineObject();
  if (!flightLineObj) {
    addLog('飞线图', '无法获取飞线图对象');
    return;
  }

  // 示例城市坐标
  const cities = {
    '北京': [116.4, 39.9],
    '上海': [121.5, 31.2],
    '广州': [113.3, 23.1],
    '深圳': [114.1, 22.5],
    '杭州': [120.2, 30.3],
    '成都': [104.1, 30.7],
    '武汉': [114.3, 30.6],
    '西安': [108.9, 34.3],
    '南京': [118.8, 32.0],
    '重庆': [106.5, 29.5]
  };

  // 添加坐标点
  flightLineObj.addCoordinates(cities as any);

  // 创建连接所有城市的飞线网络，以北京为中心
  const cityNames = Object.keys(cities);
  const testLines = [];

  // 创建以北京为中心的星形网络
  for (let i = 1; i < cityNames.length; i++) {
    const from = '北京';
    const to = cityNames[i];
    testLines.push({
      fromName: from,
      toName: to,
      coords: [cities[from], cities[to]],
      value: Math.floor(Math.random() * 1000) + 100
    });
  }

  // 添加测试飞线
  flightLineObj.addFlightLines(testLines);

  addLog('飞线图', `添加了${testLines.length}条测试飞线`);
};

/**
 * 绘制台州边界
 */
const drawTaizhouBoundary = () => {
  if (!layerRef.value) return;

  addLog('操作', '开始绘制台州边界');

  // 台州市边界GeoJSON数据 (简化版坐标)
  const taizhouBoundaryData = {
    "type": "FeatureCollection",
    "features": [
      {
        "type": "Feature",
        "properties": {
          "name": "台州市",
          "id": "331000",
          "cp": [121.42079, 28.655716],
          "childNum": 9
        },
        "geometry": {
          "type": "Polygon",
          "coordinates": [
            [
              [121.25183, 28.34585],
              [121.10168, 28.39856],
              [121.01562, 28.35297],
              [120.89355, 28.36189],
              [120.83862, 28.32241],
              [120.75256, 28.35297],
              [120.68115, 28.28024],
              [120.55359, 28.30966],
              [120.47852, 28.41366],
              [120.42358, 28.38077],
              [120.33203, 28.41098],
              [120.22644, 28.51578],
              [120.18799, 28.61237],
              [120.10193, 28.63289],
              [120.00488, 28.75915],
              [119.87183, 28.80852],
              [119.81689, 28.89682],
              [119.84436, 28.99861],
              [119.80591, 29.11122],
              [119.73999, 29.13695],
              [119.68506, 29.25199],
              [119.60449, 29.31404],
              [119.62097, 29.37159],
              [119.57153, 29.43986],
              [119.60999, 29.56245],
              [119.68506, 29.59875],
              [119.77112, 29.58347],
              [119.89319, 29.63828],
              [119.96460, 29.61777],
              [120.07019, 29.66443],
              [120.12512, 29.65181],
              [120.20020, 29.68259],
              [120.34485, 29.65443],
              [120.44189, 29.68259],
              [120.55847, 29.64180],
              [120.62988, 29.55766],
              [120.69580, 29.53970],
              [120.83496, 29.57079],
              [120.93750, 29.58347],
              [121.01257, 29.54760],
              [121.11511, 29.56530],
              [121.16455, 29.61777],
              [121.29211, 29.59036],
              [121.32507, 29.51934],
              [121.47522, 29.45004],
              [121.52466, 29.36679],
              [121.57959, 29.38721],
              [121.69067, 29.32686],
              [121.74011, 29.25199],
              [121.78955, 29.16644],
              [121.84448, 29.10164],
              [121.98914, 28.99592],
              [122.11121, 28.92111],
              [122.15515, 28.84060],
              [122.11121, 28.75377],
              [122.04529, 28.72253],
              [121.96472, 28.71171],
              [121.90430, 28.66504],
              [121.87683, 28.60480],
              [121.88232, 28.52933],
              [121.96472, 28.45234],
              [121.89880, 28.41635],
              [121.83838, 28.46588],
              [121.74683, 28.42527],
              [121.72485, 28.35297],
              [121.66992, 28.32510],
              [121.48681, 28.33673],
              [121.36475, 28.36189],
              [121.25183, 28.34585]
            ]
          ]
        }
      }
    ]
  };

  try {
    // 提取多边形坐标
    const coordinates = taizhouBoundaryData.features[0].geometry.coordinates[0];

    // 转换成适合ScLayer的格式 - 将[lon, lat]格式转为[lat, lon]格式
    const taizhouCoordinates = coordinates.map(point => [point[1], point[0]]);

    // 使用addPolygon方法绘制台州边界
    const id = layerRef.value.addPolygon(taizhouCoordinates, {
      name: '台州市边界',
      data: { regionId: '331000', regionType: 'city' },
      fillColor: 'rgba(24, 144, 255, 0.3)',
      strokeColor: 'rgba(24, 144, 255, 0.8)',
      strokeWidth: 3,
      dashArray: '5,5',
      fillOpacity: 0.4
    });

    // 更新图形列表
    updateShapeList();

    // 设置地图视角到台州中心
    layerRef.value.getMapObject().setView([28.655716, 121.42079] as [number, number], 9);

    addLog('边界', `已绘制台州市边界 [ID: ${safeSlice(id)}]`);
  } catch (error) {
    console.error('绘制台州边界失败:', error);
    addLog('错误', `绘制台州边界失败: ${error.message}`);
  }
};

// 选择轨迹
const selectTrack = (trackId: string) => {
  // 如果选中的是当前已选中的轨迹，则取消选中
  if (activeTrackId.value === trackId) {
    activeTrackId.value = null;
  } else {
    activeTrackId.value = trackId;
  }

  addLog('轨迹', `选中轨迹: ${trackId}`);
};

// 双击定位到轨迹
const locateTrack = (trackId: string) => {
  if (!layerRef.value) {
    addLog('error', '地图组件未初始化');
    return;
  }

  // 使用fitTrackToView方法定位到轨迹
  const success = layerRef.value.fitTrackToView(trackId, {
    gotoStart: true,
    padding: [100, 100, 100, 100],
    duration: 600,
    maxZoom: 16
  });

  if (success) {
    addLog('轨迹', `已定位到轨迹: ${trackId}`);
    // 自动选中轨迹
    activeTrackId.value = trackId;
  } else {
    addLog('error', `定位轨迹失败: ${trackId}`);
  }
};

// 播放指定ID的轨迹
const playTrackById = (trackId: string) => {
  if (!layerRef.value) {
    addLog('error', '地图组件未初始化');
    return;
  }

  // 使用配置变量设置播放参数
  const success = layerRef.value.playTrack(trackId, {
    loop: trackPlayLoop.value,
    speed: trackPlaySpeed.value,
    withCamera: trackPlayWithCamera.value,
    speedFactor: 1.0,
    showNodes: trackPlayShowNodes.value,
    showNodeAnchors: true,
    showNodeNames: true,  // 显示节点名称
    showNodeTime: true,   // 显示节点时间
    showPointNames: true, // 显示移动点位名称
    showSpeed: true,      // 显示速度
    showNodeSpeed: true,  // 显示节点速度
    stabilizeViewport: true // 启用视口稳定，防止播放过程中不必要的缩放
  });

  if (success) {
    // 尝试激活轨迹播放器工具
    layerRef.value.activateTool('track-player');

    // 获取地图对象并触发渲染
    const map = layerRef.value.getMapObject();
    if (map) {
      map.render();

      // 再次触发渲染以确保UI更新
      setTimeout(() => {
        map.render();
      }, 100);
    }

    // 确保设置立即生效
    layerRef.value.updateTrackPlayer(trackId, {
      showNodes: trackPlayShowNodes.value,
      showNodeAnchors: true,
      showNodeNames: true,  // 显示节点名称
      showNodeTime: true,   // 显示节点时间
      showPointNames: true, // 显示移动点位名称
      showSpeed: true,      // 显示速度
      showNodeSpeed: true,  // 显示节点速度
      stabilizeViewport: true // 启用视口稳定，防止播放过程中不必要的缩放
    });

    // 获取轨迹数据记录日志
    const track = tracks.value.find(t => t.id === trackId);
    if (track) {
      addLog('轨迹', `正在播放轨迹: ${track.name}，速度: ${trackPlaySpeed.value} km/h`);
    }
  } else {
    addLog('error', `播放轨迹失败: ${trackId}`);
  }
};

// 停止指定ID的轨迹
const stopTrackById = (trackId: string) => {
  if (!layerRef.value) {
    addLog('error', '地图组件未初始化');
    return;
  }

  const success = layerRef.value.stopTrack(trackId);

  if (success) {
    addLog('轨迹', `已停止播放轨迹: ${trackId}`);
  } else {
    addLog('warn', `停止轨迹播放失败: ${trackId}`);
  }
};

// 删除指定ID的轨迹
const removeTrackById = (trackId: string) => {
  if (!layerRef.value) {
    addLog('error', '地图组件未初始化');
    return;
  }

  // 如果正在播放，先停止
  stopTrackById(trackId);

  // 移除轨迹
  const success = layerRef.value.removeTrack(trackId);

  if (success) {
    // 更新轨迹列表
    tracks.value = tracks.value.filter(t => t.id !== trackId);

    // 如果删除的是当前选中的轨迹，清除选中状态
    if (activeTrackId.value === trackId) {
      activeTrackId.value = null;
    }

    // 如果没有轨迹了，更新hasTrack状态
    if (tracks.value.length === 0) {
      hasTrack.value = false;
    }

    addLog('轨迹', `已删除轨迹: ${trackId}`);
  } else {
    addLog('error', `删除轨迹失败: ${trackId}`);
  }
};

// 更新热力图点列表的函数
const updateHeatmapPointList = () => {
  if (!layerRef.value) return;

  try {
    // 获取热力图对象
    const heatmapObj = layerRef.value.getHeatmapObject();
    if (!heatmapObj) {
      heatmapPoints.value = [];
      return;
    }

    // 获取所有热力点
    const allPoints = heatmapObj.getAllPoints();
    if (!allPoints) {
      heatmapPoints.value = [];
      return;
    }

    // 转换Map为数组
    const pointsArray = [];
    allPoints.forEach((point, id) => {
      pointsArray.push({
        ...point,
        id
      });
    });

    // 更新热力点列表
    heatmapPoints.value = pointsArray;
  } catch (error) {
    console.error('获取热力点列表错误:', error);
    addLog('热力图', `获取热力点列表失败: ${error.message}`);
  }
};

// 添加风场图配置
const windConfig = reactive<WindConfig>({
  paths: 3000,           // 初始粒子数量
  lineWidth: 2,          // 初始线条粗细
  velocityScale: 0.05,   // 初始速度缩放
  colorScale: [
    "rgb(36,104,180)",
    "rgb(60,157,194)",
    "rgb(128,205,193)",
    "rgb(151,218,168)",
    "rgb(198,231,181)",
    "rgb(238,247,217)",
    "rgb(255,238,159)",
    "rgb(252,217,125)",
    "rgb(255,182,100)",
    "rgb(252,150,75)",
    "rgb(250,112,52)",
    "rgb(245,64,32)",
    "rgb(237,45,28)",
    "rgb(220,24,32)",
    "rgb(180,0,35)"
  ]
});

// 激活风场图
function activateWindLayer() {
  if (!layerRef.value) {
    addLog('风场图', '地图组件未初始化');
    return;
  }

  layerRef.value.activateTool('wind-layer');
  addLog('风场图', '风场图已启用');
}

// 禁用风场图
function deactivateWindLayer() {
  if (!layerRef.value) {
    addLog('风场图', '地图组件未初始化');
    return;
  }

  layerRef.value.deactivateTool('wind-layer');
  addLog('风场图', '风场图已禁用');
}

// 更新风场图参数
function updateWindOptions() {
  if (!layerRef.value) {
    addLog('风场图', '地图组件未初始化');
    return;
  }

  // 获取风场图对象
  const windObject = layerRef.value.getWindObject();
  if (!windObject) {
    addLog('风场图', '无法获取风场图对象');
    return;
  }

  // 更新风场图配置
  windObject.setWindOptions({
    paths: windConfig.paths,
    lineWidth: windConfig.lineWidth,
    velocityScale: windConfig.velocityScale
  });

  addLog('风场图', `参数已更新: 粒子=${windConfig.paths}, 线宽=${windConfig.lineWidth}, 速度=${windConfig.velocityScale}`);
}

// 3D模型相关函数

/**
 * 切换3D/2D模式
 */
const toggle3DMode = () => {
  if (!layerRef.value) return;

  try {
    const cesiumObj = layerRef.value.getCesiumObject();
    if (!cesiumObj) {
      addLog('3D', '无法获取Cesium对象');
      return;
    }

    // 切换3D状态
    const success = cesiumObj.toggle3D();

    if (success) {
      is3DMode.value = cesiumObj.isEnabled();
      viewMode.value = cesiumObj.getViewMode();

      addLog('3D', `已切换至${is3DMode.value ? '3D' : '2D'}模式`);

      // 如果切换到了3D模式，设置默认视图
      if (is3DMode.value) {
        setTimeout(() => {
          set3DViewMode();
        }, 1000);
      }
    } else {
      addLog('3D', '切换3D模式失败');
    }
  } catch (error) {
    console.error('切换3D模式时发生错误:', error);
    addLog('3D', `切换3D模式失败: ${error.message || '未知错误'}`);
  }
};

/**
 * 设置3D视图模式和视角
 */
const set3DViewMode = () => {
  if (!layerRef.value || !is3DMode.value) return;

  try {
    const cesiumObj = layerRef.value.getCesiumObject();
    if (!cesiumObj) {
      addLog('3D', '无法获取Cesium对象');
      return;
    }

    // 当前中心点
    const center = config.center;
    const centerLon = center[1];
    const centerLat = center[0];

    // 设置相机视角
    cesiumObj.flyTo({
      position: {
        longitude: centerLon,
        latitude: centerLat,
        height: 2000 // 高度2000米
      },
      heading: 0,    // 朝北
      pitch: -30,    // 俯视30度
      roll: 0,       // 无侧倾
      duration: 2    // 2秒完成飞行
    });

    addLog('3D', '已设置3D视角');
  } catch (error) {
    console.error('设置3D视角时发生错误:', error);
    addLog('3D', `设置3D视角失败: ${error.message || '未知错误'}`);
  }
};

/**
 * 添加简单3D模型
 */
const addSimple3DModel = () => {
  if (!layerRef.value || !is3DMode.value) return;

  try {
    const cesiumObj = layerRef.value.getCesiumObject();
    if (!cesiumObj) {
      addLog('3D', '无法获取Cesium对象');
      return;
    }

    // 当前中心点
    const center = config.center;
    const centerLon = center[1];
    const centerLat = center[0];

    // 创建模型配置
    const modelId = 'simple-box-' + Math.floor(Math.random() * 10000);
    const modelConfig: Model3DOptions = {
      id: modelId,
      url: '', // 使用空URL，Cesium会创建一个默认盒体
      position: {
        longitude: centerLon,
        latitude: centerLat,
        height: 200 // 高度200米
      },
      scale: {
        x: 100,
        y: 100,
        z: 100
      },
      color: '#1890FF', // 蓝色
      label: {
        text: '简单盒体模型',
        fillColor: '#FFFFFF',
        outlineColor: '#000000',
        outlineWidth: 2,
        heightOffset: 120
      }
    };

    // 添加模型
    const result = cesiumObj.addModel(modelConfig);

    if (result) {
      addLog('3D', `已添加简单盒体模型: ${modelId}`);
      models.value.push({
        id: modelId,
        name: '简单盒体模型',
        type: 'box'
      });

      // 选中当前模型
      selectedModelId.value = modelId;
    } else {
      addLog('3D', '添加模型失败');
    }
  } catch (error) {
    console.error('添加简单模型时发生错误:', error);
    addLog('3D', `添加简单模型失败: ${error.message || '未知错误'}`);
  }
};

/**
 * 添加详细3D模型
 */
const addDetailed3DModel = () => {
  if (!layerRef.value || !is3DMode.value) return;

  try {
    const cesiumObj = layerRef.value.getCesiumObject();
    if (!cesiumObj) {
      addLog('3D', '无法获取Cesium对象');
      return;
    }

    // 当前中心点，向右偏移一点
    const center = config.center;
    const centerLon = center[1] + 0.002;
    const centerLat = center[0];

    // 创建模型配置 - 使用一个公开的glTF模型URL
    const modelId = 'cesium-man-' + Math.floor(Math.random() * 10000);
    const modelConfig: Model3DOptions = {
      id: modelId,
      url: 'https://sandcastle.cesium.com/SampleData/models/CesiumMan/Cesium_Man.glb', // Cesium示例模型
      position: {
        longitude: centerLon,
        latitude: centerLat,
        height: 0 // 地面高度
      },
      scale: {
        x: 10,
        y: 10,
        z: 10
      },
      rotation: {
        heading: 0, // 朝北
        pitch: 0,   // 无俯仰
        roll: 0     // 无翻滚
      },
      label: {
        text: 'Cesium人物模型',
        fillColor: '#FFFFFF',
        outlineColor: '#000000',
        outlineWidth: 2,
        heightOffset: 50
      },
      animation: {
        speedFactor: 1.0,
        loop: true,
        autoPlay: true
      }
    };

    // 添加模型
    const result = cesiumObj.addModel(modelConfig);

    if (result) {
      addLog('3D', `已添加Cesium人物模型: ${modelId}`);
      models.value.push({
        id: modelId,
        name: 'Cesium人物模型',
        type: 'glTF'
      });

      // 选中当前模型
      selectedModelId.value = modelId;
    } else {
      addLog('3D', '添加人物模型失败');
    }
  } catch (error) {
    console.error('添加详细模型时发生错误:', error);
    addLog('3D', `添加详细模型失败: ${error.message || '未知错误'}`);
  }
};

/**
 * 添加自定义3D模型
 */
const addCustom3DModel = () => {
  if (!layerRef.value || !is3DMode.value) return;

  try {
    const cesiumObj = layerRef.value.getCesiumObject();
    if (!cesiumObj) {
      addLog('3D', '无法获取Cesium对象');
      return;
    }

    // 当前中心点，向左偏移一点
    const center = config.center;
    const centerLon = center[1] - 0.002;
    const centerLat = center[0];

    // 创建模型配置 - 使用一个公开的glTF模型URL
    const modelId = 'custom-model-' + Math.floor(Math.random() * 10000);
    const modelConfig: Model3DOptions = {
      id: modelId,
      url: 'https://sandcastle.cesium.com/SampleData/models/CesiumAir/Cesium_Air.glb', // Cesium飞机模型
      position: {
        longitude: centerLon,
        latitude: centerLat,
        height: 200 // 高度200米
      },
      scale: {
        x: 10,
        y: 10,
        z: 10
      },
      rotation: {
        heading: 45, // 东北方向
        pitch: 0,    // 无俯仰
        roll: 0      // 无翻滚
      },
      label: {
        text: '自定义飞机模型',
        fillColor: '#FFFFFF',
        outlineColor: '#000000',
        outlineWidth: 2,
        heightOffset: 50
      }
    };

    // 添加模型
    const result = cesiumObj.addModel(modelConfig);

    if (result) {
      addLog('3D', `已添加自定义飞机模型: ${modelId}`);
      models.value.push({
        id: modelId,
        name: '自定义飞机模型',
        type: 'aircraft'
      });

      // 选中当前模型
      selectedModelId.value = modelId;
    } else {
      addLog('3D', '添加自定义模型失败');
    }
  } catch (error) {
    console.error('添加自定义模型时发生错误:', error);
    addLog('3D', `添加自定义模型失败: ${error.message || '未知错误'}`);
  }
};

/**
 * 清除所有3D模型
 */
const clearAll3DModels = () => {
  if (!layerRef.value || !is3DMode.value) return;

  try {
    const cesiumObj = layerRef.value.getCesiumObject();
    if (!cesiumObj) {
      addLog('3D', '无法获取Cesium对象');
      return;
    }

    // 清除所有模型
    const success = cesiumObj.clearAllModels();

    if (success) {
      addLog('3D', '已清除所有3D模型');
      models.value = [];
      selectedModelId.value = null;
    } else {
      addLog('3D', '清除3D模型失败');
    }
  } catch (error) {
    console.error('清除3D模型时发生错误:', error);
    addLog('3D', `清除3D模型失败: ${error.message || '未知错误'}`);
  }
};

/**
 * 飞行到选中的模型
 */
const flyToSelectedModel = () => {
  if (!layerRef.value || !is3DMode.value || !selectedModelId.value) return;

  try {
    const cesiumObj = layerRef.value.getCesiumObject();
    if (!cesiumObj) {
      addLog('3D', '无法获取Cesium对象');
      return;
    }

    // 飞行到模型
    const success = cesiumObj.flyToModel(selectedModelId.value, {
      offset: {
        heading: 45,   // 从东北方向看
        pitch: -30,    // 俯视30度
        range: 500     // 距离500米
      },
      duration: 2      // 2秒完成飞行
    });

    if (success) {
      const model = models.value.find(m => m.id === selectedModelId.value);
      addLog('3D', `已飞行到模型: ${model ? model.name : selectedModelId.value}`);
    } else {
      addLog('3D', '飞行到模型失败');
    }
  } catch (error) {
    console.error('飞行到模型时发生错误:', error);
    addLog('3D', `飞行到模型失败: ${error.message || '未知错误'}`);
  }
};

/**
 * 旋转选中的模型
 */
const rotateSelectedModel = () => {
  if (!layerRef.value || !is3DMode.value || !selectedModelId.value) return;

  try {
    const cesiumObj = layerRef.value.getCesiumObject();
    if (!cesiumObj) {
      addLog('3D', '无法获取Cesium对象');
      return;
    }

    // 随机旋转角度
    const heading = Math.random() * 360;
    const pitch = (Math.random() - 0.5) * 30;
    const roll = (Math.random() - 0.5) * 30;

    // 更新模型旋转
    const success = cesiumObj.updateModel(selectedModelId.value, {
      rotation: {
        heading,
        pitch,
        roll
      }
    });

    if (success) {
      const model = models.value.find(m => m.id === selectedModelId.value);
      addLog('3D', `已旋转模型: ${model ? model.name : selectedModelId.value}`);
    } else {
      addLog('3D', '旋转模型失败');
    }
  } catch (error) {
    console.error('旋转模型时发生错误:', error);
    addLog('3D', `旋转模型失败: ${error.message || '未知错误'}`);
  }
};

/**
 * 调整选中模型的大小
 */
const resizeSelectedModel = () => {
  if (!layerRef.value || !is3DMode.value || !selectedModelId.value) return;

  try {
    const cesiumObj = layerRef.value.getCesiumObject();
    if (!cesiumObj) {
      addLog('3D', '无法获取Cesium对象');
      return;
    }

    // 随机缩放因子
    const scaleFactor = 0.5 + Math.random() * 2; // 0.5到2.5之间

    // 更新模型缩放
    const success = cesiumObj.updateModel(selectedModelId.value, {
      scale: {
        x: scaleFactor * 10,
        y: scaleFactor * 10,
        z: scaleFactor * 10
      }
    });

    if (success) {
      const model = models.value.find(m => m.id === selectedModelId.value);
      addLog('3D', `已调整模型大小: ${model ? model.name : selectedModelId.value} (${scaleFactor.toFixed(2)}x)`);
    } else {
      addLog('3D', '调整模型大小失败');
    }
  } catch (error) {
    console.error('调整模型大小时发生错误:', error);
    addLog('3D', `调整模型大小失败: ${error.message || '未知错误'}`);
  }
};

/**
 * 更改选中模型的颜色
 */
const changeModelColor = () => {
  if (!layerRef.value || !is3DMode.value || !selectedModelId.value) return;

  try {
    const cesiumObj = layerRef.value.getCesiumObject();
    if (!cesiumObj) {
      addLog('3D', '无法获取Cesium对象');
      return;
    }

    // 随机颜色
    const colors = ['#1890FF', '#52C41A', '#FAAD14', '#F5222D', '#722ED1', '#EB2F96'];
    const color = colors[Math.floor(Math.random() * colors.length)];

    // 更新模型颜色
    const success = cesiumObj.updateModel(selectedModelId.value, {
      color: color
    });

    if (success) {
      const model = models.value.find(m => m.id === selectedModelId.value);
      addLog('3D', `已更改模型颜色: ${model ? model.name : selectedModelId.value} (${color})`);
    } else {
      addLog('3D', '更改模型颜色失败');
    }
  } catch (error) {
    console.error('更改模型颜色时发生错误:', error);
    addLog('3D', `更改模型颜色失败: ${error.message || '未知错误'}`);
  }
};

/**
 * 清除热力点
 */
const clearHeatmapPoints = () => {
  if (!layerRef.value) return;

  try {
    // 获取热力图对象
    layerRef.value.clearHeatmap();
    // 更新热力点列表
    heatmapPoints.value = [];
    selectedHeatmapPoint.value = null;

    addLog('热力图', '已清除所有热力点');
  } catch (error) {
    console.error('清除热力点失败:', error);
    addLog('热力图', `清除热力点失败: ${error.message || '未知错误'}`);
  }
};

/**
 * 删除单个3D模型
 * @param id 模型ID
 */
const removeModel = (id: string) => {
  if (!layerRef.value || !is3DMode.value) return;

  try {
    const cesiumObj = layerRef.value.getCesiumObject();
    if (!cesiumObj) {
      addLog('3D', '无法获取Cesium对象');
      return;
    }

    // 删除指定ID的模型
    const success = cesiumObj.removeModel(id);

    if (success) {
      // 从模型列表中移除
      const modelIndex = models.value.findIndex(m => m.id === id);
      if (modelIndex !== -1) {
        const model = models.value[modelIndex];
        models.value.splice(modelIndex, 1);
        addLog('3D', `已删除模型: ${model.name}`);
      }

      // 如果删除的是当前选中的模型，清除选中状态
      if (selectedModelId.value === id) {
        selectedModelId.value = null;
      }
    } else {
      addLog('3D', `删除模型 ${id} 失败`);
    }
  } catch (error) {
    console.error('删除模型时发生错误:', error);
    addLog('3D', `删除模型失败: ${error.message || '未知错误'}`);
  }
};

const gaodeKey = ref('054b327a96515ec1ae59f94e080c1680');
config.mapKey.GAODE = gaodeKey.value;
watch(gaodeKey, (val) => {
  config.mapKey.GAODE = val;
});
</script>

<style scoped>
.sc-layer-example {
  padding: 20px;
}

.example-content {
  display: flex;
  margin-top: 20px;
}

.map-area {
  flex: 1;
  margin-right: 20px;
}

.config-area {
  width: 320px;
  overflow-y: auto;
  max-height: 700px;
}

.config-section {
  width: 100%;
}

.config-item {
  margin-bottom: 20px;
  border: 1px solid #e0e0e0;
  border-radius: 4px;
  overflow: hidden;
}

.label {
  padding: 8px 12px;
  font-weight: 600;
  background-color: #f5f5f5;
  border-bottom: 1px solid #e0e0e0;
}

.controls {
  padding: 12px;
}

.control-row {
  display: flex;
  align-items: center;
  margin-bottom: 8px;
}

.control-row span {
  margin-right: 8px;
  min-width: 80px;
}

.control-row .value {
  margin-left: 8px;
  min-width: auto;
  color: #1890ff;
}

.buttons-row {
  display: flex;
  justify-content: space-between;
  gap: 8px;
}

button {
  padding: 4px 8px;
  border: 1px solid #d9d9d9;
  border-radius: 4px;
  background-color: #fff;
  cursor: pointer;
  transition: all 0.3s;
  font-size: 12px;
  flex: 1;
}

button:hover {
  color: #1890ff;
  border-color: #1890ff;
}

.primary-button {
  background-color: #1890ff;
  color: #fff;
  border-color: #1890ff;
}

.primary-button:hover {
  background-color: #40a9ff;
  color: #fff;
  border-color: #40a9ff;
}

.active-button {
  color: #1890ff;
  border-color: #1890ff;
}

.marker-stats,
.shape-stats,
.flight-line-stats,
.marker-group-stats,
.heatmap-stats {
  display: flex;
  justify-content: space-between;
  margin-bottom: 8px;
  font-size: 12px;
  color: #666;
}

.marker-list,
.shape-list,
.flight-line-list,
.marker-group-list,
.heatmap-list {
  max-height: 200px;
  overflow-y: auto;
  border: 1px solid #e8e8e8;
  border-radius: 4px;
  background-color: #fff;
  padding: 8px;
}

.marker-item,
.shape-item,
.flight-line-item,
.marker-group-item,
.heatmap-item {
  padding: 8px;
  margin-bottom: 8px;
  border: 1px solid #e8e8e8;
  border-radius: 4px;
  background-color: #f9f9f9;
}

.marker-header,
.shape-header,
.flight-line-header,
.marker-group-header,
.heatmap-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 4px;
}

.marker-id,
.shape-id,
.flight-line-id,
.marker-group-name,
.heatmap-name {
  font-weight: bold;
  font-size: 12px;
}

.heatmap-item {
  cursor: pointer;
}

.heatmap-selected {
  border-color: #1890ff;
  background-color: #e6f7ff;
}

.heatmap-weight {
  font-size: 12px;
  color: #ff4d4f;
}

.heatmap-position {
  font-size: 12px;
  margin-bottom: 4px;
  color: #666;
}

.no-markers,
.no-shapes,
.no-flight-lines,
.no-marker-groups,
.no-heatmap-points {
  color: #999;
  font-style: italic;
  padding: 8px 0;
  text-align: center;
}

.more-markers,
.more-shapes,
.more-flight-lines,
.more-heatmap-points {
  color: #999;
  font-style: italic;
  text-align: center;
  padding: 4px 0;
  font-size: 12px;
}

.flight-line-item {
  padding: 8px;
  margin-bottom: 8px;
  border: 1px solid #e8e8e8;
  border-radius: 4px;
  background-color: #f9f9f9;
  cursor: pointer;
  position: relative;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.flight-line-item:hover {
  background-color: #f0f0f0;
}

.line-content {
  flex: 1;
}

.line-title {
  font-weight: bold;
  font-size: 14px;
  margin-bottom: 4px;
}

.line-details {
  font-size: 12px;
  color: #666;
}

.active-badge {
  position: absolute;
  bottom: 4px;
  right: 4px;
  background-color: #1890ff;
  color: #fff;
  padding: 2px 6px;
  border-radius: 10px;
  font-size: 10px;
}

.flight-line-selected {
  border-color: #1890ff;
  background-color: #e6f7ff;
}

.flight-line-route {
  display: flex;
  font-size: 12px;
  align-items: center;
}

.flight-line-arrow {
  margin: 0 4px;
  color: #1890ff;
}

.flight-line-value {
  font-size: 12px;
  color: #ff4d4f;
}

.log-container {
  max-height: 200px;
  overflow-y: auto;
  border: 1px solid #e8e8e8;
  border-radius: 4px;
  background-color: #fff;
  padding: 8px;
}

.log-item {
  font-size: 12px;
  margin-bottom: 4px;
  padding: 4px;
  border-bottom: 1px solid #f0f0f0;
}

.log-time {
  color: #8c8c8c;
  margin-right: 8px;
}

.log-type {
  color: #1890ff;
  font-weight: bold;
  margin-right: 8px;
}

.no-logs {
  color: #999;
  font-style: italic;
}

.feature-group-title {
  font-weight: bold;
  font-size: 13px;
  margin: 16px 0 8px 0;
  padding-bottom: 4px;
  border-bottom: 1px solid #e0e0e0;
  color: #1890ff;
}

.feature-group-title:first-child {
  margin-top: 0;
}

.button-group {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  flex: 1;
}

.button-group button {
  flex: 1;
  min-width: 80px;
}

/* 增强按钮组样式，使每行只有两个按钮 */
.control-row .button-group {
  min-width: 0;
  width: 100%;
}

/* 工具栏位置按钮特殊样式 */
.toolbar-position-row {
  margin-left: 88px;
  /* 与上方标签对齐 */
}

/* 添加功能分组的分隔线 */
.feature-group-title+.control-row {
  margin-top: 8px;
}

/* 工具栏位置按钮样式 */
.toolbar-position-row {
  margin-left: 88px;
  /* 与上方标签对齐 */
}

/* 工具栏位置按钮激活状态 */
.toolbar-position-row .active-button {
  background-color: #e6f7ff;
  color: #1890ff;
  border-color: #1890ff;
  font-weight: bold;
}

/* 添加功能分组的分隔线 */
.feature-group-title+.control-row {
  margin-top: 8px;
}

.shape-status span.visible {
  background-color: #e6f7ff;
  color: #1890ff;
  padding: 2px 6px;
  border-radius: 10px;
  font-size: 12px;
}

.shape-status span.hidden {
  background-color: #fff1f0;
  color: #f5222d;
  padding: 2px 6px;
  border-radius: 10px;
  font-size: 12px;
}

.shape-data-item {
  font-size: 12px;
  margin-bottom: 2px;
  color: #666;
}

/* 热力图样式 */
.heatmap-stats {
  display: flex;
  justify-content: space-between;
  margin-bottom: 8px;
  font-size: 12px;
  color: #666;
}

.heatmap-list {
  max-height: 200px;
  overflow-y: auto;
  border: 1px solid #e8e8e8;
  border-radius: 4px;
  background-color: #fff;
  padding: 8px;
}

.heatmap-item {
  padding: 8px;
  margin-bottom: 8px;
  border: 1px solid #e8e8e8;
  border-radius: 4px;
  background-color: #f9f9f9;
  cursor: pointer;
}

.heatmap-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 4px;
}

.heatmap-name {
  font-weight: bold;
  font-size: 12px;
}

.heatmap-selected {
  border-color: #1890ff;
  background-color: #e6f7ff;
}

.heatmap-weight {
  font-size: 12px;
  color: #ff4d4f;
}

.heatmap-position {
  font-size: 12px;
  margin-bottom: 4px;
  color: #666;
}

.no-heatmap-points {
  color: #999;
  font-style: italic;
  padding: 8px 0;
  text-align: center;
}

.more-heatmap-points {
  color: #999;
  font-style: italic;
  text-align: center;
  padding: 4px 0;
  font-size: 12px;
}

.flight-lines-list {
  max-height: 200px;
  overflow-y: auto;
  border: 1px solid #e8e8e8;
  border-radius: 4px;
  background-color: #fff;
  padding: 8px;
}

.flight-line-item {
  padding: 8px;
  margin-bottom: 8px;
  border: 1px solid #e8e8e8;
  border-radius: 4px;
  background-color: #f9f9f9;
  cursor: pointer;
}

.flight-line-item.active {
  border-color: #1890ff;
  background-color: #e6f7ff;
}

.flight-line-title {
  font-weight: bold;
  font-size: 12px;
}

.flight-line-details {
  font-size: 12px;
  color: #666;
}

.active-badge {
  background-color: #1890ff;
  color: #fff;
  padding: 2px 6px;
  border-radius: 10px;
  font-size: 12px;
}

.empty-tip {
  color: #999;
  font-style: italic;
  padding: 8px 0;
  text-align: center;
}

/* 轨迹列表样式 */
.track-list {
  max-height: 200px;
  overflow-y: auto;
  border: 1px solid #e8e8e8;
  border-radius: 4px;
  background-color: #fff;
  padding: 8px;
}

.track-item {
  padding: 8px;
  margin-bottom: 8px;
  border: 1px solid #e8e8e8;
  border-radius: 4px;
  background-color: #f9f9f9;
  cursor: pointer;
}

.track-item:hover {
  background-color: #e6f7ff;
}

.track-item-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 4px;
}

.track-name {
  font-weight: bold;
  font-size: 12px;
}

.track-points-count {
  font-size: 12px;
  color: #666;
}

.track-item-actions {
  display: flex;
  gap: 8px;
}

.track-item.active {
  border-color: #1890ff;
  background-color: #e6f7ff;
}
</style>