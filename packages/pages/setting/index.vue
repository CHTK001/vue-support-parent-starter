<script setup>
import { fetchSettingPage } from "@repo/core";
import { debounce } from "@pureadmin/utils";
import { computed, nextTick, reactive, shallowRef, markRaw, ref } from "vue";
import SaveLayout from "./save.vue";
import SaveItem from "./item.vue";

import { useRenderIcon } from "@repo/components/ReIcon/src/hooks";
import { useI18n } from "vue-i18n";
import { localStorageProxy } from "@repo/utils";
const localStorageProxyObject = localStorageProxy();

const SETTING_TAB_VALUE = "setting-tab-value";
const SaveLayoutRaw = markRaw(SaveLayout);

const { t } = useI18n();

const config = reactive({
  tabValue: localStorageProxyObject.getItem(SETTING_TAB_VALUE) || "default",
  saveItemStatus: false,
});

const saveItemRef = ref();
const data = reactive([]);
const products = reactive([
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
    group: "smtp",
    name: "邮件设置",
    isSetup: true,
    type: 4,
    icon: "ep:setting",
    hide: false,
  },
  {
    group: "weixin",
    name: "微信设置",
    isSetup: true,
    type: 4,
    icon: "simple-icons:wechat",
    hide: false,
  },
  {
    group: "gitee",
    name: "Gitee设置",
    isSetup: true,
    type: 4,
    icon: "simple-icons:gitee",
    hide: false,
  },
  {
    group: "sms",
    name: "短信设置",
    isSetup: true,
    type: 4,
    icon: "ri:phone-find-line",
    hide: false,
  },
  {
    group: "llm",
    name: "大语言模型设置",
    isSetup: true,
    type: 4,
    icon: "ri:login-box-fill",
    hide: false,
  },
  {
    group: "sso",
    name: "SSO设置",
    isSetup: true,
    type: 4,
    icon: "ri:login-box-fill",
    hide: false,
  },
]);
const saveLayout = shallowRef();
const cardClass = computed(() => ["list-card-item", { "list-card-item__disabled": false }]);

const cardLogoClass = computed(() => ["list-card-item_detail--logo", { "list-card-item_detail--logo__disabled": false }]);

const onSearch = debounce(
  () => {
    fetchSettingPage({}).then((res) => {
      data.push(...res.data);
    });
  },
  1000,
  true
);

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
const adminDialog = async () => {
  visible.v1Index = true;
  await nextTick();
};
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
  <div class="app-container h-full bg-white">
    <el-button :icon="useRenderIcon('ri:settings-4-line')" class="fixed right-[12px] top-2/4" type="primary" circle @click="handleOpenItemDialog" />
    <el-tabs v-model="config.tabValue" class="h-full" @tab-change="onRowClick">
      <el-tab-pane v-for="item in products" :key="item.name" :label="item.name" :name="item.group" class="h-full">
        <template #label>
          <span class="custom-tabs-label relative">
            <el-icon class="top-0.5 mr-1 right-0.1 absolute"><component :is="useRenderIcon(item.icon)" /></el-icon>
            <span>{{ item.name }}</span>
          </span>
        </template>
        <SaveLayoutRaw v-if="visible.detail[item.group]" ref="saveLayout" :data="item" @close="close(item.group)" />
      </el-tab-pane>
    </el-tabs>

    <SaveItem v-if="config.saveItemStatus" ref="saveItemRef" @close="handleCloseItemDialog" />
  </div>
</template>

<style lang="scss" scoped>
.fixed {
  position: fixed;
  top: 50%;
  right: 12px;
}
.list-card-item {
  display: flex;
  flex-direction: column;
  overflow: hidden;
  cursor: pointer;
  border-radius: 3px;

  &_detail {
    flex: 1;
    min-height: 140px;
    padding: 24px 32px;

    &--logo {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 46px;
      height: 46px;
      font-size: 26px;
      color: #0052d9;
      background: #e0ebff;
      border-radius: 50%;

      &__disabled {
        color: #a1c4ff;
      }
    }

    &--operation {
      display: flex;
      height: 100%;

      &--tag {
        border: 0;
      }
    }

    &--name {
      margin: 24px 0 8px;
      font-size: 16px;
      font-weight: 400;
    }

    &--desc {
      display: -webkit-box;
      height: 40px;
      margin-bottom: 24px;
      overflow: hidden;
      font-size: 12px;
      line-height: 20px;
      text-overflow: ellipsis;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
    }
  }

  &__disabled {
    .list-card-item_detail--name,
    .list-card-item_detail--desc {
      color: var(--el-text-color-disabled);
    }

    .list-card-item_detail--operation--tag {
      color: #bababa;
    }
  }
}
</style>
