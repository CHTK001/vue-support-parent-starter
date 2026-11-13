<!--
  工具行的内联 diff（用户口径 2026-11-12）。

  <p>参考版式：文件头（路径）+ 行号双栏 + 增删底色 + 大段未改动行折成
  「N unmodified lines」一行，点一下展开。数据来自工具参数本身
  （edit: old_text/new_text；write: content），不需要后端再提供 diff。</p>
-->
<template>
  <div class="tcd">
    <div class="tcd__head">
      <span class="tcd__path" :title="filePath">{{ filePath }}</span>
      <span class="tcd__stat">
        <span v-if="added" class="tcd__added">+{{ added }}</span>
        <span v-if="removed" class="tcd__removed">-{{ removed }}</span>
      </span>
    </div>

    <div class="tcd__body">
      <template v-for="(row, i) in visibleRows" :key="i">
        <button v-if="row.kind === 'fold'" type="button" class="tcd__fold" @click="toggleFold(row.key)">
          <span class="tcd__fold-chev" :class="{ 'is-open': isFoldOpen(row.key) }">›</span>
          {{ row.count }} {{ t('chat.toolCalls.unmodifiedLines') }}
        </button>
        <div v-else class="tcd__row" :class="`is-${row.kind}`">
          <span class="tcd__ln">{{ row.oldNo ?? '' }}</span>
          <span class="tcd__ln">{{ row.newNo ?? '' }}</span>
          <span class="tcd__sign">{{ row.kind === 'add' ? '+' : row.kind === 'del' ? '-' : ' ' }}</span>
          <code class="tcd__code">{{ row.text }}</code>
        </div>
      </template>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { diffLines } from 'diff'

const { t } = useI18n()

const props = defineProps<{
  filePath: string
  diffText: { oldText: string; newText: string } | null
}>()

type Row =
  | { kind: 'ctx' | 'add' | 'del'; oldNo: number | null; newNo: number | null; text: string }
  | { kind: 'fold'; key: string; count: number; lines: Array<{ kind: 'ctx'; oldNo: number; newNo: number; text: string }> }

const openFolds = ref<Set<string>>(new Set())

function toggleFold(key: string): void {
  const next = new Set(openFolds.value)
  if (next.has(key)) next.delete(key)
  else next.add(key)
  openFolds.value = next
}
function isFoldOpen(key: string): boolean {
  return openFolds.value.has(key)
}

/** diffLines → 带行号的行；连续未改动超过 10 行时折叠中间部分 */
const rows = computed<Row[]>(() => {
  let oldNo = 0
  let newNo = 0
  const flat: Extract<Row, { kind: 'ctx' | 'add' | 'del' }>[] = []
  const parts = diffLines(props.diffText?.oldText || '', props.diffText?.newText || '')
  for (const part of parts) {
    const lines = part.value.split('\n')
    if (lines.length && lines[lines.length - 1] === '') lines.pop()
    for (const line of lines) {
      flat.push({
        kind: part.added ? 'add' : part.removed ? 'del' : 'ctx',
        oldNo: part.added ? null : ++oldNo,
        newNo: part.removed ? null : ++newNo,
        text: line,
      })
    }
  }

  // 折叠：连续 ctx ≥ 10 行时保留前后各 2 行，中间折成一行（展开用 fold.lines 原样还原）
  const out: Row[] = []
  let i = 0
  while (i < flat.length) {
    const row = flat[i]
    if (row.kind !== 'ctx') { out.push(row); i += 1; continue }
    let j = i
    while (j < flat.length && flat[j].kind === 'ctx') j += 1
    const run = j - i
    if (run >= 10) {
      out.push(...flat.slice(i, i + 2))
      out.push({
        kind: 'fold',
        key: `f${i}`,
        count: run - 4,
        lines: flat.slice(i + 2, j - 2) as Array<{ kind: 'ctx'; oldNo: number; newNo: number; text: string }>,
      })
      out.push(...flat.slice(j - 2, j))
    } else {
      out.push(...flat.slice(i, j))
    }
    i = j
  }
  return out
})

/** 折叠行展开后把真实行插回去（行号与内容都保留） */
const visibleRows = computed<Row[]>(() => {
  const out: Row[] = []
  for (const row of rows.value) {
    if (row.kind === 'fold' && isFoldOpen(row.key)) out.push(...row.lines)
    else out.push(row)
  }
  return out
})

const added = computed(() => rows.value.filter((r) => r.kind === 'add').length)
const removed = computed(() => rows.value.filter((r) => r.kind === 'del').length)
</script>

<style scoped>
.tcd {
  border: 1px solid var(--el-border-color-lighter);
  border-radius: var(--el-radius-md, 8px);
  overflow: hidden;
  background: var(--el-bg-color);
}

.tcd__head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 5px 10px;
  border-bottom: 1px solid var(--el-border-color-lighter);
  background: var(--el-fill-color-lighter, var(--el-fill-color-light));
}

.tcd__path {
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-family: var(--font-mono, Consolas, monospace);
  font-size: 11.5px;
  color: var(--el-text-color-regular);
}

.tcd__stat {
  display: inline-flex;
  gap: 6px;
  flex: none;
  font-family: var(--font-mono, Consolas, monospace);
  font-size: 11.5px;
}

.tcd__added { color: var(--el-color-success); }
.tcd__removed { color: var(--el-color-danger); }

.tcd__body {
  max-height: 320px;
  overflow: auto;
  font-family: var(--font-mono, Consolas, monospace);
  font-size: 12px;
  line-height: 18px;
}

.tcd__row {
  display: flex;
  align-items: flex-start;
  white-space: pre;
}

.tcd__row.is-add { background: color-mix(in srgb, var(--el-color-success) 10%, transparent); }
.tcd__row.is-del { background: color-mix(in srgb, var(--el-color-danger) 10%, transparent); }

.tcd__ln {
  flex: none;
  width: 38px;
  padding-right: 6px;
  text-align: right;
  color: var(--el-text-color-placeholder);
  user-select: none;
}

.tcd__sign {
  flex: none;
  width: 14px;
  text-align: center;
  color: var(--el-text-color-secondary);
  user-select: none;
}

.tcd__code {
  flex: 1;
  min-width: 0;
  padding-right: 10px;
  color: var(--el-text-color-regular);
  font: inherit;
}

.tcd__fold {
  display: flex;
  align-items: center;
  gap: 6px;
  width: 100%;
  padding: 2px 10px;
  border: none;
  background: var(--el-fill-color-lighter, var(--el-fill-color-light));
  color: var(--el-text-color-secondary);
  font-size: 11.5px;
  text-align: left;
  cursor: pointer;
}

.tcd__fold:hover { color: var(--el-color-primary); }

.tcd__fold-chev {
  display: inline-block;
  transition: transform 0.12s ease;
}

.tcd__fold-chev.is-open { transform: rotate(90deg); }
</style>
