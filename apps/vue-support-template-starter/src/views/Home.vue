<script setup lang="ts">
/**
 * 主页 —— 组件库展示大厅
 *
 * 结构（v2 重排）：
 *   1) Hero：标题 + 统计 + 搜索框（按 name/title/description 过滤卡片）
 *   2) 左侧 sticky 分类导航（锚点跳转 + 当前分类高亮）
 *   3) 右侧内容：ReGraph 高亮区 + 按 category 分组的卡片网格
 *
 * ⚠️ 依赖宿主可滚：App.vue 的 .tpl-main 必须是 overflow-y:auto，
 *    否则 68 张卡片会被静默裁掉（历史上这里就是 overflow:hidden 导致只能看到 12 张）。
 */
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from "vue";
import { useRouter } from "vue-router";
import {
  Aim,
  Connection,
  MagicStick,
  Promotion,
  Search,
  Share,
} from "@element-plus/icons-vue";
import {
  categoryLabel,
  categoryOrder,
  registry,
  type ComponentCategory,
  type ComponentMeta,
} from "../data/componentRegistry";
import { templateMap } from "../templates";

const router = useRouter();

/** 搜索关键词 */
const keyword = ref("");
/** 当前可见分类（导航高亮） */
const activeCat = ref<ComponentCategory>("basic");

/** 按 category 分组的组件元数据 */
const grouped = computed(() => {
  const kw = keyword.value.trim().toLowerCase();
  const map = new Map<ComponentCategory, ComponentMeta[]>();
  for (const cat of categoryOrder) {
    map.set(cat, []);
  }
  for (const item of registry) {
    map.get(item.category)?.push(item);
  }
  return categoryOrder
    .map((cat) => {
      const all = map.get(cat) ?? [];
      const items = kw
        ? all.filter((i) =>
            `${i.name} ${i.title} ${i.description}`.toLowerCase().includes(kw),
          )
        : all;
      return { category: cat, label: categoryLabel[cat], items, total: all.length };
    })
    .filter((g) => g.items.length > 0);
});

/** 匹配总数 */
const matched = computed(() => grouped.value.reduce((n, g) => n + g.items.length, 0));

/** 总数 / 已配置 schema / ReGraph 系列 */
const stats = computed(() => ({
  total: registry.length,
  configured: registry.filter((item) => templateMap.has(item.name)).length,
  graphSeries: registry.filter((i) => i.name.startsWith("ReGraph")).length,
}));

/** 跳到调试页 */
const goDebug = (name: string) => {
  router.push(`/debug/${name}`);
};

/** 是否已配置 schema（用于卡片角标） */
const hasSchema = (name: string) => templateMap.has(name);

/** 锚点 id */
const anchorId = (cat: ComponentCategory) => `cat-${cat}`;

/** 点击导航：滚动到对应分类（立即高亮，不等 observer 回调） */
function scrollTo(cat: ComponentCategory) {
  activeCat.value = cat;
  const el = document.getElementById(anchorId(cat));
  el?.scrollIntoView({ behavior: "smooth", block: "start" });
}

/** 滚动时高亮当前分类（IntersectionObserver） */
let observer: IntersectionObserver | null = null;

function attachObserver() {
  observer?.disconnect();
  // ⚠️ root 必须是 .tpl-main：页面本身不滚动（.tpl-shell 是 100vh + overflow:hidden），
  //    滚动发生在 .tpl-main 内部。用默认 root（视口）会导致高亮算错。
  const root = document.querySelector(".tpl-main");
  observer = new IntersectionObserver(
    (entries) => {
      const visible = entries
        .filter((e) => e.isIntersecting)
        .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
      if (visible[0]?.target?.id) {
        activeCat.value = visible[0].target.id.replace("cat-", "") as ComponentCategory;
      }
    },
    { root, rootMargin: "-80px 0px -55% 0px", threshold: 0 },
  );
  for (const cat of categoryOrder) {
    const el = document.getElementById(anchorId(cat));
    if (el) observer.observe(el);
  }
}

