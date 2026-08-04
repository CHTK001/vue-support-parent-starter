<template>
  <div class="home">
    <div class="home__toolbar">
      <el-input
        v-model="keyword"
        placeholder="搜索组件名 / 描述"
        clearable
        size="default"
        class="home__search"
      >
        <template #prefix>
          <el-icon><Search /></el-icon>
        </template>
      </el-input>

      <div class="home__stats">
        <span class="home__stat">共 <b>{{ filtered.length }}</b> 个组件</span>
        <span class="home__stat">已配置 <b class="text-success">{{ stats.configured }}</b> 个</span>
        <span class="home__stat">通用调试 <b class="text-warning">{{ stats.unconfigured }}</b> 个</span>
      </div>
    </div>

    <div class="home__scroll">
      <section v-for="cat in activeCategories" :key="cat" class="home__section">
        <header class="home__section-head">
          <span class="home__section-title">{{ categoryLabel[cat] }}</span>
          <span class="home__section-count">{{ grouped[cat].length }} 个</span>
        </header>

        <div class="home__grid">
          <div
            v-for="item in grouped[cat]"
            :key="item.name"
            class="home__card"
            @click="open(item.name)"
          >
            <div class="home__card-icon">
              <el-icon :size="22"><component :is="item.icon" /></el-icon>
            </div>
            <div class="home__card-body">
              <div class="home__card-title">
                <span>{{ item.title }}</span>
                <code class="home__card-name">{{ item.name }}</code>
              </div>
              <div class="home__card-desc">{{ item.description }}</div>
            </div>
            <div class="home__card-foot">
              <el-tag
                v-if="templateMap.has(item.name)"
                size="small"
                type="success"
                effect="plain"
                round
              >
                参数面板
              </el-tag>
              <el-tag v-else size="small" type="warning" effect="plain" round>通用调试</el-tag>
              <el-icon class="home__card-arrow"><ArrowRight /></el-icon>
            </div>
          </div>
        </div>
      </section>

      <div v-if="!filtered.length" class="home__empty">
        <el-empty description="未匹配到组件" />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from "vue";
import { useRouter } from "vue-router";
import { Search, ArrowRight } from "@element-plus/icons-vue";
import {
  categoryLabel,
  categoryOrder,
  registry,
  type ComponentMeta,
} from "../data/componentRegistry";
import { templateMap } from "../templates";

const router = useRouter();
const keyword = ref("");

/** 搜索过滤后的组件列表 */
const filtered = computed<ComponentMeta[]>(() => {
  const k = keyword.value.trim().toLowerCase();
  if (!k) return registry;
  return registry.filter(
    (item) =>
      item.name.toLowerCase().includes(k) ||
      item.title.toLowerCase().includes(k) ||
      item.description.toLowerCase().includes(k),
  );
});

/** 按分类分组（基于过滤结果） */
const grouped = computed<Record<string, ComponentMeta[]>>(() => {
  const out: Record<string, ComponentMeta[]> = {};
  for (const cat of categoryOrder) {
    out[cat] = [];
  }
  for (const item of filtered.value) {
    out[item.category]?.push(item);
  }
  return out;
});

/** 当前展示的分类（按过滤后的命中重新计算） */
const activeCategories = computed(() =>
  categoryOrder.filter((cat) => grouped.value[cat]?.length),
);

/** 统计：已配置 schema 数 / 通用调试数 */
const stats = computed(() => {
  const configured = filtered.value.filter((i) => templateMap.has(i.name)).length;
  return {
    configured,
    unconfigured: filtered.value.length - configured,
  };
});

const open = (name: string) => {
  router.push(`/debug/${name}`);
};
</script>

<style lang="scss" scoped>
.home {
  display: flex;
  flex-direction: column;
  height: 100%;
  overflow: hidden;
}

.home__toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 16px 24px;
  background: var(--el-bg-color);
  border-bottom: 1px solid var(--el-border-color-lighter);
  flex-shrink: 0;
}

.home__search {
  width: 320px;
}

.home__stats {
  display: flex;
  gap: 16px;
  font-size: 13px;
  color: var(--el-text-color-secondary);

  .home__stat b {
    color: var(--el-text-color-primary);
    font-weight: 700;
    margin: 0 2px;
  }

  .text-success {
    color: #10b981;
  }
  .text-warning {
    color: #f59e0b;
  }
}

.home__scroll {
  flex: 1;
  min-height: 0;
  padding: 16px 24px 24px;
  overflow-y: auto;
}

.home__section {
  margin-bottom: 24px;
}

.home__section-head {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 12px;
}

.home__section-title {
  font-size: 15px;
  font-weight: 700;
  color: var(--el-text-color-primary);
}

.home__section-count {
  font-size: 12px;
  color: var(--el-text-color-secondary);
}

.home__grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 12px;
}

.home__card {
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: 14px;
  background: var(--el-bg-color);
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 10px;
  cursor: pointer;
  transition:
    transform 0.2s ease,
    border-color 0.2s ease,
    box-shadow 0.2s ease;

  &:hover {
    transform: translateY(-2px);
    border-color: #409eff;
    box-shadow: 0 6px 18px rgba(64, 158, 255, 0.12);
  }
}

.home__card-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  color: #fff;
  background: linear-gradient(135deg, #409eff 0%, #6f42c1 100%);
  border-radius: 8px;
}

.home__card-body {
  flex: 1;
  min-width: 0;
}

.home__card-title {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 14px;
  font-weight: 600;
  color: var(--el-text-color-primary);
}

.home__card-name {
  font-size: 11px;
  padding: 1px 5px;
  color: #5b8fd9;
  background: rgba(64, 158, 255, 0.08);
  border-radius: 4px;
}

.home__card-desc {
  margin-top: 4px;
  font-size: 12px;
  color: var(--el-text-color-secondary);
  line-height: 1.5;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.home__card-foot {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.home__card-arrow {
  font-size: 14px;
  color: var(--el-text-color-secondary);
  transition:
    transform 0.2s ease,
    color 0.2s ease;
}

.home__card:hover .home__card-arrow {
  color: #409eff;
  transform: translateX(2px);
}

.home__empty {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 200px;
}
</style>