<template>
  <section class="profile-shell">
    <template v-if="isMysql">
      <div class="profile-grid profile-grid--mysql">
        <article class="profile-card profile-card--primary">
          <small>Engine</small>
          <strong>{{ metadata?.databaseProductName || "MySQL" }}</strong>
          <span>{{ metadata?.databaseProductVersion || "-" }}</span>
        </article>

        <article class="profile-card profile-card--wide">
          <small>数据目录 (datadir)</small>
          <strong class="profile-path">{{ resolveAttr("datadir", "无权限或未返回") }}</strong>
          <span class="profile-path profile-path--muted"
            >basedir：{{ resolveAttr("basedir", "-") }}</span
          >
        </article>

        <article class="profile-card">
          <small>连接 / 套接字</small>
          <strong>端口 {{ resolveAttr("port", "-") }}</strong>
          <span class="profile-path profile-path--muted">{{
            resolveAttr("socket", "-")
          }}</span>
        </article>

        <article class="profile-card">
          <small>临时目录</small>
          <strong class="profile-path">{{ resolveAttr("tmpdir", "-") }}</strong>
          <span>服务端 tmpdir</span>
        </article>

        <article class="profile-card">
          <small>最大连接数</small>
          <strong class="profile-value profile-value--nowrap">{{
            resolveMultiAttr(["max_connections", "@@max_connections", "MAX_CONNECTIONS"], "未返回")
          }}</strong>
          <span>max_connections</span>
        </article>

        <article class="profile-card">
          <small>InnoDB 缓冲池</small>
          <strong>{{ formatBytes(resolveAttr("innodb_buffer_pool_size", "0")) }}</strong>
          <span>{{ resolveAttr("innodb_version", "-") }}</span>
        </article>

        <article class="profile-card">
          <small>只读</small>
          <strong class="profile-switch-tag">
            <el-tag size="small" :type="switchTagType(resolveAttr('read_only', 'UNKNOWN'))">
              {{ switchLabel(resolveAttr("read_only", "UNKNOWN")) }}
            </el-tag>
          </strong>
          <span>
            super_read_only：
            <el-tag
              size="small"
              :type="switchTagType(resolveAttr('super_read_only', 'UNKNOWN'))"
            >
              {{ switchLabel(resolveAttr("super_read_only", "UNKNOWN")) }}
            </el-tag>
          </span>
        </article>

        <article class="profile-card profile-card--wide">
          <small>版本说明</small>
          <strong class="profile-comment">{{ resolveAttr("version_comment", "-") }}</strong>
        </article>

        <article class="profile-card">
          <small>Binlog</small>
          <strong class="profile-switch-tag">
            <el-tag size="small" :type="switchTagType(resolveAttr('log_bin', 'UNKNOWN'))">
              {{ switchLabel(resolveAttr("log_bin", "UNKNOWN")) }}
            </el-tag>
          </strong>
          <span>{{ resolveAttr("binlog_format", "-") }}</span>
        </article>

        <article class="profile-card">
          <small>Charset</small>
          <strong>{{ resolveAttr("character_set_server", "未知") }}</strong>
          <span>{{ resolveAttr("collation_server", "-") }}</span>
        </article>

        <article class="profile-card">
          <small>主库位点</small>
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
        <strong class="profile-switch-tag">
          <el-tag size="small" :type="switchTagType(capabilities?.jdbcEnabled)">
            {{ switchLabel(capabilities?.jdbcEnabled) }}
          </el-tag>
        </strong>
      </article>
      <article class="capability-card">
        <small>AI</small>
        <strong class="profile-switch-tag">
          <el-tag size="small" :type="switchTagType(capabilities?.aiEnabled)">
            {{ switchLabel(capabilities?.aiEnabled) }}
          </el-tag>
        </strong>
      </article>
      <article class="capability-card">
        <small>AI Starter</small>
        <strong class="profile-switch-tag">
          <el-tag size="small" :type="switchTagType(capabilities?.aiStarterEnabled)">
            {{ switchLabel(capabilities?.aiStarterEnabled) }}
          </el-tag>
        </strong>
      </article>
      <article class="capability-card">
        <small>Document</small>
        <strong class="profile-switch-tag">
          <el-tag size="small" :type="switchTagType(capabilities?.documentEnabled)">
            {{ switchLabel(capabilities?.documentEnabled) }}
          </el-tag>
        </strong>
      </article>
    </div>

    <article class="profile-directory-card">
      <div class="profile-directory-card__head">
        <small>{{ isMysql ? "数据库列表 (Catalog)" : "数据目录" }}</small>
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
import type { JdbcConnectionMetadata, PanelCapabilitySummary } from "../../api";

