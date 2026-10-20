<script setup lang="ts">
import { computed, reactive, ref, watch } from "vue";
import { message } from "@repo/core";
import {
  getAccountList,
  applyCert,
  CHALLENGE_TYPES,
  DEPLOY_MODES,
  isEabRequired,
  serverLabel,
  type AcmeAccount,
  type AcmeApplyCertRequest,
  type AcmeCertificate,
} from "../../../api/acmeApi";
import { queryHosts } from "@pages/server/src/api";

export interface AcmeHostPrefill {
  hostId?: number;
  hostName?: string;
  domain?: string;
  port?: number;
  username?: string;
}

const props = defineProps<{
  modelValue: boolean;
  initData?: Partial<AcmeCertificate> | null;
  host?: AcmeHostPrefill | null;
}>();

const emit = defineEmits<{
  "update:modelValue": [value: boolean];
  success: [];
  "view-cert": [certId: number];
}>();

const dialogVisible = computed({
  get: () => props.modelValue,
  set: (v) => emit("update:modelValue", v),
});

const accounts = ref<AcmeAccount[]>([]);
const accountLoading = ref(false);
const submitting = ref(false);

/** 主机列表（用于 SSH 部署时选择） */
const hostOptions = ref<any[]>([]);
const hostLoading = ref(false);
const hostSelectValue = ref<number | null>(null);

const form = reactive({
  acmeAccountId: undefined as number | undefined,
  primaryDomain: "",
  sanDomains: [] as string[],
  challengeType: "HTTP-01",
  deployMode: "manual",
  webrootPath: "/var/www/html",
  sshHost: "",
  sshPort: 22,
  sshUsername: "",
  sshPassword: "",
  remark: "",
});

const hostLabel = computed(() => {
  const p = props.host;
  if (!p) return "";
  return p.hostName || p.domain || (p.hostId ? `主机 #${p.hostId}` : "");
});

async function loadAccounts(): Promise<void> {
  accountLoading.value = true;
  try {
    accounts.value = (await getAccountList()) ?? [];
  } catch (e) {
    accounts.value = [];
    message.error(`ACME 账户加载失败：${String((e as Error)?.message ?? e)}`);
  } finally {
    accountLoading.value = false;
  }
}

async function loadHosts(): Promise<void> {
  hostLoading.value = true;
  try {
    hostOptions.value = (await queryHosts()) ?? [];
  } catch {
    hostOptions.value = [];
  } finally {
    hostLoading.value = false;
  }
}

function resetForm(): void {
  Object.assign(form, {
    acmeAccountId: undefined,
    primaryDomain: props.host?.domain ?? "",
    sanDomains: [],
    challengeType: "HTTP-01",
    deployMode: props.host && props.host.username ? "ssh" : "manual",
    webrootPath: "/var/www/html",
    sshHost: props.host?.domain ?? "",
    sshPort: props.host?.port || 22,
    sshUsername: props.host?.username ?? "",
    sshPassword: "",
    remark: props.host ? `从主机资产「${hostLabel.value}」发起申请` : "",
  });
  hostSelectValue.value = props.host?.hostId ?? null;
}

watch(dialogVisible, (v) => {
  if (v) {
    resetForm();
    void loadAccounts();
    void loadHosts();
  }
});

// 部署模式只在 HTTP-01 下有意义。用户在 HTTP-01 选了「SSH 远程部署」后再切到
// DNS-01，单选组被 v-if 隐藏但 deployMode 仍是 "ssh" —— 既会让 validate() 拿
// 隐藏字段报「SSH 模式需要填写服务器地址」，也会把 ssh参数一并提交给后端。
// 切走 HTTP-01 时回落到 manual，隐藏字段就不参与校验与提交。
watch(
  () => form.challengeType,
  (t) => {
    if (t !== "HTTP-01") form.deployMode = "manual";
  },
);

/** 主机选择变化 → 自动填入 SSH 信息 */
watch(hostSelectValue, (hostId) => {
  if (!hostId) {
    form.sshHost = "";
    form.sshPort = 22;
    form.sshUsername = "";
    form.sshPassword = "";
    return;
  }
  const h = hostOptions.value.find((x: any) => x.id === hostId || x.msServerHostId === hostId);
  if (h) {
    form.sshHost = h.hostIp || h.domain || "";
    form.sshPort = h.sshPort || h.port || 22;
    // 优先取 identity 的用户名（sshUsername），其次 host 的 osUsername
    form.sshUsername = h.sshUsername || h.osUsername || "";
    form.sshPassword = "";
  }
});

function validate(): string {
  if (!form.acmeAccountId) return "请选择 ACME 账户";
  if (!form.primaryDomain.trim()) return "请填写主域名";
  if (form.sanDomains.some(d => !d.trim())) return "备用域名不能为空串";
  if (form.challengeType === "DNS-01" && form.primaryDomain.trim().startsWith("*.")) {
    // 通配符仅支持 DNS-01，合法
  }
  if (form.challengeType !== "DNS-01" && form.primaryDomain.trim().startsWith("*.")) {
    return "通配符域名仅支持 DNS-01 验证";
  }
  if (form.deployMode === "ssh" && form.challengeType === "HTTP-01") {
    if (!hostSelectValue.value && !form.sshHost.trim()) return "SSH 模式需要选择或填写服务器地址";
  }
  return "";
}

