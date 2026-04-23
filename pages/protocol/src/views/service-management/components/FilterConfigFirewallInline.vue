<template>
  <div class="firewall-inline thin-scrollbar">
    <div v-if="section === 'basic'" class="config-section">
      <h4 class="section-title">
        <IconifyIconOnline icon="ri:shield-line" />
        基础配置
      </h4>
      <div class="config-grid">
        <ScFormItem label="启用防火墙"><ScSwitch v-model="config.enabled" /></ScFormItem>
        <ScFormItem label="存储规则"><ScSwitch v-model="config.storageEnabled" /></ScFormItem>
        <ScFormItem label="存储类型">
          <ScInput v-model="config.storageType" placeholder="protocol-firewall-storage" />
        </ScFormItem>
        <ScFormItem label="规则缓存秒数">
          <ScInputNumber v-model="config.ruleCacheSeconds" :min="0" :max="3600" />
        </ScFormItem>
        <ScFormItem label="记录事件"><ScSwitch v-model="config.logEnabled" /></ScFormItem>
        <ScFormItem label="统计指标"><ScSwitch v-model="config.metricsEnabled" /></ScFormItem>
      </div>
    </div>

    <div v-else-if="section === 'whitelist'" class="config-section">
      <h4 class="section-title">
        <IconifyIconOnline icon="ri:shield-check-line" />
        白名单
      </h4>
      <div class="list-block">
        <div class="list-title">
          <span>白名单 IP/CIDR</span>
          <div class="list-actions">
            <span class="list-count">{{ config.whitelistIps.length }}</span>
            <ScButton text type="success" @click="clearWhitelist">清空</ScButton>
          </div>
        </div>
        <div class="tags">
          <div v-if="!config.whitelistIps.length" class="tags-empty">暂无白名单，支持逗号或换行批量粘贴。</div>
          <ScTag
            v-for="item in config.whitelistIps"
            :key="`w-${item}`"
            type="success"
            closable
            @close="removeWhitelist(item)"
          >
            {{ item }}
          </ScTag>
        </div>
        <div class="inline-add">
          <ScInput
            v-model="whitelistInput"
            placeholder="如: 127.0.0.1 或 10.0.0.0/8"
            @keyup.enter="addWhitelist"
          />
          <ScButton type="success" @click="addWhitelist">添加</ScButton>
        </div>
      </div>
    </div>

    <div v-else-if="section === 'blacklist'" class="config-section">
      <h4 class="section-title">
        <IconifyIconOnline icon="ri:forbid-2-line" />
        黑名单
      </h4>
      <div class="config-grid config-grid--single">
        <ScFormItem label="临时黑名单秒数（限流命中后）">
          <ScInputNumber v-model="config.tempBlacklistSeconds" :min="0" :max="86400" />
        </ScFormItem>
      </div>
      <div class="list-block">
        <div class="list-title">
          <span>黑名单 IP/CIDR</span>
          <div class="list-actions">
            <span class="list-count">{{ config.blacklistIps.length }}</span>
            <ScButton text type="danger" @click="clearBlacklist">清空</ScButton>
          </div>
        </div>
        <div class="tags">
          <div v-if="!config.blacklistIps.length" class="tags-empty">暂无黑名单，支持逗号或换行批量粘贴。</div>
          <ScTag
            v-for="item in config.blacklistIps"
            :key="`b-${item}`"
            type="danger"
            closable
            @close="removeBlacklist(item)"
          >
            {{ item }}
          </ScTag>
        </div>
        <div class="inline-add">
          <ScInput
            v-model="blacklistInput"
            placeholder="如: 192.168.1.100 或 172.16.0.0/16"
            @keyup.enter="addBlacklist"
          />
          <ScButton type="danger" @click="addBlacklist">添加</ScButton>
        </div>
      </div>
    </div>

    <div v-else-if="section === 'ratelimit'" class="config-section">
      <h4 class="section-title">
        <IconifyIconOnline icon="ri:settings-3-line" />
        默认限流
      </h4>
      <div class="config-grid">
        <ScFormItem label="限流器类型">
          <ScSelect v-model="config.limiterType">
            <ScOption label="令牌桶" value="token" />
            <ScOption label="滑动窗口" value="sliding" />
            <ScOption label="Guava" value="guava" />
          </ScSelect>
        </ScFormItem>
        <ScFormItem label="默认 QPS">
          <ScInputNumber v-model="config.defaultRatePerSecond" :min="1" :max="100000" />
        </ScFormItem>
        <ScFormItem label="限流维度">
          <ScSelect v-model="config.rateDimension">
            <ScOption label="IP" value="IP" />
            <ScOption label="IP + PATH" value="IP_PATH" />
            <ScOption label="全局" value="GLOBAL" />
          </ScSelect>
        </ScFormItem>
      </div>
      <h4 class="section-title section-title--sub">
        <IconifyIconOnline icon="ri:speed-up-line" />
        路径限流
      </h4>
      <div class="rule-list thin-scrollbar">
        <div v-if="!config.pathRateLimits.length" class="rule-empty">暂无限流规则。</div>
        <div v-for="(row, idx) in config.pathRateLimits" :key="`rate-${idx}`" class="rule-row">
          <ScInput v-model="row.path" placeholder="/api/login" />
          <ScInputNumber v-model="row.qps" :min="1" :max="100000" />
          <ScButton type="danger" circle @click="config.pathRateLimits.splice(idx, 1)">
            <IconifyIconOnline icon="ri:delete-bin-line" />
          </ScButton>
        </div>
      </div>
      <ScButton type="primary" @click="config.pathRateLimits.push({ path: '', qps: 100 })">
        <IconifyIconOnline icon="ri:add-line" />
        新增限流规则
      </ScButton>
    </div>

    <div v-else-if="section === 'forward'" class="config-section">
      <h4 class="section-title">
        <IconifyIconOnline icon="ri:git-branch-line" />
        转发模式
      </h4>
      <div class="config-grid config-grid--single">
        <ScFormItem label="转发模式">
          <ScSelect v-model="config.forwardMode">
            <ScOption label="写入属性" value="ATTRIBUTE" />
            <ScOption label="直接重定向" value="REDIRECT" />
          </ScSelect>
        </ScFormItem>
      </div>
      <h4 class="section-title section-title--sub">
        <IconifyIconOnline icon="ri:route-line" />
        重定向规则
      </h4>
      <div class="rule-list thin-scrollbar">
        <div v-if="!config.redirectMappings.length" class="rule-empty">暂无重定向规则。</div>
        <div v-for="(row, idx) in config.redirectMappings" :key="`redirect-${idx}`" class="rule-row">
          <ScInput v-model="row.path" placeholder="/old-path" />
          <ScInput v-model="row.target" placeholder="https://example.com/new-path" />
          <ScButton type="danger" circle @click="config.redirectMappings.splice(idx, 1)">
            <IconifyIconOnline icon="ri:delete-bin-line" />
          </ScButton>
        </div>
      </div>
      <ScButton type="primary" @click="config.redirectMappings.push({ path: '', target: '' })">
        <IconifyIconOnline icon="ri:add-line" />
        新增重定向规则
      </ScButton>

      <h4 class="section-title section-title--sub">
        <IconifyIconOnline icon="ri:git-merge-line" />
        透传代理规则
      </h4>
      <div class="rule-list thin-scrollbar">
        <div v-if="!config.proxyPassMappings.length" class="rule-empty">暂无透传代理规则。</div>
        <div v-for="(row, idx) in config.proxyPassMappings" :key="`proxy-${idx}`" class="rule-row">
          <ScInput v-model="row.path" placeholder="/service-a" />
          <ScInput v-model="row.target" placeholder="http://upstream-host:8080" />
          <ScButton type="danger" circle @click="config.proxyPassMappings.splice(idx, 1)">
            <IconifyIconOnline icon="ri:delete-bin-line" />
          </ScButton>
        </div>
      </div>
      <ScButton type="primary" @click="config.proxyPassMappings.push({ path: '', target: '' })">
        <IconifyIconOnline icon="ri:add-line" />
        新增透传规则
      </ScButton>
    </div>
    <div v-else class="config-section">
      <p class="config-unknown">未知分段：{{ section }}</p>
    </div>

    <div class="action-row">
      <ScButton @click="loadData">重置本页</ScButton>
      <ScButton type="primary" :loading="loading" @click="handleSave">保存当前配置</ScButton>
    </div>
  </div>
