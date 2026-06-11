<template>
  <div class="server-list-page">
    <section class="server-list-page__panel">
      <header class="server-list-page__header">
        <p class="server-list-page__eyebrow">服务器信息页</p>
        <h1>服务器信息</h1>
        <p>展示项目管理页跳转时携带的服务器连接信息。</p>
      </header>

      <div class="server-list-page__actions">
        <router-link class="server-list-page__back" to="/project/manage">
          返回项目管理
        </router-link>
      </div>

      <dl class="server-list-page__grid">
        <div>
          <dt>当前路由</dt>
          <dd>{{ route.fullPath }}</dd>
        </div>
        <div>
          <dt>nginxProjectStandalone</dt>
          <dd>{{ queryValue("nginxProjectStandalone") || "-" }}</dd>
        </div>
        <div>
          <dt>nginxTab</dt>
          <dd>{{ queryValue("nginxTab") || "-" }}</dd>
        </div>
        <div>
          <dt>_sc 原始值</dt>
          <dd>{{ normalizedSc || "-" }}</dd>
        </div>
      </dl>

      <section class="server-list-page__block">
        <h2>查询参数</h2>
        <pre>{{ queryText }}</pre>
      </section>

      <section class="server-list-page__block">
        <h2>解码结果</h2>
        <pre>{{ decodedText }}</pre>
      </section>
    </section>
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { useRoute } from "vue-router";
import { decodeScParam, type ServerCredential } from "@repo/utils";

const route = useRoute();
const salt = import.meta.env.VITE_SC_SALT ?? "default-salt";

const queryValue = (key: string): string => {
  const value = route.query[key];
  if (Array.isArray(value)) {
    return value.join(",");
  }
  return typeof value === "string" ? value : "";
};

const normalizedSc = computed(() => {
  const raw = queryValue("_sc");
  if (!raw) {
    return "";
  }
  try {
    return decodeURIComponent(raw);
  } catch {
    return raw;
  }
});

const decodedCredential = computed<ServerCredential | null>(() => {
  if (!normalizedSc.value) {
    return null;
  }
  return decodeScParam(normalizedSc.value, salt);
});

const queryText = computed(() => JSON.stringify(route.query, null, 2));

const decodedText = computed(() =>
  decodedCredential.value
    ? JSON.stringify(decodedCredential.value, null, 2)
    : "未能解码 _sc",
);
</script>

<style scoped lang="scss">
.server-list-page {
  min-height: 100vh;
  padding: 24px;
  background: linear-gradient(180deg, #f5f7fb 0%, #eef2f8 100%);
}

.server-list-page__panel {
  max-width: 1120px;
  margin: 0 auto;
  padding: 24px;
  border: 1px solid rgba(148, 163, 184, 0.24);
  border-radius: 12px;
  background: #fff;
  box-shadow: 0 18px 60px rgba(15, 23, 42, 0.08);
}

.server-list-page__header h1 {
  margin: 8px 0 10px;
  font-size: 28px;
  line-height: 1.2;
}

.server-list-page__eyebrow {
  margin: 0;
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0;
  color: #64748b;
  text-transform: uppercase;
}

.server-list-page__header p {
  margin: 0;
  color: #475569;
}

.server-list-page__actions {
  margin: 18px 0 24px;
}

.server-list-page__back {
  display: inline-flex;
  align-items: center;
  padding: 8px 12px;
  border-radius: 8px;
  color: #1d4ed8;
  text-decoration: none;
  background: #eff6ff;
}

.server-list-page__grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 16px;
  margin: 0;
}

.server-list-page__grid div,
.server-list-page__block {
  padding: 14px 16px;
  border: 1px solid rgba(148, 163, 184, 0.18);
  border-radius: 10px;
  background: #f8fafc;
}

.server-list-page__grid dt {
  margin-bottom: 8px;
  font-size: 12px;
  color: #64748b;
}

.server-list-page__grid dd,
.server-list-page__block pre {
  margin: 0;
  overflow: auto;
  white-space: pre-wrap;
  word-break: break-word;
  color: #0f172a;
}

.server-list-page__block {
  margin-top: 16px;
}

.server-list-page__block h2 {
  margin: 0 0 10px;
  font-size: 14px;
  color: #334155;
}

@media (max-width: 960px) {
  .server-list-page__grid {
    grid-template-columns: 1fr;
  }
}
</style>
