<!-- 轨迹播放器组件 -->
<template>
  <div
    class="track-player"
    :class="{ collapsed: collapsed, playing: playState === 'playing' }"
    :style="trackPlayerStyle"
    @click="collapsed && toggleCollapse()"
  >
    <!-- 标题栏 -->
    <div class="track-player-header">
      <div class="track-player-title">轨迹播放器</div>
      <div class="track-player-actions">
        <!-- 开发环境下显示示例数据按钮 -->
        <div
          v-if="isDevelopment"
          class="track-player-demo-btn"
          @click.stop="loadDemoTracks"
          title="加载示例数据"
        >
          <div class="demo-icon">
            <span>🔍</span>
          </div>
        </div>
        <!-- 设置按钮 -->
        <div
          class="track-player-setting-btn"
          @click.stop="toggleSettings"
          title="播放设置"
        >
          <div class="setting-icon">
            <span>⚙</span>
          </div>
        </div>
        <!-- 收缩/展开按钮 -->
        <div
          class="track-player-collapse-btn"
          @click.stop="toggleCollapse"
          title="收缩/展开"
        >
          <div class="collapse-icon">
            <span v-if="collapsed">
              <span v-html="TRACK_PLAYER_ICON" />
            </span>
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
          <div class="track-settings-close" @click="showSettings = false">
            ×
          </div>
        </div>
        <div class="track-settings-body">
          <!-- 轨迹设置组 -->
          <div class="settings-group">
            <div class="settings-group-title">轨迹设置</div>
            <div class="settings-options">
              <label class="settings-option">
                <input type="checkbox" v-model="loopPlay" />
                <span>循环播放</span>
              </label>
              <label class="settings-option">
                <input type="checkbox" v-model="followCamera" />
                <span>跟随移动</span>
              </label>
              <!-- 添加性能模式选项 -->
              <label class="settings-option performance-mode">
                <input type="checkbox" v-model="performanceMode" />
                <span>性能模式</span>
                <div class="tooltip">
                  使用高性能动画模式，仅支持速度因子、相机跟随、速度图标切换
                </div>
              </label>
            </div>
          </div>

          <!-- 节点设置组 -->
          <div class="settings-group">
            <div class="settings-group-title">静态节点设置</div>
            <div class="settings-options">
              <label
                class="settings-option"
                :class="{ disabled: performanceMode }"
              >
                <input
                  type="checkbox"
                  v-model="showNodes"
                  :disabled="performanceMode"
                />
                <span>节点显示</span>
              </label>
              <label
                class="settings-option"
                :class="{ disabled: !showNodes || performanceMode }"
              >
                <input
                  type="checkbox"
                  v-model="showNodeAnchors"
                  :disabled="!showNodes || performanceMode"
                />
                <span>节点锚点</span>
              </label>
              <label
                class="settings-option"
                :class="{ disabled: performanceMode }"
              >
                <input
                  type="checkbox"
                  v-model="showNodePopover"
                  :disabled="performanceMode"
                />
                <span>节点名称</span>
              </label>
              <label
                class="settings-option"
                :class="{ disabled: performanceMode }"
              >
                <input
                  type="checkbox"
                  v-model="showNodeTime"
                  :disabled="performanceMode"
                />
                <span>节点时间</span>
              </label>
              <label
                class="settings-option"
                :class="{ disabled: performanceMode }"
              >
                <input
                  type="checkbox"
                  v-model="showNodeSpeed"
                  :disabled="performanceMode"
                />
                <span>节点速度</span>
              </label>
              <label
                class="settings-option"
                :class="{ disabled: performanceMode }"
              >
                <input
                  type="checkbox"
                  v-model="showNodeDistance"
                  :disabled="performanceMode"
                />
                <span>节点距离</span>
              </label>
            </div>
          </div>

          <!-- 点位设置组 -->
          <div class="settings-group">
            <div class="settings-group-title">移动点位设置</div>
            <div class="settings-options">
              <label
                class="settings-option"
                :class="{ disabled: performanceMode }"
              >
                <input
                  type="checkbox"
                  v-model="showMovingInfo"
                  :disabled="performanceMode"
                />
                <span>移动信息</span>
              </label>
              <label
                class="settings-option"
                :class="{ disabled: performanceMode }"
              >
                <input
                  type="checkbox"
                  v-model="showMovingPointName"
                  :disabled="performanceMode"
                />
                <span>移动名称</span>
              </label>
              <label
                class="settings-option"
                :class="{ disabled: performanceMode }"
              >
                <input
                  type="checkbox"
                  v-model="showSpeedPopover"
                  :disabled="performanceMode"
                />
                <span>移动速度</span>
              </label>
              <label
                class="settings-option"
                :class="{ disabled: performanceMode }"
              >
                <input
                  type="checkbox"
                  v-model="showMovingDistance"
                  :disabled="performanceMode"
                />
                <span>移动距离</span>
              </label>
              <label class="settings-option">
                <input type="checkbox" v-model="enableSpeedIcon" />
                <span>移动图标</span>
              </label>
            </div>
          </div>
        </div>
        <div class="track-settings-footer">
          <button class="settings-apply-btn" @click="showSettings = false">
            确认
          </button>
        </div>
      </div>
    </div>

    <!-- 折叠状态时显示的图标 -->
    <div class="collapsed-icon" v-if="collapsed">
      <span v-if="playState === 'playing'" class="playing-indicator">▶</span>
      <span v-else>
        <span
          v-html="TRACK_PLAYER_ICON"
          style="color: var(--el-text-color-primary) !important"
        />
      </span>
    </div>

    <!-- 播放器主体内容 -->
    <div class="track-player-content" v-show="!collapsed">
      <!-- 轨迹列表 -->
      <div class="track-list">
        <div class="track-list-header">
          <span>轨迹列表</span>
        </div>
        <div class="track-list-content thin-scrollbar" v-if="tracks.size > 0">
          <div
            v-for="[id, track] in tracks"
            :key="id"
            class="track-item"
            :class="{
              active: activeTrackId === id,
              disabled: playState === 'playing' && activeTrackId !== id,
            }"
            @click="canSwitchTrack && selectTrack(id)"
            @dblclick="fitToTrackView(id)"
          >
            <div class="track-item-info">
              <div class="track-item-name">
                {{ getTrackNameWithLength(track, id) }}
              </div>
              <div class="track-item-detail">
                {{ formatTrackDetail(track) }}
              </div>
            </div>
            <div class="track-item-actions">
              <button
                class="track-item-delete-btn"
                @click.stop="deleteTrack(id)"
                :disabled="playState === 'playing'"
                :title="
                  playState === 'playing' ? '播放中无法删除轨迹' : '删除轨迹'
                "
              >
                <span v-html="icons.trackDelete"></span>
              </button>
            </div>
          </div>
        </div>
        <div class="track-list-empty" v-else>
          <span>暂无轨迹数据 ({{ tracks.size }})</span>
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
            @input="onSpeedChange"
            class="speed-slider"
            :disabled="!activeTrackId"
          />
          <div class="speed-labels">
            <span>慢</span>
            <span>正常</span>
            <span>快</span>
          </div>
        </div>

        <!-- 播放按钮 -->
        <div class="track-buttons">
          <button
            class="track-button track-backward"
            @click="setSpeed(Math.max(0.5, speedFactor - 0.5))"
            :disabled="!activeTrackId"
            title="减速"
          >
            <span v-html="icons.trackBackward"></span>
          </button>

          <button
            class="track-button track-play"
            @click="togglePlay()"
            :disabled="!activeTrackId"
            title="播放/暂停"
          >
            <span
              v-if="playState === 'playing'"
              v-html="icons.trackPause"
            ></span>
            <span v-else v-html="icons.trackPlay"></span>
          </button>

          <button
            class="track-button track-forward"
            @click="setSpeed(Math.min(10, speedFactor + 0.5))"
            :disabled="!activeTrackId"
            title="加速"
          >
            <span v-html="icons.trackForward"></span>
          </button>
          <button
            class="track-button track-forward track-camera"
            :class="{ active: followCamera }"
            @click="followCamera = !followCamera"
            :disabled="!activeTrackId"
            title="跟随移动"
          >
            <span v-html="icons.trackFollowCamera"></span>
          </button>
        </div>

        <!-- 播放进度 -->
        <div class="track-progress" v-if="activeTrackId">
          <div class="track-progress-bar" @click="handleProgressClick">
            <div
              class="track-progress-filled"
              :style="{ width: progressPercentage + '%' }"
            ></div>
            <div
              class="track-progress-handle"
              :style="{ left: progressPercentage + '%' }"
              @mousedown="startProgressDrag"
              :class="{ active: isDraggingProgress }"
            ></div>
            <!-- 添加点位标记 -->
            <div class="track-progress-points" v-if="trackPoints.length > 0">
              <div
                v-for="(point, index) in trackPoints"
                :key="index"
                class="track-point-marker"
                :class="{
                  'static-point': point.isStatic,
                  'passed-point': point.isPassed,
                  'current-point': point.isCurrent,
                }"
                :style="{ left: point.position + '%' }"
                :title="point.title"
                @click.stop="jumpToPoint(point.index)"
              ></div>
            </div>
          </div>
          <div class="track-progress-time">
            {{ formatTime(currentTime) }} / {{ formatTime(totalTime) }}
          </div>
          <div
            class="track-static-points-info"
            v-if="getStaticPointsWithDistance().length"
          >
            <span
              v-for="item in getStaticPointsWithDistance()"
              :key="item.index"
              style="display: inline-block; margin-right: 12px"
            >
              静态点: {{ item.title }}（距上点
              {{ item.distance.toFixed(2) }} 公里）
            </span>
          </div>
          <!-- 当前速度显示 -->
          <div class="track-current-speed" v-if="currentSpeed > 0">
            <template v-if="speedFactor === 1.0">
              当前速度: {{ currentSpeed.toFixed(1) }} km/h
            </template>
            <template v-else>
              当前速度: {{ (currentSpeed * speedFactor).toFixed(1) }} km/h
              (实际: {{ currentSpeed.toFixed(1) }} km/h)
            </template>
            <!-- 新增：已行驶路程和距离下一个点 -->
            <div
              class="track-current-distance-info"
              style="
                margin-top: 4px;
                font-size: 12px;
                color: var(--el-color-primary);
              "
            >
              <span>已行驶：{{ getDistanceFromStart().toFixed(2) }} 公里</span>
              <span
                v-if="getDistanceToNextPoint() > 0"
                style="margin-left: 16px"
                >距离下个点：{{
                  getDistanceToNextPoint().toFixed(2)
                }}
                公里</span
              >
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
export default {
  name: "TrackPlayer",
};
</script>