</template>

<script setup lang="ts">
import { reactive, ref, watch } from "vue";
import { message } from "@repo/utils";
import { getServletFilterConfig, saveServletFilterConfig } from "@/api/system-server-setting";

interface Props {
  filterSettingId: number;
  section: "basic" | "whitelist" | "blacklist" | "ratelimit" | "forward";
}
interface PathRateLimitRow {
  path: string;
  qps: number;
}
interface MappingRow {
  path: string;
  target: string;
}
const props = defineProps<Props>();
const emit = defineEmits<{ success: [] }>();
const loading = ref(false);
const whitelistInput = ref("");
const blacklistInput = ref("");
const config = reactive({
  enabled: true,
  storageEnabled: true,
  storageType: "protocol-firewall-storage",
  ruleCacheSeconds: 30,
  limiterType: "token",
  defaultRatePerSecond: 200,
  rateDimension: "IP_PATH",
  tempBlacklistSeconds: 60,
  forwardMode: "ATTRIBUTE",
  whitelistIps: [] as string[],
  blacklistIps: [] as string[],
  pathRateLimits: [] as PathRateLimitRow[],
  redirectMappings: [] as MappingRow[],
  proxyPassMappings: [] as MappingRow[],
  logEnabled: true,
  metricsEnabled: true,
});

