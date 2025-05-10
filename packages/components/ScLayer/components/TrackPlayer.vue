<!-- 轨迹播放器组件 -->
<template>
  <div class="track-player" :class="{ 'collapsed': collapsed }" :style="trackPlayerStyle" @click="collapsed && toggleCollapse()">
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
            <span v-if="collapsed">+</span>
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
                <input type="checkbox" v-model="showNodeSpeed">
                <span>节点速度</span>
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
      <span>+</span>
    </div>
    
    <!-- 播放器主体内容 -->
    <div class="track-player-content" v-show="!collapsed">
      <!-- 轨迹列表 -->
      <div class="track-list">
        <div class="track-list-header">
          <span>轨迹列表</span>
        </div>
        <div class="track-list-content" v-if="tracks.size > 0">
          <div v-for="[id, track] in tracks" :key="id" class="track-item" 
            :class="{ 'active': activeTrackId === id, 'disabled': playState === 'playing' && activeTrackId !== id }"
            @click="canSwitchTrack && selectTrack(id)">
            <div class="track-item-info">
              <div class="track-item-name">{{ track.name || '未命名轨迹' }}</div>
              <div class="track-item-detail">{{ formatTrackDetail(track) }}</div>
            </div>
            <div class="track-item-actions">
              <button class="track-item-delete-btn" 
                @click.stop="deleteTrack(id)" 
                :disabled="playState === 'playing'"
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
          <input 
            type="range" 
            min="0.5" 
            max="10" 
            step="0.5" 
            v-model.number="speedFactor"
            class="speed-slider"
            :disabled="!activeTrackId"
          >
          <div class="speed-labels">
            <span>慢</span>
            <span>正常</span>
            <span>快</span>
          </div>
        </div>
        
        <!-- 播放按钮 -->
        <div class="track-buttons">
          <button class="track-button track-backward" @click="setSpeed(Math.max(0.5, speedFactor - 0.5))"
            :disabled="!activeTrackId || playState !== 'playing'" title="减速">
            <span v-html="icons.trackBackward"></span>
          </button>
          
          <button class="track-button track-play" @click="togglePlay()" :disabled="!activeTrackId" title="播放/暂停">
            <span v-if="playState === 'playing'" v-html="icons.trackPause"></span>
            <span v-else v-html="icons.trackPlay"></span>
          </button>
          
          <button class="track-button track-forward" @click="setSpeed(Math.min(10, speedFactor + 0.5))"
            :disabled="!activeTrackId || playState !== 'playing'" title="加速">
            <span v-html="icons.trackForward"></span>
          </button>
        </div>
        
        <!-- 播放进度 -->
        <div class="track-progress" v-if="activeTrackId">
          <div class="track-progress-bar" @click="handleProgressClick">
            <div class="track-progress-filled" :style="{ width: progressPercentage + '%' }"></div>
            <div class="track-progress-handle" 
                 :style="{ left: progressPercentage + '%' }"
                 @mousedown="startProgressDrag"
                 :class="{ 'active': isDraggingProgress }"></div>
          </div>
          <div class="track-progress-time">
            {{ formatTime(currentTime) }} / {{ formatTime(totalTime) }}
          </div>
          <!-- 当前速度显示 -->
          <div class="track-current-speed" v-if="currentSpeed > 0">
            当前速度: {{ currentSpeed.toFixed(1) }} km/h
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
import { ref, computed, watch, onMounted, onBeforeUnmount, watchEffect } from 'vue';
import { Track, TrackPlayer as TrackPlayerConfig } from '../types/track';
import { 
  TRACK_PLAY_ICON, 
  TRACK_PAUSE_ICON, 
  TRACK_BACKWARD_ICON, 
  TRACK_FORWARD_ICON, 
  TRACK_DELETE_ICON 
} from '../types/icon';

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
    setMovingPointNameVisible?: (id: string, visible: boolean) => boolean;
    setTrackSpeedPopoversVisible?: (id: string, visible: boolean) => boolean;
    setTrackNodeSpeedsVisible?: (id: string, visible: boolean) => boolean;
    setTrackNodeAnchorsVisible?: (id: string, visible: boolean) => boolean;
  };
  config?: {
    loop?: boolean;         // 是否循环播放
    speed?: number;         // 默认播放速度(km/h)
    withCamera?: boolean;   // 是否跟随相机
    speedFactor?: number;   // 速度因子
    showNodes?: boolean;    // 是否显示节点（静态点位）
    showNodeAnchors?: boolean; // 是否显示节点锚点
    showNodeNames?: boolean;// 是否显示节点名称（静态点位名称）
    showPointNames?: boolean;// 是否显示点位名称（移动点位名称）
    showSpeed?: boolean;    // 是否显示移动速度
    showNodeSpeed?: boolean;// 是否显示节点速度
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
const showNodes = ref(false); // 是否显示轨迹节点，默认不显示
const showNodeAnchors = ref(false); // 是否显示节点锚点，默认不显示
const showNodePopover = ref(false); // 是否显示节点名称(popover)，默认不显示
const showSpeedPopover = ref(true); // 是否显示速度弹窗，默认显示
const showNodeSpeed = ref(true); // 是否显示节点速度，默认显示
const showMovingPointName = ref(true); // 是否显示移动点位的名称，默认显示
const currentTime = ref(0);
const totalTime = ref(0);
const progressPercentage = ref(0);
const speedFactor = ref(1.0);
const isDraggingProgress = ref(false);
const currentSpeed = ref(0); // 当前轨迹点的速度
const showSettings = ref(false);

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
  trackDelete: TRACK_DELETE_ICON
};

