/**
 * 轨迹播放器组件
 * @description 用于播放、暂停、停止轨迹数据
 */
<template>
  <div class="track-player" :class="[positionClass, { collapsed }]">
    <div class="track-player-header" @click.stop="handleToggleCollapse">
      <div class="track-player-title">
        <span class="icon">
          <svg viewBox="0 0 1024 1024" width="16" height="16">
            <path d="M832 128h-640c-70.4 0-128 57.6-128 128v512c0 70.4 57.6 128 128 128h640c70.4 0 128-57.6 128-128v-512c0-70.4-57.6-128-128-128zM320 704v-384l256 192-256 192z" fill="currentColor"></path>
          </svg>
            </span>
        <span class="title">{{ currentTrack ? currentTrack.name : '轨迹播放器' }}</span>
          </div>
      <div class="track-player-actions">
        <button class="collapse-btn" title="展开/收起" @click.stop="handleToggleCollapse">
          <svg viewBox="0 0 1024 1024" width="14" height="14">
            <path v-if="collapsed" d="M512 685.248l-278.624-278.624 45.248-45.248L512 594.752l233.376-233.376 45.248 45.248z" fill="currentColor"></path>
            <path v-else d="M512 685.248l278.624-278.624-45.248-45.248L512 594.752l-233.376-233.376-45.248 45.248z" fill="currentColor"></path>
          </svg>
        </button>
        </div>
      </div>
    <div class="track-player-content" v-show="!collapsed">
      <!-- 轨迹列表 -->
      <div class="track-list" v-if="showTrackList && tracks.length > 0">
        <div 
          v-for="track in tracks" 
          :key="track.id" 
          :class="['track-item', { active: currentTrackId === track.id }]"
          @click="selectTrack(track.id)"
        >
          <div class="track-color" :style="{ backgroundColor: track.color || '#1890ff' }"></div>
          <div class="track-name">{{ track.name }}</div>
          <div class="track-actions">
            <button class="track-action-btn" title="删除轨迹" @click.stop="removeTrack(track.id)">
              <svg viewBox="0 0 1024 1024" width="14" height="14">
                <path d="M360 184h-8c4.4 0 8-3.6 8-8v8h304v-8c0 4.4 3.6 8 8 8h-8v72h72v-80c0-35.3-28.7-64-64-64H352c-35.3 0-64 28.7-64 64v80h72v-72zm504 72H160c-17.7 0-32 14.3-32 32v32c0 4.4 3.6 8 8 8h60.4l24.7 523c1.6 34.1 29.8 61 63.9 61h454c34.2 0 62.3-26.8 63.9-61l24.7-523H200c4.4 0 8-3.6 8-8v-32c0-17.7-14.3-32-32-32z" fill="currentColor"></path>
              </svg>
              </button>
            </div>
        </div>
      </div>

      <!-- 播放器控制区 -->
      <div class="player-controls">
        <div class="time-slider">
          <input 
            type="range" 
            :min="minTime" 
            :max="maxTime" 
            :step="1" 
            v-model="currentTime"
            :disabled="!currentTrackId || !currentTrack?.points.length"
            @input="handleTimeChange"
          >
          <div class="time-display">
            <span>{{ formatTime(currentTime) }}</span>
            <span>{{ formatTime(maxTime) }}</span>
          </div>
        </div>

        <div class="control-buttons">
          <button class="control-btn" title="播放" @click="handlePlay" :disabled="isPlaying || !currentTrackId">
            <svg viewBox="0 0 1024 1024" width="16" height="16">
              <path d="M512 64C264.6 64 64 264.6 64 512s200.6 448 448 448 448-200.6 448-448S759.4 64 512 64zm0 820c-205.4 0-372-166.6-372-372s166.6-372 372-372 372 166.6 372 372-166.6 372-372 372z" fill="currentColor"></path>
              <path d="M719.4 499.1l-296.1-215A15.9 15.9 0 0 0 398 297v430c0 13.1 14.8 20.5 25.3 12.9l296.1-215a15.9 15.9 0 0 0 0-25.8zm-257.6 134V390.9L628.5 512 461.8 633.1z" fill="currentColor"></path>
            </svg>
          </button>
          <button class="control-btn" title="暂停" @click="handlePause" :disabled="!isPlaying">
            <svg viewBox="0 0 1024 1024" width="16" height="16">
              <path d="M512 64C264.6 64 64 264.6 64 512s200.6 448 448 448 448-200.6 448-448S759.4 64 512 64zm0 820c-205.4 0-372-166.6-372-372s166.6-372 372-372 372 166.6 372 372-166.6 372-372 372z" fill="currentColor"></path>
              <path d="M424 352h-48c-4.4 0-8 3.6-8 8v304c0 4.4 3.6 8 8 8h48c4.4 0 8-3.6 8-8V360c0-4.4-3.6-8-8-8zm224 0h-48c-4.4 0-8 3.6-8 8v304c0 4.4 3.6 8 8 8h48c4.4 0 8-3.6 8-8V360c0-4.4-3.6-8-8-8z" fill="currentColor"></path>
            </svg>
          </button>
          <button class="control-btn" title="停止" @click="handleStop" :disabled="!currentTrackId">
            <svg viewBox="0 0 1024 1024" width="16" height="16">
              <path d="M512 64C264.6 64 64 264.6 64 512s200.6 448 448 448 448-200.6 448-448S759.4 64 512 64zm0 820c-205.4 0-372-166.6-372-372s166.6-372 372-372 372 166.6 372 372-166.6 372-372 372z" fill="currentColor"></path>
              <path d="M648 376h-272c-4.4 0-8 3.6-8 8v256c0 4.4 3.6 8 8 8h272c4.4 0 8-3.6 8-8V384c0-4.4-3.6-8-8-8z" fill="currentColor"></path>
            </svg>
          </button>
        </div>

        <div class="speed-control">
          <label>速度: {{ playbackSpeed }} km/h</label>
          <input 
            type="range" 
            min="10" 
            max="200" 
            step="10" 
            v-model="playbackSpeed"
            @input="handleSpeedChange"
          >
          </div>
        
        <div class="options-control">
          <div class="option-item">
            <input type="checkbox" id="loop" v-model="loop" @change="handleLoopChange">
            <label for="loop">循环播放</label>
          </div>
          <div class="option-item">
            <input type="checkbox" id="withCamera" v-model="withCamera" @change="handleCameraChange">
            <label for="withCamera">跟随相机</label>
          </div>
          <div class="option-item">
            <input type="checkbox" id="showNodeNames" v-model="showNodeNames" @change="handleNodeNamesChange">
            <label for="showNodeNames">显示节点名称</label>
        </div>
      </div>
    </div>
    </div>
  </div>
