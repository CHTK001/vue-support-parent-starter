<template>
  <div class="lay-menu-body" v-if="showMenu">
    <div class="lay-menu-parent">
      <div class="lay-menu-parent-item">
        <div class="menu-title">
          <div class="item" :class="{ active: showService }">
            <span class="span" @click="triggerService">
              <span class="icon">
                <el-icon>
                  <component :is="useRenderIcon('ep:menu')" />
                </el-icon>
              </span>
              <span class="text">{{ $t("menu.produce-service") }}</span>
              <span class="action">
                <el-icon class="arrow-icon" :class="{ 'rotate-icon': showService }">
                  <component :is="useRenderIcon(showService ? 'ep:arrow-up' : 'ep:arrow-down')" />
                </el-icon>
              </span>
            </span>
          </div>
          <div class="item2" v-if="showService">
            <div class="span2">
              <button class="menu cursor-pointer" v-for="item in wholeMenus" @click="handleClickMenu(item)" :class="{ active: item.path === activePath }">
                <span class="icon">
                  <el-icon>
                    <component :is="useRenderIcon(item.meta.icon)" />
                  </el-icon>
                </span>
                <span class="text">{{ item.meta.i18nKey ? transformI18n(item.meta.i18nKey) : item.meta.title }}</span>
              </button>
            </div>
          </div>
          <div class="item" :class="{ active: showStar }">
            <span class="span" @click="triggerStar">
              <span class="icon">
                <el-icon>
                  <component :is="useRenderIcon('ri:star-line')" />
                </el-icon>
              </span>
              <span class="text">{{ $t("menu.produce-star") }}</span>
              <span class="action">
                <el-icon class="arrow-icon" :class="{ 'rotate-icon': showStar }">
                  <component :is="useRenderIcon(showStar ? 'ep:arrow-up' : 'ep:arrow-down')" />
                </el-icon>
              </span>
            </span>
          </div>
        </div>
      </div>
    </div>
    <div class="lay-menu-children" v-if="showMenuChildren">
      <LayMenuChildren :menu="clickMenuChildren" :title="clickMenuChildrenTitle" @close="triggerClose2"></LayMenuChildren>
    </div>
  </div>
</template>
<script setup lang="ts">
import { useRenderIcon } from "@repo/components/ReIcon/src/hooks";
import { transformI18n } from "@repo/config";
import { usePermissionStoreHook } from "@repo/core";
import { computed, defineAsyncComponent, defineExpose, ref, shallowRef } from "vue";
import { useRouter } from "vue-router";
const emit = defineEmits();
const LayMenuChildren = defineAsyncComponent(() => import("./menu.vue"));
const router = useRouter();
const path = router.currentRoute.value.path;
const activePath = ref(path);
const isHome = computed(() => {
  return path == "/" || path == "/home" || !path;
});
const wholeMenus = computed(() => {
  return usePermissionStoreHook().wholeMenus;
});

const clickMenuChildren = shallowRef([]);
const clickMenuChildrenTitle = shallowRef("其它");
const showMenuChildren = shallowRef(false);
const showMenu = shallowRef(false);
const showService = shallowRef(true);
const showStar = shallowRef(false);
const triggerClose = async () => {
  showMenuChildren.value = false;
  showMenu.value = false;
};

const triggerService = async () => {
  showService.value = !showService.value;
  showStar.value = false;
};
const triggerStar = async () => {
  showStar.value = !showStar.value;
  showService.value = false;
};
const triggerClose2 = async () => {
  triggerClose();
  emit("close");
};
const triggerOpen = async () => {
  showMenu.value = true;
};

const unRegisterActive = async () => {
  const _elementCollection = document.querySelectorAll(".active-menu");
  if (_elementCollection) {
    _elementCollection.forEach((ele) => {
      ele.classList.remove("active-menu");
    });
  }
};

const registerActive = async (element: Element) => {
  if (element) {
    element.classList.add("active-menu");
  }
};
const handleClickMenu = async (item) => {
  unRegisterActive();
  //@ts-ignore
  registerActive(event.currentTarget);
  activePath.value = item.path;
  clickMenuChildren.value = item.children;
  clickMenuChildrenTitle.value = item.meta.i18nKey ? transformI18n(item.meta.i18nKey) : item.meta.title;
  showMenuChildren.value = true;
};

defineExpose({ triggerClose, triggerOpen });
</script>