// 更新播放进度的计时器
let progressTimer: number | null = null;

// 刷新轨迹列表
const refreshTrackList = () => {
  if (props.trackObj) {
    try {
      // 检查trackObj是否有getAllTracks方法
      if (typeof props.trackObj.getAllTracks === 'function') {
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
      } else {
        console.warn('trackObj没有getAllTracks方法，无法刷新轨迹列表');
        // 如果没有getAllTracks方法，清空轨迹列表
        tracks.value = new Map();
      }
    } catch (error) {
      console.error('刷新轨迹列表时发生错误:', error);
      // 出错时清空轨迹列表
      tracks.value = new Map();
    }
  }
};

// 组件挂载
onMounted(() => {
  // 应用外部配置
  if (typeof applyConfig === 'function') {
    applyConfig();
  }
  
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
      // 首先检查trackObj是否有getMapInstance方法
      if (typeof props.trackObj.getMapInstance === 'function') {
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
          }
        }
      } else {
        console.warn('trackObj没有getMapInstance方法，无法检查工具状态');
      }
    } catch (error) {
      console.error('检查工具状态时发生错误:', error);
    }
  }
});

// 监听config变化，动态应用新配置
watch(() => props.config, () => {
  console.log('轨迹播放器配置变化，重新应用配置');
  applyConfig();
  
  // 如果有活动轨迹，对活动轨迹应用新的显示设置
  if (activeTrackId.value && props.trackObj) {
    // 应用节点显示设置
    props.trackObj.setTrackNodesVisible(activeTrackId.value, showNodes.value);
    props.trackObj.setTrackNodePopoversVisible(activeTrackId.value, showNodePopover.value);
    props.trackObj.setMovingPointNameVisible(activeTrackId.value, showMovingPointName.value);
    props.trackObj.setTrackSpeedPopoversVisible(activeTrackId.value, showSpeedPopover.value);
    props.trackObj.setTrackNodeSpeedsVisible(activeTrackId.value, showNodeSpeed.value);
    
    // 更新播放配置
    props.trackObj.setTrackPlayer(activeTrackId.value, {
      loop: loopPlay.value,
      withCamera: followCamera.value,
      speedFactor: speedFactor.value
    });
  }
}, { deep: true });

