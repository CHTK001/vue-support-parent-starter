<template>
  <!-- 嵌入模式：iframe 不受跨域限制，但拿不到数据做加工 -->
  <div v-if="kind === 'iframe'" class="mc-custom mc-custom--frame">
    <iframe
      v-if="url"
      :src="url"
      class="mc-custom__frame"
      title="自定义卡片内容"
      referrerpolicy="no-referrer"
      loading="lazy"
    />
    <div v-else class="mc-custom__empty">
      <p>还没有配置要嵌入的页面地址。</p>
      <button class="mc-custom__btn" @click="emit('open-settings')">去设置</button>
    </div>
  </div>

  <!-- 取数模式 -->
  <CardBody v-else :state="displayState" :error="displayError" :snippet="snippet" @retry="res.reload()">
    <div class="mc-custom">
      <!-- 单值 -->
      <div v-if="render === 'value'" class="mc-custom__value-wrap">
        <span class="mc-custom__value">{{ primaryValue }}</span>
        <span v-if="unitText" class="mc-custom__unit">{{ unitText }}</span>
        <span class="mc-custom__path">{{ pathLabel }}</span>
      </div>

      <!-- 键值 -->
      <CardList v-else-if="render === 'kv'" :rows="kvRows" empty="响应为空" />

      <!-- 表格 -->
      <div v-else-if="render === 'table'" class="mc-custom__table-wrap">
        <table v-if="table.rows.length" class="mc-custom__table">
          <thead>
            <tr>
              <th v-for="c in table.columns" :key="c">{{ c }}</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(row, i) in table.rows" :key="i">
              <td v-for="c in table.columns" :key="c">{{ row[c] }}</td>
            </tr>
          </tbody>
        </table>
        <div v-else class="mc-custom__empty-inline">响应不是数组，切到「JSON」看看结构</div>
      </div>

      <!-- JSON -->
      <pre v-else class="mc-custom__json">{{ jsonText }}</pre>

      <p class="mc-custom__foot">{{ pathLabel }} · 更新于 {{ clock }}</p>
    </div>
  </CardBody>
</template>

<script setup lang="ts" name="CustomDataCard">
/**
 * 自定义卡片 —— 用户自己定义数据源与展示方式的卡片
 *
 * <p>首页的「自定义页面」组件用 iframe 嵌任意页面；这里把同样的自由度
 * 用在监控数据上：选一个 Actuator 端点（或任意 URL），选一种展示方式
 * （键值 / 表格 / 单值 / JSON），设一个刷新间隔即可 —— 不用等我们排期加卡片。</p>
 *
 * <p>三种数据源各有取舍，卡片里也如实体现：</p>
 * <ul>
 *   <li>{@code actuator} —— 走系统 API 代理，同源带登录态，能读 {@code /actuator/**} 原始 JSON；</li>
 *   <li>{@code url} —— 直连绝对地址，能取别的服务的指标端点，但对方必须允许跨域；</li>
 *   <li>{@code iframe} —— 直接嵌页面，不受跨域限制，但拿不到数据做加工（没有「单值」等模式）。</li>
 * </ul>
 */
import { computed, watch } from "vue";
import CardBody from "../CardBody.vue";
import CardList from "../parts/CardList.vue";
import { formatClock, flattenKv, pickByPath, toRows, useCardResource } from "../useCardResource";
import { humanBytes } from "../useMetricRows";
import type { MonitorCardItem } from "../types";

const props = defineProps<{ card: MonitorCardItem; refreshKey?: number }>();

const emit = defineEmits<{ (e: "open-settings"): void }>();

const kind = computed(() => props.card.config?.kind ?? "actuator");
const url = computed(() => (props.card.config?.path ?? "").trim());
const render = computed(() => props.card.config?.render ?? "kv");
const unit = computed(() => props.card.config?.unit ?? "");
const limit = computed(() => props.card.config?.limit ?? 30);

const res = useCardResource(
  () => ({ kind: kind.value === "url" ? "url" : "actuator", path: url.value }),
  () => props.card.config?.intervalSec ?? 30,
);

watch(
  () => props.refreshKey,
  () => void res.reload(),
);

/** 没配数据源时不发请求（useCardResource 会把它判成「未配置」） */
const displayState = computed(() => res.state.value);
const displayError = computed(() => {
  if (res.state.value === "unavailable" && !url.value) {
    return "这张自定义卡片还没有配置数据源。";
  }
  return res.error.value;
});

const snippet = computed(() => {
  if (kind.value === "iframe") return "";
  return kind.value === "url"
    ? "// 绝对 URL 需要对方允许跨域（Access-Control-Allow-Origin）"
    : "// Actuator 端点需先暴露：\nmanagement.endpoints.web.exposure.include=health,info,metrics,prometheus";
});

