<!--
 * 登录主题管理
 * @author CH
 * @date 2025-12-12
 * @version 1.0.0
 -->
<template>
  <div class="theme-management system-container modern-bg">
    <ScAlert
      title="登录主题管理"
      type="info"
      :closable="false"
      style="margin-bottom: 20px"
    >
      <template #default>
        <p>
          在这里可以预览和切换登录页面主题，更改后需要重新登录才能看到效果。
        </p>
      </template>
    </ScAlert>

    <!-- 主题配置 -->
    <ScCard shadow="never" style="margin-bottom: 20px">
      <template #header>
        <div class="card-header">
          <IconifyIconOnline icon="ri:palette-line" />
          <span>主题配置</span>
        </div>
      </template>

      <ScForm :model="themeConfig" label-width="140px">
        <ScFormItem label="当前主题">
          <ScSelect
            v-model="themeConfig.LoginTheme"
            placeholder="请选择主题"
            style="width: 300px"
            @change="handleThemeChange"
          >
            <ScOption
              v-for="theme in selectableThemes"
              :key="theme.key"
              :label="theme.name"
              :value="theme.key"
            >
              <div
                style="
                  display: flex;
                  align-items: center;
                  justify-content: space-between;
                "
              >
                <span>{{ theme.name }}</span>
                <ScTag v-if="theme.isFestival" size="small" type="warning"
                  >节日</ScTag
                >
              </div>
            </ScOption>
          </ScSelect>
          <div class="form-item-tip">
            {{ getCurrentThemeDescription() }}
          </div>
        </ScFormItem>

        <ScFormItem label="启用节日主题">
          <ScSwitch
            v-model="themeConfig.EnableFestivalTheme"
            @change="handleFestivalToggle"
          />
          <div class="form-item-tip">
            开启后，系统会在节日期间自动切换到对应的节日主题
          </div>
        </ScFormItem>
      </ScForm>
    </ScCard>

    <!-- 常规主题预览 -->
    <ScCard shadow="never" style="margin-bottom: 20px">
      <template #header>
        <div class="card-header">
          <IconifyIconOnline icon="ri:layout-grid-line" />
          <span>常规主题</span>
        </div>
      </template>

      <div class="theme-grid">
        <div
          v-for="theme in regularThemes"
          :key="theme.key"
          class="theme-card"
          :class="{
            active: themeConfig.LoginTheme === theme.key && !isThemeDisabled(theme.key),
            disabled: isThemeDisabled(theme.key),
          }"
          @click="selectTheme(theme.key)"
        >
          <div class="theme-preview">
            <div :class="`preview-${theme.key}`">
              <div class="preview-content">
                <div class="preview-icon">
                  <IconifyIconOnline :icon="getThemeIcon(theme.key)" />
                </div>
              </div>
            </div>
          </div>
          <div class="theme-info">
            <div class="theme-name">{{ theme.name }}</div>
            <div class="theme-desc">{{ theme.description }}</div>
          </div>
          <div class="theme-actions">
            <ScTag
              :type="isThemeDisabled(theme.key) ? 'danger' : 'success'"
              size="small"
            >
              {{ isThemeDisabled(theme.key) ? "已关闭" : "已启用" }}
            </ScTag>
            <ScButton text size="small" @click.stop="toggleThemeDisabled(theme.key)">
              {{ isThemeDisabled(theme.key) ? "启用" : "关闭" }}
            </ScButton>
          </div>
          <div
            v-if="themeConfig.LoginTheme === theme.key && !isThemeDisabled(theme.key)"
            class="theme-badge"
          >
            <ScTag type="success" size="small">当前使用</ScTag>
          </div>
        </div>
      </div>
    </ScCard>

    <!-- 节日主题预览 -->
    <ScCard v-if="festivalThemes.length > 0" shadow="never">
      <template #header>
        <div class="card-header">
          <IconifyIconOnline icon="ri:gift-line" />
          <span>节日主题</span>
          <ScTag
            v-if="!themeConfig.EnableFestivalTheme"
            type="info"
            size="small"
            style="margin-left: 10px"
          >
            已禁用
          </ScTag>
        </div>
      </template>

      <div class="theme-grid">
        <div
          v-for="theme in festivalThemes"
          :key="theme.key"
          class="theme-card"
          :class="{
            active: themeConfig.LoginTheme === theme.key && !isThemeDisabled(theme.key),
            disabled: !themeConfig.EnableFestivalTheme || isThemeDisabled(theme.key),
          }"
          @click="selectTheme(theme.key)"
        >
          <div class="theme-preview">
            <div :class="`preview-${theme.key}`">
              <div class="preview-content">
                <div class="preview-icon">
                  <IconifyIconOnline :icon="getThemeIcon(theme.key)" />
                </div>
              </div>
            </div>
          </div>
          <div class="theme-info">
            <div class="theme-name">{{ theme.name }}</div>
            <div class="theme-desc">{{ theme.description }}</div>
          </div>
          <div class="theme-actions">
            <ScTag
              :type="isThemeDisabled(theme.key) ? 'danger' : 'success'"
              size="small"
            >
              {{ isThemeDisabled(theme.key) ? "已关闭" : "已启用" }}
            </ScTag>
            <ScButton text size="small" @click.stop="toggleThemeDisabled(theme.key)">
              {{ isThemeDisabled(theme.key) ? "启用" : "关闭" }}
            </ScButton>
          </div>
          <div
            v-if="themeConfig.LoginTheme === theme.key && !isThemeDisabled(theme.key)"
            class="theme-badge"
          >
            <ScTag type="success" size="small">当前使用</ScTag>
          </div>
        </div>
      </div>
    </ScCard>

    <!-- 保存按钮 -->
    <div class="action-bar">
      <ScButton type="primary" @click="handleSave" :loading="saving">
        <IconifyIconOnline icon="ri:save-line" style="margin-right: 5px" />
        保存配置
      </ScButton>
      <ScButton @click="handleReset">
        <IconifyIconOnline icon="ri:refresh-line" style="margin-right: 5px" />
        重置
      </ScButton>
    </div>
  </div>
