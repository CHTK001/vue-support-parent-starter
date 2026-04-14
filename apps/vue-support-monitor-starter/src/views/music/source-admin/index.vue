<template>
  <div class="music-source-admin system-container">
    <section class="hero-panel">
      <div class="hero-copy">
        <p class="eyebrow">Music Control</p>
        <h1>音源管理台</h1>
        <p class="hero-description">
          这里控制音乐模块各个 provider 的启停状态。关闭后，普通用户的音源列表和聚合搜索会立即剔除该音源。
        </p>
      </div>
      <div class="hero-actions">
        <el-button type="primary" @click="loadSources" :loading="loading">
          <IconifyIconOnline icon="ri:refresh-line" class="mr-1" />
          刷新状态
        </el-button>
      </div>
    </section>

    <section class="summary-grid">
      <div class="summary-card summary-card--active">
        <span class="summary-label">已启用</span>
        <strong>{{ enabledCount }}</strong>
      </div>
      <div class="summary-card summary-card--paused">
        <span class="summary-label">已停用</span>
        <strong>{{ disabledCount }}</strong>
      </div>
      <div class="summary-card summary-card--total">
        <span class="summary-label">总音源</span>
        <strong>{{ sources.length }}</strong>
      </div>
    </section>

    <el-alert
      v-if="statusMessage"
      :title="statusMessage"
      :type="statusType"
      :closable="false"
      show-icon
      class="status-banner"
    />

    <section class="source-grid" v-loading="loading">
      <article
        v-for="item in sources"
        :key="item.code"
        class="source-card"
        :class="{ 'is-disabled': !item.enabled }"
      >
        <div class="source-card__head">
          <div>
            <div class="source-card__title">
              <h2>{{ item.name || item.code }}</h2>
              <el-tag
                size="small"
                :type="item.enabled ? 'success' : 'danger'"
                effect="dark"
                round
              >
                {{ item.enabled ? "已启用" : "已停用" }}
              </el-tag>
            </div>
            <p class="source-card__code">{{ item.code }}</p>
          </div>
          <div class="source-card__switch">
            <el-switch
              :model-value="item.enabled"
              :loading="pendingCode === item.code"
              inline-prompt
              active-text="开"
              inactive-text="关"
              @change="(value) => handleToggle(item, value)"
            />
          </div>
        </div>

        <p class="source-card__desc">
          {{ item.description || "暂无描述" }}
        </p>

        <div class="source-card__foot">
          <span class="source-card__hint">
            {{ item.enabled ? "聚合搜索可见" : "聚合搜索已隐藏" }}
          </span>
          <el-button
            text
            type="primary"
            :disabled="pendingCode === item.code"
            @click="handleToggle(item, !item.enabled)"
          >
            {{ item.enabled ? "立即停用" : "重新启用" }}
          </el-button>
        </div>
      </article>
    </section>
  </div>
</template>

<script setup lang="ts">
import { ElMessage } from "element-plus";
import { computed, onMounted, ref } from "vue";
import type { MusicSourceOption } from "@pages/music";
import {
  fetchMusicSourceAdminList,
  updateMusicSourceAdminState,
} from "@/api/music-source-admin";

const loading = ref(false);
const pendingCode = ref("");
const sources = ref<MusicSourceOption[]>([]);
const statusMessage = ref("");
const statusType = ref<"success" | "info" | "warning" | "error">("info");

const enabledCount = computed(
  () => sources.value.filter((item) => item.enabled).length,
);
const disabledCount = computed(
  () => sources.value.filter((item) => !item.enabled).length,
);

async function loadSources() {
  loading.value = true;
  try {
    const response = await fetchMusicSourceAdminList();
    sources.value = response.data || [];
    statusType.value = "success";
    statusMessage.value = `已加载 ${sources.value.length} 个音源配置`;
  } catch (error: any) {
    statusType.value = "error";
    statusMessage.value = error?.message || "加载音源配置失败";
  } finally {
    loading.value = false;
  }
}

async function handleToggle(item: MusicSourceOption, nextEnabled: boolean) {
  if (pendingCode.value) {
    return;
  }
  pendingCode.value = item.code;
  try {
    const response = await updateMusicSourceAdminState(item.code, nextEnabled);
    const updated = response.data;
    sources.value = sources.value.map((source) =>
      source.code === updated.code ? updated : source,
    );
    statusType.value = "success";
    statusMessage.value = `${updated.name || updated.code} 已${updated.enabled ? "启用" : "停用"}`;
    ElMessage.success(statusMessage.value);
  } catch (error: any) {
    statusType.value = "error";
    statusMessage.value = error?.message || `${item.code} 状态更新失败`;
    ElMessage.error(statusMessage.value);
  } finally {
    pendingCode.value = "";
  }
}

