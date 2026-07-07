<template>
  <div class="dashboard-page">
    <!-- Hero Header -->
    <div class="dash-hero">
      <div class="hero-text">
        <h1>{{ t("menu.dashboard") }}</h1>
        <p class="hero-sub">MCP Resource Overview</p>
      </div>
      <div class="hero-indicator">
        <div class="nexus-pulse"></div>
        <span class="indicator-label">Live</span>
      </div>
    </div>

    <!-- Bento Grid -->
    <div class="bento-grid">
      <!-- Main metric: Total Servers (2x span) -->
      <div class="bento-card bento-wide metric-servers">
        <div class="bento-accent teal"></div>
        <div class="metric-content">
          <div class="metric-icon-area">
            <svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
          </div>
          <div class="metric-info">
            <div class="metric-value nexus-data">{{ mcpStore.totalCount }}</div>
            <div class="metric-label">{{ t("dashboard.totalServers") }}</div>
          </div>
        </div>
      </div>

      <!-- Selected -->
      <div class="bento-card metric-selected">
        <div class="bento-accent emerald"></div>
        <div class="metric-content">
          <div class="metric-icon-area small">
            <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
          </div>
          <div class="metric-info">
            <div class="metric-value nexus-data">{{ mcpStore.selectedCount }}</div>
            <div class="metric-label">{{ t("dashboard.selected") }}</div>
          </div>
        </div>
      </div>

      <!-- Imported -->
      <div class="bento-card metric-imported">
        <div class="bento-accent amber"></div>
        <div class="metric-content">
          <div class="metric-icon-area small">
            <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"/></svg>
          </div>
          <div class="metric-info">
            <div class="metric-value nexus-data">0</div>
            <div class="metric-label">{{ t("dashboard.imported") }}</div>
          </div>
        </div>
      </div>

      <!-- Clients -->
      <div class="bento-card metric-clients">
        <div class="bento-accent violet"></div>
        <div class="metric-content">
          <div class="metric-icon-area small">
            <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/></svg>
          </div>
          <div class="metric-info">
            <div class="metric-value nexus-data">{{ MCP_CLIENTS.length }}</div>
            <div class="metric-label">{{ t("dashboard.clients") }}</div>
          </div>
        </div>
      </div>

      <!-- Skills (wide) -->
      <div class="bento-card bento-wide detail-skills">
        <div class="bento-accent rose"></div>
        <div class="detail-content">
          <div class="detail-value nexus-data">{{ skillsStore.totalCount }}</div>
          <div class="detail-label">{{ t("menu.skills") }}</div>
        </div>
      </div>

      <!-- Default Client -->
      <div class="bento-card detail-client">
        <div class="bento-accent" :class="defaultClient ? 'teal' : ''"></div>
        <div class="detail-content">
          <template v-if="defaultClient">
            <div class="default-client">
              <img :src="defaultClient.logo" class="default-client-logo" @error="($event.target as HTMLImageElement).style.display='none'" />
              <span class="default-client-name">{{ defaultClient.name }}</span>
            </div>
          </template>
          <template v-else>
            <div class="detail-value nexus-data">—</div>
          </template>
          <div class="detail-label">{{ t('clients.defaultClient') }}</div>
        </div>
      </div>

      <!-- Selection Rate -->
      <div class="bento-card detail-rate">
        <div class="bento-accent emerald"></div>
        <div class="detail-content">
          <div class="detail-value nexus-data">{{ mcpStore.selectedCount }} / {{ mcpStore.totalCount }}</div>
          <div class="detail-label">Selection Rate</div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { useI18n } from "vue-i18n";
import { useMcpStore } from "@/stores/mcp";
import { useSkillsStore } from "@/stores/skills";
import { useSettingsStore } from "@/stores/settings";
import { MCP_CLIENTS } from "@/utils/mcp-config";

const { t } = useI18n();
const mcpStore = useMcpStore();
const skillsStore = useSkillsStore();
const settings = useSettingsStore();

const defaultClient = computed(() => {
  return MCP_CLIENTS.find((c) => c.id === settings.state.defaultClient) || null;
});
</script>

<style scoped>
.dashboard-page { padding: 0; }

