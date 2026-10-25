<script setup lang="ts">
/**
 * 变体 5「Ledger（账本）」：左选右看的常驻双栏。
 * 左栏紧凑模型清单（图标+名称+上下文徽标+收藏星），右栏常驻明细账
 * （悬停/选中行才填充），未悬停时显示空态引导。
 * 与所有其他变体的本质区别：详情不再消失。
 * Phase 2 探索稿 — mock 数据，不动真实逻辑。
 */
import { computed, ref } from 'vue'
import ModelIcon from './ModelIcon.vue'
import { Star24Regular, Checkmark24Regular } from '@vicons/fluent'
import { ElIcon } from 'element-plus'
import { MOCK_MODELS, fmtPrice, fmtContext, fmtDate, type MockModel } from './mockData'

const models = ref<MockModel[]>(MOCK_MODELS)
/** 图标方框边长：行内 24 / 侧栏 20 / 大卡 32 */
const ICON_SIZE = 20
const selectedId = ref('openai:gpt-5')
const selectedModel = computed(() => models.value.find(m => m.id === selectedId.value) || models.value[0] || null)
const activeModel = ref<MockModel | null>(selectedModel.value)

const KIND_LABEL: Record<string, string> = { text: '文本', image: '图片', audio: '音频', video: '视频', vector: '向量', file: '文档' }
const FEAT_LABEL: Record<string, string> = { tools: '工具调用', thinking: '深度思考', 'web-search': '在线检索' }

function select(m: MockModel) {
  selectedId.value = m.id
  activeModel.value = m
}
function enter(m: MockModel) {
  activeModel.value = m
}
/**
 * 账本语义：右栏内容不随鼠标离开而消失，只在首个选中出现前留空。
 * 悬停过 A 再移开 → 仍显示 A（用户刚读过的条目），不回落到选中项，
 * 否则"看一眼就跳回别的模型"在账本里等于没读过。
 */
function leave() {
  if (!activeModel.value) {
    activeModel.value = selectedModel.value
  }
}
</script>

<template>
  <div class="ld">
    <!-- 左栏：模型清单 -->
    <aside class="ld-left">
      <div class="ld-left-title">模型清单</div>
      <div v-for="(m, i) in models" :key="m.id"
        class="ld-row"
        :class="{ 'ld-row-active': m.id === selectedId }"
        :style="{ animationDelay: `${i * 25}ms` }"
        @click="select(m)" @mouseenter="enter(m)" @mouseleave="leave">
        <div class="ld-avatar">
          <ModelIcon :logo="m.logo" :name="m.modelName" :size="20" />
        </div>
        <div class="ld-id">
          <div class="ld-name">{{ m.modelName }}</div>
          <div class="ld-provider">{{ m.provider }}</div>
        </div>
        <span v-if="m.isFavorite" class="ld-star"><Star24Regular size="12" /></span>
        <span class="ld-ctx">{{ fmtContext(m.contextWindow) }}</span>
      </div>
    </aside>

    <!-- 右栏：常驻明细账 -->
    <section class="ld-right">
      <template v-if="activeModel">
        <header class="ld-head">
          <div class="ld-avatar">
            <ModelIcon :logo="activeModel.logo" :name="activeModel.modelName" :size="32" :radius="'md'" />
          </div>
          <div class="ld-id">
            <div class="ld-head-name">
              {{ activeModel.modelName }}
              <el-icon v-if="activeModel.id === selectedId" size="14" class="ld-check"><Checkmark24Regular /></el-icon>
            </div>
            <div class="ld-provider">{{ activeModel.provider }}</div>
          </div>
          <span class="ld-ctx-lg">{{ fmtContext(activeModel.contextWindow) }}</span>
        </header>

        <div class="ld-body" :key="activeModel.id">
          <section class="ld-sec" v-if="activeModel.features.length">
            <div class="ld-sec-label">能力</div>
            <div class="ld-feats">
              <span v-for="f in activeModel.features" :key="f" class="ld-chip">{{ FEAT_LABEL[f] || f }}</span>
            </div>
          </section>
          <section class="ld-sec">
            <div class="ld-sec-label">模态</div>
            <div class="ld-mod">
              <span class="ld-mod-line">输入 <i v-for="k in activeModel.inputModalities" :key="'i'+k" class="ld-mod" :class="'ld-mod-' + k">{{ KIND_LABEL[k] || k }}</i></span>
              <span class="ld-mod-line">输出 <i v-for="k in activeModel.outputModalities" :key="'o'+k" class="ld-mod" :class="'ld-mod-' + k">{{ KIND_LABEL[k] || k }}</i></span>
            </div>
          </section>
          <section class="ld-sec">
            <div class="ld-sec-label">成本（$/1M token）</div>
            <div class="ld-cost">
              <div class="ld-cost-cell"><span>输入</span><b>{{ fmtPrice(activeModel.priceIn) }}</b></div>
              <div class="ld-cost-cell"><span>输出</span><b>{{ fmtPrice(activeModel.priceOut) }}</b></div>
              <div class="ld-cost-cell"><span>缓存·读</span><b>{{ fmtPrice(activeModel.priceCacheRead) }}</b></div>
              <div class="ld-cost-cell"><span>缓存·写</span><b>{{ fmtPrice(activeModel.priceCacheWrite) }}</b></div>
            </div>
          </section>
          <section class="ld-sec">
            <div class="ld-sec-label">限制</div>
            <div class="ld-limits">
              <div class="ld-limit"><span>上下文</span><b>{{ fmtContext(activeModel.contextWindow) }}</b></div>
              <div class="ld-limit"><span>单次输出</span><b>{{ fmtContext(activeModel.maxOutput) }}</b></div>
            </div>
          </section>
          <section class="ld-sec">
            <div class="ld-sec-label">元数据</div>
            <div class="ld-limits">
              <div class="ld-limit"><span>知识截止</span><b>{{ activeModel.knowledgeCutoff || '—' }}</b></div>
              <div class="ld-limit"><span>发布时间</span><b>{{ fmtDate(activeModel.releaseDate) }}</b></div>
            </div>
          </section>
        </div>
      </template>
      <div v-else class="ld-empty">
        <div class="ld-empty-ico"><Checkmark24Regular /></div>
        <p>将鼠标移到左侧模型上查看明细</p>
      </div>
    </section>
  </div>
