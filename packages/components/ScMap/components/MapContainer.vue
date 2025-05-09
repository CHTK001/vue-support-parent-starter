<template>
  <div class="map-container" ref="mapContainer">
    <!-- 地图工具栏 -->
    <MapToolbar
      v-if="showToolbar"
      :toolbarConfig="toolbarConfig"
      @tool-click="handleToolClick"
      @tool-activated="handleToolActivated"
      @tool-deactivated="handleToolDeactivated"
    />
    
    <!-- 轨迹播放器 -->
    <TrackPlayer
      v-if="showTrackPlayer"
      :trackObj="trackObj"
      @close="handleTrackPlayerClose"
      @track-selected="handleTrackSelected"
      @track-deleted="handleTrackDeleted"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount, watch, computed } from 'vue';
import MapToolbar from '../../ScLayer/components/MapToolbar.vue';
import TrackPlayer from '../../ScLayer/components/TrackPlayer.vue';
import { MapObject } from '../../ScLayer/composables/MapObject';
import { ToolbarObject } from '../../ScLayer/composables/ToolbarObject';
import { TrackObject } from '../../ScLayer/composables/TrackObject';
import type { ToolbarConfig } from '../../ScLayer/types/toolbar';

// ... existing code ...

// 轨迹播放器相关状态
const showTrackPlayer = ref(false);
const trackObj = ref<TrackObject | null>(null);

// ... existing code ...

// 处理工具激活事件
const handleToolActivated = (toolId: string, toolType: string, data: any) => {
  // ... existing code ...
  
  // 处理轨迹播放器激活
  if (toolId === 'track-player') {
    showTrackPlayer.value = true;
    trackObj.value = data?.trackObj || null;
  }
};

// 处理工具停用事件
const handleToolDeactivated = (toolId: string) => {
  // ... existing code ...
  
  // 处理轨迹播放器停用
  if (toolId === 'track-player') {
    showTrackPlayer.value = false;
  }
};

// 处理轨迹播放器关闭事件
const handleTrackPlayerClose = () => {
  // 停用轨迹播放器工具
  if (toolbarObj.value) {
    toolbarObj.value.deactivateTool('track-player');
  }
  showTrackPlayer.value = false;
};

// 处理轨迹选择事件
const handleTrackSelected = (trackId: string) => {
  console.log('选中轨迹:', trackId);
  // 可以在这里添加其他处理逻辑
};

// 处理轨迹删除事件
const handleTrackDeleted = (trackId: string) => {
  console.log('删除轨迹:', trackId);
  // 可以在这里添加其他处理逻辑
};

// ... existing code ...
</script> 