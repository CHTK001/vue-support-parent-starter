/**
 * 基于 JSZip 的极简电子表格稀疏单元格索引，供:
 *   - 选区统计（求和 / 平均值 / 计数 / 中位数 / 标准差 / 极值 / 非空 / 去重 …）
 *   - 选区复制（制表符分隔文本写入系统剪贴板）
 *
 * 纯前端；只在初次触发选区事件时懒加载。
 * 支持四类容器：
 *   - OOXML（.xlsx/.xlsm，以及 .xls 经 WASM 转换后的 xlsx 字节）
 *   - 纯文本分隔（.csv/.tsv，逗号 / 分号 / 制表符 / 竖线自动嗅探）
 *   - OpenDocument 压缩包（.ods，读 content.xml）
 *   - OpenDocument 扁平 XML（.fods，单文件 XML）
 *
 * 不处理格式、合并单元格、图表；统计只看单元格值。
 */

export type CellValue = number | string | boolean;

export interface SheetGrid {
  /** 工作表名（workbook.xml / content.xml 中声明的名称） */
  name: string
  /** 稀疏单元格索引：key = "rowIndex:colIndex"（0 基），value = 原始值 */
  cells: Map<string, CellValue>
}

export interface ParsedXlsx {
  sheets: SheetGrid[]
}

export interface RangeSelection {
  sri: number
  sci: number
  eri: number
  eci: number
}

export interface RangeStats {
  /** 数值单元格求和 */
  sum: number
  /** 数值单元格平均值 */
  avg: number
  /** 数值单元格个数 */
  count: number
  /** 数值单元格最小值 */
  min: number
  /** 数值单元格最大值 */
  max: number
  /** 数值单元格中位数 */
  median: number
  /** 数值单元格样本标准差（n-1；样本不足 2 个为 0） */
  stdev: number
  /** 非空单元格个数（数值 + 文本 + 布尔） */
  nonEmpty: number
  /** 去重后的取值个数（按类型区分，如 4 与 "4" 视为不同） */
  distinct: number
  /** 选区总单元格数（含空白） */
  total: number
}

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

const cellKey = (r: number, c: number): string => `${r}:${c}`

/** 去重用的类型化键，避免 4 与 "4" 被合并 */
function distinctKey(v: CellValue): string {
  if (typeof v === 'number') return `n:${v}`
  if (typeof v === 'boolean') return `b:${v}`
  return `s:${v}`
}

/** 列序号（0 基）→ Excel 列字母，如 0→A、1→B、26→AA */
export function colIndexToLetter(index: number): string {
  let n = index + 1
  let s = ''
  while (n > 0) {
    const rem = (n - 1) % 26
    s = String.fromCharCode(65 + rem) + s
    n = Math.floor((n - 1) / 26)
  }
  return s || 'A'
}

function letterToColIndex(letters: string): number {
  let n = 0
  for (const ch of letters) n = n * 26 + (ch.charCodeAt(0) - 64)
  return n - 1
}

