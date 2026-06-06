<template>
  <el-container class="conference-room">
    <el-main class="conference-main">
      <div v-if="!room" class="conference-loading">
        <el-card class="loading-card shadow-sm rounded-xl">
          <div class="loading-spinner" />
          <p class="loading-title">正在进入会议</p>
          <p class="loading-text">{{ loadingMessage }}</p>
        </el-card>
      </div>

      <el-row v-else class="conference-active" :gutter="16">
        <el-col :span="18" class="conference-stage-col">
          <el-card class="conference-stage shadow-sm rounded-xl">
            <div class="stage-content">
              <div class="hero-tile" :class="{ sharing: sharedTile?.isScreenShare }">
                <video
                  v-if="sharedTile"
                  :ref="(el) => setVideoRef(sharedTile.identity, el as HTMLVideoElement | null)"
                  autoplay
                  playsinline
                  :muted="sharedTile.isLocal"
                  class="hero-video"
                />
                <div v-else class="hero-placeholder">
                  <div class="hero-avatar">{{ roomName.charAt(0) }}</div>
                  <div class="hero-title-text">暂无画面</div>
                  <div class="hero-subtitle-text">主持人可点击“共享桌面”开始共享</div>
                </div>

                <div class="hero-overlay">
                  <div class="hero-meta">
                    <span class="hero-name">{{ sharedTile?.displayName || '会议画面' }}</span>
                    <span class="hero-subtitle">{{ sharedTile?.isScreenShare ? '屏幕共享' : '主画面' }}</span>
                  </div>
                  <div class="hero-status">
                    <el-tag v-if="localRole === 'host'" size="small" type="warning" effect="plain">主持人</el-tag>
                    <el-tag v-if="screenSharing" size="small" type="info" effect="plain">正在共享</el-tag>
                  </div>
                </div>
              </div>

              <div v-if="secondaryTiles.length" class="participant-grid" :class="participantGridClass">
                <div
                  v-for="tile in secondaryTiles"
                  :key="tile.identity"
                  class="participant-item"
                  :class="{ local: tile.isLocal, host: tile.isHost, active: tile.identity === sharedTile?.identity }"
                >
                  <div class="participant-avatar">{{ tile.displayName.charAt(0).toUpperCase() }}</div>
                  <div class="participant-info">
                    <span class="participant-name">{{ tile.displayName }}</span>
                    <span class="participant-status">
                      <span v-if="tile.isLocal">我</span>
                      <span v-if="tile.isHost">主持人</span>
                      <span v-if="tile.isScreenShare">共享</span>
                      <span v-if="tile.isMuted || !tile.hasAudio">静音</span>
                      <span v-if="!tile.hasVideo">无画面</span>
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </el-card>
        </el-col>

        <el-col :span="6" class="conference-side-col">
          <el-card class="participant-card shadow-sm rounded-xl">
            <template #header>
              <div class="sidebar-header">
                <div>
                  <p class="sidebar-title">参与者</p>
                  <p class="sidebar-subtitle">{{ participantCount }} 人在线</p>
                </div>
                <el-tag type="info" effect="plain">{{ screenSharing ? '共享中' : '待共享' }}</el-tag>
              </div>
            </template>

            <div class="participant-list">
              <div
                v-for="tile in visibleTiles"
                :key="tile.identity"
                class="participant-item"
                :class="{ local: tile.isLocal, host: tile.isHost }"
              >
                <div class="participant-avatar">{{ tile.displayName.charAt(0).toUpperCase() }}</div>
                <div class="participant-info">
                  <span class="participant-name">{{ tile.displayName }}</span>
                  <span class="participant-status">
                    <span v-if="tile.isLocal">我</span>
                    <span v-if="tile.isHost">主持人</span>
                    <span v-if="tile.isScreenShare">共享</span>
                    <span v-if="tile.isMuted || !tile.hasAudio">静音</span>
                    <span v-if="!tile.hasVideo">无画面</span>
                  </span>
                </div>
              </div>
            </div>
          </el-card>
        </el-col>
      </el-row>
    </el-main>

    <el-footer v-if="room" class="controls-bar">
      <div class="controls-left">
        <el-tag effect="plain">{{ roomName }}</el-tag>
      </div>
      <div class="controls-center">
        <el-tooltip :content="micEnabled ? '关闭麦克风' : '开启麦克风'" placement="top">
          <button class="ctrl-btn" :class="{ active: micEnabled, danger: !micEnabled }" aria-label="麦克风" @click="toggleMic">
            <el-icon>
              <Microphone v-if="micEnabled" />
              <Microphone v-else />
            </el-icon>
          </button>
        </el-tooltip>
        <el-tooltip :content="screenSharing ? '停止共享桌面' : '共享桌面'" placement="top">
          <button class="ctrl-btn" :class="{ active: screenSharing }" aria-label="共享桌面" @click="toggleScreenShare">
            <el-icon>
              <Monitor v-if="screenSharing" />
              <MonitorShare v-else />
            </el-icon>
          </button>
        </el-tooltip>
        <el-tooltip content="离开会议" placement="top">
          <button class="ctrl-btn danger leave-btn" aria-label="离开会议" @click="showLeaveDialog = true">
            <el-icon><SwitchButton /></el-icon>
          </button>
        </el-tooltip>
      </div>
      <div class="controls-right">
        <el-tag effect="plain">{{ participantCount }} 人在线</el-tag>
      </div>
    </el-footer>

    <el-dialog v-model="showLeaveDialog" title="离开会议" width="360px" :close-on-click-modal="false">
      <p v-if="localRole === 'host'">您是主持人，请选择操作：</p>
      <p v-else>确定要离开会议吗？</p>
      <template #footer>
        <div v-if="localRole === 'host'" class="leave-dialog-actions">
          <el-button @click="showLeaveDialog = false">取消</el-button>
          <el-button type="warning" @click="handleTransferAndLeave">转让主持人后离开</el-button>
          <el-button type="danger" @click="handleEndMeeting">结束会议</el-button>
        </div>
        <div v-else>
          <el-button @click="showLeaveDialog = false">取消</el-button>
          <el-button type="danger" @click="handleLeave">确定离开</el-button>
        </div>
      </template>
    </el-dialog>
  </el-container>
