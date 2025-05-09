<!-- 轨迹播放器组件 -->
<template>
  <div class="track-player" :class="{ 'collapsed': collapsed }">
    <!-- 标题栏 -->
    <div class="track-player-header">
      <div class="track-player-title">轨迹播放器</div>
      <div class="track-player-actions">
        <button class="track-player-collapse-btn" @click="collapsed = !collapsed">
          <span v-if="collapsed">展开</span>
          <span v-else>收起</span>
        </button>
        <button class="track-player-close-btn" @click="$emit('close')">关闭</button>
      </div>
    </div>
    
    <!-- 播放器主体内容 -->
    <div class="track-player-content" v-show="!collapsed">
      <!-- 轨迹列表 -->
      <div class="track-list">
        <div class="track-list-header">
          <span>轨迹列表</span>
        </div>
        <div class="track-list-content" v-if="tracks.size > 0">
          <div 
            v-for="[id, track] in tracks" 
            :key="id" 
            class="track-item"
            :class="{ 'active': activeTrackId === id }"
            @click="selectTrack(id)"
          >
            <div class="track-item-info">
              <div class="track-item-name">{{ track.name }}</div>
              <div class="track-item-detail">{{ formatTrackDetail(track) }}</div>
            </div>
            <div class="track-item-actions">
              <button class="track-item-delete-btn" @click.stop="deleteTrack(id)" title="删除轨迹">
                <span v-html="icons.trackDelete"></span>
              </button>
            </div>
          </div>
        </div>
        <div class="track-list-empty" v-else>
          <span>暂无轨迹数据</span>
        </div>
      </div>
      
      <!-- 播放控制区域 -->
      <div class="track-controls">
        <!-- 播放选项 -->
        <div class="track-options">
          <label class="track-option">
            <input type="checkbox" v-model="loopPlay">
            <span>循环播放</span>
          </label>
          <label class="track-option">
            <input type="checkbox" v-model="followCamera">
            <span>跟随移动</span>
          </label>
        </div>
        
        <!-- 播放按钮 -->
        <div class="track-buttons">
          <button 
            class="track-button track-backward" 
            @click="backward()" 
            :disabled="!activeTrackId || playState !== 'playing'"
            title="快退"
          >
            <span v-html="icons.trackBackward"></span>
          </button>
          
          <button 
            class="track-button track-play" 
            @click="togglePlay()"
            :disabled="!activeTrackId"
            title="播放/暂停"
          >
            <span v-if="playState === 'playing'" v-html="icons.trackPause"></span>
            <span v-else v-html="icons.trackPlay"></span>
          </button>
          
          <button 
            class="track-button track-forward" 
            @click="forward()" 
            :disabled="!activeTrackId || playState !== 'playing'"
            title="快进"
          >
            <span v-html="icons.trackForward"></span>
          </button>
        </div>
        
        <!-- 播放进度 -->
        <div class="track-progress" v-if="activeTrackId">
          <div class="track-progress-bar">
            <div class="track-progress-filled" :style="{ width: progressPercentage + '%' }"></div>
          </div>
          <div class="track-progress-time">
            {{ formatTime(currentTime) }} / {{ formatTime(totalTime) }}
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
import { ref, computed, watch, onMounted, onBeforeUnmount } from 'vue';
import { Track, TrackPlayer as TrackPlayerConfig } from '../types/track';
import { 
  TRACK_PLAY_ICON, 
  TRACK_PAUSE_ICON, 
  TRACK_BACKWARD_ICON, 
  TRACK_FORWARD_ICON, 
  TRACK_DELETE_ICON 
} from '../types/icon';

interface Props {
  trackObj: any; // TrackObject实例
}

const props = defineProps<Props>();
const emit = defineEmits(['close', 'track-selected', 'track-deleted']);