// 监听props.trackObj变化，实时刷新轨迹列表
watch(() => props.trackObj, (newTrackObj) => {
  if (newTrackObj) {
    refreshTrackList();
  }
}, { deep: true, immediate: true });

// 监听props.trackObj.getAllTracks()的结果，当轨迹数据变化时刷新列表
// 由于无法直接监听对象方法的返回值，采用副作用函数定期检查
watchEffect(() => {
  if (props.trackObj) {
    // 获取当前轨迹数据
    const allTracks = props.trackObj.getAllTracks();
    const tracksCount = allTracks.size;
    
    // 使用多种条件检测轨迹列表是否变化
    if (
      tracksCount !== tracks.value.size || // 数量不同
      JSON.stringify([...allTracks.keys()].sort()) !== JSON.stringify([...tracks.value.keys()].sort()) // ID不同
    ) {
      console.log('检测到轨迹列表变化，刷新列表', tracksCount, tracks.value.size);
      refreshTrackList();
    }
  }
});

// 组件销毁前清理
onBeforeUnmount(() => {
  stopProgressTimer();
});

// 切换收缩/展开状态
const toggleCollapse = () => {
  // 如果正在播放轨迹，先暂停播放以减少资源占用
  if (activeTrackId.value && playState.value === 'playing') {
    // 仅在需要折叠时暂停播放
    if (!collapsed.value) {
      props.trackObj.pause(activeTrackId.value);
      playState.value = 'paused';
      stopProgressTimer();
    }
  }
  
  // 更改折叠状态
  collapsed.value = !collapsed.value;
  
  // 使用 requestAnimationFrame 确保在下一帧动画开始前通知父组件
  // 这样可以避免在同一帧内的布局计算和重绘
  requestAnimationFrame(() => {
    // 通知父组件折叠状态变化
    emit('collapse-change', collapsed.value);
  });
};

// 监听播放配置变化 - 循环播放和跟随相机
watch([loopPlay, followCamera], ([newLoop, newFollowCamera]) => {
  // 如果有活动轨迹，实时更新播放配置
  if (activeTrackId.value) {
    const playerConfig: Partial<TrackPlayerConfig> = {
      loop: newLoop,
      withCamera: newFollowCamera
    };
    
    // 如果正在播放，立即应用新设置
    if (playState.value === 'playing') {
      props.trackObj.updateTrackPlayer(activeTrackId.value, playerConfig);
    } else {
      // 存储配置，以便下次播放时使用
      props.trackObj.setTrackPlayer(activeTrackId.value, playerConfig);
    }
  }
});

// 监听速度因子变化
watch(speedFactor, (newSpeedFactor) => {
  if (activeTrackId.value) {
    props.trackObj.setTrackSpeedFactor(activeTrackId.value, newSpeedFactor);
    
    // 如果正在播放，需要通知TrackObject应用新的速度
    if (playState.value === 'playing') {
      // 更新播放速度但不重启播放
      props.trackObj.updateTrackSpeed(activeTrackId.value, newSpeedFactor);
    }
  }
});

// 监听显示节点设置的变化
watch(showNodes, (newValue) => {
  if (activeTrackId.value && props.trackObj) {
    props.trackObj.setTrackNodesVisible(activeTrackId.value, newValue);
  }
});

// 监听显示节点锚点设置的变化
watch(showNodeAnchors, (newValue) => {
  if (activeTrackId.value && props.trackObj && showNodes.value) {
    props.trackObj.setTrackNodeAnchorsVisible(activeTrackId.value, newValue);
  }
});

// 监听显示节点名称设置的变化
watch(showNodePopover, (newValue) => {
  if (activeTrackId.value && props.trackObj) {
    props.trackObj.setTrackNodePopoversVisible(activeTrackId.value, newValue);
  }
});

