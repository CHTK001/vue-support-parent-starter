<template>
  <div class="navbar-container">
    <div class="navbar">
      <div class="brand">
        <IconifyIconOnline icon="ri:movie-2-line" class="logo-icon" />
        <span class="logo-text">观影 GYING</span>
      </div>

      <div class="main-menu">
        <div v-for="(item, index) in mainMenus" :key="index" :class="['menu-item', { active: activeMenu === item.path }]" @click="handleMenuClick(item)">
          {{ item.name }}
        </div>
      </div>

      <div class="right-section">
        <div class="search-box">
          <el-input v-model="searchKeyword" placeholder="输入关键词" class="search-input">
            <template #prefix>
              <IconifyIconOnline icon="ri:search-line" />
            </template>
          </el-input>
          <el-button class="search-btn" @click="handleSearch">
            <IconifyIconOnline icon="ri:search-line" />
          </el-button>
        </div>

        <div class="action-items">
          <div class="action-item">
            <IconifyIconOnline icon="ri:history-line" />
            <span>观看历史</span>
          </div>

          <div class="action-item">
            <IconifyIconOnline icon="ri:settings-3-line" />
            <span>设置</span>
          </div>
        </div>

        <div class="user-avatar">
          <el-avatar :size="36" src="https://cube.elemecdn.com/0/88/03b0d39583f48206768a7534e55bcpng.png" />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from "vue";
import { useRouter, useRoute } from "vue-router";

const router = useRouter();
const route = useRoute();

const searchKeyword = ref("");
const activeMenu = computed(() => "/" + route.path.split("/")[1]);

// 主菜单项
const mainMenus = [
  { name: "首页", path: "/" },
  { name: "电影", path: "/movie" },
  { name: "剧集", path: "/tv" },
  { name: "动漫", path: "/anime" },
  { name: "热门", path: "/hot" },
  { name: "预告", path: "/trailer" },
  { name: "解析", path: "/analysis" },
  { name: "网址", path: "/sites" },
];

// 点击菜单
const handleMenuClick = (menu) => {
  router.push(menu.path);
};

// 处理搜索
const handleSearch = () => {
  if (searchKeyword.value.trim()) {
    router.push({
      path: "/video/search/results",
      query: { keyword: searchKeyword.value },
    });
  }
};
</script>

<style lang="scss" scoped>
.navbar-container {
  width: 100%;
  height: 60px;
  background-color: var(--el-bg-color-overlay);
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.08);
  position: fixed;
  top: 0;
  left: 0;
  z-index: 1000;
}

.navbar {
  max-width: 1400px;
  height: 100%;
  margin: 0 auto;
  padding: 0 20px;
  display: flex;
  align-items: center;
}

.brand {
  display: flex;
  align-items: center;
  margin-right: 30px;
  cursor: pointer;

  .logo-icon {
    font-size: 24px;
    color: #108cee;
    margin-right: 8px;
  }

  .logo-text {
    font-size: 18px;
    font-weight: 700;
    color: #108cee;
    background: linear-gradient(90deg, #108cee 0%, #2fc6ff 100%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
  }
}

.main-menu {
  display: flex;
  align-items: center;
  height: 100%;
  flex: 1;

  .menu-item {
    padding: 0 15px;
    font-size: 15px;
    font-weight: 500;
    color: var(--el-text-color-primary);
    cursor: pointer;
    height: 60px;
    line-height: 60px;
    transition: all 0.3s;
    position: relative;

    &:hover {
      color: #108cee;
    }

    &.active {
      color: #108cee;
      font-weight: 600;

      &::after {
        content: "";
        position: absolute;
        bottom: 0;
        left: 50%;
        transform: translateX(-50%);
        width: 24px;
        height: 3px;
        background-color: #108cee;
        border-radius: 2px;
      }
    }
  }
}

.right-section {
  display: flex;
  align-items: center;
}

.search-box {
  display: flex;
  margin-right: 20px;

  .search-input {
    width: 200px;

    :deep(.el-input__wrapper) {
      border-radius: 20px 0 0 20px;
      box-shadow: 0 0 0 1px #e0e0e0 inset;
    }
  }

  .search-btn {
    border-radius: 0 20px 20px 0;
    border: 1px solid #e0e0e0;
    border-left: none;
    background-color: var(--el-bg-color-overlay);
    color: var(--el-text-color-primary);

    &:hover {
      color: #108cee;
      background-color: #f5f7fa;
    }
  }
}

.action-items {
  display: flex;
  margin-right: 20px;

  .action-item {
    display: flex;
    flex-direction: column;
    align-items: center;
    margin: 0 12px;
    font-size: 12px;
    color: var(--el-text-color-primary);
    cursor: pointer;

    svg {
      font-size: 18px;
      margin-bottom: 2px;
    }

    &:hover {
      color: #108cee;
    }
  }
}

.user-avatar {
  cursor: pointer;
}

@media (max-width: 992px) {
  .action-items {
    .action-item span {
      display: none;
    }
  }

  .search-box .search-input {
    width: 150px;
  }
}

@media (max-width: 768px) {
  .main-menu {
    display: none;
  }

  .brand {
    margin-right: auto;
  }
}
</style>
