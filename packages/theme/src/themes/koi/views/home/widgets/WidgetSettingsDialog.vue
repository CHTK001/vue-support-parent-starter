<template>
  <el-dialog
    :model-value="visible"
    :title="'「' + widget.title + '」设置'"
    width="580px"
    :close-on-click-modal="false"
    @update:model-value="emit('update:visible', $event)"
    @close="handleClose"
  >
    <div class="ws">
      <!-- 预览区 -->
      <div class="ws__preview">
        <div class="ws__preview-label">预览</div>
        <div class="ws__preview-card" :style="{ boxShadow: shadowCss, borderRadius: form.borderRadius + 'px' }">
          <div v-if="form.showTitle" class="ws__preview-card-header">
            <div class="ws__preview-card-dot" />
            <div class="ws__preview-card-title">{{ form.title }}</div>
          </div>
          <div class="ws__preview-card-body">
            <div class="ws__preview-card-line" />
            <div class="ws__preview-card-line ws__preview-card-line--short" />
            <div class="ws__preview-card-line" />
          </div>
        </div>
      </div>

      <!-- 通用设置 -->
      <div class="ws__section">
        <div class="ws__section-title">通用</div>
        <div class="ws__field">
          <label class="ws__label">标题</label>
          <el-input v-model="form.title" maxlength="20" placeholder="widget 显示标题" clearable />
        </div>
        <div class="ws__field">
          <label class="ws__label">显示标题</label>
          <el-switch v-model="form.showTitle" />
        </div>
        <div class="ws__field">
          <label class="ws__label">阴影</label>
          <div class="ws__shadow-options">
            <button
              v-for="opt in WIDGET_SHADOW_OPTIONS"
              :key="opt.value"
              type="button"
              class="ws__shadow-btn"
              :class="{ 'ws__shadow-btn--active': form.shadow === opt.value }"
              @click="form.shadow = opt.value"
            >
              <span class="ws__shadow-preview" :style="{ boxShadow: WIDGET_SHADOW_MAP[opt.value] }" />
              <span>{{ opt.label }}</span>
            </button>
          </div>
        </div>
        <div class="ws__field">
          <label class="ws__label">圆角</label>
          <el-slider v-model="form.borderRadius" :min="0" :max="24" :step="2" show-input style="flex:1" />
        </div>
        <div class="ws__field">
          <label class="ws__label">滚动方向</label>
          <div class="ws__scroll-options">
            <button
              v-for="opt in WIDGET_SCROLL_OPTIONS"
              :key="opt.value"
              type="button"
              class="ws__scroll-btn"
              :class="{ 'ws__scroll-btn--active': scrollDir === opt.value }"
              @click="setScrollDir(opt.value)"
            >
              <span class="ws__scroll-icon">{{ opt.icon }}</span>
              <span>{{ opt.label }}</span>
            </button>
          </div>
        </div>
      </div>

      <!-- 自定义 widget 特有配置 -->
      <div v-if="widget.type === 'custom'" class="ws__section">
        <div class="ws__section-title">嵌入页面</div>
        <div class="ws__field">
          <label class="ws__label">链接地址</label>
          <el-input v-model="customUrl" placeholder="https://example.com" clearable />
        </div>
        <div class="ws__field">
          <label class="ws__label">高度模式</label>
          <el-radio-group v-model="customHeightMode">
            <el-radio value="fill">自适应铺满</el-radio>
            <el-radio value="fixed">固定高度</el-radio>
          </el-radio-group>
        </div>
        <div class="ws__field" v-if="customHeightMode === 'fixed'">
          <label class="ws__label">固定高度</label>
          <el-input-number v-model="customFixedHeight" :min="120" :max="2000" :step="20" controls-position="right" />
          <span class="ws__unit">px</span>
        </div>
        <div class="ws__field">
          <label class="ws__label">滚动条</label>
          <el-radio-group v-model="customScrolling">
            <el-radio value="auto">自动</el-radio>
            <el-radio value="yes">始终显示</el-radio>
            <el-radio value="no">禁用</el-radio>
          </el-radio-group>
        </div>
      </div>

      <!-- 日历特有配置 -->
      <div v-if="widget.type === 'calendar'" class="ws__section">
        <div class="ws__section-title">格内显示</div>
        <div class="ws__field ws__field--column">
          <label class="ws__label ws__label--top">显示密度</label>
          <el-radio-group v-model="calendarCellMode" class="ws__mode-group">
            <el-radio v-for="opt in CALENDAR_CELL_MODE_OPTIONS" :key="opt.value" :value="opt.value">
              {{ opt.label }}
            </el-radio>
          </el-radio-group>
          <div class="ws__hint-text">{{ cellModeHint }}</div>
        </div>
        <div class="ws__field">
          <label class="ws__label">节日农历</label>
          <el-switch v-model="calendarShowFestival" />
          <span class="ws__unit">关闭后节日与农历行让给日程</span>
        </div>
        <div class="ws__field">
          <label class="ws__label">休/班标记</label>
          <el-switch v-model="calendarShowBadge" />
          <span class="ws__unit">格子右上角的「休」「班」角标</span>
        </div>
      </div>

      <!-- client-info 只读提示 -->
      <div v-if="widget.type === 'client-info'" class="ws__hint">
        <el-icon><InfoFilled /></el-icon>
        <span>客户端信息为只读组件，无需额外配置</span>
      </div>
    </div>

    <template #footer>
      <div class="ws__footer">
        <el-button @click="handleClose">取消</el-button>
        <el-button type="primary" @click="handleSave">保存</el-button>
      </div>
    </template>
  </el-dialog>
