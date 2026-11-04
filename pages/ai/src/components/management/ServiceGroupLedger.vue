<template>
  <div class="svc-ledger">
    <!-- ── 台账工具条：一行看完规模 → 过滤 → 复核 → 新建，新建是全页唯一强调动作 ── -->
    <div class="svc-toolbar">
      <span class="svc-count"><b>{{ rows.length }}</b> 个分组</span>
      <el-input
        v-model="keyword"
        class="svc-search"
        placeholder="过滤分组名 / 描述 / 模型 / 成员 Key"
        clearable
      />
      <el-button class="svc-btn" :loading="loading" @click="reload">刷新</el-button>
      <el-button type="primary" :disabled="readonly" @click="openCreate">
        <el-icon class="svc-btn__icon" aria-hidden="true"><AddIcon /></el-icon>
        新建分组
      </el-button>
    </div>

    <!-- 口径说明：分组到底管什么、成员关系存在哪一侧，一句话交代清楚 -->
    <p class="svc-ledger__note">
      分组是「一组模型 + 一组 Key」的收纳盒：Key 绑定分组后，可用模型自动收窄到分组清单
      （再与 Key 上的限定模型取交集）。成员关系以 <b>Key 侧</b>为唯一真源 ——
      在这里增删成员，保存时会直接写回每把 Key 的分组字段，移出名单的 Key 回到「不分组」。
    </p>

    <!-- 权限/接口降级：分组接口是 admin 专用，非管理员读到 403 时只读空表而不是报错页 -->
    <div class="svc-alert is-warn" v-if="forbidden">
      <span class="svc-alert__text">
        当前账号没有分组管理权限（接口返回 403）。Key 台账不受影响：
        仍可在 Key 的编辑弹窗里手动填写所属分组。
      </span>
      <button class="svc-alert__act" @click="reload">重试</button>
    </div>
    <div class="svc-alert is-danger" v-else-if="error">
      <span class="svc-alert__text">分组台账加载失败：{{ error }}</span>
      <button class="svc-alert__act" @click="reload">重试</button>
    </div>
    <div class="svc-alert is-warn" v-if="modelError">
      <span class="svc-alert__text">模型清单加载失败：{{ modelError }}（编辑时无法从模型管理选模型）</span>
      <button class="svc-alert__act" @click="loadModels">重试</button>
    </div>

    <!-- ── 台账表：一个分组一行；模型与成员都只露前几个，余量收进悬浮清单 ── -->
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
        <!-- 分组本体：名称主行 + 描述次行（描述为空时退化为分组主键，便于对日志） -->
        <template #col-name="{ row }">
          <div class="svc-grp">
            <b class="svc-grp__name" :title="row.name">{{ row.name }}</b>
            <i class="svc-grp__desc" :title="row.description || row.noText">
              {{ row.description || row.noText }}
            </i>
          </div>
        </template>

        <!-- 模型清单：台面上最多两个，其余收进 +N -->
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
          <!-- 空清单 ≠ 不能用：后端口径是「分组没配模型 = 不限制」，必须写出来 -->
          <span class="svc-chip is-empty" v-else title="分组成员 Key 不受模型限制">不限模型</span>
        </template>

        <!-- 成员 Key：名称 chip；数量与「含其它分组转入」是这一列真正的信息量 -->
        <template #col-members="{ row }">
          <div class="svc-models" v-if="row.members.length">
            <span
              class="svc-chip"
              v-for="m in row.members.slice(0, 2)"
              :key="m.id"
              :title="`${m.name} · ${m.key}`"
            >{{ m.name }}</span>
            <el-tooltip v-if="row.members.length > 2" placement="top" :show-after="180">
              <template #content>
                <div class="svc-model-list">
                  <span v-for="m in row.members" :key="m.id">{{ m.name }}</span>
                </div>
              </template>
              <span class="svc-chip is-more">+{{ row.members.length - 2 }}</span>
            </el-tooltip>
          </div>
          <span class="svc-chip is-empty" v-else title="没有 Key 绑定到这个分组">暂无成员</span>
        </template>

        <!-- 规模：模型数 / 成员数并排，等宽数字便于竖着扫 -->
        <template #col-scale="{ row }">
          <span class="svc-num" :title="`${row.modelCount} 个模型 · ${row.memberCount} 把 Key`">
            {{ row.modelCount }}<i> / </i>{{ row.memberCount }}
          </span>
        </template>

        <template #col-created="{ row }">
          <span class="svc-num" :title="row.createdAt || '—'">{{ row.createdText }}</span>
        </template>

        <template #col-actions="{ row }">
          <div class="svc-acts">
            <button
              class="svc-ico"
              :disabled="readonly"
              title="编辑（名称 / 描述 / 模型清单 / 成员 Key）"
              aria-label="编辑分组"
              @click="openEdit(row)"
            >
              <el-icon><EditIcon /></el-icon>
            </button>
            <button
              class="svc-ico svc-ico--danger"
              :disabled="readonly"
              title="删除分组"
              aria-label="删除分组"
              @click="remove(row)"
            >
              <el-icon><DeleteIcon /></el-icon>
            </button>
          </div>
        </template>

        <template #empty>
          <div class="svc-empty">
            <span class="svc-empty__mark" aria-hidden="true"></span>
            <b>{{ emptyText }}</b>
            <i>{{ emptyHint }}</i>
            <el-button
              v-if="!rows.length && !readonly"
              type="primary"
              class="svc-btn"
              style="margin-top: 6px"
              @click="openCreate"
            >
              <el-icon class="svc-btn__icon" aria-hidden="true"><AddIcon /></el-icon>
              新建第一个分组
            </el-button>
          </div>
        </template>
      </ReTable>
    </div>

    <!-- ════════════ 新建 / 编辑分组 ════════════ -->
    <ReDialog
      v-model="showForm"
      :title="editing ? '编辑分组' : '新建分组'"
      width="min(560px, 94vw)"
      append-to-body
    >
      <!-- 弹窗内容包一层 .svc：设计令牌（--svc-*）挂在 .svc 作用域上，el-dialog 又 Teleport 到 body -->
      <div class="svc">
        <div class="svc-quotaform">
          <!-- 摘要条：把「这次保存会动到谁」提前讲明白，保存前后都能自证 -->
          <p class="svc-quotaform__lead">
            <b>{{ form.name.trim() || '未命名分组' }}</b>
            <i>{{ form.models.length }} 个模型 · {{ form.appKeyIds.length }} 把 Key{{ transferText }}</i>
          </p>

          <el-form :model="form" label-width="92px" class="svc-form">
            <el-form-item label="名称" required>
              <el-input v-model="form.name" placeholder="如：生产环境 / 博客机器人" maxlength="40" show-word-limit />
            </el-form-item>

            <el-form-item label="描述">
              <el-input
                v-model="form.description"
                placeholder="这个分组给谁用、为什么这么切（可选）"
                maxlength="120"
                show-word-limit
              />
            </el-form-item>

            <!-- 模型清单：候选来自「模型管理」，留空 = 该组不限制模型 -->
            <el-form-item label="模型清单">
              <el-select
                v-model="form.models"
                class="svc-form__wide"
                multiple
                filterable
                collapse-tags
                collapse-tags-tooltip
                :loading="modelsLoading"
                placeholder="从模型管理选择该组允许的模型"
              >
                <el-option-group v-for="g in modelGroups" :key="g.key" :label="g.label">
                  <el-option v-for="code in g.models" :key="code" :label="code" :value="code" />
                </el-option-group>
              </el-select>
              <span class="svc-form__hint">
                留空表示该组<b>不限制模型</b>（沿用历史行为，不把老分组一键清空）；
                填了则只有清单内的模型能被组内 Key 调用，越权请求一律 403。
              </span>
            </el-form-item>

            <!-- 成员 Key：选中的 Key 会被写入本组；已在别的组的会迁移过来 -->
            <el-form-item label="成员 Key">
              <el-select
                v-model="form.appKeyIds"
                class="svc-form__wide"
                multiple
                filterable
                collapse-tags
                collapse-tags-tooltip
                :loading="keysLoading"
                :disabled="readonly"
                placeholder="选择归入本分组的 AppKey"
              >
                <el-option
                  v-for="k in keyOptions"
                  :key="k.id"
                  :label="k.label"
                  :value="k.id"
                />
              </el-select>
              <span class="svc-form__hint">
                一把 Key 只能属于一个分组：勾选即「迁入本组」，从名单里去掉即「放回不分组」。
                成员的归属写在 Key 侧，保存后 Key 台账会同步刷新。
              </span>
            </el-form-item>
          </el-form>
        </div>
      </div>

      <template #footer>
        <el-button @click="showForm = false">取消</el-button>
        <el-button type="primary" :loading="saving" @click="submit">
          {{ editing ? '保存' : '创建' }}
        </el-button>
      </template>
    </ReDialog>
  </div>
