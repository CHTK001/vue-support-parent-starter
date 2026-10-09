<template>
  <div class="ngs">
    <div class="ngs-bar">
      <ReInput
        :model-value="keyword"
        style="width: 240px"
        placeholder="按域名 / 路径 / 后端搜索"
        @update:model-value="onKeyword"
      />
      <ReSelect :model-value="scheme" style="width: 130px" @change="onScheme">
        <ReOption value="all" label="全部协议" />
        <ReOption value="http" label="仅 HTTP" />
        <ReOption value="https" label="仅 HTTPS" />
      </ReSelect>
      <ReSwitch :model-value="onlyWarned" @change="onOnlyWarned" />
      <span class="ngs-label">只看有提示的</span>
      <span class="ngs-count">
        共 {{ sites.length }} 个站点<template v-if="filtered.length !== sites.length">，当前显示 {{ filtered.length }} 个</template>
      </span>
      <ReButton layout="square" icon="Refresh" tip="刷新" data-testid="ngs-btn-refresh" :loading="loading" @click="load" />
    </div>

    <ReAlert
      v-if="warnedCount"
      type="warning"
      :title="`${warnedCount} 个站点存在需要留意的问题，已在卡片上标出`"
    />

    <div class="ngs-body">
      <!-- 首次加载用骨架屏占位。骨架按真实 .ngs-card 的层级做（标题行 + 事实行），
           数据到达时列表不位移。
           每处 ReSkeleton 都必须显式写 loading：ReSkeleton 把该 prop 默认值设成 false，
           而 el-skeleton 的语义是 loading=true 才显示骨架，少写就是「元素在、但空白」。 -->
      <div v-if="loading && !loaded" class="ngs-skel" aria-busy="true" aria-label="站点加载中">
        <div v-for="i in 3" :key="i" class="ngs-skel-card">
          <ReSkeleton loading animated :rows="1" class="ngs-skel-head" />
          <ReSkeleton loading animated :rows="4" />
        </div>
      </div>
      <template v-else>
      <ReEmpty
        v-if="!filtered.length"
        :description="sites.length ? '没有符合筛选条件的站点' : '没有找到任何 server 块。配置可能还没写，或放在了本工具没扫描到的路径下。'"
      ></ReEmpty>
      <div v-for="s in filtered" :key="`${s.file}#${s.nodePath}`" class="ngs-card" :class="{ 'has-warn': s.warnings.length }">
        <div class="ngx-card-head">
          <div class="ngx-card-title" :title="s.displayName">
            <ReIcon :name="s.https ? 'Lock' : 'Link'" :size="14" />
            {{ s.displayName }}
          </div>
          <div class="ngs-tags">
            <ReTag v-for="p in s.listenPorts" :key="p" type="info">:{{ p }}</ReTag>
            <ReTag v-if="s.https" type="success">HTTPS</ReTag>
            <ReTag v-if="s.defaultServer" type="warning">兜底</ReTag>
            <ReTag v-if="s.hasCertificate" type="success">证书已配</ReTag>
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
              <ReTag v-if="isUpstream(s, t)" type="primary">upstream</ReTag>
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
          <ReButton layout="square" icon="Edit" tip="编辑这个站点" data-testid="ngs-btn-edit" @click="emit('edit', s)" />
          <ReButton layout="square" icon="CopyDocument" tip="复制访问地址" data-testid="ngs-btn-copy" @click="copyUrl(s)" />
        </div>
      </div>
      <!-- /v-else：首屏骨架屏 -->
      </template>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from "vue";
import { ElMessage } from "element-plus";
import ReButton from "@repo/ui/re-button";
import ReEmpty from "@repo/ui/re-empty";
import ReIcon from "@repo/ui/re-icon";
import ReInput from "@repo/ui/re-input";
import ReSelect from "@repo/ui/re-select";
import ReSkeleton from "@repo/ui/re-skeleton";
import ReSwitch from "@repo/ui/re-switch";
import ReTag from "@repo/ui/re-tag";
import { ReAlert, ReOption } from "@repo/ui/re-kit";
import { fetchNginxSites, type NginxSite } from "../../api/nginx/api";

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

/**
 * 首屏是否已渲染过真实内容。
 *
 * <p>骨架屏只在首次出现：之后刷新不再退回骨架，否则每次重新拉站点清单
 * 都会整页闪一下。</p>
 */
const loaded = ref(false);
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
    // 成功失败都算首屏结束：失败时要显示「读取失败」而不是永远停在骨架上
    loaded.value = true;
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
  color: var(--text-secondary);
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
  gap: 6px;
  align-content: start;
}

/* ============ 首屏骨架屏 ============ */
/* 与真实 .ngs-card 同一套盒模型（flex 列 + 同样的 padding/圆角/边框），
   数据到达时列表不发生位移。 */
.ngs-skel {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.ngs-skel-card {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 14px 16px;
  border: 1px solid var(--border-subtle);
  border-radius: 8px;
  background: var(--bg-container);
}

.ngs-skel-head {
  margin-bottom: 2px;
}

/* el-skeleton 自带的 item 背景在本主题下过淡，覆盖动画两色才看得见。
   覆盖变量而不是 background-image，是为了保住 shimmer 动画。 */
.ngs-skel :deep(.el-skeleton) {
  --el-skeleton-animation-bg-color: var(--bg-fill);
  --el-skeleton-animation-to-color: var(--bg-hover);
}

.ngs-skel :deep(.el-skeleton__item) {
  border-radius: 6px;
}

.ngs-card {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 14px 16px;
  border: 1px solid var(--border-subtle);
  border-radius: 8px;
  background: var(--bg-container);
  transition: border-color 0.15s ease;

  &.has-warn {
    border-color: color-mix(in srgb, var(--status-warning) 40%, var(--border-subtle));
  }

  &:hover {
    border-color: var(--brand-400);
  }
}

/* 卡片头：与总览面板同名同款，保证跨面板一致 */
.ngx-card-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  flex-wrap: wrap;
}

.ngx-card-title {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 14px;
  font-weight: 600;
  color: var(--text-primary);
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
  font-variant-numeric: tabular-nums;
}

.ngs-fact {
  display: flex;
  gap: 8px;
  font-size: 12px;
  line-height: 1.6;

  dt {
    flex: none;
    width: 60px;
    color: var(--text-secondary);
  }

  dd {
    margin: 0;
    min-width: 0;
    color: var(--text-secondary);
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
  border-radius: 6px;
  background: color-mix(in srgb, var(--status-warning) 8%, transparent);
  font-size: 12px;
  line-height: 1.7;
  color: var(--text-secondary);

  li::marker {
    color: var(--status-warning);
  }
}

.ngs-ops {
  display: flex;
  gap: 8px;
  margin-top: auto;
}

.ngs-ops :deep(.rs-btn) {
  margin: 0;
}
</style>
