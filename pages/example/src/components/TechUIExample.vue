<template>
  <div class="techui-example">
    <h2 class="example-title">TechUI 科幻风格组件</h2>
    <p class="example-desc">基于 @techui/scifi 的科幻风格组件封装，支持多种变体和自定义配置</p>

    <!-- TechButton 示例 -->
    <el-divider content-position="left">TechButton 科幻按钮</el-divider>
    <div class="demo-section">
      <h4>按钮变体 A1 (variant: A1, appearance: A/B/C)</h4>
      <div class="demo-row">
        <TechButton variant="A1" appearance="A" @click="handleClick('A1-A')">A1 Normal</TechButton>
        <TechButton variant="A1" appearance="A" class="is-active">A1 Active</TechButton>
        <TechButton variant="A1" appearance="A" disabled>A1 Disabled</TechButton>
        <TechButton variant="A1" appearance="A" size="large" :glow-opacity="1">A1 Large</TechButton>
        <TechButton variant="A1" appearance="A" size="small" decoration-color-alt :scale-action="false">A1 Small</TechButton>
        <TechButton variant="A1" appearance="A" class-name="sfb-custom" :background-opacity="0.5">A1 Custom</TechButton>
      </div>
      <div class="demo-row">
        <TechButton variant="A1" appearance="B">A1-B Normal</TechButton>
        <TechButton variant="A1" appearance="B" class="is-active">A1-B Active</TechButton>
        <TechButton variant="A1" appearance="B" disabled>A1-B Disabled</TechButton>
        <TechButton variant="A1" appearance="B" size="large">A1-B Large</TechButton>
        <TechButton variant="A1" appearance="B" size="small" decoration-color-alt :scale-action="false">A1-B Small</TechButton>
        <TechButton variant="A1" appearance="B" class-name="sfb-custom">A1-B Custom</TechButton>
      </div>
      <div class="demo-row">
        <TechButton variant="A1" appearance="C">A1-C Normal</TechButton>
        <TechButton variant="A1" appearance="C" class="is-active">A1-C Active</TechButton>
        <TechButton variant="A1" appearance="C" disabled>A1-C Disabled</TechButton>
        <TechButton variant="A1" appearance="C" size="large">A1-C Large</TechButton>
        <TechButton variant="A1" appearance="C" size="small" decoration-color-alt :scale-action="false">A1-C Small</TechButton>
        <TechButton variant="A1" appearance="C" class-name="sfb-custom" disabled>A1-C Custom</TechButton>
      </div>
      <div class="demo-row">
        <TechButton variant="A1" :glow="false">A1 No Glow</TechButton>
      </div>

      <h4>按钮变体 A2 (variant: A2, appearance: A/B)</h4>
      <div class="demo-row">
        <TechButton variant="A2" appearance="A">A2 Normal</TechButton>
        <TechButton variant="A2" appearance="A" class="is-active">A2 Active</TechButton>
        <TechButton variant="A2" appearance="A" disabled>A2 Disabled</TechButton>
        <TechButton variant="A2" appearance="A" size="large" :glow-opacity="1">A2 Large</TechButton>
        <TechButton variant="A2" appearance="A" size="small" decoration-color-alt :scale-action="false" :glow-opacity="1">A2 Small</TechButton>
        <TechButton variant="A2" appearance="A" class-name="sfb-custom">A2 Custom</TechButton>
      </div>
      <div class="demo-row">
        <TechButton variant="A2" appearance="B">A2-B Normal</TechButton>
        <TechButton variant="A2" appearance="B" class="is-active">A2-B Active</TechButton>
        <TechButton variant="A2" appearance="B" disabled>A2-B Disabled</TechButton>
        <TechButton variant="A2" appearance="B" size="large">A2-B Large</TechButton>
        <TechButton variant="A2" appearance="B" size="small" decoration-color-alt :scale-action="false">A2-B Small</TechButton>
        <TechButton variant="A2" appearance="B" class-name="sfb-custom">A2-B Custom</TechButton>
      </div>
      <div class="demo-row">
        <TechButton variant="A2" :glow="false">A2 No Glow</TechButton>
      </div>

      <h4>按钮变体 A3 (variant: A3, appearance: A/B)</h4>
      <div class="demo-row">
        <TechButton variant="A3" appearance="A">A3 Normal</TechButton>
        <TechButton variant="A3" appearance="A" class="is-active">A3 Active</TechButton>
        <TechButton variant="A3" appearance="A" disabled>A3 Disabled</TechButton>
        <TechButton variant="A3" appearance="A" size="large" :glow-opacity="1">A3 Large</TechButton>
        <TechButton variant="A3" appearance="A" size="small" decoration-color-alt :scale-action="false" :glow-opacity="1">A3 Small</TechButton>
        <TechButton variant="A3" appearance="A" class-name="sfb-custom">A3 Custom</TechButton>
      </div>
      <div class="demo-row">
        <TechButton variant="A3" appearance="B">A3-B Normal</TechButton>
        <TechButton variant="A3" appearance="B" class="is-active">A3-B Active</TechButton>
        <TechButton variant="A3" appearance="B" disabled>A3-B Disabled</TechButton>
        <TechButton variant="A3" appearance="B" size="large">A3-B Large</TechButton>
        <TechButton variant="A3" appearance="B" size="small" decoration-color-alt :scale-action="false">A3-B Small</TechButton>
        <TechButton variant="A3" appearance="B" class-name="sfb-custom">A3-B Custom</TechButton>
      </div>
      <div class="demo-row">
        <TechButton variant="A3" :glow="false">A3 No Glow</TechButton>
      </div>

      <h4>按钮变体 A4 (variant: A4, appearance: A/B)</h4>
      <div class="demo-row">
        <TechButton variant="A4" appearance="A">A4 Normal</TechButton>
        <TechButton variant="A4" appearance="A" class="is-active">A4 Active</TechButton>
        <TechButton variant="A4" appearance="A" disabled>A4 Disabled</TechButton>
        <TechButton variant="A4" appearance="A" size="large">A4 Large</TechButton>
        <TechButton variant="A4" appearance="A" size="small" decoration-color-alt :scale-action="false">A4 Small</TechButton>
        <TechButton variant="A4" appearance="A" class-name="sfb-custom">A4 Custom</TechButton>
      </div>
      <div class="demo-row">
        <TechButton variant="A4" appearance="B">A4-B Normal</TechButton>
        <TechButton variant="A4" appearance="B" class="is-active">A4-B Active</TechButton>
        <TechButton variant="A4" appearance="B" disabled>A4-B Disabled</TechButton>
        <TechButton variant="A4" appearance="B" size="large">A4-B Large</TechButton>
        <TechButton variant="A4" appearance="B" size="small" decoration-color-alt :scale-action="false">A4-B Small</TechButton>
        <TechButton variant="A4" appearance="B" class-name="sfb-custom">A4-B Custom</TechButton>
      </div>
      <div class="demo-row">
        <TechButton variant="A4" :glow="false">A4 No Glow</TechButton>
      </div>

      <h4>按钮变体 A5 (variant: A5, appearance: A/B)</h4>
      <div class="demo-row">
        <TechButton variant="A5" appearance="A">A5 Normal</TechButton>
        <TechButton variant="A5" appearance="A" class="is-active">A5 Active</TechButton>
        <TechButton variant="A5" appearance="A" disabled>A5 Disabled</TechButton>
        <TechButton variant="A5" appearance="A" size="large">A5 Large</TechButton>
        <TechButton variant="A5" appearance="A" size="small" decoration-color-alt>A5 Small</TechButton>
        <TechButton variant="A5" appearance="A" direction-alt class-name="sfb-custom">A5 Custom</TechButton>
      </div>
      <div class="demo-row">
        <TechButton variant="A5" appearance="B">A5-B Normal</TechButton>
        <TechButton variant="A5" appearance="B" class="is-active">A5-B Active</TechButton>
        <TechButton variant="A5" appearance="B" disabled>A5-B Disabled</TechButton>
        <TechButton variant="A5" appearance="B" size="large">A5-B Large</TechButton>
        <TechButton variant="A5" appearance="B" size="small" decoration-color-alt>A5-B Small</TechButton>
        <TechButton variant="A5" appearance="B" direction-alt class-name="sfb-custom">A5-B Custom</TechButton>
      </div>
      <div class="demo-row">
        <TechButton variant="A5" :glow="false">A5 No Glow</TechButton>
      </div>
    </div>

    <!-- TechPanel 示例 -->
    <el-divider content-position="left">TechPanel 科幻面板</el-divider>
    <div class="demo-section">
      <h4>面板变体 A 系列 (variant: A1-A3)</h4>
      <div class="demo-grid panel-grid">
        <TechPanel variant="A1" title="Panel A1" :height="180">
          <div class="panel-content">面板内容区域</div>
        </TechPanel>
        <TechPanel variant="A2" title="Panel A2" :height="180">
          <div class="panel-content">面板内容区域</div>
        </TechPanel>
        <TechPanel variant="A3" title="Panel A3" :height="180">
          <div class="panel-content">面板内容区域</div>
        </TechPanel>
      </div>

      <h4>面板变体 B 系列 (variant: B1-B4)</h4>
      <div class="demo-grid panel-grid">
        <TechPanel variant="B1" title="Panel B1" :height="180">
          <div class="panel-content">面板内容区域</div>
        </TechPanel>
        <TechPanel variant="B2" title="Panel B2" :height="180">
          <div class="panel-content">面板内容区域</div>
        </TechPanel>
        <TechPanel variant="B3" title="Panel B3" :height="180">
          <div class="panel-content">面板内容区域</div>
        </TechPanel>
        <TechPanel variant="B4" title="Panel B4" :height="180">
          <div class="panel-content">面板内容区域</div>
        </TechPanel>
      </div>

      <h4>面板自定义配置</h4>
      <div class="demo-grid">
        <TechPanel variant="A1" title="高透明度背景" :height="150" :background-opacity="0.8">
          <div class="panel-content">backgroundOpacity: 0.8</div>
        </TechPanel>
        <TechPanel variant="A1" title="强发光效果" :height="150" :glow-opacity="1">
          <div class="panel-content">glowOpacity: 1</div>
        </TechPanel>
        <TechPanel variant="A1" title="装饰色替换" :height="150" decoration-color-alt>
          <div class="panel-content">decorationColorAlt: true</div>
        </TechPanel>
      </div>
    </div>

    <!-- TechHeader 示例 -->
    <el-divider content-position="left">TechHeader 科幻头部</el-divider>
    <div class="demo-section">
      <h4>头部变体 (variant: A1-A4)</h4>
      <div class="demo-col">
        <TechHeader variant="A1" title="系统控制中心 A1" sub-title="SYSTEM CONTROL CENTER" />
        <TechHeader variant="A2" title="数据监控平台 A2" sub-title="DATA MONITORING PLATFORM" />
        <TechHeader variant="A3" title="智能分析系统 A3" sub-title="INTELLIGENT ANALYSIS SYSTEM" />
        <TechHeader variant="A4" title="资源调度中心 A4" sub-title="RESOURCE SCHEDULING CENTER" />
      </div>

      <h4>头部自定义配置</h4>
      <div class="demo-col">
        <TechHeader variant="A1" title="高透明度背景" sub-title="BACKGROUND OPACITY 0.8" :background-opacity="0.8" />
        <TechHeader variant="A1" title="强发光效果" sub-title="GLOW OPACITY 1" :glow-opacity="1" />
        <TechHeader variant="A1" title="装饰色替换" sub-title="DECORATION COLOR ALT" decoration-color-alt />
      </div>
    </div>

    <!-- TechPanelTitle 示例 -->
    <el-divider content-position="left">TechPanelTitle 科幻标题</el-divider>
    <div class="demo-section">
      <h4>标题变体 (variant: A1-A3)</h4>
      <div class="demo-col">
        <TechPanelTitle variant="A1" title="数据统计 A1" />
        <TechPanelTitle variant="A2" title="系统监控 A2" />
        <TechPanelTitle variant="A3" title="实时预警 A3" />
      </div>

      <h4>标题自定义配置</h4>
      <div class="demo-col">
        <TechPanelTitle variant="A1" title="强发光效果" :glow-opacity="1" />
        <TechPanelTitle variant="A1" title="装饰色替换" decoration-color-alt />
      </div>
    </div>

    <!-- TechDeco 示例 -->
    <el-divider content-position="left">TechDeco 科幻装饰</el-divider>
    <div class="demo-section">
      <h4>可用装饰变体 (variant: A1, B1-B3, D1)</h4>
      <div class="demo-row deco-row">
        <div class="deco-item">
          <TechDeco variant="A1" :width="120" :height="40" />
          <span>Deco A1</span>
        </div>
        <div class="deco-item">
          <TechDeco variant="B1" :width="120" :height="40" />
          <span>Deco B1</span>
        </div>
        <div class="deco-item">
          <TechDeco variant="B2" :width="120" :height="40" />
          <span>Deco B2</span>
        </div>
        <div class="deco-item">
          <TechDeco variant="B3" :width="120" :height="40" />
          <span>Deco B3</span>
        </div>
        <div class="deco-item">
          <TechDeco variant="D1" :width="120" :height="40" />
          <span>Deco D1</span>
        </div>
      </div>

      <h4>装饰自定义配置</h4>
      <div class="demo-row deco-row">
        <div class="deco-item">
          <TechDeco variant="A1" :width="120" :height="40" :animation="false" />
          <span>无动画</span>
        </div>
        <div class="deco-item">
          <TechDeco variant="A1" :width="120" :height="40" decoration-color-alt />
          <span>装饰色替换</span>
        </div>
        <div class="deco-item">
          <TechDeco variant="A1" :width="120" :height="40" :glow-opacity="1" />
          <span>强发光</span>
        </div>
      </div>
    </div>

    <!-- TechGeometry 示例 -->
    <el-divider content-position="left">TechGeometry 科幻几何</el-divider>
    <div class="demo-section">
      <h4>几何形状 (variant: Rectangle, Triangle, Parallelogram, Trapezoid, Hexagon)</h4>
      <div class="demo-row geometry-row">
        <div class="geometry-item">
          <TechGeometry variant="Rectangle" :width="100" :height="100" />
          <span>矩形</span>
        </div>
        <div class="geometry-item">
          <TechGeometry variant="Triangle" :width="100" :height="100" />
          <span>三角形</span>
        </div>
        <div class="geometry-item">
          <TechGeometry variant="Parallelogram" :width="100" :height="100" />
          <span>平行四边形</span>
        </div>
        <div class="geometry-item">
          <TechGeometry variant="Trapezoid" :width="100" :height="100" />
          <span>梯形</span>
        </div>
        <div class="geometry-item">
          <TechGeometry variant="Hexagon" :width="100" :height="100" />
          <span>六边形</span>
        </div>
      </div>

      <h4>几何自定义配置</h4>
      <div class="demo-row geometry-row">
        <div class="geometry-item">
          <TechGeometry variant="Rectangle" :width="100" :height="100" :animation="false" />
          <span>无动画</span>
        </div>
        <div class="geometry-item">
          <TechGeometry variant="Rectangle" :width="100" :height="100" decoration-color-alt />
          <span>装饰色替换</span>
        </div>
        <div class="geometry-item">
          <TechGeometry variant="Rectangle" :width="100" :height="100" :glow-opacity="1" />
          <span>强发光</span>
        </div>
      </div>
    </div>

    <!-- 综合布局示例 -->
    <el-divider content-position="left">综合布局示例</el-divider>
    <div class="demo-section layout-demo">
      <TechHeader variant="A1" title="科幻数据大屏" sub-title="SCI-FI DATA DASHBOARD" />
      
      <div class="layout-content">
        <TechPanel variant="A1" title="左侧面板" :height="300" class="layout-panel">
          <div class="panel-inner">
            <TechPanelTitle variant="A1" title="数据统计" />
            <div class="stats-row">
              <div class="stat-item">
                <span class="stat-value">1,234</span>
                <span class="stat-label">在线用户</span>
              </div>
              <div class="stat-item">
                <span class="stat-value">567</span>
                <span class="stat-label">活跃设备</span>
              </div>
            </div>
            <TechDeco variant="A1" :width="'100%'" :height="30" />
          </div>
        </TechPanel>
        
        <TechPanel variant="A2" title="中间面板" :height="300" class="layout-panel center-panel">
          <div class="panel-inner center-content">
            <TechGeometry variant="Hexagon" :width="150" :height="150" />
            <div class="center-text">
              <h3>系统运行正常</h3>
              <p>SYSTEM RUNNING NORMALLY</p>
            </div>
          </div>
        </TechPanel>
        
        <TechPanel variant="A3" title="右侧面板" :height="300" class="layout-panel">
          <div class="panel-inner">
            <TechPanelTitle variant="A2" title="快捷操作" />
            <div class="action-buttons">
              <TechButton variant="A1" size="small">启动服务</TechButton>
              <TechButton variant="A2" size="small">停止服务</TechButton>
              <TechButton variant="A3" size="small">重启系统</TechButton>
              <TechButton variant="A4" size="small" disabled>维护模式</TechButton>
            </div>
          </div>
        </TechPanel>
      </div>
    </div>

    <!-- 代码示例 -->
    <el-divider content-position="left">代码示例</el-divider>
    <CodePreview :tabs="codeTabs" />

    <!-- 属性说明 -->
    <el-divider content-position="left">TechButton 属性</el-divider>
    <el-table :data="buttonProps" border stripe>
      <el-table-column prop="name" label="属性" width="180" />
      <el-table-column prop="type" label="类型" width="250" />
      <el-table-column prop="default" label="默认值" width="120" />
      <el-table-column prop="desc" label="说明" />
    </el-table>

    <el-divider content-position="left">TechPanel 属性</el-divider>
    <el-table :data="panelProps" border stripe>
      <el-table-column prop="name" label="属性" width="180" />
      <el-table-column prop="type" label="类型" width="250" />
      <el-table-column prop="default" label="默认值" width="120" />
      <el-table-column prop="desc" label="说明" />
    </el-table>

    <el-divider content-position="left">TechHeader 属性</el-divider>
    <el-table :data="headerProps" border stripe>
      <el-table-column prop="name" label="属性" width="180" />
      <el-table-column prop="type" label="类型" width="250" />
      <el-table-column prop="default" label="默认值" width="120" />
      <el-table-column prop="desc" label="说明" />
    </el-table>

    <el-divider content-position="left">TechDeco 属性</el-divider>
    <el-table :data="decoProps" border stripe>
      <el-table-column prop="name" label="属性" width="180" />
      <el-table-column prop="type" label="类型" width="250" />
      <el-table-column prop="default" label="默认值" width="120" />
      <el-table-column prop="desc" label="说明" />
    </el-table>

    <el-divider content-position="left">TechGeometry 属性</el-divider>
    <el-table :data="geometryProps" border stripe>
      <el-table-column prop="name" label="属性" width="180" />
      <el-table-column prop="type" label="类型" width="350" />
      <el-table-column prop="default" label="默认值" width="120" />
      <el-table-column prop="desc" label="说明" />
    </el-table>

    <el-divider content-position="left">TechPanelTitle 属性</el-divider>
    <el-table :data="panelTitleProps" border stripe>
      <el-table-column prop="name" label="属性" width="180" />
      <el-table-column prop="type" label="类型" width="250" />
      <el-table-column prop="default" label="默认值" width="120" />
      <el-table-column prop="desc" label="说明" />
    </el-table>
  </div>
