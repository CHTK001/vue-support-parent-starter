  <template>
  <component
    :is="actualComponent"
    v-bind="$attrs"
    :class="rootClass"
    :data-skin="rootDataSkin"
    :size="mappedSize"
    :type="mappedType"
    :theme="mappedType"
    :plain="plain"
    :text="text"
    :bg="bg"
    :link="link"
    :round="round"
    :shape="circle ? 'circle' : 'rect'"
    :circle="circle"
    :loading="loading"
    :loading-icon="loadingIcon"
    :disabled="disabled"
    :icon="icon"
    :autofocus="autofocus"
    :native-type="nativeType"
    :auto-insert-space="autoInsertSpace"
    :color="color"
    :dark="dark"
    :tag="tag"
    :class-name="scifiClassName"
    :appearance="scifiAppearance"
    :scale-action="!circle"
    :direction-alt="round"
    :background-opacity="scifiBackgroundOpacity"
    @click="handleClick"
  >
    <template v-if="$slots.default" #default>
      <slot />
    </template>
    <template v-if="$slots.loading" #loading>
      <slot name="loading" />
    </template>
    <template v-if="$slots.icon" #icon>
      <slot name="icon" />
    </template>
  </component>
</template>

<script setup lang="ts">
/**
 * ScButton 按钮组件
 * 保持 useThemeComponent 作为唯一的主题组件切换入口
 */
import { computed, useAttrs } from "vue";
import { ElButton } from "element-plus";
import { useThemeComponent } from "../../hooks/useThemeComponent";
import { scButtonProps } from "./buttonProps";

const props = defineProps(scButtonProps);
const attrs = useAttrs();

const emit = defineEmits<{
  (e: "click", event: MouseEvent): void;
}>();

const { currentComponent } = useThemeComponent("ElButton");

const isScifiSkin = computed(() => resolvedSkin.value === "tech");
const scifiTheme = computed(() => {
  const candidate = String(props.techTheme || "A2").toUpperCase();
  return ["A1", "A2", "A3", "A4", "A5"].includes(candidate) ? candidate : "A2";
});
const actualComponent = computed(() => {
  if (isScifiSkin.value) return `scifiButton${scifiTheme.value}`;
  return currentComponent.value || ElButton;
});
const normalizedType = computed(() => (props.type === "default" ? "" : props.type));
const mappedType = computed(() => {
  if (!isScifiSkin.value) return normalizedType.value;
  if (props.type === "info" || props.type === "text") return "default";
  return props.type || "default";
});
const mappedSize = computed(() => {
  if (!isScifiSkin.value) return props.size;
  return props.size || "default";
});
const scifiAppearance = computed(() => {
  if (!isScifiSkin.value) return undefined;
  // 映射到 scifiButton 的 A/B/C 变种，优先保证交互语义一致
  if (props.link) return "C";
  if (props.text) return "C";
  if (props.plain) return "B";

  switch (props.type) {
    case "success":
    case "info":
      return "B";
    case "warning":
    case "danger":
    case "text":
      return "C";
    case "primary":
    case "default":
    case "":
    default:
      return "A";
  }
});
const scifiBackgroundOpacity = computed(() => {
  if (!isScifiSkin.value) return undefined;
  if (props.link || props.text) return 0;
  if (props.plain) return 0.12;
  return 0.08;
});
const scifiClassName = computed(() => {
  if (!isScifiSkin.value) return undefined;
  const classes: string[] = [];
  if (props.loading) classes.push("is-active");
  if (props.circle) classes.push("is-circle");
  return classes.length ? classes.join(" ") : undefined;
});
const rootClass = computed(() => {
  if (isScifiSkin.value) return "";
  return resolvedSkin.value ? `sc-button-root skin--${resolvedSkin.value}` : "sc-button-root";
});
const rootDataSkin = computed(() => {
  if (isScifiSkin.value) return undefined;
  return resolvedSkin.value || undefined;
});

const normalizeSkin = (value: unknown) =>
  typeof value === "string" ? value.trim().toLowerCase() : "";

const resolvedSkin = computed(() => {
  const propSkin = normalizeSkin(props.skin);
  if (propSkin && propSkin !== "auto") {
    return propSkin;
  }

  const attrSkin = normalizeSkin(attrs["data-skin"]);
  if (attrSkin && attrSkin !== "auto") {
    return attrSkin;
  }

  if (typeof document !== "undefined") {
    const htmlSkin = normalizeSkin(
      document.documentElement?.getAttribute("data-skin"),
    );
    if (htmlSkin && htmlSkin !== "auto") {
      return htmlSkin;
    }

    const bodySkin = normalizeSkin(document.body?.getAttribute("data-skin"));
    if (bodySkin && bodySkin !== "auto") {
      return bodySkin;
    }
  }

  return "";
});

const handleClick = (event: MouseEvent) => {
  emit("click", event);
};
</script>

