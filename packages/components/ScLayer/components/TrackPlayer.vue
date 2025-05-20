<!-- 轨迹播放器组件 -->
<template>
  <div class="track-player" :class="{ 'collapsed': collapsed, 'playing': playState === 'playing' }"
    :style="trackPlayerStyle" @click="collapsed && toggleCollapse()">
    <!-- 标题栏 -->
    <div class="track-player-header">
      <div class="track-player-title">轨迹播放器</div>
      <div class="track-player-actions">
        <!-- 设置按钮 -->
        <div class="track-player-setting-btn" @click.stop="toggleSettings" title="播放设置">
          <div class="setting-icon">
            <span>⚙</span>
          </div>
        </div>
        <!-- 收缩/展开按钮 -->
        <div class="track-player-collapse-btn" @click.stop="toggleCollapse" title="收缩/展开">
          <div class="collapse-icon">
            <span v-if="collapsed">
              <span v-html="TRACK_PLAYER_ICON" />
            </span>
            <span v-else>-</span>
          </div>
        </div>
      </div>
    </div>

    <!-- 设置弹窗 -->
    <div class="track-settings-modal" v-if="showSettings" @click.stop>
      <div class="track-settings-content">
        <div class="track-settings-header">
          <h3>轨迹播放设置</h3>
          <div class="track-settings-close" @click="showSettings = false">×</div>
        </div>
        <div class="track-settings-body">
          <!-- 轨迹设置组 -->
          <div class="settings-group">
            <div class="settings-group-title">轨迹设置</div>
            <div class="settings-options">
              <label class="settings-option">
                <input type="checkbox" v-model="loopPlay">
                <span>循环播放</span>
              </label>
              <label class="settings-option">
                <input type="checkbox" v-model="followCamera">
                <span>跟随移动</span>
              </label>
            </div>
          </div>


          <!-- 节点设置组 -->
          <div class="settings-group">
            <div class="settings-group-title">节点设置</div>
            <div class="settings-options">
              <label class="settings-option">
                <input type="checkbox" v-model="showNodes">
                <span>节点显示</span>
              </label>
              <label class="settings-option" :class="{ 'disabled': !showNodes }">
                <input type="checkbox" v-model="showNodeAnchors" :disabled="!showNodes">
                <span>节点锚点</span>
              </label>
              <label class="settings-option">
                <input type="checkbox" v-model="showNodePopover">
                <span>节点名称</span>
              </label>
              <label class="settings-option">
                <input type="checkbox" v-model="showNodeTime">
                <span>节点时间</span>
              </label>
              <label class="settings-option">
                <input type="checkbox" v-model="showNodeSpeed">
                <span>节点速度</span>
              </label>
              <label class="settings-option">
                <input type="checkbox" v-model="showNodeDistance">
                <span>节点距离</span>
              </label>
            </div>
          </div>

          <!-- 点位设置组 -->
          <div class="settings-group">
            <div class="settings-group-title">点位设置</div>
            <div class="settings-options">
              <label class="settings-option">
                <input type="checkbox" v-model="showMovingPointName">
                <span>点位名称</span>
              </label>
              <label class="settings-option">
                <input type="checkbox" v-model="showSpeedPopover">
                <span>移动速度</span>
              </label>
              <label class="settings-option">
                <input type="checkbox" v-model="enableSpeedIcon">
                <span>速度图标切换</span>
              </label>
            </div>
          </div>
        </div>
        <div class="track-settings-footer">
          <button class="settings-apply-btn" @click="showSettings = false">确认</button>
        </div>
      </div>
    </div>

    <!-- 折叠状态时显示的图标 -->
    <div class="collapsed-icon" v-if="collapsed">
      <span v-if="playState === 'playing'" class="playing-indicator">▶</span>
      <span v-else>
        <span v-html="TRACK_PLAYER_ICON" style="color:#000 !important;" />
      </span>
    </div>

    <!-- 播放器主体内容 -->
    <div class="track-player-content" v-show="!collapsed">
      <!-- 轨迹列表 -->
      <div class="track-list">
        <div class="track-list-header">
          <span>轨迹列表</span>
        </div>
        <div class="track-list-content thin-scrollbar" v-if="tracks.size > 0">
          <div v-for="[id, track] in tracks" :key="id" class="track-item"
            :class="{ 'active': activeTrackId === id, 'disabled': playState === 'playing' && activeTrackId !== id }"
            @click="canSwitchTrack && selectTrack(id)" @dblclick="fitToTrackView(id)">
            <div class="track-item-info">
              <div class="track-item-name">{{ getTrackNameWithLength(track, id) }}</div>
              <div class="track-item-detail">{{ formatTrackDetail(track) }}</div>
            </div>
            <div class="track-item-actions">
              <button class="track-item-delete-btn" @click.stop="deleteTrack(id)" :disabled="playState === 'playing'"
                :title="playState === 'playing' ? '播放中无法删除轨迹' : '删除轨迹'">
                <span v-html="icons.trackDelete"></span>
              </button>
            </div>
          </div>
        </div>
        <div class="track-list-empty" v-else>
          <span>暂无轨迹数据 ({{tracks.size}})</span>
        </div>
      </div>

      <!-- 播放控制区域 -->
      <div class="track-controls">
        <!-- 播放速度控制 -->
        <div class="track-speed-control">
          <div class="speed-label">速度: {{ speedFactor.toFixed(1) }}x</div>
          <input type="range" min="0.5" max="10" step="0.5" v-model.number="speedFactor" @input="onSpeedChange"
            class="speed-slider" :disabled="!activeTrackId">
          <div class="speed-labels">
            <span>慢</span>
            <span>正常</span>
            <span>快</span>
          </div>
        </div>

        <!-- 播放按钮 -->
        <div class="track-buttons">
          <button class="track-button track-backward" @click="setSpeed(Math.max(0.5, speedFactor - 0.5))"
            :disabled="!activeTrackId" title="减速">
            <span v-html="icons.trackBackward"></span>
          </button>

          <button class="track-button track-play" @click="togglePlay()" :disabled="!activeTrackId" title="播放/暂停">
            <span v-if="playState === 'playing'" v-html="icons.trackPause"></span>
            <span v-else v-html="icons.trackPlay"></span>
          </button>

          <button class="track-button track-forward" @click="setSpeed(Math.min(10, speedFactor + 0.5))"
            :disabled="!activeTrackId" title="加速">
            <span v-html="icons.trackForward"></span>
          </button>
          <button class="track-button track-forward track-camera" :class="{'active': followCamera}" @click="followCamera = !followCamera"
            :disabled="!activeTrackId" title="加速">
            <span v-html="icons.trackFollowCamera"></span>
          </button>
        </div>

        <!-- 播放进度 -->
        <div class="track-progress" v-if="activeTrackId">
          <div class="track-progress-bar" @click="handleProgressClick">
            <div class="track-progress-filled" :style="{ width: progressPercentage + '%' }"></div>
            <div class="track-progress-handle" :style="{ left: progressPercentage + '%' }"
              @mousedown="startProgressDrag" :class="{ 'active': isDraggingProgress }"></div>
          </div>
          <div class="track-progress-time">
            {{ formatTime(currentTime) }} / {{ formatTime(totalTime) }}
          </div>
          <div class="track-static-points-info" v-if="getStaticPointsWithDistance().length">
            <span v-for="item in getStaticPointsWithDistance()" :key="item.index" style="display:inline-block;margin-right:12px;">
              静态点: {{ item.title }}（距上点 {{ item.distance.toFixed(2) }} 公里）
            </span>
          </div>
          <!-- 当前速度显示 -->
          <div class="track-current-speed" v-if="currentSpeed > 0">
            <template v-if="speedFactor === 1.0">
              当前速度: {{ currentSpeed.toFixed(1) }} km/h
            </template>
            <template v-else>
              当前速度: {{ (currentSpeed * speedFactor).toFixed(1) }} km/h (实际: {{ currentSpeed.toFixed(1) }} km/h)
            </template>
            <!-- 新增：已行驶路程和距离下一个点 -->
            <div class="track-current-distance-info" style="margin-top:4px;font-size:12px;color:#1890ff;">
              <span>已行驶：{{ getDistanceFromStart().toFixed(2) }} 公里</span>
              <span v-if="getDistanceToNextPoint() > 0" style="margin-left: 16px;">距离下个点：{{ getDistanceToNextPoint().toFixed(2) }} 公里</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
