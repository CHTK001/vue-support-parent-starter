<template>
  <div class="video-parse-page">
    <!-- Top Bar -->
    <header class="parse-top-bar">
      <button class="back-btn" @click="goBack">
        <IconifyIconOnline icon="ep:arrow-left" />
      </button>
      <div class="parse-top-title">
        <div class="parse-top-logo">
          <IconifyIconOnline icon="ri:film-line" class="parse-logo-icon" />
          <span>视频解析</span>
        </div>
      </div>
      <div class="parse-top-actions">
        <button class="top-bar-btn" @click="clearAll" title="清空">
          <IconifyIconOnline icon="ep:delete" />
        </button>
      </div>
    </header>

    <!-- Parser Input Section -->
    <div class="parse-input-section">
      <div class="parse-input-row">
        <div class="parse-input-wrapper">
          <select v-model="selectedApi" class="api-select">
            <option v-for="api in apis" :key="api.value" :value="api.value">
              {{ api.label }}
            </option>
          </select>
          <div class="parse-url-input">
            <IconifyIconOnline icon="ep:link" class="url-ico" />
            <input
              v-model="inputValue"
              type="text"
              class="url-field"
              placeholder="粘贴视频链接，如 https://v.qq.com/..."
              @keyup.enter="parseUrl"
            />
            <button v-if="inputValue" class="clear-btn-sm" @click="inputValue = ''">
              <IconifyIconOnline icon="ep:close" />
            </button>
          </div>
          <button class="parse-btn" @click="parseUrl" :disabled="loading">
            <IconifyIconOnline icon="ep:video-play" />
            <span>{{ loading ? '解析中' : '解析' }}</span>
          </button>
        </div>
      </div>

      <!-- Quick Sites + History -->
      <div class="parse-meta-row">
        <div class="meta-group">
          <span class="meta-label">
            <IconifyIconOnline icon="ep:star" />
            快捷访问
          </span>
          <span
            v-for="site in popularSites"
            :key="site.name"
            class="meta-chip"
            @click="openVideoSite(site.url)"
          >
            {{ site.name }}
          </span>
        </div>
        <div class="meta-group" v-if="history.length > 0">
          <span class="meta-label">
            <IconifyIconOnline icon="ep:clock" />
            历史
          </span>
          <span
            v-for="(url, index) in history"
            :key="index"
            class="meta-chip history-chip"
            :class="{ active: inputValue === url }"
            @click="selectFromHistory(url)"
          >
            {{ url.length > 35 ? url.substring(0, 35) + '...' : url }}
          </span>
        </div>
      </div>
    </div>

    <!-- Player Section -->
    <div class="parse-player-section" v-if="currentUrl">
      <div class="player-container">
        <iframe
          :src="currentUrl"
          frameborder="0"
          allowfullscreen
          class="player-iframe"
          allow="autoplay; encrypted-media"
        />
        <div class="player-watermark" v-if="!loading">
          <IconifyIconOnline icon="ri:film-line" />
        </div>
      </div>
      <div class="player-url-bar">
        <span class="player-url-label">当前解析:</span>
        <span class="player-url-text">{{ currentUrl }}</span>
        <button class="copy-url-btn" @click="copyCurrentUrl">
          <IconifyIconOnline icon="ep:copy-document" />
        </button>
      </div>
    </div>

    <!-- Empty State -->
    <div class="parse-empty" v-else>
      <div class="parse-empty-inner">
        <div class="parse-empty-icon">
          <IconifyIconOnline icon="ri:film-line" />
        </div>
        <h3>粘贴视频链接开始解析</h3>
        <p>支持爱奇艺、腾讯视频、优酷、芒果TV、B站等主流平台</p>
        <div class="parse-empty-sites">
          <span
            v-for="site in popularSites"
            :key="site.name"
            class="empty-site-chip"
            @click="fillExample(site.url)"
          >
            {{ site.name }}
          </span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from "vue";
import { useRouter } from "vue-router";

const router = useRouter();

const inputValue = ref("");
const selectedApi = ref("1");
const currentUrl = ref("");
const loading = ref(false);
const history = ref<string[]>([]);