const props = defineProps<{
  capabilities: PanelCapabilitySummary | null;
  catalogs?: string[];
  metadata: JdbcConnectionMetadata | null;
}>();

const isMysql = computed(() => {
  const name = (props.metadata?.databaseProductName || "").toLowerCase();
  return name.includes("mysql") || name.includes("mariadb");
});

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

/**
 * 按候选键顺序读取元数据属性，兼容不同 JDBC 驱动返回键名差异。
 *
 * @param keys 候选键列表
 * @param fallback 兜底文案
 * @return 命中的值或兜底文案
 */
const resolveMultiAttr = (keys: string[], fallback: string) => {
  for (const key of keys) {
    const value = props.metadata?.attributes?.[key];
    if (value !== undefined && value !== null && value !== "") {
      return String(value);
    }
  }
  return fallback;
};

/**
 * 将服务端返回的字节数格式化为可读字符串（MySQL 变量常为纯数字）。
 *
 * @param raw 原始字符串
 * @return 可读大小或原值
 */
const formatBytes = (raw: string) => {
  const n = Number.parseInt(String(raw).replace(/\D/g, ""), 10);
  if (!Number.isFinite(n) || n <= 0) {
    return raw === "0" || raw === "" ? "-" : raw;
  }
  if (n < 1024) {
    return `${n} B`;
  }
  const kb = n / 1024;
  if (kb < 1024) {
    return `${kb.toFixed(1)} KB`;
  }
  const mb = kb / 1024;
  if (mb < 1024) {
    return `${mb.toFixed(1)} MB`;
  }
  const gb = mb / 1024;
  return `${gb.toFixed(2)} GB`;
};

const normalizeSwitch = (value: unknown): boolean | null => {
  if (typeof value === "boolean") {
    return value;
  }
  const raw = String(value ?? "")
    .trim()
    .toUpperCase();
  if (!raw) {
    return null;
  }
  if (["ON", "TRUE", "1", "YES", "Y", "ENABLED"].includes(raw)) {
    return true;
  }
  if (["OFF", "FALSE", "0", "NO", "N", "DISABLED"].includes(raw)) {
    return false;
  }
  return null;
};

const switchLabel = (value: unknown) => {
  const normalized = normalizeSwitch(value);
  if (normalized === true) {
    return "开启";
  }
  if (normalized === false) {
    return "关闭";
  }
  return "未知";
};

const switchTagType = (value: unknown): "" | "info" => {
  const normalized = normalizeSwitch(value);
  return normalized === true ? "" : "info";
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

.profile-grid--mysql {
  grid-template-columns: repeat(2, minmax(0, 1fr));
}

@media (min-width: 1100px) {
  .profile-grid--mysql {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }
}

.profile-card--wide {
  grid-column: 1 / -1;
}

.profile-path {
  font-size: 12px;
  font-weight: 600;
  word-break: break-all;
  line-height: 1.45;
}

.profile-path--muted {
  font-weight: 400;
  color: #68808f;
}

.profile-comment {
  font-size: 12px;
  font-weight: 500;
  color: #3d5566;
  line-height: 1.5;
  word-break: break-word;
}

.profile-value {
  font-variant-numeric: tabular-nums;
}

.profile-value--nowrap {
  white-space: nowrap;
}

.profile-switch-tag {
  display: inline-flex;
  align-items: center;
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

/* ── Dark Mode ── */
:global(html.dark) {
  .profile-card,
  .capability-card,
  .profile-directory-card {
    background: rgba(15, 23, 42, 0.7);
    border-color: rgba(148, 163, 184, 0.08);
  }

  .profile-card--primary {
    background: linear-gradient(
      135deg,
      rgba(37, 99, 235, 0.12),
      rgba(16, 185, 129, 0.1)
    );
  }

  .profile-card small,
  .capability-card small {
    color: #64748b;
  }

  .profile-card strong,
  .capability-card strong {
    color: #e2e8f0;
  }

  .profile-card span {
    color: #94a3b8;
  }

  .profile-path--muted {
    color: #64748b;
  }

  .profile-comment {
    color: #94a3b8;
  }

  .profile-directory-chip {
    background: rgba(99, 102, 241, 0.12);
    border-color: rgba(99, 102, 241, 0.2);
    color: #a5b4fc;
  }

  .profile-directory-empty {
    color: #64748b;
  }
}
</style>