export default {
  name: 'TrackPlayer'
};
</script>

<script setup lang="ts">
import { ref, computed, watch, onMounted, onBeforeUnmount, watchEffect, getCurrentInstance } from 'vue';
import { Track, TrackPlayer as TrackPlayerConfig } from '../types/track';
import { DEFAULT_TRACK_SPEED_GROUPS } from '../types/default';
import { 
  TRACK_PLAYER_ICON,
  TRACK_PLAY_ICON, 
  TRACK_PAUSE_ICON, 
  TRACK_BACKWARD_ICON, 
  TRACK_FORWARD_ICON, 
  TRACK_DELETE_ICON, 
  TRACK_FOLLOW_CAMERA_ICON
} from '../types/icon';

// 定义TrackPoint接口
interface TrackPoint {
  lat: number;
  lng: number;
  time: number;
  title?: string;
  staticTitle?: string;
  [key: string]: any;
}

interface Props {
  trackObj: {
    getMapInstance?: () => any;
    getAllTracks?: () => Map<string, Track>;
    play?: (id: string, config?: any) => boolean;
    pause?: (id: string) => boolean;
    stop?: (id: string) => boolean;
    getTrackProgress?: (id: string) => number | null;
    setTrackProgress?: (id: string, progress: number) => boolean;
    getCurrentSpeed?: (id: string) => number | null;
    updateTrackSpeed?: (id: string, speedFactor: number) => boolean;
    setTrackPlayer?: (id: string, config: any) => boolean;
    updateTrackPlayer?: (id: string, config: any) => boolean;
    setTrackSpeedFactor?: (id: string, speedFactor: number) => boolean;
    removeTrack?: (id: string) => boolean;
    setTrackNodesVisible?: (id: string, visible: boolean) => boolean;
    setTrackNodePopoversVisible?: (id: string, visible: boolean) => boolean;
    setTrackNodeTimeVisible?: (id: string, visible: boolean) => boolean;
    setMovingPointNameVisible?: (id: string, visible: boolean) => boolean;
    setTrackSpeedPopoversVisible?: (id: string, visible: boolean) => boolean;
    setTrackNodeSpeedsVisible?: (id: string, visible: boolean) => boolean;
    setTrackNodeAnchorsVisible?: (id: string, visible: boolean) => boolean;
    hideTrack?: (id: string) => boolean;
    showTrack?: (id: string) => boolean;
    fitTrackToView?: (id: string, config: any) => void;
    setConfig?: (config: any) => void;
    getActiveImplementation?: () => any;
    getTrackPlayState?: (id: string) => 'playing' | 'paused' | 'stopped' | null;
    addTrack?: (track: Track) => boolean;
    getTrackTotalDistance?: (id: string) => number | null;
    getDistanceBetweenPoints?: (id: string, point1Index: number, point2Index: number) => number | null;
    getDistanceFromStart?: (id: string, pointIndex: number) => number | null;
    // 添加缺失的方法声明
    setTrackNodeDistanceVisible?: (id: string, visible: boolean) => boolean;
  };
  config?: {
    loop?: boolean;         // 是否循环播放
    speed?: number;         // 默认播放速度(km/h)
    withCamera?: boolean;   // 是否跟随相机
    speedFactor?: number;   // 速度因子
    showNodes?: boolean;    // 是否显示节点（静态点位）
    showNodeAnchors?: boolean; // 是否显示节点锚点
    showNodeNames?: boolean;// 是否显示节点名称（静态点位名称）
    showNodeTime?: boolean; // 是否显示节点时间
    showPointNames?: boolean;// 是否显示点位名称（移动点位名称）
    showSpeed?: boolean;    // 是否显示移动速度
    showNodeSpeed?: boolean;// 是否显示节点速度
    showNodeDistance?: boolean;// 是否显示节点距离
    updateFrequency?: number; // 更新频率(毫秒)，控制进度更新的时间间隔
  }
}

const props = defineProps<Props>();
const emit = defineEmits(['track-selected', 'track-deleted', 'collapse-change', 'close']);

// 播放器状态
const collapsed = ref(false);
const activeTrackId = ref<string | null>(null);
const playState = ref<'stopped' | 'playing' | 'paused'>('stopped');
const loopPlay = ref(false);
const followCamera = ref(false);
const showNodes = ref(true); // 是否显示轨迹节点，默认显示
const showNodeAnchors = ref(false); // 是否显示节点锚点，默认不显示
const showNodePopover = ref(true); // 是否显示节点名称(popover)，默认显示
const showNodeTime = ref(true); // 是否显示节点时间，默认显示
const showSpeedPopover = ref(true); // 是否显示速度弹窗，默认显示
const showNodeSpeed = ref(true); // 是否显示节点速度，默认显示
const showNodeDistance = ref(true); // 是否显示节点距离，默认显示
const showMovingPointName = ref(true); // 是否显示移动点位的名称，默认显示
const currentTime = ref(0);
const totalTime = ref(0);
const progressPercentage = ref(0);
const speedFactor = ref(1.0);
const isDraggingProgress = ref(false);
const currentSpeed = ref(0); // 当前轨迹点的速度
const showSettings = ref(false);
const enableSpeedIcon = ref(true);
const updateFrequency = ref(100); // 默认100毫秒更新一次，高频模式