const apis = [
  { label: "默认接口", value: "1", url: "https://www.yemu.xyz/?url={{input}}" },
  { label: "备用接口1", value: "2", url: "https://jx.xmflv.cc/?url={{input}}" },
  { label: "备用接口2", value: "3", url: "https://jx.aidouer.net/?url={{input}}" },
  { label: "备用接口3", value: "4", url: "https://jx.m3u8.tv/jiexi/?url={{input}}" },
  { label: "备用接口4", value: "5", url: "https://www.8090g.cn/?url={{input}}" },
];

const popularSites = [
  { name: "爱奇艺", url: "https://www.iqiyi.com/" },
  { name: "腾讯视频", url: "https://v.qq.com/" },
  { name: "优酷", url: "https://www.youku.com/" },
  { name: "芒果TV", url: "https://www.mgtv.com/" },
  { name: "哔哩哔哩", url: "https://www.bilibili.com/" },
  { name: "西瓜视频", url: "https://www.ixigua.com/" },
];

function parseUrl() {
  if (!inputValue.value.trim()) return;

  loading.value = true;
  let url = inputValue.value.trim();
  if (!url.startsWith("http://") && !url.startsWith("https://")) {
    url = "https://" + url;
    inputValue.value = url;
  }

  const api = apis.find(a => a.value === selectedApi.value);
  if (api) {
    currentUrl.value = api.url.replace("{{input}}", encodeURIComponent(url));
  }

  // Save history
  if (!history.value.includes(inputValue.value)) {
    history.value.unshift(inputValue.value);
    if (history.value.length > 6) history.value.pop();
    localStorage.setItem("video-parse-history", JSON.stringify(history.value));
  }

  loading.value = false;
}

function selectFromHistory(url: string) {
  inputValue.value = url;
  parseUrl();
}

function clearAll() {
  inputValue.value = "";
  currentUrl.value = "";
}

function openVideoSite(url: string) {
  window.open(url, "_blank");
}

function fillExample(url: string) {
  inputValue.value = url + (url.endsWith("/") ? "" : "");
}

async function copyCurrentUrl() {
  try {
    await navigator.clipboard.writeText(currentUrl.value);
  } catch { /* ignore */ }
}

function goBack() {
  router.push("/video/search");
}

// Load history on mount
const saved = localStorage.getItem("video-parse-history");
if (saved) {
  try { history.value = JSON.parse(saved); } catch { /* ignore */ }
}
</script>

<style scoped>
.video-parse-page {
  width: 100%;
  min-height: 100vh;
  background: #08080f;
}

/* ── Top Bar ── */
.parse-top-bar {
  display: flex;
  align-items: center;
  padding: 10px 24px;
  background: rgba(255,255,255,.02);
  border-bottom: 1px solid rgba(255,255,255,.05);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  position: sticky; top: 0; z-index: 50;
  gap: 16px;
}
.back-btn {
  width: 36px; height: 36px;
  border: 1px solid rgba(255,255,255,.08);
  border-radius: 10px;
  background: rgba(255,255,255,.04);
  color: rgba(255,255,255,.5);
  cursor: pointer;
  display: flex; align-items: center; justify-content: center;
  font-size: 18px;
  transition: all .25s ease;
  flex-shrink: 0;
}
.back-btn:hover {
  background: rgba(99,102,241,.12);
  color: #a5b4fc;
  border-color: rgba(99,102,241,.25);
}

