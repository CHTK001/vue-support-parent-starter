/**
 * 轨迹播放器
 * @author CH
 * @date 2025-04-29
 */
<template>
  <div 
    class="track-player-container" 
    :class="{ 
      'is-visible': isVisible, 
      'dark-theme': isDarkTheme 
    }" 
    v-if="isVisible || isAnimating"
    :style="positionStyle"
  >
    <!-- 轨迹信息区域 -->
    <div class="info-container">
      <div class="track-name" :title="currentTrackName">{{ currentTrackName }}</div>
      <div class="track-actions">
        <div class="track-list-button button" @click="toggleTrackList" :title="'轨迹列表'">
          <span class="svg-icon" v-html="TRACK_LIST_ICON"></span>
        </div>
      </div>
    </div>

    <!-- 轨迹列表 -->
    <div class="track-list" v-show="trackListVisible">
      <div v-if="tracks.length === 0" class="track-list-empty">
        暂无轨迹
      </div>
      <div 
        v-else
        v-for="track in tracks" 
        :key="track.id" 
        class="track-list-item"
        :class="{ active: track.id === currentTrackId }"
        @click="handleTrackSelect(track)"
      >
        <span class="track-color" :style="{ backgroundColor: track.color || '#1890ff' }"></span>
        <span>{{ track.name || `轨迹 ${track.id}` }}</span>
      </div>
    </div>

    <!-- 进度条区域 -->
    <div class="progress-container">
      <input 
        type="range" 
        class="progress-bar" 
        min="0" 
        max="1000" 
        v-model="progressValue"
        @input="handleProgressChange"
      >
      <span class="progress-text">{{ progressTimeText }}</span>
    </div>

    <!-- 控制按钮区域 -->
    <div class="controls-container">
      <div class="button-group">
        <div class="button" @click="seekBackward" :title="'后退5秒'" :class="{ disabled: !hasCurrentTrack }">
          <span class="svg-icon" v-html="TRACK_BACKWARD_ICON"></span>
        </div>
        <div class="button play-button" @click="togglePlay" :title="isPlaying ? '暂停' : '播放'" :class="{ disabled: !hasCurrentTrack }">
          <span class="svg-icon" v-html="isPlaying ? TRACK_PAUSE_ICON : TRACK_PLAY_ICON"></span>
        </div>
        <div class="button" @click="seekForward" :title="'前进5秒'" :class="{ disabled: !hasCurrentTrack }">
          <span class="svg-icon" v-html="TRACK_FORWARD_ICON"></span>
        </div>
        <div class="button" @click="toggleLoop" :title="'循环播放'" :class="{ active: loop }">
          <span class="svg-icon" v-html="TRACK_LOOP_ICON"></span>
        </div>
        <div class="button" @click="toggleFollowCamera" :title="'镜头追踪'" :class="{ active: followCamera }">
          <span class="svg-icon" v-html="TRACK_CAMERA_ICON"></span>
        </div>
      </div>
      <div class="speed-text" @click="toggleSpeed">{{ speedText }}</div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onBeforeUnmount, watch, onMounted, onUnmounted } from 'vue';
import type { Track, TrackPlayerOptions } from '../types';
import { 
  TRACK_PLAY_ICON, 
  TRACK_PAUSE_ICON, 
  TRACK_BACKWARD_ICON, 
  TRACK_FORWARD_ICON,
  TRACK_LIST_ICON,
  TRACK_LOOP_ICON,
  TRACK_CAMERA_ICON
} from '../types/icon';
import L from 'leaflet';


const props = defineProps({
  // 是否显示轨迹播放组件
  visible: {
    type: Boolean,
    default: false
  },
  // 位置
  position: {
    type: String,
    default: 'topright',
    validator: (value: string) => {
      return ['topleft', 'topright', 'bottomleft', 'bottomright'].includes(value);
    }
  },
  // 尺寸
  width: {
    type: [Number, String],
    default: 280
  },
  height: {
    type: [Number, String],
    default: 'auto'
  },
  // 轨迹列表
  tracks: {
    type: Array as () => Track[],
    default: () => []
  },
  // 当前轨迹ID
  currentTrackId: {
    type: String,
    default: null
  },
  // 当前进度
  progress: {
    type: Number,
    default: 0
  },
  // 当前播放时间（毫秒）
  currentTime: {
    type: Number,
    default: 0
  },
  // 是否播放中
  isPlaying: {
    type: Boolean,
    default: false
  },
  // 播放速度
  speed: {
    type: Number,
    default: 1
  },
  // 是否循环播放
  loop: {
    type: Boolean,
    default: false
  },
  // 是否自动跟踪镜头
  followCamera: {
    type: Boolean,
    default: false
  },
  // 主题
  theme: {
    type: Object,
    default: () => ({
      backgroundColor: 'rgba(255, 255, 255, 0.95)',
      textColor: '#333',
      buttonColor: '#666',
      buttonActiveColor: '#1890ff',
      buttonHoverColor: '#40a9ff',
      progressBarColor: '#1890ff',
      progressBarBackgroundColor: '#f0f0f0',
      borderColor: '#e8e8e8'
    })
  }
});

