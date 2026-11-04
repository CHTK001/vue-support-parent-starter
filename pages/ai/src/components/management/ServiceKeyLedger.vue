<template>
  <div class="svc-ledger">
    <!-- ── 台账工具条：把「筛选 → 复核 → 签发」压成一行，签发是全页唯一强调动作 ── -->
    <div class="svc-toolbar">
      <span class="svc-count"><b>{{ rows.length }}</b> 把 AppKey</span>
      <el-input
        v-model="keyword"
        class="svc-search"
        placeholder="过滤名称 / Key / 模型"
        clearable
      />
      <div class="svc-seg" role="group" aria-label="按配额方式筛选">
        <button
          v-for="q in QUOTA_FILTERS"
          :key="q.v"
          class="svc-seg__btn"
          :class="{ 'is-active': quotaFilter === q.v }"
          :aria-pressed="quotaFilter === q.v"
          @click="quotaFilter = q.v"
        >{{ q.t }}</button>
      </div>
      <el-button class="svc-btn" :loading="loading" @click="load">刷新</el-button>
      <el-button type="primary" @click="openCreate">
        <el-icon class="svc-btn__icon" aria-hidden="true"><AddIcon /></el-icon>
        新建 AppKey
      </el-button>
    </div>

    <!-- 口径说明：这是整页唯一需要「读一句就懂」的地方，故放在账页前缀 -->
    <p class="svc-ledger__note">
      AppKey 是服务实例与网关<b>共用</b>的唯一凭证：同一把 Key 可在任意实例端口调用；
      可用模型 = 所属分组清单 ∩ Key 上的限定模型；额度按时间 / 次数 / 余额三选一。
    </p>

    <!-- 错误条：旧数据不清空，台账继续可读 -->
    <div class="svc-alert is-danger" v-if="error">
      <span class="svc-alert__text">Key 台账加载失败：{{ error }}</span>
      <button class="svc-alert__act" @click="load">重试</button>
    </div>
    <div class="svc-alert is-warn" v-if="modelError">
      <span class="svc-alert__text">模型清单加载失败：{{ modelError }}（新建时无法从模型管理选模型）</span>
      <button class="svc-alert__act" @click="loadModels">重试</button>
    </div>

    <!-- ── 台账表：一把 Key 一行，余量尺是全表唯一的图形编码 ── -->
    <div class="svc-tablewrap is-ledger" :class="{ 'is-busy': loading && !!rows.length }">
      <span class="svc-scanline" v-if="loading && !!rows.length" aria-hidden="true"></span>
      <ReTable
        :data="filteredRows"
        :columns="columns"
        :loading="loading && !rows.length"
        :layout-table="{ maxHeight: 520 }"
        :settings="{ border: false, stripe: true }"
        :config="{ pagination: { enable: false }, toolbar: { enable: false } }"
        row-key="id"
        class="svc-table"
      >
        <!-- Key 本体：名称主行 + Key 值次行（点一下复制，密钥不占主视线） -->
        <template #col-key="{ row }">
          <div class="svc-key">
            <b class="svc-key__name" :title="row.name">{{ row.name }}</b>
            <button class="svc-key__token" :title="`复制 ${row.key}`" @click="copy(row.key)">
              <span>{{ shortKey(row.key) }}</span>
              <el-icon aria-hidden="true"><CopyIcon /></el-icon>
            </button>
          </div>
        </template>

        <!-- 绑定模型：台面上最多露两个，其余收进 +N 的悬浮清单 -->
        <template #col-models="{ row }">
          <div class="svc-models" v-if="row.models.length">
            <span class="svc-chip" v-for="m in row.models.slice(0, 2)" :key="m" :title="m">{{ m }}</span>
            <el-tooltip v-if="row.models.length > 2" placement="top" :show-after="180">
              <template #content>
                <div class="svc-model-list">
                  <span v-for="m in row.models" :key="m">{{ m }}</span>
                </div>
              </template>
              <span class="svc-chip is-more">+{{ row.models.length - 2 }}</span>
            </el-tooltip>
          </div>
          <span class="svc-chip is-empty" v-else :title="row.groupName ? `继承分组「${row.groupName}」的模型清单` : '未限制模型'">
            {{ row.groupName ? '随分组' : '不限' }}
          </span>
        </template>

        <!-- 配额方式 + 该方式下的额度 -->
        <template #col-quota="{ row }">
          <div class="svc-quota">
            <span class="svc-quota__type" :class="'is-' + row.quotaType">{{ row.quotaLabel }}</span>
            <i class="svc-quota__val">{{ row.quotaValue }}</i>
          </div>
        </template>

        <!-- 余量：条形 + 数字 + 口径（三件都不可省，颜色只是第三重） -->
        <template #col-remain="{ row }">
          <div class="svc-gauge" :class="'is-' + row.tone">
            <div class="svc-gauge__track" role="img" :aria-label="`余量 ${row.remainText}`">
              <i :style="{ width: row.remainPct + '%' }"></i>
            </div>
            <div class="svc-gauge__text">
              <b>{{ row.remainText }}</b>
              <i>{{ row.remainSub }}</i>
            </div>
          </div>
        </template>

        <template #col-last="{ row }">
          <span class="svc-num" :title="row.lastUsedAt || '尚未调用'">{{ row.lastUsedText }}</span>
        </template>

        <template #col-status="{ row }">
          <span class="svc-badge" :class="row.statusCls"><i aria-hidden="true"></i>{{ row.statusText }}</span>
        </template>

        <template #col-actions="{ row }">
          <div class="svc-acts">
            <button class="svc-ico" title="编辑（名称 / 分组 / 模型 / 配额）" aria-label="编辑" @click="openEdit(row)">
              <el-icon><EditIcon /></el-icon>
            </button>
            <button
              class="svc-ico"
              v-if="row.numMode"
              title="续量 / 重置用量"
              aria-label="续量或重置用量"
              @click="openQuota(row)"
            >
              <el-icon><QuotaIcon /></el-icon>
            </button>
            <button
              class="svc-ico"
              v-if="row.numMode === 'balance'"
              title="充值余额"
              aria-label="充值余额"
              @click="openRecharge(row)"
            >
              <el-icon><CoinIcon /></el-icon>
            </button>
            <button
              class="svc-ico"
              :title="row.enabled ? '停用该 Key' : '启用该 Key'"
              :aria-label="row.enabled ? '停用' : '启用'"
              @click="toggle(row)"
            >
              <el-icon><component :is="row.enabled ? LockIcon : UnlockIcon" /></el-icon>
            </button>
            <button class="svc-ico svc-ico--danger" title="删除该 Key" aria-label="删除" @click="remove(row)">
              <el-icon><DeleteIcon /></el-icon>
            </button>
          </div>
        </template>

        <template #empty>
          <div class="svc-empty">
            <span class="svc-empty__mark" aria-hidden="true"></span>
            <b>{{ emptyText }}</b>
            <i>{{ emptyHint }}</i>
            <el-button v-if="!rows.length" type="primary" class="svc-btn" style="margin-top: 6px" @click="openCreate">
              <el-icon class="svc-btn__icon" aria-hidden="true"><AddIcon /></el-icon>
              新建第一把 AppKey
            </el-button>
          </div>
        </template>
      </ReTable>
    </div>

    <!-- ════════════ 新建 / 编辑 AppKey ════════════ -->
    <ReDialog
      v-model="showForm"
      :title="editing ? '编辑 AppKey' : '新建 AppKey'"
      width="min(560px, 94vw)"
      append-to-body
    >
      <!-- 弹窗内容包一层 .svc：设计令牌（--svc-*）与 el-* 微调都挂在该作用域上，
           而 el-dialog 是 Teleport 到 body 的，不包这一层会拿到未定义的 var() -->
      <div class="svc">
        <el-form :model="form" label-width="96px" class="svc-form">
          <el-form-item label="名称" required>
            <el-input v-model="form.name" placeholder="如：博客机器人 / 前端生产" maxlength="40" show-word-limit />
          </el-form-item>

          <!-- 分组：可选。绑定分组后可用模型自动收窄到分组清单，分组改了 Key 跟着变 -->
          <el-form-item label="所属分组">
            <el-select
              v-if="groupOptions.length"
              v-model="form.groupId"
              class="svc-form__wide"
              clearable
              placeholder="不绑定分组（仅受下面的限定模型约束）"
            >
              <el-option v-for="g in groupOptions" :key="g.id" :label="g.name" :value="g.id" />
            </el-select>
            <span v-else class="svc-form__hint">暂无分组（或当前账号无权读取分组清单）</span>
          </el-form-item>

          <!-- 限定模型：候选来自「模型管理」，留空表示随分组 -->
          <el-form-item label="限定模型">
            <el-select
              v-model="form.models"
              class="svc-form__wide"
              multiple
              filterable
              collapse-tags
              collapse-tags-tooltip
              :loading="modelsLoading"
              placeholder="从模型管理选择允许调用的模型"
            >
              <el-option-group v-for="g in modelGroups" :key="g.key" :label="g.label">
                <el-option v-for="code in g.models" :key="code" :label="code" :value="code" />
              </el-option-group>
            </el-select>
            <span class="svc-form__hint">
              {{ modelHint }}
            </span>
          </el-form-item>

          <!-- 配额方式：三选一，决定下面填哪一项额度 -->
          <el-form-item label="配额方式" required>
            <div class="svc-seg" role="group" aria-label="配额方式">
              <button
                v-for="q in QUOTA_MODES"
                :key="q.v"
                type="button"
                class="svc-seg__btn"
                :class="{ 'is-active': form.quotaType === q.v }"
                :aria-pressed="form.quotaType === q.v"
                @click="pickQuota(q.v)"
              >{{ q.t }}</button>
            </div>
          </el-form-item>

          <!-- 按时间 -->
          <el-form-item v-if="form.quotaType === 'time'" label="到期时间" required>
            <el-date-picker
              v-model="form.expireTime"
              type="datetime"
              value-format="YYYY-MM-DDTHH:mm:ss"
              placeholder="选择到期时间"
              class="svc-form__wide"
            />
            <div class="svc-presets">
              <button
                v-for="p in EXPIRY_PRESETS"
                :key="p.days"
                type="button"
                class="svc-chip is-act"
                @click="form.expireTime = expiryAfter(p.days)"
              >{{ p.text }}</button>
            </div>
            <span class="svc-form__hint">到期即失效，续期请回到这里改时间</span>
          </el-form-item>

          <!-- 按次数 -->
          <el-form-item v-if="form.quotaType === 'count'" label="可用次数" required>
            <ReNumberInput v-model="form.maxUse" :min="1" :step="100" />
            <span class="svc-form__hint">累计调用次数用尽即失效；每次请求（含失败）计 1 次</span>
          </el-form-item>

          <!-- 按余额 -->
          <el-form-item v-if="form.quotaType === 'balance'" label="Token 总量" required>
            <ReNumberInput v-model="form.maxTokens" :min="1" :step="100000" />
            <span class="svc-form__hint">余额 = 总量 − 已耗 Token，用尽即失效；可随时续量</span>
          </el-form-item>

          <el-form-item v-if="!editing" label="初始余额">
            <ReNumberInput v-model="form.balance" :min="0" :step="10" />
            <span class="svc-form__hint">元；余额用于按分钟计费，为负且不允许透支时请求会被 402 拦下</span>
          </el-form-item>

          <el-form-item label="启用" v-if="editing">
            <el-switch v-model="form.enabled" />
            <span class="svc-form__hint">停用后使用该 Key 的请求一律被拒绝</span>
          </el-form-item>

          <!-- IP 白名单：唯一按「来源」而不是按「用量」拦的类型 -->
          <el-form-item label="IP 白名单">
            <el-input
              v-model="form.ipWhitelist"
              class="svc-form__wide"
              placeholder="留空 = 不限制；多个用英文逗号分隔；* = 全部允许"
              clearable
            />
            <span class="svc-form__hint">
              只拦「Known IP」：取不到客户端 IP 时不做判定，避免把代理后的正常请求挡在门外
            </span>
          </el-form-item>

          <el-form-item label="允许透支">
            <el-switch v-model="form.overdraftEnabled" />
            <span class="svc-form__hint">
              关闭时余额为负会被 402 拦下；开启后余额可继续走负（账单照记）
            </span>
          </el-form-item>
        </el-form>
      </div>

      <template #footer>
        <el-button @click="showForm = false">取消</el-button>
        <el-button type="primary" :loading="saving" @click="submit">
          {{ editing ? '保存' : '创建' }}
        </el-button>
      </template>
    </ReDialog>

    <!-- ════════════ 续量 / 重置用量 ════════════ -->
    <ReDialog v-model="showQuota" title="续量 / 重置用量" width="min(430px, 92vw)" append-to-body>
      <div class="svc">
        <div class="svc-quotaform">
          <p class="svc-quotaform__lead">
            <b>{{ quotaTarget?.name }}</b>
            <i>{{ quotaTarget?.quotaLabel }} · 余量 {{ quotaTarget?.remainText }}</i>
          </p>
          <el-form label-width="84px">
            <el-form-item :label="quotaTarget?.numMode === 'count' ? '可用次数' : 'Token 总量'">
              <ReNumberInput
                v-model="quotaNewTotal"
                :min="1"
                :step="quotaTarget?.numMode === 'count' ? 100 : 100000"
              />
            </el-form-item>
          </el-form>
          <p class="svc-quotaform__hint">
            上限改成上面的值（已用量不动）；勾选「同时清零已用」则从零重新起算 —— 换周期、
            加预算都用这一处，不再另开「加法」与「重置」两个按钮。
          </p>
          <el-checkbox v-model="quotaReset">同时清零已用</el-checkbox>
        </div>
      </div>
      <template #footer>
        <el-button @click="showQuota = false">取消</el-button>
        <el-button type="primary" :loading="!!adjusting" @click="adjust">保存</el-button>
      </template>
    </ReDialog>

    <!-- ════════════ 充值余额 ════════════ -->
    <ReDialog v-model="showRecharge" title="充值余额" width="min(400px, 92vw)" append-to-body>
      <div class="svc">
        <div class="svc-quotaform">
          <p class="svc-quotaform__lead">
            <b>{{ rechargeTarget?.name }}</b>
            <i>当前余额 ¥{{ rechargeTarget?.balanceText }}</i>
          </p>
          <el-form label-width="84px">
            <el-form-item label="充值金额">
              <ReNumberInput v-model="rechargeAmount" :min="1" :step="50" />
            </el-form-item>
            <el-form-item label="备注">
              <el-input v-model="rechargeRemark" placeholder="可选" maxlength="60" />
            </el-form-item>
          </el-form>
        </div>
      </div>
      <template #footer>
        <el-button @click="showRecharge = false">取消</el-button>
        <el-button type="primary" :loading="!!recharging" @click="doRecharge">充值</el-button>
      </template>
    </ReDialog>
  </div>
