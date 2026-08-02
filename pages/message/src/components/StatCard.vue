<script setup lang="ts">
/**
 * 统计卡片组件
 *
 * 展示一个指标（数字 + 标签 + 图标 + 描述），支持点击跳转，
 * 用于消息提供商主入口顶部的统计概览。
 */
import type { Component } from "vue";
import { Right } from "@element-plus/icons-vue";

defineProps<{
  /** 指标名称 */
  label: string;
  /** 指标数值 */
  value: number;
  /** 描述文字 */
  desc: string;
  /** 图标组件 */
  icon: Component;
}>();
</script>

<template>
  <el-card
    shadow="never"
    class="group cursor-pointer rounded-xl border border-solid border-[--el-border-color-lighter] transition-all duration-300 hover:border-[--el-color-primary]"
  >
    <div class="flex items-start justify-between">
      <div>
        <div class="text-sm text-[--el-text-color-secondary]">{{ label }}</div>
        <div class="mt-3 text-3xl font-bold tracking-tight text-[--el-text-color-primary]">
          {{ value }}
        </div>
      </div>
      <div
        class="rounded-xl bg-[--el-color-primary-light-9] p-3 transition-colors group-hover:bg-[--el-color-primary-light-8]"
      >
        <el-icon :size="20" color="var(--el-color-primary)">
          <component :is="icon" />
        </el-icon>
      </div>
    </div>
    <div
      class="mt-4 flex items-center gap-1 text-xs text-[--el-text-color-secondary] transition-colors group-hover:text-[--el-color-primary]"
    >
      {{ desc }}
      <el-icon :size="12"><Right /></el-icon>
    </div>
  </el-card>
</template>
