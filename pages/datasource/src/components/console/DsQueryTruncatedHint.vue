<template>
  <!--
    查询结果截断提示：服务端返回 truncated 时摊开「只拿到了多少 / 一共有多少 / 怎么收窄」。

    原来这行在 ES / Kafka / Mongo / InfluxDB / Neo4j 五个查询控制台里各写一份，
    文案还各不相同（「请收窄条件」/「请加 limit」/「请加 .limit(n)」/「请加 LIMIT」），
    用户在不同中间件之间切换时读到的是五套说法。这里统一成一处，按库给出对应的
    收窄手法，其余文案完全一致。
  -->
  <span v-if="visible" class="ds-trunc" data-testid="ds-truncated-hint">
    <ReIcon name="WarningFilled" :size="13" class="ds-trunc__icon" />
    <span>
      已截断：本次只返回 {{ shown }} 行{{ total !== undefined && total > 0 ? `，服务端共 ${total} 行` : "" }}。{{ tipText }}
    </span>
  </span>
</template>

<script setup lang="ts">
/**
 * 查询结果截断提示。
 *
 * <p><b>为什么要单独抽出来</b>：{@code truncated} 这个标记一直只存在于 API 层，
 * UI 侧靠各页手写一行 {@code <span>}。结果是同一个事实在五个页面有五种说法，
 * 而且没有任何一页把「只拿到多少行」说清楚——用户看到「已截断」却不知道
 * 屏幕上这 500 行到底是不是全部。</p>
 *
 * @author CH
 * @since 4.0.0.52
 */
import { computed } from "vue";
import ReIcon from "@repo/ui/re-icon";

/** 各库的收窄手法；键是调用方传的 {@code dialect} */
const DIALECT_TIPS: Record<string, string> = {
  sql: "请加 WHERE 收窄范围，或用 LIMIT 限制行数。",
  influx: "请加 limit 或收窄时间窗。",
  mongo: "请加 .limit(n) 或收窄查询条件。",
  cypher: "请在语句末尾加 LIMIT 收窄结果。",
  es: "请收窄查询条件或调小 size。",
  kafka: "请缩小分区范围或加 limit。",
};

const props = defineProps<{
  /** 后端是否标记为截断 */
  truncated?: boolean;
  /** 本次实际返回的行数 */
  shown?: number;
  /** 服务端总行数；未知时不传，文案里就不出现「共 N 行」 */
  total?: number;
  /**
   * 查询方言，决定收窄建议。
   *
   * <p>给错不会出错，只会退回一句通用的「请收窄查询条件」——
   * 与其猜错让用户去试一个不存在的语法，不如说笼统但正确的话。</p>
   */
  dialect?: "sql" | "influx" | "mongo" | "cypher" | "es" | "kafka";
}>();

const visible = computed(() => props.truncated === true);
const shown = computed(() => props.shown ?? 0);
const tipText = computed(() => (props.dialect ? DIALECT_TIPS[props.dialect] : "请收窄查询条件。"));
</script>

<style scoped>
.ds-trunc {
  display: inline-flex;
  align-items: flex-start;
  gap: 5px;
  margin-left: 8px;
  color: var(--status-warning, var(--el-color-warning, #e6a23c));
  line-height: 1.5;
}

.ds-trunc__icon {
  flex-shrink: 0;
  margin-top: 2px;
}
</style>
