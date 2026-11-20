// stores/session.ts
import { defineStore } from 'pinia'
import { ref, computed, type Ref } from 'vue'
import type { Session, SessionState, SessionSettings, QueuedMessage } from '@/types/session'
import { randomUuid } from '@/utils/clientId'
import { listChatContext, removeChatContext, saveChatContext } from '@repo/utils'
import { useAuthStore } from './auth'

/**
 * 未分组的默认分组ID（虚拟ID，不对应后端实体）
 */
export const UNGROUPED_ID = '__ungrouped__'

/**
 * 会话状态 Store
 * 采用 "单一 Map + 分组视图" 架构，sessionsMap 是所有会话的唯一数据源
 */
export const useSessionStore = defineStore('session', () => {
    // 状态
    const activeSessionId: Ref<string | null> = ref(null)

    /**
     * 所有会话的唯一数据源 Map<sessionId, Session>
     * 取代旧的 sessionsList，按 ID 索引便于快速查找和更新
     */
    const sessionsMap: Ref<Map<string, Session>> = ref(new Map())

    /**
     * 兼容旧代码：基于 sessionsMap 的计算属性，按 lastActiveAt 降序排列
     */
    const sessionsList = computed((): Session[] => {
        return Array.from(sessionsMap.value.values()).sort((a, b) => {
            const timeA = new Date(a.lastActiveAt || a.updatedAt || 0).getTime()
            const timeB = new Date(b.lastActiveAt || b.updatedAt || 0).getTime()
            return timeB - timeA
        })
    })

    /**
     * 每个分组已加载的会话数量 Map<groupId, count>
     */
    const loadedCounts: Ref<Map<string, number>> = ref(new Map())

    /**
     * 每个分组是否还有更多会话 Map<groupId, boolean>
     */
    const hasMoreMap: Ref<Map<string, boolean>> = ref(new Map())

    const sessions: Ref<Map<string, SessionState>> = ref(new Map())

    // 会话侧边栏状态（未读 / 工作中）
    const sessionSidebarStates: Ref<Map<string, { unread: boolean; working: boolean }>> = ref(new Map())

    /** 各会话运行开始时间（毫秒），前端计算实时耗时的起点 */
    const workingStartAt: Ref<Map<string, number>> = ref(new Map())

    /**
     * 各会话最近一次完成的运行耗时（毫秒）。
     * 流式结束（会话完成）时结算并记录到浏览器 localStorage，停止后灰显。
     */
    const lastRunMs: Ref<Map<string, number>> = ref(new Map())

    /** localStorage 键：最近运行耗时（浏览器持久化） */
    const RUN_DURATION_KEY = 'ai-session.last-run-ms'

    const loadRunDurations = (): void => {
        try {
            const raw = window.localStorage.getItem(RUN_DURATION_KEY)
            if (!raw) return
            const parsed = JSON.parse(raw) as Record<string, unknown>
            for (const [id, ms] of Object.entries(parsed)) {
                if (typeof ms === 'number' && ms >= 0) lastRunMs.value.set(id, ms)
            }
        } catch { /* 本地数据损坏时忽略，下次写入会覆盖 */ }
    }

    const saveRunDurations = (): void => {
        try {
            const obj: Record<string, number> = {}
            for (const [id, ms] of lastRunMs.value.entries()) obj[id] = ms
            window.localStorage.setItem(RUN_DURATION_KEY, JSON.stringify(obj))
        } catch { /* 隐私模式/存储满：静默降级为仅内存态 */ }
    }

    /**
     * 排队消息的本地保留期。
     *
     * <p>队列会在下次打开会话时被消费（见 ChatPanel 的 resumeQueuedMessagesOnLoad）。
     * 若无限期保留，几个月前排队的内容会在某次打开时突然发出去，还白扣一轮 token，
     * 故超过 7 天直接丢弃。</p>
     */
    const QUEUE_TTL_MS = 7 * 24 * 60 * 60 * 1000

    /**
     * 排队消息落盘：加密 IndexedDB（@repo/utils 的 chatContext，AES 加密后写入），
     * 不再明文躺 localStorage。内存缓存保住「同步读」的原有语义，变更写穿透回加密库。
     */
    const QUEUE_NAMESPACE = 'queue'
    /** 旧版 localStorage 明文键前缀：仅用于一次性迁移，迁完即删 */
    const LEGACY_QUEUE_KEY_PREFIX = 'ai-session.queue.'

    /** 排队消息的账号隔离主体（同一浏览器多账号互不串） */
    const queueOwner = (): string | null => useAuthStore().user?.username ?? null

    /**
     * 内存缓存：sessionId -> 排队消息。
     *
     * <p>启动时从加密库一次性水合（hydrateQueues），之后读写都先走这块缓存；
     * ChatPanel 的恢复判定（resumeQueuedMessagesOnLoad）是同步读队列，
     * 不能等异步 IDB，所以这里必须常驻内存。</p>
     */
    const queueCache = new Map<string, QueuedMessage[]>()

    /** 一批排队消息的合法化：非字符串内容的条目丢弃，status 一律归位 queued */
    const sanitizeQueueItems = (items: unknown): QueuedMessage[] => {
        if (!Array.isArray(items)) return []
        return items
            .filter((item: any) => item && typeof item.content === 'string')
            .map((item: any) => ({ ...item, status: 'queued' as const }))
    }

    /**
     * 启动水合：把本机加密库里该账号的全部排队消息读进内存缓存。
     *
     * <p>旧版把排队消息明文存在 localStorage（ai-session.queue.<id>），这里做一次性
     * 迁移：读到明文键 → 并入缓存 → 后续由 saveQueue 写加密库 → 删除明文键。
     * 超过 TTL 的记录直接丢弃（连同加密库里的旧记录一起清掉）。</p>
     */
    const hydrateQueues = async (): Promise<void> => {
        const owner = queueOwner()
        /** 合并结果：sessionId -> { items, savedAt }；同会话后读到的覆盖先读到的 */
        const merged = new Map<string, { items: QueuedMessage[]; savedAt: number }>()
        // 1) 旧版明文键迁移（登录前可能落在匿名分组，一并收进来，避免升级即丢消息）
        try {
            for (let i = window.localStorage.length - 1; i >= 0; i--) {
                const storageKey = window.localStorage.key(i)
                if (!storageKey || !storageKey.startsWith(LEGACY_QUEUE_KEY_PREFIX)) continue
                const sessionId = storageKey.slice(LEGACY_QUEUE_KEY_PREFIX.length)
                try {
                    const parsed = JSON.parse(window.localStorage.getItem(storageKey) || '') as { savedAt?: number; items?: QueuedMessage[] }
                    if (parsed && typeof parsed.savedAt === 'number') {
                        const items = sanitizeQueueItems(parsed.items)
                        if (items.length) merged.set(sessionId, { items, savedAt: parsed.savedAt })
                    }
                } catch { /* 明文键损坏：当作没有 */ }
                window.localStorage.removeItem(storageKey)
            }
        } catch { /* 隐私模式等读不了 localStorage：跳过迁移 */ }
        // 2) 加密库：当前账号 + 匿名分组（历史遗留）都收，同会话当前账号优先
        const owners = owner ? [null, owner] : [null]
        for (const ownerName of owners) {
            try {
                const stored = await listChatContext<{ savedAt?: number; items?: QueuedMessage[] }>(ownerName, QUEUE_NAMESPACE)
                for (const entry of stored) {
                    if (!entry.value || typeof entry.value.savedAt !== 'number') continue
                    const items = sanitizeQueueItems(entry.value.items)
                    if (items.length) merged.set(entry.key, { items, savedAt: entry.value.savedAt })
                }
            } catch { /* 加密库不可用：用明文迁移结果兜底 */ }
        }
        // 3) TTL 过滤 + 落缓存 + 回填已存在的会话状态 + 清理过期记录
        const now = Date.now()
        for (const [sessionId, entry] of merged) {
            if (now - entry.savedAt > QUEUE_TTL_MS) {
                void removeChatContext({ owner, namespace: QUEUE_NAMESPACE, key: sessionId }).catch(() => undefined)
                continue
            }
            queueCache.set(sessionId, entry.items)
            const state = sessions.value.get(sessionId)
            // 仅在会话内存队列还是空的时候回填：用户先入队、水合后到时以内存为准
            if (state && state.messageQueue.length === 0) {
                state.messageQueue.splice(0, state.messageQueue.length, ...entry.items)
            }
        }
    }
    void hydrateQueues()

    /**
     * 读取会话的排队消息（同步：读内存缓存，数据来自启动水合 + 后续写穿透）。
     *
     * @param sessionId 会话 ID
     * @returns 未过期的排队消息（TTL 在水合时已过滤）；没有时返回空数组
     */
    const loadQueue = (sessionId: string): QueuedMessage[] => {
        return queueCache.get(sessionId) ?? []
    }

    /**
     * 把会话的排队消息写回加密库（写穿透，异步不阻塞）；队列清空时删记录。
     *
     * @param sessionId 会话 ID
     */
    const saveQueue = (sessionId: string): void => {
        try {
            const items = getSessionState(sessionId).messageQueue
            if (!items.length) {
                queueCache.delete(sessionId)
                void removeChatContext({ owner: queueOwner(), namespace: QUEUE_NAMESPACE, key: sessionId }).catch(() => undefined)
                return
            }
            const snapshot = items.map((item) => ({ ...item }))
            queueCache.set(sessionId, snapshot)
            void saveChatContext(
                { owner: queueOwner(), namespace: QUEUE_NAMESPACE, key: sessionId },
                { savedAt: Date.now(), items: snapshot },
            ).catch(() => { /* 隐私模式/存储满：仅内存态，下次写入再试 */ })
        } catch { /* 静默降级为仅内存态 */ }
    }

    loadRunDurations()

    /**
     * 获取或初始化会话状态
     * @param sessionId - 会话 ID
     */
    const getSessionState = (sessionId: string): SessionState => {
        if (!sessions.value.has(sessionId)) {
            sessions.value.set(sessionId, {
                messages: [],
                isStreaming: false,
                isCompressing: false,
                inputMessage: {
                    content: '',
                    files: [],
                    isWaiting: false,
                },
                scrollPosition: 0,
                lastUpdated: Date.now(),
                settings: {
                },
                // 队列落盘在加密 IndexedDB（chatContext）：刷新/重启后由启动水合恢复，由 ChatPanel 决定何时消费
                messageQueue: loadQueue(sessionId),
            })
        }
        return sessions.value.get(sessionId)!
    }

    /**
     * 批量设置会话列表（用于初始化加载）
     * @param list - 会话列表
     */
    const setChatSidebar = (list: Session[]): void => {
        for (const session of list) {
            sessionsMap.value.set(session.id, session)
        }
    }

    /**
     * 添加或更新单个会话
     * @param session - 会话对象
     */
    const setSession = (session: Session): void => {
        sessionsMap.value.set(session.id, session)
    }

    /**
     * 根据 ID 获取会话
     * @param sessionId - 会话 ID
     */
    const getSession = (sessionId: string): Session | undefined => {
        return sessionsMap.value.get(sessionId)
    }

    /**
     * 移除会话
     * @param sessionId - 会话 ID
     */
    const removeSession = (sessionId: string): void => {
        sessionsMap.value.delete(sessionId)
    }

    /**
     * 按分组获取会话列表（已按 lastActiveAt 降序排序）
     * 自动排除已归档会话（archived === true）
     * @param groupId - 分组ID，null 表示未分组
     */
    const getSessionsByGroup = (groupId: string | null): Session[] => {
        const targetGroupId = groupId === UNGROUPED_ID ? null : groupId
        return Array.from(sessionsMap.value.values())
            .filter(s => (s.groupId || null) === targetGroupId && !s.archived && s.sessionType !== 'bot' && s.sessionType !== 'sub_agent')
            .sort((a, b) => {
                const timeA = new Date(a.lastActiveAt || a.updatedAt || 0).getTime()
                const timeB = new Date(b.lastActiveAt || b.updatedAt || 0).getTime()
                return timeB - timeA
            })
    }

    /**
     * 获取指定分组的会话总数
     * @param groupId - 分组ID
     */
    const getGroupTotal = (groupId: string | null): number => {
        const targetGroupId = groupId === UNGROUPED_ID ? null : groupId
        return Array.from(sessionsMap.value.values())
            .filter(s => (s.groupId || null) === targetGroupId && s.sessionType !== 'bot' && s.sessionType !== 'sub_agent').length
    }

    /**
     * 移动会话到指定分组
     * @param sessionId - 会话 ID
     * @param targetGroupId - 目标分组ID（null 或 UNGROUPED_ID 表示未分组）
     */
    const moveSession = (sessionId: string, targetGroupId: string | null): void => {
        const session = sessionsMap.value.get(sessionId)
        if (session) {
            session.groupId = targetGroupId === UNGROUPED_ID ? null : targetGroupId
        }
    }

    /**
     * 更新会话分组ID
     * @param sessionId - 会话 ID
     * @param groupId - 新分组ID
     */
    const setSessionGroupId = (sessionId: string, groupId: string | null): void => {
        const session = sessionsMap.value.get(sessionId)
        if (session) {
            session.groupId = groupId
        }
    }

    /**
     * 更新分组已加载数量
     * @param groupId - 分组ID
     * @param count - 已加载数量
     */
    const setLoadedCount = (groupId: string, count: number): void => {
        loadedCounts.value.set(groupId, count)
    }

    /**
     * 获取分组已加载数量
     * @param groupId - 分组ID
     */
    const getLoadedCount = (groupId: string): number => {
        return loadedCounts.value.get(groupId) ?? 0
    }

    /**
     * 更新分组是否还有更多会话
     * @param groupId - 分组ID
     * @param hasMore - 是否还有更多
     */
    const setHasMore = (groupId: string, hasMore: boolean): void => {
        hasMoreMap.value.set(groupId, hasMore)
    }

    /**
     * 获取分组是否还有更多会话
     * @param groupId - 分组ID
     */
    const groupHasMore = (groupId: string): boolean => {
        return hasMoreMap.value.get(groupId) ?? true
    }

    /**
     * 获取消息列表
     * @param sessionId - 会话 ID
     */
    const getMessages = (sessionId: string): any[] => {
        return getSessionState(sessionId).messages
    }

    /**
     * 添加消息
     * @param sessionId - 会话 ID
     * @param message - 消息对象
     */
    const addMessage = (sessionId: string, message: any): void => {
        const session = getSessionState(sessionId)
        session.messages.push(message)
        session.lastUpdated = Date.now()
    }

    /**
     * 设置消息列表
     * @param sessionId - 会话 ID
     * @param newMessages - 新消息列表
     */
    const setMessages = (sessionId: string, newMessages: any[]): void => {
        const session = getSessionState(sessionId)
        session.messages.splice(0, session.messages.length, ...newMessages)
        session.lastUpdated = Date.now()
    }

    /**
     * 在消息列表前部插入消息（用于加载历史消息）
     * @param sessionId - 会话 ID
     * @param newMessages - 要插入的消息列表
     */
    const prependMessages = (sessionId: string, newMessages: any[]): void => {
        const session = getSessionState(sessionId)
        session.messages.unshift(...newMessages)
        session.lastUpdated = Date.now()
    }

    /**
     * 获取最早的消息 ID（用于分页加载更早消息）
     * @param sessionId - 会话 ID
     * @returns 最早消息的 ID，如果没有则返回 null
     */
    const getEarliestMessageId = (sessionId: string): string | null => {
        const messages = getSessionState(sessionId).messages
        return messages.length > 0 ? messages[0].id : null
    }

    /**
     * 获取最新消息 ID
     * @param sessionId - 会话 ID
     * @returns 最新消息的 ID，如果没有则返回 null
     */
    const getLatestMessageId = (sessionId: string): string | null => {
        const messages = getSessionState(sessionId).messages
        return messages.length > 0 ? messages[messages.length - 1].id : null
    }

    /**
     * 删除消息
     * @param sessionId - 会话 ID
     * @param messageId - 消息 ID
     */
    const deleteMessage = (sessionId: string, messageId: string): void => {
        const session = getSessionState(sessionId)
        const index = session.messages.findIndex((m: any) => m.id === messageId)
        if (index !== -1) {
            session.messages.splice(index, 1)
            session.lastUpdated = Date.now()
        }
    }

    /**
     * 更新消息
     * @param sessionId - 会话 ID
     * @param messageId - 消息 ID
     * @param newMessage - 新消息数据
     */
    const updateMessage = (sessionId: string, messageId: string, newMessage: any): void => {
        const session = getSessionState(sessionId)
        const index = session.messages.findIndex((m: any) => m.id === messageId)
        if (index !== -1) {
            const message = session.messages[index]
            session.messages[index] = { ...message, ...newMessage }
            session.lastUpdated = Date.now()
        }
    }

    /**
     * 检查会话是否正在流式响应
     * @param sessionId - 会话 ID
     */
    const sessionIsStreaming = (sessionId: string): boolean => {
        return getSessionState(sessionId).isStreaming
    }

    /**
     * 结算一次运行：按运行起点算出耗时，记入 lastRunMs 并持久化到浏览器。
     * 没有起点（从未开始或已结算）时是空操作。
     * @param sessionId - 会话 ID
     */
    const settleRun = (sessionId: string): void => {
        const start = workingStartAt.value.get(sessionId)
        if (start == null) return
        const ms = Math.max(0, Date.now() - start)
        lastRunMs.value.set(sessionId, ms)
        saveRunDurations()
        workingStartAt.value.delete(sessionId)
    }

    /**
     * 设置会话流式状态，同时驱动运行计时：
     * 开始（点击发送）时起点重写为当前时刻——重新开启；
     * 结束时结算耗时并记录，停止后侧边栏灰显最近一次执行时间。
     * @param sessionId - 会话 ID
     * @param isStreaming - 是否正在流式响应
     */
    const setSessionIsStreaming = (sessionId: string, isStreaming: boolean): void => {
        getSessionState(sessionId).isStreaming = isStreaming
        if (isStreaming) {
            workingStartAt.value.set(sessionId, Date.now())
            setWorking(sessionId, true)
        } else {
            settleRun(sessionId)
            setWorking(sessionId, false)
        }
    }

    // === 消息队列操作 ===

    const enqueueMessage = (sessionId: string, msg: Omit<QueuedMessage, 'id' | 'createdAt' | 'status'>): string => {
        const state = getSessionState(sessionId)
        const item: QueuedMessage = {
            ...msg,
            // 不用裸调 crypto.randomUUID()：明文 HTTP + 局域网 IP 下它不存在
            // （非安全上下文），会抛 TypeError 中断整个入队流程
            id: randomUuid(),
            createdAt: Date.now(),
            status: 'queued',
        }
        state.messageQueue.push(item)
        saveQueue(sessionId)
        return item.id
    }

    const dequeueMessage = (sessionId: string): QueuedMessage | null => {
        const state = getSessionState(sessionId)
        if (state.messageQueue.length === 0) return null
        const item = state.messageQueue.shift()!
        saveQueue(sessionId)
        return item
    }

    const peekQueue = (sessionId: string): QueuedMessage | null => {
        const queue = getSessionState(sessionId).messageQueue
        return queue.length > 0 ? queue[0] : null
    }

    /**
     * 领取队列第一条，跨标签页安全。
     *
     * <p>重启后的自动发送走这里而不是直接 dequeue：先重读 localStorage 确认它
     * 仍是磁盘上的队首，再一起从磁盘与内存里移除。两个标签页同时恢复同一个会话时，
     * 只有真正读到队首的那个能把它拿走，另一个会把内存队列按磁盘重置后退出。</p>
     *
     * @param sessionId 会话 ID
     * @returns 领取到的消息；队列已空、已被别的标签页拿走或已过期时返回 null
     */
    const claimFirstQueuedMessage = (sessionId: string): QueuedMessage | null => {
        const state = getSessionState(sessionId)
        if (state.messageQueue.length === 0) return null
        const head = state.messageQueue[0]
        const onDisk = loadQueue(sessionId)
        if (!onDisk.length || onDisk[0].id !== head.id) {
            // 磁盘为准：别的标签页已经发掉了这一条，本页不能再发一遍
            state.messageQueue = onDisk
            saveQueue(sessionId)
            return null
        }
        state.messageQueue.shift()
        saveQueue(sessionId)
        return head
    }

    const getMessageQueue = (sessionId: string): QueuedMessage[] => {
        return getSessionState(sessionId).messageQueue
    }

    const removeQueuedMessage = (sessionId: string, msgId: string): void => {
        const state = getSessionState(sessionId)
        const idx = state.messageQueue.findIndex(m => m.id === msgId)
        if (idx !== -1) {
            state.messageQueue.splice(idx, 1)
        }
        saveQueue(sessionId)
    }

    const updateQueuedMessage = (sessionId: string, msgId: string, updates: Partial<QueuedMessage>): void => {
        const state = getSessionState(sessionId)
        const idx = state.messageQueue.findIndex(m => m.id === msgId)
        if (idx !== -1) {
            state.messageQueue[idx] = { ...state.messageQueue[idx], ...updates }
        }
        saveQueue(sessionId)
    }

    const reorderQueue = (sessionId: string, fromId: string, toId: string): void => {
        const state = getSessionState(sessionId)
        const fromIdx = state.messageQueue.findIndex(m => m.id === fromId)
        const toIdx = state.messageQueue.findIndex(m => m.id === toId)
        if (fromIdx === -1 || toIdx === -1 || fromIdx === toIdx) return
        
        const [moved] = state.messageQueue.splice(fromIdx, 1)
        state.messageQueue.splice(toIdx, 0, moved)
        saveQueue(sessionId)
    }

    /**
     * 提前发送：将指定消息移到队列最前面
     */
    const moveToFront = (sessionId: string, msgId: string): void => {
        const state = getSessionState(sessionId)
        const idx = state.messageQueue.findIndex(m => m.id === msgId)
        if (idx === -1 || idx === 0) return
        
        const [moved] = state.messageQueue.splice(idx, 1)
        state.messageQueue.unshift(moved)
        saveQueue(sessionId)
    }

    /**
     * 从队列中取出指定消息（手动发送时使用）
     */
    const removeFromQueue = (sessionId: string, msgId: string): QueuedMessage | null => {
        const state = getSessionState(sessionId)
        const idx = state.messageQueue.findIndex(m => m.id === msgId)
        if (idx === -1) return null
        
        const [removed] = state.messageQueue.splice(idx, 1)
        saveQueue(sessionId)
        return removed
    }

    const getQueueLength = (sessionId: string): number => {
        return getSessionState(sessionId).messageQueue.length
    }

    /**
     * 检查会话是否正在压缩历史
     * @param sessionId - 会话 ID
     */
    const sessionIsCompressing = (sessionId: string): boolean => {
        return getSessionState(sessionId).isCompressing
    }

    /**
     * 设置会话压缩状态
     * @param sessionId - 会话 ID
     * @param isCompressing - 是否正在压缩
     */
    const setSessionIsCompressing = (sessionId: string, isCompressing: boolean): void => {
        getSessionState(sessionId).isCompressing = isCompressing
    }

    /**
     * 获取输入消息
     * @param sessionId - 会话 ID
     */
    const getInputMessage = (sessionId: string) => {
        return getSessionState(sessionId).inputMessage
    }

    /**
     * 设置输入消息
     * @param sessionId - 会话 ID
     * @param content - 输入内容
     */
    const setInputMessage = (sessionId: string, content: any): void => {
        getSessionState(sessionId).inputMessage = content
    }

    /**
     * 获取会话设置
     * @param sessionId - 会话 ID
     * @param key - 设置键
     */
    const getSessionSetting = (sessionId: string, key: string): any => {
        return getSessionState(sessionId).settings[key]
    }

    /**
     * 设置会话设置
     * @param sessionId - 会话 ID
     * @param key - 设置键
     * @param value - 设置值
     */
    const setSessionSetting = (sessionId: string, key: string, value: any): void => {
        getSessionState(sessionId).settings[key] = value
    }

    /**
     * 更新会话标题
     * @param sessionId - 会话 ID
     * @param title - 新标题
     */
    const updateSessionTitle = (sessionId: string, title: string): void => {
        // 更新运行时状态
        const state = getSessionState(sessionId)
        state.title = title
        state.lastUpdated = Date.now()
        // 同步更新 sessionsMap
        const session = sessionsMap.value.get(sessionId)
        if (session) {
            session.title = title
        }
    }

    /**
     * 更新会话最后活跃时间
     * @param sessionId - 会话 ID
     * @param timestamp - 时间戳
     */
    const updateSessionLastActiveTime = (sessionId: string, timestamp?: string): void => {
        const session = sessionsMap.value.get(sessionId)
        if (session) {
            session.lastActiveAt = timestamp || new Date().toISOString()
        }
    }

    // === 侧边栏状态管理 ===

    /**
     * 获取或初始化侧边栏状态
     * @param sessionId - 会话 ID
     */
    const getSidebarState = (sessionId: string): { unread: boolean; working: boolean } => {
        if (!sessionSidebarStates.value.has(sessionId)) {
            sessionSidebarStates.value.set(sessionId, { unread: false, working: false })
        }
        return sessionSidebarStates.value.get(sessionId)!
    }

    type SidebarFlag = 'unread' | 'working'

    /**
     * 设置会话侧边栏标记
     * @param sessionId - 会话 ID
     * @param flag - 标记类型
     * @param value - 标记值
     */
    const setSidebarFlag = (sessionId: string, flag: SidebarFlag, value: boolean): void => {
        if (flag === 'working') {
            setWorking(sessionId, value)
            return
        }
        getSidebarState(sessionId)[flag] = value
    }

    /**
     * 获取会话侧边栏标记
     * @param sessionId - 会话 ID
     * @param flag - 标记类型
     * @returns 标记值
     */
    const getSidebarFlag = (sessionId: string, flag: SidebarFlag): boolean => {
        return getSidebarState(sessionId)[flag]
    }

    /**
     * 同步后端流式状态到侧边栏状态
     * 用于页面加载时初始化 working 状态
     * @param sessionId - 会话 ID
     * @param isStreaming - 后端返回的流式状态
     */
    const syncStreamingState = (sessionId: string, isStreaming: boolean): void => {
        setWorking(sessionId, isStreaming)
    }

    /**
     * 设置运行态并记录开始时间（前端计算实时耗时的起点）。
     *
     * @param sessionId - 会话 ID
     * @param working - 是否运行中
     */
    const setWorking = (sessionId: string, working: boolean): void => {
        const state = getSidebarState(sessionId)
        if (working && !state.working) {
            workingStartAt.value.set(sessionId, Date.now())
        } else if (!working) {
            workingStartAt.value.delete(sessionId)
        }
        state.working = working
    }

    /**
     * 取运行开始时间（毫秒）；未记录时返回 null。
     *
     * @param sessionId - 会话 ID
     */
    const getWorkingStartAt = (sessionId: string): number | null => {
        return workingStartAt.value.get(sessionId) ?? null
    }

    /**
     * 取最近一次完成的运行耗时（毫秒）；未记录时返回 null。
     * @param sessionId - 会话 ID
     */
    const getLastRunMs = (sessionId: string): number | null => {
        return lastRunMs.value.get(sessionId) ?? null
    }

    /**
     * 清理侧边栏状态（删除会话时调用）
     * @param sessionId - 会话 ID
     */
    const clearSidebarState = (sessionId: string): void => {
        sessionSidebarStates.value.delete(sessionId)
        workingStartAt.value.delete(sessionId)
    }

    // =====================

    /**
     * 清理会话状态（删除会话时调用）
     * @param sessionId - 会话 ID
     */
    const clearSessionState = (sessionId: string): void => {
        sessions.value.delete(sessionId)
        sessionsMap.value.delete(sessionId)
        lastRunMs.value.delete(sessionId)
        saveRunDurations()
        clearSidebarState(sessionId)
    }

    /**
     * 清空会话消息（清空聊天记录时调用）
     * 只清理消息和输入状态，保留会话本身
     * @param sessionId - 会话 ID
     */
    const clearSessionMessages = (sessionId: string): void => {
        const state = sessions.value.get(sessionId)
        if (state) {
            state.messages = []
            state.isStreaming = false
            state.isCompressing = false
            state.inputMessage = {
                content: '',
                files: [],
                isWaiting: false,
            }
            state.scrollPosition = 0
            state.lastUpdated = Date.now()
            state.messageQueue = []
            saveQueue(sessionId)
        }
        clearSidebarState(sessionId)
    }

    return {
        // 状态
        activeSessionId,
        sessionsMap,

        // actions
        getSessionState,
        getMessages,
        addMessage,
        setMessages,
        prependMessages,
        getEarliestMessageId,
        getLatestMessageId,
        deleteMessage,
        updateMessage,
        sessionIsStreaming,
        setSessionIsStreaming,
        sessionIsCompressing,
        setSessionIsCompressing,
        enqueueMessage,
        dequeueMessage,
        peekQueue,
        claimFirstQueuedMessage,
        getMessageQueue,
        removeQueuedMessage,
        updateQueuedMessage,
        reorderQueue,
        moveToFront,
        removeFromQueue,
        getQueueLength,
        getInputMessage,
        setInputMessage,
        getSessionSetting,
        setSessionSetting,
        updateSessionTitle,
        updateSessionLastActiveTime,
        clearSessionMessages,
        setChatSidebar,
        setSession,
        getSession,
        removeSession,
        getSessionsByGroup,
        getGroupTotal,
        moveSession,
        setSessionGroupId,
        setLoadedCount,
        getLoadedCount,
        setHasMore,
        groupHasMore,
        getSidebarState,
        setSidebarFlag,
        getSidebarFlag,
        syncStreamingState,
        setWorking,
        getWorkingStartAt,
        getLastRunMs,
        clearSidebarState,
    }
})
