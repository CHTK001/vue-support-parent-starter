/**
 * 轨迹播放器
 * @author CH
 * @date 2025-04-29
 */
<template>
    <div class="track-player-container" :class="{ 
        'is-visible': isVisible, 
        'dark-theme': isDarkTheme 
      }" v-if="isVisible || isAnimating" :style="positionStyle">
      <!-- 轨迹信息区域 -->
      <div class="info-container" :class="{ 'has-track': currentTrackId }">
        <div class="track-name" :title="currentTrackName">{{ currentTrackName }}</div>
        <div class="track-actions">
          <div class="track-list-button button" @click.stop="toggleTrackList" :title="'轨迹列表'">
            <span class="svg-icon" v-html="TRACK_LIST_ICON"></span>
          </div>
        </div>
      </div>

      <!-- 轨迹列表 -->
      <div class="track-list track-list-wrapper" v-show="trackListVisible">
        <div v-if="tracks.length === 0" class="track-list-empty">
          暂无轨迹
        </div>
        <div v-else v-for="track in tracks" :key="track.id" class="track-list-item"
          :class="{ active: track.id === currentTrackId }">
          <div class="track-item-content" @click.stop="handleTrackSelect(track)">
            <span class="track-color" :style="{ backgroundColor: track.color || '#1890ff' }"></span>
            <span class="track-name-text">{{ track.name || `轨迹 ${track.id}` }}</span>
          </div>
          <div class="track-item-actions">
            <span class="track-action-btn track-remove-btn" @click.stop="handleTrackRemove(track)" title="从地图上隐藏轨迹 (保留数据)">
              <span class="svg-icon" v-html="TRACK_REMOVE_ICON"></span>
            </span>
            <span class="track-action-btn track-delete-btn" @click.stop="handleTrackDelete(track)" title="彻底删除轨迹 (不可恢复)">
              <span class="svg-icon" v-html="TRACK_DELETE_ICON"></span>
            </span>
          </div>
        </div>
      </div>

      <!-- 进度条区域 -->
      <div class="progress-container">
        <input type="range" class="progress-bar" min="0" max="1000" v-model="progressValue" @input="handleProgressChange">
        <span class="progress-text">{{ progressTimeText }}</span>
      </div>

      <!-- 控制按钮区域 -->
      <div class="controls-container">
        <div class="button-group">
          <div class="button" @click="seekBackward" :title="'后退5秒'" :class="{ disabled: !hasCurrentTrack }">
            <span class="svg-icon" v-html="TRACK_BACKWARD_ICON"></span>
          </div>
          <div class="button play-button" @click="togglePlay" :title="isPlaying ? '暂停' : '播放'"
            :class="{ disabled: !hasCurrentTrack }">
            <span class="svg-icon" v-html="isPlaying ? TRACK_PAUSE_ICON : TRACK_PLAY_ICON"></span>
          </div>
          <div class="button" @click="seekForward" :title="'前进5秒'" :class="{ disabled: !hasCurrentTrack }">
            <span class="svg-icon" v-html="TRACK_FORWARD_ICON"></span>
          </div>
          <!-- <div class="button" @click="toggleLoop" :title="'循环播放'" :class="{ active: loop }">
            <span class="svg-icon" v-html="TRACK_LOOP_ICON"></span>
          </div> -->
          <!-- <div class="button" @click="toggleFollowCamera" :title="'镜头追踪'" :class="{ active: followCamera }">
            <span class="svg-icon" v-html="TRACK_CAMERA_ICON"></span>
          </div> -->
          <div class="button" @click="toggleAllTracksVisibility" :title="'显示/隐藏所有轨迹'" :class="{ active: showAllTracksState }">
            <span class="svg-icon" v-html="TRACK_TOGGLE_ALL_ICON"></span>
          </div>
        </div>
        <div class="speed-text">{{ speedText }}</div>
      </div>
    </div>
</template>

<script setup lang="ts">
import { ref, computed, onBeforeUnmount, watch, onMounted, onUnmounted, nextTick } from 'vue';
import type { Track, TrackPlayerOptions } from '../types';
import { 
  TRACK_PLAY_ICON, 
  TRACK_PAUSE_ICON, 
  TRACK_BACKWARD_ICON, 
  TRACK_FORWARD_ICON,
  TRACK_LIST_ICON,
  TRACK_LOOP_ICON,
  TRACK_CAMERA_ICON,
  TRACK_REMOVE_ICON,
  TRACK_DELETE_ICON,
  TRACK_TOGGLE_ALL_ICON
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
  (e: 'track-remove', trackId: string): void;
  (e: 'track-delete', trackId: string): void;
  (e: 'track-show-all'): void;
  (e: 'track-hide-others', data: { activeTrackId: string, otherTrackIds: string[] }): void;
}>();

