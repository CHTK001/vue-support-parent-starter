/**
 * 服务管理 —— 三种外壳共用的上下文契约
 *
 * <p><b>为什么要有这一层</b>：页面状态（筛选、页签、右键菜单、启停动作）只有一份，
 * 但「怎么摆」要出三个方向对比。若把 30 多个绑定逐个当 props 传给外壳，改一次
 * 状态就要同步三处签名，方向还没比完就已经漂了；反过来把逻辑复制进三个外壳，
 * 行为又必然分叉。</p>
 *
 * <p>所以：状态与动作仍住在 {@code ScServiceManage.vue}，用 {@link createSvcShellContext}
 * 收成一个对象交给外壳；外壳只负责摆位与密度，不自己算节点状态，也不直接发请求。</p>
 *
 * <p>外壳读取时可以直接写 {@code ctx.cards} / {@code ctx.activeCard}：上下文用
 * {@code reactive()} 包了一层，ref 会被自动解包，赋值也会写回原 ref。</p>
 *
 * @author CH
 * @since 4.0.0
 */
import type { Ref } from 'vue'
import type { ReTabsContextItem, ReTabsItem } from '@repo/ui/re-tabs'
import type { ServerNodeView } from '../../../api/serviceManage'
import type { ServiceNodeCard } from '../serviceView'
import type { ServiceNodesVm } from '../useServiceNodes'

/** 外壳代号：台账 / 机架 / 控制台 */
export type SvcShellName = 'ledger' | 'rack' | 'console'

/** 工作区页签类型：节点详情 / 过滤器链 / P2P 房间 */
export type WorkKind = 'detail' | 'filter' | 'room'

/** 工作区页签（比 ReTabsItem 多带上下文，便于渲染内容） */
export interface WorkTab extends ReTabsItem {
  /** 所属节点 id；房间页签没有节点 */
  nodeId?: number
  kind: WorkKind
  /** 房间页签要加入的房间号（来自 ?roomId=，空则停在「创建房间」） */
  roomId?: string
  /** 房间页签指向的信令节点地址（ROOM 节点的 serverUrl；空则用宿主同端口） */
  serverUrl?: string
  /** 房间页签来源节点名（展示用，空表示宿主同端口房间） */
  nodeName?: string
}

/** 左轨状态分组 */
export interface StatusTab {
  label: string
  value: '' | 'RUNNING' | 'ERROR' | 'STOPPED'
  count: number
  dot: string
}

/** 按协议分组后的节点 */
export interface ProtocolGroup {
  key: string
  protocolText: string
  cards: ServiceNodeCard[]
  running: number
}

/** 最近活动条目 */
export interface ActivityItem {
  id: number
  text: string
  icon: string
  at: number
  nodeId?: number
}

/**
 * 外壳能用到的全部状态与动作。
 *
 * <p>字段名刻意与 {@code ScServiceManage.vue} 里的绑定同名：外壳模板读起来
 * 与原来的单文件模板一致，迁移时不用做心智换算。</p>
 */
export interface SvcShellContext {
  /* ---------- 数据与筛选 ---------- */
  vm: ServiceNodesVm
  /** 左侧状态分组（全部 / 运行中 / 异常 / 已停止） */
  statusTabs: StatusTab[]
  /** 分布条的悬停说明 */
  distTitle: string
  /** 按协议分组的节点 */
  protocolGroups: ProtocolGroup[]
  /** 已折叠的协议组 */
  collapsedGroups: Set<string>
  /** 收起 / 展开协议组 */
  toggleGroup: (key: string) => void

  /* ---------- 选中与动作 ---------- */
  /** 左轨选中的节点 id */
  selectedNodeId: number | null
  /** 当前语义节点：有活动页签看页签，否则看选中 */
  activeNodeId: number | null
  /** 当前语义节点卡片 */
  activeCard: ServiceNodeCard | undefined
  /** 单行单击 */
  onRowClick: (card: ServiceNodeCard) => void
  /** 单行双击 */
  onRowDblClick: (card: ServiceNodeCard) => void
  /** 启停主操作 */
  runPrimary: (card: ServiceNodeCard) => void
  /** 主操作文案 */
  primaryLabel: (card: ServiceNodeCard) => string
  /** 主操作图标 */
  primaryIcon: (card: ServiceNodeCard) => string
  /** 状态灯类名 */
  stateClassOf: (card: ServiceNodeCard) => string
  /** 打开节点右键菜单（行内按钮触发） */
  openCtxMenuFromButton: (event: MouseEvent, card: ServiceNodeCard) => void
  /** 打开节点操作日志 */
  openOperLog: (card: ServiceNodeCard) => void

  /* ---------- 工作区页签 ---------- */
  openTabs: WorkTab[]
  activeTab: string
  /** 切换页签 */
  setActiveTab: (name: string) => void
  /** 页签右键菜单 */
  tabContextMenu: ReTabsContextItem[]
  /** 页签右键命令 */
  onTabCommand: (payload: { key: string; tab: ReTabsItem }) => void
  /** 关闭页签 */
  closeTab: (name: string) => void
  /** 页签内容类型 */
  kindOf: (tab: ReTabsItem) => WorkKind | undefined
  /** 页签所属节点 id */
  nodeIdOf: (tab: ReTabsItem) => number | null
  /** 房间号 */
  roomIdOf: (tab: ReTabsItem) => string
  /** 房间信令地址 */
  serverUrlOf: (tab: ReTabsItem) => string
  /** 页签刷新代次（作为子组件 key 的一部分） */
  reloadSeqOf: (name: string) => number

  /* ---------- 页签入口 ---------- */
  /** 打开详情 / 过滤器链页签 */
  openTab: (card: ServiceNodeCard, kind: Exclude<WorkKind, 'room'>) => void
  /** 打开房间工作台 */
  openRoomTab: (serverUrl?: string, roomIdArg?: string, nodeName?: string) => void
  /** 顶部房间入口（先找运行中的 ROOM 节点） */
  openRoomEntrance: () => void
  /** 从节点行打开房间 */
  openRoomFromCard: (card: ServiceNodeCard) => void
  /** 是否 ROOM 协议节点 */
  isRoomCard: (card: ServiceNodeCard) => boolean

  /* ---------- 面板开合 ---------- */
  /** 左轨是否收起 */
  railCollapsed: boolean
  /** 收起 / 展开左轨 */
  toggleRail: () => void
  /** 右侧检查器是否展开 */
  dockOpen: boolean
  /** 收起 / 展开右侧检查器 */
  toggleDock: () => void

  /* ---------- 最近活动与统计 ---------- */
  activities: ActivityItem[]
  /** 清空活动 */
  clearActivities: () => void
  /** 相对时间文案 */
  timeAgo: (at: number) => string
  /** 跳到活动对应节点 */
  gotoActivity: (item: ActivityItem) => void
  /** 已打开页签数 */
  tabCount: number
}

/** 取后端行（动作接口要的是后端行） */
export type NodeOf = (card: ServiceNodeCard) => ServerNodeView | undefined

/** 外壳组件注册表用的类型：三个方向都接收同一个上下文 */
export interface SvcShellProps {
  ctx: SvcShellContext
}

/** 便于外壳声明「某个 ref 我也许会写」 */
export type Mutable<T> = { -readonly [K in keyof T]: T[K] extends Ref<infer V> ? V : T[K] }
