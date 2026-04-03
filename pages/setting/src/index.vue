<script setup lang="ts">
import {
  type Component,
  computed,
  defineAsyncComponent,
  nextTick,
  onMounted,
  onUnmounted,
  reactive,
  ref,
  watch,
} from "vue";
import {
  FRONTEND_SYSTEM_CONFIG_CHANGE_EVENT,
  canManageFrontendSystemConfig,
  getFrontendSystemConfig,
  getInitialConfig,
  isThemeManagementVisible,
} from "@repo/config";
import { useRenderIcon } from "@repo/components/ReIcon";
import ScRibbon from "@repo/components/ScRibbon/index.vue";
import { localStorageProxy, message } from "@repo/utils";
import { useUserStoreHook } from "@repo/core";
import { fetchListForGroup, type SysSettingGroup } from "./api/group";
import SaveLayoutRaw from "./layout/base.vue";

const SaveItem = defineAsyncComponent(() => import("./admin/index.vue"));
const GroupManagement = defineAsyncComponent(() => import("./group/index.vue"));
const FrontendLayout = defineAsyncComponent(
  () => import("./layout/frontend.vue"),
);
const ThemeLayout = defineAsyncComponent(() => import("./layout/theme.vue"));
const HistoryLayout = defineAsyncComponent(() => import("./history/index.vue"));
const SmsLayout = defineAsyncComponent(() => import("./layout/sms.vue"));
const EmailLayout = defineAsyncComponent(() => import("./layout/email.vue"));

type SettingCardSource = "fixed" | "remote";

interface SettingCard {
  group: string;
  name: string;
  description: string;
  icon: string;
  sourceType: SettingCardSource;
  groupTag: string;
  sortWeight: number;
  searchText: string;
}

const drawerComponentMap: Record<string, Component> = {
  email: EmailLayout,
  frontend: FrontendLayout,
  group: GroupManagement,
  history: HistoryLayout,
  sms: SmsLayout,
  theme: ThemeLayout,
};

const localStorageProxyObject = localStorageProxy();
const SETTING_TAB_VALUE = "setting-tab-value";
const FIXED_GROUP_ORDER = [
  "default",
  "frontend",
  "theme",
  "history",
  "group",
] as const;
const FIXED_GROUP_SET = new Set<string>(FIXED_GROUP_ORDER);

const FIXED_CARD_META: Array<Omit<SettingCard, "searchText">> = [
  {
    group: "default",
    name: "基础设置",
    description: "系统基础运行配置与常规参数入口。",
    icon: "ri:airplay-fill",
    sourceType: "fixed",
    groupTag: "固定组",
    sortWeight: 10,
  },
  {
    group: "frontend",
    name: "前端静态配置",
    description: "前端静态系统配置、调试防护、字体加密与主题开关。",
    icon: "ri:shield-keyhole-line",
    sourceType: "fixed",
    groupTag: "固定组",
    sortWeight: 20,
  },
  {
    group: "theme",
    name: "主题管理",
    description: "管理登录页面主题与主题能力展示入口。",
    icon: "ri:palette-line",
    sourceType: "fixed",
    groupTag: "固定组",
    sortWeight: 30,
  },
  {
    group: "history",
    name: "历史记录",
    description: "查看配置变更历史、导入导出和回滚操作。",
    icon: "ri:history-line",
    sourceType: "fixed",
    groupTag: "固定组",
    sortWeight: 40,
  },
  {
    group: "group",
    name: "系统组设置",
    description: "维护远程配置组、排序和启用状态。",
    icon: "mdi:tune-variant",
    sourceType: "fixed",
    groupTag: "固定组",
    sortWeight: 50,
  },
];

const buildSearchText = (value: string[]) => value.join(" ").toLowerCase();

const createFixedCard = (
  card: Omit<SettingCard, "searchText">,
): SettingCard => ({
  ...card,
  searchText: buildSearchText([
    card.group,
    card.name,
    card.description,
    card.groupTag,
  ]),
});

const userStore = useUserStoreHook();
const config = reactive({
  saveItemStatus: false,
  tabValue: localStorageProxyObject.getItem(SETTING_TAB_VALUE) || "default",
});
const currentItem = ref<SettingCard | null>(null);
const frontendSystemState = ref(getFrontendSystemConfig(getInitialConfig()));
const loadingState = reactive({
  isLoading: true,
});
const drawerVisible = reactive<Record<string, boolean>>({});
const remoteGroups = ref<SysSettingGroup[]>([]);
const saveItemRef = ref();
const openingGroup = ref<string | null>(null);