// 计算属性：是否可以切换轨迹
const canSwitchTrack = computed(() => {
  return playState.value !== 'playing';
});

// 轨迹播放器样式配置
const trackPlayerConfig = {
  width: 320,
  height: 'auto',
  collapsedWidth: 40,
  collapsedHeight: 40,
  buttonSize: 24
};

// 计算轨迹播放器样式
const trackPlayerStyle = computed(() => {
  return {
    width: collapsed.value ? `${trackPlayerConfig.collapsedWidth}px` : `${trackPlayerConfig.width}px`,
    height: collapsed.value ? `${trackPlayerConfig.collapsedHeight}px` : trackPlayerConfig.height,
    transition: 'width 0.3s, height 0.3s, transform 0.3s',
    contain: 'layout style'
  };
});

// 轨迹数据
const tracks = ref(new Map<string, Track>());

// 图标
const icons = {
  trackPlay: TRACK_PLAY_ICON,
  trackPause: TRACK_PAUSE_ICON,
  trackBackward: TRACK_BACKWARD_ICON,
  trackForward: TRACK_FORWARD_ICON,
  trackDelete: TRACK_DELETE_ICON,
  trackFollowCamera: TRACK_FOLLOW_CAMERA_ICON
};

// 更新播放进度的计时器
let progressTimer: number | null = null;

// 刷新轨迹列表
const refreshTrackList = () => {
  if (props.trackObj && props.trackObj.getAllTracks) {
    try {
      // 保存当前选中的轨迹ID
      const currentActiveTrackId = activeTrackId.value;
      
      // 获取新的轨迹列表
      const allTracks = props.trackObj.getAllTracks();
      
      // 检查是否有新增轨迹
      if (allTracks.size !== tracks.value.size) {
        console.log('轨迹列表已更新，总数:', allTracks.size);
      }
      
      // 创建新的Map实例以触发Vue的响应式更新
      const newTracks = new Map();
      allTracks.forEach((track, id) => {
        newTracks.set(id, track);
      });
      
      // 更新轨迹列表 - 使用新Map实例而非直接赋值
      tracks.value = newTracks;
      
      console.log('轨迹列表已刷新，当前轨迹数:', tracks.value.size, '轨迹ID:', [...tracks.value.keys()]);
      
      // 如果之前有选中的轨迹，且该轨迹仍然存在，保持选中状态
      if (currentActiveTrackId && tracks.value.has(currentActiveTrackId)) {
        // 保持当前选中状态不变
        activeTrackId.value = currentActiveTrackId;
      }
    } catch (error) {
      console.error('刷新轨迹列表时发生错误:', error);
      // 出错时清空轨迹列表
      tracks.value = new Map();
    }
  }
};

// 停止进度更新计时器
const stopProgressTimer = () => {
  if (progressTimer !== null) {
    window.clearInterval(progressTimer);
    progressTimer = null;
  }
};

// 应用配置
const applyConfig = () => {
  if (props.config) {
    try {
      // 应用UI配置
      if (props.config.loop !== undefined) loopPlay.value = props.config.loop;
      if (props.config.withCamera !== undefined) followCamera.value = props.config.withCamera;
      if (props.config.speedFactor !== undefined) speedFactor.value = props.config.speedFactor;
      if (props.config.showNodes !== undefined) showNodes.value = props.config.showNodes;
      if (props.config.showNodeAnchors !== undefined) showNodeAnchors.value = props.config.showNodeAnchors;
      if (props.config.showNodeNames !== undefined) showNodePopover.value = props.config.showNodeNames;
      if (props.config.showNodeTime !== undefined) showNodeTime.value = props.config.showNodeTime;
      if (props.config.showPointNames !== undefined) showMovingPointName.value = props.config.showPointNames;
      if (props.config.showSpeed !== undefined) showSpeedPopover.value = props.config.showSpeed;
      if (props.config.showNodeSpeed !== undefined) showNodeSpeed.value = props.config.showNodeSpeed;
      if (props.config.updateFrequency !== undefined) updateFrequency.value = props.config.updateFrequency;
      
      console.log('轨迹播放器配置已应用:', JSON.stringify(props.config));
      
      // 如果有活动轨迹，且trackObj存在，应用配置到轨迹对象
      if (activeTrackId.value && props.trackObj) {
        // 检查每个方法是否存在，并应用配置
        const applyTrackSettings = () => {
          if (!activeTrackId.value) return;
          
          // 使用可选链确保方法存在
          props.trackObj.setTrackNodesVisible?.(activeTrackId.value, showNodes.value);
          props.trackObj.setTrackNodeAnchorsVisible?.(activeTrackId.value, showNodeAnchors.value);
          props.trackObj.setTrackNodePopoversVisible?.(activeTrackId.value, showNodePopover.value);
          props.trackObj.setTrackNodeTimeVisible?.(activeTrackId.value, showNodeTime.value);
          props.trackObj.setMovingPointNameVisible?.(activeTrackId.value, showMovingPointName.value);
          props.trackObj.setTrackSpeedPopoversVisible?.(activeTrackId.value, showSpeedPopover.value);
          props.trackObj.setTrackNodeSpeedsVisible?.(activeTrackId.value, showNodeSpeed.value);
          props.trackObj.setTrackNodeDistanceVisible?.(activeTrackId.value, showNodeDistance.value);
          
          // 设置播放配置
          props.trackObj.setTrackPlayer?.(activeTrackId.value, {
            loop: loopPlay.value,
            withCamera: followCamera.value,
            speedFactor: speedFactor.value
          });
        };
        
        // 应用轨迹设置
        applyTrackSettings();
      }
    } catch (error) {
      console.error('应用轨迹播放器配置时发生错误:', error);
    }
  }
};

