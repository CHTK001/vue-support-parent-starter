<template>
  <div class="mg-up">
    <div class="mg-up__head">
      <span class="mg-up__title">
        网关上游
        <i>{{ providers.length }}</i>
      </span>
      <span class="mg-up__ops">
        <select
          v-if="connections.length > 1"
          v-model="connectionId"
          class="mg-up__select"
          title="选择要管理的 Magpie 网关"
          @change="load()"
        >
          <option v-for="c in connections" :key="c.connectionId" :value="c.connectionId">
            {{ c.label || c.connectionId }}
          </option>
        </select>
        <button type="button" class="mg-up__btn" :disabled="loading" @click="load()">
          {{ loading ? '读取中…' : '刷新' }}
        </button>
        <button type="button" class="mg-up__btn is-primary" @click="openEditor(null)">
          ＋ 新增上游
        </button>
      </span>
    </div>

    <p v-if="baseUrl" class="mg-up__hint">
      网关 {{ baseUrl }}
      <template v-if="pageUrl">
        ｜ 页面
        <a :href="pageUrl" target="_blank" rel="noopener noreferrer">打开管理面</a>
      </template>
    </p>
    <p v-if="error" class="mg-up__error">{{ error }}</p>

    <div v-if="!connections.length" class="mg-up__empty">
      先在「账号」页绑定 Magpie 网关（地址 + 网关 key），再回到这里管理上游。
    </div>
    <div v-else class="mg-up__tablewrap">
      <table class="mg-up__table">
        <thead>
          <tr>
            <th>名称</th>
            <th>ID</th>
            <th>协议</th>
            <th>凭据</th>
            <th>账号</th>
            <th>模型</th>
            <th class="is-actions">操作</th>
          </tr>
        </thead>
        <tbody>
          <template v-for="p in providers" :key="'up-' + String(p.id)">
          <tr :class="{ 'is-focus': !!resolvedFocus && String(p.id) === resolvedFocus }">
            <td class="is-name" :title="String(p.name ?? '')">
              <img v-if="iconOf(p)" class="mg-up__icon" :src="iconOf(p)" :alt="String(p.name ?? p.id ?? '')" />
              {{ p.name || p.id }}
              <span v-if="isPluginManaged(p)" class="mg-up__tag is-plugin" title="该上游由插件接管，登录与签到走插件">
                插件
              </span>
            </td>
            <td class="is-id" :title="String(p.id ?? '')">
              {{ p.id }}
              <span
                v-if="creditConfigs[String(p.id ?? '')]"
                class="mg-up__tag"
                title="已配置自建余额查询：网关读不到余额时按它查"
              >余额自建</span>
            </td>
            <td>{{ protocolText(p) }}</td>
            <td>
              <span class="mg-up__tag" :class="{ 'is-off': !p.hasKey }">
                {{ credentialText(p) }}
              </span>
            </td>
            <td>{{ accountText(p) }}</td>
            <td>{{ (p.models ?? []).length }}</td>
            <td class="is-actions">
              <button
                v-if="signinEnabled && canSignin(p)"
                type="button"
                class="mg-up__link"
                :disabled="busyId === p.id"
                @click="openSignin(p)"
              >登录</button>
              <button
                type="button"
                class="mg-up__link"
                :disabled="quotaLoading && quotaProviderId === p.id"
                @click="openQuotas(p)"
              >账号 / 积分</button>
              <button type="button" class="mg-up__link" @click="openEditor(p)">编辑</button>
              <button
                type="button"
                class="mg-up__link"
                :disabled="busyId === p.id"
                @click="pullModels(p)"
              >拉模型</button>
              <button
                type="button"
                class="mg-up__link"
                :disabled="busyId === p.id"
                @click="testProvider(p)"
              >测试</button>
              <button type="button" class="mg-up__link is-danger" @click="remove(p)">删除</button>
            </td>
          </tr>
          <!-- 从左栏点进来的上游：直接把账号 / 积分摊开，不用再点「额度」才看得到 -->
          <tr v-if="resolvedFocus && String(p.id) === resolvedFocus" class="mg-up__focus-row">
            <td colspan="7">
              <div class="mg-up__focus-panel">
                <div class="mg-up__focus-head">
                  <b>账号与积分</b>
                  <span v-if="focusQuotaLoading" class="mg-up__formhint">读取中…</span>
                  <span v-else-if="focusQuotaError" class="mg-up__error">{{ focusQuotaError }}</span>
                  <span v-else class="mg-up__formhint">共 {{ focusQuotaRows.length }} 个账号</span>
                  <button type="button" class="mg-up__link" :disabled="focusQuotaLoading" @click="loadFocusQuota(String(p.id))">
                    刷新积分
                  </button>
                  <button v-if="signinEnabled && canSignin(p)" type="button" class="mg-up__link is-primary" :disabled="busyId === p.id" @click="openSignin(p)">
                    ＋ 绑定账号
                  </button>
                </div>
                <div v-if="focusQuotaRows.length" class="mg-up__quota-grid">
                  <div v-for="(q, qi) in focusQuotaRows" :key="'fq-' + qi" class="mg-up__quota-card">
                    <div class="mg-up__quota-head">
                      <b>{{ String(q.user ?? q.provider ?? p.id) }}</b>
                      <span v-if="q.plan" class="mg-up__tag">{{ String(q.plan) }}</span>
                    </div>
                    <p v-if="q.balance !== undefined && q.balance !== null" class="mg-up__quota-balance">
                      余额 <b>{{ q.balance }}</b>
                    </p>
                    <ul v-if="quotaWindows(q).length" class="mg-up__quota-list">
                      <li v-for="(w, wi) in quotaWindows(q)" :key="'fw-' + wi">
                        <span>{{ windowName(w) }}</span>
                        <span>{{ windowAmount(w) }}</span>
                      </li>
                    </ul>
                    <p v-else-if="q.error" class="mg-up__formhint">{{ String(q.error) }}</p>
                  </div>
                </div>
                <p v-else-if="!focusQuotaLoading" class="mg-up__formhint">
                  <template v-if="canSignin(p)">
                    这个上游还没有账号。点「＋ 绑定账号」发起登录，登录完成后账号与积分会出现在这里。
                  </template>
                  <template v-else>
                    这个上游用 API Key 接入，网关里没有它的登录方式：换 Key 请点「编辑」改凭据，不需要绑定账号。
                  </template>
                </p>
              </div>
            </td>
          </tr>
          </template>
          <tr v-if="!providers.length && !loading">
            <td colspan="7" class="mg-up__empty-cell">
              <template v-if="error">管理面不可用：{{ error }}</template>
              <template v-else>网关里还没有上游 provider，点「新增上游」添加</template>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <ReDialog
      v-model="dialogVisible"
      :title="editing ? '编辑上游 provider' : '新增上游 provider'"
      width="640px"
      append-to-body
      destroy-on-close
      :close-on-click-modal="false"
    >
      <el-form label-width="110px" class="mg-up__form">
        <!-- 两条接入路径分开：预设（magpie 补地址）不该让人面对一堆地址框 -->
        <div class="mg-up__mode">
          <span class="mg-up__mode-name">接入方式</span>
          <div class="mg-up__seg">
            <button type="button" :aria-pressed="presetMode" :class="{ 'is-on': presetMode }" @click="usePresetMode()">
              用 magpie 预设
            </button>
            <button type="button" :aria-pressed="!presetMode" :class="{ 'is-on': !presetMode }" @click="useCustomMode()">
              自定义地址
            </button>
          </div>
        </div>
        <p class="mg-up__modehint">
          {{ presetMode
            ? '选一个预设：地址与模型目录由网关补全，通常只需要填 API Key。'
            : '没有对应预设时用这个：上游 ID 与 Chat 地址要自己填。' }}
        </p>

        <el-form-item v-if="presetMode" label="预设" required>
          <el-select
            v-model="form.preset"
            class="mg-up__select-wide"
            filterable
            clearable
            placeholder="搜索厂商或预设 id，如 opencode / deepseek / kimi"
            @change="onPresetChange"
          >
            <el-option
              v-for="p in presetOptions"
              :key="p.id"
              :value="p.id"
              :label="p.name + ' · ' + p.id"
            >
              <span class="mg-up__opt-name">{{ p.name }}</span>
              <span class="mg-up__opt-hint">{{ p.host || p.kind }}</span>
            </el-option>
          </el-select>
          <p v-if="pickedPreset" class="mg-up__presethint">
            地址与模型目录由预设补全。
            <a v-if="pickedPreset.keys" :href="pickedPreset.keys" target="_blank" rel="noopener noreferrer">
              去 {{ pickedPreset.host || pickedPreset.name }} 拿 Key ↗
            </a>
          </p>
        </el-form-item>

        <div class="mg-up__grid">
          <el-form-item label="ID" :required="!presetMode">
            <el-input
              v-model="form.id"
              placeholder="如 codex / claude"
              maxlength="64"
              :disabled="editing"
            />
          </el-form-item>
          <el-form-item label="显示名">
            <el-input v-model="form.name" placeholder="如 Codex 订阅" maxlength="128" />
          </el-form-item>
        </div>
        <el-form-item label="API Key">
          <el-input
            v-model="form.key"
            type="password"
            show-password
            spellcheck="false"
            :placeholder="editing ? '留空表示保留原 key' : '粘贴上游的 API Key'"
          />
          <span class="mg-up__formhint">
            {{ editing
              ? '只写不改：读接口只回脱敏值，留空即保留原 key。'
              : '多数预设必填；个别免费预设可留空，保存报 needs an API key 时再补。' }}
          </span>
        </el-form-item>

        <button v-if="presetMode" type="button" class="mg-up__more" @click="advancedOpen = !advancedOpen">
          <span>{{ advancedOpen ? '收起高级' : '高级：地址 / 模型覆盖（一般不用填）' }}</span>
          <span aria-hidden="true">{{ advancedOpen ? '▴' : '▾' }}</span>
        </button>

        <template v-if="!presetMode || advancedOpen">
          <div class="mg-up__grid">
            <el-form-item label="Chat 地址">
              <el-input v-model="form.chat" placeholder="https://…/v1" maxlength="512" />
            </el-form-item>
            <el-form-item label="Responses">
              <el-input v-model="form.responses" placeholder="可留空" maxlength="512" />
            </el-form-item>
            <el-form-item label="Anthropic">
              <el-input v-model="form.anthropic" placeholder="可留空" maxlength="512" />
            </el-form-item>
            <el-form-item label="Gemini">
              <el-input v-model="form.gemini" placeholder="可留空" maxlength="512" />
            </el-form-item>
          </div>
          <el-form-item label="模型">
            <el-input
              v-model="form.modelsText"
              type="textarea"
              :rows="4"
              placeholder="一行一个模型 id，也可用逗号分隔；留空表示使用上游 / 预设的目录"
            />
          </el-form-item>
        </template>

        <button type="button" class="mg-up__more" @click="creditOpen = !creditOpen">
          <span>
            {{ creditOpen
              ? '收起余额查询'
              : (creditSaved ? '余额查询：已配置（网关读不到时用）' : '余额查询：网关读不到时用（一般不用填）') }}
          </span>
          <span aria-hidden="true">{{ creditOpen ? '▴' : '▾' }}</span>
        </button>

        <template v-if="creditOpen">
          <p class="mg-up__formhint">
            网关读不到这个上游的余额时，按这里再查一次。字段表达式如
            <code>$data.total_available / 500000</code>，多段用分号分隔；未验证的接口先点「试查余额」。
          </p>
          <div class="mg-up__grid">
            <el-form-item label="查询实现">
              <el-select v-model="credit.kind" clearable placeholder="按表达式自动选">
                <el-option v-for="k in creditKinds" :key="k" :value="k" :label="k" />
              </el-select>
            </el-form-item>
            <el-form-item label="请求方法">
              <el-select v-model="credit.method" clearable placeholder="GET">
                <el-option value="GET" label="GET" />
                <el-option value="POST" label="POST" />
                <el-option value="PUT" label="PUT" />
              </el-select>
            </el-form-item>
          </div>
          <el-form-item label="余额地址">
            <el-input v-model="credit.url" placeholder="https://…/api/usage/token" maxlength="1024" />
          </el-form-item>
          <el-form-item label="字段表达式">
            <el-input
              v-model="credit.expression"
              placeholder="$data.user_quota.total_available / 500000"
              maxlength="512"
            />
          </el-form-item>
          <div class="mg-up__grid">
            <el-form-item label="令牌请求头">
              <el-input v-model="credit.tokenHeader" placeholder="可留空（默认 Authorization）" maxlength="64" />
            </el-form-item>
            <el-form-item label="令牌">
              <el-input
                v-model="credit.token"
                type="password"
                show-password
                spellcheck="false"
                :placeholder="creditSaved?.hasToken ? '已配置，留空表示不改' : '可留空（公开接口）'"
              />
            </el-form-item>
          </div>
          <div class="mg-up__grid">
            <el-form-item label="Access Key">
              <el-input
                v-model="credit.accessKey"
                type="password"
                show-password
                spellcheck="false"
                :placeholder="creditSaved?.hasAccessKey ? '已配置，留空表示不改' : '可留空（仅 AK/SK 签名厂商需要）'"
                maxlength="512"
              />
            </el-form-item>
            <el-form-item label="Secret Key">
              <el-input
                v-model="credit.secretKey"
                type="password"
                show-password
                spellcheck="false"
                :placeholder="creditSaved?.hasSecretKey ? '已配置，留空表示不改' : '可留空（仅 AK/SK 签名厂商需要）'"
                maxlength="512"
              />
            </el-form-item>
          </div>
          <el-form-item label="计费口径">
            <el-select v-model="credit.billing" clearable placeholder="按表达式里的币种">
              <el-option value="usd" label="usd（美元）" />
              <el-option value="cny" label="cny（人民币）" />
            </el-select>
          </el-form-item>
          <div class="mg-up__credit-test">
            <ReButton :loading="creditTesting" :disabled="!form.id.trim()" @click="testCredit()">
              试查余额
            </ReButton>
            <span v-if="creditTest" class="mg-up__formhint" :class="{ 'is-error': !!creditTest.error }">
              {{ creditTestText }}
            </span>
            <button v-if="creditSaved" type="button" class="mg-up__link is-danger" @click="removeCredit()">
              删除余额配置
            </button>
          </div>
        </template>
      </el-form>

      <template #footer>
        <ReButton @click="dialogVisible = false">取消</ReButton>
        <ReButton type="primary" :loading="saving" @click="submit()">保存</ReButton>
      </template>
    </ReDialog>

    <!-- 上游登录：授权在浏览器完成，凭据由 magpie 自己保存 -->
    <ReDialog
      v-model="signinVisible"
      :title="signinTitle"
      width="560px"
      append-to-body
      destroy-on-close
      :close-on-click-modal="false"
      @closed="stopSignin"
    >
      <div class="mg-up__signin">
        <p class="mg-up__signin-state">
          状态：<b :class="'is-' + (signinSession?.state || 'waiting')">{{ signinStateText() }}</b>
        </p>
        <p v-if="signinHint" class="mg-up__formhint">{{ signinHint }}</p>
        <div v-if="signinSession?.url" class="mg-up__signin-url">
          <a :href="String(signinSession.url)" target="_blank" rel="noopener noreferrer">
            {{ signinSession.url }}
          </a>
        </div>
        <p v-if="signinSession?.user" class="mg-up__formhint">
          已登录账号：{{ signinSession.user }}
        </p>
        <p v-if="signinError" class="mg-up__error">{{ signinError }}</p>
      </div>
      <template #footer>
        <ReButton v-if="signinSession?.url" @click="openSigninPage()">打开授权页</ReButton>
        <ReButton v-if="signinRunning" @click="cancelSignin()">取消登录</ReButton>
        <ReButton type="primary" @click="signinVisible = false">关闭</ReButton>
      </template>
    </ReDialog>

    <!-- 额度卡：直读管理面，含签到状态与插件账号 -->
    <ReDialog
      v-model="quotaVisible"
      :title="quotaTitle"
      width="640px"
      append-to-body
      destroy-on-close
    >
      <div class="mg-up__quota">
        <p v-if="quotaError" class="mg-up__error">{{ quotaError }}</p>
        <p v-else-if="quotaLoading" class="mg-up__formhint">读取中…</p>
        <p v-else-if="!quotaRows.length" class="mg-up__formhint">
          网关没有返回额度卡（该上游可能没有可用账号，或还没登录）。
        </p>
        <div v-for="(q, i) in quotaRows" :key="i" class="mg-up__quota-card">
          <div class="mg-up__quota-head">
            <b>{{ String(q.provider ?? quotaProviderId) }}</b>
            <span class="mg-up__tag">{{ quotaKindText(q) }}</span>
            <span v-if="q.user" class="mg-up__formhint">账号 {{ q.user }}</span>
            <span v-if="q.plan" class="mg-up__formhint">套餐 {{ q.plan }}</span>
          </div>
          <p v-if="q.balance !== undefined && q.balance !== null" class="mg-up__quota-balance">
            余额 <b>{{ q.balance }}</b>
          </p>
          <ul v-if="quotaWindows(q).length" class="mg-up__quota-list">
            <li v-for="(w, j) in quotaWindows(q)" :key="j">
              <span>{{ windowName(w) }}</span>
              <span>{{ windowAmount(w) }}</span>
              <span v-if="windowReset(w)" class="mg-up__formhint">{{ windowReset(w) }}</span>
            </li>
          </ul>
          <p v-if="q.checkin && Object.keys(q.checkin).length" class="mg-up__formhint">
            签到：{{ briefText(q.checkin) }}
          </p>
        </div>
      </div>
      <template #footer>
        <ReButton v-if="quotaProviderId" :loading="quotaLoading" @click="refreshQuota()">
          重新读取
        </ReButton>
        <ReButton type="primary" @click="quotaVisible = false">关闭</ReButton>
      </template>
    </ReDialog>
  </div>