// 监听显示速度弹窗设置的变化
watch(showSpeedPopover, (newValue) => {
  if (activeTrackId.value && props.trackObj) {
    props.trackObj.setTrackSpeedPopoversVisible(activeTrackId.value, newValue);
  }
});

// 监听显示节点速度设置的变化
watch(showNodeSpeed, (newValue) => {
  if (activeTrackId.value && props.trackObj) {
    props.trackObj.setTrackNodeSpeedsVisible(activeTrackId.value, newValue);
  }
});

// 监听显示移动点位名称设置的变化
watch(showMovingPointName, (newValue) => {
  if (activeTrackId.value && props.trackObj) {
    props.trackObj.setMovingPointNameVisible(activeTrackId.value, newValue);
  }
});

// 选择轨迹
const selectTrack = (id: string) => {
  // 如果当前正在播放，不允许切换轨迹
  if (playState.value === 'playing') {
    console.warn('播放中无法切换轨迹');
    return;
  }
  
  // 如果选择的是当前轨迹，不做任何操作
  if (activeTrackId.value === id) {
    return;
  }
  
  // 如果已经选择了其他轨迹，先停止播放
  if (activeTrackId.value && activeTrackId.value !== id && playState.value !== 'stopped') {
    props.trackObj.stop(activeTrackId.value);
  }
  
  // 如果已有选中的轨迹且不是当前选择的轨迹，隐藏之前的轨迹
  if (activeTrackId.value && activeTrackId.value !== id) {
    props.trackObj.hideTrack(activeTrackId.value);
  }
  
  // 设置新的活动轨迹
  activeTrackId.value = id;
  playState.value = 'stopped'; // 重置播放状态
  
  // 显示选中的轨迹
  props.trackObj.showTrack(id);
  
  // 计算轨迹总时长
  const track = tracks.value.get(id);
  if (track && track.points.length >= 2) {
    const startTime = track.points[0].time;
    const endTime = track.points[track.points.length - 1].time;
    totalTime.value = endTime - startTime;
    currentTime.value = 0;
    progressPercentage.value = 0;
  }
  
  // 应用参数设置
  if (props.trackObj && id) {
    // 从全局配置或当前UI状态获取显示设置
    const nodeVisible = props.config?.showNodes !== undefined ? props.config.showNodes : showNodes.value;
    const nodeAnchorsVisible = props.config?.showNodeAnchors !== undefined ? props.config.showNodeAnchors : showNodeAnchors.value;
    const nodeNameVisible = props.config?.showNodeNames !== undefined ? props.config.showNodeNames : showNodePopover.value;
    const speedVisible = props.config?.showSpeed !== undefined ? props.config.showSpeed : showSpeedPopover.value;
    const nodeSpeedVisible = props.config?.showNodeSpeed !== undefined ? props.config.showNodeSpeed : showNodeSpeed.value;
    const movingPointNameVisible = props.config?.showPointNames !== undefined ? props.config.showPointNames : showMovingPointName.value;
    
    // 应用显示设置
    props.trackObj.setTrackNodesVisible(id, nodeVisible);
    props.trackObj.setTrackNodeAnchorsVisible(id, nodeAnchorsVisible);
    props.trackObj.setTrackNodePopoversVisible(id, nodeNameVisible);
    props.trackObj.setTrackSpeedPopoversVisible(id, speedVisible);
    props.trackObj.setTrackNodeSpeedsVisible(id, nodeSpeedVisible);
    props.trackObj.setMovingPointNameVisible(id, movingPointNameVisible);
    
    // 从全局配置或当前UI状态获取播放配置
    const loop = props.config?.loop !== undefined ? props.config.loop : loopPlay.value;
    const withCamera = props.config?.withCamera !== undefined ? props.config.withCamera : followCamera.value;
    const speed = props.config?.speed !== undefined ? props.config.speed : 50;
    const speedFct = props.config?.speedFactor !== undefined ? props.config.speedFactor : speedFactor.value;
    
    // 应用播放器设置
    props.trackObj.setTrackPlayer(id, {
      loop: loop,
      withCamera: withCamera,
      speed: speed, // 基础速度
      speedFactor: speedFct
    });
    
    // 设置播放速度因子
    props.trackObj.setTrackSpeedFactor(id, speedFct);
    
    // 同步UI控件状态
    loopPlay.value = loop;
    followCamera.value = withCamera;
    showNodes.value = nodeVisible;
    showNodePopover.value = nodeNameVisible;
    showSpeedPopover.value = speedVisible;
    showNodeSpeed.value = nodeSpeedVisible;
    showMovingPointName.value = movingPointNameVisible;
    speedFactor.value = speedFct;
  }
  
  emit('track-selected', id);
};