// 组件挂载
onMounted(() => {
  // 应用外部配置
  applyConfig();
  
  if (props.trackObj) {
    refreshTrackList();
     
    // 监听自定义事件，当添加轨迹时强制刷新列表
    const trackPlayerElement = document.querySelector('.track-player');
    if (trackPlayerElement) {
      trackPlayerElement.addEventListener('track-added', (event: Event) => {
        console.log('收到轨迹添加事件，强制刷新列表');
        refreshTrackList();
      });
    }
    
    // 检查工具是否真的激活
    try {
      if (props.trackObj && typeof props.trackObj.getMapInstance === 'function') {
        const map = props.trackObj.getMapInstance();
        if (map) {
          // 尝试从DOM元素获取toolbarObj
          const targetElement = map.getTargetElement();
          if (targetElement && targetElement['toolbarObj']) {
            const toolbarObj = targetElement['toolbarObj'];
            const isTrackPlayerActive = toolbarObj.getTools().find(t => t.id === 'track-player')?.active || false;
            if (!isTrackPlayerActive) {
              console.warn('轨迹播放器组件挂载时发现工具未激活，可能需要关闭');
              emit('close');
            }
            
            // 将轨迹播放器组件引用保存到地图元素中，以便工具栏对象访问
            targetElement['trackPlayerComponent'] = getCurrentInstance()?.exposed;
            console.log('轨迹播放器组件引用已保存到地图元素');
          }
        }
      } else {
        console.warn('trackObj未定义或不包含getMapInstance方法，跳过检查工具激活状态');
      }
    } catch (error) {
      console.error('检查工具状态时发生错误:', error);
    }
  }
});

// 监听显示节点距离设置的变化
watch(showNodeDistance, (newValue) => {
  if (activeTrackId.value && props.trackObj && props.trackObj.setTrackNodeDistanceVisible) {
    props.trackObj.setTrackNodeDistanceVisible(activeTrackId.value, newValue);
  }
});

// 组件销毁前清理
onBeforeUnmount(() => {
  stopProgressTimer();
});

// 切换收缩/展开状态
const toggleCollapse = () => {
  // 更改折叠状态
  collapsed.value = !collapsed.value;
  
  // 使用 requestAnimationFrame 确保在下一帧动画开始前通知父组件
  // 这样可以避免在同一帧内的布局计算和重绘
  requestAnimationFrame(() => {
    // 通知父组件折叠状态变化
    emit('collapse-change', collapsed.value);
  });
};

// 格式化轨迹详情
const formatTrackDetail = (track: Track): string => {
  if (!track.points || track.points.length === 0) {
    return '无轨迹点';
  }
  
  const pointCount = track.points.length;
  const startTime = new Date(track.points[0].time * 1000).toLocaleString();
  const endTime = new Date(track.points[pointCount - 1].time * 1000).toLocaleString();
  
  // 计算轨迹总距离
  const totalDistance = calculateTotalDistance(track.points as TrackPoint[]);
  const formattedDistance = totalDistance.toFixed(2);
  
  return `${pointCount}个点 · ${formattedDistance}公里 · ${startTime} ~ ${endTime}`;
};

// 添加计算两点之间距离的辅助函数（哈弗赛因公式）
const calculateDistance = (lat1: number, lng1: number, lat2: number, lng2: number): number => {
  // 地球半径（公里）
  const R = 6371;
  
  // 将角度转换为弧度
  const toRad = (value: number) => (value * Math.PI) / 180;
  
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lng2 - lng1);
  const lat1Rad = toRad(lat1);
  const lat2Rad = toRad(lat2);
  
  // 哈弗赛因公式
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.sin(dLon / 2) * Math.sin(dLon / 2) * 
            Math.cos(lat1Rad) * Math.cos(lat2Rad);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  
  // 距离（公里）
  return R * c;
};

// 计算轨迹总距离
const calculateTotalDistance = (points: TrackPoint[]): number => {
  if (!points || points.length < 2) return 0;
  
  let totalDistance = 0;
  
  for (let i = 1; i < points.length; i++) {
    const prevPoint = points[i - 1];
    const currentPoint = points[i];
    
    // 计算相邻两点之间的距离
    const distance = calculateDistance(
      prevPoint.lat, prevPoint.lng,
      currentPoint.lat, currentPoint.lng
    );
    
    totalDistance += distance;
  }
  
  return totalDistance;
};

// 删除轨迹
const deleteTrack = (id: string) => {
  // 播放中不允许删除任何轨迹
  if (playState.value === 'playing') {
    console.warn('播放中无法删除轨迹');
    return;
  }
  
  if (props.trackObj && props.trackObj.removeTrack) {
    try {
      // 如果正在播放，先停止
      if (activeTrackId.value === id && playState.value !== 'stopped') {
        props.trackObj.stop?.(id);
      }
      
      // 删除轨迹
      props.trackObj.removeTrack(id);
      
      // 如果删除的是当前活动轨迹，清空活动轨迹
      if (activeTrackId.value === id) {
        activeTrackId.value = null;
        playState.value = 'stopped';
        stopProgressTimer();
      }
      
      // 刷新轨迹列表
      refreshTrackList();
      
      emit('track-deleted', id);
    } catch (error) {
      console.error('删除轨迹时发生错误:', error);
    }
  }
};

// 自适应显示轨迹（双击轨迹项时调用）
const fitToTrackView = (id: string) => {
  if (!props.trackObj || !props.trackObj.fitTrackToView) return;
  
  // 选中轨迹
  selectTrack(id);
  
  // 调用fitTrackToView方法自适应显示轨迹
  props.trackObj.fitTrackToView(id, {
    gotoStart: false,
    padding: [20, 20, 20, 20],
    duration: 500,
    maxZoom: 18
  });
  console.log(`自适应显示轨迹: ${id}`);
};

// 速度滑块输入事件处理函数
const onSpeedChange = () => {
  if (activeTrackId.value && props.trackObj) {
    // 立即应用新的速度
    props.trackObj.updateTrackSpeed?.(activeTrackId.value, speedFactor.value);
    
    // 同时更新轨迹播放器配置
    const playerConfig = {
      loop: loopPlay.value,
      withCamera: followCamera.value,
      speedFactor: speedFactor.value
    };
    
    // 先设置基本配置
    props.trackObj.setTrackPlayer?.(activeTrackId.value, playerConfig);
    
    // 无论播放状态如何，都确保立即应用新配置
    if (props.trackObj.updateTrackPlayer) {
      props.trackObj.updateTrackPlayer(activeTrackId.value, playerConfig);
      console.log(`轨迹播放速度已实时调整为: ${speedFactor.value.toFixed(1)}x`);
    }
  }
};

// 切换设置弹窗
const toggleSettings = () => {
  showSettings.value = !showSettings.value;
};