onMounted(attachObserver);
// ⚠️ 搜索过滤会增删 .category 节点（搜不到时全部销毁），observer 会盯上已卸载的旧节点而彻底失灵，
//    所以 grouped 变化后必须重新挂载。
watch(grouped, () => nextTick(attachObserver));
onBeforeUnmount(() => observer?.disconnect());
</script>

<template>
  <div class="home">
    <!-- Hero：更紧凑，把纵向空间留给卡片 -->
    <section class="hero">
      <div class="hero__inner">
        <div class="hero__row">
          <div class="hero__text">
            <div class="hero__title">
              <span class="hero__badge">Vue Support</span>
              组件库展示大厅
            </div>
            <p class="hero__sub">
              按主题加载（default / koi），按需打包；点卡片 → 左侧调参 → 右侧看效果与代码。
            </p>
          </div>
          <div class="hero__stats">
            <div class="hero__stat">
              <div class="hero__stat-value">{{ stats.total }}</div>
              <div class="hero__stat-label">组件总数</div>
            </div>
            <div class="hero__stat">
              <div class="hero__stat-value">{{ stats.configured }}</div>
              <div class="hero__stat-label">已配置面板</div>
            </div>
            <div class="hero__stat">
              <div class="hero__stat-value">{{ stats.graphSeries }}</div>
              <div class="hero__stat-label">ReGraph 系列</div>
            </div>
          </div>
        </div>

        <!-- 搜索过滤 -->
        <div class="hero__search">
          <el-input
            v-model="keyword"
            :prefix-icon="Search"
            placeholder="搜索组件名 / 中文名 / 描述，如 ReSearch、搜索、图表"
            clearable
            size="large"
          />
          <span v-if="keyword.trim()" class="hero__matched">
            匹配 {{ matched }} / {{ stats.total }}
          </span>
        </div>
      </div>
    </section>

    <div class="body">
      <!-- 左侧分类导航（sticky） -->
      <aside class="nav">
        <div class="nav__title">分类导航</div>
        <button
          v-for="g in grouped"
          :key="g.category"
          type="button"
          class="nav__item"
          :class="{ 'nav__item--active': activeCat === g.category }"
          @click="scrollTo(g.category)"
        >
          <span>{{ g.label }}</span>
          <span class="nav__count">{{ g.items.length }}</span>
        </button>
        <div v-if="!grouped.length" class="nav__empty">无匹配</div>
      </aside>

      <!-- 右侧内容 -->
      <section class="content">
        <!-- ReGraph 高亮（搜索时隐藏） -->
        <div v-if="!keyword.trim()" class="spotlight">
          <div class="spotlight__head">
            <div class="spotlight__title">
              <el-icon><MagicStick /></el-icon>
              <span>ReGraph 系列高亮</span>
              <el-tag type="success" size="small" effect="plain" round>新功能</el-tag>
            </div>
            <el-button text size="small" @click="goDebug('ReGraph')">全部关系图 →</el-button>
          </div>
          <div class="spotlight__cards">
            <div class="spotlight-card" @click="goDebug('ReGraphForce')">
              <div class="spotlight-card__icon"><el-icon><Connection /></el-icon></div>
              <div class="spotlight-card__body">
                <div class="spotlight-card__title">ReGraphForce · 力导向</div>
                <div class="spotlight-card__desc">
                  社交网络示例，14 节点 / 16 关系，支持搜索、右键扩线、折叠、锁定、历史回溯。
                </div>
                <div class="spotlight-card__meta">
                  <el-tag size="small" effect="plain" type="success">已配置</el-tag>
                  <span class="spotlight-card__cat">图表 / 关系图</span>
                </div>
              </div>
              <el-icon class="spotlight-card__arrow"><Promotion /></el-icon>
            </div>

            <div class="spotlight-card" @click="goDebug('ReGraphTree')">
              <div class="spotlight-card__icon spotlight-card__icon--tree">
                <el-icon><Share /></el-icon>
              </div>
              <div class="spotlight-card__body">
                <div class="spotlight-card__title">ReGraphTree · 组织架构</div>
                <div class="spotlight-card__desc">
                  树形布局演示：18 节点公司架构（CEO / 总监 / 部门 / 员工）。
                </div>
                <div class="spotlight-card__meta">
                  <el-tag size="small" effect="plain" type="success">已配置</el-tag>
                  <span class="spotlight-card__cat">图表 / 关系图</span>
                </div>
              </div>
              <el-icon class="spotlight-card__arrow"><Promotion /></el-icon>
            </div>

            <div class="spotlight-card" @click="goDebug('ReGraphCenter')">
              <div class="spotlight-card__icon spotlight-card__icon--center">
                <el-icon><Aim /></el-icon>
              </div>
              <div class="spotlight-card__body">
                <div class="spotlight-card__title">ReGraphCenter · 中心辐射</div>
                <div class="spotlight-card__desc">
                  微服务架构示例：API 网关为中心 + 5 业务服务 + 3 数据存储。
                </div>
                <div class="spotlight-card__meta">
                  <el-tag size="small" effect="plain" type="success">已配置</el-tag>
                  <span class="spotlight-card__cat">图表 / 关系图</span>
                </div>
              </div>
              <el-icon class="spotlight-card__arrow"><Promotion /></el-icon>
            </div>

            <div class="spotlight-card" @click="goDebug('ReGraph3D')">
              <div class="spotlight-card__icon spotlight-card__icon--3d">
                <el-icon><MagicStick /></el-icon>
              </div>
              <div class="spotlight-card__body">
                <div class="spotlight-card__title">ReGraph3D · 3D 力导向</div>
                <div class="spotlight-card__desc">
                  three.js + d3-force，AI 知识图谱 15 节点，自动旋转 / 拖拽缩放。
                </div>
                <div class="spotlight-card__meta">
                  <el-tag size="small" effect="plain" type="success">已配置</el-tag>
                  <el-tag size="small" effect="plain" type="warning">3D</el-tag>
                  <span class="spotlight-card__cat">图表 / 关系图</span>
                </div>
              </div>
              <el-icon class="spotlight-card__arrow"><Promotion /></el-icon>
            </div>
          </div>
        </div>

        <!-- 分类分组 -->
        <div
          v-for="group in grouped"
          :id="anchorId(group.category)"
          :key="group.category"
          class="category"
        >
          <div class="category__head">
            <span class="category__title">{{ group.label }}</span>
            <span class="category__count">
              {{ keyword.trim() ? `${group.items.length} / ${group.total}` : group.items.length }} 个
            </span>
          </div>
          <div class="category__grid">
            <div
              v-for="item in group.items"
              :key="item.name"
              class="item-card"
              @click="goDebug(item.name)"
            >
              <div class="item-card__head">
                <div class="item-card__icon">
                  <el-icon><component :is="item.icon ?? 'Box'" /></el-icon>
                </div>
                <el-tag
                  v-if="!hasSchema(item.name)"
                  size="small"
                  effect="plain"
                  type="warning"
                >
                  通用调试
                </el-tag>
              </div>
              <div class="item-card__title">{{ item.title }}</div>
              <div class="item-card__name">&lt;{{ item.name }} /&gt;</div>
              <div class="item-card__desc">{{ item.description }}</div>
            </div>
          </div>
        </div>

        <el-empty v-if="!grouped.length" description="没有匹配的组件，换个关键词试试" />
      </section>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.home {
  display: flex;
  flex-direction: column;
  width: 100%;
  min-height: 100%;
}