</template>

<script lang="ts">
export default {
  name: 'TrackPlayerMap'
};
</script>

<script setup lang="ts">
import { ref, computed, watch, onMounted, onBeforeUnmount } from 'vue';
import { LeafletTrackplayerObject } from '../composables/LeafletTrackplayerObject';
import { Track, TrackPlayerConfigOptions } from '../types/track';

// 组件属性 - 使用any类型接受任何轨迹对象实现
const props = defineProps<{
  trackObj: any; // 接受任何实现了轨迹播放器接口的对象
  config?: Partial<TrackPlayerConfigOptions>;
}>();

// 组件事件
const emit = defineEmits<{
  (e: 'track-selected', payload: { trackId: string; track: Track }): void;
  (e: 'track-deleted', payload: { trackId: string }): void;
  (e: 'collapse-change', collapsed: boolean): void;
}>();

// 组件状态
const tracks = ref<Track[]>([]);
const currentTrackId = ref<string | null>(null);
const currentTrack = computed(() => tracks.value.find(t => t.id === currentTrackId.value) || null);
const isPlaying = ref(false);
const currentTime = ref(0);
const minTime = ref(0);
const maxTime = ref(0);
const playbackSpeed = ref(props.config?.speed || 50);
const loop = ref(props.config?.loop || false);
const withCamera = ref(props.config?.withCamera || false);
const showNodeNames = ref(props.config?.showNodeNames || false);
const showTrackList = ref(props.config?.showTrackList !== false);
const position = ref<'top-left' | 'top-right' | 'bottom-left' | 'bottom-right'>(
  props.config?.position || 'bottom-right'
);
const collapsed = ref(false);

// 计算样式类
const positionClass = computed(() => `position-${position.value}`);

// 加载轨迹数据
const loadTracks = () => {
  if (!props.trackObj) return;
  tracks.value = props.trackObj.getTracks();

  // 如果有轨迹，自动选择第一个
  if (tracks.value.length > 0 && !currentTrackId.value) {
    selectTrack(tracks.value[0].id);
  }
};

// 选择轨迹
const selectTrack = (trackId: string) => {
  if (!props.trackObj) return;
  
  props.trackObj.setActiveTrack(trackId);
  currentTrackId.value = trackId;
  
  // 获取轨迹时间范围
  const track = props.trackObj.getTrack(trackId);
  if (track && track.points && track.points.length > 0) {
    minTime.value = track.points[0].time;
    maxTime.value = track.points[track.points.length - 1].time;
    currentTime.value = minTime.value;
  }
  
  emit('track-selected', { 
    trackId, 
    track: props.trackObj.getTrack(trackId)! 
  });
};

