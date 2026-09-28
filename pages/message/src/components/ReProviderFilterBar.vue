<script setup lang="ts">
/**
 * 提供商筛选条组件
 *
 * 顶部区域：标题 + 图标 + 提供商下拉选择 + 当前提供商标签，
 * 右侧通过默认插槽放置操作按钮（同步/新增等）。
 */
import type { Component } from "vue";
import type { MessageProvider } from "../api/types";

defineProps<{
  /** 标题 */
  title: string;
  /** 标题图标组件 */
  icon: Component;
  /** 提供商列表 */
  providers: MessageProvider[];
  /** 当前选中提供商 */
  currentProvider?: MessageProvider | null;
}>();

/** 选中提供商 ID（v-model:providerId） */
const providerId = defineModel<number | undefined>("providerId");

/** 提供商切换事件 */
const emit = defineEmits<{
  (e: "change"): void;
}>();
</script>

<template>
  <el-card shadow="never" class="rounded-xl border border-solid border-[--el-border-color-lighter]">
    <div class="flex flex-wrap items-center gap-3">
      <div class="flex items-center gap-2">
        <el-icon color="var(--el-color-primary)"><component :is="icon" /></el-icon>
        <span class="font-medium text-[--el-text-color-primary]">{{ title }}</span>
      </div>
      <el-select
        v-model="providerId"
        placeholder="查看全部"
        clearable
        class="!w-52"
        @change="emit('change')"
      >
        <el-option
          v-for="p in providers"
          :key="p.sysMessageProviderId"
          :label="p.sysMessageProviderName"
          :value="p.sysMessageProviderId"
        />
      </el-select>
      <el-tag v-if="currentProvider" effect="plain" type="info">
        {{ currentProvider.sysMessageProviderName }} · {{ currentProvider.sysMessageProviderType }}
      </el-tag>
      <div class="flex-1" />
      <slot />
    </div>
  </el-card>
</template>
