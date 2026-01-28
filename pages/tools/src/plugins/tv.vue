<script setup>
import { reactive, ref, computed, onMounted, onBeforeUnmount } from "vue";
import { message } from "@repo/utils";
import { useI18n } from "vue-i18n";

// 国际化
const { t } = useI18n();

// 环境变量
const env = reactive({
  loading: false,
  currentChannel: null,
  selectedCategory: "央视",
  isFullscreen: false,
  isMuted: false,
  volume: 50,
  categories: [
    { label: "央视", value: "央视" },
    { label: "卫视", value: "卫视" },
    { label: "地方", value: "地方" },
    { label: "港澳台", value: "港澳台" },
    { label: "国际", value: "国际" },
    { label: "其他", value: "其他" },
  ],
  channels: {
    央视: [
      {
        name: "CCTV-1 综合",
        url: "https://node1.olelive.com:6443/live/CCTV1HD/hls.m3u8",
        logo: "https://upload.wikimedia.org/wikipedia/zh/6/65/CCTV-1_Logo.png",
      },
      {
        name: "CCTV-2 财经",
        url: "https://node1.olelive.com:6443/live/CCTV2HD/hls.m3u8",
        logo: "https://upload.wikimedia.org/wikipedia/zh/c/ce/CCTV-2_Logo.png",
      },
      {
        name: "CCTV-3 综艺",
        url: "https://node1.olelive.com:6443/live/CCTV3HD/hls.m3u8",
        logo: "https://upload.wikimedia.org/wikipedia/zh/3/34/CCTV-3_Logo.png",
      },
      {
        name: "CCTV-4 中文国际",
        url: "https://node1.olelive.com:6443/live/CCTV4HD/hls.m3u8",
        logo: "https://upload.wikimedia.org/wikipedia/zh/thumb/0/07/CCTV-4_Logo.svg/1200px-CCTV-4_Logo.svg.png",
      },
      {
        name: "CCTV-5 体育",
        url: "https://node1.olelive.com:6443/live/CCTV5HD/hls.m3u8",
        logo: "https://upload.wikimedia.org/wikipedia/zh/3/33/CCTV-5_Logo.png",
      },
      {
        name: "CCTV-5+ 体育赛事",
        url: "https://node1.olelive.com:6443/live/CCTV5PHD/hls.m3u8",
        logo: "https://upload.wikimedia.org/wikipedia/zh/9/90/CCTV-5%2B_Logo.png",
      },
      {
        name: "CCTV-6 电影",
        url: "https://node1.olelive.com:6443/live/CCTV6HD/hls.m3u8",
        logo: "https://upload.wikimedia.org/wikipedia/zh/0/0c/CCTV-6_Logo.png",
      },
      {
        name: "CCTV-7 国防军事",
        url: "https://node1.olelive.com:6443/live/CCTV7HD/hls.m3u8",
        logo: "https://upload.wikimedia.org/wikipedia/zh/f/f0/CCTV-7_Logo.png",
      },
      {
        name: "CCTV-8 电视剧",
        url: "https://node1.olelive.com:6443/live/CCTV8HD/hls.m3u8",
        logo: "https://upload.wikimedia.org/wikipedia/zh/4/49/CCTV-8_Logo.png",
      },
      {
        name: "CCTV-9 纪录",
        url: "https://node1.olelive.com:6443/live/CCTV9HD/hls.m3u8",
        logo: "https://upload.wikimedia.org/wikipedia/zh/1/11/CCTV-9_Logo.png",
      },
      {
        name: "CCTV-10 科教",
        url: "https://node1.olelive.com:6443/live/CCTV10HD/hls.m3u8",
        logo: "https://upload.wikimedia.org/wikipedia/zh/f/fd/CCTV-10_Logo.png",
      },
      {
        name: "CCTV-11 戏曲",
        url: "https://node1.olelive.com:6443/live/CCTV11HD/hls.m3u8",
        logo: "https://upload.wikimedia.org/wikipedia/zh/1/15/CCTV-11_Logo.png",
      },
      {
        name: "CCTV-12 社会与法",
        url: "https://node1.olelive.com:6443/live/CCTV12HD/hls.m3u8",
        logo: "https://upload.wikimedia.org/wikipedia/zh/6/63/CCTV-12_Logo.png",
      },
      {
        name: "CCTV-13 新闻",
        url: "https://live-play.cctvnews.cctv.com/cctv/merge_cctv13.m3u8",
        logo: "https://upload.wikimedia.org/wikipedia/zh/0/0b/CCTV-13_Logo.png",
      },
      {
        name: "CCTV-14 少儿",
        url: "https://node1.olelive.com:6443/live/CCTV14HD/hls.m3u8",
        logo: "https://upload.wikimedia.org/wikipedia/zh/c/c8/CCTV-14_Logo.png",
      },
      {
        name: "CCTV-15 音乐",
        url: "https://node1.olelive.com:6443/live/CCTV15HD/hls.m3u8",
        logo: "https://upload.wikimedia.org/wikipedia/zh/f/f8/CCTV-15_Logo.png",
      },
      {
        name: "CCTV-16 奥林匹克",
        url: "https://node1.olelive.com:6443/live/CCTV16HD/hls.m3u8",
        logo: "https://upload.wikimedia.org/wikipedia/zh/thumb/c/cd/CCTV-16_Logo.png/200px-CCTV-16_Logo.png",
      },
      {
        name: "CCTV-17 农业农村",
        url: "https://node1.olelive.com:6443/live/CCTV17HD/hls.m3u8",
        logo: "https://upload.wikimedia.org/wikipedia/zh/thumb/3/3c/CCTV-17_Logo.png/200px-CCTV-17_Logo.png",
      },
    ],
    卫视: [
      {
        name: "湖南卫视",
        url: "https://node1.olelive.com:6443/live/HNHD/hls.m3u8",
        logo: "https://upload.wikimedia.org/wikipedia/zh/1/13/Hunan_TV_logo.png",
      },
      {
        name: "浙江卫视",
        url: "https://hw-m-l.cztv.com/channels/lantian/channel01/1080p.m3u8",
        logo: "https://upload.wikimedia.org/wikipedia/zh/0/0f/Zhejiang_TV_logo.png",
      },
      {
        name: "江苏卫视",
        url: "https://node1.olelive.com:6443/live/JSHD/hls.m3u8",
        logo: "https://upload.wikimedia.org/wikipedia/zh/7/75/Jiangsu_Broadcasting_Corporation_Logo.png",
      },
      {
        name: "东方卫视",
        url: "https://node1.olelive.com:6443/live/DFHD/hls.m3u8",
        logo: "https://upload.wikimedia.org/wikipedia/zh/thumb/a/a0/Dragon_Television_logo.svg/1200px-Dragon_Television_logo.svg.png",
      },
      {
        name: "广东卫视",
        url: "https://node1.olelive.com:6443/live/GDHD/hls.m3u8",
        logo: "https://upload.wikimedia.org/wikipedia/zh/thumb/d/d8/GRT_Satellite_Channel_logo.png/220px-GRT_Satellite_Channel_logo.png",
      },
      {
        name: "北京卫视",
        url: "https://node1.olelive.com:6443/live/BTV1HD/hls.m3u8",
        logo: "https://upload.wikimedia.org/wikipedia/zh/e/e0/Beijing_Television_Logo.png",
      },
      {
        name: "深圳卫视",
        url: "https://node1.olelive.com:6443/live/SZHD/hls.m3u8",
        logo: "https://upload.wikimedia.org/wikipedia/zh/thumb/f/f4/Shenzhen_Media_Group_Logo.png/220px-Shenzhen_Media_Group_Logo.png",
      },
      {
        name: "山东卫视",
        url: "https://node1.olelive.com:6443/live/SDHD/hls.m3u8",
        logo: "https://upload.wikimedia.org/wikipedia/zh/1/12/Shandong_TV_logo.png",
      },
      {
        name: "安徽卫视",
        url: "https://node1.olelive.com:6443/live/AHHD/hls.m3u8",
        logo: "https://upload.wikimedia.org/wikipedia/zh/1/16/Anhui_Television.png",
      },
      {
        name: "湖北卫视",
        url: "https://node1.olelive.com:6443/live/HBHD/hls.m3u8",
        logo: "https://upload.wikimedia.org/wikipedia/zh/6/65/Hubei_Television.png",
      },
      {
        name: "辽宁卫视",
        url: "https://node1.olelive.com:6443/live/LNHD/hls.m3u8",
        logo: "https://upload.wikimedia.org/wikipedia/zh/thumb/4/49/Liaoning_TV_Logo.png/200px-Liaoning_TV_Logo.png",
      },
      {
        name: "重庆卫视",
        url: "https://node1.olelive.com:6443/live/CQHD/hls.m3u8",
        logo: "https://upload.wikimedia.org/wikipedia/zh/thumb/c/c2/Chongqing_Broadcasting_Group.svg/200px-Chongqing_Broadcasting_Group.svg.png",
      },
    ],
    地方: [
      {
        name: "北京新闻",
        url: "https://live.funhillrm.com/5/sd/live.m3u8",
        logo: "https://upload.wikimedia.org/wikipedia/zh/7/7e/Beijing_Television_Logo_2009.png",
      },
      {
        name: "上海新闻综合",
        url: "https://live.goodiptv.club/api/bestv.php?id=xwzhhd8m/8000000",
        logo: "https://upload.wikimedia.org/wikipedia/zh/b/b9/Shanghai_Dragon_TV_logo.png",
      },
      {
        name: "广州综合",
        url: "http://player.521fanli.cn/1691/gd/gztvm3u8.php?id=gzzh",
        logo: "https://upload.wikimedia.org/wikipedia/zh/thumb/e/e5/Guangzhou_Broadcasting_Network_logo.png/220px-Guangzhou_Broadcasting_Network_logo.png",
      },
      {
        name: "深圳都市",
        url: "http://livepull-tcyzb.sztv.com.cn/live/dushi01.m3u8",
        logo: "https://upload.wikimedia.org/wikipedia/zh/thumb/f/f4/Shenzhen_Media_Group_Logo.png/220px-Shenzhen_Media_Group_Logo.png",
      },
      {
        name: "杭州综合",
        url: "https://hw-m-l.cztv.com/channels/lantian/channel01/1080p.m3u8",
        logo: "https://upload.wikimedia.org/wikipedia/zh/2/28/Hangzhou_TV.png",
      },
      {
        name: "南京新闻综合",
        url: "http://live.nbs.cn/channels/njtv/xwzh/m3u8:500k/live.m3u8",
        logo: "https://upload.wikimedia.org/wikipedia/zh/thumb/8/85/Nanjing_Broadcasting_Network.svg/200px-Nanjing_Broadcasting_Network.svg.png",
      },
      {
        name: "成都新闻综合",
        url: "http://v2.91kds.cn/b9/sccdtv.m3u8?fmt=hls&id=sccdtv1hd&auth=rinimabi",
        logo: "https://upload.wikimedia.org/wikipedia/zh/thumb/6/68/CDTV_logo.png/200px-CDTV_logo.png",
      },
    ],
    港澳台: [
      {
        name: "凤凰中文",
        url: "https://play-live.ifeng.com/live/06OLEGEGM4G.m3u8",
        logo: "https://upload.wikimedia.org/wikipedia/zh/thumb/3/34/Phoenix_Chinese.svg/1200px-Phoenix_Chinese.svg.png",
      },
      {
        name: "凤凰资讯",
        url: "https://play-live.ifeng.com/live/06OLEEWQKN4.m3u8",
        logo: "https://upload.wikimedia.org/wikipedia/zh/thumb/1/16/Phoenix_InfoNews.svg/1200px-Phoenix_InfoNews.svg.png",
      },
      {
        name: "香港卫视",
        url: "http://zhibo.hkstv.tv/livestream/mutfysrq/playlist.m3u8",
        logo: "https://upload.wikimedia.org/wikipedia/zh/thumb/d/d6/HKS_logo.svg/1200px-HKS_logo.svg.png",
      },
      {
        name: "TVB翡翠台",
        url: "https://edge6a.v2h-cdn.com/jade/jade.stream/chunklist.m3u8",
        logo: "https://upload.wikimedia.org/wikipedia/commons/thumb/6/63/Jade_Channel_2017.svg/200px-Jade_Channel_2017.svg.png",
      },
      {
        name: "澳门莲花",
        url: "https://p.ggiptv.com/v/macaulotustv.php",
        logo: "https://upload.wikimedia.org/wikipedia/zh/thumb/0/0d/Lotus_TV_Macau_logo.svg/200px-Lotus_TV_Macau_logo.svg.png",
      },
    ],
    国际: [
      {
        name: "CNN",
        url: "https://cnn-cnninternational-1-eu.rakuten.wurl.tv/playlist.m3u8",
        logo: "https://upload.wikimedia.org/wikipedia/commons/thumb/b/b1/CNN.svg/1200px-CNN.svg.png",
      },
      {
        name: "BBC World News",
        url: "http://103.199.161.254/Content/bbcworld/Live/Channel(BBCworld)/index.m3u8",
        logo: "https://upload.wikimedia.org/wikipedia/commons/thumb/e/ea/BBC_World_News_2022.svg/1200px-BBC_World_News_2022.svg.png",
      },
      {
        name: "NHK World",
        url: "https://nhkwlive-ojp.akamaized.net/hls/live/2003459/nhkwlive-ojp-en/index.m3u8",
        logo: "https://upload.wikimedia.org/wikipedia/commons/thumb/7/7b/NHK_World.svg/1200px-NHK_World.svg.png",
      },
      {
        name: "France 24",
        url: "https://cdn.klowdtv.net/803B48A/n1.klowdtv.net/live2/france24_720p/chunks.m3u8",
        logo: "https://upload.wikimedia.org/wikipedia/commons/thumb/8/8a/France24.png/635px-France24.png",
      },
      {
        name: "Al Jazeera",
        url: "https://live-hls-web-aje.getaj.net/AJE/index.m3u8",
        logo: "https://upload.wikimedia.org/wikipedia/en/thumb/f/f2/Aljazeera_eng.svg/200px-Aljazeera_eng.svg.png",
      },
      {
        name: "RT News",
        url: "https://rt-glb.rttv.com/live/rtnews/playlist.m3u8",
        logo: "https://upload.wikimedia.org/wikipedia/commons/thumb/a/a0/Russia-today-logo.svg/200px-Russia-today-logo.svg.png",
      },
      {
        name: "DW English",
        url: "https://dwamdstream102.akamaized.net/hls/live/2015525/dwstream102/index.m3u8",
        logo: "https://upload.wikimedia.org/wikipedia/commons/thumb/7/75/Deutsche_Welle_symbol_2012.svg/200px-Deutsche_Welle_symbol_2012.svg.png",
      },
    ],
    其他: [
      {
        name: "第一财经",
        url: "https://live.goodiptv.club/api/bestv.php?id=dycjhd8m/8000000",
        logo: "https://upload.wikimedia.org/wikipedia/zh/thumb/f/f4/YiCai.png/220px-YiCai.png",
      },
      {
        name: "金鹰纪实",
        url: "https://node1.olelive.com:6443/live/JYJS/hls.m3u8",
        logo: "https://upload.wikimedia.org/wikipedia/zh/1/13/Hunan_TV_logo.png",
      },
      {
        name: "快乐垂钓",
        url: "https://live.goodiptv.club/api/bestv.php?id=klcd8m/8000000",
        logo: "https://upload.wikimedia.org/wikipedia/zh/1/13/Hunan_TV_logo.png",
      },
      {
        name: "茶频道",
        url: "https://live.goodiptv.club/api/bestv.php?id=cpdhdavs8m/8000000",
        logo: "https://upload.wikimedia.org/wikipedia/zh/1/13/Hunan_TV_logo.png",
      },
      {
        name: "纪实人文",
        url: "https://live.goodiptv.club/api/bestv.php?id=jspdhd/4000000",
        logo: "https://upload.wikimedia.org/wikipedia/zh/b/b9/Shanghai_Dragon_TV_logo.png",
      },
      {
        name: "全纪实",
        url: "https://live.goodiptv.club/api/bestv.php?id=qjshd8m/8000000",
        logo: "https://upload.wikimedia.org/wikipedia/zh/b/b9/Shanghai_Dragon_TV_logo.png",
      },
      {
        name: "游戏风云",
        url: "https://live.goodiptv.club/api/bestv.php?id=yxfy8m/8000000",
        logo: "https://upload.wikimedia.org/wikipedia/zh/b/b9/Shanghai_Dragon_TV_logo.png",
      },
      {
        name: "欢笑剧场",
        url: "https://live.goodiptv.club/api/bestv.php?id=hxjc8m/8000000",
        logo: "https://upload.wikimedia.org/wikipedia/zh/b/b9/Shanghai_Dragon_TV_logo.png",
      },
    ],
  },
  favorites: [],
  history: [],
});

