<template>
  <div class="koi-login-theme-trigger" @click="handleSwitchTheme">
    <el-tooltip :content="t('header.theme') || '主题'" placement="bottom">
      <el-icon :size="18" class="trigger-icon">
        <Brush />
      </el-icon>
    </el-tooltip>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from "vue";
import { useI18n } from "vue-i18n";
import { Brush } from "@element-plus/icons-vue";
import { useRouter, useRoute } from "vue-router";
import { getConfig, setConfig } from "@repo/config";

const { t } = useI18n();
const router = useRouter();
const route = useRoute();

const currentTheme = ref(getConfig()?.theme || "koi");

watch(
  () => getConfig()?.theme,
  (val) => {
    if (val) currentTheme.value = val;
  }
);

const handleSwitchTheme = () => {
  const next = currentTheme.value === "koi" ? "default" : "koi";
  currentTheme.value = next;
  setConfig("theme", next);
  setTimeout(() => router.replace(route.path), 50);
};
</script>

<style lang="scss" scoped>
.koi-login-theme-trigger {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s ease;
  color: var(--el-text-color-regular);

  &:hover {
    background: var(--el-fill-color-light);
    color: var(--el-color-primary);
    transform: translateY(-1px);
  }

  .trigger-icon {
    font-size: 18px;
  }
}
</style>
