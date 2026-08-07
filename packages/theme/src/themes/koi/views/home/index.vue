<template>
  <div class="home-card">
    <div class="home-card__welcome">
      <div class="home-welcome">
        <img
          class="home-welcome__avatar"
          :src="
            authStore.loginUser?.avatar ||
            'https://avatars.githubusercontent.com/u/185870639?v=4&size=64'
          "
          alt="avatar"
        />
        <div class="home-welcome__content">
          <div class="home-welcome__greeting">{{ greetingText }}</div>
          <div class="home-welcome__subtitle">
            一款有「鲤」的后台框架——简约而不简单，欢迎回来
            <span class="home-welcome__name">{{ authStore.loginUser?.loginName || "管理员" }}</span>
          </div>
        </div>
      </div>

      <button
        v-if="customLayoutButton"
        type="button"
        class="home-card__layout-btn"
        :title="layoutTitle"
        :aria-label="layoutTitle"
        @click="cycleLayout"
      >
        <span class="home-card__layout-btn-icon">
          <svg viewBox="0 0 20 20" fill="currentColor" width="16" height="16">
            <path v-if="currentLayout === 'grid'" d="M3 3h6v6H3V3zm0 8h6v6H3v-6zm8-8h6v6h-6V3zm0 8h6v6h-6v-6z" />
            <path v-else-if="currentLayout === 'columns'" d="M3 3h6v14H3V3zm8 0h6v14h-6V3z" />
            <path v-else-if="currentLayout === 'rows'" d="M3 3h14v6H3V3zm0 8h14v6H3v-6z" />
            <path v-else d="M3 3h14v14H3V3zm2 2v10h10V5H5z" />
          </svg>
        </span>
        <span class="home-card__layout-btn-label">{{ layoutLabel }}</span>
      </button>
    </div>

    <slot />
  </div>
</template>

<script setup lang="ts" name="homePage">
import { computed, ref } from "vue";
import { getDayText } from "@repo/utils";
import { getConfig } from "@repo/config";
import useAuthStore from "@repo/pinia/modules/auth";

const authStore = useAuthStore();

const greetingText = computed(() => {
  return getDayText() || "您好，愿您天天开心，事事如意！";
});

/** 是否显示自定义布局按钮（受 app.yaml other.home.customLayoutButton 控制，默认 true） */
const customLayoutButton = computed(() => {
  return getConfig().other.home?.customLayoutButton !== false;
});

/** 当前布局模式（grid / columns / rows / default），可被父级 v-model:currentLayout 控制 */
const props = withDefaults(
  defineProps<{
    layout?: "default" | "grid" | "columns" | "rows";
  }>(),
  { layout: "default" },
);
const emit = defineEmits<{
  (e: "update:layout", v: "default" | "grid" | "columns" | "rows"): void;
}>();

const internalLayout = ref<"default" | "grid" | "columns" | "rows">(props.layout);
const currentLayout = computed<"default" | "grid" | "columns" | "rows">(() => props.layout ?? internalLayout.value);

const LAYOUT_CYCLE: Array<"default" | "grid" | "columns" | "rows"> = ["default", "grid", "columns", "rows"];
const LAYOUT_LABEL: Record<"default" | "grid" | "columns" | "rows", string> = {
  default: "默认布局",
  grid: "网格布局",
  columns: "分栏布局",
  rows: "分列布局",
};
const layoutLabel = computed(() => LAYOUT_LABEL[currentLayout.value]);
const layoutTitle = computed(() => `布局：${layoutLabel.value}`);

function cycleLayout(): void {
  const cur = currentLayout.value;
  const idx = LAYOUT_CYCLE.indexOf(cur);
  const next = LAYOUT_CYCLE[(idx + 1) % LAYOUT_CYCLE.length];
  internalLayout.value = next;
  emit("update:layout", next);
}
</script>

<style lang="scss" scoped>
.home-card {
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  padding: 12px 16px 16px;
  border-radius: 8px;
  gap: 12px;
}

.home-card__welcome {
  display: flex;
  align-items: stretch;
  justify-content: space-between;
  gap: 12px;
}

.home-card__layout-btn {
  flex-shrink: 0;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  height: auto;
  align-self: center;
  padding: 6px 12px;
  border: 1px solid var(--el-border-color-lighter);
  background: var(--el-fill-color-blank);
  color: var(--el-text-color-regular);
  border-radius: 8px;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  font-family: inherit;
  transition:
    border-color 0.2s,
    background-color 0.2s,
    color 0.2s,
    box-shadow 0.2s;
}

.home-card__layout-btn:hover {
  border-color: var(--el-color-primary);
  color: var(--el-color-primary);
  background: color-mix(in srgb, var(--el-color-primary) 4%, var(--el-fill-color-blank));
  box-shadow: 0 2px 8px color-mix(in srgb, var(--el-color-primary) 12%, transparent);
}

.home-card__layout-btn:active {
  background: color-mix(in srgb, var(--el-color-primary) 8%, var(--el-fill-color-blank));
}

.home-card__layout-btn-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

.home-card__layout-btn-label {
  letter-spacing: 0.02em;
}

.home-welcome {
  display: flex;
  align-items: center;
  gap: 16px;
  flex: 1;
  min-width: 0;
  min-height: 76px;
  padding: 16px 20px;
  background: var(--el-bg-color);
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 8px;
}

.home-welcome__avatar {
  width: 56px;
  height: 56px;
  object-fit: cover;
  border: 2px solid color-mix(in srgb, var(--el-color-primary) 18%, transparent);
  border-radius: 50%;
  user-select: none;
}

.home-welcome__greeting {
  font-size: 20px;
  font-weight: 700;
  line-height: 1.3;
  color: var(--el-text-color-primary);
}

.home-welcome__subtitle {
  margin-top: 8px;
  font-size: 13px;
  line-height: 1.6;
  color: var(--el-text-color-secondary);
}

.home-welcome__name {
  margin-left: 4px;
  font-weight: 600;
  color: var(--el-color-primary);
}
</style>