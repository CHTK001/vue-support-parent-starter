<template>
  <div class="sc-card-example">
    <div class="example-container">
      <!-- 左侧：属性配置面板 -->
      <div class="config-panel">
        <h3 class="panel-title">
          <IconifyIconOnline icon="ri:settings-3-line" />
          属性配置
        </h3>

        <ScForm label-position="top" size="small">
          <ScFormItem label="layout 布局类型">
            <ScSelect
              v-model="config.layout"
              layout="card"
              :options="layoutOptions"
              :gap="6"
              width="70px"
              @change="handleLayoutChange"
            />
          </ScFormItem>

          <ScFormItem label="theme 主题色">
            <ScSelect
              v-model="config.theme"
              layout="card"
              :options="themeOptions"
              :gap="6"
              width="70px"
            />
          </ScFormItem>

          <ScFormItem label="title 标题">
            <ScInput v-model="config.title" />
          </ScFormItem>

          <ScFormItem v-if="showSubtitle" label="subtitle 副标题">
            <ScInput v-model="config.subtitle" />
          </ScFormItem>

          <ScFormItem label="icon 图标">
            <ScInput v-model="config.icon" placeholder="如: ri:home-line" />
          </ScFormItem>

          <ScFormItem v-if="showStatsProps" label="value 数值">
            <ScInputNumber v-model="config.value" :min="0" />
          </ScFormItem>

          <ScFormItem v-if="showStatsProps" label="label 标签">
            <ScInput v-model="config.label" />
          </ScFormItem>

          <ScFormItem v-if="showStatsProps" label="trendText 趋势文本">
            <ScInput v-model="config.trendText" />
          </ScFormItem>

          <ScFormItem label="shadow 阴影">
            <ScSelect
              v-model="config.shadow"
              layout="card"
              :options="shadowOptions"
              :gap="6"
              width="70px"
            />
          </ScFormItem>

          <ScDivider />

          <div class="switch-group">
            <div class="switch-item">
              <ScTooltip content="鼠标悬停时显示交互效果" placement="left">
                <span>hoverable 可悬停</span>
              </ScTooltip>
              <ScSwitch v-model="config.hoverable" />
            </div>
            <div class="switch-item">
              <ScTooltip content="卡片激活/选中状态" placement="left">
                <span>active 激活状态</span>
              </ScTooltip>
              <ScSwitch v-model="config.active" />
            </div>
            <div class="switch-item" v-if="showStatsProps">
              <ScTooltip content="数值是否有计数动画" placement="left">
                <span>counting 计数动画</span>
              </ScTooltip>
              <ScSwitch v-model="config.counting" />
            </div>
            <div class="switch-item" v-if="showHeaderProp">
              <ScTooltip content="是否显示卡片头部" placement="left">
                <span>showHeader 显示头部</span>
              </ScTooltip>
              <ScSwitch v-model="config.showHeader" />
            </div>
          </div>
        </ScForm>
      </div>

      <!-- 右侧：预览和结果 -->
      <div class="preview-panel">
        <h3 class="panel-title">
          <IconifyIconOnline icon="ri:eye-line" />
          效果预览
        </h3>

        <div class="preview-area">
          <ScCard
            :layout="config.layout"
            :theme="config.theme"
            :title="config.title"
            :subtitle="config.subtitle"
            :icon="config.icon"
            :value="config.value"
            :label="config.label"
            :trend-text="config.trendText"
            :trend-icon="config.trendIcon"
            :shadow="config.shadow"
            :hoverable="config.hoverable"
            :active="config.active"
            :counting="config.counting"
            :show-header="config.showHeader"
            class="preview-card"
          >
            <!-- compact/default 布局的内容 -->
            <template v-if="config.layout === 'compact' || config.layout === 'default'">
              <div class="info-row">
                <IconifyIconOnline icon="ri:time-line" class="info-icon" />
                <span class="info-text">创建时间: 2025-12-07</span>
              </div>
              <div class="info-row">
                <IconifyIconOnline icon="ri:user-line" class="info-icon" />
                <span class="info-text">创建人: Admin</span>
              </div>
            </template>

            <!-- compact 布局的状态和底部 -->
            <template v-if="config.layout === 'compact'" #status>
              <ScTag :type="config.active ? 'success' : 'info'" size="small">
                {{ config.active ? '在线' : '离线' }}
              </ScTag>
            </template>
            <template v-if="config.layout === 'compact'" #footer>
              <ScButton size="small">详情</ScButton>
              <ScButton size="small" type="primary">操作</ScButton>
            </template>

            <!-- media 布局的媒体内容 -->
            <template v-if="config.layout === 'media'" #media>
              <div class="media-placeholder">
                <IconifyIconOnline icon="ri:image-line" />
              </div>
            </template>

            <!-- header-content 布局的头部操作 -->
            <template v-if="config.layout === 'header-content'" #header-right>
              <ScButton size="small" type="primary">操作</ScButton>
            </template>
          </ScCard>
        </div>

        <div class="code-area">
          <h4 class="code-title">
            <IconifyIconOnline icon="ri:code-s-slash-line" />
            示例代码
          </h4>
          <pre class="code-content"><code>{{ generatedCode }}</code></pre>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed } from "vue";
