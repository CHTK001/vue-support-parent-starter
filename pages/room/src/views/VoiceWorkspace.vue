<script setup lang="ts">
/**
 * 语音空间（WebRTC 语音通话 + 音效）
 *
 * <p>与视频空间共用一条对讲管线，只是不发光流。状态由 {@code store} 驱动，
 * 跨空间消息（谁进谁出、通话建立）走 {@code signal} 信封。</p>
 *
 * @author CH
 * @since 4.0.0.46
 */
import { computed, ref } from "vue";
import { useRoomStore } from "../stores/room";

const store = useRoomStore();
const micOn = ref(false);
const noiseSuppression = ref(true);
const echoCancellation = ref(true);

/** 媒体管线状态 */
const connected = computed(() => store.connected);
const peerReady = computed(() => store.peerReady);

/** 切换麦克风 */
function toggleMic(): void {
  micOn.value = !micOn.value;
  if (micOn.value) {
    void navigator.mediaDevices.getUserMedia({ audio: true }).then((stream) => {
      store.signal(JSON.stringify({ event: "voice", data: "join" }));
      stream.getTracks().forEach((t) => t.onended = () => {
        micOn.value = false;
      });
    });
  } else {
    store.signal(JSON.stringify({ event: "voice", data: "leave" }));
  }
}

/** 切换降噪 */
function toggle(ns: boolean): void {
  noiseSuppression.value = ns;
  store.signal(JSON.stringify({ event: "voice", data: "ns", v: ns }));
}
</script>

<template>
  <div class="rm-workspace">
    <div class="rm-pane rm-pane--full">
      <div class="rm-pane-body rm-pane-body--flush">
        <div class="rm-voice__center">
          <div class="rm-voice__user">
            <span class="rm-voice__name">{{ store.peerId ? store.peerId.slice(0, 8) : "对端" }}</span>
            <span class="rm-dot" :class="{ 'is-ok': peerReady, 'is-bad': !peerReady }" />
          </div>

          <div class="rm-voice__wave">
            <div class="rm-wave__bar" v-for="i in 20" :key="i" />
          </div>

          <div class="rm-voice__bar">
            <button type="button" class="rm-media__btn" :class="{ on: micOn }" @click="toggleMic">
              <ReIcon :name="micOn ? 'Microphone' : 'MicrophoneOff'" :size="18" />
            </button>
            <button type="button" class="rm-media__btn" :class="{ on: noiseSuppression }" @click="toggle(true)">
              <ReIcon name="Headphones" :size="18" />
            </button>
            <button type="button" class="rm-media__btn" :class="{ on: echoCancellation }" @click="toggle(false)">
              <ReIcon name="Monitor" :size="18" />
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.rm-voice__center {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 40px;
  height: 100%;
}
.rm-voice__user {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 18px;
  font-weight: 700;
  color: var(--el-text-color-primary, inherit);
}
.rm-voice__wave {
  display: flex;
  align-items: center;
  gap: 4px;
  height: 60px;
}
.rm-wave__bar {
  width: 6px;
  height: 10px;
  border-radius: 3px;
  background: var(--el-color-primary-light-5, #d9e7ff);
  animation: wave 1s ease-in-out infinite;
}
@keyframes wave {
  0%,
  100% {
    height: 10px;
  }
  50% {
    height: 50px;
  }
}
.rm-wave__bar:nth-child(1) {
  animation-delay: 0s;
}
.rm-wave__bar:nth-child(2) {
  animation-delay: 0.1s;
}
.rm-wave__bar:nth-child(3) {
  animation-delay: 0.2s;
}
.rm-wave__bar:nth-child(4) {
  animation-delay: 0.3s;
}
.rm-wave__bar:nth-child(5) {
  animation-delay: 0.4s;
}
.rm-wave__bar:nth-child(6) {
  animation-delay: 0.5s;
}
.rm-wave__bar:nth-child(7) {
  animation-delay: 0.6s;
}
.rm-wave__bar:nth-child(8) {
  animation-delay: 0.7s;
}
.rm-wave__bar:nth-child(9) {
  animation-delay: 0.8s;
}
.rm-wave__bar:nth-child(10) {
  animation-delay: 0.9s;
}
.rm-wave__bar:nth-child(11) {
  animation-delay: 1s;
}
.rm-wave__bar:nth-child(12) {
  animation-delay: 1.1s;
}
.rm-wave__bar:nth-child(13) {
  animation-delay: 1.2s;
}
.rm-wave__bar:nth-child(14) {
  animation-delay: 1.3s;
}
.rm-wave__bar:nth-child(15) {
  animation-delay: 1.4s;
}
.rm-wave__bar:nth-child(16) {
  animation-delay: 1.5s;
}
.rm-wave__bar:nth-child(17) {
  animation-delay: 1.6s;
}
.rm-wave__bar:nth-child(18) {
  animation-delay: 1.7s;
}
.rm-wave__bar:nth-child(19) {
  animation-delay: 1.8s;
}
.rm-wave__bar:nth-child(20) {
  animation-delay: 1.9s;
}
.rm-voice__bar {
  display: flex;
  gap: 12px;
}
</style>
