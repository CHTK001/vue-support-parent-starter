<template>
  <!--
    自动刷新触发器：纯方块入口 + 无边框档位浮层。

    结构与 ReTable 工具栏里的自动刷新是同一族（ReSwitch layout="popover" + ReSelect
    layout="square" vertical），差别只在轮询由 useAutoRefresh 持有而不是表格。
    这样「表格页」与「中间件管理页」的刷新控件读起来一致，用户不必学两套。
  -->
  <ReSwitch
    v-model="model"
    layout="popover"
    icon="Timer"
    :title="title"
    :popover-width="268"
    :popover-padding="8"
    data-testid="ds-auto-refresh"
  >
    <div class="ds-ar__head">
      <span class="ds-ar__title">自动刷新频率</span>
      <span class="ds-ar__badge" :class="active ? 'is-on' : 'is-off'">{{ active ? "已开启" : "已关闭" }}</span>
    </div>
    <ReSelect v-model="model" layout="square" vertical :data="options" data-testid="ds-auto-refresh-select" />
    <div class="ds-ar__hint">
      <template v-if="active">
        选中即生效，页面按该间隔自动重取数据；<strong class="ds-ar__next">下次刷新 {{ countdown }} 秒后</strong>。切到其他标签页时自动暂停。
      </template>
      <template v-else>选中即生效，页面按该间隔自动重取数据</template>
    </div>
  </ReSwitch>
</template>

<script setup lang="ts">
/**
 * 中间件管理页的自动刷新控件。
 *
 * <p>只负责「选档 + 展示倒计时」，轮询本身在 {@code useAutoRefresh} 里 —— 这样
 * 同一份刷新逻辑可以被页头、页脚、甚至批量操作后的补拍复用，控件只是它的一种表现。</p>
 *
 * <p>为什么单独抽组件而不是每页抄一遍模板：11 个管理页都要这个入口，抄 11 份
 * 必然出现「有的显示倒计时、有的不显示」「有的文案写每 5 秒有的写 5s」。档位文案
 * 与浮层排版都来自 {@code useAutoRefresh} 的同一份定义。</p>
 *
 * @author CH
 * @since 4.0.0.52
 */
import { computed } from "vue";
import ReSwitch from "@repo/ui/re-switch";
import ReSelect from "@repo/ui/re-select";
import { autoRefreshOptions, autoRefreshLabel, type AutoRefreshInterval } from "../../composables/useAutoRefresh";

defineOptions({ name: "DsAutoRefreshSwitch" });

const props = defineProps<{
  /** 距下次刷新的秒数，由 useAutoRefresh 提供；关闭态传 0 即可 */
  countdown?: number;
  /** 可选档位（毫秒），由 useAutoRefresh 的 steps 透传；不传用默认五档 */
  steps?: readonly number[];
}>();

/** 当前档位（毫秒），0 = 关；与 useAutoRefresh 的 interval 双向绑定 */
const model = defineModel<AutoRefreshInterval>({ default: 0 });

const options = computed(() => autoRefreshOptions(props.steps));
const active = computed(() => Number(model.value) > 0);
const title = computed(() => autoRefreshLabel(Number(model.value)));
</script>

<style scoped>
/* 浮层外壳宽度/内距由 ReSwitch 的 popoverWidth(268)/popoverPadding(8) 锚定，
   这里只负责面板内部的排版，不碰外壳。 */
.ds-ar__head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  padding: 2px 4px 8px;
}

.ds-ar__title {
  font-size: 13px;
  font-weight: 600;
  color: var(--text-primary);
}

.ds-ar__badge {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  font-size: 11px;
  font-weight: 500;
  line-height: 1;
  padding: 3px 7px;
  border-radius: 999px;
}

.ds-ar__badge::before {
  content: "";
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: currentColor;
}

.ds-ar__badge.is-on {
  color: var(--brand-success, #22c55e);
  background: color-mix(in srgb, currentColor 12%, transparent);
}

.ds-ar__badge.is-off {
  color: var(--text-tertiary);
  background: color-mix(in srgb, currentColor 10%, transparent);
}

.ds-ar__hint {
  padding: 8px 4px 2px;
  font-size: 11px;
  line-height: 1.6;
  color: var(--text-tertiary);
}

.ds-ar__next {
  font-weight: 600;
  color: var(--brand-primary, #2992ff);
  font-variant-numeric: tabular-nums;
}
</style>
