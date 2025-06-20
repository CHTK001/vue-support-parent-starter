<template>
  <div class="demo-container">
    <!-- 演示说明 -->
    <div class="demo-header">
      <h1>服务器管理界面演示</h1>
      <p>这是一个现代化的服务器管理界面，展示了完整的服务器监控、远程连接和管理功能。</p>
      
      <div class="demo-features">
        <el-row :gutter="20">
          <el-col :span="6">
            <div class="feature-card">
              <IconifyIconOnline icon="ri:server-line" class="feature-icon" />
              <h3>服务器管理</h3>
              <p>统一管理多台服务器，支持分组和搜索</p>
            </div>
          </el-col>
          <el-col :span="6">
            <div class="feature-card">
              <IconifyIconOnline icon="ri:dashboard-line" class="feature-icon" />
              <h3>实时监控</h3>
              <p>实时显示CPU、内存、磁盘等系统指标</p>
            </div>
          </el-col>
          <el-col :span="6">
            <div class="feature-card">
              <IconifyIconOnline icon="ri:terminal-line" class="feature-icon" />
              <h3>远程连接</h3>
              <p>支持SSH、RDP、VNC等多种远程连接方式</p>
            </div>
          </el-col>
          <el-col :span="6">
            <div class="feature-card">
              <IconifyIconOnline icon="ri:file-line" class="feature-icon" />
              <h3>文件管理</h3>
              <p>Web文件管理器，支持上传下载编辑</p>
            </div>
          </el-col>
        </el-row>
      </div>
    </div>

    <!-- 界面预览 -->
    <div class="demo-preview">
      <h2>界面预览</h2>
      <div class="preview-container">
        <div class="preview-mockup">
          <!-- 模拟的界面结构 -->
          <div class="mockup-toolbar">
            <div class="toolbar-left">
              <span class="page-title">服务器管理</span>
              <el-tag size="small" type="success">12台在线</el-tag>
            </div>
            <div class="toolbar-right">
              <el-button size="small">
                <IconifyIconOnline icon="ri:add-line" class="mr-1" />
                新增
              </el-button>
              <el-input size="small" placeholder="搜索服务器..." style="width: 200px;">
                <template #prefix>
                  <IconifyIconOnline icon="ri:search-line" />
                </template>
              </el-input>
            </div>
          </div>
          
          <div class="mockup-content">
            <!-- 左侧服务器列表 -->
            <div class="mockup-left">
              <div class="server-card-demo" v-for="i in 5" :key="i" :class="{ active: i === 1 }">
                <div class="card-header">
                  <div class="server-info">
                    <div class="server-name">服务器-{{ i.toString().padStart(2, '0') }}</div>
                    <div class="server-address">192.168.1.{{ 100 + i }}:22</div>
                  </div>
                  <div class="server-status">
                    <el-tag :type="i <= 3 ? 'success' : 'danger'" size="small">
                      {{ i <= 3 ? '在线' : '离线' }}
                    </el-tag>
                    <IconifyIconOnline icon="ri:terminal-line" class="protocol-icon" />
                  </div>
                </div>
                <div class="metrics-demo" v-if="i <= 3">
                  <div class="metric-item">
                    <span class="metric-label">CPU</span>
                    <el-progress 
                      :percentage="Math.floor(Math.random() * 60) + 20"
                      :show-text="false"
                      :stroke-width="4"
                    />
                    <span class="metric-value">{{ Math.floor(Math.random() * 60) + 20 }}%</span>
                  </div>
                  <div class="metric-item">
                    <span class="metric-label">内存</span>
                    <el-progress 
                      :percentage="Math.floor(Math.random() * 40) + 40"
                      :show-text="false"
                      :stroke-width="4"
                    />
                    <span class="metric-value">{{ Math.floor(Math.random() * 40) + 40 }}%</span>
                  </div>
                </div>
              </div>
            </div>
            
            <!-- 右侧内容区域 -->
            <div class="mockup-right">
              <div class="monitor-panel-demo">
                <div class="panel-header">
                  <h3>服务器监控 - 服务器-01</h3>
                  <div class="panel-actions">
                    <el-button size="small">刷新</el-button>
                    <el-button size="small">关闭</el-button>
                  </div>
                </div>
                
                <div class="metrics-grid-demo">
                  <div class="metric-card-demo">
                    <div class="metric-header">
                      <IconifyIconOnline icon="ri:cpu-line" />
                      <span>CPU使用率</span>
                    </div>
                    <div class="metric-value">{{ cpuUsage }}%</div>
                    <el-progress :percentage="cpuUsage" :show-text="false" />
                  </div>
                  
                  <div class="metric-card-demo">
                    <div class="metric-header">
                      <IconifyIconOnline icon="ri:database-line" />
                      <span>内存使用率</span>
                    </div>
                    <div class="metric-value">{{ memoryUsage }}%</div>
                    <el-progress :percentage="memoryUsage" :show-text="false" />
                  </div>
                  
                  <div class="metric-card-demo">
                    <div class="metric-header">
                      <IconifyIconOnline icon="ri:hard-drive-line" />
                      <span>磁盘使用率</span>
                    </div>
                    <div class="metric-value">{{ diskUsage }}%</div>
                    <el-progress :percentage="diskUsage" :show-text="false" />
                  </div>
                  
                  <div class="metric-card-demo">
                    <div class="metric-header">
                      <IconifyIconOnline icon="ri:wifi-line" />
                      <span>网络流量</span>
                    </div>
                    <div class="network-stats">
                      <div>入站: {{ networkIn }} MB/s</div>
                      <div>出站: {{ networkOut }} MB/s</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 功能说明 -->
    <div class="demo-features-detail">
      <h2>主要功能</h2>
      <el-row :gutter="20">
        <el-col :span="12">
          <div class="feature-detail">
            <h3>
              <IconifyIconOnline icon="ri:layout-line" class="mr-2" />
              现代化界面设计
            </h3>
            <ul>
              <li>左右分割布局，信息展示清晰</li>
              <li>响应式设计，支持多种设备</li>
              <li>暗色主题，护眼舒适</li>
              <li>流畅的动画效果</li>
            </ul>
          </div>
        </el-col>
        <el-col :span="12">
          <div class="feature-detail">
            <h3>
              <IconifyIconOnline icon="ri:dashboard-3-line" class="mr-2" />
              实时监控系统
            </h3>
            <ul>
              <li>实时显示系统指标</li>
              <li>历史数据趋势分析</li>
              <li>自定义告警规则</li>
              <li>多种通知方式</li>
            </ul>
          </div>
        </el-col>
        <el-col :span="12">
          <div class="feature-detail">
            <h3>
              <IconifyIconOnline icon="ri:remote-control-line" class="mr-2" />
              多协议远程连接
            </h3>
            <ul>
              <li>SSH终端连接</li>
              <li>RDP远程桌面</li>
              <li>VNC桌面访问</li>
              <li>文件传输管理</li>
            </ul>
          </div>
        </el-col>
        <el-col :span="12">
          <div class="feature-detail">
            <h3>
              <IconifyIconOnline icon="ri:tools-line" class="mr-2" />
              高级管理功能
            </h3>
            <ul>
              <li>批量操作支持</li>
              <li>脚本执行器</li>
              <li>操作日志审计</li>
              <li>配置导入导出</li>
            </ul>
          </div>
        </el-col>
      </el-row>
    </div>

    <!-- 体验按钮 -->
    <div class="demo-actions">
      <el-button type="primary" size="large" @click="goToServerManagement">
        <IconifyIconOnline icon="ri:eye-line" class="mr-2" />
        立即体验
      </el-button>
      <el-button size="large" @click="viewDocumentation">
        <IconifyIconOnline icon="ri:book-line" class="mr-2" />
        查看文档
      </el-button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from "vue";
