<script setup lang="ts">
/**
 * 沉浸式远程终端组件（Guacamole 隧道）
 *
 * 支持 SSH / RDP / VNC 协议，通过 guacd 隧道实现远程控制台，
 * 提供重连/断开/全屏/缩放与监控告警条。
 * @author CH
 * @since 4.0.0
 */
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from "vue";
import Guacamole from "guacamole-common-js";
import ReIcon from "@repo/ui/re-icon";
import ReSelect from "@repo/ui/re-select";
import ReTag from "@repo/ui/re-tag";
import { buildTerminalWsUrl } from "@pages/server/src/api";
import { createScGuacTunnel } from "@pages/server/src/components/ScGuacTunnel";
import type { AlarmEvent, MonitorItem } from "../monitorApi";

const props = defineProps<{
  connection: {
    hostId: number;
    hostName: string;
    protocol: string;
    identityId?: number | null;
    targetPort?: number | null;
  } | null;
  monitors?: MonitorItem[];
  alarms?: AlarmEvent[];
}>();

const monOpen = ref(false);

const statusText = ref("未连接");
const hasError = ref(false);
const displayRef = ref<HTMLElement | null>(null);
const shellRef = ref<HTMLElement | null>(null);

let client: InstanceType<typeof Guacamole.Client> | null = null;
let keyboard: InstanceType<typeof Guacamole.Keyboard> | null = null;
let mouse: InstanceType<typeof Guacamole.Mouse> | null = null;
let resizeObserver: ResizeObserver | null = null;

watch(
  () => props.connection,
  conn => {
    teardown();
    if (conn) {
      nextTick(() => connect(conn));
    }
  },
);

/**
 * 建立 Guacamole 连接
 * @param conn 连接配置（主机/协议/身份/端口）
 */
function connect(conn: NonNullable<typeof props.connection>): void {
  hasError.value = false;
  statusText.value = "正在连接…";
  if (!displayRef.value) return;

  const tunnel = createScGuacTunnel(
    buildTerminalWsUrl(conn.hostId, conn.protocol, conn.identityId ?? null, conn.targetPort ?? null),
  );
  client = new Guacamole.Client(tunnel);

  tunnel.onstatechange = (state: number) => {
    if (state === Guacamole.Tunnel.State.OPEN) statusText.value = "已连接";
    else if (state === Guacamole.Tunnel.State.CLOSED) statusText.value = "已断开";
  };
  tunnel.onerror = (status: { message?: string }) => {
    hasError.value = true;
    statusText.value = `连接失败: ${status.message ?? "未知错误"}`;
  };

  const el = client.getDisplay().getElement();
  if (!el || !displayRef.value) {
    hasError.value = true;
    statusText.value = "渲染层未就绪";
    return;
  }
  el.style.width = "100%";
  el.style.height = "100%";
  displayRef.value.innerHTML = "";
  displayRef.value.appendChild(el);

  resizeObserver = new ResizeObserver(entries => {
    for (const entry of entries) {
      const { width, height } = entry.contentRect;
      if (width > 0 && height > 0) {
        client?.sendSize(Math.round(width), Math.round(height));
      }
    }
  });
  resizeObserver.observe(displayRef.value);

  // 注意：Guacamole.Keyboard 的 onkeydown/onkeyup 回调参数就是 keysym 数值本身
  // （见 guacamole-common.js press()/release()：guac_keyboard.onkeydown(keysym)），
  // 不是 { keysym } 对象——写成 keysym.keysym 会恒为 undefined，按键静默丢失。
  keyboard = new Guacamole.Keyboard(document as unknown as HTMLElement);
  // 焦点在页面输入控件（左栏搜索框等）时不转发按键，避免本地输入串进远程终端
  const typingInLocalInput = (): boolean => {
    const el = document.activeElement as HTMLElement | null;
    if (!el) return false;
    const tag = el.tagName;
    return tag === "INPUT" || tag === "TEXTAREA" || el.isContentEditable;
  };
  keyboard.onkeydown = (keysym: Guacamole.Keysym) => {
    if (typingInLocalInput()) return true;
    client?.sendKeyEvent(true, keysym.keysym);
  };
  keyboard.onkeyup = (keysym: Guacamole.Keysym) => {
    if (typingInLocalInput()) return true;
    client?.sendKeyEvent(false, keysym.keysym);
  };

  // 点击终端区时把焦点从页面输入控件移走（headless/部分浏览器点 canvas 不触发失焦，
  // 焦点滞留搜索框会导致按键全部被上面的隔离守卫拦掉）。
  // 注意：绑定走模板 @mousedown（见 it-display），组件内 addEventListener 不可靠。

  mouse = new Guacamole.Mouse(el);
  mouse.onmousedown = (state: Guacamole.MouseState) => client?.sendMouseState(state);
  mouse.onmouseup = (state: Guacamole.MouseState) => client?.sendMouseState(state);
  mouse.onmousemove = (state: Guacamole.MouseState) => client?.sendMouseState(state);

  client.connect();
}

