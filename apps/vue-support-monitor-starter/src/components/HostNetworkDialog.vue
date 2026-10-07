<script setup lang="ts">
/**
 * 主机网卡管理弹窗
 *
 * 单弹窗两视图（列表 ⇄ IPv4 配置），避免 Element 嵌套弹窗的层级问题：
 *   1) 列表：fetchAdapters 列出网卡（名称/状态/MAC/IPv4/速率），行内「配置」进入配置视图；
 *   2) 配置：fetchIPv4Config 回填当前 IPv4 + fetchAdapterDetail 展示属性，
 *            表单切换 DHCP/静态、自动/手工 DNS，saveIPv4Config 下发后回读确认。
 *
 * 后端 HostNetworkServiceImpl 目前仅支持 Windows（其余平台返回可读错误），
 * 因此 osType 明确非 Windows 时直接给出提示，不发无谓请求。
 *
 * @author CH
 * @since 4.0.0.43
 */
import { computed, ref, watch } from "vue";
import { ElMessage, ElMessageBox } from "element-plus";
import { ReFormItem } from "@repo/ui/re-kit";
import {
  fetchAdapters, fetchAdapterDetail, fetchIPv4Config, saveIPv4Config,
  type NetworkAdapterDetail,
} from "../monitorApi";

defineOptions({ name: "HostNetworkDialog", inheritAttrs: false });

const props = defineProps<{
  modelValue: boolean;
  hostId: number;
  hostName?: string;
  /** 主机台账 OS 类型，用于提前判定是否支持网卡图形化管理 */
  osType?: string;
  /** 打开即进入该网卡的 IPv4 配置；留空进入网卡列表 */
  initialAdapter?: string;
}>();

const emit = defineEmits<{
  (e: "update:modelValue", v: boolean): void;
  /** 配置成功下发后通知父级刷新画像网络分区 */
  (e: "applied"): void;
}>();

/** 后端仅 Windows 支持网卡图形化；osType 为空时交由后端判定 */
const windowsOnly = computed(() => {
  const os = (props.osType || "").toUpperCase();
  return os !== "" && !os.includes("WINDOWS");
});

/** IPv4 表单本地类型（前缀长度给具体值，避免组件 v-model 的 undefined 推断） */
type Ipv4Form = {
  adapterName: string;
  ifIndex?: number;
  dhcp: boolean;
  address: string;
  prefixLength: number;
  gateway: string;
  dnsDhcp: boolean;
  dnsPreferred: string;
  dnsAlternate: string;
};

const view = ref<"list" | "config">("list");

const adapters = ref<NetworkAdapterDetail[]>([]);
const listLoading = ref(false);
const listError = ref("");

const currentName = ref("");
const detail = ref<NetworkAdapterDetail | null>(null);
const formLoading = ref(false);
const formError = ref("");
const saving = ref(false);
const form = ref<Ipv4Form>(emptyForm());

/** 空表单：默认自动获取 IP 与 DNS，与后端 IPv4ConfigVO 默认一致 */
function emptyForm(): Ipv4Form {
  return {
    adapterName: "",
    ifIndex: undefined,
    dhcp: true,
    address: "",
    prefixLength: 24,
    gateway: "",
    dnsDhcp: true,
    dnsPreferred: "",
    dnsAlternate: "",
  };
}

/** 网卡列表列定义 */
const adapterColumns = computed(() => [
  { prop: "name", label: "网卡", minWidth: 130, showOverflowTooltip: true },
  { prop: "status", label: "状态", width: 118, slot: "status" },
  { prop: "macAddress", label: "MAC", width: 152, slot: "mac" },
  { prop: "ipv4Text", label: "IPv4", minWidth: 168, showOverflowTooltip: true, slot: "ipv4" },
  { prop: "linkSpeed", label: "速率", width: 100 },
  { prop: "ifIndex", label: "操作", width: 96, fixed: "right", align: "right", slot: "op" },
]);

/**
 * 网卡 IPv4 展示文本
 * @param a 网卡
 * @returns 逗号拼接，空为 —
 */
function ipv4Text(a: NetworkAdapterDetail): string {
  return (a.ipv4Addresses || []).join(", ") || "—";
}

/**
 * 连接状态 → 指示灯类型
 * @param s 后端状态原文
 */
