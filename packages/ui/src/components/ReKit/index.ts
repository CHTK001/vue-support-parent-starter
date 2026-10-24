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
import { computed, defineComponent, h, inject, provide, type VNode } from "vue";
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
const ReRadioGroup = defineComponent({
  name: "ReRadioGroup",
  inheritAttrs: true,
  props: {
    // 不声明 type 会让 TS 把该 prop 推成 undefined，导致 v-model 绑任何值都报
    // 「Type 'number' is not assignable to type 'undefined'」。这里显式放开。
    modelValue: { type: [String, Number, Boolean, Object] as PropType<string | number | boolean | object>, default: undefined },
    size: { type: String, default: "default" },
    disabled: { type: Boolean, default: false },
    button: { type: Boolean, default: false },
    capsule: { type: Boolean, default: true },
  },
  emits: ["update:modelValue"],
  setup(props, { attrs, slots, emit }) {
    // 把当前选中值下发给子项：ReRadio / ReRadioButton 靠它判断激活态（图标动画需要）。
    provide(RE_RADIO_STATE_KEY, computed(() => props.modelValue));
    return () =>
      h(
        ElRadioGroup,
        {
          ...attrs,
          // modelValue 已声明为 prop，不会出现在 attrs 里；必须显式回传，
          // 否则 ElRadioGroup 永远拿不到当前值，表现为「点选不切换、不高亮」。
          modelValue: props.modelValue,
          size: props.size,
          disabled: props.disabled,
          class: [
            "re-radio-group",
            `re-radio-group--${props.size}`,
            { "re-radio-group--button": props.button, "re-radio-group--capsule": props.capsule },
          ],
          // 渲染函数里绑定带冒号的事件必须写成 "onXxx:yyy"。
          // 此前写作 onUpdate / onUpdateModelValue，Vue 分别映射为 "update"
          // 与 "updateModelValue"，都与 Element Plus 实际派发的
          // "update:modelValue" 对不上，导致点选后父组件收不到通知、v-model 失效。
          "onUpdate:modelValue": (v: unknown) => emit("update:modelValue", v),
        } as any,
        // 以函数插槽下发，避免 Element Plus 报
        // 「Non-function value encountered for default slot」
        { default: () => slots.default?.() },
      );
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