/** ReButton「重试」：原样重连当前会话 */
function reconnect(): void {
  if (!props.connection) return;
  teardown();
  nextTick(() => props.connection && connect(props.connection));
}

/** ReButton「断开」：主动断开隧道并回到就绪态 */
function disconnect(): void {
  teardown();
  statusText.value = "已手动断开";
}

/** 切换全屏状态 */
function fullscreen(): void {
  const el = shellRef.value;
  if (!el) return;
  if (document.fullscreenElement) {
    document.exitFullscreen();
  } else {
    el.requestFullscreen?.();
  }
}

/** 终端显示缩放（字体大小），默认 100%，调小=字小，调大=字大 */
const zoomPct = ref(100);
const zoomOptions = computed(() => [
  { label: "75%", value: 75 },
  { label: "90%", value: 90 },
  { label: "100%", value: 100 },
  { label: "125%", value: 125 },
  { label: "150%", value: 150 },
]);
/**
 * 应用终端缩放比例
 * @param pct 缩放百分比
 */
function applyZoom(pct: number): void {
  zoomPct.value = pct;
  if (client) {
    const display = (client as any);
    if (display && typeof display.getDisplay === "function") {
      const gd = display.getDisplay();
      if (gd && typeof gd.scale === "function") gd.scale(pct / 100);
    }
  }
}

/** 终端区按下：把焦点从页面输入控件移走，保证按键进入远程终端 */
function blurLocalInput(): void {
  const el = document.activeElement as HTMLElement | null;
  if (el && (el.tagName === "INPUT" || el.tagName === "TEXTAREA")) el.blur();
  // 终端区已设 tabindex="0"，显式接管焦点，后续按键必走 Guacamole.Keyboard
  displayRef.value?.focus();
}

/**
 * document 捕获阶段监听：点击终端区一律先失焦本地输入框。
 * 之前用模板 @mousedown 绑定在 .it-display 上，headless 下点 canvas 时
 * 该绑定不生效（焦点滞留搜索框，按键全被隔离守卫拦掉）；捕获阶段在
 * document 上拦截则不依赖目标元素内部的事件传播，实测可靠。
 */
/**
 * document 捕获阶段监听：点击终端区一律先失焦本地输入框。
 * @param e 鼠标按下事件
 */
function onDocMousedownCapture(e: MouseEvent): void {
  const target = e.target as HTMLElement | null;
  if (target && target.closest(".it-display")) blurLocalInput();
}

onMounted(() => document.addEventListener("mousedown", onDocMousedownCapture, true));
onBeforeUnmount(() => document.removeEventListener("mousedown", onDocMousedownCapture, true));

/** 拆除连接资源（键盘/鼠标/渲染层/客户端） */
function teardown(): void {
  try { keyboard?.reset(); client?.disconnect(); } catch { /* ignore */ }
  resizeObserver?.disconnect();
  resizeObserver = null;
  keyboard = null;
  mouse = null;
  client = null;
  if (displayRef.value) displayRef.value.innerHTML = "";
  statusText.value = "未连接";
  hasError.value = false;
}

onBeforeUnmount(teardown);
</script>