// 视频播放器引用
const videoPlayer = ref(null);

// 计算属性：当前分类的频道列表
const currentCategoryChannels = computed(() => {
  return env.channels[env.selectedCategory] || [];
});

/**
 * 播放频道
 * @param {Object} channel - 频道信息
 */
const playChannel = (channel) => {
  env.loading = true;
  env.currentChannel = channel;

  // 添加到历史记录
  if (!env.history.some((item) => item.name === channel.name)) {
    env.history.unshift(channel);
    if (env.history.length > 10) {
      env.history.pop();
    }
    // 保存到本地存储
    localStorage.setItem("tv-channel-history", JSON.stringify(env.history));
  }

  // 延迟关闭加载状态，给播放器一些加载时间
  setTimeout(() => {
    env.loading = false;
  }, 1500);
};

/**
 * 切换收藏状态
 * @param {Object} channel - 频道信息
 */
const toggleFavorite = (channel) => {
  const index = env.favorites.findIndex((item) => item.name === channel.name);
  if (index === -1) {
    // 添加到收藏
    env.favorites.push(channel);
    message(
      t("message.addFavoriteSuccess") || `已将 ${channel.name} 添加到收藏`,
      { type: "success" }
    );
  } else {
    // 从收藏中移除
    env.favorites.splice(index, 1);
    message(
      t("message.removeFavoriteSuccess") || `已将 ${channel.name} 从收藏中移除`,
      { type: "info" }
    );
  }
  // 保存到本地存储
  localStorage.setItem("tv-channel-favorites", JSON.stringify(env.favorites));
};

