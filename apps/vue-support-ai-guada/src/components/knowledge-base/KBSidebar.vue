<!-- KnowledgeBasePage/KBSidebar.vue -->
<template>
  <div class="h-full flex flex-col bg-[var(--rm-bg-overlay)] min-w-0">
    <!-- 头部：标题 + 新建 -->
    <div class="px-4 py-2.5 flex justify-between items-center gap-2">
      <span class="font-semibold text-base text-[var(--rm-text)] truncate">{{ t('knowledge.sidebar.title') }}</span>
      <ReButton type="primary" :icon="Plus" size="small" @click="handleCreate">
        {{ t('knowledge.sidebar.create') }}
      </ReButton>
    </div>

    <!-- 搜索 -->
    <div class="px-3.5 py-3">
      <el-input v-model="searchKeyword" :placeholder="t('knowledge.sidebar.searchPlaceholder')" clearable />
    </div>

    <!-- 知识库列表 -->
    <div class="flex-1 min-h-0 overflow-y-auto py-2">
      <ScrollContainer class="max-h-full">
        <ReEmpty
          v-if="filteredKnowledgeBases.length === 0"
          :text="searchKeyword
            ? `${t('knowledge.sidebar.notFound')} · ${t('knowledge.sidebar.notFoundHint')}`
            : `${t('knowledge.sidebar.empty')} · ${t('knowledge.sidebar.emptyHint')}`"
        />
        <template v-else>
          <div
            v-for="kb in filteredKnowledgeBases"
            :key="kb.id"
            class="group flex items-center gap-2.5 mx-2.5 px-3 py-2.5 rounded-[var(--rm-radius,8px)] cursor-pointer transition"
            :class="activeId === kb.id
              ? 'bg-[var(--rm-primary-light-9)] text-[var(--rm-primary)]'
              : 'text-[var(--rm-text)] hover:bg-[var(--rm-bg-subtle)]'"
            @click="handleSelect(kb)"
          >
            <div class="flex-1 min-w-0">
              <div class="text-sm font-medium truncate leading-snug">{{ kb.name }}</div>
            </div>

            <!-- 操作：hover 显现 -->
            <div class="shrink-0 ml-auto opacity-0 group-hover:opacity-100 transition-opacity">
              <el-dropdown trigger="click" @command="(c: string) => handleDropdownCommand(c, kb)">
                <template #dropdown>
                  <el-dropdown-menu>
                    <el-dropdown-item command="edit">
                      <el-icon class="mr-1.5"><Edit /></el-icon>{{ t('knowledge.sidebar.edit') }}
                    </el-dropdown-item>
                    <el-dropdown-item command="delete">
                      <el-icon class="mr-1.5"><Delete /></el-icon>{{ t('knowledge.sidebar.delete') }}
                    </el-dropdown-item>
                  </el-dropdown-menu>
                </template>
                <div class="flex items-center justify-center p-1 rounded-[var(--rm-radius-sm,4px)] hover:bg-[var(--rm-bg-subtle)]" @click.stop>
                  <el-icon class="w-4 h-4 text-[var(--rm-text-secondary)]"><MoreFilled /></el-icon>
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
/**
 * 知识库侧栏列表。
 *
 * <p>风格与系统一致：布局用 Tailwind 工具类，新建按钮用应用本地 koi 封装 {@code ReButton}，
 * 空态用 {@code ReEmpty}；颜色只用 koi 令牌 {@code --rm-*}。
 * 原先的 {@code .search-box :deep(.el-input__wrapper)} 等 Element 内部覆写、
 * 以及 {@code .kb-item-*} 一整套手写 BEM 已全部移除 ——
 * 搜索框保持 Element 默认外观、列表项选中态由 Tailwind 条件类表达。</p>
 */
import { ref, computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { Plus, Edit, Delete, MoreFilled } from '@element-plus/icons-vue'
import { ElDropdown, ElDropdownMenu, ElDropdownItem } from 'element-plus'
import ScrollContainer from '@/components/ui/ScrollContainer.vue'
import ReButton from '@/components/re/ReButton.vue'
import ReEmpty from '@/components/re/ReEmpty.vue'
import type { KnowledgeBase } from '@/stores/knowledgeBase'

/** 组件属性 */
interface Props {
  /** 是否可见 */
  visible?: boolean
  /** 知识库列表 */
  knowledgeBases: KnowledgeBase[]
  /** 当前选中 ID */
  activeId: string | null
}

const props = defineProps<Props>()

const { t } = useI18n()

const emit = defineEmits<{
  /** 选中知识库 */
  select: [kb: KnowledgeBase]
  /** 新建 */
  create: []
  /** 编辑 */
  edit: [kb: KnowledgeBase]
  /** 删除 */
  delete: [kb: KnowledgeBase]
}>()

/** 内部搜索关键词 */
const searchKeyword = ref('')

/** 过滤后的知识库列表（名称或描述命中） */
const filteredKnowledgeBases = computed(() => {
  if (!searchKeyword.value || !searchKeyword.value.trim()) {
    return props.knowledgeBases
  }
  const keyword = searchKeyword.value.toLowerCase().trim()
  return props.knowledgeBases.filter(kb =>
    kb.name?.toLowerCase().includes(keyword) ||
    kb.description?.toLowerCase().includes(keyword),
  )
})

/**
 * 处理选中知识库。
 *
 * @param kb 目标知识库
 */
function handleSelect(kb: KnowledgeBase) {
  emit('select', kb)
}

/** 处理新建 */
function handleCreate() {
  emit('create')
}

/**
 * 处理下拉菜单命令。
 *
 * @param command 命令名（edit / delete）
 * @param kb 目标知识库
 */
function handleDropdownCommand(command: string, kb: KnowledgeBase) {
  if (command === 'edit') {
    emit('edit', kb)
  } else if (command === 'delete') {
    emit('delete', kb)
  }
}
</script>