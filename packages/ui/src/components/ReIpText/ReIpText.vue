<script setup lang="ts">
/**
 * ReIpText —— IP 地址展示组件
 *
 * 显示 IP 地址 + 归属地，支持缓存和三方查询。
 *
 * 用法：
 *   <ReIpText ip="114.114.114.114" address="中国 江苏 南京" />
 *   <ReIpText ip="114.114.114.114" />
 *   <ReIpText ip="114.114.114.114" :third-party-fix="true" />
 *   <ReIpText ip="114.114.114.114" placeholder="未知位置" />
 *   <ReIpText ip="114.114.114.114" address="南京" icon="location" />
 *   <ReIpText ip="114.114.114.114" :clickable="true" />
 */
import {
  ref,
  computed,
  onMounted,
  watch } from "vue";
import { getApiHttp, isCapabilityPathEnabled, IP_LOOKUP_PATH, type ApiResult } from "@repo/core";
import ReDialog from "../ReDialog";

const props = withDefaults(
  defineProps<{
    /** IP 地址 */
    ip: string;
    /** 归属地（优先使用，传入则不查询三方） */
    address?: string;
    /** 地址缺失时是否调用三方接口查询 */
    thirdPartyFix?: boolean;
    /** 地址不存在时的占位文案（不传则不显示地址行） */
    placeholder?: string;
    /** 是否支持点击 IP 查询详情 */
    clickable?: boolean;
    /** 地址图标：location / globe / signal / 空（自动选择） */
    icon?: string;
  }>(),
  {
    thirdPartyFix: false,
    clickable: false,
    icon: "",
  },
);

const resolvedAddress = ref("");
const loading = ref(false);
const dialogVisible = ref(false);
const detailData = ref<Record<string, string>>({});

const CACHE_PREFIX = "re-ip-lookup-";
const CACHE_TTL = 86400000;

const hasAddress = computed(() => !!(resolvedAddress.value || props.address));

/** 判断是否为内网/回环地址 */
function isInternalIp(ip: string): boolean {
  if (!ip) return false;
  const v = ip.toLowerCase();
  if (v === "::1" || v === "0:0:0:0:0:0:0:1" || v === "localhost" || v === "0.0.0.0") return true;
  if (v.startsWith("fc") || v.startsWith("fd") || v.startsWith("fe8") || v.startsWith("fe9") || v.startsWith("fea") || v.startsWith("feb")) return true;
  if (v.startsWith("127.") || v.startsWith("10.") || v.startsWith("192.168.")) return true;
  const m = v.match(/^172\.(\d{1,3})\./);
  if (m && Number(m[1]) >= 16 && Number(m[1]) <= 31) return true;
  return false;
}
const internalIp = computed(() => isInternalIp(props.ip));

const displayAddress = computed(() => {
  if (props.address) return props.address;
  if (internalIp.value) return "本地网络";
  if (resolvedAddress.value) return resolvedAddress.value;
  return props.placeholder || "";
});

const showAddressLine = computed(() => {
  if (displayAddress.value) return true;
  return false;
});

const addressIcon = computed(() => {
  if (props.icon) return props.icon;
  if (!hasAddress.value) return "globe";
  return "location";
});

function readCache(ip: string): string | null {
  try {
    const raw = localStorage.getItem(CACHE_PREFIX + ip);
    if (!raw) return null;
    const data = JSON.parse(raw);
    if (Date.now() - data.timestamp > CACHE_TTL) return null;
    return data.address as string;
  } catch {
    return null;
  }
}

function writeCache(ip: string, address: string) {
  try {
    localStorage.setItem(CACHE_PREFIX + ip, JSON.stringify({ address, timestamp: Date.now() }));
  } catch {
    /* ignore */
  }
}

