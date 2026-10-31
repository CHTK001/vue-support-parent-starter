<script setup lang="ts">
import { nextTick, onBeforeUnmount, onMounted, ref, watch } from "vue";
import { computePopStyle, type HoverPopStyle } from "../utils/hoverPop";
import type { Idiom } from "../api/types";

/**
 * IdiomHoverPreview —— 成语行悬停预览浮层。
 *
 * <p>Teleport 到 body 后用 fixed 定位，跟随当前行「成语」单元格，
 * 避免被表格容器的 overflow 裁剪。展示行内已有字段的紧凑版，
 * 释义/例句等长文本按行数截断。</p>
 */
defineOptions({ name: "IdiomHoverPreview" });

const props = withDefaults(
  defineProps<{
    visible: boolean;
    anchor: HTMLElement | null;
    row: Idiom | null;
    /** 难度徽标文本（由父级用与列表一致的函数计算） */
    diffText?: string;
    diffClass?: string;
  }>(),
  {
    anchor: null,
    row: null,
    diffText: "-",
    diffClass: "is-gray",
  },
);

const POP_WIDTH = 360;
const POP_HEIGHT = 234;

const rootEl = ref<HTMLDivElement | null>(null);
const style = ref<HoverPopStyle>({
  top: "-9999px",
  left: "-9999px",
  width: `${POP_WIDTH}px`,
});

const tags = () =>
  (props.row?.idiomTags ?? "")
    .split(/[,，]/)
    .map((t) => t.trim())
    .filter(Boolean);

function reposition(): void {
  if (!props.visible || !props.anchor || !rootEl.value) return;
  const height = rootEl.value.offsetHeight || POP_HEIGHT;
  style.value = computePopStyle(props.anchor, POP_WIDTH, height);
}

watch(
  () => [props.visible, props.row],
  () => {
    if (props.visible) void nextTick(reposition);
  },
);

watch(
  () => props.anchor,
  () => {
    if (props.visible) void nextTick(reposition);
  },
);

onMounted(() => {
  window.addEventListener("scroll", reposition, true);
});

onBeforeUnmount(() => {
  window.removeEventListener("scroll", reposition, true);
});
</script>

<template>
  <Teleport to="body">
    <div
      v-if="visible && anchor && row"
      ref="rootEl"
      class="ihp"
      :style="style"
    >
      <div class="ihp__head">
        <span class="ihp__word">{{ row.idiomContent }}</span>
        <span class="tag-pill" :class="diffClass">{{ diffText }}</span>
      </div>
      <div class="ihp__pinyin">{{ row.idiomPinyin || "—" }}</div>

      <div v-if="row.idiomMeaning" class="ihp__line">
        <span class="ihp__label">释义</span>
        <span class="ihp__text">{{ row.idiomMeaning }}</span>
      </div>
      <div v-if="row.idiomSource" class="ihp__line">
        <span class="ihp__label">出处</span>
        <span class="ihp__text">{{ row.idiomSource }}</span>
      </div>
      <div v-if="row.idiomExample" class="ihp__line">
        <span class="ihp__label">例句</span>
        <span class="ihp__text">{{ row.idiomExample }}</span>
      </div>

      <div class="ihp__meta">
        <span v-for="lv in row.gradeLevels ?? []" :key="lv" class="ihp__chip">{{ lv }}</span>
        <span v-for="g in row.grades ?? []" :key="g" class="ihp__chip">{{ g }}</span>
        <span v-for="t in tags()" :key="t" class="ihp__chip ihp__chip--tag">{{ t }}</span>
        <span v-if="row.idiomSynonyms" class="ihp__chip ihp__chip--tag">近:{{ row.idiomSynonyms }}</span>
        <span v-if="row.idiomAntonyms" class="ihp__chip ihp__chip--tag">反:{{ row.idiomAntonyms }}</span>
      </div>
    </div>
  </Teleport>
</template>

<style scoped>
.ihp {
  position: fixed;
  z-index: 2100;
  pointer-events: none;
  box-sizing: border-box;
  padding: 12px 14px;
  background: var(--el-bg-color-overlay);
  border: 1px solid var(--el-border-color-light);
  border-radius: var(--el-radius-sm, 6px);
  box-shadow: var(--el-box-shadow-light);
  color: var(--el-text-color-primary);
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.ihp__head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}
.ihp__word {
  font-size: 22px;
  font-weight: 800;
  letter-spacing: 1px;
  color: var(--el-text-color-primary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.ihp__pinyin {
  font-size: 13px;
  color: var(--el-text-color-secondary);
}
.ihp__line {
  display: flex;
  gap: 8px;
  font-size: 13px;
  line-height: 1.6;
  min-width: 0;
}
.ihp__label {
  flex-shrink: 0;
  color: var(--el-text-color-secondary);
}
.ihp__text {
  color: var(--el-text-color-primary);
  word-break: break-word;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
.ihp__meta {
  display: flex;
  flex-wrap: wrap;
  gap: 5px;
  margin-top: 2px;
}
.ihp__chip {
  padding: 1px 8px;
  border-radius: 999px;
  font-size: 12px;
  color: var(--el-text-color-regular);
  background: var(--el-fill-color-light);
  white-space: nowrap;
}
.ihp__chip--tag {
  color: var(--el-color-primary);
  background: var(--el-color-primary-light-9);
}
.tag-pill {
  display: inline-flex;
  align-items: center;
  font-size: 12px;
  font-weight: 600;
  padding: 2px 9px;
  border-radius: var(--el-radius-sm, 6px);
  color: var(--el-color-white);
  white-space: nowrap;
  flex-shrink: 0;
}
.tag-pill.is-green { background: var(--el-color-success); }
.tag-pill.is-orange { background: var(--el-color-warning); }
.tag-pill.is-red { background: var(--el-color-danger); }
.tag-pill.is-gray { background: var(--el-fill-color); color: var(--el-text-color-regular); }
</style>