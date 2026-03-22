<script setup lang="ts">
import { useI18n } from "vue-i18n";
import Segmented, {
  type OptionsType,
} from "@repo/components/ReSegmented/index";
import { ScSwitch } from "@repo/components/ScSwitch"
import { ScInput } from "@repo/components/ScInput"
import { ScInputNumber } from "@repo/components/ScInputNumber";
import NewMenuAnimationSelector from "../../components/base/NewMenuAnimationSelector.vue";

const { t } = useI18n();

// ---- Props 定义 ----
const props = defineProps<{
  /** reactive 设置对象引用，子组件可直接修改 */
  settings: Record<string, any>;
  transitionTypeOptions: Array<OptionsType>;
  menuAnimationChange: (value: boolean) => void;
  transitionTypeChange: (val: { option: OptionsType }) => void;
  showNewMenuChange: () => void;
  newMenuTextChange: () => void;
  newMenuTimeLimitChange: () => void;
  newMenuAnimationChange: (val: { option: OptionsType }) => void;
}>();
</script>

<template>
  <!-- 菜单设置区域 -->
  <div class="setting-section">
    <div class="section-header">
      <IconifyIconOnline icon="ri:menu-line" class="section-icon" />
      <h3 class="section-title">菜单设置</h3>
      <div class="section-description">配置菜单显示效果和功能</div>
    </div>
    <div class="setting-content">
      <!-- 菜单动画设置 -->
      <div class="setting-group">
        <h4 class="group-title">
          <IconifyIconOnline icon="ri:movie-line" class="group-icon" />
          菜单动画
        </h4>
        <ScSwitch
          v-model="settings.menuAnimation"
          layout="visual-card"
          size="small"
          label="开启菜单动画"
          description="点击激活菜单与打开路由时的动画效果"
          active-icon="ri:film-line"
          ribbon-color="var(--el-color-primary)"
          @change="menuAnimationChange"
        />
        <div v-if="settings.menuAnimation" class="mt-3 px-1">
          <div class="text-xs text-gray-500 mb-2 pl-1">动画效果选择</div>
          <Segmented
            resize
            class="select-none modern-segmented"
            :modelValue="settings.transitionType"
            :options="transitionTypeOptions"
            @change="transitionTypeChange"
          />
        </div>
      </div>

      <!-- 新菜单显示设置 -->
      <div class="setting-group">
        <h4 class="group-title">
          <IconifyIconOnline icon="ri:add-circle-line" class="group-icon" />
          新菜单显示
        </h4>
        <ScSwitch
          v-model="settings.showNewMenu"
          layout="visual-card"
          size="small"
          label="显示新增菜单"
          description="启用新菜单标识功能"
          active-icon="ri:add-circle-line"
          ribbon-color="var(--el-color-primary)"
          @change="showNewMenuChange"
        />

        <!-- 新菜单详细配置（仅开启时显示） -->
        <div
          v-if="settings.showNewMenu"
          class="sub-settings-container mt-4 pl-3 border-l-2 border-[var(--el-border-color-lighter)]"
        >
          <!-- 新菜单文本 -->
          <div class="setting-item mb-4">
            <div class="flex justify-between items-center mb-2">
              <span class="text-sm text-[var(--el-text-color-regular)]">标识文本</span>
              <ScInput
                v-model="settings.newMenuText"
                placeholder="NEW"
                :maxlength="10"
                size="small"
                show-word-limit
                @blur="newMenuTextChange"
                style="width: 120px"
              />
            </div>
          </div>

          <!-- 时间限制 -->
          <div class="setting-item mb-4">
            <div class="flex justify-between items-center mb-2">
              <span class="text-sm text-[var(--el-text-color-regular)]">显示时长(小时)</span>
              <ScInputNumber
                v-model="settings.newMenuTimeLimit"
                :min="1"
                :max="8760"
                :step="1"
                size="small"
                @change="newMenuTimeLimitChange"
                style="width: 120px"
              />
            </div>
          </div>

          <!-- 标识动画 -->
          <div class="setting-item mb-4">
            <div class="flex justify-between items-center mb-2">
              <span class="text-sm text-[var(--el-text-color-regular)]">动画</span>
            </div>
            <NewMenuAnimationSelector
              v-model="settings.newMenuAnimation"
              :disabled="!settings.showNewMenu"
              @change="(val) => newMenuAnimationChange({ option: { value: val } as any })"
            />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
