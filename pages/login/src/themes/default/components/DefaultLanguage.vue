<template>
  <el-tooltip placement="left" :content="t('header.language')">
    <div class="default-language-trigger">
      <el-dropdown @command="handleChangeLanguage">
        <el-icon :size="18"><component :is="TranslateIcon" /></el-icon>
        <template #dropdown>
          <el-dropdown-menu>
            <el-dropdown-item
              v-for="item in languageList"
              :key="item.value"
              :command="item.value"
              :disabled="currentLang === item.value"
            >
              {{ item.label }}
            </el-dropdown-item>
          </el-dropdown-menu>
        </template>
      </el-dropdown>
    </div>
  </el-tooltip>
</template>

<script setup lang="ts">
import { ref, computed } from "vue";
import { useI18n } from "vue-i18n";
import { SwitchFilled as TranslateIcon } from "@element-plus/icons-vue";

const { t, locale } = useI18n();

const currentLang = computed(() => locale.value);

const languageList = ref<{ label: string; value: string }[]>([
  { label: "中文", value: "zh" },
  { label: "English", value: "en" },
]);

const handleChangeLanguage = (lang: string) => {
  locale.value = lang;
};
</script>

<style lang="scss" scoped>
.default-language-trigger {
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

html.dark .default-language-trigger {
  &:hover {
    background: rgba(255, 255, 255, 0.1);
  }
}
</style>