</template>

<script setup lang="ts" name="WidgetSettingsDialog">
import { computed, reactive, ref, watch } from "vue";
import { InfoFilled } from "@element-plus/icons-vue";
import {
  CALENDAR_CELL_MODE_OPTIONS,
  WIDGET_SCROLL_OPTIONS,
  WIDGET_SHADOW_MAP,
  WIDGET_SHADOW_OPTIONS,
  type CalendarCellMode,
  type WidgetItem,
  type WidgetScrollDir,
  type WidgetShadowLevel,
} from "../widgets";

const props = defineProps<{
  visible: boolean;
  widget: WidgetItem;
}>();

const emit = defineEmits<{
  (e: "update:visible", v: boolean): void;
  (e: "save", id: string, patch: Partial<WidgetItem>): void;
}>();

interface FormState {
  title: string;
  shadow: WidgetShadowLevel;
  showTitle: boolean;
  borderRadius: number;
  showHorizontalScrollbar: boolean;
  showVerticalScrollbar: boolean;
}

const form = reactive<FormState>({
  title: "",
  shadow: "soft",
  showTitle: true,
  borderRadius: 12,
  showHorizontalScrollbar: false,
  showVerticalScrollbar: false,
});

const customUrl = ref("");
const customHeightMode = ref<"fill" | "fixed">("fill");
const customFixedHeight = ref(360);
const customScrolling = ref<"auto" | "yes" | "no">("auto");

// —— 日历 ——
const calendarCellMode = ref<CalendarCellMode>("all");
const calendarShowFestival = ref(true);
const calendarShowBadge = ref(true);

/** 当前模式的说明文案（取选项表里的 hint，避免文案与行为漂移） */
const cellModeHint = computed(
  () => CALENDAR_CELL_MODE_OPTIONS.find((o) => o.value === calendarCellMode.value)?.hint ?? "",
);

const shadowCss = computed(() => WIDGET_SHADOW_MAP[form.shadow] ?? WIDGET_SHADOW_MAP.none);

const scrollDir = computed<WidgetScrollDir>(() => {
  const h = form.showHorizontalScrollbar;
  const v = form.showVerticalScrollbar;
  if (h && v) return "both";
  if (h) return "horizontal";
  if (v) return "vertical";
  return "none";
});

function setScrollDir(dir: WidgetScrollDir): void {
  form.showHorizontalScrollbar = dir === "horizontal" || dir === "both";
  form.showVerticalScrollbar = dir === "vertical" || dir === "both";
}

watch(
  () => props.visible,
  (open) => {
    if (!open) return;
    form.title = props.widget.title;
    form.shadow = props.widget.appearance?.shadow ?? "soft";
    form.showTitle = !props.widget.hideTitle;
    form.borderRadius = props.widget.appearance?.borderRadius ?? 12;
    form.showHorizontalScrollbar = props.widget.appearance?.showHorizontalScrollbar ?? false;
    form.showVerticalScrollbar = props.widget.appearance?.showVerticalScrollbar ?? false;

    if (props.widget.type === "custom" && props.widget.config) {
      customUrl.value = props.widget.config.url ?? "";
      customHeightMode.value = props.widget.config.heightMode ?? "fill";
      customFixedHeight.value = props.widget.config.fixedHeight ?? 360;
      customScrolling.value = props.widget.config.scrolling ?? "auto";
    } else {
      customUrl.value = "";
      customHeightMode.value = "fill";
      customFixedHeight.value = 360;
      customScrolling.value = "auto";
    }

    // 日历：缺省即「全部显示」，与 CalendarWidget 的解析口径一致
    calendarCellMode.value = props.widget.calendarConfig?.cellMode ?? "all";
    calendarShowFestival.value = props.widget.calendarConfig?.showFestival ?? true;
    calendarShowBadge.value = props.widget.calendarConfig?.showBadge ?? true;
  },
);

function handleClose(): void {
  emit("update:visible", false);
}

function handleSave(): void {
  const patch: Partial<WidgetItem> = {
    title: form.title,
    hideTitle: !form.showTitle,
    appearance: {
      shadow: form.shadow,
      borderRadius: form.borderRadius,
      showHorizontalScrollbar: form.showHorizontalScrollbar,
      showVerticalScrollbar: form.showVerticalScrollbar,
    },
  };

  if (props.widget.type === "custom") {
    patch.config = {
      url: customUrl.value,
      heightMode: customHeightMode.value,
      fixedHeight: customHeightMode.value === "fixed" ? customFixedHeight.value : undefined,
      scrolling: customScrolling.value,
    };
  }

  if (props.widget.type === "calendar") {
    patch.calendarConfig = {
      cellMode: calendarCellMode.value,
      showFestival: calendarShowFestival.value,
      showBadge: calendarShowBadge.value,
    };
  }

  emit("save", props.widget.id, patch);
  emit("update:visible", false);
}
</script>

