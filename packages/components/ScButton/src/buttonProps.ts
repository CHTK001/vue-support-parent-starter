import type { Component, ExtractPropTypes, PropType } from "vue";

export type ButtonType = "" | "default" | "primary" | "success" | "warning" | "info" | "danger" | "text";
export type ButtonSize = "" | "large" | "default" | "small";
export type ButtonNativeType = "button" | "submit" | "reset";

export const scButtonProps = {
  size: {
    type: String as PropType<ButtonSize>,
    default: "",
  },
  type: {
    type: String as PropType<ButtonType>,
    default: "",
  },
  plain: {
    type: Boolean,
    default: false,
  },
  text: {
    type: Boolean,
    default: false,
  },
  bg: {
    type: Boolean,
    default: false,
  },
  link: {
    type: Boolean,
    default: false,
  },
  round: {
    type: Boolean,
    default: false,
  },
  circle: {
    type: Boolean,
    default: false,
  },
  loading: {
    type: Boolean,
    default: false,
  },
  loadingIcon: {
    type: [String, Object] as PropType<string | Component>,
    default: undefined,
  },
  disabled: {
    type: Boolean,
    default: false,
  },
  icon: {
    type: [String, Object] as PropType<string | Component>,
    default: "",
  },
  autofocus: {
    type: Boolean,
    default: false,
  },
  nativeType: {
    type: String as PropType<ButtonNativeType>,
    default: "button",
  },
  autoInsertSpace: {
    type: Boolean,
    default: undefined,
  },
  color: {
    type: String,
    default: "",
  },
  dark: {
    type: Boolean,
    default: false,
  },
  tag: {
    type: [String, Object] as PropType<string | Component>,
    default: "button",
  },
} as const;

export type ScButtonProps = ExtractPropTypes<typeof scButtonProps>;