// 获取轨迹名称和总里程
const getTrackNameWithLength = (track: Track, trackId: string) => {
  if (!track) return '未知轨迹';
  
  // 计算轨迹总长度
  let totalDistance = '0.00';
  
  if (props.trackObj && typeof props.trackObj.getTrackTotalDistance === 'function' && trackId) {
    try {
      const distance = props.trackObj.getTrackTotalDistance(trackId);
      if (distance && distance > 0) {
        totalDistance = distance.toFixed(2);
      }
    } catch (error) {
      console.error('获取轨迹总长度失败:', error);
    }
  }
  
  return `${track.name || '未命名轨迹'} (${totalDistance}公里)`;
};

// 获取带距离信息的静态点
const getStaticPointsWithDistance = () => {
  // 如果没有活动轨迹或TrackObj对象，返回空数组
  if (!activeTrackId.value || !props.trackObj) return [];
  
  // 获取轨迹数据
  const track = tracks.value.get(activeTrackId.value);
  if (!track || !track.points || track.points.length < 2) return [];
  
  const result = [];
  
  // 遍历所有轨迹点，找出静态点（有staticTitle属性的点）
  for (let i = 1; i < track.points.length; i++) {
    const point = track.points[i];
    
    // 只处理静态点
    if (point.staticTitle) {
      // 计算与上一个点的距离
      let distance = 0;
      
      // 如果距离计算函数可用，使用它
      if (props.trackObj.getDistanceBetweenPoints) {
        try {
          const calculatedDistance = props.trackObj.getDistanceBetweenPoints(activeTrackId.value, i-1, i);
          if (calculatedDistance !== null) {
            distance = calculatedDistance;
          }
        } catch (error) {
          console.error('计算节点距离时出错:', error);
        }
      } else {
        // 回退到手动计算
        const prevPoint = track.points[i-1];
        distance = calculateDistance(
          prevPoint.lat, prevPoint.lng,
          point.lat, point.lng
        );
      }
      
      result.push({
        index: i,
        title: point.staticTitle,
        distance: distance
      });
    }
  }
  
  return result;
};

// 获取从起点到当前位置的距离
const getDistanceFromStart = () => {
  if (!activeTrackId.value || !props.trackObj) return 0;
  
  // 如果有专用方法可用，优先使用它
  if (props.trackObj.getDistanceFromStart) {
    try {
      const progress = props.trackObj.getTrackProgress?.(activeTrackId.value) || 0;
      const pointCount = tracks.value.get(activeTrackId.value)?.points?.length || 0;
      
      // 计算当前节点索引（基于播放进度）
      if (pointCount >= 2) {
        const currentIndex = Math.floor(progress * (pointCount - 1));
        const distance = props.trackObj.getDistanceFromStart(activeTrackId.value, currentIndex);
        if (distance !== null) return distance;
      }
    } catch (error) {
      console.error('计算起点距离时出错:', error);
    }
  }
  
  // 如果专用方法失败或不可用，回退到手动计算
  const track = tracks.value.get(activeTrackId.value);
  if (!track || !track.points || track.points.length < 2) return 0;
  
  const progress = props.trackObj.getTrackProgress?.(activeTrackId.value) || 0;
  const pointCount = track.points.length;
  
  // 计算当前节点索引
  if (pointCount < 2) return 0;
  
  const currentIndex = Math.floor(progress * (pointCount - 1));
  
  // 计算从起点到当前位置的距离
  let totalDistance = 0;
  for (let i = 1; i <= currentIndex; i++) {
    const prevPoint = track.points[i - 1];
    const currentPoint = track.points[i];
    
    totalDistance += calculateDistance(
      prevPoint.lat, prevPoint.lng,
      currentPoint.lat, currentPoint.lng
    );
  }
  
  return totalDistance;
};

// 获取到下一个点的距离
const getDistanceToNextPoint = () => {
  if (!activeTrackId.value || !props.trackObj) return 0;
  
  const track = tracks.value.get(activeTrackId.value);
  if (!track || !track.points || track.points.length < 2) return 0;
  
  const progress = props.trackObj.getTrackProgress?.(activeTrackId.value) || 0;
  const pointCount = track.points.length;
  
  // 计算当前节点索引
  if (pointCount < 2) return 0;
  
  const currentIndex = Math.floor(progress * (pointCount - 1));
  
  // 如果已经是最后一个点，返回0
  if (currentIndex >= pointCount - 1) return 0;
  
  // 获取当前点和下一个点
  const currentPoint = track.points[currentIndex];
  const nextPoint = track.points[currentIndex + 1];
  
  // 计算到下一个点的距离
  return calculateDistance(
    currentPoint.lat, currentPoint.lng,
    nextPoint.lat, nextPoint.lng
  );
};

// 选择轨迹
const selectTrack = (id: string) => {
  if (!id || !props.trackObj) return;
  
  try {
    // 停止当前播放中的轨迹
    if (activeTrackId.value && activeTrackId.value !== id && playState.value === 'playing') {
      props.trackObj.stop?.(activeTrackId.value);
    }
    
    // 设置新的活动轨迹
    activeTrackId.value = id;
    
    // 更新播放状态
    playState.value = 'stopped';
    
    // 应用当前的配置设置
    const playerConfig = {
      loop: loopPlay.value,
      withCamera: followCamera.value,
      speedFactor: speedFactor.value
    };
    props.trackObj.setTrackPlayer?.(id, playerConfig);
    
    // 应用节点显示设置
    props.trackObj.setTrackNodesVisible?.(id, showNodes.value);
    props.trackObj.setTrackNodeAnchorsVisible?.(id, showNodeAnchors.value);
    props.trackObj.setTrackNodePopoversVisible?.(id, showNodePopover.value);
    props.trackObj.setTrackNodeTimeVisible?.(id, showNodeTime.value);
    props.trackObj.setMovingPointNameVisible?.(id, showMovingPointName.value);
    props.trackObj.setTrackSpeedPopoversVisible?.(id, showSpeedPopover.value);
    props.trackObj.setTrackNodeSpeedsVisible?.(id, showNodeSpeed.value);
    props.trackObj.setTrackNodeDistanceVisible?.(id, showNodeDistance.value);
    
    // 获取轨迹的总时长
    const track = tracks.value.get(id);
    if (track && track.points && track.points.length >= 2) {
      const startTime = track.points[0].time;
      const endTime = track.points[track.points.length - 1].time;
      totalTime.value = endTime - startTime;
    } else {
      totalTime.value = 0;
    }
    
    currentTime.value = 0;
    progressPercentage.value = 0;
    
    // 通知父组件轨迹已选中
    emit('track-selected', id);
  } catch (error) {
    console.error('选择轨迹时发生错误:', error);
  }
};

