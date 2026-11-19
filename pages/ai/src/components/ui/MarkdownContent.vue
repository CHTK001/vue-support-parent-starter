<template>
    <!-- 流式 Markdown：按帧合并后直接渲染，可靠支持同屏多个流式气泡 -->
    <div class="markdown-content">
        <div ref="markdownContainerRef"></div>
    </div>
</template>
<script setup lang="ts">
import { watch, ref, onMounted, onBeforeUnmount } from 'vue';
import { useI18n } from 'vue-i18n';
import { useMarkdown } from "../../composables/useMarkdown";
import { previewUrl } from "../../utils/workspacePreview";

const { marked } = useMarkdown()
const { t } = useI18n();

// 定义 Props - 类型化
const props = defineProps<{
    content: string;
}>();

const markdownContainerRef = ref<HTMLElement | null>(null);
let rafId = 0;

/**
 * 直接解析并渲染最新 Markdown。
 * 流式增量场景下每帧只渲染一次，内容仅追加，不会产生可见闪烁。
 */
const render = () => {
    const el = markdownContainerRef.value;
    if (!el) return;
    const raw = props.content ?? '';
    if (!raw.trim()) {
        if (el.innerHTML) el.innerHTML = '';
        return;
    }
    try {
        const parsed = marked.parse(raw);
        if (typeof parsed === 'string') {
            if (parsed !== el.innerHTML) el.innerHTML = parsed;
            ensurePreviewButtons(el);
        } else if (parsed instanceof Promise) {
            parsed.then((h) => {
                if (typeof h === 'string' && h !== el.innerHTML) el.innerHTML = h;
                ensurePreviewButtons(el);
            }).catch(() => { el.innerText = raw; });
        }
    } catch (error) {
        console.error('[Markdown] 解析错误:', error);
        el.innerText = raw;
    }
};

/** 合并同一帧内的多次内容更新，避免过度解析 */
const scheduleRender = () => {
    if (rafId) cancelAnimationFrame(rafId);
    rafId = requestAnimationFrame(() => { rafId = 0; render(); });
};

// ── HTML / SVG 代码块内建预览 ──

/** 可直接预览的代码语言 */
const PREVIEWABLE_LANGS = new Set(['html', 'svg']);
/** 超过该字符数的代码块不生成预览（data URL 过大没有意义） */
const MAX_PREVIEW_CHARS = 200 * 1024;

/** 读取代码块语言；xml 内联 svg 也按 svg 预览 */
function previewLangOf(codeEl: Element): string {
    const lang = Array.from(codeEl.classList)
        .find((cls) => cls.startsWith('language-'))
        ?.slice('language-'.length) ?? '';
    if (PREVIEWABLE_LANGS.has(lang)) {
        return lang;
    }
    if (lang === 'xml' && /<svg[\s>]/i.test(codeEl.textContent ?? '')) {
        return 'svg';
    }
    return '';
}

/**
 * 渲染后为可预览的代码块头部补充「预览」按钮。
 * 点击用文档级委托监听（onDelegatedClick），无需逐按钮绑定。
 */
function ensurePreviewButtons(root: HTMLElement): void {
    const blocks = root.querySelectorAll('.custom-code-block');
    blocks.forEach((block) => {
        if (block.querySelector('.md-preview-button, .md-preview-open')) {
            return;
        }
        const codeEl = block.querySelector('pre code');
        if (!codeEl || !previewLangOf(codeEl)) {
            return;
        }
        const header = block.querySelector('.code-header');
        if (!header) {
            return;
        }
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'md-preview-button';
        btn.title = t('chat.workspace.codePreview');
        btn.setAttribute('aria-label', t('chat.workspace.codePreview'));
        btn.textContent = '▣';
        header.appendChild(btn);
        const openBtn = document.createElement('button');
        openBtn.type = 'button';
        openBtn.className = 'md-preview-open';
        openBtn.title = t('chat.workspace.openInNewTab');
        openBtn.setAttribute('aria-label', t('chat.workspace.openInNewTab'));
        openBtn.textContent = '↗';
        header.appendChild(openBtn);
    });
}