<style scoped>
.sc-button-root[data-skin="tech"],
.sc-button-root.skin--tech,
.sc-button-root[data-skin="tech-theme"],
.sc-button-root.skin--tech-theme {
  --sc-button-tech-line: #8ecde8;
  --sc-button-tech-line-strong: #53b6e3;
  --sc-button-tech-accent: #3ba6d8;
  --sc-button-tech-text: #1f5871;
  --sc-button-tech-bg: linear-gradient(180deg, #ffffff, #f2faff);
  font-family: "Bahnschrift", "DIN Alternate", "Microsoft YaHei", sans-serif;
  letter-spacing: 0.08em;
  border-color: var(--sc-button-tech-line) !important;
  color: var(--sc-button-tech-text) !important;
  background: var(--sc-button-tech-bg) !important;
  box-shadow:
    0 0 0 1px rgba(255, 255, 255, 0.72) inset,
    0 10px 24px rgba(35, 109, 142, 0.16),
    0 0 16px rgba(83, 182, 227, 0.2) !important;
}

.sc-button-root[data-skin="tech"]::before,
.sc-button-root.skin--tech::before,
.sc-button-root[data-skin="tech-theme"]::before,
.sc-button-root.skin--tech-theme::before {
  content: "";
  position: absolute;
  inset: 1px;
  border-radius: inherit;
  pointer-events: none;
  background:
    linear-gradient(120deg, rgba(142, 205, 232, 0.24), transparent 45%, rgba(83, 182, 227, 0.18));
  opacity: 0.9;
}

.sc-button-root[data-skin="tech"]:hover:not(.is-disabled),
.sc-button-root.skin--tech:hover:not(.is-disabled),
.sc-button-root[data-skin="tech-theme"]:hover:not(.is-disabled),
.sc-button-root.skin--tech-theme:hover:not(.is-disabled) {
  border-color: var(--sc-button-tech-line-strong) !important;
  color: #184d65 !important;
  background: linear-gradient(180deg, #ffffff, #e9f6ff) !important;
  box-shadow:
    0 0 0 1px rgba(255, 255, 255, 0.9) inset,
    0 14px 28px rgba(35, 109, 142, 0.2),
    0 0 22px rgba(83, 182, 227, 0.32) !important;
}

.sc-button-root[data-skin="tech"].is-plain,
.sc-button-root.skin--tech.is-plain,
.sc-button-root[data-skin="tech-theme"].is-plain,
.sc-button-root.skin--tech-theme.is-plain,
.sc-button-root[data-skin="tech"].is-text,
.sc-button-root.skin--tech.is-text,
.sc-button-root[data-skin="tech-theme"].is-text,
.sc-button-root.skin--tech-theme.is-text,
.sc-button-root[data-skin="tech"].is-link,
.sc-button-root.skin--tech.is-link,
.sc-button-root[data-skin="tech-theme"].is-link,
.sc-button-root.skin--tech-theme.is-link {
  background: rgba(83, 182, 227, 0.08) !important;
  color: var(--sc-button-tech-accent) !important;
  border-color: rgba(83, 182, 227, 0.36) !important;
  box-shadow: none !important;
}

.sc-button-root[data-skin="tech"].el-button--primary,
.sc-button-root.skin--tech.el-button--primary,
.sc-button-root[data-skin="tech-theme"].el-button--primary,
.sc-button-root.skin--tech-theme.el-button--primary {
  background: linear-gradient(135deg, #dff3ff, #b9e5fb) !important;
  color: #0f4b64 !important;
  border-color: #64bce4 !important;
}

.sc-button-root[data-skin="tech"].el-button--success,
.sc-button-root.skin--tech.el-button--success,
.sc-button-root[data-skin="tech-theme"].el-button--success,
.sc-button-root.skin--tech-theme.el-button--success {
  background: linear-gradient(135deg, #ebfff3, #caf5db) !important;
  color: #1d6a44 !important;
  border-color: rgba(91, 235, 164, 0.55) !important;
}

.sc-button-root[data-skin="tech"].el-button--warning,
.sc-button-root.skin--tech.el-button--warning,
.sc-button-root[data-skin="tech-theme"].el-button--warning,
.sc-button-root.skin--tech-theme.el-button--warning {
  background: linear-gradient(135deg, #fff8eb, #ffe9c8) !important;
  color: #8a5a1d !important;
  border-color: rgba(255, 184, 108, 0.58) !important;
}

.sc-button-root[data-skin="tech"].el-button--info,
.sc-button-root.skin--tech.el-button--info,
.sc-button-root[data-skin="tech-theme"].el-button--info,
.sc-button-root.skin--tech-theme.el-button--info {
  background: linear-gradient(135deg, #f5f9fc, #e6eef5) !important;
  color: #3e5f74 !important;
  border-color: rgba(132, 168, 194, 0.58) !important;
}

.sc-button-root[data-skin="tech"].el-button--danger,
.sc-button-root.skin--tech.el-button--danger,
.sc-button-root[data-skin="tech-theme"].el-button--danger,
.sc-button-root.skin--tech-theme.el-button--danger {
  background: linear-gradient(135deg, #fff0ec, #ffd9cf) !important;
  color: #8c3a2f !important;
  border-color: rgba(255, 143, 108, 0.55) !important;
}

.sc-button-root[data-skin="tech"].is-disabled,
.sc-button-root.skin--tech.is-disabled,
.sc-button-root[data-skin="tech-theme"].is-disabled,
.sc-button-root.skin--tech-theme.is-disabled {
  background: #f2f5f8 !important;
  border-color: #d4dfe7 !important;
  color: #94a8b5 !important;
  box-shadow: none !important;
}

.sc-button-root[data-skin="tech"].is-active,
.sc-button-root.skin--tech.is-active,
.sc-button-root[data-skin="tech-theme"].is-active,
.sc-button-root.skin--tech-theme.is-active {
  border-color: #45addd !important;
  background: linear-gradient(135deg, #d4efff, #b2e1fb) !important;
  color: #0f4b64 !important;
}

.sc-button-root[data-skin="tech-theme"],
.sc-button-root.skin--tech-theme {
  width: auto !important;
  max-width: max-content !important;
  display: inline-flex !important;
  vertical-align: middle;
}
</style>
