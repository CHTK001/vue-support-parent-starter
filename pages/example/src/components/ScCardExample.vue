<template>
  <div class="sc-card-example">
    <el-tabs type="border-card">
      <el-tab-pane label="基础用法">
        <h3>基础卡片</h3>
        <p class="example-desc">基础卡片包含标题、内容和操作区域</p>

        <div class="example-row">
          <ScCard title="基础卡片" width="300px">
            <p>这是卡片的内容部分，可以放置任何内容。</p>
            <p>支持多行文本和各种组件。</p>
            <template #footer>
              <div class="card-footer">
                <el-button type="primary" size="small">确定</el-button>
                <el-button size="small">取消</el-button>
              </div>
            </template>
          </ScCard>

          <ScCard title="带图标的卡片" width="300px" icon="ri:card-2-line">
            <p>这张卡片带有图标，增强了视觉效果。</p>
            <template #footer>
              <div class="card-footer">
                <el-button type="primary" size="small">操作按钮</el-button>
              </div>
            </template>
          </ScCard>
        </div>

        <el-divider></el-divider>
        <h4>代码示例：</h4>
        <pre><code class="language-html">
&lt;ScCard title="基础卡片" width="300px"&gt;
  &lt;p&gt;这是卡片的内容部分，可以放置任何内容。&lt;/p&gt;
  &lt;p&gt;支持多行文本和各种组件。&lt;/p&gt;
  &lt;template #footer&gt;
    &lt;div class="card-footer"&gt;
      &lt;el-button type="primary" size="small"&gt;确定&lt;/el-button&gt;
      &lt;el-button size="small"&gt;取消&lt;/el-button&gt;
    &lt;/div&gt;
  &lt;/template&gt;
