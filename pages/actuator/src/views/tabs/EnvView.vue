<!--
  环境属性（`/actuator/env`）

  按 propertySource 分组：排障时要回答的是「这个值从哪个源来」（启动参数覆盖 yml、
  yml 覆盖默认值），把不同来源混成一列就丢掉了最关键的信息。
-->
<template>
  <TabShell
    v-model="keyword"
    placeholder="过滤属性名 / 值…"
    :count-text="`共 ${total} 项`"
    :loading="loading"
    :error="error"
    @refresh="reload"
  >
    <div v-for="source in sources" :key="source.name" class="act-group">
      <div class="act-group__title">
        {{ source.name }}
        <span class="act-group__count">{{ source.props.length }}</span>
      </div>
      <div class="act-kv">
        <div v-for="prop in source.props" :key="prop.k" class="act-kv__row">
          <span class="act-kv__k">{{ prop.k }}</span>
          <span class="act-kv__v">{{ prop.v }}</span>
        </div>
      </div>
    </div>
    <ElEmpty v-if="!sources.length" description="无匹配属性" :image-size="48" />
  </TabShell>
</template>

<script setup lang="ts" name="ActuatorEnvView">
/**
 * 环境属性页签。
 *
 * <p>关键字同时匹配键与值：查「哪个源里配了 redis」时，键名和值都可能出现这个词。</p>
 */
import { computed } from "vue";
import { ElEmpty } from "element-plus";
import TabShell from "../TabShell.vue";
import { useActuatorPanel } from "../useActuatorPanel";

const { data, loading, error, keyword, reload, hit } = useActuatorPanel("env");

interface PropertySource {
  name: string;
  properties?: Record<string, { value?: unknown }>;
}

const sources = computed(() => {
  const list = (data.value?.propertySources as PropertySource[] | undefined) ?? [];
  return list
    .map((source) => ({
      name: String(source?.name ?? "-"),
      props: Object.entries(source?.properties ?? {})
        .map(([k, v]) => ({ k, v: String(v?.value ?? "") }))
        .filter((prop) => hit(prop.k, prop.v)),
    }))
    .filter((source) => source.props.length > 0);
});

/** 过滤后的属性总数（不是源数：用户关心「还剩多少条属性」） */
const total = computed(() => sources.value.reduce((sum, source) => sum + source.props.length, 0));
</script>
