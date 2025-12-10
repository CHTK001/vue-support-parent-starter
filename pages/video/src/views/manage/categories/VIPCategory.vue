<template>
  <div class="vip-category">
    <div class="vip-category__container">
      <div class="vip-category__header">
        <h2 class="vip-category__title">视频解析</h2>
        <el-button type="primary" plain size="small" @click="navigateToHistory">查看历史记录</el-button>
      </div>

      <!-- 视频解析表单 -->
      <div class="vip-parser">
        <div class="vip-parser__form">
          <el-form :model="parseForm" :rules="parseRules" ref="parseFormRef" label-width="80px">
            <el-form-item label="视频链接" prop="url">
              <el-input v-model="parseForm.url" placeholder="请输入需要解析的视频链接" clearable>
                <template #prefix>
                  <IconifyIconOnline icon="ri:link" />
                </template>
                <template #append>
                  <el-button @click="pasteUrl">粘贴</el-button>
                </template>
              </el-input>
            </el-form-item>
            <el-form-item label="解析接口">
              <el-select v-model="parseForm.apiIndex" placeholder="请选择解析接口">
                <el-option v-for="(api, index) in parseApis" :key="index" :label="api.name" :value="index">
                  <div class="vip-parser__api-option">
                    <span>{{ api.name }}</span>
                    <el-tag size="small" :type="api.status === 'normal' ? 'success' : 'warning'">{{ api.status === "normal" ? "正常" : "异常" }}</el-tag>
                  </div>
                </el-option>
              </el-select>
            </el-form-item>
            <el-form-item>
              <el-button type="primary" @click="handleParse" :loading="parsing">开始解析</el-button>
              <el-button @click="resetForm">重置</el-button>
            </el-form-item>
          </el-form>
        </div>
      </div>

      <!-- 解析结果 -->
      <div class="vip-result" v-if="parseResult">
        <div class="vip-result__header">
          <h3 class="vip-result__title">解析结果</h3>
          <el-button type="text" @click="parseResult = null">清除</el-button>
        </div>
        <div class="vip-result__content">
          <div class="vip-result__video">
            <iframe :src="parseResult.playUrl" frameborder="0" allowfullscreen></iframe>
          </div>
          <div class="vip-result__info">
            <div class="vip-result__item">
              <span class="vip-result__label">原始链接：</span>
              <el-link :href="parseResult.originalUrl" target="_blank" type="primary" :underline="false">{{ parseResult.originalUrl }}</el-link>
            </div>
            <div class="vip-result__item">
              <span class="vip-result__label">解析接口：</span>
              <span>{{ parseResult.apiName }}</span>
            </div>
            <div class="vip-result__item">
              <span class="vip-result__label">解析时间：</span>
              <span>{{ parseResult.parseTime }}</span>
            </div>
            <div class="vip-result__actions">
              <el-button type="primary" @click="copyPlayUrl">复制播放链接</el-button>
              <el-button @click="openInNewTab">新窗口打开</el-button>
              <el-button @click="addToFavorites">添加到收藏</el-button>
            </div>
          </div>
        </div>
      </div>

      <!-- 支持的平台 -->
      <div class="vip-category__section">
        <div class="vip-category__header">
          <h2 class="vip-category__title">支持平台</h2>
        </div>
        <div class="vip-platforms">
          <div v-for="platform in supportedPlatforms" :key="platform.name" class="vip-platforms__item">
            <div class="vip-platforms__icon">
              <IconifyIconOnline :icon="platform.icon" :size="32" />
            </div>
            <div class="vip-platforms__name">{{ platform.name }}</div>
          </div>
        </div>
      </div>

      <!-- 解析历史记录 -->
      <div class="vip-category__section">
        <div class="vip-category__header">
          <h2 class="vip-category__title">最近解析</h2>
          <el-button type="primary" plain size="small" @click="navigateToHistory">查看全部</el-button>
        </div>

        <div class="vip-history">
          <el-table :data="parseHistory" style="width: 100%">
            <el-table-column prop="title" label="视频标题" min-width="200">
              <template #default="{ row }">
                <el-link :href="row.originalUrl" target="_blank" type="primary" :underline="false">{{ row.title || "未知标题" }}</el-link>
              </template>
            </el-table-column>
            <el-table-column prop="platform" label="平台" width="120">
              <template #default="{ row }">
                <el-tag>{{ row.platform }}</el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="apiName" label="解析接口" width="120" />
            <el-table-column prop="parseTime" label="解析时间" width="180" />
            <el-table-column label="操作" width="200" fixed="right">
              <template #default="{ row }">
                <el-button type="primary" link @click="replayParse(row)">重新解析</el-button>
                <el-button type="success" link @click="openParseResult(row)">播放</el-button>
                <el-button type="danger" link @click="removeFromHistory(row)">删除</el-button>
              </template>
            </el-table-column>
          </el-table>
        </div>
      </div>

      <!-- 使用说明 -->
      <div class="vip-category__section">
        <div class="vip-category__header">
          <h2 class="vip-category__title">使用说明</h2>
        </div>
        <div class="vip-guide">
          <el-steps :active="1" simple>
            <el-step title="复制链接" description="复制需要解析的VIP视频链接" />
            <el-step title="粘贴链接" description="将链接粘贴到解析框中" />
            <el-step title="选择接口" description="选择一个可用的解析接口" />
            <el-step title="开始解析" description="点击解析按钮开始解析" />
            <el-step title="观看视频" description="解析成功后即可免费观看" />
          </el-steps>
          <div class="vip-guide__tips">
            <el-alert title="温馨提示" type="info" :closable="false">
              <div class="vip-guide__tip-content">
                <p>1. 本功能仅供学习和测试使用，请勿用于商业用途</p>
                <p>2. 如遇到解析失败，请尝试更换解析接口</p>
                <p>3. 部分视频可能无法解析，请见谅</p>
                <p>4. 建议使用Chrome、Edge等现代浏览器获得最佳体验</p>
              </div>
            </el-alert>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from "vue";