// 移除轨迹
const removeTrack = (trackId: string) => {
  if (!props.trackObj) return;
  
  if (isPlaying.value && currentTrackId.value === trackId) {
    handleStop();
      }
      
  props.trackObj.removeTrack(trackId);
      
  if (currentTrackId.value === trackId) {
    currentTrackId.value = null;
      }
      
      // 刷新轨迹列表
  loadTracks();
      
  emit('track-deleted', { trackId });
};

// 格式化时间显示
const formatTime = (timestamp: number) => {
  if (!currentTrack.value) return '00:00:00';
  
  // 使用相对时间，计算轨迹起始时间的偏移
  const startTime = currentTrack.value.points[0]?.time || 0;
  const relativeTime = timestamp - startTime;
  
  // 转换为时分秒
  const hours = Math.floor(relativeTime / 3600000);
  const minutes = Math.floor((relativeTime % 3600000) / 60000);
  const seconds = Math.floor((relativeTime % 60000) / 1000);
  
  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
};

// 播放控制
const handlePlay = () => {
  if (!props.trackObj || !currentTrackId.value) return;
  
  props.trackObj.play(currentTrackId.value, currentTime.value);
  isPlaying.value = true;
};

const handlePause = () => {
  if (!props.trackObj) return;
  
  props.trackObj.pause();
  isPlaying.value = false;
};

const handleStop = () => {
  if (!props.trackObj) return;
  
  props.trackObj.stop();
  isPlaying.value = false;
  currentTime.value = minTime.value;
};

// 时间滑块变化
const handleTimeChange = () => {
  if (!props.trackObj || !currentTrackId.value) return;
  
  // 如果正在播放，先暂停
  const wasPlaying = isPlaying.value;
  if (wasPlaying) {
    props.trackObj.pause();
  }
  
  // 设置播放位置
  props.trackObj.setPlaybackTime(currentTime.value);
    
  // 如果之前在播放，则继续播放
    if (wasPlaying) {
    props.trackObj.play(currentTrackId.value, currentTime.value);
    }
  };
  
// 速度滑块变化
const handleSpeedChange = () => {
  if (!props.trackObj) return;
  
  props.trackObj.setPlaybackSpeed(playbackSpeed.value);
};

// 循环播放选项变化
const handleLoopChange = () => {
  if (!props.trackObj) return;
  
  props.trackObj.setConfig({ loop: loop.value });
};

// 跟随相机选项变化
const handleCameraChange = () => {
  if (!props.trackObj) return;
  
  props.trackObj.setConfig({ withCamera: withCamera.value });
};

// 显示节点名称选项变化
const handleNodeNamesChange = () => {
  if (!props.trackObj) return;
  
  props.trackObj.setConfig({ showNodeNames: showNodeNames.value });
};

// 收起/展开面板
const handleToggleCollapse = () => {
  collapsed.value = !collapsed.value;
  emit('collapse-change', collapsed.value);
};

// 监听事件更新状态
const setupEventListeners = () => {
  if (!props.trackObj) return;
  
  // 设置事件回调
  props.trackObj.setEventCallback((eventName, payload) => {
    if (eventName === 'track-position-update') {
      // 更新当前时间
      currentTime.value = payload.time;
    } else if (eventName === 'track-play-start') {
      isPlaying.value = true;
    } else if (eventName === 'track-play-pause') {
      isPlaying.value = false;
    } else if (eventName === 'track-play-stop') {
      isPlaying.value = false;
      currentTime.value = minTime.value;
    } else if (eventName === 'track-play-end') {
      isPlaying.value = false;
      currentTime.value = maxTime.value;
    } else if (eventName === 'track-added' || eventName === 'track-removed') {
      // 刷新轨迹列表
      loadTracks();
    } else if (eventName === 'track-selected') {
      currentTrackId.value = payload.trackId;
  }
});
};

// 更新配置
const updateConfig = () => {
  if (!props.trackObj || !props.config) return;
  
  props.trackObj.setConfig(props.config);
  
  // 更新本地状态
  playbackSpeed.value = props.config.speed || 50;
  loop.value = props.config.loop || false;
  withCamera.value = props.config.withCamera || false;
  showNodeNames.value = props.config.showNodeNames || false;
  showTrackList.value = props.config.showTrackList !== false;
  position.value = props.config.position || 'bottom-right';
};