&lt;/ScCard&gt;
        </code></pre>
      </el-tab-pane>

      <el-tab-pane label="高级用法">
        <h3>高级卡片</h3>
        <p class="example-desc">自定义卡片头部、内容和底部，实现更复杂的布局</p>

        <div class="example-row">
          <ScCard width="350px">
            <template #header>
              <div class="custom-header">
                <div class="header-left">
                  <IconifyIconOnline icon="ri:user-3-line" class="header-icon" />
                  <span class="header-title">用户信息卡片</span>
                </div>
                <el-button type="primary" text size="small">
                  <IconifyIconOnline icon="ri:edit-line" />
                  编辑
                </el-button>
              </div>
            </template>

            <div class="user-info">
              <div class="user-avatar">
                <IconifyIconOnline icon="ri:user-smile-line" class="avatar-icon" />
              </div>
              <div class="user-details">
                <h4>张三</h4>
                <p>前端开发工程师</p>
                <div class="user-stats">
                  <div class="stat-item">
                    <span class="stat-value">254</span>
                    <span class="stat-label">文章</span>
                  </div>
                  <div class="stat-item">
                    <span class="stat-value">12.5k</span>
                    <span class="stat-label">粉丝</span>
                  </div>
                  <div class="stat-item">
                    <span class="stat-value">85</span>
                    <span class="stat-label">项目</span>
                  </div>
                </div>
              </div>
            </div>

            <template #footer>
              <div class="user-actions">
                <el-button type="primary" size="small" round> <IconifyIconOnline icon="ri:mail-line" /> 发消息 </el-button>
                <el-button type="success" size="small" round> <IconifyIconOnline icon="ri:user-add-line" /> 关注 </el-button>
                <el-button type="info" size="small" round>
                  <IconifyIconOnline icon="ri:more-line" />
                </el-button>
              </div>
            </template>
          </ScCard>

          <ScCard width="350px" shadow="hover">
            <template #header>
              <div class="custom-header">
                <div class="header-left">
                  <IconifyIconOnline icon="ri:file-chart-line" class="header-icon" />
                  <span class="header-title">数据统计</span>
                </div>
                <el-dropdown>
                  <IconifyIconOnline icon="ri:more-2-fill" class="more-icon" />
                  <template #dropdown>
                    <el-dropdown-menu>
                      <el-dropdown-item>今日</el-dropdown-item>
                      <el-dropdown-item>本周</el-dropdown-item>
                      <el-dropdown-item>本月</el-dropdown-item>
                      <el-dropdown-item>全年</el-dropdown-item>
                    </el-dropdown-menu>
                  </template>
                </el-dropdown>
              </div>
            </template>

            <div class="data-stats">
              <div class="data-row">
                <div class="data-item">
                  <IconifyIconOnline icon="ri:eye-line" class="data-icon primary" />
                  <div class="data-content">
                    <div class="data-value">14,384</div>
                    <div class="data-label">页面浏览量</div>
                  </div>
                </div>
                <div class="data-item">
                  <IconifyIconOnline icon="ri:user-line" class="data-icon success" />
                  <div class="data-content">
                    <div class="data-value">1,893</div>
                    <div class="data-label">新增用户</div>
                  </div>
                </div>
              </div>

              <div class="data-row">
                <div class="data-item">
                  <IconifyIconOnline icon="ri:shopping-cart-line" class="data-icon warning" />
                  <div class="data-content">
                    <div class="data-value">8,592</div>
                    <div class="data-label">商品订单</div>
                  </div>
                </div>
                <div class="data-item">
                  <IconifyIconOnline icon="ri:money-cny-box-line" class="data-icon danger" />
                  <div class="data-content">
                    <div class="data-value">¥25,648</div>
                    <div class="data-label">销售额</div>
                  </div>
                </div>
              </div>
            </div>

            <template #footer>
              <div class="data-footer">
                <span class="update-time">最后更新: 2023-08-20 18:30:24</span>
                <el-button type="primary" text size="small"> <IconifyIconOnline icon="ri:refresh-line" /> 刷新 </el-button>
              </div>
            </template>
          </ScCard>
        </div>
      </el-tab-pane>

      <el-tab-pane label="布局效果">
        <h3>卡片布局</h3>
        <p class="example-desc">使用卡片组件配合栅格系统创建响应式布局</p>

        <el-row :gutter="16">
          <el-col :span="8" v-for="i in 3" :key="i">
            <ScCard class="grid-card" :title="`卡片 ${i}`" shadow="hover">
              <div class="card-grid-content">这是第 {{ i }} 张卡片的内容区域</div>
              <template #footer>
                <el-button type="primary" link>查看详情</el-button>
              </template>
            </ScCard>
          </el-col>
        </el-row>

        <el-divider></el-divider>
        <h4>代码示例：</h4>
        <pre><code class="language-html">
&lt;el-row :gutter="16"&gt;
  &lt;el-col :span="8" v-for="i in 3" :key="i"&gt;
    &lt;ScCard class="grid-card" :title="`卡片 ${i}`" shadow="hover"&gt;
      &lt;div class="card-grid-content"&gt;
        这是第 {{ i }} 张卡片的内容区域
      &lt;/div&gt;
      &lt;template #footer&gt;
        &lt;el-button type="primary" link&gt;查看详情&lt;/el-button&gt;
      &lt;/template&gt;
    &lt;/ScCard&gt;
  &lt;/el-col&gt;
&lt;/el-row&gt;
        </code></pre>
      </el-tab-pane>

      <el-tab-pane label="API说明">
        <h3>ScCard 组件 API</h3>
        <el-descriptions title="属性" :column="1" border>
          <el-descriptions-item label="title">卡片标题，类型: String</el-descriptions-item>
          <el-descriptions-item label="icon">卡片标题图标，类型: String</el-descriptions-item>
          <el-descriptions-item label="width">卡片宽度，类型: String，默认: 100%</el-descriptions-item>
          <el-descriptions-item label="shadow">卡片阴影显示时机，可选值: always/hover/never，默认: always</el-descriptions-item>
          <el-descriptions-item label="bodyStyle">卡片内容区域的样式，类型: Object</el-descriptions-item>
          <el-descriptions-item label="headerStyle">卡片头部区域的样式，类型: Object</el-descriptions-item>
        </el-descriptions>

        <h4 class="mt-4">插槽</h4>
        <el-descriptions :column="1" border>
          <el-descriptions-item label="default">卡片内容</el-descriptions-item>
          <el-descriptions-item label="header">卡片头部内容，会覆盖 title 和 icon 属性</el-descriptions-item>
          <el-descriptions-item label="footer">卡片底部内容</el-descriptions-item>
        </el-descriptions>
      </el-tab-pane>
    </el-tabs>
  </div>
