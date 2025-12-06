<template>
  <div class="techui-example">
    <h2 class="example-title">TechUI 科幻风格组件</h2>
    <p class="example-desc">基于 @techui/scifi 的科幻风格组件封装，支持多种变体和自定义配置</p>

    <!-- TechButton 示例 -->
    <el-divider content-position="left">TechButton 科幻按钮</el-divider>
    <div class="demo-section">
      <h4>按钮变体 (variant: A1-A5)</h4>
      <div class="demo-row">
        <TechButton variant="A1" @click="handleClick('A1')">ButtonA1</TechButton>
        <TechButton variant="A2" @click="handleClick('A2')">ButtonA2</TechButton>
        <TechButton variant="A3" @click="handleClick('A3')">ButtonA3</TechButton>
        <TechButton variant="A4" @click="handleClick('A4')">ButtonA4</TechButton>
        <TechButton variant="A5" @click="handleClick('A5')">ButtonA5</TechButton>
      </div>

      <h4>外观变体 (appearance: A/B/C)</h4>
      <div class="demo-row">
        <TechButton variant="A1" appearance="A">Appearance A</TechButton>
        <TechButton variant="A1" appearance="B">Appearance B</TechButton>
        <TechButton variant="A1" appearance="C">Appearance C</TechButton>
      </div>

      <h4>尺寸 (size)</h4>
      <div class="demo-row">
        <TechButton variant="A1" size="small">Small</TechButton>
        <TechButton variant="A1" size="default">Default</TechButton>
        <TechButton variant="A1" size="large">Large</TechButton>
      </div>

      <h4>状态</h4>
      <div class="demo-row">
        <TechButton variant="A1">Normal</TechButton>
        <TechButton variant="A1" class="is-active">Active</TechButton>
        <TechButton variant="A1" disabled>Disabled</TechButton>
        <TechButton variant="A1" :glow="false">No Glow</TechButton>
      </div>

      <h4>自定义样式</h4>
      <div class="demo-row">
        <TechButton variant="A1" :background-opacity="0.8">背景透明度 0.8</TechButton>
        <TechButton variant="A1" :glow-opacity="1">发光透明度 1</TechButton>
        <TechButton variant="A1" decoration-color-alt>装饰色替换</TechButton>
      </div>
    </div>

    <!-- TechPanel 示例 -->
    <el-divider content-position="left">TechPanel 科幻面板</el-divider>
    <div class="demo-section">
      <h4>面板变体</h4>
      <div class="demo-grid">
        <TechPanel variant="A1" title="Panel A1" :height="200">
          <div class="panel-content">面板内容区域</div>
        </TechPanel>
        <TechPanel variant="A2" title="Panel A2" :height="200">
          <div class="panel-content">面板内容区域</div>
        </TechPanel>
        <TechPanel variant="A3" title="Panel A3" :height="200">
          <div class="panel-content">面板内容区域</div>
        </TechPanel>
      </div>
    </div>

    <!-- TechHeader 示例 -->
    <el-divider content-position="left">TechHeader 科幻头部</el-divider>
    <div class="demo-section">
      <h4>头部变体</h4>
      <div class="demo-col">
        <TechHeader variant="A1" title="系统控制中心" sub-title="SYSTEM CONTROL CENTER" />
        <TechHeader variant="A2" title="数据监控平台" sub-title="DATA MONITORING PLATFORM" />
        <TechHeader variant="A3" title="智能分析系统" sub-title="INTELLIGENT ANALYSIS SYSTEM" />
      </div>
    </div>

    <!-- TechPanelTitle 示例 -->
    <el-divider content-position="left">TechPanelTitle 科幻标题</el-divider>
    <div class="demo-section">
      <h4>标题变体</h4>
      <div class="demo-col">
        <TechPanelTitle variant="A1" title="数据统计" />
        <TechPanelTitle variant="A2" title="系统监控" />
        <TechPanelTitle variant="A3" title="实时预警" />
      </div>
    </div>

    <!-- TechDeco 示例 -->
    <el-divider content-position="left">TechDeco 科幻装饰</el-divider>
    <div class="demo-section">
      <h4>装饰变体</h4>
      <div class="demo-row deco-row">
        <div class="deco-item">
          <TechDeco variant="A1" :width="120" :height="40" />
          <span>Deco A1</span>
        </div>
        <div class="deco-item">
          <TechDeco variant="A2" :width="120" :height="40" />
          <span>Deco A2</span>
        </div>
        <div class="deco-item">
          <TechDeco variant="A3" :width="120" :height="40" />
          <span>Deco A3</span>
        </div>
      </div>
    </div>

    <!-- TechGeometry 示例 -->
    <el-divider content-position="left">TechGeometry 科幻几何</el-divider>
    <div class="demo-section">
      <h4>几何变体</h4>
      <div class="demo-row geometry-row">
        <div class="geometry-item">
          <TechGeometry variant="A1" :width="100" :height="100" />
          <span>Geometry A1</span>
        </div>
        <div class="geometry-item">
          <TechGeometry variant="A2" :width="100" :height="100" />
          <span>Geometry A2</span>
        </div>
        <div class="geometry-item">
          <TechGeometry variant="A3" :width="100" :height="100" />
          <span>Geometry A3</span>
        </div>
      </div>
    </div>

    <!-- 代码示例 -->
    <el-divider content-position="left">代码示例</el-divider>
    <CodePreview :tabs="codeTabs" />

    <!-- 属性说明 -->
    <el-divider content-position="left">TechButton 属性</el-divider>
    <el-table :data="buttonProps" border stripe>
      <el-table-column prop="name" label="属性" width="180" />
      <el-table-column prop="type" label="类型" width="200" />
      <el-table-column prop="default" label="默认值" width="120" />
      <el-table-column prop="desc" label="说明" />
    </el-table>
  </div>
