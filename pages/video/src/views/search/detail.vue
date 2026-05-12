<template>
  <div class="video-detail-page">
    <!-- Loading -->
    <div v-if="loading" class="loading-container">
      <div class="spinner"></div>
      <p>加载中...</p>
    </div>

    <!-- Content -->
    <template v-else-if="videoDetail">
      <div class="detail-hero">
        <div class="hero-bg" :style="{ backgroundImage: (videoDetail.videoPic || videoDetail.videoCover || videoDetail.poster) ? `url(${videoDetail.videoPic || videoDetail.videoCover || videoDetail.poster})` : 'none' }"></div>
        <div class="hero-overlay"></div>

        <div class="hero-content">
          <button class="back-btn" @click="goBack">
            <IconifyIconOnline icon="ep:arrow-left" />
          </button>

          <div class="hero-main">
            <div class="hero-poster">
              <img
                :src="videoDetail.videoPic || videoDetail.videoCover || videoDetail.poster || '/placeholder.jpg'"
                :alt="videoDetail.videoName"
                @error="handleImgError"
              />
              <div class="poster-glow"></div>
            </div>

            <div class="hero-info">
              <h1 class="hero-title">{{ videoDetail.videoName || videoDetail.videoTitle }}</h1>

              <div class="hero-tags">
                <span v-if="videoDetail.videoType" class="tag">{{ videoDetail.videoType }}</span>
                <span v-if="videoDetail.videoYear" class="tag">{{ videoDetail.videoYear }}</span>
                <span v-if="videoDetail.videoDuration" class="tag">{{ videoDetail.videoDuration }}</span>
              </div>

              <div class="hero-stats">
                <div class="stat-item" v-if="videoDetail.videoPopularity">
                  <IconifyIconOnline icon="ep:view" />
                  <span>{{ videoDetail.videoPopularity }} 热度</span>
                </div>
                <div class="stat-item" v-if="videoDetail.videoScore">
                  <IconifyIconOnline icon="ep:star-filled" style="color:#fbbf24" />
                  <span>{{ videoDetail.videoScore }} 分</span>
                </div>
              </div>

              <div class="hero-actions">
                <button class="action-btn primary" @click="playVideo" v-if="playUrl">
                  <IconifyIconOnline icon="ep:video-play" />
                  在线播放
                </button>
                <button class="action-btn" @click="shareVideo">
                  <IconifyIconOnline icon="ep:share" />
                  分享
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Details body -->
      <div class="detail-body">
        <div class="body-inner">
          <!-- Description -->
          <section class="section" v-if="videoDetail.videoDescription">
            <h2 class="section-title">
              <IconifyIconOnline icon="ep:document" />
              剧情简介
            </h2>
            <p class="section-text">{{ videoDetail.videoDescription }}</p>
          </section>

          <!-- Actor -->
          <section class="section" v-if="actors.length > 0">
            <h2 class="section-title">
              <IconifyIconOnline icon="ep:user" />
              主演
            </h2>
            <div class="actor-list">
              <span v-for="actor in actors" :key="actor" class="actor-chip">{{ actor }}</span>
            </div>
          </section>

          <!-- Play Addresses -->
          <section class="section" v-if="playAddresses.length > 0">
            <h2 class="section-title">
              <IconifyIconOnline icon="ep:video-camera" />
              播放地址
            </h2>
            <div class="play-list">
              <div
                v-for="(addr, idx) in playAddresses"
                :key="idx"
                class="play-item"
                @click="selectPlay(idx)"
              >
                <div class="play-left">
                  <span class="play-number">{{ idx + 1 }}</span>
                  <span class="play-name">{{ addr.playAddressName || addr.name || `线路 ${idx + 1}` }}</span>
                </div>
                <span class="play-url" v-if="addr.playAddressUrl || addr.url">{{ (addr.playAddressUrl || addr.url).substring(0, 40) }}...</span>
              </div>
            </div>
          </section>

          <!-- Downloads -->
          <section class="section" v-if="downloads.length > 0">
            <h2 class="section-title">
              <IconifyIconOnline icon="ep:download" />
              下载地址
              <button class="copy-all-btn" @click="copyAllDownloads">全部复制</button>
            </h2>
            <div class="download-list">
              <div
                v-for="(dl, idx) in downloads"
                :key="idx"
                class="download-item"
              >
                <div class="download-info">
                  <span class="download-quality">{{ dl.name || dl.title || dl.playAddressName || `资源 ${idx + 1}` }}</span>
                  <span class="download-url">{{ dl.url || dl.playAddressUrl }}</span>
                </div>
                <div class="download-actions">
                  <button class="dl-btn copy" @click.stop="copyText(dl.url || dl.playAddressUrl)" title="复制链接">
                    <IconifyIconOnline icon="ep:copy-document" />
                  </button>
                  <button class="dl-btn open" @click.stop="openUrl(dl.url || dl.playAddressUrl)" title="打开">
                    <IconifyIconOnline icon="ep:link" />
                  </button>
                </div>
              </div>
            </div>
          </section>

          <!-- Links fallback (videoPlayAddress or other fields) -->
          <section class="section" v-if="links.length > 0 && playAddresses.length === 0 && downloads.length === 0">
            <h2 class="section-title">
              <IconifyIconOnline icon="ep:link" />
              资源链接
            </h2>
            <div class="download-list">
              <div v-for="(link, idx) in links" :key="idx" class="download-item">
                <div class="download-info">
                  <span class="download-quality">{{ link.name || `链接 ${idx + 1}` }}</span>
                  <span class="download-url">{{ link.url }}</span>
                </div>
                <div class="download-actions">
                  <button class="dl-btn copy" @click.stop="copyText(link.url)">
                    <IconifyIconOnline icon="ep:copy-document" />
                  </button>
                  <button class="dl-btn open" @click.stop="openUrl(link.url)">
                    <IconifyIconOnline icon="ep:link" />
                  </button>
                </div>
              </div>
            </div>
          </section>
        </div>
      </div>
    </template>

    <!-- Not found -->
    <div v-else class="not-found">
      <IconifyIconOnline icon="ep:video-pause" class="nf-icon" />
      <h3>视频不存在或已被删除</h3>
      <button class="retry-btn" @click="goBack">返回搜索</button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import { useRoute, useRouter } from "vue-router";