// 删除轨迹
const deleteTrack = (id: string) => {
  // 播放中不允许删除任何轨迹
  if (playState.value === 'playing') {
    console.warn('播放中无法删除轨迹');
    return;
  }
  
  if (props.trackObj) {
    try {
      // 如果正在播放，先停止
      if (activeTrackId.value === id && playState.value !== 'stopped') {
        if (typeof props.trackObj.stop === 'function') {
          props.trackObj.stop(id);
        } else {
          console.warn('trackObj没有stop方法，无法停止播放');
        }
      }
      
      // 删除轨迹
      if (typeof props.trackObj.removeTrack === 'function') {
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
      } else {
        console.warn('trackObj没有removeTrack方法，无法删除轨迹');
      }
    } catch (error) {
      console.error('删除轨迹时发生错误:', error);
    }
  }
};

// 播放/暂停切换
const togglePlay = () => {
  if (!activeTrackId.value || !props.trackObj) return;
  
  try {
    if (playState.value === 'playing') {
      // 暂停播放
      if (typeof props.trackObj.pause === 'function') {
        props.trackObj.pause(activeTrackId.value);
        playState.value = 'paused';
        stopProgressTimer();
      } else {
        console.warn('trackObj没有pause方法，无法暂停播放');
      }
    } else {
      // 获取最新配置参数
      const loop = props.config?.loop !== undefined ? props.config.loop : loopPlay.value;
      const withCamera = props.config?.withCamera !== undefined ? props.config.withCamera : followCamera.value;
      const speed = props.config?.speed !== undefined ? props.config.speed : 50;
      const speedFct = props.config?.speedFactor !== undefined ? props.config.speedFactor : speedFactor.value;
      
      // 开始播放
      const playerConfig: Partial<TrackPlayerConfig> = {
        loop: loop,
        withCamera: withCamera,
        speed: speed, // 基础速度
        speedFactor: speedFct
      };
      
      // 同步UI状态
      loopPlay.value = loop;
      followCamera.value = withCamera;
      speedFactor.value = speedFct;
      
      // 如果是从暂停状态恢复，不需要重新设置进度
      if (typeof props.trackObj.play === 'function') {
        props.trackObj.play(activeTrackId.value, playerConfig);
        
        // 使用updateTrackSpeed方法而不是setTrackSpeedFactor，确保速度变化能立即生效
        if (typeof props.trackObj.updateTrackSpeed === 'function') {
          props.trackObj.updateTrackSpeed(activeTrackId.value, speedFct);
        }
        
        playState.value = 'playing';
        
        // 开始进度更新计时器
        startProgressTimer();
      } else {
        console.warn('trackObj没有play方法，无法开始播放');
      }
    }
  } catch (error) {
    console.error('切换播放状态时发生错误:', error);
  }
};

// 设置播放速度
const setSpeed = (factor: number) => {
  if (!activeTrackId.value || playState.value !== 'playing') return;
  
  // 设置新的速度因子
  speedFactor.value = factor;
  
  // 应用新速度因子 - 使用updateTrackSpeed而不是setTrackSpeedFactor
  props.trackObj.updateTrackSpeed(activeTrackId.value, factor);
};