import { useRouter } from "vue-router";
import { message } from "@repo/utils";

const router = useRouter();

// 模拟实时数据
const cpuUsage = ref(45);
const memoryUsage = ref(68);
const diskUsage = ref(32);
const networkIn = ref(12.5);
const networkOut = ref(8.3);

let timer: NodeJS.Timeout | null = null;

// 模拟数据更新
const updateMetrics = () => {
  cpuUsage.value = Math.floor(Math.random() * 40) + 30;
  memoryUsage.value = Math.floor(Math.random() * 30) + 50;
  diskUsage.value = Math.floor(Math.random() * 20) + 25;
  networkIn.value = Math.round((Math.random() * 20 + 5) * 10) / 10;
  networkOut.value = Math.round((Math.random() * 15 + 3) * 10) / 10;
};

const goToServerManagement = () => {
  router.push('/server');
};

const viewDocumentation = () => {
  message.info('文档功能开发中...');
};

onMounted(() => {
  // 每2秒更新一次数据
  timer = setInterval(updateMetrics, 2000);
});

onUnmounted(() => {
  if (timer) {
    clearInterval(timer);
  }
});
</script>

<style lang="scss" scoped>
.demo-container {
  padding: 20px;
  max-width: 1200px;
  margin: 0 auto;
}

.demo-header {
  text-align: center;
  margin-bottom: 40px;

  h1 {
    font-size: 32px;
    font-weight: 600;
    margin-bottom: 16px;
    color: var(--el-text-color-primary);
  }

  p {
    font-size: 16px;
    color: var(--el-text-color-secondary);
    margin-bottom: 32px;
  }

  .demo-features {
    .feature-card {
      text-align: center;
      padding: 24px;
      border: 1px solid var(--el-border-color-light);
      border-radius: 8px;
      background-color: var(--el-bg-color);
      transition: all 0.3s ease;

      &:hover {
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
        border-color: var(--el-color-primary);
      }

      .feature-icon {
        font-size: 32px;
        color: var(--el-color-primary);
        margin-bottom: 12px;
      }

      h3 {
        font-size: 18px;
        font-weight: 500;
        margin: 0 0 8px 0;
        color: var(--el-text-color-primary);
      }

      p {
        font-size: 14px;
        color: var(--el-text-color-secondary);
        margin: 0;
      }
    }
  }
}

