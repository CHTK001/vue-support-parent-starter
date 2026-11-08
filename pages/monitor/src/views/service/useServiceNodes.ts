/**
 * 服务管理 —— 取数与动作（唯一一份）
 *
 * <p>这一层是页面唯一的事实来源：拉列表、自动刷新、启停、删改、抽屉开合、降级提示
 * 全在这里。模板只读 {@link ServiceNodesVm} 里的状态、只调这里的函数，自己不算任何东西
 * —— 否则「自动刷新失败要不要弹 toast」这类判断会散进模板，而它出错的症状是
 * 「页面偶尔刷出一片红字」，最难查。</p>
 *
 * <p>三个请求（节点 / 协议 / 插件）用 {@code allSettled} 分别落地：任一失败不能让
 * 另外两个的结果一起被丢掉，否则协议下拉会因为插件接口 500 而变空，看起来像没数据。</p>
 *
 * @author CH
 * @since 4.0.0
 */
import { computed, onMounted, onUnmounted, reactive, ref } from 'vue'
import { message } from '@repo/core'
import { useRouter } from 'vue-router'
import {
  deleteServerNode,
  listFilterTypes,
  listProtocols,
  listServerNodes,
  restartServerNode,
  startServerNode,
  stopServerNode,
  type FilterTypeMeta,
  type ProtocolMeta,
  type ServerNodeView,
} from '../../api'
import { createAutoRefresh, DEFAULT_AUTO_REFRESH } from '../../utils/autoRefresh'
import { confirmThen } from '../../utils/confirmThen'
import { resolveFilterDetail } from '../../utils/filterDetail'
import { describeMetaLoad, type MetaLoadNotice } from '../../utils/metaLoad'
import {
  buildProtocolOptions,
  filterNodes,
  summarizeNodes,
  type NodeStats,
} from '../../utils/nodeList'
import { toServiceNodeCards, type ServiceNodeCard } from './serviceView'

/** 状态页签取值：空串为「全部」 */
export type ServiceStatusFilter = '' | 'RUNNING' | 'STOPPED' | 'ERROR'

/** 页面可用的全部状态与动作 */
export interface ServiceNodesVm {
  // ---- 数据 ----
  /** 后端原样节点 */
  nodes: ServerNodeView[]
  /** 展示数据（未筛选，统计用） */
  cards: ServiceNodeCard[]
  /** 展示数据（已筛选） */
  visibleCards: ServiceNodeCard[]
  /** 协议元数据 */
  protocols: ProtocolMeta[]
  /** 插件元数据 */
  filterTypes: FilterTypeMeta[]
  /** 统计 */
  stats: NodeStats
  /** 协议下拉选项（内置 + SPI） */
  protocolOptions: Array<{ label: string; value: string }>
  /** 各状态计数（页签用） */
  statusCounts: { all: number; running: number; stopped: number; error: number }
  // ---- 筛选 ----
  keyword: string
  protocol: string
  status: ServiceStatusFilter
  /** 是否有任何生效条件 */
  filtered: boolean
  /** 清空条件 */
  resetFilters: () => void
  // ---- 状态 ----
  loading: boolean
  actingId: number | null
  notice: MetaLoadNotice
  // ---- 抽屉 ----
  formVisible: boolean
  editingNode: ServerNodeView | null
  detailVisible: boolean
  detailNodeId: number | null
  existingNames: string[]
  // ---- 动作 ----
  refresh: (silent?: boolean) => Promise<void>
  openCreate: () => void
  openEdit: (node: ServerNodeView) => void
  openClone: (node: ServerNodeView) => void
  openDetail: (node: ServerNodeView) => void
  start: (node: ServerNodeView) => Promise<void>
  stop: (node: ServerNodeView) => Promise<void>
  restart: (node: ServerNodeView) => Promise<void>
  remove: (node: ServerNodeView) => Promise<void>
  openDetailPage: (node: ServerNodeView, index: number) => void
}

/**
 * 把任意异常压成一句可展示的短文本。
 *
 * <p>后端失败时抛出的是 {@code {code,msg}} 形态的对象而不是 Error，直接
 * {@code (e as Error).message} 会渲染出 {@code [object Object]}。</p>
 *
 * @param e 异常
 */
export function reasonText(e: unknown): string {
  if (e instanceof Error && e.message) return e.message
  if (e && typeof e === 'object' && 'msg' in e) {
    const msg = (e as { msg?: unknown }).msg
    if (typeof msg === 'string' && msg) return msg
  }
  return typeof e === 'string' && e ? e : '未知错误'
}

/**
 * 建立服务管理页的状态与动作。
 */
