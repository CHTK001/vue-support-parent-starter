<script setup lang="ts">
/**
 * 命中明细弹窗 —— 谁在打（客户端 IP 排行）、什么时候打（分钟趋势）
 *
 * <p>五个页签（限流 / IP 名单 / 账号名单 / 消息头 / 接口管控）的「命中次数」都点到这里，
 * 所以做成组件而不是各页签各写一份。状态由 {@link usePolicyHitContext} 注入，
 * 本组件只负责呈现，不再自己发请求。</p>
 */
import { useI18n } from "vue-i18n";
import ReButton from "@repo/ui/re-button";
import ReDialog from "@repo/ui/re-dialog";
import ReEChart from "../../../components/ReEChart.vue";
import { usePolicyHitContext } from "../composables/policyHitContext";

const { t } = useI18n();

const {
  hitDialogVisible,
  hitLoading,
  hitTitle,
  hitDetail,
  hitTrendText,
  hitTopOption,
  hitTrendOption,
} = usePolicyHitContext();
</script>

<template>
  <ReDialog
    v-model="hitDialogVisible"
    :title="t('policy.hit.title', { name: hitTitle })"
    width="860px"
    :close-on-click-modal="false"
    destroy-on-close
    layout="modern"
  >
    <div v-loading="hitLoading" class="policy-hit">
      <template v-if="hitDetail">
        <div class="policy-hit__summary">
          <div class="policy-hit__stat">
            <b>{{ hitDetail.total }}</b>
            <span>{{ t("policy.hit.total") }}</span>
          </div>
          <div class="policy-hit__stat">
            <b>{{ hitDetail.topIps.length }}</b>
            <span>{{ t("policy.hit.ipCount") }}</span>
          </div>
          <div class="policy-hit__stat">
            <b>{{ hitDetail.lastTime ? new Date(hitDetail.lastTime).toLocaleString() : "-" }}</b>
            <span>{{ t("policy.hit.last") }}</span>
          </div>
        </div>

        <i18n-t
          v-if="hitDetail.total === 0"
          keypath="policy.hit.empty"
          tag="p"
          class="policy-hit__empty"
        >
          <template #effective><b>{{ t("policy.hit.termEffective") }}</b></template>
        </i18n-t>

        <template v-else>
          <div class="policy-hit__charts">
            <div class="policy-hit__chart">
              <h4>{{ t("policy.hit.topIps") }}</h4>
              <ReEChart :option="hitTopOption" height="260px" />
            </div>
            <div class="policy-hit__chart">
              <h4>{{ t("policy.hit.trend") }}</h4>
              <ReEChart v-if="hitTrendText" :option="hitTrendOption" height="260px" />
              <p v-else class="policy-hit__empty">
                {{ t("policy.hit.trendEmpty") }}
              </p>
            </div>
          </div>

          <h4 class="policy-hit__sub">{{ t("policy.hit.detailTitle") }}</h4>
          <el-table :data="hitDetail.topIps" max-height="300" border>
            <el-table-column prop="ip" :label="t('policy.hit.colIp')" min-width="200" />
            <el-table-column prop="count" :label="t('policy.hit.colCount')" width="120" align="right" sortable />
          </el-table>
        </template>
      </template>
    </div>
    <template #footer>
      <ReButton @click="hitDialogVisible = false">{{ t("policy.common.close") }}</ReButton>
    </template>
  </ReDialog>
</template>

<style scoped>
/* 命中明细弹窗的版式。原先写在 PolicyTask.vue 的 scoped 块里，组件拆出来之后就失效了：
   scoped 样式只对本组件模板渲染的元素生效，父组件的规则匹配不到子组件内部。
   这里的类名全部由本组件模板自己渲染，所以放本组件的 scoped 块即可，不必进共享表。 */

.policy-hit {
  min-height: 120px;
}

.policy-hit__summary {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 10px;
  margin-bottom: 14px;
}

.policy-hit__stat {
  display: flex;
  flex-direction: column;
  gap: 2px;
  padding: 10px 12px;
  border: 1px solid var(--el-border-color-lighter);
  border-radius: var(--el-radius-md, 8px);
  background: var(--el-fill-color-blank);
}

.policy-hit__stat b {
  font-size: 18px;
  font-weight: 700;
  color: var(--el-text-color-primary);
  /* 时间戳比数字长得多，不加会撑破卡片 */
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: 14px;
}

.policy-hit__stat span {
  font-size: 12px;
  color: var(--el-text-color-secondary);
}

.policy-hit__charts {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
  margin-bottom: 16px;
}

.policy-hit__chart {
  min-width: 0;
  border: 1px solid var(--el-border-color-lighter);
  border-radius: var(--el-radius-md, 8px);
  padding: 8px 10px 4px;
}

.policy-hit__chart h4 {
  margin: 0 0 4px;
  font-size: 13px;
  font-weight: 600;
  color: var(--el-text-color-primary);
}

.policy-hit__sub {
  margin: 0 0 8px;
  font-size: 13px;
  font-weight: 600;
  color: var(--el-text-color-primary);
}

.policy-hit__empty {
  margin: 0;
  padding: 16px;
  border: 1px dashed var(--el-border-color-lighter);
  border-radius: var(--el-radius-md, 8px);
  font-size: 13px;
  line-height: 1.7;
  color: var(--el-text-color-secondary);
}

@media (width <= 900px) {
  .policy-hit__charts { grid-template-columns: minmax(0, 1fr); }
}
</style>
