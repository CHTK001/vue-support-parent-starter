<template>
  <el-tooltip placement="left" :content="t('header.language')">
    <div class="koi-language-trigger">
      <el-dropdown @command="handleChangeLanguage">
        <KoiGlobalIcon name="koi-translate" size="18" class="koi-icon" />
        <template #dropdown>
          <el-dropdown-menu>
            <el-dropdown-item
              v-for="item in languageList"
              :key="item.value"
              :command="item.value"
              :disabled="globalStore.language === item.value"
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
import { ref, onMounted, watch, computed } from "vue";
import { useRoute } from "vue-router";
import { useI18n } from "vue-i18n";
import useGlobalStore from "@layout/koi/stores/modules/global";

const { t } = useI18n();
const route = useRoute();
const i18n = useI18n();
const globalStore = useGlobalStore();

const languageList = ref<{ label: string; value: string }[]>([]);

onMounted(() => {
  handleSwitchLanguage();
});

const handleSwitchLanguage = () => {
  // 当 language 变化时，手动触发 languageList 的更新
  languageList.value = [
    { label: t("header.languageList.chinese"), value: "zh" },
    { label: t("header.languageList.english"), value: "en" }
  ];
  document.title = t(String(route?.meta?.title || "login.pureLoginTitle"));
};

/** 监听 globalStore.language 的变化 */
watch(
  () => globalStore.language,
  () => {
    handleSwitchLanguage();
  }
);

const handleChangeLanguage = (lang: string) => {
  i18n.locale.value = lang;
  globalStore.setGlobalState("language", lang as any);
};
</script>

<style lang="scss" scoped>
.koi-language-trigger {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  border-radius: 6px;
  cursor: pointer;
  transition: background 0.5s ease;

  &:hover {
    background: var(--el-header-icon-hover-bg-color, rgba(0, 0, 0, 0.06));
  }

  :deep(.koi-icon) {
    color: var(--el-text-color-primary);
  }
}

html.dark .koi-language-trigger {
  &:hover {
    background: rgba(255, 255, 255, 0.1);
  }
}
</style>