/**
 * 检查频道是否已收藏
 * @param {Object} channel - 频道信息
 * @returns {Boolean} 是否已收藏
 */
const isFavorite = (channel) => {
  return env.favorites.some((item) => item.name === channel.name);
};

/**
 * 切换全屏模式
 */
const toggleFullscreen = () => {
  if (!videoPlayer.value) return;

  if (!env.isFullscreen) {
    if (videoPlayer.value.requestFullscreen) {
      videoPlayer.value.requestFullscreen();
    } else if (videoPlayer.value.mozRequestFullScreen) {
      videoPlayer.value.mozRequestFullScreen();
    } else if (videoPlayer.value.webkitRequestFullscreen) {
      videoPlayer.value.webkitRequestFullscreen();
    } else if (videoPlayer.value.msRequestFullscreen) {
      videoPlayer.value.msRequestFullscreen();
    }
  } else {
    if (document.exitFullscreen) {
      document.exitFullscreen();
    } else if (document.mozCancelFullScreen) {
      document.mozCancelFullScreen();
    } else if (document.webkitExitFullscreen) {
      document.webkitExitFullscreen();
    } else if (document.msExitFullscreen) {
      document.msExitFullscreen();
    }
  }
};

/**
 * 切换静音状态
 */
const toggleMute = () => {
  if (!videoPlayer.value) return;
  videoPlayer.value.muted = !videoPlayer.value.muted;
  env.isMuted = videoPlayer.value.muted;
};

