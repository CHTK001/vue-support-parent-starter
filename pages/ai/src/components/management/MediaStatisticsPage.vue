<!--
  媒体资源统计（媒体资源分类统计）

  把「AI 生成」模块（/v2/ai/generate/**）里当前账号的生成任务按分类汇总：
  媒体类型（图片 / 视频）、任务状态（成功 / 失败 / 生成中 / 排队中 / 已取消）、模型。

  <p><b>本页的核心约定：分类表完整渲染全部分类</b> —— 每个维度有多少类就出多少行，
  不 slice、不分页、不取 Top N。固定分类（图片 / 视频、五种状态）即使计数为 0
  也照样占一行，因此「本次统计只有一种媒体、一种状态」时页面依然是多行明细，
  而不是孤零零一行让人以为统计被截断了。</p>

  <p>聚合逻辑在 {@code @/utils/mediaStatistics.ts}（纯函数，无 Vue / 无接口依赖），
  页面只做「取数 + 画」。这样验收可以直接对聚合结果断言行数，不必把整个控制台跑起来。</p>
-->
<template>
  <div class="ms-page" data-page="media-statistics">
    <header class="ms-head">
      <div class="ms-head__lead">
        <h1 class="ms-title">媒体资源统计</h1>
        <span class="ms-sub">按媒体类型 / 任务状态 / 模型统计生成任务的分类计数</span>
      </div>
      <ReButton type="primary" size="small" :loading="loading" @click="load">刷新</ReButton>
    </header>

    <ReEmpty v-if="error" :text="error" />

    <template v-else>
      <!-- 顶部读数：总数 / 成功 / 失败 / 进行中 -->
      <section class="ms-kpis">
        <article class="ms-kpi" data-stat="total">
          <span class="ms-kpi__label">任务总数</span>
          <span class="ms-kpi__value">{{ stats.total }}</span>
        </article>
        <article class="ms-kpi is-success" data-stat="success">
          <span class="ms-kpi__label">成功</span>
          <span class="ms-kpi__value">{{ stats.kpi.success }}</span>
        </article>
        <article class="ms-kpi is-danger" data-stat="failed">
          <span class="ms-kpi__label">失败</span>
          <span class="ms-kpi__value">{{ stats.kpi.failed }}</span>
        </article>
        <article class="ms-kpi is-running" data-stat="running">
          <span class="ms-kpi__label">进行中（排队 + 生成）</span>
          <span class="ms-kpi__value">{{ stats.kpi.running }}</span>
        </article>
      </section>

      <!-- 分类明细：三个维度都把全部分类铺完 -->
      <section class="ms-grid">
        <article class="ms-cat" data-cat="type">
          <header class="ms-cat__head">
            <h2 class="ms-cat__title">按媒体类型</h2>
            <span class="ms-cat__hint">{{ hint(stats.byType) }}</span>
          </header>
          <div
            v-for="row in stats.byType"
            :key="row.key"
            class="ms-cat__row"
            data-row
            :data-key="row.key"
            :data-count="row.count"
          >
            <span class="ms-cat__key" :title="row.label">{{ row.label }}</span>
            <span class="ms-cat__bar"><i :style="{ width: pct(row.ratio) }" /></span>
            <span class="ms-cat__count">{{ row.count }}</span>
          </div>
        </article>

        <article class="ms-cat" data-cat="status">
          <header class="ms-cat__head">
            <h2 class="ms-cat__title">按任务状态</h2>
            <span class="ms-cat__hint">{{ hint(stats.byStatus) }}</span>
          </header>
          <div
            v-for="row in stats.byStatus"
            :key="row.key"
            class="ms-cat__row"
            data-row
            :data-key="row.key"
            :data-count="row.count"
          >
            <span class="ms-cat__key" :title="row.label">{{ row.label }}</span>
            <span class="ms-cat__bar"><i :style="{ width: pct(row.ratio) }" /></span>
            <span class="ms-cat__count">{{ row.count }}</span>
          </div>
        </article>

        <article class="ms-cat ms-cat--wide" data-cat="model">
          <header class="ms-cat__head">
            <h2 class="ms-cat__title">按模型</h2>
            <span class="ms-cat__hint">{{ hint(stats.byModel) }}</span>
          </header>
          <div v-if="!stats.byModel.length" class="ms-cat__empty">暂无生成记录</div>
          <div
            v-for="row in stats.byModel"
            :key="row.key"
            class="ms-cat__row"
            data-row
            :data-key="row.key"
            :data-count="row.count"
          >
            <span class="ms-cat__key" :title="row.label">{{ row.label }}</span>
            <span class="ms-cat__bar"><i :style="{ width: pct(row.ratio) }" /></span>
            <span class="ms-cat__count">{{ row.count }}</span>
          </div>
        </article>
      </section>

      <footer class="ms-foot">
        统计基于 {{ loadedCount }} 条生成记录
        <span v-if="capped" class="ms-foot__warn">（已达上限 {{ MAX_ROWS }} 条，更早的记录未纳入）</span>
      </footer>
    </template>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import ReButton from '@/components/ui/ReButton.vue'
import ReEmpty from '@/components/ui/ReEmpty.vue'
import { apiService } from '@/services/ApiService'
import type { GenerateTask } from '@/services/modules/generate.api'
import {
  buildMediaStatistics,
  countNonEmpty,
  type CategoryRow,
} from '@/utils/mediaStatistics'

/** 每页拉取条数（与历史接口上限一致） */
const PAGE_SIZE = 200
/** 单次统计最多拉取多少条，避免无限翻页；达到上限会在页脚注明 */
const MAX_ROWS = 2000

