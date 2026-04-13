<template>
  <section class="profile-shell">
    <template v-if="isMysql">
      <div class="profile-grid">
        <article class="profile-card profile-card--primary">
          <small>Engine</small>
          <strong>{{ metadata?.databaseProductName || "MySQL" }}</strong>
          <span>{{ metadata?.databaseProductVersion || "-" }}</span>
        </article>

        <article class="profile-card">
          <small>Binlog</small>
          <strong>{{ resolveAttr("log_bin", "未知") }}</strong>
          <span>{{ resolveAttr("binlog_format", "-") }}</span>
        </article>

        <article class="profile-card">
          <small>Charset</small>
          <strong>{{ resolveAttr("character_set_server", "未知") }}</strong>
          <span>{{ resolveAttr("collation_server", "-") }}</span>
        </article>

        <article class="profile-card">
          <small>Position</small>
          <strong>{{ resolveAttr("file", "-") }}</strong>
          <span>{{ resolveAttr("position", "-") }}</span>
        </article>
      </div>
    </template>

    <template v-else>
      <div class="profile-grid">
        <article class="profile-card profile-card--primary">
          <small>Engine</small>
          <strong>{{ metadata?.databaseProductName || "JDBC" }}</strong>
          <span>{{ metadata?.databaseProductVersion || "-" }}</span>
        </article>
        <article class="profile-card">
          <small>Driver</small>
          <strong>{{ metadata?.driverName || "-" }}</strong>
          <span>{{ metadata?.driverVersion || "-" }}</span>
        </article>
        <article class="profile-card">
          <small>Catalog</small>
          <strong>{{ metadata?.catalog || "-" }}</strong>
          <span>{{ metadata?.defaultSchema || "-" }}</span>
        </article>
        <article class="profile-card">
          <small>Address</small>
          <strong>{{ metadata?.host || "-" }}</strong>
          <span>{{ metadata?.port || "-" }}</span>
        </article>
      </div>
    </template>

    <div class="capability-grid">
      <article class="capability-card">
        <small>JDBC</small>
        <strong>{{ capabilities?.jdbcEnabled ? "ON" : "OFF" }}</strong>
      </article>
      <article class="capability-card">
        <small>AI</small>
        <strong>{{ capabilities?.aiEnabled ? "ON" : "OFF" }}</strong>
      </article>
      <article class="capability-card">
        <small>AI Starter</small>
        <strong>{{ capabilities?.aiStarterEnabled ? "ON" : "OFF" }}</strong>
      </article>
      <article class="capability-card">
        <small>Document</small>
        <strong>{{ capabilities?.documentEnabled ? "ON" : "OFF" }}</strong>
      </article>
    </div>

    <article class="profile-directory-card">
      <div class="profile-directory-card__head">
        <small>数据目录</small>
        <strong>{{ catalogCountLabel }}</strong>
      </div>
      <div class="profile-directory-card__body">
        <span
          v-for="catalog in normalizedCatalogs"
          :key="catalog"
          class="profile-directory-chip"
        >
          {{ catalog }}
        </span>
        <span v-if="!normalizedCatalogs.length" class="profile-directory-empty">
          当前连接未返回可用目录
        </span>
      </div>
    </article>
  </section>
</template>

<script setup lang="ts">
import { computed } from "vue";
import type { JdbcConnectionMetadata, PanelCapabilitySummary } from "../api";

const props = defineProps<{
  capabilities: PanelCapabilitySummary | null;
  catalogs?: string[];
  metadata: JdbcConnectionMetadata | null;
}>();

const isMysql = computed(() =>
  (props.metadata?.databaseProductName || "").toLowerCase().includes("mysql")
);

const normalizedCatalogs = computed(() =>
  [...new Set((props.catalogs || []).map(item => String(item || "").trim()).filter(Boolean))]
);

const catalogCountLabel = computed(() =>
  normalizedCatalogs.value.length
    ? `${normalizedCatalogs.value.length} 个目录`
    : "暂无目录"
);

const resolveAttr = (key: string, fallback: string) => {
  const value = props.metadata?.attributes?.[key];
  if (value === undefined || value === null || value === "") {
    return fallback;
  }
  return String(value);
};
</script>

<style scoped lang="scss">
.profile-shell,
.profile-grid,
.capability-grid {
  display: grid;
  gap: 8px;
}

.profile-grid,
.capability-grid {
  grid-template-columns: repeat(2, minmax(0, 1fr));
}

.profile-card,
.capability-card,
.profile-directory-card {
  display: grid;
  gap: 4px;
  padding: 10px;
  border: 1px solid rgba(124, 141, 153, 0.14);
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.86);
}

.profile-card--primary {
  background: linear-gradient(
    135deg,
    rgba(37, 99, 235, 0.08),
    rgba(16, 185, 129, 0.08)
  );
}

.profile-card small,
.capability-card small {
  color: #68808f;
  font-size: 11px;
}

.profile-card strong,
.capability-card strong {
  color: #132737;
  font-size: 14px;
}

.profile-card span {
  color: #68808f;
  font-size: 12px;
  line-height: 1.5;
}

.profile-directory-card {
  gap: 10px;
}

.profile-directory-card__head {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 12px;
}

.profile-directory-card__body {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.profile-directory-chip {
  padding: 4px 10px;
  border: 1px solid rgba(37, 99, 235, 0.12);
  border-radius: 999px;
  background: rgba(37, 99, 235, 0.06);
  color: #1e3a5f;
  font-size: 12px;
}

.profile-directory-empty {
  color: #68808f;
  font-size: 12px;
}
</style>