watch(() => props.filterSettingId, loadData, { immediate: true });

function toString(raw: unknown, fallback: string): string {
  const text = raw == null ? "" : String(raw).trim();
  return text || fallback;
}
function toNumber(raw: unknown, fallback: number): number {
  const value = typeof raw === "number" ? raw : Number(raw);
  return Number.isFinite(value) ? value : fallback;
}
function toBoolean(raw: unknown, fallback: boolean): boolean {
  if (typeof raw === "boolean") return raw;
  if (typeof raw === "string") {
    const v = raw.trim().toLowerCase();
    if (["true", "1", "yes"].includes(v)) return true;
    if (["false", "0", "no"].includes(v)) return false;
  }
  return fallback;
}
function toStringArray(raw: unknown): string[] {
  if (!raw) return [];
  if (Array.isArray(raw)) return raw.flatMap((item) => toStringArray(item));
  if (typeof raw === "string") {
    const text = raw.trim();
    if (!text) return [];
    if (text.startsWith("[") && text.endsWith("]")) {
      try {
        const parsed = JSON.parse(text);
        return toStringArray(parsed);
      } catch {
        const body = text.slice(1, -1).trim();
        if (!body) return [];
        return body
          .split(/[,\n\r]/)
          .map((item) => item.trim().replace(/^"+|"+$/g, ""))
          .filter((item) => !!item && item !== "[]");
      }
    }
    return text
      .split(/[,\n\r]/)
      .map((item) => item.trim())
      .filter(Boolean);
  }
  return [];
}
function toRateRows(raw: unknown): PathRateLimitRow[] {
  if (typeof raw === "string") {
    const text = raw.trim();
    if (!text) return [];
    try {
      return toRateRows(JSON.parse(text));
    } catch {
      return [];
    }
  }
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return [];
  return Object.entries(raw as Record<string, unknown>)
    .map(([path, qps]) => ({ path: String(path ?? "").trim(), qps: toNumber(qps, 0) }))
    .filter((row) => !!row.path && row.qps > 0);
}
function toMappingRows(raw: unknown): MappingRow[] {
  if (typeof raw === "string") {
    const text = raw.trim();
    if (!text) return [];
    try {
      return toMappingRows(JSON.parse(text));
    } catch {
      return [];
    }
  }
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return [];
  return Object.entries(raw as Record<string, unknown>)
    .map(([path, target]) => ({ path: String(path ?? "").trim(), target: String(target ?? "").trim() }))
    .filter((row) => !!row.path && !!row.target);
}

async function loadData() {
  if (!props.filterSettingId) return;
  const res = await getServletFilterConfig(props.filterSettingId);
  const data = (res?.data || {}) as Record<string, unknown>;
  config.enabled = toBoolean(data.enabled, true);
  config.storageEnabled = toBoolean(data.storageEnabled, true);
  config.storageType = toString(data.storageType, "protocol-firewall-storage");
  config.ruleCacheSeconds = toNumber(data.ruleCacheSeconds, 30);
  config.limiterType = toString(data.limiterType, "token");
  config.defaultRatePerSecond = toNumber(data.defaultRatePerSecond, 200);
  config.rateDimension = toString(data.rateDimension, "IP_PATH");
  config.tempBlacklistSeconds = toNumber(data.tempBlacklistSeconds, 60);
  config.forwardMode = toString(data.forwardMode, "ATTRIBUTE");
  config.whitelistIps = toStringArray(data.whitelistIps);
  config.blacklistIps = toStringArray(data.blacklistIps);
  config.pathRateLimits = toRateRows(data.pathRateLimits);
  config.redirectMappings = toMappingRows(data.redirectMappings);
  config.proxyPassMappings = toMappingRows(data.proxyPassMappings);
  config.logEnabled = toBoolean(data.logEnabled, true);
  config.metricsEnabled = toBoolean(data.metricsEnabled, true);
}