// 处理进度条点击
const handleProgressClick = (e: MouseEvent) => {
  if (!activeTrackId.value || !props.trackObj) return;
  
  try {
    // 获取进度条元素
    const progressBar = e.currentTarget as HTMLElement;
    if (!progressBar) return;
    
    // 计算新进度
    const rect = progressBar.getBoundingClientRect();
    let progress = (e.clientX - rect.left) / rect.width;
    
    // 限制进度范围
    progress = Math.max(0, Math.min(1, progress));
    
    // 更新进度
    updateProgress(progress);
    
    // 设置轨迹进度
    if (typeof props.trackObj.setTrackProgress === 'function') {
      props.trackObj.setTrackProgress(activeTrackId.value, progress);
    } else {
      console.warn('trackObj没有setTrackProgress方法，无法设置进度');
    }
  } catch (error) {
    console.error('设置轨迹进度时发生错误:', error);
  }
};

// 开始拖动进度条
const startProgressDrag = (e: MouseEvent) => {
  if (!activeTrackId.value) return;
  
  // 标记开始拖动
  isDraggingProgress.value = true;
  
  // 暂停播放
  const wasPlaying = playState.value === 'playing';
  if (wasPlaying) {
    props.trackObj.pause(activeTrackId.value);
    playState.value = 'paused';
  }
  
  // 计算并设置新进度
  handleProgressDrag(e);
  
  // 添加鼠标移动和松开事件
  const handleMouseMove = (moveEvent: MouseEvent) => {
    handleProgressDrag(moveEvent);
  };
  
  const handleMouseUp = () => {
    // 移除事件监听
    document.removeEventListener('mousemove', handleMouseMove);
    document.removeEventListener('mouseup', handleMouseUp);
    
    // 恢复播放
    if (wasPlaying) {
      props.trackObj.play(activeTrackId.value!, {
        loop: loopPlay.value,
        withCamera: followCamera.value,
        speed: 50,
        speedFactor: speedFactor.value
      });
      playState.value = 'playing';
    }
    
    // 标记拖动结束
    isDraggingProgress.value = false;
  };
  
  document.addEventListener('mousemove', handleMouseMove);
  document.addEventListener('mouseup', handleMouseUp);
};

// 处理进度条拖动
const handleProgressDrag = (e: MouseEvent) => {
  if (!activeTrackId.value) return;
  
  // 获取进度条元素
  const progressBar = document.querySelector('.track-progress-bar') as HTMLElement;
  if (!progressBar) return;
  
  // 计算新进度
  const rect = progressBar.getBoundingClientRect();
  let progress = (e.clientX - rect.left) / rect.width;
  
  // 限制进度范围
  progress = Math.max(0, Math.min(1, progress));
  
  // 更新进度UI
  updateProgress(progress);
  
  // 设置轨迹进度
  props.trackObj.setTrackProgress(activeTrackId.value, progress);
};

// 开始进度更新计时器
const startProgressTimer = () => {
  // 防止重复启动计时器
  stopProgressTimer();
  
  // 每100毫秒更新一次进度
  progressTimer = window.setInterval(() => {
    if (activeTrackId.value && props.trackObj) {
      try {
        // 获取当前进度
        if (typeof props.trackObj.getTrackProgress === 'function') {
          const progress = props.trackObj.getTrackProgress(activeTrackId.value);
          if (progress !== null) {
            updateProgress(progress);
            
            // 获取当前速度
            if (typeof props.trackObj.getCurrentSpeed === 'function') {
              const speed = props.trackObj.getCurrentSpeed(activeTrackId.value);
              if (speed !== null) {
                currentSpeed.value = speed;
              }
            }
            
            // 如果进度为1且不是循环播放，停止计时器
            if (progress >= 1 && !loopPlay.value) {
              playState.value = 'stopped';
              stopProgressTimer();
            }
          }
        } else {
          console.warn('trackObj没有getTrackProgress方法，无法更新进度');
          stopProgressTimer();
        }
      } catch (error) {
        console.error('更新进度时发生错误:', error);
        stopProgressTimer();
      }
    }
  }, 100);
};