interface VideoDetailData {
  videoName?: string;
  videoTitle?: string;
  videoPic?: string;
  videoCover?: string;
  videoType?: string;
  videoYear?: number;
  videoDuration?: string;
  videoDescription?: string;
  videoScore?: number;
  videoPopularity?: number;
  videoDirector?: string;
  videoWriter?: string;
  videoActor?: string;
  videoLanguage?: string;
  videoPlayAddress?: string;
  videoDownload?: string;
  playAddressesList?: any[];
  downloadList?: any[];
  [key: string]: any;
}

const route = useRoute();
const router = useRouter();

const loading = ref(true);
const videoDetail = ref<VideoDetailData | null>(null);

// Data passed via router state when coming from search pages
const passedItem = (history.state?.item || null) as VideoDetailData | null;

function hasValidData(d: any): boolean {
  if (!d) return false;
  return !!(
    d.videoName ||
    d.videoTitle ||
    d.videoDescription ||
    d.videoActor ||
    (d.playAddressesList && d.playAddressesList.length > 0) ||
    (d.downloadList && d.downloadList.length > 0)
  );
}

const loadDetail = async (id: string) => {
  loading.value = true;

  // Use passed data from search page if available
  if (passedItem && hasValidData(passedItem)) {
    videoDetail.value = passedItem;
    loading.value = false;
    return;
  }

  // Try detail API
  try {
    const res = await fetch(`/api/v1/video/${encodeURIComponent(id)}`);
    const raw = await res.json();
    const detail = raw?.data || {};

    // If detail API returns stub, try search-all API with the ID as keyword
    if (!hasValidData(detail)) {
      try {
        const searchRes = await fetch(`/api/v1/video/search-all?keyword=${encodeURIComponent(id)}&page=1&pageSize=5`);
        const searchRaw = await searchRes.json();
        const d = searchRaw?.data;
        const list = d?.data || d?.list || [];
        const found = list.find(
          (item: any) =>
            String(item.videoOriginId) === String(id) ||
            String(item.videoId) === String(id) ||
            String(item.id) === String(id)
        );
        if (found && hasValidData(found)) {
          videoDetail.value = { ...found, ...detail };
          loading.value = false;
          return;
        }
      } catch { /* search fallback failed */ }
    }

    videoDetail.value = hasValidData(detail) ? detail : null;
  } catch (err) {
    console.error("加载详情失败:", err);
    videoDetail.value = null;
  } finally {
    loading.value = false;
  }
};

const actors = computed(() => {
  const d = videoDetail.value;
  if (!d) return [];
  if (d.videoActor) return d.videoActor.split(/[,，、\s]+/).filter(Boolean);
  return [];
});