/* Hero（紧凑版） */
.hero {
  padding: 16px 24px 12px;
  background:
    radial-gradient(ellipse 60% 90% at 15% 0%, rgba(91, 141, 239, 0.14), transparent 62%),
    radial-gradient(ellipse 45% 70% at 85% 100%, rgba(168, 85, 247, 0.1), transparent 62%);
}
.hero__inner {
  max-width: 1560px;
  margin: 0 auto;
}
.hero__row {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 24px;
  flex-wrap: wrap;
  margin-bottom: 12px;
}
.hero__text {
  min-width: 280px;
}
.hero__title {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 20px;
  font-weight: 700;
  color: var(--el-text-color-primary);
  margin: 0 0 4px;
}
.hero__badge {
  padding: 3px 10px;
  font-size: 12px;
  font-weight: 500;
  color: var(--el-color-primary);
  background: var(--el-color-primary-light-9);
  border: 1px solid var(--el-color-primary-light-5);
  border-radius: 999px;
}
.hero__sub {
  font-size: 13px;
  color: var(--el-text-color-secondary);
  margin: 0;
}
.hero__stats {
  display: grid;
  grid-template-columns: repeat(3, minmax(88px, 1fr));
  gap: 10px;
}
.hero__stat {
  padding: 8px 12px;
  background: var(--el-bg-color);
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 10px;
  text-align: center;
}
.hero__stat-value {
  font-size: 20px;
  font-weight: 700;
  color: var(--el-color-primary);
  line-height: 1.2;
}
.hero__stat-label {
  font-size: 11px;
  color: var(--el-text-color-secondary);
}
.hero__search {
  display: flex;
  align-items: center;
  gap: 12px;
}
.hero__search :deep(.el-input) {
  flex: 1;
  max-width: 640px;
}
.hero__matched {
  font-size: 12px;
  color: var(--el-text-color-secondary);
  white-space: nowrap;
}

