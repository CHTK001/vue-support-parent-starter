/**
 * 设备实时状态订阅
 *
 * <p>优先复用全局 socket 连接（SSE/WebSocket），订阅 `device` 模块的 `status` 事件；
 * 同时保留 15s 轮询兜底。</p>
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
import type { DeviceStatusEvent } from '../types/device'

export interface UseDeviceRealtimeOptions {
  /** 收到设备状态事件 */
  onStatus?: (event: DeviceStatusEvent) => void
  /** 轮询/校准回调（重新拉取当前页） */
  onRefresh?: () => void
  /** 轮询间隔，默认 15 秒 */
  pollInterval?: number
  /** 是否在挂载后立即刷新一次，默认 false（页面通常已自行首载） */
  immediate?: boolean
}

/**
 * 订阅设备实时状态
 *
 * @param options 回调与轮询配置
 */
export function useDeviceRealtime(options: UseDeviceRealtimeOptions) {
  const socket = useSocketService()
  let unsubscribe: (() => void) | null = null
  let timer: ReturnType<typeof setInterval> | null = null

  const mode = computed<'socket' | 'polling'>(() => (socket ? 'socket' : 'polling'))

  onMounted(() => {
    if (socket) {
      try {
        unsubscribe = socket.subscribe('device', 'status', (msg: WsMessage) => {
          const data = msg?.data as DeviceStatusEvent | undefined
          if (!data || !data.deviceId) return
          options.onStatus?.(data)
        })
      } catch (err) {
        console.warn('[device] 订阅实时状态失败，回退轮询', err)
      }
    }
    if (options.immediate) {
      options.onRefresh?.()
    }
    timer = setInterval(() => options.onRefresh?.(), options.pollInterval ?? 15000)
  })

  onUnmounted(() => {
    unsubscribe?.()
    if (timer) {
      clearInterval(timer)
      timer = null
    }
  })

  return { mode }
}