</template>

<script setup lang="ts">
/**
 * Key 台账（服务配置页的主视图 / 独立「访问令牌」页复用）。
 *
 * <p>数据源是 <b>appKey</b>（{@code /v2/app-keys}），不是已停签的服务实例令牌：
 * 服务实例对外暴露的 {@code /v1/models}、{@code /v1/chat/completions}、
 * {@code /v1/messages}、Gemini 生成，与网关 {@code /v2/v1/*} 一样按 appKey 鉴权。
 * 同一把 Key 因此可以在任意实例端口使用，台账不再按实例分页签。</p>
 *
 * <p>三处刻意的设计取舍：</p>
 * <ul>
 *   <li><b>模型范围两层</b>：所属分组的模型清单（{@code sys_ai_group_models}）∩ Key 上的
 *       限定模型（{@code sys_ai_app_key_model}）。分组管「这批 Key 能用什么」，Key 管
 *       「这一把再收窄到哪几个」，所以限定模型留空 ≠ 不限制，而是「随分组」。</li>
 *   <li><b>配额三选一</b>：按时间（{@code expire_datetime}）/ 按次数（{@code max_use}）/
 *       按余额（{@code max_tokens} 总量，另有充值余额 {@code balance}）。方式决定表单填哪一项，
 *       也决定余量尺怎么算；后端对已填写的额度逐条判定，切换方式时不会留下旧约束。</li>
 *   <li><b>余量尺</b>：条形是形状编码，数字与口径是文本编码，颜色排第三 —— 灰度或色弱
 *       环境下仍能读出「还剩多少、按什么算的」。</li>
 * </ul>
 */
