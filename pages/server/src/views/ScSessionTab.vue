<script setup lang="ts">
/**
 * 会话审计 —— 编排层
 *
 * <p>这一层只做三件事：取数、持有筛选状态、把同一个状态喂给当前方向对应的画布。
 * 任何「长什么样」的判断都在画布组件里，任何「怎么算」的判断都在
 * {@link sessionView} 的纯函数里。这样五个方向共享同一份事实来源：
 * 同一批会话在「工单台」和「卡片墙」里显示的时长、状态文案、空值兜底完全一致。</p>
 *
 * <p>为什么要分方向：这一页的数据形状是「区间」（连接 → 关闭），
 * 而原先的实现只有一种排法 —— 平表。平表能回答「哪一条」，但回答不了
 * 「今天什么时候在连、空了哪几段」，也把关闭原因这类字段浪费在抽屉里。
 * 五个方向是五种对「这一页该为谁服务」的回答，由使用者在真实数据上挑。</p>
 *
 * <p>筛选状态为什么放在这一层而不放在画布：从「仪表」点柱子设下的时段条件，
 * 切到「工单台」后必须仍然生效并且仍能清除。条件若存在画布里，切一次就丢一次，
 * 用户会以为筛选自己坏了。因此页头统一展示「当前生效的条件」并负责清除。</p>
 *
 * @author CH
 * @since 4.0.0
 */
import { computed, onMounted, onUnmounted, reactive, ref } from 'vue'
import { message } from '@repo/core'
// 显式文件路径而不是 @repo/ui/re-page-kit：后者由 turbo/vite/createVite.ts 的
// uiExplicitAliases() 在**开发服务器启动时**扫描 components 目录生成，
// 新建的组件目录要重启 dev server 才进别名表。显式路径走的是静态的
// @repo/ui → packages/ui/src 别名，新建即生效，也与 acme/index.vue 里
// @repo/ui/components/ReTab/types 的既有写法一致。
// 包 exports 里仍保留了 ./re-page-kit 子路径，供构建期与外部引用使用。
import { usePageVariant } from '@repo/ui/components/RePageKit/usePageVariant'
import RePageVariantDock from '@repo/ui/components/RePageKit/RePageVariantDock.vue'
import { getSessions, closeSession, queryHosts } from '../api'
import {
  EMPTY_SESSION_FILTERS,
  SESSION_BUCKET_HOURS,
  countByStatus,
  filterSessions,
  toSessionViews,
  type SessionFilters,
  type SessionView,
} from './session/sessionView'
import SessionConsole from './session/SessionConsole.vue'
import SessionInstrument from './session/SessionInstrument.vue'
import SessionRhythm from './session/SessionRhythm.vue'
import SessionDossier from './session/SessionDossier.vue'
import SessionWall from './session/SessionWall.vue'

/** 后端会话行 */
interface SessionRow {
  id: number
  msTerminalSessionHostId?: number
  msTerminalSessionHostName?: string
  msTerminalSessionProtocol: string
  msTerminalSessionUser?: string
  msTerminalSessionClientIp?: string
  msTerminalSessionConnectTime?: string
  msTerminalSessionCloseTime?: string
  msTerminalSessionStatus: string
  msTerminalSessionCloseReason?: string
}

/** 会话列表（后端原样） */
const sessions = ref<SessionRow[]>([])

/** 加载态 */
const loading = ref(false)

/** 主机台账：id → 主机名；后端没填主机名时兜底 */
const hostMap = ref<Record<number, string>>({})

/** 筛选条件：唯一状态源，五个画布共用 */
const filters = reactive<SessionFilters>({ ...EMPTY_SESSION_FILTERS })

/** 当前时刻：让「进行中」的时长与时间带上的「现在」跟着走 */
const now = ref(new Date())

/** 详情抽屉（工单台 / 仪表 / 节奏 / 卡片墙用；档案柜的详情常驻右栏，不弹抽屉） */
const detailVisible = ref(false)
const detailView = ref<SessionView | null>(null)

/** 页面方向：选择按页持久化，生产环境坞隐藏但选择仍生效 */
const { variant, items, dockVisible, setVariant } = usePageVariant({
  pageKey: 'server.session-audit',
})

