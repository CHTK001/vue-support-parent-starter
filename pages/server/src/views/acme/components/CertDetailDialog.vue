<script setup lang="ts">
import { computed, ref, watch } from "vue";
import ReDialog from "@repo/ui/re-dialog";
import ReTable from "@repo/ui/re-table";
import { getCertDetail, certStatusInfo, serverLabel, type AcmeCertificateDetail } from "../../../api/acmeApi";

const props = defineProps<{
  modelValue: boolean;
  certId?: number | null;
}>();

const emit = defineEmits<{
  "update:modelValue": [value: boolean];
}>();

const dialogVisible = computed({
  get: () => props.modelValue,
  set: (v) => emit("update:modelValue", v),
});

const loading = ref(false);
const detail = ref<AcmeCertificateDetail | null>(null);
const error = ref("");

async function load(): Promise<void> {
  if (!props.certId) return;
  loading.value = true;
  error.value = "";
  try {
    detail.value = await getCertDetail(props.certId);
  } catch (e) {
    detail.value = null;
    error.value = String((e as Error)?.message ?? e);
  } finally {
    loading.value = false;
  }
}

watch(dialogVisible, (v) => {
  if (v) void load();
});

const status = computed(() => certStatusInfo(detail.value?.certificate?.acmeCertStatus));

const sanCount = computed(() => {
  const san = detail.value?.certificate?.acmeCertSan;
  if (!san) return 0;
  return san.split(",").filter(Boolean).length;
});

const validationInfos = computed<Array<{ domain: string; type: string; token: string; httpContent: string; dnsName?: string; dnsValue?: string }>>(() => {
  const orders = detail.value?.orders ?? [];
  const authz = orders.flatMap(o => {
    try {
      const arr = JSON.parse(o.acmeAuthzUrls || "[]");
      return Array.isArray(arr) ? arr : [];
    } catch {
      return [];
    }
  });
  return authz as Array<{ domain: string; type: string; token: string; httpContent: string; dnsName?: string; dnsValue?: string }>;
});

function expiryText(): string {
  const d = detail.value?.daysUntilExpiry;
  if (d == null) return "—";
  if (d < 0) return `已过期 ${-d} 天`;
  return `剩余 ${d} 天`;
}

function progressPercent(): number {
  const c = detail.value?.certificate;
  if (!c?.acmeCertNotBefore || !c?.acmeCertNotAfter) return 0;
  const start = new Date(c.acmeCertNotBefore.replace(" ", "T")).getTime();
  const end = new Date(c.acmeCertNotAfter.replace(" ", "T")).getTime();
  const now = Date.now();
  if (end <= start) return 100;
  const pct = ((now - start) / (end - start)) * 100;
  return Math.max(0, Math.min(100, Math.round(pct)));
}
</script>

