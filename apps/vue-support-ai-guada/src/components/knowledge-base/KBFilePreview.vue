<script setup lang="ts">
/**
 * 知识点原文预览。
 *
 * <p>按扩展名分派渲染策略：Markdown 走 marked 渲染，JSON 做格式化，其余按纯文本。
 * 走预览而不是直接下载，是因为知识点是入库文本，用户要确认「到底喂给 AI 了什么」；
 * 后端只允许读文本类文件（{@code readFile} 对非文本抛 INVALID_PARAM），
 * 所以这里不需要处理 PDF/DOCX 的二进制渲染。</p>
 *
 * <p><b>风格</b>：弹框外壳用仓库标准 {@code ReDialog}（koi 变体自带标题栏拖拽、全屏/最小化）；
 * 标题行 / 路径 / 字数等「外壳」全部走 Tailwind 工具类；颜色走 koi 令牌 {@code --rm-*}。</p>
 *
 * <p><b>为什么仍保留一段 :deep() 样式</b>：markdown 正文的排版（h1-p-ul-code-blockquote-table）
 * 是<b>内容渲染</b>而非 UI 外壳，且全仓没有可复用的全局 markdown 样式类
 * （模板里那个 {@code re-md} 类实际未定义，是历史残留）。因此这里保留并只把变量换成 koi。</p>
 */
import { computed, ref, watch } from 'vue'
import { marked } from 'marked'
import type { KBFile } from '@/stores/knowledgeBase'
import { apiService } from '@/services/ApiService'
import ReDialog from '@repo/ui/re-dialog'
import ReTag from '@/components/re/ReTag.vue'
import ReButton from '@/components/re/ReButton.vue'

/**
 * 原文预览的定位方式有两种，二选一即可：
 *   1. 传 `file`：从文件节点进入，用它的 relativePath；
 *   2. 传 `path`：从引用跳转进入，只有相对路径没有文件节点。
 * 所以 file 必须是可选的，否则只用 path 的调用方（KBAskPanel / KnowledgeBasePage）过不了类型检查。
 */
const props = defineProps<{ file?: KBFile | null; kbId: string; path?: string }>()
const emit = defineEmits<{ (e: 'close'): void }>()

/** 是否打开 */
const visible = defineModel<boolean>({ default: false })
/** 原文内容 */
const content = ref('')
/** 相对路径（引用跳转时后端返回的是它，与 file.relativePath 可能不同） */
const relPath = ref('')
/** 是否加载中 */
const loading = ref(false)
/** 读取失败的提示 */
const errorText = ref('')

/** 扩展名（小写，不含点） */
const ext = computed(() => {
  const p = relPath.value || props.path || props.file?.relativePath || ''
  const i = p.lastIndexOf('.')
  return i >= 0 ? p.slice(i + 1).toLowerCase() : ''
})

/** 是否 Markdown */
const isMarkdown = computed(() => ['md', 'markdown', 'mdx'].includes(ext.value))
/** 是否 JSON */
const isJson = computed(() => ['json', 'jsonl'].includes(ext.value))

/** 渲染后的 HTML：Markdown 交给 marked，JSON 做缩进，其余直接转义 */
const renderedHtml = computed(() => {
  const raw = content.value
  if (isMarkdown.value) {
    // marked 默认不转义原始 HTML，这里统一关掉，避免知识点内容注入脚本
    return marked.parse(raw, { async: false, gfm: true, breaks: true }) as string
  }
  if (isJson.value) {
    let text = raw
    try {
      text = JSON.stringify(JSON.parse(raw), null, 2)
    } catch {
      /* 不是合法 JSON 就按原文显示，不报错 */
    }
    return `<pre>${escapeHtml(text)}</pre>`
  }
  return `<pre>${escapeHtml(raw)}</pre>`
})

/** 展示用的文件名 */
const fileName = computed(() => {
  const p = relPath.value || props.path || props.file?.relativePath || ''
  return p.split('/').pop() || p
})

/**
 * 转义 HTML 特殊字符。
 *
 * @param s 原始文本
 * @returns 转义后的文本
 */
function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

/** 拉取原文 */
async function load() {
  const p = props.path || props.file?.relativePath || ''
  if (!props.kbId || !p) {
    errorText.value = '缺少文件路径'
    return
  }
  loading.value = true
  errorText.value = ''
  relPath.value = p
  try {
    const data = await apiService.readKBFileContent(props.kbId, p)
    content.value = data?.content ?? ''
  } catch (e: any) {
    content.value = ''
    errorText.value = e?.response?.data?.message || e?.message || '读取失败'
  } finally {
    loading.value = false
  }
}