/**
 * 全量展示行。
 *
 * <p>仪表画布要它来画总体分布（不能跟着表格的筛选一起缩，否则一点柱子就只剩一根），
 * 其余画布用它算统计 —— 统计必须反映全量，否则页签上的数字会跟着筛选变，
 * 用户就再也点不回「全部」。</p>
 */
const allViews = computed(() => toSessionViews(sessions.value, hostMap.value, now.value))

/** 全量统计 */
const stats = computed(() => countByStatus(sessions.value))

/** 已筛选的展示行 */
const views = computed(() =>
  toSessionViews(filterSessions(sessions.value, filters, hostMap.value), hostMap.value, now.value),
)

/** 是否有任何生效的条件（用于页头「清除筛选」） */
const hasFilter = computed(
  () =>
    Boolean(filters.keyword.trim()) ||
    Boolean(filters.protocol) ||
    Boolean(filters.ip) ||
    Boolean(filters.status) ||
    filters.hourBucket !== null,
)

/** 时段条件的中文说明 */
const bucketText = computed(() => {
  if (filters.hourBucket === null) return ''
  const from = filters.hourBucket
  const to = Math.min(from + SESSION_BUCKET_HOURS, 24)
  const p = (n: number): string => String(n).padStart(2, '0')
  return `${p(from)}:00–${p(to)}:00`
})

/**
 * 应用筛选补丁。
 *
 * <p>画布只管发「用户改了什么」，合并逻辑在这里，因此不会有画布漏字段。</p>
 *
 * @param patch 条件补丁
 */
function onFilter(patch: Partial<SessionFilters>): void {
  Object.assign(filters, patch)
}

/** 清除全部条件 —— 页头那个 × 用它，避免用户逐个回退 */
function clearFilters(): void {
  Object.assign(filters, EMPTY_SESSION_FILTERS)
}

/**
 * 打开详情抽屉
 *
 * @param row 展示行
 */
function openDetail(row: SessionView): void {
  detailView.value = row
  detailVisible.value = true
}

/** 刷新会话记录 */
async function refresh(): Promise<void> {
  loading.value = true
  try {
    const audit = await getSessions()
    sessions.value = audit ?? []
    now.value = new Date()
  } catch (e) {
    message.error((e as Error).message)
  } finally {
    loading.value = false
  }
}

/**
 * 强制关闭会话
 *
 * @param row 展示行
 */
async function onForceClose(row: SessionView): Promise<void> {
  try {
    await message.confirm(`确认强制关闭「${row.host}」的会话？`, '强制关闭')
  } catch {
    return
  }
  try {
    await closeSession(row.id)
    message.success('已关闭')
    detailVisible.value = false
    await refresh()
  } catch (e) {
    message.error((e as Error).message)
  }
}

/**
 * 时钟：30 秒一跳。
 *
 * <p>只在有进行中会话时才需要它（时长与「现在」都在动），但常驻一个 30 秒定时器
 * 的成本远低于「有没有开着的会话」这个判断本身的复杂度 —— 而且它顺带让
 * 时间带上的「现在」竖线也在走。</p>
 */
let clock: ReturnType<typeof setInterval> | null = null

onMounted(async () => {
  const hosts = await queryHosts().catch(() => [])
  for (const h of hosts ?? []) hostMap.value[h.id] = h.serverHostName
  await refresh()
  clock = setInterval(() => {
    now.value = new Date()
  }, 30_000)
})

onUnmounted(() => {
  if (clock) clearInterval(clock)
  clock = null
})
</script>