const playAddresses = computed(() => {
  const d = videoDetail.value;
  if (!d) return [];
  if (d.playAddressesList && d.playAddressesList.length > 0) return d.playAddressesList;
  if (d.videoPlayAddress) return [{ name: "播放地址", url: d.videoPlayAddress }];
  return [];
});

const downloads = computed(() => {
  const d = videoDetail.value;
  if (!d) return [];
  if (d.downloadList && d.downloadList.length > 0) return d.downloadList;
  if (d.videoDownload) return [{ name: "下载地址", url: d.videoDownload }];
  return [];
});

const links = computed(() => {
  const d = videoDetail.value;
  if (!d) return [];
  return Object.entries(d)
    .filter(([k, v]) => {
      if (["videoName","videoTitle","videoPic","videoCover","videoType","videoYear","videoDuration","videoDescription","videoScore","videoPopularity","videoDirector","videoWriter","videoActor","videoLanguage","videoPlayAddress","videoDownload","playAddressesList","downloadList","id","videoOriginId","createTime","updateTime"].includes(k)) return false;
      if (!v || typeof v !== "string") return false;
      return v.startsWith("http://") || v.startsWith("https://") || v.startsWith("magnet:") || v.startsWith("thunder:");
    })
    .map(([k, v]) => ({ name: k, url: v }));
});

const playUrl = computed(() => {
  if (playAddresses.value.length > 0) {
    return playAddresses.value[0].playAddressUrl || playAddresses.value[0].url;
  }
  return videoDetail.value?.videoPlayAddress || null;
});

const handleImgError = (e: Event) => {
  const img = e.target as HTMLImageElement;
  img.src = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="300" height="450" fill="%23222"><rect width="300" height="450"/><text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" fill="%23666" font-size="16">暂无封面</text></svg>';
};

const goBack = () => {
  if (window.history.length > 2) router.go(-1);
  else router.push("/video/search");
};

const playVideo = () => {
  if (playUrl.value) {
    router.push({
      path: "/video/play",
      query: {
        url: encodeURIComponent(playUrl.value),
        title: videoDetail.value?.videoName || videoDetail.value?.videoTitle || "",
      },
    });
  }
};

const selectPlay = (idx: number) => {
  const addr = playAddresses.value[idx];
  const url = addr?.playAddressUrl || addr?.url;
  if (url) {
    router.push({
      path: "/video/play",
      query: {
        url: encodeURIComponent(url),
        title: videoDetail.value?.videoName || videoDetail.value?.videoTitle || "",
      },
    });
  }
};

const copyText = async (text: string) => {
  try {
    await navigator.clipboard.writeText(text);
  } catch { /* ignore */ }
};

const copyAllDownloads = async () => {
  const texts = downloads.value.map(d => d.url || d.playAddressUrl).filter(Boolean).join("\n");
  if (texts) await copyText(texts);
};

const openUrl = (url: string) => {
  window.open(url, "_blank");
};

const shareVideo = async () => {
  const text = `${videoDetail.value?.videoName || videoDetail.value?.videoTitle} - ${window.location.href}`;
  await copyText(text);
};

onMounted(() => {
  const videoId = (route.query.id as string) || (route.params.id as string);
  if (videoId) loadDetail(videoId);
  else loading.value = false;
});
</script>

<style scoped>
/* ── Base ── */
.video-detail-page {
  width: 100%;
  min-height: 100vh;
  background: #08080f;
}

/* ── Loading ── */
.loading-container {
  display: flex; flex-direction: column;
  align-items: center; justify-content: center;
  min-height: 60vh;
  color: rgba(255,255,255,.35);
}
.spinner {
  width: 40px; height: 40px;
  border: 3px solid rgba(99,102,241,.12);
  border-top-color: #6366f1;
  border-radius: 50%;
  animation: spin .8s linear infinite;
  margin-bottom: 16px;
}
@keyframes spin { to { transform: rotate(360deg); } }

