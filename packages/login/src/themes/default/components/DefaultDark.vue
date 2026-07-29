<template>
  <div class="default-dark-trigger" @click="handleToggle">
    <el-tooltip :content="t('header.darkMode')" v-if="!isDark">
      <el-icon :size="18"><Moon /></el-icon>
    </el-tooltip>
    <el-tooltip :content="t('header.lightMode')" v-if="isDark">
      <el-icon :size="20"><Sunny /></el-icon>
    </el-tooltip>
  </div>
</template>

<script setup lang="ts">
import { ref } from "vue";
import { useI18n } from "vue-i18n";
import { Moon, Sunny } from "@element-plus/icons-vue";

const { t } = useI18n();
const isDark = ref(false);

const handleToggle = () => {
  isDark.value = !isDark.value;
  const cls = document.documentElement.classList;
  if (isDark.value) {
    cls.add("dark");
  } else {
    cls.remove("dark");
  }
};
</script>

<style lang="scss" scoped>
.default-dark-trigger {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  border-radius: 6px;
  cursor: pointer;
  color: var(--el-text-color-primary);
  transition: background 0.5s ease;

  &:hover {
    background: rgba(0, 0, 0, 0.06);
  }
}

html.dark .default-dark-trigger {
  &:hover {
    background: rgba(255, 255, 255, 0.1);
  }
}
</style>