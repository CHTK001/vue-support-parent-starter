<template>
  <div class="device-preview-page">
    <div class="device-preview-hero">
      <div class="device-preview-hero__left">
        <div class="device-preview-badge">
          <span class="device-preview-badge__label">{{ platformName }}</span>
          <span class="device-preview-badge__code">{{ platformCode || '未识别' }}</span>
        </div>
        <div>
          <h1 class="device-preview-title">{{ title }}</h1>
          <p class="device-preview-desc">
            {{ visibleDevices.length }} 台设备 · {{ liveCount }} 台在线 · {{ playbackCount }} 台回放中
          </p>
        </div>
      </div>
      <div class="device-preview-hero__right">
        <el-segmented v-model="mode" :options="layoutOptions" />
        <ScButton :icon="useRenderIcon('ri:play-line')" @click="handleLoadLive">
          直播
        </ScButton>
        <ScButton :icon="useRenderIcon('ri:history-line')" @click="handleLoadPlayback">
          回放
        </ScButton>
        <ScButton :icon="useRenderIcon('ri:refresh-line')" @click="handleReloadAll">
          刷新
        </ScButton>
        <ScButton :icon="useRenderIcon('ri:arrow-left-line')" @click="handleBack">
          返回
        </ScButton>
      </div>
    </div>

    <div class="device-preview-summary">
      <div class="device-preview-summary__item">
        <span class="device-preview-summary__label">平台</span>
        <span class="device-preview-summary__value">{{ platformName }}</span>
      </div>
      <div class="device-preview-summary__item">
        <span class="device-preview-summary__label">模式</span>
        <span class="device-preview-summary__value">{{ mode }} 宫格</span>
      </div>
      <div class="device-preview-summary__item">
        <span class="device-preview-summary__label">地址</span>
        <span class="device-preview-summary__value">{{ platformAddress || '未配置' }}</span>
      </div>
      <div class="device-preview-summary__item">
        <span class="device-preview-summary__label">项目</span>
        <span class="device-preview-summary__value">{{ platformProject || '未绑定' }}</span>
      </div>
    </div>

    <div class="device-preview-grid" :class="`device-preview-grid--${mode}`">
      <div
        v-for="(item, index) in visibleDevices"
        :key="item.sysDeviceId || index"
        class="camera-card"
      >
        <div class="camera-card__top">
          <div class="camera-card__main">
            <div class="camera-card__name">{{ item.sysDeviceName }}</div>
            <div class="camera-card__sub">
              {{ item.sysDeviceSerialNumber }} · {{ item.sysDeviceOrgName || '未分组' }}
            </div>
          </div>
          <el-tag :type="item.sysDeviceOnline === 1 ? 'success' : 'info'" effect="plain">
            {{ item.sysDeviceOnline === 1 ? '在线' : '离线' }}
          </el-tag>
        </div>

        <div class="camera-card__meta">
          <span>平台：{{ item.hikPlatformLabel }}</span>
          <span>通道：{{ item.sysDeviceChannelNumber || item.channelList?.[0]?.sysDeviceChannelNo || 1 }}</span>
          <span>码流：主码流</span>
        </div>

        <div class="camera-card__viewer">
          <video
            v-if="currentStreams[index]?.url"
            :ref="(el) => setVideoRef(el, index)"
            controls
            autoplay
            playsinline
            class="camera-card__video"
          ></video>
          <div v-else class="camera-card__empty">
            <div class="camera-card__empty-icon">
              <component :is="useRenderIcon('ri:video-line')" />
            </div>
            <div class="camera-card__empty-text">
              {{ emptyText(index) }}
            </div>
            <ScButton type="primary" :loading="loading[index]" @click="handlePlay(index)">
              播放
            </ScButton>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { useRenderIcon } from "@repo/components/ReIcon";
import { message } from "@repo/utils";
import Hls from "hls.js";
import { computed, defineExpose, nextTick, onBeforeUnmount, ref, shallowReactive, watch } from "vue";
import { useRouter } from "vue-router";
import { fetchPlaybackProjectForDevice } from "../../../../api/manage/device-template";