/** 最简 XML 解码（仅处理电子表格中用到的实体） */
function decodeXml(s: string): string {
  return s
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&#(\d+);/g, (_, d) => String.fromCharCode(Number(d)))
    .replace(/&#x([0-9a-fA-F]+);/g, (_, h) => String.fromCharCode(parseInt(h, 16)))
    .replace(/&amp;/g, '&')
}

/** 提取 <t> 标签中的文本（含 <si>/<is> 下的多段 <t>） */
function extractTexts(xml: string): string {
  let out = ''
  for (const m of xml.matchAll(/<t\b[^>]*>([\s\S]*?)<\/t>/g)) out += decodeXml(m[1])
  return out
}

/** 去掉标签只留文本（ODS 的 text:p 里可能还有 text:span 等） */
function stripTags(xml: string): string {
  return decodeXml(xml.replace(/<[^>]*>/g, ''))
}

/** 提取 ODS 单元格富文本：多个 <text:p> 用换行连接，<text:s/> / <text:tab/> 还原 */
function extractOdsText(body: string): string {
  const normalized = body
    .replace(/<text:tab\b[^>]*\/>/g, '\t')
    .replace(/<text:line-break\b[^>]*\/>/g, '\n')
    .replace(/<text:s\b[^>]*\/>/g, ' ')
  const paragraphs: string[] = []
  for (const m of normalized.matchAll(/<text:p\b[^>]*>([\s\S]*?)<\/text:p>/g)) {
    paragraphs.push(stripTags(m[1]))
  }
  if (paragraphs.length) return paragraphs.join('\n')
  // 少数文件直接在单元格里放文本
  return stripTags(normalized)
}

/* ------------------------------------------------------------------ */
/*  OOXML parser                                                       */
/* ------------------------------------------------------------------ */

/** 解析一个工作表的 <c> 单元格 */
function parseSheetCells(xml: string, shared: string[] | null): Map<string, CellValue> {
  const cells = new Map<string, CellValue>()

  for (const m of xml.matchAll(/<c\b([^>]*?)(?:\/>|>([\s\S]*?)<\/c>)/g)) {
    const attrs = m[1] ?? ''
    const ref = /\br="([A-Z]+)(\d+)"/.exec(attrs)
    if (!ref) continue
    const col = letterToColIndex(ref[1])
    const row = parseInt(ref[2], 10) - 1
    const t = /\bt="([^"]*)"/.exec(attrs)?.[1] ?? ''
    const inner = m[2] ?? ''
    const vMatch = /<v[^>]*>([\s\S]*?)<\/v>/.exec(inner)
    let value: CellValue | undefined

    switch (t) {
      case 's': { // shared string
        if (vMatch && shared) {
          const idx = parseInt(vMatch[1], 10)
          if (idx >= 0 && idx < shared.length) value = shared[idx]
        }
        break
      }
      case 'str': // formula string result
        value = vMatch ? decodeXml(vMatch[1]) : undefined
        break
      case 'inlineStr': // inline string
        value = extractTexts(inner)
        break
      case 'b': // boolean
        value = vMatch ? vMatch[1].trim() === '1' : undefined
        break
      case 'e': // error – skip
        break
      case 'd': // ISO date – skip for stats
        break
      default: { // number or no type
        if (vMatch) {
          const n = Number(vMatch[1])
          if (Number.isFinite(n)) value = n
        }
      }
    }

    if (value !== undefined && value !== '') {
      cells.set(cellKey(row, col), value as CellValue)
    }
  }

  return cells
}

/** 最简路径解析：处理相对 / 绝对路径，拼到 xl/ 前缀 */
function resolveSheetPath(target: string): string {
  const t = target.replace(/\\/g, '/')
  // 去掉前导 /
  const clean = t.startsWith('/') ? t.slice(1) : t
  return clean.startsWith('xl/') ? clean : `xl/${clean}`
}

/** 从 xlsx ArrayBuffer 完整解析工作簿 */
export async function parseXlsxWorkbook(bytes: ArrayBuffer): Promise<ParsedXlsx> {
  // JSZip 懒加载（剩余 100+ KB 不阻塞主 chunk）
  const mod = await import('jszip')
  const JSZip = mod.default as unknown as typeof import('jszip')
  const zip = await JSZip.loadAsync(bytes)

  // 1) workbook.xml — 获取 sheet 声明（按 workbook 顺序）
  const wbFile = zip.file('xl/workbook.xml')
  if (!wbFile) throw new Error('不是 xlsx 容器（缺少 xl/workbook.xml）')
  const wbXml = await wbFile.async('string')

  // 2) workbook rels — 解析 id → target
  const relMap = new Map<string, string>()
  const relFile = zip.file('xl/_rels/workbook.xml.rels')
  if (relFile) {
    const relXml = await relFile.async('string')
    for (const m of relXml.matchAll(/<Relationship\b([^>]*?)\/?>/g)) {
      const id = /\bId="([^"]*)"/.exec(m[1])?.[1]
      const target = /\bTarget="([^"]*)"/.exec(m[1])?.[1]
      if (id && target) relMap.set(id, target)
    }
  }

  // 3) sharedStrings（可选）
  let shared: string[] | null = null
  const ssFile = zip.file('xl/sharedStrings.xml')
  if (ssFile) {
    const ssXml = await ssFile.async('string')
    shared = []
    for (const m of ssXml.matchAll(/<si\b[^>]*>([\s\S]*?)<\/si>/g)) {
      shared.push(extractTexts(m[1]))
    }
  }

  // 4) 按 workbook 顺序遍历 sheet
  const sheets: SheetGrid[] = []
  for (const m of wbXml.matchAll(/<sheet\b([^>]*?)\/?>/g)) {
    const attrs = m[1]
    const name = decodeXml(/\bname="([^"]*)"/.exec(attrs)?.[1] ?? '')
    const rid = /\br:id="([^"]*)"/.exec(attrs)?.[1] ?? ''
    const target = rid ? relMap.get(rid) : undefined
    // 只解析 worksheet（跳过图表工作表等）
    if (!target || !target.includes('worksheets/')) continue
    const path = resolveSheetPath(target)
    const f = zip.file(path)
    if (!f) continue
    const xml = await f.async('string')
    sheets.push({ name, cells: parseSheetCells(xml, shared) })
  }

  if (!sheets.length) throw new Error('未找到工作表')

  return { sheets }
}