<script setup lang="ts">
import {
  ref,
  computed,
  watch,
  onMounted,
  onBeforeUnmount,
  watchEffect,
  getCurrentInstance,
  nextTick,
} from "vue";
import { Track, TrackPlayer as TrackPlayerConfig } from "../types/track";
import { DEFAULT_TRACK_SPEED_GROUPS } from "../types/default";
import {
  TRACK_PLAYER_ICON,
  TRACK_PLAY_ICON,
  TRACK_PAUSE_ICON,
  TRACK_BACKWARD_ICON,
  TRACK_FORWARD_ICON,
  TRACK_DELETE_ICON,
  TRACK_FOLLOW_CAMERA_ICON,
} from "../types/icon";

// 环境变量判断
const isDevelopment = ref(process.env.NODE_ENV === "development");

// 定义TrackPoint接口
interface TrackPoint {
  lat: number;
  lng: number;
  time: number;
  title?: string;
  staticTitle?: string;
  [key: string]: any;
}

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
    setTrackNodeTimeVisible?: (id: string, visible: boolean) => boolean;
    setMovingPointNameVisible?: (id: string, visible: boolean) => boolean;
    setTrackSpeedPopoversVisible?: (id: string, visible: boolean) => boolean;
    setTrackNodeSpeedsVisible?: (id: string, visible: boolean) => boolean;
    setTrackNodeAnchorsVisible?: (id: string, visible: boolean) => boolean;
    hideTrack?: (id: string) => boolean;
    showTrack?: (id: string) => boolean;
    fitTrackToView?: (id: string, config: any) => void;
    setConfig?: (config: any) => void;
    getActiveImplementation?: () => any;
    getTrackPlayState?: (id: string) => "playing" | "paused" | "stopped" | null;
    addTrack?: (track: Track, config?: any) => boolean;
    getTrackTotalDistance?: (id: string) => number | null;
    getDistanceBetweenPoints?: (
      id: string,
      point1Index: number,
      point2Index: number,
    ) => number | null;
    getDistanceFromStart?: (id: string, pointIndex: number) => number | null;
    // 添加缺失的方法声明
    setTrackNodeDistanceVisible?: (id: string, visible: boolean) => boolean;
    setEnableSpeedIcon?: (id: string, enabled: boolean) => boolean;
    releaseCameraLock?: (id: string) => boolean;
    refreshTrack?: (id: string) => boolean;
    getTrackPlayer?: (id: string) => any;
    setMovingInfoVisible?: (id: string, visible: boolean) => boolean;
    setMovingDistanceVisible?: (id: string, visible: boolean) => boolean;
  };
  config?: {
    loop?: boolean; // 是否循环播放
    speed?: number; // 默认播放速度(km/h)
    withCamera?: boolean; // 是否跟随相机
    speedFactor?: number; // 速度因子
    showNodes?: boolean; // 是否显示节点（静态点位）
    showNodeAnchors?: boolean; // 是否显示节点锚点
    showNodeNames?: boolean; // 是否显示节点名称（静态点位名称）
    showNodeTime?: boolean; // 是否显示节点时间
    showPointNames?: boolean; // 是否显示点位名称（移动点位名称）
    showSpeed?: boolean; // 是否显示移动速度
    showNodeSpeed?: boolean; // 是否显示节点速度
    showNodeDistance?: boolean; // 是否显示节点距离
    updateFrequency?: number; // 更新频率(毫秒)，控制进度更新的时间间隔
    performanceMode?: boolean; // 是否使用性能模式
    showMovingInfo?: boolean; // 是否显示移动点信息
    showMovingDistance?: boolean; // 是否显示移动点距离
  };
}

const props = defineProps<Props>();
const emit = defineEmits([
  "track-selected",
  "track-deleted",
  "collapse-change",
  "close",
]);

// 播放器状态
const collapsed = ref(false);
const activeTrackId = ref<string | null>(null);
const playState = ref<"stopped" | "playing" | "paused">("stopped");
const loopPlay = ref(false);
const followCamera = ref(false);
const showNodes = ref(true); // 是否显示轨迹节点，默认显示
const showNodeAnchors = ref(false); // 是否显示节点锚点，默认不显示
const showNodePopover = ref(true); // 修改为true，与TrackObject.ts默认行为一致
const showNodeTime = ref(false); // 是否显示节点时间，默认不显示
const showSpeedPopover = ref(true); // 是否显示速度弹窗，默认显示
const showNodeSpeed = ref(false); // 是否显示节点速度，默认不显示
const showNodeDistance = ref(false); // 是否显示节点距离，默认不显示
const showMovingPointName = ref(true); // 是否显示移动点位的名称，默认显示
const showMovingInfo = ref(true); // 是否显示移动点信息，默认显示
const showMovingDistance = ref(true); // 是否显示移动点距离，默认显示
const currentTime = ref(0);
const totalTime = ref(0);
const progressPercentage = ref(0);
const speedFactor = ref(1.0);
const isDraggingProgress = ref(false);
const currentSpeed = ref(0); // 当前轨迹点的速度
const showSettings = ref(false);
const enableSpeedIcon = ref(true);
const updateFrequency = ref(100); // 默认100毫秒更新一次，高频模式
const performanceMode = ref(false); // 是否启用性能模式，默认关闭

// 保存原始配置，用于性能模式切换时恢复
const originalConfig = ref({
  showNodes: true,
  showNodeAnchors: false,
  showNodePopover: true,
  showNodeTime: false,
  showSpeedPopover: true,
  showNodeSpeed: false,
  showNodeDistance: false,
  showMovingPointName: true,
  showMovingInfo: true,
  showMovingDistance: true,
  enableSpeedIcon: true,
});

// 计算属性：是否可以切换轨迹
const canSwitchTrack = computed(() => {
  return playState.value !== "playing";
});

// 轨迹播放器样式配置
const trackPlayerConfig = {
  width: 320,
  height: "auto",
  collapsedWidth: 40,
  collapsedHeight: 40,
  buttonSize: 24,
};

// 计算轨迹播放器样式
const trackPlayerStyle = computed(() => {
  return {
    width: collapsed.value
      ? `${trackPlayerConfig.collapsedWidth}px`
      : `${trackPlayerConfig.width}px`,
    height: collapsed.value
      ? `${trackPlayerConfig.collapsedHeight}px`
      : trackPlayerConfig.height,
    transition: "width 0.3s, height 0.3s, transform 0.3s",
    contain: "layout style",
  };
});

// 轨迹数据
const tracks = ref(new Map<string, Track>());
// 进度条上的点位标记数据
const trackPoints = ref<
  Array<{
    index: number; // 点位在轨迹中的索引
    position: number; // 在进度条上的位置百分比
    title: string; // 点位标题
    isStatic: boolean; // 是否是静态点位
    isPassed: boolean; // 是否已经过
    isCurrent: boolean; // 是否是当前点位
  }>
>([]);

// 图标
const icons = {
  trackPlay: TRACK_PLAY_ICON,
  trackPause: TRACK_PAUSE_ICON,
  trackBackward: TRACK_BACKWARD_ICON,
  trackForward: TRACK_FORWARD_ICON,
  trackDelete: TRACK_DELETE_ICON,
  trackFollowCamera: TRACK_FOLLOW_CAMERA_ICON,
};

// 更新播放进度的计时器
let progressTimer: number | null = null;

// 刷新轨迹列表
const refreshTrackList = () => {
  if (props.trackObj && props.trackObj.getAllTracks) {
    try {
      // 保存当前选中的轨迹ID
      const currentActiveTrackId = activeTrackId.value;

      // 获取新的轨迹列表
      const allTracks = props.trackObj.getAllTracks();

      // 检查是否有新增轨迹
      if (allTracks.size !== tracks.value.size) {
        console.log("轨迹列表已更新，总数:", allTracks.size);
      }

      // 创建新的Map实例以触发Vue的响应式更新
      const newTracks = new Map();
      allTracks.forEach((track, id) => {
        newTracks.set(id, track);
      });

      // 更新轨迹列表 - 使用新Map实例而非直接赋值
      tracks.value = newTracks;

      console.log("轨迹列表已刷新，当前轨迹数:", tracks.value.size, "轨迹ID:", [
        ...tracks.value.keys(),
      ]);

      // 如果之前有选中的轨迹，且该轨迹仍然存在，保持选中状态
      if (currentActiveTrackId && tracks.value.has(currentActiveTrackId)) {
        // 保持当前选中状态不变
        activeTrackId.value = currentActiveTrackId;
      }
    } catch (error) {
      console.error("刷新轨迹列表时发生错误:", error);
      // 出错时清空轨迹列表
      tracks.value = new Map();
    }
  }
};

// 停止进度更新计时器
const stopProgressTimer = () => {
  if (progressTimer !== null) {
    window.clearInterval(progressTimer);
    progressTimer = null;
  }
};

