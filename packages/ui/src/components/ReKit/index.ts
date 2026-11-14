/**
 * ReKit —— 基础组件收纳包（单文件聚合注册）
 *
 * 将一组轻量"透传/美化"组件收敛到单一模块，避免新建大量零散目录：
 *   ReOption / ReFormItem / ReRow / ReCol
 *   ReRadioGroup / ReRadio / ReRadioButton
 *   ReTreeSelect / ReTableColumn
 *   ReDropdown / ReDropdownMenu / ReDropdownItem
 *   ReDescriptions / ReDescriptionsItem
 *   ReAlert / ReDivider / ReLink / ReAvatar
 *
 * 用法：
 *   import { install as ReKitInstall } from "@repo/ui/re-kit";
 *   app.use(ReKitInstall);
 * 或：
 *   import ReKit from "@repo/ui/re-kit";
 *   app.use(ReKit);
 */
import type { App, InjectionKey, Plugin, PropType, Slots } from "vue";
import { Fragment, computed, defineComponent, h, inject, provide, type VNode } from "vue";
import {
  ElAlert,
  ElAvatar,
  ElCol,
  ElDescriptions,
  ElDescriptionsItem,
  ElDivider,
  ElDropdown,
  ElDropdownItem,
  ElDropdownMenu,
  ElFormItem,
  ElLink,
  ElOption,
  ElRadio,
  ElRadioButton,
  ElRadioGroup,
  ElRow,
  ElSegmented,
  ElTableColumn,
  ElTreeSelect,
} from "element-plus";
import StateIcon from "../ReStateIcon/StateIcon.vue";
import "../shared/re-inputs.css";
import "./re-kit.css";

/**
 * ReRadioGroup 向下提供当前选中值（computed ref），供 ReRadio / ReRadioButton 判断激活态。
 *
 * 不用 Element Plus 内部的 `radioGroupKey`（深路径导入 `element-plus/es/components/radio`
 * 在 exports 映射下并不可靠），改用本组件自己的注入键：语义相同，且不依赖 EP 内部实现。
 *
 * 键值类型刻意用 `unknown`：把 `ComputedRef<T>` 直接标成 `Ref<unknown>` 会触发 ref 的
 * 读写变体检查；统一成 `unknown`，读取处再判空即可。
 */
const RE_RADIO_STATE_KEY: InjectionKey<unknown> = Symbol("reRadioState");

/* ==================== ReOption ==================== */
const ReOption = defineComponent({
  name: "ReOption",
  inheritAttrs: true,
  props: {
    value: { type: [String, Number, Boolean, Object] },
    label: { type: [String, Number] },
    disabled: { type: Boolean, default: false },
  },
  setup(props, { attrs, slots }) {
    return () =>
      h(ElOption, { ...attrs, value: props.value, label: props.label, disabled: props.disabled } as any, slots.default);
  },
});

/* ==================== ReFormItem ==================== */
const ReFormItem = defineComponent({
  name: "ReFormItem",
  inheritAttrs: true,
  props: {
    prop: { type: String, default: "" },
    label: { type: String, default: "" },
    required: { type: Boolean, default: false },
    labelWidth: { type: [String, Number] },
    error: { type: String, default: "" },
    showMessage: { type: Boolean, default: true },
    size: { type: String },
  },
  setup(props, { attrs, slots }) {
    return () =>
      h(
        ElFormItem,
        {
          ...attrs,
          prop: props.prop,
          label: props.label,
          required: props.required,
          labelWidth: props.labelWidth,
          error: props.error,
          showMessage: props.showMessage,
          size: props.size,
          class: "re-form-item",
        } as any,
        {
          default: () => slots.default?.(),
          ...(slots.label ? { label: () => slots.label?.() } : {}),
        },
      );
  },
});

