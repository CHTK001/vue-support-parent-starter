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
import { computed, onBeforeUnmount, ref } from "vue";
import { message } from "@repo/core";
import { useRoomStore } from "../stores/room";

const store = useRoomStore();
const micOn = ref(false);
const noiseSuppression = ref(true);
const echoCancellation = ref(true);

/** 本端麦克风流引用：关麦/卸载时必须 stop()，否则轨道泄漏（资源+隐私） */
let micStream: MediaStream | null = null;

/** 媒体管线状态 */
const connected = computed(() => store.connected);
const peerReady = computed(() => store.peerReady);

/** 停掉本端麦克风流 */
function stopMic(): void {
  micStream?.getTracks().forEach((t) => t.stop());
  micStream = null;
}

/** 切换麦克风 */
async function toggleMic(): Promise<void> {
  if (!micOn.value) {
    try {
      micStream = await navigator.mediaDevices.getUserMedia({
        audio: {
          noiseSuppression: noiseSuppression.value,
          echoCancellation: echoCancellation.value,
        },
      });
    } catch {
      // 权限被拒 / 无可用设备：保持关闭态并给出可感知提示
      micStream = null;
      micOn.value = false;
      message.warning("无法访问麦克风，请检查权限与设备");
      return;
    }
    micOn.value = true;
    store.signal(JSON.stringify({ event: "voice", data: "join" }));
    micStream.getTracks().forEach((t) => {
      t.onended = () => {
        micOn.value = false;
      };
    });
  } else {
    micOn.value = false;
    store.signal(JSON.stringify({ event: "voice", data: "leave" }));
    stopMic();
  }
}

onBeforeUnmount(() => {
  if (micOn.value) {
    store.signal(JSON.stringify({ event: "voice", data: "leave" }));
  }
  stopMic();
});

/**
 * 切换降噪 / 回声消除。
 *
 * <p>两个开关彼此独立：各自翻转自己的状态位，把约束实时应用到本端
 * 麦克风轨道（{@code applyConstraints}），并经信令告知对端（data 取
 * {@code ns} / {@code aec}，v 为新值）。</p>
 *
 * @param kind {@code "ns"} 降噪；{@code "aec"} 回声消除
 */
async function toggleDsp(kind: "ns" | "aec"): Promise<void> {
  if (kind === "ns") {
    noiseSuppression.value = !noiseSuppression.value;
  } else {
    echoCancellation.value = !echoCancellation.value;
  }
  const track = micStream?.getAudioTracks()[0];
  if (track) {
    try {
      await track.applyConstraints({
        noiseSuppression: noiseSuppression.value,
        echoCancellation: echoCancellation.value,
      });
    } catch {
      // 部分设备/浏览器不支持热更新约束：状态位已更新，下次开麦生效
    }
  }
  store.signal(JSON.stringify({ event: "voice", data: kind, v: kind === "ns" ? noiseSuppression.value : echoCancellation.value }));
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

          <div class="rm-voice__wave" :class="{ 'is-live': micOn }">
            <div class="rm-wave__bar" v-for="i in 20" :key="i" />
          </div>

          <div class="rm-voice__bar">
            <button
              type="button"
              class="rm-media__btn"
              :class="{ on: micOn }"
              :title="micOn ? '关闭麦克风' : '打开麦克风'"
              aria-label="麦克风开关"
              @click="toggleMic"
            >
              <ReIcon :name="micOn ? 'Microphone' : 'MicrophoneOff'" :size="18" />
            </button>
            <button
              type="button"
              class="rm-media__btn"
              :class="{ on: noiseSuppression }"
              :title="noiseSuppression ? '关闭降噪' : '开启降噪'"
              aria-label="降噪开关"
              @click="toggleDsp('ns')"
            >
              <ReIcon name="Headphones" :size="18" />
            </button>
            <button
              type="button"
              class="rm-media__btn"
              :class="{ on: echoCancellation }"
              :title="echoCancellation ? '关闭回声消除' : '开启回声消除'"
              aria-label="回声消除开关"
              @click="toggleDsp('aec')"
            >
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
  opacity: 0.45;
}
/* 只在麦克风开启时跳动：关麦/未连接时波形静止在基线高度，不再假动 */
.rm-voice__wave.is-live .rm-wave__bar {
  animation: wave 1s ease-in-out infinite;
  opacity: 1;
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
