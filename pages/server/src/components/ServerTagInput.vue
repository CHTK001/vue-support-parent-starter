<template>
  <div class="server-tag-input">
    <div class="server-tag-input__tags">
      <el-tag
        v-for="tag in tags"
        :key="tag"
        closable
        effect="plain"
        @close="removeTag(tag)"
      >
        {{ tag }}
      </el-tag>
      <button
        v-for="tag in visibleSuggestions"
        :key="tag"
        type="button"
        class="server-tag-input__suggestion"
        @click="addTag(tag)"
      >
        + {{ tag }}
      </button>
    </div>
    <ScInput
      v-model="draft"
      placeholder="输入标签后回车，支持多个标签"
      clearable
      @keydown.enter.prevent="commitDraft"
      @blur="commitDraft"
    >
      <template #prefix>
        <IconifyIconOnline icon="ri:price-tag-3-line" />
      </template>
    </ScInput>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from "vue";
import ScInput from "@repo/components/ScInput/index.vue";

const props = withDefaults(
  defineProps<{
    modelValue?: string[];
    suggestions?: string[];
  }>(),
  {
    modelValue: () => [],
    suggestions: () => [],
  },
);

const emit = defineEmits<{
  "update:modelValue": [value: string[]];
}>();

const draft = ref("");

const tags = computed(() => [
  ...new Set(
    (props.modelValue || [])
      .map((item) => String(item || "").trim())
      .filter(Boolean),
  ),
]);

const visibleSuggestions = computed(() =>
  (props.suggestions || [])
    .map((item) => String(item || "").trim())
    .filter((item) => item && !tags.value.includes(item))
    .slice(0, 6),
);

const updateTags = (next: string[]) => {
  emit("update:modelValue", [
    ...new Set(next.map((item) => item.trim()).filter(Boolean)),
  ]);
};

const addTag = (value: string) => {
  const tag = String(value || "").trim();
  if (!tag || tags.value.includes(tag)) {
    draft.value = "";
    return;
  }
  updateTags([...tags.value, tag]);
  draft.value = "";
};

const removeTag = (value: string) => {
  updateTags(tags.value.filter((item) => item !== value));
};

const commitDraft = () => {
  if (!draft.value.trim()) {
    draft.value = "";
    return;
  }
  const items = draft.value
    .split(/[,，]/)
    .map((item) => item.trim())
    .filter(Boolean);
  updateTags([...tags.value, ...items]);
  draft.value = "";
};
</script>

<style scoped lang="scss">
.server-tag-input {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.server-tag-input__tags {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.server-tag-input__suggestion {
  border: 1px dashed
    color-mix(in srgb, var(--el-color-primary) 40%, transparent);
  background: color-mix(in srgb, var(--el-color-primary) 8%, white);
  color: var(--el-color-primary);
  border-radius: 999px;
  padding: 0 12px;
  height: 28px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.server-tag-input__suggestion:hover {
  border-style: solid;
  background: color-mix(in srgb, var(--el-color-primary) 16%, white);
}
</style>