</template>

<script setup lang="ts">
import { ref } from "vue";
import { message } from "@repo/utils";
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
  message(`点击了 ${variant} 按钮`, { type: "success" });
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
  { name: "glowOpacity", type: "number", default: "0.5", desc: "发光透明度 (0-1)" },
  { name: "backgroundOpacity", type: "number", default: "0.5", desc: "背景透明度 (0-1)" },
  { name: "decorationColorAlt", type: "boolean", default: "false", desc: "装饰颜色替换 (使用备用色)" },
  { name: "scaleAction", type: "boolean", default: "true", desc: "是否启用点击缩放动画" },
  { name: "directionAlt", type: "boolean", default: "false", desc: "方向替换 (仅 A5 支持)" },
  { name: "className", type: "string", default: "''", desc: "自定义类名" },
];

const panelProps = [
  { name: "variant", type: "'A1'-'A3' | 'B1'-'B4' | 'DV1'-'DV9'", default: "'A1'", desc: "面板变体样式" },
  { name: "title", type: "string", default: "''", desc: "面板标题" },
  { name: "width", type: "string | number", default: "'100%'", desc: "面板宽度" },
  { name: "height", type: "string | number", default: "'auto'", desc: "面板高度" },
  { name: "glow", type: "boolean", default: "true", desc: "是否显示发光效果" },
  { name: "glowOpacity", type: "number", default: "0.5", desc: "发光透明度 (0-1)" },
  { name: "backgroundOpacity", type: "number", default: "0.5", desc: "背景透明度 (0-1)" },
  { name: "decorationColorAlt", type: "boolean", default: "false", desc: "装饰颜色替换" },
  { name: "className", type: "string", default: "''", desc: "自定义类名" },
];