import { useRouter } from "vue-router";
import { message } from "@repo/utils";
import { ElMessageBox } from "element-plus";
import type { FormInstance, FormRules } from "element-plus";

const router = useRouter();
const parseFormRef = ref<FormInstance>();

// 解析表单数据
const parseForm = reactive({
  url: "",
  apiIndex: 0,
});

// 表单验证规则
const parseRules = reactive<FormRules>({
  url: [
    { required: true, message: "请输入需要解析的视频链接", trigger: "blur" },
    { pattern: /^https?:\/\/.+/, message: "请输入有效的URL地址", trigger: "blur" },
  ],
});

// 解析接口列表
const parseApis = ref([
  // 通用解析接口
  { name: "通用解析接口1", url: "https://jx.jsonplayer.com/player/?url=", status: "normal" },
  { name: "通用解析接口2", url: "https://jx.aidouer.net/?url=", status: "normal" },
  { name: "通用解析接口3", url: "https://jx.bozrc.com:4433/player/?url=", status: "normal" },
  { name: "通用解析接口4", url: "https://jx.xmflv.com/?url=", status: "normal" },
  { name: "通用解析接口5", url: "https://jx.parwix.com:4433/player/?url=", status: "normal" },
  { name: "通用解析接口6", url: "https://www.yemu.xyz/?url=", status: "normal" },
  { name: "通用解析接口7", url: "https://jx.iztyy.com/svip/?url=", status: "normal" },
  { name: "通用解析接口8", url: "https://jx.yparse.com/index.php?url=", status: "normal" },

  // 平台专用接口
  { name: "爱奇艺专用1", url: "https://jx.playerjy.com/?url=", status: "normal" },
  { name: "爱奇艺专用2", url: "https://jx.rdhk.net/?v=", status: "normal" },
  { name: "爱奇艺专用3", url: "https://api.leduotv.com/wp-api/ifr.php?isDp=1&vid=", status: "normal" },

  { name: "腾讯视频专用1", url: "https://jx.m3u8.tv/jiexi/?url=", status: "normal" },
  { name: "腾讯视频专用2", url: "https://www.ckplayer.vip/jiexi/?url=", status: "normal" },
  { name: "腾讯视频专用3", url: "https://jx.iztyy.com/svip/?url=", status: "normal" },

  { name: "优酷专用1", url: "https://jx.jsonplayer.com/player/?url=", status: "normal" },
  { name: "优酷专用2", url: "https://jx.ppflv.com/?url=", status: "normal" },
  { name: "优酷专用3", url: "https://jx.aidouer.net/?url=", status: "normal" },

  { name: "芒果TV专用1", url: "https://jx.aidouer.net/?url=", status: "normal" },
  { name: "芒果TV专用2", url: "https://jx.rdhk.net/?v=", status: "normal" },

  { name: "哔哩哔哩专用1", url: "https://jx.bozrc.com:4433/player/?url=", status: "normal" },
  { name: "哔哩哔哩专用2", url: "https://www.yemu.xyz/?url=", status: "normal" },

  { name: "搜狐视频专用", url: "https://jx.iztyy.com/svip/?url=", status: "normal" },
]);

