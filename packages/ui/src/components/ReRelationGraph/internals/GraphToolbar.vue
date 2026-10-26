<script setup lang="ts">
/**
 * GraphToolbar —— ReRelationGraph 内置工具栏（可开关）
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
import { computed, ref } from "vue";
import { ElOption, ElPopover, ElSelect, ElSlider, ElSwitch } from "element-plus";
import { isGroupLayout } from "./layouts";
import {
  ChatDotRound,
  Crop,
  Expand,
  Fold,
  FullScreen,
  Hide,
  Menu,
  Operation,
  Pointer,
  Position,
  RefreshLeft,
  RefreshRight,
  Setting,
  Share,
  Sunny,
  View,
} from "@element-plus/icons-vue";
import ReButton from "../../ReButton/ReButton.vue";
import { LAYOUT_OPTIONS, type GroupType } from "./layouts";
import {
  groupSettingsOf,
  numberOf,
  settingsOf,
  valueOf,
  type LayoutSettingField,
} from "./layoutSettings";

const props = withDefaults(
  defineProps<{
    /** 当前布局名 */
    layout?: string;
    /** 当前布局参数 */
    layoutOptions?: Record<string, unknown>;
    /** 当前分组轮廓类型 */
    groupType?: GroupType;
    /** 分组轮廓是否显示 */
    groupVisible?: boolean;
    /** 分组轮廓参数（padding / fillOpacity / lineWidth） */
    groupOptions?: Record<string, unknown>;
    /** 是否因「非分组布局 + groupAutoHide」而自动隐藏了分组轮廓 */
    groupAutoHidden?: boolean;
    /** 外观变体 */
    variant?: "pill" | "card" | "rail";
    /** 是否显示「适应画布」按钮 */
    fitButton?: boolean;
    /** 是否可折叠（折叠后只留一个圆形展开按钮） */
    collapsible?: boolean;
    /* ---- 交互开关的当前值（「视图与交互」面板用） ---- */
    /** 点选 */
    clickSelect?: boolean;
    /** 框选 */
    brushSelect?: boolean;
    /** 悬停高亮 */
    highlight?: boolean;
    /** 小地图 */
    minimap?: boolean;
    /** 节点悬浮提示 */
    nodeTooltip?: boolean;
    /** 边悬浮提示 */
    edgeTooltip?: boolean;
    /** tooltip 总开关（关掉时上面两个开关整体视为关闭） */
    tooltip?: boolean;
    /** 分组折叠（combo） */
    combo?: boolean;
    /** 当前已折叠的分组名列表（面板里显示折叠状态） */
    collapsedGroups?: string[];
    /** 停靠位置（决定折叠按钮在左端还是右端） */
    position?: "top-left" | "top-right" | "bottom-left" | "bottom-right" | "left" | "right";
    /** 节点候选 id（保留给业务自定义面板用） */
    pathNodes?: string[];
    /** 最短路径：起点 */
    pathFrom?: string;
    /** 最短路径：终点 */
    pathTo?: string;
    /** 是否正处在「只显示路径」模式 */
    pathActive?: boolean;
    /** 「最短路径」选择模式是否开启（左键点两个节点定起终点） */
    pathPicking?: boolean;
    /** 最近一次最短路径结果文字 */
    pathInfo?: string;
    /** 全部分组名（分组折叠面板用） */
    groups?: string[];
    /* ---- 编辑历史（撤销 / 重做） ---- */
    /** 是否显示撤销 / 重做按钮 */
    history?: boolean;
    /** 当前能否撤销 */
    canUndo?: boolean;
    /** 当前能否重做 */
    canRedo?: boolean;
  }>(),
  {
    layout: "group",
    layoutOptions: () => ({}),
    groupType: "bubble",
    groupVisible: true,
    groupOptions: () => ({}),
    groupAutoHidden: false,
    variant: "pill",
    fitButton: true,
    collapsible: true,
    clickSelect: false,
    brushSelect: false,
    highlight: true,
    minimap: false,
    tooltip: true,
    nodeTooltip: true,
    edgeTooltip: true,
    combo: false,
    collapsedGroups: () => [],
    position: "top-right",
    pathNodes: () => [],
    pathFrom: "",
    pathTo: "",
    pathActive: false,
    pathPicking: false,
    pathInfo: "",
    groups: () => [],
    history: false,
    canUndo: false,
    canRedo: false,
  },
);

