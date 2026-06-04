<template>
  <div class="conference-room">
    <!-- 加载/连接中 -->
    <div v-if="!room" class="conference-loading">
      <div class="loading-spinner"></div>
      <p class="loading-text">{{ loadingMessage }}</p>
    </div>

    <!-- 会议室 -->
    <div v-else class="conference-active">
      <!-- 视频网格 -->
      <div class="video-grid" :class="{ 'single': visibleTiles.length <= 1 }">
        <div
          v-for="tile in visibleTiles"
          :key="tile.identity"
          class="video-tile"
          :class="{ 'screen-share': tile.isScreenShare, 'local': tile.isLocal, 'no-video': !tile.hasVideo }"
        >
          <!-- 视频元素 -->
          <video
            :ref="(el) => setVideoRef(tile.identity, el as HTMLVideoElement | null)"
            :data-identity="tile.identity"
            autoplay
            playsinline
            :muted="tile.isLocal"
            class="tile-video"
          />
          <!-- 无视频占位 -->
          <div v-if="!tile.hasVideo" class="tile-placeholder">
            <div class="avatar">{{ tile.displayName.charAt(0).toUpperCase() }}</div>
          </div>
          <!-- 标签 -->
          <div class="tile-overlay">
            <span class="tile-name">{{ tile.displayName }}</span>
            <el-tag v-if="tile.isHost" size="small" type="warning" effect="dark" class="tile-badge">主持人</el-tag>
            <el-tag v-if="tile.isScreenShare" size="small" type="info" effect="dark" class="tile-badge">共享</el-tag>
          </div>
        </div>
      </div>

      <!-- 控制栏 -->
      <div class="controls-bar">
        <div class="controls-left">
          <span class="room-name">{{ roomName }}</span>
        </div>
        <div class="controls-center">
          <el-tooltip :content="micEnabled ? '关闭麦克风' : '开启麦克风'" placement="top">
            <button
              class="ctrl-btn"
              :class="{ active: micEnabled, danger: !micEnabled }"
              @click="toggleMic"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path v-if="micEnabled" d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z"/><path v-if="micEnabled" d="M19 10v2a7 7 0 0 1-14 0v-2"/><line v-if="micEnabled" x1="12" y1="19" x2="12" y2="22"/><line v-if="!micEnabled" x1="2" y1="2" x2="22" y2="22"/><path v-if="!micEnabled" d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z"/><path v-if="!micEnabled" d="M19 10v2a7 7 0 0 1-3.4 5.95"/><line v-if="!micEnabled" x1="12" y1="19" x2="12" y2="22"/><path v-if="!micEnabled" d="M8.5 21.5h7"/>
              </svg>
            </button>
          </el-tooltip>
          <el-tooltip :content="cameraEnabled ? '关闭摄像头' : '开启摄像头'" placement="top">
            <button
              class="ctrl-btn"
              :class="{ active: cameraEnabled, danger: !cameraEnabled }"
              @click="toggleCamera"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path v-if="cameraEnabled" d="M23 7l-7 5 7 5V7Z"/><rect v-if="cameraEnabled" x="1" y="5" width="15" height="14" rx="2" ry="2"/><path v-if="!cameraEnabled" d="M23 7l-7 5 7 5V7Z"/><rect v-if="!cameraEnabled" x="1" y="5" width="15" height="14" rx="2" ry="2"/><line v-if="!cameraEnabled" x1="1" y1="5" x2="23" y2="19"/>
              </svg>
            </button>
          </el-tooltip>
          <el-tooltip :content="screenSharing ? '停止共享' : '共享屏幕'" placement="top">
            <button
              class="ctrl-btn"
              :class="{ active: screenSharing }"
              @click="toggleScreenShare"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <rect x="2" y="3" width="20" height="14" rx="2" ry="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/>
              </svg>
            </button>
          </el-tooltip>
          <el-tooltip content="离开会议" placement="top">
            <button class="ctrl-btn danger leave-btn" @click="leaveRoom">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/>
              </svg>
            </button>
          </el-tooltip>
        </div>
        <div class="controls-right">
          <span class="participant-count">{{ visibleTiles.length }} 人在线</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, watch, onUnmounted, nextTick } from 'vue';
import { ElMessage, ElTooltip, ElTag } from 'element-plus';
import {
  Room,
  RoomEvent,
  VideoPresets,
  createLocalVideoTrack,
  type RemoteParticipant,
  type RemoteTrackPublication,
  type LocalParticipant,
  type Participant,
  type Track,
  type VideoCaptureOptions,
} from 'livekit-client';

// ── Props ────────────────────────────────────────────────

const props = defineProps<{
  sessionId: string;
  connectionState: string;
}>();

