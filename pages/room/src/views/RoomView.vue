<script setup lang="ts">
/**
 * P2P 房间工作台
 *
 * <p>壳：顶部工具条（房间号 / 加入状态 / 连接状态徽标 / 断开）+ 工作空间页签
 * （聊天 / 文件 / 视频 / 语音 / 观看 / 协作 / 画板 / 状态）+ 工作区面板。
 * 连接与信令状态机由 {@code @pages/room/stores} 承载，各空间只读写自己的状态。</p>
 *
 * <p>进入页面时先连 Socket，再发 hello 加入房间（路由 query 的
 * {@code roomId} 直接进房，没有则创建空房间）；离开时 leave 并断开连接，
 * 保证 WebSocket 与 WebRTC 连接不泄漏到下一页。</p>
 *
 * <p><b>两种挂载方式</b>：</p>
 * <ul>
 *   <li>独立路由（{@code /room}）：读路由 query 的 roomId，离开时跳回首页；</li>
 *   <li>{@code embedded}（嵌进「服务管理」页的工作区页签）：房间是服务侧能力，
 *       不单独占菜单。此时房间号由父级 {@code roomId} prop 传入，离开只发
 *       {@code leave} 事件，不操纵路由。</li>
 * </ul>
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
import { ConnectionState, roomSocket } from "../services/roomSocket";
import { WORKSPACE_LABELS, type Workspace, Workspace as W } from "../types/room";
import ChatWorkspace from "./ChatWorkspace.vue";
import FilesWorkspace from "./FilesWorkspace.vue";
import VideoWorkspace from "./VideoWorkspace.vue";
import VoiceWorkspace from "./VoiceWorkspace.vue";
import WatchWorkspace from "./WatchWorkspace.vue";
import CollaborateWorkspace from "./CollaborateWorkspace.vue";
import CanvasWorkspace from "./CanvasWorkspace.vue";
import StatusWorkspace from "./StatusWorkspace.vue";

const props = withDefaults(
  defineProps<{
    /** 嵌入模式：房间号由父级传入，离开时不操纵路由 */
    embedded?: boolean;
    /** 嵌入模式下要加入的房间号（空则停在「创建房间」） */
    roomId?: string;
    /** 信令服务基地址（服务管理里的 ROOM 节点地址；空则用当前站点同端口） */
    serverUrl?: string;
  }>(),
  { embedded: false, roomId: "", serverUrl: "" },
);

const emit = defineEmits<{
  /** 嵌入模式下用户点了「离开」：由父级决定是否关闭工作区页签 */
  (e: "leave"): void;
}>();

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

/** 离开房间：独立路由下回首页，嵌入时交给父级收页签 */
function doLeave(): void {
  store.leaveRoom("user");
  if (props.embedded) emit("leave");
  else router.push("/");
}

/** 要加入的房间号：嵌入看 prop，独立路由看 query */
function targetRoomId(): string {
  return props.embedded ? String(props.roomId ?? "") : String(route.query.roomId ?? "");
}

/** 房间号变化时重新加入（独立路由看 query，嵌入看 prop） */
watch(targetRoomId, (id) => {
  if (!id) return;
  store.joinRoom(id);
});

/**
 * 信令地址变化时重新对准。
 *
 * <p>深链（{@code ?roomId=}）先开页签、节点列表后到的场景下，页签的 serverUrl
 * 会从空补成真实节点地址；只改 prop 不会重建已挂载的 {@link RoomView}，旧的
 * WebSocket 仍指着宿主端口，症状是页面永远停在「连接中」。这里在地址真的变化时
 * 断开旧连接、按新地址重连并回到房间。</p>
 */
watch(
  () => props.serverUrl,
  (url) => {
    roomSocket.setBaseUrl(url);
    const next = roomSocket.getBaseUrl();
    if (next === appliedBase) return;
    appliedBase = next;
    const rid = store.roomId || targetRoomId();
    roomSocket.disconnect();
    store.connect();
    if (rid) store.joinRoom(rid);
  },
);

onMounted(() => {
  // 注册下行信令（unbind 在卸载时调用）
  const unbind = store.bindSignals();
  // 房间节点是独立端口：先把信令基地址指到节点，再连接
  const previousBase = roomSocket.getBaseUrl();
  roomSocket.setBaseUrl(props.serverUrl);
  appliedBase = roomSocket.getBaseUrl();
  // 进入页面时先连 Socket，再接入房间
  store.connect();
  const id = targetRoomId();
  if (id) store.joinRoom(id);
  unmounted = unbind;
  restoreBase = () => roomSocket.setBaseUrl(previousBase);
});

onBeforeUnmount(() => {
  // 卸载：离开房间 + 关闭连接 + 解绑信令，并恢复上级站点地址
  store.leaveRoom("user");
  unmounted?.();
  restoreBase?.();
});

/** 恢复进入前的信令基地址 */
let restoreBase: (() => void) | undefined;

/** 当前已应用的信令基地址（serverUrl 变化时用来判断是否需要重连） */
let appliedBase = "";

/** 存储 unbind（模块作用域可搜） */
let unmounted: (() => void) | undefined;
</script>

<template>
  <div class="rm-page" :class="{ 'rm-page--embedded': props.embedded }">
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
