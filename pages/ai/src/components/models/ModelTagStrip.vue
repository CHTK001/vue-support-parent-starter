<template>
  <span class="mts" :class="{ 'mts-inline': inline }">
    <!-- 前 N 个：图标 + tooltip（悬停出具体名称） -->
    <LTooltip v-for="tag in visibleTags" :key="tag.key" :content="tag.label" placement="top">
      <span
        class="mts-chip"
        :class="[`kind-${tag.kind || 'info'}`, { 'is-disabled': tag.disabled }]"
        role="img"
        :aria-label="tag.label"
      >
        <el-icon :size="iconSize"><component :is="tag.icon" /></el-icon>
      </span>
    </LTooltip>

    <!-- 超出部分：+N；悬停弹出 popover 列出全部具体标签 -->
    <el-popover
      v-if="hiddenTags.length"
      trigger="hover"
      placement="top"
      :width="popoverWidth"
      :show-arrow="true"
    >
      <template #reference>
        <span class="mts-chip mts-more" :aria-label="`还有 ${hiddenTags.length} 个标签`">
          +{{ hiddenTags.length }}
        </span>
      </template>

      <div class="mts-pop">
        <div
          v-for="tag in tags"
          :key="tag.key"
          class="mts-pop-row"
          :class="{ 'is-disabled': tag.disabled }"
        >
          <span class="mts-pop-icon" :class="`kind-${tag.kind || 'info'}`">
            <el-icon :size="14"><component :is="tag.icon" /></el-icon>
          </span>
          <span class="mts-pop-label">{{ tag.label }}</span>
        </div>
      </div>
    </el-popover>
  </span>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import LTooltip from '@/components/ui/LTooltip.vue'

/**
 * 标签条 —— 用「图标 + tooltip」替代纯文字标签，控制占用宽度。
 *
 * <p>为什么需要：模型管理表格的「能力」「别名」列宽度有限（`minWidth: 150`），
 * 而能力最多可选 18 项。纯文字 tag 逐个铺开时，列里要么换行撑高行、要么把
 * 表格挤出横向滚动条；名称长一点（如「超分辨率」「视觉语言」）还会互相挤压。</p>
 *
 * <p>显示规则（与需求一致）：</p>
 * <ol>
 *   <li>最多显示 {@link max} 个（默认 2）—— 图标形态，鼠标悬停出 tooltip 看名称；</li>
 *   <li>超出部分折叠成「+N」；</li>
 *   <li>悬停「+N」弹出 popover，**列出全部标签的图标 + 名称**，便于一次看全。</li>
 * </ol>
 *
 * <p>无标签时不渲染任何内容（调用方自己决定要不要显示占位符「-」）。</p>
 */
const props = withDefaults(
  defineProps<{
    /** 标签列表；label 用于 tooltip 与 popover，icon 为组件，kind 决定配色 */
    tags?: Array<{ key: string; label: string; icon: any; kind?: string; disabled?: boolean }>
    /** 最多直接显示几个，超出折叠为 +N */
    max?: number
    /** popover 宽度 */
    popoverWidth?: number
    /** 图标尺寸 */
    iconSize?: number
    /** 行内紧凑（用于表格单元格） */
    inline?: boolean
  }>(),
  {
    tags: () => [],
    max: 2,
    popoverWidth: 210,
    iconSize: 14,
    inline: true,
  },
)

const visibleTags = computed(() => props.tags.slice(0, Math.max(0, props.max)))
const hiddenTags = computed(() => props.tags.slice(Math.max(0, props.max)))
</script>

<style scoped>
.mts {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  vertical-align: middle;
}
.mts-inline {
  flex-wrap: nowrap;
}

/* 图标胶囊：与表格里的 el-tag 同视觉重量，但不占文字宽度 */
.mts-chip {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 22px;
  height: 22px;
  padding: 0 5px;
  border-radius: var(--el-radius-md, 8px);
  cursor: default;
  color: var(--el-text-color-secondary);
  background: var(--el-fill-color-light);
  border: 1px solid var(--el-border-color-lighter);
  transition: color 0.15s ease, background 0.15s ease, border-color 0.15s ease;
}
.mts-chip:hover {
  color: var(--el-color-primary);
  border-color: color-mix(in srgb, var(--el-color-primary) 45%, var(--el-border-color-lighter));
  background: color-mix(in srgb, var(--el-color-primary) 10%, transparent);
}
.mts-chip.is-disabled {
  opacity: 0.45;
}

/* 配色：按标签类别区分，与模型卡片的 cap-i.kind-* 同源语义 */
.mts-chip.kind-chat,
.mts-pop-icon.kind-chat { color: var(--el-color-primary); }
.mts-chip.kind-vision,
.mts-pop-icon.kind-vision { color: var(--el-color-warning); }
.mts-chip.kind-audio,
.mts-pop-icon.kind-audio { color: var(--el-color-info); }
.mts-chip.kind-video,
.mts-pop-icon.kind-video { color: var(--el-color-danger); }
.mts-chip.kind-vector,
.mts-pop-icon.kind-vector { color: var(--el-color-success); }
.mts-chip.kind-image,
.mts-pop-icon.kind-image { color: var(--el-color-warning); }
.mts-chip.kind-doc,
.mts-pop-icon.kind-doc { color: var(--el-color-primary); }
.mts-chip.kind-tool,
.mts-pop-icon.kind-tool { color: var(--el-color-success); }

/* +N：比图标胶囊略宽，数值可读 */
.mts-more {
  min-width: 26px;
  font-size: 11px;
  font-weight: 600;
  color: var(--el-text-color-regular);
  background: var(--el-border-color-lighter);
  border-color: var(--el-border-color);
  cursor: pointer;
}
.mts-more:hover {
  color: #fff;
  background: var(--el-color-primary);
  border-color: var(--el-color-primary);
}

/* popover 内容：图标 + 名称，一行一个 */
.mts-pop {
  display: flex;
  flex-direction: column;
  gap: 6px;
  max-height: 260px;
  overflow-y: auto;
}
.mts-pop-row {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  color: var(--el-text-color-regular);
}
.mts-pop-row.is-disabled {
  opacity: 0.45;
}
.mts-pop-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 22px;
  height: 22px;
  flex-shrink: 0;
  border-radius: var(--el-radius-md, 8px);
  background: var(--el-fill-color-light);
}
.mts-pop-label {
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
</style>