import { message } from '@repo/core'
import { computed, onMounted, ref, watch } from 'vue'
import { ElMessageBox } from 'element-plus'
import { adminApi } from '@/framework/context'
import { appKeyApi, groupApi, topupApi } from '@/services/javaApi'
import {
  Add24Regular, Money24Regular, Copy24Regular, Edit24Regular, History24Regular,
} from '@vicons/fluent'
import { Delete, Lock, Unlock } from '@element-plus/icons-vue'
import ReTable from '@repo/ui/re-table'
import type { ReTableColumn } from '@repo/ui/re-table'
import ReDialog from '@repo/ui/re-dialog'
import ReNumberInput from '@/components/ui/ReNumberInput.vue'

const props = withDefaults(
  defineProps<{
    /** 外部「全部刷新」按钮的计数器：变化即重载 */
    refreshKey?: number
  }>(),
  { refreshKey: 0 },
)

const emit = defineEmits<{
  (e: 'stats', v: { total: number; usable: number; atRisk: number; usedTokens: number }): void
  /** 台账发生写操作（新建 / 编辑 / 删除）：父级据此刷新分组台账的成员数 */
  (e: 'changed'): void
}>()

const AddIcon = Add24Regular
const CopyIcon = Copy24Regular
const EditIcon = Edit24Regular
const QuotaIcon = History24Regular
const CoinIcon = Money24Regular
const DeleteIcon = Delete
const LockIcon = Lock
const UnlockIcon = Unlock

