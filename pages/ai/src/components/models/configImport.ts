/**
 * 配置文件导入的纯解析逻辑：把 opencode 的 jsonc 配置、cc-switch 的
 * SQLite providers 行，统一解析成「供应商草稿 + 模型清单」。
 *
 * <p>刻意保持<b>零依赖、不碰 DOM / 网络</b>：JSONC 注释剥离、cc-switch 三种
 * settings_config 形态（claude env / codex auth+TOML / openclaw baseUrl+models）
 * 的判定全部收在本文件，Node 探针可直接加载验证；Vue 组件
 * （ConfigImportDialog）只负责文件读取、预览与创建请求。</p>
 *
 * <p>平台映射口径：cc-switch 的 claude 条目来自 Claude Code 的
 * ANTHROPIC_BASE_URL（Anthropic Messages 协议）→ platform=anthropic；
 * codex / openclaw / opencode 默认都是 OpenAI 兼容网关 → platform=custom
 * （与 ProviderFormDialog 自定义添加一致）。</p>
 */

/** 模型能力任务类型（与 buildProviderModelBody 的 capabilities[].task 对齐） */
export type ImportTask = 'chat' | 'image_generation' | 'video_generation'

/** 一个待导入模型 */
export interface ImportModelDraft {
  /** 模型 id（上游调用名） */
  id: string
  /** 展示名（缺省同 id） */
  name: string
  /** 上下文窗口（token），未知为 null */
  contextWindow: number | null
  /** 最大输出（token），未知为 null */
  maxOutputTokens: number | null
  /** 能力任务类型 */
  task: ImportTask
}

/** 一个待导入供应商（草稿） */
export interface ImportEntry {
  /** 来源内唯一键（opencode 的 provider id / cc-switch 的 `${app}:${id}`），勾选用 */
  key: string
  /** 来源 */
  source: 'opencode' | 'cc-switch'
  /** 建议供应商名（同批重名时已追加序号后缀） */
  name: string
  /** 平台：custom（OpenAI 兼容）/ anthropic（Anthropic Messages） */
  platform: string
  /** 上游地址；空串 = 不可导入 */
  baseUrl: string
  /** API Key；空串 = 无密钥（auth_scheme 落 none，导入后需补填） */
  apiKey: string
  /** 是否带密钥 */
  hasKey: boolean
  /** 模型清单（可为空：供应商先建，模型稍后手动添加） */
  models: ImportModelDraft[]
  /** 非空 = 跳过原因（该条不可导入，仅预览展示） */
  skip?: string
}

// ==================== JSONC 解析 ====================

/**
 * 剥离 JSONC 注释（// 与 /* *\/），字符串字面量内的 // 与 /* 不受影响
 * （避免误伤 "https://…" 这类 URL）。
 */
export function stripJsonComments(text: string): string {
  let out = ''
  let i = 0
  const n = text.length
  let inStr = false
  let escape = false
  while (i < n) {
    const c = text[i]
    if (inStr) {
      out += c
      if (escape) {
        escape = false
      } else if (c === '\\') {
        escape = true
      } else if (c === '"') {
        inStr = false
      }
      i++
      continue
    }
    if (c === '"') {
      inStr = true
      out += c
      i++
      continue
    }
    if (c === '/' && i + 1 < n) {
      const d = text[i + 1]
      if (d === '/') {
        // 行注释：吞到行首换行符为止（换行符保留，保住行号语义）
        while (i < n && text[i] !== '\n') i++
        continue
      }
      if (d === '*') {
        // 块注释：吞到 */
        i += 2
        while (i + 1 < n && !(text[i] === '*' && text[i + 1] === '/')) i++
        i += 2
        continue
      }
    }
    out += c
    i++
  }
  return out
}

/**
 * 去掉对象/数组收尾前的逗号（JSONC 允许尾逗号，JSON.parse 不允许）。
 * 字符串内的 `, }` 不受影响。
 */
export function removeTrailingCommas(text: string): string {
  let out = ''
  let inStr = false
  let escape = false
  for (let i = 0; i < text.length; i++) {
    const c = text[i]
    if (inStr) {
      out += c
      if (escape) {
        escape = false
      } else if (c === '\\') {
        escape = true
      } else if (c === '"') {
        inStr = false
      }
      continue
    }
    if (c === '"') {
      inStr = true
      out += c
      continue
    }
    if (c === ',') {
      let j = i + 1
      while (j < text.length && /\s/.test(text[j])) j++
      if (text[j] === '}' || text[j] === ']') continue // 丢弃尾逗号
    }
    out += c
  }
  return out
}

