import { computed, ref } from 'vue'

/**
 * 人脸档案登记簿（浏览器本地）。
 *
 * <p><b>为什么仍放前端</b>：后端现在**已有** {@code GET /v2/face/list}（当前账号已登记条目，
 * 含登记时传入的元数据）与 {@code DELETE /v2/face/{id}}，服务端也**会持久化**这些档案字段
 * （快照 {@code <账号>/face/index.json}）。本登记簿保留的是前端专有字段
 * （如头像缩略图 {@code thumb}，后端不存），因此仍需本地留存；但**「这条档案在不在」
 * 的权威在服务端**，跨浏览器/跨账号时应以服务端列表为准。</p>
 *
 * <p><b>一致性注意</b>：向量库**已支持跨重启保留**（快照 + 启动重建索引），
 * 因此「后端重启导致向量清空」不再是常态；若 1:N 仍返回空命中，应先查服务端列表
 * 是否真有条目，再提示重新登记（见 {@link staleHint}）。</p>
 */

/** 一条人脸档案。字段与登记表单一一对应。 */
export interface FaceRecord {
  /** 与后端 enroll 的 id 一致，用于把 identify 命中的 id 关联回档案 */
  id: string
  name: string
  age: number | null
  /** 男 / 女 / 未知 */
  gender: string
  /** 身份证号；展示时一律脱敏 */
  idCard: string
  /** 发型，用于「相似发型」筛选 */
  hair: string
  /** 上镜感 1~5，用于「上镜感」筛选 */
  photogenic: number
  note: string
  /** 头像缩略图 dataURL */
  thumb: string
  enrolledAt: number
  /**
   * 登记地点纬度（选填）。
   *
   * <p>可选是有意的：这是后来才加的非必填字段，历史登记记录里没有它。
   * undefined 表示「未填写」，与填了 0 区分开 —— 0 是几内亚湾上的合法坐标。</p>
   */
  lat?: number | null
  /** 登记地点经度（选填），语义同 {@link lat} */
  lng?: number | null
  /**
   * 所属分组（选填）。
   *
   * <p>为什么本地也要记：服务端列表是**按分组**查的，而本登记簿的清理逻辑是
   * 「服务端没有的就是幽灵条目」。不带分组记这一笔，切到 B 组时就会把 A 组的本地
   * 缩略图全部当成幽灵删掉。undefined = 改造前登记的档案，视为 default。</p>
   */
  group?: string
}

/** 后端约定的默认分组名；历史数据（group 为 NULL/undefined）也归属它 */
const FALLBACK_GROUP = 'default'

/**
 * 归一化分组名：空白视为 default。
 *
 * @param group 分组名
 * @returns 可比较的分组名
 */
export function normalizeGroupName(group?: string | null): string {
  const g = (group ?? '').trim()
  return g || FALLBACK_GROUP
}

const STORAGE_KEY = 'face_registry_v1'

function load(): FaceRecord[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? (parsed as FaceRecord[]) : []
  } catch {
    // 存档损坏时不要让整页崩，当空库处理
    return []
  }
}

const records = ref<FaceRecord[]>(load())

function persist() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(records.value))
  } catch {
    // 隐私模式 / 配额满：档案丢失不应中断登记流程
  }
}

/**
 * 新增或覆盖一条档案。
 *
 * <p>按 id + 分组去重：同一个 id 可能同时存在于多个分组（两组各登记一次），
 * 只按 id 覆盖会让另一组的缩略图看起来"串组"了。</p>
 */
function upsert(record: FaceRecord) {
  const g = normalizeGroupName(record.group)
  const i = records.value.findIndex((r) => r.id === record.id && normalizeGroupName(r.group) === g)
  if (i >= 0) records.value[i] = record
  else records.value.unshift(record)
  persist()
}

/**
 * 删除本地档案。
 *
 * @param id 人脸标识
 * @param group 分组；传了只删该分组的那条，不传则删掉该 id 的全部（兼容旧调用方）
 */
function remove(id: string, group?: string) {
  if (group === undefined) {
    records.value = records.value.filter((r) => r.id !== id)
  } else {
    const g = normalizeGroupName(group)
    records.value = records.value.filter(
      (r) => !(r.id === id && normalizeGroupName(r.group) === g),
    )
  }
  persist()
}

function clear() {
  records.value = []
  persist()
}

/**
 * 按 id 取档案。
 *
 * @param id 人脸标识
 * @param group 指定分组时优先取该分组的档案（同 id 跨分组时避免取错组的缩略图）
 * @returns 档案；不存在时 undefined
 */
function byId(id: string, group?: string): FaceRecord | undefined {
  const list = records.value.filter((r) => r.id === id)
  if (!list.length) return undefined
  if (group !== undefined) {
    const g = normalizeGroupName(group)
    return list.find((r) => normalizeGroupName(r.group) === g) ?? list[0]
  }
  return list[0]
}

/** 身份证脱敏：保留前 4 后 4，中间打码。避免在页面上直接暴露完整证件号。 */
export function maskIdCard(idCard: string): string {
  const v = (idCard ?? '').trim()
  if (!v) return ''
  if (v.length <= 8) return v.replace(/.(?=.{2})/g, '*')
  return `${v.slice(0, 4)}${'*'.repeat(Math.max(4, v.length - 8))}${v.slice(-4)}`
}

/** 身份证号格式粗校验（18 位，末位可为 X）。只做形态校验，不验校验位。 */
export function isValidIdCard(v: string): boolean {
  return /^\d{17}[\dXx]$/.test((v ?? '').trim())
}

/** 手机号粗校验，用于联系方式字段。 */
export function isValidPhone(v: string): boolean {
  return /^1[3-9]\d{9}$/.test((v ?? '').trim())
}

/** 年龄段分桶，用于「同年龄段」筛选与展示。 */
export function ageBucket(age: number | null | undefined): string {
  if (age == null || !Number.isFinite(age)) return '未知'
  const a = Math.floor(age)
  if (a < 18) return '未成年'
  if (a <= 25) return '18-25'
  if (a <= 35) return '26-35'
  if (a <= 45) return '36-45'
  if (a <= 55) return '46-55'
  return '56+'
}

/** 两个年龄是否算「同年龄段」（差 5 岁内）。年龄未知时不算命中。 */
export function isSameAgeRange(a: number | null, b: number | null, tolerance = 5): boolean {
  if (a == null || b == null || !Number.isFinite(a) || !Number.isFinite(b)) return false
  return Math.abs(a - b) <= tolerance
}

export function useFaceRegistry() {
  return {
    records,
    upsert,
    remove,
    clear,
    byId,
    /** 已登记张数 */
    count: computed(() => records.value.length),
    /**
     * 存档与后端向量库可能不同步（后端重启会清空内存向量），
     * 有档案但一个都没匹配上时，页面据此提示需要重新登记。
     */
    staleHint: computed(() => records.value.length > 0),
  }
}