/**
 * 调整音量
 */
const adjustVolume = () => {
  if (!videoPlayer.value) return;
  videoPlayer.value.volume = env.volume / 100;
  if (env.volume === 0) {
    env.isMuted = true;
    videoPlayer.value.muted = true;
  } else if (env.isMuted) {
    env.isMuted = false;
    videoPlayer.value.muted = false;
  }
};

// 监听全屏变化
document.addEventListener("fullscreenchange", () => {
  env.isFullscreen = !!document.fullscreenElement;
});
document.addEventListener("webkitfullscreenchange", () => {
  env.isFullscreen = !!document.webkitFullscreenElement;
});
document.addEventListener("mozfullscreenchange", () => {
  env.isFullscreen = !!document.mozFullscreenElement;
});
document.addEventListener("MSFullscreenChange", () => {
  env.isFullscreen = !!document.msFullscreenElement;
});

// 组件挂载时从本地存储加载收藏和历史记录
onMounted(() => {
  // 加载收藏
  const savedFavorites = localStorage.getItem("tv-channel-favorites");
  if (savedFavorites) {
    try {
      env.favorites = JSON.parse(savedFavorites);
    } catch (e) {
      console.error("解析收藏记录失败:", e);
    }
  }

  // 加载历史记录
  const savedHistory = localStorage.getItem("tv-channel-history");
  if (savedHistory) {
    try {
      env.history = JSON.parse(savedHistory);
    } catch (e) {
      console.error("解析历史记录失败:", e);
    }
  }
});