</template>

<script setup>
import { ref } from "vue";
</script>

<style lang="scss" scoped>
.sc-card-example {
  padding: 16px;

  .example-desc {
    color: #666;
    margin-bottom: 16px;
  }

  .example-row {
    display: flex;
    gap: 20px;
    margin-bottom: 20px;
    flex-wrap: wrap;
  }

  .card-footer {
    display: flex;
    justify-content: flex-end;
    gap: 8px;
  }

  .custom-header {
    display: flex;
    justify-content: space-between;
    align-items: center;

    .header-left {
      display: flex;
      align-items: center;
      gap: 8px;

      .header-icon {
        font-size: 18px;
        color: var(--el-color-primary);
      }

      .header-title {
        font-size: 16px;
        font-weight: bold;
      }
    }

    .more-icon {
      font-size: 20px;
      cursor: pointer;
      color: #909399;
    }
  }

  .user-info {
    display: flex;
    gap: 16px;
    padding: 16px 0;

    .user-avatar {
      width: 64px;
      height: 64px;
      border-radius: 50%;
      background-color: #ecf5ff;
      display: flex;
      justify-content: center;
      align-items: center;

      .avatar-icon {
        font-size: 36px;
        color: var(--el-color-primary);
      }
    }

    .user-details {
      flex: 1;

      h4 {
        margin: 0 0 4px 0;
        font-size: 18px;
      }

      p {
        margin: 0 0 12px 0;
        color: #909399;
        font-size: 14px;
      }
    }

    .user-stats {
      display: flex;
      gap: 16px;

      .stat-item {
        display: flex;
        flex-direction: column;
        align-items: center;

        .stat-value {
          font-size: 16px;
          font-weight: bold;
          color: var(--el-color-primary);
        }

        .stat-label {
          font-size: 12px;
          color: #909399;
        }
      }
    }
  }

  .user-actions {
    display: flex;
    justify-content: center;
    gap: 12px;
  }

  .data-stats {
    .data-row {
      display: flex;
      gap: 16px;
      margin-bottom: 16px;
    }

    .data-item {
      flex: 1;
      display: flex;
      align-items: center;
      gap: 12px;

      .data-icon {
        font-size: 32px;
        padding: 8px;
        border-radius: 8px;

        &.primary {
          color: var(--el-color-primary);
          background-color: rgba(var(--el-color-primary-rgb), 0.1);
        }

        &.success {
          color: var(--el-color-success);
          background-color: rgba(var(--el-color-success-rgb), 0.1);
        }

        &.warning {
          color: var(--el-color-warning);
          background-color: rgba(var(--el-color-warning-rgb), 0.1);
        }

        &.danger {
          color: var(--el-color-danger);
          background-color: rgba(var(--el-color-danger-rgb), 0.1);
        }
      }

      .data-content {
        .data-value {
          font-size: 18px;
          font-weight: bold;
        }

        .data-label {
          font-size: 12px;
          color: #909399;
        }
      }
    }
  }

  .data-footer {
    display: flex;
    justify-content: space-between;
    align-items: center;

    .update-time {
      font-size: 12px;
      color: #909399;
    }
  }

  .grid-card {
    margin-bottom: 16px;

    .card-grid-content {
      height: 120px;
      display: flex;
      justify-content: center;
      align-items: center;
      color: #909399;
    }
  }

  pre {
    background-color: #f5f7fa;
    border-radius: 4px;
    padding: 16px;
    overflow-x: auto;

    code {
      font-family: Consolas, Monaco, "Andale Mono", monospace;
      font-size: 14px;
      color: #333;
    }
  }

  .mt-4 {
    margin-top: 16px;
  }
}
</style>