const router = useRouter();
const allDevices = ref([]);
const visibleDevices = ref([]);
const mode = ref("1");
const title = ref("设备预览");
const platformName = ref("海康平台");
const platformCode = ref("");
const platformAddress = ref("");
const platformProject = ref("");
const loading = shallowReactive({});
const videoRefs = shallowReactive({});
const currentStreams = shallowReactive({});
const hlsInstances = shallowReactive({});
const playModes = shallowReactive({});
const streamStates = shallowReactive({});

const layoutOptions = [
  { label: "1宫格", value: "1" },
  { label: "4宫格", value: "4" },
  { label: "9宫格", value: "9" },
];

const setVideoRef = (el, index) => {
  if (el) {
    videoRefs[index] = el;
  }
};

const getMaxCount = computed(() => Number(mode.value));
const liveCount = computed(() => Object.values(playModes).filter((item) => item === "live").length);
const playbackCount = computed(() => Object.values(playModes).filter((item) => item === "playback").length);

const platformLabelMap = {
  AF: "海康安防",
  YY: "海康云耀",
  YM: "海康云眸",
  HIKVISION_ISECURE: "海康安防",
  HIKVISION_YUNYAO: "海康云耀",
  HIKVISION_YUNMOU: "海康云眸",
  DAHUA_DSS: "大华 DSS",
  UNIVIEW: "宇视",
  HUAWEI: "华为",
  HUAWEI_IVS: "华为机器视觉",
  EZVIZ: "萤石",
  TIANDY: "天地伟业",
  ZTE: "中兴",
};

const resolvePlatformLabel = (value) => platformLabelMap[value] || value || "未识别";

const normalizeDevices = (devices) => {
  const list = (devices || []).filter((item) => item?.sysDeviceResourceType === "CAMERA");
  return list.map((item) => ({
    ...item,
    hikPlatformLabel: resolvePlatformLabel(item.hikPlatform),
  }));
};

const applyDevices = (devices) => {
  allDevices.value = normalizeDevices(devices);
  visibleDevices.value = allDevices.value.slice(0, getMaxCount.value);
};

const cleanupPlayer = (index) => {
  if (hlsInstances[index]) {
    hlsInstances[index].destroy();
    delete hlsInstances[index];
  }
  if (videoRefs[index]) {
    videoRefs[index].pause?.();
    videoRefs[index].src = "";
    videoRefs[index].load?.();
  }
  delete currentStreams[index];
  delete streamStates[index];
};

const handleBack = () => {
  router.back();
};

const resolveRequestPayload = (item) => ({
  sysDeviceId: item.sysDeviceId,
  channelNo: item.sysDeviceChannelNumber || item.channelList?.[0]?.sysDeviceChannelNo || 1,
  subtype: item.sysDeviceMainSubtype ?? 0,
});

const setStreamState = (index, state) => {
  streamStates[index] = state;
};

const isHlsUrl = (url) => /\.m3u8($|\?)/i.test(url);

const getPlaybackRange = (item) => {
  const start = item.startTime || item.playbackStartTime || item.queryStartTime || null;
  const end = item.endTime || item.playbackEndTime || item.queryEndTime || null;
  return { startTime: start, endTime: end };
};

const loadStream = async (index, playback = false) => {
  const item = visibleDevices.value[index];
  if (!item) {
    return;
  }
  loading[index] = true;
  setStreamState(index, playback ? "loading-playback" : "loading-live");
  try {
    const range = playback ? getPlaybackRange(item) : { startTime: null, endTime: null };
    const result = await fetchPlaybackProjectForDevice({
      ...resolveRequestPayload(item),
      ...range,
      protocol: "hls",
    });
    const url = result?.data || "";
    if (!url) {
      setStreamState(index, playback ? "empty-playback" : "empty-live");
      message("未获取到播放地址", { type: "warning" });
      return;
    }
    cleanupPlayer(index);
    currentStreams[index] = { url };
    playModes[index] = playback ? "playback" : "live";
    setStreamState(index, "loading-media");
    await nextTick();
    const video = videoRefs[index];
    if (!video) {
      setStreamState(index, "no-video-element");
      return;
    }
    if (isHlsUrl(url) && Hls.isSupported()) {
      const hls = new Hls();
      hlsInstances[index] = hls;
      hls.loadSource(url);
      hls.attachMedia(video);
      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        setStreamState(index, playback ? "playback-ready" : "live-ready");
        video.play().catch(() => {
          setStreamState(index, playback ? "playback-ready" : "live-ready");
        });
      });
      hls.on(Hls.Events.ERROR, (_, data) => {
        if (data?.fatal) {
          setStreamState(index, "error");
          message("视频流加载失败", { type: "error" });
        }
      });
      return;
    }
    video.src = url;
    await video.play().catch(() => {
      setStreamState(index, playback ? "playback-ready" : "live-ready");
    });
    setStreamState(index, playback ? "playback-ready" : "live-ready");
  } catch (error) {
    setStreamState(index, "error");
    message("拉流失败，请稍后重试", { type: "error" });
  } finally {
    loading[index] = false;
  }
};

