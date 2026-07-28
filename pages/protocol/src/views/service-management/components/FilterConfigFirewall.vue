<template>
  <sc-dialog
    v-model="visibleInner"
    title="防火墙配置"
    width="980px"
    :close-on-click-modal="false"
    @close="handleClose"
    draggable
  >
    <div class="firewall-config-container thin-scrollbar">
      <ScTabs v-model="activeTab" type="border-card" class="firewall-tabs">
        <ScTabPane name="basic">
          <template #label>
            <span class="tab-label">
              <span>基础配置</span>
              <IconifyIconOnline icon="ri:shield-line" />
            </span>
          </template>
          <div class="fc-section">
            <h4 class="fc-section-title">
              <IconifyIconOnline icon="ri:shield-line" />
              基础配置
            </h4>
            <div class="fc-grid">
              <ScFormItem label="启用防火墙">
                <ScSwitch v-model="config.enabled" />
              </ScFormItem>
              <ScFormItem label="存储规则">
                <ScSwitch v-model="config.storageEnabled" />
              </ScFormItem>
              <ScFormItem label="存储类型">
                <ScInput v-model="config.storageType" placeholder="protocol-firewall-storage" />
              </ScFormItem>
              <ScFormItem label="规则缓存秒数">
                <ScInputNumber v-model="config.ruleCacheSeconds" :min="0" :max="3600" />
              </ScFormItem>
              <ScFormItem label="记录事件">
                <ScSwitch v-model="config.logEnabled" />
              </ScFormItem>
              <ScFormItem label="统计指标">
                <ScSwitch v-model="config.metricsEnabled" />
              </ScFormItem>
            </div>
          </div>
        </ScTabPane>

        <ScTabPane name="whitelist">
          <template #label>
            <span class="tab-label">
              <span>白名单</span>
              <IconifyIconOnline icon="ri:user-follow-line" />
            </span>
          </template>
          <div class="fc-section">
            <h4 class="fc-section-title">
              <IconifyIconOnline icon="ri:shield-check-line" />
              白名单
            </h4>
            <div class="fc-list-block">
              <div class="fc-list-title">白名单 IP/CIDR</div>
              <div class="fc-tags">
                <ScTag v-for="item in config.whitelistIps" :key="`w-${item}`" type="success" closable @close="removeWhitelist(item)">
                  {{ item }}
                </ScTag>
              </div>
              <div class="fc-inline-add">
                <ScInput v-model="whitelistInput" placeholder="如: 127.0.0.1 或 10.0.0.0/8" @keyup.enter="addWhitelist" />
                <ScButton type="success" @click="addWhitelist">添加</ScButton>
              </div>
            </div>
          </div>
        </ScTabPane>

        <ScTabPane name="blacklist">
          <template #label>
            <span class="tab-label">
              <span>黑名单</span>
              <IconifyIconOnline icon="ri:forbid-2-line" />
            </span>
          </template>
          <div class="fc-section">
            <h4 class="fc-section-title">
              <IconifyIconOnline icon="ri:forbid-2-line" />
              黑名单
            </h4>
            <div class="fc-grid">
              <ScFormItem label="临时黑名单秒数（限流命中后）">
                <ScInputNumber v-model="config.tempBlacklistSeconds" :min="0" :max="86400" />
              </ScFormItem>
            </div>
            <div class="fc-list-block">
              <div class="fc-list-title">黑名单 IP/CIDR</div>
              <div class="fc-tags">
                <ScTag v-for="item in config.blacklistIps" :key="`b-${item}`" type="danger" closable @close="removeBlacklist(item)">
                  {{ item }}
                </ScTag>
              </div>
              <div class="fc-inline-add">
                <ScInput v-model="blacklistInput" placeholder="如: 192.168.1.100 或 172.16.0.0/16" @keyup.enter="addBlacklist" />
                <ScButton type="danger" @click="addBlacklist">添加</ScButton>
              </div>
            </div>
          </div>
        </ScTabPane>

        <ScTabPane name="ratelimit">
          <template #label>
            <span class="tab-label">
              <span>限流</span>
              <IconifyIconOnline icon="ri:speed-up-line" />
            </span>
          </template>
          <div class="fc-section">
            <h4 class="fc-section-title">
              <IconifyIconOnline icon="ri:settings-3-line" />
              默认限流
            </h4>
            <div class="fc-grid">
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
            <h4 class="fc-section-title fc-section-title--sub">
              <IconifyIconOnline icon="ri:speed-up-line" />
              路径限流
            </h4>
            <div class="fc-rule-list thin-scrollbar">
              <div v-for="(row, idx) in config.pathRateLimits" :key="`rate-${idx}`" class="fc-rule-row">
                <ScInput v-model="row.path" placeholder="/api/login" />
                <ScInputNumber v-model="row.qps" :min="1" :max="100000" />
                <ScButton type="danger" circle @click="config.pathRateLimits.splice(idx, 1)">
                  <IconifyIconOnline icon="ri:delete-bin-line" />
                </ScButton>
              </div>
            </div>
            <ScButton type="primary" @click="config.pathRateLimits.push({ path: '', qps: 100 })">
              <IconifyIconOnline icon="ri:add-line" /> 新增限流规则
            </ScButton>
          </div>
        </ScTabPane>

        <ScTabPane name="forward">
          <template #label>
            <span class="tab-label">
              <span>转发</span>
              <IconifyIconOnline icon="ri:route-line" />
            </span>
          </template>
          <div class="fc-section">
            <h4 class="fc-section-title">
              <IconifyIconOnline icon="ri:git-branch-line" />
              转发模式
            </h4>
            <div class="fc-grid">
              <ScFormItem label="转发模式">
                <ScSelect v-model="config.forwardMode">
                  <ScOption label="写入属性" value="ATTRIBUTE" />
                  <ScOption label="直接重定向" value="REDIRECT" />
                </ScSelect>
              </ScFormItem>
            </div>
            <h4 class="fc-section-title fc-section-title--sub">
              <IconifyIconOnline icon="ri:route-line" />
              重定向规则
            </h4>
            <div class="fc-rule-list thin-scrollbar">
              <div v-for="(row, idx) in config.redirectMappings" :key="`redirect-${idx}`" class="fc-rule-row">
                <ScInput v-model="row.path" placeholder="/old-path" />
                <ScInput v-model="row.target" placeholder="https://example.com/new-path" />
                <ScButton type="danger" circle @click="config.redirectMappings.splice(idx, 1)">
                  <IconifyIconOnline icon="ri:delete-bin-line" />
                </ScButton>
              </div>
            </div>
            <ScButton type="primary" @click="config.redirectMappings.push({ path: '', target: '' })">
              <IconifyIconOnline icon="ri:add-line" /> 新增重定向规则
            </ScButton>
            <h4 class="fc-section-title fc-section-title--sub">
              <IconifyIconOnline icon="ri:git-merge-line" />
              透传代理规则
            </h4>
            <div class="fc-rule-list thin-scrollbar">
              <div v-for="(row, idx) in config.proxyPassMappings" :key="`proxy-${idx}`" class="fc-rule-row">
                <ScInput v-model="row.path" placeholder="/service-a" />
                <ScInput v-model="row.target" placeholder="http://upstream-host:8080" />
                <ScButton type="danger" circle @click="config.proxyPassMappings.splice(idx, 1)">
                  <IconifyIconOnline icon="ri:delete-bin-line" />
                </ScButton>
              </div>
            </div>
            <ScButton type="primary" @click="config.proxyPassMappings.push({ path: '', target: '' })">
              <IconifyIconOnline icon="ri:add-line" /> 新增透传规则
            </ScButton>
          </div>
        </ScTabPane>
      </ScTabs>
    </div>

    <template #footer>
      <div class="fc-footer">
        <ScButton @click="handleClose">取消</ScButton>
        <ScButton type="primary" :loading="loading" @click="handleSave">保存配置</ScButton>
      </div>
    </template>
  </sc-dialog>
