<script setup lang="ts">
/**
 * 观看空间（远程桌面 / 媒体投屏）
 *
 * <p>展示对端共享的屏幕或视频流，当前只负责壳（占位 + 接入控件，实际流
 * 由 {@code store.signal} 下发的 RPC 管理）。滚动区对齐 @{code !} rm-pr高分。</p>
 *
 * @author CH
 * @since 4.0.0.46
 */
import { ref } from "vue";
import { useRoomStore } from "../stores/room";

const store = useRoomStore();
const localStream = ref<HTMLVideoElement | null>(null);
const streaming = ref(false);

/** 开始投屏（当前本地先占位，等信令下发） */
async function startShare(): Promise<void> {
  streaming.value = true;
  if (!localStream.value) return;
  try {
    const stream = await navigator.mediaDevices.getDisplayMedia({ video: true });
    localStream.value.srcObject = stream;
    store.signal(JSON.stringify({ event: "watch", data: "start" }));
  } catch {
    streaming.value = false;
  }
}

/** 停止投屏 */
function stopShare(): void {
  streaming.value = false;
  if (localStream.value?.srcObject) localStream.value.srcObject = null;
  store.signal(JSON.stringify({ event: "watch", data: "stop" }));
}

/** Video 占位：渲染网格参考画面 */
const frames = [100, 120, 140, 160, 180, 200, 220, 240];
</script>

<template>
  <div class="rm-workspace">
    <div class="rm-pane rm-pane--full">
      <div class="rm-pane-body rm-pane-body--flush">
        <!-- 共享网格 -->
        <div class="rm-watch__grid">
          <div v-for="f in frames" :key="f" class="rm-watch__frame" :style="{ width: `${f}px`, height: `${f}px` }" />
        </div>

        <!-- 控件 -->
        <div class="rm-watch__bar">
          <button type="button" class="rm-media__btn" :class="{ on: streaming }" @click="startShare">
            <ReIcon :name="streaming ? 'MonitorStop' : 'MonitorPlay'" :size="18" />
          </button>
          <button type="button" class="rm-media__btn" @click="stopShare">
            <ReIcon name="Close" :size="18" />
          </button>
          <button type="button" class="rm-media__btn" @click="store.signal('view-change')">
            <ReIcon name="Refresh" :size="18" />
          </button>
        </div>

        <div class="rm-watch__note">
          <ReIcon name="InfoFilled" :size="12" />
          投屏内容由对端信令推 stream，当前为展示格
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.rm-watch__grid {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  flex-wrap: wrap;
  padding: 24px;
}
.rm-watch__frame {
  border-radius: 6px;
  background: var(--el-fill-color-light, rgba(0, 0, 0, 0.06));
  border: 1px solid var(--el-border-color-lighter, #e3e6ef);
}
.rm-watch__bar {
  display: flex;
  justify-content: center;
  gap: 8px;
  padding: 10px 0;
}
.rm-watch__note {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
  font-size: 11px;
  color: var(--el-text-color-placeholder, #9aa3af);
  padding: 0 0 8px;
}
</style>
