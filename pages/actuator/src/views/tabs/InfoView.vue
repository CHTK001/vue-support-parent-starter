<!--
  应用信息（`/actuator/info`）

  Actuator 的 info 结构是「顶层若干键，值可能是对象」，因此不做分组：直接按顶层键
  铺成键值行，值是对象就压成 JSON —— 与弹窗时的展示口径完全一致。
-->
<template>
  <TabShell
    :searchable="false"
    :count-text="`共 ${rows.length} 项`"
    :loading="loading"
    :error="error"
    @refresh="reload"
  >
    <div v-if="rows.length" class="act-kv">
      <div v-for="row in rows" :key="row.k" class="act-kv__row">
        <span class="act-kv__k">{{ row.k }}</span>
        <span class="act-kv__v">{{ row.v }}</span>
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

const { data, loading, error, reload, entries } = useActuatorPanel("info");

const rows = computed(() => entries(data.value));
</script>