// 支持的平台
const supportedPlatforms = ref([
  { name: "爱奇艺", icon: "ri:iqiyi-fill", url: "https://www.iqiyi.com" },
  { name: "腾讯视频", icon: "ri:qq-fill", url: "https://v.qq.com" },
  { name: "优酷", icon: "ri:youtube-fill", url: "https://www.youku.com" },
  { name: "芒果TV", icon: "ri:netease-cloud-music-fill", url: "https://www.mgtv.com" },
  { name: "搜狐视频", icon: "ri:tv-fill", url: "https://tv.sohu.com" },
  { name: "哔哩哔哩", icon: "ri:bilibili-fill", url: "https://www.bilibili.com" },
]);

// 解析状态
const parsing = ref(false);

// 解析结果
const parseResult = ref(null);

// 解析历史记录
const parseHistory = ref([
  {
    id: 1,
    title: "《长安三万里》独家纪录片",
    originalUrl: "https://www.iqiyi.com/v_ik3832z0go.html",
    playUrl: "https://jx.jsonplayer.com/player/?url=https://www.iqiyi.com/v_ik3832z0go.html",
    platform: "爱奇艺",
    apiName: "通用解析接口1",
    parseTime: "2023-12-01 15:30:22",
  },
  {
    id: 2,
    title: "《封神第一部》独家纪录片",
    originalUrl: "https://v.qq.com/x/cover/mzc00200mp8vo9b/n0044td6lv1.html",
    playUrl: "https://jx.aidouer.net/?url=https://v.qq.com/x/cover/mzc00200mp8vo9b/n0044td6lv1.html",
    platform: "腾讯视频",
    apiName: "通用解析接口2",
    parseTime: "2023-11-28 20:15:36",
  },
  {
    id: 3,
    title: "《孤注一掷》幕后花絮",
    originalUrl: "https://www.youku.com/v_show/id_XNTk2MjcxNjg2NA==.html",
    playUrl: "https://jx.jsonplayer.com/player/?url=https://www.youku.com/v_show/id_XNTk2MjcxNjg2NA==.html",
    platform: "优酷",
    apiName: "优酷专用",
    parseTime: "2023-11-25 13:42:18",
  },
]);

// 粘贴URL
const pasteUrl = async () => {
  try {
    const text = await navigator.clipboard.readText();
    if (text && text.startsWith("http")) {
      parseForm.url = text;
    }
  } catch (error) {
    message("无法访问剪贴板，请手动粘贴链接", { type: "warning" });
  }
};

// 重置表单
const resetForm = () => {
  if (parseFormRef.value) {
    parseFormRef.value.resetFields();
  }
  parseForm.apiIndex = 0;
};