/* ==================== ReRow / ReCol ==================== */
const ReRow = defineComponent({
  name: "ReRow",
  inheritAttrs: true,
  props: {
    gutter: { type: Number, default: 0 },
    justify: { type: String, default: "start" },
    align: { type: String, default: "top" },
    wrap: { type: Boolean, default: true },
    tag: { type: String, default: "div" },
  },
  setup(props, { attrs, slots }) {
    return () =>
      h(ElRow, { ...attrs, gutter: props.gutter, justify: props.justify, align: props.align, wrap: props.wrap, tag: props.tag } as any, slots.default);
  },
});

const ReCol = defineComponent({
  name: "ReCol",
  inheritAttrs: true,
  props: {
    span: { type: Number, default: 24 },
    offset: { type: Number, default: 0 },
    push: { type: Number, default: 0 },
    pull: { type: Number, default: 0 },
    xs: { type: [Number, Object] },
    sm: { type: [Number, Object] },
    md: { type: [Number, Object] },
    lg: { type: [Number, Object] },
    xl: { type: [Number, Object] },
    tag: { type: String, default: "div" },
  },
  setup(props, { attrs, slots }) {
    return () =>
      h(
        ElCol,
        {
          ...attrs,
          span: props.span,
          offset: props.offset,
          push: props.push,
          pull: props.pull,
          xs: props.xs,
          sm: props.sm,
          md: props.md,
          lg: props.lg,
          xl: props.xl,
          tag: props.tag,
        } as any,
        slots.default,
      );
  },
});

/* ==================== ReRadioGroup / ReRadio / ReRadioButton ==================== */

/**
 * 分段控件的选项（从子项 VNode 里提取）。
 *
 * <p>{@code index} 是子项在原插槽里的序号：el-segmented 的默认插槽只回传 item，
 * 不回传 index，渲染富内容（图标 / 计数 / 自定义 span）时按它回原插槽取 children。</p>
 */
type ReRadioOption = { label: string; value: unknown; disabled: boolean; index: number };

/** 认得出「单选项」的组件名：ReKit 自己的两个 + Element Plus 的两个（迁移期混用） */
const RADIO_ITEM_NAMES = new Set([
  "ReRadio",
  "ReRadioButton",
  "ElRadio",
  "ElRadioButton",
  "el-radio",
  "el-radio-button",
]);

function isRadioItem(node: VNode): boolean {
  const type = node.type as { name?: string; __name?: string } | string;
  const name = typeof type === "string" ? type : type?.name ?? type?.__name ?? "";
  return RADIO_ITEM_NAMES.has(name);
}

/** 把插槽结果摊平成一维 VNode（v-for / <template> 会包一层 Fragment，注释/文本节点丢掉） */
function flattenVNodes(input: unknown, out: VNode[] = []): VNode[] {
  if (Array.isArray(input)) {
    for (const item of input) flattenVNodes(item, out);
    return out;
  }
  if (!input || typeof input !== "object") return out;
  const node = input as VNode;
  if (node.type === Fragment) return flattenVNodes(node.children, out);
  // Comment / Text / Static 的 type 是 symbol，不是可渲染的选项
  if (typeof node.type === "symbol") return out;
  out.push(node);
  return out;
}

/**
 * 取子项的「实际内容」。
 *
 * <p>同一个子项在三种写法下 children 的形状不同：模板里的
 * {@code <ReRadio value="a">甲</ReRadio>} 是 {@code { default: () => ['甲'] }}
 * （插槽对象），render 函数写成 {@code h(ReRadio, p, () => '甲')} 是函数，
 * 直接给字符串/VNode 数组则是原值。这里统一摊平成可遍历的内容。</p>
 */
function resolveChildren(children: unknown): unknown {
  if (typeof children === "function") {
    try {
      return resolveChildren((children as () => unknown)());
    } catch {
      return undefined;
    }
  }
  if (
    children &&
    typeof children === "object" &&
    !Array.isArray(children) &&
    "default" in (children as Record<string, unknown>) &&
    !("type" in (children as Record<string, unknown>))
  ) {
    return resolveChildren((children as Record<string, unknown>).default);
  }
  return children;
}

