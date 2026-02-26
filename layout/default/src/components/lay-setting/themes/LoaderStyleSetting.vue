<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref, watch } from "vue";
import Segmented, { type OptionsType } from "@repo/components/ReSegmented";
import { ElMessage } from "element-plus";
import { LOADER_STYLES } from "@repo/components/ScRouteLoading/loader-manager";

interface Props {
  modelValue?: string;
}

const props = defineProps<Props>();
const emit = defineEmits<{
  (e: "update:modelValue", value: string): void;
}>();

const currentValue = ref<string>(
  props.modelValue || localStorage.getItem("sys-loader-style") || "default",
);

const loaderOptions = computed<Array<OptionsType>>(() =>
  Object.entries(LOADER_STYLES).map(([value, item]) => ({
    label: item.name,
    tip: item.description,
    value,
  })),
);

const loaderEntries = computed(() =>
  Object.entries(LOADER_STYLES).map(([key, item]) => ({
    key,
    name: item.name as string,
    description: item.description as string,
    html: item.html as string,
  })),
);

let previewStyleTag: HTMLStyleElement | null = null;

function applyPreviewStyle(type: string): void {
  if (typeof window === "undefined") {
    return;
  }

  const loader = LOADER_STYLES[type] || LOADER_STYLES.default;

  if (!previewStyleTag) {
    previewStyleTag = document.createElement("style");
    previewStyleTag.id = "loader-preview-style";
    document.head.appendChild(previewStyleTag);
  }

  previewStyleTag.textContent = loader.css;
}

function handleChange({ option }: { option: OptionsType }): void {
  const value = option.value as string;
  if (!value || value === currentValue.value) {
    return;
  }
  setCurrentValue(value);
}

function handleCardClick(key: string): void {
  if (!key || key === currentValue.value) {
    return;
  }
  setCurrentValue(key);
}

function setCurrentValue(value: string): void {
  currentValue.value = value;
  emit("update:modelValue", value);
  localStorage.setItem("sys-loader-style", value);
  applyPreviewStyle(value);

  ElMessage.success({
    message: "加载样式已更改，刷新页面后生效",
    duration: 2000,
  });
}

watch(
  () => props.modelValue,
  (val) => {
    if (val && val !== currentValue.value) {
      currentValue.value = val;
      applyPreviewStyle(val);
    }
  },
);

onMounted(() => {
  applyPreviewStyle(currentValue.value);
});

onUnmounted(() => {
  if (previewStyleTag && previewStyleTag.parentNode) {
    previewStyleTag.parentNode.removeChild(previewStyleTag);
  }
  previewStyleTag = null;
});
</script>

<template>
  <div class="setting-section">
    <div class="section-header">
      <IconifyIconOnline icon="ri:loader-4-line" class="section-icon" />
      <h3 class="section-title">加载动画样式</h3>
      <div class="section-description">选择页面加载时显示的动画效果</div>
    </div>
    <div class="setting-content">
      <div class="setting-item">
        <div class="setting-item-label">
          <span>动画样式</span>
          <span class="setting-item-desc">更改后需刷新页面生效</span>
        </div>
        <div class="setting-item-control">
          <Segmented
            :model-value="currentValue"
            :options="loaderOptions"
            @change="handleChange"
          />
        </div>
      </div>

      <div class="loader-preview-grid">
        <div
          v-for="item in loaderEntries"
          :key="item.key"
          class="loader-preview-item"
          :class="{ 'is-active': currentValue === item.key }"
          @click="handleCardClick(item.key)"
        >
          <div class="preview-box">
            <div class="loader-preview-inner" v-html="item.html"></div>
          </div>
          <span class="preview-label">{{ item.name }}</span>
          <div
            v-if="currentValue === item.key"
            class="preview-check"
          >
            <IconifyIconOnline icon="ri:check-line" />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.setting-section {
  margin-bottom: 24px;
}

.section-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 12px;
}

.section-icon {
  font-size: 20px;
  color: var(--el-color-primary);
}

.section-title {
  font-size: 16px;
  font-weight: 600;
  color: var(--el-text-color-primary);
}

.section-description {
  margin-left: auto;
  font-size: 12px;
  color: var(--el-text-color-secondary);
}

.setting-content {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.setting-item {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.setting-item-label {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 13px;
  color: var(--el-text-color-primary);
}

.setting-item-desc {
  font-size: 12px;
  color: var(--el-text-color-secondary);
}

.setting-item-control {
  width: 100%;
}

.loader-preview-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
  gap: 12px;
  margin-top: 4px;
}

.loader-preview-item {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  padding: 16px;
  background: radial-gradient(circle at top left, rgba(148, 163, 184, 0.12), transparent),
    var(--el-bg-color-overlay);
  border: 1px solid var(--el-border-color);
  border-radius: 14px;
  cursor: pointer;
  transition: all 0.25s ease;
  backdrop-filter: blur(10px);
}

.loader-preview-item:hover {
  border-color: var(--el-color-primary);
  transform: translateY(-3px) scale(1.01);
  box-shadow:
    0 8px 22px rgba(64, 110, 235, 0.25),
    0 0 0 1px rgba(64, 110, 235, 0.35);
}

.loader-preview-item.is-active {
  border-color: var(--el-color-primary);
  background: linear-gradient(
    135deg,
    rgba(64, 110, 235, 0.14),
    rgba(64, 110, 235, 0.04)
  );
  box-shadow:
    0 10px 26px rgba(64, 110, 235, 0.35),
    0 0 0 1px rgba(64, 110, 235, 0.5);
}

.preview-box {
  width: 100%;
  height: 80px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(
    145deg,
    rgba(15, 23, 42, 0.03),
    rgba(148, 163, 184, 0.06)
  );
  border-radius: 10px;
  box-shadow: inset 0 0 0 1px rgba(148, 163, 184, 0.25);
}

.loader-preview-inner {
  display: flex;
  align-items: center;
  justify-content: center;
}

.preview-label {
  font-size: 13px;
  font-weight: 500;
  color: var(--el-text-color-primary);
}

.preview-check {
  position: absolute;
  top: 8px;
  right: 8px;
  width: 22px;
  height: 22px;
  background: radial-gradient(circle at 30% 0, #ffffff, transparent 60%),
    var(--el-color-primary);
  color: #fff;
  border-radius: 999px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  box-shadow:
    0 6px 14px rgba(64, 110, 235, 0.55),
    0 0 0 1px rgba(255, 255, 255, 0.6);
}
</style>


