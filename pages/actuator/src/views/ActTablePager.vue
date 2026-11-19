<!--
  表格底部分页条。

  6 个海量行页签共用同一条分页：Actuator 端点不分页，页签自己切片（见
  `useActuatorTable.ts`）。把「每页条数候选、文案、对齐」收在一处，避免
  loggers 是 20/50/100、beans 是 50/100/200 这种无意义的差异。
-->
<template>
  <div class="act__pager">
    <ElPagination
      v-model:current-page="page"
      v-model:page-size="pageSize"
      :page-sizes="[50, 100, 200, 500]"
      :total="total"
      layout="total, sizes, prev, pager, next"
      background
      small
    />
  </div>
</template>

<script setup lang="ts" name="ActuatorTablePager">
import { ElPagination } from "element-plus";

withDefaults(
  defineProps<{
    /** 过滤后的总条数 */
    total: number;
  }>(),
  { total: 0 },
);

/** 当前页（与页签里的 pager 双向绑定） */
const page = defineModel<number>("page", { default: 1 });
/** 每页条数（与页签里的 pager 双向绑定） */
const pageSize = defineModel<number>("pageSize", { default: 50 });
</script>