// ============================================================================
// 常量
// ============================================================================
const QUOTA_MODES = [
  { v: 'time', t: '按时间' },
  { v: 'count', t: '按次数' },
  { v: 'balance', t: '按余额' },
]
const QUOTA_FILTERS = [{ v: 'all', t: '全部' }, ...QUOTA_MODES]
const QUOTA_LABEL: Record<string, string> = {
  time: '按时间',
  count: '按次数',
  balance: '按余额',
}
const EXPIRY_PRESETS = [
  { days: 1, text: '1 天' },
  { days: 7, text: '7 天' },
  { days: 30, text: '30 天' },
  { days: 90, text: '90 天' },
  { days: 365, text: '1 年' },
]
/** 距到期不足 7 天算「即将到期」，与余量尺的告警档同口径 */
const SOON_MS = 7 * 24 * 3600 * 1000

// ============================================================================
// 纯函数
// ============================================================================
/**
 * 解析后端无时区 {@code LocalDateTime}（"2026-12-28 14:03:11"）。
 *
 * <p>绝不 {@code new Date(str)}：Chrome 能解析带空格的变体，Firefox / Safari 给
 * Invalid Date。这里按 {@code yyyy-MM-dd HH:mm:ss} 手工分段后本地构造。</p>
 */
function parseDateTime(raw: unknown): Date | null {
  if (raw == null || raw === '') return null
  const s = String(raw).trim()
  const m = s.match(/^(\d{4})-(\d{2})-(\d{2})[ T](\d{2}):(\d{2})(?::(\d{2}))?/)
  if (!m) return null
  const d = new Date(+m[1], +m[2] - 1, +m[3], +m[4], +m[5], m[6] ? +m[6] : 0)
  return isNaN(d.getTime()) ? null : d
}
const pad2 = (n: number) => (n < 10 ? '0' + n : String(n))

/** 时间列：本年显示 MM-DD HH:mm，跨年显示 YYYY-MM-DD */
function shortTime(raw: unknown): string {
  const d = parseDateTime(raw)
  if (!d) return '—'
  const now = new Date()
  const md = pad2(d.getMonth() + 1) + '-' + pad2(d.getDate())
  const hm = pad2(d.getHours()) + ':' + pad2(d.getMinutes())
  return d.getFullYear() === now.getFullYear() ? `${md} ${hm}` : `${d.getFullYear()}-${md}`
}

/** 12345 → 12.3k；1.2e6 → 1.2M（台账列宽有限，长数字必须压缩） */
function formatCompact(n: unknown): string {
  const v = Number(n)
  if (!isFinite(v) || v <= 0) return '0'
  if (v >= 1e6) return (v / 1e6).toFixed(1).replace(/\.0$/, '') + 'M'
  if (v >= 1e4) return (v / 1e3).toFixed(1).replace(/\.0$/, '') + 'k'
  return String(Math.round(v))
}
function formatInt(n: unknown): string {
  const v = Number(n)
  return isFinite(v) ? Math.round(v).toLocaleString() : '0'
}
/** Key 只露尾部 8 位：一眼分辨「是不是这把」，又不至于把整串密钥摊在屏幕上 */
function shortKey(t: string): string {
  const s = t || ''
  return s.length <= 12 ? s : '…' + s.slice(-8)
}