/* ------------------------------------------------------------------ */
/*  CSV / TSV parser                                                   */
/* ------------------------------------------------------------------ */

/** 去掉 UTF-8 / UTF-16 BOM 并解码字节 */
function decodeDelimitedBytes(bytes: Uint8Array): string {
  if (bytes.length >= 2 && bytes[0] === 0xff && bytes[1] === 0xfe) {
    return new TextDecoder('utf-16le').decode(bytes.subarray(2))
  }
  if (bytes.length >= 2 && bytes[0] === 0xfe && bytes[1] === 0xff) {
    return new TextDecoder('utf-16be').decode(bytes.subarray(2))
  }
  const body = bytes.length >= 3 && bytes[0] === 0xef && bytes[1] === 0xbb && bytes[2] === 0xbf
    ? bytes.subarray(3)
    : bytes
  return new TextDecoder('utf-8').decode(body)
}

/** 嗅探分隔符：取首行（引号外）出现次数最多的候选 */
function sniffDelimiter(text: string): string {
  const candidates = [',', '\t', ';', '|']
  const counts = new Map<string, number>()
  let inQuotes = false
  for (let i = 0; i < text.length; i++) {
    const ch = text[i]
    if (ch === '"') {
      if (inQuotes && text[i + 1] === '"') { i++; continue }
      inQuotes = !inQuotes
      continue
    }
    if (!inQuotes && (ch === '\n' || ch === '\r')) break
    if (!inQuotes && candidates.includes(ch)) counts.set(ch, (counts.get(ch) ?? 0) + 1)
  }
  let best = ','
  let bestCount = 0
  for (const c of candidates) {
    const n = counts.get(c) ?? 0
    if (n > bestCount) { best = c; bestCount = n }
  }
  return best
}

/** 文本型数字 → number；保留前导零 / 千分位 / 空串为文本 */
function inferCellValue(raw: string): CellValue | undefined {
  const s = raw.trim()
  if (s === '') return undefined
  if (/^-?(?:0|[1-9]\d*)(?:\.\d+)?(?:[eE][+-]?\d+)?$/.test(s)) {
    const n = Number(s)
    if (Number.isFinite(n)) return n
  }
  return raw
}

/** 解析带引号的分隔文本 */
function parseDelimitedRows(text: string, delimiter: string): string[][] {
  const rows: string[][] = []
  let row: string[] = []
  let field = ''
  let inQuotes = false

  for (let i = 0; i < text.length; i++) {
    const ch = text[i]
    if (inQuotes) {
      if (ch === '"') {
        if (text[i + 1] === '"') { field += '"'; i++ }
        else inQuotes = false
      } else {
        field += ch
      }
      continue
    }
    if (ch === '"') {
      // 字段开头的引号进入引用模式；中途出现的引号按字面处理
      if (field === '') inQuotes = true
      else field += ch
      continue
    }
    if (ch === delimiter) { row.push(field); field = ''; continue }
    if (ch === '\r') {
      if (text[i + 1] === '\n') i++
      row.push(field); field = ''; rows.push(row); row = []
      continue
    }
    if (ch === '\n') {
      row.push(field); field = ''; rows.push(row); row = []
      continue
    }
    field += ch
  }
  if (field !== '' || row.length) { row.push(field); rows.push(row) }
  return rows
}

