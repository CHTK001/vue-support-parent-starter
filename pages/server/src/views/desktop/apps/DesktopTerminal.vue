<!--
  /**
   * 虚拟桌面 · 终端窗口
   *
   * <p>直接复用后端静态页 {@code /ssh-direct.html}：页面里是 xterm + 平台自研的
   * SSH 直连 WebSocket 桥（PTY、resize、断线重连都由它负责），这里只负责
   * 组装带主机与令牌的 URL，并把 iframe 铺满窗口。断链由桥自己重试，
   * 所以这里不提供「重连」按钮，避免手动重建会话造成 PTY 漂移。</p>
   *
   * <p>刻意不做「窗口最小化就销毁」：最小化只是隐藏，PTY 会话必须保住，
   * 否则用户切回来就是一条已经断掉的终端。</p>
   */
  -->
<template>
  <div class="dt">
    <div class="dt__bar">
      <span class="dt__host">{{ hostLabel }}</span>
      <span class="dt__spacer" />
      <button type="button" class="dt__btn" title="在新标签页单独打开" @click="popout">
        <ReIcon name="TopRight" :size="12" />
      </button>
    </div>
    <iframe :src="src" class="dt__frame" title="SSH 终端" />
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { getAccessToken } from "@repo/utils";

const props = withDefaults(
  defineProps<{
    /** 主机标识 */
    hostId: number;
    /** 主机名，用于标题栏 */
    hostName?: string;
    /** 登录身份，空表示默认凭据 */
    identityId?: number | null;
    /** 窗口是否处于激活态（父级透传，这里只用于样式） */
    active?: boolean;
  }>(),
  { hostName: "", identityId: null, active: false },
);

/** 终端页地址：主机 + 身份 + 令牌 */
const src = computed(() => {
  const q = new URLSearchParams({ hostId: String(props.hostId) });
  if (props.identityId != null) {
    q.set("identityId", String(props.identityId));
  }
  const token = getAccessToken();
  if (token) {
    q.set("x-oauth-token", token);
  }
  return `/ssh-direct.html?${q.toString()}`;
});

const hostLabel = computed(() => props.hostName || `主机 #${props.hostId}`);

/**
 * 在新标签页打开同一条终端（用于把终端摆到第二块屏幕）。
 */
function popout(): void {
  window.open(src.value, "_blank");
}
</script>

<style scoped>
.dt {
  display: flex;
  flex-direction: column;
  height: 100%;
  min-height: 0;
  background: #101014;
}

.dt__bar {
  display: flex;
  flex: none;
  align-items: center;
  gap: 8px;
  height: 28px;
  padding: 0 10px;
  font-size: 11.5px;
  color: #b9b4c2;
  background: #191720;
  border-bottom: 1px solid rgba(255, 255, 255, 0.06);
}

.dt__host {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.dt__spacer {
  flex: 1;
}

.dt__btn {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  height: 20px;
  padding: 0 7px;
  font-size: 11px;
  color: #cfc9da;
  cursor: pointer;
  background: rgba(255, 255, 255, 0.06);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 5px;
}

.dt__btn:hover {
  color: #fff;
  background: rgba(233, 84, 32, 0.24);
  border-color: rgba(233, 84, 32, 0.45);
}

.dt__frame {
  flex: 1;
  width: 100%;
  min-height: 0;
  background: #101014;
  border: 0;
}
</style>