function statusType(s?: string): "success" | "info" | "danger" {
  const v = (s || "").toLowerCase();
  if (v === "up") return "success";
  if (v === "disabled") return "danger";
  return "info";
}

/**
 * 连接状态 → 中文标签
 * @param s 后端状态原文
 */
function statusLabel(s?: string): string {
  const v = (s || "").toLowerCase();
  if (v === "up") return "已连接";
  if (v === "disconnected") return "未连接";
  if (v === "disabled") return "已禁用";
  return s || "—";
}

/** 配置视图顶部的只读属性条 */
const infoChips = computed<Array<{ k: string; v: string }>>(() => {
  const d = detail.value;
  if (!d) return [];
  return [
    { k: "网卡", v: d.name || currentName.value || "—" },
    { k: "状态", v: statusLabel(d.status) },
    { k: "描述", v: d.description || "—" },
    { k: "MAC", v: d.macAddress || "—" },
    { k: "速率", v: d.linkSpeed || "—" },
    { k: "MTU", v: d.mtu ? String(d.mtu) : "—" },
    { k: "网关", v: (d.gateways || []).join(", ") || "—" },
    { k: "DNS", v: (d.dnsServers || []).join(", ") || "—" },
  ];
});

/** 拉取网卡列表 */
async function loadAdapters(): Promise<void> {
  if (windowsOnly.value) {
    adapters.value = [];
    listError.value = "网卡图形化管理仅支持 Windows 主机";
    return;
  }
  listLoading.value = true;
  listError.value = "";
  try {
    adapters.value = (await fetchAdapters(props.hostId)) ?? [];
  } catch (e) {
    adapters.value = [];
    listError.value = String((e as Error)?.message ?? e);
  } finally {
    listLoading.value = false;
  }
}

/**
 * 进入某网卡的 IPv4 配置视图：并行回读配置与属性
 * @param name 网卡名称（后端亦接受描述/索引）
 */
async function openConfig(name: string): Promise<void> {
  currentName.value = name;
  view.value = "config";
  formError.value = "";
  formLoading.value = true;
  detail.value = null;
  form.value = emptyForm();
  try {
    const [cfg, info] = await Promise.all([
      fetchIPv4Config(props.hostId, name),
      fetchAdapterDetail(props.hostId, name).catch(() => null),
    ]);
    detail.value = info;
    form.value = {
      adapterName: cfg.adapterName || name,
      ifIndex: cfg.ifIndex ?? info?.ifIndex,
      dhcp: cfg.dhcp !== false,
      address: cfg.address || "",
      prefixLength: cfg.prefixLength ?? 24,
      gateway: cfg.gateway || "",
      dnsDhcp: cfg.dnsDhcp !== false,
      dnsPreferred: cfg.dnsPreferred || "",
      dnsAlternate: cfg.dnsAlternate || "",
    };
  } catch (e) {
    formError.value = String((e as Error)?.message ?? e);
  } finally {
    formLoading.value = false;
  }
}

/** 校验 IPv4 字面量 */
function isIpv4(v: string): boolean {
  const parts = v.split(".");
  if (parts.length !== 4) return false;
  return parts.every(p => /^\d{1,3}$/.test(p) && Number(p) >= 0 && Number(p) <= 255);
}

/** 下发前的前端校验：把明显错误的输入挡在往返之前 */
function validate(): string {
  const f = form.value;
  if (!f.dhcp) {
    if (!isIpv4((f.address || "").trim())) return "请填写合法的静态 IPv4 地址";
    if (!(f.prefixLength >= 1 && f.prefixLength <= 32)) return "子网前缀长度需在 1-32";
    const gw = (f.gateway || "").trim();
    if (gw && !isIpv4(gw)) return "默认网关格式不合法";
  }
  if (!f.dnsDhcp) {
    if (!isIpv4((f.dnsPreferred || "").trim())) return "请填写首选 DNS，或改为自动获取 DNS";
    const alt = (f.dnsAlternate || "").trim();
    if (alt && !isIpv4(alt)) return "备用 DNS 格式不合法";
  }
  return "";
}

