<template>
  <!-- Spring Boot 用 Java 咖啡杯（带热气）标识，避免与通用 CPU/文件夹图标混淆 -->
  <svg
    v-if="isJava"
    class="project-type-icon project-type-icon--java"
    :width="size"
    :height="size"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    stroke-width="1.7"
    stroke-linecap="round"
    stroke-linejoin="round"
    aria-hidden="true"
  >
    <path d="M4.5 8.5h13l-1.1 5.7a4.8 4.8 0 0 1-4.7 3.9h-1.1a4.8 4.8 0 0 1-4.7-3.9L4.5 8.5z" />
    <path d="M17.5 9.5h1.3a2.3 2.3 0 0 1 0 4.6h-2.1" />
    <path d="M8 3c-.7 1.1.7 1.8 0 2.9M11.5 3c-.7 1.1.7 1.8 0 2.9" />
    <path d="M6 21h11" />
  </svg>
  <ReIcon v-else :name="name || 'Folder'" :size="size" />
</template>

<script setup lang="ts">
import { computed } from 'vue';
import ReIcon from '@repo/ui/re-icon';

const props = withDefaults(defineProps<{ name?: string; size?: number | string }>(), {
  name: '',
  size: 16,
});

/** `Java` 是内置标识，不是 Element Plus 图标名。 */
const isJava = computed(() => props.name === 'Java');
</script>
