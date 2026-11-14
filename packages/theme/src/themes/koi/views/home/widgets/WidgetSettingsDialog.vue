<template>
  <ReDialog
    :model-value="visible"
    :title="'「' + widget.title + '」设置'"
    width="680px"
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

        <div class="ws__two-col">
          <div class="ws__field">
            <label class="ws__label">标题</label>
            <el-input v-model="form.title" maxlength="20" placeholder="widget 显示标题" clearable style="flex: 1" />
          </div>

          <div class="ws__field">
            <label class="ws__label">显示标题</label>
            <el-switch v-model="form.showTitle" />
          </div>

          <div class="ws__field">
            <label class="ws__label">阴影</label>
            <ReRadioGroup v-model="form.shadow" class="ws__feature-group">
              <ReRadioButton v-for="opt in WIDGET_SHADOW_OPTIONS" :key="opt.value" :label="opt.value">
                <span class="ws__shadow-preview" :style="{ boxShadow: WIDGET_SHADOW_MAP[opt.value] }" />
                <span>{{ opt.label }}</span>
              </ReRadioButton>
            </ReRadioGroup>
          </div>

          <div class="ws__field">
            <label class="ws__label">圆角</label>
            <el-slider v-model="form.borderRadius" :min="0" :max="24" :step="2" style="flex: 1" />
          </div>

          <div class="ws__field">
            <label class="ws__label">滚动方向</label>
            <ReRadioGroup v-model="scrollDir" class="ws__feature-group">
              <ReRadioButton v-for="opt in WIDGET_SCROLL_OPTIONS" :key="opt.value" :label="opt.value">
                <span class="ws__scroll-icon">{{ opt.icon }}</span>
                <span>{{ opt.label }}</span>
              </ReRadioButton>
            </ReRadioGroup>
          </div>

          <div class="ws__field">
            <label class="ws__label">背景</label>
            <ReRadioGroup v-model="form.background" class="ws__feature-group">
              <ReRadioButton v-for="opt in WIDGET_BACKGROUND_OPTIONS" :key="opt.value" :label="opt.value">
                <span class="ws__background-preview" :style="{ background: opt.preview }" />
                <span>{{ opt.label }}</span>
              </ReRadioButton>
            </ReRadioGroup>
          </div>

          <div class="ws__field">
            <label class="ws__label">自由颜色</label>
            <el-color-picker v-model="form.backgroundColor" :disabled="form.background !== 'custom'" />
            <span class="ws__hint-text">设为自由颜色后生效</span>
          </div>

          <div class="ws__field">
            <label class="ws__label">刷新图标</label>
            <el-switch v-model="form.showRefresh" />
            <span class="ws__hint-text">标题栏右侧的刷新按钮，默认开启</span>
          </div>

          <div class="ws__field ws__field--column">
            <label class="ws__label ws__label--top">附加样式</label>
            <el-input
              v-model="form.customStyle"
              type="textarea"
              :rows="3"
              placeholder="--my-color: #e6a23c; --my-fg: #333"
              maxlength="120"
              show-word-limit
            />
            <span class="ws__hint-text">原样注入 widget 根节点，每个 widget 可管理自己的样式</span>
          </div>

          <div class="ws__field ws__field--column">
            <label class="ws__label ws__label--top">附加 class</label>
            <el-input v-model="form.customStyleClass" maxlength="120" show-word-limit placeholder="my-widget, other-widget" />
            <span class="ws__hint-text">为 widget 根节点追加 class，内容可写自己的样式</span>
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
          <ReRadioGroup v-model="customHeightMode">
            <ReRadio value="fill">自适应铺满</ReRadio>
            <ReRadio value="fixed">固定高度</ReRadio>
          </ReRadioGroup>
        </div>
        <div class="ws__field" v-if="customHeightMode === 'fixed'">
          <label class="ws__label">固定高度</label>
          <el-input-number v-model="customFixedHeight" :min="120" :max="2000" :step="20" controls-position="right" />
          <span class="ws__unit">px</span>
        </div>
        <div class="ws__field">
          <label class="ws__label">滚动条</label>
          <ReRadioGroup v-model="customScrolling">
            <ReRadio value="auto">自动</ReRadio>
            <ReRadio value="yes">始终显示</ReRadio>
            <ReRadio value="no">禁用</ReRadio>
          </ReRadioGroup>
        </div>
      </div>

      <!-- 日历特有配置 -->
      <div v-if="widget.type === 'calendar'" class="ws__section">
        <div class="ws__section-title">格内显示</div>
        <div class="ws__field ws__field--column">
          <label class="ws__label ws__label--top">显示密度</label>
          <ReRadioGroup v-model="calendarCellMode" class="ws__mode-group">
            <ReRadio v-for="opt in CALENDAR_CELL_MODE_OPTIONS" :key="opt.value" :value="opt.value">
              {{ opt.label }}
            </ReRadio>
          </ReRadioGroup>
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
  </ReDialog>
