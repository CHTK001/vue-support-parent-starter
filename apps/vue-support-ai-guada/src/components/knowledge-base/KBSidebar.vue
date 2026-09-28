<!-- KnowledgeBasePage/KBSidebar.vue -->
<template>
    <div class="kb-sidebar h-full flex flex-col bg-(--color-conversation-bg)">
        <!-- 头部 -->
        <div class="px-4 pt-2.5 pb-2.5 ">
            <div class="flex justify-between items-center">
                <span class="font-semibold text-base text-(--color-text)">{{ t('knowledge.sidebar.title') }}</span>
                <el-button type="primary" @click="handleCreate" :icon="Plus">
                    {{ t('knowledge.sidebar.create') }}
                </el-button>
            </div>
        </div>

        <!-- 搜索框 -->
        <div class="search-box px-3.5 py-3">
            <el-input 
                v-model="searchKeyword"
                :placeholder="t('knowledge.sidebar.searchPlaceholder')" 
                clearable 
                class="search-input" 
            />
        </div>

        <!-- 知识库列表 -->
        <div class="flex-1 overflow-y-auto py-2">
            <ScrollContainer class="max-h-full">
                <template v-if="filteredKnowledgeBases.length === 0">
                    <div class="empty-state text-center text-gray-500 flex flex-col items-center justify-center h-full py-12">
                        <div class="empty-state-icon mb-3 text-gray-300">
                            <el-icon size="32">
                                <Plus />
                            </el-icon>
                        </div>
                        <div class="empty-state-title text-sm font-medium mb-1">
                            {{ searchKeyword ? t('knowledge.sidebar.notFound') : t('knowledge.sidebar.empty') }}
                        </div>
                        <div class="empty-state-description text-xs text-gray-400">
                            {{ searchKeyword ? t('knowledge.sidebar.notFoundHint') : t('knowledge.sidebar.emptyHint') }}
                        </div>
                    </div>
                </template>
                <template v-else>
                    <div 
                        v-for="kb in filteredKnowledgeBases" 
                        :key="kb.id" 
                        class="kb-item group" 
                        :class="{
                            'kb-item-active': activeId === kb.id,
                            'kb-item-inactive': activeId !== kb.id
                        }" 
                        @click="handleSelect(kb)"
                    >
                        <div class="kb-info flex-1 min-w-0 flex items-center">
                            <div class="kb-title truncate text-sm font-medium w-full">
                                {{ kb.name }}
                            </div>
                        </div>
                        <div class="kb-actions flex items-center opacity-0 group-hover:opacity-100">
                            <el-dropdown trigger="click" @command="(command) => handleDropdownCommand(command, kb)">
                                <template #dropdown>
                                    <el-dropdown-menu>
                                        <el-dropdown-item command="edit">
                                            <Edit class="w-4 h-4 mr-2 inline-block" />
                                            {{ t('knowledge.sidebar.edit') }}
                                        </el-dropdown-item>
                                        <el-dropdown-item command="delete">
                                            <Delete class="w-4 h-4 mr-2 inline-block" />
                                            {{ t('knowledge.sidebar.delete') }}
                                        </el-dropdown-item>
                                    </el-dropdown-menu>
                                </template>
                                <div @click.stop class="kb-action-trigger">
                                    <el-icon class="w-4 h-4">
                                        <MoreFilled />
                                    </el-icon>
                                </div>
                            </el-dropdown>
                        </div>
                    </div>
                </template>
            </ScrollContainer>
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { Plus, Edit, Delete, MoreFilled } from '@element-plus/icons-vue'
import { ElDropdown, ElDropdownMenu, ElDropdownItem } from 'element-plus'
import ScrollContainer from '@/components/ui/ScrollContainer.vue'
import type { KnowledgeBase } from '@/stores/knowledgeBase'

interface Props {
    visible?: boolean
    knowledgeBases: KnowledgeBase[]
    activeId: string | null
}

const props = defineProps<Props>()

const { t } = useI18n()

const emit = defineEmits<{
    select: [kb: KnowledgeBase]
    create: []
    edit: [kb: KnowledgeBase]
    delete: [kb: KnowledgeBase]
}>()

// 内部搜索状态
const searchKeyword = ref('')

/**
 * 过滤后的知识库列表（支持搜索）
 */
const filteredKnowledgeBases = computed(() => {
    if (!searchKeyword.value || !searchKeyword.value.trim()) {
        return props.knowledgeBases
    }
    const keyword = searchKeyword.value.toLowerCase().trim()
    return props.knowledgeBases.filter(kb =>
        kb.name?.toLowerCase().includes(keyword) ||
        kb.description?.toLowerCase().includes(keyword)
    )
})

/**
 * 处理选中知识库
 */
function handleSelect(kb: KnowledgeBase) {
    emit('select', kb)
}

/**
 * 处理新建按钮点击
 */
function handleCreate() {
    emit('create')
}

/**
 * 处理下拉菜单命令
 */
