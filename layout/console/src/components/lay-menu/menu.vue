<template>
  <div class="menu-children">
    <div class="menu-children-title justify-between">
      <h2>{{ props.title }}</h2>
      <el-icon class="menu-children-close" @click="handleClose">
        <component :is="useRenderIcon('ep:close')" />
      </el-icon>
    </div>
    <div class="menu-children-content">
      <el-row :gutter="16">
        <el-col :span="8" v-for="(item, index) in props.menu" :key="index">
          <template v-if="item.children && item.children.length > 0 && index == 0">
            <h2 class="cursor-default category-title">{{ item?.meta.title }}</h2>
            <el-icon class="menu-children-close" @click="handleClose">
              <component :is="useRenderIcon('ep:close')" />
            </el-icon>
          </template>

          <template v-if="item.children && item.children.length > 0">
            <div v-for="(item1, index) in item.children" :key="index">
              <div class="children menu-item" @click="openMenu(item1)" @mouseover="showStarButton" @mouseleave="hiddeStarButton">
                <div class="menu-item-content">
                  <el-icon v-if="item1.meta.icon" class="icon">
                    <component :is="useRenderIcon(item1.meta.icon)" />
                  </el-icon>
                  <span class="children-title">{{ item1.meta.title }}</span>
                </div>
                <el-icon class="star" @click.stop="handleStarMenu(item)">
                  <component :is="useRenderIcon('ri:star-line')" />
                </el-icon>
              </div>
            </div>
          </template>
          <div v-else class="children menu-item" @click="openMenu(item)" @mouseover="showStarButton" @mouseleave="hiddeStarButton">
            <div class="menu-item-content">
              <el-icon v-if="item.meta.icon" class="icon">
                <component :is="useRenderIcon(item.meta.icon)" />
              </el-icon>
              <span class="children-title">{{ item.meta.title }}</span>
            </div>
            <el-icon class="star" @click.stop="handleStarMenu(item)">
              <component :is="useRenderIcon('ri:star-line')" />
            </el-icon>
          </div>
        </el-col>
      </el-row>
    </div>
  </div>
</template>

<script setup>
import { useGlobal } from "@pureadmin/utils";
import { useRenderIcon } from "@repo/components/ReIcon/src/hooks";
import { computed, defineEmits, defineProps } from "vue";
import { localStorageProxy } from "@repo/utils";
import { router, useUserStoreHook } from "@repo/core";
const userInfo = useUserStoreHook().sysUserId;
const mineStarLocalKey = "mine-";
//@ts-ignore
const { $storage } = useGlobal();
const emit = defineEmits();
const props = defineProps({
  menu: {
    type: Object,
    default: () => {
      return {};
    },
  },
  title: {
    type: String,
    default: () => {
      return "";
    },
  },
});

const showStarButton = async (e) => {
  const _star = e.currentTarget.querySelector(".star");
  if (!_star) {
    return;
  }
  _star.style.display = "block";
};

const hiddeStarButton = async (e) => {
  const _star = e.currentTarget.querySelector(".star");
  if (!_star) {
    return;
  }
  _star.style.display = "none";
};

const handleStarMenu = async (row) => {};
/**
 * @description: 打开菜单
 */
const openMenu = async (item) => {
  if ($storage.configure.openOrInlay) {
    window.open(`#${item.path}`, "_blank");
    return;
  }
  router.push(item.path);
};
const handleClose = async () => {
  emit("close");
};
</script>

