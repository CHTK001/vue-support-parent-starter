/**
 * 服务管理 —— 取数与动作（唯一一份）
 *
 * <p>这一层是页面唯一的事实来源：统计摘要、协议 / 插件元数据、自动刷新、启停、
 * 删改、抽屉开合、降级提示全在这里。模板只读 {@link ServiceNodesVm} 里的状态、
 * 只调这里的函数，自己不算任何东西 —— 否则「自动刷新失败要不要弹 toast」这类判断
 * 会散进模板，而它出错的症状是「页面偶尔刷出一片红字」，最难查。</p>
 *
 * <p><b>分页口径</b>：从 4.0.0.56 起节点列表走服务端分页（{@code GET /server/page}），
 * 前端不再持有全量数组。状态是<b>运行时状态</b>而不是库列，所以过滤 / 排序 / 切片
 * 都在后端装配完视图之后完成（见后端 {@code ServerNodePager}）。因此：</p>
 * <ul>
 *   <li>表格的行由 {@link ServiceNodesVm.loadPage} 按页取，交给 ReTable 的 loader；</li>
 *   <li>左栏计数与新建表单的重名校验需要「全量」，改由 {@code /server/summary} 一份
 *       轻量摘要提供 —— 不能拿当前页去算，否则翻到第 2 页时总数会变成 20；</li>
 *   <li>启停 / 删除 / 改配置之后，摘要与当前页都要重取。</li>
 * </ul>
 *
 * @author CH
 * @since 4.0.0
 */
import { computed, onMounted, onUnmounted, reactive, ref } from 'vue'
import { message } from '@repo/core'
import { useRouter } from 'vue-router'
import type { RePageResult, ReTableLoadParams } from '@repo/ui/re-table'
import {
  deleteServerNode,
  listFilterTypes,
  listProtocols,
  pageServerNodes,
  restartServerNode,
  serverNodeSummary,
  startServerNode,
  stopServerNode,
  type FilterTypeMeta,
  type ProtocolMeta,
  type ServerNodeSummary,
  type ServerNodeView,
} from '../../api'
import { createAutoRefresh, DEFAULT_AUTO_REFRESH } from '../../utils/autoRefresh'
import { confirmThen } from '../../utils/confirmThen'
import { resolveFilterDetail } from '../../utils/filterDetail'
import { describeMetaLoad, type MetaLoadNotice } from '../../utils/metaLoad'
import { buildProtocolOptions, type NodeStats } from '../../utils/nodeList'

/** 状态页签取值：空串为「全部」 */
export type ServiceStatusFilter = '' | 'RUNNING' | 'STOPPED' | 'ERROR'

/** 排序口径：名称 / 端口 / 状态 */
export type ServiceSort = 'name' | 'port' | 'status'

/** 页面可用的全部状态与动作 */
export interface ServiceNodesVm {
  // ---- 数据 ----
  /** 统计摘要（全量，不是当前页） */
  summary: ServerNodeSummary
  /** 统计（沿用 NodeStats 口径，模板不必知道后端字段名） */
  stats: NodeStats
  /** 各状态计数（左栏筛选用） */
  statusCounts: { all: number; running: number; stopped: number; error: number }
  /** 协议元数据 */
  protocols: ProtocolMeta[]
  /** 插件元数据 */
  filterTypes: FilterTypeMeta[]
  /** 协议下拉选项（内置 + SPI） */
  protocolOptions: Array<{ label: string; value: string }>
  // ---- 筛选 ----
  keyword: string
  protocol: string
  status: ServiceStatusFilter
  sort: ServiceSort
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
  existingNames: string[]
  // ---- 动作 ----
  /** ReTable 的远程 loader：按页取节点（后端分页） */
  loadPage: (params: ReTableLoadParams) => Promise<RePageResult>
  /** 重取摘要 + 当前页（silent 用于自动刷新，不弹 toast、不点亮按钮） */
  refresh: (silent?: boolean) => Promise<void>
  /** 宿主注册「重取当前页」的回调（ReTable 的 reload），摘要是本层自己刷 */
  setRowRefresher: (fn: (() => void) | null) => void
  openCreate: () => void
  openEdit: (node: ServerNodeView) => void
  openClone: (node: ServerNodeView) => void
  start: (node: ServerNodeView) => Promise<void>
  stop: (node: ServerNodeView) => Promise<void>
  restart: (node: ServerNodeView) => Promise<void>
  remove: (node: ServerNodeView) => Promise<void>
  openDetailPage: (node: ServerNodeView, index: number) => void
}