// 播放器状态
const collapsed = ref(false);
const activeTrackId = ref<string | null>(null);
const playState = ref<'stopped' | 'playing' | 'paused'>('stopped');
const loopPlay = ref(false);
const followCamera = ref(true);
const currentTime = ref(0);
const totalTime = ref(0);
const progressPercentage = ref(0);

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

// 初始加载轨迹列表
onMounted(() => {
  if (props.trackObj) {
    refreshTrackList();
  }
});

// 组件销毁前清理
onBeforeUnmount(() => {
  stopProgressTimer();
});

// 监听播放配置变化
watch([loopPlay, followCamera], ([newLoop, newFollowCamera]) => {
  // 如果有活动轨迹并且正在播放，更新播放配置
  if (activeTrackId.value && playState.value === 'playing') {
    const playerConfig: Partial<TrackPlayerConfig> = {
      loop: newLoop,
      withCamera: newFollowCamera
    };
    props.trackObj.play(activeTrackId.value, playerConfig);
  }
});

// 刷新轨迹列表
const refreshTrackList = () => {
  if (props.trackObj) {
    const allTracks = props.trackObj.getAllTracks();
    tracks.value = allTracks;
  }
};

// 选择轨迹
const selectTrack = (id: string) => {
  // 如果已经选择了其他轨迹，先停止播放
  if (activeTrackId.value && activeTrackId.value !== id && playState.value !== 'stopped') {
    props.trackObj.stop(activeTrackId.value);
  }
  
  activeTrackId.value = id;
  playState.value = 'stopped';
  
  // 计算轨迹总时长
  const track = tracks.value.get(id);
  if (track && track.points.length >= 2) {
    const startTime = track.points[0].time;
    const endTime = track.points[track.points.length - 1].time;
    totalTime.value = endTime - startTime;
    currentTime.value = 0;
    progressPercentage.value = 0;
  }
  
  emit('track-selected', id);
};

