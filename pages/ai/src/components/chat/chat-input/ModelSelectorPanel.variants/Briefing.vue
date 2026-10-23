<script setup lang="ts">
/**
 * 变体 2「Briefing（简报）」：卡片网格 + 价格胶囊。
 * 每个模型一张小卡片（图标+名称+描述一行+输入/输出价格胶囊），
 * 悬停在卡片上弹出完整信息卡（全量：能力/模态/成本/限制/元数据）。
 * Phase 2 探索稿 — mock 数据，不动真实逻辑。
 */
import { computed, ref } from 'vue'
import ModelIcon from './ModelIcon.vue'
import { Star24Regular, Checkmark24Regular } from '@vicons/fluent'
import { ElIcon } from 'element-plus'
import { MOCK_MODELS, fmtPrice, fmtContext, fmtDate, type MockModel } from './mockData'

const models = ref<MockModel[]>(MOCK_MODELS)
/** 图标方框边长：行内 24 / 侧栏 20 / 大卡 32 */
const ICON_SIZE = 24
const selectedId = ref('openai:gpt-5')
const selectedModel = computed(() => models.value.find(m => m.id === selectedId.value) || null)
const hoverModel = ref<MockModel | null>(null)
let closeTimer: number | undefined

const KIND_LABEL: Record<string, string> = { text: '文本', image: '图片', audio: '音频', video: '视频', vector: '向量', file: '文档' }
const FEAT_LABEL: Record<string, string> = { tools: '工具调用', thinking: '深度思考', 'web-search': '在线检索' }

function select(m: MockModel) {
  selectedId.value = m.id
}
function enter(m: MockModel) {
  window.clearTimeout(closeTimer)
  hoverModel.value = m
}
function leave() {
  closeTimer = window.setTimeout(() => { hoverModel.value = null }, 180)
}
</script>

<template>
  <div class="bf">
    <div class="bf-grid">
      <div v-for="(m, i) in models" :key="m.id"
        class="bf-card"
        :class="{ 'bf-card-active': m.id === selectedId }"
        :style="{ animationDelay: `${i * 40}ms` }"
        @click="select(m)" @mouseenter="enter(m)" @mouseleave="leave">
        <div class="bf-card-head">
          <div class="bf-avatar">
            <ModelIcon :logo="m.logo" :name="m.modelName" :size="ICON_SIZE" />
          </div>
          <div class="bf-id">
            <div class="bf-name">
              {{ m.modelName }}
              <Star24Regular class="bf-fav" width="12" height="12"  v-if="m.isFavorite"  size="12" />
              <el-icon v-if="m.id === selectedId" size="13" class="bf-check"><Checkmark24Regular /></el-icon>
            </div>
            <div class="bf-provider">{{ m.provider }}</div>
          </div>
          <span class="bf-ctx">{{ fmtContext(m.contextWindow) }}</span>
        </div>
        <p class="bf-desc">{{ m.description }}</p>
        <div class="bf-pills">
          <span class="bf-pill" :title="`输入 ${fmtPrice(m.priceIn)} / 1M token`">入 {{ fmtPrice(m.priceIn) }}</span>
          <span class="bf-pill bf-pill-out" :title="`输出 ${fmtPrice(m.priceOut)} / 1M token`">出 {{ fmtPrice(m.priceOut) }}</span>
        </div>
      </div>
    </div>

    <!-- 悬停信息卡：全量简报 -->
    <Teleport to="body">
      <div v-if="hoverModel" class="bf-tip" :style="{ left: 'calc(50% + 260px)', top: '15%' }" @mouseenter="enter(hoverModel)" @mouseleave="leave">
        <header class="bf-tip-head">
          <div class="bf-avatar">
            <ModelIcon :logo="hoverModel.logo" :name="hoverModel.modelName" :size="ICON_SIZE" />
          </div>
          <div class="bf-id">
            <div class="bf-name">{{ hoverModel.modelName }}</div>
            <div class="bf-provider">{{ hoverModel.provider }}</div>
          </div>
        </header>
        <p class="bf-tip-desc">{{ hoverModel.description }}</p>

        <section class="bf-tip-sec" v-if="hoverModel.features.length">
          <div class="bf-tip-label">能力</div>
          <div class="bf-tip-feats">
            <span v-for="f in hoverModel.features" :key="f" class="bf-chip">{{ FEAT_LABEL[f] || f }}</span>
          </div>
        </section>
        <section class="bf-tip-sec">
          <div class="bf-tip-label">模态</div>
          <div class="bf-tip-mod">
            <span class="bf-mod-line">输入 <i v-for="k in hoverModel.inputModalities" :key="'i'+k" class="bf-mod" :class="'bf-mod-' + k">{{ KIND_LABEL[k] || k }}</i></span>
            <span class="bf-mod-line">输出 <i v-for="k in hoverModel.outputModalities" :key="'o'+k" class="bf-mod" :class="'bf-mod-' + k">{{ KIND_LABEL[k] || k }}</i></span>
          </div>
        </section>
        <section class="bf-tip-sec">
          <div class="bf-tip-label">成本（$/1M）</div>
          <div class="bf-tip-row"><span>输入</span><b>{{ fmtPrice(hoverModel.priceIn) }}</b></div>
          <div class="bf-tip-row"><span>输出</span><b>{{ fmtPrice(hoverModel.priceOut) }}</b></div>
          <div class="bf-tip-row"><span>缓存读</span><b>{{ fmtPrice(hoverModel.priceCacheRead) }}</b></div>
          <div class="bf-tip-row"><span>缓存写</span><b>{{ fmtPrice(hoverModel.priceCacheWrite) }}</b></div>
        </section>
        <section class="bf-tip-sec">
          <div class="bf-tip-label">限制</div>
          <div class="bf-tip-row"><span>上下文</span><b>{{ fmtContext(hoverModel.contextWindow) }}</b></div>
          <div class="bf-tip-row"><span>单次输出</span><b>{{ fmtContext(hoverModel.maxOutput) }}</b></div>
        </section>
        <section class="bf-tip-sec">
          <div class="bf-tip-label">元数据</div>
          <div class="bf-tip-row"><span>知识</span><b>{{ hoverModel.knowledgeCutoff || '—' }}</b></div>
          <div class="bf-tip-row"><span>发布</span><b>{{ fmtDate(hoverModel.releaseDate) }}</b></div>
        </section>
      </div>
    </Teleport>
  </div>