// 处理解析请求
const handleParse = async () => {
  if (!parseFormRef.value) return;

  await parseFormRef.value.validate(async (valid) => {
    if (valid) {
      parsing.value = true;
      try {
        // 模拟解析过程
        await new Promise((resolve) => setTimeout(resolve, 1500));

        // 获取当前选择的接口
        const selectedApi = parseApis.value[parseForm.apiIndex];

        // 创建解析结果
        parseResult.value = {
          originalUrl: parseForm.url,
          playUrl: selectedApi.url + encodeURIComponent(parseForm.url),
          apiName: selectedApi.name,
          parseTime: new Date().toLocaleString(),
        };

        // 添加到历史记录
        const platformName = detectPlatform(parseForm.url);
        const newHistoryItem = {
          id: Date.now(),
          title: "解析的视频 " + new Date().toLocaleString(),
          originalUrl: parseForm.url,
          playUrl: selectedApi.url + encodeURIComponent(parseForm.url),
          platform: platformName,
          apiName: selectedApi.name,
          parseTime: new Date().toLocaleString(),
        };

        parseHistory.value.unshift(newHistoryItem);
        if (parseHistory.value.length > 10) {
          parseHistory.value = parseHistory.value.slice(0, 10);
        }

        // 保存到本地存储
        saveHistoryToLocalStorage();

        message("解析成功！", { type: "success" });
      } catch (error) {
        message("解析失败，请尝试更换解析接口", { type: "error" });
        console.error("解析错误:", error);
      } finally {
        parsing.value = false;
      }
    }
  });
};

// 检测视频平台
const detectPlatform = (url: string) => {
  if (url.includes("iqiyi.com")) return "爱奇艺";
  if (url.includes("v.qq.com")) return "腾讯视频";
  if (url.includes("youku.com")) return "优酷";
  if (url.includes("mgtv.com")) return "芒果TV";
  if (url.includes("bilibili.com")) return "哔哩哔哩";
  if (url.includes("tv.sohu.com")) return "搜狐视频";
  return "未知平台";
};

// 复制播放链接
const copyPlayUrl = async () => {
  if (!parseResult.value) return;

  try {
    await navigator.clipboard.writeText(parseResult.value.playUrl);
    message("播放链接已复制到剪贴板", { type: "success" });
  } catch (error) {
    message("复制失败，请手动复制", { type: "error" });
  }
};

// 在新窗口打开
const openInNewTab = () => {
  if (!parseResult.value) return;
  window.open(parseResult.value.playUrl, "_blank");
};

// 添加到收藏
const addToFavorites = () => {
  if (!parseResult.value) return;
  message("已添加到收藏", { type: "success" });
  // 实际实现收藏功能的代码
};

// 重新解析历史记录中的项目
const replayParse = (item) => {
  parseForm.url = item.originalUrl;
  // 查找对应的API索引
  const apiIndex = parseApis.value.findIndex((api) => api.name === item.apiName);
  parseForm.apiIndex = apiIndex >= 0 ? apiIndex : 0;

  // 滚动到表单位置
  document.querySelector(".vip-parser")?.scrollIntoView({ behavior: "smooth" });
};

// 打开解析结果
const openParseResult = (item) => {
  parseResult.value = {
    originalUrl: item.originalUrl,
    playUrl: item.playUrl,
    apiName: item.apiName,
    parseTime: item.parseTime,
  };

  // 滚动到结果位置
  document.querySelector(".vip-result")?.scrollIntoView({ behavior: "smooth" });
};

// 从历史记录中删除
const removeFromHistory = (item) => {
  ElMessageBox.confirm("确定要从历史记录中删除此项吗？", "提示", {
    confirmButtonText: "确定",
    cancelButtonText: "取消",
    type: "warning",
  })
    .then(() => {
      parseHistory.value = parseHistory.value.filter((record) => record.id !== item.id);
      saveHistoryToLocalStorage();
      message("已从历史记录中删除", { type: "success" });
    })
    .catch(() => {});
};

// 保存历史记录到本地存储
const saveHistoryToLocalStorage = () => {
  try {
    localStorage.setItem("vip-parse-history", JSON.stringify(parseHistory.value));
  } catch (error) {
    console.error("保存历史记录失败:", error);
  }
};

// 从本地存储加载历史记录
const loadHistoryFromLocalStorage = () => {
  try {
    const savedHistory = localStorage.getItem("vip-parse-history");
    if (savedHistory) {
      parseHistory.value = JSON.parse(savedHistory);
    }
  } catch (error) {
    console.error("加载历史记录失败:", error);
  }
};

// 导航到历史记录页面
const navigateToHistory = () => {
  router.push({
    path: "/video/search",
    query: {
      type: "vip",
      view: "history",
    },
  });
};

