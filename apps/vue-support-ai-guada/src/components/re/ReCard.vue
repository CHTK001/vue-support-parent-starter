<template>
  <div class="re-card" :class="{ 're-card--hoverable': hoverable }">
    <div v-if="title || $slots.header" class="re-card-header">
      <slot name="header">
        <span class="re-card-title">{{ title }}</span>
        <span v-if="subtitle" class="re-card-subtitle">{{ subtitle }}</span>
      </slot>
      <div v-if="$slots.extra" class="re-card-extra">
        <slot name="extra" />
      </div>
    </div>
    <div class="re-card-body">
      <slot />
    </div>
    <div v-if="$slots.footer" class="re-card-footer">
      <slot name="footer" />
    </div>
  </div>
</template>

<script setup lang="ts">
defineProps({
  title: { type: String, default: '' },
  subtitle: { type: String, default: '' },
  hoverable: { type: Boolean, default: false },
})
</script>

<style scoped>
.re-card {
  background: #ffffff;
  border-radius: 12px;
  border: 1px solid #e2e8f0;
  overflow: hidden;
  transition: all 0.2s ease;
}

.re-card--hoverable:hover {
  box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1);
  transform: translateY(-2px);
  border-color: #cbd5e1;
}

.re-card-header {
  padding: 16px 20px;
  border-bottom: 1px solid #f1f5f9;
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: linear-gradient(135deg, #fafbfc 0%, #ffffff 100%);
}

.re-card-title {
  font-size: 15px;
  font-weight: 600;
  color: #1e293b;
  letter-spacing: 0.01em;
}

.re-card-subtitle {
  font-size: 12px;
  color: #94a3b8;
  margin-left: 8px;
}

.re-card-extra {
  display: flex;
  align-items: center;
  gap: 8px;
}

.re-card-body {
  padding: 20px;
  color: #475569;
  line-height: 1.6;
}

.re-card-footer {
  padding: 12px 20px;
  border-top: 1px solid #f1f5f9;
  background: #fafbfc;
}
</style>