const headerProps = [
  { name: "variant", type: "'A1' | 'A2' | 'A3' | 'A4'", default: "'A1'", desc: "头部变体样式" },
  { name: "title", type: "string", default: "''", desc: "主标题" },
  { name: "subTitle", type: "string", default: "''", desc: "副标题" },
  { name: "glow", type: "boolean", default: "true", desc: "是否显示发光效果" },
  { name: "glowOpacity", type: "number", default: "0.5", desc: "发光透明度 (0-1)" },
  { name: "backgroundOpacity", type: "number", default: "0.5", desc: "背景透明度 (0-1)" },
  { name: "decorationColorAlt", type: "boolean", default: "false", desc: "装饰颜色替换" },
  { name: "className", type: "string", default: "''", desc: "自定义类名" },
];

const decoProps = [
  { name: "variant", type: "'A1' | 'B1'-'B3' | 'D1'", default: "'A1'", desc: "装饰变体样式" },
  { name: "width", type: "string | number", default: "'100%'", desc: "宽度" },
  { name: "height", type: "string | number", default: "'auto'", desc: "高度" },
  { name: "glow", type: "boolean", default: "true", desc: "是否显示发光效果" },
  { name: "glowOpacity", type: "number", default: "0.5", desc: "发光透明度 (0-1)" },
  { name: "decorationColorAlt", type: "boolean", default: "false", desc: "装饰颜色替换" },
  { name: "animation", type: "boolean", default: "true", desc: "是否启用动画效果" },
  { name: "className", type: "string", default: "''", desc: "自定义类名" },
];

