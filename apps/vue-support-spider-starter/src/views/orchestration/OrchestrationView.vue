<![CDATA[<template>
  <div class="orchestration-container">
    <el-card class="shadow-sm rounded-xl p-6">
      <div class="flex items-center gap-2 mb-4">
        <el-icon size="20"><Share /></el-icon>
        <h2 class="text-lg font-semibold text-el-text">流程编排</h2>
        <el-tag type="info" size="small">开发中</el-tag>
      </div>
      <p class="text-el-text-secondary mb-4">
        将爬虫能力封装为流程编排节点，支持串联、并行、条件分支等复杂工作流。
      </p>
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div class="border rounded-lg p-4 bg-el-bg-page">
          <div class="font-medium text-el-text">SpiderFlowNode</div>
          <div class="text-sm text-el-text-secondary mt-1">
            爬虫抓取节点，支持 urls、threads、maxDepth、maxPages、interval、retryTimes 属性。
          </div>
        </div>
        <div class="border rounded-lg p-4 bg-el-bg-page">
          <div class="font-medium text-el-text">后续扩展</div>
          <div class="text-sm text-el-text-secondary mt-1">
            数据清洗、入库、通知等下游节点将陆续接入。
          </div>
        </div>
      </div>
      <div class="mt-6 p-4 bg-el-bg-page rounded-lg text-sm text-el-text-secondary">
        <p>💡 流程编排引擎由 <code class="bg-el-bg px-1 rounded">common-support</code> 提供，当前版本仅支持基础节点。</p>
        <p class="mt-1">详细文档请参考 <a href="#" class="text-el-primary underline">opencode 帮助</a>。</p>
      </div>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { Share } from "@element-plus/icons-vue";
</script>

<style scoped>
.orchestration-container {
  max-width: 900px;
  margin: 0 auto;
}
code {
  font-family: monospace;
}
</style>
]]>