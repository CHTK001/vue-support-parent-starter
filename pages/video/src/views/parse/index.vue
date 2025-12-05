<script setup>
import { message } from "@repo/utils";
import { computed, onMounted, reactive } from "vue";

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
      label: "默认接口",
      value: "1",
      url: "https://www.yemu.xyz/?url={{input}}",
    },
    { label: "接口2", value: "2", url: "https://jx.xmflv.cc/?url={{input}}" },
    {
      label: "接口3",
      value: "3",
      url: "https://jx.aidouer.net/?url={{input}}",
    },
    {
      label: "接口4",
      value: "4",
      url: "https://jx.m3u8.tv/jiexi/?url={{input}}",
    },
    { label: "接口5", value: "5", url: "https://www.8090g.cn/?url={{input}}" },
  ],
  popularSites: [
    { name: "爱奇艺", url: "https://www.iqiyi.com/" },
    { name: "腾讯视频", url: "https://v.qq.com/" },
    { name: "优酷", url: "https://www.youku.com/" },
    { name: "芒果TV", url: "https://www.mgtv.com/" },
    { name: "哔哩哔哩", url: "https://www.bilibili.com/" },
    { name: "西瓜视频", url: "https://www.ixigua.com/" },
  ],
});

// 计算属性：当前解析URL
const currentParseUrl = computed(() => {
  if (!env.inputValue) return "";
  const selectedApi = env.apis.find((api) => api.value === env.selectedApi);
  return selectedApi
    ? selectedApi.url.replace("{{input}}", encodeURIComponent(env.inputValue))
    : "";
});

/**
 * 解析视频URL
 */
const parseUrl = () => {
  if (!env.inputValue) {
    message("请输入视频链接", { type: "warning" });
    return;
  }

  env.loading = true;
  try {
    // 补全URL协议
    let url = env.inputValue;
    if (!url.startsWith("http://") && !url.startsWith("https://")) {
      url = "https://" + url;
      env.inputValue = url;
    }

    // 设置解析URL
    env.currentUrl = currentParseUrl.value;

    // 添加历史记录
    if (!env.history.includes(env.inputValue)) {
      env.history.unshift(env.inputValue);
      if (env.history.length > 5) {
        env.history.pop();
      }
      localStorage.setItem("vip-video-history", JSON.stringify(env.history));
    }
  } catch (error) {
    message("解析失败", { type: "error" });
  } finally {
    env.loading = false;
  }
};

/**
 * 从历史记录中选择URL
 */
const selectFromHistory = (url) => {
  env.inputValue = url;
  parseUrl();
};

/**
 * 清空输入
 */
const clearInput = () => {
  env.inputValue = "";
  env.currentUrl = "";
};

/**
 * 打开视频网站
 */
const openVideoSite = (url) => {
  window.open(url, "_blank");
};

// 组件挂载时加载历史记录
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
  <div class="parse-page">
    <!-- 输入区域 -->
    <div class="input-section">
      <h1 class="page-title">视频解析</h1>
      <p class="page-desc">粘贴视频链接，免费观看VIP内容</p>

      <div class="input-box">
        <el-select v-model="env.selectedApi" class="api-select">
          <el-option
            v-for="item in env.apis"
            :key="item.value"
            :label="item.label"
            :value="item.value"
          />
        </el-select>
        <el-input
          v-model="env.inputValue"
          placeholder="请粘贴视频链接，如：https://v.qq.com/..."
          clearable
          class="url-input"
          @keyup.enter="parseUrl"
        />
        <el-button type="primary" :loading="env.loading" @click="parseUrl">
          解析
        </el-button>
      </div>

      <!-- 热门网站 -->
      <div class="sites">
        <span class="sites-label">快捷访问：</span>
        <span
          v-for="site in env.popularSites"
          :key="site.name"
          class="site-link"
          @click="openVideoSite(site.url)"
        >
          {{ site.name }}
        </span>
      </div>

      <!-- 历史记录 -->
      <div class="history" v-if="env.history.length">
        <span class="history-label">历史：</span>
        <span
          v-for="(url, index) in env.history"
          :key="index"
          class="history-item"
          :class="{ active: env.inputValue === url }"
          @click="selectFromHistory(url)"
        >
          {{ url.length > 40 ? url.substring(0, 40) + "..." : url }}
        </span>
      </div>
    </div>

    <!-- 播放器 -->
    <div class="player-section" v-if="env.currentUrl">
      <div class="player-wrapper">
        <iframe
          :src="env.currentUrl"
          frameborder="0"
          allowfullscreen
          class="player-iframe"
        />
      </div>
    </div>

    <!-- 空状态 -->
    <div class="empty-state" v-else>
      <IconifyIconOnline icon="ri:film-line" class="empty-icon" />
      <p>粘贴视频链接开始解析</p>
    </div>
  </div>
</template>

<style scoped>
.parse-page {
  min-height: 100vh;
  background: #f5f5f5;
  padding: 40px 20px;
}

/* 输入区域 */
.input-section {
  max-width: 800px;
  margin: 0 auto;
  text-align: center;
}

.page-title {
  font-size: 32px;
  font-weight: 600;
  color: #333;
  margin: 0 0 8px 0;
}

.page-desc {
  font-size: 14px;
  color: #999;
  margin: 0 0 32px 0;
}

/* 输入框 */
.input-box {
  display: flex;
  gap: 12px;
  background: #fff;
  padding: 12px;
  border-radius: 12px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
}

.api-select {
  width: 120px;
  flex-shrink: 0;
}

.url-input {
  flex: 1;
}

/* 热门网站 */
.sites {
  margin-top: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-wrap: wrap;
  gap: 8px;
}

.sites-label {
  font-size: 13px;
  color: #999;
}

.site-link {
  font-size: 13px;
  color: #666;
  cursor: pointer;
  padding: 4px 8px;
  border-radius: 4px;
  transition: all 0.2s;
}

.site-link:hover {
  color: #1890ff;
  background: rgba(24, 144, 255, 0.1);
}

/* 历史记录 */
.history {
  margin-top: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-wrap: wrap;
  gap: 8px;
}

.history-label {
  font-size: 12px;
  color: #999;
}

.history-item {
  font-size: 12px;
  color: #666;
  cursor: pointer;
  padding: 4px 8px;
  background: #fff;
  border-radius: 4px;
  max-width: 200px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  transition: all 0.2s;
}

.history-item:hover,
.history-item.active {
  color: #1890ff;
  background: rgba(24, 144, 255, 0.1);
}

/* 播放器 */
.player-section {
  max-width: 1000px;
  margin: 40px auto 0;
}

.player-wrapper {
  position: relative;
  width: 100%;
  padding-bottom: 56.25%;
  background: #000;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
}

.player-iframe {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  border: none;
}

/* 空状态 */
.empty-state {
  max-width: 800px;
  margin: 60px auto 0;
  text-align: center;
  color: #ccc;
}

.empty-icon {
  font-size: 80px;
  margin-bottom: 16px;
}

.empty-state p {
  font-size: 14px;
  margin: 0;
}

/* 响应式 */
@media (max-width: 640px) {
  .parse-page {
    padding: 20px 16px;
  }

  .page-title {
    font-size: 24px;
  }

  .input-box {
    flex-direction: column;
    padding: 16px;
  }

  .api-select {
    width: 100%;
  }

  .sites,
  .history {
    justify-content: flex-start;
  }
}
</style>