const emit = defineEmits<{
  (e: "update:layout", v: string): void;
  (e: "update:layoutOptions", v: Record<string, unknown>): void;
  (e: "update:groupType", v: GroupType): void;
  (e: "update:groupVisible", v: boolean): void;
  (e: "update:groupOptions", v: Record<string, unknown>): void;
  (e: "update:clickSelect", v: boolean): void;
  (e: "update:brushSelect", v: boolean): void;
  (e: "update:highlight", v: boolean): void;
  (e: "update:minimap", v: boolean): void;
  (e: "update:tooltip", v: boolean): void;
  (e: "update:nodeTooltip", v: boolean): void;
  (e: "update:edgeTooltip", v: boolean): void;
  (e: "update:combo", v: boolean): void;
  /** 折叠 / 展开某个分组 */
  (e: "toggle-group", group: string): void;
  /** 面板里选起点 */
  (e: "update:pathFrom", v: string): void;
  /** 面板里选终点 */
  (e: "update:pathTo", v: string): void;
  /** 最短路径按钮：未激活时算路径，激活时退出路径模式 */
  (e: "path-toggle"): void;
  /** 按当前起终点算最短路径（业务自定义面板用） */
  (e: "path-run"): void;
  /** 退出路径模式（恢复全部元素） */
  (e: "path-clear"): void;
  /** 撤销一步 */
  (e: "undo"): void;
  /** 重做一步 */
  (e: "redo"): void;
  (e: "fit"): void;
}>();

/** 当前布局项（决定触发按钮的图标与文案） */
const currentLayout = computed(
  () => LAYOUT_OPTIONS.find((o) => o.value === props.layout) ?? LAYOUT_OPTIONS[0],
);

/**
 * 最短路径按钮的提示文字。
 *
 * <p>按钮只有一个，语义随状态变：未激活时点它是「按已指定的起终点算」，
 * 激活时点它是「退出、显示全部」。所以提示也得跟着说清楚下一步该做什么。</p>
 */
const pathTip = computed(() => {
  if (props.pathPicking) {
    if (props.pathFrom) return `已设起点「${props.pathFrom}」，再左键点一个节点作终点（右键取消）`;
    return "最短路径：左键点起点，再点终点；右键取消";
  }
  if (props.pathActive) return "正在只看路径（点一下恢复全部）";
  return "最短路径：开启后左键点两个节点（起点 → 终点）";
});

/** 折叠状态：折叠后整条工具栏缩成一个按钮，把画布让出来 */
const collapsed = ref(false);
const toggleCollapsed = () => {
  collapsed.value = !collapsed.value;
};

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

/**
 * 分组轮廓参数是否该出现在面板里。
 *
 * <p>散布局（force / circular / grid …）下各组节点互相穿插，轮廓要么被自动隐藏、
 * 要么圈住别组节点 —— 这时把「轮廓外扩 / 凹度」摆出来只会让人调了半天没反应。
 * 所以只在「分组布局 + 轮廓开着 + 没走 combo」时才显示这一节。</p>
 */
const showGroupSettings = computed(
  () => props.groupType !== "none" && isGroupLayout(props.layout) && !props.groupAutoHidden,
);

/** 当前分组轮廓的可调参数（气泡集 / Hull 各不相同） */
const groupFields = computed<LayoutSettingField[]>(() => groupSettingsOf(props.groupType));