</template>

<script setup lang="ts">
import { computed, nextTick, onUnmounted, reactive, ref } from 'vue';
import { ElMessage } from 'element-plus';
import { Microphone, Monitor, SwitchButton } from '@element-plus/icons-vue';
import {
  Room,
  RoomEvent,
  Track,
  VideoPresets,
  type LocalParticipant,
  type LocalTrackPublication,
  type Participant,
  type RemoteParticipant,
  type RemoteTrackPublication,
  type VideoCaptureOptions,
} from 'livekit-client';

const props = defineProps<{
  sessionId: string;
  connectionState: string;
}>();

const emit = defineEmits<{
  disconnectRequest: [sessionId: string];
}>();

interface ParticipantTile {
  identity: string;
  displayName: string;
  isHost: boolean;
  isLocal: boolean;
  isScreenShare: boolean;
  hasVideo: boolean;
  hasAudio: boolean;
  isMuted: boolean;
}

const room = ref<Room | null>(null);
const roomName = ref('会议室');
const loadingMessage = ref('正在加入会议...');
const micEnabled = ref(true);
const screenSharing = ref(false);
const localRole = ref<'host' | 'guest'>('host');
const showLeaveDialog = ref(false);
const participants = reactive<Map<string, ParticipantTile>>(new Map());
const videoElements = new Map<string, HTMLVideoElement>();

const visibleTiles = computed(() => Array.from(participants.values()).sort((a, b) => Number(b.isLocal) - Number(a.isLocal)));
const participantItems = computed(() => visibleTiles.value);
const sharedTile = computed(() => visibleTiles.value.find((tile) => tile.isScreenShare) || visibleTiles.value[0] || null);
const secondaryTiles = computed(() => visibleTiles.value.filter((tile) => tile.identity !== sharedTile.value?.identity));
const participantCount = computed(() => visibleTiles.value.length);
const participantGridClass = computed(() => {
  const count = Math.max(0, secondaryTiles.value.length);
  if (count <= 1) return 'is-single-row';
  if (count <= 4) return 'is-two-rows';
  return 'is-scrollable';
});

function handleWebRTCSignal(sid: string, msg: any) {
  if (sid !== props.sessionId) return;
  if (msg.type === 'livekit_info') {
    void connectToLiveKit(msg.server, msg.token, msg.room, msg.mode);
  }
}

defineExpose({ handleWebRTCSignal });

function resolveLiveKitServer(server: string) {
  try {
    const url = new URL(server);
    if (url.pathname === '/livekit') return url.toString();
  } catch {}

  const gateway = new URLSearchParams(window.location.search).get('gateway') || new URLSearchParams(window.location.search).get('gw');
  if (gateway) return `${window.location.protocol === 'https:' ? 'wss:' : 'ws:'}//${gateway}/livekit`;
  return `${window.location.protocol === 'https:' ? 'wss:' : 'ws:'}//${window.location.host}/livekit`;
}

