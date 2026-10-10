<template>
    <!-- 流式 Markdown：按帧合并后直接渲染，可靠支持同屏多个流式气泡 -->
    <div class="markdown-content">
        <div ref="markdownContainerRef"></div>
    </div>
</template>
<script setup lang="ts">
import { watch, ref, onMounted, onBeforeUnmount } from 'vue';
import { useMarkdown } from "../../composables/useMarkdown";

const { marked } = useMarkdown()

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
        } else if (parsed instanceof Promise) {
            parsed.then((h) => {
                if (typeof h === 'string' && h !== el.innerHTML) el.innerHTML = h;
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

onMounted(render);

watch(
    () => props.content,
    () => scheduleRender(),
);

onBeforeUnmount(() => {
    if (rafId) cancelAnimationFrame(rafId);
});
</script>
