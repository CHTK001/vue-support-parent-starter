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
      <div class="config-section">
        <h4 class="section-title">
          <IconifyIconOnline icon="ri:shield-line" />
          基础配置
        </h4>
        <div class="config-grid">
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
          <ScFormItem label="限流器类型">
            <ScSelect v-model="config.limiterType">
              <ScOption label="令牌桶" value="token" />
              <ScOption label="滑动窗口" value="sliding" />
              <ScOption label="Guava" value="guava" />
            </ScSelect>
          </ScFormItem>
          <ScFormItem label="默认QPS">
            <ScInputNumber
              v-model="config.defaultRatePerSecond"
              :min="1"
              :max="100000"
            />
          </ScFormItem>
          <ScFormItem label="限流维度">
            <ScSelect v-model="config.rateDimension">
              <ScOption label="IP" value="IP" />
              <ScOption label="IP + PATH" value="IP_PATH" />
              <ScOption label="全局" value="GLOBAL" />
            </ScSelect>
          </ScFormItem>
          <ScFormItem label="临时黑名单秒数">
            <ScInputNumber
              v-model="config.tempBlacklistSeconds"
              :min="0"
              :max="86400"
            />
          </ScFormItem>
          <ScFormItem label="转发模式">
            <ScSelect v-model="config.forwardMode">
              <ScOption label="写入属性" value="ATTRIBUTE" />
              <ScOption label="直接重定向" value="REDIRECT" />
            </ScSelect>
          </ScFormItem>
          <ScFormItem label="记录事件">
            <ScSwitch v-model="config.logEnabled" />
          </ScFormItem>
          <ScFormItem label="统计指标">
            <ScSwitch v-model="config.metricsEnabled" />
          </ScFormItem>
        </div>
      </div>

      <div class="config-section">
        <h4 class="section-title">
          <IconifyIconOnline icon="ri:user-settings-line" />
          黑白名单
        </h4>
        <div class="list-block">
          <div class="list-title">白名单 IP/CIDR</div>
          <div class="tags">
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

        <div class="list-block">
          <div class="list-title">黑名单 IP/CIDR</div>
          <div class="tags">
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

      <div class="config-section">
        <h4 class="section-title">
          <IconifyIconOnline icon="ri:speed-up-line" />
          路径限流
        </h4>
        <div class="rule-list thin-scrollbar">
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

      <div class="config-section">
        <h4 class="section-title">
          <IconifyIconOnline icon="ri:route-line" />
          重定向规则
        </h4>
        <div class="rule-list thin-scrollbar">
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
      </div>

      <div class="config-section">
        <h4 class="section-title">
          <IconifyIconOnline icon="ri:git-merge-line" />
          透传代理规则
        </h4>
        <div class="rule-list thin-scrollbar">
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
    </div>

    <template #footer>
      <div class="dialog-footer">
        <ScButton @click="handleClose">取消</ScButton>
        <ScButton type="primary" :loading="loading" @click="handleSave">
          保存配置
        </ScButton>
      </div>
    </template>
  </sc-dialog>
</template>

<script setup lang="ts">
import { reactive, ref, watch } from "vue";
import { message } from "@repo/utils";
import {
  getServletFilterConfig,
  saveServletFilterConfig,
} from "@/api/system-server-setting";

interface Props {
  visible: boolean;
  serverId: number;
  filterSettingId: number;
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
const emit = defineEmits<{
  "update:visible": [boolean];
  success: [];
}>();

const visibleInner = ref(false);
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

watch(
  () => props.visible,
  async (v) => {
    visibleInner.value = v;
    if (v) {
      await loadData();
    }
  },
  { immediate: true },
);

watch(visibleInner, (v) => emit("update:visible", v));

function resetConfig() {
  Object.assign(config, {
    enabled: true,
    storageEnabled: true,
    storageType: "protocol-firewall-storage",
    ruleCacheSeconds: 30,
    limiterType: "token",
    defaultRatePerSecond: 200,
    rateDimension: "IP_PATH",
    tempBlacklistSeconds: 60,
    forwardMode: "ATTRIBUTE",
    whitelistIps: [],
    blacklistIps: [],
    pathRateLimits: [],
    redirectMappings: [],
    proxyPassMappings: [],
    logEnabled: true,
    metricsEnabled: true,
  });
}

async function loadData() {
  resetConfig();
  try {
    const res = await getServletFilterConfig(props.filterSettingId);
    if (!res.success || !res.data) {
      return;
    }
    const data = res.data as Record<string, unknown>;
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
  } catch (error) {
    console.error("加载防火墙配置失败:", error);
  }
}

function toString(raw: unknown, fallback: string): string {
  if (raw == null) {
    return fallback;
  }
  const text = String(raw).trim();
  return text || fallback;
}

function toNumber(raw: unknown, fallback: number): number {
  if (typeof raw === "number" && Number.isFinite(raw)) {
    return raw;
  }
  const value = Number(raw);
  return Number.isFinite(value) ? value : fallback;
}

function toBoolean(raw: unknown, fallback: boolean): boolean {
  if (typeof raw === "boolean") {
    return raw;
  }
  if (typeof raw === "string") {
    const value = raw.trim().toLowerCase();
    if (["true", "1", "yes"].includes(value)) {
      return true;
    }
    if (["false", "0", "no"].includes(value)) {
      return false;
    }
  }
  return fallback;
}

function toStringArray(raw: unknown): string[] {
  if (!raw) {
    return [];
  }
  if (Array.isArray(raw)) {
    return raw
      .map((item) => String(item ?? "").trim())
      .filter((item) => !!item);
  }
  if (typeof raw === "string") {
    return raw
      .split(/[,\n\r]/)
      .map((item) => item.trim())
      .filter((item) => !!item);
  }
  return [];
}

function toRateRows(raw: unknown): PathRateLimitRow[] {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) {
    return [];
  }
  return Object.entries(raw as Record<string, unknown>)
    .map(([path, qps]) => ({
      path: String(path ?? "").trim(),
      qps: toNumber(qps, 0),
    }))
    .filter((row) => !!row.path && row.qps > 0);
}