// 应用配置
const applyConfig = () => {
  if (props.config) {
    try {
      // 应用UI配置
      if (props.config.loop !== undefined) loopPlay.value = props.config.loop;
      if (props.config.withCamera !== undefined)
        followCamera.value = props.config.withCamera;
      if (props.config.speedFactor !== undefined)
        speedFactor.value = props.config.speedFactor;
      if (props.config.showNodes !== undefined)
        showNodes.value = props.config.showNodes;
      if (props.config.showNodeAnchors !== undefined)
        showNodeAnchors.value = props.config.showNodeAnchors;
      if (props.config.showNodeNames !== undefined)
        showNodePopover.value = props.config.showNodeNames;
      if (props.config.showNodeTime !== undefined)
        showNodeTime.value = props.config.showNodeTime;
      if (props.config.showPointNames !== undefined)
        showMovingPointName.value = props.config.showPointNames;
      if (props.config.showSpeed !== undefined)
        showSpeedPopover.value = props.config.showSpeed;
      if (props.config.showNodeSpeed !== undefined)
        showNodeSpeed.value = props.config.showNodeSpeed;
      if (props.config.showNodeDistance !== undefined)
        showNodeDistance.value = props.config.showNodeDistance;
      if (props.config.updateFrequency !== undefined)
        updateFrequency.value = props.config.updateFrequency;
      if (props.config.performanceMode !== undefined)
        performanceMode.value = props.config.performanceMode;
      if (props.config.showMovingInfo !== undefined)
        showMovingInfo.value = props.config.showMovingInfo;
      if (props.config.showMovingDistance !== undefined)
        showMovingDistance.value = props.config.showMovingDistance;

      // 保存初始配置到原始配置
      originalConfig.value = {
        showNodes: showNodes.value,
        showNodeAnchors: showNodeAnchors.value,
        showNodePopover: showNodePopover.value,
        showNodeTime: showNodeTime.value,
        showSpeedPopover: showSpeedPopover.value,
        showNodeSpeed: showNodeSpeed.value,
        showNodeDistance: showNodeDistance.value,
        showMovingPointName: showMovingPointName.value,
        showMovingInfo: showMovingInfo.value,
        showMovingDistance: showMovingDistance.value,
        enableSpeedIcon: enableSpeedIcon.value,
      };

      console.log("轨迹播放器配置已应用:", JSON.stringify(props.config));

      // 如果有活动轨迹，且trackObj存在，应用配置到轨迹对象
      if (activeTrackId.value && props.trackObj) {
        // 检查每个方法是否存在，并应用配置
        const applyTrackSettings = () => {
          if (!activeTrackId.value) return;

          // 使用可选链确保方法存在
          props.trackObj.setTrackNodesVisible?.(
            activeTrackId.value,
            showNodes.value,
          );
          props.trackObj.setTrackNodeAnchorsVisible?.(
            activeTrackId.value,
            showNodeAnchors.value,
          );
          props.trackObj.setTrackNodePopoversVisible?.(
            activeTrackId.value,
            showNodePopover.value,
          );
          props.trackObj.setTrackNodeTimeVisible?.(
            activeTrackId.value,
            showNodeTime.value,
          );
          props.trackObj.setMovingPointNameVisible?.(
            activeTrackId.value,
            showMovingPointName.value,
          );
          props.trackObj.setTrackSpeedPopoversVisible?.(
            activeTrackId.value,
            showSpeedPopover.value,
          );
          props.trackObj.setTrackNodeSpeedsVisible?.(
            activeTrackId.value,
            showNodeSpeed.value,
          );
          props.trackObj.setTrackNodeDistanceVisible?.(
            activeTrackId.value,
            showNodeDistance.value,
          );
          props.trackObj.setEnableSpeedIcon?.(
            activeTrackId.value,
            enableSpeedIcon.value,
          );
          props.trackObj.setMovingInfoVisible?.(
            activeTrackId.value,
            showMovingInfo.value,
          );
          props.trackObj.setMovingDistanceVisible?.(
            activeTrackId.value,
            showMovingDistance.value,
          );

          // 设置播放配置
          props.trackObj.setTrackPlayer?.(activeTrackId.value, {
            loop: loopPlay.value,
            withCamera: followCamera.value,
            speedFactor: speedFactor.value,
            useAdvancedAnimation: performanceMode.value,
          });
        };

        // 应用轨迹设置
        applyTrackSettings();
      }
    } catch (error) {
      console.error("应用轨迹播放器配置时发生错误:", error);
    }
  }
};

// 组件挂载
onMounted(() => {
  // 应用外部配置
  applyConfig();

  if (props.trackObj) {
    refreshTrackList();

    // 监听自定义事件，当添加轨迹时强制刷新列表
    const trackPlayerElement = document.querySelector(".track-player");
    if (trackPlayerElement) {
      trackPlayerElement.addEventListener("track-added", (event: Event) => {
        console.log("收到轨迹添加事件，强制刷新列表");
        refreshTrackList();

        // 如果有活动轨迹，更新点位标记
        if (activeTrackId.value) {
          updateTrackPoints();
        }
      });
    }

    // 检查工具是否真的激活
    try {
      if (
        props.trackObj &&
        typeof props.trackObj.getMapInstance === "function"
      ) {
        const map = props.trackObj.getMapInstance();
        if (map) {
          // 尝试从DOM元素获取toolbarObj
          const targetElement = map.getTargetElement();
          if (targetElement && targetElement["toolbarObj"]) {
            const toolbarObj = targetElement["toolbarObj"];
            const isTrackPlayerActive =
              toolbarObj.getTools().find((t) => t.id === "track-player")
                ?.active || false;
            if (!isTrackPlayerActive) {
              console.warn("轨迹播放器组件挂载时发现工具未激活，可能需要关闭");
              emit("close");
            }

            // 将轨迹播放器组件引用保存到地图元素中，以便工具栏对象访问
            targetElement["trackPlayerComponent"] =
              getCurrentInstance()?.exposed;
            console.log("轨迹播放器组件引用已保存到地图元素");
          }
        }
      } else {
        console.warn(
          "trackObj未定义或不包含getMapInstance方法，跳过检查工具激活状态",
        );
      }
    } catch (error) {
      console.error("检查工具状态时发生错误:", error);
    }
  }
});

// 监听显示节点距离设置的变化
watch(showNodeDistance, (newValue) => {
  if (
    activeTrackId.value &&
    props.trackObj &&
    props.trackObj.setTrackNodeDistanceVisible
  ) {
    props.trackObj.setTrackNodeDistanceVisible(activeTrackId.value, newValue);
    // 强制刷新轨迹显示
    props.trackObj.refreshTrack?.(activeTrackId.value);
    console.log(`节点距离显示已${newValue ? "启用" : "禁用"} (实时应用)`);
  }
});

// 新增：监听节点名称显示
watch(showNodePopover, (newValue) => {
  if (
    activeTrackId.value &&
    props.trackObj &&
    props.trackObj.setTrackNodePopoversVisible
  ) {
    props.trackObj.setTrackNodePopoversVisible(activeTrackId.value, newValue);
    // 强制刷新轨迹显示
    props.trackObj.refreshTrack?.(activeTrackId.value);
    console.log(`节点名称显示已${newValue ? "启用" : "禁用"} (实时应用)`);
  }
});

// 新增：监听节点时间显示
watch(showNodeTime, (newValue) => {
  if (
    activeTrackId.value &&
    props.trackObj &&
    props.trackObj.setTrackNodeTimeVisible
  ) {
    props.trackObj.setTrackNodeTimeVisible(activeTrackId.value, newValue);
    // 强制刷新轨迹显示
    props.trackObj.refreshTrack?.(activeTrackId.value);
    console.log(`节点时间显示已${newValue ? "启用" : "禁用"} (实时应用)`);
  }
});

// 新增：监听节点锚点显示
watch(showNodeAnchors, (newValue) => {
  if (
    activeTrackId.value &&
    props.trackObj &&
    props.trackObj.setTrackNodeAnchorsVisible
  ) {
    props.trackObj.setTrackNodeAnchorsVisible(activeTrackId.value, newValue);
  }
});

// 新增：监听节点速度显示
watch(showNodeSpeed, (newValue) => {
  if (
    activeTrackId.value &&
    props.trackObj &&
    props.trackObj.setTrackNodeSpeedsVisible
  ) {
    props.trackObj.setTrackNodeSpeedsVisible(activeTrackId.value, newValue);
    // 强制刷新轨迹显示
    props.trackObj.refreshTrack?.(activeTrackId.value);
    console.log(`节点速度显示已${newValue ? "启用" : "禁用"} (实时应用)`);
  }
});

// 组件销毁前清理
onBeforeUnmount(() => {
  stopProgressTimer();
});

// 切换收缩/展开状态
const toggleCollapse = () => {
  // 更改折叠状态
  collapsed.value = !collapsed.value;

  // 使用 requestAnimationFrame 确保在下一帧动画开始前通知父组件
  // 这样可以避免在同一帧内的布局计算和重绘
  requestAnimationFrame(() => {
    // 通知父组件折叠状态变化
    emit("collapse-change", collapsed.value);
  });
};

// 格式化轨迹详情
const formatTrackDetail = (track: Track): string => {
  if (!track.points || track.points.length === 0) {
    return "无轨迹点";
  }

  const pointCount = track.points.length;
  const startTime = new Date(track.points[0].time * 1000).toLocaleString();
  const endTime = new Date(
    track.points[pointCount - 1].time * 1000,
  ).toLocaleString();

  // 计算轨迹总距离
  const totalDistance = calculateTotalDistance(track.points as TrackPoint[]);
  const formattedDistance = totalDistance.toFixed(2);

  return `${pointCount}个点 · ${formattedDistance}公里 · ${startTime} ~ ${endTime}`;
};

// 添加计算两点之间距离的辅助函数（哈弗赛因公式）
const calculateDistance = (
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number,
): number => {
  // 地球半径（公里）
  const R = 6371;

  // 将角度转换为弧度
  const toRad = (value: number) => (value * Math.PI) / 180;

  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lng2 - lng1);
  const lat1Rad = toRad(lat1);
  const lat2Rad = toRad(lat2);

  // 哈弗赛因公式
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.sin(dLon / 2) *
      Math.sin(dLon / 2) *
      Math.cos(lat1Rad) *
      Math.cos(lat2Rad);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  // 距离（公里）
  return R * c;
};

// 计算轨迹总距离
const calculateTotalDistance = (points: TrackPoint[]): number => {
  if (!points || points.length < 2) return 0;

  let totalDistance = 0;

  for (let i = 1; i < points.length; i++) {
    const prevPoint = points[i - 1];
    const currentPoint = points[i];

    // 计算相邻两点之间的距离
    const distance = calculateDistance(
      prevPoint.lat,
      prevPoint.lng,
      currentPoint.lat,
      currentPoint.lng,
    );

    totalDistance += distance;
  }

  return totalDistance;
};

// 删除轨迹
const deleteTrack = (id: string) => {
  // 播放中不允许删除任何轨迹
  if (playState.value === "playing") {
    console.warn("播放中无法删除轨迹");
    return;
  }

  if (props.trackObj && props.trackObj.removeTrack) {
    try {
      // 如果正在播放，先停止
      if (activeTrackId.value === id && playState.value !== "stopped") {
        props.trackObj.stop?.(id);
      }

      // 删除轨迹
      props.trackObj.removeTrack(id);

      // 如果删除的是当前活动轨迹，清空活动轨迹
      if (activeTrackId.value === id) {
        activeTrackId.value = null;
        playState.value = "stopped";
        stopProgressTimer();
      }

      // 刷新轨迹列表
      refreshTrackList();

      emit("track-deleted", id);
    } catch (error) {
      console.error("删除轨迹时发生错误:", error);
    }
  }
};

// 自适应显示轨迹（双击轨迹项时调用）
const fitToTrackView = (id: string) => {
  if (!props.trackObj || !props.trackObj.fitTrackToView) return;

  // 如果有正在播放的轨迹，先停止
  if (
    activeTrackId.value &&
    props.trackObj.getTrackPlayState?.(activeTrackId.value) === "playing"
  ) {
    props.trackObj.stop?.(activeTrackId.value);
    playState.value = "stopped";
    stopProgressTimer();
    console.log(`双击前停止当前播放的轨迹: ${activeTrackId.value}`);
  }

  // 选中轨迹
  selectTrack(id);

  // 添加双击视觉反馈
  nextTick(() => {
    const activeElement = document.querySelector(`.track-item.active`);
    if (activeElement) {
      // 添加双击强调类
      activeElement.classList.add("track-highlight-double-click");

      // 几秒后移除特效
      setTimeout(() => {
        activeElement.classList.remove("track-highlight-double-click");
      }, 3000);
    }
  });

  // 调用fitTrackToView方法自适应显示轨迹
  props.trackObj.fitTrackToView(id, {
    gotoStart: false,
    padding: [20, 20, 20, 20],
    duration: 500,
    maxZoom: 18,
  });
  console.log(`自适应显示轨迹: ${id}`);
};