function addWhitelist() {
  const values = parseNetworkEntries(whitelistInput.value);
  if (!values.length) return;
  const invalid = values.filter((item) => !isValidNetworkEntry(item));
  if (invalid.length) {
    message(`白名单格式不合法: ${invalid.join(", ")}`, { type: "error" });
    return;
  }
  config.whitelistIps = dedupeStrings([...config.whitelistIps, ...values]);
  whitelistInput.value = "";
}
function addBlacklist() {
  const values = parseNetworkEntries(blacklistInput.value);
  if (!values.length) return;
  const invalid = values.filter((item) => !isValidNetworkEntry(item));
  if (invalid.length) {
    message(`黑名单格式不合法: ${invalid.join(", ")}`, { type: "error" });
    return;
  }
  config.blacklistIps = dedupeStrings([...config.blacklistIps, ...values]);
  blacklistInput.value = "";
}
function removeWhitelist(value: string) {
  config.whitelistIps = config.whitelistIps.filter((item) => item !== value);
}
function removeBlacklist(value: string) {
  config.blacklistIps = config.blacklistIps.filter((item) => item !== value);
}
function clearWhitelist() {
  config.whitelistIps = [];
}
function clearBlacklist() {
  config.blacklistIps = [];
}
function rowsToRateMap(rows: PathRateLimitRow[]): Record<string, number> {
  return rows.reduce((acc, row) => {
    const path = row.path.trim();
    if (path && row.qps > 0) acc[path] = Number(row.qps);
    return acc;
  }, {} as Record<string, number>);
}
function rowsToMappingMap(rows: MappingRow[]): Record<string, string> {
  return rows.reduce((acc, row) => {
    const path = row.path.trim();
    const target = row.target.trim();
    if (path && target) acc[path] = target;
    return acc;
  }, {} as Record<string, string>);
}
function parseNetworkEntries(raw: string): string[] {
  return raw
    .split(/[,\n\r]/)
    .map((item) => item.trim())
    .filter(Boolean);
}
function dedupeStrings(values: string[]): string[] {
  return [...new Set(values.map((item) => item.trim()).filter(Boolean))];
}
function isValidIpv4(input: string): boolean {
  const parts = input.split(".");
  if (parts.length !== 4) return false;
  return parts.every((part) => /^\d+$/.test(part) && Number(part) >= 0 && Number(part) <= 255);
}
function isValidNetworkEntry(input: string): boolean {
  const text = input.trim();
  if (!text) return false;
  if (!text.includes("/")) return isValidIpv4(text);
  const [ip, prefix] = text.split("/");
  return isValidIpv4(ip) && /^\d+$/.test(prefix) && Number(prefix) >= 0 && Number(prefix) <= 32;
}
function validateBeforeSave(): boolean {
  const invalidWhitelist = config.whitelistIps.filter((item) => !isValidNetworkEntry(item));
  if (invalidWhitelist.length) {
    message(`白名单格式不合法: ${invalidWhitelist.join(", ")}`, { type: "error" });
    return false;
  }
  const invalidBlacklist = config.blacklistIps.filter((item) => !isValidNetworkEntry(item));
  if (invalidBlacklist.length) {
    message(`黑名单格式不合法: ${invalidBlacklist.join(", ")}`, { type: "error" });
    return false;
  }
  const invalidRate = config.pathRateLimits.find((row) => !row.path.trim() || Number(row.qps) <= 0);
  if (invalidRate) {
    message("路径限流规则需要同时填写路径和大于 0 的 QPS。", { type: "error" });
    return false;
  }
  const invalidRedirect = config.redirectMappings.find((row) => !row.path.trim() || !row.target.trim());
  if (invalidRedirect) {
    message("重定向规则需要同时填写路径和目标地址。", { type: "error" });
    return false;
  }
  const invalidProxy = config.proxyPassMappings.find((row) => !row.path.trim() || !row.target.trim());
  if (invalidProxy) {
    message("透传代理规则需要同时填写路径和目标地址。", { type: "error" });
    return false;
  }
  return true;
}
async function handleSave() {
  if (!validateBeforeSave()) return;
  loading.value = true;
  try {
    const res = await saveServletFilterConfig(props.filterSettingId, {
      enabled: !!config.enabled,
      storageEnabled: !!config.storageEnabled,
      storageType: config.storageType.trim() || "protocol-firewall-storage",
      ruleCacheSeconds: Number(config.ruleCacheSeconds || 0),
      limiterType: config.limiterType || "token",
      defaultRatePerSecond: Number(config.defaultRatePerSecond || 200),
      rateDimension: config.rateDimension || "IP_PATH",
      tempBlacklistSeconds: Number(config.tempBlacklistSeconds || 0),
      forwardMode: config.forwardMode || "ATTRIBUTE",
      whitelistIps: [...config.whitelistIps],
      blacklistIps: [...config.blacklistIps],
      pathRateLimits: rowsToRateMap(config.pathRateLimits),
      redirectMappings: rowsToMappingMap(config.redirectMappings),
      proxyPassMappings: rowsToMappingMap(config.proxyPassMappings),
      logEnabled: !!config.logEnabled,
      metricsEnabled: !!config.metricsEnabled,
    });
    if (res.success) {
      message("防火墙配置保存成功，已热应用", { type: "success" });
      emit("success");
      return;
    }
    message(res.msg || "保存失败", { type: "error" });
  } catch (error) {
    console.error("保存防火墙配置失败:", error);
    message("保存失败", { type: "error" });
  } finally {
    loading.value = false;
  }
}
</script>