const canManageFrontend = computed(() =>
  canManageFrontendSystemConfig(userStore.roles),
);

const fixedProducts = computed<SettingCard[]>(() =>
  FIXED_CARD_META.map(createFixedCard).filter((card) => {
    if (card.group === "theme") {
      return isThemeManagementVisible(frontendSystemState.value);
    }

    if (card.group === "frontend") {
      return canManageFrontend.value;
    }

    return true;
  }),
);

const remoteProducts = computed<SettingCard[]>(() =>
  remoteGroups.value
    .filter(
      (group) =>
        Boolean(group.sysSettingGroupEnable) &&
        !FIXED_GROUP_SET.has(group.sysSettingGroupCode || ""),
    )
    .sort((prev, next) => {
      const prevSort = prev.sysSettingGroupSort ?? Number.MAX_SAFE_INTEGER;
      const nextSort = next.sysSettingGroupSort ?? Number.MAX_SAFE_INTEGER;

      if (prevSort !== nextSort) {
        return prevSort - nextSort;
      }

      return String(prev.sysSettingGroupName || "").localeCompare(
        String(next.sysSettingGroupName || ""),
        "zh-CN",
      );
    })
    .map((group, index) => {
      const name =
        group.sysSettingGroupName || group.sysSettingGroupCode || "未命名分组";
      const description =
        group.sysSettingGroupRemark || `远程配置组 ${name} 的动态参数入口。`;

      return {
        group: group.sysSettingGroupCode || `remote-${index}`,
        name,
        description,
        icon: group.sysSettingGroupIcon || "ri:settings-line",
        sourceType: "remote",
        groupTag: "远程组",
        sortWeight: 1000 + index,
        searchText: buildSearchText([
          group.sysSettingGroupCode || "",
          name,
          description,
          "远程组",
        ]),
      };
    }),
);

const products = computed(() => [
  ...fixedProducts.value,
  ...remoteProducts.value,
]);

const currentDrawerComponent = computed(() => {
  if (!currentItem.value) {
    return null;
  }

  return drawerComponentMap[currentItem.value.group] || SaveLayoutRaw;
});

const refreshFrontendSystemState = () => {
  frontendSystemState.value = getFrontendSystemConfig(getInitialConfig());
};

const syncActiveCard = () => {
  if (!products.value.length) {
    config.tabValue = "";
    currentItem.value = null;
    return;
  }

  const selected =
    products.value.find((item) => item.group === config.tabValue) ||
    products.value[0];

  config.tabValue = selected.group;
  currentItem.value = selected;
  localStorageProxyObject.setItem(SETTING_TAB_VALUE, selected.group);
};

const loadProductsConfig = async () => {
  try {
    loadingState.isLoading = true;
    const { data } = await fetchListForGroup({});
    remoteGroups.value = Array.isArray(data) ? data : [];
  } catch (error) {
    remoteGroups.value = [];
    console.error("加载配置组失败:", error);
    message("加载配置组失败，已仅展示固定组", { type: "warning" });
  } finally {
    loadingState.isLoading = false;
    syncActiveCard();
  }
};

const openCard = async (card: SettingCard) => {
  if (openingGroup.value === card.group) {
    return;
  }

  openingGroup.value = card.group;
  Object.keys(drawerVisible).forEach((key) => {
    drawerVisible[key] = false;
  });
  config.tabValue = card.group;
  currentItem.value = card;
  localStorageProxyObject.setItem(SETTING_TAB_VALUE, card.group);

  try {
    await nextTick();
    drawerVisible[card.group] = true;
  } catch (error) {
    console.error("打开设置项失败:", error);
    message("打开设置项失败，请重试", { type: "error" });
  } finally {
    openingGroup.value = null;
  }
};

const close = (group?: string) => {
  if (!group) {
    return;
  }

  drawerVisible[group] = false;

  if (group === "group") {
    loadProductsConfig();
  }

  if (group === "frontend" || group === "theme") {
    refreshFrontendSystemState();
  }

  currentItem.value =
    products.value.find((item) => item.group === config.tabValue) || null;
};

const openGroupManagement = async () => {
  const groupCard = fixedProducts.value.find((item) => item.group === "group");

  if (!groupCard) {
    return;
  }

  await openCard(groupCard);
};

