<script setup lang="ts">
/**
 * 视频空间（WebRTC 视频通话）
 *
 * <p>网格：1 路本地流 + 1 路对端流（2:1 或 1:1），右上角带[/subscribe]控件。
 * 当前只负责页面壳，媒体管线由 {@code @repo/utils} 的 {@code webrtc} 接管，
 * offer / answer / candidate 全部走 {@code store.signal}。</p>
 *
 * @author CH
 * @since 4.0.0.46
 */
import { computed, ref } from "vue";
import { useRoomStore } from "../stores/room";
import { ConnectionState } from "../services/roomSocket";

const store = useRoomStore();
const videoRef = ref<HTMLVideoElement | null>(null);
const localStream = ref<MediaStream | null>(null);
const peerStream = ref<MediaStream | null>(null);
const cameraOn = ref(false);
const isBig = ref(false);

/** 连接是否活着 */
const connected = computed(() => store.connected);

/** 切换摄像头 */
async function toggleCamera(): Promise<void> {
  cameraOn.value = !cameraOn.value;
  if (cameraOn.value) {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      localStream.value = stream;
      if (videoRef.value) videoRef.value.srcObject = stream;
    } catch {
      /* 没有摄像头：降级为占位 */
    }
  } else {
    localStream.value?.getTracks().forEach((t) => t.stop());
    localStream.value = null;
    if (videoRef.value) videoRef.value.srcObject = null;
  }
}
</script>

<template>
  <div class="rm-workspace">
    <div class="rm-pane rm-pane--full">
      <div class="rm-pane-body rm-pane-body--flush">
        <div class="rm-video__grid">
          <!-- 对端 -->
          <div class="rm-video__cell rm-video__cell--peer">
            <div v-if="!peerStream" class="rm-empty">
              <ReIcon name="VideoCamera" :size="26" />
              <b>{{ connected ? "等待对端" : "对端未连接" }}</b>
              <span>视频需要双方都打开</span>
            </div>
            <video v-else ref="videoRef" autoplay playsinline loop muted controls />
            <span class="rm-video__label">对端</span>
          </div>

          <!-- 本地 -->
          <div class="rm-video__cell rm-video__cell--local">
            <div v-if="!localStream" class="rm-empty">
              <ReIcon name="VideoCamera" :size="26" />
              <b>未打开摄像头</b>
            </div>
            <video v-else ref="videoRef" autoplay playsinline muted />
            <span class="rm-video__label">本地</span>
          </div>
        </div>

        <div class="rm-video__bar">
          <button type="button" class="rm-media__btn" :class="{ on: cameraOn }" @click="toggleCamera">
            <ReIcon :name="cameraOn ? 'VideoCamera' : 'VideoCameraOff'" :size="15" />
          </button>
          <button type="button" class="rm-media__btn" :disabled="!connected" @click="isBig = !isBig">
            <ReIcon name="FullScreen" :size="15" />
          </button>
          <button type="button" class="rm-media__btn rm-media__btn--danger" :disabled="!connected" @click="store.signal('hangup')">
            <ReIcon name="Close" :size="15" />
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.rm-video__grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 2px;
  height: 100%;
}
.rm-video__cell {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--el-fill-color, rgba(0, 0, 0, 0.06));
  border-radius: 6px;
  overflow: hidden;
}
.rm-video__cell--local {
  grid-row: 1 / 2;
  grid-column: 2 / 3;
  width: 200px;
  height: 150px;
}
.rm-video__label {
  position: absolute;
  left: 8px;
  bottom: 8px;
  font-size: 11px;
  color: #fff;
  background: rgba(0, 0, 0, 0.45);
  padding: 2px 8px;
  border-radius: 3px;
}
.rm-video__bar {
  display: flex;
  justify-content: center;
  gap: 8px;
  padding: 10px;
}
.rm-media__btn--danger:hover {
  background: var(--el-color-danger-light-9, rgba(245, 108, 108, 0.1));
  border-color: var(--el-color-danger, #f56c6c);
}
video {
  width: 100%;
  height: 100%;
  object-fit: cover;
  border-radius: 6px;
}
</style>
