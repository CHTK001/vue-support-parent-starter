<template>
  <div class="execution-card" @click="$emit('click')">
    <div class="execution-header">
      <div class="execution-info">
        <div class="script-name">
          <slot name="name">{{ name }}</slot>
        </div>
        <div class="execution-time">
          <slot name="time">{{ time }}</slot>
        </div>
      </div>
      <div class="execution-status">
        <slot name="status"></slot>
      </div>
    </div>

    <div class="execution-details">
      <div class="detail-row">
        <div class="detail-item">
          <IconifyIconOnline icon="ri:time-line" />
          <span>
            <slot name="duration">{{ duration }}</slot>
          </span>
        </div>
        <div class="detail-item">
          <IconifyIconOnline icon="ri:code-line" />
          <span>
            <slot name="exitCode">{{ exitCode }}</slot>
          </span>
        </div>
        <div class="detail-item">
          <IconifyIconOnline icon="ri:user-line" />
          <span>
            <slot name="user">{{ user }}</slot>
          </span>
        </div>
      </div>

      <div v-if="$slots.preview" class="output-preview">
        <div class="output-label">输出预览:</div>
        <div class="output-content">
          <slot name="preview"></slot>
        </div>
      </div>
    </div>

    <div class="execution-actions" @click.stop>
      <slot name="actions"></slot>
    </div>
  </div>
</template>

<script setup lang="ts">
interface Props {
  name?: string;
  time?: string;
  duration?: string;
  exitCode?: string | number;
  user?: string;
}

defineProps<Props>();
</script>

<style scoped lang="scss">
.execution-card {
  position: relative;
  border-radius: 16px;
  padding: 16px;
  background: rgba(255, 255, 255, 0.9);
  border: 1px solid rgba(226, 232, 240, 0.8);
  box-shadow: 0 10px 24px rgba(15, 23, 42, 0.06);
  transition: transform 0.25s ease, box-shadow 0.25s ease;
  cursor: pointer;

  &::before {
    content: "";
    position: absolute;
    inset: 0;
    border-radius: 16px;
    padding: 1px;
    background: linear-gradient(135deg, rgba(102, 126, 234, 0.25), rgba(118, 75, 162, 0.25));
    -webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
    -webkit-mask-composite: xor;
            mask-composite: exclude;
    pointer-events: none;
  }

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 12px 28px rgba(15, 23, 42, 0.10);
  }
}

.execution-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 8px;

  .script-name {
    font-size: 16px;
    font-weight: 700;
    color: #0f172a;
    background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 60%, #a855f7 100%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
    line-height: 1.2;
  }

  .execution-time {
    font-size: 12px;
    color: #64748b;
    background: rgba(100, 116, 139, 0.08);
    padding: 2px 8px;
    border-radius: 999px;
    white-space: nowrap;
  }
}

.execution-details {
  margin-top: 12px;

  .detail-row {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 8px 12px;
  }

  .detail-item {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    color: #334155;
    background: rgba(99, 102, 241, 0.06);
    padding: 8px 10px;
    border-radius: 10px;
  }

  .output-preview {
    margin-top: 12px;

    .output-label {
      font-size: 12px;
      color: #64748b;
      margin-bottom: 6px;
    }

    .output-content {
      font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", monospace;
      white-space: pre-wrap;
      background: #0b1220;
      color: #cbd5e1;
      border-radius: 12px;
      padding: 10px 12px;
      max-height: 120px;
      overflow: auto;
      box-shadow: inset 0 0 0 1px rgba(148, 163, 184, 0.15);
    }
  }
}

.execution-actions {
  margin-top: 12px;
  padding-top: 10px;
  border-top: 1px dashed rgba(226, 232, 240, 0.8);
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 8px;
}
</style>

