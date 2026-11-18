<!--
  页签面板的统一外壳：过滤框 + 计数 + 刷新 + 错误提示 + 内容区。

  为什么要有这层：11 个页签的数据形态各不相同，但「工具条长什么样、报错怎么显示、
  内容区怎么滚」必须完全一致 —— 每个页签各写一遍，过两周就会有一个页签的刷新按钮
  跑到左边、另一个页签的报错是一行裸红字。
-->
<template>
  <div class="act">
    <div class="act__bar">
      <ReInput
        v-if="searchable"
        v-model="keyword"
        layout="modern"
        :placeholder="placeholder"
        clearable
        class="act__search"
      />
      <span class="act__count">{{ countText }}</span>
      <div class="act__bar-right">
        <ReButton layout="modern" icon="Refresh" :loading="loading" @click="emit('refresh')">刷新</ReButton>
      </div>
    </div>

    <div v-if="error" class="act__empty is-error">{{ error }}</div>
    <div v-else class="act__body">
      <slot />
    </div>

    <p class="act__hint">Base: /actuator · {{ ACTUATOR_ENDPOINTS.length }} 个端点</p>
  </div>
</template>

<script setup lang="ts" name="ActuatorTabShell">
/**
 * 页签外壳。
 *
 * <p>关键字用 {@code v-model} 双向绑定到页签自己的 composable —— 过滤是纯前端行为，
 * 不需要也不应该再发一次请求。</p>
 */
import ReInput from "@repo/ui/re-input";
import ReButton from "@repo/ui/re-button";
import { ACTUATOR_ENDPOINTS } from "../endpoints";

withDefaults(
  defineProps<{
    /** 是否显示关键字输入框（health / info / metrics / scheduledtasks 不需要） */
    searchable?: boolean;
    /** 输入框占位文案 */
    placeholder?: string;
    /** 右上角统计文案（如「共 12 项」） */
    countText?: string;
    /** 是否正在加载（刷新按钮转圈） */
    loading?: boolean;
    /** 错误文案；非空时内容区换成提示 */
    error?: string;
  }>(),
  {
    searchable: true,
    placeholder: "过滤…",
    countText: "",
    loading: false,
    error: "",
  },
);

/** 过滤词（页签自己的 ref） */
const keyword = defineModel<string>({ default: "" });

const emit = defineEmits<{
  /** 点击刷新（页签自己决定刷新哪些数据源） */
  (e: "refresh"): void;
}>();
</script>