</template>

<script setup lang="ts">
import ScAlert from "@repo/components/ScAlert";
import { computed, onMounted, reactive, ref } from "vue";
import { message } from "@repo/utils";
import {
  getDisabledLoginThemes,
  getThemeConfig,
  saveThemeConfig,
} from "@pages/common/login/utils/themeConfig";
import {
  festivalThemes as registeredFestivalThemes,
  loginThemes as registeredLoginThemes,
} from "@pages/common/login/themes/index";

/**
 * @author CH
 * @date 2025-12-12
 * @version 1.0.0
 */
defineOptions({
  name: "ThemeManagement",
});

const regularThemes = [
  ...registeredLoginThemes.map((theme) => ({
    key: theme.key,
    name: theme.name,
    description: theme.description,
    isFestival: false,
  })),
  {
    key: "random",
    name: "随机主题",
    description: "每次登录随机选择一个当前仍可用的主题",
    isFestival: false,
  },
];

const festivalThemes = registeredFestivalThemes.map((theme) => ({
  key: theme.key,
  name: theme.name,
  description: theme.description,
  isFestival: true,
}));

// 所有主题
const allThemes = [...regularThemes, ...festivalThemes];

// 主题配置
const themeConfig = reactive({
  LoginTheme: "modern",
  EnableFestivalTheme: true,
  DisabledThemes: [] as string[],
});

// 原始配置（用于重置）
const originalConfig = reactive({
  LoginTheme: "modern",
  EnableFestivalTheme: true,
  DisabledThemes: [] as string[],
});

const saving = ref(false);
const disabledThemeSet = computed(() => new Set(themeConfig.DisabledThemes));
const selectableThemes = computed(() =>
  allThemes.filter((theme) => !disabledThemeSet.value.has(theme.key)),
);
const concreteThemeKeys = new Set(
  [...registeredLoginThemes, ...registeredFestivalThemes].map((theme) => theme.key),
);

// 获取主题图标
const getThemeIcon = (themeKey: string) => {
  const iconMap = {
    modern: "ri:layout-line",
    tech: "ri:rocket-line",
    business: "ri:briefcase-line",
    random: "ri:shuffle-line",
    "new-year": "noto:party-popper",
    "spring-festival": "noto:firecracker",
    "valentines-day": "noto:red-heart",
    "mid-autumn": "noto:full-moon",
    "national-day": "twemoji:flag-china",
    christmas: "noto:christmas-tree",
  };
  return iconMap[themeKey] || "ri:palette-line";
};

// 获取当前主题描述
const getCurrentThemeDescription = () => {
  const theme = allThemes.find((t) => t.key === themeConfig.LoginTheme);
  return theme ? theme.description : "";
};

const isThemeDisabled = (themeKey: string) =>
  disabledThemeSet.value.has(themeKey);