</template>

<script setup lang="ts">
/**
 * Magpie 网关「上游 provider」管理面板。
 *
 * <p>Magpie 是常驻网关：上游（Codex / Claude / Gemini / 自定义 OpenAI 兼容服务）
 * 在 magpie 自己那里维护。本面板通过 magpie 的管理面
 * （{@code /api/providers}、{@code /api/provider/save|delete|models|test}）
 * 做增删改查，改完立即失效路由缓存，新的模型马上可以被免费渠道路由到。</p>
 *
 * <p>凭据口径：列表只回脱敏 key；编辑留空表示保留原值（magpie 的 save 语义）。</p>
 */
import { computed, nextTick, onMounted, onUnmounted, reactive, ref, watch } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import ReButton from '@repo/ui/re-button'
import ReDialog from '@repo/ui/re-dialog'
import { MAGPIE_PRESETS, magpiePresetOf, type MagpiePreset } from '../magpiePresets'
import { magpieCanSignin as canSignin, isMagpiePluginManaged as isPluginManaged } from '../magpieSignin'
import {
  channelApi,
  type AccountCreditConfig,
  type ChannelConnectionSummary,
  type CreditTestResult,
  type MagpieProvider,
  type MagpieQuota,
  type MagpieSigninSession,
} from '../channelApi'