</template>

<script setup lang="ts">
/**
 * 分组台账（服务配置页「分组」页签）。
 *
 * <p>一个分组一行：模型清单、成员 Key、规模、创建时间。写操作只有「新建 / 编辑 / 删除」
 * 三个，全部落在 {@code /v2/groups} 上；后端的口径是 <b>成员关系的真源在 Key 侧</b>
 * （{@code sys_ai_app_key.sys_ai_app_key_group_id}），保存时双向对齐 —— 所以这里
 * 不需要也不应该另开一套「绑定 Key」的接口。</p>
 *
 * <p>三处刻意取舍：</p>
 * <ul>
 *   <li><b>成员 Key 直接可编辑</b>：分组的意义就是「把一批 Key 拢起来」，让用户先去 Key 台账
 *       逐把改分组、再回来这里看结果，是把一件事拆成两页做。</li>
 *   <li><b>空模型清单写成「不限模型」</b>：后端口径是「分组没配模型 = 不限制」，
 *       写成「无模型」会让人以为这组一把 Key 也用不了。</li>
 *   <li><b>403 只降级不报错</b>：分组接口带 {@code @Permission("admin")}，
 *       普通账号读到 403 是正常现象，Key 台账仍要能用。</li>
 * </ul>
 */
import { computed, onMounted, ref, watch } from 'vue'
import { message } from '@repo/core'
import { ElMessageBox } from 'element-plus'
import { Add24Regular, Edit24Regular } from '@vicons/fluent'
import { Delete } from '@element-plus/icons-vue'
import { adminApi } from '@/framework/context'
import { appKeyApi, groupApi } from '@/services/javaApi'
import ReTable from '@repo/ui/re-table'
import type { ReTableColumn } from '@repo/ui/re-table'
import ReDialog from '@repo/ui/re-dialog'

