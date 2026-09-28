<script setup lang="ts">
/**
 * 知识点原文预览。
 *
 * <p>按扩展名分派渲染策略：Markdown 走 marked 渲染，JSON 做格式化，其余按纯文本。
 * 走预览而不是直接下载，是因为知识点是入库文本，用户要确认「到底喂给 AI 了什么」；
 * 后端只允许读文本类文件（{@code readFile} 对非文本抛 INVALID_PARAM），
 * 所以这里不需要处理 PDF/DOCX 的二进制渲染。</p>
 *
 * <p>所有颜色走 Element Plus / koi 变量，暗色模式自动跟随，不写死浅色底。</p>
 */
import { computed, ref, watch } from 'vue'
import { marked } from 'marked'
import type { KBFile } from '@/stores/knowledgeBase'
import { apiService } from '@/services/ApiService'
import LDialog from '@/components/ui/LDialog.vue'

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

// 打开且目标文件变化时重新拉取
watch(visible, (v) => { if (v) load() })
watch(() => [props.path, props.file?.relativePath], () => { if (visible.value) load() })
</script>

<template>
  <LDialog v-model="visible" :title="fileName" width="820px" append-to-body class="kb-preview-dialog">
    <div v-loading="loading" class="kb-preview">
      <el-alert v-if="errorText" type="error" :closable="false" :title="errorText" class="mb-3" />
      <div v-else class="kb-preview__head">
        <el-tag effect="plain">{{ ext.toUpperCase() || 'TEXT' }}</el-tag>
        <span class="kb-preview__path">{{ relPath }}</span>
        <span class="kb-preview__size">{{ content.length }} 字符</span>
      </div>
      <!-- eslint-disable-next-line vue/no-v-html —— Markdown 由 marked 渲染，原文 HTML 已关闭 -->
      <div class="kb-preview__body re-md" v-html="renderedHtml" />
    </div>
    <template #footer>
      <el-button @click="visible = false">关闭</el-button>
      <el-button type="primary" @click="load">刷新</el-button>
    </template>
  </LDialog>
</template>

<style scoped>
.kb-preview {
  max-height: 68vh;
  overflow: auto;
}

.kb-preview__head {
  display: flex;
  align-items: center;
  gap: 8px;
  padding-bottom: 10px;
  margin-bottom: 10px;
  border-bottom: 1px solid var(--el-border-color-lighter);
  font-size: 12px;
  color: var(--el-text-color-secondary);
}

.kb-preview__path {
  flex: 1;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.kb-preview__body {
  font-size: 14px;
  line-height: 1.7;
  color: var(--el-text-color-primary);
}

.kb-preview__body :deep(pre) {
  margin: 0;
  padding: 12px;
  border-radius: var(--el-radius-md, 8px);
  background: var(--el-fill-color-light);
  color: var(--el-text-color-primary);
  font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
  font-size: 12.5px;
  line-height: 1.65;
  white-space: pre-wrap;
  word-break: break-word;
}

.kb-preview__body :deep(h1),
.kb-preview__body :deep(h2),
.kb-preview__body :deep(h3) {
  margin: 18px 0 8px;
  font-weight: 600;
  line-height: 1.4;
}

.kb-preview__body :deep(h1) { font-size: 20px; }
.kb-preview__body :deep(h2) { font-size: 17px; }
.kb-preview__body :deep(h3) { font-size: 15px; }

.kb-preview__body :deep(p) { margin: 8px 0; }

.kb-preview__body :deep(ul),
.kb-preview__body :deep(ol) {
  margin: 8px 0;
  padding-left: 22px;
}

.kb-preview__body :deep(li) { margin: 3px 0; }

.kb-preview__body :deep(code) {
  padding: 1px 5px;
  border-radius: var(--el-radius-sm, 4px);
  background: var(--el-fill-color);
  font-size: 0.92em;
  font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
}

.kb-preview__body :deep(blockquote) {
  margin: 10px 0;
  padding: 4px 14px;
  border-left: 3px solid var(--el-color-primary-light-5);
  color: var(--el-text-color-secondary);
  background: var(--el-color-primary-light-9);
  border-radius: 0 var(--el-radius-sm, 4px) var(--el-radius-sm, 4px) 0;
}

.kb-preview__body :deep(a) {
  color: var(--el-color-primary);
  text-decoration: none;
}

.kb-preview__body :deep(a:hover) { text-decoration: underline; }

.kb-preview__body :deep(table) {
  width: 100%;
  margin: 10px 0;
  border-collapse: collapse;
  font-size: 13px;
}

.kb-preview__body :deep(th),
.kb-preview__body :deep(td) {
  padding: 7px 10px;
  border: 1px solid var(--el-border-color-lighter);
  text-align: left;
}

.kb-preview__body :deep(th) {
  background: var(--el-fill-color-light);
  font-weight: 600;
}

.kb-preview__body :deep(hr) {
  margin: 16px 0;
  border: 0;
  border-top: 1px solid var(--el-border-color-lighter);
}

.kb-preview__body :deep(img) { max-width: 100%; }
</style>