const handleOpenItemDialog = async () => {
  config.saveItemStatus = true;
  await nextTick();
  saveItemRef.value?.open();
};

const handleCloseItemDialog = async () => {
  config.saveItemStatus = false;
};

watch(products, syncActiveCard, { deep: true });

onMounted(() => {
  refreshFrontendSystemState();
  loadProductsConfig();
  window.addEventListener(
    FRONTEND_SYSTEM_CONFIG_CHANGE_EVENT,
    refreshFrontendSystemState as EventListener,
  );
});

onUnmounted(() => {
  window.removeEventListener(
    FRONTEND_SYSTEM_CONFIG_CHANGE_EVENT,
    refreshFrontendSystemState as EventListener,
  );
});
</script>

<template>
  <ScContainer class="setting-page system-container modern-bg">
    <ScButton
      :icon="useRenderIcon('ri:settings-4-line')"
      class="floating-settings-btn"
      type="primary"
      circle
      @click="handleOpenItemDialog"
    />
    <ScButton
      :icon="useRenderIcon('ri:group-line')"
      class="floating-group-btn"
      type="success"
      circle
      @click="openGroupManagement"
    />

    <div class="setting-sections">
      <el-skeleton
        :loading="loadingState.isLoading"
        class="setting-skeleton"
        :rows="8"
        animated
      >
        <template #default>
          <div v-if="products.length" class="setting-cards-grid">
            <ScCard
              v-for="item in products"
              :key="item.group"
              shadow="never"
              class="setting-card"
              :class="{
                'setting-card-active': config.tabValue === item.group,
              }"
              @click="openCard(item)"
            >
              <div class="setting-card-shell">
                <ScRibbon
                  :text="item.sourceType === 'fixed' ? '本地' : '远程'"
                  variant="corner"
                  position="rt"
                  size="sm"
                  :color="
                    item.sourceType === 'fixed' ? '#3b82f6' : '#10b981'
                  "
                />
                <div class="setting-card-main">
                  <div class="setting-card-icon">
                    <ScIcon>
                      <component :is="useRenderIcon(item.icon)" />
                    </ScIcon>
                  </div>

                  <div class="setting-card-content">
                    <h3 class="setting-card-title">{{ item.name }}</h3>
                    <p class="setting-card-description">
                      {{ item.description }}
                    </p>
                  </div>
                </div>

                <div
                  v-if="config.tabValue === item.group"
                  class="setting-card-indicator"
                />
              </div>
            </ScCard>
          </div>

          <ScCard v-else shadow="never" class="setting-empty-card">
            <ScEmpty description="当前没有可用的配置项" />
          </ScCard>
        </template>
      </el-skeleton>
    </div>

    <sc-drawer
      v-if="currentItem && currentDrawerComponent"
      :key="currentItem.group"
      v-model="drawerVisible[currentItem.group]"
      size="60%"
      :title="currentItem.name"
      :z-index="2000"
      :append-to-body="true"
      :destroy-on-close="true"
      class="setting-drawer"
      @close="close(currentItem.group)"
    >
      <component
        :is="currentDrawerComponent"
        :data="currentItem"
        @close="close(currentItem.group)"
      />
    </sc-drawer>

    <SaveItem ref="saveItemRef" @close="handleCloseItemDialog" />
  </ScContainer>
</template>

<style lang="scss" scoped>
.setting-page {
  position: relative;
  min-height: 100%;
  background: var(--el-bg-color);
}

.setting-page::before {
  content: "";
  position: absolute;
  inset: 0;
  background: none;
  pointer-events: none;
}

.setting-sections {
  position: relative;
  z-index: 1;
}

.setting-cards-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(286px, 1fr));
  gap: 20px;
}

.setting-card {
  position: relative;
  height: 100%;
  overflow: visible;
  cursor: pointer;
  isolation: isolate;
  background: transparent !important;
  border: 0 !important;
  border-radius: 0;
  box-shadow: none !important;
  transition:
    transform 0.2s ease;
}

.setting-card::after {
  content: "";
  position: absolute;
  left: 20px;
  right: 20px;
  bottom: -12px;
  z-index: 0;
  height: 26px;
  pointer-events: none;
  background: radial-gradient(
    ellipse at center,
    rgb(15 23 42 / 24%) 0%,
    rgb(59 130 246 / 12%) 42%,
    rgb(15 23 42 / 0%) 78%
  );
  border-radius: 999px;
  filter: blur(18px);
  opacity: 0.62;
  transform: translateY(9px) scale(0.9);
  transition:
    opacity 0.2s ease,
    transform 0.2s ease,
    filter 0.2s ease;
}