// 生命周期钩子
onMounted(() => {
  // 初始化
  updateConfig();
  setupEventListeners();
  loadTracks();
});

onBeforeUnmount(() => {
  // 如果正在播放，停止播放
  if (isPlaying.value && props.trackObj) {
    props.trackObj.stop();
  }
});

// 监听配置变化
watch(() => props.config, () => {
  updateConfig();
}, { deep: true });
    
// 导出方法
defineExpose({
  selectTrack,
  play: handlePlay,
  pause: handlePause,
  stop: handleStop
});
</script>

<style scoped>
.track-player {
  position: absolute;
  background-color: #fff;
  border-radius: 4px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
  width: 300px;
  max-width: 90%;
  transition: all 0.3s ease;
  z-index: 1000;
}

.position-top-left {
  top: 10px;
  left: 10px;
}

.position-top-right {
  top: 10px;
  right: 10px;
}

.position-bottom-left {
  bottom: 10px;
  left: 10px;
}

.position-bottom-right {
  bottom: 10px;
  right: 10px;
}

.track-player-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 12px;
  background-color: #1890ff;
  color: #fff;
  border-top-left-radius: 4px;
  border-top-right-radius: 4px;
  cursor: pointer;
}

.track-player-title {
  display: flex;
  align-items: center;
  font-size: 14px;
  font-weight: 500;
}

.track-player-title .icon {
  margin-right: 8px;
  display: flex;
  align-items: center;
}

.track-player-actions {
  display: flex;
  align-items: center;
}

.collapse-btn {
  background: none;
  border: none;
  color: #fff;
  cursor: pointer;
  padding: 2px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: transform 0.3s ease;
}

.track-player.collapsed .collapse-btn {
  transform: rotate(180deg);
}

.track-player-content {
  padding: 12px;
  max-height: 60vh;
  overflow-y: auto;
}

.track-list {
  margin-bottom: 12px;
  max-height: 150px;
  overflow-y: auto;
  border: 1px solid #e8e8e8;
  border-radius: 2px;
}

.track-item {
  display: flex;
  align-items: center;
  padding: 6px 8px;
  border-bottom: 1px solid #f0f0f0;
  cursor: pointer;
  transition: background-color 0.3s ease;
}

.track-item:last-child {
  border-bottom: none;
}

.track-item:hover {
  background-color: #f5f5f5;
}

.track-item.active {
  background-color: #e6f7ff;
}

.track-color {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  margin-right: 8px;
}

.track-name {
  flex: 1;
  font-size: 12px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.track-actions {
  display: flex;
  align-items: center;
}

.track-action-btn {
  background: none;
  border: none;
  color: #999;
  cursor: pointer;
  padding: 2px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: color 0.3s ease;
}

.track-action-btn:hover {
  color: #ff4d4f;
}

.player-controls {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.time-slider {
  width: 100%;
}

.time-slider input {
  width: 100%;
  margin-bottom: 4px;
}

.time-display {
  display: flex;
  justify-content: space-between;
  font-size: 12px;
  color: #666;
}

.control-buttons {
  display: flex;
  justify-content: center;
  gap: 12px;
  margin-bottom: 8px;
}

.control-btn {
  background-color: #f5f5f5;
  border: 1px solid #d9d9d9;
  border-radius: 4px;
  padding: 6px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s ease;
}

.control-btn:hover {
  background-color: #e6f7ff;
  border-color: #1890ff;
  color: #1890ff;
}

.control-btn:disabled {
  background-color: #f5f5f5;
  border-color: #d9d9d9;
  color: #bfbfbf;
  cursor: not-allowed;
}

.speed-control {
  margin-bottom: 12px;
}

.speed-control label {
  display: block;
  font-size: 12px;
  margin-bottom: 4px;
}

.speed-control input {
  width: 100%;
}

.options-control {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.option-item {
  display: flex;
  align-items: center;
  font-size: 12px;
}

.option-item input {
  margin-right: 4px;
}

input[type="range"] {
  -webkit-appearance: none;
  width: 100%;
  height: 6px;
  border-radius: 3px;
  background: #e6e6e6;
  outline: none;
}

input[type="range"]::-webkit-slider-thumb {
  -webkit-appearance: none;
  width: 16px;
  height: 16px;
  border-radius: 50%;
  background: #1890ff;
  cursor: pointer;
}

input[type="range"]::-moz-range-thumb {
  width: 16px;
  height: 16px;
  border-radius: 50%;
  background: #1890ff;
  cursor: pointer;
  border: none;
}
</style> 