</template>

<style scoped>
.bf {
  --mi-fg: var(--text-primary, var(--el-text-color-primary, #1f2430));
  --mi-fg2: var(--text-secondary, var(--el-text-color-secondary, #5c6270));
  --mi-fg3: var(--text-tertiary, var(--el-text-color-placeholder, #8b8f9c));
  --mi-bg: var(--bg-container, var(--el-bg-color, #fff));
  --mi-bg-hover: var(--bg-hover, var(--el-fill-color-light, #f5f7fa));
  --mi-line: var(--border-default, var(--el-border-color-lighter, #e3e6ef));
  --mi-line-soft: var(--border-subtle, var(--el-border-color-lighter, #eef0f6));
  --mi-accent: var(--brand-500, var(--el-color-primary, #6d5dfc));
  --mi-accent-soft: var(--brand-50, var(--el-color-primary-light-9, #f6f4ff));
  --mi-accent-100: var(--brand-100, #ece9ff);
  display: flex; flex-direction: column;
  padding: 10px;
  background: var(--mi-bg);
  color: var(--mi-fg);
}

/* 卡片网格：2 列，窄屏 1 列 */
.bf-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 8px;
}
@media (max-width: 420px) {
  .bf-grid { grid-template-columns: 1fr; }
}

.bf-card {
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding: 10px;
  border: 1px solid var(--mi-line-soft);
  border-radius: var(--el-radius-lg, 12px);
  background: var(--mi-bg);
  cursor: pointer;
  transition: transform 0.15s ease, box-shadow 0.15s ease, border-color 0.15s ease, background 0.15s ease;
  opacity: 0;
  animation: bf-in 0.3s ease-out forwards;
}
.bf-card:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow-md, 0 4px 12px rgba(15, 18, 33, 0.06));
  border-color: var(--brand-300, var(--el-color-primary-light-5, #b3a9fe));
}
.bf-card-active {
  background: var(--mi-accent-soft);
  border-color: color-mix(in srgb, var(--mi-accent) 35%, transparent);
}
@keyframes bf-in {
  from { opacity: 0; transform: translateY(6px); }
  to { opacity: 1; transform: translateY(0); }
}
@media (prefers-reduced-motion: reduce) {
  .bf-card { animation: none; opacity: 1; transition: none; }
}

.bf-card-head { display: flex; align-items: center; gap: 8px; }
.bf-avatar { display: flex; flex-shrink: 0; }
.bf-id { flex: 1; min-width: 0; }
.bf-name {
  font-size: 13px; font-weight: 500;
  white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
  display: flex; align-items: center; gap: 4px;
}
.bf-fav { width: 12px; height: 12px; flex-shrink: 0; color: var(--mi-accent); }
.bf-check { color: var(--mi-accent); }
.bf-provider { font-size: 11px; color: var(--mi-fg3); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.bf-ctx {
  flex-shrink: 0;
  font-size: 10px;
  color: var(--mi-fg3);
  font-variant-numeric: tabular-nums;
}
.bf-desc {
  margin: 0;
  font-size: 11px;
  color: var(--mi-fg2);
  line-height: 1.4;
  display: -webkit-box;
  -webkit-line-clamp: 1;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

/* 价格胶囊（签名元素） */
.bf-pills { display: flex; gap: 6px; margin-top: auto; }
.bf-pill {
  font-size: 11px;
  font-variant-numeric: tabular-nums;
  padding: 2px 8px;
  border-radius: var(--el-radius-full, 9999px);
  background: var(--mi-accent-soft);
  color: var(--mi-accent);
  white-space: nowrap;
}
.bf-pill-out {
  background: transparent;
  border: 1px solid color-mix(in srgb, var(--mi-accent) 40%, transparent);
}

/* 悬停全量卡 */
.bf-tip {
  position: fixed;
  z-index: 3000;
  width: 252px;
  padding: 12px 14px 14px;
  background: var(--mi-bg);
  border: 1px solid var(--mi-line);
  border-radius: var(--el-radius-lg, 12px);
  box-shadow: var(--el-box-shadow-light, 0 8px 24px rgba(15, 18, 33, 0.12));
  font-size: 12px;
}
.bf-tip-head { display: flex; align-items: center; gap: 8px; }
.bf-tip-desc {
  margin: 8px 0 0;
  font-size: 11px;
  color: var(--mi-fg2);
  line-height: 1.5;
}
.bf-tip-sec { padding-top: 9px; }
.bf-tip-label { font-size: 11px; font-weight: 600; color: var(--mi-fg2); margin-bottom: 4px; }
.bf-tip-feats { display: flex; flex-wrap: wrap; gap: 4px; }
.bf-chip {
  font-size: 11px;
  padding: 1px 7px;
  border-radius: var(--el-radius-full, 9999px);
  background: var(--mi-accent-soft);
  color: var(--mi-accent);
}
.bf-tip-mod { display: flex; flex-direction: column; gap: 2px; }
.bf-mod-line { display: flex; align-items: center; gap: 6px; color: var(--mi-fg2); flex-wrap: wrap; }
.bf-mod {
  font-style: normal;
  font-size: 11px;
  padding: 0 6px;
  border-radius: var(--el-radius-full, 9999px);
  border: 1px solid var(--mi-line);
}
.bf-mod-text { color: var(--mi-accent); border-color: color-mix(in srgb, var(--mi-accent) 40%, transparent); }
.bf-mod-image { color: var(--el-color-warning, #f59e0b); border-color: color-mix(in srgb, var(--el-color-warning, #f59e0b) 40%, transparent); }
.bf-mod-audio { color: var(--el-color-info, #0ea5e9); border-color: color-mix(in srgb, var(--el-color-info, #0ea5e9) 40%, transparent); }
.bf-mod-video { color: var(--el-color-danger, #f04a5d); border-color: color-mix(in srgb, var(--el-color-danger, #f04a5d) 40%, transparent); }
.bf-mod-file { color: var(--el-color-info, #0ea5e9); border-color: color-mix(in srgb, var(--el-color-info, #0ea5e9) 40%, transparent); }
.bf-tip-row {
  display: flex; justify-content: space-between;
  font-size: 12px;
  color: var(--mi-fg2);
  padding: 1px 0;
}
.bf-tip-row b { font-weight: 500; color: var(--mi-fg); font-variant-numeric: tabular-nums; }
</style>











