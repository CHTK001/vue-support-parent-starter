<script setup>
import { IconifyIconOnline } from "@repo/components/ReIcon";
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
  <div class="system-container modern-bg">
    <!-- 页面头部 -->
    <div class="page-header">
      <div class="page-header-content">
        <IconifyIconOnline icon="ri:film-line" class="page-header-icon" />
        <div>
          <h2 class="page-header-title">视频解析</h2>
          <p class="page-header-desc">粘贴视频链接，免费观看VIP内容</p>
        </div>
      </div>
    </div>

    <!-- 输入区域 -->
    <div class="input-section">

      <div class="input-box">
        <el-select v-model="env.selectedApi" class="api-select">
          <template #prefix>
            <IconifyIconOnline icon="ep:connection" />
          </template>
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
        >
          <template #prefix>
            <IconifyIconOnline icon="ep:link" />
          </template>
        </el-input>
        <el-button type="primary" :loading="env.loading" @click="parseUrl">
          <IconifyIconOnline icon="ep:video-play" />
          解析
        </el-button>
      </div>

      <!-- 热门网站 -->
      <div class="sites">
        <span class="sites-label">
          <IconifyIconOnline icon="ep:star" />
          快捷访问：
        </span>
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
        <span class="history-label">
          <IconifyIconOnline icon="ep:clock" />
          历史记录：
        </span>
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

<style scoped lang="scss">
/* 页面头部 */
.page-header {
  background: linear-gradient(135deg, var(--el-color-primary-light-3) 0%, var(--el-color-primary) 100%);
  border-radius: 12px;
  padding: 24px;
  margin-bottom: 20px;
  color: white;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.page-header-content {
  display: flex;
  align-items: center;
  gap: 16px;
}

.page-header-icon {
  font-size: 48px;
  opacity: 0.9;
}

.page-header-title {
  margin: 0 0 8px 0;
  font-size: 24px;
  font-weight: 600;
}

.page-header-desc {
  margin: 0;
  font-size: 14px;
  opacity: 0.9;
}

/* 输入区域 */
.input-section {
  max-width: 900px;
  margin: 0 auto;
  text-align: center;
}

/* 输入框 */
.input-box {
  display: flex;
  gap: 12px;
  background: var(--el-bg-color-overlay);
  padding: 16px;
  border-radius: 12px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
}

.api-select {
  width: 140px;
  flex-shrink: 0;
}

.url-input {
  flex: 1;
}

/* 热门网站 */
.sites {
  margin-top: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-wrap: wrap;
  gap: 10px;
}

.sites-label {
  font-size: 14px;
  color: var(--el-text-color-regular);
  font-weight: 500;
  display: flex;
  align-items: center;
  gap: 6px;
}

.site-link {
  font-size: 13px;
  color: var(--el-text-color-regular);
  cursor: pointer;
  padding: 6px 14px;
  border-radius: 20px;
  transition: all 0.3s ease;
  border: 1px solid var(--el-border-color);
  background: var(--el-bg-color);
  font-weight: 500;
}

.site-link:hover {
  color: var(--el-color-primary);
  border-color: var(--el-color-primary);
  background: rgba(var(--el-color-primary-rgb), 0.1);
}

/* 历史记录 */
.history {
  margin-top: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-wrap: wrap;
  gap: 10px;
}

.history-label {
  font-size: 14px;
  color: var(--el-text-color-regular);
  font-weight: 500;
  display: flex;
  align-items: center;
  gap: 6px;
}

.history-item {
  font-size: 12px;
  color: var(--el-text-color-regular);
  cursor: pointer;
  padding: 6px 12px;
  background: var(--el-bg-color-overlay);
  border-radius: 20px;
  max-width: 250px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  transition: all 0.3s ease;
  border: 1px solid var(--el-border-color);
  font-weight: 500;
}

.history-item:hover,
.history-item.active {
  color: var(--el-color-primary);
  background: rgba(var(--el-color-primary-rgb), 0.1);
  border-color: var(--el-color-primary);
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
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
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
  color: var(--el-text-color-placeholder);
  padding: 40px 20px;
}

.empty-icon {
  font-size: 80px;
  margin-bottom: 16px;
  opacity: 0.5;
}

.empty-state p {
  font-size: 14px;
  margin: 0;
  color: var(--el-text-color-secondary);
}

/* 响应式 */
@media (max-width: 640px) {
  .page-header {
    padding: 20px;
  }

  .page-header-icon {
    font-size: 36px;
  }

  .page-header-title {
    font-size: 20px;
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
