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
import type { App, Plugin } from "vue";
import { defineComponent, h } from "vue";
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
import "../shared/re-inputs.css";
import "./re-kit.css";

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
      h(ElOption, { ...attrs, value: props.value, label: props.label, disabled: props.disabled } as any, slots.default?.());
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
      h(ElRow, { ...attrs, gutter: props.gutter, justify: props.justify, align: props.align, wrap: props.wrap, tag: props.tag } as any, slots.default?.());
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
        slots.default?.(),
      );
  },
});

/* ==================== ReRadioGroup / ReRadio / ReRadioButton ==================== */
const ReRadioGroup = defineComponent({
  name: "ReRadioGroup",
  inheritAttrs: true,
  props: {
    modelValue: { default: undefined },
    size: { type: String, default: "default" },
    disabled: { type: Boolean, default: false },
    button: { type: Boolean, default: false },
    capsule: { type: Boolean, default: true },
  },
  emits: ["update:modelValue"],
  setup(props, { attrs, slots, emit }) {
    return () =>
      h(
        ElRadioGroup,
        {
          ...attrs,
          size: props.size,
          disabled: props.disabled,
          class: [
            "re-radio-group",
            `re-radio-group--${props.size}`,
            { "re-radio-group--button": props.button, "re-radio-group--capsule": props.capsule },
          ],
          onUpdate: (v: unknown) => emit("update:modelValue", v),
          onUpdateModelValue: (v: unknown) => emit("update:modelValue", v),
        } as any,
        slots.default?.(),
      );
  },
});

const ReRadio = defineComponent({
  name: "ReRadio",
  inheritAttrs: true,
  props: {
    value: { type: [String, Number, Boolean, Object], default: "" },
    label: { type: [String, Number, Object] },
    disabled: { type: Boolean, default: false },
    border: { type: Boolean, default: false },
    size: { type: String },
  },
  setup(props, { attrs, slots }) {
    return () =>
      h(ElRadio, { ...attrs, value: props.value, label: props.label, disabled: props.disabled, border: props.border, size: props.size } as any, slots.default?.());
  },
});

const ReRadioButton = defineComponent({
  name: "ReRadioButton",
  inheritAttrs: true,
  props: {
    value: { type: [String, Number, Boolean, Object], default: "" },
    label: { type: [String, Number, Object] },
    disabled: { type: Boolean, default: false },
  },
  setup(props, { attrs, slots }) {
    return () => h(ElRadioButton, { ...attrs, value: props.value, label: props.label, disabled: props.disabled } as any, slots.default?.());
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
          onUpdateModelValue: (v: unknown) => emit("update:modelValue", v),
        } as any,
        slots.default?.(),
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
          default: slots.default?.(),
          dropdown: slots.dropdown?.(),
        },
      );
  },
});

const ReDropdownMenu = defineComponent({
  name: "ReDropdownMenu",
  inheritAttrs: true,
  setup(_, { attrs, slots }) {
    return () => h(ElDropdownMenu, { ...attrs } as any, slots.default?.());
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
      h(ElDropdownItem, { ...attrs, disabled: props.disabled, divided: props.divided, command: props.command, class: "re-dropdown-item" } as any, slots.default?.());
  },
});

/* ==================== ReDescriptions / ReDescriptionsItem ==================== */
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
        slots.default?.(),
      );
  },
});

const ReDescriptionsItem = defineComponent({
  name: "ReDescriptionsItem",
  inheritAttrs: true,
  props: {
    label: { type: String, default: "" },
    span: { type: Number, default: 1 },
    minWidth: { type: [String, Number] },
    align: { type: String },
    labelAlign: { type: String },
  },
  setup(props, { attrs, slots }) {
    return () =>
      h(
        ElDescriptionsItem,
        { ...attrs, label: props.label, span: props.span, minWidth: props.minWidth, align: props.align, labelAlign: props.labelAlign } as any,
        slots.default?.(),
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
        slots.default?.(),
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
      h(ElLink, { ...attrs, type: props.type, underline: props.underline, disabled: props.disabled, href: props.href, target: props.target, class: "re-link" } as any, slots.default?.());
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
      h(ElAvatar, { ...attrs, size: props.size, shape: props.shape, src: props.src, fit: props.fit, alt: props.alt, class: "re-avatar" } as any, slots.default?.());
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