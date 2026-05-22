<template>
  <header class="pm-surface">
    <div class="pm-surface__heading">
      <router-link v-if="route.path !== prefixedRoot && route.path !== prefixedHome" :to="prefixedHome" class="pm-surface__back-link">
        <el-tooltip content="返回台账" placement="bottom">
          <el-icon><ArrowLeft /></el-icon>
        </el-tooltip>
      </router-link>
      <div>
        <p v-if="eyebrow" class="pm-surface__eyebrow">{{ eyebrow }}</p>
        <h1 v-if="title" class="pm-surface__title">{{ title }}</h1>
        <p v-if="description" class="pm-surface__desc">{{ description }}</p>
        <slot name="info" />
      </div>
    </div>
    <div v-if="$slots.actions || actionsSlot" class="pm-surface__actions">
      <slot name="actions" />
    </div>
  </header>
</template>

<script setup lang="ts">
import { ArrowLeft } from "@element-plus/icons-vue";
import { useRoute } from "vue-router";
import { withPrefix } from "../../config";

const route = useRoute();
const prefixedRoot = withPrefix("/");
const prefixedHome = withPrefix("/home");

defineProps<{
  eyebrow?: string;
  title?: string;
  description?: string;
  actionsSlot?: boolean;
}>();
</script>

<style scoped>
.pm-surface__heading {
  display: flex;
  align-items: flex-start;
  gap: 12px;
}

.pm-surface__back-link {
  display: inline-flex;
  align-items: center;
  margin-top: 4px;
  font-size: 16px;
  color: #64748b;
  text-decoration: none;
  transition: color 0.15s;
}

.pm-surface__back-link:hover {
  color: #3b82f6;
}
</style>
