<template>
  <div class="firewall-workbench">
    <div v-if="isTopLayout" class="firewall-nav firewall-nav--top">
      <button
        v-for="item in navItems"
        :key="item.name"
        type="button"
        class="firewall-nav__item firewall-nav__item--top"
        :class="{ 'is-active': activeRail === item.name }"
        @click="setActiveRail(item.name)"
      >
        <component :is="item.icon" v-if="item.icon" class="firewall-nav__icon firewall-nav__icon--svg" />
        <IconifyIconOnline v-else :icon="item.iconify!" class="firewall-nav__icon" />
        <span class="firewall-nav__text">{{ item.title }}</span>
      </button>
    </div>

    <div class="firewall-shell">
      <section class="firewall-main">
        <div class="firewall-stage">
          <div v-if="activeRail === 'logs'" class="pane-body">
            <div class="toolbar">
              <div class="panel-title panel-title--compact">
                <IconifyIconOnline icon="ri:layout-grid-line" />
                <span>防火墙工作台</span>
              </div>
              <div class="toolbar-actions">
                <ScButton circle @click="loadLogs">
                  <IconifyIconOnline icon="ri:refresh-line" />
                </ScButton>
              </div>
            </div>
            <div class="log-table-wrap log-table-wrap--all">
              <FirewallAllLogsPanel :rows="logRows" />
            </div>
          </div>

            <div v-else-if="activeRail === 'blacklistLog'" class="pane-body pane-body--flush">
              <FirewallBlacklistLogPanel :server-id="serverId" @refresh="loadLogs" />
            </div>

            <div v-else-if="activeRail === 'analytics'" class="pane-body pane-body--flush">
              <FirewallOverviewPanel :server-id="serverId" :rows="logRows" @refresh="loadLogs" />
            </div>

          <div v-else-if="activeRail === 'basic'" class="pane-body pane-body--flush">
            <FilterConfigFirewallInline
              :filter-setting-id="filterSettingId"
              section="basic"
              @success="handleConfigSuccess"
            />
          </div>

          <div v-else-if="activeRail === 'whitelist'" class="pane-body pane-body--flush">
            <FilterConfigFirewallInline
              :filter-setting-id="filterSettingId"
              section="whitelist"
              @success="handleConfigSuccess"
            />
          </div>

          <div v-else-if="activeRail === 'blacklist'" class="pane-body pane-body--flush">
            <FilterConfigFirewallInline
              :filter-setting-id="filterSettingId"
              section="blacklist"
              @success="handleConfigSuccess"
            />
          </div>

          <div v-else-if="activeRail === 'ratelimit'" class="pane-body pane-body--flush">
            <FilterConfigFirewallInline
              :filter-setting-id="filterSettingId"
              section="ratelimit"
              @success="handleConfigSuccess"
            />
          </div>

          <div v-else-if="activeRail === 'forward'" class="pane-body pane-body--flush">
            <FilterConfigFirewallInline
              :filter-setting-id="filterSettingId"
              section="forward"
              @success="handleConfigSuccess"
            />
          </div>
        </div>
      </section>

      <aside v-if="!isTopLayout" class="firewall-nav firewall-nav--rail">
        <button
          v-for="item in navItems"
          :key="item.name"
          type="button"
          class="firewall-nav__item firewall-nav__item--rail"
          :class="{ 'is-active': activeRail === item.name }"
          :title="item.title"
          @click="setActiveRail(item.name)"
        >
          <component :is="item.icon" v-if="item.icon" class="firewall-nav__icon firewall-nav__icon--svg" />
          <IconifyIconOnline v-else :icon="item.iconify!" class="firewall-nav__icon" />
          <span class="firewall-nav__text firewall-nav__text--sr">{{ item.title }}</span>
        </button>
      </aside>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from "vue";
import { type SystemServerFilterLogRecord, getSystemServerFilterLogs } from "@/api/system-server";
import FilterConfigFirewallInline from "./FilterConfigFirewallInline.vue";
import FirewallAllLogsPanel from "./FirewallAllLogsPanel.vue";
import FirewallBlacklistLogPanel from "./FirewallBlacklistLogPanel.vue";
import FirewallOverviewPanel from "./FirewallOverviewPanel.vue";

const SpeedSvgIcon = {
  name: "SpeedSvgIcon",
  template: `
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M4.3 17.4a9 9 0 1 1 15.4 0" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
      <path d="M12 13.5l4.2-4.2" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
      <path d="M7 20h10" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
    </svg>
  `,
};

type RailName =
  | "logs"
  | "blacklistLog"
  | "analytics"
  | "basic"
  | "whitelist"
  | "blacklist"
  | "ratelimit"
  | "forward";

type NavItem = {
  name: RailName;
  title: string;
  icon?: typeof SpeedSvgIcon;
  iconify?: string;
};

const props = defineProps<{
  serverId: number;
  filterSettingId: number;
}>();

const emit = defineEmits<{
  (e: "success"): void;
}>();

const activeRail = ref<RailName>("logs");
const logRows = ref<SystemServerFilterLogRecord[]>([]);
const railTabPosition = ref<"right" | "top">("right");

const navItems: NavItem[] = [
  { name: "logs", iconify: "ri:file-list-3-line", title: "全部日志" },
  { name: "blacklistLog", iconify: "ri:file-warning-line", title: "黑名单日志" },
  { name: "analytics", iconify: "ri:bar-chart-2-line", title: "统计看板" },
  { name: "basic", iconify: "ri:shield-check-line", title: "基础配置" },
  { name: "whitelist", iconify: "ri:user-follow-line", title: "白名单" },
  { name: "blacklist", iconify: "ri:forbid-2-line", title: "黑名单" },
  { name: "ratelimit", icon: SpeedSvgIcon, title: "限流" },
  { name: "forward", iconify: "ri:route-line", title: "转发" },
];

