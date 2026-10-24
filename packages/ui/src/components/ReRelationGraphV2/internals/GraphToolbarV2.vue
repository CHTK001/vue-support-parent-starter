<script setup lang="ts">
/**
 * GraphToolbarV2 —— ReRelationGraphV2 内置工具栏（可开关）
 *
 * <p>对齐 G6 官方「自定义工具栏」示例的交互（图标 + Popover 面板），
 * 视觉上沿用本仓库既有工具区语言（ReTableToolbar：ReButton square 图标按钮 +
 * tip + ElPopover），不引入新的设计体系。</p>
 *
 * <p>四组工具：</p>
 * <ol>
 *   <li><b>布局</b>：16 个布局（分组布局 + G6 全部内置布局），图标网格单选；</li>
 *   <li><b>分组类型</b>：气泡集 bubble-sets / Hull 轮廓 / 不分组；</li>
 *   <li><b>分组开关</b>：显示或隐藏分组轮廓（保留分组配色）；</li>
 *   <li><b>布局设置</b>：按当前布局动态生成参数面板 + 分组轮廓参数，可一键重置。</li>
 * </ol>
 *
 * <p>另附「适应画布」。三种外观变体（variant）只改外框排布，不改控件语义：</p>
 * <ul>
 *   <li>{@code pill}：右上角悬浮胶囊条（默认）</li>
 *   <li>{@code card}：右上角卡片，控件竖排</li>
 *   <li>{@code rail}：左侧竖向图标轨道</li>
 * </ul>
 */
import { computed } from "vue";
import { ElPopover, ElSlider } from "element-plus";
import {
  ChatDotRound,
  Crop,
  FullScreen,
  Hide,
  Setting,
  View,
} from "@element-plus/icons-vue";
import ReButton from "../../ReButton/ReButton.vue";
import { LAYOUT_OPTIONS, type V2GroupType } from "./layouts";
import { groupSettingsOf, settingsOf, valueOf, type LayoutSettingField } from "./layoutSettings";

const props = withDefaults(
  defineProps<{
    /** 当前布局名 */
    layout?: string;
    /** 当前布局参数 */
    layoutOptions?: Record<string, unknown>;
    /** 当前分组轮廓类型 */
    groupType?: V2GroupType;
    /** 分组轮廓是否显示 */
    groupVisible?: boolean;
    /** 分组轮廓参数（padding / fillOpacity / lineWidth） */
    groupOptions?: Record<string, unknown>;
    /** 外观变体 */
    variant?: "pill" | "card" | "rail";
    /** 是否显示「适应画布」按钮 */
    fitButton?: boolean;
  }>(),
  {
    layout: "group",
    layoutOptions: () => ({}),
    groupType: "bubble",
    groupVisible: true,
    groupOptions: () => ({}),
    variant: "pill",
    fitButton: true,
  },
);

const emit = defineEmits<{
  (e: "update:layout", v: string): void;
  (e: "update:layoutOptions", v: Record<string, unknown>): void;
  (e: "update:groupType", v: V2GroupType): void;
  (e: "update:groupVisible", v: boolean): void;
  (e: "update:groupOptions", v: Record<string, unknown>): void;
  (e: "fit"): void;
}>();

/** 当前布局项（决定触发按钮的图标与文案） */
const currentLayout = computed(
  () => LAYOUT_OPTIONS.find((o) => o.value === props.layout) ?? LAYOUT_OPTIONS[0],
);

/** 布局项短名（去掉末尾的英文标识，按钮里更好排） */
const shortLabel = (label: string): string => label.replace(/\s+\S+$/, "");

/** 分组轮廓类型选项 */
const GROUP_TYPES = [
  { value: "bubble" as const, label: "气泡集", hint: "BubbleSets 云状轮廓包裹同组节点", icon: ChatDotRound },
  { value: "hull" as const, label: "Hull 轮廓", hint: "凹/凸包轮廓贴合节点集", icon: Crop },
  { value: "none" as const, label: "不分组", hint: "仅按配色区分，不画轮廓", icon: Hide },
];

/** 当前分组类型项 */
const currentGroup = computed(() => GROUP_TYPES.find((g) => g.value === props.groupType) ?? GROUP_TYPES[0]);

/** 当前布局的可调参数（分组布局走自定义那一套） */
const layoutFields = computed<LayoutSettingField[]>(() => settingsOf(props.layout));

/** 当前分组轮廓的可调参数（气泡集 / Hull 各不相同） */
const groupFields = computed<LayoutSettingField[]>(() => groupSettingsOf(props.groupType));

