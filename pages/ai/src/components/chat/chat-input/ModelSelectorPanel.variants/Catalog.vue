<script setup lang="ts">
/**
 * 变体 1「Catalog（名录）」：对账式三栏列表。
 * 行内直接摊开 输入价/输出价/上下文；悬停卡只放能力/模态/缓存/元数据细节。
 * Phase 2 探索稿 — mock 数据，不动真实逻辑。
 */
import { computed, ref } from 'vue'
import ModelIcon from './ModelIcon.vue'
import { ElIcon } from 'element-plus'
import { Checkmark24Regular, Star24Regular } from '@vicons/fluent'
import { MOCK_MODELS, fmtPrice, fmtContext, fmtDate, type MockModel } from './mockData'

const models = ref<MockModel[]>(MOCK_MODELS)
/** 图标方框边长：行内 24 / 侧栏 20 / 大卡 32 */
const ICON_SIZE = 24
const selectedId = ref('openai:gpt-5')
const selectedModel = computed(() => models.value.find(m => m.id === selectedId.value) || null)
const hoverModel = ref<MockModel | null>(null)

const KIND_LABEL: Record<string, string> = { text: '文本', image: '图片', audio: '音频', video: '视频', vector: '向量', file: '文档' }
const FEAT_LABEL: Record<string, string> = { tools: '工具调用', thinking: '深度思考', 'web-search': '在线检索' }

function select(m: MockModel) { selectedId.value = m.id }
function leave() { hoverModel.value = null }
</script>

<template>
  <div class="cat">
    <!-- 当前选中模型 -->
    <div class="cat-current" v-if="selectedModel">
      <ModelIcon :logo="selectedModel.logo" :name="selectedModel.modelName" :size="ICON_SIZE" />
      <span class="cat-name">{{ selectedModel.modelName }}</span>
      <el-icon size="16" class="cat-check"><Checkmark24Regular /></el-icon>
    </div>

    <!-- 列头（放在列表上方：账本式对齐的先读数，再看行） -->
    <div class="cat-head">
      <span class="cat-h1">模型</span>
      <span class="cat-num">IN</span>
      <span class="cat-num">OUT</span>
      <span class="cat-ctx">CTX</span>
    </div>

    <!-- 列表：图标 | 名称+供应商 | In 价 | Out 价 | 上下文 -->
    <div class="cat-list">
      <div v-for="(m, i) in models" :key="m.id"
        class="cat-row"
        :class="{ 'cat-row-active': m.id === selectedId, 'cat-row-hover': hoverModel?.id === m.id }"
        :style="{ animationDelay: `${i * 30}ms` }"
        @click="select(m)" @mouseenter="hoverModel = m" @mouseleave="leave">
        <div class="cat-avatar">
          <ModelIcon :logo="(m.logo || '')" :name="m.modelName" :size="ICON_SIZE" />
        </div>
        <div class="cat-id">
          <div class="cat-name">{{ m.modelName }}<Star24Regular class="cat-fav" width="12" height="12"  v-if="m.isFavorite"  size="12" /></div>
          <div class="cat-provider">{{ m.provider }}</div>
        </div>
        <div class="cat-num" :title="`输入价：${fmtPrice(m.priceIn)}/1M`">{{ fmtPrice(m.priceIn) }}</div>
        <div class="cat-num" :title="`输出价：${fmtPrice(m.priceOut)}/1M`">{{ fmtPrice(m.priceOut) }}</div>
        <div class="cat-ctx">{{ fmtContext(m.contextWindow) || '—' }}</div>
      </div>
    </div>

    <!-- 悬停卡：窄卡，只放细节 -->
    <Teleport to="body">
      <div v-if="hoverModel" class="cat-tip" :style="{ left: '340px', top: '80px' }">
        <div class="cat-tip-head">
          <ModelIcon :logo="(hoverModel.logo || '')" :name="hoverModel.modelName" :size="ICON_SIZE" />
          <span class="cat-tip-name">{{ hoverModel.modelName }}</span>
        </div>
        <div class="cat-tip-sec" v-if="hoverModel.features.length">
          <div class="cat-tip-label">能力</div>
          <div class="cat-tip-feats">
            <span v-for="f in hoverModel.features" :key="f" class="cat-chip">{{ FEAT_LABEL[f] || f }}</span>
          </div>
        </div>
        <div class="cat-tip-sec">
          <div class="cat-tip-label">模态</div>
          <div class="cat-tip-mod">
            <span class="cat-mod-line">输入 <i v-for="k in hoverModel.inputModalities" :key="'i'+k" class="cat-mod" :data-kind="k">{{ KIND_LABEL[k] || k }}</i></span>
            <span class="cat-mod-line">输出 <i v-for="k in hoverModel.outputModalities" :key="'o'+k" class="cat-mod" :data-kind="k">{{ KIND_LABEL[k] || k }}</i></span>
          </div>
        </div>
        <div class="cat-tip-sec" v-if="hoverModel.priceCacheRead || hoverModel.priceCacheWrite">
          <div class="cat-tip-label">缓存</div>
          <div class="cat-tip-row"><span>读</span><b>{{ fmtPrice(hoverModel.priceCacheRead) }}</b></div>
          <div class="cat-tip-row"><span>写</span><b>{{ fmtPrice(hoverModel.priceCacheWrite) }}</b></div>
        </div>
        <div class="cat-tip-sec">
          <div class="cat-tip-label">元数据</div>
          <div class="cat-tip-row"><span>知识</span><b>{{ hoverModel.knowledgeCutoff || '—' }}</b></div>
          <div class="cat-tip-row"><span>发布</span><b>{{ fmtDate(hoverModel.releaseDate) }}</b></div>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<style scoped>
