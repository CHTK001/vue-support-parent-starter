<!--
  /**
   * 虚拟桌面 · 终端窗口
   *
   * <p>直接复用后端静态页 {@code /ssh-direct.html}：页面里是 xterm + 平台自研的
   * SSH 直连 WebSocket 桥（PTY、resize、断线重连都由它负责），这里只负责
   * 把 iframe 铺满窗口。断链由桥自己重试，所以这里不提供「重连」按钮，
   * 避免手动重建会话造成 PTY 漂移。</p>
   *
   * <p>「在新标签页打开」只保留标题栏那一个按钮（由桌面壳统一提供）：
   * 窗口里再放一个同样的按钮就是重复入口，谁也不知道两个有什么区别。</p>
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
      <span class="dt__hint">断线由 SSH 桥自动重连</span>
    </div>
    <iframe :src="src" class="dt__frame" title="SSH 终端" />
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { terminalFrameUrl } from "../urls";

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

/** 终端页地址：主机 + 身份 + 令牌（与标题栏的「在新标签页打开」同一条） */
const src = computed(() => terminalFrameUrl(props.hostId, props.identityId));

const hostLabel = computed(() => props.hostName || `主机 #${props.hostId}`);
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

.dt__hint {
  flex: none;
  font-size: 10.5px;
  color: #7e7889;
}

.dt__frame {
  flex: 1;
  width: 100%;
  min-height: 0;
  background: #101014;
  border: 0;
}
</style>
