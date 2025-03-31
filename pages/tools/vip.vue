<script setup>
import { reactive, ref, computed, watch, onMounted } from "vue";
import { message } from "@repo/utils";
import { useI18n } from "vue-i18n";

// 国际化
const { t } = useI18n();

// 防抖定时器
let debounceTimer = null;

// 环境变量
const env = reactive({
  loading: false,
  currentUrl: "",
  inputValue: "",
  selectedApi: "1",
  fullscreen: false,
  history: [],
  apis: [
    {
      label: "通用接口1",
      value: "1",
      url: "https://jx.xmflv.cc/?url={{input}}",
    },
    {
      label: "通用接口2",
      value: "2",
      url: "https://jx.aidouer.net/?url={{input}}",
    },
    {
      label: "通用接口3",
      value: "3",
      url: "https://jx.m3u8.tv/jiexi/?url={{input}}",
    },
    {
      label: "通用接口4",
      value: "4",
      url: "https://www.8090g.cn/?url={{input}}",
    },
    {
      label: "通用接口5",
      value: "5",
      url: "https://www.ckmov.vip/api.php?url={{input}}",
    },
    {
      label: "通用接口6",
      value: "6",
      url: "https://www.pangujiexi.cc/jiexi.php?url={{input}}",
    },
    {
      label: "通用接口7",
      value: "7",
      url: "https://parse.123mingren.com/?url={{input}}",
    },
    // 添加更多通用接口
    {
      label: "通用接口8",
      value: "13",
      url: "https://jx.jsonplayer.com/player/?url={{input}}",
    },
    {
      label: "通用接口9",
      value: "14",
      url: "https://jx.bozrc.com:4433/player/?url={{input}}",
    },
    {
      label: "通用接口10",
      value: "15",
      url: "https://jx.playerjy.com/?url={{input}}",
    },
    {
      label: "爱奇艺专用",
      value: "8",
      url: "https://jx.aidouer.net/?url={{input}}",
    },
    {
      label: "腾讯视频专用",
      value: "9",
      url: "https://jx.m3u8.tv/jiexi/?url={{input}}",
    },
    {
      label: "优酷专用",
      value: "10",
      url: "https://www.8090g.cn/?url={{input}}",
    },
    {
      label: "芒果TV专用",
      value: "11",
      url: "https://jx.xmflv.cc/?url={{input}}",
    },
    {
      label: "搜狐专用",
      value: "12",
      url: "https://www.pangujiexi.cc/jiexi.php?url={{input}}",
    },
    // 添加B站和其他视频网站专用接口
    {
      label: "哔哩哔哩专用1",
      value: "16",
      url: "https://jx.bozrc.com:4433/player/?url={{input}}",
    },
    {
      label: "哔哩哔哩专用2",
      value: "17",
      url: "https://www.yemu.xyz/?url={{input}}",
    },
    {
      label: "哔哩哔哩专用3",
      value: "18",
      url: "https://jx.jsonplayer.com/player/?url={{input}}",
    },
    {
      label: "西瓜视频专用",
      value: "19",
      url: "https://www.pangujiexi.cc/jiexi.php?url={{input}}",
    },
    {
      label: "1905专用",
      value: "20",
      url: "https://www.8090g.cn/?url={{input}}",
    },
    {
      label: "PPTV专用",
      value: "21",
      url: "https://jx.playerjy.com/?url={{input}}",
    },
  ],
  popularSites: [
    { name: "爱奇艺", url: "https://www.iqiyi.com/", icon: "ri:iqiyi-line" },
    { name: "腾讯视频", url: "https://v.qq.com/", icon: "ri:tencent-qq-line" },
    { name: "优酷", url: "https://www.youku.com/", icon: "ri:youtube-line" },
    { name: "芒果TV", url: "https://www.mgtv.com/", icon: "ri:tv-line" },
    { name: "搜狐视频", url: "https://tv.sohu.com/", icon: "ri:sohu-line" },
    { name: "哔哩哔哩", url: "https://www.bilibili.com/", icon: "ri:bilibili-line" },
    // 添加更多热门视频网站
    { name: "西瓜视频", url: "https://www.ixigua.com/", icon: "ri:video-line" },
    { name: "1905电影网", url: "https://www.1905.com/", icon: "ri:movie-line" },
    { name: "PPTV", url: "https://www.pptv.com/", icon: "ri:tv-2-line" },
  ],
});