/** 参数显示值（滑杆 / 下拉 / 开关共用一套读取规则） */
const valOf = (field: LayoutSettingField, source: Record<string, unknown>) => valueOf(source, field);

/** 滑杆显示值 */
const numOf = (field: LayoutSettingField, source: Record<string, unknown>) => numberOf(source, field);

/** 下拉类字段的显示文案（把 `TB` 这类内部值翻成「从上到下 TB」，空值显示「自动」） */
const selectTextOf = (field: LayoutSettingField, v: string): string => {
  if (v === "") return "自动";
  const hit = optionsOf(field).find((o) => o.value === v);
  return hit ? hit.label : v;
};

/** 按步进格式化显示（步进 < 1 保留两位） */
const fmt = (field: LayoutSettingField, v: number | string | boolean): string => {
  if (typeof v === "boolean") return v ? "开" : "关";
  if (typeof v === "string") return v;
  if (field.zeroAsAuto && v === 0) return "自动";
  return (field.step ?? 1) < 1 ? v.toFixed(2) : String(v);
};

/** 下拉选项。 */
const optionsOf = (field: LayoutSettingField) => {
  if (field.fromNodes) {
    return [{ label: "自动", value: "" }, ...props.pathNodes.map((id) => ({ label: id, value: id }))];
  }
  return field.options ?? [];
};

/** 面板右侧的「当前值」文案：下拉翻成中文、开关显示开/关、数值带单位 */
const displayOf = (field: LayoutSettingField, source: Record<string, unknown>): string => {
  const v = valueOf(source, field);
  if (field.kind === "select") return selectTextOf(field, String(v));
  if (field.kind === "switch") return v === true ? "开" : "关";
  if (field.zeroAsAuto && Number(v) === 0) return "自动";
  return `${fmt(field, v)}${field.unit ?? ""}`;
};

/** 写布局参数（按控件种类转成对应类型） */
const setLayoutOption = (key: string, v: number | string | boolean) =>
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

/**
 * 「视图与交互」面板的开关清单。
 *
 * <p>这 6 个都是 G6 的 behavior / plugin 级开关，改一个就要重建 Graph，
 * 所以统一收进一个面板，避免工具栏上一排按钮越堆越长。</p>
 */
const VIEW_SWITCHES = [
  {
    key: "clickSelect",
    label: "点选",
    hint: "单击节点 / 边选中（Shift 可多选）",
    icon: Pointer,
    value: () => props.clickSelect,
  },
  {
    key: "brushSelect",
    label: "框选",
    hint: "空白处拖拽拉框多选（开启后拖拽=框选）",
    icon: Crop,
    value: () => props.brushSelect,
  },
  {
    key: "highlight",
    label: "悬停高亮",
    hint: "悬停节点高亮 1 度邻居，其余淡化",
    icon: Sunny,
    value: () => props.highlight,
  },
  {
    key: "nodeTooltip",
    label: "节点提示",
    hint: "悬停节点显示 tooltip（可用 #node-tooltip 插槽换内容）",
    icon: ChatDotRound,
    value: () => props.tooltip && props.nodeTooltip,
  },
  {
    key: "edgeTooltip",
    label: "边提示",
    hint: "悬停边显示 tooltip（可用 #edge-tooltip 插槽换内容）",
    icon: Share,
    value: () => props.tooltip && props.edgeTooltip,
  },
  {
    key: "minimap",
    label: "小地图",
    hint: "右下角缩略图，点击可快速定位",
    icon: Position,
    value: () => props.minimap,
  },
  {
    key: "combo",
    label: "分组折叠",
    hint: "每个势力画成 combo，点它折叠 / 展开",
    icon: Menu,
    value: () => props.combo,
  },
] as const;

/** 已开启的开关数量（面板标题右侧显示） */
const viewSwitchCount = computed(() => VIEW_SWITCHES.filter((s) => s.value()).length);

/** 开关是否全部开启（图标按钮的高亮态） */
const viewAnyOn = computed(() => viewSwitchCount.value > 0);

