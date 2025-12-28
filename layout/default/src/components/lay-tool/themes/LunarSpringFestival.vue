<script setup lang="ts">
/**
 * 新春灯笼主题工具栏 - 深度定制版
 * 特色：灯笼图标容器、红色装饰、灯笼摇摆动画
 */
import { useNav } from "../../../hooks/useNav";
import { useTranslationLang } from "../../../hooks/useTranslationLang";
import LaySearch from "../../lay-search/index.vue";
import LayMessage from "../../lay-message/index.vue";
import LaySidebarFullScreen from "../../lay-sidebar/components/SidebarFullScreen.vue";
import LangDropdown from "../dropdowns/LangDropdown.vue";
import UserDropdown from "../dropdowns/UserDropdown.vue";
import Setting from "@iconify-icons/ri/settings-3-line";
import { getConfig } from "@repo/config";
import { emitter } from "@repo/core";
import { ref, onBeforeUnmount, computed } from "vue";
import { useGlobal } from "@pureadmin/utils";

const { $storage } = useGlobal<GlobalPropertiesApi>();
const { onPanel } = useNav();
const { t } = useTranslationLang();

const storageTheme = computed(() => $storage?.configure?.systemTheme || 'default');
const currentTheme = ref<string>(storageTheme.value);

const handleThemeChange = (themeKey: string) => {
  currentTheme.value = themeKey;
};

emitter.on("systemThemeChange", handleThemeChange);

const showSearch = ref($storage.configure?.showSearch ?? getConfig().ShowBarSearch ?? true);
const showFullscreen = ref($storage.configure?.showFullscreen ?? true);

emitter.on("showSearchChange", (val: boolean) => {
  showSearch.value = val;
});
emitter.on("showFullscreenChange", (val: boolean) => {
  showFullscreen.value = val;
});

onBeforeUnmount(() => {
  emitter.off("showSearchChange");
  emitter.off("showFullscreenChange");
  emitter.off("systemThemeChange", handleThemeChange);
});
</script>

<template>
  <div class="lunar-tool-bar">
    <!-- 红绳装饰 -->
    <div class="rope-decoration">
      <svg viewBox="0 0 200 20" width="100%" height="20">
        <path 
          d="M0,10 Q25,5 50,10 Q75,15 100,10 Q125,5 150,10 Q175,15 200,10" 
          stroke="#CD853F" 
          stroke-width="3" 
          fill="none"
          stroke-linecap="round"
        />
        <!-- 结点装饰 -->
        <circle cx="50" cy="10" r="4" fill="#FFD700" />
        <circle cx="100" cy="10" r="4" fill="#FFD700" />
        <circle cx="150" cy="10" r="4" fill="#FFD700" />
      </svg>
    </div>
    
    <!-- 工具项容器 -->
    <div class="tools-container">
      <!-- 搜索 - 灯笼样式 -->
      <div v-if="showSearch" class="lantern-tool-item">
        <div class="lantern-hook"></div>
        <div class="lantern-body">
          <LaySearch id="header-search" class="tool-icon" />
        </div>
        <div class="lantern-tassel"></div>
      </div>

      <!-- 全屏 - 灯笼样式 -->
      <div v-if="showFullscreen" class="lantern-tool-item">
        <div class="lantern-hook"></div>
        <div class="lantern-body">
          <LaySidebarFullScreen id="full-screen" class="tool-icon" />
        </div>
        <div class="lantern-tassel"></div>
      </div>

      <!-- 消息 - 灯笼样式 -->
      <div class="lantern-tool-item">
        <div class="lantern-hook"></div>
        <div class="lantern-body">
          <LayMessage v-menu="['MessageCenter']" id="header-message" class="tool-icon" />
        </div>
        <div class="lantern-tassel"></div>
      </div>

      <!-- 语言切换 -->
      <LangDropdown v-if="getConfig().ShowLanguage" class="lang-item" />

      <!-- 用户头像 -->
      <UserDropdown class="user-item" />

      <!-- 设置 - 福字灯笼 -->
      <div 
        v-if="getConfig().ShowBarSetting"
        class="fu-lantern-setting"
        :title="t('buttons.pureOpenSystemSet')"
        @click="onPanel"
      >
        <div class="lantern-hook"></div>
        <div class="fu-body">
          <span class="fu-char">福</span>
        </div>
        <div class="fu-tassel">
          <div class="tassel-knot"></div>
          <div class="tassel-fringe"></div>
        </div>
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.lunar-tool-bar {
  display: flex;
  flex-direction: column;
  align-items: center;
  height: 48px;
  padding: 0 8px;
  position: relative;
  
  // 红绳装饰
  .rope-decoration {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 8px;
    opacity: 0.6;
    pointer-events: none;
  }
  
  .tools-container {
    display: flex;
    align-items: center;
    gap: 8px;
    height: 100%;
    padding-top: 4px;
  }
}