import ScCard from "@repo/components/ScCard/index.vue";
import ScSelect from "@repo/components/ScSelect/index.vue";
import { IconifyIconOnline } from "@repo/components/ReIcon";

// 布局选项
const layoutOptions = [
  { label: "默认", value: "default", icon: "ri:layout-line" },
  { label: "紧凑", value: "compact", icon: "ri:layout-grid-line" },
  { label: "统计", value: "stats", icon: "ri:bar-chart-line" },
  { label: "媒体", value: "media", icon: "ri:image-line" },
  { label: "头部", value: "header-content", icon: "ri:layout-top-line" },
  { label: "3D", value: "panel-3d", icon: "ri:box-3-line" },
  { label: "科技", value: "tech", icon: "ri:cpu-line" }
];

// 主题选项
const themeOptions = [
  { label: "默认", value: "default", icon: "ri:palette-line" },
  { label: "主色", value: "primary", icon: "ri:drop-fill" },
  { label: "成功", value: "success", icon: "ri:checkbox-circle-fill" },
  { label: "警告", value: "warning", icon: "ri:error-warning-fill" },
  { label: "危险", value: "danger", icon: "ri:close-circle-fill" },
  { label: "信息", value: "info", icon: "ri:information-fill" }
];

// 阴影选项
const shadowOptions = [
  { label: "始终", value: "always", icon: "ri:contrast-drop-line" },
  { label: "悬停", value: "hover", icon: "ri:cursor-line" },
  { label: "无", value: "never", icon: "ri:subtract-line" }
];

/**
 * ScCard 组件示例 - 动态属性调试
 */

// 配置项
const config = reactive({
  layout: "compact" as "default" | "compact" | "stats" | "media" | "header-content" | "panel-3d" | "tech",
  theme: "primary" as "default" | "primary" | "success" | "warning" | "danger" | "info",
  title: "示例卡片",
  subtitle: "这是副标题描述",
  icon: "ri:folder-line",
  value: 1234,
  label: "总数量",
  trendText: "+12.5%",
  trendIcon: "ri:arrow-up-line",
  shadow: "hover" as "always" | "hover" | "never",
  hoverable: true,
  active: false,
  counting: false,
  showHeader: true
});

// 布局切换时重置相关配置
function handleLayoutChange(layout: string) {
  if (layout === "stats") {
    config.icon = "ri:bar-chart-line";
    config.title = "";
  } else if (layout === "compact") {
    config.icon = "ri:folder-line";
    config.title = "示例卡片";
  } else if (layout === "media") {
    config.icon = "";
    config.title = "媒体卡片";
  } else {
    config.icon = "ri:home-line";
    config.title = "卡片标题";
  }
}

// 是否显示副标题配置
const showSubtitle = computed(() => {
  return ["compact", "media"].includes(config.layout);
});

// 是否显示统计相关配置
const showStatsProps = computed(() => {
  return config.layout === "stats";
});

// 是否显示头部开关
const showHeaderProp = computed(() => {
  return ["panel-3d", "tech"].includes(config.layout);
});