// 速度滑块输入事件处理函数
const onSpeedChange = () => {
  if (activeTrackId.value && props.trackObj) {
    // 立即应用新的速度
    props.trackObj.updateTrackSpeed?.(activeTrackId.value, speedFactor.value);

    // 同时更新轨迹播放器配置
    const playerConfig = {
      loop: loopPlay.value,
      withCamera: followCamera.value,
      speedFactor: speedFactor.value,
    };

    // 先设置基本配置
    props.trackObj.setTrackPlayer?.(activeTrackId.value, playerConfig);

    // 无论播放状态如何，都确保立即应用新配置
    if (props.trackObj.updateTrackPlayer) {
      props.trackObj.updateTrackPlayer(activeTrackId.value, playerConfig);
      console.log(`轨迹播放速度已实时调整为: ${speedFactor.value.toFixed(1)}x`);
    }
  }
};

// 切换设置弹窗
const toggleSettings = () => {
  showSettings.value = !showSettings.value;
};

// 获取轨迹名称和总里程
const getTrackNameWithLength = (track: Track, trackId: string) => {
  if (!track) return "未知轨迹";

  // 计算轨迹总长度
  let totalDistance = "0.00";

  if (
    props.trackObj &&
    typeof props.trackObj.getTrackTotalDistance === "function" &&
    trackId
  ) {
    try {
      const distance = props.trackObj.getTrackTotalDistance(trackId);
      if (distance && distance > 0) {
        totalDistance = distance.toFixed(2);
      }
    } catch (error) {
      console.error("获取轨迹总长度失败:", error);
    }
  }

  return `${track.name || "未命名轨迹"} (${totalDistance}公里)`;
};

// 获取带距离信息的静态点
const getStaticPointsWithDistance = () => {
  // 如果没有活动轨迹或TrackObj对象，返回空数组
  if (!activeTrackId.value || !props.trackObj) return [];

  // 获取轨迹数据
  const track = tracks.value.get(activeTrackId.value);
  if (!track || !track.points || track.points.length < 2) return [];

  const result = [];

  // 遍历所有轨迹点，找出静态点（有staticTitle属性的点）
  for (let i = 1; i < track.points.length; i++) {
    const point = track.points[i];

    // 只处理静态点
    if (point.staticTitle) {
      // 计算与上一个点的距离
      let distance = 0;

      // 如果距离计算函数可用，使用它
      if (props.trackObj.getDistanceBetweenPoints) {
        try {
          const calculatedDistance = props.trackObj.getDistanceBetweenPoints(
            activeTrackId.value,
            i - 1,
            i,
          );
          if (calculatedDistance !== null) {
            distance = calculatedDistance;
          }
        } catch (error) {
          console.error("计算节点距离时出错:", error);
        }
      } else {
        // 回退到手动计算
        const prevPoint = track.points[i - 1];
        distance = calculateDistance(
          prevPoint.lat,
          prevPoint.lng,
          point.lat,
          point.lng,
        );
      }

      result.push({
        index: i,
        title: point.staticTitle,
        distance: distance,
      });
    }
  }

  return result;
};

// 获取从起点到当前位置的距离
const getDistanceFromStart = () => {
  if (!activeTrackId.value || !props.trackObj) return 0;

  // 如果有专用方法可用，优先使用它
  if (props.trackObj.getDistanceFromStart) {
    try {
      const progress =
        props.trackObj.getTrackProgress?.(activeTrackId.value) || 0;
      const pointCount =
        tracks.value.get(activeTrackId.value)?.points?.length || 0;

      // 计算当前节点索引（基于播放进度）
      if (pointCount >= 2) {
        const currentIndex = Math.floor(progress * (pointCount - 1));
        const distance = props.trackObj.getDistanceFromStart(
          activeTrackId.value,
          currentIndex,
        );
        if (distance !== null) return distance;
      }
    } catch (error) {
      console.error("计算起点距离时出错:", error);
    }
  }

  // 如果专用方法失败或不可用，回退到手动计算
  const track = tracks.value.get(activeTrackId.value);
  if (!track || !track.points || track.points.length < 2) return 0;

  const progress = props.trackObj.getTrackProgress?.(activeTrackId.value) || 0;
  const pointCount = track.points.length;

  // 计算当前节点索引
  if (pointCount < 2) return 0;

  const currentIndex = Math.floor(progress * (pointCount - 1));

  // 计算从起点到当前位置的距离
  let totalDistance = 0;
  for (let i = 1; i <= currentIndex; i++) {
    const prevPoint = track.points[i - 1];
    const currentPoint = track.points[i];

    totalDistance += calculateDistance(
      prevPoint.lat,
      prevPoint.lng,
      currentPoint.lat,
      currentPoint.lng,
    );
  }

  return totalDistance;
};

// 获取到下一个点的距离
const getDistanceToNextPoint = () => {
  if (!activeTrackId.value || !props.trackObj) return 0;

  const track = tracks.value.get(activeTrackId.value);
  if (!track || !track.points || track.points.length < 2) return 0;

  const progress = props.trackObj.getTrackProgress?.(activeTrackId.value) || 0;
  const pointCount = track.points.length;

  // 计算当前节点索引
  if (pointCount < 2) return 0;

  const currentIndex = Math.floor(progress * (pointCount - 1));

  // 如果已经是最后一个点，返回0
  if (currentIndex >= pointCount - 1) return 0;

  // 获取当前点和下一个点
  const currentPoint = track.points[currentIndex];
  const nextPoint = track.points[currentIndex + 1];

  // 计算到下一个点的距离
  return calculateDistance(
    currentPoint.lat,
    currentPoint.lng,
    nextPoint.lat,
    nextPoint.lng,
  );
};

// 选择轨迹
const selectTrack = (id: string) => {
  if (!id || !props.trackObj) return;

  try {
    // 先检查是否有正在播放的轨迹，如果有则停止
    const currentPlayingTracks = [];
    if (props.trackObj.getAllTracks) {
      const allTracks = props.trackObj.getAllTracks();
      allTracks.forEach((_, trackId) => {
        const trackState = props.trackObj.getTrackPlayState?.(trackId);
        if (trackState === "playing" || trackState === "paused") {
          currentPlayingTracks.push(trackId);
        }
      });
    }

    // 停止所有正在播放的轨迹
    currentPlayingTracks.forEach((trackId) => {
      props.trackObj.stop?.(trackId);
      console.log(`停止之前播放的轨迹: ${trackId}`);
    });

    // 如果当前活动轨迹正在播放，也需要停止
    if (
      activeTrackId.value &&
      activeTrackId.value !== id &&
      playState.value === "playing"
    ) {
      props.trackObj.stop?.(activeTrackId.value);
      console.log(`停止当前活动轨迹: ${activeTrackId.value}`);
    }

    // 重置播放状态
    playState.value = "stopped";
    stopProgressTimer();

    // 隐藏所有轨迹，确保只显示选中的轨迹
    if (props.trackObj.getAllTracks) {
      const allTracks = props.trackObj.getAllTracks();
      allTracks.forEach((_, trackId) => {
        if (trackId !== id) {
          props.trackObj.hideTrack?.(trackId);
        }
      });
    }

    // 确保选中的轨迹显示
    props.trackObj.showTrack?.(id);

    // 设置新的活动轨迹
    activeTrackId.value = id;

    // 更新进度条上的点位标记
    updateTrackPoints();

    // 强制DOM重新渲染以应用样式
    nextTick(() => {
      // 查找当前选中的轨迹元素并确保其可见
      const activeElement = document.querySelector(`.track-item.active`);
      if (activeElement) {
        // 添加临时强调类，增强视觉反馈
        activeElement.classList.add("track-highlight-flash");
        activeElement.scrollIntoView({ behavior: "smooth", block: "nearest" });

        // 移除临时类
        setTimeout(() => {
          activeElement.classList.remove("track-highlight-flash");
        }, 500);
      }
    });

    // 触发轨迹选择事件
    emit("track-selected", id);
  } catch (error) {
    console.error("选择轨迹时发生错误:", error);
  }
};

// 设置播放速度
const setSpeed = (speed: number) => {
  speedFactor.value = speed;
  onSpeedChange();
};

// 切换播放/暂停
const togglePlay = () => {
  if (!activeTrackId.value || !props.trackObj) return;

  try {
    if (playState.value === "playing") {
      // 暂停播放
      if (props.trackObj.pause && props.trackObj.pause(activeTrackId.value)) {
        playState.value = "paused";
        stopProgressTimer();
      }
    } else {
      // 开始播放
      if (performanceMode.value) {
        // 性能模式下，只应用移动图标设置
        props.trackObj.setEnableSpeedIcon?.(
          activeTrackId.value,
          enableSpeedIcon.value,
        );

        const config = {
          loop: loopPlay.value,
          withCamera: followCamera.value,
          speedFactor: speedFactor.value,
          useAdvancedAnimation: true,
          enableSpeedIcon: enableSpeedIcon.value,
        };

        // 根据播放状态决定是继续播放还是从头播放
        if (playState.value === "paused" && props.trackObj.play) {
          props.trackObj.play(activeTrackId.value, config);
          playState.value = "playing";
        } else if (props.trackObj.play) {
          // 从头开始播放
          props.trackObj.play(activeTrackId.value, config);
          playState.value = "playing";
        }
      } else {
        // 非性能模式，应用所有设置
        // 应用所有节点显示设置
        props.trackObj.setTrackNodesVisible?.(
          activeTrackId.value,
          showNodes.value,
        );
        props.trackObj.setTrackNodeAnchorsVisible?.(
          activeTrackId.value,
          showNodeAnchors.value,
        );
        props.trackObj.setTrackNodePopoversVisible?.(
          activeTrackId.value,
          showNodePopover.value,
        );
        props.trackObj.setTrackNodeTimeVisible?.(
          activeTrackId.value,
          showNodeTime.value,
        );
        props.trackObj.setMovingPointNameVisible?.(
          activeTrackId.value,
          showMovingPointName.value,
        );
        props.trackObj.setTrackSpeedPopoversVisible?.(
          activeTrackId.value,
          showSpeedPopover.value,
        );
        props.trackObj.setTrackNodeSpeedsVisible?.(
          activeTrackId.value,
          showNodeSpeed.value,
        );
        props.trackObj.setTrackNodeDistanceVisible?.(
          activeTrackId.value,
          showNodeDistance.value,
        );
        props.trackObj.setMovingInfoVisible?.(
          activeTrackId.value,
          showMovingInfo.value,
        );
        props.trackObj.setMovingDistanceVisible?.(
          activeTrackId.value,
          showMovingDistance.value,
        );
        props.trackObj.setEnableSpeedIcon?.(
          activeTrackId.value,
          enableSpeedIcon.value,
        );

        const config = {
          loop: loopPlay.value,
          withCamera: followCamera.value,
          speedFactor: speedFactor.value,
          useAdvancedAnimation: false,
          enableSpeedIcon: enableSpeedIcon.value,
        };

        // 根据播放状态决定是继续播放还是从头播放
        if (playState.value === "paused" && props.trackObj.play) {
          props.trackObj.play(activeTrackId.value, config);
          playState.value = "playing";
        } else if (props.trackObj.play) {
          // 从头开始播放
          props.trackObj.play(activeTrackId.value, config);
          playState.value = "playing";
        }
      }

      // 启动进度更新计时器
      startProgressTimer();
    }
  } catch (error) {
    console.error("切换播放状态时发生错误:", error);
  }
};

