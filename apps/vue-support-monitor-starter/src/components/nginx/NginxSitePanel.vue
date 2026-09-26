<template>
  <div class="ngs">
    <div class="ngs-bar">
      <ReInput
        :model-value="keyword"
        size="small"
        style="width: 240px"
        placeholder="按域名 / 路径 / 后端搜索"
        @update:model-value="onKeyword"
      />
      <ReSelect :model-value="scheme" size="small" style="width: 130px" @change="onScheme">
        <ReOption value="all" label="全部协议" />
        <ReOption value="http" label="仅 HTTP" />
        <ReOption value="https" label="仅 HTTPS" />
      </ReSelect>
      <ReSwitch :model-value="onlyWarned" size="small" @change="onOnlyWarned" />
      <span class="ngs-label">只看有提示的</span>
      <span class="ngs-count">
        共 {{ sites.length }} 个站点<template v-if="filtered.length !== sites.length">，当前显示 {{ filtered.length }} 个</template>
      </span>
      <ReButton size="small" :loading="loading" @click="load">
        <template #icon><ReIcon name="Refresh" :size="13" /></template>
        刷新
      </ReButton>
    </div>

    <ReAlert
      v-if="warnedCount"
      type="warning"
      :title="`${warnedCount} 个站点存在需要留意的问题，已在卡片上标出`"
    />

    <div class="ngs-body" v-loading="loading">
      <ReEmptyState
        v-if="!filtered.length && !loading"
        :description="sites.length ? '没有符合筛选条件的站点' : '没有找到任何 server 块。配置可能还没写，或放在了本工具没扫描到的路径下。'"
      />
      <div v-for="s in filtered" :key="`${s.file}#${s.nodePath}`" class="ngs-card" :class="{ 'has-warn': s.warnings.length }">
        <div class="ngs-card-head">
          <div class="ngs-name" :title="s.displayName">
            <ReIcon :name="s.https ? 'Lock' : 'Link'" :size="14" />
            {{ s.displayName }}
          </div>
          <div class="ngs-tags">
            <ReTag v-for="p in s.listenPorts" :key="p" size="small" type="info">:{{ p }}</ReTag>
            <ReTag v-if="s.https" size="small" type="success">HTTPS</ReTag>
            <ReTag v-if="s.defaultServer" size="small" type="warning">兜底</ReTag>
            <ReTag v-if="s.hasCertificate" size="small" type="success">证书已配</ReTag>
          </div>
        </div>

        <dl class="ngs-facts">
          <div v-if="s.rootDir" class="ngs-fact">
            <dt>静态目录</dt>
            <dd class="mono">{{ s.rootDir }}</dd>
          </div>
          <div v-for="t in s.proxyTargets" :key="t" class="ngs-fact">
            <dt>转发到</dt>
            <dd class="mono">
              {{ t }}
              <ReTag v-if="isUpstream(s, t)" size="small" type="primary">upstream</ReTag>
            </dd>
          </div>
          <div class="ngs-fact">
            <dt>路径规则</dt>
            <dd>{{ s.locationCount }} 条 location</dd>
          </div>
          <div class="ngs-fact">
            <dt>所在文件</dt>
            <dd class="mono ngx-break">{{ shortPath(s.file) }}</dd>
          </div>
        </dl>

        <ul v-if="s.warnings.length" class="ngs-warns">
          <li v-for="(w, i) in s.warnings" :key="i">{{ w }}</li>
        </ul>

        <div class="ngs-ops">
          <ReButton size="small" @click="emit('edit', s)">
            <template #icon><ReIcon name="Edit" :size="13" /></template>
            编辑这个站点
          </ReButton>
          <ReButton size="small" text @click="copyUrl(s)">
            <template #icon><ReIcon name="CopyDocument" :size="13" /></template>
            复制访问地址
          </ReButton>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from "vue";
import { ElMessage } from "element-plus";
import { fetchNginxSites, type NginxSite } from "../../nginx/api";

const props = defineProps<{
  /** 数据源 ID */
  datasourceId?: number;
}>();

const emit = defineEmits<{
  /** 请求跳到配置页签并定位到该站点 */
  (e: "edit", site: NginxSite): void;
}>();

const sites = ref<NginxSite[]>([]);
const loading = ref(false);
const keyword = ref("");
const scheme = ref("all");
const onlyWarned = ref(false);

const warnedCount = computed(() => sites.value.filter(s => s.warnings.length > 0).length);

