<template>
  <section class="soft-workspace">
    <div v-if="metrics.length" class="soft-workspace__metrics">
      <article
        v-for="metric in metrics"
        :key="metric.label"
        class="soft-workspace__metric"
      >
        <strong>{{ metric.value }}</strong>
        <span>{{ metric.label }}</span>
        <small v-if="metric.hint">{{ metric.hint }}</small>
      </article>
    </div>
    <section class="soft-workspace__panel">
      <div v-if="$slots.actions" class="soft-workspace__panel-toolbar">
        <slot name="actions" />
      </div>
      <slot />
    </section>
  </section>
</template>

<script setup lang="ts">
withDefaults(
  defineProps<{
    title: string;
    subtitle?: string;
    metrics?: Array<{
      label: string;
      value: string | number;
      hint?: string;
    }>;
  }>(),
  {
    metrics: () => [],
  },
);
</script>

<style scoped lang="scss">
.soft-workspace {
  --soft-border: rgba(15, 23, 42, 0.08);
  --soft-card: rgba(255, 255, 255, 0.9);
  display: grid;
  gap: 10px;
  width: 100%;
  max-width: 100%;
  min-width: 0;
}

.soft-workspace__panel-toolbar {
  display: flex;
  justify-content: flex-end;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
  margin-bottom: 12px;
}

.soft-workspace__metrics {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(132px, max-content));
  gap: 10px;
}

.soft-workspace__metric {
  display: grid;
  gap: 2px;
  padding: 12px 14px;
  border: 1px solid var(--soft-border);
  border-radius: 16px;
  background:
    linear-gradient(180deg, rgba(255, 255, 255, 0.94), rgba(248, 250, 252, 0.86)),
    var(--soft-card);
  box-shadow: 0 10px 20px rgba(15, 23, 42, 0.05);
}

.soft-workspace__metric strong {
  color: #0f172a;
  font-size: 20px;
  line-height: 1;
}

.soft-workspace__metric span {
  color: #475569;
  font-size: 12px;
}

.soft-workspace__metric small {
  color: #64748b;
  min-height: 16px;
  font-size: 11px;
}

.soft-workspace__panel {
  padding: 16px;
  width: 100%;
  max-width: 100%;
  min-width: 0;
  overflow: hidden;
  border: 1px solid var(--soft-border);
  border-radius: 20px;
  background:
    linear-gradient(180deg, rgba(255, 255, 255, 0.96), rgba(248, 250, 252, 0.92)),
    var(--soft-card);
  box-shadow: 0 16px 30px rgba(148, 163, 184, 0.1);
}

@media (max-width: 900px) {
  .soft-workspace__panel-toolbar {
    justify-content: flex-start;
  }

  .soft-workspace__panel {
    padding: 16px;
    border-radius: 18px;
  }
}
</style>