<template>
  <div ref="shellRef" class="it-shell">
    <div class="it-toolbar">
      <div class="it-title">
        <ReIcon name="Monitor" />
        <span>{{ connection?.hostName ?? "远程控制台" }}</span>
        <span
          v-if="connection"
          :class="['it-proto-badge', `p-${connection.protocol}`]"
        >{{ connection.protocol.toUpperCase() }}</span>
        <ReTag
          v-if="connection"
          :type="hasError ? 'danger' : statusText === '已连接' ? 'success' : 'info'"

        >
          {{ statusText }}
        </ReTag>
      </div>
      <div v-if="connection" class="it-actions">
        <!-- 字体/缩放 -->
        <ReSelect v-model="zoomPct" :options="zoomOptions" style="width:86px" @change="applyZoom($event)" class="zoom-sel" />
        <!-- ReButton：icon 走 ReIcon 统一渲染（design.md §2 / §4.8） -->
        <ReButton icon="RefreshRight" show-text class="reb" @click="reconnect">重连</ReButton>
        <ReButton icon="FullScreen" show-text class="reb" @click="fullscreen">全屏</ReButton>
        <ReButton icon="SwitchButton" show-text type="danger" plain class="reb" @click="disconnect">断开</ReButton>
      </div>
    </div>
    <div v-if="connection" class="it-monstrip">
      <button class="reb reb-sm" data-test="mon-toggle" @click="monOpen = !monOpen">
        <ReIcon name="DataLine" :size="13" />
        <span>监控 {{ monitors?.length ?? 0 }} · 告警 {{ alarms?.length ?? 0 }}</span>
        <ReIcon :name="monOpen ? 'ArrowUp' : 'ArrowDown'" :size="12" />
      </button>
      <span class="it-mon-hint">{{ (monitors?.length ?? 0) === 0 ? "该主机暂无监控项" : "" }}</span>
    </div>
    <div v-if="connection && monOpen" class="it-monpanel">
      <div v-if="(monitors?.length ?? 0) === 0" class="it-mon-empty">
        该资产尚未配置监控项 —— 在监控端为该 IP 建监控项后自动关联
      </div>
      <template v-else>
        <div v-for="m in monitors" :key="'m' + m.id" class="it-mon-row">
          <span :class="['it-mon-dot', m.monitorEnabled === 1 ? 'on' : 'off']" />
          <span class="it-mon-name">{{ m.monitorName }}</span>
          <span class="it-mon-meta">{{ m.monitorHost }}:{{ m.monitorPort }} · {{ m.serviceType || "SERVER" }}</span>
          <span class="it-mon-tag">{{ m.monitorEnabled === 1 ? "启用" : "停用" }}</span>
        </div>
        <div v-for="a in alarms" :key="'a' + a.id" :class="['it-alarm-row', `lv-${(a.msMonitorAlarmEventLevel || 'P3').toLowerCase()}`]">
          <span class="it-alarm-level">{{ a.msMonitorAlarmEventLevel || "P?" }}</span>
          <span class="it-alarm-text">
            {{ a.msMonitorAlarmEventMetricName }}
            <b>{{ a.msMonitorAlarmEventAlarmValue }}</b>
            &gt; 阈值 {{ a.msMonitorAlarmEventThreshold }}
          </span>
          <span class="it-alarm-status">{{ a.msMonitorAlarmEventStatus }}</span>
          <span class="it-alarm-time">{{ a.msMonitorAlarmEventTriggerTime }}</span>
        </div>
      </template>
    </div>
    <div class="it-body">
      <div v-if="!connection" class="it-empty">
        <ReIcon name="Monitor" :size="48" color="var(--text-tertiary)" />
        <div class="it-empty-title">从左侧选择一台资产开始控制</div>
        <div class="it-empty-desc">沉浸式控制台 · guacd 隧道 · 支持 SSH / RDP / VNC</div>
      </div>
      <div v-show="connection && !hasError" ref="displayRef" tabindex="0" class="it-display" @mousedown="blurLocalInput" />
      <div v-if="connection && hasError" class="it-error">
        <ReIcon name="Monitor" :size="40" color="var(--status-error)" />
        <div class="it-error-title">连接失败</div>
        <div class="it-error-desc">{{ statusText }}</div>
        <div class="it-error-actions">
          <ReButton icon="RefreshRight" show-text type="primary" @click="reconnect">重试</ReButton>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
/* ReButton：方角(≤2px) + 恒带图标 —— 监控/控制台默认按钮 */
.reb {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  height: 30px;
  padding: 0 10px;
  font-size: 12px;
  font-weight: 600;
  color: var(--el-text-color-regular);
  background: var(--el-bg-color);
  border: 1px solid var(--el-border-color);
  border-radius: 2px;
  cursor: pointer;
  transition: all 0.15s ease;
  user-select: none;
  &:hover {
    color: var(--el-color-primary);
    border-color: var(--el-color-primary-light-5);
    background: var(--el-color-primary-light-9);
  }
  &:active {
    transform: translateY(1px);
  }
  &.reb-primary {
    color: var(--text-inverse);
    background: var(--brand-500);
    border-color: var(--brand-500);
    &:hover {
      color: var(--text-inverse);
      background: var(--brand-600);
      border-color: var(--brand-600);
    }
  }
  &.reb-danger {
    color: var(--status-error);
    border-color: color-mix(in srgb, var(--status-error) 30%, transparent);
    background: color-mix(in srgb, var(--status-error) 8%, transparent);
    &:hover {
      color: var(--text-inverse);
      background: var(--status-error);
      border-color: var(--status-error);
    }
  }
  &.reb-sm {
    height: 26px;
    padding: 0 8px;
    font-size: 12px;
  }
}