<template>
  <div class="pk-page">
    <div class="pk-head">
      <div class="pk-head__titles">
        <h2 class="pk-head__title">会话审计</h2>
        <p class="pk-head__desc">
          终端连接流水：谁在什么时候登过哪台主机、开了多久、怎么结束的。
        </p>
      </div>

      <div class="pk-head__actions">
        <!-- 生效中的条件集中在这里：条件可能是别的画布设下的，必须一眼看见、一键清除 -->
        <button
          v-if="filters.hourBucket !== null"
          type="button"
          class="cond"
          title="清除时段条件"
          @click="onFilter({ hourBucket: null })"
        >
          时段 {{ bucketText }}<span class="cond__x">×</span>
        </button>
        <button v-if="hasFilter" type="button" class="pk-link" @click="clearFilters">清除筛选</button>
      </div>
    </div>

    <SessionConsole
      v-if="variant === 'console'"
      :rows="views"
      :stats="stats"
      :loading="loading"
      :filters="filters"
      @filter="onFilter"
      @refresh="refresh"
      @detail="openDetail"
      @close="onForceClose"
    />

    <SessionInstrument
      v-else-if="variant === 'instrument'"
      :rows="views"
      :all-rows="allViews"
      :stats="stats"
      :loading="loading"
      :filters="filters"
      @filter="onFilter"
      @refresh="refresh"
      @detail="openDetail"
    />

    <SessionRhythm
      v-else-if="variant === 'rhythm'"
      :rows="views"
      :stats="stats"
      :loading="loading"
      :filters="filters"
      :now="now"
      @filter="onFilter"
      @refresh="refresh"
      @detail="openDetail"
      @close="onForceClose"
    />

    <SessionDossier
      v-else-if="variant === 'dossier'"
      :rows="views"
      :stats="stats"
      :loading="loading"
      :filters="filters"
      :now="now"
      @filter="onFilter"
      @refresh="refresh"
      @close="onForceClose"
    />

    <SessionWall
      v-else
      :rows="views"
      :stats="stats"
      :loading="loading"
      :filters="filters"
      @filter="onFilter"
      @refresh="refresh"
      @detail="openDetail"
      @close="onForceClose"
    />

    <!-- 详情抽屉：只有档案柜不用它（它的详情常驻右栏） -->
    <ReDrawer
      v-model="detailVisible"
      title="会话详情"
      direction="rtl"
      size="460px"
      destroy-on-close
      close-only
      :footer-hidden="true"
    >
      <template #content>
        <ReDescriptions v-if="detailView" :column="1" border>
          <ReDescriptionsItem label="主机">{{ detailView.host }}</ReDescriptionsItem>
          <ReDescriptionsItem label="协议">{{ detailView.protocol }}</ReDescriptionsItem>
          <ReDescriptionsItem label="用户">{{ detailView.user }}</ReDescriptionsItem>
          <ReDescriptionsItem label="客户端 IP">{{ detailView.ip }}</ReDescriptionsItem>
          <ReDescriptionsItem label="连接时间">{{ detailView.connectText }}</ReDescriptionsItem>
          <ReDescriptionsItem label="关闭时间">
            {{ detailView.isOpen ? '— 会话仍在' : detailView.closeText }}
          </ReDescriptionsItem>
          <ReDescriptionsItem label="持续时长">{{ detailView.durationText }}</ReDescriptionsItem>
          <ReDescriptionsItem label="状态">
            <span class="pk-state">
              <i class="pk-dot" :class="detailView.isOpen ? 'pk-dot--live' : ''" />
              {{ detailView.statusText }}
            </span>
          </ReDescriptionsItem>
          <ReDescriptionsItem label="关闭原因">
            {{ detailView.closeReason || (detailView.isOpen ? '—' : '未记录') }}
          </ReDescriptionsItem>
        </ReDescriptions>
        <div v-if="detailView?.isOpen" class="drawer-actions">
          <ReButton type="danger" @click="onForceClose(detailView)">强制关闭</ReButton>
        </div>
      </template>
    </ReDrawer>

    <RePageVariantDock
      v-if="dockVisible"
      :items="items"
      :model-value="variant"
      page-label="会话审计"
      @update:model-value="setVariant"
    />
  </div>
</template>

<style scoped>
/* 生效中的条件胶囊 */
.cond {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  height: 28px;
  padding: 0 6px 0 10px;
  font-size: 12px;
  color: var(--el-color-primary);
  background: var(--el-color-primary-light-9);
  border: 1px solid var(--el-color-primary-light-7);
  border-radius: var(--el-radius-full, 9999px);
  cursor: pointer;
  outline: none;
}

.cond:hover {
  background: var(--el-color-primary-light-8);
}

.cond:focus-visible {
  box-shadow: 0 0 0 3px color-mix(in srgb, var(--el-color-primary) 18%, transparent);
}

.cond__x {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 16px;
  height: 16px;
  font-size: 12px;
  border-radius: 50%;
  background: color-mix(in srgb, var(--el-color-primary) 14%, transparent);
}

.drawer-actions {
  display: flex;
  justify-content: flex-end;
  margin-top: 16px;
}
</style>