/** VNode 里的纯文本（`<el-radio value="a">甲</el-radio>` 的文案靠它取） */
function textOfVNode(input: unknown): string {
  const value = resolveChildren(input);
  if (typeof value === "string" || typeof value === "number") return String(value);
  if (Array.isArray(value)) return value.map(textOfVNode).join("");
  if (value && typeof value === "object" && "children" in (value as VNode)) {
    return textOfVNode((value as VNode).children);
  }
  return "";
}

/** 子项的 children 拍平成可渲染节点 */
function renderableChildren(children: unknown): unknown[] {
  const value = resolveChildren(children);
  if (value == null) return [];
  return Array.isArray(value) ? value : [value];
}

/**
 * 取出分组插槽里的全部单选项。
 *
 * <p>每次都重新调用插槽，而不是缓存 VNode：分段控件可能因自身 resize 重渲染，
 * 复用同一批 VNode 会碰到「vnode 已挂载过」的问题；重新调用拿到的永远是当前
 * 响应式状态下的一批新 VNode，插槽里读到的数据也才能被收集为依赖、数据变化时
 * 跟着重算（比如「全部 {{ counts.all }}」这种带计数的分段项）。</p>
 */
function readRadioItems(slot: (() => VNode[]) | undefined): VNode[] {
  if (!slot) return [];
  return flattenVNodes(slot()).filter(isRadioItem);
}

/**
 * 子项 → 分段选项。
 *
 * <p>取值口径对齐 Element Plus：{@code value} 是值、{@code label} 是文案；
 * 只写了 {@code label}（旧写法，如 {@code <el-radio-button label="all">}）时
 * label 同时当值用。文案优先取插槽文字，其次 label 属性。</p>
 */
function toRadioOption(node: VNode, index: number): ReRadioOption {
  const props = (node.props ?? {}) as Record<string, unknown>;
  const hasValue = props.value !== undefined;
  const value = hasValue ? props.value : props.label;
  const propLabel = typeof props.label === "string" || typeof props.label === "number" ? String(props.label) : "";
  const label = textOfVNode(node.children) || propLabel || String(value ?? "");
  const disabled = props.disabled !== undefined && props.disabled !== false;
  return { label, value, disabled, index };
}

