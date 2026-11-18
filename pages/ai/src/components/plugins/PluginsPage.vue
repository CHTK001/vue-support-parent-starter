<template>
    <div class="h-full overflow-hidden flex flex-col" data-page="plugins">
        <div class="flex-1 flex flex-col overflow-hidden">
            <div class="flex-1 overflow-auto pb-4" style="scrollbar-gutter: stable both-edges;">
                <!-- 内容区：跟随「设置 → 显示」窄屏/满屏，满屏时 MainLayout 注入 --content-max-width: none 撑满 -->
                <div class="py-3 px-4 w-full mx-auto" :style="{ maxWidth: 'var(--content-max-width, 65rem)' }">
                    <!-- 瀑布文摘刊头：kicker + 渐变大标题 + 副标题（方案 10 · Masonry Digest） -->
                    <header class="digest-masthead">
                        <div class="digest-kicker">{{ t('plugins.digest.kicker') }}</div>
                        <h1 class="digest-title">{{ t('plugins.digest.title') }}</h1>
                        <p class="digest-subtitle">{{ t('plugins.digest.subtitle') }}</p>
                    </header>

                    <!-- 市场标签云：替代原 el-tabs，点击切换四个市场（路由同步逻辑不变） -->
                    <nav class="digest-chips" role="tablist" :aria-label="t('plugins.page.title')">
                        <button v-for="item in tabItems" :key="item.path" type="button" role="tab"
                            class="digest-chip" :class="{ 'is-active': currentTabValue === item.path }"
                            :aria-selected="currentTabValue === item.path"
                            @click="handleTabChange(item.path)">
                            <component :is="item.icon" class="digest-chip-ico"></component>
                            <span>{{ item.label }}</span>
                        </button>
                    </nav>

                    <template v-if="currentTabValue === 'characters'">
                        <CharacterMarket />
                    </template>
                    <template v-else-if="currentTabValue === 'mcp'">
                        <MCPServers />
                    </template>
                    <template v-else-if="currentTabValue === 'local-tools'">
                        <LocalTools />
                    </template>
                    <template v-else-if="currentTabValue === 'skills'">
                        <Skills />
                    </template>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { isAdmin } from '@repo/core'
import MCPServers from './MCPServers.vue'
import LocalTools from './LocalTools.vue'
import Skills from './Skills.vue'
import CharacterMarket from './CharacterMarket.vue'

import {
    Dumbbell16Regular,
    WrenchScrewdriver24Regular,
    Code24Regular,
    ContactCard20Regular
} from '@vicons/fluent'

import { useRouter, useRoute } from 'vue-router'

const router = useRouter()
const route = useRoute()
const { t } = useI18n()

// MCP / 本地工具仅对 v-admin 开放
const admin = ref(isAdmin())
const ADMIN_ONLY = new Set(['local-tools', 'mcp'])

// 插件设置 Tab 菜单
const sidebarItems = computed(() => [
    {
        label: t('plugins.page.tabCharacters'),
        path: 'characters',
        icon: ContactCard20Regular,
    },
    {
        label: t('plugins.page.tabLocalTools'),
        path: 'local-tools',
        icon: WrenchScrewdriver24Regular,
    },
    {
        label: t('plugins.page.tabSkills'),
        path: 'skills',
        icon: Code24Regular,
    },
    {
        label: t('plugins.page.tabMcp'),
        path: 'mcp',
        icon: Dumbbell16Regular,
    },
].filter((item) => admin.value || !ADMIN_ONLY.has(item.path)))

// Tab 数据（用于模板渲染）
const tabItems = computed(() => sidebarItems.value)

// 获取默认标签页
const getDefaultTabPath = () => {
    return sidebarItems.value[0]?.path || 'mcp'
}

const currentTabValue = ref(getDefaultTabPath())

// Tab 切换处理
const handleTabChange = (tabName: string | number) => {
    const tabPath = typeof tabName === 'string' ? tabName : String(tabName)
    router.replace({ name: 'Plugins', params: { tab: tabPath } })
}