function toMappingRows(raw: unknown): MappingRow[] {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) {
    return [];
  }
  return Object.entries(raw as Record<string, unknown>)
    .map(([path, target]) => ({
      path: String(path ?? "").trim(),
      target: String(target ?? "").trim(),
    }))
    .filter((row) => !!row.path && !!row.target);
}

function addWhitelist() {
  const value = whitelistInput.value.trim();
  if (!value) {
    return;
  }
  if (!config.whitelistIps.includes(value)) {
    config.whitelistIps.push(value);
  }
  whitelistInput.value = "";
}

function removeWhitelist(value: string) {
  config.whitelistIps = config.whitelistIps.filter((item) => item !== value);
}

function addBlacklist() {
  const value = blacklistInput.value.trim();
  if (!value) {
    return;
  }
  if (!config.blacklistIps.includes(value)) {
    config.blacklistIps.push(value);
  }
  blacklistInput.value = "";
}

function removeBlacklist(value: string) {
  config.blacklistIps = config.blacklistIps.filter((item) => item !== value);
}

function rowsToRateMap(rows: PathRateLimitRow[]): Record<string, number> {
  return rows.reduce(
    (acc, row) => {
      const path = row.path.trim();
      if (path && row.qps > 0) {
        acc[path] = Number(row.qps);
      }
      return acc;
    },
    {} as Record<string, number>,
  );
}

function rowsToMappingMap(rows: MappingRow[]): Record<string, string> {
  return rows.reduce(
    (acc, row) => {
      const path = row.path.trim();
      const target = row.target.trim();
      if (path && target) {
        acc[path] = target;
      }
      return acc;
    },
    {} as Record<string, string>,
  );
}

async function handleSave() {
  loading.value = true;
  try {
    const payload = {
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
    };

    const res = await saveServletFilterConfig(props.filterSettingId, payload);
    if (res.success) {
      message("防火墙配置保存成功，已热应用", { type: "success" });
      emit("success");
      visibleInner.value = false;
    } else {
      message(res.msg || "保存失败", { type: "error" });
    }
  } catch (error) {
    console.error("保存防火墙配置失败:", error);
    message("保存失败", { type: "error" });
  } finally {
    loading.value = false;
  }
}

function handleClose() {
  visibleInner.value = false;
}
</script>

<style scoped lang="scss">
.firewall-config-container {
  max-height: 70vh;
  overflow-y: auto;
  padding: 4px;
}

.config-section {
  margin-bottom: 18px;
  padding: 18px;
  border-radius: 10px;
  background: #f8fafc;
  border: 1px solid #e5e7eb;
}

.section-title {
  display: flex;
  align-items: center;
  gap: 8px;
  margin: 0 0 14px;
  font-size: 14px;
}

.config-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px 16px;
}

.list-block {
  margin-bottom: 14px;
}

.list-title {
  margin-bottom: 8px;
  font-weight: 600;
  font-size: 13px;
}

.tags {
  min-height: 34px;
  padding: 8px;
  border: 1px dashed #d1d5db;
  border-radius: 8px;
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-bottom: 10px;
  background: #fff;
}

.inline-add {
  display: flex;
  gap: 8px;
}

.rule-list {
  max-height: 180px;
  overflow-y: auto;
  margin-bottom: 10px;
}

.rule-row {
  display: grid;
  grid-template-columns: 1fr 1fr auto;
  gap: 8px;
  margin-bottom: 8px;
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}
</style>

