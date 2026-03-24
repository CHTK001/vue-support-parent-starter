<script setup>
/**
 * 快捷导航部件
 * @author CH
 * @date 2024-02-10
 * @version 1.0.0
 */
import { reactive } from "vue";
import { useRenderIcon } from "@repo/components/ReIcon/src/hooks";

const shortcuts = reactive([
  { name: "Google", url: "https://www.google.com", icon: "logos:google-icon" },
  { name: "GitHub", url: "https://github.com", icon: "logos:github-icon" },
  { name: "ChatGPT", url: "https://chat.openai.com", icon: "simple-icons:openai" },
  { name: "Bilibili", url: "https://www.bilibili.com", icon: "ri:bilibili-fill", color: "#FB7299" },
  { name: "掘金", url: "https://juejin.cn", icon: "ri:code-s-slash-line", color: "#1E80FF" },
  { name: "Youtube", url: "https://www.youtube.com", icon: "logos:youtube-icon" },
  { name: "Twitter", url: "https://twitter.com", icon: "logos:twitter" },
  { name: "StackOverflow", url: "https://stackoverflow.com", icon: "logos:stackoverflow-icon" },
]);

const openUrl = (url) => {
  window.open(url, "_blank");
};
</script>

<template>
  <div class="shortcuts-container">
    <div class="shortcuts-grid">
      <div
        v-for="item in shortcuts"
        :key="item.name"
        class="shortcut-item"
        @click="openUrl(item.url)"
      >
        <div class="shortcut-icon" :style="{ color: item.color }">
          <component :is="useRenderIcon(item.icon)" />
        </div>
        <span class="shortcut-name">{{ item.name }}</span>
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
.shortcuts-container {
  width: 100%;
  height: 100%;
  padding: 16px;
  background: var(--el-bg-color);
  display: flex;
  flex-direction: column;
}

.shortcuts-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 12px;
  height: 100%;
  align-content: start;
}

.shortcut-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  padding: 12px 4px;
  border-radius: 12px;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  
  &:hover {
    background: var(--el-fill-color);
    transform: translateY(-2px);
    
    .shortcut-icon {
      transform: scale(1.1);
    }
  }
}

.shortcut-icon {
  font-size: 28px;
  margin-bottom: 8px;
  transition: transform 0.3s ease;
  display: flex;
  align-items: center;
  justify-content: center;
}

.shortcut-name {
  font-size: 12px;
  color: var(--el-text-color-regular);
  text-align: center;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  width: 100%;
}
</style>