// 灯笼工具项
.lantern-tool-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  animation: lantern-idle 4s ease-in-out infinite;
  cursor: pointer;
  
  &:hover {
    animation: lantern-swing 0.6s ease-in-out infinite;
    
    .lantern-body {
      box-shadow: 
        0 0 15px rgba(255, 69, 0, 0.7),
        inset 0 0 10px rgba(255, 200, 100, 0.4);
    }
  }
  
  .lantern-hook {
    width: 2px;
    height: 4px;
    background: linear-gradient(180deg, #8B4513, #CD853F);
    border-radius: 1px;
  }
  
  .lantern-body {
    width: 36px;
    height: 36px;
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
    box-shadow: 
      0 0 10px rgba(255, 69, 0, 0.5),
      inset 0 0 8px rgba(255, 200, 100, 0.2);
    position: relative;
    transition: all 0.3s;
    
    // 灯笼横条
    &::before,
    &::after {
      content: '';
      position: absolute;
      left: 4px;
      right: 4px;
      height: 1px;
      background: rgba(255, 215, 0, 0.3);
    }
    &::before { top: 30%; }
    &::after { bottom: 30%; }
    
    .tool-icon {
      color: #FFD700 !important;
      font-size: 16px;
      
      :deep(svg) {
        color: #FFD700 !important;
      }
      
      :deep(.el-icon) {
        color: #FFD700 !important;
      }
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
      height: 4px;
      background: #FFD700;
      border-radius: 0 0 2px 2px;
      margin-left: -1.5px;
      margin-top: 1px;
    }
  }
}

// 福字灯笼设置按钮
.fu-lantern-setting {
  display: flex;
  flex-direction: column;
  align-items: center;
  cursor: pointer;
  animation: lantern-idle 3s ease-in-out infinite;
  margin-left: 4px;
  
  &:hover {
    animation: lantern-swing 0.5s ease-in-out infinite;
    
    .fu-body {
      box-shadow: 
        0 0 20px rgba(255, 215, 0, 0.8),
        inset 0 0 15px rgba(255, 200, 100, 0.5);
      
      .fu-char {
        text-shadow: 
          0 0 10px rgba(255, 215, 0, 1),
          0 0 20px rgba(255, 215, 0, 0.8);
      }
    }
  }
  
  .lantern-hook {
    width: 2px;
    height: 4px;
    background: linear-gradient(180deg, #8B4513, #CD853F);
  }
  
  .fu-body {
    width: 38px;
    height: 38px;
    background: linear-gradient(180deg, 
      #FFD700 0%, 
      #FFA500 30%, 
      #FF8C00 70%, 
      #FF7F50 100%
    );
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    box-shadow: 
      0 0 15px rgba(255, 215, 0, 0.6),
      inset 0 0 10px rgba(255, 255, 255, 0.3);
    border: 2px solid #DC143C;
    transition: all 0.3s;
    
    .fu-char {
      font-size: 20px;
      font-weight: 900;
      color: #8B0000;
      font-family: 'STKaiti', 'KaiTi', serif;
      text-shadow: 0 1px 2px rgba(255, 255, 255, 0.5);
      transition: all 0.3s;
    }
  }
  
  .fu-tassel {
    display: flex;
    flex-direction: column;
    align-items: center;
    
    .tassel-knot {
      width: 6px;
      height: 6px;
      background: linear-gradient(180deg, #DC143C, #8B0000);
      border-radius: 50%;
      margin-top: 2px;
    }
    
    .tassel-fringe {
      width: 2px;
      height: 8px;
      background: linear-gradient(180deg, #DC143C, #FF6347);
      border-radius: 0 0 1px 1px;
      position: relative;
      
      &::before,
      &::after {
        content: '';
        position: absolute;
        top: 0;
        width: 2px;
        height: 6px;
        background: linear-gradient(180deg, #DC143C, #FF6347);
        border-radius: 0 0 1px 1px;
      }
      &::before { left: -4px; }
      &::after { right: -4px; }
    }
  }
}

// 语言和用户项的灯笼化处理
.lang-item,
.user-item {
  :deep(.el-dropdown) {
    .el-dropdown__popper {
      border: 2px solid rgba(255, 215, 0, 0.3);
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
html.dark .lunar-tool-bar {
  .lantern-tool-item .lantern-body {
    background: linear-gradient(180deg, 
      #CC3700 0%, 
      #B22222 30%, 
      #8B0000 70%, 
      #5C0000 100%
    );
  }
  
  .fu-lantern-setting .fu-body {
    background: linear-gradient(180deg, 
      #DAA520 0%, 
      #CD853F 30%, 
      #B8860B 70%, 
      #8B6914 100%
    );
  }
}
</style>
