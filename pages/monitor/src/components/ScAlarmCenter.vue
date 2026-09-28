<template>
  <div class="alarm-center">
    <ReBadge :value="unreadCount" :max="99" :hidden="unreadCount === 0" :offset="[8, -4]" type="danger">
      <ReButton icon="Bell" layout="square" :type="unreadCount > 0 ? 'danger' : 'default'" tip="告警中心" @click="togglePanel" />
    </ReBadge>

    <Transition name="alarm-pop">
      <div v-if="panelVisible" class="alarm-panel">
        <div class="panel-head">
          <span class="panel-title">实时告警</span>
          <div class="panel-actions">
            <ReButton link @click="markAllRead">全部已读</ReButton>
            <ReButton link type="primary" @click="goAlarmPage">查看全部</ReButton>
          </div>
        </div>

        <div class="panel-body">
          <div v-if="liveAlarms.length === 0" class="panel-empty">
            <ReIcon name="Bell" :size="22" />
            <span>暂无告警</span>
          </div>
          <div v-for="alarm in liveAlarms" :key="alarm.key" class="alarm-item" @click="goAlarmPage">
            <span :class="['lv-tag', `lv-${alarm.level?.toLowerCase?.() ?? 'p2'}`]">{{ alarm.level ?? 'P2' }}</span>
            <div class="alarm-info">
              <div class="alarm-title">{{ alarm.monitorName }}</div>
              <div class="alarm-desc">{{ alarm.metricName }} = {{ alarm.alarmValue }} / 阈值 {{ alarm.threshold }}</div>
              <div class="alarm-time">{{ alarm.triggerTime }}</div>
            </div>
          </div>
        </div>
      </div>
    </Transition>
  </div>
</template>

<script setup lang="ts">
import { onBeforeUnmount, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useSocketService } from '@repo/core'

interface LiveAlarm {
  key: string
  id?: number
  monitorId?: number
  monitorName?: string
  metricName?: string
  alarmValue?: number
  threshold?: number
  level?: string
  triggerTime?: string
}

const router = useRouter()

/** 实时告警列表（最多保留 30 条） */
const liveAlarms = ref<LiveAlarm[]>([])
/** 未读数 */
const unreadCount = ref(0)
/** 面板显隐 */
const panelVisible = ref(false)

let counter = 0

const pushAlarm = (payload: any) => {
  const alarm: LiveAlarm = {
    key: `${Date.now()}-${counter++}`,
    id: payload.id,
    monitorId: payload.monitorId,
    monitorName: payload.monitorName || '未知目标',
    metricName: payload.metricName || '未知指标',
    alarmValue: payload.alarmValue,
    threshold: payload.threshold,
    level: payload.level ?? 'P2',
    triggerTime: payload.triggerTime || new Date().toLocaleString(),
  }
  liveAlarms.value.unshift(alarm)
  if (liveAlarms.value.length > 30) liveAlarms.value.length = 30
  unreadCount.value++
}

const unsubs: Array<() => void> = []

function initLivePush() {
  const socket = useSocketService()
  if (!socket) return
  unsubs.push(socket.subscribe("monitor", "alarm", (msg) => {
    const data = (msg.data ?? msg) as any
    const payload = data && typeof data === "object" ? (data.data ?? data) : data
    if (payload) pushAlarm(payload)
  }))
}

initLivePush()

const togglePanel = () => { panelVisible.value = !panelVisible.value }
const markAllRead = () => { unreadCount.value = 0 }

const goAlarmPage = () => {
  panelVisible.value = false
  router.push({ query: { tab: 'alarm' } })
}

onBeforeUnmount(() => unsubs.forEach(fn => fn?.()))
</script>

<style scoped>
.alarm-center { position: relative; }

.alarm-panel {
  position: absolute;
  top: calc(100% + 8px);
  right: 0;
  width: 320px;
  background: var(--el-bg-color-overlay, var(--el-bg-color));
  border: 1px solid var(--el-border-color-light);
  border-radius: var(--el-radius-lg, 12px);
  box-shadow: var(--el-box-shadow-light);
  z-index: 100;
  overflow: hidden;
  /* 浮层弹出属于微交互，用 0.2s（--el-transition-duration-fast 同值）；
     写 0.18s 是因为没人给「浮层入场」单独留令牌，值本身没问题，只是失去可调性 */
  animation: alarm-in 0.2s ease both;
}
@keyframes alarm-in { from { opacity: 0; transform: translateY(-6px); } to { opacity: 1; transform: none; } }

.panel-head {
  display: flex; align-items: center; justify-content: space-between;
  padding: 10px 14px;
  border-bottom: 1px solid var(--el-border-color-lighter);
}
.panel-title { font-size: 13px; font-weight: 600; color: var(--el-text-color-primary); }
.panel-actions { display: flex; gap: 4px; }

.panel-body { max-height: 360px; overflow-y: auto; }

.panel-empty {
  display: flex; flex-direction: column; align-items: center; gap: 8px;
  padding: 32px 0; color: var(--el-text-color-secondary); font-size: 12px;
}

/* div + @click 承担列表项跳转语义：去掉浏览器默认轮廓，改用自绘焦点环 */
.alarm-item {
  display: flex; gap: 10px; align-items: flex-start;
  padding: 10px 14px; cursor: pointer;
  outline: none;
  transition: background-color var(--el-transition-duration-fast, 0.2s);
  border-bottom: 1px solid var(--el-border-color-lighter);
}
.alarm-item:hover { background: var(--el-fill-color-light); }
.alarm-item:focus-visible {
  box-shadow: inset 0 0 0 2px var(--el-color-primary);
}
/* :focus-within 让面板内的 ReButton（全部已读 / 查看全部）键盘聚焦时，
   整条目的底色也抬起来，避免焦点环被 hover 底色吃掉对比 */
.alarm-item:focus-within { background: var(--el-fill-color-light); }

.lv-tag {
  flex-shrink: 0; min-width: 30px; text-align: center;
  padding: 2px 6px; border-radius: var(--el-radius-xs, 4px);
  font-size: 11px; font-weight: 700;
}
.lv-p0, .lv-p1 { background: color-mix(in srgb, var(--el-color-danger) 12%, transparent); color: var(--el-color-danger); }
.lv-p2, .lv-p3 { background: color-mix(in srgb, var(--el-color-warning) 12%, transparent); color: var(--el-color-warning); }
.lv-p4 { background: color-mix(in srgb, var(--el-color-info) 12%, transparent); color: var(--el-color-info); }

.alarm-info { flex: 1; min-width: 0; }
.alarm-title { font-size: 12.5px; font-weight: 600; color: var(--el-text-color-primary); }
.alarm-desc { font-size: 11.5px; color: var(--el-text-color-regular); margin-top: 2px; font-variant-numeric: tabular-nums; }
.alarm-time { font-size: 10.5px; color: var(--el-text-color-secondary); margin-top: 3px; }

/* 尊重系统「减少动态效果」偏好 */
@media (prefers-reduced-motion: reduce) {
  .alarm-panel {
    animation: none;
  }
  .alarm-item {
    transition: none;
  }
}
</style>