const handlePlay = async (index) => {
  await loadStream(index, playModes[index] === "playback");
};

const handleLoadLive = async () => {
  visibleDevices.value.forEach((_, index) => {
    playModes[index] = "live";
  });
  for (let i = 0; i < visibleDevices.value.length; i += 1) {
    await loadStream(i, false);
  }
};

const handleLoadPlayback = async () => {
  visibleDevices.value.forEach((_, index) => {
    playModes[index] = "playback";
  });
  for (let i = 0; i < visibleDevices.value.length; i += 1) {
    await loadStream(i, true);
  }
};

const handleReloadAll = async () => {
  for (let i = 0; i < visibleDevices.value.length; i += 1) {
    cleanupPlayer(i);
  }
  const modeFlag = Object.values(playModes)[0] === "playback";
  for (let i = 0; i < visibleDevices.value.length; i += 1) {
    await loadStream(i, modeFlag);
  }
};

const handleOpen = async (devices) => {
  const list = Array.isArray(devices) ? devices : devices ? [devices] : [];
  applyDevices(list);
  Object.keys(hlsInstances).forEach((index) => cleanupPlayer(index));
  Object.keys(currentStreams).forEach((key) => delete currentStreams[key]);
  Object.keys(playModes).forEach((key) => delete playModes[key]);
  Object.keys(streamStates).forEach((key) => delete streamStates[key]);
  Object.keys(loading).forEach((key) => delete loading[key]);
  Object.keys(videoRefs).forEach((key) => delete videoRefs[key]);
  mode.value = allDevices.value.length > 4 ? "9" : allDevices.value.length > 1 ? "4" : "1";
  visibleDevices.value = allDevices.value.slice(0, Number(mode.value));
  const first = visibleDevices.value[0];
  platformName.value = resolvePlatformLabel(first?.hikPlatform || first?.sysDeviceResourceType || "海康平台");
  platformCode.value = first?.hikPlatform || "";
  platformAddress.value = first?.hikAddress || "";
  platformProject.value = first?.hikProjectCode || first?.hikProjectId || "";
  title.value = allDevices.value.map((item) => item.sysDeviceName).join(" / ") || "设备预览";
  visibleDevices.value.forEach((_, index) => {
    playModes[index] = "live";
    setStreamState(index, "idle");
  });
};

watch(mode, () => {
  const maxCount = getMaxCount.value;
  Object.keys(visibleDevices.value)
    .map(Number)
    .filter((index) => index >= maxCount)
    .forEach((index) => cleanupPlayer(index));
  visibleDevices.value = allDevices.value.slice(0, maxCount);
});

const handleClose = () => {
  Object.keys(hlsInstances).forEach((index) => cleanupPlayer(index));
  allDevices.value = [];
  visibleDevices.value = [];
  Object.keys(currentStreams).forEach((key) => delete currentStreams[key]);
  Object.keys(playModes).forEach((key) => delete playModes[key]);
  Object.keys(streamStates).forEach((key) => delete streamStates[key]);
  Object.keys(loading).forEach((key) => delete loading[key]);
  Object.keys(videoRefs).forEach((key) => delete videoRefs[key]);
  title.value = "设备预览";
  platformName.value = "海康平台";
  platformCode.value = "";
  platformAddress.value = "";
  platformProject.value = "";
};

