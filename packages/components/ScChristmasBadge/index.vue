<template>
  <span class="sc-christmas-badge" :class="`sc-christmas-badge--${type}`">
    <span class="christmas-badge-icon" v-if="showIcon">🎄</span>
    <span class="christmas-badge-content">
      <slot></slot>
    </span>
  </span>
</template>

<script setup lang="ts">
defineProps<{
  type?: "primary" | "success" | "warning" | "info";
  showIcon?: boolean;
}>();
</script>

<style scoped>
.sc-christmas-badge {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 4px 12px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 500;
  transition: all 0.3s ease;
}

.sc-christmas-badge--primary {
  background: linear-gradient(135deg, #c41e3a 0%, #d03e54 100%);
  color: #fff;
  box-shadow: 0 2px 8px rgba(196, 30, 58, 0.3);
}

.sc-christmas-badge--success {
  background: linear-gradient(135deg, #0f8b8d 0%, #2c7a7b 100%);
  color: #fff;
  box-shadow: 0 2px 8px rgba(15, 139, 141, 0.3);
}

.sc-christmas-badge--warning {
  background: linear-gradient(135deg, #ffd700 0%, #f1c40f 100%);
  color: #0d1f1f;
  box-shadow: 0 2px 8px rgba(255, 215, 0, 0.3);
}

.sc-christmas-badge--info {
  background: rgba(255, 215, 0, 0.2);
  color: #ffd700;
  border: 1px solid rgba(255, 215, 0, 0.4);
}

.christmas-badge-icon {
  font-size: 14px;
  line-height: 1;
}

.christmas-badge-content {
  line-height: 1;
}
</style>