const props = withDefaults(
  defineProps<{
    /** 外部「全部刷新」按钮 / 页签切换的计数器：变化即重载 */
    refreshKey?: number
  }>(),
  { refreshKey: 0 },
)

const emit = defineEmits<{
  (e: 'stats', v: { total: number; models: number; keys: number }): void
  /** 分组或其成员发生变化：父级据此刷新 Key 台账（Key 的分组名 / 模型范围都跟着变） */
  (e: 'changed'): void
}>()

const AddIcon = Add24Regular
const EditIcon = Edit24Regular
const DeleteIcon = Delete

// ============================================================================
// 纯函数
// ============================================================================
/**
 * 后端无时区 {@code LocalDateTime}（"2026-08-03 14:03:11"）→ Date。
 *
 * <p>不 {@code new Date(str)}：Chrome 认这种变体，Firefox / Safari 给 Invalid Date。</p>
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

/** 创建时间：本年 MM-DD HH:mm，跨年 YYYY-MM-DD */
function shortTime(raw: unknown): string {
  const d = parseDateTime(raw)
  if (!d) return '—'
  const now = new Date()
  const md = pad2(d.getMonth() + 1) + '-' + pad2(d.getDate())
  const hm = pad2(d.getHours()) + ':' + pad2(d.getMinutes())
  return d.getFullYear() === now.getFullYear() ? `${md} ${hm}` : `${d.getFullYear()}-${md}`
}

