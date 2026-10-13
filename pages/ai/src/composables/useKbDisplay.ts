import { ref } from 'vue'
import { apiService } from '@/services/ApiService'

/**
 * 右侧内容区显示宽度偏好（会话 / 设置中心 / 知识库等页面的主内容列）。
 *
 * <p>取值 {@code narrow}（固定舒适阅读宽度 ~820px，居中）/ {@code full}
 * （内容区撑满剩余空间，适合宽屏阅读长内容）。作用于：</p>
 * <ul>
 *   <li>会话页：消息流与输入框列（MessageStream / MessageComposer）；</li>
 *   <li>设置中心：设置卡片列（SystemSettings 非宽表格页签）；</li>
 *   <li>知识库详情页：右侧问答栏（{@code data-kb-ask}，原有消费方）。</li>
 * </ul>
 *
 * <p>持久化走 {@code appearance} 分组按用户覆盖层，字段名 {@code kbAskPanelWidth}
 * 与后端 sys_setting / sys_ai_user_setting 的真实字段一致（曾经误用 {@code askWidth}，
 * 写到的是无定义的幻影字段，跨设备不生效）；本地 localStorage 作为后端不可用时的回退。</p>
 */
export type KbAskWidth = 'narrow' | 'full'

const APPEARANCE_GROUP = 'appearance'
/** 后端 appearance 分组的真实字段名（sys_setting 种子值 = full），必须逐字一致 */
const ASK_WIDTH_FIELD = 'kbAskPanelWidth'
const LOCAL_KEY = 'kb.askWidth'

const askWidth = ref<KbAskWidth>('full')
let initialized = false

function readStored(): KbAskWidth | null {
  try {
    const v = localStorage.getItem(LOCAL_KEY)
    return v === 'narrow' || v === 'full' ? v : null
  } catch {
    return null
  }
}

function writeStored(v: KbAskWidth): void {
  try {
    localStorage.setItem(LOCAL_KEY, v)
  } catch {
    // 忽略存储失败（隐私模式等）
  }
}

/**
 * 初始化：读取 appearance 分组中「右侧问答栏宽度」对当前用户生效的值。
 *
 * <p>幂等，可重复调用。读取失败时回落到本地存储，再回落到默认 {@code full}。</p>
 */
export async function initKbDisplay(): Promise<void> {
  if (initialized) return
  initialized = true

  try {
    const response = await apiService.fetchMergedGroupSettings(APPEARANCE_GROUP)
    const items = response?.data ?? response
    let found: string | undefined
    if (Array.isArray(items)) {
      const hit = items.find((i: any) => i?.field === ASK_WIDTH_FIELD)
      found = hit?.value
    } else if (items && typeof items === 'object') {
      const flat = items as Record<string, any>
      const raw = flat[ASK_WIDTH_FIELD]
      found = raw && typeof raw === 'object' ? raw.value : raw
    }
    if (found === 'narrow' || found === 'full') {
      askWidth.value = found
      writeStored(found)
      return
    }
  } catch (e) {
    console.warn('[useKbDisplay] 读取 appearance 设置失败，使用本地回退', e)
  }

  const stored = readStored()
  if (stored) askWidth.value = stored
}

/** 在 setup 中调用，返回问答栏宽度响应式值及其设置器。 */
export function useKbDisplay() {
  /**
   * 切换问答栏宽度。
   *
   * <p>本地先生效（ref 是单例，知识库页通过 data-kb-ask 立刻响应），
   * 落库失败不阻塞 UI：用户已看到效果，为一次网络抖动回滚反而更糟。
   * 返回 false 仅表示持久化失败，由调用方提示一次（见 DisplaySettings 注释）。
   */
  async function setKbAskWidth(v: KbAskWidth): Promise<boolean> {
    askWidth.value = v
    writeStored(v)
    try {
      await apiService.updateUserGroupOverrides(APPEARANCE_GROUP, { [ASK_WIDTH_FIELD]: v })
      return true
    } catch (e) {
      console.warn('[useKbDisplay] 持久化问答栏宽度失败', e)
      return false
    }
  }

  return { askWidth, setKbAskWidth }
}