const ReRadioGroup = defineComponent({
  name: "ReRadioGroup",
  inheritAttrs: true,
  props: {
    // 不声明 type 会让 TS 把该 prop 推成 undefined，导致 v-model 绑任何值都报
    // 「Type 'number' is not assignable to type 'undefined'」。这里显式放开。
    modelValue: {
      type: [String, Number, Boolean, Object, Array] as PropType<string | number | boolean | object>,
      default: undefined,
    },
    /** 尺寸（segmented 形态吃 el-segmented 的 large/default/small） */
    size: { type: String, default: "default" },
    /**
     * 渲染形态：
     *   - `"segmented"`（默认）：el-segmented 分段控件。子项 ReRadio / ReRadioButton
     *     （或还没改完的 el-radio / el-radio-button）只当「选项声明」，不参与渲染，
     *     文案、图标、计数从它们的插槽内容里取。
     *   - `"el"`：原生 el-radio-group（子项照旧渲染，走 EP 自己的单选样式）。
     *   - `"square"`：el-radio-group + re-kit.css 的扁平方块轨道。
     *   - `"card"`：el-radio-group + 子项自带卡片样式（如 `.st-src-cards` 那种大卡）。
     *   - `"default"`：旧的 ReKit 轨道样式（保留兼容）。
     * 后四种都保持「子项真的渲染」，页面里针对 .el-radio / .el-radio-button 的
     * 自定义 CSS 才继续有效；默认的分段形态是控件自己画的，不吃这些覆盖。
     */
    layout: { type: String, default: "segmented" },
    /** 分段形态：整行铺满（el-segmented 的 block） */
    block: { type: Boolean, default: false },
    /** 分段形态：选项排布方向 */
    direction: { type: String, default: "horizontal" },
    disabled: { type: Boolean, default: false },
    /** 旧布局修饰：仅 default 布局使用 */
    button: { type: Boolean, default: false },
    /** 旧布局修饰：仅 default 布局使用 */
    capsule: { type: Boolean, default: true },
  },
  emits: ["update:modelValue", "change"],
  setup(props, { attrs, slots, emit }) {
    // 把当前选中值下发给子项：非分段布局里 ReRadio / ReRadioButton 靠它判断激活态。
    provide(RE_RADIO_STATE_KEY, computed(() => props.modelValue));

    const isSegmented = computed(() => props.layout === "segmented");

    return () => {
      if (!isSegmented.value) {
        // layout="el" 时不挂 `re-radio-group`：re-kit.css 中该段全部选择器都不会落到它头上；
        // layout="square" 时穿不穿 capsule/button 修饰符都由样式分支自己接管，不作为 layout 状态。
        const groupClass: string[] = [];
        if (props.layout !== "el") {
          groupClass.push("re-radio-group", `re-radio-group--${props.size}`, `re-radio-group--${props.layout}`);
          if (props.layout === "default") {
            if (props.button) groupClass.push("re-radio-group--button");
            if (props.capsule) groupClass.push("re-radio-group--capsule");
          }
        }
        return h(
          ElRadioGroup,
          {
            ...attrs,
            // modelValue 已声明为 prop，不会出现在 attrs 里；必须显式回传，
            // 否则 ElRadioGroup 永远拿不到当前值，表现为「点选不切换、不高亮」。
            modelValue: props.modelValue,
            size: props.size,
            disabled: props.disabled,
            class: groupClass,
            // 渲染函数里绑定带冒号的事件必须写成 "onXxx:yyy"，见下方旧注释。
            "onUpdate:modelValue": (v: unknown) => emit("update:modelValue", v),
            onChange: (v: unknown) => emit("change", v),
          } as any,
          // 以函数插槽下发，避免 Element Plus 报
          // 「Non-function value encountered for default slot」
          { default: () => slots.default?.() },
        );
      }

      const options = readRadioItems(slots.default).map(toRadioOption);
      return h(
        ElSegmented,
        {
          ...attrs,
          modelValue: props.modelValue,
          // 尺寸缺省交给主题（el-segmented 没有 "default" 这个值，undefined = 默认档）
          size: props.size === "default" ? undefined : props.size,
          disabled: props.disabled,
          block: props.block,
          direction: props.direction,
          options,
          class: "re-radio",
          "onUpdate:modelValue": (v: unknown) => emit("update:modelValue", v),
          onChange: (v: unknown) => emit("change", v),
        } as any,
        {
          default: ({ item }: { item: ReRadioOption }) => {
            // 富内容（图标 / 计数 / 带 class 的 span）按序号回原插槽取，纯文本直接用 label
            const source = readRadioItems(slots.default)[item.index];
            const sourceProps = (source?.props ?? {}) as Record<string, unknown>;
            const children = source?.children;
            const nodes: unknown[] = [];
            // 子项用 props 声明的两态图标（ReSwitch 的 radio 布局靠它）：分段模式下子项
            // 本身不渲染，图标必须在这里补回来，否则那套「是/否 + 太阳/月亮」会丢图标
            if (
              sourceProps.icon ||
              sourceProps.activeIcon ||
              sourceProps.inactiveIcon ||
              sourceProps.preset
            ) {
              nodes.push(
                h(StateIcon, {
                  active: props.modelValue === item.value,
                  icon: sourceProps.icon as string,
                  activeIcon: sourceProps.activeIcon as string,
                  inactiveIcon: sourceProps.inactiveIcon as string,
                  preset: sourceProps.preset as string,
                  size: (sourceProps.iconSize as number) ?? 16,
                }),
              );
            }
            if (children != null) {
              nodes.push(...renderableChildren(children));
            }
            if (!nodes.length) nodes.push(item.label);
            return sourceProps.class
              ? h("span", { class: sourceProps.class as any }, nodes as any)
              : (nodes as any);
          },
        },
      );
    };
  },
});

