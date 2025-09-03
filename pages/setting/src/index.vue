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

const currentItem = shallowRef();
const onRowClick = async (it) => {
  const _tabValue = config.tabValue;
  localStorageProxyObject.setItem(SETTING_TAB_VALUE, _tabValue);
  const item = products.filter((item) => item.group === _tabValue)[0];
  currentItem.value = item;
  saveLayout.value?.setData(item);
  saveLayout.value?.open();
};

// 关闭设置面板
const close = (group) => {
  // 可以在这里添加关闭后的逻辑，如刷新数据等
  console.log("关闭设置面板:", group);
};
// if (localStorageProxyObject.getItem(SETTING_TAB_VALUE)) {
//   nextTick(() => {
//     onRowClick(localStorageProxyObject.getItem(SETTING_TAB_VALUE));
//   });
// }

const handleOpenItemDialog = async () => {
  config.saveItemStatus = true;
  await nextTick();
  saveItemRef.value?.open();
};

const handleCloseItemDialog = async () => {
  config.saveItemStatus = false;
};

// 判断当前是否为默认页面
const isDefaultView = () => {
  return config.tabValue === "default";
};

// 获取当前选中的设置项
const getCurrentSetting = () => {
  return products.find((item) => item.group === config.tabValue);
};
</script>
<template>
  <div class="app-container h-full modern-setting-container">
    <el-button :icon="useRenderIcon('ri:settings-4-line')" class="floating-settings-btn" type="primary" circle @click="handleOpenItemDialog" />

    <!-- 页面标题 -->
    <div class="setting-header">
      <h1 class="setting-title">系统设置</h1>
      <p class="setting-subtitle">管理和配置系统各项功能</p>
    </div>

    <!-- 卡片网格布局 -->
    <div class="setting-cards-container">
      <div class="setting-cards-grid">
        <div
          v-for="item in products"
          :key="item.group"
          class="setting-card"
          :class="{ 'setting-card-active': config.tabValue === item.group }"
          @click="
            config.tabValue = item.group;
            onRowClick(item.group);
          "
        >
          <div class="setting-card-icon">
            <el-icon>
              <component :is="useRenderIcon(item.icon)" />
            </el-icon>
          </div>
          <div class="setting-card-content">
            <h3 class="setting-card-title">{{ item.name }}</h3>
            <p class="setting-card-description">{{ item.description || "设置" + item.name }}</p>
          </div>
          <div class="setting-card-indicator" v-if="config.tabValue === item.group"></div>
        </div>
      </div>
    </div>

    <!-- 设置内容区域 -->
    <div class="setting-content-container" v-if="currentItem">
      <template v-if="!layout[currentItem.group]">
        <SaveLayoutRaw ref="saveLayout" @close="close(currentItem.group)" class="w-full" />
      </template>
      <el-drawer v-model="layout[currentItem.group]" size="50%" :title="currentItem.name">
        <component :is="layout[currentItem.group]" :data="currentItem" />
      </el-drawer>
    </div>

    <SaveItem ref="saveItemRef" @close="handleCloseItemDialog" />
  </div>
</template>

<style lang="scss" scoped>
.modern-setting-container {
  background-color: var(--el-bg-color);
  border-radius: 16px;
  box-shadow: 0 8px 30px rgba(0, 0, 0, 0.1);
  position: relative;
  overflow: hidden;
  transition: all 0.3s ease;
  height: 100%;
  padding: 30px 0;
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.floating-settings-btn {
  position: fixed;
  bottom: 30px;
  right: 30px;
  z-index: 100;
  width: 50px !important;
  height: 50px !important;
  border-radius: 50%;
  box-shadow: 0 5px 15px rgba(0, 0, 0, 0.2);
  transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
  background: linear-gradient(135deg, var(--el-color-primary) 0%, var(--el-color-primary-light-3) 100%);

  &:hover {
    box-shadow: 0 8px 20px rgba(0, 0, 0, 0.25);
  }
}

.setting-tabs-container {
  padding: 0 20px;
}

.setting-header {
  padding: 0 30px;
  margin-bottom: 10px;
}

.setting-title {
  font-size: 28px;
  font-weight: 700;
  color: var(--el-text-color-primary);
  margin: 0 0 8px;
  animation: fadeInUp 0.5s ease-out;
}

.setting-subtitle {
  font-size: 16px;
  color: var(--el-text-color-secondary);
  margin: 0;
  animation: fadeInUp 0.5s ease-out;
  animation-delay: 0.1s;
}

.setting-cards-container {
  padding: 0 30px;
  overflow-y: auto;
  height: 100%;
}

.setting-cards-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 24px;
  animation: fadeIn 0.5s ease-out;
}