</template>

<script setup lang="ts">
import { reactive, ref, watch } from "vue";
import { message } from "@repo/utils";
import { getServletFilterConfig, saveServletFilterConfig } from "@/api/system-server-setting";
import { ScInputNumber } from "@repo/components/ScInputNumber";
import { ScOption } from "@repo/components/ScOption";
import { ScTabPane, ScTabs } from "@repo/components/ScTabs";

interface Props { visible: boolean; serverId: number; filterSettingId: number; initialTab?: "basic" | "access" | "whitelist" | "blacklist" | "ratelimit" | "forward"; }
interface PathRateLimitRow { path: string; qps: number; }
interface MappingRow { path: string; target: string; }

const props = defineProps<Props>();
const emit = defineEmits<{ "update:visible": [boolean]; success: [] }>();

const visibleInner = ref(false);
const loading = ref(false);
const activeTab = ref("basic");
const whitelistInput = ref("");
const blacklistInput = ref("");

const config = reactive({
  enabled: true, storageEnabled: true, storageType: "protocol-firewall-storage", ruleCacheSeconds: 30,
  limiterType: "token", defaultRatePerSecond: 200, rateDimension: "IP_PATH", tempBlacklistSeconds: 60,
  forwardMode: "ATTRIBUTE", whitelistIps: [] as string[], blacklistIps: [] as string[],
  pathRateLimits: [] as PathRateLimitRow[], redirectMappings: [] as MappingRow[], proxyPassMappings: [] as MappingRow[],
  logEnabled: true, metricsEnabled: true,
});