<style lang="scss" scoped>
.lay-menu-body {
  --lay-menu-parent-width: 240px;
  --lay-menu-children-min-width: 750px;
  --lay-menu-children-max-width: 980px;
  position: fixed;
  width: 100%;
  height: 100%;
  left: 0;
  display: flex;
  top: var(--navbar-height);
  z-index: 930;
  font-family:
    "Inter",
    -apple-system,
    BlinkMacSystemFont,
    "Segoe UI",
    Roboto,
    sans-serif;

  .lay-menu-parent {
    z-index: 930;
    border-right: 1px solid var(--cb-color-border-light);
    height: 100%;
    width: calc(var(--lay-menu-parent-width));
    background-color: var(--cb-color-bg-secondary);
    box-shadow: 0 4px 20px var(--cb-color-shadow-light);
    transform: translateX(0px);
    overflow: hidden;
    transition:
      transform 300ms cubic-bezier(0.34, 1.56, 0.64, 1),
      left 200ms cubic-bezier(0.34, 1.56, 0.64, 1);
    left: 0px;
    backdrop-filter: blur(8px);

    .lay-menu-parent-item {
      display: flex;
      height: 100%;
      flex-direction: column;

      .menu-title {
        position: fixed;
        top: 0px;
        bottom: 0px;
        font-size: 12px;
        z-index: 931;
        width: 240px;
        box-shadow: 0 4px 20px var(--cb-color-shadow-lighter);
        left: 0px;
        transform: translateX(0px);
        overflow: hidden;
        background-color: var(--cb-color-bg-secondary);

        .item.active {
          background-color: var(--cb-color-bg-active);
          border-left: 3px solid var(--cb-color-border-brand);
          font-weight: 600;
        }

        .item2 {
          overflow: hidden;
          transition: all 300ms cubic-bezier(0.34, 1.56, 0.64, 1);
          height: auto;
          flex: 1 1 0%;
          background-color: var(--cb-color-button-menu-bg, transparent);
          padding-top: 8px;
          padding-bottom: 8px;

          .span2 {
            padding: 12px 0 12px 32px;
            transition: all 300ms cubic-bezier(0.34, 1.56, 0.64, 1);
            overflow-y: auto;
            max-height: calc(100vh - 200px);
            scrollbar-width: none; /* Firefox */
            -ms-overflow-style: none; /* IE and Edge */

            &::-webkit-scrollbar {
              display: none; /* Chrome, Safari, Opera */
            }

            .menu {
              display: flex;
              padding: 0 12px;
              gap: 10px;
              width: 100%;
              max-width: 100%;
              cursor: pointer;
              text-align: left;
              overflow: hidden;
              text-overflow: ellipsis;
              white-space: nowrap;
              color: var(--cb-color-text-primary);
              background-color: transparent;
              border-color: transparent;
              height: 40px;
              line-height: 40px;
              border-radius: 8px;
              margin-bottom: 6px;
              transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
              position: relative;
              border: none;
              outline: none;

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

              &:hover {
                background-color: var(--cb-color-bg-hover);
                transform: translateX(3px);

                &::before {
                  opacity: 1;
                  background: linear-gradient(to right, var(--cb-color-gradient-brand-start), transparent);
                }
              }

              .text {
                flex: 1 1 0%;
                overflow: hidden;
                gap: 10px;
                text-overflow: ellipsis;
                white-space: nowrap;
                font-size: 14px;
                letter-spacing: 0.3px;
              }

              .icon {
                display: flex;
                align-items: center;
                justify-content: center;
                transition: transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
                width: 24px;
                height: 24px;
                border-radius: 6px;
              }

              &:hover .icon {
                transform: scale(1.15) rotate(5deg);
                color: var(--cb-color-text-brand);
              }
            }

            .menu.active,
            .menu.active-menu {
              color: var(--cb-color-text-brand);
              background-color: var(--cb-color-bg-active-brand);
              font-weight: 500;
              transform: translateX(3px);
              box-shadow: 0 4px 12px var(--cb-color-shadow-brand-light);

              .icon {
                color: var(--cb-color-text-brand);
                background-color: var(--cb-color-bg-brand-light);
              }

              &::before {
                opacity: 1;
                background: linear-gradient(to right, var(--cb-color-gradient-brand-start), transparent);
              }
            }
          }
        }

        .item {
          border-top: 1px solid var(--cb-color-border-light);
          border-bottom: 1px solid var(--cb-color-border-light);
          padding: 0px 16px;
          height: 56px;
          line-height: 56px;
          display: block;
          width: 100%;
          max-width: 100%;
          cursor: pointer;
          text-align: left;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
          color: var(--cb-color-text-primary);
          background-color: var(--cb-color-button-menu-bg, transparent);
          transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
          position: relative;

          &::before {
            content: "";
            position: absolute;
            left: 0;
            top: 0;
            height: 100%;
            width: 3px;
            background: var(--cb-color-border-brand);
            opacity: 0;
            transition: opacity 0.3s ease;
          }

          &:hover {
            background-color: var(--cb-color-bg-hover);

            &::before {
              opacity: 0.5;
            }
          }

          .span {
            display: flex;
            align-items: center;
            height: 100%;

            .icon {
              display: inline-flex;
              margin: 0px 12px 0px 8px;
              min-width: 16px;
              text-align: left;
              transition: transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
              color: var(--cb-color-text-primary);
            }

            &:hover .icon {
              transform: scale(1.15) rotate(5deg);
              color: var(--cb-color-text-brand);
            }

            .text {
              flex: 1 1 0%;
              overflow: hidden;
              gap: 10px;
              text-overflow: ellipsis;
              white-space: nowrap;
              font-size: 14px;
              font-weight: 500;
              letter-spacing: 0.3px;
            }

            .action {
              display: inline-flex;
              margin: 0px 8px;
              min-width: 16px;
              text-align: left;

              .arrow-icon {
                transition: transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
                color: var(--cb-color-text-secondary);
              }

              .rotate-icon {
                transform: rotate(180deg);
                color: var(--cb-color-text-brand);
              }
            }
          }
        }
      }
    }
  }

  .lay-menu-children {
    z-index: 931;
    padding: 20px;
    border-top-right-radius: 16px;
    border-bottom-right-radius: 16px;
    height: 100%;
    min-width: calc(var(--lay-menu-children-min-width));
    max-width: calc(var(--lay-menu-children-max-width));
    border-top: 1px solid var(--cb-color-border-light);
    border-right: 1px solid var(--cb-color-border-light);
    background-color: var(--cb-color-bg-primary);
    transform: translateX(0px);
    font-size: 14px;
    box-shadow: 4px 0 20px var(--cb-color-shadow-light);
    transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
    animation: slideIn 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
    backdrop-filter: blur(8px);
    overflow-y: auto;
    scrollbar-width: none; /* Firefox */
    -ms-overflow-style: none; /* IE and Edge */

    &::-webkit-scrollbar {
      display: none; /* Chrome, Safari, Opera */
    }
  }
}