/** 写开关（父组件用 v-model:xxx 时可回传） */
const setViewSwitch = (key: string, value: boolean) => {
  emit(`update:${key}` as never, value as never);
};

/**
 * 工具栏停靠在左半边时，折叠按钮要放在最左；停靠在右边时放最右。
 * （用户反馈：左边停靠时「收起」却在右端，反直觉）
 */
const dockLeft = computed(() => props.position.includes("left"));
</script>

<template>
  <div
    class="rrg-tool"
    :class="[`rrg-tool--${variant}`, { 'is-collapsed': collapsed, 'is-dock-left': dockLeft }]"
  >
    <!-- 折叠态：只留一个圆形按钮，点开恢复整条工具栏 -->
    <ReButton
      v-if="collapsed"
      data-tool="expand"
      layout="square"
      :icon="Expand"
      :tip="`展开工具栏（当前布局：${shortLabel(currentLayout.label)}）`"
      @click="toggleCollapsed"
    />
    <template v-else>
      <!-- card 变体多一行小标题，明确这是「工具区」而不是普通按钮组 -->
      <div v-if="variant === 'card'" class="rrg-tool__caption">
        图谱工具
        <span class="rrg-tool__caption-sub">{{ shortLabel(currentLayout.label) }} · {{ currentGroup.label }}</span>
      </div>
      <!-- 编辑：撤销 / 重做（只有开了 history 才出现；无历史时按钮置灰） -->
      <template v-if="history">
        <ReButton
          data-tool="undo"
          layout="square"
          :icon="RefreshLeft"
          :disabled="!canUndo"
          tip="撤销（Ctrl+Z）"
          @click="emit('undo')"
        />
        <ReButton
          data-tool="redo"
          layout="square"
          :icon="RefreshRight"
          :disabled="!canRedo"
          tip="重做（Ctrl+Shift+Z）"
          @click="emit('redo')"
        />
        <span class="rrg-tool__sep" aria-hidden="true" />
      </template>

      <!-- 布局 -->
    <ElPopover
      placement="bottom-end"
      trigger="click"
      :width="288"
      popper-class="rrg-tool__popper"
    >
      <template #reference>
        <ReButton
          data-tool="layout"
          layout="square"
          :icon="currentLayout.icon"
          :tip="`布局：${currentLayout.label}`"
        />
      </template>
      <div class="rrg-tool__panel">
        <div class="rrg-tool__panel-head">
          <span class="rrg-tool__panel-title">布局</span>
          <span class="rrg-tool__panel-sub">共 {{ LAYOUT_OPTIONS.length }} 种</span>
        </div>
        <div class="rrg-tool__grid">
          <button
            v-for="opt in LAYOUT_OPTIONS"
            :key="opt.value"
            type="button"
            class="rrg-tool__cell"
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

    <span class="rrg-tool__sep" aria-hidden="true" />

    <!-- 分组类型 -->
    <ElPopover
      placement="bottom-end"
      trigger="click"
      :width="228"
      popper-class="rrg-tool__popper"
    >
      <template #reference>
        <ReButton
          data-tool="group-type"
          layout="square"
          :icon="currentGroup.icon"
          :tip="`分组轮廓：${currentGroup.label}`"
        />
      </template>
      <div class="rrg-tool__panel">
        <div class="rrg-tool__panel-head">
          <span class="rrg-tool__panel-title">分组轮廓</span>
        </div>
        <!-- 非分组布局下轮廓会自动隐藏，这里说明原因，免得以为坏了 -->
        <div v-if="groupAutoHidden" class="rrg-tool__note">
          当前「{{ shortLabel(currentLayout.label) }}」是散布局，各组节点互相穿插，
          轮廓会彼此重叠，已自动隐藏轮廓（节点仍按势力配色）。切回「分组布局」即可显示。
        </div>
        <div class="rrg-tool__list">
          <button
            v-for="g in GROUP_TYPES"
            :key="g.value"
            type="button"
            class="rrg-tool__row"
            :class="{ 'is-active': props.groupType === g.value }"
            @click="emit('update:groupType', g.value)"
          >
            <el-icon :size="15"><component :is="g.icon" /></el-icon>
            <span class="rrg-tool__row-main">
              <span class="rrg-tool__row-label">{{ g.label }}</span>
              <span class="rrg-tool__row-hint">{{ g.hint }}</span>
            </span>
            <span v-if="props.groupType === g.value" class="rrg-tool__check">✓</span>
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

    <span class="rrg-tool__sep" aria-hidden="true" />

    <!-- 布局设置 -->
    <ElPopover
      placement="bottom-end"
      trigger="click"
      :width="268"
      popper-class="rrg-tool__popper"
    >
      <template #reference>
        <ReButton data-tool="layout-settings" layout="square" :icon="Setting" tip="布局设置" />
      </template>
      <div class="rrg-tool__panel">
        <div class="rrg-tool__panel-head">
          <span class="rrg-tool__panel-title">{{ shortLabel(currentLayout.label) }} · 参数</span>
          <button
            type="button"
            class="rrg-tool__reset"
            :disabled="!hasLayoutOverride"
            @click="resetLayoutOptions"
          >
            重置
          </button>
        </div>

        <template v-if="layoutFields.length">
          <div v-for="f in layoutFields" :key="f.key" class="rrg-tool__field">
            <div class="rrg-tool__field-head">
              <span class="rrg-tool__field-label" :title="f.hint">{{ f.label }}</span>
              <span class="rrg-tool__field-value">
                {{ displayOf(f, props.layoutOptions) }}
              </span>
            </div>

            <!-- 下拉：方向 / 排序 / 中心节点这类离散取值 -->
            <ElSelect
              v-if="f.kind === 'select'"
              :model-value="valOf(f, props.layoutOptions)"
              size="small"
              class="rrg-tool__field-select"
              :teleported="false"
              @update:model-value="(v: string) => setLayoutOption(f.key, v)"
            >
              <ElOption
                v-for="o in optionsOf(f)"
                :key="o.value"
                :label="o.label"
                :value="o.value"
              />
            </ElSelect>

            <!-- 开关：顺逆时针 / 等距分环 / 紧凑排列这类布尔 -->
            <ElSwitch
              v-else-if="f.kind === 'switch'"
              :model-value="valOf(f, props.layoutOptions) === true"
              size="small"
              @update:model-value="(v: string | number | boolean) => setLayoutOption(f.key, Boolean(v))"
            />

            <!-- 其余都是数值滑杆 -->
            <ElSlider
              v-else
              :model-value="numOf(f, props.layoutOptions)"
              :min="f.min ?? 0"
              :max="f.max ?? 100"
              :step="f.step ?? 1"
              :show-tooltip="false"
              size="small"
              @update:model-value="(v: number | number[]) => setLayoutOption(f.key, Number(v))"
            />
          </div>
        </template>
        <div v-else class="rrg-tool__empty">该布局没有可调参数</div>

        <template v-if="showGroupSettings">
          <div class="rrg-tool__panel-head rrg-tool__panel-head--sub">
            <span class="rrg-tool__panel-title">分组轮廓</span>
            <button
              type="button"
              class="rrg-tool__reset"
              :disabled="!hasGroupOverride"
              @click="resetGroupOptions"
            >
              重置
            </button>
          </div>
          <div v-for="f in groupFields" :key="f.key" class="rrg-tool__field">
            <div class="rrg-tool__field-head">
              <span class="rrg-tool__field-label" :title="f.hint">{{ f.label }}</span>
              <span class="rrg-tool__field-value">
                {{ displayOf(f, props.groupOptions) }}
              </span>
            </div>
            <ElSlider
              :model-value="numOf(f, props.groupOptions)"
              :min="f.min ?? 0"
              :max="f.max ?? 100"
              :step="f.step ?? 1"
              :show-tooltip="false"
              size="small"
              @update:model-value="(v: number | number[]) => setGroupOption(f.key, Number(v))"
            />
          </div>
        </template>
      </div>
    </ElPopover>

    <!-- 视图与交互（点选 / 框选 / 高亮 / tooltip / 小地图 / 分组折叠） -->
    <ElPopover
      placement="bottom-end"
      trigger="click"
      :width="252"
      popper-class="rrg-tool__popper"
    >
      <template #reference>
        <ReButton
          data-tool="view"
          layout="square"
          :icon="Operation"
          :type="viewAnyOn ? 'primary' : ''"
          :tip="`视图与交互（已开启 ${viewSwitchCount} 项）`"
        />
      </template>
      <div class="rrg-tool__panel">
        <div class="rrg-tool__panel-head">
          <span class="rrg-tool__panel-title">视图与交互</span>
          <span class="rrg-tool__panel-sub">{{ viewSwitchCount }} / {{ VIEW_SWITCHES.length }} 开启</span>
        </div>
        <div class="rrg-tool__switches">
          <div v-for="s in VIEW_SWITCHES" :key="s.key" class="rrg-tool__switch">
            <el-icon :size="14" class="rrg-tool__switch-icon">
              <component :is="s.icon" />
            </el-icon>
            <span class="rrg-tool__row-main">
              <span class="rrg-tool__row-label">{{ s.label }}</span>
              <span class="rrg-tool__row-hint">{{ s.hint }}</span>
            </span>
            <ElSwitch
              :model-value="s.value()"
              size="small"
              :data-switch="s.key"
              @update:model-value="(v: string | number | boolean) => setViewSwitch(s.key, Boolean(v))"
            />
          </div>
        </div>
      </div>
    </ElPopover>

    <!-- 分组折叠面板：逐个分组折叠 / 展开 -->
    <ElPopover
      v-if="combo && groups.length"
      placement="bottom-end"
      trigger="click"
      :width="240"
      popper-class="rrg-tool__popper"
    >
      <template #reference>
        <ReButton
          data-tool="groups"
          layout="square"
          :icon="Menu"
          :tip="`分组折叠（已折叠 ${collapsedGroups.length} / ${groups.length}）`"
        />
      </template>
      <div class="rrg-tool__panel">
        <div class="rrg-tool__panel-head">
          <span class="rrg-tool__panel-title">分组折叠</span>
          <span class="rrg-tool__panel-sub">
            {{ collapsedGroups.length }} / {{ groups.length }} 已折叠
          </span>
        </div>
        <div class="rrg-tool__switches">
          <div v-for="group in groups" :key="group" class="rrg-tool__switch">
            <span class="rrg-tool__row-main">
              <span class="rrg-tool__row-label">{{ group }}</span>
              <span class="rrg-tool__row-hint">
                {{ collapsedGroups.includes(group) ? "已折叠（点画布上的 combo 也能展开）" : "展开" }}
              </span>
            </span>
            <ElSwitch
              :model-value="collapsedGroups.includes(group)"
              size="small"
              :data-group="group"
              @update:model-value="() => emit('toggle-group', group)"
            />
          </div>
        </div>
      </div>
    </ElPopover>

    <!-- 最短路径：开关。开启后左键依次点起点 / 终点自动出结果，右键取消 -->
    <ReButton
      data-tool="path"
      layout="square"
      :icon="Share"
      :active="pathActive || pathPicking"
      :tip="pathTip"
      @click="emit('path-toggle')"
    />

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
        <span class="rrg-tool__sep" aria-hidden="true" />
        <slot name="extra" />
      </template>

      <!-- 折叠（停靠左侧时整组排到最左，见 .is-dock-left） -->
      <span v-if="collapsible" class="rrg-tool__collapse-unit">
        <span class="rrg-tool__sep" aria-hidden="true" />
        <ReButton
          data-tool="collapse"
          layout="square"
          :icon="Fold"
          tip="收起工具栏"
          @click="toggleCollapsed"
        />
      </span>
    </template>
  </div>