// 处理进度条点击
const handleProgressClick = (event: MouseEvent) => {
  if (
    !activeTrackId.value ||
    !props.trackObj ||
    !props.trackObj.setTrackProgress
  )
    return;

  // 获取进度条元素
  const progressBar = event.currentTarget as HTMLElement;
  if (!progressBar) return;

  // 计算点击位置相对于进度条的百分比
  const rect = progressBar.getBoundingClientRect();
  const clickX = event.clientX - rect.left;
  const percentage = Math.max(0, Math.min(1, clickX / rect.width));

  // 设置轨迹播放进度
  props.trackObj.setTrackProgress(activeTrackId.value, percentage);

  // 更新界面进度显示
  progressPercentage.value = percentage * 100;

  // 如果轨迹已选择，更新当前时间
  const track = tracks.value.get(activeTrackId.value);
  if (track && track.points && track.points.length >= 2) {
    const startTime = track.points[0].time;
    const endTime = track.points[track.points.length - 1].time;
    currentTime.value = startTime + (endTime - startTime) * percentage;
  }

  // 更新点位标记状态
  updateTrackPoints();
};

// 开始拖动进度条
const startProgressDrag = (event: MouseEvent) => {
  if (!activeTrackId.value) return;

  isDraggingProgress.value = true;

  // 添加鼠标移动和松开事件监听
  const handleMouseMove = (moveEvent: MouseEvent) => {
    if (!isDraggingProgress.value) return;

    // 获取进度条元素
    const progressBar = (event.currentTarget as HTMLElement)
      ?.parentElement as HTMLElement;
    if (!progressBar) return;

    // 计算鼠标位置相对于进度条的百分比
    const rect = progressBar.getBoundingClientRect();
    const moveX = moveEvent.clientX - rect.left;
    const percentage = Math.max(0, Math.min(1, moveX / rect.width));

    // 更新界面显示
    progressPercentage.value = percentage * 100;

    // 更新点位标记状态 - 在拖动过程中实时更新
    updateTrackPoints();
  };

  const handleMouseUp = (upEvent: MouseEvent) => {
    if (!isDraggingProgress.value || !activeTrackId.value) return;

    // 获取进度条元素
    const progressBar = (event.currentTarget as HTMLElement)
      ?.parentElement as HTMLElement;
    if (!progressBar) return;

    // 计算释放位置相对于进度条的百分比
    const rect = progressBar.getBoundingClientRect();
    const upX = upEvent.clientX - rect.left;
    const percentage = Math.max(0, Math.min(1, upX / rect.width));

    // 设置轨迹播放进度
    if (props.trackObj && props.trackObj.setTrackProgress) {
      props.trackObj.setTrackProgress(activeTrackId.value, percentage);
    }

    // 更新界面显示
    progressPercentage.value = percentage * 100;

    // 如果轨迹已选择，更新当前时间
    const track = tracks.value.get(activeTrackId.value);
    if (track && track.points && track.points.length >= 2) {
      const startTime = track.points[0].time;
      const endTime = track.points[track.points.length - 1].time;
      currentTime.value = startTime + (endTime - startTime) * percentage;
    }

    // 更新点位标记状态
    updateTrackPoints();

    // 清理事件监听和状态
    isDraggingProgress.value = false;
    document.removeEventListener("mousemove", handleMouseMove);
    document.removeEventListener("mouseup", handleMouseUp);
  };

  // 添加全局事件监听
  document.addEventListener("mousemove", handleMouseMove);
  document.addEventListener("mouseup", handleMouseUp);
};

// 格式化时间，将秒数转换为mm:ss格式
const formatTime = (seconds: number): string => {
  if (!seconds || isNaN(seconds)) return "00:00";

  const totalSeconds = Math.floor(seconds);
  const minutes = Math.floor(totalSeconds / 60);
  const remainingSeconds = totalSeconds % 60;

  // 格式化为两位数，不足两位前面补零
  const formattedMinutes = String(minutes).padStart(2, "0");
  const formattedSeconds = String(remainingSeconds).padStart(2, "0");

  return `${formattedMinutes}:${formattedSeconds}`;
};

// 开始进度更新计时器
const startProgressTimer = () => {
  // 停止可能存在的计时器
  stopProgressTimer();

  // 创建新的计时器，定期更新进度
  progressTimer = window.setInterval(() => {
    if (!activeTrackId.value || !props.trackObj) return;

    try {
      // 获取当前播放进度
      const progress = props.trackObj.getTrackProgress?.(activeTrackId.value);
      if (progress !== null && progress !== undefined) {
        // 更新进度百分比
        progressPercentage.value = progress * 100;

        // 更新当前时间
        const track = tracks.value.get(activeTrackId.value);
        if (track && track.points && track.points.length >= 2) {
          const startTime = track.points[0].time;
          const endTime = track.points[track.points.length - 1].time;
          currentTime.value = startTime + (endTime - startTime) * progress;
        }

        // 获取当前速度
        if (props.trackObj.getCurrentSpeed) {
          const speed = props.trackObj.getCurrentSpeed(activeTrackId.value);
          if (speed !== null) {
            currentSpeed.value = speed;
          }
        }

        // 更新点位标记状态
        updateTrackPoints();

        // 如果进度达到100%且未设置循环播放，则停止播放
        if (progress >= 0.999 && !loopPlay.value) {
          stopProgressTimer();
          playState.value = "stopped";
        }
      }
    } catch (error) {
      console.error("更新进度时发生错误:", error);
    }
  }, updateFrequency.value);
};

// 加载示例轨迹数据
const loadDemoTracks = () => {
  if (!props.trackObj || !props.trackObj.addTrack) {
    console.error("TrackObj或addTrack方法不可用，无法加载示例数据");
    return;
  }
  // 创建当前配置对象，确保与UI设置一致
  const currentConfig = {
    showNodes: showNodes.value,
    showNodePopovers: showNodePopover.value,
    showNodeTime: showNodeTime.value,
    showSpeedPopovers: showSpeedPopover.value,
    showNodeSpeeds: showNodeSpeed.value,
    showNodeDistance: showNodeDistance.value,
    showMovingPointName: showMovingPointName.value,
    enableSpeedIcon: enableSpeedIcon.value,
  };

  // 创建一个示例轨迹（北京路线示例）
  const createDemoTrack = (id: number) => {
    const now = Math.floor(Date.now() / 1000);
    const points = [];
    const center = {
      lat: 39.9 + Math.random() * 0.1,
      lng: 116.3 + Math.random() * 0.1,
    };
    const pointCount = 12 + Math.floor(Math.random() * 50);

    // 生成轨迹点
    for (let i = 0; i < pointCount; i++) {
      const time = now + i * 60; // 每分钟一个点
      const angle = (i / pointCount) * Math.PI * 2;
      const radius = 0.01 + Math.random() * 0.01;

      const point: any = {
        lat: center.lat + Math.sin(angle) * radius,
        lng: center.lng + Math.cos(angle) * radius,
        time: time,
        title: `点位${i + 1}`,
        speed: 30 + Math.random() * 30, // 30-60 km/h
      };

      // 添加一些静态点
      if (i % 10 === 0 && i > 0) {
        point.staticTitle = `站点${Math.floor(i / 10)}`;
      }

      points.push(point);
    }

    return {
      id: `demo-track-${id}`,
      name: `示例轨迹 ${id}`,
      points: points,
      color: `#${Math.floor(Math.random() * 16777215)
        .toString(16)
        .padStart(6, "0")}`,
      icon: "🚗",
    };
  };

  // 添加3条示例轨迹
  for (let i = 1; i <= 3; i++) {
    const demoTrack = createDemoTrack(i);
    try {
      props.trackObj.addTrack(
        demoTrack as unknown as Track,
        currentConfig as any,
      );
      console.log(`示例轨迹${i}已添加`);
    } catch (error) {
      console.error(`添加示例轨迹${i}时出错:`, error);
    }
  }

  // 刷新轨迹列表
  refreshTrackList();
};

defineExpose({ refreshTrackList });

// 监听性能模式变化
watch(performanceMode, (newValue) => {
  if (activeTrackId.value) {
    if (newValue) {
      // 开启性能模式，保存当前配置
      originalConfig.value = {
        showNodes: showNodes.value,
        showNodeAnchors: showNodeAnchors.value,
        showNodePopover: showNodePopover.value,
        showNodeTime: showNodeTime.value,
        showSpeedPopover: showSpeedPopover.value,
        showNodeSpeed: showNodeSpeed.value,
        showNodeDistance: showNodeDistance.value,
        showMovingPointName: showMovingPointName.value,
        showMovingInfo: showMovingInfo.value,
        showMovingDistance: showMovingDistance.value,
        enableSpeedIcon: enableSpeedIcon.value,
      };

      // 关闭除了移动图标外的所有配置
      showNodes.value = false;
      showNodeAnchors.value = false;
      showNodePopover.value = false;
      showNodeTime.value = false;
      showSpeedPopover.value = false;
      showNodeSpeed.value = false;
      showNodeDistance.value = false;
      showMovingPointName.value = false;
      showMovingInfo.value = false;
      showMovingDistance.value = false;
      // 保留移动图标设置不变

      // 无论是否正在播放，都停止当前轨迹
      if (props.trackObj && props.trackObj.stop) {
        props.trackObj.stop(activeTrackId.value);
        playState.value = "stopped";
        stopProgressTimer();
      }

      // 应用所有设置
      applyAllPerformanceSettings();

      console.log("性能模式已启用，已禁用除移动图标外的所有设置，播放已停止");
    } else {
      // 关闭性能模式，恢复原始配置
      showNodes.value = originalConfig.value.showNodes;
      showNodeAnchors.value = originalConfig.value.showNodeAnchors;
      showNodePopover.value = originalConfig.value.showNodePopover;
      showNodeTime.value = originalConfig.value.showNodeTime;
      showSpeedPopover.value = originalConfig.value.showSpeedPopover;
      showNodeSpeed.value = originalConfig.value.showNodeSpeed;
      showNodeDistance.value = originalConfig.value.showNodeDistance;
      showMovingPointName.value = originalConfig.value.showMovingPointName;
      showMovingInfo.value = originalConfig.value.showMovingInfo;
      showMovingDistance.value = originalConfig.value.showMovingDistance;
      enableSpeedIcon.value = originalConfig.value.enableSpeedIcon;

      // 无论是否正在播放，都停止当前轨迹
      if (props.trackObj && props.trackObj.stop) {
        props.trackObj.stop(activeTrackId.value);
        playState.value = "stopped";
        stopProgressTimer();
      }

      // 应用所有设置
      applyAllSettings(activeTrackId.value);

      console.log("性能模式已禁用，已恢复原始设置，播放已停止");
    }
  }
});

