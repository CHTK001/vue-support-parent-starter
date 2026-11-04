<script setup lang="ts">
/**
 * P2P 房间工作台（路由 {@code /room}）
 *
 * <p>壳：顶部工具条（房间号 / 加入状态 / 连接状态徽标 / 断开）+ 工作空间页签
 * （聊天 / 文件 / 视频 / 语音 / 观看 / 协作 / 画板 / 状态）+ 工作区面板。
 * 连接与信令状态机由 {@code @pages/room/stores} 承载，各空间只读写自己的状态。</p>
 *
 * <p>进入页面时先连 Socket，再发 hello 加入房间（路由 query 的
 * {@code roomId} 直接进房，没有则创建空房间）；离开时 leave 并断开连接，
 * 保证 WebSocket 与 WebRTC 连接不泄漏到下一页。</p>
 *
 * @author CH
 * @since 4.0.0.46
 */
import { computed, onBeforeUnmount, onMounted, watch } from "vue";
import { useRoute, useRouter } from "vue-router";
import { message } from "@repo/core";
// 自带样式：路由工厂可能被宿主直接深导入（不经过包根 index.ts），
// 因此把 CSS 挂在页面组件上，保证任何挂载方式都有一份样式。
import "../styles/room.css";
import { useRoomStore } from "../stores/room";
import { ConnectionState } from "../services/roomSocket";
import { WORKSPACE_LABELS, type Workspace, Workspace as W } from "../types/room";
import ChatWorkspace from "./ChatWorkspace.vue";
import FilesWorkspace from "./FilesWorkspace.vue";
import VideoWorkspace from "./VideoWorkspace.vue";
import VoiceWorkspace from "./VoiceWorkspace.vue";
import WatchWorkspace from "./WatchWorkspace.vue";
import CollaborateWorkspace from "./CollaborateWorkspace.vue";
import CanvasWorkspace from "./CanvasWorkspace.vue";
import StatusWorkspace from "./StatusWorkspace.vue";

const route = useRoute();
const router = useRouter();
const store = useRoomStore();

/** 当前选中的工作空间 */
const active = computed(() => store.workspace);

/** 连接是否活着（传输层） */
const connected = computed(() => store.connectionState === ConnectionState.OPEN);

/** 房间状态中文 */
function statusLabel(): string {
  const map: Record<string, string> = {
    idle: "未加入",
    connecting: "连接中",
    waiting: "等待加入",
    joined: "已加入",
    inviting: "邀请中",
    left: "已离开",
    disconnected: "连接断开",
  };
  return map[store.status] ?? store.status;
}

/** 房间状态徽标 */
function statusTone(): string {
  const s = store.status;
  return {
    idle: "",
    connecting: "is-warn",
    waiting: "is-warn",
    joined: "is-ok",
    inviting: "is-info",
    left: "",
    disconnected: "is-bad",
  }[s] ?? "is-warn";
}

/** 连接状态中文 */
function connectionLabel(): string {
  const map: Record<ConnectionState, string> = {
    [ConnectionState.IDLE]: "未连接",
    [ConnectionState.CONNECTING]: "连接中",
    [ConnectionState.OPEN]: "已连接",
    [ConnectionState.CLOSED]: "已断开",
  };
  return map[store.connectionState] ?? "未知";
}

/** 工作空间页签图标（Element Plus 中名） */
function workspaceIcon(w: Workspace): string {
  const map: Record<Workspace, string> = {
    [W.CHAT]: "ChatDotRound",
    [W.FILES]: "Folder",
    [W.VIDEO]: "VideoCamera",
    [W.VOICE]: "Microphone",
    [W.WATCH]: "Monitor",
    [W.COLLABORATE]: "EditPen",
    [W.CANVAS]: "Brush",
    [W.STATUS]: "List",
  };
  return map[w];
}

/** 切换工作空间 */
function switchWorkspace(w: Workspace): void {
  store.workspace = w;
}

/** 复制房间号 */
async function copyRoomId(): Promise<void> {
  if (!store.roomId) return;
  try {
    await navigator.clipboard.writeText(String(store.roomId));
    message.success("房间号已复制");
  } catch {
    message.warning("复制失败");
  }
}

/** 离开房间 */
function doLeave(): void {
  store.leaveRoom("user");
  router.push("/");
}

/** route query 里的 roomId 变化时重新加入（不刷新页面） */
watch(
  () => String(route.query.roomId ?? ""),
  (id) => {
    if (!id) return;
    store.joinRoom(id);
  },
);

onMounted(() => {
  // 注册下行信令（unbind 在卸载时调用）
  const unbind = store.bindSignals();
  // 进入页面时先连 Socket，再接入房间
  store.connect();
  const id = String(route.query.roomId ?? "");
  if (id) store.joinRoom(id);
  unmounted = unbind;
});

onBeforeUnmount(() => {
  // 卸载：离开房间 + 关闭连接 + 解绑信令
  store.leaveRoom("user");
  unmounted?.();
});

/** 存储 unbind（模块作用域可搜） */
let unmounted: (() => void) | undefined;
</script>

<template>
  <div class="rm-page">
    <!-- 顶部工具条 -->
    <header class="rm-head">
      <span class="rm-title">
        <ReIcon name="Connection" :size="16" />
        P2P 房间
      </span>

      <!-- 连接状态 -->
      <span class="rm-pill">
        <span
          class="rm-dot"
          :class="{
            'is-ok': connected,
            'is-warn': !connected && store.connectionState !== ConnectionState.IDLE,
            'is-bad': !connected,
          }"
        />
        {{ connectionLabel() }}
      </span>

      <!-- 房间状态 -->
      <span class="rm-pill" :class="statusTone()">{{ statusLabel() }}</span>

      <!-- 房间号 -->
      <button v-if="store.roomId" type="button" class="rm-pill rm-mono" @click="copyRoomId" title="复制房间号">
        <span class="rm-ellipsis">{{ store.roomId }}</span>
      </button>

      <!-- 对端 -->
      <span v-if="store.peerId" class="rm-pill">
        对端 {{ store.peerId.slice(0, 8) }}
      </span>

      <span class="rm-spacer" />

      <!-- 操作 -->
      <template v-if="!store.roomId">
        <button type="button" class="rm-btn" :disabled="!connected" @click="store.joinRoom()">
          创建房间
        </button>
      </template>
      <template v-else>
        <button type="button" class="rm-btn" :disabled="!connected" @click="store.reconnect()">
          重连
        </button>
        <button type="button" class="rm-btn rm-btn--danger" :disabled="!connected" @click="doLeave">
          离开
        </button>
      </template>
    </header>

    <!-- 工作空间页签 -->
    <nav class="rm-tabs">
      <button
        v-for="w in Object.values(W)"
        :key="w"
        type="button"
        :class="{ on: active === w }"
        @click="switchWorkspace(w)"
      >
        <ReIcon :name="workspaceIcon(w)" :size="13" />
        {{ WORKSPACE_LABELS[w] }}
      </button>
    </nav>

    <!-- 工作区面板 -->
    <main class="rm-body">
      <ChatWorkspace v-if="active === W.CHAT" />
      <FilesWorkspace v-else-if="active === W.FILES" />
      <VideoWorkspace v-else-if="active === W.VIDEO" />
      <VoiceWorkspace v-else-if="active === W.VOICE" />
      <WatchWorkspace v-else-if="active === W.WATCH" />
      <CollaborateWorkspace v-else-if="active === W.COLLABORATE" />
      <CanvasWorkspace v-else-if="active === W.CANVAS" />
      <StatusWorkspace v-else-if="active === W.STATUS" />
    </main>
  </div>
</template>
