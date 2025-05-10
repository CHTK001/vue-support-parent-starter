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
      v-if="showTrackPlayer && isTrackPlayerToolActive"
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
const isTrackPlayerToolActive = ref(false); // 新增：用于跟踪工具栏轨迹按钮的激活状态

// 检查轨迹播放器工具是否激活
const checkTrackPlayerToolActive = () => {
  if (toolbarObj.value) {
    const trackPlayerTool = toolbarObj.value.getTools().find(t => t.id === 'track-player');
    isTrackPlayerToolActive.value = !!trackPlayerTool?.active;
    console.log('轨迹播放器工具激活状态:', isTrackPlayerToolActive.value);
    
    // 如果工具未激活，确保轨迹播放器不显示
    if (!isTrackPlayerToolActive.value) {
      showTrackPlayer.value = false;
    }
  } else {
    isTrackPlayerToolActive.value = false;
    showTrackPlayer.value = false;
  }
  return isTrackPlayerToolActive.value;
};

// 组件挂载后初始化检查
onMounted(() => {
  // 确保轨迹播放器的显示状态与工具栏状态一致
  setTimeout(() => {
    checkTrackPlayerToolActive();
  }, 500); // 延迟检查，确保工具栏已完全初始化
});

// 当toolbarObj变化时重新检查轨迹播放器工具状态
watch(() => toolbarObj.value, () => {
  checkTrackPlayerToolActive();
}, { immediate: true });

// ... existing code ...

// 处理工具激活事件
const handleToolActivated = (toolId: string, toolType: string, data: any) => {
  // ... existing code ...
  
  // 处理轨迹播放器激活
  if (toolId === 'track-player') {
    // 更新工具激活状态
    isTrackPlayerToolActive.value = true;
    // 只有在工具真正激活时才显示UI
    if (isTrackPlayerToolActive.value) {
      showTrackPlayer.value = true;
      trackObj.value = data?.trackObj || null;
      console.log('轨迹播放器已激活，显示UI');
    } else {
      console.log('工具未激活，不显示轨迹播放器');
    }
  }
};

// 处理工具停用事件
const handleToolDeactivated = (toolId: string) => {
  // ... existing code ...
  
  // 处理轨迹播放器停用
  if (toolId === 'track-player') {
    isTrackPlayerToolActive.value = false;
    showTrackPlayer.value = false;
    console.log('轨迹播放器工具已停用，隐藏UI');
  }
};

// 处理轨迹播放器关闭事件
const handleTrackPlayerClose = () => {
  // 确保轨迹播放器UI被隐藏
  showTrackPlayer.value = false;
  isTrackPlayerToolActive.value = false;
  
  // 停用轨迹播放器工具
  if (toolbarObj.value) {
    // 只有在工具被激活的情况下才需要停用
    const trackPlayerTool = toolbarObj.value.getTools().find(t => t.id === 'track-player');
    if (trackPlayerTool?.active) {
      toolbarObj.value.deactivateTool('track-player');
      console.log('轨迹播放器工具已经停用');
    } else {
      console.log('轨迹播放器工具未激活，无需停用');
    }
  }
  
  // 重新检查工具状态
  checkTrackPlayerToolActive();
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