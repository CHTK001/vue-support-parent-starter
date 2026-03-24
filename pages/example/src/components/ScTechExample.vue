<template>
  <div class="sc-tech-demo">
    <div class="demo-header">
      <h1 class="demo-title">科技风格组件展示</h1>
      <p class="demo-subtitle">Tech Theme Components Showcase</p>
    </div>

    <!-- ScButton Tech 示例 -->
    <div class="demo-section">
      <h2 class="section-title">
        <IconifyIconOnline icon="ri:cursor-line" />
        ScButton 科技按钮
      </h2>

      <div class="demo-block">
        <h3 class="block-title">基础按钮</h3>
        <div class="button-group">
          <ScButton theme="tech">默认按钮</ScButton>
          <ScButton theme="tech" type="primary">主要按钮</ScButton>
          <ScButton theme="tech" type="success">成功按钮</ScButton>
          <ScButton theme="tech" type="warning">警告按钮</ScButton>
          <ScButton theme="tech" type="danger">危险按钮</ScButton>
        </div>
      </div>

      <div class="demo-block">
        <h3 class="block-title">图标按钮</h3>
        <div class="button-group">
          <ScButton theme="tech" icon="ep:search">搜索</ScButton>
          <ScButton theme="tech" icon="ep:upload" type="primary">上传</ScButton>
          <ScButton theme="tech" icon="ep:download" type="success"
            >下载</ScButton
          >
          <ScButton theme="tech" icon="ep:delete" type="danger">删除</ScButton>
          <ScButton theme="tech" circle icon="ep:plus" />
          <ScButton theme="tech" circle icon="ep:setting" type="primary" />
        </div>
      </div>

      <div class="demo-block">
        <h3 class="block-title">不同尺寸</h3>
        <div class="button-group">
          <ScButton theme="tech" size="large" type="primary">大型按钮</ScButton>
          <ScButton theme="tech" type="primary">默认按钮</ScButton>
          <ScButton theme="tech" size="small" type="primary">小型按钮</ScButton>
        </div>
      </div>

      <div class="demo-block">
        <h3 class="block-title">加载和禁用状态</h3>
        <div class="button-group">
          <ScButton theme="tech" loading type="primary">加载中</ScButton>
          <ScButton theme="tech" disabled type="primary">禁用按钮</ScButton>
        </div>
      </div>
    </div>

    <!-- ScCard Tech 示例 -->
    <div class="demo-section">
      <h2 class="section-title">
        <IconifyIconOnline icon="ri:layout-grid-line" />
        ScCard 科技卡片
      </h2>

      <div class="card-grid">
        <!-- 基础科技卡片 -->
        <ScCard
          layout="tech"
          title="系统监控"
          icon="ri:dashboard-line"
          theme="cyan"
        >
          <div class="card-content">
            <div class="data-item">
              <span class="data-label">CPU 使用率</span>
              <span class="data-value">45.2%</span>
            </div>
            <div class="data-item">
              <span class="data-label">内存使用</span>
              <span class="data-value">6.8 GB / 16 GB</span>
            </div>
            <div class="data-item">
              <span class="data-label">网络流量</span>
              <span class="data-value">128.5 MB/s</span>
            </div>
          </div>
          <template #footer>
            <ScButton theme="tech" size="small">查看详情</ScButton>
          </template>
        </ScCard>

        <!-- 蓝色主题 -->
        <ScCard
          layout="tech"
          title="数据分析"
          icon="ri:bar-chart-line"
          theme="blue"
          :active="true"
        >
          <div class="card-content">
            <div class="data-item">
              <span class="data-label">今日访问</span>
              <span class="data-value">12,345</span>
            </div>
            <div class="data-item">
              <span class="data-label">活跃用户</span>
              <span class="data-value">8,921</span>
            </div>
            <div class="data-item">
              <span class="data-label">转化率</span>
              <span class="data-value">23.5%</span>
            </div>
          </div>
          <template #footer>
            <ScButton theme="tech" size="small" type="primary"
              >导出报表</ScButton
            >
          </template>
        </ScCard>

        <!-- 绿色主题 -->
        <ScCard
          layout="tech"
          title="服务状态"
          icon="ri:server-line"
          theme="green"
        >
          <div class="card-content">
            <div class="status-item">
              <IconifyIconOnline
                icon="ri:checkbox-circle-fill"
                class="status-icon success"
              />
              <span>API 服务正常</span>
            </div>
            <div class="status-item">
              <IconifyIconOnline
                icon="ri:checkbox-circle-fill"
                class="status-icon success"
              />
              <span>数据库连接正常</span>
            </div>
            <div class="status-item">
              <IconifyIconOnline
                icon="ri:checkbox-circle-fill"
                class="status-icon success"
              />
              <span>缓存服务正常</span>
            </div>
          </div>
          <template #footer>
            <ScButton theme="tech" size="small" type="success"
              >健康检查</ScButton
            >
          </template>
        </ScCard>

        <!-- 紫色主题 -->
        <ScCard
          layout="tech"
          title="安全防护"
          icon="ri:shield-check-line"
          theme="purple"
        >
          <div class="card-content">
            <div class="data-item">
              <span class="data-label">防火墙状态</span>
              <span class="data-value success">已启用</span>
            </div>
            <div class="data-item">
              <span class="data-label">拦截攻击</span>
              <span class="data-value">234 次</span>
            </div>
            <div class="data-item">
              <span class="data-label">安全等级</span>
              <span class="data-value">高</span>
            </div>
          </div>
          <template #footer>
            <ScButton theme="tech" size="small">安全设置</ScButton>
          </template>
        </ScCard>

        <!-- 橙色主题 -->
        <ScCard
          layout="tech"
          title="告警中心"
          icon="ri:alarm-warning-line"
          theme="orange"
        >
          <div class="card-content">
            <div class="alert-item warning">
              <IconifyIconOnline icon="ri:error-warning-line" />
              <span>磁盘空间不足 (15%)</span>
            </div>
            <div class="alert-item info">
              <IconifyIconOnline icon="ri:information-line" />
              <span>系统更新可用</span>
            </div>
            <div class="alert-item info">
              <IconifyIconOnline icon="ri:information-line" />
              <span>备份任务已完成</span>
            </div>
          </div>
          <template #footer>
            <ScButton theme="tech" size="small" type="warning"
              >查看全部</ScButton
            >
          </template>
        </ScCard>

        <!-- 红色主题 -->
        <ScCard
          layout="tech"
          title="错误日志"
          icon="ri:file-warning-line"
          theme="red"
        >
          <div class="card-content">
            <div class="log-item">
              <span class="log-time">12:34:56</span>
              <span class="log-msg">数据库连接超时</span>
            </div>
            <div class="log-item">
              <span class="log-time">12:30:12</span>
              <span class="log-msg">API 请求失败</span>
            </div>
            <div class="log-item">
              <span class="log-time">12:25:45</span>
              <span class="log-msg">内存溢出警告</span>
            </div>
          </div>
          <template #footer>
            <ScButton theme="tech" size="small" type="danger"
              >清空日志</ScButton
            >
          </template>
        </ScCard>
      </div>
    </div>

    <!-- ScDialog Tech 示例 -->
    <div class="demo-section">
      <h2 class="section-title">
        <IconifyIconOnline icon="ri:window-line" />
        ScDialog 科技对话框
      </h2>

      <div class="button-group">
        <ScButton theme="tech" type="primary" @click="showTechDialog = true">
          打开科技对话框
        </ScButton>
        <ScButton theme="tech" type="success" @click="showTechDialog2 = true">
          打开数据分析对话框
        </ScButton>
      </div>

      <ScDialog
        v-model="showTechDialog"
        title="系统配置"
        theme="tech"
        mode="custom"
        width="600px"
        :resizable="true"
      >
        <div class="dialog-content">
          <div class="config-item">
            <label class="config-label">服务器地址</label>
            <ScInput v-model="config.server" placeholder="请输入服务器地址" />
          </div>
          <div class="config-item">
            <label class="config-label">端口号</label>
            <ScInput v-model="config.port" placeholder="请输入端口号" />
          </div>
          <div class="config-item">
            <label class="config-label">超时时间</label>
            <ScInput 
              v-model="config.timeout"
              placeholder="请输入超时时间(秒)"
            />
          </div>
        </div>
        <template #footer>
          <ScButton theme="tech" @click="showTechDialog = false">取消</ScButton>
          <ScButton theme="tech" type="primary" @click="handleSave"
            >保存配置</ScButton
          >
        </template>
      </ScDialog>

      <ScDialog
        v-model="showTechDialog2"
        title="数据分析报告"
        theme="tech"
        mode="custom"
        width="800px"
        :resizable="true"
      >
        <div class="dialog-content">
          <div class="report-section">
            <h3 class="report-title">访问统计</h3>
            <div class="report-data">
              <div class="report-item">
                <span class="report-label">总访问量</span>
                <span class="report-value">123,456</span>
              </div>
              <div class="report-item">
                <span class="report-label">独立访客</span>
                <span class="report-value">45,678</span>
              </div>
              <div class="report-item">
                <span class="report-label">平均停留时间</span>
                <span class="report-value">3分28秒</span>
              </div>
            </div>
          </div>
          <div class="report-section">
            <h3 class="report-title">用户行为</h3>
            <div class="report-data">
              <div class="report-item">
                <span class="report-label">页面浏览量</span>
                <span class="report-value">234,567</span>
              </div>
              <div class="report-item">
                <span class="report-label">跳出率</span>
                <span class="report-value">32.5%</span>
              </div>
              <div class="report-item">
                <span class="report-label">转化率</span>
                <span class="report-value">8.9%</span>
              </div>
            </div>
          </div>
        </div>
        <template #footer>
          <ScButton theme="tech" @click="showTechDialog2 = false"
            >关闭</ScButton
          >
          <ScButton theme="tech" type="success">导出报告</ScButton>
        </template>
      </ScDialog>
    </div>
  </div>
