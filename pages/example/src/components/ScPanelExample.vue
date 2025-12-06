<template>
  <div class="sc-panel-example">
    <!-- 默认主题 -->
    <DemoBlock title="默认主题（基于 el-card）" :code="codes.default">
      <div class="demo-row">
        <ScPanel title="基础面板" icon="ep:document" :width="280">
          <p>这是一个基础面板</p>
        </ScPanel>
        <ScPanel title="可折叠" icon="ep:folder" collapsible :width="280">
          <p>点击左侧箭头折叠</p>
        </ScPanel>
        <ScPanel
          title="可最大化"
          icon="ep:full-screen"
          maximizable
          :width="280"
        >
          <p>点击右上角按钮最大化</p>
        </ScPanel>
      </div>
    </DemoBlock>

    <!-- Modern 现代简约 -->
    <DemoBlock title="Modern 现代简约风格" :code="codes.modern">
      <div class="demo-row">
        <ScPanel
          theme="modern"
          title="现代面板"
          icon="ep:star-filled"
          :width="320"
        >
          <p>简洁无边框，大圆角设计</p>
          <p>适合现代化管理后台</p>
        </ScPanel>
        <ScPanel
          theme="modern"
          title="数据统计"
          icon="ep:data-line"
          :width="320"
        >
          <p>清爽的视觉效果</p>
        </ScPanel>
      </div>
    </DemoBlock>

    <!-- Gradient 渐变主题 -->
    <DemoBlock title="Gradient 渐变主题" :code="codes.gradient">
      <div class="demo-row">
        <ScPanel
          theme="gradient"
          title="渐变面板"
          icon="ep:magic-stick"
          :width="320"
        >
          <p>主题色渐变背景</p>
          <p>适合突出显示重要内容</p>
        </ScPanel>
      </div>
    </DemoBlock>

    <!-- TechUI 数据大屏 -->
    <DemoBlock title="TechUI 数据大屏风格" :code="codes.techui" dark>
      <div class="demo-row">
        <ScPanel
          theme="techui"
          title="系统监控"
          icon="ep:monitor"
          :width="350"
          :height="220"
        >
          <div class="tech-content">
            <div class="data-item">
              <span>CPU</span><span class="value cyan">45.2%</span>
            </div>
            <div class="data-item">
              <span>内存</span><span class="value cyan">6.8GB</span>
            </div>
            <div class="data-item">
              <span>网络</span><span class="value cyan">128MB/s</span>
            </div>
          </div>
        </ScPanel>
        <ScPanel
          theme="techui"
          title="数据分析"
          icon="ep:data-analysis"
          :width="350"
          :height="220"
        >
          <div class="tech-content">
            <div class="data-item">
              <span>访问量</span><span class="value cyan">12,345</span>
            </div>
            <div class="data-item">
              <span>转化率</span><span class="value cyan">23.5%</span>
            </div>
            <div class="data-item">
              <span>在线用户</span><span class="value cyan">892</span>
            </div>
          </div>
        </ScPanel>
      </div>
    </DemoBlock>

    <!-- Tech 科技风格 -->
    <DemoBlock title="Tech 科技风格" :code="codes.tech" dark>
      <div class="demo-row">
        <ScPanel
          theme="tech"
          title="系统状态"
          icon="ep:cpu"
          :width="350"
          :height="220"
        >
          <div class="tech-content">
            <div class="data-item">
              <span>服务器状态</span><span class="value blue">运行中</span>
            </div>
            <div class="data-item">
              <span>响应时间</span><span class="value blue">32ms</span>
            </div>
            <div class="data-item">
              <span>连接数</span><span class="value blue">1,234</span>
            </div>
          </div>
        </ScPanel>
        <ScPanel
          theme="tech"
          title="绿色主题"
          icon="ep:setting"
          :width="350"
          :height="220"
          border-color="rgba(0, 255, 150, 0.4)"
        >
          <div class="tech-content tech-content--green">
            <div class="data-item">
              <span>安全等级</span><span class="value green">高</span>
            </div>
            <div class="data-item">
              <span>威胁检测</span><span class="value green">0</span>
            </div>
            <div class="data-item">
              <span>防护状态</span><span class="value green">已启用</span>
            </div>
          </div>
        </ScPanel>
      </div>
    </DemoBlock>

    <!-- Glass 玻璃拟态 -->
    <DemoBlock title="Glass 玻璃拟态" :code="codes.glass" gradient>
      <div class="demo-row">
        <ScPanel
          theme="glass"
          title="玻璃面板"
          icon="ep:magic-stick"
          :width="300"
          :height="160"
        >
          <p style="color: #fff">毛玻璃效果，适合背景图场景</p>
        </ScPanel>
      </div>
    </DemoBlock>

    <!-- Neon 霓虹风格 -->
    <DemoBlock title="Neon 霓虹风格" :code="codes.neon" dark>
      <div class="demo-row">
        <ScPanel
          theme="neon"
          title="霓虹面板"
          icon="ep:sunny"
          :width="260"
          :height="160"
        >
          <p>呼吸灯效果</p>
        </ScPanel>
        <ScPanel
          theme="neon"
          title="绿色霓虹"
          icon="ep:star"
          :width="260"
          :height="160"
          border-color="#00ff88"
        >
          <p>自定义颜色</p>
        </ScPanel>
        <ScPanel
          theme="neon"
          title="蓝色霓虹"
          icon="ep:lightning"
          :width="260"
          :height="160"
          border-color="#00d4ff"
        >
          <p>蓝色主题</p>
        </ScPanel>
      </div>
    </DemoBlock>

    <!-- Cyber 赛博朋克 -->
    <DemoBlock title="Cyber 赛博朋克风格" :code="codes.cyber" dark>
      <div class="demo-row">
        <ScPanel
          theme="cyber"
          title="CYBER PANEL"
          icon="ep:aim"
          :width="320"
          :height="180"
        >
          <p>切角设计的赛博朋克风格</p>
        </ScPanel>
      </div>
    </DemoBlock>

    <!-- 功能组合 -->
    <DemoBlock title="功能组合" :code="codes.full">
      <div class="demo-row">
        <ScPanel
          title="完整功能"
          icon="ep:setting"
          collapsible
          maximizable
          closable
          :width="400"
          @close="handleClose"
        >
          <template #extra>
            <el-button size="small" type="primary" link
              ><IconifyIconOnline icon="ep:refresh"
            /></el-button>
          </template>
          <p>集成折叠、最大化、关闭功能</p>
          <template #footer>
            <el-text type="info" size="small">Footer 区域</el-text>
          </template>
        </ScPanel>
      </div>
    </DemoBlock>
  </div>
