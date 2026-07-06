<template>
  <el-drawer
    v-model="visible"
    title="Theme Config"
    :size="320"
    direction="rtl"
    :close-on-click-modal="true"
    :destroy-on-close="true"
  >
    <div class="theme-config-panel p-t-8px select-none">
        <!-- Theme color -->
        <div class="config-section">
          <div class="section-header">
            <el-icon :size="18" class="section-icon"><Connection /></el-icon>
            <span class="section-title">Theme Color</span>
          </div>
          <div class="theme-colors-grid">
            <div
              v-for="color in themeColors"
              :key="color"
              class="theme-color-item"
              @click="changeThemeColor(color)"
              :class="{ active: globalStore.themeColor === color }"
            >
              <div class="color-preview" :style="{ backgroundColor: color }">
                <div class="color-check" v-if="globalStore.themeColor === color">
                  <el-icon><Check /></el-icon>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Layout style -->
        <div class="config-section">
          <div class="section-header">
            <el-icon :size="18" class="section-icon"><Notification /></el-icon>
            <span class="section-title">Layout Style</span>
          </div>
          <div class="koi-layout-grid">
            <div
              v-for="layoutOption in layoutOptions"
              :key="layoutOption.value"
              :class="['koi-layout-item', { 'is-active': layout === layoutOption.value }]"
              @click="setLayout(layoutOption.value)"
            >
              <div class="koi-layout-preview">
                <div class="koi-block-aside"></div>
                <div class="koi-layout-inner">
                  <div class="koi-block-header"></div>
                  <div class="koi-block-main"></div>
                </div>
              </div>
              <div class="koi-layout-label">{{ layoutOption.label }}</div>
              <div class="koi-layout-check" v-if="layout === layoutOption.value">
                <el-icon><Check /></el-icon>
              </div>
            </div>
          </div>
        </div>

        <!-- Interface config -->
        <div class="config-section">
          <div class="section-header">
            <el-icon :size="18" class="section-icon"><ChatLineRound /></el-icon>
            <span class="section-title">Interface Config</span>
          </div>
          <div class="interface-config">
            <div class="config-item">
              <div class="config-label"><span>Route Animation</span></div>
              <el-select placeholder="Select animation" v-model="transition" clearable class="config-input">
                <el-option label="Default" value="fade-default" />
                <el-option label="Fade" value="fade" />
                <el-option label="Slide" value="fade-slide" />
                <el-option label="Zoom" value="zoom-fade" />
                <el-option label="Bottom" value="fade-bottom" />
                <el-option label="Scale" value="fade-scale" />
              </el-select>
            </div>

            <div class="config-item">
              <div class="config-label">Menu Width</div>
              <el-input-number class="config-input" :min="200" :max="260" :step="2" v-model="menuWidth" />
            </div>

            <div class="config-item">
              <div class="config-label">Tabs Style</div>
              <el-select placeholder="Select style" v-model="tabsStyle" class="config-input">
                <el-option label="Card" value="card" />
                <el-option label="Google" value="google" />
                <el-option label="Plain" value="plain" />
              </el-select>
            </div>

            <div class="config-item">
              <div class="config-label">Unique Opened</div>
              <el-switch active-text="On" inactive-text="Off" :active-value="true" :inactive-value="false" :inline-prompt="true" v-model="uniqueOpened" />
            </div>

            <div class="config-item">
              <div class="config-label">Aside Inverted</div>
              <el-switch active-text="On" inactive-text="Off" :active-value="true" :inactive-value="false" :inline-prompt="true" v-model="asideInverted" />
            </div>

            <div class="config-item">
              <div class="config-label">Header Inverted</div>
              <el-switch active-text="On" inactive-text="Off" :active-value="true" :inactive-value="false" :inline-prompt="true" v-model="headerInverted" />
            </div>

            <div class="config-item">
              <div class="config-label">Grey Mode</div>
              <el-switch active-text="On" inactive-text="Off" :active-value="true" :inactive-value="false" :inline-prompt="true" v-model="isGrey" @change="changeGreyOrWeak('grey', !!$event)" />
            </div>

            <div class="config-item">
              <div class="config-label">Weak Mode</div>
              <el-switch active-text="On" inactive-text="Off" :active-value="true" :inactive-value="false" :inline-prompt="true" v-model="isWeak" @change="changeGreyOrWeak('weak', !!$event)" />
            </div>

            <div class="config-item">
              <div class="config-label">Collapse Menu</div>
              <el-switch v-model="isCollapse" active-text="Expand" inactive-text="Collapse" :active-value="true" :inactive-value="false" :inline-prompt="true" />
            </div>
            <div class="config-item">
              <div class="config-label">Show Breadcrumb</div>
              <el-switch v-model="showBreadcrumb" active-text="Show" inactive-text="Hide" :active-value="true" :inactive-value="false" :inline-prompt="true" />
            </div>
            <div class="config-item">
              <div class="config-label">Show Tabs</div>
              <el-switch v-model="showTabs" active-text="Show" inactive-text="Hide" :active-value="true" :inactive-value="false" :inline-prompt="true" />
            </div>
            <div class="config-item">
              <div class="config-label">Show Footer</div>
              <el-switch v-model="showFooter" active-text="Show" inactive-text="Hide" :active-value="true" :inactive-value="false" :inline-prompt="true" />
            </div>
          </div>
        </div>
      </div>
  </el-drawer>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from "vue";