const emit = defineEmits<{
  disconnectRequest: [sessionId: string];
}>();

// ── State ────────────────────────────────────────────────

const room = ref<Room | null>(null);
const roomName = ref('');
const loadingMessage = ref('正在加入会议...');
const micEnabled = ref(true);
const cameraEnabled = ref(true);
const screenSharing = ref(false);

// 参与者数据
interface ParticipantTile {
  identity: string;
  displayName: string;
  isHost: boolean;
  isLocal: boolean;
  isScreenShare: boolean;
  hasVideo: boolean;
  hasAudio: boolean;
}

const participants = reactive<Map<string, ParticipantTile>>(new Map());
const videoElements = new Map<string, HTMLVideoElement>();

// ── Computed ─────────────────────────────────────────────

const visibleTiles = computed(() => {
  const tiles: ParticipantTile[] = [];
  participants.forEach((p) => tiles.push(p));
  // 本地放在最后
  tiles.sort((a, b) => (a.isLocal ? 1 : 0) - (b.isLocal ? 1 : 0));
  return tiles;
});

// ── Exposed methods (called from parent) ─────────────────

function handleWebRTCSignal(sid: string, msg: any) {
  if (sid !== props.sessionId) return;
  console.log('[ConferenceRoom] handleWebRTCSignal:', msg.type, msg);

  if (msg.type === 'livekit_info') {
    connectToLiveKit(msg.server, msg.token, msg.room);
  } else if (msg.type === 'room_joined') {
    // 兼容 room_joined 信令
    if (msg.server && msg.token) {
      connectToLiveKit(msg.server, msg.token, msg.room || 'default');
    }
  }
}

defineExpose({ handleWebRTCSignal });

// ── LiveKit Connection ───────────────────────────────────

async function connectToLiveKit(server: string, token: string, name: string) {
  if (room.value) {
    console.warn('[ConferenceRoom] already connected');
    return;
  }

  roomName.value = name || '会议室';
  loadingMessage.value = '正在连接 LiveKit...';

  const r = new Room({
    adaptiveStream: true,
    dynacast: true,
    videoCaptureDefaults: {
      resolution: VideoPresets.h720.resolution,
    } as VideoCaptureOptions,
  });

  // ── Event handlers ──

  r.on(RoomEvent.ParticipantConnected, (participant: RemoteParticipant) => {
    console.log('[ConferenceRoom] participant connected:', participant.identity);
    addParticipant(participant);
  });

  r.on(RoomEvent.ParticipantDisconnected, (participant: RemoteParticipant) => {
    console.log('[ConferenceRoom] participant disconnected:', participant.identity);
    removeParticipant(participant.identity);
    // 检查是否是主持人断开 — 转移主持人
    handleHostMigration(participant);
  });

  r.on(RoomEvent.TrackSubscribed, (
    track: RemoteTrackPublication,
    publication: RemoteTrackPublication,
    participant: RemoteParticipant,
  ) => {
    console.log('[ConferenceRoom] track subscribed:', track.kind, participant.identity);
    attachTrack(participant.identity, track, participant);
  });

  r.on(RoomEvent.TrackUnsubscribed, (
    track: RemoteTrackPublication,
    publication: RemoteTrackPublication,
    participant: RemoteParticipant,
  ) => {
    console.log('[ConferenceRoom] track unsubscribed:', track.kind, participant.identity);
    detachTrack(participant.identity, track);
  });

  r.on(RoomEvent.TrackMuted, (pub: RemoteTrackPublication, participant?: Participant) => {
    if (participant) updateTrackState(participant.identity, pub);
  });

  r.on(RoomEvent.TrackUnmuted, (pub: RemoteTrackPublication, participant?: Participant) => {
    if (participant) updateTrackState(participant.identity, pub);
  });

  r.on(RoomEvent.Disconnected, () => {
    console.log('[ConferenceRoom] disconnected from LiveKit');
    cleanupRoom();
  });

  try {
    await r.connect(server, token);
    room.value = r;
    console.log('[ConferenceRoom] connected to LiveKit room:', name);

    // 添加本地参与者
    addLocalParticipant(r.localParticipant);

    // 添加已有远程参与者
    r.remoteParticipants.forEach((p) => addParticipant(p));

    // 启用摄像头和麦克风
    loadingMessage.value = '正在启用摄像头和麦克风...';
    await nextTick();
    await r.localParticipant.enableCameraAndMicrophone();
    console.log('[ConferenceRoom] camera & mic enabled');
  } catch (err: any) {
    console.error('[ConferenceRoom] connection failed:', err);
    loadingMessage.value = '连接失败: ' + (err.message || '未知错误');
    ElMessage.error('LiveKit 连接失败: ' + (err.message || ''));
  }
}

