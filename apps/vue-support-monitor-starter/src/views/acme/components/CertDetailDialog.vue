<template>
  <sc-dialog
    v-model="dialogVisible"
    title=""
    width="780px"
    :close-on-click-modal="false"
    class="cert-detail-dialog"
    append-to-body
  >
    <template #header>
      <div class="dialog-header">
        <div class="header-icon">
          <IconifyIconOnline icon="mdi:certificate" />
        </div>
        <div class="header-info">
          <h3>证书详情</h3>
          <p>{{ detail?.certificate?.acmeCertPrimaryDomain || '加载中...' }}</p>
        </div>
        <div class="header-status" v-if="detail?.certificate?.acmeCertStatus">
          <div class="status-badge" :class="`status-${detail.certificate.acmeCertStatus}`">
            <span class="status-dot"></span>
            <span>{{ getStatusLabel(detail.certificate.acmeCertStatus) }}</span>
          </div>
        </div>
      </div>
    </template>

    <el-skeleton :loading="loading" animated :rows="6">
      <template #default>
        <!-- 基本信息卡片 -->
        <div class="info-cards">
          <div class="info-card">
            <div class="card-icon domain">
              <IconifyIconOnline icon="mdi:web" />
            </div>
            <div class="card-content">
              <div class="card-label">主域名</div>
              <div class="card-value">{{ detail?.certificate?.acmeCertPrimaryDomain }}</div>
              <div class="card-extra" v-if="detail?.certificate?.acmeCertSan">
                +{{ (detail.certificate.acmeCertSan || '').split(',').length }} 个备用域名
              </div>
            </div>
          </div>
          <div class="info-card">
            <div class="card-icon expiry" :class="getExpiryClass()">
              <IconifyIconOnline icon="mdi:clock-outline" />
            </div>
            <div class="card-content">
              <div class="card-label">有效期</div>
              <div class="card-value" :class="getExpiryClass()">
                {{ detail?.daysUntilExpiry != null ? `${detail.daysUntilExpiry} 天` : '-' }}
              </div>
              <div class="card-extra">{{ detail?.certificate?.acmeCertNotAfter || '-' }}</div>
            </div>
          </div>
          <div class="info-card">
            <div class="card-icon challenge">
              <IconifyIconOnline :icon="detail?.certificate?.acmeCertChallengeType === 'DNS-01' ? 'mdi:dns' : 'mdi:web'" />
            </div>
            <div class="card-content">
              <div class="card-label">验证方式</div>
              <div class="card-value">{{ detail?.certificate?.acmeCertChallengeType }}</div>
              <div class="card-extra">{{ detail?.certificate?.acmeCertChallengeType === 'DNS-01' ? 'DNS记录验证' : 'HTTP文件验证' }}</div>
            </div>
          </div>
          <div class="info-card">
            <div class="card-icon account">
              <IconifyIconOnline icon="mdi:account-key" />
            </div>
            <div class="card-content">
              <div class="card-label">关联账户</div>
              <div class="card-value">{{ detail?.account?.acmeAccountEmail || '-' }}</div>
              <div class="card-extra">ACME 账户</div>
            </div>
          </div>
        </div>

        <!-- 时间轴 -->
        <div class="timeline-section">
          <div class="section-title">
            <IconifyIconOnline icon="mdi:timeline" />
            <span>证书生命周期</span>
          </div>
          <div class="cert-timeline">
            <div class="timeline-item">
              <div class="timeline-dot start"></div>
              <div class="timeline-content">
                <span class="timeline-label">生效时间</span>
                <span class="timeline-value">{{ detail?.certificate?.acmeCertNotBefore || '-' }}</span>
              </div>
            </div>
            <div class="timeline-progress">
              <div class="progress-bar" :style="{ width: getProgressPercent() + '%' }"></div>
              <div class="progress-marker" :style="{ left: getProgressPercent() + '%' }">
                <span>当前</span>
              </div>
            </div>
            <div class="timeline-item">
              <div class="timeline-dot end" :class="getExpiryClass()"></div>
              <div class="timeline-content">
                <span class="timeline-label">到期时间</span>
                <span class="timeline-value">{{ detail?.certificate?.acmeCertNotAfter || '-' }}</span>
              </div>
            </div>
          </div>
        </div>

        <!-- 错误信息 -->
        <div class="error-section" v-if="detail?.certificate?.acmeCertLastError">
          <el-alert
            :title="detail.certificate.acmeCertLastError"
            type="error"
            :closable="false"
            show-icon
          />
        </div>

        <!-- 验证信息（待验证状态时显示） -->
        <div class="validation-section" v-if="detail?.certificate?.acmeCertStatus === 'validating' && validationInfos.length > 0">
          <div class="section-title">
            <IconifyIconOnline icon="mdi:shield-check" />
            <span>验证信息</span>
            <el-tag type="warning" size="small">待完成</el-tag>
          </div>
          <el-alert
            title="请按以下信息完成域名验证，部署完成后点击重新验证"
            type="warning"
            :closable="false"
            style="margin-bottom: 16px;"
          />
          <div class="validation-list">
            <div class="validation-item" v-for="(info, index) in validationInfos" :key="index">
              <div class="validation-header">
                <div class="validation-domain">
                  <IconifyIconOnline icon="mdi:web" />
                  <span>{{ info.domain }}</span>
                </div>
                <el-tag size="small" :type="info.type === 'HTTP-01' ? 'primary' : 'success'">
                  {{ info.type }}
                </el-tag>
              </div>
              <!-- HTTP-01 验证 -->
              <div class="validation-body" v-if="info.type === 'HTTP-01'">
                <div class="validation-row">
                  <span class="validation-label">验证地址</span>
                  <div class="validation-value-box">
                    <code class="validation-code">http://{{ info.domain }}/.well-known/acme-challenge/{{ info.token }}</code>
                    <el-button size="small" text @click="copyToClipboard(`http://${info.domain}/.well-known/acme-challenge/${info.token}`)">
                      <IconifyIconOnline icon="mdi:content-copy" />
                    </el-button>
                  </div>
                </div>
                <div class="validation-row">
                  <span class="validation-label">文件内容</span>
                  <div class="validation-value-box">
                    <code class="validation-code">{{ info.keyAuthorization }}</code>
                    <el-button size="small" text @click="copyToClipboard(info.keyAuthorization)">
                      <IconifyIconOnline icon="mdi:content-copy" />
                    </el-button>
                  </div>
                </div>
                <div class="validation-tip">
                  <IconifyIconOnline icon="mdi:information" />
                  <span>在服务器上创建文件 <code>/.well-known/acme-challenge/{{ info.token }}</code>，内容为上面的文件内容</span>
                </div>
              </div>
              <!-- DNS-01 验证 -->
              <div class="validation-body" v-if="info.type === 'DNS-01'">
                <div class="validation-row">
                  <span class="validation-label">TXT 记录名</span>
                  <div class="validation-value-box">
                    <code class="validation-code">{{ info.dnsName }}</code>
                    <el-button size="small" text @click="copyToClipboard(info.dnsName)">
                      <IconifyIconOnline icon="mdi:content-copy" />
                    </el-button>
                  </div>
                </div>
                <div class="validation-row">
                  <span class="validation-label">TXT 记录值</span>
                  <div class="validation-value-box">
                    <code class="validation-code">{{ info.dnsValue }}</code>
                    <el-button size="small" text @click="copyToClipboard(info.dnsValue)">
                      <IconifyIconOnline icon="mdi:content-copy" />
                    </el-button>
                  </div>
                </div>
                <div class="validation-tip">
                  <IconifyIconOnline icon="mdi:information" />
                  <span>在 DNS 管理面板添加 TXT 记录，名称为 <code>{{ info.dnsName }}</code>，值为上面的 TXT 记录值</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- 证书内容 -->
        <div class="cert-content-section">
          <div class="section-title">
            <IconifyIconOnline icon="mdi:file-certificate" />
            <span>证书内容</span>
          </div>
          <div class="content-tabs">
            <div
              class="tab-item"
              :class="{ active: activeTab === 'chain' }"
              @click="activeTab = 'chain'"
            >
              <IconifyIconOnline icon="mdi:link-variant" />
              <span>证书链</span>
            </div>
            <div
              class="tab-item"
              :class="{ active: activeTab === 'key' }"
              @click="activeTab = 'key'"
            >
              <IconifyIconOnline icon="mdi:key" />
              <span>私钥</span>
            </div>
          </div>
          <div class="tab-content">
            <div v-show="activeTab === 'chain'" class="code-block">
              <div class="code-header">
                <span>certificate.pem</span>
                <el-button size="small" text @click="copyToClipboard(detail?.certificate?.acmeCertChainPem)">
                  <IconifyIconOnline icon="mdi:content-copy" />
                  复制
                </el-button>
              </div>
              <pre class="code-content">{{ detail?.certificate?.acmeCertChainPem || '暂无证书内容' }}</pre>
            </div>
            <div v-show="activeTab === 'key'" class="code-block">
              <div class="key-warning">
                <IconifyIconOnline icon="mdi:shield-alert" />
                <span>私钥信息敏感，请勿泄露给他人</span>
              </div>
              <div class="code-header">
                <span>private.key</span>
                <el-button size="small" text @click="copyToClipboard(detail?.certificate?.acmeCertKeyPem)">
                  <IconifyIconOnline icon="mdi:content-copy" />
                  复制
                </el-button>
              </div>
              <pre class="code-content">{{ detail?.certificate?.acmeCertKeyPem || '暂无私钥内容' }}</pre>
            </div>
          </div>
        </div>

        <!-- 申请历史时间线 -->
        <div class="history-section">
          <div class="section-title">
            <IconifyIconOnline icon="mdi:history" />
            <span>申请历史</span>
          </div>
          <div class="history-timeline">
            <div class="history-item">
              <div class="history-dot create"></div>
              <div class="history-line"></div>
              <div class="history-content">
                <div class="history-title">创建证书申请</div>
                <div class="history-time">{{ detail?.certificate?.createTime || '-' }}</div>
              </div>
            </div>
            <div class="history-item" v-if="detail?.certificate?.acmeCertStatus === 'validating' || detail?.certificate?.acmeCertStatus === 'valid'">
              <div class="history-dot validating"></div>
              <div class="history-line"></div>
              <div class="history-content">
                <div class="history-title">开始域名验证</div>
                <div class="history-desc">{{ detail?.certificate?.acmeCertChallengeType }} 验证方式</div>
              </div>
            </div>
            <div class="history-item" v-if="detail?.certificate?.acmeCertNotBefore">
              <div class="history-dot success"></div>
              <div class="history-line"></div>
              <div class="history-content">
                <div class="history-title">证书签发成功</div>
                <div class="history-time">{{ detail?.certificate?.acmeCertNotBefore }}</div>
              </div>
            </div>
            <div class="history-item" v-if="detail?.certificate?.acmeCertStatus === 'failed'">
              <div class="history-dot failed"></div>
              <div class="history-line"></div>
              <div class="history-content">
                <div class="history-title">申请失败</div>
                <div class="history-desc text-danger">{{ detail?.certificate?.acmeCertLastError }}</div>
              </div>
            </div>
            <div class="history-item" v-if="detail?.certificate?.acmeCertRenewAt">
              <div class="history-dot renew"></div>
              <div class="history-content">
                <div class="history-title">计划续签时间</div>
                <div class="history-time">{{ detail?.certificate?.acmeCertRenewAt }}</div>
              </div>
            </div>
          </div>
        </div>

        <!-- 订单记录 -->
        <div class="orders-section" v-if="detail?.orders?.length">
          <div class="section-title">
            <IconifyIconOnline icon="mdi:receipt" />
            <span>订单记录</span>
            <span class="order-count">{{ detail.orders.length }}</span>
          </div>
          <div class="orders-list">
            <div class="order-item" v-for="order in detail.orders" :key="order.acmeOrderId">
              <div class="order-header">
                <div class="order-id">
                  <IconifyIconOnline icon="mdi:identifier" />
                  <span>#{{ order.acmeOrderId }}</span>
                </div>
                <div class="order-status-badge" :class="getOrderStatusClass(order.acmeOrderStatus)">
                  <span class="status-dot"></span>
                  <span>{{ getOrderStatusLabel(order.acmeOrderStatus) }}</span>
                </div>
              </div>
              <div class="order-body">
                <div class="order-row" v-if="order.acmeOrderUrl">
                  <span class="order-label">订单URL</span>
                  <span class="order-value order-url">{{ order.acmeOrderUrl }}</span>
                </div>
                <div class="order-row" v-if="order.acmeCertificateUrl">
                  <span class="order-label">证书URL</span>
                  <span class="order-value">{{ order.acmeCertificateUrl }}</span>
                </div>
              </div>
              <div class="order-footer">
                <div class="order-time">
                  <IconifyIconOnline icon="mdi:clock-outline" />
                  <span>创建: {{ order.createTime }}</span>
                </div>
                <div class="order-time" v-if="order.updateTime !== order.createTime">
                  <IconifyIconOnline icon="mdi:update" />
                  <span>更新: {{ order.updateTime }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </template>
    </el-skeleton>

    <template #footer>
      <div class="dialog-footer">
        <el-button @click="dialogVisible = false">关闭</el-button>
      </div>
    </template>
  </sc-dialog>
</template>

<script setup lang="ts">
import { ref, computed, watch } from "vue";
import { message } from "@repo/utils";
import {
  getCertDetail,
  CERT_STATUS,
  type AcmeCertificateDetail,
} from "@/api/acme";

defineOptions({
  name: "CertDetailDialog",
});

const props = defineProps<{
  visible: boolean;
  certId: number;
}>();

const emit = defineEmits<{
  "update:visible": [value: boolean];
}>();

const dialogVisible = computed({
  get: () => props.visible,
  set: (val) => emit("update:visible", val),
});

const loading = ref(false);
const activeTab = ref("chain");
const detail = ref<AcmeCertificateDetail>();

/** 解析后的验证信息 */
interface ValidationInfo {
  domain: string;
  type: string;
  token?: string;
  keyAuthorization?: string;
  httpPath?: string;
  httpContent?: string;
  dnsName?: string;
  dnsValue?: string;
}
const validationInfos = ref<ValidationInfo[]>([]);

/**
 * 获取状态类型
 */
function getStatusType(status?: string) {
  if (!status) return "info";
  const item = CERT_STATUS.find((s) => s.value === status);
  return item?.type || "info";
}

/**
 * 获取状态标签
 */
function getStatusLabel(status?: string) {
  if (!status) return "-";
  const item = CERT_STATUS.find((s) => s.value === status);
  return item?.label || status;
}

/**
 * 获取到期状态样式
 */
function getExpiryClass() {
  const days = detail.value?.daysUntilExpiry;
  if (days == null) return '';
  if (days < 0) return 'expired';
  if (days <= 7) return 'critical';
  if (days <= 30) return 'warning';
  return 'normal';
}

/**
 * 获取进度百分比
 */
function getProgressPercent() {
  const cert = detail.value?.certificate;
  if (!cert?.acmeCertNotBefore || !cert?.acmeCertNotAfter) return 0;
  const start = new Date(cert.acmeCertNotBefore).getTime();
  const end = new Date(cert.acmeCertNotAfter).getTime();
  const now = Date.now();
  const total = end - start;
  const elapsed = now - start;
  return Math.max(0, Math.min(100, (elapsed / total) * 100));
}

/**
 * 复制到剪贴板
 */
async function copyToClipboard(text?: string) {
  if (!text) return;
  try {
    await navigator.clipboard.writeText(text);
    message("已复制到剪贴板", { type: "success" });
  } catch {
    message("复制失败", { type: "error" });
  }
}

/**
 * 获取订单状态样式类
 */
function getOrderStatusClass(status?: string) {
  if (!status) return '';
  const statusMap: Record<string, string> = {
    'pending': 'pending',
    'ready': 'ready',
    'processing': 'processing',
    'valid': 'valid',
    'invalid': 'invalid'
  };
  return statusMap[status] || '';
}

/**
 * 获取订单状态标签
 */
function getOrderStatusLabel(status?: string) {
  if (!status) return '未知';
  const labelMap: Record<string, string> = {
    'pending': '待处理',
    'ready': '就绪',
    'processing': '处理中',
    'valid': '已完成',
    'invalid': '已失效'
  };
  return labelMap[status] || status;
}

/**
 * 解析验证信息
 */
function parseValidationInfos() {
  validationInfos.value = [];
  if (!detail.value?.orders?.length) return;
  
  // 取最新的订单
  const latestOrder = detail.value.orders[0];
  if (!latestOrder.acmeAuthzUrls) return;
  
  try {
    const infos = JSON.parse(latestOrder.acmeAuthzUrls);
    if (Array.isArray(infos)) {
      validationInfos.value = infos;
    }
  } catch (e) {
    console.error('解析验证信息失败', e);
  }
}

/**
 * 加载详情
 */
async function loadDetail() {
  if (!props.certId) return;

  loading.value = true;
  try {
    const res = (await getCertDetail(props.certId)) as unknown as {
      data: AcmeCertificateDetail;
    };
    detail.value = res.data;
    parseValidationInfos();
  } catch (error) {
    console.error("加载证书详情失败", error);
  } finally {
    loading.value = false;
  }
}

watch(
  () => props.visible,
  (val) => {
    if (val && props.certId) {
      activeTab.value = "chain";
      loadDetail();
    }
  }
);
</script>

<style scoped lang="scss">
/* 对话框头部 */
.dialog-header {
  display: flex;
  align-items: center;
  gap: 16px;
  padding-right: 40px;
}

.header-icon {
  width: 48px;
  height: 48px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 12px;
  color: #fff;
  font-size: 24px;
}

.header-info {
  flex: 1;

  h3 {
    margin: 0;
    font-size: 18px;
    font-weight: 600;
    color: var(--el-text-color-primary);
  }

  p {
    margin: 4px 0 0;
    font-size: 13px;
    color: var(--el-text-color-secondary);
  }
}

/* 状态徽章 */
.status-badge {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 14px;
  border-radius: 20px;
  font-size: 13px;
  font-weight: 500;

  .status-dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
  }

  &.status-valid {
    background: rgba(16, 185, 129, 0.1);
    color: #10b981;
    .status-dot {
      background: #10b981;
      box-shadow: 0 0 8px rgba(16, 185, 129, 0.5);
    }
  }

  &.status-pending,
  &.status-validating {
    background: rgba(245, 158, 11, 0.1);
    color: #f59e0b;
    .status-dot {
      background: #f59e0b;
      animation: pulse 2s infinite;
    }
  }

  &.status-expired, &.status-failed {
    background: rgba(239, 68, 68, 0.1);
    color: #ef4444;
    .status-dot {
      background: #ef4444;
    }
  }

  &.status-revoked {
    background: rgba(107, 114, 128, 0.1);
    color: #6b7280;
    .status-dot {
      background: #6b7280;
    }
  }
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}

