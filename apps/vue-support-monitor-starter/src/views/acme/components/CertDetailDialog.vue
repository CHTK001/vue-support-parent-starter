<template>
  <el-dialog
    v-model="dialogVisible"
    title="证书详情"
    width="700px"
    :close-on-click-modal="false"
  >
    <el-skeleton :loading="loading" animated>
      <template #template>
        <el-skeleton-item variant="text" style="width: 100%" />
        <el-skeleton-item variant="text" style="width: 80%" />
        <el-skeleton-item variant="text" style="width: 60%" />
      </template>
      <template #default>
        <el-descriptions :column="2" border>
          <el-descriptions-item label="证书ID" :span="1">
            {{ detail?.certificate?.acmeCertId }}
          </el-descriptions-item>
          <el-descriptions-item label="状态" :span="1">
            <el-tag
              :type="getStatusType(detail?.certificate?.acmeCertStatus)"
              size="small"
            >
              {{ getStatusLabel(detail?.certificate?.acmeCertStatus) }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="主域名" :span="2">
            {{ detail?.certificate?.acmeCertPrimaryDomain }}
          </el-descriptions-item>
          <el-descriptions-item label="备用域名" :span="2">
            {{ detail?.certificate?.acmeCertSan || "-" }}
          </el-descriptions-item>
          <el-descriptions-item label="验证类型" :span="1">
            {{ detail?.certificate?.acmeCertChallengeType }}
          </el-descriptions-item>
          <el-descriptions-item label="距离到期" :span="1">
            <span :class="{ 'text-danger': detail?.soonExpiring }">
              {{
                detail?.daysUntilExpiry != null
                  ? `${detail.daysUntilExpiry} 天`
                  : "-"
              }}
            </span>
          </el-descriptions-item>
          <el-descriptions-item label="生效时间" :span="1">
            {{ detail?.certificate?.acmeCertNotBefore || "-" }}
          </el-descriptions-item>
          <el-descriptions-item label="到期时间" :span="1">
            {{ detail?.certificate?.acmeCertNotAfter || "-" }}
          </el-descriptions-item>
          <el-descriptions-item label="关联账户" :span="2">
            {{ detail?.account?.acmeAccountEmail || "-" }}
          </el-descriptions-item>
          <el-descriptions-item
            label="最后错误"
            :span="2"
            v-if="detail?.certificate?.acmeCertLastError"
          >
            <span class="text-danger">{{
              detail.certificate.acmeCertLastError
            }}</span>
          </el-descriptions-item>
        </el-descriptions>

        <!-- 证书内容 -->
        <el-divider content-position="left">证书内容</el-divider>
        <el-tabs v-model="activeTab">
          <el-tab-pane label="证书链" name="chain">
            <el-input
              type="textarea"
              :model-value="
                detail?.certificate?.acmeCertChainPem || '暂无证书内容'
              "
              :rows="10"
              readonly
            />
          </el-tab-pane>
          <el-tab-pane label="私钥" name="key">
            <el-alert
              title="私钥信息敏感，请妥善保管"
              type="warning"
              :closable="false"
              show-icon
              style="margin-bottom: 12px"
            />
            <el-input
              type="textarea"
              :model-value="
                detail?.certificate?.acmeCertKeyPem || '暂无私钥内容'
              "
              :rows="10"
              readonly
            />
          </el-tab-pane>
        </el-tabs>

        <!-- 订单记录 -->
        <el-divider content-position="left">订单记录</el-divider>
        <el-table :data="detail?.orders || []" size="small" border>
          <el-table-column prop="acmeOrderId" label="订单ID" width="80" />
          <el-table-column prop="acmeOrderStatus" label="状态" width="100" />
          <el-table-column
            prop="acmeOrderUrl"
            label="订单URL"
            show-overflow-tooltip
          />
          <el-table-column prop="updateTime" label="更新时间" width="180" />
        </el-table>
      </template>
    </el-skeleton>
    <template #footer>
      <el-button @click="dialogVisible = false">关闭</el-button>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, computed, watch } from "vue";
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
.text-danger {
  color: var(--el-color-danger);
}
</style>