// 删除轨迹
const deleteTrack = (id: string) => {
  if (props.trackObj) {
    // 如果正在播放，先停止
    if (activeTrackId.value === id && playState.value !== 'stopped') {
      props.trackObj.stop(id);
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
  }
};

// 播放/暂停切换
const togglePlay = () => {
  if (!activeTrackId.value) return;
  
  if (playState.value === 'playing') {
    // 暂停播放
    props.trackObj.pause(activeTrackId.value);
    playState.value = 'paused';
    stopProgressTimer();
  } else {
    // 开始播放
    const playerConfig: Partial<TrackPlayerConfig> = {
      loop: loopPlay.value,
      withCamera: followCamera.value
    };
    
    // 如果是从暂停状态恢复，不需要重新设置进度
    props.trackObj.play(activeTrackId.value, playerConfig);
    playState.value = 'playing';
    
    // 开始进度更新计时器
    startProgressTimer();
  }
};

// 快退
const backward = () => {
  if (!activeTrackId.value || playState.value !== 'playing') return;
  
  // 获取当前进度
  const currentProgress = props.trackObj.getTrackProgress(activeTrackId.value);
  if (currentProgress !== null) {
    // 计算新的进度（后退5%）
    let newProgress = currentProgress - 0.05;
    if (newProgress < 0) newProgress = 0;
    
    // 设置新进度
    props.trackObj.setTrackProgress(activeTrackId.value, newProgress);
    
    // 更新UI进度
    updateProgress(newProgress);
  }
};

// 快进
const forward = () => {
  if (!activeTrackId.value || playState.value !== 'playing') return;
  
  // 获取当前进度
  const currentProgress = props.trackObj.getTrackProgress(activeTrackId.value);
  if (currentProgress !== null) {
    // 计算新的进度（前进5%）
    let newProgress = currentProgress + 0.05;
    if (newProgress > 1) newProgress = 1;
    
    // 设置新进度
    props.trackObj.setTrackProgress(activeTrackId.value, newProgress);
    
    // 更新UI进度
    updateProgress(newProgress);
  }
};

// 开始进度更新计时器
const startProgressTimer = () => {
  // 防止重复启动计时器
  stopProgressTimer();
  
  // 每100毫秒更新一次进度
  progressTimer = window.setInterval(() => {
    if (activeTrackId.value) {
      // 获取当前进度
      const progress = props.trackObj.getTrackProgress(activeTrackId.value);
      if (progress !== null) {
        updateProgress(progress);
        
        // 如果进度为1且不是循环播放，停止计时器
        if (progress >= 1 && !loopPlay.value) {
          playState.value = 'stopped';
          stopProgressTimer();
        }
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
</script>

<style scoped>
.track-player {
  position: absolute;
  right: 10px;
  bottom: 30px;
  width: 320px;
  background-color: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
  z-index: 500;
  overflow: hidden;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
  transition: height 0.3s, opacity 0.3s;
}

.track-player-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 15px;
  background-color: #f0f2f5;
  border-bottom: 1px solid #e8e8e8;
}

.track-player-title {
  font-weight: 600;
  font-size: 14px;
  color: #333;
}

.track-player-actions {
  display: flex;
  gap: 8px;
}

.track-player-collapse-btn,
.track-player-close-btn {
  background: none;
  border: none;
  cursor: pointer;
  font-size: 12px;
  color: #666;
  padding: 4px 8px;
  border-radius: 4px;
}

.track-player-collapse-btn:hover,
.track-player-close-btn:hover {
  background-color: #e6e6e6;
  color: #333;
}

.track-player-content {
  padding: 10px;
}

.track-list {
  margin-bottom: 15px;
}

.track-list-header {
  font-size: 13px;
  font-weight: 600;
  margin-bottom: 8px;
  color: #333;
}

.track-list-content {
  max-height: 200px;
  overflow-y: auto;
  border: 1px solid #e8e8e8;
  border-radius: 4px;
}

.track-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 12px;
  border-bottom: 1px solid #f0f0f0;
  cursor: pointer;
  transition: background-color 0.2s;
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

.track-item-info {
  flex: 1;
  min-width: 0;
}

.track-item-name {
  font-size: 13px;
  font-weight: 500;
  margin-bottom: 3px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.track-item-detail {
  font-size: 11px;
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
  padding: 3px;
  color: #999;
  border-radius: 3px;
  font-size: 14px;
  line-height: 1;
  display: flex;
  align-items: center;
  justify-content: center;
}

.track-item-delete-btn:hover {
  color: #ff4d4f;
  background-color: rgba(255, 77, 79, 0.1);
}

.track-list-empty {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100px;
  color: #999;
  font-size: 13px;
  background-color: #f9f9f9;
  border-radius: 4px;
}

.track-controls {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.track-options {
  display: flex;
  gap: 15px;
  margin-bottom: 5px;
}

.track-option {
  display: flex;
  align-items: center;
  gap: 5px;
  font-size: 12px;
  color: #555;
  cursor: pointer;
}

.track-buttons {
  display: flex;
  justify-content: center;
  gap: 15px;
  margin-bottom: 10px;
}

.track-button {
  background: none;
  border: 1px solid #d9d9d9;
  border-radius: 50%;
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  color: #333;
  transition: all 0.2s;
}

.track-button:hover:not(:disabled) {
  color: #1890ff;
  border-color: #1890ff;
}

.track-button:disabled {
  color: #d9d9d9;
  cursor: not-allowed;
}

.track-play {
  background-color: #f0f0f0;
}

.track-progress {
  margin-top: 5px;
}

.track-progress-bar {
  height: 4px;
  background-color: #f0f0f0;
  border-radius: 2px;
  position: relative;
  margin-bottom: 5px;
}

.track-progress-filled {
  position: absolute;
  left: 0;
  top: 0;
  height: 100%;
  background-color: #1890ff;
  border-radius: 2px;
}

.track-progress-time {
  font-size: 12px;
  color: #999;
  text-align: center;
}

.collapsed .track-player-content {
  display: none;
}
</style> 