/* 主体：左导航 + 右内容 */
.body {
  display: flex;
  align-items: flex-start;
  gap: 20px;
  padding: 4px 24px 32px;
  max-width: 1560px;
  margin: 0 auto;
  width: 100%;
}

.nav {
  position: sticky;
  top: 0;
  flex: 0 0 148px;
  padding: 12px 10px;
  background: var(--el-bg-color);
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 10px;
  align-self: flex-start;
  max-height: calc(100vh - 140px);
  overflow-y: auto;
}
.nav__title {
  font-size: 11px;
  font-weight: 600;
  color: var(--el-text-color-secondary);
  padding: 0 6px 8px;
  letter-spacing: 0.5px;
}
.nav__item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 6px;
  width: 100%;
  padding: 6px 8px;
  margin-bottom: 2px;
  font-size: 13px;
  color: var(--el-text-color-regular);
  background: transparent;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  text-align: left;
  transition: background 0.15s, color 0.15s;
}
.nav__item:hover {
  background: var(--el-fill-color-light);
  color: var(--el-text-color-primary);
}
.nav__item--active {
  background: var(--el-color-primary-light-9);
  color: var(--el-color-primary);
  font-weight: 600;
}
.nav__count {
  font-size: 11px;
  color: var(--el-text-color-secondary);
  background: var(--el-fill-color);
  padding: 0 5px;
  border-radius: 4px;
}
.nav__item--active .nav__count {
  background: var(--el-color-primary-light-8);
  color: var(--el-color-primary);
}
.nav__empty {
  font-size: 12px;
  color: var(--el-text-color-placeholder);
  padding: 4px 8px;
}

.content {
  flex: 1;
  min-width: 0;
}