// ── Participant Management ───────────────────────────────

function addLocalParticipant(lp: LocalParticipant) {
  const identity = lp.identity;
  participants.set(identity, {
    identity,
    displayName: '我',
    isHost: true, // 第一个加入的默认是 host
    isLocal: true,
    isScreenShare: false,
    hasVideo: false,
    hasAudio: false,
  });
  // 如果有本地视频轨道
  lp.getTrackPublications().forEach((pub) => {
    if (pub.kind === 'video' || pub.kind === 'audio') {
      updateTrackState(identity, pub);
    }
  });
}

function addParticipant(p: RemoteParticipant) {
  const displayName = p.name || p.identity.split('-')[0] || p.identity.slice(0, 8);
  // 判断是否屏幕共享（屏幕共享的 track.source === 'screen_share'）
  const hasScreenShare = Array.from(p.trackPublications.values()).some(
    (pub) => pub.source === Track.Source.ScreenShare && pub.isSubscribed,
  );

  participants.set(p.identity, {
    identity: p.identity,
    displayName,
    isHost: participants.size === 0, // 第一个远程参与者变 host
    isLocal: false,
    isScreenShare: hasScreenShare,
    hasVideo: false,
    hasAudio: false,
  });

  // 检查已有订阅的 track
  p.trackPublications.forEach((pub) => {
    if (pub.track && pub.isSubscribed) {
      attachTrack(p.identity, pub, p);
    }
  });
}

function removeParticipant(identity: string) {
  // 清理 video 元素
  const el = videoElements.get(identity);
  if (el) {
    el.srcObject = null;
    videoElements.delete(identity);
  }
  participants.delete(identity);
}

// ── Track Management ─────────────────────────────────────

function attachTrack(identity: string, publication: RemoteTrackPublication, participant: RemoteParticipant) {
  const track = publication.track;
  if (!track) return;

  const tile = participants.get(identity);
  if (!tile) return;

  if (track.kind === 'video' || track.kind === 'audio') {
    updateTrackState(identity, publication);
  }

  if (track.kind === 'video') {
    const videoEl = videoElements.get(identity);
    if (videoEl) {
      track.attach(videoEl);
    }
    // 检测屏幕共享
    tile.isScreenShare = publication.source === Track.Source.ScreenShare;
  }
}

function detachTrack(identity: string, publication: RemoteTrackPublication) {
  const track = publication.track;
  if (!track) return;

  const tile = participants.get(identity);
  if (!tile) return;

  if (track.kind === 'video') {
    tile.hasVideo = false;
    const videoEl = videoElements.get(identity);
    if (videoEl) {
      track.detach(videoEl);
    }
    if (publication.source === Track.Source.ScreenShare) {
      tile.isScreenShare = false;
    }
  } else if (track.kind === 'audio') {
    tile.hasAudio = false;
  }
}

function updateTrackState(identity: string, publication: RemoteTrackPublication) {
  const tile = participants.get(identity);
  if (!tile) return;

  if (publication.kind === 'video') {
    tile.hasVideo = !publication.isMuted;
  } else if (publication.kind === 'audio') {
    tile.hasAudio = !publication.isMuted;
  }
}

// ── Video Element Ref Management ─────────────────────────

function setVideoRef(identity: string, el: HTMLVideoElement | null) {
  if (el) {
    videoElements.set(identity, el);
  } else {
    videoElements.delete(identity);
  }
}

// ── Controls ─────────────────────────────────────────────

async function toggleMic() {
  if (!room.value) return;
  try {
    await room.value.localParticipant.setMicrophoneEnabled(!micEnabled.value);
    micEnabled.value = !micEnabled.value;
  } catch (err: any) {
    console.error('[ConferenceRoom] toggle mic failed:', err);
  }
}

async function toggleCamera() {
  if (!room.value) return;
  try {
    await room.value.localParticipant.setCameraEnabled(!cameraEnabled.value);
    cameraEnabled.value = !cameraEnabled.value;
  } catch (err: any) {
    console.error('[ConferenceRoom] toggle camera failed:', err);
  }
}

async function toggleScreenShare() {
  if (!room.value) return;
  try {
    if (screenSharing.value) {
      await room.value.localParticipant.setScreenShareEnabled(false);
      screenSharing.value = false;
    } else {
      await room.value.localParticipant.setScreenShareEnabled(true);
      screenSharing.value = true;
    }
  } catch (err: any) {
    console.error('[ConferenceRoom] toggle screenshare failed:', err);
    ElMessage.error('屏幕共享启动失败: ' + (err.message || ''));
  }
}

function leaveRoom() {
  cleanupRoom();
  emit('disconnectRequest', props.sessionId);
}

// ── Host Migration ───────────────────────────────────────