/** 解析 CSV / TSV 文本 */
export function parseDelimitedText(text: string, sheetName = 'Sheet1'): ParsedXlsx {
  const delimiter = sniffDelimiter(text)
  const rows = parseDelimitedRows(text, delimiter)
  const cells = new Map<string, CellValue>()
  rows.forEach((fields, r) => {
    fields.forEach((raw, c) => {
      const v = inferCellValue(raw)
      if (v !== undefined) cells.set(cellKey(r, c), v)
    })
  })
  return { sheets: [{ name: sheetName, cells }] }
}

/** 解析 CSV / TSV 字节（自动去 BOM、嗅探分隔符） */
export function parseDelimitedBytes(bytes: Uint8Array | ArrayBuffer, sheetName = 'Sheet1'): ParsedXlsx {
  const u8 = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes)
  return parseDelimitedText(decodeDelimitedBytes(u8), sheetName)
}

/* ------------------------------------------------------------------ */
/*  OpenDocument parser (.ods / .fods)                                 */
/* ------------------------------------------------------------------ */

/** 读取一个 ODS 单元格的值 */
function parseOdsCellValue(attrs: string, body: string): CellValue | undefined {
  const type = /\boffice:value-type="([^"]*)"/.exec(attrs)?.[1] ?? ''
  switch (type) {
    case 'float':
    case 'currency':
    case 'percentage': {
      const raw = /\boffice:value="([^"]*)"/.exec(attrs)?.[1]
      if (raw === undefined) return undefined
      const n = Number(raw)
      return Number.isFinite(n) ? n : undefined
    }
    case 'boolean': {
      const raw = /\boffice:boolean-value="([^"]*)"/.exec(attrs)?.[1]
      if (raw === undefined) return undefined
      return raw === 'true' || raw === '1'
    }
    case 'date':
    case 'time':
      // 日期 / 时间序列值不参与数值统计
      return undefined
    default: {
      const txt = extractOdsText(body)
      return txt === '' ? undefined : txt
    }
  }
}

/** 解析一个 <table:table> 的表格主体 */
function parseOdsTable(body: string): Map<string, CellValue> {
  const cells = new Map<string, CellValue>()
  let row = 0

  for (const rm of body.matchAll(/<table:table-row\b([^>]*?)(?:\/>|>([\s\S]*?)<\/table:table-row>)/g)) {
    const rowAttrs = rm[1] ?? ''
    const rowRepeat = Math.min(100000, Math.max(1, Number(/\bnumber-rows-repeated="(\d+)"/.exec(rowAttrs)?.[1] ?? 1)))
    const inner = rm[2] ?? ''
    let col = 0
    const values: Array<[number, CellValue]> = []

    for (const cm of inner.matchAll(/<table:table-cell\b([^>]*?)(?:\/>|>([\s\S]*?)<\/table:table-cell>)/g)) {
      const attrs = cm[1] ?? ''
      const cellBody = cm[2] ?? ''
      const colRepeat = Math.min(10000, Math.max(1, Number(/\bnumber-columns-repeated="(\d+)"/.exec(attrs)?.[1] ?? 1)))
      const value = parseOdsCellValue(attrs, cellBody)
      if (value !== undefined) {
        for (let k = 0; k < colRepeat; k++) values.push([col + k, value])
      }
      col += colRepeat
    }

    for (let rr = 0; rr < rowRepeat; rr++) {
      for (const [c, v] of values) cells.set(cellKey(row + rr, c), v)
    }
    row += rowRepeat
  }

  return cells
}

/** 解析 ODS 的 content.xml（供 .ods 与 .fods 共用） */
function parseOdsContent(xml: string): ParsedXlsx {
  const sheets: SheetGrid[] = []
  for (const m of xml.matchAll(/<table:table\b([^>]*?)(?:\/>|>([\s\S]*?)<\/table:table>)/g)) {
    const attrs = m[1] ?? ''
    const body = m[2] ?? ''
    const name = decodeXml(/\btable:name="([^"]*)"/.exec(attrs)?.[1] ?? `Sheet${sheets.length + 1}`)
    sheets.push({ name, cells: parseOdsTable(body) })
  }
  if (!sheets.length) throw new Error('未找到工作表')
  return { sheets }
}

