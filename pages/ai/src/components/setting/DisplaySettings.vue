<template>
  <SettingsCard>
    <SettingsRow
      :title="t('settings.display.askPanelWidth.title')"
      :desc="t('settings.display.askPanelWidth.desc')"
    >
      <SegmentedToggle
        :model-value="askWidth"
        :options="widthOptions"
        @update:model-value="onAskWidthChange"
      />
    </SettingsRow>

    <!-- 布局预览：把「窄屏 / 满屏」两种形态画出来，切换前就能看见效果 -->
    <div class="display-preview">
      <div class="display-preview__label">
        {{ t('settings.display.askPanelWidth.preview') }}
      </div>
      <div
        class="display-preview__stage"
        :class="{ 'is-full': askWidth === 'full' }"
        aria-hidden="true"
      >
        <div class="display-preview__docs">
          <i /><i /><i /><i /><i /><i />
        </div>
        <div class="display-preview__ask">
          <i class="display-preview__ask-dot" />
          <i /><i /><i />
        </div>
      </div>
      <p class="display-preview__hint">{{ previewHint }}</p>
    </div>
  </SettingsCard>
</template>

<script setup lang="ts">
/**
 * 显示设置面板（常规组，所有登录用户可用）。
 *
 * <p><b>当前唯一配置项</b>：知识库详情页右侧问答栏宽度。
 * narrow = 舒适阅读宽度（约 400px）；full = 问答栏撑满剩余空间。
 *
 * <p><b>持久化</b>：走 appearance 分组的按用户覆盖层（origin=USER），
 * 零后端改动、跨设备同步。读失败一律回落 narrow —— 与重构前的默认行为一致，
 * 不因为配置读不到就改变用户的既有观感。
 *
 * <p><b>视觉</b>：表单外壳由 kb-refactor.css 的 kb-form 系列统一；
 * 本组件只负责布局预览那一小块自有样式。
 */
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { ElMessage } from 'element-plus'
import SettingsCard from './SettingsCard.vue'
import SettingsRow from './SettingsRow.vue'
import SegmentedToggle from '../ui/SegmentedToggle.vue'
import { useKbDisplay } from '@/composables/useKbDisplay'

const { t } = useI18n()
const { askWidth, setKbAskWidth } = useKbDisplay()

const widthOptions = computed(() => [
  { label: t('settings.display.askPanelWidth.narrow'), value: 'narrow' },
  { label: t('settings.display.askPanelWidth.full'), value: 'full' },
])

const previewHint = computed(() =>
  askWidth.value === 'full'
    ? t('settings.display.askPanelWidth.hintFull')
    : t('settings.display.askPanelWidth.hintNarrow')
)

/**
 * 切换问答栏宽度。
 *
 * <p>本地先生效（store 是单例，页面通过 data-kb-ask 立刻响应），落库失败不阻塞 UI：
 * 用户已经看到效果了，为一次网络抖动回滚反而更糟。此时只提示一次。
 */
async function onAskWidthChange(v: 'narrow' | 'full') {
  const ok = await setKbAskWidth(v)
  if (!ok) {
    ElMessage.warning(t('settings.display.askPanelWidth.saveFailed'))
  }
}
</script>

<style scoped>
.display-preview {
  margin-top: 4px;
  padding: 14px 16px;
  border: 1px solid var(--kb-rule, #e6edf7);
  border-radius: 10px;
  background: var(--kb-surface-2, #fbfcfe);
}

.display-preview__label {
  font-size: 12px;
  color: var(--kb-ink-3, #8494ad);
  margin-bottom: 10px;
}

.display-preview__stage {
  display: flex;
  gap: 10px;
  height: 92px;
  transition: gap 280ms cubic-bezier(0.16, 1, 0.3, 1);
}

/* 文档列：窄屏时占大部分，满屏时被压缩 —— 两态差别一眼可见 */
.display-preview__docs {
  flex: 1 1 56%;
  min-width: 0;
  border: 1px solid var(--kb-rule, #e6edf7);
  border-radius: 8px;
  background: var(--kb-surface, #fff);
  padding: 10px;
  display: flex;
  flex-direction: column;
  gap: 7px;
  transition: flex-basis 280ms cubic-bezier(0.16, 1, 0.3, 1);
}

.display-preview__docs i {
  display: block;
  height: 7px;
  border-radius: 3px;
  background: color-mix(in srgb, var(--kb-ink-3, #8494ad) 18%, transparent);
}

.display-preview__docs i:nth-child(2) { width: 82%; }
.display-preview__docs i:nth-child(3) { width: 91%; }
.display-preview__docs i:nth-child(4) { width: 68%; }
.display-preview__docs i:nth-child(5) { width: 86%; }
.display-preview__docs i:nth-child(6) { width: 55%; }

/* 问答栏：窄屏固定窄条，满屏吃掉剩余宽度 */
.display-preview__ask {
  flex: 0 0 34%;
  min-width: 0;
  border: 1px solid var(--kb-rule, #e6edf7);
  border-radius: 8px;
  background: var(--kb-surface, #fff);
  padding: 10px;
  display: flex;
  flex-direction: column;
  gap: 7px;
  position: relative;
  transition: flex-basis 280ms cubic-bezier(0.16, 1, 0.3, 1);
}

.display-preview__ask i {
  display: block;
  height: 7px;
  border-radius: 3px;
  background: color-mix(in srgb, var(--kb-ink-3, #8494ad) 14%, transparent);
}

.display-preview__ask i:nth-child(2) { width: 74%; }
.display-preview__ask i:nth-child(3) { width: 58%; }

/* 强调色圆点：标记这一列是「问答栏」，两态都在同一位置 */
.display-preview__ask-dot {
  position: absolute;
  top: 10px;
  right: 10px;
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: var(--kb-accent, var(--el-color-primary, #2563eb));
}

.display-preview__stage.is-full {
  gap: 8px;
}

.display-preview__stage.is-full .display-preview__docs {
  flex: 1 1 40%;
}

.display-preview__stage.is-full .display-preview__ask {
  flex: 1 1 60%;
}

.display-preview__hint {
  margin: 10px 0 0;
  font-size: 12px;
  line-height: 1.6;
  color: var(--kb-ink-2, #475569);
}

@media (prefers-reduced-motion: reduce) {
  .display-preview__stage,
  .display-preview__docs,
  .display-preview__ask {
    transition: none;
  }
}

@media (max-width: 720px) {
  .display-preview__stage { height: 78px; }
}
</style>