export function useServiceNodes(): ServiceNodesVm {
  const router = useRouter()

  const nodes = ref<ServerNodeView[]>([])
  const protocols = ref<ProtocolMeta[]>([])
  const filterTypes = ref<FilterTypeMeta[]>([])
  const loading = ref(false)
  const actingId = ref<number | null>(null)

  const formVisible = ref(false)
  const editingNode = ref<ServerNodeView | null>(null)
  const detailVisible = ref(false)
  const detailNodeId = ref<number | null>(null)

  const keyword = ref('')
  const protocol = ref('')
  const status = ref<ServiceStatusFilter>('')

  const notice = ref<MetaLoadNotice>({ show: false, tone: 'warning', text: '' })

  /**
   * 协议 / 插件元数据是否已经拿到。
   *
   * <p>这两份清单由后端启动时的内置项 + SPI 扫描结果决定，运行期不会变；
   * 10 秒一轮的自动刷新只该刷节点状态，把元数据也每轮重拉一遍属于空跑。</p>
   */
  const metaLoaded = ref(false)

  const stats = computed(() => summarizeNodes(nodes.value))

  const cards = computed(() => toServiceNodeCards(nodes.value, filterTypes.value))

  const visibleCards = computed(() => {
    // 关键字 / 协议走 nodeList 里已被单测锁住的口径（还包含 error 文本，
    // 排障时能按报错关键字搜），状态再叠一层。命中 id 后再取展示数据，
    // 保证卡片对象与未筛选时是同一批，避免每帧重建导致选中态抖动。
    const keep = new Set(
      filterNodes(nodes.value, { keyword: keyword.value, protocol: protocol.value })
        .filter(node => !status.value || node.status === status.value)
        .map(node => node.id),
    )
    return cards.value.filter(card => keep.has(card.id))
  })

  const protocolOptions = computed(() => buildProtocolOptions(protocols.value))

  const statusCounts = computed(() => ({
    all: stats.value.total,
    running: stats.value.running,
    stopped: stats.value.stopped,
    error: stats.value.error,
  }))

  const filtered = computed(
    () => Boolean(keyword.value.trim()) || Boolean(protocol.value) || Boolean(status.value),
  )

  const existingNames = computed(() =>
    nodes.value.filter(node => node.id !== editingNode.value?.id).map(node => node.name),
  )

  /**
   * 清空全部条件。
   */
  function resetFilters(): void {
    keyword.value = ''
    protocol.value = ''
    status.value = ''
  }

  /**
   * 拉取列表与元数据。
   *
   * @param silent 静默模式：自动刷新用，不弹 toast（后端故障期间每 10 秒一条会把界面糊满），
   *               也不点亮刷新按钮的转圈——否则每轮轮询都会闪一下，看着像页面在不停重载
   */
  async function refresh(silent = false): Promise<void> {
    if (!silent) loading.value = true
    try {
      // 元数据只在还没拿到时请求：轮询 / 切回标签页的补拉都只刷节点状态
      const nodesPromise = listServerNodes()
      const protocolsPromise = metaLoaded.value ? Promise.resolve(protocols.value) : listProtocols()
      const filtersPromise = metaLoaded.value ? Promise.resolve(filterTypes.value) : listFilterTypes()
      const [nodesResult, protocolsResult, filtersResult] = await Promise.allSettled([
        nodesPromise,
        protocolsPromise,
        filtersPromise,
      ])

      if (nodesResult.status === 'fulfilled') nodes.value = nodesResult.value ?? []
      if (protocolsResult.status === 'fulfilled') protocols.value = protocolsResult.value ?? []
      if (filtersResult.status === 'fulfilled') filterTypes.value = filtersResult.value ?? []
      // 两份都拿到了才认「元数据已就绪」；缺一份下轮继续补，避免永久空下拉
      metaLoaded.value =
        protocolsResult.status === 'fulfilled' && filtersResult.status === 'fulfilled'

      notice.value = describeMetaLoad({
        nodesOk: nodesResult.status === 'fulfilled',
        protocolsOk: protocolsResult.status === 'fulfilled',
        filtersOk: filtersResult.status === 'fulfilled',
        nodesError: nodesResult.status === 'rejected' ? reasonText(nodesResult.reason) : undefined,
        protocolsError:
          protocolsResult.status === 'rejected' ? reasonText(protocolsResult.reason) : undefined,
        filtersError:
          filtersResult.status === 'rejected' ? reasonText(filtersResult.reason) : undefined,
      })

      if (nodesResult.status === 'rejected') {
        if (!silent) message.error(reasonText(nodesResult.reason))
        // 抛给 autoRefresh 记一次失败以触发退避
        throw nodesResult.reason
      }
    } catch (e) {
      if (!silent) message.error(reasonText(e))
    } finally {
      if (!silent) loading.value = false
    }
  }

  /**
   * 执行一个针对单节点的动作：统一置 actingId、刷新、报错。
   *
   * @param node    目标节点
   * @param action  动作
   * @param success 成功文案
   */
  async function act(
    node: ServerNodeView,
    action: () => Promise<unknown>,
    success: string,
  ): Promise<void> {
    actingId.value = node.id
    try {
      await action()
      message.success(success)
      await refresh()
    } catch (e) {
      message.error(reasonText(e))
    } finally {
      actingId.value = null
    }
  }

  const autoRefresh = createAutoRefresh(() => refresh(true), DEFAULT_AUTO_REFRESH)

  /**
   * 切回标签页补拉一次，否则用户看到的是几分钟前的状态。
   */
  function onVisibilityChange(): void {
    if (document.visibilityState === 'visible') void refresh(true)
  }

  onMounted(() => {
    void refresh()
    autoRefresh.start()
    document.addEventListener('visibilitychange', onVisibilityChange)
  })

  onUnmounted(() => {
    autoRefresh.stop()
    document.removeEventListener('visibilitychange', onVisibilityChange)
  })

  /**
   * 打开插件深度查看页。
   *
   * <p>node 型的深度页由插件自身 HTTP 服务托管（新窗口直开节点地址）；
   * route 型由宿主应用托管，先校验路由存在再跳，避免死链。</p>
   *
   * @param node  节点
   * @param index 过滤器下标
   */
  function openDetailPage(node: ServerNodeView, index: number): void {
    const filter = node.filters?.[index]
    if (!filter) return
    const meta = filterTypes.value.find(item => item.type === (filter.type || filter.name))
    const target = resolveFilterDetail(meta, filter, node)
    if (!target) {
      message.info('该插件未提供深度查看页')
      return
    }
    if (target.kind === 'unavailable') {
      message.info(target.reason)
      return
    }
    if (target.kind === 'node') {
      window.open(target.url, '_blank', 'noopener')
      return
    }
    if (!router.resolve(target.path).matched.length) {
      message.info(`当前应用未接入该插件的深度查看页（${target.path}）`)
      return
    }
    router.push(target.path)
  }

  /**
   * 交给模板的统一门面。
   *
   * <p>用 {@code reactive} 包一层而不是直接返回字面量：模板里访问 {@code vm.cards}
   * 才会拿到拆开的数组，而不是一个 Ref 对象。类型仍按「值」声明（{@link ServiceNodesVm}），
   * 与运行时行为一致。</p>
   */
  const vm = reactive({
    nodes,
    cards,
    visibleCards,
    protocols,
    filterTypes,
    stats,
    protocolOptions,
    statusCounts,
    keyword,
    protocol,
    status,
    filtered,
    resetFilters,
    loading,
    actingId,
    notice,
    formVisible,
    editingNode,
    detailVisible,
    detailNodeId,
    existingNames,
    refresh,
    openCreate: () => {
      editingNode.value = null
      formVisible.value = true
    },
    openEdit: (node: ServerNodeView) => {
      editingNode.value = node
      formVisible.value = true
    },
    /**
     * 克隆：复制全部字段，id 置零表示「尚未落库」。
     *
     * <p>名称后缀由表单抽屉统一追加（{@code ScServerFormDrawer} 的克隆分支），
     * 这里保持原名称：否则两处各拼一次 {@code -clone}，会得到
     * {@code xxx-clone-clone}。</p>
     *
     * @param node 源节点
     */
    openClone: (node: ServerNodeView) => {
      editingNode.value = {
        ...node,
        id: 0,
        status: 'STOPPED',
        error: undefined,
        serverUrl: undefined,
        enabled: node.enabled ?? 0,
      }
      formVisible.value = true
    },
    openDetail: (node: ServerNodeView) => {
      detailNodeId.value = node.id
      detailVisible.value = true
    },
    start: (node: ServerNodeView) => act(node, () => startServerNode(node.id), `服务「${node.name}」已启动`),
    stop: (node: ServerNodeView) => act(node, () => stopServerNode(node.id), `服务「${node.name}」已停止`),
    restart: (node: ServerNodeView) => act(node, () => restartServerNode(node.id), `服务「${node.name}」已重启`),
    /**
     * 删除节点。
     *
     * <p>用 confirmThen 而不是直接 await message.confirm：后者在「取消」时是
     * reject(false)，直接 await 会让取消变成一个未捕获的 rejection。</p>
     *
     * @param node 节点
     */
    remove: async (node: ServerNodeView) => {
      const confirmed = await confirmThen(
        message.confirm,
        `确认删除服务「${node.name}」？运行中的实例会先被停止。`,
        '删除服务',
      )
      if (!confirmed) return
      await act(node, () => deleteServerNode(node.id), '已删除')
    },
    openDetailPage,
  })

  return vm as unknown as ServiceNodesVm
}