.setting-card:hover {
  transform: translateY(-4px);
}

.setting-card:hover::after {
  opacity: 0.8;
  filter: blur(20px);
  transform: translateY(11px) scale(0.95);
}

.setting-card:hover .setting-card-icon {
  transform: rotate(10deg) scale(1.08);
  box-shadow:
    0 14px 28px rgb(59 130 246 / 28%),
    0 6px 14px rgb(15 23 42 / 12%),
    inset 0 1px 0 rgb(255 255 255 / 40%);
}

.setting-card-active {
  transform: translateY(-2px);
}

.setting-card-active::after {
  opacity: 0.84;
  filter: blur(20px);
  transform: translateY(10px) scale(0.94);
}

.setting-card-active:hover {
  transform: translateY(-4px);
}

.setting-card :deep(.sc-card-default__body) {
  position: relative;
  z-index: 1;
  height: 100%;
  padding: 0;
}

.setting-card-shell {
  position: relative;
  z-index: 1;
  display: flex;
  flex-direction: column;
  gap: 0;
  height: 100%;
  min-height: 154px;
  padding: 28px;
  overflow: hidden;
  background: linear-gradient(180deg, #fff 0%, #fcfeff 18%, #f6faff 100%);
  border: 1px solid #d7e3f3;
  border-radius: 24px;
  box-shadow:
    0 1px 0 rgb(255 255 255 / 92%) inset,
    0 12px 18px -14px rgb(15 23 42 / 22%),
    0 20px 30px -20px rgb(15 23 42 / 16%),
    0 30px 38px -26px rgb(59 130 246 / 24%);
  transition:
    border-color 0.2s ease,
    box-shadow 0.2s ease,
    background 0.2s ease;
}

.setting-card-shell::before {
  content: "";
  position: absolute;
  inset: 0;
  pointer-events: none;
  background: linear-gradient(
    180deg,
    rgb(255 255 255 / 82%) 0%,
    rgb(255 255 255 / 48%) 24%,
    rgb(255 255 255 / 0%) 54%
  );
}

.setting-card-main {
  position: relative;
  z-index: 1;
  display: flex;
  gap: 20px;
  align-items: flex-start;
}

.setting-card-icon {
  display: flex;
  flex-shrink: 0;
  align-items: center;
  justify-content: center;
  width: 56px;
  height: 56px;
  margin-right: 0;
  font-size: 26px;
  color: #fff;
  background: linear-gradient(135deg, #3b82f6 0%, #60a5fa 100%);
  border-radius: 14px;
  box-shadow:
    0 10px 20px rgb(59 130 246 / 24%),
    0 4px 10px rgb(15 23 42 / 10%),
    inset 0 1px 0 rgb(255 255 255 / 32%);
  transition:
    transform 0.3s ease,
    box-shadow 0.3s ease;
}

.setting-card-content {
  display: flex;
  flex: 1;
  flex-direction: column;
  gap: 8px;
  min-width: 0;
}

.setting-card-title {
  margin: 0 0 10px;
  font-size: 18px;
  font-weight: 600;
  line-height: 1.3;
  color: #0f172a;
  transition: color 0.2s ease;
}

.setting-card-description {
  margin: 0;
  font-size: 14px;
  line-height: 1.6;
  color: #64748b;
  display: -webkit-box;
  overflow: hidden;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
}

.setting-card-active .setting-card-title {
  color: #2563eb;
}

.setting-card-active .setting-card-description {
  color: #475569;
}

.setting-card:hover .setting-card-shell {
  border-color: #aac4e4;
  box-shadow:
    0 1px 0 rgb(255 255 255 / 96%) inset,
    0 14px 20px -14px rgb(15 23 42 / 24%),
    0 24px 34px -20px rgb(15 23 42 / 20%),
    0 34px 42px -24px rgb(59 130 246 / 26%);
}

.setting-card-active .setting-card-shell {
  border-color: #60a5fa;
  box-shadow:
    0 1px 0 rgb(255 255 255 / 98%) inset,
    0 16px 22px -14px rgb(15 23 42 / 26%),
    0 26px 36px -20px rgb(15 23 42 / 22%),
    0 36px 44px -22px rgb(59 130 246 / 32%);
}

.setting-card-indicator {
  position: absolute;
  left: 0;
  right: 0;
  bottom: 0;
  height: 4px;
  background: linear-gradient(90deg, #3b82f6 0%, #60a5fa 100%);
  border-radius: 0 0 24px 24px;
}

.setting-empty-card {
  border: 1px dashed #bfdbfe;
  border-radius: 24px;
}

.setting-empty-card :deep(.sc-card-default__body) {
  padding: 24px;
}

.setting-drawer {
  visibility: hidden;

  &.el-drawer__open {
    visibility: visible;
  }
}

.floating-settings-btn,
.floating-group-btn {
  position: fixed;
  bottom: 30px;
  z-index: 1000;
  width: 42px !important;
  height: 42px !important;
  border-radius: 50%;
  box-shadow:
    0 14px 32px rgb(15 23 42 / 22%),
    inset 0 1px 0 rgb(255 255 255 / 32%);
  transition:
    transform 0.22s ease,
    box-shadow 0.22s ease;
}

.floating-settings-btn:hover,
.floating-group-btn:hover {
  transform: translateY(-3px);
  box-shadow:
    0 18px 36px rgb(15 23 42 / 28%),
    inset 0 1px 0 rgb(255 255 255 / 38%);
}

.floating-settings-btn {
  right: 30px;
}

.floating-group-btn {
  right: 86px;
}

:root[data-theme="dark"] {

  .setting-page::before {
    background: none;
  }

  .setting-card {
    background: transparent !important;
    border: 0 !important;
    box-shadow: none !important;
  }

  .setting-card::after {
    background: radial-gradient(
      ellipse at center,
      rgb(2 6 23 / 62%) 0%,
      rgb(30 64 175 / 20%) 46%,
      rgb(2 6 23 / 0%) 78%
    );
    opacity: 0.78;
  }

  .setting-card-shell {
    background: linear-gradient(180deg, rgb(15 23 42 / 98%) 0%, rgb(17 24 39 / 100%) 100%);
    border-color: rgb(100 116 139 / 42%);
    box-shadow:
      0 1px 0 rgb(255 255 255 / 8%) inset,
      0 12px 18px -12px rgb(2 6 23 / 46%),
      0 22px 30px -18px rgb(2 6 23 / 36%),
      0 28px 36px -24px rgb(30 64 175 / 26%);
  }

  .setting-card-shell::before {
    background: linear-gradient(
      180deg,
      rgb(255 255 255 / 10%) 0%,
      rgb(255 255 255 / 4%) 24%,
      rgb(255 255 255 / 0%) 56%
    );
  }

  .setting-card-icon {
    background: rgb(15 23 42 / 72%);
    color: rgb(191 219 254 / 96%);
  }

  .setting-card-title {
    color: rgb(241 245 249 / 96%);
  }

  .setting-card-description {
    color: rgb(148 163 184 / 88%);
  }

  .setting-card-active {
    background: transparent !important;
    border: 0 !important;
  }

  .setting-card-active .setting-card-title {
    color: rgb(191 219 254 / 98%);
  }

  .setting-card-active .setting-card-description {
    color: rgb(203 213 225 / 88%);
  }

  .setting-card:hover .setting-card-shell {
    border-color: rgb(148 163 184 / 48%);
    box-shadow:
      0 1px 0 rgb(255 255 255 / 10%) inset,
      0 14px 20px -12px rgb(2 6 23 / 48%),
      0 24px 34px -18px rgb(2 6 23 / 40%),
      0 32px 40px -24px rgb(30 64 175 / 28%);
  }

  .setting-card-active .setting-card-shell {
    border-color: rgb(96 165 250 / 48%);
    box-shadow:
      0 1px 0 rgb(255 255 255 / 12%) inset,
      0 16px 22px -12px rgb(2 6 23 / 52%),
      0 26px 36px -18px rgb(2 6 23 / 44%),
      0 34px 42px -24px rgb(30 64 175 / 30%);
  }
}

@media (max-width: 960px) {
  .setting-cards-grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 640px) {
  .setting-card-shell {
    min-height: 148px;
    padding: 16px;
  }

  .setting-card-main {
    gap: 14px;
  }

  .setting-card-icon {
    width: 50px;
    height: 50px;
    font-size: 22px;
  }

  .setting-card-title {
    font-size: 17px;
  }

  .floating-settings-btn {
    right: 18px;
    bottom: 18px;
  }

  .floating-group-btn {
    right: 72px;
    bottom: 18px;
  }
}
</style>
