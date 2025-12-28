<script setup lang="ts">
/**
 * 新春灯笼主题面包屑 - 深度定制版
 * 特色：灯笼串联效果、如意分隔符、卷轴风格
 */
import { isEqual, useGlobal } from "@pureadmin/utils";
import { transformI18n } from "@repo/config";
import { useRenderIcon } from "@repo/components/ReIcon/src/hooks";
import { useRoute, useRouter } from "vue-router";
import { onBeforeUnmount, onMounted, ref, toRaw, watch } from "vue";
import {
  emitter,
  findRouteByPath,
  getParentPaths,
  useMultiTagsStoreHook,
} from "@repo/core";

const route = useRoute();
const levelList = ref([]);
const router = useRouter();
const routes: any = router.options.routes;
const multiTags: any = useMultiTagsStoreHook().multiTags;

const { $storage } = useGlobal<any>();
const breadcrumbMode = ref(
  $storage?.configure?.breadcrumbIconOnly ? "icon" : "icon-text"
);

emitter.on("breadcrumbModeChange", (value: string) => {
  breadcrumbMode.value = value;
});

onBeforeUnmount(() => {
  emitter.off("breadcrumbModeChange");
});

const getBreadcrumb = (): void => {
  let currentRoute;
  if (Object.keys(route.query).length > 0) {
    multiTags.forEach((item) => {
      if (isEqual(route.query, item?.query)) {
        currentRoute = toRaw(item);
      }
    });
  } else if (Object.keys(route.params).length > 0) {
    multiTags.forEach((item) => {
      if (isEqual(route.params, item?.params)) {
        currentRoute = toRaw(item);
      }
    });
  } else {
    currentRoute = findRouteByPath(router.currentRoute.value.path, routes);
  }

  const parentRoutes = getParentPaths(
    router.currentRoute.value.name as string,
    routes,
    "name"
  );
  const matched = [];
  parentRoutes.forEach((path) => {
    if (path !== "/") matched.push(findRouteByPath(path, routes));
  });
  matched.push(currentRoute);
  matched.forEach((item, index) => {
    if (currentRoute?.query || currentRoute?.params) return;
    if (item?.children) {
      item.children.forEach((v) => {
        if (v?.meta?.title === item?.meta?.title) {
          matched.splice(index, 1);
        }
      });
    }
  });
  levelList.value = matched.filter(
    (item) => item?.meta && item?.meta.title !== false
  );
};

const handleLink = (item) => {
  const { redirect, name, path } = item;
  if (redirect) {
    router.push(redirect as any);
  } else {
    if (name) {
      if (item.query) {
        router.push({ name, query: item.query });
      } else if (item.params) {
        router.push({ name, params: item.params });
      } else {
        router.push({ name });
      }
    } else {
      router.push({ path });
    }
  }
};

const goHome = () => {
  router.push("/");
};

onMounted(() => {
  getBreadcrumb();
});

watch(() => route.path, () => {
  getBreadcrumb();
});
</script>