</template>

<script setup lang="ts">
/**
 * 科技风格组件示例
 * @author CH
 * @since 2025-12-03
 * @version 1.0.0
 */
import { ref } from "vue";
import { message } from "@repo/utils";
import { IconifyIconOnline } from "@repo/components/ReIcon";
import ScButton from "@repo/components/ScButton/index.vue";
import ScCard from "@repo/components/ScCard/index.vue";
import { ScDialog } from "@repo/components/ScDialog";

const showTechDialog = ref(false);
const showTechDialog2 = ref(false);

const config = ref({
  server: "192.168.1.100",
  port: "8080",
  timeout: "30",
});

const handleSave = () => {
  message("配置保存成功", { type: "success" });
  showTechDialog.value = false;
};
</script>

<style lang="scss" scoped>
.sc-tech-demo {
  padding: 24px;
  background: linear-gradient(135deg, #0a0e27 0%, #1a1f3a 100%);
  min-height: 100vh;
  color: #fff;
}

.demo-header {
  text-align: center;
  margin-bottom: 48px;
  padding: 40px 0;
  border-bottom: 2px solid rgba(0, 246, 255, 0.3);
}

.demo-title {
  font-size: 48px;
  font-weight: 700;
  color: #00f6ff;
  text-shadow: 0 0 20px rgba(0, 246, 255, 0.8);
  margin-bottom: 16px;
  letter-spacing: 2px;
}

.demo-subtitle {
  font-size: 18px;
  color: rgba(255, 255, 255, 0.7);
  letter-spacing: 4px;
  text-transform: uppercase;
}

.demo-section {
  margin-bottom: 48px;
}

.section-title {
  display: flex;
  align-items: center;
  gap: 12px;
  font-size: 28px;
  font-weight: 600;
  color: #00f6ff;
  margin-bottom: 24px;
  padding-bottom: 12px;
  border-bottom: 1px solid rgba(0, 246, 255, 0.3);

  svg {
    font-size: 32px;
  }
}

.demo-block {
  margin-bottom: 32px;
}

.block-title {
  font-size: 18px;
  color: rgba(255, 255, 255, 0.9);
  margin-bottom: 16px;
  padding-left: 12px;
  border-left: 3px solid #00f6ff;
}

.button-group {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
}

.card-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
  gap: 24px;
}

