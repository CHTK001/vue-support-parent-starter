<template>
  <div class="sc-panel-example">
    <!-- 默认主题 -->
    <div class="demo-section">
      <h4>默认主题（基于 el-card）</h4>
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
    </div>

    <!-- Modern 现代简约 -->
    <div class="demo-section">
      <h4>Modern 现代简约风格</h4>
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
    </div>

    <!-- Gradient 渐变主题 -->
    <div class="demo-section">
      <h4>Gradient 渐变主题</h4>
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
    </div>

    <!-- TechUI 数据大屏 -->
    <div class="demo-section demo-section--dark">
      <h4>TechUI 数据大屏风格</h4>
      <div class="demo-row">
        <ScPanel
          theme="techui"
          title="系统监控"
          icon="ep:monitor"
          :width="350"
          :height="220"
        >
          <div class="techui-content">
            <div class="data-item">
              <span>CPU</span><span class="value">45.2%</span>
            </div>
            <div class="data-item">
              <span>内存</span><span class="value">6.8GB</span>
            </div>
            <div class="data-item">
              <span>网络</span><span class="value">128MB/s</span>
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
          <div class="techui-content">
            <div class="data-item">
              <span>访问量</span><span class="value">12,345</span>
            </div>
            <div class="data-item">
              <span>转化率</span><span class="value">23.5%</span>
            </div>
            <div class="data-item">
              <span>在线用户</span><span class="value">892</span>
            </div>
          </div>
        </ScPanel>
      </div>
    </div>

    <!-- Tech 科技风格 -->
    <div class="demo-section demo-section--dark">
      <h4>Tech 科技风格</h4>
      <div class="demo-row">
        <ScPanel
          theme="tech"
          title="科技面板"
          icon="ep:cpu"
          :width="300"
          :height="180"
        >
          <p>边角装饰设计</p>
        </ScPanel>
        <ScPanel
          theme="tech"
          title="自定义颜色"
          icon="ep:setting"
          :width="300"
          :height="180"
          border-color="rgba(0, 255, 150, 0.4)"
        >
          <p>绿色科技风格</p>
        </ScPanel>
      </div>
    </div>

    <!-- Glass 玻璃拟态 -->
    <div class="demo-section demo-section--gradient">
      <h4>Glass 玻璃拟态</h4>
      <div class="demo-row">
        <ScPanel
          theme="glass"
          title="玻璃面板"
          icon="ep:magic-stick"
          :width="300"
          :height="160"
        >
          <p>毛玻璃效果，适合背景图场景</p>
        </ScPanel>
      </div>
    </div>

    <!-- Neon 霓虹风格 -->
    <div class="demo-section demo-section--dark">
      <h4>Neon 霓虹风格</h4>
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
    </div>

    <!-- Cyber 赛博朋克 -->
    <div class="demo-section demo-section--dark">
      <h4>Cyber 赛博朋克风格</h4>
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
    </div>

    <!-- 功能组合 -->
    <div class="demo-section">
      <h4>功能组合</h4>
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
    </div>
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

function handleClose() {
  ElMessage.info("面板已关闭");
}
</script>

<style scoped>
.sc-panel-example {
  padding: 20px;
}

.demo-section {
  margin-bottom: 32px;
  padding: 24px;
  border-radius: 8px;
  background: var(--el-bg-color);
}

.demo-section--dark {
  background: linear-gradient(135deg, #0a1628 0%, #1a2840 100%);
}

.demo-section--dark h4 {
  color: #fff;
}

.demo-section--gradient {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.demo-section--gradient h4 {
  color: #fff;
}

.demo-section h4 {
  margin: 0 0 20px;
  font-size: 16px;
  font-weight: 600;
  color: var(--el-text-color-primary);
}

.demo-row {
  display: flex;
  flex-wrap: wrap;
  gap: 20px;
  align-items: flex-start;
}

.techui-content {
  padding: 8px 0;
}

.techui-content .data-item {
  display: flex;
  justify-content: space-between;
  padding: 10px 0;
  border-bottom: 1px solid rgba(0, 246, 255, 0.1);
  color: rgba(255, 255, 255, 0.7);
}

.techui-content .data-item:last-child {
  border-bottom: none;
}

.techui-content .data-item .value {
  color: #00f6ff;
  font-weight: 600;
  font-size: 18px;
}
</style>