/**
 * 取异常上的 HTTP 状态码。
 *
 * <p>5xx 时 {@code httpCrypto} 的响应拦截器会先弹「服务器错误」并把
 * {@code error.message} 清空（避免调用方再弹一次原始英文），于是这里的
 * {@code instanceof Error && e.message} 判定会落空。状态码要单独捞出来。</p>
 *
 * @param e 异常
 */
function httpStatusOf(e: unknown): number | undefined {
  if (!e || typeof e !== 'object') return undefined;
  const direct = (e as { status?: unknown }).status;
  if (typeof direct === 'number') return direct;
  const response = (e as { response?: { status?: unknown } }).response;
  return response && typeof response.status === 'number' ? response.status : undefined;
}

/**
 * 把任意异常压成一句可展示的短文本。
 *
 * <p>后端失败时抛出的是 {@code {code,msg}} 形态的对象而不是 Error，直接
 * {@code (e as Error).message} 会渲染出 {@code [object Object]}。</p>
 *
 * <p>兜底顺序是「原始 message → 后端 msg → HTTP 状态码 → 未知错误」：
 * 少了状态码这一档，被拦截器清空 message 的 5xx 在页面上只剩「未知错误」，
 * 用户与排查者都看不出是哪一层挂了。</p>
 *
 * @param e 异常
 */
export function reasonText(e: unknown): string {
  if (e instanceof Error && e.message) return e.message
  if (e && typeof e === 'object' && 'msg' in e) {
    const msg = (e as { msg?: unknown }).msg
    if (typeof msg === 'string' && msg) return msg
  }
  const status = httpStatusOf(e)
  if (status) {
    if (status === 404) return 'HTTP 404（接口不存在）'
    if (status === 401 || status === 403) return `HTTP ${status}（未登录或无权限）`
    if (status >= 500) return `HTTP ${status}（服务端错误）`
    return `HTTP ${status}`
  }
  return typeof e === 'string' && e ? e : '未知错误'
}

/** 空摘要：首屏渲染前用它兜底，避免模板里到处写可选链 */
function emptySummary(): ServerNodeSummary {
  return { total: 0, running: 0, stopped: 0, error: 0, unknown: 0, plugins: 0, names: [] }
}

/**
 * 建立服务管理页的状态与动作。
 */