/**
 * 读取 ReRadioGroup 下发的当前选中值（computed ref）。
 *
 * ReRadio / ReRadioButton 只是 el-radio / el-radio-button 的薄封装，自身不持有分组值；
 * 判断某个选项当前是否选中（图标动画要知道激活态）必须读注入的分组状态。
 */
function useRadioState(): unknown {
  return inject(RE_RADIO_STATE_KEY, null);
}

/** 该选项当前是否选中（不在分组内时按未选中处理） */
function isRadioChecked(state: unknown, value: unknown): boolean {
  return state != null && (state as { value?: unknown }).value === value;
}

/**
 * 组装 radio 的显示内容：图标 + 文本。
 *
 * 只有配置了图标才追加 ReStateIcon；文本优先取使用者插槽，其次 label 属性。
 * 配置了图标时始终下发 default 插槽（含 label 文本），否则沿用「直接透传插槽」的既有行为。
 */
function renderRadioContent(options: {
  checked: boolean;
  label?: unknown;
  slots: Slots;
  icon?: string;
  activeIcon?: string;
  inactiveIcon?: string;
  preset?: string;
  iconSize?: number;
}): Array<VNode | string> {
  const children: Array<VNode | string> = [];
  if (options.icon || options.activeIcon || options.inactiveIcon || options.preset) {
    children.push(
      h(StateIcon, {
        active: options.checked,
        icon: options.icon,
        activeIcon: options.activeIcon,
        inactiveIcon: options.inactiveIcon,
        preset: options.preset,
        size: options.iconSize ?? 16,
      }),
    );
  }
  const slotNodes = options.slots.default?.() ?? [];
  if (slotNodes.length) {
    children.push(...slotNodes);
  } else if (options.label != null && options.label !== "") {
    children.push(String(options.label));
  }
  return children;
}

const ReRadio = defineComponent({
  name: "ReRadio",
  inheritAttrs: true,
  props: {
    value: { type: [String, Number, Boolean, Object], default: "" },
    label: { type: [String, Number, Object] },
    disabled: { type: Boolean, default: false },
    border: { type: Boolean, default: false },
    size: { type: String },
    /** 通用图标（两态相同）；activeIcon / inactiveIcon 未配置时回落到它 */
    icon: { type: String, default: "" },
    /** 激活态图标名 */
    activeIcon: { type: String, default: "" },
    /** 非激活态图标名 */
    inactiveIcon: { type: String, default: "" },
    /** 内置图标集名（sunmoon / check / star / bell / arrow / anim）；"none" 关闭内置回落 */
    preset: { type: String, default: undefined },
    /** 图标尺寸（px） */
    iconSize: { type: Number, default: 16 },
  },
  setup(props, { attrs, slots }) {
    const radioState = useRadioState();
    return () => {
      const childSlots = props.icon || props.activeIcon || props.inactiveIcon || props.preset
        ? {
            default: () =>
              renderRadioContent({
                checked: isRadioChecked(radioState, props.value),
                label: props.label,
                slots,
                icon: props.icon,
                activeIcon: props.activeIcon,
                inactiveIcon: props.inactiveIcon,
                preset: props.preset,
                iconSize: props.iconSize,
              }),
          }
        : {
            // 以函数插槽下发：直接传 slots.default?.() 会让 Element Plus 报
            // 「Non-function value encountered for default slot」。同 ReRadioGroup。
            default: () => slots.default?.(),
          };
      return h(
        ElRadio,
        { ...attrs, value: props.value, label: props.label, disabled: props.disabled, border: props.border, size: props.size } as any,
        childSlots,
      );
    };
  },
});

