<script setup lang="ts">
import { useTranslationLang } from "../../../hooks/useTranslationLang";
import Check from "@iconify-icons/ep/check";
import { useDefer } from "@repo/utils";

const { locale, translationCh, translationEn } = useTranslationLang();
const deferLang = useDefer(2);
</script>

<template>
  <el-dropdown
    id="header-translation"
    trigger="click"
    popper-class="lang-dropdown-popper"
  >
    <div class="user-trigger lang-style">
      <div class="lang-icon-wrapper">
        <IconifyIconOnline icon="ri:translate-2" class="lang-main-icon" />
      </div>
      <div class="user-info">
        <span class="user-name">{{ locale === "zh-CN" ? "简体中文" : "English" }}</span>
        <span class="user-role">{{ locale === "zh-CN" ? "语言" : "Language" }}</span>
      </div>
      <span class="dropdown-arrow-wrapper">
        <IconifyIconOnline icon="ri:arrow-down-s-line" class="dropdown-arrow" />
      </span>
    </div>
    <template #dropdown>
      <el-dropdown-menu class="lang-menu">
        <div class="lang-header">
          <IconifyIconOnline icon="ri:global-line" />
          <span>选择语言</span>
        </div>
        <el-dropdown-item
          v-if="deferLang(0)"
          :class="['lang-item', { active: locale === 'zh-CN' }]"
          @click="translationCh"
        >
          <div class="lang-item-content">
            <span class="lang-flag">🇨🇳</span>
            <div class="lang-info">
              <span class="lang-name">简体中文</span>
              <span class="lang-desc">Simplified Chinese</span>
            </div>
          </div>
          <IconifyIconOffline
            v-show="locale === 'zh-CN'"
            class="lang-check"
            :icon="Check"
          />
        </el-dropdown-item>
        <el-dropdown-item
          v-if="deferLang(1)"
          :class="['lang-item', { active: locale === 'en-US' }]"
          @click="translationEn"
        >
          <div class="lang-item-content">
            <span class="lang-flag">🇺🇸</span>
            <div class="lang-info">
              <span class="lang-name">English</span>
              <span class="lang-desc">United States</span>
            </div>
          </div>
          <IconifyIconOffline
            v-show="locale === 'en-US'"
            class="lang-check"
            :icon="Check"
          />
        </el-dropdown-item>
      </el-dropdown-menu>
    </template>
  </el-dropdown>
</template>

<style lang="scss" scoped>
// 语言切换触发器
.lang-style {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 6px 14px 6px 6px;
  border-radius: 28px;
  background: linear-gradient(135deg, var(--el-fill-color-lighter) 0%, var(--el-fill-color-light) 100%);
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
    background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent);
    transition: left 0.5s ease;
  }

  &:hover {
    background: linear-gradient(135deg, var(--el-fill-color-light) 0%, var(--el-fill-color) 100%);
    border-color: rgba(var(--el-color-primary-rgb), 0.3);
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1), 0 2px 8px rgba(var(--el-color-primary-rgb), 0.1);
    transform: translateY(-1px);

    &::before { left: 100%; }

    .dropdown-arrow-wrapper {
      background: linear-gradient(135deg, var(--el-color-primary-light-8) 0%, var(--el-color-primary-light-9) 100%);
      box-shadow: 0 2px 6px rgba(var(--el-color-primary-rgb), 0.2);
      .dropdown-arrow { color: var(--el-color-primary); }
    }
  }

  .lang-icon-wrapper {
    width: 32px;
    height: 32px;
    flex-shrink: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    background: linear-gradient(135deg, var(--el-color-primary) 0%, var(--el-color-primary-light-3) 100%);
    border-radius: 50%;
    box-shadow: 0 2px 8px rgba(var(--el-color-primary-rgb), 0.3);

    .lang-main-icon { font-size: 16px; color: #fff; }
  }

  .user-info {
    display: flex;
    flex-direction: column;
    line-height: 1.3;
  }

  .user-name {
    font-size: 13px;
    font-weight: 600;
    color: var(--el-text-color-primary);
    letter-spacing: 0.2px;
  }

  .user-role {
    font-size: 11px;
    color: var(--el-text-color-secondary);
    font-weight: 500;
  }

  .dropdown-arrow-wrapper {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 22px;
    height: 22px;
    border-radius: 50%;
    background: linear-gradient(135deg, var(--el-fill-color) 0%, var(--el-fill-color-light) 100%);
    margin-left: 4px;
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  }

  .dropdown-arrow {
    font-size: 14px;
    color: var(--el-text-color-placeholder);
    transition: all 0.3s ease;
  }
}
</style>