async function doLookup() {
  if (loading.value || !props.ip) return;
  // 业务能力开关（app.yaml other.capabilities.ipLookup）关闭：不做后台归属地查询，
  // 后端没有该接口时这条 GET 只会稳定换来一次 404
  if (!isCapabilityPathEnabled(IP_LOOKUP_PATH)) return;
  loading.value = true;
  try {
    const res = await getApiHttp()
      .get(IP_LOOKUP_PATH)
      .query({ ip: props.ip })
      .then<ApiResult<{ country?: string; province?: string; city?: string; isp?: string }>>((r) => r.data);
    const data = res?.data;
    if (data) {
      const parts = [data.country, data.province, data.city].filter(Boolean);
      const addr = parts.join(" ") + (data.isp ? ` ${data.isp}` : "");
      if (addr) {
        resolvedAddress.value = addr;
        writeCache(props.ip, addr);
      }
    }
  } catch {
    /* 静默失败 */
  } finally {
    loading.value = false;
  }
}

function resolve() {
  if (props.address) {
    resolvedAddress.value = "";
    return;
  }
  if (isInternalIp(props.ip)) {
    resolvedAddress.value = "";
    return;
  }
  const cached = readCache(props.ip);
  resolvedAddress.value = cached || "";
  if (cached) return;
  if (props.thirdPartyFix) {
    doLookup();
  }
}

function handleClick() {
  if (!props.clickable) return;
  const parts: Record<string, string> = { "IP 地址": props.ip };
  if (displayAddress.value) {
    parts["归属地"] = displayAddress.value;
  }
  if (loading.value) {
    parts["状态"] = "查询中...";
  }
  detailData.value = parts;
  dialogVisible.value = true;
}

watch(() => [props.ip, props.address], resolve);
onMounted(resolve);
</script>

<template>
  <span class="re-ip-text" :class="{ 're-ip-text--clickable': clickable }">
    <span class="re-ip-text__ip" @click="handleClick">
      <slot name="ip" :ip="ip">{{ ip }}</slot>
    </span>
    <span v-if="showAddressLine" class="re-ip-text__address">
      <span v-if="loading" class="re-ip-text__loading">查询中...</span>
      <span v-else class="re-ip-text__addr-text">
        <slot name="address" :address="displayAddress">{{ displayAddress }}</slot>
      </span>
    </span>
  </span>

  <ReDialog v-if="clickable" v-model="dialogVisible" title="IP 详情" width="400px" :close-on-click-modal="true">
    <div class="re-ip-text__detail">
      <div v-for="(val, key) in detailData" :key="key" class="re-ip-text__detail-row">
        <span class="re-ip-text__detail-label">{{ key }}</span>
        <span class="re-ip-text__detail-value">{{ val }}</span>
      </div>
    </div>
  </ReDialog>
</template>

<style scoped>
.re-ip-text {
  display: inline-flex;
  flex-direction: column;
  line-height: 1.4;
  vertical-align: middle;
}

.re-ip-text--clickable {
  cursor: pointer;
}

.re-ip-text__ip {
  font-size: 13px;
  font-weight: 600;
  font-variant-numeric: tabular-nums;
  color: var(--el-text-color-primary);
  transition: color 0.2s;
}

.re-ip-text--clickable .re-ip-text__ip:hover {
  color: var(--el-color-primary);
}

.re-ip-text__address {
  font-size: 11px;
  color: var(--el-text-color-secondary);
  line-height: 1.3;
}

.re-ip-text__loading {
  animation: pulse 1.5s ease-in-out infinite;
}

@keyframes pulse {
  0%, 100% { opacity: 0.5; }
  50% { opacity: 1; }
}

.re-ip-text__detail {
  padding: 8px 0;
}

.re-ip-text__detail-row {
  display: flex;
  justify-content: space-between;
  padding: 6px 0;
  border-bottom: 1px solid var(--el-border-color-extra-light);
  font-size: 13px;
}

.re-ip-text__detail-row:last-child {
  border-bottom: none;
}

.re-ip-text__detail-label {
  color: var(--el-text-color-secondary);
}

.re-ip-text__detail-value {
  color: var(--el-text-color-primary);
  font-weight: 500;
  text-align: right;
}
</style>