const ReRadioButton = defineComponent({
  name: "ReRadioButton",
  inheritAttrs: true,
  props: {
    value: { type: [String, Number, Boolean, Object], default: "" },
    label: { type: [String, Number, Object] },
    disabled: { type: Boolean, default: false },
    /** 通用图标（两态相同）；activeIcon / inactiveIcon 未配置时回落到它 */
    icon: { type: String, default: "" },
    /** 激活态图标名 */
    activeIcon: { type: String, default: "" },
    /** 非激活态图标名 */
    inactiveIcon: { type: String, default: "" },
    /** 内置图标集名（sunmoon / check / star / bell / arrow / anim）；"none" 关闭内置回落 */
    preset: { type: String, default: undefined },
    /** 图标尺寸（px） */
    iconSize: { type: Number, default: 16 },
  },
  setup(props, { attrs, slots }) {
    const radioState = useRadioState();
    return () => {
      const childSlots = props.icon || props.activeIcon || props.inactiveIcon || props.preset
        ? {
            default: () =>
              renderRadioContent({
                checked: isRadioChecked(radioState, props.value),
                label: props.label,
                slots,
                icon: props.icon,
                activeIcon: props.activeIcon,
                inactiveIcon: props.inactiveIcon,
                preset: props.preset,
                iconSize: props.iconSize,
              }),
          }
        : {
            // 同 ReRadio：必须用函数插槽，否则 Element Plus 报警告
            default: () => slots.default?.(),
          };
      return h(
        ElRadioButton,
        { ...attrs, value: props.value, label: props.label, disabled: props.disabled } as any,
        childSlots,
      );
    };
  },
});

/* ==================== ReTreeSelect ==================== */
const ReTreeSelect = defineComponent({
  name: "ReTreeSelect",
  inheritAttrs: true,
  props: {
    modelValue: { default: null },
    data: { type: Array, default: () => [] },
    props: { type: Object, default: () => ({ children: "children", label: "label", value: "value" }) },
    nodeKey: { type: String, default: "" },
    placeholder: { type: String, default: "请选择" },
    clearable: { type: Boolean, default: false },
    filterable: { type: Boolean, default: false },
    multiple: { type: Boolean, default: false },
    checkStrictly: { type: Boolean, default: false },
    checkOnClickNode: { type: Boolean, default: false },
    defaultExpandAll: { type: Boolean, default: false },
    size: { type: String, default: "default" },
    disabled: { type: Boolean, default: false },
  },
  emits: ["update:modelValue"],
  setup(props, { attrs, slots, emit }) {
    return () =>
      h(
        ElTreeSelect,
        {
          ...attrs,
          data: props.data,
          props: props.props,
          nodeKey: props.nodeKey,
          placeholder: props.placeholder,
          clearable: props.clearable,
          filterable: props.filterable,
          multiple: props.multiple,
          checkStrictly: props.checkStrictly,
          checkOnClickNode: props.checkOnClickNode,
          defaultExpandAll: props.defaultExpandAll,
          size: props.size,
          disabled: props.disabled,
          class: "re-tree-select",
          modelValue: props.modelValue,
          // 同 ReRadioGroup：带冒号的事件必须写成 "onXxx:yyy"
          "onUpdate:modelValue": (v: unknown) => emit("update:modelValue", v),
        } as any,
        slots.default,
      );
  },
});

