<script setup lang="ts">
import { ScRadio, ScRadioGroup } from "@repo/components/ScRadio";
import { ScTooltip } from "@repo/components/ScTooltip";
import { useI18n } from "vue-i18n";
import Segmented, {
  type OptionsType,
} from "@repo/components/ReSegmented/index";
import { ScInputNumber } from "@repo/components/ScInputNumber";


import ScSelect from "@repo/components/ScSelect/index.vue";
import { useAppStoreHook } from "@repo/core";
import { isNumber } from "@pureadmin/utils";

import DoubleIcon from "@repo/assets/svg/double.svg?component";
import DrawerIcon from "@repo/assets/svg/drawer.svg?component";
import HorizontalIcon from "@repo/assets/svg/horizontal.svg?component";
import HoverIcon from "@repo/assets/svg/hover.svg?component";
import MixIcon from "@repo/assets/svg/mix.svg?component";
import MobileIcon from "@repo/assets/svg/mobile.svg?component";
import VerticalIcon from "@repo/assets/svg/vertical.svg?component";

const { t } = useI18n();

// ---- Props 定义 ----
const props = defineProps<{
  /** reactive 设置对象引用，子组件可直接修改 */
  settings: Record<string, any>;
  layoutTheme: { layout: string; theme: string };
  device: string;
  verticalRef: any;
  horizontalRef: any;
  mixRef: any;
  hoverRef: any;
  mobileRef: any;
  doubleRef: any;
  drawerRef: any;
  setLayoutModel: (layout: string) => void;
  stretchTypeOptions: Array<OptionsType>;
  stretchTypeChange: (val: { option: OptionsType }) => void;
  setStretch: (value: number | boolean) => void;
  adjustValue: (key: string, delta: number) => void;
  handleKeydown: (event: KeyboardEvent, key: string) => void;
  handleInput: (event: Event, key: string) => void;
  doubleNavExpandModeChange: () => void;
  doubleNavAutoExpandAllChange: () => void;
  drawerHamburgerPositionChange: () => void;
}>();
</script>