const filtered = computed(() => {
  const k = keyword.value.trim().toLowerCase();
  return sites.value.filter(s => {
    if (scheme.value === "http" && s.https) {
      return false;
    }
    if (scheme.value === "https" && !s.https) {
      return false;
    }
    if (onlyWarned.value && !s.warnings.length) {
      return false;
    }
    if (!k) {
      return true;
    }
    const hay = [
      s.displayName,
      ...s.serverNames,
      s.rootDir || "",
      ...s.proxyTargets,
      ...s.upstreamRefs,
      s.file,
    ]
      .join(" ")
      .toLowerCase();
    return hay.includes(k);
  });
});

/**
 * 判断一个 proxy_pass 目标是否引用了 upstream。
 *
 * <p>后端已把纯名字目标（不含点号与端口）归入 {@code upstreamRefs}，
 * 这里只做匹配，不在前端重复实现同一套解析规则。</p>
 *
 * @param site   站点
 * @param target proxy_pass 目标
 * @returns 是否为 upstream 引用
 */
function isUpstream(site: NginxSite, target: string): boolean {
  if (!site.upstreamRefs.length) {
    return false;
  }
  const host = target.replace(/^https?:\/\//, "").split(/[/:;]/)[0] || "";
  return site.upstreamRefs.includes(host);
}

function onKeyword(val: unknown) {
  keyword.value = val === null || val === undefined ? "" : String(val);
}

function onScheme(val: string | number) {
  scheme.value = String(val);
}

function onOnlyWarned(val: unknown) {
  onlyWarned.value = Boolean(val);
}

async function load() {
  if (!props.datasourceId) {
    sites.value = [];
    return;
  }
  loading.value = true;
  try {
    sites.value = (await fetchNginxSites(props.datasourceId)) || [];
  } catch (e) {
    sites.value = [];
    ElMessage.error(`读取站点清单失败：${(e as Error).message}`);
  } finally {
    loading.value = false;
  }
}

function shortPath(p: string): string {
  return p;
}

function copyUrl(s: NginxSite) {
  const schemeName = s.https ? "https" : "http";
  const port = s.listenPorts[0];
  const host = s.serverNames[0] || s.displayName;
  if (!host) {
    ElMessage.warning("该站点没有 server_name，无法拼出访问地址");
    return;
  }
  const omitPort = (schemeName === "http" && port === 80) || (schemeName === "https" && port === 443);
  const url = `${schemeName}://${host}${omitPort || !port ? "" : `:${port}`}`;
  navigator.clipboard
    ?.writeText(url)
    .then(() => ElMessage.success(`已复制 ${url}`))
    .catch(() => ElMessage.warning(`复制失败，请手动复制：${url}`));
}

watch(() => props.datasourceId, load, { immediate: true });

defineExpose({ load, sites });
</script>

<style scoped lang="scss">
.ngs {
  display: flex;
  flex-direction: column;
  gap: 10px;
  height: 100%;
  min-height: 0;
}

.ngs-bar {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.ngs-label,
.ngs-count {
  font-size: 12px;
  color: var(--el-text-color-secondary);
}

.ngs-count {
  margin-left: auto;
  font-variant-numeric: tabular-nums;
}

.ngs-body {
  flex: 1;
  min-height: 0;
  overflow: auto;
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(340px, 1fr));
  gap: 10px;
  align-content: start;
}

.ngs-card {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 12px 14px;
  border: 1px solid var(--el-border-color-lighter);
  border-radius: var(--el-border-radius-lg, 12px);
  background: var(--el-bg-color);

  &.has-warn {
    border-color: color-mix(in srgb, var(--el-color-warning) 40%, var(--el-border-color-lighter));
  }

  &:hover {
    border-color: var(--el-color-primary-light-5);
  }
}

.ngs-card-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  flex-wrap: wrap;
}

.ngs-name {
  display: flex;
  align-items: center;
  gap: 5px;
  font-size: 14px;
  font-weight: 600;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  min-width: 0;
}

.ngs-tags {
  display: flex;
  gap: 4px;
  flex-wrap: wrap;
}

.ngs-facts {
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 3px;
}

.ngs-fact {
  display: flex;
  gap: 8px;
  font-size: 12px;
  line-height: 1.6;

  dt {
    flex: none;
    width: 60px;
    color: var(--el-text-color-secondary);
  }

  dd {
    margin: 0;
    min-width: 0;
    color: var(--el-text-color-regular);
    display: flex;
    align-items: center;
    gap: 6px;
  }
}

.ngx-break {
  word-break: break-all;
}

.ngs-warns {
  margin: 0;
  padding: 8px 10px 8px 24px;
  border-radius: var(--el-border-radius-base, 6px);
  background: color-mix(in srgb, var(--el-color-warning) 8%, transparent);
  font-size: 11.5px;
  line-height: 1.7;
  color: var(--el-text-color-regular);

  li::marker {
    color: var(--el-color-warning);
  }
}

.ngs-ops {
  display: flex;
  gap: 8px;
  margin-top: auto;
}
</style>
