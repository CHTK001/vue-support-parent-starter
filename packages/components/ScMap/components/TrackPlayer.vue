<template>
  <div 
    class="track-player-container" 
    :class="{ 'is-visible': isVisible }" 
    v-if="isVisible || isAnimating"
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
import { ref, computed, onBeforeUnmount, watch } from 'vue';
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
    // 确保播放选中的轨迹
    emit('play', props.currentTrackId);
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
  background-color: #fff;
  color: #333;
  border-radius: 8px;
  padding: 12px;
  box-shadow: 0 3px 10px rgba(0, 0, 0, 0.2);
  display: flex;
  flex-direction: column;
  gap: 10px;
  opacity: 0;
  transform: translateY(10px);
  transition: all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1);
  backdrop-filter: blur(8px);
  min-width: 240px;
  max-width: 320px;
  top: 10px;
  right: 10px;
  border: 1px solid #ccc;
  
  &.is-visible {
    opacity: 1;
    transform: translateY(0);
  }
  
  &:not(.is-visible) {
    opacity: 0;
    transform: translateY(10px);
  }
}

.info-container {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-bottom: 8px;
  border-bottom: 1px solid #ccc;
  opacity: 0.9;
}

.track-name {
  font-weight: 600;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  flex: 1;
  font-size: 14px;
  letter-spacing: 0.3px;
}

.track-actions {
  display: flex;
  gap: 8px;
}

.track-list {
  max-height: 160px;
  overflow-y: auto;
  border-radius: 6px;
  background-color: #fff;
  opacity: 0.75;
  margin-bottom: 4px;
  transition: all 0.2s ease;
  
  &::-webkit-scrollbar {
    width: 4px;
  }
  
  &::-webkit-scrollbar-track {
    background: transparent;
    border-radius: 4px;
  }
  
  &::-webkit-scrollbar-thumb {
    background: #666;
    opacity: 0.2;
    border-radius: 4px;
  }
  
  &::-webkit-scrollbar-thumb:hover {
    background: #666;
    opacity: 0.4;
  }
}

.track-list-empty {
  padding: 16px;
  text-align: center;
  color: #333;
  opacity: 0.5;
  font-style: italic;
  font-size: 13px;
}

.track-list-item {
  padding: 8px 12px;
  cursor: pointer;
  display: flex;
  align-items: center;
  transition: all 0.2s ease;
  border-radius: 4px;
  margin: 4px;
  
  &:last-child {
    border-bottom: none;
  }
  
  &.active {
    background-color: #1890ff;
    opacity: 0.1;
    font-weight: 600;
    
    .track-color {
      box-shadow: 0 0 0 2px #1890ff;
      opacity: 0.2;
    }
  }
  
  &:hover {
    background-color: #40a9ff;
    opacity: 0.05;
  }
}

.track-color {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  margin-right: 8px;
  display: inline-block;
  transition: all 0.2s ease;
}

.progress-container {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 6px 0;
}

.progress-bar {
  flex: 1;
  margin: 0;
  cursor: pointer;
  -webkit-appearance: none;
  height: 4px;
  background: #f0f0f04D; /* 4D 是十六进制的 0.3 透明度 */
  border-radius: 4px;
  outline: none;
  transition: height 0.15s ease;
  
  &:hover {
    height: 6px;
  }
  
  &::-webkit-slider-thumb {
    -webkit-appearance: none;
    width: 12px;
    height: 12px;
    border-radius: 50%;
    background: #1890ff;
    cursor: pointer;
    box-shadow: 0 0 3px rgba(0, 0, 0, 0.1);
    transition: all 0.15s ease;
    
    &:hover {
      transform: scale(1.2);
    }
  }
  
  &::-moz-range-thumb {
    width: 12px;
    height: 12px;
    border-radius: 50%;
    background: #1890ff;
    cursor: pointer;
    border: none;
    box-shadow: 0 0 3px rgba(0, 0, 0, 0.1);
    transition: all 0.15s ease;
    
    &:hover {
      transform: scale(1.2);
    }
  }
}

.progress-text {
  font-size: 12px;
  min-width: 60px;
  text-align: right;
  font-family: monospace;
  opacity: 0.8;
}

.controls-container {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-top: 6px;
  border-top: 1px solid #ccc;
  opacity: 0.9;
}

.button-group {
  display: flex;
  gap: 12px;
}

.button {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border-radius: 50%;
  cursor: pointer;
  background: transparent;
  border: none;
  padding: 0;
  transition: all 0.2s ease;
  position: relative;
  
  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background-color: #666;
    opacity: 0;
    border-radius: 50%;
    transition: all 0.2s ease;
    z-index: -1;
  }
  
  .svg-icon {
    display: flex;
    transform: scale(0.9);
    transition: all 0.2s ease;
    
    :deep(svg) {
      fill: #666;
      transition: all 0.2s ease;
    }
  }
  
  &:hover {
    &::before {
      opacity: 0.1;
    }
    
    .svg-icon {
      transform: scale(1);
      
      :deep(svg) {
        fill: #40a9ff;
      }
    }
  }
  
  &.active {
    &::before {
      background-color: #1890ff;
      opacity: 0.1;
    }
    
    .svg-icon :deep(svg) {
      fill: #1890ff;
    }
  }
  
  &.play-button {
    background-color: #1890ff;
    
    &::before {
      background-color: transparent;
    }
    
    .svg-icon :deep(svg) {
      fill: white;
    }
    
    &:hover {
      transform: scale(1.1);
      box-shadow: 0 3px 8px #1890ff66; /* 66 是十六进制的 0.4 透明度 */
      
      .svg-icon :deep(svg) {
        fill: white;
      }
    }
  }
  
  &.disabled {
    opacity: 0.4;
    cursor: not-allowed;
    
    &:hover {
      transform: none;
      box-shadow: none;
      
      &::before {
        background-color: transparent;
      }
      
      .svg-icon {
        transform: scale(0.9);
      }
    }
  }
}

.speed-text {
  font-size: 12px;
  padding: 4px 10px;
  border-radius: 12px;
  cursor: pointer;
  background-color: #666;
  opacity: 0.1;
  color: #666;
  font-weight: 600;
  transition: all 0.2s ease;
  
  &:hover {
    background-color: #40a9ff;
    opacity: 0.15;
    color: #40a9ff;
    transform: translateY(-1px);
  }
  
  &:active {
    transform: translateY(0);
  }
}
</style> 