<script setup lang="ts">
/**
 * 状态空间（P2P 房间状态与信令日志）
 *
 * <p>展示当前房间的连接状态、对端信息、状态机流转与底层信令日志，不发起任何
 * 修改操作（只读面板），供调试与观察房间生命周期使用。</p>
 *
 * <p>状态机：<code>idle → connecting → waiting → joined → left /
 * disconnected</code>；传输层连接状态由 {@code store.connectionState} 承载，两者
 * 要分开看。</p>
 *
 * @author CH
 * @since 4.0.0.46
 */
import { computed, ref } from "vue";
import { useRoomStore } from "../stores/room";
import { ConnectionState } from "../services/roomSocket";
import { type RoomStatus, RoomStatus as RS } from "../types/room";

const store = useRoomStore();

/** 收缩/展开详情（默认展开） */
const collapsed = ref(false);

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

/** 连接状态徽标 */
function connectionTone(): string {
  const s = store.connectionState;
  return s === ConnectionState.OPEN ? "is-ok" : s === ConnectionState.IDLE ? "" : "is-bad";
}

/** 房间状态中文 */
function statusLabel(): string {
  const map: Record<RoomStatus, string> = {
    [RS.IDLE]: "未加入",
    [RS.CONNECTING]: "连接中",
    [RS.WAITING]: "等待加入",
    [RS.JOINED]: "已加入",
    [RS.INVITING]: "邀请中",
    [RS.LEFT]: "已离开",
    [RS.DISCONNECTED]: "连接断开",
  };
  return map[store.status] ?? store.status;
}

/** 房间状态徽标 */
function statusTone(): string {
  const s = store.status;
  return {
    [RS.IDLE]: "",
    [RS.CONNECTING]: "is-warn",
    [RS.WAITING]: "is-warn",
    [RS.JOINED]: "is-ok",
    [RS.INVITING]: "is-info",
    [RS.LEFT]: "",
    [RS.DISCONNECTED]: "is-bad",
  }[s] ?? "is-warn";
}

/** 约数：按时间戳排序的信令日志（只读） */
const logs = computed(() => {
  const items: { time: number; text: string; tone?: string }[] = [];
  if (store.connected) items.push({ time: Date.now(), text: "传输层已连接" });
  if (store.inRoom) items.push({ time: Date.now(), text: `在房内（${statusLabel()}）` });
  return items;
});

/** 自身标识 */
const me = computed(() => store.slotId);

</script>

<template>
  <div class="rm-workspace">
    <div class="rm-pane rm-pane--full">
      <div class="rm-pane-head">
        <ReIcon name="List" :size="14" />
        <b>状态</b>
        <span class="rm-spacer" />
        <button type="button" class="rm-btn rm-btn--sm" @click="collapsed = !collapsed">
          {{ collapsed ? "展开" : "收起" }}
        </button>
      </div>

      <div class="rm-pane-body">
        <div v-if="!store.connected" class="rm-empty">
          <b>未连接</b>
          <span>加入房间后，状态面板会显示完整信息</span>
        </div>

        <dl v-else class="rm-grid">
          <div class="rm-grid__item">
            <dt>传输层连接</dt>
            <dd>
              <span class="rm-pill">
                <span class="rm-dot" :class="connectionTone()" />
                {{ connectionLabel() }}
              </span>
            </dd>
          </div>

          <div class="rm-grid__item">
            <dt>房间状态</dt>
            <dd>
              <span class="rm-pill" :class="statusTone()">{{ statusLabel() }}</span>
            </dd>
          </div>

          <div class="rm-grid__item">
            <dt>房间号</dt>
            <dd>
              <code class="rm-mono">{{ store.roomId ?? "-" }}</code>
            </dd>
          </div>

          <div class="rm-grid__item">
            <dt>自身标识</dt>
            <dd>
              <code class="rm-mono">{{ me ?? "-" }}</code>
            </dd>
          </div>

          <div class="rm-grid__item">
            <dt>对端标识</dt>
            <dd>
              <code class="rm-mono">{{ store.peerId ?? "-" }}</code>
            </dd>
          </div>

          <div class="rm-grid__item">
            <dt>房间内</dt>
            <dd>{{ store.inRoom }}</dd>
          </div>
        </dl>

        <div v-if="store.peerId" class="rm-section">
          <h5 class="rm-section__title">
            <ReIcon name="User" :size="12" />
            对端会话
          </h5>
          <div class="rm-list">
            <div v-for="p in store.peers" :key="p.peerId" class="rm-list__item">
              <span class="rm-mono">{{ p.peerId }}</span>
              <span class="rm-pill" :class="p.connected ? 'is-ok' : 'is-bad'">
                {{ p.connected ? "在线" : "掉线" }}
              </span>
            </div>
          </div>
        </div>

        <div v-if="collapsed" class="rm-section">
          <h5 class="rm-section__title">
            <ReIcon name="Document" :size="12" />
            状态机流转
          </h5>
          <div class="rm-status">
            <div class="rm-status__step" :class="{ done: true }">
              <span class="rm-status__step-title">idle 未加入</span>
            </div>
            <div class="rm-status__step" :class="store.status === RS.IDLE ? 'current' : ''">
              <span class="rm-status__step-title">connecting 连接中</span>
            </div>
            <div class="rm-status__step" :class="store.status === RS.WAITING ? 'current' : ''">
              <span class="rm-status__step-title">waiting 等待加入</span>
            </div>
            <div class="rm-status__step" :class="store.status === RS.INVITING ? 'current' : ''">
              <span class="rm-status__step-title">inviting 邀请中</span>
            </div>
            <div class="rm-status__step" :class="store.status === RS.JOINED ? 'current' : ''">
              <span class="rm-status__step-title">joined 已加入</span>
            </div>
            <div class="rm-status__step" :class="store.status === RS.LEFT ? 'current' : ''">
              <span class="rm-status__step-title">left 已离开</span>
            </div>
            <div class="rm-status__step" :class="store.status === RS.DISCONNECTED ? 'current' : ''">
              <span class="rm-status__step-title">disconnected 连接断开</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.rm-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 8px;
  margin-bottom: 12px;
}