const emptyText = (index) => {
  const state = streamStates[index] || "idle";
  if (state === "loading-live") return "正在加载直播流…";
  if (state === "loading-playback") return "正在加载回放流…";
  if (state === "empty-live") return "直播地址未返回";
  if (state === "empty-playback") return "回放地址未返回";
  if (state === "error") return "播放失败，点击重试";
  if (state === "no-video-element") return "播放器未准备好";
  return playModes[index] === "playback" ? "回放未加载" : "未加载视频";
};

onBeforeUnmount(handleClose);

defineExpose({ handleOpen, handleClose });
</script>

<style scoped lang="scss">
.device-preview-page {
  height: 100%;
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding: 16px;
  background: var(--el-bg-color);
}

.device-preview-hero {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 18px 20px;
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 16px;
  background: var(--el-bg-color-overlay);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.04);
}

.device-preview-hero__left,
.device-preview-hero__right {
  display: flex;
  align-items: center;
  gap: 12px;
}

.device-preview-badge {
  display: inline-flex;
  flex-direction: column;
  gap: 2px;
  padding: 8px 12px;
  border-radius: 14px;
  background: var(--el-fill-color-lighter);
  border: 1px solid var(--el-border-color-lighter);
}

.device-preview-badge__label {
  font-size: 12px;
  font-weight: 600;
  color: var(--el-text-color-primary);
}

.device-preview-badge__code,
.device-preview-summary__label,
.device-preview-summary__value,
.device-preview-desc,
.camera-card__sub,
.camera-card__meta,
.camera-card__empty-text {
  color: var(--el-text-color-secondary);
}

.device-preview-title {
  margin: 0;
  font-size: 18px;
  font-weight: 700;
  color: var(--el-text-color-primary);
}

.device-preview-desc {
  margin: 4px 0 0;
  font-size: 13px;
}

.device-preview-summary {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 12px;
}

.device-preview-summary__item {
  padding: 12px 14px;
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 14px;
  background: var(--el-bg-color-overlay);
}

.device-preview-summary__label {
  display: block;
  font-size: 12px;
}

.device-preview-summary__value {
  display: block;
  margin-top: 6px;
  font-size: 13px;
  color: var(--el-text-color-primary);
  word-break: break-all;
}

.device-preview-grid {
  flex: 1;
  display: grid;
  gap: 16px;
  min-height: 0;
}

.device-preview-grid--1 {
  grid-template-columns: 1fr;
}

.device-preview-grid--4 {
  grid-template-columns: repeat(2, minmax(0, 1fr));
}

.device-preview-grid--9 {
  grid-template-columns: repeat(3, minmax(0, 1fr));
}

.camera-card {
  min-height: 280px;
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 16px;
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 16px;
  background: var(--el-bg-color-overlay);
  box-shadow: 0 10px 20px rgba(0, 0, 0, 0.03);
}

.camera-card__top {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
}

.camera-card__name {
  font-size: 15px;
  font-weight: 600;
  color: var(--el-text-color-primary);
}

.camera-card__sub {
  margin-top: 4px;
  font-size: 12px;
}

.camera-card__meta {
  display: flex;
  flex-wrap: wrap;
  gap: 8px 16px;
  font-size: 12px;
}

.camera-card__viewer,
.camera-card__empty {
  flex: 1;
  min-height: 220px;
  border-radius: 14px;
  overflow: hidden;
  background: var(--el-fill-color-lighter);
  display: flex;
  align-items: center;
  justify-content: center;
}

.camera-card__empty {
  flex-direction: column;
  gap: 10px;
}

.camera-card__empty-icon {
  font-size: 30px;
  color: var(--el-text-color-secondary);
}

.camera-card__video {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

@media (max-width: 1200px) {
  .device-preview-summary {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .device-preview-grid--9 {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 900px) {
  .device-preview-hero {
    flex-direction: column;
    align-items: flex-start;
  }

  .device-preview-hero__right {
    flex-wrap: wrap;
  }

  .device-preview-summary,
  .device-preview-grid--4,
  .device-preview-grid--9 {
    grid-template-columns: 1fr;
  }
}

</style>