// 设置播放速度
const setSpeed = (speed: number) => {
  speedFactor.value = speed;
  onSpeedChange();
};

// 切换播放/暂停
const togglePlay = () => {
  if (!activeTrackId.value || !props.trackObj) return;
  
  try {
    if (playState.value === 'playing') {
      // 暂停播放
      if (props.trackObj.pause && props.trackObj.pause(activeTrackId.value)) {
        playState.value = 'paused';
        stopProgressTimer();
      }
    } else {
      // 开始播放
      const config = {
        loop: loopPlay.value,
        withCamera: followCamera.value,
        speedFactor: speedFactor.value
      };
      
      // 根据播放状态决定是继续播放还是从头播放
      if (playState.value === 'paused' && props.trackObj.play) {
        props.trackObj.play(activeTrackId.value, config);
        playState.value = 'playing';
      } else if (props.trackObj.play) {
        // 从头开始播放
        props.trackObj.play(activeTrackId.value, config);
        playState.value = 'playing';
      }
      
      // 启动进度更新计时器
      startProgressTimer();
    }
  } catch (error) {
    console.error('切换播放状态时发生错误:', error);
  }
};

// 处理进度条点击
const handleProgressClick = (event: MouseEvent) => {
  if (!activeTrackId.value || !props.trackObj || !props.trackObj.setTrackProgress) return;
  
  // 获取进度条元素
  const progressBar = event.currentTarget as HTMLElement;
  if (!progressBar) return;
  
  // 计算点击位置相对于进度条的百分比
  const rect = progressBar.getBoundingClientRect();
  const clickX = event.clientX - rect.left;
  const percentage = Math.max(0, Math.min(1, clickX / rect.width));
  
  // 设置轨迹播放进度
  props.trackObj.setTrackProgress(activeTrackId.value, percentage);
  
  // 更新界面进度显示
  progressPercentage.value = percentage * 100;
  
  // 如果轨迹已选择，更新当前时间
  const track = tracks.value.get(activeTrackId.value);
  if (track && track.points && track.points.length >= 2) {
    const startTime = track.points[0].time;
    const endTime = track.points[track.points.length - 1].time;
    currentTime.value = startTime + (endTime - startTime) * percentage;
  }
};

// 开始拖动进度条
const startProgressDrag = (event: MouseEvent) => {
  if (!activeTrackId.value) return;
  
  isDraggingProgress.value = true;
  
  // 添加鼠标移动和松开事件监听
  const handleMouseMove = (moveEvent: MouseEvent) => {
    if (!isDraggingProgress.value) return;
    
    // 获取进度条元素
    const progressBar = (event.currentTarget as HTMLElement)?.parentElement as HTMLElement;
    if (!progressBar) return;
    
    // 计算鼠标位置相对于进度条的百分比
    const rect = progressBar.getBoundingClientRect();
    const moveX = moveEvent.clientX - rect.left;
    const percentage = Math.max(0, Math.min(1, moveX / rect.width));
    
    // 更新界面显示
    progressPercentage.value = percentage * 100;
  };
  
  const handleMouseUp = (upEvent: MouseEvent) => {
    if (!isDraggingProgress.value || !activeTrackId.value) return;
    
    // 获取进度条元素
    const progressBar = (event.currentTarget as HTMLElement)?.parentElement as HTMLElement;
    if (!progressBar) return;
    
    // 计算释放位置相对于进度条的百分比
    const rect = progressBar.getBoundingClientRect();
    const upX = upEvent.clientX - rect.left;
    const percentage = Math.max(0, Math.min(1, upX / rect.width));
    
    // 设置轨迹播放进度
    if (props.trackObj && props.trackObj.setTrackProgress) {
      props.trackObj.setTrackProgress(activeTrackId.value, percentage);
    }
    
    // 更新界面显示
    progressPercentage.value = percentage * 100;
    
    // 如果轨迹已选择，更新当前时间
    const track = tracks.value.get(activeTrackId.value);
    if (track && track.points && track.points.length >= 2) {
      const startTime = track.points[0].time;
      const endTime = track.points[track.points.length - 1].time;
      currentTime.value = startTime + (endTime - startTime) * percentage;
    }
    
    // 清理事件监听和状态
    isDraggingProgress.value = false;
    document.removeEventListener('mousemove', handleMouseMove);
    document.removeEventListener('mouseup', handleMouseUp);
  };
  
  // 添加全局事件监听
  document.addEventListener('mousemove', handleMouseMove);
  document.addEventListener('mouseup', handleMouseUp);
};

// 格式化时间，将秒数转换为mm:ss格式
const formatTime = (seconds: number): string => {
  if (!seconds || isNaN(seconds)) return '00:00';
  
  const totalSeconds = Math.floor(seconds);
  const minutes = Math.floor(totalSeconds / 60);
  const remainingSeconds = totalSeconds % 60;
  
  // 格式化为两位数，不足两位前面补零
  const formattedMinutes = String(minutes).padStart(2, '0');
  const formattedSeconds = String(remainingSeconds).padStart(2, '0');
  
  return `${formattedMinutes}:${formattedSeconds}`;
};

// 开始进度更新计时器
const startProgressTimer = () => {
  // 停止可能存在的计时器
  stopProgressTimer();
  
  // 创建新的计时器，定期更新进度
  progressTimer = window.setInterval(() => {
    if (!activeTrackId.value || !props.trackObj) return;
    
    try {
      // 获取当前播放进度
      const progress = props.trackObj.getTrackProgress?.(activeTrackId.value);
      if (progress !== null && progress !== undefined) {
        // 更新进度百分比
        progressPercentage.value = progress * 100;
        
        // 更新当前时间
        const track = tracks.value.get(activeTrackId.value);
        if (track && track.points && track.points.length >= 2) {
          const startTime = track.points[0].time;
          const endTime = track.points[track.points.length - 1].time;
          currentTime.value = startTime + (endTime - startTime) * progress;
        }
        
        // 获取当前速度
        if (props.trackObj.getCurrentSpeed) {
          const speed = props.trackObj.getCurrentSpeed(activeTrackId.value);
          if (speed !== null) {
            currentSpeed.value = speed;
          }
        }
        
        // 如果进度达到100%且未设置循环播放，则停止播放
        if (progress >= 0.999 && !loopPlay.value) {
          stopProgressTimer();
          playState.value = 'stopped';
        }
      }
    } catch (error) {
      console.error('更新进度时发生错误:', error);
    }
  }, updateFrequency.value);
};
</script>