const getEnabledThemeCount = () =>
  allThemes.filter(
    (theme) => concreteThemeKeys.has(theme.key) && !isThemeDisabled(theme.key),
  ).length;

const ensureValidSelectedTheme = () => {
  const currentThemeExists = allThemes.some(
    (theme) => theme.key === themeConfig.LoginTheme,
  );
  if (currentThemeExists && !isThemeDisabled(themeConfig.LoginTheme)) {
    return;
  }

  const fallbackTheme = selectableThemes.value[0] || regularThemes[0];
  if (fallbackTheme) {
    themeConfig.LoginTheme = fallbackTheme.key;
  }
};

const toggleThemeDisabled = (themeKey: string) => {
  const nextDisabled = new Set(themeConfig.DisabledThemes);

  if (nextDisabled.has(themeKey)) {
    nextDisabled.delete(themeKey);
    themeConfig.DisabledThemes = Array.from(nextDisabled);
    return;
  }

  if (concreteThemeKeys.has(themeKey) && getEnabledThemeCount() <= 1) {
    message("至少保留一个可用主题", { type: "warning" });
    return;
  }

  nextDisabled.add(themeKey);
  themeConfig.DisabledThemes = Array.from(nextDisabled);
  ensureValidSelectedTheme();
};

// 选择主题
const selectTheme = (themeKey: string) => {
  if (isThemeDisabled(themeKey)) {
    message("该主题已关闭，请先启用后再选择", { type: "warning" });
    return;
  }
  const theme = allThemes.find((t) => t.key === themeKey);
  if (theme && theme.isFestival && !themeConfig.EnableFestivalTheme) {
    message("请先启用节日主题功能", { type: "warning" });
    return;
  }
  themeConfig.LoginTheme = themeKey;
};

// 主题切换
const handleThemeChange = (value: string) => {
  if (isThemeDisabled(value)) {
    message("该主题已关闭，请先启用后再选择", { type: "warning" });
    themeConfig.LoginTheme = originalConfig.LoginTheme;
    ensureValidSelectedTheme();
    return;
  }
  const theme = allThemes.find((t) => t.key === value);
  if (theme && theme.isFestival && !themeConfig.EnableFestivalTheme) {
    message("请先启用节日主题功能", { type: "warning" });
    themeConfig.LoginTheme = originalConfig.LoginTheme;
    return;
  }
};

// 节日主题开关切换
const handleFestivalToggle = (value: boolean) => {
  if (!value) {
    // 如果关闭节日主题，且当前选择的是节日主题，则切换回默认主题
    const currentTheme = allThemes.find(
      (t) => t.key === themeConfig.LoginTheme,
    );
    if (currentTheme && currentTheme.isFestival) {
      themeConfig.LoginTheme = "modern";
      message("已切换回默认主题", { type: "info" });
    }
  }
};

// 加载配置
const loadConfig = () => {
  const stored = getThemeConfig();
  themeConfig.LoginTheme = stored.LoginTheme;
  themeConfig.EnableFestivalTheme = stored.EnableFestivalTheme;
  themeConfig.DisabledThemes = getDisabledLoginThemes();
  ensureValidSelectedTheme();
  originalConfig.LoginTheme = themeConfig.LoginTheme;
  originalConfig.EnableFestivalTheme = themeConfig.EnableFestivalTheme;
  originalConfig.DisabledThemes = [...themeConfig.DisabledThemes];
  console.debug("[ThemeManagement] Config loaded:", stored);
};

// 保存配置
const handleSave = () => {
  saving.value = true;
  try {
    // 保存到本地存储
    saveThemeConfig({
      LoginTheme: themeConfig.LoginTheme,
      EnableFestivalTheme: themeConfig.EnableFestivalTheme,
      DisabledThemes: themeConfig.DisabledThemes,
    });

    // 更新原始配置
    originalConfig.LoginTheme = themeConfig.LoginTheme;
    originalConfig.EnableFestivalTheme = themeConfig.EnableFestivalTheme;
    originalConfig.DisabledThemes = [...themeConfig.DisabledThemes];

    message("保存成功", { type: "success" });
  } catch (error) {
    message("保存失败", { type: "error" });
    console.error("[ThemeManagement] Save failed:", error);
  } finally {
    saving.value = false;
  }
};

