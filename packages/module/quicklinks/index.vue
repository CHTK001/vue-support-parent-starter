<script setup>
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
  <div class="quick-links">
    <div class="links-header">
      <span class="header-title">快捷入口</span>
    </div>
    <div class="links-grid">
      <div
        v-for="link in links"
        :key="link.title"
        class="link-item"
        @click="handleClick(link)"
      >
        <div class="link-icon" :style="{ backgroundColor: link.color + '15', color: link.color }">
          <el-icon :size="22">
            <component :is="useRenderIcon(link.icon)" />
          </el-icon>
        </div>
        <span class="link-title">{{ link.title }}</span>
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
.quick-links {
  height: 100%;
  padding: 16px;
  display: flex;
  flex-direction: column;
}

.links-header {
  margin-bottom: 12px;
  
  .header-title {
    font-size: 15px;
    font-weight: 600;
    color: var(--el-text-color-primary);
  }
}

.links-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
  flex: 1;
}

.link-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 12px 8px;
  border-radius: 10px;
  cursor: pointer;
  transition: all 0.2s ease;
  background: var(--el-fill-color-lighter);
  
  &:hover {
    background: var(--el-fill-color);
    transform: translateY(-2px);
  }
}

.link-icon {
  width: 44px;
  height: 44px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 8px;
}

.link-title {
  font-size: 12px;
  color: var(--el-text-color-regular);
  white-space: nowrap;
}
</style>