/* ==================== ReTableColumn ==================== */
const ReTableColumn = defineComponent({
  name: "ReTableColumn",
  inheritAttrs: true,
  props: {
    type: { type: String, default: "default" },
    prop: { type: String, default: "" },
    label: { type: String, default: "" },
    width: { type: [String, Number] },
    minWidth: { type: [String, Number] },
    fixed: { type: [Boolean, String] },
    align: { type: String },
    headerAlign: { type: String },
    sortable: { type: [Boolean, String], default: false },
    showOverflowTooltip: { type: Boolean, default: false },
    formatter: { type: Function },
  },
  setup(props, { attrs, slots }) {
    return () =>
      h(
        ElTableColumn,
        {
          ...attrs,
          type: props.type,
          prop: props.prop,
          label: props.label,
          width: props.width,
          minWidth: props.minWidth,
          fixed: props.fixed,
          align: props.align,
          headerAlign: props.headerAlign,
          sortable: props.sortable,
          showOverflowTooltip: props.showOverflowTooltip,
          formatter: props.formatter,
        } as any,
        {
          default: (scope: unknown) => slots.default?.(scope ?? {}),
          ...(slots.header ? { header: (scope: unknown) => slots.header?.(scope ?? {}) } : {}),
        },
      );
  },
});

/* ==================== ReDropdown / ReDropdownMenu / ReDropdownItem ==================== */
const ReDropdown = defineComponent({
  name: "ReDropdown",
  inheritAttrs: true,
  props: {
    trigger: { type: String, default: "hover" },
    splitButton: { type: Boolean, default: false },
    type: { type: String, default: "default" },
    size: { type: String, default: "default" },
    disabled: { type: Boolean, default: false },
    hideOnClick: { type: Boolean, default: true },
  },
  setup(props, { attrs, slots }) {
    return () =>
      h(
        ElDropdown,
        {
          ...attrs,
          trigger: props.trigger,
          splitButton: props.splitButton,
          type: props.type,
          size: props.size,
          disabled: props.disabled,
          hideOnClick: props.hideOnClick,
          popperClass: "re-dropdown",
        } as any,
        {
          default: slots.default,
          dropdown: slots.dropdown,
        },
      );
  },
});

const ReDropdownMenu = defineComponent({
  name: "ReDropdownMenu",
  inheritAttrs: true,
  setup(_, { attrs, slots }) {
    return () => h(ElDropdownMenu, { ...attrs } as any, slots.default);
  },
});

const ReDropdownItem = defineComponent({
  name: "ReDropdownItem",
  inheritAttrs: true,
  props: {
    disabled: { type: Boolean, default: false },
    divided: { type: Boolean, default: false },
    command: { type: [String, Number, Object] },
  },
  setup(props, { attrs, slots }) {
    return () =>
      h(ElDropdownItem, { ...attrs, disabled: props.disabled, divided: props.divided, command: props.command, class: "re-dropdown-item" } as any, slots.default);
  },
});

/* ==================== ReDescriptions / ReDescriptionsItem ==================== */
/**
 * 子项不可包装：ElDescriptions 在自身 render 阶段按 vnode 类型名收集子项，
 * 且 ElDescriptionsItem 是无 render 的标记组件，包一层即丢失全部内容。
 */
const ReDescriptionsItem = ElDescriptionsItem;

const ReDescriptions = defineComponent({
  name: "ReDescriptions",
  inheritAttrs: true,
  props: {
    column: { type: Number, default: 2 },
    border: { type: Boolean, default: true },
    size: { type: String, default: "small" },
    title: { type: String, default: "" },
    direction: { type: String, default: "horizontal" },
    labelStyle: { type: Object, default: () => ({}) },
    contentStyle: { type: Object, default: () => ({}) },
  },
  setup(props, { attrs, slots }) {
    return () =>
      h(
        ElDescriptions,
        {
          ...attrs,
          column: props.column,
          border: props.border,
          size: props.size,
          title: props.title,
          direction: props.direction,
          labelStyle: props.labelStyle,
          contentStyle: props.contentStyle,
          class: "re-descriptions",
        } as any,
        slots.default,
      );
  },
});

