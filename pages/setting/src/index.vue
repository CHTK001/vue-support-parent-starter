<script setup>
import { defineAsyncComponent, nextTick, reactive, ref, shallowRef } from "vue";
const SaveLayoutRaw = defineAsyncComponent(() => import("./layout/base.vue"));
const SaveItem = defineAsyncComponent(() => import("./admin/index.vue"));

import { useRenderIcon } from "@repo/components/ReIcon/src/hooks";
import { getConfig } from "@repo/config";
import { localStorageProxy } from "@repo/utils";
import { useI18n } from "vue-i18n";
const localStorageProxyObject = localStorageProxy();

const SETTING_TAB_VALUE = "setting-tab-value";

const { t } = useI18n();

const config = reactive({
  tabValue: localStorageProxyObject.getItem(SETTING_TAB_VALUE) || "default",
  saveItemStatus: false,
});

const saveItemRef = ref();
const data = reactive([]);
const layout = reactive({
  sms: defineAsyncComponent(() => import("./layout/sms.vue")),
  email: defineAsyncComponent(() => import("./layout/email.vue")),
});
const productsConfig = reactive([
  {
    group: "default",
    description: t("product.default"),
    name: "基础设置",
    isSetup: true,
    type: 5,
    icon: "ri:airplay-fill",
    hide: false,
  },
  {
    group: "config",
    description: t("product.config"),
    name: "系统设置",
    isSetup: true,
    type: 4,
    icon: "ri:export-line",
    hide: false,
  },

  {
    group: "weixin",
    name: "微信设置",
    isSetup: true,
    type: 4,
    icon: "simple-icons:wechat",
    hide: !(getConfig().OpenSettingWeixin || !0),
  },
  {
    group: "gitee",
    name: "Gitee设置",
    isSetup: true,
    type: 4,
    icon: "simple-icons:gitee",
    hide: !(getConfig().OpenSettingGitee || !0),
  },
  {
    group: "email",
    name: "邮件设置",
    isSetup: true,
    type: 4,
    icon: "bi:mailbox2",
    project: true,
    hide: !(getConfig().OpenSettingEmail || !1),
  },
  {
    group: "sms",
    name: "短信设置",
    isSetup: true,
    type: 4,
    icon: "ri:phone-find-line",
    project: true,
    hide: !(getConfig().OpenSettingSms || !1),
  },
  {
    group: "llm",
    name: "大语言模型设置",
    isSetup: true,
    type: 4,
    icon: "ri:login-box-fill",
    hide: !(getConfig().OpenSettingLlm || !1),
  },
  {
    group: "webrtc",
    name: "WebRtc设置",
    isSetup: true,
    type: 4,
    icon: "ri:login-box-fill",
    hide: !(getConfig().OpenSettingWebrtc || !1),
  },
  {
    group: "sso",
    name: "SSO设置",
    isSetup: true,
    type: 4,
    icon: "ri:login-box-fill",
    hide: !(getConfig().OpenSettingSso || !0),
  },
]);

const products = productsConfig.filter((it) => !it.hide);
const saveLayout = shallowRef();
const visible = reactive({
  detail: {
    default: true,
  },
  v1Index: false,
});

const onRowClick = async (it) => {
  const _tabValue = config.tabValue;
  localStorageProxyObject.setItem(SETTING_TAB_VALUE, _tabValue);
  const item = products.filter((item) => item.group === _tabValue)[0];
  products.forEach((item) => {
    if (item.group !== _tabValue) {
      visible.detail[item.group] = false;
    }
  });
  visible.detail[_tabValue] = true;
};
if (localStorageProxyObject.getItem(SETTING_TAB_VALUE)) {
  onRowClick(null);
}
const close = async (group) => {
  visible.detail[group] = false;
};

const handleOpenItemDialog = async () => {
  config.saveItemStatus = true;
  await nextTick();
  saveItemRef.value?.open();
};

const handleCloseItemDialog = async () => {
  config.saveItemStatus = false;
};
</script>
<template>
  <div class="app-container h-full modern-setting-container">
    <el-button :icon="useRenderIcon('ri:settings-4-line')" class="floating-settings-btn" type="primary" circle @click="handleOpenItemDialog" />
    <el-tabs v-model="config.tabValue" class="modern-tabs" @tab-change="onRowClick">
      <el-tab-pane v-for="item in products" :key="item.name" :name="item.group" class="h-full">
        <template #label>
          <span class="custom-tabs-label">
            <el-icon class="tab-icon">
              <component :is="useRenderIcon(item.icon)" />
            </el-icon>
            <span class="tab-text">{{ item.name }}</span>
          </span>
        </template>
        <template v-if="item.project">
          <component :is="layout[item.group]" :data="item" :key="item.group"></component>
        </template>
        <template v-else>
          <SaveLayoutRaw v-if="visible.detail[item.group]" ref="saveLayout" :data="item" @close="close(item.group)" />
        </template>
      </el-tab-pane>
    </el-tabs>

    <SaveItem ref="saveItemRef" @close="handleCloseItemDialog" />
  </div>
</template>

