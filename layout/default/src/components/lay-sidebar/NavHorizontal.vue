<script setup lang="ts">
import { useNav } from "../../hooks/useNav";
import { usePermissionStoreHook } from "@repo/core";
import { isAllEmpty } from "@pureadmin/utils";
import { computed, nextTick, ref } from "vue";
import { useTranslationLang } from "../../hooks/useTranslationLang";
import LayNotice from "../lay-notice/index.vue";
import LaySearch from "../lay-search/index.vue";
import LaySidebarFullScreen from "./components/SidebarFullScreen.vue";
import LaySidebarItem from "./components/SidebarItem.vue";

import GlobalizationIcon from "@repo/assets/svg/globalization.svg?component";
import { useDefer } from "@repo/utils";
import Check from "@iconify-icons/ep/check";
import LogoutCircleRLine from "@iconify-icons/ri/logout-circle-r-line";
import Setting from "@iconify-icons/ri/settings-3-line";
import { getConfig } from "@repo/config";
import Lock from "@iconify-icons/ep/lock";
import AccountSettingsIcon from "@iconify-icons/ri/user-settings-line";
import Restore from "@iconify-icons/line-md/backup-restore";

const menuRef = ref();

const { t, route, locale, translationCh, translationEn } =
  useTranslationLang(menuRef);

const {
  layout,
  device,
  logout,
  onPanel,
  pureApp,
  username,
  userAvatar,
  avatarsStyle,
  getLogo,
  backTopMenu,
  resolvePath,
  getDivStyle,
  toggleSideBar,
  clickClearRouter,
  gotoSecret,
  gotoAccountSetting,
  getDropdownItemStyle,
  getDropdownItemClass,
} = useNav();

const defaultActive = computed(() =>
  !isAllEmpty(route.meta?.activePath) ? route.meta.activePath : route.path,
);

const defer = useDefer(usePermissionStoreHook().wholeMenus.length);
const deferLang = useDefer(2);
nextTick(() => {
  menuRef.value?.handleResize();
});
const deferDropdown = useDefer(4);
</script>

<template>
  <div
    v-loading="usePermissionStoreHook().wholeMenus.length === 0"
    class="horizontal-header"
  >
    <div class="horizontal-header-left" @click="backTopMenu">
      <img :src="getLogo()" alt="logo" />
      <span>{{ getConfig().Title }}</span>
    </div>
    <el-menu
      ref="menuRef"
      mode="horizontal"
      popper-class="pure-scrollbar"
      class="horizontal-header-menu"
      :default-active="defaultActive"
    >
      <span
        v-for="(route, index) in usePermissionStoreHook().wholeMenus"
        :key="index"
      >
        <LaySidebarItem
          v-if="defer(index)"
          :key="route.path"
          :item="route"
          :base-path="route.path"
        />
      </span>
    </el-menu>
    <div class="horizontal-header-right">
      <!-- 菜单搜索 -->
      <LaySearch id="header-search" v-if="getConfig().showBarSearch" />
      <!-- 国际化 -->
      <el-dropdown id="header-translation" trigger="click">
        <GlobalizationIcon
          class="navbar-bg-hover w-[40px] h-[48px] p-[11px] cursor-pointer outline-none"
        />
        <template #dropdown>
          <el-dropdown-menu class="translation">
            <el-dropdown-item
              v-if="deferLang(0)"
              :style="getDropdownItemStyle(locale, 'zh-CN')"
              :class="[
                'dark:!text-white',
                getDropdownItemClass(locale, 'zh-CN'),
              ]"
              @click="translationCh"
            >
              <span v-show="locale === 'zh-CN'" class="check-zh">
                <IconifyIconOffline :icon="Check" />
              </span>
              简体中文
            </el-dropdown-item>
            <el-dropdown-item
              v-if="deferLang(1)"
              :style="getDropdownItemStyle(locale, 'en-US')"
              :class="[
                'dark:!text-white',
                getDropdownItemClass(locale, 'en-US'),
              ]"
              @click="translationEn"
            >
              <span v-show="locale === 'en-US'" class="check-en">
                <IconifyIconOffline :icon="Check" />
              </span>
              English
            </el-dropdown-item>
          </el-dropdown-menu>
        </template>
      </el-dropdown>
      <!-- 全屏 -->
      <LaySidebarFullScreen id="full-screen" />
      <!-- 消息通知 -->
      <LayNotice id="header-notice" v-if="getConfig().showBarNotice" />
      <!-- 退出登录 -->
      <el-dropdown trigger="click">
        <span class="el-dropdown-link navbar-bg-hover">
          <img :src="userAvatar" :style="avatarsStyle" />
          <p v-if="username" class="dark:text-white">{{ username }}</p>
        </span>
        <template #dropdown>
          <el-dropdown-menu class="logout">
            <div v-menu="['secret']">
              <el-dropdown-item
                v-if="deferDropdown(0)"
                class="item-line"
                @click="gotoSecret"
              >
                <IconifyIconOffline :icon="Lock" style="margin: 5px" />
                {{ t("buttons.secret") }}
              </el-dropdown-item>
            </div>
            <div v-menu="['user']">
              <el-dropdown-item
                v-if="deferDropdown(1)"
                class="item-line"
                @click="gotoAccountSetting"
              >
                <IconifyIconOffline
                  :icon="AccountSettingsIcon"
                  style="margin: 5px"
                />
                {{ t("buttons.accountSetting") }}
              </el-dropdown-item>
            </div>
            <el-dropdown-item
              v-if="deferDropdown(2)"
              class="item-line"
              @click="clickClearRouter"
            >
              <IconifyIconOffline :icon="Restore" style="margin: 5px" />
              {{ t("buttons.pureClearRouter") }}
            </el-dropdown-item>
            <div v-menu="['login']">
              <el-dropdown-item
                v-if="deferDropdown(3)"
                class="item-line"
                @click="logout"
              >
                <IconifyIconOffline
                  :icon="LogoutCircleRLine"
                  style="margin: 5px"
                />
                {{ t("buttons.pureLoginOut") }}
              </el-dropdown-item>
            </div>
          </el-dropdown-menu>
        </template>
      </el-dropdown>
      <span
        v-if="getConfig().showBarSetting"
        class="set-icon navbar-bg-hover"
        :title="t('buttons.pureOpenSystemSet')"
        @click="onPanel"
      >
        <IconifyIconOffline :icon="Setting" />
      </span>
    </div>
  </div>
</template>

<style lang="scss" scoped>
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