async function connectToLiveKit(server: string, token: string, name: string, mode?: string) {
  if (room.value) return;

  const liveKitServer = resolveLiveKitServer(server);
  localRole.value = mode === 'host' ? 'host' : 'guest';
  roomName.value = name || '会议室';
  loadingMessage.value = '正在连接 LiveKit...';

  const r = new Room({
    adaptiveStream: true,
    dynacast: true,
    videoCaptureDefaults: {
      resolution: VideoPresets.h720.resolution,
    } as VideoCaptureOptions,
  });

  r.on(RoomEvent.ParticipantConnected, addParticipant);
  r.on(RoomEvent.ParticipantDisconnected, (participant: RemoteParticipant) => {
    const wasHost = participants.get(participant.identity)?.isHost === true;
    removeParticipant(participant.identity);
    handleHostMigration(wasHost);
  });
  r.on(RoomEvent.TrackSubscribed, (_track, publication, participant) => attachTrack(participant.identity, publication));
  r.on(RoomEvent.TrackUnsubscribed, (_track, publication, participant) => detachTrack(participant.identity, publication));
  r.on(RoomEvent.LocalTrackPublished, (publication) => attachTrack(r.localParticipant.identity, publication));
  r.on(RoomEvent.LocalTrackUnpublished, (publication) => detachTrack(r.localParticipant.identity, publication));
  r.on(RoomEvent.TrackMuted, (publication, participant) => {
    if (participant) updateTrackState(participant.identity, publication as RemoteTrackPublication);
  });
  r.on(RoomEvent.TrackUnmuted, (publication, participant) => {
    if (participant) updateTrackState(participant.identity, publication as RemoteTrackPublication);
  });
  r.on(RoomEvent.ParticipantAttributesChanged, (_changedAttributes, participant) => {
    updateParticipantRole(participant);
    syncHostRoles();
  });
  r.on(RoomEvent.Disconnected, cleanupRoom);

  try {
    await Promise.race([
      r.connect(liveKitServer, token),
      new Promise<void>((_, reject) => setTimeout(() => reject(new Error('LiveKit 连接超时 (30s)')), 30000)),
    ]);
    room.value = r;
    addLocalParticipant(r.localParticipant);
    r.remoteParticipants.forEach(addParticipant);
    syncHostRoles();

    loadingMessage.value = '正在启用麦克风...';
    await nextTick();
    try {
      await r.localParticipant.setMicrophoneEnabled(true);
      micEnabled.value = true;
    } catch (err: any) {
      micEnabled.value = false;
      ElMessage.warning('已进入会议，麦克风未启用: ' + (err.message || ''));
    }
  } catch (err: any) {
    loadingMessage.value = '连接失败: ' + (err.message || '未知错误');
    ElMessage.error('LiveKit 连接失败: ' + (err.message || ''));
    r.disconnect();
  }
}

function addLocalParticipant(participant: LocalParticipant) {
  participants.set(participant.identity, {
    identity: participant.identity,
    displayName: '我',
    isHost: localRole.value === 'host',
    isLocal: true,
    isScreenShare: false,
    hasVideo: false,
    hasAudio: false,
    isMuted: false,
  });
  participant.trackPublications.forEach((publication) => updateTrackState(participant.identity, publication));
}

function addParticipant(participant: RemoteParticipant) {
  participants.set(participant.identity, {
    identity: participant.identity,
    displayName: participant.name || participant.identity.split('-')[0] || participant.identity.slice(0, 8),
    isHost: participant.attributes?.role === 'host',
    isLocal: false,
    isScreenShare: false,
    hasVideo: false,
    hasAudio: false,
    isMuted: false,
  });
  participant.trackPublications.forEach((publication) => {
    if (publication.track && publication.isSubscribed) attachTrack(participant.identity, publication);
    else updateTrackState(participant.identity, publication);
  });
  syncHostRoles();
}

function removeParticipant(identity: string) {
  const element = videoElements.get(identity);
  if (element) element.srcObject = null;
  videoElements.delete(identity);
  participants.delete(identity);
}