/** 把代码源码包成独立 HTML 文档（SVG 居中在白底上展示） */
function buildPreviewDocument(source: string, lang: string): string {
    if (lang === 'svg') {
        return `<!doctype html><html><head><meta charset="utf-8"><style>`
            + `html,body{margin:0;height:100%;display:flex;align-items:center;justify-content:center;background:#fff}`
            + `svg{max-width:96%;max-height:96%}</style></head><body>${source}</body></html>`;
    }
    return `<!doctype html><html><head><meta charset="utf-8"></head><body>${source}</body></html>`;
}

/** 文档级委托点击：代码块复制 + HTML/SVG 预览（渲染器只产出 DOM，交互统一在这里挂） */
function onDelegatedClick(event: MouseEvent): void {
    const target = event.target as HTMLElement | null;
    if (!target) {
        return;
    }
    const isPreviewButton = target.classList?.contains('md-preview-button') ?? false;
    const isOpenButton = target.classList?.contains('md-preview-open') ?? false;
    if (!isPreviewButton && !isOpenButton) {
        return;
    }
    const block = target.closest('.custom-code-block');
    const codeEl = block?.querySelector('pre code');
    const source = codeEl?.textContent ?? '';
    // 不可预览时明确告知，不再静默失败
    if (!source.trim()) {
        pushPreviewHint(t('chat.workspace.previewEmpty'));
        return;
    }
    if (source.length > MAX_PREVIEW_CHARS) {
        pushPreviewHint(t('chat.workspace.previewTooLarge'));
        return;
    }
    const html = buildPreviewDocument(source, previewLangOf(codeEl as Element));
    if (isOpenButton) {
        openPreviewInNewTab(html);
        return;
    }
    const url = `data:text/html;charset=utf-8,${encodeURIComponent(html)}`;
    void previewUrl(url);
}

/** 预览不可用时的轻提示（动态引入 element-plus，避免新增顶部静态依赖） */
function pushPreviewHint(message: string): void {
    import('element-plus').then(({ ElMessage }) => {
        ElMessage.warning(message);
    });
}

/** 在新标签页打开预览：data: URL 会被浏览器拦截顶层导航，改用同源 Blob URL */
function openPreviewInNewTab(html: string): void {
    let blobUrl = '';
    try {
        blobUrl = URL.createObjectURL(new Blob([html], { type: 'text/html;charset=utf-8' }));
    } catch {
        return;
    }
    const win = window.open(blobUrl, '_blank');
    if (win) {
        // 切断 opener，避免模型生成的页面反向操纵本页
        win.opener = null;
    } else {
        // 弹窗被拦截时退回内建预览
        void previewUrl(`data:text/html;charset=utf-8,${encodeURIComponent(html)}`);
    }
}

onMounted(() => {
    render();
    document.addEventListener('click', onDelegatedClick);
});

watch(
    () => props.content,
    () => scheduleRender(),
);

onBeforeUnmount(() => {
    if (rafId) cancelAnimationFrame(rafId);
    document.removeEventListener('click', onDelegatedClick);
});
</script>

<style>
/* 预览按钮是运行时动态创建的，scoped 样式不生效，这里用全局样式；
   只挂在 .code-header 下，不影响其它区域。 */
.md-preview-button,
.md-preview-open {
    appearance: none;
    border: 1px solid var(--el-border-color-lighter);
    background: transparent;
    color: var(--el-text-color-secondary);
    font-size: 11px;
    line-height: 1;
    padding: 2px 6px;
    border-radius: 4px;
    cursor: pointer;
    transition: color 0.15s ease, border-color 0.15s ease;
}

.md-preview-button:hover,
.md-preview-open:hover {
    color: var(--el-color-primary);
    border-color: var(--el-color-primary-light-5);
}
</style>