function handleHostMigration(disconnectedParticipant: RemoteParticipant) {
  const disconnectedTile = findParticipantByIdentity(disconnectedParticipant.identity);
  if (!disconnectedTile || !disconnectedTile.isHost) return;

  // 主持人离开了，找第一个非本地参与者
  let transferred = false;
  participants.forEach((tile, identity) => {
    if (!transferred && !tile.isLocal) {
      tile.isHost = true;
      transferred = true;
      ElMessage.info('主持人已转移给 ' + tile.displayName);
    }
  });

  // 如果没有其他远程参与者，本地变成主持人
  if (!transferred) {
    participants.forEach((tile) => {
      if (tile.isLocal) tile.isHost = true;
    });
  }
}

function findParticipantByIdentity(identity: string): ParticipantTile | undefined {
  let found: ParticipantTile | undefined;
  participants.forEach((p) => {
    if (p.identity === identity) found = p;
  });
  return found;
}

// ── Cleanup ──────────────────────────────────────────────

function cleanupRoom() {
  if (room.value) {
    try {
      room.value.disconnect();
    } catch {}
    room.value = null;
  }
  participants.clear();
  videoElements.forEach((el) => { el.srcObject = null; });
  videoElements.clear();
  screenSharing.value = false;
}

onUnmounted(() => {
  cleanupRoom();
});
</script>

<style scoped>
.conference-room {
  flex: 1;
  display: flex;
  flex-direction: column;
  height: 100%;
  background: var(--el-bg-color-page);
  position: relative;
}

/* ── Loading ── */
.conference-loading {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  gap: 20px;
}

.loading-spinner {
  width: 40px;
  height: 40px;
  border: 3px solid var(--el-border-color);
  border-top-color: var(--el-color-primary);
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.loading-text {
  color: var(--el-text-color-secondary);
  font-size: 14px;
  margin: 0;
}

/* ── Video Grid ── */
.conference-active {
  flex: 1;
  display: flex;
  flex-direction: column;
  height: 100%;
}

.video-grid {
  flex: 1;
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
  gap: 8px;
  padding: 12px;
  overflow-y: auto;
  align-content: center;
}

.video-grid.single {
  grid-template-columns: 1fr;
  align-content: center;
}

.video-tile {
  position: relative;
  background: #1a1a1a;
  border-radius: 10px;
  overflow: hidden;
  aspect-ratio: 16 / 9;
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 180px;
}

.video-tile.screen-share {
  grid-column: 1 / -1;
  aspect-ratio: 16 / 9;
}

.video-tile.local {
  border: 2px solid var(--el-color-primary);
}

.tile-video {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

.video-tile.no-video .tile-video {
  display: none;
}

.tile-placeholder {
  display: flex;
  align-items: center;
  justify-content: center;
}

.avatar {
  width: 64px;
  height: 64px;
  border-radius: 50%;
  background: var(--el-color-primary-light-3);
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
  font-weight: 600;
}

.tile-overlay {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  padding: 8px 12px;
  background: linear-gradient(transparent, rgba(0, 0, 0, 0.7));
  display: flex;
  align-items: center;
  gap: 6px;
}

.tile-name {
  color: #fff;
  font-size: 12px;
  font-weight: 500;
}

.tile-badge {
  font-size: 10px;
  line-height: 1;
}

/* ── Controls Bar ── */
.controls-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 20px;
  background: var(--el-bg-color);
  border-top: 1px solid var(--el-border-color-lighter);
}

.controls-left {
  display: flex;
  align-items: center;
}

.room-name {
  font-size: 13px;
  font-weight: 500;
  color: var(--el-text-color-secondary);
}

.controls-center {
  display: flex;
  align-items: center;
  gap: 10px;
}

.controls-right {
  display: flex;
  align-items: center;
}

.participant-count {
  font-size: 12px;
  color: var(--el-text-color-secondary);
}

.ctrl-btn {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  border: 1px solid var(--el-border-color);
  background: var(--el-bg-color);
  color: var(--el-text-color-primary);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.15s ease;
}

.ctrl-btn:hover {
  background: var(--el-fill-color-light);
}

.ctrl-btn.active {
  border-color: var(--el-color-primary);
  color: var(--el-color-primary);
}

.ctrl-btn.danger {
  border-color: var(--el-color-danger);
  color: var(--el-color-danger);
}

.ctrl-btn.danger:hover {
  background: var(--el-color-danger-light-9);
}

.ctrl-btn.leave-btn {
  background: var(--el-color-danger);
  border-color: var(--el-color-danger);
  color: #fff;
}

.ctrl-btn.leave-btn:hover {
  background: var(--el-color-danger-light-3);
  border-color: var(--el-color-danger-light-3);
}
</style>
