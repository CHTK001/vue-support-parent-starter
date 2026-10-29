<template>
  <div class="character-market-tab">
    <!-- 搜索框 -->
    <div class="search-bar">
      <el-input
        v-model="searchKeyword"
        placeholder="搜索角色模板..."
        clearable
        class="search-input"
      >
        <template #prefix>
          <el-icon><Search /></el-icon>
        </template>
      </el-input>
    </div>

    <!-- 分类筛选 -->
    <div class="category-bar">
      <el-tag
        v-for="cat in categories"
        :key="cat"
        :type="activeCategory === cat ? 'primary' : 'info'"
        class="category-tag"
        @click="activeCategory = cat"
      >
        {{ cat }}
      </el-tag>
    </div>

    <!-- 加载骨架屏 -->
    <div v-if="loading" class="grid-container">
      <div v-for="i in 9" :key="i" class="card skeleton-card">
        <div class="skeleton-avatar"></div>
        <div class="skeleton-title"></div>
        <div class="skeleton-desc"></div>
      </div>
    </div>

    <!-- 空状态 -->
    <div v-else-if="filteredTemplates.length === 0" class="empty-state">
      <el-empty description="没有找到匹配的角色模板" />
    </div>

    <!-- 卡片网格 -->
    <div v-else class="grid-container">
      <div
        v-for="item in filteredTemplates"
        :key="item.id"
        class="card"
      >
        <div class="card-header">
          <div class="avatar">
            {{ item.title.charAt(0) }}
          </div>
          <div class="card-info">
            <div class="card-title">{{ item.title }}</div>
            <el-tag type="info" class="category-chip">
              {{ item.category }}
            </el-tag>
          </div>
        </div>
        <p class="card-desc">{{ item.description }}</p>
        <div class="card-actions">
          <el-button
            v-if="!item.added"
            type="primary"

            :loading="adding === item.id"
            @click="handleAdd(item)"
          >
            添加
          </el-button>
          <el-button
            v-else
            type="success"

            @click="goToMyRoles"
          >
            已添加
          </el-button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { message } from "@repo/core";
import { ref, computed, onMounted } from 'vue'

import { Search } from '@element-plus/icons-vue'
import { useRouter } from 'vue-router'
import { isAdmin } from '@repo/core'
import { apiService } from '../../services/ApiService'
import type { CharacterCatalogItem } from '../../services/modules/character.api'

const emit = defineEmits<{
  (e: 'added'): void
}>()

const router = useRouter()

/** 仅管理员可见的内置模板（提示词审计官等）对非管理员做第二层隐藏 */
const adminOnlyTemplateIds = ['prompt-auditor']
const showAdminOnly = isAdmin()

const loading = ref(false)
const adding = ref('')
const templates = ref<CharacterCatalogItem[]>([])
const searchKeyword = ref('')
const activeCategory = ref('全部')

const categories = computed(() => {
  const cats = new Set(templates.value.map(t => t.category))
  return ['全部', ...Array.from(cats)]
})

const filteredTemplates = computed(() => {
  return templates.value.filter(item => {
    // 仅管理员可见的模板：非管理员直接隐藏（后端已兜底，这里是前端第二层保险）
    if (!showAdminOnly && (item.adminOnly || adminOnlyTemplateIds.includes(item.id))) {
      return false
    }
    const matchCat = activeCategory.value === '全部' || item.category === activeCategory.value
    const matchSearch = !searchKeyword.value ||
      item.title.includes(searchKeyword.value) ||
      item.description.includes(searchKeyword.value) ||
      item.id.includes(searchKeyword.value)
    return matchCat && matchSearch
  })
})

const loadTemplates = async () => {
  loading.value = true
  try {
    templates.value = await apiService.fetchBuiltinCharacterCatalog()
  } catch (e) {
    console.error('加载角色模板失败:', e)
    message.error('加载角色模板失败')
  } finally {
    loading.value = false
  }
}

const handleAdd = async (item: CharacterCatalogItem) => {
  adding.value = item.id
  try {
    const res = await apiService.addBuiltinCharacterToRoles(item.id)
    if (res.success) {
      item.added = true
      message.success(res.alreadyAdded ? '已在助手中' : '添加成功')
      emit('added')
    } else {
      message.error(res.message || '添加失败')
    }
  } catch (e) {
    message.error('添加失败')
  } finally {
    adding.value = ''
  }
}

const goToMyRoles = () => {
  router.push('/characters')
}

onMounted(() => {
  loadTemplates()
})
</script>

<style scoped>
.character-market-tab {
  padding: 16px;
}

.search-bar {
  margin-bottom: 16px;
}

.search-input {
  max-width: 400px;
}

.category-bar {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 16px;
}

.category-tag {
  cursor: pointer;
}

.grid-container {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 16px;
}

.card {
  border: 1px solid var(--el-border-color);
  /* 原值 8px → md 档 */
  border-radius: var(--el-radius-md, 8px);
  padding: 16px;
  background: var(--el-bg-color);
  transition: box-shadow 0.2s;
}

/* 卡片本体不加投影；仅保留悬浮浮起反馈这一类 */
.card:hover {
  box-shadow: var(--el-box-shadow-light);
}

.card-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 12px;
}

.avatar {
  width: 40px;
  height: 40px;
  /* 原值 8px → md 档 */
  border-radius: var(--el-radius-md, 8px);
  background: var(--el-color-primary-light-9);
  color: var(--el-color-primary);
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
  font-size: 16px;
  flex-shrink: 0;
}

.card-info {
  flex: 1;
  min-width: 0;
}

.card-title {
  font-weight: 600;
  margin-bottom: 4px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.category-chip {
  font-size: 11px;
}

.card-desc {
  color: var(--el-text-color-secondary);
  font-size: 13px;
  line-height: 1.5;
  margin-bottom: 12px;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.card-actions {
  display: flex;
  justify-content: flex-end;
}

.skeleton-card {
  height: 140px;
}

.skeleton-avatar {
  width: 40px;
  height: 40px;
  /* 原值 8px → md 档 */
  border-radius: var(--el-radius-md, 8px);
  background: var(--el-fill-color-light);
  margin-bottom: 12px;
}

.skeleton-title {
  height: 16px;
  width: 60%;
  background: var(--el-fill-color-light);
  /* 原值 4px → xs 档 */
  border-radius: var(--el-radius-xs, 4px);
  margin-bottom: 8px;
}

.skeleton-desc {
  height: 12px;
  width: 90%;
  background: var(--el-fill-color-light);
  /* 原值 4px → xs 档 */
  border-radius: var(--el-radius-xs, 4px);
  margin-bottom: 4px;
}

.empty-state {
  padding: 60px 0;
}

/* 动效降级：系统开启「减少动态效果」时，卡片悬浮投影直接落位。
   只关 .card 自己的 transition，不写 `*` / `.grid-container *` 通配，
   避免把 el-button / el-tag / el-empty 内部 Element Plus 组件的合法过渡一起掐掉。
   本文件只有 transition、没有 animation，投影本身是静态样式，照常生效。 */
@media (prefers-reduced-motion: reduce) {
  .card {
    transition: none;
  }
}
</style>