</template>

<script setup>
/**
 * ScPanel 面板组件示例
 * @author CH
 * @version 1.0.0
 * @since 2025-12-05
 */
import { ElMessage } from "element-plus";
import { ScPanel } from "@repo/components/ScPanel";
import DemoBlock from "./DemoBlock.vue";

function handleClose() {
  ElMessage.info("面板已关闭");
}

// 代码模板
const codes = {
  default: `<ScPanel title="基础面板" icon="ep:document" :width="280">
  <p>这是一个基础面板</p>
</ScPanel>

<ScPanel title="可折叠" icon="ep:folder" collapsible :width="280">
  <p>点击左侧箭头折叠</p>
</ScPanel>

<ScPanel title="可最大化" icon="ep:full-screen" maximizable :width="280">
  <p>点击右上角按钮最大化</p>
</ScPanel>`,

  modern: `<ScPanel theme="modern" title="现代面板" icon="ep:star-filled" :width="320">
  <p>简洁无边框，大圆角设计</p>
  <p>适合现代化管理后台</p>
</ScPanel>`,

  gradient: `<ScPanel theme="gradient" title="渐变面板" icon="ep:magic-stick" :width="320">
  <p>主题色渐变背景</p>
  <p>适合突出显示重要内容</p>
</ScPanel>`,

  techui: `<ScPanel
  theme="techui"
  title="系统监控"
  icon="ep:monitor"
  :width="350"
  :height="220"
>
  <div class="tech-content">
    <div class="data-item">
      <span>CPU</span>
      <span class="value">45.2%</span>
    </div>
    <div class="data-item">
      <span>内存</span>
      <span class="value">6.8GB</span>
    </div>
  </div>
</ScPanel>

<!-- 样式 -->
<style>
.tech-content .data-item {
  display: flex;
  justify-content: space-between;
  padding: 10px 0;
  border-bottom: 1px solid rgba(0, 246, 255, 0.1);
  color: rgba(255, 255, 255, 0.7);
}
.tech-content .value {
  color: #00f6ff;
  font-weight: 600;
  font-size: 18px;
}
</style>`,

  tech: `<ScPanel
  theme="tech"
  title="系统状态"
  icon="ep:cpu"
  :width="350"
  :height="220"
>
  <div class="tech-content">
    <div class="data-item">
      <span>服务器状态</span>
      <span class="value">运行中</span>
    </div>
    <div class="data-item">
      <span>响应时间</span>
      <span class="value">32ms</span>
    </div>
  </div>
</ScPanel>

<!-- 自定义颜色 -->
<ScPanel
  theme="tech"
  title="绿色主题"
  icon="ep:setting"
  :width="350"
  border-color="rgba(0, 255, 150, 0.4)"
>
  <div class="tech-content">
    <!-- 内容 -->
  </div>
</ScPanel>

<!-- 样式 -->
<style>
.tech-content .data-item {
  display: flex;
  justify-content: space-between;
  padding: 10px 0;
  border-bottom: 1px solid rgba(0, 200, 255, 0.1);
  color: rgba(255, 255, 255, 0.7);
}
.tech-content .value {
  color: #00d4ff;
  font-weight: 600;
  font-size: 18px;
  text-shadow: 0 0 10px rgba(0, 200, 255, 0.5);
}
</style>`,

  glass: `<ScPanel
  theme="glass"
  title="玻璃面板"
  icon="ep:magic-stick"
  :width="300"
  :height="160"
>
  <p>毛玻璃效果，适合背景图场景</p>
</ScPanel>`,

  neon: `<ScPanel
  theme="neon"
  title="霓虹面板"
  icon="ep:sunny"
  :width="260"
  :height="160"
>
  <p>呼吸灯效果</p>
</ScPanel>

<!-- 自定义颜色 -->
<ScPanel
  theme="neon"
  title="绿色霓虹"
  icon="ep:star"
  :width="260"
  border-color="#00ff88"
>
  <p>自定义颜色</p>
</ScPanel>`,

  cyber: `<ScPanel
  theme="cyber"
  title="CYBER PANEL"
  icon="ep:aim"
  :width="320"
  :height="180"
>
  <p>切角设计的赛博朋克风格</p>
</ScPanel>`,

  full: `<ScPanel
  title="完整功能"
  icon="ep:setting"
  collapsible
  maximizable
  closable
  :width="400"
  @close="handleClose"
>
  <template #extra>
    <el-button size="small" type="primary" link>
      <IconifyIconOnline icon="ep:refresh" />
    </el-button>
  </template>
  <p>集成折叠、最大化、关闭功能</p>
  <template #footer>
    <el-text type="info" size="small">Footer 区域</el-text>
  </template>
</ScPanel>

<script setup>
import { ElMessage } from "element-plus";

function handleClose() {
  ElMessage.info("面板已关闭");
}
</script>`
};
</script>

<style scoped>
.sc-panel-example {
  padding: 20px;
}

.demo-row {
  display: flex;
  flex-wrap: wrap;
  gap: 20px;
  align-items: flex-start;
}

/* 科技风格内容样式 */
.tech-content {
  padding: 8px 0;
}

.tech-content .data-item {
  display: flex;
  justify-content: space-between;
  padding: 10px 0;
  border-bottom: 1px solid rgba(0, 200, 255, 0.1);
  color: rgba(255, 255, 255, 0.7);
}

.tech-content .data-item:last-child {
  border-bottom: none;
}

.tech-content .value {
  font-weight: 600;
  font-size: 18px;
}

.tech-content .value.cyan {
  color: #00f6ff;
  text-shadow: 0 0 10px rgba(0, 246, 255, 0.5);
}

.tech-content .value.blue {
  color: #00d4ff;
  text-shadow: 0 0 10px rgba(0, 200, 255, 0.5);
}

.tech-content .value.green {
  color: #00ff96;
  text-shadow: 0 0 10px rgba(0, 255, 150, 0.5);
}

/* 绿色主题内容 */
.tech-content--green .data-item {
  border-bottom-color: rgba(0, 255, 150, 0.1);
}
</style>