const props = defineProps<{
  /** 渠道标识（固定 magpie） */
  channel: string
  /** 该渠道下已绑定的网关连接 */
  connections: ChannelConnectionSummary[]
  /** 是否显示「登录」入口（后端 supportsSignin） */
  signinEnabled?: boolean
  /** 从「Magpie 托管」分组点进来时要高亮的 provider id */
  focus?: string
  /** focus 不在网关里时的备选 provider id（插件 / 预设两种装法） */
  focusAlt?: string[]
  /** 备选也没有时，「新增上游」预填的 magpie preset id（只预填，不自动保存） */
  preset?: string
  /** 预填「新增上游」时用的显示名 */
  presetLabel?: string
}>()

const emit = defineEmits<{
  (e: 'changed'): void
}>()

/** 当前管理的网关连接（多网关时可切换） */
const connectionId = ref('')
const loading = ref(false)
const error = ref('')
const baseUrl = ref('')
const pageUrl = ref('')
const providers = ref<MagpieProvider[]>([])
const busyId = ref('')

/** ── 上游登录（授权在浏览器完成，凭据不经过本服务） ── */
const signinVisible = ref(false)
const signinProvider = ref<MagpieProvider | null>(null)
const signinSession = ref<MagpieSigninSession | null>(null)
const signinError = ref('')
const signinPolling = ref(false)
let signinTimer: ReturnType<typeof setTimeout> | undefined

const signinTitle = computed(
  () => `上游登录 · ${signinProvider.value?.name || signinProvider.value?.id || ''}`,
)

/** 会话是否还没结束（installing / waiting / 未知） */
const signinRunning = computed(() => {
  const state = signinSession.value?.state
  return !state || state === 'waiting' || state === 'installing'
})

/** 当前会话的说明文案 */
const signinHint = computed(() => {
  const state = signinSession.value?.state
  if (state === 'installing') return '插件正在安装，装完后会给出授权页地址…'
  if (state === 'done') return '登录完成，网关已经保存凭据。'
  if (state === 'failed') return '登录失败，可关闭后重新发起。'
  if (state === 'canceled') return '已取消登录。'
  return '在打开的页面完成授权；本窗口会自动刷新状态。没弹出页面就点「打开授权页」。'
})

/** ── 额度卡（管理面直读，含签到状态与插件账号） ── */
const quotaVisible = ref(false)
const quotaLoading = ref(false)
const quotaError = ref('')
const quotaProviderId = ref('')
const quotaRows = ref<MagpieQuota[]>([])

/** 聚焦上游的账号 / 积分（左栏点进来时直接摊开，不弹窗） */
const focusQuotaRows = ref<MagpieQuota[]>([])
const focusQuotaLoading = ref(false)
const focusQuotaError = ref('')

const quotaTitle = computed(() => {
  const id = quotaProviderId.value
  const name = providers.value.find((p) => String(p.id ?? '') === id)?.name
  return `额度 · ${name || id}`
})

const dialogVisible = ref(false)
const editing = ref(false)
const saving = ref(false)
const originalId = ref('')

/** 预设模式：地址与模型目录由网关补；自定义模式：全部手填 */
const presetMode = ref(true)
/** 预设模式下「高级」是否展开（地址 / 模型覆盖） */
const advancedOpen = ref(false)
/** 编辑时原有的预设：即使切到「自定义地址」也要保留，别把上游的预设悄悄抹掉 */
const originalPreset = ref('')

const form = reactive({
  id: '',
  name: '',
  preset: '',
  key: '',
  chat: '',
  responses: '',
  anthropic: '',
  gemini: '',
  modelsText: '',
})

/** ── 余额查询配置（存在我们自己的库；网关读不到余额时用它） ── */
const creditOpen = ref(false)
const creditKinds = ref<string[]>([])
const creditSaved = ref<AccountCreditConfig | null>(null)
const creditTesting = ref(false)
const creditTest = ref<CreditTestResult | null>(null)
/** provider id → 已配置的余额来源（列表里标出来，不用逐条点开看） */
const creditConfigs = ref<Record<string, AccountCreditConfig>>({})

const credit = reactive({
  kind: '',
  method: '',
  url: '',
  expression: '',
  tokenHeader: '',
  token: '',
  accessKey: '',
  secretKey: '',
  billing: '',
})

/** 试查结果文案（成功列出每段读数，失败给原因） */
const creditTestText = computed(() => {
  const result = creditTest.value
  if (!result) return ''
  if (result.error) return '没查到：' + result.error
  const parts = (result.parts ?? [])
    .filter((part) => part && part.amount !== undefined && part.amount !== null)
    .map((part) => `${part.label || '余额'} ${part.amount}${part.currency ? ' ' + part.currency : ''}`)
  if (parts.length) return '读到：' + parts.join(' ｜ ')
  if (result.amount !== undefined && result.amount !== null) {
    return `读到：${result.amount}${result.currency ? ' ' + result.currency : ''}`
  }
  return '没取到数字，检查字段表达式'
})