<style scoped>
.track-player {
  position: absolute;
  top: 20px;
  right: 20px;
  background-color: rgba(255, 255, 255, 0.9);
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
  overflow: hidden;
  z-index: 1000;
  max-height: 60vh;
  display: flex;
  flex-direction: column;
}

/* 设置组样式 */
.settings-group {
  margin-bottom: 16px;
  border-bottom: 1px solid #eee;
  padding-bottom: 12px;
}

.settings-group:last-child {
  border-bottom: none;
  margin-bottom: 0;
  padding-bottom: 0;
}

.settings-group-title {
  font-weight: bold;
  margin-bottom: 8px;
  color: #333;
  font-size: 14px;
}

.settings-options {
  display: flex;
  flex-wrap: wrap;
}

.settings-option {
  display: flex;
  align-items: center;
  margin-right: 16px;
  margin-bottom: 8px;
  font-size: 13px;
  cursor: pointer;
  user-select: none;
}

/* 更新频率选项样式 */
.settings-option input[type="radio"] {
  margin-right: 5px;
}

.settings-option input[type="radio"]:checked + span {
  font-weight: bold;
  color: #1890ff;
}

/* 其他样式保持不变 */
.track-player-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 15px;
  background: linear-gradient(135deg, #1890ff, #096dd9);
  color: #fff;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.track-player.collapsed .track-player-header {
  padding: 0;
  height: 100%;
  border: none;
  background: transparent;
  display: flex;
  align-items: center;
  justify-content: center;
}

.track-player-title {
  font-size: 15px;
  font-weight: 600;
  color: #fff;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
}

.track-player.collapsed .track-player-title {
  display: none;
}

.track-player.collapsed .track-player-actions {
  display: none;
}

.track-player.collapsed .track-player-content {
  display: none;
}

.track-player-actions {
  display: flex;
  gap: 8px;
}

.track-player-setting-btn {
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

.track-player-setting-btn:hover {
  background: rgba(255, 255, 255, 0.3);
  transform: scale(1.05);
}

.setting-icon {
  font-size: 16px;
  color: #fff;
  line-height: 1;
  display: flex;
  align-items: center;
  justify-content: center;
}

.track-player-collapse-btn {
  background: rgba(255, 255, 255, 0.2);
  border: none;
  border-radius: 4px;
  width: 26px;
  height: 26px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: background-color 0.2s, transform 0.2s;
}

.track-player-collapse-btn:hover {
  background: rgba(255, 255, 255, 0.3);
  transform: scale(1.05);
}

.collapse-icon {
  font-size: 16px;
  color: #fff;
  line-height: 1;
  display: flex;
  align-items: center;
  justify-content: center;
}

.track-player-content {
  padding: 18px;
  background-color: #fff;
}

.track-list {
  margin-bottom: 18px;
}

.track-list-header {
  font-size: 14px;
  font-weight: 600;
  margin-bottom: 10px;
  color: #333;
  display: flex;
  align-items: center;
}

.track-list-header::before {
  content: "";
  display: inline-block;
  width: 4px;
  height: 16px;
  background: linear-gradient(to bottom, #1890ff, #096dd9);
  margin-right: 8px;
  border-radius: 2px;
}

.track-list-content {
  max-height: 200px;
  overflow-y: auto;
  border: 1px solid #e8e8e8;
  border-radius: 8px;
  box-shadow: inset 0 1px 3px rgba(0, 0, 0, 0.05);
}

.track-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 14px;
  border-bottom: 1px solid #f0f0f0;
  cursor: pointer;
  transition: all 0.2s;
}

.track-item:last-child {
  border-bottom: none;
}

.track-item:hover {
  background-color: #f5f5f5;
}

.track-item.active {
  background-color: #e6f7ff;
  border-left: 3px solid #1890ff;
}
.track-camera.active {
  background-color: #e6f7ff;
  border-left: 3px solid #1890ff;
}
.track-camera path{
  color: #000 !important;
}

.track-item.disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.track-item-info {
  flex: 1;
  min-width: 0;
}

.track-item-name {
  font-size: 14px;
  font-weight: 500;
  margin-bottom: 4px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  color: #333;
}

.track-item-detail {
  font-size: 12px;
  color: #8c8c8c;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.track-item-actions {
  display: flex;
  gap: 5px;
}

.track-item-delete-btn {
  background: none;
  border: none;
  cursor: pointer;
  padding: 4px;
  color: #999;
  border-radius: 4px;
  font-size: 14px;
  line-height: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
}

.track-item-delete-btn:hover {
  color: #ff4d4f;
  background-color: rgba(255, 77, 79, 0.1);
  transform: scale(1.1);
}

.track-item-delete-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  color: #d9d9d9;
  background-color: transparent;
  transform: none;
}

.track-item-delete-btn:disabled:hover {
  color: #d9d9d9;
  background-color: transparent;
  transform: none;
}

.track-list-empty {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100px;
  color: #999;
  font-size: 13px;
  background-color: #f9f9f9;
  border-radius: 8px;
}

.track-controls {
  display: flex;
  flex-direction: column;
  gap: 15px;
  background-color: #f9f9f9;
  border-radius: 10px;
  padding: 15px;
  box-shadow: inset 0 1px 3px rgba(0, 0, 0, 0.05);
}

.track-options {
  display: flex;
  gap: 18px;
  margin-bottom: 5px;
  background-color: rgba(255, 255, 255, 0.7);
  padding: 12px;
  border-radius: 8px;
}

.track-option {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  color: #444;
  cursor: pointer;
  user-select: none;
}

.track-option input[type="checkbox"] {
  appearance: none;
  -webkit-appearance: none;
  width: 16px;
  height: 16px;
  border: 2px solid #1890ff;
  border-radius: 3px;
  outline: none;
  cursor: pointer;
  position: relative;
  transition: all 0.2s;
}

.track-option input[type="checkbox"]:checked {
  background-color: #1890ff;
}

.track-option input[type="checkbox"]:checked:after {
  content: '';
  position: absolute;
  left: 4px;
  top: 1px;
  width: 4px;
  height: 8px;
  border: solid white;
  border-width: 0 2px 2px 0;
  transform: rotate(45deg);
}

.track-buttons {
  display: flex;
  justify-content: center;
  gap: 18px;
  margin: 5px 0;
}

.track-button {
  background: none;
  border: 1px solid #d9d9d9;
  border-radius: 50%;
  width: 44px;
  height: 44px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  color: #333;
  transition: all 0.2s cubic-bezier(0.175, 0.885, 0.32, 1.275);
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.05);
}