function handleDropdownCommand(command: string, kb: KnowledgeBase) {
    if (command === 'edit') {
        emit('edit', kb)
    } else if (command === 'delete') {
        emit('delete', kb)
    }
}
</script>

<style scoped>
/* 搜索框样式 */
.search-box :deep(.el-input__wrapper) {
    background-color: var(--el-bg-color);
    /* 原值 8px → md 档 */
    border-radius: var(--el-radius-md, 8px);
    box-shadow: 0 0 0 1px var(--el-border-color-lighter) inset;
    padding: 6px 12px;
    transition: all 0.2s ease;
}

.search-box :deep(.el-input__wrapper:hover) {
    box-shadow: 0 0 0 1px var(--el-color-primary-light-5) inset;
}

.search-box :deep(.el-input__wrapper.is-focus) {
    box-shadow: 0 0 0 1px var(--el-color-primary) inset;
}

.search-box :deep(.el-input__inner) {
    font-size: 13px;
}

/* 知识库列表项样式 - 参考 ChatSidebar.vue */
.kb-item {
    display: flex;
    align-items: center;
    gap: 0.625rem;
    padding: 0.625rem 0.75rem;
    margin: 0.125rem 0.625rem;
    /* 原值 0.5rem（=8px）→ md 档 */
    border-radius: var(--el-radius-md, 8px);
    cursor: pointer;
    transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
}

.kb-item-inactive {
    color: var(--color-text);
}

.kb-item-inactive:hover {
    background-color: var(--color-conversation-bg-hover);
    color: var(--color-conversation-text-hover);
}

.kb-item-active {
    background-color: var(--color-conversation-bg-active);
    color: var(--color-conversation-text-active);
}

.kb-title {
    line-height: 1.4;
}

.kb-desc {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    color: var(--color-text-secondary);
    font-size: 0.75rem;
    margin-left: 2rem;
}

.kb-actions {
    margin-left: auto;
    opacity: 0;
    transition: opacity 0.2s ease;
}

/* 鼠标悬停时操作按钮显示 */
.kb-item:hover .kb-actions {
    opacity: 1;
}

/* 选中状态下操作按钮始终显示 */
/* .kb-item-active .kb-actions {
    opacity: 1;
} */

.kb-action-trigger {
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 0.25rem;
    /* 原值 0.25rem（=4px）→ xs 档 */
    border-radius: var(--el-radius-xs, 4px);
    cursor: pointer;
    transition: background-color 0.2s ease;
}

.kb-action-trigger:hover {
    background-color: color-mix(in srgb, var(--el-text-color-primary) 5%, transparent);
}

.dark .kb-action-trigger:hover {
    background-color: color-mix(in srgb, var(--el-text-color-primary) 10%, transparent);
}

/* 空状态样式 */
.empty-state-icon {
    display: flex;
    align-items: center;
    justify-content: center;
}

/* 滚动条美化 - 参考 ChatSidebar.vue */
.kb-sidebar :deep(.el-scrollbar__bar) {
    opacity: 0.6;
    transition: opacity 0.2s;
}

.kb-sidebar :deep(.el-scrollbar__bar:hover) {
    opacity: 1;
}

/* 动效降级：系统开启「减少动态效果」时，搜索框描边、列表项底色、操作区显隐
   全部改为瞬间切换。逐个列出，不写 `*` / `.kb-sidebar *` 通配，
   避免把 el-input / el-dropdown 内部 Element Plus 组件的合法过渡一起掐掉。
   .kb-actions 的 opacity: 0 与 .kb-item:hover 时的 1 都是静态声明，
   停掉过渡后「悬停出现操作按钮」照常成立。 */
@media (prefers-reduced-motion: reduce) {
    .search-box :deep(.el-input__wrapper),
    .kb-item,
    .kb-actions,
    .kb-action-trigger,
    .kb-sidebar :deep(.el-scrollbar__bar) {
        transition: none;
    }
}

/* 键盘焦点可见性：知识库行与操作触发器都是带 @click 的 div（不是可聚焦控件），
   浏览器不给默认焦点环。指针样式两者原有 cursor: pointer 已在上面声明，不重复写。
   环用主色 12% —— 侧栏底色是令牌化的 --color-conversation-bg，一档主色描边足够可见。 */
.kb-item,
.kb-action-trigger {
    outline: none;
}

.kb-item:focus-visible,
.kb-action-trigger:focus-visible {
    box-shadow: 0 0 0 3px color-mix(in srgb, var(--el-color-primary) 12%, transparent);
}

/* .kb-action-trigger 平时藏在 opacity: 0 的 .kb-actions 里，只在 .kb-item:hover 时显形。
   不处理的话，焦点环会和它的父级一起停在 0 —— 等于画了一个永远看不见的环。
   这里用 :has() 在触发器获得键盘焦点时把父级点亮，两者是同一条状态链，缺一不可。 */
.kb-item:has(.kb-action-trigger:focus-visible) .kb-actions {
    opacity: 1;
}
</style>