/** 参数显示值 */
const valOf = (field: LayoutSettingField, source: Record<string, unknown>) => valueOf(source, field);

/** 按步进格式化显示（步进 < 1 保留两位） */
const fmt = (field: LayoutSettingField, v: number): string =>
  field.step < 1 ? v.toFixed(2) : String(v);

/** 写布局参数 */
const setLayoutOption = (key: string, v: number) =>
  emit("update:layoutOptions", { ...props.layoutOptions, [key]: v });

/** 写分组轮廓参数 */
const setGroupOption = (key: string, v: number) =>
  emit("update:groupOptions", { ...props.groupOptions, [key]: v });

/** 重置布局参数 */
const resetLayoutOptions = () => emit("update:layoutOptions", {});

/** 重置分组轮廓参数 */
const resetGroupOptions = () => emit("update:groupOptions", {});

/** 是否有可重置的改动 */
const hasLayoutOverride = computed(() => Object.keys(props.layoutOptions ?? {}).length > 0);
const hasGroupOverride = computed(() => Object.keys(props.groupOptions ?? {}).length > 0);
</script>

<template>
  <div class="rrgv2-tool" :class="`rrgv2-tool--${variant}`">
    <!-- card 变体多一行小标题，明确这是「工具区」而不是普通按钮组 -->
    <div v-if="variant === 'card'" class="rrgv2-tool__caption">
      图谱工具
      <span class="rrgv2-tool__caption-sub">{{ shortLabel(currentLayout.label) }} · {{ currentGroup.label }}</span>
    </div>
    <!-- 布局 -->
    <ElPopover
      placement="bottom-end"
      trigger="click"
      :width="288"
      popper-class="rrgv2-tool__popper"
    >
      <template #reference>
        <ReButton
          data-tool="layout"
          layout="square"
          :icon="currentLayout.icon"
          :tip="`布局：${currentLayout.label}`"
        />
      </template>
      <div class="rrgv2-tool__panel">
        <div class="rrgv2-tool__panel-head">
          <span class="rrgv2-tool__panel-title">布局</span>
          <span class="rrgv2-tool__panel-sub">共 {{ LAYOUT_OPTIONS.length }} 种</span>
        </div>
        <div class="rrgv2-tool__grid">
          <button
            v-for="opt in LAYOUT_OPTIONS"
            :key="opt.value"
            type="button"
            class="rrgv2-tool__cell"
            :class="{ 'is-active': props.layout === opt.value }"
            :title="opt.hint"
            @click="emit('update:layout', opt.value)"
          >
            <el-icon :size="15"><component :is="opt.icon" /></el-icon>
            <span>{{ shortLabel(opt.label) }}</span>
          </button>
        </div>
      </div>
    </ElPopover>

    <span class="rrgv2-tool__sep" aria-hidden="true" />

    <!-- 分组类型 -->
    <ElPopover
      placement="bottom-end"
      trigger="click"
      :width="228"
      popper-class="rrgv2-tool__popper"
    >
      <template #reference>
        <ReButton
          data-tool="group-type"
          layout="square"
          :icon="currentGroup.icon"
          :tip="`分组轮廓：${currentGroup.label}`"
        />
      </template>
      <div class="rrgv2-tool__panel">
        <div class="rrgv2-tool__panel-head">
          <span class="rrgv2-tool__panel-title">分组轮廓</span>
        </div>
        <div class="rrgv2-tool__list">
          <button
            v-for="g in GROUP_TYPES"
            :key="g.value"
            type="button"
            class="rrgv2-tool__row"
            :class="{ 'is-active': props.groupType === g.value }"
            @click="emit('update:groupType', g.value)"
          >
            <el-icon :size="15"><component :is="g.icon" /></el-icon>
            <span class="rrgv2-tool__row-main">
              <span class="rrgv2-tool__row-label">{{ g.label }}</span>
              <span class="rrgv2-tool__row-hint">{{ g.hint }}</span>
            </span>
            <span v-if="props.groupType === g.value" class="rrgv2-tool__check">✓</span>
          </button>
        </div>
      </div>
    </ElPopover>

    <!-- 分组开关 -->
    <ReButton
      data-tool="group-visible"
      layout="square"
      :icon="props.groupVisible ? View : Hide"
      :type="props.groupVisible ? 'primary' : ''"
      :tip="props.groupVisible ? '隐藏分组轮廓' : '显示分组轮廓'"
      :aria-pressed="props.groupVisible"
      @click="emit('update:groupVisible', !props.groupVisible)"
    />

    <span class="rrgv2-tool__sep" aria-hidden="true" />

    <!-- 布局设置 -->
    <ElPopover
      placement="bottom-end"
      trigger="click"
      :width="268"
      popper-class="rrgv2-tool__popper"
    >
      <template #reference>
        <ReButton data-tool="layout-settings" layout="square" :icon="Setting" tip="布局设置" />
      </template>
      <div class="rrgv2-tool__panel">
        <div class="rrgv2-tool__panel-head">
          <span class="rrgv2-tool__panel-title">{{ shortLabel(currentLayout.label) }} · 参数</span>
          <button
            type="button"
            class="rrgv2-tool__reset"
            :disabled="!hasLayoutOverride"
            @click="resetLayoutOptions"
          >
            重置
          </button>
        </div>

        <template v-if="layoutFields.length">
          <div v-for="f in layoutFields" :key="f.key" class="rrgv2-tool__field">
            <div class="rrgv2-tool__field-head">
              <span class="rrgv2-tool__field-label" :title="f.hint">{{ f.label }}</span>
              <span class="rrgv2-tool__field-value">
                {{ fmt(f, valOf(f, props.layoutOptions)) }}{{ f.unit ?? "" }}
              </span>
            </div>
            <ElSlider
              :model-value="valOf(f, props.layoutOptions)"
              :min="f.min"
              :max="f.max"
              :step="f.step"
              :show-tooltip="false"
              size="small"
              @update:model-value="(v: number | number[]) => setLayoutOption(f.key, Number(v))"
            />
          </div>
        </template>
        <div v-else class="rrgv2-tool__empty">该布局没有可调参数</div>

        <template v-if="props.groupType !== 'none'">
          <div class="rrgv2-tool__panel-head rrgv2-tool__panel-head--sub">
            <span class="rrgv2-tool__panel-title">分组轮廓</span>
            <button
              type="button"
              class="rrgv2-tool__reset"
              :disabled="!hasGroupOverride"
              @click="resetGroupOptions"
            >
              重置
            </button>
          </div>
          <div v-for="f in groupFields" :key="f.key" class="rrgv2-tool__field">
            <div class="rrgv2-tool__field-head">
              <span class="rrgv2-tool__field-label" :title="f.hint">{{ f.label }}</span>
              <span class="rrgv2-tool__field-value">
                {{ fmt(f, valOf(f, props.groupOptions)) }}{{ f.unit ?? "" }}
              </span>
            </div>
            <ElSlider
              :model-value="valOf(f, props.groupOptions)"
              :min="f.min"
              :max="f.max"
              :step="f.step"
              :show-tooltip="false"
              size="small"
              @update:model-value="(v: number | number[]) => setGroupOption(f.key, Number(v))"
            />
          </div>
        </template>
      </div>
    </ElPopover>

    <!-- 适应画布 -->
    <ReButton
      v-if="fitButton"
      data-tool="fit"
      layout="square"
      :icon="FullScreen"
      tip="适应画布"
      @click="emit('fit')"
    />

    <!-- 业务自定义工具（透传 <template #toolbar-extra>） -->
    <template v-if="$slots.extra">
      <span class="rrgv2-tool__sep" aria-hidden="true" />
      <slot name="extra" />
    </template>
  </div>