<style scoped lang="scss">
.firewall-inline {
  --fc-surface: linear-gradient(170deg, #f7fbff 0%, #f2f8ff 48%, #f9fcff 100%);
  --fc-border: rgba(123, 154, 187, 0.34);
  --fc-title: #234c73;
  min-height: 540px;
}
.config-section {
  padding: 20px;
  border-radius: 14px;
  background: var(--fc-surface);
  border: 1px solid var(--fc-border);
  box-shadow:
    0 14px 32px rgba(29, 70, 118, 0.07),
    inset 0 1px 0 rgba(255, 255, 255, 0.86);
}
.section-title {
  display: flex;
  align-items: center;
  gap: 8px;
  margin: 0 0 14px;
  font-size: 14px;
  color: var(--fc-title);
  letter-spacing: 0.2px;
}
.section-title--sub {
  margin-top: 16px;
}
.config-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px 16px;
}
.config-grid--single {
  grid-template-columns: minmax(0, 1fr);
  max-width: 420px;
}
.config-unknown {
  margin: 0;
  color: #909399;
  font-size: 13px;
}
.list-block {
  margin-bottom: 14px;
}
.list-title {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 8px;
  font-weight: 600;
  font-size: 13px;
  color: #2a5780;
}
.list-actions {
  display: inline-flex;
  align-items: center;
  gap: 10px;
}
.list-count {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 22px;
  height: 22px;
  padding: 0 8px;
  border-radius: 999px;
  background: rgba(90, 130, 192, 0.12);
  color: #35618d;
  font-size: 12px;
}
.tags {
  min-height: 34px;
  padding: 10px;
  border: 1px dashed rgba(136, 161, 188, 0.65);
  border-radius: 10px;
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-bottom: 10px;
  background: #fcfdff;
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.85);
}
.tags-empty,
.rule-empty {
  color: #7f92a6;
  font-size: 12px;
}
.inline-add {
  display: flex;
  gap: 8px;
}
.rule-list {
  max-height: 240px;
  overflow-y: auto;
  margin-bottom: 10px;
}
.rule-row {
  display: grid;
  grid-template-columns: 1fr 1fr auto;
  gap: 8px;
  margin-bottom: 8px;
  padding: 8px;
  border-radius: 12px;
  border: 1px solid rgba(131, 160, 191, 0.28);
  background: #fff;
  box-shadow: 0 4px 12px rgba(34, 75, 124, 0.06);
}
.action-row {
  margin-top: 12px;
  display: flex;
  justify-content: flex-end;
}

.action-row :deep(.el-button) {
  min-width: 148px;
  border-radius: 10px;
  font-weight: 600;
}

@media (max-width: 900px) {
  .config-grid {
    grid-template-columns: minmax(0, 1fr);
  }

  .inline-add,
  .rule-row,
  .action-row {
    grid-template-columns: minmax(0, 1fr);
    flex-direction: column;
    align-items: stretch;
  }
}
</style>