async function submit(): Promise<void> {
  const err = validate();
  if (err) {
    message.warning(err);
    return;
  }
  submitting.value = true;
  try {
    const payload: AcmeApplyCertRequest = {
      acmeAccountId: form.acmeAccountId!,
      primaryDomain: form.primaryDomain.trim(),
      sanDomains: form.sanDomains.map(s => s.trim()).filter(Boolean),
      challengeType: form.challengeType,
      deployMode: form.deployMode,
      webrootPath: form.webrootPath,
      sshHost: form.deployMode === "ssh" ? form.sshHost.trim() : undefined,
      sshPort: form.deployMode === "ssh" ? Number(form.sshPort) || 22 : undefined,
      sshUsername: form.deployMode === "ssh" ? form.sshUsername.trim() : undefined,
      sshPassword: form.deployMode === "ssh" ? form.sshPassword : undefined,
    };
    const certId = await applyCert(payload);
    message.success("证书申请已提交，后台异步签发");
    dialogVisible.value = false;
    emit("success");
    if (certId) emit("view-cert", Number(certId));
  } catch (e) {
    message.error(String((e as Error)?.message ?? e));
  } finally {
    submitting.value = false;
  }
}

const showEabTip = computed(() => {
  const selected = accounts.value.find(a => a.acmeAccountId === form.acmeAccountId);
  return selected ? isEabRequired(selected.acmeAccountServer) : false;
});
</script>

<template>
  <el-dialog v-model="dialogVisible" title="申请 SSL/TLS 证书" width="680px" append-to-body :close-on-click-modal="false">
    <el-form label-width="120px">
      <el-alert v-if="hostLabel" type="info" :closable="false" class="mb12">
        <template #title>为「{{ hostLabel }}」申请证书，已带入主机 SSH/部署信息</template>
      </el-alert>

      <el-form-item label="ACME 账户" required>
        <el-select v-model="form.acmeAccountId" filterable placeholder="请选择 ACME 账户" style="width:100%" :loading="accountLoading">
          <el-option v-for="a in accounts" :key="a.acmeAccountId" :value="a.acmeAccountId" :label="`${a.acmeAccountEmail} · ${serverLabel(a.acmeAccountServer)}`" />
        </el-select>
        <div v-if="showEabTip" class="field-hint">该 ACME 服务商需要 EAB 凭证，请在账户设置中补齐。</div>
      </el-form-item>

      <el-form-item label="主域名" required>
        <el-input v-model="form.primaryDomain" placeholder="example.com 或 *.example.com" />
        <div class="field-hint">通配符域名仅支持 DNS-01 验证。</div>
      </el-form-item>

      <el-form-item label="备用域名">
        <el-select v-model="form.sanDomains" multiple filterable allow-create default-first-option placeholder="输入域名后回车，可添加多个 SAN" style="width:100%" />
      </el-form-item>

      <el-form-item label="验证类型" required>
        <el-radio-group v-model="form.challengeType">
          <el-radio-button v-for="c in CHALLENGE_TYPES" :key="c.value" :value="c.value">{{ c.label }}</el-radio-button>
        </el-radio-group>
      </el-form-item>

      <el-form-item v-if="form.challengeType === 'HTTP-01'" label="部署模式" required>
        <el-radio-group v-model="form.deployMode">
          <el-radio-button v-for="m in DEPLOY_MODES" :key="m.value" :value="m.value">{{ m.label }}</el-radio-button>
        </el-radio-group>
      </el-form-item>

      <template v-if="form.challengeType === 'HTTP-01' && form.deployMode !== 'manual'">
        <el-divider content-position="left">Webroot 验证文件目录</el-divider>
        <el-form-item label="Webroot 路径">
          <el-input v-model="form.webrootPath" placeholder="/var/www/html" />
          <div class="field-hint">系统会在该目录下创建 <code>/.well-known/acme-challenge/</code> 验证文件。</div>
        </el-form-item>
      </template>

      <template v-if="form.challengeType === 'HTTP-01' && form.deployMode === 'ssh'">
        <el-divider content-position="left">SSH 远程部署</el-divider>
        <el-form-item label="服务器地址" required>
          <el-input v-model="form.sshHost" placeholder="域名指向的服务器 IP" />
        </el-form-item>
        <el-form-item label="SSH 端口">
          <el-input-number v-model="form.sshPort" :min="1" :max="65535" style="width:180px" />
        </el-form-item>
        <el-form-item label="用户名" required>
          <el-input v-model="form.sshUsername" placeholder="root" />
        </el-form-item>
        <el-form-item label="密码" required>
          <el-input v-model="form.sshPassword" type="password" show-password placeholder="SSH 密码" />
        </el-form-item>
      </template>

      <el-form-item label="备注">
        <el-input v-model="form.remark" type="textarea" :rows="2" placeholder="可选" />
      </el-form-item>
    </el-form>

    <template #footer>
      <el-button @click="dialogVisible = false">取消</el-button>
      <el-button type="primary" :loading="submitting" @click="submit">提交申请</el-button>
    </template>
  </el-dialog>
</template>

<style scoped>
.mb12 {
  margin-bottom: 12px;
}
.field-hint {
  width: 100%;
  margin-top: 4px;
  font-size: 12px;
  color: var(--el-text-color-secondary);
  line-height: 1.5;
}
.field-hint code {
  padding: 1px 4px;
  border-radius: 4px;
  background: var(--el-fill-color-light);
  color: var(--el-color-primary);
  font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
}
</style>