/** 当前选中的预设；编辑更新版 magpie 建的上游时可能不在内置目录里 */
const pickedPreset = computed<MagpiePreset | undefined>(() => magpiePresetOf(form.preset.trim()))

/** 下拉选项：内置目录 + 当前值（保证老数据回显时不会变成空白） */
const presetOptions = computed<MagpiePreset[]>(() => {
  const cur = form.preset.trim()
  if (!cur || MAGPIE_PRESETS.some((p) => p.id === cur)) return MAGPIE_PRESETS
  return [{ id: cur, name: `${cur}（不在内置目录）`, kind: '', host: '', keys: '' }, ...MAGPIE_PRESETS]
})

const selectedConnection = computed(
  () => props.connections.find((c) => c.connectionId === connectionId.value) ?? props.connections[0],
)

/** 同步默认连接：优先主账号，其次第一条 */
watch(
  () => props.connections,
  (list) => {
    if (!list.length) {
      connectionId.value = ''
      return
    }
    if (list.some((c) => c.connectionId === connectionId.value)) return
    connectionId.value = (list.find((c) => c.primary) ?? list[0])!.connectionId ?? ''
  },
  { immediate: true, deep: true },
)

onMounted(() => {
  if (props.connections.length && connectionId.value) void load()
  void loadCreditKinds()
})

// 切换网关（多连接）时重新读取；props 同步发生在挂载前也算一次
watch(connectionId, (id, prev) => {
  if (id && id !== prev) void load()
})

/**
 * 从「Magpie 托管」分组点进来时，滚动到对应上游并高亮。
 *
 * <p>必须等 providers 渲染完再定位（{@code flush: 'post'}），否则首次进入时
 * 目标行还不存在，滚动会落空。</p>
 *
 * <p>三条落点，按优先级：</p>
 * <ol>
 *   <li>{@code focus} 就是这个网关里的 provider → 高亮并滚到中间；</li>
 *   <li>{@code focusAlt} 里有（插件装法与预设装法不同 id，如 cline → clinepass）；</li>
 *   <li>一个都没有、但给了 {@code preset}（opencode / kilo / gemini 这类）→
 *       打开「新增上游」并按预设预填。<b>只预填不保存</b>：点一下左栏不该写网关。</li>
 * </ol>
 */
const resolvedFocus = ref('')

/** 已经为哪个 focus 自动弹过预填框：同一次跳转只弹一次，取消后刷新不重弹 */
let presetPromptedFor = ''

watch(
  [() => props.focus, () => props.focusAlt, providers, loading],
  () => {
    const wanted = props.focus
    if (!wanted) {
      resolvedFocus.value = ''
      presetPromptedFor = ''
      return
    }
    if (loading.value) return
    const ids = [wanted, ...(props.focusAlt ?? [])]
    const hit = ids.find((id) => providers.value.some((p) => String(p.id) === id)) ?? ''
    resolvedFocus.value = hit
    if (hit) {
      void nextTick(() => {
        document
          .querySelector('.mg-up__table tbody tr.is-focus')
          ?.scrollIntoView({ block: 'center' })
      })
      return
    }
    if (props.preset && presetPromptedFor !== wanted) {
      presetPromptedFor = wanted
      openEditor(null, props.preset)
    }
  },
  { flush: 'post' },
)

/** 读取聚焦上游的账号 / 积分（不打开弹窗） */
async function loadFocusQuota(id: string): Promise<void> {
  if (!id || !connectionId.value) {
    focusQuotaRows.value = []
    return
  }
  focusQuotaLoading.value = true
  focusQuotaError.value = ''
  try {
    const res = await channelApi.magpieQuotas(
      props.channel,
      { connectionId: connectionId.value },
      id,
    )
    const out = (res as any)?.data ?? res
    focusQuotaRows.value = (out?.result?.quotas ?? out?.quotas ?? []) as MagpieQuota[]
  } catch (e: any) {
    focusQuotaError.value = e?.message ?? String(e)
    focusQuotaRows.value = []
  } finally {
    focusQuotaLoading.value = false
  }
}

/** 聚焦行变化时自动带出账号 / 积分 */
watch(resolvedFocus, (id) => {
  if (id) {
    void loadFocusQuota(id)
  } else {
    focusQuotaRows.value = []
    focusQuotaError.value = ''
  }
})

/** 读取上游清单 */
async function load(): Promise<void> {
  if (!connectionId.value) {
    providers.value = []
    return
  }
  loading.value = true
  error.value = ''
  try {
    const res = await channelApi.magpieProviders(props.channel, { connectionId: connectionId.value })
    const out = (res as any)?.data ?? res
    baseUrl.value = String(out?.baseUrl ?? '')
    pageUrl.value = String(out?.pageUrl ?? '')
    providers.value = (out?.providers ?? []) as MagpieProvider[]
    if (out?.ok === false) {
      error.value = String(out?.message ?? 'Magpie 管理接口不可用')
    }
    await loadCreditConfigs()
  } catch (e: any) {
    error.value = e?.message ?? String(e)
    providers.value = []
  } finally {
    loading.value = false
  }
}

/**
 * 读取余额查询配置（我们自己的库，与网关无关）。
 *
 * <p>失败只是不显示「余额自建」标记，不能影响上游列表本身。</p>
 */
async function loadCreditConfigs(): Promise<void> {
  try {
    const rows = await channelApi.creditConfigs()
    const map: Record<string, AccountCreditConfig> = {}
    for (const row of (rows ?? []) as AccountCreditConfig[]) {
      if (row?.providerId) map[String(row.providerId)] = row
    }
    creditConfigs.value = map
  } catch {
    creditConfigs.value = {}
  }
}

/** 读取可用的查询实现标识（后端 SPI 注册了哪些就给哪些） */
async function loadCreditKinds(): Promise<void> {
  try {
    creditKinds.value = (await channelApi.creditConfigKinds()) ?? []
  } catch {
    creditKinds.value = []
  }
}

/**
 * 把已存的余额配置填进表单（令牌不回显，只能重填）。
 *
 * @param saved 已存配置；为空表示这个上游还没配
 */
function applyCredit(saved: AccountCreditConfig | null): void {
  creditSaved.value = saved
  creditTest.value = null
  credit.kind = String(saved?.kind ?? '')
  credit.method = String(saved?.method ?? '')
  credit.url = String(saved?.url ?? '')
  credit.expression = String(saved?.expression ?? '')
  credit.tokenHeader = String(saved?.tokenHeader ?? '')
  credit.token = ''
  credit.accessKey = ''
  credit.secretKey = ''
  credit.billing = String(saved?.billing ?? '')
}

/**
 * 表单里是否填了余额查询的东西（决定保存上游时要不要一起存配置）。
 *
 * @returns 有任一字段为真
 */
function hasCreditInput(): boolean {
  return !!(credit.kind.trim() || credit.method.trim() || credit.url.trim()
    || credit.expression.trim() || credit.tokenHeader.trim() || credit.token.trim()
    || credit.accessKey.trim() || credit.secretKey.trim() || credit.billing.trim())
}

/**
 * 保存上游后同步余额配置。
 *
 * <p>只在上游保存成功之后调用：配置的主键就是 provider id，先有上游才有意义。
 * 配置保存失败不回滚上游，只提示——上游本身已经生效，余额是附加信息。</p>
 *
 * @param providerId 上游 id
 */