/* ==================== ReAlert ==================== */
const ReAlert = defineComponent({
  name: "ReAlert",
  inheritAttrs: true,
  props: {
    title: { type: String, default: "" },
    description: { type: String, default: "" },
    type: { type: String, default: "info" },
    closable: { type: Boolean, default: true },
    closeText: { type: String, default: "" },
    showIcon: { type: Boolean, default: true },
    center: { type: Boolean, default: false },
  },
  emits: ["close"],
  setup(props, { attrs, slots, emit }) {
    return () =>
      h(
        ElAlert,
        {
          ...attrs,
          title: props.title,
          description: props.description,
          type: props.type,
          closable: props.closable,
          closeText: props.closeText,
          showIcon: props.showIcon,
          center: props.center,
          class: "re-alert",
          onClose: () => emit("close"),
        } as any,
        {
          ...(slots.title ? { title: () => slots.title?.() } : {}),
          ...(slots.default ? { default: () => slots.default?.() } : {}),
        },
      );
  },
});

/* ==================== ReDivider ==================== */
const ReDivider = defineComponent({
  name: "ReDivider",
  inheritAttrs: true,
  props: {
    direction: { type: String, default: "horizontal" },
    contentPosition: { type: String, default: "center" },
    borderStyle: { type: String, default: "solid" },
    plain: { type: Boolean, default: true },
  },
  setup(props, { attrs, slots }) {
    return () =>
      h(
        ElDivider,
        { ...attrs, direction: props.direction, contentPosition: props.contentPosition, borderStyle: props.borderStyle, plain: props.plain, class: "re-divider" } as any,
        slots.default,
      );
  },
});

/* ==================== ReLink ==================== */
const ReLink = defineComponent({
  name: "ReLink",
  inheritAttrs: true,
  props: {
    type: { type: String, default: "default" },
    underline: { type: Boolean, default: true },
    disabled: { type: Boolean, default: false },
    href: { type: String },
    target: { type: String, default: "_blank" },
  },
  setup(props, { attrs, slots }) {
    return () =>
      h(ElLink, { ...attrs, type: props.type, underline: props.underline, disabled: props.disabled, href: props.href, target: props.target, class: "re-link" } as any, slots.default);
  },
});

/* ==================== ReAvatar ==================== */
const ReAvatar = defineComponent({
  name: "ReAvatar",
  inheritAttrs: true,
  props: {
    size: { type: [Number, String], default: 40 },
    shape: { type: String, default: "circle" },
    src: { type: String, default: "" },
    fit: { type: String, default: "cover" },
    alt: { type: String, default: "" },
  },
  setup(props, { attrs, slots }) {
    return () =>
      h(ElAvatar, { ...attrs, size: props.size, shape: props.shape, src: props.src, fit: props.fit, alt: props.alt, class: "re-avatar" } as any, slots.default);
  },
});

/* ==================== 安装器 ==================== */
const COMPONENTS: Array<[string, ReturnType<typeof defineComponent>]> = [
  ["ReOption", ReOption],
  ["ReFormItem", ReFormItem],
  ["ReRow", ReRow],
  ["ReCol", ReCol],
  ["ReRadioGroup", ReRadioGroup],
  ["ReRadio", ReRadio],
  ["ReRadioButton", ReRadioButton],
  ["ReTreeSelect", ReTreeSelect],
  ["ReTableColumn", ReTableColumn],
  ["ReDropdown", ReDropdown],
  ["ReDropdownMenu", ReDropdownMenu],
  ["ReDropdownItem", ReDropdownItem],
  ["ReDescriptions", ReDescriptions],
  ["ReDescriptionsItem", ReDescriptionsItem],
  ["ReAlert", ReAlert],
  ["ReDivider", ReDivider],
  ["ReLink", ReLink],
  ["ReAvatar", ReAvatar],
];

const install: Plugin = {
  install(app: App) {
    for (const [name, comp] of COMPONENTS) {
      app.component(name, comp);
    }
  },
};

export { install, ReOption, ReFormItem, ReRow, ReCol, ReRadioGroup, ReRadio, ReRadioButton, ReTreeSelect, ReTableColumn, ReDropdown, ReDropdownMenu, ReDropdownItem, ReDescriptions, ReDescriptionsItem, ReAlert, ReDivider, ReLink, ReAvatar };
export default install;