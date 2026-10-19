<template>
  <div class="sc-vnc">
    <div v-if="connection" class="sc-vnc__bar">
      <span class="sc-vnc__status" :class="`is-${state}`">
        <i class="sc-vnc__dot" />
        {{ statusText || 'VNC 直连' }}
      </span>
      <div class="sc-vnc__actions">
        <button v-if="state === 'error'" class="sc-vnc__btn" type="button" @click="connect">
          <ReIcon name="el-icon-Refresh" />
          <span>重连</span>
        </button>
        <button v-if="!hideClose" class="sc-vnc__btn" type="button" @click="emit('close')">
          <ReIcon name="el-icon-SwitchButton" />
          <span>断开</span>
        </button>
      </div>
    </div>
    <div ref="screenRef" class="sc-vnc__screen" :class="{ 'is-ready': !!connection }">
      <span v-if="!connection" class="sc-vnc__placeholder">请选择目标主机后发起 VNC 连接</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref, watch } from 'vue';
import RFB from '@novnc/novnc';
import { getSocketToken } from '@repo/core';
import { getVncCredential } from '../api';
import type { SpecialKeyStep } from './specialKeys';

type VncConnection = {
  hostId: number;
  hostName: string;
  protocol: string;
  identityId?: number | null;
  targetPort?: number | null;
} | null;

const props = defineProps<{ connection: VncConnection; hideClose?: boolean }>();
const emit = defineEmits<{
  (e: 'close'): void;
  (e: 'disconnected', reason: string): void;
}>();

const screenRef = ref<HTMLDivElement>();
const state = ref<'idle' | 'connecting' | 'connected' | 'error'>('idle');
const statusText = ref('');

let rfb: any = null;
let credential = { username: '', password: '' };

function buildWsUrl(hostId: number, identityId?: number | null): string {
  const proto = location.protocol === 'https:' ? 'wss:' : 'ws:';
  const qs = new URLSearchParams({ hostId: String(hostId) });
  if (identityId != null) {
    qs.set('identityId', String(identityId));
  }
  // 浏览器 WebSocket 握手不能带自定义头，后端 OAuth 过滤器支持从查询参数
  // 取 x-oauth-token；不带时 /ws/ms/server/terminal/vnc 一律 403。
  const token = getSocketToken();
  if (token) qs.set('x-oauth-token', token);
  return `${proto}//${location.host}/ws/ms/server/terminal/vnc?${qs.toString()}`;
}

function teardown() {
  if (rfb) {
    try {
      rfb.disconnect();
    } catch {
      // ignore
    }
    rfb = null;
  }
}

async function connect() {
  const conn = props.connection;
  if (!conn || !screenRef.value) {
    return;
  }
  teardown();
  state.value = 'connecting';
  statusText.value = '正在获取 VNC 凭据…';
  try {
    credential = await getVncCredential(conn.hostId, conn.identityId);
  } catch (e: any) {
    state.value = 'error';
    statusText.value = `凭据获取失败：${e?.message ?? e}`;
    return;
  }

  statusText.value = `正在连接 ${conn.hostName}…`;
  try {
    rfb = new RFB(screenRef.value, buildWsUrl(conn.hostId, conn.identityId), {
      credentials: { username: credential.username, password: credential.password, target: '' },
      shared: true,
    });
    // 自适应：远程帧缩放到容器，不主动改远端分辨率
    rfb.scaleViewport = true;
    rfb.clipViewport = true;
    rfb.resizeSession = false;
    rfb.showDotCursor = true;

    rfb.addEventListener('connect', () => {
      state.value = 'connected';
      statusText.value = `${conn.hostName} · 已连接（右键可呼出桌面菜单）`;
    });
    rfb.addEventListener('disconnect', (ev: any) => {
      const clean = ev?.detail?.clean;
      state.value = 'error';
      statusText.value = clean ? '远程桌面已断开' : '连接中断（VNC 服务是否可达）';
      emit('disconnected', statusText.value);
    });
    rfb.addEventListener('credentialsrequired', () => {
      rfb.sendCredentials({
        username: credential.username,
        password: credential.password,
        target: '',
      });
    });
    rfb.addEventListener('securityfailure', (ev: any) => {
      state.value = 'error';
      statusText.value = `认证/安全失败：${ev?.detail?.reason ?? '口令错误或安全类型不支持'}`;
    });
  } catch (e: any) {
    state.value = 'error';
    statusText.value = `连接失败：${e?.message ?? e}`;
  }
}

/**
 * 下发特殊按键序列（本机 OS 截获、键盘无法透传的组合键）
 *
 * Ctrl+Alt+Del 走 noVNC 内置 {@code sendCtrlAltDel}（携带正确扫描码，
 * 触发远端 Windows 安全注意序列）；其余组合先全部按下、再逆序松开。
 *
 * @param keys 按键序列
 */