/* 监控条 + 监控面板 */
.it-monstrip {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 16px;
  background: var(--el-bg-color);
  border-bottom: 1px solid var(--el-border-color-lighter);
  flex-shrink: 0;
}
.it-mon-hint {
  font-size: 12px;
  color: var(--el-text-color-placeholder);
}
.it-monpanel {
  max-height: 240px;
  padding: 8px 16px;
  overflow: auto;
  background: var(--el-bg-color);
  border-bottom: 1px solid var(--el-border-color-lighter);
  flex-shrink: 0;
}
.it-mon-empty {
  padding: 12px 0;
  font-size: 13px;
  color: var(--el-text-color-secondary);
}
.it-mon-row,
.it-alarm-row {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 7px 10px;
  margin-bottom: 4px;
  font-size: 13px;
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 2px;
}
.it-mon-dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  flex-shrink: 0;
  &.on { background: var(--pulse-online); }
  &.off { background: var(--pulse-offline); }
}
.it-mon-name {
  font-weight: 600;
}
.it-mon-meta {
  flex: 1;
  color: var(--el-text-color-secondary);
  font-family: monospace;
  font-size: 12px;
}
.it-mon-tag {
  font-size: 11px;
  color: var(--el-color-primary);
}
.it-alarm-level {
  padding: 0 6px;
  font-size: 11px;
  font-weight: 700;
  font-family: monospace;
  border-radius: 2px;
}
.it-alarm-row.lv-p0 .it-alarm-level, .it-alarm-row.lv-p1 .it-alarm-level {
  color: var(--text-inverse);
  background: var(--status-error);
}
.it-alarm-row.lv-p2 .it-alarm-level {
  color: var(--text-inverse);
  background: var(--metric-disk);
}
.it-alarm-text {
  flex: 1;
  b { color: var(--metric-redis); }
}
.it-alarm-status {
  font-size: 11px;
  color: var(--text-tertiary);
}
.it-alarm-time {
  font-size: 11px;
  color: var(--text-tertiary);
  font-family: monospace;
}

.it-shell {
  display: flex;
  flex-direction: column;
  width: 100%;
  height: 100%;
  background: var(--el-bg-color-page);
}
.it-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 52px;
  padding: 0 16px;
  background: var(--el-bg-color);
  border-bottom: 1px solid var(--el-border-color-lighter);
  flex-shrink: 0;
}
.it-title {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 15px;
  font-weight: 600;
  color: var(--el-text-color-primary);
}
.it-proto-badge {
  padding: 1px 6px;
  font-size: 10px;
  font-weight: 700;
  font-family: monospace;
  border-radius: 2px;
  letter-spacing: 0.5px;
  &.p-ssh {
    color: var(--proto-ssh);
    background: color-mix(in srgb, var(--proto-ssh) 10%, transparent);
  }
  &.p-rdp {
    color: var(--proto-rdp);
    background: color-mix(in srgb, var(--proto-rdp) 10%, transparent);
  }
  &.p-vnc {
    color: var(--proto-vnc);
    background: color-mix(in srgb, var(--proto-vnc) 10%, transparent);
  }
}
.it-actions {
  display: flex;
  align-items: center;
  gap: 8px;
}
.it-body {
  position: relative;
  flex: 1;
  min-height: 0;
  padding: 12px;
  overflow: hidden;
}
.it-display {
  width: 100%;
  height: 100%;
  background: var(--terminal-bg);
  border-radius: 4px;
  overflow: auto;
  outline: none; /* tabindex 焦点环不显示，视觉无变化 */
  :deep(canvas) {
    margin: 0 auto;
    display: block;
  }
}
.it-empty,
.it-error {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
  color: var(--el-text-color-secondary);
  gap: 12px;
}
.it-error-title {
  font-size: 16px;
  font-weight: 600;
  color: var(--el-text-color-primary);
}
.it-error-desc {
  font-size: 13px;
  max-width: 60%;
  text-align: center;
  word-break: break-all;
}
.it-error-actions {
  margin-top: 6px;
}
.it-empty-title {
  font-size: 16px;
  font-weight: 600;
  color: var(--el-text-color-primary);
}
.it-empty-desc {
  font-size: 13px;
  color: var(--el-text-color-secondary);
}
</style>
