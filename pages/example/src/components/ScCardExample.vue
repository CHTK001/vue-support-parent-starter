<template>
  <div class="sc-card-example">
    <sc-panel title="卡片组件" type="card">
      <template #description> 用于展示内容的容器组件，支持自定义标题、内容和底部 </template>

      <el-tabs v-model="activeTab">
        <el-tab-pane label="基础示例" name="basic">
          <div class="example-section">
            <sc-panel title="基础卡片" type="border">
              <div class="example-card">
                <ScCard :title="cardConfig.title" :icon="cardConfig.icon" :width="cardConfig.width" :shadow="cardConfig.shadow" :bodyStyle="cardConfig.bodyStyle" :headerStyle="cardConfig.headerStyle">
                  <div v-if="cardConfig.contentType === 'text'">
                    <p>这是卡片的内容部分，可以放置任何内容。</p>
                    <p>支持多行文本和各种组件。</p>
                  </div>
                  <div v-else-if="cardConfig.contentType === 'user'" class="user-info">
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
                  <div v-else-if="cardConfig.contentType === 'stats'" class="data-stats">
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
                  </div>

                  <template #header v-if="cardConfig.customHeader">
                    <div class="custom-header">
                      <div class="header-left">
                        <IconifyIconOnline :icon="cardConfig.headerIcon" class="header-icon" />
                        <span class="header-title">{{ cardConfig.headerTitle }}</span>
                      </div>
                      <el-button v-if="cardConfig.showHeaderButton" type="primary" text size="small">
                        <IconifyIconOnline icon="ri:edit-line" />
                        编辑
                      </el-button>
                    </div>
                  </template>

                  <template #footer v-if="cardConfig.showFooter">
                    <div class="card-footer" :class="{ 'user-actions': cardConfig.contentType === 'user' }">
                      <el-button v-for="(btn, index) in cardConfig.footerButtons" :key="index" :type="btn.type" :size="btn.size" :round="btn.round">
                        <IconifyIconOnline v-if="btn.icon" :icon="btn.icon" />
                        {{ btn.text }}
                      </el-button>
                    </div>
                  </template>
                </ScCard>
              </div>
            </sc-panel>
          </div>
        </el-tab-pane>

        <el-tab-pane label="配置面板" name="config">
          <div class="config-panel">
            <sc-panel title="组件配置" type="border">
              <el-form :model="cardConfig" label-width="120px" label-position="left">
                <el-form-item label="标题">
                  <el-input v-model="cardConfig.title" placeholder="请输入卡片标题" />
                </el-form-item>

                <el-form-item label="图标">
                  <el-input v-model="cardConfig.icon" placeholder="请输入图标名称，例如：ri:card-2-line" />
                </el-form-item>

                <el-form-item label="宽度">
                  <el-input v-model="cardConfig.width" placeholder="请输入宽度，例如：300px" />
                </el-form-item>

                <el-form-item label="阴影显示时机">
                  <el-select v-model="cardConfig.shadow" style="width: 100%">
                    <el-option label="始终显示" value="always" />
                    <el-option label="悬停时显示" value="hover" />
                    <el-option label="从不显示" value="never" />
                  </el-select>
                </el-form-item>

                <el-form-item label="内容类型">
                  <el-select v-model="cardConfig.contentType" style="width: 100%">
                    <el-option label="文本内容" value="text" />
                    <el-option label="用户信息" value="user" />
                    <el-option label="数据统计" value="stats" />
                  </el-select>
                </el-form-item>

                <el-divider>头部设置</el-divider>

                <el-form-item label="自定义头部">
                  <el-switch v-model="cardConfig.customHeader" />
                </el-form-item>

                <template v-if="cardConfig.customHeader">
                  <el-form-item label="头部标题">
                    <el-input v-model="cardConfig.headerTitle" placeholder="请输入头部标题" />
                  </el-form-item>

                  <el-form-item label="头部图标">
                    <el-input v-model="cardConfig.headerIcon" placeholder="请输入头部图标" />
                  </el-form-item>

                  <el-form-item label="显示头部按钮">
                    <el-switch v-model="cardConfig.showHeaderButton" />
                  </el-form-item>
                </template>

                <el-divider>底部设置</el-divider>

                <el-form-item label="显示底部">
                  <el-switch v-model="cardConfig.showFooter" />
                </el-form-item>

                <el-form-item label="底部按钮数量" v-if="cardConfig.showFooter">
                  <el-slider v-model="cardConfig.footerButtonCount" :min="1" :max="3" :step="1" show-input />
                </el-form-item>
              </el-form>
            </sc-panel>

            <sc-panel title="预览" type="border">
              <ScCard :title="cardConfig.title" :icon="cardConfig.icon" :width="cardConfig.width" :shadow="cardConfig.shadow" :bodyStyle="cardConfig.bodyStyle" :headerStyle="cardConfig.headerStyle">
                <div v-if="cardConfig.contentType === 'text'">
                  <p>这是卡片的内容部分，可以放置任何内容。</p>
                  <p>支持多行文本和各种组件。</p>
                </div>
                <div v-else-if="cardConfig.contentType === 'user'" class="user-info">
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
                <div v-else-if="cardConfig.contentType === 'stats'" class="data-stats">
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
                </div>

                <template #header v-if="cardConfig.customHeader">
                  <div class="custom-header">
                    <div class="header-left">
                      <IconifyIconOnline :icon="cardConfig.headerIcon" class="header-icon" />
                      <span class="header-title">{{ cardConfig.headerTitle }}</span>
                    </div>
                    <el-button v-if="cardConfig.showHeaderButton" type="primary" text size="small">
                      <IconifyIconOnline icon="ri:edit-line" />
                      编辑
                    </el-button>
                  </div>
                </template>

                <template #footer v-if="cardConfig.showFooter">
                  <div class="card-footer" :class="{ 'user-actions': cardConfig.contentType === 'user' }">
                    <el-button v-for="(btn, index) in cardConfig.footerButtons" :key="index" :type="btn.type" :size="btn.size" :round="btn.round">
                      <IconifyIconOnline v-if="btn.icon" :icon="btn.icon" />
                      {{ btn.text }}
                    </el-button>
                  </div>
                </template>
              </ScCard>
            </sc-panel>
          </div>
        </el-tab-pane>

        <el-tab-pane label="API文档" name="api">
          <sc-panel title="属性" type="border">
            <el-table :data="propData" border stripe>
              <el-table-column prop="name" label="参数" width="180" />
              <el-table-column prop="type" label="类型" width="180" />
              <el-table-column prop="default" label="默认值" width="180" />
              <el-table-column prop="description" label="说明" />
            </el-table>
          </sc-panel>

          <sc-panel title="插槽" type="border" class="mt-4">
            <el-table :data="slotData" border stripe>
              <el-table-column prop="name" label="名称" width="180" />
              <el-table-column prop="description" label="说明" />
            </el-table>
          </sc-panel>

          <sc-panel title="使用示例" type="border" class="mt-4">
            <pre class="code-block">