/** JSONC 文本 → JSON 对象（注释与尾逗号都容忍） */
export function parseJsonc(text: string): unknown {
  return JSON.parse(removeTrailingCommas(stripJsonComments(text)))
}

// ==================== opencode jsonc ====================

/**
 * 解析 opencode 配置（opencode.json / opencode.jsonc）：
 * `provider.<id>.{name,npm,options:{baseURL,apiKey},models:{<mid>:{name,limit:{context,output}}}}`
 */
export function parseOpencodeConfig(text: string): ImportEntry[] {
  const root = objOf(parseJsonc(text))
  const providers = objOf(root.provider ?? root.providers)
  const out: ImportEntry[] = []
  for (const [id, rawP] of Object.entries(providers)) {
    const p = objOf(rawP)
    const opts = objOf(p.options)
    const baseUrl =
      str(opts.baseURL) || str(opts.baseUrl) || str(opts.base_url) || str(p.baseURL) || str(p.baseUrl)
    const apiKey = str(opts.apiKey) || str(opts.api_key) || str(p.apiKey)
    // npm 包名带 anthropic → Anthropic 协议；其余按 OpenAI 兼容网关处理
    const npm = str(p.npm).toLowerCase()
    const platform = npm.includes('anthropic') ? 'anthropic' : 'custom'
    const models: ImportModelDraft[] = Object.entries(objOf(p.models))
      .map(([mid, rawM]) => {
        const m = objOf(rawM)
        const limit = objOf(m.limit)
        return {
          id: mid,
          name: str(m.name) || mid,
          contextWindow: numOrNull(limit.context),
          maxOutputTokens: numOrNull(limit.output),
          task: inferTask(mid, str(m.name)),
        }
      })
      .filter((m) => m.id)
    const entry: ImportEntry = {
      key: `opencode:${id}`,
      source: 'opencode',
      name: str(p.name) || id,
      platform,
      baseUrl,
      apiKey,
      hasKey: !!apiKey,
      models,
    }
    if (!baseUrl) entry.skip = '未配置 baseURL，无法导入'
    out.push(entry)
  }
  dedupeEntryNames(out)
  return out
}

// ==================== cc-switch SQLite ====================

/** cc-switch providers 表的一行（列名见 sqlite 表结构，值类型宽松） */
export interface CcSwitchRow {
  id?: unknown
  app_type?: unknown
  name?: unknown
  settings_config?: unknown
  website_url?: unknown
  category?: unknown
}

/**
 * cc-switch providers 行 → 导入草稿。
 *
 * <p>settings_config 三种形态：</p>
 * <ul>
 *   <li>claude：`{env:{ANTHROPIC_AUTH_TOKEN,ANTHROPIC_BASE_URL,ANTHROPIC_DEFAULT_SONNET_MODEL}}`</li>
 *   <li>codex：`{auth:{OPENAI_API_KEY},config:"<TOML：model / [model_providers.*] base_url>"}`</li>
 *   <li>openclaw：`{baseUrl,api,models:[{id,name,contextWindow,input[]}]}`（无密钥）</li>
 * </ul>
 * official 种子条目（env/auth 全空）→ skip，不导入。
 */
