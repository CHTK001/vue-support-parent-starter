<template>
  <div 
    class="track-player-container" 
    :class="{ 'is-visible': isVisible }" 
    v-if="isVisible || isAnimating"
    :style="containerStyle"
  >
    <!-- 轨迹信息区域 -->
    <div class="info-container">
      <div class="track-name" :title="currentTrackName">{{ currentTrackName }}</div>
      <div class="track-list-button button" @click="toggleTrackList" :title="'轨迹列表'">
        <span class="svg-icon" v-html="TRACK_LIST_ICON"></span>
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
        @click="setCurrentTrack(track.id)"
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
      </div>
      <div class="speed-text" @click="toggleSpeed">{{ speedText }}</div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount, watch } from 'vue';
import type { Track } from '../types';
import { 
  TRACK_PLAY_ICON, 
  TRACK_PAUSE_ICON, 
  TRACK_BACKWARD_ICON, 
  TRACK_FORWARD_ICON,
  TRACK_LIST_ICON,
  TRACK_LOOP_ICON
} from '../types/icon';

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
  // 主题
  theme: {
    type: Object,
    default: () => ({
      backgroundColor: '#fff',
      textColor: '#333',
      buttonColor: '#666',
      buttonActiveColor: '#1890ff',
      buttonHoverColor: '#40a9ff',
      progressBarColor: '#1890ff',
      progressBarBackgroundColor: '#f0f0f0',
      borderColor: '#ccc'
    })
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
  }
});

const emit = defineEmits([
  'play', 
  'pause', 
  'set-current-track', 
  'set-progress', 
  'set-speed',
  'toggle-loop',
  'update:isPlaying',
  'update:progress',
  'update:currentTrackId',
  'update:speed',
  'update:loop'
]);

// 用于控制动画和显示状态的变量
const isVisible = ref(props.visible);
const isAnimating = ref(false);
const trackListVisible = ref(false);
let animationTimeout: number | null = null;

// 响应式变量
const progressValue = ref(String(Math.round(props.progress * 1000)));
const currentTrackName = computed(() => {
  if (!props.currentTrackId) return '无轨迹';
  const track = props.tracks.find(t => t.id === props.currentTrackId);
  return track ? track.name || `轨迹 ${track.id}` : '无轨迹';
});

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
  const totalDuration = (lastPoint.time - firstPoint.time) / 1000; // 转为秒
  
  let currentTimeSec;
  if (props.currentTime) {
    currentTimeSec = (props.currentTime - firstPoint.time) / 1000;
  } else {
    currentTimeSec = totalDuration * props.progress;
  }
  
  const currentTimeStr = formatTime(currentTimeSec);
  const totalTimeStr = formatTime(totalDuration);
  
  return `${currentTimeStr}/${totalTimeStr}`;
});

// 容器样式
const containerStyle = computed(() => {
  const style: Record<string, string> = {
    width: typeof props.width === 'number' ? `${props.width}px` : props.width,
    height: typeof props.height === 'number' ? `${props.height}px` : props.height,
    backgroundColor: props.theme.backgroundColor,
    color: props.theme.textColor,
    border: `1px solid ${props.theme.borderColor}`,
  };
  
  // 根据位置设置样式
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
  }
  
  return style;
});

// 监听 visible 属性变化
watch(() => props.visible, (newValue) => {
  if (newValue) {
    // 立即显示元素
    isVisible.value = true;
    isAnimating.value = false;
  } else {
    // 延迟隐藏元素，等待动画完成
    isVisible.value = false;
    isAnimating.value = true;
    
    // 清除之前的定时器
    if (animationTimeout !== null) {
      window.clearTimeout(animationTimeout);
    }
    
    // 设置新的定时器，在动画结束后完全隐藏元素
    animationTimeout = window.setTimeout(() => {
      isAnimating.value = false;
    }, 300); // 动画持续时间
  }
}, { immediate: true });

// 监听进度变化
watch(() => props.progress, (newValue) => {
  progressValue.value = String(Math.round(newValue * 1000));
}, { immediate: true });

// 在组件销毁前清除定时器
onBeforeUnmount(() => {
  if (animationTimeout !== null) {
    window.clearTimeout(animationTimeout);
  }
});

// 格式化时间（秒）为 MM:SS 格式
function formatTime(seconds: number): string {
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
    emit('play');
    emit('update:isPlaying', true);
  }
}

// 切换轨迹列表显示状态
function toggleTrackList(): void {
  trackListVisible.value = !trackListVisible.value;
}

// 切换循环播放状态
function toggleLoop(): void {
  emit('toggle-loop');
  emit('update:loop', !props.loop);
}

// 切换播放速度
function toggleSpeed(): void {
  const speedLevels = [1, 2, 4, 8, 16];
  
  // 找到当前速度的下一个档位
  const currentIndex = speedLevels.indexOf(props.speed);
  let newSpeed = 1;
  
  if (currentIndex !== -1 && currentIndex < speedLevels.length - 1) {
    newSpeed = speedLevels[currentIndex + 1];
  }
  
  emit('set-speed', newSpeed);
  emit('update:speed', newSpeed);
}

