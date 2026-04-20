<template>
  <div class="project-empty">
    <div class="project-empty__orb">
      <IconifyIconOnline icon="ep:folder-opened" />
    </div>
    <p class="project-empty__eyebrow">{{ title }}</p>
    <h3 class="project-empty__title">使用顶部工具栏新增项目</h3>
    <p class="project-empty__desc">
      当前还没有项目档案。支持 Spring Boot、Node.js、Python、静态站点与 Docker，
      在一个页面内完成建档、脚本配置和部署准备。
    </p>
    <div class="project-empty__tips">
      <span>顶部新增</span>
      <span>卡片巡检</span>
      <span>部署 / 日志 / 回滚</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { IconifyIconOnline } from "@repo/components";

defineProps<{
  title: string;
}>();
</script>

<style scoped lang="scss">
.project-empty {
  display: grid;
  place-items: center;
  gap: 14px;
  min-height: 420px;
  padding: 48px 24px;
  text-align: center;
  color: #475569;
}

.project-empty__orb {
  display: grid;
  place-items: center;
  width: 96px;
  height: 96px;
  border-radius: 32px;
  font-size: 42px;
  color: #2563eb;
  background:
    radial-gradient(circle at 30% 30%, rgba(96, 165, 250, 0.28), transparent 58%),
    linear-gradient(145deg, rgba(255, 255, 255, 0.95), rgba(219, 234, 254, 0.92));
  box-shadow:
    0 18px 40px rgba(37, 99, 235, 0.14),
    inset 0 1px 0 rgba(255, 255, 255, 0.92);
}

.project-empty__eyebrow {
  margin: 0;
  font-size: 12px;
  letter-spacing: 0.24em;
  text-transform: uppercase;
  color: #60a5fa;
}

.project-empty__title {
  margin: 0;
  font-size: 30px;
  color: #0f172a;
}

.project-empty__desc {
  max-width: 720px;
  margin: 0;
  font-size: 14px;
  line-height: 1.8;
}

.project-empty__tips {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 10px;

  span {
    padding: 8px 14px;
    border-radius: 999px;
    background: rgba(255, 255, 255, 0.84);
    border: 1px solid rgba(148, 163, 184, 0.18);
    color: #1e3a8a;
    font-size: 12px;
    font-weight: 600;
  }
}
</style>