// 重置配置
const handleReset = () => {
  themeConfig.LoginTheme = originalConfig.LoginTheme;
  themeConfig.EnableFestivalTheme = originalConfig.EnableFestivalTheme;
  themeConfig.DisabledThemes = [...originalConfig.DisabledThemes];
  ensureValidSelectedTheme();
  message("已重置为保存的配置", { type: "info" });
};

onMounted(() => {
  loadConfig();
});
</script>

<style lang="scss" scoped>
.theme-management {
  padding: 20px;
}

.card-header {
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: 600;
}

.form-item-tip {
  margin-top: 8px;
  font-size: 12px;
  color: var(--el-text-color-secondary);
  line-height: 1.5;
}

.theme-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 20px;
}

.theme-card {
  position: relative;
  border: 2px solid var(--el-border-color);
  border-radius: 12px;
  padding: 16px;
  cursor: pointer;
  transition: all 0.3s ease;
  background: var(--el-bg-color);

  &:hover {
    border-color: var(--el-color-primary);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
    transform: translateY(-2px);
  }

  &.active {
    border-color: var(--el-color-primary);
    background: var(--el-color-primary-light-9);
  }

  &.disabled {
    opacity: 0.5;
    cursor: not-allowed;

    &:hover {
      border-color: var(--el-border-color);
      box-shadow: none;
      transform: none;
    }
  }
}

.theme-preview {
  width: 100%;
  height: 160px;
  border-radius: 8px;
  overflow: hidden;
  margin-bottom: 12px;
  background: var(--el-fill-color-light);

  .preview-content {
    width: 100%;
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .preview-icon {
    font-size: 60px;
    opacity: 0.8;
  }

  // 现代简约预览
  .preview-modern {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
  }

  // 科技未来预览
  .preview-tech {
    background: linear-gradient(135deg, #0a1128 0%, #1a2a4a 100%);
    color: #409eff;
  }

  // 像素风预览
  .preview-pixel {
    background:
      repeating-linear-gradient(90deg, rgba(17, 17, 17, 0.08) 0 2px, transparent 2px 14px),
      repeating-linear-gradient(180deg, rgba(17, 17, 17, 0.08) 0 2px, transparent 2px 14px),
      linear-gradient(135deg, #f8f8f8 0%, #d8ffd8 100%);
    color: #111;
  }

  // 随机主题预览
  .preview-random {
    background: linear-gradient(
      135deg,
      #667eea 0%,
      #764ba2 25%,
      #f093fb 50%,
      #4facfe 75%,
      #00f2fe 100%
    );
    color: white;
  }

  // 元旦主题预览
  .preview-new-year {
    background: linear-gradient(135deg, #ffd700 0%, #ffed4e 50%, #ffa500 100%);
    color: #ff6b6b;
  }

  // 春节主题预览
  .preview-spring-festival {
    background: linear-gradient(135deg, #ff6b6b 0%, #ff8787 50%, #ffa07a 100%);
    color: #ffd700;
  }

  // 情人节主题预览
  .preview-valentines-day {
    background: linear-gradient(135deg, #ff69b4 0%, #ff1493 50%, #c71585 100%);
    color: #ffe4e1;
  }

  // 中秋主题预览
  .preview-mid-autumn {
    background: linear-gradient(
      to bottom,
      #0a1128 0%,
      #1a2a4a 50%,
      #2a3a5a 100%
    );
    color: #ffe4b3;
  }

  // 国庆主题预览
  .preview-national-day {
    background: linear-gradient(135deg, #de2910 0%, #ff4444 50%, #ffaa00 100%);
    color: #ffd700;
  }

  // 圣诞主题预览
  .preview-christmas {
    background: linear-gradient(
      to bottom,
      #1a472a 0%,
      #2d5a3d 50%,
      #3d6a4d 100%
    );
    color: #c41e3a;
  }
}

.theme-info {
  .theme-name {
    font-size: 16px;
    font-weight: 600;
    color: var(--el-text-color-primary);
    margin-bottom: 4px;
  }

  .theme-desc {
    font-size: 13px;
    color: var(--el-text-color-secondary);
    line-height: 1.5;
  }
}

.theme-actions {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-top: 14px;
}

.theme-badge {
  position: absolute;
  top: 16px;
  right: 16px;
}

.action-bar {
  display: flex;
  justify-content: center;
  gap: 12px;
  margin-top: 30px;
  padding-top: 20px;
  border-top: 1px solid var(--el-border-color-lighter);
}

@media (max-width: 768px) {
  .theme-grid {
    grid-template-columns: 1fr;
  }
}
</style>