.parse-top-title { flex: 1; }
.parse-top-logo {
  display: flex;
  align-items: center;
  gap: 8px;
}
.parse-logo-icon {
  width: 32px; height: 32px;
  background: linear-gradient(135deg,#6366f1,#a855f7);
  border-radius: 8px;
  display: flex; align-items: center; justify-content: center;
  font-size: 16px; color: #fff;
}
.parse-top-logo span {
  font-size: 16px; font-weight: 700;
  background: linear-gradient(135deg,#e0e7ff,#a5b4fc);
  -webkit-background-clip: text; -webkit-text-fill-color: transparent;
  background-clip: text;
}

.top-bar-btn {
  width: 36px; height: 36px;
  border: 1px solid rgba(255,255,255,.08);
  border-radius: 10px;
  background: rgba(255,255,255,.04);
  color: rgba(255,255,255,.45);
  cursor: pointer;
  display: flex; align-items: center; justify-content: center;
  font-size: 18px;
  transition: all .25s ease;
}
.top-bar-btn:hover {
  background: rgba(239,68,68,.1);
  color: #ef4444;
  border-color: rgba(239,68,68,.2);
}

/* ── Input Section ── */
.parse-input-section {
  padding: 24px 24px 8px;
  max-width: 960px;
  margin: 0 auto;
  width: 100%;
}
.parse-input-row {
  display: flex;
  gap: 10px;
}
.parse-input-wrapper {
  display: flex;
  gap: 8px;
  width: 100%;
  background: rgba(255,255,255,.02);
  border: 1px solid rgba(255,255,255,.06);
  border-radius: 14px;
  padding: 8px;
  transition: all .3s ease;
}
.parse-input-wrapper:focus-within {
  border-color: rgba(99,102,241,.3);
  box-shadow: 0 0 0 1px rgba(99,102,241,.08);
  background: rgba(255,255,255,.04);
}

.api-select {
  padding: 0 12px;
  height: 40px;
  border: none;
  border-radius: 8px;
  background: rgba(255,255,255,.04);
  color: rgba(255,255,255,.6);
  font-size: 13px;
  font-weight: 500;
  outline: none;
  cursor: pointer;
  min-width: 110px;
  transition: all .2s;
}
.api-select:hover {
  background: rgba(255,255,255,.08);
}
.api-select option { background: #1a1a2e; color: #fff; }

.parse-url-input {
  flex: 1;
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 0 12px;
  background: rgba(255,255,255,.02);
  border: 1px solid rgba(255,255,255,.05);
  border-radius: 8px;
  transition: all .2s;
}
.parse-url-input:focus-within {
  border-color: rgba(99,102,241,.25);
}
.url-ico { font-size: 16px; color: rgba(255,255,255,.2); flex-shrink: 0; }
.url-field {
  flex: 1; height: 40px;
  border: none; outline: none;
  font-size: 13px; color: #fff;
  background: transparent;
  min-width: 0;
}
.url-field::placeholder { color: rgba(255,255,255,.2); }

.clear-btn-sm {
  width: 22px; height: 22px;
  border: none; border-radius: 50%;
  background: rgba(255,255,255,.08);
  color: rgba(255,255,255,.35);
  cursor: pointer; font-size: 11px;
  display: flex; align-items: center; justify-content: center;
  transition: all .2s; flex-shrink: 0;
}
.clear-btn-sm:hover { background: rgba(255,255,255,.15); color: #fff; }

.parse-btn {
  height: 40px; padding: 0 22px;
  border: none; border-radius: 8px;
  font-size: 14px; font-weight: 600; color: #fff;
  background: linear-gradient(135deg,#6366f1,#a855f7);
  cursor: pointer;
  display: flex; align-items: center; gap: 6px;
  transition: all .3s ease;
  box-shadow: 0 3px 12px rgba(99,102,241,.2);
  flex-shrink: 0;
}
.parse-btn:hover:not(:disabled) {
  transform: translateY(-1px);
  box-shadow: 0 5px 18px rgba(99,102,241,.3);
}
.parse-btn:disabled { opacity: .5; cursor: not-allowed; }

/* Meta row */
.parse-meta-row {
  margin-top: 14px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.meta-group {
  display: flex;
  align-items: center;
  gap: 6px;
  flex-wrap: wrap;
}
.meta-label {
  font-size: 12px;
  color: rgba(255,255,255,.25);
  display: flex;
  align-items: center;
  gap: 4px;
  font-weight: 500;
  flex-shrink: 0;
}
.meta-chip {
  font-size: 12px;
  padding: 3px 10px;
  border-radius: 6px;
  background: rgba(255,255,255,.03);
  border: 1px solid rgba(255,255,255,.05);
  color: rgba(255,255,255,.4);
  cursor: pointer;
  transition: all .2s ease;
  font-weight: 500;
}
.meta-chip:hover {
  background: rgba(99,102,241,.08);
  border-color: rgba(99,102,241,.15);
  color: #a5b4fc;
}
.history-chip {
  max-width: 200px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.history-chip.active {
  background: rgba(99,102,241,.1);
  border-color: rgba(99,102,241,.2);
  color: #a5b4fc;
}

/* ── Player Section ── */
.parse-player-section {
  max-width: 960px;
  margin: 20px auto 0;
  padding: 0 24px 40px;
}
.player-container {
  position: relative;
  width: 100%;
  padding-bottom: 56.25%;
  background: #000;
  border-radius: 16px;
  overflow: hidden;
  box-shadow: 0 8px 40px rgba(0,0,0,.4), 0 0 60px rgba(99,102,241,.06);
  border: 1px solid rgba(255,255,255,.06);
}
.player-iframe {
  position: absolute;
  top: 0; left: 0;
  width: 100%; height: 100%;
  border: none;
}
.player-watermark {
  position: absolute;
  bottom: 16px; right: 16px;
  font-size: 24px;
  color: rgba(255,255,255,.06);
  pointer-events: none;
}

.player-url-bar {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 12px;
  padding: 10px 16px;
  background: rgba(255,255,255,.02);
  border: 1px solid rgba(255,255,255,.05);
  border-radius: 10px;
}
.player-url-label {
  font-size: 12px;
  color: rgba(255,255,255,.3);
  font-weight: 500;
  flex-shrink: 0;
}
.player-url-text {
  font-size: 12px;
  color: rgba(255,255,255,.2);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-family: monospace;
  flex: 1;
}
.copy-url-btn {
  width: 30px; height: 30px;
  border: none; border-radius: 6px;
  background: rgba(255,255,255,.05);
  color: rgba(255,255,255,.35);
  cursor: pointer;
  display: flex; align-items: center; justify-content: center;
  font-size: 14px;
  transition: all .2s;
  flex-shrink: 0;
}
.copy-url-btn:hover {
  background: rgba(99,102,241,.1);
  color: #a5b4fc;
}

/* ── Empty State ── */
.parse-empty {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 50vh;
  padding: 40px 24px;
}
.parse-empty-inner {
  text-align: center;
  max-width: 480px;
}
.parse-empty-icon {
  font-size: 72px;
  color: rgba(255,255,255,.04);
  margin-bottom: 16px;
}
.parse-empty-inner h3 {
  font-size: 18px;
  font-weight: 600;
  color: rgba(255,255,255,.35);
  margin: 0 0 8px;
}
.parse-empty-inner p {
  font-size: 14px;
  color: rgba(255,255,255,.2);
  margin: 0 0 24px;
}
.parse-empty-sites {
  display: flex;
  gap: 8px;
  justify-content: center;
  flex-wrap: wrap;
}
.empty-site-chip {
  padding: 6px 16px;
  border: 1px solid rgba(255,255,255,.06);
  border-radius: 8px;
  background: rgba(255,255,255,.02);
  color: rgba(255,255,255,.35);
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: all .2s ease;
}
.empty-site-chip:hover {
  background: rgba(99,102,241,.08);
  border-color: rgba(99,102,241,.15);
  color: #a5b4fc;
}

/* ── Responsive ── */
@media (max-width: 768px) {
  .parse-top-bar { padding: 10px 16px; }
  .parse-input-section { padding: 16px 16px 8px; }
  .parse-input-wrapper { flex-wrap: wrap; }
  .api-select { width: 100%; }
  .parse-btn { width: 100%; justify-content: center; }
  .parse-player-section { padding: 0 16px 40px; }
  .parse-meta-row { gap: 6px; }
  .meta-group { gap: 4px; }
  .history-chip { max-width: 140px; }
}

@media (max-width: 480px) {
  .parse-url-input { flex: auto; width: 100%; }
}
</style>
