<script setup lang="ts">
import { useTranslationLang } from "../../../hooks/useTranslationLang";
import { getAllLanguageConfigs, getLanguageConfig } from "@repo/config";
import type { LanguageConfig } from "@repo/config";
import Check from "@iconify-icons/ep/check";
import { useDefer } from "@repo/utils";
import { computed } from "vue";
import ScDropdown from "@repo/components/ScDropdown";
import ScDropdownItem from "@repo/components/ScDropdownItem";
import ScDropdownMenu from "@repo/components/ScDropdownMenu";
import { ScText } from "@repo/components/ScText";

const { locale, translation } = useTranslationLang();
const languageConfigs = getAllLanguageConfigs();
const deferLang = useDefer(languageConfigs.length);
// 为运行时注入的 index 访问提供兜底，避免告警
const index = 0;

// 获取当前语言的配置
const currentLanguageConfig = computed(() => {
  const currentLocale =
    typeof locale.value === "string" ? locale.value : locale.value.value;
  return getLanguageConfig(currentLocale);
});

// 切换语言
const handleLanguageChange = (langCode: string) => {
  translation(langCode);
};
</script>

<template>
  <ScDropdown
    id="header-translation"
    trigger="click"
    popper-class="lang-dropdown-popper"
  >
    <div class="user-trigger lang-style">
      <div class="lang-icon-wrapper">
        <IconifyIconOnline icon="ri:translate-2" class="lang-main-icon" />
      </div>
      <div class="user-info">
        <ScText class="user-name">{{
          currentLanguageConfig.nativeName
        }}</ScText>
        <ScText class="user-role">{{
          locale === "zh-CN" ? "语言" : "Language"
        }}</ScText>
      </div>
      <span class="dropdown-arrow-wrapper">
        <IconifyIconOnline icon="ri:arrow-down-s-line" class="dropdown-arrow" />
      </span>
    </div>
    <template #dropdown>
      <ScDropdownMenu class="lang-menu">
        <div class="lang-header">
          <IconifyIconOnline icon="ri:global-line" />
          <ScText>选择语言</ScText>
        </div>
        <ScDropdownItem
          v-for="(langConfig, index) in languageConfigs"
          :key="langConfig.code"
          v-if="deferLang(index)"
          :class="[
            'lang-item',
            {
              active:
                (typeof locale === 'string' ? locale : locale.value) ===
                langConfig.code,
            },
          ]"
          @click="handleLanguageChange(langConfig.code)"
        >
          <div class="lang-item-content">
            <span class="lang-flag">{{ langConfig.flag }}</span>
            <div class="lang-info">
              <ScText class="lang-name">{{ langConfig.nativeName }}</ScText>
              <ScText class="lang-desc">{{ langConfig.description }}</ScText>
            </div>
          </div>
          <IconifyIconOffline
            v-show="
              (typeof locale === 'string' ? locale : locale.value) ===
              langConfig.code
            "
            class="lang-check"
            :icon="Check"
          />
        </ScDropdownItem>
      </ScDropdownMenu>
    </template>
  </ScDropdown>
</template>

<style lang="scss" scoped>
// 语言切换触发器
.lang-style {
  display: flex;
  align-items: center;
  gap: 6px;
  min-height: 40px;
  padding: 4px 8px 4px 4px;
  border-radius: 16px;
  max-width: 92px;
  background: linear-gradient(
    135deg,
    var(--el-fill-color-lighter) 0%,
    var(--el-fill-color-light) 100%
  );
  border: 1px solid var(--el-border-color-lighter);
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
  overflow: hidden;

  &::before {
    content: "";
    position: absolute;
    top: 0;
    left: -100%;
    width: 100%;
    height: 100%;
    background: linear-gradient(
      90deg,
      transparent,
      rgba(255, 255, 255, 0.2),
      transparent
    );
    transition: left 0.5s ease;
  }

  &:hover {
    background: linear-gradient(
      135deg,
      var(--el-fill-color-light) 0%,
      var(--el-fill-color) 100%
    );
    border-color: rgba(var(--el-color-primary-rgb), 0.3);
    box-shadow:
      0 4px 16px rgba(0, 0, 0, 0.1),
      0 2px 8px rgba(var(--el-color-primary-rgb), 0.1);
    transform: translateY(-1px);

    &::before {
      left: 100%;
    }

    .dropdown-arrow-wrapper {
      background: linear-gradient(
        135deg,
        var(--el-color-primary-light-8) 0%,
        var(--el-color-primary-light-9) 100%
      );
      box-shadow: 0 2px 6px rgba(var(--el-color-primary-rgb), 0.2);
      .dropdown-arrow {
        color: var(--el-color-primary);
      }
    }
  }

  .lang-icon-wrapper {
    width: 30px;
    height: 30px;
    flex-shrink: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    background: linear-gradient(
      135deg,
      var(--el-color-primary) 0%,
      var(--el-color-primary-light-3) 100%
    );
    border-radius: 50%;
    box-shadow: 0 2px 8px rgba(var(--el-color-primary-rgb), 0.3);

    .lang-main-icon {
      font-size: 13px;
      color: #fff;
    }
  }

  .user-info {
    display: flex;
    flex-direction: column;
    min-width: 0;
    max-width: 34px;
    line-height: 1.05;
  }

  .user-name {
    font-size: 11px;
    font-weight: 600;
    color: var(--el-text-color-primary);
    letter-spacing: 0.2px;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .user-role {
    display: none;
    font-size: 10px;
    color: var(--el-text-color-secondary);
    font-weight: 500;
  }

  .dropdown-arrow-wrapper {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 18px;
    height: 18px;
    border-radius: 50%;
    background: linear-gradient(
      135deg,
      var(--el-fill-color) 0%,
      var(--el-fill-color-light) 100%
    );
    margin-left: 1px;
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  }

  .dropdown-arrow {
    font-size: 12px;
    color: var(--el-text-color-placeholder);
    transition: all 0.3s ease;
  }
}
</style>
