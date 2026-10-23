<script setup lang="ts">
/**
 * 变体 4「Aurora（极光）」：品牌渐变图标描边环 + 渐变胶囊价格。
 * 毛玻璃半透明行 + 渐变是当前行与价格标签上唯一的高饱和元素。
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

function select(m: MockModel) { selectedId.value = m.id }
function enter(m: MockModel) {
  window.clearTimeout(closeTimer)
  hoverModel.value = m
}
function leave() {
  closeTimer = window.setTimeout(() => { hoverModel.value = null }, 180)
}
</script>

<template>
  <div class="au">
    <div class="au-list">
      <div v-for="(m, i) in models" :key="m.id"
        class="au-row"
        :class="{ 'au-row-active': m.id === selectedId }"
        :style="{ animationDelay: `${i * 30}ms` }"
        @click="select(m)" @mouseenter="enter(m)" @mouseleave="leave">
        <!-- 渐变描边图标（签名元素） -->
        <div class="au-avatar-ring">
          <ModelIcon :logo="m.logo" :name="m.modelName" :size="28" radius="full" />
        </div>
        <div class="au-id">
          <div class="au-name">
            {{ m.modelName }}
            <Star24Regular class="au-fav" width="12" height="12"  v-if="m.isFavorite"  size="12" />
            <el-icon v-if="m.id === selectedId" size="13" class="au-check"><Checkmark24Regular /></el-icon>
          </div>
          <div class="au-provider">{{ m.provider }}</div>
        </div>
        <!-- 渐变胶囊：价格 + 上下文 -->
        <div class="au-pills">
          <span class="au-pill">{{ fmtPrice(m.priceIn) }}<i>/入</i></span>
          <span class="au-pill au-pill-ctx">{{ fmtContext(m.contextWindow) }}</span>
        </div>
      </div>
    </div>

    <!-- 毛玻璃信息卡 -->
    <Teleport to="body">
      <div v-if="hoverModel" class="au-tip" :style="{ left: 'calc(50% + 260px)', top: '15%' }" @mouseenter="enter(hoverModel)" @mouseleave="leave">
        <header class="au-tip-head">
          <div class="au-avatar-ring au-avatar-ring-sm">
            <ModelIcon :logo="hoverModel.logo" :name="hoverModel.modelName" :size="24" radius="full" />
          </div>
          <div class="au-id">
            <div class="au-tip-name">{{ hoverModel.modelName }}</div>
            <div class="au-provider">{{ hoverModel.provider }}</div>
          </div>
        </header>

        <section class="au-tip-sec" v-if="hoverModel.features.length">
          <div class="au-tip-label">能力</div>
          <div class="au-tip-feats">
            <span v-for="f in hoverModel.features" :key="f" class="au-chip">{{ FEAT_LABEL[f] || f }}</span>
          </div>
        </section>
        <section class="au-tip-sec">
          <div class="au-tip-label">模态</div>
          <div class="au-tip-mod">
            <span class="au-mod-line">输入 <i v-for="k in hoverModel.inputModalities" :key="'i'+k" class="au-mod" :class="'au-mod-' + k">{{ KIND_LABEL[k] || k }}</i></span>
            <span class="au-mod-line">输出 <i v-for="k in hoverModel.outputModalities" :key="'o'+k" class="au-mod" :class="'au-mod-' + k">{{ KIND_LABEL[k] || k }}</i></span>
          </div>
        </section>
        <section class="au-tip-sec">
          <div class="au-tip-label">成本（$/1M）</div>
          <div class="au-tip-row"><span>输入</span><b>{{ fmtPrice(hoverModel.priceIn) }}</b></div>
          <div class="au-tip-row"><span>输出</span><b>{{ fmtPrice(hoverModel.priceOut) }}</b></div>
          <div class="au-tip-row"><span>缓存读</span><b>{{ fmtPrice(hoverModel.priceCacheRead) }}</b></div>
          <div class="au-tip-row"><span>缓存写</span><b>{{ fmtPrice(hoverModel.priceCacheWrite) }}</b></div>
        </section>
        <section class="au-tip-sec">
          <div class="au-tip-label">限制</div>
          <div class="au-tip-row"><span>上下文</span><b>{{ fmtContext(hoverModel.contextWindow) }}</b></div>
          <div class="au-tip-row"><span>单次输出</span><b>{{ fmtContext(hoverModel.maxOutput) }}</b></div>
        </section>
        <section class="au-tip-sec">
          <div class="au-tip-label">元数据</div>
          <div class="au-tip-row"><span>知识</span><b>{{ hoverModel.knowledgeCutoff || '—' }}</b></div>
          <div class="au-tip-row"><span>发布</span><b>{{ fmtDate(hoverModel.releaseDate) }}</b></div>
        </section>
      </div>
    </Teleport>
  </div>
</template>

<style scoped>
.au {
  --mi-fg: var(--text-primary, var(--el-text-color-primary, #1f2430));
  --mi-fg2: var(--text-secondary, var(--el-text-color-secondary, #5c6270));
  --mi-fg3: var(--text-tertiary, var(--el-text-color-placeholder, #8b8f9c));
  --mi-bg: var(--bg-container, var(--el-bg-color, #fff));
  --mi-bg-hover: var(--bg-hover, var(--el-fill-color-light, #f5f7fa));
  --mi-line: var(--border-default, var(--el-border-color-lighter, #e3e6ef));
  --mi-accent: var(--brand-500, var(--el-color-primary, #6d5dfc));
  --mi-accent-400: var(--brand-400, #8f83fd);
  --mi-accent-soft: var(--brand-50, var(--el-color-primary-light-9, #f6f4ff));
  --mi-gradient: var(--brand-gradient, linear-gradient(135deg, var(--mi-accent) 0%, var(--mi-accent-400) 100%));
  display: flex; flex-direction: column;
  padding: 8px;
  background: var(--mi-bg);
  color: var(--mi-fg);
}

.au-list { display: flex; flex-direction: column; gap: 6px; }

.au-row {
  display: grid;
  grid-template-columns: 32px 1fr auto;
  gap: 10px;
  align-items: center;
  padding: 8px 10px;
  border-radius: var(--el-radius-lg, 12px);
  /* 毛玻璃行 */
  background: color-mix(in srgb, var(--mi-bg) 72%, transparent);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  border: 1px solid var(--mi-line);
  cursor: pointer;
  transition: background 0.15s, border-color 0.15s;
  opacity: 0;
  animation: au-in 0.3s ease-out forwards;
}
.au-row:hover {
  background: color-mix(in srgb, var(--mi-bg-hover) 80%, transparent);
  border-color: color-mix(in srgb, var(--mi-accent) 30%, transparent);
}
.au-row-active {
  background: var(--mi-gradient);
  border-color: transparent;
}
.au-row-active .au-name, .au-row-active .au-provider { color: var(--text-inverse, #fff); }
.au-row-active .au-pill { background: rgba(255, 255, 255, 0.22); color: var(--text-inverse, #fff); border-color: rgba(255, 255, 255, 0.4); }
.au-row-active .au-pill i { color: rgba(255, 255, 255, 0.75); }
.au-row-active .au-check { color: var(--text-inverse, #fff); }
@keyframes au-in {
  from { opacity: 0; transform: translateY(5px); }
  to { opacity: 1; transform: translateY(0); }
}
@media (prefers-reduced-motion: reduce) {
  .au-row { animation: none; opacity: 1; }
}

/* 渐变描边图标环（签名元素）：环形渐变底 + 中心挖空，内嵌 ModelIcon */
.au-avatar-ring {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 34px;
  height: 34px;
  flex-shrink: 0;
  border-radius: 50%;
  background: var(--mi-gradient);
}
.au-avatar-ring::after {
  /* 内圈挖空露出面板底色，形成 2px 渐变描边 */
  content: '';
  position: absolute;
  inset: 2px;
  border-radius: 50%;
  background: var(--mi-bg);
}
.au-avatar-ring > * {
  position: relative;
  z-index: 1;
}
.au-avatar-ring-sm { width: 30px; height: 30px; }

.au-id { min-width: 0; }
.au-name {
  font-size: 13px; font-weight: 500;
  white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
  display: flex; align-items: center; gap: 4px;
}
.au-fav { width: 12px; height: 12px; flex-shrink: 0; color: var(--mi-accent); }
.au-check { color: var(--mi-accent); }
.au-provider { font-size: 11px; color: var(--mi-fg3); }

/* 渐变胶囊 */
.au-pills { display: flex; gap: 6px; align-items: center; }
.au-pill {
  font-size: 11px;
  font-variant-numeric: tabular-nums;
  padding: 2px 9px;
  border-radius: var(--el-radius-full, 9999px);
  background: var(--mi-accent-soft);
  color: var(--mi-accent);
  border: 1px solid color-mix(in srgb, var(--mi-accent) 25%, transparent);
  white-space: nowrap;
  display: inline-flex;
  align-items: baseline;
  gap: 2px;
}
.au-pill i { font-style: normal; font-size: 10px; color: var(--mi-fg3); }
.au-pill-ctx {
  background: transparent;
  border-color: var(--mi-line);
  color: var(--mi-fg2);
}

/* 毛玻璃信息卡 */
.au-tip {
  position: fixed;
  z-index: 3000;
  width: 252px;
  padding: 12px 14px 14px;
  background: color-mix(in srgb, var(--mi-bg) 88%, transparent);
  backdrop-filter: blur(16px) saturate(150%);
  -webkit-backdrop-filter: blur(16px) saturate(150%);
  border: 1px solid var(--mi-line);
  border-radius: var(--el-radius-lg, 12px);
  box-shadow: var(--el-box-shadow-light, 0 8px 24px rgba(15, 18, 33, 0.12));
  font-size: 12px;
}
.au-tip-head { display: flex; align-items: center; gap: 8px; }
/* 标题（签名用色）。
   曾试过渐变文字（background-clip: text），但 koi 全局 `* { word-break: break-word }`
   与渐变裁切组合下实测整行不可见（2026-10-23 截图确认）——可见性是硬要求，
   故改为品牌色的实色标题 + 左侧渐变顿号，视觉重量与渐变一致但不会丢字。 */
.au-tip-name {
  font-size: 13px;
  font-weight: 600;
  color: var(--mi-accent);
  display: flex;
  align-items: center;
  gap: 6px;
}
.au-tip-name::before {
  content: '';
  width: 3px;
  height: 12px;
  flex-shrink: 0;
  border-radius: 2px;
  background: var(--mi-gradient);
}
.au-tip-sec { padding-top: 9px; }
.au-tip-label { font-size: 11px; font-weight: 600; color: var(--mi-fg2); margin-bottom: 4px; }
.au-tip-feats { display: flex; flex-wrap: wrap; gap: 4px; }
.au-chip {
  font-size: 11px;
  padding: 1px 7px;
  border-radius: var(--el-radius-full, 9999px);
  background: var(--mi-accent-soft);
  color: var(--mi-accent);
}
.au-tip-mod { display: flex; flex-direction: column; gap: 2px; }
.au-mod-line { display: flex; align-items: center; gap: 6px; color: var(--mi-fg2); flex-wrap: wrap; }
.au-mod {
  font-style: normal;
  font-size: 11px;
  padding: 0 6px;
  border-radius: var(--el-radius-full, 9999px);
  border: 1px solid var(--mi-line);
}
.au-mod-text { color: var(--mi-accent); border-color: color-mix(in srgb, var(--mi-accent) 40%, transparent); }
.au-mod-image { color: var(--el-color-warning, #f59e0b); border-color: color-mix(in srgb, var(--el-color-warning, #f59e0b) 40%, transparent); }
.au-mod-audio { color: var(--el-color-info, #0ea5e9); border-color: color-mix(in srgb, var(--el-color-info, #0ea5e9) 40%, transparent); }
.au-mod-video { color: var(--el-color-danger, #f04a5d); border-color: color-mix(in srgb, var(--el-color-danger, #f04a5d) 40%, transparent); }
.au-mod-file { color: var(--el-color-info, #0ea5e9); border-color: color-mix(in srgb, var(--el-color-info, #0ea5e9) 40%, transparent); }
.au-tip-row {
  display: flex; justify-content: space-between;
  font-size: 12px;
  color: var(--mi-fg2);
  padding: 1px 0;
}
.au-tip-row b { font-weight: 500; color: var(--mi-fg); font-variant-numeric: tabular-nums; }

/* 暗色下毛玻璃与底色跟随 koi 暗色令牌 */
html.dark .au-row { background: color-mix(in srgb, var(--bg-elevated, #222633) 72%, transparent); }
html.dark .au-tip { background: color-mix(in srgb, var(--bg-elevated, #222633) 88%, transparent); }
</style>











