<script setup lang="ts">
import { computed, reactive, ref, watch } from "vue";
import { message } from "@repo/core";
import ReDialog from "@repo/ui/re-dialog";
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
import { queryHosts } from "../../../api";

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

/** 主机下拉的取值键（主机实体的主键是 id） */
const hostKey = (h: any): number | null => {
  const k = h?.id ?? h?.msServerHostId ?? h?.hostId;
  return k == null ? null : Number(k);
};

/** 当前选中的主机（用于展示已带入的连接信息，避免重复填写） */
const selectedHost = computed<any | null>(() => {
  if (!hostSelectValue.value) return null;
  return hostOptions.value.find((h: any) => hostKey(h) === hostSelectValue.value) ?? null;
});

/** 主机展示标签 */
function hostOptionLabel(h: any): string {
  const name = h?.serverHostName || h?.hostName || h?.domain || `主机 #${hostKey(h) ?? "?"}`;
  const addr = h?.serverHostAddress || h?.hostIp || "";
  const port = h?.serverHostPort ?? h?.sshPort;
  return `${name}${addr ? ` (${addr}${port ? `:${port}` : ""})` : ""}`;
}

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
    // 从主机详情页带入（query.hostId）时，此时才有真实主机数据可补地址/端口/用户名
    if (hostSelectValue.value) {
      fillSshFromHost(hostSelectValue.value);
    }
  } catch {
    hostOptions.value = [];
  } finally {
    hostLoading.value = false;
  }
}

/**
 * 按选中的主机填充 SSH 连接信息（仅用于「确认连的是哪台机器」的只读展示）。
 *
 * <p>真正的凭据由后端按 {@code sshHostId} 从主机绑定的登录身份解析，
 * 这里不取也不回显密码。</p>
 *
 * @param hostId 主机标识
 */
function fillSshFromHost(hostId: number): void {
  const h = hostOptions.value.find((x: any) => hostKey(x) === hostId);
  if (!h) return;
  form.sshHost = h.serverHostAddress || h.hostIp || h.domain || "";
  form.sshPort = h.serverHostPort || h.sshPort || h.port || 22;
  form.sshUsername = h.sshUsername || h.osUsername || "";
  form.sshPassword = "";
}

function resetForm(): void {
  Object.assign(form, {
    acmeAccountId: undefined,
    primaryDomain: props.host?.domain ?? "",
    sanDomains: [],
    challengeType: "HTTP-01",
    deployMode: props.host ? "ssh" : "manual",
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

/** 主机选择变化 → 自动带入该主机的连接信息 */
watch(hostSelectValue, (hostId) => {
  if (!hostId) {
    form.sshHost = "";
    form.sshPort = 22;
    form.sshUsername = "";
    form.sshPassword = "";
    return;
  }
  fillSshFromHost(hostId);
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
    // 选了主机资产：凭据交给后端按 hostId 解析，前端无需再填地址/用户名
    if (!hostSelectValue.value && !form.sshHost.trim()) return "请选择部署主机";
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
    const ssh = form.deployMode === "ssh";
    // 选了主机资产时只传 sshHostId，由后端解析凭据（避免把密码明文塞进请求体）；
    // 只有在「手工指定主机」模式下才回传地址等字段。
    const useHostAsset = ssh && !!hostSelectValue.value;
    const payload: AcmeApplyCertRequest = {
      acmeAccountId: form.acmeAccountId!,
      primaryDomain: form.primaryDomain.trim(),
      sanDomains: form.sanDomains.map(s => s.trim()).filter(Boolean),
      challengeType: form.challengeType,
      deployMode: form.deployMode,
      webrootPath: form.webrootPath,
      sshHostId: useHostAsset ? hostSelectValue.value! : undefined,
      sshHost: ssh ? (form.sshHost.trim() || undefined) : undefined,
      sshPort: ssh ? (Number(form.sshPort) || 22) : undefined,
      sshUsername: ssh ? (form.sshUsername.trim() || undefined) : undefined,
      sshPassword: ssh && !useHostAsset ? form.sshPassword : undefined,
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
  <ReDialog v-model="dialogVisible" title="申请 SSL/TLS 证书" width="680px" append-to-body :close-on-click-modal="false">
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
        <el-form-item label="部署主机" required>
          <el-select
            v-model="hostSelectValue"
            filterable
            clearable
            placeholder="搜索或选择主机"
            style="width:100%"
            :loading="hostLoading"
            :disabled="!!props.host?.hostId"
          >
            <el-option
              v-for="h in hostOptions"
              :key="hostKey(h)!"
              :value="hostKey(h)!"
              :label="hostOptionLabel(h)"
            />
          </el-select>
          <div class="field-hint">
            选择主机后，SSH 地址、端口与登录凭据由系统按该主机的登录身份自动使用，无需重复填写。
          </div>
        </el-form-item>

        <!-- 已选主机：只读摘要，确认将要连接哪台机器，不给编辑入口 -->
        <el-form-item v-if="selectedHost" label="连接信息">
          <div class="ssh-summary">
            <el-tag type="success" effect="plain" size="small">已自动带入</el-tag>
            <span class="ssh-summary__item">
              <code>{{ form.sshHost || "—" }}{{ form.sshPort ? ":" + form.sshPort : "" }}</code>
            </span>
            <span class="ssh-summary__item">
              用户 <code>{{ form.sshUsername || "取主机绑定身份" }}</code>
            </span>
            <span class="ssh-summary__item ssh-summary__muted">口令/密钥取自主机凭据，不在页面回显</span>
          </div>
        </el-form-item>

        <!-- 未选主机：允许手工指定一台未纳管的机器 -->
        <template v-if="!selectedHost">
          <el-form-item label="服务器地址">
            <el-input v-model="form.sshHost" placeholder="IP 或域名" />
          </el-form-item>
          <el-form-item label="SSH 端口">
            <el-input-number v-model="form.sshPort" :min="1" :max="65535" style="width:180px" />
          </el-form-item>
          <el-form-item label="用户名">
            <el-input v-model="form.sshUsername" placeholder="SSH 用户名" />
          </el-form-item>
          <el-form-item label="密码">
            <el-input v-model="form.sshPassword" type="password" show-password placeholder="SSH 密码" />
          </el-form-item>
        </template>
      </template>

      <el-form-item label="备注">
        <el-input v-model="form.remark" type="textarea" :rows="2" placeholder="可选" />
      </el-form-item>
    </el-form>

    <template #footer>
      <el-button @click="dialogVisible = false">取消</el-button>
      <el-button type="primary" :loading="submitting" @click="submit">提交申请</el-button>
    </template>
  </ReDialog>
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
/* 已选主机的连接信息摘要：只读展示，不再给出输入框 */
.ssh-summary {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px 14px;
  width: 100%;
  padding: 8px 12px;
  border-radius: 8px;
  background: var(--el-fill-color-lighter);
  border: 1px solid var(--el-border-color-lighter);
  line-height: 1.6;
}
.ssh-summary__item {
  font-size: 13px;
  color: var(--el-text-color-regular);
}
.ssh-summary__item code {
  padding: 1px 5px;
  border-radius: 4px;
  background: var(--el-fill-color-light);
  font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
}
.ssh-summary__muted {
  color: var(--el-text-color-secondary);
  font-size: 12px;
}
</style>
