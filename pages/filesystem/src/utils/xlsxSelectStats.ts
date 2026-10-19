/**
 * 基于 JSZip 的极简 xlsx 稀疏单元格索引，供:
 *   - 选区统计（求和 / 平均值 / 计数 / 最小值 / 最大值）
 *   - 选区复制（制表符分隔文本写入系统剪贴板）
 *
 * 纯前端；只在初次触发选区事件时懒加载。
 * 只处理 OOXML 容器（.xlsx/.xlsm，以及 .xls/.csv 经转换后的 xlsx 字节）。
 * 不处理格式、合并单元格、图表的单元格值统计不受影响。
 */

export type CellValue = number | string | boolean;

export interface SheetGrid {
  /** 工作表名（workbook.xml 中声明的名称） */
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
  sum: number
  avg: number
  count: number
  min: number
  max: number
}

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

const cellKey = (r: number, c: number): string => `${r}:${c}`

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

/** 最简 XML 解码（仅处理 xlsx 中用到的实体） */
function decodeXml(s: string): string {
  return s
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&#(\d+);/g, (_, d) => String.fromCharCode(Number(d)))
    .replace(/&amp;/g, '&')
}

/** 提取 <t> 标签中的文本（含 <si>/<is> 下的多段 <t>） */
function extractTexts(xml: string): string {
  let out = ''
  for (const m of xml.matchAll(/<t\b[^>]*>([\s\S]*?)<\/t>/g)) out += decodeXml(m[1])
  return out
}

/* ------------------------------------------------------------------ */
/*  Parser                                                             */
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
/*  Delimited text (csv / tsv)                                         */
/* ------------------------------------------------------------------ */

/**
 * 分隔文本单元格 → 统计值。
 *
 * <p>只把「纯数字」与 true/false 归一为原生类型；`001`、`1-2`、日期串等
 * 会被 {@code Number()} 误判的值保持字符串，避免选区统计把编号当数值求和。</p>
 */
function coerceDelimitedValue(raw: string): CellValue {
  const s = raw.trim()
  if (s === '') return ''
  if (/^(true|false)$/i.test(s)) return s.toLowerCase() === 'true'
  if (/^-?(?:0|[1-9]\d*)(?:\.\d+)?(?:[eE][+-]?\d+)?$/.test(s)) {
    const n = Number(s)
    return Number.isFinite(n) ? n : raw
  }
  return raw
}

/** 按 RFC 4180 口径切分（支持引号包裹、双引号转义、字段内换行） */
function splitDelimitedText(text: string, delimiter: string): string[][] {
  const rows: string[][] = []
  let row: string[] = []
  let field = ''
  let quoted = false
  for (let i = 0; i < text.length; i++) {
    const ch = text[i]
    if (quoted) {
      if (ch === '"') {
        if (text[i + 1] === '"') { field += '"'; i++ } else { quoted = false }
      } else {
        field += ch
      }
      continue
    }
    if (ch === '"') { quoted = true; continue }
    if (ch === delimiter) { row.push(field); field = ''; continue }
    if (ch === '\r') continue
    if (ch === '\n') { row.push(field); rows.push(row); row = []; field = ''; continue }
    field += ch
  }
  if (field !== '' || row.length) { row.push(field); rows.push(row) }
  return rows
}

/**
 * 解析 csv / tsv 字节为稀疏单元格索引。
 *
 * <p>分隔符按首个非空行自动嗅探（制表符优先，其次逗号、分号），
 * 与 {@link parseXlsxWorkbook} 共用 {@link SheetGrid} 稀疏模型。</p>
 */
export function parseDelimitedBytes(bytes: Uint8Array, sheetName = 'Sheet1'): ParsedXlsx {
  let text = new TextDecoder('utf-8').decode(bytes)
  if (text.charCodeAt(0) === 0xfeff) text = text.slice(1)
  if (!text.trim()) throw new Error('空的分隔文本')
  const nl = text.search(/\r?\n/)
  const firstLine = nl >= 0 ? text.slice(0, nl) : text
  const count = (ch: string) => firstLine.split(ch).length - 1
  const tabs = count('\t')
  const commas = count(',')
  const semis = count(';')
  const delimiter = tabs >= commas && tabs >= semis ? '\t' : commas >= semis ? ',' : ';'
  const rows = splitDelimitedText(text, delimiter)
  const cells = new Map<string, CellValue>()
  rows.forEach((cols, r) => {
    cols.forEach((raw, c) => {
      if (raw === '') return
      cells.set(cellKey(r, c), coerceDelimitedValue(raw))
    })
  })
  return { sheets: [{ name: sheetName, cells }] }
}

/* ------------------------------------------------------------------ */
/*  OpenDocument (fods / ods)                                          */
/* ------------------------------------------------------------------ */