/** el-date-picker 需要的 'YYYY-MM-DDTHH:mm:ss' */
function toPickerValue(d: Date): string {
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}T` +
    `${pad2(d.getHours())}:${pad2(d.getMinutes())}:${pad2(d.getSeconds())}`
}
/** el-date-picker 的值 → 后端 'yyyy-MM-dd HH:mm:ss'（后端按固定格式解析） */
function toApiTime(v: string): string | null {
  if (!v) return null
  return v.replace('T', ' ')
}
function expiryAfter(days: number): string {
  const d = new Date(Date.now() + days * 24 * 3600 * 1000)
  d.setHours(23, 59, 0, 0)
  return toPickerValue(d)
}

/** 配额方式归一：appKey 没有 quota_type 列，按已填的额度回推主约束 */
function normalizeQuota(r: any): string {
  if (r?.expireTime) return 'time'
  if (r?.maxUse != null && Number(r.maxUse) > 0) return 'count'
  if (r?.maxTokens != null && Number(r.maxTokens) > 0) return 'balance'
  return 'time'
}

/** 限定模型：逗号分隔串 → 去重数组 */
function splitModels(raw: unknown): string[] {
  if (raw == null || raw === '') return []
  const parts = Array.isArray(raw) ? raw.map(String) : String(raw).split(',')
  const seen: string[] = []
  for (const p of parts) {
    const v = p.trim()
    if (v && !seen.includes(v)) seen.push(v)
  }
  return seen
}

function asList(payload: any): any[] {
  if (Array.isArray(payload)) return payload
  if (payload && Array.isArray(payload.data)) return payload.data
  if (payload && Array.isArray(payload.records)) return payload.records
  return []
}

// ============================================================================
// 状态
// ============================================================================
const rows = ref<any[]>([])
const loading = ref(false)
const error = ref('')
const keyword = ref('')
const quotaFilter = ref('all')
const showForm = ref(false)
const editing = ref<any>(null)
const saving = ref(false)
const showQuota = ref(false)
const quotaTarget = ref<any>(null)
const quotaNewTotal = ref(0)
const quotaReset = ref(false)
const adjusting = ref(false)
const showRecharge = ref(false)
const rechargeTarget = ref<any>(null)
const rechargeAmount = ref(100)
const rechargeRemark = ref('')
const recharging = ref(false)
const modelGroups = ref<Array<{ key: string; label: string; models: string[] }>>([])
const modelsLoading = ref(false)
const modelError = ref('')
const groupOptions = ref<Array<{ id: number; name: string }>>([])

// ============================================================================
// 行映射：把接口字段摊平成模板直接可读的「账页字段」
// ============================================================================
function decorate(r: any) {
  const quotaType = normalizeQuota(r)
  const maxUse = r.maxUse == null ? null : Number(r.maxUse)
  const useCount = r.useCount == null ? 0 : Number(r.useCount)
  const maxTokens = r.maxTokens == null ? null : Number(r.maxTokens)
  const usedTokens = r.totalTokens == null ? 0 : Number(r.totalTokens)
  const balance = r.balance == null ? 0 : Number(r.balance)
  const enabled = r.enabled === true
  const expires = parseDateTime(r.expireTime)
  const now = Date.now()
  // 数字型额度（次数 / Token 总量）与「配额方式」分开记：一把 Key 可能既有到期时间
  // 又有次数上限，续量按钮要挂在真实存在的那个数字上限上，而不是挂在展示用的方式上
  const numMode = maxUse && maxUse > 0 ? 'count' : (maxTokens && maxTokens > 0 ? 'balance' : '')

  let remainPct = 100
  let remainText = '不限'
  let remainSub = ''
  let quotaValue = '不限'
  if (quotaType === 'count' && maxUse) {
    const left = Math.max(0, maxUse - useCount)
    remainPct = Math.round((left / maxUse) * 100)
    remainText = `${formatInt(left)} 次`
    remainSub = `已用 ${formatInt(useCount)} / ${formatInt(maxUse)}`
    quotaValue = `${formatInt(maxUse)} 次`
  } else if (quotaType === 'balance' && maxTokens) {
    const left = Math.max(0, maxTokens - usedTokens)
    remainPct = Math.round((left / maxTokens) * 100)
    remainText = `${formatCompact(left)} Token`
    remainSub = `已耗 ${formatCompact(usedTokens)} / ${formatCompact(maxTokens)} · 余额 ¥${balance.toFixed(2)}`
    quotaValue = `${formatCompact(maxTokens)} Token`
  } else {
    // 按时间：余量尺画「有效期还剩多少」——起点用创建时间，终点用到期时间
    const start = parseDateTime(r.createdAt) || (expires ? new Date(expires.getTime() - 30 * 86400000) : null)
    if (!expires) {
      remainPct = 100
      remainText = '长期有效'
      remainSub = '未设到期'
      quotaValue = '不过期'
    } else {
      const leftMs = expires.getTime() - now
      if (leftMs <= 0) {
        remainPct = 0
        remainText = '已到期'
        remainSub = `到期 ${shortTime(r.expireTime)}`
      } else {
        const total = start ? Math.max(1, expires.getTime() - start.getTime()) : 1
        remainPct = Math.max(1, Math.min(100, Math.round((leftMs / total) * 100)))
        const days = Math.floor(leftMs / 86400000)
        remainText = days >= 1 ? `${days} 天` : `${Math.max(1, Math.round(leftMs / 3600000))} 小时`
        remainSub = `到期 ${shortTime(r.expireTime)}`
      }
      quotaValue = `至 ${shortTime(r.expireTime)}`
    }
  }

  // 状态：停用 > 到期 > 额度用尽 > 即将到期 > 可用
  let statusCls = 'is-ok'
  let statusText = '可用'
  if (!enabled) {
    statusCls = 'is-stopped'
    statusText = '已停用'
  } else if (expires && expires.getTime() <= now) {
    statusCls = 'is-down'
    statusText = '已到期'
  } else if ((quotaType === 'count' && maxUse && useCount >= maxUse)
    || (quotaType === 'balance' && maxTokens && usedTokens >= maxTokens)) {
    statusCls = 'is-down'
    statusText = '额度用尽'
  } else if (expires && expires.getTime() - now <= SOON_MS) {
    statusCls = 'is-down'
    statusText = '即将到期'
  }

  // 余量尺颜色：<15% 告警，<40% 提醒，其余正常；停用一律走中性灰
  let tone = 'ok'
  if (!enabled) tone = 'mute'
  else if (remainPct <= 15) tone = 'danger'
  else if (remainPct <= 40) tone = 'warn'

  return {
    id: r.id,
    name: r.name ?? '未命名 Key',
    key: r.key ?? '',
    groupId: r.groupId ?? null,
    groupName: r.groupName ?? '',
    // 台账不编辑这三项，但编辑接口按字段全量覆盖 —— 必须原样带回去，
    // 否则在别处（供应商面板 / IP 白名单 / 备注）设置的绑定关系会被这次保存抹掉
    provider: r.provider ?? null,
    ipWhitelist: r.ipWhitelist ?? null,
    remark: r.remark ?? null,
    quotaType,
    numMode,
    quotaLabel: QUOTA_LABEL[quotaType] || '按时间',
    quotaValue,
    expireTime: r.expireTime ?? '',
    createdAt: r.createdAt ?? '',
    lastUsedAt: r.lastUsedTime ?? '',
    lastUsedText: r.lastUsedTime ? shortTime(r.lastUsedTime) : '未调用',
    maxUse,
    useCount,
    maxTokens,
    usedTokens,
    balance,
    balanceText: balance.toFixed(2),
    models: splitModels(r.model),
    enabled,
    remainPct,
    remainText,
    remainSub,
    tone,
    statusCls,
    statusText,
  }
}

const columns = computed<ReTableColumn[]>(() => [
  { prop: 'name', label: 'AppKey', minWidth: 188, slot: 'key' },
  { prop: 'models', label: '可用模型', minWidth: 190, slot: 'models' },
  { prop: 'quotaType', label: '配额方式', width: 132, slot: 'quota' },
  { prop: 'remain', label: '余量', minWidth: 200, slot: 'remain' },
  { prop: 'lastUsedAt', label: '最近使用', width: 104, slot: 'last' },
  { prop: 'status', label: '状态', width: 96, slot: 'status' },
  { prop: 'actions', label: '操作', width: 186, slot: 'actions' },
])

const filteredRows = computed(() => {
  const kw = keyword.value.trim().toLowerCase()
  return rows.value.filter((r) => {
    if (quotaFilter.value !== 'all' && r.quotaType !== quotaFilter.value) return false
    if (!kw) return true
    return (r.name + ' ' + r.key + ' ' + r.models.join(' ') + ' ' + r.groupName).toLowerCase().includes(kw)
  })
})

const emptyText = computed(() => (rows.value.length ? '没有匹配的 Key' : '还没有 AppKey'))
const emptyHint = computed(() =>
  rows.value.length
    ? '换个关键词，或把配额方式筛选切回「全部」'
    : '新建后即可用这把 Key 调用服务实例与网关；模型范围来自分组与限定模型，额度可按时间 / 次数 / 余额计',
)
const modelHint = computed(() =>
  modelGroups.value.length
    ? '候选来自模型管理（供应商 → 模型）；留空 = 沿用分组的模型清单，越权请求一律 403'
    : '模型管理里还没有可用模型，可先留空（沿用分组清单）',
)

// ============================================================================
// 加载
// ============================================================================
/**
 * 取出响应体里真正想要的载荷。
 *
 * <p>本页两个出口的信封形状不同：{@code /v2/app-keys} 返回 {@code {code,data,msg}}，
 * 而 {@code /v2/groups} 是<b>裸数组</b>（控制器直接 {@code return List}）。两者都要能读，
 * 所以裸数组原样返回，其余才取 {@code data}。</p>
 */
function pick(res: any): any {
  if (res && res.success === false) throw new Error(res.msg || res.message || '请求被拒绝')
  if (Array.isArray(res)) return res
  return res?.data ?? res
}

async function load() {
  loading.value = true
  error.value = ''
  try {
    const res = await appKeyApi.list()
    rows.value = asList(pick(res)).map(decorate)
    emit('stats', {
      total: rows.value.length,
      usable: rows.value.filter((r) => r.statusText === '可用').length,
      atRisk: rows.value.filter((r) => r.statusCls === 'is-down').length,
      usedTokens: rows.value.reduce((s, r) => s + (isFinite(r.usedTokens) ? r.usedTokens : 0), 0),
    })
  } catch (e: any) {
    // 旧数据不清空：接口抖一下不该让整页变白
    error.value = e?.message || String(e)
  } finally {
    loading.value = false
  }
}

/**
 * 模型候选：与全站模型选择器同源（供应商 → 模型），按模型编码全局去重。
 *
 * <p>用 {@code /api/providers} 而不是 {@code /v2/models}：后者是 sys_ai_model 的
 * 数字主键行，且只覆盖已注册模型；闸门判定用的是「编码」，所以候选取编码全集。</p>
 */
async function loadModels() {
  if (modelsLoading.value) return
  modelsLoading.value = true
  modelError.value = ''
  try {
    const body: any = await adminApi.get('/api/providers')
    const list = Array.isArray(body) ? body : (body?.data || [])
    const groups: Array<{ key: string; label: string; models: string[] }> = []
    const seen = new Set<string>()
    for (const p of list) {
      const arr = Array.isArray(p?.models) ? p.models : []
      const codes: string[] = []
      for (const m of arr) {
        if (!m || m.enabled === false) continue
        const code = String(m.model || m.modelName || m.name || '').trim()
        if (!code || seen.has(code)) continue
        seen.add(code)
        codes.push(code)
      }
      if (codes.length) {
        groups.push({
          key: String(p.provider_id || p.id || p.platform || groups.length),
          label: String(p.name || p.provider || p.platform || '未命名供应商'),
          models: codes,
        })
      }
    }
    modelGroups.value = groups
    if (!groups.length) modelError.value = '模型管理里没有启用的模型'
  } catch (e: any) {
    modelError.value = e?.message || String(e)
  } finally {
    modelsLoading.value = false
  }
}

/**
 * 分组候选：{@code /v2/groups} 带 {@code @Permission("admin")}，非管理员会 403。
 * 拿不到就静默降级 —— 分组只是「批量收窄模型」的便利项，Key 不绑分组照样能用。
 */
async function loadGroups() {
  if (groupOptions.value.length) return
  try {
    const res = await groupApi.list()
    groupOptions.value = asList(pick(res)).map((g: any) => ({
      id: Number(g.groupId ?? g.id),
      name: String(g.groupName ?? g.name ?? `分组 ${g.groupId ?? g.id}`),
    })).filter((g) => isFinite(g.id))
  } catch {
    groupOptions.value = []
  }
}

// ============================================================================
// 表单
// ============================================================================
const form = ref(createForm())

function createForm(src?: any) {
  return {
    name: src?.name ?? '',
    groupId: src?.groupId ?? null,
    models: src ? src.models.slice() : [],
    quotaType: src?.quotaType ?? 'time',
    expireTime: src?.expireTime ? toPickerValue(parseDateTime(src.expireTime) || new Date())
      : expiryAfter(30),
    maxUse: src?.maxUse && src.maxUse > 0 ? src.maxUse : 1000,
    maxTokens: src?.maxTokens && src.maxTokens > 0 ? src.maxTokens : 1000000,
    balance: 0,
    enabled: src ? src.enabled : true,
    // IP 白名单与透支开关：后端 DTO 分别是字符串与布尔，编辑时原样回显
    ipWhitelist: src?.ipWhitelist ?? '',
    overdraftEnabled: src?.overdraftEnabled === true,
  }
}

/** 切换配额方式时把另外两项置空：后端对「已填写的额度」逐条判定，留着旧值会变成双重限制 */
function pickQuota(type: string) {
  form.value.quotaType = type
}

function openCreate() {
  editing.value = null
  loadModels()
  loadGroups()
  form.value = createForm()
  showForm.value = true
}

function openEdit(row: any) {
  editing.value = row
  loadModels()
  loadGroups()
  const next = createForm(row)
  // 限定模型只回显「模型管理里真有的」编码，免得下拉里冒出已下线的模型；
  // 清单还没加载完（size=0）时先原样保留。
  const codes = new Set(modelGroups.value.flatMap((g) => g.models))
  if (codes.size) {
    const kept = next.models.filter((m: string) => codes.has(m))
    next.models = kept.length ? kept : next.models
  }
  form.value = next
  showForm.value = true
}

async function submit() {
  const f = form.value
  if (!f.name.trim()) {
    message.warning('请填写名称')
    return
  }
  if (f.quotaType === 'time' && !f.expireTime) {
    message.warning('按时间配额需要选择到期时间')
    return
  }
  if (f.quotaType === 'count' && !(Number(f.maxUse) > 0)) {
    message.warning('按次数配额需要填写大于 0 的次数')
    return
  }
  if (f.quotaType === 'balance' && !(Number(f.maxTokens) > 0)) {
    message.warning('按余额配额需要填写大于 0 的 Token 总量')
    return
  }
  // 三选一只提交当前方式那一项，其余显式 null —— 更新接口按字段全量覆盖
  const payload: Record<string, any> = {
    name: f.name.trim(),
    groupId: f.groupId ?? null,
    model: f.models.join(','),
    expireTime: f.quotaType === 'time' ? toApiTime(f.expireTime) : null,
    maxUse: f.quotaType === 'count' ? Number(f.maxUse) : null,
    maxTokens: f.quotaType === 'balance' ? Number(f.maxTokens) : null,
    // 空白 = 不限制（后端按 isBlank 判定），这里统一成 null
    ipWhitelist: f.ipWhitelist.trim() ? f.ipWhitelist.trim() : null,
    overdraftEnabled: !!f.overdraftEnabled,
  }
  saving.value = true
  try {
    if (editing.value) {
      // 供应商 / 备注台账不编辑，但更新接口是「按字段全量覆盖」，
      // 所以把它们原样带回，避免被这次保存清空
      const src = editing.value
      await appKeyApi.update(src.id, {
        ...payload,
        enabled: f.enabled,
        provider: src.provider ?? null,
        remark: src.remark ?? null,
      })
      message.success('已保存')
    } else {
      await appKeyApi.create({ ...payload, balance: Number(f.balance) || 0 })
      message.success('AppKey 已创建')
    }
    showForm.value = false
    editing.value = null
    await load()
    // 分组的成员数与模型范围都是按 Key 侧算出来的：改 Key 的分组必须让分组台账重取
    emit('changed')
  } catch (e: any) {
    message.error('保存失败: ' + (e?.message || e))
  } finally {
    saving.value = false
  }
}

// ============================================================================
// 续量 / 重置用量
// ============================================================================
function openQuota(row: any) {
  quotaTarget.value = row
  // 用 numMode（真实存在的数字上限）而不是 quotaType 决定改哪一项
  quotaNewTotal.value = row.numMode === 'count' ? (row.maxUse || 1000) : (row.maxTokens || 1000000)
  quotaReset.value = false
  showQuota.value = true
}

async function adjust() {
  const target = quotaTarget.value
  if (!target) return
  const total = Number(quotaNewTotal.value)
  if (!(total > 0)) {
    message.warning('请输入大于 0 的上限')
    return
  }
  adjusting.value = true
  try {
    await appKeyApi.quota(target.id, target.numMode === 'count'
      ? { maxUse: total, resetUsed: quotaReset.value }
      : { maxTokens: total, resetUsed: quotaReset.value })
    message.success(quotaReset.value ? '额度已更新并清零已用' : '额度已更新')
    showQuota.value = false
    await load()
  } catch (e: any) {
    message.error('操作失败: ' + (e?.message || e))
  } finally {
    adjusting.value = false
  }
}

// ============================================================================
// 充值余额
// ============================================================================
function openRecharge(row: any) {
  rechargeTarget.value = row
  rechargeAmount.value = 100
  rechargeRemark.value = ''
  showRecharge.value = true
}

async function doRecharge() {
  const target = rechargeTarget.value
  if (!target) return
  const amount = Number(rechargeAmount.value)
  if (!(amount > 0)) {
    message.warning('请输入大于 0 的金额')
    return
  }
  recharging.value = true
  try {
    await topupApi.recharge(target.id, amount, rechargeRemark.value.trim() || undefined)
    message.success(`已充值 ¥${amount.toFixed(2)}`)
    showRecharge.value = false
    await load()
  } catch (e: any) {
    message.error('充值失败: ' + (e?.message || e))
  } finally {
    recharging.value = false
  }
}

// ============================================================================
// 行操作
// ============================================================================
async function toggle(row: any) {
  try {
    if (row.enabled) {
      await ElMessageBox.confirm(
        '停用后使用该 Key 的请求一律被拒绝（Key 保留，可随时再启用）。',
        '停用 AppKey',
        { type: 'warning', confirmButtonText: '停用', cancelButtonText: '取消' },
      )
    }
    await appKeyApi.toggle(row.id, !row.enabled)
    message.success(row.enabled ? '已停用' : '已启用')
    await load()
  } catch (e: any) {
    if (e === 'cancel' || e === 'close' || e?.message === 'cancel') return
    message.error('操作失败: ' + (e?.message || e))
  }
}

async function remove(row: any) {
  try {
    await ElMessageBox.confirm(
      `确定删除 AppKey「${row.name}」？删除后用它调用的请求会立即 401。`,
      '删除 AppKey',
      { type: 'warning', confirmButtonText: '删除', cancelButtonText: '取消' },
    )
    await appKeyApi.delete(row.id)
    message.success('已删除')
    await load()
    // 删除会让分组少一个成员（后端按 Key 侧真源算成员），分组台账要跟上
    emit('changed')
  } catch (e: any) {
    if (e === 'cancel' || e === 'close' || e?.message === 'cancel') return
    message.error('删除失败: ' + (e?.message || e))
  }
}

async function copy(text: string) {
  try {
    await navigator.clipboard.writeText(text)
    message.success('已复制到剪贴板')
  } catch {
    message.warning('复制失败，请手动选择复制')
  }
}

// ============================================================================
// 生命周期
// ============================================================================
/**
 * 外部 refreshKey 变化 = 分组台账那边动过分组 / 成员。
 *
 * <p>除了重取本表，还必须让分组候选项失效重取：{@code loadGroups} 是「有缓存就不再请求」，
 * 分组被改名或删掉后不失效的话，下拉里会一直挂着旧名字。</p>
 */
watch(() => props.refreshKey, () => {
  groupOptions.value = []
  load()
  loadGroups()
})

onMounted(() => { load() })

defineExpose({ reload: load })
</script>