/** Key 只露尾部 8 位：够分辨是哪一把，又不把整串密钥摊在屏幕上 */
function shortKey(t: string): string {
  const s = t || ''
  return s.length <= 12 ? s : '…' + s.slice(-8)
}

/** 名单里可能既有 list 也有 JSON 串（老数据），统一成字符串数组 */
function asStrings(raw: unknown): string[] {
  if (raw == null || raw === '') return []
  const parts = Array.isArray(raw) ? raw.map(String) : String(raw).split(',')
  const out: string[] = []
  for (const p of parts) {
    const v = p.trim()
    if (v && !out.includes(v)) out.push(v)
  }
  return out
}

/** 一个列表信封里真正的数组：裸数组 / {data} / {records} 都收 */
function asList(payload: any): any[] {
  if (Array.isArray(payload)) return payload
  if (payload && Array.isArray(payload.data)) return payload.data
  if (payload && Array.isArray(payload.records)) return payload.records
  return []
}

/**
 * 取出响应体载荷。
 *
 * <p>{@code /v2/app-keys} 是 {@code {code,data,msg}}，{@code /v2/groups} 是<b>裸数组</b>
 * （控制器直接 {@code return List}）。裸数组原样返回，其余才取 {@code data}。</p>
 */
function pick(res: any): any {
  if (res && res.success === false) throw new Error(res.msg || res.message || '请求被拒绝')
  if (Array.isArray(res)) return res
  return res?.data ?? res
}

/** 403 判定：框架把状态码包在 response.status / status 上，消息里也可能带 Forbidden */
function isForbidden(e: any): boolean {
  const status = e?.response?.status ?? e?.status ?? e?.code
  if (Number(status) === 403) return true
  const text = String(e?.message ?? '')
  return /403|forbidden|无权限|没有权限/i.test(text)
}

// ============================================================================
// 状态
// ============================================================================
const groups = ref<any[]>([])
const keys = ref<any[]>([])
const loading = ref(false)
const keysLoading = ref(false)
const error = ref('')
const forbidden = ref(false)
const keyword = ref('')
const showForm = ref(false)
const editing = ref<any>(null)
const saving = ref(false)
const modelGroups = ref<Array<{ key: string; label: string; models: string[] }>>([])
const modelsLoading = ref(false)
const modelError = ref('')

/** 只读态：没有 admin 权限时把写入口全部关掉，而不是让用户点了才吃到 403 */
const readonly = computed(() => forbidden.value)

// ============================================================================
// 行映射
// ============================================================================
const keyMap = computed<Map<number, any>>(() => {
  const map = new Map<number, any>()
  for (const k of keys.value) {
    const id = Number(k?.id)
    if (isFinite(id)) map.set(id, k)
  }
  return map
})

const rows = computed(() =>
  groups.value.map((g: any) => {
    const id = Number(g?.id ?? g?.groupId)
    const models = asStrings(g?.models ?? g?.groupModels)
    // appKeyIds 是后端按 Key 侧真源算出来的投影；组里出现对不上的 id 说明那把 Key
    // 刚被删掉（逻辑删除），标成 #id 让差异看得见，而不是静默少一行
    const memberIds = asList(g?.appKeyIds).map((v: any) => Number(v)).filter((v: number) => isFinite(v))
    const members = memberIds.map((kid: number) => {
      const k = keyMap.value.get(kid)
      return {
        id: kid,
        name: k ? String(k.name || `AppKey ${kid}`) : `#${kid}（已删除）`,
        key: k ? shortKey(String(k.key ?? k.appKey ?? '')) : '—',
        groupName: k?.groupName ?? '',
      }
    })
    return {
      id,
      name: String(g?.name ?? g?.groupName ?? `分组 ${id}`),
      description: String(g?.description ?? ''),
      noText: `#${id}`,
      models,
      memberIds,
      members,
      modelCount: models.length,
      memberCount: members.length,
      createdAt: g?.createdAt ?? '',
      createdText: shortTime(g?.createdAt),
    }
  }).filter((r) => isFinite(r.id)),
)