function attachTrack(identity: string, publication: RemoteTrackPublication | LocalTrackPublication) {
  const track = publication.track;
  const tile = participants.get(identity);
  if (!track || !tile) return;
  updateTrackState(identity, publication);
  if (track.kind === Track.Kind.Video) {
    const element = videoElements.get(identity);
    if (element) track.attach(element);
    tile.isScreenShare = publication.source === Track.Source.ScreenShare;
  }
}

function detachTrack(identity: string, publication: RemoteTrackPublication | LocalTrackPublication) {
  const track = publication.track;
  const tile = participants.get(identity);
  if (!track || !tile) return;
  if (track.kind === Track.Kind.Video) {
    const element = videoElements.get(identity);
    if (element) track.detach(element);
    tile.hasVideo = false;
    if (publication.source === Track.Source.ScreenShare) tile.isScreenShare = false;
  }
  if (track.kind === Track.Kind.Audio) tile.hasAudio = false;
}

function updateTrackState(identity: string, publication: RemoteTrackPublication | LocalTrackPublication) {
  const tile = participants.get(identity);
  if (!tile) return;
  if (publication.kind === Track.Kind.Video) {
    tile.hasVideo = !publication.isMuted;
    tile.isScreenShare = publication.source === Track.Source.ScreenShare;
  }
  if (publication.kind === Track.Kind.Audio) {
    tile.hasAudio = !publication.isMuted;
    tile.isMuted = publication.isMuted;
  }
}

function updateParticipantRole(participant: Participant) {
  const tile = participants.get(participant.identity);
  if (tile) tile.isHost = participant.attributes?.role === 'host';
}

function syncHostRoles() {
  if (visibleTiles.value.some((tile) => tile.isHost)) return;
  const nextHost = visibleTiles.value.find((tile) => !tile.isLocal) || visibleTiles.value[0];
  if (nextHost) nextHost.isHost = true;
  localRole.value = nextHost?.isLocal ? 'host' : 'guest';
}

function handleHostMigration(wasHost: boolean) {
  if (!wasHost) return;
  const nextHost = visibleTiles.value.find((tile) => !tile.isLocal) || visibleTiles.value[0];
  if (nextHost) {
    nextHost.isHost = true;
    if (nextHost.isLocal) localRole.value = 'host';
    ElMessage.info('主持人已转移给 ' + nextHost.displayName);
  }
}

function cleanupRoom() {
  const current = room.value;
  room.value = null;
  if (current) {
    try { current.disconnect(); } catch {}
  }
  participants.clear();
  videoElements.forEach((element) => { element.srcObject = null; });
  videoElements.clear();
  screenSharing.value = false;
}

function setVideoRef(identity: string, element: HTMLVideoElement | null) {
  if (element) videoElements.set(identity, element);
  else videoElements.delete(identity);
}

async function toggleMic() {
  if (!room.value) return;
  await room.value.localParticipant.setMicrophoneEnabled(!micEnabled.value);
  micEnabled.value = !micEnabled.value;
}

async function toggleScreenShare() {
  if (!room.value) return;
  try {
    await room.value.localParticipant.setScreenShareEnabled(!screenSharing.value);
    screenSharing.value = !screenSharing.value;
  } catch (err: any) {
    ElMessage.error('屏幕共享启动失败: ' + (err.message || ''));
  }
}

function handleLeave() {
  showLeaveDialog.value = false;
  cleanupRoom();
  emit('disconnectRequest', props.sessionId);
}

function handleTransferAndLeave() {
  showLeaveDialog.value = false;
  void room.value?.localParticipant.setAttributes({ role: 'guest' });
  handleLeave();
}

function handleEndMeeting() {
  showLeaveDialog.value = false;
  cleanupRoom();
  emit('disconnectRequest', props.sessionId);
  ElMessage.success('会议已结束');
}

onUnmounted(cleanupRoom);
</script>

<style scoped>
.conference-room {
  flex: 1;
  display: flex;
  flex-direction: column;
  height: 100%;
  min-height: 640px;
  background: var(--el-bg-color-page);
}

.conference-main {
  flex: 1;
  min-height: 0;
  padding: 16px;
}

.conference-loading {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
}

.loading-card {
  width: 320px;
  text-align: center;
}

