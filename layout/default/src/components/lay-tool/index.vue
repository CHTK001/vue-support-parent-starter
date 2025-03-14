<script setup lang="ts">
import { useNav } from "../../hooks/useNav";
import LaySearch from "../lay-search/index.vue";
import LayNotice from "../lay-notice/index.vue";
import { useTranslationLang } from "../../hooks/useTranslationLang";
import LaySidebarFullScreen from "../lay-sidebar/components/SidebarFullScreen.vue";
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

const { layout, device, logout, handleRefreshToken, onPanel, pureApp, username, userAvatar, avatarsStyle, toggleSideBar, clickClearRouter, gotoSecret, gotoAccountSetting, getDropdownItemStyle, getDropdownItemClass } = useNav();

const { t, locale, translationCh, translationEn } = useTranslationLang();
const deferDropdown = useDefer(2);
const deferLang = useDefer(2);
</script>

<template>
  <!-- 菜单搜索 -->
  <LaySearch v-if="getConfig().ShowBarSearch" id="header-search" />
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
  <!-- 全屏 -->
  <LaySidebarFullScreen id="full-screen" />
  <!-- 消息通知 -->
  <LayNotice v-if="getConfig().ShowBarNotice" id="header-notice" />
  <!-- 退出登录 -->
  <el-dropdown trigger="click">
    <span class="el-dropdown-link navbar-bg-hover select-none">
      <img :src="userAvatar" :style="avatarsStyle" />
      <p v-if="username" class="dark:text-white">{{ username }}</p>
    </span>
    <template #dropdown>
      <el-dropdown-menu class="logout">
        <div v-menu="['secret']">
          <el-dropdown-item class="item-line" @click="gotoSecret">
            <IconifyIconOffline :icon="Lock" style="margin: 5px" />
            {{ t("buttons.secret") }}
          </el-dropdown-item>
        </div>
        <div v-menu="['AccountSettings']">
          <el-dropdown-item class="item-line" @click="gotoAccountSetting">
            <IconifyIconOffline :icon="AccountSettingsIcon" style="margin: 5px" />
            {{ t("buttons.accountSetting") }}
          </el-dropdown-item>
        </div>
        <div>
          <el-dropdown-item class="item-line" @click="clickClearRouter">
            <IconifyIconOffline :icon="Restore" style="margin: 5px" />
            {{ t("buttons.pureClearRouter") }}
          </el-dropdown-item>
        </div>

        <div>
          <template v-if="getConfig().openShowRefreshToken">
            <el-dropdown-item class="item-line" @click="handleRefreshToken">
              <IconifyIconOffline :icon="LogoutCircleRLine" style="margin: 5px" />
              {{ t("buttons.refreshToken") }}
            </el-dropdown-item>
          </template>
        </div>

        <div v-menu="['Login']">
          <el-dropdown-item class="item-line" @click="logout">
            <IconifyIconOffline :icon="LogoutCircleRLine" style="margin: 5px" />
            {{ t("buttons.pureLoginOut") }}
          </el-dropdown-item>
        </div>
      </el-dropdown-menu>
    </template>
  </el-dropdown>
  <span v-if="getConfig().ShowBarSetting" class="set-icon navbar-bg-hover cursor-pointer" :title="t('buttons.pureOpenSystemSet')" @click="onPanel">
    <IconifyIconOffline :icon="Setting" />
  </span>
</template>

<style lang="scss" scoped>
.navbar {
  width: 100%;
  height: 48px;
  overflow: hidden;

  .hamburger-container {
    float: left;
    height: 100%;
    line-height: 48px;
    cursor: pointer;
  }

  .vertical-header-right {
    display: flex;
    align-items: center;
    justify-content: flex-end;
    min-width: 280px;
    height: 48px;
    color: #000000d9;

    .el-dropdown-link {
      display: flex;
      align-items: center;
      justify-content: space-around;
      height: 48px;
      padding: 10px;
      color: #000000d9;
      cursor: pointer;

      p {
        font-size: 12px;
      }

      img {
        width: 22px;
        height: 22px;
        border-radius: 50%;
      }
    }
  }

  .breadcrumb-container {
    float: left;
    margin-left: 16px;
  }
}

.translation {
  ::v-deep(.el-dropdown-menu__item) {
    padding: 5px 40px;
  }

  .check-zh {
    position: absolute;
    left: 20px;
  }

  .check-en {
    position: absolute;
    left: 20px;
  }
}

.logout {
  width: 160px;

  ::v-deep(.el-dropdown-menu__item) {
    display: inline-flex;
    flex-wrap: wrap;
    min-width: 100%;
    height: 38px;
  }
}
:deep(.el-loading-mask) {
  opacity: 0.45;
}

.translation {
  ::v-deep(.el-dropdown-menu__item) {
    padding: 5px 40px;
  }

  .check-zh {
    position: absolute;
    left: 20px;
  }

  .check-en {
    position: absolute;
    left: 20px;
  }
}

.logout {
  width: 120px;

  ::v-deep(.el-dropdown-menu__item) {
    display: inline-flex;
    flex-wrap: wrap;
    min-width: 100%;
  }
}
</style>