&lt;template&gt;
  &lt;div&gt;
    &lt;ScCard 
      title="基础卡片" 
      width="300px"
      shadow="always"
    &gt;
      &lt;p&gt;这是卡片的内容部分，可以放置任何内容。&lt;/p&gt;
      &lt;p&gt;支持多行文本和各种组件。&lt;/p&gt;
      &lt;template #footer&gt;
        &lt;div class="card-footer"&gt;
          &lt;el-button type="primary" size="small"&gt;确定&lt;/el-button&gt;
          &lt;el-button size="small"&gt;取消&lt;/el-button&gt;
        &lt;/div&gt;
      &lt;/template&gt;
    &lt;/ScCard&gt;
  &lt;/div&gt;
&lt;/template&gt;
            </pre>
          </sc-panel>
        </el-tab-pane>
      </el-tabs>
    </sc-panel>
  </div>
</template>

<script setup>
import { ref, reactive, computed, watch } from "vue";
import { ScCard } from "@repo/components/ScCard";

// 当前激活的标签页
const activeTab = ref("basic");

// 卡片配置数据
const cardConfig = reactive({
  title: "基础卡片",
  icon: "ri:card-2-line",
  width: "350px",
  shadow: "always",
  bodyStyle: {},
  headerStyle: {},
  contentType: "text", // text, user, stats
  customHeader: false,
  headerTitle: "自定义标题",
  headerIcon: "ri:file-chart-line",
  showHeaderButton: true,
  showFooter: true,
  footerButtonCount: 2,
});

// 根据配置生成底部按钮
const footerButtons = computed(() => {
  const buttons = [];

  if (cardConfig.contentType === "text") {
    buttons.push({ type: "primary", size: "small", text: "确定", round: false, icon: "" }, { type: "default", size: "small", text: "取消", round: false, icon: "" });
  } else if (cardConfig.contentType === "user") {
    buttons.push({ type: "primary", size: "small", text: "发消息", round: true, icon: "ri:mail-line" }, { type: "success", size: "small", text: "关注", round: true, icon: "ri:user-add-line" }, { type: "info", size: "small", text: "", round: true, icon: "ri:more-line" });
  } else if (cardConfig.contentType === "stats") {
    buttons.push({ type: "primary", size: "small", text: "刷新", round: false, icon: "ri:refresh-line" });
  }

  return buttons.slice(0, cardConfig.footerButtonCount);
});

// 将计算属性赋值给响应式对象，以便在模板中使用
watch(
  footerButtons,
  (newVal) => {
    cardConfig.footerButtons = newVal;
  },
  { immediate: true }
);

// 属性数据
const propData = [
  {
    name: "title",
    type: "String",
    default: "",
    description: "卡片标题",
  },
  {
    name: "icon",
    type: "String",
    default: "",
    description: "卡片标题图标",
  },
  {
    name: "width",
    type: "String",
    default: "100%",
    description: "卡片宽度",
  },
  {
    name: "shadow",
    type: "String",
    default: "always",
    description: "卡片阴影显示时机，可选值: always/hover/never",
  },
  {
    name: "bodyStyle",
    type: "Object",
    default: "{}",
    description: "卡片内容区域的样式",
  },
  {
    name: "headerStyle",
    type: "Object",
    default: "{}",
    description: "卡片头部区域的样式",
  },
];

// 插槽数据
const slotData = [
  {
    name: "default",
    description: "卡片内容",
  },
  {
    name: "header",
    description: "卡片头部内容，会覆盖 title 和 icon 属性",
  },
  {
    name: "footer",
    description: "卡片底部内容",
  },
];
</script>

<style lang="scss" scoped>
.sc-card-example {
  padding: 16px;

  .example-desc {
    color: #666;
    margin-bottom: 16px;
  }

  .example-section {
    display: flex;
    flex-direction: column;
    gap: 20px;
    margin-bottom: 20px;
  }

  .example-card {
    padding: 16px;
    border-radius: 8px;
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

  .config-panel {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 20px;
  }

  .code-block {
    background-color: #f5f7fa;
    border-radius: 4px;
    padding: 16px;
    font-family: monospace;
    white-space: pre-wrap;
    overflow-x: auto;
    font-size: 14px;
    line-height: 1.5;
    color: #333;
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

  @media (max-width: 1200px) {
    .config-panel {
      grid-template-columns: 1fr;
    }
  }
}
</style>