// 添加监听器，当设置变更时实时应用
watch(showMovingPointName, (newValue) => {
  if (
    activeTrackId.value &&
    props.trackObj &&
    props.trackObj.setMovingPointNameVisible &&
    !performanceMode.value
  ) {
    props.trackObj.setMovingPointNameVisible(activeTrackId.value, newValue);
    console.log(`点位名称显示已${newValue ? "启用" : "禁用"}`);
  }
});

watch(showSpeedPopover, (newValue) => {
  if (
    activeTrackId.value &&
    props.trackObj &&
    props.trackObj.setTrackSpeedPopoversVisible &&
    !performanceMode.value
  ) {
    props.trackObj.setTrackSpeedPopoversVisible(activeTrackId.value, newValue);
    console.log(`移动速度显示已${newValue ? "启用" : "禁用"}`);
  }
});

watch(showNodeSpeed, (newValue) => {
  if (
    activeTrackId.value &&
    props.trackObj &&
    props.trackObj.setTrackNodeSpeedsVisible &&
    !performanceMode.value
  ) {
    props.trackObj.setTrackNodeSpeedsVisible(activeTrackId.value, newValue);
    console.log(`节点速度显示已${newValue ? "启用" : "禁用"}`);
  }
});

watch(showNodeTime, (newValue) => {
  if (
    activeTrackId.value &&
    props.trackObj &&
    props.trackObj.setTrackNodeTimeVisible &&
    !performanceMode.value
  ) {
    props.trackObj.setTrackNodeTimeVisible(activeTrackId.value, newValue);
    console.log(`节点时间显示已${newValue ? "启用" : "禁用"}`);
  }
});

// 速度图标切换
watch(enableSpeedIcon, (newValue) => {
  if (
    activeTrackId.value &&
    props.trackObj &&
    props.trackObj.setEnableSpeedIcon
  ) {
    // 调用设置方法
    props.trackObj.setEnableSpeedIcon(activeTrackId.value, newValue);

    // 强制刷新轨迹显示
    if (props.trackObj.refreshTrack) {
      props.trackObj.refreshTrack(activeTrackId.value);
    }

    console.log(`速度图标切换已${newValue ? "启用" : "禁用"} (实时应用)`);
  }
});

// 添加CSS动画
const styleElement = document.createElement("style");
styleElement.textContent = `
  @keyframes fadeOut {
    0% { opacity: 1; }
    70% { opacity: 1; }
    100% { opacity: 0; }
  }
`;
document.head.appendChild(styleElement);

// 为所有设置添加实时监听，确保在任何播放状态下都能立即生效
// 跟随移动设置
watch(followCamera, (newValue) => {
  if (activeTrackId.value && props.trackObj) {
    // 立即更新播放器配置
    const config = {
      withCamera: newValue,
    };

    // 无论播放状态如何，都立即应用设置
    props.trackObj.updateTrackPlayer?.(activeTrackId.value, config);

    // 如果取消跟随，且轨迹正在播放，需要特殊处理解除相机锁定
    if (
      !newValue &&
      playState.value === "playing" &&
      props.trackObj.releaseCameraLock
    ) {
      props.trackObj.releaseCameraLock(activeTrackId.value);
    }

    // 强制刷新轨迹显示
    if (props.trackObj.refreshTrack) {
      props.trackObj.refreshTrack(activeTrackId.value);
    }

    console.log(`跟随移动已${newValue ? "启用" : "禁用"} (实时应用)`);
  }
});

// 节点名称显示
watch(showNodePopover, (newValue) => {
  if (
    activeTrackId.value &&
    props.trackObj &&
    props.trackObj.setTrackNodePopoversVisible
  ) {
    props.trackObj.setTrackNodePopoversVisible(activeTrackId.value, newValue);
    // 强制刷新轨迹显示
    props.trackObj.refreshTrack?.(activeTrackId.value);
    console.log(`节点名称显示已${newValue ? "启用" : "禁用"} (实时应用)`);
  }
});

// 节点时间显示
watch(showNodeTime, (newValue) => {
  if (
    activeTrackId.value &&
    props.trackObj &&
    props.trackObj.setTrackNodeTimeVisible
  ) {
    props.trackObj.setTrackNodeTimeVisible(activeTrackId.value, newValue);
    // 强制刷新轨迹显示
    props.trackObj.refreshTrack?.(activeTrackId.value);
    console.log(`节点时间显示已${newValue ? "启用" : "禁用"} (实时应用)`);
  }
});

// 节点速度显示
watch(showNodeSpeed, (newValue) => {
  if (
    activeTrackId.value &&
    props.trackObj &&
    props.trackObj.setTrackNodeSpeedsVisible
  ) {
    props.trackObj.setTrackNodeSpeedsVisible(activeTrackId.value, newValue);
    // 强制刷新轨迹显示
    props.trackObj.refreshTrack?.(activeTrackId.value);
    console.log(`节点速度显示已${newValue ? "启用" : "禁用"} (实时应用)`);
  }
});

// 节点距离显示
watch(showNodeDistance, (newValue) => {
  if (
    activeTrackId.value &&
    props.trackObj &&
    props.trackObj.setTrackNodeDistanceVisible &&
    !performanceMode.value
  ) {
    props.trackObj.setTrackNodeDistanceVisible(activeTrackId.value, newValue);
    // 强制刷新轨迹显示
    props.trackObj.refreshTrack?.(activeTrackId.value);
    console.log(`节点距离显示已${newValue ? "启用" : "禁用"} (实时应用)`);
  }
});

// 应用所有设置到轨迹对象
const applyAllSettings = (trackId: string) => {
  if (!props.trackObj) return;

  // 应用节点显示设置
  props.trackObj.setTrackNodesVisible?.(trackId, showNodes.value);
  props.trackObj.setTrackNodeAnchorsVisible?.(trackId, showNodeAnchors.value);
  props.trackObj.setTrackNodePopoversVisible?.(trackId, showNodePopover.value);
  props.trackObj.setTrackNodeTimeVisible?.(trackId, showNodeTime.value);
  props.trackObj.setMovingPointNameVisible?.(
    trackId,
    showMovingPointName.value,
  );
  props.trackObj.setTrackSpeedPopoversVisible?.(
    trackId,
    showSpeedPopover.value,
  );
  props.trackObj.setTrackNodeSpeedsVisible?.(trackId, showNodeSpeed.value);
  props.trackObj.setTrackNodeDistanceVisible?.(trackId, showNodeDistance.value);
  props.trackObj.setEnableSpeedIcon?.(trackId, enableSpeedIcon.value);

  // 设置播放器配置
  const playerConfig = {
    loop: loopPlay.value,
    withCamera: followCamera.value,
    speedFactor: speedFactor.value,
    useAdvancedAnimation: performanceMode.value,
    enableSpeedIcon: enableSpeedIcon.value,
  };

  // 设置播放器配置
  props.trackObj.setTrackPlayer?.(trackId, playerConfig);

  // 强制刷新轨迹显示
  props.trackObj.refreshTrack?.(trackId);

  console.log("已应用所有设置到轨迹:", trackId);
};

// 添加处理特定设置变更的事件处理器
const onNodeSpeedChange = () => {
  if (activeTrackId.value && props.trackObj && !performanceMode.value) {
    props.trackObj.setTrackNodeSpeedsVisible?.(
      activeTrackId.value,
      showNodeSpeed.value,
    );
    props.trackObj.refreshTrack?.(activeTrackId.value);
  }
};

const onNodeDistanceChange = () => {
  if (activeTrackId.value && props.trackObj && !performanceMode.value) {
    props.trackObj.setTrackNodeDistanceVisible?.(
      activeTrackId.value,
      showNodeDistance.value,
    );
    props.trackObj.refreshTrack?.(activeTrackId.value);
  }
};

// 添加事件处理方法
const onSpeedIconChange = () => {
  if (
    activeTrackId.value &&
    props.trackObj &&
    props.trackObj.setEnableSpeedIcon
  ) {
    // 调用设置方法
    props.trackObj.setEnableSpeedIcon(
      activeTrackId.value,
      enableSpeedIcon.value,
    );

    // 强制刷新轨迹显示
    if (props.trackObj.refreshTrack) {
      props.trackObj.refreshTrack(activeTrackId.value);
    }

    console.log(
      `速度图标切换已${enableSpeedIcon.value ? "启用" : "禁用"} (实时应用)`,
    );
  }
};

const onFollowCameraChange = () => {
  if (activeTrackId.value && props.trackObj) {
    // 立即更新播放器配置
    props.trackObj.updateTrackPlayer?.(activeTrackId.value, {
      withCamera: followCamera.value,
    });

    // 如果取消跟随，且轨迹正在播放，解除相机锁定
    if (
      !followCamera.value &&
      playState.value === "playing" &&
      props.trackObj.releaseCameraLock
    ) {
      props.trackObj.releaseCameraLock(activeTrackId.value);
    }

    // 强制刷新轨迹显示
    if (props.trackObj.refreshTrack) {
      props.trackObj.refreshTrack(activeTrackId.value);
    }

    console.log(`跟随移动已${followCamera.value ? "启用" : "禁用"} (实时应用)`);
  }
};

// 添加新的watch监听器
watch(showMovingInfo, (newValue) => {
  if (
    activeTrackId.value &&
    props.trackObj &&
    props.trackObj.setMovingInfoVisible
  ) {
    props.trackObj.setMovingInfoVisible(activeTrackId.value, newValue);
    // 强制刷新轨迹显示
    props.trackObj.refreshTrack?.(activeTrackId.value);
    console.log(`移动信息显示已${newValue ? "启用" : "禁用"} (实时应用)`);
  }
});