async function saveCreditIfNeeded(providerId: string): Promise<void> {
  if (!hasCreditInput()) return
  try {
    const saved = await channelApi.saveCreditConfig(providerId, {
      kind: credit.kind.trim(),
      method: credit.method.trim(),
      url: credit.url.trim(),
      expression: credit.expression.trim(),
      tokenHeader: credit.tokenHeader.trim(),
      billing: credit.billing.trim(),
      token: credit.token.trim(),
      accessKey: credit.accessKey.trim(),
      secretKey: credit.secretKey.trim(),
      status: 1,
    })
    creditSaved.value = saved
    creditConfigs.value = { ...creditConfigs.value, [providerId]: saved }
  } catch (e: any) {
    ElMessage.error('上游已保存，但余额查询配置没存上：' + (e?.message ?? e))
  }
}

/** 试查一次（不落库）：先看清能不能读到数，再决定保存 */
async function testCredit(): Promise<void> {
  const providerId = form.id.trim()
  if (!providerId) {
    ElMessage.warning('先填上游 ID')
    return
  }
  creditTesting.value = true
  creditTest.value = null
  try {
    creditTest.value = await channelApi.testCreditConfig({
      providerId,
      kind: credit.kind.trim(),
      method: credit.method.trim(),
      url: credit.url.trim(),
      expression: credit.expression.trim(),
      tokenHeader: credit.tokenHeader.trim(),
      billing: credit.billing.trim(),
      token: credit.token.trim(),
      accessKey: credit.accessKey.trim(),
      secretKey: credit.secretKey.trim(),
    })
  } catch (e: any) {
    creditTest.value = { error: e?.message ?? String(e) }
  } finally {
    creditTesting.value = false
  }
}

/** 删除这个上游的余额配置（额度卡回到只读网关） */
async function removeCredit(): Promise<void> {
  const providerId = form.id.trim()
  if (!providerId || !creditSaved.value) return
  try {
    await ElMessageBox.confirm(`删除「${providerId}」的余额查询配置？之后额度卡只读网关。`, '确认删除', {
      type: 'warning',
    })
  } catch {
    return
  }
  try {
    await channelApi.deleteCreditConfig(providerId)
    const next = { ...creditConfigs.value }
    delete next[providerId]
    creditConfigs.value = next
    applyCredit(null)
    ElMessage.success('余额配置已删除')
  } catch (e: any) {
    ElMessage.error('删除失败：' + (e?.message ?? e))
  }
}

/** 打开新增 / 编辑弹窗；新增时可用预设预填（只预填，不保存） */
function openEditor(provider: MagpieProvider | null, preset = ''): void {
  editing.value = !!provider
  originalId.value = provider ? String(provider.id ?? '') : ''
  form.id = originalId.value
  form.name = String(provider?.name ?? '')
  form.preset = String(provider?.preset ?? '')
  form.key = ''
  form.chat = String(provider?.chat ?? '')
  form.responses = String(provider?.responses ?? '')
  form.anthropic = String(provider?.anthropic ?? '')
  form.gemini = String(provider?.gemini ?? '')
  form.modelsText = modelIdsOf(provider?.models).join('\n')
  originalPreset.value = provider?.preset ? String(provider.preset) : ''
  if (!provider && preset) {
    // 预设自带地址与模型目录，这里只落 id / 显示名 / preset，地址留空交给 magpie 补
    form.id = preset
    form.name = props.presetLabel || preset
    form.preset = preset
    originalPreset.value = preset
  }
  // 有预设就走「预设」路径；没有预设（纯自定义上游）直接摊开地址，别让用户再点一次
  presetMode.value = !!form.preset.trim()
  // 已经填了地址/模型的老数据，展开高级让人看得见，避免「编辑时字段消失」
  advancedOpen.value = presetMode.value && hasAdvancedValues()
  // 余额配置按 provider id 取；新增时 id 还没填，等用户填了再「试查 / 保存」
  const savedCredit = form.id.trim() ? creditConfigs.value[form.id.trim()] ?? null : null
  applyCredit(savedCredit)
  creditOpen.value = !!savedCredit
  dialogVisible.value = true
}

/** 表单里是否已经有地址或模型覆盖（决定高级面板要不要默认展开） */
function hasAdvancedValues(): boolean {
  return (
    !!form.chat.trim() ||
    !!form.responses.trim() ||
    !!form.anthropic.trim() ||
    !!form.gemini.trim() ||
    !!form.modelsText.trim()
  )
}

/** 切到「用预设」：清掉上一模式留下的必填提示，但不动已填的地址 */
function usePresetMode(): void {
  presetMode.value = true
}

/** 切到「自定义地址」：地址是必填，直接展开并聚焦 */
function useCustomMode(): void {
  presetMode.value = false
  advancedOpen.value = false
}

/** 选中预设：ID 与显示名跟着走，用户仍可改；地址交给网关补 */
function onPresetChange(id: string): void {
  const picked = magpiePresetOf(String(id ?? '').trim())
  if (!picked) return
  // 只在「ID 还是上一个预设的默认值」时才改写，别覆盖用户手动起的名字
  const prev = originalPreset.value ? magpiePresetOf(originalPreset.value) : undefined
  const idIsDefault = !form.id.trim() || form.id.trim() === prev?.id || form.id.trim() === originalPreset.value
  if (idIsDefault) form.id = picked.id
  if (!form.name.trim() || form.name.trim() === prev?.name || form.name.trim() === originalPreset.value) {
    form.name = picked.name
  }
  originalPreset.value = picked.id
  // 预设自己带地址，默认不收着，免得用户以为还要填
  advancedOpen.value = false
}

/** 保存（新增 / 覆盖 / 改名） */
async function submit(): Promise<void> {
  const id = form.id.trim()
  if (!id) {
    ElMessage.warning('请填写 provider ID')
    return
  }
  if (presetMode.value && !form.preset.trim()) {
    ElMessage.warning('请选择预设；没有对应预设就切到「自定义地址」')
    return
  }
  const provider: Record<string, unknown> = { id }
  const name = form.name.trim()
  if (name) provider.name = name
  if (form.preset.trim()) provider.preset = form.preset.trim()
  // 空 key 不发送：magpie 的 save 以「缺 key」表示保留原值
  if (form.key.trim()) provider.key = form.key.trim()
  for (const key of ['chat', 'responses', 'anthropic', 'gemini'] as const) {
    const value = form[key].trim()
    if (value) provider[key] = value
  }
  const models = form.modelsText
    .split(/[\n,，\s]+/)
    .map((item) => item.trim())
    .filter(Boolean)
  // 空目录在预设模式下不发送：让 magpie 用预设自带的模型目录，而不是覆盖成空
  if (models.length || !presetMode.value) provider.models = models

  saving.value = true
  try {
    await channelApi.saveMagpieProvider(props.channel, {
      connectionId: connectionId.value,
      provider,
      isNew: !editing.value,
      from: editing.value && originalId.value && originalId.value !== id ? originalId.value : undefined,
    })
    // 上游先进网关，再按同一个 id 存余额配置；配置失败只提示，不回滚上游
    await saveCreditIfNeeded(id)
    ElMessage.success(editing.value ? '上游已更新' : '上游已新增')
    dialogVisible.value = false
    await load()
    emit('changed')
  } catch (e: any) {
    ElMessage.error('保存失败：' + (e?.message ?? e))
  } finally {
    saving.value = false
  }
}

/** 删除 */
async function remove(provider: MagpieProvider): Promise<void> {
  const id = String(provider.id ?? '')
  if (!id) return
  try {
    await ElMessageBox.confirm(`删除上游 provider「${provider.name || id}」？网关内该上游的模型会立即不可用。`, '确认删除', {
      type: 'warning',
    })
  } catch {
    return
  }
  try {
    await channelApi.deleteMagpieProvider(props.channel, { connectionId: connectionId.value, id })
    ElMessage.success('已删除')
    await load()
    emit('changed')
  } catch (e: any) {
    ElMessage.error('删除失败：' + (e?.message ?? e))
  }
}