/** 解析扁平 ODS XML（.fods 单文件） */
export function parseFodsWorkbook(xml: string): ParsedXlsx {
  return parseOdsContent(xml)
}

/** 从 ODS 压缩包（.ods）解析工作簿 */
export async function parseOdsWorkbook(bytes: ArrayBuffer): Promise<ParsedXlsx> {
  const mod = await import('jszip')
  const JSZip = mod.default as unknown as typeof import('jszip')
  const zip = await JSZip.loadAsync(bytes)
  const content = zip.file('content.xml')
  if (!content) throw new Error('不是 ODS 容器（缺少 content.xml）')
  return parseOdsContent(await content.async('string'))
}

/* ------------------------------------------------------------------ */
/*  Calculations                                                       */
/* ------------------------------------------------------------------ */

/**
 * 计算选区统计。
 *
 * <p>数值统计（sum/avg/median/stdev/min/max）只统计数值单元格，
 * 与 Excel 状态栏一致（日期序列号也会被计入）。
 * 另给出非空单元格数、去重取值数、选区总单元格数。</p>
 *
 * @returns 选区完全空白时返回 null；纯文本选区返回 count=0 的对象
 */
export function computeRangeStats(sheet: SheetGrid, range: RangeSelection): RangeStats | null {
  const r1 = Math.min(range.sri, range.eri)
  const r2 = Math.max(range.sri, range.eri)
  const c1 = Math.min(range.sci, range.eci)
  const c2 = Math.max(range.sci, range.eci)

  const nums: number[] = []
  const distinct = new Set<string>()
  let nonEmpty = 0

  for (const [key, v] of sheet.cells) {
    const parts = key.split(':')
    const r = parseInt(parts[0], 10)
    const c = parseInt(parts[1], 10)
    if (r < r1 || r > r2 || c < c1 || c > c2) continue
    if (v === undefined || v === null || v === '') continue
    nonEmpty++
    distinct.add(distinctKey(v))
    if (typeof v === 'number' && Number.isFinite(v)) nums.push(v)
  }

  if (nonEmpty === 0) return null

  const total = (r2 - r1 + 1) * (c2 - c1 + 1)
  let sum = 0
  let min = 0
  let max = 0
  if (nums.length) {
    min = Infinity
    max = -Infinity
    for (const n of nums) {
      sum += n
      if (n < min) min = n
      if (n > max) max = n
    }
  }

  let median = 0
  let stdev = 0
  if (nums.length) {
    const sorted = [...nums].sort((a, b) => a - b)
    const mid = sorted.length >> 1
    median = sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2
    if (nums.length > 1) {
      const mean = sum / nums.length
      let acc = 0
      for (const n of nums) acc += (n - mean) ** 2
      stdev = Math.sqrt(acc / (nums.length - 1))
    }
  }

  return {
    sum,
    avg: nums.length ? sum / nums.length : 0,
    count: nums.length,
    min,
    max,
    median,
    stdev,
    nonEmpty,
    distinct: distinct.size,
    total,
  }
}

/**
 * 将选区以制表符分隔文本输出（可按列对齐粘贴）。
 * 以矩形矩阵形式包含所有单元格，空单元格为空串。
 * 首尾全空行自动修剪。
 */
export function rangeToTsv(sheet: SheetGrid, range: RangeSelection): string {
  const r1 = Math.min(range.sri, range.eri)
  const r2 = Math.max(range.sri, range.eri)
  const c1 = Math.min(range.sci, range.eci)
  const c2 = Math.max(range.sci, range.eci)

  const rows: string[][] = []
  for (let r = r1; r <= r2; r++) {
    const row: string[] = []
    for (let c = c1; c <= c2; c++) {
      const v = sheet.cells.get(cellKey(r, c))
      if (v === undefined || v === null) {
        row.push('')
      } else if (typeof v === 'boolean') {
        row.push(v ? 'TRUE' : 'FALSE')
      } else if (typeof v === 'number') {
        // 全数字无前导零；大数不转科学计数
        row.push(Number.isInteger(v) ? String(v) : String(v))
      } else {
        row.push(v)
      }
    }
    rows.push(row)
  }

  // 修剪末尾全空行
  while (rows.length > 0 && rows[rows.length - 1].every(x => x === '')) rows.pop()

  return rows.map(row => row.join('\t')).join('\n')
}
