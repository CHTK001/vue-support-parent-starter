/**
 * 设备实时状态订阅
 *
 * <p>优先复用全局 socket 连接（SSE/WebSocket），订阅 `device` 模块的 `status` 事件；
 * 同时保留轮询兜底：负责校准分页总数与统计，失败时按 1→4→10 倍退避，
 * 避免后端不可达期间固定高频重试、把失败提示刷成噪音。</p>
 * <ul>
 *   <li>宿主未启用 socket 时，列表仍能定期刷新；</li>
 *   <li>socket 事件到达时立即更新单行，避免整页刷新；</li>
 *   <li>轮询负责校准分页总数与统计，弥补事件丢失。</li>
 * </ul>
 *
 * @author CH
 * @since 4.0.0.42
 */

import { computed, onMounted, onUnmounted } from 'vue'
import { useSocketService, type WsMessage } from '@repo/core'
import type { DeviceAlarmRealtimeEvent, DeviceStatusEvent } from '../types/device'

export interface UseDeviceRealtimeOptions {
  /** 收到设备状态事件 */
  onStatus?: (event: DeviceStatusEvent) => void
  /** 收到新告警事件（webhook 推送 / 平台自检入库） */
  onAlarm?: (event: DeviceAlarmRealtimeEvent) => void
  /**
   * 轮询/校准回调（重新拉取当前页）。
   *
   * <p>返回 {@code false} 表示本轮刷新失败：轮询按 {@link POLL_BACKOFF_STEPS} 退避
   * （如 30s 间隔下 30s→2min→5min），成功后复位；其余返回值视为成功。</p>
   */
  onRefresh?: () => unknown
  /** 轮询间隔，默认 15 秒 */
  pollInterval?: number
  /** 是否在挂载后立即刷新一次，默认 false（页面通常已自行首载） */
  immediate?: boolean
}

/** 轮询失败退避乘数：连续失败时 1x→4x→10x，成功一轮即复位到 1x */
const POLL_BACKOFF_STEPS = [1, 4, 10]

/**
 * 订阅设备实时状态
 *
 * @param options 回调与轮询配置
 */
export function useDeviceRealtime(options: UseDeviceRealtimeOptions) {
  const socket = useSocketService()
  let unsubscribeStatus: (() => void) | null = null
  let unsubscribeAlarm: (() => void) | null = null
  let timer: ReturnType<typeof setTimeout> | null = null
  /** 连续失败档位（0 起步，封顶在 POLL_BACKOFF_STEPS 最后一档），成功一轮即清零 */
  let pollFailures = 0

  /** 按当前退避档位排程下一轮轮询；onRefresh 返回 false 记一次失败（升档），否则复位 */
  function schedulePoll(): void {
    const base = options.pollInterval ?? 15000
    const factor = POLL_BACKOFF_STEPS[Math.min(pollFailures, POLL_BACKOFF_STEPS.length - 1)]
    timer = setTimeout(async () => {
      try {
        const ok = await options.onRefresh?.()
        pollFailures = ok === false ? Math.min(pollFailures + 1, POLL_BACKOFF_STEPS.length - 1) : 0
      } catch {
        pollFailures = Math.min(pollFailures + 1, POLL_BACKOFF_STEPS.length - 1)
      }
      schedulePoll()
    }, base * factor)
  }

  const mode = computed<'socket' | 'polling'>(() => (socket ? 'socket' : 'polling'))

  onMounted(() => {
    if (socket) {
      try {
        unsubscribeStatus = socket.subscribe('device', 'status', (msg: WsMessage) => {
          const data = msg?.data as DeviceStatusEvent | undefined
          if (!data || !data.deviceId) return
          options.onStatus?.(data)
        })
      } catch (err) {
        console.warn('[device] 订阅实时状态失败，回退轮询', err)
      }
      if (options.onAlarm) {
        try {
          unsubscribeAlarm = socket.subscribe('device', 'alarm', (msg: WsMessage) => {
            const data = msg?.data as DeviceAlarmRealtimeEvent | undefined
            if (!data || !data.alarmId) return
            options.onAlarm?.(data)
          })
        } catch (err) {
          console.warn('[device] 订阅实时告警失败', err)
        }
      }
    }
    if (options.immediate) {
      options.onRefresh?.()
    }
    schedulePoll()
  })

  onUnmounted(() => {
    unsubscribeStatus?.()
    unsubscribeAlarm?.()
    if (timer) {
      clearTimeout(timer)
      timer = null
    }
  })

  return { mode }
}