onMounted(() => {
  loadSources();
});
</script>

<style scoped lang="scss">
.music-source-admin {
  min-height: 100%;
  padding: 24px;
  background:
    radial-gradient(circle at top left, rgba(34, 197, 94, 0.08), transparent 28%),
    radial-gradient(circle at right bottom, rgba(59, 130, 246, 0.08), transparent 30%),
    linear-gradient(180deg, #f8fafc 0%, #eef2f7 100%);
}

.hero-panel {
  display: flex;
  justify-content: space-between;
  gap: 24px;
  padding: 28px 30px;
  border-radius: 28px;
  background: linear-gradient(135deg, #0f172a 0%, #12304d 52%, #0d9488 100%);
  box-shadow: 0 24px 60px rgba(15, 23, 42, 0.24);
  color: #f8fafc;
}

.hero-copy {
  max-width: 720px;
}

.eyebrow {
  margin: 0 0 12px;
  font-size: 12px;
  letter-spacing: 0.28em;
  text-transform: uppercase;
  color: rgba(226, 232, 240, 0.78);
}

.hero-panel h1 {
  margin: 0;
  font-size: clamp(28px, 4vw, 42px);
  line-height: 1.05;
}

.hero-description {
  margin: 14px 0 0;
  color: rgba(226, 232, 240, 0.84);
  line-height: 1.7;
}

.hero-actions {
  display: flex;
  align-items: flex-start;
}

.summary-grid {
  margin-top: 20px;
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 16px;
}

.summary-card {
  position: relative;
  overflow: hidden;
  padding: 20px 22px;
  border-radius: 22px;
  background: rgba(255, 255, 255, 0.9);
  border: 1px solid rgba(148, 163, 184, 0.18);
  box-shadow: 0 14px 34px rgba(15, 23, 42, 0.08);
}

.summary-card::after {
  content: "";
  position: absolute;
  inset: auto -24px -32px auto;
  width: 96px;
  height: 96px;
  border-radius: 50%;
  opacity: 0.18;
}

.summary-card--active::after {
  background: #22c55e;
}

.summary-card--paused::after {
  background: #ef4444;
}

.summary-card--total::after {
  background: #3b82f6;
}

.summary-label {
  display: block;
  color: #64748b;
  font-size: 13px;
}

.summary-card strong {
  display: block;
  margin-top: 8px;
  font-size: 34px;
  line-height: 1;
  color: #0f172a;
}

.status-banner {
  margin-top: 18px;
}

.source-grid {
  margin-top: 18px;
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 18px;
}

.source-card {
  padding: 20px;
  border-radius: 24px;
  background: rgba(255, 255, 255, 0.92);
  border: 1px solid rgba(148, 163, 184, 0.18);
  box-shadow: 0 18px 46px rgba(15, 23, 42, 0.08);
  display: flex;
  flex-direction: column;
  gap: 18px;
  transition: transform 180ms ease, box-shadow 180ms ease, border-color 180ms ease;
}

.source-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 24px 54px rgba(15, 23, 42, 0.12);
}

.source-card.is-disabled {
  border-color: rgba(239, 68, 68, 0.24);
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.96), rgba(254, 242, 242, 0.92));
}

.source-card__head {
  display: flex;
  justify-content: space-between;
  gap: 16px;
}

.source-card__title {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
}

.source-card__title h2 {
  margin: 0;
  font-size: 22px;
  line-height: 1.15;
  color: #0f172a;
}

.source-card__code {
  margin: 8px 0 0;
  font-family: "JetBrains Mono", "Fira Code", monospace;
  font-size: 13px;
  color: #64748b;
}

.source-card__desc {
  margin: 0;
  min-height: 48px;
  color: #475569;
  line-height: 1.7;
}

.source-card__foot {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding-top: 14px;
  border-top: 1px solid rgba(148, 163, 184, 0.16);
}

.source-card__hint {
  color: #64748b;
  font-size: 13px;
}

.mr-1 {
  margin-right: 4px;
}

@media (max-width: 960px) {
  .summary-grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 768px) {
  .music-source-admin {
    padding: 16px;
  }

  .hero-panel {
    flex-direction: column;
    padding: 22px;
  }

  .source-card__head,
  .source-card__foot {
    flex-direction: column;
    align-items: flex-start;
  }
}
</style>
