<script setup lang="ts">
/**
 * 协作空间（多人文档 / 在线表格）
 *
 * <p>用 Univer 文档做 P2P 协同（目前只下双端 UI：文档列表 + 共享状态）。
 * 同步状态走 {@code signal} 信封的 {@code collaborative} 系列事件，
 * 这里只负责展示最新状态。</p>
 *
 * @author CH
 * @since 4.0.0.46
 */
import { computed, ref } from "vue";
import { useRoomStore } from "../stores/room";

const store = useRoomStore();

/** 同步状态：true 表示已处于协同中 */
const synced = ref(false);
const sessions = ref<{ id: string; name: string }[]>([
  { id: "1", name: "Element" },
  { id: "2", name: "Spreadsheet" },
  { id: "3", name: "Docs" },
]);

const peerCount = computed(() => store.peers.length);
</script>

<template>
  <div class="rm-workspace">
    <div class="rm-pane rm-pane--full">
      <div class="rm-pane-head">
        <ReIcon name="Grid" :size="14" />
        <b>协同文档</b>
        <span class="rm-pill" :class="{ 'is-ok': synced }">
          <span class="rm-dot" :class="synced ? 'is-ok' : 'is-bad'" />
          {{ synced ? "已协同" : "未协同" }}
        </span>
        <span class="rm-spacer" />
        <button type="button" class="rm-btn rm-btn--primary" :disabled="!store.connected" @click="store.signal(JSON.stringify({ event: 'colab', data: 'join' }))">
          加入协同
        </button>
      </div>

      <div class="rm-pane-body">
        <ul class="rm-sessions">
          <li v-for="s in sessions" :key="s.id" class="rm-session">
            <ReIcon name="Document" :size="13" />
            <span class="rm-session__name">{{ s.name }}</span>
            <span class="rm-session__status">
              <span class="rm-dot" :class="synced ? 'is-ok' : 'is-bad'" />
            </span>
          </li>
        </ul>
      </div>
    </div>
  </div>
</template>

<style scoped>
.rm-sessions {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.rm-session {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 10px;
  border-radius: 4px;
  border: 1px solid var(--el-border-color-lighter, #e3e6ef);
}
.rm-session__name {
  font-size: 12.5px;
  font-weight: 600;
  color: var(--el-text-color-primary, inherit);
}
.rm-session__status {
  margin-left: auto;
}
</style>
