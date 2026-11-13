<script setup lang="ts">
/**
 * 防火墙过滤器配置面板（firewall / ip 共用）。
 *
 * <p>和其它专用面板一样只做「参数编辑」：真正的名单与限流语义在后端
 * {@code FirewallServerFilter} / {@code IpServerFilter} 里，前端不重复实现判定。</p>
 *
 * <p>布局按「先决定拦谁、再决定多快」排：名单模式与 IP 列表在上，限流在下。</p>
 */
import { computed } from 'vue';
import ReInput from '@repo/ui/re-input';
import ReInputNumber from '@repo/ui/re-input-number';
import ReSelect from '@repo/ui/re-select';
import type { FilterTypeMeta } from '../../api';

const props = defineProps<{
  /** 插件元数据 */
  meta: FilterTypeMeta | null;
  /** 该实例的过滤器类型 */
  filterType: string;
  /** 当前参数（v-model） */
  modelValue: Record<string, string>;
}>();

const emit = defineEmits<{
  (e: 'update:modelValue', value: Record<string, string>): void;
}>();

/** 名单模式选项 */
const MODE_OPTIONS = [
  { label: '黑名单（拒绝列表内 IP）', value: 'blacklist' },
  { label: '白名单（只允许列表内 IP）', value: 'whitelist' },
];

/** 当前是否白名单模式 */
const isWhitelist = computed(() => (props.modelValue.mode || 'blacklist') === 'whitelist');

/** 是否支持限流（ip 类型只管名单） */
const supportsRateLimit = computed(() => props.filterType !== 'ip');

/** IP 条数：给一行「已填 N 个」的即时反馈 */
const ipCount = computed(() =>
  String(props.modelValue.ips || '')
    .split(/[,;\s]+/)
    .filter(Boolean).length,
);

/**
 * 写回单个参数。
 *
 * @param key   参数名
 * @param value 参数值
 */
function patch(key: string, value: string): void {
  emit('update:modelValue', { ...props.modelValue, [key]: value });
}
</script>

<template>
  <div class="fwp">
    <section class="fwp-card">
      <header class="fwp-head">
        <span class="fwp-title">名单模式</span>
        <span class="fwp-hint">
          {{ isWhitelist ? '只有列表内的 IP 能访问' : '列表内的 IP 会被拒绝' }}
        </span>
      </header>
      <ReSelect
        :model-value="props.modelValue.mode || 'blacklist'"
        :data="MODE_OPTIONS"
        style="width: 100%"
        @update:model-value="(v: any) => patch('mode', String(v))"
      />
    </section>

    <section class="fwp-card">
      <header class="fwp-head">
        <span class="fwp-title">IP 列表</span>
        <span class="fwp-hint">已填 {{ ipCount }} 个 · 逗号或换行分隔</span>
      </header>
      <ReInput
        :model-value="props.modelValue.ips || ''"
        type="textarea"
        :rows="4"
        placeholder="10.0.0.1, 10.0.0.2&#10;192.168.1.0/24 不支持网段，请写具体 IP"
        @update:model-value="(v: any) => patch('ips', String(v))"
      />
    </section>

    <section v-if="supportsRateLimit" class="fwp-card">
      <header class="fwp-head">
        <span class="fwp-title">限流</span>
        <span class="fwp-hint">按客户端 IP 令牌桶；0 表示不限</span>
      </header>
      <div class="fwp-row">
        <label>
          <span>每秒请求数</span>
          <ReInputNumber
            :model-value="Number(props.modelValue.qps || 0)"
            :min="0"
            :step="1"
            style="width: 100%"
            @update:model-value="(v: any) => patch('qps', String(v ?? 0))"
          />
        </label>
        <label>
          <span>突发容量</span>
          <ReInputNumber
            :model-value="Number(props.modelValue.burst || 0)"
            :min="0"
            :step="1"
            style="width: 100%"
            @update:model-value="(v: any) => patch('burst', String(v ?? 0))"
          />
        </label>
      </div>
      <p class="fwp-note">
        命中名单返回 403；超过配额返回 429。tcp-proxy 没有状态码，直接断开连接。
      </p>
    </section>
  </div>
</template>

<style scoped lang="scss">
.fwp {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.fwp-card {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 12px 14px;
  background: var(--el-bg-color);
  border: 1px solid var(--el-border-color-lighter);
  border-radius: var(--el-radius-lg, 12px);
}

.fwp-head {
  display: flex;
  gap: 8px;
  align-items: baseline;
  flex-wrap: wrap;
}

.fwp-title {
  font-size: 12px;
  font-weight: 600;
  color: var(--el-text-color-primary);
}

.fwp-hint {
  font-size: 11px;
  color: var(--el-text-color-secondary);
}

.fwp-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}

.fwp-row label {
  display: flex;
  flex-direction: column;
  gap: 4px;
  font-size: 11px;
  color: var(--el-text-color-secondary);
}

.fwp-note {
  margin: 0;
  font-size: 11px;
  line-height: 1.6;
  color: var(--el-text-color-placeholder);
}
</style>