.cat {
  --mi-fg: var(--text-primary, var(--el-text-color-primary, #1f2430));
  --mi-fg2: var(--text-secondary, var(--el-text-color-secondary, #5c6270));
  --mi-fg3: var(--text-tertiary, var(--el-text-color-placeholder, #8b8f9c));
  --mi-bg: var(--bg-container, var(--el-bg-color, #fff));
  --mi-bg-hover: var(--bg-hover, var(--el-fill-color-light, #f5f7fa));
  --mi-line: var(--border-default, var(--el-border-color-lighter, #e3e6ef));
  --mi-accent: var(--brand-500, var(--el-color-primary, #6d5dfc));
  --mi-accent-soft: var(--brand-50, var(--el-color-primary-light-9, #f6f4ff));
  display: flex;
  flex-direction: column;
  gap: 2px;
  padding: 8px;
  background: var(--mi-bg);
  color: var(--mi-fg);
}

/* 当前选中行 */
.cat-current {
  display: flex; align-items: center; gap: 10px;
  padding: 10px 12px;
  border-radius: var(--el-radius-md, 8px);
  background: var(--mi-accent-soft);
  border: 1px solid color-mix(in srgb, var(--mi-accent) 20%, transparent);
}
.cat-check { color: var(--mi-accent); margin-left: auto; }

/* 列头 */
.cat-head {
  display: grid;
  margin-top: 2px;
  grid-template-columns: 24px minmax(0, 1fr) 56px 56px 44px;
  gap: 8px;
  padding: 6px 12px 2px;
  font-size: 10px;
  font-weight: 600;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: var(--mi-fg3);
}
.cat-h1 { grid-column: 2; }

/* 行 */
.cat-list { display: flex; flex-direction: column; gap: 2px; }
.cat-row {
  display: grid;
  grid-template-columns: 24px minmax(0, 1fr) 56px 56px 44px;
  gap: 8px;
  align-items: center;
  padding: 7px 12px;
  border-radius: var(--el-radius-md, 8px);
  cursor: pointer;
  transition: background 0.15s;
  opacity: 0;
  animation: cat-in 0.28s ease-out forwards;
  border-left: 3px solid transparent;
}
.cat-row:hover { background: var(--mi-bg-hover); }
.cat-row-active {
  background: var(--mi-accent-soft);
  border-left-color: var(--mi-accent);
}
@keyframes cat-in {
  from { opacity: 0; transform: translateY(4px); }
  to { opacity: 1; transform: translateY(0); }
}
@media (prefers-reduced-motion: reduce) {
  .cat-row { animation: none; opacity: 1; }
}

.cat-avatar { display: flex; }
.cat-id { min-width: 0; }
.cat-name {
  font-size: 13px; font-weight: 500;
  white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
  display: flex; align-items: center; gap: 4px;
}
.cat-fav { width: 12px; height: 12px; flex-shrink: 0; color: var(--mi-accent); }
.cat-provider { font-size: 11px; color: var(--mi-fg3); }

.cat-num {
  font-size: 11px;
  color: var(--mi-fg2);
  font-variant-numeric: tabular-nums;
  text-align: right;
  white-space: nowrap;
}
.cat-ctx {
  font-size: 11px;
  color: var(--mi-fg3);
  text-align: right;
  font-variant-numeric: tabular-nums;
}

/* 悬停窄卡 */
.cat-tip {
  position: fixed;
  z-index: 3000;
  width: 200px;
  padding: 12px 14px;
  background: var(--mi-bg);
  border: 1px solid var(--mi-line);
  border-left: 3px solid var(--mi-accent);
  border-radius: var(--el-radius-lg, 12px);
  box-shadow: var(--el-box-shadow-light, 0 8px 24px rgba(15, 18, 33, 0.12));
  font-size: 12px;
  pointer-events: none;
}
.cat-tip-head { display: flex; align-items: center; gap: 8px; margin-bottom: 4px; }
.cat-tip-name { font-size: 13px; font-weight: 600; }
.cat-tip-sec { padding-top: 8px; }
.cat-tip-label { font-size: 11px; font-weight: 600; color: var(--mi-fg2); margin-bottom: 3px; }
.cat-tip-feats { display: flex; flex-wrap: wrap; gap: 4px; }
.cat-chip {
  font-size: 11px;
  padding: 1px 7px;
  border-radius: var(--el-radius-full, 9999px);
  background: var(--mi-accent-soft);
  color: var(--mi-accent);
}
.cat-tip-mod { display: flex; flex-direction: column; gap: 2px; }
.cat-mod-line { display: flex; align-items: center; gap: 6px; color: var(--mi-fg2); }
.cat-mod {
  font-style: normal;
  font-size: 11px;
  padding: 0 6px;
  border-radius: var(--el-radius-full, 9999px);
  border: 1px solid var(--mi-line);
}
.cat-mod[data-kind="text"] { color: var(--mi-accent); border-color: color-mix(in srgb, var(--mi-accent) 40%, transparent); }
.cat-tip-row {
  display: flex; justify-content: space-between;
  font-size: 12px;
  color: var(--mi-fg2);
  padding: 1px 0;
}
.cat-tip-row b { font-weight: 500; color: var(--mi-fg); font-variant-numeric: tabular-nums; }
</style>