// 监听路由参数变化
watch(() => route.params.tab, (newPath) => {
    // 确保 newPath 是字符串类型
    let tabPath = Array.isArray(newPath) ? newPath[0] : (newPath as string)
    // 非管理员访问受限 tab：回退到默认
    if (tabPath && ADMIN_ONLY.has(tabPath) && !admin.value) {
        tabPath = getDefaultTabPath()
    }
    if (tabPath && tabPath !== currentTabValue.value) {
        currentTabValue.value = tabPath
    }
})

onMounted(() => {
    // 如果没有路由参数，则跳转到默认标签页
    if (!route.params.tab) {
        const defaultTab = getDefaultTabPath()
        router.replace({ name: 'Plugins', params: { tab: defaultTab } })
    } else {
        // 确保 route.params.tab 是字符串类型
        let tabParam = Array.isArray(route.params.tab) ? route.params.tab[0] : (route.params.tab as string)
        // 非管理员直接访问受限 tab：重定向到默认
        if (ADMIN_ONLY.has(tabParam) && !admin.value) {
            tabParam = getDefaultTabPath()
            router.replace({ name: 'Plugins', params: { tab: tabParam } })
        }
        currentTabValue.value = tabParam
    }
})
</script>

<style scoped>
/* ── 瀑布文摘刊头（方案 10 · Masonry Digest）──
   令牌口径：一律 var(--体系令牌, 兜底) 写法（先例 workbench.css 的 --ax-* 模式）。
   --brand-50..600 / --brand-gradient / --focus-ring 由 brandVars.ts 运行时派生；
   --radius-* 阶梯由全局主题层供给，ai 侧取不到时落兜底值。 */
.digest-masthead {
    padding-top: 10px;
    margin-bottom: 14px;
}
.digest-kicker {
    font-family: var(--font-mono, ui-monospace, 'Cascadia Mono', Consolas, monospace);
    font-size: 11px;
    font-weight: 600;
    letter-spacing: 3px;
    color: var(--brand-500, #3b82f6);
}
.digest-title {
    margin: 8px 0 6px;
    font-size: 34px;
    line-height: 1.15;
    font-weight: 800;
    letter-spacing: 1px;
    /* 先给纯色兜底：不支持 background-clip:text 的浏览器文字仍可读 */
    color: var(--text-primary, #0f172a);
    /* 渐变大标题：蓝→紫品牌渐变（--brand-gradient 随明暗运行时切换） */
    background: var(--brand-gradient, linear-gradient(120deg, #3b82f6, #6366f1));
    -webkit-background-clip: text;
    background-clip: text;
    -webkit-text-fill-color: transparent;
}
.digest-subtitle {
    margin: 0;
    font-size: 13px;
    line-height: 1.6;
    color: var(--text-tertiary, #5b6b82);
    max-width: 430px;
}

/* ── 市场标签云（替代 el-tabs 的胶囊 chips，对应 mockup .tags/.chip）── */
.digest-chips {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 8px;
    margin-bottom: 18px;
}
.digest-chip {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 7px 14px;
    border-radius: var(--radius-full, var(--el-radius-full, 9999px));
    border: 1px solid var(--border-default, #e2e9f3);
    background: transparent;
    color: var(--text-secondary, #475569);
    font-size: 13px;
    line-height: 1;
    cursor: pointer;
    outline: none;
    transition:
        color var(--el-transition-duration-fast, 0.2s) ease,
        background-color var(--el-transition-duration-fast, 0.2s) ease,
        border-color var(--el-transition-duration-fast, 0.2s) ease;
}
.digest-chip-ico {
    width: 15px;
    height: 15px;
    flex: none;
}
.digest-chip:hover {
    color: var(--brand-500, #3b82f6);
    border-color: var(--brand-500, #3b82f6);
}
.digest-chip:focus-visible {
    box-shadow: 0 0 0 3px color-mix(in srgb, var(--brand-500, #3b82f6) 18%, transparent);
}
/* 选中态：品牌色 12% 底 + 品牌描边 + 品牌字（mockup .chip.on） */
.digest-chip.is-active {
    background: color-mix(in srgb, var(--brand-500, #3b82f6) 12%, transparent);
    border-color: var(--brand-500, #3b82f6);
    color: var(--brand-500, #3b82f6);
    font-weight: 600;
}

/* 尊重系统「减少动态效果」偏好：chip 悬停/选中立即生效 */
@media (prefers-reduced-motion: reduce) {
    .digest-chip {
        transition: none;
    }
}
</style>