watch(showMovingDistance, (newValue) => {
  if (
    activeTrackId.value &&
    props.trackObj &&
    props.trackObj.setMovingDistanceVisible
  ) {
    props.trackObj.setMovingDistanceVisible(activeTrackId.value, newValue);
    // 强制刷新轨迹显示
    props.trackObj.refreshTrack?.(activeTrackId.value);
    console.log(`移动距离显示已${newValue ? "启用" : "禁用"} (实时应用)`);
  }
});

// 更新进度条上的点位标记
const updateTrackPoints = () => {
  if (!activeTrackId.value) {
    trackPoints.value = [];
    return;
  }

  const track = tracks.value.get(activeTrackId.value);
  if (!track || !track.points || track.points.length < 2) {
    trackPoints.value = [];
    return;
  }

  const currentProgress =
    props.trackObj.getTrackProgress?.(activeTrackId.value) || 0;
  const currentIndex = Math.floor(currentProgress * (track.points.length - 1));

  // 创建点位标记数据
  const points = [];
  for (let i = 0; i < track.points.length; i++) {
    const point = track.points[i];
    const position = (i / (track.points.length - 1)) * 100;
    const isStatic = !!point.staticTitle || !!point.title;
    const isPassed = i <= currentIndex;
    const isCurrent = i === currentIndex;

    // 只显示有标题的点位或每隔一定数量的点位
    // 对于大量点位的轨迹，可以通过这种方式减少标记数量
    const showEveryN = Math.max(1, Math.floor(track.points.length / 50)); // 最多显示50个点

    if (
      isStatic ||
      i % showEveryN === 0 ||
      i === 0 ||
      i === track.points.length - 1 ||
      isCurrent
    ) {
      points.push({
        index: i,
        position,
        title: point.staticTitle || point.title || `点位 ${i + 1}`,
        isStatic,
        isPassed,
        isCurrent,
      });
    }
  }

  trackPoints.value = points;
};

// 跳转到指定点位
const jumpToPoint = (pointIndex: number) => {
  if (
    !activeTrackId.value ||
    !props.trackObj ||
    !props.trackObj.setTrackProgress
  )
    return;

  const track = tracks.value.get(activeTrackId.value);
  if (!track || !track.points || track.points.length < 2) return;

  // 计算点位对应的进度值
  const totalPoints = track.points.length - 1; // 减1是因为进度是从0到1
  const progress = pointIndex / totalPoints;

  // 设置轨迹播放进度
  props.trackObj.setTrackProgress(activeTrackId.value, progress);

  // 更新界面进度显示
  progressPercentage.value = progress * 100;

  // 更新当前时间
  const startTime = track.points[0].time;
  const endTime = track.points[track.points.length - 1].time;
  currentTime.value = startTime + (endTime - startTime) * progress;

  // 更新点位标记状态
  updateTrackPoints();

  console.log(`跳转到点位: ${pointIndex}, 进度: ${progress.toFixed(2)}`);
};

// 应用性能模式的所有设置到轨迹对象
const applyAllPerformanceSettings = () => {
  if (!activeTrackId.value || !props.trackObj) return;

  // 应用节点显示设置
  props.trackObj.setTrackNodesVisible?.(activeTrackId.value, false);
  props.trackObj.setTrackNodeAnchorsVisible?.(activeTrackId.value, false);
  props.trackObj.setTrackNodePopoversVisible?.(activeTrackId.value, false);
  props.trackObj.setTrackNodeTimeVisible?.(activeTrackId.value, false);
  props.trackObj.setMovingPointNameVisible?.(activeTrackId.value, false);
  props.trackObj.setTrackSpeedPopoversVisible?.(activeTrackId.value, false);
  props.trackObj.setTrackNodeSpeedsVisible?.(activeTrackId.value, false);
  props.trackObj.setTrackNodeDistanceVisible?.(activeTrackId.value, false);
  props.trackObj.setMovingInfoVisible?.(activeTrackId.value, false);
  props.trackObj.setMovingDistanceVisible?.(activeTrackId.value, false);

  // 保留移动图标设置
  props.trackObj.setEnableSpeedIcon?.(
    activeTrackId.value,
    enableSpeedIcon.value,
  );

  // 设置播放器配置
  const playerConfig = {
    loop: loopPlay.value,
    withCamera: followCamera.value,
    speedFactor: speedFactor.value,
    useAdvancedAnimation: true, // 性能模式开启
    enableSpeedIcon: enableSpeedIcon.value,
  };

  // 设置播放器配置
  props.trackObj.setTrackPlayer?.(activeTrackId.value, playerConfig);

  // 强制刷新轨迹显示
  props.trackObj.refreshTrack?.(activeTrackId.value);
};
</script>

<style scoped>
.track-player {
  position: absolute;
  top: 20px;
  right: 20px;
  background-color: var(--el-bg-color-overlay);
  border-radius: var(--el-border-radius-base);
  box-shadow: var(--el-box-shadow-light);
  overflow: hidden;
  z-index: 1000;
  max-height: 60vh;
  display: flex;
  flex-direction: column;
  border: 1px solid var(--el-border-color-light);
}

/* 设置组样式 */
.settings-group {
  margin-bottom: 16px;
  border-bottom: 1px solid var(--el-border-color-lighter);
  padding-bottom: 12px;
}

.settings-group:last-child {
  border-bottom: none;
  margin-bottom: 0;
  padding-bottom: 0;
}

.settings-group-title {
  font-weight: bold;
  margin-bottom: 8px;
  color: var(--el-text-color-primary);
  font-size: var(--el-font-size-base);
}

.settings-options {
  display: flex;
  flex-wrap: wrap;
}

.settings-option {
  display: flex;
  align-items: center;
  margin-right: 16px;
  margin-bottom: 8px;
  font-size: var(--el-font-size-small);
  cursor: pointer;
  user-select: none;
  color: var(--el-text-color-regular);
}

/* 更新频率选项样式 */
.settings-option input[type="radio"] {
  margin-right: 5px;
  accent-color: var(--el-color-primary);
}

.settings-option input[type="radio"]:checked + span {
  font-weight: bold;
  color: var(--el-color-primary);
}

/* 其他样式保持不变 */
.track-player-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 15px;
  background: var(--el-color-primary);
  color: var(--el-color-white);
  border-bottom: 1px solid var(--el-border-color-light);
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
  color: var(--el-color-white);
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
  transition:
    background-color 0.2s,
    transform 0.2s;
}

.track-player-setting-btn:hover {
  background: rgba(255, 255, 255, 0.3);
  transform: scale(1.05);
}

.setting-icon {
  font-size: 16px;
  color: var(--el-color-white);
  line-height: 1;
  display: flex;
  align-items: center;
  justify-content: center;
}

/* 示例数据按钮样式 */
.track-player-demo-btn {
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
  transition:
    background-color 0.2s,
    transform 0.2s;
}

.track-player-demo-btn:hover {
  background: rgba(255, 255, 255, 0.3);
  transform: scale(1.05);
}

.demo-icon {
  font-size: 16px;
  color: var(--el-color-white);
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
  transition:
    background-color 0.2s,
    transform 0.2s;
}

.track-player-collapse-btn:hover {
  background: rgba(255, 255, 255, 0.3);
  transform: scale(1.05);
}

.collapse-icon {
  font-size: 16px;
  color: var(--el-color-white);
  line-height: 1;
  display: flex;
  align-items: center;
  justify-content: center;
}

.track-player-content {
  padding: 18px;
  background-color: var(--el-bg-color-overlay);
}

.track-list {
  margin-bottom: 18px;
}

.track-list-header {
  font-size: var(--el-font-size-base);
  font-weight: 600;
  margin-bottom: 10px;
  color: var(--el-text-color-primary);
  display: flex;
  align-items: center;
}

.track-list-header::before {
  content: "";
  display: inline-block;
  width: 4px;
  height: 16px;
  background: var(--el-color-primary);
  margin-right: 8px;
  border-radius: 2px;
}

.track-list-content {
  max-height: 200px;
  overflow-y: auto;
  border: 1px solid var(--el-border-color-lighter);
  border-radius: var(--el-border-radius-base);
  box-shadow: inset 0 1px 3px rgba(0, 0, 0, 0.05);
  background-color: var(--el-fill-color-blank);
}

.track-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 14px;
  border-bottom: 1px solid var(--el-border-color-lighter);
  cursor: pointer;
  transition: all 0.3s ease;
  position: relative;
  border-left: 3px solid transparent;
  background-color: var(--el-bg-color-overlay);
}

.track-item:last-child {
  border-bottom: none;
}

.track-item:hover {
  background: var(--el-fill-color-light);
}

.track-item.active {
  background-color: var(--el-color-primary-light-9);
  border-left: 3px solid var(--el-color-primary);
  padding-left: 11px; /* 补偿左边框的宽度 */
  border-radius: 4px;
  box-shadow: 0 0 5px
    color-mix(in srgb, var(--el-color-primary), transparent 70%);
  position: relative;
  animation: highlight-active 0.3s ease;
}

/* 临时强调闪光效果 */
.track-highlight-flash {
  animation: flash-highlight 0.5s ease !important;
}

@keyframes flash-highlight {
  0% {
    background-color: color-mix(
      in srgb,
      var(--el-color-primary),
      transparent 50%
    );
    box-shadow: 0 0 10px
      color-mix(in srgb, var(--el-color-primary), transparent 20%);
  }
  50% {
    background-color: color-mix(
      in srgb,
      var(--el-color-primary),
      transparent 20%
    );
    box-shadow: 0 0 15px var(--el-color-primary);
  }
  100% {
    background-color: var(--el-color-primary-light-9);
    box-shadow: 0 0 5px
      color-mix(in srgb, var(--el-color-primary), transparent 70%);
  }
}

@keyframes highlight-active {
  0% {
    background-color: color-mix(
      in srgb,
      var(--el-color-primary),
      transparent 90%
    );
  }
  50% {
    background-color: color-mix(
      in srgb,
      var(--el-color-primary),
      transparent 80%
    );
  }
  100% {
    background-color: var(--el-color-primary-light-9);
  }
}

.track-item.active::after {
  content: "";
  position: absolute;
  top: 0;
  right: 0;
  bottom: 0;
  left: 0;
  border-radius: 4px;
  pointer-events: none;
  box-shadow: inset 0 0 0 1px
    color-mix(in srgb, var(--el-color-primary), transparent 70%);
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
  font-size: var(--el-font-size-base);
  font-weight: 500;
  margin-bottom: 4px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  color: var(--el-text-color-primary);
}

