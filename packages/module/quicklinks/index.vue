<script setup>
/**
 * 快捷入口部件
 * @author CH
 * @date 2024-12-10
 * @version 1.0.1
 */
import { ref } from "vue";
import { useRouter } from "vue-router";
import { useRenderIcon } from "@repo/components/ReIcon/src/hooks";

const router = useRouter();

const links = ref([
  { title: "项目管理", icon: "ri:apps-2-line", path: "/app", color: "#409eff" },
  { title: "节点管理", icon: "ri:server-line", path: "/node-management", color: "#67c23a" },
  { title: "数据管理", icon: "ri:database-2-line", path: "/data-management", color: "#e6a23c" },
  { title: "任务调度", icon: "ri:calendar-schedule-line", path: "/job", color: "#f56c6c" },
  { title: "Docker", icon: "ri:docker-fill", path: "/docker", color: "#0db7ed" },
  { title: "系统设置", icon: "ri:settings-3-line", path: "/setting", color: "#909399" },
]);

const handleClick = (link) => {
  if (link.path) {
    router.push(link.path);
  }
};
</script>

<template>
  <div class="quick-links-card">
    <div class="header">
      <span class="title">常用功能</span>
    </div>
    <div class="links-grid">
      <div
        v-for="link in links"
        :key="link.title"
        class="link-item"
        @click="handleClick(link)"
      >
        <div class="icon-box" :style="{ backgroundColor: link.color + '15', color: link.color }">
          <el-icon :size="20">
            <component :is="useRenderIcon(link.icon)" />
          </el-icon>
        </div>
        <span class="link-label">{{ link.title }}</span>
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
.quick-links-card {
  width: 100%;
  height: 100%;
  background: var(--el-bg-color);
  border-radius: 12px;
  padding: 16px;
  display: flex;
  flex-direction: column;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
}

.header {
  margin-bottom: 12px;
  .title {
    font-size: 14px;
    font-weight: 600;
    color: var(--el-text-color-primary);
  }
}

.links-grid {
  flex: 1;
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  grid-template-rows: repeat(2, 1fr);
  gap: 8px;
}

.link-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 8px 4px;
  border-radius: 10px;
  cursor: pointer;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  background: var(--el-fill-color-lighter);
  
  &:hover {
    background: var(--el-fill-color);
    transform: translateY(-2px);
    
    .icon-box {
      transform: scale(1.1);
    }
  }
}

.icon-box {
  width: 36px;
  height: 36px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 6px;
  transition: transform 0.2s;
}

.link-label {
  font-size: 11px;
  color: var(--el-text-color-regular);
  text-align: center;
  white-space: nowrap;
}
</style>
