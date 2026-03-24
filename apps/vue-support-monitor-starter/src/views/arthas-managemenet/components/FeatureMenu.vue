<template>
  <el-menu class="feature-menu" :default-active="modelValue" @select="onSelect">
    <el-menu-item v-for="f in features" :key="f.key" :index="f.key">
      <IconifyIconOnline :icon="f.icon" class="mr-2" />
      <span>{{ f.title }}</span>
    </el-menu-item>
  </el-menu>
</template>

<script setup lang="ts">
interface FeatureItem {
  key: string;
  title: string;
  icon?: string;
}

const props = defineProps<{
  features: FeatureItem[];
  modelValue: string;
}>();
const emit = defineEmits(["update:modelValue", "select"]);

function onSelect(key: string) {
  emit("update:modelValue", key);
  emit("select", key);
}
</script>

<style scoped lang="scss">
.feature-menu {
  border-right: none;
}
.mr-2 {
  margin-right: 6px;
}


/* 响应式设计 */
@media (max-width: 768px) {
  .page-header {
    flex-direction: column;
    gap: 12px;
    padding: 12px 16px;
  }
}

</style>
