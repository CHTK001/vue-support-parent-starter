<template>
  <div class="sc-compare-example">
    <h2>ScCompare 图片对比组件示例</h2>
    
    <!-- 基础用法 -->
    <div class="example-section">
      <h3>基础用法</h3>
      <p>基本的图片对比功能，支持左右拖拽查看对比效果</p>
      <div class="example-container">
        <ScCompare
          :left-image="basicExample.leftImage"
          :right-image="basicExample.rightImage"
          :left-image-label="basicExample.leftLabel"
          :right-image-label="basicExample.rightLabel"
        />
      </div>
    </div>

    <!-- 自定义标签 -->
    <div class="example-section">
      <h3>自定义标签</h3>
      <p>可以自定义左右图片的标签文字</p>
      <div class="example-container">
        <ScCompare
          :left-image="customLabelExample.leftImage"
          :right-image="customLabelExample.rightImage"
          :left-image-label="customLabelExample.leftLabel"
          :right-image-label="customLabelExample.rightLabel"
        />
      </div>
    </div>

    <!-- 自定义样式 -->
    <div class="example-section">
      <h3>自定义样式</h3>
      <p>可以为左右图片设置不同的CSS样式</p>
      <div class="example-container">
        <ScCompare
          :left-image="styledExample.leftImage"
          :right-image="styledExample.rightImage"
          :left-image-css="styledExample.leftImageCss"
          :right-image-css="styledExample.rightImageCss"
          :left-image-label="styledExample.leftLabel"
          :right-image-label="styledExample.rightLabel"
        />
      </div>
    </div>

    <!-- 图片修复对比 -->
    <div class="example-section">
      <h3>图片修复对比</h3>
      <p>展示图片修复前后的对比效果</p>
      <div class="example-container">
        <ScCompare
          :left-image="repairExample.leftImage"
          :right-image="repairExample.rightImage"
          :left-image-label="repairExample.leftLabel"
          :right-image-label="repairExample.rightLabel"
        />
      </div>
    </div>

    <!-- 功能说明 -->
    <div class="example-section">
      <h3>功能说明</h3>
      <el-card>
        <h4>组件特性</h4>
        <ul>
          <li>支持图片对比展示，可通过拖拽分割线查看对比效果</li>
          <li>支持自定义左右图片的标签文字</li>
          <li>支持为左右图片设置不同的CSS样式</li>
          <li>基于 vue3-compare-image 库实现</li>
          <li>响应式设计，适配不同屏幕尺寸</li>
        </ul>
        
        <h4>使用场景</h4>
        <ul>
          <li>图片修复前后对比</li>
          <li>产品升级前后对比</li>
          <li>设计方案对比</li>
          <li>图片处理效果对比</li>
          <li>版本差异对比</li>
        </ul>
      </el-card>
    </div>

    <!-- API 文档 -->
    <div class="example-section">
      <h3>API 文档</h3>
      <el-card>
        <h4>Props</h4>
        <el-table :data="propsData" border>
          <el-table-column prop="name" label="属性名" width="150" />
          <el-table-column prop="type" label="类型" width="100" />
          <el-table-column prop="default" label="默认值" width="120" />
          <el-table-column prop="description" label="说明" />
        </el-table>
      </el-card>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import ScCompare from './index.vue'

// 基础示例数据
const basicExample = ref({
  leftImage: 'https://picsum.photos/400/300?random=1',
  rightImage: 'https://picsum.photos/400/300?random=2',
  leftLabel: '原始图片',
  rightLabel: '处理后图片'
})

// 自定义标签示例
const customLabelExample = ref({
  leftImage: 'https://picsum.photos/400/300?random=3',
  rightImage: 'https://picsum.photos/400/300?random=4',
  leftLabel: 'Before',
  rightLabel: 'After'
})

// 自定义样式示例
const styledExample = ref({
  leftImage: 'https://picsum.photos/400/300?random=5',
  rightImage: 'https://picsum.photos/400/300?random=6',
  leftImageCss: {
    'border': '3px solid #409eff',
    'border-radius': '12px',
    'box-shadow': '0 6px 12px rgba(64, 158, 255, 0.3)'
  },
  rightImageCss: {
    'border': '3px solid #67c23a',
    'border-radius': '12px',
    'box-shadow': '0 6px 12px rgba(103, 194, 58, 0.3)'
  },
  leftLabel: '样式A',
  rightLabel: '样式B'
})

// 图片修复示例
const repairExample = ref({
  leftImage: 'https://picsum.photos/400/300?random=7',
  rightImage: 'https://picsum.photos/400/300?random=8',
  leftLabel: '损坏图片',
  rightLabel: '修复图片'
})

// Props 文档数据
const propsData = ref([
  {
    name: 'leftImage',
    type: 'String',
    default: '-',
    description: '左侧图片的URL地址'
  },
  {
    name: 'rightImage',
    type: 'String',
    default: '-',
    description: '右侧图片的URL地址'
  },
  {
    name: 'leftImageLabel',
    type: 'String',
    default: '源图片',
    description: '左侧图片的标签文字'
  },
  {
    name: 'rightImageLabel',
    type: 'String',
    default: '修复图片',
    description: '右侧图片的标签文字'
  },
  {
    name: 'leftImageCss',
    type: 'Object',
    default: '{ background-color: "#f0f0f0", border: "2px solid #ff0000", border-radius: "8px", box-shadow: "0 4px 8px rgba(0, 0, 0, 0.1)" }',
    description: '左侧图片的CSS样式对象'
  },
  {
    name: 'rightImageCss',
    type: 'Object',
    default: '{}',
    description: '右侧图片的CSS样式对象'
  }
])
</script>

<style scoped>
.sc-compare-example {
  padding: 20px;
  max-width: 1200px;
  margin: 0 auto;
}

.example-section {
  margin-bottom: 40px;
}

.example-section h3 {
  color: #409eff;
  margin-bottom: 10px;
  font-size: 18px;
  font-weight: 600;
}

.example-section p {
  color: #606266;
  margin-bottom: 15px;
  line-height: 1.6;
}

.example-container {
  border: 1px solid #dcdfe6;
  border-radius: 8px;
  padding: 20px;
  background-color: #fafafa;
  margin-bottom: 20px;
}

.el-card {
  margin-top: 15px;
}

.el-card h4 {
  color: #303133;
  margin-bottom: 15px;
  font-size: 16px;
  font-weight: 600;
}

.el-card ul {
  margin: 0;
  padding-left: 20px;
}

.el-card li {
  color: #606266;
  line-height: 1.8;
  margin-bottom: 5px;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .sc-compare-example {
    padding: 15px;
  }
  
  .example-container {
    padding: 15px;
  }
  
  .example-section h3 {
    font-size: 16px;
  }
}
</style>