/** 单个 table:table-cell 的值：office:value-type 优先，其次 text:p 文本 */
function odsCellValueFromXml(attrs: string, inner: string): CellValue | null {
  const valueType = /\boffice:value-type="([^"]*)"/.exec(attrs)?.[1] ?? ''
  if (valueType === 'float' || valueType === 'percentage' || valueType === 'currency') {
    const v = /\boffice:value="([^"]*)"/.exec(attrs)?.[1]
    if (v != null && v !== '') {
      const n = Number(v)
      if (Number.isFinite(n)) return n
    }
  }
  if (valueType === 'boolean') {
    const v = /\boffice:boolean-value="([^"]*)"/.exec(attrs)?.[1]
    if (v != null) return v === 'true'
  }
  const paragraphs = [...inner.matchAll(/<text:p\b[^>]*>([\s\S]*?)<\/text:p>/g)].map((m) => extractTexts(m[1]))
  const text = paragraphs.length ? paragraphs.join('\n') : extractTexts(inner)
  return text.trim() === '' ? null : text
}

/**
 * 解析扁平 OpenDocument 表格（.fods）文本。
 *
 * <p>按 `table:table` → `table:table-row` → `table:table-cell` 逐层展开；
 * `number-rows-repeated` / `number-columns-repeated` 会按声明复制（上限 1000，
 * 防止畸形文件里的极大重复值把内存打爆）。</p>
 */
export function parseFodsWorkbook(xml: string): ParsedXlsx {
  const sheets: SheetGrid[] = []
  const tableRe = /<table:table\b([^>]*)>([\s\S]*?)<\/table:table>/g
  let tm: RegExpExecArray | null
  while ((tm = tableRe.exec(xml))) {
    const name = decodeXml(/\btable:name="([^"]*)"/.exec(tm[1])?.[1] ?? '') || `Sheet${sheets.length + 1}`
    const cells = new Map<string, CellValue>()
    let r = 0
    const rowRe = /<table:table-row\b([^>]*)>([\s\S]*?)<\/table:table-row>/g
    let rm: RegExpExecArray | null
    while ((rm = rowRe.exec(tm[2]))) {
      const rowRepeat = Math.min(1000, Math.max(1, Number(/\btable:number-rows-repeated="(\d+)"/.exec(rm[1])?.[1] ?? 1)))
      const cellRe = /<table:table-cell\b([^>]*?)(?:\/>|>([\s\S]*?)<\/table:table-cell>)/g
      let cm: RegExpExecArray | null
      let c = 0
      const rowCells: { col: number; value: CellValue | null; repeat: number }[] = []
      while ((cm = cellRe.exec(rm[2]))) {
        const attrs = cm[1]
        const inner = cm[2] ?? ''
        const repeat = Math.min(1000, Math.max(1, Number(/\btable:number-columns-repeated="(\d+)"/.exec(attrs)?.[1] ?? 1)))
        rowCells.push({ col: c, value: odsCellValueFromXml(attrs, inner), repeat })
        c += repeat
      }
      for (let k = 0; k < rowRepeat; k++) {
        for (const rc of rowCells) {
          if (rc.value === null) continue
          for (let q = 0; q < rc.repeat; q++) cells.set(cellKey(r + k, rc.col + q), rc.value)
        }
      }
      r += rowRepeat
    }
    sheets.push({ name, cells })
  }
  if (!sheets.length) throw new Error('未找到工作表')
  return { sheets }
}

/** 解析 ODS（ZIP 容器）：取 content.xml 后复用 {@link parseFodsWorkbook} */
export async function parseOdsWorkbook(bytes: ArrayBuffer | Uint8Array): Promise<ParsedXlsx> {
  const mod = await import('jszip')
  const JSZip = mod.default as unknown as typeof import('jszip')
  const zip = await JSZip.loadAsync(bytes as ArrayBuffer)
  const content = zip.file('content.xml')
  if (!content) throw new Error('不是 ODS 容器（缺少 content.xml）')
  return parseFodsWorkbook(await content.async('string'))
}

/* ------------------------------------------------------------------ */
/*  Calculations                                                       */
/* ------------------------------------------------------------------ */

/**
 * 计算选区数值统计。
 * 只包含 Number 类型的单元格值（日期序列号也会被计入，同 Excel 默认行为）。
 * 若选区没有数字返回 null。
 */
export function computeRangeStats(sheet: SheetGrid, range: RangeSelection): RangeStats | null {
  const r1 = Math.min(range.sri, range.eri)
  const r2 = Math.max(range.sri, range.eri)
  const c1 = Math.min(range.sci, range.eci)
  const c2 = Math.max(range.sci, range.eci)

  let sum = 0
  let count = 0
  let min = Infinity
  let max = -Infinity

  for (const [key, v] of sheet.cells) {
    const parts = key.split(':')
    const r = parseInt(parts[0], 10)
    const c = parseInt(parts[1], 10)
    if (r < r1 || r > r2 || c < c1 || c > c2) continue
    if (typeof v === 'number' && Number.isFinite(v)) {
      sum += v
      count++
      if (v < min) min = v
      if (v > max) max = v
    }
  }

  if (count === 0) return null
  return { sum, avg: sum / count, count, min, max }
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