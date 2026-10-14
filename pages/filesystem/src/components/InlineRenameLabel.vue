<script setup lang="ts">
import { nextTick, ref, watch } from "vue";

const props = withDefaults(
  defineProps<{
    /** 显示名称 */
    name: string;
    /** 是否处于行内编辑态 */
    active: boolean;
    /** 当前编辑草稿（父组件保存，避免组件自持状态导致 Enter/Blur 竞态） */
    draft: string;
    /** 是否为目录 */
    directory?: boolean;
    /** 非编辑态展示用的附加类名（如 fs-col__name / fs-lg-card__label） */
    className?: string;
    /** 非编辑态 title（默认使用名称） */
    title?: string;
  }>(),
  {
    directory: false,
    className: "",
    title: "",
  },
);

const emit = defineEmits<{
  (e: "update:draft", value: string): void;
  (e: "commit"): void;
  (e: "cancel"): void;
}>();

const inputRef = ref<HTMLInputElement | null>(null);

watch(
  () => props.active,
  async (active) => {
    if (!active) return;
    await nextTick();
    const input = inputRef.value;
    input?.focus();
    input?.select();
  },
);

function onInput(e: Event): void {
  emit("update:draft", (e.target as HTMLInputElement).value);
}
</script>

<template>
  <span
    v-if="active"
    :class="['fs-inline-rename', className]"
    @click.stop
    @contextmenu.stop
  >
    <input
      ref="inputRef"
      :value="draft"
      class="fs-inline-rename__input"
      spellcheck="false"
      @input="onInput"
      @keydown.enter.prevent="emit('commit')"
      @keydown.esc.prevent="emit('cancel')"
      @blur="emit('commit')"
    />
  </span>
  <span
    v-else
    :class="[className, { 'fs-name--dir': directory }]"
    :title="title || name"
  >
    {{ name }}
  </span>
</template>