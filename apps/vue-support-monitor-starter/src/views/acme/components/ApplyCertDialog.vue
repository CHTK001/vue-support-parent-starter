<template>
  <el-dialog
    v-model="dialogVisible"
    title="申请 SSL/TLS 证书"
    width="680px"
    :close-on-click-modal="false"
    class="apply-cert-dialog"
    append-to-body
  >
    <!-- 步骤说明 -->
    <div class="dialog-header">
      <div class="step-indicator">
        <div class="step active">
          <span class="step-num">1</span>
          <span class="step-text">填写信息</span>
        </div>
        <div class="step-line"></div>
        <div class="step">
          <span class="step-num">2</span>
          <span class="step-text">域名验证</span>
        </div>
        <div class="step-line"></div>
        <div class="step">
          <span class="step-num">3</span>
          <span class="step-text">获取证书</span>
        </div>
      </div>
    </div>

    <el-form
      ref="formRef"
      :model="form"
      :rules="rules"
      label-width="100px"
      class="cert-form"
    >
      <!-- ACME 账户 -->
      <el-form-item label="ACME账户" prop="acmeAccountId">
        <el-select
          v-model="form.acmeAccountId"
          placeholder="请选择ACME账户"
          style="width: 100%"
          popper-class="account-select-dropdown"
          :empty-text="
            accountList.length === 0 ? '暂无账户，请先创建' : '无数据'
          "
        >
          <el-option
            v-for="item in accountList"
            :key="item.acmeAccountId"
            :label="item.acmeAccountEmail"
            :value="item.acmeAccountId"
          >
            <div class="account-option">
              <el-tag size="small" type="primary" effect="plain">
                {{ getServerName(item.acmeAccountServer) }}
              </el-tag>
              <span class="account-email">{{ item.acmeAccountEmail }}</span>
            </div>
          </el-option>
        </el-select>
        <div class="field-desc">
          <IconifyIconOnline icon="mdi:information-outline" />
          <span>ACME账户用于与证书颁发机构通信，如 Let's Encrypt</span>
        </div>
      </el-form-item>

      <!-- 主域名 -->
      <el-form-item label="主域名" prop="primaryDomain">
        <el-input v-model="form.primaryDomain" placeholder="example.com">
          <template #prefix>
            <IconifyIconOnline icon="mdi:web" />
          </template>
        </el-input>
        <div class="field-desc">
          <IconifyIconOnline icon="mdi:information-outline" />
          <span>
            证书的主域名，支持格式：
            <code>example.com</code>（单域名）或
            <code>*.example.com</code>（泛域名）
          </span>
        </div>
      </el-form-item>

      <!-- 备用域名 -->
      <el-form-item label="备用域名">
        <el-select
          v-model="form.sanDomains"
          multiple
          filterable
          allow-create
          default-first-option
          placeholder="输入域名后按 Enter 添加"
          style="width: 100%"
        >
        </el-select>
        <div class="field-desc">
          <IconifyIconOnline icon="mdi:information-outline" />
          <span>
            SAN（Subject Alternative Name）备用域名，一张证书可包含多个域名。
            例如同时保护 <code>www.example.com</code> 和
            <code>api.example.com</code>
          </span>
        </div>
      </el-form-item>

      <!-- 验证类型 -->
      <el-form-item label="验证类型" prop="challengeType">
        <ScSelect
          v-model="form.challengeType"
          layout="card"
          :options="challengeOptions"
          :gap="12"
          width="200px"
        >
          <template #card="{ item, selected }">
            <div class="challenge-card" :class="{ active: selected }">
              <div
                class="card-icon"
                :class="item.value === 'HTTP-01' ? 'http' : 'dns'"
              >
                <IconifyIconOnline :icon="item.icon" />
              </div>
              <div class="card-content">
                <div class="card-title">{{ item.label }}</div>
                <div class="card-desc">{{ item.desc }}</div>
              </div>
              <div class="card-check" v-if="selected">
                <IconifyIconOnline icon="mdi:check-circle" />
              </div>
            </div>
          </template>
        </ScSelect>
      </el-form-item>

      <!-- 验证说明 -->
      <div class="validation-guide">
        <template v-if="form.challengeType === 'HTTP-01'">
          <div class="guide-header">
            <IconifyIconOnline icon="mdi:file-document-outline" />
            <span>HTTP-01 文件验证说明</span>
          </div>
          <div class="guide-content">
            <div class="guide-step">
              <span class="step-badge">1</span>
              <div class="step-content">
                <p>
                  提交申请后，系统会生成一个<strong>唯一的验证 Token</strong
                  >（由 ACME 服务器自动生成）
                </p>
              </div>
            </div>
            <div class="guide-step">
              <span class="step-badge">2</span>
              <div class="step-content">
                <p>您需要在 Web 服务器上创建验证文件，路径为：</p>
                <code class="code-block"
                  >http://{{
                    form.primaryDomain || "您的域名"
                  }}/.well-known/acme-challenge/[TOKEN]</code
                >
              </div>
            </div>
            <div class="guide-step">
              <span class="step-badge">3</span>
              <div class="step-content">
                <p>
                  文件内容为系统提供的验证字符串，ACME 服务器会通过 HTTP
                  请求访问该文件来验证域名所有权
                </p>
              </div>
            </div>
            <div class="guide-note">
              <IconifyIconOnline icon="mdi:lightbulb-outline" />
              <span
                >提示：HTTP-01 不支持泛域名证书，泛域名请使用 DNS-01 验证</span
              >
            </div>
          </div>
        </template>
        <template v-else>
          <div class="guide-header">
            <IconifyIconOnline icon="mdi:dns-outline" />
            <span>DNS-01 记录验证说明</span>
          </div>
          <div class="guide-content">
            <div class="guide-step">
              <span class="step-badge">1</span>
              <div class="step-content">
                <p>
                  提交申请后，系统会生成一个<strong>唯一的验证值</strong>（由
                  ACME 服务器自动生成）
                </p>
              </div>
            </div>
            <div class="guide-step">
              <span class="step-badge">2</span>
              <div class="step-content">
                <p>您需要在 DNS 服务商处添加一条 TXT 记录：</p>
                <code class="code-block"
                  >_acme-challenge.{{ form.primaryDomain || "您的域名" }} TXT
                  [验证值]</code
                >
              </div>
            </div>
            <div class="guide-step">
              <span class="step-badge">3</span>
              <div class="step-content">
                <p>
                  DNS 记录生效后（通常需要几分钟到几小时），ACME
                  服务器会查询该记录来验证域名所有权
                </p>
              </div>
            </div>
            <div class="guide-note success">
              <IconifyIconOnline icon="mdi:check-circle-outline" />
              <span
                >优点：DNS-01 支持泛域名证书，且无需在 Web 服务器上配置</span
              >
            </div>
          </div>
        </template>
      </div>
    </el-form>

    <template #footer>
      <div class="dialog-footer">
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="submitting" @click="handleSubmit">
          <IconifyIconOnline icon="mdi:certificate" class="mr-1" />
          提交申请
        </el-button>
      </div>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, reactive, computed, watch, onMounted } from "vue";