// 生成示例代码
const generatedCode = computed(() => {
  const props: string[] = [];

  props.push(`layout="${config.layout}"`);

  if (config.theme !== "default") {
    props.push(`theme="${config.theme}"`);
  }

  if (config.title) {
    props.push(`title="${config.title}"`);
  }

  if (showSubtitle.value && config.subtitle) {
    props.push(`subtitle="${config.subtitle}"`);
  }

  if (config.icon) {
    props.push(`icon="${config.icon}"`);
  }

  if (showStatsProps.value) {
    props.push(`:value="${config.value}"`);
    if (config.label) props.push(`label="${config.label}"`);
    if (config.trendText) props.push(`trend-text="${config.trendText}"`);
    if (config.trendIcon) props.push(`trend-icon="${config.trendIcon}"`);
    if (config.counting) props.push("counting");
  }

  if (config.shadow !== "hover") {
    props.push(`shadow="${config.shadow}"`);
  }

  if (!config.hoverable) props.push(":hoverable=\"false\"");
  if (config.active) props.push("active");
  if (showHeaderProp.value && !config.showHeader) props.push(":show-header=\"false\"");

  const propsStr = props.length > 0 ? "\n  " + props.join("\n  ") + "\n" : " ";

  let content = "";
  if (config.layout === "compact") {
    content = `
  <div class="info-row">
    <IconifyIconOnline icon="ri:time-line" />
    <span>创建时间: 2025-12-07</span>
  </div>
  <template #footer>
    <ScButton size="small" type="primary">操作</ScButton>
  </template>
`;
  }

  return `<ScCard${propsStr}>${content}</ScCard>`;
});
</script>

<style scoped lang="scss">
.sc-card-example {
  padding: 20px;
}

.example-container {
  display: flex;
  gap: 24px;

  @media (max-width: 900px) {
    flex-direction: column;
  }
}

.config-panel {
  width: 320px;
  flex-shrink: 0;
  background: var(--el-bg-color);
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 8px;
  padding: 20px;

  @media (max-width: 900px) {
    width: 100%;
  }
}

.preview-panel {
  flex: 1;
  min-width: 0;
  background: var(--el-bg-color);
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 8px;
  padding: 20px;
}

.panel-title {
  display: flex;
  align-items: center;
  gap: 8px;
  margin: 0 0 20px;
  font-size: 16px;
  font-weight: 600;
  color: var(--el-text-color-primary);

  .iconify {
    color: var(--el-color-primary);
  }
}

.switch-group {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.switch-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 13px;
  color: var(--el-text-color-regular);

  span {
    cursor: help;
    border-bottom: 1px dashed var(--el-border-color);
  }
}

.preview-area {
  padding: 40px;
  background: var(--el-fill-color-lighter);
  border-radius: 8px;
  display: flex;
  justify-content: center;
  align-items: flex-start;
  min-height: 200px;
}

.preview-card {
  width: 100%;
  max-width: 360px;
}

.code-area {
  margin-top: 20px;
}

.code-title {
  display: flex;
  align-items: center;
  gap: 6px;
  margin: 0 0 12px;
  font-size: 14px;
  font-weight: 500;
  color: var(--el-text-color-primary);

  .iconify {
    color: var(--el-color-primary);
  }
}

.code-content {
  margin: 0;
  padding: 16px;
  background: #1e1e1e;
  border-radius: 6px;
  overflow-x: auto;

  code {
    font-size: 13px;
    font-family: "SF Mono", "Monaco", "Consolas", monospace;
    color: #d4d4d4;
    line-height: 1.6;
  }
}

// 预览卡片内容样式
.info-row {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 4px 0;

  .info-icon {
    color: var(--el-text-color-placeholder);
    font-size: 14px;
  }

  .info-text {
    font-size: 13px;
    color: var(--el-text-color-regular);
  }
}

.media-placeholder {
  width: 100%;
  height: 100%;
  min-height: 120px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--el-fill-color-light);
  color: var(--el-text-color-placeholder);
  font-size: 32px;
}

:deep(.el-form-item) {
  margin-bottom: 16px;
}

:deep(.el-divider) {
  margin: 16px 0;
}

:deep(.el-select) {
  width: 100%;
}
</style>