// 停止进度更新计时器
const stopProgressTimer = () => {
  if (progressTimer !== null) {
    window.clearInterval(progressTimer);
    progressTimer = null;
  }
};

// 更新进度UI
const updateProgress = (progress: number) => {
  progressPercentage.value = progress * 100;
  
  if (activeTrackId.value) {
    const track = tracks.value.get(activeTrackId.value);
    if (track && track.points.length >= 2) {
      const startTime = track.points[0].time;
      const endTime = track.points[track.points.length - 1].time;
      const totalDuration = endTime - startTime;
      currentTime.value = startTime + totalDuration * progress;
    }
  }
};

// 格式化轨迹详情
const formatTrackDetail = (track: Track): string => {
  if (!track.points || track.points.length === 0) {
    return '无轨迹点';
  }
  
  const pointCount = track.points.length;
  const startTime = new Date(track.points[0].time * 1000).toLocaleString();
  const endTime = new Date(track.points[pointCount - 1].time * 1000).toLocaleString();
  
  return `${pointCount}个点 · ${startTime} ~ ${endTime}`;
};

// 格式化时间
const formatTime = (time: number): string => {
  // 格式化为 HH:MM:SS
  const date = new Date(time * 1000);
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
};

// 暴露方法供父组件调用
defineExpose({
  refreshTrackList,
  play: (id: string) => {
    if (id && tracks.value.has(id)) {
      selectTrack(id);
      togglePlay();
    }
  },
  pause: () => {
    if (activeTrackId.value && playState.value === 'playing') {
      togglePlay();
    }
  },
  stop: () => {
    if (activeTrackId.value) {
      props.trackObj.stop(activeTrackId.value);
      playState.value = 'stopped';
      stopProgressTimer();
    }
  },
  setSpeed: (factor: number) => {
    speedFactor.value = Math.max(0.5, Math.min(5, factor));
    if (activeTrackId.value && playState.value === 'playing') {
      props.trackObj.setTrackSpeedFactor(activeTrackId.value, speedFactor.value);
    }
  },
  getActiveTrackId: () => activeTrackId.value,
  getPlayState: () => playState.value,
  setShowNodes: (show: boolean) => {
    showNodes.value = show;
    if (activeTrackId.value && props.trackObj) {
      props.trackObj.setTrackNodesVisible(activeTrackId.value, show);
    }
  },
  setShowNodeAnchors: (show: boolean) => {
    showNodeAnchors.value = show;
    if (activeTrackId.value && props.trackObj && showNodes.value) {
      props.trackObj.setTrackNodeAnchorsVisible(activeTrackId.value, show);
    }
  },
  setShowNodePopovers: (show: boolean) => {
    showNodePopover.value = show;
    if (activeTrackId.value && props.trackObj) {
      props.trackObj.setTrackNodePopoversVisible(activeTrackId.value, show);
    }
  },
  setShowSpeedPopovers: (show: boolean) => {
    showSpeedPopover.value = show;
    if (activeTrackId.value && props.trackObj) {
      props.trackObj.setTrackSpeedPopoversVisible(activeTrackId.value, show);
    }
  },
  setShowNodeSpeeds: (show: boolean) => {
    showNodeSpeed.value = show;
    if (activeTrackId.value && props.trackObj) {
      props.trackObj.setTrackNodeSpeedsVisible(activeTrackId.value, show);
    }
  },
  setShowMovingPointName: (show: boolean) => {
    showMovingPointName.value = show;
    if (activeTrackId.value && props.trackObj) {
      props.trackObj.setMovingPointNameVisible(activeTrackId.value, show);
    }
  },
  getCurrentSpeed: () => currentSpeed.value
});

