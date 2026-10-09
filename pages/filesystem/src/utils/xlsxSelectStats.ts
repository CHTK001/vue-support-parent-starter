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