/** 拉模型：把网关返回的模型 id 填回表单，避免手抄 */
async function pullModels(provider: MagpieProvider): Promise<void> {
  const id = String(provider.id ?? '')
  if (!id) return
  busyId.value = id
  try {
    const res = await channelApi.magpieProviderAction(props.channel, 'models', {
      connectionId: connectionId.value,
      provider,
    })
    const out = (res as any)?.data ?? res
    const ids = extractModelIds(out?.result ?? out)
    if (!ids.length) {
      ElMessage.info('网关未返回模型清单')
      return
    }
    openEditor(provider)
    form.modelsText = ids.join('\n')
    ElMessage.success(`已带出 ${ids.length} 个模型，确认后保存`)
  } catch (e: any) {
    ElMessage.error('拉取模型失败：' + (e?.message ?? e))
  } finally {
    busyId.value = ''
  }
}

/** 连通性测试 */
async function testProvider(provider: MagpieProvider): Promise<void> {
  busyId.value = String(provider.id ?? '')
  try {
    const res = await channelApi.magpieProviderAction(props.channel, 'test', {
      connectionId: connectionId.value,
      provider,
    })
    const out = (res as any)?.data ?? res
    const result = out?.result ?? out
    const summary = testSummary(result)
    if (testAllOk(result)) {
      ElMessage.success('测试通过：' + summary)
    } else {
      ElMessage.warning('测试完成：' + summary)
    }
  } catch (e: any) {
    ElMessage.error('测试失败：' + (e?.message ?? e))
  } finally {
    busyId.value = ''
  }
}

/**
 * 发起上游登录。
 *
 * <p>插件接管的 provider 传 {@code provider + method}，内置的传 {@code agent}；
 * 授权在 magpie 打开的页面里完成，凭据不经过本服务。</p>
 *
 * @param provider 上游行
 */
async function openSignin(provider: MagpieProvider): Promise<void> {
  const id = String(provider.id ?? '')
  if (!id) return
  signinProvider.value = provider
  signinSession.value = null
  signinError.value = ''
  signinVisible.value = true
  busyId.value = id
  try {
    const res = isPluginManaged(provider)
      ? await channelApi.magpieSignin(props.channel, {
          connectionId: connectionId.value,
          plugin: true,
          provider: id,
          method: 0,
        })
      : await channelApi.magpieSignin(props.channel, {
          connectionId: connectionId.value,
          agent: id,
        })
    const out = (res as any)?.data ?? res
    signinSession.value = (out?.result ?? out) as MagpieSigninSession
    if (!signinSession.value?.id) {
      signinError.value = '网关没有返回登录会话'
      return
    }
    if (signinSession.value.url) openSigninPage()
    schedulePoll()
  } catch (e: any) {
    signinError.value = e?.message ?? String(e)
  } finally {
    busyId.value = ''
  }
}

/** 打开授权页（弹窗被拦截时用户可再点按钮） */
function openSigninPage(): void {
  const url = signinSession.value?.url
  if (url) window.open(String(url), '_blank', 'noopener,noreferrer')
}

/** 登录状态文案 */
function signinStateText(): string {
  const state = signinSession.value?.state
  if (state === 'installing') return '安装插件中'
  if (state === 'waiting') return '等待授权'
  if (state === 'done') return '已完成'
  if (state === 'failed') return '失败'
  if (state === 'canceled') return '已取消'
  return '准备中'
}

/** 安排下一次轮询（2.5s 一次，终态停止） */
function schedulePoll(): void {
  stopPoll()
  signinTimer = setTimeout(() => void pollSignin(), 2500)
}

/** 轮询登录会话；完成后刷新上游与额度 */
async function pollSignin(): Promise<void> {
  const id = signinSession.value?.id
  if (!id || !signinVisible.value) return
  signinPolling.value = true
  try {
    const res = await channelApi.magpieSigninStatus(props.channel, id, {
      connectionId: connectionId.value,
    })
    const out = (res as any)?.data ?? res
    signinSession.value = (out?.result ?? out) as MagpieSigninSession
    const state = signinSession.value?.state
    if (state === 'done') {
      ElMessage.success('上游登录完成')
      await load()
      emit('changed')
      return
    }
    if (state === 'failed') {
      signinError.value = String(signinSession.value?.message ?? '登录失败')
      return
    }
    if (state === 'canceled') return
    schedulePoll()
  } catch (e: any) {
    signinError.value = e?.message ?? String(e)
  } finally {
    signinPolling.value = false
  }
}

/** 取消登录会话 */
async function cancelSignin(): Promise<void> {
  const id = signinSession.value?.id
  if (!id) return
  try {
    await channelApi.magpieSigninCancel(props.channel, id, { connectionId: connectionId.value })
    signinSession.value = { ...signinSession.value, state: 'canceled' }
    ElMessage.info('已取消登录')
  } catch (e: any) {
    ElMessage.error('取消失败：' + (e?.message ?? e))
  } finally {
    stopPoll()
  }
}

/** 停止轮询（关弹窗 / 卸载时） */
function stopSignin(): void {
  stopPoll()
  signinPolling.value = false
}

/** 清掉定时器 */
function stopPoll(): void {
  if (signinTimer) {
    clearTimeout(signinTimer)
    signinTimer = undefined
  }
}

/**
 * 打开某上游的额度卡。
 *
 * @param provider 上游行
 */
async function openQuotas(provider: MagpieProvider): Promise<void> {
  const id = String(provider.id ?? '')
  if (!id) return
  quotaProviderId.value = id
  quotaRows.value = []
  quotaError.value = ''
  quotaVisible.value = true
  await loadQuotas()
}

/**
 * 读取额度卡（按当前 provider 过滤）。
 */
async function loadQuotas(): Promise<void> {
  if (!quotaProviderId.value) return
  quotaLoading.value = true
  quotaError.value = ''
  try {
    const res = await channelApi.magpieQuotas(
      props.channel,
      { connectionId: connectionId.value },
      quotaProviderId.value,
    )
    const out = (res as any)?.data ?? res
    quotaRows.value = (out?.result?.quotas ?? out?.quotas ?? []) as MagpieQuota[]
  } catch (e: any) {
    quotaError.value = e?.message ?? String(e)
    quotaRows.value = []
  } finally {
    quotaLoading.value = false
  }
}

/**
 * 让网关重新读一次额度（跳过缓存）。
 */
async function refreshQuota(): Promise<void> {
  if (!quotaProviderId.value) return
  quotaLoading.value = true
  quotaError.value = ''
  try {
    const res = await channelApi.magpieQuotaRefresh(
      props.channel,
      quotaProviderId.value,
      quotaRows.value[0]?.user,
      { connectionId: connectionId.value },
    )
    const out = (res as any)?.data ?? res
    quotaRows.value = (out?.result?.quotas ?? out?.quotas ?? []) as MagpieQuota[]
    ElMessage.success('额度已刷新')
  } catch (e: any) {
    quotaError.value = e?.message ?? String(e)
  } finally {
    quotaLoading.value = false
  }
}

/** 额度卡类型文案 */
function quotaKindText(quota: MagpieQuota): string {
  if (quota.kind === 'balance') return '余额'
  if (quota.kind === 'subscription') return '订阅'
  return String(quota.kind ?? '额度')
}

/** 额度卡里的窗口列表（结构由上游决定，做空值兜底） */
function quotaWindows(quota: MagpieQuota): Array<Record<string, unknown>> {
  return Array.isArray(quota.windows) ? quota.windows : []
}

/** 窗口名 */
function windowName(w: Record<string, unknown>): string {
  return String(w.name ?? w.Name ?? '窗口')
}

/** 窗口用量：remaining / limit 单位 */
function windowAmount(w: Record<string, unknown>): string {
  // 自建的余额源（source=spi）给的是拼好的展示串，直接用；网关的续窗口才有数量字段
  const display = w.display ?? w.Display
  if (typeof display === 'string' && display.trim()) return display.trim()
  const remaining = w.remaining ?? w.Remaining
  const limit = w.limit ?? w.Limit
  const unit = w.unit ?? w.Unit ?? ''
  if (remaining === undefined && limit === undefined) return '—'
  if (limit === undefined) return `${remaining} ${unit}`.trim()
  return `${remaining ?? '?'} / ${limit} ${unit}`.trim()
}