import { DEFAULT_THEME } from "../../config/index";
import { useTheme } from "../../utils/theme";
import { storeToRefs } from "pinia";
import mittBus from "../../utils/mittBus";
import { emitter } from "@repo/core";
import { useKoiGlobalStore } from "../../stores/global";

const globalStore = useKoiGlobalStore();
const { changeThemeColor, changeGreyOrWeak } = useTheme();

const {
  layout, isCollapse, transition, tabsStyle,
  uniqueOpened, menuWidth, isGrey, isWeak,
  asideInverted, headerInverted,
  showBreadcrumb, showTabs, showFooter
} = storeToRefs(globalStore);

const themeColors = [
  DEFAULT_THEME, "#1E71EE", "#6169FF", "#8076C3",
  "#1BA784", "#316C72", "#FF6B35", "#0099FF",
  "#EF4444", "#8B5CF6", "#EC4899", "#06B6D4"
];

const layoutOptions = [
  { value: "vertical", label: "Vertical" },
  { value: "columns", label: "Columns" },
  { value: "classic", label: "Classic" },
  { value: "optimum", label: "Hybrid" },
  { value: "horizontal", label: "Horizontal" }
];

const visible = ref(false);

onMounted(() => {
  mittBus.on("handleThemeConfig", () => { visible.value = true; });
  emitter.on("openPanel", () => { visible.value = true; });
});
onUnmounted(() => {
  mittBus.off("handleThemeConfig");
  emitter.off("openPanel");
});
const setLayout = (value: string) => globalStore.setGlobalState("layout", value);
</script>

<style lang="scss">
.el-overlay.theme-config-overlay { transition: opacity 0.2s ease !important; }
.el-drawer.theme-config-drawer { transition: transform 0.2s cubic-bezier(0.4, 0, 0.2, 1) !important; }
</style>

<style lang="scss" scoped>
.theme-config-panel { isolation: isolate; contain: layout style; }

.config-section { margin-bottom: 20px; }