</template>

<style scoped>
.ld {
  --mi-fg: var(--text-primary, var(--el-text-color-primary, #1f2430));
  --mi-fg2: var(--text-secondary, var(--el-text-color-secondary, #5c6270));
  --mi-fg3: var(--text-tertiary, var(--el-text-color-placeholder, #8b8f9c));
  --mi-bg: var(--bg-container, var(--el-bg-color, #fff));
  --mi-bg-hover: var(--bg-hover, var(--el-fill-color-light, #f5f7fa));
  --mi-line: var(--border-default, var(--el-border-color-lighter, #e3e6ef));
  --mi-line-soft: var(--border-subtle, var(--el-border-color-lighter, #eef0f6));
  --mi-accent: var(--brand-500, var(--el-color-primary, #6d5dfc));
  --mi-accent-soft: var(--brand-50, var(--el-color-primary-light-9, #f6f4ff));
  display: grid;
  grid-template-columns: 220px 1fr;
  min-height: 340px;
  background: var(--mi-bg);
  color: var(--mi-fg);
}
/* 窄屏：上下堆叠（清单在上，明细在下） */
@media (max-width: 560px) {
  .ld { grid-template-columns: 1fr; }
  .ld-right { padding: 12px; }
}

/* 左栏 */
.ld-left {
  border-right: 1px solid var(--mi-line-soft);
  padding: 8px;
  display: flex;
  flex-direction: column;
  gap: 2px;
  overflow-y: auto;
  max-height: 420px;
}
@media (max-width: 560px) {
  .ld-left { border-right: none; border-bottom: 1px solid var(--mi-line-soft); max-height: 180px; }
}
.ld-left-title {
  font-size: 10px;
  font-weight: 600;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--mi-fg3);
  padding: 4px 8px;
}
.ld-row {
  display: grid;
  grid-template-columns: 20px 1fr 14px 32px;
  gap: 7px;
  align-items: center;
  padding: 6px 8px;
  border-radius: var(--el-radius-md, 8px);
  cursor: pointer;
  transition: background 0.15s;
  position: relative;
  opacity: 0;
  animation: ld-in 0.24s ease-out forwards;
}
.ld-row:hover { background: var(--mi-bg-hover); }
.ld-row-active {
  background: var(--mi-accent-soft);
}
.ld-row-active::before {
  content: '';
  position: absolute;
  left: 0; top: 6px; bottom: 6px;
  width: 3px;
  border-radius: 2px;
  background: var(--mi-accent);
}
@keyframes ld-in {
  from { opacity: 0; transform: translateX(-4px); }
  to { opacity: 1; transform: translateX(0); }
}
@media (prefers-reduced-motion: reduce) {
  .ld-row { animation: none; opacity: 1; }
}

.ld-avatar { display: flex; flex-shrink: 0; }

.ld-id { min-width: 0; }
.ld-name {
  font-size: 12px; font-weight: 500;
  white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
}
.ld-provider { font-size: 10px; color: var(--mi-fg3); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.ld-star { display: flex; color: var(--mi-accent); justify-self: center; }
.ld-ctx {
  font-size: 10px;
  color: var(--mi-fg3);
  text-align: right;
  font-variant-numeric: tabular-nums;
}

/* 右栏 */
.ld-right {
  padding: 10px 12px;
  display: flex;
  flex-direction: column;
  min-width: 0;
  overflow-y: auto;
  max-height: 420px;
}
.ld-head {
  display: flex;
  align-items: center;
  gap: 10px;
  padding-bottom: 8px;
  border-bottom: 1px solid var(--mi-line-soft);
  margin-bottom: 4px;
}
.ld-head-name {
  font-size: 14px;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 5px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.ld-check { color: var(--mi-accent); }
.ld-ctx-lg {
  margin-left: auto;
  font-size: 13px;
  font-weight: 600;
  color: var(--mi-accent);
  font-variant-numeric: tabular-nums;
  background: var(--mi-accent-soft);
  padding: 2px 10px;
  border-radius: var(--el-radius-full, 9999px);
}
.ld-body { animation: ld-fade 0.2s ease-out; }
@keyframes ld-fade {
  from { opacity: 0; }
  to { opacity: 1; }
}
@media (prefers-reduced-motion: reduce) {
  .ld-body { animation: none; }
}

.ld-sec { padding-top: 8px; }
.ld-sec-label {
  font-size: 11px;
  font-weight: 600;
  color: var(--mi-fg2);
  margin-bottom: 5px;
}
.ld-feats { display: flex; flex-wrap: wrap; gap: 5px; }
.ld-chip {
  font-size: 11px;
  padding: 2px 8px;
  border-radius: var(--el-radius-full, 9999px);
  background: var(--mi-accent-soft);
  color: var(--mi-accent);
}
.ld-mod { display: flex; flex-direction: column; gap: 3px; }
.ld-mod-line { display: flex; align-items: center; gap: 6px; color: var(--mi-fg2); flex-wrap: wrap; font-size: 12px; }
.ld-mod {
  font-style: normal;
  font-size: 11px;
  padding: 0 7px;
  border-radius: var(--el-radius-full, 9999px);
  border: 1px solid var(--mi-line);
}
.ld-mod-text { color: var(--mi-accent); border-color: color-mix(in srgb, var(--mi-accent) 40%, transparent); }
.ld-mod-image { color: var(--el-color-warning, #f59e0b); border-color: color-mix(in srgb, var(--el-color-warning, #f59e0b) 40%, transparent); }
.ld-mod-audio { color: var(--el-color-info, #0ea5e9); border-color: color-mix(in srgb, var(--el-color-info, #0ea5e9) 40%, transparent); }
.ld-mod-video { color: var(--el-color-danger, #f04a5d); border-color: color-mix(in srgb, var(--el-color-danger, #f04a5d) 40%, transparent); }
.ld-mod-file { color: var(--el-color-info, #0ea5e9); border-color: color-mix(in srgb, var(--el-color-info, #0ea5e9) 40%, transparent); }

/* 成本：2×2 格子，数字 tabular */
.ld-cost {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 5px;
}
.ld-cost-cell {
  display: flex;
  flex-direction: column;
  gap: 1px;
  padding: 5px 8px;
  background: var(--mi-bg-hover);
  border-radius: var(--el-radius-md, 8px);
}
.ld-cost-cell span { font-size: 10px; color: var(--mi-fg3); }
.ld-cost-cell b { font-size: 12.5px; font-weight: 600; color: var(--mi-accent); font-variant-numeric: tabular-nums; }

.ld-limits { display: flex; flex-direction: column; gap: 2px; }
.ld-limit {
  display: flex;
  justify-content: space-between;
  font-size: 12px;
  color: var(--mi-fg2);
  padding: 1px 0;
}
.ld-limit b { font-weight: 500; color: var(--mi-fg); font-variant-numeric: tabular-nums; }

/* 空态 */
.ld-empty {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
  color: var(--mi-fg3);
  font-size: 12px;
  background: var(--empty-bg-gradient, rgba(109, 93, 252, 0.04));
  border-radius: var(--el-radius-lg, 12px);
  padding: 24px;
}
.ld-empty-ico {
  width: 36px; height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  background: var(--mi-accent-soft);
  color: var(--mi-accent);
  font-size: 16px;
}
.ld-empty p { margin: 0; }

/* 暗色跟随 */
html.dark .ld-left { border-right-color: var(--border-default, rgba(255, 255, 255, 0.12)); }
</style>
















