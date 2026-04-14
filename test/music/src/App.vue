<script setup lang="ts">
import { computed, onMounted, ref } from "vue";

type MusicSource = {
  code: string;
  name: string;
  description: string;
  enabled: boolean;
};

type ApiResponse<T> = {
  code: string;
  data: T;
  msg: string;
  timestamp: number;
};

const sources = ref<MusicSource[]>([]);
const loading = ref(false);
const errorMessage = ref("");
const pendingCodes = ref<string[]>([]);
const refreshedAt = ref("");

const activeCount = computed(() => sources.value.filter((item) => item.enabled).length);
const inactiveCount = computed(() => sources.value.length - activeCount.value);

async function request<T>(path: string, init?: RequestInit) {
  const response = await fetch(path, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {})
    }
  });

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`);
  }

  const payload = (await response.json()) as ApiResponse<T>;
  if (payload.code !== "00000") {
    throw new Error(payload.msg || "接口返回失败");
  }
  return payload.data;
}

async function loadSources() {
  loading.value = true;
  errorMessage.value = "";
  try {
    sources.value = await request<MusicSource[]>("/api/v1/music/admin/sources");
    refreshedAt.value = new Date().toLocaleString("zh-CN", { hour12: false });
  } catch (error) {
    errorMessage.value = error instanceof Error ? error.message : "加载失败";
  } finally {
    loading.value = false;
  }
}

async function toggleSource(source: MusicSource) {
  pendingCodes.value = [...pendingCodes.value, source.code];
  errorMessage.value = "";
  try {
    const updated = await request<MusicSource>(`/api/v1/music/admin/sources/${source.code}`, {
      method: "PUT",
      body: JSON.stringify({ enabled: !source.enabled })
    });
    sources.value = sources.value.map((item) => (item.code === updated.code ? updated : item));
    refreshedAt.value = new Date().toLocaleString("zh-CN", { hour12: false });
  } catch (error) {
    errorMessage.value = error instanceof Error ? error.message : "更新失败";
  } finally {
    pendingCodes.value = pendingCodes.value.filter((item) => item !== source.code);
  }
}

function isPending(code: string) {
  return pendingCodes.value.includes(code);
}

onMounted(() => {
  void loadSources();
});
</script>

<template>
  <main class="console-shell">
    <section class="hero-panel">
      <p class="eyebrow">Single Page Music Control</p>
      <div class="hero-head">
        <div>
          <h1>音源控制台</h1>
          <p class="hero-copy">
            一个独立的测试项目，只保留主页面。这里直接对接
            <code>/v1/music/admin/sources</code>，用于管理员快速启停各个音源。
          </p>
        </div>
        <button class="refresh-button" :disabled="loading" @click="loadSources">
          {{ loading ? "同步中..." : "刷新列表" }}
        </button>
      </div>

      <div class="stats-grid">
        <article class="stat-card">
          <span class="stat-label">音源总数</span>
          <strong>{{ sources.length }}</strong>
        </article>
        <article class="stat-card stat-card-accent">
          <span class="stat-label">已启用</span>
          <strong>{{ activeCount }}</strong>
        </article>
        <article class="stat-card">
          <span class="stat-label">已停用</span>
          <strong>{{ inactiveCount }}</strong>
        </article>
      </div>

      <p class="meta-line">
        最近同步时间:
        <span>{{ refreshedAt || "尚未同步" }}</span>
      </p>
      <p v-if="errorMessage" class="error-banner">{{ errorMessage }}</p>
    </section>

    <section class="source-grid">
      <article v-for="source in sources" :key="source.code" class="source-card">
        <div class="source-top">
          <div>
            <p class="source-code">{{ source.code }}</p>
            <h2>{{ source.name }}</h2>
          </div>
          <span class="status-pill" :class="{ off: !source.enabled }">
            {{ source.enabled ? "运行中" : "已停用" }}
          </span>
        </div>

        <p class="source-desc">
          {{ source.description || "暂无描述" }}
        </p>

        <button class="toggle-button" :disabled="isPending(source.code)" @click="toggleSource(source)">
          {{
            isPending(source.code)
              ? "提交中..."
              : source.enabled
                ? "停止这个音源"
                : "重新启用"
          }}
        </button>
      </article>
    </section>
  </main>
</template>

<style scoped>
:global(*) {
  box-sizing: border-box;
}

:global(body) {
  margin: 0;
  min-width: 320px;
  min-height: 100vh;
  font-family: "Bahnschrift", "Segoe UI", "Microsoft YaHei UI", sans-serif;
  background:
    radial-gradient(circle at top left, rgb(218 241 255 / 88%), transparent 28%),
    radial-gradient(circle at bottom right, rgb(255 226 195 / 72%), transparent 30%),
    linear-gradient(135deg, #f3efe6 0%, #dbe6f4 45%, #f7f4ef 100%);
  color: #17202a;
}

:global(body::before) {
  content: "";
  position: fixed;
  inset: 0;
  pointer-events: none;
  background-image:
    linear-gradient(rgb(23 32 42 / 0.045) 1px, transparent 1px),
    linear-gradient(90deg, rgb(23 32 42 / 0.045) 1px, transparent 1px);
  background-size: 28px 28px;
  mask-image: radial-gradient(circle at center, black 55%, transparent 90%);
}

.console-shell {
  position: relative;
  z-index: 1;
  max-width: 1220px;
  margin: 0 auto;
  padding: 48px 24px 80px;
}

.hero-panel {
  padding: 32px;
  border: 1px solid rgb(23 32 42 / 0.12);
  border-radius: 28px;
  background: rgb(255 251 245 / 0.74);
  backdrop-filter: blur(18px);
  box-shadow: 0 30px 80px rgb(30 60 90 / 0.14);
}

.eyebrow {
  margin: 0 0 12px;
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.32em;
  text-transform: uppercase;
  color: #8a5d34;
}

.hero-head {
  display: flex;
  gap: 24px;
  align-items: flex-start;
  justify-content: space-between;
}

h1 {
  margin: 0;
  font-size: clamp(40px, 7vw, 76px);
  line-height: 0.94;
  letter-spacing: -0.05em;
}

.hero-copy {
  max-width: 720px;
  margin: 18px 0 0;
  font-size: 16px;
  line-height: 1.8;
  color: #415161;
}

code {
  padding: 2px 8px;
  border-radius: 999px;
  background: rgb(23 32 42 / 0.08);
  font-family: "Consolas", "Courier New", monospace;
}

.refresh-button,
.toggle-button {
  border: 0;
  cursor: pointer;
  transition:
    transform 160ms ease,
    box-shadow 160ms ease,
    opacity 160ms ease;
}

.refresh-button {
  min-width: 132px;
  padding: 14px 20px;
  border-radius: 16px;
  background: linear-gradient(135deg, #17202a 0%, #36536e 100%);
  color: #fef8ef;
  font-size: 14px;
  font-weight: 700;
  box-shadow: 0 16px 28px rgb(31 44 61 / 0.24);
}

.refresh-button:hover,
.toggle-button:hover {
  transform: translateY(-1px);
}

.refresh-button:disabled,
.toggle-button:disabled {
  cursor: wait;
  opacity: 0.65;
  transform: none;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 16px;
  margin-top: 28px;
}

.stat-card {
  padding: 20px 22px;
  border-radius: 22px;
  background: rgb(255 255 255 / 0.62);
  border: 1px solid rgb(23 32 42 / 0.08);
}

.stat-card-accent {
  background: linear-gradient(135deg, rgb(213 242 221 / 0.85), rgb(255 255 255 / 0.9));
}

.stat-label {
  display: block;
  margin-bottom: 10px;
  font-size: 12px;
  letter-spacing: 0.18em;
  text-transform: uppercase;
  color: #5f6e7d;
}

.stat-card strong {
  font-size: clamp(34px, 4vw, 50px);
  line-height: 1;
}

.meta-line {
  margin: 20px 0 0;
  color: #4d5d6d;
}

.meta-line span {
  font-weight: 700;
}

.error-banner {
  margin: 18px 0 0;
  padding: 14px 16px;
  border-radius: 16px;
  background: rgb(146 28 45 / 0.1);
  color: #8d1734;
}

.source-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
  gap: 18px;
  margin-top: 24px;
}

.source-card {
  padding: 22px;
  border-radius: 24px;
  border: 1px solid rgb(23 32 42 / 0.1);
  background: rgb(255 255 255 / 0.74);
  box-shadow: 0 18px 36px rgb(36 53 74 / 0.1);
}

.source-top {
  display: flex;
  gap: 16px;
  align-items: flex-start;
  justify-content: space-between;
}

.source-code {
  margin: 0 0 8px;
  color: #8a5d34;
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.24em;
  text-transform: uppercase;
}

h2 {
  margin: 0;
  font-size: 24px;
}

.status-pill {
  flex-shrink: 0;
  padding: 8px 12px;
  border-radius: 999px;
  background: rgb(24 148 82 / 0.12);
  color: #11683a;
  font-size: 12px;
  font-weight: 700;
}

.status-pill.off {
  background: rgb(146 28 45 / 0.1);
  color: #8d1734;
}

.source-desc {
  min-height: 72px;
  margin: 18px 0 22px;
  color: #556677;
  line-height: 1.7;
}

.toggle-button {
  width: 100%;
  padding: 14px 16px;
  border-radius: 16px;
  background: linear-gradient(135deg, #b36a2e 0%, #df9b58 100%);
  color: #fff9f0;
  font-size: 14px;
  font-weight: 700;
  box-shadow: 0 14px 28px rgb(179 106 46 / 0.24);
}

@media (max-width: 720px) {
  .console-shell {
    padding: 24px 16px 48px;
  }

  .hero-panel {
    padding: 22px;
    border-radius: 24px;
  }

  .hero-head {
    flex-direction: column;
  }

  .refresh-button {
    width: 100%;
  }

  .stats-grid {
    grid-template-columns: 1fr;
  }

  .source-grid {
    grid-template-columns: 1fr;
  }
}
</style>
