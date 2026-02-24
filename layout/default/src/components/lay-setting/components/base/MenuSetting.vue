<script setup lang="ts">
import { computed } from "vue";
import { useI18n } from "vue-i18n";
import { useGlobal } from "@pureadmin/utils";
import { emitter } from "@repo/core";
import Segmented, { type OptionsType } from "@repo/components/ReSegmented";
import ScSwitch from "@repo/components/ScSwitch/index.vue";
import { useSettings } from "../../composables/useSettings";
import { storageConfigureChange } from "../../composables/useSettings";

const { t } = useI18n();
const { $storage } = useGlobal<GlobalPropertiesApi>();
const {
  settings,
  setMenuTransition,
  setTransitionType,
  setShowNewMenu,
  setNewMenuText,
  setNewMenuTimeLimit,
  setNewMenuAnimation,
} = useSettings();

const transitionTypeOptions = computed<Array<OptionsType>>(() => [
  { label: "滑动淡入", tip: "平滑的上下滑动效果", value: "fade-slide" },
  { label: "缩放淡入", tip: "带缩放的淡入淡出效果", value: "fade-scale" },
  { label: "纯淡入", tip: "仅淡入淡出无位移", value: "fade-only" },
  { label: "右侧滑入", tip: "从右侧滑入的效果", value: "slide-right" },
]);

const newMenuAnimationOptions = computed<Array<OptionsType>>(() => [
  { label: t("panel.animNone"), value: "none" },
  { label: t("panel.animBounce"), value: "bounce" },
  { label: t("panel.animPulse"), value: "pulse" },
  { label: t("panel.animShake"), value: "shake" },
]);

const currentNewMenuAnimationIndex = computed(() => {
  const index = newMenuAnimationOptions.value.findIndex(
    (opt) => opt.value === settings.newMenuAnimation,
  );
  return index >= 0 ? index : 1;
});

const currentTransitionTypeValue = computed(() => settings.transitionType);

function handleMenuAnimationChange(value: boolean) {
  setMenuTransition(value);
  storageConfigureChange("MenuAnimation", value);
  emitter.emit("menuAnimationChange", value);
}

function handleTransitionTypeChange({ option }: { option: OptionsType }) {
  setTransitionType(option.value as any);
}

function handleShowNewMenuChange(value: boolean) {
  setShowNewMenu(value);
  emitter.emit("showNewMenuChange", value);
}

function handleNewMenuTextBlur() {
  setNewMenuText(settings.newMenuText);
}

function handleNewMenuTimeLimitChange(value: number) {
  setNewMenuTimeLimit(value);
}

function handleNewMenuAnimationChange({ option }: { option: OptionsType }) {
  const value = option.value as string;
  setNewMenuAnimation(value);
  emitter.emit("newMenuAnimationChange", value);
}
</script>

<template>
  <div class="setting-section">
    <div class="section-header">
      <IconifyIconOnline icon="ri:menu-line" class="section-icon" />
      <h3 class="section-title">菜单设置</h3>
      <div class="section-description">配置菜单动画和新菜单标识</div>
    </div>
    <div class="setting-content">
      <!-- 菜单动画 -->
      <div class="setting-group">
        <h4 class="group-title">
          <IconifyIconOnline icon="ri:movie-line" class="group-icon" />
          菜单动画
        </h4>
        <ScSwitch
          v-model="settings.menuTransition"
          layout="visual-card"
          size="small"
          :label="t('panel.menuTransitionChange')"
          description="点击菜单与切换路由时的过渡动画"
          active-icon="ri:film-line"
          ribbon-color="var(--el-color-primary)"
          @change="handleMenuAnimationChange"
        />

        <div v-if="settings.menuTransition" class="mt-3 px-1">
          <div class="text-xs text-gray-500 mb-2 pl-1">动画效果</div>
          <Segmented
            resize
            class="select-none modern-segmented"
            :modelValue="currentTransitionTypeValue"
            :options="transitionTypeOptions"
            @change="handleTransitionTypeChange"
          />
        </div>
      </div>

      <!-- 新菜单标识 -->
      <div class="setting-group">
        <h4 class="group-title">
          <IconifyIconOnline
            icon="ri:add-circle-line"
            class="group-icon"
          />
          新菜单标识
        </h4>
        <ScSwitch
          v-model="settings.showNewMenu"
          layout="visual-card"
          size="small"
          label="显示新增菜单"
          description="为最近新增的菜单显示 NEW 标识"
          active-icon="ri:add-circle-line"
          ribbon-color="var(--el-color-primary)"
          @change="handleShowNewMenuChange"
        />

        <div
          v-if="settings.showNewMenu"
          class="sub-settings-container mt-4 pl-3 border-l-2 border-[var(--el-border-color-lighter)]"
        >
          <div class="setting-item mb-4">
            <div class="flex justify-between items-center mb-2">
              <span class="text-sm text-[var(--el-text-color-regular)]">
                标识文本
              </span>
              <el-input
                v-model="settings.newMenuText"
                placeholder="NEW"
                maxlength="10"
                size="small"
                show-word-limit
                style="width: 120px"
                @blur="handleNewMenuTextBlur"
              />
            </div>
          </div>

          <div class="setting-item mb-4">
            <div class="flex justify-between items-center mb-2">
              <span class="text-sm text-[var(--el-text-color-regular)]">
                显示时长(小时)
              </span>
              <el-input-number
                v-model="settings.newMenuTimeLimit"
                :min="1"
                :max="8760"
                :step="1"
                size="small"
                style="width: 120px"
                @change="handleNewMenuTimeLimitChange"
              />
            </div>
          </div>

          <div class="setting-item mb-2">
            <div class="text-xs text-gray-500 mb-2 pl-1">标识动画</div>
            <Segmented
              resize
              class="select-none modern-segmented w-full"
              :modelValue="currentNewMenuAnimationIndex"
              :options="newMenuAnimationOptions"
              @change="handleNewMenuAnimationChange"
            />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.setting-section {
  margin-bottom: 24px;
}

.section-header {
  display: flex;
  align-items: center;
  margin-bottom: 16px;
}

.section-icon {
  margin-right: 8px;
  font-size: 20px;
  color: var(--el-color-primary);
}

.section-title {
  font-size: 16px;
  font-weight: 600;
  color: var(--el-text-color-primary);
}
</style>


