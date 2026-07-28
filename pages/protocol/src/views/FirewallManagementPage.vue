<template>
  <div class="firewall-page">
    <header class="firewall-page__header">
      <div class="firewall-page__title">
        <h1>防火墙管理</h1>
        <p>{{ serverName || `服务器 #${serverId}` }}</p>
      </div>
      <div class="firewall-page__actions">
        <ScButton @click="handleClose">关闭页面</ScButton>
      </div>
    </header>

    <main class="firewall-page__body">
      <FirewallManagementWorkspace
        v-if="serverId > 0 && filterSettingId > 0"
        :server-id="serverId"
        :filter-setting-id="filterSettingId"
      />
      <div v-else class="firewall-page__empty">
        缺少防火墙上下文参数，无法打开页面。
      </div>
    </main>
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue";
import FirewallManagementWorkspace from "./service-management/components/FirewallManagementWorkspace.vue";

const search = new URLSearchParams(window.location.search);

const serverId = computed(() => Number(search.get("serverId") || 0));
const filterSettingId = computed(() => Number(search.get("filterSettingId") || 0));
const serverName = computed(() => search.get("serverName") || "");

const handleClose = () => {
  const target = new URL(window.location.href);
  target.searchParams.delete("protocolFirewall");
  target.searchParams.delete("serverId");
  target.searchParams.delete("filterSettingId");
  target.searchParams.delete("serverName");
  window.location.assign(target.toString());
};
</script>

<style scoped lang="scss">
.firewall-page {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  background:
    radial-gradient(circle at top left, rgba(88, 121, 176, 0.1) 0%, transparent 28%),
    linear-gradient(180deg, #f7fbff 0%, #eef5ff 100%);
}

.firewall-page__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 18px 24px;
  border-bottom: 1px solid rgba(127, 158, 193, 0.18);
  background: rgba(255, 255, 255, 0.82);
  backdrop-filter: blur(16px);
}

.firewall-page__title h1 {
  margin: 0;
  font-size: 24px;
  color: #1f466d;
}

.firewall-page__title p {
  margin: 6px 0 0;
  color: #6c84a0;
  font-size: 13px;
}

.firewall-page__body {
  flex: 1;
  min-height: 0;
  padding: 18px 24px 24px;
}

.firewall-page__body :deep(.firewall-workbench) {
  height: calc(100vh - 126px);
}

.firewall-page__empty {
  display: grid;
  place-items: center;
  min-height: 300px;
  border: 1px dashed rgba(127, 158, 193, 0.34);
  border-radius: 18px;
  color: #6c84a0;
  background: rgba(255, 255, 255, 0.72);
}

@media (max-width: 960px) {
  .firewall-page__header {
    padding: 14px 16px;
    flex-direction: column;
    align-items: flex-start;
  }

  .firewall-page__body {
    padding: 12px;
  }

  .firewall-page__body :deep(.firewall-workbench) {
    height: calc(100vh - 140px);
  }
}
</style>