// 组件卸载前清除事件监听
onBeforeUnmount(() => {
  document.removeEventListener("fullscreenchange", () => {});
  document.removeEventListener("webkitfullscreenchange", () => {});
  document.removeEventListener("mozfullscreenchange", () => {});
  document.removeEventListener("MSFullscreenChange", () => {});
});
</script>

<template>
  <div class="tv-tool">
    <div class="tv-tool__content">
      <!-- 顶部区域：标题和说明 -->
      <div class="tv-tool__header-container">
        <div class="tv-tool__header">
          <div class="tv-tool__header-inner">
            <div class="tv-tool__header-title">电视频道直播</div>
            <div class="tv-tool__header-subtitle">在线观看各大电视台直播</div>
          </div>
          <div class="tv-tool__header-decoration">
            <div class="tv-tool__header-circle"></div>
            <div class="tv-tool__header-circle"></div>
            <div class="tv-tool__header-circle"></div>
          </div>
        </div>
      </div>

      <el-row :gutter="20">
        <!-- 左侧：频道列表 -->
        <el-col :xs="24" :sm="24" :md="8" :lg="6">
          <el-card class="tv-tool__channels-card" shadow="hover">
            <template #header>
              <div class="tv-tool__card-header">
                <IconifyIconOnline
                  icon="ri:tv-line"
                  class="tv-tool__card-icon"
                />
                <span>频道列表</span>
              </div>
            </template>

            <!-- 频道分类 -->
            <div class="tv-tool__category-tabs">
              <el-radio-group
                v-model="env.selectedCategory"
                size="large"
                class="tv-tool__radio-group"
              >
                <el-radio
                  v-for="category in env.categories"
                  :key="category.value"
                  :label="category.value"
                  border
                >
                  <div class="tv-tool__radio-content">
                    <span>{{ category.label }}</span>
                  </div>
                </el-radio>
              </el-radio-group>
            </div>

            <!-- 频道列表 -->
            <div class="tv-tool__channel-list">
              <div
                v-for="channel in currentCategoryChannels"
                :key="channel.name"
                class="tv-tool__channel-item"
                :class="{
                  'is-active':
                    env.currentChannel &&
                    env.currentChannel.name === channel.name,
                }"
                @click="playChannel(channel)"
              >
                <div class="tv-tool__channel-logo">
                  <img :src="channel.logo" :alt="channel.name" />
                </div>
                <div class="tv-tool__channel-info">
                  <div class="tv-tool__channel-name">{{ channel.name }}</div>
                </div>
                <div class="tv-tool__channel-actions">
                  <el-button
                    type="primary"
                    link
                    @click.stop="toggleFavorite(channel)"
                  >
                    <IconifyIconOnline
                      :icon="
                        isFavorite(channel) ? 'ri:heart-fill' : 'ri:heart-line'
                      "
                      :style="{
                        color: isFavorite(channel)
                          ? 'var(--el-color-danger)'
                          : '',
                      }"
                    />
                  </el-button>
                </div>
              </div>
            </div>
          </el-card>

          <!-- 收藏频道 -->
          <el-card
            class="tv-tool__favorites-card"
            shadow="hover"
            v-if="env.favorites.length > 0"
          >
            <template #header>
              <div class="tv-tool__card-header">
                <IconifyIconOnline
                  icon="ri:heart-fill"
                  class="tv-tool__card-icon"
                  style="color: var(--el-color-danger)"
                />
                <span>我的收藏</span>
              </div>
            </template>

            <div class="tv-tool__favorites-list">
              <div
                v-for="channel in env.favorites"
                :key="channel.name"
                class="tv-tool__channel-item"
                :class="{
                  'is-active':
                    env.currentChannel &&
                    env.currentChannel.name === channel.name,
                }"
                @click="playChannel(channel)"
              >
                <div class="tv-tool__channel-logo">
                  <img :src="channel.logo" :alt="channel.name" />
                </div>
                <div class="tv-tool__channel-info">
                  <div class="tv-tool__channel-name">{{ channel.name }}</div>
                </div>
                <div class="tv-tool__channel-actions">
                  <el-button
                    type="danger"
                    link
                    @click.stop="toggleFavorite(channel)"
                  >
                    <IconifyIconOnline icon="ri:delete-bin-line" />
                  </el-button>
                </div>
              </div>
            </div>
          </el-card>

          <!-- 历史记录 -->
          <el-card
            class="tv-tool__history-card"
            shadow="hover"
            v-if="env.history.length > 0"
          >
            <template #header>
              <div class="tv-tool__card-header">
                <IconifyIconOnline
                  icon="ri:history-line"
                  class="tv-tool__card-icon"
                />
                <span>观看历史</span>
              </div>
            </template>

            <div class="tv-tool__history-list">
              <div
                v-for="channel in env.history"
                :key="channel.name"
                class="tv-tool__channel-item"
                :class="{
                  'is-active':
                    env.currentChannel &&
                    env.currentChannel.name === channel.name,
                }"
                @click="playChannel(channel)"
              >
                <div class="tv-tool__channel-logo">
                  <img :src="channel.logo" :alt="channel.name" />
                </div>
                <div class="tv-tool__channel-info">
                  <div class="tv-tool__channel-name">{{ channel.name }}</div>
                </div>
              </div>
            </div>
          </el-card>
        </el-col>

        <!-- 右侧：播放器 -->
        <el-col :xs="24" :sm="24" :md="16" :lg="18">
          <el-card class="tv-tool__player-card" shadow="hover">
            <template #header>
              <div class="tv-tool__card-header">
                <IconifyIconOnline
                  icon="ri:live-line"
                  class="tv-tool__card-icon"
                />
                <span>{{
                  env.currentChannel ? env.currentChannel.name : "电视直播"
                }}</span>
                <div class="tv-tool__player-controls" v-if="env.currentChannel">
                  <el-button type="primary" link @click="toggleFullscreen">
                    <IconifyIconOnline
                      :icon="
                        env.isFullscreen
                          ? 'ri:fullscreen-exit-line'
                          : 'ri:fullscreen-line'
                      "
                    />
                  </el-button>
                </div>
              </div>
            </template>

            <div class="tv-tool__player-container">
              <div
                v-if="!env.currentChannel"
                class="tv-tool__player-placeholder"
              >
                <IconifyIconOnline
                  icon="ri:tv-2-line"
                  class="tv-tool__player-placeholder-icon"
                />
                <div class="tv-tool__player-placeholder-text">
                  请从左侧选择一个频道开始观看
                </div>
              </div>
              <div v-else class="tv-tool__player-wrapper">
                <div v-if="env.loading" class="tv-tool__player-loading">
                  <el-icon class="is-loading"><Loading /></el-icon>
                  <span>正在加载频道，请稍候...</span>
                </div>
                <video
                  ref="videoPlayer"
                  class="tv-tool__player-video"
                  :src="env.currentChannel.url"
                  controls
                  autoplay
                  :muted="env.isMuted"
                  @error="
                    () =>
                      message('视频加载失败，请尝试其他频道', { type: 'error' })
                  "
                ></video>

                <!-- 播放器控制栏 -->
                <div class="tv-tool__player-controls-bar">
                  <div class="tv-tool__player-volume">
                    <el-button type="primary" link @click="toggleMute">
                      <IconifyIconOnline
                        :icon="
                          env.isMuted
                            ? 'ri:volume-mute-line'
                            : env.volume > 50
                              ? 'ri:volume-up-line'
                              : 'ri:volume-down-line'
                        "
                      />
                    </el-button>
                    <el-slider
                      v-model="env.volume"
                      :min="0"
                      :max="100"
                      :step="1"
                      @change="adjustVolume"
                      class="tv-tool__player-volume-slider"
                    />
                  </div>

                  <div class="tv-tool__player-actions">
                    <el-button
                      type="primary"
                      @click="toggleFavorite(env.currentChannel)"
                    >
                      <IconifyIconOnline
                        :icon="
                          isFavorite(env.currentChannel)
                            ? 'ri:heart-fill'
                            : 'ri:heart-line'
                        "
                      />
                      <span>{{
                        isFavorite(env.currentChannel) ? "取消收藏" : "收藏频道"
                      }}</span>
                    </el-button>

                    <el-button type="success" @click="toggleFullscreen">
                      <IconifyIconOnline
                        :icon="
                          env.isFullscreen
                            ? 'ri:fullscreen-exit-line'
                            : 'ri:fullscreen-line'
                        "
                      />
                      <span>{{
                        env.isFullscreen ? "退出全屏" : "全屏观看"
                      }}</span>
                    </el-button>
                  </div>
                </div>
              </div>
            </div>
          </el-card>

          <!-- 使用说明 -->
          <el-card
            class="tv-tool__tips-card"
            shadow="hover"
            v-if="!env.currentChannel"
          >
            <template #header>
              <div class="tv-tool__card-header">
                <IconifyIconOnline
                  icon="ri:information-line"
                  class="tv-tool__card-icon"
                />
                <span>使用说明</span>
              </div>
            </template>

            <div class="tv-tool__tips-content">
              <div class="tv-tool__tip-item">
                <div class="tv-tool__tip-number">1</div>
                <div class="tv-tool__tip-text">
                  从左侧选择频道分类，浏览不同类型的电视频道
                </div>
              </div>
              <div class="tv-tool__tip-item">
                <div class="tv-tool__tip-number">2</div>
                <div class="tv-tool__tip-text">点击频道名称开始观看直播</div>
              </div>
              <div class="tv-tool__tip-item">
                <div class="tv-tool__tip-number">3</div>
                <div class="tv-tool__tip-text">
                  可以收藏常用频道，方便下次快速访问
                </div>
              </div>
              <div class="tv-tool__tip-item">
                <div class="tv-tool__tip-number">4</div>
                <div class="tv-tool__tip-text">支持全屏观看和音量调节</div>
              </div>
              <div class="tv-tool__tip-item tv-tool__tip-item--warning">
                <IconifyIconOnline
                  icon="ri:alert-line"
                  class="tv-tool__tip-icon"
                />
                <div class="tv-tool__tip-text">
                  注意：部分频道可能因网络原因无法播放，请尝试其他频道或稍后再试
                </div>
              </div>
            </div>
          </el-card>
        </el-col>
      </el-row>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.tv-tool {
  /* 头部样式 */
  &__header-container {
    margin-bottom: 20px;
  }

  &__header {
    background: linear-gradient(
      135deg,
      var(--el-color-danger-light-3) 0%,
      var(--el-color-danger) 100%
    );
    border-radius: 12px;
    padding: 30px;
    position: relative;
    overflow: hidden;
    box-shadow: 0 4px 20px rgba(var(--el-color-danger-rgb), 0.3);
    display: flex;
    justify-content: space-between;
    align-items: center;
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);

    &:hover {
      box-shadow: 0 6px 24px rgba(var(--el-color-danger-rgb), 0.4);
      transform: translateY(-2px);
    }

    &-inner {
      position: relative;
      z-index: 2;
    }

    &-title {
      font-size: 28px;
      font-weight: 600;
      color: #fff;
      margin-bottom: 10px;
      text-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
    }

    &-subtitle {
      font-size: 16px;
      color: rgba(255, 255, 255, 0.9);
    }

    &-decoration {
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      z-index: 1;
    }

    &-circle {
      position: absolute;
      border-radius: 50%;
      background: rgba(255, 255, 255, 0.1);

      &:nth-child(1) {
        width: 200px;
        height: 200px;
        top: -100px;
        right: -50px;
        animation: float 15s infinite ease-in-out;
      }

      &:nth-child(2) {
        width: 150px;
        height: 150px;
        bottom: -50px;
        left: -30px;
        animation: float 12s infinite ease-in-out reverse;
      }

      &:nth-child(3) {
        width: 100px;
        height: 100px;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        animation: pulse 8s infinite ease-in-out;
      }
    }
  }

  /* 卡片样式 */
  &__card-header {
    display: flex;
    align-items: center;
    font-size: 18px;
    font-weight: 600;

    .tv-tool__card-icon {
      margin-right: 10px;
      font-size: 20px;
      color: var(--el-color-primary);
    }
  }

  &__channels-card,
  &__favorites-card,
  &__history-card {
    margin-bottom: 20px;
    border-radius: 12px;
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    border: 1px solid var(--el-border-color-lighter);

    &:hover {
      box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
      transform: translateY(-2px);
      border-color: var(--el-color-danger-light-7);
    }
  }

  &__player-card {
    margin-bottom: 20px;
    border-radius: 12px;
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    border: 1px solid var(--el-border-color-lighter);

    &:hover {
      box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
      transform: translateY(-2px);
      border-color: var(--el-color-danger-light-7);
    }

    .tv-tool__card-header {
      display: flex;
      justify-content: space-between;

      .tv-tool__player-controls {
        margin-left: auto;
      }
    }
  }

  &__tips-card {
    margin-bottom: 20px;
  }

  /* 频道分类样式 */
  &__category-tabs {
    margin-bottom: 20px;
  }

  &__radio-group {
    width: 100%;
    display: flex;
    flex-wrap: wrap;
    gap: 10px;

    .el-radio {
      margin-right: 0;
      flex: 1;
      min-width: 80px;
      text-align: center;

      &.is-checked {
        .tv-tool__radio-content {
          color: var(--el-color-primary);
          font-weight: 600;
        }
      }
    }
  }

  /* 频道列表样式 */
  &__channel-list,
  &__favorites-list,
  &__history-list {
    max-height: 400px;
    overflow-y: auto;
    padding-right: 5px;

    &::-webkit-scrollbar {
      width: 6px;
    }

    &::-webkit-scrollbar-thumb {
      background-color: var(--el-border-color-darker);
      border-radius: 3px;
    }

    &::-webkit-scrollbar-track {
      background-color: var(--el-fill-color-lighter);
      border-radius: 3px;
    }
  }

  &__channel-item {
    display: flex;
    align-items: center;
    padding: 10px;
    border-radius: 8px;
    margin-bottom: 8px;
    cursor: pointer;
    transition: all 0.3s;
    background-color: var(--el-fill-color-light);

    &:hover {
      background-color: var(--el-fill-color);
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
    }

    &.is-active {
      background-color: var(--el-color-primary-light-9);
      border-left: 3px solid var(--el-color-primary);
    }
  }

  &__channel-logo {
    width: 40px;
    height: 40px;
    border-radius: 4px;
    overflow: hidden;
    margin-right: 10px;
    flex-shrink: 0;
    background-color: #fff;
    display: flex;
    align-items: center;
    justify-content: center;

    img {
      max-width: 100%;
      max-height: 100%;
      object-fit: contain;
    }
  }

  &__channel-info {
    flex: 1;
  }

  &__channel-name {
    font-size: 14px;
    font-weight: 500;
  }

  &__channel-actions {
    opacity: 0;
    transition: opacity 0.3s;

    .tv-tool__channel-item:hover & {
      opacity: 1;
    }
  }

  /* 播放器样式 */
  &__player-container {
    position: relative;
    width: 100%;
    min-height: 400px;
    background-color: #000;
    border-radius: 8px;
    overflow: hidden;
  }

  &__player-placeholder {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    height: 400px;
    color: rgba(255, 255, 255, 0.6);

    &-icon {
      font-size: 80px;
      margin-bottom: 20px;
    }

    &-text {
      font-size: 18px;
    }
  }

  &__player-wrapper {
    position: relative;
    width: 100%;
    height: 0;
    padding-bottom: 56.25%; /* 16:9 比例 */
  }

  &__player-video {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background-color: #000;
  }

  &__player-loading {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    background-color: rgba(0, 0, 0, 0.7);
    color: #fff;
    z-index: 2;

    .el-icon {
      font-size: 40px;
      margin-bottom: 10px;
    }
  }

  &__player-controls-bar {
    padding: 15px;
    background-color: var(--el-fill-color-light);
    border-radius: 0 0 8px 8px;
    display: flex;
    flex-wrap: wrap;
    gap: 15px;
    align-items: center;
    justify-content: space-between;
  }

  &__player-volume {
    display: flex;
    align-items: center;
    gap: 10px;

    &-slider {
      width: 100px;
    }
  }

  &__player-actions {
    display: flex;
    gap: 10px;

    .el-button {
      display: flex;
      align-items: center;
      gap: 5px;
    }
  }

  /* 使用说明样式 */
  &__tips-content {
    display: flex;
    flex-direction: column;
    gap: 15px;
  }

  &__tip-item {
    display: flex;
    align-items: flex-start;

    &--warning {
      margin-top: 10px;
      padding: 15px;
      background-color: rgba(var(--el-color-warning-rgb), 0.1);
      border-radius: 8px;
      border-left: 3px solid var(--el-color-warning);
    }
  }

  &__tip-number {
    width: 24px;
    height: 24px;
    border-radius: 50%;
    background-color: var(--el-color-primary);
    color: var(--el-text-color-primary);
    display: flex;
    align-items: center;
    justify-content: center;
    font-weight: 600;
    margin-right: 10px;
    flex-shrink: 0;
  }

  &__tip-icon {
    font-size: 24px;
    color: var(--el-color-warning);
    margin-right: 10px;
  }

  &__tip-text {
    flex: 1;
    line-height: 1.5;
  }
}

/* 动画效果 */
@keyframes pulse {
  0%,
  100% {
    transform: translate(-50%, -50%) scale(1);
    opacity: 0.8;
  }
  50% {
    transform: translate(-50%, -50%) scale(1.1);
    opacity: 1;
  }
}

@keyframes float {
  0%,
  100% {
    transform: translateY(0) rotate(0deg);
  }
  50% {
    transform: translateY(-20px) rotate(10deg);
  }
}

/* 响应式调整 */
@media (max-width: 768px) {
  .tv-tool {
    &__header {
      padding: 20px;

      &-title {
        font-size: 24px;
      }

      &-subtitle {
        font-size: 14px;
      }
    }

    &__radio-group {
      flex-wrap: wrap;

      .el-radio {
        margin-bottom: 5px;
        min-width: 70px;
      }
    }

    &__player-controls-bar {
      flex-direction: column;
      align-items: stretch;
    }

    &__player-volume {
      width: 100%;

      &-slider {
        width: 100%;
      }
    }

    &__player-actions {
      width: 100%;
      flex-direction: column;
    }
  }
}
</style>