/** 组装下发载荷：非激活分支的字段留空，避免把界面上的残留值写进去 */
function buildPayload(): Ipv4Form & { prefixLength?: number } {
  const f = form.value;
  return {
    adapterName: f.adapterName || currentName.value,
    ifIndex: f.ifIndex,
    dhcp: !!f.dhcp,
    address: f.dhcp ? "" : (f.address || "").trim(),
    prefixLength: f.dhcp ? undefined : Number(f.prefixLength),
    gateway: f.dhcp ? "" : (f.gateway || "").trim(),
    dnsDhcp: !!f.dnsDhcp,
    dnsPreferred: f.dnsDhcp ? "" : (f.dnsPreferred || "").trim(),
    dnsAlternate: f.dnsDhcp ? "" : (f.dnsAlternate || "").trim(),
  };
}

/** 提交下发（二次确认：可能造成网络短暂中断） */
async function submit(): Promise<void> {
  const err = validate();
  if (err) {
    ElMessage.warning(err);
    return;
  }
  try {
    await ElMessageBox.confirm(
      `即将改写网卡 ${currentName.value} 的 IPv4 配置，可能造成该主机网络短暂中断，确认下发？`,
      "确认下发",
      { type: "warning", confirmButtonText: "下发", cancelButtonText: "取消" },
    );
  } catch {
    return;
  }
  saving.value = true;
  try {
    const payload = buildPayload();
    await saveIPv4Config(props.hostId, {
      adapterName: payload.adapterName,
      ifIndex: payload.ifIndex,
      dhcp: payload.dhcp,
      address: payload.address || undefined,
      prefixLength: payload.prefixLength,
      gateway: payload.gateway || undefined,
      dnsDhcp: payload.dnsDhcp,
      dnsPreferred: payload.dnsPreferred || undefined,
      dnsAlternate: payload.dnsAlternate || undefined,
    });
    ElMessage.success("IPv4 配置已下发");
    emit("applied");
    await openConfig(currentName.value);
  } catch (e) {
    ElMessage.error(String((e as Error)?.message ?? e));
  } finally {
    saving.value = false;
  }
}

// 每次打开按 initialAdapter 重置视图；关闭时不请求
watch(
  () => props.modelValue,
  (v) => {
    if (!v) return;
    const seed = (props.initialAdapter || "").trim();
    if (seed) {
      void openConfig(seed);
    } else {
      view.value = "list";
      void loadAdapters();
    }
  },
);
</script>