/* ReGraph 高亮 */
.spotlight {
  margin-bottom: 20px;
  padding: 14px 16px;
  background: var(--el-bg-color);
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 12px;
}
.spotlight__head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 10px;
}
.spotlight__title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  font-weight: 600;
}
.spotlight__cards {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
  gap: 10px;
}
.spotlight-card {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  padding: 12px;
  background: var(--el-fill-color-blank);
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 10px;
  cursor: pointer;
  transition: all 0.2s ease;
}
.spotlight-card:hover {
  border-color: var(--el-color-primary-light-5);
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(64, 158, 255, 0.08);
}
.spotlight-card__icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 34px;
  height: 34px;
  font-size: 17px;
  color: #fff;
  background: linear-gradient(135deg, #409eff 0%, #6f42c1 100%);
  border-radius: 8px;
  flex-shrink: 0;
}
.spotlight-card__icon--tree {
  background: linear-gradient(135deg, #22c55e 0%, #16a34a 100%);
}
.spotlight-card__icon--center {
  background: linear-gradient(135deg, #f59e0b 0%, #ef4444 100%);
}
.spotlight-card__icon--3d {
  background: linear-gradient(135deg, #a855f7 0%, #6366f1 100%);
}
.spotlight-card__body {
  flex: 1;
  min-width: 0;
}
.spotlight-card__title {
  font-size: 13px;
  font-weight: 600;
  margin-bottom: 3px;
}
.spotlight-card__desc {
  font-size: 12px;
  line-height: 1.5;
  color: var(--el-text-color-secondary);
  margin-bottom: 6px;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
.spotlight-card__meta {
  display: flex;
  align-items: center;
  gap: 6px;
  flex-wrap: wrap;
}
.spotlight-card__cat {
  font-size: 11px;
  color: var(--el-text-color-secondary);
}
.spotlight-card__arrow {
  align-self: center;
  font-size: 15px;
  color: var(--el-text-color-placeholder);
  flex-shrink: 0;
  transition: transform 0.2s ease;
}
.spotlight-card:hover .spotlight-card__arrow {
  color: var(--el-color-primary);
  transform: translateX(2px);
}

/* Category */
.category {
  margin-bottom: 22px;
  scroll-margin-top: 8px;
}
.category__head {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 10px;
  padding-bottom: 6px;
  border-bottom: 1px solid var(--el-border-color-lighter);
}
.category__title {
  font-size: 15px;
  font-weight: 600;
}
.category__count {
  font-size: 12px;
  color: var(--el-text-color-secondary);
  padding: 1px 6px;
  background: var(--el-fill-color);
  border-radius: 4px;
}
.category__grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(210px, 1fr));
  gap: 10px;
}

/* Item Card（小一号，提升密度） */
.item-card {
  padding: 11px 12px;
  background: var(--el-bg-color);
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 10px;
  cursor: pointer;
  transition: all 0.18s ease;
  display: flex;
  flex-direction: column;
  gap: 5px;
  min-height: 112px;
}
.item-card:hover {
  border-color: var(--el-color-primary-light-5);
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(64, 158, 255, 0.08);
}
.item-card__head {
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.item-card__icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  font-size: 15px;
  color: var(--el-color-primary);
  background: var(--el-color-primary-light-9);
  border-radius: 7px;
}
.item-card__title {
  font-size: 13px;
  font-weight: 600;
}
.item-card__name {
  font-size: 10px;
  color: var(--el-color-primary);
  background: var(--el-color-primary-light-9);
  padding: 1px 5px;
  border-radius: 4px;
  font-family: monospace;
  align-self: flex-start;
}
.item-card__desc {
  font-size: 11px;
  line-height: 1.5;
  color: var(--el-text-color-secondary);
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  margin-top: auto;
}

/* 响应式 */
@media (max-width: 1100px) {
  .spotlight__cards {
    grid-template-columns: repeat(2, 1fr);
  }
}
@media (max-width: 860px) {
  .body {
    flex-direction: column;
    padding: 4px 16px 24px;
  }
  .nav {
    position: static;
    flex: none;
    width: 100%;
    max-height: none;
    display: flex;
    flex-wrap: wrap;
    gap: 4px;
  }
  .nav__title {
    width: 100%;
  }
  .nav__item {
    width: auto;
    margin-bottom: 0;
  }
}
@media (max-width: 720px) {
  .hero {
    padding: 14px 16px 10px;
  }
  .hero__stats {
    grid-template-columns: repeat(3, 1fr);
  }
  .hero__title {
    font-size: 17px;
  }
  .spotlight__cards {
    grid-template-columns: 1fr;
  }
}
</style>
