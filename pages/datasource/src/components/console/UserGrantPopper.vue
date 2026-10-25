<template>
  <div class="ugp">
    <div class="ugp__head">
      <span class="ugp__name dus-mono">{{ row.name }}@{{ row.host }}</span>
      <ReTag v-if="row.isSuper" effect="plain" type="danger" size="small">SUPER</ReTag>
    </div>

    <template v-if="grants && grants.length">
      <div class="ugp__label">权限（SHOW GRANTS）</div>
      <div class="ugp__grants">
        <div v-for="(g, i) in grants" :key="i" class="ugp__grant dus-mono">{{ g }}</div>
      </div>
    </template>
    <div v-else class="ugp__empty">
      <span v-if="grants === undefined">加载中…</span>
      <span v-else>无权限记录（USAGE 仅表示可登录）</span>
    </div>

    <div class="ugp__limits">
      <span v-if="grantCount > 0" class="ugp__chip" :title="setText">
        已授予 {{ grantCount }} 项权限
      </span>
      <span class="ugp__chip">查询 {{ fmt(row.maxQuestionsPerHour) }}/时</span>
      <span class="ugp__chip">更新 {{ fmt(row.maxUpdatesPerHour) }}/时</span>
      <span class="ugp__chip">连接 {{ fmt(row.maxConnectionsPerHour) }}/时</span>
      <span class="ugp__chip">并发 {{ fmt(row.maxUserConnections) }}</span>
    </div>
  </div>
</template>

<script setup lang="ts">
/**
 * 用户 popover 详情（DbUserManagePanel 的「用户名」格 hover 展示）。
 *
 * <p>展示选中账号的 SHOW GRANTS 原文 + 已授予权限集摘要 + 资源限制。
 * 数据来自 DbUserManagePanel 预取的 {@code grantTexts / grantSets} 缓存，
 * 组件本身不做请求 —— hover 出现即所见，无额外网络往返。</p>
 */
import { computed } from "vue";
import ReTag from "@repo/ui/re-tag";
import type { DbUserRow } from "../../api/manageConsoles";

const props = defineProps<{
  row: DbUserRow & { account?: string };
  /** SHOW GRANTS 原文列表；undefined = 加载中 */
  grants?: string[];
  /** 已授予的权限名集合 */
  set?: Set<string>;
}>();

const grantCount = computed(() => props.set?.size ?? 0);
const setText = computed(() => (props.set ? [...props.set].join(", ") : ""));

function fmt(v: number | null | undefined): string {
  if (v == null || v === -1 || v === 0) {
    return "∞";
  }
  return String(v);
}
</script>

<style scoped lang="scss">
.ugp {
  display: flex;
  flex-direction: column;
  gap: 6px;
  max-width: 440px;
}
.ugp__head {
  display: flex;
  align-items: center;
  gap: 8px;
  .ugp__name {
    font-size: 14px;
    font-weight: 700;
    color: var(--el-text-color-primary);
  }
}
.ugp__label {
  font-size: 11.5px;
  color: var(--el-text-color-secondary);
  margin-top: 2px;
}
.ugp__grants {
  display: flex;
  flex-direction: column;
  gap: 3px;
  max-height: 150px;
  overflow-y: auto;
}
.ugp__grant {
  font-size: 11.5px;
  color: var(--el-text-color-regular);
  background: var(--el-fill-color-light);
  border-radius: 4px;
  padding: 3px 8px;
  line-height: 16px;
  word-break: break-all;
  white-space: pre-wrap;
}
.ugp__empty {
  font-size: 12.5px;
  color: var(--el-text-color-placeholder);
  padding: 4px 0;
}
.ugp__limits {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-top: 4px;
  border-top: 1px dashed var(--el-border-color-lighter);
  padding-top: 6px;
}
.ugp__chip {
  font-size: 11.5px;
  color: var(--el-text-color-regular);
  background: var(--el-fill-color);
  border-radius: 4px;
  padding: 2px 7px;
  line-height: 16px;
}
.dus-mono {
  font-family: var(--el-font-family-mono, ui-monospace, SFMono-Regular, Consolas, monospace);
  font-variant-numeric: tabular-nums;
}
</style>