// 切换设置弹窗
const toggleSettings = () => {
  showSettings.value = !showSettings.value;
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
      if (props.config.showPointNames !== undefined) showMovingPointName.value = props.config.showPointNames;
      if (props.config.showSpeed !== undefined) showSpeedPopover.value = props.config.showSpeed;
      if (props.config.showNodeSpeed !== undefined) showNodeSpeed.value = props.config.showNodeSpeed;
      
      console.log('轨迹播放器配置已应用:', JSON.stringify(props.config));
      
      // 如果有活动轨迹，且trackObj存在，应用配置到轨迹对象
      if (activeTrackId.value && props.trackObj) {
        // 检查每个方法是否存在，并应用配置
        const applyTrackSettings = () => {
          if (!activeTrackId.value) return;
          
          // 设置轨迹节点显示状态
          if (typeof props.trackObj.setTrackNodesVisible === 'function') {
            props.trackObj.setTrackNodesVisible(activeTrackId.value, showNodes.value);
          }
          
          // 设置轨迹节点锚点显示状态
          if (typeof props.trackObj.setTrackNodeAnchorsVisible === 'function') {
            props.trackObj.setTrackNodeAnchorsVisible(activeTrackId.value, showNodeAnchors.value);
          }
          
          // 设置节点名称显示状态
          if (typeof props.trackObj.setTrackNodePopoversVisible === 'function') {
            props.trackObj.setTrackNodePopoversVisible(activeTrackId.value, showNodePopover.value);
          }
          
          // 设置移动点位名称显示状态
          if (typeof props.trackObj.setMovingPointNameVisible === 'function') {
            props.trackObj.setMovingPointNameVisible(activeTrackId.value, showMovingPointName.value);
          }
          
          // 设置速度弹窗显示状态
          if (typeof props.trackObj.setTrackSpeedPopoversVisible === 'function') {
            props.trackObj.setTrackSpeedPopoversVisible(activeTrackId.value, showSpeedPopover.value);
          }
          
          // 设置节点速度显示状态
          if (typeof props.trackObj.setTrackNodeSpeedsVisible === 'function') {
            props.trackObj.setTrackNodeSpeedsVisible(activeTrackId.value, showNodeSpeed.value);
          }
          
          // 设置播放配置
          if (typeof props.trackObj.setTrackPlayer === 'function') {
            props.trackObj.setTrackPlayer(activeTrackId.value, {
              loop: loopPlay.value,
              withCamera: followCamera.value,
              speedFactor: speedFactor.value
            });
          }
        };
        
        // 应用轨迹设置
        applyTrackSettings();
      }
    } catch (error) {
      console.error('应用轨迹播放器配置时发生错误:', error);
    }
  }
};
</script>

<style scoped>
.track-player {
  position: absolute;
  right: 10px;
  top: 10px;
  width: 320px;
  background-color: #fff;
  border-radius: 10px;
  box-shadow: 0 3px 15px rgba(0, 0, 0, 0.1);
  z-index: 500;
  overflow: hidden;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
  transition: width 0.3s, height 0.3s, transform 0.3s;
  /* 使用 will-change 提示浏览器这个元素将会变化，优化性能 */
  will-change: width, height;
  /* 使用硬件加速，减少对主线程的影响 */
  transform: translateZ(0);
}

.track-player.collapsed {
  width: 40px !important;
  height: 40px !important;
  border-radius: 50%;
  overflow: hidden;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.15);
  background: linear-gradient(135deg, #1890ff, #096dd9);
  transform: translateZ(0) scale(1);
  transition: all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
  cursor: pointer; /* 添加指针样式表明可点击 */
}

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
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 20px;
  font-weight: bold;
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
</style> 