<template>
  <ReDialog v-model="dialogVisible" :title="`证书详情 · ${detail?.certificate?.acmeCertPrimaryDomain || '加载中...'}`" width="780px" append-to-body>
    <el-skeleton v-if="loading" :rows="6" animated />
    <template v-else>
      <el-alert v-if="error" type="error" :closable="false" class="mb12" :title="error" />
      <div v-else-if="detail">
        <div class="info-cards">
          <div class="info-card">
            <div class="ic-label">主域名</div>
            <div class="ic-value">{{ detail.certificate.acmeCertPrimaryDomain }}</div>
            <div class="ic-extra" v-if="sanCount">+{{ sanCount }} 个备用域名</div>
          </div>
          <div class="info-card">
            <div class="ic-label">状态</div>
            <el-tag :type="status.type" effect="plain">{{ status.label }}</el-tag>
          </div>
          <div class="info-card">
            <div class="ic-label">有效期</div>
            <div class="ic-value">{{ expiryText() }}</div>
            <div class="ic-extra">{{ detail.certificate.acmeCertNotAfter || "—" }}</div>
          </div>
          <div class="info-card">
            <div class="ic-label">验证方式</div>
            <div class="ic-value">{{ detail.certificate.acmeCertChallengeType || "—" }}</div>
            <div class="ic-extra">{{ detail.account ? serverLabel(detail.account.acmeAccountServer) : "" }}</div>
          </div>
        </div>

        <div class="block">
          <div class="block-title">有效期进度</div>
          <el-progress :percentage="progressPercent()" :stroke-width="8" />
          <div class="time-line">
            <span>{{ detail.certificate.acmeCertNotBefore || "—" }}</span>
            <span>{{ detail.certificate.acmeCertNotAfter || "—" }}</span>
          </div>
        </div>

        <div v-if="detail.certificate.acmeCertLastError" class="block">
          <div class="block-title">最近错误</div>
          <el-alert type="error" :closable="false" :title="detail.certificate.acmeCertLastError" />
        </div>

        <div v-if="validationInfos.length" class="block">
          <div class="block-title">验证信息</div>
          <el-alert type="warning" :closable="false" title="请按以下信息完成域名验证，部署完成后点击「重新验证」。" class="mb12" />
          <div v-for="(info, idx) in validationInfos" :key="idx" class="val-item">
            <div class="val-head">
              <b>{{ info.domain }}</b>
              <el-tag size="small" :type="info.type === 'DNS-01' ? 'success' : 'primary'">{{ info.type }}</el-tag>
            </div>
            <div v-if="info.type === 'HTTP-01'" class="val-row">
              <span class="val-label">验证地址</span>
              <code>http://{{ info.domain }}/.well-known/acme-challenge/{{ info.token }}</code>
            </div>
            <div v-else-if="info.type === 'DNS-01'" class="val-row">
              <span class="val-label">DNS 记录</span>
              <code>{{ info.dnsName }} → {{ info.dnsValue }}</code>
            </div>
          </div>
        </div>

        <div v-if="detail.curlCommands?.length" class="block">
          <div class="block-title">curl 自检命令</div>
          <div v-for="(c, idx) in detail.curlCommands" :key="idx" class="code-line">{{ c }}</div>
        </div>

        <div v-if="detail.verification" class="block">
          <div class="block-title">证书合法性校验</div>
          <el-alert
            :type="detail.verification.overallValid ? 'success' : 'error'"
            :closable="false"
            :title="detail.verification.overallValid ? '证书合法，可正常使用' : '证书校验未通过，请检查'"
            class="mb12"
          >
            <div class="verify-msg">{{ detail.verification.message || "" }}</div>
          </el-alert>
          <div class="verify-grid">
            <div class="verify-item" :class="{ pass: detail.verification.pemParsable }">
              <span class="vi-mark">{{ detail.verification.pemParsable ? "✓" : "✗" }}</span>
              <span class="vi-label">PEM 可解析</span>
            </div>
            <div class="verify-item" :class="{ pass: detail.verification.inValidWindow }">
              <span class="vi-mark">{{ detail.verification.inValidWindow ? "✓" : "✗" }}</span>
              <span class="vi-label">在有效期内</span>
            </div>
            <div class="verify-item" :class="{ pass: detail.verification.domainsCovered }">
              <span class="vi-mark">{{ detail.verification.domainsCovered ? "✓" : "✗" }}</span>
              <span class="vi-label">域名已覆盖</span>
            </div>
            <div class="verify-item" :class="{ pass: detail.verification.privateKeyMatches }">
              <span class="vi-mark">{{ detail.verification.privateKeyMatches ? "✓" : "✗" }}</span>
              <span class="vi-label">私钥匹配</span>
            </div>
            <div class="verify-item" :class="{ pass: detail.verification.chainComplete }">
              <span class="vi-mark">{{ detail.verification.chainComplete ? "✓" : "✗" }}</span>
              <span class="vi-label">证书链完整</span>
            </div>
            <div class="verify-item" :class="{ pass: !detail.verification.revoked }">
              <span class="vi-mark">{{ detail.verification.revoked ? "✗" : "✓" }}</span>
              <span class="vi-label">未吊销</span>
            </div>
          </div>
        </div>

        <div v-if="detail.stepDescription" class="block">
          <div class="block-title">当前步骤</div>
          <el-tag effect="plain">{{ detail.currentStep || "" }} · {{ detail.stepDescription }}</el-tag>
        </div>

        <div class="block">
          <div class="block-title">申请订单</div>
          <ReTable
            :data="detail.orders ?? []"
            size="small"
            border
            :layout-table="{ minHeight: 0 }"
            :config="{ pagination: { enable: false }, toolbar: { enable: false } }"
          >
            <ReTableColumn prop="acmeOrderId" label="ID" width="80" />
            <ReTableColumn prop="acmeOrderStatus" label="状态" width="120">
              <template #default="{ row }">{{ row.acmeOrderStatus || "—" }}</template>
            </ReTableColumn>
            <ReTableColumn prop="acmeOrderUrl" label="订单 URL" min-width="220" show-overflow-tooltip />
            <ReTableColumn prop="updateTime" label="更新时间" width="170" />
          </ReTable>
        </div>
      </div>
    </template>
  </ReDialog>
</template>

<style scoped>
.mb12 {
  margin-bottom: 12px;
}
.info-cards {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
  gap: 10px;
}
.info-card {
  padding: 12px 14px;
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 8px;
  background: var(--el-fill-color-lighter);
}
.ic-label {
  font-size: 12px;
  color: var(--el-text-color-secondary);
  margin-bottom: 6px;
}
.ic-value {
  font-size: 15px;
  font-weight: 600;
  color: var(--el-text-color-primary);
  word-break: break-all;
}
.ic-extra {
  margin-top: 4px;
  font-size: 12px;
  color: var(--el-text-color-secondary);
}
.block {
  margin-top: 18px;
}
.block-title {
  font-size: 13px;
  font-weight: 600;
  color: var(--el-text-color-primary);
  margin-bottom: 10px;
}
.time-line {
  display: flex;
  justify-content: space-between;
  margin-top: 6px;
  font-size: 12px;
  color: var(--el-text-color-secondary);
}
.val-item {
  padding: 10px 12px;
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 8px;
  margin-bottom: 8px;
}
.val-head {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 6px;
}
.val-row {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  font-size: 12px;
}
.val-label {
  color: var(--el-text-color-secondary);
  white-space: nowrap;
  padding-top: 2px;
}
.val-row code {
  word-break: break-all;
  color: var(--el-color-primary);
}
.code-line {
  font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
  font-size: 12px;
  padding: 8px 10px;
  border-radius: 6px;
  background: var(--el-fill-color-lighter);
  color: var(--el-text-color-secondary);
  word-break: break-all;
}
.verify-msg {
  font-size: 12px;
  color: var(--el-text-color-secondary);
  word-break: break-all;
}
.verify-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
  gap: 8px;
}
.verify-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 9px 12px;
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 8px;
  background: var(--el-fill-color-lighter);
  color: var(--el-text-color-secondary);
}
.vi-mark {
  font-weight: 700;
  color: var(--el-color-danger);
}
.verify-item.pass .vi-mark {
  color: var(--el-color-success);
}
.verify-item.pass {
  border-color: var(--el-color-success-light-5);
  background: var(--el-color-success-light-9);
}
.vi-label {
  font-size: 12px;
}
</style>
