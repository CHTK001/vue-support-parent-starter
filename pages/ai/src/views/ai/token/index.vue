<template>
  <section class="token-management system-container modern-bg">
    <div class="chat-like-header">
      <ScButton
        circle
        type="default"
        class="chat-like-header__back"
        @click="handleBackPage"
      >
        <IconifyIconOnline icon="ri:arrow-left-line" />
      </ScButton>
      <div class="chat-like-header__title-wrap">
        <span class="chat-like-header__title">令牌管理</span>
        <span class="chat-like-header__subtitle">管理您的API访问令牌</span>
      </div>
      <div class="chat-like-header__actions">
        <el-button
          type="primary"
          size="small"
          @click="showCreateDialog = true"
        >
          <IconifyIconOnline icon="ri:add-line" />
          创建令牌
        </el-button>
      </div>
    </div>

    <!-- 余额卡片 -->
    <div class="balance-card">
      <div class="balance-card__info">
        <span class="balance-card__label">账户余额</span>
        <span class="balance-card__amount">
          ¥{{ balance?.sysAiBalanceAmount?.toFixed(2) || '0.00' }}
        </span>
      </div>
      <div class="balance-card__info">
        <span class="balance-card__label">今日费用</span>
        <span class="balance-card__amount balance-card__amount--warning">
          ¥{{ todayFee?.toFixed(2) || '0.00' }}
        </span>
      </div>
      <el-button size="small" type="success" @click="showRechargeDialog = true">
        充值
      </el-button>
    </div>

    <!-- 令牌列表 -->
    <div class="token-list">
      <el-table :data="tokens" style="width: 100%">
        <el-table-column prop="sysAiTokenName" label="名称" min-width="120" />
        <el-table-column label="令牌密钥" min-width="200">
          <template #default="{ row }">
            <div class="token-key">
              <code v-if="row.showFullKey">{{ row.sysAiTokenKey }}</code>
              <code v-else>***{{ row.sysAiTokenKeyPrefix }}***</code>
              <el-tooltip content="复制密钥" placement="top">
                <ScButton
                  size="small"
                  circle
                  @click="copyKey(row)"
                >
                  <IconifyIconOnline icon="ri:file-copy-line" />
                </ScButton>
              </el-tooltip>
              <el-tooltip :content="row.showFullKey ? '隐藏密钥' : '显示密钥'" placement="top">
                <ScButton
                  size="small"
                  circle
                  @click="row.showFullKey = !row.showFullKey"
                >
                  <IconifyIconOnline :icon="row.showFullKey ? 'ri:eye-close-line' : 'ri:eye-line'" />
                </ScButton>
              </el-tooltip>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="状态" width="80">
          <template #default="{ row }">
            <el-tag :type="row.sysAiTokenStatus === 1 ? 'success' : 'danger'" size="small">
              {{ row.sysAiTokenStatus === 1 ? '启用' : '禁用' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="费用（输入/输出）" width="150">
          <template #default="{ row }">
            <span class="fee-text">
              {{ row.sysAiTokenInputFee || 0 }}/{{ row.sysAiTokenOutputFee || 0 }}
            </span>
          </template>
        </el-table-column>
        <el-table-column label="累计费用" width="100">
          <template #default="{ row }">
            <span class="fee-text">¥{{ (row.sysAiTokenTotalFee || 0).toFixed(4) }}</span>
          </template>
        </el-table-column>
        <el-table-column label="使用次数" width="80">
          <template #default="{ row }">
            {{ row.sysAiTokenUseCount || 0 }}
          </template>
        </el-table-column>
        <el-table-column label="最后使用" width="160">
          <template #default="{ row }">
            {{ formatTime(row.sysAiTokenLastUsedTime) }}
          </template>
        </el-table-column>
        <el-table-column label="过期时间" width="160">
          <template #default="{ row }">
            {{ formatTime(row.sysAiTokenExpireTime) || '永不过期' }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="120" fixed="right">
          <template #default="{ row }">
            <el-button size="small" link type="primary" @click="viewStats(row)">
              统计
            </el-button>
            <el-popconfirm title="确定删除此令牌？" @confirm="deleteToken(row)">
              <template #reference>
                <el-button size="small" link type="danger">删除</el-button>
              </template>
            </el-popconfirm>
          </template>
        </el-table-column>
      </el-table>
    </div>

    <!-- 创建令牌对话框 -->
    <el-dialog
      v-model="showCreateDialog"
      title="创建令牌"
      width="500px"
    >
      <el-form :model="createForm" label-width="100px">
        <el-form-item label="令牌名称" required>
          <el-input v-model="createForm.name" placeholder="请输入令牌名称" />
        </el-form-item>
        <el-form-item label="输入费用">
          <el-input-number
            v-model="createForm.inputFee"
            :min="0"
            :precision="4"
            placeholder="每千token费用"
          />
        </el-form-item>
        <el-form-item label="输出费用">
          <el-input-number
            v-model="createForm.outputFee"
            :min="0"
            :precision="4"
            placeholder="每千token费用"
          />
        </el-form-item>
        <el-form-item label="过期时间">
          <el-date-picker
            v-model="createForm.expireTime"
            type="datetime"
            placeholder="选择过期时间（可选）"
          />
        </el-form-item>
        <el-form-item label="限流">
          <el-input-number
            v-model="createForm.rateLimit"
            :min="0"
            placeholder="每分钟最大请求数（0为不限）"
          />
        </el-form-item>
        <el-form-item label="允许模型">
          <el-input v-model="createForm.allowedModels" placeholder="逗号分隔的模型列表" />
        </el-form-item>
        <el-form-item label="备注">
          <el-input v-model="createForm.remark" type="textarea" rows="2" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showCreateDialog = false">取消</el-button>
        <el-button type="primary" @click="handleCreate">创建</el-button>
      </template>
    </el-dialog>

    <!-- 充值对话框 -->
    <el-dialog
      v-model="showRechargeDialog"
      title="充值余额"
      width="400px"
    >
      <el-form :model="rechargeForm" label-width="80px">
        <el-form-item label="充值金额">
          <el-input-number
            v-model="rechargeForm.amount"
            :min="0.01"
            :precision="2"
            placeholder="请输入充值金额"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showRechargeDialog = false">取消</el-button>
        <el-button type="primary" @click="handleRecharge">充值</el-button>
      </template>
    </el-dialog>

    <!-- 统计对话框 -->
    <el-dialog
      v-model="showStatsDialog"
      title="访问统计"
      width="600px"
    >
      <div class="stats-grid" v-if="currentStats">
        <div class="stats-item">
          <span class="stats-label">总请求数</span>
          <span class="stats-value">{{ currentStats.totalCount }}</span>
        </div>
        <div class="stats-item">
          <span class="stats-label">输入Token</span>
          <span class="stats-value">{{ currentStats.totalInputTokens }}</span>
        </div>
        <div class="stats-item">
          <span class="stats-label">输出Token</span>
          <span class="stats-value">{{ currentStats.totalOutputTokens }}</span>
        </div>
        <div class="stats-item">
          <span class="stats-label">总Token</span>
          <span class="stats-value">{{ currentStats.totalTokens }}</span>
        </div>
        <div class="stats-item">
          <span class="stats-label">输入费用</span>
          <span class="stats-value">¥{{ currentStats.totalInputFee?.toFixed(6) }}</span>
        </div>
        <div class="stats-item">
          <span class="stats-label">输出费用</span>
          <span class="stats-value">¥{{ currentStats.totalOutputFee?.toFixed(6) }}</span>
        </div>
        <div class="stats-item stats-item--highlight">
          <span class="stats-label">总费用</span>
          <span class="stats-value">¥{{ currentStats.totalFee?.toFixed(6) }}</span>
        </div>
        <div class="stats-item">
          <span class="stats-label">平均耗时</span>
          <span class="stats-value">{{ currentStats.avgLatencyMs?.toFixed(0) }}ms</span>
        </div>
        <div class="stats-item">
          <span class="stats-label">缓存命中率</span>
          <span class="stats-value">{{ currentStats.cacheHitRate?.toFixed(1) }}%</span>
        </div>
      </div>
    </el-dialog>

    <!-- 新令牌显示对话框 -->
    <el-dialog
      v-model="showNewTokenDialog"
      title="令牌创建成功"
      width="500px"
    >
      <el-alert type="warning" :closable="false" style="margin-bottom: 16px">
        请妥善保管您的令牌密钥，创建后无法再次查看完整密钥！
      </el-alert>
      <div class="new-token-display">
        <code>{{ newCreatedToken }}</code>
        <ScButton size="small" circle @click="copyToClipboard(newCreatedToken)">
          <IconifyIconOnline icon="ri:file-copy-line" />
        </ScButton>
      </div>
      <template #footer>
        <el-button type="primary" @click="showNewTokenDialog = false">我已保存</el-button>
      </template>
    </el-dialog>
  </section>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref } from "vue";
import { useRouter } from "vue-router";
import { ElButton, ElTable, ElTableColumn, ElTag, ElDialog, ElForm, ElFormItem, ElInput, ElInputNumber, ElDatePicker, ElPopconfirm, ElAlert } from "element-plus";
import ScButton from "@repo/components/ScButton";
import { IconifyIconOnline } from "@repo/components/IconifyIconOnline";
import { message } from "@repo/utils";
import {
  listAiTokens,
  createAiToken,
  deleteAiToken,
  getAiBalance,
  rechargeAiBalance,
  getAiTokenStatistics,
  getAiTodayFee,
  type AiToken,
  type AiBalance,
  type AiTokenStatistics,
  type CreateTokenRequest,
} from "../../../api/ai/token";

const router = useRouter();

const tokens = ref<AiToken[]>([]);
const balance = ref<AiBalance | null>(null);
const todayFee = ref<number>(0);
const showCreateDialog = ref(false);
const showRechargeDialog = ref(false);
const showStatsDialog = ref(false);
const showNewTokenDialog = ref(false);
const newCreatedToken = ref("");

const createForm = reactive<CreateTokenRequest>({
  name: "",
  inputFee: 0.01,
  outputFee: 0.02,
  expireTime: undefined,
  rateLimit: 0,
  allowedModels: "",
  remark: "",
});

const rechargeForm = reactive({
  amount: 0,
});

const currentStats = ref<AiTokenStatistics | null>(null);

const handleBackPage = () => {
  router.push("/ai/home");
};

const loadTokens = async () => {
  try {
    const res = await listAiTokens();
    tokens.value = (res.data || []).map((t: AiToken) => ({ ...t, showFullKey: false }));
  } catch (error: any) {
    message(error?.message || "加载令牌列表失败", { type: "error" });
  }
};

const loadBalance = async () => {
  try {
    const res = await getAiBalance();
    balance.value = res.data;
  } catch (error) {
    // 忽略余额加载失败
  }
};

const loadTodayFee = async () => {
  try {
    const res = await getAiTodayFee();
    todayFee.value = res.data?.todayFee || 0;
  } catch (error) {
    // 忽略费用加载失败
  }
};

const handleCreate = async () => {
  if (!createForm.name) {
    message("请输入令牌名称", { type: "warning" });
    return;
  }
  try {
    const res = await createAiToken(createForm);
    if (res.data?.rawKey) {
      newCreatedToken.value = res.data.rawKey;
      showNewTokenDialog.value = true;
      showCreateDialog.value = false;
      await loadTokens();
      // 重置表单
      createForm.name = "";
      createForm.remark = "";
    }
  } catch (error: any) {
    message(error?.message || "创建令牌失败", { type: "error" });
  }
};

const handleRecharge = async () => {
  if (rechargeForm.amount <= 0) {
    message("请输入正确的充值金额", { type: "warning" });
    return;
  }
  try {
    await rechargeAiBalance({ amount: rechargeForm.amount });
    message("充值成功", { type: "success" });
    showRechargeDialog.value = false;
    rechargeForm.amount = 0;
    await loadBalance();
  } catch (error: any) {
    message(error?.message || "充值失败", { type: "error" });
  }
};

const copyKey = async (token: AiToken) => {
  const key = token.showFullKey ? token.sysAiTokenKey : `sk-***${token.sysAiTokenKeyPrefix}***`;
  await copyToClipboard(key);
  message("密钥已复制", { type: "success" });
};

const copyToClipboard = async (text: string) => {
  try {
    await navigator.clipboard.writeText(text);
  } catch (error) {
    // 降级处理
    const textarea = document.createElement("textarea");
    textarea.value = text;
    document.body.appendChild(textarea);
    textarea.select();
    document.execCommand("copy");
    document.body.removeChild(textarea);
  }
};

const deleteToken = async (token: AiToken) => {
  if (!token.sysAiTokenId) return;
  try {
    await deleteAiToken(token.sysAiTokenId);
    message("删除成功", { type: "success" });
    await loadTokens();
  } catch (error: any) {
    message(error?.message || "删除失败", { type: "error" });
  }
};

const viewStats = async (token: AiToken) => {
  if (!token.sysAiTokenId) return;
  try {
    const res = await getAiTokenStatistics(token.sysAiTokenId);
    currentStats.value = res.data;
    showStatsDialog.value = true;
  } catch (error: any) {
    message(error?.message || "加载统计失败", { type: "error" });
  }
};

const formatTime = (time: string | undefined) => {
  if (!time) return "";
  return new Date(time).toLocaleString("zh-CN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
};

onMounted(() => {
  void loadTokens();
  void loadBalance();
  void loadTodayFee();
});
</script>

<style scoped lang="scss">
.token-management {
  height: 100%;
  display: grid;
  grid-template-rows: auto auto 1fr;
  gap: 18px;
  padding: 22px;
  background: var(--el-bg-color-page);
}

.chat-like-header {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 14px 8px;
  margin-bottom: 6px;
  border-radius: 12px;
  background: var(--el-bg-color-overlay);
  border: 1px solid var(--el-border-color-light);
}

.chat-like-header__back {
  flex-shrink: 0;
}

.chat-like-header__title-wrap {
  min-width: 0;
  display: grid;
  gap: 2px;
}

.chat-like-header__title {
  font-size: 14px;
  font-weight: 700;
  color: var(--el-text-color-primary);
  line-height: 1.2;
}

.chat-like-header__subtitle {
  font-size: 12px;
  color: var(--el-text-color-secondary);
  line-height: 1.2;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.chat-like-header__actions {
  margin-left: auto;
  display: flex;
  align-items: center;
  gap: 8px;
}

.balance-card {
  display: flex;
  align-items: center;
  gap: 24px;
  padding: 16px 20px;
  border-radius: 12px;
  background: var(--el-bg-color-overlay);
  border: 1px solid var(--el-border-color-light);
}

.balance-card__info {
  display: grid;
  gap: 4px;
}

.balance-card__label {
  font-size: 12px;
  color: var(--el-text-color-secondary);
}

.balance-card__amount {
  font-size: 24px;
  font-weight: 700;
  color: var(--el-text-color-primary);
}

.balance-card__amount--warning {
  color: var(--el-color-warning);
}

.token-list {
  border-radius: 12px;
  background: var(--el-bg-color-overlay);
  border: 1px solid var(--el-border-color-light);
  padding: 16px;
  overflow: auto;
}

.token-key {
  display: flex;
  align-items: center;
  gap: 4px;

  code {
    font-family: monospace;
    font-size: 12px;
    padding: 2px 6px;
    background: var(--el-fill-color-light);
    border-radius: 4px;
  }
}

.fee-text {
  font-family: monospace;
  font-size: 12px;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;
}

.stats-item {
  display: grid;
  gap: 4px;
  padding: 12px;
  background: var(--el-fill-color-light);
  border-radius: 8px;
}

.stats-item--highlight {
  background: var(--el-color-primary-light-9);
}

.stats-label {
  font-size: 12px;
  color: var(--el-text-color-secondary);
}

.stats-value {
  font-size: 18px;
  font-weight: 700;
  color: var(--el-text-color-primary);
}

.new-token-display {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px;
  background: var(--el-fill-color-dark);
  border-radius: 8px;

  code {
    font-family: monospace;
    font-size: 14px;
    word-break: break-all;
    flex: 1;
  }
}
</style>