</template>

<style scoped>
.rrg-tool {
  display: flex;
  align-items: center;
  gap: 1px;
  padding: 3px 4px;
  background: color-mix(in srgb, var(--el-bg-color, #fff) 88%, transparent);
  border: 1px solid var(--el-border-color-lighter, #e4e7ed);
  border-radius: 999px;
  box-shadow: 0 4px 14px rgba(15, 23, 42, 0.1);
  backdrop-filter: blur(8px);
}

/* 整体比上一版小 1/3：图标按钮 30px → 20px，间距 / 内边距同步收紧 */
.rrg-tool :deep(.rs-btn) {
  width: 21px;
  height: 21px;
  min-width: 21px;
  margin: 0 1px;
  font-size: 11px;
  border-radius: 5px;
}
.rrg-tool :deep(.rs-btn__icon),
.rrg-tool :deep(.rs-btn svg) {
  width: 12px;
  height: 12px;
}

/* 折叠态：缩成一个圆角方块，把画布还回去 */
.rrg-tool.is-collapsed {
  padding: 3px;
  border-radius: 10px;
  background: color-mix(in srgb, var(--el-bg-color, #fff) 92%, transparent);
}

/* 变体：卡片式 —— 带小标题的横排工具卡 */
.rrg-tool--card {
  flex-wrap: wrap;
  justify-content: flex-start;
  padding: 8px 8px 7px;
  border-radius: 12px;
  gap: 2px;
}
.rrg-tool__caption {
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
.rrg-tool__caption-sub {
  font-weight: 400;
  letter-spacing: 0;
}

/* 变体：左侧竖向轨道 */
.rrg-tool--rail {
  flex-direction: column;
  padding: 6px 4px;
  border-radius: 10px;
}
.rrg-tool--rail .rrg-tool__sep {
  width: 60%;
  height: 1px;
  margin: 4px 0;
}

.rrg-tool__sep {
  width: 1px;
  height: 18px;
  background: var(--el-border-color-lighter, #e4e7ed);
  margin: 0 2px;
}

/* 图标按钮：默认偏灰、悬停上色，避免在白色面板上"消失"；激活态（分组开关开）用浅色底 */
.rrg-tool :deep(.el-button) {
  color: var(--el-text-color-regular, #606266);
  background-color: transparent;
}
.rrg-tool :deep(.el-button:hover) {
  color: var(--el-color-primary, #409eff);
  background-color: var(--el-fill-color-light, #f5f7fa);
}
.rrg-tool :deep(.el-button.el-button--primary) {
  color: var(--el-color-primary, #409eff);
  background-color: var(--el-color-primary-light-9, #ecf5ff);
}

/* ---------- Popover 面板 ---------- */
.rrg-tool__panel {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.rrg-tool__panel-head {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 8px;
}
.rrg-tool__panel-head--sub {
  margin-top: 6px;
  padding-top: 8px;
  border-top: 1px dashed var(--el-border-color-lighter, #e4e7ed);
}
.rrg-tool__panel-title {
  font-size: 12px;
  font-weight: 700;
  color: var(--el-text-color-primary, #303133);
}
.rrg-tool__panel-sub {
  font-size: 11px;
  color: var(--el-text-color-secondary, #909399);
}

/* 说明条：告知「已自动隐藏轮廓」这类状态，避免误以为是 bug */
.rrg-tool__note {
  padding: 6px 8px;
  font-size: 11px;
  line-height: 1.6;
  color: var(--el-color-warning-dark-2, #b88230);
  background: var(--el-color-warning-light-9, #fdf6ec);
  border: 1px solid var(--el-color-warning-light-7, #faecd8);
  border-radius: 6px;
}

/* 布局网格：2 列 */
.rrg-tool__grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 4px;
  max-height: 300px;
  overflow-y: auto;
}

.rrg-tool__cell {
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
.rrg-tool__cell:hover {
  background: var(--el-fill-color-light, #f5f7fa);
  color: var(--el-color-primary, #409eff);
}
.rrg-tool__cell.is-active {
  background: var(--el-color-primary-light-9, #ecf5ff);
  border-color: var(--el-color-primary-light-7, #c6e2ff);
  color: var(--el-color-primary, #409eff);
  font-weight: 600;
}

/* 分组类型：整行列表 */
.rrg-tool__list {
  display: flex;
  flex-direction: column;
  gap: 2px;
}
.rrg-tool__row {
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
.rrg-tool__row:hover {
  background: var(--el-fill-color-light, #f5f7fa);
}
.rrg-tool__row.is-active {
  background: var(--el-color-primary-light-9, #ecf5ff);
  border-color: var(--el-color-primary-light-7, #c6e2ff);
}
.rrg-tool__row-main {
  display: flex;
  flex-direction: column;
  gap: 2px;
  flex: 1;
  min-width: 0;
}
.rrg-tool__row-label {
  font-size: 12px;
  font-weight: 600;
  color: var(--el-text-color-primary, #303133);
}
.rrg-tool__row-hint {
  font-size: 11px;
  line-height: 1.4;
  color: var(--el-text-color-secondary, #909399);
}
.rrg-tool__check {
  font-size: 12px;
  color: var(--el-color-primary, #409eff);
}

/* 停靠在左侧时，折叠整组排到最左（用户直觉：贴着哪边，收起就在哪边） */
.rrg-tool__collapse-unit {
  display: flex;
  align-items: center;
  gap: 1px;
}
.rrg-tool.is-dock-left .rrg-tool__collapse-unit {
  order: -1;
}

/* 视图与交互：开关行 */
.rrg-tool__switches {
  display: flex;
  flex-direction: column;
  gap: 1px;
}
.rrg-tool__switch {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 5px 6px;
  border-radius: 6px;
}
.rrg-tool__switch:hover {
  background: var(--el-fill-color-light, #f5f7fa);
}
.rrg-tool__switch-icon {
  flex: none;
  color: var(--el-text-color-secondary, #909399);
}
.rrg-tool__switch :deep(.el-switch) {
  flex: none;
}

/* 最短路径面板：起终点 + 按钮 + 结果文字 */
.rrg-tool__path-picks {
  display: flex;
  gap: 6px;
}
.rrg-tool__buttons {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
}
.rrg-tool__path-info {
  padding: 6px 8px;
  font-size: 11px;
  line-height: 1.6;
  color: var(--el-text-color-regular, #606266);
  background: var(--el-fill-color-light, #f5f7fa);
  border-radius: 6px;
  word-break: break-all;
}

/* 参数行 */
.rrg-tool__field {
  display: flex;
  flex-direction: column;
  gap: 2px;
}
.rrg-tool__field-head {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 8px;
}
.rrg-tool__field-label {
  font-size: 12px;
  color: var(--el-text-color-regular, #606266);
  cursor: help;
}
.rrg-tool__field-value {
  font-size: 11px;
  font-variant-numeric: tabular-nums;
  color: var(--el-text-color-secondary, #909399);
}

/* 下拉型参数：占满一行，和滑杆一样对齐 */
.rrg-tool__field-select {
  width: 100%;
}

.rrg-tool__reset {
  font-size: 11px;
  color: var(--el-color-primary, #409eff);
  background: none;
  border: none;
  padding: 0;
  cursor: pointer;
}
.rrg-tool__reset:disabled {
  color: var(--el-text-color-placeholder, #c0c4cc);
  cursor: default;
}

.rrg-tool__empty {
  font-size: 12px;
  color: var(--el-text-color-secondary, #909399);
  padding: 4px 0;
}
</style>