const emit = defineEmits<{
  (e: 'play', trackId?: string): void;
  (e: 'pause'): void;
  (e: 'set-current-track', trackId: string): void;
  (e: 'set-progress', progress: number): void;
  (e: 'set-speed', speed: number): void;
  (e: 'toggle-loop'): void;
  (e: 'toggle-follow-camera'): void;
  (e: 'update:isPlaying', value: boolean): void;
  (e: 'update:progress', value: number): void;
  (e: 'update:currentTrackId', value: string): void;
  (e: 'update:speed', value: number): void;
  (e: 'update:loop', value: boolean): void;
  (e: 'update:followCamera', value: boolean): void;
  (e: 'update:theme', value: 'light' | 'dark'): void;
  (e: 'center-on-track', data: { latlng: [number, number], bounds: L.LatLngBounds }): void;
}>();

// 用于控制动画和显示状态的变量
const isVisible = ref(props.visible);
const isAnimating = ref(false);
const trackListVisible = ref(false);
const progressValue = ref(String(Math.round(props.progress * 1000)));
let animationTimeout: number | null = null;

// 播放器位置样式
const positionStyle = computed(() => {
  switch (props.position) {
    case 'topleft':
      return { left: '10px', top: '10px', right: 'auto', bottom: 'auto' };
    case 'topright':
      return { right: '10px', top: '10px', left: 'auto', bottom: 'auto' };
    case 'bottomleft':
      return { left: '10px', bottom: '10px', right: 'auto', top: 'auto' };
    case 'bottomright':
      return { right: '10px', bottom: '10px', left: 'auto', top: 'auto' };
    default:
      return { right: '10px', top: '10px', left: 'auto', bottom: 'auto' };
  }
});

// 判断是否为深色主题
const isDarkTheme = computed(() => {
  if (props.theme) {
    const bgColor = props.theme.backgroundColor || '';
    if (bgColor.includes('rgba(42,') || bgColor.includes('#2a') || bgColor.includes('#333')) {
      return true;
    }
  }
  return false;
});

// 获取当前轨迹名称
const currentTrackName = computed(() => {
  if (!props.currentTrackId) return '无轨迹';
  const track = props.tracks.find(t => t.id === props.currentTrackId);
  return track ? track.name || `轨迹 ${track.id}` : '无轨迹';
});

// 速度显示文本
const speedText = computed(() => `${props.speed}x`);

// 判断是否有当前轨迹
const hasCurrentTrack = computed(() => {
  return props.currentTrackId && props.tracks.length > 0;
});

// 计算进度时间文本
const progressTimeText = computed(() => {
  if (!props.currentTrackId) return '00:00/00:00';
  
  const track = props.tracks.find(t => t.id === props.currentTrackId);
  if (!track || track.points.length === 0) return '00:00/00:00';
  
  const firstPoint = track.points[0];
  const lastPoint = track.points[track.points.length - 1];
  const totalDuration = (lastPoint.time - firstPoint.time) / 1000;
  
  let currentTimeSec;
  if (props.currentTime) {
    currentTimeSec = Math.max(0, (props.currentTime - firstPoint.time) / 1000);
  } else {
    currentTimeSec = totalDuration * props.progress;
  }
  
  const currentTimeStr = formatTime(currentTimeSec);
  const totalTimeStr = formatTime(totalDuration);
  
  return `${currentTimeStr}/${totalTimeStr}`;
});

// 监听 visible 属性变化
watch(() => props.visible, (newValue) => {
  if (newValue) {
    isVisible.value = true;
    isAnimating.value = false;
  } else {
    isVisible.value = false;
    isAnimating.value = true;
    
    if (animationTimeout !== null) {
      window.clearTimeout(animationTimeout);
    }
    
    animationTimeout = window.setTimeout(() => {
      isAnimating.value = false;
    }, 300);
  }
}, { immediate: true });

// 监听进度变化
watch(() => props.progress, (newValue) => {
  progressValue.value = String(Math.round(newValue * 1000));
}, { immediate: true });