@keyframes slideIn {
  from {
    opacity: 0;
    transform: translateX(-30px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}

/* 添加淡入淡出效果 */
@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

/* 暗黑模式适配 */
.dark {
  .lay-menu-parent {
    box-shadow: 0 4px 20px var(--cb-color-shadow-dark);
    background-color: var(--cb-color-bg-secondary-dark);
  }

  .menu-title {
    background-color: var(--cb-color-bg-secondary-dark) !important;
  }

  .item.active {
    background-color: var(--cb-color-bg-active-dark) !important;
  }

  .menu.active,
  .menu.active-menu {
    background-color: var(--cb-color-bg-active-brand-dark) !important;
    box-shadow: 0 4px 12px var(--cb-color-shadow-dark) !important;
  }

  .lay-menu-children {
    background-color: var(--cb-color-bg-primary-dark);
    box-shadow: 4px 0 20px var(--cb-color-shadow-dark);
  }
}

/* 隐藏所有滚动条 */
* {
  scrollbar-width: none; /* Firefox */
  -ms-overflow-style: none; /* IE and Edge */

  &::-webkit-scrollbar {
    display: none; /* Chrome, Safari, Opera */
  }
}

/* 添加毛玻璃效果支持 */
@supports (backdrop-filter: blur(8px)) {
  .lay-menu-parent,
  .lay-menu-children {
    background-color: var(--cb-color-bg-blur);
    backdrop-filter: blur(8px);
  }

  .dark .lay-menu-parent,
  .dark .lay-menu-children,
  .dark .menu-title {
    background-color: var(--cb-color-bg-blur-dark) !important;
    backdrop-filter: blur(10px);
  }
}

/* 添加卡片悬浮效果 */
.menu-card-hover {
  transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 6px 16px rgba(0, 0, 0, 0.1);
  }
}

/* 添加按钮点击效果 */
.btn-click-effect {
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