.section-header {
  display: flex; align-items: center; padding-bottom: 16px; margin-bottom: 20px;
  .section-icon { margin-right: 12px; font-size: 18px; color: var(--el-color-primary); opacity: 0.9; transition: all 0.3s ease; }
  .section-title { position: relative; font-size: 16px; font-weight: 600; color: var(--el-text-color-primary); letter-spacing: 0.3px;
    &::after {
      position: absolute; bottom: -8px; left: 0; width: 40px; height: 3px; content: "";
      background: linear-gradient(135deg, var(--el-color-primary) 0%, var(--el-color-primary-light-3) 50%, transparent 100%);
      border-radius: 2px; box-shadow: 0 2px 8px rgba(var(--el-color-primary-rgb), 0.3);
    }
  }
  &:hover {
    .section-icon { opacity: 1; transform: scale(1.1); }
    .section-title::after { width: 50px; }
  }
}

.theme-colors-grid {
  display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px;
  .theme-color-item {
    position: relative; display: flex; flex-direction: column; align-items: center;
    padding: 8px 6px; cursor: pointer; border: 2px solid transparent;
    border-radius: 10px; transition: all 0.3s ease; background: var(--el-bg-color);
    &:hover { background-color: var(--el-fill-color-light); transform: translateY(-2px); }
    &.active { background-color: var(--el-color-primary-light-9); border-color: var(--el-color-primary); }
    .color-preview {
      width: 32px; height: 32px; border-radius: 6px;
      box-shadow: 0 3px 8px rgba(0, 0, 0, 0.12); display: flex; align-items: center; justify-content: center;
    }
    .color-check {
      display: flex; align-items: center; justify-content: center;
      width: 16px; height: 16px; background: rgba(255, 255, 255, 0.95);
      border-radius: 50%; color: var(--el-color-primary); font-size: 10px; font-weight: bold;
    }
  }
}

.koi-layout-grid {
  display: grid; grid-template-columns: repeat(2, 1fr); gap: 16px;
  .koi-layout-item {
    position: relative; display: flex; flex-direction: column; align-items: center;
    padding: 12px 8px; cursor: pointer; border: 2px solid transparent;
    border-radius: 12px; background: var(--el-bg-color); transition: all 0.3s ease;
    &:hover { background-color: var(--el-fill-color-light); transform: translateY(-2px); }
    &.is-active { background-color: var(--el-color-primary-light-9); border-color: var(--el-color-primary); }
    .koi-layout-preview {
      width: 80px; height: 60px; margin-bottom: 8px; padding: 6px;
      border-radius: 8px; background: var(--el-fill-color-lighter);
      display: flex; justify-content: space-between;
    }
    .koi-block-aside {
      width: 20%; background: linear-gradient(135deg, var(--el-color-primary), var(--el-color-primary-light-3));
      border-radius: 4px;
    }
    .koi-layout-inner {
      display: flex; flex-direction: column; justify-content: space-between; width: 73%;
    }
    .koi-block-header {
      height: 20%; background: linear-gradient(135deg, var(--el-color-primary-light-5), var(--el-color-primary-light-7));
      border-radius: 4px;
    }
    .koi-block-main {
      height: 69%; background: linear-gradient(135deg, var(--el-color-primary-light-8), var(--el-color-primary-light-9));
      border: 1px dashed var(--el-color-primary-light-5); border-radius: 4px;
    }
    .koi-layout-label { font-size: 14px; font-weight: 500; color: var(--el-text-color-primary); text-align: center; }
    .koi-layout-check {
      position: absolute; top: 6px; right: 6px; width: 18px; height: 18px;
      background: var(--el-color-primary); border-radius: 50%;
      display: flex; align-items: center; justify-content: center; color: white; font-size: 11px;
    }
  }
}

.interface-config {
  .config-item {
    display: flex; align-items: center; justify-content: space-between;
    padding: 12px 0; border-bottom: 1px solid var(--el-border-color-extra-light);
    &:last-child { border-bottom: none; }
    .config-label {
      display: flex; align-items: center; flex: 1; min-width: 0;
      margin-right: 16px; font-size: 14px; color: var(--el-text-color-primary); font-weight: 500; line-height: 1.4;
    }
    .config-input { width: 180px; flex-shrink: 1; }
  }
}
</style>