.setting-content-container {
  margin-top: 20px;
  padding: 0 30px 30px;
  animation: fadeIn 0.5s ease-out;
}

.setting-card {
  background-color: var(--el-bg-color-overlay);
  border-radius: 16px;
  box-shadow: 0 6px 16px rgba(0, 0, 0, 0.06);
  padding: 28px;
  cursor: pointer;
  transition: all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
  border: 1px solid var(--el-border-color-lighter);
  position: relative;
  overflow: hidden;
  display: flex;
  align-items: flex-start;
  height: 100%;
  min-height: 150px;
  backdrop-filter: blur(5px);
}

.setting-card:hover {
  transform: translateY(-8px);
  box-shadow: 0 12px 28px rgba(0, 0, 0, 0.15);
  border-color: var(--el-color-primary-light-5);
}

.setting-card-active {
  border-color: var(--el-color-primary);
  box-shadow: 0 12px 28px rgba(var(--el-color-primary-rgb), 0.2);
  background: linear-gradient(135deg, rgba(var(--el-color-primary-rgb), 0.05) 0%, rgba(var(--el-color-primary-rgb), 0.02) 100%);
}

.setting-card-indicator {
  position: absolute;
  bottom: 0;
  left: 0;
  width: 100%;
  height: 4px;
  background: linear-gradient(90deg, var(--el-color-primary) 0%, var(--el-color-primary-light-3) 100%);
  border-radius: 0 0 16px 16px;
  animation: fadeIn 0.3s ease-out;
}

.setting-card-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 56px;
  height: 56px;
  font-size: 26px;
  color: var(--el-color-white);
  background: linear-gradient(135deg, var(--el-color-primary) 0%, var(--el-color-primary-light-3) 100%);
  border-radius: 14px;
  margin-right: 20px;
  transition: all 0.4s ease;
  box-shadow: 0 8px 16px rgba(var(--el-color-primary-rgb), 0.25);
  flex-shrink: 0;
  position: relative;
  overflow: hidden;
}

.setting-card-icon::after {
  content: "";
  position: absolute;
  top: -50%;
  left: -50%;
  width: 200%;
  height: 200%;
  background: radial-gradient(circle, rgba(255, 255, 255, 0.3) 0%, rgba(255, 255, 255, 0) 70%);
  opacity: 0;
  transition: opacity 0.5s ease;
}

.setting-card:hover .setting-card-icon {
  transform: rotate(12deg) scale(1.08);
}

.setting-card:hover .setting-card-icon::after {
  opacity: 1;
}

.setting-card-content {
  flex: 1;
}

.setting-card-title {
  margin: 0 0 10px;
  font-size: 18px;
  font-weight: 600;
  color: var(--el-text-color-primary);
  transition: color 0.3s ease;
  letter-spacing: 0.3px;
}

.setting-card-description {
  margin: 0;
  font-size: 14px;
  color: var(--el-text-color-secondary);
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  transition: color 0.3s ease;
  line-height: 1.6;
  white-space: normal;
  word-break: break-word;
  word-wrap: break-word;
  width: 100%;
}

.setting-card-active .setting-card-title {
  color: var(--el-color-primary);
}

.setting-card-active .setting-card-description {
  color: var(--el-text-color-regular);
}

.setting-card-content {
  flex: 1;
}

.setting-detail-container {
  background-color: var(--el-bg-color-overlay);
  border-radius: 12px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
  padding: 30px;
  margin-top: 20px;
  animation: fadeIn 0.5s ease-out;
  border: 1px solid var(--el-border-color-lighter);
  height: calc(100% - 40px);
  overflow-y: auto;
}

.modern-tabs {
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

/* 动画效果 */
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

@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

@keyframes pulse {
  0% {
    box-shadow: 0 0 0 0 rgba(var(--el-color-primary-rgb), 0.4);
  }
  70% {
    box-shadow: 0 0 0 10px rgba(var(--el-color-primary-rgb), 0);
  }
  100% {
    box-shadow: 0 0 0 0 rgba(var(--el-color-primary-rgb), 0);
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
