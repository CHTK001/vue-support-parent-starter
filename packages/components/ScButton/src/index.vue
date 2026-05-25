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
import { useScifiComponent } from "../../hooks/useScifiComponent";
import { scButtonProps } from "./buttonProps";

const props = defineProps(scButtonProps);
const attrs = useAttrs();

const emit = defineEmits<{
  (e: "click", event: MouseEvent): void;
}>();

const { currentComponent } = useThemeComponent("ElButton");

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

const isScifiSkin = computed(() => resolvedSkin.value === "scifi" || resolvedSkin.value === "tech");
const SCIFI_BUTTON_THEMES = ["A1", "A2", "A3", "A4", "A5", "Dash", "Exo", "Fin", "Hex", "Pod"] as const;
const scifiTheme = computed(() => {
  const candidate = String(props.techTheme || "A2");
  return (SCIFI_BUTTON_THEMES as readonly string[]).includes(candidate) ? candidate : "A2";
});

// 异步加载 @techui/scifi — 仅在 skin="tech" 时触发
const scifiComponentName = computed(() => `ScifiButton${scifiTheme.value}`);
const { resolvedComponent } = useScifiComponent(scifiComponentName, isScifiSkin);

const actualComponent = computed(() => {
  if (resolvedComponent.value) return resolvedComponent.value;
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

const handleClick = (event: MouseEvent) => {
  emit("click", event);
};
</script>

<style scoped>
</style>