function sendSpecialKey(keys: SpecialKeyStep[]): void {
  if (!rfb || !keys?.length) {
    return;
  }
  const isCtrlAltDel =
    keys.length === 3 &&
    keys[0]?.keysym === 0xffe3 &&
    keys[1]?.keysym === 0xffe9 &&
    keys[2]?.keysym === 0xffff;
  if (isCtrlAltDel && typeof rfb.sendCtrlAltDel === 'function') {
    rfb.sendCtrlAltDel();
    return;
  }
  for (const k of keys) {
    rfb.sendKey(k.keysym, k.code, true);
  }
  window.setTimeout(() => {
    for (let i = keys.length - 1; i >= 0; i--) {
      rfb?.sendKey(keys[i].keysym, keys[i].code, false);
    }
  }, 60);
}

onMounted(connect);
watch(
  () => props.connection,
  () => {
    void connect();
  },
);
onBeforeUnmount(teardown);
defineExpose({ disconnect: teardown, sendSpecialKey });
</script>

<style scoped>
.sc-vnc {
  display: flex;
  flex-direction: column;
  height: 100%;
  min-height: 0;
  flex: 1;
}

.sc-vnc__bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 8px 12px;
  border-bottom: 1px solid var(--el-border-color-lighter);
  background: var(--el-bg-color);
  flex-shrink: 0;
}

.sc-vnc__status {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  font-size: 13px;
  color: var(--el-text-color-regular);
  min-width: 0;
}

.sc-vnc__dot {
  width: 8px;
  height: 8px;
  border-radius: var(--el-radius-full, 9999px);
  background: var(--el-text-color-disabled);
  flex-shrink: 0;
}

.sc-vnc__status.is-connecting .sc-vnc__dot {
  background: var(--el-color-warning);
  animation: sc-vnc-pulse 1s ease-in-out infinite;
}

.sc-vnc__status.is-connected .sc-vnc__dot {
  background: var(--el-color-success);
}

.sc-vnc__status.is-error .sc-vnc__dot {
  background: var(--el-color-danger);
}

.sc-vnc__actions {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  flex-shrink: 0;
}

.sc-vnc__btn {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  height: 28px;
  padding: 0 11px;
  font-size: 12px;
  color: var(--el-text-color-regular);
  background: var(--el-fill-color-light);
  border: 1px solid var(--el-border-color);
  border-radius: var(--el-radius-xs, 4px);
  cursor: pointer;
  /* 原生 button：去掉浏览器默认轮廓，改用全站统一的自绘焦点环 */
  outline: none;
  /* 原来写 transition: all 0.15s ease：all 会把布局属性也纳入过渡，
     0.15s 也不是任何标准档。显式列出三个真正会变的属性并取 0.2s 档 */
  transition:
    color var(--el-transition-duration-fast, 0.2s) ease,
    border-color var(--el-transition-duration-fast, 0.2s) ease,
    background-color var(--el-transition-duration-fast, 0.2s) ease;
}
/* 原生 button：自绘焦点环 */
.sc-vnc__btn:focus-visible {
  box-shadow: 0 0 0 3px color-mix(in srgb, var(--el-color-primary) 12%, transparent);
}

.sc-vnc__btn:hover {
  color: var(--el-color-primary);
  border-color: var(--el-color-primary-light-5);
  background: var(--el-color-primary-light-9);
}

.sc-vnc__screen {
  position: relative;
  flex: 1;
  min-height: 0;
  /* 刻意保留纯黑 #000：这是 VNC 远控画面画布，帧缓冲自带任意颜色，
     垫底色若跟随主题变浅会在画面边缘留一圈亮边 */
  background: #000;
  overflow: hidden;
}

.sc-vnc__screen.is-ready {
  /* 原为 var(--el-border-radius-base)（EP 定义为 4px），统一到 koi 最小圆角档 xs */
  border-radius: 0 0 var(--el-radius-xs, 4px) var(--el-radius-xs, 4px);
}

.sc-vnc__screen :deep(canvas) {
  outline: none;
}

.sc-vnc__placeholder {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--el-text-color-secondary);
  font-size: 13px;
  pointer-events: none;
}

@keyframes sc-vnc-pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.35; }
}

/* 尊重系统「减少动态效果」偏好 */
@media (prefers-reduced-motion: reduce) {
  .sc-vnc__btn {
    transition: none;
  }
  /* 连接中点的呼吸闪烁可以停：「连接中」这个状态本来就由点的黄色底色表达，
     呼吸只是附加动效，不是唯一信息 */
  .sc-vnc__status.is-connecting .sc-vnc__dot {
    animation: none;
  }
}
</style>