// 计算属性：当前解析URL
const currentParseUrl = computed(() => {
  if (!env.inputValue) return "";
  const selectedApi = env.apis.find((api) => api.value === env.selectedApi);
  return selectedApi ? selectedApi.url.replace("{{input}}", encodeURIComponent(env.inputValue)) : "";
});

// 防抖解析函数
const debounceParseUrl = (value) => {
  if (!value) return;

  // 清除之前的定时器
  if (debounceTimer) {
    clearTimeout(debounceTimer);
  }

  // 设置新的定时器，延迟500ms执行
  debounceTimer = setTimeout(() => {
    if (env.inputValue) {
      parseUrl();
    }
  }, 500);
};

/**
 * 解析视频URL
 */
const parseUrl = () => {
  if (!env.inputValue) {
    message(t("message.inputRequired") || "请输入视频链接", { type: "warning" });
    return;
  }

  env.loading = true;
  try {
    // 验证URL格式
    let url = env.inputValue;
    if (!url.startsWith("http://") && !url.startsWith("https://")) {
      url = "https://" + url;
      env.inputValue = url;
    }

    // 设置当前URL
    env.currentUrl = currentParseUrl.value;

    // 添加到历史记录
    if (!env.history.includes(env.inputValue)) {
      env.history.unshift(env.inputValue);
      if (env.history.length > 5) {
        env.history.pop();
      }
      // 保存到本地存储
      localStorage.setItem("vip-video-history", JSON.stringify(env.history));
    }

    message(t("message.parseSuccess") || "解析成功", { type: "success" });
  } catch (error) {
    console.error("URL解析错误:", error);
    message(t("message.parseError") || "解析失败: " + error.message, { type: "error" });
  } finally {
    env.loading = false;
  }
};

/**
 * 从历史记录中选择URL
 * @param {string} url - 历史记录中的URL
 */
const selectFromHistory = (url) => {
  env.inputValue = url;
  parseUrl();
};

/**
 * 重置表单
 */
const resetForm = () => {
  env.inputValue = "";
  env.currentUrl = "";
};

/**
 * 切换全屏模式
 */