// 监听currentTrackId变化
watch(() => props.currentTrackId, (newValue) => {
  if (newValue) {
    // 当currentTrackId变化时，更新标题和选中状态
    const track = props.tracks.find(t => t.id === newValue);
    if (track) {
      // 标题已通过computed属性自动更新
      // 当选中新轨迹时，显示轨迹列表
      trackListVisible.value = true;
    }
  }
}, { immediate: true });

// 格式化时间（秒）为 MM:SS 格式
function formatTime(seconds: number): string {
  if (isNaN(seconds) || seconds < 0) {
    return '00:00';
  }
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

// 切换播放/暂停状态
function togglePlay(): void {
  if (!hasCurrentTrack.value) return;
  
  if (props.isPlaying) {
    emit('pause');
    emit('update:isPlaying', false);
  } else {
    emit('play', props.currentTrackId);
    emit('update:isPlaying', true);
  }
}

// 切换轨迹列表显示
function toggleTrackList(): void {
  trackListVisible.value = !trackListVisible.value;
}

// 处理进度条变化
function handleProgressChange(): void {
  const progress = Number(progressValue.value) / 1000;
  emit('set-progress', progress);
  emit('update:progress', progress);
  
}

// 切换循环播放
function toggleLoop(): void {
  emit('toggle-loop');
  emit('update:loop', !props.loop);
}

// 选择轨迹
const handleTrackSelect = (track: Track) => {
  if (track.id === props.currentTrackId) {
    emit('update:currentTrackId', '');
    // 不关闭轨迹列表
  } else {
    emit('set-current-track', track.id);
    emit('update:currentTrackId', track.id);
    // 获取轨迹的第一个点作为中心点
    const firstPoint = track.points[0];
    if (firstPoint) {
      // 计算轨迹的边界
      const bounds = track.points.reduce((acc, point) => {
        return acc.extend([point.lat, point.lng]);
      }, L.latLngBounds([firstPoint.lat, firstPoint.lng], [firstPoint.lat, firstPoint.lng]));
      
      // 定位到轨迹起点并自适应缩放
      emit('center-on-track', {
        latlng: [firstPoint.lat, firstPoint.lng],
        bounds: bounds
      });
    }
  }
};

// 切换播放速度
function toggleSpeed(): void {
  // 速度循环：1 -> 2 -> 4 -> 8 -> 0.5 -> 1
  let newSpeed = props.speed;
  if (newSpeed === 1) newSpeed = 2;
  else if (newSpeed === 2) newSpeed = 4;
  else if (newSpeed === 4) newSpeed = 8;
  else if (newSpeed === 8) newSpeed = 0.5;
  else newSpeed = 1;
  
  emit('set-speed', newSpeed);
  emit('update:speed', newSpeed);
}

// 后退5秒
function seekBackward(): void {
  if (!hasCurrentTrack.value) return;
  
  // 计算当前时间减去5秒对应的进度
  const track = props.tracks.find(t => t.id === props.currentTrackId);
  if (!track || track.points.length < 2) return;
  
  const firstPoint = track.points[0];
  const lastPoint = track.points[track.points.length - 1];
  const totalDuration = lastPoint.time - firstPoint.time; // 毫秒
  
  let currentTime;
  if (props.currentTime) {
    currentTime = props.currentTime;
  } else {
    currentTime = firstPoint.time + totalDuration * props.progress;
  }
  
  // 后退5秒
  const newTime = Math.max(firstPoint.time, currentTime - 5000);
  const newProgress = (newTime - firstPoint.time) / totalDuration;
  
  emit('set-progress', newProgress);
  emit('update:progress', newProgress);
}

// 前进5秒
function seekForward(): void {
  if (!hasCurrentTrack.value) return;
  
  // 计算当前时间加上5秒对应的进度
  const track = props.tracks.find(t => t.id === props.currentTrackId);
  if (!track || track.points.length < 2) return;
  
  const firstPoint = track.points[0];
  const lastPoint = track.points[track.points.length - 1];
  const totalDuration = lastPoint.time - firstPoint.time; // 毫秒
  
  let currentTime;
  if (props.currentTime) {
    currentTime = props.currentTime;
  } else {
    currentTime = firstPoint.time + totalDuration * props.progress;
  }
  
  // 前进5秒
  const newTime = Math.min(lastPoint.time, currentTime + 5000);
  const newProgress = (newTime - firstPoint.time) / totalDuration;
  
  emit('set-progress', newProgress);
  emit('update:progress', newProgress);
}

// 切换镜头追踪
function toggleFollowCamera(): void {
  emit('toggle-follow-camera');
  emit('update:followCamera', !props.followCamera);
}
</script>

<style lang="scss" scoped>
.track-player-container {
  position: absolute;
  width: v-bind('typeof width === "number" ? `${width}px` : width');
  height: v-bind('typeof height === "number" ? `${height}px` : height');
  background-color: v-bind('theme.backgroundColor');
  border-radius: 4px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
  z-index: 9999;
  transition: all 0.3s ease;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  border: 1px solid v-bind('theme.borderColor');

  &.is-visible {
    opacity: 1;
    transform: translateY(0);
  }

  &:not(.is-visible) {
    opacity: 0;
    transform: translateY(-10px);
  }
}

.info-container {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 12px;
  border-bottom: 1px solid var(--border-color, rgba(0,0,0,0.1));
}

/* 暗色主题样式会通过父组件的:deep选择器应用 */

/* 基础样式 - 确保有基础的fallback样式 */
.track-list-empty {
  padding: 15px;
  text-align: center;
  color: #999;
  font-size: 13px;
}

.button.disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.svg-icon {
  width: 18px;
  height: 18px;
  display: inline-flex;
}

:deep(svg) {
  width: 100%;
  height: 100%;
}

/* 明确设置轨迹列表项文字颜色 */
.track-list-item {
  color: inherit !important;
  padding: 8px 12px;
  display: flex;
  align-items: center;
  font-size: 13px;
  cursor: pointer;
  transition: background 0.2s, border-left-color 0.2s;
  border-left: 4px solid transparent;
  position: relative;
}

.track-list-item:hover {
  color: inherit !important;
  background: rgba(0,0,0,0.05);
}

.track-list-item.active {
  font-weight: bold;
  background: rgba(24, 144, 255, 0.2) !important;
  color: var(--button-active, #1890ff) !important;
  border-left: 4px solid var(--button-active, #1890ff);
}

.track-list-item.active::after {
  content: '';
  position: absolute;
  right: 12px;
  top: 50%;
  transform: translateY(-50%);
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background-color: var(--button-active, #1890ff);
}

.track-color {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  margin-right: 8px;
}

.track-list {
  max-height: 150px;
  overflow-y: auto;
  border-bottom: 1px solid var(--border-color, rgba(0,0,0,0.1));

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
      ;
      border-radius: 4px;
    }
  
    /* 滚动条滑块：hover状态 */
    ::-webkit-scrollbar-thumb:hover {
      background: var(--el-color-primary);
      /* 滑块hover颜色 */
    }
}

.progress-container {
  padding: 10px 12px;
  display: flex;
  align-items: center;
}

.progress-bar {
  flex: 1;
  height: 6px;
  appearance: none;
  background: var(--progress-bg, #f0f0f0);
  border-radius: 3px;
  outline: none;
  margin-right: 10px;
}

.progress-bar::-webkit-slider-thumb {
  appearance: none;
  width: 14px;
  height: 14px;
  border-radius: 50%;
  background: var(--progress-color, #1890ff);
  cursor: pointer;
}

.progress-text {
  font-size: 12px;
  white-space: nowrap;
  color: var(--secondary-text, #666);
}

.controls-container {
  padding: 5px 12px 12px;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.button-group {
  display: flex;
  align-items: center;
}

.button {
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  cursor: pointer;
  margin-right: 8px;
  color: var(--button-color, #666);
  transition: all 0.2s;
}

.button:hover {
  background: rgba(0,0,0,0.05);
  color: var(--button-hover, #40a9ff);
}

.button.active {
  color: var(--button-active, #1890ff);
}

.button.play-button {
  color: white;
}

.button.play-button:hover {
  color: white;
}

.speed-text {
  font-size: 12px;
  background: rgba(0,0,0,0.05);
  padding: 4px 8px;
  border-radius: 12px;
  cursor: pointer;
}

/* 防止继承父级的颜色 */
.dark-theme .track-list-item:hover {
  color: #f0f0f0 !important;
}

.track-name {
  font-weight: bold;
  font-size: 14px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 200px;
}

.dark-theme {
  --bg-color: rgba(42, 45, 56, 0.9);
  --text-color: #f0f0f0;
  --border-color: rgba(255,255,255,0.1);
  --button-color: #aaa;
  --button-hover: #40a9ff;
  --button-active: #1890ff;
  --progress-bg: #555;
  --progress-color: #1890ff;
  --secondary-text: #bbb;
}

</style> 