/** 键值行 */
const kvRows = computed(() => flattenKv(res.data.value).slice(0, limit.value));

/** 表格 */
const table = computed(() => {
  const t = toRows(res.data.value);
  return { columns: t.columns, rows: t.rows.slice(0, limit.value) };
});

/** 单值文本 */
const primaryValue = computed(() => {
  const v = pickByPath(res.data.value, props.card.config?.valuePath);
  if (v == null) return "—";
  if (typeof v === "number") {
    // 单位填 bytes 时按人类单位换算（否则 402653184 这种裸字节数没人读得懂）
    if (isByteUnit.value) return humanBytes(v);
    return Number.isInteger(v) ? String(v) : v.toFixed(3);
  }
  if (typeof v === "object") return JSON.stringify(v);
  return String(v);
});

/** 单位是不是「字节」（换算后单位已含在数值里，不再重复显示） */
const isByteUnit = computed(() => /^(bytes?|b)$/i.test(unit.value.trim()));

/** 单值的单位展示（字节已并入数值） */
const unitText = computed(() => (isByteUnit.value ? "" : unit.value));

/** JSON 文本（限制长度，避免一张卡片塞进几 MB 文本把页面卡死） */
const jsonText = computed(() => {
  try {
    const text = JSON.stringify(res.data.value, null, 2) ?? "";
    return text.length > 20000 ? `${text.slice(0, 20000)}\n…（已截断）` : text;
  } catch {
    return String(res.data.value);
  }
});

const pathLabel = computed(() => {
  if (!url.value) return "未配置数据源";
  return kind.value === "url" ? url.value : `/actuator/${url.value}`;
});

const clock = computed(() => formatClock(res.updatedAt.value));
</script>

<style lang="scss" scoped>
.mc-custom {
  display: flex;
  flex-direction: column;
  gap: 8px;
  height: 100%;
  min-height: 0;
}

.mc-custom--frame {
  height: 100%;
  min-height: 0;
}

.mc-custom__frame {
  width: 100%;
  height: 100%;
  border: 0;
  border-radius: 8px;
  background: var(--el-fill-color-lighter);
}

.mc-custom__value-wrap {
  display: flex;
  align-items: baseline;
  gap: 8px;
  flex-wrap: wrap;
  padding: 8px 2px;
}

.mc-custom__value {
  font-size: 26px;
  font-weight: 700;
  line-height: 1.2;
  color: var(--el-text-color-primary);
  font-variant-numeric: tabular-nums;
  word-break: break-all;
}

.mc-custom__unit {
  font-size: 12px;
  color: var(--el-text-color-secondary);
}

.mc-custom__path {
  margin-left: auto;
  font-size: 10.5px;
  color: var(--el-text-color-placeholder);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.mc-custom__table-wrap {
  flex: 1;
  min-height: 0;
  overflow: auto;
}

.mc-custom__table {
  width: 100%;
  border-collapse: collapse;
  font-size: 11.5px;

  th,
  td {
    padding: 5px 8px;
    text-align: left;
    border-bottom: 1px solid var(--el-border-color-lighter);
    white-space: nowrap;
    max-width: 240px;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  th {
    position: sticky;
    top: 0;
    background: var(--el-bg-color);
    color: var(--el-text-color-secondary);
    font-weight: 600;
  }

  td {
    color: var(--el-text-color-regular);
  }
}

.mc-custom__json {
  flex: 1;
  min-height: 0;
  margin: 0;
  padding: 8px 10px;
  border-radius: 8px;
  background: var(--el-fill-color-light);
  overflow: auto;
  font-family: var(--el-font-family-mono, ui-monospace, Menlo, monospace);
  font-size: 11px;
  line-height: 1.6;
  color: var(--el-text-color-regular);
  white-space: pre-wrap;
  word-break: break-all;
}

.mc-custom__empty,
.mc-custom__empty-inline {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
  height: 100%;
  color: var(--el-text-color-secondary);
  font-size: 12px;
  text-align: center;

  p {
    margin: 0;
  }
}

.mc-custom__empty-inline {
  height: auto;
  padding: 16px;
}

.mc-custom__btn {
  height: 26px;
  padding: 0 12px;
  border-radius: 7px;
  border: 1px solid var(--el-border-color);
  background: var(--el-bg-color);
  color: var(--el-text-color-regular);
  font-size: 12px;
  cursor: pointer;
}

.mc-custom__btn:hover {
  color: var(--el-color-primary);
  border-color: var(--el-color-primary-light-7);
  background: var(--el-color-primary-light-9);
}

.mc-custom__foot {
  margin: auto 0 0;
  font-size: 10.5px;
  color: var(--el-text-color-placeholder);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
</style>