export function useServiceNodes(): ServiceNodesVm {
  const router = useRouter()

  const summary = ref<ServerNodeSummary>(emptySummary())
  const protocols = ref<ProtocolMeta[]>([])
  const filterTypes = ref<FilterTypeMeta[]>([])
  const loading = ref(false)
  const actingId = ref<number | null>(null)

  const formVisible = ref(false)
  const editingNode = ref<ServerNodeView | null>(null)

  const keyword = ref('')
  const protocol = ref('')
  const status = ref<ServiceStatusFilter>('')
  const sort = ref<ServiceSort>('name')

  const notice = ref<MetaLoadNotice>({ show: false, tone: 'warning', text: '' })

  /**
   * 协议 / 插件元数据是否已经拿到。
   *
   * <p>这两份清单由后端启动时的内置项 + SPI 扫描结果决定，运行期不会变；
   * 10 秒一轮的自动刷新只该刷节点状态，把元数据也每轮重拉一遍属于空跑。</p>
   */
  const metaLoaded = ref(false)

  /** 宿主注册的「重取当前页」回调（ReTable.reload），启停 / 删除后要一起刷 */
  let rowRefresher: (() => void) | null = null

  const stats = computed<NodeStats>(() => ({
    total: summary.value.total,
    running: summary.value.running,
    stopped: summary.value.stopped,
    error: summary.value.error,
    unknown: summary.value.unknown,
    plugins: summary.value.plugins,
  }))

  const statusCounts = computed(() => ({
    all: summary.value.total,
    running: summary.value.running,
    stopped: summary.value.stopped,
    error: summary.value.error,
  }))

  const protocolOptions = computed(() => buildProtocolOptions(protocols.value))

  const filtered = computed(
    () => Boolean(keyword.value.trim()) || Boolean(protocol.value) || Boolean(status.value),
  )

  const existingNames = computed(() =>
    summary.value.names.filter(name => name !== editingNode.value?.name),
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
   * ReTable 的远程 loader：按页取节点。
   *
   * <p>组件会把 {@code page / pageSize} 写回 {@code params}，这里只做参数搬运；
   * 过滤与排序在后端完成，前端不再二次筛选（否则总数与行数会对不上）。</p>
   *
   * @param params ReTable 传入的分页 + 查询参数
   */
  async function loadPage(params: ReTableLoadParams): Promise<RePageResult> {
    const q = (params.params ?? {}) as Record<string, unknown>
    try {
      const res = await pageServerNodes({
        keyword: typeof q.keyword === 'string' ? q.keyword : '',
        protocol: typeof q.protocol === 'string' ? q.protocol : '',
        status: typeof q.status === 'string' ? q.status : '',
        sort: typeof q.sort === 'string' ? q.sort : '',
        page: params.page,
        size: params.pageSize,
      })
      return {
        // ServerNodeView 是接口类型，没有索引签名，转成 RePageResult 期望的行类型
        records: (res?.records ?? []) as unknown as Array<Record<string, unknown>>,
        total: Number(res?.total ?? 0),
      }
    } catch (e) {
      message.error(reasonText(e))
      return { records: [], total: 0 }
    }
  }

  /**
   * 重取摘要（与元数据）。
   *
   * @param silent 静默模式：自动刷新用，不弹 toast（后端故障期间每 10 秒一条会把界面糊满），
   *               也不点亮刷新按钮的转圈——否则每轮轮询都会闪一下，看着像页面在不停重载
   */
  async function refresh(silent = false): Promise<void> {
    if (!silent) loading.value = true
    try {
      // 元数据只在还没拿到时请求：轮询 / 切回标签页的补拉都只刷摘要
      const summaryPromise = serverNodeSummary()
      const protocolsPromise = metaLoaded.value ? Promise.resolve(protocols.value) : listProtocols()
      const filtersPromise = metaLoaded.value ? Promise.resolve(filterTypes.value) : listFilterTypes()
      const [summaryResult, protocolsResult, filtersResult] = await Promise.allSettled([
        summaryPromise,
        protocolsPromise,
        filtersPromise,
      ])

      if (summaryResult.status === 'fulfilled' && summaryResult.value) {
        summary.value = summaryResult.value
      }
      if (protocolsResult.status === 'fulfilled') protocols.value = protocolsResult.value ?? []
      if (filtersResult.status === 'fulfilled') filterTypes.value = filtersResult.value ?? []
      // 两份都拿到了才认「元数据已就绪」；缺一份下轮继续补，避免永久空下拉
      metaLoaded.value =
        protocolsResult.status === 'fulfilled' && filtersResult.status === 'fulfilled'

      notice.value = describeMetaLoad({
        nodesOk: summaryResult.status === 'fulfilled',
        protocolsOk: protocolsResult.status === 'fulfilled',
        filtersOk: filtersResult.status === 'fulfilled',
        nodesError: summaryResult.status === 'rejected' ? reasonText(summaryResult.reason) : undefined,
        protocolsError:
          protocolsResult.status === 'rejected' ? reasonText(protocolsResult.reason) : undefined,
        filtersError:
          filtersResult.status === 'rejected' ? reasonText(filtersResult.reason) : undefined,
      })

      if (summaryResult.status === 'rejected') {
        if (!silent) message.error(reasonText(summaryResult.reason))
        // 抛给 autoRefresh 记一次失败以触发退避
        throw summaryResult.reason
      }
    } catch (e) {
      if (!silent) message.error(reasonText(e))
    } finally {
      if (!silent) loading.value = false
    }
    // 当前页跟着重取：启停 / 删除后状态与过滤器链都会变
    try {
      rowRefresher?.()
    } catch {
      // 表格还没挂载或正在销毁：下一轮刷新会补上，不打断摘要刷新
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
    rowRefresher = null
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
   * <p>用 {@code reactive} 包一层而不是直接返回字面量：模板里访问 {@code vm.summary}
   * 才会拿到拆开的值，而不是一个 Ref 对象。类型仍按「值」声明（{@link ServiceNodesVm}），
   * 与运行时行为一致。</p>
   */
  const vm = reactive({
    summary,
    stats,
    statusCounts,
    protocols,
    filterTypes,
    protocolOptions,
    keyword,
    protocol,
    status,
    sort,
    filtered,
    resetFilters,
    loading,
    actingId,
    notice,
    formVisible,
    editingNode,
    existingNames,
    loadPage,
    refresh,
    setRowRefresher: (fn: (() => void) | null) => {
      rowRefresher = fn
    },
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