<style lang="scss" scoped>
.ws {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

/* 预览区 */
.ws__preview {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.ws__preview-label {
  font-size: 12px;
  font-weight: 600;
  color: var(--el-text-color-secondary);
  text-transform: uppercase;
  letter-spacing: 0.3px;
}

.ws__preview-card {
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 8px;
  overflow: hidden;
  background: var(--el-fill-color-blank);
  transition: box-shadow var(--el-transition-duration, 0.2s);
}

.ws__preview-card-header {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 12px;
  border-bottom: 1px solid var(--el-border-color-lighter);
  background: var(--el-bg-color);
}

.ws__preview-card-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: var(--el-color-primary);
  opacity: 0.3;
}

.ws__preview-card-title {
  font-size: 13px;
  font-weight: 600;
  color: var(--el-text-color-primary);
}

.ws__preview-card-body {
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding: 12px;
}

.ws__preview-card-line {
  height: 8px;
  border-radius: 4px;
  background: var(--el-fill-color-light);
}

.ws__preview-card-line--short {
  width: 60%;
}

/* 设置区块 */
.ws__section {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.ws__section-title {
  font-size: 12px;
  font-weight: 600;
  color: var(--el-text-color-secondary);
  text-transform: uppercase;
  letter-spacing: 0.3px;
  padding-bottom: 4px;
  border-bottom: 1px solid var(--el-border-color-lighter);
}

.ws__field {
  display: flex;
  align-items: center;
  gap: 12px;
}

.ws__label {
  width: 72px;
  flex-shrink: 0;
  font-size: 13px;
  color: var(--el-text-color-primary);
  text-align: right;
}

.ws__unit {
  font-size: 12px;
  color: var(--el-text-color-secondary);
  flex-shrink: 0;
}

/* 纵向排列的字段（单选项组 + 说明） */
.ws__field--column {
  flex-direction: column;
  align-items: stretch;
  gap: 8px;
}

.ws__label--top {
  width: auto;
  text-align: left;
}

.ws__mode-group {
  flex-wrap: wrap;
}

/* 选项说明：与选项表里的 hint 同源，不另写一份文案 */
.ws__hint-text {
  padding: 8px 12px;
  font-size: 12px;
  line-height: 1.6;
  color: var(--el-text-color-secondary);
  border-radius: var(--el-radius-md, 8px);
  background: var(--el-fill-color-lighter);
}

/* 阴影选择器 */
.ws__shadow-options {
  display: flex;
  gap: 8px;
  flex: 1;
}

.ws__shadow-btn {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  flex: 1;
  padding: 12px 8px;
  border: 1px solid var(--el-border-color-light);
  border-radius: 8px;
  background: var(--el-fill-color-blank);
  cursor: pointer;
  font-size: 12px;
  color: var(--el-text-color-secondary);
  transition: border-color var(--el-transition-duration, 0.2s), background var(--el-transition-duration, 0.2s);
}

.ws__shadow-btn:hover {
  border-color: var(--el-color-primary);
  color: var(--el-color-primary);
}

.ws__shadow-btn--active {
  border-color: var(--el-color-primary);
  background: color-mix(in srgb, var(--el-color-primary) 6%, transparent);
  color: var(--el-color-primary);
  font-weight: 600;
}

.ws__shadow-preview {
  display: block;
  width: 32px;
  height: 20px;
  border-radius: 4px;
  background: var(--el-fill-color-light);
  transition: box-shadow var(--el-transition-duration, 0.2s);
}

/* 滚动方向选择器 */
.ws__scroll-options {
  display: flex;
  gap: 8px;
  flex: 1;
}

.ws__scroll-btn {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  flex: 1;
  padding: 8px 8px;
  border: 1px solid var(--el-border-color-light);
  border-radius: var(--el-radius-md, 8px);
  background: var(--el-fill-color-blank);
  cursor: pointer;
  font-size: 12px;
  color: var(--el-text-color-secondary);
  transition: border-color var(--el-transition-duration, 0.2s), background var(--el-transition-duration, 0.2s);
}

.ws__scroll-btn:hover {
  border-color: var(--el-color-primary);
  color: var(--el-color-primary);
}

.ws__scroll-btn--active {
  border-color: var(--el-color-primary);
  background: color-mix(in srgb, var(--el-color-primary) 6%, transparent);
  color: var(--el-color-primary);
  font-weight: 600;
}

.ws__scroll-icon {
  font-size: 18px;
  line-height: 1;
}

/* 提示 */
.ws__hint {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 10px 14px;
  background: var(--el-color-info-light-9);
  border-radius: 8px;
  font-size: 13px;
  color: var(--el-text-color-secondary);
}

/* 底部 */
.ws__footer {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
}
</style>