<template>
  <div 
    class="track-player-container" 
    :class="{ 
      'is-visible': isVisible, 
      'dark-theme': isDarkTheme 
    }" 
    v-if="isVisible || isAnimating"
    :style="positionStyle"
    ref="playerContainer"
  >
    <!-- 轨迹信息区域 -->
    <div class="info-container" @mousedown="startDrag">
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
        @click="handleTrackSelect(track.id)"
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
import { ref, computed, onBeforeUnmount, watch, onMounted } from 'vue';
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
  'update:loop',
  'update:theme'
]);

// 用于控制动画和显示状态的变量
const isVisible = ref(props.visible);
const isAnimating = ref(false);
const trackListVisible = ref(false);
let animationTimeout: number | null = null;

// 拖动相关状态
const isDragging = ref(false);
const playerContainer = ref<HTMLElement | null>(null);
const playerPosition = ref({ x: 10, y: 10 }); // 默认位置
const dragOffset = ref({ x: 0, y: 0 });

// 播放器位置样式
const positionStyle = computed(() => {
  // 如果正在拖动或位置已被修改，使用自定义位置
  if (isDragging.value || playerPosition.value.x !== 10 || playerPosition.value.y !== 10) {
    return {
      right: 'auto',
      bottom: 'auto',
      left: `${playerPosition.value.x}px`,
      top: `${playerPosition.value.y}px`
    };
  }
  
  // 否则根据position属性确定位置
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

// 响应式变量
const progressValue = ref(String(Math.round(props.progress * 1000)));

// 判断是否为深色主题
const isDarkTheme = computed(() => {
  if (props.theme) {
    const bgColor = props.theme.backgroundColor || '';
    // 如果背景色接近深色，则使用深色主题
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
  const totalDuration = (lastPoint.time - firstPoint.time) / 1000; // 转为秒
  
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

// 初始化事件监听
onMounted(() => {
  // 添加全局鼠标事件监听
  window.addEventListener('mousemove', handleMouseMove);
  window.addEventListener('mouseup', stopDrag);
  
  // 根据position属性初始化位置
  initPosition();
});

// 在组件卸载前清除事件监听
onBeforeUnmount(() => {
  // 清除定时器
  if (animationTimeout !== null) {
    window.clearTimeout(animationTimeout);
  }
  
  // 移除全局事件监听
  window.removeEventListener('mousemove', handleMouseMove);
  window.removeEventListener('mouseup', stopDrag);
});

// 初始化位置
function initPosition() {
  if (!playerContainer.value) return;
  
  // 将位置设置为固定值，确保在地图内部
  playerPosition.value = { x: 10, y: 10 };
}

// 开始拖动
function startDrag(event: MouseEvent) {
  if (!playerContainer.value) return;
  
  // 仅当鼠标左键点击时才启用拖动
  if (event.button !== 0) return;
  
  isDragging.value = true;
  
  const containerRect = playerContainer.value.getBoundingClientRect();
  dragOffset.value = {
    x: event.clientX - containerRect.left,
    y: event.clientY - containerRect.top
  };
  
  // 阻止默认行为和冒泡
  event.preventDefault();
  event.stopPropagation();
}

// 处理鼠标移动
function handleMouseMove(event: MouseEvent) {
  if (!isDragging.value || !playerContainer.value) return;
  
  // 获取父容器 (地图容器) 的边界
  const parentElement = playerContainer.value.closest('.sc-map');
  if (!parentElement) return;
  
  const parentRect = parentElement.getBoundingClientRect();
  const playerRect = playerContainer.value.getBoundingClientRect();
  
  // 计算新位置（相对于父容器）
  const newX = event.clientX - dragOffset.value.x - parentRect.left;
  const newY = event.clientY - dragOffset.value.y - parentRect.top;
  
  // 边界检查，确保播放器不会拖出地图容器
  const boundedX = Math.max(0, Math.min(newX, parentRect.width - playerRect.width));
  const boundedY = Math.max(0, Math.min(newY, parentRect.height - playerRect.height));
  
  // 更新位置
  playerPosition.value = { x: boundedX, y: boundedY };
}

// 停止拖动
function stopDrag() {
  isDragging.value = false;
}

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
function handleTrackSelect(trackId: string): void {
  if (trackId === props.currentTrackId) return;
  
  emit('set-current-track', trackId);
  emit('update:currentTrackId', trackId);
  
  // 自动关闭轨迹列表
  trackListVisible.value = false;
}

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
</script>

<style scoped>
.track-player-container {
  position: absolute;
  width: v-bind('`${props.width}px`');
  height: v-bind('props.height === "auto" ? "auto" : `${props.height}px`');
  opacity: 0;
  transform: translateY(10px);
  pointer-events: none;
  transition: all 0.3s ease;
  z-index: 1000;
  max-width: calc(100% - 20px);
  overflow: hidden;
  background-color: var(--bg-color, rgba(255, 255, 255, 0.95));
  border-radius: 8px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.15);
}

.track-player-container.is-visible {
  opacity: 1;
  transform: translateY(0);
  pointer-events: all;
}

.info-container {
  cursor: move; /* 指示可拖动 */
  user-select: none; /* 防止文本选择 */
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
  transition: background 0.2s;
}

.track-list-item:hover {
  color: inherit !important;
  background: rgba(0,0,0,0.03);
}

.track-list-item.active {
  font-weight: bold;
  background: rgba(24, 144, 255, 0.1);
  color: var(--button-active, #1890ff) !important;
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
  background: var(--button-active, #1890ff);
  color: white;
}

.button.play-button:hover {
  background: var(--button-hover, #40a9ff);
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