<script setup lang="ts">
/**
 * 命中次数单元格
 *
 * <p>五个页签的「命中次数」列都是同一段：显示次数、点开明细、无障碍名带上策略标识。
 * 参数完全同构，抽成组件后每处从 10 行降到 1 行，也不会出现某一处漏改文案。</p>
 *
 * <p>计数与打开明细走 {@link usePolicyHitContext}，所以调用方不需要自己 inject。</p>
 *
 * <p>只渲染<b>裸数字</b>，不再前缀「命中」：列头已经写了「命中次数」，
 * 再加一遍是重复。抽取只搬运行为，不顺手改可见文案。</p>
 */
import { useI18n } from "vue-i18n";
import { computed } from "vue";
import ReButton from "@repo/ui/re-button";
import type { PolicyHitType } from "../../../../api/types";
import { usePolicyHitContext } from "../composables/policyHitContext";

const { t } = useI18n();
const { hitCountOf, openHitDetail } = usePolicyHitContext();

const props = defineProps<{
  /** 命中类型：后端 {@code PolicyHitType} */
  type: PolicyHitType;
  /**
   * 策略键：与后端复合键的右半段一致
   *
   * <p><b>不能叫 {@code key}</b>：{@code key} 是 Vue 保留属性，父组件写
   * {@code :key="..."} 会被当作 vnode key 吞掉，prop 恒为 undefined。</p>
   */
  hitKey: string;
  /** 弹窗标题与无障碍名里显示的策略名 */
  label: string;
  /**
   * 展示用的命中数，缺省按 {@code hitKey} 查
   *
   * <p>消息头规则一行含多个 pattern，命中数是<b>各 pattern 之和</b>，
   * 与打开明细用的单键不重合，所以显示值要由调用方算好传进来。</p>
   */
  count?: number;
  /**
   * 是否给数字加「命中」前缀，缺省不加
   *
   * <p>表格列头已经写了「命中次数」，裸数字即可；卡片视图没有列头，
   * 靠前缀表达单位，所以那两处要显式打开。</p>
   */
  withUnit?: boolean;
  /**
   * 悬浮提示，缺省不显示
   *
   * <p>卡片视图原来除了无障碍名还带一条 tooltip，与弹窗标题用词不同，
   * 所以由调用方传入而不是组件内部拼。</p>
   */
  tip?: string;
}>();

/** 展示值：调用方指定优先，否则按键查 */
const shown = computed(() => props.count ?? hitCountOf(props.type, props.hitKey));
</script>

<template>
  <ReButton
    layout="text"
    type="primary"
    class="policy-hit-cell"
    :aria-label="t('policy.common.hitDetailOf', { name: props.label })"
    :tip="props.tip"
    @click="openHitDetail(props.type, props.hitKey, props.label)"
  >
    {{ withUnit ? t("policy.common.hitOf", { name: shown }) : shown }}
  </ReButton>
</template>

<style scoped>
/* 表格里的命中次数做成可点文本：0 也可点（点开才知道是「没生效过」还是没数据）。
   规则原先写在 PolicyTask.vue 的 scoped 块里，组件拆出来之后父级的 scoped 选择器
   一条都匹配不上（子组件模板里的元素带的是子组件自己的 scope id），
   所以样式必须跟着组件走。 */
.policy-hit-cell {
  font-variant-numeric: tabular-nums;
  font-weight: 600;
}
</style>