</template>

<script setup lang="ts">
import { ref } from "vue";
import { ElMessage } from "element-plus";
import { 
  TechButton, 
  TechPanel, 
  TechHeader, 
  TechDeco, 
  TechGeometry,
  TechPanelTitle 
} from "@repo/components/TechUI";
import CodePreview from "./CodePreview.vue";

const handleClick = (variant: string) => {
  ElMessage.success(`点击了 ${variant} 按钮`);
};

// 代码示例
const codeTabs = [
  {
    key: "button",
    label: "TechButton",
    icon: "ri:code-s-slash-line",
    language: "vue",
    code: `<template>
  <!-- 基础用法 -->
  <TechButton variant="A1">科幻按钮</TechButton>
  
  <!-- 外观变体 -->
  <TechButton variant="A1" appearance="B">外观B</TechButton>
  
  <!-- 尺寸 -->
  <TechButton variant="A1" size="large">大按钮</TechButton>
  
  <!-- 禁用状态 -->
  <TechButton variant="A1" disabled>禁用</TechButton>
  
  <!-- 自定义透明度 -->
  <TechButton 
    variant="A1" 
    :background-opacity="0.8"
    :glow-opacity="1"
  >
    自定义样式
  </TechButton>
<\/template>

<script setup>
import { TechButton } from "@repo/components/TechUI";
<\/script>`
  },
  {
    key: "panel",
    label: "TechPanel",
    icon: "ri:layout-line",
    language: "vue",
    code: `<template>
  <TechPanel 
    variant="A1" 
    title="面板标题"
    :height="300"
    :glow="true"
  >
    <div>面板内容</div>
    
    <template #footer>
      <div>底部区域</div>
    </template>
  </TechPanel>
<\/template>

<script setup>
import { TechPanel } from "@repo/components/TechUI";
<\/script>`
  },
  {
    key: "header",
    label: "TechHeader",
    icon: "ri:layout-top-line",
    language: "vue",
    code: `<template>
  <TechHeader 
    variant="A1" 
    title="系统控制中心"
    sub-title="SYSTEM CONTROL CENTER"
  >
    <template #left>
      <span>左侧内容</span>
    </template>
    <template #right>
      <span>右侧内容</span>
    </template>
  </TechHeader>
<\/template>

<script setup>
import { TechHeader } from "@repo/components/TechUI";
<\/script>`
  }
];

// 属性说明
const buttonProps = [
  { name: "variant", type: "'A1' | 'A2' | 'A3' | 'A4' | 'A5'", default: "'A1'", desc: "按钮变体样式" },
  { name: "appearance", type: "'A' | 'B' | 'C'", default: "'A'", desc: "外观变体" },
  { name: "size", type: "'small' | 'default' | 'large'", default: "'default'", desc: "按钮尺寸" },
  { name: "disabled", type: "boolean", default: "false", desc: "是否禁用" },
  { name: "glow", type: "boolean", default: "true", desc: "是否显示发光效果" },
  { name: "glowOpacity", type: "number", default: "0.5", desc: "发光透明度" },
  { name: "backgroundOpacity", type: "number", default: "0.5", desc: "背景透明度" },
  { name: "decorationColorAlt", type: "boolean", default: "false", desc: "装饰颜色替换" },
  { name: "scaleAction", type: "boolean", default: "true", desc: "是否启用缩放动作" },
  { name: "directionAlt", type: "boolean", default: "false", desc: "方向替换" },
];
</script>

<style lang="scss" scoped>
.techui-example {
  padding: 20px;
  background: #0a1628;
  min-height: 100vh;
  color: #fff;
}

.example-title {
  font-size: 24px;
  font-weight: 600;
  margin-bottom: 8px;
  color: #00f6ff;
  text-shadow: 0 0 10px rgba(0, 246, 255, 0.5);
}

.example-desc {
  color: rgba(255, 255, 255, 0.7);
  margin-bottom: 24px;
}

.demo-section {
  background: rgba(0, 100, 200, 0.1);
  border: 1px solid rgba(0, 246, 255, 0.2);
  border-radius: 8px;
  padding: 20px;
  margin-bottom: 24px;

  h4 {
    color: #00f6ff;
    margin: 0 0 16px 0;
    font-size: 14px;
    font-weight: 500;
  }
}

.demo-row {
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
  align-items: center;
  margin-bottom: 24px;

  &:last-child {
    margin-bottom: 0;
  }
}

.demo-col {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.demo-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 20px;
}

.panel-content {
  padding: 20px;
  color: rgba(255, 255, 255, 0.8);
  text-align: center;
}

.deco-row, .geometry-row {
  .deco-item, .geometry-item {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 8px;

    span {
      font-size: 12px;
      color: rgba(255, 255, 255, 0.6);
    }
  }
}

:deep(.el-divider) {
  border-color: rgba(0, 246, 255, 0.3);

  .el-divider__text {
    background: #0a1628;
    color: #00f6ff;
  }
}

:deep(.el-table) {
  --el-table-bg-color: rgba(0, 100, 200, 0.1);
  --el-table-tr-bg-color: transparent;
  --el-table-header-bg-color: rgba(0, 100, 200, 0.2);
  --el-table-border-color: rgba(0, 246, 255, 0.2);
  --el-table-text-color: rgba(255, 255, 255, 0.8);
  --el-table-header-text-color: #00f6ff;
}
</style>