</template>

<script setup lang="ts" name="WidgetSettingsDialog">
import { computed, reactive, ref, watch } from "vue";
import { InfoFilled } from "@element-plus/icons-vue";
import {
  CALENDAR_CELL_MODE_OPTIONS,
  WIDGET_BACKGROUND_OPTIONS,
  WIDGET_SCROLL_OPTIONS,
  WIDGET_SHADOW_MAP,
  WIDGET_SHADOW_OPTIONS,
  type CalendarCellMode,
  type WidgetItem,
  type WidgetScrollDir,
  type WidgetShadowLevel,
} from "../widgets";
import ReDialog from "@repo/ui/re-dialog";
import { ReRadioGroup, ReRadioButton, ReRadio } from "@repo/ui/re-kit";

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
  background: "auto" | "none" | "custom";
  backgroundColor: string;
  showRefresh: boolean;
  customStyle: string;
  customStyleClass: string;
}

const form = reactive<FormState>({
  title: "",
  shadow: "soft",
  showTitle: true,
  borderRadius: 12,
  showHorizontalScrollbar: false,
  showVerticalScrollbar: false,
  background: "auto",
  backgroundColor: "#ffffff",
  showRefresh: true,
  customStyle: "",
  customStyleClass: "",
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

const scrollDir = computed<WidgetScrollDir>({
  get: () => {
    const h = form.showHorizontalScrollbar;
    const v = form.showVerticalScrollbar;
    if (h && v) return "both";
    if (h) return "horizontal";
    if (v) return "vertical";
    return "none";
  },
  set: (dir: WidgetScrollDir) => setScrollDir(dir),
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

    const rawBackground = props.widget.appearance?.background;
    form.background =
      typeof rawBackground === "string" && rawBackground.length > 0 && rawBackground !== "auto" && rawBackground !== "none"
        ? "custom"
        : rawBackground === "none" || rawBackground === "auto"
          ? rawBackground
          : "auto";
    form.backgroundColor = rawBackground ?? "#ffffff";
    form.showRefresh = props.widget.appearance?.showRefresh ?? true;
    form.customStyle = props.widget.appearance?.style ?? "";
    form.customStyleClass = props.widget.appearance?.styleClass ?? "";

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
      background: form.background === "custom" ? form.backgroundColor : form.background,
      showRefresh: form.showRefresh,
      style: form.customStyle,
      styleClass: form.customStyleClass,
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
  gap: 20px;
}

/* 通用区：左右两列网格，每列仍是标签左（右对齐）/控件右的左右结构 */
.ws__two-col {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px 24px;
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

/* 选项组：ReRadioGroup（默认 el-segmented），选中态跟主题设置页保持一致；
   下面只保留选项内预览元素自身的排版，分段控件的外观由 el-segmented 承担 */
.ws__feature-group {
  display: flex;
  gap: 4px;
  flex: 1;
  min-width: 0;

  /* 按钮内的预览元素：默认亮色底 */
  .ws__shadow-preview,
  .ws__background-preview,
  .ws__scroll-icon {
    display: block;
  }
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
.ws__shadow-preview {
  width: 32px;
  height: 20px;
  border-radius: 4px;
  background: var(--el-fill-color-light);
  transition: box-shadow var(--el-transition-duration, 0.2s);
}

/* 滚动方向选择器 */
.ws__scroll-icon {
  font-size: 18px;
  line-height: 1;
}

/* 背景选择器 */
.ws__background-preview {
  width: 24px;
  height: 24px;
  border-radius: 4px;
  border: 1px solid var(--el-border-color-light);
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