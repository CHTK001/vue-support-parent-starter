<template>
    <div class="settings-skeleton" aria-hidden="true">
        <div class="settings-skeleton__card">
            <div class="settings-skeleton__row settings-skeleton__title"></div>
            <div class="settings-skeleton__row settings-skeleton__hint"></div>
            <div v-for="i in 4" :key="i" class="settings-skeleton__field">
                <div class="settings-skeleton__row settings-skeleton__label"></div>
                <div class="settings-skeleton__row settings-skeleton__control"></div>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
/**
 * 设置中心异步面板的加载骨架屏。
 *
 * <p>给 {@code defineAsyncComponent} 的 {@code loadingComponent} 用：动态面板
 * （渠道管理等重依赖页）的 chunk 拉取期间占位，避免「切 tab 先空白、
 * 大块内容到位后猛地弹出」。纯静态结构：不取数、不带交互、不吃宽度约束，
 * 跟随宿主容器撑满高度。配 {@code delay} 使用 —— 加载快于 delay 时不渲染，不闪屏。
 * 配色走 Element Plus 变量（带兜底值），暗色模式自动跟随。</p>
 */
defineOptions({ name: 'SettingsPanelSkeleton' })
</script>

<style scoped>
.settings-skeleton {
    display: flex;
    align-items: stretch;
    justify-content: center;
    width: 100%;
    height: 100%;
    padding: 16px;
    box-sizing: border-box;
}

.settings-skeleton__card {
    width: 100%;
    max-width: 880px;
    padding: 22px 24px;
    border-radius: 12px;
    background: var(--el-bg-color, #fff);
    border: 1px solid var(--el-border-color-lighter, #e4e7ed);
}

.settings-skeleton__row {
    border-radius: 6px;
    background: var(--el-fill-color-light, #f0f2f5);
    animation: settings-skeleton-pulse 1.4s ease-in-out infinite;
}

.settings-skeleton__title {
    width: 32%;
    height: 18px;
    margin-bottom: 12px;
}

.settings-skeleton__hint {
    width: 56%;
    height: 12px;
    margin-bottom: 26px;
    opacity: 0.7;
}

.settings-skeleton__field {
    margin-bottom: 20px;
}

.settings-skeleton__label {
    width: 18%;
    height: 12px;
    margin-bottom: 8px;
    opacity: 0.7;
}

.settings-skeleton__control {
    width: 100%;
    height: 32px;
}

@keyframes settings-skeleton-pulse {
    0%,
    100% {
        opacity: 1;
    }
    50% {
        opacity: 0.45;
    }
}

@media (prefers-reduced-motion: reduce) {
    .settings-skeleton__row {
        animation: none;
    }
}
</style>