<style lang="scss" scoped>
.modern-setting-container {
  background-color: var(--el-bg-color);
  border-radius: 12px;
  box-shadow: 0 5px 20px rgba(0, 0, 0, 0.08);
  position: relative;
  overflow: hidden;
  transition: all 0.3s ease;
  height: 100%;
  padding: 20px 0;
}

.floating-settings-btn {
  position: fixed;
  bottom: 30px;
  right: 30px;
  z-index: 100;
  width: 50px;
  height: 50px;
  border-radius: 50%;
  box-shadow: 0 5px 15px rgba(0, 0, 0, 0.2);
  transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
  background: linear-gradient(135deg, var(--el-color-primary) 0%, var(--el-color-primary-light-3) 100%);

  &:hover {
    transform: scale(1.1) rotate(15deg);
    box-shadow: 0 8px 20px rgba(0, 0, 0, 0.25);
  }
}

.modern-tabs {
  height: 100%;
  padding: 0 16px;

  :deep(.el-tabs__header) {
    margin-bottom: 25px;
    border-bottom: none;
    padding: 0 15px;
    position: relative;

    &::after {
      content: "";
      position: absolute;
      bottom: 0;
      left: 15px;
      right: 15px;
      height: 1px;
      background: linear-gradient(90deg, transparent 0%, var(--el-border-color-light) 15%, var(--el-border-color-light) 85%, transparent 100%);
    }
  }

  :deep(.el-tabs__nav) {
    border: none !important;
  }

  :deep(.el-tabs__item) {
    height: 60px;
    line-height: 60px;
    transition: all 0.3s ease;
    border-bottom: 3px solid transparent;
    font-size: 15px;

    &.is-active {
      color: var(--el-color-primary);
      border-bottom: 3px solid var(--el-color-primary);
      font-weight: 600;
      transform: translateY(-2px);
    }

    &:hover:not(.is-active) {
      color: var(--el-color-primary-light-3);
      border-bottom: 3px solid var(--el-color-primary-light-7);
    }
  }

  :deep(.el-tabs__content) {
    height: calc(100% - 85px);
    overflow: auto;
    padding: 10px 15px;

    &::-webkit-scrollbar {
      width: 6px;
      height: 6px;
    }

    &::-webkit-scrollbar-thumb {
      background: var(--el-border-color-lighter);
      border-radius: 10px;
    }

    &::-webkit-scrollbar-track {
      background: transparent;
    }
  }
}

.custom-tabs-label {
  display: flex;
  align-items: center;
  padding: 0 8px;

  .tab-icon {
    margin-right: 10px;
    font-size: 20px;
    transition: all 0.3s ease;
  }

  .tab-text {
    font-size: 15px;
    transition: all 0.3s ease;
  }
}

/* 列表项动画 */
@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

:deep(.el-form-item) {
  animation: fadeInUp 0.4s ease-out forwards;
  animation-delay: calc(var(--el-transition-duration) * 0.1 * var(--index, 0));
}

/* 卡片样式优化 */
.list-card-item {
  display: flex;
  flex-direction: column;
  overflow: hidden;
  cursor: pointer;
  border-radius: 12px;
  transition: all 0.3s ease;
  box-shadow: 0 5px 15px rgba(0, 0, 0, 0.08);
  background-color: var(--el-bg-color);
  border: 1px solid var(--el-border-color-lighter);

  &:hover {
    transform: translateY(-8px);
    box-shadow: 0 10px 25px rgba(0, 0, 0, 0.15);
    border-color: var(--el-color-primary-light-7);
  }

  &_detail {
    flex: 1;
    min-height: 160px;
    padding: 30px;
    transition: background-color 0.3s ease;

    &--logo {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 60px;
      height: 60px;
      font-size: 28px;
      color: var(--el-color-white);
      background: linear-gradient(135deg, var(--el-color-primary) 0%, var(--el-color-primary-light-3) 100%);
      border-radius: 15px;
      transition: all 0.3s ease;
      box-shadow: 0 5px 15px rgba(var(--el-color-primary-rgb), 0.3);

      &:hover {
        transform: rotate(15deg) scale(1.1);
      }

      &__disabled {
        color: var(--el-text-color-disabled);
        background: var(--el-fill-color-light);
        box-shadow: none;
      }
    }

    &--operation {
      display: flex;
      height: 100%;
      align-items: center;

      &--tag {
        border: 0;
        transition: all 0.3s ease;
        padding: 6px 12px;
        border-radius: 20px;

        &:hover {
          transform: scale(1.05);
        }
      }
    }

    &--name {
      margin: 24px 0 12px;
      font-size: 18px;
      font-weight: 600;
      transition: all 0.3s ease;
      color: var(--el-text-color-primary);
    }

    &--desc {
      display: -webkit-box;
      height: 44px;
      margin-bottom: 24px;
      overflow: hidden;
      font-size: 14px;
      line-height: 22px;
      text-overflow: ellipsis;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
      color: var(--el-text-color-secondary);
      transition: all 0.3s ease;
    }
  }

  &__disabled {
    .list-card-item_detail--name,
    .list-card-item_detail--desc {
      color: var(--el-text-color-disabled);
    }

    .list-card-item_detail--operation--tag {
      color: var(--el-text-color-disabled);
      background-color: var(--el-fill-color-lighter);
    }
  }
}
</style>