/** 窗口重置时间（毫秒时间戳） */
function windowReset(w: Record<string, unknown>): string {
  const raw = w.resetsAt ?? w.ResetsAt ?? w.resetAt
  const ms = Number(raw)
  if (!raw || Number.isNaN(ms) || ms <= 0) return ''
  const date = new Date(ms)
  return `重置 ${date.toLocaleString()}`
}

/** 对象摘要（最多 80 字） */
function briefText(value: unknown): string {
  try {
    const text = typeof value === 'string' ? value : JSON.stringify(value)
    return text.length > 80 ? text.slice(0, 80) + '…' : text
  } catch {
    return '—'
  }
}

onUnmounted(stopSignin)

/** 协议摘要 */
/**
 * 上游的品牌图标（后端内联的 data URL）。
 *
 * <p>magpie 的图标挂在它的管理面且要页面 Cookie，浏览器取不到，由后端取回后
 * 随 provider 列表内联；取不到时字段缺失，这里返回空串让表格只显示名称。</p>
 *
 * @param provider 上游实例
 * @returns data URL 或空串
 */
function iconOf(provider: MagpieProvider): string {
  const dataUrl = provider?.iconDataUrl
  return typeof dataUrl === 'string' ? dataUrl : ''
}

function protocolText(provider: MagpieProvider): string {
  const list: string[] = []
  if (provider.chat) list.push('chat')
  if (provider.responses) list.push('responses')
  if (provider.anthropic) list.push('anthropic')
  if (provider.gemini) list.push('gemini')
  return list.length ? list.join(' / ') : '—'
}

/** 凭据展示：优先脱敏 key，其次 keyList 条数（magpie 的凭据在 keyList 里） */
function credentialText(provider: MagpieProvider): string {
  if (provider.key) return String(provider.key)
  const count = provider.keyCount
    ?? (Array.isArray(provider.keyList) ? provider.keyList.length : 0)
  return count > 0 ? `已配置 ${count} 条` : '无'
}

/**
 * 账号数：内置凭据行 + 插件账号数。
 *
 * <p>magpie 的 provider 行同时可能有两种账号：内置 {@code keyList} 与插件接管后的
 * {@code pluginAccounts}。分开报，才能看出插件到底接管了多少个账号。</p>
 *
 * @param provider 上游行
 * @returns 账号摘要
 */
function accountText(provider: MagpieProvider): string {
  const builtin = provider.keyCount
    ?? (Array.isArray(provider.keyList) ? provider.keyList.length : 0)
  const plugin = Number(provider.pluginAccounts ?? 0)
  const account = (provider as Record<string, unknown>).account as Record<string, unknown> | undefined
  const logins = Array.isArray(account?.logins) ? account.logins.length : 0
  const parts: string[] = []
  if (builtin > 0) parts.push(`内置 ${builtin}`)
  if (plugin > 0) parts.push(`插件 ${plugin}`)
  if (logins > 0) parts.push(`登录 ${logins}`)
  return parts.length ? parts.join(' · ') : '—'
}

/** 模型 id 归一：magpie 下发对象数组 [{id,name}]，也兼容字符串数组 */
function modelIdsOf(models: MagpieProvider['models']): string[] {
  const ids: string[] = []
  for (const item of models ?? []) {
    if (typeof item === 'string' && item.trim()) ids.push(item.trim())
    else if (item && typeof item === 'object' && item.id) ids.push(String(item.id))
  }
  return Array.from(new Set(ids))
}

/** 从上游响应里挖出模型 id */
function extractModelIds(result: any): string[] {
  const raw = result?.modelIds
    ?? result?.models
    ?? result?.provider?.models
    ?? result?.data
    ?? result?.ids
  if (!Array.isArray(raw)) return []
  const ids: string[] = []
  for (const item of raw) {
    if (typeof item === 'string' && item.trim()) ids.push(item.trim())
    else if (item && typeof item === 'object' && item.id) ids.push(String(item.id))
  }
  return Array.from(new Set(ids))
}

/** 响应摘要（最多 120 字） */
function brief(value: unknown): string {
  try {
    const text = typeof value === 'string' ? value : JSON.stringify(value)
    return text.length > 120 ? text.slice(0, 120) + '…' : text
  } catch {
    return '已返回'
  }
}

/**
 * 连通性测试结果的可读摘要。
 *
 * <p>magpie 的 {@code /api/provider/test} 返回
 * {@code {results:[{protocol,ok,status,ms,model,error}]}}。把这段 JSON 原样塞进 toast
 * 用户读不出「通没通、哪个协议、为什么失败」，这里按协议拼成人话：
 * 「anthropic 连通（200 · 1.8s · MiniMax-M3.1-Flash）」。</p>
 *
 * @param value 动作接口返回的 result
 * @returns 可读摘要；结构不认识时退回原文摘要
 */
function testSummary(value: unknown): string {
  const result = value as Record<string, unknown> | undefined
  const results = Array.isArray(result?.results) ? (result!.results as Record<string, unknown>[]) : []
  if (!results.length) return brief(value)
  return results
    .map((row) => {
      const protocol = String(row?.protocol ?? '未知协议')
      const ok = row?.ok === true || Number(row?.status) === 200
      const bits: string[] = []
      if (row?.status != null) bits.push(String(row.status))
      if (row?.ms != null && Number.isFinite(Number(row.ms))) {
        bits.push((Math.round(Number(row.ms) / 100) / 10).toFixed(1) + 's')
      }
      if (row?.model) bits.push(String(row.model))
      const detail = bits.length ? `（${bits.join(' · ')}）` : ''
      const error = row?.error ? '：' + String(row.error) : ''
      return `${protocol} ${ok ? '连通' : '失败'}${detail}${error}`
    })
    .join('；')
}

/**
 * 测试结果是否全部连通。
 *
 * <p>只用于挑选 toast 的类型（成功 / 警告），不影响展示的摘要。</p>
 *
 * @param value 动作接口返回的 result
 * @returns 全部协议成功时为 true；没有结果时按「未知」处理为 false
 */
function testAllOk(value: unknown): boolean {
  const result = value as Record<string, unknown> | undefined
  const results = Array.isArray(result?.results) ? (result!.results as Record<string, unknown>[]) : []
  return results.length > 0 && results.every((row) => row?.ok === true || Number(row?.status) === 200)
}
</script>