const columns = computed<ReTableColumn[]>(() => [
  { prop: 'name', label: '分组', minWidth: 210, slot: 'name' },
  { prop: 'models', label: '模型清单', minWidth: 190, slot: 'models' },
  { prop: 'members', label: '成员 Key', minWidth: 190, slot: 'members' },
  { prop: 'modelCount', label: '模型 / Key', width: 108, slot: 'scale' },
  { prop: 'createdAt', label: '创建时间', width: 104, slot: 'created' },
  { prop: 'actions', label: '操作', width: 92, slot: 'actions' },
])

const filteredRows = computed(() => {
  const kw = keyword.value.trim().toLowerCase()
  if (!kw) return rows.value
  return rows.value.filter((r) =>
    (r.name + ' ' + r.description + ' ' + r.models.join(' ') + ' ' + r.members.map((m: any) => m.name).join(' '))
      .toLowerCase().includes(kw),
  )
})

const emptyText = computed(() => (rows.value.length ? '没有匹配的分组' : '还没有分组'))
const emptyHint = computed(() =>
  rows.value.length
    ? '换个关键词试试'
    : '分组把「一批模型 + 一批 Key」捆在一起：改分组模型清单，组内所有 Key 的可用模型跟着变',
)

/** 成员 Key 候选：名称 + Key 尾巴；已属于别的分组的会标出来（勾选即迁移） */
const keyOptions = computed(() =>
  keys.value
    .map((k: any) => {
      const id = Number(k?.id)
      const name = String(k?.name || `AppKey ${id}`)
      const tail = shortKey(String(k?.key ?? k?.appKey ?? ''))
      // 归属名优先取 Key 行自带的分组名，回落到分组表里按 id 反查（老数据可能没有 groupName）
      const ownerName = String(k?.groupName ?? '')
        || String(groups.value.find((g: any) => Number(g.id ?? g.groupId) === Number(k?.groupId))?.name ?? '')
      const movingFrom = ownerName && Number(editing.value?.id) !== Number(k?.groupId)
        ? ` · 现属「${ownerName}」`
        : ''
      return { id, name, label: `${name}（${tail}）${movingFrom}` }
    })
    .filter((k) => isFinite(k.id)),
)

// ============================================================================
// 加载
// ============================================================================
function reload() {
  load()
  loadKeys()
}

async function load() {
  loading.value = true
  error.value = ''
  try {
    const res = await groupApi.list()
    groups.value = asList(pick(res))
    forbidden.value = false
  } catch (e: any) {
    // 403 与「接口挂了」要分开表达：前者是权限，后者才值得重试
    if (isForbidden(e)) {
      forbidden.value = true
      groups.value = []
    } else {
      forbidden.value = false
      error.value = e?.message || String(e)
    }
  } finally {
    loading.value = false
  }
}

/**
 * 成员 Key 名单：与 Key 台账同源。
 *
 * <p>失败不阻塞分组台账本身 —— 没有 Key 名单时成员列退化为 {@code #id}，
 * 编辑弹窗里的成员选择器为空，其余照常。</p>
 */
async function loadKeys() {
  if (keysLoading.value) return
  keysLoading.value = true
  try {
    const res = await appKeyApi.list()
    keys.value = asList(pick(res))
  } catch {
    keys.value = []
  } finally {
    keysLoading.value = false
  }
}

/**
 * 模型候选：与全站模型选择器同源（供应商 → 模型），按模型编码全局去重。
 *
 * <p>用 {@code /api/providers} 而不是 {@code /v2/models}：闸门判定用的是「编码」，
 * 后者是 sys_ai_model 的数字主键行、只覆盖已注册模型。</p>
 */
async function loadModels() {
  if (modelsLoading.value) return
  modelsLoading.value = true
  modelError.value = ''
  try {
    const body: any = await adminApi.get('/api/providers')
    const list = Array.isArray(body) ? body : (body?.data || [])
    const out: Array<{ key: string; label: string; models: string[] }> = []
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
        out.push({
          key: String(p.provider_id || p.id || p.platform || out.length),
          label: String(p.name || p.provider || p.platform || '未命名供应商'),
          models: codes,
        })
      }
    }
    modelGroups.value = out
    if (!out.length) modelError.value = '模型管理里没有启用的模型'
  } catch (e: any) {
    modelError.value = e?.message || String(e)
  } finally {
    modelsLoading.value = false
  }
}