.loading-spinner {
  width: 40px;
  height: 40px;
  margin: 0 auto 16px;
  border: 3px solid var(--el-border-color);
  border-top-color: var(--el-color-primary);
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

.loading-title {
  margin: 0 0 8px;
  color: var(--el-text-color-primary);
  font-size: 16px;
  font-weight: 600;
}

.loading-text {
  margin: 0;
  color: var(--el-text-color-secondary);
  font-size: 13px;
}

.conference-active,
.conference-stage-col,
.conference-side-col,
.conference-stage,
.participant-card {
  height: 100%;
}

.conference-stage :deep(.el-card__body),
.participant-card :deep(.el-card__body) {
  display: flex;
  flex-direction: column;
  height: 100%;
  padding: 0;
}

.stage-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-height: 0;
  padding: 16px;
  gap: 12px;
}

.hero-tile {
  position: relative;
  flex: 1;
  min-height: 320px;
  overflow: hidden;
  background: var(--el-bg-color-overlay);
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 16px;
}

.hero-tile.sharing {
  border-color: var(--el-color-primary);
}

.hero-video {
  width: 100%;
  height: 100%;
  object-fit: contain;
  background: var(--el-fill-color-light);
}

.hero-placeholder {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  gap: 8px;
  color: var(--el-text-color-secondary);
}

.hero-avatar,
.participant-avatar {
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 999px;
  background: var(--el-color-primary-light-3);
  color: var(--el-color-white);
  font-weight: 600;
}

.hero-avatar {
  width: 72px;
  height: 72px;
  font-size: 28px;
}

.hero-title-text {
  color: var(--el-text-color-primary);
  font-size: 16px;
  font-weight: 600;
}

.hero-overlay {
  position: absolute;
  right: 12px;
  bottom: 12px;
  left: 12px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 10px 12px;
  background: var(--el-bg-color-overlay);
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 12px;
}

.hero-meta {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 2px;
}

.hero-name,
.participant-name {
  color: var(--el-text-color-primary);
  font-weight: 500;
}

.hero-subtitle,
.participant-status,
.hero-subtitle-text,
.sidebar-subtitle {
  color: var(--el-text-color-secondary);
  font-size: 12px;
}

.hero-status {
  display: flex;
  align-items: center;
  gap: 8px;
}

.participant-grid {
  display: grid;
  gap: 12px;
}

.participant-grid.is-single-row {
  grid-template-columns: repeat(1, minmax(0, 1fr));
}

.participant-grid.is-two-rows {
  grid-template-columns: repeat(2, minmax(0, 1fr));
}

.participant-grid.is-scrollable {
  grid-template-columns: repeat(2, minmax(0, 1fr));
  max-height: 240px;
  overflow: auto;
  padding-right: 4px;
}

.participant-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 12px;
  overflow-y: auto;
}

.participant-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 12px;
  background: var(--el-fill-color-light);
  border: 1px solid transparent;
  border-radius: 10px;
}

.participant-item.host {
  border-color: var(--el-color-warning-light-7);
}

.participant-item.active {
  border-color: var(--el-color-primary-light-7);
}

.participant-avatar {
  width: 36px;
  height: 36px;
  flex-shrink: 0;
  font-size: 14px;
}

.participant-info {
  min-width: 0;
  flex: 1;
}

.participant-name {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.participant-status {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  margin-top: 2px;
}

.sidebar-header,
.controls-bar,
.controls-center,
.controls-left,
.controls-right {
  display: flex;
  align-items: center;
}

.sidebar-header {
  justify-content: space-between;
  gap: 12px;
  padding: 14px 16px;
  border-bottom: 1px solid var(--el-border-color-lighter);
}

.sidebar-title {
  margin: 0;
  color: var(--el-text-color-primary);
  font-size: 16px;
  font-weight: 600;
}

.sidebar-subtitle {
  margin: 2px 0 0;
}

.controls-bar {
  justify-content: space-between;
  padding: 10px 20px;
  background: var(--el-bg-color);
  border-top: 1px solid var(--el-border-color-lighter);
}

.controls-center {
  gap: 10px;
}

.ctrl-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 42px;
  height: 42px;
  border: 1px solid var(--el-border-color);
  border-radius: 999px;
  background: var(--el-bg-color);
  color: var(--el-text-color-primary);
  cursor: pointer;
  transition: all 0.15s ease;
}

.ctrl-btn:hover {
  background: var(--el-fill-color-light);
}

.ctrl-btn.active {
  color: var(--el-color-primary);
  border-color: var(--el-color-primary);
}

.ctrl-btn.danger {
  color: var(--el-color-danger);
  border-color: var(--el-color-danger);
}

.ctrl-btn.leave-btn {
  color: var(--el-color-white);
  background: var(--el-color-danger);
  border-color: var(--el-color-danger);
}

.leave-dialog-actions {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}
</style>