const tasks = ref<GenerateTask[]>([])
const loading = ref(false)
const error = ref('')
const capped = ref(false)

/** 聚合结果：三个维度都已经是「分类完整」的数组，页面直接铺 */
const stats = computed(() => buildMediaStatistics(tasks.value))

/** 已加载的记录条数 */
const loadedCount = computed(() => tasks.value.length)

/** 分类表右上角提示：总类数里有多少类真的有数据 */
function hint(rows: CategoryRow[]): string {
  return `共 ${rows.length} 类，其中 ${countNonEmpty(rows)} 类有数据`
}

/** 比例 → 条形宽度；0 也留 2px 最小宽度（见样式），这里只给百分比 */
function pct(ratio: number): string {
  return `${(ratio * 100).toFixed(2)}%`
}

/** 拉取全部记录：分页到不足一页或到达上限为止 */
async function load() {
  loading.value = true
  error.value = ''
  try {
    const all: GenerateTask[] = []
    let offset = 0
    let reachedCap = false
    // eslint-disable-next-line no-constant-condition
    while (true) {
      const chunk = await apiService.fetchGenerateHistory(undefined, PAGE_SIZE, offset)
      all.push(...chunk)
      if (chunk.length < PAGE_SIZE) {
        break
      }
      offset += PAGE_SIZE
      if (all.length >= MAX_ROWS) {
        reachedCap = true
        break
      }
    }
    tasks.value = all
    capped.value = reachedCap
  } catch (e: any) {
    error.value = '加载统计失败：' + (e?.message || '未知错误')
  } finally {
    loading.value = false
  }
}

onMounted(load)
</script>

<style scoped>
.ms-page {
  padding: 20px;
  max-width: 1100px;
  margin: 0 auto;
}
.ms-head {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 16px;
}
.ms-title {
  font-size: 18px;
  font-weight: 600;
  color: var(--el-text-color-primary);
  margin: 0;
}
.ms-sub {
  display: block;
  margin-top: 4px;
  font-size: 12px;
  color: var(--el-text-color-secondary);
}
.ms-kpis {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 12px;
  margin-bottom: 16px;
}
.ms-kpi {
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding: 14px 16px;
  border-radius: 12px;
  background: var(--el-fill-color-light);
  border: 1px solid var(--el-border-color-lighter);
}
.ms-kpi__label {
  font-size: 12px;
  color: var(--el-text-color-secondary);
}
.ms-kpi__value {
  font-size: 24px;
  font-weight: 700;
  color: var(--el-text-color-primary);
  font-variant-numeric: tabular-nums;
}
.ms-kpi.is-success .ms-kpi__value {
  color: var(--el-color-success);
}
.ms-kpi.is-danger .ms-kpi__value {
  color: var(--el-color-danger);
}
.ms-kpi.is-running .ms-kpi__value {
  color: var(--el-color-warning);
}
.ms-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
}
.ms-cat {
  padding: 14px 16px;
  border-radius: 12px;
  background: var(--el-fill-color-light);
  border: 1px solid var(--el-border-color-lighter);
}
.ms-cat--wide {
  grid-column: 1 / -1;
}
.ms-cat__head {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 8px;
  margin-bottom: 10px;
}
.ms-cat__title {
  font-size: 14px;
  font-weight: 600;
  color: var(--el-text-color-primary);
  margin: 0;
}
.ms-cat__hint {
  font-size: 12px;
  color: var(--el-text-color-secondary);
}
.ms-cat__row {
  display: grid;
  grid-template-columns: minmax(80px, 200px) 1fr 56px;
  align-items: center;
  gap: 10px;
  padding: 6px 0;
  border-top: 1px solid var(--el-border-color-extra-light);
}
.ms-cat__key {
  font-size: 13px;
  color: var(--el-text-color-regular);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.ms-cat__bar {
  height: 8px;
  border-radius: 999px;
  background: var(--el-fill-color);
  overflow: hidden;
}
.ms-cat__bar > i {
  display: block;
  height: 100%;
  border-radius: 999px;
  background: var(--el-color-primary);
  /* 0 计数也留一丝可见宽度：让「这一类存在但为 0」和「这一类没画出来」看起来不一样 */
  min-width: 2px;
}
.ms-cat__count {
  text-align: right;
  font-size: 13px;
  font-weight: 600;
  color: var(--el-text-color-primary);
  font-variant-numeric: tabular-nums;
}
.ms-cat__empty {
  padding: 8px 0;
  font-size: 13px;
  color: var(--el-text-color-secondary);
}
.ms-foot {
  margin-top: 14px;
  font-size: 12px;
  color: var(--el-text-color-secondary);
}
.ms-foot__warn {
  color: var(--el-color-warning);
}
@media (max-width: 720px) {
  .ms-kpis {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
  .ms-grid {
    grid-template-columns: minmax(0, 1fr);
  }
}
</style>