import { message } from "@repo/utils";
import { type FormInstance, type FormRules } from "element-plus";
import ScSelect from "@repo/components/ScSelect/index.vue";
import {
  getAccountList,
  applyCert,
  ACME_SERVERS,
  type AcmeAccount,
} from "@/api/acme";

// 验证类型选项
const challengeOptions = [
  {
    label: "HTTP-01",
    value: "HTTP-01",
    icon: "mdi:web",
    desc: "文件验证",
  },
  {
    label: "DNS-01",
    value: "DNS-01",
    icon: "mdi:dns",
    desc: "DNS记录验证",
  },
];

defineOptions({
  name: "ApplyCertDialog",
});

const props = defineProps<{
  visible: boolean;
}>();

const emit = defineEmits<{
  "update:visible": [value: boolean];
  success: [];
}>();

const dialogVisible = computed({
  get: () => props.visible,
  set: (val) => emit("update:visible", val),
});

const formRef = ref<FormInstance>();
const submitting = ref(false);
const accountList = ref<AcmeAccount[]>([]);

const form = reactive({
  acmeAccountId: undefined as number | undefined,
  primaryDomain: "",
  sanDomains: [] as string[],
  challengeType: "HTTP-01",
});

const rules: FormRules = {
  acmeAccountId: [
    {
      required: true,
      message: "请选择ACME账户",
      trigger: "change",
      type: "number",
    },
  ],
  primaryDomain: [
    { required: true, message: "请输入主域名", trigger: "blur" },
    {
      pattern:
        /^(\*\.)?[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(\.[a-zA-Z]{2,})+$/,
      message: "请输入有效的域名格式",
      trigger: "blur",
    },
  ],
  challengeType: [
    { required: true, message: "请选择验证类型", trigger: "change" },
  ],
};

/**
 * 获取服务器名称
 */
function getServerName(url: string): string {
  const server = ACME_SERVERS.find((s) => s.value === url);
  return server?.label || "未知服务器";
}

/**
 * 加载账户列表
 */
async function loadAccounts() {
  try {
    const res = (await getAccountList()) as unknown as { data: AcmeAccount[] };
    accountList.value = res.data || [];
  } catch (error) {
    console.error("加载账户列表失败", error);
  }
}

/**
 * 提交表单
 */
async function handleSubmit() {
  if (!formRef.value) return;

  const valid = await formRef.value.validate().catch(() => false);
  if (!valid) return;

  submitting.value = true;
  try {
    await applyCert(form);
    message("证书申请已提交，请在消息中心查看进度", { type: "success" });
    dialogVisible.value = false;
    emit("success");
  } catch (error) {
    message("申请失败", { type: "error" });
  } finally {
    submitting.value = false;
  }
}

watch(
  () => props.visible,
  (val) => {
    if (val) {
      form.acmeAccountId = undefined;
      form.primaryDomain = "";
      form.sanDomains = [];
      form.challengeType = "HTTP-01";
      formRef.value?.clearValidate();
      loadAccounts();
    }
  }
);

onMounted(() => {
  loadAccounts();
});
</script>

<style scoped lang="scss">
// 步骤指示器
.dialog-header {
  margin-bottom: 24px;
  padding-bottom: 20px;
  border-bottom: 1px solid var(--el-border-color-lighter);
}

.step-indicator {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;

  .step {
    display: flex;
    align-items: center;
    gap: 8px;
    color: var(--el-text-color-placeholder);

    &.active {
      color: var(--el-color-primary);

      .step-num {
        background: var(--el-color-primary);
        color: #fff;
      }
    }
  }

  .step-num {
    width: 24px;
    height: 24px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: var(--el-fill-color);
    border-radius: 50%;
    font-size: 12px;
    font-weight: 600;
  }

  .step-text {
    font-size: 13px;
  }

  .step-line {
    width: 40px;
    height: 2px;
    background: var(--el-border-color-lighter);
  }
}

// 表单样式
.cert-form {
  :deep(.el-form-item) {
    margin-bottom: 20px;
  }
}

.field-desc {
  display: flex;
  align-items: flex-start;
  gap: 6px;
  margin-top: 8px;
  font-size: 12px;
  color: var(--el-text-color-secondary);
  line-height: 1.5;

  svg {
    flex-shrink: 0;
    margin-top: 2px;
    color: var(--el-color-info);
  }

  code {
    padding: 2px 6px;
    background: var(--el-fill-color);
    border-radius: 4px;
    font-family: "SF Mono", Monaco, monospace;
    font-size: 11px;
    color: var(--el-color-primary);
  }
}

// 验证类型卡片
.challenge-cards {
  display: flex;
  gap: 12px;
}

.challenge-card {
  flex: 1;
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px;
  background: var(--el-fill-color-lighter);
  border: 2px solid var(--el-border-color-lighter);
  border-radius: 10px;
  cursor: pointer;
  transition: all 0.3s;

  &:hover {
    border-color: var(--el-color-primary-light-5);
    background: var(--el-color-primary-light-9);
  }

  &.active {
    border-color: var(--el-color-primary);
    background: var(--el-color-primary-light-9);
  }

  .card-icon {
    width: 40px;
    height: 40px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 10px;
    font-size: 20px;
    color: #fff;

    &.http {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    }

    &.dns {
      background: linear-gradient(135deg, #11998e 0%, #38ef7d 100%);
    }
  }

  .card-content {
    flex: 1;

    .card-title {
      font-size: 15px;
      font-weight: 600;
      color: var(--el-text-color-primary);
    }

    .card-desc {
      font-size: 12px;
      color: var(--el-text-color-secondary);
      margin-top: 2px;
    }
  }

  .card-check {
    color: var(--el-color-primary);
    font-size: 20px;
  }
}

// 验证说明
.validation-guide {
  margin-top: 20px;
  padding: 16px;
  background: var(--el-fill-color-lighter);
  border-radius: 10px;
  border: 1px solid var(--el-border-color-lighter);

  .guide-header {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 14px;
    font-weight: 600;
    color: var(--el-text-color-primary);
    margin-bottom: 16px;
    padding-bottom: 12px;
    border-bottom: 1px dashed var(--el-border-color-lighter);

    svg {
      color: var(--el-color-primary);
    }
  }

  .guide-content {
    display: flex;
    flex-direction: column;
    gap: 12px;
  }

  .guide-step {
    display: flex;
    align-items: flex-start;
    gap: 12px;

    .step-badge {
      width: 22px;
      height: 22px;
      display: flex;
      align-items: center;
      justify-content: center;
      background: var(--el-color-primary);
      color: #fff;
      border-radius: 50%;
      font-size: 12px;
      font-weight: 600;
      flex-shrink: 0;
    }

    .step-content {
      flex: 1;
      font-size: 13px;
      line-height: 1.6;
      color: var(--el-text-color-regular);

      p {
        margin: 0;
      }

      strong {
        color: var(--el-color-primary);
      }
    }
  }

  .code-block {
    display: block;
    margin-top: 8px;
    padding: 10px 14px;
    background: var(--el-bg-color);
    border: 1px solid var(--el-border-color-lighter);
    border-radius: 6px;
    font-family: "SF Mono", Monaco, monospace;
    font-size: 12px;
    color: var(--el-text-color-primary);
    word-break: break-all;
  }

  .guide-note {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-top: 8px;
    padding: 10px 12px;
    background: var(--el-color-warning-light-9);
    border-radius: 6px;
    font-size: 12px;
    color: var(--el-color-warning-dark-2);

    svg {
      flex-shrink: 0;
    }

    &.success {
      background: var(--el-color-success-light-9);
      color: var(--el-color-success-dark-2);
    }
  }
}

// 账户选项样式
.account-option {
  display: flex;
  align-items: center;
  gap: 10px;

  .account-email {
    color: var(--el-text-color-regular);
  }
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}

.mr-1 {
  margin-right: 4px;
}
</style>

<!-- 全局样式：账户下拉菜单宽度 -->
<style lang="scss">
.account-select-dropdown {
  min-width: 400px !important;

  .el-select-dropdown__item {
    padding: 8px 16px;
    height: auto;
    line-height: 1.5;
  }
}
</style>