// 用于控制动画和显示状态的变量
const isVisible = ref(props.visible);
const isAnimating = ref(false);
const trackListVisible = ref(false);
const progressValue = ref(String(Math.round(props.progress * 1000)));
let animationTimeout: number | null = null;

// 显示所有轨迹状态
const showAllTracksState = ref(false);

// 计算位置样式
const positionStyle = computed(() => {
  const style: Record<string, string> = {};
  
  // 使用absolute定位，相对于地图容器定位
  style.position = 'absolute';
  
  // 根据position属性设置位置
  switch (props.position) {
    case 'topleft':
      style.top = '10px';
      style.left = '10px';
      break;
    case 'topright':
      style.top = '10px';
      style.right = '10px';
      break;
    case 'bottomleft':
      style.bottom = '10px';
      style.left = '10px';
      break;
    case 'bottomright':
      style.bottom = '10px';
      style.right = '10px';
      break;
    default:
      style.top = '10px';
      style.right = '10px';
  }
  
  // 添加额外的样式来确保轨迹列表可点击
  style.pointerEvents = 'auto';
  style.zIndex = '1000'; // 确保在地图上层
  
  return style;
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

// 修改handleTrackSelect函数，添加强调动画
const handleTrackSelect = (track: Track) => {
  // 高亮效果动画
  const addHighlightAnimation = (trackId: string) => {
    nextTick(() => {
      const elements = document.querySelectorAll('.track-list-item');
      elements.forEach(el => {
        if ((el as HTMLElement).classList.contains('active')) {
          // 重置动画，以便再次应用
          (el as HTMLElement).style.animation = 'none';
          // 触发回流
          (el as HTMLElement).offsetHeight;
          // 添加动画
          (el as HTMLElement).style.animation = 'highlight-pulse 1s ease-in-out 1';
        }
      });
    });
  };

  if (track.id === props.currentTrackId) {
    // 取消选中当前轨迹，显示所有轨迹
    emit('update:currentTrackId', '');
    
    // 发出事件，让父组件显示所有轨迹
    emit('track-show-all');
    
    // 更新显示所有轨迹状态
    showAllTracksState.value = true;
    
    // 不关闭轨迹列表
  } else {
    // 选中新轨迹
    emit('set-current-track', track.id);
    emit('update:currentTrackId', track.id);
    
    // 如果当前设置为只显示选中轨迹，则隐藏其他轨迹
    if (!showAllTracksState.value) {
      // 发出事件，让父组件隐藏其他轨迹
      const otherTrackIds = props.tracks
        .filter(t => t.id !== track.id)
        .map(t => t.id);
      
      if (otherTrackIds.length > 0) {
        emit('track-hide-others', { activeTrackId: track.id, otherTrackIds });
      }
    }
    
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
    
    // 添加选中高亮动画
    addHighlightAnimation(track.id);
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

// 处理轨迹移除
function handleTrackRemove(track: Track): void {
  emit('track-remove', track.id);
}

// 处理轨迹删除
function handleTrackDelete(track: Track): void {
  // 添加确认提示，明确说明会从地图和数据中完全删除
  if (confirm(`确定要删除轨迹"${track.name || `轨迹 ${track.id}`}"吗？此操作将从地图上移除轨迹并删除轨迹数据，不可恢复。`)) {
    emit('track-delete', track.id);
  }
}

// 切换所有轨迹显示/隐藏状态
function toggleAllTracksVisibility() {
  showAllTracksState.value = !showAllTracksState.value;
  
  if (showAllTracksState.value) {
    // 显示所有轨迹
    emit('track-show-all');
  } else if (props.currentTrackId) {
    // 只显示当前选中的轨迹，隐藏其他轨迹
    const otherTrackIds = props.tracks
      .filter(t => t.id !== props.currentTrackId)
      .map(t => t.id);
    
    if (otherTrackIds.length > 0) {
      emit('track-hide-others', { 
        activeTrackId: props.currentTrackId, 
        otherTrackIds 
      });
    }
  }
}
</script>

<style lang="scss" scoped>
/* 创建选中高亮动画 */
@keyframes highlight-pulse {
  0% {
    background-color: rgba(24, 144, 255, 0.1);
  }

  50% {
    background-color: rgba(24, 144, 255, 0.25);
  }

  100% {
    background-color: rgba(24, 144, 255, 0.1);
  }
}

/* 修改选中状态样式，添加动画 */
.track-list-item.active {
  background-color: rgba(24, 144, 255, 0.1) !important;
  border-left-color: #1890ff;
  font-weight: 500;
  animation: highlight-pulse 1s ease-in-out 1;

  /* 添加选中指示器 */
  &::before {
    content: '';
    position: absolute;
    right: 12px;
    top: 50%;
    transform: translateY(-50%);
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background-color: #1890ff;
  }

  /* 文字高亮 */
  .track-name-text {
    color: #1890ff;
  }
}

.track-player-container {
  position: absolute !important; /* 使用absolute定位，相对于地图容器 */
  width: v-bind('typeof width === "number" ? `${width}px` : width');
  height: v-bind('typeof height === "number" ? `${height}px` : height');
  background-color: v-bind('theme.backgroundColor');
  border-radius: 4px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
  z-index: 1000 !important; /* 确保在地图的层级之上 */
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
  padding: 12px 14px;
  border-bottom: 1px solid var(--border-color, rgba(0,0,0,0.1));
  transition: background-color 0.3s;
  
  /* 当有轨迹被选中时添加微妙背景色 */
  &.has-track {
    background-color: rgba(24, 144, 255, 0.05);
  }
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
  z-index: 100002 !important; /* 确保列表项在列表容器之上 */
  pointer-events: auto !important; /* 确保点击事件总是能被捕获 */
  
  &:hover {
    background-color: rgba(0, 0, 0, 0.05);
  }
  
  &.active {
    background-color: rgba(24, 144, 255, 0.1) !important;
    border-left-color: #1890ff;
    font-weight: 500;
    animation: highlight-pulse 1s ease-in-out 1;
    
    /* 添加选中指示器 */
    &::before {
      content: '';
      position: absolute;
      right: 12px;
      top: 50%;
      transform: translateY(-50%);
      width: 6px;
      height: 6px;
      border-radius: 50%;
      background-color: #1890ff;
    }
    
    /* 文字高亮 */
    .track-name-text {
      color: #1890ff;
    }
  }
}

.track-color {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  margin-right: 10px;
  border: 1px solid rgba(0, 0, 0, 0.1);
  transition: transform 0.2s;
  flex-shrink: 0;
}

.track-name-text {
  font-size: 13px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  flex: 1;
  transition: color 0.2s;
}

/* 激活状态下颜色点加大 */
.track-list-item.active .track-color {
  transform: scale(1.2);
  box-shadow: 0 0 0 2px rgba(24, 144, 255, 0.2);
}

/* 点击效果 */
.track-item-content:active {
  transform: scale(0.98);
}
.active path {
  fill: #000 !important;
}
.track-list {
  max-height: 200px;
  overflow-y: auto;
  overflow-x: hidden;
  border-bottom: 1px solid var(--border-color, rgba(0,0,0,0.1));
  position: relative;
  z-index: 100001 !important; /* 确保列表容器z-index比容器还高 */

  scrollbar-color: var(--el-color-primary) transparent;
  scrollbar-width: thin;
  
  &::-webkit-scrollbar {
    width: 6px;
  }
  
  &::-webkit-scrollbar-track {
    background: transparent;
  }
  
  &::-webkit-scrollbar-thumb {
    background: var(--el-color-primary, #409eff);
    border-radius: 3px;
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
  transition: color 0.3s;
  
  /* 如果有轨迹被选中，显示蓝色 */
  .has-track & {
    color: #1890ff;
  }
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

.track-item-content {
  display: flex;
  align-items: center;
  flex: 1;
  min-height: 24px; /* 确保点击区域高度足够 */
  padding: 2px 0;
  z-index: 100003 !important; /* 确保内容在列表项之上 */
  pointer-events: auto !important;
}

.track-item-actions {
  display: flex;
  align-items: center;
  margin-left: auto;
  z-index: 100004 !important; /* 确保操作按钮在最上层 */
  pointer-events: auto !important;
}

.track-action-btn {
  width: 28px; /* 增加点击区域大小 */
  height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  margin-left: 8px;
  transition: transform 0.2s, color 0.2s, background-color 0.2s;
  border-radius: 4px;
  padding: 4px;
  position: relative;
  z-index: 100005 !important; /* 绝对确保按钮在所有元素之上 */
  pointer-events: auto !important;
  
  &:hover {
    transform: scale(1.1);
    background-color: rgba(0, 0, 0, 0.05);
  }
  
  /* 添加提示文本 */
  &::after {
    content: attr(title);
    position: absolute;
    bottom: -25px;
    left: 50%;
    transform: translateX(-50%);
    background-color: rgba(0, 0, 0, 0.7);
    color: white;
    padding: 3px 6px;
    border-radius: 4px;
    font-size: 12px;
    white-space: nowrap;
    opacity: 0;
    transition: opacity 0.2s;
    pointer-events: none;
  }
  
  &:hover::after {
    opacity: 1;
  }
}

.track-remove-btn {
  color: #909399; /* 使用较浅的颜色表示只是移除不删除 */
  
  &:hover {
    color: #606266;
    background-color: rgba(144, 147, 153, 0.1);
  }
}

.track-delete-btn {
  color: #f56c6c; /* 使用红色表示危险操作 */
  
  &:hover {
    color: #f56c6c;
    background-color: rgba(245, 108, 108, 0.1);
  }
}

.track-list-wrapper {
  background-color: v-bind('theme.backgroundColor');
  z-index: 2; /* 确保列表在组件中有更高的层级 */
}
</style> 