/* ── Hero ── */
.detail-hero {
  position: relative;
  min-height: 560px;
  display: flex; align-items: center;
  overflow: hidden;
}
.hero-bg {
  position: absolute; inset: 0;
  background-size: cover; background-position: center;
  filter: blur(80px) brightness(.18);
  transform: scale(1.3);
}
.hero-overlay {
  position: absolute; inset: 0;
  background: linear-gradient(180deg, rgba(8,8,15,.3) 0%, #08080f 100%);
}
.hero-content {
  position: relative; z-index: 2;
  width: 100%;
  padding: 32px 48px;
}

.back-btn {
  width: 42px; height: 42px;
  border: 1px solid rgba(255,255,255,.08);
  border-radius: 14px;
  background: rgba(255,255,255,.04);
  color: rgba(255,255,255,.5);
  cursor: pointer;
  display: flex; align-items: center; justify-content: center;
  font-size: 20px;
  margin-bottom: 28px;
  transition: all .25s ease;
}
.back-btn:hover {
  background: rgba(99,102,241,.12);
  color: #a5b4fc; border-color: rgba(99,102,241,.3);
  transform: translateX(-2px);
}

.hero-main {
  display: flex; gap: 56px;
  align-items: flex-start;
}

/* ── Poster ── */
.hero-poster {
  width: 320px;
  flex-shrink: 0;
  border-radius: 20px;
  overflow: hidden;
  position: relative;
  box-shadow: 0 24px 80px rgba(0,0,0,.6), 0 0 60px rgba(99,102,241,.08);
}
.hero-poster img { width: 100%; display: block; }
.poster-glow {
  position: absolute; inset: 0;
  box-shadow: inset 0 0 60px rgba(99,102,241,.12);
  border-radius: 20px;
}

/* ── Info ── */
.hero-info { flex: 1; padding-top: 12px; }

.hero-title {
  font-size: 42px; font-weight: 800; color: #e0e7ff;
  margin: 0 0 20px; line-height: 1.2;
  letter-spacing: -.5px;
}

.hero-tags {
  display: flex; gap: 10px; flex-wrap: wrap;
  margin-bottom: 24px;
}
.tag {
  padding: 6px 16px; font-size: 13px;
  border-radius: 10px;
  background: rgba(255,255,255,.05);
  color: rgba(255,255,255,.45);
  border: 1px solid rgba(255,255,255,.06);
  font-weight: 500;
}

.hero-stats {
  display: flex; gap: 28px;
  margin-bottom: 28px;
}
.stat-item {
  display: flex; align-items: center; gap: 8px;
  font-size: 15px; color: rgba(255,255,255,.4);
}

.hero-actions { display: flex; gap: 14px; }
.action-btn {
  display: flex; align-items: center; gap: 8px;
  padding: 14px 32px;
  border: none; border-radius: 14px;
  font-size: 15px; font-weight: 600;
  cursor: pointer;
  transition: all .3s ease;
  position: relative;
}
.action-btn.primary {
  background: linear-gradient(135deg,#6366f1,#a855f7);
  color: #fff;
  box-shadow: 0 6px 24px rgba(99,102,241,.35);
  overflow: hidden;
}
.action-btn.primary::before {
  content: '';
  position: absolute; inset: 0;
  background: linear-gradient(135deg,#a855f7,#ec4899);
  opacity: 0; transition: opacity .3s ease;
}
.action-btn.primary > * { position: relative; z-index: 1; }
.action-btn.primary:hover::before { opacity: 1; }
.action-btn.primary:hover {
  transform: translateY(-2px);
  box-shadow: 0 10px 36px rgba(99,102,241,.45);
}

.action-btn:not(.primary) {
  background: rgba(255,255,255,.06);
  color: rgba(255,255,255,.55);
  border: 1px solid rgba(255,255,255,.08);
}
.action-btn:not(.primary):hover {
  background: rgba(255,255,255,.1);
  color: #a5b4fc;
  border-color: rgba(99,102,241,.25);
  transform: translateY(-2px);
}

/* ── Body ── */
.detail-body { padding: 48px; }
.body-inner {
  display: flex; flex-direction: column; gap: 28px;
}

.section {
  background: rgba(255,255,255,.02);
  border: 1px solid rgba(255,255,255,.06);
  border-radius: 20px;
  padding: 32px;
  transition: border-color .3s ease;
}
.section:hover { border-color: rgba(255,255,255,.09); }

.section-title {
  font-size: 20px; font-weight: 700; color: #e0e7ff;
  margin: 0 0 20px;
  display: flex; align-items: center; gap: 10px;
}

.copy-all-btn {
  margin-left: auto;
  padding: 6px 18px; font-size: 12px;
  border: 1px solid rgba(255,255,255,.08);
  border-radius: 10px;
  background: rgba(255,255,255,.04);
  color: rgba(255,255,255,.45);
  cursor: pointer;
  transition: all .2s ease;
  font-weight: 500;
}
.copy-all-btn:hover {
  background: rgba(99,102,241,.12);
  color: #a5b4fc;
  border-color: rgba(99,102,241,.25);
}

.section-text {
  font-size: 15px; line-height: 1.9;
  color: rgba(255,255,255,.45);
  margin: 0;
}

/* ── Actor chips ── */
.actor-list { display: flex; flex-wrap: wrap; gap: 10px; }
.actor-chip {
  padding: 8px 20px; font-size: 14px;
  border-radius: 100px;
  background: rgba(99,102,241,.08);
  color: #a5b4fc;
  border: 1px solid rgba(99,102,241,.12);
  transition: all .25s ease;
  font-weight: 500;
}
.actor-chip:hover {
  background: rgba(99,102,241,.16);
  border-color: rgba(99,102,241,.25);
  transform: translateY(-1px);
}

/* ── Play list ── */
.play-list { display: flex; flex-direction: column; gap: 10px; }
.play-item {
  display: flex; align-items: center; justify-content: space-between;
  padding: 14px 20px;
  background: rgba(255,255,255,.02);
  border: 1px solid rgba(255,255,255,.06);
  border-radius: 14px;
  cursor: pointer;
  transition: all .25s ease;
  gap: 16px;
}
.play-item:hover {
  background: rgba(99,102,241,.06);
  border-color: rgba(99,102,241,.2);
  transform: translateX(4px);
}

.play-left { display: flex; align-items: center; gap: 12px; flex-shrink: 0; }
.play-number {
  width: 28px; height: 28px;
  display: flex; align-items: center; justify-content: center;
  border-radius: 8px;
  background: rgba(99,102,241,.12);
  color: #a5b4fc;
  font-size: 13px; font-weight: 700;
}
.play-name { font-size: 15px; font-weight: 500; color: rgba(255,255,255,.65); }
.play-url {
  font-size: 13px; color: rgba(255,255,255,.25);
  overflow: hidden; text-overflow: ellipsis; white-space: nowrap; min-width: 0;
  font-family: monospace;
}

/* ── Downloads ── */
.download-list { display: flex; flex-direction: column; gap: 10px; }
.download-item {
  display: flex; align-items: center; justify-content: space-between;
  padding: 16px 20px;
  background: rgba(255,255,255,.02);
  border: 1px solid rgba(255,255,255,.06);
  border-radius: 14px;
  transition: all .25s ease;
  gap: 16px;
}
.download-item:hover {
  border-color: rgba(99,102,241,.18);
  background: rgba(255,255,255,.04);
}

.download-info { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 6px; }
.download-quality { font-size: 15px; font-weight: 600; color: #e0e7ff; }
.download-url {
  font-size: 12px; color: rgba(255,255,255,.2);
  overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
  font-family: monospace;
}

.download-actions { display: flex; gap: 8px; flex-shrink: 0; }
.dl-btn {
  width: 38px; height: 38px;
  border: 1px solid rgba(255,255,255,.08);
  border-radius: 10px;
  background: rgba(255,255,255,.04);
  color: rgba(255,255,255,.4);
  cursor: pointer;
  display: flex; align-items: center; justify-content: center;
  font-size: 16px;
  transition: all .2s ease;
}
.dl-btn.copy:hover {
  background: rgba(99,102,241,.12);
  color: #a5b4fc;
  border-color: rgba(99,102,241,.25);
}
.dl-btn.open:hover {
  background: rgba(34,197,94,.1);
  color: #4ade80;
  border-color: rgba(34,197,94,.2);
}

/* ── Not found ── */
.not-found {
  display: flex; flex-direction: column;
  align-items: center; justify-content: center;
  min-height: 60vh; gap: 20px;
}
.nf-icon { font-size: 72px; color: rgba(255,255,255,.06); }
.not-found h3 { color: rgba(255,255,255,.35); margin: 0; font-size: 18px; font-weight: 600; }
.retry-btn {
  padding: 12px 32px;
  border: none; border-radius: 12px;
  background: linear-gradient(135deg,#6366f1,#a855f7);
  color: #fff; font-size: 14px; font-weight: 600;
  cursor: pointer;
  transition: all .3s ease;
  box-shadow: 0 4px 16px rgba(99,102,241,.3);
}
.retry-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 28px rgba(99,102,241,.4);
}

/* ── Responsive ── */
@media (max-width: 768px) {
  .hero-content { padding: 24px 20px; }
  .detail-hero { min-height: auto; }
  .hero-main { flex-direction: column; align-items: center; text-align: center; gap: 28px; }
  .hero-poster { width: 200px; }
  .hero-title { font-size: 28px; }
  .hero-tags, .hero-stats, .hero-actions { justify-content: center; }
  .detail-body { padding: 20px; }
  .section { padding: 20px; }
  .section-title { font-size: 17px; }
  .play-item { flex-direction: column; align-items: flex-start; }
  .play-url { width: 100%; }
  .play-item:hover { transform: none; }
}
</style>