<template>
  <div class="lunar-breadcrumb">
    <!-- 卷轴左边 -->
    <div class="scroll-end left">
      <div class="scroll-rod"></div>
    </div>
    
    <!-- 卷轴主体 -->
    <div class="scroll-body">
      <!-- 首页灯笼 -->
      <div class="home-lantern" @click="goHome">
        <div class="lantern-cap"></div>
        <div class="lantern-body">
          <IconifyIconOnline icon="ri:home-5-line" />
        </div>
        <div class="lantern-tassel"></div>
      </div>
      
      <!-- 串联红绳 -->
      <div class="connect-rope" v-if="levelList.length > 0">
        <svg viewBox="0 0 30 20" width="30" height="20">
          <path d="M0,10 Q15,5 30,10" stroke="#CD853F" stroke-width="2" fill="none" />
        </svg>
      </div>
      
      <!-- 面包屑灯笼 -->
      <div class="breadcrumb-items">
        <template v-for="(item, index) in levelList" :key="item.path">
          <!-- 如意分隔符 -->
          <div v-if="index > 0" class="ruyi-separator">
            <svg viewBox="0 0 24 24" width="20" height="20">
              <path 
                d="M4,12 Q8,8 12,12 Q16,16 20,12" 
                stroke="#FFD700" 
                stroke-width="2" 
                fill="none"
                stroke-linecap="round"
              />
              <circle cx="12" cy="12" r="3" fill="#FFD700" />
            </svg>
          </div>
          
          <!-- 灯笼项 -->
          <el-tooltip
            :content="transformI18n(item.meta.i18nKey || item.meta.title)"
            placement="bottom"
            :show-after="500"
          >
            <div 
              :class="['item-lantern', { 'is-current': index === levelList.length - 1 }]"
              @click="handleLink(item)"
            >
              <div class="lantern-cap"></div>
              <div class="lantern-body">
                <el-icon v-if="item.meta.icon" class="item-icon">
                  <component :is="useRenderIcon(item.meta.icon)" />
                </el-icon>
                <span v-if="breadcrumbMode === 'icon-text'" class="item-text">
                  {{ transformI18n(item.meta.i18nKey || item.meta.title) }}
                </span>
              </div>
              <div class="lantern-tassel"></div>
            </div>
          </el-tooltip>
        </template>
      </div>
    </div>
    
    <!-- 卷轴右边 -->
    <div class="scroll-end right">
      <div class="scroll-rod"></div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.lunar-breadcrumb {
  display: flex;
  align-items: center;
  height: 48px;
  padding: 0 4px;
  gap: 0;
  
  // 卷轴两端
  .scroll-end {
    width: 12px;
    height: 36px;
    background: linear-gradient(180deg, #8B4513, #A0522D, #8B4513);
    border-radius: 3px;
    position: relative;
    box-shadow: 
      inset 0 2px 4px rgba(255, 255, 255, 0.2),
      0 2px 4px rgba(0, 0, 0, 0.3);
    
    .scroll-rod {
      position: absolute;
      top: -4px;
      bottom: -4px;
      left: 50%;
      transform: translateX(-50%);
      width: 6px;
      background: linear-gradient(90deg, #DAA520, #FFD700, #DAA520);
      border-radius: 3px;
      box-shadow: 0 0 4px rgba(255, 215, 0, 0.5);
    }
    
    &.left {
      border-radius: 3px 0 0 3px;
    }
    
    &.right {
      border-radius: 0 3px 3px 0;
    }
  }
  
  // 卷轴主体
  .scroll-body {
    display: flex;
    align-items: center;
    background: linear-gradient(180deg, 
      rgba(255, 248, 220, 0.95) 0%,
      rgba(255, 250, 240, 0.98) 50%,
      rgba(255, 248, 220, 0.95) 100%
    );
    border-top: 2px solid rgba(139, 69, 19, 0.4);
    border-bottom: 2px solid rgba(139, 69, 19, 0.4);
    padding: 4px 12px;
    min-height: 36px;
    gap: 4px;
    position: relative;
    
    // 卷轴纹理
    &::before {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: repeating-linear-gradient(
        0deg,
        transparent 0px,
        transparent 4px,
        rgba(139, 69, 19, 0.03) 4px,
        rgba(139, 69, 19, 0.03) 5px
      );
      pointer-events: none;
    }
  }
  
  // 首页灯笼
  .home-lantern {
    display: flex;
    flex-direction: column;
    align-items: center;
    cursor: pointer;
    transition: all 0.3s;
    animation: lantern-idle 3s ease-in-out infinite;
    
    &:hover {
      animation: lantern-swing 0.5s ease-in-out infinite;
      
      .lantern-body {
        box-shadow: 
          0 0 15px rgba(255, 69, 0, 0.8),
          inset 0 0 10px rgba(255, 200, 100, 0.5);
      }
    }
    
    .lantern-cap {
      width: 20px;
      height: 5px;
      background: linear-gradient(180deg, #FFD700, #DAA520);
      border-radius: 2px 2px 0 0;
    }
    
    .lantern-body {
      width: 28px;
      height: 28px;
      background: linear-gradient(180deg, 
        #FF4500 0%, 
        #DC143C 30%, 
        #B22222 70%, 
        #8B0000 100%
      );
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      color: #FFD700;
      font-size: 14px;
      box-shadow: 
        0 0 10px rgba(255, 69, 0, 0.6),
        inset 0 0 8px rgba(255, 200, 100, 0.3);
      transition: all 0.3s;
    }
    
    .lantern-tassel {
      width: 2px;
      height: 8px;
      background: linear-gradient(180deg, #DAA520, #FF6347);
      position: relative;
      
      &::after {
        content: '';
        position: absolute;
        bottom: 0;
        left: 50%;
        transform: translateX(-50%);
        width: 6px;
        height: 6px;
        background: #FFD700;
        border-radius: 0 0 3px 3px;
      }
    }
  }
  
  // 串联红绳
  .connect-rope {
    display: flex;
    align-items: center;
    margin: 0 -2px;
  }
  
  // 面包屑项容器
  .breadcrumb-items {
    display: flex;
    align-items: center;
    gap: 4px;
  }
  
  // 如意分隔符
  .ruyi-separator {
    display: flex;
    align-items: center;
    color: #FFD700;
    opacity: 0.8;
    
    svg {
      filter: drop-shadow(0 0 2px rgba(255, 215, 0, 0.5));
    }
  }
  
  // 项目灯笼
  .item-lantern {
    display: flex;
    flex-direction: column;
    align-items: center;
    cursor: pointer;
    transition: all 0.3s;
    animation: lantern-idle 3s ease-in-out infinite;
    
    &:hover {
      animation: lantern-swing 0.5s ease-in-out infinite;
      
      .lantern-body {
        box-shadow: 
          0 0 15px rgba(255, 69, 0, 0.8),
          inset 0 0 10px rgba(255, 200, 100, 0.5);
      }
    }
    
    .lantern-cap {
      width: 100%;
      max-width: 80px;
      min-width: 40px;
      height: 4px;
      background: linear-gradient(180deg, #FFD700, #DAA520);
      border-radius: 2px 2px 0 0;
    }
    
    .lantern-body {
      min-width: 40px;
      max-width: 100px;
      padding: 4px 10px;
      background: linear-gradient(180deg, 
        #FF6347 0%, 
        #DC143C 30%, 
        #C41E3A 70%, 
        #A52A2A 100%
      );
      border-radius: 12px;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 4px;
      box-shadow: 
        0 0 8px rgba(255, 69, 0, 0.5),
        inset 0 0 6px rgba(255, 200, 100, 0.2);
      transition: all 0.3s;
      
      .item-icon {
        font-size: 14px;
        color: #FFD700;
      }
      
      .item-text {
        font-size: 12px;
        color: #FFD700;
        font-weight: 500;
        white-space: nowrap;
        max-width: 60px;
        overflow: hidden;
        text-overflow: ellipsis;
        font-family: 'STKaiti', 'KaiTi', serif;
        text-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);
      }
    }
    
    .lantern-tassel {
      width: 2px;
      height: 6px;
      background: linear-gradient(180deg, #DAA520, #FF6347);
      
      &::after {
        content: '';
        display: block;
        width: 5px;
        height: 5px;
        background: #FFD700;
        border-radius: 0 0 2px 2px;
        margin-left: -1.5px;
      }
    }
    
    // 当前项特殊样式
    &.is-current {
      cursor: default;
      pointer-events: none;
      
      .lantern-body {
        background: linear-gradient(180deg, 
          #FFD700 0%, 
          #FFA500 30%, 
          #FF8C00 70%, 
          #FF7F50 100%
        );
        box-shadow: 
          0 0 15px rgba(255, 215, 0, 0.8),
          inset 0 0 10px rgba(255, 255, 255, 0.4);
        
        .item-icon {
          color: #8B0000;
        }
        
        .item-text {
          color: #8B0000;
          font-weight: 700;
        }
      }
      
      .lantern-cap {
        background: linear-gradient(180deg, #8B0000, #A52A2A);
      }
    }
  }
}

// 动画
@keyframes lantern-idle {
  0%, 100% { transform: rotate(-1deg); }
  50% { transform: rotate(1deg); }
}

@keyframes lantern-swing {
  0%, 100% { transform: rotate(-5deg); }
  50% { transform: rotate(5deg); }
}

// 深色模式
html.dark .lunar-breadcrumb {
  .scroll-body {
    background: linear-gradient(180deg, 
      rgba(60, 40, 20, 0.95) 0%,
      rgba(80, 50, 30, 0.98) 50%,
      rgba(60, 40, 20, 0.95) 100%
    );
  }
}
</style>
