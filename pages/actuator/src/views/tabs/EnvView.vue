<!--
  环境属性（`/actuator/env`）

  按 propertySource 分区折叠：排障时要回答的是「这个值从哪个源来」（启动参数覆盖 yml、
  yml 覆盖默认值），把不同来源混成一列就丢掉了最关键的信息。

  每个源是一张可折叠的卡，卡内两列 grid；默认只展开第一个源（通常是最该看的那个），
  输入关键词时全部强制展开并高亮命中片段 —— 搜索时再让人逐个点开就等于没搜。
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
    <div v-for="source in sources" :key="source.name" class="act-sec">
      <button
        type="button"
        class="act-sec__head"
        :aria-expanded="isOpen(source.name)"
        @click="toggle(source.name)"
      >
        <span class="act-sec__chev" :class="{ 'is-open': isOpen(source.name) }">▶</span>
        <span class="act-sec__name">{{ source.name }}</span>
        <span class="act-sec__count">{{ source.props.length }}</span>
      </button>
      <div v-show="isOpen(source.name)" class="act-kv act-kv--grid">
        <div v-for="prop in source.props" :key="prop.k" class="act-kv__row">
          <span class="act-kv__k">
            <template v-for="(seg, i) in segments(prop.k)" :key="i">
              <mark v-if="seg.hit" class="act-mark">{{ seg.text }}</mark>
              <template v-else>{{ seg.text }}</template>
            </template>
          </span>
          <span class="act-kv__v">
            <template v-for="(seg, i) in segments(prop.v)" :key="i">
              <mark v-if="seg.hit" class="act-mark">{{ seg.text }}</mark>
              <template v-else>{{ seg.text }}</template>
            </template>
          </span>
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
import { computed, ref, watch } from "vue";
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

/* ---------- 折叠状态 ---------- */

/** 手工展开过的源（首次加载时默认展开第一个，见下方 watch） */
const expanded = ref<Record<string, boolean>>({});
const initialised = ref(false);

watch(
  sources,
  (list) => {
    if (initialised.value || !list.length) return;
    expanded.value = { [String(list[0].name)]: true };
    initialised.value = true;
  },
  { immediate: true },
);

/**
 * 是否展开。
 *
 * <p>有关键词时一律展开：命中项本来就被过滤到很少，再收起来等于把结果藏掉。</p>
 */
function isOpen(name: string): boolean {
  return !!keyword.value.trim() || expanded.value[name] === true;
}

function toggle(name: string): void {
  expanded.value = { ...expanded.value, [name]: !expanded.value[name] };
}

/* ---------- 命中高亮 ---------- */

interface Segment {
  text: string;
  hit: boolean;
}

/**
 * 把文本按关键词切成「命中 / 未命中」片段。
 *
 * <p>只做展示层高亮，不影响 {@code hit()} 的过滤口径 —— 过滤判定仍由 composable
 * 统一负责，避免两处规则各写一遍后出现「高亮有、行没了」。</p>
 */
function segments(text: string): Segment[] {
  const needle = keyword.value.trim().toLowerCase();
  if (!needle) return [{ text, hit: false }];
  const lower = text.toLowerCase();
  const out: Segment[] = [];
  let from = 0;
  let index = lower.indexOf(needle);
  if (index < 0) return [{ text, hit: false }];
  while (index >= 0) {
    if (index > from) out.push({ text: text.slice(from, index), hit: false });
    out.push({ text: text.slice(index, index + needle.length), hit: true });
    from = index + needle.length;
    index = lower.indexOf(needle, from);
  }
  if (from < text.length) out.push({ text: text.slice(from), hit: false });
  return out;
}
</script>