/* 信息卡片 */
.info-cards {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 16px;
  margin-bottom: 24px;
}

.info-card {
  display: flex;
  align-items: flex-start;
  gap: 14px;
  padding: 16px;
  background: var(--el-fill-color-lighter);
  border-radius: 12px;
  transition: all 0.2s ease;

  &:hover {
    background: var(--el-fill-color-light);
  }

  .card-icon {
    width: 42px;
    height: 42px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 10px;
    font-size: 20px;
    color: #fff;
    flex-shrink: 0;

    &.domain {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    }
    &.expiry {
      background: linear-gradient(135deg, #11998e 0%, #38ef7d 100%);
      &.warning { background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%); }
      &.critical, &.expired { background: linear-gradient(135deg, #eb3349 0%, #f45c43 100%); }
    }
    &.challenge {
      background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
    }
    &.account {
      background: linear-gradient(135deg, #fa709a 0%, #fee140 100%);
    }
  }

  .card-content {
    flex: 1;
    min-width: 0;
  }

  .card-label {
    font-size: 12px;
    color: var(--el-text-color-secondary);
    margin-bottom: 4px;
  }

  .card-value {
    font-size: 16px;
    font-weight: 600;
    color: var(--el-text-color-primary);
    word-break: break-all;

    &.warning { color: #f59e0b; }
    &.critical, &.expired { color: #ef4444; }
  }

  .card-extra {
    font-size: 12px;
    color: var(--el-text-color-placeholder);
    margin-top: 4px;
  }
}

/* 区域标题 */
.section-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 15px;
  font-weight: 600;
  color: var(--el-text-color-primary);
  margin-bottom: 16px;

  svg {
    color: var(--el-color-primary);
  }

  .order-count {
    min-width: 20px;
    height: 20px;
    padding: 0 6px;
    font-size: 11px;
    font-weight: 600;
    line-height: 20px;
    text-align: center;
    background: var(--el-color-primary-light-9);
    color: var(--el-color-primary);
    border-radius: 10px;
  }
}

/* 时间轴 */
.timeline-section {
  margin-bottom: 24px;
  padding: 20px;
  background: var(--el-fill-color-lighter);
  border-radius: 12px;
}

.cert-timeline {
  display: flex;
  align-items: center;
  gap: 16px;
}

.timeline-item {
  display: flex;
  align-items: center;
  gap: 10px;

  .timeline-dot {
    width: 12px;
    height: 12px;
    border-radius: 50%;

    &.start {
      background: var(--el-color-success);
    }
    &.end {
      background: var(--el-color-success);
      &.warning { background: #f59e0b; }
      &.critical, &.expired { background: #ef4444; }
    }
  }

  .timeline-content {
    display: flex;
    flex-direction: column;
  }

  .timeline-label {
    font-size: 11px;
    color: var(--el-text-color-secondary);
  }

  .timeline-value {
    font-size: 13px;
    font-weight: 500;
    color: var(--el-text-color-primary);
  }
}

.timeline-progress {
  flex: 1;
  height: 6px;
  background: var(--el-fill-color);
  border-radius: 3px;
  position: relative;

  .progress-bar {
    height: 100%;
    background: linear-gradient(90deg, #10b981, #34d399);
    border-radius: 3px;
  }

  .progress-marker {
    position: absolute;
    top: -20px;
    transform: translateX(-50%);
    font-size: 10px;
    color: var(--el-text-color-secondary);
    background: var(--el-bg-color);
    padding: 2px 6px;
    border-radius: 4px;
    border: 1px solid var(--el-border-color-lighter);
  }
}

/* 错误信息 */
.error-section {
  margin-bottom: 24px;
}

/* 验证信息 */
.validation-section {
  margin-bottom: 24px;
  padding: 20px;
  background: rgba(245, 158, 11, 0.05);
  border: 1px solid rgba(245, 158, 11, 0.2);
  border-radius: 12px;

  .section-title {
    .el-tag {
      margin-left: auto;
    }
  }
}

.validation-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.validation-item {
  padding: 16px;
  background: var(--el-bg-color);
  border-radius: 10px;
  border: 1px solid var(--el-border-color-lighter);
}

.validation-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
  padding-bottom: 12px;
  border-bottom: 1px dashed var(--el-border-color-lighter);
}

.validation-domain {
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: 500;
  color: var(--el-text-color-primary);

  svg {
    color: var(--el-color-primary);
  }
}

.validation-body {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.validation-row {
  display: flex;
  flex-direction: column;
  gap: 6px;

  .validation-label {
    font-size: 12px;
    color: var(--el-text-color-secondary);
  }
}

.validation-value-box {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 12px;
  background: var(--el-fill-color-lighter);
  border-radius: 6px;
  border: 1px solid var(--el-border-color-lighter);

  .validation-code {
    flex: 1;
    font-family: "SF Mono", Monaco, monospace;
    font-size: 12px;
    color: var(--el-text-color-primary);
    word-break: break-all;
  }
}

.validation-tip {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  padding: 10px 12px;
  background: rgba(59, 130, 246, 0.05);
  border-radius: 6px;
  font-size: 12px;
  color: var(--el-text-color-secondary);

  svg {
    color: #3b82f6;
    flex-shrink: 0;
    margin-top: 2px;
  }

  code {
    background: rgba(59, 130, 246, 0.1);
    padding: 2px 6px;
    border-radius: 4px;
    font-family: "SF Mono", Monaco, monospace;
    color: #3b82f6;
  }
}

/* 证书内容 */
.cert-content-section {
  margin-bottom: 24px;
}

.content-tabs {
  display: flex;
  gap: 8px;
  margin-bottom: 16px;

  .tab-item {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 8px 16px;
    font-size: 13px;
    color: var(--el-text-color-secondary);
    background: var(--el-fill-color-lighter);
    border-radius: 8px;
    cursor: pointer;
    transition: all 0.2s ease;

    &:hover {
      background: var(--el-fill-color);
    }

    &.active {
      background: var(--el-color-primary-light-9);
      color: var(--el-color-primary);
    }
  }
}

.tab-content {
  .code-block {
    border: 1px solid var(--el-border-color-lighter);
    border-radius: 10px;
    overflow: hidden;
  }

  .code-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 10px 16px;
    background: var(--el-fill-color-lighter);
    font-size: 12px;
    font-family: "SF Mono", Monaco, monospace;
    color: var(--el-text-color-secondary);
  }

  .code-content {
    margin: 0;
    padding: 16px;
    font-size: 12px;
    font-family: "SF Mono", Monaco, monospace;
    line-height: 1.6;
    color: var(--el-text-color-primary);
    background: var(--el-bg-color);
    white-space: pre-wrap;
    word-break: break-all;
    max-height: 200px;
    overflow-y: auto;
  }

  .key-warning {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 10px 16px;
    background: rgba(245, 158, 11, 0.1);
    color: #f59e0b;
    font-size: 12px;
  }
}

/* 申请历史时间线 */
.history-section {
  margin-bottom: 24px;
  padding: 20px;
  background: var(--el-fill-color-lighter);
  border-radius: 12px;
}

.history-timeline {
  display: flex;
  flex-direction: column;
  padding-left: 12px;
}

.history-item {
  display: flex;
  align-items: flex-start;
  gap: 16px;
  position: relative;
  padding-bottom: 20px;

  &:last-child {
    padding-bottom: 0;

    .history-line {
      display: none;
    }
  }

  .history-dot {
    width: 12px;
    height: 12px;
    border-radius: 50%;
    flex-shrink: 0;
    margin-top: 4px;
    z-index: 1;

    &.create {
      background: var(--el-color-primary);
      box-shadow: 0 0 8px rgba(64, 158, 255, 0.4);
    }

    &.validating {
      background: #f59e0b;
      box-shadow: 0 0 8px rgba(245, 158, 11, 0.4);
    }

    &.success {
      background: #10b981;
      box-shadow: 0 0 8px rgba(16, 185, 129, 0.4);
    }

    &.failed {
      background: #ef4444;
      box-shadow: 0 0 8px rgba(239, 68, 68, 0.4);
    }

    &.renew {
      background: #8b5cf6;
      box-shadow: 0 0 8px rgba(139, 92, 246, 0.4);
    }
  }

  .history-line {
    position: absolute;
    left: 5px;
    top: 20px;
    width: 2px;
    height: calc(100% - 8px);
    background: var(--el-border-color-lighter);
  }

  .history-content {
    flex: 1;

    .history-title {
      font-size: 14px;
      font-weight: 500;
      color: var(--el-text-color-primary);
    }

    .history-time {
      font-size: 12px;
      color: var(--el-text-color-secondary);
      margin-top: 4px;
    }

    .history-desc {
      font-size: 12px;
      color: var(--el-text-color-secondary);
      margin-top: 4px;

      &.text-danger {
        color: var(--el-color-danger);
      }
    }
  }
}

/* 订单列表 */
.orders-section {
  .orders-list {
    display: flex;
    flex-direction: column;
    gap: 12px;
  }

  .order-item {
    padding: 16px;
    background: var(--el-fill-color-lighter);
    border-radius: 10px;
    border: 1px solid var(--el-border-color-lighter);
    transition: all 0.2s ease;

    &:hover {
      border-color: var(--el-color-primary-light-5);
      box-shadow: 0 2px 12px rgba(0, 0, 0, 0.06);
    }
  }

  .order-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 12px;
    padding-bottom: 12px;
    border-bottom: 1px dashed var(--el-border-color-lighter);
  }

  .order-id {
    display: flex;
    align-items: center;
    gap: 6px;
    font-family: "SF Mono", Monaco, monospace;
    font-size: 14px;
    font-weight: 500;
    color: var(--el-text-color-primary);

    svg {
      color: var(--el-color-primary);
    }
  }

  .order-status-badge {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 4px 12px;
    border-radius: 20px;
    font-size: 12px;
    font-weight: 500;

    .status-dot {
      width: 6px;
      height: 6px;
      border-radius: 50%;
    }

    &.pending {
      background: rgba(59, 130, 246, 0.1);
      color: #3b82f6;
      .status-dot { background: #3b82f6; }
    }

    &.ready {
      background: rgba(245, 158, 11, 0.1);
      color: #f59e0b;
      .status-dot { background: #f59e0b; }
    }

    &.processing {
      background: rgba(139, 92, 246, 0.1);
      color: #8b5cf6;
      .status-dot { background: #8b5cf6; animation: pulse 2s infinite; }
    }

    &.valid {
      background: rgba(16, 185, 129, 0.1);
      color: #10b981;
      .status-dot { background: #10b981; }
    }

    &.invalid {
      background: rgba(239, 68, 68, 0.1);
      color: #ef4444;
      .status-dot { background: #ef4444; }
    }
  }

  .order-body {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .order-row {
    display: flex;
    align-items: flex-start;
    gap: 12px;
    font-size: 13px;

    .order-label {
      flex-shrink: 0;
      width: 60px;
      color: var(--el-text-color-secondary);
    }

    .order-value {
      flex: 1;
      color: var(--el-text-color-regular);
      word-break: break-all;

      &.order-url {
        font-family: "SF Mono", Monaco, monospace;
        font-size: 12px;
      }
    }
  }

  .order-footer {
    display: flex;
    align-items: center;
    gap: 20px;
    margin-top: 12px;
    padding-top: 12px;
    border-top: 1px dashed var(--el-border-color-lighter);
  }

  .order-time {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 12px;
    color: var(--el-text-color-secondary);

    svg {
      font-size: 14px;
    }
  }
}

/* 对话框底部 */
.dialog-footer {
  display: flex;
  justify-content: flex-end;
}

.text-danger {
  color: var(--el-color-danger);
}


// 响应式设计
@media (max-width: 768px) {
  .page-header {
    flex-direction: column;
    gap: 12px;
    padding: 12px 16px;
  }
}

</style>

<style lang="scss">
.cert-detail-dialog {
  .el-dialog__header {
    padding: 20px 24px;
    margin: 0;
    border-bottom: 1px solid var(--el-border-color-lighter);
  }

  .el-dialog__body {
    padding: 24px;
    max-height: 70vh;
    overflow-y: auto;
  }

  .el-dialog__footer {
    padding: 16px 24px;
    border-top: 1px solid var(--el-border-color-lighter);
  }
}
</style>