.track-item-detail {
  font-size: var(--el-font-size-small);
  color: var(--el-text-color-secondary);
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
  color: var(--el-text-color-secondary);
  border-radius: 4px;
  font-size: 14px;
  line-height: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
}

.track-item-delete-btn:hover {
  color: var(--el-color-danger);
  background-color: var(--el-color-danger-light-9);
  transform: scale(1.1);
}

.track-item-delete-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  color: var(--el-text-color-disabled);
  background-color: transparent;
  transform: none;
}

.track-item-delete-btn:disabled:hover {
  color: var(--el-text-color-disabled);
  background-color: transparent;
  transform: none;
}

.track-list-empty {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100px;
  color: var(--el-text-color-secondary);
  font-size: var(--el-font-size-small);
  background-color: var(--el-fill-color-light);
  border-radius: 8px;
}

.track-controls {
  display: flex;
  flex-direction: column;
  gap: 15px;
  background-color: var(--el-fill-color-lighter);
  border-radius: 10px;
  padding: 15px;
  box-shadow: inset 0 1px 3px rgba(0, 0, 0, 0.05);
}

.track-options {
  display: flex;
  gap: 18px;
  margin-bottom: 5px;
  background-color: var(--el-bg-color-overlay);
  padding: 12px;
  border-radius: 8px;
  border: 1px solid var(--el-border-color-lighter);
}

.track-option {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: var(--el-font-size-small);
  color: var(--el-text-color-regular);
  cursor: pointer;
  user-select: none;
}

.track-option input[type="checkbox"] {
  appearance: none;
  -webkit-appearance: none;
  width: 16px;
  height: 16px;
  border: 2px solid var(--el-color-primary);
  border-radius: 3px;
  outline: none;
  cursor: pointer;
  position: relative;
  transition: all 0.2s;
}

.track-option input[type="checkbox"]:checked {
  background-color: var(--el-color-primary);
}

.track-option input[type="checkbox"]:checked:after {
  content: "";
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
  background: var(--el-bg-color-overlay);
  border: 1px solid var(--el-border-color);
  border-radius: 50%;
  width: 44px;
  height: 44px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  color: var(--el-text-color-primary);
  transition: all 0.2s cubic-bezier(0.175, 0.885, 0.32, 1.275);
  box-shadow: var(--el-box-shadow-light);
}

.track-button:hover:not(:disabled) {
  color: var(--el-color-primary);
  border-color: var(--el-color-primary);
  transform: scale(1.05);
  box-shadow: var(--el-box-shadow);
}

.track-button:disabled {
  color: var(--el-text-color-disabled);
  cursor: not-allowed;
  opacity: 0.7;
  box-shadow: none;
}

.track-play {
  background-color: var(--el-color-primary-light-9);
  width: 54px;
  height: 54px;
}

.track-play:hover:not(:disabled) {
  background-color: var(--el-color-primary-light-8);
}

.track-progress {
  margin-top: 10px;
}

.track-progress-bar {
  height: 6px;
  background-color: var(--el-fill-color);
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
  background: var(--el-color-primary);
  border-radius: 3px;
  transition: width 0.1s linear;
}

.track-progress-handle {
  position: absolute;
  top: 50%;
  transform: translate(-50%, -50%);
  width: 12px;
  height: 12px;
  background-color: var(--el-color-white);
  border: 2px solid var(--el-color-primary);
  border-radius: 50%;
  cursor: pointer;
  transition:
    transform 0.1s,
    box-shadow 0.1s;
  z-index: 10;
}

.track-progress-handle:hover,
.track-progress-handle.active {
  transform: translate(-50%, -50%) scale(1.2);
  box-shadow: 0 0 0 5px
    color-mix(in srgb, var(--el-color-primary), transparent 80%);
}

.track-progress-time {
  font-size: var(--el-font-size-small);
  color: var(--el-text-color-primary);
  text-align: center;
}

.collapsed-icon {
  position: absolute;
  top: 0px;
  left: 0;
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--el-color-white);
  font-size: 20px;
  font-weight: bold;
}

.playing-indicator {
  animation: pulse 1.5s infinite;
  transform-origin: center;
}

@keyframes pulse {
  0% {
    transform: scale(1);
    opacity: 1;
  }
  50% {
    transform: scale(1.2);
    opacity: 0.8;
  }
  100% {
    transform: scale(1);
    opacity: 1;
  }
}

.track-speed-control {
  display: flex;
  flex-direction: column;
  align-items: center;
  margin: 10px 0;
  background-color: var(--el-bg-color-overlay);
  padding: 12px;
  border-radius: 8px;
  border: 1px solid var(--el-border-color-lighter);
}

.speed-label {
  font-size: var(--el-font-size-base);
  font-weight: 600;
  color: var(--el-text-color-primary);
  margin-bottom: 5px;
}

.speed-slider {
  width: 100%;
  height: 5px;
  -webkit-appearance: none;
  appearance: none;
  background: var(--el-border-color-light);
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
  background: var(--el-color-primary);
  cursor: pointer;
  transition: all 0.2s;
}

.speed-slider::-webkit-slider-thumb:hover {
  background: var(--el-color-primary-light-3);
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
  font-size: var(--el-font-size-small);
  color: var(--el-text-color-primary);
  margin-top: 5px;
}

/* 当前速度显示样式 */
.track-current-speed {
  font-size: var(--el-font-size-small);
  color: var(--el-color-primary);
  font-weight: 600;
  text-align: center;
  margin-top: 5px;
  padding: 3px 8px;
  background-color: var(--el-color-primary-light-9);
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
  background-color: var(--el-overlay-color-lighter);
}

.track-settings-content {
  width: 280px;
  background-color: var(--el-bg-color-overlay);
  border-radius: 10px;
  box-shadow: var(--el-box-shadow-dark);
  overflow: hidden;
  border: 1px solid var(--el-border-color-lighter);
}

.track-settings-header {
  padding: 12px 15px;
  background: var(--el-color-primary);
  color: var(--el-color-white);
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
  border-top: 1px solid var(--el-border-color-lighter);
  text-align: right;
}

.settings-apply-btn {
  background-color: var(--el-color-primary);
  color: var(--el-color-white);
  border: none;
  padding: 6px 16px;
  border-radius: 4px;
  cursor: pointer;
  font-size: var(--el-font-size-small);
  transition: background-color 0.2s;
}

.settings-apply-btn:hover {
  background-color: var(--el-color-primary-light-3);
}

.settings-group {
  margin-bottom: 20px;
}

.settings-group:last-child {
  margin-bottom: 0;
}

.settings-group-title {
  font-size: var(--el-font-size-base);
  font-weight: 600;
  margin-bottom: 10px;
  color: var(--el-text-color-primary);
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
  background: var(--el-color-primary);
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
  font-size: var(--el-font-size-small);
  color: var(--el-text-color-regular);
  cursor: pointer;
  user-select: none;
}

.settings-option input[type="checkbox"] {
  appearance: none;
  -webkit-appearance: none;
  width: 16px;
  height: 16px;
  border: 2px solid var(--el-color-primary);
  border-radius: 3px;
  outline: none;
  cursor: pointer;
  position: relative;
  transition: all 0.2s;
}

.settings-option input[type="checkbox"]:checked {
  background-color: var(--el-color-primary);
}

.settings-option input[type="checkbox"]:checked:after {
  content: "";
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

@keyframes pulse-border {
  0% {
    box-shadow: 0 0 0 0
      color-mix(in srgb, var(--el-color-primary), transparent 30%);
  }
  70% {
    box-shadow: 0 0 0 6px
      color-mix(in srgb, var(--el-color-primary), transparent 100%);
  }
  100% {
    box-shadow: 0 0 0 0
      color-mix(in srgb, var(--el-color-primary), transparent 100%);
  }
}

.track-camera.active {
  background-color: var(--el-color-primary-light-9);
  border-left: 3px solid var(--el-color-primary);
}

.track-camera path {
  color: #000 !important;
}

/* 双击高亮效果 - 持续时间更长 */
.track-highlight-double-click {
  animation: double-click-highlight 3s ease !important;
  border-left: 3px solid var(--el-color-warning) !important;
  box-shadow: 0 0 8px
    color-mix(in srgb, var(--el-color-warning), transparent 40%) !important;
}

@keyframes double-click-highlight {
  0% {
    background-color: color-mix(
      in srgb,
      var(--el-color-warning),
      transparent 70%
    );
    box-shadow: 0 0 10px
      color-mix(in srgb, var(--el-color-warning), transparent 40%);
  }
  10% {
    background-color: color-mix(
      in srgb,
      var(--el-color-warning),
      transparent 50%
    );
    box-shadow: 0 0 15px
      color-mix(in srgb, var(--el-color-warning), transparent 20%);
  }
  30% {
    background-color: color-mix(
      in srgb,
      var(--el-color-warning),
      transparent 70%
    );
    box-shadow: 0 0 10px
      color-mix(in srgb, var(--el-color-warning), transparent 40%);
  }
  100% {
    background-color: var(--el-color-primary-light-9);
    box-shadow: 0 0 5px
      color-mix(in srgb, var(--el-color-primary), transparent 70%);
  }
}

/* 添加性能模式样式 */
.performance-mode {
  position: relative;
}

.tooltip {
  visibility: hidden;
  width: 200px;
  background-color: var(--el-overlay-color-dark);
  color: var(--el-color-white);
  text-align: center;
  border-radius: 6px;
  padding: 8px;
  position: absolute;
  z-index: 1;
  bottom: 125%;
  left: 50%;
  margin-left: -100px;
  opacity: 0;
  transition: opacity 0.3s;
  font-size: var(--el-font-size-small);
  pointer-events: none;
}

.performance-mode:hover .tooltip {
  visibility: visible;
  opacity: 1;
}

/* 点位标记样式 */
.track-progress-points {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
}

.track-point-marker {
  position: absolute;
  top: 50%;
  transform: translate(-50%, -50%);
  width: 6px;
  height: 6px;
  background-color: var(--el-border-color);
  border-radius: 50%;
  pointer-events: auto;
  cursor: pointer;
  z-index: 5;
  transition: all 0.2s ease;
}

.track-point-marker:hover {
  transform: translate(-50%, -50%) scale(1.5);
  box-shadow: 0 0 0 3px rgba(0, 0, 0, 0.1);
}

.track-point-marker.static-point {
  background-color: var(--el-color-warning);
  width: 8px;
  height: 8px;
}

.track-point-marker.passed-point {
  background-color: var(--el-color-success);
}

.track-point-marker.current-point {
  background-color: var(--el-color-warning);
  width: 10px;
  height: 10px;
  box-shadow: 0 0 0 3px
    color-mix(in srgb, var(--el-color-warning), transparent 70%);
  z-index: 6;
}
</style>
