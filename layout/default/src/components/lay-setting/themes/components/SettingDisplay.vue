<script setup lang="ts">
import { useI18n } from "vue-i18n";
import { storeToRefs } from "pinia";
import Segmented, {
  type OptionsType,
} from "@repo/components/ReSegmented/index";
import ScSelect from "@repo/components/ScSelect/index.vue";
import { ScSwitch } from "@repo/components/ScSwitch"
import { ScTooltip } from "@repo/components/ScTooltip";
import { useThemeStore } from "../../../../stores/themeStore";

const { t } = useI18n();

// 直接使用 themeStore，避免通过 prop 传入 boolean 导致响应性断链
const themeStore = useThemeStore();
const {
  fpsMonitorEnabled,
  memoryMonitorEnabled,
  cpuMonitorEnabled,
  bandwidthMonitorEnabled,
  batteryMonitorEnabled,
  bluetoothMonitorEnabled,
  screenMonitorEnabled,
  performanceMonitorPosition,
  performanceMonitorMode,
  performanceMonitorLayout,
  performanceMonitorDirection,
  isPerformanceMonitorVisible,
} = storeToRefs(themeStore);

// ---- Props 定义 ----
const props = defineProps<{
  /** reactive 设置对象引用，子组件可直接修改 */
  settings: Record<string, any>;
  logoVal: boolean;
  cardBodyVal: boolean;
  cardColorMode: string;
  cardColorOptions: Array<OptionsType>;
  logoChange: (val?: boolean) => void;
  cardBodyChange: (val?: boolean) => void;
  onCardColorModeChange: (val: { option: OptionsType }) => void;
  greyChange: (value: boolean) => void;
  weekChange: (value: boolean) => void;
  invertChange: (value: boolean) => void;
  monochromeChange: (value: boolean) => void;
  showBreadcrumbChange: () => void;
  breadcrumbModeChange: () => void;
  showTagIconChange: () => void;
  hideFooterChange: () => void;
  keepAliveChange: () => void;
  tagsChange: () => void;
  multiTagsCacheChange: () => void;
}>();
</script>