<template>
  <!-- 布局模式设置区域 -->
  <div class="setting-section">
    <div class="section-header">
      <IconifyIconOnline icon="ri:layout-line" class="section-icon" />
      <h3 class="section-title">{{ t("panel.pureLayoutModel") }}</h3>
      <div class="section-description">
        {{ t("panel.layoutModeDesc") }}
      </div>
    </div>
    <div class="setting-content">
      <div class="layout-mode-grid">
        <ScTooltip
          :content="t('panel.layoutVerticalTip')"
          placement="top"
          :append-to-body="true"
          :z-index="41000"
        >
          <div
            :ref="verticalRef"
            class="layout-mode-item"
            :class="{ 'is-active': layoutTheme.layout === 'vertical' }"
            @click="setLayoutModel('vertical')"
          >
            <div class="layout-mode-preview">
              <VerticalIcon />
            </div>
            <div class="layout-mode-info">
              <span class="layout-mode-name">{{ t("panel.layoutVertical") }}</span>
              <span class="layout-mode-desc">{{ t("panel.layoutVerticalDesc") }}</span>
            </div>
            <div v-if="layoutTheme.layout === 'vertical'" class="layout-mode-badge">
              <IconifyIconOnline icon="ri:check-line" />
            </div>
          </div>
        </ScTooltip>

        <ScTooltip
          v-if="device !== 'mobile'"
          :content="t('panel.layoutHorizontalTip')"
          placement="top"
          :append-to-body="true"
          :z-index="41000"
        >
          <div
            :ref="horizontalRef"
            class="layout-mode-item"
            :class="{ 'is-active': layoutTheme.layout === 'horizontal' }"
            @click="setLayoutModel('horizontal')"
          >
            <div class="layout-mode-preview">
              <HorizontalIcon />
            </div>
            <div class="layout-mode-info">
              <span class="layout-mode-name">{{ t("panel.layoutHorizontal") }}</span>
              <span class="layout-mode-desc">{{ t("panel.layoutHorizontalDesc") }}</span>
            </div>
            <div v-if="layoutTheme.layout === 'horizontal'" class="layout-mode-badge">
              <IconifyIconOnline icon="ri:check-line" />
            </div>
          </div>
        </ScTooltip>

        <ScTooltip
          v-if="device !== 'mobile'"
          :content="t('panel.layoutMixTip')"
          placement="top"
          :append-to-body="true"
          :z-index="41000"
        >
          <div
            :ref="mixRef"
            class="layout-mode-item"
            :class="{ 'is-active': layoutTheme.layout === 'mix' }"
            @click="setLayoutModel('mix')"
          >
            <div class="layout-mode-preview">
              <MixIcon />
            </div>
            <div class="layout-mode-info">
              <span class="layout-mode-name">{{ t("panel.layoutMix") }}</span>
              <span class="layout-mode-desc">{{ t("panel.layoutMixDesc") }}</span>
            </div>
            <div v-if="layoutTheme.layout === 'mix'" class="layout-mode-badge">
              <IconifyIconOnline icon="ri:check-line" />
            </div>
          </div>
        </ScTooltip>

        <ScTooltip
          v-if="device !== 'mobile'"
          :content="t('panel.layoutHoverTip')"
          placement="top"
          :append-to-body="true"
          :z-index="41000"
        >
          <div
            :ref="hoverRef"
            class="layout-mode-item"
            :class="{ 'is-active': layoutTheme.layout === 'hover' }"
            @click="setLayoutModel('hover')"
          >
            <div class="layout-mode-preview">
              <HoverIcon />
            </div>
            <div class="layout-mode-info">
              <span class="layout-mode-name">{{ t("panel.layoutHover") }}</span>
              <span class="layout-mode-desc">{{ t("panel.layoutHoverDesc") }}</span>
            </div>
            <div v-if="layoutTheme.layout === 'hover'" class="layout-mode-badge">
              <IconifyIconOnline icon="ri:check-line" />
            </div>
          </div>
        </ScTooltip>

        <ScTooltip
          :content="t('panel.layoutMobileTip')"
          placement="top"
          :append-to-body="true"
          :z-index="41000"
        >
          <div
            :ref="mobileRef"
            class="layout-mode-item"
            :class="{ 'is-active': layoutTheme.layout === 'mobile' }"
            @click="setLayoutModel('mobile')"
          >
            <div class="layout-mode-preview">
              <MobileIcon />
            </div>
            <div class="layout-mode-info">
              <span class="layout-mode-name">{{ t("panel.layoutMobile") }}</span>
              <span class="layout-mode-desc">{{ t("panel.layoutMobileDesc") }}</span>
            </div>
            <div v-if="layoutTheme.layout === 'mobile'" class="layout-mode-badge">
              <IconifyIconOnline icon="ri:check-line" />
            </div>
          </div>
        </ScTooltip>

        <ScTooltip
          v-if="device !== 'mobile'"
          :content="t('panel.layoutDoubleTip')"
          placement="top"
          :append-to-body="true"
          :z-index="41000"
        >
          <div
            :ref="doubleRef"
            class="layout-mode-item"
            :class="{ 'is-active': layoutTheme.layout === 'double' }"
            @click="setLayoutModel('double')"
          >
            <div class="layout-mode-preview">
              <DoubleIcon />
            </div>
            <div class="layout-mode-info">
              <span class="layout-mode-name">{{ t("panel.layoutDouble") }}</span>
              <span class="layout-mode-desc">{{ t("panel.layoutDoubleDesc") }}</span>
            </div>
            <div v-if="layoutTheme.layout === 'double'" class="layout-mode-badge">
              <IconifyIconOnline icon="ri:check-line" />
            </div>
          </div>
        </ScTooltip>

        <ScTooltip
          :content="t('panel.layoutDrawerTip')"
          placement="top"
          :append-to-body="true"
          :z-index="41000"
        >
          <div
            :ref="drawerRef"
            class="layout-mode-item"
            :class="{ 'is-active': layoutTheme.layout === 'drawer' }"
            @click="setLayoutModel('drawer')"
          >
            <div class="layout-mode-preview">
              <DrawerIcon />
            </div>
            <div class="layout-mode-info">
              <span class="layout-mode-name">{{ t("panel.layoutDrawer") }}</span>
              <span class="layout-mode-desc">{{ t("panel.layoutDrawerDesc") }}</span>
            </div>
            <div v-if="layoutTheme.layout === 'drawer'" class="layout-mode-badge">
              <IconifyIconOnline icon="ri:check-line" />
            </div>
          </div>
        </ScTooltip>
      </div>
    </div>
  </div>

  <!-- 双栏导航配置区域 -->
  <div v-if="layoutTheme.layout === 'double'" class="setting-section">
    <div class="section-header">
      <IconifyIconOnline icon="ri:layout-column-line" class="section-icon" />
      <h3 class="section-title">{{ t("panel.doubleNavConfig") }}</h3>
      <div class="section-description">{{ t("panel.doubleNavConfigDesc") }}</div>
    </div>
    <div class="setting-content">
      <div class="switch-item">
        <label class="switch-label">{{ t("panel.expandMode") }}</label>
        <div class="radio-group">
          <ScRadioGroup
            v-model="settings.doubleNavExpandMode"
            @change="doubleNavExpandModeChange"
          >
            <ScRadio value="auto">自动展开</ScRadio>
            <ScRadio value="manual">手动展开</ScRadio>
          </ScRadioGroup>
        </div>
      </div>
      <div v-if="settings.doubleNavExpandMode === 'manual'" class="setting-content">
        <ScSwitch
          v-model="settings.doubleNavAutoExpandAll"
          layout="visual-card"
          size="small"
          label="展开子菜单"
          description="自动展开所有子菜单"
          active-icon="ri:menu-unfold-line"
          ribbon-color="var(--el-color-primary)"
          @change="doubleNavAutoExpandAllChange"
        />
      </div>
    </div>
  </div>

  <!-- 抽屉导航配置区域 -->
  <div v-if="layoutTheme.layout === 'drawer'" class="setting-section">
    <div class="section-header">
      <IconifyIconOnline icon="ri:menu-2-line" class="section-icon" />
      <h3 class="section-title">{{ t("panel.drawerNavConfig") }}</h3>
      <div class="section-description">{{ t("panel.drawerNavConfigDesc") }}</div>
    </div>
    <div class="setting-content">
      <div class="switch-item">
        <label class="switch-label">{{ t("panel.hamburgerPosition") }}</label>
        <ScSelect
          v-model="settings.drawerHamburgerPosition"
          layout="position"
          mode="4"
          @change="drawerHamburgerPositionChange"
        />
      </div>
    </div>
  </div>

  <!-- 页面宽度设置区域 -->
  <div
    v-if="useAppStoreHook().getViewportWidth > 1280"
    class="setting-section"
  >
    <div class="section-header">
      <IconifyIconOnline icon="ri:fullscreen-line" class="section-icon" />
      <h3 class="section-title">{{ t("panel.pureStretch") }}</h3>
    </div>
    <div class="setting-content">
      <Segmented
        resize
        class="mb-2 select-none modern-segmented"
        :modelValue="isNumber(settings.stretch) ? 1 : 0"
        :options="stretchTypeOptions"
        @change="stretchTypeChange"
      />
      <ScInputNumber
        v-if="isNumber(settings.stretch)"
        v-model="settings.stretch as number"
        :min="1280"
        :max="1600"
        controls-position="right"
        @change="(value: number) => setStretch(value)"
      />
    </div>
  </div>

  <!-- 布局参数设置区域 -->
  <div class="setting-section">
    <div class="section-header">
      <IconifyIconOnline icon="ri:settings-3-line" class="section-icon" />
      <h3 class="section-title">{{ t("panel.pureLayoutParams") || "布局参数" }}</h3>
    </div>
    <div class="setting-content">
      <div class="layout-params-grid">
        <div class="param-item">
          <label class="param-label">{{ t("panel.pureStretchMargin") || "内容边距" }}</label>
          <div class="custom-number-input">
            <button
              class="number-btn decrease"
              @click="adjustValue('contentMargin', -1)"
              :disabled="settings.contentMargin <= 0"
            >
              <IconifyIconOnline icon="ri:subtract-line" />
            </button>
            <div class="number-display">
              <input
                type="number"
                v-model.number="settings.contentMargin"
                @input="handleInput($event, 'contentMargin')"
                @keydown="handleKeydown($event, 'contentMargin')"
                :min="0"
                :max="100"
                class="number-input"
                placeholder="0"
              />
              <span class="number-unit">px</span>
            </div>
            <button
              class="number-btn increase"
              @click="adjustValue('contentMargin', 1)"
              :disabled="settings.contentMargin >= 100"
            >
              <IconifyIconOnline icon="ri:add-line" />
            </button>
          </div>
        </div>

        <div class="param-item">
          <label class="param-label">{{ t("panel.pureLayoutRadius") || "圆角大小" }}</label>
          <div class="custom-number-input">
            <button
              class="number-btn decrease"
              @click="adjustValue('layoutRadius', -1)"
              :disabled="settings.layoutRadius <= 0"
            >
              <IconifyIconOnline icon="ri:subtract-line" />
            </button>
            <div class="number-display">
              <input
                type="number"
                v-model.number="settings.layoutRadius"
                @input="handleInput($event, 'layoutRadius')"
                @keydown="handleKeydown($event, 'layoutRadius')"
                :min="0"
                :max="100"
                class="number-input"
                placeholder="0"
              />
              <span class="number-unit">px</span>
            </div>
            <button
              class="number-btn increase"
              @click="adjustValue('layoutRadius', 1)"
              :disabled="settings.layoutRadius >= 100"
            >
              <IconifyIconOnline icon="ri:add-line" />
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