const geometryProps = [
  { name: "variant", type: "'Rectangle' | 'Triangle' | 'Parallelogram' | 'Trapezoid' | 'Hexagon'", default: "'Rectangle'", desc: "几何形状" },
  { name: "width", type: "string | number", default: "'100%'", desc: "宽度" },
  { name: "height", type: "string | number", default: "'auto'", desc: "高度" },
  { name: "glow", type: "boolean", default: "true", desc: "是否显示发光效果" },
  { name: "glowOpacity", type: "number", default: "0.5", desc: "发光透明度 (0-1)" },
  { name: "decorationColorAlt", type: "boolean", default: "false", desc: "装饰颜色替换" },
  { name: "animation", type: "boolean", default: "true", desc: "是否启用动画效果" },
  { name: "className", type: "string", default: "''", desc: "自定义类名" },
];

const panelTitleProps = [
  { name: "variant", type: "'A1' | 'A2' | 'A3'", default: "'A1'", desc: "标题变体样式" },
  { name: "title", type: "string", default: "''", desc: "标题文本" },
  { name: "glow", type: "boolean", default: "true", desc: "是否显示发光效果" },
  { name: "glowOpacity", type: "number", default: "0.5", desc: "发光透明度 (0-1)" },
  { name: "decorationColorAlt", type: "boolean", default: "false", desc: "装饰颜色替换" },
  { name: "className", type: "string", default: "''", desc: "自定义类名" },
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
  grid-template-columns: repeat(5, 1fr);
  gap: 20px;
  margin-bottom: 24px;

  &:last-child {
    margin-bottom: 0;
  }
  
  &.panel-grid {
    grid-template-columns: repeat(4, 1fr);
  }
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

// 综合布局示例样式
.layout-demo {
  background: rgba(0, 50, 100, 0.2);
  padding: 0;
  overflow: hidden;

  .layout-content {
    display: grid;
    grid-template-columns: 1fr 1.5fr 1fr;
    gap: 20px;
    padding: 20px;
  }

  .layout-panel {
    margin: 0;
  }

  .center-panel {
    .center-content {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      height: 100%;
    }

    .center-text {
      text-align: center;
      margin-top: 16px;

      h3 {
        color: #00f6ff;
        font-size: 18px;
        margin: 0 0 8px 0;
      }

      p {
        color: rgba(255, 255, 255, 0.6);
        font-size: 12px;
        margin: 0;
      }
    }
  }

  .panel-inner {
    padding: 16px;
    height: 100%;
    display: flex;
    flex-direction: column;
    gap: 16px;
  }

  .stats-row {
    display: flex;
    justify-content: space-around;
    flex: 1;

    .stat-item {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;

      .stat-value {
        font-size: 28px;
        font-weight: bold;
        color: #00f6ff;
        text-shadow: 0 0 10px rgba(0, 246, 255, 0.5);
      }

      .stat-label {
        font-size: 12px;
        color: rgba(255, 255, 255, 0.6);
        margin-top: 4px;
      }
    }
  }

  .action-buttons {
    display: flex;
    flex-direction: column;
    gap: 12px;
    flex: 1;
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