</template>

<style scoped>
.rrgv2-tool {
  display: flex;
  align-items: center;
  gap: 2px;
  padding: 4px 6px;
  background: color-mix(in srgb, var(--el-bg-color, #fff) 88%, transparent);
  border: 1px solid var(--el-border-color-lighter, #e4e7ed);
  border-radius: 999px;
  box-shadow: 0 6px 20px rgba(15, 23, 42, 0.1);
  backdrop-filter: blur(8px);
}

/* 变体：卡片式 —— 带小标题的横排工具卡 */
.rrgv2-tool--card {
  flex-wrap: wrap;
  justify-content: flex-start;
  padding: 8px 8px 7px;
  border-radius: 12px;
  gap: 2px;
}
.rrgv2-tool__caption {
  flex: 0 0 100%;
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 8px;
  padding: 0 2px 5px;
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.04em;
  color: var(--el-text-color-secondary, #909399);
}
.rrgv2-tool__caption-sub {
  font-weight: 400;
  letter-spacing: 0;
}

/* 变体：左侧竖向轨道 */
.rrgv2-tool--rail {
  flex-direction: column;
  padding: 6px 4px;
  border-radius: 10px;
}
.rrgv2-tool--rail .rrgv2-tool__sep {
  width: 60%;
  height: 1px;
  margin: 4px 0;
}

.rrgv2-tool__sep {
  width: 1px;
  height: 18px;
  background: var(--el-border-color-lighter, #e4e7ed);
  margin: 0 2px;
}

/* 图标按钮：默认偏灰、悬停上色，避免在白色面板上"消失"；激活态（分组开关开）用浅色底 */
.rrgv2-tool :deep(.el-button) {
  color: var(--el-text-color-regular, #606266);
  background-color: transparent;
}
.rrgv2-tool :deep(.el-button:hover) {
  color: var(--el-color-primary, #409eff);
  background-color: var(--el-fill-color-light, #f5f7fa);
}
.rrgv2-tool :deep(.el-button.el-button--primary) {
  color: var(--el-color-primary, #409eff);
  background-color: var(--el-color-primary-light-9, #ecf5ff);
}

/* ---------- Popover 面板 ---------- */
.rrgv2-tool__panel {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.rrgv2-tool__panel-head {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 8px;
}
.rrgv2-tool__panel-head--sub {
  margin-top: 6px;
  padding-top: 8px;
  border-top: 1px dashed var(--el-border-color-lighter, #e4e7ed);
}
.rrgv2-tool__panel-title {
  font-size: 12px;
  font-weight: 700;
  color: var(--el-text-color-primary, #303133);
}
.rrgv2-tool__panel-sub {
  font-size: 11px;
  color: var(--el-text-color-secondary, #909399);
}

/* 布局网格：2 列 */
.rrgv2-tool__grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 4px;
  max-height: 300px;
  overflow-y: auto;
}

.rrgv2-tool__cell {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 5px 8px;
  font-size: 12px;
  color: var(--el-text-color-regular, #606266);
  background: transparent;
  border: 1px solid transparent;
  border-radius: 6px;
  cursor: pointer;
  text-align: left;
  transition: background 0.15s ease, border-color 0.15s ease, color 0.15s ease;
}
.rrgv2-tool__cell:hover {
  background: var(--el-fill-color-light, #f5f7fa);
  color: var(--el-color-primary, #409eff);
}
.rrgv2-tool__cell.is-active {
  background: var(--el-color-primary-light-9, #ecf5ff);
  border-color: var(--el-color-primary-light-7, #c6e2ff);
  color: var(--el-color-primary, #409eff);
  font-weight: 600;
}

/* 分组类型：整行列表 */
.rrgv2-tool__list {
  display: flex;
  flex-direction: column;
  gap: 2px;
}
.rrgv2-tool__row {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  padding: 7px 8px;
  background: transparent;
  border: 1px solid transparent;
  border-radius: 6px;
  cursor: pointer;
  text-align: left;
  transition: background 0.15s ease, border-color 0.15s ease;
}
.rrgv2-tool__row:hover {
  background: var(--el-fill-color-light, #f5f7fa);
}
.rrgv2-tool__row.is-active {
  background: var(--el-color-primary-light-9, #ecf5ff);
  border-color: var(--el-color-primary-light-7, #c6e2ff);
}
.rrgv2-tool__row-main {
  display: flex;
  flex-direction: column;
  gap: 2px;
  flex: 1;
  min-width: 0;
}
.rrgv2-tool__row-label {
  font-size: 12px;
  font-weight: 600;
  color: var(--el-text-color-primary, #303133);
}
.rrgv2-tool__row-hint {
  font-size: 11px;
  line-height: 1.4;
  color: var(--el-text-color-secondary, #909399);
}
.rrgv2-tool__check {
  font-size: 12px;
  color: var(--el-color-primary, #409eff);
}

/* 参数行 */
.rrgv2-tool__field {
  display: flex;
  flex-direction: column;
  gap: 2px;
}
.rrgv2-tool__field-head {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 8px;
}
.rrgv2-tool__field-label {
  font-size: 12px;
  color: var(--el-text-color-regular, #606266);
  cursor: help;
}
.rrgv2-tool__field-value {
  font-size: 11px;
  font-variant-numeric: tabular-nums;
  color: var(--el-text-color-secondary, #909399);
}

.rrgv2-tool__reset {
  font-size: 11px;
  color: var(--el-color-primary, #409eff);
  background: none;
  border: none;
  padding: 0;
  cursor: pointer;
}
.rrgv2-tool__reset:disabled {
  color: var(--el-text-color-placeholder, #c0c4cc);
  cursor: default;
}

.rrgv2-tool__empty {
  font-size: 12px;
  color: var(--el-text-color-secondary, #909399);
  padding: 4px 0;
}
</style>