<template>
  <ReDialog
    :model-value="modelValue"
    @update:model-value="(v: boolean) => emit('update:modelValue', v)"
    :title="view === 'config' ? 'IPv4 配置' : '网卡管理'"
    width="880px"
    :close-on-click-modal="false"
  >
    <!-- 视图一：网卡列表 -->
    <template v-if="view === 'list'">
      <div class="hn-bar">
        <span class="hn-host dim">{{ hostName || `主机 #${hostId}` }}</span>
        <ReButton icon="RefreshRight" :show-text="true" :loading="listLoading" @click="loadAdapters">刷新</ReButton>
      </div>
      <div v-if="listError" class="hn-error">{{ listError }}</div>
      <ReTable
        v-else
        :data="adapters"
        :pagination="false"
        :columns="adapterColumns"
        :loading="listLoading"
        :border="false"
        empty-text="未发现网卡"
        table-id="host-network-adapters"
      >
        <template #col-status="{ row }">
          <ReStatusIndicator :type="statusType(row.status)" />{{ statusLabel(row.status) }}
        </template>
        <template #col-mac="{ row }"><span class="mono">{{ row.macAddress || "—" }}</span></template>
        <template #col-ipv4="{ row }"><span class="mono">{{ ipv4Text(row) }}</span></template>
        <template #col-op="{ row }">
          <ReButton icon="Setting" type="primary" :show-text="true" @click="openConfig(row.name)">配置</ReButton>
        </template>
      </ReTable>
    </template>

    <!-- 视图二：IPv4 配置 -->
    <template v-else>
      <div class="hn-bar">
        <ReButton icon="Back" :show-text="true" @click="view = 'list'">返回列表</ReButton>
        <span class="hn-cur mono">{{ currentName }}</span>
      </div>
      <div v-if="infoChips.length" class="hn-info">
        <div v-for="c in infoChips" :key="c.k" class="hn-chip">
          <span class="hn-chip-k">{{ c.k }}</span>
          <span class="hn-chip-v mono" :title="c.v">{{ c.v }}</span>
        </div>
      </div>
      <div v-if="formLoading" class="hn-loading dim">正在读取当前配置…</div>
      <div v-else-if="formError" class="hn-error">{{ formError }}</div>
      <ReForm v-else label-width="110px" class="hn-form">
        <ReFormItem label="IP 获取方式">
          <ReSwitch v-model="form.dhcp" active-text="自动 (DHCP)" inactive-text="手动 (静态)" />
        </ReFormItem>
        <template v-if="!form.dhcp">
          <ReFormItem label="IP 地址">
            <ReInput v-model="form.address" placeholder="192.168.1.100" style="width: 200px" class="mono" />
            <span class="hn-sep">/</span>
            <ReInputNumber v-model="form.prefixLength" :min="1" :max="32" style="width: 110px" />
            <span class="hn-hint">前缀长度</span>
          </ReFormItem>
          <ReFormItem label="默认网关">
            <ReInput v-model="form.gateway" placeholder="192.168.1.1（可留空）" style="width: 260px" class="mono" />
          </ReFormItem>
        </template>
        <ReFormItem label="DNS">
          <ReSwitch v-model="form.dnsDhcp" active-text="自动获取" inactive-text="手动指定" />
        </ReFormItem>
        <template v-if="!form.dnsDhcp">
          <ReFormItem label="首选 DNS">
            <ReInput v-model="form.dnsPreferred" placeholder="如 8.8.8.8" style="width: 260px" class="mono" />
          </ReFormItem>
          <ReFormItem label="备用 DNS">
            <ReInput v-model="form.dnsAlternate" placeholder="可留空" style="width: 260px" class="mono" />
          </ReFormItem>
        </template>
        <div class="hn-tip">
          下发通过当前采集通道（本机 / Agent / SSH / WinRM）执行 PowerShell，
          修改 IP 可能导致连接短暂中断；仅 Windows 主机支持。
        </div>
      </ReForm>
    </template>

    <template #footer>
      <ReButton @click="emit('update:modelValue', false)">关闭</ReButton>
      <ReButton
        v-if="view === 'config'"
        type="primary" icon="Check" :show-text="true"
        :loading="saving" :disabled="formLoading" @click="submit"
      >下发</ReButton>
    </template>
  </ReDialog>
</template>

<style scoped lang="scss">
.hn-bar { display: flex; align-items: center; justify-content: space-between; gap: 12px; margin-bottom: 12px; }
.hn-host { font-size: 13px; }
.hn-cur { font-size: 13px; color: var(--text-secondary); }
.dim { color: var(--text-tertiary); }
.mono { font-family: ui-monospace, SFMono-Regular, monospace; font-size: 12px; }
.hn-error {
  display: flex; align-items: center; gap: 8px;
  padding: 10px 14px; font-size: 13px;
  color: var(--status-error-text); background: var(--status-error-bg);
  border: 1px solid var(--status-error-border); border-radius: var(--radius-sm);
}
.hn-loading { padding: 24px 0; text-align: center; font-size: 13px; }
.hn-info {
  display: grid; grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 8px 16px; padding: 12px 14px; margin-bottom: 14px;
  background: var(--bg-subtle, rgba(148, 163, 184, 0.08));
  border: 1px solid var(--border-subtle); border-radius: var(--radius-sm);
}
.hn-chip { display: flex; align-items: baseline; gap: 6px; min-width: 0; }
.hn-chip-k { flex: none; font-size: 12px; color: var(--text-tertiary); }
.hn-chip-v { color: var(--text-primary); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.hn-sep { margin: 0 6px; color: var(--text-tertiary); }
.hn-hint { margin-left: 8px; font-size: 12px; color: var(--text-tertiary); }
.hn-tip {
  margin-top: 6px; padding: 8px 12px; font-size: 12px; line-height: 1.6;
  color: var(--text-secondary); background: var(--bg-subtle, rgba(148, 163, 184, 0.08));
  border-radius: var(--radius-sm);
}
.hn-form :deep(.el-form-item) { margin-bottom: 16px; }
.hn-form :deep(.el-form-item__content) { display: flex; align-items: center; flex-wrap: wrap; }
</style>