watch(() => props.visible, async (v) => { visibleInner.value = v; if (v) { activeTab.value = props.initialTab === "access" ? "whitelist" : (props.initialTab || "basic"); await loadData(); } }, { immediate: true });
watch(visibleInner, (v) => emit("update:visible", v));

function resetConfig() {
  Object.assign(config, { enabled: true, storageEnabled: true, storageType: "protocol-firewall-storage", ruleCacheSeconds: 30, limiterType: "token", defaultRatePerSecond: 200, rateDimension: "IP_PATH", tempBlacklistSeconds: 60, forwardMode: "ATTRIBUTE", whitelistIps: [], blacklistIps: [], pathRateLimits: [], redirectMappings: [], proxyPassMappings: [], logEnabled: true, metricsEnabled: true });
}

async function loadData() {
  resetConfig();
  try {
    const res = await getServletFilterConfig(props.filterSettingId);
    if (!res.success || !res.data) return;
    const d = res.data as Record<string, unknown>;
    config.enabled = toBoolean(d.enabled, true);
    config.storageEnabled = toBoolean(d.storageEnabled, true);
    config.storageType = toString(d.storageType, "protocol-firewall-storage");
    config.ruleCacheSeconds = toNumber(d.ruleCacheSeconds, 30);
    config.limiterType = toString(d.limiterType, "token");
    config.defaultRatePerSecond = toNumber(d.defaultRatePerSecond, 200);
    config.rateDimension = toString(d.rateDimension, "IP_PATH");
    config.tempBlacklistSeconds = toNumber(d.tempBlacklistSeconds, 60);
    config.forwardMode = toString(d.forwardMode, "ATTRIBUTE");
    config.whitelistIps = toStringArray(d.whitelistIps);
    config.blacklistIps = toStringArray(d.blacklistIps);
    config.pathRateLimits = toRateRows(d.pathRateLimits);
    config.redirectMappings = toMappingRows(d.redirectMappings);
    config.proxyPassMappings = toMappingRows(d.proxyPassMappings);
    config.logEnabled = toBoolean(d.logEnabled, true);
    config.metricsEnabled = toBoolean(d.metricsEnabled, true);
  } catch (error) { console.error("加载防火墙配置失败:", error); }
}

function toString(raw: unknown, fallback: string): string { if (raw == null) return fallback; const t = String(raw).trim(); return t || fallback; }
function toNumber(raw: unknown, fallback: number): number { if (typeof raw === "number" && Number.isFinite(raw)) return raw; const v = Number(raw); return Number.isFinite(v) ? v : fallback; }
function toBoolean(raw: unknown, fallback: boolean): boolean { if (typeof raw === "boolean") return raw; if (typeof raw === "string") { const v = raw.trim().toLowerCase(); if (["true", "1", "yes"].includes(v)) return true; if (["false", "0", "no"].includes(v)) return false; } return fallback; }
function toStringArray(raw: unknown): string[] { if (!raw) return []; if (Array.isArray(raw)) return raw.map(i => String(i ?? "").trim()).filter(i => !!i); if (typeof raw === "string") return raw.split(/[,\n\r]/).map(i => i.trim()).filter(i => !!i); return []; }
function toRateRows(raw: unknown): PathRateLimitRow[] { if (!raw || typeof raw !== "object") return []; return Object.entries(raw as Record<string, unknown>).map(([path, qps]) => ({ path: String(path ?? "").trim(), qps: toNumber(qps, 0) })).filter(r => !!r.path && r.qps > 0); }
function toMappingRows(raw: unknown): MappingRow[] { if (!raw || typeof raw !== "object") return []; return Object.entries(raw as Record<string, unknown>).map(([path, target]) => ({ path: String(path ?? "").trim(), target: String(target ?? "").trim() })).filter(r => !!r.path && !!r.target); }