/* ── Hero Header ── */
.dash-hero {
  display: flex; align-items: center; justify-content: space-between;
  margin-bottom: 24px;
}
.dash-hero h1 {
  font-size: 26px; font-weight: 800; color: var(--el-text-color-primary);
  letter-spacing: -0.03em; margin: 0 0 2px;
}
.hero-sub {
  font-size: 13px; color: var(--el-text-color-secondary);
  font-weight: 400; margin: 0;
}
.hero-indicator {
  display: flex; align-items: center; gap: 8px;
  padding: 6px 14px; border-radius: 20px;
  background: rgba(13,148,136,0.06);
  border: 1px solid rgba(13,148,136,0.15);
}
.indicator-label {
  font-size: 11px; font-weight: 600; color: var(--nexus-accent);
  text-transform: uppercase; letter-spacing: 0.06em;
}

/* ── Bento Grid ── */
.bento-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 14px;
}

/* ── Bento Card Base ── */
.bento-card {
  position: relative;
  background: var(--el-bg-color);
  border: 1px solid var(--el-border-color);
  border-radius: var(--card-radius);
  padding: 20px 20px 20px 24px;
  overflow: hidden;
  transition: box-shadow 0.2s, transform 0.15s;
}
.bento-card:hover {
  box-shadow: var(--shadow-md);
  transform: translateY(-1px);
}

/* ── Bento Accent Stripe ── */
.bento-accent {
  position: absolute; left: 0; top: 0; bottom: 0;
  width: 3px; border-radius: 0 3px 3px 0;
  background: var(--el-border-color);
  transition: background 0.2s;
}
.bento-accent.teal { background: var(--nexus-stripe-teal); }
.bento-accent.emerald { background: var(--nexus-stripe-emerald); }
.bento-accent.amber { background: var(--nexus-stripe-amber); }
.bento-accent.rose { background: var(--nexus-stripe-rose); }
.bento-accent.violet { background: var(--nexus-stripe-violet); }

/* ── Bento Span Variants ── */
.bento-wide { grid-column: span 2; }

/* ── Metric Card Content ── */
.metric-content {
  display: flex; align-items: center; gap: 16px;
}
.metric-icon-area {
  width: 48px; height: 48px; border-radius: 12px;
  display: flex; align-items: center; justify-content: center;
  flex-shrink: 0; color: var(--nexus-stripe-teal);
  background: rgba(13,148,136,0.08);
}
.metric-icon-area.small {
  width: 36px; height: 36px; border-radius: 8px;
}
.metric-servers .metric-icon-area { color: var(--nexus-stripe-teal); background: rgba(13,148,136,0.08); }
.metric-selected .metric-icon-area { color: var(--nexus-stripe-emerald); background: rgba(16,185,129,0.08); }
.metric-imported .metric-icon-area { color: var(--nexus-stripe-amber); background: rgba(217,119,6,0.08); }
.metric-clients .metric-icon-area { color: var(--nexus-stripe-violet); background: rgba(124,58,237,0.08); }

.metric-info { flex: 1; }
.metric-value {
  font-size: 32px; font-weight: 800; line-height: 1.1;
  color: var(--el-text-color-primary);
  letter-spacing: -0.03em;
}
.metric-label {
  font-size: 12px; color: var(--el-text-color-secondary);
  margin-top: 4px; font-weight: 450;
}

/* ── Detail Card Content ── */
.detail-content { flex: 1; }
.detail-value {
  font-size: 20px; font-weight: 700; line-height: 1.2;
  color: var(--el-text-color-primary);
  letter-spacing: -0.01em;
}
.detail-label {
  font-size: 11px; color: var(--el-text-color-secondary);
  margin-top: 4px; font-weight: 450;
}

/* ── Default Client ── */
.default-client {
  display: flex; align-items: center; gap: 10px;
}
.default-client-logo {
  width: 24px; height: 24px; object-fit: contain; border-radius: 6px;
  background: var(--el-fill-color); padding: 2px;
}
.default-client-name {
  font-size: 16px; font-weight: 600; color: var(--el-text-color-primary);
}

/* ── Responsive: 2 columns on smaller screens ── */
@media (max-width: 900px) {
  .bento-grid { grid-template-columns: repeat(2, 1fr); }
  .bento-wide { grid-column: span 2; }
}
</style>