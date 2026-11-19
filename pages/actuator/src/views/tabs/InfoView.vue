<!--
  应用信息（`/actuator/info`）

  Actuator 的 info 结构是「顶层若干键，值可能是对象」，因此不做真分组：直接按顶层键
  铺成键值行，值是对象就压成 JSON。

  外壳与环境属性页保持一致（同一张 `.act-sec` 卡 + 两列 grid）：两页都是「信息的来源
  → 一堆键值」，只是 info 只有一个来源，所以卡头不可折叠。
-->
<template>
  <TabShell
    :searchable="false"
    :count-text="`共 ${rows.length} 项`"
    :loading="loading"
    :error="error"
    :error-kind="errorKind"
    auto-refresh
    :updated-at="updatedAt"
    @refresh="reload"
  >
    <div v-if="rows.length" class="act-sec">
      <div class="act-sec__head is-static">
        <span class="act-sec__name">应用信息</span>
        <span class="act-sec__count">{{ rows.length }}</span>
      </div>
      <div class="act-kv act-kv--grid">
        <div v-for="row in rows" :key="row.k" class="act-kv__row">
          <span class="act-kv__k">{{ row.k }}</span>
          <span class="act-kv__v">{{ row.v }}</span>
        </div>
      </div>
    </div>
    <ElEmpty v-else description="应用未暴露 info 信息" :image-size="48" />
  </TabShell>
</template>

<script setup lang="ts" name="ActuatorInfoView">
/**
 * 应用信息页签。
 *
 * <p>没有搜索框：info 的条目通常只有个位数（git / build / 自定义属性），
 * 过滤框的存在感会大于它的用处。</p>
 */
import { computed } from "vue";
import { ElEmpty } from "element-plus";
import TabShell from "../TabShell.vue";
import { useActuatorPanel } from "../useActuatorPanel";

const { data, loading, error, errorKind, updatedAt, reload, entries } = useActuatorPanel("info");

const rows = computed(() => entries(data.value));
</script>