function addWhitelist() { const v = whitelistInput.value.trim(); if (v && !config.whitelistIps.includes(v)) config.whitelistIps.push(v); whitelistInput.value = ""; }
function removeWhitelist(value: string) { config.whitelistIps = config.whitelistIps.filter(i => i !== value); }
function addBlacklist() { const v = blacklistInput.value.trim(); if (v && !config.blacklistIps.includes(v)) config.blacklistIps.push(v); blacklistInput.value = ""; }
function removeBlacklist(value: string) { config.blacklistIps = config.blacklistIps.filter(i => i !== value); }
function rowsToRateMap(rows: PathRateLimitRow[]): Record<string, number> { return rows.reduce((acc, r) => { const p = r.path.trim(); if (p && r.qps > 0) acc[p] = Number(r.qps); return acc; }, {} as Record<string, number>); }
function rowsToMappingMap(rows: MappingRow[]): Record<string, string> { return rows.reduce((acc, r) => { const p = r.path.trim(); const t = r.target.trim(); if (p && t) acc[p] = t; return acc; }, {} as Record<string, string>); }

async function handleSave() {
  loading.value = true;
  try {
    const payload = { enabled: !!config.enabled, storageEnabled: !!config.storageEnabled, storageType: config.storageType.trim() || "protocol-firewall-storage", ruleCacheSeconds: Number(config.ruleCacheSeconds || 0), limiterType: config.limiterType || "token", defaultRatePerSecond: Number(config.defaultRatePerSecond || 200), rateDimension: config.rateDimension || "IP_PATH", tempBlacklistSeconds: Number(config.tempBlacklistSeconds || 0), forwardMode: config.forwardMode || "ATTRIBUTE", whitelistIps: [...config.whitelistIps], blacklistIps: [...config.blacklistIps], pathRateLimits: rowsToRateMap(config.pathRateLimits), redirectMappings: rowsToMappingMap(config.redirectMappings), proxyPassMappings: rowsToMappingMap(config.proxyPassMappings), logEnabled: !!config.logEnabled, metricsEnabled: !!config.metricsEnabled };
    const res = await saveServletFilterConfig(props.filterSettingId, payload);
    if (res.success) { message("防火墙配置保存成功，已热应用", { type: "success" }); emit("success"); visibleInner.value = false; }
    else { message(res.msg || "保存失败", { type: "error" }); }
  } catch (error) { console.error("保存防火墙配置失败:", error); message("保存失败", { type: "error" }); }
  finally { loading.value = false; }
}

function handleClose() { visibleInner.value = false; }
</script>

<style scoped lang="scss">
@use './filter-config-shared' as *;

.firewall-config-container { max-height: 70vh; overflow-y: auto; padding: 6px; }

.firewall-tabs { border-radius: $fc-radius; overflow: hidden; border: 1px solid $fc-border; box-shadow: $fc-shadow-md; }

.tab-label { display: inline-flex; align-items: center; gap: 6px; font-weight: 600; }

.fc-section {
  @include config-section;
  margin-bottom: 18px;
}

.fc-section-title {
  @include section-title;
  &--sub { margin-top: 16px; }
}

.fc-grid { @include config-grid(2); gap: 12px 16px; }

.fc-list-block { margin-bottom: 14px; }

.fc-list-title { margin-bottom: 8px; font-weight: 600; font-size: 13px; color: $fc-title; }

.fc-tags { @include tag-container; }

.fc-inline-add { @include inline-add; }

.fc-rule-list { @include rule-list; }

.fc-rule-row { @include rule-row; }

.fc-footer { @include action-row; }
</style>