<style scoped lang="scss">
.menu-children {
  display: flex;
  flex-direction: column;
  height: 100%;
  overflow: hidden;
  font-family:
    "Inter",
    -apple-system,
    BlinkMacSystemFont,
    "Segoe UI",
    Roboto,
    sans-serif;

  .menu-children-title {
    display: flex;
    color: var(--el-text-color-primary);
    flex-direction: row;
    height: 48px;
    font-size: 16px;
    line-height: 48px;
    font-weight: 600;
    margin-bottom: 16px;
    border-bottom: 1px solid rgba(var(--el-border-color-rgb), 0.1);

    h2 {
      margin: 0;
      font-size: 18px;
      background: linear-gradient(90deg, var(--el-color-primary), var(--el-color-primary-light-3));
      background-clip: text;
      -webkit-background-clip: text;
      color: transparent;
      letter-spacing: 0.5px;
    }

    .menu-children-close {
      font-size: 20px;
      line-height: 18px;
      color: var(--el-text-color-primary);
      top: 12px;
      cursor: pointer;
      padding: 6px;
      border-radius: 50%;
      transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);

      &:hover {
        background-color: rgba(var(--el-color-primary-rgb), 0.1);
        transform: rotate(90deg);
      }
    }
  }

  .menu-children-content {
    flex: 1;
    overflow-y: auto;
    overflow-x: hidden;
    padding-right: 8px;
    scrollbar-width: none; /* Firefox */
    -ms-overflow-style: none; /* IE and Edge */

    &::-webkit-scrollbar {
      display: none; /* Chrome, Safari, Opera */
    }

    .category-title {
      font-size: 15px;
      color: var(--el-text-color-primary);
      margin-bottom: 12px;
      padding-bottom: 6px;
      border-bottom: 1px dashed rgba(var(--el-border-color-rgb), 0.3);
    }

    .children {
      position: relative;
      cursor: pointer;
      display: flex;
      padding: 0 12px;
      justify-content: space-between;
      flex: 1 1 0%;
      height: 40px;
      line-height: 40px;
      color: var(--el-text-color-primary-2);
      gap: 8px;
      margin-bottom: 8px;
      border-radius: 8px;
      transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);

      &:hover {
        background-color: rgba(var(--el-color-primary-rgb), 0.05);
        transform: translateX(3px);
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
      }

      .menu-item-content {
        display: flex;
        align-items: center;

        .icon {
          margin-right: 8px;
          font-size: 16px;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
          color: var(--el-text-color-secondary);
        }

        .children-title {
          font-size: 14px;
          font-weight: 500;
          letter-spacing: 0.3px;
          transition: color 0.3s ease;
        }
      }

      &:hover .icon {
        transform: scale(1.15) rotate(5deg);
        color: var(--el-color-primary);
      }

      &:hover .children-title {
        color: var(--el-color-primary);
      }

      .star {
        font-size: 16px;
        display: none;
        padding: 4px;
        border-radius: 50%;
        height: 24px;
        width: 24px;
        margin-top: 8px;
        color: var(--el-text-color-secondary);
        transition: all 0.3s ease;

        &:hover {
          background-color: rgba(var(--el-color-primary-rgb), 0.1);
          color: var(--el-color-primary);
          transform: scale(1.15);
        }
      }
    }

    .menu-item {
      position: relative;
      overflow: hidden;

      &::before {
        content: "";
        position: absolute;
        inset: 0;
        border-radius: 8px;
        padding: 1px;
        background: linear-gradient(to right, transparent, transparent);
        -webkit-mask:
          linear-gradient(#fff 0 0) content-box,
          linear-gradient(#fff 0 0);
        -webkit-mask-composite: xor;
        mask-composite: exclude;
        opacity: 0;
        transition:
          opacity 0.3s ease,
          background 0.3s ease;
      }

      &:hover::before {
        opacity: 1;
        background: linear-gradient(to right, rgba(var(--el-color-primary-rgb), 0.3), transparent);
      }

      &:active {
        transform: scale(0.98);
      }
    }
  }
}

/* 暗黑模式适配 */
.dark {
  .menu-children-title h2 {
    background: linear-gradient(90deg, var(--el-color-primary), var(--el-color-primary-light-5));
    background-clip: text;
    -webkit-background-clip: text;
  }

  .children:hover {
    background-color: rgba(var(--el-color-primary-rgb), 0.1);
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
  }

  .star:hover {
    background-color: rgba(var(--el-color-primary-rgb), 0.2);
  }
}

/* 添加毛玻璃效果支持 */
@supports (backdrop-filter: blur(8px)) {
  .menu-children {
    background-color: rgba(var(--el-bg-color-rgb), 0.85);
    backdrop-filter: blur(8px);
  }

  .dark .menu-children {
    background-color: rgba(var(--el-bg-color-rgb), 0.7);
    backdrop-filter: blur(10px);
  }
}

/* 添加按钮点击涟漪效果 */
.menu-item {
  position: relative;
  overflow: hidden;

  &::after {
    content: "";
    position: absolute;
    top: 50%;
    left: 50%;
    width: 5px;
    height: 5px;
    background: rgba(255, 255, 255, 0.5);
    opacity: 0;
    border-radius: 100%;
    transform: scale(1, 1) translate(-50%, -50%);
    transform-origin: 50% 50%;
  }

  &:active::after {
    animation: ripple 0.6s ease-out;
  }
}

@keyframes ripple {
  0% {
    transform: scale(0, 0);
    opacity: 0.5;
  }
  100% {
    transform: scale(20, 20);
    opacity: 0;
  }
}
</style>
