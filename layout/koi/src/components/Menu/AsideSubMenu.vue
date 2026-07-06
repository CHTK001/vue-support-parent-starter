<template>
  <template v-for="item in menuList" :key="item.path">
    <el-sub-menu v-if="item.children?.length" :index="item.path">
      <template #title>
        <el-tooltip :content="item.meta?.title" :show-after="1500" placement="right">
          <div class="menu-title-wrap">
            <div class="icon-container">
              <el-icon class="menu-icon" :size="18">
                <component :is="resolveIcon(item.meta?.icon) || Document" />
              </el-icon>
            </div>
            <span class="menu-ellipsis" v-text="item.meta?.title"></span>
          </div>
        </el-tooltip>
      </template>
      <AsideSubMenu :menuList="item.children" />
    </el-sub-menu>
    <el-menu-item v-else :index="item.path" @click="handleMenuRouter(item)">
      <template #title>
        <el-tooltip :content="item.meta?.title" :show-after="1500" placement="right">
          <div class="menu-title-wrap">
            <div class="icon-container">
              <el-icon class="menu-icon" :size="18">
                <component :is="resolveIcon(item.meta?.icon) || Document" />
              </el-icon>
            </div>
            <span class="menu-ellipsis" v-text="item.meta?.title"></span>
          </div>
        </el-tooltip>
      </template>
    </el-menu-item>
  </template>
</template>

<script setup lang="ts">
import { koiMsgWarning } from "../../utils/koi";
import { useRouter } from "vue-router";
import * as ElementPlusIcons from "@element-plus/icons-vue";
import { Document } from "@element-plus/icons-vue";

const router = useRouter();
defineProps(["menuList"]);

const ICON_MAP: Record<string, string> = {
  "ep:home-filled": "HomeFilled",
  "ep:odometer": "Odometer",
  "ep:setting": "Setting",
  "ep:user": "User",
  "ep:flag": "Flag",
  "ep:menu": "Menu",
  "ep:office-building": "OfficeBuilding",
  "ep:document": "Document",
  "ep:key": "Key",
  "ep:lock": "Lock",
  "ep:bell": "Bell",
  "ep:upload": "Upload",
  "ep:download": "Download",
  "ep:monitor": "Monitor",
  "ep:cpu": "Cpu",
  "ep:files": "Files",
  "ep:notebook": "Notebook",
  "ep:chat-line-round": "ChatLineRound",
  "ep:grid": "Grid",
  "ep:stamp": "Stamp",
  "ep:ticket": "Ticket",
  "ep:message": "Message",
  "ep:picture": "Picture",
  "ep:link": "Link",
  "ep:star": "Star",
  "ep:alarm-clock": "AlarmClock",
  "ri:shield-user-line": "User",
  "ri:user-settings-line": "User",
  "ri:feedback-line": "ChatDotRound",
  "ri:settings-3-line": "Setting",
  "humbleicons:dashboard": "DataAnalysis",
};

const resolveIcon = (name: string) => {
  const cleanName = name.replace(/^ep:/, "");
  const mapped = ICON_MAP[name] || ICON_MAP[`ep:${cleanName}`] || cleanName;
  return (ElementPlusIcons as any)[mapped] || null;
};

const handleMenuRouter = (value: any) => {
  if (value.meta?.linkUrl) {
    if (/^https?:\/\//.test(value.meta?.linkUrl)) {
      return window.open(value.meta.linkUrl, "_blank");
    } else {
      koiMsgWarning("Invalid link, navigation forbidden");
      return;
    }
  }
  router.push(value.path);
};
</script>

<style lang="scss" scoped>
@use "../../styles/variables.scss" as *;

.menu-title-wrap {
  display: flex;
  align-items: center;
  gap: 2px;
  width: 100%;
}

.menu-ellipsis {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  position: relative;
  transform: translate($aside-menu-font-icon-translate);
}

.icon-container {
  display: inline-block;
  flex-shrink: 0;
  transform: translate($aside-menu-font-icon-translate);
}

.menu-icon {
  display: block;
  transition: transform 0.3s ease;
}

.el-menu-item {
  height: $aside-menu-height !important;
  margin-bottom: $aside-menu-margin-bottom;
  font-weight: $aside-menu-font-weight;
  --el-menu-item-height: $aside-menu-height;
  color: var(--el-menu-text-color);
  user-select: none;
  border-radius: $aside-menu-border-left;

  &:hover {
    color: var(--el-menu-hover-text-color);
    background: var(--el-menu-hover-bg-color);
    border-radius: $aside-menu-border-left;

    .menu-icon {
      color: var(--el-menu-hover-text-color);
      animation: koi-icon-scale 0.6s ease-in-out forwards;
    }
  }

  &.is-active {
    color: var(--el-menu-active-text-color);
    background: var(--el-menu-active-bg-color);

    &::before {
      border-left: $aside-menu-border-left solid var(--el-menu-border-left-color);
      z-index: auto;
      content: "";
      background-color: transparent;
      position: absolute;
      left: 0;
      right: 0;
      top: 0;
      bottom: 0;
      pointer-events: none;
      border-radius: $aside-menu-border-left;
      transition: background-color .3s ease-in-out;
    }

    .menu-icon {
      color: var(--el-menu-active-text-color);
    }
  }
}

:deep(.el-sub-menu__title) {
  height: $aside-menu-height;
  padding-right: 0;
  margin-bottom: $aside-menu-margin-bottom;
  font-weight: $aside-menu-font-weight;
  color: var(--el-menu-text-color);
  user-select: none;
  border-radius: $aside-menu-border-left;

  .icon-container {
    transform: translate($aside-menu-font-icon-translate);
  }

  &:hover {
    color: var(--el-menu-hover-text-color);
    background: var(--el-menu-hover-bg-color);

    .menu-icon {
      animation: koi-icon-scale 0.6s ease-in-out forwards;
      color: var(--el-menu-hover-text-color);
    }
  }
}

@keyframes koi-icon-scale {
  0% { transform: scale(1); box-shadow: 0 0 0 0 rgba(255, 204, 0, 0); }
  70% { transform: scale(1.12); box-shadow: 0 0 0 15px rgba(255, 204, 0, 0); }
  100% { transform: scale(1); box-shadow: 0 0 0 0 rgba(255, 204, 0, 0); }
}
</style>

<style lang="scss">
.el-sub-menu.is-active > .el-sub-menu__title {
  color: var(--el-menu-parent-active-text-color) !important;
  .menu-icon { color: var(--el-menu-parent-active-text-color) !important; }
}

.el-popper.is-pure { border: none !important; outline: none !important; }

.el-menu--popup-container {
  .el-menu--popup {
    border: none !important;
    outline: none !important;
    .el-menu-item { border: none !important; outline: none !important; }
    .el-sub-menu {
      border: none !important;
      outline: none !important;
      .el-sub-menu__title { border: none !important; outline: none !important; }
    }
  }
}

.el-menu--popup {
  border: none !important;
  outline: none !important;
  .el-menu-item, .el-sub-menu, .el-sub-menu__title {
    border: none !important;
    outline: none !important;
  }
}
</style>