export function ccSwitchRowsToEntries(rows: CcSwitchRow[]): ImportEntry[] {
  const out: ImportEntry[] = []
  for (const row of rows || []) {
    const app = str(row.app_type).toLowerCase()
    const id = str(row.id)
    const rawName = str(row.name)
    const cfg = safeParseObject(row.settings_config)
    const display = rawName && rawName.toLowerCase() !== 'default' ? rawName : appLabel(app)

    let baseUrl = ''
    let apiKey = ''
    let platform = 'custom'
    let models: ImportModelDraft[] = []

    if (app === 'claude' || app === 'claude-desktop') {
      const env = objOf(cfg.env)
      baseUrl = str(env.ANTHROPIC_BASE_URL)
      apiKey = str(env.ANTHROPIC_AUTH_TOKEN)
      platform = 'anthropic'
      const mid = str(env.ANTHROPIC_DEFAULT_SONNET_MODEL)
      models = mid ? [draftModel(mid, mid, null, null, 'chat')] : []
    } else if (app === 'codex') {
      const auth = objOf(cfg.auth)
      apiKey = str(auth.OPENAI_API_KEY)
      const toml = str(cfg.config)
      baseUrl = match1(toml, /base_url\s*=\s*"([^"]+)"/)
      const mid = match1(toml, /(^|\n)\s*model\s*=\s*"([^"]+)"/, 2)
      models = mid ? [draftModel(mid, mid, null, null, 'chat')] : []
    } else if (app === 'openclaw') {
      baseUrl = str(cfg.baseUrl) || str(cfg.base_url)
      const list = Array.isArray(cfg.models) ? cfg.models : []
      models = list
        .map((rawM: unknown) => {
          const m = objOf(rawM)
          const mid = str(m.id)
          return draftModel(
            mid,
            str(m.name) || mid,
            numOrNull(m.contextWindow),
            numOrNull(m.maxOutputTokens ?? m.maxTokens),
            inferTask(mid, str(m.name), m.input),
          )
        })
        .filter((m: ImportModelDraft) => m.id)
    }

    const entry: ImportEntry = {
      key: `cc-switch:${app}:${id || rawName || out.length}`,
      source: 'cc-switch',
      name: display,
      platform,
      baseUrl,
      apiKey,
      hasKey: !!apiKey,
      models,
    }
    if (str(row.category).toLowerCase() === 'official') {
      entry.skip = '官方种子条目，无需导入'
    } else if (!baseUrl && !apiKey) {
      entry.skip = '无上游地址与密钥（空配置）'
    } else if (!baseUrl) {
      entry.skip = '未配置上游地址，无法导入'
    }
    out.push(entry)
  }
  dedupeEntryNames(out)
  return out
}

// ==================== 工具函数 ====================

function draftModel(
  id: string,
  name: string,
  contextWindow: number | null,
  maxOutputTokens: number | null,
  task: ImportTask,
): ImportModelDraft {
  return { id, name, contextWindow, maxOutputTokens, task }
}

/** app_type → 展示名（条目自身没有名字时兜底） */
function appLabel(app: string): string {
  if (app === 'claude') return 'Claude'
  if (app === 'codex') return 'Codex'
  if (app === 'openclaw') return 'OpenClaw'
  if (app === 'gemini') return 'Gemini'
  if (app === 'grokbuild') return 'Grok'
  return app || '未命名'
}

/** 按模型 id / 名称 / 输入模态推断任务类型 */
function inferTask(id: string, name: string, input?: unknown): ImportTask {
  const hay = `${id} ${name}`.toLowerCase()
  if (hay.includes('video')) return 'video_generation'
  if (hay.includes('image')) return 'image_generation'
  if (Array.isArray(input) && input.some((v) => String(v).toLowerCase() === 'image')) {
    return 'image_generation'
  }
  return 'chat'
}

/**
 * 同批重名去重：第 2 次及以后出现的名字追加序号（deepseek-v4-flash → …(2)）。
 * 直接改写 entry.name（导入时用它做供应商名）。
 */
export function dedupeEntryNames(entries: ImportEntry[]): void {
  const seen = new Map<string, number>()
  for (const e of entries) {
    const n = (seen.get(e.name) || 0) + 1
    seen.set(e.name, n)
    if (n > 1) e.name = `${e.name} (${n})`
  }
}

/** 安全解析 JSON 对象（cc-switch settings_config 可能是字符串 / 已是对象 / 空） */
function safeParseObject(v: unknown): Record<string, unknown> {
  if (v && typeof v === 'object' && !Array.isArray(v)) return v as Record<string, unknown>
  if (typeof v === 'string' && v.trim()) {
    try {
      const parsed = JSON.parse(v)
      if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) return parsed
    } catch {
      /* 非法 JSON 按空对象处理 */
    }
  }
  return {}
}

function objOf(v: unknown): Record<string, unknown> {
  return v && typeof v === 'object' && !Array.isArray(v) ? (v as Record<string, unknown>) : {}
}

function str(v: unknown): string {
  if (v == null) return ''
  return String(v).trim()
}

function numOrNull(v: unknown): number | null {
  if (v == null || v === '') return null
  const n = Number(v)
  return Number.isFinite(n) ? n : null
}

/** 正则取组（默认第 1 组），无命中返回空串 */
function match1(text: string, re: RegExp, group = 1): string {
  const m = re.exec(text)
  return m && m[group] ? m[group].trim() : ''
}