.card-content {
  padding: 16px 0;
}

.data-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 0;
  border-bottom: 1px solid rgba(0, 246, 255, 0.1);

  &:last-child {
    border-bottom: none;
  }
}

.data-label {
  color: rgba(255, 255, 255, 0.7);
  font-size: 14px;
}

.data-value {
  color: #00f6ff;
  font-size: 16px;
  font-weight: 600;

  &.success {
    color: #00ff88;
  }
}

.status-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 0;
  color: rgba(255, 255, 255, 0.9);
}

.status-icon {
  font-size: 20px;

  &.success {
    color: #00ff88;
  }
}

.alert-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 12px;
  margin-bottom: 8px;
  border-radius: 4px;
  background: rgba(0, 0, 0, 0.3);

  &.warning {
    border-left: 3px solid #ff9500;
    color: #ff9500;
  }

  &.info {
    border-left: 3px solid #1890ff;
    color: #1890ff;
  }

  svg {
    font-size: 18px;
  }
}

.log-item {
  display: flex;
  gap: 16px;
  padding: 8px 0;
  font-family: "Courier New", monospace;
  font-size: 13px;
}

.log-time {
  color: #00f6ff;
  font-weight: 600;
}

.log-msg {
  color: rgba(255, 255, 255, 0.8);
}

.dialog-content {
  padding: 20px 0;
}

.config-item {
  margin-bottom: 20px;

  &:last-child {
    margin-bottom: 0;
  }
}

.config-label {
  display: block;
  margin-bottom: 8px;
  color: #00f6ff;
  font-size: 14px;
  font-weight: 500;
}

.report-section {
  margin-bottom: 24px;

  &:last-child {
    margin-bottom: 0;
  }
}

.report-title {
  font-size: 18px;
  color: #00f6ff;
  margin-bottom: 16px;
  padding-bottom: 8px;
  border-bottom: 1px solid rgba(0, 246, 255, 0.3);
}

.report-data {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;
}

.report-item {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 16px;
  background: rgba(0, 0, 0, 0.3);
  border-radius: 4px;
  border: 1px solid rgba(0, 246, 255, 0.2);
}

.report-label {
  color: rgba(255, 255, 255, 0.7);
  font-size: 13px;
}

.report-value {
  color: #00f6ff;
  font-size: 24px;
  font-weight: 700;
}
</style>