.track-button:hover:not(:disabled) {
  color: #1890ff;
  border-color: #1890ff;
  transform: scale(1.05);
  box-shadow: 0 4px 10px rgba(24, 144, 255, 0.15);
}

.track-button:disabled {
  color: #d9d9d9;
  cursor: not-allowed;
  opacity: 0.7;
  box-shadow: none;
}

.track-play {
  background-color: #f0f8ff;
  width: 54px;
  height: 54px;
}

.track-play:hover:not(:disabled) {
  background-color: #e6f7ff;
}

.track-progress {
  margin-top: 10px;
}

.track-progress-bar {
  height: 6px;
  background-color: #f0f0f0;
  border-radius: 3px;
  position: relative;
  margin-bottom: 8px;
  overflow: visible;
  box-shadow: inset 0 1px 2px rgba(0, 0, 0, 0.1);
  cursor: pointer;
}

.track-progress-filled {
  position: absolute;
  left: 0;
  top: 0;
  height: 100%;
  background: linear-gradient(to right, #1890ff, #36cfc9);
  border-radius: 3px;
  transition: width 0.1s linear;
}

.track-progress-handle {
  position: absolute;
  top: 50%;
  transform: translate(-50%, -50%);
  width: 12px;
  height: 12px;
  background-color: #fff;
  border: 2px solid #1890ff;
  border-radius: 50%;
  cursor: pointer;
  transition: transform 0.1s, box-shadow 0.1s;
  z-index: 10;
}

.track-progress-handle:hover,
.track-progress-handle.active {
  transform: translate(-50%, -50%) scale(1.2);
  box-shadow: 0 0 0 5px rgba(24, 144, 255, 0.2);
}

.track-progress-time {
  font-size: 12px;
  color: #666;
  text-align: center;
}

.collapsed-icon {
  position: absolute;
  top: 0px;
  left: 0;
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  font-size: 20px;
  font-weight: bold;
}

.playing-indicator {
  animation: pulse 1.5s infinite;
  transform-origin: center;
}

@keyframes pulse {
  0% {
    transform: scale(1);
    opacity: 1;
  }
  50% {
    transform: scale(1.2);
    opacity: 0.8;
  }
  100% {
    transform: scale(1);
    opacity: 1;
  }
}

.track-speed-control {
  display: flex;
  flex-direction: column;
  align-items: center;
  margin: 10px 0;
  background-color: rgba(255, 255, 255, 0.7);
  padding: 12px;
  border-radius: 8px;
}

.speed-label {
  font-size: 14px;
  font-weight: 600;
  color: #333;
  margin-bottom: 5px;
}

.speed-slider {
  width: 100%;
  height: 5px;
  -webkit-appearance: none;
  appearance: none;
  background: #e0e0e0;
  outline: none;
  border-radius: 3px;
  margin: 5px 0;
}

.speed-slider::-webkit-slider-thumb {
  -webkit-appearance: none;
  appearance: none;
  width: 16px;
  height: 16px;
  border-radius: 50%;
  background: #1890ff;
  cursor: pointer;
  transition: all 0.2s;
}

.speed-slider::-webkit-slider-thumb:hover {
  background: #40a9ff;
  transform: scale(1.2);
}

.speed-slider:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.speed-labels {
  display: flex;
  justify-content: space-between;
  width: 100%;
  font-size: 12px;
  color: #666;
  margin-top: 5px;
}

/* 当前速度显示样式 */
.track-current-speed {
  font-size: 12px;
  color: #1890ff;
  font-weight: 600;
  text-align: center;
  margin-top: 5px;
  padding: 3px 8px;
  background-color: rgba(24, 144, 255, 0.1);
  border-radius: 4px;
  display: inline-block;
  width: 100%;
}

/* 设置弹窗样式 */
.track-settings-modal {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 600;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: rgba(0, 0, 0, 0.5);
}

.track-settings-content {
  width: 280px;
  background-color: #fff;
  border-radius: 10px;
  box-shadow: 0 5px 20px rgba(0, 0, 0, 0.2);
  overflow: hidden;
}

.track-settings-header {
  padding: 12px 15px;
  background: linear-gradient(135deg, #1890ff, #096dd9);
  color: #fff;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.track-settings-header h3 {
  margin: 0;
  font-size: 16px;
  font-weight: 500;
}

.track-settings-close {
  font-size: 20px;
  line-height: 1;
  cursor: pointer;
  padding: 0 5px;
}

.track-settings-body {
  padding: 15px;
  max-height: 350px;
  overflow-y: auto;
}

.track-settings-footer {
  padding: 10px 15px;
  border-top: 1px solid #f0f0f0;
  text-align: right;
}

.settings-apply-btn {
  background-color: #1890ff;
  color: #fff;
  border: none;
  padding: 6px 16px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
  transition: background-color 0.2s;
}

.settings-apply-btn:hover {
  background-color: #40a9ff;
}

.settings-group {
  margin-bottom: 20px;
}

.settings-group:last-child {
  margin-bottom: 0;
}

.settings-group-title {
  font-size: 14px;
  font-weight: 600;
  margin-bottom: 10px;
  color: #333;
  position: relative;
  padding-left: 12px;
}

.settings-group-title::before {
  content: "";
  position: absolute;
  left: 0;
  top: 50%;
  transform: translateY(-50%);
  width: 4px;
  height: 16px;
  background: linear-gradient(to bottom, #1890ff, #096dd9);
  border-radius: 2px;
}

.settings-options {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
}

.settings-option {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  color: #444;
  cursor: pointer;
  user-select: none;
}

.settings-option input[type="checkbox"] {
  appearance: none;
  -webkit-appearance: none;
  width: 16px;
  height: 16px;
  border: 2px solid #1890ff;
  border-radius: 3px;
  outline: none;
  cursor: pointer;
  position: relative;
  transition: all 0.2s;
}

.settings-option input[type="checkbox"]:checked {
  background-color: #1890ff;
}

.settings-option input[type="checkbox"]:checked:after {
  content: '';
  position: absolute;
  left: 4px;
  top: 1px;
  width: 4px;
  height: 8px;
  border: solid white;
  border-width: 0 2px 2px 0;
  transform: rotate(45deg);
}

.settings-option.disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.settings-option.disabled input[type="checkbox"] {
  cursor: not-allowed;
}

@keyframes pulse-border {
  0% {
    box-shadow: 0 0 0 0 rgba(24, 144, 255, 0.7);
  }
  70% {
    box-shadow: 0 0 0 6px rgba(24, 144, 255, 0);
  }
  100% {
    box-shadow: 0 0 0 0 rgba(24, 144, 255, 0);
  }
}
</style> 