/**
 * 关闭弹框。ReDialog（koi）关闭时只更新 v-model、不发 close 事件，
 * 这里统一由 visible 的 watcher 通知父组件，避免「点关闭按钮」与「点 X」两条路发两次。
 */
function onClose() {
  visible.value = false
}

// 打开时拉取原文；关闭时通知父组件
watch(visible, (v) => { if (v) { load() } else { emit('close') } })
watch(() => [props.path, props.file?.relativePath], () => { if (visible.value) load() })
</script>

<template>
  <ReDialog v-model="visible" :title="fileName" :width="820" :close-on-click-modal="false">
    <div v-loading="loading" class="max-h-[68vh] overflow-auto">
      <el-alert v-if="errorText" type="error" :closable="false" :title="errorText" class="mb-3" />
      <template v-else>
        <div class="flex items-center gap-2 pb-2.5 mb-2.5 border-b border-[var(--rm-border-light)] text-xs text-[var(--rm-text-secondary)]">
          <ReTag size="small" effect="plain">{{ ext.toUpperCase() || 'TEXT' }}</ReTag>
          <span class="flex-1 min-w-0 truncate">{{ relPath }}</span>
          <span class="shrink-0">{{ content.length }} 字符</span>
        </div>
        <!-- eslint-disable-next-line vue/no-v-html —— Markdown 由 marked 渲染，原文 HTML 已关闭 -->
        <div class="kb-md text-sm leading-relaxed text-[var(--rm-text)]" v-html="renderedHtml" />
      </template>
    </div>
    <template #footer>
      <ReButton @click="onClose">关闭</ReButton>
      <ReButton type="primary" @click="load">刷新</ReButton>
    </template>
  </ReDialog>
</template>

<style scoped>
/* markdown 正文排版（内容渲染，非 UI 外壳）。变量统一走 koi --rm-*。 */
.kb-md :deep(pre) {
  margin: 0;
  padding: 12px;
  border-radius: var(--rm-radius, 8px);
  background: var(--rm-bg-subtle);
  color: var(--rm-text);
  font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
  font-size: 12.5px;
  line-height: 1.65;
  white-space: pre-wrap;
  word-break: break-word;
}

.kb-md :deep(h1),
.kb-md :deep(h2),
.kb-md :deep(h3) {
  margin: 18px 0 8px;
  font-weight: 600;
  line-height: 1.4;
}

.kb-md :deep(h1) { font-size: 20px; }
.kb-md :deep(h2) { font-size: 17px; }
.kb-md :deep(h3) { font-size: 15px; }

.kb-md :deep(p) { margin: 8px 0; }

.kb-md :deep(ul),
.kb-md :deep(ol) {
  margin: 8px 0;
  padding-left: 22px;
}

.kb-md :deep(li) { margin: 3px 0; }

.kb-md :deep(code) {
  padding: 1px 5px;
  border-radius: var(--rm-radius-sm, 4px);
  background: var(--rm-bg-subtle);
  font-size: 0.92em;
  font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
}

.kb-md :deep(blockquote) {
  margin: 10px 0;
  padding: 4px 14px;
  border-left: 3px solid var(--rm-primary);
  color: var(--rm-text-secondary);
  background: var(--rm-primary-light-9);
  border-radius: 0 var(--rm-radius-sm, 4px) var(--rm-radius-sm, 4px) 0;
}

.kb-md :deep(a) {
  color: var(--rm-primary);
  text-decoration: none;
}

.kb-md :deep(a:hover) { text-decoration: underline; }

.kb-md :deep(table) {
  width: 100%;
  margin: 10px 0;
  border-collapse: collapse;
  font-size: 13px;
}

.kb-md :deep(th),
.kb-md :deep(td) {
  padding: 7px 10px;
  border: 1px solid var(--rm-border-light);
  text-align: left;
}

.kb-md :deep(th) {
  background: var(--rm-bg-subtle);
  font-weight: 600;
}

.kb-md :deep(hr) {
  margin: 16px 0;
  border: 0;
  border-top: 1px solid var(--rm-border-light);
}

.kb-md :deep(img) { max-width: 100%; }
</style>