// 组件挂载时加载历史记录
onMounted(() => {
  loadHistoryFromLocalStorage();
});
</script>

<style lang="scss" scoped>
.vip-category {
  background: linear-gradient(135deg, rgba(240, 245, 255, 0.8) 0%, rgba(255, 255, 255, 0.9) 100%);
  padding: 20px;
  border-radius: 16px;

  &__container {
    margin-bottom: 24px;
    animation: fadeIn 0.5s ease-in-out;
  }

  &__header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 20px;
    padding-bottom: 10px;
    border-bottom: 1px solid rgba(var(--el-color-primary-rgb), 0.1);
  }

  &__title {
    font-size: 22px;
    font-weight: 700;
    color: var(--el-text-color-primary);
    position: relative;
    margin: 0;
    letter-spacing: 0.5px;

    &::after {
      content: "";
      position: absolute;
      left: 0;
      bottom: -8px;
      width: 50px;
      height: 4px;
      background: linear-gradient(90deg, var(--el-color-primary), var(--el-color-primary-light-3));
      border-radius: 4px;
      transition: width 0.3s ease;
    }

    &:hover::after {
      width: 70px;
    }
  }

  &__section {
    margin-top: 40px;
    transition: all 0.3s ease;
  }
}

.vip-parser {
  background-color: var(--el-bg-color-overlay);
  border-radius: 16px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.07);
  padding: 30px;
  margin-bottom: 30px;
  transition:
    transform 0.3s ease,
    box-shadow 0.3s ease;
  border: 1px solid rgba(var(--el-color-primary-rgb), 0.1);
  position: relative;
  overflow: hidden;

  &::before {
    content: "";
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 4px;
    background: linear-gradient(90deg, var(--el-color-primary), var(--el-color-primary-light-3));
  }

  &:hover {
    transform: translateY(-5px);
    box-shadow: 0 15px 35px rgba(0, 0, 0, 0.1);
  }

  &__form {
    max-width: 800px;
    margin: 0 auto;
  }

  &__api-option {
    display: flex;
    justify-content: space-between;
    align-items: center;
    width: 100%;
  }
}

.vip-result {
  background-color: var(--el-bg-color-overlay);
  border-radius: 16px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.07);
  padding: 30px;
  margin-top: 30px;
  border: 1px solid rgba(var(--el-color-primary-rgb), 0.1);
  animation: slideUp 0.5s ease-out;
  position: relative;
  overflow: hidden;

  &::before {
    content: "";
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 4px;
    background: linear-gradient(90deg, var(--el-color-success), var(--el-color-success-light-3));
  }

  &__header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 20px;
    padding-bottom: 10px;
    border-bottom: 1px solid rgba(0, 0, 0, 0.05);
  }

  &__title {
    font-size: 20px;
    font-weight: 700;
    margin: 0;
    color: var(--el-color-success);
    display: flex;
    align-items: center;

    &::before {
      content: "✓";
      margin-right: 8px;
      font-size: 18px;
      background: var(--el-color-success-light-8);
      color: var(--el-color-success);
      width: 24px;
      height: 24px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
    }
  }

  &__content {
    display: flex;
    flex-direction: column;
    gap: 24px;
  }

  &__video {
    width: 100%;
    aspect-ratio: 16 / 9;
    background-color: #000;
    border-radius: 12px;
    overflow: hidden;
    box-shadow: 0 8px 20px rgba(0, 0, 0, 0.15);
    transition: transform 0.3s ease;

    &:hover {
      transform: scale(1.01);
    }

    iframe {
      width: 100%;
      height: 100%;
      border: none;
    }
  }

  &__info {
    display: flex;
    flex-direction: column;
    gap: 16px;
    background-color: var(--el-color-info-light-9);
    padding: 20px;
    border-radius: 12px;
    border-left: 4px solid var(--el-color-info);
  }

  &__item {
    display: flex;
    align-items: center;
    gap: 12px;
    transition: transform 0.2s ease;

    &:hover {
      transform: translateX(5px);
    }
  }

  &__label {
    font-weight: 600;
    color: var(--el-text-color-secondary);
    min-width: 90px;
  }

  &__actions {
    display: flex;
    flex-wrap: wrap;
    gap: 16px;
    margin-top: 20px;
    justify-content: flex-start;
  }
}

