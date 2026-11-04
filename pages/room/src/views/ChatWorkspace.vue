<script setup lang="ts">
/**
 * 聊天空间（P2P 聊天是房间的默认工作空间）
 *
 * <p>消息由 {@code store.messages} 驱动：自己发送插在本地列表，对端通过
 * 信令信封 `{event: "chat"}` 到达时由 store 追加为 {@code in} 气泡。
 * 所有消息只在这个空间上展示，不进全局历史。</p>
 *
 * @author CH
 * @since 4.0.0.46
 */
import { computed, ref } from "vue";
import { useRoomStore } from "../stores/room";

const store = useRoomStore();
const text = ref("");

/** 本地消息列表 */
const messages = computed(() => store.messages);

/** 发送 */
function send(): void {
  store.sendChat(text.value);
  text.value = "";
}

/** 时间格式化 */
function fmt(t: number): string {
  const d = new Date(t);
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}
</script>

<template>
  <div class="rm-workspace">
    <div class="rm-pane rm-pane--full">
      <div class="rm-pane-body rm-chat__panel rm-chat__messages">
        <!-- 无消息空态 -->
        <div v-if="!messages.length" class="rm-empty">
          <span>还没有消息</span>
          <span>加入房间后，对端的消息会实时到达这里</span>
        </div>

        <template v-for="m in messages" :key="m.id ?? m.time">
          <!-- 对端 -->
          <div v-if="m.direction === 'in'" class="rm-chat__bubble rm-chat__bubble--in">
            <div class="rm-chat__bubble-name">{{ m.from }}</div>
            <div class="rm-chat__bubble-inner">{{ m.text }}</div>
            <div class="rm-chat__bubble-time">{{ fmt(m.time) }}</div>
          </div>

          <!-- 自己 -->
          <div v-else class="rm-chat__bubble rm-chat__bubble--out">
            <div class="rm-chat__bubble-inner">{{ m.text }}</div>
            <div class="rm-chat__bubble-time">{{ fmt(m.time) }}</div>
          </div>
        </template>
      </div>

      <!-- 输入条 -->
      <div class="rm-chat__input">
        <textarea
          v-model="text"
          placeholder="发消息（Enter 发送，Shift+Enter 换行）"
          @keydown.enter.ctrl.exact.prevent
          @keydown.enter="send"
        />
        <button type="button" class="rm-btn rm-btn--primary" :disabled="!text.trim() || !store.inRoom" @click="send">
          发送
        </button>
      </div>
    </div>
  </div>
</template>
