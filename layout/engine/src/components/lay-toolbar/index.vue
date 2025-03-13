<script setup lang="ts">
import { useNav } from "../../hooks/useNav";
import { useTranslationLang } from "../../hooks/useTranslationLang";
//@ts-ignore
import GlobalizationIcon from "@repo/assets/svg/globalization.svg?component";
import AccountSettingsIcon from "@iconify-icons/ri/user-settings-line";
import Lock from "@iconify-icons/ep/lock";
import LogoutCircleRLine from "@iconify-icons/ri/logout-circle-r-line";
import Setting from "@iconify-icons/ri/settings-3-line";
import Check from "@iconify-icons/ep/check";
import Restore from "@iconify-icons/line-md/backup-restore";
import Version from "@iconify-icons/line-md/alert-circle";
import { getConfig } from "@repo/config";
import { useDefer } from "@repo/utils";

const { layout, device, logout, onPanel, pureApp, username, userAvatar, avatarsStyle, toggleSideBar, clickClearRouter, gotoSecret, gotoAccountSetting, getDropdownItemStyle, getDropdownItemClass } = useNav();

const { t, locale, translationCh, translationEn } = useTranslationLang();
const deferDropdown = useDefer(3);
const deferLang = useDefer(2);
</script>

<template>
  <!-- 国际化 -->
  <div v-if="getConfig().ShowLanguage">
    <el-dropdown id="header-translation" trigger="click">
      <GlobalizationIcon class="navbar-bg-hover w-[40px] h-[48px] p-[11px] cursor-pointer outline-none" />
      <template #dropdown>
        <el-dropdown-menu class="translation">
          <el-dropdown-item v-if="deferLang(0)" :style="getDropdownItemStyle(locale, 'zh-CN')" :class="['dark:!text-white', getDropdownItemClass(locale, 'zh-CN')]" @click="translationCh">
            <IconifyIconOffline v-show="locale === 'zh-CN'" class="check-zh" :icon="Check" />
            简体中文
          </el-dropdown-item>
          <el-dropdown-item v-if="deferLang(1)" :style="getDropdownItemStyle(locale, 'en-US')" :class="['dark:!text-white', getDropdownItemClass(locale, 'en-US')]" @click="translationEn">
            <span v-show="locale === 'en-US'" class="check-en">
              <IconifyIconOffline :icon="Check" />
            </span>
            English
          </el-dropdown-item>
        </el-dropdown-menu>
      </template>
    </el-dropdown>
  </div>
  <!-- 退出登录 -->
  <el-dropdown trigger="click">
    <span class="el-dropdown-link navbar-bg-hover select-none">
      <img :src="userAvatar" :style="avatarsStyle" />
      <p v-if="username" class="dark:text-white">{{ username }}</p>
    </span>
    <template #dropdown>
      <el-dropdown-menu class="logout">
        <div v-menu="['user']" v-if="deferDropdown(0)">
          <el-dropdown-item class="item-line" @click="gotoAccountSetting">
            <IconifyIconOffline :icon="AccountSettingsIcon" style="margin: 5px" />
            {{ t("buttons.accountSetting") }}
          </el-dropdown-item>
        </div>
        <div v-if="deferDropdown(1)">
          <el-dropdown-item class="item-line" @click="clickClearRouter">
            <IconifyIconOffline :icon="Restore" style="margin: 5px" />
            {{ t("buttons.pureClearRouter") }}
          </el-dropdown-item>
        </div>
        <div v-menu="['login']" v-if="deferDropdown(2)">
          <el-dropdown-item class="item-line" @click="logout">
            <IconifyIconOffline :icon="LogoutCircleRLine" style="margin: 5px" />
            {{ t("buttons.pureLoginOut") }}
          </el-dropdown-item>
        </div>
      </el-dropdown-menu>
    </template>
  </el-dropdown>
  <span v-if="getConfig().ShowBarSetting" class="set-icon navbar-bg-hover" :title="t('buttons.pureOpenSystemSet')" @click="onPanel">
    <IconifyIconOffline :icon="Setting" />
  </span>
  <span class="flex cursor-default" title="版本">
    {{ getConfig().Version }}
  </span>
</template>
