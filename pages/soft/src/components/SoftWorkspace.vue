<template>
  <section class="soft-workspace">
    <header class="soft-workspace__header">
      <div class="soft-workspace__headline">
        <small>SOFT CONSOLE</small>
        <h2>{{ title }}</h2>
        <p v-if="subtitle">{{ subtitle }}</p>
      </div>
      <div v-if="$slots.actions" class="soft-workspace__header-actions">
        <slot name="actions" />
      </div>
    </header>

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
  --soft-border: rgba(15, 23, 42, 0.1);
  --soft-border-strong: rgba(15, 23, 42, 0.16);
  --soft-card: rgba(255, 255, 255, 0.9);
  --soft-card-strong: rgba(255, 255, 255, 0.96);
  --soft-title: #0f172a;
  --soft-text: #475569;
  --soft-muted: #64748b;
  --soft-accent: #0ea5e9;
  display: grid;
  gap: 14px;
  width: 100%;
  max-width: 100%;
  min-width: 0;
}

.soft-workspace__header {
  display: flex;
  justify-content: space-between;
  gap: 14px;
  align-items: flex-start;
  flex-wrap: wrap;
  padding: 18px 20px;
  border: 1px solid var(--soft-border);
  border-radius: 24px;
  background:
    radial-gradient(circle at top right, rgba(14, 165, 233, 0.14), transparent 34%),
    linear-gradient(135deg, rgba(255, 255, 255, 0.98), rgba(240, 249, 255, 0.86));
  box-shadow: 0 18px 34px rgba(15, 23, 42, 0.07);
}

.soft-workspace__headline {
  display: grid;
  gap: 6px;
}

.soft-workspace__headline small {
  color: var(--soft-accent);
  letter-spacing: 0.14em;
  font-size: 11px;
  font-weight: 700;
}

.soft-workspace__headline h2 {
  margin: 0;
  color: var(--soft-title);
  font-size: 24px;
  line-height: 1.2;
}

.soft-workspace__headline p {
  margin: 0;
  color: var(--soft-text);
  line-height: 1.6;
  font-size: 13px;
}

.soft-workspace__header-actions {
  display: inline-flex;
  justify-content: flex-end;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
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
  color: var(--soft-title);
  font-size: 20px;
  line-height: 1;
}

.soft-workspace__metric span {
  color: var(--soft-text);
  font-size: 12px;
}

.soft-workspace__metric small {
  color: var(--soft-muted);
  min-height: 16px;
  font-size: 11px;
}

.soft-workspace__panel {
  padding: 18px;
  width: 100%;
  max-width: 100%;
  min-width: 0;
  overflow: hidden;
  border: 1px solid var(--soft-border-strong);
  border-radius: 24px;
  background:
    linear-gradient(180deg, var(--soft-card-strong), rgba(248, 250, 252, 0.92)),
    var(--soft-card);
  box-shadow: 0 20px 38px rgba(148, 163, 184, 0.12);
}

:global(html.dark .soft-workspace),
:global(html[data-theme="dark"] .soft-workspace) {
  --soft-border: rgba(71, 85, 105, 0.36);
  --soft-border-strong: rgba(100, 116, 139, 0.46);
  --soft-card: rgba(15, 23, 42, 0.88);
  --soft-card-strong: rgba(15, 23, 42, 0.94);
  --soft-title: #e2e8f0;
  --soft-text: #cbd5e1;
  --soft-muted: #94a3b8;
  --soft-accent: #38bdf8;
}

:global(html.dark .soft-workspace__header),
:global(html[data-theme="dark"] .soft-workspace__header) {
  background:
    radial-gradient(circle at top right, rgba(56, 189, 248, 0.18), transparent 34%),
    linear-gradient(135deg, rgba(15, 23, 42, 0.96), rgba(15, 23, 42, 0.86));
  box-shadow: 0 22px 38px rgba(2, 6, 23, 0.35);
}

@media (max-width: 900px) {
  .soft-workspace__header {
    padding: 16px;
    border-radius: 20px;
  }

  .soft-workspace__header-actions {
    justify-content: flex-start;
  }

  .soft-workspace__panel {
    padding: 16px;
    border-radius: 18px;
  }
}
</style>