.demo-preview {
  margin-bottom: 40px;

  h2 {
    font-size: 24px;
    font-weight: 500;
    margin-bottom: 20px;
    color: var(--el-text-color-primary);
  }

  .preview-container {
    border: 1px solid var(--el-border-color-light);
    border-radius: 8px;
    overflow: hidden;
    background-color: var(--el-bg-color);
  }

  .preview-mockup {
    .mockup-toolbar {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 12px 16px;
      background-color: var(--el-fill-color-extra-light);
      border-bottom: 1px solid var(--el-border-color-lighter);

      .toolbar-left {
        display: flex;
        align-items: center;
        gap: 12px;

        .page-title {
          font-size: 16px;
          font-weight: 500;
          color: var(--el-text-color-primary);
        }
      }

      .toolbar-right {
        display: flex;
        align-items: center;
        gap: 12px;
      }
    }

    .mockup-content {
      display: flex;
      height: 400px;

      .mockup-left {
        width: 300px;
        border-right: 1px solid var(--el-border-color-lighter);
        padding: 16px;
        overflow-y: auto;

        .server-card-demo {
          border: 1px solid var(--el-border-color-light);
          border-radius: 6px;
          padding: 12px;
          margin-bottom: 8px;
          cursor: pointer;
          transition: all 0.3s ease;

          &:hover {
            border-color: var(--el-color-primary);
          }

          &.active {
            border-color: var(--el-color-primary);
            background-color: var(--el-color-primary-light-9);
          }

          .card-header {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            margin-bottom: 8px;

            .server-info {
              .server-name {
                font-size: 14px;
                font-weight: 500;
                color: var(--el-text-color-primary);
                margin-bottom: 2px;
              }

              .server-address {
                font-size: 12px;
                color: var(--el-text-color-secondary);
                font-family: monospace;
              }
            }

            .server-status {
              display: flex;
              align-items: center;
              gap: 6px;

              .protocol-icon {
                font-size: 14px;
                color: var(--el-color-primary);
              }
            }
          }

          .metrics-demo {
            .metric-item {
              display: flex;
              align-items: center;
              gap: 6px;
              margin-bottom: 4px;
              font-size: 11px;

              &:last-child {
                margin-bottom: 0;
              }

              .metric-label {
                width: 25px;
                color: var(--el-text-color-secondary);
                flex-shrink: 0;
              }

              .el-progress {
                flex: 1;
              }

              .metric-value {
                width: 30px;
                text-align: right;
                font-weight: 500;
                color: var(--el-text-color-primary);
                flex-shrink: 0;
              }
            }
          }
        }
      }

      .mockup-right {
        flex: 1;
        padding: 16px;

        .monitor-panel-demo {
          .panel-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 16px;
            padding-bottom: 12px;
            border-bottom: 1px solid var(--el-border-color-lighter);

            h3 {
              margin: 0;
              font-size: 16px;
              font-weight: 500;
              color: var(--el-text-color-primary);
            }

            .panel-actions {
              display: flex;
              gap: 8px;
            }
          }

          .metrics-grid-demo {
            display: grid;
            grid-template-columns: repeat(2, 1fr);
            gap: 16px;

            .metric-card-demo {
              border: 1px solid var(--el-border-color-light);
              border-radius: 6px;
              padding: 16px;
              background-color: var(--el-bg-color);

              .metric-header {
                display: flex;
                align-items: center;
                margin-bottom: 12px;
                font-size: 14px;
                font-weight: 500;
                color: var(--el-text-color-primary);

                .iconify {
                  margin-right: 6px;
                  color: var(--el-color-primary);
                }
              }

              .metric-value {
                font-size: 20px;
                font-weight: 600;
                color: var(--el-text-color-primary);
                margin-bottom: 8px;
              }

              .network-stats {
                font-size: 12px;
                color: var(--el-text-color-secondary);

                div {
                  margin-bottom: 4px;

                  &:last-child {
                    margin-bottom: 0;
                  }
                }
              }
            }
          }
        }
      }
    }
  }
}

.demo-features-detail {
  margin-bottom: 40px;

  h2 {
    font-size: 24px;
    font-weight: 500;
    margin-bottom: 20px;
    color: var(--el-text-color-primary);
  }

  .feature-detail {
    padding: 20px;
    border: 1px solid var(--el-border-color-light);
    border-radius: 8px;
    background-color: var(--el-bg-color);
    margin-bottom: 20px;

    h3 {
      font-size: 16px;
      font-weight: 500;
      margin-bottom: 12px;
      color: var(--el-text-color-primary);
      display: flex;
      align-items: center;
    }

    ul {
      margin: 0;
      padding-left: 20px;

      li {
        margin-bottom: 6px;
        color: var(--el-text-color-secondary);
        line-height: 1.5;

        &:last-child {
          margin-bottom: 0;
        }
      }
    }
  }
}

.demo-actions {
  text-align: center;
  padding: 40px 0;

  .el-button {
    margin: 0 8px;
  }
}
</style>