.vip-platforms {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(130px, 1fr));
  gap: 24px;
  margin-top: 20px;

  &__item {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 12px;
    padding: 20px;
    background-color: var(--el-bg-color-overlay);
    border-radius: 16px;
    box-shadow: 0 8px 20px rgba(0, 0, 0, 0.06);
    transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
    border: 1px solid rgba(var(--el-color-primary-rgb), 0.05);
    position: relative;
    overflow: hidden;
    cursor: pointer;

    &::after {
      content: "";
      position: absolute;
      bottom: 0;
      left: 0;
      width: 100%;
      height: 3px;
      background: linear-gradient(90deg, var(--el-color-primary-light-5), var(--el-color-primary));
      transform: scaleX(0);
      transform-origin: left;
      transition: transform 0.3s ease;
    }

    &:hover {
      transform: translateY(-8px) scale(1.05);
      box-shadow: 0 15px 30px rgba(0, 0, 0, 0.1);

      &::after {
        transform: scaleX(1);
      }
    }
  }

  &__icon {
    color: var(--el-color-primary);
    background-color: var(--el-color-primary-light-9);
    padding: 12px;
    border-radius: 50%;
    transition: all 0.3s ease;

    &:hover {
      transform: rotate(10deg);
    }
  }

  &__name {
    font-size: 15px;
    font-weight: 600;
    text-align: center;
  }
}

.vip-history {
  background-color: var(--el-bg-color-overlay);
  border-radius: 16px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.07);
  padding: 24px;
  margin-top: 20px;
  border: 1px solid rgba(var(--el-color-primary-rgb), 0.1);
  position: relative;
  overflow: hidden;

  &::before {
    content: "";
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 4px;
    background: linear-gradient(90deg, var(--el-color-warning), var(--el-color-warning-light-3));
  }

  :deep(.el-table) {
    --el-table-border-color: rgba(var(--el-color-primary-rgb), 0.05);
    --el-table-header-bg-color: var(--el-color-primary-light-9);
    --el-table-row-hover-bg-color: var(--el-color-primary-light-9);
    border-radius: 8px;
    overflow: hidden;

    .el-table__header th {
      font-weight: 600;
      color: var(--el-color-primary);
    }

    .el-button--link {
      transition: all 0.2s ease;

      &:hover {
        transform: translateY(-2px);
        opacity: 0.9;
      }
    }
  }
}

.vip-guide {
  background-color: var(--el-bg-color-overlay);
  border-radius: 16px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.07);
  padding: 30px;
  margin-top: 20px;
  border: 1px solid rgba(var(--el-color-primary-rgb), 0.1);
  position: relative;
  overflow: hidden;

  &::before {
    content: "";
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 4px;
    background: linear-gradient(90deg, var(--el-color-info), var(--el-color-info-light-3));
  }

  :deep(.el-steps) {
    margin-bottom: 20px;

    .el-step__title {
      font-weight: 600;
    }

    .el-step__description {
      font-size: 13px;
    }

    .el-step__icon {
      box-shadow: 0 0 0 2px rgba(var(--el-color-primary-rgb), 0.1);
      transition: transform 0.3s ease;

      &:hover {
        transform: scale(1.1);
      }
    }
  }

  &__tips {
    margin-top: 30px;
  }

  &__tip-content {
    p {
      margin: 10px 0;
      position: relative;
      padding-left: 20px;
      transition: transform 0.2s ease;

      &:hover {
        transform: translateX(5px);
      }

      &::before {
        content: "•";
        position: absolute;
        left: 0;
        color: var(--el-color-primary);
        font-size: 18px;
        line-height: 1;
      }
    }
  }
}
/* 全局动画效果 */
@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

@keyframes slideUp {
  from {
    opacity: 0;
    transform: translateY(30px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* 响应式调整 */
@media (max-width: 768px) {
  .vip-result__actions,
  .vip-category__header {
    flex-direction: column;
    align-items: flex-start;
    gap: 10px;
  }

  .vip-platforms {
    grid-template-columns: repeat(auto-fill, minmax(100px, 1fr));
  }
}
</style>