// ============================================================================
// 表单
// ============================================================================
const form = ref(createForm())

function createForm(src?: any) {
  return {
    name: src?.name ?? '',
    description: src?.description ?? '',
    models: src ? src.models.slice() : [],
    appKeyIds: src ? src.memberIds.slice() : [],
  }
}

/** 摘要条里那句「其中 X 把来自其它分组（保存后迁移）」——先讲清代价，再让用户点保存 */
const transferText = computed(() => {
  const ids = new Set(form.value.appKeyIds.map(Number))
  let moved = 0
  for (const k of keys.value) {
    const kid = Number(k?.id)
    if (!ids.has(kid)) continue
    const owner = Number(k?.groupId)
    if (isFinite(owner) && owner !== Number(editing.value?.id)) moved++
  }
  return moved ? ` · 含 ${moved} 把来自其它分组（保存后迁移）` : ''
})

function openCreate() {
  if (readonly.value) return
  editing.value = null
  loadModels()
  loadKeys()
  form.value = createForm()
  showForm.value = true
}

function openEdit(row: any) {
  if (readonly.value) return
  editing.value = row
  loadModels()
  loadKeys()
  const next = createForm(row)
  // 模型清单只回显「模型管理里真有的」编码，免得下拉里冒出已下线模型；
  // 候选还没加载完（size=0）时先原样保留，不让一次编辑顺手删掉配置
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
  const name = f.name.trim()
  if (!name) {
    message.warning('请填写分组名称')
    return
  }
  const payload = {
    name,
    description: f.description.trim() || null,
    models: f.models.slice(),
    // 空数组是「解绑全部」的显式语义（后端 null 才是「不改动」），这里必须发 []
    appKeyIds: f.appKeyIds.map(Number),
  }
  saving.value = true
  try {
    if (editing.value) {
      await groupApi.update(editing.value.id, payload)
      message.success('已保存')
    } else {
      await groupApi.create(payload)
      message.success('分组已创建')
    }
    showForm.value = false
    editing.value = null
    await load()
    await loadKeys()
    // 成员迁移会改 Key 的分组字段：通知父级刷新 Key 台账，避免两页说法不一致
    emit('changed')
  } catch (e: any) {
    if (isForbidden(e)) {
      message.error('没有分组管理权限（403）')
    } else {
      message.error('保存失败: ' + (e?.message || e))
    }
  } finally {
    saving.value = false
  }
}

// ============================================================================
// 删除
// ============================================================================
async function remove(row: any) {
  if (readonly.value) return
  const n = row.memberCount
  try {
    await ElMessageBox.confirm(
      n
        ? `确定删除分组「${row.name}」？组内 ${n} 把 Key 会回到「不分组」：仍可调用，但不再受该组模型清单约束。`
        : `确定删除分组「${row.name}」？该组没有成员 Key。`,
      '删除分组',
      { type: 'warning', confirmButtonText: '删除', cancelButtonText: '取消' },
    )
    await groupApi.remove(row.id)
    message.success('已删除')
    await load()
    await loadKeys()
    emit('changed')
  } catch (e: any) {
    if (e === 'cancel' || e === 'close' || e?.message === 'cancel') return
    if (isForbidden(e)) {
      message.error('没有分组管理权限（403）')
    } else {
      message.error('删除失败: ' + (e?.message || e))
    }
  }
}

// ============================================================================
// 生命周期
// ============================================================================
watch(rows, (list) => {
  emit('stats', {
    total: list.length,
    models: list.reduce((s, r) => s + r.modelCount, 0),
    keys: list.reduce((s, r) => s + r.memberCount, 0),
  })
}, { immediate: true })

watch(() => props.refreshKey, () => { reload() })

onMounted(() => { reload() })

defineExpose({ reload })
</script>