<template>
  <!-- 界面显示设置区域 -->
  <div class="setting-section">
    <div class="section-header">
      <IconifyIconOnline icon="ri:eye-line" class="section-icon" />
      <h3 class="section-title">{{ t("panel.pureInterfaceDisplay") }}</h3>
      <div class="section-description">自定义界面显示效果和功能开关</div>
    </div>
    <div class="setting-content">
      <!-- 视觉效果设置 -->
      <div class="setting-group">
        <h4 class="group-title">
          <IconifyIconOnline icon="ri:palette-line" class="group-icon" />
          视觉效果
        </h4>
        <div class="switch-card-grid">
          <ScSwitch
            v-model="settings.greyVal"
            layout="visual-card"
            size="small"
            :label="t('panel.pureGreyModel')"
            description="降低色彩饱和度"
            active-icon="ri:contrast-2-line"
            @change="greyChange"
          />
          <ScSwitch
            v-model="settings.weakVal"
            layout="visual-card"
            size="small"
            :label="t('panel.pureWeakModel')"
            description="优化色彩对比度"
            active-icon="ri:eye-line"
            @change="weekChange"
          />
          <ScSwitch
            v-model="settings.invertVal"
            layout="visual-card"
            size="small"
            label="反色模式"
            description="反转页面颜色"
            active-icon="ri:contrast-drop-line"
            @change="invertChange"
          />
          <ScSwitch
            v-model="settings.monochromeVal"
            layout="visual-card"
            size="small"
            label="黑白模式"
            description="显示黑白界面"
            active-icon="ri:drop-line"
            @change="monochromeChange"
          />
        </div>
      </div>

      <!-- 界面元素设置 -->
      <div class="setting-group">
        <h4 class="group-title">
          <IconifyIconOnline icon="ri:layout-4-line" class="group-icon" />
          界面元素
        </h4>
        <div class="switch-card-grid">
          <ScSwitch
            :model-value="logoVal"
            layout="visual-card"
            size="small"
            label="显示Logo"
            description="侧边栏显示Logo"
            active-icon="ri:image-line"
            ribbon-color="var(--el-color-success)"
            @change="logoChange"
          />
          <ScSwitch
            v-model="settings.tabsVal"
            layout="visual-card"
            size="small"
            :label="t('panel.pureHiddenTags')"
            description="隐藏后不显示标签页"
            active-icon="ri:eye-off-line"
            inactive-icon="ri:bookmark-line"
            ribbon-text="隐藏"
            ribbon-color="var(--el-color-warning)"
            @change="tagsChange"
          />
          <ScSwitch
            v-if="!settings.tabsVal"
            v-model="settings.showTagIcon"
            layout="visual-card"
            size="small"
            label="标签页图标"
            description="在标签页显示菜单图标"
            active-icon="ri:apps-line"
            inactive-icon="ri:text"
            ribbon-color="var(--el-color-success)"
            @change="showTagIconChange"
          />
          <ScSwitch
            v-model="settings.hideFooter"
            layout="visual-card"
            size="small"
            :label="t('panel.pureHiddenFooter')"
            description="隐藏底部页脚区域"
            active-icon="ri:eye-off-line"
            inactive-icon="ri:layout-bottom-line"
            ribbon-text="隐藏"
            ribbon-color="var(--el-color-warning)"
            @change="hideFooterChange"
          />
          <ScSwitch
            :model-value="cardBodyVal"
            layout="visual-card"
            size="small"
            label="内容卡片"
            description="卡片样式背景"
            active-icon="ri:layout-masonry-line"
            ribbon-color="var(--el-color-success)"
            @change="cardBodyChange"
          />
          <ScSwitch
            v-model="settings.showBreadcrumb"
            layout="visual-card"
            size="small"
            label="面包屑导航"
            description="显示页面路径导航"
            active-icon="ri:navigation-line"
            ribbon-color="var(--el-color-success)"
            @change="showBreadcrumbChange"
          />
          <ScSwitch
            v-if="settings.showBreadcrumb"
            v-model="settings.breadcrumbIconOnly"
            layout="visual-card"
            size="small"
            label="仅显示图标"
            description="关闭后显示图标+文字"
            active-icon="ri:layout-grid-line"
            inactive-icon="ri:text"
            ribbon-text="简洁"
            ribbon-color="var(--el-color-primary)"
            @change="breadcrumbModeChange"
          />
        </div>
      </div>

      <!-- 功能设置 -->
      <div class="setting-group">
        <h4 class="group-title">
          <IconifyIconOnline icon="ri:settings-3-line" class="group-icon" />
          功能设置
        </h4>
        <div class="switch-card-grid">
          <ScSwitch
            v-model="settings.multiTagsCache"
            layout="visual-card"
            size="small"
            :label="t('panel.pureMultiTagsCache')"
            description="持久化保存已打开的标签页"
            active-icon="ri:save-line"
            ribbon-color="var(--el-color-warning)"
            @change="multiTagsCacheChange"
          />
        </div>

        <!-- 性能监控（仅在开发/测试环境或 SA 账号显示） -->
        <div v-if="isPerformanceMonitorVisible" class="setting-group">
          <h4 class="group-title">
            <IconifyIconOnline icon="ri:settings-3-line" class="group-icon" />
            {{ t("search.performanceMonitor") }}
          </h4>
          <div class="setting-item-content">
            <div class="switch-card-grid">
              <ScTooltip
                content="Frames Per Second: 衡量页面流畅度，60FPS 为最佳"
                placement="top"
                :append-to-body="true"
                :z-index="3000"
              >
                <ScSwitch
                  :model-value="fpsMonitorEnabled"
                  layout="visual-card"
                  size="small"
                  :label="t('search.performanceMonitor')"
                  :description="t('search.showFps')"
                  active-icon="ri:pulse-line"
                  ribbon-color="var(--el-color-danger)"
                  @change="themeStore.setFpsMonitor"
                />
              </ScTooltip>

              <ScTooltip
                v-if="fpsMonitorEnabled"
                content="JS Heap Size: 当前页面使用的 JS 堆内存 (仅 Chrome/Edge 有效)"
                placement="top"
                :append-to-body="true"
                :z-index="3000"
              >
                <ScSwitch
                  :model-value="memoryMonitorEnabled"
                  layout="visual-card"
                  size="small"
                  :label="t('search.showMemory')"
                  description="显示内存使用情况"
                  active-icon="ri:cpu-line"
                  ribbon-color="var(--el-color-primary)"
                  @change="themeStore.setMemoryMonitor"
                />
              </ScTooltip>

              <ScTooltip
                v-if="fpsMonitorEnabled"
                content="CPU Load Estimation: 基于主线程帧间隔估算的负载值 (非系统真实 CPU)"
                placement="top"
                :append-to-body="true"
                :z-index="3000"
              >
                <ScSwitch
                  :model-value="cpuMonitorEnabled"
                  layout="visual-card"
                  size="small"
                  label="CPU 监控"
                  description="显示主线程负载 (模拟)"
                  active-icon="ri:speed-up-line"
                  ribbon-color="var(--el-color-warning)"
                  @change="themeStore.setCpuMonitor"
                />
              </ScTooltip>

              <ScTooltip
                v-if="fpsMonitorEnabled"
                content="Bandwidth: 显示当前页面网络请求的传输速率"
                placement="top"
                :append-to-body="true"
                :z-index="3000"
              >
                <ScSwitch
                  :model-value="bandwidthMonitorEnabled"
                  layout="visual-card"
                  size="small"
                  label="带宽监控"
                  description="显示网络传输速率"
                  active-icon="ri:global-line"
                  ribbon-color="var(--el-color-info)"
                  @change="themeStore.setBandwidthMonitor"
                />
              </ScTooltip>

              <ScTooltip
                v-if="fpsMonitorEnabled"
                content="Battery: 显示电池电量和充电状态"
                placement="top"
                :append-to-body="true"
                :z-index="3000"
              >
                <ScSwitch
                  :model-value="batteryMonitorEnabled"
                  layout="visual-card"
                  size="small"
                  label="电池监控"
                  description="显示电池状态"
                  active-icon="ri:battery-charge-line"
                  ribbon-color="var(--el-color-success)"
                  @change="themeStore.setBatteryMonitor"
                />
              </ScTooltip>

              <ScTooltip
                v-if="fpsMonitorEnabled"
                content="Bluetooth: 显示蓝牙功能可用性"
                placement="top"
                :append-to-body="true"
                :z-index="3000"
              >
                <ScSwitch
                  :model-value="bluetoothMonitorEnabled"
                  layout="visual-card"
                  size="small"
                  label="蓝牙监控"
                  description="显示蓝牙状态"
                  active-icon="ri:bluetooth-line"
                  ribbon-color="var(--el-color-primary)"
                  @change="themeStore.setBluetoothMonitor"
                />
              </ScTooltip>

              <ScTooltip
                v-if="fpsMonitorEnabled"
                content="Screen: 显示屏幕分辨率"
                placement="top"
                :append-to-body="true"
                :z-index="3000"
              >
                <ScSwitch
                  :model-value="screenMonitorEnabled"
                  layout="visual-card"
                  size="small"
                  label="屏幕监控"
                  description="显示屏幕分辨率"
                  active-icon="ri:computer-line"
                  ribbon-color="var(--el-color-primary)"
                  @change="themeStore.setScreenMonitor"
                />
              </ScTooltip>
            </div>

            <!-- 显示配置：仅在性能监控开启时展示 -->
            <div
              v-if="fpsMonitorEnabled"
              class="monitor-display-settings"
              style="margin-top: 16px; width: 100%; border-top: 1px solid var(--el-border-color-lighter); padding-top: 12px;"
            >
              <span style="font-size: 13px; font-weight: bold; margin-bottom: 12px; display: block; color: var(--el-text-color-regular);">显示配置</span>

              <div style="margin-bottom: 12px; display: flex; align-items: center; justify-content: space-between;">
                <span style="font-size: 12px; color: var(--el-text-color-secondary);">布局模式</span>
                <Segmented
                  :model-value="performanceMonitorLayout"
                  :options="[{ label: '合并', value: 'merged' }, { label: '分离', value: 'split' }]"
                  size="small"
                  @change="(val) => themeStore.setPerformanceMonitorLayout(val.option.value)"
                />
              </div>

              <div style="margin-bottom: 12px; display: flex; align-items: center; justify-content: space-between;">
                <span style="font-size: 12px; color: var(--el-text-color-secondary);">布局方向</span>
                <Segmented
                  :model-value="performanceMonitorDirection"
                  :options="[{ label: '自动', value: 'auto' }, { label: '垂直', value: 'vertical' }, { label: '水平', value: 'horizontal' }]"
                  size="small"
                  @change="(val) => themeStore.setPerformanceMonitorDirection(val.option.value)"
                />
              </div>

              <div style="margin-bottom: 12px; display: flex; align-items: center; justify-content: space-between;">
                <span style="font-size: 12px; color: var(--el-text-color-secondary);">内容展示</span>
                <Segmented
                  :model-value="performanceMonitorMode"
                  :options="[{ label: '详细', value: 'detailed' }, { label: '简洁', value: 'simple' }, { label: '极简', value: 'minimal' }]"
                  size="small"
                  @change="(val) => themeStore.setPerformanceMonitorMode(val.option.value)"
                />
              </div>

              <div class="position-selector-container">
                <span style="font-size: 12px; color: var(--el-text-color-secondary); margin-bottom: 8px; display: block;">显示位置</span>
                <ScSelect
                  :model-value="performanceMonitorPosition"
                  layout="position"
                  @change="(val) => themeStore.setPerformanceMonitorPosition(val)"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

    </div>
  </div>
</template>
