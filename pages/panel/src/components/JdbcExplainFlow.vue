<template>
  <section class="explain-flow">
    <div v-if="!rows.length" class="explain-flow__placeholder">
      <strong>暂无执行计划</strong>
      <span>点击解释按钮后，这里会按流程展示 EXPLAIN 链路。</span>
    </div>

    <div v-else class="explain-flow__list">
      <article
        v-for="(row, index) in rows"
        :key="`${row.id ?? index}-${row.table ?? 'step'}`"
        class="explain-step"
      >
        <div class="explain-step__order">{{ index + 1 }}</div>
        <div class="explain-step__body">
          <header class="explain-step__head">
            <strong>{{ row.table || row.select_type || "RESULT" }}</strong>
            <div class="explain-step__chips">
              <ScTag class="toolbar-chip" effect="plain" size="small">
                {{ row.type || "scan" }}
              </ScTag>
              <ScTag class="toolbar-chip" effect="plain" size="small">
                rows {{ row.rows ?? "-" }}
              </ScTag>
            </div>
          </header>

          <p>{{ buildSummary(row) }}</p>

          <div class="explain-step__meta">
            <span>select_type {{ row.select_type || "-" }}</span>
            <span>key {{ row.key || "-" }}</span>
            <span>possible {{ row.possible_keys || "-" }}</span>
          </div>
        </div>
      </article>
    </div>
  </section>
</template>

<script setup lang="ts">
import ScTag from "@repo/components/ScTag/src/index.vue";

defineProps<{
  rows: Record<string, any>[];
}>();

const buildSummary = (row: Record<string, any>) => {
  const extras = [row.Extra, row.extra].filter(Boolean).join(" / ");
  if (extras) {
    return extras;
  }
  if (row.ref) {
    return `ref ${row.ref}`;
  }
  return "当前节点没有返回额外执行说明。";
};
</script>

<style scoped lang="scss">
.explain-flow {
  display: grid;
  gap: 10px;
}

.explain-flow__placeholder {
  display: grid;
  gap: 4px;
  padding: 12px;
  border: 1px dashed rgba(123, 138, 149, 0.18);
  border-radius: 12px;
  color: #728797;
}

.explain-flow__list {
  display: grid;
  gap: 10px;
}

.explain-step {
  position: relative;
  display: grid;
  grid-template-columns: 36px minmax(0, 1fr);
  gap: 10px;
}

.explain-step:not(:last-child)::after {
  position: absolute;
  top: 36px;
  left: 17px;
  bottom: -10px;
  width: 2px;
  border-radius: 999px;
  background: linear-gradient(180deg, rgba(59, 130, 246, 0.36), rgba(59, 130, 246, 0.06));
  content: "";
}

.explain-step__order {
  position: relative;
  z-index: 1;
  display: grid;
  place-items: center;
  width: 36px;
  height: 36px;
  border-radius: 999px;
  background: linear-gradient(180deg, #1f6feb, #174fa6);
  color: #fff;
  font-size: 13px;
  font-weight: 700;
}

.explain-step__body {
  display: grid;
  gap: 8px;
  padding: 12px;
  border: 1px solid rgba(123, 138, 149, 0.14);
  border-radius: 14px;
  background: rgba(255, 255, 255, 0.96);
}

.explain-step__head {
  display: flex;
  justify-content: space-between;
  gap: 10px;
  align-items: center;
}

.explain-step__head strong {
  color: #112736;
  font-size: 14px;
}

.explain-step__chips,
.explain-step__meta {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.explain-step__body p {
  margin: 0;
  color: #536b7b;
  font-size: 12px;
  line-height: 1.6;
}

.explain-step__meta span {
  color: #728797;
  font-size: 11px;
}
</style>