const toggleFullscreen = () => {
  const iframe = document.getElementById("vip-iframe");
  if (!iframe) return;

  if (!env.fullscreen) {
    if (iframe.requestFullscreen) {
      iframe.requestFullscreen();
    } else if (iframe.mozRequestFullScreen) {
      iframe.mozRequestFullScreen();
    } else if (iframe.webkitRequestFullscreen) {
      iframe.webkitRequestFullscreen();
    } else if (iframe.msRequestFullscreen) {
      iframe.msRequestFullscreen();
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
 * 打开视频网站
 * @param {string} url - 网站URL
 */
const openVideoSite = (url) => {
  window.open(url, "_blank");
};

// 监听全屏变化
document.addEventListener("fullscreenchange", () => {
  env.fullscreen = !!document.fullscreenElement;
});
document.addEventListener("webkitfullscreenchange", () => {
  env.fullscreen = !!document.webkitFullscreenElement;
});
document.addEventListener("mozfullscreenchange", () => {
  env.fullscreen = !!document.mozFullscreenElement;
});
document.addEventListener("MSFullscreenChange", () => {
  env.fullscreen = !!document.msFullscreenElement;
});

// 组件挂载时从本地存储加载历史记录
onMounted(() => {
  const savedHistory = localStorage.getItem("vip-video-history");
  if (savedHistory) {
    try {
      env.history = JSON.parse(savedHistory);
    } catch (e) {
      console.error("解析历史记录失败:", e);
    }
  }
});
</script>

<template>
  <div class="vip-tool">
    <div class="vip-tool__content">
      <!-- 顶部区域：标题和说明 -->
      <div class="vip-tool__header-container">
        <div class="vip-tool__header">
          <div class="vip-tool__header-inner">
            <div class="vip-tool__header-title">VIP视频解析工具</div>
            <div class="vip-tool__header-subtitle">解析各大视频网站的VIP视频，免费观看</div>
          </div>
          <div class="vip-tool__header-decoration">
            <div class="vip-tool__header-circle"></div>
            <div class="vip-tool__header-circle"></div>
            <div class="vip-tool__header-circle"></div>
          </div>
        </div>
      </div>

      <el-row :gutter="20">
        <!-- 输入区域 -->
        <el-col :xs="24" :sm="24" :md="24" :lg="24">
          <el-card class="vip-tool__input-card" shadow="hover">
            <template #header>
              <div class="vip-tool__card-header">
                <IconifyIconOnline icon="ri:video-line" class="vip-tool__card-icon" />
                <span>视频解析</span>
              </div>
            </template>

            <el-form label-position="top">
              <el-form-item label="解析接口">
                <el-select v-model="env.selectedApi" class="vip-tool__select">
                  <el-option-group label="通用接口">
                    <el-option v-for="item in env.apis.filter((api) => (api.value <= 15 && api.value <= 7) || api.value >= 13)" :key="item.value" :label="item.label" :value="item.value" />
                  </el-option-group>
                  <el-option-group label="专用接口">
                    <el-option-group label="主流视频">
                      <el-option v-for="item in env.apis.filter((api) => api.value > 7 && api.value <= 12)" :key="item.value" :label="item.label" :value="item.value" />
                    </el-option-group>
                    <el-option-group label="B站专用">
                      <el-option v-for="item in env.apis.filter((api) => api.value >= 16 && api.value <= 18)" :key="item.value" :label="item.label" :value="item.value" />
                    </el-option-group>
                    <el-option-group label="其他平台">
                      <el-option v-for="item in env.apis.filter((api) => api.value >= 19 && api.value <= 21)" :key="item.value" :label="item.label" :value="item.value" />
                    </el-option-group>
                  </el-option-group>
                </el-select>
              </el-form-item>

              <el-form-item label="视频链接">
                <el-input v-model="env.inputValue" placeholder="请输入需要解析的视频链接，如：https://v.qq.com/x/cover/xxx.html" clearable class="vip-tool__input" @input="debounceParseUrl">
                  <template #prefix>
                    <IconifyIconOnline icon="ri:link" />
                  </template>
                </el-input>
              </el-form-item>

              <div class="vip-tool__actions">
                <el-button type="primary" :loading="env.loading" class="vip-tool__parse-btn" @click="parseUrl">
                  <IconifyIconOnline icon="ri:play-circle-line" />
                  <span>解析播放</span>
                </el-button>

                <el-button class="vip-tool__reset-btn" @click="resetForm">
                  <IconifyIconOnline icon="ri:refresh-line" />
                  <span>重置</span>
                </el-button>

                <el-button v-if="env.currentUrl" type="success" class="vip-tool__fullscreen-btn" @click="toggleFullscreen">
                  <IconifyIconOnline :icon="env.fullscreen ? 'ri:fullscreen-exit-line' : 'ri:fullscreen-line'" />
                  <span>{{ env.fullscreen ? "退出全屏" : "全屏播放" }}</span>
                </el-button>
              </div>
            </el-form>

            <!-- 历史记录 -->
            <div class="vip-tool__history" v-if="env.history && env.history.length">
              <span class="vip-tool__history-label">历史记录:</span>
              <div class="vip-tool__history-items">
                <el-tag v-for="(url, index) in env.history" :key="index" class="vip-tool__history-item" @click="selectFromHistory(url)" :effect="env.inputValue === url ? 'dark' : 'plain'">
                  {{ url.length > 30 ? url.substring(0, 30) + "..." : url }}
                </el-tag>
              </div>
            </div>

            <!-- 热门网站 -->
            <div class="vip-tool__popular-sites">
              <span class="vip-tool__popular-sites-label">热门视频网站:</span>
              <div class="vip-tool__popular-sites-items">
                <el-button v-for="site in env.popularSites" :key="site.name" class="vip-tool__popular-site-btn" @click="openVideoSite(site.url)">
                  <IconifyIconOnline :icon="site.icon" class="vip-tool__popular-site-icon" />
                  <span>{{ site.name }}</span>
                </el-button>
              </div>
            </div>
          </el-card>
        </el-col>

        <!-- 视频播放区域 -->
        <el-col :xs="24" :sm="24" :md="24" :lg="24" v-if="env.currentUrl">
          <el-card class="vip-tool__player-card" shadow="hover">
            <template #header>
              <div class="vip-tool__card-header">
                <IconifyIconOnline icon="ri:movie-line" class="vip-tool__card-icon" />
                <span>视频播放</span>
                <div class="vip-tool__player-controls">
                  <el-button type="primary" link @click="toggleFullscreen">
                    <IconifyIconOnline :icon="env.fullscreen ? 'ri:fullscreen-exit-line' : 'ri:fullscreen-line'" />
                  </el-button>
                </div>
              </div>
            </template>

            <div class="vip-tool__player-container">
              <iframe id="vip-iframe" :src="env.currentUrl" frameborder="0" allowfullscreen class="vip-tool__player-iframe"></iframe>
            </div>
          </el-card>
        </el-col>
      </el-row>

      <!-- 使用说明 -->
      <el-card class="vip-tool__tips-card" shadow="hover" v-if="!env.currentUrl">
        <template #header>
          <div class="vip-tool__card-header">
            <IconifyIconOnline icon="ri:information-line" class="vip-tool__card-icon" />
            <span>使用说明</span>
          </div>
        </template>

        <div class="vip-tool__tips-content">
          <div class="vip-tool__tip-item">
            <div class="vip-tool__tip-number">1</div>
            <div class="vip-tool__tip-text">选择合适的解析接口（不同接口解析能力不同，如果一个不行可以尝试其他接口）</div>
          </div>
          <div class="vip-tool__tip-item">
            <div class="vip-tool__tip-number">2</div>
            <div class="vip-tool__tip-text">复制需要解析的视频链接，粘贴到输入框中（可以点击下方热门网站直接访问）</div>
          </div>
          <div class="vip-tool__tip-item">
            <div class="vip-tool__tip-number">3</div>
            <div class="vip-tool__tip-text">点击"解析播放"按钮，等待解析完成后即可观看视频</div>
          </div>
          <div class="vip-tool__tip-item">
            <div class="vip-tool__tip-number">4</div>
            <div class="vip-tool__tip-text">如需全屏观看，可以点击播放器右上角的全屏按钮</div>
          </div>
          <div class="vip-tool__tip-item vip-tool__tip-item--warning">
            <IconifyIconOnline icon="ri:alert-line" class="vip-tool__tip-icon" />
            <div class="vip-tool__tip-text">注意：本工具仅供学习交流使用，请尊重版权，支持正版</div>
          </div>
        </div>
      </el-card>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.vip-tool {
  /* 头部样式 */
  &__header-container {
    margin-bottom: 20px;
  }

  &__header {
    background: linear-gradient(135deg, #eab308 0%, #a16207 100%);
    border-radius: 12px;
    padding: 30px;
    position: relative;
    overflow: hidden;
    box-shadow: 0 10px 30px rgba(var(--el-color-primary-rgb), 0.3);
    display: flex;
    justify-content: space-between;
    align-items: center;

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

    .vip-tool__card-icon {
      margin-right: 10px;
      font-size: 20px;
      color: var(--el-color-primary);
    }
  }

  &__input-card {
    margin-bottom: 20px;
  }

  &__player-card {
    margin-bottom: 20px;

    .vip-tool__card-header {
      display: flex;
      justify-content: space-between;

      .vip-tool__player-controls {
        margin-left: auto;
      }
    }
  }

  &__tips-card {
    margin-bottom: 20px;
  }

  /* 表单样式 */
  &__select {
    width: 100%;
  }

  &__input {
    width: 100%;
  }

  &__actions {
    display: flex;
    gap: 10px;
    margin-bottom: 15px;

    @media (max-width: 768px) {
      flex-direction: column;
    }

    .el-button {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 5px;

      .iconify {
        font-size: 18px;
      }
    }
  }

  /* 历史记录样式 */
  &__history {
    display: flex;
    align-items: center;
    margin-bottom: 15px;

    @media (max-width: 768px) {
      flex-direction: column;
      align-items: flex-start;
    }

    &-label {
      margin-right: 10px;
      color: var(--el-text-color-secondary);
      white-space: nowrap;
    }

    &-items {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
    }

    &-item {
      cursor: pointer;
      transition: all 0.3s;

      &:hover {
        transform: translateY(-2px);
      }
    }
  }

  /* 热门网站样式 */
  &__popular-sites {
    display: flex;
    align-items: center;

    @media (max-width: 768px) {
      flex-direction: column;
      align-items: flex-start;
    }

    &-label {
      margin-right: 10px;
      color: var(--el-text-color-secondary);
      white-space: nowrap;
    }

    &-items {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
    }

    &-btn {
      display: flex;
      align-items: center;
      gap: 5px;

      .vip-tool__popular-site-icon {
        font-size: 16px;
      }
    }
  }

  /* 播放器样式 */
  &__player-container {
    position: relative;
    width: 100%;
    height: 0;
    padding-bottom: 56.25%; /* 16:9 比例 */
    overflow: hidden;
  }

  &__player-iframe {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    border: none;
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
    color: white;
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
  .vip-tool {
    &__header {
      padding: 20px;

      &-title {
        font-size: 24px;
      }

      &-subtitle {
        font-size: 14px;
      }
    }

    &__actions {
      flex-direction: column;

      .el-button {
        margin-bottom: 10px;
      }
    }
  }
}
</style>