const isTopLayout = computed(() => railTabPosition.value === "top");

const updateRailTabPosition = () => {
  if (typeof window === "undefined") return;
  railTabPosition.value = window.innerWidth < 1280 ? "top" : "right";
};

const setActiveRail = (name: RailName) => {
  activeRail.value = name;
};

const loadLogs = async () => {
  if (!props.serverId) {
    logRows.value = [];
    return;
  }
  try {
    const response = await getSystemServerFilterLogs({
      serverId: props.serverId,
      current: 1,
      size: 5000,
    });
    logRows.value = response?.data?.records || [];
  } catch (error) {
    console.error("加载防火墙日志失败:", error);
    logRows.value = [];
  }
};

const handleConfigSuccess = async () => {
  emit("success");
  await loadLogs();
};

onMounted(() => {
  updateRailTabPosition();
  window.addEventListener("resize", updateRailTabPosition);
  void loadLogs();
});

onBeforeUnmount(() => {
  window.removeEventListener("resize", updateRailTabPosition);
});
</script>

<style scoped lang="scss">
.firewall-workbench {
  --fm-border: rgba(76, 99, 134, 0.46);
  --fm-title: #1f466d;
  --fm-panel: #ffffff;
  height: 100%;
  display: flex;
  flex-direction: column;
  border: 1px solid var(--fm-border);
  border-radius: 18px;
  background: linear-gradient(180deg, #f8fbff 0%, #eef5ff 100%);
  box-shadow: 0 24px 48px rgba(25, 64, 108, 0.14);
  overflow: hidden;
}

.firewall-shell {
  flex: 1;
  min-height: 0;
  display: flex;
}

.firewall-main {
  flex: 1;
  min-width: 0;
  min-height: 0;
  padding: 18px;
}

.firewall-stage {
  height: 100%;
  min-height: 0;
  border: 1px solid rgba(69, 90, 121, 0.48);
  border-radius: 18px;
  background: linear-gradient(180deg, #ffffff 0%, #f8fbff 100%);
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.86);
  overflow: hidden;
}

.firewall-nav {
  display: flex;
  gap: 10px;
}

.firewall-nav--top {
  padding: 16px 16px 0;
  overflow-x: auto;
  border-bottom: 1px solid rgba(69, 90, 121, 0.28);
}

.firewall-nav--rail {
  width: 72px;
  flex-shrink: 0;
  padding: 18px 14px;
  border-left: 1px solid rgba(69, 90, 121, 0.34);
  background: linear-gradient(180deg, rgba(245, 249, 255, 0.98) 0%, rgba(238, 245, 255, 0.98) 100%);
  flex-direction: column;
  align-items: center;
}

.firewall-nav__item {
  border: 0;
  cursor: pointer;
  color: #6f85a0;
  transition:
    color 0.18s ease,
    background-color 0.18s ease,
    border-color 0.18s ease,
    transform 0.18s ease;
}

.firewall-nav__item:hover {
  color: #1f466d;
  border-color: rgba(90, 130, 192, 0.28);
  background: rgba(90, 130, 192, 0.08);
}

.firewall-nav__item.is-active {
  color: #1457a8;
  border-color: rgba(90, 130, 192, 0.38);
  background: rgba(90, 130, 192, 0.14);
  box-shadow: inset 0 0 0 1px rgba(90, 130, 192, 0.1);
}

.firewall-nav__item--top {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  min-width: max-content;
  padding: 10px 14px;
  border-radius: 12px 12px 0 0;
  border-bottom: 2px solid transparent;
  background: rgba(255, 255, 255, 0.74);
}

.firewall-nav__item--top.is-active {
  background: rgba(90, 130, 192, 0.12);
  border-bottom-color: #5a82c0;
}

.firewall-nav__item--rail {
  width: 46px;
  height: 46px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 12px;
  background: transparent;
}

.firewall-nav__icon {
  font-size: 18px;
  line-height: 1;
}

.firewall-nav__icon--svg :deep(svg) {
  width: 18px;
  height: 18px;
}

.firewall-nav__text {
  font-size: 13px;
  font-weight: 600;
  white-space: nowrap;
}

.firewall-nav__text--sr {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  border: 0;
}

.pane-body {
  height: 100%;
  display: flex;
  flex-direction: column;
  min-height: 0;
  gap: 14px;
  padding: 18px;
}

.pane-body--flush {
  padding: 0;
  gap: 0;
}

.toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  flex-shrink: 0;
}

.toolbar-actions {
  display: flex;
  align-items: center;
  gap: 10px;
}

.panel-title {
  display: flex;
  align-items: center;
  gap: 8px;
  color: var(--fm-title);
  font-size: 15px;
  font-weight: 700;
  letter-spacing: 0.02em;
}

.panel-title--compact {
  margin: 0;
}

.log-table-wrap {
  flex: 1;
  min-height: 0;
  border-radius: 14px;
  overflow: hidden;
  background: var(--fm-panel);
}

.log-table-wrap--all {
  padding: 0;
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.02);
}

@media (max-width: 1279px) {
  .firewall-shell {
    flex-direction: column;
  }

  .firewall-main {
    padding: 14px;
  }
}

@media (max-width: 960px) {
  .firewall-nav--top {
    padding: 12px 12px 0;
    gap: 8px;
  }

  .firewall-nav__item--top {
    padding: 8px 12px;
    border-radius: 10px 10px 0 0;
  }

  .firewall-nav__text {
    font-size: 12px;
  }
}
</style>