// 设置当前轨迹
function setCurrentTrack(trackId: string): void {
  emit('set-current-track', trackId);
  emit('update:currentTrackId', trackId);
}

// 进度条变化处理
function handleProgressChange(): void {
  const progress = parseFloat(progressValue.value) / 1000;
  emit('set-progress', progress);
  emit('update:progress', progress);
}

// 后退5秒
function seekBackward(): void {
  if (!hasCurrentTrack.value) return;
  
  const track = props.tracks.find(t => t.id === props.currentTrackId);
  if (!track) return;
  
  const totalDuration = track.points[track.points.length - 1].time - track.points[0].time;
  const seekTime = 5000; // 5秒，单位毫秒
  const seekProgress = seekTime / totalDuration;
  
  // 计算新的进度，确保不小于0
  const newProgress = Math.max(0, props.progress - seekProgress);
  
  emit('set-progress', newProgress);
  emit('update:progress', newProgress);
}

// 前进5秒
function seekForward(): void {
  if (!hasCurrentTrack.value) return;
  
  const track = props.tracks.find(t => t.id === props.currentTrackId);
  if (!track) return;
  
  const totalDuration = track.points[track.points.length - 1].time - track.points[0].time;
  const seekTime = 5000; // 5秒，单位毫秒
  const seekProgress = seekTime / totalDuration;
  
  // 计算新的进度，确保不大于1
  const newProgress = Math.min(1, props.progress + seekProgress);
  
  emit('set-progress', newProgress);
  emit('update:progress', newProgress);
}
</script>

<style lang="scss" scoped>
.track-player-container {
  position: absolute;
  z-index: 1000;
  background-color: v-bind('theme.backgroundColor');
  color: v-bind('theme.textColor');
  border-radius: 4px;
  padding: 8px;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.15);
  display: flex;
  flex-direction: column;
  gap: 8px;
  opacity: 0;
  transform: translateY(10px);
  transition: opacity 0.25s ease, transform 0.25s ease;
  
  &.is-visible {
    opacity: 1;
    transform: translateY(0);
  }
  
  // 非可见状态添加过渡效果
  &:not(.is-visible) {
    opacity: 0;
    transform: translateY(10px);
  }
}

.info-container {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.track-name {
  font-weight: bold;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  flex: 1;
}

.track-list {
  max-height: 120px;
  overflow-y: auto;
  border: 1px solid v-bind('theme.borderColor');
  border-radius: 2px;
  margin-bottom: 4px;
  
  &::-webkit-scrollbar {
    width: 6px;
  }
  
  &::-webkit-scrollbar-track {
    background: #f1f1f1;
    border-radius: 3px;
  }
  
  &::-webkit-scrollbar-thumb {
    background: #ddd;
    border-radius: 3px;
  }
  
  &::-webkit-scrollbar-thumb:hover {
    background: #ccc;
  }
}

.track-list-empty {
  padding: 8px;
  text-align: center;
  color: #999;
}

.track-list-item {
  padding: 4px 8px;
  cursor: pointer;
  border-bottom: 1px solid v-bind('theme.borderColor');
  display: flex;
  align-items: center;
  
  &:last-child {
    border-bottom: none;
  }
  
  &.active {
    background-color: v-bind('theme.progressBarBackgroundColor');
    font-weight: bold;
  }
  
  &:hover {
    background-color: rgba(0, 0, 0, 0.05);
  }
}

.track-color {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  margin-right: 6px;
  display: inline-block;
}

.progress-container {
  display: flex;
  align-items: center;
  gap: 8px;
}

.progress-bar {
  flex: 1;
  margin: 0;
  cursor: pointer;
  -webkit-appearance: none;
  height: 6px;
  background: v-bind('theme.progressBarBackgroundColor');
  border-radius: 3px;
  outline: none;
  
  &::-webkit-slider-thumb {
    -webkit-appearance: none;
    width: 14px;
    height: 14px;
    border-radius: 50%;
    background: v-bind('theme.progressBarColor');
    cursor: pointer;
  }
  
  &::-moz-range-thumb {
    width: 14px;
    height: 14px;
    border-radius: 50%;
    background: v-bind('theme.progressBarColor');
    cursor: pointer;
    border: none;
  }
}

.progress-text {
  font-size: 12px;
  min-width: 60px;
  text-align: right;
}

.controls-container {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.button-group {
  display: flex;
  gap: 8px;
}

.button {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  border-radius: 4px;
  cursor: pointer;
  background: transparent;
  border: none;
  padding: 0;
  
  .svg-icon {
    display: flex;
    
    :deep(svg) {
      fill: v-bind('theme.buttonColor');
    }
  }
  
  &:hover .svg-icon :deep(svg) {
    fill: v-bind('theme.buttonHoverColor');
  }
  
  &.active .svg-icon :deep(svg) {
    fill: v-bind('theme.buttonActiveColor');
  }
  
  &.disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
}

.speed-text {
  font-size: 12px;
  padding: 2px 6px;
  border: 1px solid v-bind('theme.borderColor');
  border-radius: 2px;
  cursor: pointer;
  
  &:hover {
    background-color: rgba(0, 0, 0, 0.05);
  }
}
</style> 