.rm-grid__item {
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 10px 12px;
  background: color-mix(in srgb, var(--el-color-info, #3b82f6) 4%, transparent);
  border: 1px solid color-mix(in srgb, var(--el-color-info, #3b82f6) 18%, transparent);
  border-radius: 4px;
}

.rm-grid__item dt {
  margin: 0;
  font-size: 12px;
  line-height: 1.5;
  color: var(--el-text-color-regular, rgba(0, 0, 0, 0.65));
}

.rm-grid__item dd {
  margin: 0;
  font-size: 14px;
  line-height: 1.5;
  color: var(--el-text-color-primary, rgba(0, 0, 0, 0.88));
}

.rm-mono {
  font-family: var(--el-font-family-code, Consolas, Monov, monospace);
  font-size: 13px;
  color: var(--el-text-color-regular, rgba(0, 0, 0, 0.65));
  background: var(--el-fill-color-blank, #ffffff);
  border-radius: 2px;
}

.rm-section + .rm-section {
  margin-top: 12px;
}

.rm-section__title {
  display: flex;
  align-items: center;
  gap: 4px;
  margin: 0 0 8px;
  font-size: 13px;
  line-height: 1.8;
  font-weight: 600;
  color: var(--el-text-color-regular, rgba(0, 0, 0, 0.65));
}

.rm-list {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.rm-list__item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 10px;
  background: var(--el-fill-color-blank, #ffffff);
  border: 1px solid var(--el-border-color-lighter, #e8eef6);
  border-radius: 4px;
}

.rm-status {
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 8px 0;
}

.rm-status__step {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 5px 8px;
  font-size: 12px;
  line-height: 1.5;
  color: var(--el-text-color-placeholder, #9aa3af);
  background: var(--el-fill-color-blank, #ffffff);
  border-radius: 3px;
}

.rm-status__step .rm-status__step-title {
  font-size: 12px;
  line-height: 1.5;
  color: var(--el-text-color-placeholder, #9aa3af);
}

.rm-status__step.done {
  color: var(--el-text-color-regular, rgba(0, 0, 0, 0.65));
}

.rm-status__step.done .rm-status__step-title {
  color: var(--el-text-color-regular, rgba(0, 0, 0, 0.65));
}

.rm-status__step.current {
  color: var(--el-text-color-primary, rgba(0, 0, 0, 0.88));
  background: color-mix(in srgb, var(--el-color-primary, #3b82f6) 8%, transparent);
}

.rm-status__step.current .rm-status__step-title {
  color: var(--el-text-color-primary, rgba(0, 0, 0, 0.88));
}
</style>
