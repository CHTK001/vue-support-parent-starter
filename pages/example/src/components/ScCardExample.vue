<template>
  <div class="sc-card-demo">
    <h2 class="demo-title">ScCard 组件演示</h2>
    
    <div class="demo-section">
      <h3 class="section-title">默认布局</h3>
      <div class="card-row">
        <ScCard class="demo-card">
          <div class="demo-content">
            <h4>默认卡片</h4>
            <p>这是一个默认布局的卡片，只有内容区域。</p>
          </div>
        </ScCard>
        
        <ScCard class="demo-card" :hoverable="false">
          <div class="demo-content">
            <h4>禁用悬停效果</h4>
            <p>这个卡片禁用了悬停效果，不会显示边框变化和阴影。</p>
          </div>
        </ScCard>
        
        <ScCard class="demo-card" shadow="always">
          <div class="demo-content">
            <h4>始终显示阴影</h4>
            <p>这个卡片始终显示阴影效果，不需要悬停。</p>
          </div>
        </ScCard>
      </div>
    </div>
    
    <div class="demo-section">
      <h3 class="section-title">头部内容布局</h3>
      <div class="card-row">
        <ScCard 
          class="demo-card" 
          layout="header-content" 
          title="卡片标题"
        >
          <div class="demo-content">
            <p>这是一个带有头部和内容的卡片布局。</p>
            <p>头部包含标题和可选的操作按钮。</p>
          </div>
        </ScCard>
        
        <ScCard 
          class="demo-card" 
          layout="header-content" 
          title="自定义头部"
        >
          <template #header-right>
            <el-button type="primary" size="small">操作</el-button>
          </template>
          <div class="demo-content">
            <p>这个卡片在头部右侧添加了自定义内容。</p>
            <p>可以放置按钮、图标或其他操作元素。</p>
          </div>
        </ScCard>
        
        <ScCard 
          class="demo-card" 
          layout="header-content"
        >
          <template #header>
            <div class="custom-header">
              <IconifyIconOnline icon="ep:star" class="header-icon" />
              <span>完全自定义头部</span>
            </div>
          </template>
          <div class="demo-content">
            <p>这个卡片使用了完全自定义的头部内容。</p>
            <p>可以根据需要设计任意头部样式。</p>
          </div>
        </ScCard>
      </div>
    </div>
    
    <div class="demo-section">
      <h3 class="section-title">媒体卡片布局</h3>
      <div class="card-row">
        <ScCard 
          class="demo-card" 
          layout="media" 
          title="媒体卡片标题"
          subtitle="副标题内容"
        >
          <template #media>
            <img src="https://via.placeholder.com/120" alt="示例图片" />
          </template>
          <div class="demo-content">
            <p>这是一个媒体卡片布局，左侧为媒体内容，右侧为文本内容。</p>
          </div>
          <template #media-footer>
            <el-button type="primary" size="small">查看详情</el-button>
          </template>
        </ScCard>
        
        <ScCard 
          class="demo-card" 
          layout="media" 
          title="产品展示"
          subtitle="产品描述信息"
        >
          <div class="demo-content">
            <p>左侧为默认的媒体占位符，可以放置产品图片。</p>
            <p>右侧可以放置产品描述、价格等信息。</p>
          </div>
          <template #media-footer>
            <div class="media-actions">
              <el-button size="small">收藏</el-button>
              <el-button type="primary" size="small">购买</el-button>
            </div>
          </template>
        </ScCard>
        
        <ScCard 
          class="demo-card" 
          layout="media" 
          title="自定义媒体内容"
        >
          <template #media>
            <div class="custom-media">
              <IconifyIconOnline icon="ep:picture" class="media-icon" />
            </div>
          </template>
          <div class="demo-content">
            <p>这个卡片使用了自定义的媒体内容。</p>
            <p>可以放置图标、图表或其他视觉元素。</p>
          </div>
        </ScCard>
      </div>
    </div>
    
    <div class="demo-section">
      <h3 class="section-title">自定义样式</h3>
      <div class="card-row">
        <ScCard 
          class="demo-card" 
          borderRadius="16px"
          padding="24px"
        >
          <div class="demo-content">
            <h4>自定义圆角和内边距</h4>
            <p>这个卡片使用了更大的圆角和内边距。</p>
          </div>
        </ScCard>
        
        <ScCard 
          class="demo-card" 
          type="div"
          border
        >
          <div class="demo-content">
            <h4>使用DIV元素</h4>
            <p>这个卡片使用普通DIV元素而不是el-card组件。</p>
            <p>保留了边框和悬停效果。</p>
          </div>
        </ScCard>
        
        <ScCard 
          class="demo-card custom-card" 
          type="div"
          :border="false"
        >
          <div class="demo-content">
            <h4>完全自定义样式</h4>
            <p>这个卡片使用DIV元素并移除了边框。</p>
            <p>可以应用自定义的背景和样式。</p>
          </div>
        </ScCard>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import ScCard from '@repo/components/ScCard/index.vue';
</script>

<style lang="scss" scoped>
.sc-card-demo {
  padding: 24px;
  
  .demo-title {
    font-size: 24px;
    font-weight: 600;
    margin-bottom: 24px;
    color: var(--el-text-color-primary);
  }
  
  .demo-section {
    margin-bottom: 32px;
    
    .section-title {
      font-size: 18px;
      font-weight: 500;
      margin-bottom: 16px;
      color: var(--el-text-color-primary);
      position: relative;
      padding-left: 12px;
      
      &::before {
        content: '';
        position: absolute;
        left: 0;
        top: 4px;
        height: 16px;
        width: 3px;
        background-color: var(--el-color-primary);
        border-radius: 2px;
      }
    }
    
    .card-row {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 20px;
      
      @media (max-width: 1200px) {
        grid-template-columns: repeat(2, 1fr);
      }
      
      @media (max-width: 768px) {
        grid-template-columns: 1fr;
      }
    }
    
    .demo-card {
      height: 200px;
      
      &.custom-card {
        background: linear-gradient(135deg, var(--el-color-primary-light-8), var(--el-color-primary-light-9));
        border-radius: 16px;
        box-shadow: 0 8px 16px rgba(0, 0, 0, 0.1);
        
        &:hover {
          box-shadow: 0 12px 24px rgba(0, 0, 0, 0.15);
          transform: translateY(-4px);
        }
      }
    }
  }
  
  .demo-content {
    h4 {
      font-size: 16px;
      font-weight: 500;
      margin-bottom: 12px;
      color: var(--el-text-color-primary);
    }
    
    p {
      font-size: 14px;
      color: var(--el-text-color-secondary);
      line-height: 1.6;
      margin-bottom: 8px;
    }
  }
  
  .custom-header {
    display: flex;
    align-items: center;
    gap: 8px;
    color: var(--el-color-primary);
    font-weight: 500;
    
    .header-icon {
      font-size: 18px;
    }
  }
  
  .custom-media {
    width: 100%;
    height: 100%;
    display: flex;
    justify-content: center;
    align-items: center;
    background-color: var(--el-color-primary-light-9);
    
    .media-icon {
      font-size: 40px;
      color: var(--el-color-primary);
    }
  }
  
  .media-actions {
    display: flex;
    gap: 8px;
  }
}
</style> 