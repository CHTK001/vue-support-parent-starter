<template>
  <div class="current-category">
    <h2 class="category-title">{{ getCategoryName() }}</h2>
    <p class="category-desc">{{ getCategoryDesc() }}</p>
  </div>
</template>

<script setup lang="ts">
import { defineProps } from 'vue';

const props = defineProps({
  category: {
    type: String,
    default: 'all'
  }
});

// 软件分类
const categories = [
  { label: "全部", value: "all" },
  { label: "数据库", value: "database" },
  { label: "Web服务器", value: "web_server" },
  { label: "开发工具", value: "development" },
  { label: "监控工具", value: "monitoring" },
  { label: "容器", value: "container" },
  { label: "其他", value: "other" },
];

// 获取当前分类名称
const getCategoryName = () => {
  if (props.category === "installed") {
    return "已安装软件";
  }
  if (!props.category) {
    return "全部软件";
  }
  const found = categories.find((item) => item.value === props.category);
  return found ? found.label : "全部软件";
};

// 获取当前分类描述
const getCategoryDesc = () => {
  if (props.category === "installed") {
    return "已在系统中安装的所有软件";
  }

  switch (props.category) {
    case "database":
      return "各类数据库软件，包括关系型和非关系型数据库";
    case "web_server":
      return "Web服务器和反向代理服务器";
    case "development":
      return "开发工具和环境";
    case "monitoring":
      return "系统和应用监控工具";
    case "container":
      return "容器和容器管理平台";
    case "other":
      return "其他类型软件";
    default:
      return "全部可用软件";
  }
};
</script>

<style lang="scss" scoped>
.current-category {
  background-color: var(--el-bg-color);
  padding: 20px;
  border-radius: 8px;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.05);
  margin-bottom: 20px;

  .category-title {
    font-size: 22px;
    font-weight: 600;
    margin: 0 0 12px;
    color: var(--el-text-color-primary);
    display: flex;
    align-items: center;

    &::before {
      content: "";
      display: inline-block;
      width: 4px;
      height: 20px;
      background-color: var(--el-color-primary);
      margin-right: 12px;
      border-radius: 2px;
    }
  }

  .category-desc {
    font-size: 14px;
    color: var(--el-text-color-secondary);
    margin: 0 0 0 16px;
    line-height: 1.6;
  }
}
</style> 