<style scoped>
.mg-up {
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.mg-up__head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  flex-wrap: wrap;
}
.mg-up__title {
  font-size: 13px;
  font-weight: 600;
  color: var(--el-text-color-primary, #303133);
}
.mg-up__title i {
  margin-left: 4px;
  font-style: normal;
  font-weight: 400;
  color: var(--el-text-color-secondary, #909399);
}
.mg-up__ops {
  display: inline-flex;
  align-items: center;
  gap: 8px;
}
.mg-up__select {
  height: 28px;
  padding: 0 8px;
  border-radius: 6px;
  border: 1px solid var(--el-border-color, #dcdfe6);
  background: var(--el-fill-color-blank, #fff);
  color: var(--el-text-color-regular, #606266);
  font-size: 12px;
}
.mg-up__btn {
  padding: 5px 12px;
  border-radius: 6px;
  border: 1px solid var(--el-border-color, #dcdfe6);
  background: var(--el-fill-color-blank, #fff);
  color: var(--el-text-color-regular, #606266);
  font-size: 12.5px;
  cursor: pointer;
}
.mg-up__btn:hover {
  border-color: var(--el-color-primary-light-5, #a0cfff);
  color: var(--el-color-primary, #409eff);
}
.mg-up__btn:disabled {
  opacity: 0.55;
  cursor: not-allowed;
}
.mg-up__btn.is-primary {
  border-color: var(--el-color-primary, #409eff);
  background: var(--el-color-primary, #409eff);
  color: #fff;
}
.mg-up__hint {
  margin: 0;
  font-size: 12px;
  color: var(--el-text-color-secondary, #909399);
}
.mg-up__error {
  margin: 0;
  padding: 8px 12px;
  border-radius: 8px;
  font-size: 12.5px;
  color: var(--el-color-danger, #f56c6c);
  background: var(--el-color-danger-light-9, #fef0f0);
}
.mg-up__tablewrap {
  overflow-x: auto;
  border: 1px solid var(--el-border-color-lighter, #ebeef5);
  border-radius: 8px;
}
.mg-up__table {
  width: 100%;
  border-collapse: collapse;
  font-size: 12.5px;
}
.mg-up__table th,
.mg-up__table td {
  padding: 8px 10px;
  text-align: left;
  border-bottom: 1px solid var(--el-border-color-lighter, #ebeef5);
  white-space: nowrap;
}
.mg-up__table th {
  font-weight: 600;
  color: var(--el-text-color-secondary, #909399);
  background: var(--el-fill-color-light, #f5f7fa);
}
.mg-up__table tbody tr:last-child td {
  border-bottom: none;
}
/* 从「Magpie 托管」分组点进来时，高亮对应上游这一行 */
.mg-up__table tbody tr.is-focus td {
  background: color-mix(in srgb, var(--el-color-primary, #409eff) 8%, transparent);
}
.mg-up__table td.is-name {
  max-width: 160px;
  overflow: hidden;
  text-overflow: ellipsis;
  color: var(--el-text-color-primary, #303133);
}
/* 上游品牌图标：与文字同基线，避免撑高表格行 */
.mg-up__icon {
  width: 16px;
  height: 16px;
  object-fit: contain;
  vertical-align: -3px;
  margin-right: 6px;
}
.mg-up__table td.is-id {
  max-width: 140px;
  overflow: hidden;
  text-overflow: ellipsis;
  color: var(--el-text-color-secondary, #909399);
}
.mg-up__table td.is-actions,
.mg-up__table th.is-actions {
  text-align: right;
}
.mg-up__tag {
  padding: 1px 6px;
  border-radius: 4px;
  font-size: 11.5px;
  color: var(--el-color-success, #67c23a);
  background: var(--el-color-success-light-9, #f0f9eb);
}
.mg-up__tag.is-off {
  color: var(--el-text-color-secondary, #909399);
  background: var(--el-fill-color-light, #f5f7fa);
}
.mg-up__link {
  padding: 0 6px;
  border: none;
  background: none;
  color: var(--el-color-primary, #409eff);
  font-size: 12.5px;
  cursor: pointer;
}
.mg-up__link:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
.mg-up__link.is-danger {
  color: var(--el-color-danger, #f56c6c);
}
.mg-up__empty,
.mg-up__empty-cell {
  padding: 18px 0;
  text-align: center;
  font-size: 12.5px;
  color: var(--el-text-color-secondary, #909399);
}
.mg-up__form {
  padding-top: 4px;
}
.mg-up__grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0 12px;
}
.mg-up__formhint {
  display: block;
  margin-top: 3px;
  font-size: 11px;
  line-height: 1.5;
  color: var(--el-text-color-secondary, #909399);
}

/* ── 接入方式切换 ── */
.mg-up__mode {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 6px;
}
.mg-up__mode-name {
  flex: 0 0 auto;
  font-size: 12.5px;
  color: var(--el-text-color-regular, #606266);
}
.mg-up__seg {
  display: inline-flex;
  padding: 2px;
  border-radius: 8px;
  background: var(--el-fill-color-light, #f5f7fa);
  border: 1px solid var(--el-border-color-lighter, #ebeef5);
}
.mg-up__seg button {
  padding: 4px 12px;
  border: 0;
  border-radius: 6px;
  background: transparent;
  font-size: 12.5px;
  line-height: 18px;
  color: var(--el-text-color-regular, #606266);
  cursor: pointer;
  transition: background-color 0.15s, color 0.15s;
}
.mg-up__seg button.is-on {
  background: var(--el-bg-color, #fff);
  color: var(--el-color-primary, #409eff);
  font-weight: 600;
  box-shadow: 0 1px 3px rgb(0 0 0 / 8%);
}
.mg-up__modehint {
  margin: 0 0 12px;
  font-size: 11.5px;
  line-height: 1.6;
  color: var(--el-text-color-secondary, #909399);
}
.mg-up__select-wide {
  width: 100%;
}
.mg-up__opt-name {
  margin-right: 8px;
}
.mg-up__opt-hint {
  font-size: 11px;
  color: var(--el-text-color-secondary, #909399);
}
.mg-up__presethint {
  margin: 4px 0 0;
  font-size: 11px;
  line-height: 1.6;
  color: var(--el-text-color-secondary, #909399);
}
.mg-up__presethint a {
  margin-left: 4px;
  color: var(--el-color-primary, #409eff);
  text-decoration: none;
}
.mg-up__presethint a:hover {
  text-decoration: underline;
}
.mg-up__more {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  margin: 0 0 12px;
  padding: 8px 10px;
  border: 1px dashed var(--el-border-color, #dcdfe6);
  border-radius: 6px;
  background: transparent;
  font-size: 12px;
  line-height: 18px;
  color: var(--el-text-color-regular, #606266);
  cursor: pointer;
}
.mg-up__more:hover {
  border-color: var(--el-color-primary-light-5, #a0cfff);
  color: var(--el-color-primary, #409eff);
}
/* ── 余额查询（我们自己的配置） ── */
.mg-up__credit-test {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
  margin-bottom: 8px;
}
.mg-up__formhint.is-error {
  color: var(--el-color-danger, #f56c6c);
}
.mg-up__tag.is-plugin {
  margin-left: 6px;
  color: var(--el-color-primary, #409eff);
  background: var(--el-color-primary-light-9, #ecf5ff);
}
.mg-up__signin {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding-top: 4px;
}
.mg-up__signin-state {
  margin: 0;
  font-size: 13px;
  color: var(--el-text-color-regular, #606266);
}
.mg-up__signin-state b.is-waiting,
.mg-up__signin-state b.is-installing {
  color: var(--el-color-warning, #e6a23c);
}
.mg-up__signin-state b.is-done {
  color: var(--el-color-success, #67c23a);
}
.mg-up__signin-state b.is-failed {
  color: var(--el-color-danger, #f56c6c);
}
.mg-up__signin-url {
  padding: 8px 10px;
  border-radius: 6px;
  background: var(--el-fill-color-light, #f5f7fa);
  font-size: 12px;
  word-break: break-all;
}
.mg-up__signin-url a {
  color: var(--el-color-primary, #409eff);
  text-decoration: none;
}
/* 聚焦上游的账号 / 积分：紧跟在选中行下方，不弹窗 */
.mg-up__focus-row > td {
  padding: 0 10px 10px;
  background: var(--el-fill-color-light, #f5f7fa);
}
.mg-up__focus-panel {
  padding: 10px 12px;
  border: 1px dashed var(--el-color-primary-light-5, #a0cfff);
  border-radius: 8px;
  background: var(--el-fill-color-blank, #fff);
}
.mg-up__focus-head {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
  margin-bottom: 8px;
}
.mg-up__quota-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
  gap: 8px;
}
.mg-up__quota {
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding-top: 4px;
}
.mg-up__quota-card {
  padding: 10px 12px;
  border: 1px solid var(--el-border-color-lighter, #ebeef5);
  border-radius: 8px;
  background: var(--el-fill-color-blank, #fff);
}
.mg-up__quota-head {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
  font-size: 12.5px;
  color: var(--el-text-color-primary, #303133);
}
.mg-up__quota-head .mg-up__tag {
  margin-left: 0;
}
.mg-up__quota-head .mg-up__formhint {
  margin: 0;
}
.mg-up__quota-balance {
  margin: 6px 0 0;
  font-size: 12.5px;
  color: var(--el-text-color-regular, #606266);
}
.mg-up__quota-list {
  list-style: none;
  margin: 6px 0 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.mg-up__quota-list li {
  display: flex;
  align-items: baseline;
  gap: 12px;
  font-size: 12px;
  color: var(--el-text-color-regular, #606266);
}
.mg-up__quota-list li .mg-up__formhint {
  margin: 0;
}
@media (max-width: 640px) {
  .mg-up__grid {
    grid-template-columns: 1fr;
  }
}
</style>
